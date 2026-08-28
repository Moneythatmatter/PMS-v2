"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
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
  FileSpreadsheet,
  FileCode,
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
} from "@/components/frontoffice/ui";
import { OperationsToolbar, OperationsFilterDrawer } from "@/components/housekeeping/OperationsToolbar";
import { DocumentApprovalFooter } from "@/components/purchase-stores/ui/DocumentApprovalFooter";
import { ModuleDataTable } from "@/components/pms/ModuleDataTable";
import { ModuleSelectionBar } from "@/components/pms/ModuleSelectionBar";
import type { ModuleColumn } from "@/components/pms/module-types";
import type { PurchaseRequisition, PRRequestedItem } from "@/app/data/purchaseRequisitionsData";
import { usePsList } from "@/hooks/usePsResource";
import { psRequisitionService, psProductService } from "@/services/purchase-stores/index";
import {
  type MaterialCatalogItem,
  prItemFromCatalog,
  productsToCatalog,
} from "@/app/data/procurementMaterial";
import {
  type PurchaseAttachmentRecord,
  MAX_ATTACHMENT_BYTES,
  attachmentFromApi,
  attachmentToApiPayload,
  createAttachmentFromFile,
  revokeAttachmentUrls,
} from "@/app/data/purchaseAttachmentUtils";
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

