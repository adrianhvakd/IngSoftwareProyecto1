/**
 * Opciones del wizard de cierre de alquiler.
 *
 * ⚠️ SOLO SERVIDOR. Devuelve únicamente datos que el actor puede ver por RLS:
 * clientes activos, inmuebles disponibles y vendedores activos.
 */

import { createServerFn } from "@tanstack/react-start";
import {
	aInmuebleAdmin,
	cargarVendedores,
	nombrePerfil,
} from "@/server/admin/shared";
import type { OpcionesCierre } from "@/types/alquileres";
import type { Cliente, Vendedor } from "@/types/models";
import { requireActor } from "./shared";

const VACIO: OpcionesCierre = {
	clientes: [],
	inmuebles: [],
	vendedores: [],
	vendedorActual: null,
	comisionInicial: 0,
};

export const obtenerOpcionesCierre = createServerFn({ method: "GET" }).handler(
	async (): Promise<OpcionesCierre> => {
		try {
			const { id, rol, supabase } = await requireActor();

			if (rol !== "administrador" && rol !== "vendedor") {
				throw new Error("No tienes permisos para cerrar alquileres.");
			}

			const [clientesResult, inmueblesResult, vendedores] = await Promise.all([
				supabase
					.from("clientes")
					.select("perfil_id, telefono_contacto, created_at"),
				supabase
					.from("v_inmuebles_catalogo")
					.select("*")
					.eq("estado", "disponible")
					.order("titulo", { ascending: true }),
				cargarVendedores(supabase),
			]);

			if (clientesResult.error) throw clientesResult.error;
			if (inmueblesResult.error) throw inmueblesResult.error;

			const filasClientes = clientesResult.data ?? [];
			const idsPerfiles = filasClientes.map((fila) => fila.perfil_id);
			const perfilesResult =
				idsPerfiles.length > 0
					? await supabase.from("perfiles").select("*").in("id", idsPerfiles)
					: { data: [], error: null };

			if (perfilesResult.error) throw perfilesResult.error;

			const perfiles = new Map(
				(perfilesResult.data ?? []).map((perfil) => [perfil.id, perfil]),
			);

			const clientes: Cliente[] = filasClientes
				.map((fila): Cliente | null => {
					const perfil = perfiles.get(fila.perfil_id);
					if (!perfil?.activo) return null;

					return {
						id: perfil.id,
						nombre: nombrePerfil(perfil) || perfil.correo,
						email: perfil.correo,
						telefonoContacto:
							perfil.telefono?.trim() ||
							fila.telefono_contacto?.trim() ||
							"Sin registrar",
						estado: "Activo",
						avatarUrl: perfil.avatar_url ?? "",
						desde: perfil.created_at,
					};
				})
				.filter((cliente): cliente is Cliente => cliente !== null)
				.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

			const vendedoresActivos: Vendedor[] = vendedores.filter(
				(vendedor) => vendedor.estado === "Activo",
			);
			const vendedorActual =
				vendedoresActivos.find((vendedor) => vendedor.id === id) ?? null;

			return {
				clientes,
				inmuebles: (inmueblesResult.data ?? []).map(aInmuebleAdmin),
				vendedores: rol === "administrador" ? vendedoresActivos : [],
				vendedorActual,
				comisionInicial:
					rol === "vendedor" ? (vendedorActual?.comisionFija ?? 0) : 0,
			};
		} catch (error) {
			console.warn(
				"[alquileres] No se pudieron cargar las opciones de cierre:",
				error instanceof Error ? error.message : error,
			);
			return VACIO;
		}
	},
);
