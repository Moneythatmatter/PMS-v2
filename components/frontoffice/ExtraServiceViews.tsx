"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Bell,
  Car,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Mail,
  MessageSquare,
  PackageSearch,
  Plus,
  Sparkles,
  Star,
  User,
  Wrench,
} from "lucide-react";
import type {
  GuestFeedbackRecord,
  HousekeepingRequest,
  InHouseGuest,
  InvoiceRecord,
  LostFoundItem,
  MaintenanceRequest,
  MessageRecord,
  TaxiBooking,
  WakeUpCall,
} from "@/app/data/frontoffice/modules";
import {
  initialGuestFeedback,
  initialTaxiLogs,
  initialWakeupCalls,
} from "@/app/data/frontoffice/extraServices";
import {
  feedbackService,
  housekeepingRequestService,
  invoiceService,
  lostFoundService,
  maintenanceRequestService,
  messageService,
  reservationService,
  taxiBookingService,
  wakeUpCallService,
} from "@/services/front-office";
import { Button } from "@/components/ui/Button";
import { CheckoutInvoiceDrawer, type InvoiceData } from "@/components/frontoffice/CheckoutInvoice";
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
import type { LucideIcon } from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { ModuleSelectionBar } from "@/components/pms/ModuleSelectionBar";
import { cn } from "@/lib/utils";

function ClickableTable<T extends { id: string }>({
  rows,
  columns,
  onRowClick,
  selectedIds,
  onSelectionChange,
}: {
  rows: T[];
  columns: { key: string; header: string; render: (row: T) => React.ReactNode }[];
  onRowClick: (row: T) => void;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}) {
  const selectable = Boolean(selectedIds && onSelectionChange);
  const selected = selectedIds ?? new Set<string>();
  const allSelected = selectable && rows.length > 0 && rows.every((r) => selected.has(r.id));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  };

  const toggleOne = (id: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  return (
    <>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <div
            key={row.id}
            role="button"
            tabIndex={0}
            onClick={() => onRowClick(row)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onRowClick(row);
              }
            }}
            className="w-full cursor-pointer rounded-xl border border-slate-100 p-4 text-left hover:border-emerald-200 hover:bg-emerald-50/30"
          >
            {selectable && (
              <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selected.has(row.id)}
                  onChange={() => toggleOne(row.id)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                />
              </div>
            )}
            {columns.slice(0, 3).map((col) => (
              <div key={col.key} className="text-sm">{col.render(row)}</div>
            ))}
          </div>
        ))}
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-500">
              {selectable && (
                <th className="w-10 pb-3 pr-2">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                    aria-label="Select all"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th key={col.key} className="pb-3 pr-4">{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick(row)}
                className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-emerald-50/40"
              >
                {selectable && (
                  <td className="py-3.5 pr-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggleOne(row.id)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key} className="py-3.5 pr-4">{col.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", className)}>
      {children}
    </span>
  );
}

const statusColors: Record<string, string> = {
  Open: "bg-slate-100 text-slate-700",
  "In Progress": "bg-amber-50 text-amber-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Stored: "bg-amber-50 text-amber-700",
  Returned: "bg-emerald-50 text-emerald-700",
  Claimed: "bg-emerald-50 text-emerald-800",
  Scheduled: "bg-emerald-50 text-emerald-800",
  "In Transit": "bg-amber-50 text-amber-700",
  Cancelled: "bg-red-50 text-red-700",
  Paid: "bg-emerald-50 text-emerald-700",
  Partial: "bg-amber-50 text-amber-700",
  Pending: "bg-red-50 text-red-700",
};

const priorityColors: Record<string, string> = {
  Low: "bg-slate-100 text-slate-600",
  Medium: "bg-emerald-50 text-emerald-800",
  High: "bg-amber-50 text-amber-700",
  Critical: "bg-red-50 text-red-700",
};

function useModulePage<T extends { id: string }>(
  loader: () => Promise<T[]>,
  searchFn: (item: T, q: string) => boolean,
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [preview, setPreview] = useState<T | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await loader();
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
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((item) => searchFn(item, q));
  }, [items, search, searchFn]);

  return { items, setItems, search, setSearch, toast, setToast, formOpen, setFormOpen, preview, setPreview, filtered, loading, error };
}

