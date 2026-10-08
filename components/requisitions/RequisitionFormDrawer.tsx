"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  ClipboardList,
  Layers,
  Package,
  Trash2,
  User,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { FormField, SelectInput, TextAreaInput, TextInput } from "@/components/frontoffice/ui";
import {
  PrioritySelector,
  ProcurementFormSection,
  ProcurementSummaryRow,
  type ProcurementPriority,
} from "@/components/purchase-stores/ui/ProcurementFormParts";
import {
  DEPARTMENT_STAFF_DATA,
  type PRRequestedItem,
  type PurchaseRequisition,
} from "@/app/data/purchaseRequisitionsData";
import type { ProductItem } from "@/app/data/productMasterData";
import type { WarehouseMasterItem } from "@/app/data/warehouseMasterData";
import { psRequisitionService } from "@/services/purchase-stores/index";
import type { ModuleRequisitionConfig } from "./moduleRequisitionConfig";
import { formatMoney, formatQty, todayIso } from "./requisitionUi";

export type RequisitionPrefillLine = { materialId: string; quantity: number };

type FormLine = {
  key: string;
  id?: string;
  materialId: string;
  productCode: string;
  item: string;
  category: string;
  unit: string;
  quantity: string;
  estimatedPrice: string;
  remarks: string;
};

let lineSeq = 0;
const nextKey = () => `line-${++lineSeq}`;

function lineFromProduct(product: ProductItem, quantity = 1): FormLine {
  return {
    key: nextKey(),
    materialId: product.id,
    productCode: product.productCode,
    item: product.productName,
    category: product.category,
    unit: product.unit,
    quantity: String(quantity),
    estimatedPrice: "",
    remarks: "",
  };
}

function lineFromItem(item: PRRequestedItem): FormLine {
  return {
    key: nextKey(),
    id: item.id,
    materialId: item.materialId ?? "",
    productCode: item.productCode ?? "",
    item: item.item,
    category: item.category,
    unit: item.unit,
    quantity: String(item.quantity),
    estimatedPrice: item.estimatedPrice ? String(item.estimatedPrice) : "",
    remarks: item.remarks ?? "",
  };
}

