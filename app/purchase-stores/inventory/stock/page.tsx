"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Download,
  IndianRupee,
  Minus,
  Package,
  PackageX,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import {
  AlertBanner,
  FOPageHeader,
  StatMiniCard,
  SelectInput,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";
import { downloadXlsx } from "@/lib/xlsx";
import {
  getMaterialById,
  getMaterialDetails,
  getWarehouseById,
  type StockBalanceRecord,
  type StockBalanceStatus,
} from "@/app/data/stockBalanceData";
import {
  getLedgerForBalance,
  getLedgerMaterialUnit,
  type LedgerMovementType,
} from "@/app/data/stockLedgerData";
import type { BatchRecord } from "@/app/data/batchData";
import { usePsList } from "@/hooks/usePsResource";
import {
  psBatchService,
  psCategoryService,
  psProductService,
  psStockBalanceService,
  psStockLedgerService,
  psWarehouseService,
} from "@/services/purchase-stores/index";

type DetailTab = "overview" | "movements" | "batch";
type LevelFilter = "all" | "out" | "reorder" | "par" | "ok";
type Level = Exclude<LevelFilter, "all">;

const LEVELS: Record<Level, { label: string; badge: string; bar: string }> = {
  out: { label: "Out of stock", badge: "bg-red-50 text-red-700 ring-red-200", bar: "bg-red-500" },
  reorder: { label: "Below reorder", badge: "bg-orange-50 text-orange-700 ring-orange-200", bar: "bg-orange-500" },
  par: { label: "Below par", badge: "bg-amber-50 text-amber-700 ring-amber-200", bar: "bg-amber-400" },
  ok: { label: "Healthy", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200", bar: "bg-emerald-500" },
};

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

function stockStatusBadge(status: StockBalanceStatus) {
  const styles: Record<StockBalanceStatus, string> = {
    Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Inactive: "bg-slate-100 text-slate-600 ring-slate-200",
    Blocked: "bg-red-50 text-red-700 ring-red-200",
    Quarantine: "bg-amber-50 text-amber-700 ring-amber-200",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset", styles[status])}>
      {status}
    </span>
  );
}

function movementBadge(type: LedgerMovementType) {
  const styles: Record<LedgerMovementType, string> = {
    GRN: "bg-emerald-50 text-emerald-700",
    Issue: "bg-sky-50 text-sky-700",
    "Transfer In": "bg-teal-50 text-teal-700",
    "Transfer Out": "bg-amber-50 text-amber-800",
    Adjustment: "bg-slate-100 text-slate-600",
    "Opening Stock": "bg-indigo-50 text-indigo-700",
    "Transfer Return": "bg-teal-50 text-teal-700",
  };
  return (
    <span className={cn("inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold", styles[type])}>
      {type}
    </span>
  );
}

export default function StockBalancePage() {
  const { data: products, loading: productsLoading } = usePsList(() => psProductService.list());
  const { data: categories, loading: categoriesLoading } = usePsList(() => psCategoryService.list());
  const { data: warehouses, loading: warehousesLoading } = usePsList(() => psWarehouseService.list());
  const { data: balances, loading: balancesLoading } = usePsList(() => psStockBalanceService.list());
  const { data: ledger, loading: ledgerLoading } = usePsList(() => psStockLedgerService.list());
  const { data: batches, loading: batchesLoading } = usePsList(() => psBatchService.list());

  const loading =
    productsLoading ||
    categoriesLoading ||
    warehousesLoading ||
    balancesLoading ||
    ledgerLoading ||
    batchesLoading;

  const [searchQuery, setSearchQuery] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");

  const [selectedRecord, setSelectedRecord] = useState<StockBalanceRecord | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");

  const [toastMessage, setToastMessage] = useState<{ text: string; variant: "success" | "info" | "error" } | null>(null);

  const showToast = (text: string, variant: "success" | "info" | "error" = "success") => {
    setToastMessage({ text, variant });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const getParStatusLabel = (materialId: string, quantity: number): { label: string; tone: string } => {
    const material = getMaterialById(products, materialId);
    if (!material) return { label: "—", tone: "text-slate-500" };
    if (quantity <= material.reorderLevel) return { label: "Below reorder", tone: "text-red-600" };
    if (quantity < material.parStock) return { label: "Below par", tone: "text-amber-600" };
    return { label: "OK", tone: "text-emerald-600" };
  };

  const materialUsesBatchTracking = (materialId: string): boolean => {
    const material = getMaterialById(products, materialId);
    if (!material) return false;
    const code = material.productCode;
    return batches.some(
      (b) => b.itemCode === code || b.itemName === material.productName,
    );
  };

  const enrichedBalances = useMemo(() => {
    return balances.map((b) => {
      const material = getMaterialDetails(products, categories, b.materialId);
      const warehouse = getWarehouseById(warehouses, b.warehouseId);
      const par = getParStatusLabel(b.materialId, b.quantity);
      const master = getMaterialById(products, b.materialId);
      const qty = Number(b.quantity) || 0;
      const reorder = Number(master?.reorderLevel ?? 0);
      const parQty = Number(master?.parStock ?? 0);
      const level: Level = qty <= 0 ? "out" : master && qty <= reorder ? "reorder" : master && qty < parQty ? "par" : "ok";
      return {
        ...b,
        materialCode: material?.productCode ?? b.materialId,
        materialName: material?.productName ?? "Unknown Material",
        category: material?.category ?? "",
        unit: material?.unit ?? "—",
        warehouseName: warehouse?.name ?? "Unknown Warehouse",
        parStatus: par.label,
        parTone: par.tone,
        level,
        parQty,
        reorder,
        value: qty * (Number(b.averageCost) || 0),
      };
    });
  }, [balances, products, categories, warehouses]);

  const filteredBalances = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedBalances.filter((b) => {
      const matchSearch =
        !q ||
        b.materialCode.toLowerCase().includes(q) ||
        b.materialName.toLowerCase().includes(q) ||
        b.materialId.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.warehouseName.toLowerCase().includes(q);
      const matchWarehouse = warehouseFilter === "all" || b.warehouseId === warehouseFilter;
      const matchStatus = statusFilter === "all" || b.status === statusFilter;
      const matchLevel = levelFilter === "all" || b.level === levelFilter;
      return matchSearch && matchWarehouse && matchStatus && matchLevel;
    });
  }, [enrichedBalances, searchQuery, warehouseFilter, statusFilter, levelFilter]);

  const levelCounts = useMemo(() => {
    const counts: Record<LevelFilter, number> = { all: 0, out: 0, reorder: 0, par: 0, ok: 0 };
    for (const b of enrichedBalances) {
      if (warehouseFilter !== "all" && b.warehouseId !== warehouseFilter) continue;
      counts.all += 1;
      counts[b.level] += 1;
    }
    return counts;
  }, [enrichedBalances, warehouseFilter]);

  const filteredValue = filteredBalances.reduce((sum, b) => sum + b.value, 0);

  const stats = useMemo(() => {
    const skuLocations = enrichedBalances.length;
    const stockValue = enrichedBalances.reduce((sum, b) => sum + b.value, 0);
    const lowStock = enrichedBalances.filter((b) => b.level === "reorder").length;
    const outOfStock = enrichedBalances.filter((b) => b.level === "out").length;
    return { skuLocations, stockValue, lowStock, outOfStock };
  }, [enrichedBalances]);

  const selectedMovements = useMemo(() => {
    if (!selectedRecord) return [];
    return getLedgerForBalance(ledger, selectedRecord.materialId, selectedRecord.warehouseId);
  }, [selectedRecord, ledger]);

  const selectedBatches = useMemo(() => {
    if (!selectedRecord) return [];
    const material = getMaterialById(products, selectedRecord.materialId);
    const warehouse = getWarehouseById(warehouses, selectedRecord.warehouseId);
    if (!material || !warehouse) return [];
    return batches.filter(
      (b) =>
        (b.itemCode === material.productCode || b.itemName === material.productName) &&
        b.warehouse.toLowerCase().includes(warehouse.name.split(" ")[0].toLowerCase()),
    );
  }, [selectedRecord, products, warehouses, batches]);

  const openDetail = (record: StockBalanceRecord) => {
    setSelectedRecord(record);
    setDetailTab("overview");
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setWarehouseFilter("all");
    setStatusFilter("all");
    setLevelFilter("all");
  };

  const handleExportExcel = () => {
    const warehouseLabel = warehouseFilter === "all" ? "All warehouses" : getWarehouseById(warehouses, warehouseFilter)?.name ?? warehouseFilter;
    downloadXlsx(`stock-balances-${new Date().toISOString().slice(0, 10)}`, [
      {
        name: "Stock",
        title: "Stock balances",
        meta: [
          ["Generated", new Date().toLocaleString("en-IN")],
          ["Warehouse", warehouseLabel],
          ["Stock level", levelFilter === "all" ? "All" : LEVELS[levelFilter].label],
          ["Records", filteredBalances.length],
          ["Stock value (₹)", Math.round(filteredValue * 100) / 100],
        ],
        header: ["Material Code", "Material", "Category", "Warehouse", "Quantity", "Unit", "Reorder Level", "Par Stock", "Avg Cost (₹)", "Stock Value (₹)", "Stock Level", "Status", "Last Movement"],
        rows: filteredBalances.map((b) => [
          b.materialCode,
          b.materialName,
          b.category,
          b.warehouseName,
          Number(b.quantity),
          b.unit,
          b.reorder,
          b.parQty,
          Number(b.averageCost),
          Math.round(b.value * 100) / 100,
          LEVELS[b.level].label,
          b.status,
          b.lastMovementAt ? String(b.lastMovementAt).slice(0, 10) : "",
        ]),
      },
    ]);
    showToast(`Exported ${filteredBalances.length} stock records to Excel.`, "info");
  };

  const detailMaterial = selectedRecord ? getMaterialDetails(products, categories, selectedRecord.materialId) : null;
  const detailWarehouse = selectedRecord ? getWarehouseById(warehouses, selectedRecord.warehouseId) : null;
  const detailPar = selectedRecord ? getParStatusLabel(selectedRecord.materialId, selectedRecord.quantity) : null;
  const showBatchTab = selectedRecord ? materialUsesBatchTracking(selectedRecord.materialId) : false;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toastMessage && (
        <AlertBanner variant={toastMessage.variant} message={toastMessage.text} onDismiss={() => setToastMessage(null)} />
      )}

      <FOPageHeader
        eyebrow="Purchase & Stores · Inventory"
        title="Stock"
        description="On-hand balances by material and warehouse. Quantities change only through GRN, Issue, Transfer or Adjustment."
        action={
          <Button type="button" size="sm" onClick={handleExportExcel} disabled={filteredBalances.length === 0} className="gap-1.5 bg-emerald-700 text-white hover:bg-emerald-800">
            <Download className="h-4 w-4" /> Export Excel
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatMiniCard label="SKU Locations" value={stats.skuLocations} sublabel="Material × warehouse" accent="#0f766e" icon={Package} />
        <StatMiniCard label="Stock Value" value={inr(Math.round(stats.stockValue))} sublabel="Qty × average cost" accent="#16a34a" icon={IndianRupee} />
        <StatMiniCard label="Below Reorder" value={stats.lowStock} sublabel="Reorder soon" accent="#ea580c" icon={ShieldAlert} />
        <StatMiniCard label="Out of Stock" value={stats.outOfStock} sublabel="Zero on hand" accent="#dc2626" icon={PackageX} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-3 xl:flex-row xl:items-center">
          <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
            {(["all", "out", "reorder", "par", "ok"] as LevelFilter[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setLevelFilter(key)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  levelFilter === key ? "bg-white text-emerald-800 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-800",
                )}
              >
                {key !== "all" && <span className={cn("h-2 w-2 rounded-full", LEVELS[key].bar)} />}
                {key === "all" ? "All" : LEVELS[key].label}
                <span className={cn("rounded-full px-1.5 text-[10px] tabular-nums", levelFilter === key ? "bg-emerald-100 text-emerald-800" : "bg-slate-200/70 text-slate-500")}>
                  {levelCounts[key]}
                </span>
              </button>
            ))}
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-2 xl:justify-end">
            <div className="relative min-w-[220px] flex-1 xl:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search material, code, category…"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 sm:text-sm"
              />
            </div>
            <SelectInput value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} className="!h-9 !w-48 text-xs sm:text-sm">
              <option value="all">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </SelectInput>
            <SelectInput value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="!h-9 !w-40 text-xs sm:text-sm">
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Blocked">Blocked</option>
              <option value="Quarantine">Quarantine</option>
            </SelectInput>
            {(searchQuery || warehouseFilter !== "all" || statusFilter !== "all" || levelFilter !== "all") && (
              <Button type="button" variant="outline" size="sm" onClick={handleResetFilters} className="h-9 shrink-0 px-2.5 text-xs">
                <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Material</th>
                <th className="px-4 py-3">Warehouse</th>
                <th className="px-4 py-3 text-right">On Hand</th>
                <th className="w-40 px-4 py-3">Level vs Par</th>
                <th className="px-4 py-3 text-right">Avg Cost</th>
                <th className="px-4 py-3 text-right">Value</th>
                <th className="px-4 py-3 text-center">Stock Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredBalances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <Package className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-sm font-semibold text-slate-600">No stock matches these filters</p>
                    <p className="text-xs text-slate-400">Try another stock level, warehouse or search.</p>
                  </td>
                </tr>
              ) : (
                filteredBalances.map((row) => {
                  const qty = Number(row.quantity) || 0;
                  const pct = row.parQty > 0 ? Math.min(100, (qty / row.parQty) * 100) : qty > 0 ? 100 : 0;
                  return (
                    <tr key={row.id} onClick={() => openDetail(row)} className="cursor-pointer transition-colors hover:bg-emerald-50/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-600">
                            {row.materialName.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{row.materialName}</p>
                            <p className="truncate text-[11px] text-slate-500">
                              <span className="font-mono text-emerald-700">{row.materialCode}</span>
                              {row.category && <> · {row.category}</>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">{row.warehouseName}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                        <span className="text-sm font-bold text-slate-900">{qty.toLocaleString("en-IN")}</span>{" "}
                        <span className="font-normal text-slate-400">{row.unit}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div className={cn("h-full rounded-full", LEVELS[row.level].bar)} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {row.parQty > 0 ? `Par ${row.parQty} · Reorder ${row.reorder}` : "No par set"}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-slate-600">{inr(Number(row.averageCost) || 0)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-slate-900">{inr(Math.round(row.value))}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset", LEVELS[row.level].badge)}>
                            {LEVELS[row.level].label}
                          </span>
                          {row.status !== "Active" && stockStatusBadge(row.status)}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredBalances.length > 0 && (
              <tfoot className="border-t border-slate-200 bg-slate-50/70 text-xs">
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-600" colSpan={5}>
                    {filteredBalances.length} of {enrichedBalances.length} locations
                    {(levelCounts.out > 0 || levelCounts.reorder > 0) && (
                      <span className="ml-3 inline-flex items-center gap-1 text-orange-700">
                        <AlertTriangle className="h-3.5 w-3.5" /> {levelCounts.out + levelCounts.reorder} need restocking
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-900">{inr(Math.round(filteredValue))}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <Drawer
        open={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title={detailMaterial?.productName ?? "Stock Detail"}
        description={
          selectedRecord
            ? `${detailWarehouse?.name ?? selectedRecord.warehouseId} · ${selectedRecord.quantity} ${detailMaterial?.unit ?? "units"}`
            : ""
        }
        width="lg"
        footer={
          selectedRecord && (
            <div className="flex flex-wrap justify-end gap-2">
              <Link href="/purchase-stores/inventory/issues">
                <Button type="button" variant="outline" size="sm">Create Issue</Button>
              </Link>
              <Link href="/purchase-stores/inventory/transfers">
                <Button type="button" variant="outline" size="sm">Create Transfer</Button>
              </Link>
              <Link href="/purchase-stores/inventory/adjustments">
                <Button type="button" size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5" /> Create Adjustment
                </Button>
              </Link>
            </div>
          )
        }
      >
        {selectedRecord && detailMaterial && (
          <div className="space-y-4 pb-4">
            <div className="flex gap-1 border-b border-slate-200">
              {(["overview", "movements", ...(showBatchTab ? ["batch"] : [])] as DetailTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setDetailTab(tab)}
                  className={cn(
                    "px-3 py-2 text-xs font-semibold capitalize transition-colors border-b-2 -mb-px",
                    detailTab === tab
                      ? "border-emerald-600 text-emerald-800"
                      : "border-transparent text-slate-500 hover:text-slate-700",
                  )}
                >
                  {tab === "batch" ? "Batch / Expiry" : tab}
                </button>
              ))}
            </div>

            {detailTab === "overview" && (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Current Quantity</p>
                  <p className="text-3xl font-bold text-emerald-900 tabular-nums mt-1">
                    {selectedRecord.quantity} <span className="text-lg font-semibold">{detailMaterial.unit}</span>
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Material ID</span>
                    <span className="font-mono font-semibold text-slate-900">{selectedRecord.materialId}</span>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Unit</span>
                    <span className="font-medium text-slate-800">{detailMaterial.unit}</span>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Warehouse</span>
                    <span className="font-medium text-slate-800">{detailWarehouse?.name}</span>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Average Cost</span>
                    <span className="font-medium text-slate-800">₹{selectedRecord.averageCost.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Par Status</span>
                    <span className={cn("font-semibold", detailPar?.tone)}>{detailPar?.label}</span>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Last Movement</span>
                    <span className="font-medium text-slate-800">{selectedRecord.lastMovementAt}</span>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Status</span>
                    {stockStatusBadge(selectedRecord.status)}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 rounded-lg bg-slate-50 border border-slate-200 p-3">
                  Stock quantity is read-only. To change on-hand qty, post a GRN, Issue, Transfer, or Adjustment.
                </p>
              </div>
            )}

            {detailTab === "movements" && (
              <div className="space-y-2">
                {selectedMovements.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">No movements recorded for this location.</p>
                ) : (
                  selectedMovements.map((m) => {
                    const unit = getLedgerMaterialUnit(products, m.materialId);
                    const isIn = m.quantityIn > 0;
                    return (
                      <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-xs">
                        <div className="min-w-0">
                          <p className="font-mono font-semibold text-slate-900">{m.transactionNo}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{m.transactionDate}</p>
                        </div>
                        <div>{movementBadge(m.movementType)}</div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isIn ? (
                            <Plus className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Minus className="h-3 w-3 text-red-500" />
                          )}
                          <span className={cn("font-bold tabular-nums", isIn ? "text-emerald-700" : "text-red-600")}>
                            {isIn ? `+${m.quantityIn}` : `−${m.quantityOut}`} {unit}
                          </span>
                        </div>
                        <span className="text-slate-500 tabular-nums shrink-0">Bal {m.balanceQty}</span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {detailTab === "batch" && showBatchTab && (
              <div className="space-y-2">
                {selectedBatches.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">No batch records for this material at this location.</p>
                ) : (
                  selectedBatches.map((b: BatchRecord) => (
                    <div key={b.id} className="rounded-lg border border-slate-200 bg-white p-3 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="font-mono font-semibold text-slate-900">{b.batchNumber}</span>
                        <span className="text-amber-700 font-semibold">{b.status}</span>
                      </div>
                      <p className="text-slate-600">Qty: {b.availableQty} {b.unit} · Expiry: {b.expiryDate}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
