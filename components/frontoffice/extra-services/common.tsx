"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { InHouseGuest, InvoiceRecord } from "@/app/data/frontoffice/modules";
import { reservationService } from "@/services/front-office";
import { Button } from "@/components/ui/Button";
import { CheckoutInvoiceDrawer, type InvoiceData } from "@/components/frontoffice/CheckoutInvoice";
import { Drawer, FormField, SelectInput, TextAreaInput, TextInput } from "@/components/frontoffice/ui";
import type { LucideIcon } from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { cn } from "@/lib/utils";

export function ClickableTable<T extends { id: string }>({
  rows,
  columns,
  onRowClick,
  selectedIds,
  onSelectionChange,
}: {
  rows: T[];
  columns: { key: string; header: string; render: (row: T) => React.ReactNode }[];
  onRowClick: (row: T) => void;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}) {
  const selectable = Boolean(selectedIds && onSelectionChange);
  const selected = selectedIds ?? new Set<string>();
  const allSelected = selectable && rows.length > 0 && rows.every((r) => selected.has(r.id));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  };

  const toggleOne = (id: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  return (
    <>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <div
            key={row.id}
            role="button"
            tabIndex={0}
            onClick={() => onRowClick(row)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onRowClick(row);
              }
            }}
            className="w-full cursor-pointer rounded-xl border border-slate-100 p-4 text-left hover:border-emerald-200 hover:bg-emerald-50/30"
          >
            {selectable && (
              <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selected.has(row.id)}
                  onChange={() => toggleOne(row.id)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                />
              </div>
            )}
            {columns.slice(0, 3).map((col) => (
              <div key={col.key} className="text-sm">{col.render(row)}</div>
            ))}
          </div>
        ))}
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-500">
              {selectable && (
                <th className="w-10 pb-3 pr-2">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                    aria-label="Select all"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th key={col.key} className="pb-3 pr-4">{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick(row)}
                className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-emerald-50/40"
              >
                {selectable && (
                  <td className="py-3.5 pr-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggleOne(row.id)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key} className="py-3.5 pr-4">{col.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", className)}>
      {children}
    </span>
  );
}

export const statusColors: Record<string, string> = {
  Open: "bg-slate-100 text-slate-700",
  "In Progress": "bg-amber-50 text-amber-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Stored: "bg-amber-50 text-amber-700",
  Returned: "bg-emerald-50 text-emerald-700",
  Claimed: "bg-emerald-50 text-emerald-800",
  Scheduled: "bg-emerald-50 text-emerald-800",
  "In Transit": "bg-amber-50 text-amber-700",
  Cancelled: "bg-red-50 text-red-700",
  Paid: "bg-emerald-50 text-emerald-700",
  Partial: "bg-amber-50 text-amber-700",
  Pending: "bg-red-50 text-red-700",
};

export const priorityColors: Record<string, string> = {
  Low: "bg-slate-100 text-slate-600",
  Medium: "bg-emerald-50 text-emerald-800",
  High: "bg-amber-50 text-amber-700",
  Critical: "bg-red-50 text-red-700",
};

export function useModulePage<T extends { id: string }>(
  loader: () => Promise<T[]>,
  searchFn: (item: T, q: string) => boolean,
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [preview, setPreview] = useState<T | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await loader();
        if (!cancelled) {
          setItems(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((item) => searchFn(item, q));
  }, [items, search, searchFn]);

  return { items, setItems, search, setSearch, toast, setToast, formOpen, setFormOpen, preview, setPreview, filtered, loading, error };
}

