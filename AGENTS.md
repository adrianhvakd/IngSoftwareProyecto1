# AGENTS.md — RE/MAX Potosí

Guía operativa para agentes que trabajen en este repositorio. El detalle vive en
`docs/`; este archivo es el punto de entrada.

## Stack y versiones

| Pieza | Versión / nota |
|---|---|
| TanStack Start + Router | `@tanstack/react-start` 1.169.3 · `@tanstack/react-router` 1.170.45 |
| React / TypeScript | React 19.2 · TypeScript 6 estricto (`noUnusedLocals`, `noUnusedParameters`) |
| Tailwind CSS | v4, tokens en `src/styles.css` (`@theme inline`); no hay `tailwind.config` |
| UI | shadcn/ui vendored en `src/components/ui` + Aceternity adaptado |
| Datos | `@supabase/supabase-js` 2.118 · `@supabase/ssr` 0.12 |
| Validación | `zod` 4 · `react-hook-form` 7 |
| Fechas / gráficos | `date-fns` 4 · `recharts` 3.8 |
| Deploy | Cloudflare Workers (`@cloudflare/vite-plugin` + Wrangler 4) |
| Lint / formato | Biome 2.4.5; paquete: **pnpm** |

## Comandos

```bash
pnpm install
pnpm dev                 # vite dev --port 3000
pnpm generate-routes     # regenera src/routeTree.gen.ts
pnpm build               # build cliente + worker
pnpm preview             # runtime workerd
pnpm deploy              # build + wrangler deploy
pnpm lint                # biome lint
pnpm check               # lint + formato
pnpm tsc --noEmit        # verificación de tipos
pnpm db:bundle           # migraciones -> supabase/full_setup.sql
pnpm db:types            # regenera tipos desde Supabase enlazado
pnpm db:seed-users       # crea las 3 cuentas demo (solo desarrollo)
```

Si Intent está instalado, correr `pnpm exec intent list` y cargar la skill local
que corresponda antes de editar. En este entorno `@tanstack/intent` falla con
`ERR_PACKAGE_PATH_NOT_EXPORTED`; si sigue así, reportarlo y no descargar un
reemplazo.

## Mapa de carpetas

```
src/routes/        Rutas file-based de TanStack Router (23 pantallas)
src/components/    brand, common, dashboard, landing, layout, property, pickers,
                   theme, aceternity y ui (shadcn vendorizado)
src/lib/           format.ts (Bs/fechas), catalog.ts, site.ts, storage.ts,
                   supabase/{client,server}.ts
src/server/        Código solo servidor: service role y createServerFn
src/types/         database.types.ts, domain.ts, models.ts y DTO por módulo
supabase/          migrations/ (fuente de verdad), seed.sql, full_setup.sql, tests/
scripts/           seed-users.ts y bundle-migrations.mjs
docs/              contexto, arquitectura, DB, diseño, rutas, plan y deploy
```

No editar `src/routeTree.gen.ts` a mano. En `src/components/ui/*`, `cn` se
importa de `"cn"` y Radix de `"radix-ui"`.

## Convenciones

- Idioma de producto: **es-BO**. Moneda: **Bs**. Teléfonos: **+591**.
- Base de datos: tablas, columnas, enums y comentarios en **español snake_case**.
- Fechas de negocio en `America/La_Paz` (UTC-4, sin horario de verano).
- Dinero `numeric(12,2)`; formato de contrato `RMX-YYYY-0001`.
- IDs del seed estables; no reutilizar IDs para datos nuevos.
- Componentes: nombres de dominio en español; utilidades genéricas en inglés.
- Accesibilidad: foco visible, labels, `aria-*`, contraste AA y
  `prefers-reduced-motion`.

## Diseño

- Azul RE/MAX `#003DA5` para marca, navegación y énfasis.
- **Rojo `#DC1C2D` solo para CTA de conversión** (buscar, agendar, publicar,
  cerrar alquiler, pagar). Nunca como fondo grande, hover genérico ni decoración.
