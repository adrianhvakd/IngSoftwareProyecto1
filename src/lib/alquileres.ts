/**
 * Mapeos isomórficos entre los enums de PostgreSQL y las etiquetas que usa la
 * interfaz de alquileres y cobros. No contiene acceso a datos.
 */

import type {
	EstadoAlquilerDb,
	EstadoComisionDb,
	MedioPagoDb,
} from "@/types/domain";
import type { AlquilerEstado, EstadoCuota, MedioPago } from "@/types/models";

export type EstadoComision = "Pendiente" | "Pagada" | "Anulada";

export const ESTADO_ALQUILER_DB_A_UI: Record<EstadoAlquilerDb, AlquilerEstado> =
	{
		vigente: "Vigente",
		finalizado: "Finalizado",
		suspendido: "Suspendido",
		cancelado: "Cancelado",
	};

export const MEDIO_PAGO_DB_A_UI: Record<MedioPagoDb, MedioPago> = {
	tarjeta: "Tarjeta de crédito",
	qr: "Transferencia QR",
	efectivo: "Efectivo",
	otro: "Otro",
};

export const MEDIO_PAGO_UI_A_DB: Record<MedioPago, MedioPagoDb> = {
	"Tarjeta de crédito": "tarjeta",
	"Tarjeta de débito": "tarjeta",
	"Transferencia QR": "qr",
	Efectivo: "efectivo",
	Otro: "otro",
};

export const ESTADO_COMISION_DB_A_UI: Record<EstadoComisionDb, EstadoComision> =
	{
		pendiente: "Pendiente",
		pagada: "Pagada",
		anulada: "Anulada",
	};

const ESTADOS_CUOTA: EstadoCuota[] = [
	"Al día",
	"Por vencer",
	"En mora",
	"Pagada",
	"Anulada",
];

/** Convierte el texto de `v_cuotas_estado.estado` al tipo de la UI. */
export function estadoCuotaDesdeVista(valor: string | null): EstadoCuota {
	return ESTADOS_CUOTA.includes(valor as EstadoCuota)
		? (valor as EstadoCuota)
		: "Al día";
}
