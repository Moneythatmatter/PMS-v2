"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Clock,
  AlertTriangle,
  ShieldCheck,
  XCircle,
  IndianRupee,
  Boxes,
  Plus,
  Search,
  RotateCcw,
  Printer,
  Download,
  Upload,
  MoreVertical,
  CheckCircle2,
  FileSpreadsheet,
  Building2,
  Layers,
  Box,
  Thermometer,
  QrCode,
  Barcode,
  Users,
  Check,
  ArrowRight,
  Sparkles,
  Bell,
  Zap,
  ArrowRightLeft,
  Trash2,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import {
  TextInput,
  SelectInput,
  FormField,
  FOPageHeader,
  StatMiniCard,
} from "@/components/frontoffice/ui";
import { OperationsToolbar, OperationsFilterDrawer } from "@/components/housekeeping/OperationsToolbar";
import { ModuleDataTable } from "@/components/pms/ModuleDataTable";
import { ModuleSelectionBar } from "@/components/pms/ModuleSelectionBar";
import { ModuleColumn } from "@/components/pms/module-types";
import {
  INITIAL_BATCH_RECORDS,
  BatchRecord,
  ExpiryStatus,
} from "@/app/data/batchData";

export default function BatchFEFOExpiryControlPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Main Dataset State
  const [batchList, setBatchList] = useState<BatchRecord[]>(INITIAL_BATCH_RECORDS);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (warehouseFilter !== "all") n += 1;
    if (categoryFilter !== "all") n += 1;
    if (supplierFilter !== "all") n += 1;
    if (dateFilter) n += 1;
    return n;
  }, [warehouseFilter, categoryFilter, supplierFilter, dateFilter]);

  const handleResetFilters = () => {
    setWarehouseFilter("all");
    setCategoryFilter("all");
    setSupplierFilter("all");
    setDateFilter("");
  };

  // Selected Batch for View Drawer
  const [selectedBatch, setSelectedBatch] = useState<BatchRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [alertsOpen, setAlertsOpen] = useState(false);

  // Filtered Batch Records
  const filteredBatches = useMemo(() => {
    return batchList.filter((b) => {
      const matchSearch =
        b.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
        b.itemCode.toLowerCase().includes(search.toLowerCase()) ||
        b.itemName.toLowerCase().includes(search.toLowerCase()) ||
        b.supplier.toLowerCase().includes(search.toLowerCase()) ||
        b.grnNumber.toLowerCase().includes(search.toLowerCase());

      const matchWarehouse = warehouseFilter === "all" || b.warehouse.toLowerCase().includes(warehouseFilter.toLowerCase());
      const matchCategory = categoryFilter === "all" || b.category.toLowerCase().includes(categoryFilter.toLowerCase());
      const matchSupplier = supplierFilter === "all" || b.supplier.toLowerCase().includes(supplierFilter.toLowerCase());
      const matchStatus = statusFilter === "all" || b.status === statusFilter;
      const matchDate = !dateFilter || b.expiryDate.includes(dateFilter);

      return (
        matchSearch &&
        matchWarehouse &&
        matchCategory &&
        matchSupplier &&
        matchStatus &&
        matchDate
      );
    });
  }, [batchList, search, warehouseFilter, categoryFilter, supplierFilter, statusFilter, dateFilter]);

  const statusCounts = useMemo(() => {
    const count = (status: string) => batchList.filter((b) => b.status === status).length;
    return {
      all: batchList.length,
      Fresh: count("Fresh"),
      "Near Expiry": count("Near Expiry"),
      "Expiring Soon": count("Expiring Soon"),
      Expired: count("Expired"),
      Blocked: count("Blocked"),
      Disposed: count("Disposed"),
    };
  }, [batchList]);

  const fefoBatch = useMemo(
    () =>
      batchList.find((b) => b.isFEFORecommended) ??
      [...batchList].sort((a, b) => a.daysRemaining - b.daysRemaining)[0] ??
      null,
    [batchList],
  );

  const nearExpiryCount = useMemo(
    () => batchList.filter((b) => b.status === "Near Expiry" || b.daysRemaining <= 1).length,
    [batchList],
  );
  const expiringWeekCount = useMemo(
    () => batchList.filter((b) => b.status === "Expiring Soon" || (b.daysRemaining > 1 && b.daysRemaining <= 7)).length,
    [batchList],
  );
  const alertCount = nearExpiryCount + expiringWeekCount + (fefoBatch ? 1 : 0);

  // Shared badge style
  const badgeClass = (tone: "success" | "danger" | "warning" | "info" | "neutral" | "orange") => {
    const tones = {
      success: "bg-emerald-50 text-emerald-700 border-emerald-200",
      danger: "bg-red-50 text-red-700 border-red-200",
      warning: "bg-amber-50 text-amber-800 border-amber-200",
      orange: "bg-orange-50 text-orange-800 border-orange-200",
      info: "bg-blue-50 text-blue-700 border-blue-200",
      neutral: "bg-slate-50 text-slate-600 border-slate-200",
    };
    return cn(
      "inline-flex items-center whitespace-nowrap px-2 py-0.5 text-[10px] font-bold rounded-md border",
      tones[tone],
    );
  };

  const renderStatusBadge = (status: ExpiryStatus, isFEFO: boolean) => {
    if (isFEFO) {
      return <span className={badgeClass("info")}>FEFO</span>;
    }
    switch (status) {
      case "Fresh":
        return <span className={badgeClass("success")}>Fresh</span>;
      case "Near Expiry":
        return <span className={badgeClass("warning")}>Near Expiry</span>;
      case "Expiring Soon":
        return <span className={badgeClass("orange")}>Expiring Soon</span>;
      case "Expired":
        return <span className={badgeClass("danger")}>Expired</span>;
      case "Blocked":
        return <span className={badgeClass("neutral")}>Blocked</span>;
      default:
        return <span className={badgeClass("neutral")}>Disposed</span>;
    }
  };

  const renderDaysBadge = (days: number) => {
    const tone = days <= 3 ? "danger" : days <= 7 ? "warning" : "neutral";
    return <span className={badgeClass(tone)}>{days} days</span>;
  };

  // ModuleDataTable Columns
  const columns: ModuleColumn[] = [
    {
      key: "batchNumber",
      header: "Batch Number",
      render: (r: BatchRecord) => (
        <span className="font-mono font-semibold text-slate-900">{r.batchNumber}</span>
      ),
    },
    {
      key: "itemCode",
      header: "Item Code",
      render: (r: BatchRecord) => <span className="font-mono text-xs text-slate-600">{r.itemCode}</span>,
    },
    {
      key: "itemName",
      header: "Item Name",
      render: (r: BatchRecord) => (
        <div>
          <span className="block text-xs font-semibold text-slate-900">{r.itemName}</span>
          <span className="text-[11px] text-slate-500">{r.category}</span>
        </div>
      ),
    },
    {
      key: "warehouse",
      header: "Warehouse & Bin",
      render: (r: BatchRecord) => (
        <div>
          <span className="block text-xs font-medium text-slate-800">{r.warehouse}</span>
          <span className="font-mono text-[11px] text-emerald-700">{r.bin}</span>
        </div>
      ),
    },
    {
      key: "supplier",
      header: "Supplier",
      render: (r: BatchRecord) => <span className="text-xs text-slate-700">{r.supplier}</span>,
    },
    {
      key: "grnNumber",
      header: "GRN No",
      render: (r: BatchRecord) => (
        <span className="font-mono text-xs font-medium text-slate-700">{r.grnNumber}</span>
      ),
    },
    {
      key: "mfgDate",
      header: "Mfg Date",
      render: (r: BatchRecord) => <span className="text-xs text-slate-600">{r.mfgDate}</span>,
    },
    {
      key: "expiryDate",
      header: "Expiry Date",
      render: (r: BatchRecord) => (
        <span
          className={cn(
            "text-xs font-semibold",
            r.daysRemaining <= 3 ? "text-red-600" : r.daysRemaining <= 7 ? "text-amber-700" : "text-slate-700",
          )}
        >
          {r.expiryDate}
        </span>
      ),
    },
    {
      key: "daysRemaining",
      header: "Days Left",
      render: (r: BatchRecord) => renderDaysBadge(r.daysRemaining),
    },
    {
      key: "availableQty",
      header: "Available Qty",
      render: (r: BatchRecord) => (
        <span className="text-xs font-semibold text-slate-900">
          {r.availableQty} {r.unit}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r: BatchRecord) => renderStatusBadge(r.status, r.isFEFORecommended),
    },
  ];

  if (!isMounted) return null;

  return (
    <div className="space-y-5 pb-12 select-none">
      <FOPageHeader
        eyebrow="Inventory"
        title="Batch & Expiry"
        description="Monitor batches, shelf life, and FEFO priority for issuance."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setAlertsOpen(true)}
              className="relative"
              title="Alerts"
            >
              <Bell className="h-4 w-4" />
              {alertCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                  {alertCount > 9 ? "9+" : alertCount}
                </span>
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setBatchList([...INITIAL_BATCH_RECORDS])}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => alert("Exporting batch expiry report…")}
            >
              <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
              Export
            </Button>
            <Button
              type="button"
              size="sm"
              className="!bg-emerald-700 hover:!bg-emerald-800"
              onClick={() => alert("Generating expiry audit report…")}
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Expiry report
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatMiniCard
          label="Active batches"
          value={batchList.length}
          icon={Boxes}
          accent="#0f8a5f"
          sublabel="Tracked lots"
        />
        <StatMiniCard
          label="Expiring soon"
          value={batchList.filter((b) => b.status === "Expiring Soon" || b.status === "Near Expiry").length}
          icon={Clock}
          accent="#d97706"
          sublabel="Issue first (FEFO)"
        />
        <StatMiniCard
          label="Expired / blocked"
          value={batchList.filter((b) => b.status === "Expired" || b.status === "Blocked").length}
          icon={XCircle}
          accent="#dc2626"
          sublabel="Do not issue"
        />
        <StatMiniCard
          label="At-risk value"
          value={`₹${batchList
            .filter((b) => ["Near Expiry", "Expiring Soon", "Expired"].includes(b.status))
            .reduce((sum, b) => sum + b.stockValue, 0)
            .toLocaleString("en-IN")}`}
          icon={IndianRupee}
          accent="#b45309"
          sublabel="Needs action"
        />
      </div>

      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search batch, item, supplier…"
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setFilterDrawerOpen(true)}
        statusTabs={[
          { id: "all", label: `All ${statusCounts.all}` },
          { id: "Fresh", label: `Fresh ${statusCounts.Fresh}` },
          { id: "Near Expiry", label: `Near Expiry ${statusCounts["Near Expiry"]}` },
          { id: "Expiring Soon", label: `Expiring Soon ${statusCounts["Expiring Soon"]}` },
          { id: "Expired", label: `Expired ${statusCounts.Expired}` },
          { id: "Blocked", label: `Blocked ${statusCounts.Blocked}` },
          { id: "Disposed", label: `Disposed ${statusCounts.Disposed}` },
        ]}
        activeStatusTab={statusFilter}
        onStatusTabChange={setStatusFilter}
        selectionBar={
          <ModuleSelectionBar
            count={selectedIds.size}
            noun="batch"
            onClear={() => setSelectedIds(new Set())}
            actions={[
              {
                label: "View",
                onClick: () => {
                  const first = filteredBatches.find((b) => selectedIds.has(b.id));
                  if (first) setSelectedBatch(first);
                },
              },
              {
                label: "Transfer",
                onClick: () => {
                  const first = filteredBatches.find((b) => selectedIds.has(b.id));
                  if (first) alert(`Initiating Batch Transfer for ${first.batchNumber}`);
                },
              },
              {
                label: "Block",
                onClick: () => {
                  const first = filteredBatches.find((b) => selectedIds.has(b.id));
                  if (first) alert(`Blocking Batch ${first.batchNumber} from issuance`);
                },
              },
              {
                label: "Print label",
                icon: <Printer className="h-3.5 w-3.5" />,
                onClick: () => {
                  const first = filteredBatches.find((b) => selectedIds.has(b.id));
                  if (first) alert(`Printing Barcode / QR Label for ${first.batchNumber}`);
                },
              },
            ]}
          />
        }
      />

      <OperationsFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filter Batches"
        activeFilterCount={activeFilterCount}
        onReset={handleResetFilters}
      >
        <div className="space-y-4">
          <FormField label="Warehouse">
            <SelectInput
              value={warehouseFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setWarehouseFilter(e.target.value)}
              className="h-9 w-full rounded-xl text-xs"
            >
              <option value="all">All warehouses</option>
              <option value="Central Cold Storage">Cold Storage</option>
              <option value="Main Kitchen Store">Kitchen Store</option>
              <option value="Housekeeping Store">Housekeeping Store</option>
            </SelectInput>
          </FormField>
          <FormField label="Category">
            <SelectInput
              value={categoryFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryFilter(e.target.value)}
              className="h-9 w-full rounded-xl text-xs"
            >
              <option value="all">All categories</option>
              <option value="Dairy">Dairy</option>
              <option value="Produce">Produce</option>
              <option value="Chemicals">Cleaning Chemicals</option>
            </SelectInput>
          </FormField>
          <FormField label="Supplier">
            <SelectInput
              value={supplierFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSupplierFilter(e.target.value)}
              className="h-9 w-full rounded-xl text-xs"
            >
              <option value="all">All suppliers</option>
              <option value="Amul Dairy">Amul Dairy</option>
              <option value="Fresh Farms">Fresh Farms</option>
              <option value="EcoClean">EcoClean</option>
            </SelectInput>
          </FormField>
          <FormField label="Expiry date">
            <TextInput
              type="date"
              value={dateFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateFilter(e.target.value)}
              className="h-9 w-full rounded-xl text-xs"
            />
          </FormField>
        </div>
      </OperationsFilterDrawer>

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <ModuleDataTable
          columns={columns}
          rows={filteredBatches}
          emptyMessage="No batches match your search or filters."
          onRowClick={(r) => setSelectedBatch(r as BatchRecord)}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          renderMobileCard={(r: BatchRecord) => (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-semibold text-slate-900">{r.batchNumber}</p>
                  <p className="text-xs text-slate-500">{r.itemName}</p>
                </div>
                {renderStatusBadge(r.status, r.isFEFORecommended)}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                {renderDaysBadge(r.daysRemaining)}
                <span>
                  {r.availableQty} {r.unit}
                </span>
                <span>· {r.expiryDate}</span>
              </div>
            </div>
          )}
        />
      </div>

      <Drawer
        open={alertsOpen}
        onClose={() => setAlertsOpen(false)}
        title="Batch & expiry alerts"
        description="FEFO recommendations and shelf-life warnings"
        width="md"
        footer={
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => setAlertsOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-2.5 p-1">
          {fefoBatch && (
            <button
              type="button"
              onClick={() => {
                setSelectedBatch(fefoBatch);
                setAlertsOpen(false);
              }}
              className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-left"
            >
              <div className="flex items-start gap-2.5">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-emerald-950">FEFO recommendation</p>
                  <p className="mt-0.5 truncate text-xs text-emerald-800/80">
                    {fefoBatch.batchNumber} · {fefoBatch.itemName}
                  </p>
                  <p className="mt-1 text-xs font-medium text-amber-800">
                    {fefoBatch.daysRemaining} days left · {fefoBatch.availableQty} {fefoBatch.unit}
                  </p>
                </div>
              </div>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setStatusFilter("Near Expiry");
              setAlertsOpen(false);
            }}
            className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-left"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <div>
                <p className="text-sm font-semibold text-red-950">Near / today expiry</p>
                <p className="mt-0.5 text-xs text-red-800/80">
                  {nearExpiryCount} batch{nearExpiryCount === 1 ? "" : "es"} need inspection
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter("Expiring Soon");
              setAlertsOpen(false);
            }}
            className="w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-left"
          >
            <div className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-950">Expiring this week</p>
                <p className="mt-0.5 text-xs text-amber-800/80">
                  {expiringWeekCount} batch{expiringWeekCount === 1 ? "" : "es"} to issue first
                </p>
              </div>
            </div>
          </button>
        </div>
      </Drawer>

      {/* VIEW BATCH DETAILS DRAWER */}
      {selectedBatch && (
        <Drawer
          open={!!selectedBatch}
          onClose={() => setSelectedBatch(null)}
          title={`Batch Details: ${selectedBatch.batchNumber}`}
          width="lg"
        >
          <div className="space-y-6 pb-6 select-none text-xs">
            {/* HEADER SUMMARY CARD */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-extrabold text-emerald-900">{selectedBatch.batchNumber}</span>
                {renderStatusBadge(selectedBatch.status, selectedBatch.isFEFORecommended)}
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">{selectedBatch.itemName}</h3>
              <p className="text-xs text-slate-500 font-medium">
                Code: {selectedBatch.itemCode} • Category: {selectedBatch.category} • Supplier: {selectedBatch.supplier}
              </p>
            </div>

            {/* SECTION 1: GENERAL & LOCATION DETAILS */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-600" /> Location & Reference Details
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Warehouse</span>
                  <span className="font-bold text-slate-900">{selectedBatch.warehouse}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Storage Zone</span>
                  <span className="font-semibold text-slate-800">{selectedBatch.zone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Rack & Shelf</span>
                  <span className="font-semibold text-slate-800">{selectedBatch.rack} / {selectedBatch.shelf}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Bin Location</span>
                  <span className="font-mono font-extrabold text-emerald-800">{selectedBatch.bin}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">GRN Number</span>
                  <span className="font-mono font-bold text-amber-800">{selectedBatch.grnNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">PO Number</span>
                  <span className="font-mono font-bold text-slate-800">{selectedBatch.poNumber}</span>
                </div>
              </div>
            </div>

            {/* SECTION 2: INVENTORY & EXPIRY METRICS */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" /> Inventory & Expiry Metrics
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-medium">Available Quantity</span>
                  <span className="font-extrabold text-slate-900 text-sm">{selectedBatch.availableQty} {selectedBatch.unit}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-medium">Reserved Quantity</span>
                  <span className="font-bold text-slate-800 text-sm">{selectedBatch.reservedQty} {selectedBatch.unit}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-medium">Manufacturing Date</span>
                  <span className="font-bold text-slate-800">{selectedBatch.mfgDate}</span>
                </div>
                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <span className="text-[10px] text-amber-800 block font-bold">Expiry Date</span>
                  <span className="font-black text-amber-950 text-sm">{selectedBatch.expiryDate}</span>
                </div>
              </div>
            </div>

            {/* SECTION 3: MOVEMENT HISTORY */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-600" /> Batch Movement Timeline
              </h4>

              <div className="space-y-2">
                {selectedBatch.movements.map((m, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{m.action}</span>
                      <span className="text-[10px] text-slate-500">By {m.user} • Location: {m.location}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">{m.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CLOSE BUTTON */}
            <Button
              type="button"
              onClick={() => setSelectedBatch(null)}
              className="w-full h-10 text-xs font-bold !bg-slate-900 text-white rounded-xl shadow-xs cursor-pointer"
            >
              Close Batch View
            </Button>
          </div>
        </Drawer>
      )}
    </div>
  );
}
