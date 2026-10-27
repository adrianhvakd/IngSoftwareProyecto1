import { cn } from "cn";
import { Check, MapPin, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { getZonasConConteo } from "@/data";
import { useIsMobile } from "@/hooks/use-mobile";
import { SECTORES, ZONAS_POPULARES, type Zona } from "@/lib/catalog";

interface ZonePickerProps {
	mode?: "single" | "multiple";
	value: string[];
	onChange: (value: string[]) => void;
	placeholder?: string;
	id?: string;
	className?: string;
	disabled?: boolean;
	/** Oculta los chips resumen (útil cuando el consumidor los muestra aparte). */
	hideChips?: boolean;
}

function DisparadorContenido({
	value,
	mode,
	zonas,
	query,
	setQuery,
	toggle,
	limpiar,
}: {
	value: string[];
	mode: "single" | "multiple";
	zonas: { zona: string; total: number }[];
	query: string;
	setQuery: (v: string) => void;
	toggle: (zona: string) => void;
	limpiar: () => void;
}) {
	const normalizado = query.trim().toLowerCase();
	const conteo = new Map(zonas.map((z) => [z.zona, z.total]));
	const grupos = SECTORES.map((grupo) => ({
		sector: grupo.sector,
		zonas: grupo.zonas.filter(
			(z) => normalizado === "" || z.toLowerCase().includes(normalizado),
		),
	})).filter((g) => g.zonas.length > 0);

	return (
		<div className="flex max-h-[60vh] flex-col">
			<div className="relative shrink-0 p-3 pb-2">
				<Search
					className="pointer-events-none absolute top-1/2 left-5.5 size-4 -translate-y-1/2 text-muted-foreground"
					aria-hidden="true"
				/>
				<Input
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Buscar zona…"
					className="pl-9"
					aria-label="Buscar zona"
				/>
			</div>

			{ZONAS_POPULARES.length > 0 && normalizado === "" ? (
				<div className="shrink-0 px-3 pb-2">
					<p className="mb-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
						Zonas populares
					</p>
					<div className="flex flex-wrap gap-1.5">
						{ZONAS_POPULARES.map((zona) => {
							const activa = value.includes(zona);
							return (
								<button
									key={zona}
									type="button"
									onClick={() => toggle(zona)}
									aria-pressed={activa}
									className={cn(
										"rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150 ease-out",
										activa
											? "border-primary bg-primary text-primary-foreground"
											: "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
									)}
								>
									{zona}
								</button>
							);
						})}
					</div>
				</div>
			) : null}

			<div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2">
				{value.length > 0 ? (
					<button
						type="button"
						onClick={limpiar}
						className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
					>
						<X className="size-4" aria-hidden="true" />
						{mode === "single" ? "Todas las zonas" : "Quitar todas"}
					</button>
				) : null}

				{grupos.length === 0 ? (
					<p className="px-3 py-6 text-center text-sm text-muted-foreground">
						Sin zonas que coincidan.
					</p>
				) : (
					grupos.map((grupo) => (
						<div key={grupo.sector} className="mt-1">
							<p className="px-3 py-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
								{grupo.sector}
							</p>
							{grupo.zonas.map((zona) => {
								const seleccionada = value.includes(zona);
								return (
									<button
										key={zona}
										type="button"
										onClick={() => toggle(zona)}
										aria-pressed={seleccionada}
										className={cn(
											"flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors duration-150 ease-out",
											seleccionada
												? "bg-accent text-accent-foreground"
												: "text-foreground hover:bg-accent/60",
										)}
									>
										<span
											className={cn(
												"grid size-4 shrink-0 place-items-center rounded border",
												seleccionada
													? "border-primary bg-primary text-primary-foreground"
													: "border-border",
											)}
										>
											{seleccionada ? (
												<Check className="size-3" aria-hidden="true" />
											) : null}
										</span>
										<span className="flex-1">{zona}</span>
										<span className="tabular text-xs text-muted-foreground">
											{conteo.get(zona) ?? 0}
										</span>
									</button>
								);
							})}
						</div>
					))
				)}
			</div>
		</div>
	);
}

export function ZonePicker({
	mode = "single",
	value,
	onChange,
	placeholder,
	id,
	className,
	disabled,
	hideChips,
}: ZonePickerProps) {
	const isMobile = useIsMobile();
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const zonas = useMemo(() => getZonasConConteo(), []);

	function toggle(zona: string) {
		if (mode === "single") {
			onChange([zona]);
			setOpen(false);
			setQuery("");
			return;
		}
		onChange(
			value.includes(zona) ? value.filter((z) => z !== zona) : [...value, zona],
		);
	}

	function limpiar() {
		onChange([]);
		if (mode === "single") setOpen(false);
		setQuery("");
	}

	const etiqueta =
		value.length === 0
			? (placeholder ?? "Todas las zonas")
			: mode === "single"
				? (value[0] as Zona)
				: `${value.length} zona${value.length > 1 ? "s" : ""}`;

	const disparador = (
		<button
			type="button"
			id={id}
			disabled={disabled}
			aria-haspopup="dialog"
			aria-expanded={open}
			className={cn(
				"flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-card px-3 text-left text-sm text-foreground transition-colors duration-150 ease-out hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
		>
			<MapPin className="size-4 shrink-0 text-brand-text" aria-hidden="true" />
			<span
				className={cn(
					"flex-1 truncate",
					value.length === 0 && "text-muted-foreground",
				)}
			>
				{etiqueta}
			</span>
			{value.length > 0 ? (
				<span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
					{value.length}
				</span>
			) : null}
		</button>
	);

	const contenido = (
		<DisparadorContenido
			value={value}
			mode={mode}
			zonas={zonas}
			query={query}
			setQuery={setQuery}
			toggle={toggle}
			limpiar={limpiar}
		/>
	);

	return (
		<div className="w-full">
			{isMobile ? (
				<Sheet open={open} onOpenChange={setOpen}>
					<SheetTrigger asChild>{disparador}</SheetTrigger>
					<SheetContent
						side="bottom"
						className="max-h-[85vh] rounded-t-2xl p-0"
					>
						<SheetHeader className="border-b border-border p-4">
							<SheetTitle>Elegir zona</SheetTitle>
						</SheetHeader>
						<div className="px-2 pb-6">{contenido}</div>
					</SheetContent>
				</Sheet>
			) : (
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>{disparador}</PopoverTrigger>
					<PopoverContent align="start" className="w-[320px] p-0">
						{contenido}
					</PopoverContent>
				</Popover>
			)}

			{mode === "multiple" && !hideChips && value.length > 0 ? (
				<div className="mt-2 flex flex-wrap gap-1.5">
					{value.map((zona) => (
						<span
							key={zona}
							className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-blue-soft px-2.5 py-1 text-xs font-semibold text-blue-deep"
						>
							{zona}
							<button
								type="button"
								onClick={() => onChange(value.filter((z) => z !== zona))}
								className="grid size-3.5 place-items-center rounded-full transition-colors hover:bg-primary/20"
								aria-label={`Quitar zona ${zona}`}
							>
								<X className="size-3" aria-hidden="true" />
							</button>
						</span>
					))}
				</div>
			) : null}
		</div>
	);
}
