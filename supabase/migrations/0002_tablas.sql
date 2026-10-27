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
