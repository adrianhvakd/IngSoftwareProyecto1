import { cn } from "cn";
import { Building2, FileCheck2, TrendingUp, Users } from "lucide-react";
import type { ReactNode } from "react";
import { BentoGrid } from "@/components/aceternity/bento-grid";
import { SectionHeading } from "@/components/common/section-heading";
import { oficina } from "@/data/oficina";

function MetricTile({
	icono,
	valor,
	etiqueta,
	className,
}: {
	icono: ReactNode;
	valor: string;
	etiqueta: string;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex flex-col justify-between rounded-xl border border-border bg-card p-6",
				className,
			)}
		>
			<span className="grid size-11 place-items-center rounded-lg bg-blue-soft text-primary">
				{icono}
			</span>
			<div className="mt-6">
				<p className="font-display text-4xl font-extrabold tabular text-foreground sm:text-5xl">
					{valor}
				</p>
				<p className="mt-2 text-sm text-muted-foreground">{etiqueta}</p>
			</div>
		</div>
	);
}

export function Metrics() {
	const [inmueblesPub, alquileres, agentes, anios] = oficina.metricas;

	return (
		<section className="bg-secondary/60 py-16 lg:py-24">
			<div className="container-page">
				<SectionHeading
					title="Resultados que respaldan cada alquiler"
					description="Más de una década acompañando a propietarios e inquilinos en Potosí, con procesos formales y cobros al día."
				/>

				<BentoGrid className="mt-10 md:grid-cols-4">
					<div className="relative overflow-hidden rounded-xl bg-blue-dark p-6 text-white md:col-span-2 md:row-span-2">
						<span
							aria-hidden="true"
							className="balloon-motif absolute -right-6 -bottom-6 size-40 rounded-full"
						/>
						<TrendingUp className="size-8 text-white/80" aria-hidden="true" />
						<p className="mt-6 font-display text-4xl font-extrabold tabular sm:text-5xl">
							{Math.round(
								(alquileres.valor / Math.max(inmueblesPub.valor, 1)) * 100,
							)}
							%
						</p>
						<p className="mt-2 max-w-xs text-sm text-white/75">
							de los inmuebles publicados encuentran un inquilino en menos de 45
							días.
						</p>
						<p className="mt-8 border-t border-white/15 pt-4 text-xs text-white/60">
							Oficina RE/MAX Potosí · Av. Villazón, centro histórico
						</p>
					</div>

					<MetricTile
						icono={<Building2 className="size-5" aria-hidden="true" />}
						valor={`${inmueblesPub.valor}${inmueblesPub.sufijo}`}
						etiqueta={inmueblesPub.etiqueta}
					/>
					<MetricTile
						icono={<FileCheck2 className="size-5" aria-hidden="true" />}
						valor={`${alquileres.valor}${alquileres.sufijo}`}
						etiqueta={alquileres.etiqueta}
					/>
					<MetricTile
						icono={<Users className="size-5" aria-hidden="true" />}
						valor={`${agentes.valor}`}
						etiqueta={agentes.etiqueta}
					/>
					<MetricTile
						icono={<TrendingUp className="size-5" aria-hidden="true" />}
						valor={`${anios.valor} años`}
						etiqueta={anios.etiqueta}
					/>
				</BentoGrid>
			</div>
		</section>
	);
}
