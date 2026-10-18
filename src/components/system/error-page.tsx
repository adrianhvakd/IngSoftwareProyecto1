import { Link } from "@tanstack/react-router";
import { Home, RefreshCw, TriangleAlert } from "lucide-react";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";

interface ErrorPageProps {
	error: unknown;
	reset: () => void;
}

/** Límite de error con la identidad de marca. */
export function ErrorPage({ error, reset }: ErrorPageProps) {
	const mensaje = error instanceof Error ? error.message : "Error desconocido";
	return (
		<PublicLayout>
			<div className="container-page flex flex-col items-center pb-20 pt-10 text-center">
				<span className="grid size-16 place-items-center rounded-full bg-red-50 text-destructive">
					<TriangleAlert className="size-7" aria-hidden="true" />
				</span>
				<h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
					Algo salió mal
				</h1>
				<p className="mt-3 max-w-md text-sm text-muted-foreground">
					Ocurrió un error inesperado al cargar esta vista. Puedes reintentar o
					volver al inicio del portal.
				</p>
				<p className="mt-4 max-w-xl rounded-lg border border-border bg-secondary px-4 py-2 font-mono text-xs text-muted-foreground">
					{mensaje}
				</p>
				<div className="mt-8 flex flex-col gap-3 sm:flex-row">
					<Button variant="cta" onClick={reset}>
						<RefreshCw aria-hidden="true" />
						Reintentar
					</Button>
					<Button asChild variant="outline">
						<Link to="/">
							<Home aria-hidden="true" />
							Ir al inicio
						</Link>
					</Button>
				</div>
			</div>
		</PublicLayout>
	);
}
