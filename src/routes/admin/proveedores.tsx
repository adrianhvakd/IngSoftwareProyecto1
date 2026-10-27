import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Building2,
	ExternalLink,
	Handshake,
	Mail,
	MapPin,
	Pencil,
	Phone,
	Plus,
	Search,
	Trash2,
	UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { inmuebleTone, StatusBadge } from "@/components/common/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ZonePicker } from "@/components/pickers/zone-picker";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getInmueblesDeProveedor, getProveedoresConConteo } from "@/data";
import { proveedores as proveedoresIniciales } from "@/data/proveedores";
import type { Proveedor } from "@/data/types";
import { formatBsMes, formatFecha } from "@/lib/format";

export const Route = createFileRoute("/admin/proveedores")({
	head: () => ({
		meta: [{ title: "Proveedores · Administración · RE/MAX Potosí" }],
	}),
	component: AdminProveedores,
});

const POR_PAGINA = 8;

interface FormularioProveedor {
	nombre: string;
	tipo: "Persona" | "Empresa";
	telefono: string;
	email: string;
	ciudad: string;
	zonaPrincipal: string;
	estado: "Activo" | "Inactivo";
}

const FORM_VACIO: FormularioProveedor = {
	nombre: "",
	tipo: "Persona",
	telefono: "+591 ",
	email: "",
	ciudad: "Potosí",
	zonaPrincipal: "",
	estado: "Activo",
};

