/**
 * Tipos de dominio de RE/MAX Potosí.
 *
 * Mientras las pantallas siguen usando los mocks de `src/data/`, este archivo
 * reexporta sus tipos para no duplicar el modelo y añade los tipos derivados
 * de la base de datos. Cuando se conecten las pantallas, los tipos de `data/`
 * podrán moverse aquí sin cambiar la forma que consume la UI.
 */
export type {
	Alquiler,
	Cliente,
	EstadoCuenta,
	EstadoCuota,
	Inmueble,
	MedioPago,
	Pago,
	Proveedor,
	Rol,
	TipoInmueble,
	Usuario,
	Vendedor,
	Visita,
} from "@/data/types";

import type { Database } from "./database.types";

/** Roles tal como se guardan en PostgreSQL. */
export type RolDb = Database["public"]["Enums"]["rol_usuario"];
export type TipoInmuebleDb = Database["public"]["Enums"]["tipo_inmueble"];
export type EstadoInmuebleDb = Database["public"]["Enums"]["estado_inmueble"];
export type EstadoVisitaDb = Database["public"]["Enums"]["estado_visita"];
export type CanalVisitaDb = Database["public"]["Enums"]["canal_visita"];
export type EstadoAlquilerDb = Database["public"]["Enums"]["estado_alquiler"];
export type EstadoCuotaDb = Database["public"]["Enums"]["estado_cuota"];
export type MedioPagoDb = Database["public"]["Enums"]["medio_pago"];
export type EstadoComisionDb = Database["public"]["Enums"]["estado_comision"];

export type PerfilRow = Database["public"]["Tables"]["perfiles"]["Row"];
export type VendedorRow = Database["public"]["Tables"]["vendedores"]["Row"];
export type ClienteRow = Database["public"]["Tables"]["clientes"]["Row"];
export type InmuebleRow = Database["public"]["Tables"]["inmuebles"]["Row"];
export type AlquilerRow = Database["public"]["Tables"]["alquileres"]["Row"];
export type CuotaRow = Database["public"]["Tables"]["cuotas"]["Row"];
export type PagoRow = Database["public"]["Tables"]["pagos"]["Row"];

export type InmuebleCatalogo =
	Database["public"]["Views"]["v_inmuebles_catalogo"]["Row"];
export type ZonaConConteo =
	Database["public"]["Views"]["v_zonas_con_conteo"]["Row"];
export type CuotaEstado = Database["public"]["Views"]["v_cuotas_estado"]["Row"];
export type AlquilerDetalle =
	Database["public"]["Views"]["v_alquileres_detalle"]["Row"];
export type ComisionVendedor =
	Database["public"]["Views"]["v_comisiones_vendedor"]["Row"];
export type DashboardAdmin =
	Database["public"]["Views"]["v_dashboard_admin"]["Row"];
