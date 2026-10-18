import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const Route = createFileRoute("/vendedor")({
	head: () => ({
		meta: [
			{ title: "Panel vendedor · RE/MAX Potosí" },
			{ name: "robots", content: "noindex" },
		],
	}),
	component: VendedorLayout,
});

function VendedorLayout() {
	return (
		<DashboardShell rol="Vendedor">
			<Outlet />
		</DashboardShell>
	);
}
