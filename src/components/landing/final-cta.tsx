import { Link } from "@tanstack/react-router";
import { ArrowRight, Plus } from "lucide-react";
import { BalloonMotif } from "@/components/brand/balloon";
import { Button } from "@/components/ui/button";

export function FinalCta() {
	return (
		<section className="container-page py-16 lg:py-24">
			<div className="relative overflow-hidden rounded-2xl bg-blue-dark px-6 py-14 text-center text-white sm:px-12 lg:py-20">
				<BalloonMotif
					className="absolute -top-10 -right-8 w-64 opacity-[0.08] sm:w-80"
					opacity={1}
				/>
				<BalloonMotif
					className="absolute -bottom-14 -left-10 w-56 opacity-[0.06] sm:w-72"
					opacity={1}
				/>
				<div className="relative mx-auto max-w-2xl">
					<h2 className="font-display text-3xl font-extrabold tracking-tight text-balance sm:text-4xl lg:text-5xl">
						¿Tienes un inmueble para alquilar en Potosí?
					</h2>
					<p className="mt-5 text-base leading-relaxed text-white/75 sm:text-lg">
						Publícalo con nosotros, recibe visitas coordinadas y nosotros nos
						encargamos del contrato y de los cobros mensuales. Tú solo recibes
						la renta.
					</p>
					<div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
						<Button asChild variant="cta" size="lg">
							<Link to="/ingresar">
								<Plus aria-hidden="true" />
								Publicar inmueble
							</Link>
						</Button>
						<Button
							asChild
							size="lg"
							variant="outline"
							className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
						>
							<Link to="/propiedades">
								Explorar propiedades
								<ArrowRight aria-hidden="true" />
							</Link>
						</Button>
					</div>
					<p className="mt-6 text-xs text-white/55">
						Sin costo inicial por la publicación · Datos de ejemplo.
					</p>
				</div>
			</div>
		</section>
	);
}
