"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Percent,
  Plus,
  Save,
  RotateCcw,
  Search,
  X,
  Power,
  Trash2,
  FileText,
  Sliders,
  Info,
  Calendar,
  ShieldCheck,
  AlertTriangle,
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
  sampleTaxDefinitionsList,
  sampleTaxRulesList,
  TaxDefinitionModel,
  TaxRuleModel,
  TaxType,
  TaxCalculationType,
  TaxApplicabilityType,
} from "@/app/data/accounts/taxGstData";
import { sampleRevenueCategoriesList } from "@/app/data/accounts/revenueCategoryData";
import { sampleDivisionsList } from "@/app/data/accounts/divisionData";
import {
  CompanySelector,
  MasterFormSection,
  MasterAuditInfo,
  MasterActivationDialog,
  MasterDeleteProtectionDialog,
} from "@/components/accounts/MasterComponents";
import { cn } from "@/lib/utils";

export function TaxGstMasterView() {
  // Tab Navigation ('definitions' | 'rules' | 'audit')
  const [activeTab, setActiveTab] = useState<"definitions" | "rules" | "audit">("definitions");

  // Company Selector State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("comp-101");

  // Tax Definitions State (strictly 2 initial seed records)
  const [taxDefinitions, setTaxDefinitions] = useState<TaxDefinitionModel[]>(sampleTaxDefinitionsList);
  const [selectedTaxId, setSelectedTaxId] = useState<string>("TX-001");
  const [isCreatingDef, setIsCreatingDef] = useState(false);

  // Tax Rules State (strictly 2 initial seed records)
  const [taxRules, setTaxRules] = useState<TaxRuleModel[]>(sampleTaxRulesList);
  const [selectedRuleId, setSelectedRuleId] = useState<string>("TR-001");
  const [isEditingRule, setIsEditingRule] = useState(false);
  const [isCreatingRule, setIsCreatingRule] = useState(false);

  // Search & Filters for Tax Definitions
  const [defSearchQuery, setDefSearchQuery] = useState("");
  const [defStatusFilter, setDefStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [defTypeFilter, setDefTypeFilter] = useState<"All" | TaxType>("All");

  // Search & Filters for Tax Rules
  const [ruleSearchQuery, setRuleSearchQuery] = useState("");
  const [ruleStatusFilter, setRuleStatusFilter] = useState<"All" | "Active" | "Inactive">("All");

  // Toast Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Protection & Activation Dialog State
  const [showDefActivationDialog, setShowDefActivationDialog] = useState(false);
  const [deleteDialogProps, setDeleteDialogProps] = useState<{
    isOpen: boolean;
    reason: "system_account" | "has_transactions" | "has_children";
    childCount: number;
    transactionCount: number;
    recordName: string;
  }>({
    isOpen: false,
    reason: "has_transactions",
    childCount: 0,
    transactionCount: 0,
    recordName: "",
  });

  // Active Selected Tax Definition
  const activeTaxDef = useMemo(() => {
    return (
      taxDefinitions.find((t) => t.taxId === selectedTaxId) ||
      taxDefinitions[0] || {
        taxId: "TX-001",
        taxCode: "GST12",
        taxName: "GST 12%",
        taxType: "GST" as TaxType,
        rate: 12,
        calculationType: "Exclusive" as TaxCalculationType,
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
  }, [taxDefinitions, selectedTaxId]);

  // Tax Definition Form State
  const [defFormData, setDefFormData] = useState<TaxDefinitionModel>(activeTaxDef);

  useEffect(() => {
    if (!isCreatingDef) {
      setDefFormData({ ...activeTaxDef });
    }
  }, [activeTaxDef, isCreatingDef]);

  // Active Selected Tax Rule
  const activeTaxRule = useMemo(() => {
    return (
      taxRules.find((r) => r.taxRuleId === selectedRuleId) ||
      taxRules[0] || {
        taxRuleId: "TR-001",
        taxRuleCode: "ROOM-LOW",
        taxRuleName: "Room Tariff Base Slab",
        taxId: "TX-001",
        applicabilityType: "Revenue Category" as TaxApplicabilityType,
        revenueCategoryId: "RC-001",
        minimumAmount: 0,
        maximumAmount: 7500,
        priority: 1,
        effectiveFrom: "2024-04-01",
        status: "Active" as const,
        description: "",
        companyId: "comp-101",
        createdAt: "01 Apr 2024",
        updatedAt: "01 Apr 2024",
        createdBy: "Finance Admin",
        updatedBy: "Finance Admin",
      }
    );
  }, [taxRules, selectedRuleId]);

  // Tax Rule Form State
  const [ruleFormData, setRuleFormData] = useState<TaxRuleModel>(activeTaxRule);

  useEffect(() => {
    if (!isCreatingRule) {
      setRuleFormData({ ...activeTaxRule });
    }
  }, [activeTaxRule, isCreatingRule]);

  // Filtered Tax Definitions
  const filteredTaxDefinitions = useMemo(() => {
    return taxDefinitions.filter((t) => {
      if (defStatusFilter !== "All" && t.status !== defStatusFilter) return false;
      if (defTypeFilter !== "All" && t.taxType !== defTypeFilter) return false;
      if (defSearchQuery) {
        const q = defSearchQuery.toLowerCase();
        return (
          t.taxId.toLowerCase().includes(q) ||
          t.taxCode.toLowerCase().includes(q) ||
          t.taxName.toLowerCase().includes(q) ||
          t.taxType.toLowerCase().includes(q)
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
          r.taxRuleId.toLowerCase().includes(q) ||
          r.taxRuleCode.toLowerCase().includes(q) ||
          r.taxRuleName.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [taxRules, ruleSearchQuery, ruleStatusFilter]);

  // ==========================================
  // TAX DEFINITION ACTIONS
  // ==========================================
  const handleDefFormChange = (field: keyof TaxDefinitionModel, value: any) => {
    setDefFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNewTaxDefinition = () => {
    const nextSeq = taxDefinitions.length + 1;
    const nextNum = nextSeq < 10 ? `00${nextSeq}` : nextSeq < 100 ? `0${nextSeq}` : `${nextSeq}`;
    const newTaxId = `TX-${nextNum}`;
    const now = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const draftRecord: TaxDefinitionModel = {
      taxId: newTaxId,
      taxCode: "",
      taxName: "",
      taxType: "GST",
      rate: 0,
      calculationType: "Exclusive",
      status: "Active",
      companyId: selectedCompanyId,
      createdAt: now,
      updatedAt: now,
      createdBy: "Finance Admin",
      updatedBy: "Finance Admin",
      hasTransactions: false,
      transactionCount: 0,
    };

    setIsCreatingDef(true);
    setDefFormData(draftRecord);
    setActiveTab("definitions");
    setToastMessage("Fill in the fields and click Save to create a new Tax Definition.");
  };

  const handleSaveTaxDefinition = () => {
    if (!defFormData.taxCode.trim()) {
      setToastMessage("Tax Code is required.");
      return;
    }
    if (!defFormData.taxName.trim()) {
      setToastMessage("Tax Name is required.");
      return;
    }
    if (defFormData.rate < 0) {
      setToastMessage("Tax Rate must be non-negative.");
      return;
    }

    const currentCompany = defFormData.companyId || selectedCompanyId;
    const codeExists = taxDefinitions.some(
      (t) =>
        t.taxId !== defFormData.taxId &&
        (t.companyId || selectedCompanyId) === currentCompany &&
        t.taxCode.trim().toUpperCase() === defFormData.taxCode.trim().toUpperCase()
    );

    if (codeExists) {
      setToastMessage(`Tax Code '${defFormData.taxCode.toUpperCase()}' already exists.`);
      return;
    }

    const now = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const updatedRecord: TaxDefinitionModel = {
      ...defFormData,
      taxCode: defFormData.taxCode.trim().toUpperCase(),
      taxName: defFormData.taxName.trim(),
      companyId: currentCompany,
      updatedAt: now,
      updatedBy: "Finance Admin",
    };

    if (isCreatingDef) {
      setTaxDefinitions((prev) => [updatedRecord, ...prev]);
      setIsCreatingDef(false);
      setSelectedTaxId(updatedRecord.taxId);
      setToastMessage(`Created Tax Definition '${updatedRecord.taxName}' successfully.`);
    } else {
      setTaxDefinitions((prev) =>
        prev.map((t) => (t.taxId === updatedRecord.taxId ? updatedRecord : t))
      );
      setToastMessage(`Saved Tax Definition '${updatedRecord.taxName}' successfully.`);
    }

    setDefFormData(updatedRecord);
  };

  const handleToggleDefActivation = () => {
    const targetStatus = defFormData.status === "Active" ? "Inactive" : "Active";
    const now = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const updatedRecord: TaxDefinitionModel = {
      ...defFormData,
      status: targetStatus,
      updatedAt: now,
      updatedBy: "Finance Admin",
    };

    setTaxDefinitions((prev) =>
      prev.map((t) => (t.taxId === updatedRecord.taxId ? updatedRecord : t))
    );
    setDefFormData(updatedRecord);
    setToastMessage(
      `Tax Definition '${updatedRecord.taxName}' is now ${targetStatus.toUpperCase()}.`
    );
  };

  const handleDeleteDefAttempt = () => {
    // Check if rules reference this tax definition
    const rulesUsingTax = taxRules.filter((r) => r.taxId === defFormData.taxId);
    if (rulesUsingTax.length > 0) {
      setDeleteDialogProps({
        isOpen: true,
        reason: "has_children",
        childCount: rulesUsingTax.length,
        transactionCount: 0,
        recordName: defFormData.taxName,
      });
      return;
    }

    if (defFormData.hasTransactions || (defFormData.transactionCount || 0) > 0) {
      setDeleteDialogProps({
        isOpen: true,
        reason: "has_transactions",
        childCount: 0,
        transactionCount: defFormData.transactionCount || 0,
        recordName: defFormData.taxName,
      });
      return;
    }

    setTaxDefinitions((prev) => prev.filter((t) => t.taxId !== defFormData.taxId));
    setSelectedTaxId(taxDefinitions[0]?.taxId || "TX-001");
    setIsCreatingDef(false);
    setToastMessage(`Deleted Tax Definition '${defFormData.taxName}'.`);
  };

  // ==========================================
  // TAX RULE ACTIONS
  // ==========================================
  const handleRuleFormChange = (field: keyof TaxRuleModel, value: any) => {
    setRuleFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNewTaxRule = () => {
    const nextSeq = taxRules.length + 1;
    const nextNum = nextSeq < 10 ? `00${nextSeq}` : nextSeq < 100 ? `0${nextSeq}` : `${nextSeq}`;
    const newRuleId = `TR-${nextNum}`;
    const now = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const draftRecord: TaxRuleModel = {
      taxRuleId: newRuleId,
      taxRuleCode: "",
      taxRuleName: "",
      taxId: taxDefinitions[0]?.taxId || "TX-001",
      applicabilityType: "Revenue Category",
      revenueCategoryId: sampleRevenueCategoriesList[0]?.revenueCategoryId || "RC-001",
      minimumAmount: 0,
      priority: nextSeq,
      effectiveFrom: new Date().toISOString().split("T")[0],
      status: "Active",
      companyId: selectedCompanyId,
      createdAt: now,
      updatedAt: now,
      createdBy: "Finance Admin",
      updatedBy: "Finance Admin",
    };

    setIsCreatingRule(true);
    setIsEditingRule(true);
    setRuleFormData(draftRecord);
    setActiveTab("rules");
    setToastMessage("Configure the new rule parameters and click Save.");
  };

  const handleSaveTaxRule = () => {
    if (!ruleFormData.taxRuleCode.trim()) {
      setToastMessage("Rule Code is required.");
      return;
    }
    if (!ruleFormData.taxRuleName.trim()) {
      setToastMessage("Rule Name is required.");
      return;
    }
    if (!ruleFormData.taxId) {
      setToastMessage("Applicable Tax Definition is required.");
      return;
    }
    if (ruleFormData.minimumAmount !== undefined && ruleFormData.minimumAmount < 0) {
      setToastMessage("Minimum Amount cannot be negative.");
      return;
    }
    if (
      ruleFormData.minimumAmount !== undefined &&
      ruleFormData.maximumAmount !== undefined &&
      ruleFormData.maximumAmount <= ruleFormData.minimumAmount
    ) {
      setToastMessage("Maximum Amount must be strictly greater than Minimum Amount.");
      return;
    }

    const currentCompany = ruleFormData.companyId || selectedCompanyId;
    const codeExists = taxRules.some(
      (r) =>
        r.taxRuleId !== ruleFormData.taxRuleId &&
        (r.companyId || selectedCompanyId) === currentCompany &&
        r.taxRuleCode.trim().toUpperCase() === ruleFormData.taxRuleCode.trim().toUpperCase()
    );

    if (codeExists) {
      setToastMessage(`Rule Code '${ruleFormData.taxRuleCode.toUpperCase()}' already exists.`);
      return;
    }

    // Overlap Slab Check Warning
    const overlapping = taxRules.filter(
      (r) =>
        r.taxRuleId !== ruleFormData.taxRuleId &&
        r.status === "Active" &&
        r.revenueCategoryId === ruleFormData.revenueCategoryId &&
        r.applicabilityType === ruleFormData.applicabilityType
    );

    let overlapWarning = false;
    for (const other of overlapping) {
      const minA = ruleFormData.minimumAmount ?? 0;
      const maxA = ruleFormData.maximumAmount ?? Infinity;
      const minB = other.minimumAmount ?? 0;
      const maxB = other.maximumAmount ?? Infinity;

      if (minA <= maxB && maxA >= minB) {
        overlapWarning = true;
        break;
      }
    }

    const now = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const updatedRecord: TaxRuleModel = {
      ...ruleFormData,
      taxRuleCode: ruleFormData.taxRuleCode.trim().toUpperCase(),
      taxRuleName: ruleFormData.taxRuleName.trim(),
      companyId: currentCompany,
      updatedAt: now,
      updatedBy: "Finance Admin",
    };

    if (isCreatingRule) {
      setTaxRules((prev) => [updatedRecord, ...prev]);
      setIsCreatingRule(false);
      setSelectedRuleId(updatedRecord.taxRuleId);
    } else {
      setTaxRules((prev) =>
        prev.map((r) => (r.taxRuleId === updatedRecord.taxRuleId ? updatedRecord : r))
      );
    }

    setRuleFormData(updatedRecord);
    setIsEditingRule(false);

    if (overlapWarning) {
      setToastMessage(
        `Saved Rule '${updatedRecord.taxRuleName}'. Notice: Slabs overlap with an existing active rule for this category.`
      );
    } else {
      setToastMessage(`Saved Tax Rule '${updatedRecord.taxRuleName}' successfully.`);
    }
  };

  const handleDeleteRule = (ruleId: string, ruleName: string) => {
    setTaxRules((prev) => prev.filter((r) => r.taxRuleId !== ruleId));
    if (selectedRuleId === ruleId) {
      setSelectedRuleId(taxRules[0]?.taxRuleId || "TR-001");
      setIsEditingRule(false);
      setIsCreatingRule(false);
    }
    setToastMessage(`Deleted Tax Rule '${ruleName}'.`);
  };

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
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === "definitions" ? (
            <>
              <Button
                type="button"
                size="sm"
                onClick={handleNewTaxDefinition}
                className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                New Tax
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleSaveTaxDefinition}
                className="rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer"
              >
                <Save className="h-3.5 w-3.5 mr-1" />
                Save Changes
              </Button>

              {!isCreatingDef && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDefActivationDialog(true)}
                    className={cn(
                      "rounded-xl text-xs font-bold border cursor-pointer",
                      defFormData.status === "Active"
                        ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                        : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                    )}
                  >
                    <Power className="h-3.5 w-3.5 mr-1" />
                    {defFormData.status === "Active" ? "Deactivate" : "Activate"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteDefAttempt}
                    className="rounded-xl text-xs font-semibold bg-white border-rose-200 text-rose-700 hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1 text-rose-600" />
                    Delete
                  </Button>
                </>
              )}

              {isCreatingDef && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreatingDef(false);
                    setDefFormData({ ...activeTaxDef });
                  }}
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
                    onClick={handleSaveTaxRule}
                    className="rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5 mr-1" />
                    Save Rule
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditingRule(false);
                      setIsCreatingRule(false);
                    }}
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
            setIsEditingRule(false);
            setIsCreatingRule(false);
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
            setIsEditingRule(false);
            setIsCreatingRule(false);
            setIsCreatingDef(false);
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
                placeholder="Search code, name..."
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
                  onChange={(e) => setDefTypeFilter(e.target.value as "All" | TaxType)}
                  className="h-7 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-[11px] font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="All">All Types</option>
                  <option value="GST">GST</option>
                  <option value="CGST">CGST</option>
                  <option value="SGST">SGST</option>
                  <option value="IGST">IGST</option>
                  <option value="CESS">CESS</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[420px]">
              {filteredTaxDefinitions.map((item) => {
                const isSelected = selectedTaxId === item.taxId && !isCreatingDef;
                return (
                  <div
                    key={item.taxId}
                    onClick={() => {
                      setSelectedTaxId(item.taxId);
                      setIsCreatingDef(false);
                    }}
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
                          Rate: <strong className="text-emerald-800 font-bold">{item.rate}%</strong> ({item.calculationType})
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
                        {item.taxId}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Tax Definition Form */}
          <div className="md:col-span-8 space-y-4">
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
                    {defFormData.rate}% Rate
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
              subtitle="Tax identification, rate percentage, and calculation method."
              icon={<FileText className="h-4 w-4" />}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Tax ID">
                  <TextInput
                    value={defFormData.taxId}
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
                    onChange={(e) => handleDefFormChange("taxType", e.target.value as TaxType)}
                  >
                    <option value="GST">GST</option>
                    <option value="CGST">CGST</option>
                    <option value="SGST">SGST</option>
                    <option value="IGST">IGST</option>
                    <option value="CESS">CESS</option>
                    <option value="Other">Other</option>
                  </SelectInput>
                </FormField>

                <FormField
                  label="Tax Rate (%)"
                  required
                  helperText="Statutory percentage rate applied on taxable amounts."
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
                  helperText="Exclusive adds tax on top of base; Inclusive extracts from gross."
                >
                  <SelectInput
                    value={defFormData.calculationType}
                    onChange={(e) =>
                      handleDefFormChange(
                        "calculationType",
                        e.target.value as TaxCalculationType
                      )
                    }
                  >
                    <option value="Exclusive">Exclusive (Base + Tax)</option>
                    <option value="Inclusive">Inclusive (Gross Contains Tax)</option>
                  </SelectInput>
                </FormField>

                <FormField label="Status">
                  <SelectInput
                    value={defFormData.status}
                    onChange={(e) => handleDefFormChange("status", e.target.value)}
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
            {!isCreatingDef && (
              <MasterAuditInfo
                idLabel="Tax ID"
                idValue={defFormData.taxId}
                status={defFormData.status}
                createdAt={defFormData.createdAt}
                updatedAt={defFormData.updatedAt}
                createdBy={defFormData.createdBy || "Finance Admin"}
                updatedBy={defFormData.updatedBy || "Finance Admin"}
                transactionCount={defFormData.transactionCount || 0}
              />
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
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Rule Code</th>
                    <th className="py-2.5 px-3">Rule Name</th>
                    <th className="py-2.5 px-3">Category ID</th>
                    <th className="py-2.5 px-3">Amount Slab</th>
                    <th className="py-2.5 px-3">Applicable Tax</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Effective</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {filteredTaxRules.map((rule) => {
                    const matchedTax = taxDefinitions.find((t) => t.taxId === rule.taxId);
                    const matchedCat = sampleRevenueCategoriesList.find(
                      (c) => c.revenueCategoryId === rule.revenueCategoryId
                    );

                    return (
                      <tr
                        key={rule.taxRuleId}
                        className={cn(
                          "hover:bg-slate-50/80 transition-colors",
                          selectedRuleId === rule.taxRuleId && isEditingRule && !isCreatingRule
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
                            {matchedCat?.revenueCategoryName || rule.revenueCategoryId || rule.applicabilityType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-emerald-950 font-bold">
                          {rule.minimumAmount !== undefined ? `₹${rule.minimumAmount.toLocaleString("en-IN")}` : "₹0"}
                          {" — "}
                          {rule.maximumAmount !== undefined
                            ? `₹${rule.maximumAmount.toLocaleString("en-IN")}`
                            : "No Limit"}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold font-mono text-[11px]">
                            {matchedTax?.taxCode || rule.taxId} ({matchedTax?.rate || 0}%)
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-600">
                          #{rule.priority}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                          {rule.effectiveFrom}
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
                              setSelectedRuleId(rule.taxRuleId);
                              setRuleFormData({ ...rule });
                              setIsCreatingRule(false);
                              setIsEditingRule(true);
                            }}
                            className="h-6 px-2 text-[11px] rounded-lg font-bold border-slate-300 hover:bg-slate-100 cursor-pointer"
                          >
                            Configure
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRule(rule.taxRuleId, rule.taxRuleName)}
                            className="h-6 px-1.5 text-[11px] rounded-lg text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rule Configuration Form (When Editing / Creating) */}
          {isEditingRule && (
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
                    onClick={handleSaveTaxRule}
                    className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5 mr-1" />
                    Save Rule
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditingRule(false);
                      setIsCreatingRule(false);
                    }}
                    className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
                  >
                    Close
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Rule ID">
                  <TextInput
                    value={ruleFormData.taxRuleId}
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
                    onChange={(e) =>
                      handleRuleFormChange(
                        "applicabilityType",
                        e.target.value as TaxApplicabilityType
                      )
                    }
                  >
                    <option value="Revenue Category">Revenue Category</option>
                    <option value="Department">Department / Division</option>
                    <option value="Amount Slab">Amount Slab Only</option>
                    <option value="Service">Service</option>
                    <option value="Item Category">Item Category</option>
                  </SelectInput>
                </FormField>

                <FormField label="Revenue Category ID" helperText="Stored relationship ID (e.g. RC-001)">
                  <SelectInput
                    value={ruleFormData.revenueCategoryId || ""}
                    onChange={(e) =>
                      handleRuleFormChange("revenueCategoryId", e.target.value)
                    }
                  >
                    <option value="">-- All Categories --</option>
                    {sampleRevenueCategoriesList.map((cat) => (
                      <option key={cat.revenueCategoryId} value={cat.revenueCategoryId}>
                        {cat.revenueCategoryName} ({cat.revenueCategoryId})
                      </option>
                    ))}
                  </SelectInput>
                </FormField>

                <FormField label="Applicable Tax ID" required helperText="Selected from active Tax Definitions">
                  <SelectInput
                    value={ruleFormData.taxId}
                    onChange={(e) => handleRuleFormChange("taxId", e.target.value)}
                  >
                    {taxDefinitions
                      .filter((t) => t.status === "Active")
                      .map((t) => (
                        <option key={t.taxId} value={t.taxId}>
                          {t.taxName} ({t.taxId} - {t.rate}%)
                        </option>
                      ))}
                  </SelectInput>
                </FormField>

                <FormField label="Minimum Amount (₹)" helperText="Lower threshold for slab evaluation">
                  <TextInput
                    type="number"
                    min="0"
                    value={ruleFormData.minimumAmount !== undefined ? ruleFormData.minimumAmount : 0}
                    onChange={(e) =>
                      handleRuleFormChange(
                        "minimumAmount",
                        e.target.value ? parseFloat(e.target.value) : 0
                      )
                    }
                    className="font-mono font-bold"
                  />
                </FormField>

                <FormField label="Maximum Amount (₹)" helperText="Leave empty for no upper ceiling (> Min)">
                  <TextInput
                    type="number"
                    min="0"
                    placeholder="No upper limit"
                    value={ruleFormData.maximumAmount !== undefined ? ruleFormData.maximumAmount : ""}
                    onChange={(e) =>
                      handleRuleFormChange(
                        "maximumAmount",
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                    className="font-mono font-bold"
                  />
                </FormField>

                <FormField label="Evaluation Priority" helperText="Higher priority evaluated first (1, 2, 3...)">
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
                    value={ruleFormData.effectiveTo || ""}
                    onChange={(e) => handleRuleFormChange("effectiveTo", e.target.value || undefined)}
                    className="font-mono"
                  />
                </FormField>

                <FormField label="Status">
                  <SelectInput
                    value={ruleFormData.status}
                    onChange={(e) => handleRuleFormChange("status", e.target.value)}
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
                Posting Architecture
              </span>
              <p className="text-xs font-bold text-slate-900 mt-1">
                Decoupled from GL Ledgers
              </p>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Posting layer maps tax amounts to Chart of Accounts
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
      <MasterActivationDialog
        isOpen={showDefActivationDialog}
        onClose={() => setShowDefActivationDialog(false)}
        onConfirm={handleToggleDefActivation}
        recordName={defFormData.taxName}
        currentStatus={defFormData.status}
        hasDependents={(defFormData.transactionCount || 0) > 0}
        dependentWarning={`Deactivating '${defFormData.taxName}' (${defFormData.taxCode}) will disable any tax rules relying on this definition.`}
      />

      {/* Delete Protection Alert Dialog */}
      <MasterDeleteProtectionDialog
        isOpen={deleteDialogProps.isOpen}
        onClose={() =>
          setDeleteDialogProps((prev) => ({ ...prev, isOpen: false }))
        }
        recordName={deleteDialogProps.recordName}
        reason={deleteDialogProps.reason}
        childCount={deleteDialogProps.childCount}
        transactionCount={deleteDialogProps.transactionCount}
      />
    </ModulePageShell>
  );
}
