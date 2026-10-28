import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { cn } from "cn";
import {
	ArrowLeft,
	Banknote,
	CheckCircle2,
	CreditCard,
	FileCheck2,
	Landmark,
	QrCode,
	Smartphone,
	Upload,
	Wallet,
	X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { cuotaTone, StatusBadge } from "@/components/common/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { QrVisual } from "@/components/pickers/qr-visual";
import { RentalPicker } from "@/components/pickers/rental-picker";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MEDIO_PAGO_UI_A_DB } from "@/lib/alquileres";
import { formatBs, formatFecha, formatPeriodo } from "@/lib/format";
import { eliminarArchivosAlquiler, subirComprobanteCuota } from "@/lib/storage";
import { listarAlquileresVendedor } from "@/server/alquileres/consultas";
import { registrarPagoCuota } from "@/server/alquileres/registrar";
import type { MedioPago } from "@/types/models";

export const Route = createFileRoute("/vendedor/registrar-pago")({
	loader: () => listarAlquileresVendedor(),
	head: () => ({
		meta: [{ title: "Registrar pago · Panel vendedor · RE/MAX Potosí" }],
	}),
	component: RegistrarPago,
});

interface MetodoPago {
	id: MedioPago;
	titulo: string;
	detalle: string;
	icono: typeof CreditCard;
}

const METODOS: MetodoPago[] = [
	{
		id: "Transferencia QR",
		titulo: "Transferencia QR",
		detalle: "Pago inmediato desde app bancaria",
		icono: QrCode,
	},
	{
		id: "Tarjeta de crédito",
		titulo: "Tarjeta de crédito",
		detalle: "Cobro con terminal POS",
		icono: CreditCard,
	},
	{
		id: "Tarjeta de débito",
		titulo: "Tarjeta de débito",
		detalle: "Cobro con terminal POS",
		icono: Smartphone,
	},
	{
		id: "Efectivo",
		titulo: "Efectivo",
		detalle: "Pago en oficina RE/MAX Potosí",
		icono: Banknote,
	},
	{
		id: "Otro",
		titulo: "Otros",
		detalle: "Depósito, cheque u otro medio",
		icono: Landmark,
	},
];

