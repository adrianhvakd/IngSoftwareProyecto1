import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	type DatosInmueble,
	InmuebleForm,
} from "@/components/admin/inmueble-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { ESTADO_INMUEBLE_UI_A_DB, TIPO_UI_A_DB } from "@/lib/admin";
import { eliminarImagenesInmueble, subirImagenesInmueble } from "@/lib/storage";
import {
	guardarInmueble,
	opcionesInmuebleAdmin,
} from "@/server/admin/inmuebles";

export const Route = createFileRoute("/admin/inmuebles/nuevo")({
	loader: () => opcionesInmuebleAdmin(),
	head: () => ({
		meta: [{ title: "Publicar inmueble · Administración · RE/MAX Potosí" }],
	}),
	component: NuevoInmueble,
});

function NuevoInmueble() {
	const navigate = useNavigate();
	const opciones = Route.useLoaderData();
	const [guardando, setGuardando] = useState(false);

	async function guardar(publicar: boolean, datos: DatosInmueble) {
		if (guardando) return;

		const m2 = Number(datos.m2);
		const precio = Number(datos.precio);
		const costoPublicacion = Number(datos.costoPublicacion);
		const banos = Number(datos.banos);
		const estacionamientos = Number(datos.estacionamientos);
		const habitaciones = Number(datos.habitaciones);

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
		if (!datos.disponibleDesde) {
			toast.error("Indica la fecha de disponibilidad");
			return;
		}

		const tipo = TIPO_UI_A_DB[datos.tipo as keyof typeof TIPO_UI_A_DB];
		if (!tipo) {
			toast.error("Tipo de inmueble inválido");
			return;
		}

		setGuardando(true);
		const id = crypto.randomUUID();
		let pathsSubidos: string[] = [];

		try {
			const conArchivo = datos.imagenes.filter((imagen) => imagen.file);
			const subidas = await subirImagenesInmueble(
				id,
				conArchivo.map((imagen) => imagen.file as File),
			);
			pathsSubidos = subidas.map((imagen) => imagen.path);

			let indiceSubida = 0;
			const imagenes = datos.imagenes
				.map((imagen) => {
					if (!imagen.file) return null;
					const subida = subidas[indiceSubida];
					indiceSubida += 1;
					if (!subida) return null;
					return {
						path: subida.path,
						url: subida.url,
						alt: imagen.nombre,
						orden: indiceSubida - 1,
						esPortada: indiceSubida === 1,
					};
				})
				.filter(
					(imagen): imagen is NonNullable<typeof imagen> => imagen !== null,
				);

			const resultado = await guardarInmueble({
				data: {
					modo: "crear",
					id,
					publicar,
					titulo: datos.titulo.trim(),
					tipo,
					estado: ESTADO_INMUEBLE_UI_A_DB[datos.estado],
					zona: datos.zona,
					direccion: datos.direccion.trim(),
					m2,
					habitaciones:
						tipo === "local" ? null : Math.max(1, habitaciones || 1),
					banos,
					estacionamientos,
					piso: datos.piso.trim() ? Number(datos.piso) : null,
					amoblado: datos.amoblado,
					descripcion: datos.descripcion.trim(),
					proveedorId: datos.proveedorId,
					precio,
					costoPublicacion,
					disponibleDesde: datos.disponibleDesde,
					destacado: datos.destacado,
					amenidades: datos.amenidades,
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

			toast.success(publicar ? "Inmueble publicado" : "Borrador guardado", {
				description: `${datos.titulo} · ${datos.zona}.`,
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
				title="Publicar inmueble"
				description="Registra una nueva propiedad en la cartera. Los campos marcados con * son obligatorios."
			/>

			<div className="mt-6">
				<InmuebleForm
					proveedores={opciones.proveedores}
					guardando={guardando}
					onGuardar={guardar}
				/>
			</div>
		</>
	);
}
