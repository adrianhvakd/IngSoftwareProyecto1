import { createFileRoute } from "@tanstack/react-router";
import { RentalClosingWizard } from "@/components/pickers/rental-closing-wizard";
import { obtenerOpcionesCierre } from "@/server/alquileres/opciones";

export const Route = createFileRoute("/admin/alquileres/nuevo")({
	loader: () => obtenerOpcionesCierre(),
	head: () => ({
		meta: [
			{
				title: "Registrar alquiler · Administración · RE/MAX Potosí",
			},
		],
	}),
	component: RegistrarAlquilerAdmin,
});

function RegistrarAlquilerAdmin() {
	const datos = Route.useLoaderData();

	return (
		<RentalClosingWizard
			datos={datos}
			requiereVendedor
			volver={{ to: "/admin/alquileres", label: "Volver a alquileres" }}
			irAAlquileres={{ to: "/admin/alquileres", label: "Ver alquileres" }}
			titulo="Registrar alquiler"
			descripcion="Asigna el vendedor responsable, registra el contrato, adjunta la firma y cobra el cierre."
		/>
	);
}
