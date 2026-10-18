import { cn } from "cn";
import type { ReactNode } from "react";

interface InfiniteMovingCardsProps {
	items: ReactNode[];
	direction?: "left" | "right";
	speed?: "slow" | "normal" | "fast";
	pauseOnHover?: boolean;
	className?: string;
}

const duraciones = { slow: "70s", normal: "45s", fast: "24s" } as const;

/**
 * Carrusel infinito (Aceternity "Infinite Moving Cards") con CSS puro
 * (se ejecuta fuera del hilo principal). Respeta prefers-reduced-motion.
 */
export function InfiniteMovingCards({
	items,
	direction = "left",
	speed = "normal",
	pauseOnHover = true,
	className,
}: InfiniteMovingCardsProps) {
	const lista = (ariaHidden: boolean) => (
		<ul
			aria-hidden={ariaHidden || undefined}
			className="flex shrink-0 items-stretch gap-5 pr-5"
		>
			{items.map((item, index) => (
				<li
					// biome-ignore lint/suspicious/noArrayIndexKey: carrusel decorativo duplicado
					key={index}
					className="w-[320px] shrink-0 sm:w-[380px]"
				>
					{item}
				</li>
			))}
		</ul>
	);

	return (
		<div
			className={cn(
				"group relative w-full overflow-hidden",
				"[mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]",
				className,
			)}
		>
			<div
				className={cn(
					"flex w-max animate-marquee",
					direction === "right" && "[animation-direction:reverse]",
					pauseOnHover && "group-hover:[animation-play-state:paused]",
				)}
				style={
					{ "--marquee-duration": duraciones[speed] } as React.CSSProperties
				}
			>
				{lista(false)}
				{lista(true)}
			</div>
		</div>
	);
}
