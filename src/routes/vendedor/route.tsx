import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { rutaPanel } from "@/lib/auth";

export const Route = createFileRoute("/vendedor")({
	beforeLoad: ({ context }) => {
		const sesion = context.sesion;

		if (!sesion) throw redirect({ to: "/ingresar" });
		if (sesion.debeCambiarPassword) {
			throw redirect({ to: "/cambiar-password" });
		}
		if (sesion.rol !== "vendedor") {
			throw redirect({ to: rutaPanel(sesion.rol) });
		}

		return { sesion };
	},
	head: () => ({
		meta: [
			{ title: "Panel vendedor · RE/MAX Potosí" },
			{ name: "robots", content: "noindex" },
		],
	}),
	component: VendedorLayout,
});

function VendedorLayout() {
	const { sesion } = Route.useRouteContext();

	return (
		<DashboardShell sesion={sesion}>
			<Outlet />
		</DashboardShell>
	);
}
