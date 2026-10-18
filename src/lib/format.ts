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
	try {
		return new Intl.DateTimeFormat("es-BO", options).format(date);
	} catch {
		return new Intl.DateTimeFormat("es-ES", options).format(date);
	}
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
	const date = new Date(year, month - 1, 1);
	const label = formatDate(date.toISOString(), {
		month: "long",
		year: "numeric",
	});
	return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Ej: hace 3 días / en 5 días / hoy */
export function formatRelativo(value: string): string {
	const target = new Date(value);
	const now = new Date("2026-10-17T12:00:00");
	const diffDays = Math.round(
		(target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
	);
	if (diffDays === 0) return "hoy";
	if (diffDays === 1) return "mañana";
	if (diffDays === -1) return "ayer";
	if (diffDays > 0) return `en ${diffDays} días`;
	return `hace ${Math.abs(diffDays)} días`;
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
