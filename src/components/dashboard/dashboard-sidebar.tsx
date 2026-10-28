import {
	Link,
	useNavigate,
	useRouter,
	useRouterState,
} from "@tanstack/react-router";
import { cn } from "cn";
import { ChevronsUpDown, LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { type NavItem, navParaRol } from "@/components/dashboard/nav-config";
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
import { etiquetaRol, nombreCompleto, type SesionUsuario } from "@/lib/auth";
import { iniciales } from "@/lib/format";
import { cerrarSesion as cerrarSesionServidor } from "@/server/auth";
import type { Rol } from "@/types/models";

const RUTA_INICIO: Record<Rol, string> = {
	Administrador: "/admin",
	Vendedor: "/vendedor",
	Cliente: "/cliente",
};

function estaActivo(pathname: string, item: NavItem): boolean {
	if (item.exact) return pathname === item.to;
	return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export function DashboardSidebar({
	rol,
	sesion,
}: {
	rol: Rol;
	sesion: SesionUsuario;
}) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const navigate = useNavigate();
	const router = useRouter();
	const grupos = navParaRol(rol);
	const inicio = RUTA_INICIO[rol];
	const nombre = nombreCompleto(sesion);
	const [saliendo, setSaliendo] = useState(false);

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
										<AvatarImage
											src={sesion.avatarUrl ?? undefined}
											alt={nombre}
										/>
										<AvatarFallback className="rounded-lg bg-blue-soft text-primary">
											{iniciales(nombre)}
										</AvatarFallback>
									</Avatar>
									<span className="grid flex-1 text-left leading-tight">
										<span className="truncate text-sm font-semibold">
											{nombre}
										</span>
										<span className="truncate text-xs text-muted-foreground">
											{etiquetaRol(sesion.rol)}
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
									className={cn("text-destructive focus:text-destructive")}
								>
									<LogOut aria-hidden="true" />
									{saliendo ? "Cerrando sesión…" : "Cerrar sesión"}
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
