"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import {
  User,
  Clock,
  ClipboardList,
  AlertTriangle,
  Camera,
  FileText,
  CheckCircle2,
  XCircle,
  UserCheck,
  Search,
  ChevronDown,
  Settings,
  AlertCircle,
  Layers,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import type { HKRoom } from "@/components/housekeeping/HousekeepingTypes";
import { AlertBanner } from "@/components/frontoffice/ui/AlertBanner";
import {
  FOPageHeader,
  StatMiniCard,
  FormField,
  SelectInput,
} from "@/components/frontoffice/ui";
import { OperationsToolbar, OperationsFilterDrawer } from "@/components/housekeeping/OperationsToolbar";
import { hkTaskService } from "@/services/housekeeping";
import type { HKTask } from "@/components/housekeeping/HousekeepingTypes";
import {
  buildInspectionQueue,
  formatTaskTimestamp,
  inspectionStats,
  type InspectionQueueItem,
} from "@/components/housekeeping/taskUtils";

interface ChecklistItemState {
  task: string;
  checked: boolean;
  remarks: string;
  showRemarksInput: boolean;
  photo: string | null;
  isFailed: boolean;
  defectReason: string;
  defectSeverity: "Low" | "Medium" | "High";
  defectArea: string;
}



export default function RoomInspection() {
  const {
    rooms,
    history,
    inspectRoom,
    currentUsername,
    currentUserRole,
    setRole,
    refreshFromApi,
    apiConnected,
  } = useHousekeeping();

  const [tasks, setTasks] = useState<HKTask[]>([]);
  const [loading, setLoading] = useState(true);

  const reloadInspectionData = async () => {
    try {
      const taskList = await hkTaskService.list();
      setTasks(taskList);
      await refreshFromApi();
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reloadInspectionData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toast / Banner state
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" | "info" } | null>(null);

  // Simple Toolbar Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);



  // Advanced Filters State
  const [floorFilter, setFloorFilter] = useState("All");
  const [wingFilter, setWingFilter] = useState("All");
  const [roomTypeFilter, setRoomTypeFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [inspectorFilter, setInspectorFilter] = useState("All");
  const [housekeeperFilter, setHousekeeperFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Priority");

  // Selection & Details State
  const [selectedRoomNo, setSelectedRoomNo] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [signatureName, setSignatureName] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Validation States
  const [remarksError, setRemarksError] = useState<string | null>(null);
  const [signatureNameError, setSignatureNameError] = useState<string | null>(null);
  const [signatureCanvasError, setSignatureCanvasError] = useState<string | null>(null);

  // Checklist items state
  const [checklistItems, setChecklistItems] = useState<ChecklistItemState[]>([]);

  // Drafts state map keyed by roomNo
  const [drafts, setDrafts] = useState<
    Record<
      string,
      {
        checklistItems: ChecklistItemState[];
        remarks: string;
        inspectionNotes: string;
        signatureName: string;
        hasSignature: boolean;
        signatureDataUrl: string | null;
      }
    >
  >({});

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const initialCheckRef = useRef(false);

  const queueItems = useMemo(
    () => buildInspectionQueue(rooms, tasks, history),
    [rooms, tasks, history],
  );

  const queueStatusLabel = (item: InspectionQueueItem): string => {
    switch (item.queueStatus) {
      case "awaiting":
        return "Awaiting";
      case "cleaning":
        return "In Progress";
      case "passed":
        return "Passed";
      case "failed":
        return "Failed";
      default:
        return item.room.status;
    }
  };

  // Default tasks template (Dynamically loaded list)
  const defaultTasks = [
    "Bed Made",
    "Bathroom Clean",
    "Dust Removed",
    "Amenities Restocked",
    "Floor Mopped",
    "Mirror Clean",
    "Towels Replaced",
    "Trash Removed",
    "Final Sanitization",
  ];

  // Selected room details
  const selectedQueueItem = useMemo(
    () => queueItems.find((item) => item.room.roomNo === selectedRoomNo) ?? null,
    [queueItems, selectedRoomNo],
  );

  const selectedRoom = useMemo(() => {
    if (selectedQueueItem) return selectedQueueItem.room;
    return rooms.find((r) => r.roomNo === selectedRoomNo) ?? null;
  }, [rooms, selectedRoomNo, selectedQueueItem]);

  const selectedTask = selectedQueueItem?.task ?? null;

  const filterOptions = useMemo(() => {
    const floors = new Set<string>();
    const wings = new Set<string>();
    const types = new Set<string>();
    const housekeepers = new Set<string>();

    for (const item of queueItems) {
      if (item.room.floor) floors.add(item.room.floor);
      if (item.room.wing) wings.add(item.room.wing);
      if (item.room.category) types.add(item.room.category);
      const hk = item.task?.assignedToName ?? item.room.assignedStaff;
      if (hk) housekeepers.add(hk);
    }

    return {
      floors: Array.from(floors).sort(),
      wings: Array.from(wings).sort(),
      types: Array.from(types).sort(),
      housekeepers: Array.from(housekeepers).sort(),
    };
  }, [queueItems]);

  // Overall statistics (from tasks + hk_history)
  const stats = useMemo(() => {
    const { pending, inProgress, passed, failed, avgQualityScore, avgInspectionMins } =
      inspectionStats(tasks, history);
    return {
      pending,
      inProgress,
      passed,
      failed,
      avgQualityScore: avgQualityScore != null ? `${avgQualityScore}%` : "—",
      avgTime: avgInspectionMins != null ? `${avgInspectionMins} mins` : "—",
    };
  }, [tasks, history]);

  // Filtered inspection queue
  const filteredQueue = useMemo(() => {
    let result = [...queueItems];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.room.roomNo.toLowerCase().includes(q) ||
          item.room.category.toLowerCase().includes(q) ||
          (item.task?.taskNumber ?? "").toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "All") {
      if (statusFilter === "Awaiting Inspection") {
        result = result.filter((item) => item.queueStatus === "awaiting");
      } else if (statusFilter === "In Progress") {
        result = result.filter((item) => item.queueStatus === "cleaning");
      } else if (statusFilter === "Passed") {
        result = result.filter((item) => item.queueStatus === "passed");
      } else if (statusFilter === "Failed") {
        result = result.filter((item) => item.queueStatus === "failed");
      }
    }

    if (floorFilter !== "All") {
      result = result.filter((item) => item.room.floor === floorFilter);
    }

    if (wingFilter !== "All") {
      result = result.filter((item) => item.room.wing === wingFilter);
    }

    if (roomTypeFilter !== "All") {
      result = result.filter((item) => item.room.category === roomTypeFilter);
    }

    if (priorityFilter !== "All") {
      result = result.filter((item) => item.priority === priorityFilter);
    }

    if (inspectorFilter !== "All") {
      result = result.filter((item) => item.room.assignedSupervisor === inspectorFilter);
    }

    if (housekeeperFilter !== "All") {
      result = result.filter(
        (item) =>
          (item.task?.assignedToName ?? item.room.assignedStaff) === housekeeperFilter,
      );
    }

    if (sortBy === "Priority") {
      const priorityWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      result.sort(
        (a, b) =>
          (priorityWeight[b.priority] - priorityWeight[a.priority]) ||
          a.room.roomNo.localeCompare(b.room.roomNo),
      );
    } else if (sortBy === "Newest") {
      result.sort((a, b) => b.room.roomNo.localeCompare(a.room.roomNo));
    } else if (sortBy === "Oldest") {
      result.sort((a, b) => a.room.roomNo.localeCompare(b.room.roomNo));
    }

    return result;
  }, [
    queueItems,
    search,
    statusFilter,
    floorFilter,
    wingFilter,
    roomTypeFilter,
    priorityFilter,
    inspectorFilter,
    housekeeperFilter,
    sortBy,
  ]);

  // ESC key handler to close the drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedRoomNo(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Read initial room query parameter on mount (from Cleaning Tasks deep link)
  useEffect(() => {
    if (typeof window !== "undefined" && !initialCheckRef.current) {
      const params = new URLSearchParams(window.location.search);
      const room = params.get("room");
      const knownRoom =
        room &&
        (rooms.some((r) => r.roomNo === room) ||
          tasks.some((t) => t.roomNo === room || t.roomId === room));
      if (knownRoom) {
        setSelectedRoomNo(room);
        setStatusFilter("Awaiting Inspection");
        initialCheckRef.current = true;
      }
    }
  }, [rooms, tasks]);

  // Sync selectedRoomNo back to URL query parameters
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const currentRoomParam = url.searchParams.get("room");

      if (selectedRoomNo) {
        if (currentRoomParam !== selectedRoomNo) {
          url.searchParams.set("room", selectedRoomNo);
          window.history.replaceState({}, "", url.pathname + url.search);
        }
      } else {
        if (currentRoomParam !== null) {
          url.searchParams.delete("room");
          window.history.replaceState({}, "", url.pathname + url.search);
        }
      }
    }
  }, [selectedRoomNo]);

  // Initialize/Reset selected room panel data (Checking drafts)
  useEffect(() => {
    if (!selectedRoomNo) {
      setChecklistItems([]);
      return;
    }

    // Reset validations
    setRemarksError(null);
    setSignatureNameError(null);
    setSignatureCanvasError(null);

    if (drafts[selectedRoomNo]) {
      const draft = drafts[selectedRoomNo];
      setChecklistItems(draft.checklistItems);
      setRemarks(draft.remarks);
      setInspectionNotes(draft.inspectionNotes);
      setSignatureName(draft.signatureName);
      setHasSignature(draft.hasSignature);
    } else {
      setChecklistItems(
        defaultTasks.map((task) => ({
          task,
          checked: true,
          remarks: "",
          showRemarksInput: false,
          photo: null,
          isFailed: false,
          defectReason: "",
          defectSeverity: "Medium",
          defectArea: task.toLowerCase().includes("bathroom") || task.toLowerCase().includes("towels") ? "Bathroom" : "Bedroom",
        }))
      );
      setRemarks("");
      setInspectionNotes("");
      setSignatureName(currentUsername || "");
      setHasSignature(false);
    }
    setShowHistory(false);
  }, [selectedRoomNo]);

  // Digital Signature Canvas drawing configurations
  useEffect(() => {
    if (!selectedRoomNo || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 340;
    canvas.height = rect.height || 112;

    ctx.strokeStyle = "#1e3a8a";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (drafts[selectedRoomNo]?.signatureDataUrl) {
      const img = new Image();
      img.src = drafts[selectedRoomNo].signatureDataUrl || "";
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      setHasSignature(true);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  }, [selectedRoomNo, drafts]);

  // Coordinates helper for responsive digital signatures
  const getCanvasMousePos = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    let clientX, clientY;
    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getCanvasMousePos(e, canvas);
    if (!pos) return;

    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setSignatureCanvasError(null);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getCanvasMousePos(e, canvas);
    if (!pos) return;

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDraw = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);

    if (selectedRoomNo && drafts[selectedRoomNo]) {
      setDrafts((prev) => ({
        ...prev,
        [selectedRoomNo]: {
          ...prev[selectedRoomNo],
          hasSignature: false,
          signatureDataUrl: null,
        },
      }));
    }
  };

  // Checklist updates
  const handleCheckChange = (index: number, val: boolean) => {
    setChecklistItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          checked: val,
          isFailed: !val,
          defectReason: !val ? item.defectReason || `${item.task} issue` : "",
        };
      })
    );
  };

  const toggleItemRemarks = (index: number) => {
    setChecklistItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          showRemarksInput: !item.showRemarksInput,
        };
      })
    );
  };

  const updateItemRemarks = (index: number, val: string) => {
    setChecklistItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          remarks: val,
        };
      })
    );
  };

  const triggerAttachPhoto = (index: number) => {
    setChecklistItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          photo: item.photo ? null : `evidence-img-${idx + 1}.jpg`,
        };
      })
    );
  };

  const removeItemPhoto = (index: number) => {
    setChecklistItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          photo: null,
        };
      })
    );
  };

  const updateItemDefect = (index: number, key: keyof ChecklistItemState, val: string) => {
    setChecklistItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          [key]: val,
        };
      })
    );
  };

  // Calculated Metrics
  const passedItemsCount = useMemo(() => {
    return checklistItems.filter((i) => i.checked).length;
  }, [checklistItems]);

  const qualityScore = useMemo(() => {
    if (checklistItems.length === 0) return 0;
    return Math.round((passedItemsCount / checklistItems.length) * 100);
  }, [passedItemsCount, checklistItems]);

  // Validation
  const isInspectionFailed = useMemo(() => {
    return checklistItems.some((i) => !i.checked);
  }, [checklistItems]);

  const isRemarksInvalid = isInspectionFailed && !remarks.trim();

  const passBlockReason = useMemo(() => {
    if (selectedQueueItem?.queueStatus === "passed") {
      return "This room has already passed inspection.";
    }
    if (selectedQueueItem?.queueStatus === "failed") {
      return "This room failed inspection — send back to cleaning first.";
    }
    if (selectedQueueItem?.queueStatus === "cleaning") {
      return "Housekeeper is still cleaning — mark complete on Cleaning Tasks, then pass/fail here.";
    }
    if (selectedQueueItem?.queueStatus !== "awaiting") {
      return "Complete and mark the cleaning task on Cleaning Tasks before inspecting.";
    }
    if (passedItemsCount !== checklistItems.length) {
      return `Check all ${checklistItems.length} inspection items (${passedItemsCount}/${checklistItems.length} done).`;
    }
    if (!hasSignature) return "Draw your supervisor signature.";
    if (!signatureName.trim()) return "Enter your printed name.";
    return null;
  }, [
    selectedQueueItem,
    passedItemsCount,
    checklistItems.length,
    hasSignature,
    signatureName,
  ]);

  const canPassInspection =
    selectedQueueItem?.queueStatus === "awaiting" &&
    passedItemsCount === checklistItems.length &&
    qualityScore === 100 &&
    hasSignature &&
    signatureName.trim().length > 0;

  const handlePass = () => {
    if (!selectedRoomNo) return;

    let hasErrors = false;

    if (!hasSignature) {
      setSignatureCanvasError("Supervisor signature drawing is required.");
      hasErrors = true;
    }
    if (!signatureName.trim()) {
      setSignatureNameError("Supervisor printed name is required.");
      hasErrors = true;
    }

    if (hasErrors) {
      setToast({ message: "Please resolve validation errors before passing inspection.", variant: "error" });
      return;
    }

    inspectRoom(selectedRoomNo, true, signatureName, remarks || "Passed quality inspection.", qualityScore);

    if (drafts[selectedRoomNo]) {
      const copy = { ...drafts };
      delete copy[selectedRoomNo];
      setDrafts(copy);
    }

    void reloadInspectionData();
    
    setToast({ message: `Room ${selectedRoomNo} inspection successfully passed! Released to Vacant Ready.`, variant: "success" });
    setSelectedRoomNo(null);
  };

  const handleReject = () => {
    if (!selectedRoomNo) return;

    if (!remarks.trim()) {
      setRemarksError("Supervisor remarks explaining the rejection defects are required.");
      setToast({ message: "Remarks are required to reject the room.", variant: "error" });
      return;
    }
    setRemarksError(null);

    inspectRoom(selectedRoomNo, false, signatureName, remarks, qualityScore);

    if (drafts[selectedRoomNo]) {
      const copy = { ...drafts };
      delete copy[selectedRoomNo];
      setDrafts(copy);
    }

    void reloadInspectionData();

    setToast({ message: `Room ${selectedRoomNo} inspection rejected and returned to housekeeper cleaning queue.`, variant: "success" });
    setSelectedRoomNo(null);
  };

  const handleSaveDraft = () => {
    if (!selectedRoomNo) return;
    const canvas = canvasRef.current;
    const signatureDataUrl = canvas && hasSignature ? canvas.toDataURL() : null;

    setDrafts((prev) => ({
      ...prev,
      [selectedRoomNo]: {
        checklistItems,
        remarks,
        inspectionNotes,
        signatureName,
        hasSignature,
        signatureDataUrl,
      },
    }));
    
    setToast({ message: `Draft inspection saved locally for Room ${selectedRoomNo}.`, variant: "info" });
    setSelectedRoomNo(null);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (floorFilter !== "All") count++;
    if (wingFilter !== "All") count++;
    if (roomTypeFilter !== "All") count++;
    if (priorityFilter !== "All") count++;
    if (inspectorFilter !== "All") count++;
    if (housekeeperFilter !== "All") count++;
    if (sortBy !== "Priority") count++;
    return count;
  }, [floorFilter, wingFilter, roomTypeFilter, priorityFilter, inspectorFilter, housekeeperFilter, sortBy]);

  // Public Area card mappings
  const borderColors = {
    "Inspection Pending": "border-blue-200 hover:border-blue-400 hover:shadow-blue-100/30 font-semibold",
    "Vacant Ready": "border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-100/30",
    "Vacant Dirty": "border-red-200 hover:border-red-400 hover:shadow-red-100/30",
    "Out of Order": "border-slate-200 hover:border-slate-400 hover:shadow-slate-100/30",
    "Out of Service": "border-slate-200 hover:border-slate-400 hover:shadow-slate-100/30",
    Cleaning: "border-amber-200 hover:border-amber-400 hover:shadow-amber-100/30",
    Occupied: "border-indigo-200 hover:border-indigo-400 hover:shadow-indigo-100/30",
    "Occupied Dirty": "border-red-200 hover:border-red-400 hover:shadow-red-100/30",
    Blocked: "border-slate-200 hover:border-slate-400 hover:shadow-slate-100/30 bg-slate-50/30",
  };

  const statusBadges = {
    "Inspection Pending": "bg-blue-50 text-blue-700 border border-blue-100",
    "Vacant Ready": "bg-emerald-50 text-emerald-700 border border-emerald-100",
    "Vacant Dirty": "bg-red-50 text-red-700 border border-red-100",
    "Out of Order": "bg-slate-100 text-slate-650 border border-slate-200",
    "Out of Service": "bg-slate-100 text-slate-650 border border-slate-200",
    Cleaning: "bg-amber-50 text-amber-700 border border-amber-100 animate-pulse",
    Occupied: "bg-indigo-50 text-indigo-700 border border-indigo-100",
    "Occupied Dirty": "bg-red-50 text-red-700 border border-red-100",
    Blocked: "bg-slate-100 text-slate-600 border border-slate-200",
  };

  return (
    <div className="space-y-5">
      <FOPageHeader
        eyebrow="Operations"
        title="Cleaning Inspection"
        description="Pass or reject completed cleanings from Cleaning Tasks. All supervisor inspection happens here."
        badge={
          <div className="flex items-center gap-2">
            {!apiConnected && (
              <span className="text-[10px] font-semibold text-amber-700">API offline</span>
            )}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-500 font-medium">Role:</span>
            <select
              value={currentUserRole}
              onChange={(e) => setRole(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer pr-1 text-xs"
            >
              <option value="Executive Housekeeper">Executive Housekeeper (Admin)</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Housekeeper">Housekeeper</option>
            </select>
            </div>
          </div>
        }
      />

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatMiniCard label="Awaiting Inspection" value={stats.pending} icon={Clock} accent="#f59e0b" />
        <StatMiniCard label="In Progress" value={stats.inProgress} icon={Sparkles} accent="#f97316" />
        <StatMiniCard label="Passed Today" value={stats.passed} icon={CheckCircle2} accent="#10b981" />
        <StatMiniCard label="Failed Today" value={stats.failed} icon={AlertTriangle} accent="#ef4444" />
        <StatMiniCard label="Avg. Inspection Time" value={stats.avgTime} icon={ClipboardList} accent="#3b82f6" />
      </div>

      {stats.inProgress > 0 && stats.pending === 0 ? (
        <AlertBanner
          variant="info"
          message={`${stats.inProgress} room(s) still being cleaned — visible under In Progress. Mark complete on Cleaning Tasks to enable inspection.`}
        />
      ) : null}

      {/* Standard Operations Toolbar */}
      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search Room number or category…"
        activeFilterCount={activeFiltersCount}
        onOpenFilters={() => setFilterDrawerOpen(true)}
        statusTabs={[
          { id: "All", label: "All" },
          { id: "In Progress", label: "In Progress" },
          { id: "Awaiting Inspection", label: "Awaiting Inspection" },
          { id: "Passed", label: "Passed" },
          { id: "Failed", label: "Failed" },
        ]}
        activeStatusTab={statusFilter}
        onStatusTabChange={setStatusFilter}
      />

      {/* Slide-over Filter Drawer */}
      <OperationsFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filter Cleaning Inspection Queue"
        activeFilterCount={activeFiltersCount}
        onReset={() => {
          setFloorFilter("All");
          setWingFilter("All");
          setRoomTypeFilter("All");
          setPriorityFilter("All");
          setInspectorFilter("All");
          setHousekeeperFilter("All");
        }}
      >
        <div className="space-y-4 select-none">
          <FormField label="Floor">
            <SelectInput
              value={floorFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFloorFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="All">All Floors</option>
              {filterOptions.floors.map((floor) => (
                <option key={floor} value={floor}>
                  {floor}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Wing">
            <SelectInput
              value={wingFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setWingFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="All">All Wings</option>
              {filterOptions.wings.map((wing) => (
                <option key={wing} value={wing}>
                  {wing}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Room Type">
            <SelectInput
              value={roomTypeFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRoomTypeFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="All">All Types</option>
              {filterOptions.types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Priority">
            <SelectInput
              value={priorityFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPriorityFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </SelectInput>
          </FormField>
        </div>
      </OperationsFilterDrawer>

      {/* Main Layout Area: Grid + Right Sidebar Panel */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        {/* Left 3 Columns: Rooms Grid */}
        <div className="space-y-6 xl:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Cleaning Inspection Queue</h2>
                <p className="text-xs text-slate-400">Rooms with completed cleanings awaiting supervisor sign-off</p>
              </div>
              <span className="rounded-full bg-slate-50 border border-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                {filteredQueue.length} room(s) match
              </span>
            </div>

            {loading ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white py-12 px-4 text-center">
                <p className="text-sm text-slate-500">Loading inspection queue…</p>
              </div>
            ) : filteredQueue.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white py-12 px-4 text-center">
                <ClipboardList className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-800">
                  {statusFilter === "Awaiting Inspection"
                    ? "No Rooms Awaiting Inspection"
                    : "No Rooms Match This Filter"}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  {stats.inProgress > 0 && statusFilter === "Awaiting Inspection" ? (
                    <>
                      {stats.inProgress} room(s) still in progress — use the{" "}
                      <button
                        type="button"
                        className="text-emerald-700 font-semibold hover:underline"
                        onClick={() => setStatusFilter("In Progress")}
                      >
                        In Progress
                      </button>{" "}
                      tab. Mark complete on{" "}
                      <Link href="/housekeeping/operations/room-cleaning" className="text-emerald-700 hover:underline font-semibold">
                        Cleaning Tasks
                      </Link>{" "}
                      to inspect here.
                    </>
                  ) : (
                    <>
                      Tasks appear here after housekeeper work starts or completes. Create tasks on{" "}
                      <Link href="/housekeeping/operations/room-cleaning" className="text-emerald-700 hover:underline font-semibold">
                        Cleaning Tasks
                      </Link>
                      .
                    </>
                  )}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredQueue.map((item) => {
                  const room = item.room;
                  const badgeLabel = queueStatusLabel(item);
                  const priority = item.priority;
                  const completedTime = formatTaskTimestamp(item.completedAt);
                  const housekeeper =
                    item.task?.assignedToName ?? room.assignedStaff ?? "Unassigned";
                  const cardBorder =
                    item.queueStatus === "awaiting"
                      ? borderColors["Inspection Pending"]
                      : item.queueStatus === "passed"
                        ? borderColors["Vacant Ready"]
                        : item.queueStatus === "failed"
                          ? borderColors["Vacant Dirty"]
                          : borderColors.Cleaning;
                  const cardBadge =
                    item.queueStatus === "awaiting"
                      ? statusBadges["Inspection Pending"]
                      : item.queueStatus === "passed"
                        ? statusBadges["Vacant Ready"]
                        : item.queueStatus === "failed"
                          ? statusBadges["Vacant Dirty"]
                          : statusBadges.Cleaning;

                  return (
                    <div
                      key={item.key}
                      onClick={() => setSelectedRoomNo(room.roomNo)}
                      className={cn(
                        "flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer",
                        selectedRoomNo === room.roomNo
                          ? "border-emerald-500 ring-2 ring-emerald-100/50 shadow-md scale-[1.01]"
                          : cardBorder || "border-slate-200",
                      )}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                              {room.category}
                            </span>
                            <h3 className="text-xs font-bold text-slate-800 leading-tight mt-0.5">
                              Room {room.roomNo}
                              {item.task?.taskNumber ? (
                                <span className="text-slate-400 font-semibold"> · {item.task.taskNumber}</span>
                              ) : null}
                            </h3>
                          </div>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase shrink-0 border",
                              cardBadge || "bg-slate-50 text-slate-650 border-slate-200",
                            )}
                          >
                            {badgeLabel}
                          </span>
                        </div>

                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          <span
                            className={cn(
                              "rounded border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide",
                              priority === "Critical"
                                ? "bg-red-100 text-red-800 border-red-205 animate-pulse"
                                : priority === "High"
                                  ? "bg-red-50 text-red-700 border-red-100"
                                  : priority === "Medium"
                                    ? "bg-amber-50 text-amber-700 border-amber-100"
                                    : "bg-slate-50 text-slate-600 border-slate-200",
                            )}
                          >
                            {priority} Priority
                          </span>
                        </div>

                        <div className="mt-3.5 space-y-1.5 border-t border-slate-50 pt-2.5 text-[10px] text-slate-500 font-medium">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Housekeeper:</span>
                            <span className="font-bold text-slate-700 flex items-center gap-1">
                              <User className="h-3 w-3 text-slate-400" />
                              {housekeeper}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Completed Time:</span>
                            <span className="text-slate-700 font-semibold">{completedTime}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-end gap-1.5">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRoomNo(room.roomNo);
                          }}
                          disabled={item.queueStatus === "cleaning"}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-750 font-bold text-[9px] py-1 px-3 border border-emerald-200 rounded-xl transition-all h-7 disabled:opacity-50"
                        >
                          Inspect
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Sidebar Panel */}
        <div className="xl:col-span-1 space-y-6">
          {/* Today's Inspection Summary Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-800">Today's Summary</h3>
            </div>
            <div className="space-y-3 text-xs font-semibold text-slate-655">
              <div className="bg-slate-50/55 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Pending Check</span>
                <span className="text-sm font-extrabold text-amber-600">{stats.pending}</span>
              </div>
              <div className="bg-slate-50/55 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Passed Today</span>
                <span className="text-sm font-extrabold text-emerald-605">{stats.passed}</span>
              </div>
              <div className="bg-slate-50/55 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Failed Today</span>
                <span className="text-sm font-extrabold text-red-655">{stats.failed}</span>
              </div>
              <div className="bg-slate-50/55 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Avg Quality Score</span>
                <span className="text-sm font-extrabold text-blue-600">{stats.avgQualityScore}</span>
              </div>
              <div className="bg-slate-50/55 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Avg Inspection Time</span>
                <span className="text-sm font-extrabold text-slate-700">{stats.avgTime}</span>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Drawer detailed checks */}
      <Drawer
        open={!!selectedRoomNo}
        onClose={() => setSelectedRoomNo(null)}
        title={`${selectedRoom?.roomNo ? `Room ${selectedRoom.roomNo}` : "Room"} Inspection Quality Details`}
        width="xl"
        footer={
          selectedRoom && (
            <div className="grid w-full grid-cols-3 gap-3">
              <Button
                onClick={handleReject}
                className="bg-[#DC3545] hover:bg-[#c82333] border-[#DC3545] text-white h-10 w-full rounded-lg text-sm font-medium"
              >
                Reject
              </Button>
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                className="h-10 w-full rounded-lg text-sm font-medium"
              >
                Save Draft
              </Button>
              <div className="space-y-1">
                <Button
                  variant="primary"
                  onClick={handlePass}
                  disabled={!canPassInspection}
                  className="h-10 w-full rounded-lg text-sm font-medium"
                >
                  Pass Inspection
                </Button>
                {passBlockReason && !canPassInspection ? (
                  <p className="text-[10px] text-amber-700 font-medium text-center leading-tight">
                    {passBlockReason}
                  </p>
                ) : null}
              </div>
            </div>
          )
        }
      >
        {selectedRoom && (
          <div className="space-y-4 font-semibold text-slate-750">
              
              {/* Card 1: Room Summary Specification Grid */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3 shadow-xs">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5 text-slate-400" /> Room Summary
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-semibold text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Room Number</span>
                    <span className="text-slate-800 font-extrabold">Room {selectedRoom.roomNo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Room Type</span>
                    <span className="text-slate-750">{selectedRoom.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Guest Status</span>
                    <span className="text-slate-750">{selectedRoom.foStatus}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Cleaning Status</span>
                    <span className="text-slate-750">
                      {selectedQueueItem ? queueStatusLabel(selectedQueueItem) : selectedRoom.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Priority Status</span>
                    <span
                      className={cn(
                        "font-bold",
                        (selectedQueueItem?.priority ?? "Medium") === "Critical"
                          ? "text-red-750 animate-pulse"
                          : (selectedQueueItem?.priority ?? "Medium") === "High"
                            ? "text-orange-655"
                            : "text-slate-655",
                      )}
                    >
                      {selectedQueueItem?.priority ?? "Medium"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Floor Level</span>
                    <span className="text-slate-750">{selectedRoom.floor || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Assigned Housekeeper</span>
                    <span className="text-slate-800 font-extrabold">
                      {selectedTask?.assignedToName ?? selectedRoom.assignedStaff ?? "Unassigned"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Cleaning Start</span>
                    <span className="text-slate-600 font-normal">
                      {formatTaskTimestamp(selectedTask?.startedAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Cleaning Finish</span>
                    <span className="text-slate-600 font-normal">
                      {formatTaskTimestamp(selectedTask?.completedAt ?? selectedQueueItem?.completedAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Inspection Due</span>
                    <span className="text-slate-600 font-normal">
                      {formatTaskTimestamp(selectedTask?.completedAt ?? selectedQueueItem?.completedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Quality Score Bar */}
              <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-455 font-bold uppercase tracking-wider block">
                      Calculated Quality Score
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className={cn(
                        "text-3xl font-extrabold tracking-tight",
                        qualityScore >= 80 ? "text-emerald-600" : "text-red-650"
                      )}>
                        {qualityScore}%
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">score</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800 block">Inspection Progress</span>
                    <span className="text-xs text-slate-500 font-semibold mt-0.5 block">
                      {passedItemsCount} / {checklistItems.length} Checked
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-350",
                      qualityScore >= 80 ? "bg-emerald-600" : "bg-red-500"
                    )}
                    style={{ width: `${qualityScore}%` }}
                  />
                </div>
              </div>

              {/* Card 3: Inspection Checklist Items */}
              <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-3 shadow-sm">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider border-b border-slate-50 pb-1.5">
                  <ClipboardList className="h-4 w-4 text-emerald-700" /> Inspection Checklist
                </h4>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {checklistItems.map((item, idx) => (
                    <div key={item.task} className="flex flex-col gap-2 rounded-xl border border-slate-100 p-3 bg-white hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start justify-between gap-2.5">
                        <label className="flex items-start gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={(e) => handleCheckChange(idx, e.target.checked)}
                            className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className={cn(
                            "text-xs font-semibold text-slate-700",
                            !item.checked && "text-red-655 font-bold"
                          )}>
                            {item.task}
                          </span>
                        </label>

                        <div className="flex items-center gap-1.5">
                          {!item.checked && (
                            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[8px] font-extrabold text-red-755 uppercase tracking-wide">
                              Failed
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => toggleItemRemarks(idx)}
                            className={cn(
                              "p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-650",
                              item.remarks && "text-blue-600"
                            )}
                            title="Add Note"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerAttachPhoto(idx)}
                            className={cn(
                              "p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-650",
                              item.photo && "text-emerald-600"
                            )}
                            title="Capture Photo"
                          >
                            <Camera className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Item Remarks Input */}
                      {item.showRemarksInput && (
                        <div className="pl-7 pr-2">
                          <input
                            type="text"
                            value={item.remarks}
                            onChange={(e) => updateItemRemarks(idx, e.target.value)}
                            placeholder="Add specific remarks..."
                            className="w-full text-xs border border-slate-205 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                          />
                        </div>
                      )}

                      {/* Photo Attachment Placeholder */}
                      {item.photo && (
                        <div className="pl-7 flex items-center gap-2 text-[10px] text-slate-500 font-semibold">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                            📷 {item.photo}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItemPhoto(idx)}
                            className="text-red-550 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      )}

                      {/* Defect sub-form if unchecked */}
                      {!item.checked && (
                        <div className="ml-7 mt-1.5 p-3 rounded-lg border border-red-100 bg-red-50/20 space-y-2.5 text-xs text-slate-700 font-bold">
                          <div className="text-[9px] font-extrabold text-red-700 uppercase tracking-wider flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-red-655" /> Defect Report
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] text-slate-400 font-bold block mb-0.5">Reason *</label>
                              <input
                                type="text"
                                value={item.defectReason}
                                onChange={(e) => updateItemDefect(idx, "defectReason", e.target.value)}
                                placeholder="Bathroom Mirror Dirty"
                                className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-400 font-bold block mb-0.5">Severity</label>
                              <select
                                value={item.defectSeverity}
                                onChange={(e) =>
                                  updateItemDefect(idx, "defectSeverity", e.target.value as any)
                                }
                                className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 bg-white focus:outline-none"
                              >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] text-slate-400 font-bold block mb-0.5">Area</label>
                              <input
                                type="text"
                                value={item.defectArea}
                                onChange={(e) => updateItemDefect(idx, "defectArea", e.target.value)}
                                placeholder="Bathroom"
                                className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none font-semibold"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-400 font-bold block mb-0.5">Assign Back To</label>
                              <div className="w-full text-xs bg-slate-100 border border-slate-200 text-slate-655 rounded px-2 py-1.5">
                                {selectedTask?.assignedToName ?? selectedRoom.assignedStaff ?? "Unassigned"}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 4: Inspector Remarks & Signature canvas */}
              <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-3 shadow-sm">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Supervisor Remarks {isInspectionFailed && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => {
                    setRemarks(e.target.value);
                    if (e.target.value.trim()) setRemarksError(null);
                  }}
                  placeholder={
                    isInspectionFailed
                      ? "Describe the defect reasons in detail (Required)..."
                      : "General supervisor inspection remarks (Optional)..."
                  }
                  maxLength={250}
                  className={cn(
                    "w-full rounded-xl border p-2.5 h-20 text-xs focus:outline-none focus:ring-1 font-semibold text-slate-750",
                    remarksError
                      ? "border-red-500 focus:ring-red-500 bg-red-50/5"
                      : "border-slate-200 focus:ring-emerald-500 focus:border-emerald-500"
                  )}
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                  {remarksError ? (
                    <span className="text-red-505 font-bold">{remarksError}</span>
                  ) : (
                    isRemarksInvalid && (
                      <span className="text-red-500 font-bold">* Remarks required for rejected rooms.</span>
                    )
                  )}
                  <span className="ml-auto">{remarks.length} / 250 characters</span>
                </div>
              </div>

              {/* Card 5: Digital Signature pad */}
              <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-3 shadow-sm">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Digital Signature Sign-off <span className="text-red-500">*</span>
                </label>
                <div
                  className={cn(
                    "relative rounded-xl border bg-slate-50 overflow-hidden",
                    signatureCanvasError ? "border-red-500" : "border-slate-200"
                  )}
                >
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                    onTouchStart={startDraw}
                    onTouchMove={draw}
                    onTouchEnd={stopDraw}
                    className="cursor-crosshair w-full block h-28 bg-white"
                  />
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="absolute right-2.5 bottom-2.5 text-[9px] font-extrabold text-red-650 hover:text-red-750 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-sm"
                  >
                    Clear Signature
                  </button>
                </div>
                {signatureCanvasError && (
                  <span className="text-red-500 text-[10px] font-bold block">{signatureCanvasError}</span>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-slate-655">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Printed Name *</label>
                    <input
                      type="text"
                      value={signatureName}
                      onChange={(e) => {
                        setSignatureName(e.target.value);
                        if (e.target.value.trim()) setSignatureNameError(null);
                      }}
                      placeholder="Printed Name"
                      className={cn(
                        "w-full text-xs border rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1",
                        signatureNameError
                          ? "border-red-500 focus:ring-red-500"
                          : "border-slate-200 focus:ring-emerald-500"
                      )}
                    />
                    {signatureNameError && (
                      <span className="text-red-500 text-[9px] font-bold block mt-0.5">
                        {signatureNameError}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col justify-end text-[10px] text-slate-500 space-y-1 sm:pl-2">
                    <div>
                      <strong>Date:</strong>{" "}
                      {new Date().toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                    <div>
                      <strong>Time:</strong>{" "}
                      {new Date().toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 6: Inspection Notes Block */}
              <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-2 shadow-sm">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Inspection Notes
                </label>
                <input
                  type="text"
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  placeholder="e.g. Linen smells fresh, floor tiles normal."
                  className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-550 font-medium text-slate-700 bg-white"
                />
              </div>

              {/* Card 7: Collateral Photos Grid */}
              <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-3 shadow-sm">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-1.5">
                  <Camera className="h-4 w-4 text-emerald-750" /> Collateral Photos
                </h4>
                <div className="responsive-image-gallery">
                  <div className="global-image-card-container">
                    <span className="global-image-card-label">
                      Before
                    </span>
                    <div className="global-image-card">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=150&q=80"
                        alt="before-clean"
                      />
                    </div>
                  </div>
                  <div className="global-image-card-container">
                    <span className="global-image-card-label">
                      After
                    </span>
                    <div className="global-image-card">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1540518614846-7eded433c457?w=150&q=80"
                        alt="after-clean"
                      />
                    </div>
                  </div>
                  <div className="global-image-card-container">
                    <span className="global-image-card-label">
                      Inspect
                    </span>
                    <div className="global-image-card">
                      <div className="global-image-card-upload">
                        <Camera className="h-4 w-4" />
                        <span className="text-[8px] font-bold mt-1">Upload</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 8: Inspection History collapsible accordion */}
              <div className="rounded-xl border border-slate-100 bg-white overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/50 transition-colors"
                >
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-slate-400" /> Inspection History
                  </h4>
                  <span className="text-xs text-slate-400 font-bold">
                    {showHistory ? "▲" : "▼"}
                  </span>
                </button>

                {showHistory && (
                  <div className="p-4 space-y-2.5 divide-y divide-slate-100 max-h-48 overflow-y-auto bg-white">
                    {selectedRoom.inspectionHistory && selectedRoom.inspectionHistory.length > 0 ? (
                      selectedRoom.inspectionHistory.map((item) => (
                        <div key={item.id} className="pt-2.5 first:pt-0 text-xs font-semibold">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-slate-700">{item.supervisor}</span>
                            <span
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide border",
                                item.result === "Passed"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                  : "bg-red-50 text-red-700 border-red-100"
                              )}
                            >
                              {item.result}
                            </span>
                          </div>
                          <p className="text-slate-500 text-[10px] font-medium leading-normal">
                            <strong className="text-slate-655 font-bold">Remarks:</strong> {item.remarks}
                          </p>
                          <span className="text-[8px] text-slate-400 block mt-0.5 font-bold">
                            {item.date}, {item.time} | Score: {item.qualityScore}%
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-xs text-slate-400 font-medium">
                        No previous inspection logs for this room.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
        )}
      </Drawer>
    </div>
  );
}
