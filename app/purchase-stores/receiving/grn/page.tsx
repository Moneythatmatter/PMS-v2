"use client";

import React, { useState, useMemo, useEffect } from "react";
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
import {
  INITIAL_GRN_RECORDS,
  GRNRecord,
  GRNItem,
} from "@/app/data/grnData";

// SAMPLE PO MASTER DATABASE FOR AUTO-FETCHING
const PO_MASTER_DATABASE: Record<string, {
  poNumber: string;
  poDate: string;
  supplierCode: string;
  supplierName: string;
  supplierContact: string;
  warehouse: string;
  expectedDeliveryDate: string;
  currency: string;
  items: Array<{
    productCode: string;
    productName: string;
    category: string;
    brand: string;
    countryOfOrigin: string;
    unit: string;
    orderedQty: number;
    rate: number;
    discountPct: number;
    taxPct: number;
    suggestedBin: string;
  }>;
}> = {
  "PO-2026-041": {
    poNumber: "PO-2026-041",
    poDate: "2026-07-15",
    supplierCode: "SUP-AMUL-01",
    supplierName: "Amul Dairy Products Ltd.",
    supplierContact: "+91 98765 11223 (Sales Desk)",
    warehouse: "Central Cold Storage",
    expectedDeliveryDate: "2026-07-25",
    currency: "INR (₹)",
    items: [
      {
        productCode: "FNB-DRY-01",
        productName: "Full Cream Fresh Milk 1L",
        category: "Dairy & Perishables",
        brand: "Amul",
        countryOfOrigin: "India",
        unit: "Litres",
        orderedQty: 500,
        rate: 66,
        discountPct: 0,
        taxPct: 5,
        suggestedBin: "Central Cold Storage → Dairy Chiller Bay → Rack D → Shelf D1 → BIN-CHILL-D1-01",
      },
    ],
  },
  "PO-2026-042": {
    poNumber: "PO-2026-042",
    poDate: "2026-07-16",
    supplierCode: "SUP-FF-09",
    supplierName: "Fresh Farms India Pvt. Ltd.",
    supplierContact: "+91 98111 22334 (Orders)",
    warehouse: "Main Kitchen Store",
    expectedDeliveryDate: "2026-07-25",
    currency: "INR (₹)",
    items: [
      {
        productCode: "FNB-VEG-09",
        productName: "Exotic Baby Spinach (500g)",
        category: "Fresh Produce",
        brand: "Fresh Farms",
        countryOfOrigin: "India",
        unit: "Packs",
        orderedQty: 70,
        rate: 180,
        discountPct: 5,
        taxPct: 0,
        suggestedBin: "Main Kitchen Store → Veg Zone → Rack V → Shelf V1 → BIN-VEG-02",
      },
    ],
  },
  "PO-2026-043": {
    poNumber: "PO-2026-043",
    poDate: "2026-07-18",
    supplierCode: "SUP-ECO-05",
    supplierName: "EcoClean Hygiene Solutions Ltd.",
    supplierContact: "+91 98222 33445 (Support)",
    warehouse: "Housekeeping Store",
    expectedDeliveryDate: "2026-07-25",
    currency: "INR (₹)",
    items: [
      {
        productCode: "HK-CHM-05",
        productName: "Taski R2 All Surface Cleaner 5L",
        category: "Housekeeping Chemicals",
        brand: "Diversey / Taski",
        countryOfOrigin: "India",
        unit: "Canisters",
        orderedQty: 15,
        rate: 1250,
        discountPct: 10,
        taxPct: 18,
        suggestedBin: "Housekeeping Store → Chemical Bay → Rack C → Shelf C2 → BIN-CHEM-01",
      },
    ],
  },
};

