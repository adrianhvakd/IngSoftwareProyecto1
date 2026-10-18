import { Link, useNavigate } from "@tanstack/react-router";
import {
	Bell,
	CircleAlert,
	LogOut,
	Search,
	ShieldCheck,
	TriangleAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/common/status-badge";
import { navParaRol, SESIONES } from "@/components/dashboard/nav-config";
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
import { getResumenAdministrador } from "@/data";
import type { Rol } from "@/data/types";
import { formatBs, iniciales } from "@/lib/format";

interface Notificacion {
	id: string;
	titulo: string;
	detalle: string;
	tono: "danger" | "warning" | "info";
	icono: typeof Bell;
	to: string;
}

export function DashboardTopbar({ rol }: { rol: Rol }) {
	const navigate = useNavigate();
	const sesion = SESIONES[rol];
	const grupos = navParaRol(rol);
	const [paletteOpen, setPaletteOpen] = useState(false);
	const [noLeidas, setNoLeidas] = useState(true);

	const resumen = getResumenAdministrador();
	const notificaciones: Notificacion[] = [
		{
			id: "n1",
			titulo: `${resumen.cuotasEnMora} cuotas en mora`,
			detalle: `Monto acumulado: ${formatBs(resumen.moraTotal)}`,
			tono: "danger",
			icono: CircleAlert,
			to:
				rol === "Administrador"
					? "/admin/alquileres"
					: "/vendedor/registrar-pago",
		},
		{
			id: "n2",
			titulo: `${resumen.cuotasPorVencer} cuotas por vencer`,
			detalle: "Recordatorios enviados a los inquilinos",
			tono: "warning",
			icono: TriangleAlert,
			to:
				rol === "Administrador"
					? "/admin/alquileres"
					: "/vendedor/registrar-pago",
		},
		{
			id: "n3",
			titulo: "Visitas pendientes esta semana",
			detalle: `${resumen.visitasSemana} visitas agendadas`,
			tono: "info",
			icono: Bell,
			to: rol === "Administrador" ? "/admin/visitas" : "/vendedor/visitas",
		},
	];

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

	function cerrarSesion() {
		toast.info("Sesión cerrada", {
			description: "Volviendo al portal público. (Acción simulada)",
		});
		void navigate({ to: "/" });
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

				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="relative"
							aria-label="Notificaciones"
							onClick={() => setNoLeidas(false)}
						>
							<Bell aria-hidden="true" />
							{noLeidas ? (
								<span className="absolute top-2 right-2 size-2 rounded-full bg-cta ring-2 ring-background" />
							) : null}
						</Button>
					</PopoverTrigger>
					<PopoverContent align="end" className="w-80 p-0">
						<div className="flex items-center justify-between border-b border-border px-4 py-3">
							<p className="font-display text-sm font-bold text-foreground">
								Notificaciones
							</p>
							<StatusBadge tone="warning">3 nuevas</StatusBadge>
						</div>
						<ul className="max-h-80 divide-y divide-border overflow-y-auto">
							{notificaciones.map((n) => {
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
											<span>
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
							})}
						</ul>
						<div className="border-t border-border p-2">
							<Button
								variant="ghost"
								size="sm"
								className="w-full"
								onClick={() =>
									toast.info("Marcar todas como leídas", {
										description: "Acción simulada.",
									})
								}
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
								<AvatarImage src={sesion.avatarUrl} alt={sesion.nombre} />
								<AvatarFallback className="bg-blue-soft text-primary">
									{iniciales(sesion.nombre)}
								</AvatarFallback>
							</Avatar>
							<span className="hidden text-left leading-tight md:grid">
								<span className="text-sm font-semibold text-foreground">
									{sesion.nombre.split(" ").slice(0, 2).join(" ")}
								</span>
								<span className="text-xs text-muted-foreground">
									{sesion.rol}
								</span>
							</span>
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-56">
						<DropdownMenuLabel>
							<span className="block text-sm font-semibold">
								{sesion.nombre}
							</span>
							<span className="block text-xs font-normal text-muted-foreground">
								{sesion.email}
							</span>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
							<ShieldCheck
								className="size-3.5 text-primary"
								aria-hidden="true"
							/>
							Cambiar de panel
						</DropdownMenuLabel>
						<DropdownMenuItem asChild>
							<Link to="/admin">Administrador</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link to="/vendedor">Vendedor</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link to="/cliente">Cliente</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onSelect={cerrarSesion}
							className="text-destructive focus:text-destructive"
						>
							<LogOut aria-hidden="true" />
							Cerrar sesión
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
