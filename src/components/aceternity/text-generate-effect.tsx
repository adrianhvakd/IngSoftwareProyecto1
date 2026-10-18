import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";

interface TextGenerateEffectProps {
	words: string;
	className?: string;
	/** Retardo entre palabras (s). */
	stagger?: number;
}

/**
 * Efecto "Text Generate" (Aceternity): revela el texto palabra por palabra.
 * Usa solo opacity + transform. Respeta prefers-reduced-motion.
 */
export function TextGenerateEffect({
	words,
	className,
	stagger = 0.07,
}: TextGenerateEffectProps) {
	const reduce = useReducedMotion();
	const palabra = words.split(" ");

	return (
		<motion.span
			className={cn("inline", className)}
			initial="hidden"
			animate="visible"
			variants={{
				hidden: {},
				visible: { transition: { staggerChildren: reduce ? 0 : stagger } },
			}}
		>
			{palabra.map((word, index) => (
				<motion.span
					// biome-ignore lint/suspicious/noArrayIndexKey: palabras estáticas del titular
					key={`${word}-${index}`}
					className="inline-block"
					variants={{
						hidden: { opacity: 0, y: reduce ? 0 : 8 },
						visible: { opacity: 1, y: 0 },
					}}
					transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
				>
					{word}
					{index < palabra.length - 1 ? "\u00A0" : ""}
				</motion.span>
			))}
		</motion.span>
	);
}
