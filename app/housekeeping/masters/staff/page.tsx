"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Users,
  Clock,
  ShieldCheck,
  Layers,
  Sparkles,
  Lock,
  Plus,
  Search,
  Eye,
  Edit2,
  Power,
  Download,
  CheckCircle2,
  FileText,
  UserCheck,
  Briefcase,
  Phone,
  Mail,
  Building,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import {
  TextInput,
  SelectInput,
  FormField,
  TextAreaInput,
  FOPageHeader,
  StatMiniCard,
} from "@/components/frontoffice/ui";
import { OperationsToolbar, OperationsFilterDrawer } from "@/components/housekeeping/OperationsToolbar";
import { ModuleSelectionBar } from "@/components/pms/ModuleSelectionBar";
import {
  INITIAL_STAFF_RECORDS,
  INITIAL_SHIFT_RECORDS,
  INITIAL_ROLE_RECORDS,
  INITIAL_TEAM_RECORDS,
  INITIAL_ASSIGNMENT_RULES,
  StaffMasterRecord,
  ShiftMasterRecord,
  RoleMasterRecord,
  TeamMasterRecord,
  AssignmentRuleRecord,
} from "@/app/data/housekeepingWorkforceMasters";

type TabType = "staff" | "shifts" | "roles" | "teams" | "rules";

