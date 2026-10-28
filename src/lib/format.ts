/** Formato de moneda (Bs), números y fechas en es-BO. */

const numberFormatter = new Intl.NumberFormat("es-BO", {
	maximumFractionDigits: 0,
});

export function formatNumber(value: number): string {
	return numberFormatter.format(value);
}

/** Ej: Bs 2.500 */
export function formatBs(value: number): string {
	return `Bs ${numberFormatter.format(value)}`;
}

/** Ej: Bs 2.500 / mes */
export function formatBsMes(value: number): string {
	return `Bs ${numberFormatter.format(value)} / mes`;
}

function formatDate(
	value: string,
	options: Intl.DateTimeFormatOptions,
): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	const opciones = { timeZone: "America/La_Paz", ...options };
	try {
		return new Intl.DateTimeFormat("es-BO", opciones).format(date);
	} catch {
		return new Intl.DateTimeFormat("es-ES", opciones).format(date);
	}
}

/** Día calendario en La Paz (YYYY-MM-DD) para agrupar fechas sin desfase. */
export function fechaDiaLaPaz(value: string): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value.slice(0, 10);
	const partes = new Intl.DateTimeFormat("en-CA", {
		timeZone: "America/La_Paz",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(date);
	const valor = (tipo: string) =>
		partes.find((parte) => parte.type === tipo)?.value ?? "";
	return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

/** Ej: 5 de octubre de 2026 */
export function formatFechaLarga(value: string): string {
	return formatDate(value, {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

/** Ej: 5 oct 2026 */
export function formatFecha(value: string): string {
	return formatDate(value, {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

/** Ej: 18 oct */
export function formatFechaCorta(value: string): string {
	return formatDate(value, { day: "2-digit", month: "short" });
}

/** Ej: dom 18 oct */
export function formatFechaSemana(value: string): string {
	return formatDate(value, {
		weekday: "short",
		day: "2-digit",
		month: "short",
	});
}

/** Ej: 18 oct 2026 · 10:00 */
export function formatFechaHora(value: string): string {
	return formatDate(value, {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
}

/** Ej: 10:00 */
export function formatHora(value: string): string {
	return formatDate(value, {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
}

/** Ej: octubre 2026 */
export function formatPeriodo(periodo: string): string {
	const [year, month] = periodo.split("-").map(Number);
	if (!year || !month) return periodo;
	const date = new Date(Date.UTC(year, month - 1, 1, 12));
	const label = formatDate(date.toISOString(), {
		month: "long",
		year: "numeric",
	});
	return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Iniciales para avatares de respaldo. */
export function iniciales(nombre: string): string {
	return nombre
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((parte) => parte[0]?.toUpperCase() ?? "")
		.join("");
}
