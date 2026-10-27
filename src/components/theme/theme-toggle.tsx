import { cn } from "cn";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { type Theme, useTheme } from "@/components/theme/theme-provider";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const OPCIONES: { value: Theme; label: string; icon: ReactNode }[] = [
	{ value: "light", label: "Claro", icon: <Sun aria-hidden="true" /> },
	{ value: "dark", label: "Oscuro", icon: <Moon aria-hidden="true" /> },
	{ value: "system", label: "Sistema", icon: <Monitor aria-hidden="true" /> },
];

interface ThemeToggleProps {
	className?: string;
	/** "icon" para barras compactas, "inline" para menús/hojas. */
	variant?: "icon" | "inline";
}

export function ThemeToggle({ className, variant = "icon" }: ThemeToggleProps) {
	const { theme, resolved, setTheme } = useTheme();
	const actual = OPCIONES.find((o) => o.value === theme) ?? OPCIONES[2];
	const IconoActual = resolved === "dark" ? Moon : Monitor;

	if (variant === "inline") {
		return (
			<fieldset
				className={cn(
					"m-0 flex min-w-0 items-center gap-1 rounded-lg border border-border bg-card p-1",
					className,
				)}
				aria-label="Tema de la interfaz"
			>
				{OPCIONES.map((opcion) => (
					<button
						key={opcion.value}
						type="button"
						onClick={() => setTheme(opcion.value)}
						aria-pressed={theme === opcion.value}
						className={cn(
							"flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 [&_svg]:size-3.5",
							theme === opcion.value
								? "bg-primary text-primary-foreground"
								: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
						)}
					>
						{opcion.icon}
						{opcion.label}
					</button>
				))}
			</fieldset>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className={cn("relative", className)}
					aria-label={`Tema: ${actual.label}. Cambiar tema`}
				>
					<IconoActual aria-hidden="true" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-44">
				<DropdownMenuLabel className="text-xs text-muted-foreground">
					Tema de la interfaz
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{OPCIONES.map((opcion) => (
					<DropdownMenuItem
						key={opcion.value}
						onSelect={() => setTheme(opcion.value)}
						className="justify-between"
					>
						<span className="flex items-center gap-2 [&_svg]:size-4">
							{opcion.icon}
							{opcion.label}
						</span>
						<Check
							className={cn(
								"size-4 text-primary",
								theme === opcion.value ? "opacity-100" : "opacity-0",
							)}
							aria-hidden="true"
						/>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