- Neutros para superficies; estados semánticos solo en badges/alertas/gráficos.
- Tema claro/oscuro/sistema con tokens de `src/styles.css`; no usar colores
  hardcodeados ni `dark:` para valores que ya existen como token.
- Tipografía: Montserrat (`font-display`) en títulos; Inter (`font-sans`) en
  texto. Cifras con `tabular`.
- Contenedor `container-page` (máx. 1280 px). Radios, sombras y easings salen de
  tokens. Botón CTA con variante `cta` y press `active:scale-[0.98]`.

## Pickers obligatorios

No crear selects crudos para entidades. Usar:

| Entidad | Componente |
|---|---|
| Zona | `ZonePicker` (single/multiple) |
| Proveedor | `EntityPicker` |
| Cliente | `EntityPicker` |
| Vendedor | `EntityPicker` |
| Inmueble | `PropertyPicker` |
| Alquiler | `RentalPicker` |

Los pickers ya resuelven búsqueda, móvil (`Sheet`), estado vacío y resumen. Al
conectar Supabase, mantener su API y cambiar solo la fuente de datos.

## Base de datos

- `supabase/migrations/0001…0010` es la **fuente de verdad**. No editar una
  migración ya aplicada: crear `0011_...sql` y regenerar `full_setup.sql`.
- Toda función `security definer` debe fijar `search_path = ''` y calificar cada
  objeto (`public.tabla`, `auth.uid()`).
- RLS activo en las 16 tablas. Los helpers de autorización evitan recursión; no
  consultar tablas con RLS directamente dentro de una política.
- Las RPC atómicas (`registrar_alquiler`, `registrar_pago_cuota`,
  `agendar_visita`, `promover_a_vendedor`) son la vía de escritura para flujos
  de negocio; no duplicar esa lógica en el cliente.
- Vistas con `security_invoker = true`. No quitar esa opción.
- Storage: `inmuebles` público; `contratos` y `comprobantes` privados con ruta
  `{alquiler_id}/archivo`.
- Después de cambiar migraciones: `pnpm db:bundle` y ejecutar
  `supabase/tests/verificaciones.sql` en una base con seed.

## Secretos

- `VITE_*` termina en el bundle: solo URL y clave publicable.
- `SUPABASE_SERVICE_ROLE_KEY` es exclusivamente servidor/scripts; nunca `VITE_*`
  ni importada desde componentes.
- No commitear `.env`, `.dev.vars`, `SUPABASE_DB_URL` ni credenciales.
- `seed-users.ts` se niega a correr con `NODE_ENV/APP_ENV/SUPABASE_ENV/ENVIRONMENT`
  en producción.

## Estado actual (2026-10-28)

- Migraciones 0001–0010, seed, `full_setup.sql`, clientes Supabase y tipos
  listos; RLS, Storage, vistas, `pg_cron` y RPC de contraseña implementados.
  `0008`, `0009` y `0010` quedaron aplicadas en el proyecto Supabase de
  desarrollo el 2026-10-28.
- **Fase 1 de autenticación conectada**: login, registro (rol cliente), logout,
  sesión persistente por cookies, guards `beforeLoad` en `/admin`, `/vendedor`
  y `/cliente`, redirección por rol y pantalla obligatoria
  `/cambiar-password` cuando `debe_cambiar_password = true`.
- El nombre, correo, avatar y menú de usuario de los topbars y del navbar
  público leen `perfiles` de Supabase. La sesión se resuelve en el `beforeLoad`
  raíz y se comparte por contexto de router.
- El rol se lee de `perfiles` (no de `user_metadata`). La bandera de contraseña
  temporal solo se limpia con `marcar_password_actualizada()` (0008), protegida
  por trigger.
