"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { WeeklyFlowPoint } from "@/app/data/types";
import { Card, CardHeader } from "@/components/ui/Card";

interface WeeklyFlowChartProps {
  data: WeeklyFlowPoint[];
}

export function WeeklyFlowChart({ data }: WeeklyFlowChartProps) {
  return (
    <Card className="h-full">
      <CardHeader title="Weekly Check-in / Check-out" subtitle="Daily guest flow" />
      <div className="h-44 sm:h-52 lg:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
            />
            <Bar dataKey="checkIn" name="Check-in" fill="#1e293b" radius={[3, 3, 0, 0]} />
            <Bar dataKey="checkOut" name="Check-out" fill="#94a3b8" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
