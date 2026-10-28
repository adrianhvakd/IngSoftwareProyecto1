import { cn } from "cn";
import { Building2, FileCheck2, MapPinned, Users } from "lucide-react";
import type { ReactNode } from "react";
import { BentoGrid } from "@/components/aceternity/bento-grid";
import { SectionHeading } from "@/components/common/section-heading";
import { formatNumber } from "@/lib/format";
import type { ResumenPublico } from "@/types/domain";

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

export function Metrics({ metricas }: { metricas: ResumenPublico }) {
	return (
		<section className="bg-secondary/60 py-16 lg:py-24">
			<div className="container-page">
				<SectionHeading
					title="Resultados que respaldan cada alquiler"
					description="Cifras actuales de nuestro catálogo y operación en Potosí, con procesos formales y seguimiento de cada contrato."
				/>

				<BentoGrid className="mt-10 md:grid-cols-4">
					<div className="relative overflow-hidden rounded-xl bg-blue-dark p-6 text-white md:col-span-2 md:row-span-2">
						<span
							aria-hidden="true"
							className="balloon-motif absolute -right-6 -bottom-6 size-40 rounded-full"
						/>
						<FileCheck2 className="size-8 text-white/80" aria-hidden="true" />
						<p className="mt-6 font-display text-4xl font-extrabold tabular sm:text-5xl">
							{formatNumber(metricas.contratosGestionados)}
						</p>
						<p className="mt-2 max-w-xs text-sm text-white/75">
							contratos de alquiler gestionados con seguimiento de cuotas, pagos
							y comprobantes.
						</p>
						<p className="mt-8 border-t border-white/15 pt-4 text-xs text-white/60">
							Oficina RE/MAX Potosí · Av. Villazón, centro histórico
						</p>
					</div>

					<MetricTile
						icono={<Building2 className="size-5" aria-hidden="true" />}
						valor={formatNumber(metricas.inmueblesDisponibles)}
						etiqueta="Inmuebles disponibles"
					/>
					<MetricTile
						icono={<Users className="size-5" aria-hidden="true" />}
						valor={formatNumber(metricas.agentesActivos)}
						etiqueta="Agentes activos"
					/>
					<MetricTile
						icono={<MapPinned className="size-5" aria-hidden="true" />}
						valor={formatNumber(metricas.zonasActivas)}
						etiqueta="Zonas con cobertura"
					/>
					<MetricTile
						icono={<FileCheck2 className="size-5" aria-hidden="true" />}
						valor={formatNumber(metricas.contratosGestionados)}
						etiqueta="Contratos gestionados"
					/>
				</BentoGrid>
			</div>
		</section>
	);
}
