"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  User,
  Building2,
  Briefcase,
  Clock,
  Phone,
  Mail,
  ShieldCheck,
  Calendar,
  CreditCard,
  FileText,
  Printer,
  Edit2,
  ArrowLeft,
  ChevronDown,
  Gift,
  Award,
  CheckCircle2,
  AlertTriangle,
  Download,
  Wallet,
  MessageSquareWarning,
  History,
  IdCard,
  Search,
  Users,
  Sparkles,
  Check,
  X,
  MapPin,
  Heart,
  Landmark,
  Shield,
  FileCheck,
  CheckSquare,
  XCircle,
  Eye,
  Upload,
  PieChart,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ModulePageShell } from "@/components/pms";
import { sampleEmployees, EmployeeItem } from "@/app/data/hr/employeeListData";
import { cn } from "@/lib/utils";

type ProfileTab =
  | "overview"
  | "employment"
  | "attendance"
  | "leave"
  | "payroll"
  | "documents"
  | "grievances"
  | "activity";

// Helper to calculate years & months of service
function calculateYearsOfService(joinDateStr: string): string {
  if (!joinDateStr) return "0 Years";
  try {
    const parts = joinDateStr.split("/");
    let joinDate: Date;
    if (parts.length === 3) {
      // Format: DD/MM/YYYY
      joinDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    } else {
      joinDate = new Date(joinDateStr);
    }
    const now = new Date();
    let years = now.getFullYear() - joinDate.getFullYear();
    let months = now.getMonth() - joinDate.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years <= 0) return `${months} Month${months === 1 ? "" : "s"}`;
    return `${years} Year${years === 1 ? "" : "s"} ${months} Month${months === 1 ? "" : "s"}`;
  } catch {
    return "3 Years 2 Months";
  }
}

// Categorized Document Model for Section 8
interface CategorizedDoc {
  id: string;
  name: string;
  category: "Identity Proof" | "Education" | "Employment" | "Financial" | "Medical" | "Compliance";
  status: "Verified" | "Uploaded" | "Expiring Soon" | "Expired" | "Missing" | "Pending Review";
  uploadDate?: string;
  fileSize?: string;
}

const CATEGORIZED_DOCUMENTS: CategorizedDoc[] = [
  // Identity Proof
  { id: "d1", name: "Aadhaar Card", category: "Identity Proof", status: "Verified", uploadDate: "15 Jan 2022", fileSize: "1.8 MB" },
  { id: "d2", name: "PAN Card", category: "Identity Proof", status: "Verified", uploadDate: "15 Jan 2022", fileSize: "850 KB" },
  { id: "d3", name: "Passport", category: "Identity Proof", status: "Expiring Soon", uploadDate: "20 Aug 2021", fileSize: "2.4 MB" },
  
  // Education
  { id: "d4", name: "10th Marksheet & Certificate", category: "Education", status: "Verified", uploadDate: "10 Jan 2022", fileSize: "1.2 MB" },
  { id: "d5", name: "12th Marksheet & Certificate", category: "Education", status: "Verified", uploadDate: "10 Jan 2022", fileSize: "1.4 MB" },
  { id: "d6", name: "Degree / Diploma Certificate (BHM)", category: "Education", status: "Verified", uploadDate: "12 Jan 2022", fileSize: "3.5 MB" },
  
  // Employment
  { id: "d7", name: "Updated Resume / CV", category: "Employment", status: "Verified", uploadDate: "05 Jan 2022", fileSize: "920 KB" },
  { id: "d8", name: "Offer Letter", category: "Employment", status: "Verified", uploadDate: "15 Jan 2022", fileSize: "1.1 MB" },
  { id: "d9", name: "Appointment Letter", category: "Employment", status: "Verified", uploadDate: "20 Jan 2022", fileSize: "1.5 MB" },
  { id: "d10", name: "Service Agreement & NDA", category: "Employment", status: "Verified", uploadDate: "20 Jan 2022", fileSize: "2.1 MB" },
  
  // Financial
  { id: "d11", name: "Bank Passbook / Cancelled Cheque", category: "Financial", status: "Verified", uploadDate: "18 Jan 2022", fileSize: "1.3 MB" },
  { id: "d12", name: "UAN & PF Allotment Letter", category: "Financial", status: "Verified", uploadDate: "22 Jan 2022", fileSize: "640 KB" },
  { id: "d13", name: "Form 16 / Tax Declaration", category: "Financial", status: "Pending Review", uploadDate: "01 Aug 2026", fileSize: "2.9 MB" },

  // Medical
  { id: "d14", name: "Pre-Employment Medical Fitness", category: "Medical", status: "Expired", uploadDate: "10 Jul 2024", fileSize: "1.7 MB" },

  // Compliance
  { id: "d15", name: "NDA Sign-off Document", category: "Compliance", status: "Verified", uploadDate: "20 Jan 2022", fileSize: "800 KB" },
  { id: "d16", name: "POSH Policy Acknowledgement", category: "Compliance", status: "Verified", uploadDate: "20 Jan 2022", fileSize: "750 KB" },
  { id: "d17", name: "Code of Conduct Declaration", category: "Compliance", status: "Verified", uploadDate: "20 Jan 2022", fileSize: "680 KB" },
];

interface GrievanceRecord {
  id: string;
  ticketNo: string;
  subject: string;
  category: string;
  date: string;
  status: "Open" | "Resolved" | "Escalated" | "Closed";
  resolutionNote?: string;
}

const SAMPLE_GRIEVANCES: Record<string, GrievanceRecord[]> = {
  "emp-101": [],
  "emp-102": [
    {
      id: "g1",
      ticketNo: "#GR-402",
      subject: "Shift Swap Approval Delay",
      category: "Shift Schedule",
      date: "02 Aug 2026",
      status: "Open",
      resolutionNote: "Under review by Housekeeping Department Head.",
    },
    {
      id: "g2",
      ticketNo: "#GR-280",
      subject: "Overtime Payment Reconciliation",
      category: "Payroll",
      date: "14 May 2026",
      status: "Resolved",
      resolutionNote: "Difference of ₹1,400 credited in June payroll cycle.",
    },
  ],
};

