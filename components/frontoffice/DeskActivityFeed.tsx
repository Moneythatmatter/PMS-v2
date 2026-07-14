import type { DeskActivity } from "@/app/data/types";

interface DeskActivityFeedProps {
  activities: DeskActivity[];
}

export function DeskActivityFeed({ activities }: DeskActivityFeedProps) {
  return (
    <section className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2">
        <h2 className="text-sm font-semibold text-slate-900">Desk activity</h2>
        <p className="text-[11px] text-slate-500">Live front desk log</p>
      </div>
      <ul className="flex flex-1 flex-col space-y-2">
        {activities.map((activity) => (
          <li key={activity.id} className="flex gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
            <div className="min-w-0 flex-1">
              <p className="text-xs leading-snug text-slate-700">{activity.message}</p>
              <p className="mt-0.5 text-[10px] text-slate-400">{activity.timestamp}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
