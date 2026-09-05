"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BedDouble,
  Building2,
  CheckCircle2,
  Globe,
  IndianRupee,
  Mail,
  Pencil,
  Percent,
  Phone,
  Plus,
  RotateCcw,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import type {
  BookingSourceMaster,
  CompanyMaster,
  TariffPlanMaster,
  RoomTypeMaster,
} from "@/app/data/frontoffice/masters";
import { mealPlans, roomTypes } from "@/app/data/frontoffice/constants";
import {
  bookingSourceService,
  companyService,
  tariffPlanService,
  roomTypeService,
} from "@/services/front-office";
import { Button } from "@/components/ui/Button";
import { ModulePageShell } from "@/components/pms";
import {
  AlertBanner,
  ConfirmModal,
  Drawer,
  FOSearchToolbar,
  FormField,
  FOPageHeader,
  SelectInput,
  StatMiniCard,
  TextAreaInput,
  TextInput,
  formatINR,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";

import { StatusBadge } from "@/components/ui/StatusBadge";

function MasterTable({
  columns,
  rows,
  onRowClick,
}: {
  columns: { key: string; header: string; render: (row: never) => React.ReactNode }[];
  rows: never[];
  onRowClick: (row: never) => void;
}) {
  return (
    <>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <button
            key={String((row as { id: string }).id)}
            type="button"
            onClick={() => onRowClick(row)}
            className="w-full rounded-xl border border-slate-100 p-4 text-left transition-colors hover:border-emerald-200 hover:bg-emerald-50/30"
          >
            {columns.slice(0, 3).map((col) => (
              <div key={col.key} className="text-sm">
                {col.render(row)}
              </div>
            ))}
          </button>
        ))}
      </div>
      <div className="hidden md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-500">
              {columns.map((col) => (
                <th key={col.key} className="pb-3 pr-4">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={String((row as { id: string }).id)}
                onClick={() => onRowClick(row)}
                className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-emerald-50/40"
              >
                {columns.map((col) => (
                  <td key={col.key} className="py-3.5 pr-4">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

type StatusMasterRow = { id: string; status: string; name: string };

function masterActionsColumn<T extends StatusMasterRow>(
  onEdit: (row: T) => void,
  onDeactivate: (row: T) => void,
  onReactivate: (row: T) => void,
) {
  return {
    key: "actions",
    header: "Actions",
    render: (r: T) => (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          title="Edit"
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-700"
          onClick={() => onEdit(r)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        {r.status === "Active" ? (
          <button
            type="button"
            title="Deactivate (soft delete)"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
            onClick={() => onDeactivate(r)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="button"
            title="Reactivate"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
            onClick={() => onReactivate(r)}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    ),
  };
}

function MasterPreviewActionsFooter<T extends StatusMasterRow>({
  row,
  onClose,
  onEdit,
  onDeactivate,
  onReactivate,
  saving,
}: {
  row: T;
  onClose: () => void;
  onEdit: (row: T) => void;
  onDeactivate: (row: T) => void;
  onReactivate: (row: T) => void;
  saving?: boolean;
}) {
  return (
    <div className="flex w-full flex-wrap gap-2">
      <Button variant="outline" onClick={onClose}>
        Close
      </Button>
      <Button variant="outline" className="gap-1.5" onClick={() => onEdit(row)}>
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </Button>
      {row.status === "Active" ? (
        <Button
          variant="outline"
          className="gap-1.5 text-red-600 hover:bg-red-50"
          onClick={() => onDeactivate(row)}
          disabled={saving}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Deactivate
        </Button>
      ) : (
        <Button
          className="gap-1.5 bg-emerald-700 hover:bg-emerald-800"
          onClick={() => onReactivate(row)}
          disabled={saving}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reactivate
        </Button>
      )}
    </div>
  );
}

export function RoomTypesView() {
  const [items, setItems] = useState<RoomTypeMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RoomTypeMaster | null>(null);
  const [preview, setPreview] = useState<RoomTypeMaster | null>(null);
  const [softDeleteTarget, setSoftDeleteTarget] = useState<RoomTypeMaster | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [baseRate, setBaseRate] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await roomTypeService.list();
        if (!cancelled) {
          setItems(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((r) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && r.status === "Active") ||
        (statusFilter === "inactive" && r.status === "Inactive");
      return (
        matchesStatus &&
        (r.name.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q))
      );
    });
  }, [items, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: items.length,
      active: items.filter((r) => r.status === "Active").length,
      avgRate:
        items.length > 0
          ? Math.round(items.reduce((s, r) => s + r.baseRate, 0) / items.length)
          : 0,
    }),
    [items],
  );

  const resetForm = () => {
    setEditing(null);
    setCode("");
    setName("");
    setDescription("");
    setBaseRate("");
  };

  const showToast = (message: string, variant: "success" | "error" = "success") => {
    setToastVariant(variant);
    setToast(message);
  };

  const openCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (row: RoomTypeMaster) => {
    setEditing(row);
    setCode(row.code);
    setName(row.name);
    setDescription(row.description);
    setBaseRate(String(row.baseRate));
    setPreview(null);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!code.trim() || !name.trim() || !baseRate) {
      showToast("Please fill code, name, and base rate.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: code.toUpperCase(),
        name,
        description: description || `${name} room category`,
        baseRate: parseFloat(baseRate),
        sizeSqFt: editing?.sizeSqFt ?? 250,
        amenities: editing?.amenities ?? ["Wi-Fi", "AC", "TV"],
        status: editing?.status ?? "Active",
      };
      if (editing) {
        const record = await roomTypeService.update(editing.id, payload);
        setItems((prev) => prev.map((r) => (r.id === editing.id ? record : r)));
        showToast(`Room type "${name}" updated.`);
      } else {
        const record = await roomTypeService.create({ ...payload, status: "Active" });
        setItems((prev) => [record, ...prev]);
        showToast(`Room type "${name}" added successfully.`);
      }
      setFormOpen(false);
      resetForm();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!softDeleteTarget) return;
    setSaving(true);
    try {
      const record = await roomTypeService.update(softDeleteTarget.id, { status: "Inactive" });
      setItems((prev) => prev.map((r) => (r.id === softDeleteTarget.id ? record : r)));
      setSoftDeleteTarget(null);
      setPreview(null);
      showToast(`"${softDeleteTarget.name}" deactivated.`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to deactivate", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReactivate = async (row: RoomTypeMaster) => {
    setSaving(true);
    try {
      const record = await roomTypeService.update(row.id, { status: "Active" });
      setItems((prev) => prev.map((r) => (r.id === row.id ? record : r)));
      setPreview(null);
      showToast(`"${row.name}" reactivated.`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to reactivate", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <>
    <ModulePageShell
      toast={toast}
      toastVariant={toastVariant}
      onDismissToast={() => setToast(null)}
      eyebrow="Front Office · Masters"
      title="Room Types"
      description="Manage room categories and base rates."
      primaryAction={{
        label: "Add Room Type",
        onClick: openCreate,
      }}
      stats={[
        { label: "Room Types", value: stats.total, icon: BedDouble },
        { label: "Active", value: stats.active, accent: "#10b981", icon: CheckCircle2 },
        { label: "Avg. Base Rate", value: formatINR(stats.avgRate), accent: "#15803d", icon: IndianRupee },
      ]}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search code, name…"
      filterPills={{
        active: statusFilter,
        onChange: setStatusFilter,
        options: [
          { id: "all", label: "All" },
          { id: "active", label: "Active" },
          { id: "inactive", label: "Inactive" },
        ],
      }}
    >
          <MasterTable
            rows={filtered as never[]}
            onRowClick={(r) => setPreview(r as RoomTypeMaster)}
            columns={[
              {
                key: "code",
                header: "Code",
                render: (r: RoomTypeMaster) => (
                  <span className="font-mono text-xs font-semibold text-emerald-700">{r.code}</span>
                ),
              },
              {
                key: "name",
                header: "Name",
                render: (r: RoomTypeMaster) => (
                  <div>
                    <p className="font-medium text-slate-900">{r.name}</p>
                    <p className="max-w-xs truncate text-xs text-slate-400">{r.description}</p>
                  </div>
                ),
              },
              {
                key: "rate",
                header: "Base Rate",
                render: (r: RoomTypeMaster) => formatINR(r.baseRate),
              },
              {
                key: "status",
                header: "Status",
                render: (r: RoomTypeMaster) => <StatusBadge status={r.status} />,
              },
              masterActionsColumn(openEdit, setSoftDeleteTarget, handleReactivate),
            ]}
          />
    </ModulePageShell>

      <Drawer
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          resetForm();
        }}
        title={editing ? "Edit Room Type" : "Add Room Type"}
        description={editing ? "Update this room category." : "Create a new room category."}
        width="md"
        footer={
          <>
            <Button variant="outline" onClick={() => { setFormOpen(false); resetForm(); }}>Cancel</Button>
            <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editing ? "Update" : "Save"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Code" required>
              <TextInput placeholder="STD" value={code} onChange={(e) => setCode(e.target.value)} />
            </FormField>
            <FormField label="Name" required>
              <TextInput placeholder="Standard" value={name} onChange={(e) => setName(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Base Rate (₹)" required>
            <TextInput type="number" value={baseRate} onChange={(e) => setBaseRate(e.target.value)} />
          </FormField>
          <FormField label="Description">
            <TextAreaInput value={description} onChange={(e) => setDescription(e.target.value)} />
          </FormField>
        </div>
      </Drawer>

      <Drawer
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview?.name ?? ""}
        description={preview ? `${preview.code} · ${preview.sizeSqFt} sq ft` : undefined}
        width="md"
        footer={
          preview ? (
            <MasterPreviewActionsFooter
              row={preview}
              onClose={() => setPreview(null)}
              onEdit={openEdit}
              onDeactivate={setSoftDeleteTarget}
              onReactivate={handleReactivate}
              saving={saving}
            />
          ) : undefined
        }
      >
        {preview && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <BedDouble className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{formatINR(preview.baseRate)}</p>
                <StatusBadge status={preview.status} />
              </div>
            </div>
            <p className="text-sm text-slate-600">{preview.description}</p>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Size", `${preview.sizeSqFt} sq ft`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-100 p-3">
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="mt-0.5 font-semibold text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
            <div>
              <p className="mb-2 text-xs font-medium text-slate-500">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {preview.amenities.map((a) => (
                  <span key={a} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmModal
        open={!!softDeleteTarget}
        onClose={() => setSoftDeleteTarget(null)}
        onConfirm={handleSoftDelete}
        title="Deactivate room type?"
        message={
          softDeleteTarget
            ? `"${softDeleteTarget.name}" will be marked Inactive and hidden from active pickers (soft delete).`
            : ""
        }
        confirmLabel="Deactivate"
        variant="danger"
        loading={saving}
      />
    </>
  );
}

export function TariffPlansView() {
  const [items, setItems] = useState<TariffPlanMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TariffPlanMaster | null>(null);
  const [preview, setPreview] = useState<TariffPlanMaster | null>(null);
  const [softDeleteTarget, setSoftDeleteTarget] = useState<TariffPlanMaster | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [roomType, setRoomType] = useState("All Types");
  const [baseRate, setBaseRate] = useState("");
  const [mealPlan, setMealPlan] = useState("EP");
  const [minNights, setMinNights] = useState("1");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await tariffPlanService.list();
        if (!cancelled) {
          setItems(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((r) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && r.status === "Active") ||
        (statusFilter === "inactive" && r.status === "Inactive");
      return (
        matchesStatus &&
        (r.name.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q) ||
          r.roomType.toLowerCase().includes(q))
      );
    });
  }, [items, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: items.length,
      active: items.filter((r) => r.status === "Active").length,
      avgRate:
        items.length > 0
          ? Math.round(items.reduce((s, r) => s + r.baseRate, 0) / items.length)
          : 0,
    }),
    [items],
  );

  const resetForm = () => {
    setEditing(null);
    setCode("");
    setName("");
    setRoomType("All Types");
    setBaseRate("");
    setMealPlan("EP");
    setMinNights("1");
  };

  const showToast = (message: string, variant: "success" | "error" = "success") => {
    setToastVariant(variant);
    setToast(message);
  };

  const openCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (row: TariffPlanMaster) => {
    setEditing(row);
    setCode(row.code);
    setName(row.name);
    setRoomType(row.roomType);
    setBaseRate(String(row.baseRate));
    setMealPlan(row.mealPlan);
    setMinNights(String(row.minNights));
    setPreview(null);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!code.trim() || !name.trim() || !baseRate) {
      showToast("Please fill code, name, and base rate.", "error");
      return;
    }
    setSaving(true);
    try {
      const rate = parseFloat(baseRate);
      const payload = {
        code: code.toUpperCase(),
        name,
        roomType,
        baseRate: rate,
        weekendRate: editing?.weekendRate ?? Math.round(rate * 1.2),
        mealPlan,
        cancellationPolicy: editing?.cancellationPolicy ?? "Standard cancellation policy applies",
        minNights: parseInt(minNights, 10) || 1,
        validFrom: editing?.validFrom ?? "2026-01-01",
        validTo: editing?.validTo ?? "2026-12-31",
        status: editing?.status ?? "Active",
      };
      if (editing) {
        const record = await tariffPlanService.update(editing.id, payload);
        setItems((prev) => prev.map((r) => (r.id === editing.id ? record : r)));
        showToast(`Tariff plan "${name}" updated.`);
      } else {
        const record = await tariffPlanService.create({ ...payload, status: "Active" });
        setItems((prev) => [record, ...prev]);
        showToast(`Tariff plan "${name}" added successfully.`);
      }
      setFormOpen(false);
      resetForm();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!softDeleteTarget) return;
    setSaving(true);
    try {
      const record = await tariffPlanService.update(softDeleteTarget.id, { status: "Inactive" });
      setItems((prev) => prev.map((r) => (r.id === softDeleteTarget.id ? record : r)));
      setSoftDeleteTarget(null);
      setPreview(null);
      showToast(`"${softDeleteTarget.name}" deactivated.`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to deactivate", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReactivate = async (row: TariffPlanMaster) => {
    setSaving(true);
    try {
      const record = await tariffPlanService.update(row.id, { status: "Active" });
      setItems((prev) => prev.map((r) => (r.id === row.id ? record : r)));
      setPreview(null);
      showToast(`"${row.name}" reactivated.`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to reactivate", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-5">
      {toast && (
        <AlertBanner variant={toastVariant} message={toast} onDismiss={() => setToast(null)} />
      )}

      <FOPageHeader
        eyebrow="Front Office · Masters"
        title="Tariff Plans"
        description="Configure nightly tariffs, meal plans, and cancellation policies."
        action={
          <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800" onClick={openCreate}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Tariff Plan
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatMiniCard label="Tariff Plans" value={stats.total} icon={Tag} />
        <StatMiniCard label="Active" value={stats.active} accent="#10b981" icon={CheckCircle2} />
        <StatMiniCard label="Avg. Base Rate" value={formatINR(stats.avgRate)} accent="#15803d" icon={Percent} />
      </div>

      <FOSearchToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search code, name, room type…"
        filterPills={{
          active: statusFilter,
          onChange: setStatusFilter,
          options: [
            { id: "all", label: "All" },
            { id: "active", label: "Active" },
            { id: "inactive", label: "Inactive" },
          ],
        }}
      />

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <MasterTable
            rows={filtered as never[]}
            onRowClick={(r) => setPreview(r as TariffPlanMaster)}
            columns={[
              {
                key: "code",
                header: "Code",
                render: (r: TariffPlanMaster) => (
                  <span className="font-mono text-xs font-semibold text-emerald-700">{r.code}</span>
                ),
              },
              {
                key: "name",
                header: "Plan",
                render: (r: TariffPlanMaster) => (
                  <div>
                    <p className="font-medium text-slate-900">{r.name}</p>
                    <p className="text-xs text-slate-400">{r.roomType}</p>
                  </div>
                ),
              },
              {
                key: "rate",
                header: "Base / Weekend",
                render: (r: TariffPlanMaster) => (
                  <div className="text-sm">
                    <span className="font-medium">{formatINR(r.baseRate)}</span>
                    <span className="text-slate-400"> / {formatINR(r.weekendRate)}</span>
                  </div>
                ),
              },
              { key: "meal", header: "Meal", render: (r: TariffPlanMaster) => r.mealPlan },
              { key: "min", header: "Min Nights", render: (r: TariffPlanMaster) => r.minNights },
              {
                key: "status",
                header: "Status",
                render: (r: TariffPlanMaster) => <StatusBadge status={r.status} />,
              },
              masterActionsColumn(openEdit, setSoftDeleteTarget, handleReactivate),
            ]}
          />
        </div>

      <Drawer
        open={formOpen}
        onClose={() => { setFormOpen(false); resetForm(); }}
        title={editing ? "Edit Tariff Plan" : "Add Tariff Plan"}
        description={editing ? "Update this tariff plan." : "Create a new tariff plan."}
        width="md"
        footer={
          <>
            <Button variant="outline" onClick={() => { setFormOpen(false); resetForm(); }}>Cancel</Button>
            <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editing ? "Update" : "Save"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Code" required>
              <TextInput placeholder="BAR" value={code} onChange={(e) => setCode(e.target.value)} />
            </FormField>
            <FormField label="Name" required>
              <TextInput placeholder="Best Available Rate" value={name} onChange={(e) => setName(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Room Types">
            <SelectInput value={roomType} onChange={(e) => setRoomType(e.target.value)}>
              <option>All Types</option>
              {roomTypes.map((rt) => (
                <option key={rt}>{rt}</option>
              ))}
            </SelectInput>
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Base Rate (₹)" required>
              <TextInput type="number" value={baseRate} onChange={(e) => setBaseRate(e.target.value)} />
            </FormField>
            <FormField label="Meal Plan">
              <SelectInput value={mealPlan} onChange={(e) => setMealPlan(e.target.value)}>
                {mealPlans.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </SelectInput>
            </FormField>
          </div>
          <FormField label="Minimum Nights">
            <TextInput type="number" min="1" value={minNights} onChange={(e) => setMinNights(e.target.value)} />
          </FormField>
        </div>
      </Drawer>

      <Drawer
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview?.name ?? ""}
        description={preview?.code}
        width="md"
        footer={
          preview ? (
            <MasterPreviewActionsFooter
              row={preview}
              onClose={() => setPreview(null)}
              onEdit={openEdit}
              onDeactivate={setSoftDeleteTarget}
              onReactivate={handleReactivate}
              saving={saving}
            />
          ) : null
        }
      >
        {preview && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <Tag className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">
                  {formatINR(preview.baseRate)}
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    weekend {formatINR(preview.weekendRate)}
                  </span>
                </p>
                <StatusBadge status={preview.status} />
              </div>
            </div>
            <dl className="space-y-3 text-sm">
              {[
                ["Room Types", preview.roomType],
                ["Meal Plan", preview.mealPlan],
                ["Min Nights", String(preview.minNights)],
                ["Valid From", preview.validFrom],
                ["Valid To", preview.validTo],
                ["Cancellation", preview.cancellationPolicy],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-100 p-3">
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Drawer>

      <ConfirmModal
        open={!!softDeleteTarget}
        onClose={() => setSoftDeleteTarget(null)}
        onConfirm={handleSoftDelete}
        title="Deactivate tariff plan?"
        message={
          softDeleteTarget
            ? `"${softDeleteTarget.name}" will be marked Inactive (soft delete).`
            : ""
        }
        confirmLabel="Deactivate"
        variant="danger"
        loading={saving}
      />
    </div>
  );
}

/** @deprecated Use TariffPlansView */
export const RatePlansView = TariffPlansView;

export function BookingSourcesView() {
  const [items, setItems] = useState<BookingSourceMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BookingSourceMaster | null>(null);
  const [preview, setPreview] = useState<BookingSourceMaster | null>(null);
  const [softDeleteTarget, setSoftDeleteTarget] =
    useState<BookingSourceMaster | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">(
    "success",
  );
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await bookingSourceService.list();
        if (!cancelled) {
          setItems(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const showToast = (
    message: string,
    variant: "success" | "error" = "success",
  ) => {
    setToastVariant(variant);
    setToast(message);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((r) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && r.status === "Active") ||
        (statusFilter === "inactive" && r.status === "Inactive");
      return (
        matchesStatus &&
        (r.name.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q) ||
          (r.description || "").toLowerCase().includes(q))
      );
    });
  }, [items, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: items.length,
      active: items.filter((r) => r.status === "Active").length,
      inactive: items.filter((r) => r.status === "Inactive").length,
    }),
    [items],
  );

  const resetForm = () => {
    setEditing(null);
    setCode("");
    setName("");
    setDescription("");
  };

  const openCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (row: BookingSourceMaster) => {
    setEditing(row);
    setCode(row.code);
    setName(row.name);
    setDescription(row.description || "");
    setPreview(null);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!code.trim() || !name.trim()) {
      showToast("Please fill code and name.", "error");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const record = await bookingSourceService.update(editing.id, {
          code: code.toUpperCase(),
          name,
          description: description || `${name} booking source`,
          status: editing.status,
        });
        setItems((prev) =>
          prev.map((r) => (r.id === editing.id ? record : r)),
        );
        setFormOpen(false);
        resetForm();
        showToast(`Booking source "${name}" updated.`);
      } else {
        const record = await bookingSourceService.create({
          code: code.toUpperCase(),
          name,
          description: description || `${name} booking source`,
          status: "Active",
        });
        setItems((prev) => [record, ...prev]);
        setFormOpen(false);
        resetForm();
        showToast(`Booking source "${name}" added successfully.`);
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!softDeleteTarget) return;
    setSaving(true);
    try {
      const record = await bookingSourceService.update(softDeleteTarget.id, {
        status: "Inactive",
      });
      setItems((prev) =>
        prev.map((r) => (r.id === softDeleteTarget.id ? record : r)),
      );
      setSoftDeleteTarget(null);
      setPreview(null);
      showToast(`"${softDeleteTarget.name}" deactivated (soft delete).`);
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Failed to deactivate",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReactivate = async (row: BookingSourceMaster) => {
    setSaving(true);
    try {
      const record = await bookingSourceService.update(row.id, {
        status: "Active",
      });
      setItems((prev) => prev.map((r) => (r.id === row.id ? record : r)));
      setPreview(null);
      showToast(`"${row.name}" reactivated.`);
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Failed to reactivate",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-5">
      {toast && (
        <AlertBanner
          variant={toastVariant}
          message={toast}
          onDismiss={() => setToast(null)}
        />
      )}

      <FOPageHeader
        eyebrow="Front Office · Masters"
        title="Booking Sources"
        description="Manage channels where reservations originate — walk-in, website, OTAs, and agents."
        action={
          <Button
            size="sm"
            className="bg-emerald-700 hover:bg-emerald-800"
            onClick={openCreate}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Source
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatMiniCard label="Sources" value={stats.total} icon={Globe} />
        <StatMiniCard
          label="Active"
          value={stats.active}
          accent="#10b981"
          icon={CheckCircle2}
        />
        <StatMiniCard
          label="Inactive"
          value={stats.inactive}
          accent="#94a3b8"
          icon={Trash2}
        />
      </div>

      <FOSearchToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search code, name…"
        filterPills={{
          active: statusFilter,
          onChange: setStatusFilter,
          options: [
            { id: "all", label: "All" },
            { id: "active", label: "Active" },
            { id: "inactive", label: "Inactive" },
          ],
        }}
      />

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <MasterTable
          rows={filtered as never[]}
          onRowClick={(r) => setPreview(r as BookingSourceMaster)}
          columns={[
            {
              key: "code",
              header: "Code",
              render: (r: BookingSourceMaster) => (
                <span className="font-mono text-xs font-semibold text-emerald-700">
                  {r.code}
                </span>
              ),
            },
            {
              key: "name",
              header: "Source",
              render: (r: BookingSourceMaster) => (
                <div>
                  <p className="font-medium text-slate-900">{r.name}</p>
                  <p className="max-w-xs truncate text-xs text-slate-400">
                    {r.description}
                  </p>
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (r: BookingSourceMaster) => (
                <StatusBadge status={r.status} />
              ),
            },
            {
              key: "actions",
              header: "Actions",
              render: (r: BookingSourceMaster) => (
                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    title="Edit"
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-700"
                    onClick={() => openEdit(r)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {r.status === "Active" ? (
                    <button
                      type="button"
                      title="Deactivate (soft delete)"
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() => setSoftDeleteTarget(r)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      title="Reactivate"
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                      onClick={() => handleReactivate(r)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>

      <Drawer
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          resetForm();
        }}
        title={editing ? "Edit Booking Source" : "Add Booking Source"}
        description={
          editing
            ? "Update this reservation channel."
            : "Create a new reservation channel."
        }
        width="md"
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
              className="bg-emerald-700 hover:bg-emerald-800"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving…" : editing ? "Update" : "Save"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Code" required>
              <TextInput
                placeholder="WALKIN"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </FormField>
            <FormField label="Name" required>
              <TextInput
                placeholder="Walk-in"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormField>
          </div>
          <FormField label="Description">
            <TextInput
              placeholder="Where this booking originates…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>
        </div>
      </Drawer>

      <Drawer
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview?.name ?? ""}
        description={preview?.code}
        width="md"
        footer={
          preview ? (
            <div className="flex w-full flex-wrap gap-2">
              <Button variant="outline" onClick={() => setPreview(null)}>
                Close
              </Button>
              <Button
                variant="outline"
                className="gap-1.5"
                onClick={() => openEdit(preview)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              {preview.status === "Active" ? (
                <Button
                  variant="outline"
                  className="gap-1.5 text-red-600 hover:bg-red-50"
                  onClick={() => setSoftDeleteTarget(preview)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Deactivate
                </Button>
              ) : (
                <Button
                  className="gap-1.5 bg-emerald-700 hover:bg-emerald-800"
                  onClick={() => handleReactivate(preview)}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reactivate
                </Button>
              )}
            </div>
          ) : null
        }
      >
        {preview && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {preview.name}
                  </p>
                  <p className="font-mono text-xs text-emerald-700">
                    {preview.code}
                  </p>
                </div>
              </div>
              <StatusBadge status={preview.status} />
            </div>
            <p className="text-sm text-slate-600">
              {preview.description || "No description"}
            </p>
          </div>
        )}
      </Drawer>

      <ConfirmModal
        open={!!softDeleteTarget}
        onClose={() => setSoftDeleteTarget(null)}
        onConfirm={handleSoftDelete}
        title="Deactivate booking source?"
        message={
          softDeleteTarget
            ? `"${softDeleteTarget.name}" will be marked Inactive. It won’t appear in reservation Source dropdowns, but the record stays in the database (soft delete — not permanently removed).`
            : ""
        }
        confirmLabel="Deactivate"
        variant="danger"
        loading={saving}
      />
    </div>
  );
}

export function CompaniesView() {
  const [items, setItems] = useState<CompanyMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyMaster | null>(null);
  const [preview, setPreview] = useState<CompanyMaster | null>(null);
  const [softDeleteTarget, setSoftDeleteTarget] = useState<CompanyMaster | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<CompanyMaster["type"]>("Corporate");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [corporateDiscount, setCorporateDiscount] = useState("0");
  const [creditLimit, setCreditLimit] = useState("0");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await companyService.list();
        if (!cancelled) {
          setItems(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((r) => {
      const matchesStatus = statusFilter === "all" || r.status.toLowerCase() === statusFilter;
      const matchesType = typeFilter === "all" || r.type === typeFilter;
      const matchesSearch =
        r.code.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.contactPerson.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        (r.gstNumber?.toLowerCase().includes(q) ?? false);
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [items, search, typeFilter, statusFilter]);

  const stats = useMemo(
    () => ({
      total: items.length,
      active: items.filter((r) => r.status === "Active").length,
      corporate: items.filter((r) => r.type === "Corporate").length,
      avgDiscount:
        items.length > 0
          ? Math.round(items.reduce((s, r) => s + r.corporateDiscount, 0) / items.length)
          : 0,
    }),
    [items],
  );

  const typeColors: Record<CompanyMaster["type"], string> = {
    Corporate: "bg-emerald-50 text-emerald-800",
    "Travel Agent": "bg-purple-50 text-purple-700",
    Government: "bg-amber-50 text-amber-700",
    Event: "bg-pink-50 text-pink-700",
  };

  const resetForm = () => {
    setEditing(null);
    setCode("");
    setName("");
    setType("Corporate");
    setContactPerson("");
    setEmail("");
    setPhone("");
    setGstNumber("");
    setAddress("");
    setCity("");
    setCorporateDiscount("0");
    setCreditLimit("0");
  };

  const showToast = (message: string, variant: "success" | "error" = "success") => {
    setToastVariant(variant);
    setToast(message);
  };

  const openCreate = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (row: CompanyMaster) => {
    setEditing(row);
    setCode(row.code);
    setName(row.name);
    setType(row.type);
    setContactPerson(row.contactPerson);
    setEmail(row.email);
    setPhone(row.phone);
    setGstNumber(row.gstNumber ?? "");
    setAddress(row.address);
    setCity(row.city);
    setCorporateDiscount(String(row.corporateDiscount));
    setCreditLimit(String(row.creditLimit));
    setPreview(null);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!code.trim() || !name.trim() || !contactPerson.trim() || !email.trim() || !phone.trim()) {
      showToast("Please fill all required fields.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: code.toUpperCase(),
        name,
        type,
        contactPerson,
        email,
        phone,
        gstNumber: gstNumber || undefined,
        address: address || "—",
        city: city || "—",
        corporateDiscount: parseFloat(corporateDiscount) || 0,
        creditLimit: parseFloat(creditLimit) || 0,
        status: editing?.status ?? "Active",
      };
      if (editing) {
        const record = await companyService.update(editing.id, payload);
        setItems((prev) => prev.map((r) => (r.id === editing.id ? record : r)));
        showToast(`Company "${name}" updated.`);
      } else {
        const record = await companyService.create({ ...payload, status: "Active" });
        setItems((prev) => [record, ...prev]);
        showToast(`Company "${name}" added successfully.`);
      }
      setFormOpen(false);
      resetForm();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!softDeleteTarget) return;
    setSaving(true);
    try {
      const record = await companyService.update(softDeleteTarget.id, { status: "Inactive" });
      setItems((prev) => prev.map((r) => (r.id === softDeleteTarget.id ? record : r)));
      setSoftDeleteTarget(null);
      setPreview(null);
      showToast(`"${softDeleteTarget.name}" deactivated.`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to deactivate", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReactivate = async (row: CompanyMaster) => {
    setSaving(true);
    try {
      const record = await companyService.update(row.id, { status: "Active" });
      setItems((prev) => prev.map((r) => (r.id === row.id ? record : r)));
      setPreview(null);
      showToast(`"${row.name}" reactivated.`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to reactivate", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-5">
      {toast && (
        <AlertBanner variant={toastVariant} message={toast} onDismiss={() => setToast(null)} />
      )}

      <FOPageHeader
        eyebrow="Front Office · Masters"
        title="Companies"
        description="Manage corporate accounts, travel agents, and billing companies for company bookings."
        action={
          <Button
            size="sm"
            className="bg-emerald-700 hover:bg-emerald-800"
            onClick={openCreate}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Company
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatMiniCard label="Companies" value={stats.total} icon={Building2} />
        <StatMiniCard label="Active" value={stats.active} accent="#10b981" icon={CheckCircle2} />
        <StatMiniCard label="Corporate" value={stats.corporate} accent="#15803d" icon={Users} />
        <StatMiniCard
          label="Avg. Discount"
          value={`${stats.avgDiscount}%`}
          accent="#f59e0b"
          icon={Percent}
        />
      </div>

      <FOSearchToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search code, company, contact, GST, or city…"
        filterPills={{
          active: typeFilter,
          onChange: setTypeFilter,
          options: [
            { id: "all", label: "All Types" },
            { id: "Corporate", label: "Corporate" },
            { id: "Travel Agent", label: "Travel Agent" },
            { id: "Government", label: "Government" },
            { id: "Event", label: "Event" },
          ],
        }}
        hasActiveAdvancedFilters={statusFilter !== "all"}
        onClearAdvancedFilters={() => setStatusFilter("all")}
        advancedFilters={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Status">
              <SelectInput value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </SelectInput>
            </FormField>
          </div>
        }
      />

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <MasterTable
          rows={filtered as never[]}
          onRowClick={(r) => setPreview(r as CompanyMaster)}
          columns={[
            {
              key: "code",
              header: "Code",
              render: (r: CompanyMaster) => (
                <span className="font-mono text-xs font-semibold text-emerald-700">{r.code}</span>
              ),
            },
            {
              key: "name",
              header: "Company",
              render: (r: CompanyMaster) => (
                <div>
                  <p className="font-medium text-slate-900">{r.name}</p>
                  <p className="text-xs text-slate-400">{r.contactPerson}</p>
                </div>
              ),
            },
            {
              key: "type",
              header: "Type",
              render: (r: CompanyMaster) => (
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", typeColors[r.type])}>
                  {r.type}
                </span>
              ),
            },
            {
              key: "contact",
              header: "Contact",
              render: (r: CompanyMaster) => (
                <div className="text-sm">
                  <p className="text-slate-700">{r.phone}</p>
                  <p className="text-xs text-slate-400">{r.email}</p>
                </div>
              ),
            },
            {
              key: "city",
              header: "City",
              render: (r: CompanyMaster) => r.city,
            },
            {
              key: "discount",
              header: "Discount",
              render: (r: CompanyMaster) => `${r.corporateDiscount}%`,
            },
            {
              key: "status",
              header: "Status",
              render: (r: CompanyMaster) => <StatusBadge status={r.status} />,
            },
            masterActionsColumn(openEdit, setSoftDeleteTarget, handleReactivate),
          ]}
        />
      </div>

      <Drawer
        open={formOpen}
        onClose={() => { setFormOpen(false); resetForm(); }}
        title={editing ? "Edit Company" : "Add Company"}
        description={editing ? "Update company details." : "Register a new corporate or billing company."}
        width="md"
        footer={
          <>
            <Button variant="outline" onClick={() => { setFormOpen(false); resetForm(); }}>Cancel</Button>
            <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editing ? "Update" : "Save"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Code" required>
              <TextInput placeholder="TCS" value={code} onChange={(e) => setCode(e.target.value)} />
            </FormField>
            <FormField label="Company Name" required>
              <TextInput placeholder="Company name" value={name} onChange={(e) => setName(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Type">
            <SelectInput
              value={type}
              onChange={(e) => setType(e.target.value as CompanyMaster["type"])}
            >
              <option value="Corporate">Corporate</option>
              <option value="Travel Agent">Travel Agent</option>
              <option value="Government">Government</option>
              <option value="Event">Event</option>
            </SelectInput>
          </FormField>
          <FormField label="Contact Person" required>
            <TextInput
              placeholder="Contact name"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Email" required>
              <TextInput
                type="email"
                placeholder="billing@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>
            <FormField label="Phone" required>
              <TextInput
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </FormField>
          </div>
          <FormField label="GST Number">
            <TextInput
              placeholder="GSTIN (optional)"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
            />
          </FormField>
          <FormField label="Address">
            <TextInput placeholder="Street address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </FormField>
          <FormField label="City">
            <TextInput placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Corporate Discount (%)">
              <TextInput
                type="number"
                min={0}
                value={corporateDiscount}
                onChange={(e) => setCorporateDiscount(e.target.value)}
              />
            </FormField>
            <FormField label="Credit Limit (₹)">
              <TextInput
                type="number"
                min={0}
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
              />
            </FormField>
          </div>
        </div>
      </Drawer>

      <Drawer
        open={!!preview}
        onClose={() => setPreview(null)}
        title={preview?.name ?? ""}
        description={preview?.code}
        width="md"
        footer={
          preview ? (
            <MasterPreviewActionsFooter
              row={preview}
              onClose={() => setPreview(null)}
              onEdit={openEdit}
              onDeactivate={setSoftDeleteTarget}
              onReactivate={handleReactivate}
              saving={saving}
            />
          ) : null
        }
      >
        {preview && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", typeColors[preview.type])}>
                  {preview.type}
                </span>
                <p className="mt-1 text-2xl font-bold text-slate-900">{preview.corporateDiscount}% discount</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              {preview.address}, {preview.city}
            </p>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              {[
                { icon: Users, label: "Contact", value: preview.contactPerson },
                { icon: Phone, label: "Phone", value: preview.phone },
                { icon: Mail, label: "Email", value: preview.email },
                { icon: Building2, label: "GST", value: preview.gstNumber ?? "—" },
                { icon: Percent, label: "Discount", value: `${preview.corporateDiscount}%` },
                { icon: IndianRupee, label: "Credit Limit", value: formatINR(preview.creditLimit) },
                { icon: CheckCircle2, label: "Status", value: preview.status },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3 rounded-lg border border-slate-100 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</dt>
                    <dd className="mt-0.5 truncate font-medium text-slate-900">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Drawer>

      <ConfirmModal
        open={!!softDeleteTarget}
        onClose={() => setSoftDeleteTarget(null)}
        onConfirm={handleSoftDelete}
        title="Deactivate company?"
        message={
          softDeleteTarget
            ? `"${softDeleteTarget.name}" will be marked Inactive (soft delete).`
            : ""
        }
        confirmLabel="Deactivate"
        variant="danger"
        loading={saving}
      />
    </div>
  );
}
