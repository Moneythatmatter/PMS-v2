"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardList, Eye } from "lucide-react";
import { formatINR, type FbOrderStatus } from "@/app/data/foodbeverages/ops";
import { fbOrderService, posService, type FbOrder } from "@/services/food-beverages";
import { useFbOutlets } from "@/services/food-beverages/useFbOutlets";
import { Button } from "@/components/ui/Button";
import { ModulePageShell } from "@/components/pms";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { FbOutletSelect } from "@/components/foodbeverages/FbOutletSelect";
import { cn } from "@/lib/utils";

const STATUS_TABS: { id: "all" | FbOrderStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "Pending", label: "Pending" },
  { id: "Preparing", label: "Preparing" },
  { id: "Ready", label: "Ready" },
  { id: "Served", label: "Served" },
  { id: "Settled", label: "Settled" },
  { id: "Cancelled", label: "Cancelled" },
];

const statusBadge: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800",
  Preparing: "bg-orange-100 text-orange-800",
  Ready: "bg-emerald-100 text-emerald-800",
  Served: "bg-sky-100 text-sky-800",
  Settled: "bg-slate-100 text-slate-600",
  Cancelled: "bg-red-100 text-red-800",
  Rejected: "bg-red-100 text-red-800",
};

function formatOrderDate(value: string | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function itemCount(order: FbOrder) {
  return (order.lines ?? []).reduce((sum, line) => sum + Number(line.qty ?? 0), 0);
}

function isOrderCancelled(order: FbOrder) {
  const lifecycle = String((order as any).lifecycleStatus ?? "").toUpperCase();
  return lifecycle === "CANCELLED" || order.status === "Cancelled" || order.status === "Rejected";
}

type OrderItemView = {
  id: string;
  name: string;
  qty: number;
  status: string;
  lineTotal: number;
  note?: string;
};

type OrderKotView = {
  id: string;
  kotNo: string;
  status: string;
  lines: { id: string; name: string; qty: number; status: string; note?: string }[];
};

function parseOrderItems(items: unknown[]): OrderItemView[] {
  return (items as Record<string, unknown>[]).map((item) => ({
    id: String(item.id),
    name: String(item.name ?? "Item"),
    qty: Number(item.quantity ?? 1),
    status: String(item.status ?? "ACTIVE").toUpperCase(),
    lineTotal: Number(item.lineTotal ?? item.line_total ?? 0),
    ...(item.note ? { note: String(item.note) } : {}),
  }));
}

function parseOrderKots(details: { kots: unknown[]; items: unknown[] }) {
  const items = details.items as Record<string, unknown>[];
  const itemById = new Map(items.map((item) => [String(item.id), item]));

  return (details.kots as Record<string, unknown>[]).map((kot) => {
    const kotItems = (kot.items as Record<string, unknown>[]) ?? [];
    const lines = kotItems.map((ki) => {
      const orderItem = itemById.get(String(ki.orderItemId ?? ki.order_item_id ?? ""));
      return {
        id: String(ki.id),
        name: String(orderItem?.name ?? "Item"),
        qty: Number(ki.quantity ?? orderItem?.quantity ?? 1),
        status: String(ki.status ?? "PENDING").toUpperCase(),
        ...(orderItem?.note ? { note: String(orderItem.note) } : {}),
      };
    });
    return {
      id: String(kot.id),
      kotNo: String(kot.kotNumber ?? kot.kot_number ?? kot.id),
      status: String(kot.status ?? "PENDING"),
      lines,
    };
  });
}

const kotStatusBadge: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PREPARING: "bg-orange-100 text-orange-800",
  READY: "bg-emerald-100 text-emerald-800",
  SERVED: "bg-sky-100 text-sky-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const lineStatusBadge: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
  VOID: "bg-red-100 text-red-800",
  PREPARING: "bg-orange-100 text-orange-800",
  READY: "bg-emerald-100 text-emerald-800",
  PENDING: "bg-amber-100 text-amber-800",
  SERVED: "bg-sky-100 text-sky-800",
};

const ALL_ORDERS_PATH = "/food-beverages/restaurants/all-orders";

