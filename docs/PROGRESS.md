# Progreso de la migración a Supabase

Última actualización: 2026-10-23 (entregable 7 y pruebas SQL versionadas).

> Instrucción para la próxima sesión: actualizar esta checklist al terminar cada
> bloque de trabajo. Los entregables 1–7 están completos a nivel de código,
> documentación y verificación local. Falta repetir la verificación en un
> proyecto Supabase real con JWT reales.

## Contexto rápido

- El frontend actual sigue usando mocks en `src/data/`. **No se ha conectado
  ninguna pantalla a Supabase todavía.**
- La fuente de verdad del esquema son las migraciones de
  `supabase/migrations/`.
- La verificación local se hace con PGlite porque en este entorno no hay
  Docker, CLI de Supabase ni `psql`. Ver nota al final.
- `docs/PROGRESS.md` (este archivo) es el tablero de avance. La documentación
  larga vive en los ocho archivos de `docs/` y en `AGENTS.md`.

## Entregable 1 — Esquema (`supabase/migrations/`)

- [x] `0001_extensiones_y_enums.sql`: enums de estados, roles, tipos y medios de
      pago.
- [x] `0002_tablas.sql`: 16 tablas + índices, CHECKs, FKs y fila única de
      configuración.
- [x] Verificar orden de dependencias y ejecución completa sobre una base vacía
      (PGlite, con stubs de `auth` y roles de Supabase).
- [ ] Revisión manual en el editor SQL de Supabase (pendiente del usuario).

## Entregable 2 — Triggers, funciones y RPC

- [x] `0003_funciones_y_triggers.sql`:
  - [x] `set_updated_at()` + triggers en todas las tablas.
  - [x] `handle_new_user()` + trigger en `auth.users`.
  - [x] `crear_cliente_desde_perfil()` (apoyo al alta de clientes).
  - [x] `current_rol()` / `is_admin()` (`security definer`, `search_path` fijo).
  - [x] `proteger_rol()`.
  - [x] `promover_a_vendedor()`.
  - [x] `agendar_visita()` + `validar_vendedor_visita()`.
  - [x] `registrar_alquiler()` atómica + cronograma de cuotas + pago de cierre
        + comisión + cambio de estado del inmueble.
  - [x] Trigger de cambio de estado de alquiler (libera inmueble y anula
        cuotas pendientes).
  - [x] `registrar_pago_cuota()` + triggers de validación/aplicación de pagos.
  - [x] `calcular_recargo_mora()` + `actualizar_estado_cuotas()`.
  - [x] `cambiar_estado_inmueble()`.
  - [x] `auditar()` + triggers de auditoría.
  - [x] `siguiente_numero_contrato()`.
- [x] `0007_cron.sql`: job diario 00:05 America/La_Paz (04:05 UTC). Se numeró
      `0007` para reservar `0004` (RLS), `0005` (Storage) y `0006` (vistas). En
      una base nueva el orden lexicográfico deja cron al final.
- [x] Creación de usuarios con contraseña temporal vía Admin API:
  - [x] `src/server/supabase-admin.ts` (service role, solo servidor).
  - [x] `src/server/usuarios.ts` (`createServerFn` para vendedor y cliente).
  - [x] Generación de contraseña con `crypto.getRandomValues`.
  - [x] Verificación del rol del solicitante en el servidor.
  - [x] Sin conectar todavía a ninguna pantalla.
- [x] Verificar triggers principales con PGlite (31 comprobaciones: alta de
      perfil, promoción, permisos, visita anónima, solape, cierre atómico,
      cuotas, mora, deduplicación de avisos, liberación de inmueble y
      auditoría). El arnés de prueba es temporal y no se versiona porque PGlite
      no es una dependencia del proyecto; en Supabase real debe repetirse con
      `supabase/tests/` o el editor SQL.

## Entregable 3 — RLS y Storage

