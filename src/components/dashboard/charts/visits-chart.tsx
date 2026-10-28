import { Cell, Pie, PieChart } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import type { VisitaEstado } from "@/types/models";

const config = {
	Pendiente: { label: "Pendientes", color: "var(--chart-3)" },
	Realizada: { label: "Realizadas", color: "var(--chart-1)" },
	Cancelada: { label: "Canceladas", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function VisitsChart({
	data,
}: {
	data: Array<{ estado: VisitaEstado; cantidad: number }>;
}) {
	return (
		<ChartContainer config={config} className="mx-auto aspect-square h-[260px]">
			<PieChart>
				<ChartTooltip
					cursor={false}
					content={<ChartTooltipContent nameKey="estado" hideLabel />}
				/>
				<Pie
					data={data}
					dataKey="cantidad"
					nameKey="estado"
					innerRadius={60}
					outerRadius={95}
					strokeWidth={4}
					paddingAngle={2}
				>
					{data.map((entry) => (
						<Cell key={entry.estado} fill={`var(--color-${entry.estado})`} />
					))}
				</Pie>
				<ChartLegend content={<ChartLegendContent nameKey="estado" />} />
			</PieChart>
		</ChartContainer>
	);
}
