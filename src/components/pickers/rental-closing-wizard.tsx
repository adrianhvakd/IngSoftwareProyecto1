import { Link } from "@tanstack/react-router";
import { cn } from "cn";
import {
	ArrowLeft,
	ArrowRight,
	Banknote,
	Building2,
	Check,
	CheckCircle2,
	CreditCard,
	FileSignature,
	FileText,
	Landmark,
	Printer,
	QrCode,
	Upload,
	UserCog,
	UserRound,
	Wallet,
	X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { StatusBadge } from "@/components/common/status-badge";
import { CredentialsCard } from "@/components/pickers/credentials-card";
import { EntityPicker } from "@/components/pickers/entity-picker";
import { PasswordGenerator } from "@/components/pickers/password-generator";
import { PropertyPicker } from "@/components/pickers/property-picker";
import { QrVisual } from "@/components/pickers/qr-visual";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAlquileresDetalle } from "@/data";
import { clientes } from "@/data/clientes";
import { inmuebles } from "@/data/inmuebles";
import { proveedores } from "@/data/proveedores";
import type { MedioPago } from "@/data/types";
import { vendedorActual, vendedores } from "@/data/vendedores";
import { formatBs, formatFechaLarga } from "@/lib/format";

export interface RentalClosingWizardProps {
	volver?: { to: string; label: string };
	requiereVendedor?: boolean;
	irAAlquileres?: { to: string; label: string };
	titulo?: string;
	descripcion?: string;
}

type PasoId =
	| "vendedor"
	| "cliente"
	| "inmueble"
	| "contrato"
	| "firma"
	| "pago";

interface Paso {
	id: PasoId;
	titulo: string;
	icono: typeof UserRound;
}

interface MetodoPago {
	id: MedioPago;
	titulo: string;
	detalle: string;
	icono: typeof CreditCard;
}

