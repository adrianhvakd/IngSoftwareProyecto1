import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { cn } from "cn";
import {
	ArrowUpDown,
	LayoutGrid,
	List,
	SlidersHorizontal,
	X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { PublicLayout } from "@/components/layout/public-layout";
import { PropertyCard } from "@/components/property/property-card";
import {
	PropertyCardSkeleton,
	PropertyGridSkeleton,
} from "@/components/property/property-card-skeleton";
import { PropertyFilters } from "@/components/property/property-filters";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
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
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { inmuebles } from "@/data/inmuebles";
import type { OrdenCatalogo, VistaCatalogo } from "@/lib/catalog";
import {
	filtrarYOrdenar,
	filtrosActivos,
	ORDEN_OPCIONES,
	validateCatalogSearch,
} from "@/lib/catalog";
import { formatNumber } from "@/lib/format";

const POR_PAGINA = 6;

export const Route = createFileRoute("/propiedades/")({
	validateSearch: validateCatalogSearch,
	head: () => ({
		meta: [
			{ title: "Propiedades en alquiler · RE/MAX Potosí" },
			{
				name: "description",
				content:
					"Explora casas, departamentos y locales en alquiler en Potosí. Filtra por zona, precio y habitaciones.",
			},
		],
	}),
	component: CatalogoPage,
});

function CatalogoPage() {
	const search = Route.useSearch();
	const navigate = useNavigate();
	const [cargando, setCargando] = useState(true);
	const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

	useEffect(() => {
		const id = window.setTimeout(() => setCargando(false), 620);
		return () => window.clearTimeout(id);
	}, []);

	const resultados = useMemo(
		() => filtrarYOrdenar(inmuebles, search),
		[search],
	);
	const activos = filtrosActivos(search);
	const vista: VistaCatalogo = search.vista ?? "grilla";
	const orden: OrdenCatalogo = search.orden ?? "relevancia";
	const pagina = search.pagina ?? 1;

	const totalPaginas = Math.max(1, Math.ceil(resultados.length / POR_PAGINA));
	const paginaActual = Math.min(pagina, totalPaginas);
	const visibles = resultados.slice(
		(paginaActual - 1) * POR_PAGINA,
		paginaActual * POR_PAGINA,
	);

	function setVista(nueva: VistaCatalogo) {
		void navigate({
			to: "/propiedades",
			search: (prev) => ({ ...prev, vista: nueva }),
			replace: true,
		});
	}

	function setOrden(nueva: OrdenCatalogo) {
		void navigate({
			to: "/propiedades",
			search: (prev) => ({ ...prev, orden: nueva, pagina: 1 }),
			replace: true,
		});
	}

	function quitarFiltro(filtro: {
		clave: keyof typeof search;
		valor?: string;
	}) {
		void navigate({
			to: "/propiedades",
			search: (prev) => {
				const siguiente = { ...prev };
				if (filtro.clave === "zona" && filtro.valor) {
					const restantes = (prev.zona ?? []).filter((z) => z !== filtro.valor);
					if (restantes.length > 0) siguiente.zona = restantes;
					else delete siguiente.zona;
				} else {
					delete siguiente[filtro.clave];
				}
				siguiente.pagina = 1;
				return siguiente;
			},
			replace: true,
		});
	}

	function irAPagina(nueva: number) {
		void navigate({
			to: "/propiedades",
			search: (prev) => ({ ...prev, pagina: nueva }),
		});
		if (typeof window !== "undefined") {
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	}

	return (
		<PublicLayout>
			<div className="container-page pb-16">
				<Breadcrumb className="pt-2">
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="/">Inicio</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>Propiedades</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
							Propiedades en alquiler
						</h1>
						<p className="mt-2 text-sm text-muted-foreground">
							{cargando
								? "Cargando inmuebles…"
								: `${formatNumber(resultados.length)} inmueble${resultados.length === 1 ? "" : "s"} encontrado${resultados.length === 1 ? "" : "s"} en Potosí.`}
						</p>
					</div>
				</div>

				<div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr]">
					<aside className="hidden lg:block">
						<div className="sticky top-28 rounded-xl border border-border bg-card p-6">
							<h2 className="mb-5 font-display text-base font-bold text-foreground">
								Filtros
							</h2>
							<PropertyFilters search={search} />
						</div>
					</aside>

					<div>
						<div className="flex flex-wrap items-center gap-3">
							<Sheet open={filtrosAbiertos} onOpenChange={setFiltrosAbiertos}>
								<SheetTrigger asChild>
									<Button variant="outline" className="lg:hidden">
										<SlidersHorizontal aria-hidden="true" />
										Filtros
										{activos.length > 0 ? (
											<span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
												{activos.length}
											</span>
										) : null}
									</Button>
								</SheetTrigger>
								<SheetContent
									side="left"
									className="w-[90vw] max-w-sm overflow-y-auto"
								>
									<SheetHeader>
										<SheetTitle>Filtros</SheetTitle>
									</SheetHeader>
									<div className="px-4 pb-6">
										<PropertyFilters
											search={search}
											onApplied={() => setFiltrosAbiertos(false)}
										/>
									</div>
								</SheetContent>
							</Sheet>

							<div className="ml-auto flex items-center gap-2">
								<Select
									value={orden}
									onValueChange={(v) => setOrden(v as OrdenCatalogo)}
								>
									<SelectTrigger
										className="w-[190px]"
										aria-label="Ordenar resultados"
									>
										<ArrowUpDown
											className="size-4 text-muted-foreground"
											aria-hidden="true"
										/>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{ORDEN_OPCIONES.map((opcion) => (
											<SelectItem key={opcion.value} value={opcion.value}>
												{opcion.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								<div
									role="toolbar"
									aria-label="Vista de resultados"
									className="flex items-center rounded-lg border border-border bg-card p-0.5"
								>
									<Button
										variant={vista === "grilla" ? "secondary" : "ghost"}
										size="icon-sm"
										onClick={() => setVista("grilla")}
										aria-pressed={vista === "grilla"}
										aria-label="Vista en grilla"
									>
										<LayoutGrid aria-hidden="true" />
									</Button>
									<Button
										variant={vista === "lista" ? "secondary" : "ghost"}
										size="icon-sm"
										onClick={() => setVista("lista")}
										aria-pressed={vista === "lista"}
										aria-label="Vista en lista"
									>
										<List aria-hidden="true" />
									</Button>
								</div>
							</div>
						</div>

						{activos.length > 0 ? (
							<div className="mt-4 flex flex-wrap items-center gap-2">
								<span className="text-xs font-medium text-muted-foreground">
									Filtros activos:
								</span>
								{activos.map((filtro) => (
									<button
										key={`${filtro.clave}-${filtro.valor ?? filtro.etiqueta}`}
										type="button"
										onClick={() => quitarFiltro(filtro)}
										className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-blue-soft px-3 py-1 text-xs font-semibold text-blue-deep transition-colors duration-150 ease-out hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
									>
										{filtro.etiqueta}
										<X className="size-3" aria-hidden="true" />
										<span className="sr-only">Quitar filtro</span>
									</button>
								))}
								<Button
									variant="ghost"
									size="sm"
									className="text-muted-foreground"
									onClick={() =>
										void navigate({
											to: "/propiedades",
											search: {},
											replace: true,
										})
									}
								>
									Limpiar todo
								</Button>
							</div>
						) : null}

						<div className="mt-6">
							{cargando ? (
								vista === "grilla" ? (
									<PropertyGridSkeleton items={6} />
								) : (
									<div className="flex flex-col gap-5">
										{Array.from({ length: 4 }).map((_, i) => (
											// biome-ignore lint/suspicious/noArrayIndexKey: esqueletos estáticos
											<PropertyCardSkeleton key={i} variant="list" />
										))}
									</div>
								)
							) : visibles.length === 0 ? (
								<EmptyState
									icon={
										<SlidersHorizontal className="size-6" aria-hidden="true" />
									}
									title="No encontramos inmuebles con esos filtros"
									description="Prueba ampliando el rango de precio, cambiando de zona o quitando alguna condición de búsqueda."
									action={
										<Button
											variant="default"
											onClick={() =>
												void navigate({
													to: "/propiedades",
													search: {},
													replace: true,
												})
											}
										>
											Limpiar filtros
										</Button>
									}
								/>
							) : vista === "grilla" ? (
								<div
									className={cn(
										"grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3",
									)}
								>
									{visibles.map((inmueble) => (
										<PropertyCard key={inmueble.id} inmueble={inmueble} />
									))}
								</div>
							) : (
								<div className="flex flex-col gap-5">
									{visibles.map((inmueble) => (
										<PropertyCard
											key={inmueble.id}
											inmueble={inmueble}
											variant="list"
										/>
									))}
								</div>
							)}
						</div>

						{!cargando && resultados.length > POR_PAGINA ? (
							<Pagination className="mt-10">
								<PaginationContent>
									<PaginationItem>
										<PaginationPrevious
											href="#"
											onClick={(e) => {
												e.preventDefault();
												if (paginaActual > 1) irAPagina(paginaActual - 1);
											}}
											aria-disabled={paginaActual === 1}
											className={cn(
												paginaActual === 1 && "pointer-events-none opacity-50",
											)}
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
														irAPagina(numero);
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
												if (paginaActual < totalPaginas)
													irAPagina(paginaActual + 1);
											}}
											aria-disabled={paginaActual === totalPaginas}
											className={cn(
												paginaActual === totalPaginas &&
													"pointer-events-none opacity-50",
											)}
										/>
									</PaginationItem>
								</PaginationContent>
							</Pagination>
						) : null}
					</div>
				</div>
			</div>
		</PublicLayout>
	);
}
