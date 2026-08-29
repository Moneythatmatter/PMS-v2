"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Eye, Receipt, Search } from "lucide-react";
import {
  formatTableAmount,
  formatTableDuration,
  tableStatusLegend,
  tableStatusStyles,
  type LiveTableStatus,
} from "@/app/data/foodbeverages/ops";
import type { FbOutlet, LiveTable } from "@/services/food-beverages";
import { Button } from "@/components/ui/Button";
import { FbOutletSelect } from "@/components/foodbeverages/FbOutletSelect";
import type { OrderTab } from "@/components/foodbeverages/FbOrderEntryPanel";
import { cn } from "@/lib/utils";

const ORDER_TABS: OrderTab[] = ["Dine In", "Takeaway", "Room Service"];

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "Available", label: "Blank" },
  { id: "Occupied", label: "Running KOT" },
  { id: "Reserved", label: "Running" },
  { id: "Billing", label: "Printed" },
] as const;

type Props = {
  outlets: FbOutlet[];
  outletId: string;
  onOutletChange: (id: string) => void;
  orderType: OrderTab;
  onOrderTypeChange: (type: OrderTab) => void;
  tables: LiveTable[];
  onSelectTable: (table: LiveTable) => void;
  onBillTable?: (table: LiveTable) => void;
  onCleanTable?: (table: LiveTable) => void;
  onContinue: () => void;
  className?: string;
};

