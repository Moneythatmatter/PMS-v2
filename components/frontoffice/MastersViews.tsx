"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BedDouble,
  Building2,
  CheckCircle2,
  IndianRupee,
  Mail,
  Percent,
  Phone,
  PieChart,
  Plus,
  Tag,
  Users,
} from "lucide-react";
import type {
  CompanyMaster,
  MarketSegmentMaster,
  RatePlanMaster,
  RoomTypeMaster,
} from "@/app/data/frontoffice/masters";
import { mealPlans, roomTypes } from "@/app/data/frontoffice/constants";
import {
  companyService,
  marketSegmentService,
  ratePlanService,
  roomTypeService,
} from "@/services/front-office";
import { Button } from "@/components/ui/Button";
import { ModulePageShell } from "@/components/pms";
import {
  AlertBanner,
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

function StatusBadge({ status }: { status: "Active" | "Inactive" }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-medium",
        status === "Active"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600",
      )}
    >
      {status}
    </span>
  );
}

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

export function RoomTypesView() {
  const [items, setItems] = useState<RoomTypeMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [preview, setPreview] = useState<RoomTypeMaster | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [baseRate, setBaseRate] = useState("");
  const [totalRooms, setTotalRooms] = useState("1");
  const [maxOccupancy, setMaxOccupancy] = useState("2");

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
      rooms: items.reduce((s, r) => s + r.totalRooms, 0),
      avgRate: Math.round(
        items.reduce((s, r) => s + r.baseRate, 0) / items.length,
      ),
    }),
    [items],
  );

  const resetForm = () => {
    setCode("");
    setName("");
    setDescription("");
    setBaseRate("");
    setTotalRooms("1");
    setMaxOccupancy("2");
  };

  const handleSave = async () => {
    if (!code.trim() || !name.trim() || !baseRate) {
      setToast("Please fill code, name, and base rate.");
      return;
    }
    try {
      const record = await roomTypeService.create({
        code: code.toUpperCase(),
        name,
        description: description || `${name} room category`,
        baseRate: parseFloat(baseRate),
        maxOccupancy: parseInt(maxOccupancy, 10) || 2,
        maxAdults: parseInt(maxOccupancy, 10) || 2,
        maxChildren: 1,
        totalRooms: parseInt(totalRooms, 10) || 1,
        sizeSqFt: 250,
        amenities: ["Wi-Fi", "AC", "TV"],
        status: "Active",
      });
      setItems((prev) => [record, ...prev]);
      setFormOpen(false);
      resetForm();
      setToast(`Room type "${name}" added successfully.`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to save");
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <>
    <ModulePageShell
      toast={toast}
      onDismissToast={() => setToast(null)}
      eyebrow="Front Office · Masters"
      title="Room Types"
      description="Manage room categories, occupancy limits, and base rates."
      primaryAction={{
        label: "Add Room Type",
        onClick: () => {
          resetForm();
          setFormOpen(true);
        },
      }}
      stats={[
        { label: "Room Types", value: stats.total, icon: BedDouble },
        { label: "Active", value: stats.active, accent: "#10b981", icon: CheckCircle2 },
        { label: "Total Rooms", value: stats.rooms, icon: Users },
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
                key: "rooms",
                header: "Rooms",
                render: (r: RoomTypeMaster) => r.totalRooms,
              },
              {
                key: "occ",
                header: "Max Occ.",
                render: (r: RoomTypeMaster) => r.maxOccupancy,
              },
              {
                key: "status",
                header: "Status",
                render: (r: RoomTypeMaster) => <StatusBadge status={r.status} />,
              },
            ]}
          />
    </ModulePageShell>

      <Drawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Add Room Type"
        description="Create a new room category."
        width="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={handleSave}>Save</Button>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Total Rooms">
              <TextInput type="number" value={totalRooms} onChange={(e) => setTotalRooms(e.target.value)} />
            </FormField>
            <FormField label="Max Occupancy">
              <TextInput type="number" value={maxOccupancy} onChange={(e) => setMaxOccupancy(e.target.value)} />
            </FormField>
          </div>
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
        footer={<Button variant="outline" onClick={() => setPreview(null)}>Close</Button>}
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
                ["Total Rooms", preview.totalRooms],
                ["Max Occupancy", preview.maxOccupancy],
                ["Max Adults", preview.maxAdults],
                ["Max Children", preview.maxChildren],
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
    </>
  );
}

