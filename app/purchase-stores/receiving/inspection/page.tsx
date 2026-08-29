"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ClipboardCheck,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Printer,
  MoreVertical,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Check,
  FileText,
  Layers,
  Building2,
  Clock,
  FileSpreadsheet,
  Package,
  Trash2,
  Sparkles,
  Lock,
  Camera,
  ArrowRight,
  Sliders,
  ListFilter,
  AlertCircle,
  CheckSquare,
  BadgeAlert,
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
import type { QualityInspectionRecord, QIItem, QIChecklistItem } from "@/app/data/qualityInspectionData";
import { usePsList } from "@/hooks/usePsResource";
import { psQualityInspectionService } from "@/services/purchase-stores/index";

// SAMPLE GRN DATABASE FOR AUTO-LOADING INSPECTIONS
const SAMPLE_GRN_QC_DATABASE: Record<string, {
  grnNumber: string;
  poNumber: string;
  supplierName: string;
  warehouse: string;
  receiptDate: string;
  items: Array<{
    productCode: string;
    productName: string;
    batchNumber: string;
    mfgDate: string;
    expiryDate: string;
    storageLocation: string;
    receivedQty: number;
    unit: string;
  }>;
}> = {
  "GRN-2026-012": {
    grnNumber: "GRN-2026-012",
    poNumber: "PO-2026-042",
    supplierName: "Fresh Farms India Pvt. Ltd.",
    warehouse: "Main Kitchen Store",
    receiptDate: "2026-07-25",
    items: [
      {
        productCode: "FNB-VEG-09",
        productName: "Exotic Baby Spinach (500g)",
        batchNumber: "B-FF-1120",
        mfgDate: "2026-07-22",
        expiryDate: "2026-07-26",
        storageLocation: "Main Kitchen Store → BIN-VEG-02",
        receivedQty: 70,
        unit: "Packs",
      },
    ],
  },
  "GRN-2026-014": {
    grnNumber: "GRN-2026-014",
    poNumber: "PO-2026-044",
    supplierName: "ABC Linen Pvt Ltd",
    warehouse: "Central Linen Warehouse",
    receiptDate: "2026-07-24",
    items: [
      {
        productCode: "HK-LIN-01",
        productName: "King Bed Sheets 300TC Cotton",
        batchNumber: "B-LNN-9941",
        mfgDate: "2026-06-15",
        expiryDate: "2030-01-01",
        storageLocation: "Central Linen Warehouse → BIN-LIN-04",
        receivedQty: 150,
        unit: "Sheets",
      },
    ],
  },
  "GRN-2026-011": {
    grnNumber: "GRN-2026-011",
    poNumber: "PO-2026-041",
    supplierName: "Amul Dairy Products Ltd.",
    warehouse: "Central Cold Storage",
    receiptDate: "2026-07-15",
    items: [
      {
        productCode: "FNB-DRY-01",
        productName: "Full Cream Fresh Milk 1L",
        batchNumber: "B-AML-8821",
        mfgDate: "2026-07-20",
        expiryDate: "2026-07-28",
        storageLocation: "Central Cold Storage → BIN-CHILL-D1-01",
        receivedQty: 500,
        unit: "Litres",
      },
    ],
  },
  "GRN-2026-013": {
    grnNumber: "GRN-2026-013",
    poNumber: "PO-2026-043",
    supplierName: "EcoClean Hygiene Solutions Ltd.",
    warehouse: "Housekeeping Store",
    receiptDate: "2026-07-20",
    items: [
      {
        productCode: "HK-CHM-05",
        productName: "Taski R2 All Surface Cleaner 5L",
        batchNumber: "B-ECO-7741",
        mfgDate: "2026-06-01",
        expiryDate: "2028-06-01",
        storageLocation: "Housekeeping Store → BIN-CHEM-01",
        receivedQty: 15,
        unit: "Canisters",
      },
    ],
  },
};

