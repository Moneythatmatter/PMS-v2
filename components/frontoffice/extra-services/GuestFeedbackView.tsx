"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, MessageSquare, Star } from "lucide-react";
import { feedbackService } from "@/services/front-office";
import { FormField, SelectInput, TextAreaInput, TextInput } from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";
import {
  ClickableTable,
  FormDrawer,
  ModuleShell,
  PreviewDrawer,
  PreviewGrid,
  useInHouseGuests,
  useModulePage,
} from "./common";

export function GuestFeedbackView() {
  const { items, setItems, search, setSearch, toast, setToast, formOpen, setFormOpen, preview, setPreview, filtered } =
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
