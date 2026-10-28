/**
 * Tipos de dominio de RE/MAX Potosí.
 *
 * Reexporta el modelo de transporte de `src/types/models` y añade los tipos
 * derivados de la base de datos y de las funciones públicas.
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
} from "@/types/models";

import type { Database } from "./database.types";

/** Resumen público del agente asignado a un inmueble. */
export interface AgenteResumen {
	nombre: string;
	cargo: string;
	zona?: string | null;
	email?: string | null;
	telefono?: string | null;
	avatarUrl?: string | null;
}

/** Fila pública del equipo comercial que alimenta la landing. */
export interface AgentePublico {
	id: string;
	nombre: string;
	cargo: string;
	zona: string;
	telefono: string;
	avatarUrl: string;
	alquileresGestionados: number;
}

/** Aggregados de la landing calculados por `resumen_publico()`. */
export interface ResumenPublico {
	inmueblesDisponibles: number;
	agentesActivos: number;
	zonasActivas: number;
	contratosGestionados: number;
}

/** Roles tal como se guardan en PostgreSQL. */
export type RolDb = Database["public"]["Enums"]["rol_usuario"];
export type TipoInmuebleDb = Database["public"]["Enums"]["tipo_inmueble"];
export type EstadoInmuebleDb = Database["public"]["Enums"]["estado_inmueble"];
export type EstadoVisitaDb = Database["public"]["Enums"]["estado_visita"];
export type CanalVisitaDb = Database["public"]["Enums"]["canal_visita"];
export type TipoProveedorDb = Database["public"]["Enums"]["tipo_proveedor"];
export type EstadoAlquilerDb = Database["public"]["Enums"]["estado_alquiler"];
export type EstadoCuotaDb = Database["public"]["Enums"]["estado_cuota"];
export type MedioPagoDb = Database["public"]["Enums"]["medio_pago"];
export type EstadoComisionDb = Database["public"]["Enums"]["estado_comision"];
export type TipoNotificacionDb =
	Database["public"]["Enums"]["tipo_notificacion"];

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
