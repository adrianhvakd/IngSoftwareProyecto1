import { cn } from "cn";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useState } from "react";
import { SmartImage } from "@/components/common/smart-image";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";

interface PropertyGalleryProps {
	imagenes: string[];
	titulo: string;
}

export function PropertyGallery({ imagenes, titulo }: PropertyGalleryProps) {
	const [activa, setActiva] = useState(0);
	const [lightbox, setLightbox] = useState(false);

	const total = imagenes.length;
	const anterior = () => setActiva((i) => (i - 1 + total) % total);
	const siguiente = () => setActiva((i) => (i + 1) % total);

	return (
		<div>
			<div className="relative overflow-hidden rounded-xl border border-border">
				<SmartImage
					src={imagenes[activa]}
					alt={`${titulo} — imagen ${activa + 1} de ${total}`}
					aspectRatio="16 / 10"
					eager
					className="w-full"
					sizes="(max-width: 1024px) 100vw, 66vw"
					width={1600}
					height={1000}
				/>
				<div className="absolute right-3 bottom-3 flex items-center gap-2">
					<Button
						variant="secondary"
						size="icon-sm"
						onClick={anterior}
						aria-label="Imagen anterior"
						className="bg-background/85 backdrop-blur-sm"
					>
						<ChevronLeft aria-hidden="true" />
					</Button>
					<span className="rounded-full bg-foreground/80 px-3 py-1 text-xs font-semibold tabular text-background">
						{activa + 1} / {total}
					</span>
					<Button
						variant="secondary"
						size="icon-sm"
						onClick={siguiente}
						aria-label="Imagen siguiente"
						className="bg-background/85 backdrop-blur-sm"
					>
						<ChevronRight aria-hidden="true" />
					</Button>
					<Button
						variant="secondary"
						size="sm"
						onClick={() => setLightbox(true)}
						className="bg-background/85 backdrop-blur-sm"
					>
						<Expand aria-hidden="true" />
						Ver fotos
					</Button>
				</div>
			</div>

			<div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
				{imagenes.map((imagen, index) => (
					<button
						key={imagen}
						type="button"
						onClick={() => setActiva(index)}
						aria-label={`Ver imagen ${index + 1}`}
						aria-current={index === activa}
						className={cn(
							"overflow-hidden rounded-lg border transition-[border-color,opacity] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
							index === activa
								? "border-primary"
								: "border-border opacity-70 hover:opacity-100",
						)}
					>
						<SmartImage
							src={imagen}
							alt=""
							aspectRatio="1 / 1"
							width={200}
							height={200}
						/>
					</button>
				))}
			</div>

			<Dialog open={lightbox} onOpenChange={setLightbox}>
				<DialogContent
					className="max-w-5xl border-none bg-transparent p-0 shadow-none"
					showCloseButton={false}
				>
					<DialogTitle className="sr-only">{titulo}</DialogTitle>
					<DialogDescription className="sr-only">
						Galería de fotos del inmueble
					</DialogDescription>
					<div className="relative overflow-hidden rounded-xl bg-black/90">
						<SmartImage
							src={imagenes[activa]}
							alt={`${titulo} — imagen ampliada`}
							aspectRatio="16 / 10"
							className="w-full"
							width={1800}
							height={1125}
						/>
						<Button
							variant="secondary"
							size="icon"
							onClick={anterior}
							aria-label="Imagen anterior"
							className="absolute top-1/2 left-3 -translate-y-1/2 bg-background/85"
						>
							<ChevronLeft aria-hidden="true" />
						</Button>
						<Button
							variant="secondary"
							size="icon"
							onClick={siguiente}
							aria-label="Imagen siguiente"
							className="absolute top-1/2 right-3 -translate-y-1/2 bg-background/85"
						>
							<ChevronRight aria-hidden="true" />
						</Button>
						<button
							type="button"
							onClick={() => setLightbox(false)}
							aria-label="Cerrar galería"
							className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-background/85 text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
						>
							<X className="size-4" aria-hidden="true" />
						</button>
						<span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background/85 px-3 py-1 text-xs font-semibold tabular text-foreground">
							{activa + 1} / {total}
						</span>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
