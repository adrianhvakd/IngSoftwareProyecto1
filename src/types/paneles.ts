/**
 * Tipos de transporte de los paneles de vendedor y cliente.
 */
import type { AlquilerDetalleVista, ComisionVista } from "@/types/alquileres";
import type { TipoNotificacionDb } from "@/types/domain";
import type { Vendedor, VisitaDetalle } from "@/types/models";

export interface CobrosMesVendedor {
	total: number;
	cantidad: number;
}

export interface DatosPanelVendedor {
	ahora: string;
	vendedor: Vendedor | null;
	visitas: VisitaDetalle[];
	alquileres: AlquilerDetalleVista[];
	comisiones: ComisionVista[];
	comisionFija: number;
	cobrosMes: CobrosMesVendedor;
}

export interface DatosVisitasVendedor {
	ahora: string;
	visitas: VisitaDetalle[];
}

export interface DatosVisitasCliente {
	visitas: VisitaDetalle[];
}

export interface NotificacionVista {
	id: string;
	tipo: TipoNotificacionDb;
	titulo: string;
	mensaje: string;
	leida: boolean;
	referencia: string | null;
	creadaEl: string;
}
