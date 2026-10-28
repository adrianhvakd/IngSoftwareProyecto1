/**
 * Subida de fotos de inmuebles desde el navegador.
 *
 * Usa el cliente público de Supabase con la sesión del administrador; las
 * políticas del bucket `inmuebles` permiten escribir a los administradores.
 * El servidor solo recibe las rutas y URLs resultantes.
 */

import { getSupabaseBrowser } from "@/lib/supabase/client";

const BUCKET = "inmuebles";
const LIMITE_BYTES = 8 * 1024 * 1024;
const TIPOS_PERMITIDOS = new Set([
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/avif",
]);

export interface ImagenSubida {
	path: string;
	url: string;
}

function sanitizar(nombre: string): string {
	return nombre
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-zA-Z0-9._-]/g, "-")
		.replace(/-+/g, "-")
		.slice(0, 80);
}

export async function subirImagenesInmueble(
	inmuebleId: string,
	archivos: File[],
): Promise<ImagenSubida[]> {
	if (archivos.length === 0) return [];

	for (const archivo of archivos) {
		if (!TIPOS_PERMITIDOS.has(archivo.type)) {
			throw new Error(
				`La foto «${archivo.name}» debe ser JPG, PNG, WEBP o AVIF.`,
			);
		}
		if (archivo.size > LIMITE_BYTES) {
			throw new Error(`La foto «${archivo.name}» supera los 8 MB.`);
		}
	}

	const supabase = getSupabaseBrowser();
	const subidas: ImagenSubida[] = [];

	try {
		for (const archivo of archivos) {
			const nombre = `${crypto.randomUUID()}-${sanitizar(archivo.name)}`;
			const path = `${inmuebleId}/${nombre}`;

			const { error } = await supabase.storage
				.from(BUCKET)
				.upload(path, archivo, {
					cacheControl: "31536000",
					upsert: false,
					contentType: archivo.type,
				});

			if (error) {
				throw new Error(`No se pudo subir «${archivo.name}»: ${error.message}`);
			}

			const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
			subidas.push({ path, url: data.publicUrl });
		}

		return subidas;
	} catch (error) {
		if (subidas.length > 0) {
			await supabase.storage
				.from(BUCKET)
				.remove(subidas.map((imagen) => imagen.path));
		}
		throw error;
	}
}

export async function eliminarImagenesInmueble(paths: string[]) {
	if (paths.length === 0) return;
	const supabase = getSupabaseBrowser();
	const { error } = await supabase.storage.from(BUCKET).remove(paths);
	if (error) {
		console.warn("[storage] No se pudieron borrar fotos:", error.message);
	}
}

/* ---------------------- Archivos privados de alquiler -------------------- */

const TIPOS_CONTRATO = new Set(["application/pdf"]);
const TIPOS_COMPROBANTE = new Set([
	"application/pdf",
	"image/jpeg",
	"image/png",
	"image/webp",
]);
const LIMITE_CONTRATO = 15 * 1024 * 1024;
const LIMITE_COMPROBANTE = 10 * 1024 * 1024;

async function subirArchivoPrivado(
	bucket: "contratos" | "comprobantes",
	alquilerId: string,
	archivo: File,
	prefijo: string,
): Promise<string> {
	const esContrato = bucket === "contratos";
	const permitidos = esContrato ? TIPOS_CONTRATO : TIPOS_COMPROBANTE;
	const limite = esContrato ? LIMITE_CONTRATO : LIMITE_COMPROBANTE;

	if (!permitidos.has(archivo.type)) {
		throw new Error(
			esContrato
				? "El contrato debe ser un PDF."
				: "El comprobante debe ser PDF, JPG, PNG o WEBP.",
		);
	}

	if (archivo.size > limite) {
		throw new Error(
			`El archivo «${archivo.name}» supera el límite de ${Math.round(
				limite / (1024 * 1024),
			)} MB.`,
		);
	}

	const supabase = getSupabaseBrowser();
	const nombre = `${prefijo}-${crypto.randomUUID()}-${sanitizar(archivo.name)}`;
	const path = `${alquilerId}/${nombre}`;

	const { error } = await supabase.storage.from(bucket).upload(path, archivo, {
		cacheControl: "3600",
		upsert: false,
		contentType: archivo.type,
	});

	if (error) {
		throw new Error(`No se pudo subir «${archivo.name}»: ${error.message}`);
	}

	return path;
}

/** Sube el contrato firmado al bucket privado. Solo se llama al finalizar. */
export function subirContratoAlquiler(
	alquilerId: string,
	archivo: File,
): Promise<string> {
	return subirArchivoPrivado("contratos", alquilerId, archivo, "contrato");
}

/** Sube el comprobante del cobro de cierre al bucket privado. */
export function subirComprobanteAlquiler(
	alquilerId: string,
	archivo: File,
): Promise<string> {
	return subirArchivoPrivado("comprobantes", alquilerId, archivo, "cierre");
}

/** Sube el comprobante de una cuota desde el panel de cobros. */
export function subirComprobanteCuota(
	alquilerId: string,
	archivo: File,
): Promise<string> {
	return subirArchivoPrivado("comprobantes", alquilerId, archivo, "cuota");
}

/** Limpia archivos privados si una operación posterior falla. */
export async function eliminarArchivosAlquiler(
	bucket: "contratos" | "comprobantes",
	paths: string[],
) {
	if (paths.length === 0) return;
	const supabase = getSupabaseBrowser();
	const { error } = await supabase.storage.from(bucket).remove(paths);
	if (error) {
		console.warn(
			`[storage] No se pudieron borrar archivos de ${bucket}:`,
			error.message,
		);
	}
}