const METODOS: MetodoPago[] = [
	{
		id: "Tarjeta de crédito",
		titulo: "Tarjeta de crédito",
		detalle: "Cobro con terminal POS",
		icono: CreditCard,
	},
	{
		id: "Transferencia QR",
		titulo: "Transferencia QR",
		detalle: "Pago inmediato desde app bancaria",
		icono: QrCode,
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

function sumarMeses(fecha: string, meses: number): string {
	const base = new Date(`${fecha}T00:00:00`);
	if (Number.isNaN(base.getTime())) return fecha;
	base.setMonth(base.getMonth() + meses);
	base.setDate(base.getDate() - 1);
	return base.toISOString().slice(0, 10);
}

export function RentalClosingWizard({
	volver,
	requiereVendedor = false,
	irAAlquileres,
	titulo = "Cierre de alquiler",
	descripcion = "Registra el acuerdo, genera el contrato, adjunta la firma y cobra el cierre.",
}: RentalClosingWizardProps) {
	const pasos = useMemo<Paso[]>(() => {
		const base: Paso[] = [
			{ id: "cliente", titulo: "Cliente", icono: UserRound },
			{ id: "inmueble", titulo: "Inmueble y condiciones", icono: Building2 },
			{ id: "contrato", titulo: "Contrato", icono: FileText },
			{ id: "firma", titulo: "Firma y comisión", icono: FileSignature },
			{ id: "pago", titulo: "Pago de cierre", icono: Wallet },
		];
		return requiereVendedor
			? [
					{ id: "vendedor", titulo: "Vendedor responsable", icono: UserCog },
					...base,
				]
			: base;
	}, [requiereVendedor]);

	const [indice, setIndice] = useState(0);
	const [completados, setCompletados] = useState<PasoId[]>([]);

	// Paso vendedor (admin)
	const [vendedorId, setVendedorId] = useState<string | null>(null);

	// Paso cliente
	const [clienteModo, setClienteModo] = useState<"existente" | "nuevo">(
		"existente",
	);
	const [clienteId, setClienteId] = useState<string | null>(null);
	const [nuevoNombre, setNuevoNombre] = useState("");
	const [nuevoCi, setNuevoCi] = useState("");
	const [nuevoTelefono, setNuevoTelefono] = useState("+591 ");
	const [nuevoEmail, setNuevoEmail] = useState("");
	const [nuevoPassword, setNuevoPassword] = useState("");

	// Paso inmueble
	const [inmuebleId, setInmuebleId] = useState<string | null>(null);
	const [montoMensual, setMontoMensual] = useState("");
	const [fechaInicio, setFechaInicio] = useState("2026-11-01");
	const [duracion, setDuracion] = useState("12");
	const [diaCobro, setDiaCobro] = useState("5");
	const [deposito, setDeposito] = useState("");
	const [comision, setComision] = useState(
		String((requiereVendedor ? vendedores[0] : vendedorActual).comisionFija),
	);

	// Paso firma
	const [archivoContrato, setArchivoContrato] = useState<File | null>(null);

	// Paso pago
	const [montoCierre, setMontoCierre] = useState("");
	const [medio, setMedio] = useState<MedioPago>("Transferencia QR");
	const [archivoComprobante, setArchivoComprobante] = useState<File | null>(
		null,
	);

	// Estado global
	const [estado, setEstado] = useState<"edicion" | "subiendo" | "exito">(
		"edicion",
	);
	const [progreso, setProgreso] = useState(0);
	const [mensajeProgreso, setMensajeProgreso] = useState("");
	const timers = useRef<number[]>([]);
	const [numeroContrato] = useState(
		() =>
			`ALQ-2026-${String(getAlquileresDetalle().length + 1).padStart(3, "0")}`,
	);

	useEffect(() => {
		return () => {
			for (const t of timers.current) window.clearTimeout(t);
		};
	}, []);

	const inmueble = inmuebles.find((i) => i.id === inmuebleId) ?? null;
	const proveedor = proveedores.find((p) => p.id === inmueble?.proveedorId);
	const clienteExistente = clientes.find((c) => c.id === clienteId);
	const vendedorSel = vendedores.find((v) => v.id === vendedorId);

	const arrendatario =
		clienteModo === "existente"
			? (clienteExistente?.nombre ?? "—")
			: nuevoNombre || "—";

	const fechaFin = sumarMeses(fechaInicio, Number(duracion) || 12);

	function marcarCompletado(id: PasoId) {
		setCompletados((prev) => (prev.includes(id) ? prev : [...prev, id]));
	}

	function irA(paso: number) {
		setIndice(Math.max(0, Math.min(pasos.length - 1, paso)));
	}

	function validarActual(): string | null {
		const actual = pasos[indice];
		if (actual.id === "vendedor" && !vendedorId) {
			return "Selecciona al vendedor responsable del cierre.";
		}
		if (actual.id === "cliente") {
			if (clienteModo === "existente" && !clienteId) {
				return "Selecciona un cliente existente.";
			}
			if (
				clienteModo === "nuevo" &&
				(!nuevoNombre.trim() || !nuevoEmail.trim())
			) {
				return "El nombre y el correo del nuevo cliente son obligatorios.";
			}
		}
		if (actual.id === "inmueble") {
			if (!inmuebleId) return "Selecciona el inmueble disponible.";
			if (!montoMensual || Number(montoMensual) <= 0) {
				return "Indica un monto mensual válido.";
			}
		}
		if (actual.id === "firma" && !archivoContrato) {
			return "Adjunta el contrato firmado y escaneado.";
		}
		if (actual.id === "pago") {
			if (!montoCierre || Number(montoCierre) <= 0) {
				return "Indica el monto del cobro de cierre.";
			}
			if (!archivoComprobante) {
				return "Adjunta el comprobante del cobro de cierre.";
			}
		}
		return null;
	}

	function siguiente() {
		const error = validarActual();
		if (error) {
			toast.error("Completa este paso", { description: error });
			return;
		}
		marcarCompletado(pasos[indice].id);
		irA(indice + 1);
	}

	function finalizar() {
		const error = validarActual();
		if (error) {
			toast.error("Completa este paso", { description: error });
			return;
		}
		marcarCompletado(pasos[indice].id);
		setEstado("subiendo");
		setProgreso(0);
		setMensajeProgreso("Subiendo contrato…");
		timers.current.push(
			window.setTimeout(() => {
				setProgreso(60);
				setMensajeProgreso("Subiendo comprobante…");
			}, 700),
			window.setTimeout(() => {
				setProgreso(86);
				setMensajeProgreso("Registrando el alquiler…");
			}, 1400),
			window.setTimeout(() => {
				setProgreso(100);
				setMensajeProgreso("Listo");
			}, 1900),
			window.setTimeout(() => {
				setEstado("exito");
			}, 2200),
		);
	}

	function reiniciar() {
		for (const t of timers.current) window.clearTimeout(t);
		timers.current = [];
		setIndice(0);
		setCompletados([]);
		setVendedorId(null);
		setClienteModo("existente");
		setClienteId(null);
		setNuevoNombre("");
		setNuevoCi("");
		setNuevoTelefono("+591 ");
		setNuevoEmail("");
		setNuevoPassword("");
		setInmuebleId(null);
		setMontoMensual("");
		setFechaInicio("2026-11-01");
		setDuracion("12");
		setDiaCobro("5");
		setDeposito("");
		setComision(
			String((requiereVendedor ? vendedores[0] : vendedorActual).comisionFija),
		);
		setArchivoContrato(null);
		setMontoCierre("");
		setMedio("Transferencia QR");
		setArchivoComprobante(null);
		setProgreso(0);
		setEstado("edicion");
	}

	function seleccionarInmueble(id: string | null) {
		setInmuebleId(id);
		const elegido = inmuebles.find((i) => i.id === id);
		if (elegido) {
			setMontoMensual(String(elegido.precio));
			setDeposito(String(elegido.precio));
			setMontoCierre(String(elegido.precio));
		}
	}

	const esAdmin = requiereVendedor;

	if (estado === "exito") {
		return (
			<div className="mx-auto max-w-2xl py-4">
				<Card>
					<CardContent className="flex flex-col gap-5 pt-6">
						<div className="flex flex-col items-center text-center">
							<span className="grid size-14 place-items-center rounded-full bg-success-soft text-success">
								<CheckCircle2 className="size-7" aria-hidden="true" />
							</span>
							<h2 className="mt-4 font-display text-xl font-extrabold text-foreground">
								¡Alquiler registrado con éxito!
							</h2>
							<p className="mt-1 max-w-md text-sm text-muted-foreground">
								Se registró el contrato <strong>{numeroContrato}</strong> del
								inmueble {inmueble?.codigo} a nombre de {arrendatario}.
							</p>
						</div>

						<div className="grid gap-3 rounded-xl border border-border bg-secondary/40 p-4 sm:grid-cols-2">
							<ResumenFila etiqueta="N.º de contrato" valor={numeroContrato} />
							<ResumenFila
								etiqueta="Inmueble"
								valor={`${inmueble?.codigo ?? "—"} · ${inmueble?.zona ?? ""}`}
							/>
							<ResumenFila etiqueta="Arrendatario" valor={arrendatario} />
							<ResumenFila
								etiqueta="Alquiler mensual"
								valor={formatBs(Number(montoMensual) || 0)}
							/>
							<ResumenFila
								etiqueta="Comisión registrada"
								valor={formatBs(Number(comision) || 0)}
								destacado
							/>
							<ResumenFila
								etiqueta="Cobro de cierre"
								valor={formatBs(Number(montoCierre) || 0)}
							/>
						</div>

						{clienteModo === "nuevo" ? (
							<CredentialsCard
								usuario={nuevoEmail}
								password={nuevoPassword}
								titulo="Credenciales del nuevo cliente"
							/>
						) : null}

						<div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
							<Button variant="outline" onClick={reiniciar}>
								<ArrowRight aria-hidden="true" />
								Registrar otro alquiler
							</Button>
							{irAAlquileres ? (
								<Button asChild variant="cta">
									<Link to={irAAlquileres.to}>{irAAlquileres.label}</Link>
								</Button>
							) : null}
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="pb-24 lg:pb-4">
			{volver ? (
				<div className="no-print mb-4">
					<Button
						asChild
						variant="ghost"
						size="sm"
						className="-ml-2 text-muted-foreground"
					>
						<Link to={volver.to}>
							<ArrowLeft aria-hidden="true" />
							{volver.label}
						</Link>
					</Button>
				</div>
			) : null}

			<div className="no-print">
				<h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
					{titulo}
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">{descripcion}</p>
			</div>

			{/* Stepper */}
			<ol className="no-print mt-6 flex gap-2 overflow-x-auto pb-2 lg:grid lg:grid-cols-5 lg:gap-3 lg:overflow-visible lg:pb-0 xl:grid-cols-6">
				{pasos.map((p, i) => {
					const Icono = p.icono;
					const activo = i === indice;
					const completado = completados.includes(p.id);
					return (
						<li key={p.id} className="shrink-0 lg:shrink">
							<button
								type="button"
								onClick={() => irA(i)}
								aria-current={activo ? "step" : undefined}
								className={cn(
									"flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors duration-150 ease-out",
									activo
										? "border-primary/40 bg-blue-soft"
										: completado
											? "border-success/40 bg-success-soft/50"
											: "border-border bg-card hover:border-primary/30",
								)}
							>
								<span
									className={cn(
										"grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold",
										completado
											? "bg-success text-white"
											: activo
												? "bg-primary text-primary-foreground"
												: "bg-secondary text-muted-foreground",
									)}
								>
									{completado ? (
										<Check className="size-4" aria-hidden="true" />
									) : (
										<Icono className="size-4" aria-hidden="true" />
									)}
								</span>
								<span className="hidden text-sm font-semibold text-foreground sm:block">
									{p.titulo}
								</span>
							</button>
						</li>
					);
				})}
			</ol>

			<div className="mt-6">
				{pasos[indice].id === "vendedor" ? (
					<Card>
						<CardContent className="flex flex-col gap-4 pt-6">
							<div>
								<h2 className="font-display text-base font-bold text-foreground">
									Vendedor responsable
								</h2>
								<p className="mt-1 text-sm text-muted-foreground">
									A este vendedor se le registrará la comisión fija del cierre.
								</p>
							</div>
							<EntityPicker
								items={vendedores.map((v) => ({
									id: v.id,
									nombre: v.nombre,
									avatarUrl: v.avatarUrl,
									secundario: `${v.cargo} · comisión ${formatBs(v.comisionFija)}`,
								}))}
								value={vendedorId}
								onChange={(id) => {
									setVendedorId(id);
									const v = vendedores.find((x) => x.id === id);
									if (v) setComision(String(v.comisionFija));
								}}
								placeholder="Buscar vendedor…"
								resumenBadge="Vendedor"
							/>
						</CardContent>
					</Card>
				) : null}

				{pasos[indice].id === "cliente" ? (
					<Card>
						<CardContent className="pt-6">
							<Tabs
								value={clienteModo}
								onValueChange={(v) =>
									setClienteModo(v as "existente" | "nuevo")
								}
							>
								<TabsList className="w-full sm:w-auto">
									<TabsTrigger value="existente">Cliente existente</TabsTrigger>
									<TabsTrigger value="nuevo">Cliente nuevo</TabsTrigger>
								</TabsList>

								<TabsContent value="existente" className="mt-4">
									<EntityPicker
										items={clientes.map((c) => ({
											id: c.id,
											nombre: c.nombre,
											avatarUrl: c.avatarUrl,
											secundario: c.telefonoContacto,
										}))}
										value={clienteId}
										onChange={setClienteId}
										placeholder="Buscar cliente por nombre o teléfono…"
										resumenBadge="Cliente"
									/>
									<p className="mt-3 text-xs text-muted-foreground">
										El alquiler quedará asignado al cliente seleccionado desde
										el inicio.
									</p>
								</TabsContent>

								<TabsContent value="nuevo" className="mt-4">
									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										<div className="flex flex-col gap-2 sm:col-span-2">
											<Label htmlFor="nuevo-nombre">Nombre completo *</Label>
											<Input
												id="nuevo-nombre"
												value={nuevoNombre}
												onChange={(e) => setNuevoNombre(e.target.value)}
												placeholder="Ej. Andrea Salinas Tórrez"
											/>
										</div>
										<div className="flex flex-col gap-2">
											<Label htmlFor="nuevo-ci">CI</Label>
											<Input
												id="nuevo-ci"
												value={nuevoCi}
												onChange={(e) => setNuevoCi(e.target.value)}
												placeholder="Ej. 8912345 L.P."
											/>
										</div>
										<div className="flex flex-col gap-2">
											<Label htmlFor="nuevo-tel">Teléfono</Label>
											<Input
												id="nuevo-tel"
												value={nuevoTelefono}
												onChange={(e) => setNuevoTelefono(e.target.value)}
											/>
										</div>
										<div className="flex flex-col gap-2 sm:col-span-2">
											<Label htmlFor="nuevo-email">Correo *</Label>
											<Input
												id="nuevo-email"
												type="email"
												value={nuevoEmail}
												onChange={(e) => setNuevoEmail(e.target.value)}
												placeholder="cliente@correo.com"
											/>
										</div>
										<div className="sm:col-span-2">
											<PasswordGenerator
												value={nuevoPassword}
												onChange={setNuevoPassword}
												label="Contraseña temporal del cliente"
											/>
										</div>
									</div>
								</TabsContent>
							</Tabs>
						</CardContent>
					</Card>
				) : null}

				{pasos[indice].id === "inmueble" ? (
					<div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
						<Card className="xl:col-span-2">
							<CardContent className="flex flex-col gap-5 pt-6">
								<div>
									<h2 className="font-display text-base font-bold text-foreground">
										Inmueble y condiciones
									</h2>
									<p className="mt-1 text-sm text-muted-foreground">
										Elige el inmueble disponible y define las condiciones del
										contrato.
									</p>
								</div>

								<div className="flex flex-col gap-2">
									<Label>Inmueble</Label>
									<PropertyPicker
										inmuebles={inmuebles}
										value={inmuebleId}
										onChange={seleccionarInmueble}
									/>
									{inmueble ? (
										<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
											<Building2
												className="size-3.5 text-brand-text"
												aria-hidden="true"
											/>
											{inmueble.tipo} en {inmueble.zona} · propietario{" "}
											{proveedor?.nombre}
										</p>
									) : null}
								</div>

								<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
									<div className="flex flex-col gap-2">
										<Label htmlFor="c-inicio">Fecha de inicio</Label>
										<Input
											id="c-inicio"
											type="date"
											value={fechaInicio}
											onChange={(e) => setFechaInicio(e.target.value)}
										/>
									</div>
									<div className="flex flex-col gap-2">
										<Label htmlFor="c-dur">Duración</Label>
										<Select value={duracion} onValueChange={setDuracion}>
											<SelectTrigger id="c-dur" aria-label="Duración">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="6">6 meses</SelectItem>
												<SelectItem value="12">12 meses</SelectItem>
												<SelectItem value="24">24 meses</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="flex flex-col gap-2">
										<Label htmlFor="c-dia">Día de cobro</Label>
										<Input
											id="c-dia"
											type="number"
											min={1}
											max={28}
											inputMode="numeric"
											value={diaCobro}
											onChange={(e) => setDiaCobro(e.target.value)}
										/>
									</div>
								</div>

								<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
									<div className="flex flex-col gap-2">
										<Label htmlFor="c-monto">Alquiler mensual (Bs)</Label>
										<Input
											id="c-monto"
											type="number"
											min={0}
											inputMode="numeric"
											value={montoMensual}
											onChange={(e) => setMontoMensual(e.target.value)}
										/>
									</div>
									<div className="flex flex-col gap-2">
										<Label htmlFor="c-dep">Depósito (Bs)</Label>
										<Input
											id="c-dep"
											type="number"
											min={0}
											inputMode="numeric"
											value={deposito}
											onChange={(e) => setDeposito(e.target.value)}
										/>
									</div>
									<div className="flex flex-col gap-2">
										<Label htmlFor="c-com">Comisión (Bs)</Label>
										<Input
											id="c-com"
											type="number"
											min={0}
											inputMode="numeric"
											value={comision}
											onChange={(e) => setComision(e.target.value)}
										/>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="h-fit">
							<CardContent className="flex flex-col gap-3 pt-6">
								<h2 className="font-display text-base font-bold text-foreground">
									Resumen del acuerdo
								</h2>
								<ResumenFila etiqueta="Arrendatario" valor={arrendatario} />
								{esAdmin ? (
									<ResumenFila
										etiqueta="Vendedor"
										valor={vendedorSel?.nombre ?? "—"}
									/>
								) : null}
								<ResumenFila
									etiqueta="Inmueble"
									valor={inmueble?.codigo ?? "—"}
								/>
								<ResumenFila
									etiqueta="Inicio"
									valor={formatFechaLarga(fechaInicio)}
								/>
								<ResumenFila
									etiqueta="Fin"
									valor={formatFechaLarga(fechaFin)}
								/>
								<Separator />
								<ResumenFila
									etiqueta="Alquiler mensual"
									valor={formatBs(Number(montoMensual) || 0)}
								/>
								<ResumenFila
									etiqueta="Depósito"
									valor={formatBs(Number(deposito) || 0)}
								/>
								<ResumenFila
									etiqueta="Comisión"
									valor={formatBs(Number(comision) || 0)}
								/>
							</CardContent>
						</Card>
					</div>
				) : null}

				{pasos[indice].id === "contrato" ? (
					<div className="flex flex-col gap-4">
						<div className="no-print flex flex-wrap items-center justify-between gap-3">
							<Button variant="outline" onClick={() => irA(indice - 1)}>
								<ArrowLeft aria-hidden="true" />
								Atrás
							</Button>
							<Button variant="secondary" onClick={() => window.print()}>
								<Printer aria-hidden="true" />
								Imprimir contrato
							</Button>
						</div>

						<article className="print-document mx-auto w-full max-w-3xl rounded-xl border border-border bg-white p-8 text-[13px] leading-relaxed text-slate-800 shadow-sm sm:p-12">
							<header className="flex items-center justify-between border-b border-slate-200 pb-5">
								<Logo />
								<div className="text-right text-[11px] text-slate-500">
									<p className="font-semibold text-slate-700">Oficina Potosí</p>
									<p>Av. Villazón · Ciudad de Potosí</p>
									<p>+591 2 622 4455</p>
								</div>
							</header>

							<h1 className="mt-8 text-center font-display text-lg font-extrabold tracking-tight text-slate-900">
								CONTRATO DE ARRENDAMIENTO DE INMUEBLE
							</h1>
							<p className="mt-1 text-center text-[11px] text-slate-500">
								Ref. {inmueble?.codigo ?? "—"} · {numeroContrato} · Suscrito en
								la ciudad de Potosí
							</p>

							<section className="mt-6 flex flex-col gap-3">
								<p>
									Conste por el presente documento el contrato de arrendamiento
									que celebran, por una parte,{" "}
									<strong>{proveedor?.nombre ?? "—"}</strong>, en calidad de{" "}
									<strong>ARRENDADOR</strong>, y por otra,{" "}
									<strong>{arrendatario}</strong>, en calidad de{" "}
									<strong>ARRENDATARIO</strong>, bajo las siguientes cláusulas:
								</p>
							</section>

							<section className="mt-5 flex flex-col gap-4">
								<Clausula numero="PRIMERA" titulo="Objeto">
									El ARRENDADOR concede en arrendamiento al ARRENDATARIO el
									inmueble tipo {(inmueble?.tipo ?? "").toLowerCase()} ubicado
									en {inmueble?.direccion}, zona {inmueble?.zona}, con una
									superficie aproximada de {inmueble?.m2} m².
								</Clausula>
								<Clausula numero="SEGUNDA" titulo="Plazo">
									El plazo del arrendamiento es de {duracion} meses, computables
									desde el {formatFechaLarga(fechaInicio)} hasta el{" "}
									{formatFechaLarga(fechaFin)}.
								</Clausula>
								<Clausula numero="TERCERA" titulo="Canon de arrendamiento">
									El canon mensual pactado es de{" "}
									{formatBs(Number(montoMensual) || 0)}, que el ARRENDATARIO se
									obliga a pagar dentro de los primeros {diaCobro} días de cada
									mes, en las oficinas de RE/MAX Potosí.
								</Clausula>
								<Clausula numero="CUARTA" titulo="Depósito de garantía">
									El ARRENDATARIO entrega en este acto la suma de{" "}
									{formatBs(Number(deposito) || 0)} en calidad de depósito de
									garantía, devuelto al término del contrato.
								</Clausula>
								<Clausula numero="QUINTA" titulo="Comisión">
									Se reconoce una comisión de {formatBs(Number(comision) || 0)}{" "}
									por la intermediación y cierre del presente contrato.
								</Clausula>
							</section>

							<section className="mt-12 grid grid-cols-2 gap-10 text-center">
								<div>
									<div className="border-t border-slate-400 pt-2">
										<p className="font-semibold text-slate-700">
											{proveedor?.nombre ?? "—"}
										</p>
										<p className="text-[11px] text-slate-500">ARRENDADOR</p>
									</div>
								</div>
								<div>
									<div className="border-t border-slate-400 pt-2">
										<p className="font-semibold text-slate-700">
											{arrendatario}
										</p>
										<p className="text-[11px] text-slate-500">ARRENDATARIO</p>
									</div>
								</div>
							</section>

							<footer className="mt-10 flex items-center justify-between border-t border-slate-200 pt-4 text-[10px] text-slate-400">
								<span>RE/MAX Potosí · Gestión de alquileres</span>
								<span>
									Agente: {(esAdmin ? vendedorSel : vendedorActual)?.nombre}
								</span>
							</footer>
						</article>
					</div>
				) : null}

				{pasos[indice].id === "firma" ? (
					<div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
						<Card className="xl:col-span-2">
							<CardContent className="flex flex-col gap-5 pt-6">
								<div>
									<h2 className="font-display text-base font-bold text-foreground">
										Contrato firmado y escaneado
									</h2>
									<p className="mt-1 text-sm text-muted-foreground">
										Adjunta el contrato firmado por ambas partes. El archivo
										queda en tu dispositivo hasta finalizar el cierre.
									</p>
								</div>
								<Dropzone
									archivo={archivoContrato}
									onArchivo={setArchivoContrato}
									icono={<FileText className="size-5" aria-hidden="true" />}
									titulo="Arrastra el contrato escaneado o haz clic para subir"
									hint="PDF o imagen del contrato firmado."
								/>
							</CardContent>
						</Card>

						<Card className="h-fit">
							<CardContent className="flex flex-col gap-3 pt-6">
								<h2 className="font-display text-base font-bold text-foreground">
									Resumen de comisión
								</h2>
								<ResumenFila
									etiqueta="Agente"
									valor={
										(esAdmin ? vendedorSel : vendedorActual)?.nombre ?? "—"
									}
								/>
								<ResumenFila
									etiqueta="Inmueble"
									valor={inmueble?.codigo ?? "—"}
								/>
								<ResumenFila etiqueta="Arrendatario" valor={arrendatario} />
								<Separator />
								<div className="flex items-center justify-between rounded-lg bg-success-soft px-4 py-3">
									<span className="text-sm font-medium text-success">
										Comisión fija
									</span>
									<span className="font-display text-lg font-extrabold tabular text-success">
										{formatBs(Number(comision) || 0)}
									</span>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-xs text-muted-foreground">
										Estado del expediente
									</span>
									<StatusBadge
										tone={archivoContrato ? "success" : "warning"}
										dot
									>
										{archivoContrato ? "Listo para cobrar" : "Falta firma"}
									</StatusBadge>
								</div>
							</CardContent>
						</Card>
					</div>
				) : null}

				{pasos[indice].id === "pago" ? (
					<div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
						<Card className="xl:col-span-2">
							<CardContent className="flex flex-col gap-5 pt-6">
								<div>
									<h2 className="font-display text-base font-bold text-foreground">
										Pago por cobro de cierre
									</h2>
									<p className="mt-1 text-sm text-muted-foreground">
										Registra el monto del cobro de cierre, elige el método y
										adjunta el comprobante.
									</p>
								</div>

								<div className="flex flex-col gap-2 sm:max-w-xs">
									<Label htmlFor="p-monto">Monto del cobro (Bs) *</Label>
									<Input
										id="p-monto"
										type="number"
										min={0}
										inputMode="numeric"
										value={montoCierre}
										onChange={(e) => setMontoCierre(e.target.value)}
									/>
								</div>

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
											value={`remax-potosi:${numeroContrato}:${montoCierre}`}
											className="shrink-0 rounded-lg border border-border bg-white p-2"
										/>
										<div className="text-center sm:text-left">
											<p className="font-display text-sm font-bold text-foreground">
												Escanea el código QR para pagar
											</p>
											<p className="mt-1 text-sm text-muted-foreground">
												El cliente escanea desde su app bancaria el monto de{" "}
												<strong className="tabular text-foreground">
													{formatBs(Number(montoCierre) || 0)}
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
										Verifica el monto en efectivo y entrega el recibo al
										cliente.
									</div>
								) : null}

								<Separator />

								<div className="flex flex-col gap-2">
									<Label>Comprobante del cobro *</Label>
									<Dropzone
										archivo={archivoComprobante}
										onArchivo={setArchivoComprobante}
										icono={<Upload className="size-5" aria-hidden="true" />}
										titulo="Arrastra el comprobante o haz clic para subir"
										hint="PDF o imagen del comprobante de pago."
									/>
								</div>
							</CardContent>
						</Card>

						<Card className="h-fit">
							<CardContent className="flex flex-col gap-3 pt-6">
								<h2 className="flex items-center gap-2 font-display text-base font-bold text-foreground">
									<Wallet
										className="size-4 text-brand-text"
										aria-hidden="true"
									/>
									Resumen del cobro
								</h2>
								<ResumenFila etiqueta="Contrato" valor={numeroContrato} />
								<ResumenFila etiqueta="Método" valor={medio} />
								<ResumenFila
									etiqueta="Monto del cobro"
									valor={formatBs(Number(montoCierre) || 0)}
								/>
								<Separator />
								<div className="mt-1 flex items-center justify-between rounded-lg bg-blue-soft px-4 py-3">
									<span className="font-display text-sm font-bold text-blue-deep">
										Total a cobrar
									</span>
									<span className="font-display text-lg font-extrabold tabular text-primary">
										{formatBs(Number(montoCierre) || 0)}
									</span>
								</div>
							</CardContent>
						</Card>
					</div>
				) : null}
			</div>

			{/* Barra de acciones fija (móvil y desktop) */}
			<div className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md lg:static lg:mt-6 lg:rounded-xl lg:border lg:bg-card lg:backdrop-blur-none">
				<div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
					<Button
						variant="outline"
						onClick={() => irA(indice - 1)}
						disabled={indice === 0}
					>
						<ArrowLeft aria-hidden="true" />
						Atrás
					</Button>
					<div className="flex items-center gap-2">
						<span className="hidden text-xs text-muted-foreground sm:block">
							Paso {indice + 1} de {pasos.length}
						</span>
						{indice < pasos.length - 1 ? (
							<Button variant="default" onClick={siguiente}>
								Continuar
								<ArrowRight aria-hidden="true" />
							</Button>
						) : (
							<Button variant="cta" onClick={finalizar}>
								<Check aria-hidden="true" />
								Finalizar y registrar
							</Button>
						)}
					</div>
				</div>
			</div>

			{estado === "subiendo" ? (
				<div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
					<Card className="w-full max-w-sm">
						<CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
							<span className="grid size-12 place-items-center rounded-full bg-blue-soft text-brand-text">
								<Upload className="size-5 animate-pulse" aria-hidden="true" />
							</span>
							<div>
								<p className="font-display text-base font-bold text-foreground">
									{mensajeProgreso}
								</p>
								<p className="mt-1 text-sm text-muted-foreground">
									No cierres esta ventana.
								</p>
							</div>
							<div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
								<div
									className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
									style={{ width: `${progreso}%` }}
								/>
							</div>
							<p className="tabular text-xs text-muted-foreground">
								{progreso}%
							</p>
						</CardContent>
					</Card>
				</div>
			) : null}
		</div>
	);
}

function ResumenFila({
	etiqueta,
	valor,
	destacado,
}: {
	etiqueta: string;
	valor: string;
	destacado?: boolean;
}) {
	return (
		<div className="flex items-center justify-between gap-3">
			<span className="text-sm text-muted-foreground">{etiqueta}</span>
			<span
				className={cn(
					"text-right text-sm font-medium text-foreground",
					destacado && "font-display text-base font-bold tabular text-primary",
				)}
			>
				{valor}
			</span>
		</div>
	);
}

function Clausula({
	numero,
	titulo,
	children,
}: {
	numero: string;
	titulo: string;
	children: ReactNode;
}) {
	return (
		<p>
			<span className="font-semibold text-slate-900">
				{numero}. {titulo}.
			</span>{" "}
			{children}
		</p>
	);
}

function Dropzone({
	archivo,
	onArchivo,
	icono,
	titulo,
	hint,
}: {
	archivo: File | null;
	onArchivo: (file: File | null) => void;
	icono: ReactNode;
	titulo: string;
	hint: string;
}) {
	const [arrastrando, setArrastrando] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);

	useEffect(() => {
		if (!archivo) {
			setPreviewUrl(null);
			return;
		}
		const esImagen = archivo.type.startsWith("image/");
		if (!esImagen) {
			setPreviewUrl(null);
			return;
		}
		const url = URL.createObjectURL(archivo);
		setPreviewUrl(url);
		return () => URL.revokeObjectURL(url);
	}, [archivo]);

	function aceptar(files: FileList | null) {
		if (!files || files.length === 0) return;
		onArchivo(files[0]);
		toast.success("Archivo adjuntado", { description: files[0].name });
	}

	return (
		<div className="flex flex-col gap-2">
			{archivo ? (
				<div className="flex items-center justify-between gap-3 rounded-lg border border-success/40 bg-success-soft px-3 py-2.5">
					<span className="flex min-w-0 items-center gap-3">
						{previewUrl ? (
							<img
								src={previewUrl}
								alt={archivo.name}
								className="size-12 shrink-0 rounded-md border border-border object-cover"
							/>
						) : (
							<span className="grid size-12 shrink-0 place-items-center rounded-md bg-card text-brand-text">
								<FileText className="size-5" aria-hidden="true" />
							</span>
						)}
						<span className="min-w-0">
							<span className="block truncate text-sm font-medium text-foreground">
								{archivo.name}
							</span>
							<span className="block text-xs text-muted-foreground">
								{(archivo.size / 1024).toFixed(0)} KB
							</span>
						</span>
					</span>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Quitar archivo"
						onClick={() => onArchivo(null)}
					>
						<X aria-hidden="true" />
					</Button>
				</div>
			) : (
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					onDragOver={(e) => {
						e.preventDefault();
						setArrastrando(true);
					}}
					onDragLeave={() => setArrastrando(false)}
					onDrop={(e) => {
						e.preventDefault();
						setArrastrando(false);
						aceptar(e.dataTransfer.files);
					}}
					className={cn(
						"flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors duration-150 ease-out",
						arrastrando
							? "border-primary bg-blue-soft"
							: "border-border hover:border-primary/40 hover:bg-accent/40",
					)}
				>
					<span className="grid size-11 place-items-center rounded-full bg-blue-soft text-brand-text">
						{icono}
					</span>
					<span className="mt-3 font-display text-sm font-bold text-foreground">
						{titulo}
					</span>
					<span className="mt-1 text-xs text-muted-foreground">{hint}</span>
				</button>
			)}
			<input
				ref={inputRef}
				type="file"
				accept="application/pdf,image/*"
				className="sr-only"
				onChange={(e) => aceptar(e.target.files)}
			/>
		</div>
	);
}
