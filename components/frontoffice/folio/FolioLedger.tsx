"use client";

import type { FolioCharge, FolioListItem, LedgerTransaction } from "@/app/data/types/billing";
import type { FolioChargeCategory } from "@/services/billing";
import { formatINR } from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";

export const CHARGE_CATEGORY_LABELS: Record<FolioChargeCategory, string> = {
  FOOD_BEVERAGE: "Food & Beverage",
  MINIBAR: "Mini Bar",
  LAUNDRY: "Laundry",
  OTHER: "Other / Miscellaneous",
};

export type FolioLedgerLine = {
  id: string;
  label: string;
  detail: string;
  ref?: string;
  debit: number;
  credit: number;
  date: string;
  balance: number;
};

export type FolioLedgerStay = {
  nights?: number;
  roomNo?: string | null;
  tariffPlan?: string | null;
};

const SOURCE_LABELS: Record<string, string> = {
  FNB: "Food & Beverage",
  HOUSEKEEPING: "Housekeeping",
  FRONT_OFFICE: "Front Office",
  RESERVATION: "Reservation",
};

const round2 = (n: number) => Math.round(n * 100) / 100;

function isReversal(t: LedgerTransaction): boolean {
  return /REVERSAL/i.test(t.sourceType ?? "") || /reversal/i.test(t.notes ?? "");
}

function describeAdjustment(t: LedgerTransaction): string {
  const source = String(t.sourceType ?? "").toUpperCase();
  if (source.startsWith("ROOM_SERVICE")) return isReversal(t) ? "Room service reversal" : "Food & Beverage (Room service)";
  if (source.includes("LAUNDRY") || /\[LAUNDRY\]/.test(t.notes ?? "")) return isReversal(t) ? "Laundry reversal" : "Laundry";
  if (isReversal(t)) return "Charge reversal";
  return SOURCE_LABELS[String(t.sourceModule ?? "")] ?? "Folio charge";
}

function chargeLabel(c: FolioCharge): string {
  const category = CHARGE_CATEGORY_LABELS[c.chargeCategory as FolioChargeCategory] ?? c.chargeCategory;
  return c.description?.trim() || category || "Charge";
}

/**
 * Chronological folio ledger. Room revenue on individual folios lives only in
 * the seeded subtotal, so whatever the posted lines don't explain is shown as
 * the room-charges line.
 */
