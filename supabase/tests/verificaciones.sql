-- ============================================================================
-- RE/MAX Potosí · verificaciones de negocio
-- ============================================================================
-- Requisitos:
--   * migraciones 0001–0010 aplicadas (0007 es opcional para estas pruebas);
--   * supabase/seed.sql ejecutado con las 3 cuentas demo.
--
-- Este archivo deja la base intacta: todo ocurre dentro de una transacción y
-- termina con ROLLBACK. Si una aserción falla, la transacción se aborta y no
-- se confirma nada.
--
-- Ejecutar:
--   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 \
--     -f supabase/tests/verificaciones.sql
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Precondiciones: usuarios demo y filas base
-- ---------------------------------------------------------------------------
do $$
begin
	if not exists (
		select 1 from auth.users
		where lower(email) = lower('carla.mendoza@remaxpotosi.bo')
	) or not exists (
		select 1 from auth.users
		where lower(email) = lower('luis.catari@gmail.com')
	) or not exists (
		select 1 from auth.users
		where lower(email) = lower('rodrigo.alvarez@remaxpotosi.bo')
	) then
		raise exception
			'Faltan las cuentas demo. Ejecuta pnpm db:seed-users y supabase/seed.sql antes de las pruebas.';
	end if;

	if not exists (
		select 1 from public.alquileres
		where id = '40000000-0000-4000-8000-000000000001'
	) then
		raise exception
			'Falta el alquiler demo RMX-2026-0001. Ejecuta supabase/seed.sql.';
	end if;
end
$$;

-- ============================================================================
-- 1. Cierre de alquiler: contrato + cuotas + pago + comisión + inmueble
-- ============================================================================
savepoint cierre_alquiler;

do $$
declare
	v_cliente uuid;
	v_vendedor uuid;
	v_precio numeric(12,2);
	v_comision numeric(12,2);
	v_alquiler uuid := '90000000-0000-4000-8000-000000000001';
	v_contrato text;
	v_cuotas integer;
	v_estado_cuota text;
	v_estado_inmueble public.estado_inmueble;
	v_monto_comision numeric(12,2);
begin
	select id into v_cliente
	from auth.users
	where lower(email) = lower('luis.catari@gmail.com')
	limit 1;

	select id into v_vendedor
	from auth.users
	where lower(email) = lower('carla.mendoza@remaxpotosi.bo')
	limit 1;

	select precio into v_precio
	from public.inmuebles
	where id = '20000000-0000-4000-8000-000000000001';

	select comision_fija into v_comision
	from public.vendedores
	where perfil_id = v_vendedor;

	-- El vendedor demo cierra su propio contrato.
	perform set_config('request.jwt.claim.sub', v_vendedor::text, true);
	perform set_config(
		'request.jwt.claims',
		json_build_object('sub', v_vendedor, 'role', 'authenticated')::text,
		true
	);

	perform public.registrar_alquiler(
		v_alquiler,
		v_cliente,
		v_vendedor,
		'20000000-0000-4000-8000-000000000001',
		v_precio,
		'2026-12-01T12:00:00-04:00'::timestamptz,
		12,
		v_alquiler::text || '/contrato.pdf',
		jsonb_build_object(
			'monto', v_precio,
			'medio', 'qr',
			'comprobante_path', v_alquiler::text || '/cierre.pdf'
		),
		v_precio,
		5::smallint
	);

	select numero_contrato into v_contrato
	from public.alquileres
	where id = v_alquiler;

	if v_contrato !~ '^RMX-[0-9]{4}-[0-9]{4}$' then
		raise exception 'Número de contrato inválido: %', v_contrato;
	end if;

	select count(*) into v_cuotas
	from public.cuotas
	where alquiler_id = v_alquiler;

	if v_cuotas <> 12 then
		raise exception 'Se esperaban 12 cuotas y se crearon %', v_cuotas;
	end if;

	select estado::text into v_estado_cuota
	from public.cuotas
	where alquiler_id = v_alquiler and numero = 1;

	if v_estado_cuota <> 'pagada' then
		raise exception 'La primera cuota debía quedar pagada; estado: %', v_estado_cuota;
	end if;

	if not exists (
		select 1
		from public.pagos
		where alquiler_id = v_alquiler
		  and tipo = 'cierre'
		  and monto = v_precio
		  and validado
	) then
		raise exception 'No se registró el pago de cierre esperado.';
	end if;

	select monto into v_monto_comision
	from public.comisiones
	where alquiler_id = v_alquiler;

	if v_monto_comision is distinct from v_comision then
		raise exception 'Comisión esperada % y registrada %', v_comision, v_monto_comision;
	end if;

	select estado into v_estado_inmueble
	from public.inmuebles
	where id = '20000000-0000-4000-8000-000000000001';

	if v_estado_inmueble <> 'en_alquiler' then
		raise exception 'El inmueble debía quedar en_alquiler; estado: %', v_estado_inmueble;
	end if;

	raise notice 'OK 1/9 · cierre de alquiler';
