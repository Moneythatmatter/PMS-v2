"use client";

import React, { useState, useMemo } from "react";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import { Luggage, Clock, CheckCircle2, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { TextInput, SelectInput, FormField, TextAreaInput } from "@/components/frontoffice/ui";

export function LuggageView() {
  const {
    luggageJobs,
    staff,
    addLuggageJob,
    deliverLuggage,
  } = useHousekeeping();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);

  // Form Fields
  const [guest, setGuest] = useState("Sarah Chen");
  const [room, setRoom] = useState("305");
  const [bellBoy, setBellBoy] = useState("");
  const [tagNumber, setTagNumber] = useState("TAG-");
  const [bagCount, setBagCount] = useState("2");
  const [type, setType] = useState<"Check-in" | "Check-out" | "Storage">("Check-in");
  const [remarks, setRemarks] = useState("");

  const filteredLuggage = useMemo(() => {
    return luggageJobs.filter((job) => {
      const matchSearch =
        job.guest.toLowerCase().includes(search.toLowerCase()) ||
        job.room.includes(search) ||
        job.tagNumber.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || job.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [luggageJobs, search, filterStatus]);

  const bellboys = useMemo(() => {
    return staff.filter((s) => s.role === "Bell Boy");
  }, [staff]);

  const handleOpenCreate = () => {
    setBellBoy(bellboys[0]?.name ?? "");
    setTagNumber(`TAG-${Math.floor(1000 + Math.random() * 9000)}`);
    setCreateOpen(true);
  };

  const handleCreate = () => {
    const bags = parseInt(bagCount, 10) || 1;
    addLuggageJob({
      guest,
      room,
      bellBoy,
      tagNumber,
      bagCount: bags,
      type,
      remarks,
    });
    setCreateOpen(false);
    setRemarks("");
  };

  const handleDeliver = (id: string) => {
    deliverLuggage(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Operations</span>
          <h1 className="mt-1 text-2xl font-bold text-slate-800">Luggage Movement log</h1>
          <p className="text-sm text-slate-500 font-normal">
            Monitor luggage tag check-ins, storage room logs, and bellboy delivery schedules.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Tag Baggage
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <TextInput
            placeholder="Search guest, room number, or tag ID…"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-full pl-3"
          />
        </div>
        <div className="flex gap-3">
          <SelectInput
            value={filterStatus}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Baggages</option>
            <option value="Pending">Awaiting Delivery</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Stored">Locker Stored</option>
          </SelectInput>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3">Tag ID</th>
              <th className="px-5 py-3">Guest / Room</th>
              <th className="px-5 py-3">Luggage Type</th>
              <th className="px-5 py-3">Bag Count</th>
              <th className="px-5 py-3">Assigned Bellboy</th>
              <th className="px-5 py-3">Pickup Time</th>
              <th className="px-5 py-3">Delivery Time</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLuggage.map((job) => {
              const isPending = job.status === "Pending" || job.status === "Stored";
              return (
                <tr key={job.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-4 font-bold text-emerald-800">{job.tagNumber}</td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-800">{job.guest}</p>
                    <p className="text-[10px] text-slate-500 font-medium">Room {job.room}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                        job.type === "Storage"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-blue-50 text-blue-700"
                      )}
                    >
                      {job.type}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600 font-semibold">{job.bagCount} Bags</td>
                  <td className="px-5 py-4 text-slate-600 font-semibold">{job.bellBoy}</td>
                  <td className="px-5 py-4 text-slate-500">{job.pickupTime}</td>
                  <td className="px-5 py-4 text-slate-500">{job.deliveryTime || "—"}</td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase",
                        job.status === "Delivered"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      )}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {isPending ? (
                      <Button
                        onClick={() => handleDeliver(job.id)}
                        className="py-1 px-2.5 text-[10px] font-semibold bg-emerald-700 hover:bg-emerald-800 text-white"
                      >
                        Deliver
                      </Button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold">✓ Complete</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Drawer: Tag Baggage */}
      <Drawer open={createOpen} onClose={() => setCreateOpen(false)} title="Tag Guest Baggage">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Guest Name" required>
              <TextInput value={guest} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGuest(e.target.value)} />
            </FormField>
            <FormField label="Room" required>
              <TextInput value={room} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoom(e.target.value)} />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Tag Number" required>
              <TextInput value={tagNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagNumber(e.target.value)} />
            </FormField>
            <FormField label="Bag Count" required>
              <TextInput type="number" min="1" value={bagCount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBagCount(e.target.value)} />
            </FormField>
          </div>

          <FormField label="Movement Type" required>
            <SelectInput value={type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value as any)}>
              <option value="Check-in">Check-in (Deliver to Room)</option>
              <option value="Check-out">Check-out (Deliver to Lobby)</option>
              <option value="Storage">Locker Room Storage</option>
            </SelectInput>
          </FormField>

          <FormField label="Bell Boy Assignee">
            <SelectInput value={bellBoy} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBellBoy(e.target.value)}>
              {bellboys.map((boy) => (
                <option key={boy.id} value={boy.name}>
                  {boy.name}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Remarks / Locker details">
            <TextAreaInput
              placeholder="e.g. Locker room shelf B-4. Fragile tags attached."
              value={remarks}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemarks(e.target.value)}
            />
          </FormField>

          <Button
            onClick={handleCreate}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            Create Luggage Job
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
