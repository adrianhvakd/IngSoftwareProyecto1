/**
 * Escrituras de alquileres y pagos.
 *
 * ⚠️ SOLO SERVIDOR. Las reglas de negocio viven en las RPC atómicas
 * `registrar_alquiler` y `registrar_pago_cuota`; este módulo solo valida la
 * entrada, comprueba el rol y firma el resultado con el cliente de cookies.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { mensajeDeErrorRpc, requireActor } from "./shared";

const fechaSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const pagoCierreSchema = z.object({
	monto: z.number().positive().max(1_000_000_000),
	medio: z.enum(["tarjeta", "qr", "efectivo", "otro"]),
	comprobantePath: z.string().trim().min(1).max(500),
});

const registrarAlquilerSchema = z.object({
	alquilerId: z.string().uuid(),
	clienteId: z.string().uuid(),
	vendedorId: z.string().uuid(),
	inmuebleId: z.string().uuid(),
	montoMensual: z.number().positive().max(1_000_000_000),
	fechaInicio: fechaSchema,
	duracionMeses: z.number().int().min(1).max(120),
	diaCobro: z.number().int().min(1).max(28),
	deposito: z.number().min(0).max(1_000_000_000),
	contratoPath: z.string().trim().min(1).max(500),
	pagoCierre: pagoCierreSchema,
});

const registrarPagoSchema = z.object({
	alquilerId: z.string().uuid(),
	cuotaId: z.string().uuid(),
	monto: z.number().positive().max(1_000_000_000),
	medio: z.enum(["tarjeta", "qr", "efectivo", "otro"]),
	comprobantePath: z.string().trim().max(500).optional().nullable(),
});

function validarRuta(path: string, alquilerId: string, etiqueta: string): void {
	if (!path.startsWith(`${alquilerId}/`)) {
		throw new Error(`La ruta del ${etiqueta} no pertenece a este alquiler.`);
	}
}

export const registrarAlquiler = createServerFn({ method: "POST" })
	.validator(registrarAlquilerSchema)
	.handler(async ({ data }) => {
		const actor = await requireActor();

		if (actor.rol !== "administrador" && actor.rol !== "vendedor") {
			throw new Error("No tienes permisos para cerrar alquileres.");
		}

		if (actor.rol === "vendedor" && actor.id !== data.vendedorId) {
			throw new Error("Solo puedes cerrar alquileres a tu nombre.");
		}

		validarRuta(data.contratoPath, data.alquilerId, "contrato");
		validarRuta(
			data.pagoCierre.comprobantePath,
			data.alquilerId,
			"comprobante",
		);

		const fechaInicio = new Date(`${data.fechaInicio}T00:00:00-04:00`);
		if (Number.isNaN(fechaInicio.getTime())) {
			throw new Error("La fecha de inicio no es válida.");
		}

		const { data: alquilerId, error } = await actor.supabase.rpc(
			"registrar_alquiler",
			{
				p_alquiler_id: data.alquilerId,
				p_cliente_id: data.clienteId,
				p_vendedor_id: data.vendedorId,
				p_inmueble_id: data.inmuebleId,
				p_monto_mensual: data.montoMensual,
				p_fecha_inicio: fechaInicio.toISOString(),
				p_duracion_meses: data.duracionMeses,
				p_contrato_path: data.contratoPath,
				p_pago_cierre: {
					monto: data.pagoCierre.monto,
					medio: data.pagoCierre.medio,
					comprobante_path: data.pagoCierre.comprobantePath,
				},
				p_deposito: data.deposito,
				p_dia_cobro: data.diaCobro,
			},
		);

		if (error) {
			throw new Error(mensajeDeErrorRpc(error));
		}

		const { data: contrato, error: contratoError } = await actor.supabase
			.from("v_alquileres_detalle")
			.select("numero_contrato")
			.eq("id", alquilerId)
			.maybeSingle();

		if (contratoError) {
			console.warn(
				"[alquileres] El contrato se registró pero no se pudo leer su número:",
				contratoError.message,
			);
		}

		return {
			alquilerId,
			numeroContrato: contrato?.numero_contrato ?? "Contrato registrado",
		};
	});

export const registrarPagoCuota = createServerFn({ method: "POST" })
	.validator(registrarPagoSchema)
	.handler(async ({ data }) => {
		const actor = await requireActor();

		if (actor.rol !== "administrador" && actor.rol !== "vendedor") {
			throw new Error("No tienes permisos para registrar pagos.");
		}

		if (data.comprobantePath) {
			validarRuta(data.comprobantePath, data.alquilerId, "comprobante");
		}

		const { data: pagoId, error } = await actor.supabase.rpc(
			"registrar_pago_cuota",
			{
				p_alquiler_id: data.alquilerId,
				p_cuota_id: data.cuotaId,
				p_monto: data.monto,
				p_medio: data.medio,
				p_comprobante_path: data.comprobantePath ?? null,
				p_registrado_por: actor.id,
			},
		);

		if (error) {
			throw new Error(mensajeDeErrorRpc(error));
		}

		return { pagoId };
	});

/**
 * Pago reportado por el cliente desde su panel. La RPC permite al cliente del
 * alquiler registrar el pago; queda `validado = false` para revisión del
 * vendedor/administrador.
 */
export const reportarPagoCliente = createServerFn({ method: "POST" })
	.validator(
		z.object({
			alquilerId: z.string().uuid(),
			cuotaId: z.string().uuid(),
			monto: z.number().positive().max(1_000_000_000),
		}),
	)
	.handler(async ({ data }) => {
		const actor = await requireActor();

		if (actor.rol !== "cliente") {
			throw new Error("Solo el cliente del contrato puede reportar este pago.");
		}

		const { data: pagoId, error } = await actor.supabase.rpc(
			"registrar_pago_cuota",
			{
				p_alquiler_id: data.alquilerId,
				p_cuota_id: data.cuotaId,
				p_monto: data.monto,
				p_medio: "qr",
				p_comprobante_path: null,
				p_registrado_por: actor.id,
			},
		);

		if (error) {
			throw new Error(mensajeDeErrorRpc(error));
		}

		return { pagoId };
	});
