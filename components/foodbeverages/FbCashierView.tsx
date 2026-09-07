"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard, IndianRupee, Smartphone, Wallet } from "lucide-react";
import { formatINR } from "@/app/data/foodbeverages/ops";
import {
  fbCashierService,
  type FbCashierShift,
} from "@/services/food-beverages";
import { useFbOutlets } from "@/services/food-beverages/useFbOutlets";
import { currentUser } from "@/app/data";
import { Button } from "@/components/ui/Button";
import { ModulePageShell } from "@/components/pms";
import { FormField, TextInput } from "@/components/frontoffice/ui";
import { FbOutletSelect } from "@/components/foodbeverages/FbOutletSelect";
import { cn } from "@/lib/utils";

export function FbCashierView() {
  const { outlets } = useFbOutlets(["restaurant", "cafe"]);
  const [outletId, setOutletId] = useState("");
  const [shifts, setShifts] = useState<FbCashierShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "Open" | "Closed">("all");
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cashActual, setCashActual] = useState("");
  const [notes, setNotes] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Defaults to "" (All Outlets) when entering the page

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await fbCashierService.list(outletId || undefined);
        if (!cancelled) {
          setShifts(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setShifts([]);
          setError(e instanceof Error ? e.message : "Failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [outletId]);

  const outletShifts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return shifts.filter((s) => {
      if (outletId && s.outletId !== outletId) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!q) return true;
      const sales = s.cashSales + s.cardSales + s.upiSales;
      const salesFormatted = formatINR(sales).toLowerCase();
      const declaredFormatted =
        s.declaredCash != null ? formatINR(s.declaredCash).toLowerCase() : "";
      const outletName =
        outlets.find((o) => o.id === s.outletId)?.name?.toLowerCase() || "";
      return (
        s.cashier.toLowerCase().includes(q) ||
        s.shift.toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q) ||
        (s.openedAt && s.openedAt.toLowerCase().includes(q)) ||
        outletName.includes(q) ||
        String(sales).includes(q) ||
        salesFormatted.includes(q) ||
        (s.declaredCash != null && String(s.declaredCash).includes(q)) ||
        declaredFormatted.includes(q) ||
        (s.openingFloat != null && String(s.openingFloat).includes(q))
      );
    });
  }, [shifts, outletId, statusFilter, search, outlets]);

  const openShift = useMemo(() => {
    if (outletId) {
      return shifts.find((s) => s.outletId === outletId && s.status === "Open") ?? null;
    }
    return shifts.find((s) => s.status === "Open") ?? null;
  }, [shifts, outletId]);

  const selectedShift = useMemo(() => {
    if (!selectedShiftId) return null;
    return shifts.find((s) => s.id === selectedShiftId) ?? null;
  }, [shifts, selectedShiftId]);

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

  const openNewShift = async () => {
    const targetOutletId = outletId || outlets[0]?.id;
    if (!targetOutletId) {
      setToast("Please select an outlet before opening a shift.");
      return;
    }
    if (openShift) {
      setToast("Close the current shift before opening a new one.");
      return;
    }
    try {
      const shift = await fbCashierService.open({
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
        outletId: targetOutletId,
      });
      setShifts((prev) => [shift, ...prev]);
      setCashActual("");
      setNotes("");
      setToast(`Shift opened by ${currentUser.name}`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to open shift");
    }
  };

  const closeShift = async () => {
    if (!openShift) return;
    if (!cashActual) {
      setToast("Enter counted cash to close the shift.");
      return;
    }
    try {
      const updated = await fbCashierService.close(openShift.id, actualCash);
      setShifts((prev) => prev.map((s) => (s.id === openShift.id ? updated : s)));
      setToast(
        `Shift closed. Cash variance ${cashVariance >= 0 ? "+" : ""}${formatINR(cashVariance)}`,
      );
      setCashActual("");
      setNotes("");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to close shift");
    }
  };

  if (loading) {
    return (
      <ModulePageShell
        eyebrow="Restaurants"
        title="Cashier"
        description="Open and close outlet shifts, count cash, and review collections."
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
        title="Cashier"
        description="Open and close outlet shifts, count cash, and review collections."
        wrapChildren={false}
      >
        <p className="text-sm text-red-600">{error}</p>
      </ModulePageShell>
    );
  }

  const isFiltered = search.trim().length > 0 || statusFilter !== "all";

  return (
    <ModulePageShell
      eyebrow="Restaurants"
      title="Cashier"
      description="Open and close outlet shifts, count cash, and review collections."
      toast={toast}
      onDismissToast={() => setToast(null)}
      wrapChildren={false}
      beforeFilters={
        <FbOutletSelect
          outlets={outlets}
          value={outletId}
          onChange={setOutletId}
          allowAll
          allLabel="All Outlets"
        />
      }
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search cashier, shift, status, amount…"
      filterPills={{
        active: statusFilter,
        onChange: (val) => setStatusFilter(val as "all" | "Open" | "Closed"),
        options: [
          { id: "all", label: "All Shifts" },
          { id: "Open", label: "Open" },
          { id: "Closed", label: "Closed" },
        ],
      }}
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
              <h2 className="text-sm font-semibold text-slate-900">
                {selectedShift && selectedShift.id !== openShift?.id
                  ? `Shift details · ${selectedShift.cashier}`
                  : "Active shift close"}
              </h2>
              <p className="text-[11px] text-slate-500">
                {selectedShift && selectedShift.id !== openShift?.id
                  ? `${selectedShift.shift} · opened ${selectedShift.openedAt} · Status: ${selectedShift.status}`
                  : openShift
                    ? `${openShift.shift} · opened ${openShift.openedAt}`
                    : "No open shift for this outlet"}
              </p>
            </div>
            {selectedShift && selectedShift.id !== openShift?.id ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setSelectedShiftId(null)}
              >
                Back to active shift
              </Button>
            ) : (
              openShift && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                  Open
                </span>
              )
            )}
          </div>

          {selectedShift && selectedShift.id !== openShift?.id ? (
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <IndianRupee className="h-3.5 w-3.5" /> Cash sales
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatINR(selectedShift.cashSales)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <CreditCard className="h-3.5 w-3.5" /> Card
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatINR(selectedShift.cardSales)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                  <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Smartphone className="h-3.5 w-3.5" /> UPI
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {formatINR(selectedShift.upiSales)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Opening Float</span>
                  <span className="font-semibold text-slate-900">
                    {formatINR(selectedShift.openingFloat)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Gross Collections</span>
                  <span className="font-semibold text-emerald-700">
                    {formatINR(
                      selectedShift.cashSales + selectedShift.cardSales + selectedShift.upiSales,
                    )}
                  </span>
                </div>
                {selectedShift.declaredCash != null && (
                  <div className="flex justify-between text-slate-600">
                    <span>Declared Cash</span>
                    <span className="font-semibold text-slate-900">
                      {formatINR(selectedShift.declaredCash)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Shift Status</span>
                  <span
                    className={cn(
                      "font-semibold",
                      selectedShift.status === "Open" ? "text-amber-700" : "text-emerald-700",
                    )}
                  >
                    {selectedShift.status}
                  </span>
                </div>
              </div>
            </div>
          ) : openShift ? (
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
                    Expected drawer{" "}
                    <span className="font-semibold text-slate-900">
                      {formatINR(expectedCash)}
                    </span>
                  </p>
                  <p className="text-slate-500">
                    Expected all modes{" "}
                    <span className="font-semibold text-slate-900">
                      {formatINR(expectedTotal)}
                    </span>
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
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Shift history{" "}
              <span className="ml-1 text-xs font-normal text-slate-500">
                ({outletShifts.length} {isFiltered ? `of ${shifts.length}` : ""})
              </span>
            </h2>
            {isFiltered && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="text-xs text-emerald-700 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <ul className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto pr-1">
            {outletShifts.map((shift) => {
              const isSelected = selectedShiftId === shift.id;
              const outletName = outlets.find((o) => o.id === shift.outletId)?.name;
              return (
                <li
                  key={shift.id}
                  onClick={() => setSelectedShiftId(shift.id === selectedShiftId ? null : shift.id)}
                  className={cn(
                    "group flex cursor-pointer items-start justify-between gap-3 rounded-lg p-2.5 transition-colors hover:bg-slate-50",
                    isSelected && "bg-emerald-50/70 ring-1 ring-emerald-300",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-emerald-700">
                      {shift.cashier}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {shift.shift} · {shift.openedAt}
                      {outletName && !outletId && (
                        <span className="ml-1 text-slate-400">({outletName})</span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Sales {formatINR(shift.cashSales + shift.cardSales + shift.upiSales)}
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
              );
            })}
            {outletShifts.length === 0 && (
              <li className="py-8 text-center text-sm text-slate-400">
                {isFiltered ? (
                  <div>
                    <p>No shifts matching your filters</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearch("");
                        setStatusFilter("all");
                      }}
                      className="mt-2 text-xs font-medium text-emerald-700 hover:underline"
                    >
                      Clear search & filters
                    </button>
                  </div>
                ) : (
                  "No shifts yet"
                )}
              </li>
            )}
          </ul>
        </section>
      </div>
    </ModulePageShell>
  );
}
