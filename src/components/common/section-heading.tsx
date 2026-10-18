import { cn } from "cn";
import type { ReactNode } from "react";

interface SectionHeadingProps {
	title: string;
	description?: string;
	align?: "left" | "center";
	action?: ReactNode;
	className?: string;
}

/** Encabezado de sección: título grande + descripción y acción opcional. */
export function SectionHeading({
	title,
	description,
	align = "left",
	action,
	className,
}: SectionHeadingProps) {
	return (
		<div
			className={cn(
				"flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
				align === "center" && "md:flex-col md:items-center md:text-center",
				className,
			)}
		>
			<div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
				<h2 className="font-display text-3xl font-extrabold tracking-tight text-balance text-foreground sm:text-4xl">
					{title}
				</h2>
				{description ? (
					<p className="mt-3 text-base leading-relaxed text-muted-foreground">
						{description}
					</p>
				) : null}
			</div>
			{action ? <div className="shrink-0">{action}</div> : null}
		</div>
	);
}
