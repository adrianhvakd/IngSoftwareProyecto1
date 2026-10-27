import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { cn } from "cn";
import {
	Building2,
	CalendarClock,
	CheckCircle2,
	CreditCard,
	Download,
	FileText,
	MapPin,
	ReceiptText,
	Search,
	Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import { SmartImage } from "@/components/common/smart-image";
import {
	alquilerTone,
	cuotaTone,
	StatusBadge,
} from "@/components/common/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { QrVisual } from "@/components/pickers/qr-visual";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getAlquileresDetalle, getPagosDeAlquiler } from "@/data";
import { clienteActual } from "@/data/clientes";
import {
	formatBs,
	formatBsMes,
	formatFecha,
	formatPeriodo,
} from "@/lib/format";

export const Route = createFileRoute("/cliente/mi-alquiler")({
	validateSearch: (search: Record<string, unknown>): { alquiler?: string } => ({
		alquiler: typeof search.alquiler === "string" ? search.alquiler : undefined,
	}),
	head: () => ({
		meta: [{ title: "Mi alquiler · Mi cuenta · RE/MAX Potosí" }],
	}),
	component: ClienteAlquiler,
});

function ClienteAlquiler() {
	const navigate = useNavigate();
	const { alquiler: alquilerParam } = Route.useSearch();

	const alquileres = useMemo(
		() =>
			getAlquileresDetalle().filter((a) => a.clienteId === clienteActual.id),
		[],
	);

	const [pagarAbierto, setPagarAbierto] = useState(false);
	const [pagado, setPagado] = useState(false);

	const seleccionado =
		alquileres.find((a) => a.id === alquilerParam) ??
		alquileres.find((a) => a.estado === "Vigente") ??
		alquileres[0];

	function seleccionar(id: string) {
		setPagado(false);
		void navigate({
			to: "/cliente/mi-alquiler",
			search: { alquiler: id },
			replace: true,
		});
	}

	if (!seleccionado) {
		return (
			<>
				<PageHeader
					title="Mi alquiler"
					description="Aquí verás el detalle de tus contratos, cuotas y pagos."
				/>
				<EmptyState
					icon={<Building2 className="size-6" aria-hidden="true" />}
					title="Aún no tienes un alquiler activo"
					description="Cuando cierres un contrato con RE/MAX Potosí, podrás ver aquí tus cuotas y comprobantes."
					action={
						<Button asChild variant="cta">
							<Link to="/propiedades">
								<Search aria-hidden="true" />
								Buscar propiedades
							</Link>
						</Button>
					}
				/>
			</>
		);
	}

	const inmueble = seleccionado.inmueble;
	const vendedor = seleccionado.vendedor;
	const pagos = getPagosDeAlquiler(seleccionado.id);
	const pendientes = pagos.filter((p) => p.estado !== "Pagada");
	const cuotaActual = pendientes[0];
	const totalPagado = pagos
		.filter((p) => p.estado === "Pagada")
		.reduce((acc, p) => acc + p.monto, 0);
	const alDia = cuotaActual?.estado !== "En mora";

	function confirmarPago() {
		setPagado(true);
		setPagarAbierto(false);
		toast.success("Pago realizado", {
			description: `${formatBs(cuotaActual?.monto ?? 0)} · ${formatPeriodo(cuotaActual?.periodo ?? "")}. (Acción simulada)`,
		});
	}

	return (
		<>
			<PageHeader
				title="Mi alquiler"
				description="Detalle de tus contratos, próxima cuota e historial de pagos."
				actions={
					<Button
						variant="outline"
						onClick={() =>
							toast.info("Descargando contrato", {
								description: `${seleccionado.codigo}.pdf (Acción simulada)`,
							})
						}
					>
						<Download aria-hidden="true" />
						Descargar contrato
					</Button>
				}
			/>

			{alquileres.length > 1 ? (
				<section className="flex flex-col gap-3">
					<h2 className="font-display text-sm font-bold text-foreground">
						Tus contratos ({alquileres.length})
					</h2>
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
						{alquileres.map((a) => {
							const activo = a.id === seleccionado.id;
							return (
								<button
									key={a.id}
									type="button"
									onClick={() => seleccionar(a.id)}
									aria-pressed={activo}
									className={cn(
										"flex items-stretch gap-3 overflow-hidden rounded-xl border bg-card text-left transition-[border-color,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
										activo
											? "border-primary shadow-[var(--shadow-lift)] ring-1 ring-primary"
											: "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-soft)]",
									)}
								>
									<SmartImage
										src={a.inmueble.imagenes[0]}
										alt={a.inmueble.titulo}
										aspectRatio="4 / 3"
										className="hidden w-24 shrink-0 sm:block sm:h-auto"
									/>
									<span className="flex flex-1 flex-col gap-1.5 p-3">
										<span className="text-[11px] font-semibold tracking-wide text-brand-text uppercase">
											{a.codigo}
										</span>
										<span className="line-clamp-2 text-sm font-bold text-foreground">
											{a.inmueble.titulo}
										</span>
										<span className="mt-auto flex flex-wrap items-center justify-between gap-2">
											<span className="font-display text-sm font-bold tabular text-foreground">
												{formatBsMes(a.montoMensual)}
											</span>
											<StatusBadge tone={alquilerTone[a.estado]}>
												{a.estado}
											</StatusBadge>
										</span>
									</span>
								</button>
							);
						})}
					</div>
				</section>
			) : null}

			{cuotaActual ? (
				<Card className="overflow-hidden border-primary/20">
					<div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
						<div>
							<div className="flex items-center gap-2">
								<span className="text-xs font-semibold tracking-wide text-primary uppercase">
									Próxima cuota
								</span>
								<StatusBadge
									tone={pagado ? "success" : cuotaTone[cuotaActual.estado]}
								>
									{pagado ? "Pagada" : cuotaActual.estado}
								</StatusBadge>
							</div>
							<p className="mt-2 font-display text-3xl font-extrabold tabular text-foreground">
								{formatBs(cuotaActual.monto)}
							</p>
							<p className="mt-1 text-sm text-muted-foreground">
								Periodo {formatPeriodo(cuotaActual.periodo)} · vence el{" "}
								{formatFecha(cuotaActual.fechaVencimiento)}
								{cuotaActual.recargoMora > 0
									? ` · incluye recargo de ${formatBs(cuotaActual.recargoMora)}`
									: ""}
							</p>
							{pagado ? (
								<p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-sm font-medium text-success">
									<CheckCircle2 className="size-4" aria-hidden="true" />
									Pago registrado correctamente
								</p>
							) : (
								<Button
									variant="cta"
									className="mt-4"
									onClick={() => setPagarAbierto(true)}
								>
									<CreditCard aria-hidden="true" />
									Pagar cuota
								</Button>
							)}
						</div>
						<div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-secondary/50 p-4 lg:w-72">
							<Metrica
								etiqueta="Alquiler mensual"
								valor={formatBs(seleccionado.montoMensual)}
							/>
							<Metrica
								etiqueta="Día de cobro"
								valor={`Día ${seleccionado.diaCobro}`}
							/>
							<Metrica etiqueta="Total pagado" valor={formatBs(totalPagado)} />
							<Metrica
								etiqueta="Estado contrato"
								valor={seleccionado.estado}
								tono={alDia ? "success" : "danger"}
							/>
						</div>
					</div>
				</Card>
			) : (
				<Card className="border-success/30 bg-success-soft/40">
					<CardContent className="flex items-center gap-3 py-6">
						<CheckCircle2 className="size-6 text-success" aria-hidden="true" />
						<div>
							<p className="font-display font-bold text-foreground">
								Estás al día con tus pagos
							</p>
							<p className="text-sm text-muted-foreground">
								No tienes cuotas pendientes para este contrato.
							</p>
						</div>
					</CardContent>
				</Card>
			)}

			<div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
				<Card className="xl:col-span-2">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 font-display text-lg font-bold">
							<ReceiptText className="size-4 text-primary" aria-hidden="true" />
							Historial de pagos
						</CardTitle>
						<CardDescription>
							{pagos.length} cuotas registradas en este contrato.
						</CardDescription>
					</CardHeader>
					<CardContent className="px-0 pb-2">
						<div className="overflow-x-auto px-1">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="pl-5">Periodo</TableHead>
										<TableHead>Vence</TableHead>
										<TableHead className="hidden sm:table-cell">
											Fecha de pago
										</TableHead>
										<TableHead className="hidden md:table-cell">
											Medio
										</TableHead>
										<TableHead>Monto</TableHead>
										<TableHead className="pr-5 text-right">Estado</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{pagos.map((p) => (
										<TableRow key={p.id}>
											<TableCell className="pl-5 font-medium text-foreground">
												{formatPeriodo(p.periodo)}
											</TableCell>
											<TableCell className="whitespace-nowrap text-muted-foreground">
												{formatFecha(p.fechaVencimiento)}
											</TableCell>
											<TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
												{p.fechaPago ? formatFecha(p.fechaPago) : "—"}
											</TableCell>
											<TableCell className="hidden text-muted-foreground md:table-cell">
												{p.medioPago ?? "—"}
											</TableCell>
											<TableCell className="whitespace-nowrap font-medium tabular text-foreground">
												{formatBs(p.monto)}
											</TableCell>
											<TableCell className="pr-5 text-right">
												<StatusBadge tone={cuotaTone[p.estado]}>
													{p.id === cuotaActual?.id && pagado
														? "Pagada"
														: p.estado}
												</StatusBadge>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>

				<Card className="h-fit">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 font-display text-lg font-bold">
							<FileText className="size-4 text-primary" aria-hidden="true" />
							Detalle del contrato
						</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<div className="rounded-lg border border-border p-4">
							<p className="text-xs text-muted-foreground">Inmueble</p>
							<p className="mt-0.5 font-semibold text-foreground">
								{inmueble.titulo}
							</p>
							<p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
								<MapPin
									className="size-3.5 shrink-0 text-primary/70"
									aria-hidden="true"
								/>
								{inmueble.direccion}
							</p>
							<div className="mt-2">
								<StatusBadge tone={alquilerTone[seleccionado.estado]}>
									Contrato {seleccionado.estado.toLowerCase()}
								</StatusBadge>
							</div>
						</div>

						<Fila etiqueta="Código de contrato" valor={seleccionado.codigo} />
						<Fila
							etiqueta="Inicio"
							valor={formatFecha(seleccionado.fechaInicio)}
						/>
						<Fila etiqueta="Fin" valor={formatFecha(seleccionado.fechaFin)} />
						<Fila
							etiqueta="Alquiler mensual"
							valor={formatBsMes(seleccionado.montoMensual)}
						/>
						<Fila
							etiqueta="Depósito de garantía"
							valor={formatBs(seleccionado.deposito)}
						/>
						<Fila
							etiqueta="Contrato escaneado"
							valor={seleccionado.contratoEscaneado ? "Archivado" : "Pendiente"}
						/>
						<Separator />
						<div className="flex items-center gap-3">
							<span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-soft text-primary">
								<CalendarClock className="size-4" aria-hidden="true" />
							</span>
							<div>
								<p className="text-sm font-medium text-foreground">
									Tu agente RE/MAX
								</p>
								<p className="text-xs text-muted-foreground">
									{vendedor?.nombre ?? "Sin asignar"} ·{" "}
									{vendedor?.telefono ?? "—"}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Dialog open={pagarAbierto} onOpenChange={setPagarAbierto}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="font-display">
							Pagar cuota en línea
						</DialogTitle>
						<DialogDescription>
							Periodo {cuotaActual ? formatPeriodo(cuotaActual.periodo) : ""} ·{" "}
							{formatBs(cuotaActual?.monto ?? 0)}
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col items-center gap-4">
						<div className="grid place-items-center rounded-xl border border-border bg-white p-2">
							<QrVisual
								value={`remax-potosi:${seleccionado.codigo}:${cuotaActual?.monto ?? 0}`}
							/>
						</div>
						<p className="text-center text-sm text-muted-foreground">
							Escanea el código con tu app bancaria o selecciona tarjeta. El
							pago se acredita de inmediato.
						</p>
						<div className="flex w-full flex-col gap-2">
							<Button variant="cta" className="w-full" onClick={confirmarPago}>
								<Wallet aria-hidden="true" />
								Confirmar pago de {formatBs(cuotaActual?.monto ?? 0)}
							</Button>
						</div>
					</div>
					<DialogFooter className="sm:justify-center">
						<Button variant="ghost" onClick={() => setPagarAbierto(false)}>
							Cancelar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

function Metrica({
	etiqueta,
	valor,
	tono = "neutral",
}: {
	etiqueta: string;
	valor: string;
	tono?: "neutral" | "success" | "danger";
}) {
	return (
		<div>
			<p className="text-xs text-muted-foreground">{etiqueta}</p>
			<p
				className={
					tono === "success"
						? "mt-0.5 font-display text-sm font-bold text-success"
						: tono === "danger"
							? "mt-0.5 font-display text-sm font-bold text-destructive"
							: "mt-0.5 font-display text-sm font-bold tabular text-foreground"
				}
			>
				{valor}
			</p>
		</div>
	);
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
	return (
		<div className="flex items-center justify-between gap-3">
			<span className="text-sm text-muted-foreground">{etiqueta}</span>
			<span className="text-right text-sm font-medium text-foreground">
				{valor}
			</span>
		</div>
	);
}
