import { createFileRoute, Link } from "@tanstack/react-router";
import { cn } from "cn";
import {
	ArrowLeft,
	Banknote,
	CheckCircle2,
	CreditCard,
	FileCheck2,
	QrCode,
	Smartphone,
	Upload,
	Wallet,
	X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { cuotaTone, StatusBadge } from "@/components/common/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { getAlquileresDetalle, getPagosDeAlquiler } from "@/data";
import type { MedioPago } from "@/data/types";
import { vendedorActual } from "@/data/vendedores";
import { formatBs, formatFecha, formatPeriodo } from "@/lib/format";

export const Route = createFileRoute("/vendedor/registrar-pago")({
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
];

function RegistrarPago() {
	const alquileresVigentes = useMemo(
		() => getAlquileresDetalle().filter((a) => a.estado === "Vigente"),
		[],
	);
	const inicial = useMemo(() => {
		const propias = alquileresVigentes.filter(
			(a) => a.vendedorId === vendedorActual.id,
		);
		const conMora = (propias.length > 0 ? propias : alquileresVigentes).find(
			(a) => a.cuotaActual?.estado === "En mora",
		);
		return (
			conMora ??
			(propias.length > 0 ? propias : alquileresVigentes)[0] ??
			alquileresVigentes[0]
		);
	}, [alquileresVigentes]);

	const [alquilerId, setAlquilerId] = useState(inicial?.id ?? "");
	const [medio, setMedio] = useState<MedioPago>("Transferencia QR");
	const [comprobante, setComprobante] = useState<string | null>(null);
	const [arrastrando, setArrastrando] = useState(false);
	const [registrado, setRegistrado] = useState(false);
	const inputComprobante = useRef<HTMLInputElement>(null);

	const alquiler =
		alquileresVigentes.find((a) => a.id === alquilerId) ?? inicial;
	const cuota = alquiler?.cuotaActual;
	const historial = alquiler
		? getPagosDeAlquiler(alquiler.id).slice(-3).reverse()
		: [];

	const total = cuota?.monto ?? 0;
	const requiereComprobante =
		medio === "Transferencia QR" ||
		medio === "Tarjeta de crédito" ||
		medio === "Tarjeta de débito";

	function agregarComprobante(files: FileList | null) {
		if (!files || files.length === 0) return;
		setComprobante(files[0].name);
		toast.success("Comprobante adjuntado", {
			description: files[0].name,
		});
	}

	function registrar() {
		if (!alquiler || !cuota) {
			toast.error("Selecciona un contrato con cuota pendiente");
			return;
		}
		if (requiereComprobante && !comprobante) {
			toast.error("Falta el comprobante", {
				description: "Adjunta la evidencia del pago para este medio.",
			});
			return;
		}
		setRegistrado(true);
		toast.success("Pago registrado", {
			description: `${formatBs(total)} · ${alquiler.codigo}. (Acción simulada)`,
		});
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
				description="Cobra la cuota de un contrato, elige el medio de pago y adjunta el comprobante."
			/>

			<div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
				<div className="flex flex-col gap-6 xl:col-span-2">
					<Card>
						<CardHeader>
							<CardTitle className="font-display text-base font-bold">
								Contrato y cuota
							</CardTitle>
							<CardDescription>
								Selecciona el contrato cuyo pago vas a registrar.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
								<Label htmlFor="p-contrato">Contrato</Label>
								<Select value={alquilerId} onValueChange={setAlquilerId}>
									<SelectTrigger id="p-contrato" aria-label="Contrato">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{alquileresVigentes.map((a) => (
											<SelectItem key={a.id} value={a.id}>
												{a.codigo} · {a.cliente.nombre}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{alquiler && cuota ? (
								<div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-secondary/50 p-4 sm:grid-cols-3">
									<Dato etiqueta="Inmueble" valor={alquiler.inmueble.titulo} />
									<Dato etiqueta="Cliente" valor={alquiler.cliente.nombre} />
									<div>
										<p className="text-xs text-muted-foreground">
											Cuota actual
										</p>
										<div className="mt-1 flex items-center gap-2">
											<StatusBadge tone={cuotaTone[cuota.estado]}>
												{cuota.estado}
											</StatusBadge>
											<span className="text-xs text-muted-foreground">
												{formatPeriodo(cuota.periodo)}
											</span>
										</div>
									</div>
									<Dato
										etiqueta="Vencimiento"
										valor={formatFecha(cuota.fechaVencimiento)}
									/>
									<Dato
										etiqueta="Monto base"
										valor={formatBs(cuota.montoBase)}
									/>
									<Dato
										etiqueta="Recargo por mora"
										valor={
											cuota.recargoMora > 0
												? formatBs(cuota.recargoMora)
												: "Sin recargo"
										}
										alerta={cuota.recargoMora > 0}
									/>
								</div>
							) : (
								<p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
									No hay cuotas pendientes para este contrato.
								</p>
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
											onClick={() => setMedio(m.id)}
											aria-pressed={activo}
											className={cn(
												"flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors duration-150",
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
								<div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center">
									<QrPlaceholder
										value={`remax-potosi:${alquiler?.codigo ?? "contrato"}:${total}`}
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
											. El pago se acredita automáticamente.
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
											{comprobante}
										</span>
										<Button
											variant="ghost"
											size="icon-sm"
											aria-label="Quitar comprobante"
											onClick={() => setComprobante(null)}
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
					<Card className="h-fit">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 font-display text-base font-bold">
								<Wallet className="size-4 text-primary" aria-hidden="true" />
								Resumen del cobro
							</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-3">
							<Fila etiqueta="Contrato" valor={alquiler?.codigo ?? "—"} />
							<Fila
								etiqueta="Periodo"
								valor={cuota ? formatPeriodo(cuota.periodo) : "—"}
							/>
							<Fila etiqueta="Medio de pago" valor={medio} />
							<Separator />
							<Fila
								etiqueta="Monto base"
								valor={formatBs(cuota?.montoBase ?? 0)}
							/>
							<Fila
								etiqueta="Recargo por mora"
								valor={formatBs(cuota?.recargoMora ?? 0)}
								alerta={(cuota?.recargoMora ?? 0) > 0}
							/>
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
								onClick={registrar}
								disabled={registrado}
							>
								{registrado ? (
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
									El comprobante quedó vinculado al contrato. (Acción simulada)
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
							{historial.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									Aún no hay pagos registrados.
								</p>
							) : (
								historial.map((p) => (
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
								))
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);
}

function Dato({
	etiqueta,
	valor,
	alerta,
}: {
	etiqueta: string;
	valor: string;
	alerta?: boolean;
}) {
	return (
		<div>
			<p className="text-xs text-muted-foreground">{etiqueta}</p>
			<p
				className={cn(
					"mt-0.5 text-sm font-medium",
					alerta ? "text-destructive" : "text-foreground",
				)}
			>
				{valor}
			</p>
		</div>
	);
}

function Fila({
	etiqueta,
	valor,
	alerta,
}: {
	etiqueta: string;
	valor: string;
	alerta?: boolean;
}) {
	return (
		<div className="flex items-center justify-between gap-3">
			<span className="text-sm text-muted-foreground">{etiqueta}</span>
			<span
				className={cn(
					"text-right text-sm font-medium tabular",
					alerta ? "text-destructive" : "text-foreground",
				)}
			>
				{valor}
			</span>
		</div>
	);
}

/** Genera un patrón tipo QR determinista a partir de un texto (visual, no escaneable). */
function QrPlaceholder({ value }: { value: string }) {
	const celdas = 21;
	const matriz = useMemo(() => {
		let semilla = 0;
		for (let i = 0; i < value.length; i++) {
			semilla = (semilla * 31 + value.charCodeAt(i)) >>> 0;
		}
		const rand = () => {
			semilla ^= semilla << 13;
			semilla ^= semilla >>> 17;
			semilla ^= semilla << 5;
			semilla >>>= 0;
			return (semilla % 1000) / 1000;
		};
		const grid: boolean[][] = Array.from({ length: celdas }, () =>
			Array.from({ length: celdas }, () => rand() > 0.5),
		);
		const marcar = (fila: number, col: number) => {
			for (let f = 0; f < 7; f++) {
				for (let c = 0; c < 7; c++) {
					const borde = f === 0 || f === 6 || c === 0 || c === 6;
					const centro = f >= 2 && f <= 4 && c >= 2 && c <= 4;
					grid[fila + f][col + c] = borde || centro;
				}
			}
		};
		marcar(0, 0);
		marcar(0, celdas - 7);
		marcar(celdas - 7, 0);
		return grid;
	}, [value]);

	const tamano = 148;
	const celda = tamano / celdas;

	return (
		<svg
			viewBox={`0 0 ${tamano} ${tamano}`}
			width={140}
			height={140}
			role="img"
			aria-label="Código QR de pago (representación visual)"
			className="shrink-0 rounded-lg border border-border bg-white p-2"
		>
			{matriz.flatMap((fila, f) =>
				fila.map((activo, c) =>
					activo ? (
						<rect
							// biome-ignore lint/suspicious/noArrayIndexKey: grilla estática
							key={`${f}-${c}`}
							x={c * celda}
							y={f * celda}
							width={celda}
							height={celda}
							fill="var(--color-primary)"
						/>
					) : null,
				),
			)}
		</svg>
	);
}
