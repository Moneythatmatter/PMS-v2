"use client";

import React, { useState, useMemo } from "react";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import { PackageSearch, Clock, CheckCircle2, Plus, User, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { TextInput, SelectInput, FormField, TextAreaInput } from "@/components/frontoffice/ui";

export function LostFoundView() {
  const {
    lostFound,
    addLostFoundItem,
    returnLostFound,
  } = useHousekeeping();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Form Fields: Create
  const [item, setItem] = useState("");
  const [guest, setGuest] = useState("");
  const [room, setRoom] = useState("");
  const [foundBy, setFoundBy] = useState("Housekeeping");
  const [description, setDescription] = useState("");

  // Form Fields: Return
  const [claimantName, setClaimantName] = useState("");

  const filteredItems = useMemo(() => {
    return lostFound.filter((item) => {
      const matchSearch =
        item.item.toLowerCase().includes(search.toLowerCase()) ||
        item.guest.toLowerCase().includes(search.toLowerCase()) ||
        item.room.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || item.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [lostFound, search, filterStatus]);

  const handleCreate = () => {
    if (!item.trim()) return;
    addLostFoundItem({
      item,
      guest: guest || "Unknown",
      foundBy,
      room: room || "Lobby",
      description,
    });
    setCreateOpen(false);
    setItem("");
    setGuest("");
    setRoom("");
    setDescription("");
  };

  const handleOpenReturn = (id: string) => {
    const r = lostFound.find((lf) => lf.id === id);
    setSelectedItemId(id);
    setClaimantName(r?.guest && r.guest !== "Unknown" ? r.guest : "");
    setReturnOpen(true);
  };

  const handleSaveReturn = () => {
    if (!selectedItemId) return;
    returnLostFound(selectedItemId, claimantName);
    setReturnOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Operations</span>
          <h1 className="mt-1 text-2xl font-bold text-slate-800">Lost & Found Inventory</h1>
          <p className="text-sm text-slate-500 font-normal">
            Catalog guest items found in the hotel. Track storage locations, claim tickets, and returns.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Log Found Item
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <TextInput
            placeholder="Search item, room, guest claimant…"
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
            <option value="all">All Items</option>
            <option value="Stored">Stored (In Locker)</option>
            <option value="Returned">Returned</option>
            <option value="Claimed">Claimed</option>
          </SelectInput>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3">ID</th>
              <th className="px-5 py-3">Item Name</th>
              <th className="px-5 py-3">Room Found</th>
              <th className="px-5 py-3">Found By</th>
              <th className="px-5 py-3">Date Found</th>
              <th className="px-5 py-3">Guest Claimant</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Return Date</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.map((lf) => {
              const isStored = lf.status === "Stored";
              return (
                <tr key={lf.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-4 font-semibold text-slate-500">{lf.id}</td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-800">{lf.item}</p>
                    {lf.description && <p className="text-[10px] text-slate-400 truncate max-w-xs">{lf.description}</p>}
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-600">Room {lf.room}</td>
                  <td className="px-5 py-4 text-slate-500 font-medium">{lf.foundBy}</td>
                  <td className="px-5 py-4 text-slate-500">{lf.foundDate}</td>
                  <td className="px-5 py-4 text-slate-700 font-medium">{lf.guest}</td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase",
                        lf.status === "Returned" || lf.status === "Claimed"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700 animate-pulse"
                      )}
                    >
                      {lf.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-400">{lf.returnedDate || "—"}</td>
                  <td className="px-5 py-4 text-right">
                    {isStored ? (
                      <Button
                        onClick={() => handleOpenReturn(lf.id)}
                        className="py-1 px-2.5 text-[10px] font-semibold bg-emerald-700 hover:bg-emerald-800 text-white"
                      >
                        Return Item
                      </Button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold">✓ Handed Over</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Drawer: Create */}
      <Drawer open={createOpen} onClose={() => setCreateOpen(false)} title="Log Lost & Found Item">
        <div className="space-y-4">
          <FormField label="Item Name" required>
            <TextInput
              placeholder="e.g. Ray-Ban Aviator Sunglasses"
              value={item}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setItem(e.target.value)}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Room Found" required>
              <TextInput placeholder="e.g. 102 (or Lobby)" value={room} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoom(e.target.value)} />
            </FormField>
            <FormField label="Guest Name (If known)">
              <TextInput placeholder="e.g. James Wilson" value={guest} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGuest(e.target.value)} />
            </FormField>
          </div>

          <FormField label="Found By">
            <SelectInput value={foundBy} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFoundBy(e.target.value)}>
              <option value="Housekeeping">Housekeeping Staff</option>
              <option value="Front Office">Front Office desk</option>
              <option value="Restaurant">F&B Waiter</option>
              <option value="Concierge">Concierge desk</option>
            </SelectInput>
          </FormField>

          <FormField label="Description / Storage Location">
            <TextAreaInput
              placeholder="e.g. Gold frame sunglasses, found under room bed. Stored in Lobby locker #B4."
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            />
          </FormField>

          <Button
            onClick={handleCreate}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            Register Item
          </Button>
        </div>
      </Drawer>

      {/* Drawer: Return */}
      <Drawer open={returnOpen} onClose={() => setReturnOpen(false)} title="Handover / Return Item">
        <div className="space-y-4">
          <FormField label="Claimant Guest Name" required>
            <TextInput
              placeholder="Enter claimant printed name"
              value={claimantName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClaimantName(e.target.value)}
            />
          </FormField>

          <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-800">
            Verify identity documents before handing over the item. Log the signature in history.
          </div>

          <Button
            onClick={handleSaveReturn}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            Confirm Return
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
