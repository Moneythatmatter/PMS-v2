"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Sliders,
  Building2,
  Users,
  Sparkles,
  Package,
  ConciergeBell,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Clock,
  RefreshCw,
  History,
  Plus,
  Download,
  Eye,
  ChevronRight,
  Search,
  RotateCcw,
  FileText,
  AlertCircle,
  ExternalLink,
  Layers,
  ArrowRight,
  CheckSquare,
  Shield,
  Info,
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
  MASTER_CATEGORIES_DATA,
  INITIAL_MASTER_RECORDS,
  MASTER_SYNC_STATUSES,
  MASTER_AUDIT_LOGS,
  MasterRecord,
  MasterCategory,
} from "@/app/data/housekeepingMasters";

export default function HousekeepingMastersPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Top Tabs
  const [activeTopTab, setActiveTopTab] = useState<"repositories" | "sync" | "reports" | "audit">("repositories");

  // Category Tree Selection
  const [selectedCategoryGroup, setSelectedCategoryGroup] = useState<string>("all");
  const [selectedSubMasterId, setSelectedSubMasterId] = useState<string>("all");
  const [categorySearch, setCategorySearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["property", "workforce", "cleaning"]);

  // Toolbar & Table Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Drawers
  const [selectedRecord, setSelectedRecord] = useState<MasterRecord | null>(null);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);

  // Create Form State
  const [newMasterCode, setNewMasterCode] = useState("");
  const [newMasterName, setNewMasterName] = useState("");
  const [newMasterCategory, setNewMasterCategory] = useState("Property Configuration");
  const [newMasterSubCat, setNewMasterSubCat] = useState("Room Master");
  const [newMasterDesc, setNewMasterDesc] = useState("");
  const [newMasterStatus, setNewMasterStatus] = useState<"Active" | "Draft">("Active");

  // Toast
  const [toast, setToast] = useState<{ message: string; variant: "success" | "info" | "error" } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Master records list state
  const [records, setRecords] = useState<MasterRecord[]>(INITIAL_MASTER_RECORDS);

  // Toggle Category Collapsible
  const toggleCategoryExpand = (catId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  // Icon Resolver
  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case "Building2":
        return <Building2 className="h-4 w-4 text-emerald-600" />;
      case "Users":
        return <Users className="h-4 w-4 text-blue-600" />;
      case "Sparkles":
        return <Sparkles className="h-4 w-4 text-amber-600" />;
      case "Package":
        return <Package className="h-4 w-4 text-purple-600" />;
      case "ConciergeBell":
        return <ConciergeBell className="h-4 w-4 text-indigo-600" />;
      case "Landmark":
        return <Landmark className="h-4 w-4 text-teal-600" />;
      case "ShieldCheck":
        return <ShieldCheck className="h-4 w-4 text-emerald-700" />;
      case "Sliders":
      default:
        return <Sliders className="h-4 w-4 text-slate-600" />;
    }
  };

  // Filtered Category Groups for Left Sidebar Tree
  const filteredCategoryGroups = useMemo(() => {
    if (!categorySearch.trim()) return MASTER_CATEGORIES_DATA;
    const q = categorySearch.toLowerCase();
    return MASTER_CATEGORIES_DATA.map((cat) => ({
      ...cat,
      masters: cat.masters.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.code.toLowerCase().includes(q) ||
          cat.name.toLowerCase().includes(q)
      ),
    })).filter((cat) => cat.masters.length > 0 || cat.name.toLowerCase().includes(q));
  }, [categorySearch]);

  // Active Filter Count Calculation
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (categoryFilter !== "all") count++;
    if (selectedCategoryGroup !== "all") count++;
    if (selectedSubMasterId !== "all") count++;
    return count;
  }, [statusFilter, categoryFilter, selectedCategoryGroup, selectedSubMasterId]);

  // Filtered Master Records Table
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchSearch =
        rec.name.toLowerCase().includes(search.toLowerCase()) ||
        rec.code.toLowerCase().includes(search.toLowerCase()) ||
        rec.subCategory.toLowerCase().includes(search.toLowerCase()) ||
        rec.updatedBy.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "all" || rec.status.toLowerCase() === statusFilter.toLowerCase();
      const matchCategory =
        categoryFilter === "all" || rec.categoryName.toLowerCase().includes(categoryFilter.toLowerCase());

      const matchTreeGroup =
        selectedCategoryGroup === "all" ||
        rec.categoryId.toLowerCase() === selectedCategoryGroup.toLowerCase();

      return matchSearch && matchStatus && matchCategory && matchTreeGroup;
    });
  }, [records, search, statusFilter, categoryFilter, selectedCategoryGroup]);

  // Handle Toggle Record Status
  const handleToggleRecordStatus = (id: string) => {
    setRecords((prev) =>
      prev.map((rec) => {
        if (rec.id === id) {
          const nextStatus = rec.status === "Active" ? "Inactive" : "Active";
          return {
            ...rec,
            status: nextStatus,
            lastUpdated: "Just Now",
            updatedBy: "Admin User",
          };
        }
        return rec;
      })
    );
    setToast({ message: "Master record status updated successfully.", variant: "success" });
  };

  // Create Master Record Handler
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMasterName.trim() || !newMasterCode.trim()) return;

    const created: MasterRecord = {
      id: `REC-${Math.floor(100 + Math.random() * 900)}`,
      code: newMasterCode.toUpperCase(),
      name: newMasterName,
      categoryId: "property",
      categoryName: newMasterCategory,
      subCategory: newMasterSubCat,
      status: newMasterStatus,
      lastUpdated: "Just Now",
      updatedBy: "Admin User",
      version: "v1.0",
      description: newMasterDesc || "Custom master data configuration entry.",
      properties: {
        "Created Date": "Today",
        "Author": "Admin User",
        "Source": "Manual Configuration",
      },
      dependencies: [
        { moduleName: "Room Cleaning", usageType: "Primary Lookup", activeUsageCount: 10 },
        { moduleName: "Requisitions", usageType: "Validation Rule", activeUsageCount: 5 },
      ],
      syncInfo: {
        sourceSystem: "Housekeeping Master Repository",
        lastSync: "Just Now",
        nextSync: "Tomorrow 08:00 AM",
        status: "Synced",
        affectedModulesCount: 2,
      },
    };

    setRecords([created, ...records]);
    setCreateDrawerOpen(false);
    setToast({ message: `Master Record ${newMasterCode} created successfully!`, variant: "success" });

    // Reset
    setNewMasterCode("");
    setNewMasterName("");
    setNewMasterDesc("");
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-5 select-none">
      {/* Toast Notification */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl p-3 text-xs font-bold shadow-xl animate-in fade-in slide-in-from-bottom-2",
            toast.variant === "success"
              ? "bg-emerald-600 text-white"
              : toast.variant === "error"
              ? "bg-red-600 text-white"
              : "bg-blue-600 text-white"
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <FOPageHeader
        eyebrow="Configuration Hub"
        title="Housekeeping Masters Management"
        description="Centralized reference data repository managing room categories, staff roles, chemical MSDS, tariffs, and SLA thresholds across 10 operational modules."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setToast({ message: "Exporting Master Configuration catalog to CSV...", variant: "info" })}
              className="!bg-white hover:!bg-slate-100 !text-slate-700 !border-slate-200 flex items-center justify-center gap-1.5 rounded-xl h-8 px-3 text-xs font-bold shrink-0"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" /> Export Data
            </Button>

            <Button
              onClick={() => setCreateDrawerOpen(true)}
              className="!bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white flex items-center justify-center gap-1.5 rounded-xl h-8 px-3.5 text-xs font-bold shrink-0 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" /> New Master Record
            </Button>
          </div>
        }
      />

      {/* 6 Top Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatMiniCard label="Active Masters" value="50+ Repositories" icon={CheckCircle2} accent="#10b981" />
        <StatMiniCard label="Inactive Masters" value="4 Records" icon={Lock} accent="#64748b" />
        <StatMiniCard label="Recently Updated" value="12 Today" icon={Sparkles} accent="#2563eb" />
        <StatMiniCard label="Pending Approval" value="2 Drafts" icon={Clock} accent="#d97706" />
        <StatMiniCard label="Sync Status" value="100% Healthy" icon={RefreshCw} accent="#059669" />
        <StatMiniCard label="Audit Events" value="86 This Month" icon={History} accent="#7c3aed" />
      </div>

      {/* Top Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-4 overflow-x-auto scrollbar-none text-xs font-bold uppercase tracking-wider">
          {[
            { id: "repositories", label: "Master Repositories (50+)" },
            { id: "sync", label: "Synchronization Status (4 Systems)" },
            { id: "reports", label: "Configuration Reports" },
            { id: "audit", label: "Change Audit Logs" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTopTab(tab.id as any)}
              className={cn(
                "pb-2.5 px-0.5 border-b-2 transition-all whitespace-nowrap cursor-pointer",
                activeTopTab === tab.id
                  ? "border-emerald-700 text-emerald-750 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* TAB 1: MASTER REPOSITORIES */}
      {activeTopTab === "repositories" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Expandable Category Sidebar Tree (4 Cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5 sticky top-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Master Categories</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Select repository category</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryGroup("all");
                    setSelectedSubMasterId("all");
                  }}
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer",
                    selectedCategoryGroup === "all"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-extrabold"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  All ({MASTER_CATEGORIES_DATA.reduce((acc, c) => acc + c.masters.length, 0)})
                </button>
              </div>

              {/* Category Search Input */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <TextInput
                  value={categorySearch}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCategorySearch(e.target.value)}
                  placeholder="Filter category or master name..."
                  className="pl-9 h-8 text-xs rounded-xl w-full bg-slate-50/50 border-slate-200"
                />
              </div>

              {/* Expandable Category Tree List */}
              <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredCategoryGroups.map((cat) => {
                  const isExpanded = expandedCategories.includes(cat.id);
                  const isCatSelected = selectedCategoryGroup === cat.id;

                  return (
                    <div key={cat.id} className="rounded-xl border border-slate-150 bg-white overflow-hidden shadow-2xs">
                      {/* Header row */}
                      <button
                        type="button"
                        onClick={() => {
                          toggleCategoryExpand(cat.id);
                          setSelectedCategoryGroup(cat.id);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between p-2.5 text-left text-xs font-bold transition-all cursor-pointer",
                          isCatSelected ? "bg-emerald-50/70 text-emerald-900" : "hover:bg-slate-50 text-slate-800"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-lg bg-slate-100">{renderCategoryIcon(cat.iconName)}</span>
                          <span className="truncate">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-full bg-slate-100 text-slate-600 px-1.5 py-0.2 text-[9.5px] font-bold">
                            {cat.masters.length}
                          </span>
                          <ChevronRight
                            className={cn(
                              "h-3.5 w-3.5 text-slate-400 transition-transform duration-200",
                              isExpanded && "rotate-90 text-emerald-700"
                            )}
                          />
                        </div>
                      </button>

                      {/* Sub-masters list */}
                      {isExpanded && (
                        <div className="bg-slate-50/50 border-t border-slate-100 p-1.5 space-y-1">
                          {cat.masters.map((m) => {
                            const isSubSelected = selectedSubMasterId === m.id;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  setSelectedCategoryGroup(cat.id);
                                  setSelectedSubMasterId(m.id);
                                }}
                                className={cn(
                                  "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer text-left",
                                  isSubSelected
                                    ? "bg-emerald-700 text-white font-bold shadow-2xs"
                                    : "text-slate-650 hover:bg-slate-100 hover:text-slate-900"
                                )}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className={cn("text-[9px] font-mono font-bold px-1 rounded", isSubSelected ? "bg-emerald-800 text-emerald-100" : "bg-slate-200 text-slate-600")}>
                                    {m.code}
                                  </span>
                                  <span className="truncate">{m.name}</span>
                                </div>
                                <span className={cn("text-[9.5px] font-bold px-1.5 py-0.2 rounded-full shrink-0", isSubSelected ? "bg-emerald-800 text-white" : "bg-slate-150 text-slate-500")}>
                                  {m.recordCount}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Master Records Table & Controls (8 Cols) */}
          <div className="lg:col-span-8 space-y-3">
            {/* Standard Operations Toolbar */}
            <OperationsToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search master code, name, category, or updated by…"
              activeFilterCount={activeFilterCount}
              onOpenFilters={() => setFilterDrawerOpen(true)}
              statusTabs={[
                { id: "all", label: "All Records" },
                { id: "active", label: "Active" },
                { id: "draft", label: "Draft" },
                { id: "inactive", label: "Inactive" },
                { id: "archived", label: "Archived" },
              ]}
              activeStatusTab={statusFilter}
              onStatusTabChange={setStatusFilter}
              selectionBar={
                <ModuleSelectionBar
                  count={selectedIds.size}
                  noun="record"
                  onClear={() => setSelectedIds(new Set())}
                  actions={[
                    {
                      label: "Details",
                      icon: <Eye className="h-3.5 w-3.5" />,
                      onClick: () => {
                        const first = filteredRecords.find((rec) => selectedIds.has(rec.id));
                        if (first) setSelectedRecord(first);
                      },
                    },
                    {
                      label: (() => {
                        const first = filteredRecords.find((rec) => selectedIds.has(rec.id));
                        return first?.status === "Active" ? "Deactivate" : "Activate";
                      })(),
                      onClick: () => {
                        const first = filteredRecords.find((rec) => selectedIds.has(rec.id));
                        if (first) handleToggleRecordStatus(first.id);
                      },
                    },
                  ]}
                />
              }
            />

            {/* Slide-over Filter Drawer */}
            <OperationsFilterDrawer
              open={filterDrawerOpen}
              onClose={() => setFilterDrawerOpen(false)}
              title="Filter Master Data Repositories"
              activeFilterCount={activeFilterCount}
              onReset={() => {
                setStatusFilter("all");
                setCategoryFilter("all");
                setSelectedCategoryGroup("all");
                setSelectedSubMasterId("all");
              }}
            >
              <div className="space-y-4 select-none">
                <FormField label="Master Record Status">
                  <SelectInput
                    value={statusFilter}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
                    className="w-full text-xs rounded-xl h-9 bg-white"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </SelectInput>
                </FormField>

                <FormField label="Category Group">
                  <SelectInput
                    value={categoryFilter}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryFilter(e.target.value)}
                    className="w-full text-xs rounded-xl h-9 bg-white"
                  >
                    <option value="all">All Category Groups</option>
                    <option value="Property Configuration">Property Configuration</option>
                    <option value="Workforce">Workforce</option>
                    <option value="Cleaning Operations">Cleaning Operations</option>
                    <option value="Inventory & Chemicals">Inventory & Chemicals</option>
                    <option value="Guest Services">Guest Services</option>
                    <option value="Financial">Financial</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Administration">Administration</option>
                  </SelectInput>
                </FormField>
              </div>
            </OperationsFilterDrawer>

            {/* Master Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 z-10">
                    <th className="w-10 px-3.5 py-3">
                      <input
                        type="checkbox"
                        checked={filteredRecords.length > 0 && filteredRecords.every((rec) => selectedIds.has(rec.id))}
                        onChange={() => {
                          const allIds = filteredRecords.map((rec) => rec.id);
                          const allSelected = allIds.every((id) => selectedIds.has(id));
                          setSelectedIds(allSelected ? new Set() : new Set(allIds));
                        }}
                        className="rounded border-slate-300"
                        aria-label="Select all"
                      />
                    </th>
                    <th className="px-3.5 py-3">Code</th>
                    <th className="px-3.5 py-3">Master Name / Subcategory</th>
                    <th className="px-3.5 py-3">Category Group</th>
                    <th className="px-3.5 py-3">Status</th>
                    <th className="px-3.5 py-3">Last Updated</th>
                    <th className="px-3.5 py-3">Updated By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((rec) => {
                      const isActive = rec.status === "Active";
                      const isDraft = rec.status === "Draft";
                      const isInactive = rec.status === "Inactive";

                      return (
                        <tr
                          key={rec.id}
                          className={cn(
                            "hover:bg-slate-50/60 transition-colors",
                            selectedIds.has(rec.id) && "bg-emerald-50/40",
                          )}
                        >
                          <td className="px-3.5 py-3">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(rec.id)}
                              onChange={() => {
                                const next = new Set(selectedIds);
                                if (next.has(rec.id)) next.delete(rec.id);
                                else next.add(rec.id);
                                setSelectedIds(next);
                              }}
                              className="rounded border-slate-300"
                              aria-label={`Select ${rec.code}`}
                            />
                          </td>
                          <td className="px-3.5 py-3 font-mono font-bold text-slate-600">{rec.code}</td>
                          <td className="px-3.5 py-3">
                            <p className="font-extrabold text-slate-900 leading-tight">{rec.name}</p>
                            <p className="text-[10px] text-slate-400 font-normal">{rec.subCategory} · {rec.version}</p>
                          </td>
                          <td className="px-3.5 py-3 text-slate-600 font-medium">{rec.categoryName}</td>
                          <td className="px-3.5 py-3">
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase border",
                                isActive
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : isDraft
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : isInactive
                                  ? "bg-slate-100 text-slate-600 border-slate-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                              )}
                            >
                              {rec.status}
                            </span>
                          </td>
                          <td className="px-3.5 py-3 text-slate-500 font-normal">{rec.lastUpdated}</td>
                          <td className="px-3.5 py-3 text-slate-600 font-medium">{rec.updatedBy}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400 font-medium">
                        No master records match your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SYNCHRONIZATION STATUS */}
      {activeTopTab === "sync" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MASTER_SYNC_STATUSES.map((sync) => (
              <div key={sync.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold">
                      <RefreshCw className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800">{sync.systemName}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold">{sync.integrationType}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[9px] font-extrabold uppercase">
                    {sync.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-[9.5px] font-bold text-slate-400 uppercase">Synced Records</p>
                    <p className="text-sm font-extrabold text-emerald-700 leading-tight">{sync.syncedRecords}</p>
                  </div>
                  <div>
                    <p className="text-[9.5px] font-bold text-slate-400 uppercase">Errors</p>
                    <p className="text-sm font-extrabold text-slate-700 leading-tight">{sync.failedRecords}</p>
                  </div>
                  <div>
                    <p className="text-[9.5px] font-bold text-slate-400 uppercase">Latency</p>
                    <p className="text-sm font-extrabold text-slate-700 leading-tight">&lt; 12ms</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Last Sync: <strong>{sync.lastSync}</strong></span>
                  <Button
                    variant="outline"
                    onClick={() => setToast({ message: `Manual resync triggered for ${sync.systemName}`, variant: "info" })}
                    className="py-1 px-2.5 text-[10px] font-bold rounded-lg border-slate-200 hover:bg-slate-100"
                  >
                    Force Resync
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CONFIGURATION REPORTS */}
      {activeTopTab === "reports" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: "Master Configuration Summary", desc: "Complete architectural breakdown of all 50+ master repositories.", icon: Layers },
            { title: "Inactive Masters & Audit", desc: "List of deactivated or archived master records and timestamps.", icon: Lock },
            { title: "Change History & Revisions", desc: "Version history and field delta changes across master updates.", icon: History },
            { title: "Cross-Module Dependency Report", desc: "Detailed matrix of operational modules consuming master records.", icon: ExternalLink },
            { title: "Synchronization Health Index", desc: "Latency and sync payload statistics for HR, ERP & Finance.", icon: RefreshCw },
          ].map((rpt, idx) => (
            <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
                  <rpt.icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800">{rpt.title}</h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-1 leading-snug">{rpt.desc}</p>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => setToast({ message: `Generating ${rpt.title}...`, variant: "info" })}
                className="w-full h-8 text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 rounded-xl flex items-center justify-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" /> Export PDF Report
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: CHANGE AUDIT LOGS */}
      {activeTopTab === "audit" && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 z-10">
                <th className="px-3.5 py-3">Timestamp</th>
                <th className="px-3.5 py-3">User</th>
                <th className="px-3.5 py-3">Master Repository</th>
                <th className="px-3.5 py-3">Record Code</th>
                <th className="px-3.5 py-3">Action</th>
                <th className="px-3.5 py-3">Old Value</th>
                <th className="px-3.5 py-3">New Value</th>
                <th className="px-3.5 py-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {MASTER_AUDIT_LOGS.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="px-3.5 py-3 text-slate-500 font-normal whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-3.5 py-3 font-bold text-slate-800">{log.user}</td>
                  <td className="px-3.5 py-3 text-slate-600 font-medium">{log.masterTable}</td>
                  <td className="px-3.5 py-3 font-mono font-bold text-slate-600">{log.recordCode}</td>
                  <td className="px-3.5 py-3">
                    <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[9px] font-extrabold uppercase">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 text-slate-500 font-normal max-w-xs truncate">{log.oldValue}</td>
                  <td className="px-3.5 py-3 text-slate-800 font-medium max-w-xs truncate">{log.newValue}</td>
                  <td className="px-3.5 py-3 text-slate-500 font-normal max-w-xs truncate">{log.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAILS DRAWER */}
      {selectedRecord && (
        <Drawer
          open={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={`Master Record: ${selectedRecord.code}`}
          width="md"
        >
          <div className="space-y-4 select-none pb-6">
            {/* Header Title Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-extrabold text-emerald-700">{selectedRecord.code}</span>
                <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[9px] font-extrabold uppercase">
                  {selectedRecord.status}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">{selectedRecord.name}</h3>
              <p className="text-xs text-slate-500 font-medium">{selectedRecord.subCategory} · Category: {selectedRecord.categoryName}</p>
            </div>

            {/* Basic Information & Properties */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Configuration Properties</h4>
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden text-xs">
                {Object.entries(selectedRecord.properties).map(([k, v], idx) => (
                  <div key={k} className={cn("flex justify-between p-2.5", idx % 2 === 0 ? "bg-slate-50/50" : "bg-white")}>
                    <span className="font-semibold text-slate-500">{k}</span>
                    <span className="font-bold text-slate-800">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Operational Dependencies Panel */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>Consuming Operational Modules</span>
                <span className="text-[10px] text-slate-400 font-normal">Read-only Integration</span>
              </h4>
              <div className="space-y-2">
                {selectedRecord.dependencies.map((dep, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 flex items-center justify-between shadow-2xs">
                    <div>
                      <p className="text-xs font-extrabold text-slate-800">{dep.moduleName}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{dep.usageType}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 text-emerald-800 px-2 py-0.5 text-[10px] font-bold border border-emerald-200">
                      {dep.activeUsageCount} Active References
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sync Information */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Synchronization & Audit</h4>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Source Integration:</span>
                  <strong className="text-slate-800">{selectedRecord.syncInfo.sourceSystem}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Last Sync:</span>
                  <strong className="text-slate-800">{selectedRecord.syncInfo.lastSync}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Last Updated By:</span>
                  <strong className="text-slate-800">{selectedRecord.updatedBy} ({selectedRecord.lastUpdated})</strong>
                </div>
              </div>
            </div>

            {/* Close Action */}
            <Button
              variant="outline"
              onClick={() => setSelectedRecord(null)}
              className="w-full h-9 text-xs font-bold border-slate-200 !bg-slate-100 text-slate-700 hover:!bg-slate-200 rounded-xl"
            >
              Close Drawer
            </Button>
          </div>
        </Drawer>
      )}

      {/* CREATE NEW MASTER RECORD DRAWER */}
      <Drawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        title="Register New Master Data Record"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 select-none">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Master Code" required>
              <TextInput
                value={newMasterCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMasterCode(e.target.value)}
                placeholder="e.g. MST-SOP-99"
                className="h-9 text-xs"
              />
            </FormField>

            <FormField label="Status" required>
              <SelectInput
                value={newMasterStatus}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewMasterStatus(e.target.value as any)}
                className="h-9 text-xs"
              >
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
              </SelectInput>
            </FormField>
          </div>

          <FormField label="Master Record Name" required>
            <TextInput
              value={newMasterName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMasterName(e.target.value)}
              placeholder="e.g. Presidential Suite Deep Clean Checklist"
              className="h-9 text-xs"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Category Group" required>
              <SelectInput
                value={newMasterCategory}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewMasterCategory(e.target.value)}
                className="h-9 text-xs"
              >
                <option value="Property Configuration">Property Configuration</option>
                <option value="Workforce">Workforce</option>
                <option value="Cleaning Operations">Cleaning Operations</option>
                <option value="Inventory & Chemicals">Inventory & Chemicals</option>
                <option value="Guest Services">Guest Services</option>
                <option value="Financial">Financial</option>
                <option value="Compliance">Compliance</option>
                <option value="Administration">Administration</option>
              </SelectInput>
            </FormField>

            <FormField label="Sub-Master Category" required>
              <TextInput
                value={newMasterSubCat}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMasterSubCat(e.target.value)}
                placeholder="e.g. Room Master / SLA Master"
                className="h-9 text-xs"
              />
            </FormField>
          </div>

          <FormField label="Description & Configuration Notes">
            <TextAreaInput
              value={newMasterDesc}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewMasterDesc(e.target.value)}
              placeholder="Provide detailed reference rules or configuration parameters..."
              rows={3}
              className="text-xs"
            />
          </FormField>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateDrawerOpen(false)}
              className="h-9 px-4 text-xs font-bold !bg-slate-100 hover:!bg-slate-200 text-slate-700 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-9 px-4 text-xs font-bold !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white rounded-xl shadow-2xs"
            >
              Save Master Record
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
