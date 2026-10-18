# context.md — RE/MAX Potosí (prototipo visual)

> Documento de traspaso. Describe **qué existe, cómo está construido y desde dónde continuar**.
> Fecha de esta nota: **2026-10-18**. No hay lógica de negocio real ni backend: es un **prototipo visual** navegable.

---

## 1. Objetivo

Prototipo visual, presentable y completo de la plataforma de **gestión y alquiler de inmuebles de RE/MAX Potosí** (Bolivia).

- Idioma: **es-BO**. Moneda: **Bs**. Teléfonos: **+591**.
- Datos **ficticios** de ejemplo (Potosí: Pailaviri, San Clemente, Av. Villazón, Zona Universitaria, Av. Las Bandera, Cerro Rico, etc.).
- Interactividad **solo local** (diálogos, sheets, tabs, stepper, filtros, toasts "acción simulada"). Sin API, sin auth real, sin persistencia.

---

## 2. Stack

| Pieza | Versión / nota |
|---|---|
| TanStack Start + TanStack Router (file-based) | `@tanstack/react-start` 1.169.x, `@tanstack/react-router` 1.170.x |
| React | 19 |
| TypeScript | 6, `strict` + `noUnusedLocals`/`noUnusedParameters` |
| Tailwind CSS | v4 (tokens en `@theme inline` dentro de `src/styles.css`, **no** hay `tailwind.config`) |
| shadcn/ui | generado en `src/components/ui` (38 componentes) |
| Aceternity UI | adaptadas a tema claro en `src/components/aceternity` |
| Animación | `motion` (framer) v14 |
| Iconos | `lucide-react` v1.58 |
| Gráficos | `recharts` 3.8 (envuelto en `components/ui/chart.tsx`) |
| Toasts | `sonner` |
| Formularios | `react-hook-form` + `zod` + `@hookform/resolvers` |
| Fechas | `date-fns` + `react-day-picker` |
| Fuentes | `@fontsource-variable/montserrat` (display) + `@fontsource-variable/inter` (texto) |
| Deploy | Cloudflare Workers (`@cloudflare/vite-plugin` + `wrangler`) |
| Lint/format | Biome (`biome.json`) |
| Package manager | **pnpm** |

> ⚠️ **Convención de imports importante**: los componentes `src/components/ui/*` importan `cn` desde el paquete **`"cn"`** (no `@/lib/utils`) y Radix desde **`"radix-ui"`** (p. ej. `import { Slot } from "radix-ui"`). No existe `src/lib/utils.ts`. Mantener esa convención al añadir componentes shadcn.

---

## 3. Comandos

```bash
pnpm install
pnpm dev              # vite dev --port 3000 (si 3000 ocupado, vite usa 3001+)
pnpm generate-routes  # tsr generate → regenera src/routeTree.gen.ts
pnpm build            # vite build (incluye worker de Cloudflare)
pnpm preview          # vite preview → sirve en el runtime de Workers (workerd)
pnpm deploy           # pnpm build && wrangler deploy  (requiere wrangler login)
pnpm cf-typegen       # wrangler types
pnpm lint             # biome lint
pnpm check            # biome check (lint + formato)
```

---

## 4. Estructura

```
proyecto_final/
├─ public/
│  ├─ favicon.svg
│  ├─ og-image.svg
│  └─ robots.txt            # Disallow: / (prototipo, no indexar)
├─ src/
│  ├─ components/
│  │  ├─ aceternity/        spotlight, text-generate-effect, flip-words,
│  │  │                     infinite-moving-cards, animated-tooltip, bento-grid,
│  │  │                     three-d-card, timeline
│  │  ├─ brand/             logo.tsx, balloon.tsx
│  │  ├─ common/            smart-image, status-badge, empty-state, section-heading
│  │  ├─ dashboard/         dashboard-shell, dashboard-sidebar, dashboard-topbar,
│  │  │                     nav-config, page-header, stat-card, charts/
│  │  ├─ landing/           hero, featured-properties, categories, how-it-works,
│  │  │                     metrics, agents, testimonials, final-cta
│  │  ├─ layout/            public-layout, public-navbar, public-footer, auth-layout
│  │  ├─ property/          property-card, property-card-skeleton, property-gallery,
│  │  │                     location-map, visit-scheduler, property-filters
│  │  ├─ system/            not-found-page, error-page
│  │  └─ ui/                38 componentes shadcn
│  ├─ data/                 types.ts + 11 archivos de datos + index.ts (selectores/métricas)
│  ├─ hooks/                use-mobile.ts
│  ├─ lib/                  format.ts (Bs/fechas), catalog.ts (filtros/orden)
│  ├─ routes/               (ver sección 5)
│  ├─ router.tsx
│  ├─ routeTree.gen.ts      # GENERADO por tsr — no editar a mano
│  └─ styles.css            # tokens, fuentes, keyframes, reduced-motion, print
├─ AGENTS.md                # reglas de carga de skills (Intent)
├─ biome.json
├─ components.json          # config shadcn
├─ tsconfig.json
├─ tsr.config.json
├─ vite.config.ts
├─ wrangler.jsonc           # config Cloudflare Workers
├─ pnpm-workspace.yaml
└─ package.json
```

