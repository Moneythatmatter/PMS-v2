"use client";

import React, { useState } from "react";
import { Camera, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { FormField, SelectInput, TextAreaInput, TextInput } from "@/components/frontoffice/ui";

interface LuggageEntryModalProps {
  open: boolean;
  onClose: () => void;
  bellboys: Array<{ id: string; name: string }>;
  bellboyWorkloads: Record<string, number>;
  recommendedBellboy: { id: string; name: string } | null;
  onSaveJob: (data: {
    guest: string;
    reservationId: string;
    room: string;
    targetRoom: string;
    bellBoy: string;
    tagNumber: string;
    bagCount: number;
    type: "Check-in" | "Check-out" | "Storage" | "Room Move";
    remarks: string;
    bagType: "Suitcase" | "Duffel" | "Backpack" | "Box" | "Garment Bag" | "Golf Club";
    lockerCoordinate: string;
    longTermStorage: boolean;
    vipHandling: boolean;
    preInspection: {
      scratches: boolean;
      zippers: boolean;
      handles: boolean;
      fragileTag: boolean;
    };
  }) => void;
}

export function LuggageEntryModal({
  open,
  onClose,
  bellboys,
  bellboyWorkloads,
  recommendedBellboy,
  onSaveJob,
}: LuggageEntryModalProps) {
  const [guest, setGuest] = useState("Sarah Chen");
  const [reservationId, setReservationId] = useState("RES-2026-9812");
  const [room, setRoom] = useState("305");
  const [targetRoom, setTargetRoom] = useState("");
  const [bellBoy, setBellBoy] = useState("");
  const [tagNumber, setTagNumber] = useState("TAG-");
  const [bagCount, setBagCount] = useState("2");
  const [type, setType] = useState<"Check-in" | "Check-out" | "Storage" | "Room Move">("Check-in");
  const [remarks, setRemarks] = useState("");

  const [bagType, setBagType] = useState<"Suitcase" | "Duffel" | "Backpack" | "Box" | "Garment Bag" | "Golf Club">("Suitcase");
  const [lockerCoordinate, setLockerCoordinate] = useState("Shelf A-1");
  const [longTermStorage, setLongTermStorage] = useState(false);
  const [vipHandling, setVipHandling] = useState(false);

  const [scratches, setScratches] = useState(false);
  const [zippers, setZippers] = useState(false);
  const [handles, setHandles] = useState(false);
  const [fragileTag, setFragileTag] = useState(false);

  React.useEffect(() => {
    if (open) {
      setBellBoy(recommendedBellboy?.name || bellboys[0]?.name || "");
      setTagNumber(`TAG-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }, [open, recommendedBellboy, bellboys]);

  const handleCreate = () => {
    const bags = parseInt(bagCount, 10) || 1;
    onSaveJob({
      guest,
      reservationId,
      room,
      targetRoom,
      bellBoy,
      tagNumber,
      bagCount: bags,
      type,
      remarks,
      bagType,
      lockerCoordinate,
      longTermStorage,
      vipHandling,
      preInspection: { scratches, zippers, handles, fragileTag },
    });

    setRemarks("");
    setTargetRoom("");
    setScratches(false);
    setZippers(false);
    setHandles(false);
    setFragileTag(false);
    setVipHandling(false);
  };

  return (
    <Drawer open={open} onClose={onClose} title="Tag Guest Baggage">
      <div className="space-y-4 select-none">
        <FormField label="Movement / Storage Type" required>
          <SelectInput value={type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value as any)}>
            <option value="Check-in">Check-in (Lobby ➔ Guest Room)</option>
            <option value="Check-out">Check-out (Guest Room ➔ Lobby)</option>
            <option value="Storage">Locker Storage Room Hold</option>
            <option value="Room Move">Room Move (Transfer bags between rooms)</option>
          </SelectInput>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Guest Name" required>
            <TextInput value={guest} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGuest(e.target.value)} />
          </FormField>
          <FormField label="Reservation ID" required>
            <TextInput value={reservationId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReservationId(e.target.value)} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {type === "Room Move" ? (
            <FormField label="Source Room" required>
              <TextInput value={room} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoom(e.target.value)} />
            </FormField>
          ) : (
            <FormField label="Room Number" required>
              <TextInput value={room} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoom(e.target.value)} />
            </FormField>
          )}

          {type === "Room Move" ? (
            <FormField label="Target Destination Room" required>
              <TextInput
                placeholder="e.g. 204"
                value={targetRoom}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetRoom(e.target.value)}
              />
            </FormField>
          ) : (
            <FormField label="VIP Handling holding" required>
              <SelectInput value={vipHandling ? "Yes" : "No"} onChange={(e) => setVipHandling(e.target.value === "Yes")}>
                <option value="No">No (Standard priority)</option>
                <option value="Yes">Yes (VIP priority SLA hold)</option>
              </SelectInput>
            </FormField>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Tag ID Number" required>
            <TextInput value={tagNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagNumber(e.target.value)} />
          </FormField>
          <FormField label="Total Baggage Count" required>
            <TextInput type="number" min="1" value={bagCount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBagCount(e.target.value)} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Baggage Type" required>
            <SelectInput value={bagType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBagType(e.target.value as any)}>
              <option value="Suitcase">Suitcases</option>
              <option value="Duffel">Duffel Bags</option>
              <option value="Backpack">Backpacks</option>
              <option value="Box">Boxes / Cartons</option>
              <option value="Garment Bag">Garment Bags</option>
              <option value="Golf Club">Golf Club Bags</option>
            </SelectInput>
          </FormField>
          <FormField label="Locker Storage Shelf">
            <SelectInput
              disabled={type === "Check-in"}
              value={lockerCoordinate}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLockerCoordinate(e.target.value)}
            >
              <option value="Shelf A-1">Locker Shelf A-1</option>
              <option value="Shelf A-2">Locker Shelf A-2</option>
              <option value="Shelf B-1">Locker Shelf B-1</option>
              <option value="Shelf B-2">Locker Shelf B-2</option>
              <option value="Cage C">Locker Cage C (Large Items)</option>
            </SelectInput>
          </FormField>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2.5">
          <p className="font-bold text-slate-800 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="h-4 w-4 text-emerald-700" /> Pre-Intake Baggage Inspection Check
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-800 select-none">
              <input type="checkbox" checked={scratches} onChange={(e) => setScratches(e.target.checked)} className="rounded border-slate-300 text-emerald-700" />
              Scratches / Dents
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-800 select-none">
              <input type="checkbox" checked={zippers} onChange={(e) => setZippers(e.target.checked)} className="rounded border-slate-300 text-emerald-700" />
              Broken Zippers
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-800 select-none">
              <input type="checkbox" checked={handles} onChange={(e) => setHandles(e.target.checked)} className="rounded border-slate-300 text-emerald-700" />
              Loose/Damaged Handles
            </label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-slate-800 select-none">
              <input type="checkbox" checked={fragileTag} onChange={(e) => setFragileTag(e.target.checked)} className="rounded border-slate-300 text-emerald-700" />
              Fragile Tag Checked
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-3">
          <FormField label="Bell Boy Assignee" required>
            <SelectInput value={bellBoy} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBellBoy(e.target.value)}>
              {bellboys.map((boy) => (
                <option key={boy.id} value={boy.name}>
                  {boy.name} (Workload: {bellboyWorkloads[boy.name] ?? 0} active runs)
                </option>
              ))}
            </SelectInput>
          </FormField>

          {recommendedBellboy && (
            <div className="flex items-start gap-2 text-[10px] text-emerald-755 font-semibold bg-emerald-50/20 border border-emerald-100 p-2.5 rounded-xl">
              <ShieldCheck className="h-4 w-4 text-emerald-700 shrink-0" />
              <div>
                Recommended: <strong className="text-emerald-800">{recommendedBellboy.name}</strong> has the lowest active workloads ({bellboyWorkloads[recommendedBellboy.name] ?? 0} runs).
              </div>
            </div>
          )}
        </div>

        {type !== "Check-in" && (
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
            <input type="checkbox" checked={longTermStorage} onChange={(e) => setLongTermStorage(e.target.checked)} className="rounded border-slate-300 text-emerald-700" />
            Flag as Long-Term Holding Baggage
          </label>
        )}

        <FormField label="Remarks / Special Handling">
          <TextAreaInput
            placeholder="e.g. Keep upright, box has fragile glass ornaments, check tag match."
            value={remarks}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemarks(e.target.value)}
          />
        </FormField>

        <Button
          onClick={handleCreate}
          className="w-full !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white font-bold py-2.5 rounded-xl transition-all shadow-sm"
        >
          Create Luggage Job
        </Button>
      </div>
    </Drawer>
  );
}
