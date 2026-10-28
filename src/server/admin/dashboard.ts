/**
 * Dashboard del panel administrador.
 *
 * ⚠️ SOLO SERVIDOR. Los KPIs salen de `v_dashboard_admin`; las visitas, la
 * mora y los ingresos se leen de las tablas/vistas con la sesión del admin, de
 * modo que RLS sigue siendo la última barrera.
 */

import { createServerFn } from "@tanstack/react-start";
import type {
	AlertaCobroAdmin,
	DashboardAdmin,
	PuntoIngresoAdmin,
} from "@/types/admin";
import type { VisitaDetalle, VisitaEstado } from "@/types/models";
import {
	aCanalVisita,
	aClienteDesdeVisita,
	aInmuebleAdmin,
	aVisitaEstado,
	cargarVendedores,
	requireAdmin,
} from "./shared";

const ESTADOS_VISITA: VisitaEstado[] = ["Pendiente", "Realizada", "Cancelada"];

function periodoLaPaz(fecha: string): string {
	const partes = new Intl.DateTimeFormat("en-CA", {
		timeZone: "America/La_Paz",
		year: "numeric",
		month: "2-digit",
	}).formatToParts(new Date(fecha));

	const anio = partes.find((parte) => parte.type === "year")?.value;
	const mes = partes.find((parte) => parte.type === "month")?.value;
	return anio && mes ? `${anio}-${mes}` : fecha.slice(0, 7);
}

function ultimosOchoPeriodos(): string[] {
	const actual = periodoLaPaz(new Date().toISOString());
	const [anio, mes] = actual.split("-").map(Number);
	if (!anio || !mes) return [];

	const periodos: string[] = [];
	for (let i = 7; i >= 0; i -= 1) {
		const total = anio * 12 + (mes - 1) - i;
		const year = Math.floor(total / 12);
		const month = (total % 12) + 1;
		periodos.push(`${year}-${String(month).padStart(2, "0")}`);
	}
	return periodos;
}

function etiquetaMes(periodo: string): string {
	const [anio, mes] = periodo.split("-").map(Number);
	if (!anio || !mes) return periodo;
	const etiqueta = new Intl.DateTimeFormat("es-BO", {
		month: "short",
		timeZone: "UTC",
	}).format(new Date(Date.UTC(anio, mes - 1, 15)));
	return etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1).replace(".", "");
}

function resumenVacio() {
	return {
		inmueblesActivos: 0,
		visitasSemana: 0,
		alquileresVigentes: 0,
		cobrosDelMes: 0,
		cuotasEnMora: 0,
		moraTotal: 0,
		cuotasPorVencer: 0,
		morosidadPorcentaje: 0,
	};
}

function dashboardVacio(): DashboardAdmin {
	return {
		resumen: resumenVacio(),
		proximasVisitas: [],
		alertas: [],
		ingresos: [],
		visitasPorEstado: ESTADOS_VISITA.map((estado) => ({
			estado,
			cantidad: 0,
		})),
	};
}

