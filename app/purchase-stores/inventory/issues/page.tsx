"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Download,
  Edit,
  FileText,
  Plus,
  RotateCcw,
  Search,
  Trash2,
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
import { downloadXlsx } from "@/lib/xlsx";
import {
  ISSUE_DEPARTMENT_OPTIONS,
  type IssueStatus,
  type StockIssueRecord,
} from "@/app/data/stockIssuesData";
import { usePsList } from "@/hooks/usePsResource";
import { psProductService, psStockBalanceService, psStockIssueService, psWarehouseService } from "@/services/purchase-stores/index";
import {
  StockLinePicker,
  newPickerLine,
  pickerLinesProblem,
  pickerLinesToPayload,
  type PickerLine,
} from "@/components/purchase-stores/ui/StockLinePicker";

function issueStatusBadge(status: IssueStatus) {
  const styles: Record<IssueStatus, string> = {
    Draft: "bg-slate-100 text-slate-600 ring-slate-200",
    "Pending Approval": "bg-amber-50 text-amber-700 ring-amber-200",
    Issued: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    "Partially Issued": "bg-blue-50 text-blue-700 ring-blue-200",
    Cancelled: "bg-red-50 text-red-700 ring-red-200",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset", styles[status])}>
      {status}
    </span>
  );
}

