"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Download,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
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
import { DocumentApprovalFooter } from "@/components/purchase-stores/ui/DocumentApprovalFooter";
import { cn } from "@/lib/utils";
import { downloadXlsx } from "@/lib/xlsx";
import {
  ADJUSTMENT_REASON_OPTIONS,
  type AdjustmentStatus,
  type StockAdjustmentRecord,
} from "@/app/data/stockAdjustmentsData";
import {
  getMaterialDetails,
  getWarehouseById,
} from "@/app/data/stockBalanceData";
import { usePsList } from "@/hooks/usePsResource";
import {
  psCategoryService,
  psProductService,
  psStockAdjustmentService,
  psStockBalanceService,
  psWarehouseService,
} from "@/services/purchase-stores/index";

function statusBadge(status: AdjustmentStatus) {
  const styles: Record<AdjustmentStatus, string> = {
    Draft: "bg-slate-100 text-slate-600 ring-slate-200",
    "Pending Approval": "bg-amber-50 text-amber-700 ring-amber-200",
    Approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Rejected: "bg-red-50 text-red-700 ring-red-200",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset", styles[status])}>
      {status}
    </span>
  );
}

export default function StockAdjustmentsPage() {
  const { data: adjustments, loading: adjustmentsLoading, reload: reloadAdjustments } = usePsList(() => psStockAdjustmentService.list());
  const { data: balances, loading: balancesLoading, reload: reloadBalances } = usePsList(() => psStockBalanceService.list());
  const { data: products, loading: productsLoading } = usePsList(() => psProductService.list());
  const { data: categories, loading: categoriesLoading } = usePsList(() => psCategoryService.list());
  const { data: warehouses, loading: warehousesLoading } = usePsList(() => psWarehouseService.list());

  const loading =
    adjustmentsLoading ||
    balancesLoading ||
    productsLoading ||
    categoriesLoading ||
    warehousesLoading;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] = useState<StockAdjustmentRecord | null>(null);
  const [formMaterialId, setFormMaterialId] = useState("");
  const [formWarehouseId, setFormWarehouseId] = useState("");
  const [formActualQty, setFormActualQty] = useState("");
  const [formReason, setFormReason] = useState<string>(ADJUSTMENT_REASON_OPTIONS[0]);
  const [formRequestedBy, setFormRequestedBy] = useState("Store Keeper");
  const [saving, setSaving] = useState(false);

  const [toastMessage, setToastMessage] = useState<{ text: string; variant: "success" | "info" | "error" } | null>(null);

  const showToast = (text: string, variant: "success" | "info" | "error" = "success") => {
    setToastMessage({ text, variant });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const balanceOptions = useMemo(() => {
    return balances.map((b) => {
      const m = getMaterialDetails(products, categories, b.materialId);
      const w = getWarehouseById(warehouses, b.warehouseId);
      return { ...b, label: `${m?.productName ?? b.materialId} · ${w?.name ?? b.warehouseId} (${b.quantity})` };
    });
  }, [balances, products, categories, warehouses]);

  const selectedBalance = useMemo(
    () => balances.find((b) => b.materialId === formMaterialId && b.warehouseId === formWarehouseId),
    [balances, formMaterialId, formWarehouseId],
  );

  const systemQty = selectedBalance?.quantity ?? 0;
  const actualQtyNum = Number(formActualQty);
  const difference = Number.isNaN(actualQtyNum) ? 0 : actualQtyNum - systemQty;

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return adjustments.filter((a) => {
      const m = getMaterialDetails(products, categories, a.materialId);
      const w = getWarehouseById(warehouses, a.warehouseId);
      const matchSearch =
        !q ||
        a.adjustmentNo.toLowerCase().includes(q) ||
        a.materialId.toLowerCase().includes(q) ||
        (m?.productName.toLowerCase().includes(q) ?? false) ||
        (w?.name.toLowerCase().includes(q) ?? false);
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [adjustments, searchQuery, statusFilter, products, categories, warehouses]);

  const stats = useMemo(() => ({
    total: adjustments.length,
    pending: adjustments.filter((a) => a.status === "Pending Approval").length,
    approved: adjustments.filter((a) => a.status === "Approved").length,
  }), [adjustments]);

  const openCreateDrawer = () => {
    if (balanceOptions.length > 0) {
      setFormMaterialId(balanceOptions[0].materialId);
      setFormWarehouseId(balanceOptions[0].warehouseId);
    }
    setFormActualQty("");
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (Number.isNaN(actualQtyNum) || actualQtyNum < 0) {
      showToast("Enter a valid actual quantity.", "error");
      return;
    }
    if (difference === 0) {
      showToast("Actual quantity matches system — no adjustment needed.", "info");
      return;
    }

    setSaving(true);
    try {
      const created = await psStockAdjustmentService.create({
        adjustmentDate: new Date().toISOString().split("T")[0],
        materialId: formMaterialId,
        warehouseId: formWarehouseId,
        systemQty,
        actualQty: actualQtyNum,
        difference,
        reason: formReason,
        requestedBy: formRequestedBy,
        status: "Pending Approval",
      });
      setCreateOpen(false);
      setFormActualQty("");
      await reloadAdjustments();
      showToast(`Adjustment ${created.adjustmentNo} submitted for approval. Ledger entry will post on approval.`, "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to create adjustment.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleApproveAdjustment = async () => {
    if (!selectedAdjustment) return;
    setSaving(true);
    try {
      await psStockAdjustmentService.update(selectedAdjustment.id, {
        ...selectedAdjustment,
        status: "Approved",
        approvedBy: "Store Manager",
        ledgerRef: selectedAdjustment.adjustmentNo,
      });
      const diff = selectedAdjustment.difference;
      showToast(
        `${selectedAdjustment.adjustmentNo} approved — stock ${diff > 0 ? "increased" : "reduced"} by ${Math.abs(diff)} and posted to the ledger.`,
        "success",
      );
      setSelectedAdjustment(null);
      await Promise.all([reloadAdjustments(), reloadBalances()]);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to approve adjustment.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRejectAdjustment = async () => {
    if (!selectedAdjustment) return;
    setSaving(true);
    try {
      await psStockAdjustmentService.update(selectedAdjustment.id, {
        ...selectedAdjustment,
        status: "Rejected",
      });
      showToast(`${selectedAdjustment.adjustmentNo} rejected.`, "error");
      setSelectedAdjustment(null);
      await reloadAdjustments();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to reject adjustment.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleExportExcel = () => {
    const headers = ["Adjustment No", "Date", "Material Code", "Material", "Warehouse", "System Qty", "Actual Qty", "Difference", "Reason", "Status"];
    const rows = filtered.map((a) => [
      a.adjustmentNo,
      a.adjustmentDate,
      getMaterialDetails(products, categories, a.materialId)?.productCode ?? a.materialId,
      getMaterialDetails(products, categories, a.materialId)?.productName ?? "",
      getWarehouseById(warehouses, a.warehouseId)?.name ?? a.warehouseId,
      a.systemQty,
      a.actualQty,
      a.difference,
      a.reason,
      a.status,
    ]);
    downloadXlsx(`stock-adjustments-${new Date().toISOString().slice(0, 10)}`, [
      {
        name: "Stock Adjustments",
        title: "Stock Adjustments",
        meta: [["Generated", new Date().toLocaleString("en-IN")], ["Records", rows.length]],
        header: headers,
        rows,
      },
    ]);
    showToast(`Exported ${filtered.length} adjustments to Excel.`, "info");
  };

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
        title="Adjustments"
        description="Correct stock after physical counts or write-offs. Each adjustment creates a ledger movement — stock is never edited directly."
        action={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleExportExcel} className="gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100">
              <Download className="h-4 w-4" /> Export Excel
            </Button>
            <Button type="button" size="sm" onClick={openCreateDrawer} className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white">
              <Plus className="h-4 w-4" /> New Adjustment
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatMiniCard label="Total" value={stats.total} sublabel="Adjustments" accent="#0f766e" icon={SlidersHorizontal} />
        <StatMiniCard label="Pending" value={stats.pending} sublabel="Awaiting approval" accent="#d97706" icon={Clock} />
        <StatMiniCard label="Approved" value={stats.approved} sublabel="Posted to ledger" accent="#16a34a" icon={CheckCircle2} />
      </div>

      

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="border-b border-slate-100 bg-slate-50/40 p-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search adjustment, material, warehouse..."
              className="h-9.5 w-full rounded-xl border border-slate-200 bg-white pl-9.5 pr-3 text-xs sm:text-sm"
            />
          </div>
          <SelectInput value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9.5 text-xs sm:text-sm">
            <option value="all">All Statuses</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Draft">Draft</option>
            <option value="Rejected">Rejected</option>
          </SelectInput>
        </div>
        </div>
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-3.5 px-4">Adjustment</th>
              <th className="py-3.5 px-4">Material</th>
              <th className="py-3.5 px-4">Warehouse</th>
              <th className="py-3.5 px-4 text-right">System</th>
              <th className="py-3.5 px-4 text-right">Actual</th>
              <th className="py-3.5 px-4 text-right">Diff</th>
              <th className="py-3.5 px-4">Reason</th>
              <th className="py-3.5 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-slate-500">No adjustments found.</td></tr>
            ) : (
              filtered.map((a) => {
                const m = getMaterialDetails(products, categories, a.materialId);
                const w = getWarehouseById(warehouses, a.warehouseId);
                return (
                  <tr key={a.id} className="hover:bg-slate-50/60 cursor-pointer" onClick={() => setSelectedAdjustment(a)}>
                    <td className="py-3.5 px-4">
                      <p className="font-mono font-semibold text-slate-900">{a.adjustmentNo}</p>
                      <p className="text-[10px] text-slate-400">{a.adjustmentDate}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{m?.productName}</p>
                      <p className="font-mono text-[10px] text-slate-400">{a.materialId}</p>
                    </td>
                    <td className="py-3.5 px-4">{w?.name}</td>
                    <td className="py-3.5 px-4 text-right tabular-nums">{a.systemQty}</td>
                    <td className="py-3.5 px-4 text-right tabular-nums font-semibold">{a.actualQty}</td>
                    <td className={cn("py-3.5 px-4 text-right tabular-nums font-bold", a.difference > 0 ? "text-emerald-700" : "text-red-600")}>
                      {a.difference > 0 ? `+${a.difference}` : a.difference}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{a.reason}</td>
                    <td className="py-3.5 px-4 text-center">{statusBadge(a.status)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Drawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Stock Adjustment"
        description="Compare system quantity with physical count. Difference posts to ledger on approval."
        width="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="button" size="sm" onClick={handleCreate} disabled={saving} className="bg-emerald-700 hover:bg-emerald-800 text-white">Submit for Approval</Button>
          </div>
        }
      >
        <FormSection title="Stock Location" columns={1}>
          <FormField label="Material · Warehouse" required>
            <SelectInput
              value={`${formMaterialId}|${formWarehouseId}`}
              onChange={(e) => {
                const [mid, wid] = e.target.value.split("|");
                setFormMaterialId(mid);
                setFormWarehouseId(wid);
                setFormActualQty("");
              }}
              className="text-xs"
            >
              {balanceOptions.map((b) => (
                <option key={b.id} value={`${b.materialId}|${b.warehouseId}`}>{b.label}</option>
              ))}
            </SelectInput>
          </FormField>
        </FormSection>

        <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs my-4">
          <div>
            <p className="text-slate-400 text-[10px] uppercase font-semibold">System Qty</p>
            <p className="text-xl font-bold text-slate-900 tabular-nums mt-1">{systemQty}</p>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] uppercase font-semibold">Actual Qty</p>
            <TextInput
              type="number"
              min={0}
              value={formActualQty}
              onChange={(e) => setFormActualQty(e.target.value)}
              className="mt-1 text-center font-bold h-9"
              placeholder="Count"
            />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] uppercase font-semibold">Difference</p>
            <p className={cn("text-xl font-bold tabular-nums mt-1", difference > 0 ? "text-emerald-700" : difference < 0 ? "text-red-600" : "text-slate-400")}>
              {formActualQty === "" ? "—" : difference > 0 ? `+${difference}` : difference}
            </p>
          </div>
        </div>

        <FormSection title="Details" columns={1}>
          <FormField label="Reason" required>
            <SelectInput value={formReason} onChange={(e) => setFormReason(e.target.value)} className="text-xs">
              {ADJUSTMENT_REASON_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Requested By" required>
            <TextInput value={formRequestedBy} onChange={(e) => setFormRequestedBy(e.target.value)} className="text-xs" />
          </FormField>
        </FormSection>

        <p className="text-[11px] text-slate-500 mt-2">
          <Link href="/purchase-stores/inventory/stock" className="text-emerald-700 hover:underline">View current stock</Link>
          {" "}— quantities cannot be changed from the Stock page.
        </p>
      </Drawer>

      <Drawer
        open={Boolean(selectedAdjustment)}
        onClose={() => setSelectedAdjustment(null)}
        title={selectedAdjustment?.adjustmentNo ?? "Adjustment"}
        description={selectedAdjustment ? `${getMaterialDetails(products, categories, selectedAdjustment.materialId)?.productName ?? selectedAdjustment.materialId}` : ""}
        width="md"
        footer={
          selectedAdjustment && (
            <DocumentApprovalFooter
              showApprovalActions={selectedAdjustment.status === "Pending Approval"}
              onApprove={handleApproveAdjustment}
              onReject={handleRejectAdjustment}
              onClose={() => setSelectedAdjustment(null)}
              approveLabel="Approve Adjustment"
            />
          )
        }
      >
        {selectedAdjustment && (
          <div className="space-y-4 pb-4 text-xs">
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-semibold">System</p>
                <p className="text-xl font-bold tabular-nums">{selectedAdjustment.systemQty}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-semibold">Actual</p>
                <p className="text-xl font-bold tabular-nums">{selectedAdjustment.actualQty}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-semibold">Difference</p>
                <p className={cn("text-xl font-bold tabular-nums", selectedAdjustment.difference > 0 ? "text-emerald-700" : "text-red-600")}>
                  {selectedAdjustment.difference > 0 ? `+${selectedAdjustment.difference}` : selectedAdjustment.difference}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-slate-400 block text-[10px] uppercase font-semibold">Warehouse</span>{getWarehouseById(warehouses, selectedAdjustment.warehouseId)?.name}</div>
              <div><span className="text-slate-400 block text-[10px] uppercase font-semibold">Status</span>{statusBadge(selectedAdjustment.status)}</div>
              <div className="col-span-2"><span className="text-slate-400 block text-[10px] uppercase font-semibold">Reason</span>{selectedAdjustment.reason}</div>
              <div><span className="text-slate-400 block text-[10px] uppercase font-semibold">Requested By</span>{selectedAdjustment.requestedBy}</div>
              <div><span className="text-slate-400 block text-[10px] uppercase font-semibold">Approved By</span>{selectedAdjustment.approvedBy ?? "—"}</div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
