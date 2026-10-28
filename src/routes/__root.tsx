import {
	createRootRoute,
	HeadContent,
	Outlet,
	redirect,
	Scripts,
} from "@tanstack/react-router";
import { ErrorPage } from "@/components/system/error-page";
import { NotFoundPage } from "@/components/system/not-found-page";
import {
	THEME_INLINE_SCRIPT,
	ThemeProvider,
} from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { obtenerSesion } from "@/server/auth";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
	// La sesión se resuelve una vez por navegación y queda disponible en el
	// contexto de todas las rutas hijas (guards, navbar y paneles).
	beforeLoad: async ({ location }) => {
		const sesion = await obtenerSesion();

		// La contraseña temporal es obligatoria: hasta cambiarla no se puede
		// navegar a ninguna otra pantalla (incluido el sitio público).
		if (
			sesion?.debeCambiarPassword &&
			location.pathname !== "/cambiar-password"
		) {
			throw redirect({ to: "/cambiar-password" });
		}

		return { sesion };
	},
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
					"Portal de gestión y alquiler de inmuebles en Potosí, Bolivia. Encuentra casas, departamentos y locales, agenda visitas y gestiona tus cuotas mensuales.",
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
					"Casas, departamentos y locales en alquiler en Potosí. Visitas, contratos y cobros mensuales en un solo lugar.",
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
			{ rel: "icon", href: "/logo_remax.ico", type: "image/x-icon" },
			{ rel: "shortcut icon", href: "/logo_remax.ico" },
			{
				rel: "apple-touch-icon",
				href: "/apple-touch-icon.png",
				sizes: "180x180",
			},
		],
	}),
	component: RootDocument,
	notFoundComponent: NotFoundPage,
	errorComponent: ErrorPage,
});

function RootDocument() {
	// El script anti-flash añade class="dark" y color-scheme antes de hidratar;
	// suppressHydrationWarning evita el falso positivo de React en <html>.
	return (
		<html lang="es-BO" suppressHydrationWarning>
			<head>
				<HeadContent />
				{/* Evita el flash de tema: aplica .dark antes de hidratar */}
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: script inline necesario para evitar el flash de tema antes de la hidratación */}
				<script dangerouslySetInnerHTML={{ __html: THEME_INLINE_SCRIPT }} />
			</head>
			<body className="bg-background text-foreground antialiased">
				<ThemeProvider>
					<TooltipProvider delayDuration={200}>
						<Outlet />
					</TooltipProvider>
					<Toaster position="top-right" richColors closeButton />
				</ThemeProvider>
				<Scripts />
			</body>
		</html>
	);
}
