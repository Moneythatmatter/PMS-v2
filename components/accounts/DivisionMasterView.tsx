"use client";

import React, { useState, useMemo } from "react";
import {
  Building2,
  Plus,
  Save,
  RotateCcw,
  Search,
  X,
  Power,
  Trash2,
  Layers,
  FileText,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  SelectInput,
  TextAreaInput,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { accDivisionService, type Division } from "@/services/accounts";
import {
  CompanySelector,
  MasterFormSection,
  MasterAuditInfo,
  MasterActivationDialog,
  MasterDeleteProtectionDialog,
} from "@/components/accounts/MasterComponents";
import { cn } from "@/lib/utils";
import { accErrorMessage, invalidateAccLookups, useAccQuery } from "./accountsApi";

type DivisionType = "Revenue Department" | "Support Department" | "Administrative Department" | "Other";

type DivisionForm = Pick<
  Division,
  "divisionCode" | "divisionName" | "shortName" | "divisionType" | "sequence" | "description" | "status" | "parentDivisionId" | "companyId"
> & {
  id: string | null;
  transactionCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

function toDivisionForm(d: Division): DivisionForm {
  return {
    id: d.id,
    divisionCode: d.divisionCode ?? "",
    divisionName: d.divisionName ?? "",
    shortName: d.shortName ?? "",
    divisionType: d.divisionType || "Support Department",
    sequence: d.sequence ?? 0,
    description: d.description ?? "",
    status: d.status ?? "Active",
    parentDivisionId: d.parentDivisionId,
    companyId: d.companyId,
    transactionCount: d.transactionCount ?? 0,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    createdBy: d.createdBy ?? null,
    updatedBy: d.updatedBy ?? null,
  };
}

export function DivisionMasterView() {
  // Master Divisions State
  const { data, loading, error, reload } = useAccQuery(() => accDivisionService.list(), []);
  const allDivisions = useMemo(() => data ?? [], [data]);
  const [selectedDivisionId, setSelectedDivisionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Company Selector State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  const divisions = useMemo(
    () => allDivisions.filter((d) => !d.companyId || !selectedCompanyId || d.companyId === selectedCompanyId),
    [allDivisions, selectedCompanyId]
  );

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [typeFilter, setTypeFilter] = useState<"All" | DivisionType>("All");

  // Toast Notification State
  const [toastMessage, setToastMessageRaw] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const setToastMessage = (msg: string | null, variant: "success" | "error" = "success") => {
    setToastVariant(variant);
    setToastMessageRaw(msg);
  };

  // Modals & Protection Dialog State
  const [showActivationDialog, setShowActivationDialog] = useState(false);
  const [deleteDialogProps, setDeleteDialogProps] = useState<{
    isOpen: boolean;
    reason: "system_account" | "has_transactions" | "has_children";
    childCount: number;
    transactionCount: number;
  }>({
    isOpen: false,
    reason: "has_transactions",
    childCount: 0,
    transactionCount: 0,
  });

  // Unsaved edits (null = show the selected record as stored)
  const [draft, setDraft] = useState<DivisionForm | null>(null);
  const isDraftNew = draft !== null && draft.id === null;

  // Active Selected Record
  const activeRecord = useMemo(
    () => (isDraftNew ? undefined : divisions.find((d) => d.id === selectedDivisionId) || divisions[0]),
    [divisions, selectedDivisionId, isDraftNew]
  );

  const nextSequence = divisions.reduce((m, d) => Math.max(m, d.sequence ?? 0), 0) + 1;
  const newDivisionForm = (): DivisionForm => ({
    id: null,
    divisionCode: "",
    divisionName: "",
    shortName: "",
    divisionType: "Support Department",
    sequence: nextSequence,
    description: "",
    status: "Active",
    parentDivisionId: null,
    companyId: selectedCompanyId || null,
    transactionCount: 0,
    createdAt: "",
    updatedAt: "",
    createdBy: null,
    updatedBy: null,
  });

  // Form State
  const formData: DivisionForm =
    draft ?? (activeRecord ? toDivisionForm(activeRecord) : newDivisionForm());
  const isNew = formData.id === null;

  // Filtered Divisions List
  const filteredDivisions = useMemo(() => {
    return divisions
      .filter((d) => {
        // Status Filter
        if (statusFilter !== "All" && d.status !== statusFilter) return false;
        // Division Type Filter
        if (typeFilter !== "All" && d.divisionType !== typeFilter) return false;
        // Search Query
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            d.divisionCode.toLowerCase().includes(q) ||
            d.divisionName.toLowerCase().includes(q) ||
            (d.shortName && d.shortName.toLowerCase().includes(q)) ||
            (d.parentDivisionName && d.parentDivisionName.toLowerCase().includes(q)) ||
            (d.description && d.description.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => a.sequence - b.sequence);
  }, [divisions, searchQuery, statusFilter, typeFilter]);

  // Available Parent Divisions (excluding self and any descendants)
  const availableParents = useMemo(() => {
    if (!formData.id) return divisions;
    const descendants = new Set<string>([formData.id]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const d of allDivisions) {
        if (d.parentDivisionId && descendants.has(d.parentDivisionId) && !descendants.has(d.id)) {
          descendants.add(d.id);
          grew = true;
        }
      }
    }
    return divisions.filter((d) => !descendants.has(d.id));
  }, [divisions, allDivisions, formData.id]);

  // Child divisions count for current record
  const childDivisions = useMemo(() => {
    return formData.id ? allDivisions.filter((d) => d.parentDivisionId === formData.id) : [];
  }, [allDivisions, formData.id]);

  // Form Change Handler
  const handleFormChange = <K extends keyof DivisionForm>(field: K, value: DivisionForm[K]) => {
    setDraft((prev) => ({ ...(prev ?? formData), [field]: value }));
  };

  const handleSelectDivision = (id: string) => {
    setSelectedDivisionId(id);
    setDraft(null);
  };

  // Create New Division Handler
  const handleNewDivision = () => {
    setDraft(newDivisionForm());
    setToastMessage("Prepared a new Division record. Fill in the details and Save.");
  };

  // Save Division Changes
  const handleSaveDivision = async () => {
    if (!formData.divisionCode.trim()) {
      setToastMessage("Division Code is required.", "error");
      return;
    }
    if (!formData.divisionName.trim()) {
      setToastMessage("Division Name is required.", "error");
      return;
    }

    // Check code uniqueness among other records
    const codeExists = allDivisions.some(
      (d) =>
        d.id !== formData.id &&
        d.divisionCode.trim().toUpperCase() === formData.divisionCode.trim().toUpperCase()
    );

    if (codeExists) {
      setToastMessage(`Division Code '${formData.divisionCode.toUpperCase()}' is already in use.`, "error");
      return;
    }

    const body: Partial<Division> = {
      divisionCode: formData.divisionCode.trim().toUpperCase(),
      divisionName: formData.divisionName.trim(),
      shortName: (formData.shortName || "").trim().toUpperCase(),
      divisionType: formData.divisionType,
      sequence: formData.sequence,
      description: formData.description,
      status: formData.status,
      parentDivisionId: formData.parentDivisionId || null,
      companyId: formData.companyId || selectedCompanyId || null,
    };

    setSaving(true);
    try {
      const saved = formData.id
        ? await accDivisionService.update(formData.id, body)
        : await accDivisionService.create(body);
      invalidateAccLookups();
      await reload();
      setSelectedDivisionId(saved.id);
      setDraft(null);
      setToastMessage(`Saved Division '${saved.divisionName}' successfully.`);
    } catch (e) {
      setToastMessage(accErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  // Revert Form Edits
  const handleResetForm = async () => {
    setDraft(null);
    await reload();
    setToastMessage(
      activeRecord ? `Reverted changes for '${activeRecord.divisionName}'.` : "Discarded unsaved division."
    );
  };

  // Toggle Activation Flow
  const handleToggleActivation = async () => {
    const targetStatus: Division["status"] = formData.status === "Active" ? "Inactive" : "Active";
    if (!formData.id) {
      handleFormChange("status", targetStatus);
      return;
    }
    setSaving(true);
    try {
      await accDivisionService.update(formData.id, { status: targetStatus });
      invalidateAccLookups();
      await reload();
      setDraft((prev) => (prev ? { ...prev, status: targetStatus } : null));
      setToastMessage(`Division '${formData.divisionName}' is now ${targetStatus.toUpperCase()}.`);
    } catch (e) {
      setToastMessage(accErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  // Attempt Delete Flow with Protection Checks
  const handleDeleteAttempt = async () => {
    if (!formData.id) {
      setDraft(null);
      return;
    }

    // Check 1: Child Divisions Protection
    if (childDivisions.length > 0) {
      setDeleteDialogProps({
        isOpen: true,
        reason: "has_children",
        childCount: childDivisions.length,
        transactionCount: formData.transactionCount || 0,
      });
      return;
    }

    // Check 2: Transaction Reference Protection
    if ((formData.transactionCount || 0) > 0) {
      setDeleteDialogProps({
        isOpen: true,
        reason: "has_transactions",
        childCount: 0,
        transactionCount: formData.transactionCount || 0,
      });
      return;
    }

    if (!window.confirm(`Delete division '${formData.divisionName}'? This cannot be undone.`)) return;

    setSaving(true);
    try {
      await accDivisionService.remove(formData.id);
      invalidateAccLookups();
      setSelectedDivisionId(null);
      setDraft(null);
      await reload();
      setToastMessage(`Deleted Division '${formData.divisionName}'.`);
    } catch (e) {
      setToastMessage(accErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & Masters"
      title="Division Master"
      description="Manage hotel departments and cost centers used for financial reporting."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Masters", href: "/accounts/masters" },
        { label: "Division Master" },
      ]}
      toast={toastMessage}
      toastVariant={toastVariant}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleNewDivision}
            disabled={saving || loading}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            New Division
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => void handleSaveDivision()}
            disabled={saving || loading}
            className="rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
            Save Changes
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={saving || loading}
            onClick={() => (isNew ? void handleToggleActivation() : setShowActivationDialog(true))}
            className={cn(
              "rounded-xl text-xs font-bold border cursor-pointer",
              formData.status === "Active"
                ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
            )}
          >
            <Power className="h-3.5 w-3.5 mr-1" />
            {formData.status === "Active" ? "Deactivate" : "Activate"}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleDeleteAttempt()}
            disabled={saving || loading}
            className="rounded-xl text-xs font-semibold bg-white border-rose-200 text-rose-700 hover:bg-rose-50 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1 text-rose-600" />
            {isNew ? "Discard" : "Delete"}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => void handleResetForm()}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Reset
          </Button>
        </div>
      }
    >
      {/* Top Company Selector Bar */}
      <div className="mb-4">
        <CompanySelector
          selectedCompanyId={selectedCompanyId}
          onCompanyChange={setSelectedCompanyId}
        />
      </div>

      {/* Main Split Layout: 35% Left List & 65% Right Detail Form */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 font-sans text-xs">
        {/* LEFT PANEL: Division List & Filters */}
        <div className="md:col-span-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col min-h-[580px]">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Building2 className="h-4.5 w-4.5 text-emerald-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Divisions ({filteredDivisions.length})
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              Cost Centers
            </span>
          </div>

          {/* Search Box */}
          <div className="relative mb-2.5">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, name, short name..."
              className="h-8 w-full rounded-xl border border-slate-300 bg-white pl-8 pr-7 text-xs font-medium text-slate-900 focus:border-emerald-600 focus:outline-none placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filters: Status & Type */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "All" | "Active" | "Inactive")
                }
                className="h-7 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-[11px] font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive Only</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Department Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value as "All" | DivisionType)
                }
                className="h-7 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-[11px] font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="All">All Types</option>
                <option value="Revenue Department">Revenue</option>
                <option value="Support Department">Support</option>
                <option value="Administrative Department">Admin</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Divisions List Cards */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[500px]">
            {isNew && (
              <div className="p-3 rounded-xl border bg-emerald-50/90 border-emerald-500 ring-1 ring-emerald-500 shadow-2xs space-y-1">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded font-mono font-bold text-[10px] border border-amber-200">
                    UNSAVED
                  </span>
                  <span>{formData.divisionName || "New Division"}</span>
                </h4>
              </div>
            )}

            {loading && !data ? (
              <div className="flex items-center justify-center gap-2 p-6 text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                Loading divisions…
              </div>
            ) : error && !data ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800 space-y-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Could not load divisions
                </div>
                <p>{error}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void reload()}
                  className="h-7 text-xs font-semibold bg-white"
                >
                  Retry
                </Button>
              </div>
            ) : filteredDivisions.length === 0 ? (
              <div className="p-6 text-center text-slate-400 font-medium">
                {divisions.length === 0
                  ? "No divisions yet. Use New Division to create one."
                  : "No divisions match your search or filter."}
              </div>
            ) : (
              filteredDivisions.map((item) => {
                const isSelected = formData.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectDivision(item.id)}
                    className={cn(
                      "p-3 rounded-xl border transition-all duration-150 cursor-pointer space-y-2 select-none",
                      isSelected
                        ? "bg-emerald-50/90 border-emerald-500 ring-1 ring-emerald-500 shadow-2xs"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-900 rounded font-mono font-bold text-[10px] border border-emerald-200">
                            {item.divisionCode}
                          </span>
                          <span>{item.divisionName}</span>
                        </h4>
                        {item.shortName && (
                          <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
                            Short: <strong className="text-slate-700 font-semibold">{item.shortName}</strong>
                          </span>
                        )}
                        {item.parentDivisionName && (
                          <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
                            Under: <strong className="text-slate-700 font-semibold">{item.parentDivisionName}</strong>
                          </span>
                        )}
                      </div>

                      <span
                        className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 border",
                          item.status === "Active"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[11px]">
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded truncate max-w-[170px]">
                        {item.divisionType || "Department"}
                      </span>
                      <span className="font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
                        Seq: #{item.sequence}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Master Details & Edit Form */}
        <div className="md:col-span-8 space-y-4">
          {/* Header Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-700" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Division & Cost Center Details
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {isNew ? "New record: " : "Selected: "}
                  <strong className="text-slate-900">{formData.divisionName || "—"}</strong>{" "}
                  ({formData.divisionCode || "no code"})
                </p>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-mono font-bold text-slate-700 border border-slate-200">
                  <Layers className="h-3.5 w-3.5 text-slate-500" />
                  Seq #{formData.sequence}
                </span>

                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold border",
                    formData.status === "Active"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      formData.status === "Active"
                        ? "bg-emerald-600"
                        : "bg-slate-400"
                    )}
                  />
                  {formData.status}
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: General Information */}
          <MasterFormSection
            title="General Information"
            subtitle="Departmental identification, operational type, and sequence ordering."
            icon={<FileText className="h-4 w-4" />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Division ID (Read-only) */}
              <FormField label="Division ID">
                <TextInput
                  value={formData.id ?? "Auto-generated on save"}
                  readOnly
                  className="bg-slate-50 font-mono font-bold text-slate-700 cursor-not-allowed"
                />
              </FormField>

              {/* Division Code (Required, unique) */}
              <FormField
                label="Division Code"
                required
                helperText="Unique departmental code used in voucher postings & reporting."
              >
                <TextInput
                  value={formData.divisionCode}
                  onChange={(e) =>
                    handleFormChange("divisionCode", e.target.value.toUpperCase())
                  }
                  placeholder="e.g. ROOMS, FNB, ENG"
                  className="font-mono font-bold text-slate-900"
                />
              </FormField>

              {/* Division Name (Required) */}
              <FormField label="Division Name" required className="sm:col-span-2">
                <TextInput
                  value={formData.divisionName}
                  onChange={(e) => handleFormChange("divisionName", e.target.value)}
                  placeholder="e.g. Rooms Division, Food & Beverage..."
                  className="font-bold text-slate-900"
                />
              </FormField>

              {/* Short Name */}
              <FormField label="Short Name / Alias">
                <TextInput
                  value={formData.shortName || ""}
                  onChange={(e) => handleFormChange("shortName", e.target.value)}
                  placeholder="e.g. RMS, FNB, HKP"
                  className="font-semibold text-slate-900"
                />
              </FormField>

              {/* Division Type */}
              <FormField
                label="Division Type"
                helperText="Classification for departmental revenue vs overhead reporting."
              >
                <SelectInput
                  value={formData.divisionType || "Support Department"}
                  onChange={(e) =>
                    handleFormChange("divisionType", e.target.value)
                  }
                >
                  <option value="Revenue Department">Revenue Department</option>
                  <option value="Support Department">Support Department</option>
                  <option value="Administrative Department">Administrative Department</option>
                  <option value="Other">Other</option>
                  {formData.divisionType &&
                    !["Revenue Department", "Support Department", "Administrative Department", "Other"].includes(
                      formData.divisionType
                    ) && <option value={formData.divisionType}>{formData.divisionType}</option>}
                </SelectInput>
              </FormField>

              {/* Parent Division */}
              <FormField
                label="Parent Division (Optional)"
                helperText="Organizes sub-departments under an overarching divisional head."
              >
                <SelectInput
                  value={formData.parentDivisionId || ""}
                  onChange={(e) =>
                    handleFormChange("parentDivisionId", e.target.value || null)
                  }
                >
                  <option value="">None (Top-Level Division)</option>
                  {availableParents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.divisionCode} - {parent.divisionName} ({parent.divisionType})
                    </option>
                  ))}
                </SelectInput>
              </FormField>

              {/* Display Sequence */}
              <FormField
                label="Display Sequence"
                helperText="Controls list ordering in entry dropdowns and financial reports."
              >
                <TextInput
                  type="number"
                  value={formData.sequence}
                  onChange={(e) =>
                    handleFormChange("sequence", parseInt(e.target.value, 10) || 0)
                  }
                  className="font-mono font-bold"
                />
              </FormField>

              {/* Status */}
              <FormField label="Status">
                <SelectInput
                  value={formData.status}
                  onChange={(e) => handleFormChange("status", e.target.value as Division["status"])}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </SelectInput>
              </FormField>

              {/* Description */}
              <FormField label="Description & Notes" className="sm:col-span-2">
                <TextAreaInput
                  rows={2}
                  value={formData.description || ""}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  placeholder="Operational scope, cost allocation guidelines, or notes..."
                />
              </FormField>
            </div>
          </MasterFormSection>

          {/* Section 2: Audit & System Information */}
          <MasterAuditInfo
            idLabel="Division ID"
            idValue={formData.id ?? "New (unsaved)"}
            sequence={formData.sequence}
            status={formData.status}
            createdAt={formData.createdAt}
            updatedAt={formData.updatedAt}
            createdBy={formData.createdBy ?? undefined}
            updatedBy={formData.updatedBy ?? undefined}
            transactionCount={formData.transactionCount || 0}
          />
        </div>
      </div>

      {/* Safe Activation / Deactivation Confirmation Dialog */}
      <MasterActivationDialog
        isOpen={showActivationDialog}
        onClose={() => setShowActivationDialog(false)}
        onConfirm={() => void handleToggleActivation()}
        recordName={formData.divisionName}
        currentStatus={formData.status}
        hasDependents={
          childDivisions.length > 0 || (formData.transactionCount || 0) > 0
        }
        dependentWarning={
          childDivisions.length > 0
            ? `Deactivating division '${formData.divisionName}' will restrict visibility of its ${childDivisions.length} sub-departments in active voucher selection.`
            : `Deactivating division '${formData.divisionName}' will prevent new journal and payment vouchers from allocating departmental costs to this cost center.`
        }
      />

      {/* Delete Protection Alert Dialog */}
      <MasterDeleteProtectionDialog
        isOpen={deleteDialogProps.isOpen}
        onClose={() =>
          setDeleteDialogProps((prev) => ({ ...prev, isOpen: false }))
        }
        recordName={formData.divisionName}
        reason={deleteDialogProps.reason}
        childCount={deleteDialogProps.childCount}
        transactionCount={deleteDialogProps.transactionCount}
      />
    </ModulePageShell>
  );
}