/** @deprecated Empty — attachments come from user uploads */
export const DEFAULT_FORM_ATTACHMENTS: PRFormAttachment[] = [];

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

  // Native File Input Reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: prList, loading: isLoading, reload } = usePsList(() => psRequisitionService.list(), []);
  const { data: products, loading: loadingProducts } = usePsList(() => psProductService.list(), []);
  const inventoryCatalog = useMemo(
    () => productsToCatalog(products).map(toInventoryCatalogItem),
    [products],
  );
  const [saving, setSaving] = useState(false);

  // Search & Filter State
  const [search, setSearch] = useState("");
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
  const [newDept, setNewDept] = useState("Housekeeping");
  const [newRequester, setNewRequester] = useState("Amit Sharma");
  const [newReqDate, setNewReqDate] = useState("2026-07-25");
  const [newPriority, setNewPriority] = useState<PurchaseRequisition["priority"]>("High");
  const [newCostCenter, setNewCostCenter] = useState("CC-HK-LINEN");
  const [newJustification, setNewJustification] = useState(
    "Current linen inventory has fallen below the minimum stock level before the upcoming holiday season. Additional stock is required to maintain operational readiness."
  );

  // Form Attachments State
  const [formAttachments, setFormAttachments] = useState<PRFormAttachment[]>([]);
  const [previewAttachment, setPreviewAttachment] = useState<PRFormAttachment | null>(null);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);

  // Dynamic Requested Items State
  const [newItems, setNewItems] = useState<PRRequestedItem[]>([]);

  const openCreateRequisition = () => {
    setEditPR(null);
    const first = inventoryCatalog[0];
    setNewItems(first ? [prItemFromCatalog(first, 1)] : []);
    revokeAttachmentUrls(formAttachments);
    setFormAttachments([]);
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
      setFormAttachments(
        editPR.attachments.map((a) =>
          attachmentFromApi(
            {
              id: a.id,
              fileName: a.fileName,
              fileSize: a.fileSize,
              fileType: a.fileType,
              dataUrl: a.dataUrl,
              mimeType: a.mimeType,
            },
            editPR.requestedBy,
            editPR.requestDate,
          ),
        ),
      );
    }
  }, [editPR]);

  // Toast State
  const [toast, setToast] = useState<{ message: string; variant: "success" | "info" } | null>(null);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Filtered Inventory Catalog inside Selection Modal
  const filteredInventoryCatalog = useMemo(() => {
    return inventoryCatalog.filter((item) => {
      const query = inventorySearch.toLowerCase();
      return (
        item.itemCode.toLowerCase().includes(query) ||
        item.itemName.toLowerCase().includes(query) ||
        item.productCode.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    });
  }, [inventoryCatalog, inventorySearch]);

  // Dynamic Summary Metrics Calculation
  const metrics = useMemo(() => {
    const total = prList.length;
    const pending = prList.filter((p) => p.status === "Pending Approval").length;
    const approved = prList.filter((p) => p.status === "Approved").length;
    const rejected = prList.filter((p) => p.status === "Rejected").length;
    const emergency = prList.filter((p) => p.priority === "Emergency").length;

    return { total, pending, approved, rejected, emergency };
  }, [prList]);

  // Filter Active Count
  const activeFilterCount = useMemo(() => {
    let count = 0;
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

      const matchDept =
        departmentFilter === "all" || pr.department.toLowerCase() === departmentFilter.toLowerCase();

      const matchStatus =
        statusFilter === "all" || pr.status.toLowerCase() === statusFilter.toLowerCase();

      const matchPriority =
        priorityFilter === "all" || pr.priority.toLowerCase() === priorityFilter.toLowerCase();

      const matchRequester =
        requesterFilter === "all" || pr.requestedBy.toLowerCase().includes(requesterFilter.toLowerCase());

      const matchCostCenter =
        costCenterFilter === "all" || pr.costCenter.toLowerCase() === costCenterFilter.toLowerCase();

      const matchApprover =
        approverFilter === "all" || pr.currentApprover.toLowerCase().includes(approverFilter.toLowerCase());

      return (
        matchSearch &&
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
        <span className="font-medium text-slate-900">{pr.department}</span>
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
      header: "Amount",
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
  ];

  // Render File Type Icon Helper
  const renderFileIcon = (fileType: PRFormAttachment["fileType"]) => {
    switch (fileType) {
      case "PDF":
        return <FileText className="h-3.5 w-3.5 text-red-600 shrink-0" />;
      case "Excel":
        return <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
      case "Word":
        return <FileText className="h-3.5 w-3.5 text-blue-600 shrink-0" />;
      case "Image":
        return <Paperclip className="h-3.5 w-3.5 text-amber-600 shrink-0" />;
      default:
        return <Paperclip className="h-3.5 w-3.5 text-slate-500 shrink-0" />;
    }
  };

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

  // Native File Picker Select Handler — reads file as base64 for save + preview
  const handleNativeFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const oversized = Array.from(files).filter((f) => f.size > MAX_ATTACHMENT_BYTES);
    if (oversized.length > 0) {
      setToast({
        message: `${oversized.map((f) => f.name).join(", ")} exceeds 5 MB limit.`,
        variant: "info",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploadingAttachments(true);
    try {
      const newAtts = await Promise.all(
        Array.from(files).map((file) =>
          createAttachmentFromFile(file, newRequester || "Store User"),
        ),
      );
      setFormAttachments((prev) => [...prev, ...newAtts]);
      setToast({ message: `Attached ${files.length} file(s).`, variant: "success" });
    } catch {
      setToast({ message: "Failed to read file. Try again.", variant: "info" });
    } finally {
      setUploadingAttachments(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setFormAttachments((prev) => {
      const removed = prev.find((a) => a.id === id);
      if (removed) revokeAttachmentUrls([removed]);
      return prev.filter((a) => a.id !== id);
    });
    setToast({ message: "Attachment removed.", variant: "info" });
  };

  const handlePreviewAttachment = (att: PRFormAttachment) => {
    if (!att.dataUrl && !att.previewUrl) {
      setToast({ message: "No preview data for this file. Re-upload to preview.", variant: "info" });
      return;
    }
    setPreviewAttachment(att);
  };

  const formAttachmentsRef = useRef(formAttachments);
  formAttachmentsRef.current = formAttachments;

  useEffect(() => {
    return () => revokeAttachmentUrls(formAttachmentsRef.current);
  }, []);

  // OPEN INVENTORY SELECTION MODAL
  const handleOpenInventoryModal = () => {
    setInventorySearch("");
    setSelectedCatalogItem(inventoryCatalog[0] ?? null);
    setIsInventoryModalOpen(true);
  };

  // CONFIRM ADD INVENTORY ITEM FROM MODAL TO TABLE
  const handleConfirmAddInventoryItem = () => {
    if (!selectedCatalogItem) return;

    const newItem = prItemFromCatalog(selectedCatalogItem, 1);

    setNewItems((prev) => [...prev, newItem]);
    setIsInventoryModalOpen(false);
    setToast({
      message: `Added ${selectedCatalogItem.itemName} to requested items.`,
      variant: "success",
    });
  };

  // DELETE ITEM HANDLER (Keeps at least 1 row)
  const handleRemoveItemRow = (id: string) => {
    if (newItems.length <= 1) {
      setToast({ message: "Requisition must contain at least one item.", variant: "info" });
      return;
    }
    setNewItems((prev) => prev.filter((i) => i.id !== id));
  };

  // UPDATE FIELD IN ITEM ROW HANDLER
  const handleItemFieldChange = (id: string, field: "quantity" | "remarks", value: any) => {
    setNewItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "quantity") {
            const qty = Math.max(1, parseInt(value, 10) || 1);
            updated.quantity = qty;
            updated.total = qty * item.estimatedPrice;
          }
          return updated;
        }
        return item;
      })
    );
  };

  // SAVE / SUBMIT REQUISITION
  const handleSaveRequisition = async (isDraft: boolean) => {
    const totalAmt = newItems.reduce((acc, i) => acc + i.quantity * i.estimatedPrice, 0);
    const payload: Partial<PurchaseRequisition> = {
      department: newDept,
      requestedBy: newRequester,
      requiredDate: newReqDate,
      priority: newPriority,
      costCenter: newCostCenter,
      justification: newJustification,
      estimatedAmount: totalAmt,
      requestedItems: newItems,
      status: isDraft ? "Draft" : "Pending Approval",
      attachments: formAttachments.map(attachmentToApiPayload),
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
          requestDate: "Today",
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
      {/* Hidden Native File Input */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleNativeFileSelect}
        className="hidden"
        accept=".pdf,.xlsx,.xls,.csv,.docx,.doc,.png,.jpg,.jpeg,.gif,.webp"
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl p-3 text-xs font-bold shadow-xl animate-in fade-in slide-in-from-bottom-2",
            toast.variant === "success" ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>{toast.message}</span>
        </div>
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 rounded-2xl border border-slate-200 bg-white p-4 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatMiniCard label="Total PR" value={`${metrics.total}`} icon={FileText} accent="#10b981" />
          <StatMiniCard label="Pending" value={`${metrics.pending}`} icon={Clock} accent="#d97706" />
          <StatMiniCard label="Approved" value={`${metrics.approved}`} icon={CheckCircle2} accent="#0284c7" />
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
          { id: "pending approval", label: "Pending Approval" },
          { id: "approved", label: "Approved" },
          { id: "rejected", label: "Rejected" },
          { id: "cancelled", label: "Cancelled" },
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
                  if (first) setEditPR(first);
                },
              },
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
          <FormField label="Department">
            <SelectInput
              value={departmentFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDepartmentFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Departments</option>
              <option value="Housekeeping">Housekeeping</option>
              <option value="Engineering">Engineering</option>
              <option value="Kitchen">Kitchen (Food & Beverage)</option>
            </SelectInput>
          </FormField>

          <FormField label="Status">
            <SelectInput
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
              <option value="draft">Draft</option>
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
                  <span>{formatINR(pr.estimatedAmount)}</span>
                  <span>· {pr.requiredDate}</span>
                </div>
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
              <p className="text-xs text-slate-500 font-medium">Requested By: {selectedPR.requestedBy} · Date: {selectedPR.requestDate}</p>
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
                    <p className="font-mono font-bold text-slate-800">{selectedPR.costCenter}</p>
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
                      <th className="px-3 py-2">Unit</th>
                      <th className="px-3 py-2">Est. Price</th>
                      <th className="px-3 py-2">Est. Total</th>
                      <th className="px-3 py-2 text-right">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px] font-semibold text-slate-700">
                    {selectedPR.requestedItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 font-bold text-slate-900">{item.item}</td>
                        <td className="px-3 py-2 text-slate-500">{item.category}</td>
                        <td className="px-3 py-2 font-extrabold text-slate-800">{item.quantity}</td>
                        <td className="px-3 py-2 text-slate-500">{item.unit}</td>
                        <td className="px-3 py-2 text-slate-600">₹{item.estimatedPrice}</td>
                        <td className="px-3 py-2 font-extrabold text-slate-900">
                          ₹{item.total.toLocaleString("en-IN")}
                        </td>
                        <td className="px-3 py-2 text-right text-[10px] text-slate-500 font-normal truncate max-w-[120px]">
                          {item.remarks || "Standard specification"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

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

            {/* SECTION 6: COMMENTS */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                Comments
              </h4>
              <div className="space-y-2">
                {selectedPR.comments.map((com) => (
                  <div key={com.id} className="rounded-xl border border-slate-200 bg-white p-3 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-500 font-semibold text-[11px]">
                      <span className="font-extrabold text-slate-800">{com.authorRole} ({com.authorName})</span>
                      <span>{com.timestamp}</span>
                    </div>
                    <p className="text-slate-700 font-medium">{com.commentText}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </Drawer>
      )}

      {/* CREATE / EDIT PURCHASE REQUISITION DRAWER (SAP FIORI / ENTERPRISE REDESIGN) */}
      <Drawer
        open={createModalOpen || !!editPR}
        onClose={() => {
          setCreateModalOpen(false);
          setEditPR(null);
        }}
        title={editPR ? `Edit Requisition: ${editPR.prNumber}` : "Create Purchase Requisition"}
        width="responsive"
        customHeader={
          <div className="flex flex-col gap-1 min-w-0">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight truncate">
              {editPR ? `Edit Requisition: ${editPR.prNumber}` : "Create Purchase Requisition"}
            </h2>
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Draft
              </span>
              <span className="text-slate-300">•</span>
              <span className="truncate">
                <strong className="text-slate-700 font-semibold">Department:</strong> {newDept || "Housekeeping"}
              </span>
              <span className="text-slate-300">•</span>
              <span className="truncate">
                <strong className="text-slate-700 font-semibold">Requester:</strong> {newRequester || "Amit Sharma"}
              </span>
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
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
              className="h-9 px-5 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer focus:ring-2 focus:ring-emerald-500"
            >
              Submit Requisition
            </Button>
          </div>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveRequisition(false);
          }}
          className="space-y-6 select-none pb-20 focus:outline-hidden"
        >
          {/* SECTION 1: BASIC INFORMATION CARD */}
          <div className="bg-white rounded-[12px] border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Basic Information
              </h4>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Section 1 of 4
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Department" required>
                <SelectInput
                  value={newDept}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewDept(e.target.value)}
                  className="h-9 text-xs focus:ring-2 focus:ring-emerald-500 border-slate-300 rounded-lg"
                >
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Kitchen">Kitchen (Food & Beverage)</option>
                </SelectInput>
              </FormField>

              <FormField label="Requester Name" required>
                <TextInput
                  value={newRequester}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRequester(e.target.value)}
                  className="h-9 text-xs focus:ring-2 focus:ring-emerald-500 border-slate-300 rounded-lg"
                />
              </FormField>

              <FormField label="Required Date" required>
                <TextInput
                  type="date"
                  value={newReqDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewReqDate(e.target.value)}
                  className="h-9 text-xs focus:ring-2 focus:ring-emerald-500 border-slate-300 rounded-lg"
                />
              </FormField>

              <FormField label="Priority" required>
                <SelectInput
                  value={newPriority}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewPriority(e.target.value as any)}
                  className="h-9 text-xs focus:ring-2 focus:ring-emerald-500 border-slate-300 rounded-lg"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Emergency">Emergency</option>
                </SelectInput>
              </FormField>

              <div className="md:col-span-2">
                <FormField label="Cost Center" required>
                  <SelectInput
                    value={newCostCenter}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewCostCenter(e.target.value)}
                    className="h-9 text-xs focus:ring-2 focus:ring-emerald-500 border-slate-300 rounded-lg"
                  >
                    <option value="CC-HK-LINEN">CC-HK-LINEN (Housekeeping Linen Dept)</option>
                    <option value="CC-ENG-HVAC">CC-ENG-HVAC (Engineering HVAC Maintenance)</option>
                    <option value="CC-FB-[#001]">CC-FB-[#001] (F&B Main Kitchen Operating)</option>
                  </SelectInput>
                </FormField>
              </div>
            </div>
          </div>

          {/* SECTION 2: REQUESTED ITEMS CARD */}
          <div className="bg-white rounded-[12px] border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Requested Items ({newItems.length})
                </h4>
              </div>
              <Button
                type="button"
                onClick={handleOpenInventoryModal}
                className="h-7 px-2.5 text-[10px] font-bold !bg-emerald-700 hover:!bg-emerald-800 text-white rounded-lg cursor-pointer flex items-center gap-1 shadow-xs"
              >
                + Add Item
              </Button>
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden sm:block rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="max-h-[280px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 z-10">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2 w-20 text-center">Qty</th>
                      <th className="px-3 py-2">Unit</th>
                      <th className="px-3 py-2">Est. Price</th>
                      <th className="px-3 py-2">Est. Total</th>
                      <th className="px-3 py-2">Remarks</th>
                      <th className="px-3 py-2 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {newItems.map((item) => {
                      const estTotal = item.quantity * item.estimatedPrice;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/60">
                          <td className="px-3 py-2 font-bold text-slate-900 min-w-[140px]">
                            {item.item}
                          </td>
                          <td className="px-3 py-2 text-slate-600 font-medium text-[11px] whitespace-nowrap">
                            {item.category || "—"}
                          </td>
                          <td className="px-2 py-1.5 w-20">
                            <TextInput
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                handleItemFieldChange(item.id, "quantity", e.target.value)
                              }
                              className="h-7 text-xs font-bold text-center border-slate-300"
                            />
                          </td>
                          <td className="px-3 py-2 text-slate-600 font-medium text-[11px] whitespace-nowrap">
                            {item.unit || "Pcs"}
                          </td>
                          <td className="px-3 py-2 text-slate-700 font-bold whitespace-nowrap">
                            ₹{item.estimatedPrice.toLocaleString("en-IN")}
                          </td>
                          <td className="px-3 py-2 font-extrabold text-emerald-800 whitespace-nowrap">
                            ₹{estTotal.toLocaleString("en-IN")}
                          </td>
                          <td className="px-2 py-1.5 min-w-[130px]">
                            <TextInput
                              value={item.remarks || ""}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                handleItemFieldChange(item.id, "remarks", e.target.value)
                              }
                              placeholder="Remarks"
                              className="h-7 text-[11px] border-slate-300"
                            />
                          </td>
                          <td className="px-3 py-2 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(item.id)}
                              disabled={newItems.length <= 1}
                              className={cn(
                                "p-1 rounded transition-colors cursor-pointer",
                                newItems.length <= 1
                                  ? "text-slate-300 cursor-not-allowed"
                                  : "text-slate-400 hover:text-red-600"
                              )}
                              title={newItems.length <= 1 ? "At least 1 item required" : "Delete row"}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MOBILE STACKED CARDS */}
            <div className="block sm:hidden space-y-2.5">
              {newItems.map((item) => {
                const estTotal = item.quantity * item.estimatedPrice;
                return (
                  <div key={item.id} className="p-3 rounded-lg border border-slate-200 bg-white space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{item.item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(item.id)}
                        disabled={newItems.length <= 1}
                        className={cn("text-slate-400 hover:text-red-600", newItems.length <= 1 && "opacity-30")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Qty ({item.unit})</span>
                        <TextInput
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleItemFieldChange(item.id, "quantity", e.target.value)
                          }
                          className="h-7 text-xs font-bold text-center border-slate-300"
                        />
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Est. Total</span>
                        <span className="font-extrabold text-emerald-800 text-xs block mt-1">
                          ₹{estTotal.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* HIGHLIGHTED ESTIMATED TOTAL SUMMARY CARD */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs">
              <span className="font-bold text-emerald-950">Estimated Total</span>
              <span className="font-extrabold text-emerald-900 text-base">
                ₹{newItems.reduce((acc, i) => acc + i.quantity * i.estimatedPrice, 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* SECTION 3: BUSINESS JUSTIFICATION CARD */}
          <div className="bg-white rounded-[12px] border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Business Justification
              </h4>
            </div>
            <FormField label="Reason for Request" required>
              <TextAreaInput
                rows={3}
                value={newJustification}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewJustification(e.target.value)}
                placeholder="Explain why this purchase is required..."
                className="w-full h-20 p-3 text-xs leading-relaxed text-slate-900 placeholder:text-slate-400 rounded-lg border border-slate-300 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
              />
            </FormField>
            <p className="text-[10px] text-slate-500 font-medium">
              Explain why this purchase is required and the business impact if delayed.
            </p>
          </div>

          {/* SECTION 4: ATTACHMENTS CARD */}
          <div className="bg-white rounded-[12px] border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Attachments ({formAttachments.length})
                </h4>
              </div>
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAttachments}
                className="h-7 px-2.5 text-[10px] font-bold !bg-emerald-700 hover:!bg-emerald-800 text-white rounded-lg cursor-pointer flex items-center gap-1 shadow-xs disabled:opacity-60"
              >
                <Plus className="h-3 w-3" /> {uploadingAttachments ? "Uploading…" : "Add Attachment"}
              </Button>
            </div>

            {formAttachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formAttachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {renderFileIcon(att.fileType)}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate" title={att.fileName}>
                          {att.fileName}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {att.fileSize} • {att.uploadedBy}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handlePreviewAttachment(att)}
                        className="px-2 py-0.5 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="px-2 py-0.5 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-center text-xs space-y-1 cursor-pointer hover:bg-slate-50"
              >
                <Paperclip className="h-5 w-5 mx-auto text-slate-400" />
                <p className="font-bold text-slate-700">No attachments added.</p>
                <p className="text-[10px] text-slate-400 font-medium">
                  Click "+ Add Attachment" to attach supporting documents.
                </p>
              </div>
            )}
          </div>
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
                  <th className="px-3 py-2 text-right">Est. Price</th>
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
                        <td className="px-3 py-2.5 text-right font-extrabold text-emerald-800">
                          ₹{catalogItem.estimatedPrice.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-medium">
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
