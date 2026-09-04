"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  CheckCircle2,
  Hash,
  Sliders,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  SelectInput,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  sampleVoucherTypesList,
  VoucherTypeModel,
  VoucherCategory,
  formatVoucherNumberPreview,
  currentFiscalYearCode,
} from "@/app/data/accounts/voucherTypeData";
import {
  CompanySelector,
  MasterFormSection,
  MasterAuditInfo,
  MasterActivationDialog,
  MasterDeleteProtectionDialog,
} from "@/components/accounts/MasterComponents";
import { cn } from "@/lib/utils";

export function VoucherTypeView() {
  // Master Voucher Types State (strictly 2 initial seed records)
  const [voucherTypes, setVoucherTypes] = useState<VoucherTypeModel[]>(sampleVoucherTypesList);
  const [selectedTypeId, setSelectedTypeId] = useState<string>("VT-001");

  // Company Selector State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("comp-101");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [categoryFilter, setCategoryFilter] = useState<"All" | VoucherCategory>("All");

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
      voucherTypes.find((v) => v.voucherTypeId === selectedTypeId) ||
      voucherTypes[0] || {
        voucherTypeId: "VT-001",
        voucherTypeName: "Receipt Voucher",
        shortCode: "RV",
        category: "Receipt" as VoucherCategory,
        sequence: 1,
        numberingMethod: "Automatic" as const,
        prefixTemplate: "RV/{FY}/",
        startingNumber: 1,
        resetFrequency: "Yearly" as const,
        defaultEntryNature: "Debit" as const,
        partyRequired: true,
        divisionRequired: false,
        status: "Active" as const,
        companyId: "comp-101",
        createdAt: "01 Apr 2024",
        updatedAt: "01 Apr 2024",
        createdBy: "Finance Admin",
        updatedBy: "Finance Admin",
        hasTransactions: false,
        transactionCount: 0,
      }
    );
  }, [voucherTypes, selectedTypeId]);

  // Form State
  const [formData, setFormData] = useState<VoucherTypeModel>(activeRecord);

  // Sync Form State when activeRecord changes
  useEffect(() => {
    setFormData({ ...activeRecord });
  }, [activeRecord]);

  // Filtered Voucher Types List
  const filteredVoucherTypes = useMemo(() => {
    return voucherTypes
      .filter((v) => {
        // Status Filter
        if (statusFilter !== "All" && v.status !== statusFilter) return false;
        // Category Filter
        if (categoryFilter !== "All" && v.category !== categoryFilter) return false;
        // Search Query
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            v.voucherTypeId.toLowerCase().includes(q) ||
            v.shortCode.toLowerCase().includes(q) ||
            v.voucherTypeName.toLowerCase().includes(q) ||
            v.category.toLowerCase().includes(q) ||
            v.prefixTemplate.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => a.sequence - b.sequence);
  }, [voucherTypes, searchQuery, statusFilter, categoryFilter]);

  // Form Field Change Handler
  const handleFormChange = (field: keyof VoucherTypeModel, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Suggest prefix template when shortCode or category changes and prefix was default
      if (field === "shortCode" && value) {
        const cleanCode = String(value).toUpperCase();
        if (!prev.prefixTemplate || prev.prefixTemplate.startsWith(prev.shortCode)) {
          updated.prefixTemplate = `${cleanCode}/{FY}/`;
        }
      }

      return updated;
    });
  };

  // Create New Voucher Type Handler
  const handleNewVoucherType = () => {
    const nextSeq = voucherTypes.length + 1;
    const nextNum = nextSeq < 10 ? `00${nextSeq}` : nextSeq < 100 ? `0${nextSeq}` : `${nextSeq}`;
    const newTypeId = `VT-${nextNum}`;
    const now = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const newRecord: VoucherTypeModel = {
      voucherTypeId: newTypeId,
      voucherTypeName: "Journal Voucher",
      shortCode: "JV",
      category: "Journal",
      sequence: nextSeq,
      numberingMethod: "Automatic",
      prefixTemplate: "JV/{FY}/",
      startingNumber: 1,
      resetFrequency: "Yearly",
      defaultEntryNature: "Both",
      partyRequired: false,
      divisionRequired: false,
      status: "Active",
      companyId: selectedCompanyId,
      createdAt: now,
      updatedAt: now,
      createdBy: "Finance Admin",
      updatedBy: "Finance Admin",
      hasTransactions: false,
      transactionCount: 0,
    };

    setVoucherTypes((prev) => [newRecord, ...prev]);
    setSelectedTypeId(newRecord.voucherTypeId);
    setFormData(newRecord);
    setToastMessage(`Created new Voucher Type '${newRecord.voucherTypeName}' (${newRecord.shortCode}).`);
  };

  // Save Voucher Type Changes
  const handleSaveVoucherType = () => {
    if (!formData.shortCode.trim()) {
      setToastMessage("Short Code is required.");
      return;
    }
    if (!formData.voucherTypeName.trim()) {
      setToastMessage("Voucher Type Name is required.");
      return;
    }

    // Check code uniqueness among other records
    const codeExists = voucherTypes.some(
      (v) =>
        v.voucherTypeId !== formData.voucherTypeId &&
        v.shortCode.trim().toUpperCase() === formData.shortCode.trim().toUpperCase()
    );

    if (codeExists) {
      setToastMessage(`Short Code '${formData.shortCode.toUpperCase()}' is already in use.`);
      return;
    }

    const now = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const updatedRecord: VoucherTypeModel = {
      ...formData,
      shortCode: formData.shortCode.trim().toUpperCase(),
      voucherTypeName: formData.voucherTypeName.trim(),
      prefixTemplate: (formData.prefixTemplate || "").trim(),
      updatedAt: now,
      updatedBy: "Finance Admin",
    };

    setVoucherTypes((prev) =>
      prev.map((v) => (v.voucherTypeId === updatedRecord.voucherTypeId ? updatedRecord : v))
    );
    setFormData(updatedRecord);
    setToastMessage(`Saved Voucher Type '${updatedRecord.voucherTypeName}' successfully.`);
  };

  // Revert Form Edits
  const handleResetForm = () => {
    setFormData({ ...activeRecord });
    setToastMessage(`Reverted changes for '${activeRecord.voucherTypeName}'.`);
  };

  // Toggle Activation Flow
  const handleToggleActivation = () => {
    const targetStatus = formData.status === "Active" ? "Inactive" : "Active";
    const now = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const updatedRecord: VoucherTypeModel = {
      ...formData,
      status: targetStatus,
      updatedAt: now,
      updatedBy: "Finance Admin",
    };

    setVoucherTypes((prev) =>
      prev.map((v) => (v.voucherTypeId === updatedRecord.voucherTypeId ? updatedRecord : v))
    );
    setFormData(updatedRecord);
    setToastMessage(
      `Voucher Type '${updatedRecord.voucherTypeName}' is now ${targetStatus.toUpperCase()}.`
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

    // Permitted to delete if 0 posted transactions
    setVoucherTypes((prev) => prev.filter((v) => v.voucherTypeId !== formData.voucherTypeId));
    setSelectedTypeId(voucherTypes[0]?.voucherTypeId || "VT-001");
    setToastMessage(`Deleted Voucher Type '${formData.voucherTypeName}'.`);
  };

  // Computed live numbering preview
  const livePreview = formatVoucherNumberPreview(
    formData.prefixTemplate,
    formData.startingNumber,
    formData.numberingMethod,
    currentFiscalYearCode
  );

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
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleNewVoucherType}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            New Voucher Type
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSaveVoucherType}
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
                <option value="Receipt">Receipt</option>
                <option value="Payment">Payment</option>
                <option value="Journal">Journal</option>
                <option value="Contra">Contra</option>
                <option value="Credit Note">Credit Note</option>
                <option value="Debit Note">Debit Note</option>
              </select>
            </div>
          </div>

          {/* Voucher Types List Cards */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[500px]">
            {filteredVoucherTypes.length === 0 ? (
              <div className="p-6 text-center text-slate-400 font-medium">
                No voucher types match your search or filter.
              </div>
            ) : (
              filteredVoucherTypes.map((item) => {
                const isSelected = selectedTypeId === item.voucherTypeId;
                return (
                  <div
                    key={item.voucherTypeId}
                    onClick={() => setSelectedTypeId(item.voucherTypeId)}
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
                        </h4>
                        <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
                          Pattern:{" "}
                          <strong className="text-slate-700 font-mono font-semibold">
                            {item.prefixTemplate}
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
          {/* Header Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-emerald-700" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Voucher Type Configuration
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Selected: <strong className="text-slate-900">{formData.voucherTypeName}</strong>{" "}
                  ({formData.shortCode})
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
            subtitle="Core identity, short code, and operational voucher classification."
            icon={<FileText className="h-4 w-4" />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Voucher Type ID (Read-only) */}
              <FormField label="Voucher Type ID">
                <TextInput
                  value={formData.voucherTypeId}
                  readOnly
                  className="bg-slate-50 font-mono font-bold text-slate-700 cursor-not-allowed"
                />
              </FormField>

              {/* Short Code (Required, unique) */}
              <FormField
                label="Short Code"
                required
                helperText="2-4 character uppercase identifier (e.g. RV, PV, JV, CV, CN, DN)."
              >
                <TextInput
                  value={formData.shortCode}
                  onChange={(e) =>
                    handleFormChange("shortCode", e.target.value.toUpperCase())
                  }
                  placeholder="e.g. RV, PV"
                  className="font-mono font-bold text-slate-900"
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
                helperText="Categorizes the voucher for financial statements and audit registers."
              >
                <SelectInput
                  value={formData.category}
                  onChange={(e) =>
                    handleFormChange("category", e.target.value as VoucherCategory)
                  }
                >
                  <option value="Receipt">Receipt</option>
                  <option value="Payment">Payment</option>
                  <option value="Journal">Journal</option>
                  <option value="Contra">Contra</option>
                  <option value="Credit Note">Credit Note</option>
                  <option value="Debit Note">Debit Note</option>
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
                  onChange={(e) => handleFormChange("status", e.target.value)}
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
                      e.target.value as "Automatic" | "Manual"
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
                helperText="Use {FY} placeholder for dynamic active financial year (e.g. RV/{FY}/)."
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
                helperText="Initial integer counter for new fiscal periods."
              >
                <TextInput
                  type="number"
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

              {/* Reset Frequency */}
              <FormField
                label="Reset Frequency"
                helperText="Resets sequential voucher counter at the chosen calendar interval."
              >
                <SelectInput
                  value={formData.resetFrequency}
                  disabled={formData.numberingMethod === "Manual"}
                  onChange={(e) =>
                    handleFormChange(
                      "resetFrequency",
                      e.target.value as "Yearly" | "Monthly" | "Never"
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
                  Live Numbering Output Preview (FY: {currentFiscalYearCode})
                </span>
                <p className="font-mono text-sm font-extrabold text-emerald-950">
                  {livePreview}
                </p>
                <span className="text-[10px] text-slate-500 block">
                  The actual transaction engine substitutes {"{FY}"} with the active financial year ({currentFiscalYearCode}) during voucher posting.
                </span>
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
                      e.target.value as "Debit" | "Credit" | "Both"
                    )
                  }
                >
                  <option value="Debit">Debit (Dr First)</option>
                  <option value="Credit">Credit (Cr First)</option>
                  <option value="Both">Both (Flexible Journal)</option>
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
          <MasterAuditInfo
            idLabel="Voucher Type ID"
            idValue={formData.voucherTypeId}
            sequence={formData.sequence}
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
        recordName={formData.voucherTypeName}
        currentStatus={formData.status}
        hasDependents={(formData.transactionCount || 0) > 0}
        dependentWarning={`Deactivating voucher type '${formData.voucherTypeName}' (${formData.shortCode}) will prevent accountants and front desk auditors from creating new vouchers with this type.`}
      />

      {/* Delete Protection Alert Dialog */}
      <MasterDeleteProtectionDialog
        isOpen={deleteDialogProps.isOpen}
        onClose={() =>
          setDeleteDialogProps((prev) => ({ ...prev, isOpen: false }))
        }
        recordName={formData.voucherTypeName}
        reason={deleteDialogProps.reason}
        childCount={0}
        transactionCount={deleteDialogProps.transactionCount}
      />
    </ModulePageShell>
  );
}
