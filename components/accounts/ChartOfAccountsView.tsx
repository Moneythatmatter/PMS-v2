"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Folder,
  FolderOpen,
  FileText,
  Search,
  Plus,
  Save,
  RotateCcw,
  X,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Shield,
  Layers,
  Building2,
  Info,
  CheckSquare,
  Square,
  Lock,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  SelectInput,
  StatMiniCard,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  sampleCOATree,
  COANode,
} from "@/app/data/accounts/chartOfAccountsData";
import { cn } from "@/lib/utils";

export function ChartOfAccountsView() {
  // Master Tree State
  const [treeData, setTreeData] = useState<COANode[]>(sampleCOATree);
  const [selectedNode, setSelectedNode] = useState<COANode>(sampleCOATree[0]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Form Fields Editable State (derived from selectedNode)
  const [formData, setFormData] = useState<COANode>(sampleCOATree[0]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterInactive, setFilterInactive] = useState(false);

  // Add Group / Ledger Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<"group" | "ledger">("group");
  const [newNodeName, setNewNodeName] = useState("");
  const [newNodeAlias, setNewNodeAlias] = useState("");
  const [newNodeCode, setNewNodeCode] = useState("");

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Update formData when selectedNode changes
  useEffect(() => {
    setFormData({ ...selectedNode });
  }, [selectedNode]);

  // Tree Expand / Collapse Handlers
  const handleToggleExpand = (id: string) => {
    const next = new Set(expandedNodes);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedNodes(next);
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

  // Node Selection Handler
  const handleSelectNode = (node: COANode) => {
    setSelectedNode(node);
  };

  // Form Field Change Handler
  const handleFormChange = (field: keyof COANode, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Save Node Changes
  const handleSaveNode = () => {
    setTreeData((prev) => {
      const updateTree = (nodes: COANode[]): COANode[] => {
        return nodes.map((n) => {
          if (n.id === formData.id) {
            return { ...n, ...formData };
          }
          if (n.children) {
            return { ...n, children: updateTree(n.children) };
          }
          return n;
        });
      };
      return updateTree(prev);
    });
    setSelectedNode(formData);
    setToastMessage(`Saved details for ${formData.type.toUpperCase()} '${formData.name}'.`);
  };

  // Reset / Cancel Edits
  const handleCancelEdits = () => {
    setFormData({ ...selectedNode });
    setToastMessage(`Reverted changes for '${selectedNode.name}'.`);
  };

  // Refresh Tree State
  const handleRefresh = () => {
    setTreeData(sampleCOATree);
    setSelectedNode(sampleCOATree[0]);
    setFormData(sampleCOATree[0]);
    setToastMessage("Refreshed Chart of Accounts data.");
  };

  // Create New Node Handler
  const handleCreateNode = () => {
    if (!newNodeName.trim()) {
      setToastMessage("Please enter a valid name.");
      return;
    }

    const newNode: COANode = {
      id: `custom-${Date.now()}`,
      code: newNodeCode || `${Math.floor(1000 + Math.random() * 9000)}`,
      name: newNodeName.toUpperCase(),
      alias: newNodeAlias.toUpperCase() || newNodeName.toUpperCase(),
      type: modalType,
      level: modalType === "group" ? "SUB-GROUP" : "LEDGER",
      parentName: selectedNode.name,
      nature: selectedNode.nature || "ASSET",
      isActive: true,
      openingBalance: 0,
      openingType: "Dr",
      openingDebit: 0,
      openingCredit: 0,
      currency: "INR",
      category: modalType === "ledger" ? "General Account" : undefined,
      costCenter: false,
      analysisLevels: false,
      gstApplicable: false,
      reconciliationRequired: false,
      bankAccount: false,
      partyLedger: false,
      cashLedger: false,
      systemLedger: false,
      children: modalType === "group" ? [] : undefined,
    };

    setTreeData((prev) => {
      const updateTree = (nodes: COANode[]): COANode[] => {
        return nodes.map((n) => {
          if (n.id === selectedNode.id) {
            return {
              ...n,
              children: [...(n.children || []), newNode],
            };
          }
          if (n.children) {
            return { ...n, children: updateTree(n.children) };
          }
          return n;
        });
      };
      return updateTree(prev);
    });

    setExpandedNodes((prev) => new Set([...prev, selectedNode.id]));
    setSelectedNode(newNode);
    setShowAddModal(false);
    setNewNodeName("");
    setNewNodeAlias("");
    setNewNodeCode("");
    setToastMessage(`Created new ${modalType} '${newNode.name}' under '${selectedNode.name}'.`);
  };

  // Recursive Tree Node Component
  const TreeNode = ({ node, level = 0 }: { node: COANode; level?: number }) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNode.id === node.id;
    const hasChildren = node.children && node.children.length > 0;

    // Filter Inactive
    if (filterInactive && !node.isActive) return null;

    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesSelf =
        node.name.toLowerCase().includes(q) || (node.code && node.code.toLowerCase().includes(q));
      let matchesChild = false;
      if (node.children) {
        const checkChildren = (children: COANode[]): boolean => {
          return children.some(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              (c.code && c.code.toLowerCase().includes(q)) ||
              (c.children && checkChildren(c.children))
          );
        };
        matchesChild = checkChildren(node.children);
      }
      if (!matchesSelf && !matchesChild) return null;
    }

    const handleRowClick = () => {
      handleSelectNode(node);
      if (node.type === "group") {
        handleToggleExpand(node.id);
      }
    };

    return (
      <div className="select-none text-xs font-sans">
        <div
          tabIndex={0}
          onClick={handleRowClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleRowClick();
            }
          }}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          className={cn(
            "flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl cursor-pointer transition-all duration-150 group outline-none",
            isSelected
              ? "bg-emerald-700 text-white font-bold shadow-xs"
              : "hover:bg-amber-50/80 text-slate-800",
            !node.isActive && "opacity-60 italic"
          )}
        >
          {/* Expand/Collapse Chevron */}
          {node.type === "group" ? (
            <span className="p-0.5 rounded shrink-0">
              {isExpanded ? (
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", isSelected ? "text-white" : "text-slate-500")} />
              ) : (
                <ChevronRight className={cn("h-3.5 w-3.5 transition-transform duration-200", isSelected ? "text-white" : "text-slate-500")} />
              )}
            </span>
          ) : (
            <span className="w-3.5 shrink-0" />
          )}

          {/* Node Icon */}
          {node.type === "group" ? (
            isExpanded ? (
              <FolderOpen className={cn("h-4 w-4 shrink-0 transition-colors", isSelected ? "text-amber-200" : "text-amber-600")} />
            ) : (
              <Folder className={cn("h-4 w-4 shrink-0 transition-colors", isSelected ? "text-amber-200" : "text-amber-600")} />
            )
          ) : (
            <FileText className={cn("h-4 w-4 shrink-0 transition-colors", isSelected ? "text-emerald-200" : "text-slate-500")} />
          )}

          {/* Node Title */}
          <span className="truncate flex-1 font-semibold tracking-tight">
            {node.name}
          </span>

          {/* Badges */}
          {node.isReserved && (
            <span className={cn(
              "text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0",
              isSelected ? "bg-emerald-800 text-emerald-100" : "bg-rose-100 text-rose-800"
            )}>
              RES
            </span>
          )}

          {!node.isActive && (
            <span className={cn(
              "text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0",
              isSelected ? "bg-emerald-800 text-emerald-100" : "bg-slate-200 text-slate-600"
            )}>
              INACTIVE
            </span>
          )}
        </div>

        {/* Children Render with Smooth Grid Height Transition */}
        {node.type === "group" && hasChildren && (
          <div
            className={cn(
              "grid transition-all duration-200 ease-in-out",
              isExpanded ? "grid-rows-[1fr] opacity-100 mt-0.5" : "grid-rows-[0fr] opacity-0 overflow-hidden"
            )}
          >
            <div className="overflow-hidden space-y-0.5">
              {node.children!.map((child) => (
                <TreeNode key={child.id} node={child} level={level + 1} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & Masters"
      title="Chart of Accounts"
      description="Manage accounting groups, ledger hierarchy, and chart of accounts."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Masters", href: "/accounts/masters" },
        { label: "Chart of Accounts" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setModalType("group");
              setShowAddModal(true);
            }}
            className="rounded-xl text-xs font-bold bg-white text-slate-800 border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            Add Group
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setModalType("ledger");
              setShowAddModal(true);
            }}
            className="rounded-xl text-xs font-bold bg-white text-slate-800 border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            Add Ledger
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSaveNode}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            Save
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Refresh
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancelEdits}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            Cancel
          </Button>
        </div>
      }
    >
      {/* Top Filter Bar Header */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Ledger Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ledger Search..."
              className="h-8 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-8 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Controls: Filter Inactive Checkbox, Expand All, Collapse All */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filterInactive}
                onChange={(e) => setFilterInactive(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <span>Filter Inactive</span>
            </label>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExpandAll}
              className="h-8 text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
            >
              Expand All
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCollapseAll}
              className="h-8 text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
            >
              Collapse All
            </Button>
          </div>
        </div>
      </div>

      {/* Main Split Layout: 40% Left / 60% Right (Desktop w-2/5 & w-3/5) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        {/* LEFT PANEL (40% Desktop / 45% Tablet / 100% Mobile) */}
        <div className="md:col-span-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col min-h-[620px]">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Chart of Accounts Hierarchy
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              Tree
            </span>
          </div>

          {/* Tree View Container */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-1 max-h-[650px]">
            {treeData.map((node) => (
              <TreeNode key={node.id} node={node} />
            ))}
          </div>
        </div>

        {/* RIGHT PANEL (60% Desktop / 55% Tablet / 100% Mobile) - Dynamic Details Panel */}
        <div className="md:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">
                  {formData.type === "group" ? "Current Group Details" : "Current Ledger Details"}
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Selected: <strong>{formData.name}</strong> ({formData.type.toUpperCase()})
              </p>
            </div>

            {/* Badges: Reserved, Hierarchy Level, Status */}
            <div className="flex items-center gap-2">
              {formData.isReserved && (
                <span className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-200">
                  <Shield className="h-3.5 w-3.5" />
                  Reserved
                </span>
              )}

              <span className="inline-flex items-center rounded-xl bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200">
                Level : &lt;{formData.level}&gt;
              </span>

              <span
                className={cn(
                  "inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-bold border",
                  formData.isActive
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                )}
              >
                {formData.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* DYNAMIC FORM FIELDS */}
          {formData.type === "group" ? (
            /* GROUP DETAILS FORM */
            <div className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Group Name" required>
                  <TextInput
                    value={formData.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    placeholder="Enter group name..."
                    className="font-bold text-slate-900"
                  />
                </FormField>

                <FormField label="Alias">
                  <TextInput
                    value={formData.alias || ""}
                    onChange={(e) => handleFormChange("alias", e.target.value)}
                    placeholder="e.g. ASSETS, CA, FA"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Parent Group">
                  <TextInput
                    value={formData.parentName || "Root Account"}
                    readOnly
                    className="bg-slate-50 font-semibold text-slate-700 cursor-not-allowed"
                  />
                </FormField>

                <FormField label="Nature">
                  <SelectInput
                    value={formData.nature || "ASSET"}
                    onChange={(e) => handleFormChange("nature", e.target.value)}
                  >
                    <option value="ASSET">ASSET</option>
                    <option value="LIABILITY">LIABILITY</option>
                    <option value="INCOME">INCOME</option>
                    <option value="EXPENSE">EXPENSE</option>
                    <option value="EQUITY">EQUITY</option>
                  </SelectInput>
                </FormField>
              </div>

              {/* Group Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.isReserved)}
                    onChange={(e) => handleFormChange("isReserved", e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span>Reserved System Group</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.isActive)}
                    onChange={(e) => handleFormChange("isActive", e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span>Active Group</span>
                </label>
              </div>

              {/* Opening Balance Summary Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                  <span>Opening Balance Summary</span>
                  <span className="text-[10px] text-slate-500 font-normal">Aggregated totals</span>
                </h4>

                <div className="grid grid-cols-3 gap-3 text-center pt-1">
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Debit Total</span>
                    <span className="text-xs font-mono font-bold text-rose-700 mt-0.5 block">
                      {formatINR(formData.openingDebit || 248232857.97)} Dr
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Credit Total</span>
                    <span className="text-xs font-mono font-bold text-rose-700 mt-0.5 block">
                      {formatINR(formData.openingCredit || 248232857.97)} Cr
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-800 block uppercase">Difference</span>
                    <span className="text-xs font-mono font-extrabold text-emerald-900 mt-0.5 block">
                      0.00
                    </span>
                  </div>
                </div>
              </div>

              {/* Sequence Settings */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Sequence Settings
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Display Sequence Number">
                    <TextInput
                      value={formData.sequenceNo || "0001"}
                      onChange={(e) => handleFormChange("sequenceNo", e.target.value)}
                      placeholder="e.g. 0001"
                      className="font-mono font-bold"
                    />
                  </FormField>

                  <FormField label="P&L / Balance Sheet Sequence">
                    <TextInput
                      value={formData.reportSequence || "1"}
                      onChange={(e) => handleFormChange("reportSequence", e.target.value)}
                      placeholder="e.g. 1.1"
                      className="font-mono font-bold"
                    />
                  </FormField>
                </div>
              </div>
            </div>
          ) : (
            /* LEDGER DETAILS FORM */
            <div className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Ledger Name" required>
                  <TextInput
                    value={formData.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    placeholder="Enter ledger name..."
                    className="font-bold text-slate-900"
                  />
                </FormField>

                <FormField label="Alias">
                  <TextInput
                    value={formData.alias || ""}
                    onChange={(e) => handleFormChange("alias", e.target.value)}
                    placeholder="e.g. HDFC, CASH"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Parent Group">
                  <TextInput
                    value={formData.parentName || "Current Assets"}
                    readOnly
                    className="bg-slate-50 font-semibold text-slate-700 cursor-not-allowed"
                  />
                </FormField>

                <FormField label="Opening Balance">
                  <TextInput
                    type="number"
                    value={formData.openingBalance || 0}
                    onChange={(e) => handleFormChange("openingBalance", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="font-mono font-bold text-right"
                  />
                </FormField>

                <FormField label="Opening Balance Type">
                  <SelectInput
                    value={formData.openingType || "Dr"}
                    onChange={(e) => handleFormChange("openingType", e.target.value)}
                  >
                    <option value="Dr">Debit (Dr)</option>
                    <option value="Cr">Credit (Cr)</option>
                  </SelectInput>
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Currency">
                  <SelectInput
                    value={formData.currency || "INR"}
                    onChange={(e) => handleFormChange("currency", e.target.value)}
                  >
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                  </SelectInput>
                </FormField>

                <FormField label="Ledger Category">
                  <TextInput
                    value={formData.category || "General Account"}
                    onChange={(e) => handleFormChange("category", e.target.value)}
                    placeholder="e.g. Bank Account, Vendor Ledger"
                  />
                </FormField>
              </div>

              {/* Ledger Configuration Toggles Grid */}
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Ledger Account Flags & Options
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.costCenter)}
                      onChange={(e) => handleFormChange("costCenter", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 h-3.5 w-3.5"
                    />
                    <span>Cost Center</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.analysisLevels)}
                      onChange={(e) => handleFormChange("analysisLevels", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 h-3.5 w-3.5"
                    />
                    <span>Analysis Levels</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.gstApplicable)}
                      onChange={(e) => handleFormChange("gstApplicable", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 h-3.5 w-3.5"
                    />
                    <span>GST Applicable</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.reconciliationRequired)}
                      onChange={(e) => handleFormChange("reconciliationRequired", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 h-3.5 w-3.5"
                    />
                    <span>Reconciliation</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.bankAccount)}
                      onChange={(e) => handleFormChange("bankAccount", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 h-3.5 w-3.5"
                    />
                    <span>Bank Account</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.partyLedger)}
                      onChange={(e) => handleFormChange("partyLedger", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 h-3.5 w-3.5"
                    />
                    <span>Party Ledger</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.cashLedger)}
                      onChange={(e) => handleFormChange("cashLedger", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 h-3.5 w-3.5"
                    />
                    <span>Cash Ledger</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.systemLedger)}
                      onChange={(e) => handleFormChange("systemLedger", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 h-3.5 w-3.5"
                    />
                    <span>System Ledger</span>
                  </label>
                </div>
              </div>

              {/* Opening Balance Summary Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                  <span>Opening Balance Summary</span>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">
                    {formData.openingType === "Dr" ? "DEBIT ACCOUNT" : "CREDIT ACCOUNT"}
                  </span>
                </h4>

                <div className="grid grid-cols-3 gap-3 text-center pt-1">
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Debit Total</span>
                    <span className="text-xs font-mono font-bold text-rose-700 mt-0.5 block">
                      {formatINR(formData.openingType === "Dr" ? formData.openingBalance || 0 : 0)} Dr
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Credit Total</span>
                    <span className="text-xs font-mono font-bold text-rose-700 mt-0.5 block">
                      {formatINR(formData.openingType === "Cr" ? formData.openingBalance || 0 : 0)} Cr
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-800 block uppercase">Difference</span>
                    <span className="text-xs font-mono font-extrabold text-emerald-900 mt-0.5 block">
                      0.00
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add New Group / Ledger Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Add New {modalType === "group" ? "Group Account" : "Ledger Account"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-slate-800 text-[11px] font-semibold">
              Parent Node: <strong className="text-emerald-900">{selectedNode.name}</strong> ({selectedNode.level})
            </div>

            <div className="space-y-3">
              <FormField label="Account Name" required>
                <TextInput
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  placeholder={`Type new ${modalType} name...`}
                />
              </FormField>

              <FormField label="Alias / Short Code">
                <TextInput
                  value={newNodeAlias}
                  onChange={(e) => setNewNodeAlias(e.target.value)}
                  placeholder="e.g. CA, BANK, CASH"
                />
              </FormField>

              <FormField label="System Code">
                <TextInput
                  value={newNodeCode}
                  onChange={(e) => setNewNodeCode(e.target.value)}
                  placeholder="Auto-generated if empty"
                />
              </FormField>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                size="sm"
                onClick={handleCreateNode}
                className="px-5 h-8 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
              >
                Save {modalType === "group" ? "Group" : "Ledger"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddModal(false)}
                className="px-4 h-8 text-xs font-semibold text-slate-600 bg-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
