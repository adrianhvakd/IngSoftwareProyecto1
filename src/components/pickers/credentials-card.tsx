import { cn } from "cn";
import {
	Check,
	Copy,
	KeyRound,
	Printer,
	ShieldAlert,
	UserRound,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface CredentialsCardProps {
	/** Correo o nombre de usuario de la cuenta creada. */
	usuario: string;
	/** Contraseña temporal generada. */
	password: string;
	titulo?: string;
	className?: string;
}

function CampoCredencial({
	icono,
	etiqueta,
	valor,
}: {
	icono: React.ReactNode;
	etiqueta: string;
	valor: string;
}) {
	const [copiado, setCopiado] = useState(false);

	async function copiar() {
		try {
			await navigator.clipboard.writeText(valor);
			setCopiado(true);
			window.setTimeout(() => setCopiado(false), 1600);
			toast.success("Copiado al portapapeles");
		} catch {
			toast.error("No se pudo copiar");
		}
	}

	return (
		<div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
			<span className="grid size-9 shrink-0 place-items-center rounded-md bg-blue-soft text-brand-text">
				{icono}
			</span>
			<span className="grid flex-1 leading-tight">
				<span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
					{etiqueta}
				</span>
				<span className="truncate font-mono text-sm font-semibold text-foreground">
					{valor}
				</span>
			</span>
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				onClick={copiar}
				aria-label={`Copiar ${etiqueta}`}
			>
				{copiado ? (
					<Check className="size-4 text-success" aria-hidden="true" />
				) : (
					<Copy className="size-4" aria-hidden="true" />
				)}
			</Button>
		</div>
	);
}

export function CredentialsCard({
	usuario,
	password,
	titulo = "Credenciales de acceso",
	className,
}: CredentialsCardProps) {
	function imprimir() {
		if (typeof window === "undefined") return;
		document.body.classList.add("printing-credentials");
		window.print();
		window.setTimeout(
			() => document.body.classList.remove("printing-credentials"),
			0,
		);
	}

	return (
		<div
			id="credentials-print"
			className={cn(
				"rounded-xl border border-success/30 bg-success-soft/40 p-4 sm:p-5",
				className,
			)}
		>
			<div className="flex items-start gap-3">
				<span className="grid size-10 shrink-0 place-items-center rounded-full bg-success text-white">
					<KeyRound className="size-5" aria-hidden="true" />
				</span>
				<div>
					<h3 className="font-display text-base font-bold text-foreground">
						{titulo}
					</h3>
					<p className="mt-0.5 text-sm text-muted-foreground">
						Entrega estas credenciales al usuario; deberá cambiarla al ingresar.
					</p>
				</div>
			</div>

			<div className="mt-4 grid gap-3">
				<CampoCredencial
					icono={<UserRound className="size-4" aria-hidden="true" />}
					etiqueta="Usuario / correo"
					valor={usuario}
				/>
				<CampoCredencial
					icono={<KeyRound className="size-4" aria-hidden="true" />}
					etiqueta="Contraseña temporal"
					valor={password}
				/>
			</div>

			<div className="mt-4 flex flex-col gap-2 sm:flex-row">
				<Button type="button" variant="outline" onClick={imprimir}>
					<Printer aria-hidden="true" />
					Imprimir
				</Button>
			</div>

			<p className="mt-4 flex items-start gap-2 text-xs text-warning">
				<ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
				Esta contraseña no se volverá a mostrar. Si se pierde, deberá generarse
				una nueva.
			</p>
		</div>
	);
}
