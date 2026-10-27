# Sistema de diseño — RE/MAX Potosí

Última actualización: 2026-10-23. Implementación: `src/styles.css`,
`src/components/ui/`, `src/components/common/`, `src/components/pickers/`.

## 1. Principios

1. **Marca primero, conversión después.** Azul para identidad y navegación;
   rojo reservado para la acción principal.
2. **Claridad operativa.** Tablas densas pero legibles, cifras tabulares,
   estados con badge y acciones destructivas confirmadas.
3. **Consistencia entre paneles.** Las tres sesiones comparten shell, tipografía,
   radios, sombras y patrones de sheet/dialog.
4. **Accesible por defecto.** Foco visible, labels, contraste AA, áreas táctiles
   y movimiento reducido.

## 2. Tokens de color

Los valores viven en `:root` y `.dark`; se exponen a Tailwind en `@theme inline`.
No usar hex sueltos en componentes.

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--background` | `#f8fafc` | `#0b1220` | Fondo de página |
| `--foreground` | `#0f172a` | `#e6edf7` | Texto principal |
| `--card` | `#ffffff` | `#111b2e` | Tarjetas/superficies |
| `--primary` | `#003da5` | `#2f66d0` | Marca, links, foco |
| `--primary-foreground` | `#ffffff` | `#ffffff` | Texto sobre azul |
| `--cta` | `#dc1c2d` | `#dc1c2d` | **Solo CTA de conversión** |
| `--cta-hover` | `#b91c1c` | `#e8303f` | Hover del CTA |
| `--accent` | `#eaf0fb` | `#172a4d` | Hover de menús/filas |
| `--muted` | `#f1f5f9` | `#16213a` | Fondos secundarios |
| `--muted-foreground` | `#64748b` | `#94a3b8` | Texto secundario |
| `--border` | `#e2e8f0` | `#22304a` | Bordes |
| `--ring` | `#003da5` | `#5b8def` | Anillo de foco |
| `--success` / soft | `#15803d` / `#dcfce7` | `#4ade80` / `#12301f` | Pagada, realizada |
| `--warning` / soft | `#b45309` / `#fef3c7` | `#fbbf24` / `#33260c` | Por vencer, pendiente |
| `--destructive` | `#b42318` | `#ef4444` | Errores y acciones destructivas |

Reglas del rojo:

- Permitido: `Button variant="cta"`, pin del mapa, tag “Destacado”, acentos
  puntuales de conversión.
- Prohibido: fondos grandes, navegación, hover genérico, badges de estado
  normales.
- Acciones destructivas usan `destructive` (no `cta`) en outline/soft, con icono
  y diálogo de confirmación.

## 3. Tipografía

| Rol | Fuente | Token | Uso |
|---|---|---|---|
| Display | Montserrat Variable | `font-display` | H1–H3, hero, títulos de panel |
| Texto | Inter Variable | `font-sans` | Cuerpo, tablas, labels |
| Cifras | Inter + `tabular` | `tabular` | Precios, montos, porcentajes |

Escala observada: hero `text-4xl`–`text-6xl`, títulos de página `text-2xl`–
`text-3xl`, cuerpo `text-sm`/`text-base`, metadatos `text-xs`. No introducir
una tercera familia.

## 4. Forma, profundidad y movimiento

- Radio base `--radius: 0.625rem`; `rounded-md` en controles, `rounded-xl` en
  tarjetas destacadas.
- Sombras: `shadow-soft` (reposo) y `shadow-lift` (hover/elevación). En oscuro
  se recalibran.
- Easings: `--ease-out` (entradas), `--ease-in-out`, `--ease-drawer` (sheets).
- Duración típica 150–250 ms; press `active:scale-[0.98]`.
- Respetar `prefers-reduced-motion`: sin animaciones decorativas.
- Foco: anillo `ring-ring/50` de 3 px; nunca `outline: none` sin reemplazo.

## 5. Layout

- `container-page`: ancho máximo 1280 px con padding lateral.
- Público: navbar sticky + footer; landing con secciones full-width.
- Paneles: sidebar fija en desktop, sheet/drawer en móvil; topbar con breadcrumb,
  tema y usuario.
- Contenido de panel: `PageHeader` (título, descripción, acciones), grilla de
  `StatCard`, luego tarjetas/tablas.