- [x] `0004_rls.sql`: RLS activado en las 16 tablas de negocio.
- [x] Helpers `security definer` para evitar recursión:
      `is_vendedor`, `puede_ver_alquiler`, `puede_ver_inmueble`,
      `es_agente_de_inmueble`, `nombre_persona`, `nombre_agente` y
      `nombre_proveedor`.
- [x] Políticas por rol:
  - `anon`: catálogo público (zonas activas, inmuebles disponibles, fotos).
  - `cliente`: perfil, visitas, alquileres, cuotas, pagos y notificaciones
    propios; lectura del inmueble que alquila.
  - `vendedor`: visitas asignadas, alquileres/comisiones propios, lectura de
    clientes y de la cartera de inmuebles; puede registrar pagos vía RPC.
  - `administrador`: lectura/escritura de las tablas de negocio y auditoría.
- [x] Triggers de protección de campos: rol/estado/correo del perfil y contenido
      de notificaciones propias.
- [x] `0005_storage.sql`: buckets:
  - `inmuebles` público, imágenes, 8 MB.
  - `contratos` privado, PDF, 15 MB.
  - `comprobantes` privado, imágenes/PDF, 10 MB.
- [x] Convención `{alquiler_id}/archivo`; lectura admin/vendedor/cliente del
      alquiler; escritura admin/vendedor del alquiler.
- [x] Pruebas de RLS con JWT simulado de cada rol en PGlite.

## Entregable 4 — Vistas

- [x] `0006_vistas.sql` con `security_invoker = true`:
  - [x] `v_inmuebles_catalogo`
  - [x] `v_zonas_con_conteo`
  - [x] `v_cuotas_estado`
  - [x] `v_alquileres_detalle`
  - [x] `v_comisiones_vendedor`
  - [x] `v_dashboard_admin`
- [x] Catálogo público sin exponer perfiles completos: nombres de agente y
      proveedor obtenidos con funciones `security definer`.
- [x] Probadas con RLS de administrador, vendedor, cliente y anónimo.

## Entregable 5 — Seed

- [x] `supabase/seed.sql`:
  - 8 zonas, 11 proveedores y 15 inmuebles con imágenes.
  - 10 visitas, 12 alquileres, 51 cuotas, 37 pagos y 12 comisiones.
  - Configuración global (5 %, 5 días de gracia, 5 días de aviso).
  - UUID estables, `on conflict do nothing`/upsert e idempotencia.
  - Bloque transaccional que se omite con un `NOTICE` si aún no existen los
    usuarios demo.
- [x] `scripts/seed-users.ts`:
  - Crea/actualiza admin, vendedor y cliente con la Admin API.
  - Correos: `rodrigo.alvarez@remaxpotosi.bo`,
    `carla.mendoza@remaxpotosi.bo`, `luis.catari@gmail.com`.
  - Contraseña de desarrollo: `RemaxDemo#2026` (editable con
    `SEED_DEMO_PASSWORD`).
  - Se niega a correr si `NODE_ENV`, `APP_ENV`, `SUPABASE_ENV` o `ENVIRONMENT`
    indican producción; no tiene bypass.
  - Si existe `SUPABASE_DB_URL`, ejecuta también `supabase/seed.sql`.
- [x] Documentado el orden: `pnpm db:seed-users` y luego el seed SQL (o
      automático con `SUPABASE_DB_URL`).

## Entregable 6 — Andamiaje del cliente

- [x] Dependencias `@supabase/supabase-js`, `@supabase/ssr`, `postgres` y
      `tsx`.
- [x] `src/lib/supabase/client.ts`: navegador, clave publicable y cookies de
      sesión.
- [x] `src/lib/supabase/server.ts`: cliente por petición con la sesión del
      usuario (cookies + `Authorization`), sin service role.
- [x] `src/server/supabase-admin.ts` (service role, solo servidor).
- [x] `src/types/database.types.ts`: tipos manuales con aviso para regenerar con
      `pnpm db:types`.
- [x] `src/types/domain.ts`: reexporta el modelo de `src/data/types.ts` y añade
      tipos de filas/vistas de la base.