export function RatePlansView() {
  const [items, setItems] = useState<RatePlanMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [preview, setPreview] = useState<RatePlanMaster | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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
        const data = await ratePlanService.list();
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
    setCode("");
    setName("");
    setRoomType("All Types");
    setBaseRate("");
    setMealPlan("EP");
    setMinNights("1");
  };

  const handleSave = async () => {
    if (!code.trim() || !name.trim() || !baseRate) {
      setToast("Please fill code, name, and base rate.");
      return;
    }
    try {
      const rate = parseFloat(baseRate);
      const record = await ratePlanService.create({
        code: code.toUpperCase(),
        name,
        roomType,
        baseRate: rate,
        weekendRate: Math.round(rate * 1.2),
        mealPlan,
        cancellationPolicy: "Standard cancellation policy applies",
        minNights: parseInt(minNights, 10) || 1,
        validFrom: "2026-01-01",
        validTo: "2026-12-31",
        status: "Active",
      });
      setItems((prev) => [record, ...prev]);
      setFormOpen(false);
      resetForm();
      setToast(`Rate plan "${name}" added successfully.`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to save");
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-5">
      {toast && (
        <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />
      )}

      <FOPageHeader
        eyebrow="Front Office · Masters"
        title="Rate Plans"
        description="Configure nightly rates, meal plans, and cancellation policies."
        action={
          <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800" onClick={() => { resetForm(); setFormOpen(true); }}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Rate Plan
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatMiniCard label="Rate Plans" value={stats.total} icon={Tag} />
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
            onRowClick={(r) => setPreview(r as RatePlanMaster)}
            columns={[
              {
                key: "code",
                header: "Code",
                render: (r: RatePlanMaster) => (
                  <span className="font-mono text-xs font-semibold text-emerald-700">{r.code}</span>
                ),
              },
              {
                key: "name",
                header: "Plan",
                render: (r: RatePlanMaster) => (
                  <div>
                    <p className="font-medium text-slate-900">{r.name}</p>
                    <p className="text-xs text-slate-400">{r.roomType}</p>
                  </div>
                ),
              },
              {
                key: "rate",
                header: "Base / Weekend",
                render: (r: RatePlanMaster) => (
                  <div className="text-sm">
                    <span className="font-medium">{formatINR(r.baseRate)}</span>
                    <span className="text-slate-400"> / {formatINR(r.weekendRate)}</span>
                  </div>
                ),
              },
              { key: "meal", header: "Meal", render: (r: RatePlanMaster) => r.mealPlan },
              { key: "min", header: "Min Nights", render: (r: RatePlanMaster) => r.minNights },
              {
                key: "status",
                header: "Status",
                render: (r: RatePlanMaster) => <StatusBadge status={r.status} />,
              },
            ]}
          />
        </div>

      <Drawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Add Rate Plan"
        description="Create a new pricing plan."
        width="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={handleSave}>Save</Button>
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
        footer={<Button variant="outline" onClick={() => setPreview(null)}>Close</Button>}
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
    </div>
  );
}

export function MarketSegmentsView() {
  const [items, setItems] = useState<MarketSegmentMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [preview, setPreview] = useState<MarketSegmentMaster | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<MarketSegmentMaster["category"]>("Corporate");
  const [discount, setDiscount] = useState("0");
  const [description, setDescription] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await marketSegmentService.list();
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
      const matchesCat = categoryFilter === "all" || r.category === categoryFilter;
      return (
        matchesCat &&
        (r.name.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q))
      );
    });
  }, [items, search, categoryFilter]);

  const stats = useMemo(
    () => ({
      total: items.length,
      active: items.filter((r) => r.status === "Active").length,
      categories: new Set(items.map((r) => r.category)).size,
    }),
    [items],
  );

  const categoryColors: Record<MarketSegmentMaster["category"], string> = {
    Corporate: "bg-emerald-50 text-emerald-800",
    Leisure: "bg-emerald-50 text-emerald-700",
    OTA: "bg-purple-50 text-purple-700",
    Government: "bg-amber-50 text-amber-700",
    Group: "bg-pink-50 text-pink-700",
  };

  const resetForm = () => {
    setCode("");
    setName("");
    setCategory("Corporate");
    setDiscount("0");
    setDescription("");
  };

  const handleSave = async () => {
    if (!code.trim() || !name.trim()) {
      setToast("Please fill code and name.");
      return;
    }
    try {
      const record = await marketSegmentService.create({
        code: code.toUpperCase(),
        name,
        category,
        discountPercent: parseFloat(discount) || 0,
        description: description || `${name} market segment`,
        status: "Active",
      });
      setItems((prev) => [record, ...prev]);
      setFormOpen(false);
      resetForm();
      setToast(`Market segment "${name}" added successfully.`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to save");
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-5">
      {toast && (
        <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />
      )}

      <FOPageHeader
        eyebrow="Front Office · Masters"
        title="Market Segments"
        description="Define corporate, leisure, OTA, and group booking segments."
        action={
          <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800" onClick={() => { resetForm(); setFormOpen(true); }}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Segment
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatMiniCard label="Segments" value={stats.total} icon={PieChart} />
        <StatMiniCard label="Active" value={stats.active} accent="#10b981" icon={CheckCircle2} />
        <StatMiniCard label="Categories" value={stats.categories} accent="#15803d" icon={Building2} />
      </div>

      <FOSearchToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search code, name, category…"
        filterPills={{
          active: categoryFilter,
          onChange: setCategoryFilter,
          options: [
            { id: "all", label: "All" },
            { id: "Corporate", label: "Corporate" },
            { id: "Leisure", label: "Leisure" },
            { id: "OTA", label: "OTA" },
            { id: "Government", label: "Government" },
            { id: "Group", label: "Group" },
          ],
        }}
      />

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <MasterTable
            rows={filtered as never[]}
            onRowClick={(r) => setPreview(r as MarketSegmentMaster)}
            columns={[
              {
                key: "code",
                header: "Code",
                render: (r: MarketSegmentMaster) => (
                  <span className="font-mono text-xs font-semibold text-emerald-700">{r.code}</span>
                ),
              },
              {
                key: "name",
                header: "Segment",
                render: (r: MarketSegmentMaster) => (
                  <div>
                    <p className="font-medium text-slate-900">{r.name}</p>
                    <p className="max-w-xs truncate text-xs text-slate-400">{r.description}</p>
                  </div>
                ),
              },
              {
                key: "cat",
                header: "Category",
                render: (r: MarketSegmentMaster) => (
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", categoryColors[r.category])}>
                    {r.category}
                  </span>
                ),
              },
              {
                key: "disc",
                header: "Discount",
                render: (r: MarketSegmentMaster) => `${r.discountPercent}%`,
              },
              {
                key: "comm",
                header: "Commission",
                render: (r: MarketSegmentMaster) =>
                  r.commissionPercent != null ? `${r.commissionPercent}%` : "—",
              },
              {
                key: "status",
                header: "Status",
                render: (r: MarketSegmentMaster) => <StatusBadge status={r.status} />,
              },
            ]}
          />
        </div>

      <Drawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Add Market Segment"
        description="Define a new booking source segment."
        width="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={handleSave}>Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Code" required>
              <TextInput placeholder="CORP" value={code} onChange={(e) => setCode(e.target.value)} />
            </FormField>
            <FormField label="Name" required>
              <TextInput placeholder="Corporate" value={name} onChange={(e) => setName(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Category">
            <SelectInput
              value={category}
              onChange={(e) => setCategory(e.target.value as MarketSegmentMaster["category"])}
            >
              {(["Corporate", "Leisure", "OTA", "Government", "Group"] as const).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Discount (%)">
            <TextInput type="number" min="0" max="100" value={discount} onChange={(e) => setDiscount(e.target.value)} />
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
        description={preview?.code}
        width="md"
        footer={<Button variant="outline" onClick={() => setPreview(null)}>Close</Button>}
      >
        {preview && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <PieChart className="h-6 w-6" />
              </div>
              <div>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", categoryColors[preview.category])}>
                  {preview.category}
                </span>
                <p className="mt-1 text-2xl font-bold text-slate-900">{preview.discountPercent}% off</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">{preview.description}</p>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                { icon: Percent, label: "Discount", value: `${preview.discountPercent}%` },
                {
                  icon: Percent,
                  label: "Commission",
                  value: preview.commissionPercent != null ? `${preview.commissionPercent}%` : "N/A",
                },
                {
                  icon: Users,
                  label: "Contact",
                  value: preview.contactPerson ?? "—",
                },
                { icon: Building2, label: "Status", value: preview.status },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3 rounded-lg border border-slate-100 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</dt>
                    <dd className="mt-0.5 font-medium text-slate-900">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Drawer>
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
  const [preview, setPreview] = useState<CompanyMaster | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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

  const handleSave = async () => {
    if (!code.trim() || !name.trim() || !contactPerson.trim() || !email.trim() || !phone.trim()) {
      setToast("Please fill all required fields.");
      return;
    }
    try {
      const record = await companyService.create({
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
        status: "Active",
      });
      setItems((prev) => [record, ...prev]);
      setFormOpen(false);
      resetForm();
      setToast(`Company "${name}" added successfully.`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to save");
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-5">
      {toast && (
        <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />
      )}

      <FOPageHeader
        eyebrow="Front Office · Masters"
        title="Companies"
        description="Manage corporate accounts, travel agents, and billing companies for company bookings."
        action={
          <Button
            size="sm"
            className="bg-emerald-700 hover:bg-emerald-800"
            onClick={() => {
              resetForm();
              setFormOpen(true);
            }}
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
          ]}
        />
      </div>

      <Drawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Add Company"
        description="Register a new corporate or billing company."
        width="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={handleSave}>Save</Button>
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
        footer={<Button variant="outline" onClick={() => setPreview(null)}>Close</Button>}
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
    </div>
  );
}
