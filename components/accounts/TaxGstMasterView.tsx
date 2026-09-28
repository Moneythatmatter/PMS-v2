"use client";

import React, { useState, useMemo } from "react";
import {
  Percent,
  Plus,
  Save,
  Search,
  X,
  Power,
  Trash2,
  FileText,
  Sliders,
  Info,
  ShieldCheck,
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
import {
  accTaxDefinitionService,
  accTaxRuleService,
  type Status,
  type TaxDefinition,
  type TaxRule,
} from "@/services/accounts";
import {
  CompanySelector,
  MasterFormSection,
  MasterAuditInfo,
  MasterActivationDialog,
  MasterDeleteProtectionDialog,
} from "@/components/accounts/MasterComponents";
import {
  accErrorMessage,
  formatDate,
  formatINR,
  invalidateAccLookups,
  todayIso,
  useAccLookups,
  useAccQuery,
} from "@/components/accounts/accountsApi";
import { cn } from "@/lib/utils";

const TAX_TYPES = ["GST", "CGST", "SGST", "IGST", "Cess", "TDS", "Other"] as const;
const APPLICABILITY_TYPES = [
  { value: "Revenue Category", label: "Revenue Category" },
  { value: "Department", label: "Department / Division" },
  { value: "Amount Slab", label: "Amount Slab Only" },
  { value: "Service", label: "Service" },
] as const;

type TaxDefForm = Pick<
  TaxDefinition,
  | "taxCode"
  | "taxName"
  | "taxType"
  | "rate"
  | "calculationType"
  | "hsnSacCode"
  | "outputAccountId"
  | "description"
  | "status"
  | "companyId"
>;

type TaxRuleForm = Pick<
  TaxRule,
  | "taxRuleCode"
  | "taxRuleName"
  | "taxId"
  | "applicabilityType"
  | "serviceType"
  | "revenueCategoryId"
  | "divisionId"
  | "minimumAmount"
  | "maximumAmount"
  | "priority"
  | "effectiveFrom"
  | "effectiveTo"
  | "description"
  | "status"
  | "companyId"
>;

function blankDefForm(companyId: string | null): TaxDefForm {
  return {
    taxCode: "",
    taxName: "",
    taxType: "GST",
    rate: 0,
    calculationType: "Percentage",
    hsnSacCode: "",
    outputAccountId: null,
    description: "",
    status: "Active",
    companyId,
  };
}

function toDefForm(t: TaxDefinition): TaxDefForm {
  return {
    taxCode: t.taxCode,
    taxName: t.taxName,
    taxType: t.taxType,
    rate: Number(t.rate),
    calculationType: t.calculationType,
    hsnSacCode: t.hsnSacCode ?? "",
    outputAccountId: t.outputAccountId,
    description: t.description ?? "",
    status: t.status,
    companyId: t.companyId,
  };
}

function toRuleForm(r: TaxRule): TaxRuleForm {
  return {
    taxRuleCode: r.taxRuleCode,
    taxRuleName: r.taxRuleName,
    taxId: r.taxId,
    applicabilityType: r.applicabilityType,
    serviceType: r.serviceType ?? "",
    revenueCategoryId: r.revenueCategoryId,
    divisionId: r.divisionId,
    minimumAmount: r.minimumAmount,
    maximumAmount: r.maximumAmount,
    priority: r.priority,
    effectiveFrom: r.effectiveFrom,
    effectiveTo: r.effectiveTo,
    description: r.description ?? "",
    status: r.status,
    companyId: r.companyId,
  };
}

function formatRate(rate: number, calculationType: TaxDefinition["calculationType"]): string {
  return calculationType === "Fixed" ? formatINR(rate) : `${Number(rate)}%`;
}

export function TaxGstMasterView() {
  // Tab Navigation ('definitions' | 'rules' | 'audit')
  const [activeTab, setActiveTab] = useState<"definitions" | "rules" | "audit">("definitions");

  const taxQuery = useAccQuery(() => accTaxDefinitionService.list(), []);
  const ruleQuery = useAccQuery(() => accTaxRuleService.list(), []);
  const { lookups } = useAccLookups();
  const allTaxDefinitions = useMemo(() => taxQuery.data ?? [], [taxQuery.data]);
  const allTaxRules = useMemo(() => ruleQuery.data ?? [], [ruleQuery.data]);

  // Company Selector State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  // Tax Definitions State
  const [selectedTaxId, setSelectedTaxId] = useState<string | null>(null);
  const [isCreatingDef, setIsCreatingDef] = useState(false);
  const [defDraft, setDefDraft] = useState<TaxDefForm | null>(null);

  // Tax Rules State
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [isEditingRule, setIsEditingRule] = useState(false);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [ruleFormData, setRuleFormData] = useState<TaxRuleForm | null>(null);

  const [saving, setSaving] = useState(false);

  // Search & Filters for Tax Definitions
  const [defSearchQuery, setDefSearchQuery] = useState("");
  const [defStatusFilter, setDefStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [defTypeFilter, setDefTypeFilter] = useState<string>("All");

  // Search & Filters for Tax Rules
  const [ruleSearchQuery, setRuleSearchQuery] = useState("");
  const [ruleStatusFilter, setRuleStatusFilter] = useState<"All" | "Active" | "Inactive">("All");

  // Toast Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const notify = (message: string, variant: "success" | "error" = "success") => {
    setToastVariant(variant);
    setToastMessage(message);
  };

  // Protection & Activation Dialog State
  const [showDefActivationDialog, setShowDefActivationDialog] = useState(false);
  const [deleteDialogProps, setDeleteDialogProps] = useState<{
    isOpen: boolean;
    childCount: number;
    recordName: string;
  }>({ isOpen: false, childCount: 0, recordName: "" });

  // Records shared across companies (no company) plus those of the selected company
  const taxDefinitions = useMemo(
    () =>
      allTaxDefinitions.filter(
        (t) => !selectedCompanyId || !t.companyId || t.companyId === selectedCompanyId
      ),
    [allTaxDefinitions, selectedCompanyId]
  );
  const taxRules = useMemo(
    () =>
      allTaxRules.filter(
        (r) => !selectedCompanyId || !r.companyId || r.companyId === selectedCompanyId
      ),
    [allTaxRules, selectedCompanyId]
  );
  const calcTypeByTaxId = useMemo(
    () => new Map(allTaxDefinitions.map((t) => [t.id, t.calculationType])),
    [allTaxDefinitions]
  );

  const liabilityLedgers = useMemo(
    () => (lookups?.ledgers ?? []).filter((a) => a.nature === "Liability"),
    [lookups]
  );
  const revenueCategories = lookups?.revenueCategories ?? [];
  const divisions = lookups?.divisions ?? [];

  const taxTypeOptions = useMemo(() => {
    const extra = allTaxDefinitions
      .map((t) => t.taxType)
      .filter((t) => t && !(TAX_TYPES as readonly string[]).includes(t));
    return [...TAX_TYPES, ...Array.from(new Set(extra))];
  }, [allTaxDefinitions]);

  // Filtered Tax Definitions
  const filteredTaxDefinitions = useMemo(() => {
    return taxDefinitions.filter((t) => {
      if (defStatusFilter !== "All" && t.status !== defStatusFilter) return false;
      if (defTypeFilter !== "All" && t.taxType !== defTypeFilter) return false;
      if (defSearchQuery) {
        const q = defSearchQuery.toLowerCase();
        return (
          t.taxCode.toLowerCase().includes(q) ||
          t.taxName.toLowerCase().includes(q) ||
          t.taxType.toLowerCase().includes(q) ||
          (t.hsnSacCode ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [taxDefinitions, defSearchQuery, defStatusFilter, defTypeFilter]);

  // Filtered Tax Rules
  const filteredTaxRules = useMemo(() => {
    return taxRules.filter((r) => {
      if (ruleStatusFilter !== "All" && r.status !== ruleStatusFilter) return false;
      if (ruleSearchQuery) {
        const q = ruleSearchQuery.toLowerCase();
        return (
          r.taxRuleCode.toLowerCase().includes(q) ||
          r.taxRuleName.toLowerCase().includes(q) ||
          (r.taxCode ?? "").toLowerCase().includes(q) ||
          (r.revenueCategoryName ?? "").toLowerCase().includes(q) ||
          (r.divisionName ?? "").toLowerCase().includes(q) ||
          (r.description ?? "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [taxRules, ruleSearchQuery, ruleStatusFilter]);

  // Active Selected Tax Definition (falls back to the first visible record)
  const activeTaxDef: TaxDefinition | null = isCreatingDef
    ? null
    : allTaxDefinitions.find((t) => t.id === selectedTaxId) ?? filteredTaxDefinitions[0] ?? null;
  const defFormData: TaxDefForm =
    defDraft ?? (activeTaxDef ? toDefForm(activeTaxDef) : blankDefForm(selectedCompanyId || null));
  const showDefForm = isCreatingDef || activeTaxDef !== null;

  const reloadAll = async () => {
    await Promise.all([taxQuery.reload(), ruleQuery.reload()]);
  };

  // ==========================================
  // TAX DEFINITION ACTIONS
  // ==========================================
  const handleDefFormChange = <K extends keyof TaxDefForm>(field: K, value: TaxDefForm[K]) => {
    setDefDraft((prev) => ({ ...(prev ?? defFormData), [field]: value }));
  };

  const selectTaxDef = (id: string) => {
    setSelectedTaxId(id);
    setIsCreatingDef(false);
    setDefDraft(null);
  };

  const handleNewTaxDefinition = () => {
    setIsCreatingDef(true);
    setDefDraft(blankDefForm(selectedCompanyId || null));
    setActiveTab("definitions");
    notify("Fill in the fields and click Save to create a new Tax Definition.");
  };

  const persistTaxDefinition = async (form: TaxDefForm, successMessage: (saved: TaxDefinition) => string) => {
    setSaving(true);
    try {
      const payload: Partial<TaxDefinition> = {
        ...form,
        taxCode: form.taxCode.trim().toUpperCase(),
        taxName: form.taxName.trim(),
        hsnSacCode: form.hsnSacCode.trim(),
        rate: Number(form.rate) || 0,
        companyId: form.companyId || selectedCompanyId || null,
      };
      const saved =
        isCreatingDef || !activeTaxDef
          ? await accTaxDefinitionService.create(payload)
          : await accTaxDefinitionService.update(activeTaxDef.id, payload);
      invalidateAccLookups();
      await reloadAll();
      setSelectedTaxId(saved.id);
      setIsCreatingDef(false);
      setDefDraft(null);
      notify(successMessage(saved));
    } catch (e) {
      notify(accErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTaxDefinition = () => {
    if (!defFormData.taxCode.trim()) {
      notify("Tax Code is required.", "error");
      return;
    }
    if (!defFormData.taxName.trim()) {
      notify("Tax Name is required.", "error");
      return;
    }
    if (defFormData.rate < 0) {
      notify("Tax Rate must be non-negative.", "error");
      return;
    }
    if (defFormData.calculationType === "Percentage" && defFormData.rate > 100) {
      notify("Tax Rate must be between 0 and 100.", "error");
      return;
    }
    const creating = isCreatingDef;
    void persistTaxDefinition(defFormData, (saved) =>
      creating
        ? `Created Tax Definition '${saved.taxName}' successfully.`
        : `Saved Tax Definition '${saved.taxName}' successfully.`
    );
  };

  const handleToggleDefActivation = () => {
    if (!activeTaxDef) return;
    const targetStatus: Status = activeTaxDef.status === "Active" ? "Inactive" : "Active";
    void persistTaxDefinition(
      { ...toDefForm(activeTaxDef), status: targetStatus },
      (saved) => `Tax Definition '${saved.taxName}' is now ${targetStatus.toUpperCase()}.`
    );
  };

  const handleDeleteDefAttempt = async () => {
    if (!activeTaxDef) return;
    if (activeTaxDef.ruleCount > 0) {
      setDeleteDialogProps({
        isOpen: true,
        childCount: activeTaxDef.ruleCount,
        recordName: activeTaxDef.taxName,
      });
      return;
    }
    if (!window.confirm(`Delete tax definition '${activeTaxDef.taxName}'? This cannot be undone.`)) return;

    setSaving(true);
    try {
      await accTaxDefinitionService.remove(activeTaxDef.id);
      invalidateAccLookups();
      setSelectedTaxId(null);
      setDefDraft(null);
      await taxQuery.reload();
      notify(`Deleted Tax Definition '${activeTaxDef.taxName}'.`);
    } catch (e) {
      notify(accErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // TAX RULE ACTIONS
  // ==========================================
  const handleRuleFormChange = <K extends keyof TaxRuleForm>(field: K, value: TaxRuleForm[K]) => {
    setRuleFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const closeRuleEditor = () => {
    setIsEditingRule(false);
    setIsCreatingRule(false);
    setRuleFormData(null);
  };

  const handleNewTaxRule = () => {
    const firstActiveTax = taxDefinitions.find((t) => t.status === "Active");
    const maxPriority = taxRules.reduce((m, r) => Math.max(m, r.priority), 0);
    setRuleFormData({
      taxRuleCode: "",
      taxRuleName: "",
      taxId: firstActiveTax?.id ?? "",
      applicabilityType: "Revenue Category",
      serviceType: "",
      revenueCategoryId: null,
      divisionId: null,
      minimumAmount: 0,
      maximumAmount: null,
      priority: maxPriority + 1,
      effectiveFrom: todayIso(),
      effectiveTo: null,
      description: "",
      status: "Active",
      companyId: selectedCompanyId || null,
    });
    setSelectedRuleId(null);
    setIsCreatingRule(true);
    setIsEditingRule(true);
    setActiveTab("rules");
    notify("Configure the new rule parameters and click Save.");
  };

  const handleSaveTaxRule = async () => {
    if (!ruleFormData) return;
    if (!ruleFormData.taxRuleCode.trim()) {
      notify("Rule Code is required.", "error");
      return;
    }
    if (!ruleFormData.taxRuleName.trim()) {
      notify("Rule Name is required.", "error");
      return;
    }
    if (!ruleFormData.taxId) {
      notify("Applicable Tax Definition is required.", "error");
      return;
    }
    if (ruleFormData.minimumAmount !== null && ruleFormData.minimumAmount < 0) {
      notify("Minimum Amount cannot be negative.", "error");
      return;
    }
    if (
      ruleFormData.minimumAmount !== null &&
      ruleFormData.maximumAmount !== null &&
      ruleFormData.maximumAmount < ruleFormData.minimumAmount
    ) {
      notify("Maximum Amount must be greater than the Minimum Amount.", "error");
      return;
    }
    if (!ruleFormData.effectiveFrom) {
      notify("Effective From date is required.", "error");
      return;
    }
    if (ruleFormData.effectiveTo && ruleFormData.effectiveTo < ruleFormData.effectiveFrom) {
      notify("Effective To must be on or after Effective From.", "error");
      return;
    }

    // Overlap Slab Check Warning
    const overlapping = allTaxRules.filter(
      (r) =>
        r.id !== selectedRuleId &&
        r.status === "Active" &&
        r.revenueCategoryId === ruleFormData.revenueCategoryId &&
        r.divisionId === ruleFormData.divisionId &&
        r.applicabilityType === ruleFormData.applicabilityType
    );
    const minA = ruleFormData.minimumAmount ?? 0;
    const maxA = ruleFormData.maximumAmount ?? Infinity;
    const overlapWarning = overlapping.some((other) => {
      const minB = other.minimumAmount ?? 0;
      const maxB = other.maximumAmount ?? Infinity;
      return minA <= maxB && maxA >= minB;
    });

    setSaving(true);
    try {
      const payload: Partial<TaxRule> = {
        ...ruleFormData,
        taxRuleCode: ruleFormData.taxRuleCode.trim().toUpperCase(),
        taxRuleName: ruleFormData.taxRuleName.trim(),
        serviceType: ruleFormData.serviceType.trim(),
        companyId: ruleFormData.companyId || selectedCompanyId || null,
      };
      const saved =
        isCreatingRule || !selectedRuleId
          ? await accTaxRuleService.create(payload)
          : await accTaxRuleService.update(selectedRuleId, payload);
      await reloadAll();
      setSelectedRuleId(saved.id);
      closeRuleEditor();
      notify(
        overlapWarning
          ? `Saved Rule '${saved.taxRuleName}'. Notice: Slabs overlap with an existing active rule for this scope.`
          : `Saved Tax Rule '${saved.taxRuleName}' successfully.`
      );
    } catch (e) {
      notify(accErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (rule: TaxRule) => {
    if (!window.confirm(`Delete tax rule '${rule.taxRuleName}' (${rule.taxRuleCode})? This cannot be undone.`)) {
      return;
    }
    setSaving(true);
    try {
      await accTaxRuleService.remove(rule.id);
      if (selectedRuleId === rule.id) {
        setSelectedRuleId(null);
        closeRuleEditor();
      }
      await reloadAll();
      notify(`Deleted Tax Rule '${rule.taxRuleName}'.`);
    } catch (e) {
      notify(accErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const ruleTaxOptions = taxDefinitions.filter(
    (t) => t.status === "Active" || t.id === ruleFormData?.taxId
  );
  const applicabilityOptions: { value: string; label: string }[] = [...APPLICABILITY_TYPES];
  if (
    ruleFormData?.applicabilityType &&
    !applicabilityOptions.some((o) => o.value === ruleFormData.applicabilityType)
  ) {
    applicabilityOptions.push({ value: ruleFormData.applicabilityType, label: ruleFormData.applicabilityType });
  }

  const renderLoadState = (
    query: { data: unknown; loading: boolean; error: string | null; reload: () => Promise<unknown> },
    label: string
  ) => {
    if (query.loading && !query.data) {
      return (
        <div className="p-6 flex items-center justify-center gap-2 text-slate-400 font-medium">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading {label}…
        </div>
      );
    }
    if (query.error && !query.data) {
      return (
        <div className="p-6 text-center space-y-2">
          <p className="text-rose-600 font-semibold">{query.error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void query.reload()}
            className="rounded-xl text-xs font-semibold"
          >
            Retry
          </Button>
        </div>
      );
    }
    return null;
  };

  const defLoadState = renderLoadState(taxQuery, "tax definitions");
  const ruleLoadState = renderLoadState(ruleQuery, "tax rules");

  return (
    <ModulePageShell
      eyebrow="Accounts & Masters"
      title="Tax / GST Master"
      description="Manage tax definitions and applicability rules used across hotel billing."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Masters", href: "/accounts/masters/chart-of-accounts" },
        { label: "Tax/GST Master" },
      ]}
      toast={toastMessage}
      toastVariant={toastVariant}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "definitions" ? (
            <>
              <Button
                type="button"
                size="sm"
                onClick={handleNewTaxDefinition}
                disabled={saving}
                className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                New Tax
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleSaveTaxDefinition}
                disabled={saving || !showDefForm}
                className="rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-1" />
                )}
                Save Changes
              </Button>

              {!isCreatingDef && activeTaxDef && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDefActivationDialog(true)}
                    disabled={saving}
                    className={cn(
                      "rounded-xl text-xs font-bold border cursor-pointer",
                      activeTaxDef.status === "Active"
                        ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                        : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                    )}
                  >
                    <Power className="h-3.5 w-3.5 mr-1" />
                    {activeTaxDef.status === "Active" ? "Deactivate" : "Activate"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleDeleteDefAttempt()}
                    disabled={saving}
                    className="rounded-xl text-xs font-semibold bg-white border-rose-200 text-rose-700 hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1 text-rose-600" />
                    Delete
                  </Button>
                </>
              )}

              {(isCreatingDef || defDraft) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreatingDef(false);
                    setDefDraft(null);
                  }}
                  disabled={saving}
                  className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
                >
                  Cancel
                </Button>
              )}
            </>
          ) : activeTab === "rules" ? (
            <>
              <Button
                type="button"
                size="sm"
                onClick={handleNewTaxRule}
                disabled={saving}
                className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                New Tax Rule
              </Button>

              {isEditingRule && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleSaveTaxRule()}
                    disabled={saving}
                    className="rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5 mr-1" />
                    Save Rule
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={closeRuleEditor}
                    disabled={saving}
                    className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </Button>
                </>
              )}
            </>
          ) : null}
        </div>
      }
    >
      {/* Top Company Selector Bar */}
      <div className="mb-3">
        <CompanySelector
          selectedCompanyId={selectedCompanyId}
          onCompanyChange={setSelectedCompanyId}
        />
      </div>

      {/* Concept Clarification Banner */}
      <div className="mb-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
            <Info className="h-4 w-4" />
          </div>
          <div className="text-xs">
            <span className="text-emerald-900 font-medium">
              Tax Definitions define the tax. Tax Rules determine when the tax applies. Billing uses the matching active rule automatically.
            </span>
          </div>
        </div>
      </div>

      {/* 3 Main Tabs */}
      <div className="mb-4 flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => {
            setActiveTab("definitions");
            closeRuleEditor();
          }}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer",
            activeTab === "definitions"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl"
              : "border-transparent text-slate-600 hover:text-slate-900"
          )}
        >
          <Percent className="h-3.5 w-3.5" />
          1. Tax Definitions ({taxDefinitions.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("rules");
            setIsCreatingDef(false);
            setDefDraft(null);
          }}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer",
            activeTab === "rules"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl"
              : "border-transparent text-slate-600 hover:text-slate-900"
          )}
        >
          <Sliders className="h-3.5 w-3.5" />
          2. Tax Rules / Slabs ({taxRules.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("audit");
            closeRuleEditor();
            setIsCreatingDef(false);
            setDefDraft(null);
          }}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-colors cursor-pointer",
            activeTab === "audit"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl"
              : "border-transparent text-slate-600 hover:text-slate-900"
          )}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          3. Audit & System
        </button>
      </div>

      {/* TAB 1: TAX DEFINITIONS */}
      {activeTab === "definitions" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 font-sans text-xs">
          {/* Left Panel: Tax Definitions List */}
          <div className="md:col-span-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col min-h-[500px]">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Percent className="h-4.5 w-4.5 text-emerald-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Tax Rates ({filteredTaxDefinitions.length})
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                Tax Defs
              </span>
            </div>

            {/* Search */}
            <div className="relative mb-2.5">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={defSearchQuery}
                onChange={(e) => setDefSearchQuery(e.target.value)}
                placeholder="Search code, name, HSN/SAC..."
                className="h-8 w-full rounded-xl border border-slate-300 bg-white pl-8 pr-7 text-xs font-medium text-slate-900 focus:border-emerald-600 focus:outline-none placeholder:text-slate-400"
              />
              {defSearchQuery && (
                <button
                  type="button"
                  onClick={() => setDefSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={defStatusFilter}
                  onChange={(e) =>
                    setDefStatusFilter(e.target.value as "All" | "Active" | "Inactive")
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
                  Tax Type
                </label>
                <select
                  value={defTypeFilter}
                  onChange={(e) => setDefTypeFilter(e.target.value)}
                  className="h-7 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-[11px] font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="All">All Types</option>
                  {taxTypeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[420px]">
              {defLoadState ??
                (filteredTaxDefinitions.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 font-medium">
                    {taxDefinitions.length === 0
                      ? "No tax definitions yet. Click “New Tax” to create one."
                      : "No tax definitions match your search or filter."}
                  </div>
                ) : (
                  filteredTaxDefinitions.map((item) => {
                    const isSelected = activeTaxDef?.id === item.id && !isCreatingDef;
                    return (
                      <div
                        key={item.id}
                        onClick={() => selectTaxDef(item.id)}
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
                                {item.taxCode}
                              </span>
                              <span>{item.taxName}</span>
                            </h4>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              Rate:{" "}
                              <strong className="text-emerald-800 font-bold">
                                {formatRate(item.rate, item.calculationType)}
                              </strong>{" "}
                              ({item.calculationType})
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
                            {item.taxType}
                          </span>
                          <span className="font-mono text-slate-500 text-[10px] font-semibold">
                            {item.ruleCount} rules
                          </span>
                        </div>
                      </div>
                    );
                  })
                ))}
            </div>
          </div>

          {/* Right Panel: Tax Definition Form */}
          <div className="md:col-span-8 space-y-4">
            {!showDefForm ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-2xs">
                <Percent className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No tax definition selected</p>
                <p className="text-xs text-slate-500 mt-1">
                  {taxQuery.loading
                    ? "Loading tax definitions…"
                    : "Select a tax from the list or create a new one."}
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Percent className="h-5 w-5 text-emerald-700" />
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                          {isCreatingDef ? "New Tax Definition" : "Tax Definition Details"}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {isCreatingDef
                          ? "Define a statutory tax percentage rate and code."
                          : `Selected: ${defFormData.taxName} (${defFormData.taxCode})`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-emerald-50 text-xs font-bold text-emerald-900 border border-emerald-200 font-mono">
                        {formatRate(defFormData.rate, defFormData.calculationType)}{" "}
                        {defFormData.calculationType === "Fixed" ? "Fixed" : "Rate"}
                      </span>

                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold border",
                          defFormData.status === "Active"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            defFormData.status === "Active" ? "bg-emerald-600" : "bg-slate-400"
                          )}
                        />
                        {defFormData.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* General Info */}
                <MasterFormSection
                  title="General Tax Information"
                  subtitle="Tax identification, rate, calculation method, and output ledger."
                  icon={<FileText className="h-4 w-4" />}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Tax ID">
                      <TextInput
                        value={activeTaxDef?.id ?? "Auto-generated on save"}
                        readOnly
                        className="bg-slate-50 font-mono font-bold text-slate-700 cursor-not-allowed"
                      />
                    </FormField>

                    <FormField
                      label="Tax Code"
                      required
                      helperText="Unique uppercase identifier (e.g. GST12, GST18, CGST9, SGST9)."
                    >
                      <TextInput
                        value={defFormData.taxCode}
                        onChange={(e) =>
                          handleDefFormChange("taxCode", e.target.value.toUpperCase())
                        }
                        placeholder="e.g. GST12, GST18"
                        className="font-mono font-bold text-slate-900"
                      />
                    </FormField>

                    <FormField label="Tax Name" required>
                      <TextInput
                        value={defFormData.taxName}
                        onChange={(e) => handleDefFormChange("taxName", e.target.value)}
                        placeholder="e.g. GST 12%, GST 18%..."
                        className="font-bold text-slate-900"
                      />
                    </FormField>

                    <FormField label="Tax Type" required>
                      <SelectInput
                        value={defFormData.taxType}
                        onChange={(e) => handleDefFormChange("taxType", e.target.value)}
                      >
                        {taxTypeOptions.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </SelectInput>
                    </FormField>

                    <FormField
                      label={defFormData.calculationType === "Fixed" ? "Fixed Amount (₹)" : "Tax Rate (%)"}
                      required
                      helperText={
                        defFormData.calculationType === "Fixed"
                          ? "Flat amount charged per taxable unit."
                          : "Statutory percentage rate (0–100) applied on taxable amounts."
                      }
                    >
                      <TextInput
                        type="number"
                        step="0.01"
                        min="0"
                        value={defFormData.rate}
                        onChange={(e) =>
                          handleDefFormChange("rate", parseFloat(e.target.value) || 0)
                        }
                        className="font-mono font-bold text-emerald-900"
                      />
                    </FormField>

                    <FormField
                      label="Calculation Type"
                      helperText="Percentage applies the rate on the base amount; Fixed charges a flat amount."
                    >
                      <SelectInput
                        value={defFormData.calculationType}
                        onChange={(e) =>
                          handleDefFormChange(
                            "calculationType",
                            e.target.value as TaxDefinition["calculationType"]
                          )
                        }
                      >
                        <option value="Percentage">Percentage (% of Base)</option>
                        <option value="Fixed">Fixed Amount</option>
                      </SelectInput>
                    </FormField>

                    <FormField label="HSN / SAC Code" helperText="e.g. 996311 for room accommodation.">
                      <TextInput
                        value={defFormData.hsnSacCode}
                        onChange={(e) => handleDefFormChange("hsnSacCode", e.target.value)}
                        placeholder="e.g. 996311"
                        className="font-mono"
                      />
                    </FormField>

                    <FormField
                      label="Output Tax Ledger"
                      helperText="Liability ledger credited with the tax collected."
                    >
                      <SelectInput
                        value={defFormData.outputAccountId ?? ""}
                        onChange={(e) => handleDefFormChange("outputAccountId", e.target.value || null)}
                      >
                        <option value="">-- Not mapped --</option>
                        {liabilityLedgers.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.code} — {a.name}
                          </option>
                        ))}
                      </SelectInput>
                    </FormField>

                    <FormField label="Status">
                      <SelectInput
                        value={defFormData.status}
                        onChange={(e) => handleDefFormChange("status", e.target.value as Status)}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </SelectInput>
                    </FormField>

                    <FormField label="Description & Notes" className="sm:col-span-2">
                      <TextAreaInput
                        rows={2}
                        value={defFormData.description || ""}
                        onChange={(e) => handleDefFormChange("description", e.target.value)}
                        placeholder="Statutory scope and applicability notes..."
                      />
                    </FormField>
                  </div>
                </MasterFormSection>

                {/* Audit Info */}
                {activeTaxDef && (
                  <MasterAuditInfo
                    idLabel="Tax ID"
                    idValue={activeTaxDef.id}
                    status={activeTaxDef.status}
                    createdAt={activeTaxDef.createdAt}
                    updatedAt={activeTaxDef.updatedAt}
                    createdBy={activeTaxDef.createdBy ?? undefined}
                    updatedBy={activeTaxDef.updatedBy ?? undefined}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TAX RULES / SLABS */}
      {activeTab === "rules" && (
        <div className="space-y-4 mb-6 font-sans text-xs">
          {/* Rules Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-emerald-700" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Tax Applicability Rules & Amount Slabs
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Dynamic rules evaluated during billing to determine the applicable tax rate.
                </p>
              </div>

              {/* Search & Status Filter */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={ruleSearchQuery}
                    onChange={(e) => setRuleSearchQuery(e.target.value)}
                    placeholder="Search rules..."
                    className="h-8 w-44 rounded-xl border border-slate-300 bg-white pl-8 pr-7 text-xs font-medium text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <select
                  value={ruleStatusFilter}
                  onChange={(e) =>
                    setRuleStatusFilter(e.target.value as "All" | "Active" | "Inactive")
                  }
                  className="h-8 rounded-xl border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active Only</option>
                  <option value="Inactive">Inactive Only</option>
                </select>
              </div>
            </div>

            {/* Rules List Table */}
            {ruleLoadState ?? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Rule Code</th>
                      <th className="py-2.5 px-3">Rule Name</th>
                      <th className="py-2.5 px-3">Scope</th>
                      <th className="py-2.5 px-3">Amount Slab</th>
                      <th className="py-2.5 px-3">Applicable Tax</th>
                      <th className="py-2.5 px-3">Priority</th>
                      <th className="py-2.5 px-3">Effective</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium">
                    {filteredTaxRules.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                          {taxRules.length === 0
                            ? "No tax rules yet. Click “New Tax Rule” to create one."
                            : "No tax rules match your search or filter."}
                        </td>
                      </tr>
                    ) : (
                      filteredTaxRules.map((rule) => (
                        <tr
                          key={rule.id}
                          className={cn(
                            "hover:bg-slate-50/80 transition-colors",
                            selectedRuleId === rule.id && isEditingRule && !isCreatingRule
                              ? "bg-emerald-50/70"
                              : ""
                          )}
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            {rule.taxRuleCode}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {rule.taxRuleName}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                              {rule.revenueCategoryName ||
                                rule.divisionName ||
                                rule.serviceType ||
                                rule.applicabilityType}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-emerald-950 font-bold">
                            {formatINR(rule.minimumAmount ?? 0, { decimals: 0 })}
                            {" — "}
                            {rule.maximumAmount !== null
                              ? formatINR(rule.maximumAmount, { decimals: 0 })
                              : "No Limit"}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold font-mono text-[11px]">
                              {rule.taxCode ?? "—"} (
                              {formatRate(rule.taxRate ?? 0, calcTypeByTaxId.get(rule.taxId) ?? "Percentage")})
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-600">
                            #{rule.priority}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                            {formatDate(rule.effectiveFrom)}
                            {rule.effectiveTo ? ` → ${formatDate(rule.effectiveTo)}` : ""}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={cn(
                                "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border",
                                rule.status === "Active"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              )}
                            >
                              {rule.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right space-x-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRuleId(rule.id);
                                setRuleFormData(toRuleForm(rule));
                                setIsCreatingRule(false);
                                setIsEditingRule(true);
                              }}
                              disabled={saving}
                              className="h-6 px-2 text-[11px] rounded-lg font-bold border-slate-300 hover:bg-slate-100 cursor-pointer"
                            >
                              Configure
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => void handleDeleteRule(rule)}
                              disabled={saving}
                              className="h-6 px-1.5 text-[11px] rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Rule Configuration Form (When Editing / Creating) */}
          {isEditingRule && ruleFormData && (
            <div className="rounded-2xl border border-emerald-300 bg-white p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4.5 w-4.5 text-emerald-700" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    {isCreatingRule ? "Create Tax Rule" : `Edit Tax Rule: ${ruleFormData.taxRuleName}`}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleSaveTaxRule()}
                    disabled={saving}
                    className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5 mr-1" />
                    )}
                    Save Rule
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={closeRuleEditor}
                    disabled={saving}
                    className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
                  >
                    Close
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Rule ID">
                  <TextInput
                    value={isCreatingRule ? "Auto-generated on save" : selectedRuleId ?? ""}
                    readOnly
                    className="bg-slate-50 font-mono font-bold text-slate-700 cursor-not-allowed"
                  />
                </FormField>

                <FormField label="Rule Code" required helperText="e.g. ROOM-LOW, ROOM-HIGH, FNB-STD">
                  <TextInput
                    value={ruleFormData.taxRuleCode}
                    onChange={(e) =>
                      handleRuleFormChange("taxRuleCode", e.target.value.toUpperCase())
                    }
                    placeholder="e.g. ROOM-LOW"
                    className="font-mono font-bold text-slate-900"
                  />
                </FormField>

                <FormField label="Rule Name" required>
                  <TextInput
                    value={ruleFormData.taxRuleName}
                    onChange={(e) => handleRuleFormChange("taxRuleName", e.target.value)}
                    placeholder="e.g. Room Tariff Base Slab"
                    className="font-bold text-slate-900"
                  />
                </FormField>

                <FormField label="Applicability Scope" required>
                  <SelectInput
                    value={ruleFormData.applicabilityType}
                    onChange={(e) => handleRuleFormChange("applicabilityType", e.target.value)}
                  >
                    {applicabilityOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>

                <FormField label="Revenue Category" helperText="Leave blank to apply to all categories">
                  <SelectInput
                    value={ruleFormData.revenueCategoryId ?? ""}
                    onChange={(e) =>
                      handleRuleFormChange("revenueCategoryId", e.target.value || null)
                    }
                  >
                    <option value="">-- All Categories --</option>
                    {revenueCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.revenueCategoryName} ({cat.revenueCategoryCode})
                      </option>
                    ))}
                  </SelectInput>
                </FormField>

                <FormField label="Division / Department" helperText="Leave blank to apply to all divisions">
                  <SelectInput
                    value={ruleFormData.divisionId ?? ""}
                    onChange={(e) => handleRuleFormChange("divisionId", e.target.value || null)}
                  >
                    <option value="">-- All Divisions --</option>
                    {divisions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.divisionName} ({d.divisionCode})
                      </option>
                    ))}
                  </SelectInput>
                </FormField>

                <FormField label="Service Type" helperText="Optional service identifier (e.g. Room Stay, Laundry)">
                  <TextInput
                    value={ruleFormData.serviceType}
                    onChange={(e) => handleRuleFormChange("serviceType", e.target.value)}
                    placeholder="e.g. Room Stay"
                  />
                </FormField>

                <FormField label="Applicable Tax" required helperText="Selected from active Tax Definitions">
                  <SelectInput
                    value={ruleFormData.taxId}
                    onChange={(e) => handleRuleFormChange("taxId", e.target.value)}
                  >
                    {!ruleFormData.taxId && <option value="">-- Select tax --</option>}
                    {ruleTaxOptions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.taxName} ({t.taxCode} - {formatRate(t.rate, t.calculationType)})
                      </option>
                    ))}
                  </SelectInput>
                </FormField>

                <FormField label="Minimum Amount (₹)" helperText="Lower threshold for slab evaluation">
                  <TextInput
                    type="number"
                    min="0"
                    placeholder="No lower limit"
                    value={ruleFormData.minimumAmount ?? ""}
                    onChange={(e) =>
                      handleRuleFormChange(
                        "minimumAmount",
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    className="font-mono font-bold"
                  />
                </FormField>

                <FormField label="Maximum Amount (₹)" helperText="Leave empty for no upper ceiling (≥ Min)">
                  <TextInput
                    type="number"
                    min="0"
                    placeholder="No upper limit"
                    value={ruleFormData.maximumAmount ?? ""}
                    onChange={(e) =>
                      handleRuleFormChange(
                        "maximumAmount",
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    className="font-mono font-bold"
                  />
                </FormField>

                <FormField label="Evaluation Priority" helperText="Rules are evaluated in ascending order (1, 2, 3...)">
                  <TextInput
                    type="number"
                    value={ruleFormData.priority}
                    onChange={(e) =>
                      handleRuleFormChange("priority", parseInt(e.target.value, 10) || 1)
                    }
                    className="font-mono font-bold"
                  />
                </FormField>

                <FormField label="Effective From" required>
                  <TextInput
                    type="date"
                    value={ruleFormData.effectiveFrom}
                    onChange={(e) => handleRuleFormChange("effectiveFrom", e.target.value)}
                    className="font-mono"
                  />
                </FormField>

                <FormField label="Effective To (Optional)">
                  <TextInput
                    type="date"
                    value={ruleFormData.effectiveTo ?? ""}
                    onChange={(e) => handleRuleFormChange("effectiveTo", e.target.value || null)}
                    className="font-mono"
                  />
                </FormField>

                <FormField label="Status">
                  <SelectInput
                    value={ruleFormData.status}
                    onChange={(e) => handleRuleFormChange("status", e.target.value as Status)}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </SelectInput>
                </FormField>

                <FormField label="Rule Description" className="sm:col-span-3">
                  <TextAreaInput
                    rows={2}
                    value={ruleFormData.description || ""}
                    onChange={(e) => handleRuleFormChange("description", e.target.value)}
                    placeholder="Business rationale and slab description..."
                  />
                </FormField>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUDIT & SYSTEM */}
      {activeTab === "audit" && (
        <div className="space-y-4 mb-6 font-sans text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Active Tax Definitions
              </span>
              <p className="text-2xl font-mono font-black text-slate-900">
                {taxDefinitions.filter((t) => t.status === "Active").length} / {taxDefinitions.length}
              </p>
              <span className="text-[11px] text-slate-500 block mt-1">
                Configured statutory rates
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Active Tax Rules & Slabs
              </span>
              <p className="text-2xl font-mono font-black text-emerald-800">
                {taxRules.filter((r) => r.status === "Active").length} / {taxRules.length}
              </p>
              <span className="text-[11px] text-slate-500 block mt-1">
                Amount and category slab triggers
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Output Ledger Mapping
              </span>
              <p className="text-2xl font-mono font-black text-slate-900">
                {taxDefinitions.filter((t) => t.outputAccountId).length} / {taxDefinitions.length}
              </p>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Taxes mapped to a liability ledger in the Chart of Accounts
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
              Tax Engine Lifecycle Rules
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 list-disc list-inside">
              <li>
                <strong>Deterministic Evaluation:</strong> When a folio or POS charge is created, the system inspects active Tax Rules matching the item/tariff category and amount slab.
              </li>
              <li>
                <strong>Historical Preservation:</strong> Inactivating or changing tax rules does not rewrite past billing records or historical invoices.
              </li>
              <li>
                <strong>Settlement Decoupling:</strong> Taxes are computed strictly at the invoice/charge stage; receipt and payment voucher settlements do not re-calculate tax.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Safe Activation / Deactivation Confirmation Dialog */}
      {activeTaxDef && (
        <MasterActivationDialog
          isOpen={showDefActivationDialog}
          onClose={() => setShowDefActivationDialog(false)}
          onConfirm={handleToggleDefActivation}
          recordName={activeTaxDef.taxName}
          currentStatus={activeTaxDef.status}
          hasDependents={activeTaxDef.ruleCount > 0}
          dependentWarning={`Deactivating '${activeTaxDef.taxName}' (${activeTaxDef.taxCode}) will disable the ${activeTaxDef.ruleCount} tax rule(s) relying on this definition.`}
        />
      )}

      {/* Delete Protection Alert Dialog */}
      <MasterDeleteProtectionDialog
        isOpen={deleteDialogProps.isOpen}
        onClose={() => setDeleteDialogProps((prev) => ({ ...prev, isOpen: false }))}
        recordName={deleteDialogProps.recordName}
        reason="has_children"
        childCount={deleteDialogProps.childCount}
        transactionCount={0}
      />
    </ModulePageShell>
  );
}
