-- ============================================================================
-- RE/MAX Potosí · seed de desarrollo
-- ============================================================================
-- Convierte los mocks de src/data/ a datos relacionales con UUID estables.
--
-- Orden recomendado:
--   1. pnpm db:seed-users   (crea los 3 usuarios demo con la Admin API)
--   2. ejecutar este archivo en el editor SQL de Supabase
--
-- Si los usuarios demo aún no existen, el bloque transaccional (visitas,
-- alquileres, cuotas, pagos y comisiones) se omite con un NOTICE; el catálogo
-- sí se carga. Vuelve a ejecutar el seed después de crear los usuarios.
--
-- Relaciones de los mocks: como solo hay un vendedor y un cliente demo, todas
-- las visitas/alquileres se asignan a ellos. Los demás clientes/vendedores de
-- los mocks no tienen cuenta de Auth y no se insertan como perfiles.
--
-- Cuentas demo (el seed-users.ts las crea):
--   admin:     rodrigo.alvarez@remaxpotosi.bo
--   vendedor:  carla.mendoza@remaxpotosi.bo
--   cliente:   luis.catari@gmail.com
--   password:  RemaxDemo#2026 (solo desarrollo)
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Zonas
-- ---------------------------------------------------------------------------
insert into public.zonas (id, nombre, sector, slug, activo, created_at, updated_at)
values
	('00000000-0000-4000-8000-000000000001', 'Centro histórico', 'Centro', 'centro-historico', true, now(), now()),
	('00000000-0000-4000-8000-000000000002', 'Zona Universitaria', 'Sur', 'zona-universitaria', true, now(), now()),
	('00000000-0000-4000-8000-000000000003', 'San Clemente', 'Sur', 'san-clemente', true, now(), now()),
	('00000000-0000-4000-8000-000000000004', 'Pailaviri', 'Sur', 'pailaviri', true, now(), now()),
	('00000000-0000-4000-8000-000000000005', 'Av. Las Banderas', 'Norte', 'av-las-banderas', true, now(), now()),
	('00000000-0000-4000-8000-000000000006', 'Av. Cívica', 'Centro', 'av-civica', true, now(), now()),
	('00000000-0000-4000-8000-000000000007', 'Villa Imperial', 'Norte', 'villa-imperial', true, now(), now()),
	('00000000-0000-4000-8000-000000000008', 'Alto Potosí', 'Norte', 'alto-potosi', true, now(), now())
on conflict (id) do update
set nombre = excluded.nombre,
	sector = excluded.sector,
	slug = excluded.slug,
	activo = excluded.activo;

-- ---------------------------------------------------------------------------
-- Proveedores
-- ---------------------------------------------------------------------------
insert into public.proveedores (id, nombre, telefono, correo, tipo, ciudad, zona_principal_id, activo, created_at, updated_at)
values
	('10000000-0000-4000-8000-000000000001', 'Familia Gutiérrez Baldivieso', '+591 71987654', 'gutierrez.baldivieso@gmail.com', 'persona', 'Potosí', '00000000-0000-4000-8000-000000000003', true, '2023-04-18T12:00:00-04:00'::timestamptz, now()),
	('10000000-0000-4000-8000-000000000002', 'Inversiones Cerro Rico S.R.L.', '+591 62233445', 'contacto@invcerrorico.bo', 'empresa', 'Potosí', '00000000-0000-4000-8000-000000000001', true, '2022-11-02T12:00:00-04:00'::timestamptz, now()),
	('10000000-0000-4000-8000-000000000003', 'Sra. Rosa Villca Apaza', '+591 72876543', 'rosa.villca@gmail.com', 'persona', 'Potosí', '00000000-0000-4000-8000-000000000002', true, '2023-07-25T12:00:00-04:00'::timestamptz, now()),
	('10000000-0000-4000-8000-000000000004', 'Constructora Sumaj Orcko', '+591 62443556', 'ventas@sumajorcko.bo', 'empresa', 'Potosí', '00000000-0000-4000-8000-000000000006', true, '2021-09-14T12:00:00-04:00'::timestamptz, now()),
	('10000000-0000-4000-8000-000000000005', 'Sr. Miguel Ángel Fernández Cruz', '+591 73765432', 'miguel.fernandez@gmail.com', 'persona', 'Potosí', '00000000-0000-4000-8000-000000000004', true, '2023-01-30T12:00:00-04:00'::timestamptz, now()),
	('10000000-0000-4000-8000-000000000006', 'Doña Elena Tórrez Villarpando', '+591 74654321', 'elena.torrez@hotmail.com', 'persona', 'Potosí', '00000000-0000-4000-8000-000000000007', true, '2024-02-11T12:00:00-04:00'::timestamptz, now()),
	('10000000-0000-4000-8000-000000000007', 'Bienes Raíces Kantuta S.A.', '+591 62556677', 'gerencia@kantuta.bo', 'empresa', 'Potosí', '00000000-0000-4000-8000-000000000008', true, '2022-05-19T12:00:00-04:00'::timestamptz, now()),
	('10000000-0000-4000-8000-000000000008', 'Sr. Freddy Choque Nina', '+591 75778899', null, 'persona', 'Potosí', '00000000-0000-4000-8000-000000000005', false, '2023-10-08T12:00:00-04:00'::timestamptz, now()),
	('10000000-0000-4000-8000-000000000009', 'Sra. Juana Mamani Condori', '+591 76889900', 'juana.mamani.condori@gmail.com', 'persona', 'Potosí', '00000000-0000-4000-8000-000000000001', true, '2024-06-22T12:00:00-04:00'::timestamptz, now()),
	('10000000-0000-4000-8000-000000000010', 'Grupo Inmobiliario San Bernardo', '+591 62667788', 'info@gsanbernardo.bo', 'empresa', 'Potosí', '00000000-0000-4000-8000-000000000003', true, '2021-03-05T12:00:00-04:00'::timestamptz, now()),
	('10000000-0000-4000-8000-000000000011', 'Sr. Wilson Aruquipa Blanco', '+591 77990011', 'wilson.aruquipa@gmail.com', 'persona', 'Potosí', '00000000-0000-4000-8000-000000000002', true, '2024-09-16T12:00:00-04:00'::timestamptz, now())
on conflict (id) do update
set nombre = excluded.nombre,
	telefono = excluded.telefono,
	correo = excluded.correo,
	tipo = excluded.tipo,
	ciudad = excluded.ciudad,
	zona_principal_id = excluded.zona_principal_id,
	activo = excluded.activo;

