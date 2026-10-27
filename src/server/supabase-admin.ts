/**
 * Cliente de Supabase con SERVICE ROLE.
 *
 * ⚠️ SOLO SERVIDOR. Este archivo nunca debe importarse desde componentes,
 * rutas del navegador ni código isomórfico. La service role salta RLS por
 * completo; filtrarla al bundle del cliente comprometería toda la base.
 *
 * TanStack Start elimina el cuerpo de los `createServerFn` del bundle del
 * cliente, pero la regla se mantiene: importar este módulo únicamente desde
 * `src/server/*.ts`.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let clienteAdmin: SupabaseClient | null = null;

/**
 * `process.env` existe en Workers con `nodejs_compat` y en Node, pero no en el
 * navegador. Se lee de `globalThis` para no depender de los tipos de Node y
 * para fallar de forma explícita si este módulo se importa por error en cliente.
 */
function getServerEnv(): Record<string, string | undefined> {
	const runtime = globalThis as typeof globalThis & {
		process?: { env?: Record<string, string | undefined> };
	};

	if (!runtime.process?.env) {
		throw new Error(
			"supabase-admin.ts solo puede ejecutarse en el servidor (process.env no disponible).",
		);
	}

	return runtime.process.env;
}

/**
 * URL del proyecto Supabase. Se acepta `SUPABASE_URL` (server-only) y, como
 * compatibilidad con el andamiaje de Vite, `VITE_SUPABASE_URL`.
 */
export function getSupabaseUrl(): string {
	const env = getServerEnv();
	const url =
		env.SUPABASE_URL ??
		env.VITE_SUPABASE_URL ??
		import.meta.env.VITE_SUPABASE_URL;

	if (!url) {
		throw new Error(
			"Falta SUPABASE_URL (o VITE_SUPABASE_URL) en el entorno del servidor.",
		);
	}

	return url;
}

/**
 * Cliente singleton con service role. `persistSession` y `autoRefreshToken`
 * están desactivados porque este cliente jamás representa a un usuario final.
 */
export function getSupabaseAdmin(): SupabaseClient {
	if (clienteAdmin) return clienteAdmin;

	const serviceRoleKey = getServerEnv().SUPABASE_SERVICE_ROLE_KEY;

	if (!serviceRoleKey) {
		throw new Error(
			"Falta SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor. " +
				"Configúrala con `wrangler secret put` o en `.dev.vars`; nunca en variables VITE_*.",
		);
	}

	clienteAdmin = createClient(getSupabaseUrl(), serviceRoleKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
			detectSessionInUrl: false,
		},
		global: {
			headers: { "X-Client-Info": "remax-potosi-server" },
		},
	});

	return clienteAdmin;
}
