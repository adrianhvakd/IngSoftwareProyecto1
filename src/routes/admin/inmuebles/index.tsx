import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Building2,
	ExternalLink,
	LayoutGrid,
	List,
	MapPin,
	Pencil,
	Plus,
	Search,
	Star,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { inmuebleTone, StatusBadge } from "@/components/common/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { ZonePicker } from "@/components/pickers/zone-picker";
import { PropertyCard } from "@/components/property/property-card";
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
import { inmuebles as inmueblesIniciales } from "@/data/inmuebles";
import type { Inmueble, InmuebleEstado } from "@/data/types";
import { TIPOS_INMUEBLE } from "@/lib/catalog";
import { formatBsMes, formatFecha } from "@/lib/format";

export const Route = createFileRoute("/admin/inmuebles/")({
	head: () => ({
		meta: [{ title: "Inmuebles · Administración · RE/MAX Potosí" }],
	}),
	component: AdminInmuebles,
});

type FiltroEstado =
	| "todos"
	| "Disponible"
	| "Reservado"
	| "En alquiler"
	| "Inactivo"
	| "Destacado";

const ESTADOS_FILTRO: FiltroEstado[] = [
	"todos",
	"Disponible",
	"Reservado",
	"En alquiler",
	"Inactivo",
	"Destacado",
];

const ESTADOS_INMUEBLE: InmuebleEstado[] = [
	"Disponible",
	"Reservado",
	"En alquiler",
	"Inactivo",
];

