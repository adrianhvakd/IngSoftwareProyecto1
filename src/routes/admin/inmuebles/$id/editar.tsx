import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Building2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	type DatosInmueble,
	InmuebleForm,
} from "@/components/admin/inmueble-form";
import { EmptyState } from "@/components/common/empty-state";
import { inmuebleTone, StatusBadge } from "@/components/common/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { ESTADO_INMUEBLE_UI_A_DB, TIPO_UI_A_DB } from "@/lib/admin";
import { eliminarImagenesInmueble, subirImagenesInmueble } from "@/lib/storage";
import {
	guardarInmueble,
	obtenerInmuebleAdmin,
} from "@/server/admin/inmuebles";

export const Route = createFileRoute("/admin/inmuebles/$id/editar")({
	loader: ({ params }) => obtenerInmuebleAdmin({ data: { id: params.id } }),
	head: () => ({
		meta: [{ title: "Editar inmueble · Administración · RE/MAX Potosí" }],
	}),
	component: EditarInmueble,
});

function EditarInmueble() {
	const datos = Route.useLoaderData();
	const navigate = useNavigate();
	const [guardando, setGuardando] = useState(false);

	if (!datos) {
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

	const { inmueble, proveedores } = datos;

	async function guardar(publicar: boolean, form: DatosInmueble) {
		if (guardando) return;

		const m2 = Number(form.m2);
		const precio = Number(form.precio);
		const costoPublicacion = Number(form.costoPublicacion);
		const banos = Number(form.banos);
		const estacionamientos = Number(form.estacionamientos);
		const habitaciones = Number(form.habitaciones);

		if (!Number.isFinite(m2) || m2 <= 0) {
			toast.error("Superficie inválida", {
				description: "Ingresa una superficie mayor a 0 m².",
			});
			return;
		}
		if (!Number.isFinite(precio) || precio <= 0) {
			toast.error("Precio inválido", {
				description: "Ingresa un alquiler mensual mayor a 0 Bs.",
			});
			return;
		}
		if (
			!Number.isFinite(costoPublicacion) ||
			costoPublicacion < 0 ||
			!Number.isFinite(banos) ||
			banos < 0 ||
			!Number.isFinite(estacionamientos) ||
			estacionamientos < 0
		) {
			toast.error("Revisa los números del formulario", {
				description:
					"El costo, los baños y los parqueos deben ser mayores o iguales a 0.",
			});
			return;
		}
		if (!form.disponibleDesde) {
			toast.error("Indica la fecha de disponibilidad");
			return;
		}

		const tipo = TIPO_UI_A_DB[form.tipo as keyof typeof TIPO_UI_A_DB];
		if (!tipo) {
			toast.error("Tipo de inmueble inválido");
			return;
		}

		setGuardando(true);
		let pathsSubidos: string[] = [];

		try {
			const nuevas = form.imagenes.filter((imagen) => imagen.file);
			const subidas = await subirImagenesInmueble(
				inmueble.id,
				nuevas.map((imagen) => imagen.file as File),
			);
			pathsSubidos = subidas.map((imagen) => imagen.path);

			let indiceSubida = 0;
			const imagenes = form.imagenes
				.map((imagen, indice) => {
					if (imagen.existingId) {
						return {
							id: imagen.existingId,
							path: imagen.path ?? null,
							url: imagen.url,
							alt: imagen.nombre,
							orden: indice,
							esPortada: indice === 0,
						};
					}
					if (imagen.file) {
						const subida = subidas[indiceSubida];
						indiceSubida += 1;
						if (!subida) return null;
						return {
							path: subida.path,
							url: subida.url,
							alt: imagen.nombre,
							orden: indice,
							esPortada: indice === 0,
						};
					}
					return null;
				})
				.filter(
					(imagen): imagen is NonNullable<typeof imagen> => imagen !== null,
				);

			const resultado = await guardarInmueble({
				data: {
					modo: "editar",
					id: inmueble.id,
					publicar,
					titulo: form.titulo.trim(),
					tipo,
					estado: ESTADO_INMUEBLE_UI_A_DB[form.estado],
					zona: form.zona,
					direccion: form.direccion.trim(),
					m2,
					habitaciones:
						tipo === "local" ? null : Math.max(1, habitaciones || 1),
					banos,
					estacionamientos,
					piso: form.piso.trim() ? Number(form.piso) : null,
					amoblado: form.amoblado,
					descripcion: form.descripcion.trim(),
					proveedorId: form.proveedorId,
					precio,
					costoPublicacion,
					disponibleDesde: form.disponibleDesde,
					destacado: form.destacado,
					amenidades: form.amenidades,
					imagenes,
				},
			});

			if (!resultado.ok) {
				toast.error("No se pudo guardar el inmueble", {
					description: resultado.error,
				});
				await eliminarImagenesInmueble(pathsSubidos);
				return;
			}

			toast.success("Cambios guardados", {
				description: publicar
					? `${form.titulo} · estado aplicado.`
					: `${form.titulo} · estado sin cambios.`,
			});
			await navigate({ to: "/admin/inmuebles" });
		} catch (error) {
			await eliminarImagenesInmueble(pathsSubidos);
			toast.error("No se pudo guardar el inmueble", {
				description:
					error instanceof Error ? error.message : "Inténtalo de nuevo.",
			});
		} finally {
			setGuardando(false);
		}
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
				<InmuebleForm
					inmueble={inmueble}
					proveedores={proveedores}
					guardando={guardando}
					onGuardar={guardar}
				/>
			</div>
		</>
	);
}