function useInHouseGuests() {
  const [guests, setGuests] = useState<InHouseGuest[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await reservationService.inHouse();
        if (!cancelled) setGuests(data as InHouseGuest[]);
      } catch {
        if (!cancelled) setGuests([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return guests;
}

export function WakeUpCallsView() {
  const { items, setItems, search, setSearch, toast, setToast, formOpen, setFormOpen, preview, setPreview, filtered, loading, error } =
    useModulePage(() => wakeUpCallService.list(), (r, q) =>
      r.guest.toLowerCase().includes(q) || r.room.includes(q) || r.date.toLowerCase().includes(q));
  const guests = useInHouseGuests();

  const [guestName, setGuestName] = useState("");
  useEffect(() => {
    if (!guestName && guests[0]) setGuestName(guests[0].guestName);
  }, [guests, guestName]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("06:00");
  const [notes, setNotes] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const list = useMemo(() => {
    let rows = filtered.filter((r) =>
      filter === "all" || (filter === "pending" && !r.completed) || (filter === "done" && r.completed));
    if (sortBy === "guest") rows = [...rows].sort((a, b) => a.guest.localeCompare(b.guest));
    if (sortBy === "time") rows = [...rows].sort((a, b) => a.time.localeCompare(b.time));
    return rows;
  }, [filtered, filter, sortBy]);

  useEffect(() => {
    if (!guestName && guests[0]) setGuestName(guests[0].guestName);
  }, [guests, guestName]);

  const guest = guests.find((g) => g.guestName === guestName);
  const firstSelected = list.find((r) => selectedIds.has(r.id));

  const handleSave = async () => {
    try {
      const record = await wakeUpCallService.create({
        guest: guestName,
        room: guest?.room ?? "—",
        date: new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        time: new Date(`2000-01-01T${time}`).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
        notes: notes || undefined,
        completed: false,
      });
      setItems((prev) => [record, ...prev]);
      setFormOpen(false);
      setToast(`Wake-up call scheduled for ${guestName} at ${record.time}.`);
      setNotes("");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to save");
    }
  };

  const markDone = async (id: string) => {
    try {
      await wakeUpCallService.update(id, { completed: true });
      setItems((prev) => prev.map((r) => (r.id === id ? { ...r, completed: true } : r)));
      setPreview((p) => (p?.id === id ? { ...p, completed: true } : p));
      setToast("Wake-up call marked as completed.");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to update");
    }
  };

  return (
    <ModuleShell toast={toast} setToast={setToast}
      header={{ title: "Wake-up Calls", desc: "Schedule and track guest wake-up calls.", btn: "Schedule Call", onBtn: () => setFormOpen(true) }}
      stats={[
        { label: "Scheduled Today", value: list.filter((r) => !r.completed).length, accent: "#f59e0b", icon: Bell, sublabel: "Awaiting call" },
        { label: "Completed", value: items.filter((r) => r.completed).length, accent: "#10b981", icon: CheckCircle2, sublabel: "Done today" },
        { label: "Total", value: items.length, icon: Clock, sublabel: "All wake-up calls" },
      ]}
      search={search} setSearch={setSearch} searchPh="Search guest or room…"
      filters={{ active: filter, onChange: setFilter, options: [{ id: "all", label: "All" }, { id: "pending", label: "Pending" }, { id: "done", label: "Completed" }] }}
      sort={{ value: sortBy, onChange: setSortBy, options: [{ value: "newest", label: "Newest first" }, { value: "guest", label: "Guest A–Z" }, { value: "time", label: "By time" }] }}
      resultCount={{ shown: list.length, total: items.length }}
      hasActiveAdvancedFilters={sortBy !== "newest"}
      onClearAdvancedFilters={() => setSortBy("newest")}
      selectionBar={
        <ModuleSelectionBar
          count={selectedIds.size}
          noun="call"
          onClear={() => setSelectedIds(new Set())}
          actions={[
            {
              label: "View",
              onClick: () => {
                if (firstSelected) setPreview(firstSelected);
              },
            },
            ...(firstSelected && !firstSelected.completed
              ? [
                  {
                    label: "Mark Done",
                    onClick: () => markDone(firstSelected.id),
                  },
                ]
              : []),
          ]}
        />
      }
    >
      <ClickableTable
        rows={list}
        onRowClick={setPreview}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        columns={[
          { key: "guest", header: "Guest", render: (r) => <><p className="font-medium">{r.guest}</p><p className="text-xs text-slate-400">Room {r.room}</p></> },
          { key: "date", header: "Date", render: (r) => r.date },
          { key: "time", header: "Time", render: (r) => <span className="font-semibold">{r.time}</span> },
          { key: "status", header: "Status", render: (r) => <Pill className={r.completed ? statusColors.Completed : statusColors.Pending}>{r.completed ? "Done" : "Pending"}</Pill> },
        ]}
      />
      <FormDrawer open={formOpen} onClose={() => setFormOpen(false)} title="Schedule Wake-up Call" onSave={handleSave}>
        <FormField label="Guest"><SelectInput value={guestName} onChange={(e) => setGuestName(e.target.value)}>{guests.map((g) => <option key={g.id} value={g.guestName}>{g.guestName} — Room {g.room}</option>)}</SelectInput></FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Date"><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} /></FormField>
          <FormField label="Time"><TextInput type="time" value={time} onChange={(e) => setTime(e.target.value)} /></FormField>
        </div>
        <FormField label="Notes"><TextAreaInput value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Special instructions…" /></FormField>
      </FormDrawer>
      <PreviewDrawer open={!!preview} onClose={() => setPreview(null)} title={preview?.guest ?? ""} desc={`Room ${preview?.room} · ${preview?.time}`}
        footer={preview && !preview.completed && <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={() => markDone(preview.id)}>Mark Done</Button>}>
        {preview && <PreviewGrid icon={Bell} rows={[["Date", preview.date], ["Time", preview.time], ["Notes", preview.notes ?? "—"], ["Status", preview.completed ? "Completed" : "Pending"]]} />}
      </PreviewDrawer>
    </ModuleShell>
  );
}

export function HousekeepingRequestsView() {
  const { items, setItems, search, setSearch, toast, setToast, formOpen, setFormOpen, preview, setPreview, filtered, loading, error } =
    useModulePage(() => housekeepingRequestService.list(), (r, q) => r.guest.toLowerCase().includes(q) || r.room.includes(q) || r.issue.toLowerCase().includes(q));

  const guests = useInHouseGuests();

  const [guestName, setGuestName] = useState("");
  useEffect(() => {
    if (!guestName && guests[0]) setGuestName(guests[0].guestName);
  }, [guests, guestName]);
  const [issue, setIssue] = useState("");
  const [priority, setPriority] = useState<HousekeepingRequest["priority"]>("Medium");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const guest = guests.find((g) => g.guestName === guestName);
  const list = useMemo(() => {
    let rows = filtered.filter((r) => filter === "all" || r.status === filter);
    if (sortBy === "priority") rows = [...rows].sort((a, b) => b.priority.localeCompare(a.priority));
    if (sortBy === "guest") rows = [...rows].sort((a, b) => a.guest.localeCompare(b.guest));
    return rows;
  }, [filtered, filter, sortBy]);
  const firstSelected = list.find((r) => selectedIds.has(r.id));

  const handleSave = async () => {
    if (!issue.trim()) { setToast("Please describe the issue."); return; }
    try {
      const record = await housekeepingRequestService.create({
        guest: guestName, room: guest?.room ?? "—", issue, priority,
        status: "Open", assignedStaff: "—",
        createdAt: new Date().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true }),
      });
      setItems((prev) => [record, ...prev]);
      setFormOpen(false);
      setIssue("");
      setToast(`Housekeeping request logged for Room ${record.room}.`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to save");
    }
  };

  const assign = async (id: string) => {
    try {
      await housekeepingRequestService.update(id, { status: "In Progress", assignedStaff: "Meena" });
      setItems((prev) => prev.map((r) => r.id === id ? { ...r, status: "In Progress" as const, assignedStaff: "Meena" } : r));
      setPreview((p) => p?.id === id ? { ...p, status: "In Progress", assignedStaff: "Meena" } : p);
      setToast("Request assigned to Meena.");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to update");
    }
  };

  return (
    <ModuleShell toast={toast} setToast={setToast} eyebrow="Housekeeping"
      header={{ title: "Housekeeping Requests", desc: "Log and track guest housekeeping requests.", btn: "New Request", onBtn: () => setFormOpen(true) }}
      stats={[
        { label: "Open", value: items.filter((r) => r.status === "Open").length, accent: "#64748b", icon: Sparkles, sublabel: "Awaiting assignment" },
        { label: "In Progress", value: items.filter((r) => r.status === "In Progress").length, accent: "#f59e0b", icon: Clock },
        { label: "Completed", value: items.filter((r) => r.status === "Completed").length, accent: "#10b981", icon: CheckCircle2 },
      ]}
      search={search} setSearch={setSearch} searchPh="Search guest, room, issue…"
      filters={{ active: filter, onChange: setFilter, options: [{ id: "all", label: "All" }, { id: "Open", label: "Open" }, { id: "In Progress", label: "In Progress" }, { id: "Completed", label: "Completed" }] }}
      sort={{ value: sortBy, onChange: setSortBy, options: [{ value: "newest", label: "Newest first" }, { value: "priority", label: "By priority" }, { value: "guest", label: "Guest A–Z" }] }}
      resultCount={{ shown: list.length, total: items.length }}
      hasActiveAdvancedFilters={sortBy !== "newest"}
      onClearAdvancedFilters={() => setSortBy("newest")}
      selectionBar={
        <ModuleSelectionBar
          count={selectedIds.size}
          noun="request"
          onClear={() => setSelectedIds(new Set())}
          actions={[
            {
              label: "View",
              onClick: () => {
                if (firstSelected) setPreview(firstSelected);
              },
            },
            ...(firstSelected && firstSelected.status === "Open"
              ? [{ label: "Assign", onClick: () => assign(firstSelected.id) }]
              : []),
          ]}
        />
      }
    >
      <ClickableTable
        rows={list}
        onRowClick={setPreview}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        columns={[
          { key: "guest", header: "Guest / Room", render: (r) => <><p className="font-medium">{r.guest}</p><p className="text-xs text-slate-400">Room {r.room}</p></> },
          { key: "issue", header: "Issue", render: (r) => r.issue },
          { key: "priority", header: "Priority", render: (r) => <Pill className={priorityColors[r.priority]}>{r.priority}</Pill> },
          { key: "staff", header: "Staff", render: (r) => r.assignedStaff },
          { key: "status", header: "Status", render: (r) => <Pill className={statusColors[r.status]}>{r.status}</Pill> },
        ]}
      />
      <FormDrawer open={formOpen} onClose={() => setFormOpen(false)} title="New HK Request" onSave={handleSave}>
        <FormField label="Guest"><SelectInput value={guestName} onChange={(e) => setGuestName(e.target.value)}>{guests.map((g) => <option key={g.id} value={g.guestName}>{g.guestName} — Room {g.room}</option>)}</SelectInput></FormField>
        <FormField label="Priority"><SelectInput value={priority} onChange={(e) => setPriority(e.target.value as HousekeepingRequest["priority"])}><option>Low</option><option>Medium</option><option>High</option></SelectInput></FormField>
        <FormField label="Issue" required><TextAreaInput value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="Describe the request…" /></FormField>
      </FormDrawer>
      <PreviewDrawer open={!!preview} onClose={() => setPreview(null)} title={preview?.issue ?? ""} desc={`Room ${preview?.room}`}>
        {preview && <PreviewGrid icon={Sparkles} rows={[["Guest", preview.guest], ["Priority", preview.priority], ["Staff", preview.assignedStaff], ["Created", preview.createdAt], ["Status", preview.status]]} />}
      </PreviewDrawer>
    </ModuleShell>
  );
}

export function MaintenanceRequestsView() {
  const { items, setItems, search, setSearch, toast, setToast, formOpen, setFormOpen, preview, setPreview, filtered, loading, error } =
    useModulePage(() => maintenanceRequestService.list(), (r, q) => r.room.includes(q) || r.problem.toLowerCase().includes(q));

  const guests = useInHouseGuests();

  const [room, setRoom] = useState("104");
  const [problem, setProblem] = useState("");
  const [priority, setPriority] = useState<MaintenanceRequest["priority"]>("Medium");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const list = useMemo(() => {
    let rows = filtered.filter((r) => filter === "all" || r.status === filter);
    if (sortBy === "priority") rows = [...rows].sort((a, b) => b.priority.localeCompare(a.priority));
    if (sortBy === "room") rows = [...rows].sort((a, b) => a.room.localeCompare(b.room));
    return rows;
  }, [filtered, filter, sortBy]);

  const handleSave = async () => {
    if (!problem.trim()) { setToast("Please describe the problem."); return; }
    try {
      const record = await maintenanceRequestService.create({
        room, problem, priority, engineer: "—", status: "Open", reportedBy: "Front Desk",
        createdAt: new Date().toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true }),
      });
      setItems((prev) => [record, ...prev]);
      setFormOpen(false);
      setProblem("");
      setToast(`Maintenance request logged for Room ${room}.`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to save");
    }
  };

  return (
    <ModuleShell toast={toast} setToast={setToast} eyebrow="Housekeeping"
      header={{ title: "Maintenance Requests", desc: "Log and track room maintenance issues.", btn: "Log Issue", onBtn: () => setFormOpen(true) }}
      stats={[
        { label: "Open", value: items.filter((r) => r.status === "Open").length, icon: Wrench, sublabel: "Needs attention" },
        { label: "In Progress", value: items.filter((r) => r.status === "In Progress").length, accent: "#f59e0b", icon: Clock },
        { label: "Critical", value: items.filter((r) => r.priority === "Critical").length, accent: "#ef4444", icon: AlertCircle },
      ]}
      search={search} setSearch={setSearch} searchPh="Search room or problem…"
      filters={{ active: filter, onChange: setFilter, options: [{ id: "all", label: "All" }, { id: "Open", label: "Open" }, { id: "In Progress", label: "In Progress" }, { id: "Completed", label: "Completed" }] }}
      sort={{ value: sortBy, onChange: setSortBy, options: [{ value: "newest", label: "Newest first" }, { value: "priority", label: "By priority" }, { value: "room", label: "By room" }] }}
      resultCount={{ shown: list.length, total: items.length }}
      hasActiveAdvancedFilters={sortBy !== "newest"}
      onClearAdvancedFilters={() => setSortBy("newest")}
    >
      <ClickableTable rows={list} onRowClick={setPreview}
        columns={[
          { key: "room", header: "Room", render: (r) => <span className="font-semibold">{r.room}</span> },
          { key: "problem", header: "Problem", render: (r) => r.problem },
          { key: "priority", header: "Priority", render: (r) => <Pill className={priorityColors[r.priority]}>{r.priority}</Pill> },
          { key: "engineer", header: "Engineer", render: (r) => r.engineer },
          { key: "status", header: "Status", render: (r) => <Pill className={statusColors[r.status]}>{r.status}</Pill> },
        ]}
      />
      <FormDrawer open={formOpen} onClose={() => setFormOpen(false)} title="Log Maintenance Issue" onSave={handleSave}>
        <FormField label="Room" required><TextInput value={room} onChange={(e) => setRoom(e.target.value)} /></FormField>
        <FormField label="Priority"><SelectInput value={priority} onChange={(e) => setPriority(e.target.value as MaintenanceRequest["priority"])}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></SelectInput></FormField>
        <FormField label="Problem" required><TextAreaInput value={problem} onChange={(e) => setProblem(e.target.value)} /></FormField>
      </FormDrawer>
      <PreviewDrawer open={!!preview} onClose={() => setPreview(null)} title={`Room ${preview?.room}`} desc={preview?.problem}>
        {preview && <PreviewGrid icon={Wrench} rows={[["Priority", preview.priority], ["Engineer", preview.engineer], ["Reported By", preview.reportedBy ?? "—"], ["Created", preview.createdAt], ["Status", preview.status]]} />}
      </PreviewDrawer>
    </ModuleShell>
  );
}

export function LostFoundView() {
  const { items, setItems, search, setSearch, toast, setToast, formOpen, setFormOpen, preview, setPreview, filtered, loading, error } =
    useModulePage(() => lostFoundService.list(), (r, q) => r.item.toLowerCase().includes(q) || r.guest.toLowerCase().includes(q) || r.room.includes(q));

  const guests = useInHouseGuests();

  const [item, setItem] = useState("");
  const [guest, setGuest] = useState("");
  const [room, setRoom] = useState("");
  const [foundBy, setFoundBy] = useState("Front Desk");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const list = useMemo(() => {
    let rows = filtered.filter((r) => filter === "all" || r.status === filter);
    if (sortBy === "item") rows = [...rows].sort((a, b) => a.item.localeCompare(b.item));
    if (sortBy === "guest") rows = [...rows].sort((a, b) => a.guest.localeCompare(b.guest));
    return rows;
  }, [filtered, filter, sortBy]);
  const firstSelected = list.find((r) => selectedIds.has(r.id));

  const handleSave = async () => {
    if (!item.trim()) { setToast("Please enter item name."); return; }
    try {
      const record = await lostFoundService.create({
        item, guest: guest || "Unknown", foundBy, room: room || "Lobby",
        foundDate: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        description: description || undefined, status: "Stored",
      });
      setItems((prev) => [record, ...prev]);
      setFormOpen(false);
      setItem(""); setGuest(""); setRoom(""); setDescription("");
      setToast(`"${item}" logged in lost & found.`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to save");
    }
  };

  const markReturned = (id: string) => {
    const now = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    setItems((prev) => prev.map((r) => r.id === id ? { ...r, status: "Returned" as const, returnedDate: now } : r));
    setPreview((p) => p?.id === id ? { ...p, status: "Returned", returnedDate: now } : p);
    setToast("Item marked as returned to guest.");
  };

  return (
    <ModuleShell toast={toast} setToast={setToast} eyebrow="Housekeeping"
      header={{ title: "Lost & Found", desc: "Track lost and found items for guests.", btn: "Log Item", onBtn: () => setFormOpen(true) }}
      stats={[
        { label: "Stored", value: items.filter((r) => r.status === "Stored").length, accent: "#f59e0b", icon: PackageSearch, sublabel: "In custody" },
        { label: "Returned", value: items.filter((r) => r.status === "Returned" || r.status === "Claimed").length, accent: "#10b981", icon: CheckCircle2 },
        { label: "Total Items", value: items.length, icon: Clock },
      ]}
      search={search} setSearch={setSearch} searchPh="Search item, guest, room…"
      filters={{ active: filter, onChange: setFilter, options: [{ id: "all", label: "All" }, { id: "Stored", label: "Stored" }, { id: "Returned", label: "Returned" }, { id: "Claimed", label: "Claimed" }] }}
      sort={{ value: sortBy, onChange: setSortBy, options: [{ value: "newest", label: "Newest first" }, { value: "item", label: "By item" }, { value: "guest", label: "Guest A–Z" }] }}
      resultCount={{ shown: list.length, total: items.length }}
      hasActiveAdvancedFilters={sortBy !== "newest"}
      onClearAdvancedFilters={() => setSortBy("newest")}
      selectionBar={
        <ModuleSelectionBar
          count={selectedIds.size}
          noun="item"
          onClear={() => setSelectedIds(new Set())}
          actions={[
            {
              label: "View",
              onClick: () => {
                if (firstSelected) setPreview(firstSelected);
              },
            },
            ...(firstSelected && firstSelected.status === "Stored"
              ? [{ label: "Return", onClick: () => markReturned(firstSelected.id) }]
              : []),
          ]}
        />
      }
    >
      <ClickableTable
        rows={list}
        onRowClick={setPreview}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        columns={[
          { key: "item", header: "Item", render: (r) => <p className="font-medium">{r.item}</p> },
          { key: "guest", header: "Guest", render: (r) => r.guest },
          { key: "room", header: "Room", render: (r) => r.room },
          { key: "found", header: "Found By", render: (r) => r.foundBy },
          { key: "status", header: "Status", render: (r) => <Pill className={statusColors[r.status]}>{r.status}</Pill> },
        ]}
      />
      <FormDrawer open={formOpen} onClose={() => setFormOpen(false)} title="Log Lost & Found Item" onSave={handleSave}>
        <FormField label="Item" required><TextInput value={item} onChange={(e) => setItem(e.target.value)} placeholder="Item description" /></FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Guest"><TextInput value={guest} onChange={(e) => setGuest(e.target.value)} placeholder="Guest name or Unknown" /></FormField>
          <FormField label="Room"><TextInput value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Room or Lobby" /></FormField>
        </div>
        <FormField label="Found By"><SelectInput value={foundBy} onChange={(e) => setFoundBy(e.target.value)}><option>Front Desk</option><option>Housekeeping</option><option>Restaurant</option><option>Concierge</option></SelectInput></FormField>
        <FormField label="Description"><TextAreaInput value={description} onChange={(e) => setDescription(e.target.value)} /></FormField>
      </FormDrawer>
      <PreviewDrawer open={!!preview} onClose={() => setPreview(null)} title={preview?.item ?? ""} desc={preview?.guest}
        footer={preview?.status === "Stored" && <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={() => markReturned(preview.id)}>Mark Returned</Button>}>
        {preview && <PreviewGrid icon={PackageSearch} rows={[["Guest", preview.guest], ["Room", preview.room], ["Found By", preview.foundBy], ["Found Date", preview.foundDate], ["Description", preview.description ?? "—"], ["Status", preview.status], ["Returned", preview.returnedDate ?? "—"]]} />}
      </PreviewDrawer>
    </ModuleShell>
  );
}

export function GuestFeedbackView() {
  const { items, setItems, search, setSearch, toast, setToast, formOpen, setFormOpen, preview, setPreview, filtered, loading, error } =
    useModulePage(() => feedbackService.list(), (r, q) => r.guest.toLowerCase().includes(q) || r.comments.toLowerCase().includes(q));

  const guests = useInHouseGuests();

  const [guestName, setGuestName] = useState("");
  useEffect(() => {
    if (!guestName && guests[0]) setGuestName(guests[0].guestName);
  }, [guests, guestName]);
  const [rating, setRating] = useState("8");
  const [cleanliness, setCleanliness] = useState("8");
  const [food, setFood] = useState("8");
  const [service, setService] = useState("8");
  const [comments, setComments] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const guest = guests.find((g) => g.guestName === guestName);
  const list = useMemo(() => {
    let rows = filtered.filter((r) =>
      filter === "all" || (filter === "excellent" && r.rating >= 9) || (filter === "low" && r.rating < 7));
    if (sortBy === "rating-desc") rows = [...rows].sort((a, b) => b.rating - a.rating);
    if (sortBy === "guest") rows = [...rows].sort((a, b) => a.guest.localeCompare(b.guest));
    return rows;
  }, [filtered, filter, sortBy]);

  const handleSave = async () => {
    try {
      const record = await feedbackService.create({
        guest: guestName, room: guest?.room ?? "—",
        date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        rating: parseInt(rating, 10), cleanliness: parseInt(cleanliness, 10),
        food: parseInt(food, 10), service: parseInt(service, 10),
        comments: comments || "No additional comments.",
      });
      setItems((prev) => [record, ...prev]);
      setFormOpen(false);
      setComments("");
      setToast(`Feedback recorded for ${guestName}.`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to save");
    }
  };

  const avgRating = items.length ? (items.reduce((s, r) => s + r.rating, 0) / items.length).toFixed(1) : "0";

  return (
    <ModuleShell toast={toast} setToast={setToast}
      header={{ title: "Guest Feedback", desc: "Collect and review guest satisfaction scores.", btn: "Add Feedback", onBtn: () => setFormOpen(true) }}
      stats={[
        { label: "Avg. Rating", value: `${avgRating}/10`, accent: "#15803d", icon: Star, sublabel: "Overall score" },
        { label: "Total Reviews", value: items.length, icon: MessageSquare },
        { label: "Excellent (9+)", value: items.filter((r) => r.rating >= 9).length, accent: "#10b981", icon: CheckCircle2 },
      ]}
      search={search} setSearch={setSearch} searchPh="Search guest or comments…"
      filters={{ active: filter, onChange: setFilter, options: [{ id: "all", label: "All" }, { id: "excellent", label: "Excellent" }, { id: "low", label: "Below 7" }] }}
      sort={{ value: sortBy, onChange: setSortBy, options: [{ value: "newest", label: "Newest first" }, { value: "rating-desc", label: "Highest rating" }, { value: "guest", label: "Guest A–Z" }] }}
      resultCount={{ shown: list.length, total: items.length }}
      hasActiveAdvancedFilters={sortBy !== "newest"}
      onClearAdvancedFilters={() => setSortBy("newest")}
    >
      <ClickableTable rows={list} onRowClick={setPreview}
        columns={[
          { key: "guest", header: "Guest", render: (r) => <><p className="font-medium">{r.guest}</p><p className="text-xs text-slate-400">Room {r.room}</p></> },
          { key: "rating", header: "Rating", render: (r) => <span className="font-bold text-amber-600">{r.rating}/10</span> },
          { key: "scores", header: "Scores", render: (r) => <span className="text-xs text-slate-500">C:{r.cleanliness} F:{r.food} S:{r.service}</span> },
          { key: "date", header: "Date", render: (r) => r.date },
        ]}
      />
      <FormDrawer open={formOpen} onClose={() => setFormOpen(false)} title="Record Feedback" onSave={handleSave}>
        <FormField label="Guest"><SelectInput value={guestName} onChange={(e) => setGuestName(e.target.value)}>{guests.map((g) => <option key={g.id} value={g.guestName}>{g.guestName}</option>)}</SelectInput></FormField>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[["Overall", rating, setRating], ["Clean", cleanliness, setCleanliness], ["Food", food, setFood], ["Service", service, setService]].map(([label, val, set]) => (
            <FormField key={label as string} label={label as string}><TextInput type="number" min="1" max="10" value={val as string} onChange={(e) => (set as (v: string) => void)(e.target.value)} /></FormField>
          ))}
        </div>
        <FormField label="Comments"><TextAreaInput value={comments} onChange={(e) => setComments(e.target.value)} /></FormField>
      </FormDrawer>
      <PreviewDrawer open={!!preview} onClose={() => setPreview(null)} title={preview?.guest ?? ""} desc={`Rating ${preview?.rating}/10`}>
        {preview && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn("h-5 w-5", i < Math.round(preview.rating / 2) ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
              ))}
            </div>
            <PreviewGrid icon={Star} rows={[["Room", preview.room], ["Cleanliness", `${preview.cleanliness}/10`], ["Food", `${preview.food}/10`], ["Service", `${preview.service}/10`], ["Date", preview.date]]} />
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{preview.comments}</p>
          </div>
        )}
      </PreviewDrawer>
    </ModuleShell>
  );
}

