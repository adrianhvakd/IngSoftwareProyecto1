-- ============================================================================
-- RE/MAX Potosí · full_setup.sql
-- ============================================================================
-- Archivo generado por `pnpm db:bundle`. No lo edites a mano.
-- Pega su contenido completo en el editor SQL de un proyecto Supabase vacío.
-- Después de las migraciones, ejecuta supabase/seed.sql si quieres datos demo.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0001_extensiones_y_enums.sql
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 0002_tablas.sql
-- ----------------------------------------------------------------------------
-- ============================================================================
-- RE/MAX Potosí · 0002 · Tablas, índices y restricciones
-- ============================================================================
-- Convenciones:
--   * tablas/columnas en español y snake_case;
--   * PK uuid con gen_random_uuid(), salvo perfiles.id = auth.users.id;
--   * dinero numeric(12,2) en bolivianos;
--   * fechas timestamptz; la zona de negocio es America/La_Paz;
--   * created_at / updated_at en todas las tablas (set_updated_at en 0003);
--   * borrado lógico con estado/activo donde la UI habla de baja/inactivo.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Zonas. La UI las agrupa por sector y muestra el conteo de inmuebles
-- (v_zonas_con_conteo en 0006). El slug es estable para URLs y filtros.
-- ---------------------------------------------------------------------------
create table public.zonas (
	id uuid primary key default gen_random_uuid(),
	nombre text not null,
	sector text not null,
	slug text not null unique,
	activo boolean not null default true,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint zonas_nombre_sector_key unique (sector, nombre),
	constraint zonas_slug_formato check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

comment on table public.zonas is
	'Zonas urbanas de Potosí agrupadas por sector (Centro, Norte, Sur).';

-- ---------------------------------------------------------------------------
-- Perfiles. Espejo 1:1 de auth.users con los datos de negocio.
-- El id es la misma PK de Supabase Auth para simplificar RLS y joins.
-- ---------------------------------------------------------------------------
create table public.perfiles (
	id uuid primary key references auth.users (id) on delete cascade,
	nombres text not null,
	apellidos text not null default '',
	ci text,
	telefono text,
	correo text not null,
	rol public.rol_usuario not null default 'cliente',
	activo boolean not null default true,
	debe_cambiar_password boolean not null default false,
	avatar_url text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint perfiles_correo_no_vacio check (length(trim(correo)) > 0)
);

create unique index perfiles_ci_key
	on public.perfiles (ci)
	where ci is not null;

create unique index perfiles_correo_lower_key
	on public.perfiles (lower(correo));

create index perfiles_rol_activo_idx
	on public.perfiles (rol, activo);

comment on table public.perfiles is
	'Datos de negocio del usuario; se crea automáticamente al insertar auth.users.';

-- ---------------------------------------------------------------------------
-- Vendedores. PK = perfil_id (relación 1:1 con perfiles).
-- `comision_fija` es el snapshot que se copia a comisiones al cerrar.
-- ---------------------------------------------------------------------------
create table public.vendedores (
	perfil_id uuid primary key references public.perfiles (id) on delete cascade,
	comision_fija numeric(12,2) not null default 0,
	fecha_alta timestamptz not null default now(),
	activo boolean not null default true,
	cargo text,
	zona_principal_id uuid references public.zonas (id) on delete set null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint vendedores_comision_no_negativa check (comision_fija >= 0)
);

create index vendedores_activo_idx on public.vendedores (activo);
create index vendedores_zona_idx on public.vendedores (zona_principal_id);

comment on table public.vendedores is
	'Agentes de venta; perfil con rol vendedor más comisión fija y cargo.';

-- ---------------------------------------------------------------------------
-- Clientes. PK = perfil_id. Los datos de contacto pueden diferir del perfil.
-- ---------------------------------------------------------------------------
create table public.clientes (
	perfil_id uuid primary key references public.perfiles (id) on delete cascade,
	telefono_contacto text,
	direccion text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

comment on table public.clientes is
	'Inquilinos. Se crean automáticamente al asignar rol cliente a un perfil.';

-- ---------------------------------------------------------------------------
-- Proveedores / propietarios. No se borran si tienen inmuebles: la UI los
-- desactiva (activo = false) y la FK desde inmuebles es RESTRICT.
-- ---------------------------------------------------------------------------
create table public.proveedores (
	id uuid primary key default gen_random_uuid(),
	nombre text not null,
	telefono text,
	correo text,
	tipo public.tipo_proveedor not null default 'persona',
	ciudad text not null default 'Potosí',
	zona_principal_id uuid references public.zonas (id) on delete set null,
	activo boolean not null default true,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint proveedores_nombre_no_vacio check (length(trim(nombre)) > 0)
);

create index proveedores_activo_idx on public.proveedores (activo);
create index proveedores_zona_idx on public.proveedores (zona_principal_id);

comment on table public.proveedores is
	'Propietarios o empresas que entregan inmuebles para alquiler.';

-- ---------------------------------------------------------------------------
-- Inmuebles. `precio` es el alquiler mensual. `caracteristicas` guarda el
-- array de amenidades de los mocks; las fotos viven en inmueble_imagenes.
-- ---------------------------------------------------------------------------
create table public.inmuebles (
	id uuid primary key default gen_random_uuid(),
	codigo text not null unique,
	titulo text not null,
	tipo public.tipo_inmueble not null,
	estado public.estado_inmueble not null default 'disponible',
	destacado boolean not null default false,
	descripcion text not null default '',
	precio numeric(12,2) not null,
	m2 numeric(10,2) not null,
	habitaciones integer,
	banos integer not null default 1,
	estacionamientos integer not null default 0,
	piso integer,
	amoblado boolean not null default false,
	caracteristicas jsonb not null default '[]'::jsonb,
	direccion text not null,
	zona_id uuid not null references public.zonas (id) on delete restrict,
	proveedor_id uuid not null references public.proveedores (id) on delete restrict,
	fecha_disponibilidad timestamptz not null default now(),
	costo_publicacion numeric(12,2) not null default 0,
	agente_id uuid references public.vendedores (perfil_id) on delete set null,
	publicado_el timestamptz not null default now(),
	visitas_mes integer not null default 0,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint inmuebles_codigo_no_vacio check (length(trim(codigo)) > 0),
	constraint inmuebles_precio_positivo check (precio > 0),
	constraint inmuebles_m2_positivo check (m2 > 0),
	constraint inmuebles_banos_no_negativos check (banos >= 0),
	constraint inmuebles_estacionamientos_no_negativos check (estacionamientos >= 0),
	constraint inmuebles_visitas_no_negativas check (visitas_mes >= 0),
	constraint inmuebles_costo_publicacion_no_negativo check (costo_publicacion >= 0),
	constraint inmuebles_caracteristicas_array check (jsonb_typeof(caracteristicas) = 'array'),
	-- Regla de negocio: un local no tiene habitaciones (NULL), no "0".
	constraint inmuebles_habitaciones_local check (
		(tipo = 'local' and habitaciones is null)
		or (tipo <> 'local' and habitaciones is not null and habitaciones >= 1)
	)
);

create index inmuebles_estado_idx on public.inmuebles (estado);
create index inmuebles_tipo_idx on public.inmuebles (tipo);
create index inmuebles_zona_idx on public.inmuebles (zona_id);
create index inmuebles_proveedor_idx on public.inmuebles (proveedor_id);
create index inmuebles_agente_idx on public.inmuebles (agente_id);
create index inmuebles_precio_idx on public.inmuebles (precio);
create index inmuebles_destacado_idx on public.inmuebles (destacado) where destacado;
create index inmuebles_publicado_idx on public.inmuebles (publicado_el desc);
create index inmuebles_busqueda_idx
	on public.inmuebles
	using gin (to_tsvector('spanish', titulo || ' ' || descripcion || ' ' || direccion));

comment on table public.inmuebles is
	'Catálogo de inmuebles. habitaciones debe ser NULL cuando tipo = local.';

-- ---------------------------------------------------------------------------
-- Imágenes de inmuebles. `url` sirve para los mocks actuales; `path` será la
-- ruta dentro del bucket Storage `inmuebles`.
-- ---------------------------------------------------------------------------
create table public.inmueble_imagenes (
	id uuid primary key default gen_random_uuid(),
	inmueble_id uuid not null references public.inmuebles (id) on delete cascade,
	path text,
	url text,
	alt text,
	orden integer not null default 0,
	es_portada boolean not null default false,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint inmueble_imagenes_origen check (path is not null or url is not null),
	constraint inmueble_imagenes_orden_no_negativo check (orden >= 0)
);

create index inmueble_imagenes_inmueble_idx
	on public.inmueble_imagenes (inmueble_id, orden);

-- Solo puede haber una portada por inmueble.
create unique index inmueble_imagenes_portada_key
	on public.inmueble_imagenes (inmueble_id)
	where es_portada;

comment on table public.inmueble_imagenes is
	'Fotos del inmueble; una sola es_portada = true por inmueble.';

-- ---------------------------------------------------------------------------
-- Visitas. cliente_id es nullable: un visitante anónimo puede agendar sin
-- cuenta. En ese caso los datos de contacto son obligatorios por CHECK.
-- ---------------------------------------------------------------------------
create table public.visitas (
	id uuid primary key default gen_random_uuid(),
	inmueble_id uuid not null references public.inmuebles (id) on delete restrict,
	cliente_id uuid references public.clientes (perfil_id) on delete restrict,
	nombre_contacto text,
	telefono_contacto text,
	correo_contacto text,
	vendedor_id uuid references public.vendedores (perfil_id) on delete set null,
	fecha_hora timestamptz not null,
	estado public.estado_visita not null default 'pendiente',
	canal public.canal_visita not null default 'web',
	notas text not null default '',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	-- Si no hay cuenta, el contacto es obligatorio.
	constraint visitas_contacto_anonimo check (
		cliente_id is not null
		or (
			nullif(trim(nombre_contacto), '') is not null
			and nullif(trim(telefono_contacto), '') is not null
			and nullif(trim(correo_contacto), '') is not null
		)
	)
);

create index visitas_inmueble_idx on public.visitas (inmueble_id);
create index visitas_cliente_idx on public.visitas (cliente_id);
create index visitas_vendedor_idx on public.visitas (vendedor_id);
create index visitas_fecha_idx on public.visitas (fecha_hora);
create index visitas_estado_idx on public.visitas (estado);

-- Evita dos visitas pendientes exactamente en la misma fecha/hora para el
-- mismo inmueble. La RPC agendar_visita además valida solape de ±1 hora.
create unique index visitas_franja_unica
	on public.visitas (inmueble_id, fecha_hora)
	where estado = 'pendiente';

comment on table public.visitas is
	'Citas de visita. Las altas anónimas pasan por agendar_visita().';

-- ---------------------------------------------------------------------------
-- Alquileres. `id` se genera en el cliente para poder subir contrato y
-- comprobante a Storage antes de la transacción de cierre.
-- ---------------------------------------------------------------------------
create table public.alquileres (
	id uuid primary key default gen_random_uuid(),
	numero_contrato text not null unique,
	inmueble_id uuid not null references public.inmuebles (id) on delete restrict,
	cliente_id uuid not null references public.clientes (perfil_id) on delete restrict,
	vendedor_id uuid not null references public.vendedores (perfil_id) on delete restrict,
	fecha_inicio timestamptz not null,
	fecha_fin timestamptz not null,
	duracion_meses integer not null,
	monto_mensual numeric(12,2) not null,
	dia_cobro smallint not null,
	deposito numeric(12,2) not null default 0,
	estado public.estado_alquiler not null default 'vigente',
	contrato_path text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint alquileres_numero_no_vacio check (length(trim(numero_contrato)) > 0),
	constraint alquileres_monto_positivo check (monto_mensual > 0),
	constraint alquileres_deposito_no_negativo check (deposito >= 0),
	constraint alquileres_duracion_valida check (duracion_meses between 1 and 120),
	constraint alquileres_dia_cobro_valido check (dia_cobro between 1 and 28),
	constraint alquileres_fechas_coherentes check (fecha_fin > fecha_inicio)
);

create index alquileres_inmueble_idx on public.alquileres (inmueble_id);
create index alquileres_cliente_idx on public.alquileres (cliente_id);
create index alquileres_vendedor_idx on public.alquileres (vendedor_id);
create index alquileres_estado_idx on public.alquileres (estado);
create index alquileres_inicio_idx on public.alquileres (fecha_inicio desc);

-- Regla de integridad central: un inmueble solo puede tener un alquiler
-- vigente a la vez. `suspendido` no cuenta (se conserva el contrato pero no
-- bloquea un nuevo cierre); documentado en docs/PROGRESS.md.
create unique index alquileres_un_vigente_por_inmueble
	on public.alquileres (inmueble_id)
	where estado = 'vigente';

comment on table public.alquileres is
	'Contratos de alquiler. Un solo estado vigente por inmueble.';

-- ---------------------------------------------------------------------------
-- Cronograma de cuotas. El estado "por vencer" NO se guarda: se deriva en
-- v_cuotas_estado (0006) según fecha_vencimiento y configuración.
-- ---------------------------------------------------------------------------
create table public.cuotas (
	id uuid primary key default gen_random_uuid(),
	alquiler_id uuid not null references public.alquileres (id) on delete cascade,
	numero integer not null,
	fecha_vencimiento timestamptz not null,
	monto numeric(12,2) not null,
	recargo_mora numeric(12,2) not null default 0,
	estado public.estado_cuota not null default 'pendiente',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint cuotas_numero_positivo check (numero > 0),
	constraint cuotas_monto_positivo check (monto > 0),
	constraint cuotas_recargo_no_negativo check (recargo_mora >= 0),
	constraint cuotas_alquiler_numero_key unique (alquiler_id, numero)
);

create index cuotas_alquiler_idx on public.cuotas (alquiler_id);
create index cuotas_estado_idx on public.cuotas (estado);
create index cuotas_vencimiento_idx on public.cuotas (fecha_vencimiento);
create index cuotas_pendientes_idx
	on public.cuotas (fecha_vencimiento)
	where estado in ('pendiente', 'en_mora');

comment on table public.cuotas is
	'Cronograma mensual generado por registrar_alquiler().';

-- ---------------------------------------------------------------------------
-- Pagos. Un pago de cuota referencia su cuota; el índice único evita cobrar
-- dos veces la misma cuota. Los pagos de cierre pueden o no referenciar la
-- primera cuota (si el monto la cubre).
-- ---------------------------------------------------------------------------
create table public.pagos (
	id uuid primary key default gen_random_uuid(),
	alquiler_id uuid not null references public.alquileres (id) on delete restrict,
	cuota_id uuid references public.cuotas (id) on delete set null,
	tipo public.tipo_pago not null,
	monto numeric(12,2) not null,
	medio public.medio_pago not null,
	fecha_pago timestamptz not null default now(),
	comprobante_path text,
	registrado_por uuid references public.perfiles (id) on delete set null,
	validado boolean not null default false,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint pagos_monto_positivo check (monto > 0),
	-- Un pago de cuota siempre debe indicar la cuota; un cierre puede no
	-- indicarla (por ejemplo, si solo cubre gastos administrativos).
	constraint pagos_cuota_requerida check (
		tipo = 'cierre' or (tipo = 'cuota' and cuota_id is not null)
	)
);

create index pagos_alquiler_idx on public.pagos (alquiler_id);
create index pagos_cuota_idx on public.pagos (cuota_id);
create index pagos_fecha_idx on public.pagos (fecha_pago desc);
create index pagos_registrado_por_idx on public.pagos (registrado_por);

-- Una cuota solo puede tener un pago asociado.
create unique index pagos_cuota_unica
	on public.pagos (cuota_id)
	where cuota_id is not null;

comment on table public.pagos is
	'Pagos de cierre y de cuotas. cuota_id único cuando no es NULL.';

-- ---------------------------------------------------------------------------
-- Comisiones. `monto` es snapshot de vendedores.comision_fija al cerrar.
-- Una comisión por alquiler.
-- ---------------------------------------------------------------------------
create table public.comisiones (
	id uuid primary key default gen_random_uuid(),
	vendedor_id uuid not null references public.vendedores (perfil_id) on delete restrict,
	alquiler_id uuid not null unique references public.alquileres (id) on delete restrict,
	monto numeric(12,2) not null,
	fecha timestamptz not null default now(),
	estado public.estado_comision not null default 'pendiente',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint comisiones_monto_no_negativo check (monto >= 0)
);

create index comisiones_vendedor_idx on public.comisiones (vendedor_id);
create index comisiones_estado_idx on public.comisiones (estado);

comment on table public.comisiones is
	'Comisión fija del vendedor; el monto no cambia si luego se edita la tarifa.';

-- ---------------------------------------------------------------------------
-- Notificaciones internas. El índice único permite que los jobs de mora no
-- dupliquen avisos para la misma cuota.
-- ---------------------------------------------------------------------------
create table public.notificaciones (
	id uuid primary key default gen_random_uuid(),
	perfil_id uuid not null references public.perfiles (id) on delete cascade,
	tipo public.tipo_notificacion not null,
	titulo text not null,
	mensaje text not null,
	leida boolean not null default false,
	referencia text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index notificaciones_perfil_idx
	on public.notificaciones (perfil_id, leida, created_at desc);
create index notificaciones_referencia_idx
	on public.notificaciones (referencia);

create unique index notificaciones_dedupe_key
	on public.notificaciones (perfil_id, tipo, referencia)
	where referencia is not null;

comment on table public.notificaciones is
	'Avisos internos. (perfil_id, tipo, referencia) evita duplicados.';

-- ---------------------------------------------------------------------------
-- Configuración global: una única fila (id = 1). Los valores son supuestos
-- del prototipo y se pueden editar desde el panel administrador.
-- ---------------------------------------------------------------------------
create table public.configuracion (
	id smallint primary key default 1,
	recargo_mora_porcentaje numeric(5,2) not null default 5.00,
	dias_gracia smallint not null default 5,
	dias_aviso_previo smallint not null default 5,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint configuracion_fila_unica check (id = 1),
	constraint configuracion_mora_valida check (recargo_mora_porcentaje between 0 and 100),
	constraint configuracion_gracia_valida check (dias_gracia between 0 and 60),
	constraint configuracion_aviso_valido check (dias_aviso_previo between 0 and 60)
);

insert into public.configuracion (id)
values (1)
on conflict (id) do nothing;

comment on table public.configuracion is
	'Parámetros editables. Supuestos iniciales: mora 5 %, gracia 5 días, aviso 5 días.';

-- ---------------------------------------------------------------------------
-- Auditoría. Guarda snapshots JSON de los cambios sensibles.
-- `fecha` es el instante del evento; created_at/updated_at mantienen la
-- convención global y permiten futuras extensiones.
-- ---------------------------------------------------------------------------
create table public.auditoria (
	id uuid primary key default gen_random_uuid(),
	tabla text not null,
	registro_id text not null,
	accion text not null,
	datos_anteriores jsonb,
	datos_nuevos jsonb,
	actor_id uuid references public.perfiles (id) on delete set null,
	fecha timestamptz not null default now(),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint auditoria_accion_valida check (accion in ('INSERT', 'UPDATE', 'DELETE'))
);

create index auditoria_tabla_registro_idx on public.auditoria (tabla, registro_id);
create index auditoria_fecha_idx on public.auditoria (fecha desc);
create index auditoria_actor_idx on public.auditoria (actor_id);

comment on table public.auditoria is
	'Bitácora de cambios de inmuebles, alquileres, pagos, roles y comisiones.';

-- ---------------------------------------------------------------------------
-- Contador de contratos por año. Se usa desde siguiente_numero_contrato().
-- ---------------------------------------------------------------------------
create table public.contador_contratos (
	anio smallint primary key,
	ultimo integer not null default 0,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	constraint contador_contratos_ultimo_no_negativo check (ultimo >= 0)
);

comment on table public.contador_contratos is
	'Contador atómico para numero_contrato con formato RMX-YYYY-0001.';

-- ----------------------------------------------------------------------------
-- 0003_funciones_y_triggers.sql
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 0004_rls.sql
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 0005_storage.sql
-- ----------------------------------------------------------------------------
-- ============================================================================
-- RE/MAX Potosí · 0005 · Storage
-- ============================================================================
-- Buckets:
--   * inmuebles    → público (fotos del catálogo)             8 MB, imágenes
--   * contratos    → privado (PDF firmado)                   15 MB, PDF
--   * comprobantes → privado (foto/PDF del pago)             10 MB, imágenes/PDF
--
-- Convención para los buckets privados: `{alquiler_id}/archivo`. La primera
-- carpeta debe ser el UUID del alquiler; las políticas lo validan antes de
-- permitir la lectura/escritura.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Buckets y límites
-- ---------------------------------------------------------------------------
insert into storage.buckets (
	id,
	name,
	public,
	file_size_limit,
	allowed_mime_types
)
values
	(
		'inmuebles',
		'inmuebles',
		true,
		8388608,
		array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
	),
	(
		'contratos',
		'contratos',
		false,
		15728640,
		array['application/pdf']
	),
	(
		'comprobantes',
		'comprobantes',
		false,
		10485760,
		array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
	)
on conflict (id) do update
set name = excluded.name,
	public = excluded.public,
	file_size_limit = excluded.file_size_limit,
	allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- 2. Helpers de ruta
-- ---------------------------------------------------------------------------
create or replace function public.alquiler_id_de_archivo(p_name text)
returns uuid
language plpgsql
immutable
security definer
set search_path = ''
as $$
declare
	v_primer_segmento text;
	v_id uuid;
begin
	v_primer_segmento := split_part(coalesce(p_name, ''), '/', 1);

	if v_primer_segmento = '' then
		return null;
	end if;

	begin
		v_id := v_primer_segmento::uuid;
	exception
		when invalid_text_representation then
			return null;
	end;

	return v_id;
end;
$$;

create or replace function public.puede_ver_archivo_alquiler(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
	select public.puede_ver_alquiler(public.alquiler_id_de_archivo(p_name));
$$;

create or replace function public.puede_editar_archivo_alquiler(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
	select public.is_admin()
		or public.es_vendedor_de_alquiler(public.alquiler_id_de_archivo(p_name));
$$;

-- Para el wizard de cierre, el vendedor sube el contrato antes de que exista
-- la fila de `alquileres` (el UUID se genera en el cliente). Se permite crear
-- el objeto si el alquiler aún no existe; si ya existe, solo su vendedor.
create or replace function public.puede_subir_archivo_alquiler(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
	v_alquiler_id uuid := public.alquiler_id_de_archivo(p_name);
begin
	if v_alquiler_id is null then
		return false;
	end if;

	return public.is_admin()
		or (
			public.is_vendedor()
			and (
				not exists (
					select 1
					from public.alquileres a
					where a.id = v_alquiler_id
				)
				or public.es_vendedor_de_alquiler(v_alquiler_id)
			)
		);
end;
$$;

comment on function public.alquiler_id_de_archivo(text) is
	'Extrae el UUID de la primera carpeta de una ruta Storage; NULL si no es válida.';
comment on function public.puede_ver_archivo_alquiler(text) is
	'Lectura de contratos/comprobantes: admin, vendedor o cliente del alquiler.';
comment on function public.puede_editar_archivo_alquiler(text) is
	'Edición/borrado de contratos/comprobantes: admin o vendedor del alquiler.';
comment on function public.puede_subir_archivo_alquiler(text) is
	'Alta de contratos/comprobantes: admin, o vendedor si el alquiler es suyo o aún no existe (wizard).';

-- ---------------------------------------------------------------------------
-- 3. Políticas de Storage
-- ---------------------------------------------------------------------------
-- Bucket público del catálogo. La lectura por URL pública no requiere política,
-- pero sí para listar y para las operaciones autenticadas.
drop policy if exists remax_inmuebles_lectura on storage.objects;
create policy remax_inmuebles_lectura on storage.objects
	for select to anon, authenticated
	using (bucket_id = 'inmuebles');

drop policy if exists remax_inmuebles_escritura on storage.objects;
create policy remax_inmuebles_escritura on storage.objects
	for insert to authenticated
	with check (
		bucket_id = 'inmuebles'
		and (public.is_admin() or public.is_vendedor())
	);

drop policy if exists remax_inmuebles_actualizacion on storage.objects;
create policy remax_inmuebles_actualizacion on storage.objects
	for update to authenticated
	using (
		bucket_id = 'inmuebles'
		and (public.is_admin() or public.is_vendedor())
	)
	with check (
		bucket_id = 'inmuebles'
		and (public.is_admin() or public.is_vendedor())
	);

drop policy if exists remax_inmuebles_borrado on storage.objects;
create policy remax_inmuebles_borrado on storage.objects
	for delete to authenticated
	using (
		bucket_id = 'inmuebles'
		and (public.is_admin() or public.is_vendedor())
	);

-- Contratos: lectura para admin, vendedor del alquiler y cliente del alquiler.
drop policy if exists remax_contratos_lectura on storage.objects;
create policy remax_contratos_lectura on storage.objects
	for select to authenticated
	using (
		bucket_id = 'contratos'
		and public.puede_ver_archivo_alquiler(name)
	);

drop policy if exists remax_contratos_escritura on storage.objects;
create policy remax_contratos_escritura on storage.objects
	for insert to authenticated
	with check (
		bucket_id = 'contratos'
		and public.puede_subir_archivo_alquiler(name)
	);

drop policy if exists remax_contratos_actualizacion on storage.objects;
create policy remax_contratos_actualizacion on storage.objects
	for update to authenticated
	using (
		bucket_id = 'contratos'
		and public.puede_editar_archivo_alquiler(name)
	)
	with check (
		bucket_id = 'contratos'
		and public.puede_editar_archivo_alquiler(name)
	);

drop policy if exists remax_contratos_borrado on storage.objects;
create policy remax_contratos_borrado on storage.objects
	for delete to authenticated
	using (
		bucket_id = 'contratos'
		and public.puede_editar_archivo_alquiler(name)
	);

-- Comprobantes: mismas reglas que contratos.
drop policy if exists remax_comprobantes_lectura on storage.objects;
create policy remax_comprobantes_lectura on storage.objects
	for select to authenticated
	using (
		bucket_id = 'comprobantes'
		and public.puede_ver_archivo_alquiler(name)
	);

drop policy if exists remax_comprobantes_escritura on storage.objects;
create policy remax_comprobantes_escritura on storage.objects
	for insert to authenticated
	with check (
		bucket_id = 'comprobantes'
		and public.puede_subir_archivo_alquiler(name)
	);

drop policy if exists remax_comprobantes_actualizacion on storage.objects;
create policy remax_comprobantes_actualizacion on storage.objects
	for update to authenticated
	using (
		bucket_id = 'comprobantes'
		and public.puede_editar_archivo_alquiler(name)
	)
	with check (
		bucket_id = 'comprobantes'
		and public.puede_editar_archivo_alquiler(name)
	);

drop policy if exists remax_comprobantes_borrado on storage.objects;
create policy remax_comprobantes_borrado on storage.objects
	for delete to authenticated
	using (
		bucket_id = 'comprobantes'
		and public.puede_editar_archivo_alquiler(name)
	);

-- ---------------------------------------------------------------------------
-- 4. Permisos de ejecución
-- ---------------------------------------------------------------------------
revoke all on function public.alquiler_id_de_archivo(text) from public;
revoke all on function public.puede_ver_archivo_alquiler(text) from public;
revoke all on function public.puede_editar_archivo_alquiler(text) from public;
revoke all on function public.puede_subir_archivo_alquiler(text) from public;

grant execute on function public.alquiler_id_de_archivo(text) to authenticated, service_role;
grant execute on function public.puede_ver_archivo_alquiler(text) to authenticated, service_role;
grant execute on function public.puede_editar_archivo_alquiler(text) to authenticated, service_role;
grant execute on function public.puede_subir_archivo_alquiler(text) to authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 0006_vistas.sql
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 0007_cron.sql
-- ----------------------------------------------------------------------------
-- ============================================================================
-- RE/MAX Potosí · 0007 · pg_cron
-- ============================================================================
-- Este archivo se numera 0007 para reservar 0004 (RLS), 0005 (Storage) y
-- 0006 (vistas) a los entregables siguientes. Puede ejecutarse antes o después
-- de esas migraciones: solo depende de la función actualizar_estado_cuotas().
--
-- 04:05 UTC = 00:05 America/La_Paz (UTC-4, sin horario de verano).
-- ============================================================================

create extension if not exists pg_cron;

-- Re-crear el job de forma idempotente si ya existía.
do $$
begin
	if exists (
		select 1
		from cron.job
		where jobname = 'remax-actualizar-cuotas'
	) then
		perform cron.unschedule('remax-actualizar-cuotas');
	end if;
end
$$;

select cron.schedule(
	'remax-actualizar-cuotas',
	'5 4 * * *',
	$$select public.actualizar_estado_cuotas();$$
);

comment on extension pg_cron is
	'Programa el job diario de mora y avisos de cuotas de RE/MAX Potosí.';

-- ----------------------------------------------------------------------------
-- 0008_cambio_password_inicial.sql
-- ----------------------------------------------------------------------------
-- ---------------------------------------------------------------------------
-- 0008 · Cambio de contraseña obligatorio
-- ---------------------------------------------------------------------------
-- Las cuentas creadas por backend nacen con `debe_cambiar_password = true`.
-- El trigger `perfiles_proteger_campos` impide que el propio usuario limpie esa
-- bandera con un UPDATE directo. Se agrega una RPC que solo autoriza al dueño
-- de la sesión y marca la limpieza dentro de la misma transacción.
-- ---------------------------------------------------------------------------

-- Se conserva la protección de `activo` y `correo`; se permite únicamente el
-- paso `true → false` de la bandera, y solo cuando lo hace la RPC de abajo
-- (marca local `app.password_actualizada`).
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
		then
			raise exception 'Solo un administrador puede cambiar el estado o el correo del perfil.'
				using errcode = '42501';
		end if;

		if new.debe_cambiar_password is distinct from old.debe_cambiar_password
			and not (
				old.debe_cambiar_password
				and not new.debe_cambiar_password
				and coalesce(current_setting('app.password_actualizada', true), '') = 'on'
			)
		then
			raise exception 'La bandera de contraseña temporal solo la puede limpiar la RPC de cambio.'
				using errcode = '42501';
		end if;
	end if;
	return new;
end;
$$;

comment on function public.proteger_campos_perfil() is
	'Protege activo/correo y la bandera de contraseña temporal; permite limpiarla solo vía marcar_password_actualizada().';

-- Limpia la bandera del perfil autenticado. La contraseña se cambia antes con
-- Supabase Auth (`auth.updateUser`) desde la server function.
create or replace function public.marcar_password_actualizada()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
	if auth.uid() is null then
		raise exception 'Debes iniciar sesión para actualizar la contraseña.'
			using errcode = '42501';
	end if;

	perform set_config('app.password_actualizada', 'on', true);

	update public.perfiles
	set debe_cambiar_password = false
	where id = auth.uid();
end;
$$;

comment on function public.marcar_password_actualizada() is
	'Marca la contraseña temporal como actualizada para el usuario autenticado.';

revoke all on function public.marcar_password_actualizada() from public;
revoke all on function public.marcar_password_actualizada() from anon;
grant execute on function public.marcar_password_actualizada() to authenticated;

-- ----------------------------------------------------------------------------
-- 0009_fase5_seguridad_y_publico.sql
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 0010_storage_inmuebles_por_agente.sql
-- ----------------------------------------------------------------------------
-- ---------------------------------------------------------------------------
-- 0010 · Fase 5 · Fotos de inmuebles limitadas al agente asignado
-- ---------------------------------------------------------------------------
-- La política original permitía a cualquier vendedor subir, reemplazar o borrar
-- cualquier objeto del bucket público `inmuebles`. Se restringe la escritura al
-- administrador o al vendedor asignado al inmueble de la primera carpeta.
--
-- La carpeta es `{inmueble_id}/archivo`. Como el bucket es público, la lectura
-- sigue abierta; solo cambian INSERT/UPDATE/DELETE autenticados.
-- ---------------------------------------------------------------------------

create or replace function public.inmueble_id_de_archivo(p_name text)
returns uuid
language plpgsql
immutable
security definer
set search_path = ''
as $$
declare
	v_primer_segmento text;
	v_id uuid;
begin
	v_primer_segmento := split_part(coalesce(p_name, ''), '/', 1);

	if v_primer_segmento = '' then
		return null;
	end if;

	begin
		v_id := v_primer_segmento::uuid;
	exception
		when invalid_text_representation then
			return null;
	end;

	return v_id;
end;
$$;

create or replace function public.es_agente_de_archivo_inmueble(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
	select public.es_agente_de_inmueble(public.inmueble_id_de_archivo(p_name));
$$;

comment on function public.inmueble_id_de_archivo(text) is
	'Extrae el UUID del inmueble de la primera carpeta de un objeto de Storage.';
comment on function public.es_agente_de_archivo_inmueble(text) is
	'Verdadero si la sesión es el agente asignado al inmueble de la ruta.';

drop policy if exists remax_inmuebles_escritura on storage.objects;
create policy remax_inmuebles_escritura on storage.objects
	for insert to authenticated
	with check (
		bucket_id = 'inmuebles'
		and (
			public.is_admin()
			or (
				public.is_vendedor()
				and public.es_agente_de_archivo_inmueble(name)
			)
		)
	);

drop policy if exists remax_inmuebles_actualizacion on storage.objects;
create policy remax_inmuebles_actualizacion on storage.objects
	for update to authenticated
	using (
		bucket_id = 'inmuebles'
		and (
			public.is_admin()
			or (
				public.is_vendedor()
				and public.es_agente_de_archivo_inmueble(name)
			)
		)
	)
	with check (
		bucket_id = 'inmuebles'
		and (
			public.is_admin()
			or (
				public.is_vendedor()
				and public.es_agente_de_archivo_inmueble(name)
			)
		)
	);

drop policy if exists remax_inmuebles_borrado on storage.objects;
create policy remax_inmuebles_borrado on storage.objects
	for delete to authenticated
	using (
		bucket_id = 'inmuebles'
		and (
			public.is_admin()
			or (
				public.is_vendedor()
				and public.es_agente_de_archivo_inmueble(name)
			)
		)
	);

revoke all on function public.inmueble_id_de_archivo(text) from public;
revoke all on function public.es_agente_de_archivo_inmueble(text) from public;
grant execute on function public.inmueble_id_de_archivo(text) to authenticated, service_role;
grant execute on function public.es_agente_de_archivo_inmueble(text) to authenticated, service_role;

