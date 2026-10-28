import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
	Bell,
	CalendarCheck,
	CircleAlert,
	FileSignature,
	LogOut,
	Search,
	TriangleAlert,
	Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/common/status-badge";
import { navParaRol } from "@/components/dashboard/nav-config";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { etiquetaRol, nombreCompleto, type SesionUsuario } from "@/lib/auth";
import { iniciales } from "@/lib/format";
import { cerrarSesion as cerrarSesionServidor } from "@/server/auth";
import {
	listarNotificaciones,
	marcarNotificacionesLeidas,
} from "@/server/paneles";
import type { Rol } from "@/types/models";
import type { NotificacionVista } from "@/types/paneles";

interface Notificacion {
	id: string;
	titulo: string;
	detalle: string;
	tono: "danger" | "warning" | "info";
	icono: typeof Bell;
	to: string;
	leida: boolean;
}

function aNotificacion(
	fila: NotificacionVista,
	rol: SesionUsuario["rol"],
): Notificacion {
	const esMora = fila.tipo === "cuota_en_mora";
	const esAviso = fila.tipo === "cuota_por_vencer";
	const esVisita =
		fila.tipo === "visita_agendada" || fila.tipo === "visita_asignada";
	const esPago = fila.tipo === "pago_registrado";
	const esCierre = fila.tipo === "alquiler_cerrado";

	const to = (() => {
		if (esVisita) {
			if (rol === "administrador") return "/admin/visitas";
			if (rol === "vendedor") return "/vendedor/visitas";
			return "/cliente";
		}
		if (esMora || esAviso || esPago) {
			if (rol === "administrador") return "/admin/alquileres";
			if (rol === "vendedor") return "/vendedor/registrar-pago";
			return "/cliente/mi-alquiler";
		}
		if (esCierre) {
			if (rol === "administrador") return "/admin/alquileres";
			if (rol === "vendedor") return "/vendedor/comisiones";
			return "/cliente/mi-alquiler";
		}
		if (rol === "vendedor") return "/vendedor";
		return rol === "cliente" ? "/cliente" : "/admin";
	})();

	return {
		id: fila.id,
		titulo: fila.titulo,
		detalle: fila.mensaje,
		tono: esMora ? "danger" : esAviso ? "warning" : "info",
		icono: esMora
			? CircleAlert
			: esAviso
				? TriangleAlert
				: esVisita
					? CalendarCheck
					: esPago
						? Wallet
						: esCierre
							? FileSignature
							: Bell,
		to,
		leida: fila.leida,
	};
}

