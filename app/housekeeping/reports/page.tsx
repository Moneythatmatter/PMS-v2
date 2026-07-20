"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  BarChart3,
  Download,
  Printer,
  Layers,
  FileText,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Clock,
  Sparkles,
  Bell,
  ArrowRightLeft,
  DollarSign,
  Package,
  Star,
  Eye,
  Play,
  Plus,
  Search,
  Calendar,
  User,
  Building,
  Filter,
  Check,
  RotateCcw,
  Mail,
  Sliders,
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
import {
  INITIAL_REPORT_TEMPLATES,
  INITIAL_RECENT_REPORTS,
  INITIAL_SCHEDULED_REPORTS,
  REPORT_CATEGORIES_LIST,
  HousekeepingReportTemplate,
  RecentReportEntry,
  ScheduledReportEntry,
} from "@/app/data/housekeepingReportsData";

type TopTabType = "library" | "charts" | "recent" | "scheduled";

export default function HousekeepingReportsCenterPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Main Tab State
  const [activeTopTab, setActiveTopTab] = useState<TopTabType>("library");

  // Report Templates State
  const [templates, setTemplates] = useState<HousekeepingReportTemplate[]>(INITIAL_REPORT_TEMPLATES);
  const [recentReports, setRecentReports] = useState<RecentReportEntry[]>(INITIAL_RECENT_REPORTS);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReportEntry[]>(INITIAL_SCHEDULED_REPORTS);

  // Library Category Filter
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [formatFilter, setFormatFilter] = useState("all");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Preview Drawer
  const [previewTemplate, setPreviewTemplate] = useState<HousekeepingReportTemplate | null>(null);

  // Report Builder Drawer State
  const [builderOpen, setBuilderOpen] = useState(false);

  // Builder Form Fields
  const [builderReportTitle, setBuilderReportTitle] = useState("Custom Operations Audit Report");
  const [builderCategory, setBuilderCategory] = useState("Operational Reports");
  const [builderDateRange, setBuilderDateRange] = useState("Last 7 Days");
  const [builderBuilding, setBuilderBuilding] = useState("All Buildings");
  const [builderFloor, setBuilderFloor] = useState("All Floors");
  const [builderRoomType, setBuilderRoomType] = useState("All Room Types");
  const [builderFormat, setBuilderFormat] = useState<"PDF" | "Excel" | "CSV">("PDF");

  // Toast
  const [toast, setToast] = useState<{ message: string; variant: "success" | "info" } | null>(null);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Toggle Pin / Favorite
  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isPinned: !t.isPinned } : t))
    );
    setToast({ message: "Report template favorites updated.", variant: "success" });
  };

  // Active Filter Count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "All") count++;
    if (showPinnedOnly) count++;
    if (formatFilter !== "all") count++;
    return count;
  }, [selectedCategory, showPinnedOnly, formatFilter]);

  // Filtered Templates List
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.code.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        selectedCategory === "All" || t.category === selectedCategory;

      const matchPinned = !showPinnedOnly || t.isPinned;
      const matchFormat =
        formatFilter === "all" || t.defaultFormat.toLowerCase() === formatFilter.toLowerCase();

      return matchSearch && matchCategory && matchPinned && matchFormat;
    });
  }, [templates, search, selectedCategory, showPinnedOnly, formatFilter]);

  // Trigger Mock Report Generation
  const handleGenerateReport = (t: HousekeepingReportTemplate) => {
    const newRecent: RecentReportEntry = {
      id: `REC-RPT-${Math.floor(100 + Math.random() * 900)}`,
      reportName: t.name,
      category: t.category,
      generatedBy: "Admin User",
      generatedTime: "Just Now",
      format: t.defaultFormat,
      fileSize: "2.1 MB",
      status: "Completed",
    };

    setRecentReports([newRecent, ...recentReports]);
    setToast({ message: `Generating report "${t.name}"... Download ready!`, variant: "success" });
  };

  // Save Custom Report Builder Submit
  const handleSaveBuilderReport = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecent: RecentReportEntry = {
      id: `REC-RPT-${Math.floor(100 + Math.random() * 900)}`,
      reportName: builderReportTitle,
      category: builderCategory,
      generatedBy: "Admin User",
      generatedTime: "Just Now",
      format: builderFormat,
      fileSize: "3.5 MB",
      status: "Completed",
    };

    setRecentReports([newRecent, ...recentReports]);
    setBuilderOpen(false);
    setToast({ message: `Custom Report "${builderReportTitle}" generated successfully!`, variant: "success" });
  };

  if (!isMounted) return null;

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
        eyebrow="Analytics & Intelligence"
        title="Housekeeping Reporting Center"
        description="Enterprise analytics, turnaround SLA benchmarks, inspection quality scores, laundry volume, inventory consumption, and automated report scheduling."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setToast({ message: "Compiling full Housekeeping Executive PDF Pack...", variant: "info" })}
              className="!bg-white hover:!bg-slate-100 !text-slate-700 !border-slate-200 flex items-center justify-center gap-1.5 rounded-xl h-8 px-3 text-xs font-bold shrink-0"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" /> Export PDF Pack
            </Button>

            <Button
              onClick={() => setBuilderOpen(true)}
              className="!bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white flex items-center justify-center gap-1.5 rounded-xl h-8 px-3.5 text-xs font-bold shrink-0 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" /> Build Custom Report
            </Button>
          </div>
        }
      />

      {/* 8 Top KPI Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <StatMiniCard label="Rooms Cleaned" value="124 Today" icon={CheckCircle2} accent="#10b981" />
        <StatMiniCard label="Inspection Pass %" value="94.2% Rate" icon={ShieldCheck} accent="#0284c7" />
        <StatMiniCard label="Avg Clean Time" value="24 Mins" icon={Clock} accent="#2563eb" />
        <StatMiniCard label="Pending Deep Clean" value="6 Rooms" icon={Sparkles} accent="#d97706" />
        <StatMiniCard label="Pending Guest Reqs" value="3 Active" icon={Bell} accent="#9333ea" />
        <StatMiniCard label="Laundry Turnaround" value="98.5% SLA" icon={ArrowRightLeft} accent="#0D9488" />
        <StatMiniCard label="Damage Recovery" value="₹45.0k INR" icon={DollarSign} accent="#dc2626" />
        <StatMiniCard label="Inventory Stocked" value="92% Par" icon={Package} accent="#64748b" />
      </div>

      {/* Top Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-4 text-xs font-bold uppercase tracking-wider">
          {[
            { id: "library", label: `Report Library (${templates.length})` },
            { id: "charts", label: "Analytics & Trend Charts" },
            { id: "recent", label: `Recent Generated (${recentReports.length})` },
            { id: "scheduled", label: `Scheduled Automation (${scheduledReports.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTopTab(tab.id as TopTabType)}
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

      {/* TAB 1: REPORT LIBRARY */}
      {activeTopTab === "library" && (
        <div className="space-y-4">
          {/* Categories Selector Bar */}
          <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedCategory("All")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border",
                  selectedCategory === "All"
                    ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                All Categories ({templates.length})
              </button>

              {REPORT_CATEGORIES_LIST.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border",
                    selectedCategory === cat
                      ? "bg-emerald-700 text-white border-emerald-700 shadow-2xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowPinnedOnly((prev) => !prev)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0 cursor-pointer",
                showPinnedOnly
                  ? "bg-amber-50 text-amber-900 border-amber-300"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              <Star className={cn("h-3.5 w-3.5", showPinnedOnly ? "fill-amber-400 text-amber-500" : "text-slate-400")} />
              <span>Favorites Only</span>
            </button>
          </div>

          {/* Standard Operations Toolbar */}
          <OperationsToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search report title, code, description..."
            activeFilterCount={activeFilterCount}
            onOpenFilters={() => setFilterDrawerOpen(true)}
            statusTabs={[
              { id: "all", label: "All Formats" },
              { id: "pdf", label: "PDF Reports" },
              { id: "excel", label: "Excel Sheets" },
              { id: "csv", label: "CSV Export" },
            ]}
            activeStatusTab={formatFilter}
            onStatusTabChange={setFormatFilter}
          />

          {/* Slide-over Filter Drawer */}
          <OperationsFilterDrawer
            open={filterDrawerOpen}
            onClose={() => setFilterDrawerOpen(false)}
            title="Filter Report Templates"
            activeFilterCount={activeFilterCount}
            onReset={() => {
              setSelectedCategory("All");
              setShowPinnedOnly(false);
              setFormatFilter("all");
            }}
          >
            <div className="space-y-4 select-none">
              <FormField label="Report Category">
                <SelectInput
                  value={selectedCategory}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value)}
                  className="w-full text-xs rounded-xl h-9 bg-white"
                >
                  <option value="All">All Categories</option>
                  {REPORT_CATEGORIES_LIST.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </SelectInput>
              </FormField>

              <FormField label="Default Export Format">
                <SelectInput
                  value={formatFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormatFilter(e.target.value)}
                  className="w-full text-xs rounded-xl h-9 bg-white"
                >
                  <option value="all">All Formats</option>
                  <option value="pdf">PDF Document</option>
                  <option value="excel">Excel Spreadsheet</option>
                  <option value="csv">CSV Data File</option>
                </SelectInput>
              </FormField>
            </div>
          </OperationsFilterDrawer>

          {/* Report Templates Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {t.code}
                        </span>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {t.category}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleTogglePin(t.id, e)}
                        className="p-1 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                        title={t.isPinned ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        <Star className={cn("h-4 w-4", t.isPinned && "fill-amber-400 text-amber-500")} />
                      </button>
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-900 leading-snug">{t.name}</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{t.description}</p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span>Last: <strong>{t.lastGenerated}</strong></span>
                      <span>By: <strong>{t.generatedBy}</strong></span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setPreviewTemplate(t)}
                        className="w-1/3 h-8 text-[11px] font-bold border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl"
                      >
                        <Eye className="h-3 w-3 mr-1 text-slate-500" /> Preview
                      </Button>

                      <Button
                        onClick={() => handleGenerateReport(t)}
                        className="w-2/3 h-8 text-[11px] font-bold !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white rounded-xl flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <Play className="h-3 w-3" /> Generate {t.defaultFormat}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 font-medium">
                No report templates match your active filters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ANALYTICAL CHARTS & TRENDS */}
      {activeTopTab === "charts" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Chart 1: Cleaning Trend */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-700" /> Average Cleaning Speed Trend
              </h4>
              <span className="text-[10px] text-slate-400 font-semibold">Target &le; 25 Mins</span>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Presidential & Executive Suites</span>
                  <span>38 Mins</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full w-[80%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Deluxe King Rooms</span>
                  <span>24 Mins</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full w-[60%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Standard Twin Stayover</span>
                  <span>18 Mins</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-600 rounded-full w-[45%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Chart 2: Inspection Pass % */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" /> Quality Audit Pass Ratio (94.2% Overall)
              </h4>
              <span className="text-[10px] text-slate-400 font-semibold">SLA Goal &ge; 90%</span>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>First-Pass Inspection Success</span>
                  <span>94.2%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full w-[94%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Re-cleaned After Failure</span>
                  <span>5.8%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full w-[15%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Chart 3: Laundry Volume */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-purple-600" /> Daily Laundry Throughput (1,250 Kg)
              </h4>
              <span className="text-[10px] text-slate-400 font-semibold">98.5% On-Time</span>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Guest Dry Cleaning & Express</span>
                  <span>350 Kg</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600 rounded-full w-[40%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Hotel Linen Stock Wash</span>
                  <span>900 Kg</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full w-[85%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Chart 4: Damage Recovery */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-red-600" /> Guest Damage Folio Recovery
              </h4>
              <span className="text-[10px] text-slate-400 font-semibold">₹45,000 INR Total</span>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Electronics / TV Damage</span>
                  <span>₹35,000 (78%)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-600 rounded-full w-[78%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold text-slate-700 mb-1">
                  <span>Linen & Bedding Stains</span>
                  <span>₹10,000 (22%)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full w-[22%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RECENT GENERATED REPORTS */}
      {activeTopTab === "recent" && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 z-10">
                <th className="px-3.5 py-3">Report Name</th>
                <th className="px-3.5 py-3">Category</th>
                <th className="px-3.5 py-3">Generated By</th>
                <th className="px-3.5 py-3">Timestamp</th>
                <th className="px-3.5 py-3">Format</th>
                <th className="px-3.5 py-3">Size</th>
                <th className="px-3.5 py-3">Status</th>
                <th className="px-3.5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {recentReports.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-3.5 py-3 font-extrabold text-slate-900">{r.reportName}</td>
                  <td className="px-3.5 py-3 text-slate-600 font-medium">{r.category}</td>
                  <td className="px-3.5 py-3 text-slate-700 font-bold">{r.generatedBy}</td>
                  <td className="px-3.5 py-3 text-slate-500 font-normal">{r.generatedTime}</td>
                  <td className="px-3.5 py-3">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      {r.format}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 text-slate-500 font-normal">{r.fileSize}</td>
                  <td className="px-3.5 py-3">
                    <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[9px] font-extrabold uppercase">
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 text-right whitespace-nowrap">
                    <Button
                      variant="outline"
                      onClick={() => setToast({ message: `Downloading ${r.reportName}.${r.format.toLowerCase()}`, variant: "info" })}
                      className="py-1 px-2.5 text-[10px] font-bold text-slate-700 border-slate-200 rounded-lg inline-flex items-center gap-1 hover:bg-slate-100"
                    >
                      <Download className="h-3 w-3 text-slate-500" /> Download
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: SCHEDULED AUTOMATED REPORTS */}
      {activeTopTab === "scheduled" && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 z-10">
                <th className="px-3.5 py-3">Report Title</th>
                <th className="px-3.5 py-3">Frequency</th>
                <th className="px-3.5 py-3">Email Recipients</th>
                <th className="px-3.5 py-3">Next Scheduled Run</th>
                <th className="px-3.5 py-3">Status</th>
                <th className="px-3.5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {scheduledReports.map((sch) => (
                <tr key={sch.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-3.5 py-3 font-extrabold text-slate-900">{sch.reportName}</td>
                  <td className="px-3.5 py-3 text-slate-700 font-bold">{sch.frequency}</td>
                  <td className="px-3.5 py-3 text-slate-500 font-normal">{sch.recipients.join(", ")}</td>
                  <td className="px-3.5 py-3 text-emerald-700 font-extrabold">{sch.nextRun}</td>
                  <td className="px-3.5 py-3">
                    <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[9px] font-extrabold uppercase">
                      {sch.status}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 text-right space-x-1.5 whitespace-nowrap">
                    <Button
                      variant="outline"
                      onClick={() => setToast({ message: `Triggered manual execution for ${sch.reportName}`, variant: "info" })}
                      className="py-1 px-2 text-[10px] font-bold text-slate-700 border-slate-200 rounded-lg inline-flex items-center gap-1 hover:bg-slate-100"
                    >
                      <Play className="h-3 w-3 text-slate-500" /> Run Now
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PREVIEW REPORT DRAWER */}
      {previewTemplate && (
        <Drawer
          open={!!previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          title={`Report Preview: ${previewTemplate.name}`}
          width="md"
        >
          <div className="space-y-4 select-none pb-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
              <span className="font-mono text-xs font-extrabold text-emerald-700">{previewTemplate.code}</span>
              <h3 className="text-base font-extrabold text-slate-900">{previewTemplate.name}</h3>
              <p className="text-xs text-slate-500 font-medium">Category: {previewTemplate.category}</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Report Description</h4>
              <p className="text-xs text-slate-600 font-normal leading-relaxed rounded-xl border border-slate-200 p-3">
                {previewTemplate.description}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Default Format:</span>
                <span className="font-bold text-slate-800">{previewTemplate.defaultFormat} Document</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Automated Schedule:</span>
                <span className="font-bold text-slate-800">{previewTemplate.frequency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Last Generated By:</span>
                <span className="font-bold text-slate-800">{previewTemplate.generatedBy} ({previewTemplate.lastGenerated})</span>
              </div>
            </div>

            <Button
              onClick={() => {
                handleGenerateReport(previewTemplate);
                setPreviewTemplate(null);
              }}
              className="w-full h-9 text-xs font-bold !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white rounded-xl shadow-2xs"
            >
              Generate Report Now
            </Button>
          </div>
        </Drawer>
      )}

      {/* CUSTOM REPORT BUILDER DRAWER */}
      <Drawer
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        title="Custom Report Builder"
      >
        <form onSubmit={handleSaveBuilderReport} className="space-y-4 select-none pb-6">
          <FormField label="Report Title" required>
            <TextInput
              value={builderReportTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBuilderReportTitle(e.target.value)}
              className="h-9 text-xs"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Report Category" required>
              <SelectInput
                value={builderCategory}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBuilderCategory(e.target.value)}
                className="h-9 text-xs"
              >
                {REPORT_CATEGORIES_LIST.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </SelectInput>
            </FormField>

            <FormField label="Date Range Period" required>
              <SelectInput
                value={builderDateRange}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBuilderDateRange(e.target.value)}
                className="h-9 text-xs"
              >
                <option value="Today">Today</option>
                <option value="Yesterday">Yesterday</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="This Month">This Month</option>
              </SelectInput>
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Building">
              <SelectInput
                value={builderBuilding}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBuilderBuilding(e.target.value)}
                className="h-9 text-xs"
              >
                <option value="All Buildings">All Buildings</option>
                <option value="East Tower">East Tower</option>
                <option value="West Wing">West Wing</option>
              </SelectInput>
            </FormField>

            <FormField label="Floor">
              <SelectInput
                value={builderFloor}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBuilderFloor(e.target.value)}
                className="h-9 text-xs"
              >
                <option value="All Floors">All Floors</option>
                <option value="Floor 1">Floor 1</option>
                <option value="Floor 2">Floor 2</option>
                <option value="Floor 3">Floor 3</option>
              </SelectInput>
            </FormField>

            <FormField label="Room Type">
              <SelectInput
                value={builderRoomType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBuilderRoomType(e.target.value)}
                className="h-9 text-xs"
              >
                <option value="All Room Types">All Types</option>
                <option value="Presidential Suite">Presidential Suite</option>
                <option value="Deluxe King">Deluxe King</option>
              </SelectInput>
            </FormField>
          </div>

          <FormField label="Output Export Format" required>
            <SelectInput
              value={builderFormat}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBuilderFormat(e.target.value as any)}
              className="h-9 text-xs"
            >
              <option value="PDF">PDF Document (.pdf)</option>
              <option value="Excel">Excel Spreadsheet (.xlsx)</option>
              <option value="CSV">CSV Data File (.csv)</option>
            </SelectInput>
          </FormField>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBuilderOpen(false)}
              className="h-9 px-4 text-xs font-bold !bg-slate-100 text-slate-700 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-9 px-4 text-xs font-bold !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white rounded-xl shadow-2xs"
            >
              Compile Report
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
