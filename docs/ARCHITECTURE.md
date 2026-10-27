# Arquitectura — RE/MAX Potosí

Última actualización: 2026-10-23.

## 1. Vista general

```mermaid
flowchart LR
  U[Usuario] -->|HTTPS| CF[Cloudflare Worker<br/>TanStack Start]
  CF --> R[React 19 + Router]
  R -->|hoy| M[Mocks src/data]
  R -.->|pendiente| B[Supabase browser<br/>clave publicable]
  CF -.->|createServerFn<br/>pendiente| S[Supabase server<br/>cookies + RLS]
  S --> DB[(PostgreSQL)]
  B --> DB
  CF -->|solo alta de usuarios| A[Supabase Admin API<br/>service role]
  DB --> ST[Storage<br/>inmuebles · contratos · comprobantes]
  DB --> CRON[pg_cron<br/>actualizar_estado_cuotas]
```

Estado real: la ruta continua **Mocks** está activa. Los clientes Supabase y el
esquema existen, pero ninguna pantalla consume la base todavía.

## 2. Capas

### Frontend

- TanStack Start + Router file-based; `src/routes/` contiene 22 pantallas.
- Componentes de dominio en `src/components/`, UI shadcn vendorizada en
  `src/components/ui/`.
- Estado local y validaciones de formulario; los envíos muestran `toast` y
  simulan latencia. No hay caché de servidor ni loaders conectados.
- Tema claro/oscuro/sistema con `ThemeProvider` y tokens CSS.
- Datos actuales: `src/data/` (mocks + selectores). No borrar ni reemplazar
  mientras una pantalla no tenga su equivalente Supabase.

### Servidor (TanStack Start en Workers)

- `src/lib/supabase/server.ts`: cliente por petición con cookies y header
  `Authorization`. Usa clave publicable, por lo que **RLS sigue aplicando**.
- `src/server/supabase-admin.ts`: singleton con service role, solo servidor.
  Salta RLS; se reserva para la Admin API de Auth y tareas administrativas.
- `src/server/usuarios.ts`: únicos `createServerFn` existentes
  (`crearUsuarioVendedor`, `crearUsuarioCliente`). Validan el rol del solicitante
  antes de usar service role. Aún no están llamados desde la UI.
- El worker se despliega con Wrangler; `nodejs_compat` habilita `process.env`
  para secretos.

### Base de datos

- PostgreSQL de Supabase con 16 tablas, 12 enums, RLS, triggers, RPC y vistas.
- Migraciones numeradas como fuente de verdad; `full_setup.sql` es el bundle
  para pegar en el editor SQL.
- Storage con tres buckets; políticas sobre `storage.objects`.
- `pg_cron` ejecuta la actualización diaria de cuotas.

## 3. Flujos

### Autenticación (diseñado, no conectado)

```mermaid
sequenceDiagram
  participant N as Navegador
  participant W as Worker
  participant A as Supabase Auth
  participant P as PostgreSQL
  N->>A: signInWithPassword / signUp
  A-->>N: access + refresh token (cookies SSR)
  N->>W: petición con cookies
  W->>A: getUser() con cookies/Authorization
  A-->>W: JWT + user
  W->>P: query bajo RLS (auth.uid())
  P-->>W: filas permitidas
```

- El cliente de navegador (`createBrowserClient`) escribe cookies de sesión.
- El cliente de servidor (`createServerClient`) las lee y las refresca.
- El rol **no** viaja como claim de confianza para autorizar: RLS lee
  `public.perfiles.rol` con `security definer`.
- Alta de usuarios internos: `crearUsuarioVendedor`/`crearUsuarioCliente` usan
  Admin API con `app_metadata.creado_por_backend = true`. Un auto-registro
  siempre nace `cliente`.

### Lectura de datos (pendiente)

1. La ruta pide datos a un `createServerFn` (recomendado) o al cliente de
   navegador.
2. La consulta usa vistas (`v_*`) o tablas; RLS filtra por rol y pertenencia.
3. La vista devuelve campos ya resueltos (zona, nombres, próxima cuota) para
   evitar consultas N+1.
