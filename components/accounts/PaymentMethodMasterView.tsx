"use client";

import React, { useState, useMemo } from "react";
import {
  CreditCard,
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
import { accPaymentMethodService, type PaymentMethod, type Status } from "@/services/accounts";
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

const METHOD_TYPES = ["Cash", "Card", "UPI", "Bank Transfer", "Cheque", "Credit", "Wallet"] as const;
const REFERENCE_TYPES = new Set(["Card", "UPI", "Bank Transfer", "Cheque"]);

type PaymentMethodForm = Pick<
  PaymentMethod,
  | "paymentMethodCode"
  | "paymentMethodName"
  | "methodType"
  | "referenceRequired"
  | "accountId"
  | "description"
  | "status"
  | "companyId"
>;

function blankForm(companyId: string | null): PaymentMethodForm {
  return {
    paymentMethodCode: "",
    paymentMethodName: "",
    methodType: "Cash",
    referenceRequired: false,
    accountId: null,
    description: "",
    status: "Active",
    companyId,
  };
}

function toForm(m: PaymentMethod): PaymentMethodForm {
  return {
    paymentMethodCode: m.paymentMethodCode,
    paymentMethodName: m.paymentMethodName,
    methodType: m.methodType,
    referenceRequired: m.referenceRequired,
    accountId: m.accountId,
    description: m.description ?? "",
    status: m.status,
    companyId: m.companyId,
  };
}

export function PaymentMethodMasterView() {
  const { data, loading, error, reload } = useAccQuery(() => accPaymentMethodService.list(), []);
  const { lookups } = useAccLookups();
  const paymentMethods = useMemo(() => data ?? [], [data]);

  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [draft, setDraft] = useState<PaymentMethodForm | null>(null);
  const [saving, setSaving] = useState(false);

  // Company Selector State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");

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
    transactionCount: number;
  }>({ isOpen: false, transactionCount: 0 });

  // Records shared across companies (no company) plus those of the selected company
  const companyMethods = useMemo(
    () =>
      paymentMethods.filter(
        (m) => !selectedCompanyId || !m.companyId || m.companyId === selectedCompanyId
      ),
    [paymentMethods, selectedCompanyId]
  );

  // Filtered Payment Methods List
  const filteredMethods = useMemo(() => {
    return companyMethods.filter((m) => {
      if (statusFilter !== "All" && m.status !== statusFilter) return false;
      if (typeFilter !== "All" && m.methodType !== typeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          m.paymentMethodCode.toLowerCase().includes(q) ||
          m.paymentMethodName.toLowerCase().includes(q) ||
          m.methodType.toLowerCase().includes(q) ||
          (m.accountName ?? "").toLowerCase().includes(q) ||
          (m.description ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [companyMethods, searchQuery, statusFilter, typeFilter]);

  // Active Selected Record (falls back to the first visible record)
  const activeRecord: PaymentMethod | null = isCreating
    ? null
    : paymentMethods.find((m) => m.id === selectedMethodId) ?? filteredMethods[0] ?? null;

  const formData: PaymentMethodForm =
    draft ?? (activeRecord ? toForm(activeRecord) : blankForm(selectedCompanyId || null));
  const showForm = isCreating || activeRecord !== null;

  const typeOptions = useMemo(() => {
    const extra = paymentMethods
      .map((m) => m.methodType)
      .filter((t) => t && !(METHOD_TYPES as readonly string[]).includes(t));
    return [...METHOD_TYPES, ...Array.from(new Set(extra))];
  }, [paymentMethods]);

  const bankCashIds = useMemo(
    () => new Set((lookups?.bankCashAccounts ?? []).map((a) => a.id)),
    [lookups]
  );
  const otherLedgers = useMemo(
    () => (lookups?.ledgers ?? []).filter((a) => !bankCashIds.has(a.id)),
    [lookups, bankCashIds]
  );

  const selectRecord = (id: string) => {
    setSelectedMethodId(id);
    setIsCreating(false);
    setDraft(null);
  };

  // Form Field Change Handler
  const handleFormChange = <K extends keyof PaymentMethodForm>(field: K, value: PaymentMethodForm[K]) => {
    setDraft((prev) => {
      const updated = { ...(prev ?? formData), [field]: value };

      // Set smart referenceRequired guidance based on methodType
      if (field === "methodType") {
        if (value === "Cash") updated.referenceRequired = false;
        else if (REFERENCE_TYPES.has(String(value))) updated.referenceRequired = true;
      }

      return updated;
    });
  };

  // Create New Payment Method Handler
  const handleNewPaymentMethod = () => {
    setIsCreating(true);
    setDraft(blankForm(selectedCompanyId || null));
    notify("Fill in the fields and click Save Changes to create a new Payment Method.");
  };

  const persist = async (form: PaymentMethodForm, successMessage: (saved: PaymentMethod) => string) => {
    setSaving(true);
    try {
      const payload: Partial<PaymentMethod> = {
        ...form,
        paymentMethodCode: form.paymentMethodCode.trim().toUpperCase(),
        paymentMethodName: form.paymentMethodName.trim(),
        companyId: form.companyId || selectedCompanyId || null,
      };
      const saved =
        isCreating || !activeRecord
          ? await accPaymentMethodService.create(payload)
          : await accPaymentMethodService.update(activeRecord.id, payload);
      invalidateAccLookups();
      await reload();
      setSelectedMethodId(saved.id);
      setIsCreating(false);
      setDraft(null);
      notify(successMessage(saved));
    } catch (e) {
      notify(accErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  // Save Payment Method Changes
  const handleSavePaymentMethod = () => {
    if (!formData.paymentMethodCode.trim()) {
      notify("Payment Method Code is required.", "error");
      return;
    }
    if (!formData.paymentMethodName.trim()) {
      notify("Payment Method Name is required.", "error");
      return;
    }
    const creating = isCreating;
    void persist(formData, (saved) =>
      creating
        ? `Created Payment Method '${saved.paymentMethodName}' (${saved.paymentMethodCode}).`
        : `Saved Payment Method '${saved.paymentMethodName}' successfully.`
    );
  };

  // Revert Form Edits
  const handleResetForm = () => {
    if (isCreating) {
      setDraft(blankForm(selectedCompanyId || null));
      notify("Cleared the new Payment Method form.");
      return;
    }
    setDraft(null);
    if (activeRecord) notify(`Reverted changes for '${activeRecord.paymentMethodName}'.`);
  };

  // Toggle Activation Flow
  const handleToggleActivation = () => {
    if (!activeRecord) return;
    const targetStatus: Status = activeRecord.status === "Active" ? "Inactive" : "Active";
    void persist(
      { ...toForm(activeRecord), status: targetStatus },
      (saved) => `Payment Method '${saved.paymentMethodName}' is now ${targetStatus.toUpperCase()}.`
    );
  };

  // Attempt Delete Flow with Protection Checks
  const handleDeleteAttempt = async () => {
    if (!activeRecord) return;
    if (activeRecord.transactionCount > 0) {
      setDeleteDialogProps({ isOpen: true, transactionCount: activeRecord.transactionCount });
      return;
    }
    if (!window.confirm(`Delete payment method '${activeRecord.paymentMethodName}'? This cannot be undone.`)) {
      return;
    }
    setSaving(true);
    try {
      await accPaymentMethodService.remove(activeRecord.id);
      invalidateAccLookups();
      setSelectedMethodId(null);
      setDraft(null);
      await reload();
      notify(`Deleted Payment Method '${activeRecord.paymentMethodName}'.`);
    } catch (e) {
      notify(accErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & Masters"
      title="Payment Method Master"
      description="Manage payment methods used across hotel billing, receipts, payments, and settlements."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Masters", href: "/accounts/masters" },
        { label: "Payment Method Master" },
      ]}
      toast={toastMessage}
      toastVariant={toastVariant}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleNewPaymentMethod}
            disabled={saving}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            New Payment Method
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSavePaymentMethod}
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
        {/* LEFT PANEL: Payment Methods List & Filters */}
        <div className="md:col-span-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col min-h-[550px]">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4.5 w-4.5 text-emerald-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Payment Methods ({filteredMethods.length})
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
              placeholder="Search code, name, type..."
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

          {/* Filters: Status & Method Type */}
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
                Method Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-7 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-[11px] font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="All">All Types</option>
                {typeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Methods List Cards */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[460px]">
            {loading && !data ? (
              <div className="p-6 flex items-center justify-center gap-2 text-slate-400 font-medium">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading payment methods…
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
            ) : filteredMethods.length === 0 ? (
              <div className="p-6 text-center text-slate-400 font-medium">
                {companyMethods.length === 0
                  ? "No payment methods yet. Click “New Payment Method” to create one."
                  : "No payment methods match your search or filter."}
              </div>
            ) : (
              filteredMethods.map((item) => {
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
                            {item.paymentMethodCode}
                          </span>
                          <span>{item.paymentMethodName}</span>
                        </h4>
                        <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
                          Type: <strong className="text-slate-700 font-semibold">{item.methodType}</strong>
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
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {item.referenceRequired ? "Ref No Required" : "No Ref Required"}
                      </span>
                      <span className="font-mono text-slate-500 text-[10px] font-semibold">
                        {item.transactionCount} txns
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Master Details & Configuration Form (Single Page with 2 Sections) */}
        <div className="md:col-span-8 space-y-4">
          {!showForm ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-2xs">
              <CreditCard className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No payment method selected</p>
              <p className="text-xs text-slate-500 mt-1">
                {loading
                  ? "Loading payment methods…"
                  : "Select a payment method from the list or create a new one."}
              </p>
            </div>
          ) : (
            <>
              {/* Header Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-emerald-700" />
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        {isCreating ? "New Payment Method" : "Payment Method Details"}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {isCreating ? (
                        "Define a new payment instrument for receipts and settlements."
                      ) : (
                        <>
                          Selected: <strong className="text-slate-900">{formData.paymentMethodName}</strong>{" "}
                          ({formData.paymentMethodCode})
                        </>
                      )}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200">
                      {formData.methodType}
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
                subtitle="Payment method identification, instrument classification, and reference guidance."
                icon={<FileText className="h-4 w-4" />}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Payment Method ID (Read-only) */}
                  <FormField label="Payment Method ID">
                    <TextInput
                      value={activeRecord?.id ?? "Auto-generated on save"}
                      readOnly
                      className="bg-slate-50 font-mono font-bold text-slate-700 cursor-not-allowed"
                    />
                  </FormField>

                  {/* Payment Method Code (Required, unique) */}
                  <FormField
                    label="Payment Method Code"
                    required
                    helperText="Short uppercase code (e.g. CASH, UPI, CC, DC, BANK, CHQ)."
                  >
                    <TextInput
                      value={formData.paymentMethodCode}
                      onChange={(e) =>
                        handleFormChange("paymentMethodCode", e.target.value.toUpperCase())
                      }
                      placeholder="e.g. CASH, UPI"
                      className="font-mono font-bold text-slate-900"
                    />
                  </FormField>

                  {/* Payment Method Name (Required, unique) */}
                  <FormField label="Payment Method Name" required>
                    <TextInput
                      value={formData.paymentMethodName}
                      onChange={(e) => handleFormChange("paymentMethodName", e.target.value)}
                      placeholder="e.g. Cash, Google Pay / PhonePe UPI, HDFC Card..."
                      className="font-bold text-slate-900"
                    />
                  </FormField>

                  {/* Method Type */}
                  <FormField
                    label="Method Type"
                    required
                    helperText="Classification determining receipt and settlement behavior."
                  >
                    <SelectInput
                      value={formData.methodType}
                      onChange={(e) => handleFormChange("methodType", e.target.value)}
                    >
                      {typeOptions.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>

                  {/* Default Ledger */}
                  <FormField
                    label="Default Ledger Account"
                    helperText="Bank / cash or clearing ledger debited when this method is used."
                  >
                    <SelectInput
                      value={formData.accountId ?? ""}
                      onChange={(e) => handleFormChange("accountId", e.target.value || null)}
                    >
                      <option value="">-- No default ledger --</option>
                      {(lookups?.bankCashAccounts ?? []).length > 0 && (
                        <optgroup label="Bank & Cash Accounts">
                          {(lookups?.bankCashAccounts ?? []).map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.code} — {a.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {otherLedgers.length > 0 && (
                        <optgroup label="Other Ledgers">
                          {otherLedgers.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.code} — {a.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </SelectInput>
                  </FormField>

                  {/* Reference Required */}
                  <FormField
                    label="Reference Number Required"
                    helperText="Guides transaction entry to require UTR, Auth code, or Cheque number."
                  >
                    <SelectInput
                      value={formData.referenceRequired ? "Yes" : "No"}
                      onChange={(e) =>
                        handleFormChange("referenceRequired", e.target.value === "Yes")
                      }
                    >
                      <option value="Yes">Yes (Mandatory Reference / UTR / Card Auth)</option>
                      <option value="No">No (Optional / Direct Cash)</option>
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
                      placeholder="Operational instructions for cashier desk and settlement points..."
                    />
                  </FormField>
                </div>
              </MasterFormSection>

              {/* Section 2: Audit & System Information */}
              {activeRecord && (
                <MasterAuditInfo
                  idLabel="Payment Method ID"
                  idValue={activeRecord.id}
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
          recordName={activeRecord.paymentMethodName}
          currentStatus={activeRecord.status}
          hasDependents={activeRecord.transactionCount > 0}
          dependentWarning={`Deactivating payment method '${activeRecord.paymentMethodName}' (${activeRecord.paymentMethodCode}) will prevent front office cashiers and accountants from selecting this method for new receipts or settlements.`}
        />
      )}

      {/* Delete Protection Alert Dialog */}
      <MasterDeleteProtectionDialog
        isOpen={deleteDialogProps.isOpen}
        onClose={() => setDeleteDialogProps((prev) => ({ ...prev, isOpen: false }))}
        recordName={activeRecord?.paymentMethodName ?? ""}
        reason="has_transactions"
        childCount={0}
        transactionCount={deleteDialogProps.transactionCount}
      />
    </ModulePageShell>
  );
}
