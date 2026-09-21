"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Wrench,
  Search,
  Plus,
  Check,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  Package,
  DoorClosed,
  UserCheck,
  RotateCcw,
  Clock,
  FileText,
  X,
  Building2,
  Phone,
  Truck,
  Info,
  Paperclip,
  AlertTriangle,
  ExternalLink,
  Inbox,
  Sparkles,
  SlidersHorizontal,
  Download,
  Loader2,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Badge, Button, Card, Drawer, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  ON_DUTY_TECHNICIANS,
  MOCK_ON_DUTY_TECHNICIANS,
  HOTEL_LOCATIONS,
} from "@/app/data/maintenance/constants";
import {
  WorkOrder,
  WorkOrderType,
  WorkOrderStatus,
  PriorityLevel,
  EntryPreference,
  ExecutionMethod,
  SparePartUsed,
  RoomBlockType,
  MaintenanceRequest,
  MaintenanceVendor,
  WorkOrderProgressUpdate,
  SnagIssue,
} from "@/app/data/maintenance/types";
import { currentUser } from "@/app/data/user";
import { usePsList } from "@/hooks/usePsResource";
import { mntWorkOrderService, mntRequestService, mntVendorService, mntProblemCategoryService, mntSparePartService } from "@/services/maintenance";

// Legacy fallback if spare-parts master is empty (until seeded).
export const STORES_SPARE_PARTS_CATALOG = [
  { id: "sp-1", partName: "Run Capacitor 45uF 440V", productCode: "ELEC-CAP-45UF", unitCost: 450, ref: "STORES-REQ-401" },
  { id: "sp-2", partName: "High-Temp Bearings 6204-2RS", productCode: "MECH-BRG-6204", unitCost: 600, ref: "STORES-REQ-402" },
  { id: "sp-3", partName: "Geberit Concealed Dual Flush Valve Kit", productCode: "PLUMB-VALV-GEB", unitCost: 1850, ref: "STORES-REQ-403" },
  { id: "sp-4", partName: "12W LED Recessed Spotlight Driver", productCode: "ELEC-LED-12W", unitCost: 350, ref: "STORES-REQ-404" },
  { id: "sp-5", partName: "Cummins Oil Filter LF9009", productCode: "ENG-FLTR-LF9009", unitCost: 1850, ref: "STORES-REQ-405" },
  { id: "sp-6", partName: "Fleetguard Coolant 5L Can", productCode: "ENG-COOL-5L", unitCost: 1550, ref: "STORES-REQ-406" },
  { id: "sp-7", partName: "15mm Brass Ball Isolation Valve", productCode: "PLUMB-VALV-15MM", unitCost: 420, ref: "STORES-REQ-407" },
  { id: "sp-8", partName: "R32 Refrigerant Gas (Per Kg)", productCode: "HVAC-GAS-R32", unitCost: 850, ref: "STORES-REQ-408" },
];

export const getWorkOrderStatusBadgeConfig = (status: WorkOrderStatus) => {
  switch (status) {
    case "New":
      return { bg: "bg-indigo-50 text-indigo-800", border: "border-indigo-200", label: "New" };
    case "Assigned":
      return { bg: "bg-slate-100 text-slate-700", border: "border-slate-200", label: "Assigned" };
    case "In Progress":
      return { bg: "bg-amber-50 text-amber-800", border: "border-amber-200", label: "In Progress" };
    case "Awaiting Parts":
      return { bg: "bg-sky-50 text-sky-800", border: "border-sky-200", label: "Awaiting Parts" };
    case "Completed":
      return { bg: "bg-emerald-50 text-emerald-800", border: "border-emerald-200", label: "Completed (Pending Verification)" };
    case "Verified":
      return { bg: "bg-teal-50 text-teal-800", border: "border-teal-200", label: "Verified" };
    case "Closed":
      return { bg: "bg-slate-100 text-slate-600", border: "border-slate-200", label: "Closed" };
    case "Cancelled":
      return { bg: "bg-rose-50 text-rose-700", border: "border-rose-200", label: "Cancelled" };
    default:
      return { bg: "bg-slate-100 text-slate-700", border: "border-slate-200", label: status };
  }
};

function isTechnicianUnassigned(wo: Pick<WorkOrder, "technicianName">): boolean {
  const name = String(wo.technicianName ?? "").trim().toLowerCase();
  return !name || name.includes("unassigned") || name.includes("pending vendor");
}

function needsTechnicianAssignment(wo: WorkOrder): boolean {
  return wo.status === "New" || (wo.status === "Assigned" && isTechnicianUnassigned(wo));
}

function canStartWork(wo: WorkOrder): boolean {
  return wo.status === "Assigned" && !isTechnicianUnassigned(wo);
}

