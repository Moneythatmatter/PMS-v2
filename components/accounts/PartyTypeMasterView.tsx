"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Users,
  Building2,
  CheckCircle2,
  Plus,
  Save,
  RotateCcw,
  Search,
  X,
  ShieldCheck,
  Info,
  ChevronRight,
  Sliders,
  Tag,
  Ban,
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
  samplePartyTypesList,
  PartyTypeModel,
} from "@/app/data/accounts/partyTypeData";
import { cn } from "@/lib/utils";

export function PartyTypeMasterView() {
  // Master Party Types State
  const [partyTypes, setPartyTypes] = useState<PartyTypeModel[]>(samplePartyTypesList);
  const [selectedTypeId, setSelectedTypeId] = useState<string>("PTY-001");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Active Selected Party Type
  const activePartyType = useMemo(
    () => partyTypes.find((p) => p.partyTypeId === selectedTypeId) || partyTypes[0],
    [partyTypes, selectedTypeId]
  );

  // Form State (for editing active record)
  const [formData, setFormData] = useState<PartyTypeModel>(activePartyType);

  // Sync Form State when selection changes
  useEffect(() => {
    setFormData({ ...activePartyType });
  }, [activePartyType]);

  // Create Party Type Form State
  const [createForm, setCreateForm] = useState<Omit<PartyTypeModel, "partyTypeId" | "createdAt" | "updatedAt">>({
    typeCode: "",
    typeName: "",
    description: "",
    sequence: partyTypes.length + 1,
    status: "Active",
  });

  // Filtered List
  const filteredPartyTypes = useMemo(() => {
    return partyTypes
      .filter((p) => {
        if (statusFilter !== "All" && p.status !== statusFilter) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            p.typeCode.toLowerCase().includes(q) ||
            p.typeName.toLowerCase().includes(q) ||
            (p.description || "").toLowerCase().includes(q) ||
            p.partyTypeId.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => a.sequence - b.sequence);
  }, [partyTypes, searchQuery, statusFilter]);

  // Form Field Change Handler
  const handleFormChange = (field: keyof PartyTypeModel, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Save Active Party Type Edits
  const handleSavePartyType = () => {
    const normCode = formData.typeCode.trim().toUpperCase();
    const normName = formData.typeName.trim();

    if (!normCode) {
      setToastMessage("Please enter a valid Party Type Code.");
      return;
    }
    if (!normName) {
      setToastMessage("Please enter a Party Type Name.");
      return;
    }

    // Check duplicate code or name with other records
    const isDuplicate = partyTypes.some(
      (p) =>
        p.partyTypeId !== formData.partyTypeId &&
        (p.typeCode.toUpperCase() === normCode || p.typeName.toLowerCase() === normName.toLowerCase())
    );
    if (isDuplicate) {
      setToastMessage(`Party Type code '${normCode}' or name '${normName}' already exists.`);
      return;
    }

    setPartyTypes((prev) =>
      prev.map((p) =>
        p.partyTypeId === formData.partyTypeId
          ? {
              ...formData,
              typeCode: normCode,
              typeName: normName,
              updatedAt: new Date().toLocaleDateString("en-IN"),
            }
          : p
      )
    );
    setToastMessage(`Saved Party Type configuration for '${normName}'.`);
  };

  // Toggle Active / Inactive Status
  const handleToggleStatus = () => {
    const nextStatus = formData.status === "Active" ? "Inactive" : "Active";
    setPartyTypes((prev) =>
      prev.map((p) =>
        p.partyTypeId === formData.partyTypeId
          ? { ...p, status: nextStatus, updatedAt: new Date().toLocaleDateString("en-IN") }
          : p
      )
    );
    setFormData((prev) => ({ ...prev, status: nextStatus }));
    setToastMessage(
      nextStatus === "Inactive"
        ? `Deactivated Party Type '${formData.typeName}'. New parties cannot be created under this type.`
        : `Activated Party Type '${formData.typeName}'.`
    );
  };

  // Create New Party Type Handler
  const handleCreatePartyType = () => {
    const normCode = createForm.typeCode.trim().toUpperCase();
    const normName = createForm.typeName.trim();

    if (!normCode) {
      setToastMessage("Please enter a Party Type Code (e.g. CUST, VEND).");
      return;
    }
    if (!normName) {
      setToastMessage("Please enter the Party Type Name.");
      return;
    }

    // Duplicate validation
    const exists = partyTypes.some(
      (p) => p.typeCode.toUpperCase() === normCode || p.typeName.toLowerCase() === normName.toLowerCase()
    );
    if (exists) {
      setToastMessage(`Party Type '${normCode}' or '${normName}' already exists.`);
      return;
    }

    const nextNum = partyTypes.length + 1;
    const newRecord: PartyTypeModel = {
      ...createForm,
      typeCode: normCode,
      typeName: normName,
      partyTypeId: `PTY-00${nextNum}`,
      createdAt: new Date().toLocaleDateString("en-IN"),
      updatedAt: new Date().toLocaleDateString("en-IN"),
    };

    setPartyTypes([...partyTypes, newRecord]);
    setSelectedTypeId(newRecord.partyTypeId);
    setShowCreateModal(false);
    setCreateForm({
      typeCode: "",
      typeName: "",
      description: "",
      sequence: partyTypes.length + 2,
      status: "Active",
    });
    setToastMessage(`Created new Party Type '${newRecord.typeName}' (${newRecord.typeCode}).`);
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & Masters"
      title="Party Type"
      description="Define broad accounting relationship categories for customers, vendors, agents, employees, and statutory authorities."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Masters", href: "/accounts/masters" },
        { label: "Party Type" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Create Party Type
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSavePartyType}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-800 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 mr-1 text-emerald-700" />
            Save Changes
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setFormData({ ...activePartyType });
              setToastMessage("Reset unsaved edits.");
            }}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Reset
          </Button>
        </div>
      }
    >
      {/* Top Company Context Header & Scope Banner */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <Building2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <span className="text-[11px] font-bold text-slate-500 block uppercase">Target Company Entity:</span>
              <span className="font-bold text-xs text-slate-900">
                HOTEL & RESORTS PRIVATE LIMITED (CMP-001)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-emerald-900 border border-emerald-200 font-bold">
              <Users className="h-4 w-4 text-emerald-700" />
              <span>Registered Party Types: {partyTypes.length} Categories</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        {/* LEFT COLUMN: Party Types Table / List (5 Cols) */}
        <div className="md:col-span-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col min-h-[560px]">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Tag className="h-4.5 w-4.5 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Relationship Types
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredPartyTypes.length} Types
            </span>
          </div>

          {/* Search & Status Filters */}
          <div className="space-y-2 mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search party types..."
                className="h-8 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-8 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 text-[11px]">
              {(["All", "Active", "Inactive"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer",
                    statusFilter === st
                      ? "bg-emerald-700 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Party Types Cards List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[440px]">
            {filteredPartyTypes.map((p) => {
              const isSelected = p.partyTypeId === selectedTypeId;
              return (
                <div
                  key={p.partyTypeId}
                  onClick={() => setSelectedTypeId(p.partyTypeId)}
                  className={cn(
                    "p-3 rounded-xl border transition-all cursor-pointer select-none space-y-1.5",
                    isSelected
                      ? "border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-600/30"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 bg-white"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {p.typeCode}
                        </span>

                        <span className="font-bold text-xs text-slate-900">
                          {p.typeName}
                        </span>

                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                            p.status === "Active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-600"
                          )}
                        >
                          {p.status}
                        </span>
                      </div>

                      {p.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-1 font-medium">
                          {p.description}
                        </p>
                      )}
                    </div>

                    <ChevronRight
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform mt-1",
                        isSelected ? "text-emerald-700 translate-x-0.5" : "text-slate-400"
                      )}
                    />
                  </div>

                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{p.partyTypeId}</span>
                    <span className="text-slate-600 font-semibold font-sans">Order #{p.sequence}</span>
                  </div>
                </div>
              );
            })}

            {filteredPartyTypes.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                No party types match your search.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Selected Party Type Configuration (7 Cols) */}
        <div className="md:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 font-mono">
                  {formData.typeName} ({formData.typeCode})
                </h3>
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                    formData.status === "Active"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-600"
                  )}
                >
                  {formData.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Party Type ID: <strong className="font-mono text-slate-700">{formData.partyTypeId}</strong> • Display Sequence:{" "}
                <strong className="font-bold text-slate-800">#{formData.sequence}</strong>
              </p>
            </div>

            {/* Toggle Status Action */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggleStatus}
              className={cn(
                "rounded-xl text-xs font-bold border cursor-pointer",
                formData.status === "Active"
                  ? "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                  : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
              )}
            >
              {formData.status === "Active" ? (
                <>
                  <Ban className="h-3.5 w-3.5 mr-1 text-slate-500" />
                  Deactivate Type
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                  Activate Type
                </>
              )}
            </Button>
          </div>

          {/* Form Content */}
          <div className="text-xs space-y-4 pt-1">
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-emerald-600" />
                Party Classification Particulars
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Party Type ID">
                  <TextInput
                    value={formData.partyTypeId}
                    readOnly
                    className="bg-slate-100 font-mono font-bold text-slate-700 cursor-not-allowed h-9"
                  />
                </FormField>

                <FormField label="Type Code" required>
                  <TextInput
                    value={formData.typeCode || ""}
                    onChange={(e) => handleFormChange("typeCode", e.target.value.toUpperCase())}
                    maxLength={6}
                    placeholder="e.g. CUST"
                    className="bg-white font-mono font-bold uppercase text-slate-900 h-9"
                  />
                </FormField>

                <FormField label="Party Type Name" required>
                  <TextInput
                    value={formData.typeName || ""}
                    onChange={(e) => handleFormChange("typeName", e.target.value)}
                    placeholder="e.g. Customer"
                    className="bg-white font-bold text-slate-900 h-9"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Sequence / Display Order" required>
                  <TextInput
                    type="number"
                    min={1}
                    value={formData.sequence}
                    onChange={(e) => handleFormChange("sequence", parseInt(e.target.value) || 1)}
                    className="bg-white font-mono font-bold text-slate-900 h-9"
                  />
                </FormField>

                <FormField label="System Status" required>
                  <SelectInput
                    value={formData.status}
                    onChange={(e) => handleFormChange("status", e.target.value)}
                    className="bg-white font-bold h-9"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </SelectInput>
                </FormField>
              </div>

              <FormField label="Description (Optional)">
                <TextAreaInput
                  rows={3}
                  value={formData.description || ""}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  placeholder="Describe the nature of this accounting relationship..."
                  className="bg-white text-xs leading-relaxed"
                />
              </FormField>

              {/* Informational Guidance on PMS Hierarchy */}
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-slate-700 text-[11px] space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                  <Info className="h-4 w-4 text-emerald-700 shrink-0" />
                  <span>Hierarchy Architecture Rule:</span>
                </div>
                <p className="leading-relaxed">
                  <strong>Party Type</strong> defines broad accounting relationship categories (e.g. <em>Customer</em>, <em>Vendor</em>). Detailed business classifications (e.g. <em>Individual Guest</em>, <em>Corporate Client</em>, <em>Food Supplier</em>) are defined under <strong>Party Sub Type</strong>. Actual commercial terms (credit limit, credit days, GSTIN) are configured on individual parties in <strong>Party Master</strong>.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSavePartyType}
                  className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
                >
                  <Save className="h-3.5 w-3.5 mr-1" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE PARTY TYPE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <Plus className="h-5 w-5 text-emerald-600" />
                <span>Create New Party Type</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Type Code" required>
                  <TextInput
                    value={createForm.typeCode}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, typeCode: e.target.value.toUpperCase() }))
                    }
                    maxLength={6}
                    placeholder="e.g. CUST"
                    className="bg-white font-mono font-bold uppercase h-9"
                  />
                </FormField>

                <FormField label="Sequence Order" required>
                  <TextInput
                    type="number"
                    min={1}
                    value={createForm.sequence}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, sequence: parseInt(e.target.value) || 1 }))
                    }
                    className="bg-white font-mono font-bold h-9"
                  />
                </FormField>
              </div>

              <FormField label="Party Type Name" required>
                <TextInput
                  value={createForm.typeName}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, typeName: e.target.value }))
                  }
                  placeholder="e.g. Customer"
                  className="bg-white font-bold h-9"
                />
              </FormField>

              <FormField label="Description (Optional)">
                <TextAreaInput
                  rows={2}
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Describe this party category..."
                  className="bg-white text-xs"
                />
              </FormField>

              <FormField label="Initial Status" required>
                <SelectInput
                  value={createForm.status}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, status: e.target.value as any }))
                  }
                  className="bg-white font-bold h-9"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </SelectInput>
              </FormField>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleCreatePartyType}
                className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
              >
                Create Party Type
              </Button>
            </div>
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