export const obtenerDashboardAdmin = createServerFn({ method: "GET" }).handler(
	async (): Promise<DashboardAdmin> => {
		try {
			const { supabase } = await requireAdmin();
			const desde = new Date();
			desde.setMonth(desde.getMonth() - 8);
			const desdeIso = desde.toISOString();

			const [
				resumenResult,
				visitasResult,
				cuotasResult,
				estadosResult,
				pagosResult,
				comisionesResult,
				vendedores,
			] = await Promise.all([
				supabase.from("v_dashboard_admin").select("*").maybeSingle(),
				supabase
					.from("visitas")
					.select("*")
					.eq("estado", "pendiente")
					.gte("fecha_hora", new Date().toISOString())
					.order("fecha_hora", { ascending: true })
					.limit(5),
				supabase
					.from("v_cuotas_estado")
					.select("*")
					.in("estado_codigo", ["en_mora", "por_vencer"])
					.eq("alquiler_estado", "vigente")
					.order("dias_para_vencer", { ascending: true })
					.limit(5),
				supabase.from("visitas").select("estado"),
				supabase
					.from("pagos")
					.select("monto, fecha_pago")
					.gte("fecha_pago", desdeIso),
				supabase
					.from("comisiones")
					.select("monto, fecha")
					.gte("fecha", desdeIso),
				cargarVendedores(supabase),
			]);

			if (resumenResult.error) throw resumenResult.error;
			if (visitasResult.error) throw visitasResult.error;
			if (cuotasResult.error) throw cuotasResult.error;
			if (estadosResult.error) throw estadosResult.error;
			if (pagosResult.error) throw pagosResult.error;
			if (comisionesResult.error) throw comisionesResult.error;

			const resumen = resumenResult.data
				? {
						inmueblesActivos: resumenResult.data.inmuebles_activos,
						visitasSemana: resumenResult.data.visitas_semana,
						alquileresVigentes: resumenResult.data.alquileres_vigentes,
						cobrosDelMes: Number(resumenResult.data.cobros_del_mes),
						cuotasEnMora: resumenResult.data.cuotas_en_mora,
						moraTotal: Number(resumenResult.data.mora_total),
						cuotasPorVencer: resumenResult.data.cuotas_por_vencer,
						morosidadPorcentaje: Number(
							resumenResult.data.morosidad_porcentaje,
						),
					}
				: resumenVacio();

			const visitas = visitasResult.data ?? [];
			const inmuebleIds = [...new Set(visitas.map((v) => v.inmueble_id))];
			const clienteIds = [
				...new Set(
					visitas
						.map((v) => v.cliente_id)
						.filter((id): id is string => Boolean(id)),
				),
			];

			const [inmueblesResult, perfilesResult] = await Promise.all([
				inmuebleIds.length > 0
					? supabase
							.from("v_inmuebles_catalogo")
							.select("*")
							.in("id", inmuebleIds)
					: Promise.resolve({ data: [], error: null }),
				clienteIds.length > 0
					? supabase.from("perfiles").select("*").in("id", clienteIds)
					: Promise.resolve({ data: [], error: null }),
			]);

			if (inmueblesResult.error) throw inmueblesResult.error;
			if (perfilesResult.error) throw perfilesResult.error;

			const inmuebles = new Map(
				(inmueblesResult.data ?? []).map((fila) => [
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

			const proximasVisitas: VisitaDetalle[] = visitas
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

			const alertas: AlertaCobroAdmin[] = (cuotasResult.data ?? []).map(
				(cuota) => ({
					id: cuota.id,
					clienteNombre: cuota.cliente_nombre?.trim() || "Cliente",
					inmuebleCodigo: cuota.inmueble_codigo,
					estado: cuota.estado === "En mora" ? "En mora" : "Por vencer",
					monto: Number(cuota.monto_total),
					fechaVencimiento: cuota.fecha_vencimiento,
				}),
			);

			const conteoEstados = new Map<VisitaEstado, number>();
			for (const visita of estadosResult.data ?? []) {
				const estado = aVisitaEstado(visita.estado);
				conteoEstados.set(estado, (conteoEstados.get(estado) ?? 0) + 1);
			}

			const periodos = ultimosOchoPeriodos();
			const cobradoPorPeriodo = new Map<string, number>();
			for (const pago of pagosResult.data ?? []) {
				const periodo = periodoLaPaz(pago.fecha_pago);
				cobradoPorPeriodo.set(
					periodo,
					(cobradoPorPeriodo.get(periodo) ?? 0) + Number(pago.monto),
				);
			}

			const comisionesPorPeriodo = new Map<string, number>();
			for (const comision of comisionesResult.data ?? []) {
				const periodo = periodoLaPaz(comision.fecha);
				comisionesPorPeriodo.set(
					periodo,
					(comisionesPorPeriodo.get(periodo) ?? 0) + Number(comision.monto),
				);
			}

			const ingresos: PuntoIngresoAdmin[] = periodos.map((periodo) => ({
				mes: etiquetaMes(periodo),
				cobrado: Math.round(cobradoPorPeriodo.get(periodo) ?? 0),
				comisiones: Math.round(comisionesPorPeriodo.get(periodo) ?? 0),
			}));

			return {
				resumen,
				proximasVisitas,
				alertas,
				ingresos,
				visitasPorEstado: ESTADOS_VISITA.map((estado) => ({
					estado,
					cantidad: conteoEstados.get(estado) ?? 0,
				})),
			};
		} catch (error) {
			console.warn(
				"[admin] No se pudo cargar el dashboard:",
				error instanceof Error ? error.message : error,
			);
			return dashboardVacio();
		}
	},
);
