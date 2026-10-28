/**
 * Utilidades compartidas de las server functions de alquileres y cobros.
 *
 * ⚠️ SOLO SERVIDOR. Toda lectura/escritura usa el cliente de cookies con RLS;
 * la service role no interviene en este módulo. Las URLs de contratos y
 * comprobantes se firman en el servidor porque los buckets son privados.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
	ESTADO_ALQUILER_DB_A_UI,
	ESTADO_COMISION_DB_A_UI,
	estadoCuotaDesdeVista,
	MEDIO_PAGO_DB_A_UI,
} from "@/lib/alquileres";
import { getSupabaseServer } from "@/lib/supabase/server";
import { fechaInputLaPaz, mensajeDeError } from "@/server/admin/shared";
import type { AlquilerDetalleVista } from "@/types/alquileres";
import type { Database } from "@/types/database.types";
import type {
	AlquilerDetalle as AlquilerFila,
	ComisionVendedor,
	CuotaEstado,
	PagoRow,
	RolDb,
} from "@/types/domain";
import type {
	AlquilerDetalleUI,
	Cliente,
	EstadoCuota,
	Inmueble,
	MedioPago,
	Pago,
	Vendedor,
} from "@/types/models";

export type ClienteDb = SupabaseClient<Database>;

const IMAGEN_FALLBACK =
	"https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1400&q=70";

const EXPIRACION_URL_FIRMADA = 60 * 60; // 1 hora

/* ----------------------------- Autorización ----------------------------- */

export interface ActorAlquiler {
	id: string;
	rol: RolDb;
	supabase: ClienteDb;
}

/** Comprueba sesión y perfil activo; devuelve el cliente de cookies. */
export async function requireActor(): Promise<ActorAlquiler> {
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
		throw new Error("No se pudo comprobar tu perfil.");
	}

	if (!perfil?.activo) {
		throw new Error("Tu cuenta está inactiva. Contacta al administrador.");
	}

	return { id: user.id, rol: perfil.rol, supabase };
}

/* ------------------------------ Errores --------------------------------- */

/**
 * Las RPC lanzan mensajes de negocio en español. Se conservan cuando son
 * seguros para el usuario y se cae al mapeo genérico en errores técnicos.
 */
export function mensajeDeErrorRpc(error: {
	code?: string;
	message?: string;
}): string {
	const mensaje = error.message?.trim();
	if (
		mensaje &&
		!/^(duplicate key|foreign key|violates|new row|update or delete|null value)/i.test(
			mensaje,
		) &&
		mensaje.length <= 240
	) {
		return mensaje;
	}
	return mensajeDeError(error);
}

/* --------------------------- URLs firmadas ------------------------------- */

type BucketPrivado = "contratos" | "comprobantes";

async function firmarUrls(
	supabase: ClienteDb,
	bucket: BucketPrivado,
	paths: Array<string | null | undefined>,
): Promise<Map<string, string>> {
	const unicos = [
		...new Set(paths.filter((path): path is string => Boolean(path?.trim()))),
	];
	if (unicos.length === 0) return new Map();

	const { data, error } = await supabase.storage
		.from(bucket)
		.createSignedUrls(unicos, EXPIRACION_URL_FIRMADA);

	if (error) {
		console.warn(
			`[alquileres] No se pudieron firmar URLs de ${bucket}:`,
			error.message,
		);
		return new Map();
	}

	return new Map(
		(data ?? [])
			.filter(
				(item): item is typeof item & { path: string; signedUrl: string } =>
					Boolean(item.path && item.signedUrl),
			)
			.map((item) => [item.path, item.signedUrl]),
	);
}

/* ----------------------------- Mapeos UI -------------------------------- */

type PagoVista = Pick<
	PagoRow,
	| "id"
	| "alquiler_id"
	| "cuota_id"
	| "monto"
	| "medio"
	| "fecha_pago"
	| "comprobante_path"
	| "registrado_por"
>;

