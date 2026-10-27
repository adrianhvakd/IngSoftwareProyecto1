import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import { Menu, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";

const enlaces = [
	{ label: "Inicio", to: "/" as const },
	{ label: "Propiedades", to: "/propiedades" as const },
	{ label: "Cómo funciona", to: "/" as const, hash: "como-funciona" },
	{ label: "Agentes", to: "/" as const, hash: "agentes" },
	{ label: "Contacto", to: "/" as const, hash: "contacto" },
];

/** Navbar flotante con blur para el sitio público (Aceternity Floating Nav adaptado). */
export function PublicNavbar() {
	const [scrolled, setScrolled] = useState(false);
	const [menuAbierto, setMenuAbierto] = useState(false);

	useEffect(() => {
		function onScroll() {
			setScrolled(window.scrollY > 12);
		}
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<header className="fixed inset-x-0 top-3 z-40 px-3 sm:top-4 sm:px-4">
			<nav
				aria-label="Navegación principal"
				className={cn(
					"mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background/80 px-4 backdrop-blur-lg transition-shadow duration-300 ease-out sm:px-5",
					scrolled
						? "shadow-[var(--shadow-lift)]"
						: "shadow-[var(--shadow-soft)]",
				)}
			>
				<Link
					to="/"
					className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
					aria-label="RE/MAX Potosí, ir al inicio"
				>
					<Logo />
				</Link>

				<ul className="hidden items-center gap-1 lg:flex">
					{enlaces.map((enlace) => (
						<li key={enlace.label}>
							<Link
								to={enlace.to}
								hash={enlace.hash}
								activeOptions={{ exact: enlace.to === "/" && !enlace.hash }}
								className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-150 ease-out hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
								activeProps={{
									className: "text-primary",
								}}
							>
								{enlace.label}
							</Link>
						</li>
					))}
				</ul>

				<div className="flex items-center gap-2">
					<ThemeToggle />
					<Button
						asChild
						variant="ghost"
						size="sm"
						className="hidden sm:inline-flex"
					>
						<Link to="/ingresar">Ingresar</Link>
					</Button>
					<Button
						asChild
						variant="cta"
						size="sm"
						className="hidden sm:inline-flex"
					>
						<Link to="/ingresar">
							<Plus aria-hidden="true" />
							Publicar inmueble
						</Link>
					</Button>

					<Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
						<SheetTrigger asChild>
							<Button
								variant="outline"
								size="icon"
								className="lg:hidden"
								aria-label="Abrir menú"
							>
								<Menu aria-hidden="true" />
							</Button>
						</SheetTrigger>
						<SheetContent side="right" className="w-[88vw] max-w-sm">
							<SheetHeader>
								<SheetTitle className="text-left">
									<Logo />
								</SheetTitle>
								<SheetDescription className="text-left">
									Navega por el portal de RE/MAX Potosí.
								</SheetDescription>
							</SheetHeader>

							<ul className="flex flex-col gap-1 px-4">
								{enlaces.map((enlace) => (
									<li key={enlace.label}>
										<Link
											to={enlace.to}
											hash={enlace.hash}
											onClick={() => setMenuAbierto(false)}
											className="block rounded-lg px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
										>
											{enlace.label}
										</Link>
									</li>
								))}
							</ul>

							<div className="mt-auto flex flex-col gap-2 px-4 pb-6">
								<ThemeToggle variant="inline" />
								<Button
									asChild
									variant="outline"
									onClick={() => setMenuAbierto(false)}
								>
									<Link to="/ingresar">Ingresar</Link>
								</Button>
								<Button
									asChild
									variant="cta"
									onClick={() => setMenuAbierto(false)}
								>
									<Link to="/ingresar">
										<Plus aria-hidden="true" />
										Publicar inmueble
									</Link>
								</Button>
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</nav>
		</header>
	);
}
