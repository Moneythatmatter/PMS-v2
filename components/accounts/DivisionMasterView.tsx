"use client";

import React, { useState, useMemo } from "react";
import {
  Building,
  Building2,
  CheckCircle2,
  Plus,
  Save,
  RotateCcw,
  Printer,
  Download,
  Search,
  X,
  ShieldCheck,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  SelectInput,
  StatMiniCard,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  sampleDivisionsData,
  DivisionRecord,
} from "@/app/data/accounts/divisionData";
import { cn } from "@/lib/utils";

export function DivisionMasterView() {
  // Master List State
  const [divisions, setDivisions] = useState<DivisionRecord[]>(sampleDivisionsData);
  const [selectedId, setSelectedId] = useState<string>(sampleDivisionsData[0].id);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Selected Record
  const activeRecord = useMemo(
    () => divisions.find((d) => d.id === selectedId) || divisions[0],
    [divisions, selectedId]
  );

  // Form State
  const [formData, setFormData] = useState<DivisionRecord>(activeRecord);

  // Account Lookup Modal State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountSearchQuery, setAccountSearchQuery] = useState("");

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sample GL Accounts for lookup
  const sampleGLAccounts = [
    "1100 - Guest Ledger Control A/c",
    "1200 - City Ledger Control A/c",
    "2100 - Sundry Creditors Control A/c",
    "4100 - F&B Revenue Control A/c",
    "4200 - Spa Revenue Control A/c",
    "5100 - A&G Expense Control A/c",
    "5200 - Maintenance Control A/c",
  ];

  // Sync Form Data when selected record changes
  React.useEffect(() => {
    setFormData({ ...activeRecord });
  }, [activeRecord]);

  // Filtered Divisions List
  const filteredDivisions = useMemo(() => {
    return divisions.filter((d) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          d.divisionId.toLowerCase().includes(q) ||
          d.name.toLowerCase().includes(q) ||
          d.shortName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [divisions, searchQuery]);

  // Field Change Handler
  const handleFormChange = (field: keyof DivisionRecord, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Add New Action
  const handleNewDivision = () => {
    const newRecord: DivisionRecord = {
      id: `div-${Date.now()}`,
      divisionId: `DIV0${divisions.length + 1}`,
      active: true,
      name: "New Division",
      shortName: "NEWDIV",
      unitLedgerAccount: "1100 - Guest Ledger Control A/c",
      displaySequenceNo: divisions.length + 1,
      updateBy: "ABHIJIT",
      updateDate: "24-July-2026",
    };

    setDivisions([newRecord, ...divisions]);
    setSelectedId(newRecord.id);
    setFormData(newRecord);
    setToastMessage(`Created new Division (${newRecord.divisionId}).`);
  };

  // Save Action
  const handleSaveSettings = () => {
    setDivisions((prev) =>
      prev.map((d) => (d.id === formData.id ? { ...formData, updateDate: "24-July-2026" } : d))
    );
    setFormData((prev) => ({ ...prev, updateDate: "24-July-2026" }));
    setToastMessage(`Saved Division '${formData.name}' successfully!`);
  };

  // Reset Action
  const handleReset = () => {
    setFormData({ ...activeRecord });
    setToastMessage("Reset Division fields to saved values.");
  };

  // Export CSV
  const handleExportCSV = () => {
    const csvHeader = "Id,Name,ShortName,UnitLedgerAccount,DisplaySequenceNo,Active\n";
    const csvRows = filteredDivisions
      .map(
        (d) =>
          `"${d.divisionId}","${d.name}","${d.shortName}","${d.unitLedgerAccount}","${d.displaySequenceNo}","${d.active}"`
      )
      .join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Divisions_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage("Exported Divisions to CSV.");
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & Masters"
      title="Division"
      description="Define hotel operational divisions, unit ledger account mappings, and display sequence numbers."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Masters", href: "/accounts/masters" },
        { label: "Division" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNewDivision}
            className="rounded-xl text-xs font-bold bg-white text-slate-800 border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            New
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSaveSettings}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            Save
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Refresh
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Report
          </Button>
        </div>
      }
    >
      {/* Top Active Target Entity Selector Bar */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <Building2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <span className="font-bold text-xs text-slate-600 block">Target Company Entity:</span>
              <select
                value="LUXY HOTEL & RESORTS PRIVATE LIMITED"
                onChange={() => {}}
                className="h-8 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                <option value="LUXY HOTEL & RESORTS PRIVATE LIMITED">
                  LUXY HOTEL & RESORTS PRIVATE LIMITED (CMP-001)
                </option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-slate-700 border border-slate-200 font-mono">
              <Building className="h-3.5 w-3.5 text-slate-600" />
              Division: {formData.name} ({formData.divisionId})
            </span>

            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-3 py-1 font-bold border",
                formData.active
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              )}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
              Status: {formData.active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Split View: 35% Left Divisions List / 65% Right Form */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 font-sans text-xs">
        {/* LEFT PANEL: Divisions List */}
        <div className="md:col-span-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col min-h-[500px]">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Building className="h-4.5 w-4.5 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Divisions ({filteredDivisions.length})
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              WINHMS Master
            </span>
          </div>

          {/* Quick Search */}
          <div className="mb-3 relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Id, Name, Short Name..."
              className="h-8 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[460px]">
            {filteredDivisions.map((item) => {
              const isSelected = selectedId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "p-3 rounded-xl border transition-all duration-150 cursor-pointer space-y-2",
                    isSelected
                      ? "bg-emerald-50/90 border-emerald-500 ring-1 ring-emerald-500 shadow-2xs"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5 font-mono">
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-extrabold text-[10px]">
                          {item.divisionId}
                        </span>
                        <span>{item.name}</span>
                      </h4>
                      <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">
                        Short: <strong className="text-slate-700">{item.shortName}</strong>
                      </span>
                    </div>

                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 border",
                        item.active
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      )}
                    >
                      {item.active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                    <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded truncate max-w-[180px]">
                      {item.unitLedgerAccount}
                    </span>
                    <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-mono">
                      Seq: #{item.displaySequenceNo}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL: Form matching EXACT WINHMS Division Dialog */}
        <div className="md:col-span-8 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Division Setup Form
                </h2>
              </div>
              <span className="font-mono text-xs text-slate-500 font-bold">WINHMS DIVISION DIALOG</span>
            </div>

            <div className="space-y-4 max-w-xl">
              {/* Id & Active Checkbox Row */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <FormField label="Id" required>
                    <TextInput
                      value={formData.divisionId}
                      onChange={(e) => handleFormChange("divisionId", e.target.value.toUpperCase())}
                      className="bg-white font-mono font-bold text-slate-900 h-9"
                    />
                  </FormField>
                </div>

                <div className="pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => handleFormChange("active", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                    />
                    <span>Active</span>
                  </label>
                </div>
              </div>

              {/* Name */}
              <FormField label="Name" required>
                <TextInput
                  value={formData.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  className="bg-white font-bold text-slate-900 h-9"
                />
              </FormField>

              {/* Short Name */}
              <FormField label="Short Name">
                <TextInput
                  value={formData.shortName}
                  onChange={(e) => handleFormChange("shortName", e.target.value)}
                  className="bg-white font-semibold text-slate-900 h-9 max-w-xs"
                />
              </FormField>

              {/* Unit Ledger Account with Binocular 👓 and Clear ❌ Buttons */}
              <FormField label="Unit Ledger Account">
                <div className="flex items-center gap-2">
                  <TextInput
                    readOnly
                    value={formData.unitLedgerAccount}
                    className="bg-slate-50 font-bold text-slate-900 h-9 flex-1 cursor-not-allowed"
                  />
                  {/* Binocular Lookup Button 👓 */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAccountModalOpen(true)}
                    className="h-9 px-3 rounded-xl border-slate-300 hover:bg-slate-100 text-slate-700 font-bold flex items-center gap-1 cursor-pointer"
                    title="Search Unit Ledger Account"
                  >
                    🔍
                  </Button>
                  {/* Clear Button ❌ */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleFormChange("unitLedgerAccount", "")}
                    className="h-9 px-3 rounded-xl border-slate-300 hover:bg-rose-50 text-rose-600 font-bold cursor-pointer"
                    title="Clear Selection"
                  >
                    ❌
                  </Button>
                </div>
              </FormField>

              {/* Display Sequence No */}
              <FormField label="Display Sequence No">
                <TextInput
                  type="number"
                  value={formData.displaySequenceNo}
                  onChange={(e) => handleFormChange("displaySequenceNo", parseInt(e.target.value) || 1)}
                  className="bg-white font-mono font-bold h-9 max-w-xs"
                />
              </FormField>
            </div>

            {/* WINHMS Exact Bottom Audit Box */}
            <div className="mt-8 pt-4 border-t border-slate-200 text-slate-500 font-mono text-[11px] flex justify-end">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1 min-w-[200px]">
                <div>
                  Update By : <strong className="text-slate-800">{formData.updateBy}</strong>
                </div>
                <div>
                  Update Date : <strong className="text-slate-800">{formData.updateDate}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GL Account Lookup Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-5 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">Select Unit Ledger Account</h3>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={accountSearchQuery}
                onChange={(e) => setAccountSearchQuery(e.target.value)}
                placeholder="Search GL Ledger Account..."
                className="h-8 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {sampleGLAccounts
                .filter((acc) => acc.toLowerCase().includes(accountSearchQuery.toLowerCase()))
                .map((acc) => (
                  <div
                    key={acc}
                    onClick={() => {
                      handleFormChange("unitLedgerAccount", acc);
                      setIsAccountModalOpen(false);
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-emerald-50 hover:border-emerald-400 cursor-pointer font-bold text-slate-800 flex items-center justify-between"
                  >
                    <span>{acc}</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 opacity-0 hover:opacity-100" />
                  </div>
                ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAccountModalOpen(false)}
                className="rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
