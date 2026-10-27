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
 * Usa el globo oficial de /public/logo_remax.png junto al wordmark tipográfico
 * "RE/MAX" + "Potosí". Si la imagen no carga, cae al monograma "R" para no
 * romper el encabezado. En impresión se fuerza blanco y negro.
 */
export function Logo({
	variant = "default",
	className,
	showCity = true,
}: LogoProps) {
	const [imageFailed, setImageFailed] = useState(false);
	const isLight = variant === "light";

	return (
		<span
			role="img"
			className={cn("inline-flex items-center gap-2.5 select-none", className)}
			aria-label="RE/MAX Potosí"
		>
			{imageFailed ? (
				<span
					aria-hidden="true"
					className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary font-display text-[15px] font-extrabold text-white"
				>
					R
				</span>
			) : (
				<img
					src="/logo_remax.png"
					alt=""
					aria-hidden="true"
					width={460}
					height={444}
					draggable={false}
					decoding="async"
					onError={() => setImageFailed(true)}
					className="size-10 shrink-0 object-contain select-none print:grayscale"
				/>
			)}
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
							isLight ? "text-white/70" : "text-brand-text",
						)}
					>
						Potosí
					</span>
				) : null}
			</span>
		</span>
	);
}
