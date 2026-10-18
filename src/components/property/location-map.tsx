import { Compass, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LocationMapProps {
	zona: string;
	direccion: string;
	titulo: string;
}

/** Bloque de ubicación con mapa visual estático (sin API de mapas). */
export function LocationMap({ zona, direccion, titulo }: LocationMapProps) {
	const consulta = encodeURIComponent(`${direccion}, Potosí, Bolivia`);

	return (
		<div className="overflow-hidden rounded-xl border border-border">
			<div className="relative h-64 bg-blue-soft sm:h-72">
				<svg
					aria-hidden="true"
					className="absolute inset-0 size-full"
					viewBox="0 0 800 320"
					preserveAspectRatio="xMidYMid slice"
				>
					<rect width="800" height="320" fill="#EAF0FB" />
					<g stroke="#CBD8EE" strokeWidth="14" strokeLinecap="round">
						<path d="M-20 90H820" />
						<path d="M-20 230H820" />
						<path d="M150 -20V340" />
						<path d="M600 -20V340" />
					</g>
					<g stroke="#DCE5F5" strokeWidth="7" strokeLinecap="round">
						<path d="M-20 160H820" />
						<path d="M360 -20V340" />
						<path d="M480 -20V340" />
					</g>
					<path d="M600 -20L820 120V320H560L600 -20Z" fill="#DDE7F7" />
				</svg>

				<span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full">
					<span className="relative flex items-center justify-center">
						<span className="absolute size-12 animate-ping rounded-full bg-cta/25" />
						<MapPin
							className="relative size-9 fill-cta text-white drop-shadow-md"
							aria-hidden="true"
						/>
					</span>
				</span>

				<div className="absolute inset-x-3 bottom-3 flex flex-col gap-3 rounded-lg border border-border bg-card/95 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-start gap-3">
						<span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-soft text-primary">
							<Compass className="size-4" aria-hidden="true" />
						</span>
						<div>
							<p className="font-display text-sm font-bold text-foreground">
								{zona}
							</p>
							<p className="text-xs text-muted-foreground">{direccion}</p>
						</div>
					</div>
					<Button asChild variant="outline" size="sm">
						<a
							href={`https://www.google.com/maps/search/?api=1&query=${consulta}`}
							target="_blank"
							rel="noreferrer noopener"
						>
							<Navigation aria-hidden="true" />
							Cómo llegar
						</a>
					</Button>
				</div>
			</div>
			<p className="border-t border-border bg-card px-4 py-2.5 text-xs text-muted-foreground">
				Ubicación referencial de {titulo}. El mapa se muestra de forma
				ilustrativa.
			</p>
		</div>
	);
}
