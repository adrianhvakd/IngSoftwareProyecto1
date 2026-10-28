# Rutas y pantallas — RE/MAX Potosí

Última actualización: 2026-10-28. Implementación: `src/routes/`, generadas en
`src/routeTree.gen.ts`.

## Estado actual

- Las 23 pantallas existen y consumen Supabase con server functions y RLS. No
  quedan datos de ejemplo ni acciones simuladas.
- `ingresar`, `registro` y logout usan Supabase Auth con cookies; cada layout
  protegido valida sesión y rol en `beforeLoad` y redirige según
  `perfiles.rol`.
- `/vendedor`, `/vendedor/visitas` y `/cliente` cargan visitas, contratos,
  comisiones y cobros reales. La recuperación de contraseña se atiende por
  correo a la oficina; no hay pantalla simulada.
- `src/routes/__root.tsx` provee tema, toaster, 404 y error boundary. Los
  loaders que fallan muestran el error boundary global.

## Público

| Ruta | Pantalla | Estado / notas |
|---|---|---|
| `/` | Landing | Destacados, zonas, agentes y métricas reales desde Supabase. |
| `/propiedades` | Catálogo | Filtros, orden y paginación en servidor sobre `v_inmuebles_catalogo`; solo disponibles. |
| `/propiedades/$id` | Detalle de inmueble | Inmueble real, galería, similares y agendador con RPC. |
| `/ingresar` | Acceso | Supabase Auth con correo/contraseña; redirige por rol. Recuperación por correo a la oficina. |
| `/registro` | Registro | Alta real con rol cliente y perfil por trigger. |
| `*` | 404 | `notFoundComponent` con marca. |

## Autenticación compartida

| Ruta | Pantalla | Estado / notas |
|---|---|---|
| `/cambiar-password` | Cambio obligatorio | Obligatoria si `debe_cambiar_password`; usa `marcar_password_actualizada`. |

## Administrador

Layout: `src/routes/admin/route.tsx`. Guardia de rol administrador.

| Ruta | Pantalla | Estado / notas |
|---|---|---|
| `/admin` | Dashboard | `v_dashboard_admin`, visitas próximas, mora, ingresos y comisiones. |
| `/admin/inmuebles` | Cartera | Filtros, destacar y cambiar estado reales; fotos en Storage. |
| `/admin/inmuebles/nuevo` | Alta de inmueble | Formulario real con `ZonePicker`/`EntityPicker` y dropzone. |
| `/admin/inmuebles/$id/editar` | Edición de inmueble | Carga y guarda contra Supabase. |
| `/admin/visitas` | Agenda de visitas | Asignación de vendedor y cambio de estado reales. |
| `/admin/alquileres` | Alquileres y cobros | `v_alquileres_detalle`, `Sheet` de detalle, URLs firmadas y cobro por RPC. |
| `/admin/alquileres/nuevo` | Nuevo alquiler | Wizard de cierre real en contexto admin. |
| `/admin/usuarios` | Usuarios | Roles, activación y protecciones de último administrador; enlace real a alta de vendedor. |
| `/admin/vendedores` | Vendedores | Alta con contraseña temporal, edición, comisión y baja lógica. |
| `/admin/proveedores` | Proveedores | Cartera real, alta/edición y baja con desactivación automática. |

## Vendedor

Layout: `src/routes/vendedor/route.tsx`. Guardia de rol vendedor.

| Ruta | Pantalla | Estado / notas |
|---|---|---|
| `/vendedor` | Resumen | Visitas, contratos, comisiones y cobros del mes reales. |
| `/vendedor/visitas` | Mis visitas | Agenda real; confirmar/cancelar con RLS y trigger 0009. |
| `/vendedor/cierre-alquiler` | Cierre de alquiler | Wizard real: cliente nuevo/existente, UUID previo, Storage privado y `registrar_alquiler`. |
| `/vendedor/registrar-pago` | Registrar pago | Alquileres/cuotas reales, comprobante privado y `registrar_pago_cuota`. |
| `/vendedor/comisiones` | Comisiones | `v_comisiones_vendedor` con detalle por contrato y mes. |

## Cliente

Layout: `src/routes/cliente/route.tsx`. Guardia de rol cliente.

| Ruta | Pantalla | Estado / notas |
|---|---|---|
| `/cliente` | Mis visitas | Próximas e historial reales; cancelar visita pendiente propia. |
| `/cliente/mi-alquiler` | Mi alquiler | Contratos múltiples, cuota actual, historial, URLs firmadas y reporte de pago QR real. |

## Mapa de protección

| Prefijo | Rol esperado | Guardia actual |
|---|---|---|
| `/admin/*` | administrador | ✅ `beforeLoad` en layout |
| `/vendedor/*` | vendedor | ✅ `beforeLoad` en layout |
| `/cliente/*` | cliente | ✅ `beforeLoad` en layout |
| `/ingresar`, `/registro` | anónimo (redirigir si hay sesión) | ✅ |

## Convenciones de navegación

- Nombres de menú en `src/components/dashboard/nav-config.ts`; agregar una ruta
  implica actualizar su grupo y el mapa de este documento.
- Enlaces internos con `Link` de TanStack Router; no usar `<a href>` para rutas
  de la app.
- Rutas con `$id` reciben el UUID estable de Supabase.
- Contrato y comprobante privados se abren con URLs firmadas; no se exponen
  rutas del bucket.
