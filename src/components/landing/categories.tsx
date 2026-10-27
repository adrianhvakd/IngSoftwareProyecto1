import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/common/section-heading";
import { SmartImage } from "@/components/common/smart-image";
import { inmuebles } from "@/data/inmuebles";
import type { TipoInmueble } from "@/data/types";

interface Categoria {
	tipo: TipoInmueble;
	descripcion: string;
	imagen: string;
}

const CATEGORIAS: Categoria[] = [
	{
		tipo: "Casa",
		descripcion: "Con patio, garaje o vista al Cerro Rico",
		imagen:
			"https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=70",
	},
	{
		tipo: "Departamento",
		descripcion: "Amoblados y sin amoblar, en el centro",
		imagen:
			"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=70",
	},
	{
		tipo: "Local",
		descripcion: "Vitrinas y oficinas listas para operar",
		imagen:
			"https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=70",
	},
];

export function Categories() {
	return (
		<section className="bg-secondary/60 py-16 lg:py-24">
			<div className="container-page">
				<SectionHeading
					title="Explora por tipo de inmueble"
					description="Filtra por lo que buscas y llega directo a las opciones disponibles en cada zona de la ciudad."
				/>

				<div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
					{CATEGORIAS.map((categoria) => {
						const cantidad = inmuebles.filter(
							(i) => i.tipo === categoria.tipo,
						).length;
						return (
							<Link
								key={categoria.tipo}
								to="/propiedades"
								search={{ tipo: categoria.tipo }}
								className="group relative block overflow-hidden rounded-xl border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
							>
								<SmartImage
									src={categoria.imagen}
									alt={`Inmuebles tipo ${categoria.tipo}`}
									aspectRatio="3 / 4"
									className="w-full"
									imgClassName="transition-transform duration-500 ease-out group-hover:scale-[1.04]"
									sizes="(max-width: 768px) 100vw, 25vw"
								/>
								<span
									aria-hidden="true"
									className="absolute inset-0 bg-gradient-to-t from-blue-dark/85 via-blue-dark/25 to-transparent"
								/>
								<span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
									<span>
										<span className="font-display text-xl font-extrabold text-white">
											{categoria.tipo}
										</span>
										<span className="mt-1 block text-xs text-white/80">
											{cantidad} disponibles · {categoria.descripcion}
										</span>
									</span>
									<span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/15 text-white transition-transform duration-200 ease-out group-hover:-translate-y-1 group-hover:translate-x-1">
										<ArrowUpRight className="size-4" aria-hidden="true" />
									</span>
								</span>
							</Link>
						);
					})}
				</div>
			</div>
		</section>
	);
}
