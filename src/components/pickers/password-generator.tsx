import { cn } from "cn";
import { Check, Copy, Eye, EyeOff, KeyRound, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Alfabeto legible sin caracteres ambiguos (O/0, I/l/1). */
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

/** Genera una contraseña aleatoria con `crypto.getRandomValues`. */
export function generarPassword(longitud = 12): string {
	const bytes = new Uint32Array(longitud);
	if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
		crypto.getRandomValues(bytes);
	} else {
		for (let i = 0; i < longitud; i++) {
			bytes[i] = Math.floor(Math.random() * 0xffffffff);
		}
	}
	let resultado = "";
	for (let i = 0; i < longitud; i++) {
		resultado += ALFABETO[bytes[i] % ALFABETO.length];
	}
	return resultado;
}

interface PasswordGeneratorProps {
	value: string;
	onChange: (value: string) => void;
	/** Genera una contraseña al montar si aún no hay valor. */
	autoGenerar?: boolean;
	label?: string;
	id?: string;
	className?: string;
}

export function PasswordGenerator({
	value,
	onChange,
	autoGenerar = true,
	label = "Contraseña temporal",
	id = "password-generator",
	className,
}: PasswordGeneratorProps) {
	const [visible, setVisible] = useState(false);
	const [copiada, setCopiada] = useState(false);
	const generadoInicial = useRef(false);

	useEffect(() => {
		if (autoGenerar && !generadoInicial.current && value === "") {
			generadoInicial.current = true;
			onChange(generarPassword());
		}
	}, [autoGenerar, onChange, value]);

	function regenerar() {
		onChange(generarPassword());
		setVisible(true);
		setCopiada(false);
	}

	async function copiar() {
		if (!value) return;
		try {
			await navigator.clipboard.writeText(value);
			setCopiada(true);
			window.setTimeout(() => setCopiada(false), 1600);
			toast.success("Contraseña copiada", {
				description: "Recuerda que solo se muestra esta vez.",
			});
		} catch {
			toast.error("No se pudo copiar", {
				description: "Selecciona el texto y cópialo manualmente.",
			});
		}
	}

	return (
		<div className={cn("grid gap-2", className)}>
			<Label htmlFor={id} className="flex items-center gap-1.5">
				<KeyRound className="size-3.5 text-brand-text" aria-hidden="true" />
				{label}
			</Label>
			<div className="flex gap-2">
				<div className="relative flex-1">
					<Input
						id={id}
						type={visible ? "text" : "password"}
						value={value}
						readOnly
						className="pr-10 font-mono tracking-wide"
						aria-describedby={`${id}-nota`}
					/>
					<button
						type="button"
						onClick={() => setVisible((v) => !v)}
						className="absolute top-1/2 right-1 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
						aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
						aria-pressed={visible}
					>
						{visible ? (
							<EyeOff className="size-4" aria-hidden="true" />
						) : (
							<Eye className="size-4" aria-hidden="true" />
						)}
					</button>
				</div>
				<Button
					type="button"
					variant="outline"
					size="icon"
					onClick={copiar}
					aria-label="Copiar contraseña"
				>
					{copiada ? (
						<Check className="size-4 text-success" aria-hidden="true" />
					) : (
						<Copy className="size-4" aria-hidden="true" />
					)}
				</Button>
			</div>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<Button type="button" variant="ghost" size="sm" onClick={regenerar}>
					<RefreshCw aria-hidden="true" />
					Generar
				</Button>
				<p id={`${id}-nota`} className="text-xs font-medium text-warning">
					Se muestra una sola vez.
				</p>
			</div>
		</div>
	);
}