export default function QualityInspectionPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Main Dataset State
  const { data: qiList, loading, reload } = usePsList(() => psQualityInspectionService.list(), []);
  const [saving, setSaving] = useState(false);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Sort State
  const [sortBy, setSortBy] = useState<"default" | "status" | "date" | "priority" | "age" | "supplier">("default");
  const [sortAsc, setSortAsc] = useState(true);

  // Pending Inspection Count (Synchronized across UI)
  const pendingCount = useMemo(() => {
    return qiList.filter((q) => q.status === "Pending" || q.status === "In Progress" || q.status === "Inspection Pending").length;
  }, [qiList]);

  const statusTabCounts = useMemo(() => {
    const isPending = (q: QualityInspectionRecord) =>
      q.status === "Pending" || q.status === "Inspection Pending";
    return {
      all: qiList.length,
      Pending: qiList.filter(isPending).length,
      "In Progress": qiList.filter((q) => q.status === "In Progress").length,
      Completed: qiList.filter((q) => q.status === "Completed").length,
    };
  }, [qiList]);

  // Drawers & Modals State
  const [pendingQueueDrawerOpen, setPendingQueueDrawerOpen] = useState(false);
  const [performInspectionDrawerOpen, setPerformInspectionDrawerOpen] = useState(false);
  const [selectedQI, setSelectedQI] = useState<QualityInspectionRecord | null>(null);
  const [activeInspectionRecord, setActiveInspectionRecord] = useState<QualityInspectionRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Automation Feedback Modal State
  const [automationLog, setAutomationLog] = useState<{ isPassed: boolean; logs: string[] } | null>(null);

  // Current Active GRN Details for Perform Inspection Drawer
  const activeGRNKey = activeInspectionRecord?.grnNumber || "GRN-2026-012";
  const currentFetchedGRN = SAMPLE_GRN_QC_DATABASE[activeGRNKey] || SAMPLE_GRN_QC_DATABASE["GRN-2026-012"];

  // Header Inspection State
  const [formInspectionType, setFormInspectionType] = useState<"Incoming GRN Receipt" | "Random Audit" | "Expiry Verification">("Incoming GRN Receipt");
  const [formInspector, setFormInspector] = useState("Quality Auditor Anand");
  const [formInspectionDate, setFormInspectionDate] = useState("2026-07-25");
  const [formRemarks, setFormRemarks] = useState("Visual inspection, cold dock temperature test, and seal verification conducted.");

  // Inspection Checklist Items (8 Enterprise Criteria)
  const [checklist, setChecklist] = useState({
    packagingCondition: "Good",
    sealVerification: "Passed",
    quantityVerification: "Correct",
    expiryVerification: "Valid",
    temperatureCheck: "Passed",
    visualInspection: "Passed",
    productQuality: "Accepted",
  });

  // Items Inspection Grid State
  const [formItems, setFormItems] = useState<Array<{
    id: string;
    productCode: string;
    productName: string;
    batchNumber: string;
    mfgDate: string;
    expiryDate: string;
    storageLocation: string;
    receivedQty: number;
    acceptedQty: number;
    rejectedQty: number;
    qualityResult: "Passed" | "Partially Accepted" | "Rejected";
    rejectionReason: string;
    vendorReturnRequired: boolean;
    remarks: string;
  }>>([]);

  // Load Active Inspection Data into Form
  useEffect(() => {
    if (activeInspectionRecord) {
      setFormInspector(activeInspectionRecord.inspectorName || "Quality Auditor Anand");
      setFormInspectionDate(activeInspectionRecord.inspectionDate || "2026-07-25");
      setFormRemarks(activeInspectionRecord.generalRemarks || activeInspectionRecord.remarks || "Cold dock inspection in progress.");

      if (currentFetchedGRN) {
        const mapped = currentFetchedGRN.items.map((item, idx) => ({
          id: `qii-${idx}-${Date.now()}`,
          productCode: item.productCode,
          productName: item.productName,
          batchNumber: item.batchNumber,
          mfgDate: item.mfgDate,
          expiryDate: item.expiryDate,
          storageLocation: item.storageLocation,
          receivedQty: item.receivedQty,
          acceptedQty: item.receivedQty,
          rejectedQty: 0,
          qualityResult: "Passed" as const,
          rejectionReason: "",
          vendorReturnRequired: false,
          remarks: "Sample passed laboratory check.",
        }));
        setFormItems(mapped);
      }
    }
  }, [activeInspectionRecord]);

  // Documents / Photos Attachments State
  const [formAttachments, setFormAttachments] = useState<AttachmentItem[]>([
    { id: "att-qc-1", fileName: "Cold_Dock_Temp_Log_25Jul.pdf", fileSize: "1.1 MB", fileType: "pdf" },
    { id: "att-qc-2", fileName: "Lab_Quality_Certificate.pdf", fileSize: "2.3 MB", fileType: "pdf" },
  ]);

  // Advanced filters only (status pills + search are separate)
  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (supplierFilter !== "all") n += 1;
    if (warehouseFilter !== "all") n += 1;
    if (resultFilter !== "all") n += 1;
    if (priorityFilter !== "all") n += 1;
    if (dateFilter) n += 1;
    return n;
  }, [supplierFilter, warehouseFilter, resultFilter, priorityFilter, dateFilter]);

  const handleResetFilters = () => {
    setSupplierFilter("all");
    setWarehouseFilter("all");
    setResultFilter("all");
    setPriorityFilter("all");
    setDateFilter("");
  };

  // Filtered & Sorted Inspection List (Default Sort: Pending -> In Progress -> Completed -> Rejected)
  const filteredQIs = useMemo(() => {
    const statusOrderMap: Record<string, number> = {
      Pending: 1,
      "Inspection Pending": 1,
      "In Progress": 2,
      Completed: 3,
      Rejected: 4,
    };

    let list = qiList.filter((q) => {
      const matchSearch =
        q.inspectionNumber.toLowerCase().includes(search.toLowerCase()) ||
        q.grnNumber.toLowerCase().includes(search.toLowerCase()) ||
        q.poNumber.toLowerCase().includes(search.toLowerCase()) ||
        q.supplierName.toLowerCase().includes(search.toLowerCase()) ||
        q.inspectorName.toLowerCase().includes(search.toLowerCase());

      const matchSupplier = supplierFilter === "all" || q.supplierName.toLowerCase().includes(supplierFilter.toLowerCase());
      const matchWarehouse = warehouseFilter === "all" || q.warehouse.toLowerCase().includes(warehouseFilter.toLowerCase());
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "Pending" && (q.status === "Pending" || q.status === "Inspection Pending")) ||
        q.status === statusFilter;
      const matchResult = resultFilter === "all" || q.result === resultFilter;
      const matchPriority = priorityFilter === "all" || q.priority === priorityFilter;
      const matchDate = !dateFilter || q.inspectionDate.includes(dateFilter);

      return (
        matchSearch &&
        matchSupplier &&
        matchWarehouse &&
        matchStatus &&
        matchResult &&
        matchPriority &&
        matchDate
      );
    });

    // Apply Sorting
    return list.sort((a, b) => {
      if (sortBy === "default") {
        const orderA = statusOrderMap[a.status] || 99;
        const orderB = statusOrderMap[b.status] || 99;
        return orderA - orderB;
      }
      if (sortBy === "priority") {
        const pMap = { High: 1, Medium: 2, Low: 3 };
        return (pMap[a.priority] - pMap[b.priority]) * (sortAsc ? 1 : -1);
      }
      if (sortBy === "supplier") {
        return a.supplierName.localeCompare(b.supplierName) * (sortAsc ? 1 : -1);
      }
      return 0;
    });
  }, [qiList, search, supplierFilter, warehouseFilter, statusFilter, resultFilter, priorityFilter, dateFilter, sortBy, sortAsc]);

  // Open Inspection Workflow from Queue
  const handleOpenInspection = (record: QualityInspectionRecord) => {
    setActiveInspectionRecord(record);
    setPendingQueueDrawerOpen(false);
    setPerformInspectionDrawerOpen(true);
  };

  // Has Any Rejected Item?
  const hasRejectedItems = useMemo(() => {
    return formItems.some((i) => i.qualityResult === "Rejected" || i.qualityResult === "Partially Accepted" || i.rejectedQty > 0);
  }, [formItems]);

  // Save / Complete Quality Inspection
  const handleSaveInspection = async (isComplete: boolean) => {
    if (!activeInspectionRecord) return;

    // BUSINESS RULES VALIDATION
    for (const item of formItems) {
      if (item.acceptedQty + item.rejectedQty !== item.receivedQty) {
        alert(`[Validation Error]: Accepted Qty (${item.acceptedQty}) + Rejected Qty (${item.rejectedQty}) must equal Received Qty (${item.receivedQty}) for ${item.productName}`);
        return;
      }
      if ((item.qualityResult === "Rejected" || item.qualityResult === "Partially Accepted") && !item.rejectionReason) {
        alert(`[Validation Error]: Rejection Reason is mandatory for ${item.productName}`);
        return;
      }
    }

    const overallResult: "Passed" | "Partial" | "Rejected" = hasRejectedItems
      ? formItems.every((i) => i.qualityResult === "Rejected")
        ? "Rejected"
        : "Partial"
      : "Passed";

    const updatePayload: Partial<QualityInspectionRecord> = {
      status: isComplete ? "Completed" : "In Progress",
      result: overallResult,
      inspectorName: formInspector,
      generalRemarks: formRemarks,
      remarks: formRemarks,
      checklist: [
        { id: "c1", category: "Packaging & Seal Verification", checkItem: "Packaging Condition", result: checklist.packagingCondition === "Good" ? "Pass" : "Fail" },
        { id: "c2", category: "Packaging & Seal Verification", checkItem: "Seal Integrity", result: checklist.sealVerification === "Passed" ? "Pass" : "Fail" },
        { id: "c3", category: "Expiry & Storage", checkItem: "Expiry & FEFO Check", result: checklist.expiryVerification === "Valid" ? "Pass" : "Fail" },
        { id: "c4", category: "Temperature & Quality", checkItem: "Cold Chain Temperature", result: checklist.temperatureCheck === "Passed" ? "Pass" : "Fail" },
      ],
      items: formItems.map((i) => ({
        id: i.id,
        productCode: i.productCode,
        productName: i.productName,
        receivedQty: i.receivedQty,
        inspectedQty: i.receivedQty,
        acceptedQty: i.acceptedQty,
        rejectedQty: i.rejectedQty,
        qualityResult: i.qualityResult as QIItem["qualityResult"],
        rejectionReason: i.rejectionReason,
        remarks: i.remarks,
      })),
    };

    setSaving(true);
    try {
      await psQualityInspectionService.update(activeInspectionRecord.id, updatePayload);
      await reload();
      setPerformInspectionDrawerOpen(false);

    // AUTOMATION LOGS FEEDBACK
    if (isComplete) {
      if (overallResult === "Passed") {
        setAutomationLog({
          isPassed: true,
          logs: [
            `✓ Quality Inspection ${activeInspectionRecord.inspectionNumber} Passed & Completed`,
            `✓ Accepted Quantity (${formItems[0]?.acceptedQty} ${formItems[0]?.productName}) moved to Available Inventory`,
            `✓ Warehouse Stock & Storage Bin updated`,
            `✓ Batch "${formItems[0]?.batchNumber}" status set to ACTIVE in Batch & FEFO Module`,
            `✓ Stock Ledger updated (GRN ${currentFetchedGRN.grnNumber} Approved)`,
            `✓ Items available for Department Stock Issues`,
          ],
        });
      } else {
        setAutomationLog({
          isPassed: false,
          logs: [
            `✓ Quality Inspection ${activeInspectionRecord.inspectionNumber} Completed with Rejections (${overallResult})`,
            `✓ Accepted Quantity (${formItems[0]?.acceptedQty}) moved to Available Inventory`,
            `✓ Rejected Quantity (${formItems[0]?.rejectedQty}) transferred to Vendor Return (RGP Gate Pass Draft)`,
            `✓ Stock Ledger & Batch Quantities updated`,
            `✓ Vendor Return RGP Draft created automatically`,
            `✓ Purchase Order history updated`,
          ],
        });
      }
    } else {
      alert("Inspection status saved as 'In Progress'.");
    }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save inspection");
    } finally {
      setSaving(false);
    }
  };

  // Shared badge style (matches GRN table)
  const statusBadgeClass = (tone: "success" | "danger" | "warning" | "info" | "neutral") => {
    const tones = {
      success: "bg-emerald-50 text-emerald-700 border-emerald-200",
      danger: "bg-red-50 text-red-700 border-red-200",
      warning: "bg-amber-50 text-amber-800 border-amber-200",
      info: "bg-blue-50 text-blue-700 border-blue-200",
      neutral: "bg-slate-50 text-slate-600 border-slate-200",
    };
    return cn(
      "inline-flex items-center whitespace-nowrap px-2 py-0.5 text-[10px] font-bold rounded-md border",
      tones[tone],
    );
  };

  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case "High":
        return <span className={statusBadgeClass("danger")}>High</span>;
      case "Medium":
        return <span className={statusBadgeClass("warning")}>Medium</span>;
      default:
        return <span className={statusBadgeClass("success")}>Low</span>;
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <span className={statusBadgeClass("success")}>Completed</span>;
      case "In Progress":
        return <span className={statusBadgeClass("info")}>In Progress</span>;
      case "Pending":
      case "Inspection Pending":
        return <span className={statusBadgeClass("warning")}>Pending</span>;
      default:
        return <span className={statusBadgeClass("neutral")}>{status}</span>;
    }
  };

  const renderResultBadge = (result: string) => {
    switch (result) {
      case "Passed":
        return <span className={statusBadgeClass("success")}>Passed</span>;
      case "Partial":
      case "Partially Accepted":
        return <span className={statusBadgeClass("warning")}>Partial</span>;
      case "Rejected":
        return <span className={statusBadgeClass("danger")}>Rejected</span>;
      case "Pending":
      default:
        return <span className={statusBadgeClass("warning")}>Pending</span>;
    }
  };

  // Columns for ModuleDataTable
  const columns: ModuleColumn[] = [
    {
      key: "inspectionNumber",
      header: "Inspection No",
      render: (r: QualityInspectionRecord) => (
        <span className="font-mono font-extrabold text-emerald-900 flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          {r.inspectionNumber}
        </span>
      ),
    },
    {
      key: "grnNumber",
      header: "GRN Number",
      render: (r: QualityInspectionRecord) => (
        <span className="font-mono text-slate-800 font-bold text-xs">{r.grnNumber}</span>
      ),
    },
    {
      key: "supplierName",
      header: "Supplier",
      render: (r: QualityInspectionRecord) => (
        <span className="font-bold text-slate-900 text-xs">{r.supplierName}</span>
      ),
    },
    {
      key: "warehouse",
      header: "Warehouse",
      render: (r: QualityInspectionRecord) => (
        <span className="text-slate-700 font-medium text-xs">{r.warehouse}</span>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      render: (r: QualityInspectionRecord) => renderPriorityBadge(r.priority),
    },
    {
      key: "age",
      header: "Age",
      render: (r: QualityInspectionRecord) => (
        <span
          className={statusBadgeClass(r.isOverdue ? "danger" : "info")}
        >
          {r.age}
          {r.isOverdue ? " · Overdue" : ""}
        </span>
      ),
    },
    {
      key: "inspectorName",
      header: "Inspector",
      render: (r: QualityInspectionRecord) => (
        <span className="text-slate-700 font-medium text-xs">{r.inspectorName}</span>
      ),
    },
    {
      key: "result",
      header: "QC Result",
      render: (r: QualityInspectionRecord) => renderResultBadge(r.result),
    },
    {
      key: "status",
      header: "Status",
      render: (r: QualityInspectionRecord) => renderStatusBadge(r.status),
    },
  ];

  if (!isMounted) return null;

  return (
    <div className="space-y-6 pb-12 select-none min-h-screen">
      {/* PAGE HEADER */}
      <FOPageHeader
        eyebrow="Receiving & Quality Control"
        title="Quality Inspection Queue"
        description="Enterprise inspection queue automatically generated from submitted Goods Receipt Notes (GRN)."
        action={
          <Button
            type="button"
            onClick={() => setPendingQueueDrawerOpen(true)}
            className="h-9 px-4 text-xs font-bold !bg-amber-600 hover:!bg-amber-700 text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-2 relative"
          >
            <Clock className="h-4 w-4" />
            <span>Pending Inspections</span>
            <span className="ml-1 px-2 py-0.5 text-[10px] font-black bg-white text-amber-900 rounded-full shadow-2xs">
              {pendingCount}
            </span>
          </Button>
        }
      />

      {/* 4 SUMMARY KPI CARDS WITH SYNCHRONIZED COUNTER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatMiniCard
          label="Pending"
          value={String(pendingCount)}
          sublabel="Awaiting inspector sign-off"
          icon={ClipboardCheck}
          accent="#d97706"
        />
        <StatMiniCard
          label="Passed Inspections"
          value="128"
          sublabel="Met quality standards"
          icon={ShieldCheck}
          accent="#0f8a5f"
        />
        <StatMiniCard
          label="Rejected Batches"
          value="6"
          sublabel="Failed inspection"
          icon={AlertTriangle}
          accent="#dc2626"
        />
        <StatMiniCard
          label="Pass Rate"
          value="95.5%"
          sublabel="Quality compliance rate"
          icon={TrendingUp}
          accent="#2563eb"
        />
      </div>

      {/* Search + status pills (FO style) */}
      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search Inspection No, GRN, Supplier, Inspector..."
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setFilterDrawerOpen(true)}
        statusTabs={[
          { id: "all", label: `All ${statusTabCounts.all}` },
          { id: "Pending", label: `Pending ${statusTabCounts.Pending}` },
          { id: "In Progress", label: `In Progress ${statusTabCounts["In Progress"]}` },
          { id: "Completed", label: `Completed ${statusTabCounts.Completed}` },
        ]}
        activeStatusTab={statusFilter}
        onStatusTabChange={setStatusFilter}
        selectionBar={
          <ModuleSelectionBar
            count={selectedIds.size}
            noun="inspection"
            onClear={() => setSelectedIds(new Set())}
            actions={[
              ...(() => {
                const first = filteredQIs.find((q) => selectedIds.has(q.id));
                if (!first) return [];
                if (first.status !== "Completed") {
                  return [
                    {
                      label: first.status === "In Progress" ? "Continue" : "Inspect",
                      onClick: () => handleOpenInspection(first),
                    },
                  ];
                }
                return [{ label: "View", onClick: () => setSelectedQI(first) }];
              })(),
              {
                label: "Print",
                icon: <Printer className="h-3.5 w-3.5" />,
                onClick: () => {
                  const first = filteredQIs.find((q) => selectedIds.has(q.id));
                  if (first) alert(`Printing Inspection Report ${first.inspectionNumber}`);
                },
              },
            ]}
          />
        }
      />

      <OperationsFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filter Inspections"
        activeFilterCount={activeFilterCount}
        onReset={handleResetFilters}
      >
        <div className="space-y-4">
          <FormField label="Priority">
            <SelectInput
              value={priorityFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPriorityFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </SelectInput>
          </FormField>

          <FormField label="QC Result">
            <SelectInput
              value={resultFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setResultFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Results</option>
              <option value="Pending">Pending</option>
              <option value="Passed">Passed</option>
              <option value="Partially Accepted">Partially Accepted</option>
              <option value="Rejected">Rejected</option>
            </SelectInput>
          </FormField>

          <FormField label="Supplier">
            <SelectInput
              value={supplierFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSupplierFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Suppliers</option>
              <option value="Amul Dairy">Amul Dairy</option>
              <option value="Fresh Farms">Fresh Farms</option>
              <option value="EcoClean">EcoClean</option>
              <option value="ABC Linen">ABC Linen</option>
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

          <FormField label="Inspection Date">
            <TextInput
              type="date"
              value={dateFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateFilter(e.target.value)}
              className="h-9 w-full text-xs rounded-xl"
            />
          </FormField>
        </div>
      </OperationsFilterDrawer>

      {/* CORE DATA TABLE WITH SORTED QUEUE (Pending First) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        {loading ? (
          <div className="py-8 text-center text-sm text-slate-500">Loading inspections…</div>
        ) : (
        <ModuleDataTable
          columns={columns}
          rows={filteredQIs}
          emptyMessage="No Quality Inspection queue items found."
          onRowClick={(r) => {
            const qiRecord = r as QualityInspectionRecord;
            if (qiRecord.status === "Completed") {
              setSelectedQI(qiRecord);
            } else {
              handleOpenInspection(qiRecord);
            }
          }}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
        )}
      </div>

      {/* PENDING INSPECTION QUEUE SIDE PANEL */}
      <Drawer
        open={pendingQueueDrawerOpen}
        onClose={() => setPendingQueueDrawerOpen(false)}
        title={`Pending Inspection Queue (${pendingCount} Items Awaiting Sign-off)`}
        width="responsive"
      >
        <div className="space-y-4 py-2 select-none text-xs">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between font-medium text-amber-950">
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600 animate-pulse" />
              Quality Inspectors work directly from this queue of pending GRN receipts.
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-bold text-[10px] uppercase">Automated GRN Queue</span>
          </div>

          <div className="space-y-3">
            {qiList
              .filter((q) => q.status === "Pending" || q.status === "In Progress" || q.status === "Inspection Pending")
              .map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs transition-all space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-mono font-extrabold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-amber-600" />
                      {item.inspectionNumber} • {item.grnNumber}
                    </span>
                    <div className="flex items-center gap-2">
                      {renderPriorityBadge(item.priority)}
                      {renderStatusBadge(item.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Supplier</span>
                      <span className="font-bold text-slate-900">{item.supplierName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Warehouse</span>
                      <span className="font-semibold text-slate-800">{item.warehouse}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Receipt Age</span>
                      <span className={cn("font-bold px-1.5 py-0.5 rounded text-[11px]", item.isOverdue ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700")}>
                        {item.age} {item.isOverdue && "• Overdue"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Assigned Inspector</span>
                      <span className="font-semibold text-slate-800">{item.inspectorName}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Products: {item.items[0]?.productName || "Inspected Goods"}
                    </span>
                    <Button
                      type="button"
                      onClick={() => handleOpenInspection(item)}
                      className="h-8 px-4 text-xs font-bold !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckSquare className="h-3.5 w-3.5" /> Open Inspection
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </Drawer>

      {/* PERFORM QUALITY INSPECTION WORKFLOW DRAWER */}
      <Drawer
        open={performInspectionDrawerOpen}
        onClose={() => setPerformInspectionDrawerOpen(false)}
        title={activeInspectionRecord ? `Perform Quality Inspection: ${activeInspectionRecord.inspectionNumber}` : "Quality Inspection Workstation"}
        width="responsive"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPerformInspectionDrawerOpen(false)}
              className="h-9 px-4 text-xs font-semibold border-slate-300 text-slate-700 rounded-xl cursor-pointer"
            >
              Cancel
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSaveInspection(false)}
                className="h-9 px-3 text-xs font-semibold border-slate-300 text-slate-700 rounded-xl cursor-pointer"
              >
                Save Draft
              </Button>

              {hasRejectedItems ? (
                <Button
                  type="button"
                  onClick={() => handleSaveInspection(true)}
                  className="h-9 px-4 text-xs font-bold !bg-red-700 hover:!bg-red-800 text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <AlertTriangle className="h-4 w-4" /> Complete & Create Vendor Return
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => handleSaveInspection(true)}
                  className="h-9 px-4 text-xs font-bold !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" /> Complete Inspection & Release Inventory
                </Button>
              )}
            </div>
          </div>
        }
      >
        <form className="space-y-6 py-2 select-none">
          {/* SECTION 1: AUTO-LOADED GRN DETAILS */}
          <PurchaseFormCard title="Step 1: Auto-Loaded GRN Reference & Header Details" sectionNumber="Section 1 of 4">
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-950 font-semibold">
                <span className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-emerald-600" />
                  Auto-loaded from submitted {currentFetchedGRN.grnNumber}. Inspector performs inspection only.
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px] uppercase">Auto-Loaded</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <FormField label="GRN Reference">
                  <TextInput value={currentFetchedGRN.grnNumber} readOnly className="h-9 text-xs font-mono font-bold bg-slate-50" />
                </FormField>

                <FormField label="Purchase Order (PO)">
                  <TextInput value={currentFetchedGRN.poNumber} readOnly className="h-9 text-xs font-mono font-bold bg-slate-50" />
                </FormField>

                <FormField label="Supplier">
                  <TextInput value={currentFetchedGRN.supplierName} readOnly className="h-9 text-xs font-bold bg-slate-50" />
                </FormField>

                <FormField label="Target Warehouse">
                  <TextInput value={currentFetchedGRN.warehouse} readOnly className="h-9 text-xs font-semibold bg-slate-50" />
                </FormField>

                <FormField label="Inspector Name" required>
                  <TextInput
                    value={formInspector}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormInspector(e.target.value)}
                    className="h-9 text-xs font-bold"
                  />
                </FormField>

                <FormField label="Inspection Date" required>
                  <TextInput
                    type="date"
                    value={formInspectionDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormInspectionDate(e.target.value)}
                    className="h-9 text-xs font-bold"
                  />
                </FormField>

                <FormField label="Inspection Type">
                  <SelectInput
                    value={formInspectionType}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormInspectionType(e.target.value as any)}
                    className="h-9 text-xs"
                  >
                    <option value="Incoming GRN Receipt">Incoming GRN Receipt</option>
                    <option value="Random Audit">Random Audit</option>
                    <option value="Expiry Verification">Expiry & FEFO Verification</option>
                  </SelectInput>
                </FormField>

                <FormField label="Inspection Priority">
                  <div className="h-9 flex items-center justify-center">
                    {renderPriorityBadge(activeInspectionRecord?.priority || "Medium")}
                  </div>
                </FormField>
              </div>
            </div>
          </PurchaseFormCard>

          {/* SECTION 2: 8-POINT ENTERPRISE QUALITY CHECKLIST */}
          <PurchaseFormCard title="Step 2: 8-Point Enterprise Quality Checklist Verification" sectionNumber="Section 2 of 4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <FormField label="Packaging Condition">
                <SelectInput
                  value={checklist.packagingCondition}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setChecklist({ ...checklist, packagingCondition: e.target.value })}
                  className="h-9 text-xs font-bold"
                >
                  <option value="Good">Good Condition</option>
                  <option value="Damaged">Damaged Packaging</option>
                </SelectInput>
              </FormField>

              <FormField label="Seal Verification">
                <SelectInput
                  value={checklist.sealVerification}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setChecklist({ ...checklist, sealVerification: e.target.value })}
                  className="h-9 text-xs font-bold"
                >
                  <option value="Passed">Passed / Intact</option>
                  <option value="Failed">Failed / Broken Seal</option>
                </SelectInput>
              </FormField>

              <FormField label="Quantity Verification">
                <SelectInput
                  value={checklist.quantityVerification}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setChecklist({ ...checklist, quantityVerification: e.target.value })}
                  className="h-9 text-xs font-bold"
                >
                  <option value="Correct">Correct Quantity</option>
                  <option value="Mismatch">Quantity Mismatch</option>
                </SelectInput>
              </FormField>

              <FormField label="Expiry Verification">
                <SelectInput
                  value={checklist.expiryVerification}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setChecklist({ ...checklist, expiryVerification: e.target.value })}
                  className="h-9 text-xs font-bold"
                >
                  <option value="Valid">Valid Expiry Date</option>
                  <option value="Expired">Expired Product</option>
                </SelectInput>
              </FormField>

              <FormField label="Cold Chain Temperature Check">
                <SelectInput
                  value={checklist.temperatureCheck}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setChecklist({ ...checklist, temperatureCheck: e.target.value })}
                  className="h-9 text-xs font-bold"
                >
                  <option value="Passed">Passed (+3°C - +5°C)</option>
                  <option value="Failed">Failed / Temperature Breach</option>
                </SelectInput>
              </FormField>

              <FormField label="Visual Inspection">
                <SelectInput
                  value={checklist.visualInspection}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setChecklist({ ...checklist, visualInspection: e.target.value })}
                  className="h-9 text-xs font-bold"
                >
                  <option value="Passed">Passed Clean</option>
                  <option value="Failed">Contaminated / Flawed</option>
                </SelectInput>
              </FormField>

              <FormField label="Overall Product Quality" className="sm:col-span-2">
                <SelectInput
                  value={checklist.productQuality}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setChecklist({ ...checklist, productQuality: e.target.value })}
                  className="h-9 text-xs font-black text-emerald-800"
                >
                  <option value="Accepted">Accepted Quality Grade A</option>
                  <option value="Rejected">Rejected Quality Standards</option>
                </SelectInput>
              </FormField>
            </div>
          </PurchaseFormCard>

          {/* SECTION 3: ITEM LEVEL QUALITY DECISIONS & DYNAMIC REJECTION FIELDS */}
          <PurchaseFormCard title="Step 3: Item Quality Results & Quantity Splitting" sectionNumber="Section 3 of 4">
            <div className="space-y-4 text-xs">
              {formItems.map((item, idx) => (
                <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="font-bold text-slate-900 flex items-center gap-2">
                      <Package className="h-4 w-4 text-emerald-600" />
                      Item #{idx + 1}: {item.productName} ({item.productCode})
                    </span>
                    <span className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Batch: {item.batchNumber}
                    </span>
                  </div>

                  {/* READ-ONLY ITEM METRICS */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Received Quantity</span>
                      <span className="font-bold text-slate-900">{item.receivedQty}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Mfg Date</span>
                      <span className="font-semibold text-slate-800">{item.mfgDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Expiry Date</span>
                      <span className="font-bold text-amber-900">{item.expiryDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Storage Location</span>
                      <span className="font-mono text-[10px] font-bold text-slate-700 truncate block">{item.storageLocation}</span>
                    </div>
                  </div>

                  {/* ITEM QC RESULT DROPDOWN & DYNAMIC INPUT FIELDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormField label="Quality Result" required>
                      <SelectInput
                        value={item.qualityResult}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          const res = e.target.value as any;
                          setFormItems(
                            formItems.map((i) =>
                              i.id === item.id
                                ? {
                                    ...i,
                                    qualityResult: res,
                                    rejectedQty: res === "Passed" ? 0 : res === "Rejected" ? i.receivedQty : i.rejectedQty,
                                    acceptedQty: res === "Passed" ? i.receivedQty : res === "Rejected" ? 0 : i.acceptedQty,
                                  }
                                : i
                            )
                          );
                        }}
                        className="h-9 text-xs font-extrabold"
                      >
                        <option value="Passed">Passed (Accepted 100%)</option>
                        <option value="Partially Accepted">Partially Accepted (Split Qty)</option>
                        <option value="Rejected">Rejected (Return to Vendor)</option>
                      </SelectInput>
                    </FormField>

                    {/* DYNAMIC FIELD: ACCEPTED QTY */}
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 block mb-1">Accepted Quantity</span>
                      <TextInput
                        type="number"
                        value={item.acceptedQty}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const acc = Number(e.target.value);
                          setFormItems(
                            formItems.map((i) =>
                              i.id === item.id
                                ? { ...i, acceptedQty: acc, rejectedQty: Math.max(0, i.receivedQty - acc) }
                                : i
                            )
                          );
                        }}
                        className="h-9 text-xs text-center font-bold text-emerald-800 bg-emerald-50 border-emerald-300"
                      />
                    </div>

                    {/* DYNAMIC FIELD: REJECTED QTY */}
                    {(item.qualityResult === "Partially Accepted" || item.qualityResult === "Rejected") && (
                      <div>
                        <span className="text-[10px] font-bold text-red-600 block mb-1">Rejected Quantity</span>
                        <TextInput
                          type="number"
                          value={item.rejectedQty}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const rej = Number(e.target.value);
                            setFormItems(
                              formItems.map((i) =>
                                i.id === item.id
                                  ? { ...i, rejectedQty: rej, acceptedQty: Math.max(0, i.receivedQty - rej) }
                                  : i
                              )
                            );
                          }}
                          className="h-9 text-xs text-center font-bold text-red-600 bg-red-50 border-red-300"
                        />
                      </div>
                    )}
                  </div>

                  {/* DYNAMIC REJECTION REASON & REMARKS */}
                  {(item.qualityResult === "Partially Accepted" || item.qualityResult === "Rejected") && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-red-50/70 rounded-lg border border-red-200">
                      <FormField label="Reason for Rejection" required>
                        <SelectInput
                          value={item.rejectionReason}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            setFormItems(formItems.map((i) => (i.id === item.id ? { ...i, rejectionReason: e.target.value } : i)))
                          }
                          className="h-9 text-xs font-bold text-red-700 border-red-300 bg-white"
                        >
                          <option value="">Select Rejection Reason</option>
                          <option value="Expired Product">Expired Product</option>
                          <option value="Damaged Packaging">Damaged Packaging</option>
                          <option value="Broken Seal">Broken Seal</option>
                          <option value="Incorrect Quantity">Incorrect Quantity</option>
                          <option value="Poor Quality">Poor Quality / Substandard</option>
                          <option value="Temperature Failure">Temperature Failure / Breach</option>
                          <option value="Wrong Item">Wrong Item Shipped</option>
                          <option value="Contaminated">Contaminated</option>
                          <option value="Other">Other Reason</option>
                        </SelectInput>
                      </FormField>

                      <div className="flex items-center gap-2 pt-5">
                        <input
                          type="checkbox"
                          id={`vr-${item.id}`}
                          checked={item.vendorReturnRequired}
                          onChange={(e) =>
                            setFormItems(formItems.map((i) => (i.id === item.id ? { ...i, vendorReturnRequired: e.target.checked } : i)))
                          }
                          className="h-4 w-4 text-red-600 rounded cursor-pointer"
                        />
                        <label htmlFor={`vr-${item.id}`} className="font-bold text-red-900 cursor-pointer">
                          Generate Vendor Return Draft (RGP Gate Pass)
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </PurchaseFormCard>

          {/* SECTION 4: PHOTOS, LAB REPORTS & AUDIT REMARKS */}
          <PurchaseFormCard title="Step 4: Quality Certificates, Lab Reports & Inspector Remarks" sectionNumber="Section 4 of 4">
            <div className="space-y-4 text-xs">
              <FormField label="Inspector Sign-off Remarks" required>
                <TextInput
                  value={formRemarks}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormRemarks(e.target.value)}
                  placeholder="Detailed inspector notes on quality compliance..."
                  className="h-9 text-xs"
                />
              </FormField>

              <div>
                <span className="font-extrabold text-slate-900 block mb-2">Upload Inspection Photos, Lab Reports & Quality Certificates</span>
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
      {automationLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className={cn("p-3 rounded-full text-white", automationLog.isPassed ? "bg-emerald-600" : "bg-red-600")}>
                {automationLog.isPassed ? <CheckCircle2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {automationLog.isPassed ? "Quality Inspection Completed (PASSED)" : "Inspection Completed (PARTIAL / REJECTED)"}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Inventory & Stock Ledger Automation Triggered</p>
              </div>
            </div>

            <div className={cn("p-3 rounded-xl border text-xs space-y-1.5 font-medium", automationLog.isPassed ? "bg-emerald-50 border-emerald-200 text-emerald-950" : "bg-red-50 border-red-200 text-red-950")}>
              <span className="font-bold block border-b pb-1">Automated System Executions:</span>
              {automationLog.logs.map((log, idx) => (
                <p key={idx}>{log}</p>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                onClick={() => setAutomationLog(null)}
                className="h-9 px-4 text-xs font-bold !bg-slate-900 text-white rounded-xl shadow-xs cursor-pointer"
              >
                Close Summary
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW COMPLETED QUALITY INSPECTION DETAILS DRAWER */}
      {selectedQI && (
        <Drawer
          open={!!selectedQI}
          onClose={() => setSelectedQI(null)}
          title={`Quality Inspection Details: ${selectedQI.inspectionNumber}`}
          width="lg"
        >
          <div className="space-y-6 pb-6 select-none text-xs">
            {/* WORKFLOW BANNER */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-extrabold text-blue-900">{selectedQI.inspectionNumber}</span>
                <div className="flex items-center gap-2">
                  {renderResultBadge(selectedQI.result)}
                  {renderStatusBadge(selectedQI.status)}
                </div>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">{selectedQI.supplierName}</h3>
              <p className="text-xs text-slate-500 font-medium">
                GRN: {selectedQI.grnNumber} • PO: {selectedQI.poNumber} • Warehouse: {selectedQI.warehouse}
              </p>
            </div>

            {/* SECTION 1: GENERAL INSPECTION DETAILS */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> General Inspection Details
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Inspector / Auditor</span>
                  <span className="font-bold text-slate-900">{selectedQI.inspectorName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Inspection Date</span>
                  <span className="font-semibold text-slate-800">{selectedQI.inspectionDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Inspection Priority</span>
                  <div>{renderPriorityBadge(selectedQI.priority)}</div>
                </div>
              </div>
            </div>

            {/* SECTION 2: CHECKLIST RESULTS */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                <span>Checklist Verification Items</span>
                <span className="text-[11px] text-slate-500 font-semibold">{selectedQI.checklist.length} Criteria</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedQI.checklist.map((chk, idx) => (
                  <div key={idx} className="p-2 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{chk.checkItem}</span>
                      <span className="text-[10px] text-slate-500">{chk.category}</span>
                    </div>
                    <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded", chk.result === "Pass" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800")}>
                      {chk.result}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 3: INSPECTED ITEMS */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                <span>Inspected Items & Decision Breakdown</span>
                <span className="text-[11px] text-slate-500 font-semibold">{selectedQI.items.length} Products</span>
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                      <th className="py-2 px-2">Product</th>
                      <th className="py-2 px-2 text-center">Received</th>
                      <th className="py-2 px-2 text-center">Accepted</th>
                      <th className="py-2 px-2 text-center">Rejected</th>
                      <th className="py-2 px-2 text-center">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {selectedQI.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2 px-2 font-bold text-slate-900">
                          {item.productName}
                          <div className="text-[10px] font-normal text-slate-400">{item.productCode}</div>
                        </td>
                        <td className="py-2 px-2 text-center text-slate-600">{item.receivedQty}</td>
                        <td className="py-2 px-2 text-center font-extrabold text-emerald-700">{item.acceptedQty}</td>
                        <td className="py-2 px-2 text-center font-extrabold text-red-600">{item.rejectedQty}</td>
                        <td className="py-2 px-2 text-center">{renderResultBadge(item.qualityResult)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CLOSE BUTTON */}
            <Button
              type="button"
              onClick={() => setSelectedQI(null)}
              className="w-full h-10 text-xs font-bold !bg-slate-900 text-white rounded-xl shadow-xs cursor-pointer"
            >
              Close Inspection View
            </Button>
          </div>
        </Drawer>
      )}
    </div>
  );
}
