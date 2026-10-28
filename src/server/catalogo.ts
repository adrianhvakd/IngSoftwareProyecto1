/**
 * Lectura pública del catálogo de inmuebles.
 *
 * ⚠️ SOLO SERVIDOR. Usa el cliente de `src/lib/supabase/server.ts` con la
 * clave publicable y las cookies de la petición: RLS decide qué filas ve cada
 * visitante. Las pantallas públicas solo muestran inmuebles `disponible`, así
 * que el filtro se repite aquí aunque quien consulte sea un administrador.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { OrdenCatalogo, ZonaOpcion } from "@/lib/catalog";
import { getSupabaseServer } from "@/lib/supabase/server";
import type {
	AgentePublico,
	EstadoInmuebleDb,
	InmuebleCatalogo,
	ResumenPublico,
	TipoInmuebleDb,
} from "@/types/domain";
import type { Inmueble, TipoInmueble } from "@/types/models";

const POR_PAGINA = 6;

const IMAGEN_FALLBACK =
	"https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1400&q=70";

const TIPO_DB: Record<TipoInmueble, TipoInmuebleDb> = {
	Casa: "casa",
	Departamento: "departamento",
	Local: "local",
};

const TIPO_DESDE_DB: Record<TipoInmuebleDb, TipoInmueble> = {
	casa: "Casa",
	departamento: "Departamento",
	local: "Local",
};

const ESTADO_DESDE_DB: Record<EstadoInmuebleDb, Inmueble["estado"]> = {
	disponible: "Disponible",
	reservado: "Reservado",
	en_alquiler: "En alquiler",
	inactivo: "Inactivo",
};

const ORDENES: OrdenCatalogo[] = [
	"relevancia",
	"precio-asc",
	"precio-desc",
	"recientes",
	"mayor-superficie",
];

/* --------------------------- Mapeo de la vista --------------------------- */

function textosDesdeJson(valor: unknown): string[] {
	if (!Array.isArray(valor)) return [];
	return valor.filter((item): item is string => typeof item === "string");
}

function imagenesDesdeFila(fila: InmuebleCatalogo): string[] {
	const urls: string[] = [];

	if (Array.isArray(fila.imagenes)) {
		for (const item of fila.imagenes) {
			if (typeof item === "string") {
				urls.push(item);
				continue;
			}
			if (
				item &&
				typeof item === "object" &&
				"url" in item &&
				typeof item.url === "string"
			) {
				urls.push(item.url);
			}
		}
	}

	if (fila.portada_url) urls.unshift(fila.portada_url);

	const unicas = [...new Set(urls.filter((url) => url.trim() !== ""))];
	return unicas.length > 0 ? unicas : [IMAGEN_FALLBACK];
}

function aInmueble(fila: InmuebleCatalogo): Inmueble {
	return {
		id: fila.id,
		codigo: fila.codigo,
		titulo: fila.titulo,
		tipo: TIPO_DESDE_DB[fila.tipo],
		estado: ESTADO_DESDE_DB[fila.estado],
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
		imagenes: imagenesDesdeFila(fila),
		amenidades: textosDesdeJson(fila.caracteristicas),
		proveedorId: fila.proveedor_id,
		vendedorId: fila.agente_id,
		publicadoEl: fila.publicado_el,
		visitasMes: fila.visitas_mes,
		amoblado: fila.amoblado,
	};
}

/* -------------------------------- Zonas --------------------------------- */

async function consultarZonas(): Promise<ZonaOpcion[]> {
	const supabase = getSupabaseServer();
	const { data, error } = await supabase
		.from("v_zonas_con_conteo")
		.select("nombre, sector, disponibles, activo")
		.eq("activo", true)
		.order("sector", { ascending: true })
		.order("nombre", { ascending: true });

	if (error) throw error;

	return (data ?? []).map((zona) => ({
		nombre: zona.nombre,
		sector: zona.sector?.trim() || "Otras zonas",
		total: zona.disponibles ?? 0,
	}));
}

export const listarZonas = createServerFn({ method: "GET" }).handler(
	async (): Promise<ZonaOpcion[]> => {
		try {
			return await consultarZonas();
		} catch (error) {
			console.warn(
				"[catalogo] No se pudieron cargar las zonas:",
				error instanceof Error ? error.message : error,
			);
			return [];
		}
	},
);

