import { cn } from "cn";
import { Building2 } from "lucide-react";
import { useState } from "react";

interface SmartImageProps {
	src: string;
	alt: string;
	className?: string;
	imgClassName?: string;
	/** Relación de aspecto para reservar espacio y evitar saltos. `null` para llenar el contenedor. */
	aspectRatio?: string | null;
	width?: number;
	height?: number;
	/** Si la imagen está en el primer viewport, evita lazy. */
	eager?: boolean;
	sizes?: string;
}

/**
 * Imagen con estado de carga y fallback (gradiente + icono).
 * Reserva el espacio con aspect-ratio y carga en diferido.
 */
export function SmartImage({
	src,
	alt,
	className,
	imgClassName,
	aspectRatio = "4 / 3",
	width = 1200,
	height = 900,
	eager = false,
	sizes,
}: SmartImageProps) {
	const [estado, setEstado] = useState<"cargando" | "listo" | "error">(
		"cargando",
	);

	return (
		<div
			className={cn("relative isolate overflow-hidden bg-muted", className)}
			style={aspectRatio ? { aspectRatio } : undefined}
		>
			{estado === "cargando" ? (
				<div className="absolute inset-0 animate-pulse bg-gradient-to-br from-secondary to-muted" />
			) : null}

			{estado === "error" ? (
				<div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-blue-soft via-secondary to-muted">
					<Building2 className="size-9 text-primary/35" aria-hidden="true" />
					<span className="sr-only">{alt}</span>
				</div>
			) : (
				<img
					src={src}
					alt={alt}
					width={width}
					height={height}
					sizes={sizes}
					loading={eager ? "eager" : "lazy"}
					decoding="async"
					onLoad={() => setEstado("listo")}
					onError={() => setEstado("error")}
					className={cn(
						"size-full object-cover transition-opacity duration-300 ease-out",
						estado === "listo" ? "opacity-100" : "opacity-0",
						imgClassName,
					)}
				/>
			)}
		</div>
	);
}
