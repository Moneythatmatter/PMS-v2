"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowRightLeft,
  CheckCircle2,
  Download,
  Edit,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import {
  AlertBanner,
  ConfirmModal,
  FOPageHeader,
  FormField,
  FormSection,
  SelectInput,
  StatMiniCard,
  TextAreaInput,
  TextInput,
} from "@/components/frontoffice/ui";
import { DocumentApprovalFooter } from "@/components/purchase-stores/ui/DocumentApprovalFooter";
import { cn } from "@/lib/utils";
import {
  STORE_OPTIONS,
  type StockTransferRecord,
  type TransferStatus,
} from "@/app/data/stockTransfersData";
import { usePsList } from "@/hooks/usePsResource";
import { psStockTransferService, psWarehouseService } from "@/services/purchase-stores/index";

function transferStatusBadge(status: TransferStatus) {
  const styles: Record<TransferStatus, string> = {
    Draft: "bg-slate-100 text-slate-600 ring-slate-200",
    "Pending Approval": "bg-amber-50 text-amber-700 ring-amber-200",
    "In Transit": "bg-blue-50 text-blue-700 ring-blue-200",
    Completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Cancelled: "bg-red-50 text-red-700 ring-red-200",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset", styles[status])}>
      {status}
    </span>
  );
}

