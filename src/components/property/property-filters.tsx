import { useNavigate } from "@tanstack/react-router";
import { cn } from "cn";
import { RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { CatalogSearch } from "@/lib/catalog";
import { TIPOS_INMUEBLE, ZONAS } from "@/lib/catalog";

interface PropertyFiltersProps {
	search: CatalogSearch;
	className?: string;
	/** Se llama al aplicar (para cerrar el Sheet en móvil). */
	onApplied?: () => void;
}

export function PropertyFilters({
	search,
	className,
	onApplied,
}: PropertyFiltersProps) {
	const navigate = useNavigate();

	function actualizar(patch: Partial<CatalogSearch>) {
		void navigate({
			to: "/propiedades",
			search: (prev) => ({ ...prev, ...patch, pagina: 1 }),
			replace: true,
		});
	}

	function limpiar() {
		void navigate({ to: "/propiedades", search: {}, replace: true });
		onApplied?.();
	}

	return (
		<div className={cn("flex flex-col gap-6", className)}>
			<div className="grid gap-2">
				<Label htmlFor="filtro-q">Buscar</Label>
				<div className="relative">
					<Search
						className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
						aria-hidden="true"
					/>
					<Input
						id="filtro-q"
						value={search.q ?? ""}
						onChange={(e) => actualizar({ q: e.target.value || undefined })}
						placeholder="Título, zona o código"
						className="pl-9"
					/>
				</div>
			</div>

			<Separator />

			<fieldset className="grid gap-3">
				<legend className="text-sm font-semibold text-foreground">
					Tipo de inmueble
				</legend>
				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						onClick={() => actualizar({ tipo: undefined })}
						aria-pressed={!search.tipo}
						className={cn(
							"rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
							!search.tipo
								? "border-primary bg-primary text-primary-foreground"
								: "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
						)}
					>
						Todos
					</button>
					{TIPOS_INMUEBLE.map((tipo) => {
						const activo = search.tipo === tipo;
						return (
							<button
								key={tipo}
								type="button"
								onClick={() => actualizar({ tipo })}
								aria-pressed={activo}
								className={cn(
									"rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
									activo
										? "border-primary bg-primary text-primary-foreground"
										: "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
								)}
							>
								{tipo}
							</button>
						);
					})}
				</div>
			</fieldset>

			<Separator />

			<div className="grid gap-2">
				<Label htmlFor="filtro-zona">Zona</Label>
				<Select
					value={search.zona ?? "todas"}
					onValueChange={(valor) =>
						actualizar({ zona: valor === "todas" ? undefined : valor })
					}
				>
					<SelectTrigger id="filtro-zona" className="w-full">
						<SelectValue placeholder="Todas las zonas" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="todas">Todas las zonas</SelectItem>
						{ZONAS.map((zona) => (
							<SelectItem key={zona} value={zona}>
								{zona}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<Separator />

			<fieldset className="grid gap-3">
				<legend className="text-sm font-semibold text-foreground">
					Precio mensual (Bs)
				</legend>
				<div className="grid grid-cols-2 gap-3">
					<div className="grid gap-1.5">
						<Label
							htmlFor="filtro-min"
							className="text-xs text-muted-foreground"
						>
							Mínimo
						</Label>
						<Input
							id="filtro-min"
							type="number"
							inputMode="numeric"
							min={0}
							step={100}
							value={search.precioMin ?? ""}
							onChange={(e) =>
								actualizar({
									precioMin: e.target.value
										? Number(e.target.value)
										: undefined,
								})
							}
							placeholder="0"
							className="tabular"
						/>
					</div>
					<div className="grid gap-1.5">
						<Label
							htmlFor="filtro-max"
							className="text-xs text-muted-foreground"
						>
							Máximo
						</Label>
						<Input
							id="filtro-max"
							type="number"
							inputMode="numeric"
							min={0}
							step={100}
							value={search.precioMax ?? ""}
							onChange={(e) =>
								actualizar({
									precioMax: e.target.value
										? Number(e.target.value)
										: undefined,
								})
							}
							placeholder="Sin límite"
							className="tabular"
						/>
					</div>
				</div>
			</fieldset>

			<Separator />

			<fieldset className="grid gap-3">
				<legend className="text-sm font-semibold text-foreground">
					Habitaciones mínimas
				</legend>
				<ToggleGroup
					type="single"
					value={search.habitaciones ? String(search.habitaciones) : ""}
					onValueChange={(valor) =>
						actualizar({ habitaciones: valor ? Number(valor) : undefined })
					}
					variant="outline"
					className="justify-start"
				>
					{[1, 2, 3, 4].map((n) => (
						<ToggleGroupItem
							key={n}
							value={String(n)}
							aria-label={`${n} o más habitaciones`}
						>
							{n}+
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			</fieldset>

			<Separator />

			<div className="flex flex-col gap-2">
				<Button variant="outline" onClick={limpiar}>
					<RotateCcw aria-hidden="true" />
					Limpiar filtros
				</Button>
				{onApplied ? (
					<Button variant="default" onClick={onApplied} className="lg:hidden">
						Ver resultados
					</Button>
				) : null}
			</div>
		</div>
	);
}