- [x] `.env.example` con `VITE_SUPABASE_URL`,
      `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y la
      opcional `SUPABASE_DB_URL`.
- [x] `.gitignore` ya excluye `.env`, `.env.*` (salvo `.env.example`),
      `.dev.vars` y `.dev.vars.*`.
- [x] Scripts `db:types`, `db:bundle` (genera `supabase/full_setup.sql`) y
      `db:seed-users`.
- [x] Ninguna pantalla fue conectada a Supabase; los mocks siguen intactos.

## Entregable 7 — Documentación

- [x] `AGENTS.md` (raíz, 151 líneas) con stack, comandos, mapa, convenciones,
      diseño, pickers, reglas de DB, secretos, estado actual y enlaces.
- [x] `docs/PROJECT_CONTEXT.md`: dominio, roles, 9 HU, reglas y supuestos.
- [x] `docs/ARCHITECTURE.md`: capas, flujos, RPC, seguridad y riesgos.
- [x] `docs/DATABASE.md`: ER, tablas, enums, triggers, RPC, matriz RLS,
      Storage, cron y formas de aplicar.
- [x] `docs/DESIGN_SYSTEM.md`: tokens, tipografía, componentes, pickers y
      patrones UI.
- [x] `docs/ROUTES.md`: 22 pantallas por rol y estado real.
- [x] `docs/MIGRATION_PLAN.md`: fases auth → catálogo → visita → admin →
      visitas → cierre → pagos → cliente, con server functions faltantes.
- [x] `docs/DEPLOYMENT.md`: Cloudflare Workers, variables, secretos y
      verificación.
- [x] `docs/DECISIONS.md`: 14 decisiones con motivo y consecuencias.
- [x] `supabase/tests/verificaciones.sql` + `README.md`: 5 pruebas
      transaccionales y cómo ejecutarlas.
- [x] `docs/PROGRESS.md` actualizado.

## Decisiones tomadas en esta sesión

1. **Estado de alquiler `suspendido`:** el prompt hablaba de
   `vigente|finalizado|cancelado`, pero la UI (`src/data/types.ts`) usa
   `Suspendido`. Se agregó `suspendido` al enum para no romper el frontend. Un
   alquiler suspendido **no** libera el inmueble; solo `finalizado`/`cancelado`
   lo hacen.
2. **Estado de cuota `anulada`:** se agregó para poder anular cuotas pendientes
   al finalizar/cancelar un contrato sin borrar historial. La UI no lo muestra
   todavía; se puede mapear a un estado neutro en la vista.
3. **Habitaciones en locales:** CHECK estricto `habitaciones is null` cuando
   `tipo = 'local'`. El formulario actual envía `"0"`; la capa de migración
   deberá convertir `0 → null` antes de insertar.
4. **Rol desde el backend:** `handle_new_user()` solo acepta el rol de
   `raw_app_meta_data` cuando `creado_por_backend = true` (app_metadata solo la
   puede escribir la service role / Admin API). Un auto-registro siempre nace
   como `cliente`. Usar `app_metadata` en vez de `user_metadata` evita que el
   usuario se autoasigne un rol.
5. **Pago de cierre:** se registra como `pagos.tipo = 'cierre'`. Si su monto
   cubre la primera cuota, se enlaza a esa cuota (`cuota_id`) y se marca
   pagada; si no, la primera cuota queda pendiente.
6. **Mora:** recargo único del **5 %** del monto de la cuota, aplicado después
   de `dias_gracia = 5`. No es interés diario acumulado; es un supuesto
   documentado y editable en `configuracion`.
7. **Avisos de cuota:** `dias_aviso_previo = 5`. “Por vencer” se deriva en la
   vista; en la tabla solo existen `pendiente`, `pagada`, `en_mora`, `anulada`.
8. **`numero_contrato`:** contador por año en `contador_contratos`, formato
   `RMX-YYYY-0001`. Se genera con un upsert atómico.
9. **Zona y sector:** se normalizan en `zonas` (sector + nombre + slug). Los
   mocks solo tienen nombre de zona; el seed asignará el sector según
   `SECTORES` de `src/lib/catalog.ts`.
10. **Imágenes:** `inmueble_imagenes` acepta `url` externa (mocks) o `path` de
    Storage. La vista futura usará `coalesce(url, storage_public_url(path))`.
11. **Medios de pago:** el enum reduce la UI a `tarjeta | qr | efectivo | otro`.
    La distinción crédito/débito de la UI se conserva en el label, no en la DB.
12. **Trigger de auditoría:** se limita a las columnas sensibles indicadas;
    `perfiles` audita cambios de `rol` y `vendedores` cambios de
    `comision_fija`, no cada edición de nombre/teléfono.
13. **Pagos y redondeo:** `registrar_pago_cuota()` acepta un monto mayor o igual
    a `cuota.monto + recargo`; el excedente no se abona automáticamente a otra
    cuota. El pago queda registrado con su monto real y la cuota se marca
    pagada. Si se necesita abono parcial o saldo a favor, se implementará en una
    migración nueva.
14. **`suspendido` y unicidad:** el índice único parcial solo considera
    `estado = 'vigente'`. Un contrato suspendido conserva su historial y el
    inmueble sigue `en_alquiler`, pero no impide un cierre futuro; si el negocio
    decide lo contrario, se cambia el índice en una migración nueva.
15. **`pagos.validado`:** los pagos de administrador/vendedor nacen validados;
    los de un cliente quedan `validado = false`, pero la cuota se marca pagada
    igualmente porque el prototipo no implementa todavía un flujo de aprobación
    posterior. Si se requiere aprobación, `aplicar_pago()` debe condicionarse a
    `new.validado` en una migración nueva.
16. **Helpers `security definer`:** las políticas no consultan directamente
    otras tablas con RLS. Funciones como `puede_ver_alquiler()` y
    `puede_ver_inmueble()` concentran la regla y evitan recursión. Los nombres
    públicos del catálogo se resuelven con `nombre_agente()` y
    `nombre_proveedor()` para no exponer correo, teléfono ni CI.
17. **Storage privado por alquiler:** la primera carpeta de la ruta debe ser el
    UUID del alquiler. El cliente del alquiler puede leer contratos y
    comprobantes; el vendedor asignado y el admin pueden editar/borrar. Para el
    wizard de cierre, un vendedor puede **crear** el archivo de un alquiler que
    aún no existe (el UUID se genera en el cliente); si el alquiler ya existe,
    solo su vendedor o el admin pueden subir. Un vendedor no puede modificar
    archivos de un alquiler ajeno.
18. **Seed con tres usuarios:** los mocks tienen muchos vendedores/clientes sin
    cuenta de Auth. Para no inventar cuentas, el seed asigna todas las
    visitas/alquileres al vendedor y al cliente demo; el catálogo conserva las
    relaciones de proveedores e inmuebles. Los demás nombres de los mocks no se
    insertan como perfiles.
19. **Seed idempotente:** los UUID son estables, las tablas de catálogo usan
    upsert y las transaccionales `on conflict do nothing`. El histórico de
    pagos se siembra con los triggers `pagos_validar`/`pagos_aplicar`
    desactivados dentro de la transacción, porque las fechas de los mocks ya
    están conciliadas y no deben recalcularse. Si el seed falla, el rollback
    restaura los triggers.
20. **`seed-users.ts` y `SUPABASE_DB_URL`:** la Admin API no permite ejecutar
    SQL arbitrario. Para automatizar el seed se añadió el driver `postgres` y
    la variable opcional `SUPABASE_DB_URL`; sin ella, el script crea los
    usuarios y deja el seed SQL para el editor de Supabase.
21. **Tipos manuales:** `database.types.ts` se escribió a mano porque no hay
    Supabase CLI en este entorno. Incluye un comentario para regenerarlo con
    `pnpm db:types` cuando el proyecto esté enlazado.

## Verificación realizada (2026-10-20)

- [x] `pnpm exec tsc --noEmit` → 0 errores.
- [x] `pnpm check` → limpio (Biome).
- [x] `pnpm build` → cliente y SSR generados correctamente.
- [x] Migraciones `0001`–`0006` ejecutadas en orden sobre una base vacía
      (PGlite, con stubs de `auth`, `storage` y roles de Supabase).
- [x] 31 comprobaciones funcionales previas de triggers/RPC.
- [x] 17 comprobaciones nuevas de RLS, Storage, vistas y seed:
      catálogo anónimo, alquiler visible solo para su cliente/vendedor, cambio
      de rol bloqueado, políticas de contratos/comprobantes, alta de contrato
      antes de crear el alquiler, dashboard, seed idempotente y bucket público
      de inmuebles.
- [x] `pnpm db:bundle` genera `supabase/full_setup.sql` con las 7 migraciones.
- [x] `NODE_ENV=production pnpm db:seed-users` se niega a ejecutar.
- [x] Verificado que `dist/client` no contiene `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Revisión manual y ejecución de `full_setup.sql` + `seed.sql` en un
      proyecto Supabase real (pendiente: no hay CLI/Docker/credenciales).