export default function StockTransfersPage() {
  const { data: transfers, loading, reload } = usePsList(() => psStockTransferService.list());
  const { data: warehouses, loading: warehousesLoading } = usePsList(() => psWarehouseService.list());

  const warehouseOptions = useMemo(() => warehouses.map((w) => w.name), [warehouses]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromWarehouseFilter, setFromWarehouseFilter] = useState("all");

  const [viewingTransfer, setViewingTransfer] = useState<StockTransferRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingTransfer, setDeletingTransfer] = useState<StockTransferRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const [formFromWarehouse, setFormFromWarehouse] = useState("");
  const [formFromStore, setFormFromStore] = useState<string>(STORE_OPTIONS[0]);
  const [formToWarehouse, setFormToWarehouse] = useState("");
  const [formToStore, setFormToStore] = useState<string>(STORE_OPTIONS[1]);
  const [formReason, setFormReason] = useState("");
  const [formRequestedBy, setFormRequestedBy] = useState("");

  const [toastMessage, setToastMessage] = useState<{ text: string; variant: "success" | "info" | "error" } | null>(null);

  const showToast = (text: string, variant: "success" | "info" | "error" = "success") => {
    setToastMessage({ text, variant });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredTransfers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transfers.filter((trf) => {
      const matchSearch =
        !q ||
        trf.transferNo.toLowerCase().includes(q) ||
        trf.fromWarehouse.toLowerCase().includes(q) ||
        trf.toWarehouse.toLowerCase().includes(q) ||
        trf.requestedBy.toLowerCase().includes(q) ||
        trf.reason.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || trf.status === statusFilter;
      const matchFrom = fromWarehouseFilter === "all" || trf.fromWarehouse === fromWarehouseFilter;
      return matchSearch && matchStatus && matchFrom;
    });
  }, [transfers, searchQuery, statusFilter, fromWarehouseFilter]);

  const stats = useMemo(() => {
    const total = transfers.length;
    const completed = transfers.filter((t) => t.status === "Completed").length;
    const inProgress = transfers.filter((t) => t.status === "In Transit" || t.status === "Pending Approval").length;
    return { total, completed, inProgress };
  }, [transfers]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setFromWarehouseFilter("all");
  };

  const resetCreateForm = () => {
    setFormFromWarehouse(warehouseOptions[0] ?? "");
    setFormFromStore(STORE_OPTIONS[0]);
    setFormToWarehouse(warehouseOptions[1] ?? warehouseOptions[0] ?? "");
    setFormToStore(STORE_OPTIONS[1]);
    setFormReason("");
    setFormRequestedBy("");
  };

  const handleCreateTransfer = async () => {
    if (!formReason.trim() || !formRequestedBy.trim()) {
      showToast("Reason and requested by are required.", "error");
      return;
    }
    if (formFromWarehouse === formToWarehouse && formFromStore === formToStore) {
      showToast("Source and destination cannot be the same.", "error");
      return;
    }

    setSaving(true);
    try {
      const created = await psStockTransferService.create({
        transferDate: new Date().toLocaleString("en-IN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
        fromWarehouse: formFromWarehouse,
        fromStore: formFromStore,
        toWarehouse: formToWarehouse,
        toStore: formToStore,
        requestedBy: formRequestedBy.trim(),
        status: "Draft",
        reason: formReason.trim(),
        lineItems: [],
        totalValue: 0,
      });
      setIsCreateOpen(false);
      resetCreateForm();
      await reload();
      showToast(`Transfer note ${created.transferNo} created as draft.`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to create transfer.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitTransferForApproval = async () => {
    if (!viewingTransfer) return;
    setSaving(true);
    try {
      await psStockTransferService.update(viewingTransfer.id, { ...viewingTransfer, status: "Pending Approval" });
      showToast(`${viewingTransfer.transferNo} submitted for approval.`);
      setViewingTransfer(null);
      await reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to submit transfer.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleApproveTransfer = async () => {
    if (!viewingTransfer) return;
    setSaving(true);
    try {
      await psStockTransferService.update(viewingTransfer.id, {
        ...viewingTransfer,
        status: "In Transit",
        dispatchedBy: "Store Keeper",
      });
      showToast(`${viewingTransfer.transferNo} approved — stock dispatched.`);
      setViewingTransfer(null);
      await reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to approve transfer.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRejectTransfer = async () => {
    if (!viewingTransfer) return;
    setSaving(true);
    try {
      await psStockTransferService.update(viewingTransfer.id, { ...viewingTransfer, status: "Cancelled" });
      showToast(`${viewingTransfer.transferNo} rejected.`, "error");
      setViewingTransfer(null);
      await reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to reject transfer.", "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingTransfer) return;
    setSaving(true);
    try {
      await psStockTransferService.remove(deletingTransfer.id);
      showToast(`Transfer ${deletingTransfer.transferNo} deleted.`, "error");
      setDeletingTransfer(null);
      await reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to delete transfer.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Transfer No",
      "Date",
      "From Warehouse",
      "From Store",
      "To Warehouse",
      "To Store",
      "Requested By",
      "Status",
      "Reason",
      "Items",
    ];
    const rows = filteredTransfers.map((t) => [
      `"${t.transferNo}"`,
      `"${t.transferDate}"`,
      `"${t.fromWarehouse}"`,
      `"${t.fromStore}"`,
      `"${t.toWarehouse}"`,
      `"${t.toStore}"`,
      `"${t.requestedBy}"`,
      `"${t.status}"`,
      `"${t.reason}"`,
      t.lineItems.length,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Stock_Transfers_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filteredTransfers.length} transfer records.`, "info");
  };

  if (loading || warehousesLoading) {
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
        title="Transfers"
        description="Move stock between warehouses, stores, and locations within the property."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                resetCreateForm();
                setIsCreateOpen(true);
              }}
              className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
            >
              <Plus className="h-4 w-4" /> New Transfer
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatMiniCard label="Total Transfers" value={stats.total} sublabel="All transfer notes" accent="#0f766e" icon={ArrowRightLeft} />
        <StatMiniCard label="Completed" value={stats.completed} sublabel="Fully received" accent="#16a34a" icon={CheckCircle2} />
        <StatMiniCard label="In Progress" value={stats.inProgress} sublabel="Pending / in transit" accent="#2563eb" icon={Truck} />
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transfer no, warehouse, requester..."
              className="h-9.5 w-full rounded-xl border border-slate-200 bg-white pl-9.5 pr-3 text-xs sm:text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <SelectInput value={fromWarehouseFilter} onChange={(e) => setFromWarehouseFilter(e.target.value)} className="h-9.5 text-xs sm:text-sm">
            <option value="all">All Source Warehouses</option>
            {warehouseOptions.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </SelectInput>
          <div className="flex items-center gap-2">
            <SelectInput value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9.5 flex-1 text-xs sm:text-sm">
              <option value="all">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="In Transit">In Transit</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </SelectInput>
            {(searchQuery || statusFilter !== "all" || fromWarehouseFilter !== "all") && (
              <Button type="button" variant="outline" size="sm" onClick={handleResetFilters} className="h-9.5 shrink-0 px-2.5 text-xs">
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">Transfer No</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">From</th>
                <th className="py-3.5 px-4"></th>
                <th className="py-3.5 px-4">To</th>
                <th className="py-3.5 px-4 text-center">Items</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No transfer notes match your filters.
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((trf) => (
                  <tr
                    key={trf.id}
                    onClick={() => setViewingTransfer(trf)}
                    className="cursor-pointer transition-colors hover:bg-slate-50/80"
                  >
                    <td className="py-3.5 px-4 font-bold text-emerald-800 whitespace-nowrap">{trf.transferNo}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">{trf.transferDate}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-800">{trf.fromWarehouse}</p>
                      <p className="text-[11px] text-slate-400">{trf.fromStore}</p>
                    </td>
                    <td className="py-3.5 px-2 text-slate-300">
                      <ArrowRightLeft className="h-4 w-4" />
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-800">{trf.toWarehouse}</p>
                      <p className="text-[11px] text-slate-400">{trf.toStore}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center">{trf.lineItems.length}</td>
                    <td className="py-3.5 px-4 text-center">{transferStatusBadge(trf.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      {trf.status === "Draft" && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingTransfer(trf);
                            }}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-600"
                            title="Edit Transfer"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingTransfer(trf);
                            }}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                            title="Delete Transfer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer
        open={Boolean(viewingTransfer)}
        onClose={() => setViewingTransfer(null)}
        title={viewingTransfer?.transferNo ?? "Transfer Details"}
        description={viewingTransfer ? `${viewingTransfer.fromWarehouse} → ${viewingTransfer.toWarehouse}` : ""}
        width="2xl"
        footer={
          viewingTransfer && (
            <DocumentApprovalFooter
              showApprovalActions={viewingTransfer.status === "Pending Approval"}
              onApprove={handleApproveTransfer}
              onReject={handleRejectTransfer}
              onClose={() => setViewingTransfer(null)}
              approveLabel="Approve Transfer"
              extraActions={
                viewingTransfer.status === "Draft" ? (
                  <Button type="button" size="sm" onClick={handleSubmitTransferForApproval} disabled={saving} className="bg-amber-600 hover:bg-amber-700 text-white">
                    Submit for Approval
                  </Button>
                ) : undefined
              }
            />
          )
        }
      >
        {viewingTransfer && (
          <div className="space-y-5 pb-4">
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs">
              <div><span className="text-slate-400 block text-[10px] uppercase font-semibold">Status</span>{transferStatusBadge(viewingTransfer.status)}</div>
              <div><span className="text-slate-400 block text-[10px] uppercase font-semibold">Date</span><span className="font-medium">{viewingTransfer.transferDate}</span></div>
              <div><span className="text-slate-400 block text-[10px] uppercase font-semibold">Requested By</span><span className="font-medium">{viewingTransfer.requestedBy}</span></div>
              <div><span className="text-slate-400 block text-[10px] uppercase font-semibold">Dispatched By</span><span className="font-medium">{viewingTransfer.dispatchedBy ?? "—"}</span></div>
              <div><span className="text-slate-400 block text-[10px] uppercase font-semibold">Received By</span><span className="font-medium">{viewingTransfer.receivedBy ?? "—"}</span></div>
              <div className="col-span-2"><span className="text-slate-400 block text-[10px] uppercase font-semibold">Reason</span><span className="font-medium">{viewingTransfer.reason}</span></div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[10px] font-bold uppercase text-slate-400">Source</p>
                <p className="mt-1 font-semibold text-slate-900">{viewingTransfer.fromWarehouse}</p>
                <p className="text-xs text-slate-500">{viewingTransfer.fromStore}</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-3">
                <p className="text-[10px] font-bold uppercase text-emerald-600">Destination</p>
                <p className="mt-1 font-semibold text-slate-900">{viewingTransfer.toWarehouse}</p>
                <p className="text-xs text-slate-500">{viewingTransfer.toStore}</p>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Line Items</h3>
              {viewingTransfer.lineItems.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">No line items added yet.</p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2 text-left">Item</th>
                        <th className="px-3 py-2 text-left">Batch</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                        <th className="px-3 py-2 text-right">Available</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingTransfer.lineItems.map((line) => (
                        <tr key={line.id}>
                          <td className="px-3 py-2">
                            <p className="font-semibold text-slate-900">{line.itemName}</p>
                            <p className="text-[11px] text-slate-400">{line.itemCode} · {line.unit}</p>
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-600">{line.batchNo ?? "—"}</td>
                          <td className="px-3 py-2 text-right font-semibold text-emerald-700">{line.transferQty}</td>
                          <td className="px-3 py-2 text-right text-slate-500">{line.availableAtSource}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <Drawer
        open={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          resetCreateForm();
        }}
        title="New Transfer Note"
        description="Create a draft transfer to move stock between locations."
        width="xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="button" size="sm" onClick={handleCreateTransfer} disabled={saving} className="bg-emerald-700 hover:bg-emerald-800 text-white">Create Draft</Button>
          </div>
        }
      >
        <FormSection title="Transfer Route" columns={2}>
          <FormField label="From Warehouse" required>
            <SelectInput value={formFromWarehouse} onChange={(e) => setFormFromWarehouse(e.target.value)}>
              {warehouseOptions.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="From Store" required>
            <SelectInput value={formFromStore} onChange={(e) => setFormFromStore(e.target.value)}>
              {STORE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="To Warehouse" required>
            <SelectInput value={formToWarehouse} onChange={(e) => setFormToWarehouse(e.target.value)}>
              {warehouseOptions.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="To Store" required>
            <SelectInput value={formToStore} onChange={(e) => setFormToStore(e.target.value)}>
              {STORE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Requested By" required>
            <TextInput value={formRequestedBy} onChange={(e) => setFormRequestedBy(e.target.value)} placeholder="Staff name" />
          </FormField>
          <FormField label="Reason" required className="sm:col-span-2">
            <TextAreaInput value={formReason} onChange={(e) => setFormReason(e.target.value)} placeholder="Reason for transfer..." rows={2} />
          </FormField>
        </FormSection>
      </Drawer>

      <ConfirmModal
        open={Boolean(deletingTransfer)}
        onClose={() => setDeletingTransfer(null)}
        onConfirm={confirmDelete}
        title="Delete Transfer Note"
        message={`Delete draft transfer "${deletingTransfer?.transferNo}"? This cannot be undone.`}
        confirmLabel="Delete Transfer"
        variant="danger"
      />
    </div>
  );
}
