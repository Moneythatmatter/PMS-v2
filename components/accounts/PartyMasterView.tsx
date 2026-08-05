"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  Search,
  Plus,
  Save,
  X,
  Printer,
  Download,
  Trash2,
  CheckCircle2,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  Building,
  DollarSign,
  Percent,
  SlidersHorizontal,
  Filter,
  RefreshCw,
  Clock,
  Receipt,
  FileCheck2,
  Paperclip,
  History,
  Info,
  ChevronRight,
  ShieldCheck,
  Ban,
  Globe,
  Settings,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  TextInput,
  SelectInput,
  TextAreaInput,
  StatMiniCard,
  formatINR,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  samplePartyTypesList,
  sampleCitiesList,
  sampleStatesList,
  samplePartyMasterData,
  PartyMasterRecord,
} from "@/app/data/accounts/partyMasterData";
import { cn } from "@/lib/utils";

export function PartyMasterView() {
  // Master Party List & Active Selection State
  const [parties, setParties] = useState<PartyMasterRecord[]>(samplePartyMasterData);
  const [selectedId, setSelectedId] = useState<string>(samplePartyMasterData[0].id);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("All Types");
  const [selectedCityFilter, setSelectedCityFilter] = useState("All Cities");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("All");

  // Selected Active Party Record
  const activeParty = useMemo(
    () => parties.find((p) => p.id === selectedId) || parties[0],
    [parties, selectedId]
  );

  // Form State (Derived from active party for full editing)
  const [formData, setFormData] = useState<PartyMasterRecord>(activeParty);

  // Sectional Tab State (Identical to Company Settings: 'general' | 'address' | 'accounts' | 'tax' | 'hotel')
  const [activeTab, setActiveTab] = useState<
    "general" | "address" | "accounts" | "tax" | "hotel"
  >("general");

  // Additional Party Header & Config State
  const [isApproved, setIsApproved] = useState(true);
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [contactSalutation, setContactSalutation] = useState("Mr.");
  const [contactFirstName, setContactFirstName] = useState("Jayesh");
  const [contactLastName, setContactLastName] = useState("Patel");
  const [designation, setDesignation] = useState("Senior Finance Manager");

  // Others Tab Specific Fields
  const [region, setRegion] = useState("WESTERN REGION - GUJARAT");
  const [partyGroup, setPartyGroup] = useState("CORPORATE ACCOUNTS GROUP");
  const [gstRegType, setGstRegType] = useState("B2B REGULAR");
  const [isUin, setIsUin] = useState(false);
  const [specialType, setSpecialType] = useState("<None>");

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Update formData when activeParty changes
  React.useEffect(() => {
    setFormData({ ...activeParty });
    if (activeParty.contactPerson) {
      const parts = activeParty.contactPerson.split(" ");
      if (parts.length > 1) {
        setContactSalutation(parts[0]);
        setContactFirstName(parts[1] || "");
        setContactLastName(parts.slice(2).join(" ") || "");
      }
    }
  }, [activeParty]);

  // Filtered Party List
  const filteredParties = useMemo(() => {
    return parties.filter((p) => {
      if (selectedTypeFilter !== "All Types" && p.partyType !== selectedTypeFilter) {
        return false;
      }
      if (selectedCityFilter !== "All Cities" && p.city !== selectedCityFilter) {
        return false;
      }
      if (selectedStatusFilter !== "All" && p.status !== selectedStatusFilter) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          p.partyName.toLowerCase().includes(q) ||
          p.partyCode.toLowerCase().includes(q) ||
          p.gstNumber.toLowerCase().includes(q) ||
          p.panNumber.toLowerCase().includes(q) ||
          p.mobile.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.ledgerName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [parties, selectedTypeFilter, selectedCityFilter, selectedStatusFilter, searchQuery]);

  // Form Field Change Handler
  const handleFormChange = (field: keyof PartyMasterRecord, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Applicable For Array Checkbox Toggle
  const handleToggleApplicableFor = (val: PartyMasterRecord["applicableFor"][number]) => {
    const current = formData.applicableFor || [];
    const next = current.includes(val)
      ? current.filter((item) => item !== val)
      : [...current, val];
    setFormData((prev) => ({ ...prev, applicableFor: next }));
  };

  // Handlers for Top Action Buttons
  const handleNewParty = () => {
    const nextCode = `P-${Math.floor(10000 + Math.random() * 90000)}`;
    const newRecord: PartyMasterRecord = {
      id: `party-${Date.now()}`,
      partyCode: nextCode,
      partyName: "NEW PARTY ACCOUNT",
      alias: "NEW",
      partyType: "Customer / Debtor",
      partySubType: "General Client",
      ledgerName: "Sundry Debtors",
      openingBalance: 0,
      openingType: "Dr",
      creditLimit: 100000,
      status: "Active",

      contactPerson: "Mr. New Contact",
      mobile: "",
      phone: "",
      email: "",
      website: "",

      addressLine1: "",
      addressLine2: "",
      city: "Bharuch",
      district: "Bharuch",
      state: "Gujarat",
      country: "India",
      pincode: "392001",

      gstNumber: "",
      panNumber: "",
      tanNumber: "",
      msmeNumber: "",
      taxCategory: "Regular GST Registered",

      paymentTerms: "Net 30 Days",
      creditDays: 30,
      preferredPaymentMode: "NEFT / RTGS",
      bankName: "HDFC Bank",
      branch: "Dahej Branch",
      ifscCode: "HDFC0000129",
      accountNumber: "502000119900",
      upiId: "newparty@hdfc",

      receivableAccount: "1195 - SUNDRY DEBTORS",
      payableAccount: "2410 - Sundry Creditors",
      defaultCurrency: "INR",
      costCenter: true,
      analysisGroup: "General Sales",
      tdsApplicable: true,
      tcsApplicable: false,

      applicableFor: ["Guest"],
      roomCommissionPct: 0,
      travelAgentCommissionPct: 0,
      corporateDiscountPct: 0,

      remarks: "",
      outstandingBalance: 0,
      totalReceipts: 0,
      totalPayments: 0,
      lastTxnDate: "N/A",
      lastInvoiceNo: "N/A",
    };

    setParties([newRecord, ...parties]);
    setSelectedId(newRecord.id);
    setFormData(newRecord);
    setToastMessage(`Prepared fresh Party Master record (${nextCode}).`);
  };

  const handleSaveParty = () => {
    if (!formData.partyName.trim()) {
      setToastMessage("Please enter a valid Party Name.");
      return;
    }
    const fullContact = `${contactSalutation} ${contactFirstName} ${contactLastName}`.trim();
    const updated = { ...formData, contactPerson: fullContact };
    setParties((prev) =>
      prev.map((p) => (p.id === formData.id ? updated : p))
    );
    setFormData(updated);
    setToastMessage(`Party Master record '${formData.partyName}' (${formData.partyCode}) saved successfully!`);
  };

  const handleSaveAndNew = () => {
    handleSaveParty();
    handleNewParty();
  };

  const handleDeleteParty = () => {
    if (parties.length <= 1) {
      setToastMessage("Cannot delete the last remaining Party Master record.");
      return;
    }
    setParties((prev) => prev.filter((p) => p.id !== formData.id));
    const remaining = parties.filter((p) => p.id !== formData.id);
    if (remaining.length > 0) {
      setSelectedId(remaining[0].id);
    }
    setToastMessage(`Deleted party '${formData.partyName}'.`);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedTypeFilter("All Types");
    setSelectedCityFilter("All Cities");
    setSelectedStatusFilter("All");
    setToastMessage("Cleared search filters.");
  };

  const handleExportCSV = () => {
    const csvHeader = "PartyCode,PartyName,PartyType,City,Mobile,Email,GSTIN,Outstanding\n";
    const csvRows = filteredParties
      .map(
        (p) =>
          `"${p.partyCode}","${p.partyName}","${p.partyType}","${p.city}","${p.mobile}","${p.email}","${p.gstNumber}","${p.outstandingBalance}"`
      )
      .join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Party_Master_Report_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage("Exported Party Master list to CSV.");
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & Masters"
      title="Party Master"
      description="Create and manage customers, vendors, travel agents, companies, corporate clients, employees and all accounting parties."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Masters", href: "/accounts/masters" },
        { label: "Party Master" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNewParty}
            className="rounded-xl text-xs font-bold bg-white text-slate-800 border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            New Party
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSaveParty}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            Save
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveAndNew}
            className="rounded-xl text-xs font-bold bg-white text-slate-800 border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            Save & New
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDeleteParty}
            className="rounded-xl text-xs font-semibold bg-white border-rose-200 hover:bg-rose-50 text-rose-700 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1 text-rose-600" />
            Delete
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Print
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Export Config
          </Button>
        </div>
      }
    >
      {/* Top Active Target Entity Selector Bar (Matching Company Settings UI) */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <Building2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <span className="font-bold text-xs text-slate-600 block">Target Party Master Entity:</span>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="h-8 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.partyName} ({p.partyCode}) — {p.partyType}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-slate-700 border border-slate-200 font-mono">
              <Calendar className="h-3.5 w-3.5 text-slate-600" />
              FY: 2026-2027
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1 text-emerald-800 font-bold border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
              Status: {formData.status} Party
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-1 text-rose-800 font-mono font-bold border border-rose-200">
              Outstanding: {formatINR(formData.outstandingBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Screen (35% Left Party List / 65% Right Form Tabs) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        {/* LEFT PANEL (35% Desktop / 40% Tablet / 100% Mobile) - Party List */}
        <div className="md:col-span-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col min-h-[620px]">
          <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Party Master List ({filteredParties.length})
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              Master
            </span>
          </div>

          {/* Quick Search */}
          <div className="mb-3 relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name, Code, GSTIN..."
              className="h-8 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Party List Cards Container */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[620px]">
            {filteredParties.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-medium text-xs">
                No party master records found.
              </div>
            ) : (
              filteredParties.map((item) => {
                const isSelected = selectedId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={cn(
                      "p-3 rounded-xl border transition-all duration-150 cursor-pointer space-y-1.5",
                      isSelected
                        ? "bg-emerald-50/90 border-emerald-500 ring-1 ring-emerald-500 shadow-2xs"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-[11px] text-slate-500 block">
                          {item.partyCode}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 leading-snug">
                          {item.partyName}
                        </h4>
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 border",
                          item.status === "Active"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        )}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Building2 className="h-3 w-3 text-slate-500" />
                        {item.partyType}
                      </span>

                      <span className="font-mono font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                        {formatINR(item.outstandingBalance)} {item.openingType}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL (65% Desktop / 60% Tablet / 100% Mobile) - Section Navigation Tabs & Form Content */}
        <div className="md:col-span-8 space-y-4 font-sans text-xs">
          {/* Section Navigation Tabs (IDENTICAL TO COMPANY SETTINGS TAB BAR) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xs flex border-b border-slate-200 overflow-x-auto gap-1">
            {[
              { id: "general", label: "General & Particulars", icon: Settings },
              { id: "address", label: "Address & Contact", icon: MapPin },
              { id: "accounts", label: "Accounting & Banking", icon: CreditCard },
              { id: "tax", label: "Tax & Statutory", icon: ShieldCheck },
              { id: "hotel", label: "Hotel & Operational Terms", icon: Building },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer",
                    isActive
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Content Cards (Matching Company Settings Styling) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs font-sans text-xs space-y-5">
            {/* TAB 1: GENERAL & PARTICULAR DETAILS */}
            {activeTab === "general" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <Settings className="h-4 w-4 text-emerald-600" />
                  Party Particulars & Identity
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Party Type" required>
                    <SelectInput
                      value={formData.partyType}
                      onChange={(e) => handleFormChange("partyType", e.target.value)}
                      className="font-bold text-slate-900 bg-white h-9"
                    >
                      <option value="Customer / Debtor">Customer</option>
                      <option value="Employee">Employee</option>
                      <option value="Vendor / Creditor">Supplier / Vendor</option>
                      <option value="Travel Agent">Travel Agent</option>
                      <option value="Corporate Client">Corporate Client</option>
                    </SelectInput>
                  </FormField>

                  <FormField label="Party Sub Type">
                    <SelectInput
                      value={formData.partySubType}
                      onChange={(e) => handleFormChange("partySubType", e.target.value)}
                      className="bg-white font-semibold h-9"
                    >
                      <option value="Company">Company</option>
                      <option value="Individual">Individual</option>
                      <option value="OTA Agent">OTA Agent</option>
                      <option value="F&B Supplier">F&B Supplier</option>
                    </SelectInput>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Party ID / Code" required>
                    <div className="flex items-center gap-2">
                      <TextInput
                        value={formData.partyCode}
                        onChange={(e) => handleFormChange("partyCode", e.target.value)}
                        className="font-mono font-bold text-slate-900 bg-white h-9"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setToastMessage("Checked Party ID code in system.")}
                        className="h-9 px-3 text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 shrink-0 cursor-pointer"
                      >
                        Chk. ID
                      </Button>
                    </div>
                  </FormField>

                  <FormField label="Short Name / Alias">
                    <TextInput
                      value={formData.alias}
                      onChange={(e) => handleFormChange("alias", e.target.value)}
                      placeholder="Short alias..."
                      className="font-semibold bg-white h-9"
                    />
                  </FormField>
                </div>

                <FormField label="Party Name" required>
                  <div className="flex items-center gap-2">
                    <TextInput
                      value={formData.partyName}
                      onChange={(e) => handleFormChange("partyName", e.target.value)}
                      placeholder="Official party name..."
                      className="font-bold text-slate-900 text-sm bg-white h-9"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setToastMessage("Checked party name. No duplicates found.")}
                      className="h-9 px-3 text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 shrink-0 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Search className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Chk. Duplicates</span>
                    </Button>
                  </div>
                </FormField>

                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                    <input
                      type="checkbox"
                      checked={formData.status === "Active"}
                      onChange={(e) => handleFormChange("status", e.target.checked ? "Active" : "Inactive")}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>Active Party, Yes</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 text-xs">
                    <input
                      type="checkbox"
                      checked={isApproved}
                      onChange={(e) => setIsApproved(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>Agent</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-800 text-xs">
                    <input
                      type="checkbox"
                      checked={isApproved}
                      onChange={(e) => setIsApproved(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>Approved Party</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-700 text-xs">
                    <input
                      type="checkbox"
                      checked={isBlacklisted}
                      onChange={(e) => setIsBlacklisted(e.target.checked)}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                    />
                    <span>Black Listed Party</span>
                  </label>
                </div>
              </div>
            )}

            {/* TAB 2: ADDRESS & CONTACT */}
            {activeTab === "address" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  Address Particulars
                </h3>

                <FormField label="Address">
                  <div className="space-y-2">
                    <TextInput
                      value={formData.addressLine1}
                      onChange={(e) => handleFormChange("addressLine1", e.target.value)}
                      placeholder="Address Line 1..."
                      className="h-9"
                    />
                    <TextInput
                      value={formData.addressLine2}
                      onChange={(e) => handleFormChange("addressLine2", e.target.value)}
                      placeholder="Address Line 2..."
                      className="h-9"
                    />
                  </div>
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="City">
                    <TextInput
                      value={formData.city}
                      onChange={(e) => handleFormChange("city", e.target.value)}
                      className="h-9 font-semibold"
                    />
                  </FormField>

                  <FormField label="State">
                    <TextInput
                      value={formData.state}
                      onChange={(e) => handleFormChange("state", e.target.value)}
                      className="h-9 font-semibold"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Zip Code (Pincode)">
                    <TextInput
                      value={formData.pincode}
                      onChange={(e) => handleFormChange("pincode", e.target.value)}
                      className="h-9 font-mono"
                    />
                  </FormField>

                  <FormField label="Country">
                    <SelectInput
                      value={formData.country}
                      onChange={(e) => handleFormChange("country", e.target.value)}
                      className="h-9 font-semibold"
                    >
                      <option value="India">INDIA</option>
                      <option value="United States">UNITED STATES</option>
                      <option value="United Arab Emirates">UNITED ARAB EMIRATES</option>
                      <option value="United Kingdom">UNITED KINGDOM</option>
                    </SelectInput>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField label="Phone No 1">
                    <TextInput
                      value={formData.phone}
                      onChange={(e) => handleFormChange("phone", e.target.value)}
                      placeholder="Primary landline..."
                      className="h-9 font-mono"
                    />
                  </FormField>

                  <FormField label="Phone No 2">
                    <TextInput
                      value={formData.mobile}
                      onChange={(e) => handleFormChange("mobile", e.target.value)}
                      placeholder="Secondary mobile..."
                      className="h-9 font-mono"
                    />
                  </FormField>

                  <FormField label="Fax No">
                    <TextInput placeholder="Fax No..." className="h-9 font-mono" />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="EMail">
                    <TextInput
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFormChange("email", e.target.value)}
                      className="h-9"
                    />
                  </FormField>

                  <FormField label="Web Site">
                    <TextInput
                      value={formData.website}
                      onChange={(e) => handleFormChange("website", e.target.value)}
                      className="h-9"
                    />
                  </FormField>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-800 text-[11px] block">Contact Person Details</span>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-2">
                      <SelectInput
                        value={contactSalutation}
                        onChange={(e) => setContactSalutation(e.target.value)}
                        className="h-9"
                      >
                        <option value="Mr.">Mr.</option>
                        <option value="Ms.">Ms.</option>
                        <option value="Dr.">Dr.</option>
                      </SelectInput>
                    </div>
                    <div className="sm:col-span-5">
                      <TextInput
                        value={contactLastName}
                        onChange={(e) => setContactLastName(e.target.value)}
                        placeholder="Last Name"
                        className="h-9"
                      />
                    </div>
                    <div className="sm:col-span-5">
                      <TextInput
                        value={contactFirstName}
                        onChange={(e) => setContactFirstName(e.target.value)}
                        placeholder="First Name"
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <FormField label="Designation">
                      <TextInput
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="e.g. Finance Director"
                        className="h-9"
                      />
                    </FormField>

                    <FormField label="Pan No">
                      <TextInput
                        value={formData.panNumber}
                        onChange={(e) => handleFormChange("panNumber", e.target.value)}
                        className="font-mono uppercase font-semibold h-9"
                      />
                    </FormField>
                  </div>
                </div>

                <FormField label="Remarks">
                  <TextAreaInput
                    rows={3}
                    value={formData.remarks}
                    onChange={(e) => handleFormChange("remarks", e.target.value)}
                    placeholder="Enter remarks..."
                  />
                </FormField>
              </div>
            )}

            {/* TAB 3: ACCOUNTING & BANKING */}
            {activeTab === "accounts" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  Sub Ledger & Banking Setup
                </h3>

                <FormField label="Sub Ledger Control A/c">
                  <div className="flex items-center gap-3">
                    <SelectInput
                      value={formData.ledgerName}
                      onChange={(e) => handleFormChange("ledgerName", e.target.value)}
                      className="flex-1 font-bold text-slate-900 h-9"
                    >
                      <option value="SUNDRY DEBTORS">SUNDRY DEBTORS</option>
                      <option value="Sundry Debtors - Travel Agents">Sundry Debtors - Travel Agents</option>
                      <option value="Sundry Debtors - Corporate">Sundry Debtors - Corporate</option>
                      <option value="Sundry Creditors - Supplies">Sundry Creditors - Supplies</option>
                    </SelectInput>
                    <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={true}
                        readOnly
                        className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                      />
                      <span>Link Account</span>
                    </label>
                  </div>
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField label="Credit Days">
                    <TextInput
                      type="number"
                      value={formData.creditDays}
                      onChange={(e) => handleFormChange("creditDays", parseInt(e.target.value) || 0)}
                      className="font-mono font-bold text-right h-9"
                    />
                  </FormField>

                  <FormField label="Credit Limit (₹)">
                    <TextInput
                      type="number"
                      value={formData.creditLimit}
                      onChange={(e) => handleFormChange("creditLimit", parseFloat(e.target.value) || 0)}
                      className="font-mono font-bold text-right h-9"
                    />
                  </FormField>

                  <FormField label="Admissible Discount %">
                    <TextInput
                      type="number"
                      value={formData.corporateDiscountPct || 0}
                      onChange={(e) => handleFormChange("corporateDiscountPct", parseFloat(e.target.value) || 0)}
                      className="font-mono font-bold text-right h-9"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Bank Name">
                    <TextInput
                      value={formData.bankName}
                      onChange={(e) => handleFormChange("bankName", e.target.value)}
                      className="h-9"
                    />
                  </FormField>

                  <FormField label="Bank IFSC Code">
                    <TextInput
                      value={formData.ifscCode}
                      onChange={(e) => handleFormChange("ifscCode", e.target.value)}
                      className="font-mono uppercase font-semibold h-9"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField label="Bank Account No">
                    <TextInput
                      value={formData.accountNumber}
                      onChange={(e) => handleFormChange("accountNumber", e.target.value)}
                      className="font-mono font-semibold h-9"
                    />
                  </FormField>

                  <FormField label="Account Type">
                    <SelectInput
                      value={formData.preferredPaymentMode}
                      onChange={(e) => handleFormChange("preferredPaymentMode", e.target.value)}
                      className="h-9"
                    >
                      <option value="Current Account">Current Account</option>
                      <option value="Savings Account">Savings Account</option>
                      <option value="NEFT / RTGS">NEFT / RTGS</option>
                    </SelectInput>
                  </FormField>

                  <FormField label="Branch Name">
                    <TextInput
                      value={formData.branch}
                      onChange={(e) => handleFormChange("branch", e.target.value)}
                      className="h-9"
                    />
                  </FormField>
                </div>
              </div>
            )}

            {/* TAB 4: TAX & STATUTORY */}
            {activeTab === "tax" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Tax & Statutory Parameters
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Accounting Region">
                    <SelectInput
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="bg-white font-semibold h-9"
                    >
                      <option value="WESTERN REGION - GUJARAT">WESTERN REGION - GUJARAT</option>
                      <option value="NORTHERN REGION - DELHI NCR">NORTHERN REGION - DELHI NCR</option>
                      <option value="SOUTHERN REGION - KARNATAKA">SOUTHERN REGION - KARNATAKA</option>
                      <option value="EASTERN REGION - WEST BENGAL">EASTERN REGION - WEST BENGAL</option>
                    </SelectInput>
                  </FormField>

                  <FormField label="Party Group">
                    <SelectInput
                      value={partyGroup}
                      onChange={(e) => setPartyGroup(e.target.value)}
                      className="bg-white font-semibold h-9"
                    >
                      <option value="CORPORATE ACCOUNTS GROUP">CORPORATE ACCOUNTS GROUP</option>
                      <option value="TRAVEL AGENTS GROUP">TRAVEL AGENTS GROUP</option>
                      <option value="HOTEL SUPPLIERS GROUP">HOTEL SUPPLIERS GROUP</option>
                      <option value="INDIVIDUAL GUESTS GROUP">INDIVIDUAL GUESTS GROUP</option>
                    </SelectInput>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField label="GST Number (GSTIN)">
                    <TextInput
                      value={formData.gstNumber}
                      onChange={(e) => handleFormChange("gstNumber", e.target.value)}
                      placeholder="e.g. 24AAACS3407L1ZI"
                      className="font-mono uppercase font-bold text-slate-900 bg-white h-9"
                    />
                  </FormField>

                  <FormField label="GST Registration Type">
                    <SelectInput
                      value={gstRegType}
                      onChange={(e) => setGstRegType(e.target.value)}
                      className="bg-white font-bold text-slate-900 h-9"
                    >
                      <option value="B2B REGULAR">B2B REGULAR</option>
                      <option value="B2C SMALL">B2C SMALL</option>
                      <option value="SEZ DEVELOPER">SEZ DEVELOPER</option>
                      <option value="DEEMED EXPORT">DEEMED EXPORT</option>
                      <option value="COMPOSITION">COMPOSITION</option>
                    </SelectInput>
                  </FormField>

                  <FormField label="State">
                    <SelectInput
                      value={formData.state}
                      onChange={(e) => handleFormChange("state", e.target.value)}
                      className="bg-white font-semibold h-9"
                    >
                      {sampleStatesList.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <FormField label="Special GST Classification">
                    <SelectInput
                      value={specialType}
                      onChange={(e) => setSpecialType(e.target.value)}
                      className="bg-white h-9"
                    >
                      <option value="<None>">&lt;None&gt;</option>
                      <option value="SEZ Developer">SEZ Developer</option>
                      <option value="SEZ Unit">SEZ Unit</option>
                      <option value="Deemed Export">Deemed Export</option>
                    </SelectInput>
                  </FormField>

                  <FormField label="TAN Number">
                    <TextInput
                      value={formData.tanNumber}
                      onChange={(e) => handleFormChange("tanNumber", e.target.value)}
                      placeholder="TAN Number..."
                      className="font-mono uppercase bg-white h-9"
                    />
                  </FormField>

                  <FormField label="MSME Registration No">
                    <TextInput
                      value={formData.msmeNumber}
                      onChange={(e) => handleFormChange("msmeNumber", e.target.value)}
                      placeholder="MSME Udyam No..."
                      className="bg-white h-9"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Receivable Control Account">
                    <TextInput
                      value={formData.receivableAccount}
                      onChange={(e) => handleFormChange("receivableAccount", e.target.value)}
                      className="bg-white font-semibold h-9"
                    />
                  </FormField>

                  <FormField label="Payable Control Account">
                    <TextInput
                      value={formData.payableAccount}
                      onChange={(e) => handleFormChange("payableAccount", e.target.value)}
                      className="bg-white font-semibold h-9"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.costCenter)}
                      onChange={(e) => handleFormChange("costCenter", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                    />
                    <span>Cost Center Tracking</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.tdsApplicable)}
                      onChange={(e) => handleFormChange("tdsApplicable", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                    />
                    <span>TDS Auto-Deduction</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.tcsApplicable)}
                      onChange={(e) => handleFormChange("tcsApplicable", e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                    />
                    <span>TCS Auto-Collection</span>
                  </label>
                </div>
              </div>
            )}

            {/* TAB 5: HOTEL & OPERATIONAL TERMS */}
            {activeTab === "hotel" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <Building className="h-4 w-4 text-emerald-600" />
                  Hotel Roles & Operational Terms
                </h3>

                <div className="space-y-2">
                  <span className="font-bold text-slate-700 text-xs block">Applicable Operational Roles:</span>
                  <div className="flex flex-wrap gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {[
                      "Guest",
                      "Vendor",
                      "Travel Agent",
                      "Corporate",
                      "Employee",
                      "Owner",
                      "Laundry Vendor",
                      "Maintenance Vendor",
                    ].map((role) => (
                      <label key={role} className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={(formData.applicableFor || []).includes(role as any)}
                          onChange={() => handleToggleApplicableFor(role as any)}
                          className="rounded border-slate-300 text-emerald-600 h-4 w-4"
                        />
                        <span>{role}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <FormField label="Room Commission %">
                    <TextInput
                      type="number"
                      value={formData.roomCommissionPct}
                      onChange={(e) => handleFormChange("roomCommissionPct", parseFloat(e.target.value) || 0)}
                      className="font-mono font-bold text-right bg-white h-9"
                    />
                  </FormField>

                  <FormField label="Travel Agent Commission %">
                    <TextInput
                      type="number"
                      value={formData.travelAgentCommissionPct}
                      onChange={(e) => handleFormChange("travelAgentCommissionPct", parseFloat(e.target.value) || 0)}
                      className="font-mono font-bold text-right bg-white h-9"
                    />
                  </FormField>

                  <FormField label="Corporate Discount %">
                    <TextInput
                      type="number"
                      value={formData.corporateDiscountPct}
                      onChange={(e) => handleFormChange("corporateDiscountPct", parseFloat(e.target.value) || 0)}
                      className="font-mono font-bold text-right bg-white h-9"
                    />
                  </FormField>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModulePageShell>
  );
}
