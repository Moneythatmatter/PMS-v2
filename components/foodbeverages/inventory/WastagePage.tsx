"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, FlaskConical, Package, Plus, RefreshCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import {
  AlertBanner,
  FormField,
  FOPageHeader,
  SelectInput,
  TextInput,
} from "@/components/frontoffice/ui";
import { ConfirmModal } from "@/components/frontoffice/ui/Modal";
import { OperationsToolbar } from "@/components/housekeeping/OperationsToolbar";
import { usePsList } from "@/hooks/usePsResource";
import {
  conversionItemService,
  ingredientService,
  wastageService,
} from "@/services/food-beverages";
import type { ConversionItem, FbIngredient } from "@/app/data/foodbeverages/conversions";
import { formatMoney, formatQty } from "@/components/requisitions/requisitionUi";

type ItemCategory = "ingredient" | "converted" | "other";

type WastageRow = {
  id: string;
  entryNo?: string;
  type?: string;
  itemCategory?: ItemCategory | string;
  itemId?: string | null;
  item?: string;
  uom?: string;
  qty?: number;
  value?: number;
  reason?: string;
  status?: string;
  stockDeducted?: boolean;
  createdAt?: string;
};

const TYPE_OPTIONS = ["Spoilage", "Breakage", "Theft", "Other"] as const;
const CATEGORY_OPTIONS: { value: ItemCategory; label: string; hint: string }[] = [
  { value: "ingredient", label: "Ingredient", hint: "Raw kitchen materials from Ingredients" },
  { value: "converted", label: "Converted / prepared", hint: "Transformation items (dough, gravy, batter)" },
  { value: "other", label: "Other", hint: "Free-text item with no stock link" },
];

function categoryLabel(v?: string | null) {
  if (v === "ingredient") return "Ingredient";
  if (v === "converted") return "Converted";
  return "Other";
}

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s === "approved" || s === "posted") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (s === "pending") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-600";
}

