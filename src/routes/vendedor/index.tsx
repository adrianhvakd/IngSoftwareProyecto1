import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	CalendarCheck,
	FileSignature,
	HandCoins,
	MapPin,
	TrendingUp,
	Wallet,
} from "lucide-react";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/common/empty-state";
import {
	alquilerTone,
	StatusBadge,
	visitaTone,
} from "@/components/common/status-badge";
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
import {
	getAlquileresDetalle,
	getComisionesVendedor,
	getVisitasDetalle,
} from "@/data";
import { pagos } from "@/data/pagos";
import { vendedorActual } from "@/data/vendedores";
import {
	formatBs,
	formatFechaSemana,
	formatHora,
	formatPeriodo,
} from "@/lib/format";

export const Route = createFileRoute("/vendedor/")({
	head: () => ({
		meta: [{ title: "Inicio · Panel vendedor · RE/MAX Potosí" }],
	}),
	component: VendedorInicio,
});

const HOY = new Date("2026-10-17T00:00:00").getTime();

function VendedorInicio() {
	const misVisitas = getVisitasDetalle().filter(
		(v) => v.vendedorId === vendedorActual.id,
	);
	const proximas = misVisitas
		.filter(
			(v) => v.estado === "Pendiente" && new Date(v.fechaHora).getTime() >= HOY,
		)
		.slice(0, 4);

	const misAlquileres = getAlquileresDetalle().filter(
		(a) => a.vendedorId === vendedorActual.id,
	);
	const comisiones = getComisionesVendedor(vendedorActual.id);
	const misRegistros = pagos.filter(
		(p) =>
			p.registradoPor === vendedorActual.nombre &&
			p.fechaPago?.startsWith("2026-10"),
	);
	const cobradoMes = misRegistros.reduce((acc, p) => acc + p.monto, 0);

	return (
		<>
			<PageHeader
				title={`Hola, ${vendedorActual.nombre.split(" ")[0]}`}
				description="Tu resumen operativo: visitas asignadas, contratos cerrados y comisiones acumuladas."
				actions={
					<Button asChild variant="cta">
						<Link to="/vendedor/cierre-alquiler">
							<FileSignature aria-hidden="true" />
							Cerrar alquiler
						</Link>
					</Button>
				}
			/>

			<section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<StatCard
					label="Visitas pendientes"
					valor={String(
						misVisitas.filter((v) => v.estado === "Pendiente").length,
					)}
					icono={<CalendarCheck className="size-4" aria-hidden="true" />}
					tono="primary"
					hint={`${misVisitas.length} visitas asignadas`}
				/>
				<StatCard
					label="Alquileres cerrados"
					valor={String(vendedorActual.alquileresCerrados)}
					icono={<TrendingUp className="size-4" aria-hidden="true" />}
					tono="success"
					hint="Histórico en la oficina"
				/>
				<StatCard
					label="Comisiones acumuladas"
					valor={formatBs(comisiones)}
					icono={<HandCoins className="size-4" aria-hidden="true" />}
					tono="primary"
					hint={`Comisión fija ${formatBs(vendedorActual.comisionFija)} por cierre`}
				/>
				<StatCard
					label="Cobros registrados (oct.)"
					valor={formatBs(cobradoMes)}
					icono={<Wallet className="size-4" aria-hidden="true" />}
					tono="primary"
					hint={`${misRegistros.length} pagos este mes`}
				/>
			</section>

			<section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
				<Card className="xl:col-span-2">
					<CardHeader>
						<CardTitle className="font-display text-lg font-bold">
							Mis próximas visitas
						</CardTitle>
						<CardDescription>
							Citas pendientes que tienes asignadas.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-1 px-2 pb-3">
						{proximas.length === 0 ? (
							<div className="px-2">
								<EmptyState
									icon={<CalendarCheck className="size-6" aria-hidden="true" />}
									title="Sin visitas próximas"
									description="No tienes visitas pendientes asignadas por ahora."
								/>
							</div>
						) : (
							proximas.map((v) => (
								<Link
									key={v.id}
									to="/vendedor/visitas"
									className="flex items-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
								>
									<span className="grid size-11 shrink-0 flex-col place-items-center rounded-lg bg-blue-soft text-primary">
										<span className="font-display text-sm font-bold tabular">
											{formatHora(v.fechaHora)}
										</span>
									</span>
									<span className="min-w-0 flex-1">
										<span className="flex items-center justify-between gap-2">
											<span className="truncate text-sm font-semibold text-foreground">
												{v.cliente.nombre}
											</span>
											<StatusBadge tone={visitaTone[v.estado]}>
												{v.estado}
											</StatusBadge>
										</span>
										<span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
											<MapPin
												className="size-3 shrink-0 text-primary/70"
												aria-hidden="true"
											/>
											<span className="truncate">{v.inmueble.titulo}</span>
										</span>
										<span className="mt-0.5 block text-xs text-muted-foreground">
											{formatFechaSemana(v.fechaHora)} ·{" "}
											{v.cliente.telefonoContacto}
										</span>
									</span>
								</Link>
							))
						)}
					</CardContent>
				</Card>

				<div className="flex flex-col gap-6">
					<Card>
						<CardHeader>
							<CardTitle className="font-display text-lg font-bold">
								Acciones rápidas
							</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-3">
							<AccionRapida
								to="/vendedor/cierre-alquiler"
								icono={<FileSignature className="size-4" aria-hidden="true" />}
								titulo="Cierre de alquiler"
								detalle="Genera el contrato en 3 pasos"
							/>
							<AccionRapida
								to="/vendedor/registrar-pago"
								icono={<Wallet className="size-4" aria-hidden="true" />}
								titulo="Registrar pago"
								detalle="Cobra una cuota con comprobante"
							/>
							<AccionRapida
								to="/vendedor/comisiones"
								icono={<HandCoins className="size-4" aria-hidden="true" />}
								titulo="Mis comisiones"
								detalle="Detalle por contrato cerrado"
							/>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="font-display text-lg font-bold">
								Mis contratos
							</CardTitle>
							<CardDescription>
								{misAlquileres.length} contrato(s) con tu gestión.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-2 px-4 pb-4">
							{misAlquileres.slice(0, 4).map((a) => (
								<div
									key={a.id}
									className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5"
								>
									<div className="min-w-0">
										<p className="truncate text-sm font-medium text-foreground">
											{a.inmueble.titulo}
										</p>
										<p className="text-xs text-muted-foreground">
											{a.codigo} · desde{" "}
											{formatPeriodo(a.fechaInicio.slice(0, 7))}
										</p>
									</div>
									<StatusBadge tone={alquilerTone[a.estado]}>
										{a.estado}
									</StatusBadge>
								</div>
							))}
						</CardContent>
					</Card>
				</div>
			</section>
		</>
	);
}

function AccionRapida({
	to,
	icono,
	titulo,
	detalle,
}: {
	to: string;
	icono: ReactNode;
	titulo: string;
	detalle: string;
}) {
	return (
		<Link
			to={to}
			className="group flex items-center gap-3 rounded-lg border border-border px-3 py-3 transition-colors duration-150 hover:border-primary/30 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
		>
			<span className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-soft text-primary">
				{icono}
			</span>
			<span className="min-w-0 flex-1">
				<span className="block text-sm font-semibold text-foreground">
					{titulo}
				</span>
				<span className="block truncate text-xs text-muted-foreground">
					{detalle}
				</span>
			</span>
			<ArrowRight
				className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5"
				aria-hidden="true"
			/>
		</Link>
	);
}
