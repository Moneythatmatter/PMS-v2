"use client";

import React, { useState, useMemo } from "react";
import {
  PieChart,
  Plus,
  Save,
  RotateCcw,
  Search,
  X,
  Power,
  Trash2,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  SelectInput,
  TextAreaInput,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { accRevenueCategoryService, type RevenueCategory, type Status } from "@/services/accounts";
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
  useAccLookups,
  useAccQuery,
} from "@/components/accounts/accountsApi";
import { cn } from "@/lib/utils";

type RevenueCategoryForm = Pick<
  RevenueCategory,
  "revenueCategoryCode" | "revenueCategoryName" | "incomeAccountId" | "description" | "status" | "companyId"
>;

function blankForm(companyId: string | null): RevenueCategoryForm {
  return {
    revenueCategoryCode: "",
    revenueCategoryName: "",
    incomeAccountId: null,
    description: "",
    status: "Active",
    companyId,
  };
}

function toForm(c: RevenueCategory): RevenueCategoryForm {
  return {
    revenueCategoryCode: c.revenueCategoryCode,
    revenueCategoryName: c.revenueCategoryName,
    incomeAccountId: c.incomeAccountId,
    description: c.description ?? "",
    status: c.status,
    companyId: c.companyId,
  };
}

export function RevenueCategoryMasterView() {
  const { data, loading, error, reload } = useAccQuery(() => accRevenueCategoryService.list(), []);
  const { lookups } = useAccLookups();
  const categories = useMemo(() => data ?? [], [data]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState<RevenueCategoryForm | null>(null);
  const [saving, setSaving] = useState(false);

  // Company Selector State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const notify = (message: string, variant: "success" | "error" = "success") => {
    setToastVariant(variant);
    setToastMessage(message);
  };

  // Modals & Protection Dialog State
  const [showActivationDialog, setShowActivationDialog] = useState(false);
  const [deleteDialogProps, setDeleteDialogProps] = useState<{ isOpen: boolean; childCount: number }>({
    isOpen: false,
    childCount: 0,
  });

  const incomeLedgers = useMemo(
    () => (lookups?.ledgers ?? []).filter((a) => a.nature === "Income"),
    [lookups]
  );

  // Records shared across companies (no company) plus those of the selected company
  const companyCategories = useMemo(
    () =>
      categories.filter(
        (c) => !selectedCompanyId || !c.companyId || c.companyId === selectedCompanyId
      ),
    [categories, selectedCompanyId]
  );

  // Filtered Revenue Categories List
  const filteredCategories = useMemo(() => {
    return companyCategories.filter((c) => {
      if (statusFilter !== "All" && c.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          c.revenueCategoryCode.toLowerCase().includes(q) ||
          c.revenueCategoryName.toLowerCase().includes(q) ||
          (c.incomeAccountName ?? "").toLowerCase().includes(q) ||
          (c.description ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [companyCategories, searchQuery, statusFilter]);

  // Active Selected Record (falls back to the first visible record)
  const activeRecord: RevenueCategory | null = isCreating
    ? null
    : categories.find((c) => c.id === selectedCategoryId) ?? filteredCategories[0] ?? null;

  const formData: RevenueCategoryForm =
    draft ?? (activeRecord ? toForm(activeRecord) : blankForm(selectedCompanyId || null));
  const showForm = isCreating || activeRecord !== null;

  const selectRecord = (id: string) => {
    setSelectedCategoryId(id);
    setIsCreating(false);
    setDraft(null);
  };

  // Form Field Change Handler
  const handleFormChange = <K extends keyof RevenueCategoryForm>(field: K, value: RevenueCategoryForm[K]) => {
    setDraft((prev) => ({ ...(prev ?? formData), [field]: value }));
  };

  // Create New Revenue Category Handler
  const handleNewCategory = () => {
    setIsCreating(true);
    setDraft(blankForm(selectedCompanyId || null));
    notify("Fill in the fields and click Save Changes to create a new Revenue Category.");
  };

  const persist = async (form: RevenueCategoryForm, successMessage: (saved: RevenueCategory) => string) => {
    setSaving(true);
    try {
      const payload: Partial<RevenueCategory> = {
        ...form,
        revenueCategoryCode: form.revenueCategoryCode.trim().toUpperCase(),
        revenueCategoryName: form.revenueCategoryName.trim(),
        companyId: form.companyId || selectedCompanyId || null,
      };
      const saved =
        isCreating || !activeRecord
          ? await accRevenueCategoryService.create(payload)
          : await accRevenueCategoryService.update(activeRecord.id, payload);
      invalidateAccLookups();
      await reload();
      setSelectedCategoryId(saved.id);
      setIsCreating(false);
      setDraft(null);
      notify(successMessage(saved));
    } catch (e) {
      notify(accErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  // Save Revenue Category Changes
  const handleSaveCategory = () => {
    if (!formData.revenueCategoryCode.trim()) {
      notify("Revenue Category Code is required.", "error");
      return;
    }
    if (!formData.revenueCategoryName.trim()) {
      notify("Revenue Category Name is required.", "error");
      return;
    }
    const creating = isCreating;
    void persist(formData, (saved) =>
      creating
        ? `Created Revenue Category '${saved.revenueCategoryName}' (${saved.revenueCategoryCode}).`
        : `Saved Revenue Category '${saved.revenueCategoryName}' successfully.`
    );
  };

  // Revert Form Edits
  const handleResetForm = () => {
    if (isCreating) {
      setDraft(blankForm(selectedCompanyId || null));
      notify("Cleared the new Revenue Category form.");
      return;
    }
    setDraft(null);
    if (activeRecord) notify(`Reverted changes for '${activeRecord.revenueCategoryName}'.`);
  };

  // Toggle Activation Flow
  const handleToggleActivation = () => {
    if (!activeRecord) return;
    const targetStatus: Status = activeRecord.status === "Active" ? "Inactive" : "Active";
    void persist(
      { ...toForm(activeRecord), status: targetStatus },
      (saved) => `Revenue Category '${saved.revenueCategoryName}' is now ${targetStatus.toUpperCase()}.`
    );
  };

  // Attempt Delete Flow with Protection Checks
  const handleDeleteAttempt = async () => {
    if (!activeRecord) return;
    if (activeRecord.ruleCount > 0) {
      setDeleteDialogProps({ isOpen: true, childCount: activeRecord.ruleCount });
      return;
    }
    if (!window.confirm(`Delete revenue category '${activeRecord.revenueCategoryName}'? This cannot be undone.`)) {
      return;
    }
    setSaving(true);
    try {
      await accRevenueCategoryService.remove(activeRecord.id);
      invalidateAccLookups();
      setSelectedCategoryId(null);
      setDraft(null);
      await reload();
      notify(`Deleted Revenue Category '${activeRecord.revenueCategoryName}'.`);
    } catch (e) {
      notify(accErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & Masters"
      title="Revenue Category Master"
      description="Manage hotel revenue categories used for revenue classification and reporting."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Masters", href: "/accounts/masters" },
        { label: "Revenue Category Master" },
      ]}
      toast={toastMessage}
      toastVariant={toastVariant}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleNewCategory}
            disabled={saving}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            New Revenue Category
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSaveCategory}
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
        {/* LEFT PANEL: Revenue Categories List & Filters */}
        <div className="md:col-span-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col min-h-[520px]">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <PieChart className="h-4.5 w-4.5 text-emerald-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Revenue Categories ({filteredCategories.length})
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
              placeholder="Search code, name, description..."
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

          {/* Filter: Status */}
          <div className="mb-3">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Status Filter
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

          {/* Revenue Category List Cards */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[440px]">
            {loading && !data ? (
              <div className="p-6 flex items-center justify-center gap-2 text-slate-400 font-medium">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading revenue categories…
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
            ) : filteredCategories.length === 0 ? (
              <div className="p-6 text-center text-slate-400 font-medium">
                {companyCategories.length === 0
                  ? "No revenue categories yet. Click “New Revenue Category” to create one."
                  : "No revenue categories match your search or filter."}
              </div>
            ) : (
              filteredCategories.map((item) => {
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
                            {item.revenueCategoryCode}
                          </span>
                          <span>{item.revenueCategoryName}</span>
                        </h4>
                        {item.description && (
                          <span className="text-[11px] text-slate-500 block mt-0.5 truncate max-w-[200px]">
                            {item.description}
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

                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100 text-[11px]">
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded truncate">
                        {item.incomeAccountName ?? "No income ledger"}
                      </span>
                      <span className="font-mono text-slate-500 text-[10px] font-semibold shrink-0">
                        {item.ruleCount} tax rules
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Master Details & Form (Single Page with 2 Sections) */}
        <div className="md:col-span-8 space-y-4">
          {!showForm ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-2xs">
              <PieChart className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No revenue category selected</p>
              <p className="text-xs text-slate-500 mt-1">
                {loading
                  ? "Loading revenue categories…"
                  : "Select a revenue category from the list or create a new one."}
              </p>
            </div>
          ) : (
            <>
              {/* Header Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-emerald-700" />
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        {isCreating ? "New Revenue Category" : "Revenue Category Details"}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {isCreating ? (
                        "Define a new revenue classification for billing and reporting."
                      ) : (
                        <>
                          Selected: <strong className="text-slate-900">{formData.revenueCategoryName}</strong>{" "}
                          ({formData.revenueCategoryCode})
                        </>
                      )}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2">
                    {activeRecord && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200">
                        {activeRecord.ruleCount} Tax Rules
                      </span>
                    )}
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
                subtitle="Revenue classification identity, reporting code, and operational description."
                icon={<FileText className="h-4 w-4" />}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Revenue Category ID (Read-only) */}
                  <FormField label="Revenue Category ID">
                    <TextInput
                      value={activeRecord?.id ?? "Auto-generated on save"}
                      readOnly
                      className="bg-slate-50 font-mono font-bold text-slate-700 cursor-not-allowed"
                    />
                  </FormField>

                  {/* Revenue Category Code (Required, unique per property) */}
                  <FormField
                    label="Revenue Category Code"
                    required
                    helperText="Short uppercase code (e.g. ROOMS, FNB, BANQUET, SPA, LAUNDRY)."
                  >
                    <TextInput
                      value={formData.revenueCategoryCode}
                      onChange={(e) =>
                        handleFormChange("revenueCategoryCode", e.target.value.toUpperCase())
                      }
                      placeholder="e.g. ROOMS, FNB"
                      className="font-mono font-bold text-slate-900"
                    />
                  </FormField>

                  {/* Revenue Category Name (Required) */}
                  <FormField label="Revenue Category Name" required>
                    <TextInput
                      value={formData.revenueCategoryName}
                      onChange={(e) => handleFormChange("revenueCategoryName", e.target.value)}
                      placeholder="e.g. Rooms, F&B, Banquet, Spa & Wellness..."
                      className="font-bold text-slate-900"
                    />
                  </FormField>

                  {/* Income Ledger */}
                  <FormField
                    label="Income Ledger Account"
                    helperText="Income ledger credited for charges in this category."
                  >
                    <SelectInput
                      value={formData.incomeAccountId ?? ""}
                      onChange={(e) => handleFormChange("incomeAccountId", e.target.value || null)}
                    >
                      <option value="">-- Not mapped --</option>
                      {incomeLedgers.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} — {a.name}
                        </option>
                      ))}
                    </SelectInput>
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

                  {/* Description */}
                  <FormField label="Description & Notes" className="sm:col-span-2">
                    <TextAreaInput
                      rows={2}
                      value={formData.description || ""}
                      onChange={(e) => handleFormChange("description", e.target.value)}
                      placeholder="Revenue scope and departmental accounting classification guidance..."
                    />
                  </FormField>
                </div>
              </MasterFormSection>

              {/* Section 2: Audit & System Information */}
              {activeRecord && (
                <MasterAuditInfo
                  idLabel="Revenue Category ID"
                  idValue={activeRecord.id}
                  status={activeRecord.status}
                  createdAt={activeRecord.createdAt}
                  updatedAt={activeRecord.updatedAt}
                  createdBy={activeRecord.createdBy ?? undefined}
                  updatedBy={activeRecord.updatedBy ?? undefined}
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
          recordName={activeRecord.revenueCategoryName}
          currentStatus={activeRecord.status}
          hasDependents={activeRecord.ruleCount > 0}
          dependentWarning={`Deactivating revenue category '${activeRecord.revenueCategoryName}' (${activeRecord.revenueCategoryCode}) will prevent billing registers and revenue reports from allocating new charges to this category. It is referenced by ${activeRecord.ruleCount} tax rule(s).`}
        />
      )}

      {/* Delete Protection Alert Dialog */}
      <MasterDeleteProtectionDialog
        isOpen={deleteDialogProps.isOpen}
        onClose={() => setDeleteDialogProps((prev) => ({ ...prev, isOpen: false }))}
        recordName={activeRecord?.revenueCategoryName ?? ""}
        reason="has_children"
        childCount={deleteDialogProps.childCount}
        transactionCount={0}
      />
    </ModulePageShell>
  );
}
