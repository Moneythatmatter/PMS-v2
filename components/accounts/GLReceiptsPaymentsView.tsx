"use client";

import React, { useState, useMemo } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Printer,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  Search,
  Calendar,
  Filter,
  Loader2,
  FileText,
  CreditCard,
  Building2,
  Receipt,
  X,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  StatMiniCard,
  Drawer,
  FODatePicker,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  sampleGLReceiptsPaymentsData,
  sampleBankCashLedgers,
  sampleOppositeLedgers,
  samplePaymentModes,
  GLReceiptPaymentVoucher,
} from "@/app/data/accounts/glReceiptsPaymentsData";
import { cn } from "@/lib/utils";

interface FormLineItem {
  id: string;
  accountLedger: string;
  partyName: string;
  amount: number;
  lineNarration: string;
}

export function GLReceiptsPaymentsView() {
  // Mobile Filter Drawer State
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Voucher Form State
  const [vouchType, setVouchType] = useState<"Receipt" | "Payment">("Receipt");
  const [vouchDt, setVouchDt] = useState("2026-04-28");
  const [vouchNo, setVouchNo] = useState("RCP-2026-0047");
  const [bankCashLedger, setBankCashLedger] = useState("YES BANK A/c #9012");
  const [paymentMode, setPaymentMode] = useState<string>("Credit Card / EDC");
  const [instrumentNo, setInstrumentNo] = useState("EDC-TXN-10492");
  const [overallNarration, setOverallNarration] = useState(
    "Being daily cashier collection posting into General Ledger"
  );

  // Line items state
  const [lineItems, setLineItems] = useState<FormLineItem[]>([
    {
      id: "line-1",
      accountLedger: "Room Sales Revenue",
      partyName: "Guest Folio #1092 - Mr. David Miller",
      amount: 28500,
      lineNarration: "Room settlement via YES BANK EDC machine",
    },
  ]);

  // Audit Log History List & Filters
  const [vouchers, setVouchers] = useState<GLReceiptPaymentVoucher[]>(
    sampleGLReceiptsPaymentsData
  );
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [historyTypeFilter, setHistoryTypeFilter] = useState<"<ALL>" | "Receipt" | "Payment">("<ALL>");

  // Loading & Toast Notification State
  const [isPosting, setIsPosting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Calculate Total Line Items Amount
  const totalVoucherAmount = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [lineItems]);

  // Handle Type Change (Switching Receipt / Payment updates Voucher # prefix)
  const handleTypeChange = (newType: "Receipt" | "Payment") => {
    setVouchType(newType);
    if (newType === "Receipt") {
      setVouchNo("RCP-2026-0047");
    } else {
      setVouchNo("PAY-2026-0093");
    }
  };

  // Add Line Item
  const handleAddLineItem = () => {
    const newLine: FormLineItem = {
      id: `line-${Date.now()}`,
      accountLedger: "Food & Beverage Revenue",
      partyName: "",
      amount: 0,
      lineNarration: "",
    };
    setLineItems([...lineItems, newLine]);
  };

  // Remove Line Item
  const handleRemoveLineItem = (id: string) => {
    if (lineItems.length === 1) {
      alert("At least one detail line item is required for voucher entry.");
      return;
    }
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  // Update Line Item Field
  const handleUpdateLineItem = (
    id: string,
    field: keyof FormLineItem,
    value: any
  ) => {
    setLineItems(
      lineItems.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Submit & Post Voucher
  const handlePostVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalVoucherAmount <= 0) {
      alert("Please enter a valid voucher amount greater than zero.");
      return;
    }

    setIsPosting(true);

    setTimeout(() => {
      const newVoucher: GLReceiptPaymentVoucher = {
        id: `rp-${Date.now()}`,
        vouchNo: vouchNo,
        vouchDt: vouchDt,
        type: vouchType,
        bankCashLedger: bankCashLedger,
        paymentMode: paymentMode as any,
        instrumentNo: instrumentNo,
        partyName: lineItems[0]?.partyName || "General Account Posting",
        accountLedger: lineItems[0]?.accountLedger || "Room Sales Revenue",
        amount: totalVoucherAmount,
        narration: overallNarration,
        status: "Posted",
      };

      setVouchers([newVoucher, ...vouchers]);
      setIsPosting(false);
      setToastMessage(
        `${vouchType} Voucher ${vouchNo} for ${formatINR(totalVoucherAmount)} posted successfully into General Ledger.`
      );

      // Reset form for next entry
      if (vouchType === "Receipt") {
        setVouchNo("RCP-2026-0048");
      } else {
        setVouchNo("PAY-2026-0094");
      }
      setLineItems([
        {
          id: `line-${Date.now()}`,
          accountLedger: "Room Sales Revenue",
          partyName: "",
          amount: 0,
          lineNarration: "",
        },
      ]);
    }, 450);
  };

  // Filtered History Data
  const filteredHistory = useMemo(() => {
    return vouchers.filter((item) => {
      if (historyTypeFilter !== "<ALL>" && item.type !== historyTypeFilter)
        return false;
      if (historySearchQuery) {
        const q = historySearchQuery.toLowerCase();
        return (
          item.vouchNo.toLowerCase().includes(q) ||
          item.partyName.toLowerCase().includes(q) ||
          item.accountLedger.toLowerCase().includes(q) ||
          item.bankCashLedger.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [vouchers, historyTypeFilter, historySearchQuery]);

  // Today's Totals
  const todayReceiptsTotal = useMemo(() => {
    return vouchers
      .filter((v) => v.type === "Receipt" && v.status === "Posted")
      .reduce((sum, v) => sum + v.amount, 0);
  }, [vouchers]);

  const todayPaymentsTotal = useMemo(() => {
    return vouchers
      .filter((v) => v.type === "Payment" && v.status === "Posted")
      .reduce((sum, v) => sum + v.amount, 0);
  }, [vouchers]);

  const netCashFlow = todayReceiptsTotal - todayPaymentsTotal;

  return (
    <ModulePageShell
      eyebrow="Accounts & Daily Cashier Transactions"
      title="GL Receipts / Payments Transaction"
      description="Post daily cashier collections, guest settlements, and vendor payments into General Ledger cash & bank accounts."
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-medium bg-white shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Print Voucher
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => alert("Voucher history exported to CSV.")}
            className="rounded-xl text-xs font-medium bg-white shadow-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export CSV
          </Button>
        </div>
      }
    >
      {/* KPI Cards Grid */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatMiniCard
          label="Today's Receipts Collected"
          value={formatINR(todayReceiptsTotal)}
          sublabel="Total cash/bank inflow vouchers"
          accent="#16a34a"
          icon={TrendingUp}
        />
        <StatMiniCard
          label="Today's Payments Disbursed"
          value={formatINR(todayPaymentsTotal)}
          sublabel="Total vendor & utility disbursements"
          accent="#e11d48"
          icon={TrendingDown}
        />
        <StatMiniCard
          label="Net Cash & Bank Flow"
          value={`${netCashFlow >= 0 ? "+" : ""}${formatINR(netCashFlow)}`}
          sublabel="Net cash position change today"
          accent="#0284c7"
          icon={Wallet}
        />
      </div>

      {/* Voucher Posting Entry Form Card */}
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl font-bold text-white text-xs shadow-2xs transition-all",
                vouchType === "Receipt" ? "bg-emerald-600" : "bg-rose-600"
              )}
            >
              {vouchType === "Receipt" ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Post {vouchType} Voucher
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Enter cashier transaction header and sub-ledger allocation details.
              </p>
            </div>
          </div>

          {/* Transaction Type Segmented Pills */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => handleTypeChange("Receipt")}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer select-none",
                vouchType === "Receipt"
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              ✓ Receipt (Inflow)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("Payment")}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer select-none",
                vouchType === "Payment"
                  ? "bg-rose-700 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              ✓ Payment (Outflow)
            </button>
          </div>
        </div>

        {/* Voucher Header Form Controls Grid */}
        <form onSubmit={handlePostVoucher} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70">
            <FormField label="Voucher No">
              <TextInput
                value={vouchNo}
                onChange={(e) => setVouchNo(e.target.value)}
                readOnly
                className="h-8 text-xs font-bold bg-white text-emerald-800 border-slate-200"
              />
            </FormField>

            <FormField label="Voucher Date">
              <FODatePicker
                value={vouchDt}
                onChange={(val) => setVouchDt(val)}
              />
            </FormField>

            <FormField label="Cash / Bank Account">
              <select
                value={bankCashLedger}
                onChange={(e) => setBankCashLedger(e.target.value)}
                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none"
              >
                {sampleBankCashLedgers.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Payment Mode">
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 font-semibold focus:border-emerald-500 focus:outline-none"
              >
                {samplePaymentModes.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Ref / Instrument No" className="sm:col-span-2">
              <TextInput
                value={instrumentNo}
                onChange={(e) => setInstrumentNo(e.target.value)}
                placeholder="Cheque #, UTR #, or EDC approval code..."
                className="h-8 text-xs bg-white"
              />
            </FormField>

            <FormField label="Overall Voucher Narration" className="sm:col-span-2">
              <TextInput
                value={overallNarration}
                onChange={(e) => setOverallNarration(e.target.value)}
                placeholder="Enter complete voucher description..."
                className="h-8 text-xs bg-white"
              />
            </FormField>
          </div>

          {/* Sub-Ledger Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-emerald-600" />
                Voucher Allocation Breakdown ({lineItems.length} lines)
              </h3>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLineItem}
                className="rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Line Item
              </Button>
            </div>

            {/* Line Items Table (Desktop) */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="px-3 py-2 w-10 text-center">#</th>
                    <th className="px-3 py-2 min-w-[180px]">Account Ledger</th>
                    <th className="px-3 py-2 min-w-[180px]">Party / Sub-Ledger</th>
                    <th className="px-3 py-2 w-32 text-right">Amount (₹)</th>
                    <th className="px-3 py-2 min-w-[200px]">Line Narration</th>
                    <th className="px-3 py-2 w-12 text-center">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {lineItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-center text-slate-400 font-bold">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={item.accountLedger}
                          onChange={(e) =>
                            handleUpdateLineItem(item.id, "accountLedger", e.target.value)
                          }
                          className="h-7 w-full rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none"
                        >
                          {sampleOppositeLedgers.map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <TextInput
                          list="party-suggestions"
                          value={item.partyName}
                          onChange={(e) =>
                            handleUpdateLineItem(item.id, "partyName", e.target.value)
                          }
                          placeholder="Select party or type folio..."
                          className="h-7 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.amount || ""}
                          onChange={(e) =>
                            handleUpdateLineItem(
                              item.id,
                              "amount",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0.00"
                          className="h-7 w-full rounded-md border border-slate-200 px-2 text-right text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <TextInput
                          value={item.lineNarration}
                          onChange={(e) =>
                            handleUpdateLineItem(item.id, "lineNarration", e.target.value)
                          }
                          placeholder="Line item description..."
                          className="h-7 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Party Suggestions Datalist Dropdown */}
            <datalist id="party-suggestions">
              <option value="Guest Folio #1042 - Mr. Rajesh Kumar" />
              <option value="MakeMyTrip India Pvt Ltd" />
              <option value="Fresh Foods Supplies Ltd" />
              <option value="CleanLinen Laundry Co." />
              <option value="State Electricity Distribution Board" />
              <option value="Agoda International" />
              <option value="Walk-in Guest - Cash Settlement" />
            </datalist>

            {/* Mobile Line Items Stack */}
            <div className="md:hidden space-y-2">
              {lineItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white p-3 space-y-2"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-xs font-bold text-slate-700">Line Item #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(item.id)}
                      className="text-rose-600 text-xs font-bold flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Account Ledger:</label>
                      <select
                        value={item.accountLedger}
                        onChange={(e) =>
                          handleUpdateLineItem(item.id, "accountLedger", e.target.value)
                        }
                        className="h-7 w-full rounded-md border border-slate-200 bg-white px-2 text-xs font-medium"
                      >
                        {sampleOppositeLedgers.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Party / Sub-Ledger:</label>
                      <TextInput
                        list="party-suggestions"
                        value={item.partyName}
                        onChange={(e) =>
                          handleUpdateLineItem(item.id, "partyName", e.target.value)
                        }
                        placeholder="Select party or type folio..."
                        className="h-7 text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500">Amount (₹):</label>
                      <input
                        type="number"
                        value={item.amount || ""}
                        onChange={(e) =>
                          handleUpdateLineItem(
                            item.id,
                            "amount",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0.00"
                        className="h-7 w-full rounded-md border border-slate-200 px-2 text-right text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Voucher Value Banner & Submit */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50/70 p-3.5 border border-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" />
                <div>
                  <span className="text-xs text-emerald-900 font-semibold block">
                    Total Voucher Value:
                  </span>
                  <span className="text-lg font-black text-emerald-950">
                    {formatINR(totalVoucherAmount)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setLineItems([
                      {
                        id: `line-${Date.now()}`,
                        accountLedger: "Room Sales Revenue",
                        partyName: "",
                        amount: 0,
                        lineNarration: "",
                      },
                    ])
                  }
                  className="rounded-xl text-xs font-semibold bg-white"
                >
                  Clear Form
                </Button>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isPosting}
                  className={cn(
                    "rounded-xl font-bold text-xs px-4 shadow-sm text-white cursor-pointer disabled:opacity-75",
                    vouchType === "Receipt"
                      ? "bg-emerald-700 hover:bg-emerald-800"
                      : "bg-rose-700 hover:bg-rose-800"
                  )}
                >
                  {isPosting ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <Receipt className="h-3.5 w-3.5 mr-1" />
                  )}
                  Post {vouchType} Voucher
                </Button>
              </div>
            </div>
          </div>
        </form>
      </section>

      {/* Recent Receipts & Payments History Table */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent Posted Vouchers Log
            </h2>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Type Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
              {(["<ALL>", "Receipt", "Payment"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setHistoryTypeFilter(t)}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-all cursor-pointer select-none",
                    historyTypeFilter === t
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Search Filter */}
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                placeholder="Search voucher # or party..."
                className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Desktop History Table (hidden md:block) */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="px-3.5 py-2.5">Voucher #</th>
                <th className="px-3 py-2.5">Date</th>
                <th className="px-3 py-2.5 text-center">Type</th>
                <th className="px-3.5 py-2.5">Cash / Bank Account</th>
                <th className="px-3.5 py-2.5">Party / Ledger</th>
                <th className="px-3 py-2.5">Mode</th>
                <th className="px-3.5 py-2.5 text-right">Amount (₹)</th>
                <th className="px-3.5 py-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredHistory.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-3.5 py-2.5 font-bold text-slate-900">{row.vouchNo}</td>
                  <td className="px-3 py-2.5 text-slate-600">{row.vouchDt}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={cn(
                        "inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider",
                        row.type === "Receipt"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-rose-100 text-rose-800 border-rose-300"
                      )}
                    >
                      {row.type}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 font-semibold text-slate-800">
                    {row.bankCashLedger}
                  </td>
                  <td className="px-3.5 py-2.5 font-semibold text-slate-900">
                    {row.partyName}
                    <span className="block text-[10px] text-slate-400 font-normal">
                      {row.accountLedger}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{row.paymentMode}</td>
                  <td
                    className={cn(
                      "px-3.5 py-2.5 text-right font-bold text-xs",
                      row.type === "Receipt" ? "text-emerald-700" : "text-rose-700"
                    )}
                  >
                    {formatINR(row.amount)}
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile History Card List (md:hidden) */}
        <div className="md:hidden space-y-2.5">
          {filteredHistory.map((row) => (
            <div
              key={row.id}
              className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">{row.vouchNo}</span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider",
                    row.type === "Receipt"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-rose-100 text-rose-800 border-rose-300"
                  )}
                >
                  {row.type}
                </span>
              </div>

              <p className="text-xs font-semibold text-slate-800">{row.partyName}</p>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <span className="text-slate-500 font-medium">{row.vouchDt} • {row.paymentMode}</span>
                <span
                  className={cn(
                    "font-bold text-xs",
                    row.type === "Receipt" ? "text-emerald-700" : "text-rose-700"
                  )}
                >
                  {formatINR(row.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </ModulePageShell>
  );
}
