import type { OccupancyData } from "@/app/data/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface RoomOccupancyProps {
  data: OccupancyData;
}

export function RoomOccupancy({ data }: RoomOccupancyProps) {
  return (
    <Card>
      <CardHeader title="Room Occupancy" />
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-900">
            {data.percentage}%
          </span>
          <span className="text-sm text-slate-500">
            {data.occupied} of {data.total} rooms
          </span>
        </div>
        <ProgressBar
          value={data.percentage}
          max={100}
          color="#16a34a"
          className="mt-3"
        />
      </div>
      <div className="space-y-2">
        {data.statuses.map((status) => (
          <div key={status.label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: status.color }}
              />
              <span className="text-slate-600">{status.label}</span>
            </div>
            <span className="font-medium text-slate-900">{status.count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