function AdminInmuebles() {
	const [lista, setLista] = useState<Inmueble[]>(inmueblesIniciales);
	const [q, setQ] = useState("");
	const [tipo, setTipo] = useState("todos");
	const [zonas, setZonas] = useState<string[]>([]);
	const [estado, setEstado] = useState<FiltroEstado>("todos");
	const [vista, setVista] = useState<"grilla" | "tabla">("tabla");
	const [baja, setBaja] = useState<Inmueble | null>(null);

	const resultados = useMemo(() => {
		const termino = q.trim().toLowerCase();
		return lista.filter((i) => {
			if (tipo !== "todos" && i.tipo !== tipo) return false;
			if (zonas.length > 0 && !zonas.includes(i.zona)) return false;
			if (estado === "Destacado") {
				if (!i.destacado) return false;
			} else if (estado !== "todos" && i.estado !== estado) {
				return false;
			}
			if (termino) {
				const heno =
					`${i.titulo} ${i.codigo} ${i.direccion} ${i.zona}`.toLowerCase();
				if (!heno.includes(termino)) return false;
			}
			return true;
		});
	}, [lista, q, tipo, zonas, estado]);

	function limpiarFiltros() {
		setQ("");
		setTipo("todos");
		setZonas([]);
		setEstado("todos");
	}

	function aplicarEstado(inmueble: Inmueble, nuevo: InmuebleEstado) {
		setLista((prev) =>
			prev.map((i) => (i.id === inmueble.id ? { ...i, estado: nuevo } : i)),
		);
		toast.success("Estado actualizado", {
			description: `${inmueble.codigo} ahora está «${nuevo}». (Acción simulada)`,
		});
	}

	function cambiarEstado(inmueble: Inmueble, nuevo: InmuebleEstado) {
		if (nuevo === inmueble.estado) return;
		if (nuevo === "Inactivo") {
			setBaja(inmueble);
			return;
		}
		aplicarEstado(inmueble, nuevo);
	}

	function alternarDestacado(inmueble: Inmueble) {
		const nuevo = !inmueble.destacado;
		setLista((prev) =>
			prev.map((i) => (i.id === inmueble.id ? { ...i, destacado: nuevo } : i)),
		);
		toast.success(nuevo ? "Marcado como destacado" : "Quitado de destacados", {
			description: `${inmueble.codigo} · ${inmueble.titulo}`,
		});
	}

	return (
		<>
			<PageHeader
				title="Inmuebles"
				description="Cartera completa de propiedades publicadas. Administra disponibilidad, publicaciones y destacados."
				actions={
					<Button asChild variant="cta">
						<Link to="/admin/inmuebles/nuevo">
							<Plus aria-hidden="true" />
							Publicar inmueble
						</Link>
					</Button>
				}
			/>

			<div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
					<div className="relative flex-1">
						<Search
							className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
							aria-hidden="true"
						/>
						<Input
							value={q}
							onChange={(e) => setQ(e.target.value)}
							placeholder="Buscar por título, código o dirección…"
							className="pl-9"
							aria-label="Buscar inmuebles"
						/>
					</div>
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-auto">
						<Select value={tipo} onValueChange={setTipo}>
							<SelectTrigger aria-label="Filtrar por tipo">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="todos">Todo tipo</SelectItem>
								{TIPOS_INMUEBLE.map((t) => (
									<SelectItem key={t} value={t}>
										{t}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<div className="min-w-40">
							<ZonePicker
								mode="multiple"
								value={zonas}
								onChange={setZonas}
								placeholder="Toda zona"
							/>
						</div>
						<Select
							value={estado}
							onValueChange={(v) => setEstado(v as FiltroEstado)}
						>
							<SelectTrigger aria-label="Filtrar por estado">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{ESTADOS_FILTRO.map((e) => (
									<SelectItem key={e} value={e}>
										{e === "todos" ? "Todo estado" : e}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div
						role="toolbar"
						aria-label="Vista de inmuebles"
						className="flex items-center self-start rounded-lg border border-border bg-card p-0.5 lg:self-auto"
					>
						<Button
							variant={vista === "tabla" ? "secondary" : "ghost"}
							size="icon-sm"
							onClick={() => setVista("tabla")}
							aria-pressed={vista === "tabla"}
							aria-label="Vista de tabla"
						>
							<List aria-hidden="true" />
						</Button>
						<Button
							variant={vista === "grilla" ? "secondary" : "ghost"}
							size="icon-sm"
							onClick={() => setVista("grilla")}
							aria-pressed={vista === "grilla"}
							aria-label="Vista de galería"
						>
							<LayoutGrid aria-hidden="true" />
						</Button>
					</div>
				</div>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-2">
				<p className="text-sm text-muted-foreground">
					{resultados.length} de {lista.length} inmuebles
				</p>
				{q || tipo !== "todos" || zonas.length > 0 || estado !== "todos" ? (
					<Button variant="ghost" size="sm" onClick={limpiarFiltros}>
						Limpiar filtros
					</Button>
				) : null}
			</div>

			{resultados.length === 0 ? (
				<EmptyState
					icon={<Building2 className="size-6" aria-hidden="true" />}
					title="Sin inmuebles que coincidan"
					description="Cambia la búsqueda o los filtros de tipo, zona y estado para ver resultados."
					action={
						<Button variant="outline" onClick={limpiarFiltros}>
							Limpiar filtros
						</Button>
					}
				/>
			) : vista === "grilla" ? (
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
					{resultados.map((inmueble) => (
						<PropertyCard key={inmueble.id} inmueble={inmueble} />
					))}
				</div>
			) : (
				<div className="overflow-x-auto rounded-xl border border-border bg-card">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="pl-5">Inmueble</TableHead>
								<TableHead>Tipo</TableHead>
								<TableHead className="hidden md:table-cell">Zona</TableHead>
								<TableHead>Alquiler / mes</TableHead>
								<TableHead className="hidden lg:table-cell">
									Disponible
								</TableHead>
								<TableHead>Estado</TableHead>
								<TableHead className="pr-5 text-right">Acciones</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{resultados.map((i) => (
								<TableRow key={i.id}>
									<TableCell className="pl-5">
										<div className="flex items-center gap-3">
											<div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-soft text-primary">
												<Building2 className="size-4" aria-hidden="true" />
											</div>
											<div className="min-w-0">
												<span className="flex items-center gap-1.5">
													<span className="block max-w-60 truncate font-medium text-foreground">
														{i.titulo}
													</span>
													{i.destacado ? (
														<Star
															className="size-3.5 shrink-0 fill-cta text-cta"
															aria-label="Destacado"
														/>
													) : null}
												</span>
												<span className="block text-xs text-muted-foreground">
													{i.codigo}
												</span>
											</div>
										</div>
									</TableCell>
									<TableCell className="text-muted-foreground">
										{i.tipo}
									</TableCell>
									<TableCell className="hidden max-w-45 md:table-cell">
										<span className="flex items-center gap-1.5 text-sm text-muted-foreground">
											<MapPin
												className="size-3.5 shrink-0 text-primary/70"
												aria-hidden="true"
											/>
											<span className="truncate">{i.zona}</span>
										</span>
									</TableCell>
									<TableCell className="whitespace-nowrap font-medium tabular text-foreground">
										{formatBsMes(i.precio)}
									</TableCell>
									<TableCell className="hidden text-muted-foreground lg:table-cell">
										{formatFecha(i.fechaDisponibilidad)}
									</TableCell>
									<TableCell>
										<EstadoMenu
											inmueble={i}
											onCambiar={(e) => cambiarEstado(i, e)}
											onDestacar={() => alternarDestacado(i)}
										/>
									</TableCell>
									<TableCell className="pr-5 text-right">
										<div className="flex items-center justify-end gap-1">
											<Button asChild variant="ghost" size="sm">
												<Link
													to="/admin/inmuebles/$id/editar"
													params={{ id: i.id }}
												>
													<Pencil className="size-3.5" aria-hidden="true" />
													Editar
												</Link>
											</Button>
											<Button asChild variant="ghost" size="sm">
												<Link to="/propiedades/$id" params={{ id: i.id }}>
													Ver
													<ExternalLink
														className="size-3.5"
														aria-hidden="true"
													/>
												</Link>
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			<AlertDialog
				open={baja !== null}
				onOpenChange={(open) => !open && setBaja(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							¿Marcar el inmueble como inactivo?
						</AlertDialogTitle>
						<AlertDialogDescription>
							{baja
								? `${baja.codigo} · ${baja.titulo} dejará de mostrarse en el catálogo público. Podrás reactivarlo cambiando su estado más adelante.`
								: null}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (baja) aplicarEstado(baja, "Inactivo");
								setBaja(null);
							}}
						>
							Sí, desactivar
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

function EstadoMenu({
	inmueble,
	onCambiar,
	onDestacar,
}: {
	inmueble: Inmueble;
	onCambiar: (estado: InmuebleEstado) => void;
	onDestacar: () => void;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
					aria-label={`Cambiar estado de ${inmueble.titulo}`}
				>
					<StatusBadge tone={inmuebleTone[inmueble.estado]}>
						{inmueble.estado}
					</StatusBadge>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-48">
				<DropdownMenuLabel>Cambiar estado</DropdownMenuLabel>
				{ESTADOS_INMUEBLE.map((e) => (
					<DropdownMenuItem
						key={e}
						disabled={e === inmueble.estado}
						onSelect={() => onCambiar(e)}
					>
						{e}
					</DropdownMenuItem>
				))}
				<DropdownMenuSeparator />
				<DropdownMenuItem onSelect={onDestacar}>
					<Star
						className={inmueble.destacado ? "fill-cta text-cta" : undefined}
						aria-hidden="true"
					/>
					{inmueble.destacado ? "Quitar destacado" : "Marcar como destacado"}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
