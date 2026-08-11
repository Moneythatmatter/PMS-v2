"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  Search,
  Filter,
  Download,
  Printer,
  ChevronDown,
  Building2,
  Briefcase,
  Clock,
  Eye,
  Edit2,
  Wallet,
  SlidersHorizontal,
  Phone,
  Mail,
  ShieldCheck,
  Calendar,
  X,
  FileText,
  UserCheck,
  CheckCircle2,
  Trash2,
  CreditCard,
  Layers,
  MapPin,
  Heart,
  MessageSquareWarning,
  History,
  IdCard,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatMiniCard, Drawer } from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { sampleEmployees, EmployeeItem } from "@/app/data/hr/employeeListData";
import { cn } from "@/lib/utils";

type ProfileTab =
  | "personal"
  | "employment"
  | "attendance"
  | "leave"
  | "payroll"
  | "documents"
  | "grievances"
  | "activity";

export function EmployeeListView() {
  const [employees, setEmployees] = useState<EmployeeItem[]>(sampleEmployees);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");
  const [selectedEmploymentType, setSelectedEmploymentType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedShift, setSelectedShift] = useState<string>("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkMenu, setShowBulkMenu] = useState(false);

  // Drawer detail state
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<EmployeeItem | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("personal");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filtered dataset
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          emp.empCode.toLowerCase().includes(q) ||
          emp.name.toLowerCase().includes(q) ||
          emp.designation.toLowerCase().includes(q) ||
          emp.email.toLowerCase().includes(q) ||
          emp.phone.includes(q);
        if (!matchesQuery) return false;
      }

      // Department
      if (selectedDepartment !== "ALL" && emp.department !== selectedDepartment) {
        return false;
      }

      // Employment Type
      if (selectedEmploymentType !== "ALL" && emp.employmentType !== selectedEmploymentType) {
        return false;
      }

      // Status
      if (selectedStatus !== "ALL" && emp.status !== selectedStatus) {
        return false;
      }

      // Shift
      if (selectedShift !== "ALL" && emp.shiftType !== selectedShift) {
        return false;
      }

      return true;
    });
  }, [employees, searchQuery, selectedDepartment, selectedEmploymentType, selectedStatus, selectedShift]);

  // Statistics
  const totalCount = employees.length;
  const activeCount = useMemo(() => employees.filter((e) => e.status === "Active").length, [employees]);
  const permanentCount = useMemo(() => employees.filter((e) => e.employmentType === "Permanent").length, [employees]);
  const contractCount = useMemo(() => employees.filter((e) => e.employmentType === "Contractual" || e.employmentType === "Probation").length, [employees]);

  // Selection handlers
  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredEmployees.length && filteredEmployees.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEmployees.map((e) => e.id)));
    }
  };

  // Bulk Actions
  const handleBulkAction = (actionName: string) => {
    setShowBulkMenu(false);
    if (selectedIds.size === 0) return;

    if (actionName === "Delete") {
      setEmployees((prev) => prev.filter((e) => !selectedIds.has(e.id)));
      setToastMessage(`✓ ${selectedIds.size} employee record(s) deleted successfully.`);
      setSelectedIds(new Set());
    } else {
      setToastMessage(`✓ ${actionName} applied for ${selectedIds.size} selected employee(s).`);
    }
  };

  const openEmployeeDrawer = (emp: EmployeeItem, tab: ProfileTab = "personal") => {
    setSelectedEmployeeDetail(emp);
    setActiveTab(tab);
  };

  // Filter Form Content
  const FilterFormContent = () => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
      <div>
        <label className="mb-1 block font-bold text-slate-700">Department</label>
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="h-8 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
        >
          <option value="ALL">All Departments</option>
          <option value="Front Office">Front Office</option>
          <option value="Housekeeping">Housekeeping</option>
          <option value="Kitchen / Culinary">Kitchen / Culinary</option>
          <option value="F&B Service">F&B Service</option>
          <option value="Maintenance & Eng.">Maintenance & Eng.</option>
          <option value="HR & Admin">HR & Admin</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block font-bold text-slate-700">Employment Type</label>
        <select
          value={selectedEmploymentType}
          onChange={(e) => setSelectedEmploymentType(e.target.value)}
          className="h-8 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
        >
          <option value="ALL">All Employment Types</option>
          <option value="Permanent">Permanent</option>
          <option value="Contractual">Contractual</option>
          <option value="Probation">Probation</option>
          <option value="Trainee">Trainee</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block font-bold text-slate-700">Status</label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="h-8 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="Active">Active</option>
          <option value="On Leave">On Leave</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block font-bold text-slate-700">Shift Type</label>
        <select
          value={selectedShift}
          onChange={(e) => setSelectedShift(e.target.value)}
          className="h-8 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
        >
          <option value="ALL">All Shifts</option>
          <option value="Morning Shift">Morning Shift</option>
          <option value="Evening Shift">Evening Shift</option>
          <option value="Night Shift">Night Shift</option>
          <option value="General Shift">General Shift</option>
        </select>
      </div>
    </div>
  );

  return (
    <ModulePageShell
      eyebrow="Human Resource / Employees"
      title="Employee List"
      description="Manage master employee records, department assignments, shift rosters, employment status, and contact details."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Employees", href: "/human-resources/employees/list" },
        { label: "Employee List" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-medium bg-white shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Print List
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setToastMessage("✓ Employee list exported to CSV successfully.")}
            className="rounded-xl text-xs font-medium bg-white shadow-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export CSV
          </Button>
        </div>
      }
    >
      {/* KPI Stat Cards Grid */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatMiniCard
          label="Total Headcount"
          value={`${totalCount} Staff`}
          sublabel={`${activeCount} Active Employees`}
          accent="#0284c7"
          icon={Users}
        />

        <StatMiniCard
          label="Full-Time Permanent"
          value={`${permanentCount} Staff`}
          sublabel="80% Core Personnel"
          accent="#16a34a"
          icon={UserCheck}
        />

        <StatMiniCard
          label="Contract / Probation"
          value={`${contractCount} Staff`}
          sublabel="Temporary & Interns"
          accent="#f59e0b"
          icon={Briefcase}
        />

        <StatMiniCard
          label="Active Shifts Coverage"
          value="6 Departments"
          sublabel="24/7 Hotel Operations"
          accent="#8b5cf6"
          icon={Building2}
        />
      </div>

      {/* Toolbar, Search Bar & Bulk Actions */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-xl border-slate-200 text-xs font-semibold gap-1.5 hidden md:inline-flex bg-white text-slate-700 cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" />
            <span>{showFilters ? "Hide Filters" : "Filter Employees"}</span>
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform duration-200", showFilters && "rotate-180")}
            />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMobileFilterOpen(true)}
            className="rounded-xl border-slate-200 text-xs font-semibold gap-1.5 md:hidden bg-white text-slate-700 cursor-pointer"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
          </Button>

          {/* Bulk Actions Dropdown */}
          {selectedIds.size > 0 && (
            <div className="relative">
              <Button
                type="button"
                size="sm"
                onClick={() => setShowBulkMenu(!showBulkMenu)}
                className="rounded-xl bg-emerald-700 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Bulk Actions ({selectedIds.size})</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>

              {showBulkMenu && (
                <div className="absolute left-0 top-full mt-1.5 z-30 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl text-xs space-y-0.5 animate-in fade-in-50">
                  <button
                    onClick={() => handleBulkAction("Assign Shift")}
                    className="w-full rounded-lg px-2.5 py-1.5 text-left font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                  >
                    <Clock className="h-3.5 w-3.5 text-slate-500" /> Assign Shift
                  </button>
                  <button
                    onClick={() => handleBulkAction("Change Department")}
                    className="w-full rounded-lg px-2.5 py-1.5 text-left font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                  >
                    <Building2 className="h-3.5 w-3.5 text-slate-500" /> Change Department
                  </button>
                  <button
                    onClick={() => handleBulkAction("Generate ID Cards")}
                    className="w-full rounded-lg px-2.5 py-1.5 text-left font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                  >
                    <IdCard className="h-3.5 w-3.5 text-slate-500" /> Generate ID Cards
                  </button>
                  <button
                    onClick={() => handleBulkAction("Export Selected")}
                    className="w-full rounded-lg px-2.5 py-1.5 text-left font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" /> Export Selected
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    onClick={() => handleBulkAction("Delete")}
                    className="w-full rounded-lg px-2.5 py-1.5 text-left font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-600" /> Delete Selected
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 sm:w-72">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by code, name, role, email..."
            className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Desktop Filter Panel */}
      {showFilters && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs animate-in fade-in-50">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Filter Parameters
              </h3>
            </div>
            <button
              onClick={() => {
                setSelectedDepartment("ALL");
                setSelectedEmploymentType("ALL");
                setSelectedStatus("ALL");
                setSelectedShift("ALL");
              }}
              className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
          <FilterFormContent />
        </div>
      )}

      {/* Mobile Drawer Filter */}
      <Drawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title="Filter Employees"
      >
        <div className="p-4">
          <FilterFormContent />
          <div className="mt-4 border-t border-slate-100 pt-3">
            <Button
              type="button"
              className="w-full bg-emerald-700 text-white"
              onClick={() => setMobileFilterOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Main Employee Table Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Employee Directory ({filteredEmployees.length} Records)
            </h2>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block max-h-[540px] overflow-y-auto overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredEmployees.length && filteredEmployees.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-2.5 w-24">Emp Code</th>
                <th className="px-3.5 py-2.5 min-w-[220px]">Employee Photo &amp; Info</th>
                <th className="px-3.5 py-2.5 min-w-[160px]">Department &amp; Role</th>
                <th className="px-3 py-2.5 w-28">Type</th>
                <th className="px-3 py-2.5 w-32">Shift</th>
                <th className="px-3.5 py-2.5 text-right w-28">Salary (₹)</th>
                <th className="px-3 py-2.5 text-center w-24">Status</th>
                <th className="px-3 py-2.5 text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                    No employees found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((row) => {
                  const isSelected = selectedIds.has(row.id);
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "even:bg-slate-50/50 hover:bg-slate-100/80 transition-colors",
                        isSelected && "bg-emerald-50/80 hover:bg-emerald-100/80 border-l-2 border-l-emerald-600"
                      )}
                    >
                      <td className="px-3 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(row.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2.5 font-bold text-slate-900">{row.empCode}</td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-3">
                          {/* Photo Avatar or Initials Fallback */}
                          {row.photoUrl ? (
                            <img
                              src={row.photoUrl}
                              alt={row.name}
                              className="h-9 w-9 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs shrink-0 border border-emerald-200">
                              {row.avatar}
                            </div>
                          )}
                          <div>
                            <a
                              href={`/human-resources/employees/profile?id=${row.id}`}
                              className="font-bold text-slate-900 hover:text-emerald-700 hover:underline cursor-pointer"
                            >
                              {row.name}
                            </a>
                            <p className="text-[10px] text-slate-500 truncate max-w-[180px]">{row.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <p className="font-bold text-slate-800">{row.designation}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{row.department}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase border",
                            row.employmentType === "Permanent"
                              ? "bg-blue-50 text-blue-800 border-blue-200"
                              : row.employmentType === "Contractual"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-purple-50 text-purple-800 border-purple-200"
                          )}
                        >
                          {row.employmentType}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-700 font-medium">{row.shiftType}</td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">
                        ₹{row.salary.toLocaleString("en-IN")}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={cn(
                            "inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
                            row.status === "Active"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : row.status === "On Leave"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-rose-100 text-rose-800 border-rose-300"
                          )}
                        >
                          {row.status}
                        </span>
                      </td>
                      {/* Action Column with Direct Link to Employee Profile passing ?id=${row.id} */}
                      <td className="px-3 py-2.5 text-center">
                        <a
                          href={`/human-resources/employees/profile?id=${row.id}`}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 transition-colors cursor-pointer"
                          title="Open Employee Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked View (md:hidden) */}
        <div className="md:hidden space-y-2.5">
          {filteredEmployees.length === 0 ? (
            <div className="p-6 text-center text-slate-400 font-medium text-xs rounded-xl border border-slate-200 bg-white">
              No employees found.
            </div>
          ) : (
            filteredEmployees.map((row) => {
              const isSelected = selectedIds.has(row.id);
              return (
                <div
                  key={row.id}
                  onClick={() => openEmployeeDrawer(row, "personal")}
                  className={cn(
                    "rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 cursor-pointer transition-colors",
                    isSelected && "border-emerald-300 bg-emerald-50/70 ring-1 ring-emerald-400"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {row.photoUrl ? (
                        <img
                          src={row.photoUrl}
                          alt={row.name}
                          className="h-9 w-9 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs shrink-0 border border-emerald-200">
                          {row.avatar}
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-xs text-slate-900">{row.name}</span>
                        <p className="text-[10px] text-slate-500">{row.empCode} • {row.department}</p>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-bold uppercase border",
                        row.status === "Active"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-amber-100 text-amber-800 border-amber-300"
                      )}
                    >
                      {row.status}
                    </span>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                    <span>{row.designation}</span>
                    <span className="font-bold text-slate-900">₹{row.salary.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Tabbed Employee Details Drawer */}
      {selectedEmployeeDetail && (
        <Drawer
          open={!!selectedEmployeeDetail}
          onClose={() => setSelectedEmployeeDetail(null)}
          title={`Employee Profile: ${selectedEmployeeDetail.name}`}
        >
          <div className="p-4 space-y-4 text-xs">
            {/* Employee Summary Card */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <img
                src={selectedEmployeeDetail.photoUrl}
                alt={selectedEmployeeDetail.name}
                className="h-12 w-12 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-slate-900 truncate">{selectedEmployeeDetail.name}</h3>
                <p className="text-[11px] text-slate-500 font-semibold truncate">
                  {selectedEmployeeDetail.empCode} • {selectedEmployeeDetail.designation}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {selectedEmployeeDetail.status}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {selectedEmployeeDetail.department}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Navigation Tabs (Personal, Employment, Attendance, Leave, Payroll, Documents, Grievances, Activity) */}
            <div className="flex overflow-x-auto gap-1 border-b border-slate-200 pb-1 scrollbar-none">
              {[
                { id: "personal", label: "Personal" },
                { id: "employment", label: "Employment" },
                { id: "attendance", label: "Attendance" },
                { id: "leave", label: "Leave" },
                { id: "payroll", label: "Payroll" },
                { id: "documents", label: "Documents" },
                { id: "grievances", label: "Grievances" },
                { id: "activity", label: "Activity" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ProfileTab)}
                  className={cn(
                    "whitespace-nowrap px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer",
                    activeTab === tab.id
                      ? "bg-emerald-700 text-white shadow-2xs"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Personal */}
            {activeTab === "personal" && (
              <div className="space-y-2.5 rounded-xl border border-slate-200 p-3.5 bg-white">
                <p className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Personal Information</p>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gender:</span>
                  <span className="font-bold text-slate-800">{selectedEmployeeDetail.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date of Birth:</span>
                  <span className="font-bold text-slate-800">{selectedEmployeeDetail.dob || "14/05/1990"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Blood Group:</span>
                  <span className="font-bold text-slate-800">{selectedEmployeeDetail.bloodGroup || "O+"}</span>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-800">{selectedEmployeeDetail.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-800">{selectedEmployeeDetail.phone}</span>
                </div>
                <div className="pt-1 border-t border-slate-100">
                  <span className="text-slate-500 block mb-0.5">Address:</span>
                  <span className="font-medium text-slate-800 leading-relaxed block">{selectedEmployeeDetail.address}</span>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <ShieldCheck className="h-3.5 w-3.5 text-rose-500" />
                  <span className="text-slate-500">Emergency:</span>
                  <span className="font-bold text-slate-800">{selectedEmployeeDetail.emergencyContact}</span>
                </div>
              </div>
            )}

            {/* Tab 2: Employment */}
            {activeTab === "employment" && (
              <div className="space-y-2.5 rounded-xl border border-slate-200 p-3.5 bg-white">
                <p className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Employment Details</p>
                <div className="flex justify-between">
                  <span className="text-slate-500">Employee Code:</span>
                  <span className="font-bold text-slate-900">{selectedEmployeeDetail.empCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Department:</span>
                  <span className="font-bold text-slate-800">{selectedEmployeeDetail.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Designation:</span>
                  <span className="font-bold text-slate-800">{selectedEmployeeDetail.designation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Employment Type:</span>
                  <span className="font-bold text-slate-800">{selectedEmployeeDetail.employmentType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Shift Roster:</span>
                  <span className="font-bold text-slate-800">{selectedEmployeeDetail.shiftType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date of Joining:</span>
                  <span className="font-bold text-slate-800">{selectedEmployeeDetail.joinDate}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Reporting Manager:</span>
                  <span className="font-bold text-emerald-800">{selectedEmployeeDetail.reportingManager || "Vikram Malhotra (GM)"}</span>
                </div>
              </div>
            )}

            {/* Tab 3: Attendance */}
            {activeTab === "attendance" && (
              <div className="space-y-3 rounded-xl border border-slate-200 p-3.5 bg-white">
                <p className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Attendance Statistics</p>
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="font-bold text-emerald-900">Attendance Rate (YTD)</span>
                  <span className="text-lg font-black text-emerald-800">{selectedEmployeeDetail.attendanceRate || 95}%</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Active Shift:</span>
                    <span className="font-bold text-slate-800">{selectedEmployeeDetail.shiftType}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Late Arrivals This Month:</span>
                    <span className="font-bold text-amber-800">1 Time (15m grace)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Overtime Hours:</span>
                    <span className="font-bold text-slate-800">12.5 Hours</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Leave */}
            {activeTab === "leave" && (
              <div className="space-y-3 rounded-xl border border-slate-200 p-3.5 bg-white">
                <p className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Leave Balance Summary</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-2">
                    <span className="text-[10px] font-bold text-blue-800 block">Casual</span>
                    <span className="text-base font-black text-blue-900">{selectedEmployeeDetail.leaveBalance?.casual ?? 4} Days</span>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-2">
                    <span className="text-[10px] font-bold text-amber-800 block">Sick</span>
                    <span className="text-base font-black text-amber-900">{selectedEmployeeDetail.leaveBalance?.sick ?? 5} Days</span>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2">
                    <span className="text-[10px] font-bold text-emerald-800 block">Earned</span>
                    <span className="text-base font-black text-emerald-900">{selectedEmployeeDetail.leaveBalance?.earned ?? 12} Days</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: Payroll */}
            {activeTab === "payroll" && (
              <div className="space-y-2.5 rounded-xl border border-slate-200 p-3.5 bg-white">
                <p className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Payroll &amp; Bank Details</p>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Monthly Salary:</span>
                  <span className="font-bold text-emerald-700 text-sm">₹{selectedEmployeeDetail.salary.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank Account No:</span>
                  <span className="font-bold text-slate-800">{selectedEmployeeDetail.bankAccount || "987654321098"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">IFSC Code:</span>
                  <span className="font-bold text-slate-800">{selectedEmployeeDetail.ifscCode || "HDFC0001234"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">PAN Number:</span>
                  <span className="font-bold text-slate-800">{selectedEmployeeDetail.panNumber || "ABCDE1234F"}</span>
                </div>
              </div>
            )}

            {/* Tab 6: Documents */}
            {activeTab === "documents" && (
              <div className="space-y-2 rounded-xl border border-slate-200 p-3.5 bg-white">
                <p className="font-bold uppercase tracking-wider text-[10px] text-slate-400 mb-2">Employee Documents ({selectedEmployeeDetail.documentsCount || 4})</p>
                {["Offer Letter.pdf", "Aadhar Card.pdf", "Employment Contract.pdf", "Educational Certificate.pdf"].map((doc) => (
                  <div key={doc} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <span className="font-semibold text-slate-700">{doc}</span>
                    <span className="text-[10px] text-emerald-700 font-bold">Verified</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 7: Grievances */}
            {activeTab === "grievances" && (
              <div className="space-y-2 rounded-xl border border-slate-200 p-3.5 bg-white text-center">
                <p className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Grievances History</p>
                {selectedEmployeeDetail.openGrievancesCount && selectedEmployeeDetail.openGrievancesCount > 0 ? (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold">
                    1 Active Complaint Registered (Pending Resolution)
                  </div>
                ) : (
                  <div className="py-4 text-xs text-slate-400 font-medium">
                    No active or past complaints recorded for this employee.
                  </div>
                )}
              </div>
            )}

            {/* Tab 8: Activity */}
            {activeTab === "activity" && (
              <div className="space-y-2 rounded-xl border border-slate-200 p-3.5 bg-white">
                <p className="font-bold uppercase tracking-wider text-[10px] text-slate-400">Recent HR Activity Log</p>
                <div className="text-[11px] space-y-1.5">
                  <p className="text-slate-700">
                    • Profile record updated <strong className="text-slate-900">({selectedEmployeeDetail.lastUpdated})</strong>
                  </p>
                  <p className="text-slate-700">• Shift roster confirmed for August 2026</p>
                  <p className="text-slate-700">• July Payroll payslip generated</p>
                </div>
              </div>
            )}
          </div>
        </Drawer>
      )}
    </ModulePageShell>
  );
}
