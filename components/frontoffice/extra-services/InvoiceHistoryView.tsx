"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Download, FileText } from "lucide-react";
import type { InvoiceRecord } from "@/app/data/frontoffice/modules";
import { invoiceService } from "@/services/front-office";
import { Button } from "@/components/ui/Button";
import { CheckoutInvoiceDrawer } from "@/components/frontoffice/CheckoutInvoice";
import {
  AlertBanner,
  FOPageHeader,
  FOSearchToolbar,
  FormField,
  SelectInput,
  StatMiniCard,
  formatINR,
} from "@/components/frontoffice/ui";
import {
  Pill,
  invoiceGrandTotal,
  invoiceRecordToData,
  statusColors,
  useModulePage,
} from "./common";

function parseInvoiceDate(date: string) {
  return new Date(date).getTime();
}

function SelectableInvoiceTable({
  rows,
  selected,
  allSelected,
  onToggle,
  onToggleAll,
  onRowClick,
}: {
  rows: InvoiceRecord[];
  selected: Set<string>;
  allSelected: boolean;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onRowClick: (row: InvoiceRecord) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        No invoices match your search or filters.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex gap-3 rounded-xl border border-slate-100 p-4"
          >
            <input
              type="checkbox"
              checked={selected.has(row.id)}
              onChange={() => onToggle(row.id)}
              onClick={(e) => e.stopPropagation()}
              className="mt-1 rounded border-slate-300"
              aria-label={`Select invoice ${row.invoiceNo}`}
            />
            <div
              role="button"
              tabIndex={0}
              onClick={() => onRowClick(row)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onRowClick(row);
                }
              }}
              className="min-w-0 flex-1 cursor-pointer text-left"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-emerald-700">{row.invoiceNo}</span>
                <Pill className={statusColors[row.status]}>{row.status}</Pill>
              </div>
              <p className="mt-1 font-medium text-slate-900">{row.guest}</p>
              <p className="text-xs text-slate-400">Room {row.room} · {row.roomType}</p>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="font-medium">{formatINR(invoiceGrandTotal(row))}</span>
                <span className="text-xs text-slate-500">{row.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="pb-3 pr-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  className="rounded border-slate-300"
                  aria-label="Select all invoices"
                />
              </th>
              <th className="pb-3 pr-4">Invoice No</th>
              <th className="pb-3 pr-4">Guest</th>
              <th className="pb-3 pr-4">Amount</th>
              <th className="pb-3 pr-4">GST</th>
              <th className="pb-3 pr-4">Date</th>
              <th className="pb-3 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick(row)}
                className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-emerald-50/40"
              >
                <td className="py-3.5 pr-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => onToggle(row.id)}
                    className="rounded border-slate-300"
                    aria-label={`Select invoice ${row.invoiceNo}`}
                  />
                </td>
                <td className="py-3.5 pr-4">
                  <span className="font-mono text-xs font-semibold text-emerald-700">{row.invoiceNo}</span>
                </td>
                <td className="py-3.5 pr-4">
                  <p className="font-medium">{row.guest}</p>
                  <p className="text-xs text-slate-400">Room {row.room} · {row.roomType}</p>
                </td>
                <td className="py-3.5 pr-4">
                  <p className="font-medium">{formatINR(invoiceGrandTotal(row))}</p>
                  {row.status === "Partial" && (
                    <p className="text-xs text-amber-600">Paid {formatINR(row.payment)}</p>
                  )}
                </td>
                <td className="py-3.5 pr-4">{formatINR(row.gst)}</td>
                <td className="py-3.5 pr-4">{row.date}</td>
                <td className="py-3.5 pr-4">
                  <Pill className={statusColors[row.status]}>{row.status}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function InvoiceHistoryView() {
  const { items, search, setSearch, toast, setToast, preview, setPreview, filtered } =
    useModulePage(() => invoiceService.list(), (r, q) =>
      r.invoiceNo.toLowerCase().includes(q) ||
      r.guest.toLowerCase().includes(q) ||
      r.room.includes(q) ||
      r.bookingId.toLowerCase().includes(q));

  const [statusFilter, setStatusFilter] = useState("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const roomTypes = useMemo(
    () => [...new Set(items.map((r) => r.roomType))].sort(),
    [items],
  );
  const paymentModes = useMemo(
    () => [...new Set(items.map((r) => r.paymentMode).filter((m) => m !== "—"))].sort(),
    [items],
  );

  const list = useMemo(() => {
    let rows = filtered.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (roomTypeFilter !== "all" && r.roomType !== roomTypeFilter) return false;
      if (paymentFilter !== "all" && r.paymentMode !== paymentFilter) return false;
      return true;
    });

    rows = [...rows].sort((a, b) => {
      if (sortBy === "newest") return parseInvoiceDate(b.date) - parseInvoiceDate(a.date);
      if (sortBy === "oldest") return parseInvoiceDate(a.date) - parseInvoiceDate(b.date);
      if (sortBy === "amount-desc") return invoiceGrandTotal(b) - invoiceGrandTotal(a);
      if (sortBy === "amount-asc") return invoiceGrandTotal(a) - invoiceGrandTotal(b);
      return 0;
    });

    return rows;
  }, [filtered, statusFilter, roomTypeFilter, paymentFilter, sortBy]);

  const allSelected = list.length > 0 && list.every((r) => selected.has(r.id));

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(list.map((r) => r.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportSelected = () => {
    const rows = list
      .filter((r) => selected.has(r.id))
      .map((r) =>
        `${r.invoiceNo},${r.guest},${r.room},${r.roomType},${invoiceGrandTotal(r)},${r.gst},${r.status},${r.date},${r.paymentMode}`,
      );
    const csv = [
      "Invoice No,Guest,Room,Room Type,Amount,GST,Status,Date,Payment Mode",
      ...rows,
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoices.csv";
    a.click();
    URL.revokeObjectURL(url);
    setToast(`${selected.size} invoice${selected.size !== 1 ? "s" : ""} exported as CSV.`);
  };

  const handleBulkDownload = () => {
    setToast(`Downloading ${selected.size} invoice PDF${selected.size !== 1 ? "s" : ""}…`);
  };

  const invoiceData = preview ? invoiceRecordToData(preview) : null;
  const outstanding = items
    .filter((r) => r.status !== "Paid")
    .reduce((s, r) => s + invoiceGrandTotal(r) - r.payment, 0);

  const hasActiveFilters =
    roomTypeFilter !== "all" ||
    paymentFilter !== "all" ||
    sortBy !== "newest";

  const clearFilters = () => {
    setRoomTypeFilter("all");
    setPaymentFilter("all");
    setSortBy("newest");
  };

  return (
    <div className="space-y-5">
      {toast && <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />}
      <FOPageHeader
        eyebrow="Front Office"
        title="Invoice History"
        description="Browse, preview, and download past tax invoices."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatMiniCard
          label="Total Invoices"
          value={items.length}
          accent="#15803d"
          icon={FileText}
          sublabel={`${items.length} tax invoices on record`}
        />
        <StatMiniCard
          label="Paid"
          value={items.filter((r) => r.status === "Paid").length}
          accent="#10b981"
          icon={CheckCircle2}
          sublabel="Fully settled"
        />
        <StatMiniCard
          label="Outstanding"
          value={formatINR(outstanding)}
          accent="#ef4444"
          icon={AlertCircle}
          sublabel={`${items.filter((r) => r.status !== "Paid").length} unpaid / partial`}
        />
      </div>

      <FOSearchToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search invoice no, guest, room, or booking…"
        filterPills={{
          active: statusFilter,
          onChange: setStatusFilter,
          options: [
            { id: "all", label: "All" },
            { id: "Paid", label: "Paid" },
            { id: "Partial", label: "Partial" },
            { id: "Pending", label: "Pending" },
          ],
        }}
        hasActiveAdvancedFilters={hasActiveFilters}
        onClearAdvancedFilters={clearFilters}
        advancedFilters={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Room Type">
              <SelectInput value={roomTypeFilter} onChange={(e) => setRoomTypeFilter(e.target.value)}>
                <option value="all">All room types</option>
                {roomTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </SelectInput>
            </FormField>
            <FormField label="Payment Mode">
              <SelectInput value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                <option value="all">All payment modes</option>
                {paymentModes.map((mode) => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </SelectInput>
            </FormField>
            <FormField label="Sort By">
              <SelectInput value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="amount-desc">Amount: high to low</option>
                <option value="amount-asc">Amount: low to high</option>
              </SelectInput>
            </FormField>
            <FormField label="Showing">
              <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
                {list.length} of {items.length} invoices
              </div>
            </FormField>
          </div>
        }
        selectionBar={
          selected.size > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3">
              <span className="text-sm font-medium text-emerald-900">
                {selected.size} invoice{selected.size !== 1 ? "s" : ""} selected
              </span>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 bg-white" onClick={handleExportSelected}>
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 bg-white" onClick={handleBulkDownload}>
                  <Download className="h-3.5 w-3.5" />
                  Download PDF
                </Button>
                <button
                  type="button"
                  className="text-xs font-medium text-emerald-700 hover:underline"
                  onClick={() => setSelected(new Set())}
                >
                  Clear selection
                </button>
              </div>
            </div>
          ) : undefined
        }
      />

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <SelectableInvoiceTable
          rows={list}
          selected={selected}
          allSelected={allSelected}
          onToggle={toggleOne}
          onToggleAll={toggleAll}
          onRowClick={setPreview}
        />
      </div>

      <CheckoutInvoiceDrawer
        open={!!preview}
        onClose={() => setPreview(null)}
        data={invoiceData}
      />
    </div>
  );
}