export default function StaffWorkforceMastersPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Main Tabs State
  const [activeTab, setActiveTab] = useState<TabType>("staff");

  // Datasets State
  const [staffList, setStaffList] = useState<StaffMasterRecord[]>(INITIAL_STAFF_RECORDS);
  const [shiftList, setShiftList] = useState<ShiftMasterRecord[]>(INITIAL_SHIFT_RECORDS);
  const [roleList, setRoleList] = useState<RoleMasterRecord[]>(INITIAL_ROLE_RECORDS);
  const [teamList, setTeamList] = useState<TeamMasterRecord[]>(INITIAL_TEAM_RECORDS);
  const [ruleList, setRuleList] = useState<AssignmentRuleRecord[]>(INITIAL_ASSIGNMENT_RULES);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab]);

  // Drawer View State
  const [selectedStaffItem, setSelectedStaffItem] = useState<StaffMasterRecord | null>(null);
  const [selectedShiftItem, setSelectedShiftItem] = useState<ShiftMasterRecord | null>(null);
  const [selectedRoleItem, setSelectedRoleItem] = useState<RoleMasterRecord | null>(null);
  const [selectedTeamItem, setSelectedTeamItem] = useState<TeamMasterRecord | null>(null);
  const [selectedRuleItem, setSelectedRuleItem] = useState<AssignmentRuleRecord | null>(null);

  // Edit Drawer State
  const [editStaffItem, setEditStaffItem] = useState<StaffMasterRecord | null>(null);
  const [editShiftItem, setEditShiftItem] = useState<ShiftMasterRecord | null>(null);

  // Add Drawer State
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);

  // Form Fields - New Staff
  const [newEmpId, setNewEmpId] = useState("");
  const [newEmpName, setNewEmpName] = useState("");
  const [newRole, setNewRole] = useState("Senior Housekeeper");
  const [newTeam, setNewTeam] = useState("East Wing Lead Squad");
  const [newShift, setNewShift] = useState("Morning Shift (07:00 - 15:30)");
  const [newPhone, setNewPhone] = useState("+91 ");
  const [newEmail, setNewEmail] = useState("");

  // Form Fields - New Shift
  const [newShiftCode, setNewShiftCode] = useState("");
  const [newShiftName, setNewShiftName] = useState("");
  const [newStartTime, setNewStartTime] = useState("07:00 AM");
  const [newEndTime, setNewEndTime] = useState("03:30 PM");

  // Form Fields - New Role
  const [newRoleCode, setNewRoleCode] = useState("");
  const [newRoleName, setNewRoleName] = useState("");
  const [newDept, setNewDept] = useState("Operations");

  // Form Fields - New Team
  const [newTeamCode, setNewTeamCode] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [newSupervisor, setNewSupervisor] = useState("Ramesh Kumar");

  // Form Fields - New Rule
  const [newRuleCode, setNewRuleCode] = useState("");
  const [newRuleName, setNewRuleName] = useState("");
  const [newRulePriority, setNewRulePriority] = useState<"Critical" | "High" | "Medium" | "Low">("High");

  // Toast
  const [toast, setToast] = useState<{ message: string; variant: "success" | "info" } | null>(null);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Dynamic KPI Metric Calculations
  const metrics = useMemo(() => {
    const activeStaffCount = staffList.filter((s) => s.status === "Active").length;
    const inactiveStaffCount = staffList.filter((s) => s.status !== "Active").length;
    const shiftCount = shiftList.length;
    const supervisorCount = staffList.filter((s) => s.role.includes("Supervisor") || s.role.includes("Inspector")).length;
    const teamCount = teamList.length;
    const totalCredits = staffList.reduce((acc, s) => acc + (s.status === "Active" ? s.creditCapacity : 0), 0);

    return {
      activeStaffCount,
      inactiveStaffCount,
      shiftCount,
      supervisorCount,
      teamCount,
      totalCredits,
    };
  }, [staffList, shiftList, teamList]);

  // Active Filter Count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (roleFilter !== "all") count++;
    if (shiftFilter !== "all") count++;
    return count;
  }, [statusFilter, roleFilter, shiftFilter]);

  // Dynamic Search Placeholder
  const searchPlaceholder = useMemo(() => {
    switch (activeTab) {
      case "staff":
        return "Search employee ID, name, phone, or role…";
      case "shifts":
        return "Search shift code, shift name, or timing…";
      case "roles":
        return "Search role code, name, or department…";
      case "teams":
        return "Search team code, name, or supervisor…";
      case "rules":
        return "Search rule name, priority, or zone…";
    }
  }, [activeTab]);

  // Filtered Data Lists
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const matchSearch =
        s.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        s.employeeId.toLowerCase().includes(search.toLowerCase()) ||
        s.phone.toLowerCase().includes(search.toLowerCase()) ||
        s.role.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "all" || s.status.toLowerCase() === statusFilter.toLowerCase();
      const matchRole = roleFilter === "all" || s.role.toLowerCase() === roleFilter.toLowerCase();
      const matchShift = shiftFilter === "all" || s.assignedShift.toLowerCase().includes(shiftFilter.toLowerCase());

      return matchSearch && matchStatus && matchRole && matchShift;
    });
  }, [staffList, search, statusFilter, roleFilter, shiftFilter]);

  const filteredShifts = useMemo(() => {
    return shiftList.filter((sh) => {
      const matchSearch =
        sh.shiftName.toLowerCase().includes(search.toLowerCase()) ||
        sh.shiftCode.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || sh.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [shiftList, search, statusFilter]);

  const filteredRoles = useMemo(() => {
    return roleList.filter((r) => {
      const matchSearch =
        r.roleName.toLowerCase().includes(search.toLowerCase()) ||
        r.roleCode.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || r.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [roleList, search, statusFilter]);

  const filteredTeams = useMemo(() => {
    return teamList.filter((t) => {
      const matchSearch =
        t.teamName.toLowerCase().includes(search.toLowerCase()) ||
        t.teamCode.toLowerCase().includes(search.toLowerCase()) ||
        t.supervisor.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || t.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [teamList, search, statusFilter]);

  const filteredRules = useMemo(() => {
    return ruleList.filter((rl) => {
      const matchSearch =
        rl.ruleName.toLowerCase().includes(search.toLowerCase()) ||
        rl.ruleCode.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || rl.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [ruleList, search, statusFilter]);

  // Status Badge Component Helper
  const renderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[9px] font-extrabold uppercase">Active</span>;
      case "inactive":
        return <span className="rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 text-[9px] font-extrabold uppercase">Inactive</span>;
      case "draft":
        return <span className="rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 text-[9px] font-extrabold uppercase">Draft</span>;
      case "suspended":
        return <span className="rounded-full bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 text-[9px] font-extrabold uppercase">Suspended</span>;
      case "archived":
        return <span className="rounded-full bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 text-[9px] font-extrabold uppercase">Archived</span>;
      default:
        return <span className="rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 text-[9px] font-extrabold uppercase">{status}</span>;
    }
  };

  // Handlers: Toggle Record Status
  const handleToggleStatus = (id: string, type: TabType) => {
    if (type === "staff") {
      setStaffList((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: s.status === "Active" ? "Inactive" : "Active" } : s))
      );
    } else if (type === "shifts") {
      setShiftList((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: s.status === "Active" ? "Inactive" : "Active" } : s))
      );
    } else if (type === "roles") {
      setRoleList((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: r.status === "Active" ? "Inactive" : "Active" } : r))
      );
    } else if (type === "teams") {
      setTeamList((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: t.status === "Active" ? "Inactive" : "Active" } : t))
      );
    } else if (type === "rules") {
      setRuleList((prev) =>
        prev.map((rl) => (rl.id === id ? { ...rl, status: rl.status === "Active" ? "Inactive" : "Active" } : rl))
      );
    }
    setToast({ message: "Master record status updated successfully.", variant: "success" });
  };

  // Save Edit Handlers
  const handleSaveStaffEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStaffItem) return;
    setStaffList((prev) => prev.map((s) => (s.id === editStaffItem.id ? editStaffItem : s)));
    setEditStaffItem(null);
    setToast({ message: `Staff Member ${editStaffItem.employeeName} updated!`, variant: "success" });
  };

  const handleSaveShiftEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editShiftItem) return;
    setShiftList((prev) => prev.map((sh) => (sh.id === editShiftItem.id ? editShiftItem : sh)));
    setEditShiftItem(null);
    setToast({ message: `Shift ${editShiftItem.shiftName} updated!`, variant: "success" });
  };

  // Add Item Submit Handler
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "staff") {
      if (!newEmpName.trim()) return;
      const created: StaffMasterRecord = {
        id: `STF-${Math.floor(100 + Math.random() * 900)}`,
        employeeId: newEmpId || `EMP-${Math.floor(10000 + Math.random() * 90000)}`,
        employeeName: newEmpName,
        role: newRole,
        team: newTeam,
        assignedShift: newShift,
        assignedFloors: "Floor 1 & 2",
        phone: newPhone,
        email: newEmail || "staff@grandhotel.com",
        status: "Active",
        employmentType: "Full-Time",
        joinDate: "Today",
        creditCapacity: 14,
      };
      setStaffList([created, ...staffList]);
      setToast({ message: `Staff Member ${newEmpName} enrolled successfully!`, variant: "success" });
    } else if (activeTab === "shifts") {
      if (!newShiftName.trim()) return;
      const created: ShiftMasterRecord = {
        id: `SFT-${Math.floor(100 + Math.random() * 900)}`,
        shiftCode: newShiftCode || `SHF-${Math.floor(100 + Math.random() * 900)}`,
        shiftName: newShiftName,
        startTime: newStartTime,
        endTime: newEndTime,
        duration: "8.5 Hours",
        breakDuration: "45 Mins",
        shiftType: "Standard",
        status: "Active",
        maxStaffAllowed: 20,
      };
      setShiftList([created, ...shiftList]);
      setToast({ message: `Shift ${newShiftName} created successfully!`, variant: "success" });
    } else if (activeTab === "roles") {
      if (!newRoleName.trim()) return;
      const created: RoleMasterRecord = {
        id: `ROL-${Math.floor(100 + Math.random() * 900)}`,
        roleCode: newRoleCode || `ROL-${Math.floor(100 + Math.random() * 900)}`,
        roleName: newRoleName,
        department: newDept,
        permissions: ["View Roster", "Update Status"],
        accessLevel: "Staff",
        status: "Active",
      };
      setRoleList([created, ...roleList]);
      setToast({ message: `Role ${newRoleName} created successfully!`, variant: "success" });
    } else if (activeTab === "teams") {
      if (!newTeamName.trim()) return;
      const created: TeamMasterRecord = {
        id: `TM-${Math.floor(100 + Math.random() * 900)}`,
        teamCode: newTeamCode || `TM-${Math.floor(100 + Math.random() * 900)}`,
        teamName: newTeamName,
        supervisor: newSupervisor,
        membersCount: 5,
        assignedFloors: "Floors 1 & 2",
        zoneArea: "West Wing",
        status: "Active",
      };
      setTeamList([created, ...teamList]);
      setToast({ message: `Team ${newTeamName} created successfully!`, variant: "success" });
    } else if (activeTab === "rules") {
      if (!newRuleName.trim()) return;
      const created: AssignmentRuleRecord = {
        id: `ARL-${Math.floor(100 + Math.random() * 900)}`,
        ruleCode: newRuleCode || `ARL-${Math.floor(100 + Math.random() * 900)}`,
        ruleName: newRuleName,
        applicableShift: "Morning Shift",
        areaZone: "Suites",
        priority: newRulePriority,
        maxRoomsPerStaff: 12,
        status: "Active",
        autoReassignTrigger: "Queue Overflow > 10",
      };
      setRuleList([created, ...ruleList]);
      setToast({ message: `Rule ${newRuleName} created successfully!`, variant: "success" });
    }

    setAddDrawerOpen(false);
  };

  if (!isMounted) return null;

  const firstSelectedStaff = filteredStaff.find((s) => selectedIds.has(s.id));
  const firstSelectedShift = filteredShifts.find((sh) => selectedIds.has(sh.id));

  const selectionBarActions = (() => {
    switch (activeTab) {
      case "staff":
        return [
          {
            label: "View",
            icon: <Eye className="h-3.5 w-3.5" />,
            onClick: () => {
              if (firstSelectedStaff) setSelectedStaffItem(firstSelectedStaff);
            },
          },
          {
            label: "Edit",
            icon: <Edit2 className="h-3.5 w-3.5" />,
            onClick: () => {
              if (firstSelectedStaff) setEditStaffItem(firstSelectedStaff);
            },
          },
          {
            label: firstSelectedStaff?.status === "Active" ? "Deactivate" : "Activate",
            onClick: () => {
              if (firstSelectedStaff) handleToggleStatus(firstSelectedStaff.id, "staff");
            },
          },
        ];
      case "shifts":
        return [
          {
            label: "View",
            icon: <Eye className="h-3.5 w-3.5" />,
            onClick: () => {
              if (firstSelectedShift) setSelectedShiftItem(firstSelectedShift);
            },
          },
          {
            label: "Edit",
            icon: <Edit2 className="h-3.5 w-3.5" />,
            onClick: () => {
              if (firstSelectedShift) setEditShiftItem(firstSelectedShift);
            },
          },
          {
            label: "Deactivate",
            onClick: () => {
              if (firstSelectedShift) handleToggleStatus(firstSelectedShift.id, "shifts");
            },
          },
        ];
      case "roles":
        return [
          {
            label: "View",
            icon: <Eye className="h-3.5 w-3.5" />,
            onClick: () => {
              const first = filteredRoles.find((r) => selectedIds.has(r.id));
              if (first) setSelectedRoleItem(first);
            },
          },
        ];
      case "teams":
        return [
          {
            label: "View",
            icon: <Eye className="h-3.5 w-3.5" />,
            onClick: () => {
              const first = filteredTeams.find((t) => selectedIds.has(t.id));
              if (first) setSelectedTeamItem(first);
            },
          },
        ];
      case "rules":
        return [
          {
            label: "View",
            icon: <Eye className="h-3.5 w-3.5" />,
            onClick: () => {
              const first = filteredRules.find((rl) => selectedIds.has(rl.id));
              if (first) setSelectedRuleItem(first);
            },
          },
        ];
      default:
        return [];
    }
  })();

  const selectionNoun =
    activeTab === "staff"
      ? "staff member"
      : activeTab === "shifts"
      ? "shift"
      : activeTab === "roles"
      ? "role"
      : activeTab === "teams"
      ? "team"
      : "rule";

  return (
    <div className="space-y-5 select-none">
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

      {/* Header */}
      <FOPageHeader
        eyebrow="Housekeeping Masters"
        title="Workforce & Staffing Masters"
        description="Centralized configuration repository for employee profiles, shift schedules, supervisory team structures, role permissions, and credit assignment rules."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setToast({ message: "Exporting Workforce Master roster CSV...", variant: "info" })}
              className="!bg-white hover:!bg-slate-100 !text-slate-700 !border-slate-200 flex items-center justify-center gap-1.5 rounded-xl h-8 px-3 text-xs font-bold shrink-0"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" /> Export Data
            </Button>

            <Button
              onClick={() => setAddDrawerOpen(true)}
              className="!bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white flex items-center justify-center gap-1.5 rounded-xl h-8 px-3.5 text-xs font-bold shrink-0 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              {activeTab === "staff" && "+ Add Staff"}
              {activeTab === "shifts" && "+ Add Shift"}
              {activeTab === "roles" && "+ Add Role"}
              {activeTab === "teams" && "+ Add Team"}
              {activeTab === "rules" && "+ Add Rule"}
            </Button>
          </div>
        }
      />

      {/* Summary KPI Cards (Dynamic Metrics) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatMiniCard label="Active Staff" value={`${metrics.activeStaffCount} Active`} icon={Users} accent="#10b981" />
        <StatMiniCard label="Inactive Staff" value={`${metrics.inactiveStaffCount} Inactive`} icon={Lock} accent="#64748b" />
        <StatMiniCard label="Shift Templates" value={`${metrics.shiftCount} Schedules`} icon={Clock} accent="#2563eb" />
        <StatMiniCard label="Credit Capacity" value={`${metrics.totalCredits} Credits`} icon={Sparkles} accent="#9333ea" />
        <StatMiniCard label="Supervisors" value={`${metrics.supervisorCount} Floor Leads`} icon={ShieldCheck} accent="#0D9488" />
        <StatMiniCard label="Teams" value={`${metrics.teamCount} Squads`} icon={Layers} accent="#d97706" />
      </div>

      {/* Reusable Master Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-4 text-xs font-bold uppercase tracking-wider">
          {[
            { id: "staff", label: `Staff Master (${staffList.length})` },
            { id: "shifts", label: `Shift Master (${shiftList.length})` },
            { id: "roles", label: `Roles Master (${roleList.length})` },
            { id: "teams", label: `Teams Master (${teamList.length})` },
            { id: "rules", label: `Assignment Rules (${ruleList.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as TabType);
                setSearch("");
                setStatusFilter("all");
              }}
              className={cn(
                "pb-2.5 px-0.5 border-b-2 transition-all whitespace-nowrap cursor-pointer",
                activeTab === tab.id
                  ? "border-emerald-700 text-emerald-750 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Search & Filter Operations Toolbar */}
      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={searchPlaceholder}
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setFilterDrawerOpen(true)}
        statusTabs={[
          { id: "all", label: "All Records" },
          { id: "active", label: "Active" },
          { id: "inactive", label: "Inactive" },
        ]}
        activeStatusTab={statusFilter}
        onStatusTabChange={setStatusFilter}
        selectionBar={
          <ModuleSelectionBar
            count={selectedIds.size}
            noun={selectionNoun}
            onClear={() => setSelectedIds(new Set())}
            actions={selectionBarActions}
          />
        }
      />

      {/* Slide-over Filter Drawer */}
      <OperationsFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filter Workforce Masters"
        activeFilterCount={activeFilterCount}
        onReset={() => {
          setStatusFilter("all");
          setRoleFilter("all");
          setShiftFilter("all");
        }}
      >
        <div className="space-y-4 select-none">
          <FormField label="Record Status">
            <SelectInput
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
              <option value="suspended">Suspended</option>
              <option value="archived">Archived</option>
            </SelectInput>
          </FormField>

          {activeTab === "staff" && (
            <>
              <FormField label="Housekeeping Role">
                <SelectInput
                  value={roleFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRoleFilter(e.target.value)}
                  className="w-full text-xs rounded-xl h-9 bg-white"
                >
                  <option value="all">All Roles</option>
                  <option value="Housekeeping Supervisor">Housekeeping Supervisor</option>
                  <option value="Senior Housekeeper">Senior Housekeeper</option>
                  <option value="Room Inspector">Room Inspector</option>
                  <option value="Public Area Attendant">Public Area Attendant</option>
                  <option value="Laundry Specialist">Laundry Specialist</option>
                </SelectInput>
              </FormField>

              <FormField label="Assigned Shift Schedule">
                <SelectInput
                  value={shiftFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setShiftFilter(e.target.value)}
                  className="w-full text-xs rounded-xl h-9 bg-white"
                >
                  <option value="all">All Shifts</option>
                  <option value="Morning">Morning Shift</option>
                  <option value="Evening">Evening Shift</option>
                  <option value="Night">Night Shift</option>
                  <option value="General">General Shift</option>
                </SelectInput>
              </FormField>
            </>
          )}
        </div>
      </OperationsFilterDrawer>

      {/* TAB 1: STAFF MASTER TABLE */}
      {activeTab === "staff" && (
        <div className="space-y-2">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 z-10">
                  <th className="w-10 px-3.5 py-3">
                    <input
                      type="checkbox"
                      checked={filteredStaff.length > 0 && filteredStaff.every((s) => selectedIds.has(s.id))}
                      onChange={() => {
                        const allIds = filteredStaff.map((s) => s.id);
                        const allSelected = allIds.every((id) => selectedIds.has(id));
                        setSelectedIds(allSelected ? new Set() : new Set(allIds));
                      }}
                      className="rounded border-slate-300"
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-3.5 py-3">Employee ID</th>
                  <th className="px-3.5 py-3">Employee Name</th>
                  <th className="px-3.5 py-3">Role</th>
                  <th className="px-3.5 py-3">Team Squad</th>
                  <th className="px-3.5 py-3">Assigned Shift</th>
                  <th className="px-3.5 py-3">Contact Phone</th>
                  <th className="px-3.5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredStaff.length > 0 ? (
                  filteredStaff.map((s) => (
                    <tr
                      key={s.id}
                      className={cn(
                        "hover:bg-slate-50/60 transition-colors",
                        selectedIds.has(s.id) && "bg-emerald-50/40",
                      )}
                    >
                      <td className="px-3.5 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(s.id)}
                          onChange={() => {
                            const next = new Set(selectedIds);
                            if (next.has(s.id)) next.delete(s.id);
                            else next.add(s.id);
                            setSelectedIds(next);
                          }}
                          className="rounded border-slate-300"
                          aria-label={`Select ${s.employeeName}`}
                        />
                      </td>
                      <td className="px-3.5 py-3 font-mono font-bold text-slate-600">{s.employeeId}</td>
                      <td className="px-3.5 py-3">
                        <p className="font-extrabold text-slate-900 leading-tight">{s.employeeName}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{s.email}</p>
                      </td>
                      <td className="px-3.5 py-3 text-slate-700 font-medium">{s.role}</td>
                      <td className="px-3.5 py-3 text-slate-600 font-normal">{s.team}</td>
                      <td className="px-3.5 py-3 text-slate-600 font-normal">{s.assignedShift}</td>
                      <td className="px-3.5 py-3 text-slate-600 font-mono">{s.phone}</td>
                      <td className="px-3.5 py-3">{renderStatusBadge(s.status)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400 font-medium">
                      No staff master records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
            <span>Showing {filteredStaff.length} of {staffList.length} staff master entries</span>
          </div>
        </div>
      )}

      {/* TAB 2: SHIFT MASTER TABLE */}
      {activeTab === "shifts" && (
        <div className="space-y-2">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 z-10">
                  <th className="w-10 px-3.5 py-3">
                    <input
                      type="checkbox"
                      checked={filteredShifts.length > 0 && filteredShifts.every((sh) => selectedIds.has(sh.id))}
                      onChange={() => {
                        const allIds = filteredShifts.map((sh) => sh.id);
                        const allSelected = allIds.every((id) => selectedIds.has(id));
                        setSelectedIds(allSelected ? new Set() : new Set(allIds));
                      }}
                      className="rounded border-slate-300"
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-3.5 py-3">Shift Code</th>
                  <th className="px-3.5 py-3">Shift Name</th>
                  <th className="px-3.5 py-3">Start Time</th>
                  <th className="px-3.5 py-3">End Time</th>
                  <th className="px-3.5 py-3">Duration</th>
                  <th className="px-3.5 py-3">Break Allowance</th>
                  <th className="px-3.5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredShifts.length > 0 ? (
                  filteredShifts.map((sh) => (
                    <tr
                      key={sh.id}
                      className={cn(
                        "hover:bg-slate-50/60 transition-colors",
                        selectedIds.has(sh.id) && "bg-emerald-50/40",
                      )}
                    >
                      <td className="px-3.5 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(sh.id)}
                          onChange={() => {
                            const next = new Set(selectedIds);
                            if (next.has(sh.id)) next.delete(sh.id);
                            else next.add(sh.id);
                            setSelectedIds(next);
                          }}
                          className="rounded border-slate-300"
                          aria-label={`Select ${sh.shiftName}`}
                        />
                      </td>
                      <td className="px-3.5 py-3 font-mono font-bold text-slate-600">{sh.shiftCode}</td>
                      <td className="px-3.5 py-3">
                        <p className="font-extrabold text-slate-900 leading-tight">{sh.shiftName}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{sh.shiftType} Shift Schedule</p>
                      </td>
                      <td className="px-3.5 py-3 text-emerald-700 font-extrabold">{sh.startTime}</td>
                      <td className="px-3.5 py-3 text-slate-700 font-extrabold">{sh.endTime}</td>
                      <td className="px-3.5 py-3 text-slate-600 font-normal">{sh.duration}</td>
                      <td className="px-3.5 py-3 text-slate-600 font-normal">{sh.breakDuration}</td>
                      <td className="px-3.5 py-3">{renderStatusBadge(sh.status)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400 font-medium">
                      No shift master records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
            <span>Showing {filteredShifts.length} of {shiftList.length} shift master entries</span>
          </div>
        </div>
      )}

      {/* TAB 3: ROLES MASTER TABLE */}
      {activeTab === "roles" && (
        <div className="space-y-2">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 z-10">
                  <th className="w-10 px-3.5 py-3">
                    <input
                      type="checkbox"
                      checked={filteredRoles.length > 0 && filteredRoles.every((r) => selectedIds.has(r.id))}
                      onChange={() => {
                        const allIds = filteredRoles.map((r) => r.id);
                        const allSelected = allIds.every((id) => selectedIds.has(id));
                        setSelectedIds(allSelected ? new Set() : new Set(allIds));
                      }}
                      className="rounded border-slate-300"
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-3.5 py-3">Role Code</th>
                  <th className="px-3.5 py-3">Role Name</th>
                  <th className="px-3.5 py-3">Department</th>
                  <th className="px-3.5 py-3">Configured Permissions</th>
                  <th className="px-3.5 py-3">Access Tier</th>
                  <th className="px-3.5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredRoles.map((r) => (
                  <tr
                    key={r.id}
                    className={cn(
                      "hover:bg-slate-50/60 transition-colors",
                      selectedIds.has(r.id) && "bg-emerald-50/40",
                    )}
                  >
                    <td className="px-3.5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(r.id)}
                        onChange={() => {
                          const next = new Set(selectedIds);
                          if (next.has(r.id)) next.delete(r.id);
                          else next.add(r.id);
                          setSelectedIds(next);
                        }}
                        className="rounded border-slate-300"
                        aria-label={`Select ${r.roleName}`}
                      />
                    </td>
                    <td className="px-3.5 py-3 font-mono font-bold text-slate-600">{r.roleCode}</td>
                    <td className="px-3.5 py-3 font-extrabold text-slate-900">{r.roleName}</td>
                    <td className="px-3.5 py-3 text-slate-600 font-medium">{r.department}</td>
                    <td className="px-3.5 py-3 text-slate-500 font-normal">
                      <div className="flex flex-wrap gap-1">
                        {r.permissions.map((p, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3.5 py-3 font-bold text-emerald-700">{r.accessLevel}</td>
                    <td className="px-3.5 py-3">{renderStatusBadge(r.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
            <span>Showing {filteredRoles.length} of {roleList.length} role master entries</span>
          </div>
        </div>
      )}

      {/* TAB 4: TEAMS MASTER TABLE */}
      {activeTab === "teams" && (
        <div className="space-y-2">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 z-10">
                  <th className="w-10 px-3.5 py-3">
                    <input
                      type="checkbox"
                      checked={filteredTeams.length > 0 && filteredTeams.every((t) => selectedIds.has(t.id))}
                      onChange={() => {
                        const allIds = filteredTeams.map((t) => t.id);
                        const allSelected = allIds.every((id) => selectedIds.has(id));
                        setSelectedIds(allSelected ? new Set() : new Set(allIds));
                      }}
                      className="rounded border-slate-300"
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-3.5 py-3">Team Code</th>
                  <th className="px-3.5 py-3">Team Squad Name</th>
                  <th className="px-3.5 py-3">Supervisor Lead</th>
                  <th className="px-3.5 py-3">Members Count</th>
                  <th className="px-3.5 py-3">Assigned Floors</th>
                  <th className="px-3.5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredTeams.map((tm) => (
                  <tr
                    key={tm.id}
                    className={cn(
                      "hover:bg-slate-50/60 transition-colors",
                      selectedIds.has(tm.id) && "bg-emerald-50/40",
                    )}
                  >
                    <td className="px-3.5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(tm.id)}
                        onChange={() => {
                          const next = new Set(selectedIds);
                          if (next.has(tm.id)) next.delete(tm.id);
                          else next.add(tm.id);
                          setSelectedIds(next);
                        }}
                        className="rounded border-slate-300"
                        aria-label={`Select ${tm.teamName}`}
                      />
                    </td>
                    <td className="px-3.5 py-3 font-mono font-bold text-slate-600">{tm.teamCode}</td>
                    <td className="px-3.5 py-3 font-extrabold text-slate-900">{tm.teamName}</td>
                    <td className="px-3.5 py-3 text-slate-800 font-bold">{tm.supervisor}</td>
                    <td className="px-3.5 py-3 text-emerald-700 font-bold">{tm.membersCount} Staff Members</td>
                    <td className="px-3.5 py-3 text-slate-600 font-normal">{tm.assignedFloors}</td>
                    <td className="px-3.5 py-3">{renderStatusBadge(tm.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
            <span>Showing {filteredTeams.length} of {teamList.length} team master entries</span>
          </div>
        </div>
      )}

      {/* TAB 5: ASSIGNMENT RULES TABLE */}
      {activeTab === "rules" && (
        <div className="space-y-2">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 z-10">
                  <th className="w-10 px-3.5 py-3">
                    <input
                      type="checkbox"
                      checked={filteredRules.length > 0 && filteredRules.every((rl) => selectedIds.has(rl.id))}
                      onChange={() => {
                        const allIds = filteredRules.map((rl) => rl.id);
                        const allSelected = allIds.every((id) => selectedIds.has(id));
                        setSelectedIds(allSelected ? new Set() : new Set(allIds));
                      }}
                      className="rounded border-slate-300"
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-3.5 py-3">Rule Code</th>
                  <th className="px-3.5 py-3">Rule Name</th>
                  <th className="px-3.5 py-3">Applicable Shift</th>
                  <th className="px-3.5 py-3">Area / Zone</th>
                  <th className="px-3.5 py-3">Priority</th>
                  <th className="px-3.5 py-3">Max Credit Cap</th>
                  <th className="px-3.5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredRules.map((rl) => (
                  <tr
                    key={rl.id}
                    className={cn(
                      "hover:bg-slate-50/60 transition-colors",
                      selectedIds.has(rl.id) && "bg-emerald-50/40",
                    )}
                  >
                    <td className="px-3.5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(rl.id)}
                        onChange={() => {
                          const next = new Set(selectedIds);
                          if (next.has(rl.id)) next.delete(rl.id);
                          else next.add(rl.id);
                          setSelectedIds(next);
                        }}
                        className="rounded border-slate-300"
                        aria-label={`Select ${rl.ruleName}`}
                      />
                    </td>
                    <td className="px-3.5 py-3 font-mono font-bold text-slate-600">{rl.ruleCode}</td>
                    <td className="px-3.5 py-3 font-extrabold text-slate-900">{rl.ruleName}</td>
                    <td className="px-3.5 py-3 text-slate-600 font-medium">{rl.applicableShift}</td>
                    <td className="px-3.5 py-3 text-slate-600 font-normal">{rl.areaZone}</td>
                    <td className="px-3.5 py-3">
                      <span className="rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[9px] font-extrabold uppercase">
                        {rl.priority}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-emerald-700 font-bold">{rl.maxRoomsPerStaff} Credits / Shift</td>
                    <td className="px-3.5 py-3">{renderStatusBadge(rl.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
            <span>Showing {filteredRules.length} of {ruleList.length} assignment rule entries</span>
          </div>
        </div>
      )}

      {/* VIEW STAFF DETAILS DRAWER */}
      {selectedStaffItem && (
        <Drawer
          open={!!selectedStaffItem}
          onClose={() => setSelectedStaffItem(null)}
          title={`Staff Profile: ${selectedStaffItem.employeeId}`}
          width="md"
        >
          <div className="space-y-4 select-none pb-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-extrabold text-emerald-700">{selectedStaffItem.employeeId}</span>
                {renderStatusBadge(selectedStaffItem.status)}
              </div>
              <h3 className="text-base font-extrabold text-slate-900">{selectedStaffItem.employeeName}</h3>
              <p className="text-xs text-slate-500 font-medium">{selectedStaffItem.role} · {selectedStaffItem.team}</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Employment & Shift</h4>
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Assigned Shift:</span>
                  <span className="font-bold text-slate-800">{selectedStaffItem.assignedShift}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Assigned Floors:</span>
                  <span className="font-bold text-slate-800">{selectedStaffItem.assignedFloors}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Credit Capacity Limit:</span>
                  <span className="font-bold text-emerald-700">{selectedStaffItem.creditCapacity} Credits / Shift</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Employment Type:</span>
                  <span className="font-bold text-slate-800">{selectedStaffItem.employmentType} (Joined {selectedStaffItem.joinDate})</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Contact Details</h4>
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{selectedStaffItem.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>{selectedStaffItem.email}</span>
                </div>
              </div>
            </div>

            {selectedStaffItem.remarks && (
              <div className="rounded-xl bg-amber-50/60 border border-amber-200 p-3 text-xs text-amber-900 font-medium">
                {selectedStaffItem.remarks}
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => setSelectedStaffItem(null)}
              className="w-full h-9 text-xs font-bold border-slate-200 !bg-slate-100 text-slate-700 hover:!bg-slate-200 rounded-xl"
            >
              Close Profile
            </Button>
          </div>
        </Drawer>
      )}

      {/* EDIT STAFF MASTER DRAWER */}
      {editStaffItem && (
        <Drawer
          open={!!editStaffItem}
          onClose={() => setEditStaffItem(null)}
          title={`Edit Staff Profile: ${editStaffItem.employeeId}`}
        >
          <form onSubmit={handleSaveStaffEdit} className="space-y-4 select-none pb-6">
            <FormField label="Full Employee Name">
              <TextInput
                value={editStaffItem.employeeName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditStaffItem({ ...editStaffItem, employeeName: e.target.value })
                }
                className="h-9 text-xs"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Role">
                <SelectInput
                  value={editStaffItem.role}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setEditStaffItem({ ...editStaffItem, role: e.target.value })
                  }
                  className="h-9 text-xs"
                >
                  <option value="Senior Housekeeper">Senior Housekeeper</option>
                  <option value="Housekeeping Supervisor">Housekeeping Supervisor</option>
                  <option value="Room Inspector">Room Inspector</option>
                  <option value="Public Area Attendant">Public Area Attendant</option>
                  <option value="Laundry Specialist">Laundry Specialist</option>
                </SelectInput>
              </FormField>

              <FormField label="Team Squad">
                <SelectInput
                  value={editStaffItem.team}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setEditStaffItem({ ...editStaffItem, team: e.target.value })
                  }
                  className="h-9 text-xs"
                >
                  <option value="East Wing Lead Squad">East Wing Lead Squad</option>
                  <option value="Deluxe Floor Alpha Crew">Deluxe Floor Alpha Crew</option>
                  <option value="Lobby & Pool Squad">Lobby & Pool Squad</option>
                </SelectInput>
              </FormField>
            </div>

            <FormField label="Assigned Shift">
              <SelectInput
                value={editStaffItem.assignedShift}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setEditStaffItem({ ...editStaffItem, assignedShift: e.target.value })
                }
                className="h-9 text-xs"
              >
                <option value="Morning Shift (07:00 - 15:30)">Morning Shift (07:00 AM - 03:30 PM)</option>
                <option value="Evening Shift (15:00 - 23:30)">Evening Shift (03:00 PM - 11:30 PM)</option>
                <option value="Night Shift (23:00 - 07:30)">Night Shift (11:00 PM - 07:30 AM)</option>
              </SelectInput>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Mobile Phone">
                <TextInput
                  value={editStaffItem.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditStaffItem({ ...editStaffItem, phone: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </FormField>

              <FormField label="Status">
                <SelectInput
                  value={editStaffItem.status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setEditStaffItem({ ...editStaffItem, status: e.target.value as any })
                  }
                  className="h-9 text-xs"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </SelectInput>
              </FormField>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditStaffItem(null)}
                className="h-9 px-4 text-xs font-bold !bg-slate-100 text-slate-700 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 px-4 text-xs font-bold !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white rounded-xl"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Drawer>
      )}

      {/* VIEW SHIFT DETAILS DRAWER */}
      {selectedShiftItem && (
        <Drawer
          open={!!selectedShiftItem}
          onClose={() => setSelectedShiftItem(null)}
          title={`Shift Schedule: ${selectedShiftItem.shiftCode}`}
        >
          <div className="space-y-4 select-none pb-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
              <span className="font-mono text-xs font-extrabold text-emerald-700">{selectedShiftItem.shiftCode}</span>
              <h3 className="text-base font-extrabold text-slate-900">{selectedShiftItem.shiftName}</h3>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Timings:</span>
                <span className="font-extrabold text-emerald-700">{selectedShiftItem.startTime} - {selectedShiftItem.endTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duration:</span>
                <span className="font-bold text-slate-800">{selectedShiftItem.duration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Break Allowance:</span>
                <span className="font-bold text-slate-800">{selectedShiftItem.breakDuration}</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setSelectedShiftItem(null)}
              className="w-full h-9 text-xs font-bold border-slate-200 !bg-slate-100 text-slate-700 hover:!bg-slate-200 rounded-xl"
            >
              Close
            </Button>
          </div>
        </Drawer>
      )}

      {/* EDIT SHIFT MASTER DRAWER */}
      {editShiftItem && (
        <Drawer
          open={!!editShiftItem}
          onClose={() => setEditShiftItem(null)}
          title={`Edit Shift Schedule: ${editShiftItem.shiftCode}`}
        >
          <form onSubmit={handleSaveShiftEdit} className="space-y-4 select-none pb-6">
            <FormField label="Shift Name">
              <TextInput
                value={editShiftItem.shiftName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEditShiftItem({ ...editShiftItem, shiftName: e.target.value })
                }
                className="h-9 text-xs"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Start Time">
                <TextInput
                  value={editShiftItem.startTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditShiftItem({ ...editShiftItem, startTime: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </FormField>

              <FormField label="End Time">
                <TextInput
                  value={editShiftItem.endTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditShiftItem({ ...editShiftItem, endTime: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </FormField>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditShiftItem(null)}
                className="h-9 px-4 text-xs font-bold !bg-slate-100 text-slate-700 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 px-4 text-xs font-bold !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white rounded-xl"
              >
                Save Shift Changes
              </Button>
            </div>
          </form>
        </Drawer>
      )}

      {/* ROLE DETAILS DRAWER */}
      {selectedRoleItem && (
        <Drawer open={!!selectedRoleItem} onClose={() => setSelectedRoleItem(null)} title={`Role: ${selectedRoleItem.roleName}`}>
          <div className="space-y-4 text-xs pb-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
              <span className="font-mono text-xs font-bold text-emerald-700">{selectedRoleItem.roleCode}</span>
              <h3 className="text-base font-extrabold text-slate-900">{selectedRoleItem.roleName}</h3>
              <p className="text-slate-500">{selectedRoleItem.department}</p>
            </div>
            <Button variant="outline" onClick={() => setSelectedRoleItem(null)} className="w-full h-9 font-bold rounded-xl">
              Close
            </Button>
          </div>
        </Drawer>
      )}

      {/* TEAM DETAILS DRAWER */}
      {selectedTeamItem && (
        <Drawer open={!!selectedTeamItem} onClose={() => setSelectedTeamItem(null)} title={`Team: ${selectedTeamItem.teamName}`}>
          <div className="space-y-4 text-xs pb-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
              <span className="font-mono text-xs font-bold text-emerald-700">{selectedTeamItem.teamCode}</span>
              <h3 className="text-base font-extrabold text-slate-900">{selectedTeamItem.teamName}</h3>
              <p className="text-slate-500">Supervisor: {selectedTeamItem.supervisor}</p>
            </div>
            <Button variant="outline" onClick={() => setSelectedTeamItem(null)} className="w-full h-9 font-bold rounded-xl">
              Close
            </Button>
          </div>
        </Drawer>
      )}

      {/* RULE DETAILS DRAWER */}
      {selectedRuleItem && (
        <Drawer open={!!selectedRuleItem} onClose={() => setSelectedRuleItem(null)} title={`Rule: ${selectedRuleItem.ruleName}`}>
          <div className="space-y-4 text-xs pb-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
              <span className="font-mono text-xs font-bold text-emerald-700">{selectedRuleItem.ruleCode}</span>
              <h3 className="text-base font-extrabold text-slate-900">{selectedRuleItem.ruleName}</h3>
            </div>
            <Button variant="outline" onClick={() => setSelectedRuleItem(null)} className="w-full h-9 font-bold rounded-xl">
              Close
            </Button>
          </div>
        </Drawer>
      )}

      {/* CREATE NEW MASTER RECORD DRAWER (DYNAMIC) */}
      <Drawer
        open={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        title={
          activeTab === "staff"
            ? "Enroll New Staff Member"
            : activeTab === "shifts"
            ? "Create New Shift Schedule"
            : activeTab === "roles"
            ? "Define New Staff Role"
            : activeTab === "teams"
            ? "Create Supervisory Team Squad"
            : "Configure Assignment Rule"
        }
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 select-none">
          {activeTab === "staff" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Employee ID">
                  <TextInput
                    value={newEmpId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmpId(e.target.value)}
                    placeholder="e.g. EMP-99130"
                    className="h-9 text-xs"
                  />
                </FormField>

                <FormField label="Full Employee Name" required>
                  <TextInput
                    value={newEmpName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmpName(e.target.value)}
                    placeholder="e.g. Anish Sharma"
                    className="h-9 text-xs"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Housekeeping Role" required>
                  <SelectInput
                    value={newRole}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewRole(e.target.value)}
                    className="h-9 text-xs"
                  >
                    <option value="Senior Housekeeper">Senior Housekeeper</option>
                    <option value="Housekeeping Supervisor">Housekeeping Supervisor</option>
                    <option value="Room Inspector">Room Inspector</option>
                    <option value="Public Area Attendant">Public Area Attendant</option>
                    <option value="Laundry Specialist">Laundry Specialist</option>
                  </SelectInput>
                </FormField>

                <FormField label="Assigned Team Squad" required>
                  <SelectInput
                    value={newTeam}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewTeam(e.target.value)}
                    className="h-9 text-xs"
                  >
                    <option value="East Wing Lead Squad">East Wing Lead Squad</option>
                    <option value="Deluxe Floor Alpha Crew">Deluxe Floor Alpha Crew</option>
                    <option value="Lobby & Pool Squad">Lobby & Pool Squad</option>
                  </SelectInput>
                </FormField>
              </div>

              <FormField label="Shift Timing Schedule" required>
                <SelectInput
                  value={newShift}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewShift(e.target.value)}
                  className="h-9 text-xs"
                >
                  <option value="Morning Shift (07:00 - 15:30)">Morning Shift (07:00 AM - 03:30 PM)</option>
                  <option value="Evening Shift (15:00 - 23:30)">Evening Shift (03:00 PM - 11:30 PM)</option>
                  <option value="Night Shift (23:00 - 07:30)">Night Shift (11:00 PM - 07:30 AM)</option>
                </SelectInput>
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Mobile Phone">
                  <TextInput
                    value={newPhone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="h-9 text-xs"
                  />
                </FormField>

                <FormField label="Email Address">
                  <TextInput
                    value={newEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmail(e.target.value)}
                    placeholder="staff@grandhotel.com"
                    className="h-9 text-xs"
                  />
                </FormField>
              </div>
            </>
          )}

          {activeTab === "shifts" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Shift Code" required>
                  <TextInput
                    value={newShiftCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewShiftCode(e.target.value)}
                    placeholder="e.g. SHF-MORN-02"
                    className="h-9 text-xs"
                  />
                </FormField>

                <FormField label="Shift Name" required>
                  <TextInput
                    value={newShiftName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewShiftName(e.target.value)}
                    placeholder="e.g. Early Morning Express"
                    className="h-9 text-xs"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Start Time" required>
                  <TextInput
                    value={newStartTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewStartTime(e.target.value)}
                    placeholder="06:00 AM"
                    className="h-9 text-xs"
                  />
                </FormField>

                <FormField label="End Time" required>
                  <TextInput
                    value={newEndTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEndTime(e.target.value)}
                    placeholder="02:30 PM"
                    className="h-9 text-xs"
                  />
                </FormField>
              </div>
            </>
          )}

          {activeTab === "roles" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Role Code" required>
                  <TextInput
                    value={newRoleCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRoleCode(e.target.value)}
                    placeholder="e.g. ROL-LEAD"
                    className="h-9 text-xs"
                  />
                </FormField>

                <FormField label="Role Name" required>
                  <TextInput
                    value={newRoleName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRoleName(e.target.value)}
                    placeholder="e.g. Shift Lead Attendant"
                    className="h-9 text-xs"
                  />
                </FormField>
              </div>
            </>
          )}

          {activeTab === "teams" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Team Code" required>
                  <TextInput
                    value={newTeamCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTeamCode(e.target.value)}
                    placeholder="e.g. TM-SUITE"
                    className="h-9 text-xs"
                  />
                </FormField>

                <FormField label="Team Squad Name" required>
                  <TextInput
                    value={newTeamName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTeamName(e.target.value)}
                    placeholder="e.g. Suite Turnaround Squad"
                    className="h-9 text-xs"
                  />
                </FormField>
              </div>
            </>
          )}

          {activeTab === "rules" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Rule Code" required>
                  <TextInput
                    value={newRuleCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRuleCode(e.target.value)}
                    placeholder="e.g. ARL-CAP-12"
                    className="h-9 text-xs"
                  />
                </FormField>

                <FormField label="Rule Name" required>
                  <TextInput
                    value={newRuleName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRuleName(e.target.value)}
                    placeholder="e.g. Maximum Daily Suite Cap"
                    className="h-9 text-xs"
                  />
                </FormField>
              </div>
            </>
          )}

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddDrawerOpen(false)}
              className="h-9 px-4 text-xs font-bold !bg-slate-100 hover:!bg-slate-200 text-slate-700 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-9 px-4 text-xs font-bold !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white rounded-xl shadow-2xs"
            >
              Save Record
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
