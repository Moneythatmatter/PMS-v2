"use client";

import React, { useState, useMemo } from "react";
import {
  Percent,
  Search,
  Users,
  DollarSign,
  CheckCircle2,
  Plus,
  Printer,
  SlidersHorizontal,
  X,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  Calculator,
  Building2,
  Award,
  Upload,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  FileCheck,
  History,
  AlertCircle,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { HREmployeeCell } from "@/components/hr/shared/HREmployeeCell";

// Tab 1: Tax Rule Interface
export interface TaxRule {
  id: string;
  ruleName: string;
  taxType: "Professional Tax" | "TDS" | "Income Tax Slabs";
  calcMethod: "Fixed Amount" | "Percentage" | "Slab Based";
  rateOrSlab: string;
  effectiveDate: string;
  status: "Active" | "Inactive";
}

// Tab 2: Employee Tax Declaration Interface
export interface EmployeeTaxDeclaration {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  avatar: string;
  photoUrl?: string;
  panNo: string;
  regime: "New Tax Regime" | "Old Tax Regime";
  declaredAmount: number;
  verifiedAmount: number;
  status: "Verified" | "Pending Verification" | "Rejected";
  proofDocuments: string[];
}

// Tab 3: Monthly Tax Calculation Preview Interface
export interface EmployeeTaxCalculation {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  avatar: string;
  photoUrl?: string;
  grossSalary: number;
  taxableIncome: number;
  tdsAmount: number;
  ptAmount: number;
  netTaxDeducted: number;
}

// Tab 4: Tax Exemption Interface
export interface TaxExemptionRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  avatar: string;
  exemptionType: "HRA" | "LTA" | "Medical Insurance (80D)" | "80C Investments" | "Education Allowance";
  declaredAmount: number;
  approvedAmount: number;
  status: "Approved" | "Pending" | "Rejected";
}

// Tab 5: Tax Audit Log Interface
export interface TaxAuditLog {
  id: string;
  action: string;
  category: string;
  updatedBy: string;
  timestamp: string;
  details: string;
}

export const INITIAL_TAX_RULES: TaxRule[] = [
  {
    id: "TR-101",
    ruleName: "Maharashtra Professional Tax (PT)",
    taxType: "Professional Tax",
    calcMethod: "Fixed Amount",
    rateOrSlab: "₹200 / Month (> ₹10k Salary)",
    effectiveDate: "01/04/2026",
    status: "Active",
  },
  {
    id: "TR-102",
    ruleName: "Standard TDS Deduction (Salaries > 5L)",
    taxType: "TDS",
    calcMethod: "Percentage",
    rateOrSlab: "10% of Taxable Income",
    effectiveDate: "01/04/2026",
    status: "Active",
  },
  {
    id: "TR-103",
    ruleName: "New Tax Regime FY 2026-27 Slabs",
    taxType: "Income Tax Slabs",
    calcMethod: "Slab Based",
    rateOrSlab: "0% (0-3L), 5% (3-7L), 10% (7-10L), 15% (10-12L)",
    effectiveDate: "01/04/2026",
    status: "Active",
  },
  {
    id: "TR-104",
    ruleName: "Old Tax Regime FY 2026-27 Slabs",
    taxType: "Income Tax Slabs",
    calcMethod: "Slab Based",
    rateOrSlab: "5% (2.5-5L), 20% (5-10L), 30% (>10L)",
    effectiveDate: "01/04/2026",
    status: "Active",
  },
];