export function TaxiBookingView() {
  const { items, setItems, search, setSearch, toast, setToast, formOpen, setFormOpen, preview, setPreview, filtered, loading, error } =
    useModulePage(() => taxiBookingService.list(), (r, q) => r.guest.toLowerCase().includes(q) || r.drop.toLowerCase().includes(q));

  const guests = useInHouseGuests();

  const [guestName, setGuestName] = useState("");
  useEffect(() => {
    if (!guestName && guests[0]) setGuestName(guests[0].guestName);
  }, [guests, guestName]);
  const [drop, setDrop] = useState("Airport T1");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("08:00");
  const [fare, setFare] = useState("850");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const guest = guests.find((g) => g.guestName === guestName);
  const list = useMemo(() => {
    let rows = filtered.filter((r) => filter === "all" || r.status === filter);
    if (sortBy === "fare-desc") rows = [...rows].sort((a, b) => b.fare - a.fare);
    if (sortBy === "guest") rows = [...rows].sort((a, b) => a.guest.localeCompare(b.guest));
    return rows;
  }, [filtered, filter, sortBy]);

  const handleSave = async () => {
    try {
      const record = await taxiBookingService.create({
        guest: guestName, room: guest?.room ?? "—", pickup: "Hotel Lobby", drop, date,
        time: new Date(`2000-01-01T${time}`).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
        driver: "Unassigned", vehicle: "—", fare: parseFloat(fare) || 850, status: "Scheduled",
      });
      setItems((prev) => [record, ...prev]);
      setFormOpen(false);
      setToast(`Taxi booked for ${guestName} to ${drop}.`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to save");
    }
  };

  return (
    <ModuleShell toast={toast} setToast={setToast}
      header={{ title: "Taxi / Cab Booking", desc: "Arrange transport for in-house and departing guests.", btn: "Book Taxi", onBtn: () => setFormOpen(true) }}
      stats={[
        { label: "Scheduled", value: items.filter((r) => r.status === "Scheduled").length, accent: "#15803d", icon: Car, sublabel: "Upcoming trips" },
        { label: "Completed", value: items.filter((r) => r.status === "Completed").length, accent: "#10b981", icon: CheckCircle2 },
        { label: "Total Revenue", value: formatINR(items.filter((r) => r.status === "Completed").reduce((s, r) => s + r.fare, 0)), icon: Clock },
      ]}
      search={search} setSearch={setSearch} searchPh="Search guest or destination…"
      filters={{ active: filter, onChange: setFilter, options: [{ id: "all", label: "All" }, { id: "Scheduled", label: "Scheduled" }, { id: "Completed", label: "Completed" }] }}
      sort={{ value: sortBy, onChange: setSortBy, options: [{ value: "newest", label: "Newest first" }, { value: "fare-desc", label: "Fare: high to low" }, { value: "guest", label: "Guest A–Z" }] }}
      resultCount={{ shown: list.length, total: items.length }}
      hasActiveAdvancedFilters={sortBy !== "newest"}
      onClearAdvancedFilters={() => setSortBy("newest")}
    >
      <ClickableTable rows={list} onRowClick={setPreview}
        columns={[
          { key: "guest", header: "Guest", render: (r) => <><p className="font-medium">{r.guest}</p><p className="text-xs text-slate-400">Room {r.room}</p></> },
          { key: "route", header: "Route", render: (r) => <span className="text-sm">{r.pickup} → {r.drop}</span> },
          { key: "when", header: "When", render: (r) => <><p>{r.date}</p><p className="text-xs text-slate-400">{r.time}</p></> },
          { key: "fare", header: "Fare", render: (r) => formatINR(r.fare) },
          { key: "status", header: "Status", render: (r) => <Pill className={statusColors[r.status]}>{r.status}</Pill> },
        ]}
      />
      <FormDrawer open={formOpen} onClose={() => setFormOpen(false)} title="Book Taxi" onSave={handleSave}>
        <FormField label="Guest"><SelectInput value={guestName} onChange={(e) => setGuestName(e.target.value)}>{guests.map((g) => <option key={g.id} value={g.guestName}>{g.guestName} — Room {g.room}</option>)}</SelectInput></FormField>
        <FormField label="Destination"><TextInput value={drop} onChange={(e) => setDrop(e.target.value)} /></FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Date"><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} /></FormField>
          <FormField label="Time"><TextInput type="time" value={time} onChange={(e) => setTime(e.target.value)} /></FormField>
        </div>
        <FormField label="Estimated Fare (₹)"><TextInput type="number" value={fare} onChange={(e) => setFare(e.target.value)} /></FormField>
      </FormDrawer>
      <PreviewDrawer open={!!preview} onClose={() => setPreview(null)} title={preview?.guest ?? ""} desc={`${preview?.pickup} → ${preview?.drop}`}>
        {preview && <PreviewGrid icon={Car} rows={[["Room", preview.room], ["Date", preview.date], ["Time", preview.time], ["Driver", preview.driver], ["Vehicle", preview.vehicle], ["Fare", formatINR(preview.fare)], ["Status", preview.status]]} />}
      </PreviewDrawer>
    </ModuleShell>
  );
}

export function MessagesView() {
  const { items, setItems, search, setSearch, toast, setToast, formOpen, setFormOpen, preview, setPreview, filtered, loading, error } =
    useModulePage(() => messageService.list(), (r, q) => r.subject.toLowerCase().includes(q) || r.guest.toLowerCase().includes(q));

  const guests = useInHouseGuests();

  const [type, setType] = useState<MessageRecord["type"]>("Internal");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [guestName, setGuestName] = useState("");
  useEffect(() => {
    if (!guestName && guests[0]) setGuestName(guests[0].guestName);
  }, [guests, guestName]);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const list = useMemo(() => {
    let rows = filtered.filter((r) => filter === "all" || (filter === "unread" && !r.read) || r.type === filter);
    if (sortBy === "subject") rows = [...rows].sort((a, b) => a.subject.localeCompare(b.subject));
    if (sortBy === "guest") rows = [...rows].sort((a, b) => a.guest.localeCompare(b.guest));
    return rows;
  }, [filtered, filter, sortBy]);

  const handleSave = async () => {
    if (!subject.trim()) { setToast("Please enter a subject."); return; }
    const guest = guests.find((g) => g.guestName === guestName);
    try {
      const record = await messageService.create({
        type, subject, body: body || subject, guest: guestName,
        room: guest?.room, date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        read: false, priority: type === "Internal" ? "High" : "Normal",
      });
      setItems((prev) => [record, ...prev]);
      setFormOpen(false);
      setSubject(""); setBody("");
      setToast("Message created.");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to save");
    }
  };

  const markRead = async (id: string) => {
    try {
      await messageService.update(id, { read: true });
      setItems((prev) => prev.map((r) => r.id === id ? { ...r, read: true } : r));
      setPreview((p) => p?.id === id ? { ...p, read: true } : p);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to update");
    }
  };

  return (
    <ModuleShell toast={toast} setToast={setToast}
      header={{ title: "Messages", desc: "Internal notes and guest communication.", btn: "New Message", onBtn: () => setFormOpen(true) }}
      stats={[
        { label: "Unread", value: items.filter((r) => !r.read).length, accent: "#f59e0b", icon: Mail, sublabel: "Needs attention" },
        { label: "Guest Messages", value: items.filter((r) => r.type === "Guest").length, icon: MessageSquare },
        { label: "Total", value: items.length, icon: Clock },
      ]}
      search={search} setSearch={setSearch} searchPh="Search subject or guest…"
      filters={{ active: filter, onChange: setFilter, options: [{ id: "all", label: "All" }, { id: "unread", label: "Unread" }, { id: "Guest", label: "Guest" }, { id: "Internal", label: "Internal" }] }}
      sort={{ value: sortBy, onChange: setSortBy, options: [{ value: "newest", label: "Newest first" }, { value: "subject", label: "Subject A–Z" }, { value: "guest", label: "Guest A–Z" }] }}
      resultCount={{ shown: list.length, total: items.length }}
      hasActiveAdvancedFilters={sortBy !== "newest"}
      onClearAdvancedFilters={() => setSortBy("newest")}
    >
      <ClickableTable rows={list} onRowClick={(r) => { setPreview(r); if (!r.read) markRead(r.id); }}
        columns={[
          { key: "subject", header: "Subject", render: (r) => <><p className={cn("font-medium", !r.read && "text-slate-900")}>{r.subject}{!r.read && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />}</p><p className="text-xs text-slate-400">{r.type}</p></> },
          { key: "guest", header: "Guest", render: (r) => r.guest },
          { key: "date", header: "Date", render: (r) => r.date },
          { key: "priority", header: "Priority", render: (r) => <Pill className={r.priority === "High" ? priorityColors.High : priorityColors.Low}>{r.priority}</Pill> },
        ]}
      />
      <FormDrawer open={formOpen} onClose={() => setFormOpen(false)} title="New Message" onSave={handleSave}>
        <FormField label="Type"><SelectInput value={type} onChange={(e) => setType(e.target.value as MessageRecord["type"])}><option>Internal</option><option>Guest</option><option>System</option></SelectInput></FormField>
        <FormField label="Guest"><SelectInput value={guestName} onChange={(e) => setGuestName(e.target.value)}>{guests.map((g) => <option key={g.id} value={g.guestName}>{g.guestName}</option>)}</SelectInput></FormField>
        <FormField label="Subject" required><TextInput value={subject} onChange={(e) => setSubject(e.target.value)} /></FormField>
        <FormField label="Message"><TextAreaInput value={body} onChange={(e) => setBody(e.target.value)} /></FormField>
      </FormDrawer>
      <PreviewDrawer open={!!preview} onClose={() => setPreview(null)} title={preview?.subject ?? ""} desc={preview?.guest}>
        {preview && <><p className="mb-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">{preview.body}</p><PreviewGrid icon={MessageSquare} rows={[["Type", preview.type], ["Room", preview.room ?? "—"], ["Date", preview.date], ["Priority", preview.priority], ["Read", preview.read ? "Yes" : "No"]]} /></>}
      </PreviewDrawer>
    </ModuleShell>
  );
}

export function InvoiceHistoryView() {
  const { items, search, setSearch, toast, setToast, preview, setPreview, filtered, loading, error } =
    useModulePage(() => invoiceService.list(), (r, q) =>
      r.invoiceNo.toLowerCase().includes(q) ||
      r.guest.toLowerCase().includes(q) ||
      r.room.includes(q) ||
      r.bookingId.toLowerCase().includes(q));

  const [statusFilter, setStatusFilter] = useState("all");
  const [roomTypeFilter, setRoomTypeFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const roomTypes = useMemo(
    () => [...new Set(items.map((r) => r.roomType))].sort(),
    [items],
  );
  const paymentModes = useMemo(
    () => [...new Set(items.map((r) => r.paymentMode).filter((m) => m !== "—"))].sort(),
    [items],
  );

  const list = useMemo(() => {
    let rows = filtered.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (roomTypeFilter !== "all" && r.roomType !== roomTypeFilter) return false;
      if (paymentFilter !== "all" && r.paymentMode !== paymentFilter) return false;
      return true;
    });

    rows = [...rows].sort((a, b) => {
      if (sortBy === "newest") return parseInvoiceDate(b.date) - parseInvoiceDate(a.date);
      if (sortBy === "oldest") return parseInvoiceDate(a.date) - parseInvoiceDate(b.date);
      if (sortBy === "amount-desc") return invoiceGrandTotal(b) - invoiceGrandTotal(a);
      if (sortBy === "amount-asc") return invoiceGrandTotal(a) - invoiceGrandTotal(b);
      return 0;
    });

    return rows;
  }, [filtered, statusFilter, roomTypeFilter, paymentFilter, sortBy]);

  const allSelected = list.length > 0 && list.every((r) => selected.has(r.id));

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(list.map((r) => r.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportSelected = () => {
    const rows = list
      .filter((r) => selected.has(r.id))
      .map((r) =>
        `${r.invoiceNo},${r.guest},${r.room},${r.roomType},${invoiceGrandTotal(r)},${r.gst},${r.status},${r.date},${r.paymentMode}`,
      );
    const csv = [
      "Invoice No,Guest,Room,Room Type,Amount,GST,Status,Date,Payment Mode",
      ...rows,
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoices.csv";
    a.click();
    URL.revokeObjectURL(url);
    setToast(`${selected.size} invoice${selected.size !== 1 ? "s" : ""} exported as CSV.`);
  };

  const handleBulkDownload = () => {
    setToast(`Downloading ${selected.size} invoice PDF${selected.size !== 1 ? "s" : ""}…`);
  };

  const invoiceData = preview ? invoiceRecordToData(preview) : null;
  const outstanding = items
    .filter((r) => r.status !== "Paid")
    .reduce((s, r) => s + invoiceGrandTotal(r) - r.payment, 0);

  const hasActiveFilters =
    roomTypeFilter !== "all" ||
    paymentFilter !== "all" ||
    sortBy !== "newest";

  const clearFilters = () => {
    setRoomTypeFilter("all");
    setPaymentFilter("all");
    setSortBy("newest");
  };

  return (
    <div className="space-y-5">
      {toast && <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />}
      <FOPageHeader
        eyebrow="Front Office"
        title="Invoice History"
        description="Browse, preview, and download past tax invoices."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatMiniCard
          label="Total Invoices"
          value={items.length}
          accent="#15803d"
          icon={FileText}
          sublabel={`${items.length} tax invoices on record`}
        />
        <StatMiniCard
          label="Paid"
          value={items.filter((r) => r.status === "Paid").length}
          accent="#10b981"
          icon={CheckCircle2}
          sublabel="Fully settled"
        />
        <StatMiniCard
          label="Outstanding"
          value={formatINR(outstanding)}
          accent="#ef4444"
          icon={AlertCircle}
          sublabel={`${items.filter((r) => r.status !== "Paid").length} unpaid / partial`}
        />
      </div>

      <FOSearchToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search invoice no, guest, room, or booking…"
        filterPills={{
          active: statusFilter,
          onChange: setStatusFilter,
          options: [
            { id: "all", label: "All" },
            { id: "Paid", label: "Paid" },
            { id: "Partial", label: "Partial" },
            { id: "Pending", label: "Pending" },
          ],
        }}
        hasActiveAdvancedFilters={hasActiveFilters}
        onClearAdvancedFilters={clearFilters}
        advancedFilters={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Room Type">
              <SelectInput value={roomTypeFilter} onChange={(e) => setRoomTypeFilter(e.target.value)}>
                <option value="all">All room types</option>
                {roomTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </SelectInput>
            </FormField>
            <FormField label="Payment Mode">
              <SelectInput value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                <option value="all">All payment modes</option>
                {paymentModes.map((mode) => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </SelectInput>
            </FormField>
            <FormField label="Sort By">
              <SelectInput value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="amount-desc">Amount: high to low</option>
                <option value="amount-asc">Amount: low to high</option>
              </SelectInput>
            </FormField>
            <FormField label="Showing">
              <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
                {list.length} of {items.length} invoices
              </div>
            </FormField>
          </div>
        }
        selectionBar={
          selected.size > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3">
              <span className="text-sm font-medium text-emerald-900">
                {selected.size} invoice{selected.size !== 1 ? "s" : ""} selected
              </span>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 bg-white" onClick={handleExportSelected}>
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 bg-white" onClick={handleBulkDownload}>
                  <Download className="h-3.5 w-3.5" />
                  Download PDF
                </Button>
                <button
                  type="button"
                  className="text-xs font-medium text-emerald-700 hover:underline"
                  onClick={() => setSelected(new Set())}
                >
                  Clear selection
                </button>
              </div>
            </div>
          ) : undefined
        }
      />

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          <SelectableInvoiceTable
            rows={list}
            selected={selected}
            allSelected={allSelected}
            onToggle={toggleOne}
            onToggleAll={toggleAll}
            onRowClick={setPreview}
          />
        </div>

      <CheckoutInvoiceDrawer
        open={!!preview}
        onClose={() => setPreview(null)}
        data={invoiceData}
      />
    </div>
  );
}

function parseInvoiceDate(date: string) {
  return new Date(date).getTime();
}

function SelectableInvoiceTable({
  rows,
  selected,
  allSelected,
  onToggle,
  onToggleAll,
  onRowClick,
}: {
  rows: InvoiceRecord[];
  selected: Set<string>;
  allSelected: boolean;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onRowClick: (row: InvoiceRecord) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        No invoices match your search or filters.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex gap-3 rounded-xl border border-slate-100 p-4"
          >
            <input
              type="checkbox"
              checked={selected.has(row.id)}
              onChange={() => onToggle(row.id)}
              onClick={(e) => e.stopPropagation()}
              className="mt-1 rounded border-slate-300"
              aria-label={`Select invoice ${row.invoiceNo}`}
            />
            <div
              role="button"
              tabIndex={0}
              onClick={() => onRowClick(row)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onRowClick(row);
                }
              }}
              className="min-w-0 flex-1 cursor-pointer text-left"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-emerald-700">{row.invoiceNo}</span>
                <Pill className={statusColors[row.status]}>{row.status}</Pill>
              </div>
              <p className="mt-1 font-medium text-slate-900">{row.guest}</p>
              <p className="text-xs text-slate-400">Room {row.room} · {row.roomType}</p>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="font-medium">{formatINR(invoiceGrandTotal(row))}</span>
                <span className="text-xs text-slate-500">{row.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="pb-3 pr-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  className="rounded border-slate-300"
                  aria-label="Select all invoices"
                />
              </th>
              <th className="pb-3 pr-4">Invoice No</th>
              <th className="pb-3 pr-4">Guest</th>
              <th className="pb-3 pr-4">Amount</th>
              <th className="pb-3 pr-4">GST</th>
              <th className="pb-3 pr-4">Date</th>
              <th className="pb-3 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick(row)}
                className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-emerald-50/40"
              >
                <td className="py-3.5 pr-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() => onToggle(row.id)}
                    className="rounded border-slate-300"
                    aria-label={`Select invoice ${row.invoiceNo}`}
                  />
                </td>
                <td className="py-3.5 pr-4">
                  <span className="font-mono text-xs font-semibold text-emerald-700">{row.invoiceNo}</span>
                </td>
                <td className="py-3.5 pr-4">
                  <p className="font-medium">{row.guest}</p>
                  <p className="text-xs text-slate-400">Room {row.room} · {row.roomType}</p>
                </td>
                <td className="py-3.5 pr-4">
                  <p className="font-medium">{formatINR(invoiceGrandTotal(row))}</p>
                  {row.status === "Partial" && (
                    <p className="text-xs text-amber-600">Paid {formatINR(row.payment)}</p>
                  )}
                </td>
                <td className="py-3.5 pr-4">{formatINR(row.gst)}</td>
                <td className="py-3.5 pr-4">{row.date}</td>
                <td className="py-3.5 pr-4">
                  <Pill className={statusColors[row.status]}>{row.status}</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function invoiceGrandTotal(record: InvoiceRecord) {
  return record.subtotal + record.gst - record.discount;
}

function invoiceRecordToData(record: InvoiceRecord): InvoiceData {
  const grandTotal = invoiceGrandTotal(record);
  return {
    invoiceNo: record.invoiceNo,
    invoiceDate: record.date,
    discount: record.discount,
    paymentMode: record.paymentMode,
    folio: {
      id: record.id,
      bookingId: record.bookingId,
      guestName: record.guest,
      phone: record.phone,
      email: record.email,
      room: record.room,
      roomType: record.roomType,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      nights: record.nights,
      adults: record.adults,
      children: record.children,
      roomCharges: record.roomCharges,
      restaurantCharges: record.restaurantCharges,
      laundry: record.laundry,
      miniBar: record.miniBar,
      extraBed: record.extraBed,
      otherCharges: record.otherCharges,
      gst: record.gst,
      discount: record.discount,
      advancePaid: record.status === "Paid" ? grandTotal : record.payment,
    },
  };
}

/* ── Shared layout shells (delegates to PMS kit) ── */

function ModuleShell({
  toast, setToast, eyebrow = "Front Office", header, stats, search, setSearch, searchPh, filters,
  sort, resultCount, hasActiveAdvancedFilters, onClearAdvancedFilters,
  advancedFilters, selectionBar, children,
}: {
  toast: string | null; setToast: (v: string | null) => void;
  eyebrow?: string;
  header: { title: string; desc: string; btn?: string; onBtn?: () => void };
  stats: { label: string; value: string | number; accent?: string; icon?: LucideIcon; sublabel?: string }[];
  search: string; setSearch: (v: string) => void; searchPh: string;
  filters?: { active: string; onChange: (v: string) => void; options: { id: string; label: string }[] };
  sort?: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] };
  resultCount?: { shown: number; total: number };
  hasActiveAdvancedFilters?: boolean;
  onClearAdvancedFilters?: () => void;
  advancedFilters?: React.ReactNode;
  selectionBar?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <ModulePageShell
      toast={toast}
      onDismissToast={() => setToast(null)}
      eyebrow={eyebrow}
      title={header.title}
      description={header.desc}
      primaryAction={
        header.btn && header.onBtn
          ? { label: header.btn, onClick: header.onBtn }
          : undefined
      }
      stats={stats}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder={searchPh}
      filterPills={filters}
      sort={sort}
      resultCount={resultCount}
      hasActiveAdvancedFilters={hasActiveAdvancedFilters}
      onClearAdvancedFilters={onClearAdvancedFilters}
      advancedFilters={advancedFilters}
      selectionBar={selectionBar}
    >
      {children}
    </ModulePageShell>
  );
}

function FormDrawer({ open, onClose, title, onSave, children }: {
  open: boolean; onClose: () => void; title: string; onSave: () => void; children: React.ReactNode;
}) {
  return (
    <Drawer open={open} onClose={onClose} title={title} width="md"
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button className="bg-emerald-700 hover:bg-emerald-800" onClick={onSave}>Save</Button></>}>
      <div className="space-y-4">{children}</div>
    </Drawer>
  );
}

function PreviewDrawer({ open, onClose, title, desc, footer, children }: {
  open: boolean; onClose: () => void; title: string; desc?: string; footer?: React.ReactNode; children: React.ReactNode;
}) {
  const [fullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    if (!open) setFullScreen(false);
  }, [open]);

  return (
    <Drawer open={open} onClose={onClose} title={title} description={desc} width="md"
      fullScreen={fullScreen}
      onToggleFullScreen={() => setFullScreen((v) => !v)}
      footer={<><Button variant="outline" onClick={onClose}>Close</Button>{footer}</>}>
      {children}
    </Drawer>
  );
}

function PreviewGrid({ icon: Icon, rows }: {
  icon: React.ComponentType<{ className?: string }>;
  rows: [string, string | number][];
}) {
  return (
    <dl className="grid grid-cols-1 gap-2 text-sm">
      {rows.map(([label, value]) => (
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
  );
}
