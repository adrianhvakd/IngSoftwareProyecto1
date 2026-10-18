import { cn } from "cn";
import { useState } from "react";

interface LogoProps {
	/** "default" sobre fondos claros, "light" sobre fondos azules/oscuros. */
	variant?: "default" | "light";
	className?: string;
	/** Muestra "Potosí" bajo el wordmark. */
	showCity?: boolean;
}

/**
 * Marca de la oficina.
 *
 * Carga /public/logo-remax.svg (reemplazable) cuando se activa con
 * `VITE_USE_LOGO_SVG=true`. Mientras el archivo no exista, compone el wordmark
 * "RE/MAX" + "Potosí" con la tipografía. Si el SVG falla, vuelve al wordmark.
 */
export function Logo({
	variant = "default",
	className,
	showCity = true,
}: LogoProps) {
	const [imageFailed, setImageFailed] = useState(false);
	const isLight = variant === "light";
	const usarSvg = import.meta.env.VITE_USE_LOGO_SVG === "true";

	if (usarSvg && !imageFailed) {
		return (
			<img
				src="/logo-remax.svg"
				alt="RE/MAX Potosí"
				width={180}
				height={48}
				className={cn("h-9 w-auto", className)}
				onError={() => setImageFailed(true)}
			/>
		);
	}

	return (
		<span
			role="img"
			className={cn("inline-flex items-center gap-2.5 select-none", className)}
			aria-label="RE/MAX Potosí"
		>
			<span
				aria-hidden="true"
				className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary font-display text-[15px] font-extrabold text-white"
			>
				R
			</span>
			<span className="flex flex-col leading-none">
				<span
					className={cn(
						"font-display text-xl font-extrabold tracking-tight",
						isLight ? "text-white" : "text-foreground",
					)}
				>
					RE<span className="text-cta">/</span>MAX
				</span>
				{showCity ? (
					<span
						className={cn(
							"mt-0.5 text-[11px] font-semibold tracking-[0.28em] uppercase",
							isLight ? "text-white/70" : "text-primary",
						)}
					>
						Potosí
					</span>
				) : null}
			</span>
		</span>
	);
}
