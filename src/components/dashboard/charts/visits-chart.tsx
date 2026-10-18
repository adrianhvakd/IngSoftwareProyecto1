import { Cell, Pie, PieChart } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { visitas } from "@/data/visitas";

const config = {
	Pendiente: { label: "Pendientes", color: "var(--chart-3)" },
	Realizada: { label: "Realizadas", color: "var(--chart-1)" },
	Cancelada: { label: "Canceladas", color: "var(--chart-4)" },
} satisfies ChartConfig;

const ESTADOS = ["Pendiente", "Realizada", "Cancelada"] as const;

const data = ESTADOS.map((estado) => ({
	estado,
	cantidad: visitas.filter((v) => v.estado === estado).length,
}));

export function VisitsChart() {
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
