"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Send,
  ShoppingCart,
  PackageSearch,
  Download,
  Plus,
  Search,
  Filter,
  RotateCcw,
  XCircle,
  Paperclip,
  Trash2,
  ArrowUpDown,
  UploadCloud,
  X,
  FileCode,
  Building2,
  CalendarDays,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { Modal } from "@/components/frontoffice/ui/Modal";
import {
  TextInput,
  SelectInput,
  FormField,
  TextAreaInput,
  FOPageHeader,
  StatMiniCard,
  formatINR,
  AlertBanner,
} from "@/components/frontoffice/ui";
import { OperationsToolbar, OperationsFilterDrawer } from "@/components/housekeeping/OperationsToolbar";
import { DocumentApprovalFooter } from "@/components/purchase-stores/ui/DocumentApprovalFooter";
import { ModuleDataTable } from "@/components/pms/ModuleDataTable";
import { ModuleSelectionBar } from "@/components/pms/ModuleSelectionBar";
import type { ModuleColumn } from "@/components/pms/module-types";
import {
  PR_SOURCE_MODULES,
  PR_STATUSES,
  type PRFulfillment,
  type PurchaseRequisition,
  type PRRequestedItem,
} from "@/app/data/purchaseRequisitionsData";
import { usePsList } from "@/hooks/usePsResource";
import { psRequisitionService, psProductService } from "@/services/purchase-stores/index";
import {
  type MaterialCatalogItem,
  prItemFromCatalog,
  productsToCatalog,
} from "@/app/data/procurementMaterial";
import {
  type PurchaseAttachmentRecord,
  attachmentFromApi,
} from "@/app/data/purchaseAttachmentUtils";
import {
  PrioritySelector,
  ProcurementFormSection,
  ProcurementSummaryRow,
  priorityTextClass,
} from "@/components/purchase-stores/ui/ProcurementFormParts";
import { PurchaseAttachmentPreviewModal } from "@/components/purchase-stores/ui/PurchaseAttachmentPreviewModal";

/** Legacy alias — catalog rows are loaded from Product Master at runtime */
export interface InventoryCatalogItem {
  materialId: string;
  productCode: string;
  itemCode: string;
  itemName: string;
  productName: string;
  category: string;
  unit: string;
  estimatedPrice: number;
  purchasePrice: number;
}

/** @deprecated Use PurchaseAttachmentRecord */
export type PRFormAttachment = PurchaseAttachmentRecord;

/** @deprecated Use Product Master via psProductService — kept for import compatibility */
export const MOCK_INVENTORY_CATALOG: InventoryCatalogItem[] = [];
function toInventoryCatalogItem(c: MaterialCatalogItem): InventoryCatalogItem {
  return {
    ...c,
    itemCode: c.productCode,
    itemName: c.productName,
    estimatedPrice: c.purchasePrice,
  };
}