end
$$;

rollback to savepoint cierre_alquiler;

-- ============================================================================
-- 2. Pago de cuota: valida monto, marca pagada y deja comprobante
-- ============================================================================
savepoint pago_cuota;

do $$
declare
	v_cliente uuid;
	v_vendedor uuid;
	v_alquiler uuid := '40000000-0000-4000-8000-000000000001';
	v_cuota uuid;
	v_monto numeric(12,2);
	v_recargo numeric(12,2);
	v_total numeric(12,2);
	v_estado text;
	v_pago_validado boolean;
	v_pago_monto numeric(12,2);
begin
	select id into v_cliente
	from auth.users
	where lower(email) = lower('luis.catari@gmail.com')
	limit 1;

	select id into v_vendedor
	from auth.users
	where lower(email) = lower('carla.mendoza@remaxpotosi.bo')
	limit 1;

	select id, monto, recargo_mora
	into v_cuota, v_monto, v_recargo
	from public.cuotas
	where alquiler_id = v_alquiler and numero = 4;

	v_total := v_monto + greatest(
		v_recargo,
		coalesce(public.calcular_recargo_mora(v_cuota), 0)
	);

	perform set_config('request.jwt.claim.sub', v_vendedor::text, true);
	perform set_config(
		'request.jwt.claims',
		json_build_object('sub', v_vendedor, 'role', 'authenticated')::text,
		true
	);

	perform public.registrar_pago_cuota(
		v_alquiler,
		v_cuota,
		v_total,
		'qr',
		v_alquiler::text || '/comprobante-test.pdf',
		now(),
		null
	);

	select estado::text into v_estado
	from public.cuotas
	where id = v_cuota;

	if v_estado <> 'pagada' then
		raise exception 'La cuota debía quedar pagada; estado: %', v_estado;
	end if;

	select validado, monto
	into v_pago_validado, v_pago_monto
	from public.pagos
	where cuota_id = v_cuota;

	if not v_pago_validado then
		raise exception 'Un pago registrado por vendedor debe quedar validado.';
	end if;

	if v_pago_monto <> v_total then
		raise exception 'Monto del pago esperado % y registrado %', v_total, v_pago_monto;
	end if;

	raise notice 'OK 2/9 · pago de cuota';
end
$$;

rollback to savepoint pago_cuota;

-- ============================================================================
-- 3. Mora: 5 % tras la gracia, sin mora dentro de la gracia y sin duplicados
-- ============================================================================
savepoint mora;

do $$
declare
	v_alquiler uuid := '40000000-0000-4000-8000-000000000001';
	v_porcentaje numeric(5,2);
	v_cuota_mora uuid;
	v_cuota_gracia uuid;
	v_estado text;
	v_recargo numeric(12,2);
	v_avisos integer;
begin
	select recargo_mora_porcentaje into v_porcentaje
	from public.configuracion
	where id = 1;

	insert into public.cuotas (
		alquiler_id, numero, fecha_vencimiento, monto, recargo_mora, estado
	)
	values (
		v_alquiler, 99, now() - interval '10 days', 1000, 0, 'pendiente'
	)
	returning id into v_cuota_mora;

	insert into public.cuotas (
		alquiler_id, numero, fecha_vencimiento, monto, recargo_mora, estado
	)
	values (
		v_alquiler, 100, now() - interval '2 days', 1000, 0, 'pendiente'
	)
	returning id into v_cuota_gracia;

	perform public.actualizar_estado_cuotas();

	select estado::text, recargo_mora
	into v_estado, v_recargo
	from public.cuotas
	where id = v_cuota_mora;

	if v_estado <> 'en_mora' then
		raise exception 'La cuota vencida debía estar en_mora; estado: %', v_estado;
	end if;

	if v_recargo <> round(1000 * v_porcentaje / 100, 2) then
		raise exception 'Recargo esperado % y calculado %',
			round(1000 * v_porcentaje / 100, 2), v_recargo;
	end if;

	select estado::text, recargo_mora
	into v_estado, v_recargo
	from public.cuotas
	where id = v_cuota_gracia;

	if v_estado <> 'pendiente' or v_recargo <> 0 then
		raise exception 'Una cuota dentro de la gracia no debe tener mora (estado %, recargo %)',
			v_estado, v_recargo;
	end if;

	select count(*) into v_avisos
	from public.notificaciones
	where tipo = 'cuota_en_mora'
	  and referencia = v_cuota_mora::text;

	if v_avisos <> 1 then
		raise exception 'Se esperaba 1 aviso de mora y hay %', v_avisos;
	end if;

	-- Segunda corrida: no debe duplicar el aviso.
	perform public.actualizar_estado_cuotas();

	select count(*) into v_avisos
	from public.notificaciones
	where tipo = 'cuota_en_mora'
	  and referencia = v_cuota_mora::text;

	if v_avisos <> 1 then
		raise exception 'El job duplicó el aviso de mora: %', v_avisos;
	end if;

	raise notice 'OK 3/9 · mora y avisos';