export function buildFolioLedger(
  folio: FolioListItem,
  stay: FolioLedgerStay,
  charges: FolioCharge[],
  transactions: LedgerTransaction[],
): FolioLedgerLine[] {
  const lines: Omit<FolioLedgerLine, "balance">[] = [];

  for (const c of charges) {
    if (c.folioId !== folio.id) continue;
    const category = CHARGE_CATEGORY_LABELS[c.chargeCategory as FolioChargeCategory] ?? c.chargeCategory;
    lines.push({
      id: `c-${c.id}`,
      label: chargeLabel(c),
      detail: [
        c.description?.trim() ? category : "",
        Number(c.quantity ?? 1) > 1 ? `${c.quantity} × ${formatINR(Number(c.unitPrice ?? 0))}` : "",
      ]
        .filter(Boolean)
        .join(" · "),
      debit: Number(c.amount ?? 0),
      credit: 0,
      date: c.createdAt ?? "",
    });
  }

  for (const t of transactions) {
    if (t.folioId !== folio.id || t.status !== "COMPLETED") continue;
    const amount = Number(t.amount ?? 0);
    const method = t.paymentMethod?.replace(/_/g, " ");
    if (t.transactionType === "PAYMENT") {
      lines.push({
        id: `t-${t.id}`,
        label: "Payment received",
        detail: [method, t.externalReference].filter(Boolean).join(" · "),
        ref: t.transactionNumber,
        debit: 0,
        credit: amount,
        date: t.transactionDate,
      });
    } else if (t.transactionType === "REFUND") {
      lines.push({
        id: `t-${t.id}`,
        label: "Refund",
        detail: method ?? "",
        ref: t.transactionNumber,
        debit: amount,
        credit: 0,
        date: t.transactionDate,
      });
    } else {
      const reversal = isReversal(t);
      lines.push({
        id: `t-${t.id}`,
        label: describeAdjustment(t),
        detail: (t.notes ?? "").replace(/^\[[A-Z_]+\]\s*/, ""),
        ref: t.transactionNumber,
        debit: reversal ? 0 : amount,
        credit: reversal ? amount : 0,
        date: t.transactionDate,
      });
    }
  }

  const postedCharges = lines
    .filter((l) => l.label !== "Payment received" && l.label !== "Refund")
    .reduce((sum, l) => sum + l.debit - l.credit, 0);
  const roomCharges = round2(Number(folio.subtotal ?? 0) - postedCharges);
  if (roomCharges > 0.009) {
    const nights = stay.nights || 1;
    lines.push({
      id: "room",
      label: "Room charges",
      detail: [
        `${nights} night${nights !== 1 ? "s" : ""}`,
        stay.roomNo ? `Room ${stay.roomNo}` : "",
        stay.tariffPlan ?? "",
      ]
        .filter(Boolean)
        .join(" · "),
      debit: roomCharges,
      credit: 0,
      date: folio.openedAt ?? "",
    });
  }
  if (Number(folio.taxTotal ?? 0) > 0) {
    lines.push({ id: "tax", label: "Tax", detail: "", debit: Number(folio.taxTotal), credit: 0, date: "~" });
  }
  if (Number(folio.discountTotal ?? 0) > 0) {
    lines.push({ id: "discount", label: "Discount", detail: "", debit: 0, credit: Number(folio.discountTotal), date: "~" });
  }

  lines.sort((a, b) => {
    if (a.id === "room") return -1;
    if (b.id === "room") return 1;
    return a.date.localeCompare(b.date);
  });

  let running = 0;
  return lines.map((l) => {
    running = round2(running + l.debit - l.credit);
    return { ...l, balance: running };
  });
}

function formatLedgerDate(value?: string): string {
  if (!value || value === "~") return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function FolioLedgerTable({
  lines,
  balanceDue,
  emptyText = "Nothing posted to this folio yet.",
  onRowClick,
}: {
  lines: FolioLedgerLine[];
  balanceDue: number;
  emptyText?: string;
  onRowClick?: (line: FolioLedgerLine) => void;
}) {
  if (lines.length === 0) return <p className="text-sm text-slate-500">{emptyText}</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Date</th>
            <th className="px-3 py-2 text-left font-medium">Description</th>
            <th className="px-3 py-2 text-right font-medium">Debit</th>
            <th className="px-3 py-2 text-right font-medium">Credit</th>
            <th className="px-3 py-2 text-right font-medium">Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lines.map((row) => (
            <tr
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? "cursor-pointer hover:bg-emerald-50/40" : undefined}
            >
              <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">{formatLedgerDate(row.date)}</td>
              <td className="px-3 py-2">
                <p className="font-medium text-slate-900">{row.label}</p>
                {(row.detail || row.ref) && (
                  <p className="text-xs text-slate-500">{[row.detail, row.ref].filter(Boolean).join(" · ")}</p>
                )}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right text-slate-900">
                {row.debit ? formatINR(row.debit) : ""}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right text-emerald-600">
                {row.credit ? formatINR(row.credit) : ""}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right font-semibold text-slate-900">
                {formatINR(row.balance)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-slate-50 text-sm font-semibold">
          <tr>
            <td className="px-3 py-2" colSpan={2}>Balance due</td>
            <td className="px-3 py-2 text-right">{formatINR(lines.reduce((s, l) => s + l.debit, 0))}</td>
            <td className="px-3 py-2 text-right text-emerald-600">
              {formatINR(lines.reduce((s, l) => s + l.credit, 0))}
            </td>
            <td className={cn("px-3 py-2 text-right", balanceDue > 0 ? "text-amber-600" : "text-emerald-700")}>
              {formatINR(balanceDue)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
