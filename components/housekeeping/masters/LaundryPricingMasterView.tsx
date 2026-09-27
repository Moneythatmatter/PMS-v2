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

  const [serviceType, setServiceType] = useState<string>(LAUNDRY_SERVICE_TYPES[0]);
  const [itemId, setItemId] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
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

  const availableItems = useMemo(() => {
    if (!serviceType) return items;
    return items.filter((item) => {
      if (
        editing &&
        item.id === editing.itemId &&
        serviceType.toLowerCase() === editing.serviceType.toLowerCase()
      ) {
        return true;
      }
      return !pricing.some(
        (p) =>
          p.itemId === item.id &&
          p.serviceType.toLowerCase() === serviceType.toLowerCase() &&
          (!editing || p.id !== editing.id),
      );
    });
  }, [items, pricing, serviceType, editing]);

  const resetForm = () => {
    setEditing(null);
    setServiceType(LAUNDRY_SERVICE_TYPES[0]);
    setItemId("");
    setUnitPrice("");
    setIsActive(true);
  };

  const openCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (row: LaundryPricingMaster) => {
    setEditing(row);
    setServiceType(row.serviceType);
    setItemId(row.itemId);
    setUnitPrice(String(row.unitPrice ?? ""));
    setIsActive(row.isActive !== false);
    setPreview(null);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!serviceType) {
      toast.error("Select a service type");
      return;
    }
    if (!itemId) {
      toast.error("Select a laundry item");
      return;
    }
    const price = Number(unitPrice);
    if (!unitPrice.trim() || Number.isNaN(price) || price < 0) {
      toast.error("Enter a valid unit price");
      return;
    }

    const itemName = items.find((i) => i.id === itemId)?.name ?? "This item";

    const duplicate = pricing.find(
      (row) =>
        row.itemId === itemId &&
        row.serviceType.toLowerCase() === serviceType.toLowerCase() &&
        (!editing || row.id !== editing.id),
    );
    if (duplicate) {
      toast.error(`${itemName} with ${serviceType} already exists`);
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const record = await laundryPricingMasterService.update(editing.id, {
          itemId,
          serviceType,
          unitPrice: Math.round(price * 100) / 100,
          isActive,
        });
        setPricing((prev) =>
          prev.map((p) => (p.id === editing.id ? record : p)),
        );
        toast.success("Pricing updated");
      } else {
        const record = await laundryPricingMasterService.create({
          itemId,
          serviceType,
          unitPrice: Math.round(price * 100) / 100,
          isActive,
        });
        setPricing((prev) => [record, ...prev]);
        toast.success(`Pricing added for ${itemName} (${serviceType})`);
      }
      setFormOpen(false);
      resetForm();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to save pricing";
      toast.error(
        /unique|duplicate|already exists/i.test(message)
          ? `${itemName} with ${serviceType} already exists`
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
            ? "Update unit price and status for this item & service."
            : "Select service type, choose an item, and set its unit price."
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
              disabled={
                saving ||
                (!editing && availableItems.length === 0 && !!serviceType)
              }
              onClick={() => void handleSave()}
            >
              {saving ? "Saving…" : editing ? "Update Price" : "Save Price"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Service Type" required>
            <SelectInput
              value={serviceType}
              onChange={(e) => {
                const nextService = e.target.value;
                setServiceType(nextService);
                if (
                  itemId &&
                  pricing.some(
                    (p) =>
                      p.itemId === itemId &&
                      p.serviceType.toLowerCase() ===
                        nextService.toLowerCase() &&
                      (!editing || p.id !== editing.id),
                  )
                ) {
                  setItemId("");
                }
              }}
              disabled={!!editing}
            >
              <option value="">Select service</option>
              {LAUNDRY_SERVICE_TYPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Laundry Item" required>
            <SelectInput
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              disabled={!!editing}
            >
              <option value="">
                {availableItems.length === 0 && serviceType
                  ? "No available items (all items priced for this service)"
                  : "Select item"}
              </option>
              {availableItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.itemCode})
                </option>
              ))}
            </SelectInput>
          </FormField>

          {!editing && serviceType && availableItems.length === 0 && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
              All {items.length} laundry items already have a price configured for{" "}
              <strong>{serviceType}</strong>.
            </p>
          )}

          <FormField label="Unit Price (₹)" required>
            <TextInput
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 75"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
            />
          </FormField>

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
