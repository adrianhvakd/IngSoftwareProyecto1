import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Building2,
	ExternalLink,
	LayoutGrid,
	List,
	MapPin,
	Plus,
	Search,
	Star,
} from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { inmuebleTone, StatusBadge } from "@/components/common/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { PropertyCard } from "@/components/property/property-card";
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
import { inmuebles } from "@/data/inmuebles";
import { TIPOS_INMUEBLE, ZONAS } from "@/lib/catalog";
import { formatBsMes, formatFecha } from "@/lib/format";

export const Route = createFileRoute("/admin/inmuebles/")({
	head: () => ({
		meta: [{ title: "Inmuebles · Administración · RE/MAX Potosí" }],
	}),
	component: AdminInmuebles,
});

type FiltroEstado = "todos" | "Disponible" | "En alquiler" | "Destacado";

const ESTADOS: FiltroEstado[] = [
	"todos",
	"Disponible",
	"En alquiler",
	"Destacado",
];

function AdminInmuebles() {
	const [q, setQ] = useState("");
	const [tipo, setTipo] = useState("todos");
	const [zona, setZona] = useState("todos");
	const [estado, setEstado] = useState<FiltroEstado>("todos");
	const [vista, setVista] = useState<"grilla" | "tabla">("tabla");

	const resultados = useMemo(() => {
		const termino = q.trim().toLowerCase();
		return inmuebles.filter((i) => {
			if (tipo !== "todos" && i.tipo !== tipo) return false;
			if (zona !== "todos" && i.zona !== zona) return false;
			if (estado !== "todos" && i.estado !== estado) return false;
			if (termino) {
				const heno =
					`${i.titulo} ${i.codigo} ${i.direccion} ${i.zona}`.toLowerCase();
				if (!heno.includes(termino)) return false;
			}
			return true;
		});
	}, [q, tipo, zona, estado]);

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

			<div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 lg:flex-row lg:items-center">
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
					<Select value={zona} onValueChange={setZona}>
						<SelectTrigger aria-label="Filtrar por zona">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="todos">Toda zona</SelectItem>
							{ZONAS.map((z) => (
								<SelectItem key={z} value={z}>
									{z}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select
						value={estado}
						onValueChange={(v) => setEstado(v as FiltroEstado)}
					>
						<SelectTrigger aria-label="Filtrar por estado">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{ESTADOS.map((e) => (
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

			<p className="text-sm text-muted-foreground">
				{resultados.length} de {inmuebles.length} inmuebles
			</p>

			{resultados.length === 0 ? (
				<EmptyState
					icon={<Building2 className="size-6" aria-hidden="true" />}
					title="Sin inmuebles que coincidan"
					description="Cambia la búsqueda o los filtros de tipo, zona y estado para ver resultados."
					action={
						<Button
							variant="outline"
							onClick={() => {
								setQ("");
								setTipo("todos");
								setZona("todos");
								setEstado("todos");
							}}
						>
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
													<span className="block max-w-[240px] truncate font-medium text-foreground">
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
									<TableCell className="hidden max-w-[180px] md:table-cell">
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
										<StatusBadge tone={inmuebleTone[i.estado]}>
											{i.estado}
										</StatusBadge>
									</TableCell>
									<TableCell className="pr-5 text-right">
										<Button asChild variant="ghost" size="sm">
											<Link to="/propiedades/$id" params={{ id: i.id }}>
												Ver
												<ExternalLink className="size-3.5" aria-hidden="true" />
											</Link>
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</>
	);
}
