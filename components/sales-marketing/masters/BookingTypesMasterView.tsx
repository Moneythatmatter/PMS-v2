"use client";

import React, { useMemo, useState } from "react";
import {
  Sparkles,
  Building2,
  Bed,
  UtensilsCrossed,
  Waves,
  CalendarDays,
  Search,
  CheckCircle2,
  XCircle,
  Info,
  RotateCcw,
  Plus,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Card, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  type BookingTypeIconKey,
  type BookingTypeDefinition,
} from "@/lib/sales-marketing/booking-types";
import { usePropertyBookingTypes } from "@/lib/sales-marketing/property-booking-types";

const ICON_MAP: Record<BookingTypeIconKey, LucideIcon> = {
  sparkles: Sparkles,
  building2: Building2,
  bed: Bed,
  utensils: UtensilsCrossed,
  waves: Waves,
  calendar: CalendarDays,
};

const ICON_OPTIONS: { value: BookingTypeIconKey; label: string }[] = [
  { value: "sparkles", label: "Events / Banquet" },
  { value: "building2", label: "Conference / Corporate" },
  { value: "bed", label: "Room Stay" },
  { value: "utensils", label: "Restaurant / F&B" },
  { value: "waves", label: "Pool / Leisure" },
  { value: "calendar", label: "General / Other" },
];

const EMPTY_FORM = {
  name: "",
  description: "",
  beoRequired: false,
  handoverNote: "",
  iconKey: "calendar" as BookingTypeIconKey,
};

