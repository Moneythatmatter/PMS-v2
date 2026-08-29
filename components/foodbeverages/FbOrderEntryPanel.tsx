"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  MessageSquare,
  Minus,
  Pause,
  Plus,
  Receipt,
  Search,
  SplitSquareHorizontal,
  Trash2,
  Truck,
  User,
  UtensilsCrossed,
} from "lucide-react";
import { formatINR } from "@/app/data/foodbeverages/ops";
import { currentUser } from "@/app/data";
import { posService, type LiveTable, type PosEntryMode } from "@/services/food-beverages";
import { guestService } from "@/services/front-office";
import {
  reservationService,
  type InHouseGuestDto,
} from "@/services/front-office/reservations";
import { Button } from "@/components/ui/Button";
import { FbOutletSelect } from "@/components/foodbeverages/FbOutletSelect";
import {
  FormField,
  FODatePicker,
  SelectInput,
  TextInput,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";
import {
  formatKotNumber,
  saveBillSlip,
  saveKotSlip,
  type KotPrintLine,
  type KotSlipParams,
} from "@/lib/food-beverages/print-slips";

const ORDER_TABS = ["Dine In", "Takeaway", "Room Service"] as const;
export type OrderTab = (typeof ORDER_TABS)[number];

export function normalizeOrderTab(value: string): OrderTab {
  if (value === "Takeaway" || value === "Online") return "Takeaway";
  if (value === "Room Service") return "Room Service";
  return "Dine In";
}

export type FbPosCategory = {
  id: string;
  name: string;
  code?: string;
};

export type FbPosMenuItem = {
  id: string;
  name: string;
  itemCode?: string;
  categoryId?: string;
  itemType?: string;
  isVegetarian?: boolean;
  price: number;
};

type CartLine = {
  id: string;
  name: string;
  qty: number;
  price: number;
};

type FbOutletOption = { id: string; name: string };

type WalkInGuestDetails = {
  name: string;
  phone: string;
  email: string;
  dob: string;
};

const emptyGuestDetails = (): WalkInGuestDetails => ({
  name: "",
  phone: "",
  email: "",
  dob: "",
});

async function saveWalkInGuestProfile(
  details: WalkInGuestDetails,
): Promise<{ id: string; guestNo?: string } | undefined> {
  const phone = details.phone.trim();
  const email = details.email.trim();
  const dob = details.dob.trim();
  const name = details.name.trim();

  if (!phone && !email && !dob && !name) return undefined;

  try {
    const created = await guestService.create({
      name: name || "Walk-in Guest",
      mobile: phone,
      email,
      dob,
      nationality: "Indian",
      totalStays: 0,
      loyaltyPoints: 0,
    });
    return { id: created.id, guestNo: created.guestNo };
  } catch {
    return undefined;
  }
}
const BASE_PAYMENT_MODES = ["Cash", "Card", "UPI"] as const;
const ROOM_CHARGE_MODE = "Room Charge";

const RUNNING_KOT_STATUSES = new Set(["PENDING", "PREPARING", "READY"]);

type RunningKot = {
  id: string;
  kotNo: string;
  status: string;
};

function parseRunningKots(kots: unknown[]): RunningKot[] {
  return (kots as Record<string, unknown>[])
    .filter((kot) =>
      RUNNING_KOT_STATUSES.has(String(kot.status ?? "").toUpperCase()),
    )
    .map((kot) => ({
      id: String(kot.id),
      kotNo: String(kot.kotNumber ?? kot.kot_number ?? kot.id),
      status: String(kot.status ?? "PENDING").toUpperCase(),
    }));
}

type Props = {
  outlets: FbOutletOption[];
  outletId: string;
  onOutletChange: (id: string) => void;
  categories: FbPosCategory[];
  menuItems: FbPosMenuItem[];
  tables: LiveTable[];
  onOrderCreated: () => void;
  onTablesRefresh?: () => void;
  onToast: (message: string) => void;
  className?: string;
  initialTableNo?: string;
  initialGuest?: string;
  initialOrderType?: OrderTab | "Online";
  lockTable?: boolean;
  liveTableId?: string;
  openOrderId?: string;
  openBillId?: string;
  entryMode?: PosEntryMode;
  onBack?: () => void;
};

export function FbOrderEntryPanel({
  outlets,
  outletId,
  onOutletChange,
  categories,
  menuItems,
  tables,
  onOrderCreated,
  onTablesRefresh,
  onToast,
  className,
  initialTableNo = "",
  initialGuest = "",
  initialOrderType = "Dine In",
  lockTable = false,
  liveTableId,
  openOrderId,
  openBillId,
  entryMode = "new",
  onBack,
}: Props) {
  const [activeOrderId, setActiveOrderId] = useState(openOrderId ?? "");
  const [activeBillId, setActiveBillId] = useState(openBillId ?? "");
  const [loadedOrderNo, setLoadedOrderNo] = useState("");
  const [runningKots, setRunningKots] = useState<RunningKot[]>([]);
  const [savedLines, setSavedLines] = useState<CartLine[]>([]);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [paymentMode, setPaymentMode] = useState<string>("Cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [itemSearch, setItemSearch] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [formType, setFormType] = useState<OrderTab>(
    normalizeOrderTab(initialOrderType),
  );
  const [formRef, setFormRef] = useState(initialTableNo);
  const [guestDetails, setGuestDetails] = useState<WalkInGuestDetails>(() => ({
    ...emptyGuestDetails(),
    name: initialGuest,
  }));
  const [showGuestDetails, setShowGuestDetails] = useState(false);
  const [pax, setPax] = useState("");
  const [inHouseGuests, setInHouseGuests] = useState<InHouseGuestDto[]>([]);
  const [selectedReservationId, setSelectedReservationId] = useState("");
  const [linkedGuestId, setLinkedGuestId] = useState("");
  const [linkedGuestNo, setLinkedGuestNo] = useState("");
  const [formLines, setFormLines] = useState<CartLine[]>([]);
  const [orderInstruction, setOrderInstruction] = useState("");
  const [showInstruction, setShowInstruction] = useState(false);
  const [isHeld, setIsHeld] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const activeOutletId = outletId;

  const outletLabel = (id?: string) =>
    outlets.find((o) => o.id === id)?.name ?? "";

  const formTables = useMemo(() => {
    if (!activeOutletId) return tables;
    return tables.filter((t) => !t.outletId || t.outletId === activeOutletId);
  }, [tables, activeOutletId]);

  const loadOrderDetails = async (orderId: string) => {
    setLoadingOrder(true);
    try {
      const data = await posService.getOrderDetails(orderId);
      setActiveOrderId(String(data.order.id));
      setLoadedOrderNo(String(data.order.orderNo ?? ""));
      setRunningKots(parseRunningKots(data.kots));
      if (data.order.ref) {
        setFormRef(String(data.order.ref));
      }
      if (data.order.type) {
        setFormType(normalizeOrderTab(String(data.order.type)));
      }
      if (data.order.guest) {
        setGuestDetails((g) => ({
          ...g,
          name: String(data.order.guest ?? g.name),
        }));
      }
      const items = (data.items as Record<string, unknown>[])
        .filter((row) => String(row.status ?? "ACTIVE").toUpperCase() === "ACTIVE")
        .map((row) => ({
        id: String(row.menuItemId ?? row.id ?? row.name),
        name: String(row.name ?? "Item"),
        qty: Number(row.quantity ?? 1),
        price: Number(row.unitPrice ?? 0),
      }));
      setSavedLines(items);
      const bills = data.bills as Record<string, unknown>[];
      const bill = bills?.[0];
      let total = Number(data.order.amount ?? 0);
      if (bill?.id) {
        setActiveBillId(String(bill.id));
        total = Number(bill.total ?? total);
      }
      setAmountPaid(String(total));
      return { items, total, order: data.order, bill };
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to load order");
      setRunningKots([]);
      return null;
    } finally {
      setLoadingOrder(false);
    }
  };

  useEffect(() => {
    if ((entryMode === "manage" || entryMode === "settle") && openOrderId) {
      void loadOrderDetails(openOrderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openOrderId, entryMode]);

  useEffect(() => {
    if (formType !== "Room Service") {
      setInHouseGuests([]);
      setSelectedReservationId("");
      setLinkedGuestId("");
      setLinkedGuestNo("");
      return;
    }

    let cancelled = false;
    reservationService
      .inHouse()
      .then((rows) => {
        if (!cancelled) setInHouseGuests(rows);
      })
      .catch(() => {
        if (!cancelled) setInHouseGuests([]);
      });

    return () => {
      cancelled = true;
    };
  }, [formType]);

  const filteredItems = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    const codeQ = shortCode.trim().toLowerCase();
    return menuItems.filter((item) => {
      if (selectedCategoryId !== "all" && item.categoryId !== selectedCategoryId) {
        return false;
      }
      if (codeQ && !String(item.itemCode ?? "").toLowerCase().includes(codeQ)) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        String(item.itemCode ?? "").toLowerCase().includes(q)
      );
    });
  }, [menuItems, selectedCategoryId, itemSearch, shortCode]);

  const formTotal = formLines.reduce((s, l) => s + l.qty * l.price, 0);
  const savedTotal = savedLines.reduce((s, l) => s + l.qty * l.price, 0);
  const orderTotal = savedTotal + formTotal;
  const itemCount = formLines.reduce((s, l) => s + l.qty, 0);
  const isManage = entryMode === "manage";
  const isSettle = entryMode === "settle";
  const isNew = entryMode === "new";
  const allDisplayLines = useMemo(
    () => [...savedLines, ...formLines],
    [savedLines, formLines],
  );
  const paymentModes = useMemo(
    () =>
      formType === "Room Service"
        ? [...BASE_PAYMENT_MODES, ROOM_CHARGE_MODE]
        : [...BASE_PAYMENT_MODES],
    [formType],
  );

  useEffect(() => {
    if (formType !== "Room Service" && paymentMode === ROOM_CHARGE_MODE) {
      setPaymentMode("Cash");
    }
  }, [formType, paymentMode]);
  const hasGuestDetails =
    !!guestDetails.name.trim() ||
    !!guestDetails.phone.trim() ||
    !!guestDetails.email.trim() ||
    !!guestDetails.dob.trim();

  const updateGuestField = (field: keyof WalkInGuestDetails, value: string) => {
    setGuestDetails((prev) => ({ ...prev, [field]: value }));
  };

  const selectInHouseGuest = (reservationId: string) => {
    setSelectedReservationId(reservationId);
    const guest = inHouseGuests.find((g) => g.id === reservationId);
    if (!guest) {
      setFormRef("");
      setLinkedGuestId("");
      setLinkedGuestNo("");
      return;
    }
    setFormRef(guest.room);
    setGuestDetails((prev) => ({ ...prev, name: guest.guestName }));
    setLinkedGuestId(guest.guestId ?? "");
    setLinkedGuestNo(guest.guestNo ?? "");
    const covers = (guest.adults ?? 0) + (guest.children ?? 0);
    if (covers > 0) setPax(String(covers));
  };

  const addItem = (item: FbPosMenuItem) => {
    if (isSettle) return;
    setFormLines((prev) => {
      const existing = prev.find((l) => l.id === item.id);
      if (existing) {
        return prev.map((l) =>
          l.id === item.id ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      return [
        ...prev,
        { id: item.id, name: item.name, qty: 1, price: item.price },
      ];
    });
    setFormError(null);
  };

  const updateQty = (id: string, delta: number) => {
    setFormLines((prev) =>
      prev
        .map((l) =>
          l.id === id ? { ...l, qty: Math.max(0, l.qty + delta) } : l,
        )
        .filter((l) => l.qty > 0),
    );
  };

  const removeLine = (id: string) => {
    setFormLines((prev) => prev.filter((l) => l.id !== id));
  };

  const clearCart = () => {
    setFormLines([]);
    setGuestDetails(emptyGuestDetails());
    setShowGuestDetails(false);
    setPax("");
    setSelectedReservationId("");
    setLinkedGuestId("");
    setLinkedGuestNo("");
    setFormRef("");
    setOrderInstruction("");
    setShowInstruction(false);
    setIsHeld(false);
    setFormError(null);
  };

  const placeOrder = async (options?: { print?: boolean }) => {
    if (!activeOutletId) {
      setFormError("Select an outlet first.");
      return;
    }
    if (!formLines.length) {
      setFormError("Add at least one item to the order.");
      return;
    }
    if (formType === "Room Service" && !selectedReservationId) {
      setFormError("Select an in-house guest for room service.");
      return;
    }
    try {
      setSaving(true);
      setFormError(null);

      const paxRaw = pax.trim();
      const paxCount = paxRaw ? Math.max(1, Number(paxRaw) || 0) : undefined;
      const tableRef =
        formRef.trim() ||
        (formType === "Dine In"
          ? "Walk-in"
          : formType === "Takeaway"
            ? "Counter"
            : "Delivery");
      const kotLines = [...formLines];
      const kotTotal = formTotal;
      const kotInstruction = orderInstruction.trim();
      const kotPrintLines: KotPrintLine[] = kotLines.map((l, index) => {
        const holdPrefix = isHeld ? "[HOLD] " : "";
        const note =
          index === 0 && (kotInstruction || isHeld)
            ? `${holdPrefix}${kotInstruction}`.trim()
            : undefined;
        return {
          name: l.name,
          qty: l.qty,
          ...(note ? { note } : {}),
        };
      });

      let guestName = guestDetails.name.trim() || "Walk-in";
      let guestId: string | undefined;
      let guestNo: string | undefined;
      let reservationId: string | undefined;

      if (formType === "Room Service") {
        reservationId = selectedReservationId;
        guestId = linkedGuestId || undefined;
        guestNo = linkedGuestNo || undefined;
        guestName =
          guestDetails.name.trim() ||
          inHouseGuests.find((g) => g.id === selectedReservationId)?.guestName ||
          "In-house Guest";
      } else {
        const saved = await saveWalkInGuestProfile(guestDetails);
        if (saved) {
          guestId = saved.id;
          guestNo = saved.guestNo;
        }
        guestName = guestDetails.name.trim() || "Walk-in";
      }

      const created = await posService.sendKot({
        outletId: activeOutletId,
        type: formType,
        ref: tableRef,
        ...(liveTableId ? { liveTableId } : {}),
        ...(activeOrderId ? { orderId: activeOrderId } : {}),
        guest: guestName,
        ...(guestId ? { guestId } : {}),
        ...(guestNo ? { guestNo } : {}),
        ...(reservationId ? { reservationId } : {}),
        ...(paxCount ? { pax: paxCount } : {}),
        server: currentUser.name,
        lines: kotLines.map((l, index) => {
          const holdPrefix = isHeld ? "[HOLD] " : "";
          const note =
            index === 0 && (kotInstruction || isHeld)
              ? `${holdPrefix}${kotInstruction}`.trim()
              : undefined;
          return {
            menuItemId: l.id,
            name: l.name,
            qty: l.qty,
            unitPrice: l.price,
            ...(note ? { note } : {}),
          };
        }),
        print: options?.print,
      });

      if (created.order?.id) {
        setActiveOrderId(String(created.order.id));
        if (isSettle) {
          await loadOrderDetails(String(created.order.id));
        }
      }

      setFormLines([]);
      setOrderInstruction("");
      setShowInstruction(false);
      setIsHeld(false);

      const kotRecord = created.kot as Record<string, unknown> | undefined;
      const kotNo = String(
        kotRecord?.kotNumber ?? kotRecord?.kot_number ?? kotRecord?.id ?? "KOT",
      );

      if (options?.print) {
        const kotId = String(kotRecord?.id ?? kotNo);
        const slipParams: KotSlipParams = {
          kotNo,
          kotId,
          orderType: formType,
          tableRef,
          lines: kotPrintLines,
        };
        saveKotSlip(slipParams);
        onTablesRefresh?.();
        onToast(
          `${formatKotNumber(kotNo)} sent · ${formatINR(kotTotal)} · KOT slip downloaded`,
        );
        if (!isSettle) {
          onOrderCreated();
        }
      } else {
        onTablesRefresh?.();
        onToast(
          `${formatKotNumber(kotNo)} sent · ${formatINR(kotTotal)} · ${created.order?.orderNo ?? "Order"}`,
        );
        if (isManage) {
          onOrderCreated();
        }
      }
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to send KOT");
    } finally {
      setSaving(false);
    }
  };

  const sendNewItemsAsKot = async () => {
    if (!formLines.length) return null;
    const tableRef =
      formRef.trim() ||
      (formType === "Dine In"
        ? "Walk-in"
        : formType === "Takeaway"
          ? "Counter"
          : "Delivery");
    const guestName = guestDetails.name.trim() || "Walk-in";
    const kotInstruction = orderInstruction.trim();
    return posService.sendKot({
      outletId: activeOutletId,
      type: formType,
      ref: tableRef,
      ...(liveTableId ? { liveTableId } : {}),
      ...(activeOrderId ? { orderId: activeOrderId } : {}),
      guest: guestName,
      server: currentUser.name,
      lines: formLines.map((l, index) => {
        const holdPrefix = isHeld ? "[HOLD] " : "";
        const note =
          index === 0 && (kotInstruction || isHeld)
            ? `${holdPrefix}${kotInstruction}`.trim()
            : undefined;
        return {
          menuItemId: l.id,
          name: l.name,
          qty: l.qty,
          unitPrice: l.price,
          ...(note ? { note } : {}),
        };
      }),
    });
  };

  const handleManageSave = async () => {
    if (!activeOutletId) {
      setFormError("Select an outlet first.");
      return;
    }
    try {
      setSaving(true);
      setFormError(null);
      if (formLines.length) {
        await sendNewItemsAsKot();
        setFormLines([]);
        setOrderInstruction("");
        onToast(`KOT sent · ${formatINR(formTotal)}`);
      }
      onTablesRefresh?.();
      onOrderCreated();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndPrintBill = async () => {
    if (!activeOutletId) {
      setFormError("Select an outlet first.");
      return;
    }
    if (!activeOrderId && !formLines.length) {
      setFormError("No items on this order.");
      return;
    }
    try {
      setSaving(true);
      setFormError(null);
      let orderId = activeOrderId;
      let linesForPrint = allDisplayLines;
      let totalForPrint = orderTotal;
      if (formLines.length) {
        const result = await sendNewItemsAsKot();
        orderId = String(result?.order?.id ?? orderId);
      }
      if (!orderId) {
        setFormError("No open order to bill.");
        return;
      }
      const loaded = await loadOrderDetails(orderId);
      if (loaded) {
        linesForPrint = loaded.items;
        totalForPrint = loaded.total;
      }
      const bill = await posService.printBillForOrder(orderId);
      const billNo = String(bill.billNo ?? bill.id ?? "Bill");
      const billId = String(bill.id ?? billNo);
      const orderNoForPrint = loaded
        ? String(loaded.order.orderNo ?? loaded.order.id ?? orderId)
        : loadedOrderNo || orderId;
      saveBillSlip({
        billNo,
        billId,
        orderNo: orderNoForPrint,
        orderType: formType,
        outletName: outletLabel(activeOutletId) || "Outlet",
        tableRef: formRef,
        guest: guestDetails.name.trim() || "Walk-in",
        server: currentUser.name,
        lines: linesForPrint.map((line) => ({
          name: line.name,
          qty: line.qty,
          price: line.price,
        })),
        total: totalForPrint,
      });
      setFormLines([]);
      onToast(`${billNo} saved · ${formatINR(totalForPrint)} · bill slip downloaded`);
      onOrderCreated();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to print bill");
    } finally {
      setSaving(false);
    }
  };

  const handleSettle = async () => {
    if (!activeBillId) {
      setFormError("No bill found for this order.");
      return;
    }
    const amount = Number(amountPaid);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Enter a valid amount paid.");
      return;
    }
    try {
      setSaving(true);
      setFormError(null);
      const remaining = orderTotal;
      await posService.payBill(activeBillId, {
        amount,
        paymentMode,
        fullPay: amount >= remaining,
      });
      onToast(
        `Settled · ${formatINR(amount)} via ${paymentMode}${amount < remaining ? " (partial)" : ""}`,
      );
      onOrderCreated();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Settlement failed");
    } finally {
      setSaving(false);
    }
  };

  const selectedCategoryName =
    selectedCategoryId === "all"
      ? "All Items"
      : categories.find((c) => c.id === selectedCategoryId)?.name ?? "Items";

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-1 overflow-hidden bg-white",
        className,
      )}
    >
      <aside className="flex h-full min-h-0 w-52 shrink-0 flex-col border-r border-slate-200 bg-slate-900 text-white">
        {!isSettle && (
          <>
        <div className="border-b border-slate-700 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Categories
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-white">
            {outlets.find((o) => o.id === activeOutletId)?.name ?? "Select outlet"}
          </p>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          <button
            type="button"
            onClick={() => setSelectedCategoryId("all")}
            className={cn(
              "flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium transition",
              selectedCategoryId === "all"
                ? "bg-emerald-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white",
            )}
          >
            <UtensilsCrossed className="h-4 w-4 shrink-0 opacity-80" />
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryId(cat.id)}
              className={cn(
                "flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium transition",
                selectedCategoryId === cat.id
                  ? "bg-emerald-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              )}
            >
              <span className="h-4 w-1 shrink-0 rounded-full bg-current opacity-60" />
              <span className="truncate">{cat.name}</span>
            </button>
          ))}
          {categories.length === 0 && (
            <p className="px-4 py-6 text-xs text-slate-500">No categories yet</p>
          )}
        </nav>
          </>
        )}
        {isSettle && (
          <div className="flex flex-1 flex-col justify-center px-4 py-6 text-center">
            <Receipt className="mx-auto mb-3 h-8 w-8 text-emerald-400 opacity-80" />
            <p className="text-sm font-semibold text-white">Settle bill</p>
            <p className="mt-1 text-xs text-slate-400">Review items and collect payment</p>
          </div>
        )}
      </aside>

      <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-slate-50/60">
        {isSettle ? (
          <div className="flex flex-1 flex-col overflow-y-auto p-6">
            <div className="mx-auto w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                {loadedOrderNo ? `Order ${loadedOrderNo}` : "Order summary"}
              </h2>
              {runningKots.length > 0 && (
                <p className="mt-1 text-xs font-medium text-emerald-700">
                  Running KOT{runningKots.length > 1 ? "s" : ""}:{" "}
                  {runningKots.map((kot) => formatKotNumber(kot.kotNo)).join(", ")}
                </p>
              )}
              <p className="mt-1 text-sm text-slate-500">
                Table {formRef || "—"} · {outletLabel(activeOutletId)}
              </p>
              {loadingOrder ? (
                <p className="mt-6 text-sm text-slate-500">Loading order…</p>
              ) : (
                <ul className="mt-4 divide-y divide-slate-100">
                  {allDisplayLines.map((line) => (
                    <li
                      key={`${line.id}-${line.name}`}
                      className="flex items-center justify-between py-2.5 text-sm"
                    >
                      <span>
                        {line.qty}× {line.name}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {formatINR(line.qty * line.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="font-medium text-slate-600">Bill total</span>
                <span className="text-xl font-bold text-emerald-800">
                  {formatINR(orderTotal)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
        <div className="border-b border-slate-200 bg-white px-4 py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              {selectedCategoryName}
            </h2>
            <span className="text-xs text-slate-500">
              {filteredItems.length} item{filteredItems.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                placeholder="Search item…"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2"
              />
            </div>
            <input
              type="text"
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value)}
              placeholder="Short code"
              className="h-9 w-28 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredItems.length === 0 ? (
            <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-sm text-slate-500">
              No items in this category
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => addItem(item)}
                  className="group relative flex min-h-[72px] flex-col justify-center rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-emerald-300 hover:shadow-md"
                >
                  <span
                    className={cn(
                      "absolute bottom-0 left-0 top-0 w-1 rounded-l-lg",
                      item.isVegetarian ? "bg-emerald-500" : "bg-red-500",
                    )}
                    aria-hidden
                  />
                  <p className="pl-2 text-sm font-semibold leading-snug text-slate-900 group-hover:text-emerald-800">
                    {item.name}
                  </p>
                  {item.itemCode && (
                    <p className="pl-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      {item.itemCode}
                    </p>
                  )}
                  {item.price > 0 && (
                    <p className="mt-1 pl-2 text-xs font-bold text-emerald-700">
                      {formatINR(item.price)}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
          </>
        )}
      </section>

      <aside className="flex h-full min-h-0 w-[420px] shrink-0 flex-col border-l border-slate-200 bg-white">
        <div className="shrink-0 border-b border-slate-200">
          <div className="flex items-center gap-1.5 px-3 py-2">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Back to tables"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="flex min-w-0 flex-1 flex-wrap gap-1">
              <HeaderAction
                active={showInstruction || !!orderInstruction.trim()}
                onClick={() => setShowInstruction((v) => !v)}
                icon={MessageSquare}
                label="Instruction"
              />
              <HeaderAction
                active={showGuestDetails || hasGuestDetails}
                onClick={() => setShowGuestDetails((v) => !v)}
                icon={User}
                label="Guest"
              />
              <HeaderAction
                active={isHeld}
                onClick={() => setIsHeld((v) => !v)}
                icon={Pause}
                label="Hold"
              />
              <HeaderAction
                onClick={() => onToast("Split bill — coming soon")}
                icon={SplitSquareHorizontal}
                label="Split"
              />
            </div>
            {itemCount > 0 && (
              <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                {itemCount}
              </span>
            )}
          </div>
          {showInstruction && (
            <div className="border-t border-slate-100 px-3 py-2">
              <textarea
                value={orderInstruction}
                onChange={(e) => setOrderInstruction(e.target.value)}
                rows={2}
                placeholder="Kitchen or service instructions…"
                className="w-full resize-none rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2"
              />
            </div>
          )}
          {showGuestDetails && formType !== "Room Service" && (
            <div className="space-y-2 border-t border-slate-100 px-3 py-2">
              <p className="text-[10px] font-medium text-slate-500">
                Walk-in guest details (optional — saved to guest profile when provided)
              </p>
              <FormField label="Name">
                <TextInput
                  value={guestDetails.name}
                  onChange={(e) => updateGuestField("name", e.target.value)}
                  placeholder="Guest name"
                />
              </FormField>
              <FormField label="Phone">
                <TextInput
                  value={guestDetails.phone}
                  onChange={(e) => updateGuestField("phone", e.target.value)}
                  placeholder="Mobile number"
                />
              </FormField>
              <FormField label="Email">
                <TextInput
                  type="email"
                  value={guestDetails.email}
                  onChange={(e) => updateGuestField("email", e.target.value)}
                  placeholder="Email address"
                />
              </FormField>
              <FormField label="Date of birth">
                <FODatePicker
                  value={guestDetails.dob}
                  onChange={(value) => updateGuestField("dob", value)}
                  placeholder="Date of birth"
                />
              </FormField>
            </div>
          )}
          {showGuestDetails && formType === "Room Service" && selectedReservationId && (
            <div className="space-y-1 border-t border-slate-100 px-3 py-2 text-xs text-slate-600">
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                In-house guest
              </p>
              <p className="font-semibold text-slate-900">{guestDetails.name || "—"}</p>
              {linkedGuestNo && (
                <p>
                  Profile ref: <span className="font-medium">{linkedGuestNo}</span>
                </p>
              )}
              {inHouseGuests.find((g) => g.id === selectedReservationId)?.bookingNo && (
                <p>
                  Booking:{" "}
                  <span className="font-medium">
                    {inHouseGuests.find((g) => g.id === selectedReservationId)?.bookingNo}
                  </span>
                </p>
              )}
            </div>
          )}
          {isHeld && (
            <p className="border-t border-amber-100 bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-800">
              Order marked on hold — will be sent to kitchen when placed
            </p>
          )}
        </div>

        <div className="space-y-3 border-b border-slate-100 px-3 py-3">
          {formError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-xs text-red-700">
              {formError}
            </p>
          )}
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <FormField label="Outlet" required>
              <FbOutletSelect
                outlets={outlets}
                value={activeOutletId}
                onChange={onOutletChange}
                allowAll
                className="h-9 w-full"
              />
            </FormField>
            <FormField
              label={
                formType === "Dine In"
                  ? "Table"
                  : formType === "Room Service"
                    ? "Room"
                    : "Ref"
              }
              required={formType === "Dine In" || formType === "Room Service"}
            >
              {formType === "Dine In" && formTables.length > 0 && !lockTable ? (
                <SelectInput
                  value={formRef}
                  onChange={(e) => setFormRef(e.target.value)}
                >
                  <option value="">Select table</option>
                  {formTables.map((t) => (
                    <option key={t.id} value={t.tableNo}>
                      {!activeOutletId && t.outletId
                        ? `${outletLabel(t.outletId)} · `
                        : ""}
                      {t.tableNo}
                      {t.status ? ` · ${t.status}` : ""}
                    </option>
                  ))}
                </SelectInput>
              ) : formType === "Room Service" ? (
                <SelectInput
                  value={selectedReservationId}
                  onChange={(e) => selectInHouseGuest(e.target.value)}
                >
                  <option value="">Select in-house guest</option>
                  {inHouseGuests.map((g) => (
                    <option key={g.id} value={g.id}>
                      Room {g.room} · {g.guestName}
                      {g.bookingNo ? ` (${g.bookingNo})` : ""}
                    </option>
                  ))}
                </SelectInput>
              ) : (
                <TextInput
                  value={formRef}
                  onChange={(e) => setFormRef(e.target.value)}
                  readOnly={lockTable && formType === "Dine In"}
                  placeholder={
                    formType === "Takeaway"
                      ? "Counter"
                      : formType === "Dine In"
                        ? "Table"
                        : "501"
                  }
                />
              )}
            </FormField>
            <FormField label="Pax">
              <TextInput
                type="number"
                min={1}
                value={pax}
                onChange={(e) => setPax(e.target.value)}
                placeholder="Covers"
                className="w-20"
              />
            </FormField>
          </div>
          {formType === "Takeaway" && (
            <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Truck className="h-3.5 w-3.5" />
              Pickup order
            </p>
          )}
        </div>

        {(isManage || isSettle) && loadedOrderNo && (
          <div className="border-b border-emerald-100 bg-emerald-50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
              {isSettle ? "Printed bill" : "Open order"}
            </p>
            <p className="text-sm font-bold text-slate-900">{loadedOrderNo}</p>
            {runningKots.length > 0 && (
              <p className="mt-1 text-[11px] font-medium text-emerald-900">
                Running KOT{runningKots.length > 1 ? "s" : ""}:{" "}
                {runningKots.map((kot) => formatKotNumber(kot.kotNo)).join(", ")}
              </p>
            )}
            {loadingOrder && (
              <p className="text-[11px] text-slate-500">Loading items…</p>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-2 border-b border-slate-100 bg-slate-50/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            <span>Item</span>
            <span className="text-center">Qty</span>
            <span className="text-right">Price</span>
            <span className="w-6" />
          </div>
          {(isManage || isSettle) && savedLines.length > 0 && (
            <>
              <p className="bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase text-slate-500">
                {isSettle ? "Bill items" : "On order"}
              </p>
              <ul className="divide-y divide-slate-100 border-b border-slate-200">
                {savedLines.map((line) => (
                  <li
                    key={`saved-${line.id}-${line.name}`}
                    className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-2 px-3 py-2.5 text-sm text-slate-700"
                  >
                    <span className="truncate font-medium">{line.name}</span>
                    <span className="text-center text-xs font-semibold">{line.qty}</span>
                    <span className="w-16 text-right text-xs font-semibold">
                      {formatINR(line.qty * line.price)}
                    </span>
                    <span className="w-6" />
                  </li>
                ))}
              </ul>
            </>
          )}
          {!isSettle && formLines.length > 0 && isManage && (
            <p className="bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase text-amber-800">
              New items
            </p>
          )}
          {!isSettle && formLines.length === 0 && !savedLines.length ? (
            <p className="px-4 py-10 text-center text-xs text-slate-400">
              {isManage ? "Tap items to add more" : "Tap items to add to this order"}
            </p>
          ) : !isSettle ? (
            <ul className="divide-y divide-slate-100">
              {formLines.map((line) => (
                <li
                  key={line.id}
                  className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-2 px-3 py-2.5 text-sm"
                >
                  <span className="truncate font-medium text-slate-900">
                    {line.name}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => updateQty(line.id, -1)}
                      className="rounded p-0.5 text-slate-400 hover:bg-slate-100"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-xs font-semibold">
                      {line.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQty(line.id, 1)}
                      className="rounded p-0.5 text-slate-400 hover:bg-slate-100"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="w-16 text-right text-xs font-semibold text-slate-800">
                    {formatINR(line.qty * line.price)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    className="rounded p-1 text-red-400 hover:bg-red-50"
                    aria-label={`Remove ${line.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : isSettle && allDisplayLines.length === 0 && !loadingOrder ? (
            <p className="px-4 py-10 text-center text-xs text-slate-400">
              No items on this bill
            </p>
          ) : null}
        </div>

        <div className="border-t border-slate-200 p-3">
          {isSettle && (
            <div className="mb-3 space-y-2">
              <FormField label="Payment mode">
                <SelectInput
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  {paymentModes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </SelectInput>
              </FormField>
              <FormField label="Amount paid">
                <TextInput
                  type="number"
                  min={0}
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0.00"
                />
              </FormField>
            </div>
          )}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">
              {isManage || isSettle ? "Bill total" : "Total"}
            </span>
            <span className="text-xl font-bold text-emerald-800">
              {formatINR(isManage || isSettle ? orderTotal : formTotal)}
            </span>
          </div>
          {isSettle ? (
            <Button
              type="button"
              className="w-full bg-emerald-700 hover:bg-emerald-800"
              disabled={saving || !activeBillId}
              onClick={() => void handleSettle()}
            >
              {saving ? "Settling…" : "Settle"}
            </Button>
          ) : isManage ? (
            <div className="space-y-2">
              {formLines.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 px-4"
                    disabled={saving}
                    onClick={clearCart}
                  >
                    Clear
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 bg-emerald-700 hover:bg-emerald-800"
                    disabled={saving}
                    onClick={() => void placeOrder()}
                  >
                    {saving ? "Sending…" : "KOT"}
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 bg-emerald-800 hover:bg-emerald-900"
                    disabled={saving}
                    onClick={() => void placeOrder({ print: true })}
                  >
                    {saving ? "Sending…" : "KOT and Print"}
                  </Button>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800"
                  disabled={saving || (!activeOrderId && !formLines.length)}
                  onClick={() => void handleManageSave()}
                >
                  {saving ? "Saving…" : "Save"}
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-slate-800 hover:bg-slate-900"
                  disabled={saving || (!activeOrderId && !formLines.length)}
                  onClick={() => void handleSaveAndPrintBill()}
                >
                  {saving ? "Printing…" : "Save and Print Bill"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="shrink-0 px-4"
                disabled={!formLines.length || saving}
                onClick={clearCart}
              >
                Clear
              </Button>
              <Button
                type="button"
                className="flex-1 bg-emerald-700 hover:bg-emerald-800"
                disabled={saving || !formLines.length}
                onClick={() => void placeOrder()}
              >
                {saving ? "Sending…" : "KOT"}
              </Button>
              <Button
                type="button"
                className="flex-1 bg-emerald-800 hover:bg-emerald-900"
                disabled={saving || !formLines.length}
                onClick={() => void placeOrder({ print: true })}
              >
                {saving ? "Sending…" : "KOT and Print"}
              </Button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function HeaderAction({
  label,
  icon: Icon,
  active = false,
  onClick,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition sm:text-[11px]",
        active
          ? "bg-emerald-100 text-emerald-800"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {label}
    </button>
  );
}
