import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { cn } from "cn";
import { ChevronsUpDown, LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import {
	type NavItem,
	navParaRol,
	SESIONES,
} from "@/components/dashboard/nav-config";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";
import type { Rol } from "@/data/types";
import { iniciales } from "@/lib/format";

const RUTA_INICIO: Record<Rol, string> = {
	Administrador: "/admin",
	Vendedor: "/vendedor",
	Cliente: "/cliente",
};

function estaActivo(pathname: string, item: NavItem): boolean {
	if (item.exact) return pathname === item.to;
	return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export function DashboardSidebar({ rol }: { rol: Rol }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const navigate = useNavigate();
	const sesion = SESIONES[rol];
	const grupos = navParaRol(rol);
	const inicio = RUTA_INICIO[rol];

	function cerrarSesion() {
		toast.info("Sesión cerrada", {
			description: "Volviendo al portal público. (Acción simulada)",
		});
		void navigate({ to: "/" });
	}

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							size="lg"
							className="data-[slot=sidebar-menu-button]:p-1.5"
						>
							<Link to={inicio} className="flex items-center gap-2">
								<Logo
									showCity={false}
									className="group-data-[collapsible=icon]:hidden"
								/>
								<span className="hidden size-8 shrink-0 place-items-center rounded-lg bg-primary font-display text-sm font-extrabold text-white group-data-[collapsible=icon]:grid">
									R
								</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>

			<SidebarContent>
				{grupos.map((grupo) => (
					<SidebarGroup key={grupo.label}>
						<SidebarGroupLabel>{grupo.label}</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{grupo.items.map((item) => {
									const Icono = item.icon;
									return (
										<SidebarMenuItem key={item.to}>
											<SidebarMenuButton
												asChild
												isActive={estaActivo(pathname, item)}
												tooltip={item.title}
											>
												<Link to={item.to}>
													<Icono aria-hidden="true" />
													<span>{item.title}</span>
												</Link>
											</SidebarMenuButton>
										</SidebarMenuItem>
									);
								})}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</SidebarContent>

			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton
									size="lg"
									className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								>
									<Avatar className="size-8 rounded-lg">
										<AvatarImage src={sesion.avatarUrl} alt={sesion.nombre} />
										<AvatarFallback className="rounded-lg bg-blue-soft text-primary">
											{iniciales(sesion.nombre)}
										</AvatarFallback>
									</Avatar>
									<span className="grid flex-1 text-left leading-tight">
										<span className="truncate text-sm font-semibold">
											{sesion.nombre}
										</span>
										<span className="truncate text-xs text-muted-foreground">
											{sesion.rol}
										</span>
									</span>
									<ChevronsUpDown
										className="ml-auto size-4"
										aria-hidden="true"
									/>
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
								align="end"
								side="top"
							>
								<DropdownMenuLabel className="flex items-center gap-2">
									<ShieldCheck
										className="size-4 text-primary"
										aria-hidden="true"
									/>
									Sesión demo
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem asChild>
									<Link to="/admin">Ver como administrador</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link to="/vendedor">Ver como vendedor</Link>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<Link to="/cliente">Ver como cliente</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onSelect={cerrarSesion}
									className={cn("text-destructive focus:text-destructive")}
								>
									<LogOut aria-hidden="true" />
									Cerrar sesión
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}
