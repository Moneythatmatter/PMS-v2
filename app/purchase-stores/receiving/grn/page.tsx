"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Package,
  ClipboardCheck,
  AlertTriangle,
  IndianRupee,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Printer,
  MoreVertical,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Trash2,
  FileText,
  Layers,
  Building2,
  Clock,
  Truck,
  Check,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
  Zap,
  Info,
  Sliders,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  FileCheck,
  Boxes,
  Lock,
  Loader2,
  CalendarDays,
  Phone,
  Warehouse,
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
import { ModuleDataTable } from "@/components/pms/ModuleDataTable";
import { ModuleSelectionBar } from "@/components/pms/ModuleSelectionBar";
import { ModuleColumn } from "@/components/pms/module-types";
import { OperationsToolbar, OperationsFilterDrawer } from "@/components/housekeeping/OperationsToolbar";
import { PurchaseFormCard } from "@/components/purchase-stores/ui/PurchaseFormCard";
import {
  PurchaseAttachmentList,
  AttachmentItem,
} from "@/components/purchase-stores/ui/PurchaseAttachmentList";
import type { GRNRecord, GRNLineItem } from "@/app/data/grnData";
import { normalizeGrnRecord } from "@/app/data/grnData";
import { usePsList } from "@/hooks/usePsResource";
import { psGrnService, psPurchaseOrderService, psProductService } from "@/services/purchase-stores/index";
import { normalizePoItems } from "@/app/data/procurementMaterial";
import {
  type GrnFormLine,
  poToGrnFormLines,
  addBatchToLine,
  updateLineBatch,
  syncLineTotals,
} from "./grnFormHelpers";

function PoSummaryItem({
  icon,
  label,
  value,
  mono,
  badge,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string | null;
  mono?: boolean;
  badge?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-800">
        <span className={cn("truncate", mono && "font-mono")} title={value || undefined}>
          {value?.trim() || "—"}
        </span>
        {badge && (
          <span className="shrink-0 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">{badge}</span>
        )}
      </dd>
    </div>
  );
}

