-- ============================================================================
-- RE/MAX Potosí · 0004 · Row Level Security
-- ============================================================================
-- Reglas de visibilidad:
--   * anon: catálogo público (zonas activas, inmuebles disponibles y sus fotos)
--     y RPC públicas (agendar_visita).
--   * cliente: su perfil, sus visitas, sus alquileres, cuotas, pagos y
--     notificaciones; lectura del inmueble que alquila.
--   * vendedor: sus visitas asignadas, sus alquileres/cuotas/pagos, sus
--     comisiones, la cartera de inmuebles y los clientes (para pickers).
--   * administrador: acceso total.
--
-- Las políticas llaman a funciones `security definer` para consultar tablas
-- relacionadas sin volver a disparar RLS (evita recursión de políticas).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Helpers de autorización
-- ---------------------------------------------------------------------------
create or replace function public.is_vendedor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
	select coalesce(public.current_rol() = 'vendedor', false);
$$;

create or replace function public.es_cliente_de_alquiler(p_alquiler_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
	select exists (
		select 1
		from public.alquileres a
		where a.id = p_alquiler_id
		  and a.cliente_id = auth.uid()
	);
$$;

create or replace function public.es_vendedor_de_alquiler(p_alquiler_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
	select exists (
		select 1
		from public.alquileres a
		where a.id = p_alquiler_id
		  and a.vendedor_id = auth.uid()
	);
$$;

create or replace function public.puede_ver_alquiler(p_alquiler_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
	select public.is_admin()
		or public.es_cliente_de_alquiler(p_alquiler_id)
		or public.es_vendedor_de_alquiler(p_alquiler_id);
$$;

comment on function public.puede_ver_alquiler(uuid) is
	'True si el usuario actual es admin, cliente o vendedor del alquiler.';

create or replace function public.puede_ver_inmueble(p_inmueble_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
	select exists (
		select 1
		from public.inmuebles i
		where i.id = p_inmueble_id
		  and (
			i.estado = 'disponible'
			or public.is_admin()
			or (
				public.is_vendedor()
				and (
					i.agente_id = auth.uid()
					or exists (
						select 1
						from public.alquileres a
						where a.inmueble_id = i.id
						  and a.vendedor_id = auth.uid()
					)
					or exists (
						select 1
						from public.visitas v
						where v.inmueble_id = i.id
						  and v.vendedor_id = auth.uid()
					)
				)
			)
			or exists (
				select 1
				from public.alquileres a
				where a.inmueble_id = i.id
				  and a.cliente_id = auth.uid()
			)
		  )
	);
$$;

create or replace function public.es_agente_de_inmueble(p_inmueble_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
	select exists (
		select 1
		from public.inmuebles i
		where i.id = p_inmueble_id
		  and i.agente_id = auth.uid()
	);
$$;

-- Nombres para las vistas públicas. Se exponen solo el nombre, no el correo,
-- teléfono, CI ni el resto del perfil.
create or replace function public.nombre_persona(p_perfil_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
	select nullif(trim(p.nombres || ' ' || p.apellidos), '')
	from public.perfiles p
	where p.id = p_perfil_id;
$$;

create or replace function public.nombre_agente(p_vendedor_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
	select public.nombre_persona(p_vendedor_id);
$$;

create or replace function public.nombre_proveedor(p_proveedor_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
	select p.nombre
	from public.proveedores p
	where p.id = p_proveedor_id;
$$;

comment on function public.nombre_agente(uuid) is
	'Nombre visible del agente sin exponer el resto de su perfil.';
comment on function public.nombre_proveedor(uuid) is
	'Nombre visible del proveedor sin exponer sus datos de contacto.';

-- ---------------------------------------------------------------------------
-- 2. Protección adicional para actualizaciones del propio perfil
-- ---------------------------------------------------------------------------
-- `proteger_rol()` (0003) impide el cambio de rol. Aquí se cierran las demás
-- columnas sensibles que un usuario podría intentar modificar al editar su
-- propio perfil: activo, correo y la bandera de contraseña temporal.
create or replace function public.proteger_campos_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
	if auth.uid() is not null
		and old.id = auth.uid()
		and not public.is_admin()
	then
		if new.activo is distinct from old.activo
			or new.correo is distinct from old.correo
			or new.debe_cambiar_password is distinct from old.debe_cambiar_password
		then
			raise exception 'Solo un administrador puede cambiar el estado, el correo o la contraseña temporal del perfil.'
				using errcode = '42501';
		end if;
	end if;
	return new;
end;
$$;

drop trigger if exists perfiles_proteger_campos on public.perfiles;
create trigger perfiles_proteger_campos
	before update on public.perfiles
	for each row
	execute function public.proteger_campos_perfil();

-- Una notificación propia solo puede marcarse como leída; no se puede mover a
-- otro perfil ni alterar su contenido para ocultar/scalar avisos.
create or replace function public.proteger_notificacion_propia()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
	if auth.uid() is not null
		and old.perfil_id = auth.uid()
		and not public.is_admin()
	then
		if new.perfil_id is distinct from old.perfil_id
			or new.tipo is distinct from old.tipo
			or new.titulo is distinct from old.titulo
			or new.mensaje is distinct from old.mensaje
			or new.referencia is distinct from old.referencia
		then
			raise exception 'Solo puedes marcar tus notificaciones como leídas.'
				using errcode = '42501';
		end if;
	end if;
	return new;
end;
$$;

drop trigger if exists notificaciones_proteger_propia on public.notificaciones;
create trigger notificaciones_proteger_propia
	before update on public.notificaciones
	for each row
	execute function public.proteger_notificacion_propia();

-- ---------------------------------------------------------------------------
-- 3. Activar RLS en todas las tablas de negocio
-- ---------------------------------------------------------------------------
alter table public.zonas enable row level security;
alter table public.perfiles enable row level security;
alter table public.vendedores enable row level security;
alter table public.clientes enable row level security;
alter table public.proveedores enable row level security;
alter table public.inmuebles enable row level security;
alter table public.inmueble_imagenes enable row level security;
alter table public.visitas enable row level security;
alter table public.alquileres enable row level security;
alter table public.cuotas enable row level security;
alter table public.pagos enable row level security;
alter table public.comisiones enable row level security;
alter table public.notificaciones enable row level security;
alter table public.configuracion enable row level security;
alter table public.auditoria enable row level security;
alter table public.contador_contratos enable row level security;

-- ---------------------------------------------------------------------------
-- 4. Zonas y catálogo público
-- ---------------------------------------------------------------------------
drop policy if exists zonas_lectura on public.zonas;
create policy zonas_lectura on public.zonas
	for select to anon, authenticated
	using (activo or public.is_admin());

drop policy if exists zonas_admin_escritura on public.zonas;
create policy zonas_admin_escritura on public.zonas
	for all to authenticated
	using (public.is_admin())
	with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 5. Perfiles
-- ---------------------------------------------------------------------------
drop policy if exists perfiles_lectura_propia on public.perfiles;
create policy perfiles_lectura_propia on public.perfiles
	for select to authenticated
	using (id = auth.uid());

drop policy if exists perfiles_lectura_admin on public.perfiles;
create policy perfiles_lectura_admin on public.perfiles
	for select to authenticated
	using (public.is_admin());

drop policy if exists perfiles_lectura_vendedor_clientes on public.perfiles;
create policy perfiles_lectura_vendedor_clientes on public.perfiles
	for select to authenticated
	using (public.is_vendedor() and rol = 'cliente');

drop policy if exists perfiles_actualizacion_propia on public.perfiles;
create policy perfiles_actualizacion_propia on public.perfiles
	for update to authenticated
	using (id = auth.uid())
	with check (id = auth.uid());

drop policy if exists perfiles_admin_escritura on public.perfiles;
create policy perfiles_admin_escritura on public.perfiles
	for all to authenticated
	using (public.is_admin())
	with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 6. Vendedores y clientes
-- ---------------------------------------------------------------------------
drop policy if exists vendedores_lectura_propia on public.vendedores;
create policy vendedores_lectura_propia on public.vendedores
	for select to authenticated
	using (perfil_id = auth.uid());

drop policy if exists vendedores_lectura_admin on public.vendedores;
create policy vendedores_lectura_admin on public.vendedores
	for select to authenticated
	using (public.is_admin());

drop policy if exists vendedores_admin_escritura on public.vendedores;
create policy vendedores_admin_escritura on public.vendedores
	for all to authenticated
	using (public.is_admin())
	with check (public.is_admin());

drop policy if exists clientes_lectura_propia on public.clientes;
create policy clientes_lectura_propia on public.clientes
	for select to authenticated
	using (perfil_id = auth.uid());

drop policy if exists clientes_lectura_vendedor on public.clientes;
create policy clientes_lectura_vendedor on public.clientes
	for select to authenticated
	using (public.is_vendedor());

drop policy if exists clientes_lectura_admin on public.clientes;
create policy clientes_lectura_admin on public.clientes
	for select to authenticated
	using (public.is_admin());

drop policy if exists clientes_actualizacion_propia on public.clientes;
create policy clientes_actualizacion_propia on public.clientes
	for update to authenticated
	using (perfil_id = auth.uid())
	with check (perfil_id = auth.uid());

drop policy if exists clientes_admin_escritura on public.clientes;
create policy clientes_admin_escritura on public.clientes
	for all to authenticated
	using (public.is_admin())
	with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 7. Proveedores
-- ---------------------------------------------------------------------------
drop policy if exists proveedores_lectura on public.proveedores;
create policy proveedores_lectura on public.proveedores
	for select to authenticated
	using (public.is_admin() or public.is_vendedor());

drop policy if exists proveedores_admin_escritura on public.proveedores;
create policy proveedores_admin_escritura on public.proveedores
	for all to authenticated
	using (public.is_admin())
	with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 8. Inmuebles e imágenes
-- ---------------------------------------------------------------------------
drop policy if exists inmuebles_lectura on public.inmuebles;
create policy inmuebles_lectura on public.inmuebles
	for select to anon, authenticated
	using (public.puede_ver_inmueble(id));

drop policy if exists inmuebles_admin_escritura on public.inmuebles;
create policy inmuebles_admin_escritura on public.inmuebles
	for all to authenticated
	using (public.is_admin())
	with check (public.is_admin());

drop policy if exists inmueble_imagenes_lectura on public.inmueble_imagenes;
create policy inmueble_imagenes_lectura on public.inmueble_imagenes
	for select to anon, authenticated
	using (public.puede_ver_inmueble(inmueble_id));

drop policy if exists inmueble_imagenes_agente_escritura on public.inmueble_imagenes;
create policy inmueble_imagenes_agente_escritura on public.inmueble_imagenes
	for all to authenticated
	using (
		public.is_admin()
		or (public.is_vendedor() and public.es_agente_de_inmueble(inmueble_id))
	)
	with check (
		public.is_admin()
		or (public.is_vendedor() and public.es_agente_de_inmueble(inmueble_id))
	);

-- ---------------------------------------------------------------------------
-- 9. Visitas
-- ---------------------------------------------------------------------------
drop policy if exists visitas_lectura on public.visitas;
create policy visitas_lectura on public.visitas
	for select to authenticated
	using (
		public.is_admin()
		or cliente_id = auth.uid()
		or vendedor_id = auth.uid()
	);

drop policy if exists visitas_actualizacion on public.visitas;
create policy visitas_actualizacion on public.visitas
	for update to authenticated
	using (
		public.is_admin()
		or cliente_id = auth.uid()
		or vendedor_id = auth.uid()
	)
	with check (
		public.is_admin()
		or cliente_id = auth.uid()
		or vendedor_id = auth.uid()
	);

drop policy if exists visitas_admin_escritura on public.visitas;
create policy visitas_admin_escritura on public.visitas
	for all to authenticated
	using (public.is_admin())
	with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 10. Alquileres, cuotas y pagos
-- ---------------------------------------------------------------------------
drop policy if exists alquileres_lectura on public.alquileres;
create policy alquileres_lectura on public.alquileres
	for select to authenticated
	using (public.puede_ver_alquiler(id));

drop policy if exists alquileres_admin_escritura on public.alquileres;
create policy alquileres_admin_escritura on public.alquileres
	for all to authenticated
	using (public.is_admin())
	with check (public.is_admin());

drop policy if exists cuotas_lectura on public.cuotas;
create policy cuotas_lectura on public.cuotas
	for select to authenticated
	using (public.puede_ver_alquiler(alquiler_id));

drop policy if exists cuotas_admin_escritura on public.cuotas;
create policy cuotas_admin_escritura on public.cuotas
	for all to authenticated
	using (public.is_admin())
	with check (public.is_admin());

drop policy if exists pagos_lectura on public.pagos;
create policy pagos_lectura on public.pagos
	for select to authenticated
	using (public.puede_ver_alquiler(alquiler_id));

drop policy if exists pagos_admin_escritura on public.pagos;
create policy pagos_admin_escritura on public.pagos
	for all to authenticated
	using (public.is_admin())
	with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 11. Comisiones, notificaciones, configuración y auditoría
-- ---------------------------------------------------------------------------
drop policy if exists comisiones_lectura on public.comisiones;
create policy comisiones_lectura on public.comisiones
	for select to authenticated
	using (vendedor_id = auth.uid() or public.is_admin());

drop policy if exists comisiones_admin_escritura on public.comisiones;
create policy comisiones_admin_escritura on public.comisiones
	for all to authenticated
	using (public.is_admin())
	with check (public.is_admin());

drop policy if exists notificaciones_lectura on public.notificaciones;
create policy notificaciones_lectura on public.notificaciones
	for select to authenticated
	using (perfil_id = auth.uid() or public.is_admin());

drop policy if exists notificaciones_actualizacion on public.notificaciones;
create policy notificaciones_actualizacion on public.notificaciones
	for update to authenticated
	using (perfil_id = auth.uid() or public.is_admin())
	with check (perfil_id = auth.uid() or public.is_admin());

drop policy if exists notificaciones_admin_escritura on public.notificaciones;
create policy notificaciones_admin_escritura on public.notificaciones
	for all to authenticated
	using (public.is_admin())
	with check (public.is_admin());

drop policy if exists configuracion_lectura on public.configuracion;
create policy configuracion_lectura on public.configuracion
	for select to authenticated
	using (true);

drop policy if exists configuracion_admin_escritura on public.configuracion;
create policy configuracion_admin_escritura on public.configuracion
	for all to authenticated
	using (public.is_admin())
	with check (public.is_admin());

drop policy if exists auditoria_lectura_admin on public.auditoria;
create policy auditoria_lectura_admin on public.auditoria
	for select to authenticated
	using (public.is_admin());

drop policy if exists contador_lectura_admin on public.contador_contratos;
create policy contador_lectura_admin on public.contador_contratos
	for select to authenticated
	using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 12. Permisos de tabla
-- ---------------------------------------------------------------------------
-- RLS decide las filas; los GRANT solo habilitan la operación. `anon` recibe
-- SELECT en todas las tablas para que las vistas del catálogo funcionen, pero
-- sin políticas que lo autoricen no puede leer nada más.
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;

-- ---------------------------------------------------------------------------
-- 13. Permisos de ejecución de los helpers
-- ---------------------------------------------------------------------------
revoke all on function public.is_vendedor() from public;
revoke all on function public.es_cliente_de_alquiler(uuid) from public;
revoke all on function public.es_vendedor_de_alquiler(uuid) from public;
revoke all on function public.puede_ver_alquiler(uuid) from public;
revoke all on function public.puede_ver_inmueble(uuid) from public;
revoke all on function public.es_agente_de_inmueble(uuid) from public;
revoke all on function public.nombre_persona(uuid) from public;
revoke all on function public.nombre_agente(uuid) from public;
revoke all on function public.nombre_proveedor(uuid) from public;
revoke all on function public.proteger_campos_perfil() from public;
revoke all on function public.proteger_notificacion_propia() from public;

grant execute on function public.is_vendedor() to authenticated, service_role;
grant execute on function public.es_cliente_de_alquiler(uuid) to authenticated, service_role;
grant execute on function public.es_vendedor_de_alquiler(uuid) to authenticated, service_role;
grant execute on function public.puede_ver_alquiler(uuid) to authenticated, service_role;
grant execute on function public.puede_ver_inmueble(uuid) to anon, authenticated, service_role;
grant execute on function public.es_agente_de_inmueble(uuid) to authenticated, service_role;
grant execute on function public.nombre_persona(uuid) to authenticated, service_role;
grant execute on function public.nombre_agente(uuid) to anon, authenticated, service_role;
grant execute on function public.nombre_proveedor(uuid) to anon, authenticated, service_role;