export default function GoodsReceiptNotePage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Main GRN Dataset
  const [grnList, setGrnList] = useState<GRNRecord[]>(INITIAL_GRN_RECORDS);

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

  // Selected Purchase Order ID for Auto-Fetching
  const [selectedPOKey, setSelectedPOKey] = useState<string>("PO-2026-041");
  const currentPO = PO_MASTER_DATABASE[selectedPOKey] || PO_MASTER_DATABASE["PO-2026-041"];

  // STORE EXECUTIVE DELIVERIES FORM INPUTS (Physical Receipt Only)
  const [formReceiptDate, setFormReceiptDate] = useState("2026-07-25");
  const [formDeliveryTime, setFormDeliveryTime] = useState("10:30 AM");
  const [formInvoiceNo, setFormInvoiceNo] = useState("INV-AMUL-998");
  const [formInvoiceDate, setFormInvoiceDate] = useState("2026-07-25");
  const [formVehicleNo, setFormVehicleNo] = useState("MH-04-AB-1234");
  const [formDeliveryPerson, setFormDeliveryPerson] = useState("Ramesh Kumar (Driver)");
  const [formChallanNo, setFormChallanNo] = useState("CHAL-8841");
  const [formReceiver, setFormReceiver] = useState("Suresh Chander (Store In-charge)");
  const [formReceivingDock, setFormReceivingDock] = useState("Receiving Bay 01");
  const [formRemarks, setFormRemarks] = useState("Physical delivery verified at dock. Goods received intact and transferred to receiving bay.");

  // Items Grid Form State (Auto-populated from PO + Delivery fields)
  const [formItems, setFormItems] = useState<Array<{
    id: string;
    productCode: string;
    productName: string;
    category: string;
    brand: string;
    countryOfOrigin: string;
    unit: string;
    orderedQty: number;
    receivedQty: number;
    acceptedQty: number;
    rejectedQty: number;
    rate: number;
    discountPct: number;
    taxPct: number;
    netAmount: number;
    batchNumber: string;
    lotNumber: string;
    mfgDate: string;
    expiryDate: string;
    shelfLifeDays: number;
    daysRemaining: number;
    suggestedBin: string;
  }>>([]);

  // Auto-Fetch PO Data whenever selectedPOKey changes
  useEffect(() => {
    if (currentPO) {
      const mappedItems = currentPO.items.map((poItem, idx) => {
        const received = poItem.orderedQty;
        const netAmt = received * poItem.rate * (1 - poItem.discountPct / 100) * (1 + poItem.taxPct / 100);
        return {
          id: `item-${idx}-${Date.now()}`,
          productCode: poItem.productCode,
          productName: poItem.productName,
          category: poItem.category,
          brand: poItem.brand,
          countryOfOrigin: poItem.countryOfOrigin,
          unit: poItem.unit,
          orderedQty: poItem.orderedQty,
          receivedQty: received,
          acceptedQty: received,
          rejectedQty: 0,
          rate: poItem.rate,
          discountPct: poItem.discountPct,
          taxPct: poItem.taxPct,
          netAmount: netAmt,
          batchNumber: `B-${poItem.productCode.split("-")[0]}-${Date.now().toString().slice(-4)}`,
          lotNumber: `LOT-2026-0${idx + 1}`,
          mfgDate: "2026-07-20",
          expiryDate: "2026-07-28",
          shelfLifeDays: 8,
          daysRemaining: 3,
          suggestedBin: poItem.suggestedBin,
        };
      });
      setFormItems(mappedItems);
    }
  }, [selectedPOKey]);

  // Documents Attachments State
  const [formAttachments, setFormAttachments] = useState<AttachmentItem[]>([
    { id: "att-1", fileName: "Vendor_Invoice_AMUL_998.pdf", fileSize: "1.4 MB", fileType: "pdf" },
    { id: "att-2", fileName: "Delivery_Challan_CHAL_8841.pdf", fileSize: "850 KB", fileType: "pdf" },
  ]);

  // Filtered GRNs
  const filteredGRNs = useMemo(() => {
    return grnList.filter((g) => {
      const matchSearch =
        g.grnNumber.toLowerCase().includes(search.toLowerCase()) ||
        g.poNumber.toLowerCase().includes(search.toLowerCase()) ||
        g.supplierName.toLowerCase().includes(search.toLowerCase()) ||
        g.invoiceNumber.toLowerCase().includes(search.toLowerCase());

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

  // Submit Handler for GRN with Segregated QC Workflow
  const handleSaveGRN = (actionType: "Submit" | "Print" | "Inspection") => {
    // SMART VALIDATION CHECKS
    for (const item of formItems) {
      if (item.receivedQty > item.orderedQty) {
        alert(`[Validation Warning]: Received Quantity (${item.receivedQty}) exceeds Ordered Quantity (${item.orderedQty}) for ${item.productName}`);
      }
      if (item.expiryDate && item.mfgDate && new Date(item.expiryDate) < new Date(item.mfgDate)) {
        alert(`[Validation Error]: Expiry Date (${item.expiryDate}) cannot be before Manufacturing Date (${item.mfgDate}) for ${item.productName}`);
        return;
      }
    }

    const nextId = `grn-${Date.now()}`;
    const nextGRNNo = `GRN-2026-00${grnList.length + 1}`;

    const newRecord: GRNRecord = {
      id: nextId,
      grnNumber: nextGRNNo,
      poNumber: currentPO.poNumber,
      supplierName: currentPO.supplierName,
      receiptDate: formReceiptDate,
      warehouse: currentPO.warehouse,
      itemCount: formItems.length,
      receivedBy: formReceiver,
      status: "Pending", // Strict segregation: GRN is created as Pending until QC approves
      inspectionStatus: "Pending",
      invoiceNumber: formInvoiceNo,
      vehicleNumber: formVehicleNo,
      deliveryChallan: formChallanNo,
      totalAmount: formItems.reduce((acc, i) => acc + i.netAmount, 0),
      items: formItems.map((i) => ({
        id: i.id,
        productCode: i.productCode,
        productName: i.productName,
        category: i.category,
        orderedQty: i.orderedQty,
        receivedQty: i.receivedQty,
        acceptedQty: i.receivedQty, // Received qty pending QC check
        rejectedQty: 0,
        unit: i.unit,
        batchNumber: i.batchNumber,
        mfgDate: i.mfgDate,
        expiryDate: i.expiryDate,
        storageBin: i.suggestedBin.split(" → ").pop() || "BIN-DEFAULT-01",
        remarks: formRemarks,
      })),
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
        { timestamp: "Just Now", user: formReceiver, action: "GRN Created & Sent to Quality Inspection", status: "Success" },
      ],
    };

    setGrnList([newRecord, ...grnList]);
    setCreateDrawerOpen(false);

    // AUTOMATION LOGS FEEDBACK (Enterprise Segregated Workflow)
    const logs = [
      `✓ Goods Receipt Note ${nextGRNNo} generated against Approved ${currentPO.poNumber}`,
      `✓ Inventory Batch Record "${formItems[0]?.batchNumber}" created (Quarantine / Pending QC)`,
      `✓ Storage Location "${formItems[0]?.suggestedBin}" allocated`,
      `✓ Received Quantity (${formItems[0]?.receivedQty} ${formItems[0]?.unit}) reserved pending quality check`,
      `✓ Created Pending Quality Inspection task for QC Auditor`,
      `✓ Purchase Order ${currentPO.poNumber} received balance updated`,
      `✓ Complete Audit Trail Log entry generated`,
    ];
    setAutomationLog(logs);
    setSuccessModalData({
      grnNumber: nextGRNNo,
      poNumber: currentPO.poNumber,
      actionType,
    });
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
            onClick={() => setCreateDrawerOpen(true)}
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
        <ModuleDataTable
          columns={columns}
          rows={filteredGRNs}
          emptyMessage="No Goods Receipt Notes found."
          onRowClick={(r) => setSelectedGRN(r as GRNRecord)}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </div>

      {/* CREATE GRN DRAWER (SEGREGATED STORE RECEIVING WORKFLOW) */}
      <Drawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        title="Create Goods Receipt Note (GRN)"
        width="responsive"
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
                onClick={() => alert("Draft saved successfully!")}
                className="h-9 px-3 text-xs font-semibold border-slate-300 text-slate-700 rounded-xl cursor-pointer"
              >
                Save Draft
              </Button>
              <Button
                type="button"
                onClick={() => handleSaveGRN("Submit")}
                className="h-9 px-4 text-xs font-bold !bg-[#0F8A5F] text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" /> Submit GRN
              </Button>
              <Button
                type="button"
                onClick={() => handleSaveGRN("Print")}
                className="h-9 px-4 text-xs font-bold !bg-emerald-800 text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" /> Submit & Print GRN
              </Button>
              <Button
                type="button"
                onClick={() => handleSaveGRN("Inspection")}
                className="h-9 px-4 text-xs font-bold !bg-blue-800 text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <ShieldCheck className="h-4 w-4" /> Send to Quality Inspection
              </Button>
            </div>
          </div>
        }
      >
        <form className="space-y-6 py-2 select-none">
          {/* SECTION 1: PURCHASE ORDER SELECTION & AUTO-FETCHED PO INFORMATION */}
          <PurchaseFormCard title="Step 1: Select Approved Purchase Order (Auto-Fetched Data)" sectionNumber="Section 1 of 4">
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-950 font-semibold">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" />
                  Selecting an Approved PO automatically populates supplier details, ordered quantities, rates, and storage rules.
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px] uppercase">Auto-Fetch Active</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                {/* SELECT APPROVED PO */}
                <FormField label="Approved Purchase Order" required>
                  <SelectInput
                    value={selectedPOKey}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedPOKey(e.target.value)}
                    className="h-9 text-xs font-mono font-bold border-emerald-500 ring-2 ring-emerald-500/20"
                  >
                    <option value="PO-2026-041">PO-2026-041 (Amul Dairy - ₹34,650)</option>
                    <option value="PO-2026-042">PO-2026-042 (Fresh Farms - ₹18,400)</option>
                    <option value="PO-2026-043">PO-2026-043 (EcoClean - ₹24,500)</option>
                  </SelectInput>
                </FormField>

                {/* READ-ONLY AUTO-FETCHED FIELDS */}
                <FormField label="Supplier Name (PO)">
                  <div className="relative">
                    <TextInput value={currentPO.supplierName} readOnly className="h-9 text-xs font-bold bg-slate-50 pr-7" />
                    <Lock className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  </div>
                </FormField>

                <FormField label="Supplier Code (PO)">
                  <div className="relative">
                    <TextInput value={currentPO.supplierCode} readOnly className="h-9 text-xs font-mono font-bold bg-slate-50 pr-7" />
                    <Lock className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  </div>
                </FormField>

                <FormField label="Supplier Contact">
                  <div className="relative">
                    <TextInput value={currentPO.supplierContact} readOnly className="h-9 text-xs bg-slate-50 pr-7" />
                    <Lock className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  </div>
                </FormField>

                <FormField label="Target Warehouse (PO)">
                  <div className="relative">
                    <TextInput value={currentPO.warehouse} readOnly className="h-9 text-xs font-semibold bg-slate-50 pr-7" />
                    <Lock className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  </div>
                </FormField>

                <FormField label="PO Approval Date">
                  <div className="relative">
                    <TextInput value={currentPO.poDate} readOnly className="h-9 text-xs bg-slate-50 pr-7" />
                    <Lock className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  </div>
                </FormField>

                <FormField label="Expected Delivery Date">
                  <div className="relative">
                    <TextInput value={currentPO.expectedDeliveryDate} readOnly className="h-9 text-xs bg-slate-50 pr-7" />
                    <Lock className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  </div>
                </FormField>

                <FormField label="PO Currency">
                  <div className="relative">
                    <TextInput value={currentPO.currency} readOnly className="h-9 text-xs bg-slate-50 pr-7" />
                    <Lock className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  </div>
                </FormField>
              </div>
            </div>
          </PurchaseFormCard>

          {/* SECTION 2: STORE EXECUTIVE PHYSICAL DELIVERY INPUTS */}
          <PurchaseFormCard title="Step 2: Store Executive Physical Delivery Entries" sectionNumber="Section 2 of 4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <FormField label="Receipt Date" required>
                <TextInput
                  type="date"
                  value={formReceiptDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormReceiptDate(e.target.value)}
                  className="h-9 text-xs font-bold"
                />
              </FormField>

              <FormField label="Actual Delivery Time" required>
                <TextInput
                  value={formDeliveryTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormDeliveryTime(e.target.value)}
                  placeholder="e.g. 10:30 AM"
                  className="h-9 text-xs font-semibold"
                />
              </FormField>

              <FormField label="Receiving Dock / Bay" required>
                <SelectInput
                  value={formReceivingDock}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormReceivingDock(e.target.value)}
                  className="h-9 text-xs font-medium"
                >
                  <option value="Receiving Bay 01">Receiving Bay 01 (Main Complex)</option>
                  <option value="Cold Receiving Dock 02">Cold Receiving Dock 02 (Kitchen)</option>
                  <option value="Loading Dock 03">Loading Dock 03 (Stores)</option>
                </SelectInput>
              </FormField>

              <FormField label="Vendor Invoice Number" required>
                <TextInput
                  value={formInvoiceNo}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormInvoiceNo(e.target.value)}
                  placeholder="e.g. INV-AMUL-998"
                  className="h-9 text-xs font-mono font-bold"
                />
              </FormField>

              <FormField label="Invoice Date">
                <TextInput
                  type="date"
                  value={formInvoiceDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormInvoiceDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </FormField>

              <FormField label="Delivery Challan Number">
                <TextInput
                  value={formChallanNo}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormChallanNo(e.target.value)}
                  placeholder="e.g. CHAL-8841"
                  className="h-9 text-xs font-mono"
                />
              </FormField>

              <FormField label="Vehicle Number">
                <TextInput
                  value={formVehicleNo}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormVehicleNo(e.target.value)}
                  placeholder="e.g. MH-04-AB-1234"
                  className="h-9 text-xs font-mono"
                />
              </FormField>

              <FormField label="Supplier Delivery Person">
                <TextInput
                  value={formDeliveryPerson}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormDeliveryPerson(e.target.value)}
                  placeholder="Driver / Person Name"
                  className="h-9 text-xs"
                />
              </FormField>

              <FormField label="Receiver Name / Store In-charge" required>
                <TextInput
                  value={formReceiver}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormReceiver(e.target.value)}
                  placeholder="Store Manager Name"
                  className="h-9 text-xs font-bold"
                />
              </FormField>
            </div>
          </PurchaseFormCard>

          {/* SECTION 3: PRODUCTS RECEIVED & BATCH CONTROL GRID */}
          <PurchaseFormCard title="Step 3: Products Received, Quantity & Batch Allocation" sectionNumber="Section 3 of 4">
            <div className="space-y-4 overflow-x-auto text-xs">
              {formItems.map((item, idx) => (
                <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="font-bold text-slate-900 flex items-center gap-2">
                      <Package className="h-4 w-4 text-emerald-600" />
                      Item #{idx + 1}: {item.productName} ({item.productCode})
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                      PO Rate: ₹{item.rate} / {item.unit}
                    </span>
                  </div>

                  {/* READ-ONLY PO PRODUCT DETAILS */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    <div className="col-span-2">
                      <span className="text-[10px] font-semibold text-slate-500 block mb-1">Product Description (PO)</span>
                      <TextInput value={item.productName} readOnly className="h-9 text-xs font-bold bg-slate-100" />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block mb-1">Category (PO)</span>
                      <TextInput value={item.category} readOnly className="h-9 text-xs bg-slate-100" />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block mb-1">Brand (PO)</span>
                      <TextInput value={item.brand} readOnly className="h-9 text-xs bg-slate-100" />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block mb-1">Unit (PO)</span>
                      <TextInput value={item.unit} readOnly className="h-9 text-xs font-bold bg-slate-100" />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block mb-1">Ordered Qty (PO)</span>
                      <TextInput value={`${item.orderedQty} ${item.unit}`} readOnly className="h-9 text-xs text-center font-bold bg-slate-100" />
                    </div>
                  </div>

                  {/* STORE EXECUTIVE QUANTITY & FINANCIAL INPUTS */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] font-bold text-slate-900 block mb-1">Received Qty</span>
                      <TextInput
                        type="number"
                        value={item.receivedQty}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const r = Number(e.target.value);
                          setFormItems(
                            formItems.map((i) =>
                              i.id === item.id
                                ? { ...i, receivedQty: r, acceptedQty: r, netAmount: r * i.rate * (1 + i.taxPct / 100) }
                                : i
                            )
                          );
                        }}
                        className="h-9 text-xs text-center font-bold border-emerald-500 bg-white"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block mb-1">PO Rate (Tax: {item.taxPct}%)</span>
                      <TextInput value={`₹${item.rate}`} readOnly className="h-9 text-xs text-right font-semibold bg-slate-100" />
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block mb-1">Calculated Net Amount</span>
                      <TextInput value={`₹${item.netAmount.toLocaleString("en-IN")}`} readOnly className="h-9 text-xs text-right font-black bg-slate-100 text-slate-900" />
                    </div>
                  </div>

                  {/* BATCH CONTROL & STORAGE HIERARCHY LOCATION */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-lg border border-slate-200 bg-white">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 block mb-1">Batch Number</span>
                      <TextInput
                        value={item.batchNumber}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormItems(formItems.map((i) => (i.id === item.id ? { ...i, batchNumber: e.target.value } : i)))
                        }
                        className="h-9 text-xs font-mono font-bold bg-emerald-50 border-emerald-300"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block mb-1">Lot Number</span>
                      <TextInput
                        value={item.lotNumber}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormItems(formItems.map((i) => (i.id === item.id ? { ...i, lotNumber: e.target.value } : i)))
                        }
                        className="h-9 text-xs font-mono bg-white"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block mb-1">Manufacturing Date</span>
                      <TextInput
                        type="date"
                        value={item.mfgDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormItems(formItems.map((i) => (i.id === item.id ? { ...i, mfgDate: e.target.value } : i)))
                        }
                        className="h-9 text-xs bg-white"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-amber-900 block mb-1">Expiry Date</span>
                      <TextInput
                        type="date"
                        value={item.expiryDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormItems(formItems.map((i) => (i.id === item.id ? { ...i, expiryDate: e.target.value } : i)))
                        }
                        className="h-9 text-xs bg-white font-bold text-amber-900 border-amber-300"
                      />
                    </div>

                    {/* SUGGESTED STORAGE LOCATION HIERARCHY */}
                    <div className="md:col-span-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-700 block mb-1">
                        Suggested Storage Location Hierarchy (Warehouse $\rightarrow$ Zone $\rightarrow$ Rack $\rightarrow$ Shelf $\rightarrow$ Bin)
                      </span>
                      <div className="flex items-center gap-1 font-mono text-[11px] font-extrabold text-emerald-900 bg-white p-2 rounded border border-emerald-200">
                        <Building2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{item.suggestedBin}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </PurchaseFormCard>

          {/* SECTION 4: READ-ONLY QUALITY INSPECTION WORKFLOW & DOCUMENTS */}
          <PurchaseFormCard title="Step 4: Quality Inspection & Document Attachments" sectionNumber="Section 4 of 4">
            <div className="space-y-4 text-xs">
              {/* READ-ONLY QUALITY INSPECTION WORKFLOW CARD */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-amber-950 text-xs flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-amber-600" />
                    Quality Inspection Workflow (Segregation of Duties)
                  </span>
                  <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-200 text-amber-900 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Pending
                  </span>
                </div>
                <p className="text-xs text-amber-900 font-medium">
                  This GRN will automatically be sent to the <strong>Quality Inspection module</strong> after submission. Store Executives confirm physical receipt only; Quality Auditors perform the official inspection, sampling, and Pass/Reject sign-off.
                </p>
              </div>

              <div>
                <FormField label="Receiver Remarks & Receiving Observations">
                  <TextInput
                    value={formRemarks}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormRemarks(e.target.value)}
                    className="h-9 text-xs"
                  />
                </FormField>
              </div>

              <div className="pt-2">
                <span className="font-extrabold text-slate-900 block mb-2">Upload Invoices, Delivery Challans & Certificates</span>
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
          width="lg"
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

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
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
                  <span className="text-[10px] text-slate-400 block font-medium">Vendor Invoice #</span>
                  <span className="font-mono text-slate-800">{selectedGRN.invoiceNumber}</span>
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
                    {selectedGRN.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 px-2 font-bold text-slate-900">
                          {item.productName}
                          <div className="text-[10px] font-normal text-slate-400">{item.productCode} • {item.storageBin}</div>
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-600">{item.orderedQty} {item.unit}</td>
                        <td className="py-2.5 px-2 text-center font-bold text-slate-800">{item.receivedQty} {item.unit}</td>
                        <td className="py-2.5 px-2 text-center font-extrabold text-emerald-700">{item.acceptedQty} {item.unit}</td>
                        <td className="py-2.5 px-2 text-center font-extrabold text-red-600">{item.rejectedQty} {item.unit}</td>
                        <td className="py-2.5 px-2 font-mono text-slate-700">{item.batchNumber}</td>
                        <td className="py-2.5 px-2 text-slate-600">{item.expiryDate}</td>
                      </tr>
                    ))}
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
                {renderInspectionBadge(selectedGRN.inspectionDetails.status)}
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Inspector / Auditor</span>
                  <span className="font-bold text-slate-900">{selectedGRN.inspectionDetails.inspector}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Inspection Date</span>
                  <span className="font-semibold text-slate-800">{selectedGRN.inspectionDetails.inspectionDate}</span>
                </div>
                <div className="col-span-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 block font-medium">QC Notes & Remarks</span>
                  <p className="text-xs font-medium text-slate-700 mt-0.5">{selectedGRN.inspectionDetails.comments}</p>
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
