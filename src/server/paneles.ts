/**
 * Datos reales de los paneles de vendedor y cliente.
 *
 * ⚠️ SOLO SERVIDOR. Todas las consultas usan el cliente de cookies con RLS.
 * La autorización por rol se vuelve a comprobar en cada server function para
 * que un cliente no pueda pedir, por ejemplo, el resumen de un vendedor.
 *
 * Los estados de visita se actualizan con UPDATE directo porque la política
 * `visitas_actualizacion` y el trigger `visitas_proteger_campos` (0009) limitan
 * exactamente qué campos y transiciones puede tocar cada rol.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ResultadoOperacion } from "@/lib/admin";
import {
	aCanalVisita,
	aClienteDesdeVisita,
	aInmuebleAdmin,
	aVisitaEstado,
	cargarVendedores,
} from "@/server/admin/shared";
import {
	aComisionVista,
	cargarAlquileres,
	mensajeDeErrorRpc,
	requireActor,
} from "@/server/alquileres/shared";
import type { ComisionVista } from "@/types/alquileres";
import type { Database } from "@/types/database.types";
import type { InmuebleCatalogo, RolDb } from "@/types/domain";
import type { Cliente, Vendedor, VisitaDetalle } from "@/types/models";
import type {
	DatosPanelVendedor,
	DatosVisitasCliente,
	DatosVisitasVendedor,
	NotificacionVista,
} from "@/types/paneles";

type ClienteDb = SupabaseClient<Database>;
type FiltroVisitas =
	| { columna: "vendedor_id"; id: string }
	| { columna: "cliente_id"; id: string };

/* ------------------------------ Utilidades ------------------------------- */

function vendedorPlaceholder(
	id: string,
	nombre: string,
	inmueble: { zona: string },
): Vendedor {
	return {
		id,
		nombre: nombre.trim() || "Agente RE/MAX",
		email: "",
		telefono: "",
		zona: inmueble.zona,
		comisionFija: 0,
		alquileresCerrados: 0,
		estado: "Activo",
		avatarUrl: "",
		cargo: "Agente comercial",
		ingresoEl: "",
	};
}