---

## 5. Rutas / pantallas (21 vistas)

**Público**
- `/` — landing (hero con spotlight + globo RE/MAX, destacados, categorías, cómo funciona, métricas, agentes, testimonios, CTA final).
- `/propiedades` — catálogo: filtros (sidebar en desktop / `Sheet` en móvil), chips de filtros activos, orden, toggle grilla/lista, paginación, skeletons, estado vacío, carga simulada ~620 ms.
- `/propiedades/$id` — detalle: galería + lightbox (`Dialog`), mapa SVG estático con pin rojo + "Cómo llegar", agendador de visita validado (calendario en `Popover`, franjas horarias, diálogo de éxito).
- `/ingresar` — acceso demo a los 3 paneles.
- `/registro` — alta de cuenta.

**Administrador** (`/admin`, layout `admin/route.tsx`)
- `/admin` — KPIs, gráfico de ingresos (área), estado de visitas (dona), próximas visitas, alertas de vencimiento.
- `/admin/usuarios` — búsqueda + filtros rol/estado; cambio de rol con `AlertDialog`.
- `/admin/vendedores` — tabla + `Sheet` de alta/edición (comisión fija) + "dar de baja" con confirmación.
- `/admin/inmuebles` — tabla/galería con filtros.
- `/admin/inmuebles/nuevo` — formulario por secciones (propietario, specs, precios, fechas), dropzone de imágenes real (object URLs), barra de acciones fija.
- `/admin/visitas` — agenda + tabla, asignación de agente en línea, cambio de estado.
- `/admin/alquileres` — contratos + calendario de cuotas + `Sheet` de detalle con historial y recargo por mora.

**Vendedor** (`/vendedor`, layout `vendedor/route.tsx`)
- `/vendedor` — resumen, próximas visitas, acciones rápidas, contratos.
- `/vendedor/visitas` — agenda/tabla con "realizada"/"cancelar".
- `/vendedor/cierre-alquiler` — **stepper de 3 pasos**: datos → contrato imprimible (`@media print`) → escaneo + resumen de comisión.
- `/vendedor/registrar-pago` — medio de pago (tarjeta/QR/efectivo), QR visual generado, comprobante + validación.
- `/vendedor/comisiones` — detalle por contrato + acumulado mensual (barras).

**Cliente** (`/cliente`, layout `cliente/route.tsx`)
- `/cliente` — mis visitas (próximas + historial).
- `/cliente/mi-alquiler` — próxima cuota, pago en línea (`Dialog` con QR), historial y detalle de contrato.

**Sistema** (en `__root.tsx`): `notFoundComponent` (página 404 con marca) y `errorComponent` (límite de error con marca).

---

## 6. Modelo de datos (`src/data/`)

Fuente única para todas las pantallas. Tipos en `src/data/types.ts`:

`Usuario`, `Vendedor` (con `comisionFija`), `Cliente` (con `telefonoContacto`), `Proveedor`, `Inmueble` (con `descripcion`, `precio`, `fechaDisponibilidad`, `costoPublicacion`, `imagenes`, `amenidades`…), `Visita` (`fechaHora`, `estado`), `Alquiler` (`fechaInicio`, `montoMensual`, `diaCobro`, `deposito`, `comisionFija`), `Pago` (`monto`, `recargoMora`, `fechaPago`, `medioPago`, `comprobante`, `estado`).

Volumen de datos de ejemplo:
- **12** inmuebles, **10** visitas, **6** alquileres (5 Vigente + 1 Finalizado), **30** cuotas de pago.
- **12** usuarios, **5** vendedores, **8** clientes, **5** proveedores, **6** testimonios.

`src/data/index.ts` expone:
- Búsquedas: `getInmueble`, `getVendedor`, `getCliente`, `getProveedor`, `getAlquiler`, `getUsuario`.
- Vistas unidas: `getVisitasDetalle()` (Visita + cliente + inmueble + vendedor), `getAlquileresDetalle()` (Alquiler + inmueble + cliente + vendedor + `cuotaActual` + `pagos`).
- Selectores: `getPagosDeAlquiler`, `getVisitasDeCliente`, `getAlquileresDeCliente`, `getInmueblesSimilares`, `getComisionesVendedor`.
- Métricas: `getResumenAdministrador()` (inmuebles activos, visitas de la semana, alquileres vigentes, cobros del mes, mora, morosidad%).

