/**
 * Proveedores del panel administrador.
 *
 * ⚠️ SOLO SERVIDOR. La lectura usa `v_inmuebles_catalogo` para contar y mostrar
 * la cartera real de cada proveedor. Las mutaciones usan RLS de administrador.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ResultadoOperacion } from "@/lib/admin";
import { TIPO_PROVEEDOR_UI_A_DB } from "@/lib/admin";
import type { ProveedorAdmin } from "@/types/admin";
import type { InmuebleCatalogo } from "@/types/domain";
import type { Proveedor } from "@/types/models";
import {
	aInmuebleAdmin,
	mensajeDeError,
	requireAdmin,
	resolverZonaId,
} from "./shared";

const proveedorSchema = z.object({
	nombre: z.string().trim().min(1).max(160),
	tipo: z.enum(["Persona", "Empresa"]),
	telefono: z.string().trim().max(30).optional(),
	email: z.string().trim().email().max(160).optional(),
	ciudad: z.string().trim().max(120).optional(),
	zonaPrincipal: z.string().trim().min(1).max(120),
	estado: z.enum(["Activo", "Inactivo"]),
});

const actualizarSchema = proveedorSchema.extend({
	id: z.string().uuid(),
});

const eliminarSchema = z.object({ id: z.string().uuid() });

export const listarProveedoresAdmin = createServerFn({
	method: "GET",
}).handler(async (): Promise<ProveedorAdmin[]> => {
	try {
		const { supabase } = await requireAdmin();
		const [proveedoresResult, inmueblesResult, zonasResult] = await Promise.all(
			[
				supabase.from("proveedores").select("*").order("created_at", {
					ascending: false,
				}),
				supabase.from("v_inmuebles_catalogo").select("*"),
				supabase.from("zonas").select("id, nombre"),
			],
		);

		if (proveedoresResult.error) throw proveedoresResult.error;
		if (inmueblesResult.error) throw inmueblesResult.error;
		if (zonasResult.error) throw zonasResult.error;

		const zonas = new Map(
			(zonasResult.data ?? []).map((z) => [z.id, z.nombre]),
		);
		const inmuebles = (inmueblesResult.data ?? []).map(
			(fila: InmuebleCatalogo) => aInmuebleAdmin(fila),
		);

		return (proveedoresResult.data ?? [])
			.map((proveedor) => {
				const cartera = inmuebles
					.filter((inmueble) => inmueble.proveedorId === proveedor.id)
					.map((inmueble) => ({
						id: inmueble.id,
						codigo: inmueble.codigo,
						titulo: inmueble.titulo,
						tipo: inmueble.tipo,
						estado: inmueble.estado,
						precio: inmueble.precio,
						zona: inmueble.zona,
					}));

				return {
					id: proveedor.id,
					nombre: proveedor.nombre,
					telefono: proveedor.telefono ?? "",
					email: proveedor.correo ?? undefined,
					tipo:
						proveedor.tipo === "empresa"
							? ("Empresa" as const)
							: ("Persona" as const),
					ciudad: proveedor.ciudad,
					zonaPrincipal:
						zonas.get(proveedor.zona_principal_id ?? "") ?? "Sin asignar",
					estado: proveedor.activo
						? ("Activo" as const)
						: ("Inactivo" as const),
					desde: proveedor.created_at,
					inmueblesCount: cartera.length,
					inmuebles: cartera,
				} satisfies ProveedorAdmin;
			})
			.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
	} catch (error) {
		console.warn(
			"[admin] No se pudieron cargar los proveedores:",
			error instanceof Error ? error.message : error,
		);
		return [];
	}
});

async function guardarProveedor(
	input: z.infer<typeof proveedorSchema> & { id?: string },
): Promise<ResultadoOperacion<{ proveedor: Proveedor }>> {
	const { supabase } = await requireAdmin();
	const zonaPrincipalId = await resolverZonaId(supabase, input.zonaPrincipal);
	const correo = input.email?.trim().toLowerCase() || null;
	const telefono = input.telefono?.trim() || null;

	const datos = {
		nombre: input.nombre,
		telefono,
		correo,
		tipo: TIPO_PROVEEDOR_UI_A_DB[input.tipo],
		ciudad: input.ciudad?.trim() || "Potosí",
		zona_principal_id: zonaPrincipalId,
		activo: input.estado === "Activo",
	};

	if (input.id) {
		const { data, error } = await supabase
			.from("proveedores")
			.update(datos)
			.eq("id", input.id)
			.select("*")
			.maybeSingle();

		if (error) throw error;
		if (!data) {
			return { ok: false, error: "El proveedor ya no existe." };
		}

		return {
			ok: true,
			proveedor: {
				id: data.id,
				nombre: data.nombre,
				telefono: data.telefono ?? "",
				email: data.correo ?? undefined,
				tipo: data.tipo === "empresa" ? "Empresa" : "Persona",
				ciudad: data.ciudad,
				zonaPrincipal: input.zonaPrincipal,
				estado: data.activo ? "Activo" : "Inactivo",
				desde: data.created_at,
			},
		};
	}

	const { data, error } = await supabase
		.from("proveedores")
		.insert(datos)
		.select("*")
		.single();

	if (error) throw error;

	return {
		ok: true,
		proveedor: {
			id: data.id,
			nombre: data.nombre,
			telefono: data.telefono ?? "",
			email: data.correo ?? undefined,
			tipo: data.tipo === "empresa" ? "Empresa" : "Persona",
			ciudad: data.ciudad,
			zonaPrincipal: input.zonaPrincipal,
			estado: data.activo ? "Activo" : "Inactivo",
			desde: data.created_at,
		},
	};
}

export const crearProveedor = createServerFn({ method: "POST" })
	.validator(proveedorSchema)
	.handler(
		async ({ data }): Promise<ResultadoOperacion<{ proveedor: Proveedor }>> => {
			try {
				return await guardarProveedor(data);
			} catch (error) {
				console.warn(
					"[admin] Error al crear proveedor:",
					error instanceof Error ? error.message : error,
				);
				return {
					ok: false,
					error: mensajeDeError(error as { code?: string; message?: string }),
				};
			}
		},
	);

export const actualizarProveedor = createServerFn({ method: "POST" })
	.validator(actualizarSchema)
	.handler(
		async ({ data }): Promise<ResultadoOperacion<{ proveedor: Proveedor }>> => {
			try {
				return await guardarProveedor(data);
			} catch (error) {
				console.warn(
					"[admin] Error al actualizar proveedor:",
					error instanceof Error ? error.message : error,
				);
				return {
					ok: false,
					error: mensajeDeError(error as { code?: string; message?: string }),
				};
			}
		},
	);

export const eliminarProveedor = createServerFn({ method: "POST" })
	.validator(eliminarSchema)
	.handler(
		async ({
			data,
		}): Promise<ResultadoOperacion<{ desactivado?: boolean }>> => {
			try {
				const { supabase } = await requireAdmin();
				const { error } = await supabase
					.from("proveedores")
					.delete()
					.eq("id", data.id);

				if (!error) return { ok: true };

				if (error.code === "23503") {
					const { error: bajaError } = await supabase
						.from("proveedores")
						.update({ activo: false })
						.eq("id", data.id);

					if (bajaError) throw bajaError;
					return { ok: true, desactivado: true };
				}

				throw error;
			} catch (error) {
				console.warn(
					"[admin] Error al eliminar proveedor:",
					error instanceof Error ? error.message : error,
				);
				return {
					ok: false,
					error: mensajeDeError(error as { code?: string; message?: string }),
				};
			}
		},
	);
