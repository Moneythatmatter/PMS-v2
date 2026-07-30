"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormSection,
  FormField,
  TextInput,
  SelectInput,
  TextAreaInput,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";

interface JournalRow {
  id: string;
  type: "Dr" | "Cr";
  account: string;
  debit: string;
  credit: string;
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
    debit: "10,000.00",
    credit: "0.00",
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
    debit: "0.00",
    credit: "10,000.00",
    narration: "Daily room posting",
    chequeNo: "",
    chequeDate: "",
    analysis: "Revenue",
    gst: "18%",
  },
];

export function GLTransactionView() {
  const [rows, setRows] = useState<JournalRow[]>(initialRows);
  const [showMoreActions, setShowMoreActions] = useState(false);

  const handleAddRow = () => {
    const newRow: JournalRow = {
      id: `row-${Date.now()}`,
      type: "Dr",
      account: "",
      debit: "0.00",
      credit: "0.00",
      narration: "",
      chequeNo: "",
      chequeDate: "",
      analysis: "General",
      gst: "0%",
    };
    setRows([...rows, newRow]);
  };

  const handleDeleteRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((r) => r.id !== id));
  };

  return (
    <ModulePageShell
      eyebrow="Accounts"
      title="GL Transaction"
      description="Create and manage General Ledger accounting transactions."
      wrapChildren={false}
    >
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-4">
        <Link href="/dashboard" className="hover:text-emerald-700 transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <Link href="/accounts" className="hover:text-emerald-700 transition-colors">
          Accounts
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span>Transaction</span>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="text-slate-900 font-semibold">GL Transaction</span>
      </div>

      {/* Top Action Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
            <FileText className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Voucher Entry</h2>
            <p className="text-[11px] text-slate-500">General Ledger Journal Entry</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setRows(initialRows)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            New
          </Button>
          <Button type="button" size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white">
            <Save className="h-3.5 w-3.5 mr-1" />
            Save
          </Button>
          <Button type="button" variant="outline" size="sm">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            Save & New
          </Button>
          <Button type="button" variant="outline" size="sm">
            <X className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Cancel
          </Button>
          <Button type="button" variant="outline" size="sm">
            <Printer className="h-3.5 w-3.5 mr-1" />
            Print
          </Button>
          <Button type="button" variant="outline" size="sm">
            <Download className="h-3.5 w-3.5 mr-1" />
            Export
          </Button>

          {/* More Actions Dropdown */}
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowMoreActions(!showMoreActions)}
            >
              More Actions
              <ChevronDown className="h-3.5 w-3.5 ml-1" />
            </Button>
            {showMoreActions && (
              <div className="absolute right-0 mt-1 z-30 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => setShowMoreActions(false)}
                  className="w-full px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Reverse Voucher
                </button>
                <button
                  type="button"
                  onClick={() => setShowMoreActions(false)}
                  className="w-full px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Attach Documents
                </button>
                <button
                  type="button"
                  onClick={() => setShowMoreActions(false)}
                  className="w-full px-3 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
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
          <SelectInput defaultValue="Journal Voucher">
            <option value="Journal Voucher">Journal Voucher</option>
            <option value="Receipt Voucher">Receipt Voucher</option>
            <option value="Payment Voucher">Payment Voucher</option>
            <option value="Contra Voucher">Contra Voucher</option>
          </SelectInput>
        </FormField>

        <FormField label="Transaction Date" required>
          <TextInput type="date" defaultValue="2026-07-27" />
        </FormField>

        <FormField label="Voucher Number (Auto Generated)">
          <TextInput defaultValue="VCH-2026-001" readOnly disabled className="bg-slate-50 text-slate-500 cursor-not-allowed" />
        </FormField>

        <FormField label="Reference Number">
          <TextInput placeholder="e.g. REF-88492" />
        </FormField>

        <FormField label="Common Narration">
          <TextInput placeholder="Enter common transaction narration..." />
        </FormField>

        <FormField label="Status" required>
          <SelectInput defaultValue="Draft">
            <option value="Draft">Draft</option>
            <option value="Posted">Posted</option>
          </SelectInput>
        </FormField>
      </FormSection>

      {/* Section 2 — Journal Entry Table */}
      <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Section 2 — Journal Entry</h2>
            <p className="text-xs text-slate-500">Enter debit and credit line items for this voucher.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleAddRow}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Row
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-3 py-2.5 w-20">Dr / Cr</th>
                <th className="px-3 py-2.5 min-w-[200px]">Account Name</th>
                <th className="px-3 py-2.5 w-32">Debit Amount</th>
                <th className="px-3 py-2.5 w-32">Credit Amount</th>
                <th className="px-3 py-2.5 min-w-[180px]">Narration</th>
                <th className="px-3 py-2.5 w-32">Cheque No.</th>
                <th className="px-3 py-2.5 w-36">Cheque Date</th>
                <th className="px-3 py-2.5 w-32">Analysis</th>
                <th className="px-3 py-2.5 w-24">GST</th>
                <th className="px-3 py-2.5 w-12 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-2">
                    <SelectInput defaultValue={row.type} className="h-8 text-xs">
                      <option value="Dr">Dr</option>
                      <option value="Cr">Cr</option>
                    </SelectInput>
                  </td>
                  <td className="p-2">
                    <SelectInput defaultValue={row.account} className="h-8 text-xs">
                      <option value="">Select Account...</option>
                      <option value="1010 - Cash in Hand">1010 - Cash in Hand</option>
                      <option value="1020 - HDFC Bank A/c">1020 - HDFC Bank A/c</option>
                      <option value="2001 - Accounts Payable">2001 - Accounts Payable</option>
                      <option value="4001 - Room Sales Revenue">4001 - Room Sales Revenue</option>
                      <option value="5001 - Food & Beverage Expense">5001 - Food & Beverage Expense</option>
                    </SelectInput>
                  </td>
                  <td className="p-2">
                    <TextInput defaultValue={row.debit} className="h-8 text-xs text-right font-medium" />
                  </td>
                  <td className="p-2">
                    <TextInput defaultValue={row.credit} className="h-8 text-xs text-right font-medium" />
                  </td>
                  <td className="p-2">
                    <TextInput defaultValue={row.narration} placeholder="Line narration..." className="h-8 text-xs" />
                  </td>
                  <td className="p-2">
                    <TextInput defaultValue={row.chequeNo} placeholder="CHQ-..." className="h-8 text-xs" />
                  </td>
                  <td className="p-2">
                    <TextInput type="date" defaultValue={row.chequeDate} className="h-8 text-xs" />
                  </td>
                  <td className="p-2">
                    <SelectInput defaultValue={row.analysis} className="h-8 text-xs">
                      <option value="General">General</option>
                      <option value="Front Office">Front Office</option>
                      <option value="Housekeeping">Housekeeping</option>
                      <option value="F&B">F&B</option>
                    </SelectInput>
                  </td>
                  <td className="p-2">
                    <SelectInput defaultValue={row.gst} className="h-8 text-xs">
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
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
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

      {/* Section 3 — Footer Summary */}
      <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Debit</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">10,000.00</p>
          <p className="mt-0.5 text-[11px] text-emerald-700 font-medium">Balanced DR entry</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Credit</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">10,000.00</p>
          <p className="mt-0.5 text-[11px] text-emerald-700 font-medium">Balanced CR entry</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-emerald-800">Difference</p>
            <Scale className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-1 text-xl font-bold tracking-tight text-emerald-900">0.00</p>
          <p className="mt-0.5 text-[11px] text-emerald-700 font-semibold">Voucher is in balance</p>
        </div>
      </section>

      {/* Section 4 — Line Narration */}
      <FormSection title="Section 4 — Line Narration" columns={1}>
        <FormField label="Line Narration Details">
          <TextAreaInput
            rows={4}
            placeholder="Enter detailed line narration or explanatory notes for auditor reference..."
          />
        </FormField>
      </FormSection>
    </ModulePageShell>
  );
}
