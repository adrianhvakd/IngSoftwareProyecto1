# Decisiones técnicas — RE/MAX Potosí

Última actualización: 2026-10-23. Registro breve de decisiones vigentes y su
motivo. Cambiar una decisión implica migración y actualización de docs.

## D1. `supabase-js` en lugar de Prisma

**Decisión:** usar `@supabase/supabase-js` + `@supabase/ssr`, sin ORM.

**Motivo:** Auth, Storage, RLS y Realtime vienen integrados; el cliente respeta
las políticas por usuario. Prisma requeriría una conexión directa y duplicar la
capa de autorización. `postgres` se usa solo en `seed-users.ts` para ejecutar SQL.

**Consecuencia:** los tipos se regeneran con `pnpm db:types`; las consultas
complejas viven en vistas/RPC, no en joins de cliente.

## D2. Migraciones SQL como fuente de verdad

**Decisión:** `supabase/migrations/0001…0007`; `full_setup.sql` es un artefacto
generado con `pnpm db:bundle`.

**Motivo:** reproducibilidad en Supabase, revisión de RLS y despliegue sin CLI.
No se edita una migración aplicada; los cambios van en una nueva.

## D3. RPC atómicas para flujos de negocio

**Decisión:** cierre, pago, visita y promoción pasan por funciones
`security definer`.

**Motivo:** evitan estados parciales (alquiler sin cuotas, pago sin cuota,
doble reserva) y concentran reglas en la base. El cliente no puede saltarse
validaciones con inserts directos.

**Consecuencia:** toda función fija `search_path = ''`, califica objetos y
revoca `EXECUTE` de `public`.

## D4. RLS con helpers `security definer`

**Decisión:** políticas delgadas que llaman helpers (`puede_ver_alquiler`,
`puede_ver_inmueble`, `is_vendedor`, etc.).

**Motivo:** una política que consulta otra tabla con RLS puede recursar o
filtrar de más. El helper se ejecuta como owner y aplica la regla de dominio.

**Consecuencia:** los helpers son parte del contrato de seguridad y requieren
tests al modificarse.

## D5. Vistas con `security_invoker = true`

**Decisión:** todas las vistas respetan RLS del usuario.

**Motivo:** evita que una vista se convierta en puerta trasera. El catálogo
público obtiene nombres con funciones definer que exponen solo el nombre.

## D6. Rol desde `app_metadata`, no `user_metadata`

**Decisión:** `handle_new_user()` acepta rol solo si
`raw_app_meta_data.creado_por_backend = true`.

**Motivo:** `user_metadata` es editable por el usuario; `app_metadata` solo por
service role/Admin API. Un auto-registro nace cliente.

**Consecuencia:** altas internas usan `crearUsuarioVendedor`/`crearUsuarioCliente`;
nunca se confía en un rol enviado desde el navegador.

## D7. Comisión fija con snapshot

**Decisión:** `vendedores.comision_fija` se copia a `comisiones.monto` al cerrar.

**Motivo:** el histórico no debe cambiar si se actualiza la tarifa del vendedor.
No hay comisión porcentual ni split entre agentes en este alcance.

## D8. Mora simple: 5 % después de 5 días

**Decisión:** recargo único del 5 % del monto de la cuota, tras 5 días de
gracia; aviso 5 días antes. Valores en `configuracion`.

**Motivo:** regla simple y explicable para el prototipo; no es interés diario
compuesto ni cobranza escalonada. El job diario es idempotente.

**Consecuencia:** cambiar la política requiere migración de datos/funciones, no
solo editar el porcentaje.

## D9. Estados adicionales `suspendido` y `anulada`

**Decisión:** `estado_alquiler` incluye `suspendido`; `estado_cuota` incluye
`anulada`.

**Motivo:** la UI ya usa “Suspendido” y al finalizar/cancelar hay que conservar
historial sin seguir generando mora.

**Consecuencia:** el índice único de alquiler vigente solo considera `vigente`;
`suspendido` no libera el inmueble. Revisar con negocio si debe bloquear.

## D10. Un solo contrato vigente por inmueble

**Decisión:** índice único parcial `alquileres_un_vigente_por_inmueble`.

**Motivo:** evita doble alquiler. La transacción bloquea el inmueble con
`for update` antes de crear el contrato.

## D11. Storage por alquiler y alta anticipada

**Decisión:** buckets `inmuebles` (público), `contratos` y `comprobantes`
(privados); ruta `{alquiler_id}/archivo`. El vendedor puede subir antes de que
exista la fila del alquiler.

**Motivo:** el wizard genera el UUID en el cliente y necesita adjuntar el
contrato antes del cierre. La lectura se limita a las partes del contrato.

**Consecuencia:** el cliente puede leer comprobantes pero no subirlos con las
políticas actuales; si se requiere, crear migración específica.

## D12. Seed idempotente y usuarios demo

**Decisión:** UUID estables, upserts de catálogo y `on conflict do nothing` en
transaccionales. Tres cuentas demo creadas con Admin API.

**Motivo:** repetir el seed sin duplicar datos y sin inventar cuentas para todos
los mocks. Visitas/alquileres se asignan al vendedor y cliente demo.

**Consecuencia:** el seed transaccional se omite si faltan los usuarios; los
triggers de pago se desactivan dentro de la transacción para conservar el
histórico conciliado.

## D13. Tipos manuales hasta tener CLI

**Decisión:** `src/types/database.types.ts` escrito a mano.

**Motivo:** no hay Supabase CLI/proyecto enlazado en el entorno. El archivo
incluye el aviso de regeneración.

**Consecuencia:** puede desincronizarse; ejecutar `pnpm db:types` al enlazar y
revisar el diff.

## D14. Frontend todavía con mocks

**Decisión:** no conectar pantallas ni borrar `src/data/` en esta etapa.

**Motivo:** entregables 3–7 son base de datos/documentación; conectar sin auth
real ni guards produciría una falsa sensación de seguridad.

**Consecuencia:** el plan de migración es incremental y cada pantalla se conecta
cuando su fase está lista.