export function useInHouseGuests() {
  const [guests, setGuests] = useState<InHouseGuest[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await reservationService.inHouse();
        if (!cancelled) setGuests(data as InHouseGuest[]);
      } catch {
        if (!cancelled) setGuests([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return guests;
}

export function invoiceGrandTotal(record: InvoiceRecord) {
  return record.subtotal + record.gst - record.discount;
}

export function invoiceRecordToData(record: InvoiceRecord): InvoiceData {
  const grandTotal = invoiceGrandTotal(record);
  return {
    invoiceNo: record.invoiceNo,
    invoiceDate: record.date,
    discount: record.discount,
    paymentMode: record.paymentMode,
    folio: {
      id: record.id,
      bookingId: record.bookingId,
      guestName: record.guest,
      phone: record.phone,
      email: record.email,
      room: record.room,
      roomType: record.roomType,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      nights: record.nights,
      adults: record.adults,
      children: record.children,
      roomCharges: record.roomCharges,
      restaurantCharges: record.restaurantCharges,
      laundry: record.laundry,
      miniBar: record.miniBar,
      extraBed: record.extraBed,
      otherCharges: record.otherCharges,
      gst: record.gst,
      discount: record.discount,
      advancePaid: record.status === "Paid" ? grandTotal : record.payment,
    },
  };
}

export function ModuleShell({
  toast, setToast, eyebrow = "Front Office", header, stats, search, setSearch, searchPh, filters,
  sort, resultCount, hasActiveAdvancedFilters, onClearAdvancedFilters,
  advancedFilters, selectionBar, children,
}: {
  toast: string | null; setToast: (v: string | null) => void;
  eyebrow?: string;
  header: { title: string; desc: string; btn?: string; onBtn?: () => void };
  stats: { label: string; value: string | number; accent?: string; icon?: LucideIcon; sublabel?: string }[];
  search: string; setSearch: (v: string) => void; searchPh: string;
  filters?: { active: string; onChange: (v: string) => void; options: { id: string; label: string }[] };
  sort?: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] };
  resultCount?: { shown: number; total: number };
  hasActiveAdvancedFilters?: boolean;
  onClearAdvancedFilters?: () => void;
  advancedFilters?: React.ReactNode;
  selectionBar?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <ModulePageShell
      toast={toast}
      onDismissToast={() => setToast(null)}
      eyebrow={eyebrow}
      title={header.title}
      description={header.desc}
      primaryAction={
        header.btn && header.onBtn
          ? { label: header.btn, onClick: header.onBtn }
          : undefined
      }
      stats={stats}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder={searchPh}
      filterPills={filters}
      sort={sort}
      resultCount={resultCount}
      hasActiveAdvancedFilters={hasActiveAdvancedFilters}
      onClearAdvancedFilters={onClearAdvancedFilters}
      advancedFilters={advancedFilters}
      selectionBar={selectionBar}
    >
      {children}
    </ModulePageShell>
  );
}

export function FormDrawer({ open, onClose, title, onSave, children }: {
  open: boolean; onClose: () => void; title: string; onSave: () => void; children: React.ReactNode;
}) {
  return (
    <Drawer open={open} onClose={onClose} title={title} width="md"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button className="bg-emerald-700 hover:bg-emerald-800" onClick={onSave}>Save</Button></>}>
      <div className="space-y-4">{children}</div>
    </Drawer>
  );
}

export function PreviewDrawer({ open, onClose, title, desc, footer, children }: {
  open: boolean; onClose: () => void; title: string; desc?: string; footer?: React.ReactNode; children: React.ReactNode;
}) {
  const [fullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    if (!open) setFullScreen(false);
  }, [open]);

  return (
    <Drawer open={open} onClose={onClose} title={title} description={desc} width="md"
      fullScreen={fullScreen}
      onToggleFullScreen={() => setFullScreen((v) => !v)}
      footer={<><Button variant="outline" onClick={onClose}>Close</Button>{footer}</>}>
      {children}
    </Drawer>
  );
}

export function PreviewGrid({ icon: Icon, rows }: {
  icon: React.ComponentType<{ className?: string }>;
  rows: [string, string | number][];
}) {
  return (
    <dl className="grid grid-cols-1 gap-2 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex gap-3 rounded-lg border border-slate-100 p-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</dt>
            <dd className="mt-0.5 font-medium text-slate-900">{value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
