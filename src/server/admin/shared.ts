/**
 * Utilidades compartidas de las server functions del panel administrador.
 *
 * ⚠️ SOLO SERVIDOR. La autorización se comprueba con el cliente de cookies y
 * RLS; la service role solo se usa en operaciones que Auth exige (alta de
 * usuarios o cambio de correo).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
	CANAL_DB_A_UI,
	ESTADO_INMUEBLE_DB_A_UI,
	ESTADO_VISITA_DB_A_UI,
	ROL_DB_A_UI,
	TIPO_DB_A_UI,
	TIPO_PROVEEDOR_DB_A_UI,
} from "@/lib/admin";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { ImagenInmuebleAdmin, InmuebleAdmin } from "@/types/admin";
import type { Database } from "@/types/database.types";
import type {
	ClienteRow,
	InmuebleCatalogo,
	PerfilRow,
	VendedorRow,
} from "@/types/domain";
import type { Cliente, Inmueble, Usuario, Vendedor } from "@/types/models";

export type ClienteDb = SupabaseClient<Database>;

const IMAGEN_FALLBACK =
	"https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1400&q=70";

/* ----------------------------- Autorización ----------------------------- */

export interface ActorAdmin {
	id: string;
	supabase: ClienteDb;
}

export async function requireAdmin(): Promise<ActorAdmin> {
	const supabase = getSupabaseServer();
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error || !user) {
		throw new Error("Tu sesión expiró. Vuelve a iniciar sesión.");
	}

	const { data: perfil, error: perfilError } = await supabase
		.from("perfiles")
		.select("rol, activo")
		.eq("id", user.id)
		.maybeSingle();

	if (perfilError) {
		throw new Error("No se pudo comprobar tu perfil de administrador.");
	}

	if (!perfil?.activo || perfil.rol !== "administrador") {
		throw new Error("Solo un administrador puede realizar esta acción.");
	}

	return { id: user.id, supabase };
}

/* ------------------------------ Errores --------------------------------- */

export function mensajeDeError(error: {
	code?: string;
	message?: string;
}): string {
	switch (error.code) {
		case "23505":
			return "Ya existe un registro con ese dato único (correo, código o franja).";
		case "23503":
			return "El registro relacionado ya no existe o no se puede eliminar porque tiene datos asociados.";
		case "23514":
			return "Los datos no cumplen una regla de negocio. Revisa los campos e inténtalo de nuevo.";
		case "23502":
			return "Falta un dato obligatorio. Completa el formulario.";
		case "22007":
			return "La fecha indicada no es válida.";
		case "22023":
			return "Un valor del formulario no es válido.";
		case "42501":
			return "No tienes permisos para realizar esta acción.";
		default:
			break;
	}

	const mensaje = error.message?.toLowerCase() ?? "";
	if (mensaje.includes("duplicate") || mensaje.includes("unique")) {
		return "Ya existe un registro con ese dato único.";
	}
	if (mensaje.includes("foreign key")) {
		return "El registro tiene datos asociados y no se puede eliminar.";
	}
	if (mensaje.includes("fetch") || mensaje.includes("network")) {
		return "No se pudo conectar con el servicio. Revisa tu conexión e inténtalo de nuevo.";
	}

	return "No se pudo completar la operación. Inténtalo de nuevo.";
}

/* ----------------------------- Fechas ----------------------------------- */

const FORMATEADOR_FECHA = new Intl.DateTimeFormat("en-CA", {
	timeZone: "America/La_Paz",
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});

/** Fecha YYYY-MM-DD en horario de Bolivia para un input date. */
export function fechaInputLaPaz(valor: string): string {
	const fecha = new Date(valor);
	if (Number.isNaN(fecha.getTime())) return "";
	return FORMATEADOR_FECHA.format(fecha);
}

/** Convierte el valor de un input date al instante de inicio del día en Bolivia. */
export function fechaDbDesdeInput(valor: string): string {
	return new Date(`${valor}T00:00:00-04:00`).toISOString();
}

/* ----------------------------- Inmuebles -------------------------------- */