export default function GoodsReceiptNotePage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: grnListRaw, loading, reload } = usePsList(() => psGrnService.list(), []);
  const grnList = useMemo(() => grnListRaw.map(normalizeGrnRecord), [grnListRaw]);
  const { data: purchaseOrdersRaw, loading: loadingPOs } = usePsList(
    () => psPurchaseOrderService.list(),
    [],
  );
  const { data: products } = usePsList(() => psProductService.list(), []);
  const purchaseOrders = useMemo(
    () =>
      purchaseOrdersRaw.map((po) => ({
        ...po,
        items: normalizePoItems(po.items, products),
      })),
    [purchaseOrdersRaw, products],
  );
  const approvedPOs = useMemo(
    () => purchaseOrders.filter((po) => po.status === "Approved" || po.status === "Issued"),
    [purchaseOrders],
  );
  const [saving, setSaving] = useState(false);
  /** Sync lock — React state alone cannot block rapid double-clicks before re-render. */
  const savingLockRef = useRef(false);

  // Search & Filters State
  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [inspectionFilter, setInspectionFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const statusTabCounts = useMemo(() => ({
    all: grnList.length,
    Approved: grnList.filter((g) => g.status === "Approved").length,
    Pending: grnList.filter((g) => g.status === "Pending").length,
    Return: grnList.filter((g) => g.status === "Return").length,
  }), [grnList]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (supplierFilter !== "all") n += 1;
    if (warehouseFilter !== "all") n += 1;
    if (inspectionFilter !== "all") n += 1;
    if (dateFilter) n += 1;
    return n;
  }, [supplierFilter, warehouseFilter, inspectionFilter, dateFilter]);

  const handleResetFilters = () => {
    setSupplierFilter("all");
    setWarehouseFilter("all");
    setInspectionFilter("all");
    setDateFilter("");
  };

  // Drawers & Modals State
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState<GRNRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Automation Feedback Modal State
  const [automationLog, setAutomationLog] = useState<string[] | null>(null);
  const [successModalData, setSuccessModalData] = useState<{
    grnNumber: string;
    poNumber: string;
    actionType: string;
  } | null>(null);

  // Selected Purchase Order for auto-fetch
  const [selectedPoNumber, setSelectedPoNumber] = useState("");
  const currentPO = useMemo(
    () => approvedPOs.find((po) => po.poNumber === selectedPoNumber) ?? null,
    [approvedPOs, selectedPoNumber],
  );

  // STORE EXECUTIVE DELIVERIES FORM INPUTS (Physical Receipt Only — no vendor invoice)
  const [formReceiptDate, setFormReceiptDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formDeliveryTime, setFormDeliveryTime] = useState("");
  const [formVehicleNo, setFormVehicleNo] = useState("");
  const [formDeliveryPerson, setFormDeliveryPerson] = useState("");
  const [formChallanNo, setFormChallanNo] = useState("");
  const [formReceiver, setFormReceiver] = useState("");
  const [formRemarks, setFormRemarks] = useState("");

  const [formItems, setFormItems] = useState<GrnFormLine[]>([]);

  useEffect(() => {
    if (currentPO) {
      setFormItems(poToGrnFormLines(currentPO, products));
    } else {
      setFormItems([]);
    }
  }, [currentPO?.poNumber, products]);

  const [formAttachments, setFormAttachments] = useState<AttachmentItem[]>([]);

  const openCreateDrawer = () => {
    setSelectedPoNumber("");
    setFormItems([]);
    setFormReceiptDate(new Date().toISOString().slice(0, 10));
    setFormDeliveryTime("");
    setFormVehicleNo("");
    setFormDeliveryPerson("");
    setFormChallanNo("");
    setFormReceiver("");
    setFormRemarks("");
    setFormAttachments([]);
    setCreateDrawerOpen(true);
  };

  // Filtered GRNs
  const filteredGRNs = useMemo(() => {
    return grnList.filter((g) => {
      const matchSearch =
        g.grnNumber.toLowerCase().includes(search.toLowerCase()) ||
        g.poNumber.toLowerCase().includes(search.toLowerCase()) ||
        g.supplierName.toLowerCase().includes(search.toLowerCase()) ||
        g.deliveryChallan?.toLowerCase().includes(search.toLowerCase());

      const matchSupplier = supplierFilter === "all" || g.supplierName.toLowerCase().includes(supplierFilter.toLowerCase());
      const matchWarehouse = warehouseFilter === "all" || g.warehouse.toLowerCase().includes(warehouseFilter.toLowerCase());
      const matchStatus = statusFilter === "all" || g.status === statusFilter;
      const matchInspection = inspectionFilter === "all" || g.inspectionStatus === inspectionFilter;
      const matchDate = !dateFilter || g.receiptDate.includes(dateFilter);

      return (
        matchSearch &&
        matchSupplier &&
        matchWarehouse &&
        matchStatus &&
        matchInspection &&
        matchDate
      );
    });
  }, [grnList, search, supplierFilter, warehouseFilter, statusFilter, inspectionFilter, dateFilter]);

  const handleSaveGRN = async (actionType: "Submit" | "Print" | "Inspection") => {
    if (savingLockRef.current) return;
    if (!currentPO) {
      alert("Select an approved Purchase Order.");
      return;
    }
    const missing = [
      !formReceiptDate && "Receipt Date",
      !formDeliveryTime.trim() && "Actual Delivery Time",
      !formChallanNo.trim() && "Delivery Challan Number",
      !formReceiver.trim() && "Receiver Name / Store In-charge",
    ].filter(Boolean);
    if (missing.length > 0) {
      alert(`Please fill in: ${missing.join(", ")}`);
      return;
    }

    for (const line of formItems) {
      const batchTotal = line.batchAllocations.reduce((s, b) => s + b.receivedQty, 0);
      if (batchTotal > line.orderedQty) {
        alert(
          `[Validation]: Received quantity (${batchTotal}) exceeds ordered (${line.orderedQty}) for ${line.productName}`,
        );
        return;
      }
      for (const batch of line.batchAllocations) {
        if (batch.expiryDate && batch.mfgDate && new Date(batch.expiryDate) < new Date(batch.mfgDate)) {
          alert(`Expiry cannot be before MFG date for batch ${batch.batchNumber}`);
          return;
        }
      }
    }

    const items: GRNLineItem[] = formItems.map((line) => syncLineTotals(line));

    const newRecord: Partial<GRNRecord> = {
      poNumber: currentPO.poNumber,
      supplierName: currentPO.vendorName,
      receiptDate: formReceiptDate,
      deliveryTime: formDeliveryTime,
      deliveryPerson: formDeliveryPerson,
      warehouse: currentPO.shipToWarehouse,
      itemCount: items.length,
      receivedBy: formReceiver,
      status: "Pending",
      inspectionStatus: "Pending",
      vehicleNumber: formVehicleNo,
      deliveryChallan: formChallanNo,
      totalAmount: items.reduce((s, l) => s + l.receivedValue, 0),
      remarks: formRemarks,
      items,
      inspectionDetails: {
        status: "Pending",
        inspector: "Awaiting QC Auditor Sign-off",
        inspectionDate: "Pending",
        comments: "Goods physically received. Awaiting Quality Inspection sign-off.",
      },
      attachments: formAttachments.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        fileSize: a.fileSize,
        fileType: "pdf",
      })),
      logs: [
        {
          timestamp: new Date().toISOString(),
          user: formReceiver,
          action: "GRN Created & Sent to Quality Inspection",
          status: "Success",
        },
      ],
    };

    savingLockRef.current = true;
    setSaving(true);
    try {
      const created = await psGrnService.create(newRecord);
      await reload();
      setCreateDrawerOpen(false);

      const nextGRNNo = created.grnNumber;
      const batchCount = items.reduce((s, l) => s + l.batchAllocations.length, 0);
      setAutomationLog([
        `✓ GRN ${nextGRNNo} recorded against ${currentPO.poNumber}`,
        `✓ ${batchCount} batch lot(s) captured (pending QC)`,
        `✓ Quality Inspection task auto-created`,
        `✓ Stock posts after QC pass — vendor invoice uploaded separately for 3-way match`,
      ]);
      setSuccessModalData({
        grnNumber: nextGRNNo,
        poNumber: currentPO.poNumber,
        actionType,
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to create GRN");
    } finally {
      savingLockRef.current = false;
      setSaving(false);
    }
  };

  // Shared status badge style for Quality + GRN columns
  const statusBadgeClass = (tone: "success" | "danger" | "warning" | "neutral") => {
    const tones = {
      success: "bg-emerald-50 text-emerald-700 border-emerald-200",
      danger: "bg-red-50 text-red-700 border-red-200",
      warning: "bg-amber-50 text-amber-800 border-amber-200",
      neutral: "bg-slate-50 text-slate-600 border-slate-200",
    };
    return cn(
      "inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-md border",
      tones[tone],
    );
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
      case "Completed":
      case "Received":
        return <span className={statusBadgeClass("success")}>{status}</span>;
      case "Return":
      case "Vendor Return":
        return <span className={statusBadgeClass("danger")}>Return</span>;
      case "Rejected":
        return <span className={statusBadgeClass("danger")}>Rejected</span>;
      case "Pending":
      case "Pending Inspection":
        return <span className={statusBadgeClass("warning")}>Pending</span>;
      default:
        return <span className={statusBadgeClass("neutral")}>{status}</span>;
    }
  };

  const renderInspectionBadge = (inspStatus: string) => {
    switch (inspStatus) {
      case "Passed":
        return <span className={statusBadgeClass("success")}>Passed</span>;
      case "Partially Accepted":
        return <span className={statusBadgeClass("warning")}>Partially Accepted</span>;
      case "Rejected":
        return <span className={statusBadgeClass("danger")}>Rejected</span>;
      case "Pending":
      case "Pending Inspection":
      case "Under QC":
        return <span className={statusBadgeClass("warning")}>Pending</span>;
      default:
        return <span className={statusBadgeClass("neutral")}>{inspStatus}</span>;
    }
  };

  // Columns for ModuleDataTable
  const columns: ModuleColumn[] = [
    {
      key: "grnNumber",
      header: "GRN Number",
      render: (r: GRNRecord) => (
        <span className="font-mono font-extrabold text-slate-900 flex items-center gap-1.5">
          <Package className="h-4 w-4 text-emerald-600" />
          {r.grnNumber}
        </span>
      ),
    },
    {
      key: "receiptDate",
      header: "Receipt Date",
      render: (r: GRNRecord) => <span className="text-slate-700 font-medium text-xs">{r.receiptDate}</span>,
    },
    {
      key: "poNumber",
      header: "Purchase Order",
      render: (r: GRNRecord) => (
        <span className="font-mono text-emerald-800 font-bold text-xs">{r.poNumber}</span>
      ),
    },
    {
      key: "supplierName",
      header: "Supplier",
      render: (r: GRNRecord) => <span className="font-bold text-slate-900 text-xs">{r.supplierName}</span>,
    },
    {
      key: "warehouse",
      header: "Warehouse",
      render: (r: GRNRecord) => <span className="text-slate-700 font-medium text-xs">{r.warehouse}</span>,
    },
    {
      key: "itemCount",
      header: "Items Received",
      align: "center",
      render: (r: GRNRecord) => (
        <span className="font-bold text-slate-800 text-xs">{r.items.length} Products</span>
      ),
    },
    {
      key: "totalAmount",
      header: "Net Value (₹)",
      align: "right",
      render: (r: GRNRecord) => (
        <span className="font-black text-slate-900 text-xs">
          ₹{(r.totalAmount || 0).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "inspectionStatus",
      header: "Quality Status",
      align: "center",
      render: (r: GRNRecord) => renderInspectionBadge(r.inspectionStatus),
    },
    {
      key: "status",
      header: "GRN Status",
      align: "center",
      render: (r: GRNRecord) => renderStatusBadge(r.status),
    },
  ];

  if (!isMounted) return null;

  return (
    <div className="space-y-6 pb-12 select-none min-h-screen">
      {/* PAGE HEADER */}
      <FOPageHeader
        eyebrow="Receiving & Quality Control"
        title="Goods Receipt Note (GRN)"
        description="Record and manage goods received from suppliers against approved Purchase Orders."
        action={
          <Button
            type="button"
            onClick={openCreateDrawer}
            className="h-9 px-4 text-xs font-bold !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Create GRN
          </Button>
        }
      />

      {/* 4 DASHBOARD SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatMiniCard
          label="Today's Receipts"
          value="18"
          sublabel="Goods received today"
          icon={Package}
          accent="#0f8a5f"
        />
        <StatMiniCard
          label="Pending"
          value="5"
          sublabel="Awaiting QC check"
          icon={ClipboardCheck}
          accent="#d97706"
        />
        <StatMiniCard
          label="Rejected Goods"
          value="2"
          sublabel="Returned to vendor"
          icon={AlertTriangle}
          accent="#dc2626"
        />
        <StatMiniCard
          label="Total Value Received"
          value="₹4,85,000"
          sublabel="Value of goods received"
          icon={IndianRupee}
          accent="#2563eb"
        />
      </div>

      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search GRN No, Purchase Order, Supplier, Invoice..."
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setFilterDrawerOpen(true)}
        statusTabs={[
          { id: "all", label: `All ${statusTabCounts.all}` },
          { id: "Approved", label: `Approved ${statusTabCounts.Approved}` },
          { id: "Pending", label: `Pending ${statusTabCounts.Pending}` },
          { id: "Return", label: `Return ${statusTabCounts.Return}` },
        ]}
        activeStatusTab={statusFilter}
        onStatusTabChange={setStatusFilter}
        selectionBar={
          <ModuleSelectionBar
            count={selectedIds.size}
            noun="GRN"
            onClear={() => setSelectedIds(new Set())}
            actions={[
              {
                label: "View",
                onClick: () => {
                  const first = filteredGRNs.find((g) => selectedIds.has(g.id));
                  if (first) setSelectedGRN(first);
                },
              },
              {
                label: "Print",
                icon: <Printer className="h-3.5 w-3.5" />,
                onClick: () => {
                  const first = filteredGRNs.find((g) => selectedIds.has(g.id));
                  if (first) alert(`Printing Goods Receipt Note ${first.grnNumber}`);
                },
              },
            ]}
          />
        }
      />

      <OperationsFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filter Goods Receipt Notes"
        activeFilterCount={activeFilterCount}
        onReset={handleResetFilters}
      >
        <div className="space-y-4">
          <FormField label="Supplier">
            <SelectInput
              value={supplierFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSupplierFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Suppliers</option>
              <option value="Amul">Amul Dairy</option>
              <option value="Fresh Farms">Fresh Farms</option>
              <option value="EcoClean">EcoClean</option>
            </SelectInput>
          </FormField>

          <FormField label="Warehouse">
            <SelectInput
              value={warehouseFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setWarehouseFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Warehouses</option>
              <option value="Central Cold Storage">Cold Storage</option>
              <option value="Main Kitchen Store">Kitchen Store</option>
              <option value="Housekeeping Store">Housekeeping Store</option>
            </SelectInput>
          </FormField>

          <FormField label="QC Status">
            <SelectInput
              value={inspectionFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setInspectionFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All QC Statuses</option>
              <option value="Passed">Passed</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </SelectInput>
          </FormField>

          <FormField label="Receipt Date">
            <TextInput
              type="date"
              value={dateFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateFilter(e.target.value)}
              className="h-9 w-full text-xs rounded-xl"
            />
          </FormField>
        </div>
      </OperationsFilterDrawer>

      {/* CORE DATA TABLE */}
      <div className="space-y-3">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Loading GRNs…
          </div>
        ) : (
          <ModuleDataTable
            columns={columns}
            rows={filteredGRNs}
            emptyMessage="No Goods Receipt Notes found."
            onRowClick={(r) => setSelectedGRN(normalizeGrnRecord(r as GRNRecord))}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        )}
      </div>

      {/* CREATE GRN DRAWER (SEGREGATED STORE RECEIVING WORKFLOW) */}
      <Drawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        title="Create Goods Receipt Note (GRN)"
        side="bottom"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateDrawerOpen(false)}
              className="h-9 px-4 text-xs font-semibold border-slate-300 text-slate-700 rounded-xl cursor-pointer"
            >
              Cancel
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => void handleSaveGRN("Print")}
                className="h-9 px-4 text-xs font-semibold border-slate-300 text-slate-700 rounded-xl cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Printer className="h-4 w-4" />
                Submit & Print
              </Button>
              <Button
                type="button"
                disabled={saving}
                onClick={() => void handleSaveGRN("Inspection")}
                className="h-9 px-5 text-xs font-bold !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Submit GRN
              </Button>
            </div>
          </div>
        }
      >
        <form className="space-y-5 py-2">
          {/* SECTION 1: PURCHASE ORDER */}
          <PurchaseFormCard title="Purchase Order" sectionNumber="Step 1 of 4">
            <div className="space-y-4 text-xs">
              <div className="grid gap-x-6 gap-y-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:items-center">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Approved Purchase Order <span className="text-red-500">*</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {loadingPOs
                      ? "Loading approved purchase orders…"
                      : `${approvedPOs.length} approved PO${approvedPOs.length === 1 ? "" : "s"} available for receiving`}
                  </p>
                </div>
                <div className="relative">
                  <FileText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <SelectInput
                    value={selectedPoNumber}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedPoNumber(e.target.value)}
                    className={cn(
                      "block h-11 pl-9 text-sm",
                      selectedPoNumber ? "font-semibold text-slate-900" : "text-slate-500",
                    )}
                    disabled={loadingPOs || approvedPOs.length === 0}
                  >
                    <option value="">
                      {loadingPOs ? "Loading POs…" : approvedPOs.length === 0 ? "No approved POs" : "Select a purchase order…"}
                    </option>
                    {approvedPOs.map((po) => (
                      <option key={po.id} value={po.poNumber}>
                        {po.poNumber} · {po.vendorName} · ₹{po.totalAmount.toLocaleString("en-IN")}
                      </option>
                    ))}
                  </SelectInput>
                </div>
              </div>

              {currentPO ? (
                <div className="overflow-hidden rounded-xl border border-emerald-200">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-50/70 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 ring-1 ring-emerald-200">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{currentPO.vendorName || "—"}</p>
                        <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="font-mono font-semibold text-emerald-800">{currentPO.poNumber}</span>
                          <span>·</span>
                          <span>{currentPO.status}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Order Value</p>
                      <p className="text-base font-bold text-slate-900">
                        ₹{currentPO.totalAmount.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-4 bg-white px-4 py-4 md:grid-cols-4">
                    <PoSummaryItem icon={<FileCheck className="h-3.5 w-3.5" />} label="GSTIN" value={currentPO.gstin} mono />
                    <PoSummaryItem icon={<Phone className="h-3.5 w-3.5" />} label="Contact" value={currentPO.vendorPhone} />
                    <PoSummaryItem icon={<Warehouse className="h-3.5 w-3.5" />} label="Deliver To" value={currentPO.shipToWarehouse} />
                    <PoSummaryItem icon={<Boxes className="h-3.5 w-3.5" />} label="Line Items" value={`${currentPO.items.length} item${currentPO.items.length === 1 ? "" : "s"}`} />
                    <PoSummaryItem icon={<CalendarDays className="h-3.5 w-3.5" />} label="PO Date" value={currentPO.orderDate} />
                    <PoSummaryItem
                      icon={<Truck className="h-3.5 w-3.5" />}
                      label="Expected Delivery"
                      value={currentPO.expectedDeliveryDate}
                      badge={
                        currentPO.expectedDeliveryDate && currentPO.expectedDeliveryDate < new Date().toISOString().slice(0, 10)
                          ? "Overdue"
                          : undefined
                      }
                    />
                    <PoSummaryItem icon={<IndianRupee className="h-3.5 w-3.5" />} label="Currency" value={currentPO.currency} />
                    <PoSummaryItem icon={<Clock className="h-3.5 w-3.5" />} label="Payment Terms" value={currentPO.paymentTerms} />
                  </dl>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-8 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 ring-1 ring-slate-200">
                    <ClipboardCheck className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">No purchase order selected</p>
                  <p className="max-w-sm text-[11px] text-slate-500">
                    Choose an approved PO above. Supplier details and ordered items will load automatically.
                  </p>
                </div>
              )}
            </div>
          </PurchaseFormCard>

          {/* SECTION 2: DELIVERY DETAILS */}
          <PurchaseFormCard title="Delivery Details" sectionNumber="Step 2 of 4">
            <div className="grid grid-cols-1 gap-x-5 gap-y-4 text-xs sm:grid-cols-2 md:grid-cols-3">
              <FormField label="Receipt Date" required>
                <TextInput
                  type="date"
                  value={formReceiptDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormReceiptDate(e.target.value)}
                  className="h-10 text-sm"
                />
              </FormField>
              <FormField label="Delivery Time" required>
                <TextInput
                  type="time"
                  value={formDeliveryTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormDeliveryTime(e.target.value)}
                  className="h-10 text-sm"
                />
              </FormField>
              <FormField label="Delivery Challan No." required>
                <TextInput
                  value={formChallanNo}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormChallanNo(e.target.value)}
                  placeholder="e.g. CHAL-8841"
                  className="h-10 text-sm"
                />
              </FormField>
              <FormField label="Received By" required>
                <TextInput
                  value={formReceiver}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormReceiver(e.target.value)}
                  placeholder="Store in-charge name"
                  className="h-10 text-sm"
                />
              </FormField>
              <FormField label="Vehicle Number">
                <TextInput
                  value={formVehicleNo}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormVehicleNo(e.target.value)}
                  placeholder="e.g. MH-04-AB-1234"
                  className="h-10 text-sm"
                />
              </FormField>
              <FormField label="Delivered By (Supplier)">
                <TextInput
                  value={formDeliveryPerson}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormDeliveryPerson(e.target.value)}
                  placeholder="Driver / delivery person"
                  className="h-10 text-sm"
                />
              </FormField>
              <div className="sm:col-span-2 md:col-span-3">
                <FormField label="Remarks">
                  <TextInput
                    value={formRemarks}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormRemarks(e.target.value)}
                    placeholder="Condition of goods, packaging, shortages…"
                    className="h-10 text-sm"
                  />
                </FormField>
              </div>
            </div>
          </PurchaseFormCard>

          {/* SECTION 3: ITEMS RECEIVED & BATCHES */}
          <PurchaseFormCard title="Items Received" sectionNumber="Step 3 of 4">
            <div className="space-y-4 text-xs">
              {formItems.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-slate-500">
                  Items from the selected PO will appear here.
                </div>
              )}
              {formItems.map((item) => {
                const overReceived = item.receivedQty > item.orderedQty;
                return (
                  <div key={item.id} className="rounded-xl border border-slate-200">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
                      <div className="flex items-start gap-2.5">
                        <Package className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.productName}</p>
                          <p className="text-[11px] text-slate-500">
                            {item.productCode} · {item.category} · ₹{item.unitRate.toLocaleString("en-IN")} / {item.unit}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">
                          Ordered <strong className="text-slate-900">{item.orderedQty}</strong>
                        </span>
                        <span
                          className={cn(
                            "rounded-md px-2 py-1",
                            overReceived ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700",
                          )}
                        >
                          Received <strong>{item.receivedQty}</strong>
                        </span>
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">
                          ₹{item.receivedValue.toLocaleString("en-IN")}
                        </span>
                        <span className="rounded-md bg-amber-50 px-2 py-1 font-medium text-amber-800">QC {item.qcStatus}</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto px-4 py-3">
                      <table className="w-full min-w-[720px] text-left">
                        <thead>
                          <tr className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            <th className="pb-1.5 pr-2 font-semibold">Batch No.</th>
                            <th className="w-24 pb-1.5 pr-2 font-semibold">Qty</th>
                            <th className="pb-1.5 pr-2 font-semibold">MFG Date</th>
                            <th className="pb-1.5 pr-2 font-semibold">Expiry</th>
                            <th className="pb-1.5 pr-2 font-semibold">Warehouse</th>
                            <th className="pb-1.5 pr-2 font-semibold">Bin</th>
                            <th className="pb-1.5 pr-2 text-right font-semibold">Value</th>
                            <th className="w-8 pb-1.5" />
                          </tr>
                        </thead>
                        <tbody>
                          {item.batchAllocations.map((batch) => {
                            const patch = (changes: Parameters<typeof updateLineBatch>[2]) =>
                              setFormItems(
                                formItems.map((l) => (l.id === item.id ? updateLineBatch(l, batch.id, changes) : l)),
                              );
                            return (
                              <tr key={batch.id} className="align-middle">
                                <td className="py-1 pr-2">
                                  <TextInput
                                    value={batch.batchNumber}
                                    onChange={(e) => patch({ batchNumber: e.target.value })}
                                    className="h-8 text-xs font-mono"
                                  />
                                </td>
                                <td className="py-1 pr-2">
                                  <TextInput
                                    type="number"
                                    min={0}
                                    value={batch.receivedQty}
                                    onChange={(e) => {
                                      const q = Number(e.target.value);
                                      patch({ receivedQty: q, acceptedQty: q });
                                    }}
                                    className="h-8 text-center text-xs font-semibold"
                                  />
                                </td>
                                <td className="py-1 pr-2">
                                  <TextInput
                                    type="date"
                                    value={batch.mfgDate ?? ""}
                                    onChange={(e) => patch({ mfgDate: e.target.value })}
                                    className="h-8 text-xs"
                                  />
                                </td>
                                <td className="py-1 pr-2">
                                  <TextInput
                                    type="date"
                                    value={batch.expiryDate}
                                    onChange={(e) => patch({ expiryDate: e.target.value })}
                                    className="h-8 text-xs"
                                  />
                                </td>
                                <td className="py-1 pr-2">
                                  <TextInput
                                    value={batch.storageWarehouse}
                                    onChange={(e) => patch({ storageWarehouse: e.target.value })}
                                    className="h-8 text-xs"
                                  />
                                </td>
                                <td className="py-1 pr-2">
                                  <TextInput
                                    value={batch.storageLocation ?? ""}
                                    onChange={(e) => patch({ storageLocation: e.target.value })}
                                    placeholder="Optional"
                                    className="h-8 text-xs"
                                  />
                                </td>
                                <td className="whitespace-nowrap py-1 pr-2 text-right font-semibold text-slate-700">
                                  ₹{(batch.receivedQty * item.unitRate).toLocaleString("en-IN")}
                                </td>
                                <td className="py-1 text-right">
                                  {item.batchAllocations.length > 1 && (
                                    <button
                                      type="button"
                                      aria-label="Remove batch"
                                      onClick={() =>
                                        setFormItems(
                                          formItems.map((l) =>
                                            l.id === item.id
                                              ? syncLineTotals({
                                                  ...l,
                                                  batchAllocations: l.batchAllocations.filter((b) => b.id !== batch.id),
                                                })
                                              : l,
                                          ),
                                        )
                                      }
                                      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div className="mt-2 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() =>
                            setFormItems(
                              formItems.map((l) =>
                                l.id === item.id
                                  ? addBatchToLine(l, currentPO?.shipToWarehouse ?? l.batchAllocations[0]?.storageWarehouse ?? "")
                                  : l,
                              ),
                            )
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add batch
                        </button>
                        {overReceived && (
                          <span className="text-[11px] font-medium text-red-600">
                            Received quantity exceeds the ordered {item.orderedQty} {item.unit}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </PurchaseFormCard>

          {/* SECTION 4: INSPECTION & DOCUMENTS */}
          <PurchaseFormCard title="Documents" sectionNumber="Step 4 of 4">
            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-amber-900">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p>
                  After submission this GRN goes to <strong>Quality Inspection</strong>. Stock is posted only after QC passes.
                </p>
              </div>
              <div>
                <p className="mb-1 font-semibold text-slate-800">Delivery challans & certificates</p>
                <p className="mb-2 text-[11px] text-slate-500">
                  Vendor tax invoices are uploaded later under PO → Vendor Invoices for the 3-way match.
                </p>
                <PurchaseAttachmentList
                  attachments={formAttachments}
                  onAddAttachment={(att) => setFormAttachments([...formAttachments, att])}
                  onRemoveAttachment={(id) => setFormAttachments(formAttachments.filter((a) => a.id !== id))}
                />
              </div>
            </div>
          </PurchaseFormCard>
        </form>
      </Drawer>

      {/* AUTOMATION & SUCCESS FLOW MODAL */}
      {successModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-3 rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Goods Receipt Note Created Successfully</h3>
                <p className="text-xs text-slate-500 font-medium">GRN Number: {successModalData.grnNumber}</p>
              </div>
            </div>

            {/* AUTOMATION LOGS FEEDBACK */}
            {automationLog && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1.5 font-medium text-emerald-950">
                <span className="font-bold text-emerald-900 block border-b border-emerald-200 pb-1">Automated System Executions:</span>
                {automationLog.map((log, idx) => (
                  <p key={idx}>{log}</p>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                type="button"
                onClick={() => setSuccessModalData(null)}
                className="h-9 text-xs font-bold !bg-slate-900 text-white rounded-xl cursor-pointer"
              >
                View GRN Details
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setSuccessModalData(null);
                  alert(`Printing GRN ${successModalData.grnNumber}...`);
                }}
                className="h-9 text-xs font-bold !bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-4 w-4" /> Print GRN
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setSuccessModalData(null);
                  alert("Opening Quality Inspection checklist module...");
                }}
                className="h-9 text-xs font-bold !bg-blue-700 text-white rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4" /> Start Quality Inspection
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setSuccessModalData(null);
                  alert("Opening Batch & FEFO Expiry Control module...");
                }}
                className="h-9 text-xs font-bold !bg-purple-700 text-white rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Boxes className="h-4 w-4" /> View Batch Details
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CLICKING VIEW: SIDE DRAWER FOR GRN DETAILS */}
      {selectedGRN && (
        <Drawer
          open={!!selectedGRN}
          onClose={() => setSelectedGRN(null)}
          title={`Goods Receipt Note: ${selectedGRN.grnNumber}`}
          side="bottom"
        >
          <div className="space-y-6 pb-6 select-none">
            {/* WORKFLOW STEPPER BANNER */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-extrabold text-amber-900">{selectedGRN.grnNumber}</span>
                <div className="flex items-center gap-2">
                  {renderInspectionBadge(selectedGRN.inspectionStatus)}
                  {renderStatusBadge(selectedGRN.status)}
                </div>
              </div>

              {/* Workflow Diagram */}
              <div className="border-t border-amber-200/80 pt-3">
                <h5 className="text-[11px] font-bold text-amber-950 uppercase tracking-wider mb-2">Procurement to Payment Lifecycle</h5>
                <div className="flex items-center justify-between text-[10px] font-bold overflow-x-auto pb-1 scrollbar-none gap-1">
                  <span className="px-2 py-1 bg-white rounded border border-amber-300 text-slate-700 shrink-0">PO Approved ({selectedGRN.poNumber})</span>
                  <ArrowRight className="h-3 w-3 text-amber-500 shrink-0" />
                  <span className="px-2 py-1 bg-amber-600 text-white rounded shrink-0">Goods Received (GRN)</span>
                  <ArrowRight className="h-3 w-3 text-amber-500 shrink-0" />
                  <span className="px-2 py-1 bg-white rounded border border-amber-300 text-slate-700 shrink-0">Quality Inspection</span>
                  <ArrowRight className="h-3 w-3 text-amber-500 shrink-0" />
                  <span className="px-2 py-1 bg-white rounded border border-amber-300 text-slate-700 shrink-0">
                    {selectedGRN.status === "Return" ? "Return (RGP)" : "Inventory Stock Ledger"}
                  </span>
                  <ArrowRight className="h-3 w-3 text-amber-500 shrink-0" />
                  <span className="px-2 py-1 bg-white rounded border border-amber-300 text-slate-700 shrink-0">3-Way Invoice Match</span>
                </div>
              </div>
            </div>

            {/* GENERAL INFORMATION */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-amber-600" /> General Information
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">GRN Number</span>
                  <span className="font-mono font-bold text-slate-900">{selectedGRN.grnNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Receipt Date</span>
                  <span className="font-semibold text-slate-800">{selectedGRN.receiptDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Purchase Order</span>
                  <span className="font-mono font-bold text-emerald-800">{selectedGRN.poNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Supplier</span>
                  <span className="font-bold text-slate-900">{selectedGRN.supplierName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Target Warehouse</span>
                  <span className="font-semibold text-slate-800">{selectedGRN.warehouse}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Received By</span>
                  <span className="font-semibold text-slate-800">{selectedGRN.receivedBy}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Delivery Person</span>
                  <span className="font-semibold text-slate-800">{selectedGRN.deliveryPerson ?? "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Vehicle Number</span>
                  <span className="font-mono text-slate-800">{selectedGRN.vehicleNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Delivery Challan</span>
                  <span className="font-mono text-slate-800">{selectedGRN.deliveryChallan}</span>
                </div>
              </div>
            </div>

            {/* ITEMS RECEIVED TABLE */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-amber-600" /> Items Received Breakdown
                </span>
                <span className="text-[11px] text-slate-500 font-semibold">{selectedGRN.items.length} Products</span>
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                      <th className="py-2 px-2">Product</th>
                      <th className="py-2 px-2 text-center">Ordered</th>
                      <th className="py-2 px-2 text-center">Received</th>
                      <th className="py-2 px-2 text-center">Accepted</th>
                      <th className="py-2 px-2 text-center">Rejected</th>
                      <th className="py-2 px-2">Batch No</th>
                      <th className="py-2 px-2">Expiry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {selectedGRN.items.flatMap((item) =>
                      item.batchAllocations.map((batch) => (
                        <tr key={`${item.id}-${batch.id}`}>
                          <td className="py-2.5 px-2 font-bold text-slate-900">
                            {item.productName}
                            <div className="text-[10px] font-normal text-slate-400">{item.productCode}</div>
                          </td>
                          <td className="py-2.5 px-2 text-center text-slate-600">{item.orderedQty} {item.unit}</td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-800">{batch.receivedQty} {item.unit}</td>
                          <td className="py-2.5 px-2 text-center font-extrabold text-emerald-700">{batch.acceptedQty} {item.unit}</td>
                          <td className="py-2.5 px-2 text-center font-extrabold text-red-600">{batch.rejectedQty} {item.unit}</td>
                          <td className="py-2.5 px-2 font-mono text-slate-700">{batch.batchNumber}</td>
                          <td className="py-2.5 px-2 text-slate-600">{batch.expiryDate || "—"}</td>
                        </tr>
                      )),
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* QUALITY INSPECTION DETAILS */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600" /> Quality Inspection Sign-off
                </span>
                {renderInspectionBadge(selectedGRN.inspectionDetails?.status ?? "")}
              </h4>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Inspector / Auditor</span>
                  <span className="font-bold text-slate-900">{selectedGRN.inspectionDetails?.inspector}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Inspection Date</span>
                  <span className="font-semibold text-slate-800">{selectedGRN.inspectionDetails?.inspectionDate}</span>
                </div>
                <div className="col-span-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 block font-medium">QC Notes & Remarks</span>
                  <p className="text-xs font-medium text-slate-700 mt-0.5">{selectedGRN.inspectionDetails?.comments}</p>
                </div>
              </div>
            </div>

            {/* ATTACHMENTS */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-600" /> Invoices & Delivery Documents
              </h4>

              <div className="space-y-2">
                {selectedGRN.attachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-slate-500" />
                      {att.fileName} ({att.fileSize})
                    </span>
                    <button
                      type="button"
                      onClick={() => alert(`Downloading ${att.fileName}`)}
                      className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* CLOSE BUTTON */}
            <Button
              type="button"
              onClick={() => setSelectedGRN(null)}
              className="w-full h-10 text-xs font-bold !bg-slate-900 text-white rounded-xl shadow-xs cursor-pointer"
            >
              Close GRN View
            </Button>
          </div>
        </Drawer>
      )}
    </div>
  );
}
