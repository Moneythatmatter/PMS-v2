"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock, PackageSearch } from "lucide-react";
import { lostFoundService } from "@/services/front-office";
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
  useModulePage,
} from "./common";

export function LostFoundView() {
  const { items, setItems, search, setSearch, toast, setToast, formOpen, setFormOpen, preview, setPreview, filtered } =
    useModulePage(() => lostFoundService.list(), (r, q) => r.item.toLowerCase().includes(q) || r.guest.toLowerCase().includes(q) || r.room.includes(q));

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