Sesiones demo (en `src/components/dashboard/nav-config.ts` → `SESIONES`):
- Administrador: Rodrigo Álvarez Paredes · Vendedor: Carla Mendoza Vaca (vnd-001) · Cliente: Luis Fernando Catari Choque (cli-001).

---

## 7. Diseño / marca (reglas que respetar)

- **Paleta**: neutros ~70 %, azul `#003DA5` ~20 %, rojo `#DC1C2D` ~10 %.
- **Rojo `#DC1C2D` SOLO** para CTAs de conversión (Buscar propiedades, Agendar visita, Contactar agente, Publicar inmueble, Procesar alquiler), pines del mapa y tag "Destacado". **Nunca** en fondos grandes ni hovers genéricos.
- Tokens en `src/styles.css` (`:root` + `@theme inline`): `--primary` (azul), `--cta` (rojo), `--blue-dark`, `--blue-deep`, `--blue-soft`, `--success*`, `--warning*`, `--destructive`, `--radius`, `--shadow-soft/lift`, `--ease-*`.
- Fuentes: `font-display` (Montserrat) para títulos, `font-sans` (Inter) para texto. Precios y cifras con la utilidad `tabular` (`font-variant-numeric: tabular-nums`).
- Contenedor máx. **1280 px** → utilidad `container-page`. Tema **claro únicamente**.
- Variante de botón `cta` (rojo) y micro-interacción de "press" (`active:scale-[0.98]`). Foco visible con anillo azul.
- Se respetan `prefers-reduced-motion`, `loading="lazy"`, `width/height` + `aspect-ratio` en imágenes (vía `SmartImage` con fallback gradiente+icono), labels/aria/alt y contraste AA.

---

## 8. Decisiones y supuestos (para no rehacer)

- **"Hoy" fijo en 2026-10-17** en el código (`new Date("2026-10-17T00:00:00")`, p. ej. `HOY` en `visit-scheduler.tsx`, `admin/index.tsx`, `vendedor/visitas.tsx`) para **evitar desajustes de hidratación** en calendarios/fechas relativas. `formatRelativo()` también usa esa base.
- **Logo**: `Logo` usa `/public/logo-remax.svg` solo si `VITE_USE_LOGO_SVG === "true"`; si no, compone el wordmark "RE/MAX" + "Potosí". El archivo SVG **no se incluye** a propósito para no provocar un 404. El motivo del globo RE/MAX se dibuja aparte (`brand/balloon.tsx`) solo en hero/login.
- **Iconos de marca**: `lucide-react` v1.58 **no** trae logos de redes (Facebook/Instagram/LinkedIn). En el footer se mapean a iconos genéricos (`ThumbsUp`, `Camera`, `Music2`, `Briefcase`).
- **Biome / formato**: `biome.json` usa `indentStyle: tab` y `quoteStyle: double`. Se normalizó todo el repo a ese formato. Hay un `overrides` que **desactiva reglas a11y/correctness ruidosas en `src/components/ui/**`** (código vendorizado de shadcn). `src/styles.css` y `src/routeTree.gen.ts` están excluidos del lint.
- **Skills (Intent)**: `AGENTS.md` pide usar el CLI de Intent, pero `@tanstack/intent` **no está instalado**. Se reportó y se cargaron las skills equivalentes vía la herramienta de skills (`design-taste-frontend`, `high-end-visual-design`, `impeccable`, `emil-design-eng`, `animation-performance`, `full-output-enforcement`).
- **Sonner**: `components/ui/sonner.tsx` fue reescrito para quitar `next-themes` (no instalado) y forzar `theme="light"`.
- **Tablas responsivas**: patrón `overflow-x-auto` ("scroll contenido") + `hidden md:table-cell` para columnas de baja prioridad.
- **Sin git**: hasta ahora el proyecto no estaba bajo control de versiones. Se añadió `.gitignore` (ver sección 10).

---

## 9. Despliegue: Cloudflare Workers

Configurado siguiendo la guía oficial de TanStack Start → sección **Cloudflare Workers**.

- `vite.config.ts`: plugin `cloudflare({ viteEnvironment: { name: "ssr" } })` **como primer plugin**, antes de `tanstackStart()`. Se conservan `devtools`, `tailwindcss`, `viteReact` y `resolve.tsconfigPaths`.
- `wrangler.jsonc`:
  ```jsonc
  {
    "$schema": "node_modules/wrangler/config-schema.json",
    "name": "remax-potosi-prototipo",
    "compatibility_date": "2026-10-17",
    "compatibility_flags": ["nodejs_compat"],
    "main": "@tanstack/react-start/server-entry"
  }
  ```
