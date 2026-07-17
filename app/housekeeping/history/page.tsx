"use client";

import React, { useState, useMemo } from "react";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import { History, Trash2, Calendar, User, Search, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { TextInput, SelectInput } from "@/components/frontoffice/ui";

export default function HistoryAuditLogs() {
  const { history, resetState } = useHousekeeping();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const filteredHistory = useMemo(() => {
    return history.filter((log) => {
      const matchSearch =
        log.user.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        (log.room && log.room.includes(search)) ||
        log.details.toLowerCase().includes(search.toLowerCase());

      const matchCategory = filterCategory === "all" || log.category === filterCategory;

      return matchSearch && matchCategory;
    });
  }, [history, search, filterCategory]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Audit Logs</span>
          <h1 className="mt-1 text-2xl font-bold text-slate-800">Operational Audit Trails</h1>
          <p className="text-sm text-slate-500 font-normal">
            Verifiable history logs recording all housekeeping check-offs, status overrides, and staff allocations.
          </p>
        </div>
        <Button
          onClick={() => {
            if (confirm("Are you sure you want to reset all PMS housekeeping states?")) {
              resetState();
            }
          }}
          className="bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 px-3 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4" /> Reset PMS State
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <TextInput
            placeholder="Search action details, user initials, or room number…"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-full pl-3"
          />
        </div>
        <div className="flex gap-3">
          <SelectInput
            value={filterCategory}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="Cleaning">Room Cleaning</option>
            <option value="Room Status">Room Statuses</option>
            <option value="Inspection">Quality Checks</option>
            <option value="Laundry">Laundry Jobs</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Lost & Found">Lost & Found</option>
            <option value="Inventory">Inventory stock</option>
          </SelectInput>
        </div>
      </div>

      {/* History log rows list */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3">Timestamp</th>
              <th className="px-5 py-3">Actor / User</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Action Description</th>
              <th className="px-5 py-3">Details Summary</th>
              <th className="px-5 py-3">Room</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredHistory.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/50">
                <td className="px-5 py-4 text-slate-400 font-medium whitespace-nowrap">{log.timestamp}</td>
                <td className="px-5 py-4 text-slate-700 font-bold whitespace-nowrap flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400 shrink-0" /> {log.user}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                      log.category === "Cleaning"
                        ? "bg-amber-50 text-amber-700"
                        : log.category === "Inspection"
                        ? "bg-blue-50 text-blue-700"
                        : log.category === "Inventory"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-700"
                    )}
                  >
                    {log.category}
                  </span>
                </td>
                <td className="px-5 py-4 font-bold text-slate-800">{log.action}</td>
                <td className="px-5 py-4 text-slate-500 font-medium max-w-md break-words">{log.details}</td>
                <td className="px-5 py-4 font-semibold text-slate-600">{log.room || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
