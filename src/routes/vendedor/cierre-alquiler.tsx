import { createFileRoute } from "@tanstack/react-router";
import { RentalClosingWizard } from "@/components/pickers/rental-closing-wizard";

export const Route = createFileRoute("/vendedor/cierre-alquiler")({
	head: () => ({
		meta: [{ title: "Cierre de alquiler · Panel vendedor · RE/MAX Potosí" }],
	}),
	component: CierreAlquiler,
});

function CierreAlquiler() {
	return (
		<RentalClosingWizard
			volver={{ to: "/vendedor", label: "Volver al inicio" }}
			irAAlquileres={{
				to: "/vendedor/comisiones",
				label: "Ver mis comisiones",
			}}
			titulo="Cierre de alquiler"
			descripcion="Registra el acuerdo, genera el contrato, adjunta la firma y cobra el cierre."
		/>
	);
}
