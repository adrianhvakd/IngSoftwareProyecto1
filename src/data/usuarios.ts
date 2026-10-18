import type { Usuario } from "./types";

/** Cuentas de la plataforma (HU-01). Datos ficticios. */
export const usuarios: Usuario[] = [
	{
		id: "usr-001",
		nombre: "Rodrigo Álvarez Paredes",
		email: "rodrigo.alvarez@remaxpotosi.bo",
		telefono: "+591 71234567",
		rol: "Administrador",
		estado: "Activo",
		avatarUrl:
			"https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=70",
		creadoEl: "2024-01-12",
	},
	{
		id: "usr-002",
		nombre: "Carla Mendoza Vaca",
		email: "carla.mendoza@remaxpotosi.bo",
		telefono: "+591 72345678",
		rol: "Vendedor",
		estado: "Activo",
		avatarUrl:
			"https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=70",
		creadoEl: "2024-02-03",
	},
	{
		id: "usr-003",
		nombre: "Jorge Villarroel Ríos",
		email: "jorge.villarroel@remaxpotosi.bo",
		telefono: "+591 73456789",
		rol: "Vendedor",
		estado: "Activo",
		avatarUrl:
			"https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=70",
		creadoEl: "2024-02-19",
	},
	{
		id: "usr-004",
		nombre: "Verónica Colque Mamani",
		email: "veronica.colque@remaxpotosi.bo",
		telefono: "+591 74567890",
		rol: "Vendedor",
		estado: "Activo",
		avatarUrl:
			"https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=70",
		creadoEl: "2024-03-07",
	},
	{
		id: "usr-005",
		nombre: "Marcelo Arce Gutiérrez",
		email: "marcelo.arce@remaxpotosi.bo",
		telefono: "+591 75678901",
		rol: "Vendedor",
		estado: "Activo",
		avatarUrl:
			"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=70",
		creadoEl: "2024-04-22",
	},
	{
		id: "usr-006",
		nombre: "Natalia Quispe Fernández",
		email: "natalia.quispe@remaxpotosi.bo",
		telefono: "+591 76789012",
		rol: "Vendedor",
		estado: "Inactivo",
		avatarUrl:
			"https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=70",
		creadoEl: "2024-05-30",
	},
	{
		id: "usr-007",
		nombre: "Luis Fernando Catari Choque",
		email: "luis.catari@gmail.com",
		telefono: "+591 67890123",
		rol: "Cliente",
		estado: "Activo",
		avatarUrl:
			"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=70",
		creadoEl: "2025-06-15",
	},
	{
		id: "usr-008",
		nombre: "Andrea Salinas Tórrez",
		email: "andrea.salinas@outlook.com",
		telefono: "+591 68901234",
		rol: "Cliente",
		estado: "Activo",
		avatarUrl:
			"https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=70",
		creadoEl: "2025-07-02",
	},
	{
		id: "usr-009",
		nombre: "Roberto Choque Huanca",
		email: "roberto.choque@gmail.com",
		telefono: "+591 69012345",
		rol: "Cliente",
		estado: "Activo",
		avatarUrl:
			"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=70",
		creadoEl: "2025-08-19",
	},
	{
		id: "usr-010",
		nombre: "María Fernanda Encinas Rocha",
		email: "mafer.encinas@gmail.com",
		telefono: "+591 70123456",
		rol: "Cliente",
		estado: "Activo",
		avatarUrl:
			"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=70",
		creadoEl: "2025-09-04",
	},
	{
		id: "usr-011",
		nombre: "Gonzalo Paredes Vargas",
		email: "gonzalo.paredes@hotmail.com",
		telefono: "+591 70234567",
		rol: "Cliente",
		estado: "Inactivo",
		avatarUrl:
			"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=70",
		creadoEl: "2025-09-27",
	},
	{
		id: "usr-012",
		nombre: "Daniela Aramayo Limachi",
		email: "daniela.aramayo@gmail.com",
		telefono: "+591 70345678",
		rol: "Cliente",
		estado: "Activo",
		avatarUrl:
			"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=70",
		creadoEl: "2025-10-11",
	},
];

/** Usuario "en sesión" para las vistas de panel del prototipo. */
export const usuarioActual = usuarios[0];
