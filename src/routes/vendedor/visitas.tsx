import { createFileRoute } from "@tanstack/react-router";
import {
	CalendarCheck,
	CalendarDays,
	Check,
	Clock,
	List,
	MapPin,
	Phone,
	Search,
	X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge, visitaTone } from "@/components/common/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
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
	cambiarEstadoVisitaActor,
	listarVisitasVendedor,
} from "@/server/paneles";
import type { VisitaDetalle, VisitaEstado } from "@/types/models";

export const Route = createFileRoute("/vendedor/visitas")({
	loader: () => listarVisitasVendedor(),
	head: () => ({
		meta: [{ title: "Mis visitas · Panel vendedor · RE/MAX Potosí" }],
	}),
	component: VendedorVisitas,
});

type FiltroEstado = "todas" | VisitaEstado;
const ESTADOS: VisitaEstado[] = ["Pendiente", "Realizada", "Cancelada"];

function VendedorVisitas() {
	const { ahora, visitas } = Route.useLoaderData();
	const [lista, setLista] = useState<VisitaDetalle[]>(visitas);
	const [actualizando, setActualizando] = useState<string | null>(null);
	const [q, setQ] = useState("");
	const [estado, setEstado] = useState<FiltroEstado>("todas");

	useEffect(() => {
		setLista(visitas);
	}, [visitas]);

	const filtradas = useMemo(() => {
		const termino = q.trim().toLowerCase();
		return lista.filter((v) => {
			if (estado !== "todas" && v.estado !== estado) return false;
			if (termino) {
				const heno =
					`${v.cliente.nombre} ${v.inmueble.titulo} ${v.inmueble.codigo}`.toLowerCase();
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

	async function cambiarEstado(visitaId: string, nuevo: VisitaEstado) {
		if (actualizando) return;
		setActualizando(visitaId);
		try {
			const resultado = await cambiarEstadoVisitaActor({
				data: {
					visitaId,
					estado: ESTADO_VISITA_UI_A_DB[nuevo],
				},
			});

			if (!resultado.ok) {
				toast.error("No se pudo actualizar la visita", {
					description: resultado.error,
				});
				return;
			}

			setLista((prev) =>
				prev.map((v) => (v.id === visitaId ? { ...v, estado: nuevo } : v)),
			);
			toast.success(`Visita ${nuevo.toLowerCase()}`, {
				description: "El estado se actualizó en la agenda.",
			});
		} catch (error) {
			toast.error("No se pudo actualizar la visita", {
				description:
					error instanceof Error ? error.message : "Inténtalo de nuevo.",
			});
		} finally {
			setActualizando(null);
		}
	}

	function acciones(v: VisitaDetalle) {
		const pendiente = v.estado === "Pendiente";
		const ocupada = actualizando === v.id;
		return (
			<div className="flex items-center justify-end gap-2">
				<Button
					variant="outline"
					size="sm"
					disabled={!pendiente || Boolean(actualizando)}
					onClick={() => void cambiarEstado(v.id, "Realizada")}
				>
					<Check aria-hidden="true" />
					{ocupada ? "Guardando…" : "Realizada"}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					disabled={!pendiente || Boolean(actualizando)}
					className="text-muted-foreground"
					onClick={() => void cambiarEstado(v.id, "Cancelada")}
				>
					<X aria-hidden="true" />
					Cancelar
				</Button>
			</div>
		);
	}

	return (
		<>
			<PageHeader
				title="Mis visitas"
				description="Citas asignadas por la oficina. Confirma la asistencia y actualiza el estado."
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
						placeholder="Buscar por cliente o inmueble…"
						className="pl-9"
						aria-label="Buscar mis visitas"
					/>
				</div>
				<Select
					value={estado}
					onValueChange={(v) => setEstado(v as FiltroEstado)}
				>
					<SelectTrigger
						className="w-full sm:w-[170px]"
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
							title="Sin visitas asignadas"
							description="No tienes visitas en esta vista. Prueba con otro filtro."
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
										{dia >= fechaDiaLaPaz(ahora) ? (
											<span className="text-xs font-medium text-success">
												Próxima
											</span>
										) : null}
									</div>
									<div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
										{items.map((v) => (
											<article
												key={v.id}
												className="flex gap-4 rounded-xl border border-border bg-card p-4"
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
														<p className="truncate font-semibold text-foreground">
															{v.cliente.nombre}
														</p>
														<StatusBadge tone={visitaTone[v.estado]}>
															{v.estado}
														</StatusBadge>
													</div>
													<p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
														<MapPin
															className="size-3 shrink-0 text-primary/70"
															aria-hidden="true"
														/>
														<span className="truncate">
															{v.inmueble.titulo}
														</span>
													</p>
													<span className="mt-2 inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-[11px] text-muted-foreground">
														<Phone className="size-3" aria-hidden="true" />
														{v.cliente.telefonoContacto}
													</span>
													<div className="mt-3">{acciones(v)}</div>
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
							description="Cambia la búsqueda o el filtro de estado."
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
												<span className="block max-w-[220px] truncate font-medium text-foreground">
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
												<StatusBadge tone={visitaTone[v.estado]}>
													{v.estado}
												</StatusBadge>
											</TableCell>
											<TableCell className="pr-5">{acciones(v)}</TableCell>
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