function formatWhen(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function moneyValue(v: unknown) {
  if (typeof v === "number") return v;
  const cleaned = String(v ?? "").replace(/[₹,\s]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function WastagePage() {
  const wastage = usePsList(() => wastageService.list() as Promise<WastageRow[]>, []);
  const ingredients = usePsList(() => ingredientService.list() as Promise<FbIngredient[]>, []);
  const conversionItems = usePsList(() => conversionItemService.list(), []);

  const rawIngredients = useMemo(
    () =>
      (ingredients.data as FbIngredient[])
        .filter((i) => String(i.kind ?? "raw").toLowerCase() !== "prepared")
        .filter((i) => String(i.status ?? "Active").toLowerCase() !== "inactive")
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [ingredients.data],
  );

  const preparedItems = useMemo(
    () =>
      (conversionItems.data as ConversionItem[])
        .filter((i) => i.status === "Active")
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [conversionItems.data],
  );

  const rows = useMemo(
    () =>
      (wastage.data as WastageRow[]).slice().sort((a, b) => {
        return String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""));
      }),
    [wastage.data],
  );

  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [toast, setToast] = useState<{ message: string; variant: "success" | "info" | "error" } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<WastageRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WastageRow | null>(null);

  const [type, setType] = useState<string>("Spoilage");
  const [itemCategory, setItemCategory] = useState<ItemCategory>("ingredient");
  const [itemId, setItemId] = useState("");
  const [itemName, setItemName] = useState("");
  const [qty, setQty] = useState("");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");

  const selectedIngredient = rawIngredients.find((i) => i.id === itemId) ?? null;
  const selectedConverted = preparedItems.find((i) => i.id === itemId) ?? null;
  const selectedUom =
    itemCategory === "ingredient"
      ? selectedIngredient?.uom || ""
      : itemCategory === "converted"
        ? selectedConverted?.yieldUom || ""
        : "";
  const selectedOnHand =
    itemCategory === "ingredient"
      ? Number(selectedIngredient?.onHand) || 0
      : itemCategory === "converted"
        ? Number(
            (ingredients.data as FbIngredient[]).find((i) => i.id === selectedConverted?.outputIngredientId)
              ?.onHand,
          ) || 0
        : null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusTab === "ingredient" && row.itemCategory !== "ingredient") return false;
      if (statusTab === "converted" && row.itemCategory !== "converted") return false;
      if (statusTab === "other" && row.itemCategory !== "other" && row.itemCategory) return false;
      if (!q) return true;
      return [row.entryNo, row.item, row.reason, row.type, row.itemId, row.itemCategory]
        .map((v) => String(v ?? "").toLowerCase())
        .some((v) => v.includes(q));
    });
  }, [rows, search, statusTab]);

  const kpis = useMemo(() => {
    const today = new Date().toLocaleDateString("sv-SE");
    const isToday = (r: WastageRow) => String(r.createdAt ?? "").slice(0, 10) === today;
    const month = today.slice(0, 7);
    const isMonth = (r: WastageRow) => String(r.createdAt ?? "").slice(0, 7) === month;
    return {
      today: rows.filter(isToday).length,
      spoilageMtd: rows
        .filter((r) => isMonth(r) && String(r.type) === "Spoilage")
        .reduce((s, r) => s + moneyValue(r.value), 0),
      breakageMtd: rows
        .filter((r) => isMonth(r) && String(r.type) === "Breakage")
        .reduce((s, r) => s + moneyValue(r.value), 0),
      deducted: rows.filter((r) => r.stockDeducted).length,
    };
  }, [rows]);

  const openCreate = () => {
    setEditing(null);
    setType("Spoilage");
    setItemCategory("ingredient");
    setItemId("");
    setItemName("");
    setQty("");
    setValue("");
    setReason("");
    setDrawerOpen(true);
  };

  const openEdit = (row: WastageRow) => {
    setEditing(row);
    setType(String(row.type || "Spoilage"));
    setItemCategory((row.itemCategory as ItemCategory) || "other");
    setItemId(String(row.itemId ?? ""));
    setItemName(String(row.item ?? ""));
    setQty(row.qty == null ? "" : String(row.qty));
    setValue(String(moneyValue(row.value) || ""));
    setReason(String(row.reason ?? ""));
    setDrawerOpen(true);
  };

  const handleCategoryChange = (next: ItemCategory) => {
    setItemCategory(next);
    setItemId("");
    if (next !== "other") setItemName("");
  };

  const handleSave = async () => {
    const qtyNum = Number(qty);
    const valueNum = Number(value);
    if (!TYPE_OPTIONS.includes(type as (typeof TYPE_OPTIONS)[number]) && !type.trim()) {
      setToast({ message: "Select a wastage type.", variant: "info" });
      return;
    }
    if (itemCategory !== "other" && !itemId) {
      setToast({
        message:
          itemCategory === "ingredient"
            ? "Select the ingredient being wasted."
            : "Select the converted item being wasted.",
        variant: "info",
      });
      return;
    }
    if (itemCategory === "other" && !itemName.trim()) {
      setToast({ message: "Enter the item name.", variant: "info" });
      return;
    }
    if (!(qtyNum > 0)) {
      setToast({ message: "Enter a quantity greater than 0.", variant: "info" });
      return;
    }
    if (value.trim() !== "" && (valueNum < 0 || Number.isNaN(valueNum))) {
      setToast({ message: "Value cannot be negative.", variant: "info" });
      return;
    }
    if (!reason.trim()) {
      setToast({ message: "Enter the reason for wastage.", variant: "info" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type,
        itemCategory,
        itemId: itemCategory === "other" ? null : itemId,
        item:
          itemCategory === "ingredient"
            ? selectedIngredient?.name || itemName
            : itemCategory === "converted"
              ? selectedConverted?.name || itemName
              : itemName.trim(),
        uom: selectedUom,
        qty: qtyNum,
        value: value.trim() === "" ? null : valueNum,
        reason: reason.trim(),
        status: "Approved",
      };
      const saved = (
        editing
          ? await wastageService.update(editing.id, payload)
          : await wastageService.create(payload)
      ) as WastageRow;
      await Promise.all([wastage.reload(), ingredients.reload()]);
      setDrawerOpen(false);
      setToast({
        message: editing
          ? `${saved.entryNo || "Entry"} updated.`
          : `${saved.entryNo || "Wastage"} logged${itemCategory !== "other" ? " and stock deducted" : ""}.`,
        variant: "success",
      });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Save failed", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await wastageService.remove(deleteTarget.id);
      setDeleteTarget(null);
      await wastage.reload();
      setToast({ message: `${deleteTarget.entryNo || "Entry"} deleted.`, variant: "info" });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Delete failed", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const statusFilters = [
    { id: "all", label: "All", count: rows.length },
    { id: "ingredient", label: "Ingredients", count: rows.filter((r) => r.itemCategory === "ingredient").length },
    { id: "converted", label: "Converted", count: rows.filter((r) => r.itemCategory === "converted").length },
    { id: "other", label: "Other", count: rows.filter((r) => !r.itemCategory || r.itemCategory === "other").length },
  ];

  return (
    <div className="space-y-4 p-4 md:p-6">
      {toast && (
        <AlertBanner variant={toast.variant} message={toast.message} onDismiss={() => setToast(null)} />
      )}
      {wastage.error && (
        <AlertBanner variant="error" message={`Could not load wastage: ${wastage.error}`} />
      )}

      <FOPageHeader
        eyebrow="Food & Beverages / Inventory"
        title="Wastage"
        description="Log spoilage and write-offs against Ingredients, converted items, or other materials — with item IDs for reporting."
        action={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void wastage.reload()}
              className="h-9 gap-1.5 rounded-xl px-3 text-xs font-bold"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", wastage.loading && "animate-spin")} /> Refresh
            </Button>
            <Button
              type="button"
              onClick={openCreate}
              className="h-9 gap-1.5 rounded-xl px-4 text-xs font-bold !bg-emerald-700 text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Log Wastage
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Today", value: String(kpis.today), sub: "Entries", icon: Package, tone: "bg-amber-50 text-amber-700" },
          {
            label: "Spoilage MTD",
            value: formatMoney(kpis.spoilageMtd),
            sub: "Food",
            icon: AlertTriangle,
            tone: "bg-red-50 text-red-700",
          },
          {
            label: "Breakage MTD",
            value: formatMoney(kpis.breakageMtd),
            sub: "Crockery",
            icon: Package,
            tone: "bg-slate-50 text-slate-600",
          },
          {
            label: "Stock deducted",
            value: String(kpis.deducted),
            sub: "Linked write-offs",
            icon: FlaskConical,
            tone: "bg-sky-50 text-sky-700",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-2xs"
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{card.label}</p>
              <p className="text-lg font-extrabold text-slate-800">{card.value}</p>
              <p className="text-[10px] text-slate-400">{card.sub}</p>
            </div>
            <div className={cn("rounded-lg p-2", card.tone)}>
              <card.icon className="h-4 w-4" />
            </div>
          </div>
        ))}
      </div>

      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search entry, item, reason or ID…"
        showFilters={false}
        statusTabs={statusFilters}
        activeStatusTab={statusTab}
        onStatusTabChange={setStatusTab}
      />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        {wastage.loading && rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">Loading wastage…</p>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-semibold text-slate-700">No wastage entries</p>
            <p className="mt-1 text-xs text-slate-400">
              Log spoilage against an ingredient, converted item, or other material.
            </p>
            <Button type="button" onClick={openCreate} className="mt-4 h-9 rounded-xl text-xs font-bold">
              <Plus className="mr-1 h-3.5 w-3.5" /> Log Wastage
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Entry</th>
                  <th className="px-4 py-2.5">Item</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5 text-right">Qty</th>
                  <th className="px-4 py-2.5 text-right">Value</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-bold text-slate-800">{row.entryNo || "—"}</p>
                      <p className="text-[11px] text-slate-400">{formatWhen(row.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{row.item || "—"}</p>
                      <p className="text-[11px] text-slate-500">
                        {row.type || "—"}
                        {row.reason ? ` · ${row.reason}` : ""}
                      </p>
                      {row.itemId && (
                        <p className="mt-0.5 font-mono text-[10px] text-slate-400">ID {row.itemId}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                        {categoryLabel(row.itemCategory)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold tabular-nums text-slate-900">
                      {formatQty(Number(row.qty) || 0)}
                      <span className="ml-1 text-[10px] font-medium text-slate-400">{row.uom || ""}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                      {formatMoney(moneyValue(row.value))}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
                          statusTone(String(row.status ?? "")),
                        )}
                      >
                        {row.status || "—"}
                      </span>
                      {row.stockDeducted && (
                        <p className="mt-1 text-[10px] font-medium text-emerald-700">Stock deducted</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 rounded-lg px-2.5 text-[11px] font-bold"
                          onClick={() => openEdit(row)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 rounded-lg px-2.5 text-[11px] font-bold text-red-600"
                          onClick={() => setDeleteTarget(row)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Drawer
        side="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? `Edit ${editing.entryNo || "wastage"}` : "Log Wastage"}
        width="responsive"
        footer={
          <div className="flex w-full flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDrawerOpen(false)} className="h-9 rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="h-9 rounded-xl text-xs font-bold !bg-emerald-700 text-white"
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        }
      >
        <div className="mx-auto grid w-full max-w-6xl gap-4 p-1 sm:grid-cols-2">
          <FormField label="Wastage type" required className="sm:col-span-2" helperText="Why the write-off happened. Saving deducts linked stock immediately.">
            <SelectInput value={type} onChange={(e) => setType(e.target.value)} className="block">
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField
            label="Item category"
            required
            className="sm:col-span-2"
            helperText="Choose where the wasted item comes from so reporting can use its ID."
          >
            <div className="grid gap-2 sm:grid-cols-3">
              {CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleCategoryChange(opt.value)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left transition",
                    itemCategory === opt.value
                      ? "border-emerald-300 bg-emerald-50 ring-1 ring-emerald-200"
                      : "border-slate-200 bg-white hover:border-slate-300",
                  )}
                >
                  <p className="text-xs font-bold text-slate-900">{opt.label}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">{opt.hint}</p>
                </button>
              ))}
            </div>
          </FormField>

          {itemCategory === "ingredient" && (
            <FormField label="Ingredient" required className="sm:col-span-2" helperText="Stores the ingredient ID for reports.">
              <SelectInput value={itemId} onChange={(e) => setItemId(e.target.value)} className="block">
                <option value="">Select ingredient…</option>
                {rawIngredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name}
                    {ing.code ? ` (${ing.code})` : ""} · on hand {formatQty(Number(ing.onHand) || 0)} {ing.uom || ""}
                  </option>
                ))}
              </SelectInput>
            </FormField>
          )}

          {itemCategory === "converted" && (
            <FormField
              label="Converted / prepared item"
              required
              className="sm:col-span-2"
              helperText="Stores the conversion item ID for reports."
            >
              <SelectInput value={itemId} onChange={(e) => setItemId(e.target.value)} className="block">
                <option value="">Select converted item…</option>
                {preparedItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {item.code ? ` (${item.code})` : ""} · {item.yieldUom}
                  </option>
                ))}
              </SelectInput>
            </FormField>
          )}

          {itemCategory === "other" && (
            <FormField label="Item name" required className="sm:col-span-2" helperText="No master ID — free-text only.">
              <TextInput
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Crockery plate / guest amenity"
              />
            </FormField>
          )}

          {(itemCategory === "ingredient" || itemCategory === "converted") && itemId && (
            <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
              <p>
                <span className="font-semibold text-slate-800">Selected ID:</span>{" "}
                <span className="font-mono">{itemId}</span>
              </p>
              {selectedOnHand != null && (
                <p className="mt-1">
                  On hand:{" "}
                  <strong className="text-slate-900">
                    {formatQty(selectedOnHand)} {selectedUom}
                  </strong>
                  {" — deducted from stock on save"}
                </p>
              )}
            </div>
          )}

          <FormField label="Qty" required helperText={selectedUom ? `Unit: ${selectedUom}` : "Quantity wasted"}>
            <TextInput
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="e.g. 0.5"
            />
          </FormField>

          <FormField label="Value (₹)" helperText="Optional write-off value for accounts.">
            <TextInput
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 480"
            />
          </FormField>

          <FormField label="Reason" required className="sm:col-span-2">
            <TextInput
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Expired / dropped / overcooked"
            />
          </FormField>
        </div>
      </Drawer>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
        title="Delete wastage entry?"
        message={
          deleteTarget
            ? `${deleteTarget.entryNo || "This entry"} will be removed. Stock already deducted is not restored automatically.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
        loading={saving}
      />
    </div>
  );
}
