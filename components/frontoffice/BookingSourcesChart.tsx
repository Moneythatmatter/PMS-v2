"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { BookingSource } from "@/app/data/types";
import { Card, CardHeader } from "@/components/ui/Card";

interface BookingSourcesChartProps {
  data: BookingSource[];
}

export function BookingSourcesChart({ data }: BookingSourcesChartProps) {
  return (
    <Card className="h-full">
      <CardHeader title="Booking Sources" subtitle="Reservation mix" />
      <div className="h-44 sm:h-52 lg:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`${value}%`, "Share"]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "11px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
