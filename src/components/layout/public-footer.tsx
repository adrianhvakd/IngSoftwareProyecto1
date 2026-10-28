import { Link } from "@tanstack/react-router";
import {
	Briefcase,
	Camera,
	Clock,
	Globe,
	Mail,
	MapPin,
	Music2,
	Phone,
	ThumbsUp,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { sitio } from "@/lib/site";

const iconosRed: Record<string, typeof Globe> = {
	Facebook: ThumbsUp,
	Instagram: Camera,
	TikTok: Music2,
	LinkedIn: Briefcase,
};

const enlacesRapidos = [
	{ label: "Inicio", to: "/" as const },
	{ label: "Propiedades en alquiler", to: "/propiedades" as const },
	{ label: "Ingresar", to: "/ingresar" as const },
	{ label: "Crear cuenta", to: "/registro" as const },
];

const tiposBusqueda = [
	{ label: "Casas", tipo: "Casa" as const },
	{ label: "Departamentos", tipo: "Departamento" as const },
	{ label: "Locales", tipo: "Local" as const },
];

export function PublicFooter() {
	return (
		<footer
			id="contacto"
			className="border-t border-blue-dark/20 bg-blue-dark text-white"
		>
			<div className="container-page py-16">
				<div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
					<div>
						<Logo variant="light" />
						<p className="mt-5 max-w-xs text-sm leading-relaxed text-white/70">
							Gestión y alquiler de inmuebles en Potosí. Acompañamos a
							propietarios e inquilinos con procesos claros, contratos formales
							y cobros al día.
						</p>
						<div className="mt-6 flex items-center gap-2">
							{sitio.redes.map((red) => {
								const Icono = iconosRed[red.nombre] ?? Globe;
								return (
									<a
										key={red.nombre}
										href={red.url}
										target="_blank"
										rel="noreferrer noopener"
										aria-label={red.nombre}
										className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors duration-150 ease-out hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
									>
										<Icono className="size-4" aria-hidden="true" />
									</a>
								);
							})}
						</div>
					</div>

					<nav aria-label="Enlaces del sitio">
						<h3 className="font-display text-sm font-bold tracking-wide text-white uppercase">
							Enlaces
						</h3>
						<ul className="mt-5 space-y-3 text-sm">
							{enlacesRapidos.map((enlace) => (
								<li key={enlace.label}>
									<Link
										to={enlace.to}
										className="text-white/70 transition-colors duration-150 ease-out hover:text-white"
									>
										{enlace.label}
									</Link>
								</li>
							))}
						</ul>
					</nav>

					<div>
						<h3 className="font-display text-sm font-bold tracking-wide text-white uppercase">
							Buscar por tipo
						</h3>
						<ul className="mt-5 space-y-3 text-sm">
							{tiposBusqueda.map((tipo) => (
								<li key={tipo.tipo}>
									<Link
										to="/propiedades"
										search={{ tipo: tipo.tipo }}
										className="text-white/70 transition-colors duration-150 ease-out hover:text-white"
									>
										{tipo.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					<div>
						<h3 className="font-display text-sm font-bold tracking-wide text-white uppercase">
							Oficina
						</h3>
						<ul className="mt-5 space-y-4 text-sm text-white/70">
							<li className="flex gap-3">
								<MapPin
									className="mt-0.5 size-4 shrink-0 text-white/50"
									aria-hidden="true"
								/>
								<span>{sitio.direccion}</span>
							</li>
							<li className="flex gap-3">
								<Phone
									className="mt-0.5 size-4 shrink-0 text-white/50"
									aria-hidden="true"
								/>
								<span>
									{sitio.telefono}
									<br />
									WhatsApp {sitio.whatsapp}
								</span>
							</li>
							<li className="flex gap-3">
								<Mail
									className="mt-0.5 size-4 shrink-0 text-white/50"
									aria-hidden="true"
								/>
								<span>{sitio.email}</span>
							</li>
							<li className="flex gap-3">
								<Clock
									className="mt-0.5 size-4 shrink-0 text-white/50"
									aria-hidden="true"
								/>
								<span className="space-y-1">
									{sitio.horarios.map((h) => (
										<span key={h.dias} className="block">
											<span className="text-white/90">{h.dias}:</span> {h.horas}
										</span>
									))}
								</span>
							</li>
						</ul>
					</div>
				</div>

				<div className="mt-14 flex flex-col gap-4 border-t border-white/15 pt-6 text-xs text-white/60 md:flex-row md:items-center md:justify-between">
					<p>
						© {new Date().getFullYear()} RE/MAX Potosí · Oficina independiente.
						Logotipo y marca de RE/MAX usados con fines demostrativos.
					</p>
					<p>Gestión y alquiler de inmuebles en Potosí, Bolivia.</p>
				</div>
			</div>
		</footer>
	);
}
