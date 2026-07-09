import type { ActivityItem } from "@/app/data/types";
import { Card, CardHeader } from "@/components/ui/Card";

const dotColors: Record<ActivityItem["type"], string> = {
  booking: "bg-sky-500",
  checkin: "bg-emerald-500",
  checkout: "bg-amber-500",
  payment: "bg-violet-500",
  maintenance: "bg-orange-500",
};

interface RecentActivityProps {
  activities: ActivityItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader title="Recent Activity" />
      <ul className="space-y-4">
        {activities.map((activity) => (
          <li key={activity.id} className="flex gap-3">
            <span
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColors[activity.type]}`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-700">{activity.message}</p>
              <p className="mt-0.5 text-xs text-slate-400">{activity.timestamp}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
