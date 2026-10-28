/**
 * Visitas del panel administrador.
 *
 * ⚠️ SOLO SERVIDOR. El administrador puede asignar vendedor y cambiar el estado
 * de una visita. Las políticas RLS de `visitas` y los triggers de la base
 * validan que el vendedor siga activo y que el estado sea válido.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ResultadoOperacion } from "@/lib/admin";
import type { DatosVisitasAdmin } from "@/types/admin";
import type { InmuebleCatalogo } from "@/types/domain";
import type { Vendedor, VisitaDetalle } from "@/types/models";
import {
	aCanalVisita,
	aClienteDesdeVisita,
	aInmuebleAdmin,
	aVisitaEstado,
	cargarVendedores,
	mensajeDeError,
	requireAdmin,
} from "./shared";

const asignarSchema = z.object({
	visitaId: z.string().uuid(),
	vendedorId: z.string().uuid().nullable(),
});

const estadoSchema = z.object({
	visitaId: z.string().uuid(),
	estado: z.enum(["pendiente", "realizada", "cancelada"]),
});

export const listarVisitasAdmin = createServerFn({
	method: "GET",
}).handler(async (): Promise<DatosVisitasAdmin> => {
	try {
		const { supabase } = await requireAdmin();
		const [visitasResult, inmueblesResult, vendedores] = await Promise.all([
			supabase
				.from("visitas")
				.select("*")
				.order("fecha_hora", { ascending: true }),
			supabase.from("v_inmuebles_catalogo").select("*"),
			cargarVendedores(supabase),
		]);

		if (visitasResult.error) throw visitasResult.error;
		if (inmueblesResult.error) throw inmueblesResult.error;

		const visitas = visitasResult.data ?? [];
		const clienteIds = [
			...new Set(
				visitas
					.map((visita) => visita.cliente_id)
					.filter((id): id is string => Boolean(id)),
			),
		];

		const perfilesResult =
			clienteIds.length > 0
				? await supabase.from("perfiles").select("*").in("id", clienteIds)
				: { data: [], error: null };

		if (perfilesResult.error) throw perfilesResult.error;

		const inmuebles = new Map(
			(inmueblesResult.data ?? []).map((fila: InmuebleCatalogo) => [
				fila.id,
				aInmuebleAdmin(fila),
			]),
		);
		const perfiles = new Map(
			(perfilesResult.data ?? []).map((perfil) => [perfil.id, perfil]),
		);
		const vendedoresPorId = new Map(
			vendedores.map((vendedor: Vendedor) => [vendedor.id, vendedor]),
		);

		const detalle: VisitaDetalle[] = visitas
			.map((visita): VisitaDetalle | null => {
				const inmueble = inmuebles.get(visita.inmueble_id);
				if (!inmueble) return null;

				return {
					id: visita.id,
					clienteId: visita.cliente_id ?? `anon-${visita.id}`,
					inmuebleId: visita.inmueble_id,
					vendedorId: visita.vendedor_id,
					fechaHora: visita.fecha_hora,
					estado: aVisitaEstado(visita.estado),
					canal: aCanalVisita(visita.canal),
					notas: visita.notas,
					cliente: aClienteDesdeVisita(
						visita,
						visita.cliente_id ? perfiles.get(visita.cliente_id) : undefined,
					),
					inmueble,
					vendedor: visita.vendedor_id
						? vendedoresPorId.get(visita.vendedor_id)
						: undefined,
				};
			})
			.filter((visita): visita is VisitaDetalle => visita !== null);

		return { visitas: detalle, vendedores };
	} catch (error) {
		console.warn(
			"[admin] No se pudieron cargar las visitas:",
			error instanceof Error ? error.message : error,
		);
		return { visitas: [], vendedores: [] };
	}
});

export const asignarVendedorVisita = createServerFn({ method: "POST" })
	.validator(asignarSchema)
	.handler(async ({ data }): Promise<ResultadoOperacion> => {
		try {
			const { supabase } = await requireAdmin();
			const { error } = await supabase
				.from("visitas")
				.update({ vendedor_id: data.vendedorId })
				.eq("id", data.visitaId);

			if (error) throw error;
			return { ok: true };
		} catch (error) {
			console.warn(
				"[admin] Error al asignar vendedor:",
				error instanceof Error ? error.message : error,
			);
			return {
				ok: false,
				error: mensajeDeError(error as { code?: string; message?: string }),
			};
		}
	});

export const cambiarEstadoVisita = createServerFn({ method: "POST" })
	.validator(estadoSchema)
	.handler(async ({ data }): Promise<ResultadoOperacion> => {
		try {
			const { supabase } = await requireAdmin();
			const { error } = await supabase
				.from("visitas")
				.update({ estado: data.estado })
				.eq("id", data.visitaId);

			if (error) throw error;
			return { ok: true };
		} catch (error) {
			console.warn(
				"[admin] Error al cambiar estado de visita:",
				error instanceof Error ? error.message : error,
			);
			return {
				ok: false,
				error: mensajeDeError(error as { code?: string; message?: string }),
			};
		}
	});
