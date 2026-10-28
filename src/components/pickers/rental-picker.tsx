import { cn } from "cn";
import {
	Check,
	MapPin,
	ReceiptText,
	Search,
	TriangleAlert,
} from "lucide-react";
import { useMemo, useState } from "react";
import { SmartImage } from "@/components/common/smart-image";
import { cuotaTone, StatusBadge } from "@/components/common/status-badge";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { formatBs, formatFecha } from "@/lib/format";
import type { AlquilerDetalleUI } from "@/types/models";

interface RentalPickerProps {
	alquileres: AlquilerDetalleUI[];
	value: string | null;
	onChange: (id: string | null) => void;
	placeholder?: string;
	className?: string;
	disabled?: boolean;
}

const ESTADOS_CUOTA = ["En mora", "Por vencer", "Al día"] as const;

export function RentalPicker({
	alquileres,
	value,
	onChange,
	placeholder = "Elegir alquiler…",
	className,
	disabled,
}: RentalPickerProps) {
	const isMobile = useIsMobile();
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [estado, setEstado] = useState<string>("todos");

	const seleccionado = alquileres.find((a) => a.id === value) ?? null;

	const filtrados = useMemo(() => {
		const q = query.trim().toLowerCase();
		return alquileres.filter((a) => {
			const estadoCuota = a.cuotaActual?.estado ?? "";
			if (estado !== "todos" && estadoCuota !== estado) return false;
			if (q) {
				const heno =
					`${a.inmueble.titulo} ${a.inmueble.zona} ${a.cliente.nombre} ${a.codigo}`.toLowerCase();
				if (!heno.includes(q)) return false;
			}
			return true;
		});
	}, [alquileres, estado, query]);

	function elegir(id: string) {
		onChange(id);
		setOpen(false);
	}

	const lista = (
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
						placeholder="Buscar por inmueble, zona o cliente…"
						className="pl-9"
						aria-label="Buscar alquiler"
					/>
				</div>
				<div className="flex flex-wrap gap-1.5">
					<button
						type="button"
						onClick={() => setEstado("todos")}
						aria-pressed={estado === "todos"}
						className={cn(
							"rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150 ease-out",
							estado === "todos"
								? "border-primary bg-primary text-primary-foreground"
								: "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
						)}
					>
						Todos
					</button>
					{ESTADOS_CUOTA.map((e) => (
						<button
							key={e}
							type="button"
							onClick={() => setEstado(e)}
							aria-pressed={estado === e}
							className={cn(
								"rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150 ease-out",
								estado === e
									? "border-primary bg-primary text-primary-foreground"
									: "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
							)}
						>
							{e}
						</button>
					))}
				</div>
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto p-4">
				{filtrados.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground">
						<ReceiptText
							className="mb-3 size-8 text-muted-foreground/60"
							aria-hidden="true"
						/>
						No hay alquileres con estos filtros.
					</div>
				) : (
					<div className="flex flex-col gap-3">
						{filtrados.map((alquiler) => {
							const activo = alquiler.id === value;
							const cuota = alquiler.cuotaActual;
							const enMora = cuota?.estado === "En mora";
							return (
								<button
									key={alquiler.id}
									type="button"
									onClick={() => elegir(alquiler.id)}
									aria-pressed={activo}
									className={cn(
										"flex items-stretch gap-3 overflow-hidden rounded-xl border bg-card text-left transition-[border-color,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
										activo
											? "border-primary shadow-[var(--shadow-lift)] ring-1 ring-primary"
											: "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-soft)]",
									)}
								>
									<SmartImage
										src={alquiler.inmueble.imagenes[0]}
										alt={alquiler.inmueble.titulo}
										aspectRatio="4 / 3"
										className="hidden w-32 shrink-0 sm:block sm:h-auto"
									/>
									<span className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
										<span className="flex items-start justify-between gap-2">
											<span className="min-w-0">
												<span className="block text-[11px] font-semibold tracking-wide text-brand-text uppercase">
													{alquiler.codigo}
												</span>
												<span className="mt-0.5 block line-clamp-2 text-sm font-bold text-foreground">
													{alquiler.inmueble.titulo}
												</span>
											</span>
											{activo ? (
												<span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
													<Check className="size-3.5" aria-hidden="true" />
												</span>
											) : null}
										</span>
										<span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
											<span className="inline-flex items-center gap-1">
												<MapPin className="size-3" aria-hidden="true" />
												{alquiler.inmueble.zona}
											</span>
											<span className="truncate">
												{alquiler.cliente.nombre}
											</span>
										</span>
										<span className="mt-0.5 flex flex-wrap items-center justify-between gap-2">
											<span className="font-display text-sm font-bold tabular text-foreground">
												{formatBs(alquiler.montoMensual)} / mes
											</span>
											{cuota ? (
												<StatusBadge tone={cuotaTone[cuota.estado]}>
													{enMora ? (
														<TriangleAlert
															className="size-3"
															aria-hidden="true"
														/>
													) : null}
													{cuota.estado}
												</StatusBadge>
											) : null}
										</span>
										{cuota ? (
											<span className="text-xs text-muted-foreground">
												Próxima cuota #{cuota.numeroCuota} ·{" "}
												{formatFecha(cuota.fechaVencimiento)}
											</span>
										) : null}
									</span>
								</button>
							);
						})}
					</div>
				)}
			</div>
		</>
	);

	const resumen = seleccionado ? (
		<span className="flex w-full items-center gap-3">
			<SmartImage
				src={seleccionado.inmueble.imagenes[0]}
				alt={seleccionado.inmueble.titulo}
				aspectRatio="4 / 3"
				className="size-12 shrink-0 rounded-md"
			/>
			<span className="grid flex-1 leading-tight">
				<span className="truncate text-sm font-semibold">
					{seleccionado.inmueble.titulo}
				</span>
				<span className="truncate text-xs text-muted-foreground">
					{seleccionado.cliente.nombre} · {formatBs(seleccionado.montoMensual)}{" "}
					/ mes
				</span>
			</span>
			<span className="text-xs font-semibold text-brand-text">Cambiar</span>
		</span>
	) : (
		<span className="flex w-full items-center gap-2">
			<ReceiptText
				className="size-4 shrink-0 text-brand-text"
				aria-hidden="true"
			/>
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
				{resumen}
			</button>

			{isMobile ? (
				<Sheet open={open} onOpenChange={setOpen}>
					<SheetContent
						side="bottom"
						className="flex max-h-[88vh] flex-col rounded-t-2xl p-0"
					>
						<SheetHeader className="border-b border-border p-4 text-left">
							<SheetTitle>Elegir alquiler</SheetTitle>
							<SheetDescription>
								Alquileres asignados a tu cartera.
							</SheetDescription>
						</SheetHeader>
						<div className="flex min-h-0 flex-1 flex-col">{lista}</div>
					</SheetContent>
				</Sheet>
			) : (
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogContent className="flex max-h-[88vh] w-full flex-col gap-0 p-0 sm:max-w-2xl">
						<DialogHeader className="border-b border-border p-5 text-left">
							<DialogTitle>Elegir alquiler</DialogTitle>
							<DialogDescription>
								Selecciona el alquiler sobre el que vas a registrar el pago.
							</DialogDescription>
						</DialogHeader>
						<div className="flex min-h-0 flex-1 flex-col">{lista}</div>
					</DialogContent>
				</Dialog>
			)}
		</>
	);
}
