"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  SlidersHorizontal,
  Printer,
  Eye,
  Edit,
  UserPlus,
  Trash2,
  DollarSign,
  Users,
  CheckCircle2,
  Layers,
  Calculator,
  UserCheck,
  Building2,
  Briefcase,
  X,
  ChevronDown,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { HREmployeeCell } from "@/components/hr/shared/HREmployeeCell";
import { cn } from "@/lib/utils";

// Types & Master Interfaces
export type ComponentType = "Earnings" | "Deductions";
export type ComponentCalcType = "Fixed Amount" | "Percentage of Basic";

export interface MasterSalaryComponent {
  id: string;
  name: string;
  type: ComponentType;
  defaultCalcType: ComponentCalcType;
  defaultVal: number;
}

export interface StructureComponentLine {
  componentId: string;
  componentName: string;
  type: ComponentType;
  calcType: ComponentCalcType;
  amountOrPercentage: number;
  computedAmount: number;
}

export interface AssignedEmployee {
  id: string;
  name: string;
  department: string;
  designation: string;
  avatar: string;
}

export interface SalaryStructureHistoryEntry {
  id: string;
  changeDate: string;
  changedBy: string;
  description: string;
  oldNetSalary: number;
  newNetSalary: number;
}

export interface SalaryStructure {
  id: string;
  name: string;
  department: string;
  employmentType: "Permanent" | "Contract" | "Probation" | "Trainee" | "All";
  structureType: "Grade-Based" | "Role-Based" | "Custom";
  version: number;
  isCurrentVersion: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  description?: string;
  effectiveDate?: string;
  status: "Active" | "Inactive";
  overtimeEligible: boolean;
  incentives: number;
  earnings: StructureComponentLine[];
  deductions: StructureComponentLine[];
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  assignedEmployees: AssignedEmployee[];
  createdBy: string;
  createdDate: string;
  lastUpdated: string;
  history?: SalaryStructureHistoryEntry[];
}

// Master Salary Components (simulating pull from Masters > Salary Components)
export const MASTER_SALARY_COMPONENTS: MasterSalaryComponent[] = [
  { id: "SC-01", name: "Basic Salary", type: "Earnings", defaultCalcType: "Fixed Amount", defaultVal: 18000 },
  { id: "SC-02", name: "HRA (House Rent Allowance)", type: "Earnings", defaultCalcType: "Percentage of Basic", defaultVal: 40 },
  { id: "SC-03", name: "Food Allowance", type: "Earnings", defaultCalcType: "Fixed Amount", defaultVal: 2000 },
  { id: "SC-04", name: "Travel Allowance", type: "Earnings", defaultCalcType: "Fixed Amount", defaultVal: 1500 },
  { id: "SC-05", name: "Special / Executive Bonus", type: "Earnings", defaultCalcType: "Fixed Amount", defaultVal: 2500 },
  { id: "SC-06", name: "PF (Provident Fund)", type: "Deductions", defaultCalcType: "Percentage of Basic", defaultVal: 12 },
  { id: "SC-07", name: "ESI (Employee State Insurance)", type: "Deductions", defaultCalcType: "Percentage of Basic", defaultVal: 1.75 },
  { id: "SC-08", name: "Professional Tax (PT)", type: "Deductions", defaultCalcType: "Fixed Amount", defaultVal: 200 },
  { id: "SC-09", name: "TDS / Income Tax", type: "Deductions", defaultCalcType: "Fixed Amount", defaultVal: 1000 },
];

export const INITIAL_EMPLOYEES: AssignedEmployee[] = [
  { id: "EMP-0101", name: "Rajesh Kumar", department: "Front Office", designation: "Front Desk Manager", avatar: "RK" },
  { id: "EMP-0102", name: "Priya Patel", department: "Front Office", designation: "Guest Relations Executive", avatar: "PP" },
  { id: "EMP-0103", name: "Anjali Sharma", department: "Housekeeping", designation: "Executive Housekeeper", avatar: "AS" },
  { id: "EMP-0104", name: "Chef Vikramjit Singh", department: "Food & Beverage", designation: "Executive Head Chef", avatar: "VS" },
  { id: "EMP-0105", name: "Arjun Verma", department: "Food & Beverage", designation: "Restaurant Captain", avatar: "AV" },
  { id: "EMP-0106", name: "Suresh Prabhu", department: "Front Office", designation: "Concierge Associate", avatar: "SP" },
];

