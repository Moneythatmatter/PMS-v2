"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import {
  AlertTriangle,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  MapPin,
  Box,
  History,
  FileText,
  Lock,
  ShieldCheck,
  Camera,
  Wrench,
  CircleDollarSign,
  Receipt,
  FileSpreadsheet,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { TextInput, SelectInput, FormField, TextAreaInput } from "@/components/frontoffice/ui";
import { OperationsToolbar, OperationsFilterDrawer } from "@/components/housekeeping/OperationsToolbar";

// Mock Data Sets (6 Active Reports, 4 Financial Recovery, 4 Engineering, 3 Insurance, 8 Audit Logs)
const MOCK_ACTIVE_REPORTS = [
  { id: "DMR-401", tag: "AST-TV-305", asset: 'Samsung 55" Smart TV', room: "305", category: "Electronics", severity: "Critical", resp: "Guest", estCost: "₹45,000", status: "Pending Finance", reportedBy: "Meena Kumari", date: "2026-07-20", replCost: "₹45,000", depVal: "₹38,000", billingTrigger: "Instant Folio Charge" },
  { id: "DMR-402", tag: "AST-SOF-412", asset: "Italian Leather Sofa", room: "Suite 412", category: "Furniture", severity: "Major", resp: "Split Recovery", estCost: "₹18,500", status: "Under Review", reportedBy: "Ravi Shankar", date: "2026-07-20", replCost: "₹18,500", depVal: "₹12,000", billingTrigger: "Post Departure Recovery" },
  { id: "DMR-403", tag: "AST-MIR-204", asset: "Vanity Glass Mirror", room: "204", category: "Glass", severity: "Moderate", resp: "Hotel", estCost: "₹3,500", status: "Pending Engineering", reportedBy: "Anita Roy", date: "2026-07-19", replCost: "₹3,500", depVal: "₹2,800", billingTrigger: "Instant Folio Charge" },
  { id: "DMR-404", tag: "AST-LNN-108", asset: "Egyptian Cotton Linen Set", room: "108", category: "Linen", severity: "Minor", resp: "Guest", estCost: "₹1,800", status: "Recovered", reportedBy: "Pooja Verma", date: "2026-07-19", replCost: "₹1,800", depVal: "₹1,500", billingTrigger: "Instant Folio Charge" },
  { id: "DMR-405", tag: "AST-CAR-501", asset: "Woolen Area Carpet", room: "Presidential 501", category: "Flooring", severity: "Critical", resp: "Guest", estCost: "₹65,000", status: "Insurance Claim", reportedBy: "Sanjay Patel", date: "2026-07-18", replCost: "₹65,000", depVal: "₹50,000", billingTrigger: "Post Departure Recovery" },
  { id: "DMR-406", tag: "AST-AC-210", asset: "Split AC Louver Blade", room: "210", category: "Equipment", severity: "Minor", resp: "Natural Wear", estCost: "₹1,200", status: "Closed", reportedBy: "Vikram Singh", date: "2026-07-17", replCost: "₹1,200", depVal: "₹400", billingTrigger: "Instant Folio Charge" },
];

const MOCK_FINANCIAL_RECOVERY = [
  { id: "REC-301", reportId: "DMR-401", guest: "Sarah Chen (Rm 305)", trigger: "Instant Folio Charge", type: "Guest Charged", estCost: "₹45,000", recovered: "₹45,000", outstanding: "₹0", status: "Fully Recovered" },
  { id: "REC-302", reportId: "DMR-402", guest: "Michael Vance (Rm 412)", trigger: "Post Departure Recovery", type: "Split Recovery", estCost: "₹18,500", recovered: "₹12,000", outstanding: "₹6,500", status: "Partially Recovered" },
  { id: "REC-303", reportId: "DMR-404", guest: "Robert Taylor (Rm 108)", trigger: "Instant Folio Charge", type: "Guest Charged", estCost: "₹1,800", recovered: "₹1,800", outstanding: "₹0", status: "Fully Recovered" },
  { id: "REC-304", reportId: "DMR-405", guest: "Alexander Wright (Rm 501)", trigger: "Post Departure Recovery", type: "Insurance Recovery", estCost: "₹65,000", recovered: "₹0", outstanding: "₹65,000", status: "Pending Billing" },
];

const MOCK_ENGINEERING_REPAIRS = [
  { woId: "WO-701", asset: "Vanity Glass Mirror", room: "204", engineer: "Ramesh Sharma", priority: "Medium", status: "In Progress", completion: "2026-07-21" },
  { woId: "WO-702", asset: "Italian Leather Sofa", room: "Suite 412", engineer: "Suresh Gupta", priority: "High", status: "Assigned", completion: "2026-07-22" },
  { woId: "WO-703", asset: "Split AC Louver Blade", room: "210", engineer: "Ramesh Sharma", priority: "Low", status: "Completed", completion: "2026-07-18" },
  { woId: "WO-704", asset: "Samsung 55\" Smart TV", room: "305", engineer: "External Vendor", priority: "Critical", status: "Assigned", completion: "2026-07-23" },
];

