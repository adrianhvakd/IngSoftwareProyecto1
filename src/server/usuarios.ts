/**
 * Alta de usuarios con contraseña temporal.
 *
 * ⚠️ SOLO SERVIDOR. La creación de usuarios con contraseña no se puede hacer
 * con SQL: requiere la Admin API de Supabase y la SERVICE ROLE. Estas server
 * functions se dejan listas y documentadas, pero **todavía no están conectadas
 * a ninguna pantalla** (eso llega en un entregable posterior).
 *
 * Flujo:
 *   1. Se valida el JWT del solicitante contra Supabase Auth.
 *   2. Se lee su perfil y se comprueba el rol (admin, o vendedor solo clientes).
 *   3. Se genera una contraseña aleatoria con Web Crypto.
 *   4. `auth.admin.createUser` crea el usuario con `app_metadata.rol` y la
 *      marca `creado_por_backend = true`; el trigger handle_new_user crea el
 *      perfil con el rol correcto.
 *   5. Se crea la fila de vendedor o se completa la de cliente.
 *   6. Se devuelve la contraseña UNA SOLA VEZ. No se guarda ni se registra.
 */
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { getSupabaseAdmin } from "./supabase-admin";

type Rol = "administrador" | "vendedor" | "cliente";

interface Actor {
	id: string;
	rol: Rol;
}

interface UsuarioCreado {
	id: string;
	correo: string;
	password: string;
	rol: Rol;
}

/* ----------------------------- Contraseña ------------------------------ */

const MAYUSCULAS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const MINUSCULAS = "abcdefghijkmnopqrstuvwxyz";
const DIGITOS = "23456789";
const SIMBOLOS = "!@#$%&*+-_";
const TODOS = MAYUSCULAS + MINUSCULAS + DIGITOS + SIMBOLOS;

/** Entero criptográficamente aleatorio en [0, max), sin sesgo de módulo. */
function indiceAleatorio(max: number): number {
	const limite = Math.floor(0x1_0000_0000 / max) * max;
	const bytes = new Uint32Array(1);

	do {
		crypto.getRandomValues(bytes);
	} while (bytes[0] >= limite);

	return bytes[0] % max;
}

/**
 * Genera una contraseña temporal con al menos una mayúscula, una minúscula,
 * un dígito y un símbolo. Longitud mínima: 12; por defecto: 16.
 */
export function generarPasswordTemporal(longitud = 16): string {
	const tamano = Math.max(longitud, 12);
	const obligatorios = [MAYUSCULAS, MINUSCULAS, DIGITOS, SIMBOLOS].map(
		(grupo) => grupo[indiceAleatorio(grupo.length)],
	);
	const resto = Array.from(
		{ length: tamano - obligatorios.length },
		() => TODOS[indiceAleatorio(TODOS.length)],
	);
	const caracteres = [...obligatorios, ...resto];

	// Fisher-Yates con aleatoriedad criptográfica.
	for (let i = caracteres.length - 1; i > 0; i -= 1) {
		const j = indiceAleatorio(i + 1);
		[caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]];
	}

	return caracteres.join("");
}

/* --------------------------- Autorización ------------------------------- */

/**
 * Valida el Bearer token del request y devuelve el perfil activo.
 * La comprobación se hace con la service role, por lo que no depende de RLS.
 */
async function requireActor(): Promise<Actor> {
	const authorization = getRequestHeader("authorization");

	if (!authorization?.startsWith("Bearer ")) {
		throw new Error("Debes iniciar sesión para crear usuarios.");
	}

	const token = authorization.slice("Bearer ".length).trim();

	if (!token) {
		throw new Error("Token de sesión vacío.");
	}

	const admin = getSupabaseAdmin();
	const { data: authData, error: authError } = await admin.auth.getUser(token);

	if (authError || !authData.user) {
		throw new Error("Sesión inválida o expirada.");
	}

	const { data: perfil, error: perfilError } = await admin
		.from("perfiles")
		.select("id, rol, activo")
		.eq("id", authData.user.id)
		.maybeSingle();

	if (perfilError) {
		throw new Error("No se pudo leer el perfil del solicitante.");
	}

	if (!perfil?.activo) {
		throw new Error("El perfil del solicitante está inactivo.");
	}

	return {
		id: perfil.id as string,
		rol: perfil.rol as Rol,
	};
}

/* ------------------------- Creación compartida -------------------------- */

interface DatosAlta {
	rol: Rol;
	nombres: string;
	apellidos: string;
	ci?: string;
	telefono?: string;
	correo: string;
	direccion?: string;
	comisionFija?: number;
	cargo?: string;
	zonaPrincipalId?: string;
}

