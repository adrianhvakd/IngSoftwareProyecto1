import { createFileRoute } from "@tanstack/react-router";
import {
	HandCoins,
	MapPin,
	MoreHorizontal,
	Pencil,
	Plus,
	UserCog,
	UserX,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
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
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { Vendedor } from "@/data/types";
import { vendedores as vendedoresIniciales } from "@/data/vendedores";
import { formatBs, iniciales } from "@/lib/format";

export const Route = createFileRoute("/admin/vendedores")({
	head: () => ({
		meta: [{ title: "Vendedores · Administración · RE/MAX Potosí" }],
	}),
	component: AdminVendedores,
});

interface FormularioVendedor {
	nombre: string;
	email: string;
	telefono: string;
	zona: string;
	cargo: string;
	comisionFija: string;
}

const FORM_VACIO: FormularioVendedor = {
	nombre: "",
	email: "",
	telefono: "+591 ",
	zona: "",
	cargo: "Agente comercial",
	comisionFija: "800",
};

function AdminVendedores() {
	const [lista, setLista] = useState(vendedoresIniciales);
	const [sheetAbierto, setSheetAbierto] = useState(false);
	const [editando, setEditando] = useState<Vendedor | null>(null);
	const [form, setForm] = useState<FormularioVendedor>(FORM_VACIO);
	const [baja, setBaja] = useState<Vendedor | null>(null);

	const activos = lista.filter((v) => v.estado === "Activo").length;
	const comisionPromedio =
		lista.length > 0
			? Math.round(
					lista.reduce((acc, v) => acc + v.comisionFija, 0) / lista.length,
				)
			: 0;
	const totalCerrados = lista.reduce((acc, v) => acc + v.alquileresCerrados, 0);

	function abrirNuevo() {
		setEditando(null);
		setForm(FORM_VACIO);
		setSheetAbierto(true);
	}

	function abrirEdicion(v: Vendedor) {
		setEditando(v);
		setForm({
			nombre: v.nombre,
			email: v.email,
			telefono: v.telefono,
			zona: v.zona,
			cargo: v.cargo,
			comisionFija: String(v.comisionFija),
		});
		setSheetAbierto(true);
	}

	function guardar() {
		if (!form.nombre.trim() || !form.email.trim()) {
			toast.error("Completa los campos obligatorios", {
				description: "El nombre y el correo son necesarios.",
			});
			return;
		}
		const comision = Number(form.comisionFija);
		if (!Number.isFinite(comision) || comision < 0) {
			toast.error("Comisión inválida", {
				description: "Ingresa un monto en Bs mayor o igual a 0.",
			});
			return;
		}

		if (editando) {
			setLista((prev) =>
				prev.map((v) =>
					v.id === editando.id
						? {
								...v,
								nombre: form.nombre,
								email: form.email,
								telefono: form.telefono,
								zona: form.zona,
								cargo: form.cargo,
								comisionFija: comision,
							}
						: v,
				),
			);
			toast.success("Vendedor actualizado", {
				description: `${form.nombre} guardado correctamente. (Acción simulada)`,
			});
		} else {
			const nuevo: Vendedor = {
				id: `vnd-${String(lista.length + 1).padStart(3, "0")}`,
				nombre: form.nombre,
				email: form.email,
				telefono: form.telefono,
				zona: form.zona || "Sin asignar",
				cargo: form.cargo || "Agente comercial",
				comisionFija: comision,
				alquileresCerrados: 0,
				estado: "Activo",
				avatarUrl: "",
				ingresoEl: "2026-10-17",
			};
			setLista((prev) => [...prev, nuevo]);
			toast.success("Vendedor registrado", {
				description: `${form.nombre} se sumó al equipo. (Acción simulada)`,
			});
		}
		setSheetAbierto(false);
	}

	function confirmarBaja() {
		if (!baja) return;
		setLista((prev) =>
			prev.map((v) => (v.id === baja.id ? { ...v, estado: "Inactivo" } : v)),
		);
		toast.info("Vendedor dado de baja", {
			description: `${baja.nombre} ya no recibirá nuevas visitas. (Acción simulada)`,
		});
		setBaja(null);
	}

	return (
		<>
			<PageHeader
				title="Vendedores"
				description="Equipo comercial de la oficina. Gestiona zonas, cargos y comisión fija por alquiler cerrado."
				actions={
					<Button variant="default" onClick={abrirNuevo}>
						<Plus aria-hidden="true" />
						Nuevo vendedor
					</Button>
				}
			/>

			<section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<StatCard
					label="Vendedores activos"
					valor={String(activos)}
					icono={<UserCog className="size-4" aria-hidden="true" />}
					tono="primary"
					hint={`${lista.length} en total`}
				/>
				<StatCard
					label="Comisión fija promedio"
					valor={formatBs(comisionPromedio)}
					icono={<HandCoins className="size-4" aria-hidden="true" />}
					tono="success"
					hint="Por alquiler cerrado"
				/>
				<StatCard
					label="Alquileres cerrados"
					valor={String(totalCerrados)}
					icono={<UserCog className="size-4" aria-hidden="true" />}
					tono="primary"
					hint="Histórico del equipo"
				/>
			</section>

			{lista.length === 0 ? (
				<EmptyState
					icon={<UserCog className="size-6" aria-hidden="true" />}
					title="Aún no hay vendedores"
					description="Registra al primer miembro del equipo comercial para asignarle visitas e inmuebles."
					action={
						<Button onClick={abrirNuevo}>
							<Plus aria-hidden="true" />
							Nuevo vendedor
						</Button>
					}
				/>
			) : (
				<div className="overflow-x-auto rounded-xl border border-border bg-card">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="pl-5">Vendedor</TableHead>
								<TableHead className="hidden md:table-cell">Zona</TableHead>
								<TableHead>Comisión fija</TableHead>
								<TableHead className="hidden lg:table-cell">Cerrados</TableHead>
								<TableHead>Estado</TableHead>
								<TableHead className="pr-5 text-right">Acciones</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{lista.map((v) => (
								<TableRow key={v.id}>
									<TableCell className="pl-5">
										<div className="flex items-center gap-3">
											<Avatar className="size-9">
												<AvatarImage src={v.avatarUrl} alt={v.nombre} />
												<AvatarFallback className="bg-blue-soft text-xs text-primary">
													{iniciales(v.nombre)}
												</AvatarFallback>
											</Avatar>
											<div className="min-w-0">
												<span className="block truncate font-medium text-foreground">
													{v.nombre}
												</span>
												<span className="block truncate text-xs text-muted-foreground">
													{v.cargo}
												</span>
											</div>
										</div>
									</TableCell>
									<TableCell className="hidden max-w-[220px] md:table-cell">
										<span className="flex items-center gap-1.5 text-sm text-muted-foreground">
											<MapPin
												className="size-3.5 shrink-0 text-primary/70"
												aria-hidden="true"
											/>
											<span className="truncate">{v.zona}</span>
										</span>
									</TableCell>
									<TableCell className="font-medium tabular text-foreground">
										{formatBs(v.comisionFija)}
									</TableCell>
									<TableCell className="hidden tabular text-muted-foreground lg:table-cell">
										{v.alquileresCerrados}
									</TableCell>
									<TableCell>
										<StatusBadge
											tone={v.estado === "Activo" ? "success" : "muted"}
											dot
										>
											{v.estado}
										</StatusBadge>
									</TableCell>
									<TableCell className="pr-5 text-right">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="icon-sm"
													aria-label={`Acciones para ${v.nombre}`}
												>
													<MoreHorizontal aria-hidden="true" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end" className="w-48">
												<DropdownMenuItem onSelect={() => abrirEdicion(v)}>
													<Pencil aria-hidden="true" />
													Editar datos
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													className="text-destructive focus:text-destructive"
													disabled={v.estado === "Inactivo"}
													onSelect={() => setBaja(v)}
												>
													<UserX aria-hidden="true" />
													Dar de baja
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

			<Sheet open={sheetAbierto} onOpenChange={setSheetAbierto}>
				<SheetContent className="w-full overflow-y-auto sm:max-w-md">
					<SheetHeader>
						<SheetTitle className="font-display">
							{editando ? "Editar vendedor" : "Nuevo vendedor"}
						</SheetTitle>
						<SheetDescription>
							{editando
								? "Actualiza los datos y la comisión del agente."
								: "Completa los datos para sumar un agente al equipo comercial."}
						</SheetDescription>
					</SheetHeader>

					<div className="flex flex-col gap-4 px-4">
						<div className="flex flex-col gap-2">
							<Label htmlFor="vd-nombre">Nombre completo *</Label>
							<Input
								id="vd-nombre"
								value={form.nombre}
								onChange={(e) =>
									setForm((f) => ({ ...f, nombre: e.target.value }))
								}
								placeholder="Ej. Carla Mendoza Vaca"
							/>
						</div>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="flex flex-col gap-2">
								<Label htmlFor="vd-email">Correo *</Label>
								<Input
									id="vd-email"
									type="email"
									value={form.email}
									onChange={(e) =>
										setForm((f) => ({ ...f, email: e.target.value }))
									}
									placeholder="agente@remaxpotosi.bo"
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="vd-telefono">Teléfono</Label>
								<Input
									id="vd-telefono"
									value={form.telefono}
									onChange={(e) =>
										setForm((f) => ({ ...f, telefono: e.target.value }))
									}
									placeholder="+591 70000000"
								/>
							</div>
						</div>
						<div className="flex flex-col gap-2">
							<Label htmlFor="vd-zona">Zona asignada</Label>
							<Input
								id="vd-zona"
								value={form.zona}
								onChange={(e) =>
									setForm((f) => ({ ...f, zona: e.target.value }))
								}
								placeholder="Ej. San Clemente · Av. Las Banderas"
							/>
						</div>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="flex flex-col gap-2">
								<Label htmlFor="vd-cargo">Cargo</Label>
								<Input
									id="vd-cargo"
									value={form.cargo}
									onChange={(e) =>
										setForm((f) => ({ ...f, cargo: e.target.value }))
									}
									placeholder="Agente comercial"
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="vd-comision">Comisión fija (Bs) *</Label>
								<Input
									id="vd-comision"
									type="number"
									min={0}
									inputMode="numeric"
									value={form.comisionFija}
									onChange={(e) =>
										setForm((f) => ({ ...f, comisionFija: e.target.value }))
									}
								/>
							</div>
						</div>
					</div>

					<SheetFooter className="flex-row justify-end gap-2 px-4">
						<Button variant="outline" onClick={() => setSheetAbierto(false)}>
							Cancelar
						</Button>
						<Button variant="default" onClick={guardar}>
							{editando ? "Guardar cambios" : "Registrar vendedor"}
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>

			<AlertDialog
				open={baja !== null}
				onOpenChange={(open) => !open && setBaja(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>¿Dar de baja al vendedor?</AlertDialogTitle>
						<AlertDialogDescription>
							{baja
								? `${baja.nombre} quedará inactivo y no podrá recibir nuevas visitas ni cerrar alquileres. Podrás reactivarlo más adelante.`
								: null}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmarBaja}
							className="bg-destructive text-white hover:bg-destructive/90"
						>
							Sí, dar de baja
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
