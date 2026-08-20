"use client";

import React, { useState, useMemo } from "react";
import {
  Wrench,
  RotateCcw,
  ShieldCheck,
  Database,
  FileCheck2,
  Lock,
  Trash2,
  Upload,
  Download,
  Printer,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
  Clock,
  Play,
  X,
  Layers,
  SlidersHorizontal,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  SelectInput,
  StatMiniCard,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  sampleAccountingToolsData,
  AccountingUtilityTool,
} from "@/app/data/accounts/toolsData";
import { cn } from "@/lib/utils";

export function AccountsToolsView() {
  // Tools List State
  const [toolsList, setToolsList] = useState<AccountingUtilityTool[]>(
    sampleAccountingToolsData
  );

  // Category Filter State
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Search Query State
  const [searchQuery, setSearchQuery] = useState("");

  // Execution Modal State
  const [runningTool, setRunningTool] = useState<AccountingUtilityTool | null>(
    null
  );
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filtered Tools
  const filteredTools = useMemo(() => {
    return toolsList.filter((tool) => {
      if (selectedCategory !== "All" && tool.category !== selectedCategory) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          tool.title.toLowerCase().includes(q) ||
          tool.code.toLowerCase().includes(q) ||
          tool.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [toolsList, selectedCategory, searchQuery]);

  // Execute Utility Action Handler
  const handleStartUtility = (tool: AccountingUtilityTool) => {
    setRunningTool(tool);
    setIsExecuting(true);
    setExecutionLogs([
      `Initializing utility ${tool.code}: ${tool.title}...`,
      `Connecting to Accounting Database Engine...`,
      `Validating ledger tables and audit schemas...`,
    ]);

    setTimeout(() => {
      setExecutionLogs((prev) => [
        ...prev,
        `Processing database records...`,
        `Verification completed cleanly with 0 parity errors!`,
        `Utility execution finished successfully in ${tool.estimatedTime}.`,
      ]);
      setIsExecuting(false);

      // Update Last Run Date
      setToolsList((prev) =>
        prev.map((t) =>
          t.id === tool.id
            ? {
                ...t,
                lastRunDate: new Date().toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                lastRunBy: "Jay Admin",
              }
            : t
        )
      );

      setToastMessage(`Utility ${tool.title} executed successfully!`);
    }, 1500);
  };

  // Export Diagnostics Action
  const handleExportDiagnostics = () => {
    const jsonStr = JSON.stringify(toolsList, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Accounts_Tools_Diagnostics_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage("Exported Accounting Tools diagnostics JSON.");
  };

  return (
    <ModulePageShell
      eyebrow="Accounts"
      title="Tools & System Utilities"
      description="System maintenance tools, GL ledger re-indexing, voucher re-numbering, data integrity verification, and bulk master imports."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Tools" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => handleStartUtility(toolsList[0])}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <Wrench className="h-3.5 w-3.5 mr-1" />
            Run Utility
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setToastMessage("Saved utility execution log.")}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Save Log
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Print
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportDiagnostics}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export Diagnostics
          </Button>
        </div>
      }
    >


      {/* Utility Tool Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-emerald-600" />
            System Utilities Catalog ({filteredTools.length} Tools)
          </h3>

          <div className="relative w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search utility by name or code..."
              className="h-8 w-full rounded-xl border border-slate-300 bg-white pl-3 pr-3 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3 hover:border-slate-300 transition-all"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {tool.code}
                  </span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                      tool.category === "Maintenance"
                        ? "bg-purple-50 text-purple-800 border-purple-200"
                        : tool.category === "Audit"
                        ? "bg-blue-50 text-blue-800 border-blue-200"
                        : tool.category === "Security"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-emerald-50 text-emerald-800 border-emerald-200"
                    )}
                  >
                    {tool.category}
                  </span>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {tool.status}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-900">{tool.title}</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{tool.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <div>
                  Last Run: <strong className="text-slate-800">{tool.lastRunDate}</strong> ({tool.lastRunBy})
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleStartUtility(tool)}
                  className="h-8 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-2xs cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 mr-1 fill-current" />
                  Run Utility Now
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Execution Modal */}
      {runningTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 space-y-4 font-sans text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="font-mono text-xs text-slate-500 font-bold">
                  Executing Utility Tool • {runningTool.code}
                </span>
                <h3 className="font-bold text-base text-slate-900">{runningTool.title}</h3>
              </div>
              {!isExecuting && (
                <button
                  onClick={() => setRunningTool(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Progress Bar Indicator */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-mono text-[11px] text-slate-600 font-bold">
                <span>{isExecuting ? "Processing Records..." : "Execution Finished"}</span>
                <span>{isExecuting ? "60%" : "100% Completed"}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500 rounded-full",
                    isExecuting ? "bg-amber-500 w-3/5 animate-pulse" : "bg-emerald-600 w-full"
                  )}
                />
              </div>
            </div>

            {/* Live Execution Logs Stream */}
            <div className="p-3.5 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] space-y-1 max-h-48 overflow-y-auto shadow-inner">
              {executionLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-slate-500 shrink-0">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>

            {!isExecuting && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  Utility finished with zero errors. All database ledgers & balances are fully synchronized!
                </span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                disabled={isExecuting}
                onClick={() => setRunningTool(null)}
                className="rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer px-5"
              >
                {isExecuting ? "Executing..." : "Close Dialog"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ModulePageShell>
  );
}
