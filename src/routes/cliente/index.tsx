import { createFileRoute, Link } from "@tanstack/react-router";
import {
	Building2,
	CalendarCheck,
	CalendarDays,
	Clock,
	MapPin,
	Search,
	UserRound,
	X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge, visitaTone } from "@/components/common/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { VisitaDetalle } from "@/data";
import { getVisitasDetalle } from "@/data";
import { clienteActual } from "@/data/clientes";
import { formatFechaSemana, formatHora } from "@/lib/format";

export const Route = createFileRoute("/cliente/")({
	head: () => ({
		meta: [{ title: "Mis visitas · Mi cuenta · RE/MAX Potosí" }],
	}),
	component: ClienteVisitas,
});

function ClienteVisitas() {
	const [lista, setLista] = useState<VisitaDetalle[]>(() =>
		getVisitasDetalle().filter((v) => v.clienteId === clienteActual.id),
	);

	const pendientes = useMemo(
		() => lista.filter((v) => v.estado === "Pendiente"),
		[lista],
	);
	const realizadas = useMemo(
		() => lista.filter((v) => v.estado === "Realizada"),
		[lista],
	);

	function cancelar(visitaId: string) {
		setLista((prev) =>
			prev.map((v) => (v.id === visitaId ? { ...v, estado: "Cancelada" } : v)),
		);
		toast.info("Visita cancelada", {
			description:
				"Coordinaremos una nueva fecha si lo necesitas. (Acción simulada)",
		});
	}

	return (
		<>
			<PageHeader
				title="Mis visitas"
				description="Sigue el estado de las visitas que agendaste y coordina con tu agente."
				actions={
					<Button asChild variant="cta">
						<Link to="/propiedades">
							<Search aria-hidden="true" />
							Buscar propiedades
						</Link>
					</Button>
				}
			/>

			<section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<StatCard
					label="Visitas agendadas"
					valor={String(lista.length)}
					icono={<CalendarCheck className="size-4" aria-hidden="true" />}
					tono="primary"
					hint="Total con RE/MAX Potosí"
				/>
				<StatCard
					label="Visitas pendientes"
					valor={String(pendientes.length)}
					icono={<CalendarDays className="size-4" aria-hidden="true" />}
					tono="warning"
					hint="Citas por confirmar"
				/>
				<StatCard
					label="Visitas realizadas"
					valor={String(realizadas.length)}
					icono={<Building2 className="size-4" aria-hidden="true" />}
					tono="success"
					hint="Ya visitaste estos inmuebles"
				/>
			</section>

			<Card>
				<CardHeader>
					<CardTitle className="font-display text-lg font-bold">
						Próximas visitas
					</CardTitle>
					<CardDescription>
						Tienes {pendientes.length} visita(s) pendiente(s).
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-3 px-4 pb-4">
					{pendientes.length === 0 ? (
						<EmptyState
							icon={<CalendarCheck className="size-6" aria-hidden="true" />}
							title="No tienes visitas pendientes"
							description="Explora el catálogo y agenda una visita al inmueble que te interese."
							action={
								<Button asChild variant="cta">
									<Link to="/propiedades">Buscar propiedades</Link>
								</Button>
							}
						/>
					) : (
						pendientes.map((v) => (
							<article
								key={v.id}
								className="flex flex-col gap-4 rounded-xl border border-border p-4 sm:flex-row sm:items-center"
							>
								<div className="flex items-center gap-4 sm:flex-1">
									<div className="flex w-16 shrink-0 flex-col items-center rounded-lg bg-blue-soft py-2">
										<span className="font-display text-lg font-extrabold tabular text-primary">
											{formatHora(v.fechaHora)}
										</span>
										<span className="text-[10px] text-muted-foreground">
											{formatFechaSemana(v.fechaHora)}
										</span>
									</div>
									<div className="min-w-0">
										<p className="truncate font-semibold text-foreground">
											{v.inmueble.titulo}
										</p>
										<p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
											<MapPin
												className="size-3 shrink-0 text-primary/70"
												aria-hidden="true"
											/>
											<span className="truncate">
												{v.inmueble.zona} · {v.inmueble.codigo}
											</span>
										</p>
										<p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
											<UserRound
												className="size-3 shrink-0 text-primary/70"
												aria-hidden="true"
											/>
											Agente: {v.vendedor?.nombre ?? "por asignar"}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<StatusBadge tone={visitaTone[v.estado]}>
										{v.estado}
									</StatusBadge>
									<Button
										variant="ghost"
										size="sm"
										className="text-muted-foreground"
										onClick={() => cancelar(v.id)}
									>
										<X aria-hidden="true" />
										Cancelar
									</Button>
								</div>
							</article>
						))
					)}
				</CardContent>
			</Card>

			{lista.length > 0 ? (
				<Card>
					<CardHeader>
						<CardTitle className="font-display text-lg font-bold">
							Historial de visitas
						</CardTitle>
						<CardDescription>
							Todas las visitas que has agendado.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-2 px-4 pb-4">
						{lista.map((v) => (
							<div
								key={v.id}
								className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
							>
								<div className="flex min-w-0 items-center gap-3">
									<Clock
										className="size-4 shrink-0 text-muted-foreground"
										aria-hidden="true"
									/>
									<div className="min-w-0">
										<p className="truncate text-sm font-medium text-foreground">
											{v.inmueble.titulo}
										</p>
										<p className="text-xs text-muted-foreground">
											{formatFechaSemana(v.fechaHora)} ·{" "}
											{formatHora(v.fechaHora)}
										</p>
									</div>
								</div>
								<StatusBadge tone={visitaTone[v.estado]}>
									{v.estado}
								</StatusBadge>
							</div>
						))}
					</CardContent>
				</Card>
			) : null}
		</>
	);
}
