# Plan de migración a Supabase — pantalla por pantalla

Última actualización: 2026-10-28. Objetivo cumplido: `src/data/` fue reemplazado
por Supabase sin cambiar el diseño. El orden fue identidad y lectura pública,
luego escrituras críticas y por último los paneles.

## Fase 0 — Base (ya hecha)

- [x] Migraciones `0001…0010`, seed, RLS, Storage, vistas y cron.
- [x] `getSupabaseBrowser`, `getSupabaseServer`, `getSupabaseAdmin`.
- [x] Tipos manuales y `.env.example`.
- [x] `crearUsuarioVendedor` y `crearUsuarioCliente` en `src/server/usuarios.ts`.
- [ ] Repetir todo en un proyecto Supabase real.

## 1. Autenticación y sesión

**Estado: completado (2026-10-28).** Login, registro cliente, logout, sesión en
cookies, guards por rol, redirección por rol y cambio obligatorio de contraseña
están conectados. La bandera `debe_cambiar_password` se limpia con la RPC
`marcar_password_actualizada` de `0008_cambio_password_inicial.sql`.

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

**Estado: completado (2026-10-28).** Inicio, catálogo y detalle leen
`v_inmuebles_catalogo` y `v_zonas_con_conteo` mediante server functions con la
clave publicable y RLS. El catálogo filtra siempre `estado = 'disponible'`,
ordena y pagina en el servidor. La vista pública solo expone
`agente_nombre`, no teléfono ni correo del agente; el detalle muestra el nombre
y comparte el contacto al registrar la visita.

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

**Estado: completado (2026-10-28).** `VisitScheduler` llama a
`agendarVisita`, que ejecuta la RPC `agendar_visita` con la sesión del
visitante. El formulario prefija nombre, teléfono y correo si hay sesión,
arma la fecha con offset `-04:00` y muestra los errores mapeados de
`23505`, `23514`, `23503`, `23502`, `22007` y `42501`. Probado contra el
proyecto real: alta correcta, rechazo de franja ocupada y limpieza del registro
de prueba.

| Paso | Ruta / componente | API | Server function faltante |
|---|---|---|---|
| 3.1 | `VisitScheduler` en detalle | `rpc('agendar_visita', …)` | `agendarVisita(datos)` |
| 3.2 | Validación de fecha/contacto | Zod en cliente + reglas DB | reutilizar schema |
| 3.3 | Éxito/errores | mensajes de `23505`, `23514`, `23503` | mapeo de errores Supabase |
| 3.4 | Cliente autenticado | RPC fuerza `cliente_id = auth.uid()` | no enviar cliente desde el navegador |

Criterio: doble reserva rechazada, visita anónima con contacto obligatorio,
visita visible en panel del vendedor asignado.

## 4. Administración general

**Estado: dashboard, inmuebles, proveedores, usuarios, vendedores, visitas y
alquileres/cobros completados (2026-10-28).** Toda la lectura y escritura usa
server functions de `src/server/admin/` y `src/server/alquileres/` con el
cliente de cookies y RLS; la service role solo se usa para la Admin API de Auth
(alta de usuarios y cambio de correo). `/admin/alquileres` ya registra pagos en
efectivo y enlaza contrato/comprobantes con URLs firmadas.

### 4.1 Dashboard y alquileres

| Ruta | Lectura | Escritura | Server function |
|---|---|---|---|
| `/admin` | `v_dashboard_admin`, `v_cuotas_estado`, `visitas`, `pagos`, `comisiones` | — | `obtenerDashboardAdmin` ✅ |
| `/admin/alquileres` | `v_alquileres_detalle`, `v_cuotas_estado`, `pagos` | `registrar_pago_cuota` | `listarAlquileresAdmin` ✅, `registrarPagoCuota` ✅ |
| `/admin/alquileres/nuevo` | clientes, vendedores, inmuebles disponibles | `registrar_alquiler` | `obtenerOpcionesCierre` ✅, `registrarAlquiler` ✅ (fase 6) |

### 4.2 Inmuebles y proveedores