end
$$;

rollback to savepoint mora;

-- ============================================================================
-- 4. Doble reserva de visita: misma franja ±1 h debe rechazarse
-- ============================================================================
savepoint doble_visita;

do $$
declare
	v_inmueble uuid := '20000000-0000-4000-8000-000000000001';
	v_fecha timestamptz := now() + interval '60 days';
	v_visitas integer;
begin
	-- Visitante anónimo: sin sub en el JWT.
	perform set_config('request.jwt.claim.sub', '', true);
	perform set_config('request.jwt.claims', '{"role":"anon"}', true);

	perform public.agendar_visita(
		v_inmueble,
		v_fecha,
		'Visitante de prueba',
		'+591 70000000',
		'visita.prueba@example.com',
		'Prueba de doble reserva',
		'web'
	);

	begin
		perform public.agendar_visita(
			v_inmueble,
			v_fecha + interval '30 minutes',
			'Otro visitante',
			'+591 71111111',
			'otro@example.com',
			'No debería crearse',
			'web'
		);

		raise exception 'La segunda visita en la misma franja no fue rechazada.';
	exception
		when unique_violation then
			-- 23505: correcto.
			null;
	end;

	select count(*) into v_visitas
	from public.visitas
	where inmueble_id = v_inmueble
	  and estado = 'pendiente'
	  and abs(extract(epoch from (fecha_hora - v_fecha))) < 3600;

	if v_visitas <> 1 then
		raise exception 'Se esperaba 1 visita pendiente en la franja y hay %', v_visitas;
	end if;

	raise notice 'OK 4/9 · doble reserva de visita';
end
$$;

rollback to savepoint doble_visita;

-- ============================================================================
-- 5. Protección de rol: un cliente no puede auto-promoverse
-- ============================================================================
savepoint proteccion_rol;

do $$
declare
	v_cliente uuid;
	v_rol public.rol_usuario;
begin
	select id into v_cliente
	from auth.users
	where lower(email) = lower('luis.catari@gmail.com')
	limit 1;

	perform set_config('request.jwt.claim.sub', v_cliente::text, true);
	perform set_config(
		'request.jwt.claims',
		json_build_object('sub', v_cliente, 'role', 'authenticated')::text,
		true
	);

	begin
		update public.perfiles
		set rol = 'vendedor'
		where id = v_cliente;

		raise exception 'El cambio de rol de cliente a vendedor no fue bloqueado.';
	exception
		when insufficient_privilege then
			-- 42501: correcto.
			null;
	end;

	select rol into v_rol
	from public.perfiles
	where id = v_cliente;

	if v_rol <> 'cliente' then
		raise exception 'El rol del cliente cambió a %; debía seguir siendo cliente.', v_rol;
	end if;

	raise notice 'OK 5/9 · protección de rol';
end
$$;

rollback to savepoint proteccion_rol;

-- ============================================================================
-- 6. Visitas: el cliente solo cancela; no edita otros campos
-- ============================================================================
savepoint visitas_cliente;

do $$
declare
	v_cliente uuid;
	v_visita uuid;
	v_notas text;