export const INITIAL_DECLARATIONS: EmployeeTaxDeclaration[] = [
  {
    id: "DEC-201",
    employeeId: "EMP-0101",
    employeeName: "Rajesh Kumar",
    department: "Front Office",
    designation: "Front Desk Manager",
    avatar: "RK",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    panNo: "ABCDE1234F",
    regime: "Old Tax Regime",
    declaredAmount: 150000,
    verifiedAmount: 150000,
    status: "Verified",
    proofDocuments: ["PAN_Card_Rajesh.pdf", "80C_LIC_Receipt.pdf", "HRA_Rent_Receipt.pdf"],
  },
  {
    id: "DEC-202",
    employeeId: "EMP-0102",
    employeeName: "Priya Patel",
    department: "Front Office",
    designation: "Guest Relations Executive",
    avatar: "PP",
    panNo: "FGHIJ5678K",
    regime: "New Tax Regime",
    declaredAmount: 75000,
    verifiedAmount: 50000,
    status: "Pending Verification",
    proofDocuments: ["PAN_Card_Priya.pdf", "Medical_80D_Insurance.pdf"],
  },
  {
    id: "DEC-203",
    employeeId: "EMP-0103",
    employeeName: "Anjali Sharma",
    department: "Housekeeping",
    designation: "Executive Housekeeper",
    avatar: "AS",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
    panNo: "LMNOP9012Q",
    regime: "Old Tax Regime",
    declaredAmount: 120000,
    verifiedAmount: 120000,
    status: "Verified",
    proofDocuments: ["PAN_Card_Anjali.pdf", "PPF_Deposit_Receipt.pdf"],
  },
  {
    id: "DEC-204",
    employeeId: "EMP-0104",
    employeeName: "Chef Vikramjit Singh",
    department: "Food & Beverage",
    designation: "Executive Head Chef",
    avatar: "VS",
    panNo: "RSTUV3456W",
    regime: "Old Tax Regime",
    declaredAmount: 200000,
    verifiedAmount: 180000,
    status: "Verified",
    proofDocuments: ["PAN_Card_Vikram.pdf", "Home_Loan_Interest_Cert.pdf"],
  },
  {
    id: "DEC-205",
    employeeId: "EMP-0105",
    employeeName: "Arjun Verma",
    department: "Food & Beverage",
    designation: "Restaurant Captain",
    avatar: "AV",
    panNo: "XYZAB7890C",
    regime: "New Tax Regime",
    declaredAmount: 40000,
    verifiedAmount: 0,
    status: "Pending Verification",
    proofDocuments: ["PAN_Card_Arjun.pdf"],
  },
];

export const INITIAL_CALCULATIONS: EmployeeTaxCalculation[] = [
  { id: "TC-301", employeeId: "EMP-0101", employeeName: "Rajesh Kumar", department: "Front Office", avatar: "RK", grossSalary: 32750, taxableIncome: 24500, tdsAmount: 1000, ptAmount: 200, netTaxDeducted: 1200 },
  { id: "TC-302", employeeId: "EMP-0102", employeeName: "Priya Patel", department: "Front Office", avatar: "PP", grossSalary: 28750, taxableIncome: 22000, tdsAmount: 600, ptAmount: 200, netTaxDeducted: 800 },
  { id: "TC-303", employeeId: "EMP-0103", employeeName: "Anjali Sharma", department: "Housekeeping", avatar: "AS", grossSalary: 35600, taxableIncome: 26000, tdsAmount: 1300, ptAmount: 200, netTaxDeducted: 1500 },
  { id: "TC-304", employeeId: "EMP-0104", employeeName: "Chef Vikramjit Singh", department: "Food & Beverage", avatar: "VS", grossSalary: 64950, taxableIncome: 52000, tdsAmount: 4300, ptAmount: 200, netTaxDeducted: 4500 },
  { id: "TC-305", employeeId: "EMP-0105", employeeName: "Arjun Verma", department: "Food & Beverage", avatar: "AV", grossSalary: 29600, taxableIncome: 23000, tdsAmount: 400, ptAmount: 200, netTaxDeducted: 600 },
];