export function DashboardTopbar({
	rol,
	sesion,
}: {
	rol: Rol;
	sesion: SesionUsuario;
}) {
	const navigate = useNavigate();
	const router = useRouter();
	const grupos = navParaRol(rol);
	const [paletteOpen, setPaletteOpen] = useState(false);
	const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
	const [cargandoNotif, setCargandoNotif] = useState(true);
	const [marcando, setMarcando] = useState(false);
	const [saliendo, setSaliendo] = useState(false);
	const nombre = nombreCompleto(sesion);
	const noLeidas = notificaciones.filter((n) => !n.leida).length;

	useEffect(() => {
		let activo = true;
		setCargandoNotif(true);
		listarNotificaciones()
			.then((filas) => {
				if (!activo) return;
				setNotificaciones(filas.map((fila) => aNotificacion(fila, sesion.rol)));
			})
			.catch((error) => {
				if (!activo) return;
				console.warn(
					"[topbar] No se pudieron cargar las notificaciones:",
					error instanceof Error ? error.message : error,
				);
			})
			.finally(() => {
				if (activo) setCargandoNotif(false);
			});
		return () => {
			activo = false;
		};
	}, [sesion.rol]);

	async function marcarLeidas() {
		if (noLeidas === 0 || marcando) return;
		const anteriores = notificaciones;
		setMarcando(true);
		setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
		try {
			const resultado = await marcarNotificacionesLeidas();
			if (!resultado.ok) {
				setNotificaciones(anteriores);
				toast.error("No se pudieron marcar las notificaciones", {
					description: resultado.error,
				});
			}
		} catch (error) {
			setNotificaciones(anteriores);
			toast.error("No se pudieron marcar las notificaciones", {
				description:
					error instanceof Error ? error.message : "Inténtalo de nuevo.",
			});
		} finally {
			setMarcando(false);
		}
	}

	useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
				event.preventDefault();
				setPaletteOpen((v) => !v);
			}
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
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

			toast.success("Sesión cerrada", {
				description: "Volviendo al portal público.",
			});
			await router.invalidate();
			await navigate({ to: "/" });
		} finally {
			setSaliendo(false);
		}
	}

	return (
		<header className="no-print sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background/90 px-4 backdrop-blur-md sm:px-6">
			<SidebarTrigger className="-ml-1" />
			<Separator orientation="vertical" className="mr-2 !h-5" />

			<button
				type="button"
				onClick={() => setPaletteOpen(true)}
				className="hidden h-9 max-w-sm flex-1 items-center gap-2 rounded-lg border border-input bg-card px-3 text-sm text-muted-foreground transition-colors duration-150 ease-out hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:flex"
			>
				<Search className="size-4" aria-hidden="true" />
				<span className="flex-1 text-left">Buscar en el panel…</span>
				<kbd className="pointer-events-none rounded border border-border bg-muted px-1.5 font-sans text-[10px] font-medium text-muted-foreground">
					Ctrl K
				</kbd>
			</button>

			<div className="ml-auto flex items-center gap-2">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setPaletteOpen(true)}
					className="sm:hidden"
					aria-label="Buscar"
				>
					<Search aria-hidden="true" />
				</Button>

				<ThemeToggle />

				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="relative"
							aria-label="Notificaciones"
							onClick={() => void marcarLeidas()}
						>
							<Bell aria-hidden="true" />
							{noLeidas > 0 ? (
								<span className="absolute top-2 right-2 size-2 rounded-full bg-cta ring-2 ring-background" />
							) : null}
						</Button>
					</PopoverTrigger>
					<PopoverContent align="end" className="w-80 p-0">
						<div className="flex items-center justify-between border-b border-border px-4 py-3">
							<p className="font-display text-sm font-bold text-foreground">
								Notificaciones
							</p>
							<StatusBadge tone={noLeidas > 0 ? "warning" : "muted"}>
								{noLeidas > 0 ? `${noLeidas} nuevas` : "Al día"}
							</StatusBadge>
						</div>
						<ul className="max-h-80 divide-y divide-border overflow-y-auto">
							{cargandoNotif ? (
								<li className="px-4 py-6 text-center text-sm text-muted-foreground">
									Cargando notificaciones…
								</li>
							) : notificaciones.length === 0 ? (
								<li className="px-4 py-6 text-center text-sm text-muted-foreground">
									No tienes notificaciones por ahora.
								</li>
							) : (
								notificaciones.map((n) => {
									const Icono = n.icono;
									return (
										<li key={n.id}>
											<Link
												to={n.to}
												className="flex gap-3 px-4 py-3 transition-colors hover:bg-accent"
											>
												<span
													className={
														n.tono === "danger"
															? "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-red-50 text-destructive"
															: n.tono === "warning"
																? "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-warning-soft text-warning"
																: "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-blue-soft text-primary"
													}
												>
													<Icono className="size-4" aria-hidden="true" />
												</span>
												<span className="min-w-0">
													<span className="block text-sm font-medium text-foreground">
														{n.titulo}
													</span>
													<span className="block text-xs text-muted-foreground">
														{n.detalle}
													</span>
												</span>
											</Link>
										</li>
									);
								})
							)}
						</ul>
						<div className="border-t border-border p-2">
							<Button
								variant="ghost"
								size="sm"
								className="w-full"
								disabled={noLeidas === 0 || marcando || cargandoNotif}
								onClick={() => void marcarLeidas()}
							>
								Marcar todas como leídas
							</Button>
						</div>
					</PopoverContent>
				</Popover>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
							aria-label="Menú de usuario"
						>
							<Avatar className="size-8">
								<AvatarImage src={sesion.avatarUrl ?? undefined} alt={nombre} />
								<AvatarFallback className="bg-blue-soft text-primary">
									{iniciales(nombre)}
								</AvatarFallback>
							</Avatar>
							<span className="hidden text-left leading-tight md:grid">
								<span className="text-sm font-semibold text-foreground">
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
			</div>

			<CommandDialog
				open={paletteOpen}
				onOpenChange={setPaletteOpen}
				title="Buscar en el panel"
				description="Navega a cualquier sección del panel."
			>
				<CommandInput placeholder="Buscar secciones y acciones…" />
				<CommandList>
					<CommandEmpty>Sin resultados.</CommandEmpty>
					{grupos.map((grupo) => (
						<CommandGroup key={grupo.label} heading={grupo.label}>
							{grupo.items.map((item) => {
								const Icono = item.icon;
								return (
									<CommandItem
										key={item.to}
										value={`${grupo.label} ${item.title}`}
										onSelect={() => {
											setPaletteOpen(false);
											void navigate({ to: item.to });
										}}
									>
										<Icono aria-hidden="true" />
										{item.title}
									</CommandItem>
								);
							})}
						</CommandGroup>
					))}
				</CommandList>
			</CommandDialog>
		</header>
	);
}
