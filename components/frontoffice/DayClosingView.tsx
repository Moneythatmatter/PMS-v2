"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Circle,
  IndianRupee,
  Users,
} from "lucide-react";
import {
  dayClosingChecklist as initialChecklist,
  dayClosingSummary,
} from "@/app/data/frontoffice/closing";
import { Button } from "@/components/ui/Button";
import {
  AlertBanner,
  ConfirmModal,
  FOPageHeader,
  StatMiniCard,
  SummaryRow,
  formatINR,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";

const statusIcon = {
  done: CheckCircle2,
  pending: Circle,
  warning: AlertTriangle,
};

const statusStyle = {
  done: "text-emerald-600",
  pending: "text-slate-400",
  warning: "text-amber-500",
};

export function DayClosingView() {
  const [checklist, setChecklist] = useState(initialChecklist);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const summary = dayClosingSummary;

  const pendingItems = useMemo(
    () => checklist.filter((c) => c.status !== "done").length,
    [checklist],
  );

  const canClose = pendingItems <= 2;

  const handleRunClosing = () => {
    setCompleted(true);
    setConfirmOpen(false);
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === "5" ? { ...item, status: "done", detail: "Completed" } : item,
      ),
    );
    setToast(
      `Day closing completed for ${new Date(summary.businessDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.`,
    );
  };

  return (
    <div className="space-y-5">
      {toast && (
        <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />
      )}

      <FOPageHeader
        eyebrow="Front Office"
        title="Day Closing"
        description="Run daily front office closing procedures and roll the business date."
        badge={
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            <CalendarClock className="h-3.5 w-3.5 text-blue-500" />
            Business Date:{" "}
            {new Date(summary.businessDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>
        }
        action={
          !completed && (
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setConfirmOpen(true)}
              disabled={!canClose}
            >
              Run Day Closing
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatMiniCard label="Total Revenue" value={formatINR(summary.totalRevenue)} accent="#2563eb" icon={IndianRupee} />
        <StatMiniCard label="Occupancy" value={`${summary.occupancy}%`} icon={Users} />
        <StatMiniCard label="Arrivals / Departures" value={`${summary.arrivals} / ${summary.departures}`} icon={Calendar} />
        <StatMiniCard label="In-House Guests" value={summary.inHouse} accent="#10b981" icon={Users} />
      </div>

      {completed ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
          <p className="mt-4 text-lg font-bold text-emerald-900">Day Closing Complete</p>
          <p className="mt-1 text-sm text-emerald-700">
            Business date rolled forward. Night audit can now be run.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Pre-Closing Checklist</h2>
            <ul className="space-y-3">
              {checklist.map((item) => {
                const Icon = statusIcon[item.status];
                return (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg border border-slate-100 p-3"
                  >
                    <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", statusStyle[item.status])} />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
            {pendingItems > 0 && (
              <p className="mt-4 text-xs text-amber-600">
                {pendingItems} item(s) need attention before closing
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Day End Summary</h2>
            <div className="divide-y divide-slate-100">
              <SummaryRow label="Room Revenue" value={formatINR(summary.roomRevenue)} />
              <SummaryRow label="F&B Revenue" value={formatINR(summary.fbRevenue)} />
              <SummaryRow label="Total Revenue" value={formatINR(summary.totalRevenue)} highlight />
              <SummaryRow label="Occupancy" value={`${summary.occupancy}%`} />
              <SummaryRow label="Arrivals Today" value={String(summary.arrivals)} />
              <SummaryRow label="Departures Today" value={String(summary.departures)} />
              <SummaryRow label="Pending Check-outs" value={String(summary.pendingCheckouts)} />
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleRunClosing}
        title="Run Day Closing?"
        message="This will close the business day, roll the date forward, and lock today's transactions. This action cannot be undone."
        confirmLabel="Run Day Closing"
      />
    </div>
  );
}
