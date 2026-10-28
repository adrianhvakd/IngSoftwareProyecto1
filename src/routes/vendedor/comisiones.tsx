import { createFileRoute } from "@tanstack/react-router";
import { BadgeDollarSign, HandCoins, TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { comisionTone, StatusBadge } from "@/components/common/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatBs, formatFecha, formatPeriodo } from "@/lib/format";
import { listarComisionesVendedor } from "@/server/alquileres/consultas";

export const Route = createFileRoute("/vendedor/comisiones")({
	loader: () => listarComisionesVendedor(),
	head: () => ({
		meta: [{ title: "Comisiones · Panel vendedor · RE/MAX Potosí" }],
	}),
	component: VendedorComisiones,
});

function VendedorComisiones() {
	const { comisiones, comisionFija } = Route.useLoaderData();
	const [anio, setAnio] = useState(() => String(new Date().getFullYear()));

	const anios = useMemo(() => {
		const set = new Set(comisiones.map((c) => c.fecha.slice(0, 4)));
		set.add(String(new Date().getFullYear()));
		return [...set].sort((a, b) => b.localeCompare(a));
	}, [comisiones]);

	const filtradas = comisiones.filter((c) => c.fecha.startsWith(anio));
	const totalHistorico = comisiones.reduce((acc, c) => acc + c.monto, 0);
	const totalAnio = filtradas.reduce((acc, c) => acc + c.monto, 0);
	const promedio =
		filtradas.length > 0 ? Math.round(totalAnio / filtradas.length) : 0;

	const porPeriodo = useMemo(() => {
		const mapa = new Map<string, number>();
		for (const c of filtradas) {
			const clave = c.fecha.slice(0, 7);
			mapa.set(clave, (mapa.get(clave) ?? 0) + c.monto);
		}
		return [...mapa.entries()].sort((a, b) => b[0].localeCompare(a[0]));
	}, [filtradas]);

	const maximo = Math.max(1, ...porPeriodo.map(([, valor]) => valor));

	return (
		<>
			<PageHeader
				title="Mis comisiones"
				description="Detalle de la comisión fija acumulada por cada contrato de alquiler cerrado."
				actions={
					<Select value={anio} onValueChange={setAnio}>
						<SelectTrigger className="w-[140px]" aria-label="Filtrar por año">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{anios.map((a) => (
								<SelectItem key={a} value={a}>
									Año {a}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				}
			/>

			<section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<StatCard
					label="Comisión acumulada (histórico)"
					valor={formatBs(totalHistorico)}
					icono={<HandCoins className="size-4" aria-hidden="true" />}
					tono="primary"
					hint={`${comisiones.length} contratos con tu gestión`}
				/>
				<StatCard
					label={`Comisión ${anio}`}
					valor={formatBs(totalAnio)}
					icono={<Wallet className="size-4" aria-hidden="true" />}
					tono="success"
					hint={`${filtradas.length} contratos cerrados`}
				/>
				<StatCard
					label="Comisión promedio"
					valor={formatBs(promedio)}
					icono={<TrendingUp className="size-4" aria-hidden="true" />}
					tono="primary"
					hint={`En ${anio}`}
				/>
				<StatCard
					label="Comisión fija actual"
					valor={formatBs(comisionFija)}
					icono={<BadgeDollarSign className="size-4" aria-hidden="true" />}
					tono="cta"
					hint="Por cada alquiler cerrado"
				/>
			</section>

			{filtradas.length === 0 ? (
				<EmptyState
					icon={<HandCoins className="size-6" aria-hidden="true" />}
					title={`Sin comisiones en ${anio}`}
					description="Cierra un alquiler para acreditar tu comisión en este periodo."
				/>
			) : (
				<div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
					<div className="overflow-x-auto rounded-xl border border-border bg-card xl:col-span-2">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="pl-5">Contrato</TableHead>
									<TableHead className="hidden md:table-cell">
										Cliente
									</TableHead>
									<TableHead className="hidden lg:table-cell">Fecha</TableHead>
									<TableHead>Estado</TableHead>
									<TableHead className="pr-5 text-right">Comisión</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filtradas.map((c) => (
									<TableRow key={c.id}>
										<TableCell className="pl-5">
											<span className="block font-medium text-foreground">
												{c.codigo}
											</span>
											<span className="block max-w-[200px] truncate text-xs text-muted-foreground">
												{c.inmuebleTitulo}
											</span>
										</TableCell>
										<TableCell className="hidden text-muted-foreground md:table-cell">
											{c.clienteNombre}
										</TableCell>
										<TableCell className="hidden whitespace-nowrap text-muted-foreground lg:table-cell">
											{formatFecha(c.fecha)}
										</TableCell>
										<TableCell>
											<StatusBadge tone={comisionTone[c.estado]}>
												{c.estado}
											</StatusBadge>
										</TableCell>
										<TableCell className="pr-5 text-right font-display font-bold tabular text-foreground">
											{formatBs(c.monto)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
						<div className="flex items-center justify-between border-t border-border px-5 py-3">
							<span className="font-display text-sm font-bold text-foreground">
								Total {anio}
							</span>
							<span className="font-display text-lg font-extrabold tabular text-primary">
								{formatBs(totalAnio)}
							</span>
						</div>
					</div>

					<div className="rounded-xl border border-border bg-card p-6">
						<h2 className="font-display text-base font-bold text-foreground">
							Comisiones por mes
						</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							Acumulado mensual en {anio}.
						</p>
						<div className="mt-5 flex flex-col gap-4">
							{porPeriodo.map(([periodo, valor]) => (
								<div key={periodo}>
									<div className="flex items-center justify-between text-sm">
										<span className="text-muted-foreground">
											{formatPeriodo(periodo)}
										</span>
										<span className="font-medium tabular text-foreground">
											{formatBs(valor)}
										</span>
									</div>
									<div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
										<div
											className="h-full rounded-full bg-primary"
											style={{
												width: `${Math.round((valor / maximo) * 100)}%`,
											}}
										/>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</>
	);
}