- **Fase 2 del sitio público conectada**: Inicio, `/propiedades` y
  `/propiedades/$id` leen `v_inmuebles_catalogo` y `v_zonas_con_conteo` con
  server functions y RLS. Filtros, orden y paginación se resuelven en el
  servidor; `ZonePicker` usa zonas y conteos reales. El detalle solo recibe
  `agente_nombre` desde la vista pública, así que no muestra teléfono ni correo
  del agente.
- **Agendador de visitas conectado** a la RPC `agendar_visita` vía
  `agendarVisita`; valida contacto, usa offset `-04:00`, prefija datos de la
  sesión y mapea errores de franja ocupada, inmueble no disponible, fecha
  pasada y permisos.
- **Fase 3 del panel administrador conectada** con server functions en
  `src/server/admin/` y RLS de administrador:
  - Dashboard real desde `v_dashboard_admin` más visitas próximas, cuotas en
    mora/por vencer, ingresos y comisiones.
  - Usuarios: listado de `perfiles`, cambio de rol (vendedor vía
    `promover_a_vendedor`) y activación/desactivación con protecciones para no
    degradar al último administrador ni la propia cuenta.
  - Vendedores: listado real, ascenso de cuentas existentes, alta con
    contraseña temporal (`crearUsuarioVendedor`), edición de perfil/comisión/
    zona y baja lógica.
  - Proveedores: listado con cartera real, alta, edición y eliminación con
    desactivación automática si tiene inmuebles asociados.
  - Inmuebles: listado, alta/edición con `cambiar_estado_inmueble`, destacado y
    fotos subidas al bucket público `inmuebles` antes de guardar las rutas en
    `inmueble_imagenes`. Los locales mantienen `habitaciones = null`.
  - Visitas: agenda real, asignación de vendedor y cambio de estado.
- **Fase 4 de alquileres, cierre y cobros conectada** con server functions en
  `src/server/alquileres/` y RLS por rol:
  - `/admin/alquileres` lee `v_alquileres_detalle`, muestra contratos, cuotas y
    pagos, abre el `Sheet` de detalle con enlaces firmados a contrato y
    comprobantes, y registra cobros con `registrar_pago_cuota`.
  - El wizard `RentalClosingWizard` (vendedor y admin) carga opciones reales,
    permite alta de cliente por `crearUsuarioCliente`, genera el UUID antes del
    cierre, sube contrato y comprobante privados solo al finalizar y ejecuta
    `registrar_alquiler`. Si falla el RPC, limpia los archivos subidos.
  - `/vendedor/registrar-pago` cobra cuotas reales con comprobante privado y
    `/vendedor/comisiones` lee `v_comisiones_vendedor`.
  - `/cliente/mi-alquiler` muestra todos sus contratos, cuota actual, historial,
    enlaces firmados y reporta pagos por QR con `reportarPagoCliente`; el pago
    queda pendiente de validación (`validado = false`).
- Las fechas de negocio se formatean siempre con `timeZone: "America/La_Paz"`
  para que SSR y navegador coincidan. Los grupos de agenda usan
  `fechaDiaLaPaz` para no desfasar el día.
- **Fase 5 completada**: `src/data/` se eliminó. `/vendedor`,
  `/vendedor/visitas`, `/cliente`, las notificaciones del topbar, los agentes y
  las métricas de la landing consumen Supabase. La acción simulada de alta de
  usuario se reemplazó por un enlace real a vendedores y “Olvidé mi contraseña”
  es un contacto real por correo.
- `0009_fase5_seguridad_y_publico.sql` agrega el trigger
  `visitas_proteger_campos`, `listar_agentes_publicos()` y
  `resumen_publico()`. `0010_storage_inmuebles_por_agente.sql` limita la
  escritura de fotos al admin o al agente del inmueble.
- Todas las mutaciones críticas siguen yendo por RPC; la UI solo valida para
  dar feedback. No replicar reglas de negocio en el cliente.
