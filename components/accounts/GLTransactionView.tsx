"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Plus,
  Save,
  X,
  Printer,
  Download,
  ChevronDown,
  Trash2,
  CheckCircle2,
  FileText,
  Scale,
  Paperclip,
  RotateCcw,
  History,
  AlertCircle,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormSection,
  FormField,
  TextInput,
  SelectInput,
  TextAreaInput,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { cn } from "@/lib/utils";

interface JournalRow {
  id: string;
  type: "Dr" | "Cr";
  account: string;
  debit: number;
  credit: number;
  narration: string;
  chequeNo: string;
  chequeDate: string;
  analysis: string;
  gst: string;
}

const initialRows: JournalRow[] = [
  {
    id: "row-1",
    type: "Dr",
    account: "1010 - Cash in Hand",
    debit: 10000,
    credit: 0,
    narration: "Room sales cash receipt",
    chequeNo: "",
    chequeDate: "",
    analysis: "Front Office",
    gst: "0%",
  },
  {
    id: "row-2",
    type: "Cr",
    account: "4001 - Room Sales Revenue",
    debit: 0,
    credit: 10000,
    narration: "Daily room posting",
    chequeNo: "",
    chequeDate: "",
    analysis: "Revenue",
    gst: "18%",
  },
];

export function GLTransactionView() {
  // Voucher Metadata State
  const [voucherType, setVoucherType] = useState("Journal Voucher");
  const [transactionDate, setTransactionDate] = useState("2026-07-27");
  const [voucherNumberIndex, setVoucherNumberIndex] = useState(1);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [commonNarration, setCommonNarration] = useState("");
  const [status, setStatus] = useState("Draft");
  const [lineNarrationDetails, setLineNarrationDetails] = useState("");

  // Journal Entry Line Items State
  const [rows, setRows] = useState<JournalRow[]>(initialRows);

  // Dropdowns & Modals State
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showPrinterDialog, setShowPrinterDialog] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState("Canon MF230 Series UFRII LT");
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showAuditHistoryModal, setShowAuditHistoryModal] = useState(false);
  const [showAttachModal, setShowAttachModal] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Current Voucher Number string
  const currentVoucherNo = useMemo(() => {
    const pad = String(voucherNumberIndex).padStart(3, "0");
    let prefix = "VCH";
    if (voucherType === "Payment Voucher") prefix = "PAY";
    else if (voucherType === "Receipt Voucher") prefix = "RCP";
    else if (voucherType === "Contra Voucher") prefix = "CTR";
    return `${prefix}-2026-${pad}`;
  }, [voucherNumberIndex, voucherType]);

  // Live Calculation of Totals
  const totalDebit = useMemo(() => {
    return rows.reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
  }, [rows]);

  const totalCredit = useMemo(() => {
    return rows.reduce((sum, r) => sum + (Number(r.credit) || 0), 0);
  }, [rows]);

  const difference = useMemo(() => {
    return Math.abs(totalDebit - totalCredit);
  }, [totalDebit, totalCredit]);

  const isBalanced = useMemo(() => {
    return totalDebit > 0 && totalDebit === totalCredit;
  }, [totalDebit, totalCredit]);

  // Row Manipulation Handlers
  const handleAddRow = () => {
    const newRow: JournalRow = {
      id: `row-${Date.now()}`,
      type: "Dr",
      account: "",
      debit: 0,
      credit: 0,
      narration: "",
      chequeNo: "",
      chequeDate: "",
      analysis: "General",
      gst: "0%",
    };
    setRows([...rows, newRow]);
  };

  const handleDeleteRow = (id: string) => {
    if (rows.length <= 1) {
      setToastMessage("At least one journal line item is required.");
      return;
    }
    setRows(rows.filter((r) => r.id !== id));
  };

  const handleUpdateRow = (id: string, field: keyof JournalRow, value: any) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };
        // Clear counterpart if debit/credit edited
        if (field === "debit" && Number(value) > 0) {
          updated.credit = 0;
        } else if (field === "credit" && Number(value) > 0) {
          updated.debit = 0;
        }
        return updated;
      })
    );
  };

  // Button Action Handler: + New
  const handleNewVoucher = () => {
    const nextIdx = voucherNumberIndex + 1;
    setVoucherNumberIndex(nextIdx);
    setReferenceNumber("");
    setCommonNarration("");
    setLineNarrationDetails("");
    setStatus("Draft");
    setRows([
      {
        id: `row-${Date.now()}-1`,
        type: "Dr",
        account: "",
        debit: 0,
        credit: 0,
        narration: "",
        chequeNo: "",
        chequeDate: "",
        analysis: "General",
        gst: "0%",
      },
      {
        id: `row-${Date.now()}-2`,
        type: "Cr",
        account: "",
        debit: 0,
        credit: 0,
        narration: "",
        chequeNo: "",
        chequeDate: "",
        analysis: "General",
        gst: "0%",
      },
    ]);
    const nextNo = `VCH-2026-${String(nextIdx).padStart(3, "0")}`;
    setToastMessage(`Prepared fresh GL Voucher entry (${nextNo}).`);
  };

  // Button Action Handler: Save
  const handleSaveVoucher = () => {
    if (!isBalanced) {
      setToastMessage(
        `Cannot Save: Total Debit (${formatINR(totalDebit)}) does not equal Total Credit (${formatINR(
          totalCredit
        )}). Difference: ${formatINR(difference)}`
      );
      return;
    }
    setStatus("Posted");
    setToastMessage(`GL Journal Voucher ${currentVoucherNo} saved & posted successfully!`);
  };

  // Button Action Handler: Save & New
  const handleSaveAndNewVoucher = () => {
    if (!isBalanced) {
      setToastMessage(
        `Cannot Save: Total Debit (${formatINR(totalDebit)}) does not equal Total Credit (${formatINR(
          totalCredit
        )}).`
      );
      return;
    }
    const savedNo = currentVoucherNo;
    const nextIdx = voucherNumberIndex + 1;
    setVoucherNumberIndex(nextIdx);
    setReferenceNumber("");
    setCommonNarration("");
    setLineNarrationDetails("");
    setStatus("Draft");
    setRows([
      {
        id: `row-${Date.now()}-1`,
        type: "Dr",
        account: "1010 - Cash in Hand",
        debit: 0,
        credit: 0,
        narration: "",
        chequeNo: "",
        chequeDate: "",
        analysis: "General",
        gst: "0%",
      },
      {
        id: `row-${Date.now()}-2`,
        type: "Cr",
        account: "4001 - Room Sales Revenue",
        debit: 0,
        credit: 0,
        narration: "",
        chequeNo: "",
        chequeDate: "",
        analysis: "General",
        gst: "0%",
      },
    ]);
    const nextNo = `VCH-2026-${String(nextIdx).padStart(3, "0")}`;
    setToastMessage(`Voucher ${savedNo} saved! Prepared next entry ${nextNo}.`);
  };

  // Button Action Handler: Cancel
  const handleCancelVoucher = () => {
    setRows(initialRows);
    setReferenceNumber("");
    setCommonNarration("");
    setLineNarrationDetails("");
    setStatus("Draft");
    setToastMessage(`Cancelled edits for ${currentVoucherNo}. Reverted to original state.`);
  };

  // Button Action Handler: Print
  const handlePrintVoucher = () => {
    setShowPrinterDialog(true);
  };

  const handleConfirmPrinterDialog = () => {
    setShowPrinterDialog(false);
    setShowPrintPreview(true);
    setTimeout(() => {
      window.print();
      setToastMessage(`Sent ${currentVoucherNo} to printer '${selectedPrinter}'.`);
    }, 150);
  };

  // Button Action Handler: Export
  const handleExportCSV = () => {
    const csvHeader = "Type,Account,Debit,Credit,Narration,ChequeNo,ChequeDate,Analysis,GST\n";
    const csvRows = rows
      .map(
        (r) =>
          `"${r.type}","${r.account}","${r.debit}","${r.credit}","${r.narration}","${r.chequeNo}","${r.chequeDate}","${r.analysis}","${r.gst}"`
      )
      .join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentVoucherNo}_Journal_Entry.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage(`Exported ${currentVoucherNo} to CSV file.`);
  };

  // More Actions Handlers
  const handleReverseVoucher = () => {
    setShowMoreActions(false);
    setStatus("Reversed");
    setToastMessage(`Voucher ${currentVoucherNo} marked as REVERSED in GL Audit.`);
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & General Ledger"
      title="GL Transaction"
      description="Create, post, and manage General Ledger journal transaction vouchers."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Transaction", href: "/accounts/transaction" },
        { label: "GL Transaction" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
    >
      {/* Top Action Buttons Bar (Matching Image 1 & 2) */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <FileText className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Voucher Entry ({currentVoucherNo})</h2>
            <p className="text-[11px] text-slate-500 font-medium">
              General Ledger {voucherType.replace(" Voucher", "")} Entry
            </p>
          </div>
        </div>

        {/* Working Action Buttons (Image 2 Buttons Bar) */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNewVoucher}
            className="rounded-xl border-slate-300 text-xs font-bold hover:bg-slate-50 bg-white text-slate-800"
          >
            <Plus className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            + New
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSaveVoucher}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            Save
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveAndNewVoucher}
            className="rounded-xl border-slate-300 text-xs font-bold hover:bg-slate-50 bg-white text-slate-800"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            Save & New
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancelVoucher}
            className="rounded-xl border-slate-300 text-xs font-semibold hover:bg-slate-50 bg-white text-slate-700"
          >
            <X className="h-3.5 w-3.5 mr-1 text-slate-400" />
            Cancel
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrintVoucher}
            className="rounded-xl border-slate-300 text-xs font-semibold hover:bg-slate-50 bg-white text-slate-700"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-600" />
            Print
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="rounded-xl border-slate-300 text-xs font-semibold hover:bg-slate-50 bg-white text-slate-700"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-600" />
            Export
          </Button>

          {/* More Actions Dropdown */}
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowMoreActions(!showMoreActions)}
              className="rounded-xl border-slate-300 text-xs font-semibold bg-white text-slate-800"
            >
              More Actions
              <ChevronDown className="h-3.5 w-3.5 ml-1 text-slate-500" />
            </Button>

            {showMoreActions && (
              <div className="absolute right-0 mt-1.5 z-30 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl animate-in fade-in-50">
                <button
                  type="button"
                  onClick={handleReverseVoucher}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reverse Voucher
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreActions(false);
                    setShowAttachModal(true);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Paperclip className="h-3.5 w-3.5 text-slate-500" />
                  Attach Documents
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreActions(false);
                    setShowAuditHistoryModal(true);
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <History className="h-3.5 w-3.5 text-slate-500" />
                  Audit History
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 1 — Transaction Information */}
      <FormSection title="Section 1 — Transaction Information" columns={3} className="mb-4">
        <FormField label="Transaction Type" required>
          <SelectInput value={voucherType} onChange={(e) => setVoucherType(e.target.value)}>
            <option value="Journal Voucher">Journal Voucher</option>
            <option value="Receipt Voucher">Receipt Voucher</option>
            <option value="Payment Voucher">Payment Voucher</option>
            <option value="Contra Voucher">Contra Voucher</option>
          </SelectInput>
        </FormField>

        <FormField label="Transaction Date" required>
          <TextInput
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
          />
        </FormField>

        <FormField label="Voucher Number (Auto Generated)">
          <TextInput
            value={currentVoucherNo}
            readOnly
            disabled
            className="bg-slate-50 font-mono font-bold text-slate-900 cursor-not-allowed"
          />
        </FormField>

        <FormField label="Reference Number">
          <TextInput
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="e.g. REF-88492"
          />
        </FormField>

        <FormField label="Common Narration">
          <TextInput
            value={commonNarration}
            onChange={(e) => setCommonNarration(e.target.value)}
            placeholder="Enter common transaction narration..."
          />
        </FormField>

        <FormField label="Status" required>
          <SelectInput value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Draft">Draft</option>
            <option value="Posted">Posted</option>
            <option value="Reversed">Reversed</option>
          </SelectInput>
        </FormField>
      </FormSection>

      {/* Section 2 — Journal Entry Table */}
      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Section 2 — {voucherType.replace(" Voucher", "")} Entry
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Enter debit and credit line items for this voucher.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRow}
            className="rounded-xl text-xs font-bold bg-white text-emerald-700 border-slate-300 hover:bg-emerald-50"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Row
          </Button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-3 py-2.5 w-20 border-r border-slate-200">Dr / Cr</th>
                <th className="px-3.5 py-2.5 min-w-[200px] border-r border-slate-200">Account Name</th>
                <th className="px-3 py-2.5 w-32 text-right border-r border-slate-200">Debit Amount</th>
                <th className="px-3 py-2.5 w-32 text-right border-r border-slate-200">Credit Amount</th>
                <th className="px-3.5 py-2.5 min-w-[180px] border-r border-slate-200">Narration</th>
                <th className="px-3 py-2.5 w-32 border-r border-slate-200">Cheque No.</th>
                <th className="px-3 py-2.5 w-36 border-r border-slate-200">Cheque Date</th>
                <th className="px-3 py-2.5 w-32 border-r border-slate-200">Analysis</th>
                <th className="px-3 py-2.5 w-24 border-r border-slate-200">GST</th>
                <th className="px-3 py-2.5 w-12 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-amber-50/60 transition-colors">
                  <td className="p-2 border-r border-slate-100">
                    <SelectInput
                      value={row.type}
                      onChange={(e) => handleUpdateRow(row.id, "type", e.target.value)}
                      className="h-8 text-xs font-bold text-slate-800"
                    >
                      <option value="Dr">Dr</option>
                      <option value="Cr">Cr</option>
                    </SelectInput>
                  </td>
                  <td className="p-2 border-r border-slate-100">
                    <SelectInput
                      value={row.account}
                      onChange={(e) => handleUpdateRow(row.id, "account", e.target.value)}
                      className="h-8 text-xs font-semibold text-slate-900"
                    >
                      <option value="">Select Account...</option>
                      <option value="1010 - Cash in Hand">1010 - Cash in Hand</option>
                      <option value="1020 - HDFC Bank A/c">1020 - HDFC Bank A/c</option>
                      <option value="2001 - Accounts Payable">2001 - Accounts Payable</option>
                      <option value="4001 - Room Sales Revenue">4001 - Room Sales Revenue</option>
                      <option value="4002 - Food & Beverage Sales">4002 - Food & Beverage Sales</option>
                      <option value="5001 - Food & Beverage Expense">5001 - Food & Beverage Expense</option>
                    </SelectInput>
                  </td>
                  <td className="p-2 border-r border-slate-100">
                    <TextInput
                      type="number"
                      value={row.debit || ""}
                      onChange={(e) => handleUpdateRow(row.id, "debit", parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="h-8 text-xs text-right font-bold text-slate-900"
                    />
                  </td>
                  <td className="p-2 border-r border-slate-100">
                    <TextInput
                      type="number"
                      value={row.credit || ""}
                      onChange={(e) => handleUpdateRow(row.id, "credit", parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="h-8 text-xs text-right font-bold text-slate-900"
                    />
                  </td>
                  <td className="p-2 border-r border-slate-100">
                    <TextInput
                      value={row.narration}
                      onChange={(e) => handleUpdateRow(row.id, "narration", e.target.value)}
                      placeholder="Line narration..."
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="p-2 border-r border-slate-100">
                    <TextInput
                      value={row.chequeNo}
                      onChange={(e) => handleUpdateRow(row.id, "chequeNo", e.target.value)}
                      placeholder="CHQ-..."
                      className="h-8 text-xs font-mono"
                    />
                  </td>
                  <td className="p-2 border-r border-slate-100">
                    <TextInput
                      type="date"
                      value={row.chequeDate}
                      onChange={(e) => handleUpdateRow(row.id, "chequeDate", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </td>
                  <td className="p-2 border-r border-slate-100">
                    <SelectInput
                      value={row.analysis}
                      onChange={(e) => handleUpdateRow(row.id, "analysis", e.target.value)}
                      className="h-8 text-xs"
                    >
                      <option value="General">General</option>
                      <option value="Front Office">Front Office</option>
                      <option value="Housekeeping">Housekeeping</option>
                      <option value="F&B">F&B</option>
                    </SelectInput>
                  </td>
                  <td className="p-2 border-r border-slate-100">
                    <SelectInput
                      value={row.gst}
                      onChange={(e) => handleUpdateRow(row.id, "gst", e.target.value)}
                      className="h-8 text-xs"
                    >
                      <option value="0%">0%</option>
                      <option value="5%">5%</option>
                      <option value="12%">12%</option>
                      <option value="18%">18%</option>
                    </SelectInput>
                  </td>
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(row.id)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      title="Delete row"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 3 — Dynamic Footer Totals Summary */}
      <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Debit</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-slate-900 font-mono">
            {formatINR(totalDebit)}
          </p>
          <p className="mt-0.5 text-[11px] text-emerald-700 font-semibold">Live DR Entry Sum</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Credit</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-slate-900 font-mono">
            {formatINR(totalCredit)}
          </p>
          <p className="mt-0.5 text-[11px] text-emerald-700 font-semibold">Live CR Entry Sum</p>
        </div>

        <div
          className={cn(
            "rounded-2xl border p-4 shadow-xs transition-colors",
            isBalanced
              ? "border-emerald-200 bg-emerald-50/60"
              : "border-rose-200 bg-rose-50/60"
          )}
        >
          <div className="flex items-center justify-between">
            <p
              className={cn(
                "text-xs font-bold uppercase tracking-wider",
                isBalanced ? "text-emerald-800" : "text-rose-800"
              )}
            >
              Difference
            </p>
            <Scale
              className={cn(
                "h-4 w-4",
                isBalanced ? "text-emerald-600" : "text-rose-600"
              )}
            />
          </div>
          <p
            className={cn(
              "mt-1 text-xl font-bold tracking-tight font-mono",
              isBalanced ? "text-emerald-900" : "text-rose-900"
            )}
          >
            {formatINR(difference)}
          </p>
          <p
            className={cn(
              "mt-0.5 text-[11px] font-bold",
              isBalanced ? "text-emerald-700" : "text-rose-700"
            )}
          >
            {isBalanced
              ? "✓ Voucher is in balance"
              : `⚠ Imbalanced by ${formatINR(difference)}`}
          </p>
        </div>
      </section>

      {/* Section 4 — Line Narration */}
      <FormSection title="Section 4 — Line Narration" columns={1}>
        <FormField label="Line Narration Details">
          <TextAreaInput
            rows={3}
            value={lineNarrationDetails}
            onChange={(e) => setLineNarrationDetails(e.target.value)}
            placeholder="Enter detailed line narration or explanatory notes for auditor reference..."
          />
        </FormField>
      </FormSection>

      {/* Printer Selection Dialog Modal */}
      {showPrinterDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50 print:hidden">
          <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-2xl border border-slate-300 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold text-slate-800">Print Voucher</h3>
              <button
                type="button"
                onClick={() => setShowPrinterDialog(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Printer Name:</label>
                <select
                  value={selectedPrinter}
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                  className="w-full rounded border border-slate-300 bg-white p-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Canon MF230 Series UFRII LT">Canon MF230 Series UFRII LT</option>
                  <option value="Fax">Fax</option>
                  <option value="Microsoft Print to PDF">Microsoft Print to PDF</option>
                  <option value="OneNote for Windows 10">OneNote for Windows 10</option>
                  <option value="AnyDesk Printer">AnyDesk Printer</option>
                </select>
              </div>

              <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200 text-[11px] space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Target Voucher:</span>
                  <span className="font-semibold text-slate-900">{currentVoucherNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{transactionDate}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmPrinterDialog}
                className="px-4 h-7 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
              >
                OK
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPrinterDialog(false)}
                className="px-4 h-7 text-xs font-semibold text-slate-600"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Formatted Printable Voucher Document Sheet Modal */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50 print:relative print:inset-auto print:z-auto print:bg-white print:p-0 print:block">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto print:max-w-none print:w-full print:p-0 print:border-none print:shadow-none">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Print Journal Voucher ({currentVoucherNo})
              </h3>
              <button
                type="button"
                onClick={() => setShowPrintPreview(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Journal Voucher Document */}
            <div className="rounded-xl border border-slate-300 bg-white p-6 shadow-xs space-y-4 font-sans text-slate-900">
              <div className="text-center space-y-1 border-b border-slate-300 pb-3">
                <h1 className="text-lg font-bold tracking-wide text-slate-900 font-sans">
                  Luxy hotel
                </h1>
                <p className="text-[11px] text-slate-600">
                  Luxy Hotel GACL Chowkdi, Dahej Bharuch Main Road, Dahej, Dist Bharuch. Gujarat Gujarat 392130
                </p>
                <p className="text-[11px] font-bold text-slate-800">
                  JOURNAL VOUCHER STATEMENT
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p><strong>Voucher No:</strong> {currentVoucherNo}</p>
                  <p><strong>Voucher Type:</strong> {voucherType}</p>
                  <p><strong>Reference No:</strong> {referenceNumber || "N/A"}</p>
                </div>
                <div className="text-right">
                  <p><strong>Voucher Date:</strong> {transactionDate}</p>
                  <p><strong>Status:</strong> {status}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b border-slate-300">
                      <th className="px-3 py-1.5 border-r border-slate-300">Type</th>
                      <th className="px-3 py-1.5 border-r border-slate-300">Account Name</th>
                      <th className="px-3 py-1.5 text-right border-r border-slate-300">Debit Amount (₹)</th>
                      <th className="px-3 py-1.5 text-right">Credit Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {rows.map((r, idx) => (
                      <tr key={idx} className="h-8">
                        <td className="px-3 py-1.5 border-r border-slate-200 font-bold">{r.type}</td>
                        <td className="px-3 py-1.5 border-r border-slate-200">{r.account || "N/A"}</td>
                        <td className="px-3 py-1.5 text-right border-r border-slate-200 font-mono">
                          {r.debit.toFixed(2)}
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono">
                          {r.credit.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t border-slate-300">
                      <td colSpan={2} className="px-3 py-2 text-right uppercase">Total:</td>
                      <td className="px-3 py-2 text-right border-r border-slate-300 font-mono">{totalDebit.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-mono">{totalCredit.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="text-xs border border-slate-300 p-2.5 rounded bg-slate-50">
                <strong>Narration:</strong> {commonNarration || lineNarrationDetails || "No narration provided."}
              </div>

              <div className="pt-8 grid grid-cols-3 gap-4 text-center text-xs text-slate-800 font-semibold">
                <div><p className="border-t border-slate-400 pt-1">Prepared By</p></div>
                <div><p className="border-t border-slate-400 pt-1">Checked By</p></div>
                <div><p className="border-t border-slate-400 pt-1">Authorized Manager</p></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit History Modal */}
      {showAuditHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Voucher Audit History</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditHistoryModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900">Voucher Created</p>
                <p className="text-[11px] text-slate-500">27/07/2026 10:15 AM by Admin (ABHIJIT)</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900">Last Modified</p>
                <p className="text-[11px] text-slate-500">30/07/2026 05:38 PM by Accounts Head</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="button" size="sm" onClick={() => setShowAuditHistoryModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Attach Documents Modal */}
      {showAttachModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Attach Supporting Documents</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAttachModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 p-6 text-center rounded-xl bg-slate-50 space-y-2">
              <Paperclip className="h-6 w-6 text-slate-400 mx-auto" />
              <p className="font-semibold text-slate-700">Drag & Drop receipt files or click to browse</p>
              <p className="text-[10px] text-slate-400">Supports PDF, PNG, JPG up to 10MB</p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setShowAttachModal(false);
                  setToastMessage("Attached 1 document to voucher.");
                }}
                className="bg-emerald-700 text-white font-bold"
              >
                Upload Document
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAttachModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
