# Pruebas SQL — RE/MAX Potosí

Estas pruebas validan las reglas críticas de las migraciones `0001–0006` sobre
una base **con el seed demo**. No usan Docker ni el CLI de Supabase.

| # | Verificación | Qué comprueba |
|---|---|---|
| 1 | Cierre de alquiler | `registrar_alquiler` crea contrato, 12 cuotas, pago de cierre, comisión y marca el inmueble `en_alquiler`. |
| 2 | Pago de cuota | `registrar_pago_cuota` valida el monto, marca la cuota `pagada` y deja el pago validado. |
| 3 | Mora | El job aplica 5 % tras 5 días de gracia, no cobra dentro de la gracia y no duplica avisos. |
| 4 | Doble reserva de visita | `agendar_visita` rechaza otra visita en la misma franja de ±1 hora. |
| 5 | Protección de rol | Un cliente no puede cambiarse el rol a vendedor. |

## Requisitos

1. Migraciones `0001–0006` aplicadas. `0007` es opcional: solo programa el cron.
2. Las tres cuentas demo creadas con `pnpm db:seed-users`.
3. `supabase/seed.sql` ejecutado después de crear las cuentas.

Las cuentas esperadas son:

- `rodrigo.alvarez@remaxpotosi.bo` (administrador)
- `carla.mendoza@remaxpotosi.bo` (vendedor)
- `luis.catari@gmail.com` (cliente)

## Ejecución con psql

Usar la cadena de conexión directa de Supabase (Project Settings → Database) en
`SUPABASE_DB_URL`. No commitear esa URL.

```bash
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 \
  -f supabase/tests/verificaciones.sql
```

Salida esperada (los `NOTICE` aparecen en stderr):

```text
NOTICE:  OK 1/5 · cierre de alquiler
NOTICE:  OK 2/5 · pago de cuota
NOTICE:  OK 3/5 · mora y avisos
NOTICE:  OK 4/5 · doble reserva de visita
NOTICE:  OK 5/5 · protección de rol
ROLLBACK
```

El archivo abre una transacción y termina con `ROLLBACK`. Si una aserción falla,
`ON_ERROR_STOP=1` corta la ejecución y la conexión descarta los cambios. No se
modifica el seed.

## Ejecución desde el editor SQL

También se puede pegar el archivo completo en el SQL Editor de Supabase y
ejecutarlo de una vez. El editor debe respetar `BEGIN`/`ROLLBACK`; si ejecuta
sentencias por separado, usar `psql`. No se requieren comandos metacomando de
`psql`.

## Qué hacer si falla

| Error | Causa probable |
|---|---|
| `Faltan las cuentas demo` | No se ejecutó `pnpm db:seed-users`. |
| `Falta el alquiler demo RMX-2026-0001` | No se ejecutó `supabase/seed.sql` o falló a medias. |
| `Función ... no existe` | Migraciones incompletas o `search_path` inesperado. |
| `permission denied` en una RPC | Se está ejecutando con un rol sin `EXECUTE`; usar la conexión directa de owner/service. |
| `pg_cron` no existe | No se aplicó `0007`; no afecta a estas pruebas. |

## Limitaciones

- No sustituyen una prueba con JWT reales: simulan identidad con
  `request.jwt.claim.sub` y `request.jwt.claims`.
- No prueban políticas de Storage con archivos reales; eso requiere un proyecto
  Supabase y el cliente autenticado.
- `0007_cron.sql` no se ejecutó en PGlite porque esa extensión no está incluida.
  En un Supabase real, verificar `cron.job` después de aplicarlo.

Para el estado general de la migración, ver [PROGRESS.md](../../docs/PROGRESS.md).
