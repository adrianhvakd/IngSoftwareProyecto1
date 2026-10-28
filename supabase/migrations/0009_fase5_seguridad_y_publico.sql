-- ---------------------------------------------------------------------------
-- 0009 · Fase 5 · Protección de visitas y datos públicos reales
-- ---------------------------------------------------------------------------
-- * Cierra un hueco de RLS: el cliente o el vendedor de una visita podían
--   cambiar inmueble, fecha, cliente, vendedor o notas con un UPDATE directo.
--   La política permite la fila, pero el trigger ahora solo autoriza el cambio
--   de estado que corresponde a cada rol.
-- * Expone el equipo comercial y un resumen agregado para el sitio público sin
--   abrir `perfiles`, `vendedores` ni `alquileres` a `anon`.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. Solo el estado de una visita puede cambiar desde la sesión del actor
-- ---------------------------------------------------------------------------
create or replace function public.proteger_campos_visita()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
	v_rol public.rol_usuario;
begin
	-- La service role, las migraciones y los jobs internos no tienen auth.uid().
	if auth.uid() is null or public.is_admin() then
		return new;
	end if;

	-- El actor solo puede tocar `estado`; cualquier otro campo queda inmutable.
	if new.inmueble_id is distinct from old.inmueble_id
		or new.cliente_id is distinct from old.cliente_id
		or new.nombre_contacto is distinct from old.nombre_contacto
		or new.telefono_contacto is distinct from old.telefono_contacto
		or new.correo_contacto is distinct from old.correo_contacto
		or new.vendedor_id is distinct from old.vendedor_id
		or new.fecha_hora is distinct from old.fecha_hora
		or new.canal is distinct from old.canal
		or new.notas is distinct from old.notas
		or new.created_at is distinct from old.created_at
	then
		raise exception 'Solo un administrador puede editar los datos de una visita.'
			using errcode = '42501';
	end if;

	if new.estado is distinct from old.estado then
		select p.rol
		into v_rol
		from public.perfiles p
		where p.id = auth.uid()
		  and p.activo;

		if v_rol is null then
			raise exception 'Tu cuenta no está activa para cambiar visitas.'
				using errcode = '42501';
		end if;

		if old.cliente_id = auth.uid() then
			-- El cliente solo puede cancelar una visita aún pendiente.
			if old.estado <> 'pendiente' or new.estado <> 'cancelada' then
				raise exception 'Solo puedes cancelar visitas pendientes.'
					using errcode = '42501';
			end if;
		elsif old.vendedor_id = auth.uid() and v_rol = 'vendedor' then
			-- El vendedor confirma o cancela una visita asignada.
			if old.estado <> 'pendiente'
				or new.estado not in ('realizada', 'cancelada')
			then
				raise exception 'Solo puedes confirmar o cancelar visitas pendientes asignadas.'
					using errcode = '42501';
			end if;
		else
			raise exception 'No puedes cambiar el estado de esta visita.'
				using errcode = '42501';
		end if;
	end if;

	return new;
end;
$$;

comment on function public.proteger_campos_visita() is
	'Impide que cliente/vendedor editen una visita; solo permiten el cambio de estado válido.';

drop trigger if exists visitas_proteger_campos on public.visitas;
create trigger visitas_proteger_campos
	before update on public.visitas
	for each row
	execute function public.proteger_campos_visita();

-- ---------------------------------------------------------------------------
-- 2. Equipo comercial público
-- ---------------------------------------------------------------------------
-- Devuelve únicamente datos de contacto profesional de vendedores activos.
-- No expone correo, CI, comisión ni el resto de `perfiles`.
create or replace function public.listar_agentes_publicos()
returns table (
	id uuid,
	nombre text,
	cargo text,
	zona text,
	telefono text,
	avatar_url text,
	alquileres_gestionados bigint
)
language sql
stable
security definer
set search_path = ''
as $$
	select
		v.perfil_id as id,
		trim(concat_ws(' ', p.nombres, p.apellidos)) as nombre,
		coalesce(nullif(trim(v.cargo), ''), 'Agente comercial') as cargo,
		coalesce(nullif(trim(z.nombre), ''), 'Potosí') as zona,
		coalesce(p.telefono, '') as telefono,
		coalesce(p.avatar_url, '') as avatar_url,
		(
			select count(*)
			from public.alquileres a
			where a.vendedor_id = v.perfil_id
		) as alquileres_gestionados
	from public.vendedores v
	join public.perfiles p on p.id = v.perfil_id
	left join public.zonas z on z.id = v.zona_principal_id
	where v.activo
	  and p.activo
	  and p.rol = 'vendedor'
	order by nombre;
$$;

comment on function public.listar_agentes_publicos() is
	'Datos profesionales públicos de los agentes activos para la landing.';

revoke all on function public.listar_agentes_publicos() from public;
grant execute on function public.listar_agentes_publicos() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Resumen agregado de la landing
-- ---------------------------------------------------------------------------
create or replace function public.resumen_publico()
returns table (
	inmuebles_disponibles bigint,
	agentes_activos bigint,
	zonas_activas bigint,
	contratos_gestionados bigint
)
language sql
stable
security definer
set search_path = ''
as $$
	select
		(
			select count(*)
			from public.inmuebles i
			where i.estado = 'disponible'
		) as inmuebles_disponibles,
		(
			select count(*)
			from public.vendedores v
			join public.perfiles p on p.id = v.perfil_id
			where v.activo and p.activo and p.rol = 'vendedor'
		) as agentes_activos,
		(
			select count(*)
			from public.zonas z
			where z.activo
		) as zonas_activas,
		(
			select count(*)
			from public.alquileres a
		) as contratos_gestionados;
$$;

comment on function public.resumen_publico() is
	'Aggregados públicos de la landing; no expone filas individuales.';

revoke all on function public.resumen_publico() from public;
grant execute on function public.resumen_publico() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. Permisos de la función de trigger
-- ---------------------------------------------------------------------------
revoke all on function public.proteger_campos_visita() from public;