- Verificado con PGlite: migraciones, triggers/RPC, RLS, Storage, vistas y seed.
  La fase 2 se probó contra el proyecto Supabase configurado en desarrollo
  (lecturas reales del catálogo, alta de visita, rechazo de franja ocupada y
  limpieza del registro de prueba), además de `tsc`, Biome y SSR de `/`,
  `/propiedades`, un detalle válido y un detalle no disponible.
- **Recorrido real de la fase 3** con la cuenta `rodrigo.alvarez@…`: login,
  dashboard, usuarios, vendedores, proveedores, inmuebles, formulario de alta y
  edición, y visitas. Se probó alta y eliminación de un proveedor temporal; los
  proveedores con inmuebles se desactivan desde el servidor al intentar
  eliminarlos. No se crearon usuarios, inmuebles ni visitas de prueba para no
  dejar datos residuales.
- **Recorrido de la fase 4** con las tres cuentas demo en Chromium headless:
  admin (alquileres, detalle/cobro, wizard y dashboard), vendedor (registrar
  pago con cuota seleccionada y total, comisiones y cierre) y cliente (mi
  alquiler, historial y diálogo de pago QR). Sin errores de consola ni
  diferencias de hidratación. Se validaron `pnpm tsc --noEmit`, `pnpm check` y
  `pnpm build`. La contraseña demo depende de `SEED_DEMO_PASSWORD`;
  `pnpm db:seed-users` imprime la vigente y reejecuta `seed.sql` si
  `SUPABASE_DB_URL` está definida.
- Tests SQL versionados en `supabase/tests/`; correr con `psql` y el seed demo.
  El 2026-10-28 pasaron las 9 verificaciones contra el proyecto de desarrollo:
  cierre, pago, mora, doble reserva, rol, visitas de cliente/vendedor, landing
  pública y Storage por agente. La prueba deja la base con `rollback`.
- Recorrido de las tres cuentas demo con Chromium headless: login, rutas
  protegidas, redirecciones por rol, todas las pantallas de cada panel y
  `v_dashboard_admin`/tablas RLS directas desde el navegador. Cero errores de
  consola. Las cuentas demo se obtienen de `SEED_DEMO_PASSWORD`; no se imprimen
  en la app.
- Auditoría RLS (2026-10-28): el cliente solo ve sus 12 alquileres/cuotas/pagos
  y sus 10 visitas; el vendedor ve sus 9 visitas, sus 12 alquileres y sus 12
  comisiones; el admin ve todo. El seed tiene un solo cliente y un solo
  vendedor, por eso varios totales coinciden. Los intentos de editar notas,
  reprogramar, reasignar, marcar visitas como realizadas o cambiar el rol
  devolvieron `42501`. La subida de fotos a una carpeta ajena fue bloqueada y
  la del agente en su inmueble funcionó; los archivos de prueba se eliminaron.
- `pnpm tsc --noEmit`, `pnpm check`, `pnpm build` y `pnpm db:bundle` pasan. El
  cliente no contiene la service role ni claves secretas. `dist/server/.dev.vars`
  es un archivo local de preview, está en `.gitignore` y no se despliega.
- El build emite un warning preexistente `SOURCEMAP_BROKEN` de CSS; no bloquea.

## Documentación

- [Contexto y reglas](docs/PROJECT_CONTEXT.md)
- [Arquitectura](docs/ARCHITECTURE.md)
- [Base de datos](docs/DATABASE.md)
- [Sistema de diseño](docs/DESIGN_SYSTEM.md)
- [Rutas](docs/ROUTES.md)
- [Plan de migración](docs/MIGRATION_PLAN.md)
- [Despliegue](docs/DEPLOYMENT.md)
- [Decisiones](docs/DECISIONS.md)
- [Progreso](docs/PROGRESS.md)

Al terminar cada sesión, actualiza la sección Estado actual.