function imagenesDesdeFila(fila: InmuebleCatalogo): ImagenInmuebleAdmin[] {
	const imagenes: ImagenInmuebleAdmin[] = [];

	if (Array.isArray(fila.imagenes)) {
		for (const item of fila.imagenes) {
			if (!item || typeof item !== "object" || !("id" in item)) continue;
			if (typeof item.id !== "string") continue;
			imagenes.push({
				id: item.id,
				path:
					"path" in item && typeof item.path === "string" ? item.path : null,
				url: "url" in item && typeof item.url === "string" ? item.url : null,
				alt: "alt" in item && typeof item.alt === "string" ? item.alt : null,
				orden:
					"orden" in item && typeof item.orden === "number" ? item.orden : 0,
				esPortada: "es_portada" in item && item.es_portada === true,
			});
		}
	}

	// La vista ya devuelve la portada; se asegura de que esté al inicio aunque
	// el jsonb de imágenes venga incompleto.
	if (fila.portada_url || fila.portada_path) {
		const existente = imagenes.find(
			(imagen) =>
				imagen.path === fila.portada_path || imagen.url === fila.portada_url,
		);
		if (!existente) {
			imagenes.unshift({
				// Sin id real no se puede editar la fila; el formulario la trata
				// como una portada heredada y el servidor la vuelve a insertar.
				id: "",
				path: fila.portada_path,
				url: fila.portada_url,
				alt: fila.portada_alt,
				orden: 0,
				esPortada: true,
			});
		}
	}

	return imagenes.sort(
		(a, b) => Number(b.esPortada) - Number(a.esPortada) || a.orden - b.orden,
	);
}

export function textosDesdeJson(valor: unknown): string[] {
	if (!Array.isArray(valor)) return [];
	return valor.filter((item): item is string => typeof item === "string");
}

export function aInmuebleAdmin(fila: InmuebleCatalogo): InmuebleAdmin {
	const imagenesDetalle = imagenesDesdeFila(fila);
	const urls = imagenesDetalle
		.map((imagen) => imagen.url)
		.filter((url): url is string => Boolean(url?.trim()));

	return {
		id: fila.id,
		codigo: fila.codigo,
		titulo: fila.titulo,
		tipo: TIPO_DB_A_UI[fila.tipo],
		estado: ESTADO_INMUEBLE_DB_A_UI[fila.estado],
		destacado: fila.destacado,
		precio: Number(fila.precio),
		zona: fila.zona_nombre?.trim() || "Potosí",
		direccion: fila.direccion,
		m2: Number(fila.m2),
		habitaciones: fila.habitaciones ?? 0,
		banos: fila.banos,
		estacionamientos: fila.estacionamientos,
		piso: fila.piso,
		descripcion: fila.descripcion,
		fechaDisponibilidad: fila.fecha_disponibilidad,
		costoPublicacion: Number(fila.costo_publicacion),
		imagenes: urls.length > 0 ? urls : [IMAGEN_FALLBACK],
		amenidades: textosDesdeJson(fila.caracteristicas),
		proveedorId: fila.proveedor_id,
		vendedorId: fila.agente_id,
		publicadoEl: fila.publicado_el,
		visitasMes: fila.visitas_mes,
		amoblado: fila.amoblado,
		zonaId: fila.zona_id,
		proveedorNombre: fila.proveedor_nombre?.trim() || null,
		agenteNombre: fila.agente_nombre?.trim() || null,
		imagenesDetalle,
	};
}

export async function resolverZonaId(
	supabase: ClienteDb,
	nombre: string,
): Promise<string> {
	const limpio = nombre.trim();
	if (!limpio) {
		throw new Error("Selecciona una zona para el inmueble.");
	}

	const { data, error } = await supabase
		.from("zonas")
		.select("id, activo")
		.eq("nombre", limpio)
		.order("activo", { ascending: false })
		.limit(1)
		.maybeSingle();

	if (error) throw error;
	if (!data) {
		throw new Error(`La zona «${limpio}» no existe en el catálogo.`);
	}

	return data.id;
}

export async function generarCodigoInmueble(
	supabase: ClienteDb,
): Promise<string> {
	const { data, error } = await supabase
		.from("inmuebles")
		.select("codigo")
		.like("codigo", "PT-%")
		.order("codigo", { ascending: false })
		.limit(1);

	if (error) throw error;

	const ultimo = data?.[0]?.codigo ?? "";
	const numero = Number.parseInt(ultimo.replace(/^PT-/, ""), 10);
	const siguiente =
		Number.isFinite(numero) && numero >= 1000 ? numero + 1 : 1001;
	return `PT-${String(siguiente).padStart(4, "0")}`;
}

/* --------------------------- Perfiles / personas ------------------------- */

export function nombrePerfil(perfil: PerfilRow): string {
	return [perfil.nombres, perfil.apellidos].filter(Boolean).join(" ").trim();
}

export function aUsuario(perfil: PerfilRow): Usuario {
	return {
		id: perfil.id,
		nombre: nombrePerfil(perfil) || perfil.correo,
		email: perfil.correo,
		telefono: perfil.telefono ?? "",
		rol: ROL_DB_A_UI[perfil.rol],
		estado: perfil.activo ? "Activo" : "Inactivo",
		avatarUrl: perfil.avatar_url ?? "",
		creadoEl: perfil.created_at,
	};
}

