import type { DeskActivity } from "@/app/data/types";
import { Card, CardHeader } from "@/components/ui/Card";

interface DeskActivityFeedProps {
  activities: DeskActivity[];
}

export function DeskActivityFeed({ activities }: DeskActivityFeedProps) {
  return (
    <Card className="h-full">
      <CardHeader title="Desk Activity" subtitle="Live front desk log" />
      <ul className="space-y-3">
        {activities.map((activity) => (
          <li key={activity.id} className="flex gap-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
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
