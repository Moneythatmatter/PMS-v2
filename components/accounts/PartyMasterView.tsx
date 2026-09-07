"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Save,
  X,
  RotateCcw,
  CheckCircle2,
  Building2,
  Phone,
  MapPin,
  CreditCard,
  Building,
  ChevronRight,
  Ban,
  Tag,
  Lock,
  AlertTriangle,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  SelectInput,
  TextAreaInput,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  PartyModel,
  samplePartyMasterData,
  sampleGSTRegistrationTypes,
  sampleEntityTypes,
  samplePaymentMethods,
  sampleStatesList,
  sampleReceivableAccounts,
  samplePayableAccounts,
} from "@/app/data/accounts/partyMasterData";
import {
  samplePartyTypesList,
  PartyTypeModel,
} from "@/app/data/accounts/partyTypeData";
import {
  samplePartySubTypesList,
  PartySubTypeModel,
} from "@/app/data/accounts/partySubTypeData";
import { sampleCurrenciesList } from "@/app/data/accounts/currencyData";
import { cn } from "@/lib/utils";

export function PartyMasterView() {
  // Master Party List & Active Selection State
  const [parties, setParties] = useState<PartyModel[]>(samplePartyMasterData);
  const [selectedPartyId, setSelectedPartyId] = useState<string>("P-00101");

  // Party Types & Sub Types Master References
  const [partyTypes] = useState<PartyTypeModel[]>(samplePartyTypesList);
  const [subTypes] = useState<PartySubTypeModel[]>(samplePartySubTypesList);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("ALL");
  const [selectedSubTypeFilter, setSelectedSubTypeFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [selectedEntityFilter, setSelectedEntityFilter] = useState("ALL");

  // Active Selected Party
  const activeParty = useMemo(
    () => parties.find((p) => p.partyId === selectedPartyId) || parties[0],
    [parties, selectedPartyId]
  );

  // Form State (for editing active record)
  const [formData, setFormData] = useState<PartyModel>(activeParty);

  // Active Tab State (EXACTLY 4 Tabs in V1)
  const [activeTab, setActiveTab] = useState<
    "general" | "address" | "accounting" | "tax"
  >("general");

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2 | 3 | 4>(1);

  // Deactivation Confirmation State
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  // Sync Form State when active selection changes
  useEffect(() => {
    if (activeParty) {
      setFormData({ ...activeParty });
    }
  }, [activeParty]);

  // Helper Maps for quick lookups
  const partyTypeMap = useMemo(() => {
    const map = new Map<string, PartyTypeModel>();
    partyTypes.forEach((pt) => map.set(pt.partyTypeId, pt));
    return map;
  }, [partyTypes]);

  const subTypeMap = useMemo(() => {
    const map = new Map<string, PartySubTypeModel>();
    subTypes.forEach((st) => map.set(st.partySubTypeId, st));
    return map;
  }, [subTypes]);

  // Active Sub Types for current Form Party Type
  const availableSubTypesForForm = useMemo(() => {
    if (!formData?.partyTypeId) return [];
    return subTypes
      .filter((s) => s.partyTypeId === formData.partyTypeId && s.status === "Active")
      .sort((a, b) => a.sequence - b.sequence);
  }, [formData?.partyTypeId, subTypes]);

  // Filtered List
  const filteredParties = useMemo(() => {
    return parties.filter((p) => {
      if (selectedTypeFilter !== "ALL" && p.partyTypeId !== selectedTypeFilter) {
        return false;
      }
      if (selectedSubTypeFilter !== "ALL" && p.partySubTypeId !== selectedSubTypeFilter) {
        return false;
      }
      if (selectedStatusFilter !== "All" && p.status !== selectedStatusFilter) {
        return false;
      }
      if (selectedEntityFilter !== "ALL" && p.entityType !== selectedEntityFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const typeName = partyTypeMap.get(p.partyTypeId)?.typeName?.toLowerCase() || "";
        const subTypeName = subTypeMap.get(p.partySubTypeId)?.subTypeName?.toLowerCase() || "";

        return (
          p.partyId.toLowerCase().includes(q) ||
          p.partyCode.toLowerCase().includes(q) ||
          p.partyName.toLowerCase().includes(q) ||
          (p.shortName || "").toLowerCase().includes(q) ||
          (p.gstin || "").toLowerCase().includes(q) ||
          (p.panNumber || "").toLowerCase().includes(q) ||
          (p.phone || "").toLowerCase().includes(q) ||
          (p.email || "").toLowerCase().includes(q) ||
          typeName.includes(q) ||
          subTypeName.includes(q)
        );
      }
      return true;
    });
  }, [
    parties,
    selectedTypeFilter,
    selectedSubTypeFilter,
    selectedStatusFilter,
    selectedEntityFilter,
    searchQuery,
    partyTypeMap,
    subTypeMap,
  ]);

  // Form Field Change Handler
  const handleFormChange = (field: keyof PartyModel, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Nested Address Field Change Handler
  const handleAddressChange = (
    addressType: "billingAddress" | "shippingAddress",
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [addressType]: {
        ...(prev[addressType] || {}),
        [field]: value,
      },
      ...(addressType === "billingAddress" && field === "city" ? { city: value } : {}),
      ...(addressType === "billingAddress" && field === "state" ? { state: value } : {}),
      ...(addressType === "billingAddress" && field === "postalCode" ? { postalCode: value } : {}),
      ...(addressType === "billingAddress" && field === "country" ? { country: value } : {}),
    }));
  };

  // Quick Copy Billing to Shipping Address
  const handleCopyBillingToShipping = () => {
    if (formData.billingAddress) {
      setFormData((prev) => ({
        ...prev,
        shippingAddress: { ...prev.billingAddress },
      }));
      setToastMessage("Copied billing address to shipping address.");
    }
  };

  // Handle Party Type change with cascading Sub Type reset
  const handlePartyTypeChange = (newTypeId: string) => {
    if (formData.hasFinancialHistory && newTypeId !== activeParty.partyTypeId) {
      setToastMessage("Cannot change Party Type: This party already has financial transaction history.");
      return;
    }
    const matchingSubTypes = subTypes.filter((s) => s.partyTypeId === newTypeId && s.status === "Active");
    const defaultSubTypeId = matchingSubTypes.length > 0 ? matchingSubTypes[0].partySubTypeId : "";

    setFormData((prev) => ({
      ...prev,
      partyTypeId: newTypeId,
      partySubTypeId: defaultSubTypeId,
    }));
  };

  // Save Active Party Edits
  const handleSaveParty = () => {
    if (!formData.partyName.trim()) {
      setToastMessage("Please enter a valid Party Name.");
      return;
    }
    if (!formData.partyTypeId) {
      setToastMessage("Please select a valid Party Type.");
      return;
    }

    // Protection check
    if (
      formData.hasFinancialHistory &&
      (formData.partyTypeId !== activeParty.partyTypeId ||
        formData.partySubTypeId !== activeParty.partySubTypeId)
    ) {
      setToastMessage("Classification locked: Cannot alter Party Type or Sub Type for parties with accounting history.");
      return;
    }

    const updated: PartyModel = {
      ...formData,
      partyName: formData.partyName.trim(),
      shortName: formData.shortName?.trim(),
      updatedAt: new Date().toLocaleDateString("en-IN"),
    };

    setParties((prev) => prev.map((p) => (p.partyId === formData.partyId ? updated : p)));
    setFormData(updated);
    setToastMessage(`Saved Party Master record for '${updated.partyName}' (${updated.partyId}).`);
  };

  // Toggle Active / Inactive Status
  const handleToggleStatus = () => {
    if (formData.status === "Active") {
      setShowDeactivateConfirm(true);
    } else {
      const nextStatus = "Active";
      setParties((prev) =>
        prev.map((p) =>
          p.partyId === formData.partyId
            ? { ...p, status: nextStatus, updatedAt: new Date().toLocaleDateString("en-IN") }
            : p
        )
      );
      setFormData((prev) => ({ ...prev, status: nextStatus }));
      setToastMessage(`Activated Party '${formData.partyName}'.`);
    }
  };

  // Confirm Deactivation
  const handleConfirmDeactivate = () => {
    const nextStatus = "Inactive";
    setParties((prev) =>
      prev.map((p) =>
        p.partyId === formData.partyId
          ? { ...p, status: nextStatus, updatedAt: new Date().toLocaleDateString("en-IN") }
          : p
      )
    );
    setFormData((prev) => ({ ...prev, status: nextStatus }));
    setShowDeactivateConfirm(false);
    setToastMessage(
      `Deactivated Party '${formData.partyName}'. Historical accounting entries, vouchers, and balances remain fully preserved.`
    );
  };

  // ==========================================
  // CREATE PARTY MODAL STATE & HANDLERS
  // ==========================================
  const [createForm, setCreateForm] = useState<Partial<PartyModel>>({
    partyTypeId: "PTY-001",
    partySubTypeId: "PST-001",
    partyName: "",
    shortName: "",
    entityType: "Company",
    email: "",
    phone: "",
    alternatePhone: "",
    website: "",
    city: "Bharuch",
    state: "Gujarat",
    postalCode: "392001",
    country: "India",
    contactPersonName: "",
    contactPersonDesignation: "",
    panNumber: "",
    gstin: "",
    gstRegistrationType: "Registered - Regular",
    creditDays: 30,
    creditLimit: 200000,
    paymentMethodId: "NEFT / RTGS",
    currencyId: "CUR-001",
    receivableAccountId: "1195 - SUNDRY DEBTORS",
    payableAccountId: "2410 - Sundry Creditors",
    status: "Active",
    remarks: "",
  });

  // Duplicate Match Warning State for Creation
  const duplicateWarning = useMemo(() => {
    if (!showCreateModal) return null;
    const name = (createForm.partyName || "").trim().toLowerCase();
    const gstin = (createForm.gstin || "").trim().toUpperCase();
    const pan = (createForm.panNumber || "").trim().toUpperCase();
    const phone = (createForm.phone || "").trim();

    if (!name && !gstin && !pan && !phone) return null;

    const match = parties.find((p) => {
      if (gstin && p.gstin && p.gstin.toUpperCase() === gstin) return true;
      if (pan && p.panNumber && p.panNumber.toUpperCase() === pan) return true;
      if (name && p.partyName.toLowerCase() === name) return true;
      if (phone && p.phone && p.phone === phone) return true;
      return false;
    });

    if (match) {
      const type = partyTypeMap.get(match.partyTypeId)?.typeName || "Party";
      const sub = subTypeMap.get(match.partySubTypeId)?.subTypeName || "";
      return {
        matchedParty: match,
        message: `Possible existing party found: '${match.partyName}' (${match.partyId} • ${type}${sub ? ` / ${sub}` : ""}). Please verify before creating a duplicate record.`,
      };
    }
    return null;
  }, [createForm.partyName, createForm.gstin, createForm.panNumber, createForm.phone, parties, partyTypeMap, subTypeMap, showCreateModal]);

  // Handle Create Party Submit
  const handleCreateParty = () => {
    if (!createForm.partyName?.trim()) {
      setToastMessage("Party Name is required.");
      return;
    }
    if (!createForm.partyTypeId) {
      setToastMessage("Party Type is required.");
      return;
    }

    const nextNum = parties.length + 101;
    const newId = `P-00${nextNum}`;
    const newCode = `P-${Math.floor(10000 + Math.random() * 90000)}`;

    const newParty: PartyModel = {
      partyId: newId,
      partyCode: newCode,
      partyTypeId: createForm.partyTypeId,
      partySubTypeId: createForm.partySubTypeId || "PST-001",
      partyName: createForm.partyName.trim(),
      shortName: createForm.shortName?.trim() || "",
      entityType: createForm.entityType || "Company",
      contactId: createForm.contactId,

      email: createForm.email || "",
      phone: createForm.phone || "",
      alternatePhone: createForm.alternatePhone || "",
      website: createForm.website || "",

      billingAddress: {
        addressLine1: createForm.billingAddress?.addressLine1 || "",
        addressLine2: createForm.billingAddress?.addressLine2 || "",
        city: createForm.city || "Bharuch",
        district: createForm.billingAddress?.district || "",
        state: createForm.state || "Gujarat",
        postalCode: createForm.postalCode || "392001",
        country: createForm.country || "India",
      },
      shippingAddress: createForm.shippingAddress || undefined,

      city: createForm.city || "Bharuch",
      state: createForm.state || "Gujarat",
      postalCode: createForm.postalCode || "392001",
      country: createForm.country || "India",

      contactPersonName: createForm.contactPersonName || "",
      contactPersonDesignation: createForm.contactPersonDesignation || "",
      contactPersonPhone: createForm.contactPersonPhone || "",
      contactPersonEmail: createForm.contactPersonEmail || "",

      panNumber: createForm.panNumber?.trim().toUpperCase() || "",
      gstin: createForm.gstin?.trim().toUpperCase() || "",
      gstRegistrationType: createForm.gstRegistrationType || "Registered - Regular",
      tanNumber: createForm.tanNumber?.trim().toUpperCase() || "",
      msmeNumber: createForm.msmeNumber?.trim() || "",

      currencyId: createForm.currencyId || "CUR-001",
      creditDays: createForm.creditDays || 0,
      creditLimit: createForm.creditLimit || 0,
      paymentMethodId: createForm.paymentMethodId || "NEFT / RTGS",

      bankName: createForm.bankName || "",
      bankAccountNumber: createForm.bankAccountNumber || "",
      bankIfsc: createForm.bankIfsc || "",
      bankBranch: createForm.bankBranch || "",
      bankAccountType: createForm.bankAccountType || "Current Account",

      receivableAccountId: createForm.receivableAccountId || "1195 - SUNDRY DEBTORS",
      payableAccountId: createForm.payableAccountId || "2410 - Sundry Creditors",

      status: "Active",
      remarks: createForm.remarks || "",

      hasFinancialHistory: false,
      derivedOutstanding: {
        balance: 0,
        balanceType: "Dr",
        totalInvoicesCount: 0,
      },
      createdAt: new Date().toLocaleDateString("en-IN"),
      updatedAt: new Date().toLocaleDateString("en-IN"),
    };

    setParties([newParty, ...parties]);
    setSelectedPartyId(newParty.partyId);
    setShowCreateModal(false);
    setCreateStep(1);
    setToastMessage(`Created new Party Master record '${newParty.partyName}' (${newParty.partyId}).`);
  };

  const currentType = partyTypeMap.get(formData.partyTypeId);
  const currentSubType = subTypeMap.get(formData.partySubTypeId);

  // Derived balance calculation formatting
  const outstandingDisplay = useMemo(() => {
    const derived = formData.derivedOutstanding;
    if (!derived || derived.balance === 0) {
      return { text: "₹0", type: "Settled", isZero: true };
    }
    return {
      text: `${formatINR(derived.balance)} ${derived.balanceType}`,
      type: derived.balanceType === "Dr" ? "Receivable" : "Payable",
      isZero: false,
    };
  }, [formData.derivedOutstanding]);

  return (
    <ModulePageShell
      eyebrow="Accounts & Masters"
      title="Party Master"
      description="Accounting party master for customers, vendors, agents, employees, and statutory authorities."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Masters", href: "/accounts/masters" },
        { label: "Party Master" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setCreateForm({
                partyTypeId: "PTY-001",
                partySubTypeId: "PST-001",
                partyName: "",
                shortName: "",
                entityType: "Company",
                email: "",
                phone: "",
                city: "Bharuch",
                state: "Gujarat",
                postalCode: "392001",
                country: "India",
                gstRegistrationType: "Registered - Regular",
                creditDays: 30,
                creditLimit: 200000,
                paymentMethodId: "NEFT / RTGS",
                currencyId: "CUR-001",
                receivableAccountId: "1195 - SUNDRY DEBTORS",
                payableAccountId: "2410 - Sundry Creditors",
                status: "Active",
              });
              setCreateStep(1);
              setShowCreateModal(true);
            }}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            + Create Party
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveParty}
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
              if (activeParty) {
                setFormData({ ...activeParty });
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
      {/* Context & Hierarchy Banner */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <Building2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <span className="text-[11px] font-bold text-slate-500 block uppercase">Accounting Party Hierarchy:</span>
              <span className="font-bold text-xs text-slate-900">
                Party Type → Party Sub Type → Party Master (Legal Identity & Ledger Linkage)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-emerald-900 border border-emerald-200 font-bold">
              <Users className="h-4 w-4 text-emerald-700" />
              <span>Registered Accounting Parties: {parties.length}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split Layout (4 Cols Left / 8 Cols Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 text-xs">
        {/* LEFT COLUMN: Parties Master List & Filters */}
        <div className="md:col-span-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col min-h-[620px]">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Party Records
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredParties.length} Parties
            </span>
          </div>

          {/* Quick Search */}
          <div className="space-y-2 mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search party, code, GSTIN, phone..."
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

            {/* Filters Row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Party Type:</label>
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => {
                    setSelectedTypeFilter(e.target.value);
                    setSelectedSubTypeFilter("ALL");
                  }}
                  className="h-7 w-full rounded-lg border border-slate-300 bg-white px-2 text-[11px] font-semibold text-slate-900 focus:border-emerald-500"
                >
                  <option value="ALL">All Types</option>
                  {partyTypes.map((pt) => (
                    <option key={pt.partyTypeId} value={pt.partyTypeId}>
                      {pt.typeName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Entity Form:</label>
                <select
                  value={selectedEntityFilter}
                  onChange={(e) => setSelectedEntityFilter(e.target.value)}
                  className="h-7 w-full rounded-lg border border-slate-300 bg-white px-2 text-[11px] font-semibold text-slate-900 focus:border-emerald-500"
                >
                  <option value="ALL">All Entities</option>
                  {sampleEntityTypes.map((et) => (
                    <option key={et} value={et}>
                      {et}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1 text-[11px] pt-1">
              {(["All", "Active", "Inactive"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatusFilter(st)}
                  className={cn(
                    "px-2.5 py-0.5 rounded-lg font-semibold transition-all cursor-pointer",
                    selectedStatusFilter === st
                      ? "bg-emerald-700 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Parties Cards List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[480px]">
            {filteredParties.map((p) => {
              const isSelected = p.partyId === selectedPartyId;
              const type = partyTypeMap.get(p.partyTypeId);
              const sub = subTypeMap.get(p.partySubTypeId);
              const derived = p.derivedOutstanding;

              return (
                <div
                  key={p.partyId}
                  onClick={() => setSelectedPartyId(p.partyId)}
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
                        <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {p.partyId}
                        </span>

                        <span className="font-bold text-xs text-slate-900 line-clamp-1">
                          {p.partyName}
                        </span>

                        <span
                          className={cn(
                            "text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase",
                            p.status === "Active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-600"
                          )}
                        >
                          {p.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1 font-medium">
                        <span className="text-emerald-800 font-bold">{type?.typeName || "Unknown"}</span>
                        <span>•</span>
                        <span className="text-slate-700">{sub?.subTypeName || "General"}</span>
                        <span>•</span>
                        <span className="text-slate-500 font-mono text-[10px]">{p.entityType}</span>
                      </div>
                    </div>

                    <ChevronRight
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform mt-1",
                        isSelected ? "text-emerald-700 translate-x-0.5" : "text-slate-400"
                      )}
                    />
                  </div>

                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono text-[10px]">
                      {p.city || "India"}
                    </span>
                    <span
                      className={cn(
                        "font-mono font-bold text-[11px]",
                        derived && derived.balance > 0
                          ? derived.balanceType === "Dr"
                            ? "text-emerald-700"
                            : "text-amber-700"
                          : "text-slate-400"
                      )}
                    >
                      {derived && derived.balance > 0
                        ? `${formatINR(derived.balance)} ${derived.balanceType}`
                        : "₹0 Settled"}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredParties.length === 0 && (
              <div className="text-center py-12 text-xs text-slate-400">
                No party records match your search criteria.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Selected Party Details & EXACTLY 4-Tab Form */}
        <div className="md:col-span-8 space-y-4">
          {/* Top Overview & Balance Header Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-slate-900 font-mono">
                    {formData.partyName}
                  </h2>
                  <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded font-bold">
                    {formData.partyId}
                  </span>
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
                  Type: <strong className="text-emerald-800">{currentType?.typeName}</strong> • Sub Type:{" "}
                  <strong className="text-slate-800">{currentSubType?.subTypeName}</strong> • Entity:{" "}
                  <strong className="text-slate-700">{formData.entityType}</strong>
                </p>
              </div>

              {/* Status Toggle & Outstanding Summary */}
              <div className="flex items-center gap-3">
                <div className="text-right pr-2 border-r border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Derived Balance
                  </span>
                  <span
                    className={cn(
                      "font-mono font-bold text-sm block",
                      !outstandingDisplay.isZero
                        ? formData.derivedOutstanding?.balanceType === "Dr"
                          ? "text-emerald-700"
                          : "text-amber-700"
                        : "text-slate-700"
                    )}
                  >
                    {outstandingDisplay.text}
                  </span>
                </div>

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
                      Deactivate Party
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                      Activate Party
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Accounting Reference Safeguard Notice */}
            {formData.hasFinancialHistory && (
              <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span>
                    <strong>Financial History Protected:</strong> This party has linked accounting vouchers/invoices. Classification is locked to protect historical ledgers.
                  </span>
                </div>
                {formData.derivedOutstanding?.lastTxnDate && (
                  <span className="font-mono text-[10px] text-slate-500">
                    Last Txn: {formData.derivedOutstanding.lastTxnDate}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* EXACT 4-Tab Navigation Bar (NO HOTEL & OPERATIONAL TERMS, NO APPROVAL/BLACKLIST) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs flex border-b border-slate-200 overflow-x-auto gap-1">
            {[
              { id: "general", label: "1. General & Identity", icon: Tag },
              { id: "address", label: "2. Address & Contact", icon: MapPin },
              { id: "accounting", label: "3. Accounting & Payment", icon: CreditCard },
              { id: "tax", label: "4. Tax & Statutory", icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer",
                    isActive
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Tab Content */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs font-sans text-xs space-y-4">
            {/* ==================================================== */}
            {/* TAB 1: GENERAL & IDENTITY */}
            {/* ==================================================== */}
            {activeTab === "general" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-emerald-600" />
                    Party Accounting Identity & Classification
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Party ID (Immutable)">
                      <TextInput
                        value={formData.partyId}
                        readOnly
                        className="bg-slate-100 font-mono font-bold text-slate-700 cursor-not-allowed h-9"
                      />
                    </FormField>

                    <FormField
                      label={formData.hasFinancialHistory ? "Party Type (Locked)" : "Party Type"}
                      required
                    >
                      <SelectInput
                        value={formData.partyTypeId}
                        onChange={(e) => handlePartyTypeChange(e.target.value)}
                        disabled={formData.hasFinancialHistory}
                        className={cn(
                          "font-bold text-slate-900 h-9",
                          formData.hasFinancialHistory ? "bg-slate-100 text-slate-600 cursor-not-allowed" : "bg-white"
                        )}
                      >
                        {partyTypes
                          .filter((pt) => pt.status === "Active" || pt.partyTypeId === formData.partyTypeId)
                          .map((pt) => (
                            <option key={pt.partyTypeId} value={pt.partyTypeId}>
                              {pt.typeName} ({pt.typeCode})
                            </option>
                          ))}
                      </SelectInput>
                    </FormField>

                    <FormField
                      label={formData.hasFinancialHistory ? "Party Sub Type (Locked)" : "Party Sub Type"}
                      required
                    >
                      <SelectInput
                        value={formData.partySubTypeId}
                        onChange={(e) => handleFormChange("partySubTypeId", e.target.value)}
                        disabled={formData.hasFinancialHistory || availableSubTypesForForm.length === 0}
                        className={cn(
                          "font-bold text-slate-900 h-9",
                          formData.hasFinancialHistory ? "bg-slate-100 text-slate-600 cursor-not-allowed" : "bg-white"
                        )}
                      >
                        {availableSubTypesForForm.map((st) => (
                          <option key={st.partySubTypeId} value={st.partySubTypeId}>
                            {st.subTypeName} ({st.subTypeCode})
                          </option>
                        ))}
                        {availableSubTypesForForm.length === 0 && (
                          <option value="" disabled key="empty-subtypes">
                            No sub-types available
                          </option>
                        )}
                      </SelectInput>
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <FormField label="Legal / Display Party Name" required>
                        <TextInput
                          value={formData.partyName}
                          onChange={(e) => handleFormChange("partyName", e.target.value)}
                          placeholder="e.g. MakeMyTrip India Pvt Ltd"
                          className="bg-white font-bold text-slate-900 h-9"
                        />
                      </FormField>
                    </div>

                    <FormField label="Short Name / Alias">
                      <TextInput
                        value={formData.shortName || ""}
                        onChange={(e) => handleFormChange("shortName", e.target.value)}
                        placeholder="e.g. MMT"
                        className="bg-white font-mono font-bold text-slate-900 h-9"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Entity Legal Form" required>
                      <SelectInput
                        value={formData.entityType}
                        onChange={(e) => handleFormChange("entityType", e.target.value as any)}
                        className="bg-white font-bold h-9"
                      >
                        {sampleEntityTypes.map((et) => (
                          <option key={et} value={et}>
                            {et}
                          </option>
                        ))}
                      </SelectInput>
                    </FormField>

                    <FormField label="CRM Contact Link (Optional)">
                      <TextInput
                        value={formData.contactId || ""}
                        onChange={(e) => handleFormChange("contactId", e.target.value)}
                        placeholder="e.g. CRM-CNT-101"
                        className="bg-white font-mono text-slate-700 h-9"
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

                  <FormField label="Remarks / Accounting Identification Notes">
                    <TextAreaInput
                      rows={2}
                      value={formData.remarks || ""}
                      onChange={(e) => handleFormChange("remarks", e.target.value)}
                      placeholder="Notes regarding this party's accounting identity..."
                      className="bg-white text-xs"
                    />
                  </FormField>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* TAB 2: ADDRESS & CONTACT */}
            {/* ==================================================== */}
            {activeTab === "address" && (
              <div className="space-y-4">
                {/* Billing Address */}
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      Billing / Registered Address
                    </h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyBillingToShipping}
                      className="text-[11px] h-7 bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    >
                      Copy to Shipping Address
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Address Line 1">
                      <TextInput
                        value={formData.billingAddress?.addressLine1 || ""}
                        onChange={(e) => handleAddressChange("billingAddress", "addressLine1", e.target.value)}
                        placeholder="Building, street, door no."
                        className="bg-white h-9"
                      />
                    </FormField>

                    <FormField label="Address Line 2">
                      <TextInput
                        value={formData.billingAddress?.addressLine2 || ""}
                        onChange={(e) => handleAddressChange("billingAddress", "addressLine2", e.target.value)}
                        placeholder="Area, landmark"
                        className="bg-white h-9"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <FormField label="City">
                      <TextInput
                        value={formData.billingAddress?.city || formData.city || ""}
                        onChange={(e) => handleAddressChange("billingAddress", "city", e.target.value)}
                        placeholder="City"
                        className="bg-white h-9 font-semibold"
                      />
                    </FormField>

                    <FormField label="State">
                      <SelectInput
                        value={formData.billingAddress?.state || formData.state || "Gujarat"}
                        onChange={(e) => handleAddressChange("billingAddress", "state", e.target.value)}
                        className="bg-white h-9 font-semibold"
                      >
                        {sampleStatesList.filter((s) => s !== "All States").map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </SelectInput>
                    </FormField>

                    <FormField label="Postal / PIN Code">
                      <TextInput
                        value={formData.billingAddress?.postalCode || formData.postalCode || ""}
                        onChange={(e) => handleAddressChange("billingAddress", "postalCode", e.target.value)}
                        placeholder="6-digit PIN"
                        className="bg-white font-mono h-9"
                      />
                    </FormField>

                    <FormField label="Country">
                      <TextInput
                        value={formData.billingAddress?.country || formData.country || "India"}
                        onChange={(e) => handleAddressChange("billingAddress", "country", e.target.value)}
                        className="bg-white h-9"
                      />
                    </FormField>
                  </div>
                </div>

                {/* Primary Contact Person & Communication */}
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-emerald-600" />
                    Primary Contact & Communication Details
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Contact Person Name">
                      <TextInput
                        value={formData.contactPersonName || ""}
                        onChange={(e) => handleFormChange("contactPersonName", e.target.value)}
                        placeholder="e.g. Mr. Rakesh Sharma"
                        className="bg-white font-semibold h-9"
                      />
                    </FormField>

                    <FormField label="Designation">
                      <TextInput
                        value={formData.contactPersonDesignation || ""}
                        onChange={(e) => handleFormChange("contactPersonDesignation", e.target.value)}
                        placeholder="e.g. Senior Finance Manager"
                        className="bg-white h-9"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Official Phone / Mobile">
                      <TextInput
                        value={formData.phone || ""}
                        onChange={(e) => handleFormChange("phone", e.target.value)}
                        placeholder="+91 98250 00000"
                        className="bg-white font-mono h-9"
                      />
                    </FormField>

                    <FormField label="Alternate Phone">
                      <TextInput
                        value={formData.alternatePhone || ""}
                        onChange={(e) => handleFormChange("alternatePhone", e.target.value)}
                        placeholder="Alternate phone"
                        className="bg-white font-mono h-9"
                      />
                    </FormField>

                    <FormField label="Email Address">
                      <TextInput
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => handleFormChange("email", e.target.value)}
                        placeholder="billing@party.com"
                        className="bg-white font-mono h-9"
                      />
                    </FormField>
                  </div>

                  <FormField label="Website / Portal URL">
                    <TextInput
                      value={formData.website || ""}
                      onChange={(e) => handleFormChange("website", e.target.value)}
                      placeholder="https://www.party.com"
                      className="bg-white font-mono h-9"
                    />
                  </FormField>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* TAB 3: ACCOUNTING & PAYMENT */}
            {/* ==================================================== */}
            {activeTab === "accounting" && (
              <div className="space-y-4">
                {/* Credit Terms (Party Specific) */}
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-emerald-600" />
                    Party-Specific Commercial & Credit Terms
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Credit Days Terms">
                      <TextInput
                        type="number"
                        min={0}
                        value={formData.creditDays || 0}
                        onChange={(e) => handleFormChange("creditDays", parseInt(e.target.value) || 0)}
                        className="bg-white font-mono font-bold text-slate-900 h-9"
                      />
                    </FormField>

                    <FormField label="Credit Limit (INR)">
                      <TextInput
                        type="number"
                        min={0}
                        step={1000}
                        value={formData.creditLimit || 0}
                        onChange={(e) => handleFormChange("creditLimit", parseFloat(e.target.value) || 0)}
                        className="bg-white font-mono font-bold text-slate-900 h-9"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Default Payment Method">
                      <SelectInput
                        value={formData.paymentMethodId || "NEFT / RTGS"}
                        onChange={(e) => handleFormChange("paymentMethodId", e.target.value)}
                        className="bg-white font-semibold h-9"
                      >
                        {samplePaymentMethods.map((pm) => (
                          <option key={pm} value={pm}>
                            {pm}
                          </option>
                        ))}
                      </SelectInput>
                    </FormField>

                    <FormField label="Billing Currency">
                      <SelectInput
                        value={formData.currencyId || "CUR-001"}
                        onChange={(e) => handleFormChange("currencyId", e.target.value)}
                        className="bg-white font-semibold h-9"
                      >
                        {sampleCurrenciesList.map((c) => (
                          <option key={c.currencyId} value={c.currencyId}>
                            {c.code} ({c.name} - {c.symbol})
                          </option>
                        ))}
                      </SelectInput>
                    </FormField>
                  </div>
                </div>

                {/* Linked Chart of Accounts */}
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-emerald-600" />
                    Chart of Accounts Ledger Account Linkage
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Receivable Account (Sundry Debtors)">
                      <SelectInput
                        value={formData.receivableAccountId || "1195 - SUNDRY DEBTORS"}
                        onChange={(e) => handleFormChange("receivableAccountId", e.target.value)}
                        className="bg-white font-semibold h-9 text-slate-900"
                      >
                        {sampleReceivableAccounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name}
                          </option>
                        ))}
                      </SelectInput>
                    </FormField>

                    <FormField label="Payable Account (Sundry Creditors)">
                      <SelectInput
                        value={formData.payableAccountId || "2410 - Sundry Creditors"}
                        onChange={(e) => handleFormChange("payableAccountId", e.target.value)}
                        className="bg-white font-semibold h-9 text-slate-900"
                      >
                        {samplePayableAccounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name}
                          </option>
                        ))}
                      </SelectInput>
                    </FormField>
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium">
                    <em>Note:</em> Party Master only establishes linkage to existing Chart of Accounts ledger heads. Posting rules and control accounts are defined under Chart of Accounts.
                  </p>
                </div>

                {/* Bank Details (Optional) */}
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Building className="h-4 w-4 text-emerald-600" />
                    Party Bank Account Details (Optional)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Bank Name">
                      <TextInput
                        value={formData.bankName || ""}
                        onChange={(e) => handleFormChange("bankName", e.target.value)}
                        placeholder="e.g. HDFC Bank Ltd"
                        className="bg-white h-9"
                      />
                    </FormField>

                    <FormField label="Bank Account Number">
                      <TextInput
                        value={formData.bankAccountNumber || ""}
                        onChange={(e) => handleFormChange("bankAccountNumber", e.target.value)}
                        placeholder="Account Number"
                        className="bg-white font-mono font-bold h-9"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormField label="IFSC Code">
                      <TextInput
                        value={formData.bankIfsc || ""}
                        onChange={(e) => handleFormChange("bankIfsc", e.target.value.toUpperCase())}
                        placeholder="HDFC0000129"
                        className="bg-white font-mono font-bold uppercase h-9"
                      />
                    </FormField>

                    <FormField label="Branch">
                      <TextInput
                        value={formData.bankBranch || ""}
                        onChange={(e) => handleFormChange("bankBranch", e.target.value)}
                        placeholder="Branch name"
                        className="bg-white h-9"
                      />
                    </FormField>

                    <FormField label="Account Type">
                      <SelectInput
                        value={formData.bankAccountType || "Current Account"}
                        onChange={(e) => handleFormChange("bankAccountType", e.target.value)}
                        className="bg-white font-semibold h-9"
                      >
                        <option value="Current Account">Current Account</option>
                        <option value="Savings Account">Savings Account</option>
                        <option value="Cash Credit (CC)">Cash Credit (CC)</option>
                      </SelectInput>
                    </FormField>
                  </div>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* TAB 4: TAX & STATUTORY */}
            {/* ==================================================== */}
            {activeTab === "tax" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Party Statutory Identity & Tax Registration
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Permanent Account Number (PAN)">
                      <TextInput
                        value={formData.panNumber || ""}
                        onChange={(e) => handleFormChange("panNumber", e.target.value.toUpperCase())}
                        maxLength={10}
                        placeholder="e.g. AAACM0120P"
                        className="bg-white font-mono font-bold uppercase text-slate-900 h-9"
                      />
                    </FormField>

                    <FormField label="GSTIN (GST Identification Number)">
                      <TextInput
                        value={formData.gstin || ""}
                        onChange={(e) => handleFormChange("gstin", e.target.value.toUpperCase())}
                        maxLength={15}
                        placeholder="e.g. 06AAACM0120P1Z2"
                        className="bg-white font-mono font-bold uppercase text-slate-900 h-9"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="GST Registration Type">
                      <SelectInput
                        value={formData.gstRegistrationType || "Registered - Regular"}
                        onChange={(e) => handleFormChange("gstRegistrationType", e.target.value)}
                        className="bg-white font-semibold h-9"
                      >
                        {sampleGSTRegistrationTypes.map((gt) => (
                          <option key={gt} value={gt}>
                            {gt}
                          </option>
                        ))}
                      </SelectInput>
                    </FormField>

                    <FormField label="Tax Jurisdiction State">
                      <SelectInput
                        value={formData.state || "Gujarat"}
                        onChange={(e) => handleFormChange("state", e.target.value)}
                        className="bg-white font-semibold h-9"
                      >
                        {sampleStatesList.filter((s) => s !== "All States").map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </SelectInput>
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="TAN Number (TDS / TCS)">
                      <TextInput
                        value={formData.tanNumber || ""}
                        onChange={(e) => handleFormChange("tanNumber", e.target.value.toUpperCase())}
                        maxLength={10}
                        placeholder="e.g. DELM09912E"
                        className="bg-white font-mono uppercase h-9"
                      />
                    </FormField>

                    <FormField label="MSME / Udyam Number (Where Applicable)">
                      <TextInput
                        value={formData.msmeNumber || ""}
                        onChange={(e) => handleFormChange("msmeNumber", e.target.value)}
                        placeholder="UDYAM-XX-00-00000"
                        className="bg-white font-mono h-9"
                      />
                    </FormField>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-slate-700 text-[11px] space-y-1">
                    <span className="font-bold text-emerald-950 block">Tax Master Responsibility Separation:</span>
                    <p className="leading-relaxed">
                      Party Master stores only the party's statutory identifiers (GSTIN, PAN, TAN, MSME). Tax rates, HSN/SAC codes, and GST calculation rules are configured under <strong>Tax / GST Master</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Form Action Buttons */}
            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <Button
                type="button"
                size="sm"
                onClick={handleSaveParty}
                className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
              >
                <Save className="h-3.5 w-3.5 mr-1" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* CREATE PARTY MODAL / WIZARD */}
      {/* ==================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-5 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <Plus className="h-5 w-5 text-emerald-600" />
                <span>Create New Party Master Record</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Duplicate Warning Banner */}
            {duplicateWarning && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
                  <span>Duplicate Review Warning:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900">
                  {duplicateWarning.message}
                </p>
              </div>
            )}

            {/* Step Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              {[
                { step: 1, label: "1. Identity" },
                { step: 2, label: "2. Contact & Address" },
                { step: 3, label: "3. Accounts & Terms" },
                { step: 4, label: "4. Tax & Statutory" },
              ].map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setCreateStep(s.step as any)}
                  className={cn(
                    "px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer",
                    createStep === s.step
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Step 1: General & Identity */}
            {createStep === 1 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Parent Party Type" required>
                    <SelectInput
                      value={createForm.partyTypeId}
                      onChange={(e) => {
                        const nextType = e.target.value;
                        const matching = subTypes.filter((s) => s.partyTypeId === nextType && s.status === "Active");
                        setCreateForm((prev) => ({
                          ...prev,
                          partyTypeId: nextType,
                          partySubTypeId: matching.length > 0 ? matching[0].partySubTypeId : "",
                        }));
                      }}
                      className="bg-white font-bold h-9"
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

                  <FormField label="Party Sub Type" required>
                    <SelectInput
                      value={createForm.partySubTypeId}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, partySubTypeId: e.target.value }))}
                      className="bg-white font-bold h-9"
                    >
                      {subTypes
                        .filter((s) => s.partyTypeId === createForm.partyTypeId && s.status === "Active")
                        .map((st) => (
                          <option key={st.partySubTypeId} value={st.partySubTypeId}>
                            {st.subTypeName} ({st.subTypeCode})
                          </option>
                        ))}
                    </SelectInput>
                  </FormField>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <FormField label="Legal Party Name" required>
                      <TextInput
                        value={createForm.partyName}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, partyName: e.target.value }))}
                        placeholder="e.g. ABC Corporate Enterprises Pvt Ltd"
                        className="bg-white font-bold text-slate-900 h-9"
                      />
                    </FormField>
                  </div>

                  <FormField label="Short Name / Alias">
                    <TextInput
                      value={createForm.shortName}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, shortName: e.target.value }))}
                      placeholder="e.g. ABC"
                      className="bg-white font-mono font-bold h-9"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Entity Legal Form" required>
                    <SelectInput
                      value={createForm.entityType}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, entityType: e.target.value as any }))}
                      className="bg-white font-bold h-9"
                    >
                      {sampleEntityTypes.map((et) => (
                        <option key={et} value={et}>
                          {et}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>

                  <FormField label="CRM Contact Link (Optional)">
                    <TextInput
                      value={createForm.contactId || ""}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, contactId: e.target.value }))}
                      placeholder="CRM-CNT-101"
                      className="bg-white font-mono h-9"
                    />
                  </FormField>
                </div>
              </div>
            )}

            {/* Step 2: Contact & Address */}
            {createStep === 2 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Contact Person Name">
                    <TextInput
                      value={createForm.contactPersonName}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, contactPersonName: e.target.value }))}
                      placeholder="Contact Name"
                      className="bg-white h-9"
                    />
                  </FormField>

                  <FormField label="Designation">
                    <TextInput
                      value={createForm.contactPersonDesignation}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, contactPersonDesignation: e.target.value }))}
                      placeholder="Finance Manager / Director"
                      className="bg-white h-9"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Phone / Mobile">
                    <TextInput
                      value={createForm.phone}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 98250 00000"
                      className="bg-white font-mono h-9"
                    />
                  </FormField>

                  <FormField label="Email Address">
                    <TextInput
                      value={createForm.email}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="accounts@party.com"
                      className="bg-white font-mono h-9"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <FormField label="City">
                    <TextInput
                      value={createForm.city}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, city: e.target.value }))}
                      className="bg-white h-9"
                    />
                  </FormField>

                  <FormField label="State">
                    <SelectInput
                      value={createForm.state}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, state: e.target.value }))}
                      className="bg-white h-9"
                    >
                      {sampleStatesList.filter((s) => s !== "All States").map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>

                  <FormField label="PIN Code">
                    <TextInput
                      value={createForm.postalCode}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, postalCode: e.target.value }))}
                      className="bg-white font-mono h-9"
                    />
                  </FormField>
                </div>
              </div>
            )}

            {/* Step 3: Accounting & Payment */}
            {createStep === 3 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Credit Days Terms">
                    <TextInput
                      type="number"
                      min={0}
                      value={createForm.creditDays}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, creditDays: parseInt(e.target.value) || 0 }))}
                      className="bg-white font-mono font-bold h-9"
                    />
                  </FormField>

                  <FormField label="Credit Limit (INR)">
                    <TextInput
                      type="number"
                      min={0}
                      value={createForm.creditLimit}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, creditLimit: parseFloat(e.target.value) || 0 }))}
                      className="bg-white font-mono font-bold h-9"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Default Payment Method">
                    <SelectInput
                      value={createForm.paymentMethodId}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, paymentMethodId: e.target.value }))}
                      className="bg-white font-semibold h-9"
                    >
                      {samplePaymentMethods.map((pm) => (
                        <option key={pm} value={pm}>
                          {pm}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>

                  <FormField label="Receivable Account Head">
                    <SelectInput
                      value={createForm.receivableAccountId}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, receivableAccountId: e.target.value }))}
                      className="bg-white font-semibold h-9"
                    >
                      {sampleReceivableAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>
                </div>
              </div>
            )}

            {/* Step 4: Tax & Statutory */}
            {createStep === 4 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="PAN Number">
                    <TextInput
                      value={createForm.panNumber}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, panNumber: e.target.value.toUpperCase() }))}
                      placeholder="AAACM0120P"
                      className="bg-white font-mono font-bold uppercase h-9"
                    />
                  </FormField>

                  <FormField label="GSTIN">
                    <TextInput
                      value={createForm.gstin}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                      placeholder="06AAACM0120P1Z2"
                      className="bg-white font-mono font-bold uppercase h-9"
                    />
                  </FormField>
                </div>

                <FormField label="GST Registration Type">
                  <SelectInput
                    value={createForm.gstRegistrationType}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, gstRegistrationType: e.target.value }))}
                    className="bg-white font-semibold h-9"
                  >
                    {sampleGSTRegistrationTypes.map((gt) => (
                      <option key={gt} value={gt}>
                        {gt}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div>
                {createStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCreateStep((prev) => (prev - 1) as any)}
                    className="rounded-xl text-xs"
                  >
                    Previous Step
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>

                {createStep < 4 ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setCreateStep((prev) => (prev + 1) as any)}
                    className="rounded-xl bg-slate-900 text-white text-xs font-bold"
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateParty}
                    className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
                  >
                    Create Party
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* DEACTIVATION CONFIRMATION MODAL */}
      {/* ==================================================== */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Ban className="h-5 w-5 text-amber-600" />
              <span>Deactivate Party Master Record?</span>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Are you sure you want to deactivate <strong className="text-slate-900 font-bold">{formData.partyName} ({formData.partyId})</strong>?
              <br />
              <br />
              Inactive parties cannot be selected for new invoices or transactions. All historical vouchers, ledger postings, and outstanding settlement history will remain fully intact.
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