function aPago(
	cuota: CuotaEstado,
	pago: PagoVista | undefined,
	comprobantes: Map<string, string>,
): Pago {
	const montoBase = Number(cuota.monto);
	const monto = Number(cuota.monto_total);

	return {
		id: cuota.id,
		alquilerId: cuota.alquiler_id,
		numeroCuota: cuota.numero,
		periodo: fechaInputLaPaz(cuota.fecha_vencimiento).slice(0, 7),
		montoBase,
		recargoMora: Math.max(0, monto - montoBase),
		monto,
		fechaVencimiento: fechaInputLaPaz(cuota.fecha_vencimiento),
		fechaPago: pago ? fechaInputLaPaz(pago.fecha_pago) : null,
		medioPago: pago ? MEDIO_PAGO_DB_A_UI[pago.medio] : null,
		estado: estadoCuotaDesdeVista(cuota.estado),
		comprobante: pago?.comprobante_path
			? (comprobantes.get(pago.comprobante_path) ?? null)
			: null,
		registradoPor: pago?.registrado_por ?? null,
	};
}

function aInmuebleDesdeAlquiler(
	fila: AlquilerFila,
	estado: Inmueble["estado"],
): Inmueble {
	return {
		id: fila.inmueble_id,
		codigo: fila.inmueble_codigo,
		titulo: fila.inmueble_titulo,
		tipo: "Casa",
		estado,
		destacado: false,
		precio: Number(fila.monto_mensual),
		zona: fila.zona_nombre?.trim() || "Potosí",
		direccion: fila.inmueble_direccion,
		m2: 0,
		habitaciones: 0,
		banos: 0,
		estacionamientos: 0,
		piso: null,
		descripcion: "",
		fechaDisponibilidad: fila.created_at,
		costoPublicacion: 0,
		imagenes: [fila.inmueble_portada_url ?? IMAGEN_FALLBACK],
		amenidades: [],
		proveedorId: "",
		vendedorId: fila.vendedor_id,
		publicadoEl: fila.created_at,
		visitasMes: 0,
		amoblado: false,
	};
}

function aClienteDesdeAlquiler(fila: AlquilerFila): Cliente {
	return {
		id: fila.cliente_id,
		nombre: fila.cliente_nombre?.trim() || fila.cliente_correo,
		email: fila.cliente_correo,
		telefonoContacto: fila.cliente_telefono?.trim() || "Sin registrar",
		estado: "Activo",
		avatarUrl: "",
		desde: fila.created_at,
	};
}

function aVendedorDesdeAlquiler(fila: AlquilerFila): Vendedor | undefined {
	if (!fila.vendedor_id) return undefined;
	return {
		id: fila.vendedor_id,
		nombre: fila.vendedor_nombre?.trim() || "Agente RE/MAX",
		email: "",
		telefono: "",
		zona: "",
		comisionFija: Number(fila.comision_monto),
		alquileresCerrados: 0,
		estado: "Activo",
		avatarUrl: "",
		cargo: "Agente comercial",
		ingresoEl: fila.created_at,
	};
}

function aAlquilerDetalle(
	fila: AlquilerFila,
	pagos: Pago[],
	contratoUrl: string | null,
): AlquilerDetalleVista {
	const estado = ESTADO_ALQUILER_DB_A_UI[fila.estado];
	const cuotaActual = fila.proxima_cuota_id
		? pagos.find((pago) => pago.id === fila.proxima_cuota_id)
		: undefined;

	const detalle: AlquilerDetalleUI & { contratoUrl: string | null } = {
		id: fila.id,
		codigo: fila.numero_contrato,
		inmuebleId: fila.inmueble_id,
		clienteId: fila.cliente_id,
		vendedorId: fila.vendedor_id,
		fechaInicio: fila.fecha_inicio,
		fechaFin: fila.fecha_fin,
		montoMensual: Number(fila.monto_mensual),
		diaCobro: fila.dia_cobro,
		deposito: Number(fila.deposito),
		comisionFija: Number(fila.comision_monto),
		estado,
		contratoEscaneado: Boolean(fila.contrato_path),
		inmueble: aInmuebleDesdeAlquiler(
			fila,
			estado === "Vigente" ? "En alquiler" : "Inactivo",
		),
		cliente: aClienteDesdeAlquiler(fila),
		vendedor: aVendedorDesdeAlquiler(fila),
		cuotaActual,
		pagos,
		contratoUrl,
	};

	return detalle;
}

