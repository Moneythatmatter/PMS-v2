import Link from "next/link";
import { ArrowRight, Bell, Clock } from "lucide-react";
import type { WakeUpCall } from "@/app/data/frontoffice/modules";
import { Card, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** YYYY-MM-DD for "27 Sept 2026" or "2026-09-27" style call dates. */
function callDay(call: WakeUpCall) {
  const raw = String(call.date ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const m = raw.match(/^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})/);
  if (!m) return "";
  const month = MONTHS.indexOf(m[2].toLowerCase());
  return month < 0 ? "" : `${m[3]}-${pad(month + 1)}-${pad(Number(m[1]))}`;
}

function todayDay() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function sortKey(call: WakeUpCall) {
  return `${callDay(call)} ${call.time}`;
}

function isToday(call: WakeUpCall) {
  return callDay(call) === todayDay();
}

/** Calls not yet completed, today or later, soonest first. */
export function getPendingWakeUpCalls(calls: WakeUpCall[]) {
  const today = todayDay();
  return [...calls]
    .filter((call) => !call.completed)
    .filter((call) => {
      const day = callDay(call);
      return !day || day >= today;
    })
    .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
}

interface WakeUpCallsAlertProps {
  calls: WakeUpCall[];
  manageHref?: string;
  className?: string;
}

export function WakeUpCallsAlert({
  calls,
  manageHref = "/frontoffice/wake-up-calls",
  className,
}: WakeUpCallsAlertProps) {
  const pending = getPendingWakeUpCalls(calls);
  const todayPending = pending.filter(isToday);
  const displayCalls = todayPending.length > 0 ? todayPending : pending;
  const visibleCalls = displayCalls.slice(0, 3);
  const hiddenCount = pending.length - visibleCalls.length;

  const subtitle =
    todayPending.length > 0
      ? `${todayPending.length} due today`
      : pending.length > 0
        ? `${pending.length} upcoming`
        : "All clear";

  return (
    <Card className={cn("h-full border-amber-200/80 bg-amber-50/30", className)}>
      <CardHeader
        title="Wake-up Calls"
        subtitle={subtitle}
        action={
          <Link
            href={manageHref}
            className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 hover:text-amber-950"
          >
            Manage
            <ArrowRight className="h-3 w-3" />
          </Link>
        }
      />

      {visibleCalls.length > 0 ? (
        <ul className="space-y-2.5">
          {visibleCalls.map((call) => (
            <li
              key={call.id}
              className="rounded-lg border border-amber-100 bg-white px-3 py-2.5"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                <Clock className="h-3 w-3 shrink-0" />
                <span>{call.time}</span>
                {!isToday(call) && (
                  <span className="font-normal text-slate-400">· {call.date}</span>
                )}
              </div>
              <p className="mt-1 text-sm font-medium text-slate-900">{call.guest}</p>
              <p className="text-xs text-slate-500">Room {call.room}</p>
              {call.notes && (
                <p className="mt-1 line-clamp-2 text-xs text-slate-400">{call.notes}</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Bell className="h-4 w-4" />
          </div>
          <p className="text-sm text-slate-600">No pending wake-up calls</p>
        </div>
      )}

      {hiddenCount > 0 && (
        <p className="mt-3 border-t border-amber-100 pt-3 text-center text-xs text-amber-800/80">
          +{hiddenCount} more —{" "}
          <Link href={manageHref} className="font-medium hover:underline">
            view all
          </Link>
        </p>
      )}
    </Card>
  );
}
