import { cn } from "cn";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

type TonoStat = "primary" | "success" | "warning" | "danger" | "cta";

const tonoIcono: Record<TonoStat, string> = {
	primary: "bg-blue-soft text-primary",
	success: "bg-success-soft text-success",
	warning: "bg-warning-soft text-warning",
	danger: "bg-red-50 text-destructive",
	cta: "bg-red-50 text-cta",
};

interface StatCardProps {
	label: string;
	valor: string;
	icono: ReactNode;
	tono?: TonoStat;
	tendencia?: { valor: string; direccion: "up" | "down"; positivo?: boolean };
	hint?: string;
	className?: string;
}

export function StatCard({
	label,
	valor,
	icono,
	tono = "primary",
	tendencia,
	hint,
	className,
}: StatCardProps) {
	return (
		<Card className={cn("gap-0 py-5", className)}>
			<CardContent className="px-5">
				<div className="flex items-start justify-between gap-3">
					<p className="text-sm font-medium text-muted-foreground">{label}</p>
					<span
						className={cn(
							"grid size-9 shrink-0 place-items-center rounded-lg",
							tonoIcono[tono],
						)}
					>
						{icono}
					</span>
				</div>
				<p className="mt-3 font-display text-2xl font-extrabold tabular text-foreground sm:text-3xl">
					{valor}
				</p>
				{tendencia ? (
					<p className="mt-2 flex items-center gap-1.5 text-xs">
						<span
							className={cn(
								"inline-flex items-center gap-0.5 font-semibold",
								tendencia.positivo === false
									? "text-destructive"
									: "text-success",
							)}
						>
							{tendencia.direccion === "up" ? (
								<ArrowUpRight className="size-3.5" aria-hidden="true" />
							) : (
								<ArrowDownRight className="size-3.5" aria-hidden="true" />
							)}
							{tendencia.valor}
						</span>
						<span className="text-muted-foreground">vs. mes anterior</span>
					</p>
				) : hint ? (
					<p className="mt-2 text-xs text-muted-foreground">{hint}</p>
				) : null}
			</CardContent>
		</Card>
	);
}
