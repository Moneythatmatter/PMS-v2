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
  Eye,
  ChevronRight,
  Boxes,
  Tag,
  Wrench,
  Loader2,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer } from "@/components/ui";
import { cn } from "@/lib/utils";
import { AssetCategoryMaster } from "@/app/data/maintenance/types";
import { usePsList } from "@/hooks/usePsResource";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { mntAssetCategoryService, mntAssetService } from "@/services/maintenance/index";

export function MaintenanceAssetCategoriesView() {
  const { data: categories, loading, reload } = usePsList(() => mntAssetCategoryService.list(), []);
  const { data: assets } = usePsList(() => mntAssetService.list(), []);
  const { saving, runLocked } = useSubmitLock();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");

  // Drawer states
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState<AssetCategoryMaster | null>(null);

  // Form State
  const [formCategoryCode, setFormCategoryCode] = useState("");
  const [formCategoryName, setFormCategoryName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<"Active" | "Inactive">("Active");

  // Calculate live asset counts per category
  const categoriesWithAssetCounts = useMemo(() => {
    return categories.map((cat) => {
      const count = assets.filter(
        (ast) => ast.category.toLowerCase() === cat.categoryName.toLowerCase()
      ).length;
      return {
        ...cat,
        assetCount: count > 0 ? count : cat.assetCount || 0,
      };
    });
  }, [categories, assets]);

  // Filtered list
  const filteredCategories = useMemo(() => {
    return categoriesWithAssetCounts.filter((cat) => {
      const matchesSearch =
        cat.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.categoryCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = selectedStatusFilter === "ALL" || cat.status === selectedStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [categoriesWithAssetCounts, searchTerm, selectedStatusFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = categoriesWithAssetCounts.length;
    const active = categoriesWithAssetCounts.filter((c) => c.status === "Active").length;
    const totalAssets = categoriesWithAssetCounts.reduce((acc, c) => acc + (c.assetCount || 0), 0);
    return { total, active, totalAssets };
  }, [categoriesWithAssetCounts]);

  const handleOpenAddDrawer = () => {
    const nextCode = `CAT-00${categories.length + 1}`;
    setFormCategoryCode(nextCode);
    setFormCategoryName("");
    setFormDescription("");
    setFormStatus("Active");
    setIsAddDrawerOpen(true);
  };

  const handleOpenEditDrawer = (cat: AssetCategoryMaster) => {
    setSelectedCategoryForEdit(cat);
    setFormCategoryCode(cat.categoryCode);
    setFormCategoryName(cat.categoryName);
    setFormDescription(cat.description || "");
    setFormStatus(cat.status);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCategoryName.trim() || !formCategoryCode.trim() || saving) return;

    const body = {
      categoryCode: formCategoryCode.trim().toUpperCase(),
      categoryName: formCategoryName.trim(),
      description: formDescription.trim(),
      status: formStatus,
    };

    await runLocked(async () => {
      try {
        if (selectedCategoryForEdit) {
          await mntAssetCategoryService.update(selectedCategoryForEdit.id, body);
          setSelectedCategoryForEdit(null);
        } else {
          await mntAssetCategoryService.create({ ...body, assetCount: 0 });
          setIsAddDrawerOpen(false);
        }
        await reload();
      } catch (err) {
        console.error(err);
        alert(err instanceof Error ? err.message : "Failed to save category.");
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 text-sm text-slate-600">Loading asset categories...</div>
    );
  }

  return (
    <ModulePageShell
      eyebrow="Maintenance & Engineering"
      title="Asset Categories Master"
      description="Classification master for hotel equipment, machinery, plumbing, and electrical systems."
      breadcrumbs={[
        { label: "Maintenance", href: "/maintenance/dashboard" },
        { label: "Masters", href: "/maintenance/masters" },
        { label: "Asset Categories" },
      ]}
      primaryAction={{
        label: "New Category",
        onClick: handleOpenAddDrawer,
      }}
    >
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Categories</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Categories</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Linked Assets</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{stats.totalAssets}</div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Boxes className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter & Action Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search category code, title, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Status:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-md px-2.5 py-2 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Category Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No asset categories found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-medium text-slate-900">{cat.categoryCode}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{cat.categoryName}</td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">{cat.description || "—"}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                          cat.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        {cat.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditDrawer(cat)}
                        className="text-slate-600 hover:text-slate-900 h-8 px-2"
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer: Add Category */}
      <Drawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        title="Create Asset Category"
        maxWidth="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4 p-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Category Code *
            </label>
            <input
              type="text"
              required
              value={formCategoryCode}
              onChange={(e) => setFormCategoryCode(e.target.value)}
              placeholder="e.g. CAT-HVAC"
              className="w-full text-xs border border-slate-200 rounded-md p-2 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={formCategoryName}
              onChange={(e) => setFormCategoryName(e.target.value)}
              placeholder="e.g. HVAC / Air Conditioning"
              className="w-full text-xs border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Describe equipment type, coverage, and specifications..."
              className="w-full text-xs border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as "Active" | "Inactive")}
              className="w-full text-xs border border-slate-200 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => setIsAddDrawerOpen(false)} className="disabled:opacity-50">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving} className="bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 inline-flex items-center gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {saving ? "Saving..." : "Save Category"}
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Drawer: Edit Category */}
      <Drawer
        isOpen={!!selectedCategoryForEdit}
        onClose={() => setSelectedCategoryForEdit(null)}
        title={`Edit Category: ${selectedCategoryForEdit?.categoryCode || ""}`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4 p-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Category Code *
            </label>
            <input
              type="text"
              required
              value={formCategoryCode}
              onChange={(e) => setFormCategoryCode(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-md p-2 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={formCategoryName}
              onChange={(e) => setFormCategoryName(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as "Active" | "Inactive")}
              className="w-full text-xs border border-slate-200 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => setSelectedCategoryForEdit(null)} className="disabled:opacity-50">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving} className="bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 inline-flex items-center gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {saving ? "Saving..." : "Update Category"}
            </Button>
          </div>
        </form>
      </Drawer>
    </ModulePageShell>
  );
}