begin
	select id into v_cliente
	from auth.users
	where lower(email) = lower('luis.catari@gmail.com')
	limit 1;

	select id, notas into v_visita, v_notas
	from public.visitas
	where cliente_id = v_cliente
	  and estado = 'pendiente'
	limit 1;

	if v_visita is null then
		raise exception 'El cliente demo no tiene visitas pendientes para probar.';
	end if;

	perform set_config('request.jwt.claim.sub', v_cliente::text, true);
	perform set_config(
		'request.jwt.claims',
		json_build_object('sub', v_cliente, 'role', 'authenticated')::text,
		true
	);

	begin
		update public.visitas
		set notas = coalesce(v_notas, '') || ' cambio no permitido'
		where id = v_visita;
		raise exception 'El cliente pudo editar las notas de su visita.';
	exception
		when insufficient_privilege then
			null;
	end;

	begin
		update public.visitas
		set estado = 'realizada'
		where id = v_visita;
		raise exception 'El cliente pudo marcar su visita como realizada.';
	exception
		when insufficient_privilege then
			null;
	end;

	raise notice 'OK 6/9 · visitas: cliente solo puede cancelar';
end
$$;

rollback to savepoint visitas_cliente;

-- ============================================================================
-- 7. Visitas: el vendedor no puede reprogramar ni reasignar
-- ============================================================================
savepoint visitas_vendedor;

do $$
declare
	v_vendedor uuid;
	v_visita uuid;
begin
	select id into v_vendedor
	from auth.users
	where lower(email) = lower('carla.mendoza@remaxpotosi.bo')
	limit 1;

	select id into v_visita
	from public.visitas
	where vendedor_id = v_vendedor
	limit 1;

	if v_visita is null then
		raise exception 'El vendedor demo no tiene visitas para probar.';
	end if;

	perform set_config('request.jwt.claim.sub', v_vendedor::text, true);
	perform set_config(
		'request.jwt.claims',
		json_build_object('sub', v_vendedor, 'role', 'authenticated')::text,
		true
	);

	begin
		update public.visitas
		set fecha_hora = fecha_hora + interval '1 hour'
		where id = v_visita;
		raise exception 'El vendedor pudo reprogramar una visita.';
	exception
		when insufficient_privilege then
			null;
	end;

	begin
		update public.visitas
		set vendedor_id = null
		where id = v_visita;
		raise exception 'El vendedor pudo quitarse una visita asignada.';
	exception
		when insufficient_privilege then
			null;
	end;

	raise notice 'OK 7/9 · visitas: vendedor no reprograma ni reasigna';
end
$$;

rollback to savepoint visitas_vendedor;

-- ============================================================================
-- 8. Landing pública: agregados y equipo sin abrir tablas privadas
-- ============================================================================
savepoint resumen_publico;

do $$
declare
	v_resumen record;
	v_agentes integer;
begin
	select * into v_resumen from public.resumen_publico();
	v_agentes := (select count(*) from public.listar_agentes_publicos());

	if v_resumen.inmuebles_disponibles < 1
		or v_resumen.agentes_activos < 1
		or v_resumen.zonas_activas < 1
		or v_resumen.contratos_gestionados < 1
	then
		raise exception 'resumen_publico() devolvió ceros: %', row_to_json(v_resumen);
	end if;

	if v_agentes < 1 then
		raise exception 'listar_agentes_publicos() no devolvió agentes.';
	end if;

	raise notice 'OK 8/9 · landing pública con agregados reales';
end
$$;

rollback to savepoint resumen_publico;

-- ============================================================================
-- 9. Storage de inmuebles: escritura limitada al agente del inmueble
-- ============================================================================
savepoint storage_inmuebles;

do $$
declare
	v_vendedor uuid;
	v_inmueble uuid;
begin
	select perfil_id into v_vendedor
	from public.vendedores
	limit 1;

	select id into v_inmueble
	from public.inmuebles
	where agente_id = v_vendedor
	limit 1;

	if v_inmueble is null then
		raise exception 'El vendedor demo no tiene inmuebles asignados.';
	end if;

	perform set_config('request.jwt.claim.sub', v_vendedor::text, true);
	perform set_config(
		'request.jwt.claims',
		json_build_object('sub', v_vendedor, 'role', 'authenticated')::text,
		true
	);

	if not public.es_agente_de_archivo_inmueble(v_inmueble::text || '/foto.png') then
		raise exception 'El agente no pudo escribir en la carpeta de su inmueble.';
	end if;

	if public.es_agente_de_archivo_inmueble(
		'00000000-0000-4000-8000-000000000000/foto.png'
	) then
		raise exception 'El agente pudo escribir en un inmueble ajeno o inexistente.';
	end if;

	raise notice 'OK 9/9 · Storage de inmuebles limitado al agente';
end
$$;

rollback to savepoint storage_inmuebles;

-- Deja la base como estaba.
rollback;
