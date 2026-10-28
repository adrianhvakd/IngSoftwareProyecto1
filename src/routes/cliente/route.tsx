import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { rutaPanel } from "@/lib/auth";

export const Route = createFileRoute("/cliente")({
	beforeLoad: ({ context }) => {
		const sesion = context.sesion;

		if (!sesion) throw redirect({ to: "/ingresar" });
		if (sesion.debeCambiarPassword) {
			throw redirect({ to: "/cambiar-password" });
		}
		if (sesion.rol !== "cliente") {
			throw redirect({ to: rutaPanel(sesion.rol) });
		}

		return { sesion };
	},
	head: () => ({
		meta: [
			{ title: "Mi cuenta · RE/MAX Potosí" },
			{ name: "robots", content: "noindex" },
		],
	}),
	component: ClienteLayout,
});

function ClienteLayout() {
	const { sesion } = Route.useRouteContext();

	return (
		<DashboardShell sesion={sesion}>
			<Outlet />
		</DashboardShell>
	);
}
