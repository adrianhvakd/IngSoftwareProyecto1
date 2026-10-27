# Plan de migración a Supabase — pantalla por pantalla

Última actualización: 2026-10-23. Objetivo: reemplazar `src/data/` por Supabase
sin cambiar el diseño ni romper el prototipo. El orden es deliberado: primero
identidad y lectura pública, luego escrituras críticas y por último los paneles.

## Fase 0 — Base (ya hecha)

- [x] Migraciones `0001…0007`, seed, RLS, Storage, vistas y cron.
- [x] `getSupabaseBrowser`, `getSupabaseServer`, `getSupabaseAdmin`.
- [x] Tipos manuales y `.env.example`.
- [x] `crearUsuarioVendedor` y `crearUsuarioCliente` en `src/server/usuarios.ts`.
- [ ] Repetir todo en un proyecto Supabase real.

## 1. Autenticación y sesión

| Paso | Ruta / pieza | Datos / API | Server function faltante |
|---|---|---|---|
| 1.1 | `/ingresar` | `auth.signInWithPassword` | `iniciarSesion` (server function o acción de navegador) |
| 1.2 | `/registro` | `auth.signUp`; trigger crea perfil cliente | `registrarCuenta` |
| 1.3 | Logout | `auth.signOut`, limpiar cookies | `cerrarSesion` |
| 1.4 | Sesión global | `auth.getUser()` + `perfiles` | `obtenerSesion` |
| 1.5 | Layouts `/admin`, `/vendedor`, `/cliente` | perfil activo y rol | `requerirRol(rol)` + `beforeLoad` por layout |
| 1.6 | Redirects | `/ingresar` si ya hay sesión; `/` si no | lógica en guardias |

Criterio de salida: rutas protegidas en servidor, sesión visible en topbar,
logout funcional, rol leído de `perfiles` (no de metadata).

## 2. Catálogo público

| Paso | Ruta / componente | Tabla / vista | Server function faltante |
|---|---|---|---|
| 2.1 | `/` destacados y métricas | `v_inmuebles_catalogo`, `v_zonas_con_conteo` | `listarInmueblesDestacados`, `listarZonas` |
| 2.2 | `/propiedades` filtros/orden/paginación | `v_inmuebles_catalogo` | `listarCatalogo(filtros, orden, página)` |
| 2.3 | `/propiedades/$id` | `v_inmuebles_catalogo` + `inmueble_imagenes` | `obtenerInmueble(id)` |
| 2.4 | Navbar/footer | sesión + zonas | reutilizar `obtenerSesion`, `listarZonas` |
| 2.5 | Reemplazar `getInmueble`, `getZonasConConteo` | — | mapear vista → tipo actual |

Mantener skeletons y estados vacíos. `anon` solo verá inmuebles disponibles;
no consultar `perfiles` directamente para nombres.

## 3. Agendar visita

| Paso | Ruta / componente | API | Server function faltante |
|---|---|---|---|
| 3.1 | `VisitScheduler` en detalle | `rpc('agendar_visita', …)` | `agendarVisita(datos)` |
| 3.2 | Validación de fecha/contacto | Zod en cliente + reglas DB | reutilizar schema |
| 3.3 | Éxito/errores | mensajes de `23505`, `23514`, `23503` | mapeo de errores Supabase |
| 3.4 | Cliente autenticado | RPC fuerza `cliente_id = auth.uid()` | no enviar cliente desde el navegador |

Criterio: doble reserva rechazada, visita anónima con contacto obligatorio,
visita visible en panel del vendedor asignado.

## 4. Administración general

### 4.1 Dashboard y alquileres

| Ruta | Lectura | Escritura | Server function faltante |
|---|---|---|---|
| `/admin` | `v_dashboard_admin`, `v_alquileres_detalle`, `visitas` | — | `obtenerDashboardAdmin` |
| `/admin/alquileres` | `v_alquileres_detalle`, `v_cuotas_estado`, `pagos` | `registrar_pago_cuota` | `listarAlquileresAdmin`, `obtenerAlquilerDetalle`, `cobrarCuota` |
| `/admin/alquileres/nuevo` | clientes, vendedores, inmuebles disponibles | `registrar_alquiler` | `cerrarAlquiler` (fase 6) |

### 4.2 Inmuebles y proveedores

| Ruta | Lectura | Escritura | Server function faltante |
|---|---|---|---|
| `/admin/inmuebles` | `v_inmuebles_catalogo` (admin ve todos) | `inmuebles`, `cambiar_estado_inmueble` | `listarInmueblesAdmin`, `cambiarEstadoInmueble`, `marcarDestacado` |
| `/admin/inmuebles/nuevo` | zonas, proveedores, vendedores | `inmuebles`, `inmueble_imagenes`, Storage `inmuebles` | `crearInmueble`, `subirImagenInmueble`, `guardarImagenes` |
| `/admin/inmuebles/$id/editar` | inmueble + imágenes | idem | `obtenerInmuebleAdmin`, `actualizarInmueble` |
| `/admin/proveedores` | `proveedores`, `inmuebles` | `proveedores` | `listarProveedores`, `crearProveedor`, `actualizarProveedor`, `desactivarProveedor` |

Recordar `habitaciones = null` para locales y usar `EntityPicker` para proveedor,
`ZonePicker` para zona y `EntityPicker` para agente.

### 4.3 Usuarios y vendedores

