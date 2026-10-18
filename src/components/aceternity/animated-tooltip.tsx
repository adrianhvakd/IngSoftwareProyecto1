import { cn } from "cn";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { iniciales } from "@/lib/format";

export interface AnimatedTooltipItem {
	id: string;
	nombre: string;
	cargo: string;
	avatarUrl: string;
}

interface AnimatedTooltipProps {
	items: AnimatedTooltipItem[];
	className?: string;
}

/**
 * Fila de avatares con tarjeta flotante al pasar el cursor
 * (Aceternity "Animated Tooltip").
 */
export function AnimatedTooltip({ items, className }: AnimatedTooltipProps) {
	const [activo, setActivo] = useState<string | null>(null);
	const reduce = useReducedMotion();

	return (
		<div className={cn("flex items-center", className)}>
			{items.map((item) => (
				<div
					key={item.id}
					className="group relative -mr-3 transition-transform duration-200 ease-out hover:z-20 hover:-translate-y-1"
				>
					<button
						type="button"
						aria-label={`${item.nombre}, ${item.cargo}`}
						className="block rounded-full outline-none ring-primary/40 transition focus-visible:ring-2"
						onMouseEnter={() => setActivo(item.id)}
						onMouseLeave={() => setActivo(null)}
						onFocus={() => setActivo(item.id)}
						onBlur={() => setActivo(null)}
					>
						<Avatar className="size-12 ring-4 ring-background">
							<AvatarImage src={item.avatarUrl} alt={item.nombre} />
							<AvatarFallback className="bg-blue-soft text-primary">
								{iniciales(item.nombre)}
							</AvatarFallback>
						</Avatar>
					</button>

					<AnimatePresence>
						{activo === item.id ? (
							<motion.div
								initial={{
									opacity: 0,
									y: reduce ? 0 : 6,
									scale: reduce ? 1 : 0.96,
								}}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{
									opacity: 0,
									y: reduce ? 0 : 6,
									scale: reduce ? 1 : 0.96,
								}}
								transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
								className="pointer-events-none absolute -top-1 left-1/2 z-30 flex -translate-x-1/2 -translate-y-full flex-col items-center rounded-xl border border-border bg-popover px-3.5 py-2.5 text-center whitespace-nowrap shadow-[var(--shadow-lift)]"
							>
								<span className="font-display text-sm font-bold text-foreground">
									{item.nombre}
								</span>
								<span className="text-xs text-muted-foreground">
									{item.cargo}
								</span>
							</motion.div>
						) : null}
					</AnimatePresence>
				</div>
			))}
		</div>
	);
}
