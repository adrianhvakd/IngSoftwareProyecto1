-- ============================================================================
-- RE/MAX Potosí · 0006 · Vistas de lectura
-- ============================================================================
-- Todas las vistas usan `security_invoker = true`: los permisos y RLS del
-- usuario que consulta se aplican a las tablas base. No son una puerta trasera
-- para saltarse 0004.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Catálogo público
-- ---------------------------------------------------------------------------
create or replace view public.v_inmuebles_catalogo
with (security_invoker = true) as
select
	i.id,
	i.codigo,
	i.titulo,
	i.tipo,
	i.estado,
	i.destacado,
	i.descripcion,
	i.precio,
	i.m2,
	i.habitaciones,
	i.banos,
	i.estacionamientos,
	i.piso,
	i.amoblado,
	i.caracteristicas,
	i.direccion,
	i.zona_id,
	z.nombre as zona_nombre,
	z.sector as zona_sector,
	z.slug as zona_slug,
	i.proveedor_id,
	public.nombre_proveedor(i.proveedor_id) as proveedor_nombre,
	i.agente_id,
	public.nombre_agente(i.agente_id) as agente_nombre,
	i.fecha_disponibilidad,
	i.costo_publicacion,
	i.publicado_el,
	i.visitas_mes,
	portada.url as portada_url,
	portada.path as portada_path,
	portada.alt as portada_alt,
	imagenes.imagenes,
	i.created_at,
	i.updated_at
from public.inmuebles i
left join public.zonas z on z.id = i.zona_id
left join lateral (
	select x.url, x.path, x.alt
	from public.inmueble_imagenes x
	where x.inmueble_id = i.id
	  and x.es_portada
	order by x.orden
	limit 1
) portada on true
left join lateral (
	select jsonb_agg(
		jsonb_build_object(
			'id', x.id,
			'url', x.url,
			'path', x.path,
			'alt', x.alt,
			'orden', x.orden,
			'es_portada', x.es_portada
		)
		order by x.orden
	) as imagenes
	from public.inmueble_imagenes x
	where x.inmueble_id = i.id
) imagenes on true;

comment on view public.v_inmuebles_catalogo is
	'Inmuebles con zona, proveedor, agente y galería. Respeta la RLS del catálogo.';

-- ---------------------------------------------------------------------------
-- 2. Zonas con conteo
-- ---------------------------------------------------------------------------
create or replace view public.v_zonas_con_conteo
with (security_invoker = true) as
select
	z.id,
	z.nombre,
	z.sector,
	z.slug,
	z.activo,
	count(i.id)::integer as total_inmuebles,
	count(i.id) filter (where i.estado = 'disponible')::integer as disponibles,
	count(i.id) filter (where i.estado = 'en_alquiler')::integer as en_alquiler,
	count(i.id) filter (where i.estado = 'reservado')::integer as reservados
from public.zonas z
left join public.inmuebles i on i.zona_id = z.id
group by z.id, z.nombre, z.sector, z.slug, z.activo;

comment on view public.v_zonas_con_conteo is
	'Zonas y conteo de inmuebles visibles para el usuario actual.';

-- ---------------------------------------------------------------------------
-- 3. Cuotas con estado derivado
-- ---------------------------------------------------------------------------
create or replace view public.v_cuotas_estado
with (security_invoker = true) as
select
	c.id,
	c.alquiler_id,
	c.numero,
	c.fecha_vencimiento,
	c.monto,
	c.recargo_mora,
	case
		when c.estado = 'pagada' then c.monto + c.recargo_mora
		when c.estado = 'anulada' then c.monto + c.recargo_mora
		when (now() at time zone 'America/La_Paz')::date
			> ((c.fecha_vencimiento at time zone 'America/La_Paz')::date + cfg.dias_gracia)
			then c.monto + greatest(
				c.recargo_mora,
				round(c.monto * cfg.recargo_mora_porcentaje / 100, 2)
			)
		else c.monto
	end as monto_total,
	c.estado as estado_tabla,
	case
		when c.estado = 'pagada' then 'pagada'
		when c.estado = 'anulada' then 'anulada'
		when c.estado = 'en_mora' then 'en_mora'
		when (now() at time zone 'America/La_Paz')::date
			> ((c.fecha_vencimiento at time zone 'America/La_Paz')::date + cfg.dias_gracia)
			then 'en_mora'
		when (now() at time zone 'America/La_Paz')::date
			>= ((c.fecha_vencimiento at time zone 'America/La_Paz')::date - cfg.dias_aviso_previo)
			then 'por_vencer'
		else 'al_dia'
	end as estado_codigo,
	case
		when c.estado = 'pagada' then 'Pagada'
		when c.estado = 'anulada' then 'Anulada'
		when c.estado = 'en_mora' then 'En mora'
		when (now() at time zone 'America/La_Paz')::date
			> ((c.fecha_vencimiento at time zone 'America/La_Paz')::date + cfg.dias_gracia)
			then 'En mora'
		when (now() at time zone 'America/La_Paz')::date
			>= ((c.fecha_vencimiento at time zone 'America/La_Paz')::date - cfg.dias_aviso_previo)
			then 'Por vencer'
		else 'Al día'
	end as estado,
	((c.fecha_vencimiento at time zone 'America/La_Paz')::date
		- (now() at time zone 'America/La_Paz')::date) as dias_para_vencer,
	a.numero_contrato,
	a.cliente_id,
	a.vendedor_id,
	a.inmueble_id,
	a.estado as alquiler_estado,
	public.nombre_persona(a.cliente_id) as cliente_nombre,
	i.codigo as inmueble_codigo,
	i.titulo as inmueble_titulo,
	c.created_at,
	c.updated_at
