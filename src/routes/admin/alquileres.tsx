import { createFileRoute } from "@tanstack/react-router";
import {
	BadgeDollarSign,
	CalendarClock,
	CircleAlert,
	Download,
	FileText,
	Plus,
	ReceiptText,
	TriangleAlert,
	Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/empty-state";
import {
	alquilerTone,
	cuotaTone,
	StatusBadge,
} from "@/components/common/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AlquilerDetalle } from "@/data";
import {
	getAlquileresDetalle,
	getPagosDeAlquiler,
	getResumenAdministrador,
} from "@/data";
import {
	formatBs,
	formatBsMes,
	formatFecha,
	formatPeriodo,
} from "@/lib/format";

export const Route = createFileRoute("/admin/alquileres")({
	head: () => ({
		meta: [{ title: "Alquileres y cobros · Administración · RE/MAX Potosí" }],
	}),
	component: AdminAlquileres,
});

type Filtro = "todos" | "Vigente" | "Finalizado" | "mora";

function AdminAlquileres() {
	const resumen = getResumenAdministrador();
	const alquileres = useMemo(() => getAlquileresDetalle(), []);
	const [filtro, setFiltro] = useState<Filtro>("todos");
	const [detalle, setDetalle] = useState<AlquilerDetalle | null>(null);

	const visibles = useMemo(() => {
		if (filtro === "todos") return alquileres;
		if (filtro === "mora")
			return alquileres.filter((a) => a.cuotaActual?.estado === "En mora");
		return alquileres.filter((a) => a.estado === filtro);
	}, [alquileres, filtro]);

	const conMora = alquileres.filter(
		(a) => a.cuotaActual?.estado === "En mora",
	).length;

	return (
		<>
			<PageHeader
				title="Alquileres y cobros"
				description="Contratos vigentes, calendario de cuotas recurrentes y estado de cobranza."
				actions={
					<Button
						variant="cta"
						onClick={() =>
							toast.info("Procesar alquiler", {
								description:
									"Se abriría el asistente de cierre de contrato. (Acción simulada)",
							})
						}
					>
						<ReceiptText aria-hidden="true" />
						Procesar alquiler
					</Button>
				}
			/>

			<section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<StatCard
					label="Contratos vigentes"
					valor={String(resumen.alquileresVigentes)}
					icono={<FileText className="size-4" aria-hidden="true" />}
					tono="primary"
					hint={`${alquileres.length} contratos en total`}
				/>
				<StatCard
					label="Cobrado en octubre"
					valor={formatBs(resumen.cobrosDelMes)}
					icono={<Wallet className="size-4" aria-hidden="true" />}
					tono="success"
					tendencia={{ valor: "5%", direccion: "up" }}
				/>
				<StatCard
					label="Cuotas en mora"
					valor={String(resumen.cuotasEnMora)}
					icono={<CircleAlert className="size-4" aria-hidden="true" />}
					tono="danger"
					hint={`${conMora} contrato(s) afectado(s)`}
				/>
				<StatCard
					label="Mora acumulada"
					valor={formatBs(resumen.moraTotal)}
					icono={<BadgeDollarSign className="size-4" aria-hidden="true" />}
					tono="cta"
					hint={`${resumen.morosidadPorcentaje}% de morosidad`}
				/>
			</section>

			<Tabs value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
				<TabsList>
					<TabsTrigger value="todos">Todos</TabsTrigger>
					<TabsTrigger value="Vigente">Vigentes</TabsTrigger>
					<TabsTrigger value="mora">En mora</TabsTrigger>
					<TabsTrigger value="Finalizado">Finalizados</TabsTrigger>
				</TabsList>
			</Tabs>

			{visibles.length === 0 ? (
				<EmptyState
					icon={<ReceiptText className="size-6" aria-hidden="true" />}
					title="Sin contratos en esta vista"
					description="Cambia el filtro para ver otros contratos de alquiler."
				/>
			) : (
				<div className="overflow-x-auto rounded-xl border border-border bg-card">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="pl-5">Contrato</TableHead>
								<TableHead className="hidden md:table-cell">Cliente</TableHead>
								<TableHead>Monto mensual</TableHead>
								<TableHead className="hidden lg:table-cell">Periodo</TableHead>
								<TableHead>Cuota actual</TableHead>
								<TableHead>Estado</TableHead>
								<TableHead className="pr-5 text-right">Acciones</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{visibles.map((a) => (
								<TableRow key={a.id}>
									<TableCell className="pl-5">
										<span className="block font-medium text-foreground">
											{a.codigo}
										</span>
										<span className="block max-w-[200px] truncate text-xs text-muted-foreground">
											{a.inmueble.titulo}
										</span>
									</TableCell>
									<TableCell className="hidden md:table-cell">
										<span className="block text-sm font-medium text-foreground">
											{a.cliente.nombre}
										</span>
										<span className="block text-xs text-muted-foreground tabular">
											{a.cliente.telefonoContacto}
										</span>
									</TableCell>
									<TableCell className="whitespace-nowrap font-medium tabular text-foreground">
										{formatBsMes(a.montoMensual)}
									</TableCell>
									<TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground lg:table-cell">
										{formatFecha(a.fechaInicio)} — {formatFecha(a.fechaFin)}
									</TableCell>
									<TableCell>
										{a.cuotaActual ? (
											<div className="flex flex-col gap-1">
												<StatusBadge tone={cuotaTone[a.cuotaActual.estado]}>
													{a.cuotaActual.estado}
												</StatusBadge>
												<span className="text-xs text-muted-foreground">
													{formatPeriodo(a.cuotaActual.periodo)}
												</span>
											</div>
										) : (
											<span className="text-xs text-muted-foreground">—</span>
										)}
									</TableCell>
									<TableCell>
										<StatusBadge tone={alquilerTone[a.estado]}>
											{a.estado}
										</StatusBadge>
									</TableCell>
									<TableCell className="pr-5 text-right">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setDetalle(a)}
										>
											Ver detalle
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}

			<Sheet
				open={detalle !== null}
				onOpenChange={(open) => !open && setDetalle(null)}
			>
				<SheetContent className="w-full overflow-y-auto sm:max-w-xl">
					{detalle ? <DetalleAlquiler alquiler={detalle} /> : null}
				</SheetContent>
			</Sheet>
		</>
	);
}

function DetalleAlquiler({ alquiler }: { alquiler: AlquilerDetalle }) {
	const pagos = getPagosDeAlquiler(alquiler.id);

	return (
		<>
			<SheetHeader>
				<SheetTitle className="font-display">
					Contrato {alquiler.codigo}
				</SheetTitle>
				<SheetDescription>
					{alquiler.inmueble.titulo} · {alquiler.inmueble.codigo}
				</SheetDescription>
			</SheetHeader>

			<div className="flex flex-col gap-6 px-4">
				<div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-card p-4">
					<Dato etiqueta="Cliente" valor={alquiler.cliente.nombre} />
					<Dato
						etiqueta="Teléfono"
						valor={alquiler.cliente.telefonoContacto}
						tabular
					/>
					<Dato
						etiqueta="Agente responsable"
						valor={alquiler.vendedor?.nombre ?? "Sin asignar"}
					/>
					<Dato
						etiqueta="Día de cobro"
						valor={`Día ${alquiler.diaCobro} de cada mes`}
					/>
					<Dato etiqueta="Inicio" valor={formatFecha(alquiler.fechaInicio)} />
					<Dato etiqueta="Fin" valor={formatFecha(alquiler.fechaFin)} />
				</div>

				<div className="grid grid-cols-2 gap-4 rounded-xl border border-primary/20 bg-blue-soft/50 p-4">
					<Dato
						etiqueta="Alquiler mensual"
						valor={formatBs(alquiler.montoMensual)}
						destacado
					/>
					<Dato
						etiqueta="Depósito de garantía"
						valor={formatBs(alquiler.deposito)}
					/>
					<Dato
						etiqueta="Comisión del agente"
						valor={formatBs(alquiler.comisionFija)}
					/>
					<Dato
						etiqueta="Contrato escaneado"
						valor={alquiler.contratoEscaneado ? "Sí, archivado" : "Pendiente"}
					/>
				</div>

				<div>
					<div className="mb-3 flex items-center justify-between">
						<h3 className="flex items-center gap-2 font-display text-sm font-bold text-foreground">
							<CalendarClock
								className="size-4 text-primary"
								aria-hidden="true"
							/>
							Calendario de cuotas
						</h3>
						<StatusBadge tone={alquilerTone[alquiler.estado]}>
							{alquiler.estado}
						</StatusBadge>
					</div>

					<div className="overflow-x-auto rounded-xl border border-border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="pl-4">#</TableHead>
									<TableHead>Periodo</TableHead>
									<TableHead>Vence</TableHead>
									<TableHead className="hidden sm:table-cell">Pago</TableHead>
									<TableHead>Monto</TableHead>
									<TableHead className="pr-4 text-right">Estado</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{pagos.map((p) => (
									<TableRow key={p.id}>
										<TableCell className="pl-4 tabular text-muted-foreground">
											{p.numeroCuota}
										</TableCell>
										<TableCell className="whitespace-nowrap font-medium text-foreground">
											{formatPeriodo(p.periodo)}
										</TableCell>
										<TableCell className="whitespace-nowrap text-muted-foreground">
											{formatFecha(p.fechaVencimiento)}
										</TableCell>
										<TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
											{p.fechaPago ? formatFecha(p.fechaPago) : "—"}
										</TableCell>
										<TableCell className="whitespace-nowrap">
											<span className="font-medium tabular text-foreground">
												{formatBs(p.monto)}
											</span>
											{p.recargoMora > 0 ? (
												<span className="ml-1 inline-flex items-center gap-0.5 text-[11px] text-destructive">
													<TriangleAlert
														className="size-3"
														aria-hidden="true"
													/>
													+{formatBs(p.recargoMora)}
												</span>
											) : null}
										</TableCell>
										<TableCell className="pr-4 text-right">
											<StatusBadge tone={cuotaTone[p.estado]}>
												{p.estado}
											</StatusBadge>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</div>

				<Separator />

				<div className="flex flex-col gap-3 sm:flex-row">
					<Button
						variant="cta"
						className="flex-1"
						onClick={() =>
							toast.success("Cobro registrado", {
								description:
									"Se registró el pago de la cuota actual. (Acción simulada)",
							})
						}
					>
						<Plus aria-hidden="true" />
						Registrar pago
					</Button>
					<Button
						variant="outline"
						className="flex-1"
						onClick={() =>
							toast.info("Descargando contrato", {
								description: `${alquiler.codigo}.pdf (Acción simulada)`,
							})
						}
					>
						<Download aria-hidden="true" />
						Descargar contrato
					</Button>
				</div>
			</div>
		</>
	);
}

function Dato({
	etiqueta,
	valor,
	tabular,
	destacado,
}: {
	etiqueta: string;
	valor: string;
	tabular?: boolean;
	destacado?: boolean;
}) {
	return (
		<div>
			<p className="text-xs text-muted-foreground">{etiqueta}</p>
			<p
				className={
					destacado
						? "mt-0.5 font-display text-base font-bold tabular text-primary"
						: `mt-0.5 text-sm font-medium text-foreground ${tabular ? "tabular" : ""}`
				}
			>
				{valor}
			</p>
		</div>
	);
}