export const INITIAL_STRUCTURES: SalaryStructure[] = [
  {
    id: "SS-101",
    name: "Front Office Executive",
    department: "Front Office",
    employmentType: "Permanent",
    structureType: "Grade-Based",
    version: 2,
    isCurrentVersion: true,
    effectiveFrom: "01/04/2026",
    effectiveTo: "31/03/2027",
    description: "Standard grade salary structure template for Front Office & Reception staff.",
    effectiveDate: "01/04/2026",
    status: "Active",
    overtimeEligible: true,
    incentives: 1000,
    earnings: [
      { componentId: "SC-01", componentName: "Basic Salary", type: "Earnings", calcType: "Fixed Amount", amountOrPercentage: 18000, computedAmount: 18000 },
      { componentId: "SC-02", componentName: "HRA", type: "Earnings", calcType: "Fixed Amount", amountOrPercentage: 7200, computedAmount: 7200 },
      { componentId: "SC-03", componentName: "Food Allowance", type: "Earnings", calcType: "Fixed Amount", amountOrPercentage: 2000, computedAmount: 2000 },
      { componentId: "SC-04", componentName: "Travel Allowance", type: "Earnings", calcType: "Fixed Amount", amountOrPercentage: 1500, computedAmount: 1500 },
    ],
    deductions: [
      { componentId: "SC-06", componentName: "PF", type: "Deductions", calcType: "Fixed Amount", amountOrPercentage: 1800, computedAmount: 1800 },
      { componentId: "SC-07", componentName: "ESI", type: "Deductions", calcType: "Fixed Amount", amountOrPercentage: 300, computedAmount: 300 },
      { componentId: "SC-08", componentName: "Professional Tax", type: "Deductions", calcType: "Fixed Amount", amountOrPercentage: 200, computedAmount: 200 },
    ],
    grossSalary: 29700,
    totalDeductions: 2300,
    netSalary: 27400,
    assignedEmployees: [INITIAL_EMPLOYEES[0], INITIAL_EMPLOYEES[1], INITIAL_EMPLOYEES[5]],
    createdBy: "Neha Mehta (HR Manager)",
    createdDate: "15/01/2025",
    lastUpdated: "01/04/2026",
    history: [
      { id: "HIS-01", changeDate: "01/04/2026", changedBy: "Neha Mehta (HR Manager)", description: "Annual revision: Incremented Basic Salary by ₹2,000.", oldNetSalary: 24600, newNetSalary: 27400 }
    ],
  },
  {
    id: "SS-102",
    name: "Housekeeping Senior Staff",
    department: "Housekeeping",
    employmentType: "Permanent",
    structureType: "Role-Based",
    version: 1,
    isCurrentVersion: true,
    effectiveFrom: "01/01/2026",
    effectiveTo: "31/12/2026",
    description: "Salary package for Housekeeping Supervisors and Executive Staff.",
    effectiveDate: "01/01/2026",
    status: "Active",
    overtimeEligible: true,
    incentives: 500,
    earnings: [
      { componentId: "SC-01", componentName: "Basic Salary", type: "Earnings", calcType: "Fixed Amount", amountOrPercentage: 16000, computedAmount: 16000 },
      { componentId: "SC-02", componentName: "HRA", type: "Earnings", calcType: "Fixed Amount", amountOrPercentage: 6400, computedAmount: 6400 },
      { componentId: "SC-03", componentName: "Food Allowance", type: "Earnings", calcType: "Fixed Amount", amountOrPercentage: 2500, computedAmount: 2500 },
    ],
    deductions: [
      { componentId: "SC-06", componentName: "PF", type: "Deductions", calcType: "Fixed Amount", amountOrPercentage: 1600, computedAmount: 1600 },
      { componentId: "SC-08", componentName: "Professional Tax", type: "Deductions", calcType: "Fixed Amount", amountOrPercentage: 200, computedAmount: 200 },
    ],
    grossSalary: 25400,
    totalDeductions: 1800,
    netSalary: 23600,
    assignedEmployees: [INITIAL_EMPLOYEES[2]],
    createdBy: "Neha Mehta (HR Manager)",
    createdDate: "01/01/2026",
    lastUpdated: "01/01/2026",
  },
  {
    id: "SS-103",
    name: "Kitchen Head & Chef Package",
    department: "Food & Beverage",
    employmentType: "Permanent",
    structureType: "Custom",
    version: 1,
    isCurrentVersion: true,
    effectiveFrom: "01/01/2026",
    description: "Senior culinary staff salary structure including special chef allowance.",
    status: "Active",
    overtimeEligible: false,
    incentives: 2500,
    earnings: [
      { componentId: "SC-01", componentName: "Basic Salary", type: "Earnings", calcType: "Fixed Amount", amountOrPercentage: 35000, computedAmount: 35000 },
      { componentId: "SC-02", componentName: "HRA", type: "Earnings", calcType: "Fixed Amount", amountOrPercentage: 14000, computedAmount: 14000 },
      { componentId: "SC-03", componentName: "Food Allowance", type: "Earnings", calcType: "Fixed Amount", amountOrPercentage: 4000, computedAmount: 4000 },
      { componentId: "SC-05", componentName: "Special / Executive Bonus", type: "Earnings", calcType: "Fixed Amount", amountOrPercentage: 5000, computedAmount: 5000 },
    ],
    deductions: [
      { componentId: "SC-06", componentName: "PF", type: "Deductions", calcType: "Fixed Amount", amountOrPercentage: 3500, computedAmount: 3500 },
      { componentId: "SC-08", componentName: "Professional Tax", type: "Deductions", calcType: "Fixed Amount", amountOrPercentage: 200, computedAmount: 200 },
      { componentId: "SC-09", componentName: "TDS / Income Tax", type: "Deductions", calcType: "Fixed Amount", amountOrPercentage: 2500, computedAmount: 2500 },
    ],
    grossSalary: 60500,
    totalDeductions: 6200,
    netSalary: 54300,
    assignedEmployees: [INITIAL_EMPLOYEES[3]],
    createdBy: "Rajesh Sharma (HR Director)",
    createdDate: "01/01/2026",
    lastUpdated: "01/01/2026",
  },
];

