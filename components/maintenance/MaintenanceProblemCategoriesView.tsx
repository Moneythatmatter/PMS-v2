"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Layers,
  Search,
  Plus,
  X,
  FileText,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Edit2,
  AlertCircle,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer } from "@/components/ui";
import { cn } from "@/lib/utils";
import { MOCK_PROBLEM_CATEGORIES, MOCK_MAINTENANCE_REQUESTS } from "@/app/data/maintenance/mockData";
import { ProblemCategoryMaster } from "@/app/data/maintenance/types";

export function MaintenanceProblemCategoriesView() {
  const [categories, setCategories] = useState<ProblemCategoryMaster[]>(MOCK_PROBLEM_CATEGORIES);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProblemCategoryMaster | null>(null);

  // Form State
  const [formCategoryCode, setFormCategoryCode] = useState("");
  const [formCategoryName, setFormCategoryName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<"Active" | "Inactive">("Active");
  const [formError, setFormError] = useState<string | null>(null);

  // Calculate live request counts per category
  const categoriesWithCounts = useMemo(() => {
    return categories.map((cat) => {
      const count = MOCK_MAINTENANCE_REQUESTS.filter(
        (req) => req.category.toLowerCase().includes(cat.categoryName.toLowerCase()) ||
                 cat.categoryName.toLowerCase().includes(req.category.toLowerCase())
      ).length;
      return {
        ...cat,
        requestCount: count > 0 ? count : cat.requestCount || 0,
      };
    });
  }, [categories]);

  // Filtered List
  const filteredCategories = useMemo(() => {
    return categoriesWithCounts.filter((cat) => {
      const matchesSearch =
        cat.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.categoryCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus =
        selectedStatusFilter === "ALL" || cat.status.toUpperCase() === selectedStatusFilter.toUpperCase();
      return matchesSearch && matchesStatus;
    });
  }, [categoriesWithCounts, searchTerm, selectedStatusFilter]);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormCategoryCode(`PROB-${Math.floor(100 + Math.random() * 900)}`);
    setFormCategoryName("");
    setFormDescription("");
    setFormStatus("Active");
    setFormError(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (cat: ProblemCategoryMaster) => {
    setEditingCategory(cat);
    setFormCategoryCode(cat.categoryCode);
    setFormCategoryName(cat.categoryName);
    setFormDescription(cat.description || "");
    setFormStatus(cat.status);
    setFormError(null);
    setIsDrawerOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const nameTrimmed = formCategoryName.trim();
    const codeTrimmed = formCategoryCode.trim().toUpperCase();

    if (!nameTrimmed || !codeTrimmed) {
      setFormError("Category Name and Code are required.");
      return;
    }

    // Check duplicate code or name (ignoring self if editing)
    const duplicateCode = categories.find(
      (c) => c.categoryCode.toUpperCase() === codeTrimmed && c.id !== editingCategory?.id
    );
    if (duplicateCode) {
      setFormError(`Category Code "${codeTrimmed}" already exists.`);
      return;
    }

    const duplicateName = categories.find(
      (c) => c.categoryName.toLowerCase() === nameTrimmed.toLowerCase() && c.id !== editingCategory?.id
    );
    if (duplicateName) {
      setFormError(`Category Name "${nameTrimmed}" already exists.`);
      return;
    }

    if (editingCategory) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCategory.id
            ? {
                ...c,
                categoryCode: codeTrimmed,
                categoryName: nameTrimmed,
                description: formDescription.trim() || undefined,
                status: formStatus,
              }
            : c
        )
      );
      setToastMessage(`Problem category "${nameTrimmed}" updated successfully.`);
    } else {
      const newCat: ProblemCategoryMaster = {
        id: `prob-${Date.now()}`,
        categoryCode: codeTrimmed,
        categoryName: nameTrimmed,
        description: formDescription.trim() || undefined,
        requestCount: 0,
        status: formStatus,
      };
      setCategories((prev) => [newCat, ...prev]);
      setToastMessage(`Problem category "${nameTrimmed}" created successfully.`);
    }

    setIsDrawerOpen(false);
  };

  const handleToggleStatus = (cat: ProblemCategoryMaster) => {
    const nextStatus = cat.status === "Active" ? "Inactive" : "Active";
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, status: nextStatus } : c))
    );
    setToastMessage(`Category "${cat.categoryName}" set to ${nextStatus}.`);
  };

  return (
    <ModulePageShell
      eyebrow="Maintenance / Masters"
      title="Problem Categories"
      description="Defines standardized maintenance problem and defect categories used when creating Maintenance Requests."
      breadcrumbs={[
        { label: "Maintenance", href: "/maintenance" },
        { label: "Masters", href: "/maintenance/masters" },
        { label: "Problem Categories" },
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
          <Plus className="h-4 w-4" /> Add Problem Category
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
              placeholder="Search by category code, name, or description..."
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
                <th className="py-3 px-4">Problem Category Name</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <Layers className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm">No problem categories found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try adjusting your search query or status filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {cat.categoryCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{cat.categoryName}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {cat.description || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                          cat.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        {cat.status === "Active" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {cat.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(cat)}
                        className="h-8 rounded-lg text-xs font-semibold px-2.5 text-slate-700 hover:bg-slate-100"
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1 text-slate-500" /> Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(cat)}
                        className={cn(
                          "h-8 rounded-lg text-xs font-semibold px-2.5",
                          cat.status === "Active"
                            ? "text-rose-700 border-rose-200 hover:bg-rose-50"
                            : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        )}
                      >
                        {cat.status === "Active" ? "Deactivate" : "Activate"}
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
        title={editingCategory ? "Edit Problem Category" : "Add Problem Category"}
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
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Cooling Issue / Water Leakage"
              value={formCategoryName}
              onChange={(e) => setFormCategoryName(e.target.value)}
              className="w-full h-9 p-2 rounded-xl border border-slate-200 bg-white text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Category Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. PROB-HVAC"
              value={formCategoryCode}
              onChange={(e) => setFormCategoryCode(e.target.value)}
              className="w-full h-9 p-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Describe what type of maintenance issues this category covers..."
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
              {editingCategory ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </form>
      </Drawer>
    </ModulePageShell>
  );
}
