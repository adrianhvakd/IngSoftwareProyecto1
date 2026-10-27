/**
 * Cliente de Supabase para el NAVEGADOR.
 *
 * Usa la clave publicable (publishable/anon) y cookies compartidas con el
 * servidor mediante `@supabase/ssr`. Nunca importes aquí la service role.
 *
 * Se crea de forma perezosa para no tocar `document` durante el render SSR.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

let cliente: SupabaseClient<Database> | null = null;

function leerEnvPublica(nombre: string): string | undefined {
	return (import.meta.env as Record<string, string | undefined>)[nombre];
}

export function getSupabaseBrowser(): SupabaseClient<Database> {
	if (typeof window === "undefined") {
		throw new Error(
			"getSupabaseBrowser() solo puede usarse en el navegador. En el servidor usa @/lib/supabase/server.",
		);
	}

	if (cliente) return cliente;

	const url = leerEnvPublica("VITE_SUPABASE_URL");
	const key = leerEnvPublica("VITE_SUPABASE_PUBLISHABLE_KEY");

	if (!url || !key) {
		throw new Error(
			"Faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_PUBLISHABLE_KEY. Copia .env.example a .env y completa los valores.",
		);
	}

	cliente = createBrowserClient<Database>(url, key);
	return cliente;
}