const MOCK_INSURANCE_CLAIMS = [
  { claimRef: "CLM-901", policyNo: "POL-77102948", asset: "Woolen Area Carpet (Rm 501)", claimAmt: "₹65,000", approvedAmt: "₹52,000", status: "Under Review" },
  { claimRef: "CLM-902", policyNo: "POL-77102948", asset: "Crystal Chandelier (Lobby)", claimAmt: "₹120,000", approvedAmt: "₹110,000", status: "Approved & Disbursed" },
  { claimRef: "CLM-903", policyNo: "POL-88201944", asset: "Sauna Heater Unit (Spa)", claimAmt: "₹85,000", approvedAmt: "₹0", status: "Filed" },
];

const MOCK_AUDIT_LOGS = [
  { time: "2026-07-20 11:15 AM", user: "Ravi Shankar", action: "Damage Reported", report: "DMR-401", remarks: "Smashed TV screen in Room 305" },
  { time: "2026-07-20 10:30 AM", user: "Meena Kumari", action: "Photos Uploaded", report: "DMR-401", remarks: "3 evidence photos attached" },
  { time: "2026-07-20 09:45 AM", user: "Sanjay Patel", action: "Finance Approved", report: "DMR-404", remarks: "Guest folio charged ₹1,800" },
  { time: "2026-07-19 04:20 PM", user: "Ravi Shankar", action: "Work Order Created", report: "DMR-403", remarks: "WO-701 assigned to Ramesh Sharma" },
  { time: "2026-07-19 02:00 PM", user: "Anita Roy", action: "Severity Updated", report: "DMR-402", remarks: "Updated from Moderate to Major" },
  { time: "2026-07-18 05:10 PM", user: "Sanjay Patel", action: "Insurance Filed", report: "DMR-405", remarks: "Claim CLM-901 submitted under POL-77102948" },
  { time: "2026-07-17 03:00 PM", user: "Vikram Singh", action: "Report Closed", report: "DMR-406", remarks: "AC blade replaced, WO-703 signed off" },
  { time: "2026-07-16 11:30 AM", user: "Pooja Verma", action: "Guest Notified", report: "DMR-404", remarks: "Damage notice sent to guest email" },
];

