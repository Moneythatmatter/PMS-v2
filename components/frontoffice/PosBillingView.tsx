"use client";

import { useMemo, useState } from "react";
import { Minus, Percent, Plus, Receipt, ShoppingCart, Tag, Trash2 } from "lucide-react";
import { inHouseGuests, posMenuItems } from "@/app/data";
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

export function PosBillingView() {
  const [billingType, setBillingType] = useState<"walk-in" | "in-house">("walk-in");
  const [tableOrRoom, setTableOrRoom] = useState(tables[3]);
  const [menuSearch, setMenuSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState<OrderLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [settled, setSettled] = useState(false);

  const filteredMenu = useMemo(() => {
    const q = menuSearch.toLowerCase();
    return posMenuItems.filter((item) => {
      const matchesCat = category === "all" || item.category === category;
      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [menuSearch, category]);

  const categories = useMemo(
    () => ["all", ...new Set(posMenuItems.map((m) => m.category))],
    [],
  );

  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const gst = Math.round((subtotal - discount) * GST_RATE);
  const total = subtotal - discount + gst;

  const addToCart = (item: (typeof posMenuItems)[0]) => {
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
      billingType === "in-house"
        ? `Room ${tableOrRoom}`
        : tableOrRoom;
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

  const roomOptions = inHouseGuests.map((g) => `${g.room} — ${g.guestName}`);

  return (
    <div className="space-y-5">
      {toast && (
        <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />
      )}

      <FOPageHeader
        eyebrow="Food & Beverages"
        title="POS Billing"
        description="Restaurant billing for walk-in customers or in-house guests."
        badge={
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            <ShoppingCart className="h-3.5 w-3.5" />
            {cart.length} items in cart
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatMiniCard label="Subtotal" value={formatINR(subtotal)} icon={Receipt} />
        <StatMiniCard label="GST (18%)" value={formatINR(gst)} icon={Percent} />
        <StatMiniCard label="Discount" value={formatINR(discount)} accent="#f59e0b" icon={Tag} />
        <StatMiniCard label="Total" value={formatINR(total)} accent="#2563eb" icon={ShoppingCart} />
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
                  {[
                    { id: "walk-in" as const, label: "Walk-in" },
                    { id: "in-house" as const, label: "In-house Guest" },
                  ].map((opt) => (
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
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-slate-600",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <FormField label={billingType === "in-house" ? "Room / Guest" : "Table"}>
                <SelectInput
                  value={tableOrRoom}
                  onChange={(e) => setTableOrRoom(e.target.value)}
                  className="min-w-[180px]"
                >
                  {(billingType === "in-house" ? roomOptions : tables).map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
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
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                  )}
                >
                  {cat === "all" ? "All Items" : cat}
                </button>
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {filteredMenu.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => addToCart(item)}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-3 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/40"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-blue-600">
                      {formatINR(item.price)}
                    </span>
                    <Plus className="h-4 w-4 text-blue-500" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-slate-900">Current Order</h2>
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
                    <span className="w-6 text-center text-sm font-medium">{line.qty}</span>
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
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
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
                  className="w-full bg-blue-600 hover:bg-blue-700"
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
    </div>
  );
}