| Ruta | Lectura | Escritura | Server function faltante |
|---|---|---|---|
| `/admin/inmuebles` | `v_inmuebles_catalogo` (admin ve todos) | `inmuebles`, `cambiar_estado_inmueble` | `listarInmueblesAdmin` ✅, `cambiarEstadoInmueble` ✅, `cambiarDestacadoInmueble` ✅ |
| `/admin/inmuebles/nuevo` | zonas, proveedores | `inmuebles`, `inmueble_imagenes`, Storage `inmuebles` | `opcionesInmuebleAdmin` ✅, `guardarInmueble` ✅, `subirImagenesInmueble` ✅ |
| `/admin/inmuebles/$id/editar` | inmueble + imágenes | idem | `obtenerInmuebleAdmin` ✅, `guardarInmueble` ✅ |
| `/admin/proveedores` | `proveedores`, `v_inmuebles_catalogo` | `proveedores` | `listarProveedoresAdmin` ✅, `crearProveedor` ✅, `actualizarProveedor` ✅, `eliminarProveedor` ✅ |

Recordar `habitaciones = null` para locales y usar `EntityPicker` para proveedor,
`ZonePicker` para zona y `EntityPicker` para agente.

### 4.3 Usuarios y vendedores

| Ruta | Lectura | Escritura | Server function faltante |
|---|---|---|---|
| `/admin/usuarios` | `perfiles`, `vendedores` | `perfiles` (rol/activo), `promover_a_vendedor` | `listarUsuariosAdmin` ✅, `cambiarRolUsuario` ✅, `cambiarEstadoUsuario` ✅ |
| `/admin/vendedores` | `vendedores` + `perfiles` | `promover_a_vendedor`, `vendedores`, Admin API Auth | `listarVendedoresAdmin` ✅, `promoverVendedor` ✅, `actualizarVendedor` ✅, `darBajaVendedor` ✅ |

El cambio de rol debe ir por servidor/admin; el trigger de protección lo impide
desde el propio usuario. Para alta de cuentas reutilizar
`crearUsuarioVendedor`/`crearUsuarioCliente`.

## 5. Visitas (admin y vendedor)

| Ruta | Lectura | Escritura | Server function faltante |
|---|---|---|---|
| `/admin/visitas` | `visitas` + cliente/inmueble/vendedor | `visitas` (asignar/estado) | `listarVisitasAdmin` ✅, `asignarVendedorVisita` ✅, `cambiarEstadoVisita` ✅ |
| `/vendedor/visitas` | `visitas` asignadas | estado de visita | `listarVisitasVendedor` ✅, `cambiarEstadoVisitaActor` ✅ |
| `/vendedor` | visitas + alquileres + comisiones + cobros | — | `listarPanelVendedor` ✅ |

No crear visitas desde admin con `insert` directo: usar `agendar_visita` para
conservar validaciones de solape. El trigger `proteger_campos_visita` (0009)
bloquea cambios de fecha, inmueble, cliente o vendedor desde la sesión.

## 6. Cierre de alquiler

**Estado: completado (2026-10-28).** El wizard de vendedor y admin usa
`obtenerOpcionesCierre`, permite cliente nuevo o existente, genera el UUID en el
navegador, sube contrato y comprobante a buckets privados al confirmar y llama a
`registrarAlquiler` (RPC `registrar_alquiler`). La comisión es de solo lectura y
la calcula el servidor con `comision_fija` del vendedor.

| Paso | Ruta / componente | API | Server function |
|---|---|---|---|
| 6.1 | `/vendedor/cierre-alquiler` | zonas, clientes, inmuebles, vendedores | `obtenerOpcionesCierre` ✅ |
| 6.2 | Subida de contrato | Storage `contratos/{alquiler_id}/…` | `subirContratoAlquiler` ✅ |
| 6.3 | Firma/comprobante | Storage `comprobantes/{alquiler_id}/…` | `subirComprobanteAlquiler` ✅ |
| 6.4 | Confirmar cierre | `rpc('registrar_alquiler', …)` | `registrarAlquiler` ✅ |
| 6.5 | `/admin/alquileres/nuevo` | mismo RPC, admin | reutiliza el wizard ✅ |

El UUID se genera en el cliente antes del cierre para que las políticas permitan
subir archivos. Validar monto de cierre > 0, duración 1–120, día 1–28 y que el
inmueble siga disponible. Si el RPC falla, se eliminan los archivos subidos.