export function BookingTypesMasterView() {
  const {
    propertyName,
    sortedCatalog,
    settings,
    enabledCount,
    totalCount,
    systemCount,
    customCount,
    setEnabled,
    resetToDefaults,
    createBookingType,
    deleteCustomBookingType,
  } = usePropertyBookingTypes();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ENABLED" | "DISABLED">(
    "ALL",
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredTypes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return sortedCatalog.filter((item) => {
      const enabled = settings[item.code]?.enabled !== false;
      if (statusFilter === "ENABLED" && !enabled) return false;
      if (statusFilter === "DISABLED" && enabled) return false;
      if (!q) return true;
      return (
        item.cardLabel.toLowerCase().includes(q) ||
        item.centralType.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });
  }, [sortedCatalog, settings, searchTerm, statusFilter]);

  const disabledCount = totalCount - enabledCount;

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggle = async (item: BookingTypeDefinition) => {
    const currentlyEnabled = settings[item.code]?.enabled !== false;
    const nextEnabled = !currentlyEnabled;

    if (nextEnabled === false && enabledCount <= 1) {
      showToast("At least one booking type must stay enabled for this property.");
      return;
    }

    try {
      await setEnabled(item.code, nextEnabled);
      showToast(
        nextEnabled
          ? `✓ "${item.cardLabel}" enabled for ${propertyName}.`
          : `"${item.cardLabel}" disabled — it will no longer appear in Create Booking.`,
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to update booking type.");
    }
  };

  const handleOpenCreate = () => {
    setFormData(EMPTY_FORM);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    try {
      const created = await createBookingType({
        name: formData.name,
        description: formData.description,
        beoRequired: formData.beoRequired,
        handoverNote: formData.handoverNote,
        iconKey: formData.iconKey,
      });
      setIsCreateModalOpen(false);
      setFormData(EMPTY_FORM);
      showToast(`✓ Created booking type "${created.cardLabel}" for ${propertyName}.`);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to create booking type.");
    }
  };

  const handleDelete = async (item: BookingTypeDefinition) => {
    if (item.isSystem) return;
    if (enabledCount <= 1 && settings[item.code]?.enabled !== false) {
      showToast("Enable another booking type before deleting this one.");
      return;
    }
    if (!confirm(`Delete custom booking type "${item.cardLabel}"?`)) return;
    await deleteCustomBookingType(item.code);
    showToast(`Deleted booking type "${item.cardLabel}".`);
  };

  const renderTypeBadge = (item: BookingTypeDefinition) => (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] font-bold",
        item.isSystem
          ? "border-slate-200 bg-slate-100 text-slate-600"
          : "border-blue-200 bg-blue-50 text-blue-800",
      )}
    >
      {item.isSystem ? "System" : "Custom"}
    </span>
  );

  return (
    <ModulePageShell
      title="Booking Types"
      description="Control which booking classifications are available when creating bookings, leads, and inquiries for this property."
      breadcrumbs={[
        { label: "Sales & Marketing", href: "/sales-marketing/dashboard" },
        { label: "Masters", href: "/sales-marketing/masters" },
        { label: "Booking Types" },
      ]}
      primaryAction={{
        label: "Add Booking Type",
        onClick: handleOpenCreate,
      }}
    >
      {toastMessage && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800">
          {toastMessage}
        </div>
      )}

      <div className="mb-4 flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 text-xs text-slate-600">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <p>
            Settings apply to <strong className="text-slate-800">{propertyName}</strong>.
            Disable types your property does not need, or create custom booking types for
            property-specific offerings.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={resetToDefaults}
          className="shrink-0 text-xs"
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Enable all types
        </Button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Total types
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalCount}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {systemCount} system + {customCount} custom
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
            Enabled for property
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-800">{enabledCount}</p>
          <p className="mt-0.5 text-xs text-slate-500">Shown in Create Booking</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Disabled
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-700">{disabledCount}</p>
          <p className="mt-0.5 text-xs text-slate-500">Hidden from new bookings</p>
        </Card>
      </div>

      <div className="mb-4 flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search booking types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none sm:text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "ALL" | "ENABLED" | "DISABLED")
          }
          className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-slate-300 focus:outline-none"
        >
          <option value="ALL">All statuses</option>
          <option value="ENABLED">Enabled only</option>
          <option value="DISABLED">Disabled only</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Booking type</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-center">BEO</th>
                <th className="px-4 py-3 text-center">Handover</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredTypes.map((item) => {
                const Icon = ICON_MAP[item.iconKey];
                const enabled = settings[item.code]?.enabled !== false;
                return (
                  <tr key={item.code} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                          <Icon className="h-4 w-4 text-slate-600" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900">{item.cardLabel}</p>
                            {renderTypeBadge(item)}
                          </div>
                          <p className="font-mono text-[10px] text-slate-400">{item.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-slate-500">{item.description}</td>
                    <td className="px-4 py-3 text-center">
                      {item.beoRequired ? (
                        <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                          Required
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-[11px] text-slate-500">
                      {item.handoverNote ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold",
                          enabled
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-slate-200 bg-slate-100 text-slate-600",
                        )}
                      >
                        {enabled ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {enabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggle(item)}
                          className={cn(
                            "h-7 text-[11px]",
                            enabled
                              ? "text-slate-600"
                              : "border-emerald-200 bg-emerald-50/50 text-emerald-700",
                          )}
                        >
                          {enabled ? "Disable" : "Enable"}
                        </Button>
                        {!item.isSystem && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(item)}
                            className="h-7 text-[11px] text-rose-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-slate-100 md:hidden">
          {filteredTypes.map((item) => {
            const Icon = ICON_MAP[item.iconKey];
            const enabled = settings[item.code]?.enabled !== false;
            return (
              <div key={item.code} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                      <Icon className="h-4 w-4 text-slate-600" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900">{item.cardLabel}</p>
                        {renderTypeBadge(item)}
                      </div>
                      <p className="text-[11px] text-slate-500">{item.description}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold",
                      enabled
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-slate-100 text-slate-600",
                    )}
                  >
                    {enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
                  {item.beoRequired && (
                    <span className="rounded border border-purple-200 bg-purple-50 px-1.5 py-0.5 font-semibold text-purple-800">
                      BEO required
                    </span>
                  )}
                  {item.handoverNote && (
                    <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5">
                      {item.handoverNote}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggle(item)}
                    className="flex-1 text-xs"
                  >
                    {enabled ? "Disable for this property" : "Enable for this property"}
                  </Button>
                  {!item.isSystem && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item)}
                      className="text-xs text-rose-700"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredTypes.length === 0 && (
          <div className="px-4 py-10 text-center text-xs italic text-slate-400">
            No booking types match your search or filter.
          </div>
        )}
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Booking Type"
        maxWidth="sm"
      >
        <form onSubmit={handleCreate} className="space-y-3.5 p-1 text-xs">
          {formError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-800">
              {formError}
            </div>
          )}

          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700">
              Booking Type Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Spa Package, Day Outing, Farm Stay..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Brief description shown in Create Booking..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700">Icon</label>
            <select
              value={formData.iconKey}
              onChange={(e) =>
                setFormData({ ...formData, iconKey: e.target.value as BookingTypeIconKey })
              }
              className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              {ICON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-slate-700">
              Handover Note
            </label>
            <input
              type="text"
              placeholder="e.g. Front Office handover, F&B handover..."
              value={formData.handoverNote}
              onChange={(e) => setFormData({ ...formData, handoverNote: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-700">
            <input
              type="checkbox"
              checked={formData.beoRequired}
              onChange={(e) => setFormData({ ...formData, beoRequired: e.target.checked })}
              className="rounded text-emerald-700 focus:ring-emerald-600"
            />
            BEO (Banquet Event Order) required for this type
          </label>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
              className="rounded-lg text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-lg bg-emerald-700 px-4 text-xs font-bold text-white hover:bg-emerald-800"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create Booking Type
            </Button>
          </div>
        </form>
      </Modal>
    </ModulePageShell>
  );
}
