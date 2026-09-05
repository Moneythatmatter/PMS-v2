"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Tag,
  Building2,
  CheckCircle2,
  Plus,
  Save,
  RotateCcw,
  Search,
  X,
  Info,
  ChevronRight,
  Sliders,
  Ban,
  Layers,
  Lock,
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
import {
  samplePartySubTypesList,
  PartySubTypeModel,
} from "@/app/data/accounts/partySubTypeData";
import {
  samplePartyTypesList,
  PartyTypeModel,
} from "@/app/data/accounts/partyTypeData";
import {
  samplePartyMasterData,
  PartyMasterRecord,
} from "@/app/data/accounts/partyMasterData";
import { cn } from "@/lib/utils";

export function PartySubTypeMasterView() {
  // Master Party Types & Sub Types State
  const [partyTypes] = useState<PartyTypeModel[]>(samplePartyTypesList);
  const [subTypes, setSubTypes] = useState<PartySubTypeModel[]>(samplePartySubTypesList);
  const [selectedSubTypeId, setSelectedSubTypeId] = useState<string>("PST-001");

  // Filter & Search State
  const [parentTypeFilter, setParentTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Deactivate Confirmation Modal State
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState<boolean>(false);

  // Helper map for quick party type name lookup
  const partyTypeMap = useMemo(() => {
    const map = new Map<string, PartyTypeModel>();
    partyTypes.forEach((pt) => map.set(pt.partyTypeId, pt));
    return map;
  }, [partyTypes]);

  // Active Selected Sub Type
  const activeSubType = useMemo(
    () => subTypes.find((s) => s.partySubTypeId === selectedSubTypeId) || subTypes[0],
    [subTypes, selectedSubTypeId]
  );

  // Form State (for editing active record)
  const [formData, setFormData] = useState<PartySubTypeModel>(activeSubType);

  // Sync Form State when active selection changes
  useEffect(() => {
    if (activeSubType) {
      setFormData({ ...activeSubType });
    }
  }, [activeSubType]);

  // Check if current active Sub Type is referenced by any Party Master record
  const referencedParties = useMemo(() => {
    if (!activeSubType) return [];
    return samplePartyMasterData.filter(
      (pm) => pm.partySubTypeId === activeSubType.partySubTypeId
    );
  }, [activeSubType]);

  const isParentLocked = referencedParties.length > 0;

  // Create Sub Type Form State
  const [createForm, setCreateForm] = useState<Omit<PartySubTypeModel, "partySubTypeId" | "createdAt" | "updatedAt">>({
    partyTypeId: "PTY-001",
    subTypeCode: "",
    subTypeName: "",
    description: "",
    sequence: 1,
    status: "Active",
  });

  // Calculate default sequence when parent party type changes in create modal
  useEffect(() => {
    if (showCreateModal) {
      const existingInParent = subTypes.filter((s) => s.partyTypeId === createForm.partyTypeId);
      setCreateForm((prev) => ({
        ...prev,
        sequence: existingInParent.length + 1,
      }));
    }
  }, [createForm.partyTypeId, showCreateModal, subTypes]);

  // Filtered List
  const filteredSubTypes = useMemo(() => {
    return subTypes
      .filter((s) => {
        // Parent Type Filter
        if (parentTypeFilter !== "ALL" && s.partyTypeId !== parentTypeFilter) {
          return false;
        }
        // Status Filter
        if (statusFilter !== "All" && s.status !== statusFilter) {
          return false;
        }
        // Search Query Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const parentName = partyTypeMap.get(s.partyTypeId)?.typeName?.toLowerCase() || "";
          return (
            s.partySubTypeId.toLowerCase().includes(q) ||
            s.subTypeCode.toLowerCase().includes(q) ||
            s.subTypeName.toLowerCase().includes(q) ||
            (s.description || "").toLowerCase().includes(q) ||
            parentName.includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        // Group by parent type first if all types are displayed, then sequence
        if (parentTypeFilter === "ALL") {
          if (a.partyTypeId !== b.partyTypeId) {
            return a.partyTypeId.localeCompare(b.partyTypeId);
          }
        }
        return a.sequence - b.sequence;
      });
  }, [subTypes, parentTypeFilter, statusFilter, searchQuery, partyTypeMap]);

  // Form Field Change Handler
  const handleFormChange = (field: keyof PartySubTypeModel, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Save Active Party Sub Type Edits
  const handleSaveSubType = () => {
    if (!formData) return;

    const normCode = formData.subTypeCode.trim().toUpperCase();
    const normName = formData.subTypeName.trim();

    if (!formData.partyTypeId) {
      setToastMessage("Please select a valid Parent Party Type.");
      return;
    }

    // Protection: If referenced, Parent Party Type cannot be changed
    if (isParentLocked && formData.partyTypeId !== activeSubType.partyTypeId) {
      setToastMessage(
        `Cannot change Parent Party Type: This Sub Type is referenced by ${referencedParties.length} Party Master record(s).`
      );
      return;
    }

    if (!normCode) {
      setToastMessage("Please enter a valid Sub Type Code.");
      return;
    }
    if (!normName) {
      setToastMessage("Please enter a Sub Type Name.");
      return;
    }

    // Check duplicate code or name within the selected Parent Party Type
    const isDuplicate = subTypes.some(
      (s) =>
        s.partySubTypeId !== formData.partySubTypeId &&
        s.partyTypeId === formData.partyTypeId &&
        (s.subTypeCode.toUpperCase() === normCode ||
          s.subTypeName.toLowerCase() === normName.toLowerCase())
    );

    if (isDuplicate) {
      const parentName = partyTypeMap.get(formData.partyTypeId)?.typeName || "selected Party Type";
      setToastMessage(`Sub Type code '${normCode}' or name '${normName}' already exists under '${parentName}'.`);
      return;
    }

    setSubTypes((prev) =>
      prev.map((s) =>
        s.partySubTypeId === formData.partySubTypeId
          ? {
              ...formData,
              subTypeCode: normCode,
              subTypeName: normName,
              updatedAt: new Date().toLocaleDateString("en-IN"),
            }
          : s
      )
    );
    setToastMessage(`Saved Party Sub Type classification for '${normName}'.`);
  };

  // Toggle Active / Inactive Status
  const handleToggleStatus = () => {
    if (!formData) return;

    if (formData.status === "Active") {
      // Prompt confirmation before deactivating
      setShowDeactivateConfirm(true);
    } else {
      // Direct reactivate
      const nextStatus = "Active";
      setSubTypes((prev) =>
        prev.map((s) =>
          s.partySubTypeId === formData.partySubTypeId
            ? { ...s, status: nextStatus, updatedAt: new Date().toLocaleDateString("en-IN") }
            : s
        )
      );
      setFormData((prev) => ({ ...prev, status: nextStatus }));
      setToastMessage(`Activated Party Sub Type '${formData.subTypeName}'.`);
    }
  };

  // Confirm Deactivation Action
  const handleConfirmDeactivate = () => {
    const nextStatus = "Inactive";
    setSubTypes((prev) =>
      prev.map((s) =>
        s.partySubTypeId === formData.partySubTypeId
          ? { ...s, status: nextStatus, updatedAt: new Date().toLocaleDateString("en-IN") }
          : s
      )
    );
    setFormData((prev) => ({ ...prev, status: nextStatus }));
    setShowDeactivateConfirm(false);
    setToastMessage(
      `Deactivated Party Sub Type '${formData.subTypeName}'. This classification will no longer be available for new Party Master records.`
    );
  };

  // Create New Party Sub Type Handler
  const handleCreateSubType = () => {
    const normCode = createForm.subTypeCode.trim().toUpperCase();
    const normName = createForm.subTypeName.trim();

    if (!createForm.partyTypeId) {
      setToastMessage("Please select a Parent Party Type.");
      return;
    }
    if (!normCode) {
      setToastMessage("Please enter a Sub Type Code (e.g. CUST-VIP, VEND-IT).");
      return;
    }
    if (!normName) {
      setToastMessage("Please enter the Sub Type Name.");
      return;
    }

    // Duplicate validation within parent party type
    const exists = subTypes.some(
      (s) =>
        s.partyTypeId === createForm.partyTypeId &&
        (s.subTypeCode.toUpperCase() === normCode ||
          s.subTypeName.toLowerCase() === normName.toLowerCase())
    );

    if (exists) {
      const parentName = partyTypeMap.get(createForm.partyTypeId)?.typeName || "selected Party Type";
      setToastMessage(`Sub Type '${normCode}' or '${normName}' already exists under '${parentName}'.`);
      return;
    }

    const nextIdNum = subTypes.length + 1;
    const padStr = nextIdNum < 10 ? `00${nextIdNum}` : nextIdNum < 100 ? `0${nextIdNum}` : `${nextIdNum}`;
    const newRecord: PartySubTypeModel = {
      ...createForm,
      partySubTypeId: `PST-${padStr}`,
      subTypeCode: normCode,
      subTypeName: normName,
      createdAt: new Date().toLocaleDateString("en-IN"),
      updatedAt: new Date().toLocaleDateString("en-IN"),
    };

    setSubTypes([...subTypes, newRecord]);
    setSelectedSubTypeId(newRecord.partySubTypeId);
    setShowCreateModal(false);
    setCreateForm({
      partyTypeId: createForm.partyTypeId,
      subTypeCode: "",
      subTypeName: "",
      description: "",
      sequence: 1,
      status: "Active",
    });
    setToastMessage(`Created new Party Sub Type '${newRecord.subTypeName}' (${newRecord.subTypeCode}).`);
  };

  const currentParentType = partyTypeMap.get(formData?.partyTypeId);

  return (
    <ModulePageShell
      eyebrow="Accounts & Masters"
      title="Party Sub Type Master"
      description="Define specific accounting classifications under each Party Type."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Masters", href: "/accounts/masters" },
        { label: "Party Sub Type Master" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              // Pre-select current filter if specific parent is selected
              if (parentTypeFilter !== "ALL") {
                setCreateForm((prev) => ({ ...prev, partyTypeId: parentTypeFilter }));
              }
              setShowCreateModal(true);
            }}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Create Party Sub Type
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveSubType}
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
              if (activeSubType) {
                setFormData({ ...activeSubType });
                setToastMessage("Reset unsaved edits.");
              }
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
              <span className="text-[11px] font-bold text-slate-500 block uppercase">Parent Hierarchy Context:</span>
              <span className="font-bold text-xs text-slate-900">
                Party Type → Party Sub Type → Party Master
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-emerald-900 border border-emerald-200 font-bold">
              <Layers className="h-4 w-4 text-emerald-700" />
              <span>Configured Sub Types: {subTypes.length} Classifications</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        {/* LEFT COLUMN: Party Sub Types Table / List (5 Cols) */}
        <div className="md:col-span-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col min-h-[580px]">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Tag className="h-4.5 w-4.5 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Party Sub Types
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredSubTypes.length} Items
            </span>
          </div>

          {/* Filters Bar: Parent Party Type, Search & Status Filters */}
          <div className="space-y-2.5 mb-3">
            {/* Parent Party Type Filter Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Parent Party Type:
              </label>
              <SelectInput
                value={parentTypeFilter}
                onChange={(e) => setParentTypeFilter(e.target.value)}
                className="bg-white font-bold text-xs h-8.5 text-slate-900 border-slate-300"
              >
                <option value="ALL">All Parent Party Types</option>
                {partyTypes.map((pt) => (
                  <option key={pt.partyTypeId} value={pt.partyTypeId}>
                    {pt.typeName} ({pt.typeCode})
                  </option>
                ))}
              </SelectInput>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sub type code, name, ID..."
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

            {/* Status Filter Buttons */}
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

          {/* Party Sub Types Cards List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[460px]">
            {filteredSubTypes.map((s) => {
              const isSelected = s.partySubTypeId === selectedSubTypeId;
              const parent = partyTypeMap.get(s.partyTypeId);
              return (
                <div
                  key={s.partySubTypeId}
                  onClick={() => setSelectedSubTypeId(s.partySubTypeId)}
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
                          {s.subTypeCode}
                        </span>

                        <span className="font-bold text-xs text-slate-900">
                          {s.subTypeName}
                        </span>

                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                            s.status === "Active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-600"
                          )}
                        >
                          {s.status}
                        </span>
                      </div>

                      {s.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-1 font-medium">
                          {s.description}
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

                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <span className="text-slate-400">{s.partySubTypeId}</span>
                      <span>•</span>
                      <span className="text-emerald-800 font-bold font-sans">
                        {parent?.typeName || "Unknown Parent"}
                      </span>
                    </span>
                    <span className="text-slate-600 font-semibold font-sans">Order #{s.sequence}</span>
                  </div>
                </div>
              );
            })}

            {filteredSubTypes.length === 0 && (
              <div className="text-center py-10 text-xs text-slate-400">
                No party sub types match your search criteria.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Selected Party Sub Type Details / Form (7 Cols) */}
        <div className="md:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="h-5 w-5 text-emerald-600 shrink-0" />
                <h3 className="text-base font-bold text-slate-900 font-mono">
                  {formData.subTypeName} ({formData.subTypeCode})
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
                {isParentLocked && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    <Lock className="h-3 w-3 text-amber-700" />
                    {referencedParties.length} Party Master Ref{referencedParties.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Parent Party Type:{" "}
                <strong className="text-emerald-800 font-bold">
                  {currentParentType?.typeName} ({currentParentType?.typeCode})
                </strong>{" "}
                • ID: <strong className="font-mono text-slate-700">{formData.partySubTypeId}</strong> • Display Sequence:{" "}
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
                  Deactivate Sub Type
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                  Activate Sub Type
                </>
              )}
            </Button>
          </div>

          {/* Form Content */}
          <div className="text-xs space-y-4 pt-1">
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-emerald-600" />
                Classification Particulars
              </h4>

              {/* Referenced Warning Alert */}
              {isParentLocked && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                  <Lock className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Parent Party Type Protected:</span>
                    <span className="text-[11px] text-amber-800 leading-relaxed block mt-0.5">
                      This Sub Type is referenced by <strong>{referencedParties.length}</strong> Party Master record(s) (e.g. <em>{referencedParties.slice(0, 2).map((p) => p.partyName).join(", ")}{referencedParties.length > 2 ? "..." : ""}</em>). Parent Party Type is locked to prevent invalidating existing party accounting relationships.
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Party Sub Type ID">
                  <TextInput
                    value={formData.partySubTypeId}
                    readOnly
                    className="bg-slate-100 font-mono font-bold text-slate-700 cursor-not-allowed h-9"
                  />
                </FormField>

                <FormField
                  label={isParentLocked ? "Parent Party Type (Locked - Referenced)" : "Parent Party Type"}
                  required
                >
                  <SelectInput
                    value={formData.partyTypeId}
                    onChange={(e) => handleFormChange("partyTypeId", e.target.value)}
                    disabled={isParentLocked}
                    className={cn(
                      "font-bold text-slate-900 h-9",
                      isParentLocked ? "bg-slate-100 text-slate-600 cursor-not-allowed border-slate-200" : "bg-white"
                    )}
                  >
                    {partyTypes.map((pt) => (
                      <option key={pt.partyTypeId} value={pt.partyTypeId}>
                        {pt.typeName} ({pt.typeCode})
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Sub Type Code" required>
                  <TextInput
                    value={formData.subTypeCode || ""}
                    onChange={(e) => handleFormChange("subTypeCode", e.target.value.toUpperCase())}
                    maxLength={15}
                    placeholder="e.g. CUST-GUEST"
                    className="bg-white font-mono font-bold uppercase text-slate-900 h-9"
                  />
                </FormField>

                <FormField label="Sub Type Name" required>
                  <TextInput
                    value={formData.subTypeName || ""}
                    onChange={(e) => handleFormChange("subTypeName", e.target.value)}
                    placeholder="e.g. Individual Guest"
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
                  placeholder="Describe the nature of this specific classification within the selected Party Type..."
                  className="bg-white text-xs leading-relaxed"
                />
              </FormField>

              {/* Informational Guidance on PMS Hierarchy */}
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-slate-700 text-[11px] space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                  <Info className="h-4 w-4 text-emerald-700 shrink-0" />
                  <span>Hotel PMS Accounting Hierarchy:</span>
                </div>
                <p className="leading-relaxed">
                  <strong>Party Type</strong> (e.g. <em>Customer</em>, <em>Vendor</em>) represents broad accounting relationships.
                  <br />
                  <strong>Party Sub Type</strong> (e.g. <em>Individual Guest</em>, <em>Corporate Client</em>) defines granular classification within that relationship.
                  <br />
                  Commercial terms, credit policies, tax rules, and billing details belong exclusively to <strong>Party Master</strong> and statutory master tables.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveSubType}
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

      {/* CREATE PARTY SUB TYPE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <Plus className="h-5 w-5 text-emerald-600" />
                <span>Create New Party Sub Type</span>
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
              <FormField label="Parent Party Type" required>
                <SelectInput
                  value={createForm.partyTypeId}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, partyTypeId: e.target.value }))
                  }
                  className="bg-white font-bold h-9 text-slate-900"
                >
                  {partyTypes
                    .filter((pt) => pt.status === "Active")
                    .map((pt) => (
                      <option key={pt.partyTypeId} value={pt.partyTypeId}>
                        {pt.typeName} ({pt.typeCode})
                      </option>
                    ))}
                </SelectInput>
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Sub Type Code" required>
                  <TextInput
                    value={createForm.subTypeCode}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, subTypeCode: e.target.value.toUpperCase() }))
                    }
                    maxLength={15}
                    placeholder="e.g. CUST-CORP"
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

              <FormField label="Sub Type Name" required>
                <TextInput
                  value={createForm.subTypeName}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, subTypeName: e.target.value }))
                  }
                  placeholder="e.g. Corporate Client"
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
                  placeholder="Describe this party classification..."
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
                onClick={handleCreateSubType}
                className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
              >
                Create Party Sub Type
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DEACTIVATION MODAL */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-5 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Ban className="h-5 w-5 text-amber-600" />
              <span>Deactivate Party Sub Type?</span>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Are you sure you want to deactivate{" "}
              <strong className="text-slate-900 font-bold">
                {formData.subTypeName} ({formData.subTypeCode})
              </strong>
              ?
              <br />
              <br />
              Inactive sub types cannot be selected for new Party Master records, but existing historical records will remain intact. You can reactivate this sub type at any time.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDeactivateConfirm(false)}
                className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmDeactivate}
                className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
              >
                Confirm Deactivation
              </Button>
            </div>
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