export default function DamageReportsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const { rooms, staff } = useHousekeeping();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<"active" | "finance" | "engineering" | "insurance" | "reports" | "audit">("active");

  // Filters - Active Reports
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [respFilter, setRespFilter] = useState("All");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (categoryFilter !== "All") count++;
    if (severityFilter !== "All") count++;
    if (statusFilter !== "All") count++;
    if (respFilter !== "All") count++;
    return count;
  }, [categoryFilter, severityFilter, statusFilter, respFilter]);

  // Drawers & Consoles
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  // Form State - Register Damage
  const [title, setTitle] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("305");
  const [areaType, setAreaType] = useState("Guest Room");
  const [reportedByStaff, setReportedByStaff] = useState("Meena Kumari");
  const [shift, setShift] = useState("Morning");
  const [supervisor, setSupervisor] = useState("Ravi Shankar");

  // Asset Info
  const [assetTag, setAssetTag] = useState("AST-TV-305");
  const [assetName, setAssetName] = useState('Samsung 55" Smart TV');
  const [assetCategory, setAssetCategory] = useState("Electronics");
  const [purchaseDate, setPurchaseDate] = useState("2024-03-15");
  const [assetAge, setAssetAge] = useState("2 Years");
  const [replCost, setReplCost] = useState("45000");
  const [depVal, setDepVal] = useState("38000");

  // Assessment
  const [category, setCategory] = useState("Electronics");
  const [severity, setSeverity] = useState("Critical");
  const [responsibility, setResponsibility] = useState("Guest");

  // Split Recovery
  const [guestPct, setGuestPct] = useState("70");
  const [hotelPct, setHotelPct] = useState("30");
  const [vendorPct, setVendorPct] = useState("0");
  const [writeOffPct, setWriteOffPct] = useState("0");

  // Billing Trigger
  const [billingTrigger, setBillingTrigger] = useState<"Instant Folio Charge" | "Post Departure Recovery">("Instant Folio Charge");

  // Engineering Checkbox
  const [reqEngineering, setReqEngineering] = useState(true);
  const [woPriority, setWoPriority] = useState("High");
  const [engineer, setEngineer] = useState("Ramesh Sharma");

  // Insurance Checkbox
  const [reqInsurance, setReqInsurance] = useState(false);
  const [policyNo, setPolicyNo] = useState("POL-77102948");
  const [claimAmt, setClaimAmt] = useState("45000");

  // Photos
  const [damagePhotos, setDamagePhotos] = useState<string[]>(["damage_1.jpg"]);
  const [remarks, setRemarks] = useState("");

  // Toast
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Filtered Reports
  const filteredActiveReports = useMemo(() => {
    return MOCK_ACTIVE_REPORTS.filter((rep) => {
      const matchSearch =
        rep.asset.toLowerCase().includes(search.toLowerCase()) ||
        rep.id.toLowerCase().includes(search.toLowerCase()) ||
        rep.tag.toLowerCase().includes(search.toLowerCase()) ||
        rep.room.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === "All" || rep.category === categoryFilter;
      const matchSev = severityFilter === "All" || rep.severity === severityFilter;
      const matchStatus = statusFilter === "All" || rep.status === statusFilter;
      const matchResp = respFilter === "All" || rep.resp === respFilter;

      return matchSearch && matchCat && matchSev && matchStatus && matchResp;
    });
  }, [search, categoryFilter, severityFilter, statusFilter, respFilter]);

  const handleCreateSubmit = () => {
    if (!title.trim()) return;
    setCreateDrawerOpen(false);
    setTitle("");
    setToast({ message: `Damage Report registered for Room ${selectedRoom}!`, variant: "success" });
  };

  const statusBadges: Record<string, string> = {
    Reported: "bg-slate-100 text-slate-700 border-slate-200",
    "Under Review": "bg-blue-50 text-blue-750 border-blue-200 font-bold",
    "Pending Approval": "bg-amber-50 text-amber-700 border-amber-200 font-bold",
    "Pending Engineering": "bg-purple-50 text-purple-700 border-purple-200 font-bold",
    "Pending Finance": "bg-orange-50 text-orange-700 border-orange-200 font-bold",
    "Awaiting Guest Response": "bg-amber-50 text-amber-700 border-amber-200 font-extrabold animate-pulse",
    "Insurance Claim": "bg-indigo-50 text-indigo-700 border-indigo-200 font-extrabold",
    "Repair Completed": "bg-blue-50 text-blue-800 border-blue-200 font-bold",
    Recovered: "bg-green-50 text-green-900 border-green-200 font-extrabold",
    Closed: "bg-slate-100 text-slate-600 border-slate-200 font-bold",
    Cancelled: "bg-red-50 text-red-700 border-red-200 line-through",
  };

  const severityBadges: Record<string, string> = {
    Critical: "bg-red-50 text-red-700 border-red-200 font-extrabold",
    Major: "bg-orange-50 text-orange-700 border-orange-200 font-bold",
    Moderate: "bg-amber-50 text-amber-700 border-amber-200 font-bold",
    Minor: "bg-slate-100 text-slate-700 border-slate-200",
  };

  if (!isMounted) {
    return (
      <div className="space-y-4 select-none">
        <div className="flex flex-col gap-2 pb-1 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Operations</span>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Damage Reports & Asset Recovery</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 select-none">
      {/* Header */}
      <div className="flex flex-col gap-2 pb-1 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Operations</span>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Damage Reports & Asset Recovery</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCreateDrawerOpen(true)}
            className="!bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white flex items-center justify-center gap-1.5 rounded-xl h-8 px-3.5 text-xs font-bold shrink-0 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Register Damage
          </Button>
        </div>
      </div>

      {/* Toast notifier */}
      {toast && (
        <div className={cn(
          "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl p-3 text-xs font-bold shadow-xl animate-in fade-in slide-in-from-bottom-2",
          toast.variant === "success" ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"
        )}>
          <CheckCircle2 className="h-4 w-4" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top 6 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Open Reports</p>
            <h3 className="text-lg font-extrabold text-slate-800 leading-tight">6 Reports</h3>
          </div>
          <div className="rounded-lg bg-slate-50 p-2 text-slate-600 shrink-0">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Approval</p>
            <h3 className="text-lg font-extrabold text-amber-700 leading-tight">2 Cases</h3>
          </div>
          <div className="rounded-lg bg-amber-50 p-2 text-amber-600 shrink-0">
            <Clock className="h-4 w-4" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Eng.</p>
            <h3 className="text-lg font-extrabold text-purple-700 leading-tight">4 Orders</h3>
          </div>
          <div className="rounded-lg bg-purple-50 p-2 text-purple-600 shrink-0">
            <Wrench className="h-4 w-4" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Finance</p>
            <h3 className="text-lg font-extrabold text-orange-700 leading-tight">2 Folios</h3>
          </div>
          <div className="rounded-lg bg-orange-50 p-2 text-orange-600 shrink-0">
            <Receipt className="h-4 w-4" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Insurance Claims</p>
            <h3 className="text-lg font-extrabold text-indigo-700 leading-tight">3 Claims</h3>
          </div>
          <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 shrink-0">
            <ShieldCheck className="h-4 w-4" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Closed Reports</p>
            <h3 className="text-lg font-extrabold text-emerald-800 leading-tight">14 Reports</h3>
          </div>
          <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700 shrink-0">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Top Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-4 overflow-x-auto scrollbar-none text-xs font-bold uppercase tracking-wider">
          {[
            { id: "active", label: `Active Damage Reports (${MOCK_ACTIVE_REPORTS.length})` },
            { id: "finance", label: `Financial Recovery (${MOCK_FINANCIAL_RECOVERY.length})` },
            { id: "engineering", label: `Engineering Repairs (${MOCK_ENGINEERING_REPAIRS.length})` },
            { id: "insurance", label: `Insurance Claims (${MOCK_INSURANCE_CLAIMS.length})` },
            { id: "reports", label: "Reports" },
            { id: "audit", label: `Operational Audit Logs (${MOCK_AUDIT_LOGS.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "pb-2.5 px-0.5 border-b-2 transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "border-emerald-700 text-emerald-755 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* TAB 1: ACTIVE DAMAGE REPORTS */}
      {activeTab === "active" && (
        <div className="space-y-3">
          {/* Standard Operations Toolbar */}
          <OperationsToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search report ID, asset tag, room, or asset name…"
            activeFilterCount={activeFilterCount}
            onOpenFilters={() => setFilterDrawerOpen(true)}
          />

          {/* Slide-over Filter Drawer */}
          <OperationsFilterDrawer
            open={filterDrawerOpen}
            onClose={() => setFilterDrawerOpen(false)}
            title="Filter Damage Reports"
            activeFilterCount={activeFilterCount}
            onReset={() => {
              setCategoryFilter("All");
              setSeverityFilter("All");
              setRespFilter("All");
              setStatusFilter("All");
            }}
          >
            <div className="space-y-4 select-none">
              <FormField label="Category">
                <SelectInput
                  value={categoryFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryFilter(e.target.value)}
                  className="w-full text-xs rounded-xl h-9 bg-white"
                >
                  <option value="All">All Categories</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Glass">Glass</option>
                  <option value="Linen">Linen</option>
                  <option value="Flooring">Flooring</option>
                  <option value="Equipment">Equipment</option>
                </SelectInput>
              </FormField>

              <FormField label="Severity">
                <SelectInput
                  value={severityFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSeverityFilter(e.target.value)}
                  className="w-full text-xs rounded-xl h-9 bg-white"
                >
                  <option value="All">All Severities</option>
                  <option value="Critical">Critical</option>
                  <option value="Major">Major</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Minor">Minor</option>
                </SelectInput>
              </FormField>

              <FormField label="Responsibility">
                <SelectInput
                  value={respFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRespFilter(e.target.value)}
                  className="w-full text-xs rounded-xl h-9 bg-white"
                >
                  <option value="All">All Responsibilities</option>
                  <option value="Guest">Guest</option>
                  <option value="Hotel">Hotel</option>
                  <option value="Natural Wear">Natural Wear</option>
                  <option value="Split Recovery">Split Recovery</option>
                </SelectInput>
              </FormField>

              <FormField label="Status">
                <SelectInput
                  value={statusFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
                  className="w-full text-xs rounded-xl h-9 bg-white"
                >
                  <option value="All">All Statuses</option>
                  <option value="Reported">Reported</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Pending Finance">Pending Finance</option>
                  <option value="Pending Engineering">Pending Engineering</option>
                  <option value="Insurance Claim">Insurance Claim</option>
                  <option value="Recovered">Recovered</option>
                  <option value="Closed">Closed</option>
                </SelectInput>
              </FormField>
            </div>
          </OperationsFilterDrawer>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 bg-slate-50 z-10">
                  <th className="px-3 py-2.5">Report ID</th>
                  <th className="px-3 py-2.5">Asset Tag</th>
                  <th className="px-3 py-2.5">Asset Name</th>
                  <th className="px-3 py-2.5">Room / Area</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5">Severity</th>
                  <th className="px-3 py-2.5">Responsibility</th>
                  <th className="px-3 py-2.5 text-right">Est. Cost</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="px-3 py-2.5">Reported By</th>
                  <th className="px-3 py-2.5 text-right w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredActiveReports.map((rep) => (
                  <tr
                    key={rep.id}
                    onClick={() => setSelectedReport(rep)}
                    className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2.5 font-extrabold text-emerald-800 text-[11px]">{rep.id}</td>
                    <td className="px-3 py-2.5 font-mono text-[10.5px] text-slate-500">{rep.tag}</td>
                    <td className="px-3 py-2.5">
                      <span className="font-extrabold text-slate-800 block">{rep.asset}</span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-800">Room {rep.room}</td>
                    <td className="px-3 py-2.5 text-slate-600">{rep.category}</td>
                    <td className="px-3 py-2.5">
                      <span className={cn("rounded px-1.5 py-0.5 text-[8.5px] border uppercase", severityBadges[rep.severity])}>
                        {rep.severity}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-800 font-bold">{rep.resp}</td>
                    <td className="px-3 py-2.5 text-right font-extrabold text-slate-900">{rep.estCost}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn("rounded-full px-2 py-0.5 text-[8.5px] border font-bold uppercase whitespace-nowrap w-28 inline-block text-center", statusBadges[rep.status])}>
                        {rep.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{rep.reportedBy}</td>
                    <td className="px-3 py-2.5 text-right">
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReport(rep);
                        }}
                        className="h-6 px-1.5 text-[9.5px] font-bold !bg-slate-100 hover:!bg-slate-200 !text-slate-750 !border-slate-200 rounded-md"
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: FINANCIAL RECOVERY */}
      {activeTab === "finance" && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 bg-slate-50 z-10">
                  <th className="px-3 py-2.5">Recovery ID</th>
                  <th className="px-3 py-2.5">Report ID</th>
                  <th className="px-3 py-2.5">Guest & Room</th>
                  <th className="px-3 py-2.5">Billing Trigger</th>
                  <th className="px-3 py-2.5">Recovery Type</th>
                  <th className="px-3 py-2.5 text-right">Est. Cost</th>
                  <th className="px-3 py-2.5 text-right">Recovered</th>
                  <th className="px-3 py-2.5 text-right">Outstanding</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {MOCK_FINANCIAL_RECOVERY.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 text-[11px] font-extrabold text-emerald-800">{rec.id}</td>
                    <td className="px-3 py-2.5 font-mono text-[10.5px] text-slate-500">{rec.reportId}</td>
                    <td className="px-3 py-2.5 font-extrabold text-slate-800">{rec.guest}</td>
                    <td className="px-3 py-2.5 text-slate-600 font-bold">{rec.trigger}</td>
                    <td className="px-3 py-2.5 text-slate-700">{rec.type}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-700">{rec.estCost}</td>
                    <td className="px-3 py-2.5 text-right font-extrabold text-emerald-800">{rec.recovered}</td>
                    <td className="px-3 py-2.5 text-right font-extrabold text-red-700">{rec.outstanding}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[8.5px] border font-bold uppercase w-28 inline-block text-center",
                        rec.status === "Fully Recovered" ? "bg-green-50 text-green-900 border-green-200" :
                        rec.status === "Partially Recovered" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-orange-50 text-orange-700 border-orange-200"
                      )}>
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ENGINEERING REPAIRS */}
      {activeTab === "engineering" && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 bg-slate-50 z-10">
                  <th className="px-3 py-2.5">Work Order</th>
                  <th className="px-3 py-2.5">Asset Name</th>
                  <th className="px-3 py-2.5">Room / Area</th>
                  <th className="px-3 py-2.5">Assigned Engineer</th>
                  <th className="px-3 py-2.5">Priority</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="px-3 py-2.5">Completion Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {MOCK_ENGINEERING_REPAIRS.map((wo) => (
                  <tr key={wo.woId} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 font-extrabold text-purple-800 text-[11px]">{wo.woId}</td>
                    <td className="px-3 py-2.5 font-extrabold text-slate-800">{wo.asset}</td>
                    <td className="px-3 py-2.5 text-slate-800">Room {wo.room}</td>
                    <td className="px-3 py-2.5 text-slate-700">{wo.engineer}</td>
                    <td className="px-3 py-2.5">
                      <span className={cn(
                        "rounded px-1.5 py-0.5 text-[8.5px] border font-extrabold uppercase",
                        wo.priority === "Critical" || wo.priority === "High" ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-100 text-slate-700 border-slate-200"
                      )}>
                        {wo.priority}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[8.5px] border font-bold uppercase w-24 inline-block text-center",
                        wo.status === "Completed" ? "bg-green-50 text-green-900 border-green-200" : "bg-purple-50 text-purple-700 border-purple-200"
                      )}>
                        {wo.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{wo.completion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: INSURANCE CLAIMS */}
      {activeTab === "insurance" && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 bg-slate-50 z-10">
                  <th className="px-3 py-2.5">Claim Reference</th>
                  <th className="px-3 py-2.5">Policy Number</th>
                  <th className="px-3 py-2.5">Damaged Asset</th>
                  <th className="px-3 py-2.5 text-right">Claim Amount</th>
                  <th className="px-3 py-2.5 text-right">Approved Amount</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {MOCK_INSURANCE_CLAIMS.map((clm) => (
                  <tr key={clm.claimRef} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 font-extrabold text-indigo-800 text-[11px]">{clm.claimRef}</td>
                    <td className="px-3 py-2.5 font-mono text-[10.5px] text-slate-500">{clm.policyNo}</td>
                    <td className="px-3 py-2.5 font-extrabold text-slate-800">{clm.asset}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-800">{clm.claimAmt}</td>
                    <td className="px-3 py-2.5 text-right font-extrabold text-emerald-800">{clm.approvedAmt}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[8.5px] border font-bold uppercase w-28 inline-block text-center",
                        clm.status.includes("Approved") ? "bg-green-50 text-green-900 border-green-200" : "bg-indigo-50 text-indigo-700 border-indigo-200"
                      )}>
                        {clm.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: REPORTS */}
      {activeTab === "reports" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { title: "Damage Summary Report", desc: "Overview of all asset damages and breakdown by category.", icon: FileText },
              { title: "Room Damage Report", desc: "Room-wise damage history and guest impact ledgers.", icon: AlertTriangle },
              { title: "Guest Recovery Ledger", desc: "Folio charges and post-departure recovery tracking.", icon: Receipt },
              { title: "Engineering Repairs Audit", desc: "Repair work order costs and completion timelines.", icon: Wrench },
              { title: "Insurance Recovery Report", desc: "Policy claims filed, approved amounts, and disbursements.", icon: ShieldCheck },
              { title: "Asset Damage Trends", desc: "Depreciation factors and frequent damage categories.", icon: FileSpreadsheet },
            ].map((rep, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-xs">{rep.title}</h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-tight">{rep.desc}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 text-slate-600 shrink-0">
                    <rep.icon className="h-4 w-4" />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="text-[9.5px] font-bold text-emerald-755">Ready</span>
                  <Button variant="outline" className="h-6 px-2 text-[9.5px] font-bold !bg-slate-100 hover:!bg-slate-200 !text-slate-750 !border-slate-200 rounded-md">
                    Export
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT LOGS */}
      {activeTab === "audit" && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 bg-slate-50 z-10">
                  <th className="px-3 py-2.5">Timestamp</th>
                  <th className="px-3 py-2.5">User</th>
                  <th className="px-3 py-2.5">Action</th>
                  <th className="px-3 py-2.5">Report ID</th>
                  <th className="px-3 py-2.5 text-right">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[10.5px] text-slate-700">
                {MOCK_AUDIT_LOGS.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap">{log.time}</td>
                    <td className="px-3 py-2.5 text-slate-900 font-sans font-bold">{log.user}</td>
                    <td className="px-3 py-2.5 font-bold text-slate-900">{log.action}</td>
                    <td className="px-3 py-2.5 text-emerald-805 font-bold">{log.report}</td>
                    <td className="px-3 py-2.5 text-right text-slate-500 font-sans">{log.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONSOLE DRAWER */}
      <Drawer
        open={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title={`${selectedReport?.id || "Report"} Details Console`}
        width="lg"
      >
        {selectedReport && (
          <div className="flex flex-col h-full bg-slate-50/30 select-none">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              
              <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs space-y-2.5">
                <h4 className="font-bold text-slate-855 text-[11px] uppercase tracking-wider border-b border-slate-50 pb-1 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-orange-600" /> Damage Overview
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-semibold text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Asset Name</span>
                    <span className="text-slate-900 font-extrabold text-[12px]">{selectedReport.asset}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Asset Tag ID</span>
                    <span className="text-slate-900 font-mono text-[10.5px] font-extrabold">{selectedReport.tag}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Room / Area</span>
                    <span className="text-slate-800">Room {selectedReport.room}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Severity</span>
                    <span className={cn("rounded px-1.5 py-0.5 text-[8.5px] border uppercase", severityBadges[selectedReport.severity])}>
                      {selectedReport.severity}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Replacement Cost</span>
                    <span className="text-slate-900 font-bold">{selectedReport.replCost}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Depreciated Value</span>
                    <span className="text-slate-700 font-bold">{selectedReport.depVal}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Billing Trigger</span>
                    <span className="text-emerald-800 font-bold">{selectedReport.billingTrigger}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Status</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[8.5px] border uppercase font-bold", statusBadges[selectedReport.status])}>
                      {selectedReport.status}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-3 flex gap-2 shadow-lg">
              <Button
                variant="outline"
                onClick={() => setSelectedReport(null)}
                className="w-full !bg-slate-100 hover:!bg-slate-200 !text-slate-700 !border-slate-205 flex items-center justify-center text-xs py-2 px-3 font-bold rounded-xl transition-all h-9"
              >
                Close Console
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* DRAWER: REGISTER DAMAGE */}
      <Drawer open={createDrawerOpen} onClose={() => setCreateDrawerOpen(false)} title="Register Damage Report" width="lg">
        <div className="space-y-4 select-none">
          
          {/* SECTION 1: BASIC DETAILS */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 border-b border-slate-100 pb-1">Basic Details</h4>
            
            <FormField label="Damage Title" required>
              <TextInput
                placeholder="e.g. Smashed TV Screen in Room 305"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Room / Area" required>
                <TextInput
                  placeholder="e.g. 305 or Lobby"
                  value={selectedRoom}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedRoom(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </FormField>

              <FormField label="Area Type" required>
                <SelectInput
                  value={areaType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAreaType(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-white text-slate-700 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 select-none"
                >
                  <option value="Guest Room">Guest Room</option>
                  <option value="Suite">Suite</option>
                  <option value="Public Area">Public Area</option>
                  <option value="Linen Room">Linen Room</option>
                </SelectInput>
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField label="Reported By" required>
                <SelectInput
                  value={reportedByStaff}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReportedByStaff(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-white text-slate-700 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 select-none"
                >
                  <option value="Meena Kumari">Meena Kumari</option>
                  <option value="Ravi Shankar">Ravi Shankar</option>
                  <option value="Anita Roy">Anita Roy</option>
                </SelectInput>
              </FormField>

              <FormField label="Shift" required>
                <SelectInput
                  value={shift}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setShift(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-white text-slate-700 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 select-none"
                >
                  <option value="Morning">Morning Shift</option>
                  <option value="Evening">Evening Shift</option>
                  <option value="Night">Night Shift</option>
                </SelectInput>
              </FormField>

              <FormField label="Supervisor" required>
                <SelectInput
                  value={supervisor}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSupervisor(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-white text-slate-700 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 select-none"
                >
                  <option value="Ravi Shankar">Ravi Shankar</option>
                  <option value="Sanjay Patel">Sanjay Patel</option>
                </SelectInput>
              </FormField>
            </div>
          </div>

          {/* SECTION 2: ASSET INFORMATION */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 border-b border-slate-100 pb-1">Asset Information</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Asset Tag ID" required>
                <TextInput
                  value={assetTag}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAssetTag(e.target.value)}
                  className="h-9 text-xs rounded-xl font-mono"
                />
              </FormField>

              <FormField label="Asset Name" required>
                <TextInput
                  value={assetName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAssetName(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Replacement Cost (₹)" required>
                <TextInput
                  value={replCost}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReplCost(e.target.value)}
                  className="h-9 text-xs rounded-xl font-bold"
                />
              </FormField>

              <FormField label="Depreciated Value (₹)" required>
                <TextInput
                  value={depVal}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepVal(e.target.value)}
                  className="h-9 text-xs rounded-xl font-bold"
                />
              </FormField>
            </div>
          </div>

          {/* SECTION 3: DAMAGE ASSESSMENT */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 border-b border-slate-100 pb-1">Damage Assessment</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField label="Category" required>
                <SelectInput
                  value={category}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-white text-slate-700 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 select-none"
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Bathroom">Bathroom</option>
                  <option value="Walls">Walls</option>
                  <option value="Flooring">Flooring</option>
                  <option value="Linen">Linen</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Glass">Glass</option>
                  <option value="Decor">Decor</option>
                  <option value="Other">Other</option>
                </SelectInput>
              </FormField>

              <FormField label="Severity" required>
                <SelectInput
                  value={severity}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSeverity(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-white text-slate-700 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 select-none"
                >
                  <option value="Critical">Critical</option>
                  <option value="Major">Major</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Minor">Minor</option>
                </SelectInput>
              </FormField>

              <FormField label="Responsibility" required>
                <SelectInput
                  value={responsibility}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setResponsibility(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-white text-slate-700 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 select-none"
                >
                  <option value="Guest">Guest</option>
                  <option value="Hotel">Hotel</option>
                  <option value="Natural Wear">Natural Wear</option>
                  <option value="Vendor">Vendor</option>
                  <option value="Split Recovery">Split Recovery</option>
                </SelectInput>
              </FormField>
            </div>

            {/* SPLIT RECOVERY SECTION */}
            {responsibility === "Split Recovery" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 space-y-2">
                <h5 className="text-[10px] font-extrabold uppercase text-amber-800">Split Recovery Allocation (%)</h5>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-slate-600 block">Guest %</span>
                    <TextInput value={guestPct} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGuestPct(e.target.value)} className="h-7 text-xs rounded-lg text-center" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-600 block">Hotel %</span>
                    <TextInput value={hotelPct} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHotelPct(e.target.value)} className="h-7 text-xs rounded-lg text-center" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-600 block">Vendor %</span>
                    <TextInput value={vendorPct} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVendorPct(e.target.value)} className="h-7 text-xs rounded-lg text-center" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-600 block">Write-Off %</span>
                    <TextInput value={writeOffPct} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWriteOffPct(e.target.value)} className="h-7 text-xs rounded-lg text-center" />
                  </div>
                </div>
                <p className="text-[9px] text-amber-700 font-bold">✓ Total recovery allocation visually equals 100%.</p>
              </div>
            )}
          </div>

          {/* SECTION 4: CHECKOUT RECOVERY (BILLING TRIGGER) */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 border-b border-slate-100 pb-1">Billing Trigger</h4>
            
            <FormField label="Recovery Billing Trigger" required>
              <SelectInput
                value={billingTrigger}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBillingTrigger(e.target.value as any)}
                className="h-9 text-xs rounded-xl bg-white text-slate-700 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 select-none"
              >
                <option value="Instant Folio Charge">Instant Folio Charge</option>
                <option value="Post Departure Recovery">Post Departure Recovery</option>
              </SelectInput>
            </FormField>

            <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-[10px] text-slate-600">
              {billingTrigger === "Instant Folio Charge" ? (
                <p>🟢 <strong className="font-bold text-emerald-700">Instant Folio Charge:</strong> Guest is currently checked in. Charge guest folio immediately before checkout.</p>
              ) : (
                <p>🟠 <strong className="font-bold text-amber-700">Post Departure Recovery:</strong> Guest already checked out. Recover using stored credit card pre-auth or late folio billing.</p>
              )}
            </div>
          </div>

          {/* SECTION 5: FINANCIAL APPROVAL MATRIX CARD */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5">
            <h4 className="font-extrabold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-700" /> Financial Approval Matrix (Read-Only)
            </h4>
            <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-600 font-semibold border-t border-slate-200 pt-1.5">
              <div>
                <span className="block text-slate-400 font-bold">Below ₹2,000</span>
                <span className="text-slate-800 font-extrabold">Supervisor</span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold">₹2,000–₹25,000</span>
                <span className="text-slate-800 font-extrabold">Exec. Housekeeper</span>
              </div>
              <div>
                <span className="block text-slate-400 font-bold">Above ₹25,000</span>
                <span className="text-slate-800 font-extrabold">GM + Finance</span>
              </div>
            </div>
          </div>

          {/* SECTION 6: ENGINEERING SECTION */}
          <div className="space-y-2.5 border-t border-slate-100 pt-3">
            <label className="flex items-center gap-2 text-xs font-extrabold text-purple-800 cursor-pointer">
              <input
                type="checkbox"
                checked={reqEngineering}
                onChange={(e) => setReqEngineering(e.target.checked)}
                className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
              />
              <Wrench className="h-4 w-4 text-purple-600" /> Requires Engineering Repair Work Order
            </label>

            {reqEngineering && (
              <div className="space-y-2 rounded-xl border border-purple-200 bg-purple-50/30 p-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Assigned Engineer">
                    <SelectInput
                      value={engineer}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEngineer(e.target.value)}
                      className="h-8 text-xs rounded-xl bg-white"
                    >
                      <option value="Ramesh Sharma">Ramesh Sharma</option>
                      <option value="Suresh Gupta">Suresh Gupta</option>
                      <option value="External Vendor">External Vendor</option>
                    </SelectInput>
                  </FormField>

                  <FormField label="Repair Priority">
                    <SelectInput
                      value={woPriority}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setWoPriority(e.target.value)}
                      className="h-8 text-xs rounded-xl bg-white"
                    >
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                      <option value="Medium">Medium</option>
                    </SelectInput>
                  </FormField>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 7: INSURANCE SECTION */}
          <div className="space-y-2.5 border-t border-slate-100 pt-3">
            <label className="flex items-center gap-2 text-xs font-extrabold text-indigo-800 cursor-pointer">
              <input
                type="checkbox"
                checked={reqInsurance}
                onChange={(e) => setReqInsurance(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <ShieldCheck className="h-4 w-4 text-indigo-600" /> Insurance Claim Required
            </label>

            {reqInsurance && (
              <div className="space-y-2 rounded-xl border border-indigo-200 bg-indigo-50/30 p-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Policy Number">
                    <TextInput value={policyNo} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPolicyNo(e.target.value)} className="h-8 text-xs rounded-xl font-mono" />
                  </FormField>
                  <FormField label="Claim Amount (₹)">
                    <TextInput value={claimAmt} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClaimAmt(e.target.value)} className="h-8 text-xs rounded-xl font-bold" />
                  </FormField>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 8: PHOTO EVIDENCE */}
          <div className="space-y-2.5 border-t border-slate-100 pt-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 border-b border-slate-100 pb-1">Photo Evidence</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-center space-y-1 cursor-pointer hover:bg-slate-100/60 transition-colors">
                <Camera className="h-5 w-5 mx-auto text-slate-400" />
                <p className="text-[10px] font-bold text-slate-700">Damage Photo</p>
                <p className="text-[9px] text-emerald-700 font-extrabold">✓ 1 Photo Attached</p>
              </div>

              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-center space-y-1 cursor-pointer hover:bg-slate-100/60 transition-colors">
                <Camera className="h-5 w-5 mx-auto text-slate-400" />
                <p className="text-[10px] font-bold text-slate-700">Repair Photo</p>
                <p className="text-[9px] text-slate-400 font-semibold">Upload Photo</p>
              </div>
            </div>
            <p className="text-[9.5px] text-slate-500 font-bold">ℹ Minimum one damage photo is recommended before submitting.</p>
          </div>

          <Button
            onClick={handleCreateSubmit}
            className="w-full !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white font-bold rounded-xl shadow-xs h-11 text-xs transition-all mt-4"
          >
            Register Damage Report
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
