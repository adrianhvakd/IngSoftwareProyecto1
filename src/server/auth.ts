/**
 * Autenticación real con Supabase.
 *
 * ⚠️ SOLO SERVIDOR. Usa el cliente de `src/lib/supabase/server.ts`, que lee y
 * escribe las cookies de sesión de la petición actual con la clave publicable.
 * RLS sigue aplicando; aquí no se usa la service role.
 *
 * Las mutaciones de contraseña y de la bandera `debe_cambiar_password` pasan
 * por la RPC `marcar_password_actualizada` (migración 0008), no por un UPDATE
 * directo desde el navegador.
 */

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ResultadoAuth, RolDb, SesionUsuario } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type Cliente = SupabaseClient<Database>;

interface PerfilSesion {
	id: string;
	nombres: string;
	apellidos: string;
	correo: string;
	telefono: string | null;
	rol: RolDb;
	activo: boolean;
	debe_cambiar_password: boolean;
	avatar_url: string | null;
}

const CAMPOS_PERFIL =
	"id, nombres, apellidos, correo, telefono, rol, activo, debe_cambiar_password, avatar_url" as const;

function aSesion(perfil: PerfilSesion): SesionUsuario {
	return {
		id: perfil.id,
		nombres: perfil.nombres,
		apellidos: perfil.apellidos,
		correo: perfil.correo,
		telefono: perfil.telefono,
		rol: perfil.rol,
		activo: perfil.activo,
		debeCambiarPassword: perfil.debe_cambiar_password,
		avatarUrl: perfil.avatar_url,
	};
}

/** Lee el perfil de negocio del usuario autenticado; `null` si no es válido. */
async function leerPerfil(
	supabase: Cliente,
	user: User,
): Promise<SesionUsuario | null> {
	const { data, error } = await supabase
		.from("perfiles")
		.select(CAMPOS_PERFIL)
		.eq("id", user.id)
		.maybeSingle();

	if (error || !data) return null;
	if (!data.activo) return null;

	return aSesion(data as PerfilSesion);
}

function mensajeDeError(error: { code?: string; message?: string }): string {
	switch (error.code) {
		case "invalid_credentials":
			return "Correo o contraseña incorrectos.";
		case "email_not_confirmed":
			return "Debes confirmar tu correo antes de ingresar. Revisa tu bandeja de entrada.";
		case "user_already_exists":
		case "email_exists":
			return "Ya existe una cuenta con ese correo electrónico.";
		case "weak_password":
			return "La contraseña es demasiado débil. Usa al menos 6 caracteres.";
		case "same_password":
			return "La nueva contraseña debe ser diferente a la anterior.";
		case "signup_disabled":
			return "El registro está deshabilitado. Contacta a un administrador.";
		case "over_email_send_rate_limit":
		case "over_request_rate_limit":
			return "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.";
		case "email_address_invalid":
			return "El correo electrónico no es válido.";
		default:
			break;
	}

	const mensaje = error.message?.toLowerCase() ?? "";
	if (mensaje.includes("invalid login credentials")) {
		return "Correo o contraseña incorrectos.";
	}
	if (mensaje.includes("email not confirmed")) {
		return "Debes confirmar tu correo antes de ingresar. Revisa tu bandeja de entrada.";
	}
	if (mensaje.includes("already registered")) {
		return "Ya existe una cuenta con ese correo electrónico.";
	}
	if (mensaje.includes("password")) {
		return "La contraseña no cumple los requisitos mínimos (6 caracteres).";
	}
	if (mensaje.includes("fetch") || mensaje.includes("network")) {
		return "No se pudo conectar con Supabase. Verifica tu conexión e inténtalo de nuevo.";
	}

	return "No se pudo completar la operación. Inténtalo de nuevo.";
}

/* ------------------------------- Sesión -------------------------------- */

export const obtenerSesion = createServerFn({ method: "GET" }).handler(
	async (): Promise<SesionUsuario | null> => {
		try {
			const supabase = getSupabaseServer();
			const {
				data: { user },
				error,
			} = await supabase.auth.getUser();

			if (error || !user) return null;

			return await leerPerfil(supabase, user);
		} catch (error) {
			// Sin variables de entorno (por ejemplo, build o primer arranque) la
			// sesión simplemente no existe; no se rompe el sitio público.
			console.warn(
				"[auth] No se pudo leer la sesión:",
				error instanceof Error ? error.message : error,
			);
			return null;
		}
	},
);

/* -------------------------------- Login -------------------------------- */

const loginSchema = z.object({
	correo: z.string().trim().email(),
	password: z.string().min(1),
});