export function FbAllOrdersView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get("orderId");
  const { outlets } = useFbOutlets(["all"]);
  const [outletId, setOutletId] = useState("");
  const [orders, setOrders] = useState<FbOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<"all" | FbOrderStatus>("all");
  const [selectedOrder, setSelectedOrder] = useState<FbOrder | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemView[]>([]);
  const [orderKots, setOrderKots] = useState<OrderKotView[]>([]);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);

  const outletNameById = useMemo(
    () => new Map(outlets.map((o) => [o.id, o.name])),
    [outlets],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await fbOrderService.list(outletId || undefined);
        if (!cancelled) {
          setOrders(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setOrders([]);
          setError(e instanceof Error ? e.message : "Failed to load orders");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [outletId]);

  useEffect(() => {
    if (!orderIdParam || loading) return;
    let cancelled = false;
    (async () => {
      const fromList = orders.find((order) => order.id === orderIdParam);
      if (fromList) {
        setSelectedOrder(fromList);
        return;
      }
      try {
        const order = await fbOrderService.get(orderIdParam);
        if (!cancelled) setSelectedOrder(order);
      } catch {
        if (!cancelled) setSelectedOrder(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderIdParam, loading, orders]);

  useEffect(() => {
    if (!selectedOrder?.id) {
      setOrderItems([]);
      setOrderKots([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoadingOrderDetail(true);
        const details = await posService.getOrderDetails(selectedOrder.id);
        if (!cancelled) {
          setOrderItems(parseOrderItems(details.items));
          setOrderKots(parseOrderKots(details));
          setSelectedOrder(details.order);
        }
      } catch {
        if (!cancelled) {
          setOrderItems([]);
          setOrderKots([]);
        }
      } finally {
        if (!cancelled) setLoadingOrderDetail(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedOrder?.id]);

  const openOrderDetail = (order: FbOrder) => {
    setSelectedOrder(order);
    router.replace(`${ALL_ORDERS_PATH}?orderId=${encodeURIComponent(order.id)}`);
  };

  const closeOrderDetail = () => {
    setSelectedOrder(null);
    setOrderItems([]);
    setOrderKots([]);
    if (orderIdParam) {
      router.replace(ALL_ORDERS_PATH);
    }
  };

  const outletLabel = outletId
    ? outletNameById.get(outletId) ?? "Outlet"
    : "All outlets";

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusTab === "Cancelled") {
        if (!isOrderCancelled(order)) return false;
      } else if (statusTab !== "all" && order.status !== statusTab) {
        return false;
      }
      if (!q) return true;
      return (
        String(order.orderNo ?? "").toLowerCase().includes(q) ||
        String(order.guest ?? "").toLowerCase().includes(q) ||
        String(order.ref ?? "").toLowerCase().includes(q) ||
        String(order.type ?? "").toLowerCase().includes(q) ||
        String(order.server ?? "").toLowerCase().includes(q)
      );
    });
  }, [orders, statusTab, search]);

  const activeCount = useMemo(
    () => orders.filter((o) => !isOrderCancelled(o) && o.status !== "Settled").length,
    [orders],
  );

  const settledTotal = useMemo(
    () =>
      orders
        .filter((o) => o.status === "Settled")
        .reduce((sum, o) => sum + Number(o.amount ?? 0), 0),
    [orders],
  );

  if (loading) {
    return (
      <ModulePageShell
        eyebrow="Restaurants"
        title="All Orders"
        description="Browse every F&B order across outlets — status, guest, items, and totals."
        wrapChildren={false}
      >
        <p className="text-sm text-slate-500">Loading…</p>
      </ModulePageShell>
    );
  }

  if (error) {
    return (
      <ModulePageShell
        eyebrow="Restaurants"
        title="All Orders"
        description="Browse every F&B order across outlets — status, guest, items, and totals."
        wrapChildren={false}
      >
        <p className="text-sm text-red-600">{error}</p>
      </ModulePageShell>
    );
  }

  return (
    <>
      <ModulePageShell
        eyebrow="Restaurants"
        title="All Orders"
        description="Browse every F&B order across outlets — status, guest, items, and totals."
        wrapChildren={false}
        beforeFilters={
          <FbOutletSelect
            outlets={outlets}
            value={outletId}
            onChange={setOutletId}
            allowAll
          />
        }
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search order, guest, table, server…"
        stats={[
          {
            label: "Total orders",
            value: String(orders.length),
            accent: "#0f766e",
            sublabel: outletLabel,
          },
          {
            label: "Active",
            value: String(activeCount),
            accent: "#d97706",
            sublabel: "Not settled or cancelled",
          },
          {
            label: "Settled sales",
            value: formatINR(settledTotal),
            accent: "#15803d",
            sublabel: "Settled order value",
          },
        ]}
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusTab(tab.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition",
                statusTab === tab.id
                  ? "bg-emerald-700 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  {!outletId && <th className="px-4 py-3 font-semibold">Outlet</th>}
                  <th className="px-4 py-3 font-semibold">Table / Ref</th>
                  <th className="px-4 py-3 font-semibold">Guest</th>
                  <th className="px-4 py-3 font-semibold">Items</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Placed</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={outletId ? 9 : 10}
                      className="px-4 py-12 text-center text-slate-400"
                    >
                      <ClipboardList className="mx-auto mb-2 h-8 w-8 opacity-40" />
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {order.orderNo || order.id}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{order.type || "—"}</td>
                      {!outletId && (
                        <td className="px-4 py-3 text-slate-600">
                          {(outletNameById.get(order.outletId) ?? order.outletId) || "—"}
                        </td>
                      )}
                      <td className="px-4 py-3 text-slate-600">{order.ref || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <div>{order.guest || "—"}</div>
                        <div className="text-[11px] text-slate-400">{order.server || "—"}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{itemCount(order)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {formatINR(Number(order.amount ?? 0))}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            isOrderCancelled(order)
                              ? statusBadge.Cancelled
                              : (statusBadge[order.status] ?? "bg-slate-100 text-slate-600"),
                          )}
                        >
                          {isOrderCancelled(order) ? "Cancelled" : order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatOrderDate(order.placedAt || order.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => openOrderDetail(order)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </ModulePageShell>

      <Drawer
        open={Boolean(selectedOrder)}
        onClose={closeOrderDetail}
        title={selectedOrder?.orderNo ?? "Order details"}
        description={
          selectedOrder
            ? `${selectedOrder.type} · ${selectedOrder.ref || "No table"} · ${selectedOrder.guest}`
            : undefined
        }
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Outlet</span>
                <span className="font-medium text-slate-900">
                  {(outletNameById.get(selectedOrder.outletId) ?? selectedOrder.outletId) || "—"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Server</span>
                <span className="font-medium text-slate-900">{selectedOrder.server || "—"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Status</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    isOrderCancelled(selectedOrder)
                      ? statusBadge.Cancelled
                      : (statusBadge[selectedOrder.status] ?? "bg-slate-100 text-slate-600"),
                  )}
                >
                  {isOrderCancelled(selectedOrder) ? "Cancelled" : selectedOrder.status}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Placed</span>
                <span className="font-medium text-slate-900">
                  {formatOrderDate(selectedOrder.placedAt || selectedOrder.createdAt)}
                </span>
              </div>
              {selectedOrder.paymentMode && (
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Payment</span>
                  <span className="font-medium text-slate-900">{selectedOrder.paymentMode}</span>
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Billable items</h3>
              {loadingOrderDetail ? (
                <p className="text-sm text-slate-400">Loading items…</p>
              ) : orderItems.length === 0 ? (
                <p className="text-sm text-slate-400">No line items on this order.</p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {orderItems.map((line) => {
                    const cancelled = line.status === "CANCELLED" || line.status === "VOID";
                    return (
                      <li
                        key={line.id}
                        className={cn(
                          "flex items-start justify-between gap-3 px-3 py-2.5 text-sm",
                          cancelled && "bg-red-50/50",
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p
                              className={cn(
                                "font-medium",
                                cancelled ? "text-slate-400 line-through" : "text-slate-900",
                              )}
                            >
                              {line.name}
                            </p>
                            <span
                              className={cn(
                                "rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase",
                                lineStatusBadge[line.status] ?? "bg-slate-100 text-slate-600",
                              )}
                            >
                              {line.status}
                            </span>
                          </div>
                          {line.note && (
                            <p className="mt-0.5 text-[11px] text-slate-400">{line.note}</p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <span
                            className={cn(
                              "font-medium",
                              cancelled ? "text-slate-400 line-through" : "text-slate-700",
                            )}
                          >
                            ×{line.qty}
                          </span>
                          {!cancelled && line.lineTotal > 0 && (
                            <p className="text-[11px] text-slate-500">
                              {formatINR(line.lineTotal)}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-900">KOT tickets</h3>
              {loadingOrderDetail ? (
                <p className="text-sm text-slate-400">Loading KOTs…</p>
              ) : orderKots.length === 0 ? (
                <p className="text-sm text-slate-400">No KOT tickets for this order.</p>
              ) : (
                <div className="space-y-3">
                  {orderKots.map((kot) => {
                    const kotCancelled = kot.status.toUpperCase() === "CANCELLED";
                    return (
                    <div
                      key={kot.id}
                      className={cn(
                        "rounded-lg border bg-white p-3",
                        kotCancelled ? "border-red-200 bg-red-50/30" : "border-slate-200",
                      )}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{kot.kotNo}</p>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                            kotStatusBadge[kot.status.toUpperCase()] ??
                              "bg-slate-100 text-slate-600",
                          )}
                        >
                          {kot.status}
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {kot.lines.map((line) => {
                          const lineCancelled = line.status === "CANCELLED";
                          return (
                          <li
                            key={line.id}
                            className={cn(
                              "flex items-center justify-between gap-3 text-sm",
                              lineCancelled ? "text-slate-400 line-through" : "text-slate-700",
                            )}
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span>{line.name}</span>
                              {lineCancelled && (
                                <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-red-700 no-underline">
                                  Cancelled
                                </span>
                              )}
                            </div>
                            <span className="shrink-0 font-medium">×{line.qty}</span>
                          </li>
                          );
                        })}
                      </ul>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-sm font-semibold text-slate-900">Total</span>
              <span className="text-lg font-bold text-slate-900">
                {formatINR(Number(selectedOrder.amount ?? 0))}
              </span>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