-- ---------------------------------------------------------------------------
-- Inmuebles
-- ---------------------------------------------------------------------------
insert into public.inmuebles (
	id, codigo, titulo, tipo, estado, destacado, descripcion, precio, m2,
	habitaciones, banos, estacionamientos, piso, amoblado, caracteristicas,
	direccion, zona_id, proveedor_id, agente_id, fecha_disponibilidad,
	costo_publicacion, publicado_el, visitas_mes, created_at, updated_at
)
values
	('20000000-0000-4000-8000-000000000001', 'PT-1001', 'Casa familiar con patio en San Clemente', 'casa', 'disponible', true, 'Amplia casa de dos plantas con patio interior de adobe restaurado y vista parcial al Cerro Rico desde la terraza. Ideal para familias. Incluye cocina equipada, lavandería y garaje para un vehículo.', 3200, 220, 4, 3, 1, null, false, '["Patio interior","Garaje","Vista al Cerro Rico","Cocina equipada","Lavandería","Calefacción a gas"]'::jsonb, 'Calle Bustillos Nº 145, San Clemente', '00000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', (
	select v.perfil_id
	from public.vendedores v
	join auth.users u on u.id = v.perfil_id
	where lower(u.email) = lower('carla.mendoza@remaxpotosi.bo')
	limit 1
), '2026-11-01T12:00:00-04:00'::timestamptz, 350, '2026-09-12T12:00:00-04:00'::timestamptz, 148, '2026-09-12T12:00:00-04:00'::timestamptz, now()),
	('20000000-0000-4000-8000-000000000002', 'PT-1002', 'Departamento moderno en Av. Villazón', 'departamento', 'disponible', true, 'Departamento luminoso a pasos de la Plaza 10 de Noviembre. Ventanales con doble vidrio, piso flotante y balcón con vista a los tejados del centro histórico. Edificio con ascensor y portero.', 2400, 95, 3, 2, 1, 5, true, '["Ascensor","Balcón","Portero 24h","Piso flotante","Doble vidrio","Amoblado"]'::jsonb, 'Av. Villazón Nº 220, piso 5', '00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', (
	select v.perfil_id
	from public.vendedores v
	join auth.users u on u.id = v.perfil_id
	where lower(u.email) = lower('carla.mendoza@remaxpotosi.bo')
	limit 1
), '2026-10-25T12:00:00-04:00'::timestamptz, 300, '2026-09-20T12:00:00-04:00'::timestamptz, 203, '2026-09-20T12:00:00-04:00'::timestamptz, now()),
	('20000000-0000-4000-8000-000000000003', 'PT-1003', 'Local comercial sobre Av. Universitaria', 'local', 'en_alquiler', false, 'Local a la calle con vitrina de 6 metros, alto tránsito de estudiantes durante todo el año. Apto para cafetería, farmacia o tienda de servicios. Cuenta con depósito y dos parqueos.', 4500, 110, null, 1, 2, 0, false, '["Vitrina a la calle","Depósito","Baño privado","Dos parqueos","Alta circulación"]'::jsonb, 'Av. Universitaria Nº 88, planta baja', '00000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000004', (
	select v.perfil_id
	from public.vendedores v
	join auth.users u on u.id = v.perfil_id
	where lower(u.email) = lower('carla.mendoza@remaxpotosi.bo')
	limit 1
), '2026-11-10T12:00:00-04:00'::timestamptz, 500, '2026-09-05T12:00:00-04:00'::timestamptz, 76, '2026-09-05T12:00:00-04:00'::timestamptz, now()),
	('20000000-0000-4000-8000-000000000004', 'PT-1004', 'Departamento con garaje en Av. Las Banderas', 'departamento', 'reservado', false, 'Departamento de dos dormitorios con garaje cubierto y vista abierta hacia el macizo del Cerro Rico. Edificio nuevo con todos los servicios y entrega inmediata. Reserva confirmada, sujeto a contrato.', 1800, 78, 2, 1, 1, 3, false, '["Garaje cubierto","Vista panorámica","Entrega inmediata","Acceso asfaltado"]'::jsonb, 'Av. Las Banderas, zona norte, edificio Illimani piso 3', '00000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000008', (
	select v.perfil_id
	from public.vendedores v
	join auth.users u on u.id = v.perfil_id
	where lower(u.email) = lower('carla.mendoza@remaxpotosi.bo')
	limit 1
), '2026-10-20T12:00:00-04:00'::timestamptz, 250, '2026-08-28T12:00:00-04:00'::timestamptz, 54, '2026-08-28T12:00:00-04:00'::timestamptz, now()),
	('20000000-0000-4000-8000-000000000005', 'PT-1005', 'Dúplex amoblado en Zona Universitaria', 'departamento', 'en_alquiler', true, 'Dúplex completamente amoblado, a cinco minutos a pie de la Universidad Autónoma Tomás Frías. Perfecto para docentes o familias pequeñas. Incluye electrodomésticos y conexión de internet instalada.', 2750, 120, 3, 2, 1, 2, true, '["Amoblado completo","Internet instalado","Cocina equipada","Garaje","Seguridad"]'::jsonb, 'Calle Hoyos Nº 340', '00000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', (
	select v.perfil_id
	from public.vendedores v
	join auth.users u on u.id = v.perfil_id
	where lower(u.email) = lower('carla.mendoza@remaxpotosi.bo')
	limit 1
), '2026-11-05T12:00:00-04:00'::timestamptz, 320, '2026-09-18T12:00:00-04:00'::timestamptz, 167, '2026-09-18T12:00:00-04:00'::timestamptz, now()),
	('20000000-0000-4000-8000-000000000006', 'PT-1006', 'Casa señorial renovada en Pailaviri', 'casa', 'en_alquiler', false, 'Casa de estilo señorial recientemente renovada, con zaguán de piedra, tres patios y galería. Muy cerca del mirador de Pailaviri y del acceso al Cerro Rico. Excelente para residencia familiar numerosa.', 3900, 260, 5, 3, 2, null, false, '["Zaguán de piedra","Tres patios","Doble garaje","Galería","Chimenea"]'::jsonb, 'Calle Pailaviri Nº 12', '00000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000005', (
	select v.perfil_id
	from public.vendedores v
	join auth.users u on u.id = v.perfil_id
	where lower(u.email) = lower('carla.mendoza@remaxpotosi.bo')
	limit 1
), '2026-08-01T12:00:00-04:00'::timestamptz, 420, '2026-06-14T12:00:00-04:00'::timestamptz, 98, '2026-06-14T12:00:00-04:00'::timestamptz, now()),
	('20000000-0000-4000-8000-000000000007', 'PT-1007', 'Monoambiente céntrico en Calle Bolívar', 'departamento', 'disponible', false, 'Monoambiente ideal para estudiantes o profesionales. Totalmente amoblado, a dos cuadras del Mercado Central y del centro comercial. Cocina compacta y baño con ducha eléctrica.', 1500, 48, 1, 1, 0, 2, true, '["Amoblado","Ducha eléctrica","Cocina compacta","Céntrico"]'::jsonb, 'Calle Bolívar Nº 401, piso 2', '00000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000009', (
	select v.perfil_id
	from public.vendedores v
	join auth.users u on u.id = v.perfil_id
	where lower(u.email) = lower('carla.mendoza@remaxpotosi.bo')
	limit 1
), '2026-10-18T12:00:00-04:00'::timestamptz, 200, '2026-09-30T12:00:00-04:00'::timestamptz, 221, '2026-09-30T12:00:00-04:00'::timestamptz, now()),
	('20000000-0000-4000-8000-000000000008', 'PT-1008', 'Casa de campo en Villa Imperial', 'casa', 'en_alquiler', false, 'Casa con amplio patio y árboles frutales, aire limpio y silencio a solo diez minutos del centro. Ideal para quienes buscan tranquilidad sin alejarse de la ciudad. Pozo de agua propio.', 2600, 180, 3, 2, 3, null, false, '["Patio amplio","Árboles frutales","Pozo de agua","Tres parqueos","Parrillero"]'::jsonb, 'Camino a Villa Imperial km 3', '00000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000005', (
	select v.perfil_id
	from public.vendedores v
	join auth.users u on u.id = v.perfil_id
	where lower(u.email) = lower('carla.mendoza@remaxpotosi.bo')
	limit 1
), '2026-11-15T12:00:00-04:00'::timestamptz, 280, '2026-09-08T12:00:00-04:00'::timestamptz, 61, '2026-09-08T12:00:00-04:00'::timestamptz, now()),
	('20000000-0000-4000-8000-000000000009', 'PT-1009', 'Oficina equipada en Av. Cívica', 'local', 'en_alquiler', false, 'Oficina lista para operar: sala de reuniones, recepción y cuatro ambientes modulares. Edificio corporativo con ascensor, generador y seguridad. Incluye mobiliario y aire acondicionado.', 3800, 90, null, 2, 2, 4, true, '["Sala de reuniones","Aire acondicionado","Ascensor","Generador","Seguridad","Mobiliario"]'::jsonb, 'Av. Cívica Nº 512, piso 4', '00000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000004', (
	select v.perfil_id
	from public.vendedores v
	join auth.users u on u.id = v.perfil_id
	where lower(u.email) = lower('carla.mendoza@remaxpotosi.bo')
	limit 1
), '2026-09-01T12:00:00-04:00'::timestamptz, 450, '2026-07-22T12:00:00-04:00'::timestamptz, 43, '2026-07-22T12:00:00-04:00'::timestamptz, now()),
	('20000000-0000-4000-8000-000000000010', 'PT-1010', 'Departamento con vista al Cerro Rico', 'departamento', 'en_alquiler', true, 'El inmueble estrella de la cartera: ventanal completo orientado al Cerro Rico que cambia de color con la luz de la tarde. Tres dormitorios, cocina abierta y dos parqueos cubiertos.', 3100, 105, 3, 2, 2, 8, false, '["Vista al Cerro Rico","Dos parqueos","Cocina abierta","Área de lavandería","Salón comunal","Ascensor"]'::jsonb, 'Av. Circunvalación, torre Los Andes, piso 8', '00000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000002', (
	select v.perfil_id
	from public.vendedores v
	join auth.users u on u.id = v.perfil_id
	where lower(u.email) = lower('carla.mendoza@remaxpotosi.bo')
	limit 1
), '2026-11-20T12:00:00-04:00'::timestamptz, 400, '2026-10-01T12:00:00-04:00'::timestamptz, 312, '2026-10-01T12:00:00-04:00'::timestamptz, now()),
	('20000000-0000-4000-8000-000000000011', 'PT-1011', 'Casa en condominio cerrado, San Clemente', 'casa', 'en_alquiler', false, 'Casa de estreno en condominio con áreas verdes, seguridad y salón de eventos. Acabados de primera, jardín propio y quincho. La mejor opción para ejecutivos y familias que valoran privacidad.', 5200, 240, 4, 4, 2, null, false, '["Condominio cerrado","Áreas verdes","Quincho","Seguridad 24h","Jardín propio","Salón de eventos"]'::jsonb, 'Condominio Los Álamos, casa 7', '00000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000004', (
	select v.perfil_id
	from public.vendedores v
	join auth.users u on u.id = v.perfil_id
	where lower(u.email) = lower('carla.mendoza@remaxpotosi.bo')
	limit 1
), '2026-12-01T12:00:00-04:00'::timestamptz, 600, '2026-09-25T12:00:00-04:00'::timestamptz, 88, '2026-09-25T12:00:00-04:00'::timestamptz, now()),
	('20000000-0000-4000-8000-000000000012', 'PT-1012', 'Departamento económico para estudiantes', 'departamento', 'en_alquiler', false, 'Departamento accesible y bien ubicado, a media cuadra de la parada de minibús hacia el centro. Incluye cocina básica y espacio de estudio. Perfecto para estudiantes que comparten.', 1200, 55, 2, 1, 0, 1, false, '["Cocina básica","Espacio de estudio","Bien ubicado","Servicios incluidos"]'::jsonb, 'Calle Oruro Nº 78, piso 1', '00000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000011', (
	select v.perfil_id
	from public.vendedores v
	join auth.users u on u.id = v.perfil_id
	where lower(u.email) = lower('carla.mendoza@remaxpotosi.bo')
	limit 1
), '2026-08-15T12:00:00-04:00'::timestamptz, 180, '2026-07-30T12:00:00-04:00'::timestamptz, 189, '2026-07-30T12:00:00-04:00'::timestamptz, now()),
	('20000000-0000-4000-8000-000000000013', 'PT-1013', 'Local esquinero en Villa Imperial', 'local', 'inactivo', false, 'Amplio local esquinero con dos vitrinas y alto paso peatonal. Actualmente retirado del catálogo público mientras el propietario define las condiciones de arriendo.', 2900, 130, null, 2, 1, 0, false, '["Dos vitrinas","Esquina","Depósito amplio","Baño privado"]'::jsonb, 'Av. Universitaria esquina calle Sucre', '00000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000006', (
	select v.perfil_id
	from public.vendedores v
	join auth.users u on u.id = v.perfil_id
	where lower(u.email) = lower('carla.mendoza@remaxpotosi.bo')
	limit 1
), '2026-12-15T12:00:00-04:00'::timestamptz, 380, '2026-08-10T12:00:00-04:00'::timestamptz, 24, '2026-08-10T12:00:00-04:00'::timestamptz, now()),
	('20000000-0000-4000-8000-000000000014', 'PT-1014', 'Casa con jardín en Alto Potosí', 'casa', 'en_alquiler', false, 'Casa de dos plantas con jardín delantero, quincho y garaje doble. Zona residencial tranquila con transporte diario al centro histórico.', 3400, 210, 4, 3, 2, null, false, '["Jardín delantero","Quincho","Garaje doble","Zona residencial"]'::jsonb, 'Urbanización Los Pinos, calle 4', '00000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000007', (
	select v.perfil_id
	from public.vendedores v
	join auth.users u on u.id = v.perfil_id
	where lower(u.email) = lower('carla.mendoza@remaxpotosi.bo')
	limit 1
), '2026-11-25T12:00:00-04:00'::timestamptz, 360, '2026-09-14T12:00:00-04:00'::timestamptz, 112, '2026-09-14T12:00:00-04:00'::timestamptz, now()),
	('20000000-0000-4000-8000-000000000015', 'PT-1015', 'Oficina amoblada en San Clemente', 'local', 'en_alquiler', false, 'Oficina lista para instalar: recepción, sala de reuniones y tres privados. Incluye mobiliario, internet y dos parqueos. Ideal para consultoras.', 3600, 96, null, 2, 2, 2, true, '["Mobiliario incluido","Internet","Dos parqueos","Sala de reuniones"]'::jsonb, 'Calle Bustillos Nº 210, piso 2', '00000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000010', (
	select v.perfil_id
	from public.vendedores v
	join auth.users u on u.id = v.perfil_id
	where lower(u.email) = lower('carla.mendoza@remaxpotosi.bo')
	limit 1
), '2026-10-28T12:00:00-04:00'::timestamptz, 420, '2026-10-05T12:00:00-04:00'::timestamptz, 67, '2026-10-05T12:00:00-04:00'::timestamptz, now())
on conflict (id) do update
set codigo = excluded.codigo,
	titulo = excluded.titulo,
	tipo = excluded.tipo,
	estado = excluded.estado,
	destacado = excluded.destacado,
	descripcion = excluded.descripcion,
	precio = excluded.precio,
	m2 = excluded.m2,
	habitaciones = excluded.habitaciones,
	banos = excluded.banos,
	estacionamientos = excluded.estacionamientos,
	piso = excluded.piso,
	amoblado = excluded.amoblado,
	caracteristicas = excluded.caracteristicas,
	direccion = excluded.direccion,
	zona_id = excluded.zona_id,
	proveedor_id = excluded.proveedor_id,
	agente_id = excluded.agente_id,
	fecha_disponibilidad = excluded.fecha_disponibilidad,
	costo_publicacion = excluded.costo_publicacion,
	publicado_el = excluded.publicado_el,
	visitas_mes = excluded.visitas_mes;

