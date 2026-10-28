"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Building2,
  Plus,
  Save,
  RotateCcw,
  Layers,
  Lock,
  Trash2,
  Power,
  Sparkles,
  Sliders,
  FileText,
  FolderTree,
  AlertTriangle,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  SelectInput,
  TextAreaInput,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import { SearchSelect, type SearchOption } from "@/components/ui/SearchSelect";
import {
  accAccountService,
  type Account,
  type AccountNature,
  type AccountTreeNode,
} from "@/services/accounts";
import {
  MasterFormSection,
  MasterAuditInfo,
  MasterActivationDialog,
  MasterDeleteProtectionDialog,
} from "@/components/accounts/MasterComponents";
import { AccountTreeView } from "@/components/accounts/AccountTreeView";
import {
  accErrorMessage,
  formatDate,
  formatINR,
  invalidateAccLookups,
  useAccQuery,
} from "@/components/accounts/accountsApi";
import { cn } from "@/lib/utils";

type AccountType = Account["accountType"];

const ledgerHref = (accountId: string) =>
  `/accounts/reports/general-ledger?accountId=${encodeURIComponent(accountId)}`;

type AccountForm = {
  parentId: string | null;
  code: string;
  name: string;
  accountType: AccountType;
  nature: AccountNature;
  reportSection: string;
  category: string;
  classification: string;
  description: string;
  allowPosting: boolean;
  isBankAccount: boolean;
  isCashAccount: boolean;
  bankAccountNo: string;
  bankIfsc: string;
  status: Account["status"];
};

const REPORT_SECTIONS = [
  "Current Assets",
  "Fixed Assets",
  "Capital & Reserves",
  "Current Liabilities",
  "Non-Current Liabilities",
  "Direct Income",
  "Indirect Income",
  "Direct Expenses",
  "Indirect Expenses",
];

const CLASSIFICATIONS = ["Balance Sheet", "Profit & Loss"];

const defaultClassification = (nature: AccountNature) =>
  nature === "Asset" || nature === "Liability" ? "Balance Sheet" : "Profit & Loss";

const toForm = (n: AccountTreeNode): AccountForm => ({
  parentId: n.parentId,
  code: n.code,
  name: n.name,
  accountType: n.accountType,
  nature: n.nature,
  reportSection: n.reportSection ?? "",
  category: n.category ?? "",
  classification: n.classification ?? "",
  description: n.description ?? "",
  allowPosting: n.allowPosting,
  isBankAccount: n.isBankAccount,
  isCashAccount: n.isCashAccount,
  bankAccountNo: n.bankAccountNo ?? "",
  bankIfsc: n.bankIfsc ?? "",
  status: n.status,
});

function collectDescendants(node: AccountTreeNode): AccountTreeNode[] {
  return node.children.flatMap((c) => [c, ...collectDescendants(c)]);
}

function findNode(nodes: AccountTreeNode[], id: string): AccountTreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const hit = findNode(n.children, id);
    if (hit) return hit;
  }
  return null;
}

/** Next free numeric code under a parent (siblings' max + 1, or parent code + 1). */
function suggestCode(accounts: Account[], parentId: string | null, excludeId?: string): string {
  const pool = accounts.filter((a) => a.id !== excludeId);
  const used = new Set(pool.map((a) => a.code));
  const siblings = pool
    .filter((a) => (a.parentId ?? null) === parentId && /^\d+$/.test(a.code))
    .map((a) => Number(a.code));
  const parent = parentId ? pool.find((a) => a.id === parentId) : undefined;
  let next: number;
  if (!parentId) {
    next = siblings.length ? (Math.floor(Math.max(...siblings) / 1000) + 1) * 1000 : 1000;
  } else if (siblings.length) {
    next = Math.max(...siblings) + 1;
  } else if (parent && /^\d+$/.test(parent.code)) {
    next = Number(parent.code) + 1;
  } else {
    next = 1;
  }
  while (used.has(String(next))) next++;
  return String(next);
}

