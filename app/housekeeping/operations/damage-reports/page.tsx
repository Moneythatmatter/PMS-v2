"use client";

import React, { useState, useMemo } from "react";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import { AlertTriangle, Plus, CheckCircle2, Wrench, CircleDollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { TextInput, SelectInput, FormField, TextAreaInput } from "@/components/frontoffice/ui";

const DAMAGE_CATEGORIES = [
  "Furniture",
  "Electrical",
  "Plumbing",
  "AC",
  "Wall",
  "Linen",
  "Other",
];

export default function DamageReports() {
  const {
    damageReports,
    addDamageReport,
    updateDamageStatus,
  } = useHousekeeping();

  const [createOpen, setCreateOpen] = useState(false);

  // Form Fields
  const [room, setRoom] = useState("305");
  const [damageType, setDamageType] = useState(DAMAGE_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("500");

  const handleCreate = () => {
    if (!description.trim()) return;
    addDamageReport({
      room,
      damageType: damageType as any,
      description,
      estimatedCost: parseFloat(cost) || 0,
    });
    setCreateOpen(false);
    setDescription("");
  };

  const handleUpdateStatus = (id: string, status: any) => {
    updateDamageStatus(id, status);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Operations</span>
          <h1 className="mt-1 text-2xl font-bold text-slate-800">Room Damage Reports</h1>
          <p className="text-sm text-slate-500 font-normal">
            Log hotel assets damaged in guest rooms. Manage chargebacks and estimate replacement/repair costs.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Report Damage
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3">Report ID</th>
              <th className="px-5 py-3">Room</th>
              <th className="px-5 py-3">Damage Type</th>
              <th className="px-5 py-3">Description</th>
              <th className="px-5 py-3">Reported By</th>
              <th className="px-5 py-3">Date Reported</th>
              <th className="px-5 py-3">Est. Cost</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {damageReports.map((report) => {
              const isReported = report.status === "Reported";
              const isApproved = report.status === "Approved";

              return (
                <tr key={report.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-4 font-semibold text-slate-500">{report.id}</td>
                  <td className="px-5 py-4 font-bold text-slate-800">Room {report.room}</td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-semibold bg-red-50 text-red-700"
                      )}
                    >
                      {report.damageType}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-700 font-medium max-w-xs truncate">{report.description}</td>
                  <td className="px-5 py-4 text-slate-500">{report.reportedBy}</td>
                  <td className="px-5 py-4 text-slate-500">{report.reportedAt}</td>
                  <td className="px-5 py-4 font-extrabold text-slate-800">INR {report.estimatedCost}</td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase",
                        report.status === "Repaired"
                          ? "bg-emerald-50 text-emerald-700"
                          : report.status === "Approved"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-red-50 text-red-700"
                      )}
                    >
                      {report.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right space-x-1.5">
                    {isReported && (
                      <Button
                        onClick={() => handleUpdateStatus(report.id, "Approved")}
                        className="py-1 px-2 text-[10px] font-semibold bg-emerald-700 hover:bg-emerald-800 text-white"
                      >
                        Approve Charges
                      </Button>
                    )}
                    {isApproved && (
                      <Button
                        onClick={() => handleUpdateStatus(report.id, "Repaired")}
                        className="py-1 px-2 text-[10px] font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Mark Repaired
                      </Button>
                    )}
                    {report.status === "Repaired" && <span className="text-[10px] text-slate-400 font-semibold">✓ Closed</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Drawer: Add */}
      <Drawer open={createOpen} onClose={() => setCreateOpen(false)} title="Report Room Damage">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Room" required>
              <TextInput value={room} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoom(e.target.value)} />
            </FormField>
            <FormField label="Damage Category" required>
              <SelectInput value={damageType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDamageType(e.target.value)}>
                {DAMAGE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </SelectInput>
            </FormField>
          </div>

          <FormField label="Estimated Repair Cost (INR)" required>
            <TextInput type="number" min="0" value={cost} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCost(e.target.value)} />
          </FormField>

          <FormField label="Describe damage / breakage" required>
            <TextAreaInput
              placeholder="e.g. Glass table top has 3 major fractures. Needs complete safety glass replacement."
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            />
          </FormField>

          <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-xs text-red-800">
            Damaged items will alert Front Office to check guest out-of-pocket bills before processing deposit refunds.
          </div>

          <Button
            onClick={handleCreate}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            Submit Damage Report
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
