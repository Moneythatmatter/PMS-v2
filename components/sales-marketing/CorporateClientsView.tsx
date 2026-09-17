"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  Eye,
  CheckCircle2,
  MapPin,
  Tag,
  Briefcase,
  User,
  Award,
  Layers,
  Building2,
  MessageSquare,
  Clock,
  ExternalLink,
  ShieldAlert,
  Edit2,
  AlertTriangle,
  Check,
  X,
  Target,
  Sparkles,
  FileText,
  Globe,
  DollarSign,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Card, Drawer, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";
import { smContactService } from "@/services/sales-marketing";
import { mapContactFromApi, mapContactToApi } from "@/lib/sales-marketing/api-mappers";
function apiContactToCustomer(row: Record<string, unknown>): CustomerMasterContact {
  const c = mapContactFromApi(row);
  return {
    dbId: c.dbId,
    contactId: c.contactId,
    contactName: c.contactName,
    contactType: (c.contactType as ContactType) || "Individual",
    category: (c.category as ContactCategory) || "Regular Customer",
    mobileNumber: c.mobileNumber,
    mobile: c.mobile,
    emailAddress: c.emailAddress,
    email: c.email,
    companyName: c.companyName,
    city: c.city,
    createdDate: c.createdDate,
    createdBy: c.createdBy,
    createdFrom: (c.createdFrom as CreatedFromSource) || "Manual Entry",
    status: (c.status as ContactStatus) || "Active",
    notes: c.notes,
    leads: c.leads,
    deals: c.deals,
    bookings: c.bookings,
    activities: c.activities,
  };
}

// ─────────────────────────────────────────────────────────────
// 1. DATA TYPES & SCHEMAS: HOTEL PMS V1 CUSTOMER MASTER DATABASE
// ─────────────────────────────────────────────────────────────

export type ContactType =
  | "Individual"
  | "Corporate"
  | "Travel Agent"
  | "Wedding Planner"
  | "Event Organizer"
  | "Vendor Partner";

export type ContactCategory =
  | "Regular Customer"
  | "VIP Customer"
  | "Corporate Client"
  | "Wedding Client"
  | "Conference Client"
  | "Travel Partner"
  | "Preferred Partner";

export type ContactStatus = "Active" | "Inactive" | "VIP" | "Blacklisted";

export type CreatedFromSource =
  | "Deal Won"
  | "Direct Walk-In"
  | "Corporate Sales"
  | "Travel Agent / Wedding Planner"
  | "Manual Entry";

export interface LinkedLeadRef {
  id: string; // e.g. "LEAD-1001"
  inquiryDate: string;
  leadSource: string;
  bookingType: string;
  status: "New" | "Contacted" | "Qualified" | "Converted" | "Lost";
  expectedRevenue?: number;
}

export interface LinkedDealRef {
  id: string; // e.g. "DEAL-1001"
  dealName: string;
  bookingType: string;
  expectedValue: number;
  currentStage: string;
  assignedExecutive: string;
  createdDate: string;
  status: "Open" | "Won" | "Lost";
}

export interface LinkedBookingRef {
  id: string; // e.g. "BOOK-1001"
  bookingType: string;
  bookingName?: string;
  venue: string;
  eventDate: string;
  bookingStatus: "Confirmed" | "Completed" | "Tentative" | "Cancelled";
  contractValue: number;
}

export interface LinkedActivityRef {
  id: string; // e.g. "ACT-1001"
  activityType: string;
  activityDate: string;
  assignedExecutive: string;
  outcome?: string;
  nextAction?: string;
}

export interface CustomerMasterContact {
  dbId?: string;
  contactId: string; // e.g. "CONT-1001"
  contactName: string;
  contactType: ContactType;
  category: ContactCategory;
  mobileNumber: string;
  emailAddress?: string;
  companyName?: string;
  designation?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  gstNumber?: string;
  website?: string;
  createdDate: string;
  createdBy: string;
  createdFrom: CreatedFromSource;
  status: ContactStatus;
  notes?: string;

  // Backward-compatible aliases for other CRM modules
  firstName?: string;
  lastName?: string;
  mobile?: string;
  email?: string;
  customerCategory?: string;

  // Relational Collections
  leads: LinkedLeadRef[];
  deals: LinkedDealRef[];
  bookings: LinkedBookingRef[];
  activities: LinkedActivityRef[];
}

// ─────────────────────────────────────────────────────────────
// 2. INITIAL SEED DATA (CUSTOMER MASTER DIRECTORY)
// ─────────────────────────────────────────────────────────────

