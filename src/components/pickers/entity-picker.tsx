import { cn } from "cn";
import { Check, ChevronsUpDown, Plus, Table2, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { iniciales } from "@/lib/format";

export interface EntityOption {
	id: string;
	nombre: string;
	avatarUrl?: string;
	secundario?: string;
}

export interface EntityPickerCtx {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSelect: (id: string) => void;
}

interface EntityPickerProps {
	items: EntityOption[];
	value: string | null;
	onChange: (id: string | null) => void;
	placeholder?: string;
	searchPlaceholder?: string;
	emptyLabel?: string;
	/** Etiqueta del item seleccionado en la tarjeta resumen. */
	resumenBadge?: string;
	/** Render del Dialog grande "Ver todos en tabla". */
	tabla?: (ctx: EntityPickerCtx) => ReactNode;
	/** Render del Sheet "+ Nuevo". */
	nuevo?: (ctx: EntityPickerCtx) => ReactNode;
	nuevoLabel?: string;
	className?: string;
	disabled?: boolean;
}

function FilaEntidad({
	item,
	seleccionado,
}: {
	item: EntityOption;
	seleccionado: boolean;
}) {
	return (
		<>
			<Avatar className="size-8">
				{item.avatarUrl ? (
					<AvatarImage src={item.avatarUrl} alt={item.nombre} />
				) : null}
				<AvatarFallback className="bg-blue-soft text-xs font-semibold text-brand-text">
					{iniciales(item.nombre)}
				</AvatarFallback>
			</Avatar>
			<span className="grid flex-1 text-left leading-tight">
				<span className="truncate text-sm font-medium">{item.nombre}</span>
				{item.secundario ? (
					<span className="truncate text-xs text-muted-foreground">
						{item.secundario}
					</span>
				) : null}
			</span>
			<Check
				className={cn(
					"size-4 text-primary",
					seleccionado ? "opacity-100" : "opacity-0",
				)}
				aria-hidden="true"
			/>
		</>
	);
}

export function EntityPicker({
	items,
	value,
	onChange,
	placeholder = "Buscar y seleccionar…",
	searchPlaceholder = "Buscar por nombre o dato…",
	emptyLabel = "Sin resultados.",
	resumenBadge,
	tabla,
	nuevo,
	nuevoLabel = "Nuevo",
	className,
	disabled,
}: EntityPickerProps) {
	const isMobile = useIsMobile();
	const [open, setOpen] = useState(false);
	const [tablaOpen, setTablaOpen] = useState(false);
	const [nuevoOpen, setNuevoOpen] = useState(false);
	const seleccionado = items.find((i) => i.id === value) ?? null;

	function elegir(id: string) {
		onChange(id);
		setOpen(false);
		setTablaOpen(false);
	}

	const contenido = (
		<Command className="max-h-[60vh]">
			<CommandInput placeholder={searchPlaceholder} />
			<CommandList>
				<CommandEmpty>{emptyLabel}</CommandEmpty>
				<CommandGroup>
					{items.map((item) => (
						<CommandItem
							key={item.id}
							value={`${item.nombre} ${item.secundario ?? ""}`}
							onSelect={() => elegir(item.id)}
							className="gap-2.5"
						>
							<FilaEntidad item={item} seleccionado={item.id === value} />
						</CommandItem>
					))}
				</CommandGroup>
			</CommandList>
			{tabla || nuevo ? (
				<div className="grid gap-2 border-t border-border p-2 sm:grid-cols-2">
					{tabla ? (
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setOpen(false);
								setTablaOpen(true);
							}}
						>
							<Table2 aria-hidden="true" />
							Ver todos en tabla
						</Button>
					) : null}
					{nuevo ? (
						<Button
							variant="secondary"
							size="sm"
							onClick={() => {
								setOpen(false);
								setNuevoOpen(true);
							}}
						>
							<Plus aria-hidden="true" />
							{nuevoLabel}
						</Button>
					) : null}
				</div>
			) : null}
		</Command>
	);

	const disparador = seleccionado ? (
		<button
			type="button"
			disabled={disabled}
			aria-haspopup="dialog"
			aria-expanded={open}
			className={cn(
				"flex w-full items-center gap-3 rounded-lg border border-input bg-card p-2.5 pr-3 text-left transition-colors duration-150 ease-out hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
		>
			<Avatar className="size-9">
				{seleccionado.avatarUrl ? (
					<AvatarImage src={seleccionado.avatarUrl} alt={seleccionado.nombre} />
				) : null}
				<AvatarFallback className="bg-blue-soft text-sm font-semibold text-brand-text">
					{iniciales(seleccionado.nombre)}
				</AvatarFallback>
			</Avatar>
			<span className="grid flex-1 leading-tight">
				<span className="truncate text-sm font-semibold">
					{seleccionado.nombre}
				</span>
				{seleccionado.secundario ? (
					<span className="truncate text-xs text-muted-foreground">
						{seleccionado.secundario}
					</span>
				) : null}
			</span>
			{resumenBadge ? (
				<span className="hidden rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline">
					{resumenBadge}
				</span>
			) : null}
			<span className="text-xs font-semibold text-brand-text">Cambiar</span>
		</button>
	) : (
		<button
			type="button"
			disabled={disabled}
			aria-haspopup="dialog"
			aria-expanded={open}
			className={cn(
				"flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-card px-3 text-left text-sm transition-colors duration-150 ease-out hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
		>
			<UserRound
				className="size-4 shrink-0 text-brand-text"
				aria-hidden="true"
			/>
			<span className="flex-1 truncate text-muted-foreground">
				{placeholder}
			</span>
			<ChevronsUpDown
				className="size-4 shrink-0 text-muted-foreground"
				aria-hidden="true"
			/>
		</button>
	);

	return (
		<>
			{isMobile ? (
				<Sheet open={open} onOpenChange={setOpen}>
					<SheetTrigger asChild>{disparador}</SheetTrigger>
					<SheetContent side="bottom" className="rounded-t-2xl p-0">
						<SheetHeader className="border-b border-border p-4">
							<SheetTitle>Seleccionar</SheetTitle>
						</SheetHeader>
						<div className="pb-4">{contenido}</div>
					</SheetContent>
				</Sheet>
			) : (
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>{disparador}</PopoverTrigger>
					<PopoverContent
						align="start"
						className="w-[--radix-popover-trigger-width] min-w-80 p-0"
					>
						{contenido}
					</PopoverContent>
				</Popover>
			)}

			{tabla
				? tabla({
						open: tablaOpen,
						onOpenChange: setTablaOpen,
						onSelect: elegir,
					})
				: null}
			{nuevo
				? nuevo({
						open: nuevoOpen,
						onOpenChange: setNuevoOpen,
						onSelect: elegir,
					})
				: null}
		</>
	);
}
