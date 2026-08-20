"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  History,
  ShieldAlert,
  AlertTriangle,
  UserCheck,
  Download,
  Eye,
  CheckCircle2,
  Lock,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { SelectInput, FormField, FOPageHeader, StatMiniCard } from "@/components/frontoffice/ui";
import { OperationsToolbar, OperationsFilterDrawer } from "@/components/housekeeping/OperationsToolbar";
import { ModuleSelectionBar } from "@/components/pms/ModuleSelectionBar";
import {
  INITIAL_HOUSEKEEPING_AUDIT_LOGS,
  type HousekeepingAuditEntry,
} from "@/app/data/housekeepingAuditData";
import { hkHistoryService } from "@/services/housekeeping";
import type { HKHistoryLog } from "@/components/housekeeping/HousekeepingTypes";

function mapHistoryLogToAuditEntry(log: HKHistoryLog, index: number): HousekeepingAuditEntry {
  return {
    id: log.id || `HK-${index}`,
    auditCode: log.id || `HK-${index}`,
    timestamp: log.timestamp,
    userName: log.user,
    userRole: "Staff",
    userEmail: `${String(log.user).toLowerCase().replace(/\s+/g, ".")}@hotel.local`,
    category:
      log.category === "Maintenance"
        ? "Maintenance"
        : log.category === "Laundry"
          ? "Inventory"
          : log.category === "Inventory"
            ? "Inventory"
            : String(log.category) === "Guest Services"
              ? "Room Cleaning"
              : "Room Cleaning",
    eventCode: log.action,
    actionType: "Updated",
    severity: "Standard",
    targetEntity: log.room ? `Room ${log.room}` : log.category,
    roomNumber: log.room,
    oldValue: "—",
    newValue: log.details,
    ipAddress: "—",
    terminalId: "—",
    remarks: log.details,
  };
}

export function AuditLogsView() {
  const [auditLogs, setAuditLogs] = useState<HousekeepingAuditEntry[]>(
    INITIAL_HOUSEKEEPING_AUDIT_LOGS,
  );
  const [search, setSearch] = useState("");
  const [activeCategoryTab, setActiveCategoryTab] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [actionTypeFilter, setActionTypeFilter] = useState("all");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedLog, setSelectedLog] = useState<HousekeepingAuditEntry | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "info" } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await hkHistoryService.list();
        if (cancelled || !Array.isArray(rows) || rows.length === 0) return;
        const mapped = rows.map(mapHistoryLogToAuditEntry);
        setAuditLogs((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const merged = [...mapped.filter((m) => !existingIds.has(m.id)), ...prev];
          return merged;
        });
      } catch {
        /* API optional — keep seed data */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const metrics = useMemo(() => {
    const overridesCount = auditLogs.filter((l) => l.actionType === "Overridden").length;
    const criticalCount = auditLogs.filter((l) => l.severity === "Critical").length;
    const warningCount = auditLogs.filter((l) => l.severity === "Warning").length;
    return {
      totalEvents: auditLogs.length,
      overridesCount,
      criticalCount,
      warningCount,
    };
  }, [auditLogs]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeCategoryTab !== "all") count++;
    if (severityFilter !== "all") count++;
    if (actionTypeFilter !== "all") count++;
    return count;
  }, [activeCategoryTab, severityFilter, actionTypeFilter]);

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

  const renderSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return (
          <span className="rounded-full bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 text-[9px] font-extrabold uppercase animate-pulse">
            Critical
          </span>
        );
      case "warning":
        return (
          <span className="rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 text-[9px] font-extrabold uppercase">
            Warning
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[9px] font-extrabold uppercase">
            Standard
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 select-none">
      {toast && (
        <div
          className={cn(
            "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl p-3 text-xs font-bold shadow-xl",
            toast.variant === "success" ? "bg-emerald-600 text-white" : "bg-blue-600 text-white",
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>{toast.message}</span>
        </div>
      )}

      <FOPageHeader
        eyebrow="System Settings · Compliance"
        title="Operational Audit Trails & System Logs"
        description="Verifiable audit history across Front Office, Housekeeping, F&B, and Stores — room status changes, overrides, inventory movements, and security actions."
        action={
          <Button
            variant="outline"
            onClick={() =>
              setToast({ message: "Exporting system audit trail to CSV...", variant: "info" })
            }
            className="!bg-white hover:!bg-slate-100 !text-slate-700 !border-slate-200 flex items-center gap-1.5 rounded-xl h-8 px-3 text-xs font-bold"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" /> Export Trail CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatMiniCard label="Total Audit Events" value={`${metrics.totalEvents} Logged`} icon={History} accent="#10b981" />
        <StatMiniCard label="Security Overrides" value={`${metrics.overridesCount} Overrides`} icon={ShieldAlert} accent="#d97706" />
        <StatMiniCard label="Critical Events" value={`${metrics.criticalCount} Alerts`} icon={AlertTriangle} accent="#dc2626" />
        <StatMiniCard label="Warning Events" value={`${metrics.warningCount} Flags`} icon={Lock} accent="#9333ea" />
        <StatMiniCard label="Active Actors" value="12 Logged Users" icon={UserCheck} accent="#0284c7" />
        <StatMiniCard label="Audit Retention" value="90 Days Active" icon={FileText} accent="#0D9488" />
      </div>

      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search audit code, user name, room, action, or remarks…"
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
        <div className="space-y-4">
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

      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs md:block">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
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
              <th className="px-3.5 py-3">Details</th>
              <th className="px-3.5 py-3">Severity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className={cn(
                    "hover:bg-slate-50/60 transition-colors cursor-pointer",
                    selectedIds.has(log.id) && "bg-emerald-50/40",
                  )}
                  onClick={() => setSelectedLog(log)}
                >
                  <td className="px-3.5 py-3" onClick={(e) => e.stopPropagation()}>
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
                    />
                  </td>
                  <td className="px-3.5 py-3">
                    <p className="font-mono font-bold text-slate-700">{log.auditCode}</p>
                    <p className="text-[10px] text-slate-400 font-normal">{log.timestamp}</p>
                  </td>
                  <td className="px-3.5 py-3">
                    <p className="font-extrabold text-slate-900">{log.userName}</p>
                    <p className="text-[10px] text-slate-400 font-normal">{log.userRole}</p>
                  </td>
                  <td className="px-3.5 py-3">{log.category}</td>
                  <td className="px-3.5 py-3">
                    <span className="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-[9px] font-extrabold uppercase">
                      {log.actionType}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 font-bold text-slate-800">{log.targetEntity}</td>
                  <td className="px-3.5 py-3 text-slate-600 font-normal max-w-xs truncate">{log.remarks}</td>
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

      <Drawer
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={selectedLog ? `Audit Event: ${selectedLog.auditCode}` : "Audit Event"}
        width="md"
      >
        {selectedLog && (
          <div className="space-y-4 pb-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-extrabold text-emerald-700">{selectedLog.auditCode}</span>
                {renderSeverityBadge(selectedLog.severity)}
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mt-1">{selectedLog.eventCode}</h3>
              <p className="text-xs text-slate-500">{selectedLog.category} · {selectedLog.timestamp}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs space-y-1.5">
              <div className="flex justify-between"><span className="text-slate-500">User</span><span className="font-bold">{selectedLog.userName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Target</span><span className="font-bold">{selectedLog.targetEntity}</span></div>
              {selectedLog.roomNumber && (
                <div className="flex justify-between"><span className="text-slate-500">Room</span><span className="font-bold">{selectedLog.roomNumber}</span></div>
              )}
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">{selectedLog.remarks}</div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