export default function PurchaseRequisitionsPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("create") === "true") {
        // Defer until product catalog is loaded (see effect below)
        setPendingCreateFromUrl(true);
      }
    }
  }, []);

  const router = useRouter();
  const { data: prList, loading: isLoading, reload: reloadPrs } = usePsList(() => psRequisitionService.list(), []);
  const { data: fulfillmentList, reload: reloadFulfillment } = usePsList(
    () => psRequisitionService.fulfillment(),
    [],
  );
  const reload = () => Promise.all([reloadPrs(), reloadFulfillment()]);
  const fulfillmentByPr = useMemo(
    () => new Map<string, PRFulfillment>(fulfillmentList.map((f) => [f.prNumber, f])),
    [fulfillmentList],
  );
  const { data: products, loading: loadingProducts } = usePsList(() => psProductService.list(), []);

  useEffect(() => {
    void psRequisitionService
      .reconcile()
      .then((r) => {
        if (r.updated.length > 0) void Promise.all([reloadPrs(), reloadFulfillment()]);
      })
      .catch(() => undefined);
  }, [reloadPrs, reloadFulfillment]);
  const inventoryCatalog = useMemo(
    () => productsToCatalog(products).map(toInventoryCatalogItem),
    [products],
  );
  const [saving, setSaving] = useState(false);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [requesterFilter, setRequesterFilter] = useState("all");
  const [costCenterFilter, setCostCenterFilter] = useState("all");
  const [approverFilter, setApproverFilter] = useState("all");
  const [requiredDateFilter, setRequiredDateFilter] = useState("");
  const [createdDateFilter, setCreatedDateFilter] = useState("");
  const [estAmountFilter, setEstAmountFilter] = useState("all");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Detail Drawer & Edit Modal States
  const [selectedPR, setSelectedPR] = useState<PurchaseRequisition | null>(null);
  const [editPR, setEditPR] = useState<PurchaseRequisition | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [pendingCreateFromUrl, setPendingCreateFromUrl] = useState(false);

  // Inventory Item Selection Modal State
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [inventorySearch, setInventorySearch] = useState("");
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<InventoryCatalogItem | null>(null);

  // Pagination State
  const [rowsPerPage, setRowsPerPage] = useState("10");

  // Form State for New/Edit Requisition
  const [newDept, setNewDept] = useState("");
  const [newRequester, setNewRequester] = useState("");
  const [newReqDate, setNewReqDate] = useState("");
  const [newPriority, setNewPriority] = useState<PurchaseRequisition["priority"] | "">("");
  const [newCostCenter, setNewCostCenter] = useState("");
  const [newJustification, setNewJustification] = useState("");

  const [previewAttachment, setPreviewAttachment] = useState<PRFormAttachment | null>(null);

  // Dynamic Requested Items State
  const [newItems, setNewItems] = useState<PRRequestedItem[]>([]);
  const newItemsTotal = newItems.reduce((acc, i) => acc + i.quantity * i.estimatedPrice, 0);

  const openCreateRequisition = () => {
    setEditPR(null);
    setNewItems([]);
    setNewDept("");
    setNewRequester("");
    setNewReqDate("");
    setNewPriority("");
    setNewCostCenter("");
    setNewJustification("");
    setCreateModalOpen(true);
    setPendingCreateFromUrl(false);
  };

  useEffect(() => {
    if (pendingCreateFromUrl && inventoryCatalog.length > 0) {
      openCreateRequisition();
    }
  }, [pendingCreateFromUrl, inventoryCatalog]);

  // Sync Form State when Edit PR opens
  useEffect(() => {
    if (editPR) {
      setNewDept(editPR.department);
      setNewRequester(editPR.requestedBy);
      setNewReqDate(editPR.requiredDate);
      setNewPriority(editPR.priority);
      setNewCostCenter(editPR.costCenter);
      setNewJustification(editPR.justification);
      setNewItems(editPR.requestedItems);
    }
  }, [editPR]);

  // Toast State
  const [toast, setToast] = useState<{ message: string; variant: "success" | "info" } | null>(null);

  // Filtered Inventory Catalog inside Selection Modal (exclude items already on the PR)
  const filteredInventoryCatalog = useMemo(() => {
    const addedKeys = new Set(
      newItems.flatMap((row) => {
        const keys: string[] = [];
        if (row.materialId) keys.push(`id:${row.materialId}`);
        if (row.productCode) keys.push(`code:${row.productCode.toLowerCase()}`);
        if (row.item) keys.push(`name:${row.item.trim().toLowerCase()}`);
        return keys;
      }),
    );
    return inventoryCatalog.filter((item) => {
      const alreadyAdded =
        addedKeys.has(`id:${item.materialId}`) ||
        addedKeys.has(`code:${item.productCode.toLowerCase()}`) ||
        addedKeys.has(`code:${item.itemCode.toLowerCase()}`) ||
        addedKeys.has(`name:${item.itemName.trim().toLowerCase()}`);
      if (alreadyAdded) return false;
      const query = inventorySearch.toLowerCase();
      if (!query) return true;
      return (
        item.itemCode.toLowerCase().includes(query) ||
        item.itemName.toLowerCase().includes(query) ||
        item.productCode.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    });
  }, [inventoryCatalog, inventorySearch, newItems]);

  // Dynamic Summary Metrics Calculation
  const metrics = useMemo(() => {
    const total = prList.length;
    const pending = prList.filter((p) => p.status === "Pending Approval").length;
    const approved = prList.filter((p) => p.status === "Approved").length;
    const sourcing = prList.filter(
      (p) => p.status === "In Sourcing" || p.status === "Partially Ordered",
    ).length;
    const rejected = prList.filter((p) => p.status === "Rejected").length;
    const emergency = prList.filter((p) => p.priority === "Emergency").length;

    return { total, pending, approved, sourcing, rejected, emergency };
  }, [prList]);

  const selectedFulfillment = selectedPR ? fulfillmentByPr.get(selectedPR.prNumber) ?? null : null;
  const showQtyProgress =
    Boolean(selectedFulfillment) &&
    ["Approved", "In Sourcing", "Partially Ordered", "Closed"].includes(selectedPR?.status ?? "");

  const canEditPR = (pr: PurchaseRequisition) =>
    pr.status === "Draft" ||
    pr.status === "Pending Approval" ||
    pr.status === "Rejected" ||
    (pr.status === "Approved" && (fulfillmentByPr.get(pr.prNumber)?.rfqs.length ?? 0) === 0);

  const sourcingActionsFor = (pr: PurchaseRequisition) => {
    const f = fulfillmentByPr.get(pr.prNumber);
    return { canCreateRfq: Boolean(f?.canCreateRfq), canCreatePo: Boolean(f?.canCreatePo) };
  };

  const goCreateRfq = (pr: PurchaseRequisition) =>
    router.push(`/purchase-stores/procurement/rfq?fromPR=${encodeURIComponent(pr.prNumber)}`);
  const goCreatePo = (pr: PurchaseRequisition) =>
    router.push(`/purchase-stores/procurement/orders?fromPR=${encodeURIComponent(pr.prNumber)}`);

  // Filter Active Count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (sourceFilter !== "all") count++;
    if (departmentFilter !== "all") count++;
    if (statusFilter !== "all") count++;
    if (priorityFilter !== "all") count++;
    if (requesterFilter !== "all") count++;
    if (costCenterFilter !== "all") count++;
    if (approverFilter !== "all") count++;
    if (requiredDateFilter !== "") count++;
    if (createdDateFilter !== "") count++;
    if (estAmountFilter !== "all") count++;
    return count;
  }, [
    sourceFilter,
    departmentFilter,
    statusFilter,
    priorityFilter,
    requesterFilter,
    costCenterFilter,
    approverFilter,
    requiredDateFilter,
    createdDateFilter,
    estAmountFilter,
  ]);

  // Filtered PR List
  const filteredPRs = useMemo(() => {
    return prList.filter((pr) => {
      const matchSearch =
        pr.prNumber.toLowerCase().includes(search.toLowerCase()) ||
        pr.requestedBy.toLowerCase().includes(search.toLowerCase()) ||
        pr.department.toLowerCase().includes(search.toLowerCase()) ||
        pr.requestedItems.some((i) => i.item.toLowerCase().includes(search.toLowerCase()));

      const matchSource =
        sourceFilter === "all" || (pr.sourceModule ?? "Purchase & Stores") === sourceFilter;

      const matchDept =
        departmentFilter === "all" || pr.department.toLowerCase() === departmentFilter.toLowerCase();

      const matchStatus =
        statusFilter === "all" || pr.status.toLowerCase() === statusFilter.toLowerCase();

      const matchPriority =
        priorityFilter === "all" || pr.priority.toLowerCase() === priorityFilter.toLowerCase();

      const matchRequester =
        requesterFilter === "all" || pr.requestedBy.toLowerCase().includes(requesterFilter.toLowerCase());

      const matchCostCenter =
        costCenterFilter === "all" || (pr.costCenter ?? "").toLowerCase() === costCenterFilter.toLowerCase();

      const matchApprover =
        approverFilter === "all" || pr.currentApprover.toLowerCase().includes(approverFilter.toLowerCase());

      return (
        matchSearch &&
        matchSource &&
        matchDept &&
        matchStatus &&
        matchPriority &&
        matchRequester &&
        matchCostCenter &&
        matchApprover
      );
    });
  }, [
    prList,
    search,
    sourceFilter,
    departmentFilter,
    statusFilter,
    priorityFilter,
    requesterFilter,
    costCenterFilter,
    approverFilter,
  ]);

  const renderStatusBadge = (status: PurchaseRequisition["status"]) => {
    const tone =
      status === "Approved"
        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
        : status === "Pending Approval"
          ? "bg-amber-50 text-amber-700 ring-amber-200"
          : status === "In Sourcing"
            ? "bg-sky-50 text-sky-700 ring-sky-200"
            : status === "Partially Ordered"
              ? "bg-violet-50 text-violet-700 ring-violet-200"
              : status === "Closed"
                ? "bg-teal-50 text-teal-800 ring-teal-200"
                : status === "Rejected"
                  ? "bg-red-50 text-red-700 ring-red-200"
                  : "bg-slate-100 text-slate-600 ring-slate-200";
    return (
      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", tone)}>
        {status}
      </span>
    );
  };

  const renderPriorityBadge = (priority: PurchaseRequisition["priority"]) => {
    const tone =
      priority === "Emergency"
        ? "bg-rose-50 text-rose-700 ring-rose-200"
        : priority === "High"
          ? "bg-amber-50 text-amber-700 ring-amber-200"
          : priority === "Medium"
            ? "bg-blue-50 text-blue-700 ring-blue-200"
            : "bg-slate-100 text-slate-600 ring-slate-200";
    return (
      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", tone)}>
        {priority}
      </span>
    );
  };

  const renderSourcingButtons = (pr: PurchaseRequisition, compact = false) => {
    const { canCreateRfq, canCreatePo } = sourcingActionsFor(pr);
    if (!canCreateRfq && !canCreatePo) {
      return compact ? <span className="text-slate-400">—</span> : null;
    }
    const size = compact ? "h-7 px-2 text-[11px]" : "h-8 px-3 text-xs";
    return (
      <div className="flex items-center gap-1.5">
        {canCreateRfq && (
          <Button
            type="button"
            variant="outline"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              goCreateRfq(pr);
            }}
            className={cn("gap-1 rounded-lg font-bold !bg-white !text-sky-700 !border-sky-200 hover:!bg-sky-50", size)}
          >
            <Send className="h-3 w-3" /> Create RFQ
          </Button>
        )}
        {canCreatePo && (
          <Button
            type="button"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              goCreatePo(pr);
            }}
            className={cn("gap-1 rounded-lg font-bold !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white", size)}
          >
            <ShoppingCart className="h-3 w-3" /> Create PO
          </Button>
        )}
      </div>
    );
  };

  const columns: ModuleColumn[] = [
    {
      key: "prNumber",
      header: "PR number",
      render: (pr: PurchaseRequisition) => (
        <span className="font-mono text-sm font-semibold text-slate-900">{pr.prNumber}</span>
      ),
    },
    {
      key: "department",
      header: "Department",
      render: (pr: PurchaseRequisition) => (
        <div>
          <span className="font-medium text-slate-900">{pr.department}</span>
          <p className="text-xs text-slate-500">via {pr.sourceModule ?? "Purchase & Stores"}</p>
        </div>
      ),
    },
    {
      key: "requestedBy",
      header: "Requested by",
      render: (pr: PurchaseRequisition) => <span className="text-slate-700">{pr.requestedBy}</span>,
    },
    {
      key: "requiredDate",
      header: "Required",
      render: (pr: PurchaseRequisition) => <span className="text-slate-600">{pr.requiredDate}</span>,
    },
    {
      key: "priority",
      header: "Priority",
      render: (pr: PurchaseRequisition) => renderPriorityBadge(pr.priority),
    },
    {
      key: "estimatedAmount",
      header: "Estimated Amount",
      align: "right",
      render: (pr: PurchaseRequisition) => (
        <span className="font-semibold text-slate-900">{formatINR(pr.estimatedAmount)}</span>
      ),
    },
    {
      key: "currentApprover",
      header: "Approver",
      render: (pr: PurchaseRequisition) => <span className="text-slate-600">{pr.currentApprover}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (pr: PurchaseRequisition) => renderStatusBadge(pr.status),
    },
    {
      key: "ordered",
      header: "Ordered",
      render: (pr: PurchaseRequisition) => {
        const f = fulfillmentByPr.get(pr.prNumber);
        if (!f || f.totalOrdered === 0) return <span className="text-slate-400">—</span>;
        return (
          <span className="text-xs font-semibold text-slate-700">
            {f.totalOrdered} / {f.totalRequested}
          </span>
        );
      },
    },
    {
      key: "sourcingActions",
      header: "Actions",
      render: (pr: PurchaseRequisition) => renderSourcingButtons(pr, true),
    },
  ];

  // Row Action Handlers
  const handleDuplicatePR = async (pr: PurchaseRequisition) => {
    try {
      const { id: _id, prNumber: _num, ...rest } = pr;
      await psRequisitionService.create({ ...rest, status: "Draft", requestDate: "Today" });
      await reload();
      setToast({ message: `Duplicated ${pr.prNumber} as new draft`, variant: "success" });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Duplicate failed", variant: "info" });
    }
  };

  const handleCancelPR = async (pr: PurchaseRequisition) => {
    try {
      await psRequisitionService.update(pr.id, { status: "Cancelled" });
      await reload();
      setToast({ message: `Requisition ${pr.prNumber} has been cancelled.`, variant: "info" });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Cancel failed", variant: "info" });
    }
  };

  const handlePreviewAttachment = (att: PRFormAttachment) => {
    if (!att.dataUrl && !att.previewUrl) {
      setToast({ message: "No preview data for this file. Re-upload to preview.", variant: "info" });
      return;
    }
    setPreviewAttachment(att);
  };

  // OPEN INVENTORY SELECTION MODAL
  const handleOpenInventoryModal = () => {
    setInventorySearch("");
    const available = inventoryCatalog.filter((item) => {
      return !newItems.some(
        (row) =>
          (row.materialId && row.materialId === item.materialId) ||
          (row.productCode &&
            row.productCode.toLowerCase() === item.productCode.toLowerCase()) ||
          row.item.trim().toLowerCase() === item.itemName.trim().toLowerCase(),
      );
    });
    setSelectedCatalogItem(available[0] ?? null);
    setIsInventoryModalOpen(true);
  };

  // CONFIRM ADD INVENTORY ITEM FROM MODAL TO TABLE
  const handleConfirmAddInventoryItem = () => {
    if (!selectedCatalogItem) return;

    const alreadyAdded = newItems.some(
      (row) =>
        (row.materialId && row.materialId === selectedCatalogItem.materialId) ||
        (row.productCode &&
          row.productCode.toLowerCase() === selectedCatalogItem.productCode.toLowerCase()) ||
        row.item.trim().toLowerCase() === selectedCatalogItem.itemName.trim().toLowerCase(),
    );
    if (alreadyAdded) {
      setToast({
        message: `"${selectedCatalogItem.itemName}" is already in the requested items list.`,
        variant: "info",
      });
      return;
    }

    const newItem = {
      ...prItemFromCatalog(selectedCatalogItem, 1),
      estimatedPrice: 0,
      total: 0,
    };

    setNewItems((prev) => [...prev, newItem]);
    setIsInventoryModalOpen(false);
    setToast({
      message: `Added ${selectedCatalogItem.itemName} to requested items. Enter estimated price if needed.`,
      variant: "success",
    });
  };

  const handleRemoveItemRow = (id: string) => {
    setNewItems((prev) => prev.filter((i) => i.id !== id));
  };

  // UPDATE FIELD IN ITEM ROW HANDLER
  const handleItemFieldChange = (
    id: string,
    field: "quantity" | "remarks" | "estimatedPrice",
    value: any,
  ) => {
    setNewItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "quantity") {
          const qty = Math.max(1, parseInt(value, 10) || 1);
          updated.quantity = qty;
          updated.total = qty * item.estimatedPrice;
        }
        if (field === "estimatedPrice") {
          const price = Math.max(0, Number(value) || 0);
          updated.estimatedPrice = price;
          updated.total = item.quantity * price;
        }
        return updated;
      }),
    );
  };

  // SAVE / SUBMIT REQUISITION
  const handleSaveRequisition = async (isDraft: boolean) => {
    const today = new Date().toISOString().slice(0, 10);
    const missing = [
      !newDept && "Department",
      !newRequester.trim() && "Requester Name",
      !newReqDate && "Required Date",
      !newPriority && "Priority",
      !isDraft && !newJustification.trim() && "Reason for Request",
    ].filter(Boolean);
    if (missing.length > 0) {
      setToast({ message: `Please fill: ${missing.join(", ")}.`, variant: "info" });
      return;
    }
    if (newReqDate < today) {
      setToast({
        message: "Required Date must be today or a future date.",
        variant: "info",
      });
      return;
    }
    if (newItems.length === 0) {
      setToast({ message: "Add at least one item before saving the requisition.", variant: "info" });
      return;
    }
    const totalAmt = newItems.reduce((acc, i) => acc + i.quantity * i.estimatedPrice, 0);
    const payload: Partial<PurchaseRequisition> = {
      department: newDept,
      requestedBy: newRequester.trim(),
      requiredDate: newReqDate,
      priority: newPriority as PurchaseRequisition["priority"],
      costCenter: newCostCenter.trim(),
      justification: newJustification,
      estimatedAmount: totalAmt,
      requestedItems: newItems,
      status: isDraft ? "Draft" : "Pending Approval",
    };

    setSaving(true);
    try {
      if (editPR) {
        await psRequisitionService.update(editPR.id, payload);
        setEditPR(null);
        setToast({ message: `Updated requisition ${editPR.prNumber}`, variant: "success" });
      } else {
        await psRequisitionService.create({
          ...payload,
          sourceModule: "Purchase & Stores",
          requestDate: today,
          currentApprover: "Purchase Manager",
        });
        setCreateModalOpen(false);
        setToast({
          message: isDraft ? "Requisition saved as Draft." : "Requisition submitted for approval.",
          variant: "success",
        });
      }
      await reload();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Save failed", variant: "info" });
    } finally {
      setSaving(false);
    }
  };

  const handleApprovePR = async () => {
    if (!selectedPR) return;
    try {
      await psRequisitionService.update(selectedPR.id, { status: "Approved" });
      await reload();
      setSelectedPR((prev) => (prev ? { ...prev, status: "Approved" } : null));
      setToast({ message: `${selectedPR.prNumber} approved.`, variant: "success" });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Approve failed", variant: "info" });
    }
  };

  const handleRejectPR = async () => {
    if (!selectedPR) return;
    try {
      await psRequisitionService.update(selectedPR.id, { status: "Rejected" });
      await reload();
      setSelectedPR((prev) => (prev ? { ...prev, status: "Rejected" } : null));
      setToast({ message: `${selectedPR.prNumber} rejected.`, variant: "info" });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Reject failed", variant: "info" });
    }
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-5 select-none pb-12">
      {toast && (
        <AlertBanner
          variant={toast.variant}
          message={toast.message}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Page Header */}
      <FOPageHeader
        eyebrow="PURCHASE & STORES"
        title="Purchase Requisitions"
        description="Manage internal purchase requests raised by hotel departments before procurement."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setToast({ message: "Exporting Purchase Requisition Register CSV...", variant: "info" })}
              className="!bg-white hover:!bg-slate-100 !text-slate-700 !border-slate-200 flex items-center justify-center gap-1.5 rounded-xl h-8 px-3 text-xs font-bold shrink-0"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" /> Export CSV
            </Button>

            <Link href="/purchase-stores/procurement/requisitions/create">
              <Button
                className="!bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white flex items-center justify-center gap-1.5 rounded-xl h-8 px-3.5 text-xs font-bold shrink-0 shadow-xs cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <Plus className="h-3.5 w-3.5" /> Create Purchase Requisition
              </Button>
            </Link>
          </div>
        }
      />

      {/* 5 Summary KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-20 rounded-2xl border border-slate-200 bg-white p-4 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatMiniCard label="Total PR" value={`${metrics.total}`} icon={FileText} accent="#10b981" />
          <StatMiniCard label="Pending" value={`${metrics.pending}`} icon={Clock} accent="#d97706" />
          <StatMiniCard label="Approved" value={`${metrics.approved}`} icon={CheckCircle2} accent="#0284c7" />
          <StatMiniCard label="In Sourcing / Ordering" value={`${metrics.sourcing}`} icon={PackageSearch} accent="#7c3aed" />
          <StatMiniCard label="Rejected" value={`${metrics.rejected}`} icon={AlertTriangle} accent="#dc2626" />
          <StatMiniCard label="Emergency" value={`${metrics.emergency}`} icon={Zap} accent="#e11d48" />
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search PR number, requester, department or item..."
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setFilterDrawerOpen(true)}
        statusTabs={[
          { id: "all", label: "All Requisitions" },
          ...PR_STATUSES.map((s) => ({ id: s.toLowerCase(), label: s })),
        ]}
        activeStatusTab={statusFilter}
        onStatusTabChange={setStatusFilter}
        selectionBar={
          <ModuleSelectionBar
            count={selectedIds.size}
            noun="requisition"
            onClear={() => setSelectedIds(new Set())}
            actions={[
              {
                label: "View",
                onClick: () => {
                  const first = filteredPRs.find((p) => selectedIds.has(p.id));
                  if (first) setSelectedPR(first);
                },
              },
              {
                label: "Edit",
                onClick: () => {
                  const first = filteredPRs.find((p) => selectedIds.has(p.id));
                  if (!first) return;
                  if (!canEditPR(first)) {
                    setToast({
                      message: `${first.prNumber} is ${first.status} and can no longer be edited.`,
                      variant: "info",
                    });
                    return;
                  }
                  setEditPR(first);
                },
              },
              ...(() => {
                const first = filteredPRs.find((p) => selectedIds.has(p.id));
                if (!first) return [];
                const { canCreateRfq, canCreatePo } = sourcingActionsFor(first);
                return [
                  ...(canCreateRfq ? [{ label: "Create RFQ", onClick: () => goCreateRfq(first) }] : []),
                  ...(canCreatePo ? [{ label: "Create PO", onClick: () => goCreatePo(first) }] : []),
                ];
              })(),
              {
                label: "Duplicate",
                onClick: () => {
                  const first = filteredPRs.find((p) => selectedIds.has(p.id));
                  if (first) handleDuplicatePR(first);
                },
              },
              {
                label: "Export selected",
                icon: <Download className="h-3.5 w-3.5" />,
                onClick: () =>
                  setToast({
                    message: `Exporting ${selectedIds.size} requisition(s)…`,
                    variant: "info",
                  }),
              },
              {
                label: "Cancel",
                variant: "danger",
                onClick: () => {
                  const first = filteredPRs.find(
                    (p) => selectedIds.has(p.id) && p.status !== "Cancelled",
                  );
                  if (first) handleCancelPR(first);
                },
              },
            ]}
          />
        }
      />

      {/* MOBILE ACTION CONTROLS BAR: [ Filter ] [ Sort ] [ + Create ] */}
      <div className="flex sm:hidden items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setFilterDrawerOpen(true)}
          className="flex-1 h-11 text-xs font-bold border-slate-300 text-slate-700 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Filter className="h-4 w-4" /> Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setToast({ message: "Sorted by Recent Requisitions", variant: "info" })}
          className="flex-1 h-11 text-xs font-bold border-slate-300 text-slate-700 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ArrowUpDown className="h-4 w-4" /> Sort
        </Button>
        <Button
          type="button"
          onClick={openCreateRequisition}
          className="flex-1 h-11 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4" /> + Create
        </Button>
      </div>

      {/* Slide-over Filter Drawer */}
      <OperationsFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filter Purchase Requisitions"
        activeFilterCount={activeFilterCount}
        onReset={() => {
          setSourceFilter("all");
          setDepartmentFilter("all");
          setStatusFilter("all");
          setPriorityFilter("all");
          setRequesterFilter("all");
          setCostCenterFilter("all");
          setApproverFilter("all");
          setRequiredDateFilter("");
          setCreatedDateFilter("");
          setEstAmountFilter("all");
        }}
      >
        <div className="space-y-4 select-none">
          <FormField label="Source Module">
            <SelectInput
              value={sourceFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSourceFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Modules</option>
              {PR_SOURCE_MODULES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Department">
            <SelectInput
              value={departmentFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDepartmentFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Departments</option>
              {[...new Set(prList.map((pr) => pr.department))].sort().map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Status">
            <SelectInput
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Statuses</option>
              {PR_STATUSES.map((s) => (
                <option key={s} value={s.toLowerCase()}>
                  {s}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Priority Level">
            <SelectInput
              value={priorityFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPriorityFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Priorities</option>
              <option value="Low">Low Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="High">High Priority</option>
              <option value="Emergency">Emergency Priority</option>
            </SelectInput>
          </FormField>

          <FormField label="Requester Name">
            <SelectInput
              value={requesterFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRequesterFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Requesters</option>
              <option value="Amit Sharma">Amit Sharma</option>
              <option value="Rahul Singh">Rahul Singh</option>
              <option value="Chef Arjun">Chef Arjun</option>
            </SelectInput>
          </FormField>

          <FormField label="Cost Center">
            <SelectInput
              value={costCenterFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCostCenterFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Cost Centers</option>
              <option value="CC-HK-LINEN">CC-HK-LINEN (Housekeeping Linen)</option>
              <option value="CC-ENG-HVAC">CC-ENG-HVAC (Engineering Plant)</option>
              <option value="CC-FB-[#001]">CC-FB-[#001] (Main Kitchen)</option>
            </SelectInput>
          </FormField>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFilterDrawerOpen(false)}
              className="h-9 px-4 text-xs font-bold !bg-slate-100 text-slate-700 rounded-xl"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={() => setFilterDrawerOpen(false)}
              className="h-9 px-4 text-xs font-bold !bg-[#0F8A5F] text-white rounded-xl"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </OperationsFilterDrawer>

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : (
          <ModuleDataTable
            columns={columns}
            rows={filteredPRs}
            emptyMessage="No purchase requisitions match your filters."
            onRowClick={(row) => setSelectedPR(row as PurchaseRequisition)}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            renderMobileCard={(pr: PurchaseRequisition) => (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-semibold text-slate-900">{pr.prNumber}</p>
                    <p className="text-xs text-slate-500">
                      {pr.department} · {pr.requestedBy}
                    </p>
                  </div>
                  {renderStatusBadge(pr.status)}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  {renderPriorityBadge(pr.priority)}
                  <span>Est. {formatINR(pr.estimatedAmount)}</span>
                  <span>· {pr.requiredDate}</span>
                </div>
                {renderSourcingButtons(pr)}
              </div>
            )}
          />
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>
            Showing {filteredPRs.length} of {prList.length} requisitions
          </span>
          <div className="flex items-center gap-2">
            <span>Rows</span>
            <SelectInput
              value={rowsPerPage}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRowsPerPage(e.target.value)}
              className="h-8 rounded-lg text-xs"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </SelectInput>
          </div>
        </div>
      </div>

      {/* DETAIL DRAWER */}
      {selectedPR && (
        <Drawer
          side="bottom"
          open={!!selectedPR}
          onClose={() => setSelectedPR(null)}
          title={`Purchase Requisition: ${selectedPR.prNumber}`}
          width="xl"
          footer={
            <DocumentApprovalFooter
              showApprovalActions={selectedPR.status === "Pending Approval"}
              onApprove={handleApprovePR}
              onReject={handleRejectPR}
              onClose={() => setSelectedPR(null)}
              approveLabel="Approve Requisition"
              rejectLabel="Reject"
              extraActions={renderSourcingButtons(selectedPR)}
            />
          }
        >
          <div className="space-y-6 select-none pb-6">
            {/* Header Badge */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-extrabold text-emerald-700">{selectedPR.prNumber}</span>
                <div className="flex items-center gap-1.5">
                  {renderPriorityBadge(selectedPR.priority)}
                  {renderStatusBadge(selectedPR.status)}
                </div>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">{selectedPR.department} Department Request</h3>
              <p className="text-xs text-slate-500 font-medium">
                Raised from {selectedPR.sourceModule ?? "Purchase & Stores"} · Requested By: {selectedPR.requestedBy} · Date:{" "}
                {selectedPR.requestDate}
              </p>
            </div>

            {/* SECTION 1: BASIC INFORMATION */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                Basic Information
              </h4>
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-3 border-b border-slate-100 pb-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">PR Number</span>
                    <p className="font-mono font-bold text-slate-900">{selectedPR.prNumber}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Department</span>
                    <p className="font-extrabold text-slate-800">{selectedPR.department}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-b border-slate-100 pb-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Requester Name</span>
                    <p className="font-bold text-slate-800">{selectedPR.requestedBy}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Cost Center</span>
                    <p className="font-mono font-bold text-slate-800">{selectedPR.costCenter || "—"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-b border-slate-100 pb-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Request Date</span>
                    <p className="font-bold text-slate-800">{selectedPR.requestDate}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Required Date</span>
                    <p className="font-bold text-slate-800">{selectedPR.requiredDate}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-500 font-medium">Estimated Total Amount:</span>
                  <span className="font-extrabold text-emerald-700 text-sm">
                    ₹{selectedPR.estimatedAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 2: REQUESTED ITEMS */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                Requested Items
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Quantity</th>
                      {showQtyProgress && <th className="px-3 py-2">Ordered</th>}
                      {showQtyProgress && <th className="px-3 py-2">Remaining</th>}
                      <th className="px-3 py-2">Unit</th>
                      <th className="px-3 py-2">Est. Price</th>
                      <th className="px-3 py-2">Est. Total</th>
                      <th className="px-3 py-2 text-right">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px] font-semibold text-slate-700">
                    {selectedPR.requestedItems.map((item, idx) => {
                      const line = selectedFulfillment?.items[idx];
                      return (
                      <tr key={item.id}>
                        <td className="px-3 py-2 font-bold text-slate-900">{item.item}</td>
                        <td className="px-3 py-2 text-slate-500">{item.category}</td>
                        <td className="px-3 py-2 font-extrabold text-slate-800">{item.quantity}</td>
                        {showQtyProgress && (
                          <td className="px-3 py-2 text-slate-700">{line?.ordered ?? 0}</td>
                        )}
                        {showQtyProgress && (
                          <td
                            className={cn(
                              "px-3 py-2 font-extrabold",
                              (line?.remaining ?? 0) > 0 ? "text-amber-700" : "text-emerald-700",
                            )}
                          >
                            {line?.remaining ?? item.quantity}
                          </td>
                        )}
                        <td className="px-3 py-2 text-slate-500">{item.unit}</td>
                        <td className="px-3 py-2 text-slate-600">₹{item.estimatedPrice}</td>
                        <td className="px-3 py-2 font-extrabold text-slate-900">
                          ₹{item.total.toLocaleString("en-IN")}
                        </td>
                        <td className="px-3 py-2 text-right text-[10px] text-slate-500 font-normal truncate max-w-[120px]">
                          {item.remarks || "Standard specification"}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedFulfillment &&
              (selectedFulfillment.rfqs.length > 0 || selectedFulfillment.purchaseOrders.length > 0) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                    Sourcing &amp; Orders
                  </h4>
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Ordered quantity</span>
                      <span className="font-extrabold text-slate-900">
                        {selectedFulfillment.totalOrdered} / {selectedFulfillment.totalRequested}
                        {selectedFulfillment.totalRemaining > 0
                          ? ` · ${selectedFulfillment.totalRemaining} remaining`
                          : " · fully ordered"}
                      </span>
                    </div>
                    {selectedFulfillment.rfqs.map((r) => (
                      <div key={r.id} className="flex items-center justify-between border-t border-slate-100 pt-2">
                        <span className="font-mono font-bold text-sky-700">{r.rfqNumber}</span>
                        <span className="text-slate-500">RFQ · {r.status}</span>
                      </div>
                    ))}
                    {selectedFulfillment.purchaseOrders.map((p) => (
                      <div key={p.id} className="flex items-center justify-between border-t border-slate-100 pt-2">
                        <span className="font-mono font-bold text-emerald-700">{p.poNumber}</span>
                        <span className="text-slate-500">PO · {p.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* SECTION 3: BUSINESS JUSTIFICATION */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                Business Justification
              </h4>
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 text-xs text-slate-700 font-medium leading-relaxed">
                "{selectedPR.justification}"
              </div>
            </div>

            {/* SECTION 4: APPROVAL TIMELINE */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                Approval Timeline
              </h4>
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3">
                {selectedPR.approvalTimeline.map((step, idx) => {
                  const isCompleted = step.status === "Completed";
                  const isCurrent = step.status === "Current";

                  return (
                    <div key={step.stage} className="flex items-start gap-3 relative">
                      {idx !== selectedPR.approvalTimeline.length - 1 && (
                        <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-slate-200 -mb-3" />
                      )}
                      <div
                        className={cn(
                          "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 shrink-0",
                          isCompleted
                            ? "bg-emerald-600 text-white"
                            : isCurrent
                            ? "bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse"
                            : "bg-slate-100 text-slate-400 border border-slate-200"
                        )}
                      >
                        {isCompleted ? "✓" : idx + 1}
                      </div>

                      <div className="flex-1 pb-1">
                        <div className="flex items-center justify-between">
                          <span className={cn("text-xs font-extrabold", isCurrent ? "text-amber-800" : "text-slate-800")}>
                            {step.stage}
                          </span>
                          {step.timestamp && <span className="text-[10px] text-slate-400">{step.timestamp}</span>}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">Approver: {step.approverName}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 5: ATTACHMENTS */}
            {(selectedPR.attachments?.length ?? 0) > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                Attachments
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {selectedPR.attachments.map((att) => {
                  const attRecord = attachmentFromApi(att, selectedPR.requestedBy, selectedPR.requestDate);
                  return (
                  <div key={att.id} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-slate-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold text-slate-800 truncate">{att.fileName}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{att.fileSize}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePreviewAttachment(attRecord)}
                      className="text-[10px] font-bold text-emerald-700 hover:underline shrink-0"
                    >
                      Preview
                    </button>
                  </div>
                  );
                })}
              </div>
            </div>
            )}

          </div>
        </Drawer>
      )}

      {/* CREATE / EDIT PURCHASE REQUISITION DRAWER (SAP FIORI / ENTERPRISE REDESIGN) */}
      <Drawer
        side="bottom"
        open={createModalOpen || !!editPR}
        onClose={() => {
          setCreateModalOpen(false);
          setEditPR(null);
        }}
        title={editPR ? `Edit Requisition: ${editPR.prNumber}` : "Create Purchase Requisition"}
        width="responsive"
        customHeader={
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                  {editPR ? `Edit Requisition ${editPR.prNumber}` : "New Purchase Requisition"}
                </h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                  {editPR?.status ?? "Draft"}
                </span>
              </div>
              <p className="truncate text-xs text-slate-500">
                Request materials for your department. It goes for approval once submitted.
              </p>
            </div>
          </div>
        }
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              <strong className="text-slate-800">{newItems.length}</strong> item{newItems.length === 1 ? "" : "s"} ·
              Estimated <strong className="text-slate-800">₹{newItemsTotal.toLocaleString("en-IN")}</strong>
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateModalOpen(false);
                  setEditPR(null);
                }}
                className="h-9 px-4 text-xs font-semibold !bg-white hover:!bg-slate-100 text-slate-700 border-slate-300 rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSaveRequisition(true)}
                className="h-9 px-4 text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Save Draft
              </Button>
              <Button
                type="button"
                onClick={() => handleSaveRequisition(false)}
                className="h-9 px-5 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" /> Submit for Approval
              </Button>
            </div>
          </div>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveRequisition(false);
          }}
          className="grid gap-5 pb-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start"
        >
          <div className="min-w-0 space-y-5">
            {/* REQUEST DETAILS */}
            <ProcurementFormSection step={1} title="Request Details" subtitle="Who needs it, and by when">
              <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
                <FormField label="Department" required>
                  <SelectInput
                    value={newDept}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewDept(e.target.value)}
                    className={cn("block h-10 text-sm", !newDept && "text-slate-400")}
                  >
                    <option value="" disabled>Select department</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Kitchen">Kitchen (Food & Beverage)</option>
                  </SelectInput>
                </FormField>

                <FormField label="Requester Name" required>
                  <TextInput
                    value={newRequester}
                    placeholder="Who is requesting?"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRequester(e.target.value)}
                    className="h-10 text-sm"
                  />
                </FormField>

                <FormField label="Required By" required>
                  <TextInput
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={newReqDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewReqDate(e.target.value)}
                    className="h-10 text-sm"
                  />
                </FormField>

                <div className="sm:col-span-2 xl:col-span-2">
                  <span className="mb-1.5 block text-xs font-medium text-slate-600">
                    Priority <span className="text-red-500">*</span>
                  </span>
                  <PrioritySelector value={newPriority} onChange={setNewPriority} />
                </div>

                <FormField label="Cost Center">
                  <SelectInput
                    value={newCostCenter}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewCostCenter(e.target.value)}
                    className={cn("block h-10 text-sm", !newCostCenter && "text-slate-400")}
                  >
                    <option value="">Optional</option>
                    <option value="CC-HK-LINEN">CC-HK-LINEN (Housekeeping Linen Dept)</option>
                    <option value="CC-ENG-HVAC">CC-ENG-HVAC (Engineering HVAC Maintenance)</option>
                    <option value="CC-FB-[#001]">CC-FB-[#001] (F&B Main Kitchen Operating)</option>
                  </SelectInput>
                </FormField>
              </div>
            </ProcurementFormSection>

            {/* REQUESTED ITEMS */}
            <ProcurementFormSection
              step={2}
              title="Requested Items"
              subtitle={newItems.length ? `${newItems.length} item${newItems.length === 1 ? "" : "s"} added` : "Pick materials from the product catalog"}
              action={
                newItems.length > 0 ? (
                  <Button
                    type="button"
                    onClick={handleOpenInventoryModal}
                    className="h-8 px-3 text-xs font-semibold !bg-emerald-700 hover:!bg-emerald-800 text-white rounded-lg cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Item
                  </Button>
                ) : undefined
              }
            >
              {newItems.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-10 text-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-400 ring-1 ring-slate-200">
                    <PackageSearch className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">No items yet</p>
                  <p className="max-w-xs text-xs text-slate-500">Add the materials you need from the product catalog.</p>
                  <Button
                    type="button"
                    onClick={handleOpenInventoryModal}
                    className="mt-1 h-9 px-4 text-xs font-semibold !bg-emerald-700 hover:!bg-emerald-800 text-white rounded-lg cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add from Catalog
                  </Button>
                </div>
              ) : (
                <>
                  {/* DESKTOP TABLE */}
                  <div className="hidden overflow-hidden rounded-xl border border-slate-200 sm:block">
                    <div className="max-h-[340px] overflow-y-auto">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          <tr className="border-b border-slate-200">
                            <th className="px-3 py-2.5">Item</th>
                            <th className="w-24 px-3 py-2.5 text-center">Qty</th>
                            <th className="w-32 px-3 py-2.5 text-right">Est. Price (₹)</th>
                            <th className="w-28 px-3 py-2.5 text-right">Est. Total</th>
                            <th className="px-3 py-2.5">Remarks</th>
                            <th className="w-10 px-3 py-2.5" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {newItems.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/60">
                              <td className="min-w-[160px] px-3 py-2.5">
                                <p className="font-semibold text-slate-900">{item.item}</p>
                                <p className="text-[11px] text-slate-500">{item.category || "Uncategorised"}</p>
                              </td>
                              <td className="px-2 py-2">
                                <div className="flex items-center gap-1.5">
                                  <TextInput
                                    type="number"
                                    min={1}
                                    value={item.quantity}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      handleItemFieldChange(item.id, "quantity", e.target.value)
                                    }
                                    className="h-8 text-center text-xs font-semibold"
                                  />
                                  <span className="shrink-0 text-[11px] text-slate-500">{item.unit || "Pcs"}</span>
                                </div>
                              </td>
                              <td className="px-2 py-2">
                                <TextInput
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={item.estimatedPrice}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    handleItemFieldChange(item.id, "estimatedPrice", e.target.value)
                                  }
                                  placeholder="0"
                                  className="h-8 text-right text-xs font-semibold"
                                />
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold text-slate-900">
                                ₹{(item.quantity * item.estimatedPrice).toLocaleString("en-IN")}
                              </td>
                              <td className="min-w-[140px] px-2 py-2">
                                <TextInput
                                  value={item.remarks || ""}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    handleItemFieldChange(item.id, "remarks", e.target.value)
                                  }
                                  placeholder="Optional"
                                  className="h-8 text-xs"
                                />
                              </td>
                              <td className="px-2 py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItemRow(item.id)}
                                  className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                  aria-label={`Remove ${item.item}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-slate-200 bg-slate-50/70">
                            <td colSpan={3} className="px-3 py-2.5 text-right text-xs font-medium text-slate-500">
                              Estimated Total
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-right text-sm font-bold text-emerald-800">
                              ₹{newItemsTotal.toLocaleString("en-IN")}
                            </td>
                            <td colSpan={2} />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* MOBILE CARDS */}
                  <div className="space-y-2.5 sm:hidden">
                    {newItems.map((item) => (
                      <div key={item.id} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-900">{item.item}</p>
                            <p className="text-[11px] text-slate-500">{item.category || "Uncategorised"}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(item.id)}
                            className="p-1 text-slate-400 hover:text-red-600"
                            aria-label={`Remove ${item.item}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="block">
                            <span className="mb-1 block text-[10px] text-slate-500">Qty ({item.unit || "Pcs"})</span>
                            <TextInput
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                handleItemFieldChange(item.id, "quantity", e.target.value)
                              }
                              className="h-8 text-center text-xs font-semibold"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1 block text-[10px] text-slate-500">Est. Price (₹)</span>
                            <TextInput
                              type="number"
                              min={0}
                              step="0.01"
                              value={item.estimatedPrice}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                handleItemFieldChange(item.id, "estimatedPrice", e.target.value)
                              }
                              placeholder="0"
                              className="h-8 text-right text-xs font-semibold"
                            />
                          </label>
                        </div>
                        <p className="text-right font-semibold text-slate-900">
                          ₹{(item.quantity * item.estimatedPrice).toLocaleString("en-IN")}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </ProcurementFormSection>

            {/* JUSTIFICATION */}
            <ProcurementFormSection step={3} title="Business Justification" subtitle="Why is this purchase needed?">
              <FormField label="Reason for Request" required>
                <TextAreaInput
                  rows={4}
                  maxLength={500}
                  value={newJustification}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewJustification(e.target.value)}
                  placeholder="Explain the need and the impact if it's delayed…"
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                />
              </FormField>
              <p className="mt-1 text-right text-[11px] text-slate-400">{newJustification.length}/500</p>
            </ProcurementFormSection>
          </div>

          {/* LIVE SUMMARY */}
          <aside className="space-y-4 lg:sticky lg:top-0">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Summary</p>
              <dl className="space-y-2.5 text-xs">
                <ProcurementSummaryRow icon={<Building2 className="h-3.5 w-3.5" />} label="Department" value={newDept} />
                <ProcurementSummaryRow icon={<User className="h-3.5 w-3.5" />} label="Requester" value={newRequester} />
                <ProcurementSummaryRow icon={<CalendarDays className="h-3.5 w-3.5" />} label="Required by" value={newReqDate} />
                <ProcurementSummaryRow
                  icon={<AlertTriangle className="h-3.5 w-3.5" />}
                  label="Priority"
                  value={newPriority}
                  valueClassName={priorityTextClass(newPriority)}
                />
                <ProcurementSummaryRow icon={<PackageSearch className="h-3.5 w-3.5" />} label="Items" value={newItems.length ? String(newItems.length) : ""} />
              </dl>
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="text-[11px] text-slate-500">Estimated total</p>
                <p className="text-xl font-bold text-slate-900">₹{newItemsTotal.toLocaleString("en-IN")}</p>
              </div>
            </div>
            <div className="rounded-xl bg-emerald-50/70 p-4 text-[11px] leading-relaxed text-emerald-900">
              After approval, Stores can raise an RFQ or a purchase order directly from this requisition.
            </div>
          </aside>
        </form>
      </Drawer>

      {/* SELECT INVENTORY ITEM MODAL (ENTERPRISE ERP CATALOG LOOKUP) */}
      <Modal
        open={isInventoryModalOpen}
        onClose={() => setIsInventoryModalOpen(false)}
        title="Select Inventory Item"
        description="Search master catalog and select an item to add to requested items."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsInventoryModalOpen(false)}
              className="h-9 px-4 text-xs font-bold !bg-slate-100 text-slate-700 rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!selectedCatalogItem}
              onClick={handleConfirmAddInventoryItem}
              className="h-9 px-4 text-xs font-bold !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
            >
              Add Selected Item
            </Button>
          </div>
        }
      >
        <div className="space-y-4 select-none py-1">
          {/* Catalog Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <TextInput
              value={inventorySearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInventorySearch(e.target.value)}
              placeholder="Search inventory items by code, name or category..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Master Inventory Catalog Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white max-h-[300px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 z-10">
                <tr>
                  <th className="px-3 py-2 w-10 text-center">Select</th>
                  <th className="px-3 py-2">Item Code</th>
                  <th className="px-3 py-2">Item Name</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredInventoryCatalog.length > 0 ? (
                  filteredInventoryCatalog.map((catalogItem) => {
                    const isSelected = selectedCatalogItem?.itemCode === catalogItem.itemCode;

                    return (
                      <tr
                        key={catalogItem.itemCode}
                        onClick={() => setSelectedCatalogItem(catalogItem)}
                        className={cn(
                          "cursor-pointer transition-colors",
                          isSelected ? "bg-emerald-50/80" : "hover:bg-slate-50/70"
                        )}
                      >
                        <td className="px-3 py-2.5 text-center">
                          <input
                            type="radio"
                            name="inventorySelect"
                            checked={isSelected}
                            onChange={() => setSelectedCatalogItem(catalogItem)}
                            className="accent-emerald-700 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2.5 font-mono font-bold text-slate-900">
                          {catalogItem.itemCode}
                        </td>
                        <td className="px-3 py-2.5 font-extrabold text-slate-900">
                          {catalogItem.itemName}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 font-medium">
                          {catalogItem.category}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 font-medium">
                          {catalogItem.unit}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-medium">
                      No matching inventory items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      <PurchaseAttachmentPreviewModal
        attachment={previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />
    </div>
  );
}
