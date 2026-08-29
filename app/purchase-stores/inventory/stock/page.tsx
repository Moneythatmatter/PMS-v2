"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Download,
  Minus,
  Package,
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
      return {
        ...b,
        materialCode: material?.productCode ?? b.materialId,
        materialName: material?.productName ?? "Unknown Material",
        unit: material?.unit ?? "—",
        warehouseName: warehouse?.name ?? "Unknown Warehouse",
        parStatus: par.label,
        parTone: par.tone,
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
        b.warehouseName.toLowerCase().includes(q);
      const matchWarehouse = warehouseFilter === "all" || b.warehouseId === warehouseFilter;
      const matchStatus = statusFilter === "all" || b.status === statusFilter;
      return matchSearch && matchWarehouse && matchStatus;
    });
  }, [enrichedBalances, searchQuery, warehouseFilter, statusFilter]);

  const stats = useMemo(() => {
    const skuLocations = balances.length;
    const totalQty = balances.reduce((sum, b) => sum + b.quantity, 0);
    const lowStock = enrichedBalances.filter((b) => {
      const material = getMaterialById(products, b.materialId);
      return material && b.quantity <= material.reorderLevel;
    }).length;
    return { skuLocations, totalQty, lowStock };
  }, [balances, enrichedBalances, products]);

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
  };

  const handleExportCSV = () => {
    const headers = ["Material ID", "Material", "Warehouse", "Quantity", "Unit", "Avg Cost", "Status", "Par Status"];
    const rows = filteredBalances.map((b) => [
      `"${b.materialId}"`,
      `"${b.materialName}"`,
      `"${b.warehouseName}"`,
      b.quantity,
      `"${b.unit}"`,
      b.averageCost,
      `"${b.status}"`,
      `"${b.parStatus}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Stock_Balances_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filteredBalances.length} stock balance records.`, "info");
  };

  const detailMaterial = selectedRecord ? getMaterialDetails(products, categories, selectedRecord.materialId) : null;
  const detailWarehouse = selectedRecord ? getWarehouseById(warehouses, selectedRecord.warehouseId) : null;
  const detailPar = selectedRecord ? getParStatusLabel(selectedRecord.materialId, selectedRecord.quantity) : null;
  const showBatchTab = selectedRecord ? materialUsesBatchTracking(selectedRecord.materialId) : false;

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
        title="Stock"
        description="Current on-hand balances by material and warehouse. Quantities change only through GRN, Issue, Transfer, or Adjustment."
        action={
          <Button type="button" variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatMiniCard label="SKU Locations" value={stats.skuLocations} sublabel="Material × warehouse" accent="#0f766e" icon={Package} />
        <StatMiniCard label="Total On Hand" value={stats.totalQty.toLocaleString("en-IN")} sublabel="All locations" accent="#16a34a" icon={Boxes} />
        <StatMiniCard label="Below Reorder" value={stats.lowStock} sublabel="Needs attention" accent="#d97706" icon={ShieldAlert} />
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search material ID, name, warehouse..."
              className="h-9.5 w-full rounded-xl border border-slate-200 bg-white pl-9.5 pr-3 text-xs sm:text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <SelectInput value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} className="h-9.5 text-xs sm:text-sm">
            <option value="all">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </SelectInput>
          <div className="flex items-center gap-2">
            <SelectInput value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9.5 flex-1 text-xs sm:text-sm">
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Blocked">Blocked</option>
              <option value="Quarantine">Quarantine</option>
            </SelectInput>
            {(searchQuery || warehouseFilter !== "all" || statusFilter !== "all") && (
              <Button type="button" variant="outline" size="sm" onClick={handleResetFilters} className="h-9.5 shrink-0 px-2.5 text-xs">
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">Material ID</th>
                <th className="py-3.5 px-4">Material</th>
                <th className="py-3.5 px-4">Warehouse</th>
                <th className="py-3.5 px-4 text-right">Qty</th>
                <th className="py-3.5 px-4 text-right">Avg Cost</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredBalances.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No stock balances match your filters.
                  </td>
                </tr>
              ) : (
                filteredBalances.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => openDetail(row)}
                    className="cursor-pointer transition-colors hover:bg-slate-50/80"
                  >
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{row.materialId}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{row.materialName}</p>
                      <p className="text-[10px] text-emerald-700 font-mono">{row.materialCode}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{row.warehouseName}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 tabular-nums">
                      {row.quantity} <span className="font-normal text-slate-400">{row.unit}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-600">₹{row.averageCost.toLocaleString("en-IN")}</td>
                    <td className="py-3.5 px-4 text-center">{stockStatusBadge(row.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
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
