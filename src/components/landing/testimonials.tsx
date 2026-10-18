import { Quote } from "lucide-react";
import { InfiniteMovingCards } from "@/components/aceternity/infinite-moving-cards";
import { SectionHeading } from "@/components/common/section-heading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { testimonios } from "@/data/testimonios";
import { iniciales } from "@/lib/format";

export function Testimonials() {
	const items = testimonios.map((testimonio) => (
		<figure
			key={testimonio.id}
			className="flex h-full flex-col rounded-xl border border-border bg-card p-6"
		>
			<Quote className="size-6 text-primary/40" aria-hidden="true" />
			<blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground">
				“{testimonio.texto}”
			</blockquote>
			<figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
				<Avatar>
					<AvatarImage src={testimonio.avatarUrl} alt={testimonio.nombre} />
					<AvatarFallback className="bg-blue-soft text-primary">
						{iniciales(testimonio.nombre)}
					</AvatarFallback>
				</Avatar>
				<span>
					<span className="block font-display text-sm font-bold text-foreground">
						{testimonio.nombre}
					</span>
					<span className="block text-xs text-muted-foreground">
						{testimonio.rol}
					</span>
				</span>
			</figcaption>
		</figure>
	));

	return (
		<section className="overflow-hidden py-16 lg:py-24">
			<div className="container-page">
				<SectionHeading
					title="Lo que dicen nuestros clientes"
					description="Historias reales de inquilinos y propietarios que confiaron en RE/MAX Potosí. Testimonios de ejemplo."
					align="center"
				/>
			</div>
			<div className="mt-10">
				<InfiniteMovingCards items={items} speed="normal" />
			</div>
		</section>
	);
}
