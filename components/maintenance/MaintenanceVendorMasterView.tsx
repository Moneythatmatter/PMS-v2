"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Truck,
  Search,
  Plus,
  X,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Edit2,
  Eye,
  Building2,
  Filter,
  Layers,
  Wrench,
  ChevronRight,
  ExternalLink,
  Clock,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Badge, Button, Drawer, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";
import { MOCK_MAINTENANCE_VENDORS } from "@/app/data/maintenance/mockData";
import { MaintenanceVendor } from "@/app/data/maintenance/types";

const SERVICE_CATEGORIES = [
  "HVAC / Air Conditioning",
  "Elevators & Escalators",
  "Electrical & Lighting",
  "Plumbing & Sanitary",
  "Safety & Fire",
  "Carpentry & Furniture",
  "Appliances & TV/Electronics",
  "Painting & Civil",
  "General / Other",
];

const SERVICE_TYPES: ("AMC" | "On-Demand" | "Rate Contract" | "Warranty")[] = [
  "AMC",
  "On-Demand",
  "Rate Contract",
  "Warranty",
];

export function MaintenanceVendorMasterView() {
  const [vendors, setVendors] = useState<MaintenanceVendor[]>(MOCK_MAINTENANCE_VENDORS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");

  // Modal / Drawer states
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [selectedVendorForView, setSelectedVendorForView] = useState<MaintenanceVendor | null>(null);
  const [selectedVendorForEdit, setSelectedVendorForEdit] = useState<MaintenanceVendor | null>(null);

  // Form State for Add / Edit
  const [formVendorName, setFormVendorName] = useState("");
  const [formVendorCode, setFormVendorCode] = useState("");
  const [formServiceCategory, setFormServiceCategory] = useState(SERVICE_CATEGORIES[0]);
  const [formContactPerson, setFormContactPerson] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formServiceType, setFormServiceType] = useState<"AMC" | "On-Demand" | "Rate Contract" | "Warranty">("AMC");
  const [formServiceReference, setFormServiceReference] = useState("");
  const [formContractStartDate, setFormContractStartDate] = useState("");
  const [formContractEndDate, setFormContractEndDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formStatus, setFormStatus] = useState<"Active" | "Inactive">("Active");

  // Filtered vendors
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchesSearch =
        v.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.vendorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.serviceCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.serviceReference && v.serviceReference.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategoryFilter === "ALL" || v.serviceCategory === selectedCategoryFilter;
      const matchesType = selectedTypeFilter === "ALL" || v.serviceType === selectedTypeFilter;
      const matchesStatus = selectedStatusFilter === "ALL" || v.status === selectedStatusFilter;

      return matchesSearch && matchesCategory && matchesType && matchesStatus;
    });
  }, [vendors, searchTerm, selectedCategoryFilter, selectedTypeFilter, selectedStatusFilter]);

  // KPI Metrics
  const stats = useMemo(() => {
    return {
      total: vendors.length,
      active: vendors.filter((v) => v.status === "Active").length,
      amcCount: vendors.filter((v) => v.serviceType === "AMC").length,
      onDemandCount: vendors.filter((v) => v.serviceType === "On-Demand").length,
    };
  }, [vendors]);

  const handleOpenAddDrawer = () => {
    const nextCode = `MNT-V-00${vendors.length + 1}`;
    setFormVendorName("");
    setFormVendorCode(nextCode);
    setFormServiceCategory(SERVICE_CATEGORIES[0]);
    setFormContactPerson("");
    setFormPhone("");
    setFormEmail("");
    setFormAddress("");
    setFormServiceType("AMC");
    setFormServiceReference("");
    setFormContractStartDate("");
    setFormContractEndDate("");
    setFormNotes("");
    setFormStatus("Active");
    setIsAddDrawerOpen(true);
  };

  const handleOpenEditDrawer = (v: MaintenanceVendor) => {
    setSelectedVendorForEdit(v);
    setFormVendorName(v.vendorName);
    setFormVendorCode(v.vendorCode);
    setFormServiceCategory(v.serviceCategory);
    setFormContactPerson(v.contactPerson);
    setFormPhone(v.phone);
    setFormEmail(v.email || "");
    setFormAddress(v.address || "");
    setFormServiceType(v.serviceType);
    setFormServiceReference(v.serviceReference || "");
    setFormContractStartDate(v.contractStartDate || "");
    setFormContractEndDate(v.contractEndDate || "");
    setFormNotes(v.notes || "");
    setFormStatus(v.status);
  };

  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVendorName.trim() || !formContactPerson.trim() || !formPhone.trim()) return;

    if (selectedVendorForEdit) {
      // Edit mode
      setVendors((prev) =>
        prev.map((v) =>
          v.id === selectedVendorForEdit.id
            ? {
                ...v,
                vendorName: formVendorName,
                vendorCode: formVendorCode,
                serviceCategory: formServiceCategory,
                contactPerson: formContactPerson,
                phone: formPhone,
                email: formEmail,
                address: formAddress,
                serviceType: formServiceType,
                serviceReference: formServiceReference,
                contractStartDate: formContractStartDate,
                contractEndDate: formContractEndDate,
                notes: formNotes,
                status: formStatus,
              }
            : v
        )
      );
      setSelectedVendorForEdit(null);
    } else {
      // Add mode
      const newVendor: MaintenanceVendor = {
        id: `vnd-${Date.now()}`,
        vendorName: formVendorName,
        vendorCode: formVendorCode || `MNT-V-00${vendors.length + 1}`,
        serviceCategory: formServiceCategory,
        contactPerson: formContactPerson,
        phone: formPhone,
        email: formEmail,
        address: formAddress,
        serviceType: formServiceType,
        serviceReference: formServiceReference,
        contractStartDate: formContractStartDate,
        contractEndDate: formContractEndDate,
        notes: formNotes,
        status: formStatus,
        createdAt: new Date().toISOString(),
      };
      setVendors((prev) => [newVendor, ...prev]);
      setIsAddDrawerOpen(false);
    }
  };

  const handleToggleStatus = (vendorId: string) => {
    setVendors((prev) =>
      prev.map((v) =>
        v.id === vendorId
          ? {
              ...v,
              status: v.status === "Active" ? "Inactive" : "Active",
            }
          : v
      )
    );
  };

  return (
    <ModulePageShell
      breadcrumbs={[
        { label: "Maintenance & Engineering", href: "/maintenance" },
        { label: "Masters", href: "/maintenance/masters" },
        { label: "Vendor Master" },
      ]}
      title="Maintenance Vendor Master"
      description="Directory of specialized external engineering contractors, AMC providers, warranty technicians, and equipment service partners."
      secondaryActions={
        <div className="flex items-center gap-2">
          <Link href="/maintenance/work-orders">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs font-semibold rounded-lg h-9 flex items-center gap-1.5"
            >
              <Wrench className="h-3.5 w-3.5" /> View Work Orders
            </Button>
          </Link>
          <Button
            type="button"
            size="sm"
            onClick={handleOpenAddDrawer}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs h-9 shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add Service Vendor
          </Button>
        </div>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: KPI CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium text-xs">Total Vendors</span>
            <Truck className="h-4 w-4 text-slate-400" />
          </div>
          <strong className="text-xl font-bold text-slate-900 block mt-1">{stats.total}</strong>
          <span className="text-[10px] text-emerald-600 font-semibold">{stats.active} active partners</span>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium text-xs">Active AMC Contracts</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <strong className="text-xl font-bold text-slate-900 block mt-1">{stats.amcCount}</strong>
          <span className="text-[10px] text-slate-400">Annual maintenance contracts</span>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium text-xs">On-Demand &amp; Rate</span>
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <strong className="text-xl font-bold text-slate-900 block mt-1">{stats.onDemandCount}</strong>
          <span className="text-[10px] text-slate-400">Emergency &amp; unit rate basis</span>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium text-xs">Trades Covered</span>
            <Layers className="h-4 w-4 text-amber-600" />
          </div>
          <strong className="text-xl font-bold text-slate-900 block mt-1">7 Categories</strong>
          <span className="text-[10px] text-slate-400">HVAC, Lift, DG, Fire, Civil</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: SEARCH & FILTER BAR
      ───────────────────────────────────────────────────────────── */}
      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs mb-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
          {/* Search (5 cols) */}
          <div className="md:col-span-5 relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vendor name, code, contact person, or AMC reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8.5 w-full pl-9 pr-3 rounded-lg border border-slate-200 text-xs bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Service Category Filter (3 cols) */}
          <div className="md:col-span-3">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="h-8.5 w-full px-2.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Service Categories</option>
              {SERVICE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Service Type Filter (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="h-8.5 w-full px-2.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Contract Types</option>
              {SERVICE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="h-8.5 w-full px-2.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: VENDORS TABLE
      ───────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500">
              <tr>
                <th className="py-2.5 px-4">Vendor Code &amp; Name</th>
                <th className="py-2.5 px-3">Service Category</th>
                <th className="py-2.5 px-3">Contact Person</th>
                <th className="py-2.5 px-3">Phone &amp; Email</th>
                <th className="py-2.5 px-3">Contract Type &amp; Ref</th>
                <th className="py-2.5 px-3">Validity</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredVendors.length > 0 ? (
                filteredVendors.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => setSelectedVendorForView(v)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* 1. Code & Name */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <strong className="font-bold text-slate-900 group-hover:text-emerald-700 transition block">
                        {v.vendorName}
                      </strong>
                      <span className="font-mono text-[10px] text-slate-400 block">{v.vendorCode}</span>
                    </td>

                    {/* 2. Service Category */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="rounded px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {v.serviceCategory}
                      </span>
                    </td>

                    {/* 3. Contact Person */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <strong className="font-semibold text-slate-900">{v.contactPerson}</strong>
                    </td>

                    {/* 4. Phone & Email */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-slate-800 font-mono text-[11px]">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>{v.phone}</span>
                      </div>
                      {v.email && (
                        <div className="flex items-center gap-1 text-slate-400 text-[10px] mt-0.5">
                          <Mail className="h-2.5 w-2.5" />
                          <span className="truncate max-w-[160px]">{v.email}</span>
                        </div>
                      )}
                    </td>

                    {/* 5. Contract Type & Ref */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold border",
                          v.serviceType === "AMC"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : v.serviceType === "Rate Contract"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : v.serviceType === "Warranty"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        )}
                      >
                        {v.serviceType}
                      </span>
                      {v.serviceReference && (
                        <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                          Ref: {v.serviceReference}
                        </span>
                      )}
                    </td>

                    {/* 6. Validity */}
                    <td className="py-3 px-3 whitespace-nowrap text-[11px]">
                      {v.contractEndDate ? (
                        <div className="text-slate-700 font-medium">
                          <span>Valid till </span>
                          <span className="font-semibold font-mono text-slate-900">{v.contractEndDate}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">On Call / Continuous</span>
                      )}
                    </td>

                    {/* 7. Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold border",
                          v.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        )}
                      >
                        {v.status}
                      </span>
                    </td>

                    {/* 8. Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditDrawer(v)}
                          className="h-7 px-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded cursor-pointer"
                        >
                          <Edit2 className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(v.id)}
                          className={cn(
                            "h-7 px-2 text-[11px] font-bold rounded cursor-pointer",
                            v.status === "Active"
                              ? "text-slate-600 hover:text-rose-700 border-slate-200"
                              : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                          )}
                        >
                          {v.status === "Active" ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Truck className="h-8 w-8 mx-auto text-slate-300" />
                      <strong className="text-sm font-bold text-slate-800 block">No vendors found</strong>
                      <p className="text-xs text-slate-400">
                        {searchTerm || selectedCategoryFilter !== "ALL" || selectedTypeFilter !== "ALL" || selectedStatusFilter !== "ALL"
                          ? "No vendor records match your active search or filters."
                          : "No external service vendors recorded yet. Click 'Add Service Vendor' to register one."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: ADD / EDIT VENDOR DRAWER
      ───────────────────────────────────────────────────────────── */}
      {(isAddDrawerOpen || selectedVendorForEdit) && (
        <Drawer
          isOpen={isAddDrawerOpen || Boolean(selectedVendorForEdit)}
          onClose={() => {
            setIsAddDrawerOpen(false);
            setSelectedVendorForEdit(null);
          }}
          title={selectedVendorForEdit ? `Edit Vendor — ${selectedVendorForEdit.vendorName}` : "Add Maintenance Service Vendor"}
          maxWidth="md"
        >
          <form onSubmit={handleSaveVendor} className="space-y-4 p-1 text-xs">
            {/* Vendor Code & Name */}
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Vendor Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formVendorCode}
                  onChange={(e) => setFormVendorCode(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs text-slate-900"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Vendor / Contractor Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Voltas Commercial Air Systems Pvt Ltd"
                  value={formVendorName}
                  onChange={(e) => setFormVendorName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs text-slate-900"
                />
              </div>
            </div>

            {/* Service Category & Contract Type */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Service Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formServiceCategory}
                  onChange={(e) => setFormServiceCategory(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs text-slate-900"
                >
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Service Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formServiceType}
                  onChange={(e) =>
                    setFormServiceType(e.target.value as "AMC" | "On-Demand" | "Rate Contract" | "Warranty")
                  }
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs text-slate-900"
                >
                  {SERVICE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contact Person & Phone */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Primary Contact Person <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunil Verma (Service Lead)"
                  value={formContactPerson}
                  onChange={(e) => setFormContactPerson(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98210 44551"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs text-slate-900"
                />
              </div>
            </div>

            {/* Email & AMC Reference */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. service@voltas.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  AMC / Contract Reference Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. AMC-VLT-2026-089"
                  value={formServiceReference}
                  onChange={(e) => setFormServiceReference(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs text-slate-900"
                />
              </div>
            </div>

            {/* Contract Dates */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Contract Start Date</label>
                <input
                  type="date"
                  value={formContractStartDate}
                  onChange={(e) => setFormContractStartDate(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Contract End Date</label>
                <input
                  type="date"
                  value={formContractEndDate}
                  onChange={(e) => setFormContractEndDate(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs text-slate-900"
                />
              </div>
            </div>

            {/* Office Address */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Office / Workshop Address</label>
              <textarea
                rows={2}
                placeholder="Complete address, workshop location, dispatch hub..."
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs leading-relaxed"
              />
            </div>

            {/* Scope / Notes & Status */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="col-span-2">
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  SLA / Scope &amp; Special Terms
                </label>
                <input
                  type="text"
                  placeholder="e.g. 24x7 emergency callout, 4 free quarterly services..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as "Active" | "Inactive")}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-bold text-xs"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAddDrawerOpen(false);
                  setSelectedVendorForEdit(null);
                }}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs px-4 cursor-pointer"
              >
                {selectedVendorForEdit ? "Save Vendor Changes ✓" : "Register Service Vendor ✓"}
              </Button>
            </div>
          </form>
        </Drawer>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: VIEW VENDOR PROFILE DRAWER
      ───────────────────────────────────────────────────────────── */}
      {selectedVendorForView && (
        <Drawer
          isOpen={Boolean(selectedVendorForView)}
          onClose={() => setSelectedVendorForView(null)}
          title={selectedVendorForView.vendorName}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs p-1">
            {/* Header Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-900">{selectedVendorForView.vendorCode}</span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                    selectedVendorForView.status === "Active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  )}
                >
                  {selectedVendorForView.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{selectedVendorForView.vendorName}</h3>
              <div className="flex items-center gap-2">
                <span className="rounded px-2 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 text-slate-700">
                  {selectedVendorForView.serviceCategory}
                </span>
                <span className="rounded px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {selectedVendorForView.serviceType}
                </span>
              </div>
            </div>

            {/* Contact Details */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
              <strong className="text-xs font-bold text-slate-900 block border-b border-slate-100 pb-1.5">
                Contact &amp; Communication
              </strong>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Contact Person</span>
                  <strong className="text-slate-900">{selectedVendorForView.contactPerson}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Phone Number</span>
                  <a
                    href={`tel:${selectedVendorForView.phone}`}
                    className="font-mono font-bold text-emerald-700 hover:underline"
                  >
                    {selectedVendorForView.phone}
                  </a>
                </div>
                {selectedVendorForView.email && (
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 block font-bold">Email</span>
                    <a
                      href={`mailto:${selectedVendorForView.email}`}
                      className="text-slate-800 hover:text-emerald-700 hover:underline"
                    >
                      {selectedVendorForView.email}
                    </a>
                  </div>
                )}
                {selectedVendorForView.address && (
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 block font-bold">Address</span>
                    <p className="text-slate-700 leading-relaxed">{selectedVendorForView.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Contract & AMC Details */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
              <strong className="text-xs font-bold text-slate-900 block border-b border-slate-100 pb-1.5">
                Contract &amp; SLA Terms
              </strong>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Contract Type</span>
                  <span className="font-semibold text-slate-900">{selectedVendorForView.serviceType}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">AMC Reference #</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedVendorForView.serviceReference || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">Start Date</span>
                  <span className="font-mono text-slate-700">{selectedVendorForView.contractStartDate || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">End / Renewal Date</span>
                  <span className="font-mono text-slate-700">{selectedVendorForView.contractEndDate || "Continuous"}</span>
                </div>
                {selectedVendorForView.notes && (
                  <div className="col-span-2 pt-1 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-bold">Notes &amp; Scope</span>
                    <p className="text-slate-700 leading-relaxed mt-0.5">{selectedVendorForView.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const v = selectedVendorForView;
                  setSelectedVendorForView(null);
                  handleOpenEditDrawer(v);
                }}
                className="text-xs font-semibold rounded-lg"
              >
                <Edit2 className="h-3 w-3 mr-1" /> Edit Profile
              </Button>

              <Link href="/maintenance/work-orders">
                <Button
                  type="button"
                  size="sm"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Wrench className="h-3.5 w-3.5" /> Dispatch Work Order →
                </Button>
              </Link>
            </div>
          </div>
        </Drawer>
      )}
    </ModulePageShell>
  );
}
