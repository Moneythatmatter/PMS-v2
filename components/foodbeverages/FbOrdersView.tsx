"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Clock, Columns3, List, UtensilsCrossed } from "lucide-react";
import {
  fbOrdersSeed,
  formatINR,
  getRestaurantOutletOptions,
  type FbOrder,
  type FbOrderStatus,
} from "@/app/data/foodbeverages/ops";
import { Button } from "@/components/ui/Button";
import { ModulePageShell } from "@/components/pms";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { FbOutletSelect } from "@/components/foodbeverages/FbOutletSelect";
import { cn } from "@/lib/utils";

const columns: { id: FbOrderStatus; label: string; accent: string }[] = [
  { id: "Pending", label: "Pending", accent: "border-amber-200 bg-amber-50/40" },
  { id: "Preparing", label: "Preparing", accent: "border-orange-200 bg-orange-50/40" },
  { id: "Ready", label: "Ready", accent: "border-emerald-200 bg-emerald-50/40" },
  { id: "Served", label: "Served", accent: "border-slate-200 bg-slate-50/60" },
];

const nextStatus: Partial<Record<FbOrderStatus, FbOrderStatus>> = {
  Pending: "Preparing",
  Preparing: "Ready",
  Ready: "Served",
  Served: "Settled",
};

const statusBadge: Record<FbOrderStatus, string> = {
  Pending: "bg-amber-100 text-amber-800",
  Preparing: "bg-orange-100 text-orange-800",
  Ready: "bg-emerald-100 text-emerald-800",
  Served: "bg-slate-100 text-slate-700",
  Settled: "bg-emerald-50 text-emerald-800",
};

const typeFilters = [
  { id: "all", label: "All" },
  { id: "Dine In", label: "Dine In" },
  { id: "Takeaway", label: "Takeaway" },
  { id: "Room Service", label: "Room Service" },
  { id: "Online", label: "Online" },
];

type ViewMode = "board" | "list";

