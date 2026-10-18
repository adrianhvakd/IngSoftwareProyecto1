import { cn } from "cn";
import type { ReactNode } from "react";

export interface TimelineStep {
	id: string;
	titulo: string;
	descripcion: string;
	icono: ReactNode;
}

interface TimelineProps {
	steps: TimelineStep[];
	className?: string;
}

/**
 * Secuencia de pasos "Cómo funciona" (Aceternity Timeline adaptado).
 * El orden se muestra por posición (lista ordenada), sin numeración decorativa.
 */
export function Timeline({ steps, className }: TimelineProps) {
	return (
		<ol className={cn("relative space-y-2", className)}>
			{steps.map((step, index) => {
				const ultimo = index === steps.length - 1;
				return (
					<li
						key={step.id}
						className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 sm:gap-x-7"
					>
						<div className="relative flex flex-col items-center">
							<span className="z-10 grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
								{step.icono}
							</span>
							{!ultimo ? (
								<span
									aria-hidden="true"
									className="w-px flex-1 bg-gradient-to-b from-primary/45 to-primary/5"
								/>
							) : null}
						</div>

						<div className={cn("pt-1", ultimo ? "pb-0" : "pb-10")}>
							<h3 className="font-display text-lg font-bold text-foreground">
								{step.titulo}
							</h3>
							<p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
								{step.descripcion}
							</p>
						</div>
					</li>
				);
			})}
		</ol>
	);
}
