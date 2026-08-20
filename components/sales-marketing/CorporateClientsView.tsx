"use client";

import React, { useState, useMemo } from "react";
import {
  Building2,
  Users,
  Search,
  Filter,
  SlidersHorizontal,
  Plus,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  UserCheck,
  Clock,
  Sparkles,
  ChevronRight,
  Eye,
  Edit2,
  CheckCircle2,
  AlertCircle,
  FileText,
  MapPin,
  Tag,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Send,
  User,
  Globe,
  Briefcase,
  Check,
  X,
  CreditCard,
  Percent,
  FileCheck,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// TYPES & SCHEMAS FOR CORPORATE ACCOUNTS & CLIENTS
// ─────────────────────────────────────────────────────────────

export type AccountType =
  | "Corporate Account"
  | "Travel Agent (TA)"
  | "Online Travel Agency (OTA)"
  | "Event Management Company"
  | "Government Organization"
  | "VIP Direct Client";

export type ContractStatus = "Active Contract" | "Under Renewal" | "Expired" | "Draft";
export type RateAgreementType = "LRA (Last Room Availability)" | "NLRA (Non-LRA)" | "Commission Tier" | "Special Promo Rate";

export interface ContactPerson {
  id: string;
  name: string;
  designation: string;
  email: string;
  phone: string;
  isPrimary?: boolean;
}

export interface CorporateAccountItem {
  id: string;
  accountName: string;
  accountType: AccountType;
  industryCategory: string; // e.g. IT & Tech, Healthcare, Banking, Event Management
  city: string;
  gstinNo?: string;

  // Contract & Tariff
  contractStatus: ContractStatus;
  rateAgreementType: RateAgreementType;
  contractedRoomRate: string; // e.g. "₹4,50,000 / Year" or "₹4,200 / Night"
  contractExpiryDate: string;
  creditLimit: string; // e.g. "₹10,00,000"
  creditPeriodDays: number; // e.g. 30 Days

  // Account Owner & Stats
  accountOwner: string; // Salesperson
  totalBookingsYTD: number; // Year-to-date bookings count
  revenueYTD: string; // Year-to-date revenue e.g. "₹42,50,000"

  // Primary Contact & Additional Contacts
  primaryContact: ContactPerson;
  additionalContacts?: ContactPerson[];

  // Audit
  createdDate: string;
  lastContactDate?: string;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────
// MOCK DATA FOR CORPORATE ACCOUNTS & CLIENTS
// ─────────────────────────────────────────────────────────────

export const INITIAL_CORPORATE_ACCOUNTS: CorporateAccountItem[] = [
  {
    id: "ACC-101",
    accountName: "TCS India Ltd",
    accountType: "Corporate Account",
    industryCategory: "IT & Software Services",
    city: "Mumbai / Pan-India",
    gstinNo: "27AAACT1234F1Z5",
    contractStatus: "Active Contract",
    rateAgreementType: "LRA (Last Room Availability)",
    contractedRoomRate: "₹4,500 / Night (Deluxe)",
    contractExpiryDate: "31 Dec 2026",
    creditLimit: "₹15,00,000",
    creditPeriodDays: 30,
    accountOwner: "Jay Kumar",
    totalBookingsYTD: 142,
    revenueYTD: "₹38,40,000",
    primaryContact: {
      id: "CON-501",
      name: "Sunil Verma",
      designation: "VP - Corporate Travel & HR",
      email: "sunil.v@tcs.com",
      phone: "+91 97110 44556",
      isPrimary: true,
    },
    additionalContacts: [
      {
        id: "CON-502",
        name: "Neha Sharma",
        designation: "Travel Desk Manager",
        email: "neha.s@tcs.com",
        phone: "+91 98220 33441",
      },
    ],
    createdDate: "10 Jan 2025",
    lastContactDate: "17 Aug 2026",
    notes: "Special 10% food discount included in corporate rate agreement.",
  },
  {
    id: "ACC-102",
    accountName: "MakeMyTrip (OTA)",
    accountType: "Online Travel Agency (OTA)",
    industryCategory: "OTA / Travel Partner",
    city: "Gurugram",
    gstinNo: "07AABCM8899K1Z2",
    contractStatus: "Active Contract",
    rateAgreementType: "Commission Tier",
    contractedRoomRate: "18% Standard Commission",
    contractExpiryDate: "31 Mar 2027",
    creditLimit: "₹25,00,000",
    creditPeriodDays: 15,
    accountOwner: "Vikram Rathi",
    totalBookingsYTD: 310,
    revenueYTD: "₹64,20,000",
    primaryContact: {
      id: "CON-503",
      name: "Rohan Kapoor",
      designation: "Market Manager - Hospitality",
      email: "rohan.k@makemytrip.com",
      phone: "+91 98100 77889",
      isPrimary: true,
    },
    createdDate: "05 Feb 2024",
    lastContactDate: "15 Aug 2026",
    notes: "API integration active. Auto-sync room availability and dynamic rate tiers.",
  },
  {
    id: "ACC-103",
    accountName: "HDFC Bank Ltd",
    accountType: "Corporate Account",
    industryCategory: "Banking & Financial Services",
    city: "Mumbai",
    gstinNo: "27AAACH1122D1Z8",
    contractStatus: "Under Renewal",
    rateAgreementType: "NLRA (Non-LRA)",
    contractedRoomRate: "₹4,200 / Night (Executive)",
    contractExpiryDate: "31 Aug 2026",
    creditLimit: "₹10,00,000",
    creditPeriodDays: 30,
    accountOwner: "Jay Kumar",
    totalBookingsYTD: 98,
    revenueYTD: "₹24,80,000",
    primaryContact: {
      id: "CON-504",
      name: "Simon Morasca",
      designation: "Head of Procurement",
      email: "simon.m@hdfcbank.com",
      phone: "+91 98112 33445",
      isPrimary: true,
    },
    createdDate: "15 Mar 2025",
    lastContactDate: "18 Aug 2026",
    notes: "Contract expires Aug 31. Renewal proposal sent for FY26-27.",
  },
  {
    id: "ACC-104",
    accountName: "Thomas Cook India",
    accountType: "Travel Agent (TA)",
    industryCategory: "Travel Agency & Inbound Tours",
    city: "Mumbai",
    gstinNo: "27AAACT8811E1Z4",
    contractStatus: "Active Contract",
    rateAgreementType: "LRA (Last Room Availability)",
    contractedRoomRate: "₹3,900 / Night (Group Rate)",
    contractExpiryDate: "31 Dec 2026",
    creditLimit: "₹8,00,000",
    creditPeriodDays: 30,
    accountOwner: "Vikram Rathi",
    totalBookingsYTD: 76,
    revenueYTD: "₹18,90,000",
    primaryContact: {
      id: "CON-505",
      name: "Anjali Mehta",
      designation: "Contracting Manager",
      email: "anjali.m@thomascook.in",
      phone: "+91 98334 55667",
      isPrimary: true,
    },
    createdDate: "20 Jan 2025",
    lastContactDate: "12 Aug 2026",
    notes: "Handles inbound foreign delegate groups and MICE stay extensions.",
  },
  {
    id: "ACC-105",
    accountName: "Apex Event Management Co.",
    accountType: "Event Management Company",
    industryCategory: "Events & Exhibitions",
    city: "Bengaluru",
    gstinNo: "29AAACA4455G1Z1",
    contractStatus: "Expired",
    rateAgreementType: "Special Promo Rate",
    contractedRoomRate: "Banquet Package Tariff",
    contractExpiryDate: "15 Jul 2026",
    creditLimit: "₹5,00,000",
    creditPeriodDays: 15,
    accountOwner: "Sneha Kapadia",
    totalBookingsYTD: 14,
    revenueYTD: "₹12,40,000",
    primaryContact: {
      id: "CON-506",
      name: "Dr. Alok Nath",
      designation: "Managing Director",
      email: "alok@apexevents.in",
      phone: "+91 98221 66778",
      isPrimary: true,
    },
    createdDate: "11 May 2025",
    lastContactDate: "10 Aug 2026",
    notes: "Contract expired last month. Follow up for Q4 banquet venue block agreement.",
  },
];

export function CorporateClientsView() {
  const [accounts, setAccounts] = useState<CorporateAccountItem[]>(INITIAL_CORPORATE_ACCOUNTS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Tab View Mode: "ACCOUNTS" vs "CONTACTS"
  const [viewMode, setViewMode] = useState<"ACCOUNTS" | "CONTACTS">("ACCOUNTS");

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingAccount, setViewingAccount] = useState<CorporateAccountItem | null>(null);

  // Form Inputs for New Corporate Account
  const [formAccountName, setFormAccountName] = useState("");
  const [formAccountType, setFormAccountType] = useState<AccountType>("Corporate Account");
  const [formIndustry, setFormIndustry] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formGstin, setFormGstin] = useState("");
  const [formRateType, setFormRateType] = useState<RateAgreementType>("LRA (Last Room Availability)");
  const [formContractedRate, setFormContractedRate] = useState("");
  const [formExpiryDate, setFormExpiryDate] = useState("");
  const [formCreditLimit, setFormCreditLimit] = useState("");
  const [formCreditPeriod, setFormCreditPeriod] = useState(30);

  // Contact Inputs
  const [formContactName, setFormContactName] = useState("");
  const [formContactDesignation, setFormContactDesignation] = useState("");
  const [formContactPhone, setFormContactPhone] = useState("");
  const [formContactEmail, setFormContactEmail] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Calculated KPI Summary
  const kpiSummary = useMemo(() => {
    const activeContracts = accounts.filter((a) => a.contractStatus === "Active Contract").length;
    const renewalPending = accounts.filter((a) => a.contractStatus === "Under Renewal" || a.contractStatus === "Expired").length;
    return {
      totalAccounts: accounts.length,
      activeContracts,
      renewalPending,
      totalRevenueYTD: "₹1,48,80,000",
    };
  }, [accounts]);

  // Flattened All Contacts List for Contacts Tab View
  const allContactsList = useMemo(() => {
    const list: { contact: ContactPerson; accountName: string; accountId: string; accountType: string }[] = [];
    accounts.forEach((acc) => {
      list.push({ contact: acc.primaryContact, accountName: acc.accountName, accountId: acc.id, accountType: acc.accountType });
      if (acc.additionalContacts) {
        acc.additionalContacts.forEach((c) => {
          list.push({ contact: c, accountName: acc.accountName, accountId: acc.id, accountType: acc.accountType });
        });
      }
    });
    return list;
  }, [accounts]);

  // Filtered Accounts List
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const query = searchTerm.toLowerCase();
      const matchSearch =
        acc.accountName.toLowerCase().includes(query) ||
        acc.primaryContact.name.toLowerCase().includes(query) ||
        acc.primaryContact.phone.includes(query) ||
        acc.primaryContact.email.toLowerCase().includes(query) ||
        acc.city.toLowerCase().includes(query) ||
        acc.id.toLowerCase().includes(query);

      const matchType = typeFilter === "ALL" || acc.accountType === typeFilter;
      const matchStatus = statusFilter === "ALL" || acc.contractStatus === statusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [accounts, searchTerm, typeFilter, statusFilter]);

  // Save New Account Handler
  const handleSaveNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAccountName.trim() || !formContactName.trim()) return;

    const newAcc: CorporateAccountItem = {
      id: `ACC-${Math.floor(100 + Math.random() * 900)}`,
      accountName: formAccountName.trim(),
      accountType: formAccountType,
      industryCategory: formIndustry.trim() || "Corporate",
      city: formCity.trim() || "Hyderabad",
      gstinNo: formGstin.trim() || undefined,
      contractStatus: "Active Contract",
      rateAgreementType: formRateType,
      contractedRoomRate: formContractedRate.trim() || "₹4,500 / Night",
      contractExpiryDate: formExpiryDate || "31 Dec 2026",
      creditLimit: formCreditLimit.trim() || "₹10,00,000",
      creditPeriodDays: formCreditPeriod,
      accountOwner: "Jay Kumar",
      totalBookingsYTD: 0,
      revenueYTD: "₹0",
      primaryContact: {
        id: `CON-${Math.floor(500 + Math.random() * 500)}`,
        name: formContactName.trim(),
        designation: formContactDesignation.trim() || "Corporate Contact",
        email: formContactEmail.trim() || "contact@domain.com",
        phone: formContactPhone.trim() || "+91 98000 00000",
        isPrimary: true,
      },
      createdDate: "19 Aug 2026",
      lastContactDate: "Today",
      notes: formNotes.trim(),
    };

    setAccounts((prev) => [newAcc, ...prev]);
    setToastMessage(`✓ Successfully added Corporate Account "${newAcc.accountName}".`);
    setIsAddModalOpen(false);

    // Reset Form
    setFormAccountName("");
    setFormIndustry("");
    setFormCity("");
    setFormGstin("");
    setFormContractedRate("");
    setFormContactName("");
    setFormContactDesignation("");
    setFormContactPhone("");
    setFormContactEmail("");
    setFormNotes("");
  };

  return (
    <ModulePageShell
      eyebrow="Sales & CRM Operations"
      title="Corporate Accounts & Client Directory"
      description="Centralized directory for corporate contracted clients, Travel Agents (TA), OTAs, rate agreements, credit limits, and key contacts."
      breadcrumbs={[
        { label: "Sales & Marketing", href: "/sales-marketing/dashboard" },
        { label: "Sales & CRM" },
        { label: "Corporate & Clients" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <Button
          type="button"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
        >
          <Building2 className="h-4 w-4" /> + Add Corporate Account
        </Button>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: KPI CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <HRKPICard
          label="Total Managed Accounts"
          value={`${kpiSummary.totalAccounts}`}
          subtitle="Corporates, TAs & OTAs"
          tone="emerald"
          icon={<Building2 className="h-5 w-5" />}
        />
        <HRKPICard
          label="Active Rate Contracts"
          value={`${kpiSummary.activeContracts}`}
          subtitle="LRA & Commission Tiers"
          tone="blue"
          icon={<FileCheck className="h-5 w-5" />}
        />
        <HRKPICard
          label="Contract Renewals Due"
          value={`${kpiSummary.renewalPending}`}
          subtitle="Expired / Under Renewal"
          tone="amber"
          icon={<Clock className="h-5 w-5" />}
        />
        <HRKPICard
          label="Total Corporate Revenue YTD"
          value={kpiSummary.totalRevenueYTD}
          subtitle="Year-to-Date Contracted Revenue"
          tone="purple"
          icon={<DollarSign className="h-5 w-5" />}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: VIEW TOGGLE TABS (ACCOUNTS vs CONTACTS DIRECTORY)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("ACCOUNTS")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-2 border",
              viewMode === "ACCOUNTS"
                ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            )}
          >
            <Building2 className="h-4 w-4" /> Corporate &amp; OTA Accounts ({accounts.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode("CONTACTS")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-2 border",
              viewMode === "CONTACTS"
                ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            )}
          >
            <Users className="h-4 w-4" /> Contacts Directory ({allContactsList.length})
          </button>
        </div>

        {/* Search & Quick Type Filter */}
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search account, GST, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50 font-medium text-slate-800"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs rounded-xl border border-slate-200 py-1.5 px-3 bg-white font-semibold text-slate-800"
          >
            <option value="ALL">All Account Types</option>
            <option value="Corporate Account">Corporate Account</option>
            <option value="Travel Agent (TA)">Travel Agent (TA)</option>
            <option value="Online Travel Agency (OTA)">Online Travel Agency (OTA)</option>
            <option value="Event Management Company">Event Management Company</option>
          </select>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3A: ACCOUNTS TABLE VIEW
      ───────────────────────────────────────────────────────────── */}
      {viewMode === "ACCOUNTS" ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Account Name / City</th>
                  <th className="py-3 px-4">Account Type</th>
                  <th className="py-3 px-4">Primary Contact Person</th>
                  <th className="py-3 px-4">Rate Agreement</th>
                  <th className="py-3 px-4">Credit Limit</th>
                  <th className="py-3 px-4">Contract Status</th>
                  <th className="py-3 px-4">YTD Revenue</th>
                  <th className="py-3 px-4">Account Owner</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map((acc) => (
                    <tr
                      key={acc.id}
                      onClick={() => setViewingAccount(acc)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <p className="font-bold text-slate-900">{acc.accountName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">#{acc.id} • {acc.city}</p>
                      </td>

                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200">
                          {acc.accountType}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">{acc.primaryContact.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{acc.primaryContact.phone}</p>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 text-[11px]">{acc.rateAgreementType}</p>
                        <p className="text-[10px] text-emerald-700 font-semibold">{acc.contractedRoomRate}</p>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {acc.creditLimit} ({acc.creditPeriodDays} Days)
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border",
                            acc.contractStatus === "Active Contract"
                              ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                              : acc.contractStatus === "Under Renewal"
                              ? "bg-amber-100 text-amber-900 border-amber-200"
                              : "bg-rose-100 text-rose-900 border-rose-200"
                          )}
                        >
                          {acc.contractStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-emerald-950 font-mono">
                        {acc.revenueYTD}
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-medium">{acc.accountOwner}</td>

                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingAccount(acc)}
                            className="rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 text-xs">
                      No corporate accounts found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            SECTION 3B: CONTACTS DIRECTORY VIEW
        ───────────────────────────────────────────────────────────── */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Contact Person Name</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Associated Corporate / OTA</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Contact Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {allContactsList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-900 font-bold flex items-center justify-center text-xs">
                        {item.contact.name.charAt(0)}
                      </div>
                      {item.contact.name}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-700">{item.contact.designation}</td>

                    <td className="py-3 px-4 font-bold text-slate-900">
                      {item.accountName}
                      <span className="text-[10px] text-slate-400 font-normal block">{item.accountType}</span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.contact.phone}</td>

                    <td className="py-3 px-4 font-semibold text-slate-700">{item.contact.email}</td>

                    <td className="py-3 px-4">
                      {item.contact.isPrimary ? (
                        <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded text-[10px] font-extrabold border border-emerald-200">
                          Primary Contact
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-200">
                          Secondary
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ADD CORPORATE ACCOUNT
      ───────────────────────────────────────────────────────────── */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Corporate Account / Client"
          description="Register contracted corporate companies, Travel Agents (TAs), or OTAs."
          size="md"
        >
          <form onSubmit={handleSaveNewAccount} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Account Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TCS India Ltd or MakeMyTrip"
                  value={formAccountName}
                  onChange={(e) => setFormAccountName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Category</label>
                <select
                  value={formAccountType}
                  onChange={(e) => setFormAccountType(e.target.value as AccountType)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 bg-white"
                >
                  <option value="Corporate Account">Corporate Account</option>
                  <option value="Travel Agent (TA)">Travel Agent (TA)</option>
                  <option value="Online Travel Agency (OTA)">Online Travel Agency (OTA)</option>
                  <option value="Event Management Company">Event Management Company</option>
                  <option value="Government Organization">Government Organization</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Industry Sector</label>
                <input
                  type="text"
                  placeholder="e.g. IT, Healthcare, Banking"
                  value={formIndustry}
                  onChange={(e) => setFormIndustry(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">City / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai"
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">GSTIN Number</label>
                <input
                  type="text"
                  placeholder="27AAACT1234F1Z5"
                  value={formGstin}
                  onChange={(e) => setFormGstin(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <span className="font-bold text-slate-900 text-xs block">Contract &amp; Rate Agreement</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rate Agreement Type</label>
                  <select
                    value={formRateType}
                    onChange={(e) => setFormRateType(e.target.value as RateAgreementType)}
                    className="w-full rounded-xl border border-slate-200 p-2 font-bold text-slate-900 bg-white"
                  >
                    <option value="LRA (Last Room Availability)">LRA (Last Room Availability)</option>
                    <option value="NLRA (Non-LRA)">NLRA (Non-LRA)</option>
                    <option value="Commission Tier">Commission Tier</option>
                    <option value="Special Promo Rate">Special Promo Rate</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contracted Room Tariff</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹4,500 / Night"
                    value={formContractedRate}
                    onChange={(e) => setFormContractedRate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Credit Limit (₹)</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹10,00,000"
                    value={formCreditLimit}
                    onChange={(e) => setFormCreditLimit(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Credit Period (Days)</label>
                  <input
                    type="number"
                    value={formCreditPeriod}
                    onChange={(e) => setFormCreditPeriod(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2 bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-3">
              <span className="font-bold text-emerald-950 text-xs block">Primary Contact Person</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Contact Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Sunil Verma"
                    value={formContactName}
                    onChange={(e) => setFormContactName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="VP - Corporate Travel"
                    value={formContactDesignation}
                    onChange={(e) => setFormContactDesignation(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98000 00000"
                    value={formContactPhone}
                    onChange={(e) => setFormContactPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="contact@domain.com"
                    value={formContactEmail}
                    onChange={(e) => setFormContactEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                Save Account
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          DRAWER: ACCOUNT DETAILS
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(viewingAccount)}
        onClose={() => setViewingAccount(null)}
        title="Corporate Account Details"
      >
        {viewingAccount && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1.5">
              <span className="text-[10px] text-slate-400 font-mono font-bold">#{viewingAccount.id} • {viewingAccount.accountType}</span>
              <h3 className="text-base font-black text-amber-400">{viewingAccount.accountName}</h3>
              <p className="text-xs text-slate-300">
                GSTIN: <strong>{viewingAccount.gstinNo || "N/A"}</strong> • City: <strong>{viewingAccount.city}</strong>
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <p className="text-slate-600">Contract Status: <strong className="text-emerald-700 font-bold">{viewingAccount.contractStatus}</strong></p>
              <p className="text-slate-600">Rate Agreement: <strong>{viewingAccount.rateAgreementType}</strong></p>
              <p className="text-slate-600">Contracted Rate: <strong className="font-mono text-slate-900">{viewingAccount.contractedRoomRate}</strong></p>
              <p className="text-slate-600">Credit Limit: <strong className="font-mono text-slate-900">{viewingAccount.creditLimit}</strong> ({viewingAccount.creditPeriodDays} Days)</p>
              <p className="text-slate-600">Revenue YTD: <strong className="font-mono text-emerald-700 font-bold">{viewingAccount.revenueYTD}</strong></p>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1">
              <span className="font-extrabold text-emerald-950 block text-[11px]">Primary Contact Person</span>
              <p className="text-slate-900 font-bold">{viewingAccount.primaryContact.name} ({viewingAccount.primaryContact.designation})</p>
              <p className="text-slate-600 font-mono">{viewingAccount.primaryContact.phone} • {viewingAccount.primaryContact.email}</p>
            </div>

            {viewingAccount.notes && (
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="font-extrabold text-slate-900 block text-[11px]">Special Terms / Notes</span>
                <p className="text-slate-800">{viewingAccount.notes}</p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </ModulePageShell>
  );
}
