import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
	HandCoins,
	MapPin,
	MoreHorizontal,
	Pencil,
	Plus,
	UserCog,
	UserPlus,
	UserRound,
	UserX,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { CredentialsCard } from "@/components/pickers/credentials-card";
import { EntityPicker } from "@/components/pickers/entity-picker";
import { PasswordGenerator } from "@/components/pickers/password-generator";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBs, iniciales } from "@/lib/format";
import {
	actualizarVendedor,
	darBajaVendedor,
	listarVendedoresAdmin,
	promoverVendedor,
} from "@/server/admin/vendedores";
import { crearUsuarioVendedor } from "@/server/usuarios";
import type { Vendedor } from "@/types/models";

export const Route = createFileRoute("/admin/vendedores")({
	loader: () => listarVendedoresAdmin(),
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
	avatarUrl: string;
}

const FORM_VACIO: FormularioVendedor = {
	nombre: "",
	email: "",
	telefono: "+591 ",
	zona: "",
	cargo: "Agente comercial",
	comisionFija: "800",
	avatarUrl: "",
};

function AdminVendedores() {
	const datosIniciales = Route.useLoaderData();
	const router = useRouter();
	const [lista, setLista] = useState(datosIniciales.vendedores);
	const [guardando, setGuardando] = useState(false);
	const [sheetAbierto, setSheetAbierto] = useState(false);
	const [editando, setEditando] = useState<Vendedor | null>(null);
	const [form, setForm] = useState<FormularioVendedor>(FORM_VACIO);
	const [baja, setBaja] = useState<Vendedor | null>(null);

	// Alta de vendedor nuevo
	const [modo, setModo] = useState<"existente" | "nuevo">("existente");
	const [usuarioId, setUsuarioId] = useState<string | null>(null);
	const [password, setPassword] = useState("");
	const [creado, setCreado] = useState<{
		usuario: string;
		password: string;
	} | null>(null);

	const activos = lista.filter((v) => v.estado === "Activo").length;
	const comisionPromedio =
		lista.length > 0
			? Math.round(
					lista.reduce((acc, v) => acc + v.comisionFija, 0) / lista.length,
				)
			: 0;
	const totalCerrados = lista.reduce((acc, v) => acc + v.alquileresCerrados, 0);

	const candidatos = datosIniciales.candidatos.filter(
		(u) => !lista.some((v) => v.id === u.id),
	);

	function abrirNuevo() {
		setEditando(null);
		setForm(FORM_VACIO);
		setModo("existente");
		setUsuarioId(null);
		setPassword("");
		setCreado(null);
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
			avatarUrl: v.avatarUrl,
		});
		setCreado(null);
		setSheetAbierto(true);
	}

	function elegirUsuario(id: string | null) {
		setUsuarioId(id);
		const u = candidatos.find((x) => x.id === id);
		if (u) {
			setForm((f) => ({
				...f,
				nombre: u.nombre,
				email: u.email,
				telefono: u.telefono,
				avatarUrl: u.avatarUrl,
			}));
		}
	}

	function partirNombre(nombre: string): {
		nombres: string;
		apellidos: string;
	} {
		const partes = nombre.trim().split(/\s+/).filter(Boolean);
		if (partes.length <= 1) {
			return { nombres: partes[0] ?? "", apellidos: "" };
		}
		return {
			nombres: partes[0],
			apellidos: partes.slice(1).join(" "),
		};
	}

	async function guardar() {
		if (guardando) return;
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

		const { nombres, apellidos } = partirNombre(form.nombre);
		if (!apellidos && !editando) {
			toast.error("Nombre incompleto", {
				description: "Ingresa nombre y apellido del vendedor.",
			});
			return;
		}

		setGuardando(true);
		try {
			if (editando) {
				const resultado = await actualizarVendedor({
					data: {
						perfilId: editando.id,
						nombres,
						apellidos: apellidos || editando.nombre,
						correo: form.email.trim(),
						telefono: form.telefono.trim(),
						cargo: form.cargo.trim(),
						comision,
						zona: form.zona || undefined,
					},
				});

				if (!resultado.ok) {
					toast.error("No se pudo actualizar el vendedor", {
						description: resultado.error,
					});
					return;
				}

				setLista((prev) =>
					prev.map((v) =>
						v.id === editando.id
							? {
									...v,
									nombre: form.nombre,
									email: form.email.trim(),
									telefono: form.telefono.trim(),
									zona: form.zona || v.zona,
									cargo: form.cargo || "Agente comercial",
									comisionFija: comision,
								}
							: v,
					),
				);
				toast.success("Vendedor actualizado", {
					description: `${form.nombre} guardado correctamente.`,
				});
				setSheetAbierto(false);
				await router.invalidate();
				return;
			}

			if (modo === "existente") {
				if (!usuarioId) {
					toast.error("Selecciona un usuario", {
						description: "Elige la cuenta que pasará a vendedor.",
					});
					return;
				}

				const resultado = await promoverVendedor({
					data: {
						perfilId: usuarioId,
						comision,
						cargo: form.cargo.trim(),
						zona: form.zona || undefined,
					},
				});

				if (!resultado.ok) {
					toast.error("No se pudo ascender al vendedor", {
						description: resultado.error,
					});
					return;
				}

				const nuevo: Vendedor = {
					id: usuarioId,
					nombre: form.nombre,
					email: form.email,
					telefono: form.telefono,
					zona: form.zona || "Sin asignar",
					cargo: form.cargo || "Agente comercial",
					comisionFija: comision,
					alquileresCerrados: 0,
					estado: "Activo",
					avatarUrl: form.avatarUrl,
					ingresoEl: new Date().toISOString(),
				};
				setLista((prev) => [...prev, nuevo]);
				toast.success("Vendedor ascendido", {
					description: `${form.nombre} pasó a formar parte del equipo comercial.`,
				});
				setSheetAbierto(false);
				await router.invalidate();
				return;
			}

			const resultado = await crearUsuarioVendedor({
				data: {
					nombres,
					apellidos,
					correo: form.email.trim(),
					telefono: form.telefono.trim() || undefined,
					comisionFija: comision,
					cargo: form.cargo.trim() || undefined,
					zonaNombre: form.zona || undefined,
					password: password.trim() ? password : undefined,
				},
			});

			const nuevo: Vendedor = {
				id: resultado.id,
				nombre: form.nombre,
				email: resultado.correo,
				telefono: form.telefono,
				zona: form.zona || "Sin asignar",
				cargo: form.cargo || "Agente comercial",
				comisionFija: comision,
				alquileresCerrados: 0,
				estado: "Activo",
				avatarUrl: form.avatarUrl,
				ingresoEl: new Date().toISOString(),
			};
			setLista((prev) => [...prev, nuevo]);
			setCreado({ usuario: resultado.correo, password: resultado.password });
			toast.success("Vendedor registrado", {
				description: `${form.nombre} se sumó al equipo. Entrega sus credenciales.`,
			});
			await router.invalidate();
		} catch (error) {
			toast.error("No se pudo guardar el vendedor", {
				description:
					error instanceof Error ? error.message : "Inténtalo de nuevo.",
			});
		} finally {
			setGuardando(false);
		}
	}

	async function confirmarBaja() {
		if (!baja || guardando) return;
		setGuardando(true);
		try {
			const resultado = await darBajaVendedor({
				data: { perfilId: baja.id },
			});

			if (!resultado.ok) {
				toast.error("No se pudo dar de baja al vendedor", {
					description: resultado.error,
				});
				return;
			}

			setLista((prev) =>
				prev.map((v) => (v.id === baja.id ? { ...v, estado: "Inactivo" } : v)),
			);
			toast.info("Vendedor dado de baja", {
				description: `${baja.nombre} ya no recibirá nuevas visitas.`,
			});
			setBaja(null);
			await router.invalidate();
		} catch (error) {
			toast.error("No se pudo dar de baja al vendedor", {
				description:
					error instanceof Error ? error.message : "Inténtalo de nuevo.",
			});
		} finally {
			setGuardando(false);
		}
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

			<Sheet
				open={sheetAbierto}
				onOpenChange={(open) => {
					setSheetAbierto(open);
					if (!open) setCreado(null);
				}}
			>
				<SheetContent className="w-full overflow-y-auto sm:max-w-md">
					{creado ? (
						<>
							<SheetHeader>
								<SheetTitle className="font-display">
									Vendedor registrado
								</SheetTitle>
								<SheetDescription>
									Entrega las credenciales de acceso al nuevo agente.
								</SheetDescription>
							</SheetHeader>
							<div className="px-4">
								<CredentialsCard
									usuario={creado.usuario}
									password={creado.password}
									titulo="Credenciales del vendedor"
								/>
							</div>
							<SheetFooter className="flex-row justify-end gap-2 px-4">
								<Button
									variant="default"
									onClick={() => setSheetAbierto(false)}
								>
									Entendido
								</Button>
							</SheetFooter>
						</>
					) : (
						<>
							<SheetHeader>
								<SheetTitle className="font-display">
									{editando ? "Editar vendedor" : "Nuevo vendedor"}
								</SheetTitle>
								<SheetDescription>
									{editando
										? "Actualiza los datos y la comisión del agente."
										: "Asciende a un usuario existente o registra un agente nuevo."}
								</SheetDescription>
							</SheetHeader>

							<div className="flex flex-col gap-4 px-4">
								{!editando ? (
									<Tabs
										value={modo}
										onValueChange={(v) => setModo(v as "existente" | "nuevo")}
									>
										<TabsList className="w-full">
											<TabsTrigger value="existente" className="flex-1">
												<UserRound aria-hidden="true" />
												Usuario existente
											</TabsTrigger>
											<TabsTrigger value="nuevo" className="flex-1">
												<UserPlus aria-hidden="true" />
												Registrar nuevo
											</TabsTrigger>
										</TabsList>
										<TabsContent value="existente" className="mt-4">
											<div className="flex flex-col gap-2">
												<Label>Usuario de la plataforma</Label>
												<EntityPicker
													items={candidatos.map((u) => ({
														id: u.id,
														nombre: u.nombre,
														avatarUrl: u.avatarUrl,
														secundario: `${u.rol} · ${u.email}`,
													}))}
													value={usuarioId}
													onChange={elegirUsuario}
													placeholder="Buscar usuario para ascender…"
													resumenBadge="Usuario"
												/>
												<p className="text-xs text-muted-foreground">
													Al ascender, la cuenta cambia su rol a vendedor
													conservando el acceso.
												</p>
											</div>
										</TabsContent>
										<TabsContent value="nuevo" className="mt-4">
											<p className="text-xs text-muted-foreground">
												Se creará una cuenta nueva. Asigna una contraseña
												temporal que se mostrará una sola vez.
											</p>
										</TabsContent>
									</Tabs>
								) : null}

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
									<ZonePicker
										id="vd-zona"
										mode="single"
										value={form.zona ? [form.zona] : []}
										onChange={(zonas) =>
											setForm((f) => ({ ...f, zona: zonas[0] ?? "" }))
										}
										placeholder="Elegir zona…"
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
												setForm((f) => ({
													...f,
													comisionFija: e.target.value,
												}))
											}
										/>
									</div>
								</div>

								{!editando && modo === "nuevo" ? (
									<PasswordGenerator
										value={password}
										onChange={setPassword}
										label="Contraseña temporal del vendedor"
									/>
								) : null}
							</div>

							<SheetFooter className="flex-row justify-end gap-2 px-4">
								<Button
									variant="outline"
									onClick={() => setSheetAbierto(false)}
								>
									Cancelar
								</Button>
								<Button
									variant="default"
									disabled={guardando}
									onClick={guardar}
								>
									{editando
										? "Guardar cambios"
										: modo === "existente"
											? "Ascender a vendedor"
											: "Registrar vendedor"}
								</Button>
							</SheetFooter>
						</>
					)}
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
							disabled={guardando}
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
