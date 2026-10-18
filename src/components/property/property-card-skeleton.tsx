import { cn } from "cn";
import { Skeleton } from "@/components/ui/skeleton";

interface PropertyCardSkeletonProps {
	variant?: "grid" | "list";
	className?: string;
}

export function PropertyCardSkeleton({
	variant = "grid",
	className,
}: PropertyCardSkeletonProps) {
	const esLista = variant === "list";
	return (
		<div
			className={cn(
				"flex overflow-hidden rounded-xl border border-border bg-card",
				esLista ? "flex-col sm:flex-row" : "flex-col",
				className,
			)}
			aria-hidden="true"
		>
			<Skeleton
				className={cn(
					"rounded-none",
					esLista ? "h-56 sm:h-auto sm:w-[320px] sm:shrink-0" : "h-48 w-full",
				)}
			/>
			<div className="flex flex-1 flex-col gap-3 p-5">
				<Skeleton className="h-3 w-24" />
				<Skeleton className="h-5 w-4/5" />
				<Skeleton className="h-3 w-2/3" />
				<div className="mt-auto flex gap-3 pt-4">
					<Skeleton className="h-3 w-14" />
					<Skeleton className="h-3 w-14" />
					<Skeleton className="h-3 w-14" />
				</div>
			</div>
		</div>
	);
}

export function PropertyGridSkeleton({ items = 6 }: { items?: number }) {
	return (
		<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{Array.from({ length: items }).map((_, index) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: esqueletos estáticos
				<PropertyCardSkeleton key={index} />
			))}
		</div>
	);
}
