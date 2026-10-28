import type { LucideIcon } from "lucide-react";
import {
	Building2,
	CalendarCheck,
	ClipboardList,
	FileSignature,
	HandCoins,
	Handshake,
	LayoutDashboard,
	ReceiptText,
	UserCog,
	Users,
	Wallet,
} from "lucide-react";
import type { Rol } from "@/types/models";

export interface NavItem {
	title: string;
	to: string;
	icon: LucideIcon;
	/** Solo activo con coincidencia exacta de ruta. */
	exact?: boolean;
}

export interface NavGroup {
	label: string;
	items: NavItem[];
}

export const NAV_ADMIN: NavGroup[] = [
	{
		label: "General",
		items: [
			{ title: "Dashboard", to: "/admin", icon: LayoutDashboard, exact: true },
		],
	},
	{
		label: "Gestión de alquileres",
		items: [
			{ title: "Inmuebles", to: "/admin/inmuebles", icon: Building2 },
			{ title: "Visitas", to: "/admin/visitas", icon: CalendarCheck },
			{
				title: "Alquileres y cobros",
				to: "/admin/alquileres",
				icon: ReceiptText,
			},
		],
	},
	{
		label: "Administración",
		items: [
			{ title: "Usuarios", to: "/admin/usuarios", icon: Users },
			{ title: "Vendedores", to: "/admin/vendedores", icon: UserCog },
			{ title: "Proveedores", to: "/admin/proveedores", icon: Handshake },
		],
	},
];

export const NAV_VENDEDOR: NavGroup[] = [
	{
		label: "General",
		items: [
			{ title: "Inicio", to: "/vendedor", icon: LayoutDashboard, exact: true },
		],
	},
	{
		label: "Operación",
		items: [
			{
				title: "Cierre de alquiler",
				to: "/vendedor/cierre-alquiler",
				icon: FileSignature,
			},
			{ title: "Registrar pago", to: "/vendedor/registrar-pago", icon: Wallet },
			{ title: "Mis visitas", to: "/vendedor/visitas", icon: CalendarCheck },
		],
	},
	{
		label: "Ingresos",
		items: [
			{ title: "Comisiones", to: "/vendedor/comisiones", icon: HandCoins },
		],
	},
];

export const NAV_CLIENTE: NavGroup[] = [
	{
		label: "Mi cuenta",
		items: [
			{
				title: "Mis visitas",
				to: "/cliente",
				icon: ClipboardList,
				exact: true,
			},
			{ title: "Mi alquiler", to: "/cliente/mi-alquiler", icon: ReceiptText },
		],
	},
];

export function navParaRol(rol: Rol): NavGroup[] {
	if (rol === "Vendedor") return NAV_VENDEDOR;
	if (rol === "Cliente") return NAV_CLIENTE;
	return NAV_ADMIN;
}
