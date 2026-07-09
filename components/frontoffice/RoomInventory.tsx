import type { RoomInventoryData } from "@/app/data/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface RoomInventoryProps {
  data: RoomInventoryData;
}

export function RoomInventory({ data }: RoomInventoryProps) {
  return (
    <Card className="h-full">
      <CardHeader title="Room Inventory" />
      <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeDasharray={`${data.percentage} ${100 - data.percentage}`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-sm font-bold text-slate-900">
            {data.percentage}%
          </span>
        </div>
        <div>
          <p className="text-lg font-bold text-slate-900">
            {data.occupied} / {data.total}
          </p>
          <p className="text-xs text-slate-500">rooms in use</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {data.statuses.map((status) => (
          <div key={status.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-slate-600">{status.label}</span>
              <span className="font-medium text-slate-900">{status.count}</span>
            </div>
            <ProgressBar
              value={status.count}
              max={data.total}
              color={status.color}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