export default function StockIssuesPage() {
  const { data: issues, loading, reload } = usePsList(() => psStockIssueService.list());
  const { data: warehouses, loading: warehousesLoading } = usePsList(() => psWarehouseService.list());
  const { data: balances, reload: reloadBalances } = usePsList(() => psStockBalanceService.list());
  const { data: products } = usePsList(() => psProductService.list());

  const warehouseOptions = useMemo(() => warehouses.map((w) => w.name), [warehouses]);

  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");

  const [viewingIssue, setViewingIssue] = useState<StockIssueRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingIssue, setDeletingIssue] = useState<StockIssueRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const [formDepartment, setFormDepartment] = useState<string>(ISSUE_DEPARTMENT_OPTIONS[0]);
  const [formWarehouse, setFormWarehouse] = useState("");
  const [formStore, setFormStore] = useState("");
  const [formPurpose, setFormPurpose] = useState("");
  const [formRequestedBy, setFormRequestedBy] = useState("");
  const [formLines, setFormLines] = useState<PickerLine[]>([]);
  const [editingIssue, setEditingIssue] = useState<StockIssueRecord | null>(null);
  const formWarehouseId = warehouses.find((w) => w.name === formWarehouse)?.id;

  const [toastMessage, setToastMessage] = useState<{ text: string; variant: "success" | "info" | "error" } | null>(null);

  const showToast = (text: string, variant: "success" | "info" | "error" = "success") => {
    setToastMessage({ text, variant });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredIssues = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return issues.filter((issue) => {
      const matchSearch =
        !q ||
        issue.issueNo.toLowerCase().includes(q) ||
        issue.department.toLowerCase().includes(q) ||
        issue.requestedBy.toLowerCase().includes(q) ||
        issue.purpose.toLowerCase().includes(q);
      const matchDept = departmentFilter === "all" || issue.department === departmentFilter;
      const matchStatus = statusFilter === "all" || issue.status === statusFilter;
      const matchWarehouse = warehouseFilter === "all" || issue.warehouse === warehouseFilter;
      return matchSearch && matchDept && matchStatus && matchWarehouse;
    });
  }, [issues, searchQuery, departmentFilter, statusFilter, warehouseFilter]);

  const stats = useMemo(() => {
    const total = issues.length;
    const issued = issues.filter((i) => i.status === "Issued").length;
    const pending = issues.filter((i) => i.status === "Pending Approval" || i.status === "Draft").length;
    return { total, issued, pending };
  }, [issues]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setDepartmentFilter("all");
    setStatusFilter("all");
    setWarehouseFilter("all");
  };

  const resetCreateForm = () => {
    setFormDepartment(ISSUE_DEPARTMENT_OPTIONS[0]);
    setFormWarehouse(warehouseOptions[0] ?? "");
    setFormStore("");
    setFormPurpose("");
    setFormRequestedBy("");
    setFormLines([newPickerLine()]);
    setEditingIssue(null);
  };

  const openEditIssue = (issue: StockIssueRecord) => {
    setEditingIssue(issue);
    setFormDepartment(issue.department);
    setFormWarehouse(issue.warehouse);
    setFormStore(issue.store);
    setFormPurpose(issue.purpose);
    setFormRequestedBy(issue.requestedBy);
    setFormLines(
      issue.lineItems.length
        ? issue.lineItems.map((l) => ({ key: l.id, materialId: l.materialId ?? "", qty: String(l.requestedQty) }))
        : [newPickerLine()],
    );
    setViewingIssue(null);
    setIsCreateOpen(true);
  };

  const handleSaveIssue = async (submit: boolean) => {
    if (!formPurpose.trim() || !formRequestedBy.trim() || !formStore.trim()) {
      showToast("Purpose, store, and requested by are required.", "error");
      return;
    }
    const problem = pickerLinesProblem(formLines, balances, formWarehouseId);
    if (problem) return showToast(problem, "error");
    const lineItems = pickerLinesToPayload(formLines, "requestedQty");
    if (submit && lineItems.length === 0) return showToast("Add at least one material before submitting.", "error");

    const header = {
      department: formDepartment,
      warehouse: formWarehouse,
      store: formStore.trim(),
      requestedBy: formRequestedBy.trim(),
      purpose: formPurpose.trim(),
      status: submit ? "Pending Approval" : "Draft",
      lineItems,
    } as unknown as Partial<StockIssueRecord>;

    setSaving(true);
    try {
      const saved = editingIssue
        ? await psStockIssueService.update(editingIssue.id, header)
        : await psStockIssueService.create({
            ...header,
            issueDate: new Date().toLocaleString("en-IN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
          });
      setIsCreateOpen(false);
      resetCreateForm();
      await reload();
      showToast(`Issue slip ${saved.issueNo} ${submit ? "submitted for approval" : "saved as draft"}.`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to save issue.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitIssueForApproval = async () => {
    if (!viewingIssue) return;
    setSaving(true);
    try {
      await psStockIssueService.update(viewingIssue.id, { status: "Pending Approval" });
      showToast(`${viewingIssue.issueNo} submitted for approval.`);
      setViewingIssue(null);
      await reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to submit issue.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleApproveIssue = async () => {
    if (!viewingIssue) return;
    setSaving(true);
    try {
      await psStockIssueService.update(viewingIssue.id, {
        status: "Issued",
        approvedBy: "Store Manager",
        issuedBy: "Store Keeper",
      });
      showToast(`${viewingIssue.issueNo} issued — stock reduced and posted to the ledger.`);
      setViewingIssue(null);
      await Promise.all([reload(), reloadBalances()]);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to approve issue.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRejectIssue = async () => {
    if (!viewingIssue) return;
    setSaving(true);
    try {
      await psStockIssueService.update(viewingIssue.id, { status: "Cancelled" });
      showToast(`${viewingIssue.issueNo} rejected.`, "error");
      setViewingIssue(null);
      await reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to reject issue.", "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingIssue) return;
    setSaving(true);
    try {
      await psStockIssueService.remove(deletingIssue.id);
      showToast(`Issue ${deletingIssue.issueNo} deleted.`, "error");
      setDeletingIssue(null);
      await reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to delete issue.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleExportExcel = () => {
    const headers = ["Issue No", "Date", "Department", "Warehouse", "Store", "Requested By", "Status", "Purpose", "Items"];
    const rows = filteredIssues.map((i) => [
      i.issueNo,
      i.issueDate,
      i.department,
      i.warehouse,
      i.store,
      i.requestedBy,
      i.status,
      i.purpose,
      i.lineItems.length,
    ]);
    downloadXlsx(`stock-issues-${new Date().toISOString().slice(0, 10)}`, [
      {
        name: "Stock Issues",
        title: "Stock Issues",
        meta: [["Generated", new Date().toLocaleString("en-IN")], ["Records", rows.length]],
        header: headers,
        rows,
      },
    ]);
    showToast(`Exported ${filteredIssues.length} issue records to Excel.`, "info");
  };

  if (loading || warehousesLoading) {
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
        title="Issues"
        description="Issue materials from stores and warehouses to hotel departments."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleExportExcel} className="gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100">
              <Download className="h-4 w-4" /> Export Excel
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
              <Plus className="h-4 w-4" /> New Issue
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatMiniCard label="Total Issues" value={stats.total} sublabel="All issue slips" accent="#0f766e" icon={FileText} />
        <StatMiniCard label="Issued" value={stats.issued} sublabel="Completed issues" accent="#16a34a" icon={CheckCircle2} />
        <StatMiniCard label="Pending / Draft" value={stats.pending} sublabel="Awaiting action" accent="#d97706" icon={Clock} />
      </div>

      

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="border-b border-slate-100 bg-slate-50/40 p-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search issue no, department, requester..."
              className="h-9.5 w-full rounded-xl border border-slate-200 bg-white pl-9.5 pr-3 text-xs sm:text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <SelectInput value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="h-9.5 text-xs sm:text-sm">
            <option value="all">All Departments</option>
            {ISSUE_DEPARTMENT_OPTIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </SelectInput>
          <SelectInput value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} className="h-9.5 text-xs sm:text-sm">
            <option value="all">All Warehouses</option>
            {warehouseOptions.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </SelectInput>
          <div className="flex items-center gap-2">
            <SelectInput value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9.5 flex-1 text-xs sm:text-sm">
              <option value="all">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Issued">Issued</option>
              <option value="Partially Issued">Partially Issued</option>
              <option value="Cancelled">Cancelled</option>
            </SelectInput>
            {(searchQuery || departmentFilter !== "all" || statusFilter !== "all" || warehouseFilter !== "all") && (
              <Button type="button" variant="outline" size="sm" onClick={handleResetFilters} className="h-9.5 shrink-0 px-2.5 text-xs">
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">Issue No</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Warehouse / Store</th>
                <th className="py-3.5 px-4 text-center">Items</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No issue slips match your filters.
                  </td>
                </tr>
              ) : (
                filteredIssues.map((issue) => (
                  <tr
                    key={issue.id}
                    onClick={() => setViewingIssue(issue)}
                    className="cursor-pointer transition-colors hover:bg-emerald-50/40"
                  >
                    <td className="py-3.5 px-4 font-bold text-emerald-800 whitespace-nowrap">{issue.issueNo}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">{issue.issueDate}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{issue.department}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-800">{issue.warehouse}</p>
                      <p className="text-[11px] text-slate-400">{issue.store}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center">{issue.lineItems.length}</td>
                    <td className="py-3.5 px-4 text-center">{issueStatusBadge(issue.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      {issue.status === "Draft" && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditIssue(issue);
                            }}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-600"
                            title="Edit Issue"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingIssue(issue);
                            }}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                            title="Delete Issue"
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
        open={Boolean(viewingIssue)}
        onClose={() => setViewingIssue(null)}
        title={viewingIssue?.issueNo ?? "Issue Details"}
        description={viewingIssue ? `${viewingIssue.department} · ${viewingIssue.warehouse}` : ""}
        width="2xl"
        footer={
          viewingIssue && (
            <DocumentApprovalFooter
              showApprovalActions={viewingIssue.status === "Pending Approval"}
              onApprove={handleApproveIssue}
              onReject={handleRejectIssue}
              onClose={() => setViewingIssue(null)}
              approveLabel="Approve & Issue"
              extraActions={
                viewingIssue.status === "Draft" ? (
                  <>
                    <Button type="button" size="sm" variant="outline" onClick={() => openEditIssue(viewingIssue)} disabled={saving}>
                      Edit Items
                    </Button>
                    <Button type="button" size="sm" onClick={handleSubmitIssueForApproval} disabled={saving || viewingIssue.lineItems.length === 0} className="bg-amber-600 hover:bg-amber-700 text-white">
                      Submit for Approval
                    </Button>
                  </>
                ) : undefined
              }
            />
          )
        }
      >
        {viewingIssue && (
          <div className="space-y-5 pb-4">
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs">
              <div><span className="text-slate-400 block text-[10px] uppercase font-semibold">Status</span>{issueStatusBadge(viewingIssue.status)}</div>
              <div><span className="text-slate-400 block text-[10px] uppercase font-semibold">Date</span><span className="font-medium">{viewingIssue.issueDate}</span></div>
              <div><span className="text-slate-400 block text-[10px] uppercase font-semibold">Requested By</span><span className="font-medium">{viewingIssue.requestedBy}</span></div>
              <div><span className="text-slate-400 block text-[10px] uppercase font-semibold">Issued By</span><span className="font-medium">{viewingIssue.issuedBy ?? "—"}</span></div>
              <div className="col-span-2"><span className="text-slate-400 block text-[10px] uppercase font-semibold">Purpose</span><span className="font-medium">{viewingIssue.purpose}</span></div>
              <div className="col-span-2"><span className="text-slate-400 block text-[10px] uppercase font-semibold">Store</span><span className="font-medium">{viewingIssue.store}</span></div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Line Items</h3>
              {viewingIssue.lineItems.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">No line items added yet.</p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2 text-left">Item</th>
                        <th className="px-3 py-2 text-right">Requested</th>
                        <th className="px-3 py-2 text-right">Issued</th>
                        <th className="px-3 py-2 text-right">Available</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingIssue.lineItems.map((line) => (
                        <tr key={line.id}>
                          <td className="px-3 py-2">
                            <p className="font-semibold text-slate-900">{line.itemName}</p>
                            <p className="text-[11px] text-slate-400">{line.itemCode} · {line.unit}</p>
                          </td>
                          <td className="px-3 py-2 text-right">{line.requestedQty}</td>
                          <td className="px-3 py-2 text-right font-semibold text-emerald-700">{line.issuedQty}</td>
                          <td className="px-3 py-2 text-right text-slate-500">{line.availableStock}</td>
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
        title={editingIssue ? `Edit ${editingIssue.issueNo}` : "New Issue Slip"}
        description="Pick the materials to issue. Stock is reduced only when the slip is approved."
        width="2xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => { setIsCreateOpen(false); resetCreateForm(); }}>Cancel</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void handleSaveIssue(false)} disabled={saving}>Save Draft</Button>
            <Button type="button" size="sm" onClick={() => void handleSaveIssue(true)} disabled={saving} className="bg-emerald-700 hover:bg-emerald-800 text-white">
              {saving ? "Saving…" : "Submit for Approval"}
            </Button>
          </div>
        }
      >
        <FormSection title="Issue Header" columns={2}>
          <FormField label="Department" required>
            <SelectInput value={formDepartment} onChange={(e) => setFormDepartment(e.target.value)}>
              {ISSUE_DEPARTMENT_OPTIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Warehouse" required>
            <SelectInput
              value={formWarehouse}
              onChange={(e) => {
                setFormWarehouse(e.target.value);
                setFormLines([newPickerLine()]);
              }}
            >
              {warehouseOptions.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Issuing Store / Location" required className="sm:col-span-2">
            <TextInput value={formStore} onChange={(e) => setFormStore(e.target.value)} placeholder="e.g. Floor 4 Linen Pantry" />
          </FormField>
          <FormField label="Requested By" required>
            <TextInput value={formRequestedBy} onChange={(e) => setFormRequestedBy(e.target.value)} placeholder="Staff name" />
          </FormField>
          <FormField label="Purpose" required className="sm:col-span-2">
            <TextAreaInput value={formPurpose} onChange={(e) => setFormPurpose(e.target.value)} placeholder="Reason for issue..." rows={2} />
          </FormField>
        </FormSection>
        <FormSection title="Materials" columns={1}>
          <StockLinePicker
            warehouseId={formWarehouseId}
            balances={balances}
            products={products}
            lines={formLines}
            onChange={setFormLines}
          />
        </FormSection>
      </Drawer>

      <ConfirmModal
        open={Boolean(deletingIssue)}
        onClose={() => setDeletingIssue(null)}
        onConfirm={confirmDelete}
        title="Delete Issue Slip"
        message={`Delete draft issue "${deletingIssue?.issueNo}"? This cannot be undone.`}
        confirmLabel="Delete Issue"
        variant="danger"
      />
    </div>
  );
}
