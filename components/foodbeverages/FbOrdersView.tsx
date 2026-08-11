"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Clock,
  Columns3,
  LayoutGrid,
  List,
  Plus,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import {
  formatINR,
  type FbOrderStatus,
} from "@/app/data/foodbeverages/ops";
import {
  fbOrderService,
  liveTableService,
  menuItemService,
  type FbOrder,
  type LiveTable,
} from "@/services/food-beverages";
import { useFbOutlets } from "@/services/food-beverages/useFbOutlets";
import { currentUser } from "@/app/data";
import { Button } from "@/components/ui/Button";
import { ModulePageShell } from "@/components/pms";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import {
  FormField,
  SelectInput,
  TextInput,
  FODatePicker,
} from "@/components/frontoffice/ui";
import { FbOutletSelect } from "@/components/foodbeverages/FbOutletSelect";
import { cn } from "@/lib/utils";

const STATUS_TABS: { id: "live" | "all" | FbOrderStatus; label: string }[] = [
  { id: "live", label: "Live" },
  { id: "all", label: "All" },
  { id: "Pending", label: "Pending" },
  { id: "Preparing", label: "Preparing" },
  { id: "Ready", label: "Ready" },
  { id: "Served", label: "Served" },
  { id: "Settled", label: "Settled" },
  { id: "Rejected", label: "Rejected" },
];

const BOARD_COLUMNS: { id: FbOrderStatus; label: string; accent: string }[] = [
  { id: "Pending", label: "Pending", accent: "border-amber-200 bg-amber-50/40" },
  { id: "Preparing", label: "Preparing", accent: "border-orange-200 bg-orange-50/40" },
  { id: "Ready", label: "Ready", accent: "border-emerald-200 bg-emerald-50/40" },
  { id: "Served", label: "Served", accent: "border-sky-200 bg-sky-50/50" },
];

const ORDER_TYPES = ["Dine In", "Takeaway", "Room Service", "Online"] as const;

type LayoutMode = "card" | "list" | "board";
type SortId = "newest" | "oldest" | "amount-high" | "amount-low";

