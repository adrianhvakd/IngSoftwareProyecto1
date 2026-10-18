import { MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { AnimatedTooltip } from "@/components/aceternity/animated-tooltip";
import { SectionHeading } from "@/components/common/section-heading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { vendedores } from "@/data/vendedores";
import { iniciales } from "@/lib/format";

export function Agents() {
	const activos = vendedores.filter((v) => v.estado === "Activo");

	function contactar(nombre: string) {
		toast.success("Solicitud enviada", {
			description: `${nombre} te contactará al número registrado. (Acción simulada)`,
		});
	}

	return (
		<section id="agentes" className="container-page py-16 lg:py-24">
			<SectionHeading
				title="Conoce a nuestro equipo"
				description="Agentes certificados que conocen cada zona de Potosí y te acompañan en la visita, el contrato y el pago de tus cuotas."
			/>

			<div className="mt-10 flex flex-wrap items-center gap-6">
				<AnimatedTooltip
					items={activos.map((v) => ({
						id: v.id,
						nombre: v.nombre,
						cargo: v.cargo,
						avatarUrl: v.avatarUrl,
					}))}
				/>
				<p className="text-sm text-muted-foreground">
					Pasa el cursor sobre cada agente para ver su cargo.
				</p>
			</div>

			<ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{activos.map((vendedor) => (
					<li
						key={vendedor.id}
						className="flex flex-col rounded-xl border border-border bg-card p-6"
					>
						<div className="flex items-center gap-4">
							<Avatar className="size-14 ring-2 ring-blue-soft">
								<AvatarImage src={vendedor.avatarUrl} alt={vendedor.nombre} />
								<AvatarFallback className="bg-blue-soft text-primary">
									{iniciales(vendedor.nombre)}
								</AvatarFallback>
							</Avatar>
							<div>
								<p className="font-display text-base font-bold text-foreground">
									{vendedor.nombre}
								</p>
								<p className="text-sm text-muted-foreground">
									{vendedor.cargo}
								</p>
							</div>
						</div>

						<dl className="mt-5 space-y-2 text-sm text-muted-foreground">
							<div className="flex items-center gap-2">
								<MapPin
									className="size-4 shrink-0 text-primary/70"
									aria-hidden="true"
								/>
								<dt className="sr-only">Zona</dt>
								<dd>{vendedor.zona}</dd>
							</div>
							<div className="flex items-center gap-2">
								<Phone
									className="size-4 shrink-0 text-primary/70"
									aria-hidden="true"
								/>
								<dt className="sr-only">Teléfono</dt>
								<dd className="tabular">{vendedor.telefono}</dd>
							</div>
						</dl>

						<div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-5">
							<span className="text-xs text-muted-foreground">
								{vendedor.alquileresCerrados} alquileres gestionados
							</span>
							<Button
								variant="cta"
								size="sm"
								onClick={() => contactar(vendedor.nombre)}
							>
								Contactar agente
							</Button>
						</div>
					</li>
				))}
			</ul>
		</section>
	);
}