| Ruta | Lectura | Escritura | Server function faltante |
|---|---|---|---|
| `/admin/usuarios` | `perfiles`, `vendedores`, `clientes` | `perfiles` (rol/activo) | `listarUsuarios`, `actualizarRol`, `alternarActivo` |
| `/admin/vendedores` | `vendedores` + `perfiles` | `promover_a_vendedor`, `vendedores` | `listarVendedores`, `promoverVendedor`, `actualizarVendedor`, `desactivarVendedor` |

El cambio de rol debe ir por servidor/admin; el trigger de protección lo impide
desde el propio usuario. Para alta de cuentas reutilizar
`crearUsuarioVendedor`/`crearUsuarioCliente`.

## 5. Visitas (admin y vendedor)

| Ruta | Lectura | Escritura | Server function faltante |
|---|---|---|---|
| `/admin/visitas` | `visitas` + cliente/inmueble/vendedor | `visitas` (asignar/estado) | `listarVisitasAdmin`, `asignarVendedorVisita`, `cambiarEstadoVisita` |
| `/vendedor/visitas` | `visitas` asignadas | `visitas` (estado) | `listarMisVisitas`, `cambiarEstadoVisita` |
| `/vendedor` | visitas + alquileres + comisiones | — | `obtenerResumenVendedor` |

No crear visitas desde admin con `insert` directo: usar `agendar_visita` para
conservar validaciones de solape. Endurecer antes la política de update de
visitas (ver riesgos).

## 6. Cierre de alquiler

| Paso | Ruta / componente | API | Server function faltante |
|---|---|---|---|
| 6.1 | `/vendedor/cierre-alquiler` | zonas, clientes, inmuebles, vendedores | `cargarDatosCierre` |
| 6.2 | Subida de contrato | Storage `contratos/{alquiler_id}/…` | `subirContrato(alquilerId, file)` (o subida directa con RLS) |
| 6.3 | Firma/comprobante | Storage `comprobantes/{alquiler_id}/…` | `subirComprobante` |
| 6.4 | Confirmar cierre | `rpc('registrar_alquiler', …)` | `cerrarAlquiler` |
| 6.5 | `/admin/alquileres/nuevo` | mismo RPC, admin | reutilizar `cerrarAlquiler` |

El UUID se genera en el cliente antes del cierre para que las políticas permitan
subir archivos. Validar monto de cierre > 0, duración 1–120, día 1–28 y que el
inmueble siga disponible. Mapear `RMX-YYYY-0001` a la UI; el mock usa
`ALQ-2026-###`, corregir el texto.

## 7. Pagos y cuotas

| Ruta | Lectura | Escritura | Server function faltante |
|---|---|---|---|
| `/vendedor/registrar-pago` | `v_alquileres_detalle`, `v_cuotas_estado`, `pagos` | `rpc('registrar_pago_cuota')`, Storage `comprobantes` | `listarCuotasPendientes`, `registrarPago`, `subirComprobante` |
| `/admin/alquileres` (sheet) | `v_cuotas_estado`, `pagos` | `registrar_pago_cuota` | `cobrarCuota` |
| `/cliente/mi-alquiler` | `v_alquileres_detalle`, `v_cuotas_estado`, `pagos` | `registrar_pago_cuota` | `obtenerMiAlquiler`, `pagarCuota` |

Reglas: el monto debe cubrir cuota + recargo; no hay pago parcial. Un cliente
puede pagar su cuota, pero **no puede subir comprobante** con las políticas
actuales (solo admin/vendedor). Si se requiere, agregar una migración que
permita INSERT al cliente del alquiler o subir por server function con service
role y validación explícita.

## 8. Cliente

| Ruta | Lectura | Escritura | Server function faltante |
|---|---|---|---|
| `/cliente` | `visitas` propias | cancelar visita | `listarMisVisitas`, `cancelarMiVisita` |
| `/cliente/mi-alquiler` | alquiler/cuotas/pagos propios | pago de cuota | `obtenerMiAlquiler`, `pagarCuota` |
| Perfil | `perfiles`, `clientes` | update limitado | `obtenerMiPerfil`, `actualizarMiPerfil` |

El cliente no debe ver inmuebles inactivos ni datos de otros clientes. Confirmar
con RLS y no con filtros de UI.

## 9. Checklist de cierre

- [ ] Migraciones aplicadas en Supabase real y `full_setup.sql` reproducible.
- [ ] `pnpm db:seed-users` + `supabase/seed.sql` sin errores.
- [ ] `supabase/tests/verificaciones.sql` en verde con `ON_ERROR_STOP=1`.
- [ ] Auth real, cookies SSR y guards por rol en los tres layouts.
- [ ] Catálogo público sin datos privados; detalle y agendador conectados.
- [ ] Admin: dashboard, inmuebles, proveedores, usuarios, vendedores, visitas.
- [ ] Vendedor: visitas, cierre, pagos, comisiones.
- [ ] Cliente: visitas y mi alquiler.
- [ ] Storage: subida/descarga de contrato y comprobante con límites MIME.
- [ ] `src/data/` eliminado o aislado solo para storybook/tests.
- [ ] `pnpm tsc --noEmit`, `pnpm check`, `pnpm build`.
- [ ] `dist/client` sin service role ni secretos.
- [ ] Revisar riesgos de `ARCHITECTURE.md` y `DECISIONS.md`.
