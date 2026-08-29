"use client";

import React, { useState, useMemo } from "react";
import { Ruler, CheckCircle2, XCircle, Plus, Download, Search, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FOPageHeader, StatMiniCard, ConfirmModal, AlertBanner, SelectInput } from "@/components/frontoffice/ui";
import { type UnitItem } from "@/app/data/purchaseStoresMastersData";
import { UnitTable } from "@/components/purchase-stores/masters/units/UnitTable";
import { UnitDrawer } from "@/components/purchase-stores/masters/units/UnitDrawer";
import { usePsList } from "@/hooks/usePsResource";
import { psUnitService } from "@/services/purchase-stores/index";

export default function UnitMasterPage() {
  const { data: units, loading, reload } = usePsList(() => psUnitService.list());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitItem | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<UnitItem | null>(null);

  const [toastMessage, setToastMessage] = useState<{
    text: string;
    variant: "success" | "info" | "error";
  } | null>(null);

  const showToast = (text: string, variant: "success" | "info" | "error" = "success") => {
    setToastMessage({ text, variant });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        u.unitName.toLowerCase().includes(q) ||
        u.unitCode.toLowerCase().includes(q) ||
        u.symbol.toLowerCase().includes(q);

      const matchesStatus = selectedStatus === "all" || u.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [units, searchQuery, selectedStatus]);

  const stats = useMemo(() => {
    const total = units.length;
    const active = units.filter((u) => u.status === "Active").length;
    const inactive = units.filter((u) => u.status === "Inactive").length;
    return { total, active, inactive };
  }, [units]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedStatus("all");
  };

  const handleOpenAddDrawer = () => {
    setEditingUnit(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (unit: UnitItem) => {
    setEditingUnit(unit);
    setIsDrawerOpen(true);
  };

  const handleSaveUnit = async (unit: UnitItem) => {
    try {
      if (editingUnit) {
        await psUnitService.update(unit.id, unit);
        showToast(`Unit "${unit.unitName}" updated successfully.`);
      } else {
        await psUnitService.create(unit);
        showToast(`Unit "${unit.unitName}" created successfully.`);
      }
      reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to save unit.", "error");
    }
  };

  const confirmDeleteUnit = async () => {
    if (!deletingUnit) return;
    const name = deletingUnit.unitName;
    try {
      await psUnitService.remove(deletingUnit.id);
      setDeletingUnit(null);
      showToast(`Unit "${name}" deleted from master registry.`, "error");
      reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to delete unit.", "error");
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
    const headers = ["Unit Code", "Unit Name", "Symbol", "Description", "Status", "Created Date"];
    const rows = filteredUnits.map((u) => [
      `"${u.unitCode}"`,
      `"${u.unitName}"`,
      `"${u.symbol}"`,
      `"${u.description || ""}"`,
      `"${u.status}"`,
      `"${u.createdDate}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Unit_Master_Export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filteredUnits.length} unit records to CSV.`, "info");
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
        title="Unit Master"
        description="Manage standard units of measurement (UOM) used across purchasing, inventory control, and stock ledgers."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100">
              <Download className="h-4 w-4" /> Export CSV
            </Button>            <Button type="button" size="sm" onClick={handleOpenAddDrawer} className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold">
              <Plus className="h-4 w-4" /> Add Unit
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatMiniCard label="Total Units" value={stats.total} sublabel="Cataloged UOMs" accent="#0f766e" icon={Ruler} />
        <StatMiniCard label="Active Units" value={stats.active} sublabel="In active use" accent="#16a34a" icon={CheckCircle2} />
        <StatMiniCard label="Inactive Units" value={stats.inactive} sublabel="Disabled UOMs" accent="#64748b" icon={XCircle} />
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 items-center">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Unit Name, Code, or Symbol..."
              className="h-9.5 w-full rounded-xl border border-slate-200 bg-white pl-9.5 pr-3 text-xs sm:text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
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

            {(Boolean(searchQuery.trim()) || selectedStatus !== "all") && (
              <Button type="button" variant="outline" size="sm" onClick={handleResetFilters} className="h-9.5 shrink-0 px-2.5 text-xs">
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      <UnitTable
        units={filteredUnits}
        onEditUnit={handleOpenEditDrawer}
        onDeleteUnit={(unit) => setDeletingUnit(unit)}
        onResetFilters={handleResetFilters}
      />

      <UnitDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={handleSaveUnit}
        initialUnit={editingUnit}
      />

      <ConfirmModal
        open={Boolean(deletingUnit)}
        onClose={() => setDeletingUnit(null)}
        onConfirm={confirmDeleteUnit}
        title="Delete Unit of Measurement"
        message={`Are you sure you want to delete "${deletingUnit?.unitName}" (${deletingUnit?.unitCode})?`}
        confirmLabel="Delete Unit"
        variant="danger"
      />
    </div>
  );
}
