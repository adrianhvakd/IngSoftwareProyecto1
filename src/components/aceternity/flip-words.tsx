import { cn } from "cn";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

interface FlipWordsProps {
	words: string[];
	interval?: number;
	className?: string;
}

/**
 * Efecto "Flip Words" (Aceternity): rota entre palabras con entrada y salida
 * suaves. Solo transform/opacity.
 */
export function FlipWords({
	words,
	interval = 2600,
	className,
}: FlipWordsProps) {
	const [index, setIndex] = useState(0);
	const reduce = useReducedMotion();

	useEffect(() => {
		if (reduce || words.length <= 1) return;
		const id = window.setInterval(() => {
			setIndex((current) => (current + 1) % words.length);
		}, interval);
		return () => window.clearInterval(id);
	}, [interval, reduce, words.length]);

	return (
		<span className={cn("relative inline-flex overflow-hidden", className)}>
			<span className="sr-only">{words.join(", ")}</span>
			<AnimatePresence mode="wait" initial={false}>
				<motion.span
					key={index}
					aria-hidden="true"
					className="inline-block"
					initial={{ opacity: 0, y: reduce ? 0 : -26 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: reduce ? 0 : 26 }}
					transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
				>
					{words[index]}
				</motion.span>
			</AnimatePresence>
		</span>
	);
}