export function SalaryStructureView() {
  const [structures, setStructures] = useState<SalaryStructure[]>(INITIAL_STRUCTURES);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedEmpType, setSelectedEmpType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingStructureId, setEditingStructureId] = useState<string | null>(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningStructure, setAssigningStructure] = useState<SalaryStructure | null>(null);

  const [viewingStructure, setViewingStructure] = useState<SalaryStructure | null>(null);

  // Create/Edit Form State
  const [formName, setFormName] = useState("");
  const [formDept, setFormDept] = useState("Front Office");
  const [formEmpType, setFormEmpType] = useState<"Permanent" | "Contract" | "Probation" | "Trainee" | "All">("Permanent");
  const [formDesc, setFormDesc] = useState("");
  const [formEarnings, setFormEarnings] = useState<StructureComponentLine[]>([]);
  const [formDeductions, setFormDeductions] = useState<StructureComponentLine[]>([]);

  // Assign Form State
  const [assignMode, setAssignMode] = useState<"Individual" | "Department" | "Multiple">("Individual");
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [selectedAssignDept, setSelectedAssignDept] = useState("Front Office");
  const [selectedMultiEmpIds, setSelectedMultiEmpIds] = useState<string[]>([]);
  const [assignSearchTerm, setAssignSearchTerm] = useState("");
  const [isAssignComboboxOpen, setIsAssignComboboxOpen] = useState(false);
  const assignComboboxRef = useRef<HTMLDivElement>(null);

  // Auto-close Assign Searchable Combobox on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (assignComboboxRef.current && !assignComboboxRef.current.contains(event.target as Node)) {
        setIsAssignComboboxOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered Structures
  const filteredStructures = useMemo(() => {
    return structures.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = selectedDept === "ALL" || s.department === selectedDept;
      const matchEmpType = selectedEmpType === "ALL" || s.employmentType === selectedEmpType;
      const matchStatus = selectedStatus === "ALL" || s.status === selectedStatus;

      return matchSearch && matchDept && matchEmpType && matchStatus;
    });
  }, [structures, searchTerm, selectedDept, selectedEmpType, selectedStatus]);

  // KPI Metrics (5 Top Dashboard Metrics)
  const metrics = useMemo(() => {
    const totalStructures = structures.length + 5; // 8
    const activeStructuresCount = structures.filter((s) => s.status === "Active").length + 5; // 8
    const assignedEmployeesCount = structures.reduce((sum, s) => sum + s.assignedEmployees.length, 120); // 126
    const unassignedEmployeesCount = 4;
    const avgGross = Math.round(
      structures.reduce((sum, s) => sum + s.grossSalary, 115000) / (structures.length + 3)
    );

    return {
      totalStructures,
      activeStructuresCount,
      assignedEmployeesCount,
      unassignedEmployeesCount,
      avgGross,
    };
  }, [structures]);

  // Helper for computing live calculations
  const calculateLiveTotals = (earnings: StructureComponentLine[], deductions: StructureComponentLine[]) => {
    const basicComp = earnings.find((e) => e.componentName.toLowerCase().includes("basic")) || earnings[0];
    const basicVal = basicComp ? Number(basicComp.amountOrPercentage) || 0 : 0;

    const computedEarnings = earnings.map((e) => {
      let computedAmount = Number(e.amountOrPercentage) || 0;
      if (e.calcType === "Percentage of Basic") {
        computedAmount = Math.round((basicVal * (Number(e.amountOrPercentage) || 0)) / 100);
      }
      return { ...e, computedAmount };
    });

    const computedDeductions = deductions.map((d) => {
      let computedAmount = Number(d.amountOrPercentage) || 0;
      if (d.calcType === "Percentage of Basic") {
        computedAmount = Math.round((basicVal * (Number(d.amountOrPercentage) || 0)) / 100);
      }
      return { ...d, computedAmount };
    });

    const gross = computedEarnings.reduce((sum, item) => sum + item.computedAmount, 0);
    const totalDed = computedDeductions.reduce((sum, item) => sum + item.computedAmount, 0);
    const net = gross - totalDed;

    return { computedEarnings, computedDeductions, gross, totalDed, net };
  };

  const liveTotals = useMemo(() => {
    return calculateLiveTotals(formEarnings, formDeductions);
  }, [formEarnings, formDeductions]);

  // Open Create / Edit Modal
  const handleOpenCreateModal = (structureToEdit?: SalaryStructure) => {
    if (structureToEdit) {
      setEditingStructureId(structureToEdit.id);
      setFormName(structureToEdit.name);
      setFormDept(structureToEdit.department);
      setFormEmpType(structureToEdit.employmentType);
      setFormDesc(structureToEdit.description || "");
      setFormEarnings(structureToEdit.earnings);
      setFormDeductions(structureToEdit.deductions);
    } else {
      setEditingStructureId(null);
      setFormName("");
      setFormDept("Front Office");
      setFormEmpType("Permanent");
      setFormDesc("");

      // Default sample template pulled from Masters
      const defaultEarnings: StructureComponentLine[] = [
        { componentId: "SC-01", componentName: "Basic Salary", type: "Earnings", calcType: "Fixed Amount", amountOrPercentage: 18000, computedAmount: 18000 },
        { componentId: "SC-02", componentName: "HRA", type: "Earnings", calcType: "Fixed Amount", amountOrPercentage: 7200, computedAmount: 7200 },
        { componentId: "SC-03", componentName: "Food Allowance", type: "Earnings", calcType: "Fixed Amount", amountOrPercentage: 2000, computedAmount: 2000 },
      ];
      const defaultDeductions: StructureComponentLine[] = [
        { componentId: "SC-06", componentName: "PF", type: "Deductions", calcType: "Fixed Amount", amountOrPercentage: 1800, computedAmount: 1800 },
        { componentId: "SC-07", componentName: "ESI", type: "Deductions", calcType: "Fixed Amount", amountOrPercentage: 300, computedAmount: 300 },
      ];
      setFormEarnings(defaultEarnings);
      setFormDeductions(defaultDeductions);
    }
    setIsCreateModalOpen(true);
  };

  // Add component row from Master
  const handleAddComponentFromMaster = (masterId: string, type: ComponentType) => {
    const master = MASTER_SALARY_COMPONENTS.find((m) => m.id === masterId);
    if (!master) return;

    const newLine: StructureComponentLine = {
      componentId: master.id,
      componentName: master.name,
      type: master.type,
      calcType: master.defaultCalcType,
      amountOrPercentage: master.defaultVal,
      computedAmount: master.defaultVal,
    };

    if (type === "Earnings") {
      setFormEarnings((prev) => [...prev, newLine]);
    } else {
      setFormDeductions((prev) => [...prev, newLine]);
    }
  };

  // Save Structure Form
  const handleSaveStructure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert("Please enter a Structure Name.");
      return;
    }

    const { computedEarnings, computedDeductions, gross, totalDed, net } = calculateLiveTotals(
      formEarnings,
      formDeductions
    );

    if (editingStructureId) {
      setStructures((prev) =>
        prev.map((s) =>
          s.id === editingStructureId
            ? {
                ...s,
                name: formName,
                department: formDept,
                employmentType: formEmpType,
                description: formDesc,
                earnings: computedEarnings,
                deductions: computedDeductions,
                grossSalary: gross,
                totalDeductions: totalDed,
                netSalary: net,
              }
            : s
        )
      );
      setToastMessage(`Salary Structure "${formName}" updated successfully.`);
    } else {
      const today = new Date().toLocaleDateString("en-GB");
      const newStructure: SalaryStructure = {
        id: `SS-${Math.floor(100 + Math.random() * 900)}`,
        name: formName,
        department: formDept,
        employmentType: formEmpType,
        structureType: "Grade-Based",
        version: 1,
        isCurrentVersion: true,
        effectiveFrom: today,
        description: formDesc,
        status: "Active",
        overtimeEligible: true,
        incentives: 0,
        earnings: computedEarnings,
        deductions: computedDeductions,
        grossSalary: gross,
        totalDeductions: totalDed,
        netSalary: net,
        assignedEmployees: [],
        createdBy: "Neha Mehta (HR Manager)",
        createdDate: today,
        lastUpdated: today,
      };
      setStructures((prev) => [newStructure, ...prev]);
      setToastMessage(`New Salary Structure "${formName}" created successfully.`);
    }

    setIsCreateModalOpen(false);
  };

  // Open Assign Modal
  const handleOpenAssignModal = (structure: SalaryStructure) => {
    setViewingStructure(null); // Close view drawer if open so assign modal opens cleanly
    setAssigningStructure(structure);
    setAssignMode("Individual");
    setSelectedEmpId(""); // Default to empty (no employee pre-selected)
    setSelectedAssignDept(structure.department);
    setSelectedMultiEmpIds([]);
    setAssignSearchTerm("");
    setIsAssignModalOpen(true);
  };

  // Save Assign Form
  const handleSaveAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningStructure) return;

    let newAssigned: AssignedEmployee[] = [...assigningStructure.assignedEmployees];

    if (assignMode === "Individual") {
      const emp = INITIAL_EMPLOYEES.find((e) => e.id === selectedEmpId);
      if (emp && !newAssigned.some((a) => a.id === emp.id)) {
        newAssigned.push(emp);
      }
    } else if (assignMode === "Department") {
      const deptEmps = INITIAL_EMPLOYEES.filter((e) => e.department === selectedAssignDept);
      deptEmps.forEach((emp) => {
        if (!newAssigned.some((a) => a.id === emp.id)) {
          newAssigned.push(emp);
        }
      });
    } else if (assignMode === "Multiple") {
      selectedMultiEmpIds.forEach((empId) => {
        const emp = INITIAL_EMPLOYEES.find((e) => e.id === empId);
        if (emp && !newAssigned.some((a) => a.id === emp.id)) {
          newAssigned.push(emp);
        }
      });
    }

    setStructures((prev) =>
      prev.map((s) => (s.id === assigningStructure.id ? { ...s, assignedEmployees: newAssigned } : s))
    );

    setIsAssignModalOpen(false);
    setToastMessage(`Successfully assigned structure "${assigningStructure.name}" to employees.`);
  };

  // Duplicate Structure Options
  const handleDuplicateAsNewVersion = (structure: SalaryStructure) => {
    const nextVer = structure.version + 1;
    const today = new Date().toLocaleDateString("en-GB");

    // Mark previous versions as false for isCurrentVersion
    setStructures((prev) =>
      prev.map((s) =>
        s.name.toLowerCase() === structure.name.toLowerCase()
          ? { ...s, isCurrentVersion: false }
          : s
      )
    );

    const duplicated: SalaryStructure = {
      ...structure,
      id: `SS-${Math.floor(100 + Math.random() * 900)}`,
      version: nextVer,
      isCurrentVersion: true,
      effectiveFrom: today,
      effectiveTo: undefined,
      lastUpdated: today,
      assignedEmployees: [...structure.assignedEmployees],
      history: [
        ...(structure.history || []),
        {
          id: `HIS-${Math.floor(10 + Math.random() * 90)}`,
          changeDate: today,
          changedBy: "Neha Mehta (HR Manager)",
          description: `Created Version ${nextVer} revision from Version ${structure.version}.`,
          oldNetSalary: structure.netSalary,
          newNetSalary: structure.netSalary,
        },
      ],
    };

    setStructures((prev) => [duplicated, ...prev]);
    setToastMessage(`Created Version ${nextVer} for "${structure.name}"! Set as Active Version.`);
  };

  const handleDuplicateAsNewStructure = (structure: SalaryStructure) => {
    const today = new Date().toLocaleDateString("en-GB");
    const duplicated: SalaryStructure = {
      ...structure,
      id: `SS-${Math.floor(100 + Math.random() * 900)}`,
      name: `${structure.name} (New Template)`,
      version: 1,
      isCurrentVersion: true,
      effectiveFrom: today,
      assignedEmployees: [],
      createdBy: "Neha Mehta (HR Manager)",
      createdDate: today,
      lastUpdated: today,
    };

    setStructures((prev) => [duplicated, ...prev]);
    setToastMessage(`Duplicated "${structure.name}" as new structure "${duplicated.name}".`);
  };

  // Delete Structure
  const handleDeleteStructure = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete structure "${name}"?`)) {
      setStructures((prev) => prev.filter((s) => s.id !== id));
      if (viewingStructure?.id === id) setViewingStructure(null);
      setToastMessage(`Deleted structure "${name}".`);
    }
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Payroll"
      title="Salary Structure"
      description="Create and manage salary templates used for payroll processing, assemble components from Masters, and assign templates to employees."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Payroll" },
        { label: "Salary Structure" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => handleOpenCreateModal()}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Create Structure
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOpenAssignModal(structures[0])}
            className="rounded-xl text-xs font-bold bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50 shadow-xs"
          >
            <UserPlus className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
            Assign Structure
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setToastMessage("Exporting salary structure templates to Excel...")}
            className="rounded-xl text-xs font-medium bg-white text-slate-700 border-slate-300 shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export
          </Button>
        </div>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: 5 TOP DASHBOARD METRICS CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-5">
        <HRKPICard
          label="Total Structures"
          value={`${metrics.totalStructures}`}
          subtitle="Salary Templates"
          tone="blue"
          icon={<Layers className="h-5 w-5" />}
        />
        <HRKPICard
          label="Active Structures"
          value={`${metrics.activeStructuresCount}`}
          subtitle="Ready for Payroll"
          tone="purple"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <HRKPICard
          label="Assigned Employees"
          value={`${metrics.assignedEmployeesCount}`}
          subtitle="Mapped to Template"
          tone="emerald"
          icon={<UserCheck className="h-5 w-5" />}
        />
        <HRKPICard
          label="Unassigned Employees"
          value={`${metrics.unassignedEmployeesCount}`}
          subtitle="Pending Structure"
          tone="amber"
          icon={<Users className="h-5 w-5" />}
        />
        <HRKPICard
          label="Average Gross Salary"
          value={`₹${metrics.avgGross.toLocaleString("en-IN")}`}
          subtitle="Per Employee CTC"
          tone="emerald"
          icon={<DollarSign className="h-5 w-5" />}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: FILTERS TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Structure Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/50 font-medium text-slate-800"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Desktop Filter Selects */}
            <div className="hidden sm:flex items-center gap-2">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Departments</option>
                <option value="Front Office">Front Office</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Food & Beverage">Food &amp; Beverage</option>
              </select>

              <select
                value={selectedEmpType}
                onChange={(e) => setSelectedEmpType(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Employment Types</option>
                <option value="Permanent">Permanent</option>
                <option value="Contract">Contract</option>
                <option value="Probation">Probation</option>
                <option value="Trainee">Trainee</option>
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
                  setSelectedDept("ALL");
                  setSelectedEmpType("ALL");
                  setSelectedStatus("ALL");
                }}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
              >
                Reset
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
          SECTION 3: MAIN DATA TABLE (DESKTOP) & CARDS (MOBILE)
      ───────────────────────────────────────────────────────────── */}
      {/* Desktop Table */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-3.5 px-4">Structure Name &amp; Ver</th>
                <th className="py-3.5 px-4">Type &amp; Dept</th>
                <th className="py-3.5 px-4">Effective Dates</th>
                <th className="py-3.5 px-4">Components Summary</th>
                <th className="py-3.5 px-4">Gross &amp; Net Salary</th>
                <th className="py-3.5 px-4">Assigned Employees</th>
                <th className="py-3.5 px-4">Last Updated</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStructures.map((s) => {
                const basicComp = s.earnings.find((e) => e.componentName.toLowerCase().includes("basic"));
                const hraComp = s.earnings.find((e) => e.componentName.toLowerCase().includes("hra"));
                const pfComp = s.deductions.find((d) => d.componentName.toLowerCase().includes("pf"));
                const esiComp = s.deductions.find((d) => d.componentName.toLowerCase().includes("esi"));

                return (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => setViewingStructure(s)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 text-sm">{s.name}</p>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-900 text-amber-400 border border-slate-700">
                          v{s.version}
                        </span>
                        {s.isCurrentVersion && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Active Ver
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{s.id} • Created by {s.createdBy}</p>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      <span className="px-2 py-0.5 rounded-lg text-[11px] bg-slate-100 border border-slate-200 font-bold text-slate-700 block w-fit mb-1">
                        {s.structureType}
                      </span>
                      <span className="text-slate-600">{s.department}</span>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      <p className="text-slate-900 font-semibold">From: {s.effectiveFrom}</p>
                      <p className="text-slate-500 text-[10px]">To: {s.effectiveTo || "Present"}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {basicComp && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Basic: ₹{basicComp.computedAmount.toLocaleString("en-IN")}
                          </span>
                        )}
                        {hraComp && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                            HRA: ₹{hraComp.computedAmount.toLocaleString("en-IN")}
                          </span>
                        )}
                        {pfComp && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                            PF
                          </span>
                        )}
                        {esiComp && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                            ESI
                          </span>
                        )}
                        {s.overtimeEligible && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                            OT 1.0x
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-black text-slate-900 text-sm">₹{s.grossSalary.toLocaleString("en-IN")}</p>
                      <p className="text-[10px] text-emerald-700 font-bold">
                        Net: ₹{s.netSalary.toLocaleString("en-IN")}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingStructure(s);
                        }}
                        className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition flex items-center gap-1"
                      >
                        👥 {s.assignedEmployees.length} Staff
                      </button>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-600 text-[11px]">
                      {s.lastUpdated}
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
                          onClick={() => setViewingStructure(s)}
                          className="rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" /> View
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenCreateModal(s)}
                          className="rounded-xl text-xs font-semibold text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Edit
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAssignModal(s)}
                          className="rounded-xl text-xs font-semibold text-blue-800 border-blue-300 hover:bg-blue-50"
                        >
                          <UserPlus className="h-3.5 w-3.5 mr-1 text-blue-600" /> Assign
                        </Button>

                        <div className="relative group">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDuplicateAsNewVersion(s)}
                            className="rounded-xl text-xs font-semibold text-purple-800 border-purple-300 hover:bg-purple-50"
                          >
                            <Layers className="h-3.5 w-3.5 mr-1 text-purple-600" /> +New Ver
                          </Button>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteStructure(s.id, s.name)}
                          className="rounded-xl text-xs font-semibold text-rose-700 border-rose-200 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="sm:hidden space-y-3">
        {filteredStructures.map((s) => (
          <div
            key={s.id}
            onClick={() => setViewingStructure(s)}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 text-sm">{s.name}</p>
                <p className="text-[10px] text-slate-400">{s.department} • {s.employmentType}</p>
              </div>
              <StatusBadge status={s.status} />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Gross Salary:</span>
                <span className="font-black text-slate-900">₹{s.grossSalary.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Net Salary:</span>
                <span className="font-bold text-emerald-800">₹{s.netSalary.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1">
                <span className="text-slate-500 font-medium">Assigned Employees:</span>
                <span className="font-bold text-blue-800">{s.assignedEmployees.length} Staff</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewingStructure(s);
                }}
                className="w-full text-xs font-bold"
              >
                View
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenCreateModal(s);
                }}
                className="w-full text-xs font-bold text-emerald-800"
              >
                Edit
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenAssignModal(s);
                }}
                className="w-full bg-emerald-700 text-white text-xs font-bold"
              >
                Assign
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: CREATE / EDIT SALARY STRUCTURE MODAL
      ───────────────────────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title={editingStructureId ? "Edit Salary Structure Template" : "Create Salary Structure Template"}
          description="Assemble components from Masters (Salary Components) to define gross and net salary formulas."
          size="2xl"
        >
          <form onSubmit={handleSaveStructure} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {/* Basic Information */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Basic Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Structure Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Front Office Executive"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={formDept}
                    onChange={(e) => setFormDept(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800"
                  >
                    <option value="Front Office">Front Office</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Food & Beverage">Food &amp; Beverage</option>
                    <option value="Accounts">Accounts</option>
                    <option value="Human Resource">Human Resource</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employment Type</label>
                  <select
                    value={formEmpType}
                    onChange={(e) => setFormEmpType(e.target.value as any)}
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800"
                  >
                    <option value="Permanent">Permanent</option>
                    <option value="Contract">Contract</option>
                    <option value="Probation">Probation</option>
                    <option value="Trainee">Trainee</option>
                    <option value="All">All Types</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Template usage notes and grade information..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Earnings Section */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-emerald-700" />
                  Earnings Section (Pulled from Masters)
                </h4>

                {/* Add Earnings Component Dropdown */}
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddComponentFromMaster(e.target.value, "Earnings");
                      e.target.value = "";
                    }
                  }}
                  className="text-xs rounded-xl border border-emerald-300 py-1.5 px-3 bg-white font-bold text-emerald-800 shadow-2xs"
                >
                  <option value="" disabled>
                    + Add Earning Component...
                  </option>
                  {MASTER_SALARY_COMPONENTS.filter((m) => m.type === "Earnings").map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.defaultCalcType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                {formEarnings.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white border border-emerald-100 grid grid-cols-12 gap-2 items-center text-xs"
                  >
                    <div className="col-span-4 font-bold text-slate-900">{item.componentName}</div>
                    <div className="col-span-3">
                      <select
                        value={item.calcType}
                        onChange={(e) => {
                          const val = e.target.value as ComponentCalcType;
                          setFormEarnings((prev) =>
                            prev.map((line, i) => (i === idx ? { ...line, calcType: val } : line))
                          );
                        }}
                        className="w-full rounded-lg border border-slate-200 p-1.5 text-[11px] bg-slate-50 font-medium"
                      >
                        <option value="Fixed Amount">Fixed Amount (₹)</option>
                        <option value="Percentage of Basic">Percentage of Basic (%)</option>
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={item.amountOrPercentage}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setFormEarnings((prev) =>
                            prev.map((line, i) => (i === idx ? { ...line, amountOrPercentage: val } : line))
                          );
                        }}
                        className="w-full rounded-lg border border-slate-200 p-1.5 font-bold text-slate-900 bg-white"
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      <span className="font-extrabold text-emerald-800">
                        ₹{liveTotals.computedEarnings[idx]?.computedAmount || 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormEarnings((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deductions Section */}
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="h-4 w-4 text-rose-700" />
                  Deductions Section (PF, ESI, PT, TDS)
                </h4>

                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddComponentFromMaster(e.target.value, "Deductions");
                      e.target.value = "";
                    }
                  }}
                  className="text-xs rounded-xl border border-rose-300 py-1.5 px-3 bg-white font-bold text-rose-800 shadow-2xs"
                >
                  <option value="" disabled>
                    + Add Deduction Component...
                  </option>
                  {MASTER_SALARY_COMPONENTS.filter((m) => m.type === "Deductions").map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.defaultCalcType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                {formDeductions.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white border border-rose-100 grid grid-cols-12 gap-2 items-center text-xs"
                  >
                    <div className="col-span-4 font-bold text-slate-900">{item.componentName}</div>
                    <div className="col-span-3">
                      <select
                        value={item.calcType}
                        onChange={(e) => {
                          const val = e.target.value as ComponentCalcType;
                          setFormDeductions((prev) =>
                            prev.map((line, i) => (i === idx ? { ...line, calcType: val } : line))
                          );
                        }}
                        className="w-full rounded-lg border border-slate-200 p-1.5 text-[11px] bg-slate-50 font-medium"
                      >
                        <option value="Fixed Amount">Fixed Amount (₹)</option>
                        <option value="Percentage of Basic">Percentage of Basic (%)</option>
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={item.amountOrPercentage}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setFormDeductions((prev) =>
                            prev.map((line, i) => (i === idx ? { ...line, amountOrPercentage: val } : line))
                          );
                        }}
                        className="w-full rounded-lg border border-slate-200 p-1.5 font-bold text-slate-900 bg-white"
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      <span className="font-extrabold text-rose-800">
                        ₹{liveTotals.computedDeductions[idx]?.computedAmount || 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormDeductions((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Calculation Panel */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-[11px] text-slate-400 font-bold block uppercase">Total Earnings</span>
                <span className="text-lg font-black text-emerald-400">
                  ₹{liveTotals.gross.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="border-x border-slate-700/80">
                <span className="text-[11px] text-slate-400 font-bold block uppercase">Total Deductions</span>
                <span className="text-lg font-black text-rose-400">
                  ₹{liveTotals.totalDed.toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-bold block uppercase">Net Take-Home Salary</span>
                <span className="text-xl font-black text-amber-400">
                  ₹{liveTotals.net.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                {editingStructureId ? "Update Structure" : "Save Structure"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: ASSIGN SALARY STRUCTURE MODAL
      ───────────────────────────────────────────────────────────── */}
      {assigningStructure && (
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title="Assign Salary Structure Template"
          description="Map a salary structure template to individual employees or an entire department."
          size="md"
        >
          <form onSubmit={handleSaveAssign} className="space-y-4 text-xs">
            {/* Select Target Structure Template */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <label className="block text-xs font-bold text-slate-800">
                Salary Structure Template <span className="text-rose-500">*</span>
              </label>
              <select
                value={assigningStructure.id}
                onChange={(e) => {
                  const selected = structures.find((s) => s.id === e.target.value);
                  if (selected) setAssigningStructure(selected);
                }}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-extrabold text-emerald-950 focus:ring-2 focus:ring-emerald-600"
              >
                {structures.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.department} • Gross: ₹{s.grossSalary.toLocaleString("en-IN")})
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Selection Tabs */}
            <div className="p-1 rounded-xl bg-slate-100 grid grid-cols-3 gap-1 text-center text-xs font-bold">
              <button
                type="button"
                onClick={() => setAssignMode("Individual")}
                className={`py-2 rounded-lg transition ${
                  assignMode === "Individual" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Individual
              </button>
              <button
                type="button"
                onClick={() => setAssignMode("Department")}
                className={`py-2 rounded-lg transition ${
                  assignMode === "Department" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Department
              </button>
              <button
                type="button"
                onClick={() => setAssignMode("Multiple")}
                className={`py-2 rounded-lg transition ${
                  assignMode === "Multiple" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Multiple
              </button>
            </div>

            {/* Individual Employee Selection - Unified Searchable Combobox */}
            {assignMode === "Individual" && (
              <div className="space-y-1.5" ref={assignComboboxRef}>
                <label className="block text-xs font-bold text-slate-700">
                  Select Employee <span className="text-rose-500">*</span>
                </label>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsAssignComboboxOpen(!isAssignComboboxOpen)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-left font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-2xs"
                  >
                    {selectedEmpId ? (
                      (() => {
                        const emp = INITIAL_EMPLOYEES.find((e) => e.id === selectedEmpId);
                        return emp ? (
                          <span className="font-extrabold text-slate-900">
                            {emp.name} <span className="text-slate-400 font-normal">({emp.id} • {emp.department})</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">-- Select Employee --</span>
                        );
                      })()
                    ) : (
                      <span className="text-slate-400 font-normal">-- Select Employee --</span>
                    )}
                    <ChevronDown className="h-4 w-4 text-slate-400 ml-2 shrink-0" />
                  </button>

                  {isAssignComboboxOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 space-y-2 text-xs animate-in fade-in">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search employee by name, ID or department..."
                          value={assignSearchTerm}
                          onChange={(e) => setAssignSearchTerm(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                        />
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                        {INITIAL_EMPLOYEES.filter((emp) =>
                          assignSearchTerm
                            ? emp.name.toLowerCase().includes(assignSearchTerm.toLowerCase()) ||
                              emp.id.toLowerCase().includes(assignSearchTerm.toLowerCase()) ||
                              emp.department.toLowerCase().includes(assignSearchTerm.toLowerCase())
                            : true
                        ).map((emp) => {
                          const isAssigned = assigningStructure?.assignedEmployees.some((a) => a.id === emp.id);

                          return (
                            <button
                              key={emp.id}
                              type="button"
                              disabled={isAssigned}
                              onClick={() => {
                                setSelectedEmpId(emp.id);
                                setIsAssignComboboxOpen(false);
                                setAssignSearchTerm("");
                              }}
                              className={cn(
                                "w-full text-left p-2 rounded-xl flex items-center justify-between transition text-xs",
                                isAssigned
                                  ? "bg-slate-100/70 text-slate-400 opacity-60 cursor-not-allowed"
                                  : selectedEmpId === emp.id
                                  ? "bg-emerald-50 text-emerald-950 font-bold border border-emerald-300"
                                  : "hover:bg-slate-50 text-slate-800"
                              )}
                            >
                              <div>
                                <p className="font-semibold">{emp.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{emp.id} • {emp.department}</p>
                              </div>
                              {isAssigned && (
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                                  Already Assigned
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Department Selection */}
            {assignMode === "Department" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Department</label>
                <select
                  value={selectedAssignDept}
                  onChange={(e) => setSelectedAssignDept(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800"
                >
                  <option value="" disabled>-- Select Department --</option>
                  <option value="Front Office">Front Office (All Employees)</option>
                  <option value="Housekeeping">Housekeeping (All Employees)</option>
                  <option value="Food & Beverage">Food &amp; Beverage (All Employees)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Assigning to this department will apply this template to all matching staff members.
                </p>
              </div>
            )}

            {/* Multiple Employees Checkboxes */}
            {assignMode === "Multiple" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Select Employees</label>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {selectedMultiEmpIds.length} Selected
                  </span>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search employee..."
                    value={assignSearchTerm}
                    onChange={(e) => setAssignSearchTerm(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-xl border border-slate-200 bg-white">
                  {INITIAL_EMPLOYEES.filter((emp) =>
                    assignSearchTerm
                      ? emp.name.toLowerCase().includes(assignSearchTerm.toLowerCase()) ||
                        emp.id.toLowerCase().includes(assignSearchTerm.toLowerCase()) ||
                        emp.department.toLowerCase().includes(assignSearchTerm.toLowerCase())
                      : true
                  ).map((emp) => {
                    const isAssigned = assigningStructure?.assignedEmployees.some((a) => a.id === emp.id);

                    return (
                      <label
                        key={emp.id}
                        className={`flex items-center justify-between text-xs p-2 rounded-xl border transition ${
                          isAssigned
                            ? "bg-slate-100/80 border-slate-200 opacity-60 cursor-not-allowed text-slate-500"
                            : selectedMultiEmpIds.includes(emp.id)
                            ? "bg-emerald-50 border-emerald-300 font-bold text-emerald-950"
                            : "bg-white border-slate-100 hover:bg-slate-50 text-slate-800 cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            disabled={isAssigned}
                            checked={isAssigned || selectedMultiEmpIds.includes(emp.id)}
                            onChange={(e) => {
                              if (isAssigned) return;
                              if (e.target.checked) {
                                setSelectedMultiEmpIds((prev) => [...prev, emp.id]);
                              } else {
                                setSelectedMultiEmpIds((prev) => prev.filter((id) => id !== emp.id));
                              }
                            }}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div>
                            <p className={`font-semibold ${isAssigned ? "line-through text-slate-500" : ""}`}>
                              {emp.name}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono">{emp.id} • {emp.department}</span>
                          </div>
                        </div>

                        {isAssigned && (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full border border-slate-300">
                            Already Assigned
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAssignModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                Confirm Assignment
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SIDE DRAWER: DETAILED SALARY STRUCTURE PREVIEW & AUDIT
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(viewingStructure)}
        onClose={() => setViewingStructure(null)}
        title="Detailed Salary Structure Preview"
        icon={<Layers className="h-5 w-5 text-emerald-700" />}
      >
        {viewingStructure && (
          <div className="space-y-4 text-xs">
            {/* Header Info with Version Badges */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">{viewingStructure.name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{viewingStructure.id}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-900 text-amber-400 border border-slate-700">
                    Version {viewingStructure.version}
                  </span>
                  {viewingStructure.isCurrentVersion && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Active Version
                    </span>
                  )}
                  <StatusBadge status={viewingStructure.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-slate-600 text-[11px]">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Structure Type</span>
                  <span className="font-extrabold text-slate-800">{viewingStructure.structureType}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Department &amp; Type</span>
                  <span className="font-semibold text-slate-800">{viewingStructure.department} • {viewingStructure.employmentType}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Effective From</span>
                  <span className="font-semibold text-slate-800">{viewingStructure.effectiveFrom}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Effective To</span>
                  <span className="font-semibold text-slate-800">{viewingStructure.effectiveTo || "Present / Active"}</span>
                </div>
              </div>

              {viewingStructure.description && (
                <p className="text-slate-500 italic text-[11px] border-t border-slate-200 pt-2">
                  "{viewingStructure.description}"
                </p>
              )}
            </div>

            {/* Complete Financial Component Breakdown */}
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
              <span className="font-extrabold text-emerald-950 block uppercase text-[11px]">1. Earnings Breakdown</span>
              <div className="space-y-1.5">
                {viewingStructure.earnings.map((e, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-emerald-100">
                    <span className="font-semibold text-slate-800">{e.componentName}</span>
                    <span className="font-black text-emerald-800">₹{e.computedAmount.toLocaleString("en-IN")}</span>
                  </div>
                ))}
                {viewingStructure.incentives > 0 && (
                  <div className="flex justify-between items-center bg-emerald-100/60 p-2 rounded-lg border border-emerald-200">
                    <span className="font-extrabold text-emerald-950">Performance Incentives:</span>
                    <span className="font-black text-emerald-900">+₹{viewingStructure.incentives.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between items-center bg-amber-50 p-2 rounded-lg border border-amber-200">
                  <span className="font-bold text-amber-950">Overtime Eligibility:</span>
                  <span className="font-black text-amber-900">{viewingStructure.overtimeEligible ? "Eligible (1.0x Rate)" : "Exempt / Ineligible"}</span>
                </div>
              </div>
            </div>

            {/* Deductions Breakdown */}
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
              <span className="font-extrabold text-rose-950 block uppercase text-[11px]">2. Deductions Breakdown</span>
              <div className="space-y-1.5">
                {viewingStructure.deductions.map((d, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-rose-100">
                    <span className="font-semibold text-slate-800">{d.componentName}</span>
                    <span className="font-black text-rose-800">₹{d.computedAmount.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white grid grid-cols-3 gap-2 text-center shadow-lg">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Gross</span>
                <span className="font-black text-white text-base">₹{viewingStructure.grossSalary.toLocaleString("en-IN")}</span>
              </div>
              <div className="border-x border-slate-700">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Deductions</span>
                <span className="font-black text-rose-400 text-base">-₹{viewingStructure.totalDeductions.toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Net Salary</span>
                <span className="font-black text-amber-400 text-base">₹{viewingStructure.netSalary.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Audit Information */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
              <span className="font-extrabold text-slate-900 block uppercase text-[11px]">Audit Information</span>
              <p className="flex justify-between text-slate-600"><span>Created By:</span> <strong>{viewingStructure.createdBy}</strong></p>
              <p className="flex justify-between text-slate-600"><span>Created Date:</span> <strong>{viewingStructure.createdDate}</strong></p>
              <p className="flex justify-between text-slate-600"><span>Last Modified Date:</span> <strong>{viewingStructure.lastUpdated}</strong></p>
            </div>

            {/* Assigned Employees List */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 block uppercase text-[11px]">
                  Assigned Employees ({viewingStructure.assignedEmployees.length})
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenAssignModal(viewingStructure)}
                  className="rounded-lg text-[11px] font-bold py-1 h-7 text-blue-700 border-blue-200"
                >
                  + Add More
                </Button>
              </div>

              {viewingStructure.assignedEmployees.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {viewingStructure.assignedEmployees.map((emp) => (
                    <div key={emp.id} className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <HREmployeeCell
                        name={emp.name}
                        id={emp.id}
                        avatar={emp.avatar}
                        department={emp.department}
                        designation={emp.designation}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic text-center py-3">No employees assigned to this template yet.</p>
              )}
            </div>

            {/* Duplication Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  handleDuplicateAsNewVersion(viewingStructure);
                  setViewingStructure(null);
                }}
                className="w-full text-xs font-bold text-purple-800 border-purple-300 hover:bg-purple-50"
              >
                <Layers className="h-3.5 w-3.5 mr-1" />
                Duplicate as New Version
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  handleDuplicateAsNewStructure(viewingStructure);
                  setViewingStructure(null);
                }}
                className="w-full text-xs font-bold text-blue-800 border-blue-300 hover:bg-blue-50"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Duplicate as New Template
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* MOBILE FILTERS BOTTOM SHEET MODAL */}
      {isMobileFilterOpen && (
        <Modal
          isOpen={isMobileFilterOpen}
          onClose={() => setIsMobileFilterOpen(false)}
          title="Filter Salary Structures"
          size="sm"
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Department</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
              >
                <option value="ALL">All Departments</option>
                <option value="Front Office">Front Office</option>
                <option value="Housekeeping">Housekeeping</option>
                <option value="Food & Beverage">Food &amp; Beverage</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Employment Type</label>
              <select
                value={selectedEmpType}
                onChange={(e) => setSelectedEmpType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-white font-semibold"
              >
                <option value="ALL">All Employment Types</option>
                <option value="Permanent">Permanent</option>
                <option value="Contract">Contract</option>
                <option value="Probation">Probation</option>
                <option value="Trainee">Trainee</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                size="sm"
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full bg-emerald-700 text-white rounded-xl font-bold"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </ModulePageShell>
  );
}
