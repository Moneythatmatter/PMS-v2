"use client";

import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Hash,
  Layers,
  Package,
  PackageCheck,
  Plus,
  RefreshCw,
  Send,
  Truck,
  User,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { AlertBanner, FormField, SelectInput } from "@/components/frontoffice/ui";
import { ConfirmModal } from "@/components/frontoffice/ui/Modal";
import { OperationsFilterDrawer, OperationsToolbar } from "@/components/housekeeping/OperationsToolbar";
import { ProcurementSummaryRow } from "@/components/purchase-stores/ui/ProcurementFormParts";
import type { PRStatus, PurchaseRequisition } from "@/app/data/purchaseRequisitionsData";
import { usePsList } from "@/hooks/usePsResource";
import {
  psCategoryService,
  psProductService,
  psRequisitionService,
  psStockBalanceService,
  psWarehouseService,
} from "@/services/purchase-stores/index";
import type { ModuleRequisitionConfig } from "./moduleRequisitionConfig";
import { RequisitionFormDrawer, type RequisitionPrefillLine } from "./RequisitionFormDrawer";
import {
  EDITABLE_STATUSES,
  IN_PROGRESS_STATUSES,
  OPEN_DEMAND_STATUSES,
  PriorityPill,
  ProgressBar,
  RequisitionFlow,
  RequisitionStatusPill,
  formatMoney,
  formatQty,
  formatReqDate,
  itemsSummary,
  pendingQty,
  requisitionFlow,
  requisitionTotals,
} from "./requisitionUi";

type Tab = "register" | "short" | "delivery";
type StatusTab = "all" | "draft" | "pending" | "progress" | "closed" | "stopped";

const STATUS_TAB_MATCH: Record<StatusTab, (s: PRStatus) => boolean> = {
  all: () => true,
  draft: (s) => s === "Draft",
  pending: (s) => s === "Pending Approval",
  progress: (s) => IN_PROGRESS_STATUSES.includes(s),
  closed: (s) => s === "Closed",
  stopped: (s) => s === "Rejected" || s === "Cancelled",
};

const norm = (v: string) => v.trim().toLowerCase();

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tone: "slate" | "amber" | "emerald" | "sky" | "red" | "violet";
}) {
  const tones = {
    slate: "bg-slate-50 text-slate-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-700",
    sky: "bg-sky-50 text-sky-600",
    red: "bg-red-50 text-red-600",
    violet: "bg-violet-50 text-violet-600",
  };
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-2xs">
      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <h3 className="text-lg font-extrabold leading-tight text-slate-800">{value}</h3>
      </div>
      <div className={cn("shrink-0 rounded-lg p-2", tones[tone])}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
  );
}

