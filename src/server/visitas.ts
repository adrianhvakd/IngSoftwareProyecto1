/**
 * Agendamiento público de visitas.
 *
 * ⚠️ SOLO SERVIDOR. La escritura va por la RPC `agendar_visita`, que valida
 * disponibilidad, solapes, contacto y el rol del usuario. No se inserta en
 * `visitas` desde el cliente ni se replica esa lógica aquí.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ResultadoAuth } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/server";

const agendarVisitaSchema = z.object({
	inmuebleId: z.string().uuid(),
	fechaHora: z.string().refine((valor) => !Number.isNaN(Date.parse(valor)), {
		message: "La fecha y hora de la visita no es válida.",
	}),
	nombre: z.string().trim().max(120).optional(),
	telefono: z.string().trim().max(30).optional(),
	correo: z.string().trim().email().max(160).optional(),
	notas: z.string().trim().max(1000).optional(),
});

function mensajeDeError(error: { code?: string; message?: string }): string {
	switch (error.code) {
		case "23505":
			return "Ese horario ya está ocupado para este inmueble. Elige otra franja u otro día.";
		case "23514":
			return "El inmueble ya no está disponible para visitas. Explora otras opciones publicadas.";
		case "23503":
			return "El inmueble ya no existe o no está publicado.";
		case "23502":
			return "Completa tu nombre, teléfono y correo para agendar la visita.";
		case "22007":
			return "La fecha de la visita ya pasó. Elige un día y una franja futuras.";
		case "42501":
			return "Tu sesión no tiene un perfil activo. Vuelve a iniciar sesión.";
		default:
			break;
	}

	const mensaje = error.message?.toLowerCase() ?? "";
	if (mensaje.includes("franja horaria")) {
		return "Ese horario ya está ocupado para este inmueble. Elige otra franja u otro día.";
	}
	if (mensaje.includes("no está disponible")) {
		return "El inmueble ya no está disponible para visitas. Explora otras opciones publicadas.";
	}
	if (mensaje.includes("no existe")) {
		return "El inmueble ya no existe o no está publicado.";
	}
	if (mensaje.includes("ya pasó")) {
		return "La fecha de la visita ya pasó. Elige un día y una franja futuras.";
	}
	if (mensaje.includes("perfil activo")) {
		return "Tu sesión no tiene un perfil activo. Vuelve a iniciar sesión.";
	}
	if (mensaje.includes("fetch") || mensaje.includes("network")) {
		return "No se pudo conectar con el servicio. Revisa tu conexión e inténtalo de nuevo.";
	}

	return "No se pudo agendar la visita. Inténtalo de nuevo.";
}

export const agendarVisita = createServerFn({ method: "POST" })
	.validator(agendarVisitaSchema)
	.handler(async ({ data }): Promise<ResultadoAuth<{ visitaId: string }>> => {
		try {
			const supabase = getSupabaseServer();
			const { data: visitaId, error } = await supabase.rpc("agendar_visita", {
				p_inmueble_id: data.inmuebleId,
				p_fecha_hora: data.fechaHora,
				p_nombre: data.nombre?.trim() || null,
				p_telefono: data.telefono?.trim() || null,
				p_correo: data.correo?.trim().toLowerCase() || null,
				p_notas: data.notas?.trim() || null,
				p_canal: "web",
			});

			if (error) {
				console.warn(
					"[visitas] agendar_visita rechazó la solicitud:",
					error.code,
					error.message,
				);
				return { ok: false, error: mensajeDeError(error) };
			}

			if (!visitaId) {
				return {
					ok: false,
					error:
						"La visita se registró sin identificador. Contacta a RE/MAX Potosí.",
				};
			}

			return { ok: true, visitaId };
		} catch (error) {
			console.error("[visitas] Error al agendar la visita:", error);
			return {
				ok: false,
				error:
					"No se pudo conectar con el servicio de visitas. Verifica la configuración de Supabase.",
			};
		}
	});
