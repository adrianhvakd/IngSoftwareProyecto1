-- ============================================================================
-- RE/MAX Potosí · 0003 · Funciones, triggers y RPC
-- ============================================================================
-- Todas las funciones `security definer` fijan `search_path = ''` y califican
-- cada objeto con su esquema. Así se evita el ataque de search_path y se
-- garantiza que RLS no bloquee las lecturas internas de las políticas.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. updated_at automático
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
	new.updated_at := now();
	return new;
end;
$$;

comment on function public.set_updated_at() is
	'Mantiene updated_at al día en cada UPDATE.';

-- ---------------------------------------------------------------------------
-- 2. Perfil automático al crear un usuario en Supabase Auth
-- ---------------------------------------------------------------------------
-- Un auto-registro SIEMPRE nace como cliente. El rol solo se acepta desde
-- `raw_app_meta_data`, que únicamente puede escribir la service role/Admin API
-- (no el usuario final). La marca `creado_por_backend = true` lo hace explícito.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
	v_rol public.rol_usuario := 'cliente';
	v_nombres text;
	v_apellidos text;
	v_ci text;
	v_telefono text;
	v_avatar text;
	v_debe_cambiar boolean := false;
begin
	v_nombres := nullif(new.raw_user_meta_data ->> 'nombres', '');
	v_apellidos := coalesce(nullif(new.raw_user_meta_data ->> 'apellidos', ''), '');
	v_ci := nullif(new.raw_user_meta_data ->> 'ci', '');
	v_telefono := nullif(new.raw_user_meta_data ->> 'telefono', '');
	v_avatar := nullif(new.raw_user_meta_data ->> 'avatar_url', '');

	if v_nombres is null then
		v_nombres := coalesce(
			nullif(new.raw_user_meta_data ->> 'nombre_completo', ''),
			nullif(new.raw_user_meta_data ->> 'full_name', ''),
			split_part(coalesce(new.email, 'usuario'), '@', 1)
		);
	end if;

	-- Solo la service role puede marcar creado_por_backend.
	if coalesce(new.raw_app_meta_data ->> 'creado_por_backend', 'false') = 'true' then
		case new.raw_app_meta_data ->> 'rol'
			when 'administrador' then v_rol := 'administrador';
			when 'vendedor' then v_rol := 'vendedor';
			else v_rol := 'cliente';
		end case;
		v_debe_cambiar := coalesce(
			(new.raw_app_meta_data ->> 'debe_cambiar_password')::boolean,
			false
		);
	end if;

	insert into public.perfiles (
		id,
		nombres,
		apellidos,
		ci,
		telefono,
		correo,
		rol,
		activo,
		debe_cambiar_password,
		avatar_url
	)
	values (
		new.id,
		v_nombres,
		v_apellidos,
		v_ci,
		v_telefono,
		coalesce(new.email, new.id::text || '@pendiente.local'),
		v_rol,
		true,
		v_debe_cambiar,
		v_avatar
	)
	on conflict (id) do nothing;

	return new;
end;
$$;

comment on function public.handle_new_user() is
	'Crea el perfil al registrarse un usuario. Rol solo desde app_metadata de backend.';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
	after insert on auth.users
	for each row
	execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 3. Fila de cliente automática
-- ---------------------------------------------------------------------------
-- La UI de alquileres y visitas asume que todo perfil cliente tiene fila en
-- clientes. Se crea sola y se conserva si luego el perfil se promueve.
create or replace function public.crear_cliente_desde_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
	if new.rol = 'cliente' then
		insert into public.clientes (perfil_id, telefono_contacto)
		values (new.id, new.telefono)
		on conflict (perfil_id) do nothing;
	end if;
	return new;
end;
$$;

drop trigger if exists perfiles_cliente_automatico on public.perfiles;
create trigger perfiles_cliente_automatico
	after insert or update of rol on public.perfiles
	for each row
	execute function public.crear_cliente_desde_perfil();

-- ---------------------------------------------------------------------------
-- 4. Helpers de rol para RLS
-- ---------------------------------------------------------------------------
create or replace function public.current_rol()
returns public.rol_usuario
language sql
stable
security definer
set search_path = ''
as $$
	select p.rol
	from public.perfiles p
	where p.id = auth.uid()
	  and p.activo
	limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
	select coalesce(public.current_rol() = 'administrador', false);
$$;

comment on function public.current_rol() is
	'Rol del usuario autenticado; NULL si no hay sesión o está inactivo.';
comment on function public.is_admin() is
	'Atajo booleano para políticas RLS y RPC administrativas.';

-- ---------------------------------------------------------------------------
-- 5. Protección del rol
-- ---------------------------------------------------------------------------
-- Un cliente/vendedor no puede cambiarse el rol. Se permite auth.uid() NULL
-- para que la service role, las migraciones y los jobs internos operen.
create or replace function public.proteger_rol()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
	if new.rol is distinct from old.rol then
		if auth.uid() is not null and not public.is_admin() then
			raise exception 'Solo un administrador puede cambiar el rol de un perfil.'
				using errcode = '42501';
		end if;
	end if;
	return new;
