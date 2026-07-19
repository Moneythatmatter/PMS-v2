"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import {
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Layers,
  FileText,
  BadgeAlert,
  User,
  Camera,
  Info,
  Settings,
  History,
  Check,
  Zap,
  ClipboardList,
  Search,
  AlertCircle,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  Coins,
  Package,
  Wrench,
  Percent,
  Shirt,
  Truck,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  ExternalLink,
  BarChart3,
  Calendar,
  Layers3,
  Ban,
  Activity,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { TextInput, SelectInput, FormField, TextAreaInput } from "@/components/frontoffice/ui";

const LAUNDRY_STATUS_STEPS = [
  "Collection",
  "Washing",
  "Ironing",
  "Ready",
  "Delivered",
];

// Helper component for KPI Stats
function KPIStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass,
  borderColor,
  isActive,
  onClick,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  borderColor: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-white p-4 shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        isActive ? "border-emerald-600 ring-2 ring-emerald-100 bg-emerald-50/5" : borderColor
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-550">{title}</p>
          <h3 className="mt-1 text-xl font-extrabold tracking-tight text-slate-800">{value}</h3>
          <p className="mt-0.5 text-[10px] text-slate-600 font-bold">{subtitle}</p>
        </div>
        <div className={cn("rounded-xl p-2 shadow-xs", colorClass)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-slate-100 to-transparent" />
    </div>
  );
}

