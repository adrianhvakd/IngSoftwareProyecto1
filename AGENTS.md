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
src/routes/        Rutas file-based de TanStack Router (22 pantallas)
src/components/    brand, common, dashboard, landing, layout, property, pickers,
                   theme, aceternity y ui (shadcn vendorizado)
src/data/          Mocks y selectores; fuente actual de todas las pantallas
src/lib/           format.ts (Bs/fechas), catalog.ts, supabase/{client,server}.ts
src/server/        Código solo servidor: service role y createServerFn
src/types/         database.types.ts (manual) y domain.ts
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
- IDs de mocks/seed estables; no reutilizar IDs para datos nuevos.
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

- `supabase/migrations/0001…0007` es la **fuente de verdad**. No editar una
  migración ya aplicada: crear `0008_...sql` y regenerar `full_setup.sql`.
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

## Estado actual (2026-10-23)

- Migraciones 0001–0007, seed, `full_setup.sql`, clientes Supabase y tipos
  listos; RLS, Storage, vistas y `pg_cron` implementados.
- El frontend **sigue usando mocks**. No hay auth real, guards de ruta,
  server functions de datos ni pantallas conectadas.
- Los formularios simulan con `toast` y `setTimeout`.
- Verificado con PGlite: migraciones, triggers/RPC, RLS, Storage, vistas y seed.
  **No** se ejecutó todavía en un Supabase real ni con JWT reales (sin
  Docker/CLI/credenciales en el entorno).
- Tests SQL versionados en `supabase/tests/`; correr con `psql` y el seed demo.
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
