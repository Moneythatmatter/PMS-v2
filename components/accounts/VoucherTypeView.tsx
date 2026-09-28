"use client";

import React, { useState, useMemo } from "react";
import {
  FileText,
  Tag,
  Plus,
  Save,
  RotateCcw,
  Search,
  X,
  Power,
  Trash2,
  Layers,
  Hash,
  Sliders,
  Sparkles,
  Loader2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  SelectInput,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  accVoucherService,
  accVoucherTypeService,
  type Status,
  type VoucherCategory,
  type VoucherType,
} from "@/services/accounts";
import {
  CompanySelector,
  MasterFormSection,
  MasterAuditInfo,
  MasterActivationDialog,
  MasterDeleteProtectionDialog,
} from "@/components/accounts/MasterComponents";
import {
  accErrorMessage,
  invalidateAccLookups,
  todayIso,
  useAccLookups,
  useAccQuery,
} from "@/components/accounts/accountsApi";
import { cn } from "@/lib/utils";

const VOUCHER_CATEGORIES: VoucherCategory[] = [
  "Journal",
  "Receipt",
  "Payment",
  "Contra",
  "Sales",
  "Purchase",
  "Credit Note",
  "Debit Note",
  "Opening",
];

type VoucherTypeForm = Pick<
  VoucherType,
  | "voucherTypeName"
  | "shortCode"
  | "category"
  | "sequence"
  | "numberingMethod"
  | "prefixTemplate"
  | "startingNumber"
  | "numberPadding"
  | "resetFrequency"
  | "defaultEntryNature"
  | "partyRequired"
  | "divisionRequired"
  | "status"
  | "companyId"
>;

function blankForm(companyId: string | null, sequence: number): VoucherTypeForm {
  return {
    voucherTypeName: "",
    shortCode: "",
    category: "Journal",
    sequence,
    numberingMethod: "Automatic",
    prefixTemplate: "",
    startingNumber: 1,
    numberPadding: 5,
    resetFrequency: "Yearly",
    defaultEntryNature: "None",
    partyRequired: false,
    divisionRequired: false,
    status: "Active",
    companyId,
  };
}

function toForm(v: VoucherType): VoucherTypeForm {
  return {
    voucherTypeName: v.voucherTypeName,
    shortCode: v.shortCode,
    category: v.category,
    sequence: v.sequence,
    numberingMethod: v.numberingMethod,
    prefixTemplate: v.prefixTemplate ?? "",
    startingNumber: v.startingNumber,
    numberPadding: v.numberPadding,
    resetFrequency: v.resetFrequency,
    defaultEntryNature: v.defaultEntryNature,
    partyRequired: v.partyRequired,
    divisionRequired: v.divisionRequired,
    status: v.status,
    companyId: v.companyId,
  };
}

/** Mirrors the backend prefix rendering: {FY}, {YYYY}, {YY}, {MM}. */
function renderVoucherNumberPreview(form: VoucherTypeForm, fyCode: string | null, date: string): string {
  if (form.numberingMethod === "Manual") return "Manual entry — operator types the voucher number";
  const template = form.prefixTemplate || `${form.shortCode}/`;
  const prefix = template
    .replace(/\{FY\}/g, fyCode ?? "{FY}")
    .replace(/\{YYYY\}/g, date.slice(0, 4))
    .replace(/\{YY\}/g, date.slice(2, 4))
    .replace(/\{MM\}/g, date.slice(5, 7));
  const pad = Number(form.numberPadding) || 5;
  return `${prefix}${String(Math.max(1, Number(form.startingNumber) || 1)).padStart(pad, "0")}`;
}

