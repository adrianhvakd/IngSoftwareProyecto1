import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import {
	AlertCircle,
	Check,
	Eye,
	EyeOff,
	Loader2,
	Lock,
	LogOut,
	ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nombreCompleto, rutaPanel } from "@/lib/auth";
import { cambiarPassword, cerrarSesion } from "@/server/auth";

export const Route = createFileRoute("/cambiar-password")({
	beforeLoad: ({ context }) => {
		const sesion = context.sesion;

		if (!sesion) throw redirect({ to: "/ingresar" });
		if (!sesion.debeCambiarPassword) {
			throw redirect({ to: rutaPanel(sesion.rol) });
		}

		return { sesion };
	},
	head: () => ({
		meta: [
			{ title: "Actualiza tu contraseña · RE/MAX Potosí" },
			{ name: "robots", content: "noindex" },
		],
	}),
	component: CambiarPasswordPage,
});

function CambiarPasswordPage() {
	const router = useRouter();
	const { sesion } = Route.useRouteContext();
	const [password, setPassword] = useState("");
	const [confirmar, setConfirmar] = useState("");
	const [mostrar, setMostrar] = useState(false);
	const [enviando, setEnviando] = useState(false);
	const [saliendo, setSaliendo] = useState(false);
	const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
	const [errores, setErrores] = useState<{
		password?: string;
		confirmar?: string;
	}>({});

	async function enviar(evento: React.FormEvent<HTMLFormElement>) {
		evento.preventDefault();
		setErrorGeneral(null);

		const nuevos: typeof errores = {};
		if (password.length < 6) {
			nuevos.password = "La contraseña debe tener al menos 6 caracteres.";
		}
		if (confirmar !== password) {
			nuevos.confirmar = "Las contraseñas no coinciden.";
		}
		setErrores(nuevos);
		if (Object.keys(nuevos).length > 0) return;

		setEnviando(true);

		try {
			const resultado = await cambiarPassword({ data: { password } });

			if (!resultado.ok) {
				setErrorGeneral(resultado.error);
				return;
			}

			toast.success("Contraseña actualizada", {
				description: "Ya puedes usar tu nueva contraseña.",
			});

			await router.invalidate();
			await router.navigate({ to: rutaPanel(sesion.rol) });
		} catch {
			setErrorGeneral(
				"No se pudo cambiar la contraseña. Revisa tu conexión e inténtalo de nuevo.",
			);
		} finally {
			setEnviando(false);
		}
	}

	async function salir() {
		setSaliendo(true);
		try {
			await cerrarSesion();
			await router.invalidate();
			await router.navigate({ to: "/ingresar" });
		} finally {
			setSaliendo(false);
		}
	}

	return (
		<AuthLayout
			title="Actualiza tu contraseña"
			subtitle={`Hola ${nombreCompleto(sesion)}. Por seguridad, define una contraseña propia antes de continuar.`}
		>
			<form onSubmit={enviar} className="grid gap-5" noValidate>
				<output className="flex items-start gap-2 rounded-lg border border-primary/20 bg-blue-soft px-3 py-2.5 text-sm text-blue-deep">
					<ShieldCheck
						className="mt-0.5 size-4 shrink-0 text-primary"
						aria-hidden="true"
					/>
					<p>
						Tu cuenta se creó con una contraseña temporal. Este cambio es
						obligatorio la primera vez que ingresas.
					</p>
				</output>

				{errorGeneral ? (
					<div
						role="alert"
						className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
					>
						<AlertCircle
							className="mt-0.5 size-4 shrink-0"
							aria-hidden="true"
						/>
						<p>{errorGeneral}</p>
					</div>
				) : null}

				<div className="grid gap-1.5">
					<Label htmlFor="pass-nueva">Nueva contraseña</Label>
					<div className="relative">
						<Lock
							className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
							aria-hidden="true"
						/>
						<Input
							id="pass-nueva"
							type={mostrar ? "text" : "password"}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Mínimo 6 caracteres"
							className="pr-10 pl-9"
							autoComplete="new-password"
							aria-invalid={Boolean(errores.password)}
							aria-describedby={
								errores.password ? "pass-nueva-error" : undefined
							}
						/>
						<button
							type="button"
							onClick={() => setMostrar((v) => !v)}
							aria-label={mostrar ? "Ocultar contraseña" : "Mostrar contraseña"}
							className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
						>
							{mostrar ? (
								<EyeOff className="size-4" aria-hidden="true" />
							) : (
								<Eye className="size-4" aria-hidden="true" />
							)}
						</button>
					</div>
					{errores.password ? (
						<p
							id="pass-nueva-error"
							className="text-xs font-medium text-destructive"
						>
							{errores.password}
						</p>
					) : null}
				</div>

				<div className="grid gap-1.5">
					<Label htmlFor="pass-confirmar">Confirmar contraseña</Label>
					<Input
						id="pass-confirmar"
						type={mostrar ? "text" : "password"}
						value={confirmar}
						onChange={(e) => setConfirmar(e.target.value)}
						placeholder="Repite tu nueva contraseña"
						autoComplete="new-password"
						aria-invalid={Boolean(errores.confirmar)}
						aria-describedby={
							errores.confirmar ? "pass-confirmar-error" : undefined
						}
					/>
					{errores.confirmar ? (
						<p
							id="pass-confirmar-error"
							className="text-xs font-medium text-destructive"
						>
							{errores.confirmar}
						</p>
					) : null}
				</div>

				<Button type="submit" size="lg" className="w-full" disabled={enviando}>
					{enviando ? (
						<Loader2 className="animate-spin" aria-hidden="true" />
					) : (
						<Check aria-hidden="true" />
					)}
					{enviando ? "Guardando…" : "Guardar contraseña"}
				</Button>
			</form>

			<Button
				variant="ghost"
				className="mt-4 w-full text-muted-foreground"
				onClick={salir}
				disabled={saliendo}
			>
				<LogOut aria-hidden="true" />
				{saliendo ? "Cerrando sesión…" : "Cerrar sesión"}
			</Button>
		</AuthLayout>
	);
}
