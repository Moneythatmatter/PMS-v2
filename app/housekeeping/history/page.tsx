"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import {
  History,
  ShieldAlert,
  RefreshCw,
  AlertTriangle,
  Package,
  UserCheck,
  Download,
  Eye,
  Search,
  CheckCircle2,
  Lock,
  Terminal,
  Globe,
  FileText,
  User,
  Shield,
  Building,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import {
  TextInput,
  SelectInput,
  FormField,
  FOPageHeader,
  StatMiniCard,
} from "@/components/frontoffice/ui";
import { OperationsToolbar, OperationsFilterDrawer } from "@/components/housekeeping/OperationsToolbar";
import { ModuleSelectionBar } from "@/components/pms/ModuleSelectionBar";
import {
  INITIAL_HOUSEKEEPING_AUDIT_LOGS,
  HousekeepingAuditEntry,
} from "@/app/data/housekeepingAuditData";

export default function HistoryAuditLogsPage() {
  const { history, resetState } = useHousekeeping();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Datasets State
  const [auditLogs, setAuditLogs] = useState<HousekeepingAuditEntry[]>(
    INITIAL_HOUSEKEEPING_AUDIT_LOGS
  );

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [activeCategoryTab, setActiveCategoryTab] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [actionTypeFilter, setActionTypeFilter] = useState("all");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Selected Log Drawer State
  const [selectedLog, setSelectedLog] = useState<HousekeepingAuditEntry | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; variant: "success" | "info" } | null>(null);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Dynamic Summary KPIs
  const metrics = useMemo(() => {
    const totalEvents = auditLogs.length + (history?.length || 0);
    const overridesCount = auditLogs.filter((l) => l.actionType === "Overridden").length;
    const criticalCount = auditLogs.filter((l) => l.severity === "Critical").length;
    const warningCount = auditLogs.filter((l) => l.severity === "Warning").length;

    return {
      totalEvents,
      overridesCount,
      criticalCount,
      warningCount,
    };
  }, [auditLogs, history]);

  // Active Filter Count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeCategoryTab !== "all") count++;
    if (severityFilter !== "all") count++;
    if (actionTypeFilter !== "all") count++;
    return count;
  }, [activeCategoryTab, severityFilter, actionTypeFilter]);

  // Filtered Logs List
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchSearch =
        log.userName.toLowerCase().includes(search.toLowerCase()) ||
        log.auditCode.toLowerCase().includes(search.toLowerCase()) ||
        log.eventCode.toLowerCase().includes(search.toLowerCase()) ||
        log.targetEntity.toLowerCase().includes(search.toLowerCase()) ||
        log.remarks.toLowerCase().includes(search.toLowerCase()) ||
        (log.roomNumber && log.roomNumber.includes(search));

      const matchCategory =
        activeCategoryTab === "all" ||
        log.category.toLowerCase() === activeCategoryTab.toLowerCase();

      const matchSeverity =
        severityFilter === "all" ||
        log.severity.toLowerCase() === severityFilter.toLowerCase();

      const matchAction =
        actionTypeFilter === "all" ||
        log.actionType.toLowerCase() === actionTypeFilter.toLowerCase();

      return matchSearch && matchCategory && matchSeverity && matchAction;
    });
  }, [auditLogs, search, activeCategoryTab, severityFilter, actionTypeFilter]);

  // Severity Badge Component
  const renderSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return <span className="rounded-full bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 text-[9px] font-extrabold uppercase animate-pulse">Critical</span>;
      case "warning":
        return <span className="rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 text-[9px] font-extrabold uppercase">Warning</span>;
      default:
        return <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[9px] font-extrabold uppercase">Standard</span>;
    }
  };

  // Close Drawer Handler
  const handleCloseDrawer = () => {
    setSelectedLog(null);
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-5 select-none">
      {/* Toast Notification */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl p-3 text-xs font-bold shadow-xl animate-in fade-in slide-in-from-bottom-2",
            toast.variant === "success" ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <FOPageHeader
        eyebrow="Compliance & Governance"
        title="Operational Audit Trails & System Logs"
        description="Verifiable, immutable audit history recording all room status changes, inspection overrides, staff roster updates, inventory movements, and security actions."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setToast({ message: "Exporting System Audit Trail to CSV...", variant: "info" })}
              className="!bg-white hover:!bg-slate-100 !text-slate-700 !border-slate-200 flex items-center justify-center gap-1.5 rounded-xl h-8 px-3 text-xs font-bold shrink-0"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" /> Export Trail CSV
            </Button>

            <Button
              onClick={() => {
                if (confirm("Are you sure you want to reset all PMS housekeeping states?")) {
                  resetState();
                  setToast({ message: "PMS Housekeeping state has been reset to defaults.", variant: "info" });
                }
              }}
              className="!bg-red-50 hover:!bg-red-100 !text-red-700 !border-red-200 border flex items-center justify-center gap-1.5 rounded-xl h-8 px-3 text-xs font-bold shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Reset State
            </Button>
          </div>
        }
      />

      {/* 6 Top Metric KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatMiniCard label="Total Audit Events" value={`${metrics.totalEvents} Logged`} icon={History} accent="#10b981" />
        <StatMiniCard label="Security Overrides" value={`${metrics.overridesCount} Overrides`} icon={ShieldAlert} accent="#d97706" />
        <StatMiniCard label="Critical Events" value={`${metrics.criticalCount} Alerts`} icon={AlertTriangle} accent="#dc2626" />
        <StatMiniCard label="Warning Events" value={`${metrics.warningCount} Flags`} icon={Lock} accent="#9333ea" />
        <StatMiniCard label="Active Actors" value="12 Logged Users" icon={UserCheck} accent="#0284c7" />
        <StatMiniCard label="Audit Retention" value="90 Days Active" icon={FileText} accent="#0D9488" />
      </div>

      {/* Operations Toolbar with Category Tabs */}
      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search audit code, user name, room, action, or IP address…"
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setFilterDrawerOpen(true)}
        statusTabs={[
          { id: "all", label: "All Audit Logs" },
          { id: "Room Cleaning", label: "Room Cleaning" },
          { id: "Inspection", label: "Inspections" },
          { id: "Status Override", label: "Status Overrides" },
          { id: "Inventory", label: "Inventory" },
          { id: "Security", label: "Security & Masters" },
        ]}
        activeStatusTab={activeCategoryTab}
        onStatusTabChange={setActiveCategoryTab}
        selectionBar={
          <ModuleSelectionBar
            count={selectedIds.size}
            noun="log"
            onClear={() => setSelectedIds(new Set())}
            actions={[
              {
                label: "Full Log",
                icon: <Eye className="h-3.5 w-3.5" />,
                onClick: () => {
                  const first = filteredLogs.find((log) => selectedIds.has(log.id));
                  if (first) setSelectedLog(first);
                },
              },
            ]}
          />
        }
      />

      {/* Slide-over Filter Drawer */}
      <OperationsFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filter Audit Logs"
        activeFilterCount={activeFilterCount}
        onReset={() => {
          setSeverityFilter("all");
          setActionTypeFilter("all");
          setActiveCategoryTab("all");
        }}
      >
        <div className="space-y-4 select-none">
          <FormField label="Event Severity Level">
            <SelectInput
              value={severityFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSeverityFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Severities</option>
              <option value="standard">Standard Operations</option>
              <option value="warning">Warning Events</option>
              <option value="critical">Critical Security Alerts</option>
            </SelectInput>
          </FormField>

          <FormField label="Action Type">
            <SelectInput
              value={actionTypeFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setActionTypeFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Action Types</option>
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="overridden">Overridden</option>
              <option value="deactivated">Deactivated</option>
            </SelectInput>
          </FormField>
        </div>
      </OperationsFilterDrawer>

      {/* Main Audit Logs Table */}
      <div className="space-y-2">
        <div className="space-y-3 md:hidden">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className={cn(
                "rounded-xl border border-slate-200 bg-white p-4 shadow-2xs",
                selectedIds.has(log.id) && "border-emerald-300 bg-emerald-50/40",
              )}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(log.id)}
                  onChange={() => {
                    const next = new Set(selectedIds);
                    if (next.has(log.id)) next.delete(log.id);
                    else next.add(log.id);
                    setSelectedIds(next);
                  }}
                  className="mt-0.5 rounded border-slate-300"
                  aria-label={`Select ${log.auditCode}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] font-bold text-slate-700">{log.auditCode}</p>
                      <p className="font-extrabold text-slate-900 truncate">{log.userName}</p>
                      <p className="text-[10px] text-slate-400">{log.timestamp}</p>
                    </div>
                    {renderSeverityBadge(log.severity)}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-600">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-extrabold uppercase text-slate-700">
                      {log.actionType}
                    </span>{" "}
                    · {log.category} · {log.targetEntity}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                    <span className="line-through text-slate-400">{log.oldValue}</span>
                    {" → "}
                    <span className="font-bold text-slate-800">{log.newValue}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs scrollbar-thin md:block">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 z-10">
                <th className="w-10 px-3.5 py-3">
                  <input
                    type="checkbox"
                    checked={filteredLogs.length > 0 && filteredLogs.every((log) => selectedIds.has(log.id))}
                    onChange={() => {
                      const allIds = filteredLogs.map((log) => log.id);
                      const allSelected = allIds.every((id) => selectedIds.has(id));
                      setSelectedIds(allSelected ? new Set() : new Set(allIds));
                    }}
                    className="rounded border-slate-300"
                    aria-label="Select all"
                  />
                </th>
                <th className="px-3.5 py-3">Audit Code / Timestamp</th>
                <th className="px-3.5 py-3">Actor / User</th>
                <th className="px-3.5 py-3">Category</th>
                <th className="px-3.5 py-3">Action Type</th>
                <th className="px-3.5 py-3">Target Entity</th>
                <th className="px-3.5 py-3">State Change (Old ➔ New)</th>
                <th className="px-3.5 py-3">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className={cn(
                      "hover:bg-slate-50/60 transition-colors",
                      selectedIds.has(log.id) && "bg-emerald-50/40",
                    )}
                  >
                    <td className="px-3.5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(log.id)}
                        onChange={() => {
                          const next = new Set(selectedIds);
                          if (next.has(log.id)) next.delete(log.id);
                          else next.add(log.id);
                          setSelectedIds(next);
                        }}
                        className="rounded border-slate-300"
                        aria-label={`Select ${log.auditCode}`}
                      />
                    </td>
                    <td className="px-3.5 py-3">
                      <p className="font-mono font-bold text-slate-700">{log.auditCode}</p>
                      <p className="text-[10px] text-slate-400 font-normal">{log.timestamp}</p>
                    </td>
                    <td className="px-3.5 py-3">
                      <p className="font-extrabold text-slate-900 leading-tight">{log.userName}</p>
                      <p className="text-[10px] text-slate-400 font-normal">{log.userRole}</p>
                    </td>
                    <td className="px-3.5 py-3 text-slate-700 font-medium">{log.category}</td>
                    <td className="px-3.5 py-3">
                      <span className="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-[9px] font-extrabold uppercase">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 font-bold text-slate-800">{log.targetEntity}</td>
                    <td className="px-3.5 py-3 text-slate-600 font-normal max-w-xs truncate">
                      <span className="text-slate-400 line-through mr-1">{log.oldValue}</span> ➔{" "}
                      <span className="font-bold text-slate-800 ml-1">{log.newValue}</span>
                    </td>
                    <td className="px-3.5 py-3">{renderSeverityBadge(log.severity)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 font-medium">
                    No audit logs match your search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
          <span>Showing {filteredLogs.length} of {auditLogs.length} audit trail entries</span>
        </div>
      </div>

      {/* FULL AUDIT RECORD DETAILS DRAWER */}
      <Drawer
        open={!!selectedLog}
        onClose={handleCloseDrawer}
        title={selectedLog ? `Audit Event Record: ${selectedLog.auditCode}` : "Audit Event Record"}
        width="md"
      >
        {selectedLog && (
          <div className="space-y-4 select-none pb-6">
            {/* Header Badge Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-extrabold text-emerald-700">{selectedLog.auditCode}</span>
                {renderSeverityBadge(selectedLog.severity)}
              </div>
              <h3 className="text-base font-extrabold text-slate-900">{selectedLog.eventCode}</h3>
              <p className="text-xs text-slate-500 font-medium">Category: {selectedLog.category} · Timestamp: {selectedLog.timestamp}</p>
            </div>

            {/* Room & Operational Context Card */}
            {selectedLog.roomNumber && (
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Room & Operational Context</span>
                  {selectedLog.isVip && (
                    <span className="rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.2 text-[9px] font-extrabold uppercase">
                      ⭐ VIP Guest Room
                    </span>
                  )}
                </h4>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2 border-b border-emerald-100 pb-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Room Number</span>
                      <p className="text-sm font-extrabold text-slate-900">Room {selectedLog.roomNumber}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Floor Level</span>
                      <p className="text-sm font-extrabold text-slate-900">{selectedLog.floor || "Floor 3"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-b border-emerald-100 pb-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Occupancy Status</span>
                      <p className="font-bold text-slate-800">{selectedLog.occupancyStatus || "Occupied"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Current Room Status</span>
                      <p className="font-extrabold text-emerald-700">{selectedLog.currentRoomStatus || "Clean"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Assigned Housekeeper</span>
                      <p className="font-extrabold text-slate-900">{selectedLog.assignedHousekeeper || "Meena Kumari"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Assigned Supervisor</span>
                      <p className="font-extrabold text-slate-900">{selectedLog.assignedSupervisor || "Ramesh Kumar"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actor & Security Metadata */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Actor & Security Metadata</h4>
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">User Actor Name:</span>
                  <span className="font-extrabold text-slate-900">{selectedLog.userName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Assigned Role:</span>
                  <span className="font-bold text-slate-800">{selectedLog.userRole}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">User Email:</span>
                  <span className="font-bold text-slate-800">{selectedLog.userEmail}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">IP Address:</span>
                  <span className="font-mono font-bold text-slate-700">{selectedLog.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Terminal Device ID:</span>
                  <span className="font-mono font-bold text-slate-700">{selectedLog.terminalId}</span>
                </div>
              </div>
            </div>

            {/* State Change Comparison */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">State Change Comparison</h4>
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 text-xs">
                <div className="rounded-lg bg-red-50/50 border border-red-200 p-2.5">
                  <p className="text-[10px] font-bold text-red-700 uppercase">Original Value (Before)</p>
                  <p className="font-semibold text-red-950 mt-0.5">{selectedLog.oldValue}</p>
                </div>
                <div className="rounded-lg bg-emerald-50/50 border border-emerald-200 p-2.5">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">Modified Value (After)</p>
                  <p className="font-semibold text-emerald-950 mt-0.5">{selectedLog.newValue}</p>
                </div>
              </div>
            </div>

            {/* System Remarks */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">System Remarks</h4>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 font-medium">
                {selectedLog.remarks}
              </div>
            </div>

            {/* Close Button */}
            <Button
              type="button"
              onClick={handleCloseDrawer}
              className="w-full h-9 text-xs font-bold !bg-slate-900 hover:!bg-slate-800 text-white rounded-xl shadow-xs cursor-pointer transition-all"
            >
              Close Audit Record
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  );
}
