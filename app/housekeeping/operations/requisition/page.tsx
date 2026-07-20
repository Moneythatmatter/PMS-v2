"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import {
  Layers,
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
  Wrench,
  CircleDollarSign,
  Receipt,
  FileSpreadsheet,
  Info,
  Tag,
  ArrowRight,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { TextInput, SelectInput, FormField, TextAreaInput } from "@/components/frontoffice/ui";
import { OperationsToolbar, OperationsFilterDrawer } from "@/components/housekeeping/OperationsToolbar";

// Mock Data Sets (6 Active Requisitions, 4 Backorders, 5 Issue Tracking, 8 Stock Availability, 8 Audit Logs)
const MOCK_ACTIVE_REQUISITIONS = [
  { id: "REQ-901", dept: "Housekeeping", costCenter: "CC-HK-GUEST", requestedBy: "Meena Kumari", priority: "High", type: "Standard", items: "Hermes Herbal Soap (x50)", value: "₹14,500", appStatus: "Approved", issueStatus: "Partially Issued", date: "2026-07-20" },
  { id: "REQ-902", dept: "Housekeeping", costCenter: "CC-HK-LINEN", requestedBy: "Ravi Shankar", priority: "Emergency", type: "Emergency Fast Track", items: "King Bed Sheets 300TC (x30)", value: "₹28,000", appStatus: "Approved", issueStatus: "Backordered", date: "2026-07-20" },
  { id: "REQ-903", dept: "Food & Beverage", costCenter: "CC-FB-REST", requestedBy: "Anita Roy", priority: "Medium", type: "Standard", items: "Cloth Napkins White (x100)", value: "₹8,500", appStatus: "Pending Approval", issueStatus: "Pending Store Issue", date: "2026-07-19" },
  { id: "REQ-904", dept: "Housekeeping", costCenter: "CC-HK-CHEM", requestedBy: "Vikram Singh", priority: "High", type: "Standard", items: "Taski R2 Cleaner (x10L)", value: "₹4,200", appStatus: "Submitted", issueStatus: "Pending Store Issue", date: "2026-07-19" },
  { id: "REQ-905", dept: "Front Office", costCenter: "CC-FO-AMEN", requestedBy: "Pooja Verma", priority: "Low", type: "Standard", items: "Welcome Key Cards (x500)", value: "₹6,000", appStatus: "Approved", issueStatus: "Issued", date: "2026-07-18" },
  { id: "REQ-906", dept: "Housekeeping", costCenter: "CC-HK-GUEST", requestedBy: "Sanjay Patel", priority: "Emergency", type: "Emergency Fast Track", items: "Dental Kits & Shaving Kits (x100)", value: "₹9,800", appStatus: "Approved", issueStatus: "Issued", date: "2026-07-18" },
];

const MOCK_BACKORDERS = [
  { reqId: "REQ-902", item: "King Bed Sheets 300TC", requestedQty: 50, issuedQty: 30, backorderQty: 20, restockDate: "2026-07-24", status: "Backordered" },
  { reqId: "REQ-901", item: "Hermes Herbal Soap (20g)", requestedQty: 100, issuedQty: 75, backorderQty: 25, restockDate: "2026-07-22", status: "Backordered" },
  { reqId: "REQ-898", item: "Bath Towels Plush White", requestedQty: 40, issuedQty: 25, backorderQty: 15, restockDate: "2026-07-23", status: "Backordered" },
  { reqId: "REQ-895", item: "Taski TR103 Carpet Shampoo", requestedQty: 15, issuedQty: 5, backorderQty: 10, restockDate: "2026-07-25", status: "Backordered" },
];

