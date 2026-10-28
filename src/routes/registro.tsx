import {
	createFileRoute,
	Link,
	redirect,
	useRouter,
} from "@tanstack/react-router";
import { cn } from "cn";
import {
	AlertCircle,
	Check,
	Eye,
	EyeOff,
	Loader2,
	Lock,
	Mail,
	Phone,
	User,
	UserPlus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rutaPanel } from "@/lib/auth";
import { registrarCuenta } from "@/server/auth";

export const Route = createFileRoute("/registro")({
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
			{ title: "Crear cuenta · RE/MAX Potosí" },
			{
				name: "description",
				content:
					"Crea tu cuenta para agendar visitas, firmar contratos y pagar tus cuotas de alquiler en Potosí.",
			},
		],
	}),
	component: RegistroPage,
});

interface Formulario {
	nombre: string;
	email: string;
	telefono: string;
	password: string;
	confirmar: string;
}

const inicial: Formulario = {
	nombre: "",
	email: "",
	telefono: "",
	password: "",
	confirmar: "",
};

function fuerzaPassword(password: string): number {
	let puntos = 0;
	if (password.length >= 6) puntos += 1;
	if (password.length >= 10) puntos += 1;
	if (/[A-Z]/.test(password) && /[a-z]/.test(password)) puntos += 1;
	if (/\d/.test(password)) puntos += 1;
	if (/[^A-Za-z0-9]/.test(password)) puntos += 1;
	return Math.min(puntos, 4);
}

const etiquetaFuerza = [
	"Muy débil",
	"Débil",
	"Aceptable",
	"Fuerte",
	"Muy fuerte",
];
const colorFuerza = [
	"bg-destructive",
	"bg-destructive",
	"bg-warning",
	"bg-success",
	"bg-success",
];

