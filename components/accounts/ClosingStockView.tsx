"use client";

import React, { useState, useMemo } from "react";
import {
  Boxes,
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  Filter,
  Layers,
  Loader2,
  Printer,
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
  Trash2,
  ShieldCheck,
  RotateCcw,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  StatMiniCard,
  Drawer,
  FODatePicker,
  TextInput,
  SelectInput,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { accClosingStockService, type ClosingStockItem } from "@/services/accounts";
import {
  accErrorMessage,
  formatDate,
  formatINR,
  todayIso,
  useAccLookups,
  useAccQuery,
} from "@/components/accounts/accountsApi";
import { cn } from "@/lib/utils";

const VALUATION_METHODS = ["Weighted Average", "FIFO", "Last Purchase Rate", "Standard Cost"];
const STATUS_OPTIONS = ["All", "Draft", "Audited", "GL Posted"] as const;

type ItemForm = {
  valuationDate: string;
  storeName: string;
  valuationMethod: string;
  itemCode: string;
  itemName: string;
  category: string;
  uom: string;
  sysQty: string;
  physicalQty: string;
  unitRate: string;
  prevPeriodValue: string;
  stockAccountId: string;
  consumptionAccountId: string;
  status: "Draft" | "Audited";
  lastAuditDate: string;
};

const emptyForm = (): ItemForm => ({
  valuationDate: todayIso(),
  storeName: "",
  valuationMethod: VALUATION_METHODS[0],
  itemCode: "",
  itemName: "",
  category: "",
  uom: "Nos",
  sysQty: "0",
  physicalQty: "0",
  unitRate: "0",
  prevPeriodValue: "0",
  stockAccountId: "",
  consumptionAccountId: "",
  status: "Draft",
  lastAuditDate: "",
});

const formFromItem = (i: ClosingStockItem): ItemForm => ({
  valuationDate: i.valuationDate,
  storeName: i.storeName,
  valuationMethod: i.valuationMethod,
  itemCode: i.itemCode,
  itemName: i.itemName,
  category: i.category,
  uom: i.uom,
  sysQty: String(i.sysQty),
  physicalQty: String(i.physicalQty),
  unitRate: String(i.unitRate),
  prevPeriodValue: String(i.prevPeriodValue),
  stockAccountId: i.stockAccountId ?? "",
  consumptionAccountId: i.consumptionAccountId ?? "",
  status: i.status === "Audited" ? "Audited" : "Draft",
  lastAuditDate: i.lastAuditDate ?? "",
});

function csvCell(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function ClosingStockView() {
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [valuationDate, setValuationDate] = useState("All");
  const [selectedStore, setSelectedStore] = useState("All");
  const [valuationMethod, setValuationMethod] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("All");

  const [showVariance, setShowVariance] = useState(true);
  const [excludeZeroStock, setExcludeZeroStock] = useState(false);

  const { data: items, loading, error, reload } = useAccQuery(() => accClosingStockService.list(), []);
  const { lookups } = useAccLookups();
  const [searchQuery, setSearchQuery] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPhysicalQty, setEditPhysicalQty] = useState<number>(0);
  const [editUnitRate, setEditUnitRate] = useState<number>(0);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClosingStockItem | null>(null);
  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [isPostingGL, setIsPostingGL] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postingDate, setPostingDate] = useState("");
  const [postError, setPostError] = useState<string | null>(null);

  const notify = (message: string, variant: "success" | "error" = "success") => setToast({ message, variant });

  const allItems = useMemo(() => items ?? [], [items]);

  const { valuationDates, stores, methods, categories } = useMemo(() => {
    const distinct = (pick: (i: ClosingStockItem) => string) =>
      Array.from(new Set(allItems.map(pick).filter(Boolean))).sort();
    return {
      valuationDates: distinct((i) => i.valuationDate).reverse(),
      stores: distinct((i) => i.storeName),
      methods: distinct((i) => i.valuationMethod),
      categories: distinct((i) => i.category),
    };
  }, [allItems]);

  const stockLedgers = useMemo(() => {
    const assets = (lookups?.ledgers ?? []).filter((l) => l.nature === "Asset");
    const stock = assets.filter((l) => l.category === "Stock");
    return stock.length ? stock : assets;
  }, [lookups]);
  const consumptionLedgers = useMemo(
    () => (lookups?.ledgers ?? []).filter((l) => l.nature === "Expense"),
    [lookups],
  );

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allItems.filter((item) => {
      if (valuationDate !== "All" && item.valuationDate !== valuationDate) return false;
      if (selectedStore !== "All" && item.storeName !== selectedStore) return false;
      if (valuationMethod !== "All" && item.valuationMethod !== valuationMethod) return false;
      if (selectedCategory !== "All" && item.category !== selectedCategory) return false;
      if (statusFilter !== "All" && item.status !== statusFilter) return false;
      if (excludeZeroStock && item.physicalQty <= 0) return false;
      if (q) {
        return [item.itemCode, item.itemName, item.category, item.storeName, item.stockAccountName, item.consumptionAccountName]
          .some((v) => (v ?? "").toLowerCase().includes(q));
      }
      return true;
    });
  }, [allItems, valuationDate, selectedStore, valuationMethod, selectedCategory, statusFilter, excludeZeroStock, searchQuery]);

  const totalValuation = useMemo(() => filteredData.reduce((s, i) => s + i.totalValuation, 0), [filteredData]);
  const totalChange = useMemo(() => filteredData.reduce((s, i) => s + i.changeFromPrev, 0), [filteredData]);
  const totalVariance = useMemo(() => filteredData.reduce((s, i) => s + i.varianceValue, 0), [filteredData]);
  const glPostedCount = useMemo(() => filteredData.filter((i) => i.status === "GL Posted").length, [filteredData]);

  const unposted = useMemo(() => filteredData.filter((i) => i.status !== "GL Posted"), [filteredData]);
  const draftUnposted = useMemo(() => unposted.filter((i) => i.status === "Draft"), [unposted]);
  const unmappedUnposted = useMemo(
    () => unposted.filter((i) => !i.stockAccountId || !i.consumptionAccountId),
    [unposted],
  );
  const unpostedChange = useMemo(() => unposted.reduce((s, i) => s + i.changeFromPrev, 0), [unposted]);

  const handleStartEdit = (item: ClosingStockItem) => {
    setEditingId(item.id);
    setEditPhysicalQty(item.physicalQty);
    setEditUnitRate(item.unitRate);
  };

  const handleSaveEdit = async (id: string) => {
    setBusy(true);
    try {
      await accClosingStockService.update(id, { physicalQty: editPhysicalQty, unitRate: editUnitRate });
      setEditingId(null);
      notify("Updated stock quantity & valuation for item.");
      await reload();
    } catch (e) {
      notify(accErrorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (item: ClosingStockItem, status: "Draft" | "Audited") => {
    setBusy(true);
    try {
      await accClosingStockService.update(item.id, {
        status,
        ...(status === "Audited" ? { lastAuditDate: todayIso() } : {}),
      });
      notify(`${item.itemCode} marked ${status}.`);
      await reload();
    } catch (e) {
      notify(accErrorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  const handleAuditAll = async () => {
    if (draftUnposted.length === 0) return;
    if (!window.confirm(`Mark ${draftUnposted.length} draft item(s) as Audited?`)) return;
    setBusy(true);
    let done = 0;
    try {
      for (const item of draftUnposted) {
        await accClosingStockService.update(item.id, { status: "Audited", lastAuditDate: todayIso() });
        done++;
      }
      notify(`${done} item(s) marked Audited.`);
    } catch (e) {
      notify(`${done} item(s) audited. ${accErrorMessage(e)}`, "error");
    } finally {
      setBusy(false);
      await reload();
    }
  };

  const handleDelete = async (item: ClosingStockItem) => {
    if (!window.confirm(`Delete closing stock entry ${item.itemCode} – ${item.itemName}?`)) return;
    setBusy(true);
    try {
      await accClosingStockService.remove(item.id);
      notify(`Deleted ${item.itemCode}.`);
      await reload();
    } catch (e) {
      notify(accErrorMessage(e), "error");
    } finally {
      setBusy(false);
    }
  };

  const openCreate = () => {
    const f = emptyForm();
    if (valuationDate !== "All") f.valuationDate = valuationDate;
    if (selectedStore !== "All") f.storeName = selectedStore;
    setEditingItem(null);
    setForm(f);
    setFormError(null);
    setDrawerOpen(true);
  };

  const openEdit = (item: ClosingStockItem) => {
    setEditingItem(item);
    setForm(formFromItem(item));
    setFormError(null);
    setDrawerOpen(true);
  };

  const setField = <K extends keyof ItemForm>(key: K, value: ItemForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmitForm = async () => {
    const body: Partial<ClosingStockItem> = {
      valuationDate: form.valuationDate,
      storeName: form.storeName.trim(),
      valuationMethod: form.valuationMethod,
      itemCode: form.itemCode.trim(),
      itemName: form.itemName.trim(),
      category: form.category.trim(),
      uom: form.uom.trim(),
      sysQty: Number(form.sysQty) || 0,
      physicalQty: Number(form.physicalQty) || 0,
      unitRate: Number(form.unitRate) || 0,
      prevPeriodValue: Number(form.prevPeriodValue) || 0,
      stockAccountId: form.stockAccountId || null,
      consumptionAccountId: form.consumptionAccountId || null,
      status: form.status,
      lastAuditDate: form.lastAuditDate || (form.status === "Audited" ? todayIso() : null),
    };
    setBusy(true);
    setFormError(null);
    try {
      if (editingItem) await accClosingStockService.update(editingItem.id, body);
      else await accClosingStockService.create(body);
      setDrawerOpen(false);
      notify(editingItem ? `Updated ${body.itemCode}.` : `Added ${body.itemCode} to closing stock.`);
      await reload();
    } catch (e) {
      setFormError(accErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const handleInitiatePostGL = () => {
    if (unposted.length === 0) {
      notify("No unposted closing stock items in the current filter.", "error");
      return;
    }
    setPostError(null);
    setPostingDate("");
    setShowPostModal(true);
  };

  const handleConfirmPostGL = async () => {
    setIsPostingGL(true);
    setPostError(null);
    try {
      const res = await accClosingStockService.post({
        itemIds: unposted.map((i) => i.id),
        ...(postingDate ? { postingDate } : {}),
      });
      setShowPostModal(false);
      notify(
        res.voucher
          ? `✓ ${res.posted} item(s) posted to General Ledger — Journal ${res.voucher.voucherNo}.`
          : `✓ ${res.posted} item(s) marked GL Posted (no stock movement to journalise).`,
      );
      await reload();
    } catch (e) {
      setPostError(accErrorMessage(e));
    } finally {
      setIsPostingGL(false);
    }
  };

  const handleExportCsv = () => {
    const header = [
      "Valuation Date", "Store", "Method", "Item Code", "Item Name", "Category", "UOM", "Sys Qty", "Physical Qty",
      "Rate", "Total Value", "Variance Qty", "Variance Value", "Prev Period Value", "Change vs Prev",
      "Stock Account", "Consumption Account", "Status", "Last Audit",
    ];
    const rows = filteredData.map((i) => [
      i.valuationDate, i.storeName, i.valuationMethod, i.itemCode, i.itemName, i.category, i.uom, i.sysQty,
      i.physicalQty, i.unitRate, i.totalValuation, i.varianceQty, i.varianceValue, i.prevPeriodValue,
      i.changeFromPrev, i.stockAccountName, i.consumptionAccountName, i.status, i.lastAuditDate,
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `closing-stock-${valuationDate === "All" ? todayIso() : valuationDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectClass =
    "mt-1 h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none";

  const renderFilterForm = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
      <div className="lg:col-span-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-emerald-600" />
          Store Department & Period Date
        </p>

        <div className="space-y-2">
          <div>
            <label className="text-[11px] font-semibold text-slate-600">Store Department:</label>
            <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} className={cn(selectClass, "font-bold")}>
              <option value="All">All stores</option>
              {stores.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600">Valuation Date (As On):</label>
            <select value={valuationDate} onChange={(e) => setValuationDate(e.target.value)} className={selectClass}>
              <option value="All">All valuation dates</option>
              {valuationDates.map((d) => (
                <option key={d} value={d}>
                  {formatDate(d)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600" />
          Valuation Method & Stock Category
        </p>

        <div className="space-y-2">
          <div>
            <label className="text-[11px] font-semibold text-slate-600">Valuation Method:</label>
            <select value={valuationMethod} onChange={(e) => setValuationMethod(e.target.value)} className={selectClass}>
              <option value="All">All methods</option>
              {methods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600">Stock Group / Category:</label>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className={selectClass}>
              <option value="All">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 rounded-xl bg-slate-50/70 p-3.5 border border-slate-200/70 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-emerald-600" />
          Status & Display Options
        </p>

        <div>
          <label className="text-[11px] font-semibold text-slate-600">Entry Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_OPTIONS)[number])}
            className={selectClass}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All statuses" : s}
              </option>
            ))}
          </select>
        </div>

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
        </div>
      </div>
    </div>
  );

  const statusBadge = (status: ClosingStockItem["status"]) => (
    <span
      className={cn(
        "inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
        status === "GL Posted"
          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
          : status === "Audited"
          ? "bg-blue-100 text-blue-800 border-blue-300"
          : "bg-slate-100 text-slate-700 border-slate-300",
      )}
    >
      {status}
    </span>
  );

  const colCount = showVariance ? 12 : 11;

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
      toast={toast?.message ?? null}
      toastVariant={toast?.variant}
      onDismissToast={() => setToast(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={openCreate}
            className="rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1 text-slate-600" />
            Add Item
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleAuditAll}
            disabled={busy || draftUnposted.length === 0}
            className="rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5 mr-1 text-slate-600" />}
            Mark Audited ({draftUnposted.length})
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleInitiatePostGL}
            disabled={unposted.length === 0 || isPostingGL}
            className={cn(
              "rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-all cursor-pointer",
              (unposted.length === 0 || isPostingGL) && "opacity-50 cursor-not-allowed",
            )}
          >
            {isPostingGL ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1" />}
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
            onClick={handleExportCsv}
            disabled={filteredData.length === 0}
            className="rounded-xl text-xs font-medium bg-white shadow-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export CSV
          </Button>
        </div>
      }
    >
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
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", showFilters && "rotate-180")} />
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
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
            <Boxes className="h-3.5 w-3.5 text-emerald-700" />
            Store: {selectedStore === "All" ? "All stores" : selectedStore}
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
            <Calendar className="h-3.5 w-3.5 text-slate-600" />
            As On: {valuationDate === "All" ? "All dates" : formatDate(valuationDate)}
          </span>
        </div>
      </div>

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
          {renderFilterForm()}
        </div>
      )}

      <Drawer open={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)} title="Closing Stock Options">
        <div className="p-4">
          {renderFilterForm()}
          <div className="mt-4 border-t border-slate-100 pt-3">
            <Button type="button" className="w-full bg-emerald-700 text-white" onClick={() => setMobileFilterOpen(false)}>
              Apply Parameters
            </Button>
          </div>
        </div>
      </Drawer>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <StatMiniCard
          label="Total Closing Stock Valuation"
          value={formatINR(totalValuation)}
          sublabel={`${filteredData.length} item(s) in view`}
          accent="#16a34a"
          icon={Boxes}
        />
        <StatMiniCard
          label="Change vs Previous Period"
          value={formatINR(totalChange)}
          sublabel="Stock movement to be journalised"
          accent="#0284c7"
          icon={totalChange >= 0 ? TrendingUp : TrendingDown}
        />
        <StatMiniCard
          label="Physical vs System Variance"
          value={formatINR(totalVariance)}
          sublabel="Count shortage / excess value"
          accent="#8b5cf6"
          icon={Layers}
        />
        <StatMiniCard
          label="GL Journal Posting Status"
          value={`${glPostedCount}/${filteredData.length} Posted`}
          sublabel={`${draftUnposted.length} draft · ${unposted.length - draftUnposted.length} audited`}
          accent="#e11d48"
          icon={CheckCircle2}
        />
      </div>

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

        {error && (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              {error}
            </span>
            <Button type="button" size="sm" variant="outline" onClick={() => void reload()}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Retry
            </Button>
          </div>
        )}

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
                <th className="px-3 py-2.5 text-center w-32">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading && !items ? (
                <tr>
                  <td colSpan={colCount} className="py-8 text-center text-slate-400 font-medium">
                    <Loader2 className="mx-auto mb-1 h-4 w-4 animate-spin" />
                    Loading closing stock…
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="py-8 text-center text-slate-400 font-medium">
                    {allItems.length === 0 ? "No closing stock entries yet. Use Add Item to record a count." : "No inventory records match the filters."}
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => {
                  const isEditing = editingId === row.id;
                  const posted = row.status === "GL Posted";

                  return (
                    <tr key={row.id} className="even:bg-slate-50/50 hover:bg-slate-100/80 transition-colors">
                      <td className="px-3 py-2.5 font-bold text-slate-900">
                        {row.itemCode}
                        <span className="block text-[10px] font-medium text-slate-500">{formatDate(row.valuationDate)}</span>
                      </td>
                      <td className="px-3.5 py-2.5 font-semibold text-slate-800">
                        {row.itemName}
                        <span className="block text-[10px] font-medium text-slate-500">{row.storeName} · {row.valuationMethod}</span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 text-[11px] font-medium">{row.category || "—"}</td>
                      <td className="px-2.5 py-2.5 text-center font-bold text-slate-700 bg-slate-50 rounded">{row.uom}</td>
                      <td className="px-3 py-2.5 text-right text-slate-500 font-medium">{row.sysQty}</td>

                      <td className="px-3 py-2.5 text-right font-bold">
                        {isEditing ? (
                          <input
                            type="number"
                            min={0}
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

                      <td className="px-3 py-2.5 text-right font-semibold">
                        {isEditing ? (
                          <input
                            type="number"
                            min={0}
                            value={editUnitRate}
                            onChange={(e) => setEditUnitRate(Number(e.target.value))}
                            className="h-7 w-20 rounded border border-emerald-500 bg-emerald-50/50 px-1.5 text-right text-xs font-bold text-slate-900 focus:outline-none"
                          />
                        ) : (
                          formatINR(row.unitRate)
                        )}
                      </td>

                      <td className="px-3.5 py-2.5 text-right font-bold text-emerald-800 text-xs">
                        {formatINR(isEditing ? editPhysicalQty * editUnitRate : row.totalValuation)}
                        <span className="block text-[10px] font-medium text-slate-500">
                          Prev {formatINR(row.prevPeriodValue, { decimals: 0 })}
                        </span>
                      </td>

                      {showVariance && (
                        <td className="px-3 py-2.5 text-right font-medium text-xs">
                          <span className={cn(row.varianceValue >= 0 ? "text-emerald-700 font-bold" : "text-rose-700 font-bold")}>
                            {row.varianceValue >= 0 ? `+${formatINR(row.varianceValue)}` : formatINR(row.varianceValue)}
                          </span>
                          <span className="block text-[10px] text-slate-500">
                            {row.varianceQty >= 0 ? "+" : ""}
                            {row.varianceQty} {row.uom}
                          </span>
                        </td>
                      )}

                      <td className="px-3.5 py-2.5 text-[11px] text-slate-600 font-medium">
                        <span className={cn("block truncate font-bold", row.stockAccountName ? "text-slate-800" : "text-rose-600")}>
                          {row.stockAccountName ?? "Stock A/c not mapped"}
                        </span>
                        <span className={cn("truncate block", row.consumptionAccountName ? "text-slate-500" : "text-rose-600")}>
                          {row.consumptionAccountName ?? "Consumption A/c not mapped"}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-center">{statusBadge(row.status)}</td>

                      <td className="px-3 py-2.5 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handleSaveEdit(row.id)}
                              className="p-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 cursor-pointer disabled:opacity-50"
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
                        ) : posted ? (
                          <span className="text-[10px] font-medium text-slate-400">Read-only</span>
                        ) : (
                          <div className="flex items-center justify-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(row)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                              title="Edit Stock Qty/Rate"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(row)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                              title="Edit Details & GL Mapping"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void setStatus(row, row.status === "Draft" ? "Audited" : "Draft")}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-blue-700 transition-colors cursor-pointer disabled:opacity-50"
                              title={row.status === "Draft" ? "Mark Audited" : "Revert to Draft"}
                            >
                              {row.status === "Draft" ? <ShieldCheck className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handleDelete(row)}
                              className="p-1.5 rounded hover:bg-rose-50 text-slate-600 hover:text-rose-700 transition-colors cursor-pointer disabled:opacity-50"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-2.5">
          {loading && !items ? (
            <div className="p-6 text-center text-slate-400 font-medium text-xs rounded-xl border border-slate-200 bg-white">
              Loading closing stock…
            </div>
          ) : filteredData.length === 0 ? (
            <div className="p-6 text-center text-slate-400 font-medium text-xs rounded-xl border border-slate-200 bg-white">
              No inventory records found.
            </div>
          ) : (
            filteredData.map((row) => (
              <div key={row.id} className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">
                    {row.itemCode} - {row.itemName}
                  </span>
                  {statusBadge(row.status)}
                </div>

                <p className="text-[11px] text-slate-600 font-medium">
                  {row.storeName} · Group: {row.category || "—"} ({row.uom}) · {formatDate(row.valuationDate)}
                </p>

                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                  <span className="text-slate-500">Physical Qty: {row.physicalQty}</span>
                  <span className="font-bold text-emerald-800">Valuation: {formatINR(row.totalValuation)}</span>
                </div>

                {row.status !== "GL Posted" && (
                  <div className="flex justify-end gap-1.5 pt-1">
                    <Button type="button" size="sm" variant="outline" onClick={() => openEdit(row)}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void setStatus(row, row.status === "Draft" ? "Audited" : "Draft")}
                    >
                      {row.status === "Draft" ? "Audit" : "To Draft"}
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingItem ? `Edit ${editingItem.itemCode}` : "Add Closing Stock Item"}
        description="Physical count, valuation rate and GL account mapping"
        width="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={busy}
              onClick={() => void handleSubmitForm()}
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
              {editingItem ? "Save Changes" : "Add Item"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 p-4">
          {formError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {formError}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Valuation Date" required>
              <FODatePicker value={form.valuationDate} onChange={(v) => setField("valuationDate", v)} />
            </FormField>
            <FormField label="Store" required>
              <TextInput
                list="closing-stock-stores"
                value={form.storeName}
                onChange={(e) => setField("storeName", e.target.value)}
                placeholder="e.g. Main Kitchen Store"
              />
              <datalist id="closing-stock-stores">
                {stores.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </FormField>
            <FormField label="Item Code" required>
              <TextInput value={form.itemCode} onChange={(e) => setField("itemCode", e.target.value)} />
            </FormField>
            <FormField label="Item Name" required>
              <TextInput value={form.itemName} onChange={(e) => setField("itemName", e.target.value)} />
            </FormField>
            <FormField label="Category">
              <TextInput
                list="closing-stock-categories"
                value={form.category}
                onChange={(e) => setField("category", e.target.value)}
              />
              <datalist id="closing-stock-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </FormField>
            <FormField label="UOM">
              <TextInput value={form.uom} onChange={(e) => setField("uom", e.target.value)} />
            </FormField>
            <FormField label="Valuation Method">
              <SelectInput value={form.valuationMethod} onChange={(e) => setField("valuationMethod", e.target.value)}>
                {Array.from(new Set([...VALUATION_METHODS, form.valuationMethod])).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </SelectInput>
            </FormField>
            <FormField label="Status">
              <SelectInput value={form.status} onChange={(e) => setField("status", e.target.value as ItemForm["status"])}>
                <option value="Draft">Draft</option>
                <option value="Audited">Audited</option>
              </SelectInput>
            </FormField>
            <FormField label="System Qty">
              <TextInput type="number" min={0} value={form.sysQty} onChange={(e) => setField("sysQty", e.target.value)} />
            </FormField>
            <FormField label="Physical Qty">
              <TextInput type="number" min={0} value={form.physicalQty} onChange={(e) => setField("physicalQty", e.target.value)} />
            </FormField>
            <FormField label="Unit Rate (₹)">
              <TextInput type="number" min={0} step="0.01" value={form.unitRate} onChange={(e) => setField("unitRate", e.target.value)} />
            </FormField>
            <FormField label="Previous Period Value (₹)">
              <TextInput
                type="number"
                min={0}
                step="0.01"
                value={form.prevPeriodValue}
                onChange={(e) => setField("prevPeriodValue", e.target.value)}
              />
            </FormField>
            <FormField label="Stock Account (Asset)">
              <SelectInput value={form.stockAccountId} onChange={(e) => setField("stockAccountId", e.target.value)}>
                <option value="">— Select stock ledger —</option>
                {stockLedgers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} · {l.name}
                  </option>
                ))}
              </SelectInput>
            </FormField>
            <FormField label="Consumption Account (Expense)">
              <SelectInput value={form.consumptionAccountId} onChange={(e) => setField("consumptionAccountId", e.target.value)}>
                <option value="">— Select expense ledger —</option>
                {consumptionLedgers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} · {l.name}
                  </option>
                ))}
              </SelectInput>
            </FormField>
            <FormField label="Last Audit Date">
              <FODatePicker value={form.lastAuditDate} onChange={(v) => setField("lastAuditDate", v)} />
            </FormField>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            Valuation:{" "}
            <strong className="text-emerald-800">
              {formatINR((Number(form.physicalQty) || 0) * (Number(form.unitRate) || 0))}
            </strong>{" "}
            · Change vs previous:{" "}
            <strong>
              {formatINR((Number(form.physicalQty) || 0) * (Number(form.unitRate) || 0) - (Number(form.prevPeriodValue) || 0))}
            </strong>
          </div>
        </div>
      </Drawer>

      {showPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Confirm General Ledger Posting</h3>
                  <p className="text-[11px] text-slate-500 font-medium">GL Stock Asset Journal Posting</p>
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
                  A Journal voucher will be posted for the stock movement of the {unposted.length} unposted item(s) in the
                  current view. Posted items become read-only.
                </p>
              </div>

              {(draftUnposted.length > 0 || unmappedUnposted.length > 0) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900 space-y-1">
                  {draftUnposted.length > 0 && <p>{draftUnposted.length} item(s) are still Draft — audit them first.</p>}
                  {unmappedUnposted.length > 0 && (
                    <p>
                      Missing GL mapping: {unmappedUnposted.map((i) => i.itemCode).join(", ")}
                    </p>
                  )}
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Store Department:</span>
                  <strong className="text-slate-900">{selectedStore === "All" ? "All stores" : selectedStore}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Valuation Total:</span>
                  <strong className="text-slate-900">{formatINR(unposted.reduce((s, i) => s + i.totalValuation, 0))}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Net Stock Movement:</span>
                  <strong className="text-emerald-900 font-bold">{formatINR(unpostedChange)}</strong>
                </div>
              </div>

              <FormField label="Posting Date (defaults to valuation date)">
                <FODatePicker value={postingDate} onChange={setPostingDate} />
              </FormField>

              {postError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-800">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {postError}
                </div>
              )}
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
                onClick={() => void handleConfirmPostGL()}
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
