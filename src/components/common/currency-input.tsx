import { cn } from "cn";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/format";

interface CurrencyInputProps {
	value: number | undefined;
	onChange: (value: number | undefined) => void;
	id?: string;
	placeholder?: string;
	className?: string;
	"aria-label"?: string;
}

/**
 * Campo de monto en bolivianos: prefijo "Bs", separador de miles y solo dígitos.
 * El valor expuesto al consumidor siempre es un número o `undefined`.
 */
export function CurrencyInput({
	value,
	onChange,
	id,
	placeholder,
	className,
	"aria-label": ariaLabel,
}: CurrencyInputProps) {
	const [texto, setTexto] = useState(
		value !== undefined ? formatNumber(value) : "",
	);

	useEffect(() => {
		const formateado = value !== undefined ? formatNumber(value) : "";
		setTexto((prev) => (prev === formateado ? prev : formateado));
	}, [value]);

	function manejar(entrada: string) {
		const digitos = entrada.replace(/\D/g, "").slice(0, 12);
		const numero = digitos ? Number(digitos) : undefined;
		setTexto(numero !== undefined ? formatNumber(numero) : "");
		onChange(numero);
	}

	return (
		<div className={cn("relative", className)}>
			<span
				aria-hidden="true"
				className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-muted-foreground"
			>
				Bs
			</span>
			<Input
				id={id}
				type="text"
				inputMode="numeric"
				autoComplete="off"
				value={texto}
				onChange={(e) => manejar(e.target.value)}
				placeholder={placeholder}
				aria-label={ariaLabel}
				className="pl-9 tabular"
			/>
		</div>
	);
}
