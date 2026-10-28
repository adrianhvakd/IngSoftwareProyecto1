import type { ReactNode } from "react";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { etiquetaRol, type SesionUsuario } from "@/lib/auth";

/** Estructura común de los paneles (admin, vendedor, cliente). */
export function DashboardShell({
	sesion,
	children,
}: {
	sesion: SesionUsuario;
	children: ReactNode;
}) {
	const rol = etiquetaRol(sesion.rol);

	return (
		<SidebarProvider>
			<DashboardSidebar rol={rol} sesion={sesion} />
			<SidebarInset>
				<DashboardTopbar rol={rol} sesion={sesion} />
				<div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">{children}</div>
			</SidebarInset>
			<Toaster position="top-right" richColors closeButton />
		</SidebarProvider>
	);
}
