"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Minus,
  Percent,
  Plus,
  Receipt,
  ShoppingCart,
  Tag,
  Trash2,
} from "lucide-react";
import type { PosMenuItem } from "@/app/data/frontoffice/modules";
import { reservationService, type InHouseGuestDto } from "@/services/front-office";
import {
  fbOrderService,
  menuItemService,
  type FbOrder,
} from "@/services/food-beverages";
import { Button } from "@/components/ui/Button";
import {
  AlertBanner,
  FormField,
  FOPageHeader,
  SearchInput,
  SelectInput,
  StatMiniCard,
  SummaryRow,
  TextInput,
  formatINR,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";

interface OrderLine {
  id: string;
  name: string;
  qty: number;
  price: number;
}

const tables = ["Table 1", "Table 2", "Table 3", "Table 5", "Table 8", "Table 12"];
const GST_RATE = 0.18;
const PAYMENT_MODES = ["Cash", "Card", "UPI", "Room Charge"] as const;

type PosMode = "new" | "collect";

function mapMenuItem(raw: Record<string, unknown>): PosMenuItem | null {
  const id = String(raw.id ?? raw._id ?? "");
  const name = String(raw.name ?? raw.itemName ?? "");
  const price = Number(raw.price ?? raw.sellingPrice ?? raw.amount ?? 0);
  if (!id || !name) return null;
  return {
    id,
    name,
    category: String(raw.category ?? raw.categoryName ?? "General"),
    price,
  };
}

export function PosBillingView() {
  const [mode, setMode] = useState<PosMode>("collect");
  const [billingType, setBillingType] = useState<"walk-in" | "in-house">("walk-in");
  const [tableOrRoom, setTableOrRoom] = useState(tables[3]);
  const [menuSearch, setMenuSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState<OrderLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);
  const [settled, setSettled] = useState(false);
  const [inHouseGuests, setInHouseGuests] = useState<InHouseGuestDto[]>([]);
  const [posMenuItems, setPosMenuItems] = useState<PosMenuItem[]>([]);
  const [billableOrders, setBillableOrders] = useState<FbOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [paymentMode, setPaymentMode] =
    useState<(typeof PAYMENT_MODES)[number]>("Cash");
  const [paying, setPaying] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadBillable = async () => {
    const all = await fbOrderService.list().catch(() => [] as FbOrder[]);
    const open = all.filter((o) => o.status === "Served");
    setBillableOrders(open);
    setSelectedOrderId((prev) =>
      prev && open.some((o) => o.id === prev) ? prev : open[0]?.id ?? "",
    );
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [guests, menuRaw] = await Promise.all([
          reservationService.inHouse().catch(() => [] as InHouseGuestDto[]),
          menuItemService.list().catch(() => [] as Record<string, unknown>[]),
          loadBillable(),
        ]);
        if (cancelled) return;
        setInHouseGuests(guests);
        setPosMenuItems(
          (menuRaw as Record<string, unknown>[])
            .map(mapMenuItem)
            .filter((x): x is PosMenuItem => !!x),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedOrder = useMemo(
    () => billableOrders.find((o) => o.id === selectedOrderId) ?? null,
    [billableOrders, selectedOrderId],
  );

  const filteredMenu = useMemo(() => {
    const q = menuSearch.toLowerCase();
    return posMenuItems.filter((item) => {
      const matchesCat = category === "all" || item.category === category;
      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [menuSearch, category, posMenuItems]);

  const categories = useMemo(
    () => ["all", ...new Set(posMenuItems.map((m) => m.category))],
    [posMenuItems],
  );

  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const gst = Math.round((subtotal - discount) * GST_RATE);
  const total = subtotal - discount + gst;

  const collectAmount = Number(selectedOrder?.amount ?? 0);

  const addToCart = (item: PosMenuItem) => {
    setSettled(false);
    setCart((prev) => {
      const existing = prev.find((l) => l.id === item.id);
      if (existing) {
        return prev.map((l) =>
          l.id === item.id ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      return [...prev, { id: item.id, name: item.name, qty: 1, price: item.price }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    );
  };

  const removeLine = (id: string) => {
    setCart((prev) => prev.filter((l) => l.id !== id));
  };

  const handleSettle = () => {
    if (cart.length === 0) return;
    setSettled(true);
    const target =
      billingType === "in-house" ? `Room ${tableOrRoom}` : tableOrRoom;
    setToast(`Bill of ${formatINR(total)} settled for ${target}.`);
    setCart([]);
    setDiscount(0);
  };

  const handleTransferToRoom = () => {
    if (cart.length === 0) return;
    setSettled(true);
    setToast(`${formatINR(total)} transferred to ${tableOrRoom} folio.`);
    setCart([]);
    setDiscount(0);
  };

  const handleCollectPayment = async () => {
    if (!selectedOrder) return;
    try {
      setPaying(true);
      setToastError(null);
      const paid = await fbOrderService.pay(selectedOrder.id, {
        paymentMode,
      });
      setToast(
        `${paid.orderNo} paid · ${formatINR(Number(paid.amount ?? 0))} via ${paymentMode}`,
      );
      setSettled(true);
      await loadBillable();
    } catch (e) {
      setToastError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const roomOptions = inHouseGuests.map((g) => `${g.room} — ${g.guestName}`);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading POS…</p>;
  }

  return (
    <div className="space-y-5">
      {toast && (
        <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />
      )}
      {toastError && (
        <AlertBanner
          variant="error"
          message={toastError}
          onDismiss={() => setToastError(null)}
        />
      )}

      <FOPageHeader
        eyebrow="Food & Beverages"
        title="POS Billing"
        description="Collect payment on Served orders, or build a walk-in bill."
        badge={
          <div
            className="flex h-9 overflow-hidden rounded-lg border border-slate-200 bg-white p-0.5"
            role="tablist"
          >
            {(
              [
                { id: "collect" as const, label: "Collect payment" },
                { id: "new" as const, label: "New bill" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={mode === opt.id}
                onClick={() => setMode(opt.id)}
                className={cn(
                  "rounded-md px-3 text-xs font-semibold transition",
                  mode === opt.id
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        }
      />

      {mode === "collect" ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatMiniCard
              label="Ready to pay"
              value={billableOrders.length}
              icon={Receipt}
              accent="#0369a1"
            />
            <StatMiniCard
              label="Selected"
              value={selectedOrder?.orderNo ?? "—"}
              icon={ShoppingCart}
            />
            <StatMiniCard
              label="Guest"
              value={selectedOrder?.guest ?? "—"}
              icon={Tag}
            />
            <StatMiniCard
              label="Amount"
              value={formatINR(collectAmount)}
              accent="#15803d"
              icon={Banknote}
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-5">
            <div className="space-y-3 lg:col-span-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Kitchen-closed orders
                  </h2>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void loadBillable()}
                  >
                    Refresh
                  </Button>
                </div>
                <p className="mb-3 text-xs text-slate-500">
                  Orders marked Served on Restaurants → Orders appear here for
                  settlement.
                </p>
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {billableOrders.map((order) => {
                    const active = order.id === selectedOrderId;
                    return (
                      <li key={order.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedOrderId(order.id)}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition",
                            active ? "bg-emerald-50" : "hover:bg-slate-50",
                          )}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">
                              {order.orderNo}
                            </p>
                            <p className="truncate text-[11px] text-slate-500">
                              {order.type} · {order.ref || "—"} · {order.guest}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-emerald-800">
                              {formatINR(Number(order.amount ?? 0))}
                            </p>
                            <p className="text-[10px] font-semibold text-sky-700">
                              {order.status}
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                  {billableOrders.length === 0 && (
                    <li className="px-3 py-10 text-center text-sm text-slate-500">
                      No Served orders yet. Mark Served on Orders after kitchen Ready.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <Banknote className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Collect payment
                </h2>
              </div>

              {selectedOrder ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedOrder.orderNo}
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedOrder.guest} · {selectedOrder.type} ·{" "}
                      {selectedOrder.ref || "—"}
                    </p>
                  </div>

                  <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
                    {(selectedOrder.lines ?? []).map((line) => (
                      <li
                        key={`${selectedOrder.id}-${line.name}`}
                        className="flex justify-between px-3 py-2"
                      >
                        <span>
                          {line.qty}× {line.name}
                        </span>
                      </li>
                    ))}
                    {(selectedOrder.lines ?? []).length === 0 && (
                      <li className="px-3 py-4 text-center text-xs text-slate-400">
                        No line items
                      </li>
                    )}
                  </ul>

                  <div className="divide-y divide-slate-100 rounded-lg border border-slate-100 px-3">
                    <SummaryRow
                      label="Order total"
                      value={formatINR(collectAmount)}
                      highlight
                    />
                  </div>

                  <FormField label="Payment mode" required>
                    <SelectInput
                      value={paymentMode}
                      onChange={(e) =>
                        setPaymentMode(
                          e.target.value as (typeof PAYMENT_MODES)[number],
                        )
                      }
                    >
                      {PAYMENT_MODES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>

                  <Button
                    className="w-full bg-emerald-700 hover:bg-emerald-800"
                    disabled={paying}
                    onClick={() => void handleCollectPayment()}
                  >
                    {paying
                      ? "Collecting…"
                      : `Collect ${formatINR(collectAmount)}`}
                  </Button>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Receipt className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    Select an order to collect payment
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatMiniCard label="Subtotal" value={formatINR(subtotal)} icon={Receipt} />
            <StatMiniCard label="GST (18%)" value={formatINR(gst)} icon={Percent} />
            <StatMiniCard
              label="Discount"
              value={formatINR(discount)}
              accent="#f59e0b"
              icon={Tag}
            />
            <StatMiniCard
              label="Total"
              value={formatINR(total)}
              accent="#15803d"
              icon={ShoppingCart}
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">
                      Billing Type
                    </label>
                    <div className="flex rounded-xl bg-slate-100/80 p-1">
                      {(
                        [
                          { id: "walk-in" as const, label: "Walk-in" },
                          { id: "in-house" as const, label: "In-house Guest" },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setBillingType(opt.id);
                            setTableOrRoom(
                              opt.id === "in-house" ? roomOptions[0] : tables[3],
                            );
                          }}
                          className={cn(
                            "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
                            billingType === opt.id
                              ? "bg-white text-emerald-700 shadow-sm"
                              : "text-slate-600",
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <FormField
                    label={billingType === "in-house" ? "Room / Guest" : "Table"}
                  >
                    <SelectInput
                      value={tableOrRoom}
                      onChange={(e) => setTableOrRoom(e.target.value)}
                      className="min-w-[180px]"
                    >
                      {(billingType === "in-house" ? roomOptions : tables).map(
                        (opt) => (
                          <option key={opt}>{opt}</option>
                        ),
                      )}
                    </SelectInput>
                  </FormField>
                </div>

                <SearchInput
                  value={menuSearch}
                  onChange={setMenuSearch}
                  placeholder="Search menu items…"
                  className="mb-3"
                />

                <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
                        category === cat
                          ? "bg-emerald-700 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                      )}
                    >
                      {cat === "all" ? "All Items" : cat}
                    </button>
                  ))}
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {filteredMenu.length === 0 ? (
                    <p className="col-span-full rounded-lg border border-dashed border-slate-200 px-3 py-8 text-center text-sm text-slate-500">
                      No menu items from database yet.
                    </p>
                  ) : (
                    filteredMenu.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => addToCart(item)}
                        className="flex items-center justify-between rounded-lg border border-slate-100 p-3 text-left transition-colors hover:border-emerald-200 hover:bg-emerald-50/40"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-500">{item.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-emerald-700">
                            {formatINR(item.price)}
                          </span>
                          <Plus className="h-4 w-4 text-emerald-600" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Current Order
                </h2>
              </div>

              {cart.length > 0 ? (
                <div className="space-y-3">
                  {cart.map((line) => (
                    <div
                      key={line.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {line.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatINR(line.price)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQty(line.id, -1)}
                          className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">
                          {line.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(line.id, 1)}
                          className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-20 text-right text-sm font-semibold">
                          {formatINR(line.price * line.qty)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeLine(line.id)}
                          className="rounded-md p-1 text-red-400 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <FormField label="Discount (₹)">
                    <TextInput
                      type="number"
                      min="0"
                      value={discount || ""}
                      onChange={(e) =>
                        setDiscount(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormField>

                  <div className="divide-y divide-slate-100 rounded-lg border border-slate-100 px-3">
                    <SummaryRow label="Subtotal" value={formatINR(subtotal)} />
                    <SummaryRow label="Discount" value={formatINR(discount)} />
                    <SummaryRow label="GST @ 18%" value={formatINR(gst)} />
                    <SummaryRow label="Total" value={formatINR(total)} highlight />
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      className="w-full bg-emerald-700 hover:bg-emerald-800"
                      onClick={handleSettle}
                    >
                      Settle Bill — {formatINR(total)}
                    </Button>
                    {billingType === "walk-in" && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setBillingType("in-house");
                          setTableOrRoom(roomOptions[0]);
                          handleTransferToRoom();
                        }}
                      >
                        Transfer to Room
                      </Button>
                    )}
                    {billingType === "in-house" && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleTransferToRoom}
                      >
                        Post to Room Folio
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <ShoppingCart className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    {settled ? "Bill settled successfully" : "Cart is empty"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Tap menu items to add to the order
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
