/**
 * Utilidades isomórficas del panel administrador: etiquetas de presentación y
 * el tipo de resultado de las server functions. No contiene acceso a datos.
 */

import type {
	EstadoInmuebleDb,
	EstadoVisitaDb,
	RolDb,
	TipoInmuebleDb,
	TipoProveedorDb,
} from "@/types/domain";
import type { Rol, VisitaEstado } from "@/types/models";

export type ResultadoOperacion<T = unknown> =
	| ({ ok: true } & T)
	| { ok: false; error: string };

export const ROL_DB_A_UI: Record<RolDb, Rol> = {
	administrador: "Administrador",
	vendedor: "Vendedor",
	cliente: "Cliente",
};

export const ROL_UI_A_DB: Record<Rol, RolDb> = {
	Administrador: "administrador",
	Vendedor: "vendedor",
	Cliente: "cliente",
};

export const TIPO_DB_A_UI: Record<
	TipoInmuebleDb,
	"Casa" | "Departamento" | "Local"
> = {
	casa: "Casa",
	departamento: "Departamento",
	local: "Local",
};

export const TIPO_UI_A_DB: Record<
	"Casa" | "Departamento" | "Local",
	TipoInmuebleDb
> = {
	Casa: "casa",
	Departamento: "departamento",
	Local: "local",
};

export const ESTADO_INMUEBLE_DB_A_UI: Record<
	EstadoInmuebleDb,
	"Disponible" | "Reservado" | "En alquiler" | "Inactivo"
> = {
	disponible: "Disponible",
	reservado: "Reservado",
	en_alquiler: "En alquiler",
	inactivo: "Inactivo",
};

export const ESTADO_INMUEBLE_UI_A_DB: Record<
	"Disponible" | "Reservado" | "En alquiler" | "Inactivo",
	EstadoInmuebleDb
> = {
	Disponible: "disponible",
	Reservado: "reservado",
	"En alquiler": "en_alquiler",
	Inactivo: "inactivo",
};

export const ESTADO_VISITA_DB_A_UI: Record<EstadoVisitaDb, VisitaEstado> = {
	pendiente: "Pendiente",
	realizada: "Realizada",
	cancelada: "Cancelada",
};

export const ESTADO_VISITA_UI_A_DB: Record<VisitaEstado, EstadoVisitaDb> = {
	Pendiente: "pendiente",
	Realizada: "realizada",
	Cancelada: "cancelada",
};

export const CANAL_DB_A_UI: Record<
	"web" | "telefono" | "presencial",
	"Web" | "Teléfono" | "Presencial"
> = {
	web: "Web",
	telefono: "Teléfono",
	presencial: "Presencial",
};

export const TIPO_PROVEEDOR_DB_A_UI: Record<
	TipoProveedorDb,
	"Persona" | "Empresa"
> = {
	persona: "Persona",
	empresa: "Empresa",
};

export const TIPO_PROVEEDOR_UI_A_DB: Record<
	"Persona" | "Empresa",
	TipoProveedorDb
> = {
	Persona: "persona",
	Empresa: "empresa",
};
