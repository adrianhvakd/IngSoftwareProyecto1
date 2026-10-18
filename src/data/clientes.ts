import type { Cliente } from "./types";

/** Clientes (HU-04, HU-05). Datos ficticios con teléfono de contacto. */
export const clientes: Cliente[] = [
	{
		id: "cli-001",
		nombre: "Luis Fernando Catari Choque",
		email: "luis.catari@gmail.com",
		telefonoContacto: "+591 67890123",
		estado: "Activo",
		avatarUrl:
			"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=70",
		desde: "2025-06-15",
	},
	{
		id: "cli-002",
		nombre: "Andrea Salinas Tórrez",
		email: "andrea.salinas@outlook.com",
		telefonoContacto: "+591 68901234",
		estado: "Activo",
		avatarUrl:
			"https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=70",
		desde: "2025-07-02",
	},
	{
		id: "cli-003",
		nombre: "Roberto Choque Huanca",
		email: "roberto.choque@gmail.com",
		telefonoContacto: "+591 69012345",
		estado: "Activo",
		avatarUrl:
			"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=70",
		desde: "2025-08-19",
	},
	{
		id: "cli-004",
		nombre: "María Fernanda Encinas Rocha",
		email: "mafer.encinas@gmail.com",
		telefonoContacto: "+591 70123456",
		estado: "Activo",
		avatarUrl:
			"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=70",
		desde: "2025-09-04",
	},
	{
		id: "cli-005",
		nombre: "Gonzalo Paredes Vargas",
		email: "gonzalo.paredes@hotmail.com",
		telefonoContacto: "+591 70234567",
		estado: "Inactivo",
		avatarUrl:
			"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=70",
		desde: "2025-09-27",
	},
	{
		id: "cli-006",
		nombre: "Daniela Aramayo Limachi",
		email: "daniela.aramayo@gmail.com",
		telefonoContacto: "+591 70345678",
		estado: "Activo",
		avatarUrl:
			"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=70",
		desde: "2025-10-11",
	},
	{
		id: "cli-007",
		nombre: "Sergio Torrico Enríquez",
		email: "sergio.torrico@gmail.com",
		telefonoContacto: "+591 70456789",
		estado: "Activo",
		avatarUrl:
			"https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=200&q=70",
		desde: "2025-10-29",
	},
	{
		id: "cli-008",
		nombre: "Paola Betancourt Rivas",
		email: "paola.betancourt@gmail.com",
		telefonoContacto: "+591 70567890",
		estado: "Activo",
		avatarUrl:
			"https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=70",
		desde: "2025-11-14",
	},
];

export const clienteActual = clientes[0];
