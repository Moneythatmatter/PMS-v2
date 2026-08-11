"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  Search,
  Users,
  DollarSign,
  CheckCircle2,
  Lock,
  Eye,
  Edit,
  Play,
  Printer,
  SlidersHorizontal,
  X,
  FileSpreadsheet,
  Building2,
  AlertCircle,
  PauseCircle,
  Unlock,
  CreditCard,
  Calculator,
  ChevronRight,
  ChevronDown,
  Send,
  MoreVertical,
  CheckSquare,
  Square,
  AlertTriangle,
  History,
  ShieldAlert,
  FileText,
  CheckCircle,
  HelpCircle,
  Check,
  RefreshCw,
  Landmark,
  FileCode,
  Download,
  Mail,
  Plus,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { HREmployeeCell } from "@/components/hr/shared/HREmployeeCell";

export type PayrollStatus = "Draft" | "Calculated" | "Approved" | "Paid" | "On Hold";

export interface EmployeePayrollRecord {
  id: string;
  payrollId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  avatar: string;
  photoUrl?: string;
  
  // Step 2: Earnings
  basicSalary: number;
  hra: number;
  allowances: number;
  overtimePay: number;
  holidayPay: number;
  incentives: number;
  bonus: number;
  otherEarnings: number;
  grossSalary: number;
  
  // Step 2: Deductions
  leaveDeduction: number;
  pfDeduction: number;
  esiDeduction: number;
  ptDeduction: number;
  tdsDeduction: number;
  otherDeductions: number;
  totalDeductions: number;

  netSalary: number;
  status: PayrollStatus;
  isOnHold?: boolean;
  paymentDate?: string;
  paymentRefNo?: string;
  bankRefNo?: string;
  payslipGenerated?: boolean;
  
  // Validation flags
  hasAttendanceIssue?: boolean;
  missingBankDetails?: boolean;
  missingSalaryStructure?: boolean;
  missingPan?: boolean;
  pendingLeaveApproval?: boolean;
  pendingOtApproval?: boolean;
}

export interface PayrollAuditEntry {
  id: string;
  action: string;
  changedBy: string;
  changedOn: string;
  overrideReason?: string;
  auditNotes?: string;
}

export const INITIAL_PAYROLL_RECORDS: EmployeePayrollRecord[] = [
  {
    id: "PR-801",
    payrollId: "PAY-2026-08",
    employeeId: "EMP-0101",
    employeeName: "Rajesh Kumar",
    department: "Front Office",
    designation: "Front Desk Manager",
    avatar: "RK",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    basicSalary: 18000,
    hra: 7200,
    allowances: 3500,
    overtimePay: 1500,
    holidayPay: 2550,
    incentives: 1000,
    bonus: 0,
    otherEarnings: 500,
    grossSalary: 34250,
    leaveDeduction: 0,
    pfDeduction: 1800,
    esiDeduction: 300,
    ptDeduction: 200,
    tdsDeduction: 1000,
    otherDeductions: 0,
    totalDeductions: 3300,
    netSalary: 30950,
    status: "Calculated",
  },
  {
    id: "PR-802",
    payrollId: "PAY-2026-08",
    employeeId: "EMP-0102",
    employeeName: "Priya Patel",
    department: "Front Office",
    designation: "Guest Relations Executive",
    avatar: "PP",
    basicSalary: 16000,
    hra: 6400,
    allowances: 3000,
    overtimePay: 800,
    holidayPay: 2550,
    incentives: 500,
    bonus: 0,
    otherEarnings: 0,
    grossSalary: 29250,
    leaveDeduction: 500,
    pfDeduction: 1600,
    esiDeduction: 300,
    ptDeduction: 200,
    tdsDeduction: 600,
    otherDeductions: 0,
    totalDeductions: 3200,
    netSalary: 26050,
    status: "Calculated",
    hasAttendanceIssue: true,
  },
  {
    id: "PR-803",
    payrollId: "PAY-2026-08",
    employeeId: "EMP-0103",
    employeeName: "Anjali Sharma",
    department: "Housekeeping",
    designation: "Executive Housekeeper",
    avatar: "AS",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
    basicSalary: 20000,
    hra: 8000,
    allowances: 4000,
    overtimePay: 1200,
    holidayPay: 2400,
    incentives: 1200,
    bonus: 0,
    otherEarnings: 0,
    grossSalary: 36800,
    leaveDeduction: 0,
    pfDeduction: 2000,
    esiDeduction: 350,
    ptDeduction: 200,
    tdsDeduction: 1300,
    otherDeductions: 0,
    totalDeductions: 3850,
    netSalary: 32950,
    status: "Calculated",
    pendingLeaveApproval: true,
  },
  {
    id: "PR-804",
    payrollId: "PAY-2026-08",
    employeeId: "EMP-0104",
    employeeName: "Chef Vikramjit Singh",
    department: "Food & Beverage",
    designation: "Executive Head Chef",
    avatar: "VS",
    basicSalary: 35000,
    hra: 14000,
    allowances: 9000,
    overtimePay: 3500,
    holidayPay: 3450,
    incentives: 2500,
    bonus: 5000,
    otherEarnings: 0,
    grossSalary: 72450,
    leaveDeduction: 0,
    pfDeduction: 3500,
    esiDeduction: 0,
    ptDeduction: 200,
    tdsDeduction: 4300,
    otherDeductions: 0,
    totalDeductions: 8000,
    netSalary: 64450,
    status: "Calculated",
  },
  {
    id: "PR-805",
    payrollId: "PAY-2026-08",
    employeeId: "EMP-0105",
    employeeName: "Arjun Verma",
    department: "Food & Beverage",
    designation: "Restaurant Captain",
    avatar: "AV",
    basicSalary: 17000,
    hra: 6800,
    allowances: 2500,
    overtimePay: 900,
    holidayPay: 2400,
    incentives: 800,
    bonus: 0,
    otherEarnings: 0,
    grossSalary: 30400,
    leaveDeduction: 1000,
    pfDeduction: 1700,
    esiDeduction: 300,
    ptDeduction: 200,
    tdsDeduction: 400,
    otherDeductions: 0,
    totalDeductions: 3600,
    netSalary: 26800,
    status: "Draft",
    missingBankDetails: true,
  },
];

