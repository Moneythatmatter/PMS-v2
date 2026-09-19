"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  FileText,
  CheckCircle2,
  XCircle,
  Edit2,
  AlertCircle,
  Wrench,
  HelpCircle,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer } from "@/components/ui";
import { cn } from "@/lib/utils";
import { MOCK_ROOT_CAUSES_MASTER, MOCK_ACTIVE_WORK_ORDERS } from "@/app/data/maintenance/mockData";
import { RootCauseMaster } from "@/app/data/maintenance/types";

export function MaintenanceRootCausesView() {
  const [rootCauses, setRootCauses] = useState<RootCauseMaster[]>(MOCK_ROOT_CAUSES_MASTER);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCause, setEditingCause] = useState<RootCauseMaster | null>(null);

  // Form State
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<"Active" | "Inactive">("Active");
  const [formError, setFormError] = useState<string | null>(null);

  // Calculate live usage count in Work Orders per Root Cause
  const causesWithCounts = useMemo(() => {
    return rootCauses.map((cause) => {
      const count = MOCK_ACTIVE_WORK_ORDERS.filter(
        (wo) => wo.rootCause && wo.rootCause.toLowerCase().includes(cause.rootCauseName.toLowerCase())
      ).length;
      return {
        ...cause,
        usedInWorkOrders: count > 0 ? count : cause.usedInWorkOrders || 0,
      };
    });
  }, [rootCauses]);

  // Filtered List
  const filteredCauses = useMemo(() => {
    return causesWithCounts.filter((cause) => {
      const matchesSearch =
        cause.rootCauseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cause.rootCauseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cause.description && cause.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus =
        selectedStatusFilter === "ALL" || cause.status.toUpperCase() === selectedStatusFilter.toUpperCase();
      return matchesSearch && matchesStatus;
    });
  }, [causesWithCounts, searchTerm, selectedStatusFilter]);

  const handleOpenAdd = () => {
    setEditingCause(null);
    setFormCode(`RC-${Math.floor(100 + Math.random() * 900)}`);
    setFormName("");
    setFormDescription("");
    setFormStatus("Active");
    setFormError(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (cause: RootCauseMaster) => {
    setEditingCause(cause);
    setFormCode(cause.rootCauseCode);
    setFormName(cause.rootCauseName);
    setFormDescription(cause.description || "");
    setFormStatus(cause.status);
    setFormError(null);
    setIsDrawerOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const nameTrimmed = formName.trim();
    const codeTrimmed = formCode.trim().toUpperCase();

    if (!nameTrimmed || !codeTrimmed) {
      setFormError("Root Cause Name and Code are required.");
      return;
    }

    // Check duplicate code or name
    const duplicateCode = rootCauses.find(
      (c) => c.rootCauseCode.toUpperCase() === codeTrimmed && c.id !== editingCause?.id
    );
    if (duplicateCode) {
      setFormError(`Root Cause Code "${codeTrimmed}" already exists.`);
      return;
    }

    const duplicateName = rootCauses.find(
      (c) => c.rootCauseName.toLowerCase() === nameTrimmed.toLowerCase() && c.id !== editingCause?.id
    );
    if (duplicateName) {
      setFormError(`Root Cause Name "${nameTrimmed}" already exists.`);
      return;
    }

    if (editingCause) {
      setRootCauses((prev) =>
        prev.map((c) =>
          c.id === editingCause.id
            ? {
                ...c,
                rootCauseCode: codeTrimmed,
                rootCauseName: nameTrimmed,
                description: formDescription.trim() || undefined,
                status: formStatus,
              }
            : c
        )
      );
      setToastMessage(`Root cause "${nameTrimmed}" updated successfully.`);
    } else {
      const newCause: RootCauseMaster = {
        id: `rc-${Date.now()}`,
        rootCauseCode: codeTrimmed,
        rootCauseName: nameTrimmed,
        description: formDescription.trim() || undefined,
        usedInWorkOrders: 0,
        status: formStatus,
      };
      setRootCauses((prev) => [newCause, ...prev]);
      setToastMessage(`Root cause "${nameTrimmed}" created successfully.`);
    }

    setIsDrawerOpen(false);
  };

  const handleToggleStatus = (cause: RootCauseMaster) => {
    const nextStatus = cause.status === "Active" ? "Inactive" : "Active";
    setRootCauses((prev) =>
      prev.map((c) => (c.id === cause.id ? { ...c, status: nextStatus } : c))
    );
    setToastMessage(`Root Cause "${cause.rootCauseName}" set to ${nextStatus}.`);
  };

  return (
    <ModulePageShell
      eyebrow="Maintenance / Masters"
      title="Root Causes"
      description="Defines standardized engineering defect reasons selected during Work Order investigation and completion."
      breadcrumbs={[
        { label: "Maintenance", href: "/maintenance" },
        { label: "Masters", href: "/maintenance/masters" },
        { label: "Root Causes" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <Button
          type="button"
          size="sm"
          onClick={handleOpenAdd}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 h-9 px-3.5"
        >
          <Plus className="h-4 w-4" /> Add Root Cause
        </Button>
      }
    >
      {/* Search & Filter Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 mb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by root cause code, name, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-slate-500">Status:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Master Data Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Root Cause Name</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCauses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <HelpCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm">No root causes found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try adjusting your search query or status filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCauses.map((cause) => (
                  <tr key={cause.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {cause.rootCauseCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{cause.rootCauseName}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {cause.description || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                          cause.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        {cause.status === "Active" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {cause.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(cause)}
                        className="h-8 rounded-lg text-xs font-semibold px-2.5 text-slate-700 hover:bg-slate-100"
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1 text-slate-500" /> Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(cause)}
                        className={cn(
                          "h-8 rounded-lg text-xs font-semibold px-2.5",
                          cause.status === "Active"
                            ? "text-rose-700 border-rose-200 hover:bg-rose-50"
                            : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        )}
                      >
                        {cause.status === "Active" ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingCause ? "Edit Root Cause" : "Add Root Cause"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs p-1">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Root Cause Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Normal Wear & Tear / Power Fluctuation"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full h-9 p-2 rounded-xl border border-slate-200 bg-white text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Root Cause Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. RC-WEAR"
              value={formCode}
              onChange={(e) => setFormCode(e.target.value)}
              className="w-full h-9 p-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Explain the technical scope of this root cause..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs leading-relaxed focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Status</label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as "Active" | "Inactive")}
              className="w-full h-9 p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:border-emerald-500 focus:outline-none"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDrawerOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs px-4"
            >
              {editingCause ? "Save Changes" : "Create Root Cause"}
            </Button>
          </div>
        </form>
      </Drawer>
    </ModulePageShell>
  );
}