export function MaintenanceWorkOrdersView() {
  const searchParams = useSearchParams();
  const { data: workOrders, loading, reload: reloadWorkOrders } = usePsList(() => mntWorkOrderService.list(), []);
  const { data: requests } = usePsList(() => mntRequestService.list(), []);
  const { data: vendors } = usePsList(() => mntVendorService.list(), []);
  const { data: problemCategories } = usePsList(() => mntProblemCategoryService.list(), []);
  const { data: sparePartsMaster } = usePsList(() => mntSparePartService.list(), []);
  const sparePartsCatalog = useMemo(() => {
    const active = sparePartsMaster.filter((p) => String(p.status ?? "Active") === "Active");
    if (active.length > 0) {
      return active.map((p) => ({
        id: p.id,
        partName: p.partName,
        productCode: p.partCode,
        unitCost: Number(p.unitCost) || 0,
        ref: p.defaultStoresRef || "",
      }));
    }
    return STORES_SPARE_PARTS_CATALOG;
  }, [sparePartsMaster]);
  const defaultProblemCategory = useMemo(() => {
    const active = problemCategories.find((c) => String(c.status ?? "Active") === "Active");
    return active?.categoryName || "General / Other";
  }, [problemCategories]);
  const [saving, setSaving] = useState(false);
  const savingLockRef = useRef(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>("ALL");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>("ALL");
  const [selectedAssigneeFilter, setSelectedAssigneeFilter] = useState<string>("ALL");
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);

  // Multi-Selection State (Front Office / Requests Style)
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Pagination State
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Drawer / Modal States
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);

  // ─────────────────────────────────────────────────────────────
  // MODAL STATES FOR CONTROLLED ACTIONS
  // ─────────────────────────────────────────────────────────────
  // 1. Add Progress Update Modal
  const [progressTargetWO, setProgressTargetWO] = useState<WorkOrder | null>(null);
  const [progressStatus, setProgressStatus] = useState<WorkOrderStatus>("In Progress");
  const [progressRemarks, setProgressRemarks] = useState("");
  const [partsWaiting, setPartsWaiting] = useState("");
  const [progressAttachment, setProgressAttachment] = useState<string | null>(null);

  // 2. Complete Work Order Modal
  const [completeTargetWO, setCompleteTargetWO] = useState<WorkOrder | null>(null);
  const [completionRootCause, setCompletionRootCause] = useState("");
  const [completionActionTaken, setCompletionActionTaken] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [completionAttachment, setCompletionAttachment] = useState<string | null>(null);

  // 3. Verify & Sign-off Modal
  const [verifyTargetWO, setVerifyTargetWO] = useState<WorkOrder | null>(null);
  const [verificationResult, setVerificationResult] = useState<"Pass" | "Needs Rework">("Pass");
  const [verificationNotes, setVerificationNotes] = useState("");

  // 4. Add Spare Part Modal (Stores Reference Usage Only)
  const [addPartTargetWO, setAddPartTargetWO] = useState<WorkOrder | null>(null);
  const [selectedCatalogPartId, setSelectedCatalogPartId] = useState("");
  const [customPartName, setCustomPartName] = useState("");
  const [customProductCode, setCustomProductCode] = useState("");
  const [partQuantity, setPartQuantity] = useState<number>(1);
  const [partUnitCost, setPartUnitCost] = useState<number>(0);
  const [storesReference, setStoresReference] = useState("");

  // 5. Reopen Work Order Modal
  const [reopenTargetWO, setReopenTargetWO] = useState<WorkOrder | null>(null);
  const [reopenReason, setReopenReason] = useState("");

  // 6. Cancel Work Order Modal
  const [cancelTargetWO, setCancelTargetWO] = useState<WorkOrder | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // 7. Assign Technician Modal
  const [assignTargetWO, setAssignTargetWO] = useState<WorkOrder | null>(null);
  const [assignExecutionMethod, setAssignExecutionMethod] = useState<ExecutionMethod>("In-House");
  const [assignTechnicianName, setAssignTechnicianName] = useState(ON_DUTY_TECHNICIANS[0]?.name ?? "");
  const [assignVendorId, setAssignVendorId] = useState("");
  const [assignExternalTechName, setAssignExternalTechName] = useState("");

  // ─────────────────────────────────────────────────────────────
  // CREATE WORK ORDER FORM STATE (Inherits from Request if selected)
  // ─────────────────────────────────────────────────────────────
  const [selectedRequestId, setSelectedRequestId] = useState<string>("");
  const [createType, setCreateType] = useState<WorkOrderType>("Corrective");
  const [createRequestRef, setCreateRequestRef] = useState<string>("");
  const [createLocationType, setCreateLocationType] = useState<"Guest Room" | "F&B Area" | "Public Area" | "Back of House">("Guest Room");
  const [createLocation, setCreateLocation] = useState<string>(HOTEL_LOCATIONS[0].name);
  const [createProblemCategory, setCreateProblemCategory] = useState<string>("");
  const [createIssueTitle, setCreateIssueTitle] = useState<string>("");
  const [createDescription, setCreateDescription] = useState<string>("");
  const [createAssetCode, setCreateAssetCode] = useState<string>("");
  const [createAssetName, setCreateAssetName] = useState<string>("");
  const [createPriority, setCreatePriority] = useState<PriorityLevel>("Medium");
  const [createIsSafetyHazard, setCreateIsSafetyHazard] = useState<boolean>(false);
  const [createGuestInRoom, setCreateGuestInRoom] = useState<"Yes" | "No" | "Unknown">("No");
  const [createEntryPreference, setCreateEntryPreference] = useState<EntryPreference>("Enter When Guest Absent");
  const [createRoomBlock, setCreateRoomBlock] = useState<RoomBlockType | "NONE">("NONE");

  // Inherited Request Verified Data
  const [inheritedFindings, setInheritedFindings] = useState<string>("");
  const [inheritedRecommendedWork, setInheritedRecommendedWork] = useState<string>("");
  const [inheritedRequiredMaterials, setInheritedRequiredMaterials] = useState<string>("");
  const [inheritedEstimatedBudget, setInheritedEstimatedBudget] = useState<number | "">("");

  // Execution Method & Assignment
  const [createExecutionMethod, setCreateExecutionMethod] = useState<ExecutionMethod>("In-House");
  const [createTechnicianName, setCreateTechnicianName] = useState<string>(ON_DUTY_TECHNICIANS[0]?.name ?? "");

  // Outsource Maintenance Vendor Master selection
  const [createVendorId, setCreateVendorId] = useState<string>("");
  const [createExternalTechName, setCreateExternalTechName] = useState<string>("");
  const [createVendorContact, setCreateVendorContact] = useState<string>("");
  const [createAgreedAmount, setCreateAgreedAmount] = useState<number | "">(2500);
  const [createExpectedCompletionDate, setCreateExpectedCompletionDate] = useState<string>("Today");
  const [createExpectedCompletionTime, setCreateExpectedCompletionTime] = useState<string>("05:00 PM");
  const [createServiceReference, setCreateServiceReference] = useState<string>("");
  const [createVendorNotes, setCreateVendorNotes] = useState<string>("");
  const [createScheduledDate, setCreateScheduledDate] = useState<string>("Today");
  const [createScheduledTime, setCreateScheduledTime] = useState<string>("03:00 PM");
  const [createDueDate, setCreateDueDate] = useState<string>("Today, 05:00 PM");
  const [createSnagIssues, setCreateSnagIssues] = useState<SnagIssue[]>([]);

  // Auto-fill from Request URL searchParams
  useEffect(() => {
    const requestParam = searchParams.get("requestRef");
    if (requestParam) {
      const foundReq = requests.find((r) => r.requestNo === requestParam || r.id === requestParam);
      if (foundReq) {
        populateFormFromRequest(foundReq);
      } else {
        setCreateRequestRef(requestParam);
      }
      setIsCreateDrawerOpen(true);
    }
  }, [searchParams, requests]);

  // Helper: Populate Create Form from Approved Request
  const populateFormFromRequest = (req: MaintenanceRequest) => {
    setSelectedRequestId(req.id);
    setCreateRequestRef(req.requestNo);
    setCreateLocationType(req.locationType);
    setCreateLocation(req.location);
    setCreateProblemCategory(req.category);
    setCreateIssueTitle(req.issueTitle);
    setCreateDescription(req.description);
    setCreatePriority(req.priority);
    setCreateIsSafetyHazard(req.isSafetyHazard);
    setCreateGuestInRoom(req.guestInRoom);
    setCreateEntryPreference(req.entryPreference);
    setCreateSnagIssues(req.snagIssues || []);
    setCreateRoomBlock(req.locationType === "Guest Room" && req.priority === "Critical" ? "OOO" : "NONE");

    if (req.verification) {
      setInheritedFindings(req.verification.findings || "");
      setInheritedRecommendedWork(req.verification.recommendedWork || "");
      setInheritedRequiredMaterials(req.verification.requiredMaterials || "");
      setInheritedEstimatedBudget(req.verification.estimatedBudget || "");
      setCreateExecutionMethod(req.verification.executionMethod || "In-House");
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 1. COMPACT KPI SUMMARY METRICS
  // ─────────────────────────────────────────────────────────────
  const summaryMetrics = useMemo(() => {
    const total = workOrders.length;
    const inProgress = workOrders.filter((w) => w.status === "In Progress").length;
    const awaitingParts = workOrders.filter((w) => w.status === "Awaiting Parts").length;
    const pendingVerification = workOrders.filter((w) => w.status === "Completed").length;

    return { total, inProgress, awaitingParts, pendingVerification };
  }, [workOrders]);

  // ─────────────────────────────────────────────────────────────
  // 2. FILTERING LOGIC
  // ─────────────────────────────────────────────────────────────
  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      // Status Tab Filter
      if (selectedStatusTab !== "ALL") {
        if (selectedStatusTab === "New" && !needsTechnicianAssignment(wo)) return false;
        if (selectedStatusTab === "Assigned" && !(wo.status === "Assigned" && !isTechnicianUnassigned(wo))) return false;
        if (selectedStatusTab === "In Progress" && wo.status !== "In Progress") return false;
        if (selectedStatusTab === "Awaiting Parts" && wo.status !== "Awaiting Parts") return false;
        if (selectedStatusTab === "Pending Verification" && wo.status !== "Completed") return false;
        if (selectedStatusTab === "Closed" && !(wo.status === "Verified" || wo.status === "Closed")) return false;
        if (selectedStatusTab === "Cancelled" && wo.status !== "Cancelled") return false;
      }

      // Work Order Type Filter
      if (selectedTypeFilter !== "ALL" && wo.woType !== selectedTypeFilter) return false;

      // Priority Filter
      if (selectedPriorityFilter === "SAFETY_HAZARD") {
        if (!wo.isSafetyHazard) return false;
      } else if (selectedPriorityFilter !== "ALL" && wo.priority !== selectedPriorityFilter) {
        return false;
      }

      // Assigned To Filter
      if (selectedAssigneeFilter !== "ALL") {
        if (wo.assignedType === "In-House Staff" && wo.technicianName !== selectedAssigneeFilter) return false;
        if (wo.assignedType === "External Vendor" && wo.maintenanceVendorName !== selectedAssigneeFilter && wo.technicianName !== selectedAssigneeFilter) return false;
      }

      // Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchWO = wo.woNumber.toLowerCase().includes(q);
        const matchReq = wo.requestRef ? wo.requestRef.toLowerCase().includes(q) : false;
        const matchLoc = wo.location.toLowerCase().includes(q);
        const matchIssue = wo.issue.toLowerCase().includes(q);
        const matchAsset = wo.assetName ? wo.assetName.toLowerCase().includes(q) : false;
        const matchTech = wo.technicianName.toLowerCase().includes(q);
        const matchVendor = wo.maintenanceVendorName ? wo.maintenanceVendorName.toLowerCase().includes(q) : false;

        if (!matchWO && !matchReq && !matchLoc && !matchIssue && !matchAsset && !matchTech && !matchVendor) {
          return false;
        }
      }

      return true;
    });
  }, [workOrders, selectedStatusTab, selectedTypeFilter, selectedPriorityFilter, selectedAssigneeFilter, searchTerm]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredWorkOrders.length / pageSize));
  const paginatedWorkOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredWorkOrders.slice(startIndex, startIndex + pageSize);
  }, [filteredWorkOrders, currentPage, pageSize]);

  // Selection helpers (Front Office / Requests style)
  const allSelected =
    paginatedWorkOrders.length > 0 && paginatedWorkOrders.every((w) => selectedRowIds.has(w.id));

  const toggleAllSelected = () => {
    setSelectedRowIds(allSelected ? new Set() : new Set(paginatedWorkOrders.map((w) => w.id)));
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
    const targets = workOrders.filter((w) =>
      selectedRowIds.size > 0 ? selectedRowIds.has(w.id) : true
    );
    const headers = ["WO Number", "Request Ref", "Type", "Location", "Location Type", "Issue", "Assignee", "Priority", "Status", "Due Date"];
    const rows = targets.map((w) => [
      w.woNumber,
      w.requestRef || "None",
      w.woType,
      `"${w.location.replace(/"/g, '""')}"`,
      w.locationType,
      `"${w.issue.replace(/"/g, '""')}"`,
      w.technicianName,
      w.priority,
      w.status,
      w.dueDate,
    ]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `work_orders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMessage(`✓ Exported ${targets.length} work orders to CSV.`);
  };

  const hasActiveAdvancedFilters = selectedStatusTab !== "ALL" || selectedTypeFilter !== "ALL" || selectedPriorityFilter !== "ALL" || selectedAssigneeFilter !== "ALL";

  const clearAdvancedFilters = () => {
    setSelectedStatusTab("ALL");
    setSelectedTypeFilter("ALL");
    setSelectedPriorityFilter("ALL");
    setSelectedAssigneeFilter("ALL");
    setCurrentPage(1);
  };

  // ─────────────────────────────────────────────────────────────
  // 3. CREATE WORK ORDER HANDLER
  // ─────────────────────────────────────────────────────────────
  const handleOpenCreateDrawer = () => {
    setSelectedRequestId("");
    setCreateType("Corrective");
    setCreateRequestRef("");
    setCreateLocationType("Guest Room");
    setCreateLocation(HOTEL_LOCATIONS[0].name);
    setCreateProblemCategory(defaultProblemCategory);
    setCreateIssueTitle("");
    setCreateDescription("");
    setCreateAssetCode("");
    setCreateAssetName("");
    setCreatePriority("Medium");
    setCreateIsSafetyHazard(false);
    setCreateGuestInRoom("No");
    setCreateEntryPreference("Enter When Guest Absent");
    setCreateRoomBlock("NONE");
    setInheritedFindings("");
    setInheritedRecommendedWork("");
    setInheritedRequiredMaterials("");
    setInheritedEstimatedBudget("");
    setCreateExecutionMethod("In-House");
    setCreateTechnicianName(ON_DUTY_TECHNICIANS[0]?.name ?? "");
    setCreateVendorId(vendors[0]?.id ?? "");
    setCreateExternalTechName("");
    setCreateVendorContact(vendors[0]?.phone ?? "");
    setCreateAgreedAmount(2500);
    setCreateExpectedCompletionDate("Today");
    setCreateExpectedCompletionTime("05:00 PM");
    setCreateServiceReference(vendors[0]?.serviceReference || "");
    setCreateVendorNotes("");
    setCreateScheduledDate("Today");
    setCreateScheduledTime("03:00 PM");
    setCreateDueDate("Today, 05:00 PM");
    setCreateSnagIssues([]);
    setIsCreateDrawerOpen(true);
  };

  const handleSaveWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createIssueTitle.trim() || saving) return;

    const selectedVendor = vendors.find((v) => v.id === createVendorId) || vendors[0];
    const newWoNumber = `WO-${120 + workOrders.length + 1}`;

    const newWorkOrder: Partial<WorkOrder> = {
      woNumber: newWoNumber,
      requestRef: createRequestRef.trim() || undefined,
      woType: createType,
      location: createLocation,
      locationType: createLocationType,
      roomBlockType: createRoomBlock !== "NONE" ? createRoomBlock : undefined,
      problemCategory: createProblemCategory,
      issue: createIssueTitle.trim(),
      description: createDescription.trim(),
      snagIssues: createSnagIssues.length > 0 ? createSnagIssues : undefined,
      priority: createPriority,
      isSafetyHazard: createIsSafetyHazard,
      guestInRoom: createLocationType === "Guest Room" ? createGuestInRoom : "No",
      entryPreference: createLocationType === "Guest Room" ? createEntryPreference : "Coordinate with Duty Manager",
      executionMethod: createExecutionMethod,
      assignedType: createExecutionMethod === "In-House" ? "In-House Staff" : "External Vendor",
      technicianName: createExecutionMethod === "In-House"
        ? createTechnicianName
        : (createExternalTechName.trim() || selectedVendor?.contactPerson || "Unassigned"),
      technicianContact: createExecutionMethod === "Outsource" ? createVendorContact : undefined,
      maintenanceVendorId: createExecutionMethod === "Outsource" ? selectedVendor?.id : undefined,
      maintenanceVendorName: createExecutionMethod === "Outsource" ? selectedVendor?.vendorName : undefined,
      externalTechnicianName: createExecutionMethod === "Outsource" ? createExternalTechName.trim() : undefined,
      serviceReference: createExecutionMethod === "Outsource" ? (createServiceReference.trim() || selectedVendor?.serviceReference) : undefined,
      agreedAmount: createExecutionMethod === "Outsource" && createAgreedAmount !== "" ? Number(createAgreedAmount) : undefined,
      expectedCompletionDate: createExecutionMethod === "Outsource" ? createExpectedCompletionDate : undefined,
      expectedCompletionTime: createExecutionMethod === "Outsource" ? createExpectedCompletionTime : undefined,
      vendorNotes: createExecutionMethod === "Outsource" ? createVendorNotes : undefined,
      verificationFindings: inheritedFindings || undefined,
      recommendedWork: inheritedRecommendedWork || undefined,
      requiredMaterials: inheritedRequiredMaterials || undefined,
      estimatedBudget: inheritedEstimatedBudget !== "" ? Number(inheritedEstimatedBudget) : undefined,
      assetCode: createAssetCode.trim() || undefined,
      assetName: createAssetName.trim() || undefined,
      scheduledDate: createScheduledDate,
      scheduledTime: createScheduledTime,
      dueDate: createDueDate,
      status: "Assigned",
      partsCost: 0,
      externalServiceCost: createExecutionMethod === "Outsource" && createAgreedAmount !== "" ? Number(createAgreedAmount) : 0,
      totalCost: createExecutionMethod === "Outsource" && createAgreedAmount !== "" ? Number(createAgreedAmount) : 0,
      hkHandoverStatus: createLocationType === "Guest Room" ? "Under Repair" : undefined,
      checklistItems: createSnagIssues.length > 0
        ? createSnagIssues.map((s) => ({ id: s.id, description: s.issue, completed: false }))
        : [{ id: "c1", description: `Resolve: ${createIssueTitle.trim()}`, completed: false }],
      progressUpdates: [],
      timeline: [
        { time: "Just now", action: `Work Order #${newWoNumber} Created`, user: currentUser.name },
        {
          time: "Just now",
          action: createExecutionMethod === "In-House"
            ? `Assigned to In-House Technician: ${createTechnicianName}`
            : `Assigned to Maintenance Vendor: ${selectedVendor?.vendorName || "Unassigned"} (Agreed Amount: ₹${createAgreedAmount || 0})`,
          user: currentUser.name,
        },
      ],
    };

    if (savingLockRef.current) return;
    savingLockRef.current = true;
    setSaving(true);
    try {
      await mntWorkOrderService.create(newWorkOrder);
      await reloadWorkOrders();
      setIsCreateDrawerOpen(false);
      setToastMessage(`✓ Work Order #${newWoNumber} created and assigned successfully!`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to create work order");
    } finally {
      savingLockRef.current = false;
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 4. ACTION HANDLERS (CONTROLLED WORKFLOW TRANSITIONS)
  // ─────────────────────────────────────────────────────────────
  const handleStartWork = async (wo: WorkOrder) => {
    if (saving) return;
    // Assignment is only required when leaving New/Assigned to start work —
    // not when resuming from Awaiting Parts ("Parts Received").
    if (wo.status !== "Awaiting Parts" && !canStartWork(wo)) {
      setToastMessage("Assign a technician before starting work.");
      handleOpenAssignModal(wo);
      return;
    }
    const updated: Partial<WorkOrder> = {
      status: "In Progress",
      startTime: wo.startTime || "Just now",
      timeline: [
        ...(wo.timeline || []),
        {
          time: "Just now",
          action:
            wo.status === "Awaiting Parts"
              ? "Parts received — work resumed"
              : "Work started by technician",
          user: currentUser.name,
        },
      ],
    };

    if (savingLockRef.current) return;
    savingLockRef.current = true;
    setSaving(true);
    try {
      const saved = await mntWorkOrderService.update(wo.id, updated);
      await reloadWorkOrders();
      if (selectedWorkOrder?.id === wo.id) setSelectedWorkOrder(saved);
      setToastMessage(
        wo.status === "Awaiting Parts"
          ? `Parts received for #${wo.woNumber}. Status set to In Progress.`
          : `Work Order #${wo.woNumber} status updated to In Progress.`,
      );
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to update work order");
    } finally {
      savingLockRef.current = false;
      setSaving(false);
    }
  };

  const handleOpenAssignModal = (wo: WorkOrder) => {
    setAssignTargetWO(wo);
    setAssignExecutionMethod(wo.executionMethod === "Outsource" ? "Outsource" : "In-House");
    setAssignTechnicianName(ON_DUTY_TECHNICIANS[0]?.name ?? "");
    setAssignVendorId(vendors[0]?.id ?? "");
    setAssignExternalTechName("");
  };

  const handleAssignTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTargetWO || saving) return;

    const selectedVendor = vendors.find((v) => v.id === assignVendorId) || vendors[0];
    const isInHouse = assignExecutionMethod === "In-House";
    const techName = isInHouse
      ? assignTechnicianName
      : assignExternalTechName.trim() || selectedVendor?.contactPerson || selectedVendor?.vendorName || "";

    if (!techName.trim()) {
      setToastMessage("Select a technician or vendor before assigning.");
      return;
    }

    const updated: Partial<WorkOrder> = {
      status: "Assigned",
      executionMethod: assignExecutionMethod,
      assignedType: isInHouse ? "In-House Staff" : "External Vendor",
      technicianName: techName,
      maintenanceVendorId: isInHouse ? undefined : selectedVendor?.id,
      maintenanceVendorName: isInHouse ? undefined : selectedVendor?.vendorName,
      externalTechnicianName: isInHouse ? undefined : assignExternalTechName.trim() || undefined,
      timeline: [
        ...(assignTargetWO.timeline || []),
        {
          time: "Just now",
          action: isInHouse
            ? `Technician assigned: ${techName}`
            : `Vendor assigned: ${selectedVendor?.vendorName || techName}`,
          user: currentUser.name,
        },
      ],
    };

    if (savingLockRef.current) return;
    savingLockRef.current = true;
    setSaving(true);
    try {
      const saved = await mntWorkOrderService.update(assignTargetWO.id, updated);
      await reloadWorkOrders();
      if (selectedWorkOrder?.id === assignTargetWO.id) setSelectedWorkOrder(saved);
      setAssignTargetWO(null);
      setToastMessage(`✓ Work Order #${assignTargetWO.woNumber} assigned to ${techName}. You can now Start Work.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to assign technician");
    } finally {
      savingLockRef.current = false;
      setSaving(false);
    }
  };

  // Progress Update Modal
  const handleOpenProgressModal = (wo: WorkOrder) => {
    setProgressTargetWO(wo);
    setProgressStatus(wo.status === "Awaiting Parts" ? "Awaiting Parts" : "In Progress");
    setProgressRemarks("");
    setPartsWaiting("");
    setProgressAttachment(null);
  };

  const handleSaveProgressUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressTargetWO || !progressRemarks.trim() || saving) return;

    const newUpdate: WorkOrderProgressUpdate = {
      id: `prog-${Date.now()}`,
      date: "Today",
      time: "Just now",
      user: currentUser.name,
      status: progressStatus,
      remarks: progressRemarks.trim(),
      partsWaiting: partsWaiting.trim() || undefined,
      attachmentName: progressAttachment || undefined,
    };

    const updatedTimelineAction = progressStatus === "Awaiting Parts"
      ? `Progress Update: Awaiting Parts (${partsWaiting.trim() || "Material required"})`
      : `Progress Update logged: ${progressRemarks.trim()}`;

    const updated: Partial<WorkOrder> = {
      status: progressStatus,
      progressUpdates: [...(progressTargetWO.progressUpdates || []), newUpdate],
      timeline: [
        ...progressTargetWO.timeline,
        { time: "Just now", action: updatedTimelineAction, user: currentUser.name, remark: progressRemarks.trim() },
      ],
    };

    if (savingLockRef.current) return;
    savingLockRef.current = true;
    setSaving(true);
    try {
      const saved = await mntWorkOrderService.update(progressTargetWO.id, updated);
      await reloadWorkOrders();
      if (selectedWorkOrder?.id === progressTargetWO.id) setSelectedWorkOrder(saved);
      setProgressTargetWO(null);
      setToastMessage(`✓ Progress update recorded for Work Order #${progressTargetWO.woNumber}.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to save progress update");
    } finally {
      savingLockRef.current = false;
      setSaving(false);
    }
  };

  // Complete Work Order Modal (Explicit Completion)
  const handleOpenCompleteModal = (wo: WorkOrder) => {
    setCompleteTargetWO(wo);
    setCompletionRootCause(wo.rootCause || "");
    setCompletionActionTaken(wo.actionTaken || "");
    setCompletionNotes(wo.completionNotes || "");
    setCompletionAttachment(null);
  };

  const handleConfirmComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeTargetWO || !completionRootCause.trim() || !completionActionTaken.trim() || saving) return;

    const updated: Partial<WorkOrder> = {
      status: "Completed",
      completionTime: "Just now",
      rootCause: completionRootCause.trim(),
      actionTaken: completionActionTaken.trim(),
      completionNotes: completionNotes.trim() || undefined,
      attachmentName: completionAttachment || completeTargetWO.attachmentName,
      postCleaningRequired: completeTargetWO.locationType === "Guest Room",
      hkHandoverStatus: completeTargetWO.locationType === "Guest Room" ? "Post-Maintenance Cleaning Req." : undefined,
      timeline: [
        ...completeTargetWO.timeline,
        {
          time: "Just now",
          action: "Maintenance work reported Completed by technician/vendor",
          user: currentUser.name,
          remark: `Root Cause: ${completionRootCause.trim()} | Action: ${completionActionTaken.trim()}`,
        },
      ],
    };

    if (savingLockRef.current) return;
    savingLockRef.current = true;
    setSaving(true);
    try {
      const saved = await mntWorkOrderService.update(completeTargetWO.id, updated);
      await reloadWorkOrders();
      if (selectedWorkOrder?.id === completeTargetWO.id) setSelectedWorkOrder(saved);
      setCompleteTargetWO(null);
      setToastMessage(`✓ Work Order #${completeTargetWO.woNumber} marked as Completed. Ready for Maintenance verification.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to complete work order");
    } finally {
      savingLockRef.current = false;
      setSaving(false);
    }
  };

  // Verify & Sign-off Modal (Auto-captures Verifier)
  const handleOpenVerifyModal = (wo: WorkOrder) => {
    setVerifyTargetWO(wo);
    setVerificationResult("Pass");
    setVerificationNotes("");
  };

  const handleConfirmVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyTargetWO || saving) return;

    const verifierName = currentUser.name || "Chief Engineer";
    const verifierTimestamp = "Today, " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (savingLockRef.current) return;
    savingLockRef.current = true;
    setSaving(true);
    try {
      if (verificationResult === "Pass") {
        const updated: Partial<WorkOrder> = {
          status: "Closed",
          verifiedBy: verifierName,
          verifiedAt: verifierTimestamp,
          verificationResult: "Pass",
          verificationNotes: verificationNotes.trim() || "Work inspected and verified acceptable. Work order closed.",
          timeline: [
            ...verifyTargetWO.timeline,
            { time: "Just now", action: `Verification PASSED by ${verifierName}`, user: verifierName },
            { time: "Just now", action: "Work Order Closed", user: verifierName },
          ],
        };

        const saved = await mntWorkOrderService.update(verifyTargetWO.id, updated);
        await reloadWorkOrders();
        if (selectedWorkOrder?.id === verifyTargetWO.id) setSelectedWorkOrder(saved);
        setVerifyTargetWO(null);
        setToastMessage(`✓ Work Order #${verifyTargetWO.woNumber} verified (Pass) and Closed.`);
      } else {
        const updated: Partial<WorkOrder> = {
          status: "In Progress",
          verifiedBy: verifierName,
          verifiedAt: verifierTimestamp,
          verificationResult: "Needs Rework",
          verificationNotes: verificationNotes.trim() || "Verification failed. Sent back for technician rework.",
          reopenedReason: `Verification Needs Rework: ${verificationNotes.trim()}`,
          timeline: [
            ...verifyTargetWO.timeline,
            { time: "Just now", action: `Verification FAILED (Needs Rework) by ${verifierName}`, user: verifierName, remark: verificationNotes.trim() },
            { time: "Just now", action: "Work Order Reopened for Rework", user: verifierName },
          ],
        };

        const saved = await mntWorkOrderService.update(verifyTargetWO.id, updated);
        await reloadWorkOrders();
        if (selectedWorkOrder?.id === verifyTargetWO.id) setSelectedWorkOrder(saved);
        setVerifyTargetWO(null);
        setToastMessage(`⚠️ Work Order #${verifyTargetWO.woNumber} marked Needs Rework and reopened.`);
      }
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to verify work order");
    } finally {
      savingLockRef.current = false;
      setSaving(false);
    }
  };

  // Add Spare Part Modal (Stores Reference Usage Recording)
  const handleOpenAddPartModal = (wo: WorkOrder) => {
    setAddPartTargetWO(wo);
    const firstCat = sparePartsCatalog[0];
    if (firstCat) {
      setSelectedCatalogPartId(firstCat.id);
      setCustomPartName(firstCat.partName);
      setCustomProductCode(firstCat.productCode);
      setPartUnitCost(firstCat.unitCost);
      setStoresReference(firstCat.ref);
    } else {
      setSelectedCatalogPartId("");
      setCustomPartName("");
      setCustomProductCode("");
      setPartUnitCost(0);
      setStoresReference("");
    }
    setPartQuantity(1);
  };

  const handleConfirmAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addPartTargetWO || saving) return;

    const finalPartName = customPartName.trim() || "Spare Part";
    const finalProductCode = customProductCode.trim() || "MNT-PART";
    const total = partQuantity * partUnitCost;

    const newPartItem: SparePartUsed = {
      id: `part-${Date.now()}`,
      partName: finalPartName,
      productCode: finalProductCode,
      quantity: partQuantity,
      unitCost: partUnitCost,
      totalCost: total,
      storesReference: storesReference.trim() || undefined,
    };

    const existingParts = addPartTargetWO.partsUsed || [];
    const updatedParts = [...existingParts, newPartItem];
    const newPartsCost = updatedParts.reduce((sum, p) => sum + p.totalCost, 0);

    const updated: Partial<WorkOrder> = {
      partsUsed: updatedParts,
      partsCost: newPartsCost,
      totalCost: newPartsCost + (addPartTargetWO.externalServiceCost || 0),
      timeline: [
        ...addPartTargetWO.timeline,
        {
          time: "Just now",
          action: `Recorded material usage: ${partQuantity}x ${finalPartName} (Ref: ${storesReference.trim() || "Stores Request"})`,
          user: currentUser.name,
        },
      ],
    };

    if (savingLockRef.current) return;
    savingLockRef.current = true;
    setSaving(true);
    try {
      const saved = await mntWorkOrderService.update(addPartTargetWO.id, updated);
      await reloadWorkOrders();
      if (selectedWorkOrder?.id === addPartTargetWO.id) setSelectedWorkOrder(saved);
      setAddPartTargetWO(null);
      setToastMessage(`✓ Recorded spare part "${finalPartName}" usage.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to add spare part");
    } finally {
      savingLockRef.current = false;
      setSaving(false);
    }
  };

  // Reopen Modal
  const handleOpenReopenModal = (wo: WorkOrder) => {
    setReopenTargetWO(wo);
    setReopenReason("");
  };

  const handleConfirmReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenTargetWO || !reopenReason.trim() || saving) return;

    const updated: Partial<WorkOrder> = {
      status: "In Progress",
      reopenedReason: reopenReason.trim(),
      timeline: [
        ...reopenTargetWO.timeline,
        { time: "Just now", action: `Work Order Reopened: ${reopenReason.trim()}`, user: currentUser.name },
      ],
    };

    if (savingLockRef.current) return;
    savingLockRef.current = true;
    setSaving(true);
    try {
      const saved = await mntWorkOrderService.update(reopenTargetWO.id, updated);
      await reloadWorkOrders();
      if (selectedWorkOrder?.id === reopenTargetWO.id) setSelectedWorkOrder(saved);
      setReopenTargetWO(null);
      setToastMessage(`✓ Work Order #${reopenTargetWO.woNumber} reopened to In Progress.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to reopen work order");
    } finally {
      savingLockRef.current = false;
      setSaving(false);
    }
  };

  // Cancel Modal
  const handleOpenCancelModal = (wo: WorkOrder) => {
    setCancelTargetWO(wo);
    setCancelReason("");
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTargetWO || !cancelReason.trim() || saving) return;

    const updated: Partial<WorkOrder> = {
      status: "Cancelled",
      cancelReason: cancelReason.trim(),
      timeline: [
        ...cancelTargetWO.timeline,
        { time: "Just now", action: `Work Order Cancelled: ${cancelReason.trim()}`, user: currentUser.name },
      ],
    };

    if (savingLockRef.current) return;
    savingLockRef.current = true;
    setSaving(true);
    try {
      const saved = await mntWorkOrderService.update(cancelTargetWO.id, updated);
      await reloadWorkOrders();
      if (selectedWorkOrder?.id === cancelTargetWO.id) setSelectedWorkOrder(saved);
      setCancelTargetWO(null);
      setToastMessage(`Work Order #${cancelTargetWO.woNumber} cancelled.`);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to cancel work order");
    } finally {
      savingLockRef.current = false;
      setSaving(false);
    }
  };

  const handleToggleChecklistItem = async (wo: WorkOrder, itemId: string) => {
    if (saving) return;
    const updatedChecklist = (wo.checklistItems || []).map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    const updated: Partial<WorkOrder> = {
      checklistItems: updatedChecklist,
    };

    if (savingLockRef.current) return;
    savingLockRef.current = true;
    setSaving(true);
    try {
      const saved = await mntWorkOrderService.update(wo.id, updated);
      await reloadWorkOrders();
      if (selectedWorkOrder?.id === wo.id) setSelectedWorkOrder(saved);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to update checklist");
    } finally {
      savingLockRef.current = false;
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 text-sm text-slate-600">Loading work orders...</div>
    );
  }

  return (
    <ModulePageShell
      eyebrow="Maintenance"
      title="Work Orders"
      description="Execution records for approved maintenance jobs, technician & vendor assignments, progress updates, spare parts usage, verification, and activity history."
      breadcrumbs={[
        { label: "Maintenance", href: "/maintenance" },
        { label: "Work Orders" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <Button
          type="button"
          size="sm"
          onClick={handleOpenCreateDrawer}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 h-9 px-3.5 disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Create Work Order
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5 mb-5">
        {/* Card 1: Total Work Orders */}
        <Card className="h-full min-w-0 p-3 sm:p-4.5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Total Work Orders
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-8 sm:w-8">
              <Wrench className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {summaryMetrics.total}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            All dispatched maintenance jobs
          </p>
        </Card>

        {/* Card 2: In Progress */}
        <Card className="h-full min-w-0 p-3 sm:p-4.5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              In Progress
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 sm:h-8 sm:w-8">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {summaryMetrics.inProgress}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            Jobs currently under repair
          </p>
        </Card>

        {/* Card 3: Awaiting Parts */}
        <Card className="h-full min-w-0 p-3 sm:p-4.5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Awaiting Parts
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 sm:h-8 sm:w-8">
              <Package className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {summaryMetrics.awaitingParts}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            Blocked for stores parts
          </p>
        </Card>

        {/* Card 4: Pending Verification */}
        <Card className="h-full min-w-0 p-3 sm:p-4.5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Pending Verification
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 sm:h-8 sm:w-8">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {summaryMetrics.pendingVerification}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            Completed, awaiting engineering sign-off
          </p>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: FRONT OFFICE / REQUESTS INSPIRED TOOLBAR & PILLS
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
              placeholder="Search by WO#, request#, room, location, asset, tech, vendor..."
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
            { id: "ALL", label: "All", count: workOrders.length },
            { id: "New", label: "New", count: workOrders.filter((w) => needsTechnicianAssignment(w)).length },
            { id: "Assigned", label: "Assigned", count: workOrders.filter((w) => w.status === "Assigned" && !isTechnicianUnassigned(w)).length },
            { id: "In Progress", label: "In Progress", count: workOrders.filter((w) => w.status === "In Progress").length },
            { id: "Awaiting Parts", label: "Awaiting Parts", count: workOrders.filter((w) => w.status === "Awaiting Parts").length },
            { id: "Pending Verification", label: "Pending Verification", count: workOrders.filter((w) => w.status === "Completed").length },
            { id: "Closed", label: "Closed", count: workOrders.filter((w) => w.status === "Verified" || w.status === "Closed").length },
            { id: "Cancelled", label: "Cancelled", count: workOrders.filter((w) => w.status === "Cancelled").length },
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

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Status</label>
                <select
                  value={selectedStatusTab}
                  onChange={(e) => {
                    setSelectedStatusTab(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 w-full px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="New">New</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Awaiting Parts">Awaiting Parts</option>
                  <option value="Pending Verification">Pending Verification</option>
                  <option value="Closed">Closed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Work Order Type</label>
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => {
                    setSelectedTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 w-full px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Types</option>
                  <option value="Corrective">Corrective</option>
                  <option value="Preventive">Preventive</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Priority</label>
                <select
                  value={selectedPriorityFilter}
                  onChange={(e) => {
                    setSelectedPriorityFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 w-full px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                  <option value="SAFETY_HAZARD">Safety Hazards Only</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Assignee / Vendor</label>
                <select
                  value={selectedAssigneeFilter}
                  onChange={(e) => {
                    setSelectedAssigneeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 w-full px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Assignees</option>
                  <option value="Ramesh Kumar">Ramesh Kumar (In-House)</option>
                  <option value="Amit Patel">Amit Patel (In-House)</option>
                  <option value="Deepak Rawat">Deepak Rawat (In-House)</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.vendorName}>
                      {v.vendorName} (Vendor)
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
              {selectedRowIds.size} work order{selectedRowIds.size !== 1 ? "s" : ""} selected
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
          SECTION 3: FRONT OFFICE / REQUESTS INSPIRED DATA TABLE
      ───────────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[980px]">
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
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Work Order</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Location</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Issue / Asset</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Assignee</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="w-32 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedWorkOrders.length > 0 ? (
                paginatedWorkOrders.map((wo) => {
                  return (
                    <tr
                      key={wo.id}
                      onClick={() => setSelectedWorkOrder(wo)}
                      className="group cursor-pointer transition-colors hover:bg-emerald-50/30"
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedRowIds.has(wo.id)}
                          onChange={() => toggleOneSelected(wo.id)}
                          className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-500 cursor-pointer"
                          aria-label={`Select ${wo.woNumber}`}
                        />
                      </td>

                      {/* 1. Work Order # & Origin Ref */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <strong className="font-mono font-bold text-slate-900 group-hover:text-emerald-700 transition block">
                          #{wo.woNumber}
                        </strong>
                        <span className="text-xs font-normal text-slate-400 block">
                          {wo.requestRef ? `Ref: #${wo.requestRef}` : wo.sourceRef ? `Source: #${wo.sourceRef}` : "Manual Entry"}
                        </span>
                      </td>

                      {/* 2. Location & Room Block */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="font-medium text-slate-900">{wo.location}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-slate-500">{wo.locationType}</span>
                          {wo.roomBlockType && (
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.2 text-[10px] font-bold border",
                                wo.roomBlockType === "OOO"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              )}
                            >
                              {wo.roomBlockType}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Issue & Asset */}
                      <td className="px-4 py-3.5 max-w-[260px]">
                        <p className="font-medium text-slate-900 line-clamp-1" title={wo.issue}>
                          {wo.issue}
                        </p>
                        {wo.assetName ? (
                          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                            {wo.assetName} {wo.assetCode ? `(${wo.assetCode})` : ""}
                          </p>
                        ) : (
                          <span className="text-xs text-slate-400">General Maintenance</span>
                        )}
                      </td>

                      {/* 4. Type */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-medium border",
                            wo.woType === "Emergency"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : wo.woType === "Preventive"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          )}
                        >
                          {wo.woType}
                        </span>
                      </td>

                      {/* 5. Assignee (In-House vs Vendor) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="font-medium text-slate-900">{wo.technicianName}</p>
                        <span className="text-xs text-slate-500 block">
                          {wo.assignedType === "In-House Staff" ? "In-House Tech" : `Vendor: ${wo.maintenanceVendorName || "External"}`}
                        </span>
                      </td>

                      {/* 6. Priority / Safety Hazard */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          {wo.priority === "Critical" ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
                              Critical
                            </span>
                          ) : wo.priority === "High" ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              High
                            </span>
                          ) : wo.priority === "Medium" ? (
                            <span className="text-xs font-medium text-slate-700">Medium</span>
                          ) : (
                            <span className="text-xs font-normal text-slate-400">Low</span>
                          )}

                          {wo.isSafetyHazard && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200/80 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                              <ShieldAlert className="h-3 w-3 text-rose-600" />
                              Safety Hazard
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 7. Status (Uniform Ring Pill Style) */}
                      <td className="w-36 px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center min-w-[96px] rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset text-center",
                            wo.status === "Completed" || wo.status === "Verified"
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : wo.status === "In Progress"
                              ? "bg-amber-50 text-amber-700 ring-amber-200"
                              : wo.status === "Awaiting Parts"
                              ? "bg-sky-50 text-sky-700 ring-sky-200"
                              : wo.status === "New"
                              ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
                              : wo.status === "Assigned"
                              ? "bg-slate-100 text-slate-700 ring-slate-200"
                              : wo.status === "Closed"
                              ? "bg-slate-100 text-slate-600 ring-slate-200"
                              : "bg-red-50 text-red-700 ring-red-200"
                          )}
                        >
                          {wo.status === "Completed" ? "Completed" : wo.status}
                        </span>
                      </td>

                      {/* 8. Contextual Action Column */}
                      <td className="w-32 px-4 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {needsTechnicianAssignment(wo) && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={saving}
                              onClick={() => handleOpenAssignModal(wo)}
                              className="h-8 rounded-full border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-medium cursor-pointer disabled:opacity-50"
                            >
                              Assign Tech
                            </Button>
                          )}

                          {canStartWork(wo) && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={saving}
                              onClick={() => handleStartWork(wo)}
                              className="h-8 rounded-full border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium cursor-pointer disabled:opacity-50"
                            >
                              Start Work
                            </Button>
                          )}

                          {wo.status === "In Progress" && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenCompleteModal(wo)}
                              className="h-8 rounded-full border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium cursor-pointer"
                            >
                              Complete
                            </Button>
                          )}

                          {wo.status === "Awaiting Parts" && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartWork(wo)}
                              className="h-8 rounded-full border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-medium cursor-pointer"
                            >
                              Parts Received
                            </Button>
                          )}

                          {wo.status === "Completed" && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenVerifyModal(wo)}
                              className="h-8 rounded-full border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-medium cursor-pointer"
                            >
                              Verify
                            </Button>
                          )}

                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Wrench className="h-8 w-8 mx-auto text-slate-300" />
                      <strong className="text-sm font-bold text-slate-800 block">No work orders found</strong>
                      <p className="text-xs text-slate-400">
                        {searchTerm || selectedStatusTab !== "ALL" || selectedTypeFilter !== "ALL" || selectedPriorityFilter !== "ALL" || selectedAssigneeFilter !== "ALL"
                          ? "No records match your active search or filters."
                          : "No work orders scheduled yet. Click 'Create Work Order' to dispatch a new job."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
      </div>

        {/* ─────────────────────────────────────────────────────────────
            SECTION 4: PAGINATION
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
            </select>
            <span className="text-slate-400 pl-2">
              Showing {filteredWorkOrders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, filteredWorkOrders.length)} of {filteredWorkOrders.length} work orders
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
          SECTION 5: CREATE WORK ORDER SLIDE-OUT DRAWER
      ───────────────────────────────────────────────────────────── */}
      {isCreateDrawerOpen && (
        <Drawer
          isOpen={isCreateDrawerOpen}
          onClose={() => setIsCreateDrawerOpen(false)}
          title="Create Work Order"
          maxWidth="md"
        >
          <form onSubmit={handleSaveWorkOrder} className="space-y-4 p-1 text-xs">
            {/* LINK TO APPROVED REQUEST SELECTION */}
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
              <label className="block font-bold text-emerald-950 text-[11px]">
                Inherit Data from Approved Request (Optional)
              </label>
              <select
                value={selectedRequestId}
                onChange={(e) => {
                  const req = requests.find((r) => r.id === e.target.value);
                  if (req) {
                    populateFormFromRequest(req);
                  } else {
                    setSelectedRequestId("");
                    setCreateRequestRef("");
                  }
                }}
                className="w-full p-2 rounded-lg border border-emerald-300 bg-white font-semibold text-xs text-slate-900"
              >
                <option value="">-- Select Approved Request to Inherit --</option>
                {requests
                  .filter((r) => r.status === "Approved" || r.status === "Verified" || r.status === "New" || r.status === "Work Order Created")
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.requestNo} — {r.location} ({r.issueTitle}) [{r.status}]
                    </option>
                  ))}
              </select>

              {createRequestRef && (
                <div className="p-2 rounded-lg bg-emerald-100/70 text-emerald-900 text-[11px] font-medium flex items-center justify-between">
                  <span>✓ Request <strong>{createRequestRef}</strong> findings &amp; verification inherited automatically.</span>
                  <span className="font-mono text-[10px] bg-emerald-200 px-1.5 py-0.5 rounded">No re-entry</span>
                </div>
              )}
            </div>

            {/* Type & Request Number */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Work Order Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={createType}
                  onChange={(e) => setCreateType(e.target.value as WorkOrderType)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs text-slate-900"
                >
                  <option value="Corrective">Corrective Maintenance</option>
                  <option value="Preventive">Preventive Inspection</option>
                  <option value="Emergency">Emergency Breakdown</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Request Number Ref</label>
                <input
                  type="text"
                  placeholder="e.g. REQ-1001"
                  value={createRequestRef}
                  onChange={(e) => setCreateRequestRef(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs text-slate-900"
                />
              </div>
            </div>

            {/* Location Type & Specific Location */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Location Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={createLocationType}
                  onChange={(e) => {
                    const nextType = e.target.value as "Guest Room" | "F&B Area" | "Public Area" | "Back of House";
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
                  Specific Location <span className="text-rose-500">*</span>
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

            {/* Issue Title & Description */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Issue / Job Summary <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AC compressor capacitor replaced & top-up R32 gas"
                value={createIssueTitle}
                onChange={(e) => setCreateIssueTitle(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Detailed Work Scope &amp; Instructions</label>
              <textarea
                rows={2}
                placeholder="Specific instructions or verification notes..."
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs leading-relaxed"
              />
            </div>

            {/* Inherited Verification Data Display */}
            {inheritedFindings && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px]">
                <strong className="text-slate-900 font-bold block">Inherited Request Findings &amp; Recommended Work</strong>
                <p className="text-slate-700"><strong>Findings:</strong> {inheritedFindings}</p>
                <p className="text-slate-700"><strong>Recommended Work:</strong> {inheritedRecommendedWork}</p>
                {inheritedRequiredMaterials && <p className="text-slate-700"><strong>Required Parts:</strong> {inheritedRequiredMaterials}</p>}
                {inheritedEstimatedBudget && <p className="text-slate-700 font-mono"><strong>Budget Estimate:</strong> ₹{inheritedEstimatedBudget}</p>}
              </div>
            )}

            {/* Priority & Safety Hazard */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Priority Level</label>
                <select
                  value={createPriority}
                  onChange={(e) => setCreatePriority(e.target.value as PriorityLevel)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 p-2 rounded-lg border border-rose-200 bg-rose-50/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createIsSafetyHazard}
                    onChange={(e) => setCreateIsSafetyHazard(e.target.checked)}
                    className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-[11px] font-bold text-rose-900">Safety Hazard / LOTO Tag</span>
                </label>
              </div>
            </div>

            {/* EXECUTION METHOD & ASSIGNMENT PATHS */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block font-bold text-slate-800 text-[11px]">
                Execution Method <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCreateExecutionMethod("In-House")}
                  className={cn(
                    "p-2 rounded-lg border font-bold text-xs transition cursor-pointer text-center",
                    createExecutionMethod === "In-House"
                      ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  In-House Technician
                </button>
                <button
                  type="button"
                  onClick={() => setCreateExecutionMethod("Outsource")}
                  className={cn(
                    "p-2 rounded-lg border font-bold text-xs transition cursor-pointer text-center",
                    createExecutionMethod === "Outsource"
                      ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  Outsource AMC Vendor
                </button>
              </div>
            </div>

            {/* CONDITIONAL ASSIGNMENT PATH 1: IN-HOUSE TECHNICIAN */}
            {createExecutionMethod === "In-House" ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <strong className="text-xs font-bold text-slate-900 block">In-House Technician Assignment</strong>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Select On-Duty Technician (HR Data)</label>
                  <select
                    value={createTechnicianName}
                    onChange={(e) => setCreateTechnicianName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                  >
                    {MOCK_ON_DUTY_TECHNICIANS.filter((t) => t.type === "In-House Staff").map((tech) => (
                      <option key={tech.id} value={tech.name}>
                        {tech.name} — {tech.role} ({tech.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Scheduled Date</label>
                    <input
                      type="text"
                      value={createScheduledDate}
                      onChange={(e) => setCreateScheduledDate(e.target.value)}
                      className="w-full p-1.5 rounded border border-slate-200 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Scheduled Time</label>
                    <input
                      type="text"
                      value={createScheduledTime}
                      onChange={(e) => setCreateScheduledTime(e.target.value)}
                      className="w-full p-1.5 rounded border border-slate-200 bg-white text-xs"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* CONDITIONAL ASSIGNMENT PATH 2: OUTSOURCE MAINTENANCE VENDOR MASTER */
              <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-blue-700" /> Maintenance Vendor Master Selection
                  </strong>
                  <span className="text-[9px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">Independent Master</span>
                </div>

                <p className="text-[10px] text-slate-500 italic">
                  Note: Vendor availability is confirmed manually outside PMS via Phone/WhatsApp.
                </p>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Select Maintenance Service Vendor *</label>
                  <select
                    value={createVendorId}
                    onChange={(e) => {
                      const v = vendors.find((ven) => ven.id === e.target.value);
                      if (v) {
                        setCreateVendorId(v.id);
                        setCreateVendorContact(v.phone);
                        setCreateServiceReference(v.serviceReference || "");
                      }
                    }}
                    className="w-full p-2 rounded-lg border border-blue-300 bg-white text-xs font-bold text-slate-900"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vendorName} ({v.serviceCategory} — {v.serviceType})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">External Tech Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Sunil Verma"
                      value={createExternalTechName}
                      onChange={(e) => setCreateExternalTechName(e.target.value)}
                      className="w-full p-1.5 rounded border border-slate-200 bg-white text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Contact Phone</label>
                    <input
                      type="text"
                      value={createVendorContact}
                      onChange={(e) => setCreateVendorContact(e.target.value)}
                      className="w-full p-1.5 rounded border border-slate-200 bg-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Agreed Amount (₹)</label>
                    <input
                      type="number"
                      value={createAgreedAmount}
                      onChange={(e) => setCreateAgreedAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full p-1.5 rounded border border-slate-200 bg-white font-mono font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Contract / AMC Ref #</label>
                    <input
                      type="text"
                      value={createServiceReference}
                      onChange={(e) => setCreateServiceReference(e.target.value)}
                      className="w-full p-1.5 rounded border border-slate-200 bg-white font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CONDITIONAL GUEST ROOM RULES */}
            {createLocationType === "Guest Room" && (
              <div className="p-3 bg-amber-50/40 border border-amber-200 rounded-xl space-y-2.5">
                <strong className="text-xs font-bold text-amber-950 block">Guest Room Rules &amp; Entry Preferences</strong>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">Room Maintenance Block</label>
                  <select
                    value={createRoomBlock}
                    onChange={(e) => setCreateRoomBlock(e.target.value as RoomBlockType | "NONE")}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                  >
                    <option value="NONE">Keep In Service (Minor Repair)</option>
                    <option value="OOS">OOS — Out of Service (Temporary Repair)</option>
                    <option value="OOO">OOO — Out of Order (Major Repair / Cannot Sell)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 text-[11px]">Guest in Room?</label>
                    <select
                      value={createGuestInRoom}
                      onChange={(e) => setCreateGuestInRoom(e.target.value as "Yes" | "No" | "Unknown")}
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
                disabled={saving}
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs px-4 cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {saving ? "Saving..." : "Dispatch Work Order ✓"}
              </Button>
            </div>
          </form>
        </Drawer>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 6: WORK ORDER DETAILS SLIDE-OUT DRAWER
      ───────────────────────────────────────────────────────────── */}
      {selectedWorkOrder && (
        <Drawer
          isOpen={Boolean(selectedWorkOrder)}
          onClose={() => setSelectedWorkOrder(null)}
          title={`Work Order #${selectedWorkOrder.woNumber}`}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full pt-1">
              <div>
                {selectedWorkOrder.status !== "Closed" && selectedWorkOrder.status !== "Cancelled" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenCancelModal(selectedWorkOrder)}
                    className="text-xs font-semibold text-rose-700 hover:bg-rose-50 border-rose-200 rounded-lg cursor-pointer"
                  >
                    Cancel Order
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {needsTechnicianAssignment(selectedWorkOrder) && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={saving}
                    onClick={() => handleOpenAssignModal(selectedWorkOrder)}
                    className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <UserCheck className="h-3.5 w-3.5" /> Assign Technician →
                  </Button>
                )}

                {canStartWork(selectedWorkOrder) && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={saving}
                    onClick={() => handleStartWork(selectedWorkOrder)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Wrench className="h-3.5 w-3.5" /> Start Work →
                  </Button>
                )}

                {(selectedWorkOrder.status === "In Progress" || selectedWorkOrder.status === "Awaiting Parts") && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenProgressModal(selectedWorkOrder)}
                      className="text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      + Add Progress Update
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleOpenCompleteModal(selectedWorkOrder)}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" /> Complete Work Order ✓
                    </Button>
                  </>
                )}

                {selectedWorkOrder.status === "Completed" && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenReopenModal(selectedWorkOrder)}
                      className="text-xs font-semibold text-amber-700 border-amber-200 hover:bg-amber-50 rounded-lg cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Needs Rework
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleOpenVerifyModal(selectedWorkOrder)}
                      className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Verify &amp; Sign-off ✓
                    </Button>
                  </>
                )}

                {(selectedWorkOrder.status === "Closed" || selectedWorkOrder.status === "Verified") && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenReopenModal(selectedWorkOrder)}
                    className="text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reopen Work Order
                  </Button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs p-1">
            {/* Header Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-900">#{selectedWorkOrder.woNumber}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-bold border",
                      selectedWorkOrder.woType === "Emergency"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : selectedWorkOrder.woType === "Preventive"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    )}
                  >
                    {selectedWorkOrder.woType}
                  </span>
                </div>

                {(() => {
                  const b = getWorkOrderStatusBadgeConfig(selectedWorkOrder.status);
                  return (
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold border", b.bg, b.border)}>
                      {b.label}
                    </span>
                  );
                })()}
              </div>

              <h3 className="text-sm font-bold text-slate-900">{selectedWorkOrder.issue}</h3>
              {selectedWorkOrder.description && (
                <p className="text-slate-600 leading-relaxed text-xs">{selectedWorkOrder.description}</p>
              )}
            </div>

            {/* SECTION 1: JOB INFORMATION & INHERITED REQUEST DETAILS */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5">
              <strong className="text-xs font-bold text-slate-900 block border-b border-slate-100 pb-1.5">
                1. Job Information &amp; Location
              </strong>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Location</span>
                  <strong className="text-slate-900 font-semibold">{selectedWorkOrder.location}</strong>
                  <span className="text-[10px] text-slate-400 block">{selectedWorkOrder.locationType}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Origin Request Ref</span>
                  <span className="font-mono text-slate-800">
                    {selectedWorkOrder.requestRef ? `#${selectedWorkOrder.requestRef}` : "Manual Entry"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Asset Equipment</span>
                  <span className="font-semibold text-slate-800">
                    {selectedWorkOrder.assetName || "General Facility"}
                    {selectedWorkOrder.assetCode ? ` (${selectedWorkOrder.assetCode})` : ""}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Priority &amp; Safety</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-bold text-slate-900">{selectedWorkOrder.priority}</span>
                    {selectedWorkOrder.isSafetyHazard && (
                      <span className="rounded bg-rose-600 px-1.5 py-0.2 text-[9px] font-bold text-white uppercase">
                        Safety Hazard
                      </span>
                    )}
                  </div>
                </div>

                {selectedWorkOrder.locationType === "Guest Room" && (
                  <>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Guest In Room?</span>
                      <strong className="text-slate-900">{selectedWorkOrder.guestInRoom || "No"}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Staff Entry Preference</span>
                      <span className="font-semibold text-slate-900">
                        {selectedWorkOrder.entryPreference || "Enter When Guest Absent"}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* INHERITED VERIFICATION FINDINGS */}
              {selectedWorkOrder.verificationFindings && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-[11px] mt-2">
                  <strong className="text-slate-900 font-bold block">Inherited Request Findings &amp; Recommended Work</strong>
                  <p className="text-slate-700"><strong>Findings:</strong> {selectedWorkOrder.verificationFindings}</p>
                  {selectedWorkOrder.recommendedWork && <p className="text-slate-700"><strong>Recommended Work:</strong> {selectedWorkOrder.recommendedWork}</p>}
                  {selectedWorkOrder.requiredMaterials && <p className="text-slate-700"><strong>Required Parts:</strong> {selectedWorkOrder.requiredMaterials}</p>}
                  {selectedWorkOrder.estimatedBudget && <p className="text-slate-700 font-mono"><strong>Budget Estimate:</strong> ₹{selectedWorkOrder.estimatedBudget}</p>}
                </div>
              )}
            </div>

            {/* SECTION 2: ASSIGNMENT & EXECUTION DETAILS */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5">
              <strong className="text-xs font-bold text-slate-900 block border-b border-slate-100 pb-1.5">
                2. Assignment &amp; Execution Details ({selectedWorkOrder.executionMethod || selectedWorkOrder.assignedType})
              </strong>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Assigned Worker / Tech</span>
                  <strong className="text-slate-900">{selectedWorkOrder.technicianName}</strong>
                  <span className="text-[10px] text-slate-400 block">{selectedWorkOrder.assignedType}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Target Due Time</span>
                  <span className="font-mono text-slate-900 font-semibold">{selectedWorkOrder.dueDate}</span>
                </div>

                {selectedWorkOrder.assignedType === "External Vendor" && (
                  <>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Maintenance Vendor</span>
                      <strong className="text-slate-900">{selectedWorkOrder.maintenanceVendorName || selectedWorkOrder.vendorName}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Contact Number</span>
                      <span className="font-mono text-slate-800">{selectedWorkOrder.technicianContact || selectedWorkOrder.vendorContact}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Agreed Vendor Amount</span>
                      <span className="font-mono text-emerald-800 font-bold">₹{selectedWorkOrder.agreedAmount || selectedWorkOrder.externalServiceCost || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Service Ref #</span>
                      <span className="font-mono text-slate-800">{selectedWorkOrder.serviceReference || "—"}</span>
                    </div>
                  </>
                )}

                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Work Started At</span>
                  <span className="font-mono text-slate-700">{selectedWorkOrder.startTime || "Pending Start"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Work Completed At</span>
                  <span className="font-mono text-slate-700">{selectedWorkOrder.completionTime || "—"}</span>
                </div>
              </div>
            </div>

            {/* SECTION 3: MULTI-ISSUE SNAG CHECKLIST */}
            {selectedWorkOrder.checklistItems && selectedWorkOrder.checklistItems.length > 0 && (
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                <strong className="text-xs font-bold text-slate-900 block border-b border-slate-100 pb-1.5">
                  3. Multi-Issue Snag &amp; Task Checklist
                </strong>
                <div className="space-y-1">
                  {selectedWorkOrder.checklistItems.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleChecklistItem(selectedWorkOrder, item.id)}
                        className="h-3.5 w-3.5 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className={item.completed ? "line-through text-slate-400 font-normal" : "text-slate-800 font-semibold"}>
                        {item.description}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 4: PROGRESS UPDATES */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <strong className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-500" /> 4. Manual Progress Updates
                </strong>
                {selectedWorkOrder.status !== "Closed" && selectedWorkOrder.status !== "Cancelled" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenProgressModal(selectedWorkOrder)}
                    className="h-6 px-2 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 rounded"
                  >
                    + Add Progress Update
                  </Button>
                )}
              </div>

              {selectedWorkOrder.progressUpdates && selectedWorkOrder.progressUpdates.length > 0 ? (
                <div className="space-y-2 divide-y divide-slate-100">
                  {selectedWorkOrder.progressUpdates.map((pu) => (
                    <div key={pu.id} className="pt-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{pu.status}</span>
                        <span className="font-mono text-[10px] text-slate-400">{pu.date} {pu.time}</span>
                      </div>
                      <p className="text-slate-700 mt-0.5">{pu.remarks}</p>
                      {pu.partsWaiting && (
                        <p className="text-amber-800 font-medium text-[11px] mt-0.5">⚠️ Waiting for part: {pu.partsWaiting}</p>
                      )}
                      <span className="text-[10px] text-slate-400 block mt-0.5">By {pu.user}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">No progress updates recorded yet.</p>
              )}
            </div>

            {/* SECTION 5: REPAIR COMPLETION & ROOT CAUSE */}
            {(selectedWorkOrder.rootCause || selectedWorkOrder.actionTaken) && (
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                <strong className="text-xs font-bold text-slate-900 block border-b border-slate-100 pb-1.5">
                  5. Repair Completion &amp; Root Cause
                </strong>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Root Cause Identified</span>
                    <p className="text-slate-800 font-medium">{selectedWorkOrder.rootCause}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Action Taken / Corrective Resolution</span>
                    <p className="text-slate-800 font-medium">{selectedWorkOrder.actionTaken}</p>
                  </div>
                  {selectedWorkOrder.completionNotes && (
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">Completion Notes</span>
                      <p className="text-slate-700">{selectedWorkOrder.completionNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECTION 6: SPARE PARTS USAGE (STORES REFERENCE) */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <strong className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-slate-500" /> 6. Spare Parts Used (Stores Reference)
                </strong>
                {selectedWorkOrder.status !== "Closed" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenAddPartModal(selectedWorkOrder)}
                    className="h-6 px-2 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 rounded"
                  >
                    + Record Part Usage
                  </Button>
                )}
              </div>

              {selectedWorkOrder.partsUsed && selectedWorkOrder.partsUsed.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase">
                      <tr>
                        <th className="py-1.5 px-2">Part Name</th>
                        <th className="py-1.5 px-2">Qty</th>
                        <th className="py-1.5 px-2">Unit Cost</th>
                        <th className="py-1.5 px-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedWorkOrder.partsUsed.map((p) => (
                        <tr key={p.id}>
                          <td className="py-1.5 px-2 font-medium text-slate-900">
                            {p.partName}
                            <span className="font-mono text-[10px] text-slate-400 block">
                              Ref: {p.storesReference || p.productCode}
                            </span>
                          </td>
                          <td className="py-1.5 px-2">{p.quantity}</td>
                          <td className="py-1.5 px-2 font-mono">₹{p.unitCost}</td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900">₹{p.totalCost}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-slate-200 text-[11px] font-bold">
                      <tr>
                        <td colSpan={3} className="py-1.5 px-2 text-slate-600">Total Spare Parts Operational Cost</td>
                        <td className="py-1.5 px-2 text-right font-mono text-emerald-700">₹{selectedWorkOrder.partsCost}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">No spare parts recorded for this job.</p>
              )}
            </div>

            {/* SECTION 7: ROOM MAINTENANCE HANDOVER PROTOCOL (INFORMATIONAL ONLY) */}
            {selectedWorkOrder.locationType === "Guest Room" && (
              <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <DoorClosed className="h-3.5 w-3.5 text-amber-700" /> 7. Room Handover Status Indicator
                  </strong>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    {selectedWorkOrder.status === "Completed" || selectedWorkOrder.status === "Verified" || selectedWorkOrder.status === "Closed"
                      ? "Post-Maintenance Cleaning Req."
                      : "Under Active Maintenance"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  ℹ️ <strong>Operational Responsibility:</strong> Housekeeping owns cleaning and inspection. Front Office owns room availability. Maintenance logs handover status only.
                </p>
              </div>
            )}

            {/* SECTION 8: VERIFICATION SIGN-OFF DETAILS */}
            {selectedWorkOrder.verifiedBy && (
              <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-blue-700" /> Engineering Sign-off &amp; Verification
                  </strong>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                      selectedWorkOrder.verificationResult === "Pass"
                        ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                        : "bg-rose-100 text-rose-900 border-rose-300"
                    )}
                  >
                    Result: {selectedWorkOrder.verificationResult || "Pass"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Verified By</span>
                    <strong className="text-slate-900">{selectedWorkOrder.verifiedBy}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">Verified At</span>
                    <span className="font-mono text-slate-800">{selectedWorkOrder.verifiedAt}</span>
                  </div>
                </div>
                {selectedWorkOrder.verificationNotes && (
                  <p className="text-[11px] text-slate-700 pt-1 border-t border-blue-100 mt-1">
                    <strong>Remarks:</strong> {selectedWorkOrder.verificationNotes}
                  </p>
                )}
              </div>
            )}

            {/* SECTION 9: CHRONOLOGICAL ACTIVITY TIMELINE */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
              <strong className="text-xs font-bold text-slate-900 block border-b border-slate-100 pb-1.5">
                8. Chronological Activity Log
              </strong>
              <div className="space-y-2 border-l-2 border-slate-200 pl-3 pt-1">
                {selectedWorkOrder.timeline.map((entry, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800">{entry.action}</span>
                      <span className="font-mono text-slate-400 text-[10px]">{entry.time}</span>
                    </div>
                    {entry.remark && <p className="text-slate-600 text-[11px] mt-0.5">{entry.remark}</p>}
                    <span className="text-[10px] text-slate-400 block">By {entry.user}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Drawer>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 7: ADD PROGRESS UPDATE MODAL
      ───────────────────────────────────────────────────────────── */}
      {progressTargetWO && (
        <Modal
          isOpen={Boolean(progressTargetWO)}
          onClose={() => setProgressTargetWO(null)}
          title={`Log Progress Update — #${progressTargetWO.woNumber}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveProgressUpdate} className="space-y-3.5 p-1 text-xs">
            <p className="text-slate-600">
              Record a work progress update for <strong>#{progressTargetWO.woNumber}</strong> ({progressTargetWO.issue}).
            </p>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Target Job Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={progressStatus}
                onChange={(e) => setProgressStatus(e.target.value as WorkOrderStatus)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
              >
                <option value="In Progress">In Progress — Repair/service underway</option>
                <option value="Awaiting Parts">Awaiting Parts — Work paused for required materials</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Progress Remarks / Updates <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Disassembled AC motor unit. Testing capacitor and cleaning coil..."
                value={progressRemarks}
                onChange={(e) => setProgressRemarks(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs leading-relaxed"
              />
            </div>

            {progressStatus === "Awaiting Parts" && (
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Specify Required / Missing Parts <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 45uF starting capacitor & R32 gas canister"
                  value={partsWaiting}
                  onChange={(e) => setPartsWaiting(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium text-xs text-rose-900"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setProgressTargetWO(null)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs px-4 cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {saving ? "Saving..." : "Save Progress Update ✓"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 8: COMPLETE WORK ORDER MODAL (EXPLICIT COMPLETION)
      ───────────────────────────────────────────────────────────── */}
      {completeTargetWO && (
        <Modal
          isOpen={Boolean(completeTargetWO)}
          onClose={() => setCompleteTargetWO(null)}
          title={`Complete Work Order #${completeTargetWO.woNumber}`}
          maxWidth="md"
        >
          <form onSubmit={handleConfirmComplete} className="space-y-3.5 p-1 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">Work Completion Report</span>
              <strong className="text-slate-900 text-xs block">{completeTargetWO.issue}</strong>
              <span className="text-[10px] text-slate-500">{completeTargetWO.location}</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Root Cause Identified <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                placeholder="e.g. Run capacitor 45uF degraded due to voltage fluctuation..."
                value={completionRootCause}
                onChange={(e) => setCompletionRootCause(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Action Taken / Corrective Resolution <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                placeholder="e.g. Replaced capacitor with OEM spare, tested suction at 130 PSI..."
                value={completionActionTaken}
                onChange={(e) => setCompletionActionTaken(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Final Completion Notes</label>
              <input
                type="text"
                placeholder="e.g. Tested nominal. Ready for Chief Engineer verification."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCompleteTargetWO(null)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs px-4 cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {saving ? "Saving..." : "Submit Completion ✓"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 9: VERIFY & SIGN-OFF MODAL (AUTO-CAPTURES VERIFIER)
      ───────────────────────────────────────────────────────────── */}
      {verifyTargetWO && (
        <Modal
          isOpen={Boolean(verifyTargetWO)}
          onClose={() => setVerifyTargetWO(null)}
          title={`Verification Sign-off — #${verifyTargetWO.woNumber}`}
          maxWidth="md"
        >
          <form onSubmit={handleConfirmVerify} className="space-y-3.5 p-1 text-xs">
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1">
              <strong className="text-slate-900 text-xs block">#{verifyTargetWO.woNumber} — {verifyTargetWO.issue}</strong>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <span><strong>Verified By:</strong> {currentUser.name || "Chief Engineer"} (Logged-in user)</span>
                <span><strong>Verified At:</strong> Current System Time</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Verification Result <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVerificationResult("Pass")}
                  className={cn(
                    "p-2.5 rounded-lg border font-bold text-xs transition cursor-pointer text-center",
                    verificationResult === "Pass"
                      ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  ✓ Pass (Accept &amp; Close)
                </button>
                <button
                  type="button"
                  onClick={() => setVerificationResult("Needs Rework")}
                  className={cn(
                    "p-2.5 rounded-lg border font-bold text-xs transition cursor-pointer text-center",
                    verificationResult === "Needs Rework"
                      ? "bg-rose-700 text-white border-rose-700 shadow-2xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  ⚠️ Needs Rework (Reopen)
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Verification Remarks &amp; Feedback</label>
              <textarea
                rows={2.5}
                placeholder={verificationResult === "Pass" ? "e.g. Inspected on site. Temperature grid nominal." : "e.g. Noise still present in outdoor unit. Requires secondary check."}
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVerifyTargetWO(null)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                size="sm"
                className={cn(
                  "text-white font-bold rounded-lg text-xs px-4 cursor-pointer",
                  verificationResult === "Pass" ? "bg-blue-700 hover:bg-blue-800" : "bg-rose-700 hover:bg-rose-800"
                )}
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {saving
                  ? "Saving..."
                  : verificationResult === "Pass"
                    ? "Sign-off & Close ✓"
                    : "Reopen for Rework ⚠️"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 10: RECORD SPARE PART USAGE MODAL
      ───────────────────────────────────────────────────────────── */}
      {addPartTargetWO && (
        <Modal
          isOpen={Boolean(addPartTargetWO)}
          onClose={() => setAddPartTargetWO(null)}
          title={`Record Spare Part Usage — #${addPartTargetWO.woNumber}`}
          maxWidth="md"
        >
          <form onSubmit={handleConfirmAddPart} className="space-y-3.5 p-1 text-xs">
            <p className="text-slate-500 text-[11px]">
              Record spare parts used on this job. (Purchase &amp; Stores owns stock deduction).
            </p>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Select Part from Catalog <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedCatalogPartId}
                required
                onChange={(e) => {
                  const pid = e.target.value;
                  setSelectedCatalogPartId(pid);
                  const p = sparePartsCatalog.find((part) => part.id === pid);
                  if (p) {
                    setCustomPartName(p.partName);
                    setCustomProductCode(p.productCode);
                    setPartUnitCost(p.unitCost);
                    setStoresReference(p.ref);
                  }
                }}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs text-slate-900"
              >
                {sparePartsCatalog.length === 0 && (
                  <option value="">No active spare parts — add in Masters</option>
                )}
                {sparePartsCatalog.map((part) => (
                  <option key={part.id} value={part.id}>
                    {part.partName} ({part.productCode}) — ₹{part.unitCost}
                  </option>
                ))}
              </select>
              {sparePartsMaster.length === 0 && (
                <p className="mt-1 text-[10px] text-amber-700">
                  Catalog is empty. Add parts under Masters → Spare Parts Catalog.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Quantity</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={partQuantity}
                  onChange={(e) => setPartQuantity(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-bold text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Unit Cost (₹)</label>
                <input
                  type="number"
                  required
                  value={partUnitCost}
                  onChange={(e) => setPartUnitCost(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono font-bold text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Stores Requisition / Reference #</label>
              <input
                type="text"
                placeholder="e.g. STORES-REQ-401"
                value={storesReference}
                onChange={(e) => setStoresReference(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddPartTargetWO(null)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs px-4 cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {saving ? "Saving..." : "Record Usage ✓"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 11: REOPEN WORK ORDER MODAL
      ───────────────────────────────────────────────────────────── */}
      {reopenTargetWO && (
        <Modal
          isOpen={Boolean(reopenTargetWO)}
          onClose={() => setReopenTargetWO(null)}
          title={`Reopen Work Order #${reopenTargetWO.woNumber}`}
          maxWidth="sm"
        >
          <form onSubmit={handleConfirmReopen} className="space-y-3.5 p-1 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Reopen work order <strong>#{reopenTargetWO.woNumber}</strong> for further technician investigation?
            </p>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Reason for Reopening <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2.5}
                required
                placeholder="e.g. Recurred issue / Secondary check required..."
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReopenTargetWO(null)}
                className="rounded-lg text-xs"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={saving}
                size="sm"
                className="bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg text-xs px-4 cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {saving ? "Saving..." : "Confirm Reopen"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 12: CANCEL WORK ORDER MODAL
      ───────────────────────────────────────────────────────────── */}
      {cancelTargetWO && (
        <Modal
          isOpen={Boolean(cancelTargetWO)}
          onClose={() => setCancelTargetWO(null)}
          title={`Cancel Work Order #${cancelTargetWO.woNumber}`}
          maxWidth="sm"
        >
          <form onSubmit={handleConfirmCancel} className="space-y-3.5 p-1 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Are you sure you want to cancel work order <strong>#{cancelTargetWO.woNumber}</strong>?
            </p>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Cancellation Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2.5}
                required
                placeholder="e.g. Duplicate order / Equipment replaced..."
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
                onClick={() => setCancelTargetWO(null)}
                className="rounded-lg text-xs"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={saving}
                size="sm"
                className="bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg text-xs px-4 cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {saving ? "Saving..." : "Confirm Cancellation"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 13: ASSIGN TECHNICIAN MODAL
      ───────────────────────────────────────────────────────────── */}
      {assignTargetWO && (
        <Modal
          isOpen={Boolean(assignTargetWO)}
          onClose={() => !saving && setAssignTargetWO(null)}
          title={`Assign Technician — #${assignTargetWO.woNumber}`}
          maxWidth="sm"
        >
          <form onSubmit={handleAssignTechnician} className="space-y-3.5 p-1 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Assign an in-house technician or outsourced vendor before starting work on{" "}
              <strong>#{assignTargetWO.woNumber}</strong>.
            </p>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5 text-[11px]">Execution Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAssignExecutionMethod("In-House")}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-xs font-semibold cursor-pointer",
                    assignExecutionMethod === "In-House"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  )}
                >
                  In-House Tech
                </button>
                <button
                  type="button"
                  onClick={() => setAssignExecutionMethod("Outsource")}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-xs font-semibold cursor-pointer",
                    assignExecutionMethod === "Outsource"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  )}
                >
                  External Vendor
                </button>
              </div>
            </div>

            {assignExecutionMethod === "In-House" ? (
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  On-Duty Technician <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={assignTechnicianName}
                  onChange={(e) => setAssignTechnicianName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                >
                  {(MOCK_ON_DUTY_TECHNICIANS.length ? MOCK_ON_DUTY_TECHNICIANS : ON_DUTY_TECHNICIANS)
                    .filter((t) => t.type === "In-House Staff")
                    .map((tech) => (
                      <option key={tech.id} value={tech.name}>
                        {tech.name} — {tech.role}
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                    Maintenance Vendor <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={assignVendorId}
                    onChange={(e) => setAssignVendorId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                  >
                    {vendors.length === 0 && <option value="">No vendors available</option>}
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vendorName} — {v.serviceCategory}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">External Technician Name</label>
                  <input
                    type="text"
                    placeholder="Optional field tech name"
                    value={assignExternalTechName}
                    onChange={(e) => setAssignExternalTechName(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => setAssignTargetWO(null)}
                className="rounded-lg text-xs disabled:opacity-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                size="sm"
                className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-lg text-xs px-4 cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                {saving ? "Assigning..." : "Assign & Continue"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </ModulePageShell>
  );
}