- Tablas: `overflow-x-auto`, columnas de baja prioridad `hidden md:table-cell`.
- Formularios: una columna en móvil, dos en desktop; labels siempre visibles;
  barra de acciones fija en formularios largos.

## 6. Componentes compartidos

| Componente | Uso |
|---|---|
| `PageHeader` | Título/descripción/acciones de cada pantalla. |
| `StatCard` | KPI con icono, valor y hint. |
| `StatusBadge` + `*Tone` | Estado de inmueble, visita, cuota, rol y alquiler. |
| `EmptyState` | Sin resultados / sin datos, con acción opcional. |
| `SmartImage` | Imagen con lazy loading, dimensiones y fallback. |
| `DashboardShell` | Sidebar + topbar + contenido por rol. |
| `PublicLayout` | Navbar/footer del sitio público. |
| `ThemeToggle` | Claro / oscuro / sistema. |
| `Logo` / `Balloon` | Marca RE/MAX. |
| `QrVisual` | QR decorativo para pagos simulados. |
| `CredentialsCard` | Credenciales demo y copiado. |

## 7. Pickers obligatorios

No usar `<Select>` crudo para entidades. Los pickers abren `Dialog` en desktop y
`Sheet` en móvil, incluyen búsqueda, estado vacío, resumen y accesos a “ver
todos”/“nuevo”.

| Entidad | Componente | API mínima |
|---|---|---|
| Zona | `ZonePicker` | `mode`, `value: string[]`, `onChange`, `placeholder` |
| Proveedor | `EntityPicker` | `items: EntityOption[]`, `value`, `onChange`, `tabla`, `nuevo` |
| Cliente | `EntityPicker` | ídem, con `nuevo` para alta |
| Vendedor | `EntityPicker` | ídem, con comisión/cargo en `secundario` |
| Inmueble | `PropertyPicker` | `inmuebles`, `value`, `onChange`, `incluirNoDisponibles` |
| Alquiler | `RentalPicker` | `alquileres: AlquilerDetalle[]`, `value`, `onChange` |

Al conectar Supabase se conserva la API y se reemplaza la fuente. `EntityPicker`
ya soporta creación inline mediante render props; no duplicar diálogos.

## 8. Patrones UI

### Catálogo

- Filtros en sidebar (desktop) o `Sheet` (móvil), chips de filtros activos.
- Toggle grilla/lista, skeletons durante carga, `EmptyState` sin resultados.
- Tarjeta con portada, badge de estado, precio `Bs/mes`, zona, specs y CTA
  “Agendar visita”.

### Paneles

- KPIs arriba, gráficos después, tablas/agenda al final.
- Acciones de fila con iconos + tooltip; acciones destructivas con
  `AlertDialog`.
- Detalle de alquiler/cuota en `Sheet` o `Dialog`; nunca navegar fuera del
  contexto si se puede resolver en panel.

### Formularios y wizard

- Validación inline + `toast` de resultado; el botón principal se deshabilita
  mientras envía.
- Wizard de cierre: pasos vendedor → cliente → inmueble → contrato → firma →
  pago, con barra de progreso y resumen.
- Contrato imprimible con `@media print`; no imprimir navegación.
- Carga de archivos con `input` oculto + dropzone y nombre del archivo.

### Fechas, dinero y estados

- Fechas: `DD/MM/YYYY`; periodos `YYYY-MM`; hora `HH:mm`.
- Dinero: `formatBs` / `formatBsMes`; siempre `tabular`.
- Estados visibles en español capitalizado; el valor de DB es snake_case.
- Mora: badge rojo + recargo explícito, sin ocultar el monto base.

### Tema oscuro

- Usar tokens (`bg-card`, `text-muted-foreground`, `border-border`), no
  `dark:bg-slate-*` ad hoc.
- Verificar contraste de badges y gráficos en ambos temas.
- El toggle persiste en `localStorage` (`remax-theme`); el script inline evita
  flash antes de hidratar.

## 9. Accesibilidad

- Todo control tiene label o `aria-label`; iconos decorativos `aria-hidden`.
- Diálogos con título/descripción; foco atrapado por Radix.
- No depender solo del color: badge + texto de estado.
- Imágenes con `alt` significativo; decorativas con `alt=""`.
- Tablas con `thead`, `th`, `scope` cuando aplique; scroll horizontal accesible.
- Áreas táctiles mínimas ~40 px en móvil; evitar hover como única señal.
