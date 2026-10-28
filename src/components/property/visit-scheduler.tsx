import { useRouteContext } from "@tanstack/react-router";
import { cn } from "cn";
import { CalendarIcon, Check, Clock, Mail, Phone, User } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { nombreCompleto, type SesionUsuario } from "@/lib/auth";
import { formatFechaLarga, iniciales } from "@/lib/format";
import { agendarVisita } from "@/server/visitas";
import type { AgenteResumen } from "@/types/domain";

const FRANJAS = [
	{ id: "09:00", hora: "09:00 – 10:00", disponible: true },
	{ id: "10:00", hora: "10:00 – 11:00", disponible: true },
	{ id: "11:00", hora: "11:00 – 12:00", disponible: true },
	{ id: "15:00", hora: "15:00 – 16:00", disponible: true },
	{ id: "16:00", hora: "16:00 – 17:00", disponible: true },
	{ id: "17:00", hora: "17:00 – 18:00", disponible: true },
];

interface VisitSchedulerProps {
	inmuebleId: string;
	inmuebleTitulo: string;
	agente?: AgenteResumen;
}

interface Errores {
	nombre?: string;
	telefono?: string;
	email?: string;
	fecha?: string;
	franja?: string;
}

/** Construye un instante con la zona horaria de Bolivia (UTC-4, sin DST). */
function fechaHoraBolivia(fecha: Date, franja: string): string {
	const horaInicio = franja.split("–")[0]?.trim() ?? "09:00";
	const [hora = "09", minuto = "00"] = horaInicio.split(":");
	const anio = fecha.getFullYear();
	const mes = String(fecha.getMonth() + 1).padStart(2, "0");
	const dia = String(fecha.getDate()).padStart(2, "0");
	return `${anio}-${mes}-${dia}T${hora.padStart(2, "0")}:${minuto.padStart(2, "0")}:00-04:00`;
}

