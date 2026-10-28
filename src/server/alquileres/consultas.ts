/**
 * Lecturas de alquileres, cuotas y comisiones para los tres paneles.
 *
 * ⚠️ SOLO SERVIDOR. La vista `v_alquileres_detalle` y el RLS limitan las filas
 * de cada actor; además se filtra explícitamente por vendedor/cliente.
 */

import { createServerFn } from "@tanstack/react-start";
import type {
	DatosAlquileresAdmin,
	DatosComisionesVendedor,
} from "@/types/alquileres";
import { aComisionVista, cargarAlquileres, requireActor } from "./shared";

export const listarAlquileresAdmin = createServerFn({ method: "GET" }).handler(
	async (): Promise<DatosAlquileresAdmin> => {
		const actor = await requireActor();
		const { supabase } = actor;

		if (actor.rol !== "administrador") {
			throw new Error("Solo un administrador puede ver todos los alquileres.");
		}

		const [alquileres, dashboardResult] = await Promise.all([
			cargarAlquileres(supabase),
			supabase.from("v_dashboard_admin").select("*").maybeSingle(),
		]);

		if (dashboardResult.error) {
			console.warn(
				"[alquileres] No se pudo leer el resumen del dashboard:",
				dashboardResult.error.message,
			);
		}

		const dashboard = dashboardResult.data;
		const enMora = alquileres.reduce(
			(total, alquiler) =>
				total +
				alquiler.pagos.filter((pago) => pago.estado === "En mora").length,
			0,
		);
		const moraTotal = alquileres.reduce(
			(total, alquiler) =>
				total +
				alquiler.pagos
					.filter((pago) => pago.estado === "En mora")
					.reduce((suma, pago) => suma + pago.monto, 0),
			0,
		);

		return {
			alquileres,
			resumen: {
				alquileresVigentes:
					dashboard?.alquileres_vigentes ??
					alquileres.filter((alquiler) => alquiler.estado === "Vigente").length,
				cobrosDelMes: Number(dashboard?.cobros_del_mes ?? 0),
				cuotasEnMora: dashboard?.cuotas_en_mora ?? enMora,
				moraTotal: Number(dashboard?.mora_total ?? moraTotal),
				morosidadPorcentaje: dashboard?.morosidad_porcentaje ?? 0,
				totalContratos: alquileres.length,
			},
		};
	},
);

export const listarAlquileresVendedor = createServerFn({
	method: "GET",
}).handler(async () => {
	const actor = await requireActor();

	if (actor.rol !== "vendedor") {
		throw new Error("Solo un vendedor puede ver sus alquileres.");
	}

	return cargarAlquileres(actor.supabase, { vendedorId: actor.id });
});

export const listarAlquileresCliente = createServerFn({
	method: "GET",
}).handler(async () => {
	const actor = await requireActor();

	if (actor.rol !== "cliente") {
		throw new Error("Solo un cliente puede ver sus alquileres.");
	}

	return cargarAlquileres(actor.supabase, { clienteId: actor.id });
});

export const listarComisionesVendedor = createServerFn({
	method: "GET",
}).handler(async (): Promise<DatosComisionesVendedor> => {
	const actor = await requireActor();

	if (actor.rol !== "vendedor") {
		throw new Error("Solo un vendedor puede ver sus comisiones.");
	}

	const [comisionesResult, vendedorResult] = await Promise.all([
		actor.supabase
			.from("v_comisiones_vendedor")
			.select("*")
			.eq("vendedor_id", actor.id)
			.order("fecha", { ascending: false }),
		actor.supabase
			.from("vendedores")
			.select("comision_fija")
			.eq("perfil_id", actor.id)
			.maybeSingle(),
	]);

	if (comisionesResult.error) throw comisionesResult.error;
	if (vendedorResult.error) throw vendedorResult.error;

	return {
		comisiones: (comisionesResult.data ?? []).map(aComisionVista),
		comisionFija: Number(vendedorResult.data?.comision_fija ?? 0),
	};
});
