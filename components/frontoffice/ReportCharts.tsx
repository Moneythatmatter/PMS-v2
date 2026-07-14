"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReportChartConfig } from "@/app/data/frontoffice/reports";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatINR } from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";

const DEFAULT_COLORS = ["#15803d", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#64748b"];

const tooltipStyle = {
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  fontSize: "12px",
};

function formatChartValue(value: number, format?: ReportChartConfig["valueFormat"]) {
  if (format === "currency") return formatINR(value);
  if (format === "percent") return `${value}%`;
  return value.toLocaleString("en-IN");
}

function ReportChartCard({ config }: { config: ReportChartConfig }) {
  const dataKey = config.dataKey ?? "value";
  const isHorizontal = config.layout === "horizontal";
  const chartHeight = "h-48 sm:h-56";

  const formatTooltip = (value: number | string) => {
    const num = typeof value === "number" ? value : Number(value);
    if (Number.isNaN(num)) return String(value);
    return formatChartValue(num, config.valueFormat);
  };

  const axisTick = { fill: "#94a3b8", fontSize: 12 };

  return (
    <Card className="h-full">
      <CardHeader title={config.title} subtitle={config.subtitle} />
      <div className={chartHeight}>
        <ResponsiveContainer width="100%" height="100%">
          {config.type === "pie" ? (
            <PieChart>
              <Pie
                data={config.data}
                cx="50%"
                cy="45%"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={2}
                dataKey={dataKey}
                nameKey="name"
              >
                {config.data.map((entry, i) => (
                  <Cell key={entry.name} fill={entry.color ?? config.colors?.[i] ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [formatTooltip(Number(value)), config.title]}
                contentStyle={tooltipStyle}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
            </PieChart>
          ) : config.type === "stacked-bar" && config.stackedSeries ? (
            <BarChart
              data={config.data}
              layout={isHorizontal ? "vertical" : "horizontal"}
              margin={{ top: 5, right: 10, left: isHorizontal ? 4 : -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={!isHorizontal} vertical={isHorizontal} />
              {isHorizontal ? (
                <>
                  <XAxis type="number" axisLine={false} tickLine={false} tick={axisTick} tickFormatter={(v) => formatChartValue(v, config.valueFormat)} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={axisTick} width={72} />
                </>
              ) : (
                <>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} />
                  <YAxis axisLine={false} tickLine={false} tick={axisTick} tickFormatter={(v) => formatChartValue(v, config.valueFormat)} />
                </>
              )}
              <Tooltip
                formatter={(value, name) => [formatTooltip(Number(value)), String(name)]}
                contentStyle={tooltipStyle}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
              {config.stackedSeries.map((series) => (
                <Bar
                  key={series.key}
                  dataKey={series.key}
                  name={series.label}
                  stackId="stack"
                  fill={series.color}
                  radius={isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          ) : config.type === "area" ? (
            <AreaChart data={config.data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id={`area-${config.title.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#15803d" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#15803d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={axisTick}
                tickFormatter={(v) => (config.valueFormat === "percent" ? `${v}%` : String(v))}
              />
              <Tooltip formatter={(value) => [formatTooltip(Number(value)), config.title]} contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke="#15803d"
                strokeWidth={2}
                fill={`url(#area-${config.title.replace(/\s/g, "")})`}
              />
            </AreaChart>
          ) : config.type === "line" ? (
            <LineChart data={config.data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} />
              <YAxis axisLine={false} tickLine={false} tick={axisTick} tickFormatter={(v) => formatChartValue(v, config.valueFormat)} />
              <Tooltip formatter={(value) => [formatTooltip(Number(value)), config.title]} contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey={dataKey} stroke="#15803d" strokeWidth={2} dot={{ fill: "#15803d", r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          ) : (
            <BarChart
              data={config.data}
              layout={isHorizontal ? "vertical" : "horizontal"}
              margin={{ top: 5, right: 10, left: isHorizontal ? 4 : -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={!isHorizontal} vertical={isHorizontal} />
              {isHorizontal ? (
                <>
                  <XAxis type="number" axisLine={false} tickLine={false} tick={axisTick} tickFormatter={(v) => formatChartValue(v, config.valueFormat)} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={axisTick} width={88} />
                </>
              ) : (
                <>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisTick} />
                  <YAxis axisLine={false} tickLine={false} tick={axisTick} tickFormatter={(v) => formatChartValue(v, config.valueFormat)} />
                </>
              )}
              <Tooltip formatter={(value) => [formatTooltip(Number(value)), config.title]} contentStyle={tooltipStyle} />
              <Bar dataKey={dataKey} radius={isHorizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]} maxBarSize={48}>
                {config.data.map((entry, i) => (
                  <Cell key={entry.name} fill={entry.color ?? config.colors?.[i] ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function ReportCharts({ charts }: { charts: ReportChartConfig[] }) {
  if (!charts.length) return null;

  return (
    <div
      className={cn(
        "grid gap-4",
        charts.length === 1 ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2",
      )}
    >
      {charts.map((chart) => (
        <ReportChartCard key={chart.title} config={chart} />
      ))}
    </div>
  );
}
