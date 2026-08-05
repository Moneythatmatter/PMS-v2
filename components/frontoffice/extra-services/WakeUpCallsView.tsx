"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCircle2, Clock } from "lucide-react";
import { wakeUpCallService } from "@/services/front-office";
import { Button } from "@/components/ui/Button";
import { FormField, SelectInput, TextAreaInput, TextInput } from "@/components/frontoffice/ui";
import { ModuleSelectionBar } from "@/components/pms/ModuleSelectionBar";
import {
  ClickableTable,
  FormDrawer,
  ModuleShell,
  Pill,
  PreviewDrawer,
  PreviewGrid,
  statusColors,
  useInHouseGuests,
  useModulePage,
} from "./common";

export function WakeUpCallsView() {
  const { items, setItems, search, setSearch, toast, setToast, formOpen, setFormOpen, preview, setPreview, filtered } =
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
