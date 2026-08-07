import type { DeskActivity } from "@/app/data/types";
import { Card, CardHeader } from "@/components/ui/Card";

interface DeskActivityFeedProps {
  activities: DeskActivity[];
  /** How many recent items to show. Default 8. */
  limit?: number;
}

export function DeskActivityFeed({
  activities,
  limit = 8,
}: DeskActivityFeedProps) {
  const visible = activities.slice(0, limit);

  return (
    <Card className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <CardHeader title="Desk activity" subtitle="Live front desk log" />
      <ul className="min-h-0 max-h-[16.5rem] flex-1 space-y-2.5 overflow-y-auto overscroll-contain pr-1">
        {visible.map((activity) => (
          <li key={activity.id} className="flex gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm leading-snug text-slate-700">
                {activity.message}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">{activity.timestamp}</p>
            </div>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="py-6 text-center text-sm text-slate-500">No activity yet</li>
        )}
      </ul>
    </Card>
  );
}
