import type { DeskActivity } from "@/app/data/types";
import { Card, CardHeader } from "@/components/ui/Card";

interface DeskActivityFeedProps {
  activities: DeskActivity[];
}

export function DeskActivityFeed({ activities }: DeskActivityFeedProps) {
  return (
    <Card className="flex h-full min-w-0 flex-col">
      <CardHeader title="Desk activity" subtitle="Live front desk log" />
      <ul className="flex flex-1 flex-col space-y-4">
        {activities.map((activity) => (
          <li key={activity.id} className="flex gap-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-700">{activity.message}</p>
              <p className="mt-0.5 text-xs text-slate-400">{activity.timestamp}</p>
            </div>
          </li>
        ))}
        {activities.length === 0 && (
          <li className="py-6 text-center text-sm text-slate-500">No activity yet</li>
        )}
      </ul>
    </Card>
  );
}