function DetailSection({ title, meta, children }: { title: string; meta?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {meta}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function ModuleRequisitionsPage({ config }: { config: ModuleRequisitionConfig }) {
  const sourceKey = config.sourceModules.join(",");
  const requisitions = usePsList(() => psRequisitionService.listBySource(config.sourceModules), [sourceKey]);
  const fulfillment = usePsList(() => psRequisitionService.fulfillment(), []);
  const products = usePsList(() => psProductService.list(), []);
  const categories = usePsList(() => psCategoryService.list(), []);
  const balances = usePsList(() => psStockBalanceService.list(), []);
  const warehouses = usePsList(() => psWarehouseService.list(), []);

  const [tab, setTab] = useState<Tab>("register");
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" | "info" } | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState<PurchaseRequisition | null>(null);
  const [prefill, setPrefill] = useState<RequisitionPrefillLine[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shortSelection, setShortSelection] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<{ kind: "delete" | "cancel"; pr: PurchaseRequisition } | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = requisitions.data;
  const selected = rows.find((r) => r.id === selectedId) ?? null;
  const fulfillmentById = useMemo(
    () => new Map(fulfillment.data.map((f) => [f.prId, f])),
    [fulfillment.data],
  );

  const moduleCategoryNames = useMemo(() => {
    const wanted = new Set(config.categoryDepartments.map(norm));
    return new Set(categories.data.filter((c) => wanted.has(norm(c.department ?? ""))).map((c) => c.categoryName));
  }, [categories.data, config.categoryDepartments]);

  const onHandByMaterial = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of balances.data) map.set(b.materialId, (map.get(b.materialId) ?? 0) + (Number(b.quantity) || 0));
    return map;
  }, [balances.data]);

  const openDemandByMaterial = useMemo(() => {
    const map = new Map<string, number>();
    for (const pr of rows) {
      if (!OPEN_DEMAND_STATUSES.includes(pr.status)) continue;
      for (const item of pr.requestedItems) {
        if (!item.materialId) continue;
        map.set(item.materialId, (map.get(item.materialId) ?? 0) + pendingQty(item));
      }
    }
    return map;
  }, [rows]);

  const shortItems = useMemo(
    () =>
      products.data
        .filter((p) => p.status !== "Inactive" && moduleCategoryNames.has(p.category))
        .map((p) => {
          const onHand = onHandByMaterial.get(p.id) ?? 0;
          const target = Math.max(p.parStock || 0, p.maximumStock || 0, p.reorderLevel || 0);
          return {
            product: p,
            onHand,
            openDemand: openDemandByMaterial.get(p.id) ?? 0,
            suggested: Math.max(1, Math.ceil(target - onHand)),
            critical: onHand <= (p.minimumStock || 0),
          };
        })
        .filter((s) => s.onHand <= (s.product.reorderLevel || 0) || s.onHand < (s.product.minimumStock || 0))
        .sort((a, b) => Number(b.critical) - Number(a.critical) || a.onHand - b.onHand),
    [products.data, moduleCategoryNames, onHandByMaterial, openDemandByMaterial],
  );

  const awaitingLines = useMemo(
    () =>
      rows
        .filter((pr) => IN_PROGRESS_STATUSES.includes(pr.status) || pr.status === "Closed")
        .flatMap((pr) =>
          pr.requestedItems
            .filter((item) => pendingQty(item) > 0)
            .map((item) => ({ pr, item, pending: pendingQty(item) })),
        ),
    [rows],
  );

  const statusCounts = useMemo(() => {
    const counts = {} as Record<StatusTab, number>;
    for (const key of Object.keys(STATUS_TAB_MATCH) as StatusTab[]) {
      counts[key] = rows.filter((r) => STATUS_TAB_MATCH[key](r.status)).length;
    }
    return counts;
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = norm(search);
    return rows.filter((pr) => {
      if (!STATUS_TAB_MATCH[statusTab](pr.status)) return false;
      if (deptFilter !== "all" && pr.department !== deptFilter) return false;
      if (priorityFilter !== "all" && pr.priority !== priorityFilter) return false;
      if (!q) return true;
      return [pr.prNumber, pr.requestedBy, pr.department, pr.costCenter, pr.sourceReference ?? ""]
        .concat(pr.requestedItems.map((i) => i.item))
        .some((v) => norm(String(v ?? "")).includes(q));
    });
  }, [rows, search, statusTab, deptFilter, priorityFilter]);

  const kpis = useMemo(() => {
    const open = rows.filter((r) => r.status !== "Closed" && r.status !== "Rejected" && r.status !== "Cancelled");
    return {
      pending: statusCounts.pending,
      drafts: statusCounts.draft,
      progress: statusCounts.progress,
      awaiting: awaitingLines.length,
      urgent: open.filter((r) => r.priority === "Emergency" || r.priority === "High").length,
      short: shortItems.length,
    };
  }, [rows, statusCounts, awaitingLines.length, shortItems.length]);

  const activeFilterCount = Number(deptFilter !== "all") + Number(priorityFilter !== "all");
  const loading = requisitions.loading && rows.length === 0;

  const refresh = async () => {
    await Promise.all([requisitions.reload(), fulfillment.reload(), balances.reload()]);
  };

  const openCreate = (lines: RequisitionPrefillLine[] = []) => {
    setEditing(null);
    setPrefill(lines);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };

  const openEdit = (pr: PurchaseRequisition) => {
    setEditing(pr);
    setPrefill([]);
    setFormKey((k) => k + 1);
    setSelectedId(null);
    setFormOpen(true);
  };

  const handleSaved = async (message: string) => {
    setFormOpen(false);
    setShortSelection(new Set());
    setToast({ message, variant: "success" });
    await refresh();
  };

  const runAction = async (fn: () => Promise<unknown>, message: string) => {
    setBusy(true);
    try {
      await fn();
      setToast({ message, variant: "success" });
      await refresh();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Action failed", variant: "error" });
    } finally {
      setBusy(false);
    }
  };

  const submitForApproval = (pr: PurchaseRequisition) => {
    if (!pr.justification?.trim()) {
      setToast({ message: `Add a reason for ${pr.prNumber} before submitting — open it with Edit.`, variant: "info" });
      return;
    }
    runAction(
      () => psRequisitionService.update(pr.id, { status: "Pending Approval" }),
      `${pr.prNumber} submitted to Purchase & Stores for approval.`,
    );
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    const { kind, pr } = confirm;
    await runAction(
      () =>
        kind === "delete"
          ? psRequisitionService.remove(pr.id)
          : psRequisitionService.update(pr.id, { status: "Cancelled" }),
      kind === "delete" ? `${pr.prNumber} deleted.` : `${pr.prNumber} cancelled.`,
    );
    setConfirm(null);
    setSelectedId(null);
  };

  const toggleShort = (id: string) =>
    setShortSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const raiseFromShort = () => {
    const lines = shortItems
      .filter((s) => shortSelection.has(s.product.id))
      .map((s) => ({ materialId: s.product.id, quantity: s.suggested }));
    if (lines.length > 0) openCreate(lines);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "register", label: `Requisitions (${rows.length})` },
    { id: "short", label: `Short Items (${shortItems.length})` },
    { id: "delivery", label: `Awaiting Delivery (${awaitingLines.length})` },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">{config.moduleLabel}</span>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-800">Material &amp; Supply Requisitions</h1>
          <p className="text-xs text-slate-500">
            Request short or new items from Purchase &amp; Stores and track them through approval, ordering and delivery.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refresh} className="h-8 gap-1.5 rounded-xl px-3 text-xs font-bold">
            <RefreshCw className={cn("h-3.5 w-3.5", requisitions.loading && "animate-spin")} /> Refresh
          </Button>
          <Button
            onClick={() => openCreate()}
            className="flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-xl !bg-[#0F8A5F] px-3.5 text-xs font-bold text-white shadow-xs hover:!bg-[#0d7d56]"
          >
            <Plus className="h-3.5 w-3.5" /> New Requisition
          </Button>
        </div>
      </div>

      {toast && <AlertBanner variant={toast.variant} message={toast.message} onDismiss={() => setToast(null)} />}
      {requisitions.error && (
        <AlertBanner variant="error" message={`Could not load requisitions: ${requisitions.error}`} />
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard label="Pending Approval" value={String(kpis.pending)} icon={Clock} tone="amber" />
        <KpiCard label="Drafts" value={String(kpis.drafts)} icon={FileText} tone="slate" />
        <KpiCard label="Approved / Sourcing" value={String(kpis.progress)} icon={CheckCircle2} tone="emerald" />
        <KpiCard label="Lines Awaiting Delivery" value={String(kpis.awaiting)} icon={Truck} tone="sky" />
        <KpiCard label="Urgent Open" value={String(kpis.urgent)} icon={AlertCircle} tone="red" />
        <KpiCard label="Short Items" value={String(kpis.short)} icon={AlertTriangle} tone="violet" />
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex gap-4 overflow-x-auto text-xs font-bold uppercase tracking-wider" aria-label="Requisition views">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "whitespace-nowrap border-b-2 px-0.5 pb-2.5 transition-all",
                tab === t.id
                  ? "border-emerald-700 font-extrabold text-emerald-800"
                  : "border-transparent text-slate-500 hover:text-slate-800",
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === "register" && (
        <div className="space-y-3">
          <OperationsToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search requisition no., requester, item or reference…"
            activeFilterCount={activeFilterCount}
            onOpenFilters={() => setFiltersOpen(true)}
            statusTabs={[
              { id: "all", label: "All", count: statusCounts.all },
              { id: "draft", label: "Draft", count: statusCounts.draft },
              { id: "pending", label: "Pending Approval", count: statusCounts.pending },
              { id: "progress", label: "In Progress", count: statusCounts.progress },
              { id: "closed", label: "Closed", count: statusCounts.closed },
              { id: "stopped", label: "Rejected / Cancelled", count: statusCounts.stopped },
            ]}
            activeStatusTab={statusTab}
            onStatusTabChange={(id) => setStatusTab(id as StatusTab)}
          />

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full min-w-[1100px] border-collapse text-left text-xs">
              <thead>
                <tr className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2.5">Requisition</th>
                  <th className="px-3 py-2.5">Department</th>
                  <th className="px-3 py-2.5">Requested By</th>
                  <th className="px-3 py-2.5">Items</th>
                  <th className="px-3 py-2.5 text-right">Est. Value</th>
                  <th className="px-3 py-2.5">Priority</th>
                  <th className="px-3 py-2.5">Required By</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="w-36 px-3 py-2.5">Received</th>
                  <th className="w-16 px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-12 text-center text-sm font-medium text-slate-400">
                      Loading requisitions…
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-3 py-12 text-center">
                      <ClipboardList className="mx-auto h-7 w-7 text-slate-300" />
                      <p className="mt-2 text-sm font-semibold text-slate-600">
                        {rows.length === 0 ? "No requisitions raised yet" : "No requisitions match these filters"}
                      </p>
                      <p className="text-xs font-normal text-slate-400">
                        {rows.length === 0
                          ? "Raise one when an item runs short — it goes to Purchase & Stores for approval."
                          : "Try another status tab or clear the filters."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((pr) => {
                    const totals = requisitionTotals(pr);
                    return (
                      <tr
                        key={pr.id}
                        onClick={() => setSelectedId(pr.id)}
                        className="cursor-pointer transition-colors hover:bg-slate-50/60"
                      >
                        <td className="px-3 py-2.5">
                          <p className="font-mono text-[11px] font-extrabold text-emerald-800">{pr.prNumber}</p>
                          <p className="text-[10px] font-medium text-slate-400">{formatReqDate(pr.requestDate)}</p>
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-bold text-slate-800">{pr.department}</p>
                          <p className="font-mono text-[10px] font-medium text-slate-400">{pr.costCenter || "—"}</p>
                        </td>
                        <td className="px-3 py-2.5 text-slate-800">{pr.requestedBy}</td>
                        <td className="max-w-[240px] truncate px-3 py-2.5 font-bold" title={itemsSummary(pr.requestedItems)}>
                          {itemsSummary(pr.requestedItems)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-extrabold text-slate-900">
                          {formatMoney(pr.estimatedAmount)}
                        </td>
                        <td className="px-3 py-2.5">
                          <PriorityPill priority={pr.priority} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 font-medium">{formatReqDate(pr.requiredDate)}</td>
                        <td className="px-3 py-2.5">
                          <RequisitionStatusPill status={pr.status} />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <ProgressBar value={totals.receivedPct} />
                            <span className="w-9 shrink-0 text-right text-[10px] font-bold text-slate-500">
                              {totals.receivedPct}%
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Button
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedId(pr.id);
                            }}
                            className="h-6 rounded-md !border-slate-200 !bg-slate-100 px-1.5 text-[10px] font-bold hover:!bg-slate-200"
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <OperationsFilterDrawer
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            title="Filter Requisitions"
            activeFilterCount={activeFilterCount}
            onReset={() => {
              setDeptFilter("all");
              setPriorityFilter("all");
            }}
          >
            <FormField label="Department">
              <SelectInput value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="block">
                <option value="all">All departments</option>
                {config.departments.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </SelectInput>
            </FormField>
            <FormField label="Priority">
              <SelectInput value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="block">
                <option value="all">All priorities</option>
                {["Emergency", "High", "Medium", "Low"].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </SelectInput>
            </FormField>
          </OperationsFilterDrawer>
        </div>
      )}

      {tab === "short" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs text-slate-600">
              {config.moduleLabel} materials at or below their reorder level in store. Select items to raise one requisition
              for all of them.
            </p>
            <Button
              onClick={raiseFromShort}
              disabled={shortSelection.size === 0}
              className="h-8 gap-1.5 rounded-xl !bg-emerald-700 px-3 text-xs font-bold text-white hover:!bg-emerald-800 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" /> Raise Requisition ({shortSelection.size})
            </Button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full min-w-[900px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="w-10 px-3 py-2.5">
                    <input
                      type="checkbox"
                      aria-label="Select all short items"
                      className="h-3.5 w-3.5 accent-emerald-600"
                      checked={shortItems.length > 0 && shortSelection.size === shortItems.length}
                      onChange={(e) =>
                        setShortSelection(e.target.checked ? new Set(shortItems.map((s) => s.product.id)) : new Set())
                      }
                    />
                  </th>
                  <th className="px-3 py-2.5">Item</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5 text-right">On Hand</th>
                  <th className="px-3 py-2.5 text-right">Reorder Level</th>
                  <th className="px-3 py-2.5 text-right">Par</th>
                  <th className="px-3 py-2.5 text-right">Already Requested</th>
                  <th className="px-3 py-2.5 text-right">Suggested Qty</th>
                  <th className="px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {shortItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-12 text-center">
                      <PackageCheck className="mx-auto h-7 w-7 text-emerald-300" />
                      <p className="mt-2 text-sm font-semibold text-slate-600">
                        {moduleCategoryNames.size === 0 ? "No materials tagged to this module" : "Nothing is running short"}
                      </p>
                      <p className="text-xs font-normal text-slate-400">
                        {moduleCategoryNames.size === 0
                          ? `Set the department of the relevant categories to ${config.moduleLabel} in Purchase & Stores → Categories.`
                          : "All materials are above their reorder level."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  shortItems.map((s) => (
                    <tr key={s.product.id} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          aria-label={`Select ${s.product.productName}`}
                          className="h-3.5 w-3.5 accent-emerald-600"
                          checked={shortSelection.has(s.product.id)}
                          onChange={() => toggleShort(s.product.id)}
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-bold text-slate-800">{s.product.productName}</p>
                        <p className="font-mono text-[10px] font-medium text-slate-400">{s.product.productCode}</p>
                      </td>
                      <td className="px-3 py-2.5 font-medium">{s.product.category}</td>
                      <td className={cn("px-3 py-2.5 text-right font-extrabold", s.critical ? "text-red-600" : "text-amber-600")}>
                        {formatQty(s.onHand)} <span className="font-medium text-slate-400">{s.product.unit}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right">{formatQty(s.product.reorderLevel)}</td>
                      <td className="px-3 py-2.5 text-right">{formatQty(s.product.parStock)}</td>
                      <td className="px-3 py-2.5 text-right">
                        {s.openDemand > 0 ? (
                          <span className="rounded bg-sky-50 px-1.5 py-0.5 text-sky-700">{formatQty(s.openDemand)}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-extrabold text-slate-900">{formatQty(s.suggested)}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
                            s.critical ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700",
                          )}
                        >
                          {s.critical ? "Critical" : "Reorder"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "delivery" && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
          <table className="w-full min-w-[900px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2.5">Requisition</th>
                <th className="px-3 py-2.5">Item</th>
                <th className="px-3 py-2.5 text-right">Requested</th>
                <th className="px-3 py-2.5 text-right">Ordered</th>
                <th className="px-3 py-2.5 text-right">Received</th>
                <th className="px-3 py-2.5 text-right">Pending</th>
                <th className="px-3 py-2.5">Required By</th>
                <th className="px-3 py-2.5">Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {awaitingLines.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-12 text-center">
                    <Truck className="mx-auto h-7 w-7 text-slate-300" />
                    <p className="mt-2 text-sm font-semibold text-slate-600">Nothing awaiting delivery</p>
                    <p className="text-xs font-normal text-slate-400">Approved items appear here until they are received into stock.</p>
                  </td>
                </tr>
              ) : (
                awaitingLines.map(({ pr, item, pending }) => {
                  const ordered = Number(item.orderedQty) || 0;
                  const stage = ordered <= 0 ? "Awaiting order" : (Number(item.receivedQty) || 0) > 0 ? "Partly received" : "Ordered";
                  return (
                    <tr
                      key={`${pr.id}-${item.id}`}
                      onClick={() => setSelectedId(pr.id)}
                      className="cursor-pointer hover:bg-slate-50/60"
                    >
                      <td className="px-3 py-2.5 font-mono text-[11px] font-extrabold text-emerald-800">{pr.prNumber}</td>
                      <td className="px-3 py-2.5">
                        <p className="font-bold text-slate-800">{item.item}</p>
                        <p className="text-[10px] font-medium text-slate-400">{item.productCode}</p>
                      </td>
                      <td className="px-3 py-2.5 text-right">{formatQty(item.quantity)}</td>
                      <td className="px-3 py-2.5 text-right">{formatQty(ordered)}</td>
                      <td className="px-3 py-2.5 text-right text-emerald-700">{formatQty(item.receivedQty ?? 0)}</td>
                      <td className="px-3 py-2.5 text-right font-extrabold text-red-600">
                        {formatQty(pending)} <span className="font-medium text-slate-400">{item.unit}</span>
                      </td>
                      <td className="px-3 py-2.5 font-medium">{formatReqDate(item.requiredDate || pr.requiredDate)}</td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
                            ordered <= 0
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-sky-200 bg-sky-50 text-sky-700",
                          )}
                        >
                          {stage}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <RequisitionFormDrawer
        key={formKey}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        config={config}
        initial={editing}
        prefill={prefill}
        products={products.data}
        moduleCategoryNames={moduleCategoryNames}
        onHandByMaterial={onHandByMaterial}
        warehouses={warehouses.data}
        onSaved={handleSaved}
      />

      {selected &&
        (() => {
          const pr = selected;
          const f = fulfillmentById.get(pr.id) ?? null;
          const totals = requisitionTotals(pr);
          const editable = EDITABLE_STATUSES.includes(pr.status);
          const warehouseName = warehouses.data.find((w) => w.id === pr.deliveryWarehouseId)?.name;
          const linkedDocs = [
            ...(f?.rfqs ?? []).map((r) => ({ key: r.id, label: r.rfqNumber, kind: "RFQ", status: r.status })),
            ...(f?.purchaseOrders ?? []).map((p) => ({ key: p.id, label: p.poNumber, kind: "PO", status: p.status })),
          ];
          return (
            <Drawer
              open
              onClose={() => setSelectedId(null)}
              side="bottom"
              title={pr.prNumber}
              customHeader={
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 id="drawer-title" className="font-mono text-base font-bold text-slate-900 sm:text-lg">
                        {pr.prNumber}
                      </h2>
                      <RequisitionStatusPill status={pr.status} />
                      <PriorityPill priority={pr.priority} />
                    </div>
                    <p className="truncate text-xs text-slate-500">
                      {pr.sourceModule ?? config.moduleLabel} · {pr.department} · raised by {pr.requestedBy} on{" "}
                      {formatReqDate(pr.requestDate)}
                    </p>
                  </div>
                </div>
              }
              footer={
                <div className="flex w-full flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    <strong className="text-slate-800">{pr.requestedItems.length}</strong> item
                    {pr.requestedItems.length === 1 ? "" : "s"} · estimated{" "}
                    <strong className="text-slate-800">{formatMoney(pr.estimatedAmount)}</strong>
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={() => setSelectedId(null)}>
                      Close
                    </Button>
                    {pr.status === "Draft" && (
                      <Button
                        variant="outline"
                        onClick={() => setConfirm({ kind: "delete", pr })}
                        disabled={busy}
                        className="!text-red-600 hover:!bg-red-50"
                      >
                        Delete
                      </Button>
                    )}
                    {pr.status === "Pending Approval" && (
                      <Button
                        variant="outline"
                        onClick={() => setConfirm({ kind: "cancel", pr })}
                        disabled={busy}
                        className="!text-red-600 hover:!bg-red-50"
                      >
                        Cancel Request
                      </Button>
                    )}
                    {editable && (
                      <Button variant="outline" onClick={() => openEdit(pr)} disabled={busy}>
                        {pr.status === "Rejected" ? "Edit & Resubmit" : "Edit"}
                      </Button>
                    )}
                    {pr.status === "Draft" && (
                      <Button
                        onClick={() => submitForApproval(pr)}
                        disabled={busy}
                        className="gap-1.5 !bg-emerald-700 text-white hover:!bg-emerald-800"
                      >
                        <Send className="h-3.5 w-3.5" /> Submit for Approval
                      </Button>
                    )}
                  </div>
                </div>
              }
            >
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="space-y-5">
                  <DetailSection title="Progress">
                    <RequisitionFlow steps={requisitionFlow(pr, f)} />
                    {pr.status === "Rejected" && pr.rejectionReason && (
                      <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                        Rejected: {pr.rejectionReason}
                      </p>
                    )}
                  </DetailSection>

                  <DetailSection
                    title="Items"
                    meta={
                      <span className="text-xs text-slate-500">
                        {formatQty(totals.received)} of {formatQty(totals.requested)} received
                      </span>
                    }
                  >
                    <div className="-m-4 overflow-x-auto">
                      <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-4 py-2">Item</th>
                            <th className="px-4 py-2 text-right">Requested</th>
                            <th className="px-4 py-2 text-right">Ordered</th>
                            <th className="px-4 py-2 text-right">Received</th>
                            <th className="px-4 py-2 text-right">Pending</th>
                            <th className="px-4 py-2 text-right">Est. Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {pr.requestedItems.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-2.5">
                                <p className="font-medium text-slate-900">{item.item}</p>
                                <p className="text-xs text-slate-500">
                                  {[item.productCode, item.category].filter(Boolean).join(" · ")}
                                  {item.stockOnHand !== null && item.stockOnHand !== undefined &&
                                    ` · ${formatQty(item.stockOnHand)} on hand when requested`}
                                </p>
                                {item.remarks && <p className="text-xs italic text-slate-400">{item.remarks}</p>}
                              </td>
                              <td className="whitespace-nowrap px-4 py-2.5 text-right">
                                {formatQty(item.quantity)} <span className="text-xs text-slate-400">{item.unit}</span>
                              </td>
                              <td className="px-4 py-2.5 text-right">{formatQty(item.orderedQty ?? 0)}</td>
                              <td className="px-4 py-2.5 text-right text-emerald-700">{formatQty(item.receivedQty ?? 0)}</td>
                              <td
                                className={cn(
                                  "px-4 py-2.5 text-right font-medium",
                                  pendingQty(item) > 0 ? "text-red-600" : "text-slate-400",
                                )}
                              >
                                {formatQty(pendingQty(item))}
                              </td>
                              <td className="px-4 py-2.5 text-right font-medium text-slate-900">{formatMoney(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 font-semibold text-slate-900">
                          <tr>
                            <td className="px-4 py-2">Total</td>
                            <td className="px-4 py-2 text-right">{formatQty(totals.requested)}</td>
                            <td className="px-4 py-2 text-right">{formatQty(totals.ordered)}</td>
                            <td className="px-4 py-2 text-right">{formatQty(totals.received)}</td>
                            <td className="px-4 py-2 text-right">{formatQty(totals.requested - totals.received)}</td>
                            <td className="px-4 py-2 text-right">{formatMoney(pr.estimatedAmount)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </DetailSection>

                  <DetailSection title="Reason for request">
                    <p className="whitespace-pre-line text-sm text-slate-700">
                      {pr.justification?.trim() || <span className="text-slate-400">No reason given.</span>}
                    </p>
                  </DetailSection>
                </div>

                <aside className="space-y-4">
                  <section className="rounded-xl border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 text-sm font-semibold text-slate-900">Summary</h3>
                    <dl className="space-y-2.5 text-xs">
                      <ProcurementSummaryRow icon={<Layers className="h-3.5 w-3.5" />} label="Source" value={pr.sourceModule} />
                      <ProcurementSummaryRow icon={<Building2 className="h-3.5 w-3.5" />} label="Cost center" value={pr.costCenter} />
                      <ProcurementSummaryRow icon={<User className="h-3.5 w-3.5" />} label="Requested by" value={pr.requestedBy} />
                      <ProcurementSummaryRow
                        icon={<CalendarDays className="h-3.5 w-3.5" />}
                        label="Required by"
                        value={formatReqDate(pr.requiredDate)}
                      />
                      <ProcurementSummaryRow icon={<Warehouse className="h-3.5 w-3.5" />} label="Deliver to" value={warehouseName} />
                      <ProcurementSummaryRow
                        icon={<Hash className="h-3.5 w-3.5" />}
                        label={config.referenceLabel}
                        value={pr.sourceReference}
                      />
                      <ProcurementSummaryRow
                        icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                        label="Approved by"
                        value={pr.approvedBy ?? undefined}
                      />
                    </dl>
                  </section>
                  <section className="rounded-xl border border-slate-200 bg-white p-4">
                    <h3 className="mb-3 text-sm font-semibold text-slate-900">Purchase documents</h3>
                    {linkedDocs.length === 0 ? (
                      <p className="flex items-start gap-2 text-xs text-slate-500">
                        <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />
                        {IN_PROGRESS_STATUSES.includes(pr.status)
                          ? "Purchase & Stores has not raised an RFQ or PO yet."
                          : "RFQs and purchase orders appear here once the request is approved."}
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {linkedDocs.map((d) => (
                          <li key={d.key} className="flex items-center justify-between gap-2 text-xs">
                            <span className="flex items-center gap-2">
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                                {d.kind}
                              </span>
                              <span className="font-mono font-semibold text-slate-800">{d.label}</span>
                            </span>
                            <span className="text-slate-500">{d.status}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </aside>
              </div>
            </Drawer>
          );
        })()}

      <ConfirmModal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={handleConfirm}
        loading={busy}
        variant="danger"
        title={confirm?.kind === "delete" ? "Delete draft requisition?" : "Cancel requisition?"}
        message={
          confirm?.kind === "delete"
            ? `${confirm.pr.prNumber} and its items will be removed permanently.`
            : `${confirm?.pr.prNumber ?? ""} will be withdrawn from Purchase & Stores approval.`
        }
        confirmLabel={confirm?.kind === "delete" ? "Delete" : "Cancel Request"}
      />
    </div>
  );
}