interface ActivityLogItem {
  id: string;
  timestamp: string;
  category: "Attendance" | "Leave" | "Payroll" | "Documents" | "Profile";
  timeframe: "Today" | "Yesterday" | "Last Week" | "Older";
  actor: string;
  description: string;
}

const SAMPLE_ACTIVITIES: ActivityLogItem[] = [
  {
    id: "act-1",
    timestamp: "Today at 09:15 AM",
    category: "Attendance",
    timeframe: "Today",
    actor: "Biometric System",
    description: "In-punch recorded at Main Entrance Gate (09:14:22 AM).",
  },
  {
    id: "act-2",
    timestamp: "Yesterday at 04:30 PM",
    category: "Leave",
    timeframe: "Yesterday",
    actor: "Rajesh Kumar (Employee)",
    description: "Submitted Casual Leave request for 18 Aug 2026 (1 Day).",
  },
  {
    id: "act-3",
    timestamp: "01 Aug 2026",
    category: "Payroll",
    timeframe: "Last Week",
    actor: "HR Payroll Admin",
    description: "July 2026 Payslip generated and delivered via Email.",
  },
  {
    id: "act-4",
    timestamp: "28 Jul 2026",
    category: "Documents",
    timeframe: "Last Week",
    actor: "Neha Mehta (HR Admin)",
    description: "Verified Form 16 Tax Declaration submission.",
  },
  {
    id: "act-5",
    timestamp: "15 Jul 2026",
    category: "Profile",
    timeframe: "Older",
    actor: "Vikram Malhotra (GM)",
    description: "Updated Designation to Front Desk Manager.",
  },
];

