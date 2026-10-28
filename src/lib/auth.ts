/**
 * Sesión autenticada compartida entre cliente y servidor.
 *
 * No confundir con `src/server/auth.ts`: aquí solo viven tipos y utilidades
 * puras (sin service role ni acceso a datos) para poder importarlas desde
 * componentes y guards.
 */
import type { Rol } from "@/types/models";

export type RolDb = "administrador" | "vendedor" | "cliente";

export interface SesionUsuario {
	id: string;
	nombres: string;
	apellidos: string;
	correo: string;
	telefono: string | null;
	rol: RolDb;
	activo: boolean;
	debeCambiarPassword: boolean;
	avatarUrl: string | null;
}

/** Etiqueta de presentación del rol (misma que usan los paneles). */
export const ETIQUETA_ROL: Record<RolDb, Rol> = {
	administrador: "Administrador",
	vendedor: "Vendedor",
	cliente: "Cliente",
};

export function etiquetaRol(rol: RolDb): Rol {
	return ETIQUETA_ROL[rol];
}

/** Nombre completo listo para mostrar en topbar, menú y avatares. */
export function nombreCompleto(sesion: SesionUsuario): string {
	return [sesion.nombres, sesion.apellidos].filter(Boolean).join(" ").trim();
}

/** Ruta de inicio de cada panel. */
export function rutaPanel(rol: RolDb): "/admin" | "/vendedor" | "/cliente" {
	if (rol === "administrador") return "/admin";
	if (rol === "vendedor") return "/vendedor";
	return "/cliente";
}

/**
 * Resultado serializable de las server functions de autenticación. Devolver
 * errores esperados (credenciales, correo duplicado) como dato evita que el
 * mensaje se pierda al cruzar la frontera servidor/cliente.
 */
export type ResultadoAuth<T = unknown> =
	| ({ ok: true } & T)
	| { ok: false; error: string };
