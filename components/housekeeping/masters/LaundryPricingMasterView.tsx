"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, IndianRupee, Plus, Shirt, Trash2 } from "lucide-react";
import {
  LAUNDRY_SERVICE_TYPES,
  type LaundryItemMaster,
  type LaundryPricingMaster,
} from "@/app/data/housekeeping/masters";
import { laundryItemMasterService } from "@/services/housekeeping/laundry-items-master";
import { laundryPricingMasterService } from "@/services/housekeeping/laundry-pricing-master";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Drawer,
  FormField,
  FOPageHeader,
  FOSearchToolbar,
  SelectInput,
  StatMiniCard,
  TextInput,
} from "@/components/frontoffice/ui";
import { toast } from "@/components/ui/toast";

type PriceLine = {
  key: string;
  serviceType: string;
  unitPrice: string;
};

function newPriceLine(serviceType?: string): PriceLine {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    serviceType: serviceType ?? LAUNDRY_SERVICE_TYPES[0],
    unitPrice: "",
  };
}

function formatINR(amount: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatUpdatedAt(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LaundryPricingMasterView() {
  const [items, setItems] = useState<LaundryItemMaster[]>([]);
  const [pricing, setPricing] = useState<LaundryPricingMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LaundryPricingMaster | null>(null);
  const [preview, setPreview] = useState<LaundryPricingMaster | null>(null);
  const [saving, setSaving] = useState(false);

  const [itemId, setItemId] = useState("");
  const [priceLines, setPriceLines] = useState<PriceLine[]>([newPriceLine()]);
  const [isActive, setIsActive] = useState(true);

  const itemMap = useMemo(() => {
    const map = new Map<string, LaundryItemMaster>();
    for (const item of items) map.set(item.id, item);
    return map;
  }, [items]);

  const enriched = useMemo(
    () =>
      pricing.map((row) => {
        const item = itemMap.get(row.itemId);
        return {
          ...row,
          itemName: item?.name ?? row.itemName ?? "Unknown item",
          itemCode: item?.itemCode ?? row.itemCode,
        };
      }),
    [pricing, itemMap],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [itemRows, priceRows] = await Promise.all([
          laundryItemMasterService.list(),
          laundryPricingMasterService.list(),
        ]);
        if (!cancelled) {
          setItems(itemRows.filter((i) => i.isActive !== false));
          setPricing(priceRows);
        }
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : "Failed to load pricing");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter((row) => {
      const matchesActive =
        activeFilter === "all" ||
        (activeFilter === "active" && row.isActive !== false) ||
        (activeFilter === "inactive" && row.isActive === false);
      return (
        matchesActive &&
        (!q ||
          (row.itemName ?? "").toLowerCase().includes(q) ||
          (row.itemCode ?? "").toLowerCase().includes(q) ||
          row.serviceType.toLowerCase().includes(q))
      );
    });
  }, [enriched, search, activeFilter]);

  const stats = useMemo(
    () => ({
      total: pricing.length,
      active: pricing.filter((p) => p.isActive !== false).length,
      avg:
        pricing.length === 0
          ? 0
          : Math.round(
              (pricing.reduce((s, p) => s + Number(p.unitPrice || 0), 0) /
                pricing.length) *
                100,
            ) / 100,
    }),
    [pricing],
  );

  const resetForm = () => {
    setEditing(null);
    setItemId(items[0]?.id ?? "");
    setPriceLines([newPriceLine()]);
    setIsActive(true);
  };

  const openCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (row: LaundryPricingMaster) => {
    setEditing(row);
    setItemId(row.itemId);
    setPriceLines([
      {
        key: row.id,
        serviceType: row.serviceType,
        unitPrice: String(row.unitPrice ?? ""),
      },
    ]);
    setIsActive(row.isActive !== false);
    setPreview(null);
    setFormOpen(true);
  };

  const updatePriceLine = (key: string, patch: Partial<PriceLine>) => {
    setPriceLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  };

  const handleSave = async () => {
    if (!itemId) {
      toast.error("Select a laundry item");
      return;
    }

    const itemName = items.find((i) => i.id === itemId)?.name ?? "This item";

    if (editing) {
      const line = priceLines[0];
      if (!line?.serviceType) {
        toast.error("Select a service type");
        return;
      }
      const price = Number(line.unitPrice);
      if (!line.unitPrice.trim() || Number.isNaN(price) || price < 0) {
        toast.error("Enter a valid unit price");
        return;
      }
      const duplicate = pricing.find(
        (row) =>
          row.itemId === itemId &&
          row.serviceType === line.serviceType &&
          row.id !== editing.id,
      );
      if (duplicate) {
        toast.error(`${itemName} with ${line.serviceType} already exists`);
        return;
      }
      setSaving(true);
      try {
        const record = await laundryPricingMasterService.update(editing.id, {
          itemId,
          serviceType: line.serviceType,
          unitPrice: Math.round(price * 100) / 100,
          isActive,
        });
        setPricing((prev) =>
          prev.map((p) => (p.id === editing.id ? record : p)),
        );
        toast.success("Pricing updated");
        setFormOpen(false);
        resetForm();
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Failed to save pricing";
        toast.error(
          /unique|duplicate|already exists/i.test(message)
            ? `${itemName} with ${line.serviceType} already exists`
            : message,
        );
      } finally {
        setSaving(false);
      }
      return;
    }

    const validLines: { serviceType: string; unitPrice: number }[] = [];
    const seenInForm = new Set<string>();

    for (const line of priceLines) {
      if (!line.serviceType) {
        toast.error("Select a service type for each row");
        return;
      }
      const price = Number(line.unitPrice);
      if (!line.unitPrice.trim() || Number.isNaN(price) || price < 0) {
        toast.error(`Enter a valid price for ${line.serviceType}`);
        return;
      }
      if (seenInForm.has(line.serviceType)) {
        toast.error(`${line.serviceType} is listed more than once`);
        return;
      }
      seenInForm.add(line.serviceType);

      const exists = pricing.some(
        (row) =>
          row.itemId === itemId && row.serviceType === line.serviceType,
      );
      if (exists) {
        toast.error(`${itemName} with ${line.serviceType} already exists`);
        return;
      }

      validLines.push({
        serviceType: line.serviceType,
        unitPrice: Math.round(price * 100) / 100,
      });
    }

    if (validLines.length === 0) {
      toast.error("Add at least one service with price");
      return;
    }

    setSaving(true);
    try {
      const created: LaundryPricingMaster[] = [];
      for (const line of validLines) {
        const record = await laundryPricingMasterService.create({
          itemId,
          serviceType: line.serviceType,
          unitPrice: line.unitPrice,
          isActive,
        });
        created.push(record);
      }
      setPricing((prev) => [...created, ...prev]);
      toast.success(
        created.length === 1
          ? "Pricing added"
          : `${created.length} service prices added for ${itemName}`,
      );
      setFormOpen(false);
      resetForm();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save pricing";
      toast.error(
        /unique|duplicate|already exists/i.test(message)
          ? message
          : message,
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="space-y-5">
      <FOPageHeader
        eyebrow="Housekeeping · Masters"
        title="Laundry Pricing Master"
        description="Set unit prices by item and service — Ironing, Washing, Dry Cleaning, and more."
        action={
          <Button
            size="sm"
            className="bg-[#0B6B4F] hover:bg-[#095a43]"
            onClick={openCreate}
            disabled={items.length === 0}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Pricing
          </Button>
        }
      />

      {items.length === 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Add laundry items first in{" "}
          <a
            href="/housekeeping/masters/laundry-items"
            className="font-semibold underline"
          >
            Laundry Item Master
          </a>
          .
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatMiniCard label="Price Rows" value={stats.total} icon={IndianRupee} />
        <StatMiniCard
          label="Active"
          value={stats.active}
          accent="#10b981"
          icon={CheckCircle2}
        />
        <StatMiniCard
          label="Avg Unit Price"
          value={formatINR(stats.avg)}
          accent="#0ea5e9"
          icon={Shirt}
        />
      </div>

      <FOSearchToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search item or service…"
        filterPills={{
          active: activeFilter,
          onChange: setActiveFilter,
          options: [
            { id: "all", label: "All" },
            { id: "active", label: "Active" },
            { id: "inactive", label: "Inactive" },
          ],
        }}
      />

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Service Type</th>
              <th className="px-4 py-3">Unit Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-sm text-slate-400"
                >
                  No pricing rows yet. Add item + service + price.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer hover:bg-emerald-50/40"
                  onClick={() => setPreview(row)}
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{row.itemName}</p>
                    <p className="font-mono text-[10px] text-slate-400">
                      {row.itemCode}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{row.serviceType}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {formatINR(row.unitPrice)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={row.isActive === false ? "Inactive" : "Active"}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {formatUpdatedAt(row.updatedAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Drawer
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview ? `${preview.itemName} · ${preview.serviceType}` : "Pricing"}
        description={preview?.itemCode}
        footer={
          preview ? (
            <>
              <Button variant="outline" onClick={() => setPreview(null)}>
                Close
              </Button>
              <Button
                className="bg-[#0B6B4F] hover:bg-[#095a43]"
                onClick={() => openEdit(preview)}
              >
                Edit
              </Button>
            </>
          ) : undefined
        }
      >
        {preview && (
          <dl className="space-y-3 text-sm">
            {[
              ["Item", preview.itemName ?? "—"],
              ["Service", preview.serviceType],
              ["Unit Price", formatINR(preview.unitPrice)],
              ["Status", preview.isActive === false ? "Inactive" : "Active"],
              ["Updated", formatUpdatedAt(preview.updatedAt)],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between gap-4 border-b border-slate-50 pb-2"
              >
                <dt className="text-slate-500">{k}</dt>
                <dd className="font-medium text-slate-900">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </Drawer>

      <Drawer
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          resetForm();
        }}
        title={editing ? "Edit Pricing" : "Add Pricing"}
        description={
          editing
            ? "Update service and unit price for this item."
            : "Select one item, then add multiple services with prices."
        }
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setFormOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#0B6B4F] hover:bg-[#095a43]"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving
                ? "Saving…"
                : editing
                  ? "Update Price"
                  : priceLines.length > 1
                    ? `Save ${priceLines.length} Prices`
                    : "Save Price"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Laundry Item" required>
            <SelectInput
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              disabled={!!editing}
            >
              <option value="">Select item</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.itemCode})
                </option>
              ))}
            </SelectInput>
          </FormField>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Services & Prices
              </p>
              {!editing && (
                <button
                  type="button"
                  onClick={() => {
                    const used = new Set(priceLines.map((l) => l.serviceType));
                    const next =
                      LAUNDRY_SERVICE_TYPES.find((s) => !used.has(s)) ??
                      LAUNDRY_SERVICE_TYPES[0];
                    setPriceLines((prev) => [...prev, newPriceLine(next)]);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add service
                </button>
              )}
            </div>

            {priceLines.map((line) => (
              <div
                key={line.key}
                className="grid grid-cols-12 items-end gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5"
              >
                <div className="col-span-12 sm:col-span-6">
                  <FormField label="Service Type" required>
                    <SelectInput
                      value={line.serviceType}
                      onChange={(e) =>
                        updatePriceLine(line.key, {
                          serviceType: e.target.value,
                        })
                      }
                      disabled={!!editing}
                    >
                      {LAUNDRY_SERVICE_TYPES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>
                </div>
                <div className="col-span-10 sm:col-span-5">
                  <FormField label="Unit Price (₹)" required>
                    <TextInput
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g. 73"
                      value={line.unitPrice}
                      onChange={(e) =>
                        updatePriceLine(line.key, {
                          unitPrice: e.target.value,
                        })
                      }
                    />
                  </FormField>
                </div>
                {!editing && (
                  <div className="col-span-2 flex justify-end pb-1 sm:col-span-1">
                    <button
                      type="button"
                      disabled={priceLines.length <= 1}
                      onClick={() =>
                        setPriceLines((prev) =>
                          prev.filter((l) => l.key !== line.key),
                        )
                      }
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                      aria-label="Remove service"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <FormField label="Status">
            <SelectInput
              value={isActive ? "active" : "inactive"}
              onChange={(e) => setIsActive(e.target.value === "active")}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </SelectInput>
          </FormField>
        </div>
      </Drawer>
    </div>
  );
}
