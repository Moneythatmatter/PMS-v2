"use client";

import React, { useState, useMemo } from "react";
import { Users, CheckCircle2, XCircle, Plus, Download, Search, RotateCcw, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FOPageHeader, StatMiniCard, ConfirmModal, AlertBanner, SelectInput } from "@/components/frontoffice/ui";
import { PAYMENT_TERMS_OPTIONS, type SupplierItem } from "@/app/data/purchaseStoresMastersData";
import { SupplierTable } from "@/components/purchase-stores/masters/suppliers/SupplierTable";
import { SupplierDrawer } from "@/components/purchase-stores/masters/suppliers/SupplierDrawer";
import { SupplierDetailsDrawer } from "@/components/purchase-stores/masters/suppliers/SupplierDetailsDrawer";
import { usePsList } from "@/hooks/usePsResource";
import { psSupplierService } from "@/services/purchase-stores/index";

export default function VendorsPage() {
  const { data: vendors, loading, reload } = usePsList(() => psSupplierService.list());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTerms, setSelectedTerms] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<SupplierItem | null>(null);
  const [viewingVendor, setViewingVendor] = useState<SupplierItem | null>(null);
  const [deletingVendor, setDeletingVendor] = useState<SupplierItem | null>(null);

  const [toastMessage, setToastMessage] = useState<{
    text: string;
    variant: "success" | "info" | "error";
  } | null>(null);

  const showToast = (text: string, variant: "success" | "info" | "error" = "success") => {
    setToastMessage({ text, variant });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        v.supplierName.toLowerCase().includes(q) ||
        v.supplierCode.toLowerCase().includes(q) ||
        v.contactPerson.toLowerCase().includes(q) ||
        (v.gstin && v.gstin.toLowerCase().includes(q));

      const matchesTerms = selectedTerms === "all" || v.paymentTerms === selectedTerms;
      const matchesStatus = selectedStatus === "all" || v.status === selectedStatus;
      return matchesSearch && matchesTerms && matchesStatus;
    });
  }, [vendors, searchQuery, selectedTerms, selectedStatus]);

  const stats = useMemo(() => {
    const total = vendors.length;
    const active = vendors.filter((v) => v.status === "Active").length;
    const inactive = vendors.filter((v) => v.status === "Inactive").length;
    const gstRegistered = vendors.filter((v) => Boolean(v.gstin)).length;
    return { total, active, inactive, gstRegistered };
  }, [vendors]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedTerms("all");
    setSelectedStatus("all");
  };

  const handleOpenAddDrawer = () => {
    setEditingVendor(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (vendor: SupplierItem) => {
    setEditingVendor(vendor);
    setIsDrawerOpen(true);
  };

  const handleSaveVendor = async (vendor: SupplierItem) => {
    try {
      if (editingVendor) {
        await psSupplierService.update(vendor.id, vendor);
        showToast(`Vendor "${vendor.supplierName}" updated successfully.`);
      } else {
        await psSupplierService.create(vendor);
        showToast(`Vendor "${vendor.supplierName}" created successfully.`);
      }
      reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to save vendor.", "error");
    }
  };

  const confirmDeleteVendor = async () => {
    if (!deletingVendor) return;
    const name = deletingVendor.supplierName;
    try {
      await psSupplierService.remove(deletingVendor.id);
      setDeletingVendor(null);
      showToast(`Vendor "${name}" deleted from registry.`, "error");
      reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to delete vendor.", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 text-sm text-slate-600">
        Loading...
      </div>
    );
  }

  const handleExportCSV = () => {
    const headers = ["Vendor Code", "Vendor Name", "Contact Person", "Phone", "Email", "GSTIN", "Payment Terms", "City", "Rating", "Status", "Created Date"];
    const rows = filteredVendors.map((v) => [
      `"${v.supplierCode}"`,
      `"${v.supplierName}"`,
      `"${v.contactPerson}"`,
      `"${v.phone}"`,
      `"${v.email}"`,
      `"${v.gstin || ""}"`,
      `"${v.paymentTerms}"`,
      `"${v.city || ""}"`,
      v.rating,
      `"${v.status}"`,
      `"${v.createdDate}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Vendor_Export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filteredVendors.length} vendor records to CSV.`, "info");
  };

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/50 p-4 sm:p-6 md:p-8">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-md animate-in fade-in slide-in-from-top-3">
          <AlertBanner variant={toastMessage.variant} message={toastMessage.text} onDismiss={() => setToastMessage(null)} />
        </div>
      )}

      <FOPageHeader
        eyebrow="Purchase & Stores"
        title="Vendors"
        description="Manage vendor profiles, contact details, GSTIN tax registration, payment terms, and ratings."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button type="button" size="sm" onClick={handleOpenAddDrawer} className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold">
              <Plus className="h-4 w-4" /> Add Vendor
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatMiniCard label="Total Vendors" value={stats.total} sublabel="Registered vendors" accent="#0f766e" icon={Users} />
        <StatMiniCard label="Active Vendors" value={stats.active} sublabel="Operational vendors" accent="#16a34a" icon={CheckCircle2} />
        <StatMiniCard label="GST Registered" value={stats.gstRegistered} sublabel="Tax compliant" accent="#d97706" icon={FileText} />
        <StatMiniCard label="Inactive Vendors" value={stats.inactive} sublabel="Disabled vendors" accent="#64748b" icon={XCircle} />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 items-center">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Vendor Name, Code, Contact, or GSTIN..."
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
        suppliers={filteredVendors}
        onViewSupplier={(vendor) => setViewingVendor(vendor)}
        onEditSupplier={handleOpenEditDrawer}
        onDeleteSupplier={(vendor) => setDeletingVendor(vendor)}
        onResetFilters={handleResetFilters}
      />

      <SupplierDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSaveVendor}
        initialSupplier={editingVendor}
      />

      <SupplierDetailsDrawer
        open={Boolean(viewingVendor)}
        onClose={() => setViewingVendor(null)}
        supplier={viewingVendor}
        onEdit={(vendor) => handleOpenEditDrawer(vendor)}
      />

      <ConfirmModal
        open={Boolean(deletingVendor)}
        onClose={() => setDeletingVendor(null)}
        onConfirm={confirmDeleteVendor}
        title="Delete Vendor Profile"
        message={`Are you sure you want to delete "${deletingVendor?.supplierName}" (${deletingVendor?.supplierCode})?`}
        confirmLabel="Delete Vendor"
        variant="danger"
      />
    </div>
  );
}
