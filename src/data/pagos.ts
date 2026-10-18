import { alquileres } from "./alquileres";
import type { EstadoCuota, MedioPago, Pago } from "./types";

interface CuotaSpec {
	periodo: string; // "2026-08"
	venc: string; // ISO date
	estado: EstadoCuota;
	fechaPago?: string;
	medioPago?: MedioPago;
	recargo?: number;
	registradoPor?: string;
}

function makeCuotas(
	alquilerId: string,
	codigo: string,
	monto: number,
	specs: CuotaSpec[],
): Pago[] {
	return specs.map((spec, index) => {
		const numero = index + 1;
		const recargo = spec.recargo ?? 0;
		return {
			id: `${alquilerId}-cuota-${String(numero).padStart(2, "0")}`,
			alquilerId,
			numeroCuota: numero,
			periodo: spec.periodo,
			montoBase: monto,
			recargoMora: recargo,
			monto: monto + recargo,
			fechaVencimiento: spec.venc,
			fechaPago: spec.fechaPago ?? null,
			medioPago: spec.medioPago ?? null,
			estado: spec.estado,
			comprobante: spec.fechaPago
				? `comprobante-${codigo}-${numero}.pdf`
				: null,
			registradoPor: spec.fechaPago
				? (spec.registradoPor ?? "Carla Mendoza Vaca")
				: null,
		};
	});
}

const alquilerPorId = (id: string) => {
	const found = alquileres.find((a) => a.id === id);
	if (!found) throw new Error(`Alquiler no encontrado: ${id}`);
	return found;
};

const a1 = alquilerPorId("alq-001");
const a2 = alquilerPorId("alq-002");
const a3 = alquilerPorId("alq-003");
const a4 = alquilerPorId("alq-004");
const a5 = alquilerPorId("alq-005");
const a6 = alquilerPorId("alq-006");

