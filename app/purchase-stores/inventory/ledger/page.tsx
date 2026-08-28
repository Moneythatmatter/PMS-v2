"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Layers,
  Minus,
  Package,
  Plus,
  RotateCcw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  AlertBanner,
  FOPageHeader,
  StatMiniCard,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";
import {
  enrichLedgerRows,
  LEDGER_TYPE_FILTERS,
  matchesLedgerFilter,
  type LedgerMovementType,
  type LedgerTypeFilter,
} from "@/app/data/stockLedgerData";
import { usePsList } from "@/hooks/usePsResource";
import {
  psProductService,
  psStockLedgerService,
  psWarehouseService,
} from "@/services/purchase-stores/index";

function movementBadge(type: LedgerMovementType) {
  const styles: Record<LedgerMovementType, string> = {
    GRN: "bg-emerald-50 text-emerald-700",
    Issue: "bg-sky-50 text-sky-700",
    "Transfer In": "bg-teal-50 text-teal-700",
    "Transfer Out": "bg-amber-50 text-amber-800",
    Adjustment: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={cn("inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", styles[type])}>
      {type}
    </span>
  );
}

function splitDateTime(raw: string) {
  const parts = raw.split(" ");
  if (parts.length >= 3) {
    return { date: parts[0], time: `${parts[1]} ${parts[2]}` };
  }
  return { date: raw, time: "" };
}

