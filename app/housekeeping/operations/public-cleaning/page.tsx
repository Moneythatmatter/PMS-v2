"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import {
  Trees,
  CheckCircle2,
  Clock,
  Sparkles,
  ClipboardList,
  User,
  Plus,
  AlertCircle,
  AlertTriangle,
  Search,
  RotateCcw,
  Edit2,
  Trash2,
  History,
  Eye,
  Check,
  X,
  ShieldCheck,
  ShieldAlert,
  PlusCircle,
  Settings,
  AlertOctagon,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  Maximize2,
  Play,
  ChevronDown,
  Menu,
  Trash,
  Move
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  Drawer,
  Modal,
  TextInput,
  SelectInput,
  FormField,
  TextAreaInput,
  ConfirmModal,
  FOPageHeader,
  StatMiniCard,
} from "@/components/frontoffice/ui";
import { OperationsToolbar, OperationsFilterDrawer } from "@/components/housekeeping/OperationsToolbar";
import { HKPublicArea, HKPublicAreaChecklistItem } from "@/app/data/housekeeping";



// Default list of tasks based on category
function getDefaultChecklistForCategory(category: string): string[] {
  switch (category) {
    case "Lobby":
      return ["Mop Floor", "Clean Reception Desk", "Dust Furniture", "Clean Glass Doors", "Empty Dustbins", "Air Freshener", "Decorative Plants", "Entrance Area"];
    case "Restaurant":
      return ["Tables Sanitized", "Chairs Cleaned", "Counter Cleaned", "Floor Mopped", "Wash Area Cleaned", "Dustbins Cleared"];
    case "Gym":
      return ["Equipment Sanitized", "Mirrors Cleaned", "Towels Restocked", "Floor Cleaned & Sanitized", "Water Station"];
    case "Pool":
      return ["Water pH Level Check", "Pool Deck Cleared", "Sun Loungers Sanitized", "Fresh Towels Restocked", "Trash Bins Cleared", "Shower Area Cleaned"];
    case "Corridor":
      return ["Carpet Vacuumed", "Handrails Sanitized", "Lighting Checked", "Room Doors Wiped", "Fire Extinguishers Checked"];
    case "Parking":
      return ["Sweeping floor surfaces", "Trash Cans Cleared", "Signages Wiped", "Light Fixtures Inspected", "Oil Spills Cleaned"];
    case "Spa":
      return ["Massage Beds Sanitized", "Clean Towels Restocked", "Sauna Sanitized", "Floor Disinfected", "Aroma Oils Restocked"];
    case "Banquet Hall":
      return ["Carpet Vacuumed", "Stage Area Cleared", "Chairs Arranged", "AV Console Wiped", "Trash Bins Emptied"];
    case "Washroom":
    case "Restroom":
      return ["Toilets Sanitized", "Mirrors Wiped", "Hand Wash Restocked", "Hand Towels Restocked", "Floors Mopped", "Air Freshener"];
    case "Garden":
      return ["Mow Lawn", "Water Flowers", "Trim Bushes", "Clear Fallen Leaves", "Walkways Swept", "Trash Bins Cleared"];
    default:
      return ["Sweep & mop floor", "Sanitize surfaces", "Empty trash bins"];
  }
}

