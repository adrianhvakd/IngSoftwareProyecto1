import type { Vendedor } from "./types";

/** Equipo de ventas (HU-02). Comisión fija en Bs por alquiler cerrado. Datos ficticios. */
export const vendedores: Vendedor[] = [
	{
		id: "vnd-001",
		nombre: "Carla Mendoza Vaca",
		email: "carla.mendoza@remaxpotosi.bo",
		telefono: "+591 72345678",
		zona: "Centro histórico · Av. Villazón",
		comisionFija: 850,
		alquileresCerrados: 34,
		estado: "Activo",
		avatarUrl:
			"https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=70",
		cargo: "Agente sénior",
		ingresoEl: "2024-02-03",
	},
	{
		id: "vnd-002",
		nombre: "Jorge Villarroel Ríos",
		email: "jorge.villarroel@remaxpotosi.bo",
		telefono: "+591 73456789",
		zona: "Zona Universitaria · Pailaviri",
		comisionFija: 780,
		alquileresCerrados: 27,
		estado: "Activo",
		avatarUrl:
			"https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=70",
		cargo: "Agente comercial",
		ingresoEl: "2024-02-19",
	},
	{
		id: "vnd-003",
		nombre: "Verónica Colque Mamani",
		email: "veronica.colque@remaxpotosi.bo",
		telefono: "+591 74567890",
		zona: "San Clemente · Av. Las Banderas",
		comisionFija: 900,
		alquileresCerrados: 41,
		estado: "Activo",
		avatarUrl:
			"https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=70",
		cargo: "Agente sénior",
		ingresoEl: "2024-03-07",
	},
	{
		id: "vnd-004",
		nombre: "Marcelo Arce Gutiérrez",
		email: "marcelo.arce@remaxpotosi.bo",
		telefono: "+591 75678901",
		zona: "Av. Cívica · Ciudad Satélite",
		comisionFija: 720,
		alquileresCerrados: 19,
		estado: "Activo",
		avatarUrl:
			"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=70",
		cargo: "Agente comercial",
		ingresoEl: "2024-04-22",
	},
	{
		id: "vnd-005",
		nombre: "Natalia Quispe Fernández",
		email: "natalia.quispe@remaxpotosi.bo",
		telefono: "+591 76789012",
		zona: "Villa Imperial · Mercado Central",
		comisionFija: 800,
		alquileresCerrados: 12,
		estado: "Inactivo",
		avatarUrl:
			"https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=70",
		cargo: "Agente comercial",
		ingresoEl: "2024-05-30",
	},
];

export const vendedorActual = vendedores[0];