export default function LaundryOperations() {
  const {
    laundryJobs,
    inventory,
    addLaundryJob,
    updateLaundryStatus,
    discardLinenItem,
    addMaintenanceRequest,
  } = useHousekeeping();

  const [activeTab, setActiveTab] = useState<"laundry" | "discard" | "machines" | "reports" | "audit">("laundry");
  const [createOpen, setCreateOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  // Form: Laundry basic fields
  const [type, setType] = useState<"Guest" | "Hotel" | "Staff">("Guest");
  const [selectedItem, setSelectedItem] = useState("King Bed Sheets");
  const [guestItemText, setGuestItemText] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [room, setRoom] = useState("102");
  const [guestName, setGuestName] = useState("James Wilson");
  const [baseCharges, setBaseCharges] = useState("150");
  const [notes, setNotes] = useState("");

  // Form: Urgency & Process
  const [urgency, setUrgency] = useState<"Normal" | "Same-Day" | "Express">("Normal");
  const [serviceType, setServiceType] = useState<"Wash & Fold" | "Wash & Iron" | "Dry Cleaning" | "Pressing Only">("Wash & Iron");
  const [washBatch, setWashBatch] = useState<"Whites" | "Colors" | "Delicates">("Colors");

  // Form: Pre-Inspection Checklists
  const [stains, setStains] = useState(false);
  const [tears, setTears] = useState(false);
  const [buttons, setButtons] = useState(false);
  const [fading, setFading] = useState(false);
  const [careLabel, setCareLabel] = useState("Normal Cotton");

  // Form: Internal Laundry Target
  const [employeeName, setEmployeeName] = useState("");
  const [employeeDept, setEmployeeDept] = useState("Housekeeping");
  const [costCenter, setCostCenter] = useState("Housekeeping");

  // Form: Outsourcing Fields
  const [isOutsourced, setIsOutsourced] = useState(false);
  const [vendorName, setVendorName] = useState("Elite Dry Cleaners Ltd");
  const [vendorCost, setVendorCost] = useState("80");

  // Discard Form Fields
  const [discardItemId, setDiscardItemId] = useState("");
  const [discardQty, setDiscardQty] = useState("1");

  // Filter & Search states
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [roomFilter, setRoomFilter] = useState("All");
  const [staffFilter, setStaffFilter] = useState("All");
  const [machineFilter, setMachineFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortBy, setSortBy] = useState("ID");

  const [draftTypeFilter, setDraftTypeFilter] = useState("All");
  const [draftRoomFilter, setDraftRoomFilter] = useState("All");
  const [draftStaffFilter, setDraftStaffFilter] = useState("All");
  const [draftMachineFilter, setDraftMachineFilter] = useState("All");
  const [draftPriorityFilter, setDraftPriorityFilter] = useState("All");
  const [draftSortBy, setDraftSortBy] = useState("ID");

  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync draft states when popover toggles
  const handleTogglePopover = () => {
    if (!isFilterPopoverOpen) {
      setDraftTypeFilter(typeFilter);
      setDraftRoomFilter(roomFilter);
      setDraftStaffFilter(staffFilter);
      setDraftMachineFilter(machineFilter);
      setDraftPriorityFilter(priorityFilter);
      setDraftSortBy(sortBy);
    }
    setIsFilterPopoverOpen((prev) => !prev);
  };

  const handleApplyFilters = () => {
    setTypeFilter(draftTypeFilter);
    setRoomFilter(draftRoomFilter);
    setStaffFilter(draftStaffFilter);
    setMachineFilter(draftMachineFilter);
    setPriorityFilter(draftPriorityFilter);
    setSortBy(draftSortBy);
    setIsFilterPopoverOpen(false);
  };

  // Detail Drawers selection
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedLinenId, setSelectedLinenId] = useState<string | null>(null);

  // Active KPI state filter
  const [kpiFilter, setKpiFilter] = useState<string>("all");

  // Toast
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" | "info" } | null>(null);

  // Extra Metadata Persisted State (urgenies, inspection logs, etc.)
  const [extraInfoMap, setExtraInfoMap] = useState<Record<string, any>>({});

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; timestamp: string; event: string; user: string; details: string; target: string }>>([]);

  // Machine States List
  const [machinesList, setMachinesList] = useState([
    { id: "W-01", name: "Washer W-01", type: "Washer", status: "Washing", load: "Colors (6.5 kg)", cycle: "Cotton Wash", remaining: "12 mins", lockout: false },
    { id: "W-02", name: "Washer W-02", type: "Washer", status: "Idle", load: "None", cycle: "None", remaining: "0 mins", lockout: false },
    { id: "W-03", name: "Washer W-03", type: "Washer", status: "Maintenance", load: "None", cycle: "Thermostat Calib", remaining: "N/A", lockout: true },
    { id: "D-01", name: "Dryer D-01", type: "Dryer", status: "Drying", load: "Whites (8.0 kg)", cycle: "Delicates Dry", remaining: "25 mins", lockout: false },
    { id: "D-02", name: "Dryer D-02", type: "Dryer", status: "Maintenance", load: "None", cycle: "Filter Replacement", remaining: "N/A", lockout: true },
    { id: "P-01", name: "Press Station P-01", type: "Iron", status: "Idle", load: "None", cycle: "None", remaining: "0 mins", lockout: false },
    { id: "P-02", name: "Press Station P-02", type: "Iron", status: "Active", load: "Guest Shirts", cycle: "Steam Press", remaining: "Ongoing", lockout: false },
  ]);

  // Inventory Consumables Stock
  const [consumables, setConsumables] = useState([
    { id: "C1", name: "Premium Detergent Powder", stock: 45, unit: "kg", limit: 50, category: "Chemical" },
    { id: "C2", name: "Fabric Softener Liquid", stock: 30, unit: "L", limit: 20, category: "Chemical" },
    { id: "C3", name: "Industrial Bleach Solution", stock: 12, unit: "L", limit: 15, category: "Chemical" },
    { id: "C4", name: "Organic Stain Remover", stock: 8, unit: "L", limit: 10, category: "Chemical" },
    { id: "C5", name: "Dry Cleaning Solvent", stock: 24, unit: "L", limit: 25, category: "Chemical" },
  ]);

  // Damage Reports State
  const [damageLogs, setDamageLogs] = useState([
    { id: "DM-01", jobId: "LD-02", room: "204", guest: "Amanda Ross", garment: "White Linen Shirt", damage: "Tear on right cuff sleeve", cost: 350, date: "17 Jul", status: "Approved" },
    { id: "DM-02", jobId: "LD-04", room: "305", guest: "Robert Dow", garment: "Silk Trousers", damage: "Loose belt buckle button missing", cost: 150, date: "16 Jul", status: "Repaired" },
  ]);

  // Active Report sub-tab
  const [activeReportTab, setActiveReportTab] = useState<"daily" | "revenue" | "inventory" | "damage" | "staff" | "machines">("daily");

  useEffect(() => {
    const stored = localStorage.getItem("pms_laundry_extra_info");
    if (stored) {
      setExtraInfoMap(JSON.parse(stored));
    }

    // Initialize Mock Audit Logs from data
    const mockAudits = [
      { id: "A-01", timestamp: "18 Jul 18:30", event: "Laundry Created", user: "reception_suresh", details: "Guest Laundry job LD-08 booked. Room 102.", target: "LD-08" },
      { id: "A-02", timestamp: "18 Jul 18:35", event: "Pickup Scheduled", user: "attendant_meena", details: "Collection pickup assigned to Meena.", target: "LD-08" },
      { id: "A-03", timestamp: "18 Jul 18:45", event: "Pickup Completed", user: "attendant_meena", details: "Job LD-08 collected from room. Status: Collected.", target: "LD-08" },
      { id: "A-04", timestamp: "18 Jul 19:00", event: "Processing Started", user: "operator_ravi", details: "Washing cycle batch started. Batch color: Colors.", target: "LD-08" },
      { id: "A-05", timestamp: "18 Jul 19:15", event: "Inspection Status", user: "supervisor_anita", details: "Garments passed quality check. Standard validation ok.", target: "LD-08" },
      { id: "A-06", timestamp: "18 Jul 19:25", event: "Charges Posted", user: "system_billing", details: "Posted laundry charge of INR 150 to room folio account.", target: "LD-08" },
      { id: "A-07", timestamp: "18 Jul 19:30", event: "Request Closed", user: "attendant_meena", details: "Delivered laundry to room 102. Request Completed.", target: "LD-08" },
    ];
    setAuditLogs(mockAudits);
  }, []);

  const saveExtraInfo = (jobId: string, info: any) => {
    setExtraInfoMap((prev) => {
      const next = { ...prev, [jobId]: info };
      localStorage.setItem("pms_laundry_extra_info", JSON.stringify(next));
      return next;
    });
  };

  const addAuditLog = (event: string, details: string, target: string) => {
    const timestampStr = new Date().toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    setAuditLogs((prev) => {
      const nextId = `A-${String(prev.length + 1).padStart(2, "0")}-${Math.floor(Math.random() * 1000)}`;
      const newLog = {
        id: nextId,
        timestamp: timestampStr,
        event,
        user: "supervisor_suresh",
        details,
        target,
      };
      return [newLog, ...prev];
    });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Derived/Computed values helper for initial mock items
  const getJobExtra = (job: any) => {
    if (extraInfoMap[job.id]) {
      return extraInfoMap[job.id];
    }
    const isMockOutsourced = job.id.endsWith("3") || job.id.endsWith("5");
    const isMockHotel = job.type === "Hotel";
    const seed = parseInt(job.id.slice(-2)) || 1;
    
    return {
      urgency: job.charges > 300 ? "Express" : seed % 2 === 0 ? "Same-Day" : "Normal",
      serviceType: isMockHotel ? "Wash & Fold" : "Dry Cleaning",
      washBatch: seed % 3 === 0 ? "Whites" : seed % 3 === 1 ? "Colors" : "Delicates",
      isOutsourced: isMockOutsourced,
      vendorName: isMockOutsourced ? "Elite Dry Cleaners Ltd" : "In-house",
      vendorCost: isMockOutsourced ? Math.round(job.charges * 0.5) : 0,
      preInspection: {
        stains: seed % 4 === 1,
        tears: false,
        buttons: false,
        colorFading: false,
        photoUploaded: true,
        notes: job.notes || "Clean intake check",
        careLabel: isMockHotel ? "Normal Cotton" : "Dry Clean Only",
      },
      qualityInspection: "Pending",
      employeeName: isMockHotel ? "Amit Kumar" : "",
      employeeDept: isMockHotel ? "Front Office" : "",
      costCenter: "Housekeeping",
    };
  };

  // Pricing calculations
  const calculateTotalCharges = useMemo(() => {
    const base = parseFloat(baseCharges) || 0;
    if (urgency === "Same-Day") return Math.round(base * 1.25);
    if (urgency === "Express") return Math.round(base * 1.55);
    return base;
  }, [baseCharges, urgency]);

  // Simulated machine stats helper
  const getMachineInfo = (job: any) => {
    const match = parseInt(job.id.slice(-2)) || 1;
    const isMaintenanceLockout = match % 4 === 0;
    
    return {
      machine: `Machine W-0${(match % 3) + 1}`,
      capacity: "85%",
      load: job.type === "Hotel" ? "Internal Linen Batch" : "Guest Laundry Load",
      operator: ["Meena", "Ravi Shankar", "Anita Devi"][match % 3],
      cycle: job.status === "Washing" ? "Normal Wash" : "Press Station Cycle",
      duration: "15 mins remaining",
      lockout: isMaintenanceLockout,
    };
  };

  const hotelLinenItems = useMemo(() => {
    return inventory.filter((item) => item.category === "Linen");
  }, [inventory]);

  const staffList = ["Meena", "Ravi Shankar", "Kiran Bala", "Suresh Kumar", "Anita Devi"];

  const getJobPriority = (job: any): "Critical" | "High" | "Medium" | "Low" => {
    const extra = getJobExtra(job);
    if (extra.urgency === "Express") return "Critical";
    if (extra.urgency === "Same-Day") return "High";
    if (job.type === "Guest") return "Medium";
    return "Low";
  };

  const getJobEstFinish = (job: any): string => {
    if (job.status === "Delivered") return "Delivered";
    const extra = getJobExtra(job);
    if (extra.urgency === "Express") return "Within 3 hours";
    if (extra.urgency === "Same-Day") return "Today (Before 6 PM)";
    return "Tomorrow (Standard)";
  };

  const isJobDelayed = (job: any): boolean => {
    return job.status !== "Delivered" && job.id.endsWith("2");
  };

  const kpis = useMemo(() => {
    const total = laundryJobs.length;
    const guest = laundryJobs.filter((j) => j.type === "Guest").length;
    const hotel = laundryJobs.filter((j) => j.type !== "Guest").length;
    const washing = laundryJobs.filter((j) => j.status === "Washing").length;
    const ironing = laundryJobs.filter((j) => j.status === "Ironing").length;
    const ready = laundryJobs.filter((j) => j.status === "Ready").length;
    const delivered = laundryJobs.filter((j) => j.status === "Delivered").length;
    const delayed = laundryJobs.filter(isJobDelayed).length;

    return { total, guest, hotel, washing, ironing, ready, delivered, delayed };
  }, [laundryJobs]);

  const filteredJobs = useMemo(() => {
    let result = [...laundryJobs];

    if (kpiFilter === "guest") {
      result = result.filter((j) => j.type === "Guest");
    } else if (kpiFilter === "hotel") {
      result = result.filter((j) => j.type !== "Guest");
    } else if (kpiFilter === "washing") {
      result = result.filter((j) => j.status === "Washing");
    } else if (kpiFilter === "ironing") {
      result = result.filter((j) => j.status === "Ironing");
    } else if (kpiFilter === "ready") {
      result = result.filter((j) => j.status === "Ready");
    } else if (kpiFilter === "delivered") {
      result = result.filter((j) => j.status === "Delivered");
    } else if (kpiFilter === "delayed") {
      result = result.filter(isJobDelayed);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (j) =>
          j.id.toLowerCase().includes(q) ||
          j.item.toLowerCase().includes(q) ||
          (j.guestName && j.guestName.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== "All") {
      result = result.filter((j) => j.status === statusFilter);
    }
    if (typeFilter !== "All") {
      result = result.filter((j) => j.type === typeFilter);
    }
    if (roomFilter !== "All") {
      result = result.filter((j) => j.room === roomFilter);
    }
    if (staffFilter !== "All") {
      const seedStaff = staffFilter;
      result = result.filter((j) => {
        const seed = parseInt(j.id.slice(-2)) || 0;
        return staffList[seed % staffList.length] === seedStaff;
      });
    }
    if (machineFilter !== "All") {
      result = result.filter((j) => {
        const match = parseInt(j.id.slice(-2)) || 1;
        const name = `Machine W-0${(match % 3) + 1}`;
        return name.includes(machineFilter);
      });
    }
    if (priorityFilter !== "All") {
      result = result.filter((j) => getJobPriority(j) === priorityFilter);
    }

    if (sortBy === "ID") {
      result.sort((a, b) => b.id.localeCompare(a.id));
    } else if (sortBy === "Charges") {
      result.sort((a, b) => b.charges - a.charges);
    } else if (sortBy === "Items") {
      result.sort((a, b) => b.quantity - a.quantity);
    }

    return result;
  }, [laundryJobs, kpiFilter, search, statusFilter, typeFilter, roomFilter, staffFilter, machineFilter, priorityFilter, sortBy]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (typeFilter !== "All") count++;
    if (roomFilter !== "All") count++;
    if (staffFilter !== "All") count++;
    if (machineFilter !== "All") count++;
    if (priorityFilter !== "All") count++;
    if (sortBy !== "ID") count++;
    return count;
  }, [typeFilter, roomFilter, staffFilter, machineFilter, priorityFilter, sortBy]);

  const selectedJob = useMemo(() => {
    return laundryJobs.find((j) => j.id === selectedJobId) || null;
  }, [laundryJobs, selectedJobId]);

  const selectedLinen = useMemo(() => {
    return hotelLinenItems.find((item) => item.id === selectedLinenId) || null;
  }, [hotelLinenItems, selectedLinenId]);

  const handleCreateJob = () => {
    const qty = parseInt(quantity, 10) || 1;
    const finalPrice = calculateTotalCharges;
    const nextId = `LD-${String(laundryJobs.length + 1).padStart(2, "0")}`;

    addLaundryJob({
      type: type === "Staff" ? "Hotel" : type,
      item: type === "Hotel" ? selectedItem : guestItemText,
      quantity: qty,
      room: type === "Guest" ? room : undefined,
      guestName: type === "Guest" ? guestName : type === "Staff" ? employeeName : undefined,
      charges: finalPrice,
      notes: notes,
    });

    const extra = {
      urgency,
      serviceType,
      washBatch,
      isOutsourced,
      vendorName: isOutsourced ? vendorName : "In-house",
      vendorCost: isOutsourced ? Number(vendorCost) : 0,
      preInspection: {
        stains,
        tears,
        buttons,
        fading,
        photoUploaded: true,
        notes: notes,
        careLabel,
      },
      qualityInspection: "Pending",
      employeeName: type === "Staff" ? employeeName : "",
      employeeDept: type === "Staff" ? employeeDept : "",
      costCenter: type !== "Guest" ? costCenter : "",
    };
    saveExtraInfo(nextId, extra);

    // Audit logs entry
    addAuditLog(
      "Laundry Created",
      `Laundry job ${nextId} created for ${type === "Guest" ? "Room " + room : type === "Staff" ? employeeName : "Hotel Linen Stock"}`,
      nextId
    );

    setCreateOpen(false);
    setGuestItemText("");
    setNotes("");
    setEmployeeName("");
    setStains(false);
    setTears(false);
    setButtons(false);
    setFading(false);
    setToast({ message: `Laundry job booked successfully under ID ${nextId}!`, variant: "success" });
  };

  const handleQualityCheck = (jobId: string, status: "Passed" | "Failed") => {
    const prevExtra = getJobExtra({ id: jobId });
    const updated = {
      ...prevExtra,
      qualityInspection: status,
    };
    saveExtraInfo(jobId, updated);

    if (status === "Failed") {
      updateLaundryStatus(jobId, "Washing");
      addAuditLog("Inspection Status", `Quality inspection FAILED for Job ${jobId}. Returned for reprocessing.`, jobId);
      setToast({ message: `Job ${jobId} failed inspection. Reset back to Washing pipeline.`, variant: "error" });
    } else {
      updateLaundryStatus(jobId, "Ready");
      addAuditLog("Inspection Status", `Quality inspection PASSED for Job ${jobId}. Package ready for delivery.`, jobId);
      setToast({ message: `Job ${jobId} passed quality check. Marked as Ready for Delivery.`, variant: "success" });
    }
    setSelectedJobId(null);
  };

  const handleToggleLockout = (id: string) => {
    setMachinesList((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nextLock = !m.lockout;
          
          if (nextLock) {
            addMaintenanceRequest({
              room: `Laundry Room - ${m.name}`,
              problem: `Attendant initiated preventive lockout hold on laundry equipment ${m.name}. Perform inspection.`,
              priority: "Medium",
              engineer: "—",
              assignmentType: "Auto",
            });
          }

          addAuditLog(
            "Equipment Status",
            `Machine ${m.name} maintenance lockout set to ${nextLock ? "ACTIVE" : "INACTIVE"}.`,
            id
          );
          return { ...m, lockout: nextLock, status: nextLock ? "Maintenance" : "Idle" };
        }
        return m;
      })
    );
    setToast({ message: `Machine ${id} maintenance state updated.`, variant: "info" });
  };

  const handleDeductChemical = (id: string, qty: number) => {
    setConsumables((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextStock = Math.max(0, c.stock - qty);
          addAuditLog(
            "Material Usage",
            `Deducted ${qty} ${c.unit} from ${c.name} stock. Remaining: ${nextStock} ${c.unit}.`,
            id
          );
          return { ...c, stock: nextStock };
        }
        return c;
      })
    );
    setToast({ message: `Chemical consumption updated.`, variant: "success" });
  };

  const handleDiscard = () => {
    const qty = parseInt(discardQty, 10) || 1;
    if (!discardItemId) return;
    discardLinenItem(discardItemId, qty);
    setDiscardOpen(false);
    addAuditLog("Linen Replacement", `Discarded ${qty} Pcs of Linen. Inventory stocks adjusted.`, discardItemId);
    setToast({ message: `${qty} Linen items discarded successfully.`, variant: "info" });
  };

  const advanceStatus = (id: string, current: string) => {
    const idx = LAUNDRY_STATUS_STEPS.indexOf(current as any);
    if (idx === -1 || idx === LAUNDRY_STATUS_STEPS.length - 1) return;
    const next = LAUNDRY_STATUS_STEPS[idx + 1];
    updateLaundryStatus(id, next as any);
    addAuditLog(
      next === "Delivered" ? "Delivery Completed" : "Processing Updated",
      `Job ${id} pipeline advanced to ${next}.`,
      id
    );
    setToast({ message: `Job ${id} updated to ${next} status.`, variant: "success" });
  };

  const statusBadges = {
    Collection: "bg-blue-50 text-blue-700 border border-blue-100",
    Washing: "bg-orange-50 text-orange-700 border border-orange-100 animate-pulse",
    Ironing: "bg-yellow-50 text-yellow-800 border border-yellow-250",
    Ready: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    Delivered: "bg-green-50 text-green-900 border border-green-200 font-extrabold",
    Delayed: "bg-red-50 text-red-700 border border-red-100",
  };

  const priorityColors = {
    Critical: "bg-red-100 text-red-800 border border-red-200 animate-pulse",
    High: "bg-red-50 text-red-700 border border-red-100",
    Medium: "bg-amber-50 text-amber-700 border border-amber-100",
    Low: "bg-slate-50 text-slate-600 border border-slate-200",
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Operations</span>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-800 tracking-tight">Laundry & Linen Management</h1>
          <p className="text-xs text-slate-500 font-medium max-w-2xl mt-0.5">
            Process hotel linen batches, staff uniforms, and premium guest laundry bags. Track active laundry pipelines and wash capacities.
          </p>
        </div>

        <div className="flex gap-2.5 text-xs self-start lg:self-center">
          <Button
            onClick={() => {
              setSelectedItem(hotelLinenItems[0]?.name || "");
              setCreateOpen(true);
            }}
            className="!bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white font-semibold text-xs flex items-center justify-center gap-1.5 rounded-xl h-9 px-3.5 shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" /> Book Laundry
          </Button>
          <Button
            onClick={() => {
              setDiscardItemId(hotelLinenItems[0]?.id || "");
              setDiscardOpen(true);
            }}
            className="!bg-[#DC3545] hover:!bg-[#c82333] !text-white font-semibold text-xs flex items-center justify-center gap-1.5 rounded-xl h-9 px-3.5 shadow-sm transition-all"
          >
            <Trash2 className="h-4 w-4" /> Discard Linen
          </Button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-slate-200">
        <nav className="flex flex-wrap gap-4 md:gap-6 text-xs font-bold uppercase tracking-wider">
          {[
            { id: "laundry", label: `Active Queue (${laundryJobs.filter((l) => l.status !== "Delivered").length})` },
            { id: "discard", label: `Linen Stock & Discards (${hotelLinenItems.length})` },
            { id: "machines", label: "Equipment & Consumables" },
            { id: "reports", label: "Reports & Analytics" },
            { id: "audit", label: "Operational Audit Logs" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setKpiFilter("all");
              }}
              className={cn(
                "pb-3 px-1 border-b-2 transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "border-emerald-700 text-emerald-750 font-extrabold"
                  : "border-transparent text-slate-600 hover:text-slate-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={cn(
          "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl p-3.5 text-xs font-bold shadow-xl animate-in fade-in slide-in-from-bottom-2",
          toast.variant === "success" ? "bg-emerald-600 text-white" :
          toast.variant === "error" ? "bg-red-655 text-white" : "bg-blue-600 text-white"
        )}>
          {toast.variant === "success" ? <CheckCircle2 className="h-4 w-4" /> : <Info className="h-4 w-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* TAB 1: ACTIVE LAUNDRY FLOW */}
      {activeTab === "laundry" && (
        <div className="space-y-6">
          {/* Dashboard KPI Cards Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            <KPIStatCard
              title="Total Laundry"
              value={kpis.total}
              subtitle="Registered Jobs"
              icon={Layers}
              colorClass="bg-slate-50 text-slate-600"
              borderColor="border-slate-100 hover:border-slate-200"
              isActive={kpiFilter === "all"}
              onClick={() => setKpiFilter("all")}
            />
            <KPIStatCard
              title="Guest Laundry"
              value={kpis.guest}
              subtitle="Personal garments"
              icon={User}
              colorClass="bg-violet-50 text-violet-600"
              borderColor="border-slate-100 hover:border-slate-200"
              isActive={kpiFilter === "guest"}
              onClick={() => setKpiFilter(kpiFilter === "guest" ? "all" : "guest")}
            />
            <KPIStatCard
              title="Internal Linen"
              value={kpis.hotel}
              subtitle="Stocks & Uniforms"
              icon={Package}
              colorClass="bg-blue-50 text-blue-600"
              borderColor="border-slate-100 hover:border-slate-200"
              isActive={kpiFilter === "hotel"}
              onClick={() => setKpiFilter(kpiFilter === "hotel" ? "all" : "hotel")}
            />
            <KPIStatCard
              title="Washing"
              value={kpis.washing}
              subtitle="Active wash cycle"
              icon={Clock}
              colorClass="bg-orange-50 text-orange-600"
              borderColor="border-slate-100 hover:border-slate-200"
              isActive={kpiFilter === "washing"}
              onClick={() => setKpiFilter(kpiFilter === "washing" ? "all" : "washing")}
            />
            <KPIStatCard
              title="Ironing"
              value={kpis.ironing}
              subtitle="Press station queue"
              icon={Zap}
              colorClass="bg-yellow-50 text-yellow-600"
              borderColor="border-slate-100 hover:border-slate-200"
              isActive={kpiFilter === "ironing"}
              onClick={() => setKpiFilter(kpiFilter === "ironing" ? "all" : "ironing")}
            />
            <KPIStatCard
              title="Ready"
              value={kpis.ready}
              subtitle="Quality pass jobs"
              icon={Check}
              colorClass="bg-emerald-50 text-emerald-600"
              borderColor="border-slate-100 hover:border-slate-200"
              isActive={kpiFilter === "ready"}
              onClick={() => setKpiFilter(kpiFilter === "ready" ? "all" : "ready")}
            />
            <KPIStatCard
              title="Delivered"
              value={kpis.delivered}
              subtitle="Returned bags"
              icon={CheckCircle2}
              colorClass="bg-green-50 text-green-700"
              borderColor="border-slate-100 hover:border-slate-200"
              isActive={kpiFilter === "delivered"}
              onClick={() => setKpiFilter(kpiFilter === "delivered" ? "all" : "delivered")}
            />
            <KPIStatCard
              title="Delayed Alerts"
              value={kpis.delayed}
              subtitle="Prep delays"
              icon={AlertTriangle}
              colorClass="bg-red-50 text-red-655"
              borderColor="border-slate-100 hover:border-slate-200"
              isActive={kpiFilter === "delayed"}
              onClick={() => setKpiFilter(kpiFilter === "delayed" ? "all" : "delayed")}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-5">
            {/* Left 4 columns: Active Jobs Table */}
            <div className="xl:col-span-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <TextInput
                    className="pl-9 text-xs rounded-xl"
                    placeholder="Search by ID, guest, or room…"
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <SelectInput
                    className="w-36 text-xs rounded-xl"
                    value={statusFilter}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All Pipeline Statuses</option>
                    <option value="Collection">Collection / Scheduled</option>
                    <option value="Washing">Washing / Processing</option>
                    <option value="Ironing">Ironing / Finishing</option>
                    <option value="Ready">Ready for Delivery</option>
                    <option value="Delivered">Delivered & Closed</option>
                  </SelectInput>

                  <div className="relative" ref={popoverRef}>
                    <Button
                      variant="outline"
                      onClick={handleTogglePopover}
                      className="text-xs font-semibold border-slate-200 rounded-xl h-8 px-3 gap-1.5 flex items-center justify-center bg-white"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                      More Filters
                      {activeFiltersCount > 0 && (
                        <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
                          {activeFiltersCount}
                        </span>
                      )}
                    </Button>

                    {isFilterPopoverOpen && (
                      <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl space-y-3.5">
                        <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Filter Parameters</h4>
                        
                        <div className="space-y-3">
                          <FormField label="Linen Category">
                            <SelectInput
                              value={draftTypeFilter}
                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDraftTypeFilter(e.target.value)}
                              className="text-xs"
                            >
                              <option value="All">All Types</option>
                              <option value="Guest">Guest Laundry</option>
                              <option value="Hotel">Internal Stock</option>
                            </SelectInput>
                          </FormField>

                          <FormField label="Sort Direction">
                            <SelectInput
                              value={draftSortBy}
                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDraftSortBy(e.target.value)}
                              className="text-xs"
                            >
                              <option value="ID">Job ID (Descending)</option>
                              <option value="Charges">Charges Amount</option>
                              <option value="Items">Quantity Count</option>
                            </SelectInput>
                          </FormField>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setDraftTypeFilter("All");
                              setDraftSortBy("ID");
                              setDraftPriorityFilter("All");
                            }}
                            className="w-1/2 !bg-slate-100 hover:!bg-slate-200 !text-slate-700 !border-transparent text-xs py-1.5"
                          >
                            Reset
                          </Button>
                          <Button
                            onClick={handleApplyFilters}
                            className="w-1/2 !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white text-xs py-1.5"
                          >
                            Apply Filters
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm scrollbar-thin">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] uppercase tracking-wider text-slate-400">
                      <th className="px-4 py-3.5 font-bold">Job ID</th>
                      <th className="px-4 py-3.5 font-bold">Source/Room</th>
                      <th className="px-4 py-3.5 font-bold">Type</th>
                      <th className="px-4 py-3.5 font-bold text-center">Batch</th>
                      <th className="px-4 py-3.5 font-bold">Details</th>
                      <th className="px-4 py-3.5 font-bold text-center">Destination</th>
                      <th className="px-4 py-3.5 font-bold text-center">Pcs</th>
                      <th className="px-4 py-3.5 font-bold text-center">Status</th>
                      <th className="px-4 py-3.5 font-bold text-center">Speed</th>
                      <th className="px-4 py-3.5 font-bold text-right">Charges</th>
                      <th className="px-4 py-3.5 font-bold text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {filteredJobs.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="text-center py-16 text-slate-400 italic font-medium">
                          <ClipboardList className="h-8 w-8 mx-auto text-slate-300 opacity-60 mb-2" />
                          No active laundry jobs match your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredJobs.map((job) => {
                        const extra = getJobExtra(job);
                        const priority = getJobPriority(job);
                        const machine = getMachineInfo(job).machine;
                        const isDelayed = isJobDelayed(job);

                        // Batch color map
                        const batchClass = 
                          extra.washBatch === "Whites" ? "bg-slate-100 text-slate-800 border-slate-300" :
                          extra.washBatch === "Colors" ? "bg-amber-50 text-amber-800 border-amber-250" :
                          "bg-sky-50 text-sky-800 border-sky-200";

                        // Speed badge color map
                        const speedClass =
                          extra.urgency === "Express" ? "bg-red-50 text-red-700 border-red-105 animate-pulse" :
                          extra.urgency === "Same-Day" ? "bg-amber-50 text-amber-700 border-amber-100" :
                          "bg-slate-50 text-slate-600 border-slate-200";

                        return (
                          <tr
                            key={job.id}
                            onClick={() => setSelectedJobId(job.id)}
                            className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3 text-[11px] font-extrabold text-slate-600">
                              {job.id}
                            </td>
                            <td className="px-4 py-3">
                              {job.type === "Guest" ? (
                                <div className="leading-tight">
                                  <span className="font-extrabold text-slate-800">Room {job.room}</span>
                                  <span className="text-[9px] text-slate-400 font-semibold block">{job.guestName}</span>
                                </div>
                              ) : extra.employeeName ? (
                                <div className="leading-tight">
                                  <span className="font-bold text-slate-600">Staff Uniform</span>
                                  <span className="text-[9px] text-slate-400 block">{extra.employeeName} ({extra.employeeDept})</span>
                                </div>
                              ) : (
                                <span className="text-slate-500 font-bold">Hotel Linen Stock</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn(
                                "rounded px-1.5 py-0.5 text-[8.5px] border font-bold uppercase",
                                job.type === "Guest" ? "bg-violet-50 text-violet-700 border-violet-100" :
                                extra.employeeName ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-slate-50 text-slate-600 border-slate-100"
                              )}>
                                {job.type === "Guest" ? "Guest" : extra.employeeName ? "Staff" : "Linen"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={cn("px-1.5 py-0.5 rounded text-[8px] border font-bold", batchClass)}>
                                {extra.washBatch}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[10px] text-slate-500 max-w-[120px] truncate">
                              {job.item}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={cn(
                                "rounded px-1 py-0.5 text-[8px] border font-bold uppercase",
                                extra.isOutsourced ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                              )}>
                                {extra.isOutsourced ? "Outsourced" : "In-House"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-slate-800">
                              {job.quantity} Pcs
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={cn(
                                "rounded-full px-2 py-0.5 text-[8.5px] border font-extrabold uppercase whitespace-nowrap",
                                isDelayed ? statusBadges.Delayed : statusBadges[job.status] || "bg-slate-50 text-slate-600 border-slate-250"
                              )}>
                                {isDelayed ? "Delayed" : job.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={cn("px-1.5 py-0.5 rounded text-[8px] border font-bold uppercase", speedClass)}>
                                {extra.urgency}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-slate-900 font-extrabold text-[11px]">
                              {job.type === "Guest" ? `INR ${job.charges}` : "Cost Allocated"}
                            </td>
                            <td className="px-4 py-3 text-center text-slate-400">
                              <ChevronRight className="h-4 w-4 mx-auto hover:text-emerald-700 transition-colors" />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right 1 column: Warnings Sidebar Card */}
            <div className="xl:col-span-1 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                      <AlertOctagon className="h-4 w-4 text-red-650" />
                      Active Alerts
                    </h3>
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-extrabold text-red-600 animate-pulse">
                      {hotelLinenItems.filter(i => i.available < i.parStock).length + (kpis.delayed > 0 ? 1 : 0) + 1}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 max-h-[450px] overflow-y-auto pr-1 sidebar-scroll text-[10px]">
                    {/* Delayed Alert */}
                    {kpis.delayed > 0 && (
                      <div className="bg-red-50/40 border border-red-100 text-red-700 rounded-xl p-3 flex gap-2.5 items-start">
                        <AlertCircle className="h-4 w-4 shrink-0 text-red-500 animate-bounce" />
                        <div>
                          <p className="font-bold text-slate-800">Delayed Bags Pending</p>
                          <p className="text-slate-500 font-medium mt-0.5 leading-relaxed">
                            {kpis.delayed} jobs have exceeded service timers. Express batch sorting required.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Machine Lockout Alert */}
                    <div className="bg-amber-50/40 border border-amber-100 text-amber-700 rounded-xl p-3 flex gap-2.5 items-start">
                      <Wrench className="h-4 w-4 shrink-0 text-amber-500" />
                      <div>
                        <p className="font-bold text-slate-800">Machine Maintenance hold</p>
                        <p className="text-slate-500 font-medium mt-0.5 leading-relaxed">
                          <strong>Dryer D-02</strong> is locked out for thermostat calibration. In-house dry cycle times may increase.
                        </p>
                      </div>
                    </div>

                    {/* Linen Inventory Low Alert */}
                    {hotelLinenItems.map((item) => {
                      if (item.available >= item.parStock) return null;
                      return (
                        <div key={item.id} className="bg-slate-50 border border-slate-200 text-slate-600 rounded-xl p-3 flex gap-2.5 items-start">
                          <Info className="h-4 w-4 shrink-0 text-slate-400" />
                          <div>
                            <p className="font-bold text-slate-800">{item.name} Stock Low</p>
                            <p className="text-slate-500 font-medium mt-0.5 leading-relaxed">
                              Available: {item.available} Pcs (Par: {item.parStock}). Stock level is at {Math.round((item.available / item.parStock) * 100)}%.
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-6">
                  <div className="rounded-xl bg-slate-50 p-3 space-y-2 border border-slate-200">
                    <p className="font-bold text-slate-800 text-[10px] uppercase tracking-wider flex items-center gap-1">
                      <Settings className="h-3.5 w-3.5 text-slate-450" /> Capacity indicators
                    </p>
                    <div className="space-y-1.5 text-slate-500 font-semibold">
                      <div className="flex justify-between">
                        <span>Ironing Station</span>
                        <span className="text-slate-800">3/4 Free</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Washing Machines</span>
                        <span className="text-emerald-700 font-bold">20% load</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Outsource pipeline</span>
                        <span className="text-slate-800">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DISCARD FLOW */}
      {activeTab === "discard" && (
        <div className="grid gap-6 xl:grid-cols-4">
          <div className="xl:col-span-3 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3.5 font-bold">Linen Name</th>
                    <th className="px-4 py-3.5 font-bold text-center">Available</th>
                    <th className="px-4 py-3.5 font-bold text-center">In Laundry</th>
                    <th className="px-4 py-3.5 font-bold text-center">Damaged</th>
                    <th className="px-4 py-3.5 font-bold text-center">Discarded</th>
                    <th className="px-4 py-3.5 font-bold text-center">Par Stock</th>
                    <th className="px-4 py-3.5 font-bold text-center">Safety Ratio</th>
                    <th className="px-4 py-3.5 font-bold text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {hotelLinenItems.map((item) => {
                    const ratio = Math.round((item.available / item.parStock) * 100);
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedLinenId(item.id)}
                        className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-4 text-slate-800 font-bold">{item.name}</td>
                        <td className="px-4 py-4 text-center">{item.available} {item.unit}</td>
                        <td className="px-4 py-4 text-center">{item.laundry} {item.unit}</td>
                        <td className="px-4 py-4 text-center text-amber-700">{item.damaged} {item.unit}</td>
                        <td className="px-4 py-4 text-center text-red-655">{item.discarded} {item.unit}</td>
                        <td className="px-4 py-4 text-center text-slate-400">{item.parStock} {item.unit}</td>
                        <td className="px-4 py-4 text-center">
                          <span className={cn(
                            "rounded px-1.5 py-0.5 text-[9px] font-bold border",
                            ratio >= 100 ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                            ratio > 70 ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-red-50 text-red-650 border-red-100"
                          )}>
                            {ratio}%
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center text-slate-400">
                          <ChevronRight className="h-4 w-4 mx-auto" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MACHINES & CONSUMABLES RESOUCE CENTER */}
      {activeTab === "machines" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Machines list */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider border-b border-slate-100 pb-3">
              <Wrench className="h-4 w-4 text-slate-600" /> Wash & Iron Equipment Controls
            </h3>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {machinesList.map((m) => (
                <div key={m.id} className={cn(
                  "border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs",
                  m.lockout ? "bg-red-50/10 border-red-100" : "bg-slate-50/20 border-slate-100"
                )}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-800">{m.name}</span>
                      <span className={cn(
                        "rounded px-1.5 py-0.5 text-[8px] font-bold border uppercase",
                        m.status === "Idle" ? "bg-slate-50 text-slate-600 border-slate-200" :
                        m.status === "Washing" || m.status === "Drying" || m.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                        "bg-red-50 text-red-700 border-red-100"
                      )}>
                        {m.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 mt-2 text-[10px] text-slate-400 font-semibold">
                      <div>Cycle Program: <strong className="text-slate-600">{m.cycle}</strong></div>
                      <div>Active Load: <strong className="text-slate-600">{m.load}</strong></div>
                      <div>Remaining: <strong className="text-blue-600">{m.remaining}</strong></div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => handleToggleLockout(m.id)}
                    className={cn(
                      "text-[10px] px-2.5 py-1.5 rounded-xl font-bold h-7.5 shrink-0 self-end sm:self-center transition-all",
                      m.lockout
                        ? "!bg-[#0F8A5F] hover:!bg-[#0d7d56] !text-white !border-transparent"
                        : "!bg-white hover:!bg-red-50/30 !text-[#DC3545] !border-[#DC3545]"
                    )}
                  >
                    {m.lockout ? "Unlock Machine" : "Trigger Lockout"}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Consumables Inventory */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider border-b border-slate-100 pb-3">
              <Package className="h-4 w-4 text-slate-600" /> Laundry Consumables Stock
            </h3>

            <div className="space-y-4">
              {consumables.map((c) => {
                const isLow = c.stock < c.limit;
                return (
                  <div key={c.id} className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0 space-y-1.5 text-xs font-semibold">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-800">{c.name}</span>
                      <span className={cn(
                        "rounded px-1.5 py-0.5 text-[8.5px] border font-extrabold uppercase",
                        isLow ? "bg-red-50 text-red-600 border-red-100 animate-pulse" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                      )}>
                        {isLow ? "Low Stock Alert" : "Stock Stable"}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div
                          className={cn("rounded-full h-2", isLow ? "bg-red-500" : "bg-emerald-600")}
                          style={{ width: `${Math.min(100, (c.stock / (c.limit * 1.5)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-slate-700 w-14 text-right">{c.stock} {c.unit}</span>
                      
                      <div className="flex gap-1.5">
                        <Button
                          variant="outline"
                          onClick={() => handleDeductChemical(c.id, 1)}
                          className="h-6 w-8 text-[9px] !bg-slate-100 hover:!bg-slate-205 !text-slate-750 font-bold !border-slate-200 rounded-lg p-0 flex items-center justify-center"
                        >
                          -1
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDeductChemical(c.id, 5)}
                          className="h-6 w-8 text-[9px] !bg-slate-100 hover:!bg-slate-205 !text-slate-750 font-bold !border-slate-200 rounded-lg p-0 flex items-center justify-center"
                        >
                          -5
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REPORTS & ANALYTICS */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 border-b border-slate-150 pb-2">
            {[
              { id: "daily", label: "Daily Laundry" },
              { id: "revenue", label: "Revenue & Billing" },
              { id: "inventory", label: "Inventory Stock" },
              { id: "damage", label: "Damage & Loss Logs" },
              { id: "staff", label: "Staff Performance" },
            ].map((rep) => (
              <button
                key={rep.id}
                onClick={() => setActiveReportTab(rep.id as any)}
                className={cn(
                  "px-3 py-1.5 rounded-xl border text-[10.5px] font-bold uppercase transition-all whitespace-nowrap",
                  activeReportTab === rep.id
                    ? "!bg-[#0F8A5F] text-white border-transparent"
                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                )}
              >
                {rep.label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <BarChart3 className="h-4 w-4 text-emerald-700" />
                Report Preview: {activeReportTab.toUpperCase()}
              </h3>
              <Button
                variant="outline"
                className="text-[10px] font-bold h-7 border-slate-200 hover:bg-slate-100 px-3 flex items-center gap-1.5 rounded-xl"
                onClick={() => setToast({ message: "Report export triggered successfully.", variant: "success" })}
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" /> Export Excel
              </Button>
            </div>

            {activeReportTab === "daily" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold">
                      <th className="py-2.5">Job ID</th>
                      <th className="py-2.5">Source</th>
                      <th className="py-2.5">Item</th>
                      <th className="py-2.5 text-center">Pcs</th>
                      <th className="py-2.5 text-center">Status</th>
                      <th className="py-2.5 text-right">Billing Charge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {laundryJobs.map((j) => (
                      <tr key={j.id}>
                        <td className="py-3 text-[11px] font-extrabold text-slate-500">{j.id}</td>
                        <td className="py-3">{j.type === "Guest" ? "Room " + j.room : "Hotel Stock"}</td>
                        <td className="py-3 text-slate-600">{j.item}</td>
                        <td className="py-3 text-center">{j.quantity}</td>
                        <td className="py-3 text-center">
                          <span className={cn("px-1.5 py-0.5 rounded-full text-[8.5px] border uppercase", statusBadges[j.status])}>
                            {j.status}
                          </span>
                        </td>
                        <td className="py-3 text-right font-extrabold text-slate-900">INR {j.charges}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeReportTab === "revenue" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross revenue</p>
                    <p className="text-2xl font-extrabold text-slate-800 mt-1">INR {laundryJobs.reduce((acc, curr) => acc + curr.charges, 0)}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Est. tax collections (GST 18%)</p>
                    <p className="text-2xl font-extrabold text-slate-800 mt-1">INR {Math.round(laundryJobs.reduce((acc, curr) => acc + curr.charges, 0) * 0.18)}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net profit margin</p>
                    <p className="text-2xl font-extrabold text-emerald-700 mt-1">INR {Math.round(laundryJobs.reduce((acc, curr) => acc + curr.charges, 0) * 0.82)}</p>
                  </div>
                </div>
              </div>
            )}

            {activeReportTab === "inventory" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold">
                      <th className="py-2.5">Stock Name</th>
                      <th className="py-2.5 text-center">Available Stock</th>
                      <th className="py-2.5 text-center">Min Threshold Limit</th>
                      <th className="py-2.5 text-center">Consumable Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {consumables.map((c) => (
                      <tr key={c.id}>
                        <td className="py-3 font-bold text-slate-800">{c.name}</td>
                        <td className="py-3 text-center">{c.stock} {c.unit}</td>
                        <td className="py-3 text-center">{c.limit} {c.unit}</td>
                        <td className="py-3 text-center">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase",
                            c.stock < c.limit ? "bg-red-50 text-red-655 border-red-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                          )}>
                            {c.stock < c.limit ? "Needs Reorder" : "Stock OK"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeReportTab === "damage" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold">
                      <th className="py-2.5">Damage ID</th>
                      <th className="py-2.5">Job ID</th>
                      <th className="py-2.5">Guest/Room</th>
                      <th className="py-2.5">Garment Details</th>
                      <th className="py-2.5">Reported Damage</th>
                      <th className="py-2.5 text-right">Compensation Cost</th>
                      <th className="py-2.5 text-center">Action Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {damageLogs.map((d) => (
                      <tr key={d.id}>
                        <td className="py-3 font-extrabold text-[11px] text-slate-500">{d.id}</td>
                        <td className="py-3 font-bold text-[11px] text-slate-700">{d.jobId}</td>
                        <td className="py-3">{d.guest} (Room {d.room})</td>
                        <td className="py-3">{d.garment}</td>
                        <td className="py-3 text-red-655 font-medium">{d.damage}</td>
                        <td className="py-3 text-right font-bold text-slate-900">INR {d.cost}</td>
                        <td className="py-3 text-center">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[8.5px] border uppercase",
                            d.status === "Approved" ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                          )}>
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeReportTab === "staff" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold">
                      <th className="py-2.5">Staff Name</th>
                      <th className="py-2.5 text-center">Active Jobs Assigned</th>
                      <th className="py-2.5 text-center">Monthly Bags Processed</th>
                      <th className="py-2.5 text-center">Efficiency Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {staffList.map((s, idx) => (
                      <tr key={s}>
                        <td className="py-3 font-bold text-slate-800">{s}</td>
                        <td className="py-3 text-center">{idx % 2 + 1} active</td>
                        <td className="py-3 text-center">{120 - idx * 10} bags</td>
                        <td className="py-3 text-center">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded text-[9.5px] font-mono">
                            {98 - idx * 2}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: OPERATIONAL AUDIT LOGS */}
      {activeTab === "audit" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <History className="h-4 w-4 text-slate-655 animate-spin-slow" />
              Laundry Operational Audit Logs
            </h3>
            <span className="text-[10px] text-slate-400 font-bold">Traceability logs active</span>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs font-semibold">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold">
                  <th className="px-4 py-2.5">Date & Time</th>
                  <th className="px-4 py-2.5">Event Type</th>
                  <th className="px-4 py-2.5">User operator</th>
                  <th className="px-4 py-2.5">Action Details Log</th>
                  <th className="px-4 py-2.5 text-center">Job Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 font-mono text-[10.5px]">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{log.event}</td>
                    <td className="px-4 py-3 text-slate-600">{log.user}</td>
                    <td className="px-4 py-3 text-slate-500 font-normal leading-relaxed">{log.details}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[8.5px] font-bold">
                        {log.target}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILED LAUNDRY JOB CLEANING CONSOLE DRAWER */}
      <Drawer
        open={!!selectedJobId}
        onClose={() => setSelectedJobId(null)}
        title={`${selectedJob?.id || "Laundry Job"} Operations & Quality Control`}
        width="xl"
      >
        {selectedJob && (() => {
          const extra = getJobExtra(selectedJob);
          const priority = getJobPriority(selectedJob);
          const machine = getMachineInfo(selectedJob);
          const estFinish = getJobEstFinish(selectedJob);
          const isDelayed = isJobDelayed(selectedJob);

          // Calculate cost variance and margin
          const profit = selectedJob.charges - (extra.vendorCost || 0);
          const margin = selectedJob.charges > 0 ? Math.round((profit / selectedJob.charges) * 100) : 0;

          return (
            <div className="flex flex-col h-full bg-slate-50/30">
              <div className="flex-1 overflow-y-auto p-5 space-y-4 select-none">
                
                {/* Visual Timeline Pipeline */}
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                  <h4 className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    Laundry Service Pipeline Status
                  </h4>
                  <div className="flex flex-col gap-2 pl-2">
                    {[
                      { label: "Requested & Registered", stepStatus: "Requested" },
                      { label: "Collected from Guest", stepStatus: "Collection" },
                      { label: "Pre-Inspected (Damage Checked)", stepStatus: "Collection" },
                      { label: "Wash Batch Assigned", stepStatus: "Collection" },
                      { label: "Processing (Washing/Ironing)", stepStatus: "Washing" },
                      { label: "Quality Inspection Passed", stepStatus: "Ready" },
                      { label: "Delivered to Guest", stepStatus: "Delivered" },
                      { label: "Folio Charges Posted & Closed", stepStatus: "Delivered" },
                    ].map((step, idx) => {
                      // Map state machine index
                      let isCompleted = false;
                      let isCurrent = false;

                      const currentIdx = selectedJob.status === "Collection" ? 1 :
                                         selectedJob.status === "Washing" ? 4 :
                                         selectedJob.status === "Ironing" ? 4 :
                                         selectedJob.status === "Ready" ? 5 : 7;

                      if (idx < currentIdx) {
                        isCompleted = true;
                      } else if (idx === currentIdx) {
                        isCurrent = true;
                      }

                      return (
                        <div key={step.label} className="flex items-center gap-3">
                          <div className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white",
                            isCompleted ? "bg-emerald-600" :
                            isCurrent ? "bg-orange-500" : "bg-slate-200"
                          )}>
                            {isCompleted ? "✓" : idx + 1}
                          </div>
                          <span className={cn(
                            "text-xs font-semibold",
                            isCurrent ? "text-orange-600 font-extrabold animate-pulse" :
                            isCompleted ? "text-slate-850" : "text-slate-400"
                          )}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* KPI Surcharges & Urgency Summary */}
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                  <h4 className="font-bold text-slate-855 text-[11px] uppercase tracking-wider border-b border-slate-50 pb-1.5 flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-slate-400" /> Laundry Specifications
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs font-semibold text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Job ID</span>
                      <span className="text-slate-900 font-extrabold text-[12px]">{selectedJob.id}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Service Category</span>
                      <span className="text-slate-850 font-bold uppercase">{selectedJob.type}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Urgency Speed</span>
                      <span className="text-slate-850 font-bold uppercase text-red-655">{extra.urgency}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Service Type</span>
                      <span className="text-slate-850 font-bold">{extra.serviceType}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Est. Turnaround</span>
                      <span className="text-slate-750 font-bold">{estFinish}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Wash Batch</span>
                      <span className="text-slate-750 font-bold text-blue-700">{extra.washBatch} Batch</span>
                    </div>
                  </div>
                </div>

                {/* Pre-Inspection & Care Warning Panel */}
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                  <h4 className="font-bold text-slate-855 text-[11px] uppercase tracking-wider border-b border-slate-50 pb-1.5 flex items-center gap-1.5">
                    <Camera className="h-4 w-4 text-emerald-700" /> Pre-Processing Inspection Check
                  </h4>
                  <div className="space-y-3 text-xs font-semibold">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-450">Care Label Limit:</span>
                      <span className="text-slate-800 font-bold bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                        {extra.preInspection.careLabel}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Intake Defects Found</span>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] border font-bold",
                          extra.preInspection.stains ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                        )}>
                          {extra.preInspection.stains ? "⚠ Stains Logged" : "✓ No Stains"}
                        </span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] border font-bold",
                          extra.preInspection.tears ? "bg-red-50 text-red-700 border-red-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                        )}>
                          {extra.preInspection.tears ? "⚠ Tears Logged" : "✓ No Tears"}
                        </span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] border font-bold",
                          extra.preInspection.buttons ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                        )}>
                          {extra.preInspection.buttons ? "⚠ Loose Buttons" : "✓ Buttons OK"}
                        </span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] border font-bold",
                          extra.preInspection.fading ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                        )}>
                          {extra.preInspection.fading ? "⚠ Fading/Discolor" : "✓ Color OK"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Damage Evidence Photo</span>
                      <div className="mt-1 flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                        <Camera className="h-6 w-6 text-slate-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-800 font-bold">InspectionPhoto_LD.jpg</p>
                          <p className="text-[9px] text-slate-400 font-semibold">Pre-intake check-in evidence photo</p>
                        </div>
                        <span className="ml-auto text-[9.5px] font-bold text-emerald-700 hover:underline cursor-pointer">View</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Outsourced Vendor Information */}
                {extra.isOutsourced && (
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                    <h4 className="font-bold text-slate-855 text-[11px] uppercase tracking-wider border-b border-slate-50 pb-1.5 flex items-center gap-1.5">
                      <Truck className="h-4 w-4 text-amber-700" /> Outsourcing & Cost Reconciliation
                    </h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs font-semibold text-slate-700">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Laundry Partner</span>
                        <span className="text-slate-850 font-bold flex items-center gap-1 text-slate-900">
                          {extra.vendorName}
                          <ExternalLink className="h-3 w-3 text-slate-400" />
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Dispatch Status</span>
                        <span className="bg-amber-50 text-amber-700 border border-amber-100 rounded px-1.5 py-0.5 text-[8px] uppercase font-extrabold">
                          Sent to Vendor
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Vendor Invoice Cost</span>
                        <span className="text-slate-850 font-bold text-red-655">INR {extra.vendorCost}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Retail Guest Charge</span>
                        <span className="text-emerald-700 font-extrabold">INR {selectedJob.charges}</span>
                      </div>
                      <div className="col-span-2 border-t border-slate-50 pt-2.5 flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-semibold">Net Profit Margin:</span>
                        <span className="text-emerald-700 font-extrabold">
                          INR {profit} ({margin}% Margin)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cost Center / Internal Allocation Details */}
                {selectedJob.type !== "Guest" && (
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                    <h4 className="font-bold text-slate-855 text-[11px] uppercase tracking-wider border-b border-slate-50 pb-1.5 flex items-center gap-1.5">
                      <Shirt className="h-4 w-4 text-blue-700" /> BOH Internal Cost Center
                    </h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs font-semibold text-slate-700">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Allocation Category</span>
                        <span className="text-slate-850 font-bold">
                          {extra.employeeName ? "Staff Uniform Laundry" : "Hotel Linen Laundry"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Cost Center</span>
                        <span className="text-slate-850 font-bold uppercase text-blue-700">
                          {extra.costCenter || "Housekeeping"}
                        </span>
                      </div>
                      {extra.employeeName && (
                        <>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Employee Name</span>
                            <span className="text-slate-850 font-bold text-slate-900">{extra.employeeName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Department</span>
                            <span className="text-slate-800">{extra.employeeDept}</span>
                          </div>
                        </>
                      )}
                      <div className="col-span-2 border-t border-slate-50 pt-2 text-[10px] text-slate-400 font-semibold leading-relaxed">
                        * Internal laundry costs are aggregated monthly and billed to the respective department budget lines (no guest folio posting occurred).
                      </div>
                    </div>
                  </div>
                )}

                {/* Machine Assignment & Lockout */}
                {selectedJob.status === "Washing" && (
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                    <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider border-b border-slate-50 pb-1.5 flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-slate-400" /> Wash Capacity status
                    </h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs font-semibold text-slate-700">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Assigned Machine</span>
                        <span className="text-slate-900 font-extrabold flex items-center gap-1">
                          {machine.machine}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Operator Staff</span>
                        <span className="text-slate-800">Ravi Shankar</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Charges Invoice Card */}
                {selectedJob.type === "Guest" && (
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                    <h4 className="font-bold text-slate-855 text-[11px] uppercase tracking-wider border-b border-slate-50 pb-1.5 flex items-center gap-1.5">
                      <Coins className="h-4 w-4 text-slate-400" /> Guest Folio Invoice Details
                    </h4>
                    <div className="space-y-2 text-xs font-semibold text-slate-700">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Base Surcharge:</span>
                        <span>INR {selectedJob.charges}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tax GST (18%):</span>
                        <span>INR {Math.round(selectedJob.charges * 0.18)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-400">Payment status</span>
                        <span className="bg-amber-50 text-amber-700 border border-amber-100 rounded px-1.5 py-0.5 text-[8px] uppercase font-extrabold">
                          Pending Folio Charge
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1">
                        <span>Grand Total:</span>
                        <span>INR {selectedJob.charges + Math.round(selectedJob.charges * 0.18)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Audit History Logs */}
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                  <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider border-b border-slate-50 pb-1.5 flex items-center gap-1.5">
                    <History className="h-4 w-4 text-slate-400" /> Pipeline Logs
                  </h4>
                  <div className="space-y-2 text-[10.5px] font-semibold text-slate-500 font-mono">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span>Collection and pre-inspection check</span>
                      <span className="text-slate-400 font-normal">{selectedJob.timeline.collectedAt}</span>
                    </div>
                    {selectedJob.timeline.washedAt && (
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span>Washing & Batching complete</span>
                        <span className="text-slate-400 font-normal">{selectedJob.timeline.washedAt}</span>
                      </div>
                    )}
                    {selectedJob.timeline.readyAt && (
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span>Quality check passed & packaged</span>
                        <span className="text-slate-400 font-normal">{selectedJob.timeline.readyAt}</span>
                      </div>
                    )}
                    {selectedJob.timeline.deliveredAt && (
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span>Delivered to guest & charges posted</span>
                        <span className="text-slate-400 font-normal">{selectedJob.timeline.deliveredAt}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Interactive Quality Inspection Panel */}
                {(selectedJob.status === "Ironing" || selectedJob.status === "Ready") && extra.qualityInspection === "Pending" && (
                  <div className="rounded-2xl border border-slate-200 bg-amber-50/15 p-4 shadow-sm space-y-3">
                    <h4 className="font-bold text-amber-800 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                      Quality Inspection Pending
                    </h4>
                    <p className="text-[10px] font-semibold text-slate-500 leading-relaxed">
                      Before changing status to Ready/Delivered, perform the garment quality check.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleQualityCheck(selectedJob.id, "Failed")}
                        className="w-1/2 !bg-red-50 hover:!bg-red-100 !border-red-200 !text-red-750 font-bold text-xs h-8.5 rounded-xl flex items-center justify-center gap-1.5 transition-all"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" /> Fail (Reprocess)
                      </Button>
                      <Button
                        onClick={() => handleQualityCheck(selectedJob.id, "Passed")}
                        className="w-1/2 !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white font-bold text-xs h-8.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" /> Pass Quality
                      </Button>
                    </div>
                  </div>
                )}

              </div>

              {/* Drawer Sticky Footer Actions */}
              <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex gap-3 shadow-lg">
                <Button
                  variant="outline"
                  onClick={() => setSelectedJobId(null)}
                  className="w-1/2 !bg-slate-100 hover:!bg-slate-200 !text-slate-700 !border-slate-205 flex items-center justify-center text-xs py-2 px-3 font-bold rounded-xl transition-all h-9"
                >
                  Close Console
                </Button>

                {selectedJob.status !== "Delivered" && (
                  <Button
                    onClick={() => {
                      const next = LAUNDRY_STATUS_STEPS[LAUNDRY_STATUS_STEPS.indexOf(selectedJob.status) + 1];
                      advanceStatus(selectedJob.id, selectedJob.status);
                      setSelectedJobId(null);
                    }}
                    disabled={selectedJob.status === "Ironing" && extra.qualityInspection === "Pending"}
                    className={cn(
                      "w-1/2 text-white flex items-center justify-center text-xs py-2 px-3 font-bold rounded-xl transition-all shadow-xs h-9",
                      selectedJob.status === "Ironing" && extra.qualityInspection === "Pending"
                        ? "bg-slate-300 hover:bg-slate-350 cursor-not-allowed text-slate-400"
                        : "!bg-[#0F8A5F] hover:!bg-[#0d7d56]"
                    )}
                  >
                    Advance Status to {LAUNDRY_STATUS_STEPS[LAUNDRY_STATUS_STEPS.indexOf(selectedJob.status) + 1] || "Delivered"}
                  </Button>
                )}
              </div>
            </div>
          );
        })()}
      </Drawer>

      {/* DISCARD DETAILS DRAWER */}
      <Drawer open={!!selectedLinenId} onClose={() => setSelectedLinenId(null)} title="Egypt Cotton Linen Ledger">
        {selectedLinen && (
          <div className="flex flex-col h-full bg-slate-50/30">
            <div className="flex-1 overflow-y-auto p-5 space-y-4 select-none">
              
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider border-b border-slate-50 pb-1.5 flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-emerald-700 animate-pulse" /> Available Linen Stocks
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Active stock available</span>
                    <span className="text-slate-900 font-extrabold text-[12.5px]">{selectedLinen.available} Pcs</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">In laundry process</span>
                    <span className="text-blue-700 font-bold">{selectedLinen.laundry} Pcs</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider border-b border-slate-50 pb-1.5 flex items-center gap-1.5">
                  <History className="h-4 w-4 text-slate-400" /> Discard & Damage History
                </h4>
                <div className="space-y-2 text-xs font-semibold">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-555">Discarded items</span>
                    <span className="text-red-655 font-extrabold">{selectedLinen.discarded} Pcs</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-555">Damaged items</span>
                    <span className="text-amber-700 font-bold">{selectedLinen.damaged} Pcs</span>
                  </div>
                  <div className="pt-2 text-[10px] text-slate-405 font-medium leading-relaxed">
                    * Primary discard reasons logged: Fraying of borders, standard wear & tear stains, and chemical bleaching degradation.
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm space-y-3">
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider border-b border-slate-50 pb-1.5 flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-slate-400" /> Replacement Recommendation
                </h4>
                <div className="p-3 bg-red-50/30 border border-red-100 rounded-xl text-xs font-semibold text-red-800 space-y-1">
                  <div>Recommendation: <strong>Purchase {selectedLinen.parStock - selectedLinen.available} replacement pieces</strong></div>
                  <div className="font-normal text-[10.5px] text-red-655">Current stock availability ratio is {Math.round((selectedLinen.available/selectedLinen.parStock)*100)}% of par levels. Ordering replacements is recommended to avoid hotel operational delays.</div>
                </div>
              </div>

            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex gap-3 shadow-lg">
              <Button
                variant="outline"
                onClick={() => setSelectedLinenId(null)}
                className="w-1/2 !bg-slate-100 hover:!bg-slate-200 !text-slate-700 !border-slate-205 flex items-center justify-center text-xs py-2 px-3 font-bold rounded-xl transition-all h-9"
              >
                Close Details
              </Button>
              <Button
                onClick={() => {
                  setSelectedLinenId(null);
                  setToast({ message: `Purchase requisition triggered for Egypt Cotton ${selectedLinen.name}.`, variant: "success" });
                }}
                className="w-1/2 !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white flex items-center justify-center text-xs py-2 px-3 font-bold rounded-xl transition-all shadow-xs h-9"
              >
                Order Replacements
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* BOOK LAUNDRY JOB DRAWER */}
      <Drawer open={createOpen} onClose={() => setCreateOpen(false)} title="Book Laundry Pipeline Job">
        <div className="space-y-4 select-none">
          <FormField label="Linen Source / Type" required>
            <SelectInput value={type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value as any)}>
              <option value="Guest">Guest Laundry Bag</option>
              <option value="Hotel">Hotel Linen (Internal stock)</option>
              <option value="Staff">Staff Uniform (Internal stock)</option>
            </SelectInput>
          </FormField>

          {type === "Guest" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Room Number" required>
                  <TextInput value={room} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoom(e.target.value)} />
                </FormField>
                <FormField label="Guest Name" required>
                  <TextInput value={guestName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGuestName(e.target.value)} />
                </FormField>
              </div>
              <FormField label="Guest Item Description" required>
                <TextInput
                  placeholder="e.g. 2 Silk shirts, 1 Cotton trousers"
                  value={guestItemText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGuestItemText(e.target.value)}
                />
              </FormField>
            </>
          )}

          {type === "Staff" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Employee Name" required>
                  <TextInput value={employeeName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmployeeName(e.target.value)} />
                </FormField>
                <FormField label="Employee Department" required>
                  <SelectInput value={employeeDept} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEmployeeDept(e.target.value)}>
                    <option value="Front Office">Front Office</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Security">Security</option>
                  </SelectInput>
                </FormField>
              </div>
              <FormField label="Staff Uniform Description" required>
                <TextInput
                  placeholder="e.g. 1 Front Office Blazer, 1 Trouser"
                  value={guestItemText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGuestItemText(e.target.value)}
                />
              </FormField>
            </>
          )}

          {type === "Hotel" && (
            <FormField label="Hotel Linen Item" required>
              <SelectInput value={selectedItem} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedItem(e.target.value)}>
                {hotelLinenItems.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </SelectInput>
            </FormField>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Service Type" required>
              <SelectInput value={serviceType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setServiceType(e.target.value as any)}>
                <option value="Wash & Fold">Wash & Fold</option>
                <option value="Wash & Iron">Wash + Iron + Hanger</option>
                <option value="Dry Cleaning">Dry Cleaning</option>
                <option value="Pressing Only">Pressing Only</option>
              </SelectInput>
            </FormField>
            <FormField label="Service Speed / Urgency" required>
              <SelectInput value={urgency} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setUrgency(e.target.value as any)}>
                <option value="Normal">Normal (Standard rate)</option>
                <option value="Same-Day">Same-Day (+25% Surcharge)</option>
                <option value="Express">Express (+50% Surcharge)</option>
              </SelectInput>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Quantity (Pcs)" required>
              <TextInput type="number" min="1" value={quantity} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(e.target.value)} />
            </FormField>
            <FormField label="Base Rate (INR)" required>
              <TextInput type="number" min="0" value={baseCharges} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBaseCharges(e.target.value)} />
            </FormField>
          </div>

          {/* Pricing Calculation Display */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs font-semibold text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-400">Base Surcharge:</span>
              <span>INR {baseCharges}</span>
            </div>
            {urgency !== "Normal" && (
              <div className="flex justify-between text-red-655 font-bold">
                <span>Speed Surcharge ({urgency === "Same-Day" ? "+25%" : "+50%"}):</span>
                <span>+ INR {calculateTotalCharges - Number(baseCharges)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200/60 pt-1.5 text-sm font-extrabold text-slate-900">
              <span>Estimated Total Charges:</span>
              <span>INR {calculateTotalCharges}</span>
            </div>
          </div>

          {/* Pre-Inspection Checklist Section */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2.5">
            <p className="font-bold text-slate-800 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="h-4 w-4 text-emerald-700" /> Intake Pre-Inspection Check
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900 select-none">
                <input type="checkbox" checked={stains} onChange={(e) => setStains(e.target.checked)} className="rounded border-slate-300 text-emerald-700" />
                Stains Logged
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900 select-none">
                <input type="checkbox" checked={tears} onChange={(e) => setTears(e.target.checked)} className="rounded border-slate-300 text-emerald-700" />
                Tears / Rips Logged
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900 select-none">
                <input type="checkbox" checked={buttons} onChange={(e) => setButtons(e.target.checked)} className="rounded border-slate-300 text-emerald-700" />
                Loose Buttons
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900 select-none">
                <input type="checkbox" checked={fading} onChange={(e) => setFading(e.target.checked)} className="rounded border-slate-300 text-emerald-700" />
                Fading / Discoloration
              </label>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-slate-100">
              <FormField label="Care Label Warning">
                <SelectInput value={careLabel} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCareLabel(e.target.value)}>
                  <option value="Normal Cotton">Normal Cotton</option>
                  <option value="Silk / Delicates">Silk (Cold Wash Only)</option>
                  <option value="Wool">Wool (No Spin)</option>
                  <option value="Dry Clean Only">Dry Clean Only</option>
                </SelectInput>
              </FormField>
              <FormField label="Wash Batch Group">
                <SelectInput value={washBatch} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setWashBatch(e.target.value as any)}>
                  <option value="Colors">Colors Batch</option>
                  <option value="Whites">Whites Batch</option>
                  <option value="Delicates">Delicates Batch</option>
                </SelectInput>
              </FormField>
            </div>
          </div>

          {/* Outsourced Vendor Routing */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-slate-500" /> Outsourcing to external partner
              </span>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input type="checkbox" checked={isOutsourced} onChange={(e) => setIsOutsourced(e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {isOutsourced && (
              <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1.5 duration-200">
                <FormField label="Outsource Vendor">
                  <SelectInput value={vendorName} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setVendorName(e.target.value)}>
                    <option value="Elite Dry Cleaners Ltd">Elite Dry Cleaners Ltd</option>
                    <option value="City Linen Services Inc">City Linen Services Inc</option>
                    <option value="Metropolitan Laundry Hub">Metropolitan Laundry Hub</option>
                  </SelectInput>
                </FormField>
                <FormField label="Vendor Cost Price (INR)">
                  <TextInput type="number" min="0" value={vendorCost} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVendorCost(e.target.value)} />
                </FormField>
              </div>
            )}
          </div>

          {/* Internal Cost Allocation */}
          {type !== "Guest" && (
            <FormField label="BOH Cost Center Allocation" required>
              <SelectInput value={costCenter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCostCenter(e.target.value)}>
                <option value="Housekeeping">Housekeeping Operations</option>
                <option value="Food & Beverage">Food & Beverage division</option>
                <option value="Human Resources">Human Resources (HR)</option>
                <option value="Front Office">Front Office department</option>
              </SelectInput>
            </FormField>
          )}

          <FormField label="Remarks / Special Handling">
            <TextAreaInput
              placeholder="e.g. Iron cuffs flat, return on wood hangers, check pockets for loose cards."
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            />
          </FormField>

          <Button
            onClick={handleCreateJob}
            className="w-full !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white font-bold py-2.5 rounded-xl transition-all shadow-sm"
          >
            Confirm & Print KOT
          </Button>
        </div>
      </Drawer>

      {/* DISCARD LINEN ITEM DRAWER */}
      <Drawer open={discardOpen} onClose={() => setDiscardOpen(false)} title="Log Linen Wear Discard">
        <div className="space-y-4">
          <FormField label="Linen Stock Item" required>
            <SelectInput value={discardItemId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDiscardItemId(e.target.value)}>
              {hotelLinenItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} (Avail: {item.available} Pcs)
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Quantity to Discard" required>
            <TextInput type="number" min="1" value={discardQty} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDiscardQty(e.target.value)} />
          </FormField>

          <div className="rounded-xl bg-red-50 border border-red-100 p-3.5 text-xs text-red-800 font-semibold leading-relaxed">
            <strong>Warning:</strong> Discarding items permanently removes them from active hotel in-use inventory. Verify physical audit counts match.
          </div>

          <Button
            onClick={handleDiscard}
            className="w-full bg-red-655 hover:bg-red-750 text-white font-bold py-2.5 rounded-xl transition-all shadow-sm"
          >
            Confirm Discard
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