function RegistrarPago() {
	const router = useRouter();
	const cargados = Route.useLoaderData();

	const alquileres = useMemo(
		() => cargados.filter((alquiler) => alquiler.estado === "Vigente"),
		[cargados],
	);

	const inicial = useMemo(() => {
		const conMora = alquileres.find((a) => a.cuotaActual?.estado === "En mora");
		return conMora ?? alquileres[0];
	}, [alquileres]);

	const [alquilerId, setAlquilerId] = useState<string | null>(
		inicial?.id ?? null,
	);
	const [seleccion, setSeleccion] = useState<string[]>([]);
	const [medio, setMedio] = useState<MedioPago>("Transferencia QR");
	const [comprobante, setComprobante] = useState<File | null>(null);
	const [arrastrando, setArrastrando] = useState(false);
	const [registrado, setRegistrado] = useState(false);
	const [enviando, setEnviando] = useState(false);
	const inputComprobante = useRef<HTMLInputElement>(null);

	const alquiler = alquileres.find((a) => a.id === alquilerId) ?? null;
	const cuotas = alquiler?.pagos ?? [];
	const pendientes = cuotas.filter(
		(c) => c.estado !== "Pagada" && c.estado !== "Anulada",
	);

	useEffect(() => {
		if (!alquilerId || !alquileres.some((a) => a.id === alquilerId)) {
			setAlquilerId(alquileres[0]?.id ?? null);
		}
	}, [alquileres, alquilerId]);

	// Al cambiar de contrato, selecciona la cuota actual por defecto.
	useEffect(() => {
		if (!alquiler) {
			setSeleccion([]);
			return;
		}
		const porDefecto = alquiler.cuotaActual?.id
			? [alquiler.cuotaActual.id]
			: [];
		setSeleccion(porDefecto);
		setRegistrado(false);
	}, [alquiler]);

	const seleccionadas = cuotas.filter((c) => seleccion.includes(c.id));
	const total = seleccionadas.reduce((acc, c) => acc + c.monto, 0);
	const requiereComprobante = medio !== "Efectivo";

	function alternarCuota(id: string) {
		setRegistrado(false);
		setSeleccion((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
		);
	}

	function agregarComprobante(files: FileList | null) {
		if (!files || files.length === 0) return;
		const archivo = files[0];
		if (
			!["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(
				archivo.type,
			)
		) {
			toast.error("Formato no permitido", {
				description: "Adjunta un PDF o una imagen JPG, PNG o WEBP.",
			});
			return;
		}
		if (archivo.size > 10 * 1024 * 1024) {
			toast.error("El comprobante es demasiado grande", {
				description: "El límite es de 10 MB.",
			});
			return;
		}
		setComprobante(archivo);
		toast.success("Comprobante adjuntado", { description: archivo.name });
	}

	async function registrar() {
		if (!alquiler) {
			toast.error("Selecciona un contrato");
			return;
		}
		if (seleccionadas.length === 0) {
			toast.error("Selecciona al menos una cuota", {
				description: "Marca las cuotas que vas a cobrar en este pago.",
			});
			return;
		}
		if (requiereComprobante && !comprobante) {
			toast.error("Falta el comprobante", {
				description: "Adjunta la evidencia del pago para este medio.",
			});
			return;
		}

		setEnviando(true);
		let comprobantePath: string | null = null;
		let pagosRegistrados = 0;

		try {
			if (comprobante) {
				comprobantePath = await subirComprobanteCuota(alquiler.id, comprobante);
			}

			for (const cuota of seleccionadas) {
				await registrarPagoCuota({
					data: {
						alquilerId: alquiler.id,
						cuotaId: cuota.id,
						monto: cuota.monto,
						medio: MEDIO_PAGO_UI_A_DB[medio],
						comprobantePath,
					},
				});
				pagosRegistrados += 1;
			}

			setRegistrado(true);
			setComprobante(null);
			toast.success("Pago registrado", {
				description: `${formatBs(total)} · ${alquiler.codigo}.`,
			});
			await router.invalidate();
		} catch (error) {
			if (comprobantePath && pagosRegistrados === 0) {
				await eliminarArchivosAlquiler("comprobantes", [comprobantePath]);
			}
			toast.error("No se pudo registrar el pago", {
				description:
					error instanceof Error
						? error.message
						: "Inténtalo de nuevo en unos segundos.",
			});
		} finally {
			setEnviando(false);
		}
	}

	return (
		<>
			<div className="mb-5">
				<Button
					asChild
					variant="ghost"
					size="sm"
					className="-ml-2 text-muted-foreground"
				>
					<Link to="/vendedor">
						<ArrowLeft aria-hidden="true" />
						Volver al inicio
					</Link>
				</Button>
			</div>

			<PageHeader
				title="Registrar pago"
				description="Selecciona el contrato, marca las cuotas a cobrar, elige el medio de pago y adjunta el comprobante."
			/>

			<div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
				<div className="flex flex-col gap-6 xl:col-span-2">
					<Card>
						<CardHeader>
							<CardTitle className="font-display text-base font-bold">
								Contrato
							</CardTitle>
							<CardDescription>
								Busca y elige el alquiler cuyo pago vas a registrar.
							</CardDescription>
						</CardHeader>
						<CardContent>
							{alquileres.length === 0 ? (
								<p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
									No tienes contratos vigentes asignados.
								</p>
							) : (
								<RentalPicker
									alquileres={alquileres}
									value={alquilerId}
									onChange={setAlquilerId}
								/>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="font-display text-base font-bold">
								Cuotas a cobrar
							</CardTitle>
							<CardDescription>
								Marca las cuotas pendientes que incluye este pago.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-3">
							{!alquiler ? (
								<p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
									Selecciona un contrato para ver sus cuotas.
								</p>
							) : pendientes.length === 0 ? (
								<p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
									Este contrato no tiene cuotas pendientes.
								</p>
							) : (
								pendientes.map((c) => {
									const activo = seleccion.includes(c.id);
									return (
										<label
											key={c.id}
											htmlFor={`cuota-${c.id}`}
											className={cn(
												"flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors duration-150 ease-out",
												activo
													? "border-primary/50 bg-blue-soft"
													: "border-border hover:bg-accent/40",
											)}
										>
											<Checkbox
												id={`cuota-${c.id}`}
												checked={activo}
												onCheckedChange={() => alternarCuota(c.id)}
											/>
											<span className="flex-1">
												<span className="block text-sm font-medium text-foreground">
													Cuota #{c.numeroCuota} · {formatPeriodo(c.periodo)}
												</span>
												<span className="block text-xs text-muted-foreground">
													Vence el {formatFecha(c.fechaVencimiento)}
													{c.recargoMora > 0
														? ` · incluye recargo ${formatBs(c.recargoMora)}`
														: ""}
												</span>
											</span>
											<span className="flex items-center gap-2">
												<StatusBadge tone={cuotaTone[c.estado]}>
													{c.estado}
												</StatusBadge>
												<span className="font-medium tabular text-foreground">
													{formatBs(c.monto)}
												</span>
											</span>
										</label>
									);
								})
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="font-display text-base font-bold">
								Medio de pago
							</CardTitle>
							<CardDescription>
								El medio seleccionado determina los datos del comprobante.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-4">
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
								{METODOS.map((m) => {
									const Icono = m.icono;
									const activo = medio === m.id;
									return (
										<button
											key={m.id}
											type="button"
											onClick={() => {
												setMedio(m.id);
												setRegistrado(false);
											}}
											aria-pressed={activo}
											className={cn(
												"flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors duration-150 ease-out",
												activo
													? "border-primary/50 bg-blue-soft"
													: "border-border hover:border-primary/30 hover:bg-accent/50",
											)}
										>
											<span
												className={cn(
													"grid size-9 shrink-0 place-items-center rounded-lg",
													activo
														? "bg-primary text-primary-foreground"
														: "bg-secondary text-muted-foreground",
												)}
											>
												<Icono className="size-4" aria-hidden="true" />
											</span>
											<span>
												<span className="block text-sm font-semibold text-foreground">
													{m.titulo}
												</span>
												<span className="block text-xs text-muted-foreground">
													{m.detalle}
												</span>
											</span>
										</button>
									);
								})}
							</div>

							{medio === "Transferencia QR" ? (
								<div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row">
									<QrVisual
										value={`remax-potosi:${alquiler?.codigo ?? "contrato"}:${total}`}
										className="shrink-0 rounded-lg border border-border bg-white p-2"
									/>
									<div className="text-center sm:text-left">
										<p className="font-display text-sm font-bold text-foreground">
											Escanea el código QR para pagar
										</p>
										<p className="mt-1 text-sm text-muted-foreground">
											El cliente escanea desde su app bancaria el monto de{" "}
											<strong className="tabular text-foreground">
												{formatBs(total)}
											</strong>
											.
										</p>
										<p className="mt-2 text-xs text-muted-foreground">
											Cuenta RE/MAX Potosí · Banco Unión · **** 4471
										</p>
									</div>
								</div>
							) : null}

							{medio === "Efectivo" ? (
								<div className="rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
									Verifica el monto en efectivo y entrega el recibo
									correspondiente al cliente.
								</div>
							) : null}

							<Separator />

							<div className="flex flex-col gap-2">
								<Label htmlFor="p-comprobante">
									Comprobante {requiereComprobante ? "*" : "(opcional)"}
								</Label>
								{comprobante ? (
									<div className="flex items-center justify-between rounded-lg border border-success/40 bg-success-soft px-4 py-3">
										<span className="flex items-center gap-2 text-sm font-medium text-success">
											<FileCheck2 className="size-4" aria-hidden="true" />
											{comprobante.name}
										</span>
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label="Quitar comprobante"
											disabled={enviando}
											onClick={() => {
												setComprobante(null);
												setRegistrado(false);
											}}
										>
											<X aria-hidden="true" />
										</Button>
									</div>
								) : (
									<button
										type="button"
										onClick={() => inputComprobante.current?.click()}
										onDragOver={(e) => {
											e.preventDefault();
											setArrastrando(true);
										}}
										onDragLeave={() => setArrastrando(false)}
										onDrop={(e) => {
											e.preventDefault();
											setArrastrando(false);
											agregarComprobante(e.dataTransfer.files);
										}}
										className={cn(
											"flex items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-sm transition-colors",
											arrastrando
												? "border-primary bg-blue-soft"
												: "border-border text-muted-foreground hover:border-primary/40 hover:bg-accent/40",
										)}
									>
										<Upload className="size-4" aria-hidden="true" />
										Arrastra el comprobante o haz clic para subir
									</button>
								)}
								<input
									ref={inputComprobante}
									type="file"
									accept="application/pdf,image/*"
									className="sr-only"
									onChange={(e) => agregarComprobante(e.target.files)}
								/>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="flex flex-col gap-6">
					<Card className="h-fit xl:sticky xl:top-6">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 font-display text-base font-bold">
								<Wallet className="size-4 text-brand-text" aria-hidden="true" />
								Resumen del cobro
							</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-3">
							<Fila etiqueta="Contrato" valor={alquiler?.codigo ?? "—"} />
							<Fila
								etiqueta="Cuotas seleccionadas"
								valor={String(seleccionadas.length)}
							/>
							<Fila etiqueta="Medio de pago" valor={medio} />
							<Separator />
							{seleccionadas.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									Aún no has marcado cuotas.
								</p>
							) : (
								<div className="flex flex-col gap-2">
									{seleccionadas.map((c) => (
										<div
											key={c.id}
											className="flex items-center justify-between gap-3 text-sm"
										>
											<span className="text-muted-foreground">
												{formatPeriodo(c.periodo)}
											</span>
											<span className="tabular text-foreground">
												{formatBs(c.monto)}
											</span>
										</div>
									))}
								</div>
							)}
							<div className="mt-1 flex items-center justify-between rounded-lg bg-blue-soft px-4 py-3">
								<span className="font-display text-sm font-bold text-blue-deep">
									Total a cobrar
								</span>
								<span className="font-display text-lg font-extrabold tabular text-primary">
									{formatBs(total)}
								</span>
							</div>
							<Button
								variant="cta"
								className="mt-2 w-full"
								onClick={() => void registrar()}
								disabled={registrado || enviando || !alquiler}
							>
								{enviando ? (
									<>
										<Upload className="animate-pulse" aria-hidden="true" />
										Registrando…
									</>
								) : registrado ? (
									<>
										<CheckCircle2 aria-hidden="true" />
										Pago registrado
									</>
								) : (
									<>
										<Banknote aria-hidden="true" />
										Registrar pago
									</>
								)}
							</Button>
							{registrado ? (
								<p className="text-center text-xs text-success">
									El comprobante quedó vinculado al contrato.
								</p>
							) : null}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="font-display text-base font-bold">
								Últimos pagos
							</CardTitle>
							<CardDescription>
								Historial reciente del contrato.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-2 px-4 pb-4">
							{(() => {
								const historial = cuotas.slice(-3).reverse();
								if (historial.length === 0) {
									return (
										<p className="text-sm text-muted-foreground">
											Aún no hay pagos registrados.
										</p>
									);
								}
								return historial.map((p) => (
									<div
										key={p.id}
										className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5"
									>
										<div>
											<p className="text-sm font-medium text-foreground">
												{formatPeriodo(p.periodo)}
											</p>
											<p className="text-xs text-muted-foreground">
												{p.fechaPago ? formatFecha(p.fechaPago) : "Sin pagar"}
											</p>
										</div>
										<div className="text-right">
											<p className="font-medium tabular text-foreground">
												{formatBs(p.monto)}
											</p>
											<StatusBadge tone={cuotaTone[p.estado]}>
												{p.estado}
											</StatusBadge>
										</div>
									</div>
								));
							})()}
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
	return (
		<div className="flex items-center justify-between gap-3">
			<span className="text-sm text-muted-foreground">{etiqueta}</span>
			<span className="text-right text-sm font-medium tabular text-foreground">
				{valor}
			</span>
		</div>
	);
}
