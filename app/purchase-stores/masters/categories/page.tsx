"use client";

import React, { useState, useMemo } from "react";
import { Layers, CheckCircle2, XCircle, Plus, Download, Search, RotateCcw, Package } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FOPageHeader, StatMiniCard, ConfirmModal, AlertBanner, SelectInput } from "@/components/frontoffice/ui";
import { INITIAL_CATEGORIES_DATA, DEPARTMENT_OPTIONS, type CategoryItem } from "@/app/data/purchaseStoresMastersData";
import { CategoryTable } from "@/components/purchase-stores/masters/categories/CategoryTable";
import { CategoryDrawer } from "@/components/purchase-stores/masters/categories/CategoryDrawer";

export default function CategoryMasterPage() {
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES_DATA);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);

  const [toastMessage, setToastMessage] = useState<{
    text: string;
    variant: "success" | "info" | "error";
  } | null>(null);

  const showToast = (text: string, variant: "success" | "info" | "error" = "success") => {
    setToastMessage({ text, variant });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.categoryName.toLowerCase().includes(q) ||
        c.categoryCode.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q);

      const matchesDept = selectedDepartment === "all" || c.department === selectedDepartment;
      const matchesStatus = selectedStatus === "all" || c.status === selectedStatus;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [categories, searchQuery, selectedDepartment, selectedStatus]);

  const stats = useMemo(() => {
    const total = categories.length;
    const active = categories.filter((c) => c.status === "Active").length;
    const inactive = categories.filter((c) => c.status === "Inactive").length;
    const totalProducts = categories.reduce((acc, c) => acc + c.productCount, 0);
    return { total, active, inactive, totalProducts };
  }, [categories]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedDepartment("all");
    setSelectedStatus("all");
  };

  const handleOpenAddDrawer = () => {
    setEditingCategory(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (category: CategoryItem) => {
    setEditingCategory(category);
    setIsDrawerOpen(true);
  };

  const handleSaveCategory = (category: CategoryItem) => {
    if (editingCategory) {
      setCategories((prev) => prev.map((c) => (c.id === category.id ? category : c)));
      showToast(`Category "${category.categoryName}" updated successfully.`);
    } else {
      setCategories((prev) => [category, ...prev]);
      showToast(`Category "${category.categoryName}" created successfully.`);
    }
  };

  const confirmDeleteCategory = () => {
    if (!deletingCategory) return;
    const name = deletingCategory.categoryName;
    setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
    setDeletingCategory(null);
    showToast(`Category "${name}" deleted from master registry.`, "error");
  };

  const handleExportCSV = () => {
    const headers = ["Category Code", "Category Name", "Department", "Default Tax %", "Product Count", "Description", "Status", "Created Date"];
    const rows = filteredCategories.map((c) => [
      `"${c.categoryCode}"`,
      `"${c.categoryName}"`,
      `"${c.department}"`,
      c.defaultTaxRate,
      c.productCount,
      `"${c.description || ""}"`,
      `"${c.status}"`,
      `"${c.createdDate}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Category_Master_Export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filteredCategories.length} category records to CSV.`, "info");
  };

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/50 p-4 sm:p-6 md:p-8">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-md animate-in fade-in slide-in-from-top-3">
          <AlertBanner variant={toastMessage.variant} message={toastMessage.text} onDismiss={() => setToastMessage(null)} />
        </div>
      )}

      <FOPageHeader
        eyebrow="Purchase & Stores · Master Registry"
        title="Category Master"
        description="Manage inventory product categories, department mappings, and default GST tax rates."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button type="button" size="sm" onClick={handleOpenAddDrawer} className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold">
              <Plus className="h-4 w-4" /> + Add Category
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatMiniCard label="Total Categories" value={stats.total} sublabel="Cataloged categories" accent="#0f766e" icon={Layers} />
        <StatMiniCard label="Active Categories" value={stats.active} sublabel="In active use" accent="#16a34a" icon={CheckCircle2} />
        <StatMiniCard label="Linked Products" value={stats.totalProducts} sublabel="Across all categories" accent="#d97706" icon={Package} />
        <StatMiniCard label="Inactive Categories" value={stats.inactive} sublabel="Disabled categories" accent="#64748b" icon={XCircle} />
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 items-center">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Category Name, Code, or Department..."
              className="h-9.5 w-full rounded-xl border border-slate-200 bg-white pl-9.5 pr-3 text-xs sm:text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <SelectInput
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="h-9.5 text-xs sm:text-sm"
            >
              <option value="all">All Departments</option>
              {DEPARTMENT_OPTIONS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </SelectInput>
          </div>

          <div className="flex items-center gap-2">
            <SelectInput
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9.5 text-xs sm:text-sm flex-1"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </SelectInput>

            {(Boolean(searchQuery.trim()) || selectedDepartment !== "all" || selectedStatus !== "all") && (
              <Button type="button" variant="outline" size="sm" onClick={handleResetFilters} className="h-9.5 shrink-0 px-2.5 text-xs">
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      <CategoryTable
        categories={filteredCategories}
        onEditCategory={handleOpenEditDrawer}
        onDeleteCategory={(cat) => setDeletingCategory(cat)}
        onResetFilters={handleResetFilters}
      />

      <CategoryDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSaveCategory}
        initialCategory={editingCategory}
      />

      <ConfirmModal
        open={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        onConfirm={confirmDeleteCategory}
        title="Delete Product Category"
        message={`Are you sure you want to delete "${deletingCategory?.categoryName}" (${deletingCategory?.categoryCode})?`}
        confirmLabel="Delete Category"
        variant="danger"
      />
    </div>
  );
}