/* ------------------------------ Inicio ---------------------------------- */

export interface ResumenInicio {
	destacados: Inmueble[];
	zonas: ZonaOpcion[];
	agentes: AgentePublico[];
	totalPorTipo: Record<TipoInmueble, number>;
	totalDisponibles: number;
	metricas: ResumenPublico;
}

const RESUMEN_PUBLICO_VACIO: ResumenPublico = {
	inmueblesDisponibles: 0,
	agentesActivos: 0,
	zonasActivas: 0,
	contratosGestionados: 0,
};

async function consultarAgentesPublicos(): Promise<AgentePublico[]> {
	const supabase = getSupabaseServer();
	const { data, error } = await supabase.rpc("listar_agentes_publicos");
	if (error) throw error;

	return (data ?? []).map((fila) => ({
		id: fila.id,
		nombre: fila.nombre,
		cargo: fila.cargo,
		zona: fila.zona,
		telefono: fila.telefono,
		avatarUrl: fila.avatar_url,
		alquileresGestionados: Number(fila.alquileres_gestionados),
	}));
}

async function consultarResumenPublico(): Promise<ResumenPublico> {
	const supabase = getSupabaseServer();
	const { data, error } = await supabase.rpc("resumen_publico");
	if (error) throw error;

	const fila = data?.[0];
	return {
		inmueblesDisponibles: Number(fila?.inmuebles_disponibles ?? 0),
		agentesActivos: Number(fila?.agentes_activos ?? 0),
		zonasActivas: Number(fila?.zonas_activas ?? 0),
		contratosGestionados: Number(fila?.contratos_gestionados ?? 0),
	};
}

export const obtenerInicio = createServerFn({ method: "GET" }).handler(
	async (): Promise<ResumenInicio> => {
		const vacio: ResumenInicio = {
			destacados: [],
			zonas: [],
			agentes: [],
			totalPorTipo: { Casa: 0, Departamento: 0, Local: 0 },
			totalDisponibles: 0,
			metricas: RESUMEN_PUBLICO_VACIO,
		};

		try {
			const supabase = getSupabaseServer();
			const [destacadosResult, tiposResult, zonas, agentes, metricas] =
				await Promise.all([
					supabase
						.from("v_inmuebles_catalogo")
						.select("*")
						.eq("estado", "disponible")
						.order("destacado", { ascending: false })
						.order("visitas_mes", { ascending: false })
						.order("publicado_el", { ascending: false })
						.limit(3),
					supabase
						.from("v_inmuebles_catalogo")
						.select("tipo")
						.eq("estado", "disponible"),
					consultarZonas(),
					consultarAgentesPublicos(),
					consultarResumenPublico(),
				]);

			if (destacadosResult.error) throw destacadosResult.error;
			if (tiposResult.error) throw tiposResult.error;

			const totalPorTipo: Record<TipoInmueble, number> = {
				Casa: 0,
				Departamento: 0,
				Local: 0,
			};

			for (const fila of tiposResult.data ?? []) {
				totalPorTipo[TIPO_DESDE_DB[fila.tipo]] += 1;
			}

			return {
				destacados: (destacadosResult.data ?? []).map(aInmueble),
				zonas,
				agentes,
				totalPorTipo,
				totalDisponibles: (tiposResult.data ?? []).length,
				metricas,
			};
		} catch (error) {
			console.warn(
				"[catalogo] No se pudo cargar el resumen de inicio:",
				error instanceof Error ? error.message : error,
			);
			return vacio;
		}
	},
);

/* ------------------------------ Catálogo -------------------------------- */

const catalogoSchema = z.object({
	q: z.string().trim().max(120).optional(),
	tipo: z.enum(["Casa", "Departamento", "Local"]).optional(),
	zona: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
	precioMin: z.number().finite().nonnegative().optional(),
	precioMax: z.number().finite().nonnegative().optional(),
	habitaciones: z.number().int().min(0).max(20).optional(),
	orden: z.enum(ORDENES).optional(),
	pagina: z.number().int().min(1).optional(),
});

export interface ResultadoCatalogo {
	inmuebles: Inmueble[];
	total: number;
	pagina: number;
	porPagina: number;
	totalPaginas: number;
}

