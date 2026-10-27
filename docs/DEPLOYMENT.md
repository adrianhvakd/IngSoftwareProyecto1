# Despliegue — Cloudflare Workers + Supabase

Última actualización: 2026-10-23.

## 1. Arquitectura de despliegue

- Frontend/SSR: **Cloudflare Workers** con `@cloudflare/vite-plugin` y Wrangler.
- Datos, Auth y Storage: **Supabase**.
- El worker sirve `dist/server`; los assets salen de `dist/client`.
- `wrangler.jsonc` define `name`, `compatibility_date`, `nodejs_compat` y el
  entrypoint; no contiene variables ni secretos.

```bash
pnpm build       # genera dist/client y dist/server
pnpm preview     # prueba en workerd
pnpm deploy      # build + wrangler deploy
```

## 2. Variables y secretos

| Variable | Ámbito | Tipo | Dónde se configura | Notas |
|---|---|---|---|---|
| `VITE_SUPABASE_URL` | Build + navegador | Pública | `.env` local / entorno de build de CI | Se hornea en el bundle. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Build + navegador | Pública | `.env` / CI | Clave publicable/anon; nunca service role. |
| `SUPABASE_URL` | Runtime servidor | Variable | Dashboard Worker o `wrangler.jsonc` | Fallback a `VITE_SUPABASE_URL`. |
| `SUPABASE_PUBLISHABLE_KEY` | Runtime servidor | Variable | Dashboard Worker o `wrangler.jsonc` | Fallback a `VITE_*`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Runtime servidor | **Secreta** | `wrangler secret put` / dashboard | Solo Admin API y scripts server-side. |
| `SUPABASE_DB_URL` | Local/CI | **Secreta** | `.env` local | Solo `db:seed-users`; no desplegar. |
| `SEED_DEMO_PASSWORD` | Local | Secreta | `.env` local | Solo seed demo. |

Reglas:

- Todo lo `VITE_*` es público. La service role **nunca** lleva prefijo `VITE_`.
- Los secretos de Workers no se versionan. `.dev.vars`, `.env` y `.env.*` están
  ignorados salvo `.env.example`.
- Cambiar una `VITE_*` exige **rebuild**; cambiarla en el dashboard después del
  build no afecta al bundle ya publicado.

## 3. Configuración local

```bash
cp .env.example .env
# Completar:
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_PUBLISHABLE_KEY=...
# SUPABASE_SERVICE_ROLE_KEY=...   (solo si usas scripts/server functions)
# SUPABASE_DB_URL=...             (opcional, para seed automático)
pnpm install
pnpm dev
```

Para `pnpm preview` (workerd) crear `.dev.vars`:

```ini
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

`.dev.vars` nunca se commitea.

## 4. Preparar Supabase

1. Crear proyecto y anotar `Project URL`, publishable/anon key y service role.
2. Aplicar migraciones:
   - CLI: `supabase link --project-ref <ref>` y `supabase db push`; o
   - editor SQL: `pnpm db:bundle` y pegar todo `supabase/full_setup.sql`.
3. Verificar 16 tablas, 6 vistas, 3 buckets y el job `remax-actualizar-cuotas`.
4. Crear usuarios demo (solo desarrollo):
   ```bash
   pnpm db:seed-users
   ```
5. Ejecutar `supabase/seed.sql` si no se definió `SUPABASE_DB_URL`.
6. En Auth → URL Configuration, agregar el dominio de Workers y
   `http://localhost:3000` como redirect permitido si se usa recuperación/OAuth.
7. Confirmar que RLS está activo; no desactivar para “probar”.

## 5. Configurar el Worker

### Variables no secretas

Dashboard → Workers & Pages → proyecto → Settings → Variables, o
`wrangler.jsonc`:

```jsonc
{
  "vars": {
    "SUPABASE_URL": "https://<ref>.supabase.co",
    "SUPABASE_PUBLISHABLE_KEY": "<publishable-key>"
  }
}
```

### Secretos

```bash
pnpm exec wrangler login
pnpm exec wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# pegar la service role cuando lo pida
```

Repetir por entorno (producción/staging) con el proyecto de Wrangler correcto.

### Build de producción

Las `VITE_*` deben existir **antes** del build:

```bash
export VITE_SUPABASE_URL="https://<ref>.supabase.co"
export VITE_SUPABASE_PUBLISHABLE_KEY="<publishable-key>"
pnpm build
pnpm deploy
```

En CI, definirlas como variables de entorno del job de build, no como secretos
de runtime del Worker.

## 6. Verificación post-deploy

- [ ] `/`, `/propiedades`, `/propiedades/$id` responden 200.
- [ ] `/robots.txt` y meta `noindex` presentes (prototipo).
- [ ] Login real (cuando esté conectado) y sesión persistente.
- [ ] Un cliente no puede abrir `/admin` ni leer datos ajenos vía API.
- [ ] Subida de contrato/comprobante respeta 15/10 MB y MIME.
- [ ] Descarga privada solo para admin/vendedor/cliente del alquiler.
- [ ] `dist/client` no contiene `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Errores 401/403 de Supabase se muestran sin filtrar detalles internos.
- [ ] El job de cuotas corre a las 00:05 America/La_Paz.

## 7. Rollback y operación

- Worker: `wrangler deployments list` y `wrangler rollback [id]`.
- Base de datos: las migraciones no se revierten automáticamente. Si un cambio
  falla, crear una migración correctiva `0008_...sql`; no editar la aplicada.
- Seed: solo desarrollo. Nunca ejecutar `seed-users.ts` contra producción (el
  script se niega, pero la disciplina importa).
- Backups: activar PITR/backups del proyecto Supabase antes de migrar datos
  reales.
- Secretos: rotar service role si se filtró; actualizar Wrangler y redeploy.

## 8. Problemas comunes

| Síntoma | Causa probable |
|---|---|
| `Faltan VITE_SUPABASE_*` en build | Variables ausentes en el job de build. |
| `Faltan SUPABASE_*` en runtime | Variables no configuradas en el Worker y fallback no baked. |
| `new row violates row-level security` | Usuario sin perfil activo, rol inesperado o política mal aplicada. |
| `permission denied for function` | Falta `GRANT EXECUTE` o se llama una RPC `service_role` desde navegador. |
| `pg_cron` no disponible | Plan/extensión no habilitada; usar scheduler externo con service role. |
| Error de CORS/Auth | Redirect URLs o Site URL mal configuradas en Supabase Auth. |

Referencias: [DATABASE.md](DATABASE.md), [ARCHITECTURE.md](ARCHITECTURE.md),
[AGENTS.md](../AGENTS.md).
