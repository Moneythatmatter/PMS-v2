"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardHeader } from "@/components/ui/Card";

export interface BookingPlatformRevenuePoint {
  platform: string;
  revenue: number;
  percentage: number;
  color: string;
}

const defaultPlatformData: BookingPlatformRevenuePoint[] = [
  { platform: "Direct & Walk-in", revenue: 54800, percentage: 37, color: "#15803d" }, // Emerald
  { platform: "Booking.com", revenue: 41500, percentage: 28, color: "#0284c7" },      // Sky Blue
  { platform: "MakeMyTrip / Goibibo", revenue: 23700, percentage: 16, color: "#d97706" }, // Amber
  { platform: "Agoda", revenue: 16300, percentage: 11, color: "#8b5cf6" },             // Violet
  { platform: "Expedia & Corporate", revenue: 11950, percentage: 8, color: "#ec4899" }, // Pink
];

interface BookingPlatformRevenueChartProps {
  data?: BookingPlatformRevenuePoint[];
  title?: string;
  subtitle?: string;
}

export function BookingPlatformRevenueChart({
  data = defaultPlatformData,
  title = "Booking Platform Revenue",
  subtitle = "Revenue contribution by reservation channel",
}: BookingPlatformRevenueChartProps) {
  const formatCurrency = (val: number) =>
    `₹${val.toLocaleString("en-IN")}`;

  return (
    <Card className="h-full">
      <CardHeader title={title} subtitle={subtitle} />
      <div className="h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={55}
              outerRadius={82}
              paddingAngle={3}
              dataKey="revenue"
              nameKey="platform"
            >
              {data.map((entry) => (
                <Cell key={entry.platform} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any, _name: any, item: any) => [
                `${formatCurrency(Number(value || 0))} (${item?.payload?.percentage ?? 0}%)`,
                "Revenue",
              ]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
