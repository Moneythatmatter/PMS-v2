"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clock, Mail, MessageSquare } from "lucide-react";
import type { MessageRecord } from "@/app/data/frontoffice/modules";
import { messageService } from "@/services/front-office";
import { FormField, SelectInput, TextAreaInput, TextInput } from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";
import {
  ClickableTable,
  FormDrawer,
  ModuleShell,
  Pill,
  PreviewDrawer,
  PreviewGrid,
  priorityColors,
  useInHouseGuests,
  useModulePage,
} from "./common";

export function MessagesView() {
  const { items, setItems, search, setSearch, toast, setToast, formOpen, setFormOpen, preview, setPreview, filtered } =
    useModulePage(() => messageService.list(), (r, q) => r.subject.toLowerCase().includes(q) || r.guest.toLowerCase().includes(q));

  const guests = useInHouseGuests();

  const [type, setType] = useState<MessageRecord["type"]>("Internal");
  const [priority, setPriority] = useState<MessageRecord["priority"]>("Normal");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [guestName, setGuestName] = useState("");
  const [saving, setSaving] = useState(false);
  const isSavingRef = useRef(false);

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

  const handleOpenForm = () => {
    setSubject("");
    setBody("");
    setPriority("Normal");
    setType("Internal");
    if (!guestName && guests[0]) setGuestName(guests[0].guestName);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (isSavingRef.current) return;
    if (!subject.trim()) {
      setToast("Please enter a subject.");
      return;
    }
    const guest = guests.find((g) => g.guestName === guestName);

    isSavingRef.current = true;
    setSaving(true);

    try {
      const record = await messageService.create({
        type,
        subject: subject.trim(),
        body: (body || subject).trim(),
        guest: guestName,
        room: guest?.room,
        date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        read: false,
        priority,
      });
      setItems((prev) => [record, ...prev]);
      setFormOpen(false);
      setSubject("");
      setBody("");
      setPriority("Normal");
      setToast("Message created.");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to save");
    } finally {
      isSavingRef.current = false;
      setSaving(false);
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
      header={{
        title: "Messages",
        desc: "Internal notes and guest communication.",
        btn: "New Message",
        onBtn: handleOpenForm,
      }}
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
          {
            key: "priority",
            header: "Priority",
            render: (r) => (
              <Pill
                className={
                  r.priority === "High"
                    ? priorityColors.High
                    : r.priority === "Low"
                      ? priorityColors.Low
                      : "bg-slate-100 text-slate-700"
                }
              >
                {r.priority}
              </Pill>
            ),
          },
        ]}
      />
      <FormDrawer
        open={formOpen}
        onClose={() => {
          if (!saving) setFormOpen(false);
        }}
        title="New Message"
        onSave={handleSave}
        isSaving={saving}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Type">
            <SelectInput value={type} onChange={(e) => setType(e.target.value as MessageRecord["type"])}>
              <option>Internal</option>
              <option>Guest</option>
              <option>System</option>
            </SelectInput>
          </FormField>
          <FormField label="Priority">
            <SelectInput
              value={priority}
              onChange={(e) => setPriority(e.target.value as MessageRecord["priority"])}
            >
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Low">Low</option>
            </SelectInput>
          </FormField>
        </div>
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
