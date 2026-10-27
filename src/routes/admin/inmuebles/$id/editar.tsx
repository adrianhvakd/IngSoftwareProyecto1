import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Building2 } from "lucide-react";
import { toast } from "sonner";
import {
	type DatosInmueble,
	InmuebleForm,
} from "@/components/admin/inmueble-form";
import { EmptyState } from "@/components/common/empty-state";
import { inmuebleTone, StatusBadge } from "@/components/common/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { getInmueble } from "@/data";

export const Route = createFileRoute("/admin/inmuebles/$id/editar")({
	head: () => ({
		meta: [{ title: "Editar inmueble · Administración · RE/MAX Potosí" }],
	}),
	component: EditarInmueble,
});

function EditarInmueble() {
	const { id } = Route.useParams();
	const navigate = useNavigate();
	const inmueble = getInmueble(id);

	if (!inmueble) {
		return (
			<>
				<PageHeader
					title="Inmueble no encontrado"
					description="El inmueble solicitado no existe o ya no está disponible."
				/>
				<EmptyState
					icon={<Building2 className="size-6" aria-hidden="true" />}
					title="No encontramos este inmueble"
					description="Revisa el enlace o vuelve al listado para elegir otro inmueble."
					action={
						<Button asChild variant="outline">
							<Link to="/admin/inmuebles">Volver a inmuebles</Link>
						</Button>
					}
				/>
			</>
		);
	}

	function guardar(publicar: boolean, datos: DatosInmueble) {
		toast.success(publicar ? "Cambios guardados" : "Borrador guardado", {
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
				title="Editar inmueble"
				description={`${inmueble.codigo} · Actualiza la información publicada del inmueble.`}
				actions={
					<StatusBadge tone={inmuebleTone[inmueble.estado]}>
						{inmueble.estado}
					</StatusBadge>
				}
			/>

			<div className="mt-6">
				<InmuebleForm inmueble={inmueble} onGuardar={guardar} />
			</div>
		</>
	);
}
