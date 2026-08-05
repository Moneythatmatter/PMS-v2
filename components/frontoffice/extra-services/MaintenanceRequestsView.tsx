"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Clock, Wrench } from "lucide-react";
import type { MaintenanceRequest } from "@/app/data/frontoffice/modules";
import { maintenanceRequestService } from "@/services/front-office";
import { FormField, SelectInput, TextAreaInput, TextInput } from "@/components/frontoffice/ui";
import {
  ClickableTable,
  FormDrawer,
  ModuleShell,
  Pill,
  PreviewDrawer,
  PreviewGrid,
  priorityColors,
  statusColors,
  useModulePage,
} from "./common";

export function MaintenanceRequestsView() {
  const { items, setItems, search, setSearch, toast, setToast, formOpen, setFormOpen, preview, setPreview, filtered } =
    useModulePage(() => maintenanceRequestService.list(), (r, q) => r.room.includes(q) || r.problem.toLowerCase().includes(q));

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