export function FbTableSelectPanel({
  outlets,
  outletId,
  onOutletChange,
  orderType,
  onOrderTypeChange,
  tables,
  onSelectTable,
  onBillTable,
  onCleanTable,
  onContinue,
  className,
}: Props) {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const outletName = (id?: string) =>
    outlets.find((o) => o.id === id)?.name ?? "Outlet";

  const outletTables = useMemo(() => {
    if (!outletId) return tables;
    return tables.filter((t) => !t.outletId || t.outletId === outletId);
  }, [tables, outletId]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return outletTables.filter((t) => {
      if (filter !== "all" && t.status !== filter) return false;
      if (!q) return true;
      const outletLabel = outletName(t.outletId).toLowerCase();
      return (
        t.tableNo.toLowerCase().includes(q) ||
        t.guest.toLowerCase().includes(q) ||
        String(t.section ?? "").toLowerCase().includes(q) ||
        outletLabel.includes(q)
      );
    });
  }, [outletTables, filter, search, outlets]);

  const searchFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return outletTables;
    return outletTables.filter((t) => {
      const outletLabel = outletName(t.outletId).toLowerCase();
      return (
        t.tableNo.toLowerCase().includes(q) ||
        t.guest.toLowerCase().includes(q) ||
        String(t.section ?? "").toLowerCase().includes(q) ||
        outletLabel.includes(q)
      );
    });
  }, [outletTables, search, outlets]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: searchFiltered.length,
      Available: 0,
      Occupied: 0,
      Reserved: 0,
      Billing: 0,
    };
    for (const t of searchFiltered) {
      counts[t.status] = (counts[t.status] ?? 0) + 1;
    }
    return counts;
  }, [searchFiltered]);

  const outletGroups = useMemo(() => {
    const map = new Map<string, LiveTable[]>();
    for (const t of visible) {
      const oid = t.outletId || "unknown";
      const list = map.get(oid) ?? [];
      list.push(t);
      map.set(oid, list);
    }
    return [...map.entries()]
      .map(([oid, groupTables]) => ({
        outletId: oid,
        outletName: outletName(oid === "unknown" ? undefined : oid),
        tables: groupTables.sort((a, b) =>
          a.tableNo.localeCompare(b.tableNo, undefined, { numeric: true }),
        ),
      }))
      .sort((a, b) => a.outletName.localeCompare(b.outletName));
  }, [visible, outlets]);

  const isDineIn = orderType === "Dine In";
  const showOutletHeaders = !outletId || outletGroups.length > 1;

  return (
    <div className={cn("flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-slate-50/80", className)}>
      <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <FbOutletSelect
            outlets={outlets}
            value={outletId}
            onChange={onOutletChange}
            allowAll
          />
          {isDineIn ? (
            <div className="relative min-w-[12rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search table, outlet, or section…"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2"
              />
            </div>
          ) : (
            <div className="min-w-0 flex-1" aria-hidden />
          )}
          <div className="ml-auto flex shrink-0 items-center gap-3">
            <div
              className="flex min-w-[22rem] overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-0.5 sm:min-w-[26rem]"
              role="tablist"
              aria-label="Order type"
            >
              {ORDER_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={orderType === tab}
                  onClick={() => onOrderTypeChange(tab)}
                  className={cn(
                    "min-w-0 flex-1 whitespace-nowrap rounded-md px-4 py-2 text-xs font-semibold transition sm:px-5 sm:text-sm",
                    orderType === tab
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white hover:text-slate-900",
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            {!isDineIn && (
              <Button
                type="button"
                size="sm"
                className="gap-1.5 bg-emerald-700 hover:bg-emerald-800"
                onClick={onContinue}
              >
                Continue
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {isDineIn && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {STATUS_FILTERS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFilter(opt.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition",
                  filter === opt.id
                    ? "bg-emerald-700 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
              >
                {opt.label}
                <span
                  className={cn(
                    "tabular-nums",
                    filter === opt.id ? "text-white/85" : "text-slate-400",
                  )}
                >
                  {statusCounts[opt.id] ?? 0}
                </span>
              </button>
              ))}
            </div>
            <TableStatusLegend />
          </div>
        )}
      </div>

      {isDineIn ? (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto border-b border-slate-200 bg-white">
            {outletGroups.length === 0 ? (
              <div className="flex h-full min-h-[160px] items-center justify-center px-4 text-sm text-slate-500">
                No tables found{outletId ? " for this outlet" : ""}.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {outletGroups.map((group) => (
                  <section key={group.outletId} className="py-3">
                    {showOutletHeaders && (
                      <div className="mb-2 flex items-center gap-2 px-4">
                        <h2 className="text-sm font-semibold text-slate-900">
                          {group.outletName}
                        </h2>
                        <span className="text-[11px] text-slate-500">
                          {group.tables.length} table
                          {group.tables.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 px-4 pb-1">
                      {group.tables.map((table) => (
                        <TableTile
                          key={table.id || `${group.outletId}-${table.tableNo}`}
                          table={table}
                          outletLabel={
                            showOutletHeaders ? undefined : group.outletName
                          }
                          onSelect={() => onSelectTable(table)}
                          onBill={
                            onBillTable ? () => onBillTable(table) : undefined
                          }
                          onClean={
                            onCleanTable ? () => onCleanTable(table) : undefined
                          }
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-8">
          <div className="max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-900">{orderType} order</p>
            <p className="mt-2 text-sm text-slate-500">
              {orderType === "Takeaway"
                ? "Start a counter pickup order — no table needed."
                : "Start a room service order — enter room number on the next screen."}
            </p>
            <Button
              type="button"
              className="mt-6 gap-1.5 bg-emerald-700 hover:bg-emerald-800"
              onClick={onContinue}
            >
              Continue to menu
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function TableStatusLegend() {
  return (
    <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {tableStatusLegend.map((status) => {
        const style = tableStatusStyles[status];
        return (
          <div key={status} className="flex items-center gap-1.5 text-[11px] text-slate-600">
            <span
              className={cn("h-3.5 w-3.5 shrink-0 rounded-sm", style.legendSwatch)}
              aria-hidden
            />
            <span>{style.legendLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

function TableTile({
  table,
  onSelect,
  onBill,
  onClean,
}: {
  table: LiveTable;
  outletLabel?: string;
  onSelect: () => void;
  onBill?: () => void;
  onClean?: () => void;
}) {
  const status = (table.status as LiveTableStatus) ?? "Available";
  const style = tableStatusStyles[status] ?? tableStatusStyles.Available;
  const isPaid = status === "Dirty";
  const isPrinted = status === "Billing";
  const isBlank = status === "Available";
  const isActive = !isBlank;

  return (
    <div
      className={cn(
        "relative flex h-[7.25rem] w-[6.25rem] shrink-0 flex-col rounded-sm border-2 p-2 transition",
        style.bg,
        style.border,
        isPaid ? "opacity-90" : "hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      {isActive && !isPaid && (
        <p className="absolute right-1.5 top-1 text-[10px] font-semibold text-slate-800">
          {formatTableDuration(table.durationMin)}
        </p>
      )}

      <button
        type="button"
        disabled={isPaid}
        onClick={onSelect}
        className={cn(
          "flex flex-1 flex-col items-center justify-center text-center",
          isPaid ? "cursor-default" : "cursor-pointer",
        )}
      >
        <p className="text-2xl font-bold leading-none text-slate-900">
          {table.tableNo.replace(/^T-?/i, "")}
        </p>
        {isActive && table.checkAmount > 0 && !isPaid && (
          <p className="mt-2 text-[11px] font-bold text-slate-900">
            {formatTableAmount(table.checkAmount)}
          </p>
        )}
        {isActive && (table.checkAmount <= 0 || isPaid) && (
          <p className="mt-2 text-[10px] font-medium text-slate-700">
            {isPaid
              ? "Paid"
              : table.guest && table.guest !== "—"
                ? table.guest
                : style.label}
          </p>
        )}
      </button>

      {isPaid && onClean ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClean();
          }}
          className="mx-auto rounded-sm border border-orange-700 bg-white px-2 py-0.5 text-[10px] font-semibold text-orange-900 shadow-sm transition hover:bg-orange-50"
        >
          Clean
        </button>
      ) : isPrinted && onBill ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBill();
          }}
          className="mx-auto flex h-6 w-8 items-center justify-center rounded-sm border border-emerald-800 bg-white text-emerald-900 shadow-sm transition hover:bg-emerald-50"
          aria-label={`Bill for table ${table.tableNo}`}
        >
          <Receipt className="h-3.5 w-3.5" />
        </button>
      ) : isActive ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="mx-auto flex h-6 w-8 items-center justify-center rounded-sm border border-slate-700 bg-white text-slate-800 shadow-sm transition hover:bg-slate-50"
          aria-label={`View table ${table.tableNo}`}
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