async function cargarVisitas(
	supabase: ClienteDb,
	filtro: FiltroVisitas,
): Promise<VisitaDetalle[]> {
	const [visitasResult, inmueblesResult, vendedores] = await Promise.all([
		supabase
			.from("visitas")
			.select("*")
			.eq(filtro.columna, filtro.id)
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
		vendedores.map((vendedor) => [vendedor.id, vendedor]),
	);

	return visitas
		.map((visita): VisitaDetalle | null => {
			const inmueble = inmuebles.get(visita.inmueble_id);
			if (!inmueble) return null;

			const perfil = visita.cliente_id
				? perfiles.get(visita.cliente_id)
				: undefined;
			const cliente: Cliente = aClienteDesdeVisita(visita, perfil);
			const vendedor =
				(visita.vendedor_id
					? vendedoresPorId.get(visita.vendedor_id)
					: undefined) ??
				(visita.vendedor_id
					? vendedorPlaceholder(
							visita.vendedor_id,
							inmueble.agenteNombre ?? "",
							inmueble,
						)
					: undefined);

			return {
				id: visita.id,
				clienteId: visita.cliente_id ?? `anon-${visita.id}`,
				inmuebleId: visita.inmueble_id,
				vendedorId: visita.vendedor_id,
				fechaHora: visita.fecha_hora,
				estado: aVisitaEstado(visita.estado),
				canal: aCanalVisita(visita.canal),
				notas: visita.notas,
				cliente,
				inmueble,
				vendedor,
			};
		})
		.filter((visita): visita is VisitaDetalle => visita !== null);
}

function rangoMesActual(): { inicio: string; fin: string } {
	const formateador = new Intl.DateTimeFormat("en-CA", {
		timeZone: "America/La_Paz",
		year: "numeric",
		month: "2-digit",
	});
	const partes = formateador.format(new Date()).split("-");
	const anio = Number(partes[0]);
	const mes = Number(partes[1]);
	const siguienteAnio = mes === 12 ? anio + 1 : anio;
	const siguienteMes = mes === 12 ? 1 : mes + 1;
	const dos = (valor: number) => String(valor).padStart(2, "0");

	return {
		inicio: new Date(`${anio}-${dos(mes)}-01T00:00:00-04:00`).toISOString(),
		fin: new Date(
			`${siguienteAnio}-${dos(siguienteMes)}-01T00:00:00-04:00`,
		).toISOString(),
	};
}

/* --------------------------- Panel del vendedor -------------------------- */

export const listarPanelVendedor = createServerFn({ method: "GET" }).handler(
	async (): Promise<DatosPanelVendedor> => {
		const actor = await requireActor();

		if (actor.rol !== "vendedor") {
			throw new Error("Solo un vendedor puede ver este resumen.");
		}

		const { inicio, fin } = rangoMesActual();
		const [visitas, alquileres, comisionesResult, vendedor, pagosResult] =
			await Promise.all([
				cargarVisitas(actor.supabase, {
					columna: "vendedor_id",
					id: actor.id,
				}),
				cargarAlquileres(actor.supabase, { vendedorId: actor.id }),
				actor.supabase
					.from("v_comisiones_vendedor")
					.select("*")
					.eq("vendedor_id", actor.id)
					.order("fecha", { ascending: false }),
				cargarVendedores(actor.supabase).then(
					(lista) => lista.find((item) => item.id === actor.id) ?? null,
				),
				actor.supabase
					.from("pagos")
					.select("monto")
					.eq("registrado_por", actor.id)
					.gte("fecha_pago", inicio)
					.lt("fecha_pago", fin),
			]);

		if (comisionesResult.error) throw comisionesResult.error;
		if (pagosResult.error) throw pagosResult.error;

		const comisiones: ComisionVista[] = (comisionesResult.data ?? []).map(
			aComisionVista,
		);
		const cobrosMes = (pagosResult.data ?? []).reduce(
			(total, pago) => total + Number(pago.monto),
			0,
		);

		return {
			ahora: new Date().toISOString(),
			vendedor,
			visitas,
			alquileres,
			comisiones,
			comisionFija: vendedor?.comisionFija ?? 0,
			cobrosMes: {
				total: cobrosMes,
				cantidad: (pagosResult.data ?? []).length,
			},
		};
	},
);

export const listarVisitasVendedor = createServerFn({
	method: "GET",
}).handler(async (): Promise<DatosVisitasVendedor> => {
	const actor = await requireActor();

	if (actor.rol !== "vendedor") {
		throw new Error("Solo un vendedor puede ver sus visitas.");
	}

	return {
		ahora: new Date().toISOString(),
		visitas: await cargarVisitas(actor.supabase, {
			columna: "vendedor_id",
			id: actor.id,
		}),
	};
});

/* ---------------------------- Panel del cliente -------------------------- */

export const listarVisitasCliente = createServerFn({ method: "GET" }).handler(
	async (): Promise<DatosVisitasCliente> => {
		const actor = await requireActor();

		if (actor.rol !== "cliente") {
			throw new Error("Solo un cliente puede ver sus visitas.");
		}

		return {
			visitas: await cargarVisitas(actor.supabase, {
				columna: "cliente_id",
				id: actor.id,
			}),
		};
	},
);

/* --------------------------- Cambio de estado ---------------------------- */

const estadoVisitaSchema = z.object({
	visitaId: z.string().uuid(),
	estado: z.enum(["pendiente", "realizada", "cancelada"]),
});

const ROLES: Record<RolDb, true> = {
	administrador: true,
	vendedor: true,
	cliente: true,
};

export const cambiarEstadoVisitaActor = createServerFn({ method: "POST" })
	.validator(estadoVisitaSchema)
	.handler(async ({ data }): Promise<ResultadoOperacion> => {
		try {
			const actor = await requireActor();
			if (!ROLES[actor.rol]) {
				return {
					ok: false,
					error: "No tienes un rol válido para esta acción.",
				};
			}

			const { data: visita, error } = await actor.supabase
				.from("visitas")
				.select("id, estado, cliente_id, vendedor_id")
				.eq("id", data.visitaId)
				.maybeSingle();

			if (error) throw error;
			if (!visita) {
				return {
					ok: false,
					error: "La visita ya no existe o no tienes acceso.",
				};
			}
			if (visita.estado !== "pendiente") {
				return {
					ok: false,
					error: "Solo se pueden modificar visitas pendientes.",
				};
			}

			if (actor.rol === "cliente") {
				if (visita.cliente_id !== actor.id || data.estado !== "cancelada") {
					return {
						ok: false,
						error: "Solo puedes cancelar tus propias visitas pendientes.",
					};
				}
			} else if (actor.rol === "vendedor") {
				if (
					visita.vendedor_id !== actor.id ||
					!(["realizada", "cancelada"] as const).includes(
						data.estado as "realizada" | "cancelada",
					)
				) {
					return {
						ok: false,
						error: "Solo puedes confirmar o cancelar tus visitas asignadas.",
					};
				}
			} else {
				return {
					ok: false,
					error: "Usa la agenda administrativa para cambiar visitas.",
				};
			}

			const { error: updateError } = await actor.supabase
				.from("visitas")
				.update({ estado: data.estado })
				.eq("id", data.visitaId);

			if (updateError) throw updateError;
			return { ok: true };
		} catch (error) {
			console.warn(
				"[paneles] No se pudo cambiar el estado de la visita:",
				error instanceof Error ? error.message : error,
			);
			return {
				ok: false,
				error: mensajeDeErrorRpc(error as { code?: string; message?: string }),
			};
		}
	});

/* ------------------------------ Notificaciones --------------------------- */

export const listarNotificaciones = createServerFn({
	method: "GET",
}).handler(async (): Promise<NotificacionVista[]> => {
	try {
		const actor = await requireActor();
		const { data, error } = await actor.supabase
			.from("notificaciones")
			.select("id, tipo, titulo, mensaje, leida, referencia, created_at")
			.eq("perfil_id", actor.id)
			.order("created_at", { ascending: false })
			.limit(20);

		if (error) throw error;

		return (data ?? []).map((fila) => ({
			id: fila.id,
			tipo: fila.tipo,
			titulo: fila.titulo,
			mensaje: fila.mensaje,
			leida: fila.leida,
			referencia: fila.referencia,
			creadaEl: fila.created_at,
		}));
	} catch (error) {
		console.warn(
			"[paneles] No se pudieron cargar las notificaciones:",
			error instanceof Error ? error.message : error,
		);
		return [];
	}
});

export const marcarNotificacionesLeidas = createServerFn({
	method: "POST",
}).handler(async (): Promise<ResultadoOperacion> => {
	try {
		const actor = await requireActor();
		const { error } = await actor.supabase
			.from("notificaciones")
			.update({ leida: true })
			.eq("perfil_id", actor.id)
			.eq("leida", false);

		if (error) throw error;
		return { ok: true };
	} catch (error) {
		console.warn(
			"[paneles] No se pudieron marcar las notificaciones:",
			error instanceof Error ? error.message : error,
		);
		return {
			ok: false,
			error: mensajeDeErrorRpc(error as { code?: string; message?: string }),
		};
	}
});