export function VoucherTypeView() {
  const { data, loading, error, reload } = useAccQuery(() => accVoucherTypeService.list(), []);
  const { lookups } = useAccLookups();
  const voucherTypes = useMemo(() => data ?? [], [data]);

  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState<VoucherTypeForm | null>(null);
  const [saving, setSaving] = useState(false);

  // Company Selector State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [categoryFilter, setCategoryFilter] = useState<"All" | VoucherCategory>("All");

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const notify = (message: string, variant: "success" | "error" = "success") => {
    setToastVariant(variant);
    setToastMessage(message);
  };

  // Modals & Protection Dialog State
  const [showActivationDialog, setShowActivationDialog] = useState(false);
  const [deleteDialogProps, setDeleteDialogProps] = useState<{
    isOpen: boolean;
    reason: "system_account" | "has_transactions";
    transactionCount: number;
  }>({ isOpen: false, reason: "has_transactions", transactionCount: 0 });

  // Records shared across companies (no company) plus those of the selected company
  const companyTypes = useMemo(
    () =>
      voucherTypes.filter(
        (v) => !selectedCompanyId || !v.companyId || v.companyId === selectedCompanyId
      ),
    [voucherTypes, selectedCompanyId]
  );

  // Filtered Voucher Types List
  const filteredVoucherTypes = useMemo(() => {
    return companyTypes
      .filter((v) => {
        if (statusFilter !== "All" && v.status !== statusFilter) return false;
        if (categoryFilter !== "All" && v.category !== categoryFilter) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            v.shortCode.toLowerCase().includes(q) ||
            v.voucherTypeName.toLowerCase().includes(q) ||
            v.category.toLowerCase().includes(q) ||
            (v.prefixTemplate ?? "").toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => a.sequence - b.sequence);
  }, [companyTypes, searchQuery, statusFilter, categoryFilter]);

  // Active Selected Record (falls back to the first visible record)
  const activeRecord: VoucherType | null = isCreating
    ? null
    : voucherTypes.find((v) => v.id === selectedTypeId) ?? filteredVoucherTypes[0] ?? null;

  const nextSequence = voucherTypes.reduce((m, v) => Math.max(m, v.sequence), 0) + 1;
  const formData: VoucherTypeForm =
    draft ?? (activeRecord ? toForm(activeRecord) : blankForm(selectedCompanyId || null, nextSequence));
  const showForm = isCreating || activeRecord !== null;
  const categoryLocked = !!activeRecord && activeRecord.transactionCount > 0;

  // Next number for the saved configuration of an existing type
  const nextNumberQuery = useAccQuery(
    () =>
      activeRecord && activeRecord.numberingMethod === "Automatic"
        ? accVoucherService.nextNumber(activeRecord.id, todayIso())
        : Promise.resolve(null),
    [
      activeRecord?.id,
      activeRecord?.updatedAt,
      activeRecord?.numberingMethod,
      activeRecord?.prefixTemplate,
      activeRecord?.startingNumber,
      activeRecord?.numberPadding,
      activeRecord?.resetFrequency,
      activeRecord?.transactionCount,
    ]
  );

  const currentFiscalYear = lookups?.fiscalYears.find((f) => f.isCurrent) ?? null;
  const currentFiscalYearCode = currentFiscalYear?.fyCode ?? null;
  const livePreview = renderVoucherNumberPreview(formData, currentFiscalYearCode, todayIso());

  const selectRecord = (id: string) => {
    setSelectedTypeId(id);
    setIsCreating(false);
    setDraft(null);
  };

  // Form Field Change Handler
  const handleFormChange = <K extends keyof VoucherTypeForm>(field: K, value: VoucherTypeForm[K]) => {
    setDraft((prev) => {
      const base = prev ?? formData;
      const updated = { ...base, [field]: value };

      // Suggest prefix template when shortCode changes and prefix was default
      if (field === "shortCode" && value) {
        const cleanCode = String(value).toUpperCase();
        if (!base.prefixTemplate || base.prefixTemplate.startsWith(base.shortCode)) {
          updated.prefixTemplate = `${cleanCode}/{FY}/`;
        }
      }

      return updated;
    });
  };

  // Create New Voucher Type Handler
  const handleNewVoucherType = () => {
    setIsCreating(true);
    setDraft(blankForm(selectedCompanyId || null, nextSequence));
    notify("Fill in the fields and click Save Changes to create a new Voucher Type.");
  };

  const persist = async (form: VoucherTypeForm, successMessage: (saved: VoucherType) => string) => {
    setSaving(true);
    try {
      const payload: Partial<VoucherType> = {
        ...form,
        shortCode: form.shortCode.trim().toUpperCase(),
        voucherTypeName: form.voucherTypeName.trim(),
        prefixTemplate: (form.prefixTemplate || "").trim(),
        companyId: form.companyId || selectedCompanyId || null,
      };
      const saved =
        isCreating || !activeRecord
          ? await accVoucherTypeService.create(payload)
          : await accVoucherTypeService.update(activeRecord.id, payload);
      invalidateAccLookups();
      await reload();
      setSelectedTypeId(saved.id);
      setIsCreating(false);
      setDraft(null);
      notify(successMessage(saved));
    } catch (e) {
      notify(accErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  // Save Voucher Type Changes
  const handleSaveVoucherType = () => {
    if (!formData.shortCode.trim()) {
      notify("Short Code is required.", "error");
      return;
    }
    if (!formData.voucherTypeName.trim()) {
      notify("Voucher Type Name is required.", "error");
      return;
    }
    if (formData.startingNumber < 1) {
      notify("Starting Number must be at least 1.", "error");
      return;
    }
    if (formData.numberPadding < 1 || formData.numberPadding > 10) {
      notify("Number Padding must be between 1 and 10 digits.", "error");
      return;
    }
    const creating = isCreating;
    void persist(formData, (saved) =>
      creating
        ? `Created Voucher Type '${saved.voucherTypeName}' (${saved.shortCode}).`
        : `Saved Voucher Type '${saved.voucherTypeName}' successfully.`
    );
  };

  // Revert Form Edits
  const handleResetForm = () => {
    if (isCreating) {
      setDraft(blankForm(selectedCompanyId || null, nextSequence));
      notify("Cleared the new Voucher Type form.");
      return;
    }
    setDraft(null);
    if (activeRecord) notify(`Reverted changes for '${activeRecord.voucherTypeName}'.`);
  };

  // Toggle Activation Flow
  const handleToggleActivation = () => {
    if (!activeRecord) return;
    const targetStatus: Status = activeRecord.status === "Active" ? "Inactive" : "Active";
    void persist(
      { ...toForm(activeRecord), status: targetStatus },
      (saved) => `Voucher Type '${saved.voucherTypeName}' is now ${targetStatus.toUpperCase()}.`
    );
  };

  // Attempt Delete Flow with Protection Checks
  const handleDeleteAttempt = async () => {
    if (!activeRecord) return;
    if (activeRecord.isSystem) {
      setDeleteDialogProps({ isOpen: true, reason: "system_account", transactionCount: 0 });
      return;
    }
    if (activeRecord.transactionCount > 0) {
      setDeleteDialogProps({
        isOpen: true,
        reason: "has_transactions",
        transactionCount: activeRecord.transactionCount,
      });
      return;
    }
    if (!window.confirm(`Delete voucher type '${activeRecord.voucherTypeName}'? This cannot be undone.`)) {
      return;
    }
    setSaving(true);
    try {
      await accVoucherTypeService.remove(activeRecord.id);
      invalidateAccLookups();
      setSelectedTypeId(null);
      setDraft(null);
      await reload();
      notify(`Deleted Voucher Type '${activeRecord.voucherTypeName}'.`);
    } catch (e) {
      notify(accErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & Masters"
      title="Voucher Type Master"
      description="Define accounting voucher types, numbering patterns, and transaction validation rules."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Masters", href: "/accounts/masters" },
        { label: "Voucher Type Master" },
      ]}
      toast={toastMessage}
      toastVariant={toastVariant}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleNewVoucherType}
            disabled={saving}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            New Voucher Type
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSaveVoucherType}
            disabled={saving || !showForm}
            className="rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1" />
            )}
            Save Changes
          </Button>

          {!isCreating && activeRecord && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowActivationDialog(true)}
                disabled={saving}
                className={cn(
                  "rounded-xl text-xs font-bold border cursor-pointer",
                  activeRecord.status === "Active"
                    ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                    : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                )}
              >
                <Power className="h-3.5 w-3.5 mr-1" />
                {activeRecord.status === "Active" ? "Deactivate" : "Activate"}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleDeleteAttempt()}
                disabled={saving}
                className="rounded-xl text-xs font-semibold bg-white border-rose-200 text-rose-700 hover:bg-rose-50 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1 text-rose-600" />
                Delete
              </Button>
            </>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetForm}
            disabled={saving || !showForm}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1 text-slate-500" />
            {isCreating ? "Clear" : "Reset"}
          </Button>

          {isCreating && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCreating(false);
                setDraft(null);
              }}
              disabled={saving}
              className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
            >
              Cancel
            </Button>
          )}
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
        {/* LEFT PANEL: Voucher Type List & Filters */}
        <div className="md:col-span-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col min-h-[580px]">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Tag className="h-4.5 w-4.5 text-emerald-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Voucher Types ({filteredVoucherTypes.length})
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              V1 Master
            </span>
          </div>

          {/* Search Box */}
          <div className="relative mb-2.5">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, name, category..."
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

          {/* Filters: Status & Category */}
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
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value as "All" | VoucherCategory)
                }
                className="h-7 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-[11px] font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="All">All Categories</option>
                {VOUCHER_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Voucher Types List Cards */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[500px]">
            {loading && !data ? (
              <div className="p-6 flex items-center justify-center gap-2 text-slate-400 font-medium">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading voucher types…
              </div>
            ) : error && !data ? (
              <div className="p-6 text-center space-y-2">
                <p className="text-rose-600 font-semibold">{error}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void reload()}
                  className="rounded-xl text-xs font-semibold"
                >
                  Retry
                </Button>
              </div>
            ) : filteredVoucherTypes.length === 0 ? (
              <div className="p-6 text-center text-slate-400 font-medium">
                {companyTypes.length === 0
                  ? "No voucher types yet. Click “New Voucher Type” to create one."
                  : "No voucher types match your search or filter."}
              </div>
            ) : (
              filteredVoucherTypes.map((item) => {
                const isSelected = !isCreating && activeRecord?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => selectRecord(item.id)}
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
                            {item.shortCode}
                          </span>
                          <span>{item.voucherTypeName}</span>
                          {item.isSystem && <Lock className="h-3 w-3 text-slate-400" />}
                        </h4>
                        <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
                          Pattern:{" "}
                          <strong className="text-slate-700 font-mono font-semibold">
                            {item.numberingMethod === "Manual" ? "Manual" : item.prefixTemplate || `${item.shortCode}/`}
                          </strong>
                        </span>
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
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {item.category}
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

        {/* RIGHT PANEL: Master Details & Configuration Form (Single Page with 4 Sections) */}
        <div className="md:col-span-8 space-y-4">
          {!showForm ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-2xs">
              <Tag className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No voucher type selected</p>
              <p className="text-xs text-slate-500 mt-1">
                {loading
                  ? "Loading voucher types…"
                  : "Select a voucher type from the list or create a new one."}
              </p>
            </div>
          ) : (
            <>
              {/* Header Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Tag className="h-5 w-5 text-emerald-700" />
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        {isCreating ? "New Voucher Type" : "Voucher Type Configuration"}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {isCreating ? (
                        "Define a new voucher type, numbering pattern, and validation rules."
                      ) : (
                        <>
                          Selected: <strong className="text-slate-900">{formData.voucherTypeName}</strong>{" "}
                          ({formData.shortCode})
                        </>
                      )}
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
                          formData.status === "Active" ? "bg-emerald-600" : "bg-slate-400"
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
                subtitle="Core identity, short code, and operational voucher classification."
                icon={<FileText className="h-4 w-4" />}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Voucher Type ID (Read-only) */}
                  <FormField label="Voucher Type ID">
                    <TextInput
                      value={activeRecord?.id ?? "Auto-generated on save"}
                      readOnly
                      className="bg-slate-50 font-mono font-bold text-slate-700 cursor-not-allowed"
                    />
                  </FormField>

                  {/* Short Code (Required, unique) */}
                  <FormField
                    label="Short Code"
                    required
                    helperText={
                      activeRecord?.isSystem
                        ? "System voucher type codes cannot be changed."
                        : "2-4 character uppercase identifier (e.g. RV, PV, JV, CV, CN, DN)."
                    }
                  >
                    <TextInput
                      value={formData.shortCode}
                      disabled={!!activeRecord?.isSystem}
                      onChange={(e) =>
                        handleFormChange("shortCode", e.target.value.toUpperCase())
                      }
                      placeholder="e.g. RV, PV"
                      className={cn(
                        "font-mono font-bold text-slate-900",
                        activeRecord?.isSystem && "bg-slate-50 cursor-not-allowed"
                      )}
                    />
                  </FormField>

                  {/* Voucher Type Name (Required) */}
                  <FormField label="Voucher Type Name" required>
                    <TextInput
                      value={formData.voucherTypeName}
                      onChange={(e) => handleFormChange("voucherTypeName", e.target.value)}
                      placeholder="e.g. Receipt Voucher, Vendor Payment..."
                      className="font-bold text-slate-900"
                    />
                  </FormField>

                  {/* Voucher Category */}
                  <FormField
                    label="Voucher Category"
                    required
                    helperText={
                      categoryLocked
                        ? "Category cannot change once vouchers exist for this type."
                        : "Categorizes the voucher for financial statements and audit registers."
                    }
                  >
                    <SelectInput
                      value={formData.category}
                      disabled={categoryLocked}
                      onChange={(e) =>
                        handleFormChange("category", e.target.value as VoucherCategory)
                      }
                      className={cn(categoryLocked && "bg-slate-50 cursor-not-allowed")}
                    >
                      {VOUCHER_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>

                  {/* Display Sequence */}
                  <FormField
                    label="Display Sequence"
                    helperText="Controls list ordering across menus and entry screens."
                  >
                    <TextInput
                      type="number"
                      value={formData.sequence}
                      onChange={(e) =>
                        handleFormChange("sequence", parseInt(e.target.value, 10) || 1)
                      }
                      className="font-mono font-bold"
                    />
                  </FormField>

                  {/* Status */}
                  <FormField label="Status">
                    <SelectInput
                      value={formData.status}
                      onChange={(e) => handleFormChange("status", e.target.value as Status)}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </SelectInput>
                  </FormField>
                </div>
              </MasterFormSection>

              {/* Section 2: Numbering Configuration */}
              <MasterFormSection
                title="Numbering Configuration"
                subtitle="Document sequence templates and dynamic fiscal year formatting."
                icon={<Hash className="h-4 w-4" />}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Numbering Method */}
                  <FormField
                    label="Numbering Method"
                    required
                    helperText="Automatic computes sequential voucher numbers; Manual requires operator input."
                  >
                    <SelectInput
                      value={formData.numberingMethod}
                      onChange={(e) =>
                        handleFormChange(
                          "numberingMethod",
                          e.target.value as VoucherType["numberingMethod"]
                        )
                      }
                    >
                      <option value="Automatic">Automatic (Sequential)</option>
                      <option value="Manual">Manual Entry</option>
                    </SelectInput>
                  </FormField>

                  {/* Prefix Template */}
                  <FormField
                    label="Prefix Template"
                    helperText="Tokens: {FY} fiscal year code, {YYYY}, {YY}, {MM} (e.g. RV/{FY}/)."
                  >
                    <TextInput
                      value={formData.prefixTemplate}
                      disabled={formData.numberingMethod === "Manual"}
                      onChange={(e) => handleFormChange("prefixTemplate", e.target.value)}
                      placeholder="e.g. RV/{FY}/"
                      className={cn(
                        "font-mono font-bold",
                        formData.numberingMethod === "Manual" && "bg-slate-50 cursor-not-allowed"
                      )}
                    />
                  </FormField>

                  {/* Starting Number */}
                  <FormField
                    label="Starting Number"
                    helperText="Initial integer counter for each numbering period."
                  >
                    <TextInput
                      type="number"
                      min="1"
                      disabled={formData.numberingMethod === "Manual"}
                      value={formData.startingNumber}
                      onChange={(e) =>
                        handleFormChange("startingNumber", parseInt(e.target.value, 10) || 1)
                      }
                      className={cn(
                        "font-mono font-bold",
                        formData.numberingMethod === "Manual" && "bg-slate-50 cursor-not-allowed"
                      )}
                    />
                  </FormField>

                  {/* Number Padding */}
                  <FormField
                    label="Number Padding (Digits)"
                    helperText="Zero-padded width of the counter, 1–10 (e.g. 5 → 00001)."
                  >
                    <TextInput
                      type="number"
                      min="1"
                      max="10"
                      disabled={formData.numberingMethod === "Manual"}
                      value={formData.numberPadding}
                      onChange={(e) =>
                        handleFormChange("numberPadding", parseInt(e.target.value, 10) || 1)
                      }
                      className={cn(
                        "font-mono font-bold",
                        formData.numberingMethod === "Manual" && "bg-slate-50 cursor-not-allowed"
                      )}
                    />
                  </FormField>

                  {/* Reset Frequency */}
                  <FormField
                    label="Reset Frequency"
                    helperText="Resets sequential voucher counter at the chosen interval."
                  >
                    <SelectInput
                      value={formData.resetFrequency}
                      disabled={formData.numberingMethod === "Manual"}
                      onChange={(e) =>
                        handleFormChange(
                          "resetFrequency",
                          e.target.value as VoucherType["resetFrequency"]
                        )
                      }
                      className={cn(
                        formData.numberingMethod === "Manual" && "bg-slate-50 cursor-not-allowed"
                      )}
                    >
                      <option value="Yearly">Yearly (Every New Fiscal Year)</option>
                      <option value="Monthly">Monthly (Every Calendar Month)</option>
                      <option value="Never">Never (Continuous Numbering)</option>
                    </SelectInput>
                  </FormField>

                  {/* Live Numbering Preview Box */}
                  <div className="sm:col-span-2 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
                      Live Numbering Output Preview (FY: {currentFiscalYearCode ?? "not set"})
                    </span>
                    <p className="font-mono text-sm font-extrabold text-emerald-950">
                      {livePreview}
                    </p>
                    <span className="text-[10px] text-slate-500 block">
                      {currentFiscalYearCode
                        ? `The transaction engine substitutes {FY} with the voucher date's fiscal year code (current: ${currentFiscalYearCode}).`
                        : "No current fiscal year is set — mark a fiscal year as current to resolve the {FY} token."}
                    </span>
                    {activeRecord && (
                      <div className="pt-1.5 mt-1 border-t border-emerald-200/70 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600">
                        <span>
                          Last voucher:{" "}
                          <strong className="font-mono text-slate-800">
                            {activeRecord.lastVoucherNo ?? "—"}
                          </strong>
                        </span>
                        {activeRecord.numberingMethod === "Automatic" && (
                          <span>
                            Next number today (saved config):{" "}
                            <strong className="font-mono text-slate-800">
                              {nextNumberQuery.loading
                                ? "…"
                                : nextNumberQuery.error
                                  ? nextNumberQuery.error
                                  : nextNumberQuery.data?.voucherNo ?? "—"}
                            </strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </MasterFormSection>

              {/* Section 3: Basic Accounting Behavior */}
              <MasterFormSection
                title="Basic Accounting Behavior"
                subtitle="Initial guidance and required dimensions for voucher line validations."
                icon={<Sliders className="h-4 w-4" />}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Default Entry Nature */}
                  <FormField
                    label="Default Entry Nature"
                    helperText="Initial UI orientation guidance; actual posting debits/credits depend on line items."
                  >
                    <SelectInput
                      value={formData.defaultEntryNature}
                      onChange={(e) =>
                        handleFormChange(
                          "defaultEntryNature",
                          e.target.value as VoucherType["defaultEntryNature"]
                        )
                      }
                    >
                      <option value="Debit">Debit (Dr First)</option>
                      <option value="Credit">Credit (Cr First)</option>
                      <option value="None">None (Flexible Journal)</option>
                    </SelectInput>
                  </FormField>

                  {/* Party Required */}
                  <FormField
                    label="Party Required"
                    helperText="Requires selecting an account from Party Master during voucher posting."
                  >
                    <SelectInput
                      value={formData.partyRequired ? "Yes" : "No"}
                      onChange={(e) =>
                        handleFormChange("partyRequired", e.target.value === "Yes")
                      }
                    >
                      <option value="Yes">Yes (Mandatory Party)</option>
                      <option value="No">No (Optional / Internal)</option>
                    </SelectInput>
                  </FormField>

                  {/* Division Required */}
                  <FormField
                    label="Division Required"
                    helperText="Requires allocating cost center from Division Master during voucher entry."
                  >
                    <SelectInput
                      value={formData.divisionRequired ? "Yes" : "No"}
                      onChange={(e) =>
                        handleFormChange("divisionRequired", e.target.value === "Yes")
                      }
                    >
                      <option value="Yes">Yes (Mandatory Department)</option>
                      <option value="No">No (Optional Allocation)</option>
                    </SelectInput>
                  </FormField>
                </div>
              </MasterFormSection>

              {/* Section 4: Audit & System Information */}
              {activeRecord && (
                <MasterAuditInfo
                  idLabel="Voucher Type ID"
                  idValue={activeRecord.id}
                  sequence={activeRecord.sequence}
                  isSystem={activeRecord.isSystem}
                  status={activeRecord.status}
                  createdAt={activeRecord.createdAt}
                  updatedAt={activeRecord.updatedAt}
                  createdBy={activeRecord.createdBy ?? undefined}
                  updatedBy={activeRecord.updatedBy ?? undefined}
                  transactionCount={activeRecord.transactionCount}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Safe Activation / Deactivation Confirmation Dialog */}
      {activeRecord && (
        <MasterActivationDialog
          isOpen={showActivationDialog}
          onClose={() => setShowActivationDialog(false)}
          onConfirm={handleToggleActivation}
          recordName={activeRecord.voucherTypeName}
          currentStatus={activeRecord.status}
          hasDependents={activeRecord.transactionCount > 0}
          dependentWarning={`Deactivating voucher type '${activeRecord.voucherTypeName}' (${activeRecord.shortCode}) will prevent accountants and front desk auditors from creating new vouchers with this type.`}
        />
      )}

      {/* Delete Protection Alert Dialog */}
      <MasterDeleteProtectionDialog
        isOpen={deleteDialogProps.isOpen}
        onClose={() => setDeleteDialogProps((prev) => ({ ...prev, isOpen: false }))}
        recordName={activeRecord?.voucherTypeName ?? ""}
        reason={deleteDialogProps.reason}
        childCount={0}
        transactionCount={deleteDialogProps.transactionCount}
      />
    </ModulePageShell>
  );
}
