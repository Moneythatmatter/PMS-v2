"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Search,
  Plus,
  X,
  ShieldAlert,
  Wrench,
  ChevronRight,
  Trash2,
  CheckCircle2,
  Clock,
  DoorClosed,
  AlertTriangle,
  UserCheck,
  Check,
  ArrowUpRight,
  Inbox,
  Filter,
  SlidersHorizontal,
  MoreHorizontal,
  Download,
  Eye,
  FileText,
  Building2,
  Layers,
  ExternalLink,
  Upload,
  Paperclip,
  File,
  PlusCircle,
  Info,
  Sparkles,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Badge, Button, Card, Drawer, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  MOCK_MAINTENANCE_REQUESTS,
  MOCK_ACTIVE_WORK_ORDERS,
  HOTEL_LOCATIONS,
  PROBLEM_CATEGORIES,
} from "@/app/data/maintenance/mockData";
import {
  MaintenanceRequest,
  PriorityLevel,
  EntryPreference,
  ExecutionMethod,
  SnagIssue,
  WorkOrder,
  ProblemConfirmation,
  RequiredMaterialItem,
} from "@/app/data/maintenance/types";
import { currentUser } from "@/app/data/user";

export const getStatusBadgeConfig = (status: string) => {
  switch (status) {
    case "New":
      return {
        bg: "bg-slate-100 text-slate-700",
        border: "border-slate-200/90",
        dot: "bg-slate-400",
        label: "New",
      };
    case "Verification":
      return {
        bg: "bg-amber-50 text-amber-800",
        border: "border-amber-200",
        dot: "bg-amber-500 animate-pulse",
        label: "Verification",
      };
    case "Verified":
      return {
        bg: "bg-sky-50 text-sky-800",
        border: "border-sky-200",
        dot: "bg-sky-500",
        label: "Verified",
      };
    case "Approved":
      return {
        bg: "bg-emerald-50 text-emerald-800",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
        label: "Approved",
      };
    case "Work Order Created":
      return {
        bg: "bg-teal-50 text-teal-800",
        border: "border-teal-200",
        dot: "bg-teal-500",
        label: "Work Order Created",
      };
    case "Closed":
    case "Resolved":
      return {
        bg: "bg-slate-100 text-slate-600",
        border: "border-slate-200",
        dot: "bg-slate-400",
        label: status,
      };
    case "Cancelled":
    case "Rejected":
      return {
        bg: "bg-rose-50 text-rose-700",
        border: "border-rose-200",
        dot: "bg-rose-500",
        label: status,
      };
    default:
      return {
        bg: "bg-slate-100 text-slate-700",
        border: "border-slate-200",
        dot: "bg-slate-400",
        label: status,
      };
  }
};

