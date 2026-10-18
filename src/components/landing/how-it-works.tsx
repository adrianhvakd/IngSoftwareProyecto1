import { CalendarCheck, FileSignature, Search, Wallet } from "lucide-react";
import { Timeline, type TimelineStep } from "@/components/aceternity/timeline";
import { SectionHeading } from "@/components/common/section-heading";
import { Card, CardContent } from "@/components/ui/card";

const PASOS: TimelineStep[] = [
	{
		id: "buscar",
		titulo: "Busca y compara",
		descripcion:
			"Filtra por tipo, zona y precio. Revisa fotos, superficies y fechas de disponibilidad de cada inmueble antes de decidir.",
		icono: <Search className="size-5" aria-hidden="true" />,
	},
	{
		id: "visita",
		titulo: "Agenda una visita",
		descripcion:
			"Elige el día y la franja horaria que prefieras. Un agente responsable te acompaña y responde todas tus dudas en el lugar.",
		icono: <CalendarCheck className="size-5" aria-hidden="true" />,
	},
	{
		id: "contrato",
		titulo: "Firma tu contrato",
		descripcion:
			"Preparamos el contrato de alquiler con todas las condiciones. Lo revisas, lo firmas y guardamos una copia escaneada.",
		icono: <FileSignature className="size-5" aria-hidden="true" />,
	},
	{
		id: "pago",
		titulo: "Paga tus cuotas",
		descripcion:
			"Recibe recordatorios de cada cuota mensual y paga por QR, tarjeta o efectivo. Descarga tu comprobante cuando lo necesites.",
		icono: <Wallet className="size-5" aria-hidden="true" />,
	},
];

export function HowItWorks() {
	return (
		<section id="como-funciona" className="container-page py-16 lg:py-24">
			<SectionHeading
				title="Cómo funciona"
				description="Alquilar con RE/MAX Potosí es un proceso claro y acompañado, desde la búsqueda hasta el pago de tus cuotas."
			/>

			<div className="mt-12 grid gap-12 lg:grid-cols-[1fr_0.9fr]">
				<Timeline steps={PASOS} />

				<Card className="h-fit border-border bg-card">
					<CardContent className="p-0">
						<div className="rounded-t-xl bg-blue-dark p-6 text-white">
							<p className="font-display text-lg font-bold">
								Acompañamiento en todo el proceso
							</p>
							<p className="mt-2 text-sm text-white/75">
								Cada visita tiene un agente responsable asignado y cada contrato
								queda registrado en el sistema.
							</p>
						</div>
						<dl className="divide-y divide-border">
							{[
								{ t: "Respuesta a consultas", d: "Menos de 24 horas" },
								{ t: "Visitas guiadas", d: "6 franjas horarias por día" },
								{ t: "Contrato formal", d: "Con copia escaneada digital" },
								{ t: "Recordatorio de cuotas", d: "Automático cada mes" },
							].map((fila) => (
								<div
									key={fila.t}
									className="flex items-center justify-between gap-4 px-6 py-4"
								>
									<dt className="text-sm text-muted-foreground">{fila.t}</dt>
									<dd className="text-sm font-semibold text-foreground">
										{fila.d}
									</dd>
								</div>
							))}
						</dl>
					</CardContent>
				</Card>
			</div>
		</section>
	);
}