- [ ] Repetir las pruebas con JWT reales emitidos por Supabase Auth.

## Cómo levantar el entorno

1. Copiar `.env.example` a `.env` y completar URL, clave publicable y service
   role.
2. Pegar `supabase/full_setup.sql` en el editor SQL de Supabase (o usar
   `supabase db reset` si hay CLI).
3. Ejecutar `pnpm db:seed-users`. Si `SUPABASE_DB_URL` está definida, el script
   ejecuta también `supabase/seed.sql`; si no, pegarlo a mano en el editor SQL.
4. Iniciar la app con `pnpm dev`. Las pantallas siguen usando mocks hasta el
   siguiente bloque de trabajo.

## Nota sobre herramientas locales

En este entorno **no hay** Docker, Supabase CLI, `psql` ni un servidor
PostgreSQL. La verificación se hizo con **PGlite** (PostgreSQL compilado a
WASM) en un directorio temporal, creando stubs de `auth.users`, `auth.uid()`,
los roles `anon`/`authenticated`/`service_role` y el esquema `storage`.
`0007_cron.sql` no se ejecutó en esta sesión porque PGlite no incluye `pg_cron`;
esa migración debe probarse en Supabase real. El arnés de PGlite es temporal y
no se versiona porque PGlite no es una dependencia del proyecto, pero las
pruebas SQL sí están versionadas en `supabase/tests/`. Esto valida sintaxis,
orden de dependencias, RLS, vistas y seed, pero **no sustituye** una prueba en
un proyecto Supabase real. Antes de dar por cerrado el backend hay que correr
`supabase db reset` o pegar `supabase/full_setup.sql` en el editor de Supabase y
repetir los tests.

## Verificación adicional (2026-10-23)

- [x] `pnpm tsc --noEmit` → 0 errores.
- [x] `pnpm lint` → 143 archivos, sin hallazgos.
- [x] `pnpm build` → cliente y SSR generados; solo el warning preexistente
      `SOURCEMAP_BROKEN` de CSS.
- [x] `pnpm db:bundle` → `supabase/full_setup.sql` con las 7 migraciones.
- [x] Migraciones `0001–0006` desde una base vacía y desde el bundle
      `full_setup.sql` (sin la sección de `pg_cron`) sobre PGlite.
- [x] Seed completo: 8 zonas, 15 inmuebles, 10 visitas, 12 alquileres, 51
      cuotas, 37 pagos y 12 comisiones.
- [x] `supabase/tests/verificaciones.sql` en verde: cierre de alquiler, pago de
      cuota, mora con gracia/deduplicación, doble reserva y protección de rol.
- [x] Las pruebas dejan la base intacta (rollback; conteos iguales al seed).
- [ ] Ejecutar `full_setup.sql` completo, incluido `0007`, en un Supabase real.
- [ ] Repetir las pruebas con JWT reales y archivos reales en Storage.
