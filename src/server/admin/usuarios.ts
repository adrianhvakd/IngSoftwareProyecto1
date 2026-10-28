/**
 * Usuarios del panel administrador.
 *
 * ⚠️ SOLO SERVIDOR. Los cambios de rol pasan por `promover_a_vendedor` cuando
 * el destino es vendedor; el resto se actualiza con RLS de administrador.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ResultadoOperacion } from "@/lib/admin";
import type { Usuario } from "@/types/models";
import { aUsuario, mensajeDeError, requireAdmin } from "./shared";

const usuarioSchema = z.object({
	usuarioId: z.string().uuid(),
});

const rolSchema = usuarioSchema.extend({
	rol: z.enum(["administrador", "vendedor", "cliente"]),
});

const estadoSchema = usuarioSchema.extend({
	activo: z.boolean(),
});

async function contarAdminsActivos(
	supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
): Promise<number> {
	const { count, error } = await supabase
		.from("perfiles")
		.select("id", { count: "exact", head: true })
		.eq("rol", "administrador")
		.eq("activo", true);

	if (error) throw error;
	return count ?? 0;
}

export const listarUsuariosAdmin = createServerFn({ method: "GET" }).handler(
	async (): Promise<Usuario[]> => {
		try {
			const { supabase } = await requireAdmin();
			const { data, error } = await supabase
				.from("perfiles")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) throw error;
			return (data ?? []).map(aUsuario);
		} catch (error) {
			console.warn(
				"[admin] No se pudieron cargar los usuarios:",
				error instanceof Error ? error.message : error,
			);
			return [];
		}
	},
);

export const cambiarRolUsuario = createServerFn({ method: "POST" })
	.validator(rolSchema)
	.handler(async ({ data }): Promise<ResultadoOperacion> => {
		try {
			const { id, supabase } = await requireAdmin();

			if (data.usuarioId === id) {
				return {
					ok: false,
					error: "No puedes cambiar tu propio rol desde esta pantalla.",
				};
			}

			const { data: perfil, error: perfilError } = await supabase
				.from("perfiles")
				.select("id, rol, activo")
				.eq("id", data.usuarioId)
				.maybeSingle();

			if (perfilError) throw perfilError;
			if (!perfil) {
				return { ok: false, error: "El usuario ya no existe." };
			}

			if (perfil.rol === data.rol) {
				return { ok: true };
			}

			if (perfil.rol === "administrador" && perfil.activo) {
				const admins = await contarAdminsActivos(supabase);
				if (admins <= 1) {
					return {
						ok: false,
						error: "Debe quedar al menos un administrador activo.",
					};
				}
			}

			if (data.rol === "vendedor") {
				const { data: vendedor } = await supabase
					.from("vendedores")
					.select("comision_fija, cargo")
					.eq("perfil_id", data.usuarioId)
					.maybeSingle();

				const { error } = await supabase.rpc("promover_a_vendedor", {
					p_perfil_id: data.usuarioId,
					p_comision: Number(vendedor?.comision_fija ?? 0),
					p_cargo: vendedor?.cargo ?? "Agente comercial",
				});

				if (error) throw error;
				return { ok: true };
			}

			const { error } = await supabase
				.from("perfiles")
				.update({ rol: data.rol })
				.eq("id", data.usuarioId);

			if (error) throw error;

			if (perfil.rol === "vendedor") {
				const { error: vendedorError } = await supabase
					.from("vendedores")
					.update({ activo: false })
					.eq("perfil_id", data.usuarioId);

				if (vendedorError) {
					console.warn(
						"[admin] No se pudo desactivar la fila de vendedor:",
						vendedorError.message,
					);
				}
			}

			return { ok: true };
		} catch (error) {
			console.warn(
				"[admin] Error al cambiar rol:",
				error instanceof Error ? error.message : error,
			);
			return {
				ok: false,
				error: mensajeDeError(error as { code?: string; message?: string }),
			};
		}
	});

export const cambiarEstadoUsuario = createServerFn({ method: "POST" })
	.validator(estadoSchema)
	.handler(async ({ data }): Promise<ResultadoOperacion> => {
		try {
			const { id, supabase } = await requireAdmin();

			if (data.usuarioId === id && !data.activo) {
				return {
					ok: false,
					error: "No puedes desactivar tu propia cuenta.",
				};
			}

			const { data: perfil, error: perfilError } = await supabase
				.from("perfiles")
				.select("id, rol, activo")
				.eq("id", data.usuarioId)
				.maybeSingle();

			if (perfilError) throw perfilError;
			if (!perfil) {
				return { ok: false, error: "El usuario ya no existe." };
			}

			if (!data.activo && perfil.rol === "administrador") {
				const admins = await contarAdminsActivos(supabase);
				if (admins <= 1) {
					return {
						ok: false,
						error: "Debe quedar al menos un administrador activo.",
					};
				}
			}

			const { error } = await supabase
				.from("perfiles")
				.update({ activo: data.activo })
				.eq("id", data.usuarioId);

			if (error) throw error;

			if (perfil.rol === "vendedor") {
				const { error: vendedorError } = await supabase
					.from("vendedores")
					.update({ activo: data.activo })
					.eq("perfil_id", data.usuarioId);

				if (vendedorError) {
					console.warn(
						"[admin] No se pudo sincronizar el estado del vendedor:",
						vendedorError.message,
					);
				}
			}

			return { ok: true };
		} catch (error) {
			console.warn(
				"[admin] Error al cambiar estado:",
				error instanceof Error ? error.message : error,
			);
			return {
				ok: false,
				error: mensajeDeError(error as { code?: string; message?: string }),
			};
		}
	});
