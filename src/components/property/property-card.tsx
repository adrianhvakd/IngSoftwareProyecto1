import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { Bath, BedDouble, Car, MapPin, Maximize2, Star } from "lucide-react";
import { SmartImage } from "@/components/common/smart-image";
import { inmuebleTone, StatusBadge } from "@/components/common/status-badge";
import type { Inmueble } from "@/data/types";
import { formatBsMes } from "@/lib/format";

interface PropertyCardProps {
	inmueble: Inmueble;
	variant?: "grid" | "list";
	className?: string;
}

export function PropertyCard({
	inmueble,
	variant = "grid",
	className,
}: PropertyCardProps) {
	const esLista = variant === "list";

	return (
		<article
			className={cn(
				"group relative flex overflow-hidden rounded-xl border border-border bg-card transition-[box-shadow,transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[var(--shadow-lift)]",
				esLista ? "flex-col sm:flex-row" : "flex-col",
				className,
			)}
		>
			<Link
				to="/propiedades/$id"
				params={{ id: inmueble.id }}
				className="flex h-full flex-1 flex-col focus-visible:outline-none"
				aria-label={`Ver detalle de ${inmueble.titulo}`}
			>
				<div className={cn("relative", esLista && "sm:w-[320px] sm:shrink-0")}>
					<SmartImage
						src={inmueble.imagenes[0]}
						alt={`${inmueble.titulo}, ${inmueble.zona}`}
						aspectRatio={esLista ? "4 / 3" : "4 / 3"}
						className={cn("w-full", esLista && "sm:h-full")}
						sizes="(max-width: 768px) 100vw, 33vw"
					/>
					<div className="absolute top-3 left-3 flex flex-wrap gap-2">
						<StatusBadge tone={inmuebleTone[inmueble.estado]}>
							{inmueble.estado}
						</StatusBadge>
						{inmueble.destacado ? (
							<StatusBadge tone="cta" className="gap-1">
								<Star className="size-3 fill-current" aria-hidden="true" />
								Destacado
							</StatusBadge>
						) : null}
					</div>
					<span className="absolute right-3 bottom-3 rounded-full bg-foreground/85 px-3 py-1 font-display text-sm font-bold tabular text-background backdrop-blur-sm">
						{formatBsMes(inmueble.precio)}
					</span>
				</div>

				<div className="flex flex-1 flex-col p-5">
					<span className="text-xs font-semibold tracking-wide text-primary uppercase">
						{inmueble.tipo} · {inmueble.codigo}
					</span>
					<h3 className="mt-1.5 line-clamp-2 font-display text-lg font-bold text-foreground transition-colors group-hover:text-primary">
						{inmueble.titulo}
					</h3>
					<p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
						<MapPin
							className="size-4 shrink-0 text-primary/70"
							aria-hidden="true"
						/>
						<span className="line-clamp-1">
							{inmueble.zona} · {inmueble.direccion}
						</span>
					</p>

					<div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
						<span className="inline-flex items-center gap-1.5">
							<Maximize2
								className="size-4 text-primary/70"
								aria-hidden="true"
							/>
							<span className="tabular">{inmueble.m2} m²</span>
						</span>
						{inmueble.habitaciones > 0 ? (
							<span className="inline-flex items-center gap-1.5">
								<BedDouble
									className="size-4 text-primary/70"
									aria-hidden="true"
								/>
								<span className="tabular">{inmueble.habitaciones} hab.</span>
							</span>
						) : null}
						{inmueble.banos > 0 ? (
							<span className="inline-flex items-center gap-1.5">
								<Bath className="size-4 text-primary/70" aria-hidden="true" />
								<span className="tabular">{inmueble.banos} baños</span>
							</span>
						) : null}
						{inmueble.estacionamientos > 0 ? (
							<span className="inline-flex items-center gap-1.5">
								<Car className="size-4 text-primary/70" aria-hidden="true" />
								<span className="tabular">
									{inmueble.estacionamientos} parqueo
									{inmueble.estacionamientos > 1 ? "s" : ""}
								</span>
							</span>
						) : null}
					</div>

					{esLista ? (
						<p className="mt-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
							{inmueble.descripcion}
						</p>
					) : null}
				</div>
			</Link>
		</article>
	);
}
