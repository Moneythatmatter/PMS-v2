"use client";

import { useEffect, useMemo, useState } from "react";
import { CarTaxiFront, CheckCircle2, Clock } from "lucide-react";
import { taxiBookingService } from "@/services/front-office";
import { FormField, SelectInput, TextInput, formatINR } from "@/components/frontoffice/ui";
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

export function TaxiBookingView() {
  const { items, setItems, search, setSearch, toast, setToast, formOpen, setFormOpen, preview, setPreview, filtered } =
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
        { label: "Scheduled", value: items.filter((r) => r.status === "Scheduled").length, accent: "#15803d", icon: CarTaxiFront, sublabel: "Upcoming trips" },
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
        {preview && <PreviewGrid icon={CarTaxiFront} rows={[["Room", preview.room], ["Date", preview.date], ["Time", preview.time], ["Driver", preview.driver], ["Vehicle", preview.vehicle], ["Fare", formatINR(preview.fare)], ["Status", preview.status]]} />}
      </PreviewDrawer>
    </ModuleShell>
  );
}