async function crearUsuarioConPassword(
	datos: DatosAlta,
): Promise<UsuarioCreado> {
	const admin = getSupabaseAdmin();
	const correo = datos.correo.trim().toLowerCase();
	const password = generarPasswordTemporal();

	const { data: creado, error: createError } =
		await admin.auth.admin.createUser({
			email: correo,
			password,
			email_confirm: true,
			app_metadata: {
				rol: datos.rol,
				creado_por_backend: true,
				debe_cambiar_password: true,
			},
			user_metadata: {
				nombres: datos.nombres,
				apellidos: datos.apellidos,
				ci: datos.ci ?? null,
				telefono: datos.telefono ?? null,
			},
		});

	if (createError || !creado.user) {
		throw new Error(
			`No se pudo crear el usuario: ${createError?.message ?? "respuesta vacía de Auth"}`,
		);
	}

	const usuarioId = creado.user.id;

	try {
		// El trigger ya creó el perfil; se refuerza la bandera por si el
		// metadata no llegó a aplicarse.
		const { error: perfilError } = await admin
			.from("perfiles")
			.update({ debe_cambiar_password: true })
			.eq("id", usuarioId);

		if (perfilError) {
			throw new Error(
				`Se creó el usuario pero no se pudo marcar la contraseña temporal: ${perfilError.message}`,
			);
		}

		if (datos.rol === "vendedor") {
			const { error: vendedorError } = await admin.from("vendedores").insert({
				perfil_id: usuarioId,
				comision_fija: datos.comisionFija ?? 0,
				cargo: datos.cargo ?? null,
				zona_principal_id: datos.zonaPrincipalId ?? null,
				activo: true,
			});

			if (vendedorError) {
				throw new Error(
					`Se creó el usuario pero no la fila de vendedor: ${vendedorError.message}`,
				);
			}
		} else {
			const { error: clienteError } = await admin.from("clientes").upsert(
				{
					perfil_id: usuarioId,
					telefono_contacto: datos.telefono ?? null,
					direccion: datos.direccion ?? null,
				},
				{ onConflict: "perfil_id" },
			);

			if (clienteError) {
				throw new Error(
					`Se creó el usuario pero no la fila de cliente: ${clienteError.message}`,
				);
			}
		}
	} catch (error) {
		// La creación es multi-tabla. Si falla el dominio, se elimina el usuario
		// de Auth para no dejar cuentas huérfanas (el delete hace cascade).
		await admin.auth.admin.deleteUser(usuarioId);
		throw error;
	}

	return {
		id: usuarioId,
		correo,
		password,
		rol: datos.rol,
	};
}

/* ------------------------------ Server fns ------------------------------ */

const vendedorSchema = z.object({
	nombres: z.string().trim().min(1).max(120),
	apellidos: z.string().trim().min(1).max(120),
	ci: z.string().trim().max(30).optional(),
	telefono: z.string().trim().max(30).optional(),
	correo: z.string().trim().email(),
	comisionFija: z.number().min(0).max(1_000_000),
	cargo: z.string().trim().max(120).optional(),
	zonaPrincipalId: z.string().uuid().optional(),
});

const clienteSchema = z.object({
	nombres: z.string().trim().min(1).max(120),
	apellidos: z.string().trim().min(1).max(120),
	ci: z.string().trim().max(30).optional(),
	telefono: z.string().trim().max(30).optional(),
	correo: z.string().trim().email(),
	direccion: z.string().trim().max(240).optional(),
});

export const crearUsuarioVendedor = createServerFn({ method: "POST" })
	.validator(vendedorSchema)
	.handler(async ({ data }) => {
		const actor = await requireActor();

		if (actor.rol !== "administrador") {
			throw new Error("Solo un administrador puede crear vendedores.");
		}

		return crearUsuarioConPassword({
			rol: "vendedor",
			nombres: data.nombres,
			apellidos: data.apellidos,
			ci: data.ci,
			telefono: data.telefono,
			correo: data.correo,
			comisionFija: data.comisionFija,
			cargo: data.cargo,
			zonaPrincipalId: data.zonaPrincipalId,
		});
	});

export const crearUsuarioCliente = createServerFn({ method: "POST" })
	.validator(clienteSchema)
	.handler(async ({ data }) => {
		const actor = await requireActor();

		if (actor.rol !== "administrador" && actor.rol !== "vendedor") {
			throw new Error("Solo un administrador o vendedor puede crear clientes.");
		}

		return crearUsuarioConPassword({
			rol: "cliente",
			nombres: data.nombres,
			apellidos: data.apellidos,
			ci: data.ci,
			telefono: data.telefono,
			correo: data.correo,
			direccion: data.direccion,
		});
	});
