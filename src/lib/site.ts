/**
 * Contenido institucional editable del sitio público.
 *
 * No son datos de negocio de Supabase: dirección, horarios y redes se
 * configuran aquí para no depender de variables de entorno ni de una tabla
 * administrativa que el prototipo no tiene.
 */
export const sitio = {
	nombre: "RE/MAX Potosí",
	eslogan: "Encuentra tu próximo hogar en Potosí",
	direccion:
		"Av. Villazón Nº 189, Edificio Los Ándes, piso 3 · Potosí, Bolivia",
	telefono: "+591 2 622 4455",
	whatsapp: "+591 71234567",
	email: "contacto@remaxpotosi.bo",
	horarios: [
		{ dias: "Lunes a Viernes", horas: "08:30 – 18:30" },
		{ dias: "Sábado", horas: "09:00 – 13:00" },
		{ dias: "Domingo y feriados", horas: "Cerrado" },
	],
	redes: [
		{ nombre: "Facebook", url: "https://facebook.com" },
		{ nombre: "Instagram", url: "https://instagram.com" },
		{ nombre: "TikTok", url: "https://tiktok.com" },
		{ nombre: "LinkedIn", url: "https://linkedin.com" },
	],
} as const;
