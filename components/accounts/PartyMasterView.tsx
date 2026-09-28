"use client";

import React, { useState, useMemo } from "react";
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
  Trash2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  SelectInput,
  TextAreaInput,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { accPartyService, type Party } from "@/services/accounts";
import {
  accErrorMessage,
  formatINR,
  invalidateAccLookups,
  useAccLookups,
  useAccQuery,
} from "@/components/accounts/accountsApi";
import { cn } from "@/lib/utils";

const FORM_KEYS = [
  "partyCode", "partyName", "shortName", "partyTypeId", "partySubTypeId", "partyGroup", "entityType",
  "email", "phone", "alternatePhone", "website", "addressLine1", "addressLine2", "city", "state",
  "postalCode", "country", "contactPersonName", "contactPersonPhone", "contactPersonEmail",
  "contactPersonDesignation", "panNumber", "gstin", "gstRegistrationType", "tanNumber", "msmeNumber",
  "msmeType", "currencyId", "creditDays", "creditLimit", "paymentMethodId", "bankName",
  "bankAccountNumber", "bankIfsc", "bankBranch", "bankAccountType", "receivableAccountId",
  "payableAccountId", "remarks", "status",
] as const;

type PartyForm = Pick<Party, (typeof FORM_KEYS)[number]>;
type PartyStatus = Party["status"];

const toForm = (p: Party): PartyForm =>
  Object.fromEntries(FORM_KEYS.map((k) => [k, p[k]])) as PartyForm;

const PARTY_GROUPS = [
  "Sundry Debtors",
  "Sundry Creditors",
  "Corporate Debtors",
  "Travel Agents",
  "Credit Card Company",
  "City Ledger",
];

const ENTITY_TYPES = ["Company", "Individual", "Organization", "Government"];

const GST_REGISTRATION_TYPES = [
  "Regular",
  "Composition",
  "Unregistered / Consumer",
  "Special Economic Zone (SEZ)",
  "Overseas / Non-Resident",
  "Government Body / Local Authority",
  "Embassy / Diplomatic Mission (UIN)",
];

const MSME_TYPES = ["Micro", "Small", "Medium", "Non-MSME"];

const BANK_ACCOUNT_TYPES = ["Current Account", "Savings Account", "Cash Credit (CC)"];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep",
  "Puducherry",
];

/** Options list that always contains the current value, so legacy values stay visible. */
const withCurrent = (options: string[], current: string | null | undefined) =>
  current && !options.includes(current) ? [...options, current] : options;

const ID_FIELDS = ["partyTypeId", "partySubTypeId", "currencyId", "paymentMethodId", "receivableAccountId", "payableAccountId"] as const;

function toPayload(form: PartyForm): Partial<Party> {
  const payload: Partial<Party> = {
    ...form,
    partyCode: form.partyCode.trim().toUpperCase(),
    partyName: form.partyName.trim(),
    shortName: form.shortName.trim(),
    panNumber: form.panNumber.trim().toUpperCase(),
    gstin: form.gstin.trim().toUpperCase(),
    tanNumber: form.tanNumber.trim().toUpperCase(),
    bankIfsc: form.bankIfsc.trim().toUpperCase(),
    email: form.email.trim(),
  };
  for (const k of ID_FIELDS) payload[k] = form[k] || null;
  return payload;
}

function outstandingOf(p: Pick<Party, "outstandingBalance">) {
  const bal = p.outstandingBalance || 0;
  if (bal === 0) return { text: "₹0 Settled", side: null as "Dr" | "Cr" | null };
  return bal > 0
    ? { text: `${formatINR(bal)} Dr`, side: "Dr" as const }
    : { text: `${formatINR(-bal)} Cr`, side: "Cr" as const };
}

const hasFinancialHistory = (p: Party | null) =>
  !!p && (p.openBillsCount > 0 || p.outstandingReceivable !== 0 || p.outstandingPayable !== 0);

