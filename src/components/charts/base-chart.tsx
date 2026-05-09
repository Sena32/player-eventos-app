import { cva } from "class-variance-authority"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { cn } from "@/lib/utils"

type ChartType = "line" | "bar" | "area"
type DataVariant = "single" | "multi"
type ChartColorToken =
  | "primary"
  | "secondary"
  | "accent"
  | "success"
  | "info"
  | "warning"
  | "error"
  | "chart-1"
  | "chart-2"
  | "chart-3"
  | "chart-4"
  | "chart-5"

interface ChartSeries {
  dataKey: string
  label?: string
  color?: ChartColorToken
}

interface BaseChartProps<TData extends Record<string, number | string>> {
  chartType: ChartType
  className?: string
  data: TData[]
  xKey: string
  yAxisWidth?: number
  showGrid?: boolean
}

interface SingleSeriesChartProps<TData extends Record<string, number | string>>
  extends BaseChartProps<TData> {
  dataVariant: "single"
  series: ChartSeries
}

interface MultiSeriesChartProps<TData extends Record<string, number | string>>
  extends BaseChartProps<TData> {
  dataVariant: "multi"
  series: [ChartSeries, ...ChartSeries[]]
}

type ReusableChartProps<TData extends Record<string, number | string>> =
  | SingleSeriesChartProps<TData>
  | MultiSeriesChartProps<TData>

const chartVariants = cva("h-60 w-full md:h-72", {
  variants: {
    chartType: {
      line: "",
      bar: "",
      area: "",
    },
    dataVariant: {
      single: "",
      multi: "",
    },
  },
})

const colorMap: Record<ChartColorToken, string> = {
  primary: "var(--color-primary)",
  secondary: "var(--color-secondary)",
  accent: "var(--color-accent)",
  success: "var(--color-success)",
  info: "var(--color-info)",
  warning: "var(--color-warning)",
  error: "var(--color-error)",
  "chart-1": "var(--color-chart-1)",
  "chart-2": "var(--color-chart-2)",
  "chart-3": "var(--color-chart-3)",
  "chart-4": "var(--color-chart-4)",
  "chart-5": "var(--color-chart-5)",
}

const fallbackPalette = [
  colorMap["chart-1"],
  colorMap["chart-2"],
  colorMap["chart-3"],
  colorMap["chart-4"],
  colorMap["chart-5"],
]

function resolveSeriesColor(color: ChartColorToken | undefined, index: number): string {
  if (color) {
    return colorMap[color]
  }

  return fallbackPalette[index % fallbackPalette.length] ?? colorMap["chart-1"]
}

export function BaseChart<TData extends Record<string, number | string>>(
  props: ReusableChartProps<TData>
) {
  const {
    chartType,
    className,
    data,
    xKey,
    yAxisWidth = 48,
    showGrid = true,
    dataVariant,
  } = props

  const series = props.dataVariant === "single" ? [props.series] : props.series

  if (!data.length) {
    return (
      <div
        className={cn(
          chartVariants({ chartType, dataVariant }),
          "flex items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground",
          className
        )}
      >
        Sem dados para exibir.
      </div>
    )
  }

  const commonProps = {
    data,
    margin: { top: 8, right: 8, left: 8, bottom: 0 },
  }

  return (
    <div
      data-slot="base-chart"
      data-chart-type={chartType}
      data-variant={dataVariant}
      className={cn(chartVariants({ chartType, dataVariant }), className)}
    >
      <ResponsiveContainer width="100%" height="100%">
        {chartType === "line" ? (
          <LineChart {...commonProps}>
            {showGrid ? <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" /> : null}
            <XAxis dataKey={xKey} stroke="var(--color-muted-foreground)" />
            <YAxis width={yAxisWidth} stroke="var(--color-muted-foreground)" />
            <Tooltip />
            <Legend />
            {series.map((item, index) => (
              <Line
                key={item.dataKey}
                dataKey={item.dataKey}
                name={item.label ?? item.dataKey}
                stroke={resolveSeriesColor(item.color, index)}
                strokeWidth={2}
                dot={false}
                type="monotone"
              />
            ))}
          </LineChart>
        ) : null}

        {chartType === "bar" ? (
          <BarChart {...commonProps}>
            {showGrid ? <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" /> : null}
            <XAxis dataKey={xKey} stroke="var(--color-muted-foreground)" />
            <YAxis width={yAxisWidth} stroke="var(--color-muted-foreground)" />
            <Tooltip />
            <Legend />
            {series.map((item, index) => (
              <Bar
                key={item.dataKey}
                dataKey={item.dataKey}
                name={item.label ?? item.dataKey}
                fill={resolveSeriesColor(item.color, index)}
                radius={[8, 8, 0, 0]}
              />
            ))}
          </BarChart>
        ) : null}

        {chartType === "area" ? (
          <AreaChart {...commonProps}>
            {showGrid ? <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" /> : null}
            <XAxis dataKey={xKey} stroke="var(--color-muted-foreground)" />
            <YAxis width={yAxisWidth} stroke="var(--color-muted-foreground)" />
            <Tooltip />
            <Legend />
            {series.map((item, index) => {
              const color = resolveSeriesColor(item.color, index)

              return (
                <Area
                  key={item.dataKey}
                  dataKey={item.dataKey}
                  name={item.label ?? item.dataKey}
                  stroke={color}
                  fill={color}
                  fillOpacity={0.18}
                  type="monotone"
                />
              )
            })}
          </AreaChart>
        ) : null}
      </ResponsiveContainer>
    </div>
  )
}

export type { BaseChartProps, ChartSeries, ChartType, DataVariant, ReusableChartProps }
