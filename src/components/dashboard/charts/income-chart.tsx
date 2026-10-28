import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { formatBs, formatNumber } from "@/lib/format";
import type { PuntoIngresoAdmin } from "@/types/admin";

const config = {
	cobrado: { label: "Cobrado", color: "var(--chart-1)" },
	comisiones: { label: "Comisiones", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function IncomeChart({ data }: { data: PuntoIngresoAdmin[] }) {
	return (
		<ChartContainer config={config} className="aspect-auto h-[300px] w-full">
			<AreaChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
				<defs>
					<linearGradient id="fill-cobrado" x1="0" y1="0" x2="0" y2="1">
						<stop
							offset="0%"
							stopColor="var(--color-cobrado)"
							stopOpacity={0.28}
						/>
						<stop
							offset="100%"
							stopColor="var(--color-cobrado)"
							stopOpacity={0.02}
						/>
					</linearGradient>
				</defs>
				<CartesianGrid vertical={false} strokeDasharray="3 3" />
				<XAxis
					dataKey="mes"
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					className="text-xs"
				/>
				<YAxis
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					width={56}
					tickFormatter={(value) => `${formatNumber(Number(value))}`}
					className="text-xs"
				/>
				<ChartTooltip
					cursor={false}
					content={
						<ChartTooltipContent
							indicator="line"
							formatter={(value, name) => (
								<span className="flex w-full items-center justify-between gap-4">
									<span className="text-muted-foreground">
										{config[name as keyof typeof config]?.label ?? name}
									</span>
									<span className="font-medium tabular text-foreground">
										{formatBs(Number(value))}
									</span>
								</span>
							)}
						/>
					}
				/>
				<Area
					dataKey="cobrado"
					type="natural"
					stroke="var(--color-cobrado)"
					strokeWidth={2.5}
					fill="url(#fill-cobrado)"
				/>
				<Area
					dataKey="comisiones"
					type="natural"
					stroke="var(--color-comisiones)"
					strokeWidth={2}
					strokeDasharray="4 4"
					fill="transparent"
				/>
			</AreaChart>
		</ChartContainer>
	);
}
