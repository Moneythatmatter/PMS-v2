"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  CheckCircle2,
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
  sampleRevenueCategoriesList,
  RevenueCategoryModel,
} from "@/app/data/accounts/revenueCategoryData";
import {
  CompanySelector,
  MasterFormSection,
  MasterAuditInfo,
  MasterActivationDialog,
  MasterDeleteProtectionDialog,
} from "@/components/accounts/MasterComponents";
import { cn } from "@/lib/utils";

export function RevenueCategoryMasterView() {
  // Master Revenue Categories State (strictly 2 initial seed records)
  const [categories, setCategories] = useState<RevenueCategoryModel[]>(sampleRevenueCategoriesList);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("RC-001");

  // Company Selector State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("comp-101");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");

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
      categories.find((c) => c.revenueCategoryId === selectedCategoryId) ||
      categories[0] || {
        revenueCategoryId: "RC-001",
        revenueCategoryCode: "ROOMS",
        revenueCategoryName: "Rooms",
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
  }, [categories, selectedCategoryId]);

  // Form State
  const [formData, setFormData] = useState<RevenueCategoryModel>(activeRecord);

  // Sync Form State when selection changes
  useEffect(() => {
    setFormData({ ...activeRecord });
  }, [activeRecord]);

  // Filtered Revenue Categories List
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      // Status Filter
      if (statusFilter !== "All" && c.status !== statusFilter) return false;
      // Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          c.revenueCategoryId.toLowerCase().includes(q) ||
          c.revenueCategoryCode.toLowerCase().includes(q) ||
          c.revenueCategoryName.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [categories, searchQuery, statusFilter]);

  // Form Field Change Handler
  const handleFormChange = (field: keyof RevenueCategoryModel, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Create New Revenue Category Handler
  const handleNewCategory = () => {
    const nextSeq = categories.length + 1;
    const nextNum = nextSeq < 10 ? `00${nextSeq}` : nextSeq < 100 ? `0${nextSeq}` : `${nextSeq}`;
    const newCategoryId = `RC-${nextNum}`;
    const now = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const newRecord: RevenueCategoryModel = {
      revenueCategoryId: newCategoryId,
      revenueCategoryCode: `CAT${nextSeq}`,
      revenueCategoryName: "Banquet",
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

    setCategories((prev) => [newRecord, ...prev]);
    setSelectedCategoryId(newRecord.revenueCategoryId);
    setFormData(newRecord);
    setToastMessage(`Created new Revenue Category '${newRecord.revenueCategoryName}' (${newRecord.revenueCategoryCode}).`);
  };

  // Save Revenue Category Changes
  const handleSaveCategory = () => {
    if (!formData.revenueCategoryCode.trim()) {
      setToastMessage("Revenue Category Code is required.");
      return;
    }
    if (!formData.revenueCategoryName.trim()) {
      setToastMessage("Revenue Category Name is required.");
      return;
    }

    const currentCompany = formData.companyId || selectedCompanyId;

    // Check code uniqueness within current company
    const codeExists = categories.some(
      (c) =>
        c.revenueCategoryId !== formData.revenueCategoryId &&
        (c.companyId || selectedCompanyId) === currentCompany &&
        c.revenueCategoryCode.trim().toUpperCase() === formData.revenueCategoryCode.trim().toUpperCase()
    );

    if (codeExists) {
      setToastMessage(`Revenue Category Code '${formData.revenueCategoryCode.toUpperCase()}' is already in use for this company.`);
      return;
    }

    // Check name uniqueness within current company
    const nameExists = categories.some(
      (c) =>
        c.revenueCategoryId !== formData.revenueCategoryId &&
        (c.companyId || selectedCompanyId) === currentCompany &&
        c.revenueCategoryName.trim().toLowerCase() === formData.revenueCategoryName.trim().toLowerCase()
    );

    if (nameExists) {
      setToastMessage(`Revenue Category Name '${formData.revenueCategoryName}' is already in use for this company.`);
      return;
    }

    const now = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const updatedRecord: RevenueCategoryModel = {
      ...formData,
      revenueCategoryCode: formData.revenueCategoryCode.trim().toUpperCase(),
      revenueCategoryName: formData.revenueCategoryName.trim(),
      companyId: currentCompany,
      updatedAt: now,
      updatedBy: "Finance Admin",
    };

    setCategories((prev) =>
      prev.map((c) => (c.revenueCategoryId === updatedRecord.revenueCategoryId ? updatedRecord : c))
    );
    setFormData(updatedRecord);
    setToastMessage(`Saved Revenue Category '${updatedRecord.revenueCategoryName}' successfully.`);
  };

  // Revert Form Edits
  const handleResetForm = () => {
    setFormData({ ...activeRecord });
    setToastMessage(`Reverted changes for '${activeRecord.revenueCategoryName}'.`);
  };

  // Toggle Activation Flow
  const handleToggleActivation = () => {
    const targetStatus = formData.status === "Active" ? "Inactive" : "Active";
    const now = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const updatedRecord: RevenueCategoryModel = {
      ...formData,
      status: targetStatus,
      updatedAt: now,
      updatedBy: "Finance Admin",
    };

    setCategories((prev) =>
      prev.map((c) => (c.revenueCategoryId === updatedRecord.revenueCategoryId ? updatedRecord : c))
    );
    setFormData(updatedRecord);
    setToastMessage(
      `Revenue Category '${updatedRecord.revenueCategoryName}' is now ${targetStatus.toUpperCase()}.`
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
    setCategories((prev) => prev.filter((c) => c.revenueCategoryId !== formData.revenueCategoryId));
    setSelectedCategoryId(categories[0]?.revenueCategoryId || "RC-001");
    setToastMessage(`Deleted Revenue Category '${formData.revenueCategoryName}'.`);
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
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleNewCategory}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            New Revenue Category
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSaveCategory}
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
            {filteredCategories.length === 0 ? (
              <div className="p-6 text-center text-slate-400 font-medium">
                No revenue categories match your search or filter.
              </div>
            ) : (
              filteredCategories.map((item) => {
                const isSelected = selectedCategoryId === item.revenueCategoryId;
                return (
                  <div
                    key={item.revenueCategoryId}
                    onClick={() => setSelectedCategoryId(item.revenueCategoryId)}
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

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[11px]">
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        Classification
                      </span>
                      <span className="font-mono text-slate-500 text-[10px] font-semibold">
                        {item.revenueCategoryId}
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
          {/* Header Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-emerald-700" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Revenue Category Details
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Selected: <strong className="text-slate-900">{formData.revenueCategoryName}</strong>{" "}
                  ({formData.revenueCategoryCode})
                </p>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2">
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
            subtitle="Revenue classification identity, reporting code, and operational description."
            icon={<FileText className="h-4 w-4" />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Revenue Category ID (Read-only) */}
              <FormField label="Revenue Category ID">
                <TextInput
                  value={formData.revenueCategoryId}
                  readOnly
                  className="bg-slate-50 font-mono font-bold text-slate-700 cursor-not-allowed"
                />
              </FormField>

              {/* Revenue Category Code (Required, unique per company) */}
              <FormField
                label="Revenue Category Code"
                required
                helperText="Short uppercase code unique within company (e.g. ROOMS, FNB, BANQUET, SPA, LAUNDRY)."
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

              {/* Revenue Category Name (Required, unique per company) */}
              <FormField label="Revenue Category Name" required>
                <TextInput
                  value={formData.revenueCategoryName}
                  onChange={(e) => handleFormChange("revenueCategoryName", e.target.value)}
                  placeholder="e.g. Rooms, F&B, Banquet, Spa & Wellness..."
                  className="font-bold text-slate-900"
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
          <MasterAuditInfo
            idLabel="Revenue Category ID"
            idValue={formData.revenueCategoryId}
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
        recordName={formData.revenueCategoryName}
        currentStatus={formData.status}
        hasDependents={(formData.transactionCount || 0) > 0}
        dependentWarning={`Deactivating revenue category '${formData.revenueCategoryName}' (${formData.revenueCategoryCode}) will prevent billing registers and revenue reports from allocating new charges to this category.`}
      />

      {/* Delete Protection Alert Dialog */}
      <MasterDeleteProtectionDialog
        isOpen={deleteDialogProps.isOpen}
        onClose={() =>
          setDeleteDialogProps((prev) => ({ ...prev, isOpen: false }))
        }
        recordName={formData.revenueCategoryName}
        reason={deleteDialogProps.reason}
        childCount={0}
        transactionCount={deleteDialogProps.transactionCount}
      />
    </ModulePageShell>
  );
}
