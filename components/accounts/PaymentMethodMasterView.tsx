"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  CheckCircle2,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  SelectInput,
  TextAreaInput,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  samplePaymentMethodsList,
  PaymentMethodModel,
  PaymentMethodType,
} from "@/app/data/accounts/paymentMethodData";
import {
  CompanySelector,
  MasterFormSection,
  MasterAuditInfo,
  MasterActivationDialog,
  MasterDeleteProtectionDialog,
} from "@/components/accounts/MasterComponents";
import { cn } from "@/lib/utils";

export function PaymentMethodMasterView() {
  // Master Payment Methods State (strictly 2 initial seed records)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodModel[]>(samplePaymentMethodsList);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("PM-001");

  // Company Selector State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("comp-101");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [typeFilter, setTypeFilter] = useState<"All" | PaymentMethodType>("All");

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Active Selected Record
  const activeRecord = useMemo(() => {
    return (
      paymentMethods.find((m) => m.paymentMethodId === selectedMethodId) ||
      paymentMethods[0] || {
        paymentMethodId: "PM-001",
        paymentMethodCode: "CASH",
        paymentMethodName: "Cash",
        methodType: "Cash" as PaymentMethodType,
        referenceRequired: false,
        status: "Active" as const,
        description: "",
        companyId: "comp-101",
        createdAt: "01 Apr 2024",
        updatedAt: "01 Apr 2024",
        createdBy: "Finance Admin",
        updatedBy: "Finance Admin",
        hasTransactions: false,
        transactionCount: 0,
      }
    );
  }, [paymentMethods, selectedMethodId]);

  // Form State
  const [formData, setFormData] = useState<PaymentMethodModel>(activeRecord);

  // Sync Form State when selection changes
  useEffect(() => {
    setFormData({ ...activeRecord });
  }, [activeRecord]);

  // Filtered Payment Methods List
  const filteredMethods = useMemo(() => {
    return paymentMethods.filter((m) => {
      // Status Filter
      if (statusFilter !== "All" && m.status !== statusFilter) return false;
      // Type Filter
      if (typeFilter !== "All" && m.methodType !== typeFilter) return false;
      // Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          m.paymentMethodId.toLowerCase().includes(q) ||
          m.paymentMethodCode.toLowerCase().includes(q) ||
          m.paymentMethodName.toLowerCase().includes(q) ||
          m.methodType.toLowerCase().includes(q) ||
          (m.description && m.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [paymentMethods, searchQuery, statusFilter, typeFilter]);

  // Form Field Change Handler
  const handleFormChange = (field: keyof PaymentMethodModel, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Set smart referenceRequired guidance based on methodType
      if (field === "methodType") {
        if (value === "Cash") {
          updated.referenceRequired = false;
        } else if (
          value === "UPI" ||
          value === "Credit Card" ||
          value === "Debit Card" ||
          value === "Bank Transfer" ||
          value === "Cheque"
        ) {
          updated.referenceRequired = true;
        }
      }

      return updated;
    });
  };

  // Create New Payment Method Handler
  const handleNewPaymentMethod = () => {
    const nextSeq = paymentMethods.length + 1;
    const nextNum = nextSeq < 10 ? `00${nextSeq}` : nextSeq < 100 ? `0${nextSeq}` : `${nextSeq}`;
    const newMethodId = `PM-${nextNum}`;
    const now = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const newRecord: PaymentMethodModel = {
      paymentMethodId: newMethodId,
      paymentMethodCode: `PM${nextSeq}`,
      paymentMethodName: "Credit Card",
      methodType: "Credit Card",
      referenceRequired: true,
      status: "Active",
      description: "",
      companyId: selectedCompanyId,
      createdAt: now,
      updatedAt: now,
      createdBy: "Finance Admin",
      updatedBy: "Finance Admin",
      hasTransactions: false,
      transactionCount: 0,
    };

    setPaymentMethods((prev) => [newRecord, ...prev]);
    setSelectedMethodId(newRecord.paymentMethodId);
    setFormData(newRecord);
    setToastMessage(`Created new Payment Method '${newRecord.paymentMethodName}' (${newRecord.paymentMethodCode}).`);
  };

  // Save Payment Method Changes
  const handleSavePaymentMethod = () => {
    if (!formData.paymentMethodCode.trim()) {
      setToastMessage("Payment Method Code is required.");
      return;
    }
    if (!formData.paymentMethodName.trim()) {
      setToastMessage("Payment Method Name is required.");
      return;
    }

    // Check code uniqueness among other records
    const codeExists = paymentMethods.some(
      (m) =>
        m.paymentMethodId !== formData.paymentMethodId &&
        m.paymentMethodCode.trim().toUpperCase() === formData.paymentMethodCode.trim().toUpperCase()
    );

    if (codeExists) {
      setToastMessage(`Payment Method Code '${formData.paymentMethodCode.toUpperCase()}' is already in use.`);
      return;
    }

    // Check name uniqueness
    const nameExists = paymentMethods.some(
      (m) =>
        m.paymentMethodId !== formData.paymentMethodId &&
        m.paymentMethodName.trim().toLowerCase() === formData.paymentMethodName.trim().toLowerCase()
    );

    if (nameExists) {
      setToastMessage(`Payment Method Name '${formData.paymentMethodName}' is already in use.`);
      return;
    }

    const now = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const updatedRecord: PaymentMethodModel = {
      ...formData,
      paymentMethodCode: formData.paymentMethodCode.trim().toUpperCase(),
      paymentMethodName: formData.paymentMethodName.trim(),
      updatedAt: now,
      updatedBy: "Finance Admin",
    };

    setPaymentMethods((prev) =>
      prev.map((m) => (m.paymentMethodId === updatedRecord.paymentMethodId ? updatedRecord : m))
    );
    setFormData(updatedRecord);
    setToastMessage(`Saved Payment Method '${updatedRecord.paymentMethodName}' successfully.`);
  };

  // Revert Form Edits
  const handleResetForm = () => {
    setFormData({ ...activeRecord });
    setToastMessage(`Reverted changes for '${activeRecord.paymentMethodName}'.`);
  };

  // Toggle Activation Flow
  const handleToggleActivation = () => {
    const targetStatus = formData.status === "Active" ? "Inactive" : "Active";
    const now = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const updatedRecord: PaymentMethodModel = {
      ...formData,
      status: targetStatus,
      updatedAt: now,
      updatedBy: "Finance Admin",
    };

    setPaymentMethods((prev) =>
      prev.map((m) => (m.paymentMethodId === updatedRecord.paymentMethodId ? updatedRecord : m))
    );
    setFormData(updatedRecord);
    setToastMessage(
      `Payment Method '${updatedRecord.paymentMethodName}' is now ${targetStatus.toUpperCase()}.`
    );
  };

  // Attempt Delete Flow with Protection Checks
  const handleDeleteAttempt = () => {
    // Transaction Reference Protection
    if (formData.hasTransactions || (formData.transactionCount || 0) > 0) {
      setDeleteDialogProps({
        isOpen: true,
        reason: "has_transactions",
        childCount: 0,
        transactionCount: formData.transactionCount || 0,
      });
      return;
    }

    // Permitted to delete if 0 transactions
    setPaymentMethods((prev) => prev.filter((m) => m.paymentMethodId !== formData.paymentMethodId));
    setSelectedMethodId(paymentMethods[0]?.paymentMethodId || "PM-001");
    setToastMessage(`Deleted Payment Method '${formData.paymentMethodName}'.`);
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
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleNewPaymentMethod}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            New Payment Method
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSavePaymentMethod}
            className="rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            Save Changes
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowActivationDialog(true)}
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
            onClick={handleDeleteAttempt}
            className="rounded-xl text-xs font-semibold bg-white border-rose-200 text-rose-700 hover:bg-rose-50 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1 text-rose-600" />
            Delete
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetForm}
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
                onChange={(e) =>
                  setTypeFilter(e.target.value as "All" | PaymentMethodType)
                }
                className="h-7 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-[11px] font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="All">All Types</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Credit Account">Credit Account</option>
              </select>
            </div>
          </div>

          {/* Payment Methods List Cards */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[460px]">
            {filteredMethods.length === 0 ? (
              <div className="p-6 text-center text-slate-400 font-medium">
                No payment methods match your search or filter.
              </div>
            ) : (
              filteredMethods.map((item) => {
                const isSelected = selectedMethodId === item.paymentMethodId;
                return (
                  <div
                    key={item.paymentMethodId}
                    onClick={() => setSelectedMethodId(item.paymentMethodId)}
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
                        {item.paymentMethodId}
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
          {/* Header Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-700" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Payment Method Details
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Selected: <strong className="text-slate-900">{formData.paymentMethodName}</strong>{" "}
                  ({formData.paymentMethodCode})
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
            subtitle="Payment method identification, instrument classification, and reference guidance."
            icon={<FileText className="h-4 w-4" />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Payment Method ID (Read-only) */}
              <FormField label="Payment Method ID">
                <TextInput
                  value={formData.paymentMethodId}
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
                  onChange={(e) =>
                    handleFormChange("methodType", e.target.value as PaymentMethodType)
                  }
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Credit Account">Credit Account</option>
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
                  onChange={(e) => handleFormChange("status", e.target.value)}
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
          <MasterAuditInfo
            idLabel="Payment Method ID"
            idValue={formData.paymentMethodId}
            status={formData.status}
            createdAt={formData.createdAt}
            updatedAt={formData.updatedAt}
            createdBy={formData.createdBy || "Finance Admin"}
            updatedBy={formData.updatedBy || "Finance Admin"}
            transactionCount={formData.transactionCount || 0}
          />
        </div>
      </div>

      {/* Safe Activation / Deactivation Confirmation Dialog */}
      <MasterActivationDialog
        isOpen={showActivationDialog}
        onClose={() => setShowActivationDialog(false)}
        onConfirm={handleToggleActivation}
        recordName={formData.paymentMethodName}
        currentStatus={formData.status}
        hasDependents={(formData.transactionCount || 0) > 0}
        dependentWarning={`Deactivating payment method '${formData.paymentMethodName}' (${formData.paymentMethodCode}) will prevent front office cashiers and accountants from selecting this method for new receipts or settlements.`}
      />

      {/* Delete Protection Alert Dialog */}
      <MasterDeleteProtectionDialog
        isOpen={deleteDialogProps.isOpen}
        onClose={() =>
          setDeleteDialogProps((prev) => ({ ...prev, isOpen: false }))
        }
        recordName={formData.paymentMethodName}
        reason={deleteDialogProps.reason}
        childCount={0}
        transactionCount={deleteDialogProps.transactionCount}
      />
    </ModulePageShell>
  );
}
