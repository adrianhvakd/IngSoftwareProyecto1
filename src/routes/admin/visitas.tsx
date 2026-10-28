import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
	CalendarCheck,
	CalendarDays,
	Clock,
	List,
	MapPin,
	MoreHorizontal,
	Phone,
	Search,
	UserRoundCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge, visitaTone } from "@/components/common/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ESTADO_VISITA_UI_A_DB } from "@/lib/admin";
import { fechaDiaLaPaz, formatFechaSemana, formatHora } from "@/lib/format";
import {
	asignarVendedorVisita,
	cambiarEstadoVisita,
	listarVisitasAdmin,
} from "@/server/admin/visitas";
import type { VisitaDetalle, VisitaEstado } from "@/types/models";

export const Route = createFileRoute("/admin/visitas")({
	loader: () => listarVisitasAdmin(),
	head: () => ({
		meta: [{ title: "Visitas · Administración · RE/MAX Potosí" }],
	}),
	component: AdminVisitas,
});

type FiltroEstado = "todas" | VisitaEstado;

const ESTADOS: VisitaEstado[] = ["Pendiente", "Realizada", "Cancelada"];

function AdminVisitas() {
	const datosIniciales = Route.useLoaderData();
	const router = useRouter();
	const [lista, setLista] = useState<VisitaDetalle[]>(datosIniciales.visitas);
	const vendedoresDisponibles = datosIniciales.vendedores;
	const [guardando, setGuardando] = useState(false);
	const [q, setQ] = useState("");
	const [estado, setEstado] = useState<FiltroEstado>("todas");

	const filtradas = useMemo(() => {
		const termino = q.trim().toLowerCase();
		return lista.filter((v) => {
			if (estado !== "todas" && v.estado !== estado) return false;
			if (termino) {
				const heno =
					`${v.cliente.nombre} ${v.inmueble.titulo} ${v.inmueble.codigo} ${v.vendedor?.nombre ?? ""}`.toLowerCase();
				if (!heno.includes(termino)) return false;
			}
			return true;
		});
	}, [lista, q, estado]);

	const agenda = useMemo(() => {
		const grupos = new Map<string, VisitaDetalle[]>();
		for (const v of filtradas) {
			const clave = fechaDiaLaPaz(v.fechaHora);
			const lista = grupos.get(clave) ?? [];
			lista.push(v);
			grupos.set(clave, lista);
		}
		return [...grupos.entries()].sort((a, b) => a[0].localeCompare(b[0]));
	}, [filtradas]);

	async function asignarVendedor(visitaId: string, vendedorId: string) {
		if (guardando) return;
		const vendedor = vendedoresDisponibles.find((v) => v.id === vendedorId);
		setGuardando(true);
		try {
			const resultado = await asignarVendedorVisita({
				data: { visitaId, vendedorId },
			});

			if (!resultado.ok) {
				toast.error("No se pudo asignar el agente", {
					description: resultado.error,
				});
				return;
			}

			setLista((prev) =>
				prev.map((v) =>
					v.id === visitaId ? { ...v, vendedorId, vendedor } : v,
				),
			);
			toast.success("Agente asignado", {
				description: `${vendedor?.nombre ?? "Agente"} responsable de la visita.`,
			});
			await router.invalidate();
		} catch (error) {
			toast.error("No se pudo asignar el agente", {
				description:
					error instanceof Error ? error.message : "Inténtalo de nuevo.",
			});
		} finally {
			setGuardando(false);
		}
	}

	async function cambiarEstado(visitaId: string, nuevo: VisitaEstado) {
		if (guardando) return;
		setGuardando(true);
		try {
			const resultado = await cambiarEstadoVisita({
				data: {
					visitaId,
					estado: ESTADO_VISITA_UI_A_DB[nuevo],
				},
			});

			if (!resultado.ok) {
				toast.error("No se pudo cambiar el estado", {
					description: resultado.error,
				});
				return;
			}

			setLista((prev) =>
				prev.map((v) => (v.id === visitaId ? { ...v, estado: nuevo } : v)),
			);
			toast.info(`Visita marcada como ${nuevo.toLowerCase()}`, {
				description: "El cambio se refleja en la agenda.",
			});
			await router.invalidate();
		} catch (error) {
			toast.error("No se pudo cambiar el estado", {
				description:
					error instanceof Error ? error.message : "Inténtalo de nuevo.",
			});
		} finally {
			setGuardando(false);
		}
	}

	const toolbar = (
		<div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
			<div className="relative flex-1">
				<Search
					className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
					aria-hidden="true"
				/>
				<Input
					value={q}
					onChange={(e) => setQ(e.target.value)}
					placeholder="Buscar por cliente, inmueble o agente…"
					className="pl-9"
					aria-label="Buscar visitas"
				/>
			</div>
			<Select
				value={estado}
				onValueChange={(v) => setEstado(v as FiltroEstado)}
			>
				<SelectTrigger
					className="w-full sm:w-42.5"
					aria-label="Filtrar por estado"
				>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="todas">Todo estado</SelectItem>
					{ESTADOS.map((e) => (
						<SelectItem key={e} value={e}>
							{e === "Pendiente"
								? "Pendientes"
								: e === "Realizada"
									? "Realizadas"
									: "Canceladas"}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);

	return (
		<>
			<PageHeader
				title="Visitas"
				description="Agenda de citas con clientes. Asigna agentes responsables y actualiza el estado de cada visita."
			/>

			{toolbar}

			<Tabs defaultValue="agenda">
				<TabsList>
					<TabsTrigger value="agenda">
						<CalendarDays aria-hidden="true" />
						Agenda
					</TabsTrigger>
					<TabsTrigger value="tabla">
						<List aria-hidden="true" />
						Tabla
					</TabsTrigger>
				</TabsList>

				<TabsContent value="agenda" className="mt-4">
					{agenda.length === 0 ? (
						<EmptyState
							icon={<CalendarCheck className="size-6" aria-hidden="true" />}
							title="Sin visitas en la agenda"
							description="Ajusta la búsqueda o el filtro de estado para ver citas programadas."
						/>
					) : (
						<div className="flex flex-col gap-6">
							{agenda.map(([dia, items]) => (
								<div key={dia}>
									<div className="mb-3 flex items-center gap-3">
										<span className="inline-flex items-center gap-2 rounded-full bg-blue-soft px-3 py-1 font-display text-xs font-bold text-blue-deep">
											<CalendarDays className="size-3.5" aria-hidden="true" />
											{formatFechaSemana(`${dia}T12:00:00-04:00`)}
										</span>
										<span className="text-xs text-muted-foreground">
											{items.length} visita{items.length === 1 ? "" : "s"}
										</span>
									</div>
									<div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
										{items.map((v) => (
											<article
												key={v.id}
												className="flex gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/25"
											>
												<div className="flex w-14 shrink-0 flex-col items-center rounded-lg bg-secondary py-2">
													<Clock
														className="size-3.5 text-primary"
														aria-hidden="true"
													/>
													<span className="mt-1 font-display text-sm font-bold tabular text-foreground">
														{formatHora(v.fechaHora)}
													</span>
												</div>
												<div className="min-w-0 flex-1">
													<div className="flex items-start justify-between gap-2">
														<div className="min-w-0">
															<p className="truncate font-semibold text-foreground">
																{v.cliente.nombre}
															</p>
															<p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
																<MapPin
																	className="size-3 shrink-0 text-primary/70"
																	aria-hidden="true"
																/>
																<span className="truncate">
																	{v.inmueble.titulo}
																</span>
															</p>
														</div>
														<StatusBadge tone={visitaTone[v.estado]}>
															{v.estado}
														</StatusBadge>
													</div>

													<div className="mt-3 flex flex-wrap items-center gap-2">
														<span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-[11px] text-muted-foreground">
															<Phone className="size-3" aria-hidden="true" />
															{v.cliente.telefonoContacto}
														</span>
														<span className="rounded-md bg-secondary px-2 py-1 text-[11px] text-muted-foreground">
															{v.canal}
														</span>
													</div>

													<div className="mt-3 flex items-center gap-2">
														<Select
															value={v.vendedorId ?? ""}
															disabled={guardando}
															onValueChange={(valor) =>
																void asignarVendedor(v.id, valor)
															}
														>
															<SelectTrigger
																size="sm"
																className="h-8 flex-1"
																aria-label={`Asignar agente a ${v.cliente.nombre}`}
															>
																<UserRoundCheck
																	className="size-3.5 text-muted-foreground"
																	aria-hidden="true"
																/>
																<SelectValue placeholder="Sin asignar" />
															</SelectTrigger>
															<SelectContent>
																{vendedoresDisponibles
																	.filter((vd) => vd.estado === "Activo")
																	.map((vd) => (
																		<SelectItem key={vd.id} value={vd.id}>
																			{vd.nombre}
																		</SelectItem>
																	))}
															</SelectContent>
														</Select>
														<EstadoMenu
															visitaId={v.id}
															estadoActual={v.estado}
															onCambiar={cambiarEstado}
														/>
													</div>
												</div>
											</article>
										))}
									</div>
								</div>
							))}
						</div>
					)}
				</TabsContent>

				<TabsContent value="tabla" className="mt-4">
					{filtradas.length === 0 ? (
						<EmptyState
							icon={<CalendarCheck className="size-6" aria-hidden="true" />}
							title="Sin visitas que coincidan"
							description="Cambia la búsqueda o el filtro de estado para ver resultados."
						/>
					) : (
						<div className="overflow-x-auto rounded-xl border border-border bg-card">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="pl-5">Cliente</TableHead>
										<TableHead>Inmueble</TableHead>
										<TableHead>Fecha y hora</TableHead>
										<TableHead className="hidden md:table-cell">
											Canal
										</TableHead>
										<TableHead>Agente</TableHead>
										<TableHead>Estado</TableHead>
										<TableHead className="pr-5 text-right">Acciones</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filtradas.map((v) => (
										<TableRow key={v.id}>
											<TableCell className="pl-5">
												<span className="block font-medium text-foreground">
													{v.cliente.nombre}
												</span>
												<span className="block text-xs text-muted-foreground tabular">
													{v.cliente.telefonoContacto}
												</span>
											</TableCell>
											<TableCell>
												<span className="block max-w-55 truncate font-medium text-foreground">
													{v.inmueble.titulo}
												</span>
												<span className="text-xs text-muted-foreground">
													{v.inmueble.codigo}
												</span>
											</TableCell>
											<TableCell className="whitespace-nowrap text-muted-foreground">
												{formatFechaSemana(v.fechaHora)} ·{" "}
												{formatHora(v.fechaHora)}
											</TableCell>
											<TableCell className="hidden text-muted-foreground md:table-cell">
												{v.canal}
											</TableCell>
											<TableCell>
												<Select
													value={v.vendedorId ?? ""}
													disabled={guardando}
													onValueChange={(valor) =>
														void asignarVendedor(v.id, valor)
													}
												>
													<SelectTrigger
														size="sm"
														className="h-8 `w-42.5"
														aria-label={`Asignar agente a ${v.cliente.nombre}`}
													>
														<SelectValue placeholder="Sin asignar" />
													</SelectTrigger>
													<SelectContent>
														{vendedoresDisponibles
															.filter((vd) => vd.estado === "Activo")
															.map((vd) => (
																<SelectItem key={vd.id} value={vd.id}>
																	{vd.nombre}
																</SelectItem>
															))}
													</SelectContent>
												</Select>
											</TableCell>
											<TableCell>
												<StatusBadge tone={visitaTone[v.estado]}>
													{v.estado}
												</StatusBadge>
											</TableCell>
											<TableCell className="pr-5 text-right">
												<EstadoMenu
													visitaId={v.id}
													estadoActual={v.estado}
													onCambiar={cambiarEstado}
												/>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</TabsContent>
			</Tabs>
		</>
	);
}

function EstadoMenu({
	visitaId,
	estadoActual,
	onCambiar,
}: {
	visitaId: string;
	estadoActual: VisitaEstado;
	onCambiar: (id: string, estado: VisitaEstado) => void;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="icon-sm"
					aria-label="Cambiar estado de la visita"
				>
					<MoreHorizontal aria-hidden="true" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-44">
				<DropdownMenuLabel className="text-xs text-muted-foreground">
					Marcar como
				</DropdownMenuLabel>
				{ESTADOS.map((e) => (
					<DropdownMenuItem
						key={e}
						disabled={e === estadoActual}
						onSelect={() => onCambiar(visitaId, e)}
					>
						{e}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