export const listarCatalogo = createServerFn({ method: "GET" })
	.validator(catalogoSchema)
	.handler(async ({ data }): Promise<ResultadoCatalogo> => {
		const pagina = data.pagina ?? 1;

		try {
			const supabase = getSupabaseServer();
			let consulta = supabase
				.from("v_inmuebles_catalogo")
				.select("*", { count: "exact" })
				.eq("estado", "disponible");

			if (data.tipo) consulta = consulta.eq("tipo", TIPO_DB[data.tipo]);
			if (data.zona && data.zona.length > 0) {
				consulta = consulta.in("zona_nombre", data.zona);
			}
			if (data.precioMin !== undefined) {
				consulta = consulta.gte("precio", data.precioMin);
			}
			if (data.precioMax !== undefined) {
				consulta = consulta.lte("precio", data.precioMax);
			}
			if (data.habitaciones !== undefined && data.habitaciones > 0) {
				consulta = consulta.gte("habitaciones", data.habitaciones);
			}

			const q = data.q
				?.replace(/[%,()"']/g, " ")
				.replace(/\s+/g, " ")
				.trim();
			if (q) {
				consulta = consulta.or(
					`titulo.ilike.%${q}%,direccion.ilike.%${q}%,codigo.ilike.%${q}%,zona_nombre.ilike.%${q}%`,
				);
			}

			switch (data.orden ?? "relevancia") {
				case "precio-asc":
					consulta = consulta.order("precio", { ascending: true });
					break;
				case "precio-desc":
					consulta = consulta.order("precio", { ascending: false });
					break;
				case "recientes":
					consulta = consulta.order("publicado_el", { ascending: false });
					break;
				case "mayor-superficie":
					consulta = consulta.order("m2", { ascending: false });
					break;
				default:
					consulta = consulta
						.order("destacado", { ascending: false })
						.order("visitas_mes", { ascending: false })
						.order("publicado_el", { ascending: false });
			}

			const desde = (pagina - 1) * POR_PAGINA;
			const {
				data: filas,
				count,
				error,
			} = await consulta.range(desde, desde + POR_PAGINA - 1);

			if (error) throw error;

			const total = count ?? 0;
			const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA));

			return {
				inmuebles: (filas ?? []).map(aInmueble),
				total,
				pagina,
				porPagina: POR_PAGINA,
				totalPaginas,
			};
		} catch (error) {
			console.warn(
				"[catalogo] No se pudo cargar el catálogo:",
				error instanceof Error ? error.message : error,
			);
			return {
				inmuebles: [],
				total: 0,
				pagina,
				porPagina: POR_PAGINA,
				totalPaginas: 1,
			};
		}
	});

/* -------------------------------- Detalle -------------------------------- */

const detalleSchema = z.object({
	id: z.string().uuid(),
});

export interface DetalleInmueble {
	inmueble: Inmueble;
	agenteNombre: string | null;
	proveedorNombre: string | null;
	similares: Inmueble[];
}

export const obtenerDetalleInmueble = createServerFn({ method: "GET" })
	.validator(detalleSchema)
	.handler(async ({ data }): Promise<DetalleInmueble | null> => {
		try {
			const supabase = getSupabaseServer();
			const { data: fila, error } = await supabase
				.from("v_inmuebles_catalogo")
				.select("*")
				.eq("id", data.id)
				.eq("estado", "disponible")
				.maybeSingle();

			if (error) throw error;
			if (!fila) return null;

			const inmueble = aInmueble(fila);

			const { data: similaresFilas, error: similaresError } = await supabase
				.from("v_inmuebles_catalogo")
				.select("*")
				.eq("estado", "disponible")
				.neq("id", fila.id)
				.or(`tipo.eq.${fila.tipo},zona_id.eq.${fila.zona_id}`)
				.order("destacado", { ascending: false })
				.order("visitas_mes", { ascending: false })
				.limit(3);

			if (similaresError) {
				console.warn(
					"[catalogo] No se pudieron cargar los similares:",
					similaresError.message,
				);
			}

			return {
				inmueble,
				agenteNombre: fila.agente_nombre?.trim() || null,
				proveedorNombre: fila.proveedor_nombre?.trim() || null,
				similares: (similaresFilas ?? []).map(aInmueble),
			};
		} catch (error) {
			console.warn(
				"[catalogo] No se pudo cargar el detalle:",
				error instanceof Error ? error.message : error,
			);
			return null;
		}
	});
