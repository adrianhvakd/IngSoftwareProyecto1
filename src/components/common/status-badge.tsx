import { cn } from "cn";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

export type Tone =
	| "neutral"
	| "info"
	| "success"
	| "warning"
	| "danger"
	| "cta"
	| "muted";

const toneClasses: Record<Tone, string> = {
	neutral: "border-border bg-secondary text-muted-foreground",
	info: "border-primary/20 bg-blue-soft text-blue-deep",
	success: "border-emerald-200 bg-success-soft text-success",
	warning: "border-amber-200 bg-warning-soft text-warning",
	danger: "border-red-200 bg-red-50 text-destructive",
	cta: "border-transparent bg-cta text-cta-foreground",
	muted: "border-border bg-muted text-muted-foreground",
};

interface StatusBadgeProps {
	tone?: Tone;
	children: ReactNode;
	className?: string;
	icon?: ReactNode;
	dot?: boolean;
}

export function StatusBadge({
	tone = "neutral",
	children,
	className,
	icon,
	dot = false,
}: StatusBadgeProps) {
	return (
		<Badge
			variant="outline"
			className={cn(
				"rounded-full border px-2.5 py-0.5 text-xs font-semibold",
				toneClasses[tone],
				className,
			)}
		>
			{dot ? (
				<span
					aria-hidden="true"
					className="size-1.5 rounded-full bg-current opacity-70"
				/>
			) : null}
			{icon}
			{children}
		</Badge>
	);
}

/* Mapeos de estado del dominio → tono visual */

export const inmuebleTone: Record<string, Tone> = {
	Disponible: "success",
	Reservado: "warning",
	"En alquiler": "info",
	Inactivo: "muted",
};

export const visitaTone: Record<string, Tone> = {
	Pendiente: "warning",
	Realizada: "success",
	Cancelada: "muted",
};

export const cuotaTone: Record<string, Tone> = {
	"Al día": "success",
	Pagada: "success",
	"Por vencer": "warning",
	"En mora": "danger",
	Anulada: "muted",
};

export const comisionTone: Record<string, Tone> = {
	Pendiente: "warning",
	Pagada: "success",
	Anulada: "muted",
};

export const rolTone: Record<string, Tone> = {
	Administrador: "info",
	Vendedor: "success",
	Cliente: "neutral",
};

export const alquilerTone: Record<string, Tone> = {
	Vigente: "success",
	Finalizado: "muted",
	Suspendido: "danger",
	Cancelado: "muted",
};