/** Historial de pagos y cobros recurrentes (HU-09). 30 cuotas de ejemplo. */
export const pagos: Pago[] = [
	...makeCuotas(a1.id, a1.codigo, a1.montoMensual, [
		{
			periodo: "2026-08",
			venc: "2026-08-05",
			estado: "Pagada",
			fechaPago: "2026-08-04",
			medioPago: "Transferencia QR",
		},
		{
			periodo: "2026-09",
			venc: "2026-09-05",
			estado: "Pagada",
			fechaPago: "2026-09-03",
			medioPago: "Transferencia QR",
		},
		{
			periodo: "2026-10",
			venc: "2026-10-05",
			estado: "Pagada",
			fechaPago: "2026-10-06",
			medioPago: "Tarjeta de débito",
		},
		{ periodo: "2026-11", venc: "2026-11-05", estado: "Por vencer" },
	]),
	...makeCuotas(a2.id, a2.codigo, a2.montoMensual, [
		{
			periodo: "2026-09",
			venc: "2026-09-01",
			estado: "Pagada",
			fechaPago: "2026-09-01",
			medioPago: "Transferencia QR",
			registradoPor: "Marcelo Arce Gutiérrez",
		},
		{ periodo: "2026-10", venc: "2026-10-01", estado: "En mora", recargo: 190 },
		{ periodo: "2026-11", venc: "2026-11-01", estado: "Por vencer" },
	]),
	...makeCuotas(a3.id, a3.codigo, a3.montoMensual, [
		{
			periodo: "2026-08",
			venc: "2026-08-15",
			estado: "Pagada",
			fechaPago: "2026-08-14",
			medioPago: "Efectivo",
			registradoPor: "Jorge Villarroel Ríos",
		},
		{
			periodo: "2026-09",
			venc: "2026-09-15",
			estado: "Pagada",
			fechaPago: "2026-09-18",
			medioPago: "Transferencia QR",
			recargo: 60,
			registradoPor: "Jorge Villarroel Ríos",
		},
		{ periodo: "2026-10", venc: "2026-10-15", estado: "Por vencer" },
	]),
	...makeCuotas(a4.id, a4.codigo, a4.montoMensual, [
		{
			periodo: "2026-07",
			venc: "2026-07-01",
			estado: "Pagada",
			fechaPago: "2026-07-01",
			medioPago: "Transferencia QR",
			registradoPor: "Jorge Villarroel Ríos",
		},
		{
			periodo: "2026-08",
			venc: "2026-08-01",
			estado: "Pagada",
			fechaPago: "2026-07-30",
			medioPago: "Transferencia QR",
			registradoPor: "Jorge Villarroel Ríos",
		},
		{
			periodo: "2026-09",
			venc: "2026-09-01",
			estado: "Pagada",
			fechaPago: "2026-09-02",
			medioPago: "Tarjeta de crédito",
			registradoPor: "Jorge Villarroel Ríos",
		},
		{
			periodo: "2026-10",
			venc: "2026-10-01",
			estado: "Pagada",
			fechaPago: "2026-10-01",
			medioPago: "Transferencia QR",
			registradoPor: "Jorge Villarroel Ríos",
		},
		{ periodo: "2026-11", venc: "2026-11-01", estado: "Por vencer" },
	]),
	...makeCuotas(a5.id, a5.codigo, a5.montoMensual, [
		{
			periodo: "2025-11",
			venc: "2025-11-10",
			estado: "Pagada",
			fechaPago: "2025-11-09",
			medioPago: "Efectivo",
			registradoPor: "Natalia Quispe Fernández",
		},
		{
			periodo: "2025-12",
			venc: "2025-12-10",
			estado: "Pagada",
			fechaPago: "2025-12-08",
			medioPago: "Efectivo",
			registradoPor: "Natalia Quispe Fernández",
		},
		{
			periodo: "2026-01",
			venc: "2026-01-10",
			estado: "Pagada",
			fechaPago: "2026-01-10",
			medioPago: "Transferencia QR",
			registradoPor: "Natalia Quispe Fernández",
		},
		{
			periodo: "2026-02",
			venc: "2026-02-10",
			estado: "Pagada",
			fechaPago: "2026-02-11",
			medioPago: "Transferencia QR",
			registradoPor: "Natalia Quispe Fernández",
		},
		{
			periodo: "2026-03",
			venc: "2026-03-10",
			estado: "Pagada",
			fechaPago: "2026-03-09",
			medioPago: "Transferencia QR",
			registradoPor: "Natalia Quispe Fernández",
		},
		{
			periodo: "2026-04",
			venc: "2026-04-10",
			estado: "Pagada",
			fechaPago: "2026-04-10",
			medioPago: "Efectivo",
			registradoPor: "Natalia Quispe Fernández",
		},
		{
			periodo: "2026-05",
			venc: "2026-05-10",
			estado: "Pagada",
			fechaPago: "2026-05-12",
			medioPago: "Efectivo",
			recargo: 80,
			registradoPor: "Natalia Quispe Fernández",
		},
		{
			periodo: "2026-06",
			venc: "2026-06-10",
			estado: "Pagada",
			fechaPago: "2026-06-09",
			medioPago: "Transferencia QR",
			registradoPor: "Natalia Quispe Fernández",
		},
		{
			periodo: "2026-07",
			venc: "2026-07-10",
			estado: "Pagada",
			fechaPago: "2026-07-10",
			medioPago: "Transferencia QR",
			registradoPor: "Natalia Quispe Fernández",
		},
		{
			periodo: "2026-08",
			venc: "2026-08-10",
			estado: "Pagada",
			fechaPago: "2026-08-10",
			medioPago: "Transferencia QR",
			registradoPor: "Natalia Quispe Fernández",
		},
		{
			periodo: "2026-09",
			venc: "2026-09-10",
			estado: "Pagada",
			fechaPago: "2026-09-11",
			medioPago: "Efectivo",
			registradoPor: "Natalia Quispe Fernández",
		},
		{ periodo: "2026-10", venc: "2026-10-10", estado: "En mora", recargo: 130 },
	]),
	...makeCuotas(a6.id, a6.codigo, a6.montoMensual, [
		{
			periodo: "2026-06",
			venc: "2026-06-05",
			estado: "Pagada",
			fechaPago: "2026-06-04",
			medioPago: "Transferencia QR",
			registradoPor: "Carla Mendoza Vaca",
		},
		{
			periodo: "2026-07",
			venc: "2026-07-05",
			estado: "Pagada",
			fechaPago: "2026-07-05",
			medioPago: "Transferencia QR",
			registradoPor: "Carla Mendoza Vaca",
		},
		{
			periodo: "2026-08",
			venc: "2026-08-05",
			estado: "Pagada",
			fechaPago: "2026-08-03",
			medioPago: "Tarjeta de crédito",
			registradoPor: "Carla Mendoza Vaca",
		},
		{
			periodo: "2026-09",
			venc: "2026-09-05",
			estado: "Pagada",
			fechaPago: "2026-09-05",
			medioPago: "Transferencia QR",
			registradoPor: "Carla Mendoza Vaca",
		},
	]),
];