export const INITIAL_AUDIT_LOGS: PayrollAuditEntry[] = [
  {
    id: "AUD-01",
    action: "Collected & Calculated Payroll Batch",
    changedBy: "Neha Mehta (HR Manager)",
    changedOn: "10 Aug 2026, 10:30 AM",
    auditNotes: "Automated fetch from Attendance, Leave, Overtime, Holiday, and Tax modules for August 2026.",
  },
];

export function ProcessPayrollView() {
  const [records, setRecords] = useState<EmployeePayrollRecord[]>(INITIAL_PAYROLL_RECORDS);
  const [auditLogs, setAuditLogs] = useState<PayrollAuditEntry[]>(INITIAL_AUDIT_LOGS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Step 1: Period Selection Controls
  const [selectedMonth, setSelectedMonth] = useState("August");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedEmpType, setSelectedEmpType] = useState("ALL");
  const [processAllOption, setProcessAllOption] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const [isGenerating, setIsGenerating] = useState(false);
  const [isPayrollLocked, setIsPayrollLocked] = useState(false);
  
  // Status Flow: Draft -> Calculated -> Approved -> Paid
  const [overallPayrollStage, setOverallPayrollStage] = useState<"Draft" | "Calculated" | "Approved" | "Paid">("Calculated");

  // Selection & Row Expansion
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [expandedRecordIds, setExpandedRecordIds] = useState<string[]>([]);

  // Drawers & Modals
  const [viewingRecord, setViewingRecord] = useState<EmployeePayrollRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<EmployeePayrollRecord | null>(null);
  const [activeActionDropdownId, setActiveActionDropdownId] = useState<string | null>(null);
  const [isValidationCenterOpen, setIsValidationCenterOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isMarkAsPaidModalOpen, setIsMarkAsPaidModalOpen] = useState(false);

  // Edit Adjustments Form State
  const [editBasic, setEditBasic] = useState(0);
  const [editHra, setEditHra] = useState(0);
  const [editAllowances, setEditAllowances] = useState(0);
  const [editOT, setEditOT] = useState(0);
  const [editHolidayPay, setEditHolidayPay] = useState(0);
  const [editIncentives, setEditIncentives] = useState(0);
  const [editBonus, setEditBonus] = useState(0);
  const [editOtherEarnings, setEditOtherEarnings] = useState(0);
  
  const [editLeaveDed, setEditLeaveDed] = useState(0);
  const [editPf, setEditPf] = useState(0);
  const [editEsi, setEditEsi] = useState(0);
  const [editPt, setEditPt] = useState(0);
  const [editTds, setEditTds] = useState(0);
  const [editOtherDeductions, setEditOtherDeductions] = useState(0);
  const [overrideReason, setOverrideReason] = useState("");

  // Mark As Paid Form State
  const [paymentDate, setPaymentDate] = useState("10/08/2026");
  const [paymentRefNo, setPaymentRefNo] = useState("PAY-REF-202608-001");
  const [bankRefNo, setBankRefNo] = useState("HDFC-TXN-987654321");

  // Filtered Table Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = selectedDept === "ALL" || r.department === selectedDept;
      const matchStatus = selectedStatus === "ALL" || r.status === selectedStatus;

      return matchSearch && matchDept && matchStatus;
    });
  }, [records, searchTerm, selectedDept, selectedStatus]);

  // Step 3: Summary Cards Metrics
  const metrics = useMemo(() => {
    const totalEmployees = records.length + 121; // 126
    const grossPayroll = records.reduce((sum, r) => sum + r.grossSalary, 3450000);
    const totalDeductions = records.reduce((sum, r) => sum + r.totalDeductions, 410000);
    const netPayroll = grossPayroll - totalDeductions;
    return { totalEmployees, grossPayroll, totalDeductions, netPayroll };
  }, [records]);

  // Step 2 & 4: Automatic Data Fetch & Recalculate Handler
  const handleCalculatePayroll = () => {
    if (isPayrollLocked) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setOverallPayrollStage("Calculated");
      setRecords((prev) => prev.map((r) => ({ ...r, status: "Calculated" })));
      addAuditEntry(`Fetched and calculated payroll inputs for ${selectedMonth} ${selectedYear}`);
      setToastMessage(`Payroll calculated successfully for ${selectedMonth} ${selectedYear}! Fetched Attendance, Leaves, OT & Tax modules.`);
    }, 800);
  };

  // Step 5: Approve Payroll Handler
  const handleApproveAll = () => {
    if (isPayrollLocked) return;
    setOverallPayrollStage("Approved");
    setRecords((prev) => prev.map((r) => (r.status === "On Hold" ? r : { ...r, status: "Approved" })));
    addAuditEntry(`Approved full payroll batch for ${selectedMonth} ${selectedYear}`);
    setToastMessage("Full payroll batch APPROVED! Ready for salary disbursement.");
  };

  const handleBulkApprove = () => {
    if (isPayrollLocked || selectedRecordIds.length === 0) return;
    setRecords((prev) =>
      prev.map((r) => (selectedRecordIds.includes(r.id) ? { ...r, status: "Approved" } : r))
    );
    addAuditEntry(`Approved ${selectedRecordIds.length} employee payroll records in bulk.`);
    setSelectedRecordIds([]);
    setToastMessage(`Approved ${selectedRecordIds.length} selected employee payroll records.`);
  };

  const handleLockPayroll = () => {
    setIsPayrollLocked(true);
    addAuditEntry("LOCKED payroll batch. All salary records are now read-only.");
    setToastMessage("Payroll batch LOCKED! All values are now read-only.");
  };

  // Step 6: Salary Payment Handler
  const handleMarkAsPaidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOverallPayrollStage("Paid");
    setIsPayrollLocked(true);
    setRecords((prev) =>
      prev.map((r) => ({
        ...r,
        status: "Paid",
        paymentDate,
        paymentRefNo,
        bankRefNo,
      }))
    );
    addAuditEntry(`Marked payroll batch as PAID. Bank Ref: ${bankRefNo}`);
    setIsMarkAsPaidModalOpen(false);
    setToastMessage(`Salaries marked as PAID for ${selectedMonth} ${selectedYear}! Bank Ref: ${bankRefNo}.`);
  };

  // Step 7: Generate Payslips Handler
  const handleGenerateAllPayslips = () => {
    setRecords((prev) => prev.map((r) => ({ ...r, payslipGenerated: true })));
    addAuditEntry("Generated payslips for all processed employees.");
    setToastMessage("Generated payslips for all employees! Available in Payslips module.");
  };

  // Bulk Selection Handlers
  const handleSelectAll = () => {
    if (selectedRecordIds.length === filteredRecords.length) {
      setSelectedRecordIds([]);
    } else {
      setSelectedRecordIds(filteredRecords.map((r) => r.id));
    }
  };

  const handleToggleSelectRecord = (id: string) => {
    setSelectedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleExpandRow = (id: string) => {
    setExpandedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Open Edit Modal
  const handleOpenEditModal = (r: EmployeePayrollRecord) => {
    if (isPayrollLocked) return;
    setEditingRecord(r);
    setEditBasic(r.basicSalary);
    setEditHra(r.hra);
    setEditAllowances(r.allowances);
    setEditOT(r.overtimePay);
    setEditHolidayPay(r.holidayPay);
    setEditIncentives(r.incentives);
    setEditBonus(r.bonus);
    setEditOtherEarnings(r.otherEarnings);

    setEditLeaveDed(r.leaveDeduction);
    setEditPf(r.pfDeduction);
    setEditEsi(r.esiDeduction);
    setEditPt(r.ptDeduction);
    setEditTds(r.tdsDeduction);
    setEditOtherDeductions(r.otherDeductions);

    setOverrideReason("Special attendance / Incentive adjustment");
    setActiveActionDropdownId(null);
  };

  const addAuditEntry = (action: string, notes?: string, reason?: string) => {
    const newEntry: PayrollAuditEntry = {
      id: `AUD-${Math.floor(10 + Math.random() * 90)}`,
      action,
      changedBy: "Neha Mehta (HR Manager)",
      changedOn: new Date().toLocaleString("en-GB"),
      overrideReason: reason,
      auditNotes: notes,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // Save Edit Adjustment
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const gross = editBasic + editHra + editAllowances + editOT + editHolidayPay + editIncentives + editBonus + editOtherEarnings;
    const totalDed = editLeaveDed + editPf + editEsi + editPt + editTds + editOtherDeductions;
    const net = gross - totalDed;

    setRecords((prev) =>
      prev.map((r) =>
        r.id === editingRecord.id
          ? {
              ...r,
              basicSalary: editBasic,
              hra: editHra,
              allowances: editAllowances,
              overtimePay: editOT,
              holidayPay: editHolidayPay,
              incentives: editIncentives,
              bonus: editBonus,
              otherEarnings: editOtherEarnings,
              grossSalary: gross,
              leaveDeduction: editLeaveDed,
              pfDeduction: editPf,
              esiDeduction: editEsi,
              ptDeduction: editPt,
              tdsDeduction: editTds,
              otherDeductions: editOtherDeductions,
              totalDeductions: totalDed,
              netSalary: net,
            }
          : r
      )
    );

    addAuditEntry(
      `Edited Adjustments for ${editingRecord.employeeName}`,
      "Manual adjustments saved",
      overrideReason
    );

    setEditingRecord(null);
    setToastMessage(`Adjustments saved for ${editingRecord.employeeName}. Net Salary re-computed to ₹${net.toLocaleString("en-IN")}.`);
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Payroll"
      title="Process Payroll"
      description="Compile attendance, leaves, overtime, holiday pay, and salary structures into final monthly salary calculations, reviews, and payslips."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Payroll" },
        { label: "Process Payroll" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAuditModalOpen(true)}
            className="rounded-xl text-xs font-semibold bg-white text-slate-700 border-slate-300 shadow-xs"
          >
            <History className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Audit History
          </Button>

          {!isPayrollLocked ? (
            <>
              <Button
                type="button"
                size="sm"
                onClick={handleApproveAll}
                className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Approve Payroll
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => setIsMarkAsPaidModalOpen(true)}
                className="rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white shadow-xs"
              >
                <Landmark className="mr-1.5 h-3.5 w-3.5" />
                Mark as Paid
              </Button>
            </>
          ) : (
            <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-slate-900 text-amber-400 border border-slate-700 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Payroll Locked &amp; Paid
            </span>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerateAllPayslips}
            className="rounded-xl text-xs font-semibold bg-white text-slate-700 border-slate-300 shadow-xs"
          >
            <FileText className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Generate Payslips
          </Button>
        </div>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          STEP 3: 4 SUMMARY CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <HRKPICard
          label="Total Employees"
          value={`${metrics.totalEmployees}`}
          subtitle="Salaried Staff"
          tone="blue"
          icon={<Users className="h-5 w-5" />}
        />
        <HRKPICard
          label="Gross Payroll Amount"
          value={`₹${(metrics.grossPayroll / 100000).toFixed(2)}L`}
          subtitle="Earnings Subtotal"
          tone="purple"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <HRKPICard
          label="Total Deductions"
          value={`₹${(metrics.totalDeductions / 100000).toFixed(2)}L`}
          subtitle="PF, ESI, Tax, Leaves"
          tone="rose"
          icon={<Calculator className="h-5 w-5" />}
        />
        <HRKPICard
          label="Net Payroll Amount"
          value={`₹${(metrics.netPayroll / 100000).toFixed(2)}L`}
          subtitle="Disbursement Amount"
          tone="emerald"
          icon={<CreditCard className="h-5 w-5" />}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          STEP 1: SELECT PAYROLL PERIOD & FILTERS TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Step 1: Payroll Month */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              disabled={isPayrollLocked}
              className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-extrabold text-slate-800"
            >
              <option value="August">August</option>
              <option value="July">July</option>
              <option value="June">June</option>
            </select>

            {/* Step 1: Payroll Year */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              disabled={isPayrollLocked}
              className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-extrabold text-slate-800"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>

            {/* Department Filter */}
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

            {/* Employment Type Filter */}
            <select
              value={selectedEmpType}
              onChange={(e) => setSelectedEmpType(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
            >
              <option value="ALL">All Employment Types</option>
              <option value="Permanent">Permanent</option>
              <option value="Contract">Contract</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 py-2 px-3 bg-white font-semibold text-slate-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="Draft">🟡 Draft</option>
              <option value="Calculated">🔵 Calculated</option>
              <option value="Approved">🟢 Approved</option>
              <option value="Paid">🔒 Paid</option>
            </select>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/50 font-medium text-slate-800"
              />
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            disabled={isGenerating || isPayrollLocked}
            onClick={handleCalculatePayroll}
            className="rounded-xl text-xs font-extrabold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
          >
            <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
            {isGenerating ? "Processing..." : "Process / Calculate Payroll"}
          </Button>
        </div>

        {/* Step 5: Bulk Approve / Lock Bar */}
        {selectedRecordIds.length > 0 && !isPayrollLocked && (
          <div className="p-3 rounded-xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in">
            <span className="font-extrabold text-amber-400">
              {selectedRecordIds.length} Employees Selected
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleBulkApprove}
                className="rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white py-1 h-7"
              >
                Approve Selected
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleLockPayroll}
                className="rounded-lg text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white py-1 h-7"
              >
                Lock Payroll
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          STEP 3: EMPLOYEE PAYROLL PREVIEW TABLE
      ───────────────────────────────────────────────────────────── */}
      {/* Desktop Table */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="py-3.5 px-3 w-10 text-center">
                  <button type="button" onClick={handleSelectAll} className="text-slate-500">
                    {selectedRecordIds.length === filteredRecords.length && filteredRecords.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-emerald-700" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Gross Salary</th>
                <th className="py-3.5 px-4">Earnings Subtotal</th>
                <th className="py-3.5 px-4">Deductions</th>
                <th className="py-3.5 px-4">Net Salary</th>
                <th className="py-3.5 px-4">Payroll Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((r) => {
                const isExpanded = expandedRecordIds.includes(r.id);
                const isSelected = selectedRecordIds.includes(r.id);

                return (
                  <React.Fragment key={r.id}>
                    <tr
                      className={`hover:bg-slate-50/80 transition ${
                        isSelected ? "bg-emerald-50/40" : ""
                      }`}
                    >
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectRecord(r.id)}
                          className="text-slate-500"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-emerald-700" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleExpandRow(r.id)}
                            className="p-1 hover:bg-slate-200 rounded-md text-slate-500"
                          >
                            <ChevronDown
                              className={`h-3.5 w-3.5 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                          <HREmployeeCell
                            name={r.employeeName}
                            id={r.employeeId}
                            avatar={r.avatar}
                            photoUrl={r.photoUrl}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {r.department}
                      </td>

                      <td className="py-3.5 px-4 font-black text-slate-900">
                        ₹{r.grossSalary.toLocaleString("en-IN")}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-emerald-800">
                        ₹{r.grossSalary.toLocaleString("en-IN")}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-rose-700">
                        -₹{r.totalDeductions.toLocaleString("en-IN")}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-black text-emerald-800 text-sm">
                          ₹{r.netSalary.toLocaleString("en-IN")}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={r.status} />
                      </td>

                      <td className="py-3.5 px-4 text-right relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveActionDropdownId(
                              activeActionDropdownId === r.id ? null : r.id
                            )
                          }
                          className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 font-bold border border-slate-200"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {activeActionDropdownId === r.id && (
                          <div className="absolute right-3 top-12 z-30 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 text-left text-xs animate-in fade-in">
                            <button
                              type="button"
                              onClick={() => {
                                setViewingRecord(r);
                                setActiveActionDropdownId(null);
                              }}
                              className="w-full px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                            >
                              <Eye className="h-3.5 w-3.5 text-slate-500" /> View Breakdown
                            </button>

                            {!isPayrollLocked && (
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(r)}
                                className="w-full px-3 py-2 rounded-xl text-emerald-800 hover:bg-emerald-50 flex items-center gap-2 font-semibold"
                              >
                                <Edit className="h-3.5 w-3.5 text-emerald-600" /> Edit Adjustments
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                handleCalculatePayroll();
                                setActiveActionDropdownId(null);
                              }}
                              className="w-full px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                            >
                              <RefreshCw className="h-3.5 w-3.5 text-slate-500" /> Recalculate
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* EXPANDABLE SALARY DETAILS (STEP 2 CALCULATED COMPONENTS) */}
                    {isExpanded && (
                      <tr className="bg-slate-50/90 border-b border-slate-200">
                        <td colSpan={9} className="p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div className="p-3 bg-white rounded-xl border border-slate-200">
                              <span className="font-extrabold text-slate-900 block mb-1">Base Earnings</span>
                              <p className="flex justify-between"><span>Basic Salary:</span> <strong className="text-slate-900">₹{r.basicSalary.toLocaleString("en-IN")}</strong></p>
                              <p className="flex justify-between"><span>HRA:</span> <strong className="text-slate-900">₹{r.hra.toLocaleString("en-IN")}</strong></p>
                              <p className="flex justify-between"><span>Allowances:</span> <strong className="text-slate-900">₹{r.allowances.toLocaleString("en-IN")}</strong></p>
                            </div>

                            <div className="p-3 bg-white rounded-xl border border-emerald-200 bg-emerald-50/20">
                              <span className="font-extrabold text-emerald-950 block mb-1">Variable Earnings</span>
                              <p className="flex justify-between"><span>Overtime Pay:</span> <strong className="text-emerald-800">+₹{r.overtimePay.toLocaleString("en-IN")}</strong></p>
                              <p className="flex justify-between"><span>Holiday Pay:</span> <strong className="text-emerald-800">+₹{r.holidayPay.toLocaleString("en-IN")}</strong></p>
                              <p className="flex justify-between"><span>Incentives &amp; Bonus:</span> <strong className="text-emerald-800">+₹{(r.incentives + r.bonus).toLocaleString("en-IN")}</strong></p>
                            </div>

                            <div className="p-3 bg-white rounded-xl border border-rose-200 bg-rose-50/20">
                              <span className="font-extrabold text-rose-950 block mb-1">Statutory Deductions</span>
                              <p className="flex justify-between"><span>Leave Deduction:</span> <strong className="text-rose-700">₹{r.leaveDeduction.toLocaleString("en-IN")}</strong></p>
                              <p className="flex justify-between"><span>PF &amp; ESI:</span> <strong className="text-rose-700">₹{(r.pfDeduction + r.esiDeduction).toLocaleString("en-IN")}</strong></p>
                              <p className="flex justify-between"><span>PT &amp; TDS:</span> <strong className="text-rose-700">₹{(r.ptDeduction + r.tdsDeduction).toLocaleString("en-IN")}</strong></p>
                            </div>

                            <div className="p-3 bg-slate-900 text-white rounded-xl flex flex-col justify-between">
                              <div>
                                <span className="text-[10px] text-slate-400 font-bold block uppercase">Net Salary Payable</span>
                                <span className="text-xl font-black text-amber-400">₹{r.netSalary.toLocaleString("en-IN")}</span>
                              </div>
                              <p className="text-[10px] text-slate-400">Status: {r.status}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="sm:hidden space-y-3">
        {filteredRecords.map((r) => (
          <div key={r.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <HREmployeeCell name={r.employeeName} id={r.employeeId} avatar={r.avatar} photoUrl={r.photoUrl} />
              <StatusBadge status={r.status} />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Gross Salary:</span>
                <span className="font-bold text-slate-900">₹{r.grossSalary.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Deductions:</span>
                <span className="font-bold text-rose-700">-₹{r.totalDeductions.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-black">
                <span className="text-slate-700">Net Salary:</span>
                <span className="text-emerald-800 text-sm">₹{r.netSalary.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <Button type="button" variant="outline" size="sm" onClick={() => setViewingRecord(r)} className="w-full text-xs font-bold">
                View Breakdown
              </Button>
              {!isPayrollLocked && (
                <Button type="button" variant="outline" size="sm" onClick={() => handleOpenEditModal(r)} className="w-full text-xs font-bold text-emerald-800 border-emerald-300">
                  Edit Adjustments
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: EDIT ADJUSTMENTS MODAL
      ───────────────────────────────────────────────────────────── */}
      {editingRecord && (
        <Modal
          isOpen={Boolean(editingRecord)}
          onClose={() => setEditingRecord(null)}
          title={`Edit Payroll Adjustments: ${editingRecord.employeeName}`}
          description={`Override earnings or deductions for ${selectedMonth} ${selectedYear}.`}
          size="lg"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <HREmployeeCell
                name={editingRecord.employeeName}
                id={editingRecord.employeeId}
                avatar={editingRecord.avatar}
                photoUrl={editingRecord.photoUrl}
                department={editingRecord.department}
              />
            </div>

            {/* Earnings Breakdown */}
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
              <span className="font-extrabold text-emerald-950 block uppercase">Earnings Components (₹)</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Basic Salary</label>
                  <input type="number" value={editBasic} onChange={(e) => setEditBasic(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 p-2 font-bold bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">HRA</label>
                  <input type="number" value={editHra} onChange={(e) => setEditHra(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 p-2 font-bold bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Allowances</label>
                  <input type="number" value={editAllowances} onChange={(e) => setEditAllowances(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 p-2 font-bold bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Overtime Pay (OT)</label>
                  <input type="number" value={editOT} onChange={(e) => setEditOT(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 p-2 font-bold bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Incentives</label>
                  <input type="number" value={editIncentives} onChange={(e) => setEditIncentives(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 p-2 font-bold bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bonus</label>
                  <input type="number" value={editBonus} onChange={(e) => setEditBonus(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 p-2 font-bold bg-white" />
                </div>
              </div>
            </div>

            {/* Deductions Breakdown */}
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 space-y-3">
              <span className="font-extrabold text-rose-950 block uppercase">Deduction Components (₹)</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Leave Deduction</label>
                  <input type="number" value={editLeaveDed} onChange={(e) => setEditLeaveDed(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 p-2 font-bold bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Provident Fund (PF)</label>
                  <input type="number" value={editPf} onChange={(e) => setEditPf(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 p-2 font-bold bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Professional Tax (PT)</label>
                  <input type="number" value={editPt} onChange={(e) => setEditPt(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 p-2 font-bold bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">TDS / Income Tax</label>
                  <input type="number" value={editTds} onChange={(e) => setEditTds(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 p-2 font-bold bg-white" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingRecord(null)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white">
                Save Adjustments
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STEP 6: MARK AS PAID MODAL
      ───────────────────────────────────────────────────────────── */}
      {isMarkAsPaidModalOpen && (
        <Modal
          isOpen={isMarkAsPaidModalOpen}
          onClose={() => setIsMarkAsPaidModalOpen(false)}
          title={`Mark Salary Payment: ${selectedMonth} ${selectedYear}`}
          description="Record bank disbursement details to transition payroll status to Paid."
          size="md"
        >
          <form onSubmit={handleMarkAsPaidSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Date</label>
              <input
                type="text"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Reference Number</label>
              <input
                type="text"
                required
                value={paymentRefNo}
                onChange={(e) => setPaymentRefNo(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Bank Transfer Reference</label>
              <input
                type="text"
                required
                value={bankRefNo}
                onChange={(e) => setBankRefNo(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-mono font-bold text-slate-900"
              />
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-medium">
              This action will freeze all {records.length} salary records, transition status to <strong>Paid</strong>, and enable automatic payslip emailing.
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsMarkAsPaidModalOpen(false)} className="rounded-xl text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="rounded-xl text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white">
                Confirm Disbursement &amp; Mark as Paid
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* AUDIT LOG MODAL */}
      {isAuditModalOpen && (
        <Modal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          title="Payroll Audit History"
          size="lg"
        >
          <div className="space-y-3 max-h-[65vh] overflow-y-auto text-xs pr-1">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900">{log.action}</span>
                  <span className="text-[10px] font-mono text-slate-400">{log.changedOn}</span>
                </div>
                <p className="text-slate-600">By: <strong>{log.changedBy}</strong></p>
                {log.auditNotes && <p className="text-slate-500 italic">"{log.auditNotes}"</p>}
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* VIEW BREAKDOWN DRAWER */}
      <Drawer
        isOpen={Boolean(viewingRecord)}
        onClose={() => setViewingRecord(null)}
        title="Salary Breakdown"
        icon={<Calculator className="h-5 w-5 text-emerald-700" />}
      >
        {viewingRecord && (
          <div className="space-y-4 text-xs">
            <HREmployeeCell name={viewingRecord.employeeName} id={viewingRecord.employeeId} avatar={viewingRecord.avatar} photoUrl={viewingRecord.photoUrl} department={viewingRecord.department} />
            <div className="p-4 rounded-2xl bg-slate-900 text-white text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Net Salary Payable</span>
              <span className="text-2xl font-black text-amber-400">₹{viewingRecord.netSalary.toLocaleString("en-IN")}</span>
            </div>
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1">
              <span className="font-bold text-emerald-950 block uppercase text-[11px]">Earnings</span>
              <p className="flex justify-between"><span>Basic Pay:</span> <strong>₹{viewingRecord.basicSalary.toLocaleString("en-IN")}</strong></p>
              <p className="flex justify-between"><span>HRA:</span> <strong>₹{viewingRecord.hra.toLocaleString("en-IN")}</strong></p>
              <p className="flex justify-between"><span>Allowances:</span> <strong>₹{viewingRecord.allowances.toLocaleString("en-IN")}</strong></p>
              <p className="flex justify-between text-emerald-800"><span>Overtime Pay:</span> <strong>+₹{viewingRecord.overtimePay.toLocaleString("en-IN")}</strong></p>
              <p className="flex justify-between text-emerald-800"><span>Holiday Pay:</span> <strong>+₹{viewingRecord.holidayPay.toLocaleString("en-IN")}</strong></p>
              <p className="flex justify-between text-emerald-800"><span>Incentives &amp; Bonus:</span> <strong>+₹{(viewingRecord.incentives + viewingRecord.bonus).toLocaleString("en-IN")}</strong></p>
            </div>
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 space-y-1">
              <span className="font-bold text-rose-950 block uppercase text-[11px]">Deductions</span>
              <p className="flex justify-between"><span>Leave Deduction:</span> <strong>₹{viewingRecord.leaveDeduction.toLocaleString("en-IN")}</strong></p>
              <p className="flex justify-between"><span>Provident Fund (PF):</span> <strong>₹{viewingRecord.pfDeduction.toLocaleString("en-IN")}</strong></p>
              <p className="flex justify-between"><span>ESI Insurance:</span> <strong>₹{viewingRecord.esiDeduction.toLocaleString("en-IN")}</strong></p>
              <p className="flex justify-between"><span>Professional Tax (PT):</span> <strong>₹{viewingRecord.ptDeduction.toLocaleString("en-IN")}</strong></p>
              <p className="flex justify-between"><span>TDS / Income Tax:</span> <strong>₹{viewingRecord.tdsDeduction.toLocaleString("en-IN")}</strong></p>
            </div>
          </div>
        )}
      </Drawer>
    </ModulePageShell>
  );
}