const MOCK_ISSUE_TRACKING = [
  { issueNo: "ISS-401", reqId: "REQ-901", issuedBy: "Ramesh Storekeeper", date: "2026-07-20", issuedQty: "75 Pcs", pendingQty: "25 Pcs", status: "Partial Issue" },
  { issueNo: "ISS-402", reqId: "REQ-905", issuedBy: "Ramesh Storekeeper", date: "2026-07-18", issuedQty: "500 Pcs", pendingQty: "0 Pcs", status: "Full Issue" },
  { issueNo: "ISS-403", reqId: "REQ-906", issuedBy: "Suresh Storekeeper", date: "2026-07-18", issuedQty: "100 Pcs", pendingQty: "0 Pcs", status: "Full Issue" },
  { issueNo: "ISS-404", reqId: "REQ-902", issuedBy: "Ramesh Storekeeper", date: "2026-07-20", issuedQty: "30 Pcs", pendingQty: "20 Pcs", status: "Partial Issue" },
  { issueNo: "ISS-405", reqId: "REQ-890", issuedBy: "Suresh Storekeeper", date: "2026-07-17", issuedQty: "10 L", pendingQty: "0 Pcs", status: "Full Issue" },
];

const MOCK_STOCK_AVAILABILITY = [
  { item: "Hermes Herbal Soap (20g)", category: "Amenity", stock: 250, reserved: 50, available: 200, reorder: 100, status: "In Stock" },
  { item: "King Bed Sheets 300TC", category: "Linen", stock: 30, reserved: 30, available: 0, reorder: 50, status: "Out of Stock" },
  { item: "Taski R2 All-Purpose Cleaner", category: "Chemical", stock: 45, reserved: 10, available: 35, reorder: 20, status: "In Stock" },
  { item: "Taski TR103 Carpet Shampoo", category: "Chemical", stock: 5, reserved: 5, available: 0, reorder: 15, status: "Out of Stock" },
  { item: "Dental Kit Luxury Box", category: "Amenity", stock: 180, reserved: 20, available: 160, reorder: 80, status: "In Stock" },
  { item: "Bath Towel Plush 600GSM", category: "Linen", stock: 25, reserved: 15, available: 10, reorder: 40, status: "Low Stock" },
  { item: "Suma Degreaser D3 Canister", category: "Chemical", stock: 16, reserved: 4, available: 12, reorder: 10, status: "In Stock" },
  { item: "Slippers Velvet Closed-Toe", category: "Amenity", stock: 0, reserved: 0, available: 0, reorder: 100, status: "Out of Stock" },
];

const MOCK_AUDIT_LOGS = [
  { time: "2026-07-20 11:30 AM", user: "Ravi Shankar", action: "Emergency Fast Track Triggered", req: "REQ-902", remarks: "Fast track dispatch requested for 300TC Bed Sheets" },
  { time: "2026-07-20 10:15 AM", user: "Meena Kumari", action: "Requisition Created", req: "REQ-901", remarks: "Hermes Herbal Soap 50 Pcs requested under CC-HK-GUEST" },
  { time: "2026-07-20 09:45 AM", user: "Ramesh Storekeeper", action: "Partial Issue Created", req: "REQ-901", remarks: "75 Pcs issued, 25 Pcs added to Backorders" },
  { time: "2026-07-19 04:20 PM", user: "Sanjay Patel", action: "Supervisor Approved", req: "REQ-903", remarks: "Approved for F&B Restaurant Napkins" },
  { time: "2026-07-18 05:10 PM", user: "Pooja Verma", action: "PIN Verified Receipt", req: "REQ-905", remarks: "500 Key cards received with digital signature" },
  { time: "2026-07-18 02:00 PM", user: "Suresh Storekeeper", action: "Full Issue Completed", req: "REQ-906", remarks: "100 Dental kits issued under REQ-906" },
  { time: "2026-07-17 11:30 AM", user: "Ramesh Storekeeper", action: "Backorder Restocked", req: "REQ-890", remarks: "Restock items delivered by general stores" },
  { time: "2026-07-16 03:00 PM", user: "Anita Roy", action: "Requisition Closed", req: "REQ-885", remarks: "Requisition fulfilled and archived" },
];

