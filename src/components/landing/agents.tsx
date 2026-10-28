import { MapPin, Phone } from "lucide-react";
import { AnimatedTooltip } from "@/components/aceternity/animated-tooltip";
import { SectionHeading } from "@/components/common/section-heading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { iniciales } from "@/lib/format";
import type { AgentePublico } from "@/types/domain";

export function Agents({ agentes }: { agentes: AgentePublico[] }) {
	if (agentes.length === 0) return null;

	return (
		<section id="agentes" className="container-page py-16 lg:py-24">
			<SectionHeading
				title="Conoce a nuestro equipo"
				description="Agentes certificados que conocen cada zona de Potosí y te acompañan en la visita, el contrato y el pago de tus cuotas."
			/>

			<div className="mt-10 flex flex-wrap items-center gap-6">
				<AnimatedTooltip
					items={agentes.map((agente) => ({
						id: agente.id,
						nombre: agente.nombre,
						cargo: agente.cargo,
						avatarUrl: agente.avatarUrl,
					}))}
				/>
				<p className="text-sm text-muted-foreground">
					Pasa el cursor sobre cada agente para ver su cargo.
				</p>
			</div>

			<ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{agentes.map((agente) => (
					<li
						key={agente.id}
						className="flex flex-col rounded-xl border border-border bg-card p-6"
					>
						<div className="flex items-center gap-4">
							<Avatar className="size-14 ring-2 ring-blue-soft">
								<AvatarImage src={agente.avatarUrl} alt={agente.nombre} />
								<AvatarFallback className="bg-blue-soft text-primary">
									{iniciales(agente.nombre)}
								</AvatarFallback>
							</Avatar>
							<div>
								<p className="font-display text-base font-bold text-foreground">
									{agente.nombre}
								</p>
								<p className="text-sm text-muted-foreground">{agente.cargo}</p>
							</div>
						</div>

						<dl className="mt-5 space-y-2 text-sm text-muted-foreground">
							<div className="flex items-center gap-2">
								<MapPin
									className="size-4 shrink-0 text-primary/70"
									aria-hidden="true"
								/>
								<dt className="sr-only">Zona</dt>
								<dd>{agente.zona}</dd>
							</div>
							<div className="flex items-center gap-2">
								<Phone
									className="size-4 shrink-0 text-primary/70"
									aria-hidden="true"
								/>
								<dt className="sr-only">Teléfono</dt>
								<dd className="tabular">
									{agente.telefono || "Contacto por la oficina"}
								</dd>
							</div>
						</dl>

						<div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-5">
							<span className="text-xs text-muted-foreground">
								{agente.alquileresGestionados} alquileres gestionados
							</span>
							{agente.telefono ? (
								<Button asChild variant="cta" size="sm">
									<a href={`tel:${agente.telefono.replace(/[^\d+]/g, "")}`}>
										Contactar agente
									</a>
								</Button>
							) : (
								<Button asChild variant="outline" size="sm">
									<a href="#contacto">Contactar oficina</a>
								</Button>
							)}
						</div>
					</li>
				))}
			</ul>
		</section>
	);
}
