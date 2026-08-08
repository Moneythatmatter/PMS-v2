"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Clock,
  ChefHat,
  Timer,
  UtensilsCrossed,
  X,
} from "lucide-react";
import {
  formatINR,
  type FbOrderStatus,
} from "@/app/data/foodbeverages/ops";
import { fbOrderService, type FbOrder } from "@/services/food-beverages";
import { useFbOutlets } from "@/services/food-beverages/useFbOutlets";
import { Button } from "@/components/ui/Button";
import { ModulePageShell } from "@/components/pms";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import {
  FormField,
  SelectInput,
  TextAreaInput,
  TextInput,
} from "@/components/frontoffice/ui";
import { FbOutletSelect } from "@/components/foodbeverages/FbOutletSelect";
import { cn } from "@/lib/utils";

const STATUS_TABS: { id: "active" | FbOrderStatus; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "Pending", label: "Awaiting" },
  { id: "Preparing", label: "Preparing" },
  { id: "Ready", label: "Ready" },
  { id: "Rejected", label: "Rejected" },
];

const REJECT_PRESETS = [
  "Item not available",
  "Kitchen closed for this dish",
  "Too many pending orders",
  "Ingredient shortage",
  "Other",
];

const statusBadge: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800",
  Preparing: "bg-orange-100 text-orange-800",
  Ready: "bg-emerald-100 text-emerald-800",
  Served: "bg-sky-100 text-sky-800",
  Settled: "bg-slate-100 text-slate-600",
  Rejected: "bg-red-100 text-red-800",
};