## 7. Pagos y cuotas

**Estado: completado (2026-10-28).** Vendedor y admin cobran cuotas con
`registrarPagoCuota` y comprobante privado opcional; el cliente reporta su pago
por QR con `reportarPagoCliente`, sin subir comprobante en esta fase.

| Ruta | Lectura | Escritura | Server function |
|---|---|---|---|
| `/vendedor/registrar-pago` | `v_alquileres_detalle`, `v_cuotas_estado`, `pagos` | `registrar_pago_cuota` + Storage `comprobantes` | `listarAlquileresVendedor` ✅, `registrarPagoCuota` ✅ |
| `/admin/alquileres` (sheet) | `v_alquileres_detalle`, `v_cuotas_estado`, `pagos` | `registrar_pago_cuota` | `listarAlquileresAdmin` ✅, `registrarPagoCuota` ✅ |
| `/cliente/mi-alquiler` | `v_alquileres_detalle`, `v_cuotas_estado`, `pagos` | `registrar_pago_cuota` | `listarAlquileresCliente` ✅, `reportarPagoCliente` ✅ |

Reglas: el monto debe cubrir cuota + recargo; no hay pago parcial. Los pagos del
cliente quedan `validado = false` pero la cuota se marca pagada. Contrato y
comprobante se abren con URLs firmadas. Si se requiere que el cliente suba
comprobante, agregar una migración que permita INSERT al cliente del alquiler o
subir por server function con service role y validación explícita.

## 8. Cliente

**Estado: completado (2026-10-28).**

| Ruta | Lectura | Escritura | Server function |
|---|---|---|---|
| `/cliente` | `visitas` propias | cancelar visita pendiente | `listarVisitasCliente` ✅, `cambiarEstadoVisitaActor` ✅ |
| `/cliente/mi-alquiler` | alquiler/cuotas/pagos propios | pago de cuota | `listarAlquileresCliente` ✅, `reportarPagoCliente` ✅ |

El cliente no debe ver inmuebles inactivos ni datos de otros clientes. Confirmar
con RLS y no con filtros de UI.

## 9. Checklist de cierre

- [ ] Migraciones aplicadas en Supabase real y `full_setup.sql` reproducible.
- [ ] `pnpm db:seed-users` + `supabase/seed.sql` sin errores.
- [ ] `supabase/tests/verificaciones.sql` en verde con `ON_ERROR_STOP=1`.
- [x] Auth real, cookies SSR y guards por rol en los tres layouts.
- [x] Catálogo público sin datos privados; detalle y agendador conectados.
- [x] Admin: dashboard, inmuebles, proveedores, usuarios, vendedores, visitas y
      alquileres/cobros.
- [x] Vendedor: resumen, visitas, cierre, pagos y comisiones conectados.
- [x] Cliente: inicio de visitas y `mi-alquiler` conectados.
- [ ] Storage: subida/descarga de contrato y comprobante con límites MIME
      probada de punta a punta con archivos reales.
- [x] `src/data/` eliminado; tipos en `src/types/models.ts`.
- [x] `pnpm tsc --noEmit`, `pnpm check`, `pnpm build`.
- [x] `dist/client` sin service role ni secretos.
- [x] Riesgos de `ARCHITECTURE.md` y `DECISIONS.md` revisados; visitas y Storage
      corregidos en 0009/0010.

## 10. Fase 5 — cierre de mocks y seguridad (2026-10-28)

**Estado: completado.** Se eliminó `src/data/`, se conectaron `/vendedor`,
`/vendedor/visitas` y `/cliente`, y la landing pasó a leer agentes y métricas
reales con `listar_agentes_publicos()` y `resumen_publico()`.

- Se agregó `proteger_campos_visita` (0009) para que cliente/vendedor solo
  cambien el estado permitido de una visita.
- Se limitó la escritura del bucket `inmuebles` al admin o al agente del
  inmueble (0010).
- Se incorporó `fechaDiaLaPaz` para agrupar agenda sin desfase SSR/cliente.
- Se sustituyeron acciones simuladas: el alta de usuario enlaza a vendedores y
  la recuperación de contraseña abre un correo real a la oficina.
