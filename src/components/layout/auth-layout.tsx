import { Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	BadgeCheck,
	CalendarCheck,
	ShieldCheck,
	Wallet,
} from "lucide-react";
import type { ReactNode } from "react";
import { BalloonMotif } from "@/components/brand/balloon";
import { Logo } from "@/components/brand/logo";

interface AuthLayoutProps {
	title: string;
	subtitle: string;
	children: ReactNode;
}

const beneficios = [
	{
		icono: <BadgeCheck className="size-5" aria-hidden="true" />,
		titulo: "Inmuebles verificados",
		detalle: "Cada propiedad pasa por una revisión de datos y fotos.",
	},
	{
		icono: <CalendarCheck className="size-5" aria-hidden="true" />,
		titulo: "Visitas coordinadas",
		detalle: "Agenda el día y la hora con un agente responsable.",
	},
	{
		icono: <Wallet className="size-5" aria-hidden="true" />,
		titulo: "Cuotas al día",
		detalle: "Recordatorios y pagos por QR, tarjeta o efectivo.",
	},
];

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
	return (
		<div className="grid min-h-dvh lg:grid-cols-2">
			<div className="flex flex-col px-5 py-8 sm:px-10 lg:px-16 lg:py-12">
				<div className="flex items-center justify-between">
					<Link
						to="/"
						className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
						aria-label="RE/MAX Potosí, ir al inicio"
					>
						<Logo />
					</Link>
					<Link
						to="/"
						className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						<ArrowLeft className="size-4" aria-hidden="true" />
						Volver al sitio
					</Link>
				</div>

				<div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
					<h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
						{title}
					</h1>
					<p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
					<div className="mt-8">{children}</div>
				</div>

				<p className="text-center text-xs text-muted-foreground">
					Prototipo demostrativo · Datos ficticios · RE/MAX Potosí
				</p>
			</div>

			<div className="relative hidden overflow-hidden bg-blue-dark lg:flex lg:flex-col lg:justify-center lg:px-16">
				<BalloonMotif
					className="absolute -top-10 right-4 w-72 opacity-[0.09]"
					opacity={1}
				/>
				<BalloonMotif
					className="absolute -bottom-16 -left-10 w-80 opacity-[0.07]"
					opacity={1}
				/>
				<div className="relative max-w-md">
					<Logo variant="light" />
					<h2 className="mt-10 font-display text-4xl leading-tight font-extrabold text-white">
						Alquila con confianza en Potosí
					</h2>
					<p className="mt-5 text-base leading-relaxed text-white/70">
						Gestiona visitas, contratos y cuotas mensuales desde un solo panel,
						con el respaldo de un equipo que conoce la ciudad.
					</p>

					<ul className="mt-10 space-y-5">
						{beneficios.map((beneficio) => (
							<li key={beneficio.titulo} className="flex gap-4">
								<span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/10 text-white">
									{beneficio.icono}
								</span>
								<span>
									<span className="block font-display text-sm font-bold text-white">
										{beneficio.titulo}
									</span>
									<span className="block text-sm text-white/65">
										{beneficio.detalle}
									</span>
								</span>
							</li>
						))}
					</ul>

					<div className="mt-12 flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 p-4">
						<ShieldCheck
							className="size-6 shrink-0 text-white/80"
							aria-hidden="true"
						/>
						<p className="text-xs text-white/70">
							Contratos formales y cobros registrados. Los pagos y comprobantes
							quedan guardados en tu cuenta.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
