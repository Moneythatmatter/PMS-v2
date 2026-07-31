"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, Sparkles } from "lucide-react";
import type { HousekeepingRequest } from "@/app/data/frontoffice/modules";
import { housekeepingRequestService } from "@/services/front-office";
import { FormField, SelectInput, TextAreaInput } from "@/components/frontoffice/ui";
import { ModuleSelectionBar } from "@/components/pms/ModuleSelectionBar";
import {
  ClickableTable,
  FormDrawer,
  ModuleShell,
  Pill,
  PreviewDrawer,
  PreviewGrid,
  priorityColors,
  statusColors,
  useInHouseGuests,
  useModulePage,
} from "./common";

export function HousekeepingRequestsView() {
  const { items, setItems, search, setSearch, toast, setToast, formOpen, setFormOpen, preview, setPreview, filtered } =
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
