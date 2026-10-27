-- ============================================================================
-- RE/MAX Potosí · 0001 · Extensiones y enums
-- ============================================================================
-- Orden: este archivo debe ejecutarse antes que 0002 y 0003.
-- No se usan extensiones para `gen_random_uuid()`: PostgreSQL 13+ ya la
-- incluye en el core. `pg_cron` se crea en 0007 porque es opcional en local.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Roles de la plataforma.
-- `perfiles.rol` usa este enum. Los permisos finos viven en RLS (0004).
-- ---------------------------------------------------------------------------
do $$
begin
	if not exists (
		select 1
		from pg_type t
		join pg_namespace n on n.oid = t.typnamespace
		where t.typname = 'rol_usuario' and n.nspname = 'public'
	) then
		create type public.rol_usuario as enum (
			'administrador',
			'vendedor',
			'cliente'
		);
	end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Inmuebles. Se alinea con `TipoInmueble` de src/data/types.ts.
-- ---------------------------------------------------------------------------
do $$
begin
	if not exists (
		select 1
		from pg_type t
		join pg_namespace n on n.oid = t.typnamespace
		where t.typname = 'tipo_inmueble' and n.nspname = 'public'
	) then
		create type public.tipo_inmueble as enum (
			'casa',
			'departamento',
			'local'
		);
	end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Estado comercial del inmueble. `destacado` es un booleano aparte.
-- ---------------------------------------------------------------------------
do $$
begin
	if not exists (
		select 1
		from pg_type t
		join pg_namespace n on n.oid = t.typnamespace
		where t.typname = 'estado_inmueble' and n.nspname = 'public'
	) then
		create type public.estado_inmueble as enum (
			'disponible',
			'reservado',
			'en_alquiler',
			'inactivo'
		);
	end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Visitas.
-- ---------------------------------------------------------------------------
do $$
begin
	if not exists (
		select 1
		from pg_type t
		join pg_namespace n on n.oid = t.typnamespace
		where t.typname = 'estado_visita' and n.nspname = 'public'
	) then
		create type public.estado_visita as enum (
			'pendiente',
			'realizada',
			'cancelada'
		);
	end if;
end
$$;

-- Canal por el que llegó la visita. La UI muestra Web, Teléfono y Presencial.
do $$
begin
	if not exists (
		select 1
		from pg_type t
		join pg_namespace n on n.oid = t.typnamespace
		where t.typname = 'canal_visita' and n.nspname = 'public'
	) then
		create type public.canal_visita as enum (
			'web',
			'telefono',
			'presencial'
		);
	end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Alquileres.
-- `suspendido` se agrega porque la UI ya lo usa (src/data/types.ts). El
-- prompt original hablaba de `cancelado`; se conservan ambos.
-- ---------------------------------------------------------------------------
do $$
begin
	if not exists (
		select 1
		from pg_type t
		join pg_namespace n on n.oid = t.typnamespace
		where t.typname = 'estado_alquiler' and n.nspname = 'public'
	) then
		create type public.estado_alquiler as enum (
			'vigente',
			'finalizado',
			'suspendido',
			'cancelado'
		);
	end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Cuotas.
-- `anulada` permite cerrar un contrato sin borrar el cronograma. La vista
-- v_cuotas_estado (0006) derivará "por vencer" por fecha.
-- ---------------------------------------------------------------------------
do $$
begin
	if not exists (
		select 1
		from pg_type t
		join pg_namespace n on n.oid = t.typnamespace
		where t.typname = 'estado_cuota' and n.nspname = 'public'
	) then
		create type public.estado_cuota as enum (
			'pendiente',
			'pagada',
			'en_mora',
			'anulada'
		);
	end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Pagos. `cierre` es el cobro inicial del wizard; `cuota` es el cobro de una
-- cuota mensual. `cuota_id` puede estar presente también en un pago de cierre
-- cuando cubre la primera cuota.
-- ---------------------------------------------------------------------------
do $$
begin
	if not exists (
		select 1
		from pg_type t
		join pg_namespace n on n.oid = t.typnamespace
		where t.typname = 'tipo_pago' and n.nspname = 'public'
	) then
		create type public.tipo_pago as enum (
			'cierre',
			'cuota'
		);
	end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Medios de pago. La UI distingue tarjeta de crédito/débito; la DB solo
-- necesita saber que fue tarjeta. El label se conserva en la interfaz.
-- ---------------------------------------------------------------------------
do $$
begin
	if not exists (
		select 1
		from pg_type t
		join pg_namespace n on n.oid = t.typnamespace
		where t.typname = 'medio_pago' and n.nspname = 'public'
	) then
		create type public.medio_pago as enum (
			'tarjeta',
			'qr',
			'efectivo',
			'otro'
		);
	end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Comisiones del vendedor.
-- ---------------------------------------------------------------------------
do $$
begin
	if not exists (
		select 1
		from pg_type t
		join pg_namespace n on n.oid = t.typnamespace
		where t.typname = 'estado_comision' and n.nspname = 'public'
	) then
		create type public.estado_comision as enum (
			'pendiente',
			'pagada',
			'anulada'
		);
	end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Notificaciones internas. El tipo permite filtrar y deduplicar avisos.
-- ---------------------------------------------------------------------------
do $$
begin
	if not exists (
		select 1
		from pg_type t
		join pg_namespace n on n.oid = t.typnamespace
		where t.typname = 'tipo_notificacion' and n.nspname = 'public'
	) then
		create type public.tipo_notificacion as enum (
			'visita_agendada',
			'visita_asignada',
			'cuota_por_vencer',
			'cuota_en_mora',
			'pago_registrado',
			'alquiler_cerrado',
			'sistema'
		);
	end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Proveedores: persona natural o empresa. La UI lo muestra en la tabla.
-- ---------------------------------------------------------------------------
do $$
begin
	if not exists (
		select 1
		from pg_type t
		join pg_namespace n on n.oid = t.typnamespace
		where t.typname = 'tipo_proveedor' and n.nspname = 'public'
	) then
		create type public.tipo_proveedor as enum (
			'persona',
			'empresa'
		);
	end if;
end
$$;
