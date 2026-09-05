"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function WakeUpCallsView() {
  const { items, setItems, search, setSearch, toast, setToast, formOpen, setFormOpen, preview, setPreview, filtered } =
    useModulePage(() => wakeUpCallService.list(), (r, q) =>
      r.guest.toLowerCase().includes(q) || r.room.includes(q) || r.date.toLowerCase().includes(q));
  const guests = useInHouseGuests();

  const todayStr = getTodayString();
  const [guestName, setGuestName] = useState("");
  useEffect(() => {
    if (!guestName && guests[0]) setGuestName(guests[0].guestName);
  }, [guests, guestName]);
  const [date, setDate] = useState(() => getTodayString());
  const [time, setTime] = useState("06:00");
  const [notes, setNotes] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const isSavingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

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
    if (isSavingRef.current) return;

    if (!guestName) {
      setToast("Please select a guest.");
      return;
    }
    const today = getTodayString();
    if (!date || date < today) {
      setToast("Date cannot be in the past. Please select today or a future date.");
      return;
    }
    const now = new Date();
    const currentHHMM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    if (date === today && time <= currentHHMM) {
      setToast("For today's date, please select a time in the future.");
      return;
    }

    const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const formattedTime = new Date(`2000-01-01T${time}`).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const roomNo = guest?.room ?? "—";

    // Duplicate prevention
    const isDuplicate = items.some((item) => {
      const sameDate = item.date.trim().toLowerCase() === formattedDate.trim().toLowerCase();
      const sameTime = item.time.trim().toLowerCase() === formattedTime.trim().toLowerCase();
      const sameRoom = roomNo !== "—" && item.room.trim().toLowerCase() === roomNo.trim().toLowerCase();
      const sameGuest = item.guest.trim().toLowerCase() === guestName.trim().toLowerCase();
      return sameDate && sameTime && (sameRoom || sameGuest);
    });

    if (isDuplicate) {
      setToast(`A wake-up call is already scheduled for ${guestName} (Room ${roomNo}) on ${formattedDate} at ${formattedTime}.`);
      return;
    }

    try {
      isSavingRef.current = true;
      setIsSaving(true);
      const record = await wakeUpCallService.create({
        guest: guestName,
        room: roomNo,
        date: formattedDate,
        time: formattedTime,
        notes: notes || undefined,
        completed: false,
      });
      setItems((prev) => {
        if (prev.some((r) => r.id === record.id)) return prev;
        return [record, ...prev];
      });
      setFormOpen(false);
      setToast(`Wake-up call scheduled for ${guestName} at ${record.time}.`);
      setNotes("");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to save");
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
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

  const handleDelete = async (idsToDelete: string[]) => {
    try {
      await Promise.all(idsToDelete.map((id) => wakeUpCallService.remove(id)));
      setItems((prev) => prev.filter((r) => !idsToDelete.includes(r.id)));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        idsToDelete.forEach((id) => next.delete(id));
        return next;
      });
      if (preview && idsToDelete.includes(preview.id)) {
        setPreview(null);
      }
      setToast(`Deleted ${idsToDelete.length} wake-up call(s).`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  return (
    <ModuleShell toast={toast} setToast={setToast}
      header={{
        title: "Wake-up Calls",
        desc: "Schedule and track guest wake-up calls.",
        btn: "Schedule Call",
        onBtn: () => {
          const today = getTodayString();
          if (!date || date < today) {
            setDate(today);
          }
          setFormOpen(true);
        },
      }}
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
            {
              label: "Delete",
              onClick: () => handleDelete(Array.from(selectedIds)),
            },
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
      <FormDrawer open={formOpen} onClose={() => setFormOpen(false)} title="Schedule Wake-up Call" onSave={handleSave} isSaving={isSaving}>
        <FormField label="Guest"><SelectInput value={guestName} onChange={(e) => setGuestName(e.target.value)}>{guests.map((g) => <option key={g.id} value={g.guestName}>{g.guestName} — Room {g.room}</option>)}</SelectInput></FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Date"><TextInput type="date" min={todayStr} value={date} onChange={(e) => setDate(e.target.value)} /></FormField>
          <FormField label="Time"><TextInput type="time" value={time} onChange={(e) => setTime(e.target.value)} /></FormField>
        </div>
        <FormField label="Notes"><TextAreaInput value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Special instructions…" /></FormField>
      </FormDrawer>
      <PreviewDrawer open={!!preview} onClose={() => setPreview(null)} title={preview?.guest ?? ""} desc={`Room ${preview?.room} · ${preview?.time}`}
        footer={
          preview && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                onClick={() => handleDelete([preview.id])}
              >
                Delete
              </Button>
              {!preview.completed && (
                <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={() => markDone(preview.id)}>
                  Mark Done
                </Button>
              )}
            </div>
          )
        }>
        {preview && <PreviewGrid icon={Bell} rows={[["Date", preview.date], ["Time", preview.time], ["Notes", preview.notes ?? "—"], ["Status", preview.completed ? "Completed" : "Pending"]]} />}
      </PreviewDrawer>
    </ModuleShell>
  );
}