export function EmployeeProfileView({ initialEmpId }: { initialEmpId?: string }) {
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(initialEmpId || "emp-101");
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [isAttendanceExpanded, setIsAttendanceExpanded] = useState<boolean>(false);
  const [attendanceDateQuery, setAttendanceDateQuery] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeDocPreview, setActiveDocPreview] = useState<CategorizedDoc | null>(null);

  // Activity Log Filter States
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<string>("ALL");
  const [activityTimeframeFilter, setActivityTimeframeFilter] = useState<string>("ALL");

  // Search Combobox State
  const [comboboxQuery, setComboboxQuery] = useState("");
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);

  // Active Selected Employee
  const employee = selectedEmpId ? sampleEmployees.find((e) => e.id === selectedEmpId) || null : null;

  // Search results
  const searchResults = useMemo(() => {
    if (!comboboxQuery.trim()) return sampleEmployees;
    const q = comboboxQuery.toLowerCase();
    return sampleEmployees.filter((emp) => {
      return (
        emp.empCode.toLowerCase().includes(q) ||
        emp.name.toLowerCase().includes(q) ||
        emp.phone.includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.designation.toLowerCase().includes(q)
      );
    });
  }, [comboboxQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setIsComboboxOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectEmployee = (emp: EmployeeItem) => {
    setSelectedEmpId(emp.id);
    setIsComboboxOpen(false);
    setComboboxQuery("");
    setToastMessage(`Loaded employee profile: ${emp.name} (${emp.empCode})`);
  };

  // Filtered Activity Logs
  const filteredActivities = useMemo(() => {
    return SAMPLE_ACTIVITIES.filter((item) => {
      const matchCat = activityCategoryFilter === "ALL" || item.category === activityCategoryFilter;
      const matchTime = activityTimeframeFilter === "ALL" || item.timeframe === activityTimeframeFilter;
      return matchCat && matchTime;
    });
  }, [activityCategoryFilter, activityTimeframeFilter]);

  // Helper for Status Badges
  const renderDocStatusBadge = (status: CategorizedDoc["status"]) => {
    switch (status) {
      case "Verified":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Verified
          </span>
        );
      case "Uploaded":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Check className="h-3 w-3 text-blue-600" />
            Uploaded
          </span>
        );
      case "Pending Review":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="h-3 w-3 text-amber-600" />
            Pending Review
          </span>
        );
      case "Expiring Soon":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
            <AlertTriangle className="h-3 w-3 text-orange-600" />
            Expiring Soon
          </span>
        );
      case "Expired":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="h-3 w-3 text-rose-600" />
            Expired
          </span>
        );
      case "Missing":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <X className="h-3 w-3 text-slate-400" />
            Missing
          </span>
        );
    }
  };

  return (
    <ModulePageShell
      eyebrow="Human Resource / Employees"
      title="Employee Profile"
      description="Enterprise employee management view detailing personal background, employment hierarchy, attendance, leaves, payroll, categorized documents, and activity logs."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Employees", href: "/human-resources/employees/list" },
        { label: "Employee Profile" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <a href="/human-resources/employees/list">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-semibold bg-white shadow-xs cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
              Back to Employee List
            </Button>
          </a>

          {/* Header Switch Employee Combobox Button */}
          {employee && (
            <div className="relative" ref={comboboxRef}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsComboboxOpen(!isComboboxOpen)}
                className="rounded-xl border-slate-200 bg-white text-xs font-bold text-slate-800 shadow-xs cursor-pointer gap-1.5"
              >
                <Search className="h-3.5 w-3.5 text-emerald-600" />
                <span>Switch Employee</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </Button>

              {/* Popover Results */}
              {isComboboxOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-50 w-80 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xl space-y-2 animate-in fade-in-50">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      autoFocus
                      value={comboboxQuery}
                      onChange={(e) => setComboboxQuery(e.target.value)}
                      placeholder="Search ID, name, mobile or email..."
                      className="h-8 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1 divide-y divide-slate-100">
                    {searchResults.length === 0 ? (
                      <p className="p-3 text-center text-xs text-slate-400 font-medium">No matching employees found.</p>
                    ) : (
                      searchResults.map((emp) => (
                        <div
                          key={emp.id}
                          onClick={() => handleSelectEmployee(emp)}
                          className={cn(
                            "flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-colors hover:bg-slate-100/80",
                            emp.id === employee.id && "bg-emerald-50 text-emerald-900"
                          )}
                        >
                          {emp.photoUrl ? (
                            <img src={emp.photoUrl} alt={emp.name} className="h-7 w-7 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[10px] shrink-0">
                              {emp.avatar}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs truncate text-slate-900">{emp.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{emp.empCode} • {emp.department}</p>
                          </div>
                          {emp.id === employee.id && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {employee && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="rounded-xl text-xs font-medium bg-white shadow-xs"
              >
                <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
                Print Profile
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => setToastMessage(`Editing profile for ${employee.name}...`)}
                className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                Edit Profile
              </Button>
            </>
          )}
        </div>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          NO EMPLOYEE SELECTED STATE
      ───────────────────────────────────────────────────────────── */}
      {!employee ? (
        <div className="flex min-h-[440px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 text-center shadow-xs">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <Users className="h-7 w-7 text-emerald-700" />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            Direct Profile Navigation
          </span>

          <h3 className="text-base font-bold text-slate-900">
            Search Employee Profile
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-500 leading-relaxed mb-6">
            Search by Employee ID, Name, Mobile or Email to open and manage their profile.
          </p>

          <div className="w-full max-w-lg text-left relative" ref={comboboxRef}>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              🔍 Search Employee
            </label>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={comboboxQuery}
                onFocus={() => setIsComboboxOpen(true)}
                onChange={(e) => {
                  setComboboxQuery(e.target.value);
                  setIsComboboxOpen(true);
                }}
                placeholder="Search by Employee ID, Name, Mobile or Email..."
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-xs font-semibold text-slate-900 shadow-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              {comboboxQuery && (
                <button
                  onClick={() => setComboboxQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {isComboboxOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl space-y-1 max-h-72 overflow-y-auto animate-in fade-in-50">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 font-medium">
                    No matching employees found.
                  </div>
                ) : (
                  searchResults.map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => handleSelectEmployee(emp)}
                      className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors hover:bg-slate-100/80 border border-transparent hover:border-slate-200"
                    >
                      <div className="flex items-center gap-3">
                        {emp.photoUrl ? (
                          <img
                            src={emp.photoUrl}
                            alt={emp.name}
                            className="h-9 w-9 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs shrink-0 border border-emerald-200">
                            {emp.avatar}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{emp.name}</span>
                            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                              {emp.empCode}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {emp.designation} • <span className="text-emerald-700">{emp.department}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            FULL ENTERPRISE EMPLOYEE PROFILE VIEW
        ───────────────────────────────────────────────────────────── */
        <>
          {/* SECTION 1: HERO ENHANCED PROFILE HEADER */}
          <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Left Column: Photo, Name, Designation, Badges */}
              <div className="flex items-start gap-4">
                {employee.photoUrl ? (
                  <img
                    src={employee.photoUrl}
                    alt={employee.name}
                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border-2 border-slate-200 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-emerald-700 text-white font-bold text-xl sm:text-2xl shrink-0 shadow-xs">
                    {employee.avatar}
                  </div>
                )}

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-lg sm:text-xl font-bold text-slate-900">{employee.name}</h1>
                    <span className="rounded-xl bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                      {employee.empCode}
                    </span>
                    <span
                      className={cn(
                        "rounded-xl px-2.5 py-0.5 text-[10px] font-bold uppercase border",
                        employee.status === "Active"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-amber-100 text-amber-800 border-amber-300"
                      )}
                    >
                      {employee.status}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
                    {employee.designation} • <span className="text-emerald-700">{employee.department}</span>
                  </p>

                  {/* Header Context Metrics (Reporting Manager, Property, Service Duration) */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-500 border-t border-slate-100 pt-2">
                    <span className="flex items-center gap-1 font-medium">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-slate-400">Reporting To:</span>{" "}
                      <strong className="text-slate-800">{employee.reportingManager || "Ananya Sharma (GM)"}</strong>
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-slate-400">Property:</span>{" "}
                      <strong className="text-slate-800">Grand Hotel &amp; Suites</strong>
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-slate-400">Tenure:</span>{" "}
                      <strong className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                        {calculateYearsOfService(employee.joinDate)}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Shift & Employment Type Badges */}
              <div className="flex flex-wrap sm:flex-col gap-2 justify-start lg:justify-end border-t border-slate-100 pt-3 lg:border-t-0 lg:pt-0 shrink-0">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  {employee.shiftType}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 border border-blue-200">
                  <Briefcase className="h-3.5 w-3.5 text-blue-600" />
                  {employee.employmentType}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2 & 13: STICKY PROFILE TABS NAVIGATION */}
          <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-xs py-2 mb-5 border-b border-slate-200">
            <div className="flex overflow-x-auto gap-1.5 scrollbar-none">
              {[
                { id: "overview", label: "Overview & Personal" },
                { id: "employment", label: "Employment Details" },
                { id: "attendance", label: "Attendance & Shifts" },
                { id: "leave", label: "Leave Management" },
                { id: "payroll", label: "Payroll & Bank Info" },
                { id: "documents", label: "Documents" },
                { id: "grievances", label: "Grievances & Tickets" },
                { id: "activity", label: "Activity Log" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ProfileTab)}
                  className={cn(
                    "whitespace-nowrap px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer",
                    activeTab === tab.id
                      ? "bg-emerald-700 text-white shadow-2xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* TAB PANELS CONTAINER */}
          <div className="space-y-5">
            {/* ─────────────────────────────────────────────────────────────
                SECTION 3: TAB 1 - OVERVIEW & PERSONAL (Expanded)
            ───────────────────────────────────────────────────────────── */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-5">
                  {/* Personal Information Card */}
                  <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <User className="h-4 w-4 text-emerald-600" />
                      Personal Profile Details
                    </h3>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">Full Name:</span>
                        <span className="font-bold text-slate-900">{employee.name}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">Gender:</span>
                        <span className="font-bold text-slate-900">{employee.gender}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">Date of Birth (DOB):</span>
                        <span className="font-bold text-slate-900">{employee.dob || "14/05/1990"}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">Blood Group:</span>
                        <span className="font-bold text-slate-900">{employee.bloodGroup || "O+"}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">Marital Status:</span>
                        <span className="font-bold text-slate-900">Married</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">Nationality:</span>
                        <span className="font-bold text-slate-900">Indian</span>
                      </div>
                    </div>
                  </section>

                  {/* Contact Information Card */}
                  <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Phone className="h-4 w-4 text-blue-600" />
                      Contact &amp; Emergency Details
                    </h3>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">Mobile Phone:</span>
                        <span className="font-bold text-slate-900">{employee.phone}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">Official Email:</span>
                        <span className="font-bold text-emerald-800">{employee.email}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">Emergency Contact Name:</span>
                        <span className="font-bold text-slate-900">Sunita Sharma</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 font-medium">Relationship:</span>
                        <span className="font-bold text-slate-900">Spouse</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100 sm:col-span-2">
                        <span className="text-slate-500 font-medium">Emergency Phone:</span>
                        <span className="font-bold text-rose-700">{employee.emergencyContact}</span>
                      </div>
                    </div>
                  </section>

                  {/* Address Card */}
                  <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <MapPin className="h-4 w-4 text-rose-600" />
                      Address Details
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="font-bold text-slate-700 block mb-1">Current Residential Address</span>
                        <p className="text-slate-600 leading-relaxed">
                          {employee.address || "Suite 402, Park View Residency, MG Road, Mumbai - 400001"}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="font-bold text-slate-700 block mb-1">Permanent Hometown Address</span>
                        <p className="text-slate-600 leading-relaxed">
                          H.No 124, Civil Lines, Sector 14, Jaipur, Rajasthan - 302006
                        </p>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Right Column: Highlights Sidebar */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3 text-xs">
                    <h3 className="font-bold uppercase tracking-wider text-[11px] text-slate-400">Quick Metrics</h3>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-center">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase">Attendance Score</span>
                      <p className="text-2xl font-black text-emerald-900 mt-0.5">{employee.attendanceRate || 96}%</p>
                      <span className="text-[10px] text-emerald-700 font-medium">Top Performer</span>
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-center">
                      <span className="text-[10px] font-bold text-blue-800 uppercase">Monthly Gross Salary</span>
                      <p className="text-xl font-black text-blue-900 mt-0.5">₹{employee.salary.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Key Tags</span>
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-700">
                          Full-Time
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-700">
                          Front Desk Lead
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-700">
                          POS Certified
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                SECTION 4: TAB 2 - EMPLOYMENT DETAILS (Expanded)
            ───────────────────────────────────────────────────────────── */}
            {activeTab === "employment" && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 text-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Briefcase className="h-4 w-4 text-purple-600" />
                  Work &amp; Department Hierarchy Assignment
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/70">
                    <span className="text-slate-500 font-medium block mb-1">Employee Code:</span>
                    <span className="font-bold text-sm text-slate-900">{employee.empCode}</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/70">
                    <span className="text-slate-500 font-medium block mb-1">Reporting Manager:</span>
                    <span className="font-bold text-sm text-emerald-800">{employee.reportingManager || "Ananya Sharma (GM)"}</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/70">
                    <span className="text-slate-500 font-medium block mb-1">Department:</span>
                    <span className="font-bold text-sm text-slate-900">{employee.department}</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/70">
                    <span className="text-slate-500 font-medium block mb-1">Designation:</span>
                    <span className="font-bold text-sm text-slate-900">{employee.designation}</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/70">
                    <span className="text-slate-500 font-medium block mb-1">Employment Type:</span>
                    <span className="font-bold text-sm text-slate-900">{employee.employmentType}</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/70">
                    <span className="text-slate-500 font-medium block mb-1">Confirmation Date:</span>
                    <span className="font-bold text-sm text-slate-900">15/07/2022</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/70">
                    <span className="text-slate-500 font-medium block mb-1">Notice Period:</span>
                    <span className="font-bold text-sm text-slate-900">30 Days</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/70">
                    <span className="text-slate-500 font-medium block mb-1">Cost Center:</span>
                    <span className="font-bold text-sm text-slate-900">CC-FRONT-OFFICE-01</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/70">
                    <span className="text-slate-500 font-medium block mb-1">Work Location / Branch:</span>
                    <span className="font-bold text-sm text-slate-900">Grand Hotel &amp; Suites - Main Branch</span>
                  </div>
                </div>
              </section>
            )}

            {/* ─────────────────────────────────────────────────────────────
                SECTION 5: TAB 3 - ATTENDANCE & SHIFTS (Summary Cards + Shift Roster + 7-Day Table)
            ───────────────────────────────────────────────────────────── */}
            {activeTab === "attendance" && (
              <div className="space-y-5">
                {/* Current Shift Assignment Summary Widget (Improvement #10) */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3 text-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Clock className="h-4 w-4 text-emerald-600" />
                    Current Active Shift &amp; Assignment History
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Assigned Shift</span>
                      <h4 className="font-extrabold text-slate-900 text-sm">{employee.shiftType || "Morning Shift (MS-01)"}</h4>
                      <p className="text-[11px] font-semibold text-emerald-700">⏰ 07:00 AM - 03:30 PM (8.5 Hrs)</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Assigned Since</span>
                      <h4 className="font-extrabold text-slate-900 text-sm">01 Jan 2026</h4>
                      <p className="text-[11px] font-medium text-slate-500">Effective: Until Further Notice</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                      <span className="text-[10px] text-emerald-800 font-bold uppercase block">Shift History Log</span>
                      <h4 className="font-extrabold text-emerald-950 text-sm">3 Changes Recorded</h4>
                      <p className="text-[11px] font-semibold text-emerald-700">Audit Verified by HR</p>
                    </div>
                  </div>

                  {/* Shift History Log Table */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-700 uppercase block">Shift Audit History:</span>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Previous Shift</th>
                            <th className="py-2 px-3">Assigned Shift</th>
                            <th className="py-2 px-3">Changed By</th>
                            <th className="py-2 px-3">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-800">01/01/2026</td>
                            <td className="py-2 px-3 text-slate-500">Evening Shift (ES-02)</td>
                            <td className="py-2 px-3 font-bold text-emerald-800">Morning Shift (MS-01)</td>
                            <td className="py-2 px-3 text-slate-600 font-medium">Neha Mehta (HR)</td>
                            <td className="py-2 px-3 text-slate-500 italic">Annual Roster Swap</td>
                          </tr>
                          <tr className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-800">01/06/2025</td>
                            <td className="py-2 px-3 text-slate-500">General Shift (GS-04)</td>
                            <td className="py-2 px-3 font-bold text-emerald-800">Evening Shift (ES-02)</td>
                            <td className="py-2 px-3 text-slate-600 font-medium">HR Recruiter</td>
                            <td className="py-2 px-3 text-slate-500 italic">Promotion Shift Change</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>

                {/* 5 Status Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-center">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                    <span className="text-[10px] font-bold uppercase text-emerald-800">Present</span>
                    <p className="text-2xl font-black text-emerald-900 mt-1">24 Days</p>
                  </div>
                  <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3">
                    <span className="text-[10px] font-bold uppercase text-rose-800">Absent</span>
                    <p className="text-2xl font-black text-rose-900 mt-1">1 Day</p>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                    <span className="text-[10px] font-bold uppercase text-amber-800">Late</span>
                    <p className="text-2xl font-black text-amber-900 mt-1">2 Days</p>
                  </div>
                  <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-3">
                    <span className="text-[10px] font-bold uppercase text-purple-800">Half Day</span>
                    <p className="text-2xl font-black text-purple-900 mt-1">0 Days</p>
                  </div>
                  <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3">
                    <span className="text-[10px] font-bold uppercase text-blue-800">Overtime</span>
                    <p className="text-2xl font-black text-blue-900 mt-1">12.5 Hrs</p>
                  </div>
                </div>

                {/* 30 Days Attendance Log (Expandable Format) */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-emerald-600" />
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                          Attendance Log
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                            {attendanceDateQuery.trim()
                              ? "Filtered Log"
                              : isAttendanceExpanded
                              ? "30 Days Log"
                              : "Last 7 Days"}
                          </span>
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {attendanceDateQuery.trim()
                            ? `Showing search results for date matching "${attendanceDateQuery}"`
                            : isAttendanceExpanded
                            ? "Showing complete 30-day attendance record for current month"
                            : "Showing recent 7 days attendance summary. Expand to view full 30 days."}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Date Search Input */}
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={attendanceDateQuery}
                          onChange={(e) => setAttendanceDateQuery(e.target.value)}
                          placeholder="Search date (e.g. 05 Aug or Jul 2026)..."
                          className="h-8 w-52 rounded-xl border border-slate-300 bg-white pl-8 pr-7 text-xs font-medium text-slate-800 shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        {attendanceDateQuery && (
                          <button
                            type="button"
                            onClick={() => setAttendanceDateQuery("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsAttendanceExpanded(!isAttendanceExpanded)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition-all cursor-pointer"
                      >
                        <span>{isAttendanceExpanded ? "Collapse to 7 Days" : "Expand 30 Days Attendance"}</span>
                        <ChevronDown className={cn("h-4 w-4 text-slate-500 transition-transform duration-200", isAttendanceExpanded && "rotate-180")} />
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto overflow-y-auto max-h-80 rounded-xl border border-slate-100">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase border-b border-slate-200 sticky top-0 z-10 shadow-2xs">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Shift</th>
                          <th className="py-2.5 px-3">In Time</th>
                          <th className="py-2.5 px-3">Out Time</th>
                          <th className="py-2.5 px-3">Total Hours</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[
                          { date: "07 Aug 2026", shift: "Morning Shift", in: "08:58 AM", out: "05:02 PM", hrs: "8.0 Hrs", status: "Present" },
                          { date: "06 Aug 2026", shift: "Morning Shift", in: "09:12 AM", out: "05:15 PM", hrs: "8.0 Hrs", status: "Late" },
                          { date: "05 Aug 2026", shift: "Morning Shift", in: "08:55 AM", out: "05:00 PM", hrs: "8.0 Hrs", status: "Present" },
                          { date: "04 Aug 2026", shift: "Morning Shift", in: "08:52 AM", out: "05:10 PM", hrs: "8.2 Hrs", status: "Present" },
                          { date: "03 Aug 2026", shift: "Weekly Off", in: "-", out: "-", hrs: "0.0 Hrs", status: "Weekly Off" },
                          { date: "02 Aug 2026", shift: "Morning Shift", in: "09:00 AM", out: "05:00 PM", hrs: "8.0 Hrs", status: "Present" },
                          { date: "01 Aug 2026", shift: "Morning Shift", in: "08:59 AM", out: "05:05 PM", hrs: "8.1 Hrs", status: "Present" },
                          { date: "31 Jul 2026", shift: "Morning Shift", in: "08:56 AM", out: "05:01 PM", hrs: "8.0 Hrs", status: "Present" },
                          { date: "30 Jul 2026", shift: "Morning Shift", in: "09:20 AM", out: "05:30 PM", hrs: "8.1 Hrs", status: "Late" },
                          { date: "29 Jul 2026", shift: "Morning Shift", in: "08:50 AM", out: "05:00 PM", hrs: "8.1 Hrs", status: "Present" },
                          { date: "28 Jul 2026", shift: "Morning Shift", in: "08:54 AM", out: "05:05 PM", hrs: "8.1 Hrs", status: "Present" },
                          { date: "27 Jul 2026", shift: "Weekly Off", in: "-", out: "-", hrs: "0.0 Hrs", status: "Weekly Off" },
                          { date: "26 Jul 2026", shift: "Morning Shift", in: "08:58 AM", out: "05:00 PM", hrs: "8.0 Hrs", status: "Present" },
                          { date: "25 Jul 2026", shift: "Morning Shift", in: "09:02 AM", out: "05:10 PM", hrs: "8.1 Hrs", status: "Present" },
                          { date: "24 Jul 2026", shift: "Morning Shift", in: "08:50 AM", out: "05:00 PM", hrs: "8.1 Hrs", status: "Present" },
                          { date: "23 Jul 2026", shift: "Morning Shift", in: "08:55 AM", out: "05:05 PM", hrs: "8.1 Hrs", status: "Present" },
                          { date: "22 Jul 2026", shift: "Casual Leave", in: "-", out: "-", hrs: "0.0 Hrs", status: "Leave" },
                          { date: "21 Jul 2026", shift: "Morning Shift", in: "08:57 AM", out: "05:00 PM", hrs: "8.0 Hrs", status: "Present" },
                          { date: "20 Jul 2026", shift: "Weekly Off", in: "-", out: "-", hrs: "0.0 Hrs", status: "Weekly Off" },
                          { date: "19 Jul 2026", shift: "Morning Shift", in: "08:52 AM", out: "05:05 PM", hrs: "8.2 Hrs", status: "Present" },
                          { date: "18 Jul 2026", shift: "Morning Shift", in: "08:58 AM", out: "05:00 PM", hrs: "8.0 Hrs", status: "Present" },
                          { date: "17 Jul 2026", shift: "Morning Shift", in: "08:55 AM", out: "05:00 PM", hrs: "8.0 Hrs", status: "Present" },
                          { date: "16 Jul 2026", shift: "Morning Shift", in: "09:00 AM", out: "05:00 PM", hrs: "8.0 Hrs", status: "Present" },
                          { date: "15 Jul 2026", shift: "Morning Shift", in: "08:48 AM", out: "05:00 PM", hrs: "8.2 Hrs", status: "Present" },
                          { date: "14 Jul 2026", shift: "Morning Shift", in: "-", out: "-", hrs: "0.0 Hrs", status: "Absent" },
                          { date: "13 Jul 2026", shift: "Weekly Off", in: "-", out: "-", hrs: "0.0 Hrs", status: "Weekly Off" },
                          { date: "12 Jul 2026", shift: "Morning Shift", in: "08:56 AM", out: "05:02 PM", hrs: "8.1 Hrs", status: "Present" },
                          { date: "11 Jul 2026", shift: "Morning Shift", in: "08:54 AM", out: "05:05 PM", hrs: "8.1 Hrs", status: "Present" },
                          { date: "10 Jul 2026", shift: "Morning Shift", in: "08:58 AM", out: "05:00 PM", hrs: "8.0 Hrs", status: "Present" },
                          { date: "09 Jul 2026", shift: "Morning Shift", in: "08:50 AM", out: "05:00 PM", hrs: "8.1 Hrs", status: "Present" },
                        ]
                          .filter((row) => {
                            if (!attendanceDateQuery.trim()) return true;
                            const q = attendanceDateQuery.toLowerCase().trim();
                            return (
                              row.date.toLowerCase().includes(q) ||
                              row.shift.toLowerCase().includes(q) ||
                              row.status.toLowerCase().includes(q)
                            );
                          })
                          .map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2.5 px-3 font-semibold text-slate-800">{row.date}</td>
                              <td className="py-2.5 px-3 text-slate-600">{row.shift}</td>
                              <td className="py-2.5 px-3 text-slate-700 font-mono">{row.in}</td>
                              <td className="py-2.5 px-3 text-slate-700 font-mono">{row.out}</td>
                              <td className="py-2.5 px-3 text-slate-700 font-medium">{row.hrs}</td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                    row.status === "Present"
                                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                      : row.status === "Late"
                                      ? "bg-amber-100 text-amber-800 border-amber-200"
                                      : row.status === "Absent"
                                      ? "bg-rose-100 text-rose-800 border-rose-200"
                                      : row.status === "Leave"
                                      ? "bg-purple-100 text-purple-800 border-purple-200"
                                      : "bg-slate-100 text-slate-700 border-slate-200"
                                  )}
                                >
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                SECTION 6: TAB 4 - LEAVE MANAGEMENT (Categorized Balances & 2026 History Log)
            ───────────────────────────────────────────────────────────── */}
            {activeTab === "leave" && (
              <div className="space-y-5">
                {/* Categorized Leave Quota Balances (Improvement #8) */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900">Casual Leave (CL)</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        10 Allocated
                      </span>
                    </div>
                    <p className="text-2xl font-black text-blue-900 mt-2">8 Days Left</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">2 days used this year</p>
                  </div>

                  <div className="rounded-2xl border border-rose-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-900">Sick Leave (SL)</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        12 Allocated
                      </span>
                    </div>
                    <p className="text-2xl font-black text-rose-900 mt-2">9 Days Left</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">3 days used this year</p>
                  </div>

                  <div className="rounded-2xl border border-purple-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-900">Earned Leave (EL)</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                        15 Allocated
                      </span>
                    </div>
                    <p className="text-2xl font-black text-purple-900 mt-2">10 Days Left</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">5 days used this year</p>
                  </div>

                  <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900">Compensatory Off</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Earned Rest
                      </span>
                    </div>
                    <p className="text-2xl font-black text-emerald-900 mt-2">2 Days Left</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Available for use</p>
                  </div>
                </div>

                {/* 2026 Comprehensive Leave History Table (Improvement #8) */}
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3 text-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    Year 2026 Complete Leave Application History
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Leave Type</th>
                          <th className="py-2.5 px-3">Date Range</th>
                          <th className="py-2.5 px-3">Days</th>
                          <th className="py-2.5 px-3">Reason</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Approved By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[
                          { type: "Casual Leave (CL)", dates: "10 Aug - 12 Aug 2026", days: "3 Days", reason: "Family commitment", status: "Pending", approvedBy: "Pending HR Review" },
                          { type: "Sick Leave (SL)", dates: "15 Jul 2026", days: "1 Day", reason: "Viral fever recovery", status: "Approved", approvedBy: "Neha Mehta (HR)" },
                          { type: "Earned Leave (EL)", dates: "10 Jun - 14 Jun 2026", days: "5 Days", reason: "Annual family vacation", status: "Approved", approvedBy: "Neha Mehta (HR)" },
                          { type: "Comp Off (COMP)", dates: "02 May 2026", days: "1 Day", reason: "Worked Sunday banquet shift", status: "Approved", approvedBy: "F&B Manager" },
                        ].map((req, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{req.type}</td>
                            <td className="py-2.5 px-3 text-slate-700">{req.dates}</td>
                            <td className="py-2.5 px-3 text-slate-900 font-bold">{req.days}</td>
                            <td className="py-2.5 px-3 text-slate-600 italic">"{req.reason}"</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                  req.status === "Approved"
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                    : "bg-amber-100 text-amber-800 border-amber-200"
                                )}
                              >
                                {req.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 font-medium">{req.approvedBy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                SECTION 7: TAB 5 - PAYROLL (Bank, UAN, PF, ESIC)
            ───────────────────────────────────────────────────────────── */}
            {activeTab === "payroll" && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 text-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <CreditCard className="h-4 w-4 text-purple-600" />
                  Compensation Breakdown &amp; Statutory Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Salary Structure Box */}
                  <div className="space-y-2 rounded-xl border border-slate-200 p-4 bg-slate-50/70">
                    <p className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-2 flex items-center justify-between">
                      <span>Salary Structure</span>
                      <span className="text-emerald-700">Monthly CTC</span>
                    </p>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">Monthly Gross Salary:</span>
                      <span className="font-bold text-emerald-700 text-sm">₹{employee.salary.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">Basic Pay (50%):</span>
                      <span className="font-bold text-slate-800">₹{(employee.salary * 0.5).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">HRA Component (30%):</span>
                      <span className="font-bold text-slate-800">₹{(employee.salary * 0.3).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-600">Special Allowance (20%):</span>
                      <span className="font-bold text-slate-800">₹{(employee.salary * 0.2).toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {/* Bank & Statutory Details Box (Bank, UAN, PF, ESIC) */}
                  <div className="space-y-2 rounded-xl border border-slate-200 p-4 bg-slate-50/70">
                    <p className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-2 flex items-center justify-between">
                      <span>Bank &amp; Statutory Registrations</span>
                      <span className="text-[10px] text-slate-400 font-normal italic">PAN &amp; Bank Required</span>
                    </p>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">Bank Name:</span>
                      <span className="font-bold text-slate-900">{employee.bankName || "HDFC Bank Ltd"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">Account Number (Masked):</span>
                      <span className="font-mono font-bold text-slate-900">{employee.bankAccount ? `•••• ${employee.bankAccount.slice(-4)}` : "•••• •••• 4821"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">IFSC Code:</span>
                      <span className="font-mono font-bold text-slate-900">{employee.ifscCode || "HDFC0001234"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">PAN Number:</span>
                      <span className="font-mono font-bold text-slate-900">{employee.panNumber || "ABCDE1234F"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600 flex items-center gap-1">
                        UAN (PF) Number:
                        <span className="text-[9px] font-normal text-slate-400 italic">(Optional)</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900">{employee.uanNumber || "101293847501"}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-600 flex items-center gap-1">
                        ESIC Registration No:
                        <span className="text-[9px] font-normal text-slate-400 italic">(Optional)</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900">{employee.esicNumber || "31000482910001"}</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ─────────────────────────────────────────────────────────────
                SECTION 8: TAB 6 - CATEGORIZED DOCUMENTS ⭐⭐⭐
            ───────────────────────────────────────────────────────────── */}
            {activeTab === "documents" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Employee Document Vault</h3>
                    <p className="text-xs text-slate-500">Categorized compliance, credentials, and employment agreements.</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setToastMessage("Opening document upload dialog...")}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
                  >
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    Upload Document
                  </Button>
                </div>

                {/* Categorized Document Groups */}
                {[
                  { title: "Identity Proof", docs: CATEGORIZED_DOCUMENTS.filter((d) => d.category === "Identity Proof") },
                  { title: "Education & Qualifications", docs: CATEGORIZED_DOCUMENTS.filter((d) => d.category === "Education") },
                  { title: "Employment & Contracts", docs: CATEGORIZED_DOCUMENTS.filter((d) => d.category === "Employment") },
                  { title: "Financial & Tax", docs: CATEGORIZED_DOCUMENTS.filter((d) => d.category === "Financial") },
                  { title: "Medical Fitness", docs: CATEGORIZED_DOCUMENTS.filter((d) => d.category === "Medical") },
                  { title: "Compliance & Declarations", docs: CATEGORIZED_DOCUMENTS.filter((d) => d.category === "Compliance") },
                ].map((group) => (
                  <section key={group.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3 text-xs">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center justify-between border-b border-slate-100 pb-2">
                      <span>{group.title}</span>
                      <span className="text-[10px] font-semibold text-slate-400">({group.docs.length} items)</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {group.docs.map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => setActiveDocPreview(doc)}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 transition cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 rounded-lg bg-white border border-slate-200 shrink-0 group-hover:border-emerald-300">
                              <FileText className="h-4 w-4 text-emerald-700" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate group-hover:text-emerald-800">{doc.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                <span>{doc.uploadDate || "Pending"}</span>
                                {doc.fileSize && <span>• {doc.fileSize}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {renderDocStatusBadge(doc.status)}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setToastMessage(`Downloading ${doc.name}...`);
                              }}
                              className="p-1 text-slate-500 hover:text-emerald-700 rounded-md"
                              title="Download"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                SECTION 9 & 11: TAB 7 - GRIEVANCES (Status Badges + Empty State)
            ───────────────────────────────────────────────────────────── */}
            {activeTab === "grievances" && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 text-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <MessageSquareWarning className="h-4 w-4 text-rose-600" />
                  Grievances &amp; Complaint History
                </h3>

                {SAMPLE_GRIEVANCES[employee.id]?.length > 0 ? (
                  <div className="space-y-3">
                    {SAMPLE_GRIEVANCES[employee.id].map((ticket) => (
                      <div key={ticket.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{ticket.ticketNo}</span>
                            <span className="text-slate-500">• {ticket.category}</span>
                          </div>
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                              ticket.status === "Open" && "bg-amber-100 text-amber-800 border-amber-300",
                              ticket.status === "Resolved" && "bg-emerald-100 text-emerald-800 border-emerald-300",
                              ticket.status === "Escalated" && "bg-purple-100 text-purple-800 border-purple-300",
                              ticket.status === "Closed" && "bg-slate-100 text-slate-800 border-slate-300"
                            )}
                          >
                            {ticket.status}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800">{ticket.subject}</p>
                        {ticket.resolutionNote && (
                          <p className="text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200">
                            <strong>Note:</strong> {ticket.resolutionNote}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Proper Empty State */
                  <div className="py-12 text-center">
                    <ShieldCheck className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                    <h4 className="font-bold text-sm text-slate-800">No Grievances Found</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {employee.name} has a clean record with no open or past complaint tickets.
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* ─────────────────────────────────────────────────────────────
                SECTION 10: TAB 8 - ACTIVITY LOG (With Filters)
            ───────────────────────────────────────────────────────────── */}
            {activeTab === "activity" && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <History className="h-4 w-4 text-slate-600" />
                    Recent Activity &amp; Audit Trail
                  </h3>

                  {/* Filters Toolbar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Filter className="h-3 w-3 text-slate-400" />
                      <select
                        value={activityCategoryFilter}
                        onChange={(e) => setActivityCategoryFilter(e.target.value)}
                        className="text-xs rounded-lg border border-slate-200 py-1 px-2 bg-slate-50 font-medium"
                      >
                        <option value="ALL">All Categories</option>
                        <option value="Attendance">Attendance</option>
                        <option value="Leave">Leave</option>
                        <option value="Payroll">Payroll</option>
                        <option value="Documents">Documents</option>
                        <option value="Profile">Profile</option>
                      </select>
                    </div>

                    <select
                      value={activityTimeframeFilter}
                      onChange={(e) => setActivityTimeframeFilter(e.target.value)}
                      className="text-xs rounded-lg border border-slate-200 py-1 px-2 bg-slate-50 font-medium"
                    >
                      <option value="ALL">All Time</option>
                      <option value="Today">Today</option>
                      <option value="Yesterday">Yesterday</option>
                      <option value="Last Week">Last Week</option>
                    </select>
                  </div>
                </div>

                {filteredActivities.length === 0 ? (
                  <div className="py-10 text-center text-slate-400">
                    No activity logs match your filter criteria.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredActivities.map((act) => (
                      <div key={act.id} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 shrink-0 mt-0.5">
                          <History className="h-3.5 w-3.5 text-emerald-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-900">{act.description}</span>
                            <span className="text-[10px] text-slate-400 font-mono shrink-0">{act.timestamp}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">
                              {act.category}
                            </span>
                            <span className="text-[11px] text-slate-500">By {act.actor}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        </>
      )}

      {/* ─────────────────────────────────────────────────────────────
          DOCUMENT PREVIEW & VIEWER MODAL
      ───────────────────────────────────────────────────────────── */}
      {activeDocPreview && (
        <Modal
          isOpen={Boolean(activeDocPreview)}
          onClose={() => setActiveDocPreview(null)}
          title={activeDocPreview.name}
          description={`Category: ${activeDocPreview.category} • Uploaded: ${activeDocPreview.uploadDate || "15 Jan 2022"}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            {/* Clean Document Placeholder View (Aadhaar / Passport / Certificate Placeholder) */}
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-10 flex flex-col items-center justify-center text-center min-h-[200px]">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 mb-2">
                <FileText className="h-6 w-6" />
              </div>
              <p className="font-bold text-slate-800 text-sm">{activeDocPreview.name}</p>
              <p className="text-[11px] text-slate-400 font-medium">Document preview placeholder</p>
            </div>

            {/* File Details: Size & Format */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between font-medium text-slate-700">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">File Size</span>
                  <span className="font-mono font-bold text-slate-900">{activeDocPreview.fileSize || "1.8 MB"}</span>
                </div>
                <div className="h-6 w-px bg-slate-200" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Format</span>
                  <span className="font-semibold text-slate-900">PDF Document (.pdf)</span>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {activeDocPreview.status}
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveDocPreview(null)}
                className="rounded-xl text-xs font-semibold"
              >
                Close
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setToastMessage(`Downloading ${activeDocPreview.name}...`);
                  setActiveDocPreview(null);
                }}
                className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 shadow-xs"
              >
                <Download className="h-3.5 w-3.5" /> Download File
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </ModulePageShell>
  );
}