export function RequisitionFormDrawer({
  open,
  onClose,
  config,
  initial,
  prefill,
  products,
  moduleCategoryNames,
  onHandByMaterial,
  warehouses,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  config: ModuleRequisitionConfig;
  initial: PurchaseRequisition | null;
  prefill: RequisitionPrefillLine[];
  products: ProductItem[];
  moduleCategoryNames: Set<string>;
  onHandByMaterial: Map<string, number>;
  warehouses: WarehouseMasterItem[];
  onSaved: (message: string) => void;
}) {
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const defaultDept = config.departments[0]?.name ?? "";

  const [department, setDepartment] = useState(initial?.department ?? defaultDept);
  const [costCenter, setCostCenter] = useState(
    initial?.costCenter ??
      DEPARTMENT_STAFF_DATA.find((d) => d.department === defaultDept)?.costCenters[0]?.code ??
      "",
  );
  const [requestedBy, setRequestedBy] = useState(initial?.requestedBy ?? "");
  const [requiredDate, setRequiredDate] = useState(
    initial?.requiredDate && /^\d{4}-\d{2}-\d{2}$/.test(initial.requiredDate) ? initial.requiredDate : "",
  );
  const [priority, setPriority] = useState<ProcurementPriority>(initial?.priority ?? "Medium");
  const [warehouseId, setWarehouseId] = useState(initial?.deliveryWarehouseId ?? "");
  const [reference, setReference] = useState(initial?.sourceReference ?? "");
  const [justification, setJustification] = useState(initial?.justification ?? "");
  const [lines, setLines] = useState<FormLine[]>(() => {
    if (initial) return initial.requestedItems.map(lineFromItem);
    return prefill
      .map((p) => {
        const product = productById.get(p.materialId);
        return product ? lineFromProduct(product, p.quantity) : null;
      })
      .filter((l): l is FormLine => l !== null);
  });
  const [showAllMaterials, setShowAllMaterials] = useState(moduleCategoryNames.size === 0);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState<"draft" | "submit" | null>(null);

  const deptConfig = config.departments.find((d) => d.name === department) ?? config.departments[0];
  const staff = DEPARTMENT_STAFF_DATA.find((d) => d.department === department);
  const isPending = initial?.status === "Pending Approval";

  const pickable = useMemo(() => {
    const chosen = new Set(lines.map((l) => l.materialId));
    const active = products.filter((p) => p.status !== "Inactive" && !chosen.has(p.id));
    const own = active.filter((p) => moduleCategoryNames.has(p.category));
    const other = showAllMaterials ? active.filter((p) => !moduleCategoryNames.has(p.category)) : [];
    return { own, other };
  }, [products, lines, moduleCategoryNames, showAllMaterials]);

  const totals = useMemo(() => {
    let qty = 0;
    let amount = 0;
    let low = 0;
    for (const l of lines) {
      const q = Number(l.quantity) || 0;
      qty += q;
      amount += q * (Number(l.estimatedPrice) || 0);
      const product = productById.get(l.materialId);
      if (product && (onHandByMaterial.get(product.id) ?? 0) <= product.reorderLevel) low += 1;
    }
    return { qty, amount, low };
  }, [lines, productById, onHandByMaterial]);

  const handleDepartmentChange = (name: string) => {
    setDepartment(name);
    const centers = DEPARTMENT_STAFF_DATA.find((d) => d.department === name)?.costCenters ?? [];
    setCostCenter(centers[0]?.code ?? "");
  };

  const addMaterial = (materialId: string) => {
    const product = productById.get(materialId);
    if (product) setLines((prev) => [...prev, lineFromProduct(product)]);
  };

  const updateLine = (key: string, field: "quantity" | "estimatedPrice" | "remarks", value: string) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, [field]: value } : l)));
  };

  const removeLine = (key: string) => setLines((prev) => prev.filter((l) => l.key !== key));

  const save = async (submit: boolean) => {
    const today = todayIso();
    const problems = [
      !department && "Select a department.",
      !requestedBy.trim() && "Enter who is requesting.",
      !requiredDate && "Pick the required-by date.",
      requiredDate && requiredDate < today && "Required-by date cannot be in the past.",
      lines.length === 0 && "Add at least one item.",
      lines.some((l) => !(Number(l.quantity) > 0)) && "Every item needs a quantity greater than 0.",
      submit && !justification.trim() && "Add a reason for the request before submitting.",
    ].filter((p): p is string => Boolean(p));
    setErrors(problems);
    if (problems.length > 0) return;

    const requestedItems: PRRequestedItem[] = lines.map((l) => {
      const quantity = Number(l.quantity) || 0;
      const estimatedPrice = Number(l.estimatedPrice) || 0;
      return {
        id: l.id ?? l.key,
        materialId: l.materialId,
        productCode: l.productCode,
        item: l.item,
        category: l.category,
        unit: l.unit,
        quantity,
        estimatedPrice,
        total: quantity * estimatedPrice,
        remarks: l.remarks.trim() || undefined,
      };
    });
    const status = submit ? "Pending Approval" : isPending ? "Pending Approval" : "Draft";
    const payload: Partial<PurchaseRequisition> = {
      sourceModule: deptConfig.sourceModule,
      sourceReference: reference.trim(),
      department,
      costCenter,
      requestedBy: requestedBy.trim(),
      requiredDate,
      priority,
      deliveryWarehouseId: warehouseId || null,
      justification: justification.trim(),
      estimatedAmount: totals.amount,
      requestedItems,
      status,
    };

    setSaving(submit ? "submit" : "draft");
    try {
      if (initial) {
        await psRequisitionService.update(initial.id, payload);
        onSaved(
          submit && !isPending
            ? `${initial.prNumber} submitted to Purchase & Stores for approval.`
            : `${initial.prNumber} updated.`,
        );
      } else {
        const created = await psRequisitionService.create({
          ...payload,
          requestDate: today,
          currentApprover: "Purchase Manager",
          approvalTimeline: [
            { stage: "Raised", approverName: requestedBy.trim(), status: "Completed", timestamp: today },
            { stage: "Purchase Manager", approverName: "Purchase Manager", status: submit ? "Current" : "Pending" },
          ],
          attachments: [],
          comments: [],
        });
        onSaved(
          submit
            ? `${created.prNumber} submitted to Purchase & Stores for approval.`
            : `${created.prNumber} saved as draft.`,
        );
      }
    } catch (e) {
      setErrors([e instanceof Error ? e.message : "Could not save the requisition."]);
    } finally {
      setSaving(null);
    }
  };

  const warehouseName = warehouses.find((w) => w.id === warehouseId)?.name;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="bottom"
      title={initial ? `Edit ${initial.prNumber}` : "New Requisition"}
      customHeader={
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 id="drawer-title" className="truncate text-base font-bold text-slate-900 sm:text-lg">
              {initial ? `Edit Requisition ${initial.prNumber}` : "New Material Requisition"}
            </h2>
            <p className="truncate text-xs text-slate-500">
              Request short or new items from Purchase &amp; Stores. Once approved, Purchase raises the RFQ or PO.
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            <strong className="text-slate-800">{lines.length}</strong> item{lines.length === 1 ? "" : "s"} ·
            estimated <strong className="text-slate-800">{formatMoney(totals.amount)}</strong>
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving !== null}>
              Cancel
            </Button>
            {!isPending && (
              <Button variant="outline" onClick={() => save(false)} disabled={saving !== null}>
                {saving === "draft" ? "Saving…" : "Save Draft"}
              </Button>
            )}
            <Button
              onClick={() => save(true)}
              disabled={saving !== null}
              className="!bg-emerald-700 text-white hover:!bg-emerald-800"
            >
              {saving === "submit" ? "Submitting…" : isPending ? "Save Changes" : "Submit for Approval"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          {errors.length > 0 && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <ul className="list-disc space-y-0.5 pl-4">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <ProcurementFormSection step={1} title="Request details" subtitle="Who needs it, for which cost center and by when.">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Department" required>
                <SelectInput value={department} onChange={(e) => handleDepartmentChange(e.target.value)} className="block">
                  {config.departments.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </SelectInput>
              </FormField>
              <FormField label="Cost Center">
                <SelectInput value={costCenter} onChange={(e) => setCostCenter(e.target.value)} className="block">
                  <option value="">No cost center</option>
                  {(staff?.costCenters ?? []).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </SelectInput>
              </FormField>
              <FormField label="Requested By" required>
                <TextInput
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  list="requisition-requesters"
                  placeholder="Name of the requester"
                />
                <datalist id="requisition-requesters">
                  {(staff?.employees ?? []).map((emp) => (
                    <option key={emp.name} value={emp.name}>
                      {emp.designation}
                    </option>
                  ))}
                </datalist>
              </FormField>
              <FormField label="Required By" required>
                <TextInput
                  type="date"
                  value={requiredDate}
                  min={todayIso()}
                  onChange={(e) => setRequiredDate(e.target.value)}
                />
              </FormField>
              <FormField label="Deliver To Store" helperText="Where the goods should be received after GRN.">
                <SelectInput value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="block">
                  <option value="">Decided by Purchase &amp; Stores</option>
                  {warehouses
                    .filter((w) => w.status !== "Inactive")
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                </SelectInput>
              </FormField>
              <FormField label={config.referenceLabel}>
                <TextInput
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={config.referencePlaceholder}
                />
              </FormField>
            </div>
            <div className="mt-4">
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Priority</span>
              <PrioritySelector value={priority} onChange={setPriority} />
            </div>
          </ProcurementFormSection>

          <ProcurementFormSection
            step={2}
            title="Items"
            subtitle="Pick materials from the item master. Stock on hand is shown to justify the request."
            action={
              moduleCategoryNames.size > 0 ? (
                <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={showAllMaterials}
                    onChange={(e) => setShowAllMaterials(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-300 accent-emerald-600"
                  />
                  Show all materials
                </label>
              ) : null
            }
          >
            <SelectInput
              value=""
              onChange={(e) => addMaterial(e.target.value)}
              className="block"
              aria-label="Add item"
            >
              <option value="">+ Add an item…</option>
              {pickable.own.length > 0 && (
                <optgroup label={`${config.moduleLabel} materials`}>
                  {pickable.own.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.productName} ({p.productCode}) · on hand {formatQty(onHandByMaterial.get(p.id) ?? 0)} {p.unit}
                    </option>
                  ))}
                </optgroup>
              )}
              {pickable.other.length > 0 && (
                <optgroup label="Other materials">
                  {pickable.other.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.productName} ({p.productCode}) · {p.category}
                    </option>
                  ))}
                </optgroup>
              )}
            </SelectInput>
            {pickable.own.length === 0 && !showAllMaterials && (
              <p className="mt-2 text-xs text-slate-500">
                No materials are tagged to {config.moduleLabel} yet. Tick &ldquo;Show all materials&rdquo; or tag categories in
                Purchase &amp; Stores → Categories.
              </p>
            )}

            {lines.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-200 py-10 text-center">
                <Package className="mx-auto h-7 w-7 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-600">No items added</p>
                <p className="text-xs text-slate-400">Choose items from the list above.</p>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2 text-right">On Hand</th>
                      <th className="w-28 px-3 py-2">Qty</th>
                      <th className="w-32 px-3 py-2">Est. Rate (₹)</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2">Remarks</th>
                      <th className="w-10 px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lines.map((l) => {
                      const product = productById.get(l.materialId);
                      const onHand = product ? (onHandByMaterial.get(product.id) ?? 0) : null;
                      const low = product !== undefined && onHand !== null && onHand <= product.reorderLevel;
                      const amount = (Number(l.quantity) || 0) * (Number(l.estimatedPrice) || 0);
                      return (
                        <tr key={l.key} className="align-top">
                          <td className="px-3 py-2.5">
                            <p className="font-medium text-slate-900">{l.item}</p>
                            <p className="text-xs text-slate-500">
                              {[l.productCode, l.category, l.unit].filter(Boolean).join(" · ")}
                            </p>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-right">
                            {onHand === null ? (
                              <span className="text-slate-300">—</span>
                            ) : (
                              <span className={cn("font-medium", low ? "text-red-600" : "text-slate-700")}>
                                {formatQty(onHand)}
                                {low && (
                                  <span className="ml-1.5 rounded bg-red-50 px-1 py-0.5 text-[9px] font-bold uppercase text-red-600">
                                    Low
                                  </span>
                                )}
                              </span>
                            )}
                            {product && (
                              <p className="text-[10px] text-slate-400">Reorder at {formatQty(product.reorderLevel)}</p>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <TextInput
                              type="number"
                              min={0}
                              step="any"
                              value={l.quantity}
                              onChange={(e) => updateLine(l.key, "quantity", e.target.value)}
                              aria-label={`Quantity for ${l.item}`}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <TextInput
                              type="number"
                              min={0}
                              step="any"
                              value={l.estimatedPrice}
                              placeholder="0"
                              onChange={(e) => updateLine(l.key, "estimatedPrice", e.target.value)}
                              aria-label={`Estimated rate for ${l.item}`}
                            />
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium text-slate-900">
                            {formatMoney(amount)}
                          </td>
                          <td className="px-3 py-2">
                            <TextInput
                              value={l.remarks}
                              placeholder="Optional"
                              onChange={(e) => updateLine(l.key, "remarks", e.target.value)}
                              aria-label={`Remarks for ${l.item}`}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => removeLine(l.key)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                              aria-label={`Remove ${l.item}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 text-sm font-semibold text-slate-900">
                    <tr>
                      <td className="px-3 py-2" colSpan={2}>
                        Total
                      </td>
                      <td className="px-3 py-2">{formatQty(totals.qty)}</td>
                      <td />
                      <td className="px-3 py-2 text-right">{formatMoney(totals.amount)}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </ProcurementFormSection>

          <ProcurementFormSection step={3} title="Reason for request" subtitle="Purchase uses this to approve and prioritise.">
            <TextAreaInput
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="e.g. Stock below reorder level ahead of weekend occupancy; current par cannot cover two days."
              aria-label="Reason for request"
            />
          </ProcurementFormSection>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Summary</h3>
            <dl className="space-y-2.5 text-xs">
              <ProcurementSummaryRow icon={<Layers className="h-3.5 w-3.5" />} label="Source" value={deptConfig.sourceModule} />
              <ProcurementSummaryRow icon={<Building2 className="h-3.5 w-3.5" />} label="Department" value={department} />
              <ProcurementSummaryRow icon={<User className="h-3.5 w-3.5" />} label="Requested by" value={requestedBy.trim()} />
              <ProcurementSummaryRow icon={<CalendarDays className="h-3.5 w-3.5" />} label="Required by" value={requiredDate} />
              <ProcurementSummaryRow icon={<Warehouse className="h-3.5 w-3.5" />} label="Deliver to" value={warehouseName} />
            </dl>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 text-center">
              <div className="rounded-lg bg-slate-50 p-2">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Items</p>
                <p className="text-base font-bold text-slate-900">{lines.length}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <p className="text-[10px] font-semibold uppercase text-slate-400">Est. Value</p>
                <p className="truncate text-base font-bold text-slate-900">{formatMoney(totals.amount)}</p>
              </div>
            </div>
            {totals.low > 0 && (
              <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {totals.low} item{totals.low === 1 ? " is" : "s are"} at or below reorder level.
              </p>
            )}
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">What happens next</h3>
            <ol className="list-decimal space-y-1 pl-4">
              <li>Purchase &amp; Stores reviews and approves the request.</li>
              <li>They raise an RFQ or a direct purchase order.</li>
              <li>Goods arrive against a GRN and pass quality check.</li>
              <li>Stock is posted and you can track it here.</li>
            </ol>
          </section>
        </aside>
      </div>
    </Drawer>
  );
}
