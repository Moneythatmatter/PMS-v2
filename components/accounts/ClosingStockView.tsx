"use client";

import React, { useState, useMemo } from "react";
import {
  Boxes,
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  FileText,
  Filter,
  Layers,
  Loader2,
  Printer,
  RotateCcw,
  Save,
  Search,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Plus,
  Edit2,
  Check,
  X,
  Send,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  StatMiniCard,
  Drawer,
  FODatePicker,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  sampleClosingStockData,
  sampleDepartmentStores,
  sampleValuationMethods,
  ClosingStockItem,
} from "@/app/data/accounts/closingStockData";
import { cn } from "@/lib/utils";

export function ClosingStockView() {
  // Desktop & Mobile filter visibility state
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Period & Store Parameters
  const [valuationDate, setValuationDate] = useState("2026-03-31");
  const [selectedStore, setSelectedStore] = useState("Main F&B Central Store");
  const [valuationMethod, setValuationMethod] = useState("Weighted Average Rate (Weighted Avg)");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // WINHMS Options Checkboxes
  const [showVariance, setShowVariance] = useState(true);
  const [excludeZeroStock, setExcludeZeroStock] = useState(true);
  const [autoUpdateLedger, setAutoUpdateLedger] = useState(true);
  const [includeConsignment, setIncludeConsignment] = useState(false);
  const [postDirectTrading, setPostDirectTrading] = useState(true);

  // Stock Items State
  const [items, setItems] = useState<ClosingStockItem[]>(sampleClosingStockData);
  const [searchQuery, setSearchQuery] = useState("");

  // Edit Inline State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPhysicalQty, setEditPhysicalQty] = useState<number>(0);
  const [editUnitRate, setEditUnitRate] = useState<number>(0);

  // Action Loading & Toast State
  const [isPostingGL, setIsPostingGL] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);

  // Unique Categories List
  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category));
    return ["All", ...Array.from(set)];
  }, [items]);

  // Valuation Method multiplier / rate adjustment algorithm
  const valuationMultiplier = useMemo(() => {
    if (valuationMethod.includes("FIFO")) return 1.02;
    if (valuationMethod.includes("LIFO")) return 0.98;
    if (valuationMethod.includes("Last Purchase")) return 1.04;
    return 1.0;
  }, [valuationMethod]);

  // Filtered Stock Data
  const filteredData = useMemo(() => {
    return items
      .filter((item) => {
        // Store Department Filter
        if (selectedStore.includes("F&B") && !item.category.startsWith("F&B")) {
          return false;
        }
        if (
          selectedStore.includes("Housekeeping") &&
          !(item.category.includes("Amenities") || item.category.includes("Linen"))
        ) {
          return false;
        }
        if (
          selectedStore.includes("Engineering") &&
          !item.category.includes("Maintenance")
        ) {
          return false;
        }

        // Category Filter
        if (selectedCategory !== "All" && item.category !== selectedCategory) {
          return false;
        }

        // Exclude Zero Qty Items
        if (excludeZeroStock && item.physicalQty <= 0) {
          return false;
        }

        // Search Filter (Code, Description, Category, GL Account)
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            item.itemCode.toLowerCase().includes(q) ||
            item.itemName.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q) ||
            item.glAccountName.toLowerCase().includes(q)
          );
        }

        return true;
      })
      .map((item) => ({
        ...item,
        totalValuation: Math.round(item.physicalQty * item.unitRate * valuationMultiplier),
      }));
  }, [
    items,
    selectedStore,
    selectedCategory,
    excludeZeroStock,
    searchQuery,
    valuationMultiplier,
  ]);

  // Statistics Summary
  const totalValuation = useMemo(() => {
    return filteredData.reduce((sum, i) => sum + i.totalValuation, 0);
  }, [filteredData]);

  const totalFbValuation = useMemo(() => {
    return filteredData
      .filter((i) => i.category.startsWith("F&B"))
      .reduce((sum, i) => sum + i.totalValuation, 0);
  }, [filteredData]);

  const totalHkLinenValuation = useMemo(() => {
    return filteredData
      .filter((i) => i.category.includes("Amenities") || i.category.includes("Linen"))
      .reduce((sum, i) => sum + i.totalValuation, 0);
  }, [filteredData]);

  const glPostedCount = useMemo(() => {
    return filteredData.filter((i) => i.status === "GL Posted").length;
  }, [filteredData]);

  // Handle Editing Inline Quantity & Rate
  const handleStartEdit = (item: ClosingStockItem) => {
    setEditingId(item.id);
    setEditPhysicalQty(item.physicalQty);
    setEditUnitRate(item.unitRate);
  };

  const handleSaveEdit = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newValuation = Math.round(editPhysicalQty * editUnitRate * valuationMultiplier);
          return {
            ...item,
            physicalQty: editPhysicalQty,
            unitRate: editUnitRate,
            totalValuation: newValuation,
            status: "Audited",
          };
        }
        return item;
      })
    );
    setEditingId(null);
    setToastMessage(`Updated stock quantity & valuation for item.`);
  };

  // Validation before opening Post to GL Confirmation Modal
  const handleInitiatePostGL = () => {
    if (filteredData.length === 0) {
      setToastMessage("Please select a store department with valid stock records to post to General Ledger.");
      return;
    }
    setShowPostModal(true);
  };

  // Bulk Post Stock Valuation to GL
  const handleConfirmPostGL = () => {
    setIsPostingGL(true);
    setTimeout(() => {
      setItems((prev) =>
        prev.map((item) => {
          if (filteredData.some((f) => f.id === item.id)) {
            return {
              ...item,
              status: "GL Posted",
            };
          }
          return item;
        })
      );
      setIsPostingGL(false);
      setShowPostModal(false);
      setToastMessage(
        `✓ Closing stock valuation posted successfully to General Ledger.`
      );
    }, 600);
  };

  // Shared Filter Form Controls Component
  const FilterFormContent = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
      {/* Box 1: Store & Period Selection */}
      <div className="lg:col-span-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-emerald-600" />
          Store Department & Period Date
        </p>

        <div className="space-y-2">
          <div>
            <label className="text-[11px] font-semibold text-slate-600">Store Department:</label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="mt-1 h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
            >
              {sampleDepartmentStores.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <FormField label="Valuation Date (As On)">
            <FODatePicker value={valuationDate} onChange={setValuationDate} />
          </FormField>
        </div>
      </div>

      {/* Box 2: Valuation Method & Category Filter */}
      <div className="lg:col-span-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" />
          Valuation Method & Stock Category
        </p>

        <div className="space-y-2">
          <div>
            <label className="text-[11px] font-semibold text-slate-600">Valuation Method:</label>
            <select
              value={valuationMethod}
              onChange={(e) => setValuationMethod(e.target.value)}
              className="mt-1 h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
            >
              {sampleValuationMethods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600">Stock Group / Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="mt-1 h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Box 3: WINHMS Posting & Audit Controls */}
      <div className="lg:col-span-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-emerald-600" />
          WINHMS Posting Parameters
        </p>

        <div className="grid grid-cols-2 gap-1.5 text-xs font-medium text-slate-700">
          <label className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={showVariance}
              onChange={(e) => setShowVariance(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span className="text-[11px] truncate">Show Variance Column</span>
          </label>

          <label className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={excludeZeroStock}
              onChange={(e) => setExcludeZeroStock(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span className="text-[11px] truncate">Exclude Zero Qty Items</span>
          </label>

          <label className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={autoUpdateLedger}
              onChange={(e) => setAutoUpdateLedger(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span className="text-[11px] truncate">Auto Update Inventory GL</span>
          </label>

          <label className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 border border-slate-200 cursor-pointer hover:border-emerald-300">
            <input
              type="checkbox"
              checked={includeConsignment}
              onChange={(e) => setIncludeConsignment(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span className="text-[11px] truncate">Include Consignment</span>
          </label>

          <label className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 border border-slate-200 cursor-pointer hover:border-emerald-300 col-span-2">
            <input
              type="checkbox"
              checked={postDirectTrading}
              onChange={(e) => setPostDirectTrading(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span className="text-[11px] truncate">Post Direct to Trading Account COGS</span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <ModulePageShell
      eyebrow="Accounts & Inventory Management"
      title="Closing Stock Entry & Valuation"
      description="Period-end physical inventory stock valuation, store balance entry, and automated General Ledger stock asset posting."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Transactions", href: "/accounts/transactions" },
        { label: "Closing Stock" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setIsSavingDraft(true);
              setTimeout(() => {
                setIsSavingDraft(false);
                setToastMessage("Saved Closing Stock draft valuation.");
              }, 400);
            }}
            disabled={isSavingDraft}
            className="rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            {isSavingDraft ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1 text-slate-600" />}
            Save Draft
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleInitiatePostGL}
            disabled={filteredData.length === 0 || isPostingGL}
            className={cn(
              "rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-all cursor-pointer",
              (filteredData.length === 0 || isPostingGL) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isPostingGL ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5 mr-1" />
            )}
            Post to General Ledger
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-medium bg-white shadow-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Print
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => alert("Closing Stock Sheet exported to CSV.")}
            className="rounded-xl text-xs font-medium bg-white shadow-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export CSV
          </Button>
        </div>
      }
    >
      {/* Top Controls Toolbar Bar */}
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
            <span>{showFilters ? "Hide Valuation Options" : "Valuation Controls & Options"}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                showFilters && "rotate-180"
              )}
            />
          </Button>

          {/* Mobile Filter Drawer Button */}
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
        </div>

        {/* Store & Date Badges */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            <Boxes className="h-3.5 w-3.5 text-emerald-700" />
            Store: {selectedStore}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-600" />
            As On: {valuationDate}
          </span>
        </div>
      </div>

      {/* Desktop Filter Panel */}
      {showFilters && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs animate-in fade-in-50">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Closing Stock Valuation Controls & Parameters
              </h3>
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕ Hide Options
            </button>
          </div>
          <FilterFormContent />
        </div>
      )}

      {/* Mobile Drawer */}
      <Drawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title="Closing Stock Options"
      >
        <div className="p-4">
          <FilterFormContent />
          <div className="mt-4 border-t border-slate-100 pt-3">
            <Button
              type="button"
              className="w-full bg-emerald-700 text-white"
              onClick={() => setMobileFilterOpen(false)}
            >
              Apply Parameters
            </Button>
          </div>
        </div>
      </Drawer>

      {/* KPI Stat Cards Grid */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <StatMiniCard
          label="Total Closing Stock Valuation"
          value={formatINR(totalValuation)}
          sublabel={`As on ${valuationDate} (${selectedStore})`}
          accent="#16a34a"
          icon={Boxes}
        />
        <StatMiniCard
          label="F&B Food & Beverage Stock"
          value={formatINR(totalFbValuation)}
          sublabel="Provisions & Bar inventory total"
          accent="#0284c7"
          icon={Building2}
        />
        <StatMiniCard
          label="Amenities & Linen Stock"
          value={formatINR(totalHkLinenValuation)}
          sublabel="Room amenities & linen asset"
          accent="#8b5cf6"
          icon={Layers}
        />
        <StatMiniCard
          label="GL Journal Posting Status"
          value={`${glPostedCount}/${items.length} Posted`}
          sublabel="General ledger voucher state"
          accent="#e11d48"
          icon={CheckCircle2}
        />
      </div>

      {/* Main Stock Valuation Table Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Closing Stock Inventory Entries ({filteredData.length} items)
            </h2>
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, item or GL account..."
              className="h-8 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Desktop Table View (hidden md:block) */}
        <div className="hidden md:block max-h-[540px] overflow-y-auto overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 w-28">Item Code</th>
                <th className="px-3.5 py-2.5 min-w-[180px]">Item Description</th>
                <th className="px-3 py-2.5 w-36">Category Group</th>
                <th className="px-2.5 py-2.5 text-center w-16">UOM</th>
                <th className="px-3 py-2.5 text-right w-24">Sys Qty</th>
                <th className="px-3 py-2.5 text-right w-28">Physical Qty</th>
                <th className="px-3 py-2.5 text-right w-24">Rate (₹)</th>
                <th className="px-3.5 py-2.5 text-right w-32">Total Value (₹)</th>
                {showVariance && <th className="px-3 py-2.5 text-right w-28">Variance (₹)</th>}
                <th className="px-3.5 py-2.5 w-44">GL Account Mapping</th>
                <th className="px-3 py-2.5 text-center w-24">Status</th>
                <th className="px-3 py-2.5 text-center w-20">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400 font-medium">
                    No inventory records found.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => {
                  const isEditing = editingId === row.id;
                  const varianceAmt = row.totalValuation - row.prevPeriodValue;

                  return (
                    <tr key={row.id} className="even:bg-slate-50/50 hover:bg-slate-100/80 transition-colors">
                      <td className="px-3 py-2.5 font-bold text-slate-900">{row.itemCode}</td>
                      <td className="px-3.5 py-2.5 font-semibold text-slate-800">{row.itemName}</td>
                      <td className="px-3 py-2.5 text-slate-600 text-[11px] font-medium">{row.category}</td>
                      <td className="px-2.5 py-2.5 text-center font-bold text-slate-700 bg-slate-50 rounded">
                        {row.uom}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-500 font-medium">{row.sysQty}</td>

                      {/* Physical Qty Column (Editable) */}
                      <td className="px-3 py-2.5 text-right font-bold">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editPhysicalQty}
                            onChange={(e) => setEditPhysicalQty(Number(e.target.value))}
                            className="h-7 w-20 rounded border border-emerald-500 bg-emerald-50/50 px-1.5 text-right text-xs font-bold text-slate-900 focus:outline-none"
                          />
                        ) : (
                          <span className={cn(row.physicalQty !== row.sysQty ? "text-amber-700" : "text-slate-900")}>
                            {row.physicalQty}
                          </span>
                        )}
                      </td>

                      {/* Rate Column (Editable) */}
                      <td className="px-3 py-2.5 text-right font-semibold">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editUnitRate}
                            onChange={(e) => setEditUnitRate(Number(e.target.value))}
                            className="h-7 w-20 rounded border border-emerald-500 bg-emerald-50/50 px-1.5 text-right text-xs font-bold text-slate-900 focus:outline-none"
                          />
                        ) : (
                          formatINR(row.unitRate)
                        )}
                      </td>

                      {/* Calculated Total Valuation */}
                      <td className="px-3.5 py-2.5 text-right font-bold text-emerald-800 text-xs">
                        {formatINR(isEditing ? editPhysicalQty * editUnitRate : row.totalValuation)}
                      </td>

                      {/* Variance Column */}
                      {showVariance && (
                        <td className="px-3 py-2.5 text-right font-medium text-xs">
                          <span className={cn(varianceAmt >= 0 ? "text-emerald-700 font-bold" : "text-rose-700 font-bold")}>
                            {varianceAmt >= 0 ? `+${formatINR(varianceAmt)}` : formatINR(varianceAmt)}
                          </span>
                        </td>
                      )}

                      <td className="px-3.5 py-2.5 text-[11px] text-slate-600 font-medium">
                        <span className="block font-bold text-slate-800">{row.glAccountCode}</span>
                        <span className="truncate block text-slate-500">{row.glAccountName}</span>
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={cn(
                            "inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
                            row.status === "GL Posted"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : row.status === "Audited"
                              ? "bg-blue-100 text-blue-800 border-blue-300"
                              : "bg-slate-100 text-slate-700 border-slate-300"
                          )}
                        >
                          {row.status}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(row.id)}
                              className="p-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 cursor-pointer"
                              title="Save Changes"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                              title="Cancel"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(row)}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                            title="Edit Stock Qty/Rate"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Cards View (md:hidden) */}
        <div className="md:hidden space-y-2.5">
          {filteredData.length === 0 ? (
            <div className="p-6 text-center text-slate-400 font-medium text-xs rounded-xl border border-slate-200 bg-white">
              No inventory records found.
            </div>
          ) : (
            filteredData.map((row) => (
              <div
                key={row.id}
                className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{row.itemCode} - {row.itemName}</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider",
                      row.status === "GL Posted"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : "bg-slate-100 text-slate-700 border-slate-300"
                    )}
                  >
                    {row.status}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 font-medium">Group: {row.category} ({row.uom})</p>

                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                  <span className="text-slate-500">Physical Qty: {row.physicalQty}</span>
                  <span className="font-bold text-emerald-800">
                    Valuation: {formatINR(row.totalValuation)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Confirmation Post to GL Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Confirm General Ledger Posting
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    GL Stock Asset Journal Posting
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 space-y-1.5">
                <p className="text-slate-700 leading-relaxed font-semibold">
                  You are about to post the selected closing stock valuation to the General Ledger.
                </p>
                <p className="text-[11px] text-emerald-800 font-medium">
                  This action will update accounting records.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Store Department:</span>
                  <strong className="text-slate-900">{selectedStore}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Valuation Total:</span>
                  <strong className="text-emerald-900 font-bold">{formatINR(totalValuation)}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPostModal(false)}
                className="rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={isPostingGL}
                onClick={handleConfirmPostGL}
                className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                {isPostingGL ? "Posting..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
