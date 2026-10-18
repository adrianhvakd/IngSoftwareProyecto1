/** Datos de la oficina (ficticios, claramente de ejemplo). */
export const oficina = {
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
	metricas: [
		{ etiqueta: "Inmuebles publicados", valor: 340, sufijo: "+" },
		{ etiqueta: "Alquileres gestionados", valor: 1280, sufijo: "+" },
		{ etiqueta: "Agentes certificados", valor: 24, sufijo: "" },
		{ etiqueta: "Años en Potosí", valor: 12, sufijo: "" },
	],
} as const;

/** Franjas horarias para agendar visitas (Detalle de inmueble). */
export const franjasVisita = [
	{ id: "09:00", hora: "09:00 – 10:00", disponible: true },
	{ id: "10:00", hora: "10:00 – 11:00", disponible: true },
	{ id: "11:00", hora: "11:00 – 12:00", disponible: false },
	{ id: "15:00", hora: "15:00 – 16:00", disponible: true },
	{ id: "16:00", hora: "16:00 – 17:00", disponible: true },
	{ id: "17:00", hora: "17:00 – 18:00", disponible: false },
] as const;