- `package.json`: scripts `build`, `preview`, `deploy`, `cf-typegen`. **No** existe script `start` (Workers no usa Node).
- `pnpm-workspace.yaml`: `allowBuilds` incluye `workerd: true` (junto a `esbuild`, `lightningcss`) — necesario para el `postinstall` de workerd; sin esto `pnpm preview` no arranca.
- SEO off: `public/robots.txt` (`Disallow: /`) y meta `robots = "noindex, nofollow"` en `src/routes/__root.tsx`.
- Salidas del build: `dist/client` (assets) y `dist/server` (worker entry `dist/server/index.js`). El plugin escribe `.wrangler/deploy/config.json` (apunta a `dist/server/wrangler.json`).
- **No se hizo `wrangler login` ni `wrangler deploy`** (solo verificaciones locales + un `wrangler deploy --dry-run` que valida el bundle).

---

## 10. .gitignore

En la raíz. Cubre: `node_modules`, `.pnpm-store`, salidas de build (`dist`, `dist-ssr`, `.output`, `.vinxi`, `.nitro`, `.tanstack`, `.wrangler`, `.vite`, `*.tsbuildinfo`), secretos locales de Cloudflare (`.dev.vars`, `.dev.vars.*`), `.env*` (conservando `!.env.example`), logs, archivos de editor/SO (ignora `.vscode/*` salvo `settings.json`/`extensions.json`/`*.code-snippets`), y temporales (`*.local`, `__unconfig*`, `todos.json`, `coverage`, `.eslintcache`).

Notas para el commit:
- `src/routeTree.gen.ts` **se commitea** (es generado, pero la plantilla de TanStack Start lo versiona; se regenera con `pnpm generate-routes` o el plugin de Vite).
- Se commitean `wrangler.jsonc`, `biome.json`, `components.json`, `tsconfig.json`, `tsr.config.json`, `vite.config.ts`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `public/*`, `.vscode/settings.json`.

---

## 11. Estado de verificación (última corrida)

| Comando | Resultado |
|---|---|
| `pnpm tsc --noEmit` | ✅ 0 errores |
| `pnpm lint` / `pnpm check` (biome) | ✅ 0 errores, 0 warnings |
| `pnpm build` | ✅ exit 0, sin warnings |
| `pnpm preview` (workerd) | ✅ 200 en rutas probadas; `robots.txt` y meta `noindex` correctos |
| `wrangler deploy --dry-run` | ✅ bundle válido, sin bindings, sin login |

Bug corregido (por si reaparece): `text-blue-deep` se usaba pero el token no existía; se definió `--blue-deep` + `--color-blue-deep` en `src/styles.css`.

---

## 12. Dónde continuar / ideas pendientes

- **Datos y pantallas**: es un prototipo "cerrado"; si se pide más, se pueden añadir detalles por entidad (p. ej. detalle de inmueble dentro de `/admin`, o un flujo explícito de mora/cobranza).
- **Formularios**: `react-hook-form` + `zod` están instalados pero varios formularios usan estado controlado simple. Si se quiere, se pueden migrar a `useForm` + `zodResolver`.
- **`admin/inmuebles/nuevo`**: guarda con `toast` + navegación (no persiste). El dropzone usa `URL.createObjectURL` (hay que revocarlas al desmontar si se refactoriza).
- **`admin/alquileres`** y **`cliente/mi-alquiler`**: el "registrar/pagar" solo actualiza estado local + toast.
- **Charts**: `IncomeChart` deriva comisiones como 12 % de lo cobrado (documentado como ejemplo); `VisitsChart` cuenta estados de `visitas`.
- **Deploy real**: falta `pnpm exec wrangler login` y `pnpm deploy` (no ejecutado a propósito).
- **Intent**: si se instala `@tanstack/intent`, correr `pnpm exec intent list` antes de editar según `AGENTS.md`.

---

## 13. Gotchas rápidos

- No editar `src/routeTree.gen.ts` a mano; se regenera.
- `pnpm generate-routes` (tsr) imprime un warning benigno de dependencia circular.
- En `src/components/ui/*`, `cn` viene de `"cn"` y Radix de `"radix-ui"`.
- Mantener el plugin `cloudflare(...)` **antes** de `tanstackStart()` en `vite.config.ts`.
- Si un puerto está ocupado, `vite dev`/`vite preview` eligen el siguiente automáticamente.
- El launcher de pnpm advierte que `package.json#pnpm.onlyBuiltDependencies` ya no se lee; pnpm 12 lee `allowBuilds` desde `pnpm-workspace.yaml`.
