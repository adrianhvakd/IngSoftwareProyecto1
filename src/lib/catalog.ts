import type { TipoInmueble } from "@/types/models";

export const TIPOS_INMUEBLE: TipoInmueble[] = ["Casa", "Departamento", "Local"];

/**
 * Zona real del catálogo con su conteo de inmuebles visibles. Se usa en el
 * ZonePicker y en los filtros públicos.
 */
export interface ZonaOpcion {
	nombre: string;
	sector: string;
	total: number;
}

export type OrdenCatalogo =
	| "relevancia"
	| "precio-asc"
	| "precio-desc"
	| "recientes"
	| "mayor-superficie";

export const ORDEN_OPCIONES: { value: OrdenCatalogo; label: string }[] = [
	{ value: "relevancia", label: "Más relevantes" },
	{ value: "precio-asc", label: "Menor precio" },
	{ value: "precio-desc", label: "Mayor precio" },
	{ value: "recientes", label: "Publicados recientemente" },
	{ value: "mayor-superficie", label: "Mayor superficie" },
];

export type VistaCatalogo = "grilla" | "lista";

export interface CatalogSearch {
	q?: string;
	tipo?: string;
	/** Zonas seleccionadas (filtro múltiple). */
	zona?: string[];
	precioMin?: number;
	precioMax?: number;
	habitaciones?: number;
	orden?: OrdenCatalogo;
	vista?: VistaCatalogo;
	pagina?: number;
}

const ORDENES_VALIDOS: OrdenCatalogo[] = [
	"relevancia",
	"precio-asc",
	"precio-desc",
	"recientes",
	"mayor-superficie",
];

function aNumero(valor: unknown): number | undefined {
	if (typeof valor === "number" && Number.isFinite(valor)) return valor;
	if (typeof valor === "string" && valor.trim() !== "") {
		const n = Number(valor);
		if (Number.isFinite(n)) return n;
	}
	return undefined;
}

/** Validador de search params del catálogo (compatible con TanStack Router). */
export function validateCatalogSearch(
	search: Record<string, unknown>,
): CatalogSearch {
	const tipo = typeof search.tipo === "string" ? search.tipo : undefined;
	const orden = ORDENES_VALIDOS.includes(search.orden as OrdenCatalogo)
		? (search.orden as OrdenCatalogo)
		: undefined;
	const vista =
		search.vista === "grilla" || search.vista === "lista"
			? search.vista
			: undefined;

	const zonaRaw = search.zona;
	const zonaCruda = Array.isArray(zonaRaw)
		? zonaRaw
		: typeof zonaRaw === "string"
			? [zonaRaw]
			: [];
	const zonas = zonaCruda
		.filter((z): z is string => typeof z === "string")
		.map((z) => z.trim())
		.filter((z) => z !== "" && z.length <= 100);

	return {
		q:
			typeof search.q === "string" && search.q.trim() !== ""
				? search.q.trim().slice(0, 120)
				: undefined,
		tipo:
			tipo && TIPOS_INMUEBLE.includes(tipo as TipoInmueble) ? tipo : undefined,
		zona: zonas.length > 0 ? [...new Set(zonas)] : undefined,
		precioMin: aNumero(search.precioMin),
		precioMax: aNumero(search.precioMax),
		habitaciones: aNumero(search.habitaciones),
		orden,
		vista,
		pagina: aNumero(search.pagina),
	};
}

export interface FiltroActivo {
	clave: keyof CatalogSearch;
	valor?: string;
	etiqueta: string;
}

export function filtrosActivos(search: CatalogSearch): FiltroActivo[] {
	const activos: FiltroActivo[] = [];
	if (search.q) activos.push({ clave: "q", etiqueta: `“${search.q}”` });
	if (search.tipo) activos.push({ clave: "tipo", etiqueta: search.tipo });
	if (search.zona) {
		for (const zona of search.zona) {
			activos.push({ clave: "zona", valor: zona, etiqueta: zona });
		}
	}
	if (search.precioMin !== undefined)
		activos.push({
			clave: "precioMin",
			etiqueta: `Desde Bs ${search.precioMin}`,
		});
	if (search.precioMax !== undefined)
		activos.push({
			clave: "precioMax",
			etiqueta: `Hasta Bs ${search.precioMax}`,
		});
	if (search.habitaciones !== undefined)
		activos.push({
			clave: "habitaciones",
			etiqueta: `${search.habitaciones}+ habitaciones`,
		});
	return activos;
}