function AdminProveedores() {
	const [lista, setLista] = useState<Proveedor[]>(proveedoresIniciales);
	const [cargando] = useState(false);
	const [q, setQ] = useState("");
	const [tipo, setTipo] = useState("todos");
	const [estado, setEstado] = useState("todos");
	const [pagina, setPagina] = useState(1);

	const [sheetAbierto, setSheetAbierto] = useState(false);
	const [editando, setEditando] = useState<Proveedor | null>(null);
	const [form, setForm] = useState<FormularioProveedor>(FORM_VACIO);
	const [eliminar, setEliminar] = useState<Proveedor | null>(null);
	const [detalle, setDetalle] = useState<Proveedor | null>(null);

	const conteo = useMemo(() => getProveedoresConConteo(), []);
	const totalInmuebles = conteo.reduce((acc, p) => acc + p.inmueblesCount, 0);
	const empresas = lista.filter((p) => p.tipo === "Empresa").length;

	const filtrados = useMemo(() => {
		const termino = q.trim().toLowerCase();
		return lista.filter((p) => {
			if (tipo !== "todos" && p.tipo !== tipo) return false;
			if (estado !== "todos" && p.estado !== estado) return false;
			if (termino) {
				const heno =
					`${p.nombre} ${p.telefono} ${p.email ?? ""} ${p.zonaPrincipal}`.toLowerCase();
				if (!heno.includes(termino)) return false;
			}
			return true;
		});
	}, [lista, q, tipo, estado]);

	const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
	const paginaActual = Math.min(pagina, totalPaginas);
	const visibles = filtrados.slice(
		(paginaActual - 1) * POR_PAGINA,
		paginaActual * POR_PAGINA,
	);

	const sinResultados =
		!cargando &&
		filtrados.length === 0 &&
		(q !== "" || tipo !== "todos" || estado !== "todos");

	function abrirNuevo() {
		setEditando(null);
		setForm(FORM_VACIO);
		setSheetAbierto(true);
	}

	function abrirEdicion(p: Proveedor) {
		setEditando(p);
		setForm({
			nombre: p.nombre,
			tipo: p.tipo,
			telefono: p.telefono,
			email: p.email ?? "",
			ciudad: p.ciudad,
			zonaPrincipal: p.zonaPrincipal,
			estado: p.estado,
		});
		setSheetAbierto(true);
	}

	function guardar() {
		if (!form.nombre.trim() || !form.zonaPrincipal) {
			toast.error("Completa los campos obligatorios", {
				description: "El nombre y la zona principal son necesarios.",
			});
			return;
		}
		if (editando) {
			setLista((prev) =>
				prev.map((p) =>
					p.id === editando.id
						? {
								...p,
								nombre: form.nombre,
								tipo: form.tipo,
								telefono: form.telefono,
								email: form.email || undefined,
								ciudad: form.ciudad,
								zonaPrincipal: form.zonaPrincipal,
								estado: form.estado,
							}
						: p,
				),
			);
			toast.success("Proveedor actualizado", {
				description: `${form.nombre} guardado correctamente. (Acción simulada)`,
			});
		} else {
			const nuevo: Proveedor = {
				id: `prv-${String(lista.length + 1).padStart(3, "0")}`,
				nombre: form.nombre,
				tipo: form.tipo,
				telefono: form.telefono,
				email: form.email || undefined,
				ciudad: form.ciudad || "Potosí",
				zonaPrincipal: form.zonaPrincipal,
				estado: form.estado,
				desde: "2026-10-19",
			};
			setLista((prev) => [nuevo, ...prev]);
			toast.success("Proveedor registrado", {
				description: `${form.nombre} se sumó a la cartera. (Acción simulada)`,
			});
		}
		setSheetAbierto(false);
	}

	function confirmarEliminar() {
		if (!eliminar) return;
		setLista((prev) => prev.filter((p) => p.id !== eliminar.id));
		toast.info("Proveedor eliminado", {
			description: `${eliminar.nombre} ya no aparecerá en la cartera. (Acción simulada)`,
		});
		setEliminar(null);
	}

	return (
		<>
			<PageHeader
				title="Proveedores"
				description="Propietarios y empresas que confían sus inmuebles a RE/MAX Potosí. Gestiona contactos, zona y cartera."
				actions={
					<Button variant="default" onClick={abrirNuevo}>
						<Plus aria-hidden="true" />
						Nuevo proveedor
					</Button>
				}
			/>

			<section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<StatCard
					label="Proveedores"
					valor={String(lista.length)}
					icono={<Handshake className="size-4" aria-hidden="true" />}
					tono="primary"
					hint={`${lista.filter((p) => p.estado === "Activo").length} activos`}
				/>
				<StatCard
					label="Personas"
					valor={String(lista.length - empresas)}
					icono={<UserRound className="size-4" aria-hidden="true" />}
					tono="primary"
				/>
				<StatCard
					label="Empresas"
					valor={String(empresas)}
					icono={<Building2 className="size-4" aria-hidden="true" />}
					tono="primary"
				/>
				<StatCard
					label="Inmuebles administrados"
					valor={String(totalInmuebles)}
					icono={<Building2 className="size-4" aria-hidden="true" />}
					tono="success"
				/>
			</section>

			<div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 lg:flex-row lg:items-center">
				<div className="relative flex-1">
					<Search
						className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
						aria-hidden="true"
					/>
					<Input
						value={q}
						onChange={(e) => {
							setQ(e.target.value);
							setPagina(1);
						}}
						placeholder="Buscar por nombre, teléfono o zona…"
						className="pl-9"
						aria-label="Buscar proveedores"
					/>
				</div>
				<div className="grid grid-cols-2 gap-3 sm:w-auto">
					<Select
						value={tipo}
						onValueChange={(v) => {
							setTipo(v);
							setPagina(1);
						}}
					>
						<SelectTrigger aria-label="Filtrar por tipo">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="todos">Todo tipo</SelectItem>
							<SelectItem value="Persona">Persona</SelectItem>
							<SelectItem value="Empresa">Empresa</SelectItem>
						</SelectContent>
					</Select>
					<Select
						value={estado}
						onValueChange={(v) => {
							setEstado(v);
							setPagina(1);
						}}
					>
						<SelectTrigger aria-label="Filtrar por estado">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="todos">Todo estado</SelectItem>
							<SelectItem value="Activo">Activo</SelectItem>
							<SelectItem value="Inactivo">Inactivo</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{cargando ? (
				<div className="flex flex-col gap-2">
					{Array.from({ length: 6 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: esqueletos estáticos
						<Skeleton key={i} className="h-14 w-full rounded-xl" />
					))}
				</div>
			) : sinResultados ? (
				<EmptyState
					icon={<Search className="size-6" aria-hidden="true" />}
					title="Sin proveedores que coincidan"
					description="Prueba con otro nombre, teléfono o limpia los filtros de tipo y estado."
					action={
						<Button
							variant="outline"
							onClick={() => {
								setQ("");
								setTipo("todos");
								setEstado("todos");
								setPagina(1);
							}}
						>
							Limpiar filtros
						</Button>
					}
				/>
			) : lista.length === 0 ? (
				<EmptyState
					icon={<Handshake className="size-6" aria-hidden="true" />}
					title="Aún no hay proveedores"
					description="Registra al primer propietario o empresa para asignarle inmuebles."
					action={
						<Button onClick={abrirNuevo}>
							<Plus aria-hidden="true" />
							Nuevo proveedor
						</Button>
					}
				/>
			) : (
				<>
					<p className="text-sm text-muted-foreground">
						{filtrados.length} de {lista.length} proveedores
					</p>
					<div className="overflow-x-auto rounded-xl border border-border bg-card">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="pl-5">Proveedor</TableHead>
									<TableHead className="hidden md:table-cell">
										Zona principal
									</TableHead>
									<TableHead>Inmuebles</TableHead>
									<TableHead className="hidden lg:table-cell">Desde</TableHead>
									<TableHead>Estado</TableHead>
									<TableHead className="pr-5 text-right">Acciones</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{visibles.map((p) => {
									const n =
										conteo.find((c) => c.id === p.id)?.inmueblesCount ?? 0;
									return (
										<TableRow key={p.id}>
											<TableCell className="pl-5">
												<span className="flex items-center gap-3">
													<span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-soft text-brand-text">
														{p.tipo === "Empresa" ? (
															<Building2
																className="size-4"
																aria-hidden="true"
															/>
														) : (
															<UserRound
																className="size-4"
																aria-hidden="true"
															/>
														)}
													</span>
													<span className="min-w-0">
														<span className="block truncate font-medium text-foreground">
															{p.nombre}
														</span>
														<span className="block truncate text-xs text-muted-foreground">
															{p.tipo} · {p.telefono}
														</span>
													</span>
												</span>
											</TableCell>
											<TableCell className="hidden max-w-[220px] md:table-cell">
												<span className="flex items-center gap-1.5 text-sm text-muted-foreground">
													<MapPin
														className="size-3.5 shrink-0 text-brand-text"
														aria-hidden="true"
													/>
													<span className="truncate">{p.zonaPrincipal}</span>
												</span>
											</TableCell>
											<TableCell>
												<Button
													variant="link"
													size="sm"
													className="h-auto p-0"
													onClick={() => setDetalle(p)}
												>
													{n} inmueble{n === 1 ? "" : "s"}
												</Button>
											</TableCell>
											<TableCell className="hidden whitespace-nowrap text-muted-foreground lg:table-cell">
												{formatFecha(p.desde)}
											</TableCell>
											<TableCell>
												<StatusBadge
													tone={p.estado === "Activo" ? "success" : "muted"}
													dot
												>
													{p.estado}
												</StatusBadge>
											</TableCell>
											<TableCell className="pr-5 text-right">
												<div className="flex justify-end gap-1">
													<Button
														variant="ghost"
														size="icon-sm"
														aria-label={`Editar ${p.nombre}`}
														onClick={() => abrirEdicion(p)}
													>
														<Pencil aria-hidden="true" />
													</Button>
													<Button
														variant="ghost"
														size="icon-sm"
														aria-label={`Eliminar ${p.nombre}`}
														className="text-destructive hover:text-destructive"
														onClick={() => setEliminar(p)}
													>
														<Trash2 aria-hidden="true" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>

					{filtrados.length > POR_PAGINA ? (
						<Pagination className="mt-6">
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious
										href="#"
										onClick={(e) => {
											e.preventDefault();
											setPagina(Math.max(1, paginaActual - 1));
										}}
										aria-disabled={paginaActual === 1}
										className={
											paginaActual === 1 ? "pointer-events-none opacity-50" : ""
										}
									/>
								</PaginationItem>
								{Array.from({ length: totalPaginas }).map((_, index) => {
									const numero = index + 1;
									return (
										<PaginationItem key={numero}>
											<PaginationLink
												href="#"
												isActive={numero === paginaActual}
												onClick={(e) => {
													e.preventDefault();
													setPagina(numero);
												}}
											>
												{numero}
											</PaginationLink>
										</PaginationItem>
									);
								})}
								<PaginationItem>
									<PaginationNext
										href="#"
										onClick={(e) => {
											e.preventDefault();
											setPagina(Math.min(totalPaginas, paginaActual + 1));
										}}
										aria-disabled={paginaActual === totalPaginas}
										className={
											paginaActual === totalPaginas
												? "pointer-events-none opacity-50"
												: ""
										}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					) : null}
				</>
			)}

			{/* Alta / edición */}
			<Sheet open={sheetAbierto} onOpenChange={setSheetAbierto}>
				<SheetContent className="w-full overflow-y-auto sm:max-w-md">
					<SheetHeader>
						<SheetTitle className="font-display">
							{editando ? "Editar proveedor" : "Nuevo proveedor"}
						</SheetTitle>
						<SheetDescription>
							{editando
								? "Actualiza los datos de contacto y la zona del proveedor."
								: "Registra un propietario o empresa para asignarle inmuebles."}
						</SheetDescription>
					</SheetHeader>

					<div className="flex flex-col gap-4 px-4">
						<div className="flex flex-col gap-2">
							<Label htmlFor="pv-nombre">Nombre o razón social *</Label>
							<Input
								id="pv-nombre"
								value={form.nombre}
								onChange={(e) =>
									setForm((f) => ({ ...f, nombre: e.target.value }))
								}
								placeholder="Ej. María Fernández Rojas"
							/>
						</div>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="flex flex-col gap-2">
								<Label htmlFor="pv-tipo">Tipo *</Label>
								<Select
									value={form.tipo}
									onValueChange={(v) =>
										setForm((f) => ({
											...f,
											tipo: v as FormularioProveedor["tipo"],
										}))
									}
								>
									<SelectTrigger id="pv-tipo" aria-label="Tipo de proveedor">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Persona">Persona</SelectItem>
										<SelectItem value="Empresa">Empresa</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="pv-estado">Estado *</Label>
								<Select
									value={form.estado}
									onValueChange={(v) =>
										setForm((f) => ({
											...f,
											estado: v as FormularioProveedor["estado"],
										}))
									}
								>
									<SelectTrigger id="pv-estado" aria-label="Estado">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Activo">Activo</SelectItem>
										<SelectItem value="Inactivo">Inactivo</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="flex flex-col gap-2">
								<Label htmlFor="pv-telefono">Teléfono</Label>
								<Input
									id="pv-telefono"
									value={form.telefono}
									onChange={(e) =>
										setForm((f) => ({ ...f, telefono: e.target.value }))
									}
									placeholder="+591 70000000"
								/>
							</div>
							<div className="flex flex-col gap-2">
								<Label htmlFor="pv-ciudad">Ciudad</Label>
								<Input
									id="pv-ciudad"
									value={form.ciudad}
									onChange={(e) =>
										setForm((f) => ({ ...f, ciudad: e.target.value }))
									}
									placeholder="Potosí"
								/>
							</div>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="pv-email">Correo (opcional)</Label>
							<Input
								id="pv-email"
								type="email"
								value={form.email}
								onChange={(e) =>
									setForm((f) => ({ ...f, email: e.target.value }))
								}
								placeholder="propietario@correo.com"
							/>
						</div>

						<div className="flex flex-col gap-2">
							<Label htmlFor="pv-zona">Zona principal *</Label>
							<ZonePicker
								id="pv-zona"
								mode="single"
								value={form.zonaPrincipal ? [form.zonaPrincipal] : []}
								onChange={(zonas) =>
									setForm((f) => ({ ...f, zonaPrincipal: zonas[0] ?? "" }))
								}
								placeholder="Elegir zona…"
							/>
						</div>
					</div>

					<SheetFooter className="flex-row justify-end gap-2 px-4">
						<Button variant="outline" onClick={() => setSheetAbierto(false)}>
							Cancelar
						</Button>
						<Button variant="default" onClick={guardar}>
							{editando ? "Guardar cambios" : "Registrar proveedor"}
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>

			{/* Confirmación de eliminación */}
			<AlertDialog
				open={eliminar !== null}
				onOpenChange={(open) => !open && setEliminar(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>¿Eliminar al proveedor?</AlertDialogTitle>
						<AlertDialogDescription>
							{eliminar
								? `${eliminar.nombre} se quitará de la cartera. Los inmuebles ya publicados conservarán su historial. Esta acción no se puede deshacer en el prototipo.`
								: null}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={confirmarEliminar}
							className="bg-destructive text-white hover:bg-destructive/90"
						>
							Sí, eliminar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Detalle con inmuebles del proveedor */}
			<Sheet
				open={detalle !== null}
				onOpenChange={(open) => !open && setDetalle(null)}
			>
				<SheetContent className="w-full overflow-y-auto sm:max-w-lg">
					{detalle ? <DetalleProveedor proveedor={detalle} /> : null}
				</SheetContent>
			</Sheet>
		</>
	);
}

function DetalleProveedor({ proveedor }: { proveedor: Proveedor }) {
	const inmuebles = getInmueblesDeProveedor(proveedor.id);

	return (
		<>
			<SheetHeader>
				<SheetTitle className="font-display">{proveedor.nombre}</SheetTitle>
				<SheetDescription>
					{proveedor.tipo} · {proveedor.ciudad}
				</SheetDescription>
			</SheetHeader>

			<div className="flex flex-col gap-5 px-4">
				<div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
					<Dato etiqueta="Teléfono" valor={proveedor.telefono} tabular />
					<Dato etiqueta="Correo" valor={proveedor.email ?? "Sin registrar"} />
					<Dato etiqueta="Zona principal" valor={proveedor.zonaPrincipal} />
					<Dato etiqueta="Alta" valor={formatFecha(proveedor.desde)} />
					<div className="flex items-center gap-2 sm:col-span-2">
						<StatusBadge
							tone={proveedor.estado === "Activo" ? "success" : "muted"}
							dot
						>
							{proveedor.estado}
						</StatusBadge>
					</div>
				</div>

				<div>
					<h3 className="mb-3 flex items-center gap-2 font-display text-sm font-bold text-foreground">
						<Building2 className="size-4 text-brand-text" aria-hidden="true" />
						Inmuebles administrados ({inmuebles.length})
					</h3>
					{inmuebles.length === 0 ? (
						<p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
							Este proveedor aún no tiene inmuebles publicados.
						</p>
					) : (
						<div className="flex flex-col gap-3">
							{inmuebles.map((inmueble) => (
								<div
									key={inmueble.id}
									className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3"
								>
									<div className="min-w-0">
										<p className="text-[11px] font-semibold tracking-wide text-brand-text uppercase">
											{inmueble.tipo} · {inmueble.codigo}
										</p>
										<p className="truncate text-sm font-semibold text-foreground">
											{inmueble.titulo}
										</p>
										<p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
											<span className="inline-flex items-center gap-1">
												<MapPin className="size-3" aria-hidden="true" />
												{inmueble.zona}
											</span>
											<span className="tabular">
												{formatBsMes(inmueble.precio)}
											</span>
										</p>
									</div>
									<div className="flex shrink-0 flex-col items-end gap-2">
										<StatusBadge tone={inmuebleTone[inmueble.estado]}>
											{inmueble.estado}
										</StatusBadge>
										<Button asChild variant="ghost" size="sm">
											<Link to="/propiedades/$id" params={{ id: inmueble.id }}>
												Ver
												<ExternalLink className="size-3.5" aria-hidden="true" />
											</Link>
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				<div className="grid grid-cols-1 gap-3 rounded-xl border border-primary/20 bg-blue-soft/50 p-4 text-sm text-foreground/80 sm:grid-cols-3">
					<p className="flex items-center gap-2">
						<Phone className="size-4 text-brand-text" aria-hidden="true" />
						<span className="tabular">{proveedor.telefono}</span>
					</p>
					<p className="flex items-center gap-2">
						<Mail className="size-4 text-brand-text" aria-hidden="true" />
						<span className="truncate">{proveedor.email ?? "Sin correo"}</span>
					</p>
					<p className="flex items-center gap-2">
						<MapPin className="size-4 text-brand-text" aria-hidden="true" />
						<span className="truncate">{proveedor.zonaPrincipal}</span>
					</p>
				</div>

				<p className="text-xs text-muted-foreground">
					Los datos son de ejemplo. El EntityPicker y el ZonePicker
					reutilizables alimentan este módulo y los formularios de inmuebles.
				</p>
			</div>
		</>
	);
}

function Dato({
	etiqueta,
	valor,
	tabular,
}: {
	etiqueta: string;
	valor: string;
	tabular?: boolean;
}) {
	return (
		<div>
			<p className="text-xs text-muted-foreground">{etiqueta}</p>
			<p
				className={`mt-0.5 text-sm font-medium text-foreground ${tabular ? "tabular" : ""}`}
			>
				{valor}
			</p>
		</div>
	);
}
