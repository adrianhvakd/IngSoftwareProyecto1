/**
 * Seed de usuarios demo (SOLO DESARROLLO).
 *
 * Crea/actualiza tres cuentas con la Admin API usando la SERVICE ROLE:
 *   - admin:    rodrigo.alvarez@remaxpotosi.bo
 *   - vendedor: carla.mendoza@remaxpotosi.bo
 *   - cliente:  luis.catari@gmail.com
 *   - password: RemaxDemo#2026 (se puede sobrescribir con SEED_DEMO_PASSWORD)
 *
 * Después de crear los usuarios, ejecuta `supabase/seed.sql` para vincular el
 * catálogo y los datos transaccionales. Si existe `SUPABASE_DB_URL`, el script
 * hace esa ejecución automáticamente; si no, imprime la instrucción.
 *
 * Guardia anti-producción: se niega a correr si NODE_ENV/APP_ENV/SUPABASE_ENV/
 * ENVIRONMENT indican producción. No hay bypass.
 */
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database.types";
import postgres from "postgres";

try {
	process.loadEnvFile?.();
} catch {
	// No hay .env: se usan las variables del entorno o se falla más abajo.
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(__dirname, "..");

type RolDemo = "administrador" | "vendedor" | "cliente";

interface DemoUser {
	rol: RolDemo;
	correo: string;
	nombres: string;
	apellidos: string;
	telefono: string;
	avatarUrl: string;
	creadoEl: string;
}

const DEMO_USERS: DemoUser[] = [
	{
		rol: "administrador",
		correo: "rodrigo.alvarez@remaxpotosi.bo",
		nombres: "Rodrigo",
		apellidos: "Álvarez Paredes",
		telefono: "+591 71234567",
		avatarUrl:
			"https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=70",
		creadoEl: "2024-01-12T12:00:00-04:00",
	},
	{
		rol: "vendedor",
		correo: "carla.mendoza@remaxpotosi.bo",
		nombres: "Carla",
		apellidos: "Mendoza Vaca",
		telefono: "+591 72345678",
		avatarUrl:
			"https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=70",
		creadoEl: "2024-02-03T12:00:00-04:00",
	},
	{
		rol: "cliente",
		correo: "luis.catari@gmail.com",
		nombres: "Luis Fernando",
		apellidos: "Catari Choque",
		telefono: "+591 67890123",
		avatarUrl:
			"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=70",
		creadoEl: "2025-06-15T12:00:00-04:00",
	},
];

const PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "RemaxDemo#2026";

function esProduccion(): boolean {
	const valores = [
		process.env.NODE_ENV,
		process.env.APP_ENV,
		process.env.SUPABASE_ENV,
		process.env.ENVIRONMENT,
	]
		.filter(Boolean)
		.map((valor) => valor?.toLowerCase());

	return valores.some((valor) => valor === "production" || valor === "prod");
}

function requerirEnv(nombre: string): string {
	const valor = process.env[nombre];
	if (!valor) {
		throw new Error(`Falta ${nombre} en el entorno.`);
	}
	return valor;
}

async function buscarUsuarioPorCorreo(
	admin: SupabaseClient<Database>,
	correo: string,
) {
	const { data, error } = await admin.auth.admin.listUsers({
		page: 1,
		perPage: 1000,
	});
	if (error) {
		throw new Error(`No se pudo listar usuarios: ${error.message}`);
	}
	return data.users.find(
		(usuario) => usuario.email?.toLowerCase() === correo.toLowerCase(),
	);
}

async function asegurarUsuario(
	admin: SupabaseClient<Database>,
	demo: DemoUser,
): Promise<string> {
	const existente = await buscarUsuarioPorCorreo(admin, demo.correo);
	const metadata = {
		rol: demo.rol,
		creado_por_backend: true,
		debe_cambiar_password: false,
	};
	const userMetadata = {
		nombres: demo.nombres,
		apellidos: demo.apellidos,
		telefono: demo.telefono,
		avatar_url: demo.avatarUrl,
	};

	if (existente) {
		const { error } = await admin.auth.admin.updateUserById(existente.id, {
			password: PASSWORD,
			email_confirm: true,
			app_metadata: { ...existente.app_metadata, ...metadata },
			user_metadata: { ...existente.user_metadata, ...userMetadata },
		});
		if (error) {
			throw new Error(
				`No se pudo actualizar ${demo.correo}: ${error.message}`,
			);
		}
		return existente.id;
	}

	const { data, error } = await admin.auth.admin.createUser({
		email: demo.correo,
		password: PASSWORD,
		email_confirm: true,
		app_metadata: metadata,
		user_metadata: userMetadata,
	});
	if (error || !data.user) {
		throw new Error(
			`No se pudo crear ${demo.correo}: ${error?.message ?? "respuesta vacía"}`,
		);
	}
	return data.user.id;
}

async function escribirPerfil(
	admin: SupabaseClient<Database>,
	demo: DemoUser,
	id: string,
): Promise<void> {
	const { error } = await admin.from("perfiles").upsert(
		{
			id,
			nombres: demo.nombres,
			apellidos: demo.apellidos,
			ci: null,
			telefono: demo.telefono,
			correo: demo.correo,
			rol: demo.rol,
			activo: true,
			debe_cambiar_password: false,
			avatar_url: demo.avatarUrl,
			created_at: demo.creadoEl,
		},
		{ onConflict: "id" },
	);
	if (error) {
		throw new Error(
			`No se pudo escribir el perfil de ${demo.correo}: ${error.message}`,
		);
	}

	if (demo.rol === "vendedor") {
		const { error: vendedorError } = await admin.from("vendedores").upsert(
			{
				perfil_id: id,
				comision_fija: 850,
				cargo: "Agente sénior",
				activo: true,
			},
			{ onConflict: "perfil_id" },
		);
		if (vendedorError) {
			throw new Error(
				`No se pudo crear el vendedor demo: ${vendedorError.message}`,
			);
		}
	}

	if (demo.rol === "cliente") {
		const { error: clienteError } = await admin.from("clientes").upsert(
			{
				perfil_id: id,
				telefono_contacto: demo.telefono,
				direccion: "Av. Villazón Nº 220, Centro histórico",
			},
			{ onConflict: "perfil_id" },
		);
		if (clienteError) {
			throw new Error(
				`No se pudo crear el cliente demo: ${clienteError.message}`,
			);
		}
	}
}

async function ejecutarSeedSql(): Promise<boolean> {
	const dbUrl = process.env.SUPABASE_DB_URL;
	if (!dbUrl) {
		return false;
	}

	const sql = postgres(dbUrl, {
		max: 1,
		prepare: false,
		ssl: dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1")
			? false
			: "require",
		onnotice: (notice) => {
			if (notice.message) console.info(`[seed] ${notice.message}`);
		},
	});

	try {
		const seed = await readFile(resolve(RAIZ, "supabase/seed.sql"), "utf8");
		// `simple()` permite ejecutar el archivo completo (varias sentencias y
		// bloques `begin/commit`) en una sola llamada al protocolo simple.
		await sql.unsafe(seed).simple();
	} finally {
		await sql.end({ timeout: 5 });
	}

	return true;
}

async function main(): Promise<void> {
	if (esProduccion()) {
		throw new Error(
			"seed-users.ts es solo para desarrollo. Se detectó un entorno de producción; no se creó ningún usuario.",
		);
	}

	const url =
		process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
	const serviceRoleKey = requerirEnv("SUPABASE_SERVICE_ROLE_KEY");
	if (!url) {
		throw new Error("Falta SUPABASE_URL o VITE_SUPABASE_URL.");
	}

	const admin = createClient<Database>(url, serviceRoleKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
			detectSessionInUrl: false,
		},
	});

	const ids: Record<string, string> = {};
	for (const demo of DEMO_USERS) {
		const id = await asegurarUsuario(admin, demo);
		await escribirPerfil(admin, demo, id);
		ids[demo.rol] = id;
		console.info(`✓ ${demo.rol}: ${demo.correo}`);
	}

	const ejecutado = await ejecutarSeedSql();
	console.info("");
	console.info("Cuentas demo listas:");
	console.table(
		DEMO_USERS.map((demo) => ({
			rol: demo.rol,
			correo: demo.correo,
			password: PASSWORD,
			id: ids[demo.rol],
		})),
	);

	if (ejecutado) {
		console.info("\nsupabase/seed.sql ejecutado contra SUPABASE_DB_URL.");
	} else {
		console.info(
			"\nAhora ejecuta supabase/seed.sql en el editor SQL de Supabase " +
				"(o define SUPABASE_DB_URL y repite el script para hacerlo automático).",
		);
	}
}

main().catch((error) => {
	console.error(`\nError: ${error instanceof Error ? error.message : error}`);
	process.exitCode = 1;
});
