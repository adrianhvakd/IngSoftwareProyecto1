import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	Building2,
	Eye,
	EyeOff,
	Lock,
	LogIn,
	Mail,
	ShieldCheck,
	UserCog,
	Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/ingresar")({
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

const accesosDemo = [
	{
		to: "/admin" as const,
		label: "Panel administrador",
		descripcion: "Inmuebles, usuarios, cobros y mora",
		icono: <ShieldCheck className="size-4" aria-hidden="true" />,
	},
	{
		to: "/vendedor" as const,
		label: "Panel vendedor",
		descripcion: "Visitas, cierres y comisiones",
		icono: <UserCog className="size-4" aria-hidden="true" />,
	},
	{
		to: "/cliente" as const,
		label: "Panel cliente",
		descripcion: "Mis visitas y mi alquiler",
		icono: <Users className="size-4" aria-hidden="true" />,
	},
];

function IngresarPage() {
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [mostrar, setMostrar] = useState(false);
	const [recordar, setRecordar] = useState(true);
	const [errores, setErrores] = useState<{ email?: string; password?: string }>(
		{},
	);

	function enviar(evento: React.FormEvent<HTMLFormElement>) {
		evento.preventDefault();
		const nuevos: typeof errores = {};
		if (!email.trim()) nuevos.email = "Ingresa tu correo electrónico.";
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
			nuevos.email = "Correo electrónico no válido.";
		if (!password) nuevos.password = "Ingresa tu contraseña.";
		else if (password.length < 6)
			nuevos.password = "La contraseña debe tener al menos 6 caracteres.";
		setErrores(nuevos);
		if (Object.keys(nuevos).length > 0) return;

		toast.success("Sesión iniciada", {
			description: "Bienvenido de nuevo. (Acción simulada)",
		});
		void navigate({ to: "/cliente" });
	}

	return (
		<AuthLayout
			title="Ingresa a tu cuenta"
			subtitle="Gestiona tus visitas, contratos y pagos de alquiler."
		>
			<form onSubmit={enviar} className="grid gap-5" noValidate>
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
						<button
							type="button"
							onClick={() =>
								toast.info("Recuperar contraseña", {
									description:
										"Te enviaríamos un enlace al correo registrado. (Simulación)",
								})
							}
							className="text-xs font-medium text-primary hover:underline"
						>
							¿Olvidaste tu contraseña?
						</button>
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

				<Button type="submit" size="lg" className="w-full">
					<LogIn aria-hidden="true" />
					Ingresar
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
				<div className="relative flex items-center gap-3">
					<Separator className="flex-1" />
					<span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Acceso demo
					</span>
					<Separator className="flex-1" />
				</div>

				<p className="mt-3 text-center text-xs text-muted-foreground">
					Explora la plataforma con cada rol. No requiere credenciales.
				</p>

				<div className="mt-4 grid gap-2">
					{accesosDemo.map((acceso) => (
						<Button
							key={acceso.to}
							asChild
							variant="outline"
							className="h-auto justify-start py-3"
						>
							<Link to={acceso.to}>
								<span className="grid size-8 shrink-0 place-items-center rounded-lg bg-blue-soft text-primary">
									{acceso.icono}
								</span>
								<span className="flex flex-col items-start text-left">
									<span className="font-semibold text-foreground">
										{acceso.label}
									</span>
									<span className="text-xs font-normal text-muted-foreground">
										{acceso.descripcion}
									</span>
								</span>
							</Link>
						</Button>
					))}
				</div>

				<Button
					variant="ghost"
					className="mt-2 w-full text-muted-foreground"
					onClick={() =>
						toast.info("Publicar inmueble", {
							description:
								"El flujo de publicación para propietarios estará disponible al iniciar sesión. (Simulación)",
						})
					}
				>
					<Building2 aria-hidden="true" />
					Soy propietario y quiero publicar
				</Button>
			</div>
		</AuthLayout>
	);
}