-- ---------------------------------------------------------------------------
-- Imágenes de inmuebles
-- ---------------------------------------------------------------------------
insert into public.inmueble_imagenes (id, inmueble_id, path, url, alt, orden, es_portada)
values
	(md5('img:20000000-0000-4000-8000-000000000001:0')::uuid, '20000000-0000-4000-8000-000000000001', null, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1400&q=70', 'Casa familiar con patio en San Clemente', 0, true),
	(md5('img:20000000-0000-4000-8000-000000000001:1')::uuid, '20000000-0000-4000-8000-000000000001', null, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=70', 'Casa familiar con patio en San Clemente', 1, false),
	(md5('img:20000000-0000-4000-8000-000000000001:2')::uuid, '20000000-0000-4000-8000-000000000001', null, 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=70', 'Casa familiar con patio en San Clemente', 2, false),
	(md5('img:20000000-0000-4000-8000-000000000001:3')::uuid, '20000000-0000-4000-8000-000000000001', null, 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=70', 'Casa familiar con patio en San Clemente', 3, false),
	(md5('img:20000000-0000-4000-8000-000000000001:4')::uuid, '20000000-0000-4000-8000-000000000001', null, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=70', 'Casa familiar con patio en San Clemente', 4, false),
	(md5('img:20000000-0000-4000-8000-000000000002:0')::uuid, '20000000-0000-4000-8000-000000000002', null, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=70', 'Departamento moderno en Av. Villazón', 0, true),
	(md5('img:20000000-0000-4000-8000-000000000002:1')::uuid, '20000000-0000-4000-8000-000000000002', null, 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1400&q=70', 'Departamento moderno en Av. Villazón', 1, false),
	(md5('img:20000000-0000-4000-8000-000000000002:2')::uuid, '20000000-0000-4000-8000-000000000002', null, 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1400&q=70', 'Departamento moderno en Av. Villazón', 2, false),
	(md5('img:20000000-0000-4000-8000-000000000002:3')::uuid, '20000000-0000-4000-8000-000000000002', null, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=70', 'Departamento moderno en Av. Villazón', 3, false),
	(md5('img:20000000-0000-4000-8000-000000000003:0')::uuid, '20000000-0000-4000-8000-000000000003', null, 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=70', 'Local comercial sobre Av. Universitaria', 0, true),
	(md5('img:20000000-0000-4000-8000-000000000003:1')::uuid, '20000000-0000-4000-8000-000000000003', null, 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1400&q=70', 'Local comercial sobre Av. Universitaria', 1, false),
	(md5('img:20000000-0000-4000-8000-000000000003:2')::uuid, '20000000-0000-4000-8000-000000000003', null, 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=70', 'Local comercial sobre Av. Universitaria', 2, false),
	(md5('img:20000000-0000-4000-8000-000000000004:0')::uuid, '20000000-0000-4000-8000-000000000004', null, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=70', 'Departamento con garaje en Av. Las Banderas', 0, true),
	(md5('img:20000000-0000-4000-8000-000000000004:1')::uuid, '20000000-0000-4000-8000-000000000004', null, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=70', 'Departamento con garaje en Av. Las Banderas', 1, false),
	(md5('img:20000000-0000-4000-8000-000000000005:0')::uuid, '20000000-0000-4000-8000-000000000005', null, 'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=1400&q=70', 'Dúplex amoblado en Zona Universitaria', 0, true),
	(md5('img:20000000-0000-4000-8000-000000000005:1')::uuid, '20000000-0000-4000-8000-000000000005', null, 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=70', 'Dúplex amoblado en Zona Universitaria', 1, false),
	(md5('img:20000000-0000-4000-8000-000000000005:2')::uuid, '20000000-0000-4000-8000-000000000005', null, 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=70', 'Dúplex amoblado en Zona Universitaria', 2, false),
	(md5('img:20000000-0000-4000-8000-000000000005:3')::uuid, '20000000-0000-4000-8000-000000000005', null, 'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?auto=format&fit=crop&w=1400&q=70', 'Dúplex amoblado en Zona Universitaria', 3, false),
	(md5('img:20000000-0000-4000-8000-000000000006:0')::uuid, '20000000-0000-4000-8000-000000000006', null, 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1400&q=70', 'Casa señorial renovada en Pailaviri', 0, true),
	(md5('img:20000000-0000-4000-8000-000000000006:1')::uuid, '20000000-0000-4000-8000-000000000006', null, 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=70', 'Casa señorial renovada en Pailaviri', 1, false),
	(md5('img:20000000-0000-4000-8000-000000000006:2')::uuid, '20000000-0000-4000-8000-000000000006', null, 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1400&q=70', 'Casa señorial renovada en Pailaviri', 2, false),
	(md5('img:20000000-0000-4000-8000-000000000006:3')::uuid, '20000000-0000-4000-8000-000000000006', null, 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1400&q=70', 'Casa señorial renovada en Pailaviri', 3, false),
	(md5('img:20000000-0000-4000-8000-000000000007:0')::uuid, '20000000-0000-4000-8000-000000000007', null, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=70', 'Monoambiente céntrico en Calle Bolívar', 0, true),
	(md5('img:20000000-0000-4000-8000-000000000007:1')::uuid, '20000000-0000-4000-8000-000000000007', null, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=70', 'Monoambiente céntrico en Calle Bolívar', 1, false),
	(md5('img:20000000-0000-4000-8000-000000000007:2')::uuid, '20000000-0000-4000-8000-000000000007', null, 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=70', 'Monoambiente céntrico en Calle Bolívar', 2, false),
	(md5('img:20000000-0000-4000-8000-000000000008:0')::uuid, '20000000-0000-4000-8000-000000000008', null, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=70', 'Casa de campo en Villa Imperial', 0, true),
	(md5('img:20000000-0000-4000-8000-000000000008:1')::uuid, '20000000-0000-4000-8000-000000000008', null, 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1400&q=70', 'Casa de campo en Villa Imperial', 1, false),
	(md5('img:20000000-0000-4000-8000-000000000008:2')::uuid, '20000000-0000-4000-8000-000000000008', null, 'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1400&q=70', 'Casa de campo en Villa Imperial', 2, false),
	(md5('img:20000000-0000-4000-8000-000000000009:0')::uuid, '20000000-0000-4000-8000-000000000009', null, 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=70', 'Oficina equipada en Av. Cívica', 0, true),
	(md5('img:20000000-0000-4000-8000-000000000009:1')::uuid, '20000000-0000-4000-8000-000000000009', null, 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1400&q=70', 'Oficina equipada en Av. Cívica', 1, false),
	(md5('img:20000000-0000-4000-8000-000000000009:2')::uuid, '20000000-0000-4000-8000-000000000009', null, 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=70', 'Oficina equipada en Av. Cívica', 2, false),
	(md5('img:20000000-0000-4000-8000-000000000010:0')::uuid, '20000000-0000-4000-8000-000000000010', null, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=70', 'Departamento con vista al Cerro Rico', 0, true),
	(md5('img:20000000-0000-4000-8000-000000000010:1')::uuid, '20000000-0000-4000-8000-000000000010', null, 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1400&q=70', 'Departamento con vista al Cerro Rico', 1, false),
	(md5('img:20000000-0000-4000-8000-000000000010:2')::uuid, '20000000-0000-4000-8000-000000000010', null, 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1400&q=70', 'Departamento con vista al Cerro Rico', 2, false),
	(md5('img:20000000-0000-4000-8000-000000000010:3')::uuid, '20000000-0000-4000-8000-000000000010', null, 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1400&q=70', 'Departamento con vista al Cerro Rico', 3, false),
	(md5('img:20000000-0000-4000-8000-000000000011:0')::uuid, '20000000-0000-4000-8000-000000000011', null, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=70', 'Casa en condominio cerrado, San Clemente', 0, true),
	(md5('img:20000000-0000-4000-8000-000000000011:1')::uuid, '20000000-0000-4000-8000-000000000011', null, 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=70', 'Casa en condominio cerrado, San Clemente', 1, false),
	(md5('img:20000000-0000-4000-8000-000000000011:2')::uuid, '20000000-0000-4000-8000-000000000011', null, 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=70', 'Casa en condominio cerrado, San Clemente', 2, false),
	(md5('img:20000000-0000-4000-8000-000000000011:3')::uuid, '20000000-0000-4000-8000-000000000011', null, 'https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?auto=format&fit=crop&w=1400&q=70', 'Casa en condominio cerrado, San Clemente', 3, false),
	(md5('img:20000000-0000-4000-8000-000000000012:0')::uuid, '20000000-0000-4000-8000-000000000012', null, 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1400&q=70', 'Departamento económico para estudiantes', 0, true),
	(md5('img:20000000-0000-4000-8000-000000000012:1')::uuid, '20000000-0000-4000-8000-000000000012', null, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=70', 'Departamento económico para estudiantes', 1, false),
	(md5('img:20000000-0000-4000-8000-000000000012:2')::uuid, '20000000-0000-4000-8000-000000000012', null, 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1400&q=70', 'Departamento económico para estudiantes', 2, false),
	(md5('img:20000000-0000-4000-8000-000000000013:0')::uuid, '20000000-0000-4000-8000-000000000013', null, 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1400&q=70', 'Local esquinero en Villa Imperial', 0, true),
	(md5('img:20000000-0000-4000-8000-000000000013:1')::uuid, '20000000-0000-4000-8000-000000000013', null, 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=70', 'Local esquinero en Villa Imperial', 1, false),
	(md5('img:20000000-0000-4000-8000-000000000014:0')::uuid, '20000000-0000-4000-8000-000000000014', null, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1400&q=70', 'Casa con jardín en Alto Potosí', 0, true),
	(md5('img:20000000-0000-4000-8000-000000000014:1')::uuid, '20000000-0000-4000-8000-000000000014', null, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=70', 'Casa con jardín en Alto Potosí', 1, false),
	(md5('img:20000000-0000-4000-8000-000000000014:2')::uuid, '20000000-0000-4000-8000-000000000014', null, 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=70', 'Casa con jardín en Alto Potosí', 2, false),
	(md5('img:20000000-0000-4000-8000-000000000015:0')::uuid, '20000000-0000-4000-8000-000000000015', null, 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=70', 'Oficina amoblada en San Clemente', 0, true),
	(md5('img:20000000-0000-4000-8000-000000000015:1')::uuid, '20000000-0000-4000-8000-000000000015', null, 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=70', 'Oficina amoblada en San Clemente', 1, false)
on conflict (id) do update
set inmueble_id = excluded.inmueble_id,
	path = excluded.path,
	url = excluded.url,
	alt = excluded.alt,
	orden = excluded.orden,
	es_portada = excluded.es_portada;

-- ---------------------------------------------------------------------------
-- Datos transaccionales: requieren los 3 usuarios demo
-- ---------------------------------------------------------------------------
alter table public.pagos disable trigger pagos_validar;
alter table public.pagos disable trigger pagos_aplicar;

do $$
declare
	v_admin uuid;
	v_vendedor uuid;
	v_cliente uuid;
begin
	select id into v_admin from auth.users where lower(email) = lower('rodrigo.alvarez@remaxpotosi.bo') limit 1;
	select id into v_vendedor from auth.users where lower(email) = lower('carla.mendoza@remaxpotosi.bo') limit 1;
	select id into v_cliente from auth.users where lower(email) = lower('luis.catari@gmail.com') limit 1;

	if v_admin is null or v_vendedor is null or v_cliente is null then
		raise notice 'Seed: faltan usuarios demo; se omite la parte transaccional. Ejecuta pnpm db:seed-users y vuelve a correr supabase/seed.sql.';
		return;
	end if;

	-- Perfiles
	insert into public.perfiles (id, nombres, apellidos, ci, telefono, correo, rol, activo, debe_cambiar_password, avatar_url, created_at, updated_at)
	values
		(v_admin, 'Rodrigo', 'Álvarez Paredes', null, '+591 71234567', 'rodrigo.alvarez@remaxpotosi.bo', 'administrador', true, false, 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=70', '2024-01-12T12:00:00-04:00'::timestamptz, now()),
		(v_vendedor, 'Carla', 'Mendoza Vaca', null, '+591 72345678', 'carla.mendoza@remaxpotosi.bo', 'vendedor', true, false, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=70', '2024-02-03T12:00:00-04:00'::timestamptz, now()),
		(v_cliente, 'Luis Fernando', 'Catari Choque', null, '+591 67890123', 'luis.catari@gmail.com', 'cliente', true, false, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=70', '2025-06-15T12:00:00-04:00'::timestamptz, now())
	on conflict (id) do update
	set nombres = excluded.nombres,
		apellidos = excluded.apellidos,
		telefono = excluded.telefono,
		correo = excluded.correo,
		rol = excluded.rol,
		activo = true,
		debe_cambiar_password = false,
		avatar_url = excluded.avatar_url,
		updated_at = now();

	-- Vendedor y cliente demo
	insert into public.vendedores (perfil_id, comision_fija, fecha_alta, activo, cargo, zona_principal_id)
	values (v_vendedor, 850, '2024-02-03T12:00:00-04:00'::timestamptz, true, 'Agente sénior', '00000000-0000-4000-8000-000000000001')
	on conflict (perfil_id) do update
	set comision_fija = excluded.comision_fija,
		cargo = excluded.cargo,
		zona_principal_id = excluded.zona_principal_id,
		activo = true;

	insert into public.clientes (perfil_id, telefono_contacto, direccion)
	values (v_cliente, '+591 67890123', 'Av. Villazón Nº 220, Centro histórico')
	on conflict (perfil_id) do update
	set telefono_contacto = excluded.telefono_contacto,
		direccion = excluded.direccion;

	-- Visitas
	insert into public.visitas (id, inmueble_id, cliente_id, nombre_contacto, telefono_contacto, correo_contacto, vendedor_id, fecha_hora, estado, canal, notas, created_at, updated_at)
	values
		('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000010', v_cliente, null, null, null, v_vendedor, '2026-10-18T10:00:00-04:00'::timestamptz, 'pendiente', 'web', 'Interesada en la vista al Cerro Rico. Llega con su pareja.', '2026-10-18T10:00:00-04:00'::timestamptz - interval '1 day', now()),
		('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', v_cliente, null, null, null, v_vendedor, '2026-10-18T15:30:00-04:00'::timestamptz, 'pendiente', 'telefono', 'Preguntó por el estacionamiento y el portero.', '2026-10-18T15:30:00-04:00'::timestamptz - interval '1 day', now()),
		('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000011', v_cliente, null, null, null, v_vendedor, '2026-10-19T09:00:00-04:00'::timestamptz, 'pendiente', 'web', 'Busca mudarse el 01 de diciembre.', '2026-10-19T09:00:00-04:00'::timestamptz - interval '1 day', now()),
		('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000005', v_cliente, null, null, null, v_vendedor, '2026-10-17T16:00:00-04:00'::timestamptz, 'pendiente', 'presencial', 'Visita de hoy. Confirmada por WhatsApp.', '2026-10-17T16:00:00-04:00'::timestamptz - interval '1 day', now()),
		('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000001', v_cliente, null, null, null, v_vendedor, '2026-10-15T11:00:00-04:00'::timestamptz, 'realizada', 'web', 'Le encantó el patio. Pidió cotización del depósito.', '2026-10-15T11:00:00-04:00'::timestamptz - interval '1 day', now()),
		('30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000007', v_cliente, null, null, null, v_vendedor, '2026-10-14T17:00:00-04:00'::timestamptz, 'realizada', 'telefono', 'Monoambiente. Comparó con otra opción en el centro.', '2026-10-14T17:00:00-04:00'::timestamptz - interval '1 day', now()),
		('30000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000012', v_cliente, null, null, null, v_vendedor, '2026-10-12T10:30:00-04:00'::timestamptz, 'cancelada', 'web', 'La clienta reprogramó para fin de mes.', '2026-10-12T10:30:00-04:00'::timestamptz - interval '1 day', now()),
		('30000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000009', v_cliente, null, null, null, v_vendedor, '2026-10-16T14:00:00-04:00'::timestamptz, 'realizada', 'presencial', 'Recorrió la oficina. Solicitó propuesta de contrato.', '2026-10-16T14:00:00-04:00'::timestamptz - interval '1 day', now()),
		('30000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000004', v_cliente, null, null, null, null, '2026-10-20T11:00:00-04:00'::timestamptz, 'pendiente', 'web', 'Requiere asignar vendedor responsable.', '2026-10-20T11:00:00-04:00'::timestamptz - interval '1 day', now()),
		('30000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000003', v_cliente, null, null, null, v_vendedor, '2026-10-17T09:30:00-04:00'::timestamptz, 'realizada', 'web', 'Interesada en abrir una cafetería. Buena visita.', '2026-10-17T09:30:00-04:00'::timestamptz - interval '1 day', now())
	on conflict do nothing;

	-- Alquileres
	insert into public.alquileres (id, numero_contrato, inmueble_id, cliente_id, vendedor_id, fecha_inicio, fecha_fin, duracion_meses, monto_mensual, dia_cobro, deposito, estado, contrato_path, created_at, updated_at)
	values
		('40000000-0000-4000-8000-000000000001', 'RMX-2026-0001', '20000000-0000-4000-8000-000000000006', v_cliente, v_vendedor, '2026-08-01T12:00:00-04:00'::timestamptz, '2027-07-31T23:59:59-04:00'::timestamptz, 12, 3900, 5, 3900, 'vigente', '40000000-0000-4000-8000-000000000001/contrato.pdf', '2026-08-01T12:00:00-04:00'::timestamptz, now()),
		('40000000-0000-4000-8000-000000000002', 'RMX-2026-0002', '20000000-0000-4000-8000-000000000009', v_cliente, v_vendedor, '2026-09-01T12:00:00-04:00'::timestamptz, '2027-08-31T23:59:59-04:00'::timestamptz, 12, 3800, 1, 3800, 'vigente', '40000000-0000-4000-8000-000000000002/contrato.pdf', '2026-09-01T12:00:00-04:00'::timestamptz, now()),
		('40000000-0000-4000-8000-000000000003', 'RMX-2026-0003', '20000000-0000-4000-8000-000000000012', v_cliente, v_vendedor, '2026-08-15T12:00:00-04:00'::timestamptz, '2027-08-14T23:59:59-04:00'::timestamptz, 12, 1200, 15, 1200, 'vigente', '40000000-0000-4000-8000-000000000003/contrato.pdf', '2026-08-15T12:00:00-04:00'::timestamptz, now()),
		('40000000-0000-4000-8000-000000000004', 'RMX-2026-0004', '20000000-0000-4000-8000-000000000003', v_cliente, v_vendedor, '2026-07-01T12:00:00-04:00'::timestamptz, '2027-06-30T23:59:59-04:00'::timestamptz, 12, 4500, 1, 4500, 'vigente', '40000000-0000-4000-8000-000000000004/contrato.pdf', '2026-07-01T12:00:00-04:00'::timestamptz, now()),
		('40000000-0000-4000-8000-000000000005', 'RMX-2025-0014', '20000000-0000-4000-8000-000000000008', v_cliente, v_vendedor, '2025-11-01T12:00:00-04:00'::timestamptz, '2026-10-31T23:59:59-04:00'::timestamptz, 12, 2600, 10, 2600, 'vigente', '40000000-0000-4000-8000-000000000005/contrato.pdf', '2025-11-01T12:00:00-04:00'::timestamptz, now()),
		('40000000-0000-4000-8000-000000000006', 'RMX-2026-0005', '20000000-0000-4000-8000-000000000002', v_cliente, v_vendedor, '2026-06-01T12:00:00-04:00'::timestamptz, '2026-09-30T23:59:59-04:00'::timestamptz, 4, 2400, 5, 2400, 'finalizado', '40000000-0000-4000-8000-000000000006/contrato.pdf', '2026-06-01T12:00:00-04:00'::timestamptz, now()),
		('40000000-0000-4000-8000-000000000007', 'RMX-2026-0007', '20000000-0000-4000-8000-000000000015', v_cliente, v_vendedor, '2026-10-01T12:00:00-04:00'::timestamptz, '2027-09-30T23:59:59-04:00'::timestamptz, 12, 3600, 5, 3600, 'vigente', '40000000-0000-4000-8000-000000000007/contrato.pdf', '2026-10-01T12:00:00-04:00'::timestamptz, now()),
		('40000000-0000-4000-8000-000000000008', 'RMX-2026-0008', '20000000-0000-4000-8000-000000000014', v_cliente, v_vendedor, '2026-09-20T12:00:00-04:00'::timestamptz, '2027-09-19T23:59:59-04:00'::timestamptz, 12, 3400, 20, 3400, 'vigente', '40000000-0000-4000-8000-000000000008/contrato.pdf', '2026-09-20T12:00:00-04:00'::timestamptz, now()),
		('40000000-0000-4000-8000-000000000009', 'RMX-2026-0009', '20000000-0000-4000-8000-000000000013', v_cliente, v_vendedor, '2026-07-15T12:00:00-04:00'::timestamptz, '2027-07-14T23:59:59-04:00'::timestamptz, 12, 2900, 15, 2900, 'suspendido', '40000000-0000-4000-8000-000000000009/contrato.pdf', '2026-07-15T12:00:00-04:00'::timestamptz, now()),
		('40000000-0000-4000-8000-000000000010', 'RMX-2026-0010', '20000000-0000-4000-8000-000000000011', v_cliente, v_vendedor, '2026-08-05T12:00:00-04:00'::timestamptz, '2027-08-04T23:59:59-04:00'::timestamptz, 12, 5200, 5, 5200, 'vigente', '40000000-0000-4000-8000-000000000010/contrato.pdf', '2026-08-05T12:00:00-04:00'::timestamptz, now()),
		('40000000-0000-4000-8000-000000000011', 'RMX-2026-0011', '20000000-0000-4000-8000-000000000010', v_cliente, v_vendedor, '2026-09-01T12:00:00-04:00'::timestamptz, '2027-08-31T23:59:59-04:00'::timestamptz, 12, 3100, 1, 3100, 'vigente', '40000000-0000-4000-8000-000000000011/contrato.pdf', '2026-09-01T12:00:00-04:00'::timestamptz, now()),
		('40000000-0000-4000-8000-000000000012', 'RMX-2026-0012', '20000000-0000-4000-8000-000000000005', v_cliente, v_vendedor, '2026-05-10T12:00:00-04:00'::timestamptz, '2027-05-09T23:59:59-04:00'::timestamptz, 12, 2750, 10, 2750, 'suspendido', '40000000-0000-4000-8000-000000000012/contrato.pdf', '2026-05-10T12:00:00-04:00'::timestamptz, now())
	on conflict do nothing;

	-- Sincronizar el contador de contratos para que un cierre nuevo no choque
	insert into public.contador_contratos (anio, ultimo)
	select
		split_part(numero_contrato, '-', 2)::smallint as anio,
		max(split_part(numero_contrato, '-', 3)::integer) as ultimo
	from public.alquileres
	group by 1
	on conflict (anio) do update
	set ultimo = greatest(public.contador_contratos.ultimo, excluded.ultimo);

	-- Cuotas
	insert into public.cuotas (id, alquiler_id, numero, fecha_vencimiento, monto, recargo_mora, estado, created_at, updated_at)
	values
		(md5('cuota:40000000-0000-4000-8000-000000000001:1')::uuid, '40000000-0000-4000-8000-000000000001', 1, '2026-08-05T12:00:00-04:00'::timestamptz, 3900, 0, 'pagada', '2026-08-05T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000001:2')::uuid, '40000000-0000-4000-8000-000000000001', 2, '2026-09-05T12:00:00-04:00'::timestamptz, 3900, 0, 'pagada', '2026-09-05T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000001:3')::uuid, '40000000-0000-4000-8000-000000000001', 3, '2026-10-05T12:00:00-04:00'::timestamptz, 3900, 0, 'pagada', '2026-10-05T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000001:4')::uuid, '40000000-0000-4000-8000-000000000001', 4, '2026-11-05T12:00:00-04:00'::timestamptz, 3900, 0, 'pendiente', '2026-11-05T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000002:1')::uuid, '40000000-0000-4000-8000-000000000002', 1, '2026-09-01T12:00:00-04:00'::timestamptz, 3800, 0, 'pagada', '2026-09-01T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000002:2')::uuid, '40000000-0000-4000-8000-000000000002', 2, '2026-10-01T12:00:00-04:00'::timestamptz, 3800, 190, 'en_mora', '2026-10-01T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000002:3')::uuid, '40000000-0000-4000-8000-000000000002', 3, '2026-11-01T12:00:00-04:00'::timestamptz, 3800, 0, 'pendiente', '2026-11-01T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000003:1')::uuid, '40000000-0000-4000-8000-000000000003', 1, '2026-08-15T12:00:00-04:00'::timestamptz, 1200, 0, 'pagada', '2026-08-15T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000003:2')::uuid, '40000000-0000-4000-8000-000000000003', 2, '2026-09-15T12:00:00-04:00'::timestamptz, 1200, 60, 'pagada', '2026-09-15T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000003:3')::uuid, '40000000-0000-4000-8000-000000000003', 3, '2026-10-15T12:00:00-04:00'::timestamptz, 1200, 0, 'pendiente', '2026-10-15T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000004:1')::uuid, '40000000-0000-4000-8000-000000000004', 1, '2026-07-01T12:00:00-04:00'::timestamptz, 4500, 0, 'pagada', '2026-07-01T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000004:2')::uuid, '40000000-0000-4000-8000-000000000004', 2, '2026-08-01T12:00:00-04:00'::timestamptz, 4500, 0, 'pagada', '2026-08-01T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000004:3')::uuid, '40000000-0000-4000-8000-000000000004', 3, '2026-09-01T12:00:00-04:00'::timestamptz, 4500, 0, 'pagada', '2026-09-01T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000004:4')::uuid, '40000000-0000-4000-8000-000000000004', 4, '2026-10-01T12:00:00-04:00'::timestamptz, 4500, 0, 'pagada', '2026-10-01T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000004:5')::uuid, '40000000-0000-4000-8000-000000000004', 5, '2026-11-01T12:00:00-04:00'::timestamptz, 4500, 0, 'pendiente', '2026-11-01T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000005:1')::uuid, '40000000-0000-4000-8000-000000000005', 1, '2025-11-10T12:00:00-04:00'::timestamptz, 2600, 0, 'pagada', '2025-11-10T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000005:2')::uuid, '40000000-0000-4000-8000-000000000005', 2, '2025-12-10T12:00:00-04:00'::timestamptz, 2600, 0, 'pagada', '2025-12-10T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000005:3')::uuid, '40000000-0000-4000-8000-000000000005', 3, '2026-01-10T12:00:00-04:00'::timestamptz, 2600, 0, 'pagada', '2026-01-10T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000005:4')::uuid, '40000000-0000-4000-8000-000000000005', 4, '2026-02-10T12:00:00-04:00'::timestamptz, 2600, 0, 'pagada', '2026-02-10T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000005:5')::uuid, '40000000-0000-4000-8000-000000000005', 5, '2026-03-10T12:00:00-04:00'::timestamptz, 2600, 0, 'pagada', '2026-03-10T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000005:6')::uuid, '40000000-0000-4000-8000-000000000005', 6, '2026-04-10T12:00:00-04:00'::timestamptz, 2600, 0, 'pagada', '2026-04-10T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000005:7')::uuid, '40000000-0000-4000-8000-000000000005', 7, '2026-05-10T12:00:00-04:00'::timestamptz, 2600, 80, 'pagada', '2026-05-10T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000005:8')::uuid, '40000000-0000-4000-8000-000000000005', 8, '2026-06-10T12:00:00-04:00'::timestamptz, 2600, 0, 'pagada', '2026-06-10T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000005:9')::uuid, '40000000-0000-4000-8000-000000000005', 9, '2026-07-10T12:00:00-04:00'::timestamptz, 2600, 0, 'pagada', '2026-07-10T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000005:10')::uuid, '40000000-0000-4000-8000-000000000005', 10, '2026-08-10T12:00:00-04:00'::timestamptz, 2600, 0, 'pagada', '2026-08-10T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000005:11')::uuid, '40000000-0000-4000-8000-000000000005', 11, '2026-09-10T12:00:00-04:00'::timestamptz, 2600, 0, 'pagada', '2026-09-10T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000005:12')::uuid, '40000000-0000-4000-8000-000000000005', 12, '2026-10-10T12:00:00-04:00'::timestamptz, 2600, 130, 'en_mora', '2026-10-10T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000006:1')::uuid, '40000000-0000-4000-8000-000000000006', 1, '2026-06-05T12:00:00-04:00'::timestamptz, 2400, 0, 'pagada', '2026-06-05T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000006:2')::uuid, '40000000-0000-4000-8000-000000000006', 2, '2026-07-05T12:00:00-04:00'::timestamptz, 2400, 0, 'pagada', '2026-07-05T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000006:3')::uuid, '40000000-0000-4000-8000-000000000006', 3, '2026-08-05T12:00:00-04:00'::timestamptz, 2400, 0, 'pagada', '2026-08-05T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000006:4')::uuid, '40000000-0000-4000-8000-000000000006', 4, '2026-09-05T12:00:00-04:00'::timestamptz, 2400, 0, 'pagada', '2026-09-05T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000007:1')::uuid, '40000000-0000-4000-8000-000000000007', 1, '2026-10-05T12:00:00-04:00'::timestamptz, 3600, 180, 'en_mora', '2026-10-05T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000008:1')::uuid, '40000000-0000-4000-8000-000000000008', 1, '2026-09-20T12:00:00-04:00'::timestamptz, 3400, 0, 'pagada', '2026-09-20T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000008:2')::uuid, '40000000-0000-4000-8000-000000000008', 2, '2026-10-20T12:00:00-04:00'::timestamptz, 3400, 0, 'pendiente', '2026-10-20T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000009:1')::uuid, '40000000-0000-4000-8000-000000000009', 1, '2026-07-15T12:00:00-04:00'::timestamptz, 2900, 0, 'pagada', '2026-07-15T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000009:2')::uuid, '40000000-0000-4000-8000-000000000009', 2, '2026-08-15T12:00:00-04:00'::timestamptz, 2900, 0, 'pagada', '2026-08-15T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000009:3')::uuid, '40000000-0000-4000-8000-000000000009', 3, '2026-09-15T12:00:00-04:00'::timestamptz, 2900, 145, 'en_mora', '2026-09-15T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000009:4')::uuid, '40000000-0000-4000-8000-000000000009', 4, '2026-10-15T12:00:00-04:00'::timestamptz, 2900, 145, 'en_mora', '2026-10-15T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000010:1')::uuid, '40000000-0000-4000-8000-000000000010', 1, '2026-08-05T12:00:00-04:00'::timestamptz, 5200, 0, 'pagada', '2026-08-05T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000010:2')::uuid, '40000000-0000-4000-8000-000000000010', 2, '2026-09-05T12:00:00-04:00'::timestamptz, 5200, 0, 'pagada', '2026-09-05T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000010:3')::uuid, '40000000-0000-4000-8000-000000000010', 3, '2026-10-05T12:00:00-04:00'::timestamptz, 5200, 0, 'pagada', '2026-10-05T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000010:4')::uuid, '40000000-0000-4000-8000-000000000010', 4, '2026-11-05T12:00:00-04:00'::timestamptz, 5200, 0, 'pendiente', '2026-11-05T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000011:1')::uuid, '40000000-0000-4000-8000-000000000011', 1, '2026-09-01T12:00:00-04:00'::timestamptz, 3100, 0, 'pagada', '2026-09-01T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000011:2')::uuid, '40000000-0000-4000-8000-000000000011', 2, '2026-10-01T12:00:00-04:00'::timestamptz, 3100, 0, 'pagada', '2026-10-01T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000011:3')::uuid, '40000000-0000-4000-8000-000000000011', 3, '2026-11-01T12:00:00-04:00'::timestamptz, 3100, 0, 'pendiente', '2026-11-01T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000012:1')::uuid, '40000000-0000-4000-8000-000000000012', 1, '2026-05-10T12:00:00-04:00'::timestamptz, 2750, 0, 'pagada', '2026-05-10T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000012:2')::uuid, '40000000-0000-4000-8000-000000000012', 2, '2026-06-10T12:00:00-04:00'::timestamptz, 2750, 0, 'pagada', '2026-06-10T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000012:3')::uuid, '40000000-0000-4000-8000-000000000012', 3, '2026-07-10T12:00:00-04:00'::timestamptz, 2750, 0, 'pagada', '2026-07-10T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000012:4')::uuid, '40000000-0000-4000-8000-000000000012', 4, '2026-08-10T12:00:00-04:00'::timestamptz, 2750, 0, 'pagada', '2026-08-10T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000012:5')::uuid, '40000000-0000-4000-8000-000000000012', 5, '2026-09-10T12:00:00-04:00'::timestamptz, 2750, 130, 'en_mora', '2026-09-10T12:00:00-04:00'::timestamptz, now()),
		(md5('cuota:40000000-0000-4000-8000-000000000012:6')::uuid, '40000000-0000-4000-8000-000000000012', 6, '2026-10-10T12:00:00-04:00'::timestamptz, 2750, 130, 'en_mora', '2026-10-10T12:00:00-04:00'::timestamptz, now())
	on conflict do nothing;

	-- Pagos (los triggers de validación/aplicación se desactivan arriba para
	-- poder sembrar el histórico ya conciliado)
	insert into public.pagos (id, alquiler_id, cuota_id, tipo, monto, medio, fecha_pago, comprobante_path, registrado_por, validado, created_at, updated_at)
	values
		(md5('pago:40000000-0000-4000-8000-000000000001:1')::uuid, '40000000-0000-4000-8000-000000000001', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000001' and c.numero = 1), 'cuota', 3900, 'qr', '2026-08-04T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000001/comprobante-01.pdf', v_vendedor, true, '2026-08-04T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000001:2')::uuid, '40000000-0000-4000-8000-000000000001', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000001' and c.numero = 2), 'cuota', 3900, 'qr', '2026-09-03T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000001/comprobante-02.pdf', v_vendedor, true, '2026-09-03T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000001:3')::uuid, '40000000-0000-4000-8000-000000000001', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000001' and c.numero = 3), 'cuota', 3900, 'tarjeta', '2026-10-06T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000001/comprobante-03.pdf', v_vendedor, true, '2026-10-06T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000002:1')::uuid, '40000000-0000-4000-8000-000000000002', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000002' and c.numero = 1), 'cuota', 3800, 'qr', '2026-09-01T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000002/comprobante-01.pdf', v_vendedor, true, '2026-09-01T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000003:1')::uuid, '40000000-0000-4000-8000-000000000003', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000003' and c.numero = 1), 'cuota', 1200, 'efectivo', '2026-08-14T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000003/comprobante-01.pdf', v_vendedor, true, '2026-08-14T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000003:2')::uuid, '40000000-0000-4000-8000-000000000003', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000003' and c.numero = 2), 'cuota', 1260, 'qr', '2026-09-18T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000003/comprobante-02.pdf', v_vendedor, true, '2026-09-18T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000004:1')::uuid, '40000000-0000-4000-8000-000000000004', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000004' and c.numero = 1), 'cuota', 4500, 'qr', '2026-07-01T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000004/comprobante-01.pdf', v_vendedor, true, '2026-07-01T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000004:2')::uuid, '40000000-0000-4000-8000-000000000004', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000004' and c.numero = 2), 'cuota', 4500, 'qr', '2026-07-30T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000004/comprobante-02.pdf', v_vendedor, true, '2026-07-30T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000004:3')::uuid, '40000000-0000-4000-8000-000000000004', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000004' and c.numero = 3), 'cuota', 4500, 'tarjeta', '2026-09-02T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000004/comprobante-03.pdf', v_vendedor, true, '2026-09-02T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000004:4')::uuid, '40000000-0000-4000-8000-000000000004', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000004' and c.numero = 4), 'cuota', 4500, 'qr', '2026-10-01T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000004/comprobante-04.pdf', v_vendedor, true, '2026-10-01T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000005:1')::uuid, '40000000-0000-4000-8000-000000000005', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000005' and c.numero = 1), 'cuota', 2600, 'efectivo', '2025-11-09T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000005/comprobante-01.pdf', v_vendedor, true, '2025-11-09T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000005:2')::uuid, '40000000-0000-4000-8000-000000000005', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000005' and c.numero = 2), 'cuota', 2600, 'efectivo', '2025-12-08T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000005/comprobante-02.pdf', v_vendedor, true, '2025-12-08T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000005:3')::uuid, '40000000-0000-4000-8000-000000000005', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000005' and c.numero = 3), 'cuota', 2600, 'qr', '2026-01-10T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000005/comprobante-03.pdf', v_vendedor, true, '2026-01-10T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000005:4')::uuid, '40000000-0000-4000-8000-000000000005', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000005' and c.numero = 4), 'cuota', 2600, 'qr', '2026-02-11T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000005/comprobante-04.pdf', v_vendedor, true, '2026-02-11T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000005:5')::uuid, '40000000-0000-4000-8000-000000000005', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000005' and c.numero = 5), 'cuota', 2600, 'qr', '2026-03-09T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000005/comprobante-05.pdf', v_vendedor, true, '2026-03-09T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000005:6')::uuid, '40000000-0000-4000-8000-000000000005', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000005' and c.numero = 6), 'cuota', 2600, 'efectivo', '2026-04-10T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000005/comprobante-06.pdf', v_vendedor, true, '2026-04-10T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000005:7')::uuid, '40000000-0000-4000-8000-000000000005', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000005' and c.numero = 7), 'cuota', 2680, 'efectivo', '2026-05-12T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000005/comprobante-07.pdf', v_vendedor, true, '2026-05-12T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000005:8')::uuid, '40000000-0000-4000-8000-000000000005', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000005' and c.numero = 8), 'cuota', 2600, 'qr', '2026-06-09T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000005/comprobante-08.pdf', v_vendedor, true, '2026-06-09T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000005:9')::uuid, '40000000-0000-4000-8000-000000000005', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000005' and c.numero = 9), 'cuota', 2600, 'qr', '2026-07-10T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000005/comprobante-09.pdf', v_vendedor, true, '2026-07-10T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000005:10')::uuid, '40000000-0000-4000-8000-000000000005', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000005' and c.numero = 10), 'cuota', 2600, 'qr', '2026-08-10T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000005/comprobante-10.pdf', v_vendedor, true, '2026-08-10T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000005:11')::uuid, '40000000-0000-4000-8000-000000000005', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000005' and c.numero = 11), 'cuota', 2600, 'efectivo', '2026-09-11T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000005/comprobante-11.pdf', v_vendedor, true, '2026-09-11T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000006:1')::uuid, '40000000-0000-4000-8000-000000000006', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000006' and c.numero = 1), 'cuota', 2400, 'qr', '2026-06-04T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000006/comprobante-01.pdf', v_vendedor, true, '2026-06-04T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000006:2')::uuid, '40000000-0000-4000-8000-000000000006', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000006' and c.numero = 2), 'cuota', 2400, 'qr', '2026-07-05T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000006/comprobante-02.pdf', v_vendedor, true, '2026-07-05T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000006:3')::uuid, '40000000-0000-4000-8000-000000000006', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000006' and c.numero = 3), 'cuota', 2400, 'tarjeta', '2026-08-03T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000006/comprobante-03.pdf', v_vendedor, true, '2026-08-03T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000006:4')::uuid, '40000000-0000-4000-8000-000000000006', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000006' and c.numero = 4), 'cuota', 2400, 'qr', '2026-09-05T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000006/comprobante-04.pdf', v_vendedor, true, '2026-09-05T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000008:1')::uuid, '40000000-0000-4000-8000-000000000008', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000008' and c.numero = 1), 'cuota', 3400, 'qr', '2026-09-19T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000008/comprobante-01.pdf', v_vendedor, true, '2026-09-19T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000009:1')::uuid, '40000000-0000-4000-8000-000000000009', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000009' and c.numero = 1), 'cuota', 2900, 'efectivo', '2026-07-14T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000009/comprobante-01.pdf', v_vendedor, true, '2026-07-14T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000009:2')::uuid, '40000000-0000-4000-8000-000000000009', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000009' and c.numero = 2), 'cuota', 2900, 'qr', '2026-08-15T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000009/comprobante-02.pdf', v_vendedor, true, '2026-08-15T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000010:1')::uuid, '40000000-0000-4000-8000-000000000010', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000010' and c.numero = 1), 'cuota', 5200, 'qr', '2026-08-04T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000010/comprobante-01.pdf', v_vendedor, true, '2026-08-04T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000010:2')::uuid, '40000000-0000-4000-8000-000000000010', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000010' and c.numero = 2), 'cuota', 5200, 'tarjeta', '2026-09-06T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000010/comprobante-02.pdf', v_vendedor, true, '2026-09-06T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000010:3')::uuid, '40000000-0000-4000-8000-000000000010', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000010' and c.numero = 3), 'cuota', 5200, 'qr', '2026-10-04T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000010/comprobante-03.pdf', v_vendedor, true, '2026-10-04T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000011:1')::uuid, '40000000-0000-4000-8000-000000000011', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000011' and c.numero = 1), 'cuota', 3100, 'qr', '2026-09-01T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000011/comprobante-01.pdf', v_vendedor, true, '2026-09-01T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000011:2')::uuid, '40000000-0000-4000-8000-000000000011', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000011' and c.numero = 2), 'cuota', 3100, 'qr', '2026-10-01T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000011/comprobante-02.pdf', v_vendedor, true, '2026-10-01T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000012:1')::uuid, '40000000-0000-4000-8000-000000000012', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000012' and c.numero = 1), 'cuota', 2750, 'qr', '2026-05-10T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000012/comprobante-01.pdf', v_vendedor, true, '2026-05-10T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000012:2')::uuid, '40000000-0000-4000-8000-000000000012', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000012' and c.numero = 2), 'cuota', 2750, 'qr', '2026-06-09T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000012/comprobante-02.pdf', v_vendedor, true, '2026-06-09T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000012:3')::uuid, '40000000-0000-4000-8000-000000000012', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000012' and c.numero = 3), 'cuota', 2750, 'efectivo', '2026-07-11T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000012/comprobante-03.pdf', v_vendedor, true, '2026-07-11T12:00:00-04:00'::timestamptz, now()),
		(md5('pago:40000000-0000-4000-8000-000000000012:4')::uuid, '40000000-0000-4000-8000-000000000012', (select c.id from public.cuotas c where c.alquiler_id = '40000000-0000-4000-8000-000000000012' and c.numero = 4), 'cuota', 2750, 'qr', '2026-08-10T12:00:00-04:00'::timestamptz, '40000000-0000-4000-8000-000000000012/comprobante-04.pdf', v_vendedor, true, '2026-08-10T12:00:00-04:00'::timestamptz, now())
	on conflict do nothing;

	-- Comisiones
	insert into public.comisiones (id, vendedor_id, alquiler_id, monto, fecha, estado, created_at, updated_at)
	values
		(md5('comision:40000000-0000-4000-8000-000000000001')::uuid, v_vendedor, '40000000-0000-4000-8000-000000000001', 720, '2026-08-01T12:00:00-04:00'::timestamptz, 'pendiente', '2026-08-01T12:00:00-04:00'::timestamptz, now()),
		(md5('comision:40000000-0000-4000-8000-000000000002')::uuid, v_vendedor, '40000000-0000-4000-8000-000000000002', 720, '2026-09-01T12:00:00-04:00'::timestamptz, 'pendiente', '2026-09-01T12:00:00-04:00'::timestamptz, now()),
		(md5('comision:40000000-0000-4000-8000-000000000003')::uuid, v_vendedor, '40000000-0000-4000-8000-000000000003', 780, '2026-08-15T12:00:00-04:00'::timestamptz, 'pendiente', '2026-08-15T12:00:00-04:00'::timestamptz, now()),
		(md5('comision:40000000-0000-4000-8000-000000000004')::uuid, v_vendedor, '40000000-0000-4000-8000-000000000004', 780, '2026-07-01T12:00:00-04:00'::timestamptz, 'pendiente', '2026-07-01T12:00:00-04:00'::timestamptz, now()),
		(md5('comision:40000000-0000-4000-8000-000000000005')::uuid, v_vendedor, '40000000-0000-4000-8000-000000000005', 800, '2025-11-01T12:00:00-04:00'::timestamptz, 'pendiente', '2025-11-01T12:00:00-04:00'::timestamptz, now()),
		(md5('comision:40000000-0000-4000-8000-000000000006')::uuid, v_vendedor, '40000000-0000-4000-8000-000000000006', 850, '2026-06-01T12:00:00-04:00'::timestamptz, 'pagada', '2026-06-01T12:00:00-04:00'::timestamptz, now()),
		(md5('comision:40000000-0000-4000-8000-000000000007')::uuid, v_vendedor, '40000000-0000-4000-8000-000000000007', 850, '2026-10-01T12:00:00-04:00'::timestamptz, 'pendiente', '2026-10-01T12:00:00-04:00'::timestamptz, now()),
		(md5('comision:40000000-0000-4000-8000-000000000008')::uuid, v_vendedor, '40000000-0000-4000-8000-000000000008', 850, '2026-09-20T12:00:00-04:00'::timestamptz, 'pendiente', '2026-09-20T12:00:00-04:00'::timestamptz, now()),
		(md5('comision:40000000-0000-4000-8000-000000000009')::uuid, v_vendedor, '40000000-0000-4000-8000-000000000009', 850, '2026-07-15T12:00:00-04:00'::timestamptz, 'pendiente', '2026-07-15T12:00:00-04:00'::timestamptz, now()),
		(md5('comision:40000000-0000-4000-8000-000000000010')::uuid, v_vendedor, '40000000-0000-4000-8000-000000000010', 850, '2026-08-05T12:00:00-04:00'::timestamptz, 'pendiente', '2026-08-05T12:00:00-04:00'::timestamptz, now()),
		(md5('comision:40000000-0000-4000-8000-000000000011')::uuid, v_vendedor, '40000000-0000-4000-8000-000000000011', 850, '2026-09-01T12:00:00-04:00'::timestamptz, 'pendiente', '2026-09-01T12:00:00-04:00'::timestamptz, now()),
		(md5('comision:40000000-0000-4000-8000-000000000012')::uuid, v_vendedor, '40000000-0000-4000-8000-000000000012', 780, '2026-05-10T12:00:00-04:00'::timestamptz, 'pendiente', '2026-05-10T12:00:00-04:00'::timestamptz, now())
	on conflict do nothing;
end
$$;

alter table public.pagos enable trigger pagos_validar;
alter table public.pagos enable trigger pagos_aplicar;

-- ---------------------------------------------------------------------------
-- Configuración
-- ---------------------------------------------------------------------------
insert into public.configuracion (id, recargo_mora_porcentaje, dias_gracia, dias_aviso_previo, updated_at)
values (1, 5.00, 5, 5, now())
on conflict (id) do update
set recargo_mora_porcentaje = excluded.recargo_mora_porcentaje,
	dias_gracia = excluded.dias_gracia,
	dias_aviso_previo = excluded.dias_aviso_previo,
	updated_at = now();

commit;
