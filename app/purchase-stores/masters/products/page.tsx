"use client";

import React, { useState, useMemo } from "react";
import {
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Download,
  UploadCloud,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FOPageHeader,
  StatMiniCard,
  ConfirmModal,
  AlertBanner,
} from "@/components/frontoffice/ui";
import {
  type ProductItem,
} from "@/app/data/productMasterData";
import { ProductFilters } from "@/components/purchase-stores/products/ProductFilters";
import { ProductTable } from "@/components/purchase-stores/products/ProductTable";
import { ProductDrawer } from "@/components/purchase-stores/products/ProductDrawer";
import { ProductDetailsDrawer } from "@/components/purchase-stores/products/ProductDetailsDrawer";
import { ProductImportModal } from "@/components/purchase-stores/products/ProductImportModal";
import { usePsList } from "@/hooks/usePsResource";
import {
  psProductService,
  psCategoryService,
  psUnitService,
  psSupplierService,
} from "@/services/purchase-stores/index";

export default function ProductMasterPage() {
  const { data: products, loading: productsLoading, reload: reloadProducts } = usePsList(() => psProductService.list());
  const { data: categories, loading: categoriesLoading } = usePsList(() => psCategoryService.list());
  const { data: units, loading: unitsLoading } = usePsList(() => psUnitService.list());
  const { data: suppliers, loading: suppliersLoading } = usePsList(() => psSupplierService.list());

  const loading = productsLoading || categoriesLoading || unitsLoading || suppliersLoading;

  const categoryOptions = useMemo(
    () =>
      categories.map((c) => ({
        id: c.id,
        code: c.categoryCode,
        name: c.categoryName,
        description: c.description ?? "",
      })),
    [categories],
  );

  const unitOptions = useMemo(
    () =>
      units.map((u) => ({
        id: u.id,
        code: u.unitCode,
        name: u.unitName,
        symbol: u.symbol,
      })),
    [units],
  );

  const supplierOptions = useMemo(
    () =>
      suppliers.map((s) => ({
        id: s.id,
        code: s.supplierCode,
        name: s.supplierName,
        contactPerson: s.contactPerson,
        phone: s.phone,
        email: s.email,
      })),
    [suppliers],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Drawer & Modal States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [viewingProduct, setViewingProduct] = useState<ProductItem | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductItem | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Toast Feedback State
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    variant: "success" | "info" | "error";
  } | null>(null);

  const showToast = (text: string, variant: "success" | "info" | "error" = "success") => {
    setToastMessage({ text, variant });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Filtered Products Logic
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search match
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        product.productName.toLowerCase().includes(q) ||
        product.productCode.toLowerCase().includes(q) ||
        (product.brand && product.brand.toLowerCase().includes(q));

      // Category match
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;

      // Supplier match
      const matchesSupplier =
        selectedSupplier === "all" || product.preferredSupplier === selectedSupplier;

      // Status match
      const matchesStatus =
        selectedStatus === "all" || product.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesSupplier && matchesStatus;
    });
  }, [products, searchQuery, selectedCategory, selectedSupplier, selectedStatus]);

  // Statistics Calculations
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.status === "Active").length;
    const inactive = products.filter((p) => p.status === "Inactive").length;
    const lowStock = products.filter(
      (p) => p.status === "Active" && (p.reorderLevel >= p.parStock || p.minimumStock >= p.parStock)
    ).length;

    return { total, active, inactive, lowStock };
  }, [products]);

  // Reset Filters Handler
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedSupplier("all");
    setSelectedStatus("all");
  };

  // Add Product Trigger
  const handleOpenAddDrawer = () => {
    setEditingProduct(null);
    setIsDrawerOpen(true);
  };

  // Edit Product Trigger
  const handleOpenEditDrawer = (product: ProductItem) => {
    setEditingProduct(product);
    setIsDrawerOpen(true);
  };

  // Save Product Handler (Create / Update)
  const handleSaveProduct = async (product: ProductItem) => {
    try {
      if (editingProduct) {
        await psProductService.update(product.id, product);
        showToast(`Product "${product.productName}" updated successfully.`);
      } else {
        await psProductService.create(product);
        showToast(`Product "${product.productName}" created successfully.`);
      }
      reloadProducts();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to save product.", "error");
    }
  };

  const ConfirmDeleteProduct = async () => {
    if (!deletingProduct) return;
    const prodName = deletingProduct.productName;
    try {
      await psProductService.remove(deletingProduct.id);
      setDeletingProduct(null);
      showToast(`Product "${prodName}" deleted from master registry.`, "error");
      reloadProducts();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to delete product.", "error");
    }
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = [
      "Product Code",
      "Product Name",
      "Category",
      "Unit",
      "Brand",
      "Preferred Supplier",
      "Purchase Price (INR)",
      "GST %",
      "HSN Code",
      "Tax Type",
      "Min Stock",
      "Max Stock",
      "Par Stock",
      "Reorder Level",
      "Shelf Location",
      "Storage Type",
      "Status",
      "Created Date",
    ];

    const rows = filteredProducts.map((p) => [
      `"${p.productCode}"`,
      `"${p.productName.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      `"${p.unit}"`,
      `"${p.brand || ""}"`,
      `"${p.preferredSupplier}"`,
      p.purchasePrice,
      p.gstPercent,
      `"${p.hsnCode || ""}"`,
      `"${p.taxType}"`,
      p.minimumStock,
      p.maximumStock,
      p.parStock,
      p.reorderLevel,
      `"${p.shelfLocation || ""}"`,
      `"${p.storageType}"`,
      `"${p.status}"`,
      `"${p.createdDate}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Product_Master_Export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filteredProducts.length} product records to CSV.`, "info");
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 text-sm text-slate-600">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/50 p-4 sm:p-6 md:p-8">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-md animate-in fade-in slide-in-from-top-3">
          <AlertBanner variant={toastMessage.variant} message={toastMessage.text} onDismiss={() => setToastMessage(null)} />
        </div>
      )}

      {/* PAGE HEADER */}
      <FOPageHeader
        eyebrow="Purchase & Stores · Master Registry"
        title="Product Master"
        description="Manage all inventory products used throughout the hotel across Purchase Requisition, RFQ, Purchase Order, Direct Store Purchase, Stock Register, Purchase Return and Inventory modules."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsImportModalOpen(true)}
              className="gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <UploadCloud className="h-4 w-4" />
              Import
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleOpenAddDrawer}
              className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-xs"
            >
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </div>
        }
      />

      {/* STATISTICS CARDS */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatMiniCard
          label="Total Products"
          value={stats.total}
          sublabel="Cataloged items"
          accent="#0f766e"
          icon={Package}
        />
        <StatMiniCard
          label="Active Products"
          value={stats.active}
          sublabel="Operational items"
          accent="#16a34a"
          icon={CheckCircle2}
        />
        <StatMiniCard
          label="Inactive Products"
          value={stats.inactive}
          sublabel="Disabled items"
          accent="#64748b"
          icon={XCircle}
        />
        <StatMiniCard
          label="Low Stock Products"
          value={stats.lowStock}
          sublabel="Requires reorder"
          accent="#d97706"
          icon={AlertTriangle}
        />
      </div>

      {/* FILTERS TOOLBAR */}
      <ProductFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedSupplier={selectedSupplier}
        onSupplierChange={setSelectedSupplier}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        onResetFilters={handleResetFilters}
        categoryOptions={categoryOptions}
        supplierOptions={supplierOptions}
      />

      {/* DATA TABLE */}
      <ProductTable
        products={filteredProducts}
        onViewProduct={(product) => setViewingProduct(product)}
        onEditProduct={(product) => handleOpenEditDrawer(product)}
        onDeleteProduct={(product) => setDeletingProduct(product)}
        onResetFilters={handleResetFilters}
      />

      {/* ADD & EDIT DRAWER */}
      <ProductDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSaveProduct}
        initialProduct={editingProduct}
        categoryOptions={categoryOptions}
        unitOptions={unitOptions}
        supplierOptions={supplierOptions}
      />

      {/* VIEW PRODUCT DETAILS DRAWER */}
      <ProductDetailsDrawer
        open={Boolean(viewingProduct)}
        onClose={() => setViewingProduct(null)}
        product={viewingProduct}
        onEdit={(product) => handleOpenEditDrawer(product)}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        open={Boolean(deletingProduct)}
        onClose={() => setDeletingProduct(null)}
        onConfirm={ConfirmDeleteProduct}
        title="Delete Product from Master"
        message={`Are you sure you want to delete "${deletingProduct?.productName}" (${deletingProduct?.productCode})? This action will permanently remove the product from the Hotel PMS master registry.`}
        confirmLabel="Delete Product"
        variant="danger"
      />

      {/* CSV IMPORT MODAL */}
      <ProductImportModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={(count) => {
          showToast(`Bulk imported ${count} new products successfully.`);
        }}
      />
    </div>
  );
}