from public.cuotas c
join public.alquileres a on a.id = c.alquiler_id
join public.inmuebles i on i.id = a.inmueble_id
cross join public.configuracion cfg
where cfg.id = 1;

comment on view public.v_cuotas_estado is
	'Cuota con estado visible: Al día, Por vencer, En mora, Pagada o Anulada.';

-- ---------------------------------------------------------------------------
-- 4. Alquileres con detalle
-- ---------------------------------------------------------------------------
create or replace view public.v_alquileres_detalle
with (security_invoker = true) as
select
	a.id,
	a.numero_contrato,
	a.inmueble_id,
	i.codigo as inmueble_codigo,
	i.titulo as inmueble_titulo,
	i.direccion as inmueble_direccion,
	z.nombre as zona_nombre,
	portada.url as inmueble_portada_url,
	portada.path as inmueble_portada_path,
	a.cliente_id,
	p.nombres || ' ' || p.apellidos as cliente_nombre,
	p.correo as cliente_correo,
	p.telefono as cliente_telefono,
	a.vendedor_id,
	public.nombre_agente(a.vendedor_id) as vendedor_nombre,
	a.fecha_inicio,
	a.fecha_fin,
	a.duracion_meses,
	a.monto_mensual,
	a.dia_cobro,
	a.deposito,
	a.estado,
	a.contrato_path,
	pc.id as proxima_cuota_id,
	pc.numero as proxima_cuota_numero,
	pc.fecha_vencimiento as proxima_cuota_vencimiento,
	pc.monto as proxima_cuota_monto,
	pc.monto_total as proxima_cuota_total,
	pc.estado as proxima_cuota_estado,
	pc.estado_codigo as proxima_cuota_estado_codigo,
	coalesce(pc.estado, 'Sin cuotas pendientes') as estado_cobro,
	coalesce(pend.total_pendiente, 0) as total_pendiente,
	coalesce(pag.total_pagado, 0) as total_pagado,
	coalesce(com.monto, 0) as comision_monto,
	a.created_at,
	a.updated_at
from public.alquileres a
join public.inmuebles i on i.id = a.inmueble_id
left join public.zonas z on z.id = i.zona_id
join public.perfiles p on p.id = a.cliente_id
left join lateral (
	select x.url, x.path
	from public.inmueble_imagenes x
	where x.inmueble_id = i.id
	  and x.es_portada
	limit 1
) portada on true
left join lateral (
	select vc.*
	from public.v_cuotas_estado vc
	where vc.alquiler_id = a.id
	  and vc.estado_tabla in ('pendiente', 'en_mora')
	order by vc.fecha_vencimiento
	limit 1
) pc on true
left join lateral (
	select coalesce(sum(vc.monto_total), 0) as total_pendiente
	from public.v_cuotas_estado vc
	where vc.alquiler_id = a.id
	  and vc.estado_tabla in ('pendiente', 'en_mora')
) pend on true
left join lateral (
	select coalesce(sum(pg.monto), 0) as total_pagado
	from public.pagos pg
	where pg.alquiler_id = a.id
) pag on true
left join lateral (
	select c.monto
	from public.comisiones c
	where c.alquiler_id = a.id
	limit 1
) com on true;

comment on view public.v_alquileres_detalle is
	'Alquiler con inmueble, cliente, vendedor, próxima cuota y totales de cobro.';