export default function RequisitionsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const { requisitions } = useHousekeeping();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<"active" | "backorders" | "issue" | "stock" | "reports" | "audit">("active");

  // Filters - Active Requisitions
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (deptFilter !== "All") count++;
    if (priorityFilter !== "All") count++;
    if (typeFilter !== "All") count++;
    if (statusFilter !== "All") count++;
    return count;
  }, [deptFilter, priorityFilter, typeFilter, statusFilter]);

  // Drawers & Consoles
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<any | null>(null);

  // Form State - Register Requisition
  const [reqNo, setReqNo] = useState("REQ-907");
  const [dept, setDept] = useState("Housekeeping");
  const [requestedByStaff, setRequestedByStaff] = useState("Meena Kumari");
  const [reqDate, setReqDate] = useState("2026-07-20");
  const [requiredDate, setRequiredDate] = useState("2026-07-21");
  const [priority, setPriority] = useState("High");
  const [purpose, setPurpose] = useState("Guest Room Supplies Replenishment");
  const [costCenterCode, setCostCenterCode] = useState("CC-HK-GUEST");
  const [reqType, setReqType] = useState<"Standard" | "Emergency Fast Track">("Standard");

  // Requisition Items List (Editable Table)
  const [reqItemsList, setReqItemsList] = useState([
    { item: "Hermes Herbal Soap (20g)", category: "Amenity", unit: "Pcs", reqQty: "50", availQty: "200", issuedQty: "30", backorderQty: "20", cost: "₹14,500", remarks: "Standard room refill" },
  ]);

  // Receiving Form State
  const [receivedBy, setReceivedBy] = useState("Meena Kumari");
  const [staffPin, setStaffPin] = useState("4921");
  const [hasSignature, setHasSignature] = useState(true);

  // Remarks
  const [reqRemarks, setReqRemarks] = useState("");

  // Toast
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Filtered Requisitions
  const filteredActiveRequisitions = useMemo(() => {
    return MOCK_ACTIVE_REQUISITIONS.filter((req) => {
      const matchSearch =
        req.id.toLowerCase().includes(search.toLowerCase()) ||
        req.dept.toLowerCase().includes(search.toLowerCase()) ||
        req.costCenter.toLowerCase().includes(search.toLowerCase()) ||
        req.items.toLowerCase().includes(search.toLowerCase()) ||
        req.requestedBy.toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === "All" || req.dept === deptFilter;
      const matchPriority = priorityFilter === "All" || req.priority === priorityFilter;
      const matchStatus = statusFilter === "All" || req.appStatus === statusFilter;
      const matchType = typeFilter === "All" || req.type === typeFilter;

      return matchSearch && matchDept && matchPriority && matchStatus && matchType;
    });
  }, [search, deptFilter, priorityFilter, statusFilter, typeFilter]);

  const handleCreateSubmit = () => {
    setCreateDrawerOpen(false);
    setToast({ message: `Requisition ${reqNo} submitted successfully!`, variant: "success" });
  };

  const statusBadges: Record<string, string> = {
    Approved: "bg-[#E6F4ED] text-[#0F8A5F] border-[#B8E2D0] font-extrabold",
    "Pending Approval": "bg-amber-50 text-amber-700 border-amber-200 font-bold",
    Submitted: "bg-blue-50 text-blue-750 border-blue-200 font-bold",
    Draft: "bg-slate-100 text-slate-700 border-slate-200",
    Rejected: "bg-red-50 text-red-700 border-red-200 font-extrabold",
  };

  const issueStatusBadges: Record<string, string> = {
    Issued: "bg-[#E6F4ED] text-[#0F8A5F] border-[#B8E2D0] font-extrabold",
    "Partially Issued": "bg-purple-50 text-purple-700 border-purple-200 font-bold",
    Backordered: "bg-red-50 text-red-700 border-red-200 font-extrabold animate-pulse",
    "Pending Store Issue": "bg-amber-50 text-amber-700 border-amber-200 font-bold",
  };

  if (!isMounted) {
    return (
      <div className="space-y-4 select-none">
        <div className="flex flex-col gap-2 pb-1 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Operations</span>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Material & Supply Requisitions</h1>
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
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Material & Supply Requisitions</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCreateDrawerOpen(true)}
            className="!bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white flex items-center justify-center gap-1.5 rounded-xl h-8 px-3.5 text-xs font-bold shrink-0 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" /> New Requisition
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
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Requests</p>
            <h3 className="text-lg font-extrabold text-slate-800 leading-tight">6 Requests</h3>
          </div>
          <div className="rounded-lg bg-slate-50 p-2 text-slate-600 shrink-0">
            <Clock className="h-4 w-4" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Approved Today</p>
            <h3 className="text-lg font-extrabold text-[#0F8A5F] leading-tight">4 Orders</h3>
          </div>
          <div className="rounded-lg bg-[#E6F4ED] p-2 text-[#0F8A5F] shrink-0">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Partial Issues</p>
            <h3 className="text-lg font-extrabold text-purple-700 leading-tight">3 Issues</h3>
          </div>
          <div className="rounded-lg bg-purple-50 p-2 text-purple-600 shrink-0">
            <Box className="h-4 w-4" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Backorders</p>
            <h3 className="text-lg font-extrabold text-red-700 leading-tight">4 Items</h3>
          </div>
          <div className="rounded-lg bg-red-50 p-2 text-red-600 shrink-0">
            <AlertCircle className="h-4 w-4" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Emergency Req.</p>
            <h3 className="text-lg font-extrabold text-amber-700 leading-tight">2 Urgent</h3>
          </div>
          <div className="rounded-lg bg-amber-50 p-2 text-amber-600 shrink-0">
            <Tag className="h-4 w-4" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Completed</p>
            <h3 className="text-lg font-extrabold text-emerald-800 leading-tight">18 Requests</h3>
          </div>
          <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700 shrink-0">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Top Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-wider">
          {[
            { id: "active", label: `Active Requisitions (${MOCK_ACTIVE_REQUISITIONS.length})` },
            { id: "backorders", label: `Backorders (${MOCK_BACKORDERS.length})` },
            { id: "issue", label: `Issue Tracking (${MOCK_ISSUE_TRACKING.length})` },
            { id: "stock", label: `Stock Availability (${MOCK_STOCK_AVAILABILITY.length})` },
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

      {/* TAB 1: ACTIVE REQUISITIONS */}
      {activeTab === "active" && (
        <div className="space-y-3">
          {/* Standard Operations Toolbar */}
          <OperationsToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search requisition No, department, cost center, items, or requested by…"
            activeFilterCount={activeFilterCount}
            onOpenFilters={() => setFilterDrawerOpen(true)}
          />

          {/* Slide-over Filter Drawer */}
          <OperationsFilterDrawer
            open={filterDrawerOpen}
            onClose={() => setFilterDrawerOpen(false)}
            title="Filter Requisitions"
            activeFilterCount={activeFilterCount}
            onReset={() => {
              setDeptFilter("All");
              setPriorityFilter("All");
              setTypeFilter("All");
              setStatusFilter("All");
            }}
          >
            <div className="space-y-4 select-none">
              <FormField label="Department">
                <SelectInput
                  value={deptFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDeptFilter(e.target.value)}
                  className="w-full text-xs rounded-xl h-9 bg-white"
                >
                  <option value="All">All Departments</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Food & Beverage">Food & Beverage</option>
                  <option value="Front Office">Front Office</option>
                </SelectInput>
              </FormField>

              <FormField label="Priority">
                <SelectInput
                  value={priorityFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPriorityFilter(e.target.value)}
                  className="w-full text-xs rounded-xl h-9 bg-white"
                >
                  <option value="All">All Priorities</option>
                  <option value="Emergency">Emergency</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </SelectInput>
              </FormField>

              <FormField label="Requisition Type">
                <SelectInput
                  value={typeFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTypeFilter(e.target.value)}
                  className="w-full text-xs rounded-xl h-9 bg-white"
                >
                  <option value="All">All Requisition Types</option>
                  <option value="Standard">Standard</option>
                  <option value="Emergency Fast Track">Emergency Fast Track</option>
                </SelectInput>
              </FormField>

              <FormField label="Approval Status">
                <SelectInput
                  value={statusFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
                  className="w-full text-xs rounded-xl h-9 bg-white"
                >
                  <option value="All">All Approval Statuses</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Draft">Draft</option>
                  <option value="Rejected">Rejected</option>
                </SelectInput>
              </FormField>
            </div>
          </OperationsFilterDrawer>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 bg-slate-50 z-10">
                  <th className="px-3 py-2.5">Requisition No</th>
                  <th className="px-3 py-2.5">Department</th>
                  <th className="px-3 py-2.5">Cost Center</th>
                  <th className="px-3 py-2.5">Requested By</th>
                  <th className="px-3 py-2.5">Priority</th>
                  <th className="px-3 py-2.5">Requisition Type</th>
                  <th className="px-3 py-2.5">Items Summary</th>
                  <th className="px-3 py-2.5 text-right">Requested Value</th>
                  <th className="px-3 py-2.5 text-center">Approval Status</th>
                  <th className="px-3 py-2.5 text-center">Issue Status</th>
                  <th className="px-3 py-2.5 text-right w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredActiveRequisitions.map((req) => (
                  <tr
                    key={req.id}
                    onClick={() => setSelectedReq(req)}
                    className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2.5 font-extrabold text-emerald-800 text-[11px]">{req.id}</td>
                    <td className="px-3 py-2.5 font-extrabold text-slate-800">{req.dept}</td>
                    <td className="px-3 py-2.5 font-mono text-[10.5px] text-slate-500">{req.costCenter}</td>
                    <td className="px-3 py-2.5 text-slate-800">{req.requestedBy}</td>
                    <td className="px-3 py-2.5">
                      <span className={cn(
                        "rounded px-1.5 py-0.5 text-[8.5px] border font-extrabold uppercase",
                        req.priority === "Emergency" || req.priority === "High" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-100 text-slate-700 border-slate-200"
                      )}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {req.type === "Emergency Fast Track" ? (
                        <span className="rounded bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase animate-pulse">
                          Fast Track
                        </span>
                      ) : (
                        <span className="text-slate-600 font-medium">Standard</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700 font-bold max-w-xs truncate">{req.items}</td>
                    <td className="px-3 py-2.5 text-right font-extrabold text-slate-900">{req.value}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn("rounded-full px-2 py-0.5 text-[8.5px] border font-bold uppercase whitespace-nowrap w-28 inline-block text-center", statusBadges[req.appStatus])}>
                        {req.appStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn("rounded-full px-2 py-0.5 text-[8.5px] border font-bold uppercase whitespace-nowrap w-28 inline-block text-center", issueStatusBadges[req.issueStatus])}>
                        {req.issueStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReq(req);
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

      {/* TAB 2: BACKORDERS */}
      {activeTab === "backorders" && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 bg-slate-50 z-10">
                  <th className="px-3 py-2.5">Requisition</th>
                  <th className="px-3 py-2.5">Item Name</th>
                  <th className="px-3 py-2.5 text-center">Requested Qty</th>
                  <th className="px-3 py-2.5 text-center">Issued Qty</th>
                  <th className="px-3 py-2.5 text-center">Backorder Qty</th>
                  <th className="px-3 py-2.5">Expected Restock</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {MOCK_BACKORDERS.map((bo, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 font-extrabold text-emerald-800 text-[11px]">{bo.reqId}</td>
                    <td className="px-3 py-2.5 font-extrabold text-slate-800">{bo.item}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-slate-700">{bo.requestedQty}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-emerald-800">{bo.issuedQty}</td>
                    <td className="px-3 py-2.5 text-center font-extrabold text-red-700">{bo.backorderQty}</td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{bo.restockDate}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="rounded-full px-2 py-0.5 text-[8.5px] border font-extrabold uppercase bg-red-50 text-red-700 border-red-200 animate-pulse w-24 inline-block text-center">
                        {bo.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Button
                        variant="outline"
                        className="h-6 px-2 text-[9.5px] font-bold !bg-emerald-50 hover:!bg-emerald-100 !text-emerald-800 !border-emerald-200 rounded-md"
                      >
                        Issue Remaining Stock
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ISSUE TRACKING */}
      {activeTab === "issue" && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 bg-slate-50 z-10">
                  <th className="px-3 py-2.5">Issue Number</th>
                  <th className="px-3 py-2.5">Requisition</th>
                  <th className="px-3 py-2.5">Issued By Storekeeper</th>
                  <th className="px-3 py-2.5">Issued Date</th>
                  <th className="px-3 py-2.5 text-center">Issued Qty</th>
                  <th className="px-3 py-2.5 text-center">Pending Qty</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {MOCK_ISSUE_TRACKING.map((iss) => (
                  <tr key={iss.issueNo} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 font-extrabold text-purple-800 text-[11px]">{iss.issueNo}</td>
                    <td className="px-3 py-2.5 font-mono text-[10.5px] text-slate-500">{iss.reqId}</td>
                    <td className="px-3 py-2.5 font-extrabold text-slate-800">{iss.issuedBy}</td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{iss.date}</td>
                    <td className="px-3 py-2.5 text-center font-extrabold text-emerald-800">{iss.issuedQty}</td>
                    <td className="px-3 py-2.5 text-center font-extrabold text-red-700">{iss.pendingQty}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[8.5px] border font-bold uppercase w-24 inline-block text-center",
                        iss.status === "Full Issue" ? "bg-green-50 text-green-900 border-green-200" : "bg-purple-50 text-purple-700 border-purple-200"
                      )}>
                        {iss.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: STOCK AVAILABILITY */}
      {activeTab === "stock" && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 bg-slate-50 z-10">
                  <th className="px-3 py-2.5">Item Name</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5 text-center">Current Stock</th>
                  <th className="px-3 py-2.5 text-center">Reserved</th>
                  <th className="px-3 py-2.5 text-center">Available Stock</th>
                  <th className="px-3 py-2.5 text-center">Reorder Level</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {MOCK_STOCK_AVAILABILITY.map((stk, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 font-extrabold text-slate-800">{stk.item}</td>
                    <td className="px-3 py-2.5 text-slate-600">{stk.category}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-slate-700">{stk.stock}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-amber-700">{stk.reserved}</td>
                    <td className="px-3 py-2.5 text-center font-extrabold text-slate-900">{stk.available}</td>
                    <td className="px-3 py-2.5 text-center font-mono text-[10px] text-slate-500">{stk.reorder}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[8.5px] border font-bold uppercase w-24 inline-block text-center",
                        stk.status === "In Stock" ? "bg-green-50 text-green-900 border-green-200" :
                        stk.status === "Low Stock" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200 font-extrabold"
                      )}>
                        {stk.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {stk.status === "Out of Stock" ? (
                        <Button
                          variant="outline"
                          className="h-6 px-2 text-[9.5px] font-bold !bg-red-50 hover:!bg-red-100 !text-red-700 !border-red-200 rounded-md"
                        >
                          Convert to Purchase Requisition
                        </Button>
                      ) : (
                        <span className="text-slate-400 font-normal">—</span>
                      )}
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
              { title: "Requisition Summary Report", desc: "Overview of all material requests and departmental totals.", icon: FileText },
              { title: "Department Consumption Ledger", desc: "Cost center usage breakdown (Guest vs F&B vs FO).", icon: CircleDollarSign },
              { title: "Pending Requests Audit", desc: "Unfulfilled store requisitions awaiting approval.", icon: Clock },
              { title: "Backorder Analysis Report", desc: "Items currently on backorder and restock forecasts.", icon: AlertCircle },
              { title: "Issue History Report", desc: "Storekeeper issue logs and receiver signatures.", icon: Receipt },
              { title: "Emergency Requests Audit", desc: "Fast-track urgent requisitions and bypass frequency.", icon: Tag },
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
                  <th className="px-3 py-2.5">Requisition</th>
                  <th className="px-3 py-2.5 text-right">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[10.5px] text-slate-700">
                {MOCK_AUDIT_LOGS.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap">{log.time}</td>
                    <td className="px-3 py-2.5 text-slate-900 font-sans font-bold">{log.user}</td>
                    <td className="px-3 py-2.5 font-bold text-slate-900">{log.action}</td>
                    <td className="px-3 py-2.5 text-emerald-805 font-bold">{log.req}</td>
                    <td className="px-3 py-2.5 text-right text-slate-500 font-sans">{log.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REQUISITION CONSOLE DRAWER */}
      <Drawer
        open={!!selectedReq}
        onClose={() => setSelectedReq(null)}
        title={`${selectedReq?.id || "Requisition"} Console`}
        width="lg"
      >
        {selectedReq && (
          <div className="flex flex-col h-full bg-slate-50/30 select-none">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              
              <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs space-y-2.5">
                <h4 className="font-bold text-slate-855 text-[11px] uppercase tracking-wider border-b border-slate-50 pb-1 flex items-center gap-1.5">
                  <Box className="h-4 w-4 text-emerald-700" /> Requisition Details
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-semibold text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Requisition No</span>
                    <span className="text-slate-900 font-extrabold text-[12px]">{selectedReq.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Cost Center</span>
                    <span className="text-slate-900 font-mono text-[10.5px] font-extrabold">{selectedReq.costCenter}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Department</span>
                    <span className="text-slate-800">{selectedReq.dept}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Requested By</span>
                    <span className="text-slate-800 font-bold">{selectedReq.requestedBy}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Requested Value</span>
                    <span className="text-slate-900 font-bold">{selectedReq.value}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Requisition Type</span>
                    <span className="text-amber-800 font-extrabold">{selectedReq.type}</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-3 flex gap-2 shadow-lg">
              <Button
                variant="outline"
                onClick={() => setSelectedReq(null)}
                className="w-full !bg-slate-100 hover:!bg-slate-200 !text-slate-700 !border-slate-205 flex items-center justify-center text-xs py-2 px-3 font-bold rounded-xl transition-all h-9"
              >
                Close Console
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* DRAWER: REGISTER REQUISITION */}
      <Drawer open={createDrawerOpen} onClose={() => setCreateDrawerOpen(false)} title="Register Supply Requisition" width="lg">
        <div className="space-y-4 select-none">
          
          {/* SECTION 1: BASIC INFORMATION */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 border-b border-slate-100 pb-1">Basic Information</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Requisition Number" required>
                <TextInput value={reqNo} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReqNo(e.target.value)} className="h-9 text-xs rounded-xl font-mono" />
              </FormField>

              <FormField label="Department" required>
                <SelectInput value={dept} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDept(e.target.value)} className="h-9 text-xs rounded-xl bg-white text-slate-700 font-medium">
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Food & Beverage">Food & Beverage</option>
                  <option value="Front Office">Front Office</option>
                </SelectInput>
              </FormField>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <FormField label="Requested By" required>
                <TextInput value={requestedByStaff} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRequestedByStaff(e.target.value)} className="h-9 text-xs rounded-xl" />
              </FormField>

              <FormField label="Request Date" required>
                <TextInput type="date" value={reqDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReqDate(e.target.value)} className="h-9 text-xs rounded-xl" />
              </FormField>

              <FormField label="Required Date" required>
                <TextInput type="date" value={requiredDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRequiredDate(e.target.value)} className="h-9 text-xs rounded-xl" />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Priority" required>
                <SelectInput value={priority} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPriority(e.target.value)} className="h-9 text-xs rounded-xl bg-white text-slate-700">
                  <option value="High">High</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </SelectInput>
              </FormField>

              <FormField label="Requisition Type" required>
                <SelectInput value={reqType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReqType(e.target.value as any)} className="h-9 text-xs rounded-xl bg-white text-slate-700">
                  <option value="Standard">Standard</option>
                  <option value="Emergency Fast Track">Emergency Fast Track</option>
                </SelectInput>
              </FormField>
            </div>

            {/* Helper Text for Emergency */}
            {reqType === "Emergency Fast Track" && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-[10px] text-amber-800 font-bold">
                ⚠️ Emergency requests may follow a fast-track approval process and route directly to general stores for immediate dispatch.
              </div>
            )}
          </div>

          {/* SECTION 2: ITEMS (EDITABLE TABLE WITH SEPARATE QTY COLUMNS) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Requisition Items Table</h4>
              <Button
                variant="outline"
                onClick={() => {
                  setReqItemsList(prev => [...prev, { item: "Bath Towel Plush 600GSM", category: "Linen", unit: "Pcs", reqQty: "20", availQty: "50", issuedQty: "20", backorderQty: "0", cost: "₹8,000", remarks: "Replacement stock" }]);
                }}
                className="h-6 px-2 text-[9.5px] font-bold !bg-slate-100 hover:!bg-slate-200 rounded-md"
              >
                + Add Item
              </Button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                    <th className="px-2 py-2">Item Name</th>
                    <th className="px-2 py-2">Category</th>
                    <th className="px-2 py-2 text-center">Req Qty</th>
                    <th className="px-2 py-2 text-center">Avail Qty</th>
                    <th className="px-2 py-2 text-center">Issued Qty</th>
                    <th className="px-2 py-2 text-center">Backorder Qty</th>
                    <th className="px-2 py-2 text-right">Est. Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {reqItemsList.map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-2 py-2 font-bold text-slate-800">{row.item}</td>
                      <td className="px-2 py-2 text-slate-500">{row.category}</td>
                      <td className="px-2 py-2 text-center">
                        <TextInput value={row.reqQty} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const val = e.target.value;
                          setReqItemsList(prev => prev.map((item, i) => i === idx ? { ...item, reqQty: val } : item));
                        }} className="w-12 h-6 text-xs text-center font-bold" />
                      </td>
                      <td className="px-2 py-2 text-center text-slate-600">{row.availQty}</td>
                      <td className="px-2 py-2 text-center text-emerald-800 font-bold">{row.issuedQty}</td>
                      <td className="px-2 py-2 text-center text-red-700 font-bold">{row.backorderQty}</td>
                      <td className="px-2 py-2 text-right font-extrabold">{row.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3: COST CENTER & BUDGET CARD */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 border-b border-slate-100 pb-1">Cost Center & Budget</h4>
            
            <FormField label="Cost Center Code" required>
              <SelectInput value={costCenterCode} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCostCenterCode(e.target.value)} className="h-9 text-xs rounded-xl bg-white text-slate-700">
                <option value="CC-HK-GUEST">CC-HK-GUEST (Housekeeping Guest Amenities)</option>
                <option value="CC-FB-REST">CC-FB-REST (Restaurant Linen)</option>
                <option value="CC-HK-CHEM">CC-HK-CHEM (Cleaning Chemicals)</option>
                <option value="CC-FO-AMEN">CC-FO-AMEN (Front Office Supplies)</option>
              </SelectInput>
            </FormField>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5">
              <h5 className="text-[10px] font-extrabold uppercase text-slate-800">Department Budget Summary (Informational)</h5>
              <div className="grid grid-cols-3 gap-2 text-[10px] font-semibold text-slate-600 border-t border-slate-200 pt-1.5">
                <div>
                  <span className="block text-slate-400 font-bold">Dept Budget</span>
                  <span className="text-slate-900 font-extrabold">₹150,000</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-bold">Requested Value</span>
                  <span className="text-emerald-800 font-extrabold">₹14,500</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-bold">Remaining Budget</span>
                  <span className="text-slate-900 font-extrabold">₹135,500</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: APPROVAL TIMELINE */}
          <div className="space-y-2.5 border-t border-slate-100 pt-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 border-b border-slate-100 pb-1 flex items-center justify-between">
              <span>Approval Workflow Timeline</span>
              {reqType === "Emergency Fast Track" && (
                <span className="rounded bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase">
                  Fast Track Active
                </span>
              )}
            </h4>

            <div className="flex items-center justify-between text-[9.5px] font-bold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span>Store Supervisor</span>
              <ArrowRight className="h-3 w-3 text-slate-400" />
              <span>Store Manager</span>
              <ArrowRight className="h-3 w-3 text-slate-400" />
              <span>Exec. Housekeeper</span>
              <ArrowRight className="h-3 w-3 text-slate-400" />
              <span>Finance</span>
            </div>
            {reqType === "Emergency Fast Track" && (
              <p className="text-[9.5px] text-amber-700 font-bold">ℹ Emergency requests may bypass routine approvals and issue directly.</p>
            )}
          </div>

          {/* SECTION 5: RECEIVING VERIFICATION */}
          <div className="space-y-2.5 border-t border-slate-100 pt-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 border-b border-slate-100 pb-1">Receiving Verification</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Received By Staff" required>
                <TextInput value={receivedBy} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReceivedBy(e.target.value)} className="h-8 text-xs rounded-xl" />
              </FormField>

              <FormField label="Staff PIN (Handover Verification)" required>
                <TextInput type="password" value={staffPin} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStaffPin(e.target.value)} className="h-8 text-xs rounded-xl font-mono" />
              </FormField>
            </div>

            {/* Digital Signature Pad Placeholder */}
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-600 block">Digital Signature Pad</span>
              <p className="text-[9px] font-mono text-emerald-700 font-bold">✓ Receiver Signature Saved (PIN 4921)</p>
            </div>
          </div>

          <Button
            onClick={handleCreateSubmit}
            className="w-full !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white font-bold rounded-xl shadow-xs h-11 text-xs transition-all mt-4"
          >
            Submit Requisition
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
