import { createFileRoute } from "@tanstack/react-router";
import {
	MoreHorizontal,
	Search,
	ShieldCheck,
	UserCog,
	Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { rolTone, StatusBadge } from "@/components/common/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { Rol } from "@/data/types";
import { usuarios as usuariosIniciales } from "@/data/usuarios";
import { formatFecha, iniciales } from "@/lib/format";

export const Route = createFileRoute("/admin/usuarios")({
	head: () => ({
		meta: [{ title: "Usuarios · Administración · RE/MAX Potosí" }],
	}),
	component: AdminUsuarios,
});

const ROLES: Rol[] = ["Administrador", "Vendedor", "Cliente"];

type FiltroRol = "todos" | Rol;
type FiltroEstado = "todos" | "Activo" | "Inactivo";

interface CambioPendiente {
	userId: string;
	nombre: string;
	nuevoRol: Rol;
}

function AdminUsuarios() {
	const [lista, setLista] = useState(usuariosIniciales);
	const [q, setQ] = useState("");
	const [rol, setRol] = useState<FiltroRol>("todos");
	const [estado, setEstado] = useState<FiltroEstado>("todos");
	const [pendiente, setPendiente] = useState<CambioPendiente | null>(null);

	const filtrados = useMemo(() => {
		const termino = q.trim().toLowerCase();
		return lista.filter((u) => {
			if (rol !== "todos" && u.rol !== rol) return false;
			if (estado !== "todos" && u.estado !== estado) return false;
			if (termino) {
				const heno = `${u.nombre} ${u.email} ${u.telefono}`.toLowerCase();
				if (!heno.includes(termino)) return false;
			}
			return true;
		});
	}, [lista, q, rol, estado]);

	function confirmarCambio() {
		if (!pendiente) return;
		setLista((prev) =>
			prev.map((u) =>
				u.id === pendiente.userId ? { ...u, rol: pendiente.nuevoRol } : u,
			),
		);
		toast.success("Rol actualizado", {
			description: `${pendiente.nombre} ahora es ${pendiente.nuevoRol}. (Acción simulada)`,
		});
		setPendiente(null);
	}

	function alternarEstado(
		userId: string,
		nombre: string,
		actual: "Activo" | "Inactivo",
	) {
		const nuevo = actual === "Activo" ? "Inactivo" : "Activo";
		setLista((prev) =>
			prev.map((u) => (u.id === userId ? { ...u, estado: nuevo } : u)),
		);
		toast.info(`Cuenta ${nuevo === "Activo" ? "activada" : "desactivada"}`, {
			description: `${nombre} · estado ${nuevo}. (Acción simulada)`,
		});
	}

	return (
		<>
			<PageHeader
				title="Usuarios"
				description="Cuentas de la plataforma. Administra roles y estado de acceso de cada usuario."
				actions={
					<Button
						variant="outline"
						onClick={() =>
							toast.info("Invitar usuario", {
								description:
									"Se abriría el formulario de alta de cuenta. (Acción simulada)",
							})
						}
					>
						<Users aria-hidden="true" />
						Invitar usuario
					</Button>
				}
			/>

			<div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<Search
						className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
						aria-hidden="true"
					/>
					<Input
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="Buscar por nombre, correo o teléfono…"
						className="pl-9"
						aria-label="Buscar usuarios"
					/>
				</div>
				<Select value={rol} onValueChange={(v) => setRol(v as FiltroRol)}>
					<SelectTrigger
						className="w-full sm:w-[170px]"
						aria-label="Filtrar por rol"
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="todos">Todos los roles</SelectItem>
						{ROLES.map((r) => (
							<SelectItem key={r} value={r}>
								{r === "Administrador" ? "Administradores" : `${r}s`}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select
					value={estado}
					onValueChange={(v) => setEstado(v as FiltroEstado)}
				>
					<SelectTrigger
						className="w-full sm:w-[150px]"
						aria-label="Filtrar por estado"
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="todos">Todo estado</SelectItem>
						<SelectItem value="Activo">Activos</SelectItem>
						<SelectItem value="Inactivo">Inactivos</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<p className="text-sm text-muted-foreground">
				{filtrados.length} de {lista.length} usuarios
			</p>

			{filtrados.length === 0 ? (
				<EmptyState
					icon={<Users className="size-6" aria-hidden="true" />}
					title="Sin usuarios que coincidan"
					description="Ajusta la búsqueda o los filtros de rol y estado para ver resultados."
					action={
						<Button
							variant="outline"
							onClick={() => {
								setQ("");
								setRol("todos");
								setEstado("todos");
							}}
						>
							Limpiar filtros
						</Button>
					}
				/>
			) : (
				<div className="overflow-x-auto rounded-xl border border-border bg-card">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="pl-5">Usuario</TableHead>
								<TableHead>Rol</TableHead>
								<TableHead className="hidden md:table-cell">Teléfono</TableHead>
								<TableHead className="hidden lg:table-cell">
									Registrado
								</TableHead>
								<TableHead>Estado</TableHead>
								<TableHead className="pr-5 text-right">Acciones</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filtrados.map((u) => (
								<TableRow key={u.id}>
									<TableCell className="pl-5">
										<div className="flex items-center gap-3">
											<Avatar className="size-9">
												<AvatarImage src={u.avatarUrl} alt={u.nombre} />
												<AvatarFallback className="bg-blue-soft text-xs text-primary">
													{iniciales(u.nombre)}
												</AvatarFallback>
											</Avatar>
											<div className="min-w-0">
												<span className="block truncate font-medium text-foreground">
													{u.nombre}
												</span>
												<span className="block truncate text-xs text-muted-foreground">
													{u.email}
												</span>
											</div>
										</div>
									</TableCell>
									<TableCell>
										<StatusBadge tone={rolTone[u.rol]}>{u.rol}</StatusBadge>
									</TableCell>
									<TableCell className="hidden tabular text-muted-foreground md:table-cell">
										{u.telefono}
									</TableCell>
									<TableCell className="hidden text-muted-foreground lg:table-cell">
										{formatFecha(u.creadoEl)}
									</TableCell>
									<TableCell>
										<StatusBadge
											tone={u.estado === "Activo" ? "success" : "muted"}
											dot
										>
											{u.estado}
										</StatusBadge>
									</TableCell>
									<TableCell className="pr-5 text-right">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="icon-sm"
													aria-label={`Acciones para ${u.nombre}`}
												>
													<MoreHorizontal aria-hidden="true" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end" className="w-52">
												<DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
													<ShieldCheck
														className="size-3.5 text-primary"
														aria-hidden="true"
													/>
													Cambiar rol
												</DropdownMenuLabel>
												{ROLES.filter((r) => r !== u.rol).map((r) => (
													<DropdownMenuItem
														key={r}
														onSelect={() =>
															setPendiente({
																userId: u.id,
																nombre: u.nombre,
																nuevoRol: r,
															})
														}
													>
														<UserCog aria-hidden="true" />
														{r}
													</DropdownMenuItem>
												))}
												<DropdownMenuSeparator />
												<DropdownMenuItem
													onSelect={() =>
														alternarEstado(u.id, u.nombre, u.estado)
													}
												>
													{u.estado === "Activo"
														? "Desactivar cuenta"
														: "Activar cuenta"}
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			<AlertDialog
				open={pendiente !== null}
				onOpenChange={(open) => !open && setPendiente(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>¿Cambiar el rol del usuario?</AlertDialogTitle>
						<AlertDialogDescription>
							{pendiente
								? `${pendiente.nombre} pasará a tener el rol de ${pendiente.nuevoRol}. Los permisos de acceso se actualizarán de inmediato.`
								: null}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction onClick={confirmarCambio}>
							Sí, cambiar rol
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