-- ---------------------------------------------------------------------------
-- 5. Comisiones por vendedor
-- ---------------------------------------------------------------------------
create or replace view public.v_comisiones_vendedor
with (security_invoker = true) as
select
	c.id,
	c.vendedor_id,
	public.nombre_agente(c.vendedor_id) as vendedor_nombre,
	c.alquiler_id,
	a.numero_contrato,
	a.inmueble_id,
	i.codigo as inmueble_codigo,
	i.titulo as inmueble_titulo,
	public.nombre_persona(a.cliente_id) as cliente_nombre,
	c.monto,
	c.fecha,
	c.estado,
	c.created_at,
	c.updated_at
from public.comisiones c
join public.alquileres a on a.id = c.alquiler_id
join public.inmuebles i on i.id = a.inmueble_id;

comment on view public.v_comisiones_vendedor is
	'Comisiones visibles: el vendedor ve las propias; el admin ve todas.';

-- ---------------------------------------------------------------------------
-- 6. KPIs del panel administrador
-- ---------------------------------------------------------------------------
create or replace view public.v_dashboard_admin
with (security_invoker = true) as
select
	(
		select count(*)::integer
		from public.inmuebles i
		where i.estado in ('disponible', 'reservado', 'en_alquiler')
	) as inmuebles_activos,
	(
		select count(*)::integer
		from public.visitas v
		where v.fecha_hora >= date_trunc('week', now() at time zone 'America/La_Paz') at time zone 'America/La_Paz'
		  and v.fecha_hora < (date_trunc('week', now() at time zone 'America/La_Paz') + interval '7 days') at time zone 'America/La_Paz'
	) as visitas_semana,
	(
		select count(*)::integer
		from public.alquileres a
		where a.estado = 'vigente'
	) as alquileres_vigentes,
	(
		select coalesce(sum(p.monto), 0)
		from public.pagos p
		where p.fecha_pago >= date_trunc('month', now() at time zone 'America/La_Paz') at time zone 'America/La_Paz'
		  and p.fecha_pago < (date_trunc('month', now() at time zone 'America/La_Paz') + interval '1 month') at time zone 'America/La_Paz'
	) as cobros_del_mes,
	(
		select count(*)::integer
		from public.cuotas c
		join public.alquileres a on a.id = c.alquiler_id
		where c.estado = 'en_mora'
		  and a.estado = 'vigente'
	) as cuotas_en_mora,
	(
		select coalesce(sum(c.monto + c.recargo_mora), 0)
		from public.cuotas c
		join public.alquileres a on a.id = c.alquiler_id
		where c.estado = 'en_mora'
		  and a.estado = 'vigente'
	) as mora_total,
	(
		select count(*)::integer
		from public.cuotas c
		join public.alquileres a on a.id = c.alquiler_id
		cross join public.configuracion cfg
		where a.estado = 'vigente'
		  and c.estado = 'pendiente'
		  and cfg.id = 1
		  and (c.fecha_vencimiento at time zone 'America/La_Paz')::date
			between (now() at time zone 'America/La_Paz')::date
				and (now() at time zone 'America/La_Paz')::date + cfg.dias_aviso_previo
	) as cuotas_por_vencer,
	(
		select case
			when coalesce(sum(a.monto_mensual), 0) = 0 then 0
			else round(
				coalesce((
					select sum(c.monto + c.recargo_mora)
					from public.cuotas c
					join public.alquileres a2 on a2.id = c.alquiler_id
					where c.estado = 'en_mora'
					  and a2.estado = 'vigente'
				), 0) * 100 / sum(a.monto_mensual),
				2
			)
		end
		from public.alquileres a
		where a.estado = 'vigente'
	) as morosidad_porcentaje;

comment on view public.v_dashboard_admin is
	'KPIs del panel: inmuebles activos, visitas, alquileres, cobros y mora.';

-- ---------------------------------------------------------------------------
-- 7. Permisos de lectura de las vistas
-- ---------------------------------------------------------------------------
revoke all on public.v_inmuebles_catalogo from public;
revoke all on public.v_zonas_con_conteo from public;
revoke all on public.v_cuotas_estado from public;
revoke all on public.v_alquileres_detalle from public;
revoke all on public.v_comisiones_vendedor from public;
revoke all on public.v_dashboard_admin from public;

grant select on public.v_inmuebles_catalogo to anon, authenticated, service_role;
grant select on public.v_zonas_con_conteo to anon, authenticated, service_role;
grant select on public.v_cuotas_estado to authenticated, service_role;
grant select on public.v_alquileres_detalle to authenticated, service_role;
grant select on public.v_comisiones_vendedor to authenticated, service_role;
grant select on public.v_dashboard_admin to authenticated, service_role;
