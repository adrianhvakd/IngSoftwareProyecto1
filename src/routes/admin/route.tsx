import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const Route = createFileRoute("/admin")({
	head: () => ({
		meta: [
			{ title: "Panel administrador · RE/MAX Potosí" },
			{ name: "robots", content: "noindex" },
		],
	}),
	component: AdminLayout,
});

function AdminLayout() {
	return (
		<DashboardShell rol="Administrador">
			<Outlet />
		</DashboardShell>
	);
}
