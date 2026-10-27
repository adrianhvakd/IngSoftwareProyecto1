import type { Inmueble, TipoInmueble } from "@/data/types";

export const TIPOS_INMUEBLE: TipoInmueble[] = ["Casa", "Departamento", "Local"];

export const ZONAS = [
	"Centro histórico",
	"Zona Universitaria",
	"San Clemente",
	"Pailaviri",
	"Av. Las Banderas",
	"Av. Cívica",
	"Villa Imperial",
	"Alto Potosí",
] as const;

export type Zona = (typeof ZONAS)[number];

/** Agrupación de zonas por sector urbano (para el ZonePicker). */
export const SECTORES: { sector: string; zonas: Zona[] }[] = [
	{
		sector: "Centro",
		zonas: ["Centro histórico", "Av. Cívica"],
	},
	{
		sector: "Norte",
		zonas: ["Av. Las Banderas", "Alto Potosí", "Villa Imperial"],
	},
	{
		sector: "Sur",
		zonas: ["San Clemente", "Pailaviri", "Zona Universitaria"],
	},
];

export const ZONAS_POPULARES: Zona[] = [
	"Centro histórico",
	"Zona Universitaria",
	"San Clemente",
];

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
		.filter((z): z is string => typeof z === "string" && z !== "")
		.filter((z) => (ZONAS as readonly string[]).includes(z));

	return {
		q: typeof search.q === "string" && search.q !== "" ? search.q : undefined,
		tipo:
			tipo && TIPOS_INMUEBLE.includes(tipo as TipoInmueble) ? tipo : undefined,
		zona: zonas.length > 0 ? zonas : undefined,
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

const relevancia = (inmueble: Inmueble) =>
	(inmueble.destacado ? 1000 : 0) + inmueble.visitasMes;

export function filtrarYOrdenar(
	inmuebles: Inmueble[],
	search: CatalogSearch,
): Inmueble[] {
	const q = search.q?.toLowerCase().trim();

	const filtrados = inmuebles.filter((inmueble) => {
		if (search.tipo && inmueble.tipo !== search.tipo) return false;
		if (search.zona && search.zona.length > 0) {
			if (!search.zona.includes(inmueble.zona)) return false;
		}
		if (search.precioMin !== undefined && inmueble.precio < search.precioMin)
			return false;
		if (search.precioMax !== undefined && inmueble.precio > search.precioMax)
			return false;
		if (search.habitaciones !== undefined && search.habitaciones > 0) {
			if (inmueble.habitaciones < search.habitaciones) return false;
		}
		if (q) {
			const heno =
				`${inmueble.titulo} ${inmueble.zona} ${inmueble.direccion} ${inmueble.tipo} ${inmueble.codigo}`.toLowerCase();
			if (!heno.includes(q)) return false;
		}
		return true;
	});

	const orden = search.orden ?? "relevancia";
	return [...filtrados].sort((a, b) => {
		switch (orden) {
			case "precio-asc":
				return a.precio - b.precio;
			case "precio-desc":
				return b.precio - a.precio;
			case "recientes":
				return (
					new Date(b.publicadoEl).getTime() - new Date(a.publicadoEl).getTime()
				);
			case "mayor-superficie":
				return b.m2 - a.m2;
			default:
				return relevancia(b) - relevancia(a);
		}
	});
}