export function ChartOfAccountsView() {
  const router = useRouter();
  const treeQ = useAccQuery(() => accAccountService.tree(), []);
  const listQ = useAccQuery(() => accAccountService.list(), []);
  const treeData = useMemo(() => treeQ.data ?? [], [treeQ.data]);
  const flatAccounts = useMemo(() => listQ.data ?? [], [listQ.data]);

  const [selectedNodeId, setSelectedNodeId] = useState<string>("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const activeNode = useMemo(
    () => findNode(treeData, selectedNodeId) ?? treeData[0] ?? null,
    [treeData, selectedNodeId]
  );

  const [formData, setFormData] = useState<AccountForm | null>(null);
  const [syncedNode, setSyncedNode] = useState<AccountTreeNode | null>(null);
  if (activeNode !== syncedNode) {
    setSyncedNode(activeNode);
    setFormData(activeNode ? toForm(activeNode) : null);
  }

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const notify = (message: string, variant: "success" | "error" = "success") => {
    setToastVariant(variant);
    setToastMessage(message);
  };
  const [saving, setSaving] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActivationDialog, setShowActivationDialog] = useState(false);
  const [deleteDialogProps, setDeleteDialogProps] = useState<{
    isOpen: boolean;
    reason: "system_account" | "has_transactions" | "has_children";
    childCount: number;
    transactionCount: number;
  }>({
    isOpen: false,
    reason: "system_account",
    childCount: 0,
    transactionCount: 0,
  });

  // Create Modal Form State
  const [createType, setCreateType] = useState<AccountType>("Ledger");
  const [createParentId, setCreateParentId] = useState<string>("");
  const [createNature, setCreateNature] = useState<AccountNature>("Asset");
  const [createCategory, setCreateCategory] = useState<string>("");
  const [createName, setCreateName] = useState("");
  const [createCode, setCreateCode] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createClassification, setCreateClassification] = useState<string>("Balance Sheet");
  const [createIsBank, setCreateIsBank] = useState(false);
  const [createIsCash, setCreateIsCash] = useState(false);

  const allGroups = useMemo(
    () => flatAccounts.filter((a) => a.accountType === "Group"),
    [flatAccounts]
  );
  const parentGroupOptions = useMemo<SearchOption[]>(
    () =>
      allGroups.map((g) => ({
        id: g.id,
        label: `${g.code} - ${g.name} (${g.nature})`,
        sublabel: g.name,
        hint: g.code,
        data: { nature: g.nature },
      })),
    [allGroups]
  );

  const categoriesByNature = useMemo(() => {
    const map: Record<AccountNature, string[]> = { Asset: [], Liability: [], Income: [], Expense: [] };
    for (const a of flatAccounts) {
      if (a.category && !map[a.nature].includes(a.category)) map[a.nature].push(a.category);
    }
    for (const k of Object.keys(map) as AccountNature[]) map[k].sort();
    return map;
  }, [flatAccounts]);

  const reloadAll = async () => {
    await Promise.all([treeQ.reload(), listQ.reload()]);
  };

  const handleSelectNode = (node: AccountTreeNode) => {
    setSelectedNodeId(node.id);
  };

  const handleToggleExpand = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExpandAll = () => {
    const allIds = new Set<string>();
    const traverse = (nodes: AccountTreeNode[]) => {
      nodes.forEach((n) => {
        allIds.add(n.id);
        traverse(n.children);
      });
    };
    traverse(treeData);
    setExpandedNodes(allIds);
    notify("Expanded all chart of accounts groups.");
  };

  const handleCollapseAll = () => {
    setExpandedNodes(new Set());
    notify("Collapsed all groups.");
  };

  const handleFormChange = <K extends keyof AccountForm>(field: K, value: AccountForm[K]) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const updated: AccountForm = { ...prev, [field]: value };
      if (field === "nature") {
        updated.classification = defaultClassification(value as AccountNature);
      }
      if (field === "accountType") {
        updated.allowPosting = value !== "Group";
        if (value === "Group") {
          updated.isBankAccount = false;
          updated.isCashAccount = false;
        }
      }
      return updated;
    });
  };

  const handleRegenerateCode = () => {
    if (!formData || !activeNode) return;
    const newCode = suggestCode(flatAccounts, formData.parentId, activeNode.id);
    setFormData((prev) => (prev ? { ...prev, code: newCode } : prev));
    notify(`Suggested Account Code '${newCode}'.`);
  };

  const handleSaveAccount = async () => {
    if (!formData || !activeNode) return;
    if (!formData.name.trim()) {
      notify("Account Name cannot be empty.", "error");
      return;
    }
    if (!formData.code.trim()) {
      notify("Account Code cannot be empty.", "error");
      return;
    }
    setSaving(true);
    try {
      await accAccountService.update(activeNode.id, {
        ...formData,
        code: formData.code.trim(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
      });
      invalidateAccLookups();
      await reloadAll();
      notify(`Successfully saved account '${formData.name.trim()}'.`);
    } catch (e) {
      notify(accErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleResetForm = () => {
    if (!activeNode) return;
    setFormData(toForm(activeNode));
    notify(`Reverted changes for '${activeNode.name}'.`);
  };

  const handleToggleActivation = async () => {
    if (!activeNode) return;
    const newStatus = activeNode.status === "Active" ? "Inactive" : "Active";
    try {
      await accAccountService.update(activeNode.id, { status: newStatus });
      invalidateAccLookups();
      await reloadAll();
      notify(`Account '${activeNode.name}' is now ${newStatus.toUpperCase()}.`);
    } catch (e) {
      notify(accErrorMessage(e), "error");
    }
  };

  const handleDeleteAttempt = async (node: AccountTreeNode | null = activeNode) => {
    if (!node) return;
    const descendants = collectDescendants(node);
    const transactionCount = [node, ...descendants].reduce((sum, n) => sum + (n.transactionCount || 0), 0);

    if (transactionCount > 0) {
      setSelectedNodeId(node.id);
      setDeleteDialogProps({ isOpen: true, reason: "has_transactions", childCount: 0, transactionCount });
      return;
    }

    const kind = node.accountType === "Group" ? "group" : "ledger";
    const lines = [`Delete ${kind} '${node.name}' (${node.code})?`];
    if (descendants.length) {
      lines.push(`Its ${descendants.length} sub-account${descendants.length === 1 ? "" : "s"} will also be deleted.`);
    }
    if (node.isSystemAccount) lines.push("This is a system account used by default postings.");
    lines.push("This cannot be undone.");
    if (!window.confirm(lines.join("\n\n"))) return;

    try {
      await accAccountService.remove(node.id);
      invalidateAccLookups();
      if (activeNode && (activeNode.id === node.id || descendants.some((d) => d.id === activeNode.id))) {
        setSelectedNodeId(node.parentId ?? "");
      }
      await reloadAll();
      notify(
        `Deleted ${kind} '${node.name}'${descendants.length ? ` and ${descendants.length} sub-account(s)` : ""}.`
      );
    } catch (e) {
      notify(accErrorMessage(e), "error");
    }
  };

  const handleEditNode = (node: AccountTreeNode) => {
    setSelectedNodeId(node.id);
    window.setTimeout(() => {
      const input = document.getElementById("coa-account-name") as HTMLInputElement | null;
      input?.scrollIntoView({ behavior: "smooth", block: "center" });
      input?.focus();
      input?.select();
    }, 50);
  };

  const applyCreateParent = (parentId: string, type: AccountType) => {
    setCreateParentId(parentId);
    const parent = allGroups.find((g) => g.id === parentId);
    if (parent) {
      setCreateNature(parent.nature);
      setCreateClassification(parent.classification || defaultClassification(parent.nature));
      setCreateCategory(type === "Group" ? "" : parent.category);
    }
    setCreateCode(suggestCode(flatAccounts, parentId || null));
  };

  const handleOpenCreateModal = () => {
    setCreateType("Ledger");
    setCreateParentId("");
    setCreateCode("");
    setCreateName("");
    setCreateNature("Asset");
    setCreateClassification("Balance Sheet");
    setCreateCategory("");
    setCreateDescription("");
    setCreateIsBank(false);
    setCreateIsCash(false);
    setShowCreateModal(true);
  };

  const handleSaveNewAccount = async () => {
    if (createType === "Ledger" && !createParentId) {
      notify("Select a Parent Group for the ledger.", "error");
      return;
    }
    if (!createName.trim()) {
      notify("Please enter a valid Account Name.", "error");
      return;
    }
    if (!createCode.trim()) {
      notify("Please enter an Account Code.", "error");
      return;
    }
    const parent = allGroups.find((g) => g.id === createParentId);
    setSaving(true);
    try {
      const created = await accAccountService.create({
        parentId: createParentId || null,
        code: createCode.trim(),
        name: createName.trim(),
        accountType: createType,
        nature: createNature,
        category: createCategory.trim(),
        classification: createClassification,
        description: createDescription.trim(),
        allowPosting: createType === "Ledger",
        isBankAccount: createType === "Ledger" && createIsBank,
        isCashAccount: createType === "Ledger" && createIsCash,
        status: "Active",
      });
      invalidateAccLookups();
      await reloadAll();
      if (createParentId) setExpandedNodes((prev) => new Set([...prev, createParentId]));
      setSelectedNodeId(created.id);
      setShowCreateModal(false);
      notify(
        `Created new ${createType} '${created.name}' (${created.code})${parent ? ` under '${parent.name}'` : ""}.`
      );
    } catch (e) {
      notify(accErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const parentLevel = formData?.parentId
    ? flatAccounts.find((a) => a.id === formData.parentId)?.level
    : undefined;
  const displayLevel = formData?.parentId ? (parentLevel ?? 0) + 1 : 1;
  const natureLocked = Boolean(formData?.parentId);
  const blockedParentIds = new Set(
    activeNode ? [activeNode.id, ...collectDescendants(activeNode).map((d) => d.id)] : []
  );

  const initialLoading = (treeQ.loading && !treeQ.data) || (listQ.loading && !listQ.data);
  const loadError = (!treeQ.data && treeQ.error) || (!listQ.data && listQ.error) || null;

  return (
    <ModulePageShell
      eyebrow="Accounts & Masters"
      title="Chart of Accounts"
      description="Manage hierarchical account groups, general ledgers, and posting classifications."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Masters", href: "/accounts/masters" },
        { label: "Chart of Accounts" },
      ]}
      toast={toastMessage}
      toastVariant={toastVariant}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleOpenCreateModal}
            disabled={initialLoading || !!loadError}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Create Account
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => void handleSaveAccount()}
            disabled={!formData || saving}
            className="rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1" />
            )}
            Save Changes
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowActivationDialog(true)}
            disabled={!activeNode}
            className={cn(
              "rounded-xl text-xs font-bold border cursor-pointer",
              activeNode?.status === "Active"
                ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
            )}
          >
            <Power className="h-3.5 w-3.5 mr-1" />
            {activeNode?.status === "Active" ? "Deactivate" : "Activate"}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleDeleteAttempt()}
            disabled={!activeNode}
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
            disabled={!activeNode}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Reset
          </Button>
        </div>
      }
    >
      {initialLoading ? (
        <div className="flex min-h-[320px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
          Loading chart of accounts…
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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 font-sans">
        <div className="md:col-span-5">
          <AccountTreeView
            treeData={treeData}
            selectedNodeId={activeNode?.id ?? ""}
            onSelectNode={handleSelectNode}
            expandedNodes={expandedNodes}
            onToggleExpand={handleToggleExpand}
            onExpandAll={handleExpandAll}
            onCollapseAll={handleCollapseAll}
            onCreateAccountClick={handleOpenCreateModal}
            onOpenLedger={(node) => router.push(ledgerHref(node.id))}
            onEditNode={handleEditNode}
            onDeleteNode={(node) => void handleDeleteAttempt(node)}
          />
        </div>

        <div className="md:col-span-7 space-y-4">
          {!activeNode || !formData ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
              <FolderTree className="h-6 w-6 text-slate-400" />
              <p className="text-xs font-semibold text-slate-600">
                No account selected. Create an account group to start building your chart of accounts.
              </p>
            </div>
          ) : (
          <>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-700" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    {formData.accountType === "Group"
                      ? "Group Account Maintenance"
                      : "Ledger Account Maintenance"}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Selected: <strong className="text-slate-900">{activeNode.name}</strong>{" "}
                  ({activeNode.code}) · Balance{" "}
                  <strong className="text-slate-900 font-mono">
                    {formatINR(activeNode.balance)} {activeNode.balanceSide}
                  </strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={ledgerHref(activeNode.id)}
                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 px-2.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-emerald-800"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  {formData.accountType === "Group" ? "Open Group Ledger" : "Open Ledger"}
                </Link>

                <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-mono font-bold text-slate-700 border border-slate-200">
                  <Layers className="h-3.5 w-3.5 text-slate-500" />
                  Level {displayLevel}
                </span>

                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold border",
                    formData.accountType === "Group"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-indigo-50 text-indigo-800 border-indigo-200"
                  )}
                >
                  {formData.accountType}
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

          <MasterFormSection
            title="General Information"
            subtitle="Core identification, classification, and hierarchy details."
            icon={<FileText className="h-4 w-4" />}
            badge={
              activeNode.isSystemAccount ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  <Lock className="h-3 w-3" />
                  System Account
                </span>
              ) : undefined
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Account ID">
                <TextInput
                  value={activeNode.id}
                  readOnly
                  className="bg-slate-50 font-mono font-bold text-slate-700 cursor-not-allowed"
                />
              </FormField>

              <FormField label="Account Code" required>
                <div className="flex items-center gap-1.5">
                  <TextInput
                    value={formData.code}
                    onChange={(e) => handleFormChange("code", e.target.value)}
                    placeholder="e.g. 1111"
                    className="font-mono font-bold text-slate-900"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateCode}
                    title="Suggest next available code under the parent"
                    className="h-9 px-2 text-xs font-bold bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100 shrink-0"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  </Button>
                </div>
              </FormField>

              <FormField label="Account Name" required className="sm:col-span-2">
                <TextInput
                  id="coa-account-name"
                  value={formData.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  placeholder="Enter formal account title..."
                  className="font-bold text-slate-900"
                />
              </FormField>

              <FormField
                label="Parent Account / Group"
                helperText="Moves this account (and its sub-accounts) under the selected group."
              >
                <SelectInput
                  value={formData.parentId || ""}
                  onChange={(e) => {
                    const selectedParent = allGroups.find((g) => g.id === e.target.value);
                    setFormData((prev) =>
                      prev
                        ? {
                            ...prev,
                            parentId: selectedParent ? selectedParent.id : null,
                            nature: selectedParent ? selectedParent.nature : prev.nature,
                          }
                        : prev
                    );
                  }}
                >
                  <option value="">Root Level (No Parent)</option>
                  {allGroups
                    .filter((grp) => !blockedParentIds.has(grp.id))
                    .map((grp) => (
                      <option key={grp.id} value={grp.id}>
                        {grp.code} - {grp.name} ({grp.nature})
                      </option>
                    ))}
                </SelectInput>
              </FormField>

              <FormField
                label="Account Nature"
                required
                helperText={
                  formData.parentId
                    ? "Inherited automatically from the parent group."
                    : formData.accountType === "Group"
                      ? "Changing a root group's nature also updates all its sub-accounts."
                      : undefined
                }
              >
                <SelectInput
                  value={formData.nature}
                  disabled={natureLocked}
                  onChange={(e) => handleFormChange("nature", e.target.value as AccountNature)}
                  className={cn(natureLocked && "bg-slate-50 cursor-not-allowed text-slate-600 font-bold")}
                >
                  <option value="Asset">Asset</option>
                  <option value="Liability">Liability</option>
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                </SelectInput>
              </FormField>

              <FormField label="Account Category">
                <TextInput
                  value={formData.category}
                  list="coa-edit-categories"
                  onChange={(e) => handleFormChange("category", e.target.value)}
                  placeholder="e.g. Cash & Bank, Receivables..."
                />
                <datalist id="coa-edit-categories">
                  {categoriesByNature[formData.nature].map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </FormField>

              <FormField
                label="Account Type"
                required
                helperText={
                  formData.accountType === "Group"
                    ? "Group accounts strictly categorize ledgers; transactions cannot post to groups."
                    : "Ledger accounts allow active voucher posting."
                }
              >
                <SelectInput
                  value={formData.accountType}
                  onChange={(e) => handleFormChange("accountType", e.target.value as AccountType)}
                >
                  <option value="Group">Group (Header / Category)</option>
                  <option value="Ledger">Ledger (Transactional Account)</option>
                </SelectInput>
              </FormField>

              <FormField label="Status">
                <SelectInput
                  value={formData.status}
                  onChange={(e) => handleFormChange("status", e.target.value as AccountForm["status"])}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </SelectInput>
              </FormField>

              <FormField label="Description & Purpose" className="sm:col-span-2">
                <TextAreaInput
                  rows={2}
                  value={formData.description}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  placeholder="Add notes on accounting purpose, statutory mandates, or usage rules..."
                />
              </FormField>
            </div>
          </MasterFormSection>

          <MasterFormSection
            title="Accounting Configuration"
            subtitle="Posting governance, financial statement placement, and bank / cash flags."
            icon={<Sliders className="h-4 w-4" />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <FormField
                label="Account Classification"
                helperText="Financial statement the account rolls up into."
              >
                <SelectInput
                  value={formData.classification}
                  onChange={(e) => handleFormChange("classification", e.target.value)}
                >
                  <option value="">— Not set —</option>
                  {CLASSIFICATIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  {formData.classification && !CLASSIFICATIONS.includes(formData.classification) && (
                    <option value={formData.classification}>{formData.classification}</option>
                  )}
                </SelectInput>
              </FormField>

              <FormField
                label="Report Section"
                helperText="Section used in Balance Sheet / Profit & Loss. Blank inherits from the parent group."
              >
                <SelectInput
                  value={formData.reportSection}
                  onChange={(e) => handleFormChange("reportSection", e.target.value)}
                >
                  <option value="">— Inherit / Not set —</option>
                  {REPORT_SECTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                  {formData.reportSection && !REPORT_SECTIONS.includes(formData.reportSection) && (
                    <option value={formData.reportSection}>{formData.reportSection}</option>
                  )}
                </SelectInput>
              </FormField>

              <FormField
                label="Allow Posting"
                helperText={
                  formData.accountType === "Group"
                    ? "Disabled for Group accounts. Only Ledgers allow transaction postings."
                    : "Enables journal and voucher line items to select this ledger."
                }
              >
                <div className="flex items-center gap-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 select-none">
                    <input
                      type="checkbox"
                      checked={formData.allowPosting}
                      disabled={formData.accountType === "Group"}
                      onChange={(e) => handleFormChange("allowPosting", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>
                      {formData.allowPosting ? "Posting Enabled" : "Posting Prohibited"}
                    </span>
                  </label>
                </div>
              </FormField>

              <FormField
                label="Bank / Cash Ledger"
                helperText="Marks the ledger for receipts, payments, contra and bank reconciliation."
              >
                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 select-none">
                    <input
                      type="checkbox"
                      checked={formData.isBankAccount}
                      disabled={formData.accountType === "Group"}
                      onChange={(e) => handleFormChange("isBankAccount", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>Bank A/c</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 select-none">
                    <input
                      type="checkbox"
                      checked={formData.isCashAccount}
                      disabled={formData.accountType === "Group"}
                      onChange={(e) => handleFormChange("isCashAccount", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>Cash A/c</span>
                  </label>
                </div>
              </FormField>

              {formData.isBankAccount && (
                <>
                  <FormField label="Bank Account No.">
                    <TextInput
                      value={formData.bankAccountNo}
                      onChange={(e) => handleFormChange("bankAccountNo", e.target.value)}
                      placeholder="e.g. 50200012345678"
                      className="font-mono"
                    />
                  </FormField>
                  <FormField label="Bank IFSC">
                    <TextInput
                      value={formData.bankIfsc}
                      onChange={(e) => handleFormChange("bankIfsc", e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0001234"
                      className="font-mono"
                    />
                  </FormField>
                </>
              )}
            </div>
          </MasterFormSection>

          <MasterAuditInfo
            idLabel="Account ID"
            idValue={activeNode.id}
            level={activeNode.level}
            isSystem={activeNode.isSystemAccount}
            status={activeNode.status}
            createdAt={formatDate(activeNode.createdAt)}
            updatedAt={formatDate(activeNode.updatedAt)}
            createdBy={activeNode.createdBy ?? undefined}
            updatedBy={activeNode.updatedBy ?? undefined}
            transactionCount={activeNode.transactionCount || 0}
          />
          </>
          )}
        </div>
      </div>
      )}

      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-xs shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className={cn(
                "flex items-start justify-between gap-3 px-5 py-4 text-white",
                createType === "Group" ? "bg-amber-600" : "bg-emerald-700"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                  {createType === "Group" ? <FolderTree className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                </span>
                <div>
                  <h3 className="text-sm font-bold">New {createType === "Group" ? "Account Group" : "Ledger Account"}</h3>
                  <p className="text-[11px] text-white/80">
                    {createParentId
                      ? `Under ${allGroups.find((g) => g.id === createParentId)?.name ?? "selected group"}`
                      : "At the root of the chart of accounts"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-white/80 hover:bg-white/15 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
              {/* Type selector */}
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: "Group", icon: FolderTree, title: "Account Group", note: "A heading that holds ledgers", tone: "amber" },
                    { id: "Ledger", icon: FileText, title: "Ledger", note: "A posting account for vouchers", tone: "emerald" },
                  ] as const
                ).map((t) => {
                  const active = createType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setCreateType(t.id)}
                      className={cn(
                        "flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all cursor-pointer",
                        active
                          ? t.tone === "amber"
                            ? "border-amber-400 bg-amber-50 ring-1 ring-amber-400"
                            : "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          t.tone === "amber" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                        )}
                      >
                        <t.icon className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-xs font-bold text-slate-900">{t.title}</span>
                        <span className="block text-[11px] text-slate-500">{t.note}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Identity */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Basic details</p>
                <FormField label="Parent Group" required={createType === "Ledger"}>
                  <SearchSelect
                    options={parentGroupOptions}
                    selectedId={createParentId || null}
                    onSelect={(opt) => applyCreateParent(opt.id, createType)}
                    onClear={() => applyCreateParent("", createType)}
                    placeholder="Root level (no parent) — search by code or name…"
                    inputClassName="h-9 text-xs"
                    renderOption={(opt) => (
                      <span className="flex w-full items-center gap-2 text-xs">
                        <span className="w-12 shrink-0 font-mono text-slate-400">{opt.hint}</span>
                        <span className="flex-1 truncate font-medium">{opt.sublabel}</span>
                        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                          {(opt.data as { nature: string }).nature}
                        </span>
                      </span>
                    )}
                  />
                </FormField>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr]">
                  <FormField label="Code" required>
                    <TextInput
                      value={createCode}
                      onChange={(e) => setCreateCode(e.target.value)}
                      placeholder="Suggested"
                      className="font-mono font-bold"
                    />
                  </FormField>
                  <FormField label={createType === "Group" ? "Group Name" : "Ledger Name"} required>
                    <TextInput
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder={createType === "Group" ? "e.g. Current Assets" : "e.g. Axis Bank Operating A/c"}
                      className="font-semibold text-slate-900"
                      autoFocus
                    />
                  </FormField>
                </div>
              </div>

              {/* Classification */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Classification</p>
                  {createParentId && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                      <Lock className="h-3 w-3" /> Nature inherited from parent
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {(["Asset", "Liability", "Income", "Expense"] as AccountNature[]).map((nat) => {
                    const active = createNature === nat;
                    return (
                      <button
                        key={nat}
                        type="button"
                        disabled={!!createParentId}
                        onClick={() => {
                          setCreateNature(nat);
                          setCreateClassification(defaultClassification(nat));
                        }}
                        className={cn(
                          "h-8 rounded-lg border text-[11px] font-semibold transition-colors",
                          active
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-600 enabled:hover:border-slate-300 enabled:cursor-pointer",
                          createParentId && !active && "opacity-40"
                        )}
                      >
                        {nat}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FormField label="Category">
                    <TextInput
                      value={createCategory}
                      list="coa-create-categories"
                      onChange={(e) => setCreateCategory(e.target.value)}
                      placeholder="e.g. Cash & Bank"
                    />
                    <datalist id="coa-create-categories">
                      {categoriesByNature[createNature].map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </FormField>
                  <FormField label="Report Classification">
                    <SelectInput value={createClassification} onChange={(e) => setCreateClassification(e.target.value)}>
                      {CLASSIFICATIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>
                </div>
              </div>

              {/* Ledger flags */}
              {createType === "Ledger" && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Ledger behaviour</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Bank account", note: "Shows in bank lists & reconciliation", checked: createIsBank, set: setCreateIsBank },
                      { label: "Cash account", note: "Shows in cash book & cashier screens", checked: createIsCash, set: setCreateIsCash },
                    ].map((f) => (
                      <label
                        key={f.label}
                        className={cn(
                          "flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-colors select-none",
                          f.checked ? "border-emerald-400 bg-emerald-50/70" : "border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={f.checked}
                          onChange={(e) => f.set(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>
                          <span className="block text-xs font-semibold text-slate-900">{f.label}</span>
                          <span className="block text-[11px] text-slate-500">{f.note}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <FormField label="Description">
                <TextAreaInput
                  rows={2}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Optional notes about how this account is used"
                />
              </FormField>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
              <p className="truncate text-[11px] text-slate-500">
                {createCode || "—"} · {createName || "Untitled"} · {createNature}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  className="h-8 px-4 text-xs font-semibold text-slate-600 bg-white cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleSaveNewAccount()}
                  disabled={saving}
                  className={cn(
                    "h-8 px-5 text-white font-bold text-xs shadow-xs cursor-pointer",
                    createType === "Group" ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-700 hover:bg-emerald-800"
                  )}
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                  Create {createType === "Group" ? "Group" : "Ledger"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeNode && (
        <MasterActivationDialog
          isOpen={showActivationDialog}
          onClose={() => setShowActivationDialog(false)}
          onConfirm={() => void handleToggleActivation()}
          recordName={activeNode.name}
          currentStatus={activeNode.status}
          hasDependents={activeNode.children.length > 0 || (activeNode.transactionCount || 0) > 0}
          dependentWarning={
            activeNode.accountType === "Group"
              ? `Deactivating group '${activeNode.name}' will restrict visibility of its child accounts during active entry selection.`
              : `Deactivating ledger '${activeNode.name}' will prevent front desk night audits and manual vouchers from posting to this account.`
          }
        />
      )}

      <MasterDeleteProtectionDialog
        isOpen={deleteDialogProps.isOpen}
        onClose={() => setDeleteDialogProps((prev) => ({ ...prev, isOpen: false }))}
        recordName={activeNode?.name ?? ""}
        reason={deleteDialogProps.reason}
        childCount={deleteDialogProps.childCount}
        transactionCount={deleteDialogProps.transactionCount}
      />
    </ModulePageShell>
  );
}