export function FbOrdersView() {
  const outlets = getRestaurantOutletOptions();
  const [outletId, setOutletId] = useState(outlets[0]?.id ?? "rest-1");
  const [orders, setOrders] = useState(fbOrdersSeed);
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (o.outletId !== outletId) return false;
      if (o.status === "Settled") return false;
      if (typeFilter !== "all" && o.type !== typeFilter) return false;
      if (!q) return true;
      return (
        o.orderNo.toLowerCase().includes(q) ||
        o.guest.toLowerCase().includes(q) ||
        o.ref.toLowerCase().includes(q)
      );
    });
  }, [orders, outletId, typeFilter, search]);

  const byStatus = useMemo(() => {
    const map: Record<string, FbOrder[]> = {
      Pending: [],
      Preparing: [],
      Ready: [],
      Served: [],
    };
    for (const o of filtered) {
      if (map[o.status]) map[o.status].push(o);
    }
    return map;
  }, [filtered]);

  const selected = useMemo(
    () => (selectedId ? (orders.find((o) => o.id === selectedId) ?? null) : null),
    [orders, selectedId],
  );

  const advance = (order: FbOrder) => {
    const next = nextStatus[order.status];
    if (!next) return;
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: next } : o)));
    if (next === "Settled") {
      setSelectedId(null);
      setToast(`${order.orderNo} settled`);
    } else {
      setToast(`${order.orderNo} → ${next}`);
    }
  };

  const outletName = outlets.find((o) => o.id === outletId)?.name ?? "Outlet";

  return (
    <ModulePageShell
      eyebrow="Restaurants"
      title="Orders"
      description="Open checks across dine-in, takeaway, room service, and online."
      toast={toast}
      onDismissToast={() => setToast(null)}
      wrapChildren={false}
      beforeFilters={
        <div className="flex w-full flex-col gap-1.5 sm:w-auto">
          <FbOutletSelect outlets={outlets} value={outletId} onChange={setOutletId} />
          <div className="flex h-9 overflow-hidden rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("board")}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition",
                viewMode === "board"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50",
              )}
            >
              <Columns3 className="h-3.5 w-3.5" />
              Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition",
                viewMode === "list"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50",
              )}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
          </div>
        </div>
      }
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search order, table, or guest…"
      filterPills={{
        active: typeFilter,
        onChange: setTypeFilter,
        options: typeFilters,
      }}
      stats={[
        { label: "Open", value: filtered.length, accent: "#d97706", sublabel: "Active checks" },
        { label: "Preparing", value: byStatus.Preparing.length, accent: "#ea580c", sublabel: "In kitchen" },
        { label: "Ready", value: byStatus.Ready.length, accent: "#15803d", sublabel: "Pickup" },
        {
          label: "Value",
          value: formatINR(filtered.reduce((s, o) => s + o.amount, 0)),
          accent: "#15803d",
          sublabel: "Open checks",
        },
      ]}
    >
      {viewMode === "board" ? (
        <div className="grid gap-3 lg:grid-cols-4">
          {columns.map((col) => (
            <section
              key={col.id}
              className={cn("flex min-h-[28rem] flex-col rounded-xl border p-3", col.accent)}
            >
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">{col.label}</h2>
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                  {byStatus[col.id]?.length ?? 0}
                </span>
              </div>
              <ul className="flex flex-1 flex-col gap-2">
                {(byStatus[col.id] ?? []).map((order) => (
                  <li key={order.id}>
                    <OrderCard
                      order={order}
                      selected={selectedId === order.id}
                      onSelect={() => setSelectedId(order.id)}
                      onAdvance={() => advance(order)}
                    />
                  </li>
                ))}
                {(byStatus[col.id] ?? []).length === 0 && (
                  <li className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-200 py-8 text-xs text-slate-400">
                    Empty
                  </li>
                )}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Order</th>
                  <th className="px-3 py-2.5">Type</th>
                  <th className="px-3 py-2.5">Table / Ref</th>
                  <th className="px-3 py-2.5">Guest</th>
                  <th className="px-3 py-2.5">Items</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Placed</th>
                  <th className="px-3 py-2.5 text-right">Amount</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    className={cn(
                      "cursor-pointer transition hover:bg-emerald-50/40",
                      selectedId === order.id && "bg-emerald-50/60",
                    )}
                    onClick={() => setSelectedId(order.id)}
                  >
                    <td className="px-3 py-2.5 font-semibold text-slate-900">{order.orderNo}</td>
                    <td className="px-3 py-2.5 text-slate-600">{order.type}</td>
                    <td className="px-3 py-2.5 text-slate-600">{order.ref}</td>
                    <td className="px-3 py-2.5 text-slate-800">{order.guest}</td>
                    <td className="px-3 py-2.5 text-slate-600">
                      {order.lines.reduce((n, l) => n + l.qty, 0)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          statusBadge[order.status],
                        )}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-500">{order.placedAt}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-emerald-800">
                      {formatINR(order.amount)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {nextStatus[order.status] && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 px-2 text-[11px]"
                          onClick={(e) => {
                            e.stopPropagation();
                            advance(order);
                          }}
                        >
                          {nextStatus[order.status]}
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-3 py-10 text-center text-sm text-slate-400">
                      No orders match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Drawer
        open={!!selected}
        onClose={() => setSelectedId(null)}
        title={selected?.orderNo ?? "Order"}
        description={selected ? `${selected.type} · ${selected.ref}` : undefined}
        width="md"
        footer={
          selected && nextStatus[selected.status] ? (
            <Button
              type="button"
              className="w-full bg-emerald-700 hover:bg-emerald-800"
              onClick={() => advance(selected)}
            >
              Move to {nextStatus[selected.status]}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : undefined
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                  statusBadge[selected.status],
                )}
              >
                {selected.status}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                {selected.type}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Detail label="Guest" value={selected.guest} />
              <Detail label="Table / Ref" value={selected.ref} />
              <Detail label="Server" value={selected.server} />
              <Detail label="Placed" value={selected.placedAt} />
              <Detail label="Outlet" value={outletName} />
              <Detail
                label="Items"
                value={String(selected.lines.reduce((n, l) => n + l.qty, 0))}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <UtensilsCrossed className="h-3.5 w-3.5" />
                Order lines
              </div>
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {selected.lines.map((line) => (
                  <li
                    key={line.name}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                  >
                    <span className="font-medium text-slate-900">
                      <span className="text-slate-500">{line.qty}×</span> {line.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
              <span className="text-sm font-medium text-emerald-900">Order total</span>
              <span className="text-lg font-bold text-emerald-900">
                {formatINR(selected.amount)}
              </span>
            </div>
          </div>
        )}
      </Drawer>
    </ModulePageShell>
  );
}

function OrderCard({
  order,
  selected,
  onSelect,
  onAdvance,
}: {
  order: FbOrder;
  selected: boolean;
  onSelect: () => void;
  onAdvance: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md",
        selected && "border-emerald-400 ring-1 ring-emerald-200",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-slate-900">{order.orderNo}</p>
          <p className="text-[11px] text-slate-500">
            {order.type} · {order.ref}
          </p>
        </div>
        <span className="text-xs font-semibold text-emerald-800">{formatINR(order.amount)}</span>
      </div>
      <p className="mt-1 text-xs font-medium text-slate-800">{order.guest}</p>
      <ul className="mt-2 space-y-0.5 border-t border-slate-100 pt-2">
        {order.lines.slice(0, 3).map((line) => (
          <li key={line.name} className="text-[11px] text-slate-600">
            {line.qty}× {line.name}
          </li>
        ))}
        {order.lines.length > 3 && (
          <li className="text-[11px] text-slate-400">+{order.lines.length - 3} more</li>
        )}
      </ul>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
          <Clock className="h-3 w-3" />
          {order.placedAt}
        </span>
        {nextStatus[order.status] && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 gap-1 px-2 text-[11px]"
            onClick={(e) => {
              e.stopPropagation();
              onAdvance();
            }}
          >
            {nextStatus[order.status]}
            <ArrowRight className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
