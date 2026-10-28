/**
 * Vendedores del panel administrador.
 *
 * ⚠️ SOLO SERVIDOR. El ascenso usa `promover_a_vendedor`; los datos de perfil y
 * la fila de vendedor se actualizan con RLS de administrador. El cambio de
 * correo requiere la Admin API de Auth y se hace con la service role.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ResultadoOperacion } from "@/lib/admin";
import type { DatosListaVendedores } from "@/types/admin";
import { getSupabaseAdmin } from "../supabase-admin";
import {
	aUsuario,
	cargarVendedores,
	mensajeDeError,
	requireAdmin,
	resolverZonaId,
} from "./shared";

const promoverSchema = z.object({
	perfilId: z.string().uuid(),
	comision: z.number().min(0).max(1_000_000),
	cargo: z.string().trim().max(120).optional(),
	zona: z.string().trim().max(120).optional(),
});

const actualizarSchema = z.object({
	perfilId: z.string().uuid(),
	nombres: z.string().trim().min(1).max(120),
	apellidos: z.string().trim().min(1).max(120),
	correo: z.string().trim().email().max(160),
	telefono: z.string().trim().max(30).optional(),
	cargo: z.string().trim().max(120).optional(),
	comision: z.number().min(0).max(1_000_000),
	zona: z.string().trim().max(120).optional(),
});

const bajaSchema = z.object({
	perfilId: z.string().uuid(),
});

export const listarVendedoresAdmin = createServerFn({
	method: "GET",
}).handler(async (): Promise<DatosListaVendedores> => {
	try {
		const { supabase } = await requireAdmin();
		const [vendedores, perfilesResult] = await Promise.all([
			cargarVendedores(supabase),
			supabase.from("perfiles").select("*").order("created_at", {
				ascending: false,
			}),
		]);

		if (perfilesResult.error) throw perfilesResult.error;

		const idsVendedores = new Set(vendedores.map((vendedor) => vendedor.id));
		const candidatos = (perfilesResult.data ?? [])
			.filter(
				(perfil) =>
					perfil.rol !== "administrador" && !idsVendedores.has(perfil.id),
			)
			.map(aUsuario);

		return { vendedores, candidatos };
	} catch (error) {
		console.warn(
			"[admin] No se pudieron cargar los vendedores:",
			error instanceof Error ? error.message : error,
		);
		return { vendedores: [], candidatos: [] };
	}
});

export const promoverVendedor = createServerFn({ method: "POST" })
	.validator(promoverSchema)
	.handler(async ({ data }): Promise<ResultadoOperacion> => {
		try {
			const { supabase } = await requireAdmin();
			const zonaPrincipalId = data.zona
				? await resolverZonaId(supabase, data.zona)
				: null;

			const { error } = await supabase.rpc("promover_a_vendedor", {
				p_perfil_id: data.perfilId,
				p_comision: data.comision,
				p_cargo: data.cargo?.trim() || "Agente comercial",
				p_zona_principal_id: zonaPrincipalId,
			});

			if (error) throw error;
			return { ok: true };
		} catch (error) {
			console.warn(
				"[admin] Error al promover vendedor:",
				error instanceof Error ? error.message : error,
			);
			return {
				ok: false,
				error: mensajeDeError(error as { code?: string; message?: string }),
			};
		}
	});

export const actualizarVendedor = createServerFn({ method: "POST" })
	.validator(actualizarSchema)
	.handler(async ({ data }): Promise<ResultadoOperacion> => {
		try {
			const { supabase } = await requireAdmin();
			const correo = data.correo.trim().toLowerCase();

			const { data: perfil, error: perfilError } = await supabase
				.from("perfiles")
				.select("id, correo")
				.eq("id", data.perfilId)
				.maybeSingle();

			if (perfilError) throw perfilError;
			if (!perfil) {
				return { ok: false, error: "El vendedor ya no existe." };
			}

			const zonaPrincipalId = data.zona
				? await resolverZonaId(supabase, data.zona)
				: null;

			const correoAnterior = perfil.correo;
			const cambioCorreo =
				correoAnterior.trim().toLowerCase() !== correo.toLowerCase();

			if (cambioCorreo) {
				const admin = getSupabaseAdmin();
				const { error: authError } = await admin.auth.admin.updateUserById(
					data.perfilId,
					{ email: correo, email_confirm: true },
				);

				if (authError) {
					throw new Error(
						`No se pudo actualizar el correo de acceso: ${authError.message}`,
					);
				}
			}

			const { error: updateError } = await supabase
				.from("perfiles")
				.update({
					nombres: data.nombres,
					apellidos: data.apellidos,
					correo,
					telefono: data.telefono?.trim() || null,
				})
				.eq("id", data.perfilId);

			if (updateError) {
				if (cambioCorreo) {
					const admin = getSupabaseAdmin();
					await admin.auth.admin.updateUserById(data.perfilId, {
						email: correoAnterior,
						email_confirm: true,
					});
				}
				throw updateError;
			}

			const { error: vendedorError } = await supabase
				.from("vendedores")
				.update({
					comision_fija: data.comision,
					cargo: data.cargo?.trim() || "Agente comercial",
					zona_principal_id: zonaPrincipalId,
				})
				.eq("perfil_id", data.perfilId);

			if (vendedorError) throw vendedorError;
			return { ok: true };
		} catch (error) {
			console.warn(
				"[admin] Error al actualizar vendedor:",
				error instanceof Error ? error.message : error,
			);
			return {
				ok: false,
				error:
					error instanceof Error &&
					error.message.startsWith("No se pudo actualizar el correo")
						? error.message
						: mensajeDeError(error as { code?: string; message?: string }),
			};
		}
	});

export const darBajaVendedor = createServerFn({ method: "POST" })
	.validator(bajaSchema)
	.handler(async ({ data }): Promise<ResultadoOperacion> => {
		try {
			const { supabase } = await requireAdmin();

			const { error: perfilError } = await supabase
				.from("perfiles")
				.update({ activo: false })
				.eq("id", data.perfilId);

			if (perfilError) throw perfilError;

			const { error: vendedorError } = await supabase
				.from("vendedores")
				.update({ activo: false })
				.eq("perfil_id", data.perfilId);

			if (vendedorError) throw vendedorError;
			return { ok: true };
		} catch (error) {
			console.warn(
				"[admin] Error al dar de baja al vendedor:",
				error instanceof Error ? error.message : error,
			);
			return {
				ok: false,
				error: mensajeDeError(error as { code?: string; message?: string }),
			};
		}
	});
