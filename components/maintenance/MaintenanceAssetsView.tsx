"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Boxes,
  Search,
  Plus,
  X,
  FileText,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Edit2,
  Eye,
  Building2,
  Filter,
  Wrench,
  ChevronRight,
  ExternalLink,
  Clock,
  AlertTriangle,
  Archive,
  DollarSign,
  Truck,
  MapPin,
  Lock,
  History,
  Tag,
  Ban,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  MOCK_MAINTENANCE_ASSETS,
  MOCK_ASSET_CATEGORIES,
  MOCK_MAINTENANCE_VENDORS,
  HOTEL_LOCATIONS,
  MOCK_PM_SCHEDULES,
} from "@/app/data/maintenance/mockData";
import { MaintenanceAsset, AssetStatus, MaintenanceVendor } from "@/app/data/maintenance/types";

export function MaintenanceAssetsView() {
  const [assets, setAssets] = useState<MaintenanceAsset[]>(MOCK_MAINTENANCE_ASSETS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [selectedContractFilter, setSelectedContractFilter] = useState("ALL");

  // Multi-Selection State
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Drawer & Modal States
  const [isRegisterDrawerOpen, setIsRegisterDrawerOpen] = useState(false);
  const [selectedAssetForView, setSelectedAssetForView] = useState<MaintenanceAsset | null>(null);
  const [selectedAssetForEdit, setSelectedAssetForEdit] = useState<MaintenanceAsset | null>(null);
  const [selectedAssetForDecommission, setSelectedAssetForDecommission] = useState<MaintenanceAsset | null>(null);

  const handleSelectAllRows = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(filteredAssets.map((item) => item.id));
      setSelectedRowIds(allIds);
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const handleToggleRowSelect = (id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Form State for Register / Edit
  const [formAssetCode, setFormAssetCode] = useState("");
  const [formAssetName, setFormAssetName] = useState("");
  const [formCategory, setFormCategory] = useState(MOCK_ASSET_CATEGORIES[0]?.categoryName || "HVAC / Air Conditioning");
  const [formManufacturer, setFormManufacturer] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formSerialNumber, setFormSerialNumber] = useState("");
  const [formLocationType, setFormLocationType] = useState<"Guest Room" | "F&B Area" | "Public Area" | "Back of House">("Back of House");
  const [formLocation, setFormLocation] = useState(HOTEL_LOCATIONS[0]?.name || "Basement Utility Room");
  const [formPurchaseDate, setFormPurchaseDate] = useState("");
  const [formInstallationDate, setFormInstallationDate] = useState("");
  const [formPurchaseCost, setFormPurchaseCost] = useState<number | "">("");
  const [formWarrantyStartDate, setFormWarrantyStartDate] = useState("");
  const [formWarrantyEndDate, setFormWarrantyEndDate] = useState("");
  const [formAmcStatus, setFormAmcStatus] = useState<"Active" | "Inactive">("Inactive");
  const [formVendorId, setFormVendorId] = useState("");
  const [formAmcStartDate, setFormAmcStartDate] = useState("");
  const [formAmcEndDate, setFormAmcEndDate] = useState("");
  const [formAmcReference, setFormAmcReference] = useState("");
  const [formStatus, setFormStatus] = useState<AssetStatus>("Operational");
  const [formNotes, setFormNotes] = useState("");

  // Decommission Modal State
  const [decommissionDate, setDecommissionDate] = useState(new Date().toISOString().split("T")[0]);
  const [decommissionReason, setDecommissionReason] = useState("");

  // Duplicate Check logic for current property
  const duplicateCodeWarning = useMemo(() => {
    if (!formAssetCode.trim()) return null;
    const isEditing = selectedAssetForEdit !== null;
    const match = assets.find(
      (a) =>
        a.assetCode.toLowerCase() === formAssetCode.trim().toLowerCase() &&
        (!isEditing || a.id !== selectedAssetForEdit.id)
    );
    if (match) {
      return `Asset Code "${match.assetCode}" is already registered in this hotel (${match.assetName}).`;
    }
    return null;
  }, [formAssetCode, assets, selectedAssetForEdit]);

  const duplicateSerialWarning = useMemo(() => {
    if (!formSerialNumber.trim()) return null;
    const isEditing = selectedAssetForEdit !== null;
    const match = assets.find(
      (a) =>
        a.serialNumber &&
        a.serialNumber.toLowerCase() === formSerialNumber.trim().toLowerCase() &&
        a.status !== "Decommissioned" &&
        (!isEditing || a.id !== selectedAssetForEdit.id)
    );
    if (match) {
      return `Serial Number "${match.serialNumber}" is already attached to active asset "${match.assetName}" (${match.assetCode}).`;
    }
    return null;
  }, [formSerialNumber, assets, selectedAssetForEdit]);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((ast) => {
      const matchesSearch =
        ast.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ast.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ast.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ast.serialNumber && ast.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ast.manufacturer && ast.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ast.model && ast.model.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategoryFilter === "ALL" || ast.category === selectedCategoryFilter;
      const matchesStatus = selectedStatusFilter === "ALL" || ast.status === selectedStatusFilter;

      let matchesContract = true;
      if (selectedContractFilter === "WARRANTY_ACTIVE") {
        matchesContract = ast.warrantyStatus === "Active";
      } else if (selectedContractFilter === "AMC_ACTIVE") {
        matchesContract = ast.amcStatus === "Active";
      } else if (selectedContractFilter === "NO_COVERAGE") {
        matchesContract = ast.warrantyStatus !== "Active" && ast.amcStatus !== "Active";
      }

      return matchesSearch && matchesCategory && matchesStatus && matchesContract;
    });
  }, [assets, searchTerm, selectedCategoryFilter, selectedStatusFilter, selectedContractFilter]);

  // Stats (5 separate counters as required)
  const stats = useMemo(() => {
    return {
      total: assets.length,
      operational: assets.filter((a) => a.status === "Operational").length,
      underMaintenance: assets.filter((a) => a.status === "Under Maintenance").length,
      outOfService: assets.filter((a) => a.status === "Out of Service").length,
      decommissioned: assets.filter((a) => a.status === "Decommissioned").length,
    };
  }, [assets]);

  // Locations available for selected locationType
  const filteredLocations = useMemo(() => {
    return HOTEL_LOCATIONS.filter((loc) => loc.type === formLocationType);
  }, [formLocationType]);

  const handleOpenRegisterDrawer = () => {
    const nextCode = `AST-00${assets.length + 1}`;
    setFormAssetCode(nextCode);
    setFormAssetName("");
    setFormCategory(MOCK_ASSET_CATEGORIES[0]?.categoryName || "HVAC / Air Conditioning");
    setFormManufacturer("");
    setFormModel("");
    setFormSerialNumber("");
    setFormLocationType("Back of House");
    setFormLocation("Basement Utility Room");
    setFormPurchaseDate("");
    setFormInstallationDate("");
    setFormPurchaseCost("");
    setFormWarrantyStartDate("");
    setFormWarrantyEndDate("");
    setFormAmcStatus("Inactive");
    setFormVendorId("");
    setFormAmcStartDate("");
    setFormAmcEndDate("");
    setFormAmcReference("");
    setFormStatus("Operational");
    setFormNotes("");
    setSelectedAssetForEdit(null);
    setIsRegisterDrawerOpen(true);
  };

  const handleOpenEditDrawer = (ast: MaintenanceAsset) => {
    if (ast.status === "Decommissioned") {
      alert("Decommissioned assets are read-only and cannot be edited.");
      return;
    }
    setSelectedAssetForEdit(ast);
    setFormAssetCode(ast.assetCode);
    setFormAssetName(ast.assetName);
    setFormCategory(ast.category);
    setFormManufacturer(ast.manufacturer || "");
    setFormModel(ast.model || "");
    setFormSerialNumber(ast.serialNumber || "");
    setFormLocationType(ast.locationType);
    setFormLocation(ast.location);
    setFormPurchaseDate(ast.purchaseDate || "");
    setFormInstallationDate(ast.installationDate || "");
    setFormPurchaseCost(ast.purchaseCost || "");
    setFormWarrantyStartDate(ast.warrantyStartDate || "");
    setFormWarrantyEndDate(ast.warrantyEndDate || "");
    setFormAmcStatus(ast.amcStatus || "Inactive");
    setFormVendorId(ast.maintenanceVendorId || "");
    setFormAmcStartDate(ast.amcStartDate || "");
    setFormAmcEndDate(ast.amcEndDate || "");
    setFormAmcReference(ast.amcReference || "");
    setFormStatus(ast.status);
    setFormNotes(ast.notes || "");
  };

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (duplicateCodeWarning) return;
    if (!formAssetCode.trim() || !formAssetName.trim()) return;

    // Calculate warranty status
    let computedWarrantyStatus: "Active" | "Expired" | "Not Specified" = "Not Specified";
    if (formWarrantyEndDate) {
      const today = new Date().toISOString().split("T")[0];
      computedWarrantyStatus = formWarrantyEndDate >= today ? "Active" : "Expired";
    }

    // Get vendor info
    const vendor = MOCK_MAINTENANCE_VENDORS.find((v) => v.id === formVendorId);

    if (selectedAssetForEdit) {
      // Update
      setAssets((prev) =>
        prev.map((a) =>
          a.id === selectedAssetForEdit.id
            ? {
                ...a,
                assetCode: formAssetCode.trim().toUpperCase(),
                assetName: formAssetName.trim(),
                category: formCategory,
                manufacturer: formManufacturer.trim(),
                model: formModel.trim(),
                serialNumber: formSerialNumber.trim(),
                locationType: formLocationType,
                location: formLocation,
                purchaseDate: formPurchaseDate,
                installationDate: formInstallationDate,
                purchaseCost: typeof formPurchaseCost === "number" ? formPurchaseCost : undefined,
                warrantyStartDate: formWarrantyStartDate,
                warrantyEndDate: formWarrantyEndDate,
                warrantyStatus: computedWarrantyStatus,
                amcStatus: formAmcStatus,
                maintenanceVendorId: vendor?.id,
                maintenanceVendorName: vendor?.vendorName,
                amcStartDate: formAmcStartDate,
                amcEndDate: formAmcEndDate,
                amcReference: formAmcReference,
                status: formStatus,
                notes: formNotes.trim(),
              }
            : a
        )
      );
      setSelectedAssetForEdit(null);
    } else {
      // Register New
      const newAsset: MaintenanceAsset = {
        id: `ast-${Date.now()}`,
        assetCode: formAssetCode.trim().toUpperCase(),
        assetName: formAssetName.trim(),
        category: formCategory,
        manufacturer: formManufacturer.trim(),
        model: formModel.trim(),
        serialNumber: formSerialNumber.trim(),
        locationType: formLocationType,
        location: formLocation,
        purchaseDate: formPurchaseDate,
        installationDate: formInstallationDate,
        purchaseCost: typeof formPurchaseCost === "number" ? formPurchaseCost : undefined,
        warrantyStartDate: formWarrantyStartDate,
        warrantyEndDate: formWarrantyEndDate,
        warrantyStatus: computedWarrantyStatus,
        amcStatus: formAmcStatus,
        maintenanceVendorId: vendor?.id,
        maintenanceVendorName: vendor?.vendorName,
        amcStartDate: formAmcStartDate,
        amcEndDate: formAmcEndDate,
        amcReference: formAmcReference,
        status: formStatus,
        notes: formNotes.trim(),
        totalMaintenanceCost: 0,
        totalWorkOrdersCount: 0,
        history: [],
        createdAt: new Date().toISOString(),
      };
      setAssets((prev) => [newAsset, ...prev]);
      setIsRegisterDrawerOpen(false);
    }
  };

  const handleDecommissionAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetForDecommission || !decommissionReason.trim()) return;

    setAssets((prev) =>
      prev.map((a) =>
        a.id === selectedAssetForDecommission.id
          ? {
              ...a,
              status: "Decommissioned",
              decommissionDate: decommissionDate,
              decommissionReason: decommissionReason.trim(),
            }
          : a
      )
    );

    // If currently viewing in drawer, update view
    if (selectedAssetForView && selectedAssetForView.id === selectedAssetForDecommission.id) {
      setSelectedAssetForView((prev) =>
        prev
          ? {
              ...prev,
              status: "Decommissioned",
              decommissionDate: decommissionDate,
              decommissionReason: decommissionReason.trim(),
            }
          : null
      );
    }

    setSelectedAssetForDecommission(null);
    setDecommissionReason("");
  };

  return (
    <ModulePageShell
      eyebrow="Maintenance & Engineering"
      title="Assets & Equipment"
      description="Service-critical hotel machinery ledger, warranties, AMC contracts, and complete lifetime repair service history."
      breadcrumbs={[
        { label: "Maintenance", href: "/maintenance/dashboard" },
        { label: "Assets & Equipment" },
      ]}
      secondaryActions={
        <Button
          type="button"
          size="sm"
          onClick={handleOpenRegisterDrawer}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 h-9 px-3.5"
        >
          <Plus className="h-4 w-4" /> Register Asset
        </Button>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: OPERATIONAL KPI CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5 lg:gap-4 mb-5">
        {/* Card 1: Total Assets */}
        <Card className="h-full min-w-0 p-3 sm:p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Total Assets
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-8 sm:w-8">
              <Boxes className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {stats.total}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            All registered machinery
          </p>
        </Card>

        {/* Card 2: Operational */}
        <Card className="h-full min-w-0 p-3 sm:p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Operational
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-8 sm:w-8">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-emerald-700 sm:text-2xl">
            {stats.operational}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            In active service
          </p>
        </Card>

        {/* Card 3: Under Maintenance */}
        <Card className="h-full min-w-0 p-3 sm:p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Under Maintenance
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 sm:h-8 sm:w-8">
              <Wrench className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-amber-700 sm:text-2xl">
            {stats.underMaintenance}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            Active repair order
          </p>
        </Card>

        {/* Card 4: Out of Service */}
        <Card className="h-full min-w-0 p-3 sm:p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Out of Service
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700 sm:h-8 sm:w-8">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-rose-700 sm:text-2xl">
            {stats.outOfService}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            Temporarily stopped
          </p>
        </Card>

        {/* Card 5: Decommissioned */}
        <Card className="h-full min-w-0 p-3 sm:p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Decommissioned
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 sm:h-8 sm:w-8">
              <Archive className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-600 sm:text-2xl">
            {stats.decommissioned}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            Retired from service
          </p>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: SEARCH TOOLBAR & FILTERS
      ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 mb-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search code, name, serial#, location, manufacturer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {MOCK_ASSET_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.categoryName}>
                  {cat.categoryName}
                </option>
              ))}
            </select>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Operational">Operational</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Out of Service">Out of Service</option>
              <option value="Decommissioned">Decommissioned</option>
            </select>

            <select
              value={selectedContractFilter}
              onChange={(e) => setSelectedContractFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Contract Statuses</option>
              <option value="WARRANTY_ACTIVE">Active Warranty</option>
              <option value="AMC_ACTIVE">Active AMC Contract</option>
              <option value="NO_COVERAGE">No Active Contract</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: MAIN ASSETS TABLE
      ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="w-10 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAllRows}
                    checked={
                      filteredAssets.length > 0 &&
                      filteredAssets.every((item) => selectedRowIds.has(item.id))
                    }
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
                <th className="py-3 px-4">Asset Code</th>
                <th className="py-3 px-4">Asset Name & Category</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Coverage / AMC</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Active Job / Service</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Boxes className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm">No assets found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try adjusting your search query or filter settings.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAssets.map((ast) => {
                  const isDecommissioned = ast.status === "Decommissioned";
                  const isUnderMaintenance = ast.status === "Under Maintenance";

                  return (
                    <tr
                      key={ast.id}
                      className={cn(
                        "hover:bg-slate-50/80 transition-colors",
                        isDecommissioned && "bg-slate-50/50 opacity-75"
                      )}
                    >
                      <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedRowIds.has(ast.id)}
                          onChange={() => handleToggleRowSelect(ast.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="px-4 py-3.5 font-mono font-semibold text-slate-900">
                        {ast.assetCode}
                        {ast.serialNumber && (
                          <div className="text-[10px] font-sans font-normal text-slate-400 mt-0.5">
                            SN: {ast.serialNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{ast.assetName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Tag className="h-3 w-3 text-slate-400" />
                          {ast.category}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800">{ast.location}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{ast.locationType}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1 items-start">
                          {ast.warrantyStatus === "Active" && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck className="h-3 w-3" />
                              Warranty Active
                            </span>
                          )}
                          {ast.amcStatus === "Active" ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              <Truck className="h-3 w-3" />
                              AMC: {ast.maintenanceVendorName || "Active"}
                            </span>
                          ) : (
                            ast.warrantyStatus !== "Active" && (
                              <span className="text-[10px] text-slate-400">No active coverage</span>
                            )
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                            ast.status === "Operational" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                            ast.status === "Under Maintenance" && "bg-amber-50 text-amber-700 border-amber-200",
                            ast.status === "Out of Service" && "bg-rose-50 text-rose-700 border-rose-200",
                            ast.status === "Decommissioned" && "bg-slate-200 text-slate-700 border-slate-300"
                          )}
                        >
                          {ast.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-medium">
                        {isUnderMaintenance && ast.activeWorkOrderNo ? (
                          <Link
                            href="/maintenance/work-orders"
                            className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono text-[11px] hover:underline"
                          >
                            <Wrench className="h-3 w-3" />
                            Active WO: #{ast.activeWorkOrderNo}
                          </Link>
                        ) : isDecommissioned ? (
                          <span className="text-[11px] text-slate-400 italic">Retired on {ast.decommissionDate}</span>
                        ) : ast.lastServicedDate ? (
                          <span className="text-[11px] text-slate-500">Last: {ast.lastServicedDate}</span>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAssetForView(ast)}
                            className="text-slate-600 hover:text-slate-900 h-8 px-2"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            {isDecommissioned ? "View History" : "Details"}
                          </Button>

                          {!isDecommissioned && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditDrawer(ast)}
                              className="text-slate-600 hover:text-slate-900 h-8 px-2"
                            >
                              <Edit2 className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer: Register Asset */}
      <Drawer
        isOpen={isRegisterDrawerOpen}
        onClose={() => setIsRegisterDrawerOpen(false)}
        title="Register New Asset / Equipment"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveAsset} className="space-y-5 p-4 text-xs">
          {/* Duplicate Warnings */}
          {duplicateCodeWarning && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{duplicateCodeWarning}</span>
            </div>
          )}
          {duplicateSerialWarning && (
            <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{duplicateSerialWarning}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div>
            <h4 className="font-semibold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1.5 mb-3 flex items-center gap-1.5">
              <Boxes className="h-4 w-4 text-slate-600" />
              1. Asset Basic Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Asset Code *
                </label>
                <input
                  type="text"
                  required
                  value={formAssetCode}
                  onChange={(e) => setFormAssetCode(e.target.value)}
                  placeholder="e.g. AST-HVAC-032"
                  className="w-full border border-slate-200 rounded-md p-2 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Asset Name / Title *
                </label>
                <input
                  type="text"
                  required
                  value={formAssetName}
                  onChange={(e) => setFormAssetName(e.target.value)}
                  placeholder="e.g. Daikin 1.5 Ton Inverter Split AC"
                  className="w-full border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Asset Category *
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full border border-slate-200 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {MOCK_ASSET_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.categoryName}>
                      {cat.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={formSerialNumber}
                  onChange={(e) => setFormSerialNumber(e.target.value)}
                  placeholder="e.g. SN-AC305-001"
                  className="w-full border border-slate-200 rounded-md p-2 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Manufacturer / Brand
                </label>
                <input
                  type="text"
                  value={formManufacturer}
                  onChange={(e) => setFormManufacturer(e.target.value)}
                  placeholder="e.g. Daikin / Cummins / Schindler"
                  className="w-full border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Model Number
                </label>
                <input
                  type="text"
                  value={formModel}
                  onChange={(e) => setFormModel(e.target.value)}
                  placeholder="e.g. FTKM50U"
                  className="w-full border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Location */}
          <div>
            <h4 className="font-semibold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1.5 mb-3 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-slate-600" />
              2. Hotel Location Assignment
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Location Type *
                </label>
                <select
                  value={formLocationType}
                  onChange={(e) => {
                    const type = e.target.value as any;
                    setFormLocationType(type);
                    const firstMatch = HOTEL_LOCATIONS.find((l) => l.type === type);
                    if (firstMatch) setFormLocation(firstMatch.name);
                  }}
                  className="w-full border border-slate-200 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="Guest Room">Guest Room</option>
                  <option value="F&B Area">F&B Area</option>
                  <option value="Public Area">Public Area</option>
                  <option value="Back of House">Back of House</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Specific Location *
                </label>
                <select
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full border border-slate-200 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {filteredLocations.map((loc, idx) => (
                    <option key={idx} value={loc.name}>
                      {loc.name} ({loc.floor})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Purchase & Warranty */}
          <div>
            <h4 className="font-semibold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1.5 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-slate-600" />
              3. Financials & Warranty
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={formPurchaseDate}
                  onChange={(e) => setFormPurchaseDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Installation Date
                </label>
                <input
                  type="date"
                  value={formInstallationDate}
                  onChange={(e) => setFormInstallationDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Purchase Cost (₹)
                </label>
                <input
                  type="number"
                  value={formPurchaseCost}
                  onChange={(e) => setFormPurchaseCost(e.target.value ? parseFloat(e.target.value) : "")}
                  placeholder="e.g. 48500"
                  className="w-full border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Warranty Start Date
                </label>
                <input
                  type="date"
                  value={formWarrantyStartDate}
                  onChange={(e) => setFormWarrantyStartDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Warranty End Date
                </label>
                <input
                  type="date"
                  value={formWarrantyEndDate}
                  onChange={(e) => setFormWarrantyEndDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Maintenance Vendor & AMC */}
          <div>
            <h4 className="font-semibold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1.5 mb-3 flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-slate-600" />
              4. Service Vendor & AMC Contract (Maintenance Vendor Master)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  AMC Status
                </label>
                <select
                  value={formAmcStatus}
                  onChange={(e) => setFormAmcStatus(e.target.value as "Active" | "Inactive")}
                  className="w-full border border-slate-200 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="Inactive">No Active AMC</option>
                  <option value="Active font-semibold">Active AMC Contract</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Maintenance Service Vendor Master
                </label>
                <select
                  value={formVendorId}
                  onChange={(e) => setFormVendorId(e.target.value)}
                  className="w-full border border-slate-200 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="">-- None / In-House Maintenance --</option>
                  {MOCK_MAINTENANCE_VENDORS.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vendorName} ({v.serviceType} - {v.vendorCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  AMC Contract / Reference No.
                </label>
                <input
                  type="text"
                  value={formAmcReference}
                  onChange={(e) => setFormAmcReference(e.target.value)}
                  placeholder="e.g. AMC-VLT-2026-089"
                  className="w-full border border-slate-200 rounded-md p-2 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  AMC Expiry Date
                </label>
                <input
                  type="date"
                  value={formAmcEndDate}
                  onChange={(e) => setFormAmcEndDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Initial Status & Notes */}
          <div>
            <h4 className="font-semibold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1.5 mb-3 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-slate-600" />
              5. Initial Operational Status & Notes
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Initial Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as AssetStatus)}
                  className="w-full border border-slate-200 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="Operational">Operational</option>
                  <option value="Out of Service">Out of Service</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Technical Notes & Remarks
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Special instructions, warranty caveats, or servicing guidelines..."
                  className="w-full border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsRegisterDrawerOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!!duplicateCodeWarning}
              className="bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Register Asset
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Drawer: Edit Asset */}
      <Drawer
        isOpen={!!selectedAssetForEdit}
        onClose={() => setSelectedAssetForEdit(null)}
        title={`Edit Asset: ${selectedAssetForEdit?.assetCode || ""}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveAsset} className="space-y-5 p-4 text-xs">
          {/* Duplicate Warnings */}
          {duplicateCodeWarning && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{duplicateCodeWarning}</span>
            </div>
          )}

          {/* Basic Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Asset Code *</label>
              <input
                type="text"
                required
                value={formAssetCode}
                onChange={(e) => setFormAssetCode(e.target.value)}
                className="w-full border border-slate-200 rounded-md p-2 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Asset Name *</label>
              <input
                type="text"
                required
                value={formAssetName}
                onChange={(e) => setFormAssetName(e.target.value)}
                className="w-full border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Category *</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full border border-slate-200 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {MOCK_ASSET_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.categoryName}>
                    {cat.categoryName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Serial Number</label>
              <input
                type="text"
                value={formSerialNumber}
                onChange={(e) => setFormSerialNumber(e.target.value)}
                className="w-full border border-slate-200 rounded-md p-2 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Manufacturer</label>
              <input
                type="text"
                value={formManufacturer}
                onChange={(e) => setFormManufacturer(e.target.value)}
                className="w-full border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Model</label>
              <input
                type="text"
                value={formModel}
                onChange={(e) => setFormModel(e.target.value)}
                className="w-full border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Location Type</label>
              <select
                value={formLocationType}
                onChange={(e) => {
                  const type = e.target.value as any;
                  setFormLocationType(type);
                  const firstMatch = HOTEL_LOCATIONS.find((l) => l.type === type);
                  if (firstMatch) setFormLocation(firstMatch.name);
                }}
                className="w-full border border-slate-200 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="Guest Room">Guest Room</option>
                <option value="F&B Area">F&B Area</option>
                <option value="Public Area">Public Area</option>
                <option value="Back of House">Back of House</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Specific Location</label>
              <select
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                className="w-full border border-slate-200 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {filteredLocations.map((loc, idx) => (
                  <option key={idx} value={loc.name}>
                    {loc.name} ({loc.floor})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Operational Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as AssetStatus)}
                className="w-full border border-slate-200 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="Operational">Operational</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Out of Service">Out of Service</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Maintenance Vendor Master</label>
              <select
                value={formVendorId}
                onChange={(e) => setFormVendorId(e.target.value)}
                className="w-full border border-slate-200 rounded-md p-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="">-- In-House Maintenance --</option>
                {MOCK_MAINTENANCE_VENDORS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vendorName} ({v.vendorCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" size="sm" onClick={() => setSelectedAssetForEdit(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!!duplicateCodeWarning}
              className="bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Update Asset
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Drawer: Asset Details & Lifetime History */}
      <Drawer
        isOpen={!!selectedAssetForView}
        onClose={() => setSelectedAssetForView(null)}
        title={`Asset Overview: ${selectedAssetForView?.assetCode || ""}`}
        maxWidth="lg"
      >
        {selectedAssetForView && (
          <div className="space-y-6 p-4 text-xs">
            {/* Header Banner */}
            <div className="bg-slate-900 text-white p-4 rounded-lg flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 font-mono text-slate-300">
                  <span>{selectedAssetForView.assetCode}</span>
                  <span>•</span>
                  <span>{selectedAssetForView.category}</span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">{selectedAssetForView.assetName}</h3>
                <div className="text-slate-300 text-[11px] mt-1 flex items-center gap-3">
                  <span>Loc: {selectedAssetForView.location}</span>
                  {selectedAssetForView.serialNumber && <span>SN: {selectedAssetForView.serialNumber}</span>}
                </div>
              </div>

              <div>
                <span
                  className={cn(
                    "inline-flex items-center text-xs px-2.5 py-1 font-semibold rounded-full",
                    selectedAssetForView.status === "Operational" && "bg-emerald-500 text-white",
                    selectedAssetForView.status === "Under Maintenance" && "bg-amber-500 text-white",
                    selectedAssetForView.status === "Out of Service" && "bg-rose-500 text-white",
                    selectedAssetForView.status === "Decommissioned" && "bg-slate-700 text-slate-200"
                  )}
                >
                  {selectedAssetForView.status}
                </span>
              </div>
            </div>

            {/* Read-only warning if decommissioned */}
            {selectedAssetForView.status === "Decommissioned" && (
              <div className="bg-slate-100 border border-slate-300 p-3.5 rounded-lg flex items-start gap-3">
                <Lock className="h-5 w-5 text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">Decommissioned Asset (Read-Only)</div>
                  <div className="text-slate-600 text-[11px] mt-0.5">
                    Decommissioned on <span className="font-mono font-medium">{selectedAssetForView.decommissionDate}</span>. Reason:{" "}
                    <em>"{selectedAssetForView.decommissionReason || "Lifecycle end"}"</em>.
                  </div>
                  <div className="text-slate-500 text-[10px] mt-1 italic">
                    This asset is permanently retired from active operations. New Work Orders and PM schedules cannot be attached, but full history remains accessible.
                  </div>
                </div>
              </div>
            )}

            {/* Under Maintenance Banner */}
            {selectedAssetForView.status === "Under Maintenance" && selectedAssetForView.activeWorkOrderNo && (
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-semibold">
                  <Wrench className="h-4 w-4 text-amber-600" />
                  <span>Currently Under Active Maintenance Work Order #{selectedAssetForView.activeWorkOrderNo}</span>
                </div>
                <Link href="/maintenance/work-orders">
                  <Button size="sm" variant="outline" className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100 text-xs">
                    View Active WO
                  </Button>
                </Link>
              </div>
            )}

            {/* Tech Specs & Coverage Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
                <h4 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  <Boxes className="h-3.5 w-3.5 text-slate-500" />
                  Technical Specifications
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Manufacturer</span>
                    <span className="font-medium">{selectedAssetForView.manufacturer || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Model Number</span>
                    <span className="font-medium">{selectedAssetForView.model || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Installation Date</span>
                    <span className="font-medium">{selectedAssetForView.installationDate || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Purchase Cost</span>
                    <span className="font-medium">
                      {selectedAssetForView.purchaseCost ? `₹${selectedAssetForView.purchaseCost.toLocaleString()}` : "—"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
                <h4 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
                  Warranty & AMC Coverage
                </h4>
                <div className="space-y-1.5 text-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Warranty Status:</span>
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border",
                        selectedAssetForView.warrantyStatus === "Active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      )}
                    >
                      {selectedAssetForView.warrantyStatus || "Not Specified"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Maintenance Vendor:</span>
                    <span className="font-semibold text-slate-900">
                      {selectedAssetForView.maintenanceVendorName || "In-House Engineering"}
                    </span>
                  </div>

                  {selectedAssetForView.amcReference && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">AMC Contract Ref:</span>
                      <span className="font-mono text-slate-900">{selectedAssetForView.amcReference}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Maintenance Summary KPIs */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-slate-200 p-3 rounded-lg text-center">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Total WOs Handled</div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">
                  {selectedAssetForView.history.length || selectedAssetForView.totalWorkOrdersCount || 0}
                </div>
              </div>
              <div className="bg-white border border-slate-200 p-3 rounded-lg text-center">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Repair Spend</div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">
                  ₹{(selectedAssetForView.totalMaintenanceCost || 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-white border border-slate-200 p-3 rounded-lg text-center">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Next PM Due</div>
                <div className="text-sm font-bold text-indigo-600 mt-1">
                  {selectedAssetForView.nextPmDueDate || "Not Scheduled"}
                </div>
              </div>
            </div>

            {/* Lifetime Repair & Maintenance History Table */}
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <History className="h-4 w-4 text-slate-600" />
                Lifetime Service & Maintenance History
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-600 uppercase">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">WO #</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Work Performed</th>
                      <th className="px-3 py-2">Technician / Vendor</th>
                      <th className="px-3 py-2 text-right">Cost (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedAssetForView.history.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                          No service history recorded for this asset yet.
                        </td>
                      </tr>
                    ) : (
                      selectedAssetForView.history.map((h) => (
                        <tr key={h.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2.5 text-slate-500 font-mono">{h.date}</td>
                          <td className="px-3 py-2.5 font-mono font-semibold text-slate-900">{h.workOrderNo}</td>
                          <td className="px-3 py-2.5">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                              {h.woType}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-800 max-w-xs">{h.description}</td>
                          <td className="px-3 py-2.5 text-slate-600">{h.technicianOrVendor}</td>
                          <td className="px-3 py-2.5 text-right font-mono font-medium">
                            {h.cost > 0 ? `₹${h.cost.toLocaleString()}` : "₹0"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              {selectedAssetForView.status !== "Decommissioned" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAssetForDecommission(selectedAssetForView)}
                  className="border-rose-200 text-rose-700 hover:bg-rose-50 text-xs"
                >
                  <Archive className="h-3.5 w-3.5 mr-1 text-rose-600" />
                  Decommission Asset
                </Button>
              ) : (
                <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5" />
                  Decommissioned Asset (Read-Only)
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAssetForView(null)}
                >
                  Close
                </Button>

                {selectedAssetForView.status !== "Decommissioned" && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const ast = selectedAssetForView;
                      setSelectedAssetForView(null);
                      handleOpenEditDrawer(ast);
                    }}
                    className="bg-slate-900 text-white hover:bg-slate-800"
                  >
                    Edit Asset
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Modal: Decommission Asset */}
      <Modal
        isOpen={!!selectedAssetForDecommission}
        onClose={() => setSelectedAssetForDecommission(null)}
        title="Decommission Asset"
      >
        <form onSubmit={handleDecommissionAsset} className="space-y-4 p-4 text-xs">
          <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Important operational rule:</div>
              <div className="text-[11px] text-amber-800 mt-0.5">
                Once decommissioned, <strong>"{selectedAssetForDecommission?.assetName}"</strong> will become read-only.
                It will remain searchable in history, but cannot be selected for new Work Orders, PM schedules, or maintenance assignments.
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Decommission Date *
            </label>
            <input
              type="date"
              required
              value={decommissionDate}
              onChange={(e) => setDecommissionDate(e.target.value)}
              className="w-full border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Decommission Reason *
            </label>
            <textarea
              rows={3}
              required
              value={decommissionReason}
              onChange={(e) => setDecommissionReason(e.target.value)}
              placeholder="e.g. Beyond economic repair, end of lifecycle (10 yrs), replaced by new generator set..."
              className="w-full border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedAssetForDecommission(null)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-rose-700 text-white hover:bg-rose-800">
              Confirm Decommission
            </Button>
          </div>
        </form>
      </Modal>
    </ModulePageShell>
  );
}