export function aVendedor(
	vendedor: VendedorRow,
	perfil: PerfilRow | undefined,
	zonaNombre: string,
	alquileresCerrados: number,
): Vendedor {
	const nombre = perfil ? nombrePerfil(perfil) : vendedor.perfil_id.slice(0, 8);

	return {
		id: vendedor.perfil_id,
		nombre: nombre || perfil?.correo || "Vendedor",
		email: perfil?.correo ?? "",
		telefono: perfil?.telefono ?? "",
		zona: zonaNombre,
		comisionFija: Number(vendedor.comision_fija),
		alquileresCerrados,
		estado: vendedor.activo && (perfil?.activo ?? true) ? "Activo" : "Inactivo",
		avatarUrl: perfil?.avatar_url ?? "",
		cargo: vendedor.cargo?.trim() || "Agente comercial",
		ingresoEl: vendedor.fecha_alta,
	};
}

export async function cargarVendedores(
	supabase: ClienteDb,
): Promise<Vendedor[]> {
	const [vendedoresResult, perfilesResult, zonasResult, alquileresResult] =
		await Promise.all([
			supabase.from("vendedores").select("*"),
			supabase.from("perfiles").select("*"),
			supabase.from("zonas").select("id, nombre"),
			supabase.from("alquileres").select("vendedor_id"),
		]);

	if (vendedoresResult.error) throw vendedoresResult.error;
	if (perfilesResult.error) throw perfilesResult.error;
	if (zonasResult.error) throw zonasResult.error;
	if (alquileresResult.error) throw alquileresResult.error;

	const perfiles = new Map((perfilesResult.data ?? []).map((p) => [p.id, p]));
	const zonas = new Map((zonasResult.data ?? []).map((z) => [z.id, z.nombre]));
	const conteo = new Map<string, number>();
	for (const alquiler of alquileresResult.data ?? []) {
		if (!alquiler.vendedor_id) continue;
		conteo.set(
			alquiler.vendedor_id,
			(conteo.get(alquiler.vendedor_id) ?? 0) + 1,
		);
	}

	return (vendedoresResult.data ?? [])
		.map((vendedor) =>
			aVendedor(
				vendedor,
				perfiles.get(vendedor.perfil_id),
				(zonas.get(vendedor.zona_principal_id ?? "") ?? "Sin asignar").trim(),
				conteo.get(vendedor.perfil_id) ?? 0,
			),
		)
		.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export async function cargarVendedor(
	supabase: ClienteDb,
	perfilId: string,
): Promise<Vendedor | null> {
	const todos = await cargarVendedores(supabase);
	return todos.find((vendedor) => vendedor.id === perfilId) ?? null;
}

/* -------------------------------- Visitas -------------------------------- */

export function aClienteDesdeVisita(
	visita: {
		id: string;
		cliente_id: string | null;
		nombre_contacto: string | null;
		telefono_contacto: string | null;
		correo_contacto: string | null;
		created_at: string;
	},
	perfil: PerfilRow | undefined,
): Cliente {
	const nombre =
		visita.nombre_contacto?.trim() ||
		(perfil ? nombrePerfil(perfil) : "") ||
		"Visitante sin cuenta";

	return {
		id: visita.cliente_id ?? `anon-${visita.id}`,
		nombre,
		email: visita.correo_contacto?.trim() || perfil?.correo || "",
		telefonoContacto:
			visita.telefono_contacto?.trim() || perfil?.telefono || "Sin registrar",
		estado: perfil ? (perfil.activo ? "Activo" : "Inactivo") : "Activo",
		avatarUrl: perfil?.avatar_url ?? "",
		desde: perfil?.created_at ?? visita.created_at,
	};
}

export function aVisitaEstado(
	estado: Database["public"]["Enums"]["estado_visita"],
) {
	return ESTADO_VISITA_DB_A_UI[estado];
}

export function aCanalVisita(
	canal: Database["public"]["Enums"]["canal_visita"],
) {
	return CANAL_DB_A_UI[canal];
}

/* ------------------------------ Proveedores ------------------------------ */

export function aProveedorTipo(
	tipo: Database["public"]["Enums"]["tipo_proveedor"],
) {
	return TIPO_PROVEEDOR_DB_A_UI[tipo];
}

/* ------------------------------ Alquileres ------------------------------- */

export function aInmuebleBase(fila: InmuebleCatalogo): Inmueble {
	return aInmuebleAdmin(fila);
}

export type { ClienteRow };
