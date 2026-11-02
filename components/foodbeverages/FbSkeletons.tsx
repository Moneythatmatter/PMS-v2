import { cn } from "@/lib/utils";

export function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-200/80", className)} />;
}

/** Orders page: filter bar + a section of table tiles. */
export function FbTablesSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 p-4" aria-busy="true" aria-label="Loading tables">
      <div className="flex flex-wrap items-center gap-3">
        <Bone className="h-10 w-32" />
        <Bone className="h-10 min-w-48 flex-1" />
        <Bone className="h-10 w-64" />
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Bone key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>
      {Array.from({ length: 2 }, (_, s) => (
        <div key={s} className="space-y-3">
          <Bone className="h-4 w-40" />
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: s === 0 ? 8 : 5 }, (_, i) => (
              <Bone key={i} className="h-[7.25rem] w-[6.25rem] rounded-sm" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Order panel: open-order banner and item rows. */
export function FbOrderLinesSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading order">
      <div className="space-y-1.5 border-b border-emerald-100 bg-emerald-50 px-3 py-2">
        <Bone className="h-2.5 w-16 bg-emerald-200/70" />
        <Bone className="h-4 w-24 bg-emerald-200/70" />
        <Bone className="h-3 w-36 bg-emerald-200/70" />
      </div>
      <Bone className="h-6 w-full rounded-none bg-slate-100" />
      <ul className="divide-y divide-slate-100">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 px-3.5 py-3.5">
            <Bone className={cn("h-4", i % 2 ? "w-28" : "w-40")} />
            <Bone className="h-4 w-6" />
            <Bone className="h-4 w-14" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Settle screen: bill items card + settle card. */
export function FbSettleSkeleton() {
  return (
    <div className="mx-auto w-full max-w-md space-y-4" aria-busy="true" aria-label="Loading bill">
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <Bone className="h-3 w-20" />
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="flex justify-between">
            <Bone className="h-4 w-32" />
            <Bone className="h-4 w-12" />
          </div>
        ))}
      </div>
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-2">
          <Bone className="h-5 w-36" />
          <Bone className="h-3.5 w-24" />
        </div>
        <div className="space-y-2.5 rounded-xl bg-slate-50 p-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex justify-between">
              <Bone className="h-3.5 w-24" />
              <Bone className="h-3.5 w-14" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Bone key={i} className="h-10 rounded-xl" />
          ))}
        </div>
        <Bone className="h-10 rounded-xl" />
        <Bone className="h-10 rounded-xl bg-emerald-200/70" />
      </div>
    </div>
  );
}
