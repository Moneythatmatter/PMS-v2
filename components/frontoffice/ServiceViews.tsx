"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, LogOut, Luggage, MapPin, Plus, User } from "lucide-react";
import type { InHouseGuest, LuggageRecord } from "@/app/data/frontoffice/modules";
import { luggageService, reservationService } from "@/services/front-office";
import { Button } from "@/components/ui/Button";
import {
  ActionButtons,
  AlertBanner,
  DataTable,
  Drawer,
  FOSearchToolbar,
  FormField,
  FormSection,
  FOPageHeader,
  PageHeader,
  SelectInput,
  StatMiniCard,
  TextAreaInput,
  TextInput,
  formatINR,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";

export {
  WakeUpCallsView,
  TaxiBookingView,
  MessagesView,
  HousekeepingRequestsView,
  MaintenanceRequestsView,
  LostFoundView,
  GuestFeedbackView,
} from "@/components/frontoffice/ExtraServiceViews";

export function LuggageManagementView() {
  const [records, setRecords] = useState<LuggageRecord[]>([]);
  const [guests, setGuests] = useState<InHouseGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [toast, setToast] = useState<string | null>(null);
  const [storeOpen, setStoreOpen] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<LuggageRecord | null>(null);

  const [guestName, setGuestName] = useState("");
  const [bagCount, setBagCount] = useState("1");
  const [location, setLocation] = useState("Locker A-12");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [bags, inHouse] = await Promise.all([
          luggageService.list(),
          reservationService.inHouse(),
        ]);
        if (!cancelled) {
          setRecords(bags);
          setGuests(inHouse as InHouseGuest[]);
          if (inHouse[0]) setGuestName(inHouse[0].guestName);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let rows = records.filter((r) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "stored" && r.status === "Stored") ||
        (statusFilter === "returned" && r.status === "Returned");
      return (
        matchesStatus &&
        (r.guest.toLowerCase().includes(q) ||
          r.tokenNo.toLowerCase().includes(q) ||
          r.room.includes(q))
      );
    });
    if (sortBy === "guest") rows = [...rows].sort((a, b) => a.guest.localeCompare(b.guest));
    if (sortBy === "bags") rows = [...rows].sort((a, b) => b.bagCount - a.bagCount);
    return rows;
  }, [records, search, statusFilter, sortBy]);

  const stats = useMemo(
    () => ({
      stored: records.filter((r) => r.status === "Stored").length,
      returned: records.filter((r) => r.status === "Returned").length,
      totalBags: records.reduce((s, r) => s + r.bagCount, 0),
    }),
    [records],
  );

  const guestRoom = guests.find((g) => g.guestName === guestName)?.room ?? "—";

  const resetForm = () => {
    setGuestName(guests[0]?.guestName ?? "");
    setBagCount("1");
    setLocation("Locker A-12");
  };

  const openStore = () => {
    resetForm();
    setStoreOpen(true);
  };

  const handleStore = async () => {
    const bags = parseInt(bagCount, 10) || 1;
    const token = `LG-${100 + records.length + 1}`;
    const now = new Date().toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    try {
      const record = await luggageService.create({
        guest: guestName,
        room: guestRoom,
        bagCount: bags,
        tokenNo: token,
        stored: now,
        location,
        status: "Stored",
      });
      setRecords((prev) => [record, ...prev]);
      setStoreOpen(false);
      resetForm();
      setToast(`${bags} bag(s) stored for ${guestName}. Token: ${token}`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to store luggage");
    }
  };

  const handleReturn = async (id: string) => {
    const now = new Date().toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    try {
      await luggageService.update(id, { returned: now, status: "Returned" });
      setRecords((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, returned: now, status: "Returned" as const }
            : r,
        ),
      );
      setPreviewRecord((prev) =>
        prev?.id === id
          ? { ...prev, returned: now, status: "Returned" }
          : prev,
      );
      setToast("Luggage returned to guest.");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to return luggage");
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  const storeForm = (
    <div className="space-y-4">
      <FormField label="Guest" required>
        <SelectInput value={guestName} onChange={(e) => setGuestName(e.target.value)}>
          {guests.map((g) => (
            <option key={g.id} value={g.guestName}>
              {g.guestName} — Room {g.room}
            </option>
          ))}
        </SelectInput>
      </FormField>
      <FormField label="Bag Count" required>
        <TextInput
          type="number"
          min="1"
          value={bagCount}
          onChange={(e) => setBagCount(e.target.value)}
        />
      </FormField>
      <FormField label="Storage Location">
        <SelectInput value={location} onChange={(e) => setLocation(e.target.value)}>
          <option>Locker A-12</option>
          <option>Locker B-03</option>
          <option>Storage Room</option>
          <option>Concierge Desk</option>
        </SelectInput>
      </FormField>
    </div>
  );

  return (
    <div className="space-y-5">
      {toast && (
        <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />
      )}

      <FOPageHeader
        eyebrow="Housekeeping"
        title="Luggage Management"
        description="Store and track guest luggage with token-based retrieval."
        action={
          <Button
            size="sm"
            className="bg-emerald-700 hover:bg-emerald-800"
            onClick={openStore}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Store Luggage
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatMiniCard label="Currently Stored" value={stats.stored} accent="#f59e0b" icon={Luggage} sublabel="Awaiting pickup" />
        <StatMiniCard label="Returned Today" value={stats.returned} accent="#10b981" icon={LogOut} />
        <StatMiniCard label="Total Bags" value={stats.totalBags} icon={MapPin} />
      </div>

      <FOSearchToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search guest, token, or room…"
        filterPills={{
          active: statusFilter,
          onChange: setStatusFilter,
          options: [
            { id: "all", label: "All" },
            { id: "stored", label: "Stored" },
            { id: "returned", label: "Returned" },
          ],
        }}
        hasActiveAdvancedFilters={sortBy !== "newest"}
        onClearAdvancedFilters={() => setSortBy("newest")}
        advancedFilters={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Sort By">
              <SelectInput value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Newest first</option>
                <option value="guest">Guest A–Z</option>
                <option value="bags">Most bags</option>
              </SelectInput>
            </FormField>
            <FormField label="Showing">
              <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
                {filtered.length} of {records.length} records
              </div>
            </FormField>
          </div>
        }
      />

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setPreviewRecord(r)}
                className="w-full rounded-xl border border-slate-100 p-4 text-left transition-colors hover:border-emerald-200 hover:bg-emerald-50/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{r.guest}</p>
                    <p className="font-mono text-xs text-emerald-700">{r.tokenNo}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      r.status === "Stored"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700",
                    )}
                  >
                    {r.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {r.bagCount} bag(s) · {r.location}
                </p>
              </button>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <th className="pb-3 pr-4">Guest</th>
                  <th className="pb-3 pr-4">Bags</th>
                  <th className="pb-3 pr-4">Token</th>
                  <th className="pb-3 pr-4">Location</th>
                  <th className="pb-3 pr-4">Stored At</th>
                  <th className="pb-3 pr-4">Returned</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setPreviewRecord(r)}
                    className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-emerald-50/40"
                  >
                    <td className="py-3.5 pr-4">
                      <div>
                        <p className="font-medium text-slate-900">{r.guest}</p>
                        <p className="text-xs text-slate-400">Room {r.room}</p>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4">{r.bagCount}</td>
                    <td className="py-3.5 pr-4">
                      <span className="font-mono text-xs font-semibold text-emerald-700">
                        {r.tokenNo}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">{r.location}</td>
                    <td className="py-3.5 pr-4">{r.stored}</td>
                    <td className="py-3.5 pr-4">{r.returned ?? "—"}</td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium",
                          r.status === "Stored"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-emerald-50 text-emerald-700",
                        )}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td
                      className="py-3.5 pr-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {r.status === "Stored" ? (
                        <ActionButtons
                          actions={[
                            { label: "Return", onClick: () => handleReturn(r.id) },
                          ]}
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      {/* Store luggage drawer */}
      <Drawer
        open={storeOpen}
        onClose={() => setStoreOpen(false)}
        title="Store Luggage"
        description="Issue a token and record stored bags for a guest."
        width="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setStoreOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={handleStore}>
              <Luggage className="mr-1.5 h-3.5 w-3.5" />
              Issue Token & Store
            </Button>
          </>
        }
      >
        {storeForm}
      </Drawer>

      {/* Preview drawer */}
      <Drawer
        open={!!previewRecord}
        onClose={() => setPreviewRecord(null)}
        title={previewRecord?.guest ?? ""}
        description={
          previewRecord
            ? `Token ${previewRecord.tokenNo} · Room ${previewRecord.room}`
            : undefined
        }
        width="md"
        footer={
          previewRecord && (
            <>
              <Button variant="outline" onClick={() => setPreviewRecord(null)}>
                Close
              </Button>
              {previewRecord.status === "Stored" && (
                <Button
                  className="bg-emerald-700 hover:bg-emerald-800"
                  onClick={() => handleReturn(previewRecord.id)}
                >
                  Return to Guest
                </Button>
              )}
            </>
          )
        }
      >
        {previewRecord && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <Luggage className="h-6 w-6" />
              </div>
              <div>
                <p className="font-mono text-lg font-bold text-emerald-700">
                  {previewRecord.tokenNo}
                </p>
                <span
                  className={cn(
                    "mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                    previewRecord.status === "Stored"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700",
                  )}
                >
                  {previewRecord.status}
                </span>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-3 text-sm">
              {[
                { icon: User, label: "Guest", value: previewRecord.guest },
                { icon: User, label: "Room", value: previewRecord.room },
                { icon: Luggage, label: "Bag Count", value: String(previewRecord.bagCount) },
                { icon: MapPin, label: "Location", value: previewRecord.location },
                { icon: Clock, label: "Stored At", value: previewRecord.stored },
                {
                  icon: Clock,
                  label: "Returned At",
                  value: previewRecord.returned ?? "—",
                },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3 rounded-lg border border-slate-100 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      {label}
                    </dt>
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


export function ReportView({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-4">
      <PageHeader title={title} description={description} action={<Button size="sm" variant="outline">Export PDF</Button>} />
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Report data for {title} will appear here. Connect to backend to load live data.
      </div>
    </div>
  );
}
