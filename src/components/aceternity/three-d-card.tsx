import { cn } from "cn";
import { motion, useReducedMotion, useSpring } from "motion/react";
import type { ReactNode } from "react";
import { useRef } from "react";

interface CardContainerProps {
	children: ReactNode;
	className?: string;
	containerClassName?: string;
	/** Inclinación máxima en grados. */
	tilt?: number;
}

/**
 * Tarjeta 3D (Aceternity "3D Card") con inclinación suave según el cursor.
 * Solo transform. En táctil/reduced-motion se queda plana.
 */
export function CardContainer({
	children,
	className,
	containerClassName,
	tilt = 6,
}: CardContainerProps) {
	const ref = useRef<HTMLDivElement>(null);
	const reduce = useReducedMotion();
	const rotateX = useSpring(0, { stiffness: 150, damping: 22, mass: 0.4 });
	const rotateY = useSpring(0, { stiffness: 150, damping: 22, mass: 0.4 });

	function handleMove(event: React.MouseEvent<HTMLDivElement>) {
		if (reduce || !ref.current) return;
		const rect = ref.current.getBoundingClientRect();
		const px = (event.clientX - rect.left - rect.width / 2) / (rect.width / 2);
		const py = (event.clientY - rect.top - rect.height / 2) / (rect.height / 2);
		rotateY.set(Math.max(-1, Math.min(1, px)) * tilt);
		rotateX.set(Math.max(-1, Math.min(1, py)) * -tilt);
	}

	function handleLeave() {
		rotateX.set(0);
		rotateY.set(0);
	}

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: inclinación 3D puramente decorativa (solo puntero).
		<div
			ref={ref}
			onMouseMove={handleMove}
			onMouseLeave={handleLeave}
			className={cn("[perspective:1200px]", containerClassName)}
		>
			<motion.div
				style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
				className={cn("relative", className)}
			>
				{children}
			</motion.div>
		</div>
	);
}

interface CardItemProps {
	children: ReactNode;
	className?: string;
	/** Profundidad sobre el plano de la tarjeta. */
	z?: number;
}

/** Elemento con profundidad dentro de la tarjeta 3D. */
export function CardItem({ children, className, z = 40 }: CardItemProps) {
	return (
		<div
			className={cn(className)}
			style={{ transform: `translateZ(${z}px)`, transformStyle: "preserve-3d" }}
		>
			{children}
		</div>
	);
}