export function PartyMasterView() {
  const partiesQ = useAccQuery(() => accPartyService.list(), []);
  const parties = useMemo(() => partiesQ.data ?? [], [partiesQ.data]);
  const { lookups, loading: lookupsLoading, error: lookupsError, reload: reloadLookups } = useAccLookups();

  const partyTypes = useMemo(() => lookups?.partyTypes ?? [], [lookups]);
  const subTypes = useMemo(() => lookups?.partySubTypes ?? [], [lookups]);
  const currencies = useMemo(() => lookups?.currencies ?? [], [lookups]);
  const paymentMethods = useMemo(() => lookups?.paymentMethods ?? [], [lookups]);
  const receivableLedgers = useMemo(
    () => (lookups?.ledgers ?? []).filter((l) => l.nature === "Asset"),
    [lookups]
  );
  const payableLedgers = useMemo(
    () => (lookups?.ledgers ?? []).filter((l) => l.nature === "Liability"),
    [lookups]
  );

  const [selectedPartyId, setSelectedPartyId] = useState<string>("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"All" | PartyStatus>("All");
  const [selectedEntityFilter, setSelectedEntityFilter] = useState("ALL");

  const [activeTab, setActiveTab] = useState<"general" | "address" | "accounting" | "tax">("general");

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const notify = (message: string, variant: "success" | "error" = "success") => {
    setToastVariant(variant);
    setToastMessage(message);
  };
  const [saving, setSaving] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2 | 3 | 4>(1);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  const entityOptions = useMemo(
    () => Array.from(new Set([...ENTITY_TYPES, ...parties.map((p) => p.entityType).filter(Boolean)])),
    [parties]
  );

  const filteredParties = useMemo(() => {
    return parties.filter((p) => {
      if (selectedTypeFilter !== "ALL" && p.partyTypeId !== selectedTypeFilter) return false;
      if (selectedStatusFilter !== "All" && p.status !== selectedStatusFilter) return false;
      if (selectedEntityFilter !== "ALL" && p.entityType !== selectedEntityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return [
          p.partyCode,
          p.partyName,
          p.shortName,
          p.gstin,
          p.panNumber,
          p.phone,
          p.email,
          p.city,
          p.partyGroup,
          p.partyTypeName,
          p.partySubTypeName,
        ].some((v) => (v || "").toLowerCase().includes(q));
      }
      return true;
    });
  }, [parties, selectedTypeFilter, selectedStatusFilter, selectedEntityFilter, searchQuery]);

  const activeParty = useMemo(
    () => parties.find((p) => p.id === selectedPartyId) ?? filteredParties[0] ?? null,
    [parties, filteredParties, selectedPartyId]
  );

  const [formData, setFormData] = useState<PartyForm | null>(null);
  const [syncedParty, setSyncedParty] = useState<Party | null>(null);
  if (activeParty !== syncedParty) {
    setSyncedParty(activeParty);
    setFormData(activeParty ? toForm(activeParty) : null);
  }

  const classificationLocked = hasFinancialHistory(activeParty);

  const formPartyTypeId = formData?.partyTypeId ?? null;
  const availableSubTypesForForm = useMemo(
    () => (formPartyTypeId ? subTypes.filter((s) => s.partyTypeId === formPartyTypeId) : []),
    [formPartyTypeId, subTypes]
  );

  const handleFormChange = <K extends keyof PartyForm>(field: K, value: PartyForm[K]) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handlePartyTypeChange = (newTypeId: string) => {
    if (!formData || !activeParty) return;
    if (classificationLocked && newTypeId !== activeParty.partyTypeId) {
      notify("Cannot change Party Type: This party already has financial transaction history.", "error");
      return;
    }
    const matching = subTypes.filter((s) => s.partyTypeId === newTypeId);
    setFormData((prev) =>
      prev ? { ...prev, partyTypeId: newTypeId || null, partySubTypeId: matching[0]?.id ?? null } : prev
    );
  };

  const reloadAll = async () => {
    await Promise.all([partiesQ.reload(), reloadLookups(true)]);
  };

  const handleSaveParty = async () => {
    if (!formData || !activeParty) return;
    if (!formData.partyName.trim()) {
      notify("Please enter a valid Party Name.", "error");
      return;
    }
    if (!formData.partyCode.trim()) {
      notify("Party Code cannot be empty.", "error");
      return;
    }
    if (!formData.partyTypeId) {
      notify("Please select a valid Party Type.", "error");
      return;
    }
    if (
      classificationLocked &&
      (formData.partyTypeId !== activeParty.partyTypeId || formData.partySubTypeId !== activeParty.partySubTypeId)
    ) {
      notify("Classification locked: Cannot alter Party Type or Sub Type for parties with accounting history.", "error");
      return;
    }

    setSaving(true);
    try {
      const saved = await accPartyService.update(activeParty.id, toPayload(formData));
      invalidateAccLookups();
      await reloadAll();
      notify(`Saved Party Master record for '${saved.partyName}' (${saved.partyCode}).`);
    } catch (e) {
      notify(accErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const setPartyStatus = async (nextStatus: PartyStatus) => {
    if (!activeParty) return;
    try {
      await accPartyService.update(activeParty.id, { status: nextStatus });
      invalidateAccLookups();
      await reloadAll();
      notify(
        nextStatus === "Active"
          ? `Activated Party '${activeParty.partyName}'.`
          : `Deactivated Party '${activeParty.partyName}'. Historical accounting entries, vouchers, and balances remain fully preserved.`
      );
    } catch (e) {
      notify(accErrorMessage(e), "error");
    }
  };

  const handleToggleStatus = () => {
    if (!activeParty) return;
    if (activeParty.status === "Active") setShowDeactivateConfirm(true);
    else void setPartyStatus("Active");
  };

  const handleConfirmDeactivate = async () => {
    setShowDeactivateConfirm(false);
    await setPartyStatus("Inactive");
  };

  const handleDeleteParty = async () => {
    if (!activeParty) return;
    if (!window.confirm(`Delete party '${activeParty.partyName}' (${activeParty.partyCode})? This cannot be undone.`)) {
      return;
    }
    try {
      await accPartyService.remove(activeParty.id);
      invalidateAccLookups();
      setSelectedPartyId("");
      await reloadAll();
      notify(`Deleted party '${activeParty.partyName}'.`);
    } catch (e) {
      notify(accErrorMessage(e), "error");
    }
  };

  // ==========================================
  // CREATE PARTY MODAL STATE & HANDLERS
  // ==========================================
  const emptyCreateForm = (): PartyForm => {
    const firstType = partyTypes[0]?.id ?? null;
    return {
      partyCode: "",
      partyName: "",
      shortName: "",
      partyTypeId: firstType,
      partySubTypeId: subTypes.find((s) => s.partyTypeId === firstType)?.id ?? null,
      partyGroup: "Sundry Debtors",
      entityType: "Company",
      email: "",
      phone: "",
      alternatePhone: "",
      website: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      contactPersonName: "",
      contactPersonPhone: "",
      contactPersonEmail: "",
      contactPersonDesignation: "",
      panNumber: "",
      gstin: "",
      gstRegistrationType: "Regular",
      tanNumber: "",
      msmeNumber: "",
      msmeType: "Non-MSME",
      currencyId: currencies.find((c) => c.isBaseCurrency)?.id ?? null,
      creditDays: 30,
      creditLimit: 0,
      paymentMethodId: null,
      bankName: "",
      bankAccountNumber: "",
      bankIfsc: "",
      bankBranch: "",
      bankAccountType: "Current Account",
      receivableAccountId: null,
      payableAccountId: null,
      remarks: "",
      status: "Active",
    };
  };
  const [createForm, setCreateForm] = useState<PartyForm>(emptyCreateForm);
  const setCreateField = <K extends keyof PartyForm>(field: K, value: PartyForm[K]) =>
    setCreateForm((prev) => ({ ...prev, [field]: value }));

  const duplicateWarning = useMemo(() => {
    if (!showCreateModal) return null;
    const name = createForm.partyName.trim().toLowerCase();
    const gstin = createForm.gstin.trim().toUpperCase();
    const pan = createForm.panNumber.trim().toUpperCase();
    const phone = createForm.phone.trim();

    if (!name && !gstin && !pan && !phone) return null;

    const match = parties.find((p) => {
      if (gstin && p.gstin && p.gstin.toUpperCase() === gstin) return true;
      if (pan && p.panNumber && p.panNumber.toUpperCase() === pan) return true;
      if (name && p.partyName.toLowerCase() === name) return true;
      if (phone && p.phone && p.phone === phone) return true;
      return false;
    });

    if (match) {
      const type = match.partyTypeName || "Party";
      const sub = match.partySubTypeName || "";
      return {
        matchedParty: match,
        message: `Possible existing party found: '${match.partyName}' (${match.partyCode} • ${type}${sub ? ` / ${sub}` : ""}). Please verify before creating a duplicate record.`,
      };
    }
    return null;
  }, [createForm.partyName, createForm.gstin, createForm.panNumber, createForm.phone, parties, showCreateModal]);

  const handleCreateParty = async () => {
    if (!createForm.partyName.trim()) {
      notify("Party Name is required.", "error");
      setCreateStep(1);
      return;
    }
    if (!createForm.partyTypeId) {
      notify("Party Type is required.", "error");
      setCreateStep(1);
      return;
    }

    setSaving(true);
    try {
      const created = await accPartyService.create(toPayload(createForm));
      invalidateAccLookups();
      await reloadAll();
      setSelectedPartyId(created.id);
      setShowCreateModal(false);
      setCreateStep(1);
      notify(`Created new Party Master record '${created.partyName}' (${created.partyCode}).`);
    } catch (e) {
      notify(accErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const outstandingDisplay = activeParty ? outstandingOf(activeParty) : null;

  const initialLoading = (partiesQ.loading && !partiesQ.data) || (lookupsLoading && !lookups);
  const loadError = (!partiesQ.data && partiesQ.error) || (!lookups && lookupsError) || null;

  const partyTypeOptions = (currentId: string | null, currentName: string | null) => {
    const opts = partyTypes.map((pt) => ({ id: pt.id, label: `${pt.typeName} (${pt.typeCode})` }));
    if (currentId && !opts.some((o) => o.id === currentId)) {
      opts.push({ id: currentId, label: `${currentName ?? "Current type"} (inactive)` });
    }
    return opts;
  };

  const subTypeOptions = (typeId: string | null, currentId: string | null, currentName: string | null) => {
    const opts = subTypes
      .filter((s) => s.partyTypeId === typeId)
      .map((s) => ({ id: s.id, label: `${s.subTypeName} (${s.subTypeCode})` }));
    if (currentId && !opts.some((o) => o.id === currentId)) {
      opts.push({ id: currentId, label: `${currentName ?? "Current sub type"} (inactive)` });
    }
    return opts;
  };

  const ledgerOptions = (
    ledgers: { id: string; code: string; name: string }[],
    currentId: string | null,
    currentName: string | null
  ) => {
    const opts = ledgers.map((l) => ({ id: l.id, label: `${l.code} - ${l.name}` }));
    if (currentId && !opts.some((o) => o.id === currentId)) {
      opts.push({ id: currentId, label: currentName ?? "Current ledger" });
    }
    return opts;
  };

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
      toastVariant={toastVariant}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            disabled={initialLoading || !!loadError}
            onClick={() => {
              setCreateForm(emptyCreateForm());
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
            disabled={!formData || saving}
            onClick={() => void handleSaveParty()}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-800 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 mr-1 text-emerald-700" />
            Save Changes
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!activeParty}
            onClick={() => {
              if (activeParty) {
                setFormData(toForm(activeParty));
                notify("Reset unsaved edits.");
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

      {initialLoading ? (
        <div className="flex min-h-[320px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
          Loading parties…
        </div>
      ) : loadError ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/60 p-6 text-center">
          <AlertTriangle className="h-6 w-6 text-rose-600" />
          <p className="text-sm font-semibold text-rose-800">{loadError}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void reloadAll()}
            className="rounded-xl text-xs font-bold border-rose-300 text-rose-700 bg-white hover:bg-rose-50"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Retry
          </Button>
        </div>
      ) : (
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

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Party Type:</label>
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  className="h-7 w-full rounded-lg border border-slate-300 bg-white px-2 text-[11px] font-semibold text-slate-900 focus:border-emerald-500"
                >
                  <option value="ALL">All Types</option>
                  {partyTypes.map((pt) => (
                    <option key={pt.id} value={pt.id}>
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
                  {entityOptions.map((et) => (
                    <option key={et} value={et}>
                      {et}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] pt-1">
              {(["All", "Active", "Inactive", "Blocked"] as const).map((st) => (
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

          <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[480px]">
            {filteredParties.map((p) => {
              const isSelected = p.id === activeParty?.id;
              const out = outstandingOf(p);

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPartyId(p.id)}
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
                          {p.partyCode}
                        </span>

                        <span className="font-bold text-xs text-slate-900 line-clamp-1">
                          {p.partyName}
                        </span>

                        <span
                          className={cn(
                            "text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase",
                            p.status === "Active"
                              ? "bg-emerald-100 text-emerald-800"
                              : p.status === "Blocked"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-slate-200 text-slate-600"
                          )}
                        >
                          {p.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1 font-medium">
                        <span className="text-emerald-800 font-bold">{p.partyTypeName || "Unclassified"}</span>
                        <span>•</span>
                        <span className="text-slate-700">{p.partySubTypeName || "General"}</span>
                        {p.entityType && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500 font-mono text-[10px]">{p.entityType}</span>
                          </>
                        )}
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
                      {p.city || p.country || "—"}
                    </span>
                    <span
                      className={cn(
                        "font-mono font-bold text-[11px]",
                        out.side === "Dr" ? "text-emerald-700" : out.side === "Cr" ? "text-amber-700" : "text-slate-400"
                      )}
                    >
                      {out.text}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredParties.length === 0 && (
              <div className="text-center py-12 text-xs text-slate-400">
                {parties.length === 0
                  ? "No parties yet. Use “+ Create Party” to add the first one."
                  : "No party records match your search criteria."}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Selected Party Details & 4-Tab Form */}
        <div className="md:col-span-8 space-y-4">
          {!activeParty || !formData ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
              <Users className="h-6 w-6 text-slate-400" />
              <p className="text-xs font-semibold text-slate-600">Select or create a party to view its details.</p>
            </div>
          ) : (
          <>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-slate-900 font-mono">
                    {formData.partyName}
                  </h2>
                  <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded font-bold">
                    {activeParty.partyCode}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                      formData.status === "Active"
                        ? "bg-emerald-100 text-emerald-800"
                        : formData.status === "Blocked"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-slate-200 text-slate-600"
                    )}
                  >
                    {formData.status}
                  </span>
                </div>

                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Type: <strong className="text-emerald-800">{activeParty.partyTypeName ?? "—"}</strong> • Sub Type:{" "}
                  <strong className="text-slate-800">{activeParty.partySubTypeName ?? "—"}</strong> • Group:{" "}
                  <strong className="text-slate-700">{activeParty.partyGroup || "—"}</strong>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right pr-2 border-r border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Outstanding Balance
                  </span>
                  <span
                    className={cn(
                      "font-mono font-bold text-sm block",
                      outstandingDisplay?.side === "Dr"
                        ? "text-emerald-700"
                        : outstandingDisplay?.side === "Cr"
                          ? "text-amber-700"
                          : "text-slate-700"
                    )}
                  >
                    {outstandingDisplay?.text}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {activeParty.openBillsCount} open bill{activeParty.openBillsCount === 1 ? "" : "s"}
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleToggleStatus}
                  className={cn(
                    "rounded-xl text-xs font-bold border cursor-pointer",
                    activeParty.status === "Active"
                      ? "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                      : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                  )}
                >
                  {activeParty.status === "Active" ? (
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

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleDeleteParty()}
                  className="rounded-xl text-xs font-semibold bg-white border-rose-200 text-rose-700 hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1 text-rose-600" />
                  Delete
                </Button>
              </div>
            </div>

            {classificationLocked && (
              <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span>
                    <strong>Financial History Protected:</strong> This party has open bills / outstanding balances. Classification is locked to protect historical ledgers.
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs flex border-b border-slate-200 overflow-x-auto gap-1">
            {(
              [
                { id: "general", label: "1. General & Identity", icon: Tag },
                { id: "address", label: "2. Address & Contact", icon: MapPin },
                { id: "accounting", label: "3. Accounting & Payment", icon: CreditCard },
                { id: "tax", label: "4. Tax & Statutory", icon: ShieldCheck },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
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

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs font-sans text-xs space-y-4">
            {/* TAB 1: GENERAL & IDENTITY */}
            {activeTab === "general" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-emerald-600" />
                    Party Accounting Identity & Classification
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Party Code" required>
                      <TextInput
                        value={formData.partyCode}
                        onChange={(e) => handleFormChange("partyCode", e.target.value.toUpperCase())}
                        placeholder="e.g. P-0001"
                        className="bg-white font-mono font-bold text-slate-900 h-9"
                      />
                    </FormField>

                    <FormField
                      label={classificationLocked ? "Party Type (Locked)" : "Party Type"}
                      required
                    >
                      <SelectInput
                        value={formData.partyTypeId ?? ""}
                        onChange={(e) => handlePartyTypeChange(e.target.value)}
                        disabled={classificationLocked}
                        className={cn(
                          "font-bold text-slate-900 h-9",
                          classificationLocked ? "bg-slate-100 text-slate-600 cursor-not-allowed" : "bg-white"
                        )}
                      >
                        {!formData.partyTypeId && <option value="">Select party type</option>}
                        {partyTypeOptions(formData.partyTypeId, activeParty.partyTypeName).map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.label}
                          </option>
                        ))}
                      </SelectInput>
                    </FormField>

                    <FormField
                      label={classificationLocked ? "Party Sub Type (Locked)" : "Party Sub Type"}
                    >
                      <SelectInput
                        value={formData.partySubTypeId ?? ""}
                        onChange={(e) => handleFormChange("partySubTypeId", e.target.value || null)}
                        disabled={classificationLocked || !formData.partyTypeId}
                        className={cn(
                          "font-bold text-slate-900 h-9",
                          classificationLocked ? "bg-slate-100 text-slate-600 cursor-not-allowed" : "bg-white"
                        )}
                      >
                        <option value="">
                          {availableSubTypesForForm.length === 0 ? "No sub-types available" : "— None —"}
                        </option>
                        {subTypeOptions(formData.partyTypeId, formData.partySubTypeId, activeParty.partySubTypeName).map(
                          (o) => (
                            <option key={o.id} value={o.id}>
                              {o.label}
                            </option>
                          )
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
                        value={formData.shortName}
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
                        onChange={(e) => handleFormChange("entityType", e.target.value)}
                        className="bg-white font-bold h-9"
                      >
                        {withCurrent(ENTITY_TYPES, formData.entityType).map((et) => (
                          <option key={et} value={et}>
                            {et}
                          </option>
                        ))}
                      </SelectInput>
                    </FormField>

                    <FormField label="Party Group">
                      <SelectInput
                        value={formData.partyGroup}
                        onChange={(e) => handleFormChange("partyGroup", e.target.value)}
                        className="bg-white font-semibold h-9"
                      >
                        <option value="">— Not set —</option>
                        {withCurrent(PARTY_GROUPS, formData.partyGroup).map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </SelectInput>
                    </FormField>

                    <FormField label="System Status" required>
                      <SelectInput
                        value={formData.status}
                        onChange={(e) => handleFormChange("status", e.target.value as PartyStatus)}
                        className="bg-white font-bold h-9"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Blocked">Blocked</option>
                      </SelectInput>
                    </FormField>
                  </div>

                  <FormField label="Remarks / Accounting Identification Notes">
                    <TextAreaInput
                      rows={2}
                      value={formData.remarks}
                      onChange={(e) => handleFormChange("remarks", e.target.value)}
                      placeholder="Notes regarding this party's accounting identity..."
                      className="bg-white text-xs"
                    />
                  </FormField>
                </div>
              </div>
            )}

            {/* TAB 2: ADDRESS & CONTACT */}
            {activeTab === "address" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      Billing / Registered Address
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Address Line 1">
                      <TextInput
                        value={formData.addressLine1}
                        onChange={(e) => handleFormChange("addressLine1", e.target.value)}
                        placeholder="Building, street, door no."
                        className="bg-white h-9"
                      />
                    </FormField>

                    <FormField label="Address Line 2">
                      <TextInput
                        value={formData.addressLine2}
                        onChange={(e) => handleFormChange("addressLine2", e.target.value)}
                        placeholder="Area, landmark"
                        className="bg-white h-9"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <FormField label="City">
                      <TextInput
                        value={formData.city}
                        onChange={(e) => handleFormChange("city", e.target.value)}
                        placeholder="City"
                        className="bg-white h-9 font-semibold"
                      />
                    </FormField>

                    <FormField label="State">
                      <TextInput
                        value={formData.state}
                        list="party-states"
                        onChange={(e) => handleFormChange("state", e.target.value)}
                        placeholder="State"
                        className="bg-white h-9 font-semibold"
                      />
                    </FormField>

                    <FormField label="Postal / PIN Code">
                      <TextInput
                        value={formData.postalCode}
                        onChange={(e) => handleFormChange("postalCode", e.target.value)}
                        placeholder="6-digit PIN"
                        className="bg-white font-mono h-9"
                      />
                    </FormField>

                    <FormField label="Country">
                      <TextInput
                        value={formData.country}
                        onChange={(e) => handleFormChange("country", e.target.value)}
                        className="bg-white h-9"
                      />
                    </FormField>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-emerald-600" />
                    Primary Contact & Communication Details
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Contact Person Name">
                      <TextInput
                        value={formData.contactPersonName}
                        onChange={(e) => handleFormChange("contactPersonName", e.target.value)}
                        placeholder="e.g. Mr. Rakesh Sharma"
                        className="bg-white font-semibold h-9"
                      />
                    </FormField>

                    <FormField label="Designation">
                      <TextInput
                        value={formData.contactPersonDesignation}
                        onChange={(e) => handleFormChange("contactPersonDesignation", e.target.value)}
                        placeholder="e.g. Senior Finance Manager"
                        className="bg-white h-9"
                      />
                    </FormField>

                    <FormField label="Contact Person Phone">
                      <TextInput
                        value={formData.contactPersonPhone}
                        onChange={(e) => handleFormChange("contactPersonPhone", e.target.value)}
                        placeholder="+91 98250 00000"
                        className="bg-white font-mono h-9"
                      />
                    </FormField>

                    <FormField label="Contact Person Email">
                      <TextInput
                        type="email"
                        value={formData.contactPersonEmail}
                        onChange={(e) => handleFormChange("contactPersonEmail", e.target.value)}
                        placeholder="name@party.com"
                        className="bg-white font-mono h-9"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="Official Phone / Mobile">
                      <TextInput
                        value={formData.phone}
                        onChange={(e) => handleFormChange("phone", e.target.value)}
                        placeholder="+91 98250 00000"
                        className="bg-white font-mono h-9"
                      />
                    </FormField>

                    <FormField label="Alternate Phone">
                      <TextInput
                        value={formData.alternatePhone}
                        onChange={(e) => handleFormChange("alternatePhone", e.target.value)}
                        placeholder="Alternate phone"
                        className="bg-white font-mono h-9"
                      />
                    </FormField>

                    <FormField label="Email Address">
                      <TextInput
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleFormChange("email", e.target.value)}
                        placeholder="billing@party.com"
                        className="bg-white font-mono h-9"
                      />
                    </FormField>
                  </div>

                  <FormField label="Website / Portal URL">
                    <TextInput
                      value={formData.website}
                      onChange={(e) => handleFormChange("website", e.target.value)}
                      placeholder="https://www.party.com"
                      className="bg-white font-mono h-9"
                    />
                  </FormField>
                </div>
              </div>
            )}

            {/* TAB 3: ACCOUNTING & PAYMENT */}
            {activeTab === "accounting" && (
              <div className="space-y-4">
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
                        value={formData.creditDays}
                        onChange={(e) => handleFormChange("creditDays", parseInt(e.target.value) || 0)}
                        className="bg-white font-mono font-bold text-slate-900 h-9"
                      />
                    </FormField>

                    <FormField label="Credit Limit (INR)">
                      <TextInput
                        type="number"
                        min={0}
                        step={1000}
                        value={formData.creditLimit}
                        onChange={(e) => handleFormChange("creditLimit", parseFloat(e.target.value) || 0)}
                        className="bg-white font-mono font-bold text-slate-900 h-9"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Default Payment Method">
                      <SelectInput
                        value={formData.paymentMethodId ?? ""}
                        onChange={(e) => handleFormChange("paymentMethodId", e.target.value || null)}
                        className="bg-white font-semibold h-9"
                      >
                        <option value="">— None —</option>
                        {paymentMethods.map((pm) => (
                          <option key={pm.id} value={pm.id}>
                            {pm.paymentMethodName}
                          </option>
                        ))}
                        {formData.paymentMethodId &&
                          !paymentMethods.some((pm) => pm.id === formData.paymentMethodId) && (
                            <option value={formData.paymentMethodId}>
                              {activeParty.paymentMethodName ?? "Current method"}
                            </option>
                          )}
                      </SelectInput>
                    </FormField>

                    <FormField label="Billing Currency">
                      <SelectInput
                        value={formData.currencyId ?? ""}
                        onChange={(e) => handleFormChange("currencyId", e.target.value || null)}
                        className="bg-white font-semibold h-9"
                      >
                        <option value="">— Base currency —</option>
                        {currencies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.code} ({c.name} - {c.symbol})
                          </option>
                        ))}
                        {formData.currencyId && !currencies.some((c) => c.id === formData.currencyId) && (
                          <option value={formData.currencyId}>{activeParty.currencyCode ?? "Current currency"}</option>
                        )}
                      </SelectInput>
                    </FormField>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-emerald-600" />
                    Chart of Accounts Ledger Account Linkage
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Receivable Account (Sundry Debtors)">
                      <SelectInput
                        value={formData.receivableAccountId ?? ""}
                        onChange={(e) => handleFormChange("receivableAccountId", e.target.value || null)}
                        className="bg-white font-semibold h-9 text-slate-900"
                      >
                        <option value="">— None —</option>
                        {ledgerOptions(receivableLedgers, formData.receivableAccountId, activeParty.receivableAccountName).map(
                          (o) => (
                            <option key={o.id} value={o.id}>
                              {o.label}
                            </option>
                          )
                        )}
                      </SelectInput>
                    </FormField>

                    <FormField label="Payable Account (Sundry Creditors)">
                      <SelectInput
                        value={formData.payableAccountId ?? ""}
                        onChange={(e) => handleFormChange("payableAccountId", e.target.value || null)}
                        className="bg-white font-semibold h-9 text-slate-900"
                      >
                        <option value="">— None —</option>
                        {ledgerOptions(payableLedgers, formData.payableAccountId, activeParty.payableAccountName).map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.label}
                          </option>
                        ))}
                      </SelectInput>
                    </FormField>
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium">
                    <em>Note:</em> Party Master only establishes linkage to existing Chart of Accounts ledger heads. Posting rules and control accounts are defined under Chart of Accounts.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <Building className="h-4 w-4 text-emerald-600" />
                    Party Bank Account Details (Optional)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Bank Name">
                      <TextInput
                        value={formData.bankName}
                        onChange={(e) => handleFormChange("bankName", e.target.value)}
                        placeholder="e.g. HDFC Bank Ltd"
                        className="bg-white h-9"
                      />
                    </FormField>

                    <FormField label="Bank Account Number">
                      <TextInput
                        value={formData.bankAccountNumber}
                        onChange={(e) => handleFormChange("bankAccountNumber", e.target.value)}
                        placeholder="Account Number"
                        className="bg-white font-mono font-bold h-9"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormField label="IFSC Code">
                      <TextInput
                        value={formData.bankIfsc}
                        onChange={(e) => handleFormChange("bankIfsc", e.target.value.toUpperCase())}
                        placeholder="HDFC0000129"
                        className="bg-white font-mono font-bold uppercase h-9"
                      />
                    </FormField>

                    <FormField label="Branch">
                      <TextInput
                        value={formData.bankBranch}
                        onChange={(e) => handleFormChange("bankBranch", e.target.value)}
                        placeholder="Branch name"
                        className="bg-white h-9"
                      />
                    </FormField>

                    <FormField label="Account Type">
                      <SelectInput
                        value={formData.bankAccountType}
                        onChange={(e) => handleFormChange("bankAccountType", e.target.value)}
                        className="bg-white font-semibold h-9"
                      >
                        <option value="">— Not set —</option>
                        {withCurrent(BANK_ACCOUNT_TYPES, formData.bankAccountType).map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </SelectInput>
                    </FormField>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: TAX & STATUTORY */}
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
                        value={formData.panNumber}
                        onChange={(e) => handleFormChange("panNumber", e.target.value.toUpperCase())}
                        maxLength={10}
                        placeholder="e.g. AAACM0120P"
                        className="bg-white font-mono font-bold uppercase text-slate-900 h-9"
                      />
                    </FormField>

                    <FormField label="GSTIN (GST Identification Number)">
                      <TextInput
                        value={formData.gstin}
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
                        value={formData.gstRegistrationType}
                        onChange={(e) => handleFormChange("gstRegistrationType", e.target.value)}
                        className="bg-white font-semibold h-9"
                      >
                        <option value="">— Not set —</option>
                        {withCurrent(GST_REGISTRATION_TYPES, formData.gstRegistrationType).map((gt) => (
                          <option key={gt} value={gt}>
                            {gt}
                          </option>
                        ))}
                      </SelectInput>
                    </FormField>

                    <FormField label="Tax Jurisdiction State">
                      <TextInput
                        value={formData.state}
                        list="party-states"
                        onChange={(e) => handleFormChange("state", e.target.value)}
                        placeholder="State"
                        className="bg-white font-semibold h-9"
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField label="TAN Number (TDS / TCS)">
                      <TextInput
                        value={formData.tanNumber}
                        onChange={(e) => handleFormChange("tanNumber", e.target.value.toUpperCase())}
                        maxLength={10}
                        placeholder="e.g. DELM09912E"
                        className="bg-white font-mono uppercase h-9"
                      />
                    </FormField>

                    <FormField label="MSME / Udyam Number (Where Applicable)">
                      <TextInput
                        value={formData.msmeNumber}
                        onChange={(e) => handleFormChange("msmeNumber", e.target.value)}
                        placeholder="UDYAM-XX-00-00000"
                        className="bg-white font-mono h-9"
                      />
                    </FormField>

                    <FormField label="MSME Category">
                      <SelectInput
                        value={formData.msmeType}
                        onChange={(e) => handleFormChange("msmeType", e.target.value)}
                        className="bg-white font-semibold h-9"
                      >
                        <option value="">— Not set —</option>
                        {withCurrent(MSME_TYPES, formData.msmeType).map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </SelectInput>
                    </FormField>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-slate-700 text-[11px] space-y-1">
                    <span className="font-bold text-emerald-950 block">Tax Master Responsibility Separation:</span>
                    <p className="leading-relaxed">
                      Party Master stores only the party&apos;s statutory identifiers (GSTIN, PAN, TAN, MSME). Tax rates, HSN/SAC codes, and GST calculation rules are configured under <strong>Tax / GST Master</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <Button
                type="button"
                size="sm"
                disabled={saving}
                onClick={() => void handleSaveParty()}
                className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                Save Changes
              </Button>
            </div>
          </div>
          </>
          )}
        </div>
      </div>
      )}

      <datalist id="party-states">
        {INDIAN_STATES.map((st) => (
          <option key={st} value={st} />
        ))}
      </datalist>

      {/* CREATE PARTY MODAL / WIZARD */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-5 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
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

            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              {(
                [
                  { step: 1, label: "1. Identity" },
                  { step: 2, label: "2. Contact & Address" },
                  { step: 3, label: "3. Accounts & Terms" },
                  { step: 4, label: "4. Tax & Statutory" },
                ] as const
              ).map((s) => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setCreateStep(s.step)}
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

            {createStep === 1 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Parent Party Type" required>
                    <SelectInput
                      value={createForm.partyTypeId ?? ""}
                      onChange={(e) => {
                        const nextType = e.target.value || null;
                        const matching = subTypes.filter((s) => s.partyTypeId === nextType);
                        setCreateForm((prev) => ({
                          ...prev,
                          partyTypeId: nextType,
                          partySubTypeId: matching[0]?.id ?? null,
                        }));
                      }}
                      className="bg-white font-bold h-9"
                    >
                      {partyTypes.length === 0 && <option value="">No active party types</option>}
                      {partyTypes.map((pt) => (
                        <option key={pt.id} value={pt.id}>
                          {pt.typeName} ({pt.typeCode})
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>

                  <FormField label="Party Sub Type">
                    <SelectInput
                      value={createForm.partySubTypeId ?? ""}
                      onChange={(e) => setCreateField("partySubTypeId", e.target.value || null)}
                      className="bg-white font-bold h-9"
                    >
                      <option value="">— None —</option>
                      {subTypes
                        .filter((s) => s.partyTypeId === createForm.partyTypeId)
                        .map((st) => (
                          <option key={st.id} value={st.id}>
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
                        onChange={(e) => setCreateField("partyName", e.target.value)}
                        placeholder="e.g. ABC Corporate Enterprises Pvt Ltd"
                        className="bg-white font-bold text-slate-900 h-9"
                      />
                    </FormField>
                  </div>

                  <FormField label="Short Name / Alias">
                    <TextInput
                      value={createForm.shortName}
                      onChange={(e) => setCreateField("shortName", e.target.value)}
                      placeholder="e.g. ABC"
                      className="bg-white font-mono font-bold h-9"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <FormField label="Entity Legal Form" required>
                    <SelectInput
                      value={createForm.entityType}
                      onChange={(e) => setCreateField("entityType", e.target.value)}
                      className="bg-white font-bold h-9"
                    >
                      {ENTITY_TYPES.map((et) => (
                        <option key={et} value={et}>
                          {et}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>

                  <FormField label="Party Group">
                    <SelectInput
                      value={createForm.partyGroup}
                      onChange={(e) => setCreateField("partyGroup", e.target.value)}
                      className="bg-white font-semibold h-9"
                    >
                      <option value="">— Not set —</option>
                      {PARTY_GROUPS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>

                  <FormField label="Party Code (Optional)">
                    <TextInput
                      value={createForm.partyCode}
                      onChange={(e) => setCreateField("partyCode", e.target.value.toUpperCase())}
                      placeholder="Auto (P-0001)"
                      className="bg-white font-mono h-9"
                    />
                  </FormField>
                </div>
              </div>
            )}

            {createStep === 2 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Contact Person Name">
                    <TextInput
                      value={createForm.contactPersonName}
                      onChange={(e) => setCreateField("contactPersonName", e.target.value)}
                      placeholder="Contact Name"
                      className="bg-white h-9"
                    />
                  </FormField>

                  <FormField label="Designation">
                    <TextInput
                      value={createForm.contactPersonDesignation}
                      onChange={(e) => setCreateField("contactPersonDesignation", e.target.value)}
                      placeholder="Finance Manager / Director"
                      className="bg-white h-9"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Phone / Mobile">
                    <TextInput
                      value={createForm.phone}
                      onChange={(e) => setCreateField("phone", e.target.value)}
                      placeholder="+91 98250 00000"
                      className="bg-white font-mono h-9"
                    />
                  </FormField>

                  <FormField label="Email Address">
                    <TextInput
                      value={createForm.email}
                      onChange={(e) => setCreateField("email", e.target.value)}
                      placeholder="accounts@party.com"
                      className="bg-white font-mono h-9"
                    />
                  </FormField>
                </div>

                <FormField label="Address Line 1">
                  <TextInput
                    value={createForm.addressLine1}
                    onChange={(e) => setCreateField("addressLine1", e.target.value)}
                    placeholder="Building, street, door no."
                    className="bg-white h-9"
                  />
                </FormField>

                <div className="grid grid-cols-3 gap-3">
                  <FormField label="City">
                    <TextInput
                      value={createForm.city}
                      onChange={(e) => setCreateField("city", e.target.value)}
                      className="bg-white h-9"
                    />
                  </FormField>

                  <FormField label="State">
                    <TextInput
                      value={createForm.state}
                      list="party-states"
                      onChange={(e) => setCreateField("state", e.target.value)}
                      className="bg-white h-9"
                    />
                  </FormField>

                  <FormField label="PIN Code">
                    <TextInput
                      value={createForm.postalCode}
                      onChange={(e) => setCreateField("postalCode", e.target.value)}
                      className="bg-white font-mono h-9"
                    />
                  </FormField>
                </div>
              </div>
            )}

            {createStep === 3 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Credit Days Terms">
                    <TextInput
                      type="number"
                      min={0}
                      value={createForm.creditDays}
                      onChange={(e) => setCreateField("creditDays", parseInt(e.target.value) || 0)}
                      className="bg-white font-mono font-bold h-9"
                    />
                  </FormField>

                  <FormField label="Credit Limit (INR)">
                    <TextInput
                      type="number"
                      min={0}
                      value={createForm.creditLimit}
                      onChange={(e) => setCreateField("creditLimit", parseFloat(e.target.value) || 0)}
                      className="bg-white font-mono font-bold h-9"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Default Payment Method">
                    <SelectInput
                      value={createForm.paymentMethodId ?? ""}
                      onChange={(e) => setCreateField("paymentMethodId", e.target.value || null)}
                      className="bg-white font-semibold h-9"
                    >
                      <option value="">— None —</option>
                      {paymentMethods.map((pm) => (
                        <option key={pm.id} value={pm.id}>
                          {pm.paymentMethodName}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>

                  <FormField label="Billing Currency">
                    <SelectInput
                      value={createForm.currencyId ?? ""}
                      onChange={(e) => setCreateField("currencyId", e.target.value || null)}
                      className="bg-white font-semibold h-9"
                    >
                      <option value="">— Base currency —</option>
                      {currencies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} ({c.name})
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Receivable Account Head">
                    <SelectInput
                      value={createForm.receivableAccountId ?? ""}
                      onChange={(e) => setCreateField("receivableAccountId", e.target.value || null)}
                      className="bg-white font-semibold h-9"
                    >
                      <option value="">— None —</option>
                      {receivableLedgers.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} - {acc.name}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>

                  <FormField label="Payable Account Head">
                    <SelectInput
                      value={createForm.payableAccountId ?? ""}
                      onChange={(e) => setCreateField("payableAccountId", e.target.value || null)}
                      className="bg-white font-semibold h-9"
                    >
                      <option value="">— None —</option>
                      {payableLedgers.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} - {acc.name}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>
                </div>
              </div>
            )}

            {createStep === 4 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="PAN Number">
                    <TextInput
                      value={createForm.panNumber}
                      onChange={(e) => setCreateField("panNumber", e.target.value.toUpperCase())}
                      placeholder="AAACM0120P"
                      className="bg-white font-mono font-bold uppercase h-9"
                    />
                  </FormField>

                  <FormField label="GSTIN">
                    <TextInput
                      value={createForm.gstin}
                      onChange={(e) => setCreateField("gstin", e.target.value.toUpperCase())}
                      placeholder="06AAACM0120P1Z2"
                      className="bg-white font-mono font-bold uppercase h-9"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="GST Registration Type">
                    <SelectInput
                      value={createForm.gstRegistrationType}
                      onChange={(e) => setCreateField("gstRegistrationType", e.target.value)}
                      className="bg-white font-semibold h-9"
                    >
                      {GST_REGISTRATION_TYPES.map((gt) => (
                        <option key={gt} value={gt}>
                          {gt}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>

                  <FormField label="MSME Category">
                    <SelectInput
                      value={createForm.msmeType}
                      onChange={(e) => setCreateField("msmeType", e.target.value)}
                      className="bg-white font-semibold h-9"
                    >
                      {MSME_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div>
                {createStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCreateStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev))}
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
                    onClick={() => setCreateStep((prev) => (prev < 4 ? ((prev + 1) as 2 | 3 | 4) : prev))}
                    className="rounded-xl bg-slate-900 text-white text-xs font-bold"
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    disabled={saving}
                    onClick={() => void handleCreateParty()}
                    className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
                  >
                    {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                    Create Party
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEACTIVATION CONFIRMATION MODAL */}
      {showDeactivateConfirm && activeParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Ban className="h-5 w-5 text-amber-600" />
              <span>Deactivate Party Master Record?</span>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Are you sure you want to deactivate <strong className="text-slate-900 font-bold">{activeParty.partyName} ({activeParty.partyCode})</strong>?
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
                onClick={() => void handleConfirmDeactivate()}
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
