"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  RotateCcw,
  Search,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import {
  AlertBanner,
  FOPageHeader,
  FormField,
  FormSection,
  SelectInput,
  StatMiniCard,
  TextInput,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";
import {
  type ParStockRecord,
  type ParStockStatus,
} from "@/app/data/parStockData";
import { usePsList } from "@/hooks/usePsResource";
import { psParStockService } from "@/services/purchase-stores/index";

function parStatusBadge(status: ParStockStatus) {
  const styles: Record<ParStockStatus, string> = {
    OK: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    "Below Par": "bg-amber-50 text-amber-700 ring-amber-200",
    Critical: "bg-red-50 text-red-700 ring-red-200",
    Overstock: "bg-blue-50 text-blue-700 ring-blue-200",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset", styles[status])}>
      {status}
    </span>
  );
}

function deriveParStatus(current: number, par: number, min: number, max: number): ParStockStatus {
  if (current > max) return "Overstock";
  if (current <= min) return "Critical";
  if (current < par) return "Below Par";
  return "OK";
}

export default function ParStockPage() {
  const { data: records, loading, reload } = usePsList(() => psParStockService.list());

  const [searchQuery, setSearchQuery] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [editingRecord, setEditingRecord] = useState<ParStockRecord | null>(null);
  const [formPar, setFormPar] = useState("");
  const [formMin, setFormMin] = useState("");
  const [formMax, setFormMax] = useState("");
  const [formReorder, setFormReorder] = useState("");
  const [saving, setSaving] = useState(false);

  const [toastMessage, setToastMessage] = useState<{ text: string; variant: "success" | "info" | "error" } | null>(null);

  const showToast = (text: string, variant: "success" | "info" | "error" = "success") => {
    setToastMessage({ text, variant });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const warehouseOptions = useMemo(
    () => [...new Set(records.map((r) => r.warehouse))].sort(),
    [records],
  );

  const categoryOptions = useMemo(
    () => [...new Set(records.map((r) => r.category))].sort(),
    [records],
  );

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((r) => {
      const matchSearch =
        !q ||
        r.itemCode.toLowerCase().includes(q) ||
        r.itemName.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q);
      const matchWarehouse = warehouseFilter === "all" || r.warehouse === warehouseFilter;
      const matchCategory = categoryFilter === "all" || r.category === categoryFilter;
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchWarehouse && matchCategory && matchStatus;
    });
  }, [records, searchQuery, warehouseFilter, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = records.length;
    const ok = records.filter((r) => r.status === "OK").length;
    const belowPar = records.filter((r) => r.status === "Below Par").length;
    const critical = records.filter((r) => r.status === "Critical" || r.status === "Overstock").length;
    return { total, ok, belowPar, critical };
  }, [records]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setWarehouseFilter("all");
    setCategoryFilter("all");
    setStatusFilter("all");
  };

  const openEditDrawer = (record: ParStockRecord) => {
    setEditingRecord(record);
    setFormPar(String(record.parLevel));
    setFormMin(String(record.minLevel));
    setFormMax(String(record.maxLevel));
    setFormReorder(String(record.reorderLevel));
  };

  const handleSaveParLevels = async () => {
    if (!editingRecord) return;

    const parLevel = Number(formPar);
    const minLevel = Number(formMin);
    const maxLevel = Number(formMax);
    const reorderLevel = Number(formReorder);

    if ([parLevel, minLevel, maxLevel, reorderLevel].some((n) => Number.isNaN(n) || n < 0)) {
      showToast("All levels must be valid non-negative numbers.", "error");
      return;
    }
    if (minLevel > parLevel || parLevel > maxLevel) {
      showToast("Levels must follow: Min ≤ Par ≤ Max.", "error");
      return;
    }

    const updated: ParStockRecord = {
      ...editingRecord,
      parLevel,
      minLevel,
      maxLevel,
      reorderLevel,
      status: deriveParStatus(editingRecord.currentStock, parLevel, minLevel, maxLevel),
    };

    setSaving(true);
    try {
      await psParStockService.update(editingRecord.id, updated);
      setEditingRecord(null);
      await reload();
      showToast(`Par levels updated for ${updated.itemName}.`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to save par levels.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Item Code", "Item Name", "Category", "Warehouse", "Store", "Current", "Par", "Min", "Max", "Reorder", "Status", "Unit"];
    const rows = filteredRecords.map((r) => [
      `"${r.itemCode}"`,
      `"${r.itemName}"`,
      `"${r.category}"`,
      `"${r.warehouse}"`,
      `"${r.store}"`,
      r.currentStock,
      r.parLevel,
      r.minLevel,
      r.maxLevel,
      r.reorderLevel,
      `"${r.status}"`,
      `"${r.unit}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Par_Stock_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filteredRecords.length} par stock records.`, "info");
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 text-sm text-slate-600">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/50 p-4 sm:p-6 md:p-8">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-md animate-in fade-in slide-in-from-top-3">
          <AlertBanner variant={toastMessage.variant} message={toastMessage.text} onDismiss={() => setToastMessage(null)} />
        </div>
      )}

      <FOPageHeader
        eyebrow="Purchase & Stores · Inventory"
        title="Par Stock"
        description="Monitor and maintain minimum stock levels by item, warehouse, and store location."
        action={
          <Button type="button" variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatMiniCard label="Tracked Items" value={stats.total} sublabel="Par stock rules" accent="#0f766e" icon={SlidersHorizontal} />
        <StatMiniCard label="At Par" value={stats.ok} sublabel="Healthy stock levels" accent="#16a34a" icon={CheckCircle2} />
        <StatMiniCard label="Below Par" value={stats.belowPar} sublabel="Needs replenishment" accent="#d97706" icon={TrendingDown} />
        <StatMiniCard label="Critical / Over" value={stats.critical} sublabel="Immediate attention" accent="#dc2626" icon={AlertTriangle} />
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search item code, name, category..."
              className="h-9.5 w-full rounded-xl border border-slate-200 bg-white pl-9.5 pr-3 text-xs sm:text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <SelectInput value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} className="h-9.5 text-xs sm:text-sm">
            <option value="all">All Warehouses</option>
            {warehouseOptions.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </SelectInput>
          <SelectInput value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-9.5 text-xs sm:text-sm">
            <option value="all">All Categories</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </SelectInput>
          <div className="flex items-center gap-2">
            <SelectInput value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9.5 flex-1 text-xs sm:text-sm">
              <option value="all">All Statuses</option>
              <option value="OK">OK</option>
              <option value="Below Par">Below Par</option>
              <option value="Critical">Critical</option>
              <option value="Overstock">Overstock</option>
            </SelectInput>
            {(searchQuery || warehouseFilter !== "all" || categoryFilter !== "all" || statusFilter !== "all") && (
              <Button type="button" variant="outline" size="sm" onClick={handleResetFilters} className="h-9.5 shrink-0 px-2.5 text-xs">
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">Item</th>
                <th className="py-3.5 px-4">Warehouse / Store</th>
                <th className="py-3.5 px-4 text-right">Current</th>
                <th className="py-3.5 px-4 text-right">Par</th>
                <th className="py-3.5 px-4 text-right">Min</th>
                <th className="py-3.5 px-4 text-right">Max</th>
                <th className="py-3.5 px-4 text-center">Variance</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No par stock records match your filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const variance = record.currentStock - record.parLevel;
                  return (
                    <tr
                      key={record.id}
                      onClick={() => openEditDrawer(record)}
                      className="cursor-pointer transition-colors hover:bg-slate-50/80"
                    >
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{record.itemName}</p>
                        <p className="text-[11px] text-slate-400">{record.itemCode} · {record.category}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-800">{record.warehouse}</p>
                        <p className="text-[11px] text-slate-400">{record.store}</p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">{record.currentStock} {record.unit}</td>
                      <td className="py-3.5 px-4 text-right text-slate-700">{record.parLevel}</td>
                      <td className="py-3.5 px-4 text-right text-slate-500">{record.minLevel}</td>
                      <td className="py-3.5 px-4 text-right text-slate-500">{record.maxLevel}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-0.5 font-semibold",
                            variance >= 0 ? "text-emerald-700" : "text-red-600"
                          )}
                        >
                          {variance >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {variance > 0 ? `+${variance}` : variance}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">{parStatusBadge(record.status)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer
        open={Boolean(editingRecord)}
        onClose={() => setEditingRecord(null)}
        title={editingRecord?.itemName ?? "Par Stock Levels"}
        description={editingRecord ? `${editingRecord.itemCode} · ${editingRecord.warehouse}` : ""}
        width="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditingRecord(null)}>Cancel</Button>
            <Button type="button" size="sm" onClick={handleSaveParLevels} disabled={saving} className="bg-emerald-700 hover:bg-emerald-800 text-white">Save Levels</Button>
          </div>
        }
      >
        {editingRecord && (
          <div className="space-y-5 pb-4">
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Current Stock</span>
                <span className="text-lg font-bold text-slate-900">{editingRecord.currentStock} {editingRecord.unit}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status</span>
                <div className="mt-1">{parStatusBadge(editingRecord.status)}</div>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Store</span>
                <span className="font-medium">{editingRecord.store}</span>
              </div>
            </div>

            <FormSection title="Stock Level Rules" columns={2}>
              <FormField label="Par Level" required>
                <TextInput value={formPar} onChange={(e) => setFormPar(e.target.value)} type="number" min={0} />
              </FormField>
              <FormField label="Reorder Level" required>
                <TextInput value={formReorder} onChange={(e) => setFormReorder(e.target.value)} type="number" min={0} />
              </FormField>
              <FormField label="Minimum Level" required>
                <TextInput value={formMin} onChange={(e) => setFormMin(e.target.value)} type="number" min={0} />
              </FormField>
              <FormField label="Maximum Level" required>
                <TextInput value={formMax} onChange={(e) => setFormMax(e.target.value)} type="number" min={0} />
              </FormField>
            </FormSection>

            {(editingRecord.status === "Below Par" || editingRecord.status === "Critical") && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p>
                  This item is below par level. Consider raising a{" "}
                  <span className="font-semibold">Purchase Requisition</span> or checking pending GRNs.
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
