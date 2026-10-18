import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";

interface SpotlightProps {
	className?: string;
	/** Opacidad máxima del haz. */
	intensity?: number;
}

/**
 * Haz de luz (Aceternity Spotlight) adaptado a fondo claro y paleta azul.
 * Solo anima transform/opacity y respeta prefers-reduced-motion.
 */
export function Spotlight({ className, intensity = 0.16 }: SpotlightProps) {
	const reduce = useReducedMotion();

	return (
		<motion.svg
			aria-hidden="true"
			focusable="false"
			viewBox="0 0 3787 2842"
			className={cn(
				"pointer-events-none absolute h-[130%] w-[130%] select-none",
				className,
			)}
			initial={{ opacity: 0, transform: "translateX(-60px)" }}
			animate={
				reduce
					? { opacity: intensity, transform: "translateX(0px)" }
					: {
							opacity: [intensity * 0.6, intensity, intensity * 0.6],
							transform: [
								"translateX(-60px)",
								"translateX(60px)",
								"translateX(-60px)",
							],
						}
			}
			transition={
				reduce
					? { duration: 0 }
					: { duration: 12, repeat: Infinity, ease: "easeInOut" }
			}
		>
			<defs>
				<radialGradient id="spotlight-grad" cx="50%" cy="0%" r="70%">
					<stop offset="0%" stopColor="#3B6FD4" stopOpacity="0.9" />
					<stop offset="45%" stopColor="#003DA5" stopOpacity="0.35" />
					<stop offset="100%" stopColor="#003DA5" stopOpacity="0" />
				</radialGradient>
			</defs>
			<ellipse
				cx="1893"
				cy="1421"
				rx="1893"
				ry="1300"
				fill="url(#spotlight-grad)"
			/>
		</motion.svg>
	);
}
