"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Building2,
  FolderTree,
  Plus,
  Save,
  RotateCcw,
  Search,
  X,
  Power,
  Trash2,
  Layers,
  FileText,
  CheckCircle2,
  Info,
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
  sampleDivisionsList,
  DivisionModel,
  DivisionType,
} from "@/app/data/accounts/divisionData";
import {
  CompanySelector,
  MasterFormSection,
  MasterAuditInfo,
  MasterActivationDialog,
  MasterDeleteProtectionDialog,
} from "@/components/accounts/MasterComponents";
import { cn } from "@/lib/utils";

export function DivisionMasterView() {
  // Master Divisions State
  const [divisions, setDivisions] = useState<DivisionModel[]>(sampleDivisionsList);
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>("DIV-001");

  // Company Selector State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("comp-101");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [typeFilter, setTypeFilter] = useState<"All" | DivisionType>("All");

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
      divisions.find((d) => d.divisionId === selectedDivisionId) ||
      divisions[0] || {
        divisionId: "DIV-001",
        divisionCode: "ROOMS",
        divisionName: "Rooms",
        shortName: "RMS",
        divisionType: "Revenue Department" as DivisionType,
        sequence: 1,
        status: "Active" as const,
        description: "",
        companyId: "CMP-001",
        createdAt: "01 Apr 2024",
        updatedAt: "01 Apr 2024",
        createdBy: "Finance Admin",
        updatedBy: "Finance Admin",
        hasTransactions: false,
        transactionCount: 0,
      }
    );
  }, [divisions, selectedDivisionId]);

  // Form State
  const [formData, setFormData] = useState<DivisionModel>(activeRecord);

  // Sync Form State when selection changes
  useEffect(() => {
    setFormData({ ...activeRecord });
  }, [activeRecord]);

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
            d.divisionId.toLowerCase().includes(q) ||
            d.divisionCode.toLowerCase().includes(q) ||
            d.divisionName.toLowerCase().includes(q) ||
            (d.shortName && d.shortName.toLowerCase().includes(q)) ||
            (d.description && d.description.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => a.sequence - b.sequence);
  }, [divisions, searchQuery, statusFilter, typeFilter]);

  // Available Parent Divisions (excluding self and any circular descendants)
  const availableParents = useMemo(() => {
    return divisions.filter((d) => d.divisionId !== formData.divisionId);
  }, [divisions, formData.divisionId]);

  // Child divisions count for current record
  const childDivisions = useMemo(() => {
    return divisions.filter((d) => d.parentDivisionId === formData.divisionId);
  }, [divisions, formData.divisionId]);

  // Form Change Handler
  const handleFormChange = (field: keyof DivisionModel, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Create New Division Handler
  const handleNewDivision = () => {
    const nextSeq = divisions.length + 1;
    const nextNum = nextSeq < 10 ? `00${nextSeq}` : nextSeq < 100 ? `0${nextSeq}` : `${nextSeq}`;
    const newDivisionId = `DIV-${nextNum}`;
    const now = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const newRecord: DivisionModel = {
      divisionId: newDivisionId,
      divisionCode: `DEPT${nextSeq}`,
      divisionName: "New Department",
      shortName: `D${nextSeq}`,
      divisionType: "Support Department",
      sequence: nextSeq,
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

    setDivisions((prev) => [newRecord, ...prev]);
    setSelectedDivisionId(newRecord.divisionId);
    setFormData(newRecord);
    setToastMessage(`Created new Division '${newRecord.divisionName}' (${newRecord.divisionId}).`);
  };

  // Save Division Changes
  const handleSaveDivision = () => {
    if (!formData.divisionCode.trim()) {
      setToastMessage("Division Code is required.");
      return;
    }
    if (!formData.divisionName.trim()) {
      setToastMessage("Division Name is required.");
      return;
    }

    // Check code uniqueness among other records
    const codeExists = divisions.some(
      (d) =>
        d.divisionId !== formData.divisionId &&
        d.divisionCode.trim().toUpperCase() === formData.divisionCode.trim().toUpperCase()
    );

    if (codeExists) {
      setToastMessage(`Division Code '${formData.divisionCode.toUpperCase()}' is already in use.`);
      return;
    }

    const now = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const updatedRecord: DivisionModel = {
      ...formData,
      divisionCode: formData.divisionCode.trim().toUpperCase(),
      divisionName: formData.divisionName.trim(),
      shortName: (formData.shortName || "").trim().toUpperCase(),
      updatedAt: now,
      updatedBy: "Finance Admin",
    };

    setDivisions((prev) =>
      prev.map((d) => (d.divisionId === updatedRecord.divisionId ? updatedRecord : d))
    );
    setFormData(updatedRecord);
    setToastMessage(`Saved Division '${updatedRecord.divisionName}' successfully.`);
  };

  // Revert Form Edits
  const handleResetForm = () => {
    setFormData({ ...activeRecord });
    setToastMessage(`Reverted changes for '${activeRecord.divisionName}'.`);
  };

  // Toggle Activation Flow
  const handleToggleActivation = () => {
    const targetStatus = formData.status === "Active" ? "Inactive" : "Active";
    const now = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const updatedRecord: DivisionModel = {
      ...formData,
      status: targetStatus,
      updatedAt: now,
      updatedBy: "Finance Admin",
    };

    setDivisions((prev) =>
      prev.map((d) => (d.divisionId === updatedRecord.divisionId ? updatedRecord : d))
    );
    setFormData(updatedRecord);
    setToastMessage(
      `Division '${updatedRecord.divisionName}' is now ${targetStatus.toUpperCase()}.`
    );
  };

  // Attempt Delete Flow with Protection Checks
  const handleDeleteAttempt = () => {
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
    if (formData.hasTransactions || (formData.transactionCount || 0) > 0) {
      setDeleteDialogProps({
        isOpen: true,
        reason: "has_transactions",
        childCount: 0,
        transactionCount: formData.transactionCount || 0,
      });
      return;
    }

    // Permitted to delete if 0 transactions and 0 child divisions
    setDivisions((prev) => prev.filter((d) => d.divisionId !== formData.divisionId));
    setSelectedDivisionId(divisions[0]?.divisionId || "DIV-001");
    setToastMessage(`Deleted Division '${formData.divisionName}'.`);
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
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleNewDivision}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            New Division
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSaveDivision}
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
            {filteredDivisions.length === 0 ? (
              <div className="p-6 text-center text-slate-400 font-medium">
                No divisions match your search or filter.
              </div>
            ) : (
              filteredDivisions.map((item) => {
                const isSelected = selectedDivisionId === item.divisionId;
                return (
                  <div
                    key={item.divisionId}
                    onClick={() => setSelectedDivisionId(item.divisionId)}
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
                  Selected: <strong className="text-slate-900">{formData.divisionName}</strong>{" "}
                  ({formData.divisionCode})
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
                  value={formData.divisionId}
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
                    handleFormChange("divisionType", e.target.value as DivisionType)
                  }
                >
                  <option value="Revenue Department">Revenue Department</option>
                  <option value="Support Department">Support Department</option>
                  <option value="Administrative Department">Administrative Department</option>
                  <option value="Other">Other</option>
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
                    handleFormChange("parentDivisionId", e.target.value || undefined)
                  }
                >
                  <option value="">None (Top-Level Division)</option>
                  {availableParents.map((parent) => (
                    <option key={parent.divisionId} value={parent.divisionId}>
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
            idValue={formData.divisionId}
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
