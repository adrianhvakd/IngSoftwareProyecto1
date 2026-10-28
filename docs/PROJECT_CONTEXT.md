# Contexto del proyecto — RE/MAX Potosí

Última actualización: 2026-10-28.

## 1. Dominio

Plataforma de gestión y alquiler de inmuebles en Potosí, Bolivia. RE/MAX
publica una cartera de casas, departamentos y locales; los clientes agendan
visitas y, al cerrar un contrato, pagan cuotas mensuales. La oficina administra
usuarios, vendedores, propietarios, inmuebles, cobros y comisiones.

Alcance del prototipo: catálogo público + paneles de administrador, vendedor y
cliente. El frontend y Supabase (Auth, RLS, Storage, RPC y vistas) están
conectados; no quedan mocks ni acciones simuladas.

## 2. Roles y permisos

| Rol | Puede |
|---|---|
| Público (`anon`) | Ver zonas activas e inmuebles disponibles; agendar una visita con nombre, teléfono y correo. |
| Cliente | Ver/editar su perfil y datos de contacto; ver sus visitas, alquileres, cuotas, pagos y notificaciones; leer el inmueble que alquila; registrar el pago de sus cuotas; marcar avisos como leídos. |
| Vendedor | Ver su perfil y agenda; leer clientes y la cartera de inmuebles que atiende; ver sus alquileres, cuotas, pagos y comisiones; agendar visitas; cerrar alquileres propios; registrar pagos; subir contrato/comprobante. |
| Administrador | Acceso total a catálogo, usuarios, vendedores, proveedores, visitas, alquileres, cuotas, pagos, comisiones, configuración y auditoría. Puede cambiar roles, promover vendedores y cambiar estados de inmuebles. |

Reglas de visibilidad finas: el cliente solo accede a sus propios registros; el
vendedor solo a los asignados o de su cartera; el administrador a todo. La
matriz exacta está en [DATABASE.md](DATABASE.md#matriz-rls).

## 3. Historias de usuario

Las etiquetas HU-01…HU-09 se usan como referencia funcional. HU-03 y HU-07 se
describen por el módulo que cubren.

| HU | Resumen |
|---|---|
| HU-01 | **Administrar usuarios y roles.** Alta, búsqueda, activación/desactivación y cambio de rol; el rol solo lo cambia un administrador. |
| HU-02 | **Administrar vendedores.** Promover un perfil a vendedor, fijar comisión fija, cargo y zona; dar de baja sin borrar historial. |
| HU-03 | **Administrar proveedores/propietarios.** Alta y edición de personas o empresas, zona principal, contacto y relación con inmuebles. |
| HU-04 | **Registrar clientes.** Alta de cuenta, datos de contacto y creación automática de la fila de cliente. |
| HU-05 | **Consultar clientes.** Búsqueda y lectura de clientes por parte de administrador y vendedor para agendar o cerrar. |
| HU-06 | **Gestionar visitas.** Agendar desde el catálogo o el panel, asignar vendedor, confirmar, cancelar y consultar agenda. |
| HU-07 | **Gestionar inmuebles.** Publicar/editar casa, departamento o local, fotos, precio, disponibilidad, propietario y agente; destacar o desactivar. |
| HU-08 | **Cerrar y gestionar alquileres.** Acuerdo, contrato, depósito, cronograma de cuotas, comisión y finalización/suspensión. |
| HU-09 | **Registrar pagos y cuotas.** Cobro de cierre y de cuotas, comprobante, validación, recargo por mora e historial. |

## 4. Reglas de negocio

### Contrato y comisión

- Formato de contrato: `RMX-YYYY-0001`, contador atómico por año.
- Un inmueble solo puede tener **un alquiler vigente** a la vez. `suspendido`
  conserva el contrato pero no bloquea un cierre nuevo; `finalizado` y
  `cancelado` liberan el inmueble y anulan cuotas impagas.
- La comisión es **fija por vendedor** (`vendedores.comision_fija`) y se copia
  como snapshot al crear la comisión. Cambiar la tarifa después no altera
  comisiones históricas.
- El costo de publicación (`inmuebles.costo_publicacion`) es un dato operativo
  del inmueble; no se cobra automáticamente en el cierre.
- El pago de cierre es obligatorio. Si cubre la primera cuota, se enlaza y esta
  queda pagada; si no, la primera cuota sigue pendiente.

### Cuotas y mora

- El cierre genera `duracion_meses` cuotas mensuales; el día de cobro se acota
  a 1–28.
- La primera cuota vence el día de cobro del mes de inicio; si esa fecha ya
  pasó, vence al mes siguiente.
- Estados persistidos: `pendiente`, `pagada`, `en_mora`, `anulada`.
  “Por vencer” y “Al día” son estados **derivados** en `v_cuotas_estado`.
- Supuestos iniciales en `configuracion`: recargo de mora **5 %** (único, no
  diario), **5 días de gracia** y aviso **5 días antes**.
- El recargo se aplica recién cuando hoy supera vencimiento + gracia. El job
  diario marca mora y crea avisos sin duplicarlos.
- Un pago debe cubrir `monto + recargo`; el excedente no se abona a otra cuota.
- Un pago de cliente queda `validado = false`, pero la cuota se marca pagada;
  no hay flujo de aprobación posterior en este alcance.

### Visitas y disponibilidad

- El público solo agenda sobre inmuebles `disponible`.
- Se rechazan fechas pasadas y solapes de ±1 hora para el mismo inmueble; hay
  índice único para la misma fecha/hora pendiente.
- Una visita anónima exige nombre, teléfono y correo. Un cliente autenticado
  agenda para sí mismo; admin/vendedor pueden elegir cliente.
- El vendedor asignado se valida contra `vendedores` activos con rol vendedor.

### Datos y presentación

- Zona y sector están normalizados; el slug es estable para URLs y filtros.
- Los locales no tienen habitaciones (`habitaciones = null`).
- Español es-BO, moneda Bs, teléfonos +591, fechas de negocio en
  `America/La_Paz`.
- Fotos de catálogo usan una URL pública o `path` del bucket `inmuebles`.
  Contratos y comprobantes son privados.

## 5. Supuestos

1. `src/data/` fue eliminado; el seed es solo demo y no representa datos de producción.
2. Los usuarios de Auth se crean con la Admin API; un auto-registro nace como
   cliente y no puede elegir rol.
3. La mora es un porcentaje único tras la gracia, no interés compuesto.
4. La comisión fija es el único esquema de remuneración del vendedor.
5. No hay pagos parciales ni saldo a favor.
6. `suspendido` no libera el inmueble y no impide un nuevo contrato; decisión a
   revisar con negocio.
7. El wizard usa un UUID de alquiler generado en el cliente para poder subir
   archivos antes de crear el contrato.
8. La recuperación de contraseña se atiende por correo a la oficina; no hay
   correos transaccionales automáticos ni pasarela de pago real.
