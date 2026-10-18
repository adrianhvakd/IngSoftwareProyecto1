import { Link } from "@tanstack/react-router";
import { Compass, Home, Search } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";

/** Página 404 con la identidad de marca. */
export function NotFoundPage() {
	return (
		<PublicLayout>
			<div className="container-page flex flex-col items-center pb-20 pt-10 text-center">
				<Logo className="mb-8" />
				<p className="font-display text-[88px] leading-none font-extrabold tracking-tight text-primary sm:text-[120px]">
					404
				</p>
				<h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
					No encontramos esta página
				</h1>
				<p className="mt-3 max-w-md text-sm text-muted-foreground">
					La dirección que buscas no existe o fue movida. Vuelve al inicio o
					explora las propiedades disponibles en Potosí.
				</p>
				<div className="mt-8 flex flex-col gap-3 sm:flex-row">
					<Button asChild variant="cta">
						<Link to="/propiedades">
							<Search aria-hidden="true" />
							Buscar propiedades
						</Link>
					</Button>
					<Button asChild variant="outline">
						<Link to="/">
							<Home aria-hidden="true" />
							Ir al inicio
						</Link>
					</Button>
				</div>

				<div className="mt-16 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
					<Enlace404
						to="/propiedades"
						icono={<Search className="size-4" aria-hidden="true" />}
						titulo="Propiedades"
					/>
					<Enlace404
						to="/"
						hash="como-funciona"
						icono={<Compass className="size-4" aria-hidden="true" />}
						titulo="Cómo funciona"
					/>
					<Enlace404
						to="/registro"
						icono={<Home className="size-4" aria-hidden="true" />}
						titulo="Publicar con nosotros"
					/>
				</div>
			</div>
		</PublicLayout>
	);
}

function Enlace404({
	to,
	hash,
	icono,
	titulo,
}: {
	to: "/propiedades" | "/" | "/registro";
	hash?: string;
	icono: ReactNode;
	titulo: string;
}) {
	return (
		<Link
			to={to}
			hash={hash}
			className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/30 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
		>
			<span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-soft text-primary">
				{icono}
			</span>
			<span className="text-sm font-semibold text-foreground">{titulo}</span>
		</Link>
	);
}
