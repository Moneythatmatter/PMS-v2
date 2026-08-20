"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import {
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle2,
  Receipt,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { TextInput, SelectInput, FormField, TextAreaInput } from "@/components/frontoffice/ui";
import { OperationsToolbar, OperationsFilterDrawer } from "@/components/housekeeping/OperationsToolbar";
import { formatInr } from "@/components/housekeeping/damageReportUtils";
import type { HKDamageReport } from "@/components/housekeeping/HousekeepingTypes";

const CLOSED_STATUSES = new Set(["Closed", "Repaired", "Recovered", "Cancelled"]);

const statusBadges: Record<string, string> = {
  Reported: "bg-slate-100 text-slate-700 border-slate-200",
  "Under Review": "bg-blue-50 text-blue-700 border-blue-200 font-bold",
  "Pending Finance": "bg-orange-50 text-orange-700 border-orange-200 font-bold",
  "Pending Engineering": "bg-purple-50 text-purple-700 border-purple-200 font-bold",
  "Insurance Claim": "bg-indigo-50 text-indigo-700 border-indigo-200 font-extrabold",
  Repaired: "bg-blue-50 text-blue-800 border-blue-200 font-bold",
  Recovered: "bg-green-50 text-green-900 border-green-200 font-extrabold",
  Closed: "bg-slate-100 text-slate-600 border-slate-200 font-bold",
  Cancelled: "bg-red-50 text-red-700 border-red-200 line-through",
};

