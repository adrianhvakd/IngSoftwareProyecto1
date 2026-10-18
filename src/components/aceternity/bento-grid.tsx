import { cn } from "cn";
import type { ReactNode } from "react";

interface BentoGridProps {
	children: ReactNode;
	className?: string;
}

/** Rejilla bento (Aceternity Bento Grid) usada para las métricas. */
export function BentoGrid({ children, className }: BentoGridProps) {
	return (
		<div className={cn("grid grid-cols-1 gap-4 md:grid-cols-3", className)}>
			{children}
		</div>
	);
}

interface BentoGridItemProps {
	title: string;
	description: string;
	icon?: ReactNode;
	header?: ReactNode;
	className?: string;
	/** Color de acento del icono. */
	tone?: "primary" | "cta";
}

export function BentoGridItem({
	title,
	description,
	icon,
	header,
	className,
	tone = "primary",
}: BentoGridItemProps) {
	return (
		<div
			className={cn(
				"group flex flex-col overflow-hidden rounded-xl border border-border bg-card p-6 transition-[box-shadow,border-color] duration-200 ease-out hover:border-primary/30 hover:shadow-[var(--shadow-soft)]",
				className,
			)}
		>
			{header ? <div className="mb-4">{header}</div> : null}
			<div className="flex items-center gap-3">
				{icon ? (
					<span
						className={cn(
							"grid size-10 place-items-center rounded-lg",
							tone === "primary"
								? "bg-blue-soft text-primary"
								: "bg-red-50 text-cta",
						)}
					>
						{icon}
					</span>
				) : null}
				<h3 className="font-display text-base font-bold text-foreground">
					{title}
				</h3>
			</div>
			<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
				{description}
			</p>
		</div>
	);
}