/* --------------------------- Carga principal ----------------------------- */

export interface FiltroAlquileres {
	clienteId?: string;
	vendedorId?: string;
}

/**
 * Carga la vista de alquileres con sus cuotas, pagos y URLs firmadas. El RLS
 * decide qué filas ve el actor; el filtro solo optimiza el caso de panel.
 */
export async function cargarAlquileres(
	supabase: ClienteDb,
	filtro: FiltroAlquileres = {},
): Promise<AlquilerDetalleVista[]> {
	let consulta = supabase.from("v_alquileres_detalle").select("*");

	if (filtro.clienteId) {
		consulta = consulta.eq("cliente_id", filtro.clienteId);
	}
	if (filtro.vendedorId) {
		consulta = consulta.eq("vendedor_id", filtro.vendedorId);
	}

	const { data: filas, error } = await consulta.order("fecha_inicio", {
		ascending: false,
	});

	if (error) throw error;

	const alquileres = filas ?? [];
	const ids = alquileres.map((fila) => fila.id);
	if (ids.length === 0) return [];

	const [cuotasResult, pagosResult] = await Promise.all([
		supabase
			.from("v_cuotas_estado")
			.select("*")
			.in("alquiler_id", ids)
			.order("numero", { ascending: true }),
		supabase
			.from("pagos")
			.select(
				"id, alquiler_id, cuota_id, monto, medio, fecha_pago, comprobante_path, registrado_por",
			)
			.in("alquiler_id", ids)
			.order("fecha_pago", { ascending: true }),
	]);

	if (cuotasResult.error) throw cuotasResult.error;
	if (pagosResult.error) throw pagosResult.error;

	const pagos = pagosResult.data ?? [];
	const [contratos, comprobantes] = await Promise.all([
		firmarUrls(
			supabase,
			"contratos",
			alquileres.map((fila) => fila.contrato_path),
		),
		firmarUrls(
			supabase,
			"comprobantes",
			pagos.map((pago) => pago.comprobante_path),
		),
	]);

	const pagoPorCuota = new Map<string, PagoVista>();
	for (const pago of pagos) {
		if (pago.cuota_id) pagoPorCuota.set(pago.cuota_id, pago);
	}

	const cuotasPorAlquiler = new Map<string, CuotaEstado[]>();
	for (const cuota of cuotasResult.data ?? []) {
		const lista = cuotasPorAlquiler.get(cuota.alquiler_id) ?? [];
		lista.push(cuota);
		cuotasPorAlquiler.set(cuota.alquiler_id, lista);
	}

	return alquileres.map((fila) => {
		const pagosMapeados = (cuotasPorAlquiler.get(fila.id) ?? []).map((cuota) =>
			aPago(cuota, pagoPorCuota.get(cuota.id), comprobantes),
		);
		return aAlquilerDetalle(
			fila,
			pagosMapeados,
			fila.contrato_path ? (contratos.get(fila.contrato_path) ?? null) : null,
		);
	});
}

/* ----------------------------- Comisiones -------------------------------- */

export function aComisionVista(fila: ComisionVendedor) {
	return {
		id: fila.id,
		alquilerId: fila.alquiler_id,
		codigo: fila.numero_contrato,
		inmuebleCodigo: fila.inmueble_codigo,
		inmuebleTitulo: fila.inmueble_titulo,
		clienteNombre: fila.cliente_nombre?.trim() || "Cliente sin nombre",
		monto: Number(fila.monto),
		fecha: fechaInputLaPaz(fila.fecha),
		estado: ESTADO_COMISION_DB_A_UI[fila.estado],
	};
}

/* --------------------------- Tipos auxiliares ---------------------------- */

export type { EstadoCuota, MedioPago };
