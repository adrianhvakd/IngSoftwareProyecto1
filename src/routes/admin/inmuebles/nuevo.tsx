import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
	type DatosInmueble,
	InmuebleForm,
} from "@/components/admin/inmueble-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/inmuebles/nuevo")({
	head: () => ({
		meta: [{ title: "Publicar inmueble · Administración · RE/MAX Potosí" }],
	}),
	component: NuevoInmueble,
});

function NuevoInmueble() {
	const navigate = useNavigate();

	function guardar(publicar: boolean, datos: DatosInmueble) {
		toast.success(publicar ? "Inmueble publicado" : "Borrador guardado", {
			description: `${datos.titulo} · ${datos.zona}. (Acción simulada)`,
		});
		void navigate({ to: "/admin/inmuebles" });
	}

	return (
		<>
			<div className="mb-5">
				<Button
					asChild
					variant="ghost"
					size="sm"
					className="-ml-2 text-muted-foreground"
				>
					<Link to="/admin/inmuebles">
						<ArrowLeft aria-hidden="true" />
						Volver a inmuebles
					</Link>
				</Button>
			</div>

			<PageHeader
				title="Publicar inmueble"
				description="Registra una nueva propiedad en la cartera. Los campos marcados con * son obligatorios."
			/>

			<div className="mt-6">
				<InmuebleForm onGuardar={guardar} />
			</div>
		</>
	);
}