export function MaintenanceRequestsView() {
  const router = useRouter();
  const [requests, setRequests] = useState<MaintenanceRequest[]>(MOCK_MAINTENANCE_REQUESTS);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(MOCK_ACTIVE_WORK_ORDERS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>("ALL");
  const [selectedLocationType, setSelectedLocationType] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedPriority, setSelectedPriority] = useState<string>("ALL");
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);

  // Multi-Selection State (Front Office Style)
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);

  // Close context menu on outside click or escape
  useEffect(() => {
    if (!openMenuId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenuId]);

  // Pagination State
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Drawer / Modal States
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);

  // Verification Form Modal State
  const [verifyTargetRequest, setVerifyTargetRequest] = useState<MaintenanceRequest | null>(null);
  const [vfProblemConfirmed, setVfProblemConfirmed] = useState<ProblemConfirmation>("Yes");
  const [vfFindings, setVfFindings] = useState("");
  const [vfRecommendedWork, setVfRecommendedWork] = useState("");
  const [vfRequiredMaterials, setVfRequiredMaterials] = useState("");
  const [vfMaterialsList, setVfMaterialsList] = useState<RequiredMaterialItem[]>([]);
  const [vfMaterialInputName, setVfMaterialInputName] = useState("");
  const [vfMaterialInputQty, setVfMaterialInputQty] = useState<number>(1);
  const [vfMaterialInputUnit, setVfMaterialInputUnit] = useState<string>("pcs");
  const [vfEstimatedBudget, setVfEstimatedBudget] = useState<number | "">("");
  const [vfExecutionMethod, setVfExecutionMethod] = useState<ExecutionMethod>("In-House");
  const [vfNotes, setVfNotes] = useState("");
  const [vfAttachmentName, setVfAttachmentName] = useState<string | null>(null);

  // Cancel Request Modal
  const [cancelTargetRequest, setCancelTargetRequest] = useState<MaintenanceRequest | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Create Request Form State (Form 1)
  const [createLocationType, setCreateLocationType] = useState<"Guest Room" | "F&B Area" | "Public Area" | "Back of House">("Guest Room");
  const [createLocation, setCreateLocation] = useState<string>("");
  const [createCategory, setCreateCategory] = useState<string>("");
  const [createPriorityVal, setCreatePriorityVal] = useState<PriorityLevel>("Medium");
  const [createIsSafetyHazard, setCreateIsSafetyHazard] = useState<boolean>(false);
  const [createIssueTitle, setCreateIssueTitle] = useState<string>("");
  const [createDescription, setCreateDescription] = useState<string>("");
  const [createGuestInRoom, setCreateGuestInRoom] = useState<"Yes" | "No" | "Unknown">("No");
  const [createEntryPreference, setCreateEntryPreference] = useState<EntryPreference>("Call Guest First");
  const [createAttachmentName, setCreateAttachmentName] = useState<string | null>(null);
  const [createSnagIssues, setCreateSnagIssues] = useState<SnagIssue[]>([]);
  const [snagInputTitle, setSnagInputTitle] = useState<string>("");

  // ─────────────────────────────────────────────────────────────
  // 1. KPI SUMMARY METRICS (MATCHING SALES & MARKETING DESIGN)
  // ─────────────────────────────────────────────────────────────
  const summaryMetrics = useMemo(() => {
    const total = requests.length;
    const pendingVerification = requests.filter((r) => r.status === "New" || r.status === "Verification").length;
    const verifiedReady = requests.filter((r) => r.status === "Verified").length;
    const activeWorkOrders = requests.filter((r) => r.status === "Work Order Created" || r.status === "Approved").length;

    return {
      total,
      pendingVerification,
      verifiedReady,
      activeWorkOrders,
    };
  }, [requests]);

  // ─────────────────────────────────────────────────────────────
  // 2. FILTERING LOGIC
  // ─────────────────────────────────────────────────────────────
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Status Tab Filter
      if (selectedStatusTab !== "ALL") {
        if (selectedStatusTab === "Open" && !(req.status === "New" || req.status === "Verification" || req.status === "In Review")) return false;
        if (selectedStatusTab === "Verified" && req.status !== "Verified") return false;
        if (selectedStatusTab === "Approved" && !(req.status === "Approved" || req.status === "Work Order Created")) return false;
        if (selectedStatusTab === "Closed" && !(req.status === "Closed" || req.status === "Resolved" || req.status === "Cancelled" || req.status === "Rejected")) return false;
      }

      // Priority Filter
      if (selectedPriority === "SAFETY_HAZARD") {
        if (!req.isSafetyHazard) return false;
      } else if (selectedPriority !== "ALL" && req.priority !== selectedPriority) {
        return false;
      }

      // Location Type Filter
      if (selectedLocationType !== "ALL" && req.locationType !== selectedLocationType) {
        return false;
      }

      // Category Filter
      if (selectedCategory !== "ALL" && req.category !== selectedCategory) {
        return false;
      }

      // Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchReqNo = req.requestNo.toLowerCase().includes(q);
        const matchLoc = req.location.toLowerCase().includes(q);
        const matchIssue = req.issueTitle.toLowerCase().includes(q);
        const matchDesc = req.description.toLowerCase().includes(q);
        const matchReporter = req.reportedBy.toLowerCase().includes(q);
        const matchWO = req.workOrderNo ? req.workOrderNo.toLowerCase().includes(q) : false;

        if (!matchReqNo && !matchLoc && !matchIssue && !matchDesc && !matchReporter && !matchWO) {
          return false;
        }
      }

      return true;
    });
  }, [requests, selectedStatusTab, selectedPriority, selectedLocationType, selectedCategory, searchTerm]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRequests.slice(startIndex, startIndex + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  // Selection helpers (Front Office style)
  const allSelected =
    paginatedRequests.length > 0 && paginatedRequests.every((r) => selectedRowIds.has(r.id));

  const toggleAllSelected = () => {
    setSelectedRowIds(allSelected ? new Set() : new Set(paginatedRequests.map((r) => r.id)));
  };

  const toggleOneSelected = (id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportSelected = () => {
    const targets = requests.filter((r) =>
      selectedRowIds.size > 0 ? selectedRowIds.has(r.id) : true
    );
    const headers = ["Request No", "Location", "Location Type", "Issue", "Category", "Priority", "Status", "Reported By", "Created Time", "Work Order"];
    const rows = targets.map((r) => [
      r.requestNo,
      `"${r.location.replace(/"/g, '""')}"`,
      r.locationType,
      `"${r.issueTitle.replace(/"/g, '""')}"`,
      r.category,
      r.priority,
      r.status,
      r.reportedBy,
      r.dateTime,
      r.workOrderNo || "None",
    ]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `maintenance_requests_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMessage(`✓ Exported ${targets.length} maintenance requests to CSV.`);
  };

  const hasActiveAdvancedFilters = selectedPriority !== "ALL" || selectedLocationType !== "ALL" || selectedCategory !== "ALL";

  const clearAdvancedFilters = () => {
    setSelectedPriority("ALL");
    setSelectedLocationType("ALL");
    setSelectedCategory("ALL");
    setCurrentPage(1);
  };

  // ─────────────────────────────────────────────────────────────
  // 3. CREATE REQUEST HANDLERS (FORM 1)
  // ─────────────────────────────────────────────────────────────
  const handleOpenCreateDrawer = () => {
    setCreateLocationType("Guest Room");
    setCreateLocation("");
    setCreateCategory("");
    setCreatePriorityVal("Medium");
    setCreateIsSafetyHazard(false);
    setCreateIssueTitle("");
    setCreateDescription("");
    setCreateGuestInRoom("No");
    setCreateEntryPreference("Call Guest First");
    setCreateAttachmentName(null);
    setCreateSnagIssues([]);
    setSnagInputTitle("");
    setIsCreateDrawerOpen(true);
  };

  const handleAddSnagIssue = () => {
    if (!snagInputTitle.trim()) return;
    const newSnag: SnagIssue = {
      id: `snag-${Date.now()}`,
      category: createCategory || "General",
      issue: snagInputTitle.trim(),
      priority: createPriorityVal,
      isResolved: false,
    };
    setCreateSnagIssues((prev) => [...prev, newSnag]);
    setSnagInputTitle("");
  };

  const handleRemoveSnagIssue = (id: string) => {
    setCreateSnagIssues((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSaveNewRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createIssueTitle.trim()) return;

    const newReqNumber = `REQ-${1010 + requests.length + 1}`;
    const newRequest: MaintenanceRequest = {
      id: `req-${Date.now()}`,
      requestNo: newReqNumber,
      dateTime: "Just now",
      locationType: createLocationType,
      location: createLocation.trim() || (createLocationType === "Guest Room" ? "Room 101" : "Main Lobby"),
      category: createCategory || "HVAC / Air Conditioning",
      issueTitle: createIssueTitle.trim(),
      description: createDescription.trim(),
      snagIssues: createSnagIssues.length > 0 ? createSnagIssues : undefined,
      reportedBy: currentUser.name || "Duty Manager",
      reportedDept: "Front Office / Housekeeping",
      priority: createPriorityVal,
      isSafetyHazard: createIsSafetyHazard,
      guestInRoom: createLocationType === "Guest Room" ? createGuestInRoom : "No",
      entryPreference: createLocationType === "Guest Room" ? createEntryPreference : "Coordinate with Duty Manager",
      attachmentName: createAttachmentName || undefined,
      status: "New",
      createdAt: new Date().toISOString(),
      timeline: [
        { time: "Just now", action: `Maintenance Request #${newReqNumber} Logged`, user: currentUser.name },
      ],
    };

    setRequests((prev) => [newRequest, ...prev]);
    setIsCreateDrawerOpen(false);
    setToastMessage(`✓ Request #${newReqNumber} created successfully and queued for verification.`);
  };

  // ─────────────────────────────────────────────────────────────
  // 4. PHYSICAL VERIFICATION HANDLERS (FORM 2)
  // ─────────────────────────────────────────────────────────────
  const handleOpenVerifyModal = (req: MaintenanceRequest) => {
    setVerifyTargetRequest(req);
    const existingProblemConfirmed = req.verification?.problemConfirmed;
    setVfProblemConfirmed(
      typeof existingProblemConfirmed === "boolean"
        ? existingProblemConfirmed
          ? "Yes"
          : "No"
        : existingProblemConfirmed || "Yes"
    );
    setVfFindings(req.verification?.findings || "");
    setVfRecommendedWork(req.verification?.recommendedWork || "");
    setVfRequiredMaterials(req.verification?.requiredMaterials || "");
    setVfMaterialsList(req.verification?.materialsList || []);
    setVfMaterialInputName("");
    setVfMaterialInputQty(1);
    setVfMaterialInputUnit("pcs");
    setVfEstimatedBudget(req.verification?.estimatedBudget !== undefined ? req.verification.estimatedBudget : "");
    setVfExecutionMethod(req.verification?.executionMethod || "In-House");
    setVfNotes(req.verification?.notes || "");
    setVfAttachmentName(req.verification?.attachmentName || null);
  };

  const handleAddVerificationMaterial = () => {
    if (!vfMaterialInputName.trim()) return;
    const newItem: RequiredMaterialItem = {
      id: `mat-${Date.now()}`,
      itemName: vfMaterialInputName.trim(),
      quantity: vfMaterialInputQty || 1,
      unit: vfMaterialInputUnit || "pcs",
    };
    setVfMaterialsList((prev) => [...prev, newItem]);
    setVfMaterialInputName("");
    setVfMaterialInputQty(1);
    setVfMaterialInputUnit("pcs");
  };

  const handleRemoveVerificationMaterial = (id: string) => {
    setVfMaterialsList((prev) => prev.filter((m) => m.id !== id));
  };

  const handleSaveVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyTargetRequest || !vfFindings.trim() || !vfRecommendedWork.trim()) return;

    const materialsSummary = vfMaterialsList.length > 0
      ? vfMaterialsList.map((m) => `${m.itemName} (${m.quantity} ${m.unit || "pcs"})`).join(", ")
      : vfRequiredMaterials.trim();

    const numericBudget = typeof vfEstimatedBudget === "number" ? vfEstimatedBudget : 0;

    const updated: MaintenanceRequest = {
      ...verifyTargetRequest,
      status: "Verified",
      verification: {
        problemConfirmed: vfProblemConfirmed,
        findings: vfFindings.trim(),
        recommendedWork: vfRecommendedWork.trim(),
        requiredMaterials: materialsSummary || undefined,
        materialsList: vfMaterialsList.length > 0 ? vfMaterialsList : undefined,
        estimatedBudget: numericBudget,
        executionMethod: vfExecutionMethod,
        notes: vfNotes.trim() || undefined,
        attachmentName: vfAttachmentName || undefined,
        verifiedBy: `${currentUser.name} (Engineering)`,
        verifiedAt: "Just now",
      },
      timeline: [
        ...(verifyTargetRequest.timeline || []),
        {
          time: "Just now",
          action: `Physical Verification Completed (${vfExecutionMethod} / ₹${numericBudget.toLocaleString()})`,
          user: currentUser.name,
        },
      ],
    };

    setRequests((prev) => prev.map((item) => (item.id === verifyTargetRequest.id ? updated : item)));
    if (selectedRequest?.id === verifyTargetRequest.id) setSelectedRequest(updated);
    setVerifyTargetRequest(null);
    setToastMessage(`✓ Request #${verifyTargetRequest.requestNo} verified. Ready for Approval.`);
  };

  // ─────────────────────────────────────────────────────────────
  // 5. APPROVAL & WORK ORDER CREATION HANDLER
  // ─────────────────────────────────────────────────────────────
  const handleApproveAndCreateWO = (req: MaintenanceRequest) => {
    const generatedWoNumber = `WO-${120 + workOrders.length + 1}`;

    const newWorkOrder: WorkOrder = {
      id: `wo-${Date.now()}`,
      woNumber: generatedWoNumber,
      requestRef: req.requestNo,
      woType: req.isSafetyHazard || req.priority === "Critical" ? "Emergency" : "Corrective",
      location: req.location,
      locationType: req.locationType,
      issue: req.issueTitle,
      description: req.verification?.recommendedWork || req.description,
      priority: req.priority,
      isSafetyHazard: req.isSafetyHazard,
      guestInRoom: req.guestInRoom,
      entryPreference: req.entryPreference,
      assignedType: req.verification?.executionMethod === "Outsource" ? "External Vendor" : "In-House Staff",
      technicianName: req.verification?.executionMethod === "Outsource" ? "Pending Vendor Selection" : "Unassigned Staff",
      dueDate: "Today, 04:00 PM",
      status: "Assigned",
      rootCause: req.verification?.findings,
      partsCost: 0,
      externalServiceCost: req.verification?.executionMethod === "Outsource" ? req.verification.estimatedBudget || 0 : 0,
      totalCost: req.verification?.estimatedBudget || 0,
      checklistItems: req.snagIssues
        ? req.snagIssues.map((s) => ({ id: s.id, description: s.issue, completed: false }))
        : [{ id: "c1", description: req.verification?.recommendedWork || req.issueTitle, completed: false }],
      timeline: [
        { time: "Just now", action: `Work Order #${generatedWoNumber} Generated from Request #${req.requestNo}`, user: currentUser.name },
      ],
    };

    const updatedRequest: MaintenanceRequest = {
      ...req,
      status: "Work Order Created",
      workOrderNo: generatedWoNumber,
      approvedBy: `${currentUser.name} (Engineering)`,
      approvedAt: "Just now",
      timeline: [
        ...(req.timeline || []),
        { time: "Just now", action: `Approved & Work Order #${generatedWoNumber} Created`, user: currentUser.name },
      ],
    };

    setWorkOrders((prev) => [newWorkOrder, ...prev]);
    setRequests((prev) => prev.map((item) => (item.id === req.id ? updatedRequest : item)));
    if (selectedRequest?.id === req.id) setSelectedRequest(updatedRequest);

    setToastMessage(`✓ Request #${req.requestNo} Approved! Work Order #${generatedWoNumber} generated.`);
  };

  // ─────────────────────────────────────────────────────────────
  // 6. CANCELLATION HANDLER
  // ─────────────────────────────────────────────────────────────
  const handleOpenCancelModal = (req: MaintenanceRequest) => {
    setCancelTargetRequest(req);
    setCancelReason("");
    setCancelError(null);

    if (req.workOrderNo) {
      const linkedWO = workOrders.find((w) => w.woNumber === req.workOrderNo);
      if (linkedWO && (linkedWO.status === "In Progress" || linkedWO.status === "Awaiting Parts")) {
        setCancelError(
          `This request is linked to Work Order #${linkedWO.woNumber}, which is currently "${linkedWO.status}". Cancel or stop the Work Order on the Work Orders page first.`
        );
      }
    }
  };

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTargetRequest || cancelError || !cancelReason.trim()) return;

    const updatedRequest: MaintenanceRequest = {
      ...cancelTargetRequest,
      status: "Cancelled",
      cancellationReason: cancelReason.trim(),
      timeline: [
        ...(cancelTargetRequest.timeline || []),
        { time: "Just now", action: `Request Cancelled: ${cancelReason.trim()}`, user: currentUser.name },
      ],
    };

    if (cancelTargetRequest.workOrderNo) {
      setWorkOrders((prev) =>
        prev.map((w) =>
          w.woNumber === cancelTargetRequest.workOrderNo && w.status === "Assigned"
            ? {
                ...w,
                status: "Cancelled",
                cancelReason: `Parent Request #${cancelTargetRequest.requestNo} was cancelled: ${cancelReason.trim()}`,
              }
            : w
        )
      );
    }

    setRequests((prev) => prev.map((item) => (item.id === cancelTargetRequest.id ? updatedRequest : item)));
    if (selectedRequest?.id === cancelTargetRequest.id) setSelectedRequest(updatedRequest);
    setCancelTargetRequest(null);
    setToastMessage(`Request #${cancelTargetRequest.requestNo} cancelled.`);
  };

  return (
    <ModulePageShell
      eyebrow="Maintenance & Engineering"
      title="Maintenance Requests"
      description="Report, verify, approve, and convert maintenance issues into Work Orders."
      breadcrumbs={[
        { label: "Maintenance", href: "/maintenance" },
        { label: "Requests" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <Button
          type="button"
          size="sm"
          onClick={handleOpenCreateDrawer}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 h-9 px-3.5"
        >
          <Plus className="h-4 w-4" /> + New Request
        </Button>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: OPERATIONAL KPI CARDS (MATCHING SALES & MARKETING)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5 mb-5">
        {/* Card 1: Total Requests */}
        <Card className="h-full min-w-0 p-3 sm:p-4.5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Total Requests
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-8 sm:w-8">
              <ClipboardList className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {summaryMetrics.total}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            All logged maintenance tickets
          </p>
        </Card>

        {/* Card 2: Pending Verification */}
        <Card className="h-full min-w-0 p-3 sm:p-4.5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Pending Verification
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 sm:h-8 sm:w-8">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {summaryMetrics.pendingVerification}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            Awaiting physical check
          </p>
        </Card>

        {/* Card 3: Verified / Ready */}
        <Card className="h-full min-w-0 p-3 sm:p-4.5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Verified / Ready
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-8 sm:w-8">
              <UserCheck className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {summaryMetrics.verifiedReady}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            Ready for Work Order approval
          </p>
        </Card>

        {/* Card 4: Active Work Orders */}
        <Card className="h-full min-w-0 p-3 sm:p-4.5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Active Work Orders
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 sm:h-8 sm:w-8">
              <Wrench className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {summaryMetrics.activeWorkOrders}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            Dispatched to Engineering
          </p>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: FRONT OFFICE INSPIRED SEARCH TOOLBAR & FILTER PILLS
      ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 mb-5">
        {/* Top Search Input + Filters Action Button */}
        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          <div className="relative h-10 min-w-0 flex-1 basis-full sm:basis-auto">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search request#, room, location, issue, reporter..."
              className="h-10 w-full rounded-full border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-10 shrink-0 gap-1.5 rounded-full px-4 text-xs font-semibold cursor-pointer",
              filtersOpen && "border-emerald-300 bg-emerald-50 text-emerald-800"
            )}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Filter Pills Row */}
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {[
            { id: "ALL", label: "All", count: requests.length },
            {
              id: "Open",
              label: "Open",
              count: requests.filter((r) => r.status === "New" || r.status === "Verification" || r.status === "In Review").length,
            },
            {
              id: "Verified",
              label: "Verified",
              count: requests.filter((r) => r.status === "Verified").length,
            },
            {
              id: "Approved",
              label: "Approved",
              count: requests.filter((r) => r.status === "Approved" || r.status === "Work Order Created").length,
            },
            {
              id: "Closed",
              label: "Closed",
              count: requests.filter((r) => r.status === "Closed" || r.status === "Resolved" || r.status === "Cancelled" || r.status === "Rejected").length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSelectedStatusTab(tab.id);
                setCurrentPage(1);
              }}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                selectedStatusTab === tab.id
                  ? "border-emerald-800 bg-emerald-800 text-white shadow-xs"
                  : "border-slate-200 bg-white text-slate-700 shadow-2xs hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {tab.label} {tab.count}
            </button>
          ))}
        </div>

        {/* Expandable Advanced Filters Panel */}
        {filtersOpen && (
          <div className="mt-3 flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Advanced Filters
              </p>
              {hasActiveAdvancedFilters && (
                <button
                  type="button"
                  onClick={clearAdvancedFilters}
                  className="text-xs font-medium text-emerald-700 hover:underline cursor-pointer"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Priority</label>
                <select
                  value={selectedPriority}
                  onChange={(e) => {
                    setSelectedPriority(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 w-full px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="Critical">Critical Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                  <option value="SAFETY_HAZARD">Safety Hazards Only</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Location Area</label>
                <select
                  value={selectedLocationType}
                  onChange={(e) => {
                    setSelectedLocationType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 w-full px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Locations</option>
                  <option value="Guest Room">Guest Rooms</option>
                  <option value="F&B Area">F&B Areas</option>
                  <option value="Public Area">Public Areas</option>
                  <option value="Back of House">Back of House</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Problem Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 w-full px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  {PROBLEM_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Selection Bulk Action Bar */}
        {selectedRowIds.size > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3 border border-emerald-200/80">
            <span className="text-sm font-medium text-emerald-900">
              {selectedRowIds.size} request{selectedRowIds.size !== 1 ? "s" : ""} selected
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 bg-white text-xs"
                onClick={handleExportSelected}
              >
                <Download className="h-3.5 w-3.5" />
                Export Selected
              </Button>
              <button
                type="button"
                className="text-xs font-medium text-emerald-700 hover:underline cursor-pointer"
                onClick={() => setSelectedRowIds(new Set())}
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: FRONT OFFICE INSPIRED REQUESTS DATA TABLE & MOBILE CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {paginatedRequests.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <div className="max-w-xs mx-auto space-y-2">
              <ClipboardList className="h-8 w-8 mx-auto text-slate-300" />
              <strong className="text-sm font-bold text-slate-800 block">No maintenance requests found</strong>
              <p className="text-xs text-slate-400">
                {searchTerm || selectedStatusTab !== "ALL" || selectedPriority !== "ALL" || selectedLocationType !== "ALL"
                  ? "No records match your active search or filters."
                  : "No requests reported yet. Click 'New Request' to log a maintenance ticket."}
              </p>
              {(searchTerm || selectedStatusTab !== "ALL" || selectedPriority !== "ALL" || selectedLocationType !== "ALL" || selectedCategory !== "ALL") && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedStatusTab("ALL");
                    setSelectedPriority("ALL");
                    setSelectedLocationType("ALL");
                    setSelectedCategory("ALL");
                    setCurrentPage(1);
                  }}
                  className="text-xs font-semibold rounded-full mt-2 cursor-pointer"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Cards List (Front Office Style) */}
            <div className="space-y-0 divide-y divide-slate-100 md:hidden">
              {paginatedRequests.map((req) => {
                return (
                  <div
                    key={req.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedRequest(req)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedRequest(req);
                      }
                    }}
                    className="cursor-pointer p-4 transition-colors hover:bg-emerald-50/40 active:bg-emerald-50/60"
                  >
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-900">#{req.requestNo}</p>
                            <p className="text-xs text-slate-500">
                              By {req.reportedBy} · {req.reportedDept}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "inline-flex items-center justify-center min-w-[85px] rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset text-center",
                              req.status === "Approved" || req.status === "Work Order Created"
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                : req.status === "Verified"
                                ? "bg-sky-50 text-sky-700 ring-sky-200"
                                : req.status === "Verification"
                                ? "bg-amber-50 text-amber-700 ring-amber-200"
                                : req.status === "New"
                                ? "bg-slate-100 text-slate-700 ring-slate-200"
                                : req.status === "Closed" || req.status === "Resolved"
                                ? "bg-slate-100 text-slate-600 ring-slate-200"
                                : "bg-red-50 text-red-700 ring-red-200"
                            )}
                          >
                            {req.status === "Work Order Created" ? "WO Created" : req.status}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs font-medium text-slate-800 line-clamp-1">
                          {req.issueTitle}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px]">
                            <Building2 className="h-3 w-3 text-slate-400" />
                            {req.location}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px]">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {req.dateTime}
                          </span>
                          {req.workOrderNo && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-mono text-emerald-700 font-semibold">
                              #{req.workOrderNo}
                            </span>
                          )}
                        </div>
                      </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (Front Office Style) */}
            <div className="hidden min-h-[300px] overflow-x-auto md:block">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAllSelected}
                        className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-500 cursor-pointer"
                        aria-label="Select all"
                      />
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Request
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Location
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Issue
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Created
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Priority
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="w-28 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedRequests.map((req, idx) => {
                    const isNearBottom = idx >= Math.max(0, paginatedRequests.length - 2);
                    const isMenuOpen = openMenuId === req.id;

                    return (
                      <tr
                        key={req.id}
                        onClick={() => setSelectedRequest(req)}
                        className="group cursor-pointer transition-colors hover:bg-emerald-50/30"
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedRowIds.has(req.id)}
                            onChange={() => toggleOneSelected(req.id)}
                            className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-500 cursor-pointer"
                            aria-label={`Select ${req.requestNo}`}
                          />
                        </td>

                        {/* 1. Request Info */}
                        <td className="px-4 py-3.5">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">#{req.requestNo}</p>
                            <p className="text-xs text-slate-500">
                              By {req.reportedBy}
                            </p>
                            <p className="text-[11px] text-slate-400">{req.reportedDept}</p>
                          </div>
                        </td>

                        {/* 2. Location (Front Office Stay style) */}
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-slate-900">
                            {req.location}
                          </p>
                          <p className="text-xs text-slate-500">
                            {req.locationType}
                          </p>
                        </td>

                        {/* 3. Issue Summary */}
                        <td className="px-4 py-3.5 max-w-[280px]">
                          <p className="font-medium text-slate-900 line-clamp-1" title={req.issueTitle}>
                            {req.issueTitle}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs text-slate-500">{req.category}</span>
                            {req.snagIssues && req.snagIssues.length > 0 && (
                              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 border border-slate-200/60">
                                {req.snagIssues.length} snags
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 4. Created */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className="text-sm text-slate-800">{req.dateTime}</p>
                        </td>

                        {/* 5. Priority / Safety Hazard */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-start">
                            {req.priority === "Critical" ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
                                Critical
                              </span>
                            ) : req.priority === "High" ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                High
                              </span>
                            ) : req.priority === "Medium" ? (
                              <span className="text-xs font-medium text-slate-700">Medium</span>
                            ) : (
                              <span className="text-xs font-normal text-slate-400">Low</span>
                            )}

                            {req.isSafetyHazard && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200/80 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                                <ShieldAlert className="h-3 w-3 text-rose-600" />
                                Safety Hazard
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 6. Status (Uniform Ring Pill Style) */}
                        <td className="w-36 px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={cn(
                              "inline-flex items-center justify-center min-w-[96px] rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset text-center",
                              req.status === "Approved" || req.status === "Work Order Created"
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                : req.status === "Verified"
                                ? "bg-sky-50 text-sky-700 ring-sky-200"
                                : req.status === "Verification"
                                ? "bg-amber-50 text-amber-700 ring-amber-200"
                                : req.status === "New"
                                ? "bg-slate-100 text-slate-700 ring-slate-200"
                                : req.status === "Closed" || req.status === "Resolved"
                                ? "bg-slate-100 text-slate-600 ring-slate-200"
                                : "bg-red-50 text-red-700 ring-red-200"
                            )}
                          >
                            {req.status === "Work Order Created" ? "WO Created" : req.status}
                          </span>
                          {req.workOrderNo && (
                            <Link
                              href="/maintenance/work-orders"
                              onClick={(e) => e.stopPropagation()}
                              className="block text-[11px] text-slate-500 hover:text-slate-800 hover:underline mt-1 font-normal text-center"
                            >
                              WO #{req.workOrderNo}
                            </Link>
                          )}
                        </td>

                        {/* 7. Action Triggers & Dropdown Context Menu */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {/* Primary Action Button mapped to 4-tier lifecycle */}
                            {req.status === "New" || req.status === "Verification" || req.status === "In Review" ? (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleOpenVerifyModal(req)}
                                className="h-7 px-2.5 text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 rounded-lg cursor-pointer flex items-center gap-1"
                              >
                                <Wrench className="h-3 w-3" /> Verify
                              </Button>
                            ) : req.status === "Verified" ? (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleApproveAndCreateWO(req)}
                                className="h-7 px-2.5 text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 rounded-lg cursor-pointer flex items-center gap-1"
                              >
                                <Check className="h-3 w-3" /> Approve
                              </Button>
                            ) : req.status === "Approved" || req.status === "Work Order Created" || req.workOrderNo ? (
                              <Link href="/maintenance/work-orders">
                                <span className="inline-flex items-center gap-1 rounded-lg bg-teal-50 border border-teal-200 px-2 py-1 text-[11px] font-bold text-teal-800 hover:bg-teal-100">
                                  <Wrench className="h-3 w-3" /> WO Created
                                </span>
                              </Link>
                            ) : (
                              <span className="text-[11px] font-medium text-slate-400">Completed</span>
                            )}

                            {/* Context Menu (3-dots) */}
                            <div
                              className="relative"
                              ref={isMenuOpen ? menuContainerRef : undefined}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenMenuId(isMenuOpen ? null : req.id)
                                }
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                                aria-label="More actions"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>

                              {isMenuOpen && (
                                <div
                                  className={cn(
                                    "absolute right-0 z-30 w-44 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg text-left",
                                    isNearBottom ? "bottom-full mb-1" : "top-full mt-1"
                                  )}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedRequest(req);
                                      setOpenMenuId(null);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                                  >
                                    <Eye className="h-3.5 w-3.5 text-slate-400" />
                                    View Details
                                  </button>

                                  {(req.status === "New" || req.status === "Verification") && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleOpenVerifyModal(req);
                                        setOpenMenuId(null);
                                      }}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 cursor-pointer"
                                    >
                                      <Wrench className="h-3.5 w-3.5 text-amber-600" />
                                      Physical Verification
                                    </button>
                                  )}

                                  {req.status === "Verified" && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleApproveAndCreateWO(req);
                                        setOpenMenuId(null);
                                      }}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                                    >
                                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                                      Approve & Create WO
                                    </button>
                                  )}

                                  {req.workOrderNo && (
                                    <Link
                                      href="/maintenance/work-orders"
                                      onClick={() => setOpenMenuId(null)}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-teal-700 hover:bg-teal-50"
                                    >
                                      <ArrowUpRight className="h-3.5 w-3.5 text-teal-600" />
                                      Open Work Order
                                    </Link>
                                  )}

                                  {req.status !== "Closed" && req.status !== "Cancelled" && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleOpenCancelModal(req);
                                        setOpenMenuId(null);
                                      }}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer border-t border-slate-100 mt-1 pt-1.5"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                      Cancel Request
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ─────────────────────────────────────────────────────────────
            SECTION 4: COMPACT PAGINATION FOOTER
        ───────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border-t border-slate-100 text-xs text-slate-600 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="p-1 rounded border border-slate-200 bg-white font-medium text-xs focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-slate-400 pl-2">
              Showing {filteredRequests.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, filteredRequests.length)} of {filteredRequests.length} requests
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="text-xs font-semibold h-7 px-2.5 rounded-lg"
            >
              Previous
            </Button>
            <span className="text-xs font-bold text-slate-800 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="text-xs font-semibold h-7 px-2.5 rounded-lg"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: CREATE REQUEST SLIDE-OUT DRAWER
      ───────────────────────────────────────────────────────────── */}
      {isCreateDrawerOpen && (
        <Drawer
          isOpen={isCreateDrawerOpen}
          onClose={() => setIsCreateDrawerOpen(false)}
          title="New Maintenance Request"
          maxWidth="md"
        >
          <form onSubmit={handleSaveNewRequest} className="space-y-4 p-1 text-xs">
            {/* Location Type & Specific Location */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Location Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={createLocationType}
                  onChange={(e) => {
                    const nextType = e.target.value as any;
                    setCreateLocationType(nextType);
                    const defaultLoc = HOTEL_LOCATIONS.find((l) => l.type === nextType)?.name || HOTEL_LOCATIONS[0].name;
                    setCreateLocation(defaultLoc);
                  }}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs text-slate-900"
                >
                  <option value="Guest Room">Guest Room</option>
                  <option value="F&B Area">F&B Area</option>
                  <option value="Public Area">Public Area</option>
                  <option value="Back of House">Back of House</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Specific Room / Area <span className="text-rose-500">*</span>
                </label>
                <select
                  value={createLocation}
                  onChange={(e) => setCreateLocation(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs text-slate-900"
                >
                  {HOTEL_LOCATIONS.filter((l) => l.type === createLocationType).map((loc) => (
                    <option key={loc.name} value={loc.name}>
                      {loc.name} ({loc.floor})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category & Priority */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Problem Category *</label>
                <select
                  value={createCategory}
                  onChange={(e) => setCreateCategory(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                >
                  {PROBLEM_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Priority Level</label>
                <select
                  value={createPriorityVal}
                  onChange={(e) => setCreatePriorityVal(e.target.value as PriorityLevel)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Safety Hazard Checkbox */}
            <label className="flex items-center gap-2 p-2 rounded-lg border border-rose-200 bg-rose-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={createIsSafetyHazard}
                onChange={(e) => setCreateIsSafetyHazard(e.target.checked)}
                className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500"
              />
              <div>
                <span className="text-[11px] font-bold text-rose-900 block">Critical Safety Hazard / LOTO Required</span>
                <span className="text-[10px] text-rose-700">Immediate electrical, fire, or gas isolation hazard</span>
              </div>
            </label>

            {/* Issue Title */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Reported Issue Summary <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Shower mixer knob stuck & dripping hot water"
                value={createIssueTitle}
                onChange={(e) => setCreateIssueTitle(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs text-slate-900"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Detailed Description</label>
              <textarea
                rows={2.5}
                placeholder="Observed symptoms or details reported by guest/staff..."
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs leading-relaxed"
              />
            </div>

            {/* Multi-Issue / Room Snag Section */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-800 block">
                  Multiple Room Snags (Optional)
                </span>
                <span className="text-[10px] text-slate-400">Combine into 1 single request</span>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="e.g. Wardrobe handle loose / Balcony door squeak..."
                  value={snagInputTitle}
                  onChange={(e) => setSnagInputTitle(e.target.value)}
                  className="flex-1 p-1.5 rounded border border-slate-200 bg-white text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddSnagIssue}
                  className="h-8 px-2.5 text-xs font-semibold rounded cursor-pointer"
                >
                  + Add Issue
                </Button>
              </div>

              {createSnagIssues.length > 0 && (
                <ul className="space-y-1 pt-1">
                  {createSnagIssues.map((snag, idx) => (
                    <li key={snag.id} className="flex items-center justify-between p-1.5 bg-white border border-slate-200 rounded text-xs">
                      <span>{idx + 1}. {snag.issue}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSnagIssue(snag.id)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* CONDITIONAL GUEST ROOM RULES */}
            {createLocationType === "Guest Room" && (
              <div className="p-3 bg-amber-50/40 border border-amber-200 rounded-xl space-y-2.5">
                <strong className="text-xs font-bold text-amber-950 block">Guest Room Access Rules</strong>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">Guest in Room?</label>
                    <select
                      value={createGuestInRoom}
                      onChange={(e) => setCreateGuestInRoom(e.target.value as any)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                    >
                      <option value="Yes">Yes (Guest in Room)</option>
                      <option value="No">No (Room Vacant)</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">Entry Preference</label>
                    <select
                      value={createEntryPreference}
                      onChange={(e) => setCreateEntryPreference(e.target.value as EntryPreference)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                    >
                      <option value="Call Guest First">Call Guest First</option>
                      <option value="Guest Permission Confirmed">Guest Permission Confirmed</option>
                      <option value="Enter When Guest Absent">Enter When Guest Absent</option>
                      <option value="Coordinate with Duty Manager">Coordinate with Duty Manager</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Attachment (Optional Photo / Evidence) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Attachment / Photo Evidence (Optional)</label>
              <div className="p-3 border border-dashed border-slate-300 rounded-xl bg-slate-50 text-center">
                {createAttachmentName ? (
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-xs font-semibold text-slate-700 truncate max-w-xs">{createAttachmentName}</span>
                    <button
                      type="button"
                      onClick={() => setCreateAttachmentName(null)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold ml-2 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <span className="text-xs text-slate-600 font-medium block">Click or drag photo to attach issue evidence</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">JPG, PNG, or PDF up to 10MB</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setCreateAttachmentName(file.name);
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Reporter Auto-fill Footer */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 flex items-center justify-between">
              <span>Reported By: <strong>{currentUser.name}</strong></span>
              <span>Dept: <strong>Front Office / Housekeeping</strong></span>
              <span className="text-[10px] text-slate-400 font-mono">Auto-logged</span>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateDrawerOpen(false)}
                className="rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs px-4 cursor-pointer"
              >
                Submit Request
              </Button>
            </div>
          </form>
        </Drawer>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 6: REQUEST DETAIL SLIDE-OUT DRAWER
      ───────────────────────────────────────────────────────────── */}
      {selectedRequest && (
        <Drawer
          isOpen={Boolean(selectedRequest)}
          onClose={() => setSelectedRequest(null)}
          title={`Maintenance Request #${selectedRequest.requestNo}`}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full pt-1">
              <div>
                {selectedRequest.status !== "Closed" && selectedRequest.status !== "Cancelled" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenCancelModal(selectedRequest)}
                    className="text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg cursor-pointer h-8 px-3"
                  >
                    Cancel Request
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedRequest.status === "New" && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleOpenVerifyModal(selectedRequest)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 h-8 px-3.5 shadow-2xs cursor-pointer"
                  >
                    <Wrench className="h-3.5 w-3.5" /> Start Physical Verification
                  </Button>
                )}

                {selectedRequest.status === "Verification" && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleOpenVerifyModal(selectedRequest)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 h-8 px-3.5 shadow-2xs cursor-pointer"
                  >
                    Continue Verification
                  </Button>
                )}

                {selectedRequest.status === "Verified" && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleApproveAndCreateWO(selectedRequest)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 h-8 px-3.5 shadow-2xs cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" /> Approve & Create Work Order
                  </Button>
                )}

                {(selectedRequest.status === "Approved" || selectedRequest.status === "Work Order Created") && selectedRequest.workOrderNo && (
                  <Link href="/maintenance/work-orders">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 h-8 px-3.5 shadow-2xs cursor-pointer"
                    >
                      View Work Order #{selectedRequest.workOrderNo}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs p-1">
            {/* Header Hero Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-slate-900">#{selectedRequest.requestNo}</span>
                <span
                  className={cn(
                    "inline-flex items-center justify-center min-w-[85px] rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset text-center",
                    selectedRequest.status === "Approved" || selectedRequest.status === "Work Order Created"
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      : selectedRequest.status === "Verified"
                      ? "bg-sky-50 text-sky-700 ring-sky-200"
                      : selectedRequest.status === "Verification"
                      ? "bg-amber-50 text-amber-700 ring-amber-200"
                      : selectedRequest.status === "New"
                      ? "bg-slate-100 text-slate-700 ring-slate-200"
                      : selectedRequest.status === "Closed" || selectedRequest.status === "Resolved"
                      ? "bg-slate-100 text-slate-600 ring-slate-200"
                      : "bg-red-50 text-red-700 ring-red-200"
                  )}
                >
                  {selectedRequest.status === "Work Order Created" ? "WO Created" : selectedRequest.status}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900">{selectedRequest.issueTitle}</h3>
              {selectedRequest.description && (
                <p className="text-slate-600 leading-relaxed text-xs">{selectedRequest.description}</p>
              )}
            </div>

            {/* 1. Request Information */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-2.5">
              <strong className="text-xs font-bold text-slate-900 block border-b border-slate-100 pb-1.5">
                1. Request Information
              </strong>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Location</span>
                  <strong className="text-slate-900 font-semibold">{selectedRequest.location}</strong>
                  <span className="text-[10px] text-slate-400 block">{selectedRequest.locationType}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Problem Category</span>
                  <span className="font-semibold text-slate-800">{selectedRequest.category}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Priority &amp; Safety</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {selectedRequest.priority === "Critical" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                        Critical
                      </span>
                    ) : selectedRequest.priority === "High" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                        High
                      </span>
                    ) : (
                      <span className="font-medium text-slate-900">{selectedRequest.priority}</span>
                    )}

                    {selectedRequest.isSafetyHazard && (
                      <span className="inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-200 px-1.5 py-0.2 text-[10px] font-semibold text-rose-700">
                        <ShieldAlert className="h-3 w-3 text-rose-600" />
                        Safety Hazard
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Reported By</span>
                  <span className="font-semibold text-slate-800">{selectedRequest.reportedBy}</span>
                  <span className="text-[10px] text-slate-400 block">{selectedRequest.reportedDept}</span>
                </div>
              </div>
            </div>

            {/* Multi-Issue Snags List (if present) */}
            {selectedRequest.snagIssues && selectedRequest.snagIssues.length > 0 && (
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-2">
                <strong className="text-xs font-bold text-slate-900 block border-b border-slate-100 pb-1.5">
                  Multi-Issue Room Snag List ({selectedRequest.snagIssues.length} items)
                </strong>
                <ul className="space-y-1.5">
                  {selectedRequest.snagIssues.map((snag, idx) => (
                    <li key={snag.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200 text-xs">
                      <span className="font-medium text-slate-800">{idx + 1}. {snag.issue}</span>
                      <span className="text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {snag.category}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Guest Room Access Rules */}
            {selectedRequest.locationType === "Guest Room" && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <strong className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <DoorClosed className="h-3.5 w-3.5 text-slate-600" /> Guest Room Access Preference
                </strong>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Guest In Room?</span>
                    <strong className="text-slate-900">{selectedRequest.guestInRoom || "No"}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Staff Access Rule</span>
                    <span className="font-semibold text-slate-900">{selectedRequest.entryPreference}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Maintenance Physical Verification Section */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <strong className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-slate-500" /> 2. Maintenance Verification Findings
                </strong>
                {selectedRequest.verification ? (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
                    Verified
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                    Pending Physical Inspection
                  </span>
                )}
              </div>

              {selectedRequest.verification ? (
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Execution Method</span>
                      <span className="inline-block rounded px-2 py-0.5 text-[10px] font-medium border mt-0.5 bg-slate-100 text-slate-700 border-slate-200">
                        {selectedRequest.verification.executionMethod}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Estimated Budget</span>
                      <strong className="text-slate-900 font-mono text-xs">
                        ₹{(selectedRequest.verification.estimatedBudget || 0).toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Physical Inspection Findings</span>
                    <p className="text-slate-800 font-medium">{selectedRequest.verification.findings}</p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Recommended Scope of Work</span>
                    <p className="text-slate-800 font-medium">{selectedRequest.verification.recommendedWork}</p>
                  </div>

                  {selectedRequest.verification.requiredMaterials && (
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Required Materials / Spare Parts</span>
                      <p className="text-slate-700">{selectedRequest.verification.requiredMaterials}</p>
                    </div>
                  )}

                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Verified By: <strong>{selectedRequest.verification.verifiedBy}</strong></span>
                    <span className="font-mono">{selectedRequest.verification.verifiedAt}</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center space-y-2">
                  <p className="text-slate-500 text-xs">Physical verification has not been performed on this ticket yet.</p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleOpenVerifyModal(selectedRequest)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg px-4 py-1.5 shadow-2xs cursor-pointer"
                  >
                    Perform Verification Now
                  </Button>
                </div>
              )}
            </div>

            {/* 3. Linked Work Order Box (if created) */}
            {selectedRequest.workOrderNo && (
              <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" /> Linked Work Order Generated
                  </strong>
                  <span className="font-mono font-bold text-emerald-800 text-xs">#{selectedRequest.workOrderNo}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  This maintenance ticket has been approved and dispatched to the Work Orders queue. Technician execution, parts issuance, and completion are tracked on the Work Orders page.
                </p>
                <div className="pt-1">
                  <Link href="/maintenance/work-orders">
                    <Button
                      type="button"
                      size="sm"
                      className="h-7.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-2xs cursor-pointer"
                    >
                      Open Work Order #{selectedRequest.workOrderNo}
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Activity Timeline */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-2">
              <strong className="text-xs font-bold text-slate-900 block border-b border-slate-100 pb-1.5">
                Activity Audit Trail
              </strong>
              <div className="space-y-2 border-l-2 border-slate-200 pl-3 pt-1">
                {(selectedRequest.timeline || []).map((entry, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800">{entry.action}</span>
                      <span className="font-mono text-slate-400 text-[10px]">{entry.time}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">By {entry.user}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Drawer>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 7: MAINTENANCE VERIFICATION MODAL (FORM 2)
      ───────────────────────────────────────────────────────────── */}
      {verifyTargetRequest && (
        <Modal
          isOpen={Boolean(verifyTargetRequest)}
          onClose={() => setVerifyTargetRequest(null)}
          title={`Physical Verification — #${verifyTargetRequest.requestNo}`}
          maxWidth="lg"
        >
          <form onSubmit={handleSaveVerification} className="space-y-4 p-1 text-xs">
            {/* Reported Issue Summary Header */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reported Issue Summary</span>
                <strong className="text-slate-900 text-sm block mt-0.5">{verifyTargetRequest.issueTitle}</strong>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">{verifyTargetRequest.location}</span>
                  <span>•</span>
                  <span>Category: <strong>{verifyTargetRequest.category}</strong></span>
                  <span>•</span>
                  <span>Priority: <strong className={verifyTargetRequest.priority === "Critical" ? "text-rose-600" : "text-slate-700"}>{verifyTargetRequest.priority}</strong></span>
                </div>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-white text-slate-700 border border-slate-300">
                {verifyTargetRequest.reportedDept}
              </span>
            </div>

            {/* Problem Confirmed (3-State Selector) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 text-[11px]">
                Problem Confirmed on Site? <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setVfProblemConfirmed("Yes")}
                  className={cn(
                    "p-2.5 rounded-xl border font-bold text-xs transition cursor-pointer text-center flex flex-col items-center gap-1",
                    vfProblemConfirmed === "Yes"
                      ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <span className="text-sm">✓ Yes</span>
                  <span className={cn("text-[10px] font-normal", vfProblemConfirmed === "Yes" ? "text-emerald-100" : "text-slate-400")}>Issue Confirmed</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVfProblemConfirmed("Partially")}
                  className={cn(
                    "p-2.5 rounded-xl border font-bold text-xs transition cursor-pointer text-center flex flex-col items-center gap-1",
                    vfProblemConfirmed === "Partially"
                      ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <span className="text-sm">~ Partially</span>
                  <span className={cn("text-[10px] font-normal", vfProblemConfirmed === "Partially" ? "text-amber-100" : "text-slate-400")}>Intermittent / Minor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVfProblemConfirmed("No")}
                  className={cn(
                    "p-2.5 rounded-xl border font-bold text-xs transition cursor-pointer text-center flex flex-col items-center gap-1",
                    vfProblemConfirmed === "No"
                      ? "bg-rose-700 text-white border-rose-700 shadow-2xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <span className="text-sm">✕ No</span>
                  <span className={cn("text-[10px] font-normal", vfProblemConfirmed === "No" ? "text-rose-100" : "text-slate-400")}>No Defect Found</span>
                </button>
              </div>
            </div>

            {/* Verification Findings */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Physical Verification Findings <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                placeholder="What did physical inspection discover? (e.g. Starting capacitor 45uF degraded due to voltage surge; blower coil dusty.)"
                value={vfFindings}
                onChange={(e) => setVfFindings(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs leading-relaxed focus:border-slate-900 focus:outline-hidden"
              />
            </div>

            {/* Recommended Work */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Recommended Scope of Work <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                placeholder="Required repair action (e.g. Replace 45uF starting capacitor with OEM spare, test suction pressure at 130 PSI, clean filter.)"
                value={vfRecommendedWork}
                onChange={(e) => setVfRecommendedWork(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs leading-relaxed focus:border-slate-900 focus:outline-hidden"
              />
            </div>

            {/* Structured Required Parts / Materials List */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-800">
                  Required Parts & Materials (Optional)
                </span>
                <span className="text-[10px] text-slate-400">Record material requirements for work order</span>
              </div>

              {/* Add Material Row */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Part name (e.g. 45uF Run Capacitor)"
                  value={vfMaterialInputName}
                  onChange={(e) => setVfMaterialInputName(e.target.value)}
                  className="flex-1 p-2 rounded-lg border border-slate-200 bg-white text-xs"
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Qty"
                  value={vfMaterialInputQty}
                  onChange={(e) => setVfMaterialInputQty(Math.max(1, Number(e.target.value)))}
                  className="w-16 p-2 rounded-lg border border-slate-200 bg-white text-xs text-center"
                />
                <select
                  value={vfMaterialInputUnit}
                  onChange={(e) => setVfMaterialInputUnit(e.target.value)}
                  className="w-20 p-2 rounded-lg border border-slate-200 bg-white text-xs"
                >
                  <option value="pcs">pcs</option>
                  <option value="mtr">mtr</option>
                  <option value="kg">kg</option>
                  <option value="ltr">ltr</option>
                  <option value="set">set</option>
                  <option value="box">box</option>
                </select>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddVerificationMaterial}
                  className="h-8.5 px-3 text-xs font-semibold rounded-lg cursor-pointer bg-white"
                >
                  + Add
                </Button>
              </div>

              {/* Added Materials List */}
              {vfMaterialsList.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  {vfMaterialsList.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <span className="font-medium text-slate-800">
                        {item.itemName} <span className="text-slate-500 font-bold">({item.quantity} {item.unit || "pcs"})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveVerificationMaterial(item.id)}
                        className="text-slate-400 hover:text-rose-600 transition cursor-pointer p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Or write quick parts summary (e.g. 1x Run Capacitor 45uF, R32 Refrigerant 0.5kg)"
                  value={vfRequiredMaterials}
                  onChange={(e) => setVfRequiredMaterials(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                />
              )}
            </div>

            {/* Execution Method & Estimated Budget */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Execution Method <span className="text-rose-500">*</span>
                </label>
                <select
                  value={vfExecutionMethod}
                  onChange={(e) => setVfExecutionMethod(e.target.value as ExecutionMethod)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-xs text-slate-900"
                >
                  <option value="In-House">In-House Engineering Staff</option>
                  <option value="Outsource">Outsource (External AMC / Contractor)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">Technician or vendor will be assigned during Work Order dispatch</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Estimated Budget (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    placeholder="e.g. 2500"
                    value={vfEstimatedBudget || ""}
                    onChange={(e) => setVfEstimatedBudget(Number(e.target.value))}
                    className="w-full pl-7 p-2.5 rounded-xl border border-slate-200 bg-white font-mono text-xs font-bold"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Approximate total cost for parts & labor</span>
              </div>
            </div>

            {/* Notes / Constraints */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Verification Remarks / Constraints</label>
              <input
                type="text"
                placeholder="e.g. VIP guest arriving at 2 PM. High priority repair."
                value={vfNotes}
                onChange={(e) => setVfNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs"
              />
            </div>

            {/* Inspection Photo / Document Attachment Simulator */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Inspection Photo / Evidence (Optional)</label>
              <div className="p-3 border border-dashed border-slate-300 rounded-xl bg-slate-50 text-center">
                {vfAttachmentName ? (
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-xs font-semibold text-slate-700 truncate max-w-xs">{vfAttachmentName}</span>
                    <button
                      type="button"
                      onClick={() => setVfAttachmentName(null)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold ml-2 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <span className="text-xs text-slate-600 font-medium block">Click or drag photo to attach inspection evidence</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">JPG, PNG or PDF up to 10MB</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setVfAttachmentName(file.name);
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Read-Only Engineer Badge */}
            <div className="p-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
              <span>Verified By: <strong>{currentUser.name}</strong> (Chief Engineer)</span>
              <span>Dept: <strong>Engineering</strong></span>
              <span>Timestamp: <strong>Just now</strong></span>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVerifyTargetRequest(null)}
                className="rounded-xl text-xs cursor-pointer px-4 font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs px-5 cursor-pointer shadow-2xs"
              >
                Save Verification Findings
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 8: CANCEL REQUEST MODAL
      ───────────────────────────────────────────────────────────── */}
      {cancelTargetRequest && (
        <Modal
          isOpen={Boolean(cancelTargetRequest)}
          onClose={() => setCancelTargetRequest(null)}
          title={`Cancel Request #${cancelTargetRequest.requestNo}`}
          maxWidth="sm"
        >
          <form onSubmit={handleConfirmCancel} className="space-y-3.5 p-1 text-xs">
            {cancelError ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                  <AlertTriangle className="h-4 w-4" /> Cannot Cancel Request Directly
                </div>
                <p className="text-slate-600 leading-relaxed text-xs">{cancelError}</p>
                <div className="pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelTargetRequest(null)}
                    className="text-xs font-semibold rounded cursor-pointer"
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-slate-600 leading-relaxed">
                  Are you sure you want to cancel request <strong>#{cancelTargetRequest.requestNo}</strong> ({cancelTargetRequest.issueTitle})?
                </p>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                    Cancellation Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2.5}
                    required
                    placeholder="e.g. Duplicate report / Issue resolved by guest / False alarm..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelTargetRequest(null)}
                    className="rounded-lg text-xs cursor-pointer"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg text-xs px-4 cursor-pointer"
                  >
                    Confirm Cancellation
                  </Button>
                </div>
              </>
            )}
          </form>
        </Modal>
      )}
    </ModulePageShell>
  );
}