function parseRecordDate(raw: string): number {
  const { date, time } = splitDateTime(raw);
  const parsed = Date.parse(`${date} ${time}`);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function StockLedgerPage() {
  const { data: products, loading: productsLoading } = usePsList(() => psProductService.list());
  const { data: warehouses, loading: warehousesLoading } = usePsList(() => psWarehouseService.list());
  const { data: ledgerRecords, loading: ledgerLoading } = usePsList(() => psStockLedgerService.list());

  const loading = productsLoading || warehousesLoading || ledgerLoading;

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<LedgerTypeFilter>("all");
  const [toastMessage, setToastMessage] = useState<{ text: string; variant: "success" | "info" | "error" } | null>(null);

  const showToast = (text: string, variant: "success" | "info" | "error" = "success") => {
    setToastMessage({ text, variant });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const enrichedRecords = useMemo(() => {
    return enrichLedgerRows(ledgerRecords, products, warehouses)
      .map((rec) => ({
        ...rec,
        unit: rec.materialUnit,
        ...splitDateTime(rec.transactionDate),
      }))
      .sort((a, b) => parseRecordDate(b.transactionDate) - parseRecordDate(a.transactionDate));
  }, [ledgerRecords, products, warehouses]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedRecords.filter((rec) => {
      const matchSearch =
        !q ||
        rec.transactionNo.toLowerCase().includes(q) ||
        rec.materialId.toLowerCase().includes(q) ||
        rec.materialCode.toLowerCase().includes(q) ||
        rec.materialName.toLowerCase().includes(q) ||
        rec.warehouseName.toLowerCase().includes(q) ||
        rec.movementType.toLowerCase().includes(q);
      return matchSearch && matchesLedgerFilter(rec, typeFilter);
    });
  }, [enrichedRecords, searchQuery, typeFilter]);

  const stats = useMemo(() => {
    const movements = filteredRecords.length;
    const stockIn = filteredRecords.reduce((sum, r) => sum + r.quantityIn, 0);
    const stockOut = filteredRecords.reduce((sum, r) => sum + r.quantityOut, 0);
    return { movements, stockIn, stockOut };
  }, [filteredRecords]);

  const hasActiveFilters = Boolean(searchQuery) || typeFilter !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
  };

  const handleExportCSV = () => {
    const headers = ["Date", "Time", "Transaction", "Type", "Material ID", "Material", "Warehouse", "In / Out", "Balance"];
    const rows = filteredRecords.map((r) => {
      const change =
        r.quantityIn > 0 ? `+${r.quantityIn} ${r.unit}` : r.quantityOut > 0 ? `-${r.quantityOut} ${r.unit}` : "—";
      return [
        `"${r.date}"`,
        `"${r.time}"`,
        `"${r.transactionNo}"`,
        `"${r.movementType}"`,
        `"${r.materialId}"`,
        `"${r.materialName}"`,
        `"${r.warehouseName}"`,
        `"${change}"`,
        `${r.balanceQty} ${r.unit}`,
      ];
    });
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Movement_History_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filteredRecords.length} movement records.`, "info");
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 text-sm text-slate-600">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/50 p-4 sm:p-6 md:p-8">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-md animate-in fade-in slide-in-from-top-3">
          <AlertBanner variant={toastMessage.variant} message={toastMessage.text} onDismiss={() => setToastMessage(null)} />
        </div>
      )}

      <FOPageHeader
        eyebrow="Purchase & Stores · Inventory"
        title="Movement History"
        description="What happened to your stock — receipts, issues, transfers, and adjustments."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/purchase-stores/inventory/stock">
              <Button type="button" variant="outline" size="sm" className="gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100">
                <Package className="h-4 w-4" /> Current Stock
              </Button>
            </Link>
            <Button type="button" variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatMiniCard label="Movements" value={stats.movements} sublabel="In view" accent="#0f766e" icon={Layers} />
        <StatMiniCard label="Stock In" value={stats.stockIn.toLocaleString("en-IN")} sublabel="Units received" accent="#16a34a" icon={ArrowDownRight} />
        <StatMiniCard label="Stock Out" value={stats.stockOut.toLocaleString("en-IN")} sublabel="Units issued" accent="#dc2626" icon={ArrowUpRight} />
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transaction, material, warehouse..."
              className="h-9.5 w-full rounded-xl border border-slate-200 bg-white pl-9.5 pr-3 text-xs sm:text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {LEDGER_TYPE_FILTERS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTypeFilter(opt.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  typeFilter === opt.id
                    ? "bg-emerald-700 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
              >
                {opt.label}
              </button>
            ))}
            {hasActiveFilters && (
              <Button type="button" variant="outline" size="sm" onClick={handleResetFilters} className="h-8 px-2.5 text-xs">
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
          <p className="text-xs font-medium text-slate-500">
            {filteredRecords.length} movement{filteredRecords.length !== 1 ? "s" : ""}
            {hasActiveFilters ? " matching filters" : ""}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4 w-[110px]">Date</th>
                <th className="py-3 px-4">Transaction</th>
                <th className="py-3 px-4">Material</th>
                <th className="py-3 px-4">Warehouse</th>
                <th className="py-3 px-4 text-right">Change</th>
                <th className="py-3 px-4 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <p className="text-sm font-medium text-slate-500">No movements found</p>
                    <p className="mt-1 text-xs text-slate-400">Try a different search or filter</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((row) => {
                  const isIn = row.quantityIn > 0;
                  const isOut = row.quantityOut > 0;
                  const changeQty = isIn ? row.quantityIn : row.quantityOut;

                  return (
                    <tr key={row.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="py-3 px-4 align-top">
                        <p className="font-medium text-slate-800">{row.date}</p>
                        {row.time && <p className="text-[10px] text-slate-400">{row.time}</p>}
                      </td>

                      <td className="py-3 px-4 align-top">
                        <p className="font-mono text-xs font-semibold text-slate-900">{row.transactionNo}</p>
                        <div className="mt-1">{movementBadge(row.movementType)}</div>
                      </td>

                      <td className="py-3 px-4 align-top">
                        <p className="font-semibold text-slate-900 leading-snug">{row.materialName}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-slate-400">{row.materialId}</p>
                      </td>

                      <td className="py-3 px-4 align-top">
                        <p className="text-slate-700 leading-snug">{row.warehouseName}</p>
                      </td>

                      <td className="py-3 px-4 align-top text-right">
                        {isIn || isOut ? (
                          <div className="inline-flex items-center gap-1">
                            {isIn ? (
                              <Plus className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Minus className="h-3 w-3 text-red-500" />
                            )}
                            <span className={cn("font-bold tabular-nums", isIn ? "text-emerald-700" : "text-red-600")}>
                              {isIn ? "+" : "−"}{changeQty}
                            </span>
                            <span className="text-slate-400">{row.unit}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 align-top text-right">
                        <span className="font-bold tabular-nums text-slate-900">{row.balanceQty}</span>
                        <span className="ml-1 text-slate-400">{row.unit}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
