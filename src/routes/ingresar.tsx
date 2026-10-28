import {
	createFileRoute,
	Link,
	redirect,
	useRouter,
} from "@tanstack/react-router";
import {
	AlertCircle,
	Building2,
	Eye,
	EyeOff,
	Loader2,
	Lock,
	LogIn,
	Mail,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nombreCompleto, rutaPanel } from "@/lib/auth";
import { sitio } from "@/lib/site";
import { iniciarSesion } from "@/server/auth";

export const Route = createFileRoute("/ingresar")({
	beforeLoad: ({ context }) => {
		const sesion = context.sesion;
		if (!sesion) return;
		throw redirect({
			to: sesion.debeCambiarPassword
				? "/cambiar-password"
				: rutaPanel(sesion.rol),
		});
	},
	head: () => ({
		meta: [
			{ title: "Ingresar · RE/MAX Potosí" },
			{
				name: "description",
				content:
					"Ingresa a tu cuenta para gestionar visitas, alquileres y pagos en RE/MAX Potosí.",
			},
		],
	}),
	component: IngresarPage,
});

function IngresarPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [mostrar, setMostrar] = useState(false);
	const [recordar, setRecordar] = useState(true);
	const [enviando, setEnviando] = useState(false);
	const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
	const [errores, setErrores] = useState<{ email?: string; password?: string }>(
		{},
	);

	async function enviar(evento: React.FormEvent<HTMLFormElement>) {
		evento.preventDefault();
		setErrorGeneral(null);

		const nuevos: typeof errores = {};
		if (!email.trim()) nuevos.email = "Ingresa tu correo electrónico.";
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
			nuevos.email = "Correo electrónico no válido.";
		if (!password) nuevos.password = "Ingresa tu contraseña.";
		else if (password.length < 6)
			nuevos.password = "La contraseña debe tener al menos 6 caracteres.";
		setErrores(nuevos);
		if (Object.keys(nuevos).length > 0) return;

		setEnviando(true);

		try {
			const resultado = await iniciarSesion({
				data: { correo: email.trim(), password },
			});

			if (!resultado.ok) {
				setErrorGeneral(resultado.error);
				return;
			}

			const { sesion } = resultado;
			toast.success("Sesión iniciada", {
				description: `Bienvenido, ${nombreCompleto(sesion)}.`,
			});

			await router.invalidate();
			await router.navigate({
				to: sesion.debeCambiarPassword
					? "/cambiar-password"
					: rutaPanel(sesion.rol),
			});
		} catch {
			setErrorGeneral(
				"No se pudo iniciar sesión. Revisa tu conexión e inténtalo de nuevo.",
			);
		} finally {
			setEnviando(false);
		}
	}

	return (
		<AuthLayout
			title="Ingresa a tu cuenta"
			subtitle="Gestiona tus visitas, contratos y pagos de alquiler."
		>
			<form onSubmit={enviar} className="grid gap-5" noValidate>
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
					<Label htmlFor="login-email">Correo electrónico</Label>
					<div className="relative">
						<Mail
							className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
							aria-hidden="true"
						/>
						<Input
							id="login-email"
							type="email"
							autoComplete="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="tucorreo@ejemplo.com"
							className="pl-9"
							aria-invalid={Boolean(errores.email)}
							aria-describedby={errores.email ? "login-email-error" : undefined}
						/>
					</div>
					{errores.email ? (
						<p
							id="login-email-error"
							className="text-xs font-medium text-destructive"
						>
							{errores.email}
						</p>
					) : null}
				</div>

				<div className="grid gap-1.5">
					<div className="flex items-center justify-between">
						<Label htmlFor="login-password">Contraseña</Label>
						<a
							href={`mailto:${sitio.email}?subject=${encodeURIComponent("Recuperar contraseña")}`}
							className="text-xs font-medium text-primary hover:underline"
						>
							¿Olvidaste tu contraseña?
						</a>
					</div>
					<div className="relative">
						<Lock
							className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
							aria-hidden="true"
						/>
						<Input
							id="login-password"
							type={mostrar ? "text" : "password"}
							autoComplete="current-password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="••••••••"
							className="pr-10 pl-9"
							aria-invalid={Boolean(errores.password)}
							aria-describedby={
								errores.password ? "login-password-error" : undefined
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
							id="login-password-error"
							className="text-xs font-medium text-destructive"
						>
							{errores.password}
						</p>
					) : null}
				</div>

				<div className="flex items-center gap-2">
					<Checkbox
						id="login-recordar"
						checked={recordar}
						onCheckedChange={(v) => setRecordar(v === true)}
					/>
					<Label htmlFor="login-recordar" className="text-sm font-normal">
						Recordarme en este dispositivo
					</Label>
				</div>

				<Button type="submit" size="lg" className="w-full" disabled={enviando}>
					{enviando ? (
						<Loader2 className="animate-spin" aria-hidden="true" />
					) : (
						<LogIn aria-hidden="true" />
					)}
					{enviando ? "Ingresando…" : "Ingresar"}
				</Button>
			</form>

			<p className="mt-5 text-center text-sm text-muted-foreground">
				¿No tienes cuenta?{" "}
				<Link
					to="/registro"
					className="font-semibold text-primary hover:underline"
				>
					Crear una cuenta
				</Link>
			</p>

			<div className="mt-8">
				<Button
					asChild
					variant="ghost"
					className="w-full text-muted-foreground"
				>
					<a
						href={`mailto:${sitio.email}?subject=${encodeURIComponent("Quiero publicar mi inmueble")}`}
					>
						<Building2 aria-hidden="true" />
						Soy propietario y quiero publicar
					</a>
				</Button>
			</div>
		</AuthLayout>
	);
}
