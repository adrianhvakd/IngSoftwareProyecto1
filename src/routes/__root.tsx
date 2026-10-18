import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { ErrorPage } from "@/components/system/error-page";
import { NotFoundPage } from "@/components/system/not-found-page";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover",
			},
			{
				title: "RE/MAX Potosí · Alquiler de casas, departamentos y locales",
			},
			{
				name: "description",
				content:
					"Portal de gestión y alquiler de inmuebles en Potosí, Bolivia. Encuentra casas, departamentos, locales y terrenos, agenda visitas y gestiona tus cuotas mensuales.",
			},
			{ name: "theme-color", content: "#003DA5" },
			{ name: "robots", content: "noindex, nofollow" },
			{ property: "og:type", content: "website" },
			{ property: "og:site_name", content: "RE/MAX Potosí" },
			{
				property: "og:title",
				content: "RE/MAX Potosí · Encuentra tu próximo hogar en Potosí",
			},
			{
				property: "og:description",
				content:
					"Casas, departamentos, locales y terrenos en alquiler en Potosí. Visitas, contratos y cobros mensuales en un solo lugar.",
			},
			{ property: "og:image", content: "/og-image.svg" },
			{ property: "og:locale", content: "es_BO" },
			{ name: "twitter:card", content: "summary_large_image" },
			{
				name: "twitter:title",
				content: "RE/MAX Potosí · Encuentra tu próximo hogar en Potosí",
			},
			{ name: "twitter:image", content: "/og-image.svg" },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
			{ rel: "apple-touch-icon", href: "/favicon.svg" },
		],
	}),
	component: RootDocument,
	notFoundComponent: NotFoundPage,
	errorComponent: ErrorPage,
});

function RootDocument() {
	return (
		<html lang="es-BO">
			<head>
				<HeadContent />
			</head>
			<body className="bg-background text-foreground antialiased">
				<TooltipProvider delayDuration={200}>
					<Outlet />
				</TooltipProvider>
				<Toaster position="top-right" richColors closeButton />
				<Scripts />
			</body>
		</html>
	);
}
