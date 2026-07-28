"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardHeader } from "@/components/ui/Card";

export interface DepartmentRevenueDataPoint {
  module: string;
  revenue: number;
  share: number;
  color?: string;
}

const DEFAULT_MODULE_COLORS: Record<string, string> = {
  "Front Office (Rooms)": "#15803d", // Emerald
  "Food & Beverage": "#0284c7",     // Sky blue
  "Banquets & Events": "#8b5cf6",    // Purple
  "Laundry & Housekeeping": "#d97706", // Amber
  "Spa & Wellness": "#06b6d4",       // Cyan
  "Other / Misc": "#64748b",         // Slate
};

const defaultData: DepartmentRevenueDataPoint[] = [
  { module: "Front Office (Rooms)", revenue: 84500, share: 57.0, color: "#15803d" },
  { module: "Food & Beverage", revenue: 38200, share: 25.8, color: "#0284c7" },
  { module: "Banquets & Events", revenue: 15400, share: 10.4, color: "#8b5cf6" },
  { module: "Laundry & Housekeeping", revenue: 6150, share: 4.1, color: "#d97706" },
  { module: "Spa & Wellness", revenue: 4000, share: 2.7, color: "#06b6d4" },
];

interface DepartmentRevenueChartProps {
  data?: DepartmentRevenueDataPoint[];
  title?: string;
  subtitle?: string;
}

export function DepartmentRevenueChart({
  data = defaultData,
  title = "Departmental Revenue Distribution",
  subtitle = "Revenue contributed by operational module",
}: DepartmentRevenueChartProps) {
  const formatCurrency = (val: number) =>
    `₹${val.toLocaleString("en-IN")}`;

  return (
    <Card className="h-full">
      <CardHeader title={title} subtitle={subtitle} />
      <div className="h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 15, left: -5, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="module"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              interval={0}
              angle={-15}
              textAnchor="end"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickFormatter={(v) => `₹${v / 1000}k`}
            />
            <Tooltip
              formatter={(value: any, _name: any, item: any) => [
                `${formatCurrency(Number(value || 0))} (${item?.payload?.share ?? 0}%)`,
                "Revenue",
              ]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            />
            <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={44}>
              {data.map((entry) => (
                <Cell
                  key={entry.module}
                  fill={entry.color || DEFAULT_MODULE_COLORS[entry.module] || "#15803d"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
