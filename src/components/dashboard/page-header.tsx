import { cn } from "cn";
import type { ReactNode } from "react";

interface PageHeaderProps {
	title: string;
	description?: string;
	actions?: ReactNode;
	className?: string;
}

/** Encabezado de página dentro de los paneles. */
export function PageHeader({
	title,
	description,
	actions,
	className,
}: PageHeaderProps) {
	return (
		<div
			className={cn(
				"flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
				className,
			)}
		>
			<div>
				<h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
					{title}
				</h1>
				{description ? (
					<p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
						{description}
					</p>
				) : null}
			</div>
			{actions ? (
				<div className="flex flex-wrap items-center gap-2">{actions}</div>
			) : null}
		</div>
	);
}
