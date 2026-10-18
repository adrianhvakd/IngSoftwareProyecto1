import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CardContainer } from "@/components/aceternity/three-d-card";
import { SectionHeading } from "@/components/common/section-heading";
import { PropertyCard } from "@/components/property/property-card";
import { Button } from "@/components/ui/button";
import { inmuebles } from "@/data/inmuebles";

export function FeaturedProperties() {
	const destacados = [
		...inmuebles.filter((i) => i.destacado),
		...inmuebles.filter((i) => !i.destacado),
	].slice(0, 3);

	return (
		<section className="container-page py-16 lg:py-24">
			<SectionHeading
				title="Inmuebles destacados"
				description="Una selección de las propiedades con mayor demanda en Potosí este mes. Todas verificadas por nuestro equipo."
				action={
					<Button asChild variant="outline">
						<Link to="/propiedades">
							Ver todas las propiedades
							<ArrowRight aria-hidden="true" />
						</Link>
					</Button>
				}
			/>

			<div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{destacados.map((inmueble) => (
					<CardContainer key={inmueble.id} tilt={5}>
						<PropertyCard inmueble={inmueble} />
					</CardContainer>
				))}
			</div>
		</section>
	);
}
