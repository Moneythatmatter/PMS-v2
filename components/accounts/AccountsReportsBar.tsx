"use client";

import { useRouter } from "next/navigation";
import { BookOpen, CalendarClock, FileText, Scale, TrendingUp, type LucideIcon } from "lucide-react";
import { SelectInput } from "@/components/frontoffice/ui";
import {
  ACCOUNTS_REPORT_IDS,
  ACCOUNTS_REPORT_LABELS,
  type AccountsReportId,
} from "@/lib/accounts/reports";

const REPORT_ICONS: Record<AccountsReportId, LucideIcon> = {
  "trial-balance": Scale,
  "profit-and-loss": TrendingUp,
  "balance-sheet": FileText,
  "general-ledger": BookOpen,
  "day-book": CalendarClock,
};

const ACCOUNTS_REPORTS = ACCOUNTS_REPORT_IDS.map((id) => ({
  id,
  label: ACCOUNTS_REPORT_LABELS[id],
  icon: REPORT_ICONS[id],
}));

/** Report switcher shown above the selected Accounts report. */
export function AccountsReportsBar({ type }: { type: string }) {
  const router = useRouter();
  const active = ACCOUNTS_REPORTS.find((r) => r.id === type) ?? ACCOUNTS_REPORTS[0];
  const Icon = active.icon;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Accounts · Reports</p>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-emerald-600" />
        <SelectInput
          value={active.id}
          onChange={(e) => router.replace(`/accounts/reports?type=${e.target.value}`, { scroll: false })}
          className="!h-8 !w-auto min-w-[11.5rem] !pl-8 text-sm font-semibold text-slate-800"
          aria-label="Report type"
        >
          {ACCOUNTS_REPORTS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </SelectInput>
      </div>
    </div>
  );
}
