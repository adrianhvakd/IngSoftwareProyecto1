# Rutas y pantallas — RE/MAX Potosí

Última actualización: 2026-10-23. Implementación: `src/routes/`, generadas en
`src/routeTree.gen.ts`.

## Estado actual

- Las 22 pantallas existen y son navegables con **mocks** de `src/data/`.
- `ingresar` y `registro` simulan sesión con `toast`; no crean sesión real.
- No hay guards (`beforeLoad`) ni redirección por rol. Cualquiera puede abrir
  `/admin`, `/vendedor` o `/cliente` escribiendo la URL.
- No hay `createServerFn` de datos ni loaders Supabase. Los formularios mutan
  estado local y muestran “Acción simulada”.
- `src/routes/__root.tsx` provee tema, toaster, 404 y error boundary.

## Público

| Ruta | Pantalla | Estado / notas |
|---|---|---|
| `/` | Landing | Mock completo: hero, destacados, categorías, cómo funciona, métricas, agentes, testimonios, CTA. |
| `/propiedades` | Catálogo | Mock funcional: filtros, orden, grilla/lista, paginación y skeletons. Carga simulada de ~620 ms. |
| `/propiedades/$id` | Detalle de inmueble | Mock: galería/lightbox, mapa, similares y agendador validado; el envío es local. |
| `/ingresar` | Acceso demo | Simula login con selector de rol; no usa Supabase Auth. |
| `/registro` | Registro | Simula alta; no crea usuario ni perfil. |
| `*` | 404 | `notFoundComponent` con marca. |

## Administrador

Layout: `src/routes/admin/route.tsx` (sidebar/topbar). Sin guardia.

| Ruta | Pantalla | Estado / notas |
|---|---|---|
| `/admin` | Dashboard | KPIs, ingresos, visitas, próximas visitas y alertas desde mocks. |
| `/admin/inmuebles` | Cartera | Tabla/galería, filtros, destacar y cambiar estado (simulado). |
| `/admin/inmuebles/nuevo` | Alta de inmueble | Formulario por secciones, dropzone local; guarda simulado. |
| `/admin/inmuebles/$id/editar` | Edición de inmueble | Prellenado desde mock; guarda simulado. |
| `/admin/visitas` | Agenda de visitas | Asignación de agente y cambio de estado simulados. |
| `/admin/alquileres` | Alquileres y cobros | Tabla, cuotas y `Sheet` de detalle; cobro/descarga simulados. |
| `/admin/alquileres/nuevo` | Nuevo alquiler | Reutiliza el wizard de cierre en contexto admin. |
| `/admin/usuarios` | Usuarios | Búsqueda, filtros, cambio de rol y activación simulados. |
| `/admin/vendedores` | Vendedores | Tabla, alta/edición, comisión y baja simuladas. |
| `/admin/proveedores` | Proveedores | Tabla, alta/edición y baja simuladas; usa `EntityPicker`/diálogos. |

## Vendedor

Layout: `src/routes/vendedor/route.tsx`. Sin guardia; `vendedorActual` es mock.

| Ruta | Pantalla | Estado / notas |
|---|---|---|
| `/vendedor` | Resumen | Visitas, contratos y comisiones desde mocks. |
| `/vendedor/visitas` | Mis visitas | Agenda/tabla; marcar realizada o cancelar simulado. |
| `/vendedor/cierre-alquiler` | Cierre de alquiler | Wizard de 6 pasos con contrato imprimible, archivos locales y resumen; no persiste. |
| `/vendedor/registrar-pago` | Registrar pago | Selección de alquiler/cuotas, medio, comprobante y QR; pago simulado. |
| `/vendedor/comisiones` | Comisiones | Detalle por contrato y acumulado mensual desde mocks. |

## Cliente

Layout: `src/routes/cliente/route.tsx`. Sin guardia; `clienteActual` es mock.

| Ruta | Pantalla | Estado / notas |
|---|---|---|
| `/cliente` | Mis visitas | Próximas e historial; cancelar simulado. |
| `/cliente/mi-alquiler` | Mi alquiler | Próxima cuota, pago con QR, historial y contrato; pago/descarga simulados. |

## Mapa de protección pendiente

| Prefijo | Rol esperado | Guardia actual |
|---|---|---|
| `/admin/*` | administrador | ❌ ninguna |
| `/vendedor/*` | vendedor | ❌ ninguna |
| `/cliente/*` | cliente | ❌ ninguna |
| `/ingresar`, `/registro` | anónimo (redirigir si hay sesión) | ❌ ninguna |

Al implementar auth, cada layout debe validar sesión y rol en servidor
(`beforeLoad`/loader con `getSupabaseServer()`), no solo en cliente. Un usuario
sin perfil activo debe cerrar sesión o mostrar acceso denegado.

## Convenciones de navegación

- Nombres de menú en `src/components/dashboard/nav-config.ts`; agregar una ruta
  implica actualizar su grupo y el mapa de este documento.
- Enlaces internos con `Link` de TanStack Router; no usar `<a href>` para rutas
  de la app.
- Rutas con `$id` reciben el identificador estable de la entidad (UUID en
  Supabase; id de mock mientras no se conecte).
- La ruta de edición de inmueble es la única con detalle por id en admin.
