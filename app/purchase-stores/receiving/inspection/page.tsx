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
  X,
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
import type { QualityInspectionRecord, QIItem, QIChecklistItem } from "@/app/data/qualityInspectionData";
import { usePsList } from "@/hooks/usePsResource";
import { psGrnService, psQualityInspectionService, psVendorReturnService } from "@/services/purchase-stores/index";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { createPortal } from "react-dom";
import { Modal } from "@/components/ui/Modal";
import { normalizeGrnRecord } from "@/app/data/grnData";

// SAMPLE GRN DATABASE FOR AUTO-LOADING INSPECTIONS
/** Saved checklist entry name for the single Step 2 decision. */
const QC_CHECK_NAME = "Quality Checklist";



export default function QualityInspectionPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Main Dataset State
  const { data: qiList, loading, reload } = usePsList(() => psQualityInspectionService.list(), []);
  const { data: grnListRaw } = usePsList(() => psGrnService.list(), []);
  const { data: vendorReturns, reload: reloadReturns } = usePsList(() => psVendorReturnService.list(), []);
  const router = useRouter();
  const { user } = useAuth();
  const loggedInName = user?.name?.trim() || user?.email || "";

  const returnByInspection = useMemo(
    () => new Map(vendorReturns.filter((v) => v.status !== "Cancelled").map((v) => [v.inspectionNumber, v])),
    [vendorReturns],
  );
  const rejectedUnits = (qi: Pick<QualityInspectionRecord, "items">) =>
    (qi.items ?? []).reduce((sum, i) => sum + (Number(i.rejectedQty) || 0), 0);
  /** Opens the existing vendor return for this inspection, or starts a new one pre-filled from it. */
  const goToVendorReturn = (inspectionNumber: string) => {
    const existing = returnByInspection.get(inspectionNumber);
    router.push(
      existing
        ? `/purchase-stores/receiving/returns?view=${encodeURIComponent(existing.returnNumber)}`
        : `/purchase-stores/receiving/returns?inspection=${encodeURIComponent(inspectionNumber)}`,
    );
  };
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
  const [automationLog, setAutomationLog] = useState<{ isPassed: boolean; logs: string[]; inspectionNumber?: string; rejectedUnits?: number } | null>(null);

  // GRN behind the inspection being performed
  const activeGrn = useMemo(() => {
    if (!activeInspectionRecord) return null;
    const raw = grnListRaw.find((g) => g.grnNumber === activeInspectionRecord.grnNumber);
    return raw ? normalizeGrnRecord(raw) : null;
  }, [grnListRaw, activeInspectionRecord]);
  const currentFetchedGRN = {
    grnNumber: activeInspectionRecord?.grnNumber ?? "",
    poNumber: activeGrn?.poNumber || activeInspectionRecord?.poNumber || "",
    supplierName: activeGrn?.supplierName || activeInspectionRecord?.supplierName || "",
    warehouse: activeGrn?.warehouse || activeInspectionRecord?.warehouse || "",
  };

  // Header Inspection State
  const [formInspectionType, setFormInspectionType] = useState<"Incoming GRN Receipt" | "Random Audit" | "Expiry Verification">("Incoming GRN Receipt");
  const [formInspector, setFormInspector] = useState("Quality Auditor Anand");
  const [formInspectionDate, setFormInspectionDate] = useState("2026-07-25");
  const [formRemarks, setFormRemarks] = useState("Visual inspection, cold dock temperature test, and seal verification conducted.");

  // Inspection Checklist Items (8 Enterprise Criteria)
  const [qcResult, setQcResult] = useState<"" | "Pass" | "Fail">("");
  const [qcFailReason, setQcFailReason] = useState("");
  const [failReasonModalOpen, setFailReasonModalOpen] = useState(false);
  const [failReasonDraft, setFailReasonDraft] = useState("");

  // Items Inspection Grid State
  const [formItems, setFormItems] = useState<Array<{
    id: string;
    materialId: string;
    unit: string;
    productCode: string;
    productName: string;
    batchNumber: string;
    mfgDate: string;
    expiryDate: string;
    storageLocation: string;
    receivedQty: number;
    acceptedQty: number;
    rejectedQty: number;
    qualityResult: "Passed" | "Rejected";
    rejectionReason: string;
    vendorReturnRequired: boolean;
    remarks: string;
  }>>([]);

  // Load Active Inspection Data into Form
  useEffect(() => {
    if (!activeInspectionRecord) return;
    setFormInspector(
      loggedInName ||
        (activeInspectionRecord.inspectorName !== "Awaiting Assignment" ? activeInspectionRecord.inspectorName : "") ||
        "",
    );
    setFormInspectionDate(activeInspectionRecord.inspectionDate || new Date().toISOString().slice(0, 10));
    setFormRemarks(activeInspectionRecord.generalRemarks || activeInspectionRecord.remarks || "");

    const savedChecks = activeInspectionRecord.checklist ?? [];
    const failed = savedChecks.filter((c) => c.result === "Fail");
    if (failed.length) {
      setQcResult("Fail");
      setQcFailReason(failed.map((c) => c.notes).filter(Boolean).join("; "));
    } else {
      setQcResult(savedChecks.some((c) => c.result === "Pass") ? "Pass" : "");
      setQcFailReason("");
    }

    const savedItems = activeInspectionRecord.items ?? [];
    const savedResult = (code: string) => {
      const r = savedItems.find((i) => i.productCode === code)?.qualityResult;
      return r === "Passed" || r === "Rejected" ? r : null;
    };
    const savedReason = (code: string) => savedItems.find((i) => i.productCode === code)?.rejectionReason ?? "";

    const lines = activeGrn?.items?.length
      ? activeGrn.items.map((line) => {
          const lots = line.batchAllocations ?? [];
          return {
            materialId: line.materialId ?? "",
            productCode: line.productCode,
            productName: line.productName,
            unit: line.unit ?? "",
            batchNumber: lots.map((b) => b.batchNumber).filter(Boolean).join(", ") || "—",
            mfgDate: lots.find((b) => b.mfgDate)?.mfgDate || "—",
            expiryDate: lots.map((b) => b.expiryDate).filter(Boolean).sort()[0] || "—",
            storageLocation:
              [...new Set(lots.map((b) => [b.storageWarehouse, b.storageLocation].filter(Boolean).join(" → ")).filter(Boolean))].join(", ") ||
              activeGrn.warehouse ||
              "—",
            receivedQty: Number(line.receivedQty) || 0,
          };
        })
      : savedItems.map((item) => ({
          materialId: (item as { materialId?: string }).materialId ?? "",
          productCode: item.productCode,
          productName: item.productName,
          unit: "",
          batchNumber: "—",
          mfgDate: "—",
          expiryDate: "—",
          storageLocation: activeInspectionRecord.warehouse || "—",
          receivedQty: Number(item.receivedQty) || 0,
        }));

    setFormItems(
      lines.map((line, idx) => {
        const result = savedResult(line.productCode) ?? "Passed";
        return {
          id: `qii-${idx}`,
          ...line,
          acceptedQty: result === "Passed" ? line.receivedQty : 0,
          rejectedQty: result === "Rejected" ? line.receivedQty : 0,
          qualityResult: result,
          rejectionReason: savedReason(line.productCode),
          vendorReturnRequired: result === "Rejected",
          remarks: "",
        };
      }),
    );
  }, [activeInspectionRecord, activeGrn, loggedInName]);

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
    return qcResult === "Fail" || formItems.some((i) => i.qualityResult === "Rejected");
  }, [formItems, qcResult]);

  /** A failed checklist rejects the whole delivery; passing it again restores the auto-rejected lines. */
  const applyChecklistResult = (result: "Pass" | "Fail") => {
    setFormItems((items) =>
      items.map((i) => {
        if (result === "Fail") {
          return {
            ...i,
            qualityResult: "Rejected" as const,
            acceptedQty: 0,
            rejectedQty: i.receivedQty,
            rejectionReason: i.rejectionReason || "Poor Quality",
            vendorReturnRequired: true,
          };
        }
        if (qcResult !== "Fail") return i;
        return { ...i, qualityResult: "Passed" as const, acceptedQty: i.receivedQty, rejectedQty: 0, rejectionReason: "", vendorReturnRequired: false };
      }),
    );
  };

  // Save / Complete Quality Inspection
  const handleSaveInspection = async (isComplete: boolean) => {
    if (!activeInspectionRecord) return;

    // BUSINESS RULES VALIDATION
    if (isComplete) {
      if (!qcResult) {
        alert("Mark the quality checklist as Pass or Fail.");
        return;
      }
      if (qcResult === "Fail" && !qcFailReason.trim()) {
        alert("Enter the reason the quality checklist failed.");
        return;
      }
      if (qcResult === "Fail" && formItems.some((i) => i.qualityResult === "Passed")) {
        alert("The quality checklist failed, so no item can be accepted into stock.");
        return;
      }
      if (!formInspector.trim()) {
        alert("Enter the inspector name.");
        return;
      }
      if (formItems.length === 0) {
        alert("This inspection has no items to inspect.");
        return;
      }
    }
    for (const item of formItems) {
      if (item.qualityResult === "Rejected" && !item.rejectionReason) {
        alert(`[Validation Error]: Rejection Reason is mandatory for ${item.productName}`);
        return;
      }
    }

    const overallResult: "Passed" | "Rejected" =
      formItems.length > 0 && formItems.every((i) => i.qualityResult === "Rejected") ? "Rejected" : "Passed";

    const updatePayload: Partial<QualityInspectionRecord> = {
      status: isComplete ? "Completed" : "In Progress",
      result: overallResult,
      inspectorName: formInspector,
      generalRemarks: formRemarks,
      remarks: formRemarks,
      checklist: qcResult
        ? [
            {
              id: "c1",
              category: "Quality",
              checkItem: QC_CHECK_NAME,
              result: qcResult,
              ...(qcResult === "Fail" ? { notes: qcFailReason.trim() } : {}),
            },
          ]
        : [],
      items: formItems.map((i) => ({
        id: i.id,
        materialId: i.materialId,
        productCode: i.productCode,
        productName: i.productName,
        receivedQty: i.receivedQty,
        inspectedQty: i.receivedQty,
        acceptedQty: i.qualityResult === "Passed" ? i.receivedQty : 0,
        rejectedQty: i.qualityResult === "Rejected" ? i.receivedQty : 0,
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

    // COMPLETION SUMMARY
    if (isComplete) {
      void reloadReturns();
      const accepted = formItems.filter((i) => i.qualityResult === "Passed");
      const rejected = formItems.filter((i) => i.qualityResult === "Rejected");
      const acceptedUnits = accepted.reduce((sum, i) => sum + i.receivedQty, 0);
      const rejectedTotal = rejected.reduce((sum, i) => sum + i.receivedQty, 0);
      const logs = [`✓ Quality Inspection ${activeInspectionRecord.inspectionNumber} completed`];
      if (accepted.length) {
        logs.push(`✓ ${acceptedUnits} unit(s) across ${accepted.length} item(s) accepted and posted to stock (${currentFetchedGRN.grnNumber})`);
      }
      if (rejected.length) {
        logs.push(`✗ ${rejectedTotal} unit(s) rejected: ${rejected.map((i) => `${i.productName} (${i.rejectionReason})`).join(", ")}`);
        logs.push("Rejected goods are not added to stock. Create a vendor return to send them back to the supplier.");
      }
      setAutomationLog({
        isPassed: rejected.length === 0,
        logs,
        inspectionNumber: activeInspectionRecord.inspectionNumber,
        rejectedUnits: rejectedTotal,
      });
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
                const view = { label: "View", onClick: () => setSelectedQI(first) };
                if (rejectedUnits(first) === 0) return [view];
                return [
                  view,
                  {
                    label: returnByInspection.has(first.inspectionNumber) ? "View Vendor Return" : "Create Vendor Return",
                    icon: <RotateCcw className="h-3.5 w-3.5" />,
                    onClick: () => goToVendorReturn(first.inspectionNumber),
                  },
                ];
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
        side="bottom"
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
        side="bottom"
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
                  <AlertTriangle className="h-4 w-4" /> Complete with Rejections
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
          <PurchaseFormCard title="Step 1: Auto-Loaded GRN Reference & Header Details" sectionNumber="Section 1 of 3">
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
                    readOnly
                    title="Taken from the logged-in user"
                    className="h-9 text-xs font-bold bg-slate-50"
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
          <PurchaseFormCard title="Step 2: Quality Checklist Verification" sectionNumber="Section 2 of 3">
            <div
              className={cn(
                "space-y-3 rounded-xl border p-4 text-xs transition-colors",
                qcResult === "Pass" && "border-emerald-200 bg-emerald-50/40",
                qcResult === "Fail" && "border-red-200 bg-red-50/40",
                !qcResult && "border-slate-200 bg-white",
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-slate-900">
                    Packaging, seal, quantity, expiry and visual check <span className="text-red-500">*</span>
                  </p>
                  <p className="text-[11px] text-slate-500">Did the delivery pass the quality checklist?</p>
                </div>
                <div className="flex shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => {
                      applyChecklistResult("Pass");
                      setQcResult("Pass");
                      setQcFailReason("");
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-5 py-2 text-xs font-bold transition-colors",
                      qcResult === "Pass" ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    <Check className="h-3.5 w-3.5" /> Pass
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFailReasonDraft(qcFailReason);
                      setFailReasonModalOpen(true);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 border-l border-slate-200 px-5 py-2 text-xs font-bold transition-colors",
                      qcResult === "Fail" ? "bg-red-600 text-white" : "text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    <X className="h-3.5 w-3.5" /> Fail
                  </button>
                </div>
              </div>
              {qcResult === "Fail" && (
                <div className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-white p-2.5">
                  <p className="text-red-900">
                    <span className="font-bold">Reason: </span>
                    {qcFailReason}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFailReasonDraft(qcFailReason);
                      setFailReasonModalOpen(true);
                    }}
                    className="shrink-0 text-[11px] font-bold text-red-700 hover:underline"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </PurchaseFormCard>

          {/* SECTION 3: ITEM LEVEL QUALITY DECISIONS & DYNAMIC REJECTION FIELDS */}
          <PurchaseFormCard title="Step 3: Item Quality Results" sectionNumber="Section 3 of 3">
            <div className="space-y-4 text-xs">
              {qcResult === "Fail" && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-red-900">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <span>
                    The quality checklist failed, so every item is rejected and nothing will be added to stock. Choose the
                    rejection reason for each item below, or mark the checklist as Pass to inspect items individually.
                  </span>
                </div>
              )}
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
                        disabled={qcResult === "Fail"}
                        title={qcResult === "Fail" ? "Quality checklist failed — all items are rejected" : undefined}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          const res = e.target.value as "Passed" | "Rejected";
                          setFormItems(
                            formItems.map((i) =>
                              i.id === item.id
                                ? {
                                    ...i,
                                    qualityResult: res,
                                    rejectedQty: res === "Rejected" ? i.receivedQty : 0,
                                    acceptedQty: res === "Passed" ? i.receivedQty : 0,
                                  }
                                : i
                            )
                          );
                        }}
                        className="h-9 text-xs font-extrabold"
                      >
                        <option value="Passed">Passed (Accepted 100%)</option>
                        <option value="Rejected">Rejected (Return to Vendor)</option>
                      </SelectInput>
                    </FormField>

                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 block mb-1">Accepted Quantity</span>
                      <div className="flex h-9 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-800">
                        {item.qualityResult === "Passed" ? item.receivedQty : 0}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-red-600 block mb-1">Rejected Quantity</span>
                      <div className="flex h-9 items-center justify-center rounded-lg border border-red-300 bg-red-50 text-xs font-bold text-red-600">
                        {item.qualityResult === "Rejected" ? item.receivedQty : 0}
                      </div>
                    </div>
                  </div>

                  {/* DYNAMIC REJECTION REASON & REMARKS */}
                  {item.qualityResult === "Rejected" && (
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

                      <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-white p-2.5 text-[11px] text-red-900 sm:mt-5">
                        <RotateCcw className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
                        <span>
                          <strong>{item.receivedQty} {item.unit}</strong> will be kept out of stock. After completing, you can create a
                          vendor return to send it back to the supplier.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </PurchaseFormCard>

        </form>
      </Drawer>

      {failReasonModalOpen &&
        createPortal(
          <Modal
            isOpen
            onClose={() => setFailReasonModalOpen(false)}
            title="Quality checklist failed"
            description="Describe what failed — this is saved with the inspection."
            maxWidth="md"
            footer={
              <>
                <Button type="button" variant="outline" onClick={() => setFailReasonModalOpen(false)} className="h-9 text-xs">
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={!failReasonDraft.trim()}
                  onClick={() => {
                    applyChecklistResult("Fail");
                    setQcResult("Fail");
                    setQcFailReason(failReasonDraft.trim());
                    setFailReasonModalOpen(false);
                  }}
                  className="h-9 text-xs !bg-red-700 hover:!bg-red-800 text-white"
                >
                  Mark as Failed
                </Button>
              </>
            }
          >
            <textarea
              value={failReasonDraft}
              onChange={(e) => setFailReasonDraft(e.target.value)}
              rows={4}
              autoFocus
              placeholder="e.g. Outer cartons damaged, 3 seals broken"
              className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
            />
          </Modal>,
          document.body,
        )}

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
                  {automationLog.isPassed ? "Quality Inspection Completed (Passed)" : "Inspection Completed with Rejections"}
                </h3>
                <p className="text-xs text-slate-500 font-medium">Stock ledger updated for accepted items</p>
              </div>
            </div>

            <div className={cn("p-3 rounded-xl border text-xs space-y-1.5 font-medium", automationLog.isPassed ? "bg-emerald-50 border-emerald-200 text-emerald-950" : "bg-red-50 border-red-200 text-red-950")}>
              <span className="font-bold block border-b pb-1">Summary</span>
              {automationLog.logs.map((log, idx) => (
                <p key={idx}>{log}</p>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant={automationLog.rejectedUnits ? "outline" : undefined}
                onClick={() => setAutomationLog(null)}
                className={cn(
                  "h-9 px-4 text-xs font-bold rounded-xl shadow-xs cursor-pointer",
                  !automationLog.rejectedUnits && "!bg-slate-900 text-white",
                )}
              >
                {automationLog.rejectedUnits ? "Later" : "Close Summary"}
              </Button>
              {!!automationLog.rejectedUnits && automationLog.inspectionNumber && (
                <Button
                  type="button"
                  onClick={() => goToVendorReturn(automationLog.inspectionNumber!)}
                  className="h-9 gap-1.5 px-4 text-xs font-bold !bg-red-700 hover:!bg-red-800 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" /> Create Vendor Return
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW COMPLETED QUALITY INSPECTION DETAILS DRAWER */}
      {selectedQI && (
        <Drawer
          side="bottom"
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

            {rejectedUnits(selectedQI) > 0 && (
              <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2.5">
                  <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <div>
                    <p className="font-extrabold text-red-900">
                      {rejectedUnits(selectedQI)} unit(s) rejected in this inspection
                    </p>
                    <p className="text-[11px] text-red-800">
                      {returnByInspection.get(selectedQI.inspectionNumber)
                        ? `Vendor return ${returnByInspection.get(selectedQI.inspectionNumber)!.returnNumber} is ${returnByInspection.get(selectedQI.inspectionNumber)!.status}.`
                        : "No vendor return has been raised yet."}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => goToVendorReturn(selectedQI.inspectionNumber)}
                  className="h-9 shrink-0 gap-1.5 px-4 text-xs font-bold !bg-red-700 hover:!bg-red-800 text-white rounded-xl"
                >
                  <RotateCcw className="h-4 w-4" />
                  {returnByInspection.get(selectedQI.inspectionNumber) ? "View Vendor Return" : "Create Vendor Return"}
                </Button>
              </div>
            )}

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