export const iniciarSesion = createServerFn({ method: "POST" })
	.validator(loginSchema)
	.handler(
		async ({ data }): Promise<ResultadoAuth<{ sesion: SesionUsuario }>> => {
			try {
				const supabase = getSupabaseServer();
				const { data: authData, error } =
					await supabase.auth.signInWithPassword({
						email: data.correo.trim().toLowerCase(),
						password: data.password,
					});

				if (error) {
					return { ok: false, error: mensajeDeError(error) };
				}

				if (!authData.user) {
					return {
						ok: false,
						error: "No se pudo recuperar el usuario autenticado.",
					};
				}

				const sesion = await leerPerfil(supabase, authData.user);

				if (!sesion) {
					// Cuenta sin perfil o desactivada: no dejamos la sesión abierta.
					await supabase.auth.signOut();
					return {
						ok: false,
						error:
							"Tu cuenta está inactiva o no tiene un perfil habilitado. Contacta a un administrador.",
					};
				}

				return { ok: true, sesion };
			} catch (error) {
				console.error("[auth] Error al iniciar sesión:", error);
				return {
					ok: false,
					error:
						"No se pudo conectar con el servicio de autenticación. Verifica la configuración de Supabase.",
				};
			}
		},
	);

/* ------------------------------ Registro ------------------------------- */

const registroSchema = z.object({
	nombres: z.string().trim().min(1).max(120),
	apellidos: z.string().trim().max(120),
	telefono: z.string().trim().max(30).optional(),
	correo: z.string().trim().email(),
	password: z.string().min(6).max(72),
});

export const registrarCuenta = createServerFn({ method: "POST" })
	.validator(registroSchema)
	.handler(
		async ({
			data,
		}): Promise<
			ResultadoAuth<{
				requiereConfirmacion: boolean;
				sesion: SesionUsuario | null;
			}>
		> => {
			try {
				const supabase = getSupabaseServer();
				const { data: authData, error } = await supabase.auth.signUp({
					email: data.correo.trim().toLowerCase(),
					password: data.password,
					options: {
						data: {
							nombres: data.nombres,
							apellidos: data.apellidos,
							telefono: data.telefono?.trim() || null,
						},
					},
				});

				if (error) {
					return { ok: false, error: mensajeDeError(error) };
				}

				// El trigger `handle_new_user` crea el perfil como cliente. Si el
				// proyecto exige confirmar correo, no habrá sesión todavía.
				if (!authData.session || !authData.user) {
					return {
						ok: true,
						requiereConfirmacion: true,
						sesion: null,
					};
				}

				const sesion = await leerPerfil(supabase, authData.user);

				return {
					ok: true,
					requiereConfirmacion: false,
					sesion,
				};
			} catch (error) {
				console.error("[auth] Error al registrar cuenta:", error);
				return {
					ok: false,
					error:
						"No se pudo conectar con el servicio de autenticación. Verifica la configuración de Supabase.",
				};
			}
		},
	);

/* ------------------------------- Logout -------------------------------- */

export const cerrarSesion = createServerFn({ method: "POST" }).handler(
	async (): Promise<ResultadoAuth> => {
		try {
			const supabase = getSupabaseServer();
			const { error } = await supabase.auth.signOut();

			if (error) {
				return { ok: false, error: mensajeDeError(error) };
			}

			return { ok: true };
		} catch (error) {
			console.error("[auth] Error al cerrar sesión:", error);
			return {
				ok: false,
				error: "No se pudo cerrar la sesión. Inténtalo de nuevo.",
			};
		}
	},
);

/* -------------------------- Cambio de contraseña ------------------------ */

const passwordSchema = z.object({
	password: z.string().min(6).max(72),
});

export const cambiarPassword = createServerFn({ method: "POST" })
	.validator(passwordSchema)
	.handler(
		async ({ data }): Promise<ResultadoAuth<{ sesion: SesionUsuario }>> => {
			try {
				const supabase = getSupabaseServer();
				const {
					data: { user },
					error: userError,
				} = await supabase.auth.getUser();

				if (userError || !user) {
					return {
						ok: false,
						error: "Tu sesión expiró. Vuelve a iniciar sesión.",
					};
				}

				const { error: updateError } = await supabase.auth.updateUser({
					password: data.password,
				});

				if (updateError) {
					return { ok: false, error: mensajeDeError(updateError) };
				}

				// La bandera es protegida por trigger; solo esta RPC puede limpiarla.
				const { error: rpcError } = await supabase.rpc(
					"marcar_password_actualizada",
				);

				if (rpcError) {
					console.error(
						"[auth] Contraseña actualizada pero no se limpió la bandera:",
						rpcError,
					);
					return {
						ok: false,
						error:
							"Tu contraseña se actualizó, pero no se pudo completar el registro. Vuelve a iniciar sesión.",
					};
				}

				const sesion = await leerPerfil(supabase, user);

				if (!sesion) {
					return {
						ok: false,
						error: "No se pudo leer tu perfil después del cambio.",
					};
				}

				return { ok: true, sesion };
			} catch (error) {
				console.error("[auth] Error al cambiar contraseña:", error);
				return {
					ok: false,
					error: "No se pudo cambiar la contraseña. Inténtalo de nuevo.",
				};
			}
		},
	);
