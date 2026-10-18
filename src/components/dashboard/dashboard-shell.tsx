import type { ReactNode } from "react";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import type { Rol } from "@/data/types";

/** Estructura común de los paneles (admin, vendedor, cliente). */
export function DashboardShell({
	rol,
	children,
}: {
	rol: Rol;
	children: ReactNode;
}) {
	return (
		<SidebarProvider>
			<DashboardSidebar rol={rol} />
			<SidebarInset>
				<DashboardTopbar rol={rol} />
				<div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">{children}</div>
			</SidebarInset>
			<Toaster position="top-right" richColors closeButton />
		</SidebarProvider>
	);
}