function toDateKey(value?: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function orderDateKey(order: FbOrder): string | null {
  return toDateKey(order.createdAt);
}

const nextStatus: Partial<Record<FbOrderStatus, FbOrderStatus>> = {
  // Pending → Preparing happens in Kitchen Orders (Accept)
  // Preparing → Ready happens in Kitchen Orders
  Ready: "Served",
  // Settled only via POS Billing collect payment
};

const statusBadge: Record<FbOrderStatus, string> = {
  Pending: "bg-amber-100 text-amber-800",
  Preparing: "bg-orange-100 text-orange-800",
  Ready: "bg-emerald-100 text-emerald-800",
  Served: "bg-slate-100 text-slate-700",
  Settled: "bg-emerald-50 text-emerald-800",
  Rejected: "bg-red-100 text-red-800",
};

type MenuItem = {
  id: string;
  name: string;
  price?: number;
  status?: string;
};

type DraftLine = { name: string; qty: number; price: number };

function nowTime() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function FbOrdersView() {
  const { outlets, loading: outletsLoading } = useFbOutlets([
    "restaurant",
    "cafe",
    "bar",
  ]);
  const [outletId, setOutletId] = useState(""); // "" = all outlets
  const [orders, setOrders] = useState<FbOrder[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<LiveTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layout, setLayout] = useState<LayoutMode>("card");
  const [statusTab, setStatusTab] = useState<"live" | "all" | FbOrderStatus>("live");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortBy, setSortBy] = useState<SortId>("newest");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [formOutletId, setFormOutletId] = useState("");
  const [formType, setFormType] = useState<(typeof ORDER_TYPES)[number]>("Dine In");
  const [formGuest, setFormGuest] = useState("");
  const [formRef, setFormRef] = useState("");
  const [formLines, setFormLines] = useState<DraftLine[]>([]);
  const [addItemId, setAddItemId] = useState("");

  useEffect(() => {
    if (outletsLoading) return;
    if (outlets.length === 0) setLoading(false);
  }, [outletsLoading, outlets.length]);

  // Live → cards; other status tabs → list (keep Board if user chose it)
  useEffect(() => {
    setLayout((current) => {
      if (current === "board") return "board";
      return statusTab === "live" ? "card" : "list";
    });
  }, [statusTab]);

  useEffect(() => {
    if (outletsLoading) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const listArg = outletId || undefined;
        const [orderData, menuData, tableData] = await Promise.all([
          fbOrderService.list(listArg),
          menuItemService.list().catch(() => []),
          liveTableService.list(listArg).catch(() => []),
        ]);
        if (cancelled) return;
        setOrders(orderData);
        setMenuItems(
          (menuData as MenuItem[]).filter(
            (m) => String(m.status ?? "Active").toLowerCase() !== "inactive",
          ),
        );
        setTables(tableData);
        setError(null);
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

  const scopedOrders = useMemo(() => {
    return orders.filter((o) => {
      if (outletId && o.outletId && o.outletId !== outletId) return false;
      return true;
    });
  }, [orders, outletId]);

  const advancedFiltered = useMemo(() => {
    const min = minAmount.trim() === "" ? null : Number(minAmount);
    const max = maxAmount.trim() === "" ? null : Number(maxAmount);
    return scopedOrders.filter((o) => {
      if (typeFilter !== "all" && o.type !== typeFilter) return false;

      const amount = Number(o.amount ?? 0);
      if (min != null && Number.isFinite(min) && amount < min) return false;
      if (max != null && Number.isFinite(max) && amount > max) return false;

      if (fromDate || toDate) {
        const key = orderDateKey(o);
        if (!key) return false;
        if (fromDate && key < fromDate) return false;
        if (toDate && key > toDate) return false;
      }
      return true;
    });
  }, [scopedOrders, typeFilter, minAmount, maxAmount, fromDate, toDate]);

  const counts = useMemo(() => {
    const base = {
      live: 0,
      all: 0,
      Pending: 0,
      Preparing: 0,
      Ready: 0,
      Served: 0,
      Settled: 0,
      Rejected: 0,
    };
    for (const o of advancedFiltered) {
      base.all += 1;
      if (o.status !== "Settled" && o.status !== "Rejected") base.live += 1;
      if (o.status in base) base[o.status as keyof typeof base] += 1;
    }
    return base;
  }, [advancedFiltered]);

  const openCount = useMemo(() => counts.live, [counts.live]);

  const hasAdvancedFilters =
    !!fromDate ||
    !!toDate ||
    typeFilter !== "all" ||
    minAmount.trim() !== "" ||
    maxAmount.trim() !== "" ||
    sortBy !== "newest";

  const clearAdvancedFilters = () => {
    setFromDate("");
    setToDate("");
    setTypeFilter("all");
    setMinAmount("");
    setMaxAmount("");
    setSortBy("newest");
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = advancedFiltered.filter((o) => {
      if (statusTab === "live") {
        if (o.status === "Settled" || o.status === "Rejected") return false;
      } else if (statusTab !== "all" && o.status !== statusTab) {
        return false;
      }
      if (!q) return true;
      const outletLabel =
        outlets.find((out) => out.id === o.outletId)?.name?.toLowerCase() ?? "";
      return (
        String(o.orderNo ?? "").toLowerCase().includes(q) ||
        String(o.guest ?? "").toLowerCase().includes(q) ||
        String(o.ref ?? "").toLowerCase().includes(q) ||
        outletLabel.includes(q)
      );
    });

    const sorted = [...rows];
    sorted.sort((a, b) => {
      if (sortBy === "amount-high") return Number(b.amount ?? 0) - Number(a.amount ?? 0);
      if (sortBy === "amount-low") return Number(a.amount ?? 0) - Number(b.amount ?? 0);
      const aTime = new Date(a.createdAt ?? 0).getTime() || 0;
      const bTime = new Date(b.createdAt ?? 0).getTime() || 0;
      if (sortBy === "oldest") return aTime - bTime;
      return bTime - aTime;
    });
    return sorted;
  }, [advancedFiltered, statusTab, search, outlets, sortBy]);

  /** Live board always shows active pipeline statuses only. */
  const boardOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return advancedFiltered.filter((o) => {
      if (o.status === "Settled" || o.status === "Rejected") return false;
      if (!BOARD_COLUMNS.some((c) => c.id === o.status)) return false;
      if (!q) return true;
      const outletLabel =
        outlets.find((out) => out.id === o.outletId)?.name?.toLowerCase() ?? "";
      return (
        String(o.orderNo ?? "").toLowerCase().includes(q) ||
        String(o.guest ?? "").toLowerCase().includes(q) ||
        String(o.ref ?? "").toLowerCase().includes(q) ||
        outletLabel.includes(q)
      );
    });
  }, [advancedFiltered, search, outlets]);

  const byBoardStatus = useMemo(() => {
    const map: Record<string, FbOrder[]> = {
      Pending: [],
      Preparing: [],
      Ready: [],
      Served: [],
    };
    for (const o of boardOrders) {
      if (map[o.status]) map[o.status].push(o);
    }
    return map;
  }, [boardOrders]);

  const formTables = useMemo(() => {
    const oid = formOutletId || outletId;
    if (!oid) return tables;
    return tables.filter((t) => !t.outletId || t.outletId === oid);
  }, [tables, formOutletId, outletId]);

  const selected = useMemo(
    () => (selectedId ? (orders.find((o) => o.id === selectedId) ?? null) : null),
    [orders, selectedId],
  );

  const formTotal = formLines.reduce((s, l) => s + l.qty * l.price, 0);

  const resetCreateForm = () => {
    setFormOutletId(outletId || outlets[0]?.id || "");
    setFormType("Dine In");
    setFormGuest("");
    setFormRef("");
    setFormLines([]);
    setAddItemId("");
    setFormError(null);
  };

  const openCreate = () => {
    resetCreateForm();
    setCreateOpen(true);
  };

  const addLine = () => {
    const item = menuItems.find((m) => m.id === addItemId);
    if (!item) {
      setFormError("Select a menu item to add.");
      return;
    }
    setFormLines((prev) => {
      const existing = prev.find((l) => l.name === item.name);
      if (existing) {
        return prev.map((l) =>
          l.name === item.name ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      return [
        ...prev,
        { name: item.name, qty: 1, price: Number(item.price ?? 0) },
      ];
    });
    setAddItemId("");
    setFormError(null);
  };

  const createOrder = async () => {
    const targetOutlet = formOutletId || outletId;
    if (!targetOutlet) {
      setFormError("Select an outlet first.");
      return;
    }
    if (!formGuest.trim()) {
      setFormError("Guest name is required.");
      return;
    }
    if (!formLines.length) {
      setFormError("Add at least one menu item.");
      return;
    }
    try {
      setSaving(true);
      setFormError(null);
      const created = await fbOrderService.create({
        outletId: targetOutlet,
        type: formType,
        ref: formRef.trim() || (formType === "Dine In" ? "Walk-in" : "Counter"),
        guest: formGuest.trim(),
        lines: formLines.map((l) => ({ name: l.name, qty: l.qty })),
        amount: formTotal,
        status: "Pending",
        placedAt: nowTime(),
        server: currentUser.name,
      });
      setOrders((prev) => [created, ...prev]);
      setCreateOpen(false);
      resetCreateForm();
      setStatusTab("live");
      setLayout("card");
      setToast(`${created.orderNo} created`);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to create order");
    } finally {
      setSaving(false);
    }
  };

  const advance = async (order: FbOrder) => {
    if (!nextStatus[order.status as FbOrderStatus]) return;
    try {
      const updated = await fbOrderService.advance(order.id);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
      if (updated.status === "Settled") {
        setSelectedId(null);
        setToast(`${order.orderNo} settled`);
      } else {
        setToast(`${order.orderNo} → ${updated.status}`);
      }
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to advance");
    }
  };

  const outletName = (id?: string) =>
    outlets.find((o) => o.id === (id || outletId))?.name ??
    (outletId ? "Outlet" : "All outlets");

  const createOutletLabel =
    outlets.find((o) => o.id === (formOutletId || outletId))?.name ?? "Select outlet";

  if (loading || outletsLoading) {
    return (
      <ModulePageShell
        eyebrow="Restaurants"
        title="Orders"
        description="Open checks across dine-in, takeaway, room service, and online."
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
        title="Orders"
        description="Open checks across dine-in, takeaway, room service, and online."
        wrapChildren={false}
      >
        <p className="text-sm text-red-600">{error}</p>
      </ModulePageShell>
    );
  }

  return (
    <ModulePageShell
      eyebrow="Restaurants"
      title="Orders"
      description="Open checks across dine-in, takeaway, room service, and online."
      toast={toast}
      onDismissToast={() => setToast(null)}
      wrapChildren={false}
      actionButtons={
        <div
          className="flex h-9 overflow-hidden rounded-lg border border-slate-200 bg-white p-0.5"
          role="tablist"
          aria-label="Display layout"
        >
          <button
            type="button"
            role="tab"
            aria-selected={layout === "card"}
            onClick={() => setLayout("card")}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-md px-3 text-xs font-medium transition",
              layout === "card"
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50",
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Cards
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={layout === "list"}
            onClick={() => setLayout("list")}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-md px-3 text-xs font-medium transition",
              layout === "list"
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50",
            )}
          >
            <List className="h-3.5 w-3.5" />
            List
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={layout === "board"}
            onClick={() => {
              setLayout("board");
              setStatusTab("live");
            }}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-md px-3 text-xs font-medium transition",
              layout === "board"
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50",
            )}
          >
            <Columns3 className="h-3.5 w-3.5" />
            Board
          </button>
        </div>
      }
      primaryAction={{ label: "Create Order", onClick: openCreate }}
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
      searchPlaceholder="Search order, table, guest, or outlet…"
      hasActiveAdvancedFilters={hasAdvancedFilters}
      onClearAdvancedFilters={clearAdvancedFilters}
      advancedFilters={
        <>
          <FormField label="From date">
            <FODatePicker
              value={fromDate}
              placeholder="From"
              onChange={(value) => {
                setFromDate(value);
                if (toDate && value && value > toDate) setToDate(value);
              }}
            />
          </FormField>
          <FormField label="To date">
            <FODatePicker
              value={toDate}
              placeholder="To"
              onChange={(value) => {
                setToDate(value);
                if (fromDate && value && value < fromDate) setFromDate(value);
              }}
            />
          </FormField>
          <FormField label="Order type">
            <SelectInput
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All types</option>
              {ORDER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Min amount (₹)">
            <TextInput
              type="number"
              min={0}
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="e.g. 100"
            />
          </FormField>
          <FormField label="Max amount (₹)">
            <TextInput
              type="number"
              min={0}
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              placeholder="e.g. 2000"
            />
          </FormField>
          <FormField label="Sort by">
            <SelectInput
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortId)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="amount-high">Price: high to low</option>
              <option value="amount-low">Price: low to high</option>
            </SelectInput>
          </FormField>
        </>
      }
      resultCount={{ shown: filtered.length, total: advancedFiltered.length }}
      stats={[
        {
          label: "Open",
          value: openCount,
          accent: "#d97706",
          sublabel: "Active checks",
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
          sublabel: "Pickup",
        },
        {
          label: "Settled",
          value: counts.Settled,
          accent: "#15803d",
          sublabel: "Paid bills",
        },
      ]}
      aboveTable={
        layout === "board" ? undefined : (
        <div
          className="inline-flex w-full gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm scrollbar-none"
          role="tablist"
          aria-label="Order status filter"
        >
          {STATUS_TABS.map((tab) => {
            const active = statusTab === tab.id;
            const count =
              tab.id === "all"
                ? counts.all
                : tab.id === "live"
                  ? counts.live
                  : counts[tab.id as keyof typeof counts];
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
        )
      }
    >
      <>
      {layout === "board" ? (
        <div className="grid gap-3 lg:grid-cols-4">
          {BOARD_COLUMNS.map((col) => (
            <section
              key={col.id}
              className={cn(
                "flex min-h-[28rem] flex-col rounded-xl border p-3",
                col.accent,
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">{col.label}</h2>
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                  {byBoardStatus[col.id]?.length ?? 0}
                </span>
              </div>
              <ul className="flex flex-1 flex-col gap-2">
                {(byBoardStatus[col.id] ?? []).map((order) => (
                  <li key={order.id}>
                    <OrderCard
                      order={order}
                      outletLabel={!outletId ? outletName(order.outletId) : undefined}
                      selected={selectedId === order.id}
                      onSelect={() => setSelectedId(order.id)}
                      onAdvance={() => advance(order)}
                    />
                  </li>
                ))}
                {(byBoardStatus[col.id] ?? []).length === 0 && (
                  <li className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-200 py-8 text-xs text-slate-400">
                    Empty
                  </li>
                )}
              </ul>
            </section>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <p className="text-sm text-slate-500">No orders in this status.</p>
          <Button
            type="button"
            size="sm"
            className="mt-3 gap-1 bg-emerald-700 hover:bg-emerald-800"
            onClick={openCreate}
          >
            <Plus className="h-3.5 w-3.5" />
            Create Order
          </Button>
        </div>
      ) : layout === "card" ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              outletLabel={!outletId ? outletName(order.outletId) : undefined}
              selected={selectedId === order.id}
              onSelect={() => setSelectedId(order.id)}
              onAdvance={() => advance(order)}
            />
          ))}
        </div>
      ) : (
        <OrderListTable
          orders={filtered}
          showOutlet={!outletId}
          outletName={outletName}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAdvance={advance}
        />
      )}

      <Drawer
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          resetCreateForm();
        }}
        title="Create Order"
        description={`${createOutletLabel} · New check`}
        width="md"
        footer={
          <div className="flex w-full gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setCreateOpen(false);
                resetCreateForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 bg-emerald-700 hover:bg-emerald-800"
              disabled={saving}
              onClick={() => void createOrder()}
            >
              {saving ? "Creating…" : "Create Order"}
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
          <FormField label="Outlet" required>
            <SelectInput
              value={formOutletId || outletId}
              onChange={(e) => {
                setFormOutletId(e.target.value);
                setFormRef("");
              }}
            >
              {!outletId && !formOutletId && (
                <option value="">Select outlet</option>
              )}
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Order type" required>
            <SelectInput
              value={formType}
              onChange={(e) =>
                setFormType(e.target.value as (typeof ORDER_TYPES)[number])
              }
            >
              {ORDER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Guest" required>
            <TextInput
              value={formGuest}
              onChange={(e) => setFormGuest(e.target.value)}
              placeholder="Guest name"
            />
          </FormField>
          <FormField
            label={formType === "Dine In" ? "Table" : "Reference"}
            helperText={
              formType === "Dine In"
                ? "Select table or type a ref"
                : "Room no / counter / channel"
            }
          >
            {formType === "Dine In" && formTables.length > 0 ? (
              <SelectInput
                value={formRef}
                onChange={(e) => setFormRef(e.target.value)}
              >
                <option value="">Select table</option>
                {formTables.map((t) => (
                  <option key={t.id} value={t.tableNo}>
                    {t.tableNo}
                    {t.status ? ` · ${t.status}` : ""}
                  </option>
                ))}
              </SelectInput>
            ) : (
              <TextInput
                value={formRef}
                onChange={(e) => setFormRef(e.target.value)}
                placeholder={
                  formType === "Room Service" ? "e.g. Room 501" : "e.g. Counter"
                }
              />
            )}
          </FormField>

          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-600">
              Items <span className="text-red-500">*</span>
            </p>
            <div className="flex gap-2">
              <SelectInput
                value={addItemId}
                onChange={(e) => setAddItemId(e.target.value)}
                className="flex-1"
              >
                <option value="">Select menu item</option>
                {menuItems.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.price != null ? ` · ${formatINR(Number(m.price))}` : ""}
                  </option>
                ))}
              </SelectInput>
              <Button
                type="button"
                variant="outline"
                className="shrink-0 gap-1"
                onClick={addLine}
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>
            <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
              {formLines.map((line) => (
                <li
                  key={line.name}
                  className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{line.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {formatINR(line.price)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={line.qty}
                      onChange={(e) => {
                        const qty = Math.max(1, Number(e.target.value) || 1);
                        setFormLines((prev) =>
                          prev.map((l) =>
                            l.name === line.name ? { ...l, qty } : l,
                          ),
                        );
                      }}
                      className="h-8 w-14 rounded-lg border border-slate-200 px-2 text-center text-sm"
                    />
                    <span className="w-16 text-right text-xs font-semibold text-emerald-800">
                      {formatINR(line.qty * line.price)}
                    </span>
                    <button
                      type="button"
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      onClick={() =>
                        setFormLines((prev) =>
                          prev.filter((l) => l.name !== line.name),
                        )
                      }
                      aria-label={`Remove ${line.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
              {formLines.length === 0 && (
                <li className="px-3 py-6 text-center text-xs text-slate-400">
                  No items added yet
                </li>
              )}
            </ul>
            <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <span className="text-sm font-medium text-emerald-900">Total</span>
              <span className="text-base font-bold text-emerald-900">
                {formatINR(formTotal)}
              </span>
            </div>
          </div>
        </div>
      </Drawer>

      <Drawer
        open={!!selected}
        onClose={() => setSelectedId(null)}
        title={selected?.orderNo ?? "Order"}
        description={selected ? `${selected.type} · ${selected.ref}` : undefined}
        width="md"
        footer={
          selected && nextStatus[selected.status as FbOrderStatus] ? (
            <Button
              type="button"
              className="w-full bg-emerald-700 hover:bg-emerald-800"
              onClick={() => advance(selected)}
            >
              Move to {nextStatus[selected.status as FbOrderStatus]}
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
                  statusBadge[selected.status as FbOrderStatus] ??
                    statusBadge.Pending,
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
              <Detail label="Server" value={selected.server || "—"} />
              <Detail label="Placed" value={selected.placedAt || "—"} />
              <Detail label="Outlet" value={outletName(selected.outletId)} />
              <Detail
                label="Items"
                value={String(
                  (selected.lines ?? []).reduce((n, l) => n + Number(l.qty ?? 0), 0),
                )}
              />
              <Detail
                label="Prep time"
                value={
                  selected.prepMinutes != null
                    ? `~${selected.prepMinutes} min`
                    : "—"
                }
              />
              {selected.status === "Settled" && (
                <>
                  <Detail
                    label="Payment"
                    value={selected.paymentMode || "—"}
                  />
                  <Detail label="Paid at" value={selected.paidAt || "—"} />
                </>
              )}
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
              </ul>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
              <span className="text-sm font-medium text-emerald-900">Order total</span>
              <span className="text-lg font-bold text-emerald-900">
                {formatINR(Number(selected.amount ?? 0))}
              </span>
            </div>
          </div>
        )}
      </Drawer>
      </>
    </ModulePageShell>
  );
}

function OrderListTable({
  orders,
  showOutlet,
  outletName,
  selectedId,
  onSelect,
  onAdvance,
}: {
  orders: FbOrder[];
  showOutlet: boolean;
  outletName: (id?: string) => string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdvance: (order: FbOrder) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2.5">Order</th>
              <th className="px-3 py-2.5">Type / Ref</th>
              <th className="px-3 py-2.5">Guest</th>
              {showOutlet && <th className="px-3 py-2.5">Outlet</th>}
              <th className="px-3 py-2.5">Items</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5">Prep</th>
              <th className="px-3 py-2.5">Placed</th>
              <th className="px-3 py-2.5 text-right">Amount</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => {
              const itemCount = (order.lines ?? []).reduce(
                (n, l) => n + Number(l.qty ?? 0),
                0,
              );
              return (
                <tr
                  key={order.id}
                  className={cn(
                    "cursor-pointer transition hover:bg-emerald-50/40",
                    selectedId === order.id && "bg-emerald-50/60",
                  )}
                  onClick={() => onSelect(order.id)}
                >
                  <td className="px-3 py-2.5 font-semibold text-slate-900">
                    {order.orderNo}
                    {order.status === "Rejected" && order.rejectReason && (
                      <p className="mt-0.5 max-w-[12rem] truncate text-[10px] font-normal text-red-600">
                        {order.rejectReason}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">
                    {order.type}
                    <span className="text-slate-400"> · </span>
                    {order.ref || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-slate-800">{order.guest || "—"}</td>
                  {showOutlet && (
                    <td className="px-3 py-2.5 text-slate-600">
                      {outletName(order.outletId)}
                    </td>
                  )}
                  <td className="px-3 py-2.5 text-slate-600">{itemCount}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        statusBadge[order.status as FbOrderStatus] ??
                          statusBadge.Pending,
                      )}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">
                    {order.prepMinutes != null ? `~${order.prepMinutes}m` : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-slate-500">
                    {order.placedAt || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-emerald-800">
                    {formatINR(Number(order.amount ?? 0))}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {nextStatus[order.status as FbOrderStatus] && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 px-2 text-[11px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAdvance(order);
                        }}
                      >
                        {nextStatus[order.status as FbOrderStatus]}
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  outletLabel,
  selected,
  onSelect,
  onAdvance,
}: {
  order: FbOrder;
  outletLabel?: string;
  selected: boolean;
  onSelect: () => void;
  onAdvance: () => void;
}) {
  const lines = order.lines ?? [];
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
        "flex cursor-pointer flex-col rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md",
        selected && "border-emerald-400 ring-1 ring-emerald-200",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-slate-900">{order.orderNo}</p>
          <p className="text-[11px] text-slate-500">
            {order.type} · {order.ref || "—"}
            {outletLabel ? ` · ${outletLabel}` : ""}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
            statusBadge[order.status as FbOrderStatus] ?? statusBadge.Pending,
          )}
        >
          {order.status}
        </span>
      </div>
      <p className="mt-2 text-xs font-medium text-slate-800">{order.guest || "Guest"}</p>
      {order.status === "Rejected" && (
        <p className="mt-1.5 rounded-lg bg-red-50 px-2 py-1.5 text-[11px] text-red-700">
          <span className="font-semibold">Rejected: </span>
          {order.rejectReason?.trim() || "No reason provided"}
        </p>
      )}
      {order.prepMinutes != null && order.status !== "Rejected" && (
          <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-orange-700">
            <Clock className="h-3 w-3" />
            Prep ~{order.prepMinutes} min
          </p>
        )}
      <ul className="mt-2 flex-1 space-y-0.5 border-t border-slate-100 pt-2">
        {lines.slice(0, 3).map((line) => (
          <li key={`${order.id}-${line.name}`} className="text-[11px] text-slate-600">
            {line.qty}× {line.name}
          </li>
        ))}
        {lines.length > 3 && (
          <li className="text-[11px] text-slate-400">+{lines.length - 3} more</li>
        )}
        {lines.length === 0 && (
          <li className="text-[11px] text-slate-400">No items</li>
        )}
      </ul>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
        <div>
          <p className="text-sm font-bold text-emerald-800">
            {formatINR(Number(order.amount ?? 0))}
          </p>
          <p className="inline-flex items-center gap-1 text-[10px] text-slate-400">
            <Clock className="h-3 w-3" />
            {order.placedAt || "—"}
          </p>
        </div>
        {nextStatus[order.status as FbOrderStatus] && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1 px-2.5 text-[11px]"
            onClick={(e) => {
              e.stopPropagation();
              onAdvance();
            }}
          >
            {nextStatus[order.status as FbOrderStatus]}
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
