import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	Bath,
	BedDouble,
	Building2,
	CalendarClock,
	Car,
	Check,
	Mail,
	MapPin,
	Maximize2,
	Phone,
	Ruler,
	ShieldCheck,
	Sparkles,
} from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { SectionHeading } from "@/components/common/section-heading";
import { inmuebleTone, StatusBadge } from "@/components/common/status-badge";
import { PublicLayout } from "@/components/layout/public-layout";
import { LocationMap } from "@/components/property/location-map";
import { PropertyCard } from "@/components/property/property-card";
import { PropertyGallery } from "@/components/property/property-gallery";
import { VisitScheduler } from "@/components/property/visit-scheduler";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	getInmueble,
	getInmueblesSimilares,
	getProveedor,
	getVendedor,
} from "@/data";
import { formatBsMes, formatFechaLarga, iniciales } from "@/lib/format";

export const Route = createFileRoute("/propiedades/$id")({
	head: () => ({
		meta: [
			{ title: "Detalle del inmueble · RE/MAX Potosí" },
			{
				name: "description",
				content:
					"Fotos, características, ubicación y agendamiento de visita del inmueble en alquiler en Potosí.",
			},
		],
	}),
	component: DetallePage,
});

function DetallePage() {
	const { id } = Route.useParams();
	const inmueble = getInmueble(id);

	if (!inmueble) {
		return (
			<PublicLayout>
				<div className="container-page py-16">
					<EmptyState
						icon={<Building2 className="size-6" aria-hidden="true" />}
						title="No encontramos este inmueble"
						description="El inmueble que buscas no existe o ya no está publicado. Explora otras opciones disponibles en Potosí."
						action={
							<Button asChild variant="default">
								<Link to="/propiedades">
									<ArrowLeft aria-hidden="true" />
									Volver al catálogo
								</Link>
							</Button>
						}
					/>
				</div>
			</PublicLayout>
		);
	}

	const agente = getVendedor(inmueble.vendedorId);
	const proveedor = getProveedor(inmueble.proveedorId);
	const similares = getInmueblesSimilares(inmueble, 3);

	const especificaciones = [
		{
			icono: <Maximize2 className="size-4" aria-hidden="true" />,
			etiqueta: "Superficie",
			valor: `${inmueble.m2} m²`,
		},
		{
			icono: <BedDouble className="size-4" aria-hidden="true" />,
			etiqueta: "Habitaciones",
			valor: inmueble.habitaciones > 0 ? `${inmueble.habitaciones}` : "—",
		},
		{
			icono: <Bath className="size-4" aria-hidden="true" />,
			etiqueta: "Baños",
			valor: inmueble.banos > 0 ? `${inmueble.banos}` : "—",
		},
		{
			icono: <Car className="size-4" aria-hidden="true" />,
			etiqueta: "Parqueos",
			valor: `${inmueble.estacionamientos}`,
		},
		{
			icono: <Ruler className="size-4" aria-hidden="true" />,
			etiqueta: "Piso",
			valor: inmueble.piso === null ? "Planta baja" : `Piso ${inmueble.piso}`,
		},
		{
			icono: <Sparkles className="size-4" aria-hidden="true" />,
			etiqueta: "Amoblado",
			valor: inmueble.amoblado ? "Sí" : "No",
		},
	];

	return (
		<PublicLayout>
			<div className="container-page pb-16">
				<Button asChild variant="ghost" size="sm" className="mt-2 -ml-2">
					<Link to="/propiedades">
						<ArrowLeft aria-hidden="true" />
						Volver al catálogo
					</Link>
				</Button>

				<div className="mt-4 grid gap-10 lg:grid-cols-[1.7fr_1fr]">
					<div>
						<PropertyGallery
							imagenes={inmueble.imagenes}
							titulo={inmueble.titulo}
						/>

						<div className="mt-8">
							<div className="flex flex-wrap items-center gap-2">
								<StatusBadge tone={inmuebleTone[inmueble.estado]}>
									{inmueble.estado}
								</StatusBadge>
								{inmueble.destacado ? (
									<StatusBadge tone="cta">Destacado</StatusBadge>
								) : null}
								<span className="text-xs font-semibold tracking-wide text-primary uppercase">
									{inmueble.tipo} · {inmueble.codigo}
								</span>
							</div>

							<h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-balance text-foreground sm:text-4xl">
								{inmueble.titulo}
							</h1>

							<p className="mt-3 flex items-center gap-2 text-muted-foreground">
								<MapPin
									className="size-4 shrink-0 text-primary"
									aria-hidden="true"
								/>
								{inmueble.direccion}, {inmueble.zona} · Potosí
							</p>

							<div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-y border-border py-5">
								<div>
									<p className="text-xs text-muted-foreground">
										Precio mensual
									</p>
									<p className="font-display text-3xl font-extrabold tabular text-primary sm:text-4xl">
										{formatBsMes(inmueble.precio)}
									</p>
								</div>
								<p className="flex items-center gap-2 text-sm text-muted-foreground">
									<CalendarClock
										className="size-4 text-primary"
										aria-hidden="true"
									/>
									Disponible desde el{" "}
									{formatFechaLarga(inmueble.fechaDisponibilidad)}
								</p>
							</div>

							<dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
								{especificaciones.map((spec) => (
									<div
										key={spec.etiqueta}
										className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
									>
										<span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-soft text-primary">
											{spec.icono}
										</span>
										<div>
											<dt className="text-xs text-muted-foreground">
												{spec.etiqueta}
											</dt>
											<dd className="font-display text-sm font-bold tabular text-foreground">
												{spec.valor}
											</dd>
										</div>
									</div>
								))}
							</dl>

							<section className="mt-10">
								<h2 className="font-display text-xl font-bold text-foreground">
									Descripción
								</h2>
								<p className="mt-3 leading-relaxed text-muted-foreground">
									{inmueble.descripcion}
								</p>
							</section>

							<section className="mt-10">
								<h2 className="font-display text-xl font-bold text-foreground">
									Características
								</h2>
								<ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
									{inmueble.amenidades.map((amenidad) => (
										<li
											key={amenidad}
											className="flex items-center gap-3 text-sm text-foreground"
										>
											<span className="grid size-6 shrink-0 place-items-center rounded-full bg-blue-soft text-primary">
												<Check className="size-3.5" aria-hidden="true" />
											</span>
											{amenidad}
										</li>
									))}
								</ul>
							</section>

							<section className="mt-10">
								<h2 className="font-display text-xl font-bold text-foreground">
									Ubicación
								</h2>
								<div className="mt-4">
									<LocationMap
										zona={inmueble.zona}
										direccion={inmueble.direccion}
										titulo={inmueble.titulo}
									/>
								</div>
							</section>

							{agente ? (
								<section className="mt-10 rounded-xl border border-border bg-card p-6">
									<h2 className="font-display text-xl font-bold text-foreground">
										Agente responsable
									</h2>
									<div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
										<div className="flex items-center gap-4">
											<Avatar className="size-14 ring-2 ring-blue-soft">
												<AvatarImage
													src={agente.avatarUrl}
													alt={agente.nombre}
												/>
												<AvatarFallback className="bg-blue-soft text-primary">
													{iniciales(agente.nombre)}
												</AvatarFallback>
											</Avatar>
											<div>
												<p className="font-display text-base font-bold text-foreground">
													{agente.nombre}
												</p>
												<p className="text-sm text-muted-foreground">
													{agente.cargo} · {agente.zona}
												</p>
												<div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
													<span className="inline-flex items-center gap-1.5">
														<Phone
															className="size-3.5 text-primary/70"
															aria-hidden="true"
														/>
														<span className="tabular">{agente.telefono}</span>
													</span>
													<span className="inline-flex items-center gap-1.5">
														<Mail
															className="size-3.5 text-primary/70"
															aria-hidden="true"
														/>
														{agente.email}
													</span>
												</div>
											</div>
										</div>
										<Button asChild variant="outline">
											<a href={`tel:${agente.telefono.replace(/\s/g, "")}`}>
												<Phone aria-hidden="true" />
												Llamar al agente
											</a>
										</Button>
									</div>
									{proveedor ? (
										<p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
											Propietario: {proveedor.nombre} · Administrado por RE/MAX
											Potosí.
										</p>
									) : null}
								</section>
							) : null}
						</div>
					</div>

					<aside className="lg:sticky lg:top-28 lg:h-fit">
						<VisitScheduler
							inmuebleId={inmueble.id}
							inmuebleTitulo={inmueble.titulo}
							agente={agente}
						/>
						<div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-blue-soft/60 p-4 text-sm text-blue-foreground">
							<ShieldCheck
								className="mt-0.5 size-5 shrink-0 text-primary"
								aria-hidden="true"
							/>
							<p className="text-foreground/80">
								Inmueble verificado por RE/MAX Potosí. El contrato se firma de
								forma presencial y queda registrado en la plataforma.
							</p>
						</div>
					</aside>
				</div>

				{similares.length > 0 ? (
					<section className="mt-16 border-t border-border pt-12">
						<SectionHeading
							title="Inmuebles similares"
							description="Otras opciones que podrían interesarte según la zona, el tipo y el precio."
						/>
						<div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
							{similares.map((similar) => (
								<PropertyCard key={similar.id} inmueble={similar} />
							))}
						</div>
					</section>
				) : null}
			</div>
		</PublicLayout>
	);
}
