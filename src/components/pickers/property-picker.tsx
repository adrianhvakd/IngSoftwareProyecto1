import { cn } from "cn";
import { Check, ImageOff, MapPin, Maximize2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { SmartImage } from "@/components/common/smart-image";
import { inmuebleTone, StatusBadge } from "@/components/common/status-badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import type { Inmueble } from "@/data/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { TIPOS_INMUEBLE, ZONAS } from "@/lib/catalog";
import { formatBsMes } from "@/lib/format";

interface PropertyPickerProps {
	inmuebles: Inmueble[];
	value: string | null;
	onChange: (id: string | null) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
	/** Permite elegir inmuebles no disponibles (p. ej. en edición). */
	incluirNoDisponibles?: boolean;
}

export function PropertyPicker({
	inmuebles,
	value,
	onChange,
	placeholder = "Elegir inmueble…",
	className,
	disabled,
	incluirNoDisponibles = false,
}: PropertyPickerProps) {
	const isMobile = useIsMobile();
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [tipo, setTipo] = useState<string>("todos");
	const [zona, setZona] = useState<string>("todas");

	const seleccionado = inmuebles.find((i) => i.id === value) ?? null;

	const disponibles = useMemo(
		() =>
			inmuebles.filter(
				(i) => incluirNoDisponibles || i.estado === "Disponible",
			),
		[inmuebles, incluirNoDisponibles],
	);

	const filtrados = useMemo(() => {
		const q = query.trim().toLowerCase();
		return disponibles.filter((i) => {
			if (tipo !== "todos" && i.tipo !== tipo) return false;
			if (zona !== "todas" && i.zona !== zona) return false;
			if (q) {
				const heno =
					`${i.titulo} ${i.zona} ${i.direccion} ${i.codigo}`.toLowerCase();
				if (!heno.includes(q)) return false;
			}
			return true;
		});
	}, [disponibles, tipo, zona, query]);

	function elegir(id: string) {
		onChange(id);
		setOpen(false);
	}

	const grilla = (
		<>
			<div className="flex flex-col gap-3 border-b border-border p-4">
				<div className="relative">
					<Search
						className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
						aria-hidden="true"
					/>
					<Input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Buscar por título, zona o código…"
						className="pl-9"
						aria-label="Buscar inmueble"
					/>
				</div>
				<div className="flex flex-wrap gap-1.5">
					<button
						type="button"
						onClick={() => setTipo("todos")}
						aria-pressed={tipo === "todos"}
						className={cn(
							"rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150 ease-out",
							tipo === "todos"
								? "border-primary bg-primary text-primary-foreground"
								: "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
						)}
					>
						Todos
					</button>
					{TIPOS_INMUEBLE.map((t) => (
						<button
							key={t}
							type="button"
							onClick={() => setTipo(t)}
							aria-pressed={tipo === t}
							className={cn(
								"rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150 ease-out",
								tipo === t
									? "border-primary bg-primary text-primary-foreground"
									: "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
							)}
						>
							{t}
						</button>
					))}
				</div>
				<div className="flex gap-1.5 overflow-x-auto pb-1">
					<button
						type="button"
						onClick={() => setZona("todas")}
						aria-pressed={zona === "todas"}
						className={cn(
							"shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150 ease-out",
							zona === "todas"
								? "border-primary bg-blue-soft text-blue-deep"
								: "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
						)}
					>
						Todas las zonas
					</button>
					{ZONAS.map((z) => (
						<button
							key={z}
							type="button"
							onClick={() => setZona(z)}
							aria-pressed={zona === z}
							className={cn(
								"shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150 ease-out",
								zona === z
									? "border-primary bg-blue-soft text-blue-deep"
									: "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
							)}
						>
							{z}
						</button>
					))}
				</div>
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto p-4">
				{filtrados.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground">
						<ImageOff
							className="mb-3 size-8 text-muted-foreground/60"
							aria-hidden="true"
						/>
						No hay inmuebles disponibles con estos filtros.
					</div>
				) : (
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{filtrados.map((inmueble) => {
							const activo = inmueble.id === value;
							return (
								<button
									key={inmueble.id}
									type="button"
									onClick={() => elegir(inmueble.id)}
									aria-pressed={activo}
									className={cn(
										"group relative overflow-hidden rounded-xl border bg-card text-left transition-[border-color,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
										activo
											? "border-primary shadow-[var(--shadow-lift)] ring-1 ring-primary"
											: "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-soft)]",
									)}
								>
									<div className="relative">
										<SmartImage
											src={inmueble.imagenes[0]}
											alt={inmueble.titulo}
											aspectRatio="16 / 10"
											className="w-full"
										/>
										<div className="absolute top-2 left-2 flex gap-1.5">
											<StatusBadge tone={inmuebleTone[inmueble.estado]}>
												{inmueble.estado}
											</StatusBadge>
										</div>
										{activo ? (
											<span className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
												<Check className="size-3.5" aria-hidden="true" />
											</span>
										) : null}
									</div>
									<div className="p-3">
										<p className="text-[11px] font-semibold tracking-wide text-brand-text uppercase">
											{inmueble.tipo} · {inmueble.codigo}
										</p>
										<h4 className="mt-0.5 line-clamp-2 text-sm font-bold text-foreground">
											{inmueble.titulo}
										</h4>
										<p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
											<MapPin className="size-3 shrink-0" aria-hidden="true" />
											<span className="line-clamp-1">{inmueble.zona}</span>
										</p>
										<div className="mt-2 flex items-center justify-between gap-2">
											<span className="font-display text-sm font-bold tabular text-foreground">
												{formatBsMes(inmueble.precio)}
											</span>
											<span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
												<Maximize2 className="size-3" aria-hidden="true" />
												<span className="tabular">{inmueble.m2} m²</span>
											</span>
										</div>
									</div>
								</button>
							);
						})}
					</div>
				)}
			</div>
		</>
	);

	const disparadorContenido = seleccionado ? (
		<span className="flex w-full items-center gap-3">
			<SmartImage
				src={seleccionado.imagenes[0]}
				alt={seleccionado.titulo}
				aspectRatio="4 / 3"
				className="size-12 shrink-0 rounded-md"
			/>
			<span className="grid flex-1 leading-tight">
				<span className="truncate text-sm font-semibold">
					{seleccionado.titulo}
				</span>
				<span className="truncate text-xs text-muted-foreground">
					{seleccionado.zona} · {formatBsMes(seleccionado.precio)}
				</span>
			</span>
			<span className="text-xs font-semibold text-brand-text">Cambiar</span>
		</span>
	) : (
		<span className="flex w-full items-center gap-2">
			<MapPin className="size-4 shrink-0 text-brand-text" aria-hidden="true" />
			<span className="flex-1 truncate text-muted-foreground">
				{placeholder}
			</span>
		</span>
	);

	return (
		<>
			<button
				type="button"
				disabled={disabled}
				aria-haspopup="dialog"
				aria-expanded={open}
				onClick={() => setOpen(true)}
				className={cn(
					"w-full rounded-lg border border-input bg-card text-left transition-colors duration-150 ease-out hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50",
					seleccionado ? "p-2.5 pr-3" : "flex h-9 items-center px-3 text-sm",
					className,
				)}
			>
				{disparadorContenido}
			</button>

			{isMobile ? (
				<Sheet open={open} onOpenChange={setOpen}>
					<SheetContent
						side="bottom"
						className="flex max-h-[88vh] flex-col rounded-t-2xl p-0"
					>
						<SheetHeader className="border-b border-border p-4 text-left">
							<SheetTitle>Elegir inmueble</SheetTitle>
							<SheetDescription>
								Solo se muestran inmuebles disponibles.
							</SheetDescription>
						</SheetHeader>
						<div className="flex min-h-0 flex-1 flex-col">{grilla}</div>
					</SheetContent>
				</Sheet>
			) : (
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogContent className="flex max-h-[88vh] w-full flex-col gap-0 p-0 sm:max-w-4xl">
						<DialogHeader className="border-b border-border p-5 text-left">
							<DialogTitle>Elegir inmueble</DialogTitle>
							<DialogDescription>
								Selecciona un inmueble disponible para el alquiler.
							</DialogDescription>
						</DialogHeader>
						<div className="flex min-h-0 flex-1 flex-col">{grilla}</div>
					</DialogContent>
				</Dialog>
			)}
		</>
	);
}