export const INITIAL_CUSTOMER_MASTER: CustomerMasterContact[] = [];

// ─────────────────────────────────────────────────────────────
// 3. MAIN COMPONENT: CONTACTS MASTER DATABASE
// ─────────────────────────────────────────────────────────────

export function CorporateClientsView() {
  const router = useRouter();
  const [contacts, setContacts] = useState<CustomerMasterContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Drawer & Modal States
  const [selectedContact, setSelectedContact] = useState<CustomerMasterContact | null>(null);
  const [drawerTab, setDrawerTab] = useState<
    "profile" | "opportunities" | "leads" | "deals" | "activities" | "bookings" | "notes"
  >("profile");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<CustomerMasterContact | null>(null);

  // Duplicate Warning State
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Add/Edit Form State
  const [formData, setFormData] = useState({
    contactName: "",
    contactType: "Individual" as ContactType,
    category: "Regular Customer" as ContactCategory,
    mobileNumber: "",
    emailAddress: "",
    companyName: "",
    designation: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    gstNumber: "",
    website: "",
    createdFrom: "Direct Walk-In" as CreatedFromSource,
    createdBy: "Vikram Malhotra",
    status: "Active" as ContactStatus,
    notes: "",
  });

  const loadContacts = async () => {
    setLoading(true);
    try {
      const rows = await smContactService.list();
      setContacts(rows.map(apiContactToCustomer));
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to load contacts");
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadContacts();
  }, []);

  // ─────────────────────────────────────────────────────────────
  // HELPER CALCULATIONS
  // ─────────────────────────────────────────────────────────────

  // Helper to get last booking date
  const getLastBookingDate = (c: CustomerMasterContact) => {
    if (c.bookings.length === 0) return "—";
    const sorted = [...c.bookings].sort((a, b) => b.eventDate.localeCompare(a.eventDate));
    return sorted[0].eventDate;
  };

  // Helper to count open opportunities
  const getOpenDealsCount = (c: CustomerMasterContact) => {
    return c.deals.filter((d) => d.status === "Open").length;
  };

  // Global KPI Summary Metrics
  const kpiMetrics = useMemo(() => {
    const totalContacts = contacts.length;
    const vipCount = contacts.filter((c) => c.status === "VIP").length;
    const corporateCount = contacts.filter(
      (c) => c.contactType === "Corporate" || c.contactType === "Travel Agent" || c.contactType === "Wedding Planner"
    ).length;
    const openOpportunitiesCount = contacts.reduce((sum, c) => sum + getOpenDealsCount(c), 0);

    return { totalContacts, vipCount, corporateCount, openOpportunitiesCount };
  }, [contacts]);

  // Filtered Contacts List
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const searchLower = searchTerm.toLowerCase();
      const matchSearch =
        c.contactName.toLowerCase().includes(searchLower) ||
        c.contactId.toLowerCase().includes(searchLower) ||
        c.mobileNumber.includes(searchLower) ||
        (c.emailAddress && c.emailAddress.toLowerCase().includes(searchLower)) ||
        (c.companyName && c.companyName.toLowerCase().includes(searchLower)) ||
        (c.city && c.city.toLowerCase().includes(searchLower));

      const matchType = selectedTypeFilter === "ALL" || c.contactType === selectedTypeFilter;
      const matchStatus = selectedStatusFilter === "ALL" || c.status === selectedStatusFilter;
      const matchCategory = selectedCategoryFilter === "ALL" || c.category === selectedCategoryFilter;

      return matchSearch && matchType && matchStatus && matchCategory;
    });
  }, [contacts, searchTerm, selectedTypeFilter, selectedStatusFilter, selectedCategoryFilter]);

  // ─────────────────────────────────────────────────────────────
  // MODAL HANDLERS & DUPLICATE DETECTION
  // ─────────────────────────────────────────────────────────────

  const handleOpenAddModal = () => {
    setEditingContact(null);
    setDuplicateWarning(null);
    setFormData({
      contactName: "",
      contactType: "Individual",
      category: "Regular Customer",
      mobileNumber: "",
      emailAddress: "",
      companyName: "",
      designation: "",
      address: "",
      city: "",
      state: "",
      country: "India",
      gstNumber: "",
      website: "",
      createdFrom: "Direct Walk-In",
      createdBy: "Vikram Malhotra",
      status: "Active",
      notes: "",
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (c: CustomerMasterContact) => {
    setEditingContact(c);
    setDuplicateWarning(null);
    setFormData({
      contactName: c.contactName,
      contactType: c.contactType,
      category: c.category,
      mobileNumber: c.mobileNumber,
      emailAddress: c.emailAddress || "",
      companyName: c.companyName || "",
      designation: c.designation || "",
      address: c.address || "",
      city: c.city || "",
      state: c.state || "",
      country: c.country || "India",
      gstNumber: c.gstNumber || "",
      website: c.website || "",
      createdFrom: c.createdFrom,
      createdBy: c.createdBy,
      status: c.status,
      notes: c.notes || "",
    });
    setIsAddModalOpen(true);
  };

  const handleMobileChange = (value: string) => {
    setFormData({ ...formData, mobileNumber: value });
    const normalizedMobile = value.replace(/\s+/g, "").replace(/[^0-9]/g, "");
    if (normalizedMobile.length >= 10) {
      const match = contacts.find((c) => {
        if (editingContact && c.contactId === editingContact.contactId) return false;
        const existingNorm = c.mobileNumber.replace(/\s+/g, "").replace(/[^0-9]/g, "");
        return existingNorm.endsWith(normalizedMobile.slice(-10));
      });

      if (match) {
        setDuplicateWarning(
          `Existing customer master record found: #${match.contactId} (${match.contactName}). Existing record will be updated rather than creating a duplicate.`
        );
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contactName.trim() || !formData.mobileNumber.trim()) return;

    const normalizedMobile = formData.mobileNumber.replace(/\s+/g, "").replace(/[^0-9]/g, "");
    const existingMatch = !editingContact
      ? contacts.find((c) => {
          const existingNorm = c.mobileNumber.replace(/\s+/g, "").replace(/[^0-9]/g, "");
          return existingNorm.endsWith(normalizedMobile.slice(-10));
        })
      : null;

    const target = editingContact ?? existingMatch ?? null;
    const payload = mapContactToApi({
      contactId: target?.contactId,
      contactName: formData.contactName.trim(),
      contactType: formData.contactType,
      category: formData.category,
      mobileNumber: formData.mobileNumber.trim(),
      emailAddress: formData.emailAddress.trim() || undefined,
      companyName: formData.companyName.trim() || undefined,
      city: formData.city.trim() || undefined,
      status: formData.status,
      createdFrom: formData.createdFrom || "Manual Entry",
      notes: formData.notes.trim() || undefined,
    });

    try {
      const row = target?.dbId
        ? await smContactService.update(target.dbId, payload)
        : await smContactService.create(payload);
      const saved = apiContactToCustomer(row);
      setContacts((prev) =>
        target?.dbId
          ? prev.map((c) => (c.dbId === saved.dbId ? { ...saved, designation: formData.designation.trim() || c.designation, address: formData.address.trim() || c.address, state: formData.state.trim() || c.state, country: formData.country.trim() || c.country, gstNumber: formData.gstNumber.trim() || c.gstNumber, website: formData.website.trim() || c.website } : c))
          : [{ ...saved, designation: formData.designation.trim() || undefined, address: formData.address.trim() || undefined, state: formData.state.trim() || undefined, country: formData.country.trim() || "India", gstNumber: formData.gstNumber.trim() || undefined, website: formData.website.trim() || undefined, createdBy: formData.createdBy || "System" }, ...prev],
      );
      if (selectedContact && (selectedContact.dbId === saved.dbId || selectedContact.contactId === saved.contactId)) {
        setSelectedContact(saved);
      }
      setToastMessage(
        target
          ? `✓ Updated Customer Master record #${saved.contactId}!`
          : `✓ Created Customer Master record #${saved.contactId} for ${saved.contactName}!`,
      );
      setIsAddModalOpen(false);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to save contact");
    }
  };

  return (
    <ModulePageShell
      eyebrow="Lead & Sales Management"
      title="Contacts — Central Customer Master Database"
      description="The hotel's permanent customer and business relationship directory. Unified master record connecting inquiry leads, sales deals, quotations, bookings, and relationship history."
      breadcrumbs={[
        { label: "Sales & Marketing", href: "/sales-marketing/dashboard" },
        { label: "Lead & Sales" },
        { label: "Contacts" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <Button
          type="button"
          size="sm"
          onClick={handleOpenAddModal}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 px-3.5 h-8.5"
        >
          <Plus className="h-4 w-4" /> Add Contact
        </Button>
      }
    >
      {loading && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-600">
          Loading contacts from database…
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: TOP KPI CARDS (CUSTOMER MASTER METRICS)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6 mb-5">
        {/* Card 1: Total Contacts Master */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Total Contacts Master
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-8 sm:w-8">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {kpiMetrics.totalContacts}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            Unique customers &amp; partners
          </p>
        </Card>

        {/* Card 2: VIP & Key Accounts */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              VIP &amp; Key Accounts
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 sm:h-8 sm:w-8">
              <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {kpiMetrics.vipCount}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            High priority master records
          </p>
        </Card>

        {/* Card 3: Corporate & Trade */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Corporate &amp; Trade
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 sm:h-8 sm:w-8">
              <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {kpiMetrics.corporateCount}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            B2B &amp; partner accounts
          </p>
        </Card>

        {/* Card 4: Open Opportunities */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Open Opportunities
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 sm:h-8 sm:w-8">
              <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl">
            {kpiMetrics.openOpportunitiesCount}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">
            Active deals in pipeline
          </p>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: SEARCH & FILTERS TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs mb-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Contact Name, Mobile, Email, Company, or Contact ID (#CONT-1001)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs sm:text-sm rounded-lg border border-slate-200 pl-9 pr-3 py-2 bg-slate-50/50 font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-300"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* Contact Type Filter */}
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 py-2 px-2.5 bg-white text-slate-700 focus:outline-none focus:border-slate-300 cursor-pointer"
          >
            <option value="ALL">All Contact Types</option>
            <option value="Individual">Individual</option>
            <option value="Corporate">Corporate</option>
            <option value="Travel Agent">Travel Agent</option>
            <option value="Wedding Planner">Wedding Planner</option>
            <option value="Event Organizer">Event Organizer</option>
            <option value="Vendor Partner">Vendor Partner</option>
          </select>

          {/* Customer Category Filter */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 py-2 px-2.5 bg-white text-slate-700 focus:outline-none focus:border-slate-300 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="Regular Customer">Regular Customer</option>
            <option value="VIP Customer">VIP Customer</option>
            <option value="Corporate Client">Corporate Client</option>
            <option value="Wedding Client">Wedding Client</option>
            <option value="Conference Client">Conference Client</option>
            <option value="Travel Partner">Travel Partner</option>
            <option value="Preferred Partner">Preferred Partner</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 py-2 px-2.5 bg-white text-slate-700 focus:outline-none focus:border-slate-300 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="VIP">VIP</option>
            <option value="Inactive">Inactive</option>
            <option value="Blacklisted">Blacklisted</option>
          </select>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: STREAMLINED CONTACT MASTER TABLE
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-4 py-3 text-xs text-slate-500 font-medium border-b border-slate-100 flex items-center justify-between">
          <span>Showing <strong className="text-slate-700 font-semibold">{filteredContacts.length}</strong> of <strong className="text-slate-700 font-semibold">{contacts.length}</strong> contacts &bull; Customer Master Directory</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Contact / ID</th>
                <th className="py-3 px-4">Category &amp; Type</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Company / Organization</th>
                <th className="py-3 px-4">Engagement &amp; Deals</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => {
                  const openDeals = getOpenDealsCount(contact);
                  return (
                    <tr
                      key={contact.contactId}
                      onClick={() => {
                        setSelectedContact(contact);
                        setDrawerTab("profile");
                      }}
                      className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      {/* 1. Contact / ID */}
                      <td className="py-3.5 px-4">
                        <strong className="text-slate-900 font-semibold text-xs block">
                          {contact.contactName}
                        </strong>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-mono">#{contact.contactId}</span>
                          {contact.designation && (
                            <>
                              <span className="text-slate-300 text-[10px]">&bull;</span>
                              <span className="text-[11px] text-slate-500 truncate max-w-[130px]">
                                {contact.designation}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* 2. Category & Type */}
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-semibold text-slate-900 block">
                          {contact.category}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {contact.contactType}
                        </span>
                      </td>

                      {/* 3. Contact Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 font-mono text-slate-900 font-semibold text-xs">
                          <span>{contact.mobileNumber}</span>
                          <a
                            href={`tel:${contact.mobileNumber}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-emerald-700 hover:text-emerald-800 p-0.5"
                            title="Call Contact"
                          >
                            <Phone className="h-3 w-3" />
                          </a>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono truncate block max-w-[160px] mt-0.5">
                          {contact.emailAddress || "—"}
                        </span>
                      </td>

                      {/* 4. Company / Organization */}
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-semibold text-slate-900 block truncate max-w-[160px]">
                          {contact.companyName || "—"}
                        </span>
                        {contact.city && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {contact.city}{contact.state ? `, ${contact.state}` : ""}
                          </span>
                        )}
                      </td>

                      {/* 5. Engagement & Deals */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 text-xs">
                            {contact.bookings.length} {contact.bookings.length === 1 ? "Booking" : "Bookings"}
                          </span>
                          {openDeals > 0 && (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200/70 font-semibold px-1.5 py-0.5 rounded text-[10px]">
                              {openDeals} Open Deal{openDeals > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          Last: {getLastBookingDate(contact)}
                        </span>
                      </td>

                      {/* 6. Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
                            contact.status === "VIP"
                              ? "bg-purple-50 text-purple-700 border-purple-200/70"
                              : contact.status === "Active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                              : contact.status === "Blacklisted"
                              ? "bg-rose-50 text-rose-700 border-rose-200/70"
                              : "bg-slate-100 text-slate-600 border-slate-200/70"
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              contact.status === "VIP"
                                ? "bg-purple-600"
                                : contact.status === "Active"
                                ? "bg-emerald-600"
                                : contact.status === "Blacklisted"
                                ? "bg-rose-600"
                                : "bg-slate-400"
                            )}
                          />
                          {contact.status}
                        </span>
                      </td>

                      {/* 7. Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedContact(contact);
                              setDrawerTab("profile");
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                          >
                            <Eye className="h-3 w-3 text-slate-400" /> View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-xs italic">
                    No customer master records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: COMPREHENSIVE CRM CONTACT DETAIL DRAWER
      ───────────────────────────────────────────────────────────── */}
      {selectedContact && (
        <Drawer
          isOpen={Boolean(selectedContact)}
          onClose={() => {
            setSelectedContact(null);
            setDrawerTab("profile");
          }}
          title={`Customer Master Database — #${selectedContact.contactId}`}
          maxWidth="xl"
          footer={
            <div className="flex items-center justify-between w-full pt-1">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEditModal(selectedContact)}
                  className="text-xs font-semibold rounded-lg border-slate-200"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1 text-slate-700" /> Edit Master Record
                </Button>

                <a
                  href={`tel:${selectedContact.mobileNumber}`}
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-slate-50 transition"
                >
                  <Phone className="h-3.5 w-3.5 text-emerald-700" /> {selectedContact.mobileNumber}
                </a>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={() => {
                  router.push(
                    `/sales-marketing/banquets/bookings-enquiries?contactId=${selectedContact.contactId}&name=${encodeURIComponent(
                      selectedContact.contactName
                    )}&mobile=${encodeURIComponent(selectedContact.mobileNumber)}`
                  );
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Create Booking →
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs pb-4">
            {/* Top Contact Hero Header */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-800 block">
                    Customer Master #{selectedContact.contactId} • Source: {selectedContact.createdFrom}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {selectedContact.contactName}
                  </h3>
                  <span className="text-xs text-slate-600 font-medium">
                    {contactCompanySubtitle(selectedContact)}
                  </span>
                </div>

                <div className="text-right space-y-1">
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block",
                      selectedContact.status === "VIP"
                        ? "bg-purple-100 text-purple-800 border-purple-200"
                        : selectedContact.status === "Active"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : selectedContact.status === "Blacklisted"
                        ? "bg-rose-100 text-rose-800 border-rose-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    )}
                  >
                    {selectedContact.status}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold block">
                    {selectedContact.contactType} • {selectedContact.category}
                  </span>
                </div>
              </div>

              {/* 4-Metric Key Summary Strip */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-200/80 text-center">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Total Inquiries</span>
                  <strong className="text-slate-900 text-xs font-mono font-bold">{selectedContact.leads.length}</strong>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Total Deals</span>
                  <strong className="text-slate-900 text-xs font-mono font-bold">{selectedContact.deals.length}</strong>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Open Deals</span>
                  <strong className="text-amber-800 text-xs font-mono font-bold">{getOpenDealsCount(selectedContact)}</strong>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">Total Bookings</span>
                  <strong className="text-emerald-800 text-xs font-mono font-bold">{selectedContact.bookings.length}</strong>
                </div>
              </div>
            </div>

            {/* 7 Clean Navigation Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
              <button
                type="button"
                onClick={() => setDrawerTab("profile")}
                className={cn(
                  "flex-1 py-1.5 px-2.5 rounded-lg text-center transition cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5",
                  drawerTab === "profile" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <User className="h-3.5 w-3.5" /> Profile
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab("opportunities")}
                className={cn(
                  "flex-1 py-1.5 px-2.5 rounded-lg text-center transition cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5",
                  drawerTab === "opportunities" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Briefcase className="h-3.5 w-3.5" /> Opportunities ({getOpenDealsCount(selectedContact)})
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab("leads")}
                className={cn(
                  "flex-1 py-1.5 px-2.5 rounded-lg text-center transition cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5",
                  drawerTab === "leads" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Target className="h-3.5 w-3.5" /> Inquiries ({selectedContact.leads.length})
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab("deals")}
                className={cn(
                  "flex-1 py-1.5 px-2.5 rounded-lg text-center transition cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5",
                  drawerTab === "deals" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Layers className="h-3.5 w-3.5" /> Deal History ({selectedContact.deals.length})
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab("activities")}
                className={cn(
                  "flex-1 py-1.5 px-2.5 rounded-lg text-center transition cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5",
                  drawerTab === "activities" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Phone className="h-3.5 w-3.5" /> Activities ({selectedContact.activities.length})
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab("bookings")}
                className={cn(
                  "flex-1 py-1.5 px-2.5 rounded-lg text-center transition cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5",
                  drawerTab === "bookings" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Calendar className="h-3.5 w-3.5" /> Bookings ({selectedContact.bookings.length})
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab("notes")}
                className={cn(
                  "flex-1 py-1.5 px-2.5 rounded-lg text-center transition cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5",
                  drawerTab === "notes" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <FileText className="h-3.5 w-3.5" /> Notes &amp; Remarks
              </button>
            </div>

            {/* ── TAB 1: PROFILE & MASTER INFORMATION ── */}
            {drawerTab === "profile" && (
              <div className="space-y-3.5">
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                    <User className="h-3.5 w-3.5 text-emerald-700" /> Basic Customer Information
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Contact ID:</span>
                      <strong className="text-emerald-900 font-mono">#{selectedContact.contactId}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Full Name:</span>
                      <strong className="text-slate-900">{selectedContact.contactName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Contact Type:</span>
                      <strong className="text-purple-900">{selectedContact.contactType}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Category:</span>
                      <span className="font-semibold text-purple-800">{selectedContact.category}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Mobile Number:</span>
                      <span className="font-mono font-semibold text-emerald-800">{selectedContact.mobileNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Email Address:</span>
                      <span className="font-mono text-slate-800">{selectedContact.emailAddress || "Not Provided"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Company:</span>
                      <strong className="text-slate-900">{selectedContact.companyName || "Individual Guest"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Designation:</span>
                      <span className="text-slate-800">{selectedContact.designation || "Not Provided"}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                    <MapPin className="h-3.5 w-3.5 text-blue-700" /> Address &amp; Business Credentials
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div className="col-span-2">
                      <span className="text-slate-400 text-[10px] block">Address:</span>
                      <span className="text-slate-800">{selectedContact.address || "Not Provided"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">City / State:</span>
                      <span className="text-slate-900 font-semibold">
                        {selectedContact.city || "—"}, {selectedContact.state || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Country:</span>
                      <span className="text-slate-900 font-semibold">{selectedContact.country || "India"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">GST Number:</span>
                      <span className="font-mono font-bold text-slate-900">{selectedContact.gstNumber || "Unregistered"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Website:</span>
                      <span className="text-blue-700 font-mono truncate block">{selectedContact.website || "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-600" /> Audit &amp; Origin Trail
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Created Date:</span>
                      <span className="font-mono text-slate-700">{selectedContact.createdDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Created From:</span>
                      <span className="font-semibold text-emerald-800">{selectedContact.createdFrom}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Created By:</span>
                      <span className="font-semibold text-slate-800">{selectedContact.createdBy}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: OPEN OPPORTUNITIES (ACTIVE DEALS) ── */}
            {drawerTab === "opportunities" && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 text-xs">
                  <strong className="block font-bold">Current Active Sales Opportunities</strong>
                  <span>Shows open pipeline deals currently being pursued with this customer.</span>
                </div>

                {selectedContact.deals.filter((d) => d.status === "Open").length > 0 ? (
                  <div className="space-y-2.5">
                    {selectedContact.deals
                      .filter((d) => d.status === "Open")
                      .map((deal) => (
                        <div
                          key={deal.id}
                          className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2 hover:border-slate-300 transition"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-purple-900">#{deal.id}</span>
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                                  Stage: {deal.currentStage}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-900 text-sm mt-1">{deal.dealName}</h4>
                              <span className="text-[11px] text-slate-500">
                                Booking Type: {deal.bookingType} • Created: {deal.createdDate}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block">Expected Value</span>
                              <strong className="text-sm font-mono text-emerald-900 font-bold">
                                ₹{deal.expectedValue.toLocaleString("en-IN")}
                              </strong>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                            <span className="text-slate-600">
                              Assigned Executive: <strong className="text-slate-900">{deal.assignedExecutive}</strong>
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                router.push(`/sales-marketing/crm/pipeline?dealId=${deal.id}`);
                              }}
                              className="text-[11px] font-semibold text-purple-700 h-7 border-purple-200 hover:bg-purple-50"
                            >
                              Open in Pipeline →
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 italic">
                    No active open opportunities currently in progress for this customer.
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 3: INQUIRY HISTORY (LEADS) ── */}
            {drawerTab === "leads" && (
              <div className="space-y-3">
                {selectedContact.leads.length > 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[11px] text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Lead ID</th>
                          <th className="py-2.5 px-3">Inquiry Date</th>
                          <th className="py-2.5 px-3">Lead Source</th>
                          <th className="py-2.5 px-3">Booking Type</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Expected Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {selectedContact.leads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">#{lead.id}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">{lead.inquiryDate}</td>
                            <td className="py-2.5 px-3 text-slate-800">{lead.leadSource}</td>
                            <td className="py-2.5 px-3">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                                {lead.bookingType}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded text-[10px] font-bold",
                                  lead.status === "Converted"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : lead.status === "Qualified"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-slate-100 text-slate-700"
                                )}
                              >
                                {lead.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-900">
                              {lead.expectedRevenue ? `₹${lead.expectedRevenue.toLocaleString("en-IN")}` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 italic">
                    No inquiry lead history recorded for this customer.
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 4: DEAL HISTORY ── */}
            {drawerTab === "deals" && (
              <div className="space-y-3">
                {selectedContact.deals.length > 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[11px] text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Deal ID</th>
                          <th className="py-2.5 px-3">Deal Name</th>
                          <th className="py-2.5 px-3">Booking Type</th>
                          <th className="py-2.5 px-3 text-right">Expected Value</th>
                          <th className="py-2.5 px-3">Current Stage</th>
                          <th className="py-2.5 px-3">Executive</th>
                          <th className="py-2.5 px-3">Created Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {selectedContact.deals.map((deal) => (
                          <tr key={deal.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-purple-900">#{deal.id}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">{deal.dealName}</td>
                            <td className="py-2.5 px-3 text-slate-700">{deal.bookingType}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-900">
                              ₹{deal.expectedValue.toLocaleString("en-IN")}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded text-[10px] font-bold",
                                  deal.status === "Won"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : deal.status === "Lost"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                                )}
                              >
                                {deal.currentStage}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">{deal.assignedExecutive}</td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{deal.createdDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 italic">
                    No sales deals logged for this customer.
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 5: ACTIVITY HISTORY ── */}
            {drawerTab === "activities" && (
              <div className="space-y-3">
                {selectedContact.activities.length > 0 ? (
                  <div className="space-y-2">
                    {selectedContact.activities.map((act) => (
                      <div
                        key={act.id}
                        className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900">#{act.id}</span>
                            <span className="bg-slate-100 text-slate-800 font-semibold px-2 py-0.5 rounded text-[10px]">
                              {act.activityType}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-500">{act.activityDate}</span>
                        </div>
                        {act.outcome && (
                          <p className="text-slate-800 text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <strong>Outcome:</strong> {act.outcome}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>Executive: <strong className="text-slate-700">{act.assignedExecutive}</strong></span>
                          {act.nextAction && <span>Next Action: <strong className="text-purple-800">{act.nextAction}</strong></span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 italic">
                    No past activity interaction logs recorded.
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 6: BOOKING HISTORY ── */}
            {drawerTab === "bookings" && (
              <div className="space-y-3">
                {selectedContact.bookings.length > 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[11px] text-slate-500 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Booking ID</th>
                          <th className="py-2.5 px-3">Booking Type</th>
                          <th className="py-2.5 px-3">Venue</th>
                          <th className="py-2.5 px-3">Event Date</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Contract Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {selectedContact.bookings.map((booking) => (
                          <tr key={booking.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">#{booking.id}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">{booking.bookingType}</td>
                            <td className="py-2.5 px-3 text-slate-700">{booking.venue}</td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{booking.eventDate}</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded text-[10px] font-bold",
                                  booking.bookingStatus === "Confirmed"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : booking.bookingStatus === "Completed"
                                    ? "bg-blue-100 text-blue-800"
                                    : booking.bookingStatus === "Tentative"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-rose-100 text-rose-800"
                                )}
                              >
                                {booking.bookingStatus}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-900">
                              ₹{booking.contractValue.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 italic">
                    No confirmed bookings logged yet.
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 7: NOTES & REMARKS ── */}
            {drawerTab === "notes" && (
              <div className="space-y-3.5">
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2.5">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                    <FileText className="h-3.5 w-3.5 text-purple-700" /> Customer Preferences &amp; Staff Remarks
                  </h4>
                  {selectedContact.notes ? (
                    <p className="text-slate-800 text-xs leading-relaxed whitespace-pre-line bg-purple-50/50 p-3 rounded-lg border border-purple-100">
                      {selectedContact.notes}
                    </p>
                  ) : (
                    <p className="text-slate-400 italic text-xs">No special notes or preferences added yet.</p>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                  <span className="font-bold text-slate-900 block">💡 Tips for Front Desk &amp; Sales Staff:</span>
                  <p className="text-[11px] leading-relaxed">
                    Store operational preferences (e.g. Vegetarian/Jain dietary requirements, valet parking needs, billing terms, or VIP protocols) here to ensure smooth department execution across all bookings.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Drawer>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: ADD / EDIT CUSTOMER MASTER MODAL
      ───────────────────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title={editingContact ? `Edit Customer Master — #${editingContact.contactId}` : "Add Customer to Master Database"}
          maxWidth="md"
        >
          <form onSubmit={handleSaveContact} className="space-y-3.5 text-xs p-1">
            {/* Duplicate Detection Warning Banner */}
            {duplicateWarning && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-amber-950 text-[11px]">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{duplicateWarning}</span>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Raj Sharma"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Contact Type *</label>
                <select
                  value={formData.contactType}
                  onChange={(e) => setFormData({ ...formData, contactType: e.target.value as ContactType })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 text-xs"
                >
                  <option value="Individual">Individual</option>
                  <option value="Corporate">Corporate</option>
                  <option value="Travel Agent">Travel Agent</option>
                  <option value="Wedding Planner">Wedding Planner</option>
                  <option value="Event Organizer">Event Organizer</option>
                  <option value="Vendor Partner">Vendor Partner</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ContactCategory })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 text-xs"
                >
                  <option value="Regular Customer">Regular Customer</option>
                  <option value="VIP Customer">VIP Customer</option>
                  <option value="Corporate Client">Corporate Client</option>
                  <option value="Wedding Client">Wedding Client</option>
                  <option value="Conference Client">Conference Client</option>
                  <option value="Travel Partner">Travel Partner</option>
                  <option value="Preferred Partner">Preferred Partner</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ContactStatus })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 text-xs"
                >
                  <option value="Active">Active</option>
                  <option value="VIP">VIP</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Blacklisted">Blacklisted</option>
                </select>
              </div>
            </div>

            {/* Mobile & Email */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Mobile Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={formData.mobileNumber}
                  onChange={(e) => handleMobileChange(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono font-bold text-emerald-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Email Address</label>
                <input
                  type="email"
                  placeholder="raj.sharma@gmail.com"
                  value={formData.emailAddress}
                  onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs"
                />
              </div>
            </div>

            {/* Company & Designation */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Company / Organization</label>
                <input
                  type="text"
                  placeholder="e.g. TCS or Self"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Director, Organizer"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs"
                />
              </div>
            </div>

            {/* Address & City */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">City</label>
                <input
                  type="text"
                  placeholder="Hyderabad"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">State</label>
                <input
                  type="text"
                  placeholder="Telangana"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Country</label>
                <input
                  type="text"
                  placeholder="India"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs"
                />
              </div>
            </div>

            {/* GST & Website */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">GST Number</label>
                <input
                  type="text"
                  placeholder="36AAACS1234F1Z5"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-slate-900 text-xs uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Website</label>
                <input
                  type="text"
                  placeholder="www.company.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs"
                />
              </div>
            </div>

            {/* Notes & Remarks */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Notes &amp; Remarks (Preferences, Valet, Billing)</label>
              <textarea
                rows={2.5}
                placeholder="e.g. Prefers vegetarian catering, requires valet parking for 50 cars, quarterly billing terms..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs"
              >
                {editingContact ? "Save Changes" : "Create Master Contact"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </ModulePageShell>
  );
}

// ─────────────────────────────────────────────────────────────
// HELPER SUBTITLES
// ─────────────────────────────────────────────────────────────
function contactCompanySubtitle(c: CustomerMasterContact) {
  if (c.companyName && c.designation) {
    return `${c.companyName} • ${c.designation}`;
  }
  return c.companyName || c.designation || "Individual Guest";
}
