/**
 * Inmuebles del panel administrador.
 *
 * ⚠️ SOLO SERVIDOR. El alta/edición escribe en `inmuebles` e
 * `inmueble_imagenes` con RLS de administrador. El cambio de estado pasa por
 * `cambiar_estado_inmueble`, que además sincroniza las reglas del catálogo.
 * Las fotos se suben desde el navegador al bucket público `inmuebles`.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ResultadoOperacion } from "@/lib/admin";
import type {
	DatosInmuebleAdmin,
	InmuebleAdmin,
	OpcionProveedorAdmin,
} from "@/types/admin";
import type { InmuebleCatalogo } from "@/types/domain";
import {
	aInmuebleAdmin,
	fechaDbDesdeInput,
	generarCodigoInmueble,
	mensajeDeError,
	requireAdmin,
	resolverZonaId,
} from "./shared";

const imagenSchema = z.object({
	id: z.string().uuid().optional(),
	path: z.string().trim().max(500).optional().nullable(),
	url: z.string().trim().url().max(1000),
	alt: z.string().trim().max(200).optional().nullable(),
	orden: z.number().int().min(0),
	esPortada: z.boolean(),
});

const guardarSchema = z.object({
	id: z.string().uuid().optional(),
	modo: z.enum(["crear", "editar"]),
	publicar: z.boolean(),
	titulo: z.string().trim().min(3).max(160),
	tipo: z.enum(["casa", "departamento", "local"]),
	estado: z.enum(["disponible", "reservado", "en_alquiler", "inactivo"]),
	zona: z.string().trim().min(1).max(120),
	direccion: z.string().trim().min(3).max(240),
	m2: z.number().positive().max(1_000_000),
	habitaciones: z.number().int().min(0).nullable(),
	banos: z.number().int().min(0).max(50),
	estacionamientos: z.number().int().min(0).max(50),
	piso: z.number().int().min(-10).max(200).nullable(),
	amoblado: z.boolean(),
	descripcion: z.string().trim().max(4000),
	proveedorId: z.string().uuid(),
	precio: z.number().positive().max(1_000_000_000),
	costoPublicacion: z.number().min(0).max(1_000_000_000),
	disponibleDesde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	destacado: z.boolean(),
	amenidades: z.array(z.string().trim().min(1).max(80)).max(30),
	imagenes: z.array(imagenSchema).max(12),
});

const idSchema = z.object({ id: z.string().uuid() });
const estadoSchema = z.object({
	id: z.string().uuid(),
	estado: z.enum(["disponible", "reservado", "en_alquiler", "inactivo"]),
});
const destacadoSchema = z.object({
	id: z.string().uuid(),
	destacado: z.boolean(),
});

function normalizarImagenes(
	imagenes: Array<{
		id?: string;
		path?: string | null;
		url: string;
		alt?: string | null;
		orden: number;
		esPortada: boolean;
	}>,
): Array<{
	id?: string;
	path: string | null;
	url: string;
	alt: string | null;
	orden: number;
	es_portada: boolean;
}> {
	const ordenadas = imagenes.map((imagen, indice) => ({
		...imagen,
		orden: indice,
	}));
	const portada =
		ordenadas.findIndex((imagen) => imagen.esPortada) >= 0
			? ordenadas.findIndex((imagen) => imagen.esPortada)
			: 0;

	return ordenadas.map((imagen, indice) => ({
		id: imagen.id,
		path: imagen.path ?? null,
		url: imagen.url,
		alt: imagen.alt?.trim() || null,
		orden: imagen.orden,
		es_portada: indice === portada,
	}));
}

async function listarOpcionesProveedores(
	supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
): Promise<OpcionProveedorAdmin[]> {
	const [proveedoresResult, zonasResult] = await Promise.all([
		supabase
			.from("proveedores")
			.select("id, nombre, tipo, correo, telefono, zona_principal_id, activo")
			.eq("activo", true)
			.order("nombre", { ascending: true }),
		supabase.from("zonas").select("id, nombre"),
	]);

	if (proveedoresResult.error) throw proveedoresResult.error;
	if (zonasResult.error) throw zonasResult.error;

	const zonas = new Map((zonasResult.data ?? []).map((z) => [z.id, z.nombre]));

	return (proveedoresResult.data ?? []).map((proveedor) => ({
		id: proveedor.id,
		nombre: proveedor.nombre,
		tipo: proveedor.tipo === "empresa" ? "Empresa" : "Persona",
		zonaPrincipal:
			zonas.get(proveedor.zona_principal_id ?? "") ?? "Sin asignar",
		telefono: proveedor.telefono ?? "",
		email: proveedor.correo ?? undefined,
	}));
}

export const listarInmueblesAdmin = createServerFn({ method: "GET" }).handler(
	async (): Promise<InmuebleAdmin[]> => {
		try {
			const { supabase } = await requireAdmin();
			const { data, error } = await supabase
				.from("v_inmuebles_catalogo")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) throw error;
			return (data ?? []).map((fila: InmuebleCatalogo) => aInmuebleAdmin(fila));
		} catch (error) {
			console.warn(
				"[admin] No se pudieron cargar los inmuebles:",
				error instanceof Error ? error.message : error,
			);
			return [];
		}
	},
);

export const opcionesInmuebleAdmin = createServerFn({ method: "GET" }).handler(
	async (): Promise<{ proveedores: OpcionProveedorAdmin[] }> => {
		try {
			const { supabase } = await requireAdmin();
			return {
				proveedores: await listarOpcionesProveedores(supabase),
			};
		} catch (error) {
			console.warn(
				"[admin] No se pudieron cargar las opciones de inmueble:",
				error instanceof Error ? error.message : error,
			);
			return { proveedores: [] };
		}
	},
);

export const obtenerInmuebleAdmin = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(async ({ data }): Promise<DatosInmuebleAdmin | null> => {
		try {
			const { supabase } = await requireAdmin();
			const [inmuebleResult, proveedores] = await Promise.all([
				supabase
					.from("v_inmuebles_catalogo")
					.select("*")
					.eq("id", data.id)
					.maybeSingle(),
				listarOpcionesProveedores(supabase),
			]);

			if (inmuebleResult.error) throw inmuebleResult.error;
			if (!inmuebleResult.data) return null;

			return {
				inmueble: aInmuebleAdmin(inmuebleResult.data),
				proveedores,
			};
		} catch (error) {
			console.warn(
				"[admin] No se pudo cargar el inmueble:",
				error instanceof Error ? error.message : error,
			);
			return null;
		}
	});

async function limpiarArchivos(
	supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
	paths: string[],
) {
	if (paths.length === 0) return;
	const { error } = await supabase.storage.from("inmuebles").remove(paths);
	if (error) {
		console.warn(
			"[admin] No se pudieron limpiar fotos huérfanas:",
			error.message,
		);
	}
}

export const guardarInmueble = createServerFn({ method: "POST" })
	.validator(guardarSchema)
	.handler(async ({ data }): Promise<ResultadoOperacion<{ id: string }>> => {
		let pathsNuevos: string[] = [];
		try {
			const { supabase } = await requireAdmin();
			const zonaId = await resolverZonaId(supabase, data.zona);
			const imagenes = normalizarImagenes(data.imagenes);
			pathsNuevos = data.imagenes
				.filter((imagen) => !imagen.id && Boolean(imagen.path))
				.map((imagen) => imagen.path)
				.filter((path): path is string => Boolean(path));

			if (data.modo === "editar" && data.id) {
				const id = data.id;
				const { data: actual, error: actualError } = await supabase
					.from("inmuebles")
					.select("id, estado, publicado_el")
					.eq("id", id)
					.maybeSingle();

				if (actualError) throw actualError;
				if (!actual) {
					return { ok: false, error: "El inmueble ya no existe." };
				}

				const { data: imagenesActuales, error: imagenesError } = await supabase
					.from("inmueble_imagenes")
					.select("id, path")
					.eq("inmueble_id", data.id);

				if (imagenesError) throw imagenesError;

				const idsConservados = new Set(
					imagenes
						.map((imagen) => imagen.id)
						.filter((id): id is string => Boolean(id)),
				);
				// Una portada heredada sin id se borra y se vuelve a insertar con
				// la misma ruta; no hay que eliminar el archivo de Storage.
				const pathsEnUso = new Set(
					imagenes
						.map((imagen) => imagen.path)
						.filter((path): path is string => Boolean(path)),
				);
				const pathsEliminados = (imagenesActuales ?? [])
					.filter((imagen) => !idsConservados.has(imagen.id))
					.map((imagen) => imagen.path)
					.filter(
						(path): path is string =>
							Boolean(path) && !pathsEnUso.has(path as string),
					);

				const { error: updateError } = await supabase
					.from("inmuebles")
					.update({
						titulo: data.titulo,
						tipo: data.tipo,
						destacado: data.destacado,
						descripcion: data.descripcion,
						precio: data.precio,
						m2: data.m2,
						habitaciones:
							data.tipo === "local"
								? null
								: Math.max(1, data.habitaciones ?? 1),
						banos: data.banos,
						estacionamientos: data.estacionamientos,
						piso: data.piso,
						amoblado: data.amoblado,
						caracteristicas: data.amenidades,
						direccion: data.direccion,
						zona_id: zonaId,
						proveedor_id: data.proveedorId,
						fecha_disponibilidad: fechaDbDesdeInput(data.disponibleDesde),
						costo_publicacion: data.costoPublicacion,
					})
					.eq("id", data.id);

				if (updateError) throw updateError;

				if (pathsEliminados.length > 0) {
					const { error: deleteError } = await supabase
						.from("inmueble_imagenes")
						.delete()
						.in(
							"id",
							(imagenesActuales ?? [])
								.filter((imagen) => !idsConservados.has(imagen.id))
								.map((imagen) => imagen.id),
						);

					if (deleteError) throw deleteError;
					await limpiarArchivos(supabase, pathsEliminados);
				}

				// El índice único de portada exige limpiar la anterior antes de
				// marcar la nueva.
				const { error: resetError } = await supabase
					.from("inmueble_imagenes")
					.update({ es_portada: false })
					.eq("inmueble_id", data.id);

				if (resetError) throw resetError;

				for (const imagen of imagenes) {
					if (imagen.id) {
						const { error } = await supabase
							.from("inmueble_imagenes")
							.update({
								path: imagen.path,
								url: imagen.url,
								alt: imagen.alt,
								orden: imagen.orden,
								es_portada: imagen.es_portada,
							})
							.eq("id", imagen.id)
							.eq("inmueble_id", data.id);
						if (error) throw error;
					} else {
						const { error } = await supabase.from("inmueble_imagenes").insert({
							inmueble_id: data.id,
							path: imagen.path,
							url: imagen.url,
							alt: imagen.alt,
							orden: imagen.orden,
							es_portada: imagen.es_portada,
						});
						if (error) throw error;
					}
				}

				// A partir de aquí las filas de imagen ya apuntan a los archivos
				// nuevos; no se deben borrar aunque falle el cambio de estado.
				pathsNuevos = [];

				if (data.publicar && actual.estado !== data.estado) {
					const { error } = await supabase.rpc("cambiar_estado_inmueble", {
						p_id: data.id,
						p_estado: data.estado,
					});
					if (error) throw error;
				}

				return { ok: true, id };
			}

			const id = data.id ?? crypto.randomUUID();
			const estado = data.publicar ? data.estado : "inactivo";
			let codigo = await generarCodigoInmueble(supabase);
			let insertError: { code?: string; message?: string } | null = null;

			for (let intento = 0; intento < 5; intento += 1) {
				const { error } = await supabase.from("inmuebles").insert({
					id,
					codigo,
					titulo: data.titulo,
					tipo: data.tipo,
					estado,
					destacado: data.destacado,
					descripcion: data.descripcion,
					precio: data.precio,
					m2: data.m2,
					habitaciones:
						data.tipo === "local" ? null : Math.max(1, data.habitaciones ?? 1),
					banos: data.banos,
					estacionamientos: data.estacionamientos,
					piso: data.piso,
					amoblado: data.amoblado,
					caracteristicas: data.amenidades,
					direccion: data.direccion,
					zona_id: zonaId,
					proveedor_id: data.proveedorId,
					fecha_disponibilidad: fechaDbDesdeInput(data.disponibleDesde),
					costo_publicacion: data.costoPublicacion,
					publicado_el: new Date().toISOString(),
				});

				if (!error) {
					insertError = null;
					break;
				}

				insertError = error;
				if (error.code !== "23505") break;
				codigo = `PT-${String(
					Number.parseInt(codigo.replace(/^PT-/, ""), 10) + 1 || 1001,
				).padStart(4, "0")}`;
			}

			if (insertError) throw insertError;

			if (imagenes.length > 0) {
				const { error } = await supabase.from("inmueble_imagenes").insert(
					imagenes.map((imagen) => ({
						inmueble_id: id,
						path: imagen.path,
						url: imagen.url,
						alt: imagen.alt,
						orden: imagen.orden,
						es_portada: imagen.es_portada,
					})),
				);

				if (error) {
					await supabase.from("inmuebles").delete().eq("id", id);
					throw error;
				}
			}

			pathsNuevos = [];
			return { ok: true, id };
		} catch (error) {
			if (pathsNuevos.length > 0) {
				try {
					const { supabase } = await requireAdmin();
					await limpiarArchivos(supabase, pathsNuevos);
				} catch {
					// La limpieza es best-effort: el error original es el relevante.
				}
			}
			console.warn(
				"[admin] Error al guardar inmueble:",
				error instanceof Error ? error.message : error,
			);
			return {
				ok: false,
				error: mensajeDeError(error as { code?: string; message?: string }),
			};
		}
	});

export const cambiarEstadoInmueble = createServerFn({ method: "POST" })
	.validator(estadoSchema)
	.handler(async ({ data }): Promise<ResultadoOperacion> => {
		try {
			const { supabase } = await requireAdmin();
			const { error } = await supabase.rpc("cambiar_estado_inmueble", {
				p_id: data.id,
				p_estado: data.estado,
			});
			if (error) throw error;
			return { ok: true };
		} catch (error) {
			console.warn(
				"[admin] Error al cambiar estado del inmueble:",
				error instanceof Error ? error.message : error,
			);
			return {
				ok: false,
				error: mensajeDeError(error as { code?: string; message?: string }),
			};
		}
	});

export const cambiarDestacadoInmueble = createServerFn({ method: "POST" })
	.validator(destacadoSchema)
	.handler(async ({ data }): Promise<ResultadoOperacion> => {
		try {
			const { supabase } = await requireAdmin();
			const { error } = await supabase
				.from("inmuebles")
				.update({ destacado: data.destacado })
				.eq("id", data.id);
			if (error) throw error;
			return { ok: true };
		} catch (error) {
			return {
				ok: false,
				error: mensajeDeError(error as { code?: string; message?: string }),
			};
		}
	});