export const INITIAL_EXEMPTIONS: TaxExemptionRecord[] = [
  { id: "EX-401", employeeId: "EMP-0101", employeeName: "Rajesh Kumar", department: "Front Office", avatar: "RK", exemptionType: "HRA", declaredAmount: 86400, approvedAmount: 86400, status: "Approved" },
  { id: "EX-402", employeeId: "EMP-0101", employeeName: "Rajesh Kumar", department: "Front Office", avatar: "RK", exemptionType: "80C Investments", declaredAmount: 150000, approvedAmount: 150000, status: "Approved" },
  { id: "EX-403", employeeId: "EMP-0102", employeeName: "Priya Patel", department: "Front Office", avatar: "PP", exemptionType: "Medical Insurance (80D)", declaredAmount: 25000, approvedAmount: 20000, status: "Pending" },
  { id: "EX-404", employeeId: "EMP-0103", employeeName: "Anjali Sharma", department: "Housekeeping", avatar: "AS", exemptionType: "LTA", declaredAmount: 40000, approvedAmount: 40000, status: "Approved" },
];

export const INITIAL_AUDIT_LOGS: TaxAuditLog[] = [
  { id: "TL-01", action: "Verified Tax Declaration", category: "Employee Declarations", updatedBy: "Neha Mehta (HR Admin)", timestamp: "09 Aug 2026, 05:10 PM", details: "Verified 80C proof documents for Rajesh Kumar (EMP-0101)." },
  { id: "TL-02", action: "Added Tax Rule", category: "Tax Rules", updatedBy: "Vikram Malhotra (Finance Head)", timestamp: "01 Aug 2026, 11:30 AM", details: "Added New Tax Regime FY 2026-27 Slabs rule." },
];