export function FbKitchenOrdersView() {
  const { outlets, loading: outletsLoading } = useFbOutlets([
    "restaurant",
    "cafe",
    "bar",
    "kitchen",
  ]);
  const [outletId, setOutletId] = useState("");
  const [orders, setOrders] = useState<FbOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<"active" | FbOrderStatus>("Pending");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [acceptOrder, setAcceptOrder] = useState<FbOrder | null>(null);
  const [prepMinutes, setPrepMinutes] = useState("20");
  const [rejectOrder, setRejectOrder] = useState<FbOrder | null>(null);
  const [rejectPreset, setRejectPreset] = useState(REJECT_PRESETS[0]);
  const [rejectOther, setRejectOther] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (outletsLoading) return;
    if (outlets.length === 0) setLoading(false);
  }, [outletsLoading, outlets.length]);

  useEffect(() => {
    if (outletsLoading) return;
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
          setError(e instanceof Error ? e.message : "Failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [outletId, outletsLoading]);

  const scoped = useMemo(() => {
    return orders.filter((o) => {
      if (outletId && o.outletId && o.outletId !== outletId) return false;
      // Kitchen owns up to Ready; Served/Settled are Orders + POS
      if (o.status === "Served" || o.status === "Settled") return false;
      return true;
    });
  }, [orders, outletId]);

  const counts = useMemo(() => {
    const c = {
      active: 0,
      Pending: 0,
      Preparing: 0,
      Ready: 0,
      Rejected: 0,
    };
    for (const o of scoped) {
      if (o.status in c) c[o.status as keyof typeof c] += 1;
      if (o.status !== "Rejected") c.active += 1;
    }
    return c;
  }, [scoped]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scoped.filter((o) => {
      if (statusTab === "active") {
        if (o.status === "Rejected") return false;
      } else if (o.status !== statusTab) {
        return false;
      }
      if (!q) return true;
      return (
        String(o.orderNo ?? "").toLowerCase().includes(q) ||
        String(o.guest ?? "").toLowerCase().includes(q) ||
        String(o.ref ?? "").toLowerCase().includes(q) ||
        String(o.type ?? "").toLowerCase().includes(q)
      );
    });
  }, [scoped, statusTab, search]);

  const patchLocal = (updated: FbOrder) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  };

  const selected = useMemo(
    () => (selectedId ? (orders.find((o) => o.id === selectedId) ?? null) : null),
    [orders, selectedId],
  );

  const openAccept = (order: FbOrder) => {
    setSelectedId(null);
    setAcceptOrder(order);
    setPrepMinutes(String(order.prepMinutes ?? 20));
    setFormError(null);
  };

  const openReject = (order: FbOrder) => {
    setSelectedId(null);
    setRejectOrder(order);
    setRejectPreset(REJECT_PRESETS[0]);
    setRejectOther("");
    setFormError(null);
  };

  const submitAccept = async () => {
    if (!acceptOrder) return;
    const mins = Number(prepMinutes);
    if (!Number.isFinite(mins) || mins < 1) {
      setFormError("Enter estimated prep time in minutes (at least 1).");
      return;
    }
    try {
      setBusyId(acceptOrder.id);
      setFormError(null);
      const updated = await fbOrderService.accept(acceptOrder.id, {
        prepMinutes: Math.round(mins),
      });
      patchLocal(updated);
      setAcceptOrder(null);
      setStatusTab("Preparing");
      setToast(
        `${acceptOrder.orderNo} accepted · ~${Math.round(mins)} min prep`,
      );
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to accept");
    } finally {
      setBusyId(null);
    }
  };

  const submitReject = async () => {
    if (!rejectOrder) return;
    const reason =
      rejectPreset === "Other"
        ? rejectOther.trim()
        : rejectPreset;
    if (!reason) {
      setFormError("Provide a rejection reason.");
      return;
    }
    try {
      setBusyId(rejectOrder.id);
      setFormError(null);
      const updated = await fbOrderService.reject(rejectOrder.id, { reason });
      patchLocal(updated);
      setRejectOrder(null);
      setStatusTab("Rejected");
      setToast(`${rejectOrder.orderNo} rejected`);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to reject");
    } finally {
      setBusyId(null);
    }
  };

  const advance = async (order: FbOrder, label: string) => {
    try {
      setBusyId(order.id);
      const updated = await fbOrderService.advance(order.id);
      patchLocal(updated);
      setToast(`${order.orderNo} → ${updated.status} (${label})`);
      if (updated.status === "Ready") setStatusTab("Ready");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setBusyId(null);
    }
  };

  const outletLabel = (id?: string) =>
    outlets.find((o) => o.id === id)?.name ?? "Outlet";

  if (loading || outletsLoading) {
    return (
      <ModulePageShell
        eyebrow="Kitchen"
        title="Kitchen"
        description="Accept or reject tickets and mark Ready. Served is on Orders; payment is in POS Billing."
        wrapChildren={false}
      >
        <p className="text-sm text-slate-500">Loading…</p>
      </ModulePageShell>
    );
  }

  if (error) {
    return (
      <ModulePageShell
        eyebrow="Kitchen"
        title="Kitchen"
        description="Accept or reject tickets and mark Ready. Served is on Orders; payment is in POS Billing."
        wrapChildren={false}
      >
        <p className="text-sm text-red-600">{error}</p>
      </ModulePageShell>
    );
  }

  return (
    <ModulePageShell
      eyebrow="Kitchen"
      title="Kitchen"
      description="Accept or reject tickets and mark Ready. Served is on Orders; payment is in POS Billing."
      toast={toast}
      onDismissToast={() => setToast(null)}
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
      searchPlaceholder="Search order, table, or guest…"
      stats={[
        {
          label: "Awaiting",
          value: counts.Pending,
          accent: "#d97706",
          sublabel: "Accept / reject",
        },
        {
          label: "Preparing",
          value: counts.Preparing,
          accent: "#ea580c",
          sublabel: "In kitchen",
        },
        {
          label: "Ready",
          value: counts.Ready,
          accent: "#15803d",
          sublabel: "Hand off to service",
        },
        {
          label: "Rejected",
          value: counts.Rejected,
          accent: "#dc2626",
          sublabel: "Not accepted",
        },
      ]}
      aboveTable={
        <div
          className="inline-flex w-full gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm scrollbar-none"
          role="tablist"
        >
          {STATUS_TABS.map((tab) => {
            const active = statusTab === tab.id;
            const count = counts[tab.id as keyof typeof counts] ?? 0;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStatusTab(tab.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition",
                  active
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      }
    >
      <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((order) => (
          <article
            key={order.id}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedId(order.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedId(order.id);
              }
            }}
            className={cn(
              "flex cursor-pointer flex-col rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md",
              selectedId === order.id && "border-emerald-400 ring-1 ring-emerald-200",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-slate-900">{order.orderNo}</p>
                <p className="text-[11px] text-slate-500">
                  {order.type} · {order.ref || "—"}
                  {!outletId ? ` · ${outletLabel(order.outletId)}` : ""}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  statusBadge[order.status] ?? statusBadge.Pending,
                )}
              >
                {order.status}
              </span>
            </div>

            <p className="mt-2 text-xs font-medium text-slate-800">
              {order.guest || "Guest"}
            </p>

            <ul className="mt-2 space-y-0.5 border-t border-slate-100 pt-2">
              {(order.lines ?? []).slice(0, 4).map((line) => (
                <li key={`${order.id}-${line.name}`} className="text-[11px] text-slate-600">
                  {line.qty}× {line.name}
                </li>
              ))}
              {(order.lines ?? []).length === 0 && (
                <li className="text-[11px] text-slate-400">No items</li>
              )}
            </ul>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {order.placedAt || "—"}
              </span>
              {order.prepMinutes != null && (
                <span className="inline-flex items-center gap-1 font-medium text-orange-700">
                  <Timer className="h-3 w-3" />
                  ~{order.prepMinutes} min
                </span>
              )}
              <span className="ml-auto font-semibold text-emerald-800">
                {formatINR(Number(order.amount ?? 0))}
              </span>
            </div>

            {order.status === "Rejected" && order.rejectReason && (
              <p className="mt-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-[11px] text-red-700">
                {order.rejectReason}
              </p>
            )}

            <div
              className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {order.status === "Pending" && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1 gap-1 bg-emerald-700 hover:bg-emerald-800"
                    disabled={busyId === order.id}
                    onClick={() => openAccept(order)}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Accept
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1 border-red-200 text-red-700 hover:bg-red-50"
                    disabled={busyId === order.id}
                    onClick={() => openReject(order)}
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                </>
              )}
              {order.status === "Preparing" && (
                <Button
                  type="button"
                  size="sm"
                  className="w-full gap-1 bg-emerald-700 hover:bg-emerald-800"
                  disabled={busyId === order.id}
                  onClick={() => void advance(order, "Ready for pass")}
                >
                  <ChefHat className="h-3.5 w-3.5" />
                  Mark Ready
                </Button>
              )}
              {order.status === "Ready" && (
                <p className="w-full rounded-lg bg-emerald-50 px-2.5 py-2 text-center text-[11px] font-medium text-emerald-800">
                  Ready — mark Served on Orders, then settle in POS Billing
                </p>
              )}
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center text-sm text-slate-500">
          No kitchen orders in this view.
        </div>
      )}

      <Drawer
        open={!!selected}
        onClose={() => setSelectedId(null)}
        title={selected?.orderNo ?? "Order"}
        description={
          selected
            ? `${selected.type} · ${selected.ref || "—"} · ${outletLabel(selected.outletId)}`
            : undefined
        }
        width="md"
        footer={
          selected?.status === "Pending" ? (
            <div className="flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-1 border-red-200 text-red-700 hover:bg-red-50"
                disabled={busyId === selected.id}
                onClick={() => openReject(selected)}
              >
                <X className="h-3.5 w-3.5" />
                Reject
              </Button>
              <Button
                type="button"
                className="flex-1 gap-1 bg-emerald-700 hover:bg-emerald-800"
                disabled={busyId === selected.id}
                onClick={() => openAccept(selected)}
              >
                <Check className="h-3.5 w-3.5" />
                Accept
              </Button>
            </div>
          ) : selected?.status === "Preparing" ? (
            <Button
              type="button"
              className="w-full gap-1 bg-emerald-700 hover:bg-emerald-800"
              disabled={busyId === selected.id}
              onClick={() => void advance(selected, "Ready for pass")}
            >
              <ChefHat className="h-3.5 w-3.5" />
              Mark Ready
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
                  statusBadge[selected.status] ?? statusBadge.Pending,
                )}
              >
                {selected.status}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                {selected.type}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Detail label="Guest" value={selected.guest || "—"} />
              <Detail label="Table / Ref" value={selected.ref || "—"} />
              <Detail label="Server" value={selected.server || "—"} />
              <Detail label="Placed" value={selected.placedAt || "—"} />
              <Detail label="Outlet" value={outletLabel(selected.outletId)} />
              <Detail
                label="Prep time"
                value={
                  selected.prepMinutes != null
                    ? `~${selected.prepMinutes} min`
                    : "—"
                }
              />
            </div>

            {selected.status === "Rejected" && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-red-600">
                  Rejection reason
                </p>
                <p className="mt-1 text-sm font-medium text-red-900">
                  {selected.rejectReason?.trim() || "No reason provided"}
                </p>
              </div>
            )}

            {selected.prepMinutes != null &&
              selected.status !== "Rejected" &&
              selected.status !== "Pending" && (
                <div className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-700">
                    Kitchen prep estimate
                  </p>
                  <p className="mt-1 text-sm font-medium text-orange-950">
                    ~{selected.prepMinutes} minutes
                  </p>
                </div>
              )}

            <div>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <UtensilsCrossed className="h-3.5 w-3.5" />
                Order lines
              </div>
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {(selected.lines ?? []).map((line) => (
                  <li
                    key={`${selected.id}-${line.name}`}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                  >
                    <span className="font-medium text-slate-900">
                      <span className="text-slate-500">{line.qty}×</span> {line.name}
                    </span>
                  </li>
                ))}
                {(selected.lines ?? []).length === 0 && (
                  <li className="px-3 py-4 text-center text-xs text-slate-400">
                    No items
                  </li>
                )}
              </ul>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
              <span className="text-sm font-medium text-emerald-900">Order total</span>
              <span className="text-lg font-bold text-emerald-900">
                {formatINR(Number(selected.amount ?? 0))}
              </span>
            </div>

            {selected.status === "Ready" && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-center text-xs font-medium text-emerald-800">
                Ready — mark Served on Orders, then settle in POS Billing
              </p>
            )}
          </div>
        )}
      </Drawer>

      <Drawer
        open={!!acceptOrder}
        onClose={() => setAcceptOrder(null)}
        title="Accept order"
        description={
          acceptOrder
            ? `${acceptOrder.orderNo} · set prep time`
            : undefined
        }
        width="md"
        footer={
          <div className="flex w-full gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setAcceptOrder(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 bg-emerald-700 hover:bg-emerald-800"
              disabled={!!busyId}
              onClick={() => void submitAccept()}
            >
              Accept & start prep
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {formError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {formError}
            </p>
          )}
          <FormField
            label="Estimated prep time (minutes)"
            required
            helperText="How long until this order is ready"
          >
            <TextInput
              type="number"
              min={1}
              value={prepMinutes}
              onChange={(e) => setPrepMinutes(e.target.value)}
              placeholder="e.g. 20"
            />
          </FormField>
          {acceptOrder && (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
              {(acceptOrder.lines ?? []).map((l) => (
                <li key={l.name} className="px-3 py-2">
                  {l.qty}× {l.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Drawer>

      <Drawer
        open={!!rejectOrder}
        onClose={() => setRejectOrder(null)}
        title="Reject order"
        description={
          rejectOrder
            ? `${rejectOrder.orderNo} · provide a reason`
            : undefined
        }
        width="md"
        footer={
          <div className="flex w-full gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setRejectOrder(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={!!busyId}
              onClick={() => void submitReject()}
            >
              Reject order
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {formError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {formError}
            </p>
          )}
          <FormField label="Reason" required>
            <SelectInput
              value={rejectPreset}
              onChange={(e) => setRejectPreset(e.target.value)}
            >
              {REJECT_PRESETS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </SelectInput>
          </FormField>
          {rejectPreset === "Other" && (
            <FormField label="Details" required>
              <TextAreaInput
                value={rejectOther}
                onChange={(e) => setRejectOther(e.target.value)}
                placeholder="e.g. Paneer dish unavailable today"
              />
            </FormField>
          )}
        </div>
      </Drawer>
      </>
    </ModulePageShell>
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
