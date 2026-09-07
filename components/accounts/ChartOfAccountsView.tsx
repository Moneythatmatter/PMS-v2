"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Building2,
  CheckCircle2,
  Plus,
  Save,
  RotateCcw,
  Shield,
  ShieldAlert,
  Info,
  Layers,
  Lock,
  Trash2,
  Power,
  RefreshCw,
  Sparkles,
  Sliders,
  FileText,
  FolderTree,
  AlertTriangle,
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
import {
  sampleCOATree,
  COANode,
  AccountNature,
  AccountType,
  AccountClassification,
  OpeningBalanceType,
  PostingType,
  natureCategories,
  findCOANodeById,
  getAllGroupNodes,
  generateAccountCode,
} from "@/app/data/accounts/chartOfAccountsData";
import {
  MasterFormSection,
  MasterAuditInfo,
  MasterActivationDialog,
  MasterDeleteProtectionDialog,
} from "@/components/accounts/MasterComponents";
import { AccountTreeView } from "@/components/accounts/AccountTreeView";
import { cn } from "@/lib/utils";

export function ChartOfAccountsView() {
  // Tree State
  const [treeData, setTreeData] = useState<COANode[]>(sampleCOATree);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("ACC-001");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Active Selected Node & Form State
  const activeNode = useMemo(() => {
    return findCOANodeById(treeData, selectedNodeId) || treeData[0];
  }, [treeData, selectedNodeId]);

  const [formData, setFormData] = useState<COANode>(activeNode);

  // Synchronize form when selectedNodeId changes
  useEffect(() => {
    setFormData({ ...activeNode });
  }, [activeNode]);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals & Dialogs State
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
  const [createParentId, setCreateParentId] = useState<string>("ACC-100");
  const [createNature, setCreateNature] = useState<AccountNature>("Asset");
  const [createCategory, setCreateCategory] = useState<string>("Bank");
  const [createName, setCreateName] = useState("");
  const [createCode, setCreateCode] = useState("1113");
  const [createDescription, setCreateDescription] = useState("");
  const [createClassification, setCreateClassification] =
    useState<AccountClassification>("Normal Account");
  const [createOpeningBalanceType, setCreateOpeningBalanceType] =
    useState<OpeningBalanceType>("Debit Only");
  const [createPostingType, setCreatePostingType] =
    useState<PostingType>("Both");

  // All Available Groups for Parent Selection
  const allGroups = useMemo(() => getAllGroupNodes(treeData), [treeData]);

  // Handle Tree Node Selection
  const handleSelectNode = (node: COANode) => {
    setSelectedNodeId(node.id);
  };

  // Expand / Collapse Handlers
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
    const traverse = (nodes: COANode[]) => {
      nodes.forEach((n) => {
        allIds.add(n.id);
        if (n.children) traverse(n.children);
      });
    };
    traverse(treeData);
    setExpandedNodes(allIds);
    setToastMessage("Expanded all chart of accounts groups.");
  };

  const handleCollapseAll = () => {
    setExpandedNodes(new Set());
    setToastMessage("Collapsed all groups.");
  };

  // Form Field Change Handler
  const handleFormChange = (field: keyof COANode, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // If nature changed, adapt category default
      if (field === "nature") {
        const availableCategories = natureCategories[value as AccountNature] || [];
        updated.category = availableCategories[0] || "General";
      }

      // If type changed to Group, auto-disable posting
      if (field === "type") {
        if (value === "Group") {
          updated.allowPosting = false;
        } else {
          updated.allowPosting = true;
        }
      }

      return updated;
    });
  };

  // Auto-generate code for current edit form
  const handleRegenerateCode = () => {
    const parent = findCOANodeById(treeData, formData.parentId || "");
    const newCode = generateAccountCode(parent, formData.nature, formData.type);
    setFormData((prev) => ({ ...prev, code: newCode }));
    setToastMessage(`Auto-generated Account Code '${newCode}'.`);
  };

  // Save Current Form Edits
  const handleSaveAccount = () => {
    if (!formData.name.trim()) {
      setToastMessage("Account Name cannot be empty.");
      return;
    }

    const updatedNode: COANode = {
      ...formData,
      updatedAt: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };

    setTreeData((prev) => {
      const updateRecursive = (nodes: COANode[]): COANode[] => {
        return nodes.map((n) => {
          if (n.id === updatedNode.id) {
            return {
              ...n,
              ...updatedNode,
              children: n.children, // preserve children
            };
          }
          if (n.children) {
            return { ...n, children: updateRecursive(n.children) };
          }
          return n;
        });
      };
      return updateRecursive(prev);
    });

    setToastMessage(`Successfully saved account '${formData.name}'.`);
  };

  // Reset Changes
  const handleResetForm = () => {
    setFormData({ ...activeNode });
    setToastMessage(`Reverted changes for '${activeNode.name}'.`);
  };

  // Toggle Activation Flow
  const handleToggleActivation = () => {
    const newStatus = formData.status === "Active" ? "Inactive" : "Active";
    setFormData((prev) => ({ ...prev, status: newStatus }));

    setTreeData((prev) => {
      const updateRecursive = (nodes: COANode[]): COANode[] => {
        return nodes.map((n) => {
          if (n.id === formData.id) {
            return {
              ...n,
              status: newStatus,
              updatedAt: new Date().toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
            };
          }
          if (n.children) {
            return { ...n, children: updateRecursive(n.children) };
          }
          return n;
        });
      };
      return updateRecursive(prev);
    });

    setToastMessage(
      `Account '${formData.name}' is now ${newStatus.toUpperCase()}.`
    );
  };

  // Attempt Delete Flow (With Strict Delete Protection Checks)
  const handleDeleteAttempt = () => {
    // Check 1: System Account Lock
    if (formData.isSystemAccount || formData.classification === "System Account") {
      setDeleteDialogProps({
        isOpen: true,
        reason: "system_account",
        childCount: (formData.children || []).length,
        transactionCount: formData.transactionCount || 0,
      });
      return;
    }

    // Check 2: Has Children
    if (formData.children && formData.children.length > 0) {
      setDeleteDialogProps({
        isOpen: true,
        reason: "has_children",
        childCount: formData.children.length,
        transactionCount: formData.transactionCount || 0,
      });
      return;
    }

    // Check 3: Has Transactions
    if (formData.hasTransactions || (formData.transactionCount || 0) > 0) {
      setDeleteDialogProps({
        isOpen: true,
        reason: "has_transactions",
        childCount: 0,
        transactionCount: formData.transactionCount || 0,
      });
      return;
    }

    // Otherwise, safe to delete (only for freshly created accounts with 0 transactions & 0 children)
    setTreeData((prev) => {
      const deleteRecursive = (nodes: COANode[]): COANode[] => {
        return nodes
          .filter((n) => n.id !== formData.id)
          .map((n) => ({
            ...n,
            children: n.children ? deleteRecursive(n.children) : undefined,
          }));
      };
      return deleteRecursive(prev);
    });

    setSelectedNodeId("ACC-001");
    setToastMessage(`Deleted custom account '${formData.name}'.`);
  };

  // Open Create Account Modal
  const handleOpenCreateModal = () => {
    const parentNode = findCOANodeById(treeData, selectedNodeId);
    const parent =
      parentNode && parentNode.type === "Group"
        ? parentNode
        : findCOANodeById(treeData, "ACC-001") || treeData[0];

    const defaultNature = parent.nature || "Asset";
    const defaultCategories = natureCategories[defaultNature];
    const generatedCode = generateAccountCode(parent, defaultNature, "Ledger");

    setCreateType("Ledger");
    setCreateParentId(parent.id);
    setCreateNature(defaultNature);
    setCreateCategory(defaultCategories[0] || "General");
    setCreateName("");
    setCreateCode(generatedCode);
    setCreateDescription("");
    setCreateClassification("Normal Account");
    setCreateOpeningBalanceType("Debit Only");
    setCreatePostingType("Both");
    setShowCreateModal(true);
  };

  // Update Create Modal Parent Change & Auto-code
  const handleCreateParentChange = (parentId: string) => {
    setCreateParentId(parentId);
    const parent = findCOANodeById(treeData, parentId);
    if (parent) {
      setCreateNature(parent.nature);
      const cats = natureCategories[parent.nature];
      setCreateCategory(cats[0] || "General");
      const nextCode = generateAccountCode(parent, parent.nature, createType);
      setCreateCode(nextCode);
    }
  };

  // Handle Save New Account
  const handleSaveNewAccount = () => {
    if (!createName.trim()) {
      setToastMessage("Please enter a valid Account Name.");
      return;
    }

    const parent = findCOANodeById(treeData, createParentId);
    const parentLevel = parent ? parent.level : 1;
    const parentName = parent ? parent.name : "Root";

    const newId = `ACC-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const newNode: COANode = {
      id: newId,
      code: createCode.trim() || `${Math.floor(1000 + Math.random() * 9000)}`,
      name: createName.trim(),
      parentName: parentName,
      parentId: createParentId,
      nature: createNature,
      category: createCategory,
      type: createType,
      status: "Active",
      description: createDescription.trim(),
      allowPosting: createType === "Ledger",
      openingBalanceType: createOpeningBalanceType,
      classification: createClassification,
      postingType: createPostingType,
      isSystemAccount: false,
      level: parentLevel + 1,
      createdAt: now,
      updatedAt: now,
      hasTransactions: false,
      transactionCount: 0,
      children: createType === "Group" ? [] : undefined,
    };

    setTreeData((prev) => {
      const insertRecursive = (nodes: COANode[]): COANode[] => {
        return nodes.map((n) => {
          if (n.id === createParentId) {
            return {
              ...n,
              children: [...(n.children || []), newNode],
            };
          }
          if (n.children) {
            return { ...n, children: insertRecursive(n.children) };
          }
          return n;
        });
      };
      return insertRecursive(prev);
    });

    setExpandedNodes((prev) => new Set([...prev, createParentId]));
    setSelectedNodeId(newNode.id);
    setShowCreateModal(false);
    setToastMessage(
      `Created new ${createType} '${newNode.name}' (${newNode.code}) under '${parentName}'.`
    );
  };

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
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          {/* Create Account Modal Trigger */}
          <Button
            type="button"
            size="sm"
            onClick={handleOpenCreateModal}
            className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Create Account
          </Button>

          {/* Save Current Account Edits */}
          <Button
            type="button"
            size="sm"
            onClick={handleSaveAccount}
            className="rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            Save Changes
          </Button>

          {/* Safe Activate / Deactivate Trigger */}
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

          {/* Delete Account Trigger */}
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

          {/* Reset Changes */}
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
      {/* Main Split Layout: 40% Left Panel (Tree) & 60% Right Panel (Form) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 font-sans">
        {/* LEFT PANEL: Reusable AccountTreeView */}
        <div className="md:col-span-5">
          <AccountTreeView
            treeData={treeData}
            selectedNodeId={selectedNodeId}
            onSelectNode={handleSelectNode}
            expandedNodes={expandedNodes}
            onToggleExpand={handleToggleExpand}
            onExpandAll={handleExpandAll}
            onCollapseAll={handleCollapseAll}
            onCreateAccountClick={handleOpenCreateModal}
          />
        </div>

        {/* RIGHT PANEL: Account Details Form */}
        <div className="md:col-span-7 space-y-4">
          {/* Header Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-700" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    {formData.type === "Group"
                      ? "Group Account Maintenance"
                      : "Ledger Account Maintenance"}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Selected: <strong className="text-slate-900">{formData.name}</strong>{" "}
                  ({formData.code})
                </p>
              </div>

              {/* Status & Level Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-mono font-bold text-slate-700 border border-slate-200">
                  <Layers className="h-3.5 w-3.5 text-slate-500" />
                  Level {formData.level}
                </span>

                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold border",
                    formData.type === "Group"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-indigo-50 text-indigo-800 border-indigo-200"
                  )}
                >
                  {formData.type}
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
            subtitle="Core identification, classification, and hierarchy details."
            icon={<FileText className="h-4 w-4" />}
            badge={
              formData.isSystemAccount ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  <Lock className="h-3 w-3" />
                  System Account (Locked)
                </span>
              ) : undefined
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Account ID (Read Only) */}
              <FormField label="Account ID">
                <TextInput
                  value={formData.id}
                  readOnly
                  className="bg-slate-50 font-mono font-bold text-slate-700 cursor-not-allowed"
                />
              </FormField>

              {/* Account Code (Auto-generated with regenerate button) */}
              <FormField label="Account Code" required>
                <div className="flex items-center gap-1.5">
                  <TextInput
                    value={formData.code}
                    onChange={(e) => handleFormChange("code", e.target.value)}
                    placeholder="e.g. 1111"
                    className="font-mono font-bold text-slate-900"
                  />
                  {!formData.isSystemAccount && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateCode}
                      title="Auto-calculate next sequence code"
                      className="h-9 px-2 text-xs font-bold bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100 shrink-0"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                    </Button>
                  )}
                </div>
              </FormField>

              {/* Account Name */}
              <FormField label="Account Name" required className="sm:col-span-2">
                <TextInput
                  value={formData.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  placeholder="Enter formal account title..."
                  className="font-bold text-slate-900"
                />
              </FormField>

              {/* Parent Group / Account */}
              <FormField
                label="Parent Account / Group"
                helperText={
                  formData.isSystemAccount
                    ? "System accounts cannot change parent hierarchy."
                    : "Organizes this ledger under the selected parent group."
                }
              >
                <SelectInput
                  value={formData.parentId || ""}
                  disabled={formData.isSystemAccount || formData.level === 1}
                  onChange={(e) => {
                    const selectedParent = allGroups.find(
                      (g) => g.id === e.target.value
                    );
                    if (selectedParent) {
                      setFormData((prev) => ({
                        ...prev,
                        parentId: selectedParent.id,
                        parentName: selectedParent.name,
                        nature: selectedParent.nature,
                        level: selectedParent.level + 1,
                      }));
                    }
                  }}
                  className={cn(
                    (formData.isSystemAccount || formData.level === 1) &&
                      "bg-slate-50 cursor-not-allowed text-slate-600"
                  )}
                >
                  {formData.level === 1 ? (
                    <option value="">Root Level (No Parent)</option>
                  ) : (
                    allGroups.map((grp) => (
                      <option key={grp.id} value={grp.id}>
                        {grp.code} - {grp.name} ({grp.nature})
                      </option>
                    ))
                  )}
                </SelectInput>
              </FormField>

              {/* Account Nature */}
              <FormField
                label="Account Nature"
                required
                helperText={
                  formData.isSystemAccount
                    ? "Root nature is permanently locked for system accounts."
                    : undefined
                }
              >
                <SelectInput
                  value={formData.nature}
                  disabled={formData.isSystemAccount || formData.level === 1}
                  onChange={(e) =>
                    handleFormChange("nature", e.target.value as AccountNature)
                  }
                  className={cn(
                    (formData.isSystemAccount || formData.level === 1) &&
                      "bg-slate-50 cursor-not-allowed text-slate-600 font-bold"
                  )}
                >
                  <option value="Asset">Asset</option>
                  <option value="Liability">Liability</option>
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                </SelectInput>
              </FormField>

              {/* Account Category */}
              <FormField label="Account Category" required>
                <SelectInput
                  value={formData.category}
                  onChange={(e) => handleFormChange("category", e.target.value)}
                >
                  {(natureCategories[formData.nature] || []).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </SelectInput>
              </FormField>

              {/* Account Type */}
              <FormField
                label="Account Type"
                required
                helperText={
                  formData.type === "Group"
                    ? "Group accounts strictly categorize ledgers; transactions cannot post to groups."
                    : "Ledger accounts allow active voucher posting."
                }
              >
                <SelectInput
                  value={formData.type}
                  disabled={formData.isSystemAccount}
                  onChange={(e) =>
                    handleFormChange("type", e.target.value as AccountType)
                  }
                  className={cn(
                    formData.isSystemAccount &&
                      "bg-slate-50 cursor-not-allowed text-slate-600 font-bold"
                  )}
                >
                  <option value="Group">Group (Header / Category)</option>
                  <option value="Ledger">Ledger (Transactional Account)</option>
                </SelectInput>
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
              <FormField label="Description & Purpose" className="sm:col-span-2">
                <TextAreaInput
                  rows={2}
                  value={formData.description || ""}
                  onChange={(e) =>
                    handleFormChange("description", e.target.value)
                  }
                  placeholder="Add notes on accounting purpose, statutory mandates, or usage rules..."
                />
              </FormField>
            </div>
          </MasterFormSection>

          {/* Section 2: Accounting Configuration */}
          <MasterFormSection
            title="Accounting Configuration"
            subtitle="Posting governance, balance policies, and classification tiers."
            icon={<Sliders className="h-4 w-4" />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Account Classification */}
              <FormField
                label="Account Classification"
                required
                helperText="Defines operational role: Normal (regular postings), Control (syncs party/guest sub-ledgers), or System (PMS core engine)."
              >
                <SelectInput
                  value={formData.classification}
                  disabled={formData.isSystemAccount}
                  onChange={(e) =>
                    handleFormChange(
                      "classification",
                      e.target.value as AccountClassification
                    )
                  }
                  className={cn(
                    formData.isSystemAccount &&
                      "bg-slate-50 cursor-not-allowed font-bold text-slate-700"
                  )}
                >
                  <option value="Normal Account">Normal Account</option>
                  <option value="Control Account">Control Account</option>
                  <option value="System Account">System Account</option>
                </SelectInput>
              </FormField>

              {/* Posting Type */}
              <FormField
                label="Posting Type"
                required
                helperText="Controls allowed transaction origin: System (auto posting only), Manual (vouchers only), or Both."
              >
                <SelectInput
                  value={formData.postingType}
                  onChange={(e) =>
                    handleFormChange(
                      "postingType",
                      e.target.value as PostingType
                    )
                  }
                >
                  <option value="Both">Both (Manual Vouchers & System Auto-Posting)</option>
                  <option value="System">System Only (Front Office / POS / Night Audit)</option>
                  <option value="Manual">Manual Only (Accountant Voucher Entry)</option>
                </SelectInput>
              </FormField>

              {/* Opening Balance Type */}
              <FormField
                label="Opening Balance Type"
                required
                helperText="Dictates permissible opening balance sign (e.g. Debit Only for Cash/Bank, Credit Only for Vendors, None for Revenue/Expense)."
              >
                <SelectInput
                  value={formData.openingBalanceType}
                  onChange={(e) =>
                    handleFormChange(
                      "openingBalanceType",
                      e.target.value as OpeningBalanceType
                    )
                  }
                >
                  <option value="None">None (P&L / Revenue / Expense)</option>
                  <option value="Debit Only">Debit Only (Cash / Bank / Assets)</option>
                  <option value="Credit Only">Credit Only (Payables / Loans / Capital)</option>
                  <option value="Both">Both (Guest Folios / Clearing Accounts)</option>
                </SelectInput>
              </FormField>

              {/* Allow Posting Flag */}
              <FormField
                label="Allow Posting"
                helperText={
                  formData.type === "Group"
                    ? "Disabled for Group accounts. Only Ledgers allow transaction postings."
                    : "Enables journal and voucher line items to select this ledger."
                }
              >
                <div className="flex items-center gap-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 select-none">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.allowPosting)}
                      disabled={formData.type === "Group"}
                      onChange={(e) =>
                        handleFormChange("allowPosting", e.target.checked)
                      }
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>
                      {formData.allowPosting
                        ? "Posting Enabled"
                        : "Posting Prohibited"}
                    </span>
                  </label>
                </div>
              </FormField>
            </div>
          </MasterFormSection>

          {/* Section 3: Usage & Audit Information (Read Only) */}
          <MasterAuditInfo
            idLabel="Account ID"
            idValue={formData.id}
            level={formData.level}
            isSystem={formData.isSystemAccount}
            status={formData.status}
            createdAt={formData.createdAt}
            updatedAt={formData.updatedAt}
            transactionCount={formData.transactionCount || 0}
          />
        </div>
      </div>

      {/* Unified + Create Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4 font-sans text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Create New Account Master
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Segmented Account Type Selector: Group vs Ledger */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setCreateType("Group");
                    const parent = findCOANodeById(treeData, createParentId);
                    if (parent) {
                      setCreateCode(
                        generateAccountCode(parent, createNature, "Group")
                      );
                    }
                  }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer",
                    createType === "Group"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <FolderTree className="h-4 w-4 text-amber-600" />
                  Account Group (Category)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreateType("Ledger");
                    const parent = findCOANodeById(treeData, createParentId);
                    if (parent) {
                      setCreateCode(
                        generateAccountCode(parent, createNature, "Ledger")
                      );
                    }
                  }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer",
                    createType === "Ledger"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <FileText className="h-4 w-4 text-emerald-600" />
                  Ledger (Posting Account)
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Parent Group Selector */}
                <FormField label="Parent Group" required>
                  <SelectInput
                    value={createParentId}
                    onChange={(e) => handleCreateParentChange(e.target.value)}
                  >
                    {allGroups.map((grp) => (
                      <option key={grp.id} value={grp.id}>
                        {grp.code} - {grp.name} ({grp.nature})
                      </option>
                    ))}
                  </SelectInput>
                </FormField>

                {/* Auto-generated Code */}
                <FormField label="Account Code" required>
                  <TextInput
                    value={createCode}
                    onChange={(e) => setCreateCode(e.target.value)}
                    placeholder="Auto-calculated code"
                    className="font-mono font-bold"
                  />
                </FormField>
              </div>

              {/* Account Name */}
              <FormField label="Account Title / Name" required>
                <TextInput
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Axis Bank Operating A/c, Guest Linen Expense..."
                  className="font-bold text-slate-900"
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nature */}
                <FormField label="Nature" required>
                  <SelectInput
                    value={createNature}
                    onChange={(e) => {
                      const nat = e.target.value as AccountNature;
                      setCreateNature(nat);
                      const cats = natureCategories[nat];
                      setCreateCategory(cats[0] || "General");
                      const parent = findCOANodeById(treeData, createParentId);
                      setCreateCode(
                        generateAccountCode(parent, nat, createType)
                      );
                    }}
                  >
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                  </SelectInput>
                </FormField>

                {/* Category */}
                <FormField label="Category" required>
                  <SelectInput
                    value={createCategory}
                    onChange={(e) => setCreateCategory(e.target.value)}
                  >
                    {(natureCategories[createNature] || []).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
              </div>

              {createType === "Ledger" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <FormField label="Classification">
                    <SelectInput
                      value={createClassification}
                      onChange={(e) =>
                        setCreateClassification(
                          e.target.value as AccountClassification
                        )
                      }
                    >
                      <option value="Normal Account">Normal Account</option>
                      <option value="Control Account">Control Account</option>
                      <option value="System Account">System Account</option>
                    </SelectInput>
                  </FormField>

                  <FormField label="Posting Type">
                    <SelectInput
                      value={createPostingType}
                      onChange={(e) =>
                        setCreatePostingType(e.target.value as PostingType)
                      }
                    >
                      <option value="Both">Both</option>
                      <option value="System">System Only</option>
                      <option value="Manual">Manual Only</option>
                    </SelectInput>
                  </FormField>

                  <FormField label="Opening Balance">
                    <SelectInput
                      value={createOpeningBalanceType}
                      onChange={(e) =>
                        setCreateOpeningBalanceType(
                          e.target.value as OpeningBalanceType
                        )
                      }
                    >
                      <option value="None">None</option>
                      <option value="Debit Only">Debit Only</option>
                      <option value="Credit Only">Credit Only</option>
                      <option value="Both">Both</option>
                    </SelectInput>
                  </FormField>
                </div>
              )}

              {/* Description */}
              <FormField label="Description">
                <TextAreaInput
                  rows={2}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Optional account notes and operational policies..."
                />
              </FormField>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCreateModal(false)}
                className="px-4 h-8 text-xs font-semibold text-slate-600 bg-white cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveNewAccount}
                className="px-5 h-8 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Create {createType}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Safe Activation / Deactivation Confirmation Dialog */}
      <MasterActivationDialog
        isOpen={showActivationDialog}
        onClose={() => setShowActivationDialog(false)}
        onConfirm={handleToggleActivation}
        recordName={formData.name}
        currentStatus={formData.status}
        hasDependents={
          (formData.children && formData.children.length > 0) ||
          (formData.transactionCount || 0) > 0
        }
        dependentWarning={
          formData.type === "Group"
            ? `Deactivating group '${formData.name}' will restrict visibility of its child accounts during active entry selection.`
            : `Deactivating ledger '${formData.name}' will prevent front desk night audits and manual vouchers from posting to this account.`
        }
      />

      {/* Delete Protection Alert Dialog */}
      <MasterDeleteProtectionDialog
        isOpen={deleteDialogProps.isOpen}
        onClose={() =>
          setDeleteDialogProps((prev) => ({ ...prev, isOpen: false }))
        }
        recordName={formData.name}
        reason={deleteDialogProps.reason}
        childCount={deleteDialogProps.childCount}
        transactionCount={deleteDialogProps.transactionCount}
      />
    </ModulePageShell>
  );
}
