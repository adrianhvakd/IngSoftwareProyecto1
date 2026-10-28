/**
 * Tipos de transporte de las pantallas de alquileres y cobros (Fase 4).
 *
 * Reutilizan el modelo de `src/types/models` para conservar el diseño actual y
 * añaden los datos que solo existen en Supabase (URLs firmadas, estado de
 * comisión y opciones del wizard de cierre).
 */

import type { EstadoComision } from "@/lib/alquileres";
import type { InmuebleAdmin } from "@/types/admin";
import type { AlquilerDetalleUI, Cliente, Vendedor } from "@/types/models";

export interface AlquilerDetalleVista extends AlquilerDetalleUI {
	/** URL firmada del contrato en el bucket privado `contratos`. */
	contratoUrl: string | null;
}

export interface OpcionesCierre {
	clientes: Cliente[];
	inmuebles: InmuebleAdmin[];
	vendedores: Vendedor[];
	vendedorActual: Vendedor | null;
	comisionInicial: number;
}

export interface ComisionVista {
	id: string;
	alquilerId: string;
	codigo: string;
	inmuebleCodigo: string;
	inmuebleTitulo: string;
	clienteNombre: string;
	monto: number;
	fecha: string;
	estado: EstadoComision;
}

export interface DatosComisionesVendedor {
	comisiones: ComisionVista[];
	comisionFija: number;
}

export interface ResumenAlquileresAdmin {
	alquileresVigentes: number;
	cobrosDelMes: number;
	cuotasEnMora: number;
	moraTotal: number;
	morosidadPorcentaje: number;
	totalContratos: number;
}

export interface DatosAlquileresAdmin {
	alquileres: AlquilerDetalleVista[];
	resumen: ResumenAlquileresAdmin;
}
