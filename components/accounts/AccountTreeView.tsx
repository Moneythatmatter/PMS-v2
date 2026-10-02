"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Folder,
  FolderOpen,
  FileText,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  Layers,
  Lock,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AccountTreeNode } from "@/services/accounts";
import { cn } from "@/lib/utils";

export interface AccountTreeViewProps {
  treeData: AccountTreeNode[];
  selectedNodeId: string;
  onSelectNode: (node: AccountTreeNode) => void;
  expandedNodes: Set<string>;
  onToggleExpand: (id: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onCreateAccountClick?: () => void;
  /** Shows an "open ledger" icon on each row. */
  onOpenLedger?: (node: AccountTreeNode) => void;
  className?: string;
}

export function AccountTreeView({
  treeData,
  selectedNodeId,
  onSelectNode,
  expandedNodes,
  onToggleExpand,
  onExpandAll,
  onCollapseAll,
  onCreateAccountClick,
  onOpenLedger,
  className,
}: AccountTreeViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterInactive, setFilterInactive] = useState(false);

  // Recursive Tree Node Renderer
  const TreeNode = ({ node, level = 0 }: { node: AccountTreeNode; level?: number }) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNodeId === node.id;
    const hasChildren = node.children && node.children.length > 0;

    // Filter Inactive
    if (filterInactive && node.status === "Inactive") return null;

    // Search filter check
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesSelf =
        node.name.toLowerCase().includes(q) ||
        node.code.toLowerCase().includes(q) ||
        node.category.toLowerCase().includes(q);

      let matchesChild = false;
      if (node.children) {
        const checkChildren = (children: AccountTreeNode[]): boolean => {
          return children.some(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              c.code.toLowerCase().includes(q) ||
              c.category.toLowerCase().includes(q) ||
              (c.children && checkChildren(c.children))
          );
        };
        matchesChild = checkChildren(node.children);
      }
      if (!matchesSelf && !matchesChild) return null;
    }

    const handleRowClick = () => {
      onSelectNode(node);
      if (node.accountType === "Group") {
        onToggleExpand(node.id);
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
            node.status === "Inactive" && "opacity-60 italic"
          )}
        >
          {/* Chevron Expand/Collapse */}
          {node.accountType === "Group" ? (
            <span
              className="p-0.5 rounded shrink-0 hover:bg-black/10 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(node.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    isSelected ? "text-white" : "text-slate-500"
                  )}
                />
              ) : (
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    isSelected ? "text-white" : "text-slate-500"
                  )}
                />
              )}
            </span>
          ) : (
            <span className="w-3.5 shrink-0" />
          )}

          {/* Icon */}
          {node.accountType === "Group" ? (
            isExpanded ? (
              <FolderOpen
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isSelected ? "text-amber-200" : "text-amber-600"
                )}
              />
            ) : (
              <Folder
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isSelected ? "text-amber-200" : "text-amber-600"
                )}
              />
            )
          ) : (
            <FileText
              className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                isSelected ? "text-emerald-200" : "text-slate-500"
              )}
            />
          )}

          {/* Account Code Badge */}
          <span
            className={cn(
              "font-mono text-[10px] px-1.5 py-0.2 rounded font-bold shrink-0",
              isSelected
                ? "bg-emerald-800 text-emerald-100"
                : "bg-slate-100 text-slate-600 border border-slate-200"
            )}
          >
            {node.code}
          </span>

          {/* Account Name */}
          <span className="truncate flex-1 font-semibold tracking-tight text-xs">
            {node.name}
          </span>

          {/* System Lock Badge */}
          {node.isSystemAccount && (
            <span title="System Account (Protected)">
              <Lock
                className={cn(
                  "h-3 w-3 shrink-0",
                  isSelected ? "text-amber-200" : "text-amber-600"
                )}
              />
            </span>
          )}

          {/* Inactive Tag */}
          {node.status === "Inactive" && (
            <span
              className={cn(
                "text-[9px] px-1 py-0.2 rounded font-mono font-bold uppercase shrink-0",
                isSelected ? "bg-emerald-800 text-emerald-100" : "bg-slate-200 text-slate-600"
              )}
            >
              OFF
            </span>
          )}

          {onOpenLedger && (
            <button
              type="button"
              title={`Open ${node.accountType === "Group" ? "group" : "ledger"} transactions`}
              onClick={(e) => {
                e.stopPropagation();
                onOpenLedger(node);
              }}
              className={cn(
                "shrink-0 rounded-md p-0.5 transition-opacity",
                isSelected
                  ? "text-emerald-100 hover:bg-emerald-800"
                  : "text-slate-400 opacity-0 hover:bg-slate-200 hover:text-emerald-700 group-hover:opacity-100 focus:opacity-100",
              )}
            >
              <BookOpen className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Children Render */}
        {node.accountType === "Group" && hasChildren && (
          <div
            className={cn(
              "grid transition-all duration-200 ease-in-out",
              isExpanded
                ? "grid-rows-[1fr] opacity-100 mt-0.5"
                : "grid-rows-[0fr] opacity-0 overflow-hidden"
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
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col min-h-[620px]",
        className
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <Layers className="h-4.5 w-4.5 text-emerald-700" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Chart of Accounts Hierarchy
          </h3>
        </div>
        {onCreateAccountClick && (
          <Button
            type="button"
            size="sm"
            onClick={onCreateAccountClick}
            className="h-7 px-2.5 rounded-lg text-[11px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            New
          </Button>
        )}
      </div>

      {/* Search and Action Bar */}
      <div className="space-y-2 mb-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search account name or code..."
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

        <div className="flex items-center justify-between gap-2 text-[11px]">
          <label className="flex items-center gap-1.5 font-semibold text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filterInactive}
              onChange={(e) => setFilterInactive(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span>Filter Inactive</span>
          </label>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onExpandAll}
              className="px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              Expand All
            </button>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={onCollapseAll}
              className="px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Tree Content Container */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-0.5 max-h-[640px]">
        {treeData.length === 0 ? (
          <p className="py-8 text-center text-xs font-medium text-slate-500">
            No accounts found. Use &quot;New&quot; to create the first account group.
          </p>
        ) : (
          treeData.map((rootNode) => <TreeNode key={rootNode.id} node={rootNode} />)
        )}
      </div>
    </div>
  );
}