export function VisitScheduler({
	inmuebleId,
	inmuebleTitulo,
	agente,
}: VisitSchedulerProps) {
	const { sesion } = useRouteContext({ from: "__root__" }) as {
		sesion: SesionUsuario | null;
	};
	const nombreInicial = sesion ? nombreCompleto(sesion) : "";
	const telefonoInicial = sesion?.telefono ?? "";
	const correoInicial = sesion?.correo ?? "";

	const [nombre, setNombre] = useState(nombreInicial);
	const [telefono, setTelefono] = useState(telefonoInicial);
	const [email, setEmail] = useState(correoInicial);
	const [mensaje, setMensaje] = useState("");
	const [fecha, setFecha] = useState<Date | undefined>();
	const [franja, setFranja] = useState<string | null>(null);
	const [errores, setErrores] = useState<Errores>({});
	const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
	const [enviado, setEnviado] = useState(false);
	const [enviando, setEnviando] = useState(false);

	const hoy = useMemo(() => {
		const valor = new Date();
		valor.setHours(0, 0, 0, 0);
		return valor;
	}, []);

	function validar(): boolean {
		const nuevos: Errores = {};
		if (!nombre.trim()) nuevos.nombre = "Ingresa tu nombre completo.";
		if (!telefono.trim()) {
			nuevos.telefono = "Ingresa tu número de teléfono.";
		} else if (!/^[+\d][\d\s()-]{6,}$/.test(telefono.trim())) {
			nuevos.telefono = "Usa un formato válido, por ejemplo +591 71234567.";
		}
		if (!email.trim()) {
			nuevos.email = "Ingresa tu correo electrónico.";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
			nuevos.email = "Ingresa un correo electrónico válido.";
		}
		if (!fecha) nuevos.fecha = "Selecciona una fecha para la visita.";
		if (!franja) nuevos.franja = "Elige una franja horaria.";
		setErrores(nuevos);
		return Object.keys(nuevos).length === 0;
	}

	async function enviar(evento: React.FormEvent<HTMLFormElement>) {
		evento.preventDefault();
		setErrorEnvio(null);
		if (!validar() || !fecha || !franja) return;

		setEnviando(true);
		try {
			const resultado = await agendarVisita({
				data: {
					inmuebleId,
					fechaHora: fechaHoraBolivia(fecha, franja),
					nombre: nombre.trim() || undefined,
					telefono: telefono.trim() || undefined,
					correo: email.trim() || undefined,
					notas: mensaje.trim() || undefined,
				},
			});

			if (!resultado.ok) {
				setErrorEnvio(resultado.error);
				toast.error("No se pudo agendar la visita", {
					description: resultado.error,
				});
				return;
			}

			setEnviado(true);
		} catch {
			const mensajeError =
				"No se pudo conectar con el servicio de visitas. Inténtalo de nuevo.";
			setErrorEnvio(mensajeError);
			toast.error("No se pudo agendar la visita", {
				description: mensajeError,
			});
		} finally {
			setEnviando(false);
		}
	}

	function reiniciar() {
		setEnviado(false);
		setNombre(nombreInicial);
		setTelefono(telefonoInicial);
		setEmail(correoInicial);
		setMensaje("");
		setFecha(undefined);
		setFranja(null);
		setErrores({});
		setErrorEnvio(null);
	}

	return (
		<div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
			<div className="flex items-center gap-3">
				{agente ? (
					<Avatar className="size-11 ring-2 ring-blue-soft">
						<AvatarImage
							src={agente.avatarUrl ?? undefined}
							alt={agente.nombre}
						/>
						<AvatarFallback className="bg-blue-soft text-primary">
							{iniciales(agente.nombre)}
						</AvatarFallback>
					</Avatar>
				) : null}
				<div>
					<p className="font-display text-sm font-bold text-foreground">
						Agendar visita
					</p>
					<p className="text-xs text-muted-foreground">
						{agente
							? `Agente responsable: ${agente.nombre}`
							: "Te asignaremos un agente"}
					</p>
				</div>
			</div>

			<form onSubmit={enviar} className="mt-5 grid gap-4" noValidate>
				<div className="grid gap-1.5">
					<Label htmlFor="vs-nombre">
						<User className="size-3.5 text-primary" aria-hidden="true" />
						Nombre
					</Label>
					<Input
						id="vs-nombre"
						value={nombre}
						onChange={(e) => setNombre(e.target.value)}
						placeholder="Tu nombre completo"
						aria-invalid={Boolean(errores.nombre)}
						aria-describedby={errores.nombre ? "vs-nombre-error" : undefined}
					/>
					{errores.nombre ? (
						<p
							id="vs-nombre-error"
							className="text-xs font-medium text-destructive"
						>
							{errores.nombre}
						</p>
					) : null}
				</div>

				<div className="grid gap-1.5">
					<Label htmlFor="vs-telefono">
						<Phone className="size-3.5 text-primary" aria-hidden="true" />
						Teléfono
					</Label>
					<Input
						id="vs-telefono"
						type="tel"
						value={telefono}
						onChange={(e) => setTelefono(e.target.value)}
						placeholder="+591 71234567"
						aria-invalid={Boolean(errores.telefono)}
						aria-describedby={
							errores.telefono ? "vs-telefono-error" : undefined
						}
					/>
					{errores.telefono ? (
						<p
							id="vs-telefono-error"
							className="text-xs font-medium text-destructive"
						>
							{errores.telefono}
						</p>
					) : null}
				</div>

				<div className="grid gap-1.5">
					<Label htmlFor="vs-email">
						<Mail className="size-3.5 text-primary" aria-hidden="true" />
						Correo
					</Label>
					<Input
						id="vs-email"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="tucorreo@ejemplo.com"
						aria-invalid={Boolean(errores.email)}
						aria-describedby={errores.email ? "vs-email-error" : undefined}
					/>
					{errores.email ? (
						<p
							id="vs-email-error"
							className="text-xs font-medium text-destructive"
						>
							{errores.email}
						</p>
					) : null}
				</div>

				<div className="grid gap-1.5">
					<Label htmlFor="vs-fecha">
						<CalendarIcon
							className="size-3.5 text-primary"
							aria-hidden="true"
						/>
						Fecha
					</Label>
					<Popover>
						<PopoverTrigger asChild>
							<Button
								id="vs-fecha"
								type="button"
								variant="outline"
								className={cn(
									"w-full justify-start font-normal",
									!fecha && "text-muted-foreground",
								)}
								aria-invalid={Boolean(errores.fecha)}
							>
								<CalendarIcon aria-hidden="true" />
								{fecha
									? formatFechaLarga(fecha.toISOString())
									: "Elige una fecha"}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="start">
							<Calendar
								mode="single"
								selected={fecha}
								onSelect={(d) => {
									setFecha(d);
									setErrores((prev) => ({ ...prev, fecha: undefined }));
								}}
								disabled={{ before: hoy }}
								autoFocus
							/>
						</PopoverContent>
					</Popover>
					{errores.fecha ? (
						<p className="text-xs font-medium text-destructive">
							{errores.fecha}
						</p>
					) : null}
				</div>

				<fieldset className="grid gap-2">
					<legend className="flex items-center gap-1.5 text-sm font-medium text-foreground">
						<Clock className="size-3.5 text-primary" aria-hidden="true" />
						Franja horaria
					</legend>
					<div className="grid grid-cols-2 gap-2">
						{FRANJAS.map((f) => {
							const activo = franja === f.hora;
							return (
								<button
									key={f.id}
									type="button"
									disabled={!f.disponible}
									onClick={() => {
										setFranja(f.hora);
										setErrores((prev) => ({ ...prev, franja: undefined }));
									}}
									aria-pressed={activo}
									className={cn(
										"rounded-lg border px-3 py-2 text-xs font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
										!f.disponible &&
											"cursor-not-allowed border-border bg-muted text-muted-foreground/60 line-through",
										f.disponible &&
											activo &&
											"border-primary bg-primary text-primary-foreground",
										f.disponible &&
											!activo &&
											"border-border bg-card text-foreground hover:border-primary/50",
									)}
								>
									{f.hora}
								</button>
							);
						})}
					</div>
					{errores.franja ? (
						<p className="text-xs font-medium text-destructive">
							{errores.franja}
						</p>
					) : null}
				</fieldset>

				<div className="grid gap-1.5">
					<Label htmlFor="vs-mensaje">Mensaje (opcional)</Label>
					<Textarea
						id="vs-mensaje"
						value={mensaje}
						onChange={(e) => setMensaje(e.target.value)}
						placeholder="Cuéntanos qué necesitas saber del inmueble…"
						rows={3}
					/>
				</div>

				{errorEnvio ? (
					<p
						role="alert"
						className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive"
					>
						{errorEnvio}
					</p>
				) : null}

				<Button type="submit" variant="cta" size="lg" disabled={enviando}>
					{enviando ? "Enviando…" : "Agendar visita"}
				</Button>
				<p className="text-center text-xs text-muted-foreground">
					No compartimos tus datos. Respuesta en menos de 24 horas.
				</p>
			</form>

			<Dialog open={enviado} onOpenChange={setEnviado}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<span className="mx-auto grid size-14 place-items-center rounded-full bg-success-soft text-success">
							<Check className="size-7" aria-hidden="true" />
						</span>
						<DialogTitle className="text-center">Cita solicitada</DialogTitle>
						<DialogDescription className="text-center">
							Registramos tu solicitud de visita. Un agente te confirmará por
							teléfono o correo.
						</DialogDescription>
					</DialogHeader>
					<dl className="rounded-lg border border-border bg-secondary/50 p-4 text-sm">
						<div className="flex justify-between gap-4 py-1">
							<dt className="text-muted-foreground">Inmueble</dt>
							<dd className="text-right font-medium text-foreground">
								{inmuebleTitulo}
							</dd>
						</div>
						<div className="flex justify-between gap-4 py-1">
							<dt className="text-muted-foreground">Fecha</dt>
							<dd className="text-right font-medium text-foreground">
								{fecha ? formatFechaLarga(fecha.toISOString()) : "—"}
							</dd>
						</div>
						<div className="flex justify-between gap-4 py-1">
							<dt className="text-muted-foreground">Franja</dt>
							<dd className="text-right font-medium tabular text-foreground">
								{franja ?? "—"}
							</dd>
						</div>
						<div className="flex justify-between gap-4 py-1">
							<dt className="text-muted-foreground">Contacto</dt>
							<dd className="text-right font-medium text-foreground">
								{telefono}
							</dd>
						</div>
					</dl>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={reiniciar}
							className="w-full sm:w-auto"
						>
							Agendar otra visita
						</Button>
						<Button variant="default" onClick={() => setEnviado(false)}>
							Entendido
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