const severityBadges: Record<string, string> = {
  Critical: "bg-red-50 text-red-700 border-red-200 font-extrabold",
  Major: "bg-orange-50 text-orange-700 border-orange-200 font-bold",
  Moderate: "bg-amber-50 text-amber-700 border-amber-200 font-bold",
  Minor: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function DamageReportsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const {
    damageReports,
    addDamageReport,
    updateDamageStatus,
    apiConnected,
    currentUsername,
  } = useHousekeeping();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [respFilter, setRespFilter] = useState("All");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<HKDamageReport | null>(null);

  const [room, setRoom] = useState("");
  const [damageType, setDamageType] = useState("Furniture");
  const [severity, setSeverity] = useState("Moderate");
  const [responsibility, setResponsibility] = useState("Guest");
  const [description, setDescription] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [assetId, setAssetId] = useState("");
  const [guest, setGuest] = useState("");
  const [notes, setNotes] = useState("");
  const [resolveCost, setResolveCost] = useState("");

  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (typeFilter !== "All") count++;
    if (severityFilter !== "All") count++;
    if (statusFilter !== "All") count++;
    if (respFilter !== "All") count++;
    return count;
  }, [typeFilter, severityFilter, statusFilter, respFilter]);

  const openReports = useMemo(
    () => damageReports.filter((r) => !CLOSED_STATUSES.has(r.status)),
    [damageReports],
  );

  const filteredReports = useMemo(() => {
    return damageReports.filter((rep) => {
      const q = search.toLowerCase();
      const matchSearch =
        rep.description.toLowerCase().includes(q) ||
        rep.id.toLowerCase().includes(q) ||
        rep.room.toLowerCase().includes(q) ||
        (rep.assetId ?? "").toLowerCase().includes(q);
      const matchType = typeFilter === "All" || rep.damageType === typeFilter;
      const matchSev = severityFilter === "All" || rep.severity === severityFilter;
      const matchStatus = statusFilter === "All" || rep.status === statusFilter;
      const matchResp = respFilter === "All" || rep.responsibility === respFilter;
      return matchSearch && matchType && matchSev && matchStatus && matchResp;
    });
  }, [damageReports, search, typeFilter, severityFilter, statusFilter, respFilter]);

  const handleCreateSubmit = () => {
    if (!description.trim() || !room.trim()) {
      setToast({ message: "Room and description are required.", variant: "error" });
      return;
    }
    addDamageReport({
      room: room.trim(),
      damageType,
      severity,
      responsibility,
      description: description.trim(),
      estimatedCost: Number(estimatedCost.replace(/[^\d.-]/g, "")) || 0,
      assetId: assetId.trim() || undefined,
      guest: guest.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setCreateDrawerOpen(false);
    setRoom("");
    setDescription("");
    setEstimatedCost("");
    setAssetId("");
    setGuest("");
    setNotes("");
    setToast({ message: `Damage report registered for Room ${room}.`, variant: "success" });
  };

  const handleResolve = () => {
    if (!selectedReport) return;
    const cost =
      Number(resolveCost.replace(/[^\d.-]/g, "")) || selectedReport.estimatedCost;
    updateDamageStatus(selectedReport.id, "Closed", cost);
    setSelectedReport(null);
    setResolveCost("");
    setToast({ message: "Damage report closed.", variant: "success" });
  };

  if (!isMounted) {
    return (
      <div className="space-y-4 select-none">
        <div className="border-b border-slate-100 pb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Operations</span>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Damage Reports</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 select-none">
      <div className="flex flex-col gap-2 pb-1 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Operations</span>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Damage Reports</h1>
          {!apiConnected && (
            <p className="text-[10px] text-amber-700 font-semibold mt-0.5">API offline — changes may not persist</p>
          )}
        </div>
        <Button
          onClick={() => setCreateDrawerOpen(true)}
          className="!bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white flex items-center gap-1.5 rounded-xl h-8 px-3.5 text-xs font-bold shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" /> Register Damage
        </Button>
      </div>

      {toast && (
        <div
          className={cn(
            "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl p-3 text-xs font-bold shadow-xl",
            toast.variant === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white",
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Open</p>
            <h3 className="text-lg font-extrabold text-slate-800">{openReports.length}</h3>
          </div>
          <AlertTriangle className="h-4 w-4 text-orange-600" />
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Finance</p>
            <h3 className="text-lg font-extrabold text-orange-700">
              {damageReports.filter((r) => r.status === "Pending Finance").length}
            </h3>
          </div>
          <Receipt className="h-4 w-4 text-orange-600" />
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Eng.</p>
            <h3 className="text-lg font-extrabold text-purple-700">
              {damageReports.filter((r) => r.status === "Pending Engineering").length}
            </h3>
          </div>
          <Wrench className="h-4 w-4 text-purple-600" />
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</p>
            <h3 className="text-lg font-extrabold text-emerald-800">{damageReports.length}</h3>
          </div>
          <Clock className="h-4 w-4 text-emerald-700" />
        </div>
      </div>

      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search report ID, room, asset, or description…"
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setFilterDrawerOpen(true)}
      />

      <OperationsFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filter Damage Reports"
        activeFilterCount={activeFilterCount}
        onReset={() => {
          setTypeFilter("All");
          setSeverityFilter("All");
          setRespFilter("All");
          setStatusFilter("All");
        }}
      >
        <div className="space-y-4">
          <FormField label="Damage Type">
            <SelectInput value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-9 text-xs rounded-xl">
              <option value="All">All Types</option>
              {["Electrical", "Plumbing", "AC / HVAC", "Furniture", "Wall", "Linen", "Glass", "Flooring", "Equipment", "Electronics", "Other"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Severity">
            <SelectInput value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="h-9 text-xs rounded-xl">
              <option value="All">All</option>
              {["Critical", "Major", "Moderate", "Minor"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Responsibility">
            <SelectInput value={respFilter} onChange={(e) => setRespFilter(e.target.value)} className="h-9 text-xs rounded-xl">
              <option value="All">All</option>
              {["Guest", "Hotel", "Natural Wear", "Vendor", "Split Recovery"].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Status">
            <SelectInput value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 text-xs rounded-xl">
              <option value="All">All</option>
              {["Reported", "Under Review", "Pending Finance", "Pending Engineering", "Insurance Claim", "Repaired", "Recovered", "Closed", "Cancelled"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </SelectInput>
          </FormField>
        </div>
      </OperationsFilterDrawer>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              <th className="px-3 py-2.5">Report ID</th>
              <th className="px-3 py-2.5">Room</th>
              <th className="px-3 py-2.5">Type</th>
              <th className="px-3 py-2.5">Severity</th>
              <th className="px-3 py-2.5">Responsibility</th>
              <th className="px-3 py-2.5">Description</th>
              <th className="px-3 py-2.5 text-right">Est. Cost</th>
              <th className="px-3 py-2.5 text-center">Status</th>
              <th className="px-3 py-2.5">Reported By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-slate-400 font-medium">
                  No damage reports yet. Register one to get started.
                </td>
              </tr>
            ) : (
              filteredReports.map((rep) => (
                <tr
                  key={rep.id}
                  onClick={() => setSelectedReport(rep)}
                  className="hover:bg-slate-50/50 cursor-pointer"
                >
                  <td className="px-3 py-2.5 font-extrabold text-emerald-800">{rep.id}</td>
                  <td className="px-3 py-2.5">{rep.room}</td>
                  <td className="px-3 py-2.5">{rep.damageType}</td>
                  <td className="px-3 py-2.5">
                    <span className={cn("rounded px-1.5 py-0.5 text-[8.5px] border uppercase", severityBadges[rep.severity] ?? severityBadges.Moderate)}>
                      {rep.severity}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">{rep.responsibility}</td>
                  <td className="px-3 py-2.5 max-w-[200px] truncate">{rep.description}</td>
                  <td className="px-3 py-2.5 text-right">{formatInr(rep.estimatedCost)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn("rounded-full px-2 py-0.5 text-[8.5px] border font-bold uppercase whitespace-nowrap", statusBadges[rep.status] ?? statusBadges.Reported)}>
                      {rep.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">{rep.reportedBy}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Drawer
        open={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title={selectedReport ? `${selectedReport.id} — Room ${selectedReport.room}` : "Report Details"}
        width="lg"
      >
        {selectedReport && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="text-slate-400 block text-[9px] uppercase font-bold">Type</span>{selectedReport.damageType}</div>
              <div><span className="text-slate-400 block text-[9px] uppercase font-bold">Severity</span>{selectedReport.severity}</div>
              <div><span className="text-slate-400 block text-[9px] uppercase font-bold">Responsibility</span>{selectedReport.responsibility}</div>
              <div><span className="text-slate-400 block text-[9px] uppercase font-bold">Asset ID</span>{selectedReport.assetId ?? "—"}</div>
              <div><span className="text-slate-400 block text-[9px] uppercase font-bold">Guest</span>{selectedReport.guestName ?? "—"}</div>
              <div><span className="text-slate-400 block text-[9px] uppercase font-bold">Reported</span>{selectedReport.reportedAt}</div>
              <div><span className="text-slate-400 block text-[9px] uppercase font-bold">Est. Cost</span>{formatInr(selectedReport.estimatedCost)}</div>
              <div><span className="text-slate-400 block text-[9px] uppercase font-bold">Actual Cost</span>{selectedReport.actualCost != null ? formatInr(selectedReport.actualCost) : "—"}</div>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold mb-1">Description</span>
              <p className="text-xs text-slate-800">{selectedReport.description}</p>
            </div>
            {selectedReport.notes && (
              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-bold mb-1">Notes</span>
                <p className="text-xs text-slate-600">{selectedReport.notes}</p>
              </div>
            )}
            {!CLOSED_STATUSES.has(selectedReport.status) && (
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <FormField label="Actual Cost (₹)">
                  <TextInput
                    placeholder={String(selectedReport.estimatedCost)}
                    value={resolveCost}
                    onChange={(e) => setResolveCost(e.target.value)}
                    className="h-9 text-xs rounded-xl"
                  />
                </FormField>
                <Button
                  onClick={handleResolve}
                  className="w-full !bg-emerald-700 hover:!bg-emerald-800 text-white font-bold rounded-xl h-10 text-xs"
                >
                  Close Report
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Drawer open={createDrawerOpen} onClose={() => setCreateDrawerOpen(false)} title="Register Damage Report" width="lg">
        <div className="space-y-4">
          <FormField label="Room" required>
            <TextInput value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. 305" className="h-9 text-xs rounded-xl" />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Damage Type" required>
              <SelectInput value={damageType} onChange={(e) => setDamageType(e.target.value)} className="h-9 text-xs rounded-xl">
                {["Furniture", "Electronics", "AC / HVAC", "Plumbing", "Electrical", "Linen", "Glass", "Flooring", "Wall", "Equipment", "Other"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </SelectInput>
            </FormField>
            <FormField label="Severity" required>
              <SelectInput value={severity} onChange={(e) => setSeverity(e.target.value)} className="h-9 text-xs rounded-xl">
                {["Critical", "Major", "Moderate", "Minor"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </SelectInput>
            </FormField>
            <FormField label="Responsibility" required>
              <SelectInput value={responsibility} onChange={(e) => setResponsibility(e.target.value)} className="h-9 text-xs rounded-xl">
                {["Guest", "Hotel", "Natural Wear", "Vendor", "Split Recovery"].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </SelectInput>
            </FormField>
          </div>
          <FormField label="Description" required>
            <TextAreaInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the damage…" className="text-xs rounded-xl min-h-[80px]" />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Estimated Cost (₹)">
              <TextInput value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} placeholder="e.g. 4500" className="h-9 text-xs rounded-xl" />
            </FormField>
            <FormField label="Asset ID (optional)">
              <TextInput value={assetId} onChange={(e) => setAssetId(e.target.value)} placeholder="e.g. AST-TV-305" className="h-9 text-xs rounded-xl font-mono" />
            </FormField>
          </div>
          <FormField label="Guest (optional)">
            <TextInput value={guest} onChange={(e) => setGuest(e.target.value)} placeholder="Guest name if liable" className="h-9 text-xs rounded-xl" />
          </FormField>
          <FormField label="Notes">
            <TextAreaInput value={notes} onChange={(e) => setNotes(e.target.value)} className="text-xs rounded-xl min-h-[60px]" />
          </FormField>
          <p className="text-[10px] text-slate-500">Reporting as: {currentUsername}</p>
          <Button onClick={handleCreateSubmit} className="w-full !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white font-bold rounded-xl h-11 text-xs">
            Register Damage Report
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
