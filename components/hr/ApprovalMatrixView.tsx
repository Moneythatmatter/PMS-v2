"use client";

import React, { useState, useMemo } from "react";
import {
  Layers,
  Search,
  Plus,
  SlidersHorizontal,
  X,
  CheckCircle2,
  Clock,
  Eye,
  Edit2,
  Copy,
  Power,
  Trash2,
  Check,
  Building2,
  Calendar,
  Filter,
  UserCheck,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  Info,
  ArrowRight,
  FileCheck,
  History,
  Lock,
  GitBranch,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// TYPES & SCHEMAS
// ─────────────────────────────────────────────────────────────

export type HRModuleType =
  | "Leave Management"
  | "Overtime"
  | "Payroll"
  | "Holiday Attendance"
  | "Grievances"
  | "Employee Requests"
  | "Full & Final Settlement";

export type ApproverType =
  | "Specific User"
  | "Role"
  | "Department Manager"
  | "Reporting Manager"
  | "HR Manager"
  | "Finance Manager"
  | "General Manager";

export type WorkflowStatus = "Active" | "Inactive";

export interface ApprovalLevelConfig {
  sequence: number; // 1, 2, or 3
  levelName: string; // e.g. "Level 1 — Dept Manager"
  approverType: ApproverType;
  approverRoleOrUser: string; // e.g. "Department Manager" or "Neha Mehta (HR Manager)"
  isRequired: boolean;
}

export interface WorkflowCondition {
  priority?: string; // e.g. "Emergency / Critical"
  amountThreshold?: number; // e.g. 5000 (OT > ₹5,000 requires Level 2)
  department?: string; // e.g. "Front Office"
  employeeType?: string; // e.g. "Probationary" / "Permanent"
}

export interface WorkflowVersionHistory {
  version: number;
  updatedBy: string;
  updatedDate: string;
  changeSummary: string;
}

export interface ApprovalWorkflow {
  id: string;
  code: string;
  module: HRModuleType;
  requestType: string; // Dynamic based on module
  version: number;
  approvalLevelsCount: number; // 1, 2, or 3
  levels: ApprovalLevelConfig[];
  conditions?: WorkflowCondition;
  effectiveFrom: string;
  effectiveTo?: string;
  status: WorkflowStatus;
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
  history: WorkflowVersionHistory[];
  isSystemLocked?: boolean;
}

// ─────────────────────────────────────────────────────────────
// MODULE ➔ REQUEST TYPES MAPPING
// ─────────────────────────────────────────────────────────────

export const MODULE_REQUEST_TYPES_MAP: Record<HRModuleType, string[]> = {
  "Leave Management": ["Leave Request", "Leave Cancellation", "Comp-Off Claim"],
  Overtime: ["Overtime Approval", "Weekend OT Claim"],
  Payroll: ["Payroll Approval", "Payroll Lock", "Salary Adjustment"],
  "Holiday Attendance": ["Holiday Pay Approval", "Holiday Roster Exemption"],
  Grievances: ["Complaint Review", "Resolution Approval", "POSH Special Review"],
  "Employee Requests": ["Document Request", "Address / Bank Details Change", "Resignation"],
  "Full & Final Settlement": ["Settlement Approval", "No Dues Clearance"],
};

export const APPROVER_TYPES_LIST: ApproverType[] = [
  "Department Manager",
  "Reporting Manager",
  "HR Manager",
  "Finance Manager",
  "General Manager",
  "Role",
  "Specific User",
];

// ─────────────────────────────────────────────────────────────
// MOCK WORKFLOW RECORDS
// ─────────────────────────────────────────────────────────────

export const INITIAL_APPROVAL_WORKFLOWS: ApprovalWorkflow[] = [
  {
    id: "WF-101",
    code: "WF-LVM-01",
    module: "Leave Management",
    requestType: "Leave Request",
    version: 2,
    approvalLevelsCount: 2,
    levels: [
      { sequence: 1, levelName: "Level 1 — Dept Approval", approverType: "Department Manager", approverRoleOrUser: "Department Manager", isRequired: true },
      { sequence: 2, levelName: "Level 2 — HR Approval", approverType: "HR Manager", approverRoleOrUser: "HR Manager", isRequired: true },
    ],
    conditions: { priority: "Normal / Urgent", employeeType: "Permanent Staff" },
    effectiveFrom: "01/04/2026",
    status: "Active",
    createdBy: "Neha Mehta (HR Manager)",
    createdDate: "01/04/2026",
    lastModifiedBy: "Neha Mehta (HR Manager)",
    lastModifiedDate: "15/04/2026",
    history: [
      { version: 1, updatedBy: "Neha Mehta", updatedDate: "01/04/2026", changeSummary: "Initial workflow release for Leave Requests." },
      { version: 2, updatedBy: "Neha Mehta", updatedDate: "15/04/2026", changeSummary: "Added mandatory Level 2 HR Approval requirement." },
    ],
  },
  {
    id: "WF-102",
    code: "WF-OT-01",
    module: "Overtime",
    requestType: "Overtime Approval",
    version: 1,
    approvalLevelsCount: 1,
    levels: [
      { sequence: 1, levelName: "Level 1 — Department Lead", approverType: "Department Manager", approverRoleOrUser: "Department Manager", isRequired: true },
    ],
    conditions: { amountThreshold: 5000 },
    effectiveFrom: "01/04/2026",
    status: "Active",
    createdBy: "Anil Deshmukh (Finance)",
    createdDate: "01/04/2026",
    lastModifiedBy: "Anil Deshmukh (Finance)",
    lastModifiedDate: "01/04/2026",
    history: [
      { version: 1, updatedBy: "Anil Deshmukh", updatedDate: "01/04/2026", changeSummary: "Standard Overtime Single Level Approval." },
    ],
  },
  {
    id: "WF-103",
    code: "WF-PAY-01",
    module: "Payroll",
    requestType: "Payroll Approval",
    version: 1,
    approvalLevelsCount: 3,
    levels: [
      { sequence: 1, levelName: "Level 1 — HR Review", approverType: "HR Manager", approverRoleOrUser: "HR Manager", isRequired: true },
      { sequence: 2, levelName: "Level 2 — Finance Audit", approverType: "Finance Manager", approverRoleOrUser: "Finance Manager", isRequired: true },
      { sequence: 3, levelName: "Level 3 — GM Authorization", approverType: "General Manager", approverRoleOrUser: "General Manager", isRequired: true },
    ],
    effectiveFrom: "01/01/2026",
    status: "Active",
    createdBy: "Vikram Malhotra (GM)",
    createdDate: "01/01/2026",
    lastModifiedBy: "Vikram Malhotra (GM)",
    lastModifiedDate: "01/01/2026",
    history: [
      { version: 1, updatedBy: "Vikram Malhotra", updatedDate: "01/01/2026", changeSummary: "3-Tier Executive Payroll Clearance." },
    ],
  },
  {
    id: "WF-104",
    code: "WF-GRV-01",
    module: "Grievances",
    requestType: "Complaint Review",
    version: 1,
    approvalLevelsCount: 2,
    levels: [
      { sequence: 1, levelName: "Level 1 — HR Manager Inquiry", approverType: "HR Manager", approverRoleOrUser: "Neha Mehta (HR Manager)", isRequired: true },
      { sequence: 2, levelName: "Level 2 — GM Executive Escalation", approverType: "General Manager", approverRoleOrUser: "Vikram Malhotra (General Manager)", isRequired: false },
    ],
    conditions: { priority: "High / Critical" },
    effectiveFrom: "01/02/2026",
    status: "Active",
    createdBy: "Neha Mehta (HR)",
    createdDate: "01/02/2026",
    lastModifiedBy: "Neha Mehta (HR)",
    lastModifiedDate: "01/02/2026",
    history: [
      { version: 1, updatedBy: "Neha Mehta", updatedDate: "01/02/2026", changeSummary: "Grievance Multi-Tier Clearance Matrix." },
    ],
  },
  {
    id: "WF-105",
    code: "WF-HOL-01",
    module: "Holiday Attendance",
    requestType: "Holiday Pay Approval",
    version: 1,
    approvalLevelsCount: 1,
    levels: [
      { sequence: 1, levelName: "Level 1 — HR Manager Verification", approverType: "HR Manager", approverRoleOrUser: "HR Manager", isRequired: true },
    ],
    effectiveFrom: "01/04/2026",
    status: "Active",
    createdBy: "Neha Mehta (HR)",
    createdDate: "01/04/2026",
    lastModifiedBy: "Neha Mehta (HR)",
    lastModifiedDate: "01/04/2026",
    history: [
      { version: 1, updatedBy: "Neha Mehta", updatedDate: "01/04/2026", changeSummary: "Standard 1x Holiday Attendance Pay Approval." },
    ],
  },
  {
    id: "WF-106",
    code: "WF-FNF-01",
    module: "Full & Final Settlement",
    requestType: "Settlement Approval",
    version: 1,
    approvalLevelsCount: 2,
    levels: [
      { sequence: 1, levelName: "Level 1 — Finance Clearance", approverType: "Finance Manager", approverRoleOrUser: "Finance Manager", isRequired: true },
      { sequence: 2, levelName: "Level 2 — HR Final Signoff", approverType: "HR Manager", approverRoleOrUser: "HR Manager", isRequired: true },
    ],
    effectiveFrom: "01/01/2026",
    status: "Active",
    createdBy: "Anil Deshmukh (Finance)",
    createdDate: "01/01/2026",
    lastModifiedBy: "Anil Deshmukh (Finance)",
    lastModifiedDate: "01/01/2026",
    history: [
      { version: 1, updatedBy: "Anil Deshmukh", updatedDate: "01/01/2026", changeSummary: "F&F Final Exit Approval Chain." },
    ],
  },
];

export function ApprovalMatrixView() {
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>(INITIAL_APPROVAL_WORKFLOWS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("ALL");
  const [selectedRequestType, setSelectedRequestType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedLevels, setSelectedLevels] = useState<string>("ALL");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Modals & Drawers State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [viewingWorkflow, setViewingWorkflow] = useState<ApprovalWorkflow | null>(null);

  // Multi-Step Form Inputs
  const [formModule, setFormModule] = useState<HRModuleType>("Leave Management");
  const [formRequestType, setFormRequestType] = useState<string>("Leave Request");
  const [formLevelsCount, setFormLevelsCount] = useState<number>(2);
  
  // Level Configs (Up to 3 levels)
  const [level1, setLevel1] = useState<ApprovalLevelConfig>({ sequence: 1, levelName: "Level 1 — Dept Approval", approverType: "Department Manager", approverRoleOrUser: "Department Manager", isRequired: true });
  const [level2, setLevel2] = useState<ApprovalLevelConfig>({ sequence: 2, levelName: "Level 2 — HR Approval", approverType: "HR Manager", approverRoleOrUser: "HR Manager", isRequired: true });
  const [level3, setLevel3] = useState<ApprovalLevelConfig>({ sequence: 3, levelName: "Level 3 — GM Authorization", approverType: "General Manager", approverRoleOrUser: "General Manager", isRequired: false });

  // Optional Conditions
  const [condPriority, setCondPriority] = useState("");
  const [condAmount, setCondAmount] = useState<number | "">("");
  const [condDepartment, setCondDepartment] = useState("");

  // Dates & Status
  const [formEffectiveFrom, setFormEffectiveFrom] = useState(new Date().toISOString().split("T")[0]);
  const [formEffectiveTo, setFormEffectiveTo] = useState("");
  const [formStatus, setFormStatus] = useState<WorkflowStatus>("Active");

  // KPI Calculations
  const stats = useMemo(() => {
    const total = workflows.length;
    const active = workflows.filter((w) => w.status === "Active").length;
    const multiLevel = workflows.filter((w) => w.approvalLevelsCount > 1).length;
    const pendingApprovals = 14; // Mock live system pending requests
    const awaitingAction = 8;

    return { active, pendingApprovals, multiLevel, awaitingAction };
  }, [workflows]);

  // Dynamic Available Request Types based on selected Module
  const availableRequestTypes = useMemo(() => {
    return MODULE_REQUEST_TYPES_MAP[formModule] || [];
  }, [formModule]);

  // Filtered Workflows Table
  const filteredWorkflows = useMemo(() => {
    return workflows.filter((w) => {
      const matchSearch =
        w.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.requestType.toLowerCase().includes(searchTerm.toLowerCase());

      const matchModule = selectedModule === "ALL" || w.module === selectedModule;
      const matchRequestType = selectedRequestType === "ALL" || w.requestType === selectedRequestType;
      const matchStatus = selectedStatus === "ALL" || w.status === selectedStatus;
      const matchLevels = selectedLevels === "ALL" || String(w.approvalLevelsCount) === selectedLevels;

      return matchSearch && matchModule && matchRequestType && matchStatus && matchLevels;
    });
  }, [workflows, searchTerm, selectedModule, selectedRequestType, selectedStatus, selectedLevels]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingWorkflow(null);
    setFormModule("Leave Management");
    setFormRequestType("Leave Request");
    setFormLevelsCount(2);
    setLevel1({ sequence: 1, levelName: "Level 1 — Dept Approval", approverType: "Department Manager", approverRoleOrUser: "Department Manager", isRequired: true });
    setLevel2({ sequence: 2, levelName: "Level 2 — HR Approval", approverType: "HR Manager", approverRoleOrUser: "HR Manager", isRequired: true });
    setLevel3({ sequence: 3, levelName: "Level 3 — GM Clearance", approverType: "General Manager", approverRoleOrUser: "General Manager", isRequired: false });
    setCondPriority("");
    setCondAmount("");
    setCondDepartment("");
    setFormEffectiveFrom(new Date().toISOString().split("T")[0]);
    setFormEffectiveTo("");
    setFormStatus("Active");
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (wf: ApprovalWorkflow) => {
    setEditingWorkflow(wf);
    setFormModule(wf.module);
    setFormRequestType(wf.requestType);
    setFormLevelsCount(wf.approvalLevelsCount);
    if (wf.levels[0]) setLevel1(wf.levels[0]);
    if (wf.levels[1]) setLevel2(wf.levels[1]);
    if (wf.levels[2]) setLevel3(wf.levels[2]);
    setCondPriority(wf.conditions?.priority || "");
    setCondAmount(wf.conditions?.amountThreshold || "");
    setCondDepartment(wf.conditions?.department || "");
    setFormEffectiveFrom(wf.effectiveFrom.split("/").reverse().join("-"));
    setFormEffectiveTo(wf.effectiveTo ? wf.effectiveTo.split("/").reverse().join("-") : "");
    setFormStatus(wf.status);
    setIsFormModalOpen(true);
  };

  // Duplicate as New Workflow
  const handleDuplicateWorkflow = (wf: ApprovalWorkflow) => {
    const duplicated: ApprovalWorkflow = {
      ...wf,
      id: `WF-${Math.floor(100 + Math.random() * 900)}`,
      code: `WF-${wf.module.slice(0, 3).toUpperCase()}-COPY`,
      version: 1,
      effectiveFrom: new Date().toLocaleDateString("en-GB"),
      createdDate: new Date().toLocaleDateString("en-GB"),
      createdBy: "Neha Mehta (HR Manager)",
      lastModifiedDate: new Date().toLocaleDateString("en-GB"),
      history: [{ version: 1, updatedBy: "Neha Mehta", updatedDate: new Date().toLocaleDateString("en-GB"), changeSummary: `Duplicated from ${wf.code}` }],
    };
    setWorkflows((prev) => [duplicated, ...prev]);
    setToastMessage(`Duplicated workflow as "${duplicated.code}".`);
  };

  // Delete Workflow (Allowed for duplicated / custom draft workflows that are inactive or newly created)
  const handleDeleteWorkflow = (wf: ApprovalWorkflow) => {
    if (wf.isSystemLocked) {
      alert("Business Rule: System core workflows cannot be deleted. Deactivate them instead.");
      return;
    }
    if (confirm(`Are you sure you want to delete workflow "${wf.code}"?`)) {
      setWorkflows((prev) => prev.filter((w) => w.id !== wf.id));
      setToastMessage(`Workflow "${wf.code}" has been deleted.`);
    }
  };

  // Toggle Active / Deactivate Status (Rule: Prevent delete of locked system workflows, deactivate instead)
  const handleToggleStatus = (wf: ApprovalWorkflow) => {
    const nextStatus: WorkflowStatus = wf.status === "Active" ? "Inactive" : "Active";

    // Business Rule Check: Only 1 active workflow per module/requestType
    if (nextStatus === "Active") {
      const existingActive = workflows.find(
        (item) => item.module === wf.module && item.requestType === wf.requestType && item.status === "Active" && item.id !== wf.id
      );
      if (existingActive) {
        alert(`Business Rule Violation: An active workflow (${existingActive.code}) already exists for "${wf.module} ➔ ${wf.requestType}". Please deactivate it first.`);
        return;
      }
    }

    setWorkflows((prev) =>
      prev.map((w) => (w.id === wf.id ? { ...w, status: nextStatus } : w))
    );
    setToastMessage(`Workflow "${wf.code}" marked as ${nextStatus}.`);
  };

  // Save Form Handler
  const handleSaveWorkflow = (e: React.FormEvent) => {
    e.preventDefault();

    // Active Overlap Check
    if (formStatus === "Active") {
      const existingActive = workflows.find(
        (item) => item.module === formModule && item.requestType === formRequestType && item.status === "Active" && item.id !== editingWorkflow?.id
      );
      if (existingActive) {
        alert(`Business Rule Overlap Warning: Active workflow "${existingActive.code}" already exists for ${formModule} ➔ ${formRequestType}. Setting status to Inactive.`);
      }
    }

    const constructedLevels: ApprovalLevelConfig[] = [level1];
    if (formLevelsCount >= 2) constructedLevels.push(level2);
    if (formLevelsCount >= 3) constructedLevels.push(level3);

    const conditionsObj: WorkflowCondition | undefined =
      condPriority || condAmount || condDepartment
        ? {
            priority: condPriority || undefined,
            amountThreshold: typeof condAmount === "number" ? condAmount : undefined,
            department: condDepartment || undefined,
          }
        : undefined;

    const formattedFrom = new Date(formEffectiveFrom).toLocaleDateString("en-GB");
    const formattedTo = formEffectiveTo ? new Date(formEffectiveTo).toLocaleDateString("en-GB") : undefined;

    if (editingWorkflow) {
      // Business Rule: Create new version preserving historical audit
      const newVersion = editingWorkflow.version + 1;
      const historyEntry: WorkflowVersionHistory = {
        version: newVersion,
        updatedBy: "Neha Mehta (HR Manager)",
        updatedDate: new Date().toLocaleDateString("en-GB"),
        changeSummary: `Updated approval levels (${constructedLevels.length} levels) and effective conditions.`,
      };

      setWorkflows((prev) =>
        prev.map((w) =>
          w.id === editingWorkflow.id
            ? {
                ...w,
                module: formModule,
                requestType: formRequestType,
                version: newVersion,
                approvalLevelsCount: formLevelsCount,
                levels: constructedLevels,
                conditions: conditionsObj,
                effectiveFrom: formattedFrom,
                effectiveTo: formattedTo,
                status: formStatus,
                lastModifiedBy: "Neha Mehta (HR Manager)",
                lastModifiedDate: new Date().toLocaleDateString("en-GB"),
                history: [historyEntry, ...w.history],
              }
            : w
        )
      );
      setToastMessage(`Workflow "${editingWorkflow.code}" updated to Version ${newVersion}.`);
    } else {
      const newCode = `WF-${formModule.slice(0, 3).toUpperCase()}-0${workflows.length + 1}`;
      const newWf: ApprovalWorkflow = {
        id: `WF-${Math.floor(100 + Math.random() * 900)}`,
        code: newCode,
        module: formModule,
        requestType: formRequestType,
        version: 1,
        approvalLevelsCount: formLevelsCount,
        levels: constructedLevels,
        conditions: conditionsObj,
        effectiveFrom: formattedFrom,
        effectiveTo: formattedTo,
        status: formStatus,
        createdBy: "Neha Mehta (HR Manager)",
        createdDate: new Date().toLocaleDateString("en-GB"),
        lastModifiedBy: "Neha Mehta (HR Manager)",
        lastModifiedDate: new Date().toLocaleDateString("en-GB"),
        history: [
          {
            version: 1,
            updatedBy: "Neha Mehta",
            updatedDate: new Date().toLocaleDateString("en-GB"),
            changeSummary: `Created centralized workflow for ${formModule} - ${formRequestType}.`,
          },
        ],
      };

      setWorkflows((prev) => [newWf, ...prev]);
      setToastMessage(`Created new Approval Workflow "${newCode}".`);
    }

    setIsFormModalOpen(false);
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource Management"
      title="Approval Matrix"
      description="Configure central approval workflows, approval levels, and multi-tier routing for all HR requests."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Approvals" },
        { label: "Approval Matrix" },
      ]}
      actionButtons={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setToastMessage("Exported active Approval Matrix to Excel.")}
            className="rounded-xl text-xs font-semibold text-slate-700 bg-white"
          >
            Export
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleOpenCreateModal}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add Approval Workflow
          </Button>
        </div>
      }
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: DASHBOARD KPI CARDS (4 COMPACT CARDS)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <HRKPICard
          label="Active Workflows"
          value={`${stats.active}`}
          subtitle="Configured Central Rules"
          tone="emerald"
          icon={<ShieldCheck className="h-5 w-5" />}
        />
        <HRKPICard
          label="Pending Approvals"
          value={`${stats.pendingApprovals}`}
          subtitle="System Requests Logged"
          tone="amber"
          icon={<Clock className="h-5 w-5" />}
        />
        <HRKPICard
          label="Multi-Level Workflows"
          value={`${stats.multiLevel}`}
          subtitle="2 &amp; 3 Level Hierarchies"
          tone="purple"
          icon={<GitBranch className="h-5 w-5" />}
        />
        <HRKPICard
          label="Requests Awaiting Action"
          value={`${stats.awaitingAction}`}
          subtitle="Requires Manager Signoff"
          tone="blue"
          icon={<UserCheck className="h-5 w-5" />}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: REUSABLE FILTER BAR TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search workflow or request type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/50 font-medium text-slate-800"
              />
            </div>

            {/* Desktop Filters */}
            <div className="hidden sm:flex items-center gap-2 flex-wrap">
              <select
                value={selectedModule}
                onChange={(e) => {
                  setSelectedModule(e.target.value);
                  setSelectedRequestType("ALL");
                }}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All HR Modules</option>
                <option value="Leave Management">Leave Management</option>
                <option value="Overtime">Overtime</option>
                <option value="Payroll">Payroll</option>
                <option value="Holiday Attendance">Holiday Attendance</option>
                <option value="Grievances">Grievances</option>
                <option value="Employee Requests">Employee Requests</option>
                <option value="Full & Final Settlement">Full &amp; Final Settlement</option>
              </select>

              <select
                value={selectedLevels}
                onChange={(e) => setSelectedLevels(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Approval Levels</option>
                <option value="1">1 Level Approval</option>
                <option value="2">2 Levels Approval</option>
                <option value="3">3 Levels Approval</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">🟢 Active</option>
                <option value="Inactive">⚪ Inactive</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedModule("ALL");
                  setSelectedRequestType("ALL");
                  setSelectedStatus("ALL");
                  setSelectedLevels("ALL");
                }}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Mobile Filter Trigger */}
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="sm:hidden px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-1.5"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: MAIN DATA TABLE (DESKTOP) & STACKED CARDS (MOBILE)
      ───────────────────────────────────────────────────────────── */}
      {/* Desktop Table */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-3.5 px-4">Module</th>
                <th className="py-3.5 px-4">Request Type</th>
                <th className="py-3.5 px-4">Approval Levels</th>
                <th className="py-3.5 px-4">Current Approver Chain</th>
                <th className="py-3.5 px-4">Effective From</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWorkflows.length > 0 ? (
                filteredWorkflows.map((wf) => (
                  <tr
                    key={wf.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => setViewingWorkflow(wf)}
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 font-bold">
                          <Layers className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{wf.module}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{wf.code} (v{wf.version})</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                        {wf.requestType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border",
                          wf.approvalLevelsCount === 3
                            ? "bg-purple-100 text-purple-900 border-purple-200"
                            : wf.approvalLevelsCount === 2
                            ? "bg-blue-100 text-blue-900 border-blue-200"
                            : "bg-slate-100 text-slate-800 border-slate-200"
                        )}
                      >
                        {wf.approvalLevelsCount} {wf.approvalLevelsCount === 1 ? "Level" : "Levels"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-center gap-1.5 flex-wrap font-medium text-slate-800">
                        {wf.levels.map((lvl, idx) => (
                          <React.Fragment key={idx}>
                            <span className="bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 text-[11px] font-bold text-slate-800">
                              {lvl.approverRoleOrUser}
                            </span>
                            {idx < wf.levels.length - 1 && (
                              <ArrowRight className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-slate-600">
                      {wf.effectiveFrom}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={wf.status} />
                    </td>

                    <td
                      className="py-3.5 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingWorkflow(wf)}
                          className="rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" /> View
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditModal(wf)}
                          className="rounded-xl text-xs font-semibold text-blue-800 border-blue-300 hover:bg-blue-50"
                        >
                          <Edit2 className="h-3.5 w-3.5 mr-1 text-blue-600" /> Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicateWorkflow(wf)}
                          className="rounded-xl text-xs font-semibold text-purple-800 border-purple-300 hover:bg-purple-50"
                        >
                          <Copy className="h-3.5 w-3.5 text-purple-600" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(wf)}
                          className={cn(
                            "rounded-xl text-xs font-semibold",
                            wf.status === "Active"
                              ? "text-amber-800 border-amber-300 hover:bg-amber-50"
                              : "text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                          )}
                          title={wf.status === "Active" ? "Deactivate" : "Activate"}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteWorkflow(wf)}
                          className="rounded-xl text-xs font-semibold text-rose-700 border-rose-300 hover:bg-rose-50"
                          title="Delete Workflow"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No approval workflows found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Stacked Cards View */}
      <div className="sm:hidden space-y-3">
        {filteredWorkflows.map((wf) => (
          <div
            key={wf.id}
            onClick={() => setViewingWorkflow(wf)}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900 text-xs">{wf.module}</span>
              <StatusBadge status={wf.status} />
            </div>

            <div>
              <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {wf.requestType}
              </span>
              <p className="text-[10px] text-slate-400 font-mono mt-1">{wf.code} • v{wf.version}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="text-slate-600">Levels: <strong>{wf.approvalLevelsCount} Level(s)</strong></p>
              <div className="flex items-center gap-1 font-bold text-emerald-800 pt-1">
                {wf.levels.map((lvl) => lvl.approverRoleOrUser).join(" → ")}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setViewingWorkflow(wf)}
                className="text-xs font-bold"
              >
                View
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenEditModal(wf)}
                className="text-xs font-bold text-blue-800 border-blue-300"
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleToggleStatus(wf)}
                className="text-xs font-bold text-amber-800 border-amber-300"
              >
                {wf.status === "Active" ? "Deactivate" : "Activate"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDeleteWorkflow(wf)}
                className="text-xs font-bold text-rose-700 border-rose-300"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ADD / EDIT APPROVAL WORKFLOW (MULTI-STEP & LIVE PREVIEW)
      ───────────────────────────────────────────────────────────── */}
      {isFormModalOpen && (
        <Modal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          title={editingWorkflow ? `Edit Workflow (${editingWorkflow.code})` : "Add Approval Workflow"}
          description="Configure module request routing, multi-level approvers, conditions, and effective dates."
          size="lg"
        >
          <form onSubmit={handleSaveWorkflow} className="space-y-4 text-xs">
            {/* STEP 1 & STEP 2: MODULE & REQUEST TYPE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Step 1 — Select HR Module <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formModule}
                  onChange={(e) => {
                    const selectedMod = e.target.value as HRModuleType;
                    setFormModule(selectedMod);
                    setFormRequestType(MODULE_REQUEST_TYPES_MAP[selectedMod][0] || "");
                  }}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 bg-white"
                >
                  <option value="Leave Management">Leave Management</option>
                  <option value="Overtime">Overtime</option>
                  <option value="Payroll">Payroll</option>
                  <option value="Holiday Attendance">Holiday Attendance</option>
                  <option value="Grievances">Grievances</option>
                  <option value="Employee Requests">Employee Requests</option>
                  <option value="Full & Final Settlement">Full &amp; Final Settlement</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Step 2 — Request Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formRequestType}
                  onChange={(e) => setFormRequestType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-emerald-950 bg-emerald-50/50"
                >
                  {availableRequestTypes.map((req) => (
                    <option key={req} value={req}>
                      {req}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* STEP 3: APPROVAL LEVELS (MAX 3 LEVELS) */}
            <div className="space-y-3 p-3.5 rounded-2xl bg-white border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 uppercase text-[11px]">
                  Step 3 — Approval Levels Configuration (Max 3)
                </span>
                <div className="flex items-center gap-1 font-bold">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setFormLevelsCount(num)}
                      className={cn(
                        "px-3 py-1 rounded-xl border text-xs transition",
                        formLevelsCount === num
                          ? "bg-emerald-700 text-white border-emerald-800"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      )}
                    >
                      {num} {num === 1 ? "Level" : "Levels"}
                    </button>
                  ))}
                </div>
              </div>

              {/* LEVEL 1 CONFIG */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-blue-900 block text-xs">Level 1 Approver</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Approver Type</label>
                    <select
                      value={level1.approverType}
                      onChange={(e) => {
                        const type = e.target.value as ApproverType;
                        setLevel1((prev) => ({ ...prev, approverType: type, approverRoleOrUser: type }));
                      }}
                      className="w-full rounded-xl border border-slate-200 p-2 font-semibold text-slate-900 bg-white text-xs"
                    >
                      {APPROVER_TYPES_LIST.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Approver Role / Specific User</label>
                    <input
                      type="text"
                      value={level1.approverRoleOrUser}
                      onChange={(e) => setLevel1((prev) => ({ ...prev, approverRoleOrUser: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 p-2 font-semibold text-slate-900 bg-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* LEVEL 2 CONFIG (IF >= 2) */}
              {formLevelsCount >= 2 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-purple-900 block text-xs">Level 2 Approver</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Approver Type</label>
                      <select
                        value={level2.approverType}
                        onChange={(e) => {
                          const type = e.target.value as ApproverType;
                          setLevel2((prev) => ({ ...prev, approverType: type, approverRoleOrUser: type }));
                        }}
                        className="w-full rounded-xl border border-slate-200 p-2 font-semibold text-slate-900 bg-white text-xs"
                      >
                        {APPROVER_TYPES_LIST.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Approver Role / Specific User</label>
                      <input
                        type="text"
                        value={level2.approverRoleOrUser}
                        onChange={(e) => setLevel2((prev) => ({ ...prev, approverRoleOrUser: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 p-2 font-semibold text-slate-900 bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* LEVEL 3 CONFIG (IF >= 3) */}
              {formLevelsCount >= 3 && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-amber-900 block text-xs">Level 3 Approver</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Approver Type</label>
                      <select
                        value={level3.approverType}
                        onChange={(e) => {
                          const type = e.target.value as ApproverType;
                          setLevel3((prev) => ({ ...prev, approverType: type, approverRoleOrUser: type }));
                        }}
                        className="w-full rounded-xl border border-slate-200 p-2 font-semibold text-slate-900 bg-white text-xs"
                      >
                        {APPROVER_TYPES_LIST.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Approver Role / Specific User</label>
                      <input
                        type="text"
                        value={level3.approverRoleOrUser}
                        onChange={(e) => setLevel3((prev) => ({ ...prev, approverRoleOrUser: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 p-2 font-semibold text-slate-900 bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 4: OPTIONAL CONDITIONS */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-extrabold text-slate-900 uppercase text-[11px]">
                Step 4 — Optional Conditions &amp; Thresholds
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Priority Threshold</label>
                  <input
                    type="text"
                    placeholder="e.g. Urgent / Critical"
                    value={condPriority}
                    onChange={(e) => setCondPriority(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 font-medium text-slate-900 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Amount Threshold (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={condAmount}
                    onChange={(e) => setCondAmount(e.target.value ? Number(e.target.value) : "")}
                    className="w-full rounded-xl border border-slate-200 p-2 font-medium text-slate-900 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Department Applicability</label>
                  <input
                    type="text"
                    placeholder="All Departments or Specific"
                    value={condDepartment}
                    onChange={(e) => setCondDepartment(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 font-medium text-slate-900 bg-white text-xs"
                  />
                </div>
              </div>
            </div>

            {/* DYNAMIC LIVE WORKFLOW PREVIEW DIAGRAM */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white space-y-2">
              <span className="text-[10px] uppercase font-black text-amber-400 tracking-wider block">
                Live Approval Workflow Preview
              </span>
              <div className="flex items-center gap-2 overflow-x-auto py-2">
                <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 font-bold text-slate-300 text-xs">
                  Employee Request
                </div>
                <ArrowRight className="h-4 w-4 text-amber-400 flex-shrink-0" />

                <div className="px-3 py-1.5 rounded-xl bg-blue-950 border border-blue-700 font-bold text-blue-300 text-xs">
                  Level 1: {level1.approverRoleOrUser}
                </div>

                {formLevelsCount >= 2 && (
                  <>
                    <ArrowRight className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <div className="px-3 py-1.5 rounded-xl bg-purple-950 border border-purple-700 font-bold text-purple-300 text-xs">
                      Level 2: {level2.approverRoleOrUser}
                    </div>
                  </>
                )}

                {formLevelsCount >= 3 && (
                  <>
                    <ArrowRight className="h-4 w-4 text-amber-400 flex-shrink-0" />
                    <div className="px-3 py-1.5 rounded-xl bg-amber-950 border border-amber-700 font-bold text-amber-300 text-xs">
                      Level 3: {level3.approverRoleOrUser}
                    </div>
                  </>
                )}

                <ArrowRight className="h-4 w-4 text-amber-400 flex-shrink-0" />
                <div className="px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-600 font-bold text-emerald-400 text-xs flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                </div>
              </div>
            </div>

            {/* STEP 5: DATES & STATUS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Effective From <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formEffectiveFrom}
                  onChange={(e) => setFormEffectiveFrom(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 font-semibold text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Effective To (Optional)</label>
                <input
                  type="date"
                  value={formEffectiveTo}
                  onChange={(e) => setFormEffectiveTo(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 font-semibold text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as WorkflowStatus)}
                  className="w-full rounded-xl border border-slate-200 p-2 font-bold text-slate-900 bg-white"
                >
                  <option value="Active">🟢 Active</option>
                  <option value="Inactive">⚪ Inactive</option>
                </select>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsFormModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                {editingWorkflow ? "Update Workflow Version" : "Save Approval Workflow"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          DRAWER: WORKFLOW DETAILS & VERSION AUDIT HISTORY
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(viewingWorkflow)}
        onClose={() => setViewingWorkflow(null)}
        title="Workflow Configuration &amp; Version History"
        icon={<GitBranch className="h-5 w-5 text-emerald-700" />}
      >
        {viewingWorkflow && (
          <div className="space-y-4 text-xs">
            {/* Header Card */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-mono font-bold">{viewingWorkflow.code}</span>
                <StatusBadge status={viewingWorkflow.status} />
              </div>
              <h3 className="text-base font-black text-amber-400">{viewingWorkflow.module}</h3>
              <p className="text-xs text-slate-300">
                Request Type: <strong>{viewingWorkflow.requestType}</strong> • Version: <strong>v{viewingWorkflow.version}</strong>
              </p>
            </div>

            {/* Approval Chain Diagram */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <span className="font-extrabold text-slate-900 uppercase block text-[11px]">
                Approval Chain ({viewingWorkflow.approvalLevelsCount} Levels)
              </span>
              <div className="space-y-2">
                {viewingWorkflow.levels.map((lvl, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{lvl.levelName}</p>
                      <p className="text-[11px] text-slate-500">Approver: {lvl.approverRoleOrUser}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-100 text-blue-900">
                      Level {lvl.sequence}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Configured Conditions */}
            <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 space-y-1">
              <span className="font-extrabold text-purple-950 uppercase block text-[11px]">Configured Rules &amp; Conditions</span>
              {viewingWorkflow.conditions ? (
                <div className="space-y-1 text-slate-800 font-medium">
                  {viewingWorkflow.conditions.priority && <p>• Priority Threshold: <strong>{viewingWorkflow.conditions.priority}</strong></p>}
                  {viewingWorkflow.conditions.amountThreshold && <p>• Amount Threshold: <strong>&gt; ₹{viewingWorkflow.conditions.amountThreshold.toLocaleString()}</strong></p>}
                  {viewingWorkflow.conditions.department && <p>• Applicable Dept: <strong>{viewingWorkflow.conditions.department}</strong></p>}
                </div>
              ) : (
                <p className="text-slate-500 italic">No conditional threshold configured. Applies unconditionally.</p>
              )}
            </div>

            {/* Audit History & Version Log */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <span className="font-extrabold text-slate-900 uppercase block text-[11px]">Version Audit History</span>
              <div className="space-y-2 relative border-l-2 border-slate-300 ml-2 pl-3">
                {viewingWorkflow.history.map((hist, idx) => (
                  <div key={idx} className="relative space-y-0.5">
                    <div className="w-2 h-2 rounded-full bg-slate-700 absolute -left-[17px] top-1" />
                    <span className="text-[10px] text-slate-400 font-mono block">v{hist.version} • {hist.updatedDate}</span>
                    <p className="font-bold text-slate-900">{hist.changeSummary}</p>
                    <p className="text-slate-500 text-[11px]">By: {hist.updatedBy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* MOBILE FILTERS DRAWER */}
      <Drawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="Filter Workflows"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">HR Module</label>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 bg-white"
            >
              <option value="ALL">All HR Modules</option>
              <option value="Leave Management">Leave Management</option>
              <option value="Overtime">Overtime</option>
              <option value="Payroll">Payroll</option>
              <option value="Holiday Attendance">Holiday Attendance</option>
              <option value="Grievances">Grievances</option>
              <option value="Employee Requests">Employee Requests</option>
              <option value="Full & Final Settlement">Full &amp; Final Settlement</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-800 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <Button
            type="button"
            onClick={() => setIsMobileFilterOpen(false)}
            className="w-full font-bold bg-emerald-700 text-white rounded-xl"
          >
            Apply Filters
          </Button>
        </div>
      </Drawer>
    </ModulePageShell>
  );
}