4. El componente recibe el mismo shape que hoy consumen los mocks, o se adapta
   en una capa de mapeo.

### Escrituras de negocio (RPC)

| Flujo | RPC | Efecto atómico |
|---|---|---|
| Agendar visita | `agendar_visita` | Valida disponibilidad/solape, resuelve cliente y crea visita. |
| Cerrar alquiler | `registrar_alquiler` | Alquiler + cuotas + pago de cierre + comisión + inmueble `en_alquiler`. |
| Cobrar cuota | `registrar_pago_cuota` | Pago + validación de monto + cuota pagada + aviso. |
| Promover vendedor | `promover_a_vendedor` | Rol + fila de vendedor + comisión. |
| Cambiar inmueble | `cambiar_estado_inmueble` | Bloquea `disponible/inactivo` si hay contrato vigente. |
| Job diario | `actualizar_estado_cuotas` | Mora, recargo y avisos deduplicados. |

No replicar estas reglas en TypeScript. La UI solo valida para dar feedback.

### Archivos

1. El wizard genera el UUID del alquiler en el cliente.
2. Sube contrato/comprobante a `contratos` o `comprobantes` con ruta
   `{alquiler_id}/archivo`; la política permite al vendedor crear aunque el
   alquiler aún no exista.
3. Llama a `registrar_alquiler` con `contrato_path` y `comprobante_path`.
4. Lectura posterior: admin, vendedor o cliente del alquiler.
5. Fotos de inmuebles: bucket público `inmuebles`; `inmueble_imagenes.path`
   guarda la ruta y `url` se usa para los mocks.

## 4. Seguridad

- **RLS en todas las tablas**. Los `GRANT` habilitan operaciones; las políticas
  deciden filas. `anon` tiene SELECT nominal para las vistas del catálogo, pero
  sin políticas solo ve inmuebles disponibles y zonas activas.
- **Helpers `security definer`** (`puede_ver_alquiler`, `puede_ver_inmueble`,
  `es_agente_de_inmueble`, `current_rol`, nombres públicos) evitan recursión de
  políticas y consultas cruzadas no autorizadas. Todos fijan `search_path = ''`
  y califican objetos.
- **Rol protegido**: trigger `proteger_rol` impide que un usuario no admin
  modifique `perfiles.rol`; `proteger_campos_perfil` bloquea estado, correo y
  bandera de contraseña temporal.
- **Service role**: solo en `src/server/*`; nunca en `VITE_*`. Los cuerpos de
  `createServerFn` no llegan al bundle cliente, pero la disciplina de imports se
  mantiene.
- **Storage**: contratos/comprobantes privados; la primera carpeta debe ser un
  UUID de alquiler. Edición/borrado solo admin o vendedor asignado.
- **Auditoría**: cambios de inmuebles, alquileres, pagos, rol y comisión fija.
- **JWT**: no se confía en metadatos del usuario para el rol; se consulta el
  perfil activo en base de datos.

### Riesgos conocidos

- La política de `UPDATE` de visitas permite al cliente modificar su propia
  visita (incluido estado/vendedor) mientras no cambie `cliente_id`. Endurecer
  con triggers o RPC antes de producción.
- `pagos.validado = false` de un cliente no bloquea el marcado de la cuota como
  pagada; no hay aprobación posterior.
- Las migraciones y pruebas se validaron con PGlite, no con un Supabase real.
  `pg_cron` no se ejecutó localmente.
- El frontend no tiene guards de ruta ni sesión real; no asumir protección de
  pantallas hasta implementar auth.

## 5. Despliegue

- Build: `vite build` genera `dist/client` y `dist/server`.
- Runtime: Cloudflare Workers (`wrangler.jsonc`, `nodejs_compat`).
- Variables: ver [DEPLOYMENT.md](DEPLOYMENT.md). Las `VITE_*` se hornean en
  build; los secretos de servidor se cargan en Wrangler.
- `scripts/seed-users.ts`, `SUPABASE_DB_URL` y los tests SQL no se despliegan.
