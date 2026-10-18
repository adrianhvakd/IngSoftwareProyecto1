import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const Route = createFileRoute("/cliente")({
	head: () => ({
		meta: [
			{ title: "Mi cuenta · RE/MAX Potosí" },
			{ name: "robots", content: "noindex" },
		],
	}),
	component: ClienteLayout,
});

function ClienteLayout() {
	return (
		<DashboardShell rol="Cliente">
			<Outlet />
		</DashboardShell>
	);
}
