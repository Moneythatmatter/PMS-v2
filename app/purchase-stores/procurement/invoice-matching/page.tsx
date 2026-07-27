"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Check,
  ShieldCheck,
  AlertCircle,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import {
  TextInput,
  SelectInput,
  TextAreaInput,
  FOPageHeader,
  StatMiniCard,
} from "@/components/frontoffice/ui";
import { ModuleDataTable } from "@/components/pms/ModuleDataTable";
import { ModuleSelectionBar } from "@/components/pms/ModuleSelectionBar";
import { ModuleColumn } from "@/components/pms/module-types";
import { OperationsToolbar, OperationsFilterDrawer } from "@/components/housekeeping/OperationsToolbar";
import { PurchaseFormCard } from "@/components/purchase-stores/ui/PurchaseFormCard";
import {
  INITIAL_INVOICE_RECORDS,
  InvoiceRecord,
} from "@/app/data/invoiceVerificationData";

export default function InvoiceVerificationPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Main Invoice Dataset
  const [invoiceList, setInvoiceList] = useState<InvoiceRecord[]>(INITIAL_INVOICE_RECORDS);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Drawers State
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<InvoiceRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; variant: "success" | "info" | "warning" } | null>(null);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Form State for Verification
  const [auditorComments, setAuditorComments] = useState(
    "100% 3-Way Match verified between PO, GRN and Vendor Tax Invoice."
  );

  // Sync state when activeInvoice opens
  useEffect(() => {
    if (activeInvoice) {
      setAuditorComments(activeInvoice.comments);
    }
  }, [activeInvoice]);

  // Dynamic KPIs
  const metrics = useMemo(() => {
    const pending = invoiceList.filter((i) => i.status === "Pending Verification").length;
    const matched = invoiceList.filter((i) => i.verificationResult === "Matched").length;
    const exceptions = invoiceList.filter((i) => i.verificationResult === "Mismatch").length;
    const approved = invoiceList.filter((i) => i.status === "Approved for Payment").length;

    return { pending, matched, exceptions, approved };
  }, [invoiceList]);

  const statusTabCounts = useMemo(() => ({
    all: invoiceList.length,
    "Pending Verification": invoiceList.filter((i) => i.status === "Pending Verification").length,
    "Approved for Payment": invoiceList.filter((i) => i.status === "Approved for Payment").length,
    Rejected: invoiceList.filter((i) => i.status === "Rejected").length,
  }), [invoiceList]);

  const activeFilterCount = useMemo(() => {
    return resultFilter !== "all" ? 1 : 0;
  }, [resultFilter]);

  const handleResetFilters = () => {
    setResultFilter("all");
  };

  // Filtered Invoice Records
  const filteredInvoices = useMemo(() => {
    return invoiceList.filter((i) => {
      const matchSearch =
        i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        i.vendorName.toLowerCase().includes(search.toLowerCase()) ||
        i.poNumber.toLowerCase().includes(search.toLowerCase()) ||
        i.grnNumber.toLowerCase().includes(search.toLowerCase());

      const matchResult = resultFilter === "all" || i.verificationResult === resultFilter;

      const matchStatus = statusFilter === "all" || i.status === statusFilter;

      return matchSearch && matchResult && matchStatus;
    });
  }, [invoiceList, search, resultFilter, statusFilter]);

  // Verification Action Handlers
  const handleApproveInvoice = (invoice: InvoiceRecord) => {
    setInvoiceList((prev) =>
      prev.map((i) =>
        i.id === invoice.id
          ? {
              ...i,
              status: "Approved for Payment",
              verificationResult: "Approved",
              comments: auditorComments,
            }
          : i
      )
    );
    setActiveInvoice(null);
    setToast({ message: `Invoice ${invoice.invoiceNumber} approved for payment disbursement.`, variant: "success" });
  };

  const handleRejectInvoice = (invoice: InvoiceRecord) => {
    setInvoiceList((prev) =>
      prev.map((i) =>
        i.id === invoice.id
          ? {
              ...i,
              status: "Rejected",
              verificationResult: "Rejected",
              comments: auditorComments,
            }
          : i
      )
    );
    setActiveInvoice(null);
    setToast({ message: `Invoice ${invoice.invoiceNumber} rejected due to price/qty mismatch.`, variant: "warning" });
  };

  // Result Badge Renderer
  const renderResultBadge = (result: InvoiceRecord["verificationResult"]) => {
    switch (result) {
      case "Matched":
      case "Approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            {result}
          </span>
        );
      case "Partial Match":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            Partial Match
          </span>
        );
      case "Mismatch":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            Mismatch Alert
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Rejected
          </span>
        );
    }
  };

  // Columns for ModuleDataTable
  const columns: ModuleColumn[] = [
    {
      key: "invoiceNumber",
      header: "Invoice No",
      render: (r: InvoiceRecord) => <span className="font-mono font-bold text-emerald-800">{r.invoiceNumber}</span>,
    },
    {
      key: "vendorName",
      header: "Vendor Name",
      render: (r: InvoiceRecord) => <span className="font-bold text-slate-900">{r.vendorName}</span>,
    },
    {
      key: "poNumber",
      header: "Purchase Order",
      render: (r: InvoiceRecord) => <span className="font-mono text-slate-700">{r.poNumber}</span>,
    },
    {
      key: "grnNumber",
      header: "Goods Receipt",
      render: (r: InvoiceRecord) => <span className="font-mono text-slate-700">{r.grnNumber}</span>,
    },
    {
      key: "invoiceAmount",
      header: "Invoice Amount",
      align: "right",
      render: (r: InvoiceRecord) => (
        <span className="font-extrabold text-emerald-900">₹{r.invoiceAmount.toLocaleString("en-IN")}</span>
      ),
    },
    {
      key: "verificationResult",
      header: "3-Way Match Result",
      align: "center",
      render: (r: InvoiceRecord) => renderResultBadge(r.verificationResult),
    },
    {
      key: "status",
      header: "Status",
      render: (r: InvoiceRecord) => <span className="font-semibold text-slate-600">{r.status}</span>,
    },
  ];

  return (
    <div className="space-y-6 pb-12 select-none min-h-screen">
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xl animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* PAGE HEADER */}
      <FOPageHeader
        title="Invoice Verification (3-Way Match)"
        description="Automated 3-way reconciliation engine comparing Purchase Orders, Goods Receipt Notes, and Vendor Tax Invoices"
      />

      {/* 2X2 KPI CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatMiniCard
          label="Pending Verification"
          value={metrics.pending.toString()}
          sublabel="Invoices in audit queue"
          icon={Clock}
          accent="#d97706"
        />
        <StatMiniCard
          label="Matched Invoices"
          value={metrics.matched.toString()}
          sublabel="100% 3-way match verified"
          icon={CheckCircle2}
          accent="#059669"
        />
        <StatMiniCard
          label="Discrepancy Exceptions"
          value={metrics.exceptions.toString()}
          sublabel="Price or qty mismatches"
          icon={AlertTriangle}
          accent="#e11d48"
        />
        <StatMiniCard
          label="Approved for Payment"
          value={metrics.approved.toString()}
          sublabel="Passed accounts payable"
          icon={ShieldCheck}
          accent="#0d9488"
        />
      </div>

      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search Invoice #, vendor, PO, GRN..."
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setFilterDrawerOpen(true)}
        statusTabs={[
          { id: "all", label: `All ${statusTabCounts.all}` },
          { id: "Pending Verification", label: `Pending Verification ${statusTabCounts["Pending Verification"]}` },
          { id: "Approved for Payment", label: `Approved for Payment ${statusTabCounts["Approved for Payment"]}` },
          { id: "Rejected", label: `Rejected ${statusTabCounts.Rejected}` },
        ]}
        activeStatusTab={statusFilter}
        onStatusTabChange={setStatusFilter}
        selectionBar={
          <ModuleSelectionBar
            count={selectedIds.size}
            noun="invoice"
            onClear={() => setSelectedIds(new Set())}
            actions={[
              {
                label: "View",
                onClick: () => {
                  const first = filteredInvoices.find((i) => selectedIds.has(i.id));
                  if (first) setSelectedInvoice(first);
                },
              },
              {
                label: "Verify invoice",
                onClick: () => {
                  const first = filteredInvoices.find((i) => selectedIds.has(i.id));
                  if (first) setActiveInvoice(first);
                },
              },
            ]}
          />
        }
      />

      <OperationsFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filter Invoices"
        activeFilterCount={activeFilterCount}
        onReset={handleResetFilters}
      >
        <FormField label="3-Way Match Result">
          <SelectInput
            value={resultFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setResultFilter(e.target.value)}
            className="w-full text-xs rounded-xl h-9 bg-white"
          >
            <option value="all">All Verification Results</option>
            <option value="Matched">Matched</option>
            <option value="Partial Match">Partial Match</option>
            <option value="Mismatch">Mismatch Alert</option>
            <option value="Approved">Approved</option>
          </SelectInput>
        </FormField>
      </OperationsFilterDrawer>

      {/* CORE SHARED MODULE DATA TABLE */}
      <div className="space-y-3">
        <ModuleDataTable
          columns={columns}
          rows={filteredInvoices}
          onRowClick={(r) => setSelectedInvoice(r as InvoiceRecord)}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          renderMobileCard={(r: InvoiceRecord) => (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono font-extrabold text-emerald-800 text-xs">{r.invoiceNumber}</span>
              {renderResultBadge(r.verificationResult)}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">{r.vendorName}</h4>
              <p className="text-[11px] text-slate-500 font-medium">PO: {r.poNumber} • GRN: {r.grnNumber}</p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">{r.invoiceDate}</span>
              <span className="font-extrabold text-emerald-800 text-sm">₹{r.invoiceAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>
        )}
        />
      </div>

      {/* VERIFY INVOICE LARGE RIGHT DRAWER */}
      {activeInvoice && (
        <Drawer
          open={!!activeInvoice}
          onClose={() => setActiveInvoice(null)}
          title={`Verify Invoice: ${activeInvoice.invoiceNumber}`}
          width="responsive"
          footer={
            <div className="flex items-center justify-end gap-2.5 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleRejectInvoice(activeInvoice)}
                className="h-9 px-4 text-xs font-bold border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl cursor-pointer"
              >
                Reject Invoice
              </Button>
              <Button
                type="button"
                onClick={() => handleApproveInvoice(activeInvoice)}
                className="h-9 px-5 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                Approve 3-Way Match
              </Button>
            </div>
          }
        >
          <div className="space-y-5 py-1">
            {/* EXCEPTIONS & DISCREPANCIES ALERT PANEL */}
            {activeInvoice.exceptions.length > 0 && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 space-y-2">
                <h4 className="text-xs font-bold text-rose-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  3-Way Discrepancy Exception Alerts ({activeInvoice.exceptions.length})
                </h4>
                <div className="space-y-1.5">
                  {activeInvoice.exceptions.map((ex) => (
                    <div key={ex.id} className="p-2.5 rounded-lg bg-white border border-rose-200 text-xs space-y-0.5">
                      <div className="flex items-center justify-between font-bold text-rose-900">
                        <span>{ex.type}</span>
                        <span>Variance: ₹{ex.impactAmount.toLocaleString("en-IN")}</span>
                      </div>
                      <p className="text-[11px] text-slate-600">{ex.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SIDE-BY-SIDE 3-WAY MATCH MATRIX PANEL */}
            <PurchaseFormCard title="Side-by-Side 3-Way Match Matrix (PO vs GRN vs Invoice)" sectionNumber="Audit Comparison">
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Line Description</th>
                      <th className="px-3 py-2 text-center bg-blue-50/50">PO Qty / Rate</th>
                      <th className="px-3 py-2 text-center bg-teal-50/50">GRN Received</th>
                      <th className="px-3 py-2 text-center bg-amber-50/50">Invoice Billed</th>
                      <th className="px-3 py-2 text-right">Match Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {activeInvoice.matchLines.map((line) => (
                      <tr key={line.id}>
                        <td className="px-3 py-2.5 font-bold text-slate-900">{line.description}</td>
                        <td className="px-3 py-2.5 text-center bg-blue-50/30">
                          {line.poQty} pcs @ ₹{line.poRate}
                        </td>
                        <td className="px-3 py-2.5 text-center bg-teal-50/30 font-bold text-teal-900">
                          {line.grnQty} pcs ({line.grnStatus})
                        </td>
                        <td className="px-3 py-2.5 text-center bg-amber-50/30 font-extrabold text-slate-900">
                          {line.invoiceQty} pcs @ ₹{line.invoiceRate}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold">
                          {line.isMatched ? (
                            <span className="text-emerald-700 flex items-center justify-end gap-1">
                              <Check className="h-3.5 w-3.5" /> 100% Match
                            </span>
                          ) : (
                            <span className="text-rose-600 flex items-center justify-end gap-1">
                              <AlertCircle className="h-3.5 w-3.5" /> Variance
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PurchaseFormCard>

            {/* AUDITOR COMMENTS */}
            <PurchaseFormCard title="Auditor Notes & Override Comments" sectionNumber="Sign-off Notes">
              <TextAreaInput
                rows={3}
                value={auditorComments}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAuditorComments(e.target.value)}
                placeholder="Enter audit notes or resolution comments..."
                className="w-full text-xs p-3 border-slate-300 rounded-lg"
              />
            </PurchaseFormCard>
          </div>
        </Drawer>
      )}

      {/* VIEW DETAILS DRAWER */}
      {selectedInvoice && (
        <Drawer
          open={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Invoice Details: ${selectedInvoice.invoiceNumber}`}
          width="lg"
        >
          <div className="space-y-6 pb-6 select-none">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-extrabold text-emerald-900">{selectedInvoice.invoiceNumber}</span>
                {renderResultBadge(selectedInvoice.verificationResult)}
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Vendor: {selectedInvoice.vendorName}</h3>
              <p className="text-xs text-slate-500">PO: {selectedInvoice.poNumber} • GRN: {selectedInvoice.grnNumber}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 text-xs">
              <div className="flex justify-between font-extrabold text-sm text-slate-900">
                <span>Tax Invoice Amount</span>
                <span className="text-emerald-900">₹{selectedInvoice.invoiceAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => setSelectedInvoice(null)}
              className="w-full h-9 text-xs font-bold !bg-slate-900 text-white rounded-xl shadow-xs cursor-pointer"
            >
              Close Details View
            </Button>
          </div>
        </Drawer>
      )}
    </div>
  );
}
