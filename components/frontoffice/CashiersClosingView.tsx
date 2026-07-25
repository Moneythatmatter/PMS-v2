"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, IndianRupee, Smartphone, Wallet } from "lucide-react";
import {
  currentShiftSummary,
  type CashierShiftRecord,
} from "@/app/data/frontoffice/closing";
import { currentUser } from "@/app/data";
import { cashierShiftService } from "@/services/front-office";
import { Button } from "@/components/ui/Button";
import {
  AlertBanner,
  DataTable,
  FormField,
  FOPageHeader,
  StatMiniCard,
  SummaryRow,
  TextInput,
  formatINR,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";

export function CashiersClosingView() {
  const [records, setRecords] = useState<CashierShiftRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cashActual, setCashActual] = useState("");
  const [cardActual, setCardActual] = useState(String(currentShiftSummary.cardExpected));
  const [upiActual, setUpiActual] = useState(String(currentShiftSummary.upiExpected));
  const [notes, setNotes] = useState("");
  const [closed, setClosed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await cashierShiftService.list();
        if (!cancelled) {
          setRecords(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const expected = useMemo(() => {
    const total =
      currentShiftSummary.cashExpected +
      currentShiftSummary.cardExpected +
      currentShiftSummary.upiExpected -
      currentShiftSummary.refunds;
    return { ...currentShiftSummary, total };
  }, []);

  const actualTotal = useMemo(() => {
    const cash = parseFloat(cashActual) || 0;
    const card = parseFloat(cardActual) || 0;
    const upi = parseFloat(upiActual) || 0;
    return cash + card + upi - currentShiftSummary.refunds;
  }, [cashActual, cardActual, upiActual]);

  const variance = actualTotal - expected.total;

  const handleCloseShift = async () => {
    if (!cashActual) {
      setToast("Please enter actual cash count.");
      return;
    }
    try {
      const record = await cashierShiftService.create({
        cashier: currentUser.name,
        shift: "Evening (10 PM – 6 AM)",
        date: new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        expected: expected.total,
        actual: actualTotal,
        variance,
        status: "Closed",
      });
      setRecords((prev) => [record, ...prev]);
      setClosed(true);
      setToast(`Shift closed by ${currentUser.name}. Variance: ${formatINR(variance)}`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to close shift");
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-5">
      {toast && (
        <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />
      )}

      <FOPageHeader
        eyebrow="Front Office"
        title="Cashier's Closing"
        description="End-of-shift cashier closing, cash reconciliation, and settlement."
        badge={
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            <Wallet className="h-3.5 w-3.5 text-emerald-600" />
            Evening Shift · Open
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatMiniCard label="Cash Expected" value={formatINR(expected.cashExpected)} icon={Wallet} />
        <StatMiniCard label="Card Expected" value={formatINR(expected.cardExpected)} icon={CreditCard} />
        <StatMiniCard label="UPI Expected" value={formatINR(expected.upiExpected)} icon={Smartphone} />
        <StatMiniCard
          label="Total Expected"
          value={formatINR(expected.total)}
          accent="#15803d"
          icon={IndianRupee}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-3">
          {closed ? (
            <div className="flex flex-col items-center py-10 text-center">
              <CheckCircle2 className="h-14 w-14 text-emerald-500" />
              <p className="mt-4 text-lg font-bold text-slate-900">Shift Closed Successfully</p>
              <p className="mt-1 text-sm text-slate-500">
                Variance: {formatINR(variance)} · Handover recorded
              </p>
              <Button
                className="mt-6 bg-emerald-700 hover:bg-emerald-800"
                onClick={() => {
                  setClosed(false);
                  setCashActual("");
                  setNotes("");
                }}
              >
                New Closing
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-emerald-600" />
                <h2 className="text-sm font-semibold text-slate-900">Shift Reconciliation</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Cashier">
                  <TextInput value={currentUser.name} readOnly />
                </FormField>
                <FormField label="Shift">
                  <TextInput value="Evening (10 PM – 6 AM)" readOnly />
                </FormField>
                <FormField label="Cash — Expected">
                  <TextInput value={formatINR(expected.cashExpected)} readOnly />
                </FormField>
                <FormField label="Cash — Actual Count" required>
                  <TextInput
                    type="number"
                    placeholder="0.00"
                    value={cashActual}
                    onChange={(e) => setCashActual(e.target.value)}
                  />
                </FormField>
                <FormField label="Card — Expected">
                  <TextInput value={formatINR(expected.cardExpected)} readOnly />
                </FormField>
                <FormField label="Card — Actual">
                  <TextInput
                    type="number"
                    value={cardActual}
                    onChange={(e) => setCardActual(e.target.value)}
                  />
                </FormField>
                <FormField label="UPI — Expected">
                  <TextInput value={formatINR(expected.upiExpected)} readOnly />
                </FormField>
                <FormField label="UPI — Actual">
                  <TextInput
                    type="number"
                    value={upiActual}
                    onChange={(e) => setUpiActual(e.target.value)}
                  />
                </FormField>
                <FormField label="Refunds" className="sm:col-span-2">
                  <TextInput
                    value={formatINR(currentShiftSummary.refunds)}
                    readOnly
                    className="text-red-600"
                  />
                </FormField>
                <FormField label="Notes" className="sm:col-span-2">
                  <TextInput
                    placeholder="Variance explanation, if any…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </FormField>
              </div>
              <Button
                className="mt-4 w-full bg-emerald-700 hover:bg-emerald-800 sm:w-auto"
                onClick={handleCloseShift}
              >
                Close Shift
              </Button>
            </>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Closing Summary</h2>
          <div className="divide-y divide-slate-100">
            <SummaryRow label="Total Expected" value={formatINR(expected.total)} />
            <SummaryRow label="Actual Counted" value={formatINR(actualTotal)} />
            <SummaryRow
              label="Variance"
              value={formatINR(variance)}
              highlight={variance !== 0}
            />
          </div>
          {variance !== 0 && (
            <p
              className={cn(
                "mt-3 rounded-lg px-3 py-2 text-xs font-medium",
                variance < 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700",
              )}
            >
              {variance < 0 ? "Shortage detected" : "Excess detected"} — review before closing
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Recent Shift Closings</h2>
        <DataTable
          keyField="id"
          data={records}
          columns={[
            { key: "cashier", header: "Cashier", render: (r) => r.cashier },
            { key: "shift", header: "Shift", render: (r) => r.shift },
            { key: "date", header: "Date", render: (r) => r.date },
            { key: "expected", header: "Expected", render: (r) => formatINR(r.expected) },
            { key: "actual", header: "Actual", render: (r) => formatINR(r.actual) },
            {
              key: "variance",
              header: "Variance",
              render: (r) => (
                <span
                  className={cn(
                    "font-medium",
                    r.variance === 0
                      ? "text-emerald-600"
                      : r.variance < 0
                        ? "text-red-600"
                        : "text-amber-600",
                  )}
                >
                  {formatINR(r.variance)}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (r) => (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  {r.status}
                </span>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
