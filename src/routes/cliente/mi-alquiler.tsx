import {
	createFileRoute,
	Link,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
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
import { useState } from "react";
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
import {
	formatBs,
	formatBsMes,
	formatFecha,
	formatPeriodo,
} from "@/lib/format";
import { listarAlquileresCliente } from "@/server/alquileres/consultas";
import { reportarPagoCliente } from "@/server/alquileres/registrar";
import type { AlquilerDetalleVista } from "@/types/alquileres";

export const Route = createFileRoute("/cliente/mi-alquiler")({
	loader: () => listarAlquileresCliente(),
	validateSearch: (search: Record<string, unknown>): { alquiler?: string } => ({
		alquiler: typeof search.alquiler === "string" ? search.alquiler : undefined,
	}),
	head: () => ({
		meta: [{ title: "Mi alquiler · Mi cuenta · RE/MAX Potosí" }],
	}),
	component: ClienteAlquiler,
});

function ClienteAlquiler() {
	const router = useRouter();
	const navigate = useNavigate();
	const { alquiler: alquilerParam } = Route.useSearch();
	const alquileres = Route.useLoaderData();

	const [pagarAbierto, setPagarAbierto] = useState(false);
	const [enviando, setEnviando] = useState(false);

	const seleccionado =
		alquileres.find((a) => a.id === alquilerParam) ??
		alquileres.find((a) => a.estado === "Vigente") ??
		alquileres[0];

	function seleccionar(id: string) {
		setPagarAbierto(false);
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

	return (
		<DetalleContrato
			alquiler={seleccionado}
			alquileres={alquileres}
			pagarAbierto={pagarAbierto}
			enviando={enviando}
			onSeleccionar={seleccionar}
			onAbrirPago={() => setPagarAbierto(true)}
			onCerrarPago={() => setPagarAbierto(false)}
			onConfirmarPago={async () => {
				const cuota = seleccionado.cuotaActual;
				if (!cuota) {
					toast.error("No tienes cuotas pendientes");
					return;
				}

				setEnviando(true);
				try {
					await reportarPagoCliente({
						data: {
							alquilerId: seleccionado.id,
							cuotaId: cuota.id,
							monto: cuota.monto,
						},
					});
					setPagarAbierto(false);
					toast.success("Pago reportado", {
						description: `${formatBs(cuota.monto)} · ${formatPeriodo(cuota.periodo)}. Queda pendiente de validación.`,
					});
					await router.invalidate();
				} catch (error) {
					toast.error("No se pudo reportar el pago", {
						description:
							error instanceof Error
								? error.message
								: "Inténtalo de nuevo en unos segundos.",
					});
				} finally {
					setEnviando(false);
				}
			}}
			onDescargarContrato={() => {
				if (!seleccionado.contratoUrl) {
					toast.info("Contrato no disponible", {
						description:
							"Tu contrato aún no tiene el PDF firmado en el almacenamiento.",
					});
					return;
				}
				window.open(seleccionado.contratoUrl, "_blank", "noopener,noreferrer");
			}}
		/>
	);
}

function DetalleContrato({
	alquiler,
	alquileres,
	pagarAbierto,
	enviando,
	onSeleccionar,
	onAbrirPago,
	onCerrarPago,
	onConfirmarPago,
	onDescargarContrato,
}: {
	alquiler: AlquilerDetalleVista;
	alquileres: AlquilerDetalleVista[];
	pagarAbierto: boolean;
	enviando: boolean;
	onSeleccionar: (id: string) => void;
	onAbrirPago: () => void;
	onCerrarPago: () => void;
	onConfirmarPago: () => Promise<void>;
	onDescargarContrato: () => void;
}) {
	const inmueble = alquiler.inmueble;
	const vendedor = alquiler.vendedor;
	const pagos = alquiler.pagos;
	const pendientes = pagos.filter(
		(p) => p.estado !== "Pagada" && p.estado !== "Anulada",
	);
	const cuotaActual = alquiler.cuotaActual ?? pendientes[0];
	const totalPagado = pagos
		.filter((p) => p.estado === "Pagada")
		.reduce((acc, p) => acc + p.monto, 0);
	const alDia = cuotaActual?.estado !== "En mora";

	return (
		<>
			<PageHeader
				title="Mi alquiler"
				description="Detalle de tus contratos, próxima cuota e historial de pagos."
				actions={
					<Button variant="outline" onClick={onDescargarContrato}>
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
							const activo = a.id === alquiler.id;
							return (
								<button
									key={a.id}
									type="button"
									onClick={() => onSeleccionar(a.id)}
									aria-pressed={activo}
									className={cn(
										"flex items-stretch gap-3 overflow-hidden rounded-xl border bg-card text-left transition-[border-color,box-shadow,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
										activo
											? "border-primary shadow-(--shadow-lift) ring-1 ring-primary"
											: "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-(--shadow-soft)",
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
								<StatusBadge tone={cuotaTone[cuotaActual.estado]}>
									{cuotaActual.estado}
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
							<Button
								variant="cta"
								className="mt-4"
								onClick={onAbrirPago}
								disabled={enviando}
							>
								<CreditCard aria-hidden="true" />
								Pagar cuota
							</Button>
						</div>
						<div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-secondary/50 p-4 lg:w-72">
							<Metrica
								etiqueta="Alquiler mensual"
								valor={formatBs(alquiler.montoMensual)}
							/>
							<Metrica
								etiqueta="Día de cobro"
								valor={`Día ${alquiler.diaCobro}`}
							/>
							<Metrica etiqueta="Total pagado" valor={formatBs(totalPagado)} />
							<Metrica
								etiqueta="Estado contrato"
								valor={alquiler.estado}
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
										<TableHead className="hidden lg:table-cell">
											Comprobante
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
											<TableCell className="hidden lg:table-cell">
												{p.comprobante ? (
													<Button asChild variant="ghost" size="icon-sm">
														<a
															href={p.comprobante}
															target="_blank"
															rel="noreferrer"
															aria-label={`Ver comprobante de la cuota ${p.numeroCuota}`}
														>
															<Download aria-hidden="true" />
														</a>
													</Button>
												) : (
													<span className="text-xs text-muted-foreground">
														—
													</span>
												)}
											</TableCell>
											<TableCell className="whitespace-nowrap font-medium tabular text-foreground">
												{formatBs(p.monto)}
											</TableCell>
											<TableCell className="pr-5 text-right">
												<StatusBadge tone={cuotaTone[p.estado]}>
													{p.estado}
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
								<StatusBadge tone={alquilerTone[alquiler.estado]}>
									Contrato {alquiler.estado.toLowerCase()}
								</StatusBadge>
							</div>
						</div>

						<Fila etiqueta="Código de contrato" valor={alquiler.codigo} />
						<Fila etiqueta="Inicio" valor={formatFecha(alquiler.fechaInicio)} />
						<Fila etiqueta="Fin" valor={formatFecha(alquiler.fechaFin)} />
						<Fila
							etiqueta="Alquiler mensual"
							valor={formatBsMes(alquiler.montoMensual)}
						/>
						<Fila
							etiqueta="Depósito de garantía"
							valor={formatBs(alquiler.deposito)}
						/>
						<Fila
							etiqueta="Contrato escaneado"
							valor={alquiler.contratoEscaneado ? "Archivado" : "Pendiente"}
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
									{vendedor?.telefono || "—"}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Dialog
				open={pagarAbierto}
				onOpenChange={(open) => (open ? onAbrirPago() : onCerrarPago())}
			>
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
								value={`remax-potosi:${alquiler.codigo}:${cuotaActual?.monto ?? 0}`}
							/>
						</div>
						<p className="text-center text-sm text-muted-foreground">
							Escanea el código con tu app bancaria. El pago quedará reportado y
							pendiente de validación por la oficina.
						</p>
						<div className="flex w-full flex-col gap-2">
							<Button
								variant="cta"
								className="w-full"
								onClick={() => void onConfirmarPago()}
								disabled={enviando || !cuotaActual}
							>
								<Wallet aria-hidden="true" />
								{enviando
									? "Reportando…"
									: `Confirmar pago de ${formatBs(cuotaActual?.monto ?? 0)}`}
							</Button>
						</div>
					</div>
					<DialogFooter className="sm:justify-center">
						<Button variant="ghost" onClick={onCerrarPago} disabled={enviando}>
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
