"use client";

import React, { useState, useMemo } from "react";
import { Users, CheckCircle2, XCircle, Plus, Download, Search, RotateCcw, Star, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FOPageHeader, StatMiniCard, ConfirmModal, AlertBanner, SelectInput } from "@/components/frontoffice/ui";
import { INITIAL_SUPPLIERS_DATA, PAYMENT_TERMS_OPTIONS, type SupplierItem } from "@/app/data/purchaseStoresMastersData";
import { SupplierTable } from "@/components/purchase-stores/masters/suppliers/SupplierTable";
import { SupplierDrawer } from "@/components/purchase-stores/masters/suppliers/SupplierDrawer";
import { SupplierDetailsDrawer } from "@/components/purchase-stores/masters/suppliers/SupplierDetailsDrawer";

export default function SupplierMasterPage() {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>(INITIAL_SUPPLIERS_DATA);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTerms, setSelectedTerms] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierItem | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<SupplierItem | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<SupplierItem | null>(null);

  const [toastMessage, setToastMessage] = useState<{
    text: string;
    variant: "success" | "info" | "error";
  } | null>(null);

  const showToast = (text: string, variant: "success" | "info" | "error" = "success") => {
    setToastMessage({ text, variant });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        s.supplierName.toLowerCase().includes(q) ||
        s.supplierCode.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q) ||
        (s.gstin && s.gstin.toLowerCase().includes(q));

      const matchesTerms = selectedTerms === "all" || s.paymentTerms === selectedTerms;
      const matchesStatus = selectedStatus === "all" || s.status === selectedStatus;
      return matchesSearch && matchesTerms && matchesStatus;
    });
  }, [suppliers, searchQuery, selectedTerms, selectedStatus]);

  const stats = useMemo(() => {
    const total = suppliers.length;
    const active = suppliers.filter((s) => s.status === "Active").length;
    const inactive = suppliers.filter((s) => s.status === "Inactive").length;
    const gstRegistered = suppliers.filter((s) => Boolean(s.gstin)).length;
    return { total, active, inactive, gstRegistered };
  }, [suppliers]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedTerms("all");
    setSelectedStatus("all");
  };

  const handleOpenAddDrawer = () => {
    setEditingSupplier(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (supplier: SupplierItem) => {
    setEditingSupplier(supplier);
    setIsDrawerOpen(true);
  };

  const handleSaveSupplier = (supplier: SupplierItem) => {
    if (editingSupplier) {
      setSuppliers((prev) => prev.map((s) => (s.id === supplier.id ? supplier : s)));
      showToast(`Supplier "${supplier.supplierName}" updated successfully.`);
    } else {
      setSuppliers((prev) => [supplier, ...prev]);
      showToast(`Supplier "${supplier.supplierName}" created successfully.`);
    }
  };

  const confirmDeleteSupplier = () => {
    if (!deletingSupplier) return;
    const name = deletingSupplier.supplierName;
    setSuppliers((prev) => prev.filter((s) => s.id !== deletingSupplier.id));
    setDeletingSupplier(null);
    showToast(`Supplier "${name}" deleted from master registry.`, "error");
  };

  const handleExportCSV = () => {
    const headers = ["Supplier Code", "Supplier Name", "Contact Person", "Phone", "Email", "GSTIN", "Payment Terms", "City", "Rating", "Status", "Created Date"];
    const rows = filteredSuppliers.map((s) => [
      `"${s.supplierCode}"`,
      `"${s.supplierName}"`,
      `"${s.contactPerson}"`,
      `"${s.phone}"`,
      `"${s.email}"`,
      `"${s.gstin || ""}"`,
      `"${s.paymentTerms}"`,
      `"${s.city || ""}"`,
      s.rating,
      `"${s.status}"`,
      `"${s.createdDate}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Supplier_Master_Export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filteredSuppliers.length} supplier records to CSV.`, "info");
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
        title="Supplier Master"
        description="Manage vendor profiles, contact details, GSTIN tax registration, payment terms, and ratings."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button type="button" size="sm" onClick={handleOpenAddDrawer} className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold">
              <Plus className="h-4 w-4" /> + Add Supplier
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatMiniCard label="Total Suppliers" value={stats.total} sublabel="Registered vendors" accent="#0f766e" icon={Users} />
        <StatMiniCard label="Active Vendors" value={stats.active} sublabel="Operational suppliers" accent="#16a34a" icon={CheckCircle2} />
        <StatMiniCard label="GST Registered" value={stats.gstRegistered} sublabel="Tax compliant" accent="#d97706" icon={FileText} />
        <StatMiniCard label="Inactive Vendors" value={stats.inactive} sublabel="Disabled suppliers" accent="#64748b" icon={XCircle} />
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
              placeholder="Search by Supplier Name, Code, Contact, or GSTIN..."
              className="h-9.5 w-full rounded-xl border border-slate-200 bg-white pl-9.5 pr-3 text-xs sm:text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <SelectInput
              value={selectedTerms}
              onChange={(e) => setSelectedTerms(e.target.value)}
              className="h-9.5 text-xs sm:text-sm"
            >
              <option value="all">All Payment Terms</option>
              {PAYMENT_TERMS_OPTIONS.map((pt) => (
                <option key={pt} value={pt}>
                  {pt}
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

            {(Boolean(searchQuery.trim()) || selectedTerms !== "all" || selectedStatus !== "all") && (
              <Button type="button" variant="outline" size="sm" onClick={handleResetFilters} className="h-9.5 shrink-0 px-2.5 text-xs">
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      <SupplierTable
        suppliers={filteredSuppliers}
        onViewSupplier={(supplier) => setViewingSupplier(supplier)}
        onEditSupplier={handleOpenEditDrawer}
        onDeleteSupplier={(supplier) => setDeletingSupplier(supplier)}
        onResetFilters={handleResetFilters}
      />

      <SupplierDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSaveSupplier}
        initialSupplier={editingSupplier}
      />

      <SupplierDetailsDrawer
        open={Boolean(viewingSupplier)}
        onClose={() => setViewingSupplier(null)}
        supplier={viewingSupplier}
        onEdit={(supplier) => handleOpenEditDrawer(supplier)}
      />

      <ConfirmModal
        open={Boolean(deletingSupplier)}
        onClose={() => setDeletingSupplier(null)}
        onConfirm={confirmDeleteSupplier}
        title="Delete Supplier Profile"
        message={`Are you sure you want to delete "${deletingSupplier?.supplierName}" (${deletingSupplier?.supplierCode})?`}
        confirmLabel="Delete Supplier"
        variant="danger"
      />
    </div>
  );
}
