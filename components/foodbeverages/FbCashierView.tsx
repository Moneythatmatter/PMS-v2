"use client";

import { useMemo, useState } from "react";
import { CreditCard, IndianRupee, Smartphone, Wallet } from "lucide-react";
import {
  fbCashierShiftsSeed,
  formatINR,
  getRestaurantOutletOptions,
  type FbCashierShift,
} from "@/app/data/foodbeverages/ops";
import { currentUser } from "@/app/data";
import { Button } from "@/components/ui/Button";
import { ModulePageShell } from "@/components/pms";
import { FormField, TextInput } from "@/components/frontoffice/ui";
import { FbOutletSelect } from "@/components/foodbeverages/FbOutletSelect";
import { cn } from "@/lib/utils";

export function FbCashierView() {
  const outlets = getRestaurantOutletOptions();
  const [outletId, setOutletId] = useState(outlets[0]?.id ?? "rest-1");
  const [shifts, setShifts] = useState(fbCashierShiftsSeed);
  const [search, setSearch] = useState("");
  const [cashActual, setCashActual] = useState("");
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const outletShifts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return shifts.filter((s) => {
      if (s.outletId !== outletId) return false;
      if (!q) return true;
      return (
        s.cashier.toLowerCase().includes(q) ||
        s.shift.toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q)
      );
    });
  }, [shifts, outletId, search]);

  const openShift = useMemo(
    () => shifts.find((s) => s.outletId === outletId && s.status === "Open") ?? null,
    [shifts, outletId],
  );

  const expectedCash = openShift
    ? openShift.openingFloat + openShift.cashSales - openShift.refunds
    : 0;
  const expectedTotal = openShift
    ? openShift.openingFloat +
      openShift.cashSales +
      openShift.cardSales +
      openShift.upiSales -
      openShift.refunds
    : 0;
  const salesTotal = openShift
    ? openShift.cashSales + openShift.cardSales + openShift.upiSales
    : 0;

  const actualCash = parseFloat(cashActual) || 0;
  const cashVariance = openShift ? actualCash - expectedCash : 0;

  const openNewShift = () => {
    if (openShift) {
      setToast("Close the current shift before opening a new one.");
      return;
    }
    const shift: FbCashierShift = {
      id: `C-${Date.now()}`,
      cashier: currentUser.name,
      shift: "Current",
      openedAt: new Date().toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
      }),
      openingFloat: 2000,
      cashSales: 0,
      cardSales: 0,
      upiSales: 0,
      refunds: 0,
      declaredCash: null,
      status: "Open",
      outletId,
    };
    setShifts((prev) => [shift, ...prev]);
    setCashActual("");
    setNotes("");
    setToast(`Shift opened by ${currentUser.name}`);
  };

  const closeShift = () => {
    if (!openShift) return;
    if (!cashActual) {
      setToast("Enter counted cash to close the shift.");
      return;
    }
    setShifts((prev) =>
      prev.map((s) =>
        s.id === openShift.id
          ? { ...s, status: "Closed" as const, declaredCash: actualCash }
          : s,
      ),
    );
    setToast(
      `Shift closed. Cash variance ${cashVariance >= 0 ? "+" : ""}${formatINR(cashVariance)}`,
    );
    setCashActual("");
    setNotes("");
  };

  return (
    <ModulePageShell
      eyebrow="Restaurants"
      title="Cashier"
      description="Open and close outlet shifts, count cash, and review collections."
      toast={toast}
      onDismissToast={() => setToast(null)}
      wrapChildren={false}
      beforeFilters={
        <FbOutletSelect outlets={outlets} value={outletId} onChange={setOutletId} />
      }
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search cashier or shift…"
      primaryAction={{ label: "Open Shift", onClick: openNewShift }}
      stats={[
        {
          label: "Shift status",
          value: openShift ? "Open" : "Closed",
          accent: openShift ? "#d97706" : "#15803d",
          sublabel: openShift?.cashier ?? "No active shift",
        },
        {
          label: "Shift sales",
          value: formatINR(salesTotal),
          accent: "#15803d",
          sublabel: "Gross collections",
        },
        {
          label: "Expected cash",
          value: formatINR(expectedCash),
          sublabel: "Float + cash − refunds",
        },
        {
          label: "Card + UPI",
          value: formatINR((openShift?.cardSales ?? 0) + (openShift?.upiSales ?? 0)),
          sublabel: "Non-cash",
        },
      ]}
    >
      <div className="grid gap-3 lg:grid-cols-5">
        <section className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Active shift close</h2>
              <p className="text-[11px] text-slate-500">
                {openShift
                  ? `${openShift.shift} · opened ${openShift.openedAt}`
                  : "No open shift for this outlet"}
              </p>
            </div>
            {openShift && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                Open
              </span>
            )}
          </div>

          {openShift ? (
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <IndianRupee className="h-3.5 w-3.5" /> Cash sales
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatINR(openShift.cashSales)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <CreditCard className="h-3.5 w-3.5" /> Card
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatINR(openShift.cardSales)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Smartphone className="h-3.5 w-3.5" /> UPI
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatINR(openShift.upiSales)}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Counted cash (drawer)">
                  <TextInput
                    type="number"
                    value={cashActual}
                    onChange={(e) => setCashActual(e.target.value)}
                    placeholder={String(expectedCash)}
                  />
                </FormField>
                <FormField label="Notes">
                  <TextInput
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional close notes"
                  />
                </FormField>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <div className="text-sm">
                  <p className="text-slate-500">
                    Expected drawer <span className="font-semibold text-slate-900">{formatINR(expectedCash)}</span>
                  </p>
                  <p className="text-slate-500">
                    Expected all modes{" "}
                    <span className="font-semibold text-slate-900">{formatINR(expectedTotal)}</span>
                  </p>
                </div>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    cashActual
                      ? cashVariance === 0
                        ? "text-emerald-700"
                        : "text-red-600"
                      : "text-slate-400",
                  )}
                >
                  {cashActual
                    ? `Cash variance ${cashVariance >= 0 ? "+" : ""}${formatINR(cashVariance)}`
                    : "Enter count"}
                </p>
              </div>

              <Button
                type="button"
                className="w-full bg-emerald-700 hover:bg-emerald-800 sm:w-auto"
                onClick={closeShift}
              >
                <Wallet className="mr-1.5 h-4 w-4" />
                Close shift
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
              <p className="text-sm text-slate-500">No open shift. Open one to start selling.</p>
              <Button
                type="button"
                className="mt-3 bg-emerald-700 hover:bg-emerald-800"
                onClick={openNewShift}
              >
                Open shift
              </Button>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Shift history</h2>
          <ul className="divide-y divide-slate-100">
            {outletShifts.map((shift) => (
              <li key={shift.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{shift.cashier}</p>
                  <p className="text-[11px] text-slate-500">
                    {shift.shift} · {shift.openedAt}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Sales{" "}
                    {formatINR(shift.cashSales + shift.cardSales + shift.upiSales)}
                    {shift.declaredCash != null &&
                      ` · Declared ${formatINR(shift.declaredCash)}`}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    shift.status === "Open" && "bg-amber-100 text-amber-800",
                    shift.status === "Closed" && "bg-emerald-100 text-emerald-800",
                    shift.status === "Pending" && "bg-slate-100 text-slate-600",
                  )}
                >
                  {shift.status}
                </span>
              </li>
            ))}
            {outletShifts.length === 0 && (
              <li className="py-8 text-center text-sm text-slate-400">No shifts yet</li>
            )}
          </ul>
        </section>
      </div>
    </ModulePageShell>
  );
}