export default function PublicAreaCleaning() {
  const {
    publicAreas,
    staff,
    checklists,
    currentUserRole,
    currentUsername,
    setRole,
    startCleaningPublicArea,
    completeCleaningPublicArea,
    verifyCleaningPublicArea,
    assignStaffPublicArea,
    blockPublicArea,
    configurePublicAreaChecklist,
    addPublicArea,
    updatePublicArea,
    deletePublicArea,
  } = useHousekeeping();

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterFloor, setFilterFloor] = useState("all");
  const [filterStaff, setFilterStaff] = useState("all");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Popover & Draft Filter States
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [draftCategory, setDraftCategory] = useState("all");
  const [draftPriority, setDraftPriority] = useState("all");
  const [draftFloor, setDraftFloor] = useState("all");
  const [draftStaff, setDraftStaff] = useState("all");
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync draft states when popover opens
  const handleTogglePopover = () => {
    if (!isFilterPopoverOpen) {
      setDraftCategory(filterCategory);
      setDraftPriority(filterPriority);
      setDraftFloor(filterFloor);
      setDraftStaff(filterStaff);
    }
    setIsFilterPopoverOpen((prev) => !prev);
  };

  const handleApplyFilters = () => {
    setFilterCategory(draftCategory);
    setFilterPriority(draftPriority);
    setFilterFloor(draftFloor);
    setFilterStaff(draftStaff);
    setIsFilterPopoverOpen(false);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterCategory !== "all") count++;
    if (filterPriority !== "all") count++;
    if (filterFloor !== "all") count++;
    if (filterStaff !== "all") count++;
    return count;
  }, [filterCategory, filterPriority, filterFloor, filterStaff]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsFilterPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Selection & Console Drawer State
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [checkedTasks, setCheckedTasks] = useState<string[]>([]);
  const [remarks, setRemarks] = useState("");
  const [supervisorNotes, setSupervisorNotes] = useState("");
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Assignment states inside the console drawer (populated from area details)
  const [assignedHousekeeper, setAssignedHousekeeper] = useState("");
  const [assignedSupervisor, setAssignedSupervisor] = useState("");
  const [assignedPriority, setAssignedPriority] = useState<HKPublicArea["priority"]>("Medium");
  const [assignedFrequency, setAssignedFrequency] = useState("");
  const [assignedDuration, setAssignedDuration] = useState("");
  const [assignedNextCleaning, setAssignedNextCleaning] = useState("");

  const [historyAreaId, setHistoryAreaId] = useState<string | null>(null);

  // Admin and CRUD Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTemplateDrawerOpen, setIsTemplateDrawerOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<string | null>(null);

  // Form States for CRUD
  const [newArea, setNewArea] = useState({
    name: "",
    category: "Lobby" as HKPublicArea["category"],
    floor: "Ground Floor",
    location: "",
    assignedStaff: "",
    supervisor: "Ramesh Kumar",
    cleaningFrequency: "Every 2 Hours",
    priority: "Medium" as HKPublicArea["priority"],
    status: "Dirty" as HKPublicArea["status"],
    nextCleaning: "",
    lastCleaned: "",
    estDuration: "30 mins",
    inspectionStatus: "None" as HKPublicArea["inspectionStatus"],
  });

  const [editAreaForm, setEditAreaForm] = useState<Partial<HKPublicArea> & { id: string }>({
    id: "",
    name: "",
    category: "Lobby",
    floor: "Ground Floor",
    location: "",
    assignedStaff: "",
    supervisor: "Ramesh Kumar",
    cleaningFrequency: "Every 2 Hours",
    priority: "Medium",
    status: "Dirty",
    nextCleaning: "",
    estDuration: "30 mins",
    inspectionStatus: "None",
  });

  // Checklist Template Drawer Configuration State
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<HKPublicArea["category"]>("Lobby");
  const [editingTasks, setEditingTasks] = useState<string[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [templateDuration, setTemplateDuration] = useState("30 mins");
  const [templateFrequency, setTemplateFrequency] = useState("Every 2 Hours");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Role Switcher Options
  const roleOptions = [
    { label: "Executive Housekeeper (Admin)", value: "Executive Housekeeper" },
    { label: "Supervisor", value: "Supervisor" },
    { label: "Housekeeper (Meena)", value: "Housekeeper" }
  ];

  // Selected entities based on selection state
  const selectedArea = useMemo(() => {
    return publicAreas.find((a) => a.id === selectedAreaId) || null;
  }, [publicAreas, selectedAreaId]);

  const historyArea = useMemo(() => {
    return publicAreas.find((a) => a.id === historyAreaId) || null;
  }, [publicAreas, historyAreaId]);

  // Sync checklist template editor tasks when template drawer category changes
  useEffect(() => {
    if (isTemplateDrawerOpen) {
      setTemplateName(`${selectedTemplateCategory} Checklist Template`);
      const template = checklists.find(
        (c) => c.type === "Public-Area" && c.name.toLowerCase().includes(selectedTemplateCategory.toLowerCase())
      );
      
      // Look up typical frequency and duration from existing public areas as default values
      const matchingArea = publicAreas.find(a => a.category === selectedTemplateCategory);
      setTemplateDuration(matchingArea?.estDuration ?? "30 mins");
      setTemplateFrequency(matchingArea?.cleaningFrequency ?? "Every 2 Hours");

      if (template) {
        setEditingTasks(template.items);
      } else {
        setEditingTasks(getDefaultChecklistForCategory(selectedTemplateCategory));
      }
    }
  }, [selectedTemplateCategory, isTemplateDrawerOpen, checklists, publicAreas]);

  // Prepopulate Drawer elements when Console Drawer opens
  useEffect(() => {
    if (selectedArea) {
      setCheckedTasks(selectedArea.checklist.filter(c => c.completed).map(c => c.task));
      setAssignedHousekeeper(selectedArea.assignedStaff);
      setAssignedSupervisor(selectedArea.supervisor);
      setAssignedPriority(selectedArea.priority);
      setAssignedFrequency(selectedArea.cleaningFrequency);
      setAssignedDuration(selectedArea.estDuration);
      setAssignedNextCleaning(selectedArea.nextCleaning);
      setRemarks("");
      setSupervisorNotes("");
    }
  }, [selectedArea]);

  // Compute KPI stats dynamically
  const stats = useMemo(() => {
    const total = publicAreas.length;
    const clean = publicAreas.filter((a) => a.status === "Clean" || a.status === "Inspected").length;
    const dirty = publicAreas.filter((a) => a.status === "Dirty" || a.status === "Assigned").length;
    const cleaning = publicAreas.filter((a) => a.status === "Cleaning").length;
    const pendingInspection = publicAreas.filter((a) => a.status === "Pending Inspection").length;

    return { total, clean, dirty, cleaning, pendingInspection };
  }, [publicAreas]);

  // Filter lists options
  const uniqueFloors = useMemo(() => {
    return Array.from(new Set(publicAreas.map((a) => a.floor))).sort();
  }, [publicAreas]);

  const uniqueStaff = useMemo(() => {
    return Array.from(new Set(publicAreas.map((a) => a.assignedStaff).filter(Boolean))).sort();
  }, [publicAreas]);

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(publicAreas.map((a) => a.category))).sort();
  }, [publicAreas]);

  const housekeepersList = useMemo(() => {
    return staff.filter((s) => s.role === "Housekeeper");
  }, [staff]);

  const supervisorsList = useMemo(() => {
    return staff.filter((s) => s.role === "Supervisor" || s.name.includes("Ramesh"));
  }, [staff]);

  // Categories for template configuration sidebar
  const categoriesList: HKPublicArea["category"][] = [
    "Lobby",
    "Restaurant",
    "Corridor",
    "Gym",
    "Pool",
    "Spa",
    "Parking",
    "Washroom",
    "Banquet Hall",
    "Garden"
  ];

  // Filters and Search Logic
  const filteredAreas = useMemo(() => {
    return publicAreas.filter((area) => {
      const matchSearch =
        area.name.toLowerCase().includes(search.toLowerCase()) ||
        area.location.toLowerCase().includes(search.toLowerCase()) ||
        area.assignedStaff.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        filterStatus === "all" ||
        (filterStatus === "clean" && (area.status === "Clean" || area.status === "Inspected")) ||
        (filterStatus === "dirty" && (area.status === "Dirty" || area.status === "Assigned")) ||
        (filterStatus === "cleaning" && area.status === "Cleaning") ||
        (filterStatus === "pending" && area.status === "Pending Inspection") ||
        (filterStatus === "blocked" && area.status === "Blocked");

      const matchCategory = filterCategory === "all" || area.category === filterCategory;
      const matchPriority = filterPriority === "all" || area.priority === filterPriority;
      const matchFloor = filterFloor === "all" || area.floor === filterFloor;
      const matchStaff = filterStaff === "all" || area.assignedStaff === filterStaff;

      return matchSearch && matchStatus && matchCategory && matchPriority && matchFloor && matchStaff;
    });
  }, [publicAreas, search, filterStatus, filterCategory, filterPriority, filterFloor, filterStaff]);

  // Dynamically compute Alerts
  const alerts = useMemo(() => {
    const list: { id: string; type: "overdue" | "missed" | "pending" | "staff" | "priority"; message: string; areaId: string; areaName: string }[] = [];

    publicAreas.forEach((area) => {
      if (area.priority === "High" && (area.status === "Dirty" || area.status === "Assigned")) {
        list.push({
          id: `alert-high-${area.id}`,
          type: "priority",
          message: `High Priority area "${area.name}" is currently dirty.`,
          areaId: area.id,
          areaName: area.name,
        });
      }

      if (area.status === "Pending Inspection") {
        list.push({
          id: `alert-insp-${area.id}`,
          type: "pending",
          message: `"${area.name}" completed. Inspection sign-off pending.`,
          areaId: area.id,
          areaName: area.name,
        });
      }

      if ((area.status === "Dirty" || area.status === "Cleaning") && (!area.assignedStaff || area.assignedStaff === "Unassigned" || area.assignedStaff === "")) {
        list.push({
          id: `alert-staff-${area.id}`,
          type: "staff",
          message: `"${area.name}" is dirty but has no housekeeper assigned.`,
          areaId: area.id,
          areaName: area.name,
        });
      }

      if (area.status === "Dirty" && area.nextCleaning.includes("Jul")) {
        list.push({
          id: `alert-overdue-${area.id}`,
          type: "overdue",
          message: `Scheduled cleaning for "${area.name}" is overdue.`,
          areaId: area.id,
          areaName: area.name,
        });
      }
    });

    return list;
  }, [publicAreas]);

  // Reset all search filters
  const handleResetFilters = () => {
    setSearch("");
    setFilterStatus("all");
    setFilterCategory("all");
    setFilterPriority("all");
    setFilterFloor("all");
    setFilterStaff("all");
    setDraftCategory("all");
    setDraftPriority("all");
    setDraftFloor("all");
    setDraftStaff("all");
    setIsFilterPopoverOpen(false);
  };

  // Open Drawer Console
  const handleOpenDrawer = (area: HKPublicArea) => {
    setSelectedAreaId(area.id);
  };

  // Checklist completion check
  const handleToggleTask = (task: string) => {
    if (currentUserRole !== "Housekeeper" && currentUserRole !== "Executive Housekeeper") return;
    setCheckedTasks((prev) =>
      prev.includes(task) ? prev.filter((t) => t !== task) : [...prev, task]
    );
  };

  // Save Checklist Progress without workflow status transition
  const handleSaveProgress = () => {
    if (!selectedAreaId) return;
    // Map current checkboxes back to selected area checklist
    const updatedChecklist = selectedArea?.checklist.map((item) => ({
      ...item,
      completed: checkedTasks.includes(item.task),
    })) || [];

    updatePublicArea(selectedAreaId, {
      checklist: updatedChecklist,
    });
    
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
  };

  // Housekeeper starts cleaning
  const handleStartCleaning = (id: string) => {
    startCleaningPublicArea(id);
    setCheckedTasks([]);
  };

  // Housekeeper submits cleaning for inspection
  const handleCompleteCleaning = (id: string) => {
    completeCleaningPublicArea(id, checkedTasks, remarks);
    setSelectedAreaId(null);
  };

  // Supervisor inspects
  const handleVerifyInspection = (id: string, approved: boolean) => {
    verifyCleaningPublicArea(id, approved, supervisorNotes);
    setSelectedAreaId(null);
  };

  // Save assignment changes in console drawer (Supervisor / Admin)
  const handleSaveAssignment = () => {
    if (!selectedAreaId) return;
    // Determine status: if dirty and housekeeper assigned -> Assigned
    let status = selectedArea?.status;
    if (status === "Dirty" && assignedHousekeeper) {
      status = "Assigned";
    }

    updatePublicArea(selectedAreaId, {
      assignedStaff: assignedHousekeeper,
      supervisor: assignedSupervisor,
      priority: assignedPriority,
      cleaningFrequency: assignedFrequency,
      estDuration: assignedDuration,
      nextCleaning: assignedNextCleaning,
      status: status
    });
    
    alert("Assignment changes saved successfully.");
  };

  // Supervisor quick mark clean
  const handleQuickMarkClean = (id: string) => {
    const area = publicAreas.find(a => a.id === id);
    if (!area) return;
    const nowStr = new Date().toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    updatePublicArea(id, {
      status: "Clean",
      inspectionStatus: "Passed",
      lastCleaned: nowStr,
      checklist: area.checklist.map(c => ({ ...c, completed: true })),
      history: [
        {
          id: `HPA-${String(Date.now()).slice(-6)}`,
          date: nowStr,
          housekeeper: area.assignedStaff || "Staff",
          supervisor: currentUsername,
          duration: area.estDuration || "30 mins",
          status: "Clean",
          remarks: "Quick clean audit approved by " + currentUsername,
        },
        ...area.history
      ]
    });
  };

  // Admin add area submit
  const handleAddAreaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPublicArea(newArea);
    setIsAddModalOpen(false);
    // Reset form
    setNewArea({
      name: "",
      category: "Lobby",
      floor: "Ground Floor",
      location: "",
      assignedStaff: "",
      supervisor: "Ramesh Kumar",
      cleaningFrequency: "Every 2 Hours",
      priority: "Medium",
      status: "Dirty",
      nextCleaning: "",
      lastCleaned: "",
      estDuration: "30 mins",
      inspectionStatus: "None",
    });
  };

  // Open Edit Modal
  const handleOpenEditModal = (area: HKPublicArea) => {
    setEditAreaForm({
      id: area.id,
      name: area.name,
      category: area.category,
      floor: area.floor,
      location: area.location,
      assignedStaff: area.assignedStaff,
      supervisor: area.supervisor,
      cleaningFrequency: area.cleaningFrequency,
      priority: area.priority,
      status: area.status,
      nextCleaning: area.nextCleaning,
      estDuration: area.estDuration,
      inspectionStatus: area.inspectionStatus,
    });
    setIsEditModalOpen(true);
  };

  // Admin edit area submit
  const handleEditAreaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePublicArea(editAreaForm.id, editAreaForm);
    setIsEditModalOpen(false);
  };

  // Admin delete confirm
  const handleDeleteAreaClick = (id: string) => {
    setAreaToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (areaToDelete) {
      deletePublicArea(areaToDelete);
      setIsDeleteConfirmOpen(false);
      setAreaToDelete(null);
    }
  };

  // --- Checklist Templates Drawer Handlers ---
  const handleAddTask = () => {
    setEditingTasks((prev) => [...prev, ""]);
  };

  const handleDeleteTask = (index: number) => {
    setEditingTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateTaskText = (index: number, text: string) => {
    setEditingTasks((prev) => {
      const next = [...prev];
      next[index] = text;
      return next;
    });
  };

  const handleResetTemplate = () => {
    setEditingTasks(getDefaultChecklistForCategory(selectedTemplateCategory));
  };

  const handleSaveChecklistTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const tasks = editingTasks
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    configurePublicAreaChecklist(selectedTemplateCategory, tasks, templateDuration, templateFrequency);
    setIsTemplateDrawerOpen(false);
  };

  // HTML5 Drag & Drop Logic for reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    setEditingTasks((prev) => {
      const result = [...prev];
      const [removed] = result.splice(draggedIndex, 1);
      result.splice(targetIndex, 0, removed);
      return result;
    });
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-5">
      <FOPageHeader
        eyebrow="Operations"
        title="Public Area Cleaning"
        description="Manage and verify cleaning schedules for hotel public areas such as lobby, restaurant, gym, pool, corridors, parking, spa, banquet hall, and washrooms."
        badge={
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-slate-500 font-medium">Role:</span>
            <select
              value={currentUserRole}
              onChange={(e) => setRole(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer pr-1 text-xs"
            >
              {roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        }
        action={
          currentUserRole === "Executive Housekeeper" && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 rounded-xl h-9 px-3.5 shadow-sm transition-all whitespace-nowrap shrink-0"
              >
                <Plus className="h-4 w-4" /> Add Public Area
              </Button>
              <Button
                onClick={() => setIsTemplateDrawerOpen(true)}
                variant="outline"
                className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 font-semibold text-xs flex items-center justify-center gap-1.5 rounded-xl h-9 px-3.5 shadow-sm transition-all whitespace-nowrap shrink-0"
              >
                <Settings className="h-4 w-4 text-emerald-600" /> Checklist Templates
              </Button>
            </div>
          )
        }
      />

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatMiniCard label="Total Areas" value={stats.total} icon={Layers} accent="#64748b" />
        <StatMiniCard label="Clean" value={stats.clean} icon={CheckCircle2} accent="#10b981" />
        <StatMiniCard label="Dirty" value={stats.dirty} icon={AlertCircle} accent="#ef4444" />
        <StatMiniCard label="Cleaning" value={stats.cleaning} icon={Clock} accent="#f59e0b" />
        <StatMiniCard label="Pending Verify" value={stats.pendingInspection} icon={ClipboardList} accent="#3b82f6" />
      </div>

      {/* Standard Operations Toolbar */}
      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search public area, location or housekeeper…"
        activeFilterCount={activeFiltersCount}
        onOpenFilters={() => setFilterDrawerOpen(true)}
        statusTabs={[
          { id: "all", label: "All" },
          { id: "clean", label: "Clean & Inspected" },
          { id: "dirty", label: "Dirty & Assigned" },
          { id: "cleaning", label: "In Cleaning" },
          { id: "pending", label: "Pending Inspection" },
          { id: "blocked", label: "Blocked / Closed" },
        ]}
        activeStatusTab={filterStatus}
        onStatusTabChange={setFilterStatus}
      />

      {/* Slide-over Filter Drawer */}
      <OperationsFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filter Public Area Operations"
        activeFilterCount={activeFiltersCount}
        onReset={() => {
          setFilterCategory("all");
          setFilterPriority("all");
          setFilterFloor("all");
          setFilterStaff("all");
        }}
      >
        <div className="space-y-4 select-none">
          <FormField label="Area Type">
            <SelectInput
              value={filterCategory}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterCategory(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Types</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Priority">
            <SelectInput
              value={filterPriority}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterPriority(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </SelectInput>
          </FormField>

          <FormField label="Floor">
            <SelectInput
              value={filterFloor}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterFloor(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Floors</option>
              {uniqueFloors.map((floor) => (
                <option key={floor} value={floor}>
                  {floor}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Assigned Staff">
            <SelectInput
              value={filterStaff}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStaff(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Staff</option>
              {uniqueStaff.map((staffMember) => (
                <option key={staffMember} value={staffMember}>
                  {staffMember}
                </option>
              ))}
            </SelectInput>
          </FormField>
        </div>
      </OperationsFilterDrawer>

      {/* Main Layout Area: Grid + Right Alerts Panel */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        {/* Left 3 Columns: Filters + Cards Grid */}
        <div className="space-y-6 xl:col-span-3">{filteredAreas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-sm">
              <ClipboardList className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800 text-sm">No Public Areas Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                We couldn't find any public areas matching your search criteria. Try modifying your filter values or create a new space.
              </p>
              <Button
                onClick={handleResetFilters}
                className="mt-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl px-4 py-2"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAreas.map((area) => {
                const totalTasks = area.checklist.length;
                const completedTasks = area.checklist.filter((item) => item.completed).length;
                const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                // Color-coded borders based on status
                const borderColors = {
                  Dirty: "border-red-200 hover:border-red-400 hover:shadow-red-100/30",
                  Assigned: "border-indigo-200 hover:border-indigo-400 hover:shadow-indigo-100/30",
                  Cleaning: "border-amber-200 hover:border-amber-400 hover:shadow-amber-100/30 ring-2 ring-amber-100/50 bg-amber-50/5",
                  "Pending Inspection": "border-blue-200 hover:border-blue-400 hover:shadow-blue-100/30",
                  Inspected: "border-teal-200 hover:border-teal-400 hover:shadow-teal-100/30",
                  Clean: "border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-100/30",
                  Blocked: "border-slate-200 hover:border-slate-400 hover:shadow-slate-100/30 bg-slate-50/30",
                };

                const statusBadges = {
                  Dirty: "bg-red-50 text-red-700 border border-red-100",
                  Assigned: "bg-indigo-50 text-indigo-700 border border-indigo-100",
                  Cleaning: "bg-amber-50 text-amber-700 border border-amber-100 animate-pulse",
                  "Pending Inspection": "bg-blue-50 text-blue-700 border border-blue-100",
                  Inspected: "bg-teal-50 text-teal-700 border border-teal-100",
                  Clean: "bg-emerald-50 text-emerald-700 border border-emerald-100",
                  Blocked: "bg-slate-100 text-slate-600 border border-slate-200",
                };

                const priorityColors = {
                  High: "bg-red-50 text-red-700 border-red-100",
                  Medium: "bg-amber-50 text-amber-700 border-amber-100",
                  Low: "bg-slate-50 text-slate-600 border-slate-200",
                };

                return (
                  <div
                    key={area.id}
                    onClick={() => handleOpenDrawer(area)}
                    className={cn(
                      "flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer",
                      borderColors[area.status] || "border-slate-200"
                    )}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                            {area.category}
                          </span>
                          <h3 className="text-xs font-bold text-slate-800 leading-tight mt-0.5">{area.name}</h3>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                            {area.floor} • <span className="text-slate-400">{area.location}</span>
                          </p>
                        </div>
                        <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold uppercase shrink-0 border", statusBadges[area.status])}>
                          {area.status}
                        </span>
                      </div>

                      {/* Priorities and Badges */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <span className={cn("rounded border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide", priorityColors[area.priority])}>
                          {area.priority} Priority
                        </span>
                        
                        {area.inspectionStatus !== "None" && (
                          <span className={cn(
                            "rounded border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide bg-slate-50 text-slate-600 border-slate-200"
                          )}>
                            Insp: {area.inspectionStatus}
                          </span>
                        )}
                      </div>

                      {/* Checklist Progress Bar */}
                      {area.status !== "Blocked" && (
                        <div className="mt-3.5 space-y-1">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-slate-400 font-semibold uppercase tracking-wider">Sanit checklist</span>
                            <span className="font-bold text-slate-700">{percent}% ({completedTasks}/{totalTasks})</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-300",
                                percent === 100 ? "bg-emerald-600" :
                                percent >= 50 ? "bg-amber-500" : "bg-red-500"
                              )}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Core Details List (Collapsed by default, no accordions) */}
                      <div className="mt-3.5 space-y-1.5 border-t border-slate-50 pt-2.5 text-[10px] text-slate-500 font-medium">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Housekeeper:</span>
                          <span className="font-bold text-slate-700 flex items-center gap-1">
                            <User className="h-3 w-3 text-slate-400" />
                            {area.assignedStaff || "Unassigned"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Last Cleaning:</span>
                          <span className="text-slate-700 font-semibold">{area.lastCleaned || "Never"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions - Drawer Console Trigger Pattern */}
                    <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-end gap-1.5">
                      {/* Quick Mark Clean */}
                      {(currentUserRole === "Executive Housekeeper" || currentUserRole === "Supervisor") &&
                        area.status !== "Clean" && area.status !== "Inspected" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickMarkClean(area.id);
                            }}
                            className="p-1.5 rounded-xl border border-emerald-100 bg-emerald-50/20 hover:bg-emerald-50 text-emerald-600 transition-colors shrink-0"
                            title="Mark Clean"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                      )}

                      {/* View History Logs */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setHistoryAreaId(area.id);
                        }}
                        className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shrink-0"
                        title="View History Logs"
                      >
                        <History className="h-3.5 w-3.5 text-slate-400" />
                      </button>

                      {/* Admin/Supervisor actions */}
                      {(currentUserRole === "Executive Housekeeper" || currentUserRole === "Supervisor") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(area);
                          }}
                          className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shrink-0"
                          title="Edit Details"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                        </button>
                      )}
                      {currentUserRole === "Executive Housekeeper" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAreaClick(area.id);
                          }}
                          className="p-1.5 rounded-xl border border-red-100 bg-red-50/20 hover:bg-red-50 text-red-600 transition-colors shrink-0"
                          title="Delete Area"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Column: Alerts Panel (Collapses/Fits below on mobile) */}
        <div className="xl:col-span-1 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertOctagon className="h-4 w-4 text-red-600" />
                  Active Cleaning Alerts
                </h3>
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-extrabold text-red-600">
                  {alerts.length}
                </span>
              </div>

              {/* Alerts List */}
              <div className="mt-4 space-y-2 max-h-[450px] overflow-y-auto pr-1 sidebar-scroll">
                {alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <ShieldCheck className="h-8 w-8 text-emerald-600 mx-auto opacity-70 mb-2" />
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">System Status Good</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">No overdue items or staff shortages found.</p>
                  </div>
                ) : (
                  alerts.map((alert) => {
                    const alertStyles = {
                      priority: "bg-red-50/50 border-red-100 text-red-700",
                      pending: "bg-blue-50/50 border-blue-100 text-blue-700",
                      staff: "bg-amber-50/50 border-amber-100 text-amber-700",
                      overdue: "bg-red-50/50 border-red-100 text-red-700",
                      missed: "bg-slate-50 border-slate-200 text-slate-700",
                    };

                    return (
                      <div
                        key={alert.id}
                        onClick={() => {
                          const area = publicAreas.find(a => a.id === alert.areaId);
                          if (area) handleOpenDrawer(area);
                        }}
                        className={cn(
                          "cursor-pointer rounded-xl border p-3 flex gap-2.5 items-start text-[10px] transition-all hover:bg-slate-50 hover:shadow-xs",
                          alertStyles[alert.type] || "bg-slate-50"
                        )}
                      >
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 animate-bounce text-red-500" />
                        <div>
                          <p className="font-bold text-slate-800">{alert.areaName}</p>
                          <p className="text-slate-500 font-medium mt-0.5 leading-relaxed">{alert.message}</p>
                          <span className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1 mt-1.5 hover:text-emerald-700">
                            Perform Action <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Summary Reference Info */}
            <div className="mt-6 border-t border-slate-100 pt-4 text-[10px] text-slate-400 leading-relaxed bg-slate-50/50 -mx-4 -mb-4 p-4 rounded-b-2xl">
              <div className="flex gap-2 items-start">
                <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-700">PMS Operations Policy:</h4>
                  <p className="mt-1">
                    Areas must be inspected by a supervisor after every cleaning cycle. Failed inspections automatically mark the area as <strong className="text-red-600">Dirty</strong> for housekeeper reclean.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upgraded Slide-over Drawer: Public Area Cleaning Console */}
      <Drawer
        open={!!selectedAreaId}
        onClose={() => setSelectedAreaId(null)}
        title={`${selectedArea?.name || "Public Area"} Cleaning Console`}
        width="lg"
      >
        {selectedArea && (
          <div className="space-y-6">
            
            {/* 1. Operational Progress Timeline */}
            {selectedArea.status !== "Blocked" ? (
              <div className="py-2 border-b border-slate-100 pb-4">
                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-3">Cleaning Workflow Status</h4>
                <div className="flex items-center justify-between">
                  {["Dirty", "Assigned", "Cleaning", "Pending Inspection", "Inspected", "Clean"].map((step, idx, arr) => {
                    const stepsMap = ["Dirty", "Assigned", "Cleaning", "Pending Inspection", "Inspected", "Clean"];
                    const currentIdx = stepsMap.indexOf(selectedArea.status);
                    const isCompleted = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;
                    
                    return (
                      <React.Fragment key={step}>
                        {idx > 0 && (
                          <div className={cn(
                            "h-0.5 flex-1 transition-colors duration-300",
                            idx <= currentIdx ? "bg-emerald-600" : "bg-slate-200"
                          )} />
                        )}
                        <div className="flex flex-col items-center relative">
                          <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-extrabold transition-all duration-300 border shadow-xs",
                            isCurrent ? "bg-emerald-600 border-emerald-700 text-white scale-110 ring-2 ring-emerald-100" :
                            isCompleted ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                            "bg-white border-slate-200 text-slate-400"
                          )}>
                            {isCompleted && !isCurrent ? <Check className="h-2.5 w-2.5" /> : idx + 1}
                          </div>
                          <span className={cn(
                            "absolute top-6 text-[7.5px] font-bold uppercase tracking-wider whitespace-nowrap hidden md:block",
                            isCurrent ? "text-emerald-700 font-extrabold" : "text-slate-400"
                          )}>
                            {step.split(" ")[0]}
                          </span>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
                <div className="h-2" />
              </div>
            ) : (
              <div className="rounded-xl bg-slate-100 border border-slate-200 p-3 text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                <Info className="h-4 w-4 shrink-0 text-slate-400" />
                <span>This area is currently <strong>Blocked</strong> for administrative reasons. Routine cleaning schedule is paused.</span>
              </div>
            )}

            {/* 2. Area Information */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-slate-400" /> Space Specifications
              </h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Space Name</span>
                  <span className="text-slate-700 font-semibold">{selectedArea.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Category Type</span>
                  <span className="text-slate-700 font-semibold">{selectedArea.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Floor Level</span>
                  <span className="text-slate-700 font-semibold">{selectedArea.floor}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Location Details</span>
                  <span className="text-slate-700 font-semibold">{selectedArea.location}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Priority Status</span>
                  <span className={cn(
                    "font-bold",
                    selectedArea.priority === "High" ? "text-red-700" :
                    selectedArea.priority === "Medium" ? "text-amber-700" : "text-slate-600"
                  )}>
                    {selectedArea.priority} Priority
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Remarks / Observations</span>
                  <span className="text-slate-600 font-medium block truncate" title={selectedArea.history[0]?.remarks || "No current issues"}>
                    {selectedArea.history[0]?.remarks || "No current issues"}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Work Assignment & Controls */}
            <div className="space-y-4 rounded-xl border border-slate-100 bg-white p-4">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-50 pb-1.5 flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-slate-400" /> Work Assignment & Controls
              </h4>

              {/* Editable Fields for Supervisor / Admin if not actively cleaning */}
              {selectedArea.status !== "Cleaning" && selectedArea.status !== "Pending Inspection" && (currentUserRole === "Supervisor" || currentUserRole === "Executive Housekeeper") ? (
                <div className="space-y-3 text-xs font-semibold">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Assigned Housekeeper">
                      <SelectInput value={assignedHousekeeper} onChange={(e) => setAssignedHousekeeper(e.target.value)}>
                        <option value="">Unassigned</option>
                        {housekeepersList.map((h) => (
                          <option key={h.id} value={h.name}>{h.name}</option>
                        ))}
                      </SelectInput>
                    </FormField>

                    <FormField label="Assigned Supervisor">
                      <SelectInput value={assignedSupervisor} onChange={(e) => setAssignedSupervisor(e.target.value)}>
                        {supervisorsList.map((s) => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </SelectInput>
                    </FormField>

                    <FormField label="Cleaning Frequency">
                      <TextInput value={assignedFrequency} onChange={(e) => setAssignedFrequency(e.target.value)} placeholder="e.g. Every 2 Hours" />
                    </FormField>

                    <FormField label="Est. Duration">
                      <TextInput value={assignedDuration} onChange={(e) => setAssignedDuration(e.target.value)} placeholder="e.g. 30 mins" />
                    </FormField>

                    <FormField label="Next Scheduled Run">
                      <TextInput value={assignedNextCleaning} onChange={(e) => setAssignedNextCleaning(e.target.value)} placeholder="e.g. 16 Jul 01:00 PM" />
                    </FormField>

                    <FormField label="Priority Rank">
                      <SelectInput value={assignedPriority} onChange={(e) => setAssignedPriority(e.target.value as HKPublicArea["priority"])}>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </SelectInput>
                    </FormField>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button onClick={handleSaveAssignment} className="bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs py-1.5 px-3 rounded-lg">
                      Save Assignment Details
                    </Button>
                  </div>
                </div>
              ) : (
                // Read Only View of assignment details during active progress
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Assigned Housekeeper</span>
                    <span className="text-slate-700 font-bold">{selectedArea.assignedStaff || "Unassigned"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Assigned Supervisor</span>
                    <span className="text-slate-700 font-semibold">{selectedArea.supervisor}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Frequency</span>
                    <span className="text-slate-700 font-semibold">{selectedArea.cleaningFrequency}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Estimated Duration</span>
                    <span className="text-slate-700 font-semibold">{selectedArea.estDuration}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Next Clean Schedule</span>
                    <span className="text-emerald-700 font-bold">{selectedArea.nextCleaning}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Last Cleaned</span>
                    <span className="text-slate-600 font-semibold">{selectedArea.lastCleaned || "Never"}</span>
                  </div>
                </div>
              )}

              {/* Workflow Actions */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                {selectedArea.status === "Blocked" ? (
                  currentUserRole === "Executive Housekeeper" && (
                    <Button
                      onClick={() => {
                        blockPublicArea(selectedArea.id, false);
                        setSelectedAreaId(null);
                      }}
                      className="w-full bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-xl"
                    >
                      Unblock & Reopen Area
                    </Button>
                  )
                ) : selectedArea.status === "Dirty" || selectedArea.status === "Assigned" ? (
                  (currentUserRole === "Housekeeper" || currentUserRole === "Executive Housekeeper") ? (
                    <Button
                      onClick={() => handleStartCleaning(selectedArea.id)}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Play className="h-3.5 w-3.5 fill-white" /> Start Cleaning Work
                    </Button>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic text-center">Awaiting assigned Housekeeper to click Start Cleaning.</p>
                  )
                ) : selectedArea.status === "Cleaning" ? (
                  (currentUserRole === "Housekeeper" || currentUserRole === "Executive Housekeeper") ? (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveProgress}
                        className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Settings className="h-3.5 w-3.5 text-slate-400" /> Save Progress
                      </Button>
                      <Button
                        onClick={() => handleCompleteCleaning(selectedArea.id)}
                        disabled={checkedTasks.length === 0}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Submit for Inspection
                      </Button>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic text-center">Cleaning is currently in progress by housekeeper.</p>
                  )
                ) : selectedArea.status === "Pending Inspection" ? (
                  <div className="bg-blue-50 border border-blue-100 text-blue-700 text-[10px] p-2.5 rounded-xl font-medium flex gap-1.5 items-start">
                    <Info className="h-4 w-4 shrink-0 text-blue-500" />
                    <span>Cleaning completed. Supervisor inspection is required in the section below to approve clean status.</span>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] p-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Area Cleaned & Audited successfully.
                  </div>
                )}
                {showSaveSuccess && (
                  <p className="text-[10px] text-emerald-600 text-center font-bold animate-pulse">
                    Checklist progress saved successfully!
                  </p>
                )}
              </div>
            </div>

            {/* 4. Cleaning Checklist Section */}
            {selectedArea.status !== "Blocked" && (
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <ClipboardList className="h-4 w-4 text-emerald-700" /> Cleaning Tasks Checklist
                  </h4>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 rounded-lg px-2 py-0.5">
                    {Math.round((checkedTasks.length / selectedArea.checklist.length) * 100)}% ({checkedTasks.length}/{selectedArea.checklist.length})
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-300"
                    style={{ width: `${Math.round((checkedTasks.length / selectedArea.checklist.length) * 100)}%` }}
                  />
                </div>

                {/* Checklist task rows */}
                <div className="space-y-2 mt-3 max-h-56 overflow-y-auto pr-1 sidebar-scroll">
                  {selectedArea.checklist.map((item, index) => {
                    const isSavedClean = selectedArea.status === "Clean" || selectedArea.status === "Inspected";
                    const isChecked = isSavedClean ? true : checkedTasks.includes(item.task);
                    const isDisabled = selectedArea.status !== "Cleaning" || (currentUserRole !== "Housekeeper" && currentUserRole !== "Executive Housekeeper");

                    return (
                      <label
                        key={index}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border p-3 text-xs transition-colors",
                          isDisabled ? "cursor-not-allowed opacity-80" : "cursor-pointer",
                          isChecked
                            ? "bg-emerald-50/10 border-emerald-100 text-slate-700 font-semibold"
                            : "bg-white border-slate-100 hover:bg-slate-50 text-slate-600"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isDisabled}
                          onChange={() => handleToggleTask(item.task)}
                          className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                        />
                        <span className={cn(isChecked && isSavedClean && "line-through text-slate-400 font-normal")}>
                          {item.task}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* Remarks Textarea for Housekeeper */}
                {selectedArea.status === "Cleaning" && (currentUserRole === "Housekeeper" || currentUserRole === "Executive Housekeeper") && (
                  <FormField label="Remarks / Observation Comments">
                    <TextAreaInput
                      placeholder="Add any comments on low supplies or broken fixtures..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </FormField>
                )}
              </div>
            )}

            {/* 5. Inspection Console */}
            {selectedArea.status === "Pending Inspection" && (
              <div className="space-y-4 border-t border-slate-100 pt-4 bg-slate-50/50 p-4 rounded-xl">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-700 animate-bounce" /> Supervisor Inspection sign-off
                </h4>
                
                {currentUserRole !== "Housekeeper" ? (
                  <div className="space-y-3">
                    <FormField label="Supervisor Verification Notes (Explain failures here)">
                      <TextAreaInput
                        placeholder="Sanitisation approved or list any tasks failed..."
                        value={supervisorNotes}
                        onChange={(e) => setSupervisorNotes(e.target.value)}
                      />
                    </FormField>

                    <div className="flex gap-2 pt-1">
                      <Button
                        onClick={() => handleVerifyInspection(selectedArea.id, true)}
                        className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 shadow-sm"
                      >
                        <ShieldCheck className="h-4 w-4" /> Approve Inspection
                      </Button>
                      <Button
                        onClick={() => {
                          if (!supervisorNotes) {
                            alert("Please enter supervisor notes stating the reason for inspection rejection.");
                            return;
                          }
                          handleVerifyInspection(selectedArea.id, false);
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 shadow-sm"
                      >
                        <ShieldAlert className="h-4 w-4" /> Reject & Reclean
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">Submitted for inspection. Awaiting Supervisor verification.</p>
                )}
              </div>
            )}

            {/* 6. Cleaning History Audit Logs */}
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <History className="h-4 w-4 text-slate-400" /> Previous cleaning logs
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 sidebar-scroll">
                {selectedArea.history.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">No audit logs recorded for this area.</p>
                ) : (
                  selectedArea.history.map((log) => (
                    <div key={log.id} className="border border-slate-100 rounded-xl p-3 bg-white space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-700 text-[10px]">{log.date}</span>
                        <span className={cn(
                          "rounded px-1.5 py-0.5 text-[8px] font-extrabold uppercase border",
                          log.status === "Clean" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                        )}>
                          {log.status === "Clean" ? "Passed" : "Failed"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 font-semibold">
                        <div>Cleaner: <strong className="text-slate-700">{log.housekeeper}</strong></div>
                        <div>Audit: <strong className="text-slate-700">{log.supervisor}</strong></div>
                        <div>Duration: <strong className="text-slate-700">{log.duration}</strong></div>
                      </div>
                      {log.remarks && (
                        <p className="text-[10px] text-slate-400 leading-normal border-t border-slate-50 pt-1.5 mt-1 font-medium italic">
                          "{log.remarks}"
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}
      </Drawer>

      {/* Audit History Modal */}
      <Modal
        open={!!historyAreaId}
        onClose={() => setHistoryAreaId(null)}
        title={`${historyArea?.name || "Public Area"} - Cleaning Audit History`}
        size="lg"
      >
        {historyArea && (
          <div className="space-y-4">
            <p className="text-[10px] text-slate-500">
              Audit trail logs for previous sanitation cycles. Entries are created automatically upon supervisor verification.
            </p>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
                <thead className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wider text-[9px]">
                  <tr>
                    <th className="px-4 py-2.5">Date & Time</th>
                    <th className="px-4 py-2.5">Housekeeper</th>
                    <th className="px-4 py-2.5">Supervisor</th>
                    <th className="px-4 py-2.5">Duration</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {historyArea.history.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400 italic">
                        No previous cleaning history recorded for this area.
                      </td>
                    </tr>
                  ) : (
                    historyArea.history.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-bold">{log.date}</td>
                        <td className="px-4 py-3 whitespace-nowrap flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-600">
                            {log.housekeeper.charAt(0)}
                          </span>
                          {log.housekeeper}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{log.supervisor}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500">{log.duration}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={cn(
                            "rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase border",
                            log.status === "Clean" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                          )}>
                            {log.status === "Clean" ? "Passed" : "Failed"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 leading-normal max-w-xs truncate" title={log.remarks}>
                          {log.remarks}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* CRUD: Add Public Area Modal */}
      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Public Area Space"
        size="md"
      >
        <form onSubmit={handleAddAreaSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Area Name *" required>
              <TextInput
                placeholder="e.g. Grand Banquet Hall"
                value={newArea.name}
                onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Category *">
              <SelectInput
                value={newArea.category}
                onChange={(e) => setNewArea({ ...newArea, category: e.target.value as HKPublicArea["category"] })}
              >
                <option value="Lobby">Lobby</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Corridor">Corridor</option>
                <option value="Gym">Gym</option>
                <option value="Spa">Spa</option>
                <option value="Restroom">Restroom</option>
                <option value="Pool">Pool</option>
                <option value="Parking">Parking</option>
                <option value="Banquet Hall">Banquet Hall</option>
                <option value="Washroom">Washroom</option>
                <option value="Garden">Garden</option>
              </SelectInput>
            </FormField>

            <FormField label="Floor level *">
              <SelectInput
                value={newArea.floor}
                onChange={(e) => setNewArea({ ...newArea, floor: e.target.value })}
              >
                <option value="Basement 2">Basement 2</option>
                <option value="Basement 1">Basement 1</option>
                <option value="Ground Floor">Ground Floor</option>
                <option value="1st Floor">1st Floor</option>
                <option value="2nd Floor">2nd Floor</option>
                <option value="3rd Floor">3rd Floor</option>
                <option value="4th Floor">4th Floor</option>
                <option value="5th Floor">5th Floor</option>
              </SelectInput>
            </FormField>

            <FormField label="Specific Location *">
              <TextInput
                placeholder="e.g. Saffron Wing Banquet Hall"
                value={newArea.location}
                onChange={(e) => setNewArea({ ...newArea, location: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Assigned Housekeeper">
              <SelectInput
                value={newArea.assignedStaff}
                onChange={(e) => setNewArea({ ...newArea, assignedStaff: e.target.value })}
              >
                <option value="">Unassigned</option>
                {staff
                  .filter((s) => s.role === "Housekeeper")
                  .map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
              </SelectInput>
            </FormField>

            <FormField label="Assigned Supervisor">
              <SelectInput
                value={newArea.supervisor}
                onChange={(e) => setNewArea({ ...newArea, supervisor: e.target.value })}
              >
                {staff
                  .filter((s) => s.role === "Supervisor" || s.name.includes("Ramesh"))
                  .map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
              </SelectInput>
            </FormField>

            <FormField label="Cleaning Frequency *">
              <TextInput
                placeholder="e.g. Every 2 Hours, Daily"
                value={newArea.cleaningFrequency}
                onChange={(e) => setNewArea({ ...newArea, cleaningFrequency: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Estimated Duration *">
              <TextInput
                placeholder="e.g. 45 mins"
                value={newArea.estDuration}
                onChange={(e) => setNewArea({ ...newArea, estDuration: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Priority *">
              <SelectInput
                value={newArea.priority}
                onChange={(e) => setNewArea({ ...newArea, priority: e.target.value as HKPublicArea["priority"] })}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </SelectInput>
            </FormField>

            <FormField label="Next Cleaning Schedule *">
              <TextInput
                placeholder="e.g. 16 Jul 04:30 PM"
                value={newArea.nextCleaning}
                onChange={(e) => setNewArea({ ...newArea, nextCleaning: e.target.value })}
                required
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
            >
              Create Area
            </Button>
          </div>
        </form>
      </Modal>

      {/* CRUD: Edit Public Area Modal */}
      <Modal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Public Area Details"
        size="md"
      >
        <form onSubmit={handleEditAreaSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Area Name *" required>
              <TextInput
                value={editAreaForm.name || ""}
                onChange={(e) => setEditAreaForm({ ...editAreaForm, name: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Category *">
              <SelectInput
                value={editAreaForm.category || "Lobby"}
                onChange={(e) => setEditAreaForm({ ...editAreaForm, category: e.target.value as HKPublicArea["category"] })}
              >
                <option value="Lobby">Lobby</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Corridor">Corridor</option>
                <option value="Gym">Gym</option>
                <option value="Spa">Spa</option>
                <option value="Restroom">Restroom</option>
                <option value="Pool">Pool</option>
                <option value="Parking">Parking</option>
                <option value="Banquet Hall">Banquet Hall</option>
                <option value="Washroom">Washroom</option>
                <option value="Garden">Garden</option>
              </SelectInput>
            </FormField>

            <FormField label="Floor level *">
              <SelectInput
                value={editAreaForm.floor || "Ground Floor"}
                onChange={(e) => setEditAreaForm({ ...editAreaForm, floor: e.target.value })}
              >
                <option value="Basement 2">Basement 2</option>
                <option value="Basement 1">Basement 1</option>
                <option value="Ground Floor">Ground Floor</option>
                <option value="1st Floor">1st Floor</option>
                <option value="2nd Floor">2nd Floor</option>
                <option value="3rd Floor">3rd Floor</option>
                <option value="4th Floor">4th Floor</option>
                <option value="5th Floor">5th Floor</option>
              </SelectInput>
            </FormField>

            <FormField label="Specific Location *">
              <TextInput
                value={editAreaForm.location || ""}
                onChange={(e) => setEditAreaForm({ ...editAreaForm, location: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Assigned Housekeeper">
              <SelectInput
                value={editAreaForm.assignedStaff || ""}
                onChange={(e) => {
                  const name = e.target.value;
                  // If assigning staff from dirty -> status updates to Assigned
                  const status = editAreaForm.status === "Dirty" && name ? "Assigned" : editAreaForm.status;
                  setEditAreaForm({ ...editAreaForm, assignedStaff: name, status });
                }}
              >
                <option value="">Unassigned</option>
                {staff
                  .filter((s) => s.role === "Housekeeper")
                  .map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
              </SelectInput>
            </FormField>

            <FormField label="Assigned Supervisor">
              <SelectInput
                value={editAreaForm.supervisor || "Ramesh Kumar"}
                onChange={(e) => setEditAreaForm({ ...editAreaForm, supervisor: e.target.value })}
              >
                {staff
                  .filter((s) => s.role === "Supervisor" || s.name.includes("Ramesh"))
                  .map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
              </SelectInput>
            </FormField>

            <FormField label="Cleaning Frequency *">
              <TextInput
                value={editAreaForm.cleaningFrequency || ""}
                onChange={(e) => setEditAreaForm({ ...editAreaForm, cleaningFrequency: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Estimated Duration *">
              <TextInput
                value={editAreaForm.estDuration || ""}
                onChange={(e) => setEditAreaForm({ ...editAreaForm, estDuration: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Priority *">
              <SelectInput
                value={editAreaForm.priority || "Medium"}
                onChange={(e) => setEditAreaForm({ ...editAreaForm, priority: e.target.value as HKPublicArea["priority"] })}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </SelectInput>
            </FormField>

            <FormField label="Next Cleaning Schedule *">
              <TextInput
                value={editAreaForm.nextCleaning || ""}
                onChange={(e) => setEditAreaForm({ ...editAreaForm, nextCleaning: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Current Status *">
              <SelectInput
                value={editAreaForm.status || "Dirty"}
                onChange={(e) => setEditAreaForm({ ...editAreaForm, status: e.target.value as HKPublicArea["status"] })}
              >
                <option value="Dirty">Dirty</option>
                <option value="Assigned">Assigned</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Pending Inspection">Pending Inspection</option>
                <option value="Inspected">Inspected</option>
                <option value="Clean">Clean</option>
                <option value="Blocked">Blocked</option>
              </SelectInput>
            </FormField>

            <FormField label="Inspection Status *">
              <SelectInput
                value={editAreaForm.inspectionStatus || "None"}
                onChange={(e) => setEditAreaForm({ ...editAreaForm, inspectionStatus: e.target.value as HKPublicArea["inspectionStatus"] })}
              >
                <option value="None">None</option>
                <option value="Pending">Pending</option>
                <option value="Passed">Passed</option>
                <option value="Failed">Failed</option>
              </SelectInput>
            </FormField>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Upgraded Checklist Templates Slide-over Drawer (replaces category popup) */}
      <Drawer
        open={isTemplateDrawerOpen}
        onClose={() => setIsTemplateDrawerOpen(false)}
        title="Public Area Checklist Management"
        description="Create and manage reusable cleaning checklist templates for each public area category."
        width="xl"
      >
        <form onSubmit={handleSaveChecklistTemplate} className="space-y-4 text-xs font-semibold text-slate-700 h-full flex flex-col justify-between">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border border-slate-100 rounded-2xl bg-white overflow-hidden shadow-xs flex-1">
            
            {/* Left Sidebar Panel: Categories list */}
            <div className="bg-slate-50/50 border-r border-slate-100 p-3.5 space-y-1">
              <h4 className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-3 px-1.5">Categories</h4>
              {categoriesList.map((cat) => {
                const isActive = selectedTemplateCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedTemplateCategory(cat)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between focus:outline-none",
                      isActive
                        ? "bg-emerald-50 text-emerald-700 shadow-xs border border-emerald-100/50"
                        : "text-slate-600 hover:bg-slate-100/70 border border-transparent"
                    )}
                  >
                    <span>{cat}</span>
                    <ChevronDown className="h-3 w-3 -rotate-90 text-slate-400" />
                  </button>
                );
              })}
            </div>

            {/* Right Panel: Checklist editor */}
            <div className="md:col-span-2 p-4 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <ClipboardList className="h-4 w-4 text-emerald-700" />
                    Checklist Editor
                  </h4>
                  <Button
                    type="button"
                    onClick={handleAddTask}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold py-1 px-2.5 rounded-lg flex items-center gap-1 shrink-0"
                  >
                    <Plus className="h-3 w-3" /> Add Task
                  </Button>
                </div>

                {/* Template Name field */}
                <FormField label="Template Name">
                  <TextInput
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Lobby Cleaning Template"
                  />
                </FormField>

                {/* Frequency and Duration defaults */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Default Cleaning Frequency">
                    <TextInput
                      value={templateFrequency}
                      onChange={(e) => setTemplateFrequency(e.target.value)}
                      placeholder="e.g. Every 2 Hours"
                    />
                  </FormField>
                  <FormField label="Default Estimated Duration">
                    <TextInput
                      value={templateDuration}
                      onChange={(e) => setTemplateDuration(e.target.value)}
                      placeholder="e.g. 30 mins"
                    />
                  </FormField>
                </div>

                {/* Checklist task lines */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tasks Configuration</span>
                  <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1 sidebar-scroll">
                    {editingTasks.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 italic">
                        No tasks in this template. Click "Add Task" to create one.
                      </div>
                    ) : (
                      editingTasks.map((taskText, idx) => (
                        <div
                          key={idx}
                          draggable
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDrop={(e) => handleDrop(e, idx)}
                          className={cn(
                            "flex items-center gap-2 border rounded-xl p-2 bg-white transition-all",
                            draggedIndex === idx ? "border-emerald-300 bg-emerald-50/20" : "border-slate-100 hover:border-slate-200"
                          )}
                        >
                          {/* Drag handle */}
                          <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-400 p-0.5 shrink-0" title="Drag to Reorder">
                            <Move className="h-3.5 w-3.5" />
                          </div>

                          {/* Checkbox Icon placeholder */}
                          <div className="w-4 h-4 rounded border border-slate-200 bg-slate-50 shrink-0" />

                          {/* Task text Input */}
                          <input
                            type="text"
                            value={taskText}
                            placeholder="Task description (e.g. Wipe doors)"
                            onChange={(e) => handleUpdateTaskText(idx, e.target.value)}
                            className="flex-1 bg-transparent text-xs font-semibold text-slate-700 focus:outline-none border-b border-transparent focus:border-slate-200 pr-2 placeholder:text-slate-300"
                          />

                          {/* Delete Task */}
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(idx)}
                            className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-slate-50 shrink-0"
                            title="Delete Task"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              <div className="mt-4 border-t border-slate-100 pt-3">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Live Preview</h5>
                <div className="p-3 border border-slate-100 bg-slate-50/50 rounded-xl">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 border-b border-slate-100/50 pb-1.5 mb-2">
                    <span className="flex items-center gap-1 text-slate-800">
                      <Trees className="h-3.5 w-3.5 text-emerald-700" />
                      {selectedTemplateCategory} Preview
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Progress: 0 / {editingTasks.filter(t => t.trim()).length}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-semibold max-h-[85px] overflow-y-auto pr-1 sidebar-scroll">
                    {editingTasks.filter(t => t.trim()).map((t, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 border border-slate-100/50 bg-white rounded-lg p-1.5">
                        <div className="w-3.5 h-3.5 rounded border border-slate-300 shrink-0" />
                        <span className="truncate">{t}</span>
                      </div>
                    ))}
                    {editingTasks.filter(t => t.trim()).length === 0 && (
                      <div className="col-span-2 text-center text-slate-400 italic py-1">No preview items</div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetTemplate}
              className="text-red-600 hover:text-red-700 border-red-100 hover:bg-red-50 bg-white"
            >
              Reset to Defaults
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTemplateDrawerOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
              >
                Save Template
              </Button>
            </div>
          </div>
        </form>
      </Drawer>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Public Area"
        message="Are you sure you want to delete this public area space? This operation is permanent and all associated checklist progress and audit histories will be deleted."
        confirmLabel="Delete Space"
        variant="danger"
      />
    </div>
  );
}
