"use client";

import { useMemo, useState } from "react";
import { Clock, LogOut, Luggage, MapPin, Plus, User, UserPlus, Users } from "lucide-react";
import {
  inHouseGuests,
  luggageRecords,
  visitorEntries,
} from "@/app/data";
import type { LuggageRecord, VisitorEntry } from "@/app/data/frontoffice/modules";
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
  InvoiceHistoryView,
} from "@/components/frontoffice/ExtraServiceViews";

export function VisitorManagementView() {
  const [entries, setEntries] = useState(visitorEntries);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [purposeFilter, setPurposeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [toast, setToast] = useState<string | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [previewEntry, setPreviewEntry] = useState<VisitorEntry | null>(null);

  const [visitorName, setVisitorName] = useState("");
  const [guestName, setGuestName] = useState(inHouseGuests[0].guestName);
  const [timeIn, setTimeIn] = useState("");
  const [purpose, setPurpose] = useState("");
  const [idProof, setIdProof] = useState("Aadhaar");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let rows = entries.filter((e) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "inside" && e.status === "Inside") ||
        (statusFilter === "out" && e.status === "Checked Out");
      const matchesPurpose = purposeFilter === "all" || e.purpose === purposeFilter;
      return (
        matchesStatus &&
        matchesPurpose &&
        (e.visitorName.toLowerCase().includes(q) ||
          e.guestName.toLowerCase().includes(q) ||
          e.room.includes(q))
      );
    });
    if (sortBy === "visitor") rows = [...rows].sort((a, b) => a.visitorName.localeCompare(b.visitorName));
    if (sortBy === "guest") rows = [...rows].sort((a, b) => a.guestName.localeCompare(b.guestName));
    return rows;
  }, [entries, search, statusFilter, purposeFilter, sortBy]);

  const stats = useMemo(
    () => ({
      inside: entries.filter((e) => e.status === "Inside").length,
      today: entries.length,
      checkedOut: entries.filter((e) => e.status === "Checked Out").length,
    }),
    [entries],
  );

  const guestRoom = inHouseGuests.find((g) => g.guestName === guestName)?.room ?? "—";

  const resetForm = () => {
    setVisitorName("");
    setGuestName(inHouseGuests[0].guestName);
    setTimeIn("");
    setPurpose("");
    setIdProof("Aadhaar");
  };

  const openRegister = () => {
    resetForm();
    setRegisterOpen(true);
  };

  const handleRegister = () => {
    if (!visitorName.trim()) {
      setToast("Please enter visitor name.");
      return;
    }
    const now =
      timeIn ||
      new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    const entry: VisitorEntry = {
      id: `V-${String(entries.length + 1).padStart(2, "0")}`,
      visitorName: visitorName.trim(),
      guestName,
      room: guestRoom,
      timeIn: now,
      timeOut: "—",
      purpose: purpose || "Visit",
      idProof,
      status: "Inside",
    };
    setEntries((prev) => [entry, ...prev]);
    setRegisterOpen(false);
    resetForm();
    setToast(`${entry.visitorName} registered for ${guestName} (Room ${guestRoom}).`);
  };

  const handleCheckout = (id: string) => {
    const now = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, timeOut: now, status: "Checked Out" as const }
          : e,
      ),
    );
    setPreviewEntry((prev) =>
      prev?.id === id
        ? { ...prev, timeOut: now, status: "Checked Out" }
        : prev,
    );
    setToast("Visitor checked out successfully.");
  };

  const registerForm = (
    <div className="space-y-4">
      <FormField label="Visitor Name" required>
        <TextInput
          placeholder="Full name"
          value={visitorName}
          onChange={(e) => setVisitorName(e.target.value)}
        />
      </FormField>
      <FormField label="Visiting Guest" required>
        <SelectInput value={guestName} onChange={(e) => setGuestName(e.target.value)}>
          {inHouseGuests.map((g) => (
            <option key={g.id} value={g.guestName}>
              {g.guestName} — Room {g.room}
            </option>
          ))}
        </SelectInput>
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Time In">
          <TextInput type="time" value={timeIn} onChange={(e) => setTimeIn(e.target.value)} />
        </FormField>
        <FormField label="ID Proof">
          <SelectInput value={idProof} onChange={(e) => setIdProof(e.target.value)}>
            <option>Aadhaar</option>
            <option>Driving License</option>
            <option>Passport</option>
            <option>Voter ID</option>
          </SelectInput>
        </FormField>
      </div>
      <FormField label="Purpose">
        <TextInput
          placeholder="Purpose of visit"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        />
      </FormField>
    </div>
  );

  return (
    <div className="space-y-5">
      {toast && (
        <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />
      )}

      <FOPageHeader
        eyebrow="Front Office"
        title="Visitor Management"
        description="Register visitors, track entry/exit, and maintain security logs."
        action={
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={openRegister}
          >
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            Register Visitor
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatMiniCard label="Visitors Inside" value={stats.inside} accent="#f59e0b" icon={Users} sublabel="On premises" />
        <StatMiniCard label="Today's Entries" value={stats.today} icon={UserPlus} />
        <StatMiniCard label="Checked Out" value={stats.checkedOut} accent="#10b981" icon={LogOut} />
      </div>

      <FOSearchToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search visitor, guest, or room…"
        filterPills={{
          active: statusFilter,
          onChange: setStatusFilter,
          options: [
            { id: "all", label: "All" },
            { id: "inside", label: "Inside" },
            { id: "out", label: "Checked Out" },
          ],
        }}
        hasActiveAdvancedFilters={purposeFilter !== "all" || sortBy !== "newest"}
        onClearAdvancedFilters={() => { setPurposeFilter("all"); setSortBy("newest"); }}
        advancedFilters={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Purpose">
              <SelectInput value={purposeFilter} onChange={(e) => setPurposeFilter(e.target.value)}>
                <option value="all">All purposes</option>
                <option>Family Visit</option>
                <option>Business Meeting</option>
                <option>Colleague Visit</option>
              </SelectInput>
            </FormField>
            <FormField label="Sort By">
              <SelectInput value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Newest first</option>
                <option value="visitor">Visitor A–Z</option>
                <option value="guest">Guest A–Z</option>
              </SelectInput>
            </FormField>
            <FormField label="Showing">
              <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
                {filtered.length} of {entries.length} visitors
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
                onClick={() => setPreviewEntry(r)}
                className="w-full rounded-xl border border-slate-100 p-4 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{r.visitorName}</p>
                    <p className="text-xs text-slate-500">
                      Visiting {r.guestName} · Room {r.room}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                      r.status === "Inside"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700",
                    )}
                  >
                    {r.status}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-slate-600">
                  <span>In: {r.timeIn}</span>
                  <span>Out: {r.timeOut}</span>
                  <span className="col-span-2">{r.purpose}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-500">
                    <th className="pb-3 pr-4">Visitor</th>
                    <th className="pb-3 pr-4">Guest / Room</th>
                    <th className="pb-3 pr-4">Time In</th>
                    <th className="pb-3 pr-4">Time Out</th>
                    <th className="pb-3 pr-4">Purpose</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setPreviewEntry(r)}
                      className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-blue-50/40"
                    >
                      <td className="py-3.5 pr-4">
                        <div>
                          <p className="font-medium text-slate-900">{r.visitorName}</p>
                          <p className="text-xs text-slate-400">{r.idProof}</p>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4">
                        <div>
                          <p>{r.guestName}</p>
                          <p className="text-xs text-slate-400">Room {r.room}</p>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4">{r.timeIn}</td>
                      <td className="py-3.5 pr-4">{r.timeOut}</td>
                      <td className="py-3.5 pr-4">{r.purpose}</td>
                      <td className="py-3.5 pr-4">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-medium",
                            r.status === "Inside"
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
                        {r.status === "Inside" ? (
                          <ActionButtons
                            actions={[
                              {
                                label: "Check Out",
                                onClick: () => handleCheckout(r.id),
                              },
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
        </div>

      {/* Register drawer */}
      <Drawer
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        title="Register Visitor"
        description="Log a new visitor entry for an in-house guest."
        width="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setRegisterOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleRegister}>
              Register Entry
            </Button>
          </>
        }
      >
        {registerForm}
      </Drawer>

      {/* Preview drawer */}
      <Drawer
        open={!!previewEntry}
        onClose={() => setPreviewEntry(null)}
        title={previewEntry?.visitorName ?? ""}
        description={
          previewEntry
            ? `Visiting ${previewEntry.guestName} · Room ${previewEntry.room}`
            : undefined
        }
        width="md"
        footer={
          previewEntry && (
            <>
              <Button variant="outline" onClick={() => setPreviewEntry(null)}>
                Close
              </Button>
              {previewEntry.status === "Inside" && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleCheckout(previewEntry.id)}
                >
                  <LogOut className="mr-1.5 h-3.5 w-3.5" />
                  Check Out Visitor
                </Button>
              )}
            </>
          )
        }
      >
        {previewEntry && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-base font-bold text-blue-700">
                {previewEntry.visitorName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    previewEntry.status === "Inside"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700",
                  )}
                >
                  {previewEntry.status}
                </span>
                <p className="mt-1 text-xs text-slate-500">Entry ID: {previewEntry.id}</p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-4 text-sm">
              {[
                { icon: Users, label: "Visiting Guest", value: previewEntry.guestName },
                { icon: Users, label: "Room", value: previewEntry.room },
                { icon: Clock, label: "Time In", value: previewEntry.timeIn },
                { icon: Clock, label: "Time Out", value: previewEntry.timeOut },
                { icon: UserPlus, label: "ID Proof", value: previewEntry.idProof ?? "—" },
                { icon: UserPlus, label: "Purpose", value: previewEntry.purpose },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3">
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


export function LuggageManagementView() {
  const [records, setRecords] = useState(luggageRecords);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [toast, setToast] = useState<string | null>(null);
  const [storeOpen, setStoreOpen] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<LuggageRecord | null>(null);

  const [guestName, setGuestName] = useState(inHouseGuests[0].guestName);
  const [bagCount, setBagCount] = useState("1");
  const [location, setLocation] = useState("Locker A-12");

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

  const guestRoom = inHouseGuests.find((g) => g.guestName === guestName)?.room ?? "—";

  const resetForm = () => {
    setGuestName(inHouseGuests[0].guestName);
    setBagCount("1");
    setLocation("Locker A-12");
  };

  const openStore = () => {
    resetForm();
    setStoreOpen(true);
  };

  const handleStore = () => {
    const bags = parseInt(bagCount, 10) || 1;
    const token = `LG-${100 + records.length + 1}`;
    const now = new Date().toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    setRecords((prev) => [
      {
        id: `L-${String(prev.length + 1).padStart(2, "0")}`,
        guest: guestName,
        room: guestRoom,
        bagCount: bags,
        tokenNo: token,
        stored: now,
        location,
        status: "Stored",
      },
      ...prev,
    ]);
    setStoreOpen(false);
    resetForm();
    setToast(`${bags} bag(s) stored for ${guestName}. Token: ${token}`);
  };

  const handleReturn = (id: string) => {
    const now = new Date().toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
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
  };

  const storeForm = (
    <div className="space-y-4">
      <FormField label="Guest" required>
        <SelectInput value={guestName} onChange={(e) => setGuestName(e.target.value)}>
          {inHouseGuests.map((g) => (
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
        eyebrow="Front Office"
        title="Luggage Management"
        description="Store and track guest luggage with token-based retrieval."
        action={
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
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
                className="w-full rounded-xl border border-slate-100 p-4 text-left transition-colors hover:border-blue-200 hover:bg-blue-50/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{r.guest}</p>
                    <p className="font-mono text-xs text-blue-600">{r.tokenNo}</p>
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
                    className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-blue-50/40"
                  >
                    <td className="py-3.5 pr-4">
                      <div>
                        <p className="font-medium text-slate-900">{r.guest}</p>
                        <p className="text-xs text-slate-400">Room {r.room}</p>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4">{r.bagCount}</td>
                    <td className="py-3.5 pr-4">
                      <span className="font-mono text-xs font-semibold text-blue-600">
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
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleStore}>
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
                  className="bg-blue-600 hover:bg-blue-700"
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
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Luggage className="h-6 w-6" />
              </div>
              <div>
                <p className="font-mono text-lg font-bold text-blue-600">
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
