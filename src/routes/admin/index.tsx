import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowRight,
	BadgeDollarSign,
	Building2,
	CalendarCheck,
	CircleAlert,
	FileSignature,
	ReceiptText,
	TriangleAlert,
	Users,
	Wallet,
} from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import {
	cuotaTone,
	StatusBadge,
	visitaTone,
} from "@/components/common/status-badge";
import { IncomeChart } from "@/components/dashboard/charts/income-chart";
import { VisitsChart } from "@/components/dashboard/charts/visits-chart";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	formatBs,
	formatFecha,
	formatFechaSemana,
	formatHora,
	iniciales,
} from "@/lib/format";
import { obtenerDashboardAdmin } from "@/server/admin/dashboard";

export const Route = createFileRoute("/admin/")({
	loader: () => obtenerDashboardAdmin(),
	head: () => ({
		meta: [{ title: "Dashboard · Administración · RE/MAX Potosí" }],
	}),
	component: AdminDashboard,
});

function AdminDashboard() {
	const { resumen, proximasVisitas, alertas, ingresos, visitasPorEstado } =
		Route.useLoaderData();

	return (
		<>
			<PageHeader
				title="Panel general"
				description="Resumen operativo de la oficina RE/MAX Potosí: cartera, visitas, contratos y cobros."
				actions={
					<>
						<Button asChild variant="outline">
							<Link to="/admin/alquileres">
								<ReceiptText aria-hidden="true" />
								Ver cobros
							</Link>
						</Button>
						<Button asChild variant="cta">
							<Link to="/admin/inmuebles/nuevo">
								<FileSignature aria-hidden="true" />
								Publicar inmueble
							</Link>
						</Button>
					</>
				}
			/>

			<section
				aria-label="Indicadores principales"
				className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
			>
				<StatCard
					label="Inmuebles publicados"
					valor={String(resumen.inmueblesActivos)}
					icono={<Building2 className="size-4" aria-hidden="true" />}
					tono="primary"
				/>
				<StatCard
					label="Visitas esta semana"
					valor={String(resumen.visitasSemana)}
					icono={<CalendarCheck className="size-4" aria-hidden="true" />}
					tono="success"
					hint="Agendadas en los últimos 7 días"
				/>
				<StatCard
					label="Alquileres vigentes"
					valor={String(resumen.alquileresVigentes)}
					icono={<Users className="size-4" aria-hidden="true" />}
					tono="primary"
				/>
				<StatCard
					label="Cobros del mes"
					valor={formatBs(resumen.cobrosDelMes)}
					icono={<Wallet className="size-4" aria-hidden="true" />}
					tono="primary"
				/>
			</section>

			<section
				aria-label="Indicadores de mora"
				className="grid grid-cols-1 gap-4 sm:grid-cols-3"
			>
				<StatCard
					label="Cuotas en mora"
					valor={String(resumen.cuotasEnMora)}
					icono={<CircleAlert className="size-4" aria-hidden="true" />}
					tono="danger"
					hint="Requieren seguimiento de cobranza"
				/>
				<StatCard
					label="Cuotas por vencer"
					valor={String(resumen.cuotasPorVencer)}
					icono={<TriangleAlert className="size-4" aria-hidden="true" />}
					tono="warning"
					hint="Recordatorios programados"
				/>
				<StatCard
					label="Mora acumulada"
					valor={formatBs(resumen.moraTotal)}
					icono={<BadgeDollarSign className="size-4" aria-hidden="true" />}
					tono="cta"
					hint={`${resumen.morosidadPorcentaje}% sobre lo esperado del mes`}
				/>
			</section>

			<section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
				<Card className="xl:col-span-2">
					<CardHeader>
						<CardTitle className="font-display text-lg font-bold">
							Ingresos por cobros
						</CardTitle>
						<CardDescription>
							Monto cobrado y comisiones estimadas por mes (últimos 8 meses).
						</CardDescription>
					</CardHeader>
					<CardContent className="px-3 pb-4 sm:px-6">
						<IncomeChart data={ingresos} />
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="font-display text-lg font-bold">
							Estado de visitas
						</CardTitle>
						<CardDescription>
							Distribución del total de visitas agendadas.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<VisitsChart data={visitasPorEstado} />
					</CardContent>
				</Card>
			</section>

			<section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
				<Card className="xl:col-span-2">
					<CardHeader>
						<CardTitle className="font-display text-lg font-bold">
							Próximas visitas
						</CardTitle>
						<CardDescription>
							Citas pendientes con fecha a partir de hoy.
						</CardDescription>
						<CardHeaderAction to="/admin/visitas" label="Ver agenda" />
					</CardHeader>
					<CardContent className="px-0 pb-2">
						{proximasVisitas.length === 0 ? (
							<div className="px-6 pb-4">
								<EmptyState
									icon={<CalendarCheck className="size-6" aria-hidden="true" />}
									title="Sin visitas próximas"
									description="Cuando los clientes agenden visitas aparecerán aquí."
								/>
							</div>
						) : (
							<div className="overflow-x-auto px-1">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="pl-5">Cliente</TableHead>
											<TableHead>Inmueble</TableHead>
											<TableHead>Fecha</TableHead>
											<TableHead className="hidden md:table-cell">
												Agente
											</TableHead>
											<TableHead className="pr-5 text-right">Estado</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{proximasVisitas.map((v) => (
											<TableRow key={v.id}>
												<TableCell className="pl-5">
													<div className="flex items-center gap-3">
														<Avatar className="size-8">
															<AvatarImage
																src={v.cliente.avatarUrl}
																alt={v.cliente.nombre}
															/>
															<AvatarFallback className="bg-blue-soft text-xs text-primary">
																{iniciales(v.cliente.nombre)}
															</AvatarFallback>
														</Avatar>
														<span className="font-medium text-foreground">
															{v.cliente.nombre
																.split(" ")
																.slice(0, 2)
																.join(" ")}
														</span>
													</div>
												</TableCell>
												<TableCell>
													<span className="block max-w-[220px] truncate font-medium text-foreground">
														{v.inmueble.titulo}
													</span>
													<span className="text-xs text-muted-foreground">
														{v.inmueble.codigo}
													</span>
												</TableCell>
												<TableCell className="whitespace-nowrap text-muted-foreground">
													{formatFechaSemana(v.fechaHora)} ·{" "}
													{formatHora(v.fechaHora)}
												</TableCell>
												<TableCell className="hidden text-muted-foreground md:table-cell">
													{v.vendedor ? (
														v.vendedor.nombre.split(" ").slice(0, 2).join(" ")
													) : (
														<span className="text-warning">Sin asignar</span>
													)}
												</TableCell>
												<TableCell className="pr-5 text-right">
													<StatusBadge tone={visitaTone[v.estado]}>
														{v.estado}
													</StatusBadge>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="font-display text-lg font-bold">
							Alertas de vencimiento
						</CardTitle>
						<CardDescription>Contratos con cuotas por cobrar.</CardDescription>
						<CardHeaderAction to="/admin/alquileres" label="Cobros" />
					</CardHeader>
					<CardContent className="flex flex-col gap-1 px-2 pb-3">
						{alertas.length === 0 ? (
							<div className="px-2">
								<EmptyState
									icon={
										<BadgeDollarSign className="size-6" aria-hidden="true" />
									}
									title="Todo al día"
									description="No hay cuotas pendientes ni en mora."
								/>
							</div>
						) : (
							alertas.map((a) => (
								<Link
									key={a.id}
									to="/admin/alquileres"
									className="flex items-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
								>
									<span
										className={
											a.estado === "En mora"
												? "mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-red-50 text-destructive"
												: "mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-warning-soft text-warning"
										}
									>
										{a.estado === "En mora" ? (
											<CircleAlert className="size-4" aria-hidden="true" />
										) : (
											<TriangleAlert className="size-4" aria-hidden="true" />
										)}
									</span>
									<span className="min-w-0 flex-1">
										<span className="flex items-center justify-between gap-2">
											<span className="truncate text-sm font-semibold text-foreground">
												{a.clienteNombre}
											</span>
											<StatusBadge tone={cuotaTone[a.estado]}>
												{a.estado}
											</StatusBadge>
										</span>
										<span className="mt-0.5 block truncate text-xs text-muted-foreground">
											{a.inmuebleCodigo} · vence{" "}
											{formatFecha(a.fechaVencimiento)}
										</span>
										<span className="mt-0.5 block font-display text-sm font-bold tabular text-foreground">
											{formatBs(a.monto)}
										</span>
									</span>
								</Link>
							))
						)}
					</CardContent>
				</Card>
			</section>
		</>
	);
}

function CardHeaderAction({ to, label }: { to: string; label: string }) {
	return (
		<CardAction>
			<Link
				to={to}
				className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors duration-150 hover:text-blue-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
			>
				{label}
				<ArrowRight className="size-3.5" aria-hidden="true" />
			</Link>
		</CardAction>
	);
}