function RegistroPage() {
	const router = useRouter();
	const [form, setForm] = useState<Formulario>(inicial);
	const [mostrar, setMostrar] = useState(false);
	const [acepta, setAcepta] = useState(false);
	const [enviando, setEnviando] = useState(false);
	const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
	const [errores, setErrores] = useState<
		Partial<Record<keyof Formulario | "acepta", string>>
	>({});

	const fuerza = useMemo(() => fuerzaPassword(form.password), [form.password]);

	function set<K extends keyof Formulario>(clave: K, valor: string) {
		setForm((prev) => ({ ...prev, [clave]: valor }));
	}

	async function enviar(evento: React.FormEvent<HTMLFormElement>) {
		evento.preventDefault();
		setErrorGeneral(null);

		const nuevos: typeof errores = {};
		if (!form.nombre.trim()) nuevos.nombre = "Ingresa tu nombre completo.";
		if (!form.email.trim()) nuevos.email = "Ingresa tu correo electrónico.";
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
			nuevos.email = "Correo electrónico no válido.";
		if (!form.telefono.trim()) nuevos.telefono = "Ingresa tu teléfono.";
		else if (!/^[+\d][\d\s()-]{6,}$/.test(form.telefono.trim()))
			nuevos.telefono = "Usa un formato válido, por ejemplo +591 71234567.";
		if (form.password.length < 6)
			nuevos.password = "La contraseña debe tener al menos 6 caracteres.";
		if (form.confirmar !== form.password)
			nuevos.confirmar = "Las contraseñas no coinciden.";
		if (!acepta) nuevos.acepta = "Debes aceptar los términos y condiciones.";
		setErrores(nuevos);
		if (Object.keys(nuevos).length > 0) return;

		setEnviando(true);

		try {
			const resultado = await registrarCuenta({
				data: {
					nombres: form.nombre.trim(),
					apellidos: "",
					telefono: form.telefono.trim(),
					correo: form.email.trim(),
					password: form.password,
				},
			});

			if (!resultado.ok) {
				setErrorGeneral(resultado.error);
				return;
			}

			if (resultado.requiereConfirmacion || !resultado.sesion) {
				toast.success("Cuenta creada", {
					description:
						"Revisa tu correo para confirmar la cuenta y luego inicia sesión.",
				});
				await router.navigate({ to: "/ingresar" });
				return;
			}

			toast.success("Cuenta creada", {
				description: "Bienvenido a RE/MAX Potosí.",
			});
			await router.invalidate();
			await router.navigate({ to: rutaPanel(resultado.sesion.rol) });
		} catch {
			setErrorGeneral(
				"No se pudo crear la cuenta. Revisa tu conexión e inténtalo de nuevo.",
			);
		} finally {
			setEnviando(false);
		}
	}

	return (
		<AuthLayout
			title="Crea tu cuenta"
			subtitle="Regístrate para agendar visitas y gestionar tu alquiler."
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
					<Label htmlFor="reg-nombre">Nombre completo</Label>
					<div className="relative">
						<User
							className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
							aria-hidden="true"
						/>
						<Input
							id="reg-nombre"
							value={form.nombre}
							onChange={(e) => set("nombre", e.target.value)}
							placeholder="Ej. Ana Gutiérrez Rojas"
							className="pl-9"
							autoComplete="name"
							aria-invalid={Boolean(errores.nombre)}
						/>
					</div>
					{errores.nombre ? (
						<p className="text-xs font-medium text-destructive">
							{errores.nombre}
						</p>
					) : null}
				</div>

				<div className="grid gap-1.5">
					<Label htmlFor="reg-email">Correo electrónico</Label>
					<div className="relative">
						<Mail
							className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
							aria-hidden="true"
						/>
						<Input
							id="reg-email"
							type="email"
							value={form.email}
							onChange={(e) => set("email", e.target.value)}
							placeholder="tucorreo@ejemplo.com"
							className="pl-9"
							autoComplete="email"
							aria-invalid={Boolean(errores.email)}
						/>
					</div>
					{errores.email ? (
						<p className="text-xs font-medium text-destructive">
							{errores.email}
						</p>
					) : null}
				</div>

				<div className="grid gap-1.5">
					<Label htmlFor="reg-telefono">Teléfono</Label>
					<div className="relative">
						<Phone
							className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
							aria-hidden="true"
						/>
						<Input
							id="reg-telefono"
							type="tel"
							value={form.telefono}
							onChange={(e) => set("telefono", e.target.value)}
							placeholder="+591 71234567"
							className="pl-9"
							autoComplete="tel"
							aria-invalid={Boolean(errores.telefono)}
						/>
					</div>
					{errores.telefono ? (
						<p className="text-xs font-medium text-destructive">
							{errores.telefono}
						</p>
					) : null}
				</div>

				<div className="grid gap-1.5">
					<Label htmlFor="reg-password">Contraseña</Label>
					<div className="relative">
						<Lock
							className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
							aria-hidden="true"
						/>
						<Input
							id="reg-password"
							type={mostrar ? "text" : "password"}
							value={form.password}
							onChange={(e) => set("password", e.target.value)}
							placeholder="Mínimo 6 caracteres"
							className="pr-10 pl-9"
							autoComplete="new-password"
							aria-invalid={Boolean(errores.password)}
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
					{form.password ? (
						<div className="mt-1 flex items-center gap-2">
							<div className="flex flex-1 gap-1">
								{[0, 1, 2, 3].map((segmento) => (
									<span
										key={segmento}
										className={cn(
											"h-1.5 flex-1 rounded-full transition-colors duration-200 ease-out",
											segmento < fuerza ? colorFuerza[fuerza] : "bg-border",
										)}
									/>
								))}
							</div>
							<span className="w-20 text-right text-xs text-muted-foreground">
								{etiquetaFuerza[fuerza]}
							</span>
						</div>
					) : null}
					{errores.password ? (
						<p className="text-xs font-medium text-destructive">
							{errores.password}
						</p>
					) : null}
				</div>

				<div className="grid gap-1.5">
					<Label htmlFor="reg-confirmar">Confirmar contraseña</Label>
					<Input
						id="reg-confirmar"
						type={mostrar ? "text" : "password"}
						value={form.confirmar}
						onChange={(e) => set("confirmar", e.target.value)}
						placeholder="Repite tu contraseña"
						autoComplete="new-password"
						aria-invalid={Boolean(errores.confirmar)}
					/>
					{errores.confirmar ? (
						<p className="text-xs font-medium text-destructive">
							{errores.confirmar}
						</p>
					) : null}
				</div>

				<div className="grid gap-1.5">
					<div className="flex items-start gap-2">
						<Checkbox
							id="reg-terminos"
							checked={acepta}
							onCheckedChange={(v) => {
								setAcepta(v === true);
								setErrores((prev) => ({ ...prev, acepta: undefined }));
							}}
							aria-invalid={Boolean(errores.acepta)}
							className="mt-0.5"
						/>
						<Label
							htmlFor="reg-terminos"
							className="text-sm font-normal leading-snug"
						>
							Acepto los{" "}
							<span className="font-medium text-primary">
								términos y condiciones
							</span>{" "}
							y la política de privacidad de RE/MAX Potosí.
						</Label>
					</div>
					{errores.acepta ? (
						<p className="text-xs font-medium text-destructive">
							{errores.acepta}
						</p>
					) : null}
				</div>

				<Button type="submit" size="lg" className="w-full" disabled={enviando}>
					{enviando ? (
						<Loader2 className="animate-spin" aria-hidden="true" />
					) : (
						<UserPlus aria-hidden="true" />
					)}
					{enviando ? "Creando cuenta…" : "Crear cuenta"}
				</Button>

				<p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
					<Check className="size-3.5 text-success" aria-hidden="true" />
					Tus datos están protegidos. No los compartimos con terceros.
				</p>
			</form>

			<p className="mt-5 text-center text-sm text-muted-foreground">
				¿Ya tienes cuenta?{" "}
				<Link
					to="/ingresar"
					className="font-semibold text-primary hover:underline"
				>
					Ingresar
				</Link>
			</p>
		</AuthLayout>
	);
}
