import { createFileRoute } from "@tanstack/react-router";
import { Agents } from "@/components/landing/agents";
import { Categories } from "@/components/landing/categories";
import { FeaturedProperties } from "@/components/landing/featured-properties";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Metrics } from "@/components/landing/metrics";
import { Testimonials } from "@/components/landing/testimonials";
import { PublicLayout } from "@/components/layout/public-layout";

export const Route = createFileRoute("/")({
	head: () => ({
		meta: [
			{
				title: "RE/MAX Potosí · Alquiler de inmuebles en Potosí, Bolivia",
			},
			{
				name: "description",
				content:
					"Encuentra tu próximo hogar en Potosí: casas, departamentos, locales y terrenos en alquiler. Agenda visitas, firma tu contrato y gestiona tus cuotas mensuales.",
			},
			{
				property: "og:title",
				content: "RE/MAX Potosí · Encuentra tu próximo hogar en Potosí",
			},
		],
	}),
	component: HomePage,
});

function HomePage() {
	return (
		<PublicLayout>
			<Hero />
			<FeaturedProperties />
			<Categories />
			<HowItWorks />
			<Metrics />
			<Agents />
			<Testimonials />
			<FinalCta />
		</PublicLayout>
	);
}
