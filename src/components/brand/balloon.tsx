import { cn } from "cn";

interface BalloonMotifProps {
	className?: string;
	/** Opacidad global del motivo. Por defecto muy sutil. */
	opacity?: number;
}

/**
 * Motivo decorativo del globo aerostático de marca (rojo arriba, blanco al
 * centro, azul abajo). Forma decorativa de baja opacidad; NO es el logo oficial.
 */
export function BalloonMotif({ className, opacity = 0.12 }: BalloonMotifProps) {
	return (
		<svg
			aria-hidden="true"
			focusable="false"
			viewBox="0 0 200 260"
			className={cn("pointer-events-none select-none", className)}
			style={{ opacity }}
		>
			<defs>
				<clipPath id="balloon-envelope">
					<path d="M100 6c46 0 74 34 74 82 0 44-30 78-74 108-44-30-74-64-74-108C26 40 54 6 100 6Z" />
				</clipPath>
				<linearGradient id="balloon-sheen" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
					<stop offset="1" stopColor="#ffffff" stopOpacity="0" />
				</linearGradient>
			</defs>

			<g clipPath="url(#balloon-envelope)">
				<rect x="20" y="0" width="160" height="92" fill="#DC1C2D" />
				<rect x="20" y="92" width="160" height="70" fill="#FFFFFF" />
				<rect x="20" y="162" width="160" height="120" fill="#003DA5" />
				<g stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="2">
					<path d="M100 6v200" />
					<path d="M60 14c-10 40-10 96 8 164" fill="none" />
					<path d="M140 14c10 40 10 96-8 164" fill="none" />
				</g>
				<ellipse cx="72" cy="70" rx="60" ry="90" fill="url(#balloon-sheen)" />
			</g>

			<path
				d="M78 196l10 14h24l10-14"
				fill="none"
				stroke="#0F172A"
				strokeOpacity="0.5"
				strokeWidth="3"
				strokeLinecap="round"
			/>
			<path
				d="M88 210l12 16 12-16"
				fill="none"
				stroke="#0F172A"
				strokeOpacity="0.4"
				strokeWidth="3"
				strokeLinecap="round"
			/>
			<rect
				x="78"
				y="226"
				width="44"
				height="26"
				rx="4"
				fill="#0F172A"
				fillOpacity="0.35"
			/>
		</svg>
	);
}