export function TaxManagementView() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"rules" | "declarations" | "calculations" | "exemptions" | "audit">("rules");

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Data States
  const [taxRules, setTaxRules] = useState<TaxRule[]>(INITIAL_TAX_RULES);
  const [declarations, setDeclarations] = useState<EmployeeTaxDeclaration[]>(INITIAL_DECLARATIONS);
  const [calculations] = useState<EmployeeTaxCalculation[]>(INITIAL_CALCULATIONS);
  const [exemptions] = useState<TaxExemptionRecord[]>(INITIAL_EXEMPTIONS);

  // Modals & Drawers
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);
  const [verifyingDeclaration, setVerifyingDeclaration] = useState<EmployeeTaxDeclaration | null>(null);
  const [viewingTaxProfile, setViewingTaxProfile] = useState<EmployeeTaxDeclaration | null>(null);

  // Add Rule Form State
  const [ruleName, setRuleName] = useState("");
  const [taxType, setTaxType] = useState<"Professional Tax" | "TDS" | "Income Tax Slabs">("TDS");
  const [calcMethod, setCalcMethod] = useState<"Fixed Amount" | "Percentage" | "Slab Based">("Percentage");
  const [rateOrSlab, setRateOrSlab] = useState("");

  // Verification Modal State
  const [verifyAmount, setVerifyAmount] = useState(0);

  // Metrics
  const metrics = useMemo(() => {
    const employeesUnderTax = calculations.length + 123; // 128
    const totalTdsMonth = calculations.reduce((sum, c) => sum + c.tdsAmount, 240000); // 245000
    const pendingDeclarations = declarations.filter((d) => d.status === "Pending Verification").length + 16; // 18
    const taxRulesConfigured = taxRules.length + 2; // 6
    return { employeesUnderTax, totalTdsMonth, pendingDeclarations, taxRulesConfigured };
  }, [calculations, declarations, taxRules]);

  // Handlers
  const handleSaveAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    const newRule: TaxRule = {
      id: `TR-${Math.floor(100 + Math.random() * 900)}`,
      ruleName,
      taxType,
      calcMethod,
      rateOrSlab: rateOrSlab || "Standard Rate",
      effectiveDate: new Date().toLocaleDateString("en-GB"),
      status: "Active",
    };

    setTaxRules((prev) => [newRule, ...prev]);
    setIsAddRuleModalOpen(false);
    setToastMessage(`Tax Rule "${ruleName}" added successfully.`);
  };

  const handleVerifyDeclarationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingDeclaration) return;

    setDeclarations((prev) =>
      prev.map((d) =>
        d.id === verifyingDeclaration.id
          ? {
              ...d,
              verifiedAmount: verifyAmount,
              status: "Verified",
            }
          : d
      )
    );

    setVerifyingDeclaration(null);
    setToastMessage(`Verified tax declaration for ${verifyingDeclaration.employeeName}. Approved ₹${verifyAmount.toLocaleString("en-IN")}.`);
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Payroll"
      title="Tax Management"
      description="Manage tax rules, Professional Tax, TDS settings, employee investment declarations, tax exemptions, and monthly payroll tax calculations."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Payroll" },
        { label: "Tax Management" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => setIsAddRuleModalOpen(true)}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Tax Rule
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setToastMessage("Importing employee tax declarations from Excel...")}
            className="rounded-xl text-xs font-semibold bg-white text-slate-700 border-slate-300 shadow-xs"
          >
            <Upload className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Import Declarations
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setToastMessage("Exporting tax report to Excel...")}
            className="rounded-xl text-xs font-medium bg-white text-slate-700 border-slate-300 shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export Report
          </Button>
        </div>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: 4 DASHBOARD KPI CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <HRKPICard
          label="Employees Under Tax"
          value={`${metrics.employeesUnderTax}`}
          subtitle="Taxable Salary Staff"
          tone="blue"
          icon={<Users className="h-5 w-5" />}
        />
        <HRKPICard
          label="Total TDS This Month"
          value={`₹${(metrics.totalTdsMonth / 100000).toFixed(2)}L`}
          subtitle="Monthly Deduction"
          tone="emerald"
          icon={<DollarSign className="h-5 w-5" />}
        />
        <HRKPICard
          label="Pending Declarations"
          value={`${metrics.pendingDeclarations}`}
          subtitle="Awaiting Proof Verification"
          tone="amber"
          icon={<AlertCircle className="h-5 w-5" />}
        />
        <HRKPICard
          label="Tax Rules Configured"
          value={`${metrics.taxRulesConfigured}`}
          subtitle="Active Tax Regulations"
          tone="purple"
          icon={<Percent className="h-5 w-5" />}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: TAB NAVIGATION
      ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-xs mb-5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("rules")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
            activeTab === "rules"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Percent className="h-4 w-4" /> Tax Rules
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("declarations")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
            activeTab === "declarations"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <FileCheck className="h-4 w-4" /> Employee Declarations
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("calculations")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
            activeTab === "calculations"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Calculator className="h-4 w-4" /> Tax Calculations
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("exemptions")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
            activeTab === "exemptions"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <ShieldCheck className="h-4 w-4" /> Exemptions
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
            activeTab === "audit"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <History className="h-4 w-4" /> Audit Log
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: TAB 1 - TAX RULES
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "rules" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Rule Name</th>
                  <th className="py-3.5 px-4">Tax Type</th>
                  <th className="py-3.5 px-4">Calculation Method</th>
                  <th className="py-3.5 px-4">Rate / Slab Details</th>
                  <th className="py-3.5 px-4">Effective Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {taxRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{rule.ruleName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{rule.id}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
                        {rule.taxType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">{rule.calcMethod}</td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 max-w-xs truncate">
                      {rule.rateOrSlab}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-medium">{rule.effectiveDate}</td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={rule.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setToastMessage(`Editing rule ${rule.ruleName}...`)}
                        className="rounded-xl text-xs font-semibold text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                      >
                        <Edit className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: TAB 2 - EMPLOYEE TAX DECLARATIONS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "declarations" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">PAN Number</th>
                  <th className="py-3.5 px-4">Tax Regime</th>
                  <th className="py-3.5 px-4">Declared Amount</th>
                  <th className="py-3.5 px-4">Verified Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {declarations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition cursor-pointer" onClick={() => setViewingTaxProfile(d)}>
                    <td className="py-3.5 px-4">
                      <HREmployeeCell name={d.employeeName} id={d.employeeId} avatar={d.avatar} photoUrl={d.photoUrl} />
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{d.panNo}</td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                        d.regime === "New Tax Regime" ? "bg-purple-100 text-purple-900 border border-purple-200" : "bg-amber-100 text-amber-900 border border-amber-200"
                      }`}>
                        {d.regime}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">₹{d.declaredAmount.toLocaleString("en-IN")}</td>

                    <td className="py-3.5 px-4 font-bold text-emerald-800">₹{d.verifiedAmount.toLocaleString("en-IN")}</td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={d.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingTaxProfile(d)}
                          className="rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" /> Profile
                        </Button>

                        {d.status === "Pending Verification" && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setVerifyingDeclaration(d);
                              setVerifyAmount(d.declaredAmount);
                            }}
                            className="rounded-xl text-xs font-semibold text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1 text-emerald-600" /> Verify
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: TAB 3 - MONTHLY TAX CALCULATIONS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "calculations" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Gross Salary</th>
                  <th className="py-3.5 px-4">Taxable Income</th>
                  <th className="py-3.5 px-4">TDS (Income Tax)</th>
                  <th className="py-3.5 px-4">Professional Tax (PT)</th>
                  <th className="py-3.5 px-4 font-extrabold text-right">Net Tax Deducted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {calculations.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <HREmployeeCell name={c.employeeName} id={c.employeeId} avatar={c.avatar} photoUrl={c.photoUrl} />
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">{c.department}</td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">₹{c.grossSalary.toLocaleString("en-IN")}</td>

                    <td className="py-3.5 px-4 font-bold text-blue-900">₹{c.taxableIncome.toLocaleString("en-IN")}</td>

                    <td className="py-3.5 px-4 font-bold text-rose-700">₹{c.tdsAmount.toLocaleString("en-IN")}</td>

                    <td className="py-3.5 px-4 font-bold text-slate-700">₹{c.ptAmount.toLocaleString("en-IN")}</td>

                    <td className="py-3.5 px-4 font-black text-rose-900 text-sm text-right">
                      -₹{c.netTaxDeducted.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 6: TAB 4 - EXEMPTIONS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "exemptions" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Exemption Category</th>
                  <th className="py-3.5 px-4">Declared Exemption</th>
                  <th className="py-3.5 px-4">Approved Exemption</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exemptions.map((ex) => (
                  <tr key={ex.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <HREmployeeCell name={ex.employeeName} id={ex.employeeId} avatar={ex.avatar} />
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs bg-emerald-100 text-emerald-900 border border-emerald-200">
                        {ex.exemptionType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-800">₹{ex.declaredAmount.toLocaleString("en-IN")}</td>

                    <td className="py-3.5 px-4 font-bold text-emerald-800">₹{ex.approvedAmount.toLocaleString("en-IN")}</td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={ex.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 7: TAB 5 - AUDIT LOG
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "audit" && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
          {INITIAL_AUDIT_LOGS.map((log) => (
            <div key={log.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-xs">{log.action}</span>
                <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Category: <strong>{log.category}</strong> | Updated By: <strong>{log.updatedBy}</strong>
              </p>
              <p className="text-slate-500 italic pt-1 text-[11px]">"{log.details}"</p>
            </div>
          ))}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: ADD TAX RULE MODAL
      ───────────────────────────────────────────────────────────── */}
      {isAddRuleModalOpen && (
        <Modal
          isOpen={isAddRuleModalOpen}
          onClose={() => setIsAddRuleModalOpen(false)}
          title="Add New Tax Rule"
          description="Define a new tax deduction formula or income tax slab rate."
          size="md"
        >
          <form onSubmit={handleSaveAddRule} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rule Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Karnataka Professional Tax Slab"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tax Type</label>
                <select
                  value={taxType}
                  onChange={(e) => setTaxType(e.target.value as any)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800"
                >
                  <option value="Professional Tax">Professional Tax</option>
                  <option value="TDS">TDS</option>
                  <option value="Income Tax Slabs">Income Tax Slabs</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Calculation Method</label>
                <select
                  value={calcMethod}
                  onChange={(e) => setCalcMethod(e.target.value as any)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-semibold text-slate-800"
                >
                  <option value="Fixed Amount">Fixed Amount</option>
                  <option value="Percentage">Percentage</option>
                  <option value="Slab Based">Slab Based</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rate / Slab Details</label>
              <input
                type="text"
                placeholder="e.g. 10% of Taxable Income or ₹200/mo"
                value={rateOrSlab}
                onChange={(e) => setRateOrSlab(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddRuleModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                Save Tax Rule
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: VERIFY DECLARATION MODAL
      ───────────────────────────────────────────────────────────── */}
      {verifyingDeclaration && (
        <Modal
          isOpen={Boolean(verifyingDeclaration)}
          onClose={() => setVerifyingDeclaration(null)}
          title={`Verify Tax Proofs: ${verifyingDeclaration.employeeName}`}
          description={`Verify proof documents submitted under ${verifyingDeclaration.regime}.`}
          size="md"
        >
          <form onSubmit={handleVerifyDeclarationSubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p><strong>Employee ID:</strong> {verifyingDeclaration.employeeId}</p>
              <p><strong>PAN Number:</strong> {verifyingDeclaration.panNo}</p>
              <p><strong>Declared Investment:</strong> ₹{verifyingDeclaration.declaredAmount.toLocaleString("en-IN")}</p>
            </div>

            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-700 block">Submitted Proof Documents:</span>
              {verifyingDeclaration.proofDocuments.map((doc, i) => (
                <div key={i} className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-between text-emerald-950">
                  <span className="font-mono">{doc}</span>
                  <span className="font-bold text-[10px] text-emerald-700">Verified File</span>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Approved Verification Amount (₹)</label>
              <input
                type="number"
                value={verifyAmount}
                onChange={(e) => setVerifyAmount(Number(e.target.value))}
                className="w-full text-xs rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVerifyingDeclaration(null)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                Approve &amp; Verify
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SIDE DRAWER: EMPLOYEE TAX PROFILE DRAWER
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(viewingTaxProfile)}
        onClose={() => setViewingTaxProfile(null)}
        title="Employee Tax Profile"
        icon={<Percent className="h-5 w-5 text-emerald-700" />}
      >
        {viewingTaxProfile && (
          <div className="space-y-4 text-xs">
            <HREmployeeCell
              name={viewingTaxProfile.employeeName}
              id={viewingTaxProfile.employeeId}
              avatar={viewingTaxProfile.avatar}
              photoUrl={viewingTaxProfile.photoUrl}
              department={viewingTaxProfile.department}
              designation={viewingTaxProfile.designation}
            />

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500 font-medium">PAN Number</span>
                <span className="font-bold text-slate-900 font-mono">{viewingTaxProfile.panNo}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500 font-medium">Tax Regime</span>
                <span className="font-black text-purple-900">{viewingTaxProfile.regime}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500 font-medium">Declared Amount</span>
                <span className="font-bold text-slate-900">₹{viewingTaxProfile.declaredAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Verified Amount</span>
                <span className="font-black text-emerald-800">₹{viewingTaxProfile.verifiedAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 uppercase block">Uploaded Proof Documents</span>
              <div className="space-y-1.5">
                {viewingTaxProfile.proofDocuments.map((doc, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                    <span className="font-mono text-slate-700">{doc}</span>
                    <Button type="button" variant="outline" size="sm" className="h-6 text-[10px] py-0 px-2 rounded-md">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </ModulePageShell>
  );
}
