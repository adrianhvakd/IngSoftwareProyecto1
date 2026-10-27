/**
 * Cliente de Supabase para el SERVIDOR con la sesión del usuario actual.
 *
 * Lee las cookies que escribe `src/lib/supabase/client.ts` y las vuelve a
 * escribir cuando Supabase refresca el token. No usa la service role: las
 * consultas quedan sujetas a RLS. Para operaciones administrativas existe
 * `src/server/supabase-admin.ts`.
 */
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
	getCookies,
	getRequestHeader,
	setCookie,
} from "@tanstack/react-start/server";
import type { Database } from "@/types/database.types";

function leerEnv(nombre: string): string | undefined {
	const runtime = globalThis as typeof globalThis & {
		process?: { env?: Record<string, string | undefined> };
	};
	const valorProceso = runtime.process?.env?.[nombre];
	if (valorProceso) return valorProceso;
	return (import.meta.env as Record<string, string | undefined>)[nombre];
}

/**
 * Crea un cliente por petición. No lo guardes en una variable global: la
 * sesión y las cookies pertenecen a la petición actual.
 */
export function getSupabaseServer(): SupabaseClient<Database> {
	const url = leerEnv("SUPABASE_URL") ?? leerEnv("VITE_SUPABASE_URL");
	const key =
		leerEnv("SUPABASE_PUBLISHABLE_KEY") ??
		leerEnv("VITE_SUPABASE_PUBLISHABLE_KEY");

	if (!url || !key) {
		throw new Error(
			"Faltan SUPABASE_URL/VITE_SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY/VITE_SUPABASE_PUBLISHABLE_KEY en el servidor.",
		);
	}

	const cookies = getCookies();
	const authorization = getRequestHeader("authorization");

	return createServerClient<Database>(url, key, {
		cookies: {
			getAll() {
				return Object.entries(cookies).map(([name, value]) => ({
					name,
					value,
				}));
			},
			setAll(cookiesToSet) {
				for (const { name, value, options } of cookiesToSet) {
					setCookie(name, value, options);
				}
			},
		},
		global: authorization
			? {
					headers: {
						Authorization: authorization,
					},
				}
			: undefined,
	});
}
