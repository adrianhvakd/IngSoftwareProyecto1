import { cn } from "cn";
import type { ReactNode } from "react";

interface EmptyStateProps {
	icon: ReactNode;
	title: string;
	description: string;
	action?: ReactNode;
	className?: string;
}

/** Estado vacío diseñado, reutilizable en listas, tablas y catálogos. */
export function EmptyState({
	icon,
	title,
	description,
	action,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/60 px-6 py-16 text-center",
				className,
			)}
		>
			<div className="grid size-14 place-items-center rounded-full bg-blue-soft text-primary">
				{icon}
			</div>
			<h3 className="mt-5 font-display text-lg font-bold text-foreground">
				{title}
			</h3>
			<p className="mt-2 max-w-md text-sm text-muted-foreground">
				{description}
			</p>
			{action ? <div className="mt-6">{action}</div> : null}
		</div>
	);
}
