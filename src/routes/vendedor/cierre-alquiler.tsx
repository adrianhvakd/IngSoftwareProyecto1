import { createFileRoute, Link } from "@tanstack/react-router";
import { cn } from "cn";
import {
	ArrowLeft,
	ArrowRight,
	Building2,
	Check,
	CheckCircle2,
	FileSignature,
	FileText,
	Printer,
	Upload,
	UserPlus,
	UserRound,
	X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { StatusBadge } from "@/components/common/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { clientes } from "@/data/clientes";
import { inmuebles } from "@/data/inmuebles";
import { proveedores } from "@/data/proveedores";
import { vendedorActual } from "@/data/vendedores";
import { formatBs, formatFechaLarga } from "@/lib/format";

export const Route = createFileRoute("/vendedor/cierre-alquiler")({
	head: () => ({
		meta: [{ title: "Cierre de alquiler · Panel vendedor · RE/MAX Potosí" }],
	}),
	component: CierreAlquiler,
});

const PASOS = [
	{ numero: 1, titulo: "Datos del cliente", icono: UserRound },
	{ numero: 2, titulo: "Contrato", icono: FileText },
	{ numero: 3, titulo: "Firma y comisión", icono: FileSignature },
];

function sumarMeses(fecha: string, meses: number): string {
	const base = new Date(`${fecha}T00:00:00`);
	if (Number.isNaN(base.getTime())) return fecha;
	base.setMonth(base.getMonth() + meses);
	base.setDate(base.getDate() - 1);
	return base.toISOString().slice(0, 10);
}

function CierreAlquiler() {
	const [paso, setPaso] = useState(1);
	const [modo, setModo] = useState<"existente" | "nuevo">("existente");
	const [clienteId, setClienteId] = useState(clientes[0].id);
	const [nuevoNombre, setNuevoNombre] = useState("");
	const [nuevoEmail, setNuevoEmail] = useState("");
	const [nuevoTelefono, setNuevoTelefono] = useState("+591 ");
	const [inmuebleId, setInmuebleId] = useState(inmuebles[0].id);
	const [fechaInicio, setFechaInicio] = useState("2026-11-01");
	const [duracion, setDuracion] = useState("12");
	const [montoMensual, setMontoMensual] = useState(String(inmuebles[0].precio));
	const [diaCobro, setDiaCobro] = useState("5");
	const [deposito, setDeposito] = useState(String(inmuebles[0].precio));
	const [comision, setComision] = useState(String(vendedorActual.comisionFija));
	const [archivoContrato, setArchivoContrato] = useState<string | null>(null);
	const [arrastrando, setArrastrando] = useState(false);
	const [exito, setExito] = useState(false);
	const inputContrato = useRef<HTMLInputElement>(null);

	const inmueble = inmuebles.find((i) => i.id === inmuebleId) ?? inmuebles[0];
	const proveedor = proveedores.find((p) => p.id === inmueble.proveedorId);
	const clienteExistente = clientes.find((c) => c.id === clienteId);

	const arrendatario = useMemo(() => {
		if (modo === "existente" && clienteExistente)
			return clienteExistente.nombre;
		return nuevoNombre || "—";
	}, [modo, clienteExistente, nuevoNombre]);

	const fechaFin = sumarMeses(fechaInicio, Number(duracion) || 12);
	const totalCierre = (Number(deposito) || 0) + (Number(montoMensual) || 0);

	function seleccionarInmueble(id: string) {
		setInmuebleId(id);
		const elegido = inmuebles.find((i) => i.id === id);
		if (elegido) {
			setMontoMensual(String(elegido.precio));
			setDeposito(String(elegido.precio));
		}
	}

	function siguienteDesdePaso1() {
		if (modo === "nuevo" && (!nuevoNombre.trim() || !nuevoEmail.trim())) {
			toast.error("Completa los datos del cliente", {
				description: "El nombre y el correo son obligatorios para el contrato.",
			});
			return;
		}
		setPaso(2);
	}

	function agregarContrato(files: FileList | null) {
		if (!files || files.length === 0) return;
		setArchivoContrato(files[0].name);
		toast.success("Contrato cargado", {
			description: `${files[0].name} adjuntado al expediente.`,
		});
	}

	function finalizar() {
		if (!archivoContrato) {
			toast.error("Falta el contrato escaneado", {
				description: "Adjunta el documento firmado para completar el cierre.",
			});
			return;
		}
		setExito(true);
	}

	return (
		<div className="pb-4">
			<div className="no-print mb-5 flex items-center justify-between">
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

			<div className="no-print">
				<PageHeader
					title="Cierre de alquiler"
					description="Registra el acuerdo, genera el contrato y adjunta la firma para cerrar el alquiler."
				/>
			</div>

			<ol className="no-print mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
				{PASOS.map((p) => {
					const Icono = p.icono;
					const activo = paso === p.numero;
					const completado = paso > p.numero;
					return (
						<li
							key={p.numero}
							className={cn(
								"flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
								activo
									? "border-primary/40 bg-blue-soft"
									: "border-border bg-card",
							)}
						>
							<span
								className={cn(
									"grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold",
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
									p.numero
								)}
							</span>
							<span className="flex items-center gap-2">
								<Icono
									className={cn(
										"size-4",
										activo ? "text-primary" : "text-muted-foreground",
									)}
									aria-hidden="true"
								/>
								<span
									className={cn(
										"text-sm font-semibold",
										activo ? "text-blue-deep" : "text-foreground",
									)}
								>
									{p.titulo}
								</span>
							</span>
						</li>
					);
				})}
			</ol>

			{paso === 1 ? (
				<div className="no-print mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
					<Card className="xl:col-span-2">
						<CardContent className="flex flex-col gap-5 pt-6">
							<div>
								<h2 className="font-display text-base font-bold text-foreground">
									Cliente arrendatario
								</h2>
								<p className="mt-1 text-sm text-muted-foreground">
									Selecciona un cliente registrado o crea uno nuevo.
								</p>
							</div>

							<RadioGroup
								value={modo}
								onValueChange={(v) => setModo(v as "existente" | "nuevo")}
								className="grid grid-cols-1 gap-3 sm:grid-cols-2"
							>
								<label
									htmlFor="modo-existente"
									className={cn(
										"flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
										modo === "existente"
											? "border-primary/40 bg-blue-soft"
											: "border-border",
									)}
								>
									<RadioGroupItem id="modo-existente" value="existente" />
									<UserRound
										className="size-4 text-primary"
										aria-hidden="true"
									/>
									<span className="text-sm font-medium text-foreground">
										Cliente registrado
									</span>
								</label>
								<label
									htmlFor="modo-nuevo"
									className={cn(
										"flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
										modo === "nuevo"
											? "border-primary/40 bg-blue-soft"
											: "border-border",
									)}
								>
									<RadioGroupItem id="modo-nuevo" value="nuevo" />
									<UserPlus
										className="size-4 text-primary"
										aria-hidden="true"
									/>
									<span className="text-sm font-medium text-foreground">
										Registrar cliente nuevo
									</span>
								</label>
							</RadioGroup>

							{modo === "existente" ? (
								<div className="flex flex-col gap-2">
									<Label htmlFor="c-cliente">Cliente</Label>
									<Select value={clienteId} onValueChange={setClienteId}>
										<SelectTrigger id="c-cliente" aria-label="Cliente">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{clientes.map((c) => (
												<SelectItem key={c.id} value={c.id}>
													{c.nombre} · {c.telefonoContacto}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							) : (
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
									<div className="flex flex-col gap-2 sm:col-span-3">
										<Label htmlFor="c-nombre">Nombre completo *</Label>
										<Input
											id="c-nombre"
											value={nuevoNombre}
											onChange={(e) => setNuevoNombre(e.target.value)}
											placeholder="Ej. Andrea Salinas Tórrez"
										/>
									</div>
									<div className="flex flex-col gap-2 sm:col-span-2">
										<Label htmlFor="c-email">Correo *</Label>
										<Input
											id="c-email"
											type="email"
											value={nuevoEmail}
											onChange={(e) => setNuevoEmail(e.target.value)}
											placeholder="cliente@correo.com"
										/>
									</div>
									<div className="flex flex-col gap-2">
										<Label htmlFor="c-tel">Teléfono</Label>
										<Input
											id="c-tel"
											value={nuevoTelefono}
											onChange={(e) => setNuevoTelefono(e.target.value)}
										/>
									</div>
								</div>
							)}

							<Separator />

							<div>
								<h2 className="font-display text-base font-bold text-foreground">
									Inmueble y condiciones
								</h2>
							</div>

							<div className="flex flex-col gap-2">
								<Label htmlFor="c-inmueble">Inmueble</Label>
								<Select value={inmuebleId} onValueChange={seleccionarInmueble}>
									<SelectTrigger id="c-inmueble" aria-label="Inmueble">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{inmuebles.map((i) => (
											<SelectItem key={i.id} value={i.id}>
												{i.codigo} · {i.titulo}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<p className="flex items-center gap-1.5 text-xs text-muted-foreground">
									<Building2
										className="size-3.5 text-primary/70"
										aria-hidden="true"
									/>
									{inmueble.tipo} en {inmueble.zona} · propietario{" "}
									{proveedor?.nombre}
								</p>
							</div>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
							</div>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
									<Label htmlFor="c-com">Comisión agente (Bs)</Label>
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
							<ResumenFila etiqueta="Inmueble" valor={inmueble.codigo} />
							<ResumenFila
								etiqueta="Inicio"
								valor={formatFechaLarga(fechaInicio)}
							/>
							<ResumenFila etiqueta="Fin" valor={formatFechaLarga(fechaFin)} />
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
								etiqueta="Comisión agente"
								valor={formatBs(Number(comision) || 0)}
							/>
							<Separator />
							<ResumenFila
								etiqueta="Cobro de cierre"
								valor={formatBs(totalCierre)}
								destacado
							/>
							<Button
								variant="default"
								className="mt-2 w-full"
								onClick={siguienteDesdePaso1}
							>
								Previsualizar contrato
								<ArrowRight aria-hidden="true" />
							</Button>
						</CardContent>
					</Card>
				</div>
			) : null}

			{paso === 2 ? (
				<div className="mt-6 flex flex-col gap-4">
					<div className="no-print flex flex-wrap items-center justify-between gap-3">
						<Button variant="outline" onClick={() => setPaso(1)}>
							<ArrowLeft aria-hidden="true" />
							Atrás
						</Button>
						<div className="flex gap-2">
							<Button variant="secondary" onClick={() => window.print()}>
								<Printer aria-hidden="true" />
								Imprimir / PDF
							</Button>
							<Button variant="default" onClick={() => setPaso(3)}>
								Continuar a firma
								<ArrowRight aria-hidden="true" />
							</Button>
						</div>
					</div>

					<article className="print-document mx-auto w-full max-w-3xl rounded-xl border border-border bg-white p-8 text-[13px] leading-relaxed text-slate-800 shadow-sm sm:p-12">
						<header className="flex items-center justify-between border-b border-slate-200 pb-5">
							<Logo />
							<div className="text-right text-[11px] text-slate-500">
								<p className="font-semibold text-slate-700">Oficina Potosí</p>
								<p>Av. Villazón · Ciudad de Potosí</p>
								<p>+591 2 6220000</p>
							</div>
						</header>

						<h1 className="mt-8 text-center font-display text-lg font-extrabold tracking-tight text-slate-900">
							CONTRATO DE ARRENDAMIENTO DE INMUEBLE
						</h1>
						<p className="mt-1 text-center text-[11px] text-slate-500">
							Ref. {inmueble.codigo} · Suscrito en la ciudad de Potosí
						</p>

						<section className="mt-6 flex flex-col gap-3">
							<p>
								Conste por el presente documento el contrato de arrendamiento
								que celebran, por una parte,{" "}
								<strong>{proveedor?.nombre}</strong>, en calidad de{" "}
								<strong>ARRENDADOR</strong>, y por otra,{" "}
								<strong>{arrendatario}</strong>
								{modo === "nuevo" ? ` (${nuevoTelefono})` : ""}, en calidad de{" "}
								<strong>ARRENDATARIO</strong>, bajo las siguientes cláusulas:
							</p>
						</section>

						<section className="mt-5 flex flex-col gap-4">
							<Clausula numero="PRIMERA" titulo="Objeto">
								El ARRENDADOR concede en arrendamiento al ARRENDATARIO el
								inmueble tipo {inmueble.tipo.toLowerCase()} ubicado en{" "}
								{inmueble.direccion}, zona {inmueble.zona}, con una superficie
								aproximada de {inmueble.m2} m².
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
								garantía, el cual será devuelto al término del contrato previa
								verificación del estado del inmueble.
							</Clausula>
							<Clausula numero="QUINTA" titulo="Comisión">
								El ARRENDADOR reconoce a RE/MAX Potosí una comisión de{" "}
								{formatBs(Number(comision) || 0)} por la intermediación y cierre
								del presente contrato.
							</Clausula>
						</section>

						<section className="mt-12 grid grid-cols-2 gap-10 text-center">
							<div>
								<div className="border-t border-slate-400 pt-2">
									<p className="font-semibold text-slate-700">
										{proveedor?.nombre}
									</p>
									<p className="text-[11px] text-slate-500">ARRENDADOR</p>
								</div>
							</div>
							<div>
								<div className="border-t border-slate-400 pt-2">
									<p className="font-semibold text-slate-700">{arrendatario}</p>
									<p className="text-[11px] text-slate-500">ARRENDATARIO</p>
								</div>
							</div>
						</section>

						<footer className="mt-10 flex items-center justify-between border-t border-slate-200 pt-4 text-[10px] text-slate-400">
							<span>RE/MAX Potosí · Gestión de alquileres</span>
							<span>
								Agente: {vendedorActual.nombre} · {vendedorActual.telefono}
							</span>
						</footer>
					</article>
				</div>
			) : null}

			{paso === 3 ? (
				<div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
					<Card className="xl:col-span-2">
						<CardContent className="flex flex-col gap-5 pt-6">
							<div>
								<h2 className="font-display text-base font-bold text-foreground">
									Contrato escaneado
								</h2>
								<p className="mt-1 text-sm text-muted-foreground">
									Adjunta el contrato firmado por ambas partes para completar el
									expediente.
								</p>
							</div>

							<button
								type="button"
								onClick={() => inputContrato.current?.click()}
								onDragOver={(e) => {
									e.preventDefault();
									setArrastrando(true);
								}}
								onDragLeave={() => setArrastrando(false)}
								onDrop={(e) => {
									e.preventDefault();
									setArrastrando(false);
									agregarContrato(e.dataTransfer.files);
								}}
								className={cn(
									"flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-150",
									arrastrando
										? "border-primary bg-blue-soft"
										: archivoContrato
											? "border-success/40 bg-success-soft"
											: "border-border hover:border-primary/40 hover:bg-accent/40",
								)}
							>
								<span
									className={cn(
										"grid size-12 place-items-center rounded-full",
										archivoContrato
											? "bg-success text-white"
											: "bg-blue-soft text-primary",
									)}
								>
									{archivoContrato ? (
										<CheckCircle2 className="size-5" aria-hidden="true" />
									) : (
										<Upload className="size-5" aria-hidden="true" />
									)}
								</span>
								<span className="mt-3 font-display text-sm font-bold text-foreground">
									{archivoContrato
										? "Contrato adjuntado"
										: "Arrastra el contrato escaneado o haz clic para subir"}
								</span>
								<span className="mt-1 text-xs text-muted-foreground">
									{archivoContrato ?? "PDF o imagen del contrato firmado."}
								</span>
							</button>
							<input
								ref={inputContrato}
								type="file"
								accept="application/pdf,image/*"
								className="sr-only"
								onChange={(e) => agregarContrato(e.target.files)}
							/>

							{archivoContrato ? (
								<div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
									<span className="flex items-center gap-2 text-sm text-foreground">
										<FileText
											className="size-4 text-primary"
											aria-hidden="true"
										/>
										{archivoContrato}
									</span>
									<Button
										variant="ghost"
										size="icon-sm"
										aria-label="Quitar contrato"
										onClick={() => setArchivoContrato(null)}
									>
										<X aria-hidden="true" />
									</Button>
								</div>
							) : null}

							<div className="flex flex-wrap gap-3">
								<Button variant="outline" onClick={() => setPaso(2)}>
									<ArrowLeft aria-hidden="true" />
									Atrás
								</Button>
								<Button variant="secondary" onClick={() => window.print()}>
									<Printer aria-hidden="true" />
									Reimprimir contrato
								</Button>
								<Button variant="cta" onClick={finalizar}>
									<Check aria-hidden="true" />
									Finalizar cierre de alquiler
								</Button>
							</div>
						</CardContent>
					</Card>

					<Card className="h-fit">
						<CardContent className="flex flex-col gap-3 pt-6">
							<h2 className="font-display text-base font-bold text-foreground">
								Resumen de comisión
							</h2>
							<ResumenFila etiqueta="Agente" valor={vendedorActual.nombre} />
							<ResumenFila etiqueta="Inmueble" valor={inmueble.codigo} />
							<ResumenFila etiqueta="Arrendatario" valor={arrendatario} />
							<Separator />
							<ResumenFila
								etiqueta="Alquiler mensual"
								valor={formatBs(Number(montoMensual) || 0)}
							/>
							<ResumenFila
								etiqueta="Depósito de garantía"
								valor={formatBs(Number(deposito) || 0)}
							/>
							<ResumenFila
								etiqueta="Cobro de cierre"
								valor={formatBs(totalCierre)}
							/>
							<Separator />
							<div className="flex items-center justify-between rounded-lg bg-success-soft px-4 py-3">
								<span className="text-sm font-medium text-success">
									Comisión del agente
								</span>
								<span className="font-display text-lg font-extrabold tabular text-success">
									{formatBs(Number(comision) || 0)}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-xs text-muted-foreground">
									Estado del expediente
								</span>
								<StatusBadge tone={archivoContrato ? "success" : "warning"} dot>
									{archivoContrato ? "Listo para cerrar" : "Falta firma"}
								</StatusBadge>
							</div>
						</CardContent>
					</Card>
				</div>
			) : null}

			<Dialog open={exito} onOpenChange={setExito}>
				<DialogContent>
					<DialogHeader>
						<div className="mx-auto grid size-12 place-items-center rounded-full bg-success-soft text-success">
							<CheckCircle2 className="size-6" aria-hidden="true" />
						</div>
						<DialogTitle className="text-center font-display">
							¡Alquiler cerrado con éxito!
						</DialogTitle>
						<DialogDescription className="text-center">
							Se registró el contrato del inmueble {inmueble.codigo} a nombre de{" "}
							{arrendatario}. La comisión de {formatBs(Number(comision) || 0)}{" "}
							quedó acreditada al agente {vendedorActual.nombre}.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="sm:justify-center">
						<Button
							variant="outline"
							onClick={() => {
								setExito(false);
								setPaso(1);
								setArchivoContrato(null);
							}}
						>
							Cerrar otro alquiler
						</Button>
						<Button asChild variant="cta">
							<Link to="/vendedor/comisiones">Ver mis comisiones</Link>
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
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