end;
$$;

drop trigger if exists perfiles_proteger_rol on public.perfiles;
create trigger perfiles_proteger_rol
	before update of rol on public.perfiles
	for each row
	execute function public.proteger_rol();

-- ---------------------------------------------------------------------------
-- 6. Promoción atómica a vendedor
-- ---------------------------------------------------------------------------
create or replace function public.promover_a_vendedor(
	p_perfil_id uuid,
	p_comision numeric,
	p_cargo text default null,
	p_zona_principal_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
	if auth.uid() is not null and not public.is_admin() then
		raise exception 'Solo un administrador puede promover vendedores.'
			using errcode = '42501';
	end if;

	if p_comision is null or p_comision < 0 then
		raise exception 'La comisión fija debe ser mayor o igual a cero.'
			using errcode = '22023';
	end if;

	if not exists (select 1 from public.perfiles p where p.id = p_perfil_id) then
		raise exception 'El perfil % no existe.', p_perfil_id
			using errcode = '23503';
	end if;

	update public.perfiles
	set rol = 'vendedor'
	where id = p_perfil_id;

	insert into public.vendedores (
		perfil_id,
		comision_fija,
		cargo,
		zona_principal_id,
		activo
	)
	values (
		p_perfil_id,
		p_comision,
		p_cargo,
		p_zona_principal_id,
		true
	)
	on conflict (perfil_id) do update
	set comision_fija = excluded.comision_fija,
		cargo = coalesce(excluded.cargo, public.vendedores.cargo),
		zona_principal_id = coalesce(excluded.zona_principal_id, public.vendedores.zona_principal_id),
		activo = true,
		updated_at = now();
end;
$$;

comment on function public.promover_a_vendedor(uuid, numeric, text, uuid) is
	'Cambia el rol y crea/actualiza la fila de vendedor en una sola transacción.';

-- ---------------------------------------------------------------------------
-- 7. Validación del vendedor asignado a una visita
-- ---------------------------------------------------------------------------
create or replace function public.validar_vendedor_visita()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
	if new.vendedor_id is not null then
		if not exists (
			select 1
			from public.vendedores v
			join public.perfiles p on p.id = v.perfil_id
			where v.perfil_id = new.vendedor_id
			  and v.activo
			  and p.activo
			  and p.rol = 'vendedor'
		) then
			raise exception 'El vendedor % no existe, está inactivo o no tiene rol vendedor.', new.vendedor_id
				using errcode = '23514';
		end if;
	end if;
	return new;
end;
$$;

drop trigger if exists visitas_validar_vendedor on public.visitas;
create trigger visitas_validar_vendedor
	before insert or update of vendedor_id on public.visitas
	for each row
	execute function public.validar_vendedor_visita();

-- ---------------------------------------------------------------------------
-- 8. Agendar visita (público y autenticado)
-- ---------------------------------------------------------------------------
-- Es la única puerta de entrada para visitas anónimas. Valida disponibilidad,
-- evita solapes de ±1 hora y serializa por inmueble con un advisory lock.
create or replace function public.agendar_visita(
	p_inmueble_id uuid,
	p_fecha_hora timestamptz,
	p_nombre text default null,
	p_telefono text default null,
	p_correo text default null,
	p_notas text default null,
	p_canal public.canal_visita default 'web',
	p_cliente_id uuid default null,
	p_vendedor_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
	v_inmueble public.inmuebles%rowtype;
	v_cliente_id uuid := p_cliente_id;
	v_rol public.rol_usuario;
	v_nombre text := nullif(trim(p_nombre), '');
	v_telefono text := nullif(trim(p_telefono), '');
	v_correo text := nullif(trim(p_correo), '');
	v_visita_id uuid;
begin
	-- Serializa reservas del mismo inmueble para que dos visitas simultáneas
	-- no pasen ambas la validación de solape.
	perform pg_advisory_xact_lock(hashtextextended(p_inmueble_id::text, 0));

	select *
	into v_inmueble
	from public.inmuebles
	where id = p_inmueble_id;

	if not found then
		raise exception 'El inmueble % no existe.', p_inmueble_id
			using errcode = '23503';
	end if;

	if v_inmueble.estado <> 'disponible' then
		raise exception 'El inmueble no está disponible para visitas.'
			using errcode = '23514';
	end if;

	if p_fecha_hora < now() - interval '5 minutes' then
		raise exception 'La fecha de la visita ya pasó.'
			using errcode = '22007';
	end if;

	if exists (
		select 1
		from public.visitas v
		where v.inmueble_id = p_inmueble_id
		  and v.estado = 'pendiente'
		  and abs(extract(epoch from (v.fecha_hora - p_fecha_hora))) < 3600
	) then
		raise exception 'Ya existe una visita pendiente para ese inmueble en esa franja horaria.'
			using errcode = '23505';
	end if;

	-- Un visitante anónimo no puede elegir un cliente existente.
	if auth.uid() is null then
		v_cliente_id := null;
	else
		v_rol := public.current_rol();

		if v_rol is null then
			raise exception 'La sesión no tiene un perfil activo.'
				using errcode = '42501';
		end if;

		-- Un cliente solo agenda para sí mismo. Admin/vendedor pueden usar
		-- p_cliente_id para agendar en nombre de un cliente.
		if v_rol = 'cliente' then
			v_cliente_id := auth.uid();
		end if;
	end if;

	if v_cliente_id is not null then
		if not exists (
			select 1 from public.clientes c where c.perfil_id = v_cliente_id
		) then
			raise exception 'El cliente % no existe.', v_cliente_id
				using errcode = '23503';
		end if;

		select
			coalesce(v_nombre, p.nombres || ' ' || p.apellidos),
			coalesce(v_telefono, p.telefono),
			coalesce(v_correo, p.correo)
		into v_nombre, v_telefono, v_correo
		from public.perfiles p
		where p.id = v_cliente_id;
	end if;

	if v_cliente_id is null then
		if v_nombre is null or v_telefono is null or v_correo is null then
			raise exception 'Nombre, teléfono y correo son obligatorios para agendar sin cuenta.'
				using errcode = '23502';
		end if;
	end if;

	insert into public.visitas (
		inmueble_id,
		cliente_id,
		nombre_contacto,
		telefono_contacto,
		correo_contacto,
		vendedor_id,
		fecha_hora,
		estado,
		canal,
		notas
	)
	values (
		p_inmueble_id,
		v_cliente_id,
		v_nombre,
		v_telefono,
		v_correo,
		coalesce(p_vendedor_id, v_inmueble.agente_id),
		p_fecha_hora,
		'pendiente',
		coalesce(p_canal, 'web'),
		coalesce(p_notas, '')
	)
	returning id into v_visita_id;

	return v_visita_id;
end;
$$;

comment on function public.agendar_visita(uuid, timestamptz, text, text, text, text, public.canal_visita, uuid, uuid) is
	'RPC pública para agendar visitas; valida disponibilidad, contacto y solapes.';

-- ---------------------------------------------------------------------------
-- 9. Número de contrato secuencial por año
-- ---------------------------------------------------------------------------
create or replace function public.siguiente_numero_contrato(p_anio integer default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
	v_anio integer := coalesce(
		p_anio,
		extract(year from (now() at time zone 'America/La_Paz'))::integer
	);
	v_ultimo integer;
begin
	insert into public.contador_contratos (anio, ultimo)
	values (v_anio, 1)
	on conflict (anio) do update
	set ultimo = public.contador_contratos.ultimo + 1,
		updated_at = now()
	returning ultimo into v_ultimo;

	return format('RMX-%s-%s', v_anio, lpad(v_ultimo::text, 4, '0'));
end;
$$;

comment on function public.siguiente_numero_contrato(integer) is
	'Genera RMX-YYYY-0001 de forma atómica usando un contador por año.';

-- ---------------------------------------------------------------------------
-- 10. Recargo por mora y actualización diaria de cuotas
-- ---------------------------------------------------------------------------
create or replace function public.calcular_recargo_mora(p_cuota_id uuid)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
	select case
		when c.estado in ('pagada', 'anulada') then 0::numeric
		when (now() at time zone 'America/La_Paz')::date
			> ((c.fecha_vencimiento at time zone 'America/La_Paz')::date + cfg.dias_gracia)
			then round(c.monto * cfg.recargo_mora_porcentaje / 100, 2)
		else 0::numeric
	end
	from public.cuotas c
	join public.alquileres a on a.id = c.alquiler_id and a.estado = 'vigente'
	cross join public.configuracion cfg
	where c.id = p_cuota_id
	  and cfg.id = 1;
$$;

comment on function public.calcular_recargo_mora(uuid) is
	'Recargo único (porcentaje configurado) si la cuota superó la fecha de vencimiento + días de gracia.';

create or replace function public.actualizar_estado_cuotas()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
	v_cfg public.configuracion%rowtype;
	v_hoy date := (now() at time zone 'America/La_Paz')::date;
	v_fila record;
	v_venc date;
	v_recargo numeric(12,2);
begin
	select *
	into v_cfg
	from public.configuracion
	where id = 1;

	if not found then
		return;
	end if;

	for v_fila in
		select
			c.id,
			c.numero,
			c.fecha_vencimiento,
			c.estado,
			a.cliente_id,
			a.numero_contrato
		from public.cuotas c
		join public.alquileres a on a.id = c.alquiler_id
		where a.estado = 'vigente'
		  and c.estado in ('pendiente', 'en_mora')
	loop
		v_venc := (v_fila.fecha_vencimiento at time zone 'America/La_Paz')::date;

		if v_hoy > v_venc + v_cfg.dias_gracia then
			v_recargo := coalesce(public.calcular_recargo_mora(v_fila.id), 0);

			update public.cuotas
			set estado = 'en_mora',
				recargo_mora = v_recargo
			where id = v_fila.id
			  and estado <> 'pagada';

			insert into public.notificaciones (
				perfil_id,
				tipo,
				titulo,
				mensaje,
				referencia
			)
			values (
				v_fila.cliente_id,
				'cuota_en_mora',
				'Cuota en mora',
				format(
					'La cuota %s del contrato %s venció el %s y está en mora.',
					v_fila.numero,
					v_fila.numero_contrato,
					to_char(v_venc, 'DD/MM/YYYY')
				),
				v_fila.id::text
			)
			on conflict do nothing;
		else
			-- Si el estado se había marcado en mora por error, se corrige.
			if v_fila.estado = 'en_mora' then
				update public.cuotas
				set estado = 'pendiente',
					recargo_mora = 0
				where id = v_fila.id;
			end if;

			if v_hoy >= v_venc - v_cfg.dias_aviso_previo then
				insert into public.notificaciones (
					perfil_id,
					tipo,
					titulo,
					mensaje,
					referencia
				)
				values (
					v_fila.cliente_id,
					'cuota_por_vencer',
					'Cuota por vencer',
					format(
						'La cuota %s del contrato %s vence el %s.',
						v_fila.numero,
						v_fila.numero_contrato,
						to_char(v_venc, 'DD/MM/YYYY')
					),
					v_fila.id::text
				)
				on conflict do nothing;
			end if;
		end if;
	end loop;
end;
$$;

comment on function public.actualizar_estado_cuotas() is
	'Job diario: marca mora, recalcula recargo y crea avisos sin duplicarlos.';

-- ---------------------------------------------------------------------------
-- 11. Cierre atómico de alquiler
-- ---------------------------------------------------------------------------
create or replace function public.registrar_alquiler(
	p_alquiler_id uuid,
	p_cliente_id uuid,
	p_vendedor_id uuid,
	p_inmueble_id uuid,
	p_monto_mensual numeric,
	p_fecha_inicio timestamptz,
	p_duracion_meses integer,
	p_contrato_path text,
	p_pago_cierre jsonb,
	p_deposito numeric default 0,
	p_dia_cobro smallint default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
	v_inmueble public.inmuebles%rowtype;
	v_comision numeric(12,2);
	v_numero_contrato text;
	v_fecha_inicio_local timestamp;
	v_fecha_fin timestamptz;
	v_primera_venc timestamptz;
	v_venc timestamptz;
	v_dia_cobro smallint;
	v_i integer;
	v_cuota_id uuid;
	v_primera_cuota_id uuid;
	v_monto_pago numeric(12,2);
	v_medio public.medio_pago;
	v_comprobante text;
	v_pago_cuota_id uuid;
begin
	-- Permisos: administrador, o el vendedor dueño del cierre. auth.uid()
	-- NULL corresponde a service role / backend.
	if auth.uid() is not null then
		if public.is_admin() then
			null;
		elsif public.current_rol() = 'vendedor' and auth.uid() = p_vendedor_id then
			null;
		else
			raise exception 'No tienes permisos para cerrar este alquiler.'
				using errcode = '42501';
		end if;
	end if;

	if p_pago_cierre is null or (p_pago_cierre ->> 'monto') is null then
		raise exception 'El pago de cierre es obligatorio.'
			using errcode = '22023';
	end if;

	v_monto_pago := (p_pago_cierre ->> 'monto')::numeric;
	v_medio := coalesce((p_pago_cierre ->> 'medio')::public.medio_pago, 'efectivo');
	v_comprobante := nullif(p_pago_cierre ->> 'comprobante_path', '');

	if v_monto_pago is null or v_monto_pago <= 0 then
		raise exception 'El monto del pago de cierre debe ser mayor a cero.'
			using errcode = '22023';
	end if;

	-- Se bloquea el inmueble para que dos cierres concurrentes no lo tomen.
	select *
	into v_inmueble
	from public.inmuebles
	where id = p_inmueble_id
	for update;

	if not found then
		raise exception 'El inmueble % no existe.', p_inmueble_id
			using errcode = '23503';
	end if;

	if v_inmueble.estado <> 'disponible' then
		raise exception 'El inmueble no está disponible para un nuevo contrato.'
			using errcode = '23514';
	end if;

	if not exists (
		select 1
		from public.clientes c
		join public.perfiles p on p.id = c.perfil_id
		where c.perfil_id = p_cliente_id
		  and p.activo
	) then
		raise exception 'El cliente % no existe o está inactivo.', p_cliente_id
			using errcode = '23503';
	end if;

	select v.comision_fija
	into v_comision
	from public.vendedores v
	where v.perfil_id = p_vendedor_id
	  and v.activo;

	if not found then
		raise exception 'El vendedor % no existe o está inactivo.', p_vendedor_id
			using errcode = '23503';
	end if;

	if p_duracion_meses is null or p_duracion_meses not between 1 and 120 then
		raise exception 'La duración debe estar entre 1 y 120 meses.'
			using errcode = '22023';
	end if;

	if p_monto_mensual is null or p_monto_mensual <= 0 then
		raise exception 'El monto mensual debe ser mayor a cero.'
			using errcode = '22023';
	end if;

	-- `dia_cobro` viene de la UI (1..28). Si no llega, se toma del día de
	-- inicio, acotado a 28 para evitar meses sin ese día.
	v_dia_cobro := coalesce(
		p_dia_cobro,
		extract(day from p_fecha_inicio at time zone 'America/La_Paz')::smallint
	);
	v_dia_cobro := least(greatest(v_dia_cobro, 1), 28)::smallint;

	v_fecha_inicio_local := p_fecha_inicio at time zone 'America/La_Paz';
	v_fecha_fin := (
		(v_fecha_inicio_local + make_interval(months => p_duracion_meses))
		- interval '1 day'
	) at time zone 'America/La_Paz';

	v_numero_contrato := public.siguiente_numero_contrato(
		extract(year from v_fecha_inicio_local)::integer
	);

	insert into public.alquileres (
		id,
		numero_contrato,
		inmueble_id,
		cliente_id,
		vendedor_id,
		fecha_inicio,
		fecha_fin,
		duracion_meses,
		monto_mensual,
		dia_cobro,
		deposito,
		estado,
		contrato_path
	)
	values (
		p_alquiler_id,
		v_numero_contrato,
		p_inmueble_id,
		p_cliente_id,
		p_vendedor_id,
		p_fecha_inicio,
		v_fecha_fin,
		p_duracion_meses,
		p_monto_mensual,
		v_dia_cobro,
		coalesce(p_deposito, 0),
		'vigente',
		nullif(p_contrato_path, '')
	);

	-- Primera cuota: el día de cobro del mes de inicio. Si el inicio ya pasó
	-- ese día, la primera vence el mes siguiente.
	v_primera_venc := (
		date_trunc('month', v_fecha_inicio_local)
		+ make_interval(days => v_dia_cobro - 1)
	) at time zone 'America/La_Paz';

	if v_primera_venc < p_fecha_inicio then
		v_primera_venc := (
			date_trunc('month', v_fecha_inicio_local + interval '1 month')
			+ make_interval(days => v_dia_cobro - 1)
		) at time zone 'America/La_Paz';
	end if;

	for v_i in 1..p_duracion_meses loop
		v_venc := (
			(v_primera_venc at time zone 'America/La_Paz')
			+ make_interval(months => v_i - 1)
		) at time zone 'America/La_Paz';

		insert into public.cuotas (
			alquiler_id,
			numero,
			fecha_vencimiento,
			monto,
			recargo_mora,
			estado
		)
		values (
			p_alquiler_id,
			v_i,
			v_venc,
			p_monto_mensual,
			0,
			'pendiente'
		)
		returning id into v_cuota_id;

		if v_i = 1 then
			v_primera_cuota_id := v_cuota_id;
		end if;
	end loop;

	-- Pago de cierre. Si cubre la primera cuota (y su recargo, si el contrato
	-- se backdateó) se enlaza para que el trigger de pagos la marque pagada;
	-- si no, queda como cobro independiente y la cuota sigue pendiente.
	v_pago_cuota_id := case
		when v_monto_pago >= p_monto_mensual
			+ coalesce(public.calcular_recargo_mora(v_primera_cuota_id), 0)
			then v_primera_cuota_id
		else null
	end;

	insert into public.pagos (
		alquiler_id,
		cuota_id,
		tipo,
		monto,
		medio,
		fecha_pago,
		comprobante_path,
		registrado_por,
		validado
	)
	values (
		p_alquiler_id,
		v_pago_cuota_id,
		'cierre',
		v_monto_pago,
		v_medio,
		now(),
		v_comprobante,
		coalesce(auth.uid(), p_vendedor_id),
		true
	);

	-- Snapshot de la comisión fija: si luego cambia la tarifa del vendedor,
	-- esta comisión histórica no se altera.
	insert into public.comisiones (
		vendedor_id,
		alquiler_id,
		monto,
		fecha,
		estado
	)
	values (
		p_vendedor_id,
		p_alquiler_id,
		v_comision,
		now(),
		'pendiente'
	);

	update public.inmuebles
	set estado = 'en_alquiler'
	where id = p_inmueble_id;

	insert into public.notificaciones (
		perfil_id,
		tipo,
		titulo,
		mensaje,
		referencia
	)
	values (
		p_cliente_id,
		'alquiler_cerrado',
		'Alquiler registrado',
		format(
			'Se registró tu contrato %s para el inmueble %s.',
			v_numero_contrato,
			v_inmueble.codigo
		),
		p_alquiler_id::text
	)
	on conflict do nothing;

	return p_alquiler_id;
end;
$$;

comment on function public.registrar_alquiler(uuid, uuid, uuid, uuid, numeric, timestamptz, integer, text, jsonb, numeric, smallint) is
	'Cierre atómico: alquiler + cuotas + pago de cierre + comisión + estado del inmueble.';

-- ---------------------------------------------------------------------------
-- 12. Liberación del inmueble al finalizar/cancelar
-- ---------------------------------------------------------------------------
create or replace function public.alquiler_estado_cambiado()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
	if new.estado is not distinct from old.estado then
		return new;
	end if;

	if new.estado in ('finalizado', 'cancelado') then
		-- El inmueble vuelve al catálogo salvo que esté inactivo.
		update public.inmuebles
		set estado = 'disponible'
		where id = new.inmueble_id
		  and estado <> 'inactivo';

		-- Se anulan las cuotas no cobradas para no seguir generando mora.
		update public.cuotas
		set estado = 'anulada',
			recargo_mora = 0
		where alquiler_id = new.id
		  and estado in ('pendiente', 'en_mora');
	elsif new.estado = 'vigente' then
		update public.inmuebles
		set estado = 'en_alquiler'
		where id = new.inmueble_id
		  and estado <> 'inactivo';
	end if;

	return new;
end;
$$;

drop trigger if exists alquileres_estado_cambiado on public.alquileres;
create trigger alquileres_estado_cambiado
	after update of estado on public.alquileres
	for each row
	execute function public.alquiler_estado_cambiado();

-- ---------------------------------------------------------------------------
-- 13. Pagos: validación y aplicación
-- ---------------------------------------------------------------------------
create or replace function public.validar_pago()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
	v_cuota public.cuotas%rowtype;
	v_estado_alquiler public.estado_alquiler;
	v_esperado numeric(12,2);
begin
	if new.cuota_id is null then
		return new;
	end if;

	select *
	into v_cuota
	from public.cuotas
	where id = new.cuota_id
	for update;

	if not found then
		raise exception 'La cuota % no existe.', new.cuota_id
			using errcode = '23503';
	end if;

	if v_cuota.alquiler_id <> new.alquiler_id then
		raise exception 'La cuota no pertenece al alquiler indicado.'
			using errcode = '23514';
	end if;

	if v_cuota.estado = 'pagada' then
		raise exception 'La cuota % ya está pagada.', v_cuota.numero
			using errcode = '23505';
	end if;

	if v_cuota.estado = 'anulada' then
		raise exception 'La cuota % fue anulada.', v_cuota.numero
			using errcode = '23514';
	end if;

	select a.estado
	into v_estado_alquiler
	from public.alquileres a
	where a.id = v_cuota.alquiler_id;

	if v_estado_alquiler <> 'vigente' then
		raise exception 'No se pueden registrar pagos sobre un alquiler no vigente.'
			using errcode = '23514';
	end if;

	v_esperado := v_cuota.monto + greatest(
		v_cuota.recargo_mora,
		coalesce(public.calcular_recargo_mora(v_cuota.id), 0)
	);

	if new.monto < v_esperado then
		raise exception 'El pago es insuficiente: se esperaban Bs % y llegaron Bs %.',
			v_esperado, new.monto
			using errcode = '23514';
	end if;

	return new;
end;
$$;

drop trigger if exists pagos_validar on public.pagos;
create trigger pagos_validar
	before insert or update of alquiler_id, cuota_id, monto, tipo on public.pagos
	for each row
	execute function public.validar_pago();

create or replace function public.aplicar_pago()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
	v_cliente_id uuid;
	v_numero_contrato text;
begin
	if new.cuota_id is not null then
		update public.cuotas
		set estado = 'pagada',
			recargo_mora = greatest(
				recargo_mora,
				coalesce(public.calcular_recargo_mora(new.cuota_id), 0)
			)
		where id = new.cuota_id
		  and estado <> 'pagada';
	end if;

	select a.cliente_id, a.numero_contrato
	into v_cliente_id, v_numero_contrato
	from public.alquileres a
	where a.id = new.alquiler_id;

	insert into public.notificaciones (
		perfil_id,
		tipo,
		titulo,
		mensaje,
		referencia
	)
	values (
		v_cliente_id,
		'pago_registrado',
		'Pago registrado',
		format('Se registró un pago de Bs %s para el contrato %s.', new.monto, v_numero_contrato),
		new.id::text
	)
	on conflict do nothing;

	return null;
end;
$$;

drop trigger if exists pagos_aplicar on public.pagos;
create trigger pagos_aplicar
	after insert on public.pagos
	for each row
	execute function public.aplicar_pago();

-- ---------------------------------------------------------------------------
-- 14. RPC de cobro de cuota
-- ---------------------------------------------------------------------------
create or replace function public.registrar_pago_cuota(
	p_alquiler_id uuid,
	p_cuota_id uuid,
	p_monto numeric,
	p_medio public.medio_pago,
	p_comprobante_path text default null,
	p_fecha_pago timestamptz default now(),
	p_registrado_por uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
	v_cuota public.cuotas%rowtype;
	v_estado public.estado_alquiler;
	v_rol public.rol_usuario;
	v_registrado_por uuid;
	v_validado boolean;
	v_pago_id uuid;
begin
	select *
	into v_cuota
	from public.cuotas
	where id = p_cuota_id
	for update;

	if not found then
		raise exception 'La cuota % no existe.', p_cuota_id
			using errcode = '23503';
	end if;

	if v_cuota.alquiler_id <> p_alquiler_id then
		raise exception 'La cuota no pertenece al alquiler indicado.'
			using errcode = '23514';
	end if;

	select a.estado
	into v_estado
	from public.alquileres a
	where a.id = p_alquiler_id;

	if v_estado is null then
		raise exception 'El alquiler % no existe.', p_alquiler_id
			using errcode = '23503';
	end if;

	-- Permisos: admin, vendedor del alquiler o cliente del alquiler.
	if auth.uid() is not null then
		v_rol := public.current_rol();

		if public.is_admin() then
			null;
		elsif v_rol = 'vendedor' and exists (
			select 1 from public.alquileres a
			where a.id = p_alquiler_id and a.vendedor_id = auth.uid()
		) then
			null;
		elsif v_rol = 'cliente' and exists (
			select 1 from public.alquileres a
			where a.id = p_alquiler_id and a.cliente_id = auth.uid()
		) then
			null;
		else
			raise exception 'No tienes permisos para registrar este pago.'
				using errcode = '42501';
		end if;
	end if;

	-- `p_registrado_por` no es un dato confiable para un cliente/vendedor:
	-- solo un administrador o la service role pueden registrar a nombre de otro.
	if p_registrado_por is not null
		and auth.uid() is not null
		and not public.is_admin()
		and p_registrado_por <> auth.uid() then
		raise exception 'No puedes atribuir el pago a otro usuario.'
			using errcode = '42501';
	end if;

	v_registrado_por := coalesce(p_registrado_por, auth.uid());
	v_validado := auth.uid() is null
		or public.is_admin()
		or v_rol = 'vendedor';

	insert into public.pagos (
		alquiler_id,
		cuota_id,
		tipo,
		monto,
		medio,
		fecha_pago,
		comprobante_path,
		registrado_por,
		validado
	)
	values (
		p_alquiler_id,
		p_cuota_id,
		'cuota',
		p_monto,
		p_medio,
		coalesce(p_fecha_pago, now()),
		nullif(p_comprobante_path, ''),
		v_registrado_por,
		v_validado
	)
	returning id into v_pago_id;

	return v_pago_id;
end;
$$;

comment on function public.registrar_pago_cuota(uuid, uuid, numeric, public.medio_pago, text, timestamptz, uuid) is
	'Cobra una cuota, valida monto/estado y delega el marcado al trigger de pagos.';

-- ---------------------------------------------------------------------------
-- 15. Cambio controlado de estado de inmueble
-- ---------------------------------------------------------------------------
create or replace function public.cambiar_estado_inmueble(
	p_id uuid,
	p_estado public.estado_inmueble
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
	v_inmueble public.inmuebles%rowtype;
begin
	if auth.uid() is not null and not public.is_admin() then
		raise exception 'Solo un administrador puede cambiar el estado de un inmueble.'
			using errcode = '42501';
	end if;

	select *
	into v_inmueble
	from public.inmuebles
	where id = p_id
	for update;

	if not found then
		raise exception 'El inmueble % no existe.', p_id
			using errcode = '23503';
	end if;

	if p_estado in ('disponible', 'inactivo') and exists (
		select 1
		from public.alquileres a
		where a.inmueble_id = p_id
		  and a.estado = 'vigente'
	) then
		raise exception 'No se puede pasar a % porque el inmueble tiene un alquiler vigente.', p_estado
			using errcode = '23514';
	end if;

	update public.inmuebles
	set estado = p_estado
	where id = p_id;
end;
$$;

comment on function public.cambiar_estado_inmueble(uuid, public.estado_inmueble) is
	'Solo admin; bloquea disponible/inactivo si hay contrato vigente.';

-- ---------------------------------------------------------------------------
-- 16. Auditoría
-- ---------------------------------------------------------------------------
create or replace function public.auditar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
	v_anterior jsonb;
	v_nuevo jsonb;
	v_registro_id text;
begin
	if tg_op in ('INSERT', 'UPDATE') then
		v_nuevo := to_jsonb(new);
	end if;

	if tg_op in ('UPDATE', 'DELETE') then
		v_anterior := to_jsonb(old);
	end if;

	v_registro_id := coalesce(
		v_nuevo ->> 'id',
		v_anterior ->> 'id',
		v_nuevo ->> 'perfil_id',
		v_anterior ->> 'perfil_id',
		'desconocido'
	);

	insert into public.auditoria (
		tabla,
		registro_id,
		accion,
		datos_anteriores,
		datos_nuevos,
		actor_id,
		fecha
	)
	values (
		tg_table_name,
		v_registro_id,
		tg_op,
		v_anterior,
		v_nuevo,
		auth.uid(),
		now()
	);

	return null;
end;
$$;

drop trigger if exists inmuebles_auditar on public.inmuebles;
create trigger inmuebles_auditar
	after insert or update or delete on public.inmuebles
	for each row
	execute function public.auditar();

drop trigger if exists alquileres_auditar on public.alquileres;
create trigger alquileres_auditar
	after insert or update or delete on public.alquileres
	for each row
	execute function public.auditar();

drop trigger if exists pagos_auditar on public.pagos;
create trigger pagos_auditar
	after insert or update or delete on public.pagos
	for each row
	execute function public.auditar();

-- Solo cambios de rol en perfiles.
drop trigger if exists perfiles_auditar on public.perfiles;
create trigger perfiles_auditar
	after update of rol on public.perfiles
	for each row
	when (old.rol is distinct from new.rol)
	execute function public.auditar();

-- Solo cambios de comisión en vendedores.
drop trigger if exists vendedores_auditar on public.vendedores;
create trigger vendedores_auditar
	after update of comision_fija on public.vendedores
	for each row
	when (old.comision_fija is distinct from new.comision_fija)
	execute function public.auditar();

-- ---------------------------------------------------------------------------
-- 17. updated_at en todas las tablas
-- ---------------------------------------------------------------------------
do $$
declare
	v_tabla text;
begin
	foreach v_tabla in array array[
		'perfiles',
		'vendedores',
		'clientes',
		'proveedores',
		'zonas',
		'inmuebles',
		'inmueble_imagenes',
		'visitas',
		'alquileres',
		'cuotas',
		'pagos',
		'comisiones',
		'notificaciones',
		'configuracion',
		'auditoria',
		'contador_contratos'
	]
	loop
		execute format(
			'drop trigger if exists %I on public.%I',
			'trg_' || v_tabla || '_updated_at',
			v_tabla
		);
		execute format(
			'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
			'trg_' || v_tabla || '_updated_at',
			v_tabla
		);
	end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- 18. Permisos de ejecución
-- ---------------------------------------------------------------------------
-- Por defecto PostgreSQL da EXECUTE a PUBLIC; se revoca y se otorga lo mínimo.
revoke all on function public.current_rol() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.calcular_recargo_mora(uuid) from public;
revoke all on function public.agendar_visita(uuid, timestamptz, text, text, text, text, public.canal_visita, uuid, uuid) from public;
revoke all on function public.promover_a_vendedor(uuid, numeric, text, uuid) from public;
revoke all on function public.registrar_alquiler(uuid, uuid, uuid, uuid, numeric, timestamptz, integer, text, jsonb, numeric, smallint) from public;
revoke all on function public.registrar_pago_cuota(uuid, uuid, numeric, public.medio_pago, text, timestamptz, uuid) from public;
revoke all on function public.cambiar_estado_inmueble(uuid, public.estado_inmueble) from public;
revoke all on function public.actualizar_estado_cuotas() from public;
revoke all on function public.siguiente_numero_contrato(integer) from public;
revoke all on function public.set_updated_at() from public;
revoke all on function public.handle_new_user() from public;
revoke all on function public.crear_cliente_desde_perfil() from public;
revoke all on function public.proteger_rol() from public;
revoke all on function public.validar_vendedor_visita() from public;
revoke all on function public.alquiler_estado_cambiado() from public;
revoke all on function public.validar_pago() from public;
revoke all on function public.aplicar_pago() from public;
revoke all on function public.auditar() from public;

-- Helpers usados por RLS y por la app.
grant execute on function public.current_rol() to anon, authenticated, service_role;
grant execute on function public.is_admin() to anon, authenticated, service_role;
grant execute on function public.calcular_recargo_mora(uuid) to authenticated, service_role;

-- RPC públicas/autenticadas.
grant execute on function public.agendar_visita(uuid, timestamptz, text, text, text, text, public.canal_visita, uuid, uuid) to anon, authenticated, service_role;
grant execute on function public.promover_a_vendedor(uuid, numeric, text, uuid) to authenticated, service_role;
grant execute on function public.registrar_alquiler(uuid, uuid, uuid, uuid, numeric, timestamptz, integer, text, jsonb, numeric, smallint) to authenticated, service_role;
grant execute on function public.registrar_pago_cuota(uuid, uuid, numeric, public.medio_pago, text, timestamptz, uuid) to authenticated, service_role;
grant execute on function public.cambiar_estado_inmueble(uuid, public.estado_inmueble) to authenticated, service_role;
grant execute on function public.actualizar_estado_cuotas() to service_role;
grant execute on function public.siguiente_numero_contrato(integer) to service_role;
