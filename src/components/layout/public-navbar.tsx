import {
	Link,
	useNavigate,
	useRouteContext,
	useRouter,
} from "@tanstack/react-router";
import { cn } from "cn";
import { LayoutDashboard, LogOut, Menu, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import {
	etiquetaRol,
	nombreCompleto,
	rutaPanel,
	type SesionUsuario,
} from "@/lib/auth";
import { iniciales } from "@/lib/format";
import { cerrarSesion as cerrarSesionServidor } from "@/server/auth";

const enlaces = [
	{ label: "Inicio", to: "/" as const },
	{ label: "Propiedades", to: "/propiedades" as const },
	{ label: "Cómo funciona", to: "/" as const, hash: "como-funciona" },
	{ label: "Agentes", to: "/" as const, hash: "agentes" },
	{ label: "Contacto", to: "/" as const, hash: "contacto" },
];

/** Navbar flotante con blur para el sitio público (Aceternity Floating Nav adaptado). */
export function PublicNavbar() {
	const navigate = useNavigate();
	const router = useRouter();
	const { sesion } = useRouteContext({ from: "__root__" }) as {
		sesion: SesionUsuario | null;
	};
	const [scrolled, setScrolled] = useState(false);
	const [menuAbierto, setMenuAbierto] = useState(false);
	const [saliendo, setSaliendo] = useState(false);
	const nombre = sesion ? nombreCompleto(sesion) : "";
	const publicarA =
		sesion?.rol === "administrador" ? "/admin/inmuebles/nuevo" : "/ingresar";

	useEffect(() => {
		function onScroll() {
			setScrolled(window.scrollY > 12);
		}
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	async function cerrarSesion() {
		setSaliendo(true);
		try {
			const resultado = await cerrarSesionServidor();

			if (!resultado.ok) {
				toast.error("No se pudo cerrar la sesión", {
					description: resultado.error,
				});
				return;
			}

			setMenuAbierto(false);
			toast.success("Sesión cerrada");
			await router.invalidate();
			await navigate({ to: "/" });
		} finally {
			setSaliendo(false);
		}
	}

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
					{sesion ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type="button"
									className="hidden items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:flex"
									aria-label="Menú de usuario"
								>
									<Avatar className="size-8">
										<AvatarImage
											src={sesion.avatarUrl ?? undefined}
											alt={nombre}
										/>
										<AvatarFallback className="bg-blue-soft text-primary">
											{iniciales(nombre)}
										</AvatarFallback>
									</Avatar>
									<span className="hidden text-left leading-tight sm:grid">
										<span className="max-w-32 truncate text-sm font-semibold text-foreground">
											{nombre.split(" ").slice(0, 2).join(" ")}
										</span>
										<span className="text-xs text-muted-foreground">
											{etiquetaRol(sesion.rol)}
										</span>
									</span>
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-56">
								<DropdownMenuLabel>
									<span className="block text-sm font-semibold">{nombre}</span>
									<span className="block text-xs font-normal text-muted-foreground">
										{sesion.correo}
									</span>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem asChild>
									<Link to={rutaPanel(sesion.rol)}>
										<LayoutDashboard aria-hidden="true" />
										Ir a mi panel
									</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onSelect={cerrarSesion}
									disabled={saliendo}
									className="text-destructive focus:text-destructive"
								>
									<LogOut aria-hidden="true" />
									{saliendo ? "Cerrando sesión…" : "Cerrar sesión"}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<Button
							asChild
							variant="ghost"
							size="sm"
							className="hidden sm:inline-flex"
						>
							<Link to="/ingresar">Ingresar</Link>
						</Button>
					)}
					<Button
						asChild
						variant="cta"
						size="sm"
						className="hidden sm:inline-flex"
					>
						<Link to={publicarA}>
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
								{sesion ? (
									<>
										<div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
											<Avatar className="size-9">
												<AvatarImage
													src={sesion.avatarUrl ?? undefined}
													alt={nombre}
												/>
												<AvatarFallback className="bg-blue-soft text-primary">
													{iniciales(nombre)}
												</AvatarFallback>
											</Avatar>
											<div className="min-w-0">
												<p className="truncate text-sm font-semibold text-foreground">
													{nombre}
												</p>
												<p className="truncate text-xs text-muted-foreground">
													{etiquetaRol(sesion.rol)}
												</p>
											</div>
										</div>
										<Button
											asChild
											variant="outline"
											onClick={() => setMenuAbierto(false)}
										>
											<Link to={rutaPanel(sesion.rol)}>
												<LayoutDashboard aria-hidden="true" />
												Ir a mi panel
											</Link>
										</Button>
										<Button
											variant="ghost"
											onClick={cerrarSesion}
											disabled={saliendo}
											className="text-muted-foreground"
										>
											<LogOut aria-hidden="true" />
											{saliendo ? "Cerrando sesión…" : "Cerrar sesión"}
										</Button>
									</>
								) : (
									<Button
										asChild
										variant="outline"
										onClick={() => setMenuAbierto(false)}
									>
										<Link to="/ingresar">Ingresar</Link>
									</Button>
								)}
								<Button
									asChild
									variant="cta"
									onClick={() => setMenuAbierto(false)}
								>
									<Link to={publicarA}>
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
