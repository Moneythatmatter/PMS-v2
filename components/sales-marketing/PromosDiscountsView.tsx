"use client";

import React, { useState, useMemo } from "react";
import {
  Ticket,
  Percent,
  DollarSign,
  Plus,
  Search,
  Filter,
  Calendar,
  Sparkles,
  TrendingUp,
  Tag,
  CheckCircle2,
  Clock,
  PauseCircle,
  AlertCircle,
  X,
  Eye,
  Edit2,
  Trash2,
  ShieldCheck,
  History,
  Building2,
  Bed,
  Utensils,
  UserCheck,
  Check,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// TYPES & SCHEMAS FOR HOTEL PMS PROMOTIONS (VERSION 1)
// ─────────────────────────────────────────────────────────────

export type ApplicableService = "Rooms" | "Restaurant" | "Banquet";
export type DiscountType = "Percentage" | "Fixed Amount";
export type PromoStatus = "Active" | "Inactive";

export interface HotelPromotion {
  id: string;
  uniquePromoId: string; // Unique Promo / Discount Scheme ID for Front Office / PMS schema integration (e.g. PRM-101)
  name: string;
  promoCode: string;
  description: string;
  applicableTo: ApplicableService;
  discountType: DiscountType;
  discountValue: string; // e.g. "20%", "₹1,500"
  rawDiscountNumber: number;
  minSpend?: number; // e.g. Minimum spend ₹5,000 for Restaurant/Banquet/Room
  minNights?: number; // e.g. Minimum stay of 2 nights for Rooms
  startDate: string;
  endDate: string;
  status: PromoStatus;
  usageCount: number;
}

export interface PromoValidationResult {
  isValid: boolean;
  message: string;
  appliedDiscountText?: string;
  calculatedDiscountAmount?: number;
}

// ─────────────────────────────────────────────────────────────
// INITIAL MOCK DATA
// ─────────────────────────────────────────────────────────────

export const INITIAL_PROMOTIONS: HotelPromotion[] = [
  {
    id: "PROMO-001",
    uniquePromoId: "PRM-101",
    name: "Monsoon Room Retreat",
    promoCode: "MONSOON20",
    description: "20% discount on room bookings during monsoon season.",
    applicableTo: "Rooms",
    discountType: "Percentage",
    discountValue: "20%",
    rawDiscountNumber: 20,
    minSpend: 8000,
    minNights: 2,
    startDate: "2026-06-01",
    endDate: "2026-09-30",
    status: "Active",
    usageCount: 42,
  },
  {
    id: "PROMO-002",
    uniquePromoId: "PRM-102",
    name: "Grand Wedding Hall Special",
    promoCode: "WEDDING2026",
    description: "Flat ₹50,000 discount on banquet hall bookings for weddings.",
    applicableTo: "Banquet",
    discountType: "Fixed Amount",
    discountValue: "₹50,000",
    rawDiscountNumber: 50000,
    minSpend: 300000,
    startDate: "2026-08-01",
    endDate: "2026-11-30",
    status: "Active",
    usageCount: 14,
  },
  {
    id: "PROMO-003",
    uniquePromoId: "PRM-103",
    name: "Birthday Dining Treat",
    promoCode: "BIRTHDAY10",
    description: "10% off restaurant dining bills.",
    applicableTo: "Restaurant",
    discountType: "Percentage",
    discountValue: "10%",
    rawDiscountNumber: 10,
    minSpend: 2500,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    status: "Active",
    usageCount: 68,
  },
  {
    id: "PROMO-004",
    uniquePromoId: "PRM-104",
    name: "Summer Staycation Saver",
    promoCode: "SUMMER15",
    description: "15% off room staycation packages.",
    applicableTo: "Rooms",
    discountType: "Percentage",
    discountValue: "15%",
    rawDiscountNumber: 15,
    minSpend: 5000,
    minNights: 1,
    startDate: "2026-05-01",
    endDate: "2026-07-31",
    status: "Inactive",
    usageCount: 25,
  },
  {
    id: "PROMO-005",
    uniquePromoId: "PRM-105",
    name: "Corporate Executive Saver",
    promoCode: "CORP1500",
    description: "Flat ₹1,500 discount for corporate room bookings.",
    applicableTo: "Rooms",
    discountType: "Fixed Amount",
    discountValue: "₹1,500",
    rawDiscountNumber: 1500,
    minSpend: 10000,
    minNights: 2,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    status: "Active",
    usageCount: 52,
  },
];

export function PromosDiscountsView() {
  const [promotionsList, setPromotionsList] = useState<HotelPromotion[]>(INITIAL_PROMOTIONS);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Drawer / Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<HotelPromotion | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Form State (Create / Edit Promotion)
  const [promoForm, setPromoForm] = useState({
    uniquePromoId: `PRM-${Math.floor(100 + Math.random() * 900)}`,
    name: "",
    promoCode: "",
    description: "",
    applicableTo: "Rooms" as ApplicableService,
    discountType: "Percentage" as DiscountType,
    rawDiscountNumber: 10,
    minSpend: 5000,
    minNights: 1,
    startDate: "2026-09-01",
    endDate: "2026-12-31",
    status: "Active" as PromoStatus,
  });

  // Manual Promo Application Staff Tool State
  const [applyForm, setApplyForm] = useState({
    promoCode: "",
    serviceType: "Rooms" as ApplicableService,
    billAmount: 10000,
    appliedByStaffRole: "Front Desk Staff",
  });
  const [applyValidationResult, setApplyValidationResult] = useState<PromoValidationResult | null>(null);

  // High level summary metrics
  const metrics = useMemo(() => {
    const totalPromos = promotionsList.length;
    const activePromos = promotionsList.filter((p) => p.status === "Active").length;
    const roomOffers = promotionsList.filter((p) => p.applicableTo === "Rooms").length;
    const restaurantOffers = promotionsList.filter((p) => p.applicableTo === "Restaurant").length;
    const banquetOffers = promotionsList.filter((p) => p.applicableTo === "Banquet").length;
    const totalUsage = promotionsList.reduce((sum, p) => sum + p.usageCount, 0);

    return {
      totalPromos,
      activePromos,
      roomOffers,
      restaurantOffers,
      banquetOffers,
      totalUsage,
    };
  }, [promotionsList]);

  // Filtered Promotions List
  const filteredPromotions = useMemo(() => {
    return promotionsList.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.promoCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.uniquePromoId && p.uniquePromoId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchService = selectedServiceFilter === "ALL" || p.applicableTo === selectedServiceFilter;
      const matchStatus = selectedStatusFilter === "ALL" || p.status === selectedStatusFilter;
      return matchSearch && matchService && matchStatus;
    });
  }, [promotionsList, searchTerm, selectedServiceFilter, selectedStatusFilter]);

  // Auto-Generate Unique Promo ID
  const handleAutoGenerateId = () => {
    const generatedId = `PRM-${Math.floor(100 + Math.random() * 900)}`;
    setPromoForm((prev) => ({ ...prev, uniquePromoId: generatedId }));
  };

  // Handle Save / Edit Promotion
  const handleSavePromotion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoForm.name.trim() || !promoForm.promoCode.trim()) return;

    const discountValueStr =
      promoForm.discountType === "Percentage"
        ? `${promoForm.rawDiscountNumber}%`
        : `₹${promoForm.rawDiscountNumber.toLocaleString()}`;

    const finalUniqueId = promoForm.uniquePromoId.trim().toUpperCase() || `PRM-${Math.floor(100 + Math.random() * 900)}`;

    if (editingPromotion) {
      // Edit existing promotion
      setPromotionsList((prev) =>
        prev.map((p) =>
          p.id === editingPromotion.id
            ? {
                ...p,
                uniquePromoId: finalUniqueId,
                name: promoForm.name,
                promoCode: promoForm.promoCode.toUpperCase(),
                description: promoForm.description,
                applicableTo: promoForm.applicableTo,
                discountType: promoForm.discountType,
                discountValue: discountValueStr,
                rawDiscountNumber: promoForm.rawDiscountNumber,
                minSpend: promoForm.minSpend ? Number(promoForm.minSpend) : undefined,
                minNights: promoForm.minNights ? Number(promoForm.minNights) : undefined,
                startDate: promoForm.startDate,
                endDate: promoForm.endDate,
                status: promoForm.status,
              }
            : p
        )
      );
      setToastMessage(`Promotion "${promoForm.name}" [ID: ${finalUniqueId}] updated successfully!`);
    } else {
      // Create new promotion
      const newPromo: HotelPromotion = {
        id: `PROMO-${Math.floor(100 + Math.random() * 900)}`,
        uniquePromoId: finalUniqueId,
        name: promoForm.name,
        promoCode: promoForm.promoCode.toUpperCase(),
        description: promoForm.description,
        applicableTo: promoForm.applicableTo,
        discountType: promoForm.discountType,
        discountValue: discountValueStr,
        rawDiscountNumber: promoForm.rawDiscountNumber,
        minSpend: promoForm.minSpend ? Number(promoForm.minSpend) : undefined,
        minNights: promoForm.minNights ? Number(promoForm.minNights) : undefined,
        startDate: promoForm.startDate,
        endDate: promoForm.endDate,
        status: promoForm.status,
        usageCount: 0,
      };

      setPromotionsList([newPromo, ...promotionsList]);
      setToastMessage(`Promotion "${newPromo.name}" [ID: ${finalUniqueId}] created successfully!`);
    }

    setIsCreateModalOpen(false);
    setEditingPromotion(null);
    resetForm();
  };

  // Toggle Active / Inactive Status
  const handleToggleStatus = (promo: HotelPromotion) => {
    const newStatus: PromoStatus = promo.status === "Active" ? "Inactive" : "Active";
    setPromotionsList((prev) =>
      prev.map((p) => (p.id === promo.id ? { ...p, status: newStatus } : p))
    );
    setToastMessage(`Promotion "${promo.name}" is now ${newStatus}.`);
  };

  // Reset Form
  const resetForm = () => {
    setPromoForm({
      uniquePromoId: `PRM-${Math.floor(100 + Math.random() * 900)}`,
      name: "",
      promoCode: "",
      description: "",
      applicableTo: "Rooms",
      discountType: "Percentage",
      rawDiscountNumber: 10,
      minSpend: 5000,
      minNights: 1,
      startDate: "2026-09-01",
      endDate: "2026-12-31",
      status: "Active",
    });
  };

  // Open Edit Form
  const handleOpenEdit = (promo: HotelPromotion) => {
    setEditingPromotion(promo);
    setPromoForm({
      uniquePromoId: promo.uniquePromoId || promo.id,
      name: promo.name,
      promoCode: promo.promoCode,
      description: promo.description,
      applicableTo: promo.applicableTo,
      discountType: promo.discountType,
      rawDiscountNumber: promo.rawDiscountNumber,
      minSpend: promo.minSpend || 0,
      minNights: promo.minNights || 1,
      startDate: promo.startDate,
      endDate: promo.endDate,
      status: promo.status,
    });
    setIsCreateModalOpen(true);
  };

  // Staff Manual Promo Code / Scheme ID Validation Engine (V1 System Rules)
  const handleValidateAndApplyCode = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredInput = applyForm.promoCode.trim().toUpperCase();
    const matchedPromo = promotionsList.find(
      (p) =>
        p.promoCode === enteredInput ||
        (p.uniquePromoId && p.uniquePromoId.toUpperCase() === enteredInput) ||
        p.id.toUpperCase() === enteredInput
    );

    if (!matchedPromo) {
      setApplyValidationResult({
        isValid: false,
        message: `Invalid Code/ID! "${enteredInput}" does not exist in PMS Promotions.`,
      });
      return;
    }

    if (matchedPromo.status !== "Active") {
      setApplyValidationResult({
        isValid: false,
        message: `Promotion "${matchedPromo.name}" [${matchedPromo.uniquePromoId}] is currently Inactive!`,
      });
      return;
    }

    // Check validity date
    const todayStr = "2026-08-24";
    if (todayStr < matchedPromo.startDate || todayStr > matchedPromo.endDate) {
      setApplyValidationResult({
        isValid: false,
        message: `Promo Scheme "${enteredInput}" is expired or not valid on today's date (${todayStr}). Valid dates: ${matchedPromo.startDate} to ${matchedPromo.endDate}.`,
      });
      return;
    }

    // Check service applicability
    if (matchedPromo.applicableTo !== applyForm.serviceType) {
      setApplyValidationResult({
        isValid: false,
        message: `Invalid Service! "${enteredInput}" is applicable only to "${matchedPromo.applicableTo}", but you selected "${applyForm.serviceType}".`,
      });
      return;
    }

    // Check Minimum Spend condition
    if (matchedPromo.minSpend && applyForm.billAmount < matchedPromo.minSpend) {
      setApplyValidationResult({
        isValid: false,
        message: `Ineligible! "${enteredInput}" requires a minimum spend of ₹${matchedPromo.minSpend.toLocaleString()}, but current bill is ₹${applyForm.billAmount.toLocaleString()}.`,
      });
      return;
    }

    // Calculate discount amount
    let calcDiscount = 0;
    if (matchedPromo.discountType === "Percentage") {
      calcDiscount = (applyForm.billAmount * matchedPromo.rawDiscountNumber) / 100;
    } else {
      calcDiscount = matchedPromo.rawDiscountNumber;
    }

    // Success validation
    setApplyValidationResult({
      isValid: true,
      message: `Promo Code Valid! Discount of ${matchedPromo.discountValue} applied successfully.`,
      appliedDiscountText: matchedPromo.discountValue,
      calculatedDiscountAmount: calcDiscount,
    });

    // Increment Usage Count
    setPromotionsList((prev) =>
      prev.map((p) => (p.id === matchedPromo.id ? { ...p, usageCount: p.usageCount + 1 } : p))
    );
  };

  return (
    <ModulePageShell
      eyebrow="Sales & Marketing / Offer Management"
      title="Promos & Discounts"
      description="Create, activate, and manage hotel promotional offers for Rooms, Restaurant, and Banquet services."
      breadcrumbs={[
        { label: "Sales & Marketing", href: "/sales-marketing/dashboard" },
        { label: "Marketing" },
        { label: "Promos & Discounts" },
      ]}
      actionButtons={
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setEditingPromotion(null);
            resetForm();
            setIsCreateModalOpen(true);
          }}
          className="rounded-full text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center gap-1.5 px-4 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> Create Promotion
        </Button>
      }
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: KPI CARDS
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mb-5">
        <HRKPICard
          label="Total Promotions"
          value={`${metrics.totalPromos}`}
          subtitle={`${metrics.activePromos} Active Offers`}
          tone="emerald"
          icon={<Ticket className="h-4 w-4" />}
        />
        <HRKPICard
          label="Active Offers"
          value={`${metrics.activePromos}`}
          subtitle="Currently Usable"
          tone="blue"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <HRKPICard
          label="Room Offers"
          value={`${metrics.roomOffers}`}
          subtitle="Stay Discounts"
          tone="purple"
          icon={<Bed className="h-4 w-4" />}
        />
        <HRKPICard
          label="Restaurant Offers"
          value={`${metrics.restaurantOffers}`}
          subtitle="Dining Offers"
          tone="amber"
          icon={<Utensils className="h-4 w-4" />}
        />
        <HRKPICard
          label="Banquet Offers"
          value={`${metrics.banquetOffers}`}
          subtitle="Event Discounts"
          tone="emerald"
          icon={<Building2 className="h-4 w-4" />}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: PROMOTIONS LIST WITH SEARCH & FILTERS
         ───────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by promo ID, name, code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 bg-slate-50 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            {/* Service Filter */}
            <select
              value={selectedServiceFilter}
              onChange={(e) => setSelectedServiceFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 py-1.5 px-3 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600"
            >
              <option value="ALL">All Services</option>
              <option value="Rooms">Rooms</option>
              <option value="Restaurant">Restaurant</option>
              <option value="Banquet">Banquet</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 py-1.5 px-3 bg-white font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="text-xs font-bold text-slate-500">
            Showing <span className="text-slate-900">{filteredPromotions.length}</span> promotions
          </div>
        </div>

        {/* PROMOTION LIST TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 text-left">Unique Promo ID</th>
                  <th className="py-3.5 px-4 text-left">Promotion Name</th>
                  <th className="py-3.5 px-4 text-center">Promo Code</th>
                  <th className="py-3.5 px-4 text-center">Applicable To</th>
                  <th className="py-3.5 px-4 text-center">Discount</th>
                  <th className="py-3.5 px-4 text-left">Eligibility Criteria</th>
                  <th className="py-3.5 px-4 text-center">Validity Period</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Usage Count</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPromotions.length > 0 ? (
                  filteredPromotions.map((promo) => (
                    <tr key={promo.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-mono">
                        <span className="bg-slate-100 text-slate-900 font-extrabold text-[11px] px-2.5 py-1 rounded-md border border-slate-200 inline-flex items-center gap-1 shadow-xs">
                          <Tag className="h-3 w-3 text-emerald-700" />
                          {promo.uniquePromoId || promo.id}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <strong className="text-xs font-bold text-slate-900 block">{promo.name}</strong>
                        <span className="text-[10px] text-slate-400 line-clamp-1 block mb-1">{promo.description}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 font-extrabold font-mono text-[11px] px-2.5 py-0.5 rounded-full border border-emerald-200">
                          <Tag className="h-3 w-3" />
                          {promo.promoCode}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border",
                            promo.applicableTo === "Rooms"
                              ? "bg-purple-50 text-purple-800 border-purple-200"
                              : promo.applicableTo === "Restaurant"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-blue-50 text-blue-800 border-blue-200"
                          )}
                        >
                          {promo.applicableTo === "Rooms" && <Bed className="h-3 w-3" />}
                          {promo.applicableTo === "Restaurant" && <Utensils className="h-3 w-3" />}
                          {promo.applicableTo === "Banquet" && <Building2 className="h-3 w-3" />}
                          {promo.applicableTo}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-extrabold font-mono text-emerald-800">
                        {promo.discountValue}
                        <span className="text-[9px] font-normal text-slate-400 block">({promo.discountType})</span>
                      </td>

                      {/* ELIGIBILITY CRITERIA COLUMN */}
                      <td className="py-3.5 px-4 text-left">
                        <div className="flex flex-col gap-1 text-[10px]">
                          {promo.minSpend && promo.minSpend > 0 ? (
                            <span className="font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md w-fit">
                              Min Spend: ₹{promo.minSpend.toLocaleString("en-IN")}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">No Min Spend</span>
                          )}
                          {promo.applicableTo === "Rooms" && promo.minNights && promo.minNights > 0 && (
                            <span className="font-bold text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md w-fit">
                              Min Stay: {promo.minNights} {promo.minNights === 1 ? "Night" : "Nights"}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="text-slate-800 font-mono text-[10px] block">
                          {promo.startDate} to {promo.endDate}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(promo)}
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border cursor-pointer transition hover:opacity-80",
                            promo.status === "Active"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              promo.status === "Active" ? "bg-emerald-500" : "bg-slate-400"
                            )}
                          />
                          {promo.status}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold font-mono text-slate-800">
                        {promo.usageCount} times
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEdit(promo)}
                            className="rounded-lg text-xs font-bold px-2.5 h-7 border-slate-200 cursor-pointer"
                          >
                            <Edit2 className="h-3 w-3 mr-1" /> Edit
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(promo)}
                            className="rounded-lg text-[10px] font-bold px-2 h-7 border-slate-200 cursor-pointer"
                          >
                            {promo.status === "Active" ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500 text-xs">
                      No hotel promotions found matching your search filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: CREATE / EDIT PROMOTION MODAL (V1 FIELD SPEC)
         ───────────────────────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingPromotion(null);
          }}
          title={editingPromotion ? `Edit Promotion - ${editingPromotion.name}` : "Create New Hotel Promotion"}
        >
          <form onSubmit={handleSavePromotion} className="space-y-4 text-xs p-1">
            <div className="space-y-3">
              {/* Unique Promo Scheme ID (For Front Office / PMS Integration) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold uppercase text-slate-600 block">
                    Unique Promo Scheme ID (Front Office Integration ID) *
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoGenerateId}
                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3" /> Auto-Generate ID
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. PRM-101, SCHEME-ROOM-01"
                  value={promoForm.uniquePromoId}
                  onChange={(e) => setPromoForm({ ...promoForm, uniquePromoId: e.target.value.toUpperCase() })}
                  className="w-full text-xs font-mono font-extrabold rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-slate-900 uppercase focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Front Office Note: Rates &amp; schemes in Front Office / Reservations reference this Unique Promo ID.
                </span>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                  Promotion Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Birthday Offer, Monsoon Escape"
                  value={promoForm.name}
                  onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                  Promo Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BIRTHDAY10, MONSOON20"
                  value={promoForm.promoCode}
                  onChange={(e) => setPromoForm({ ...promoForm, promoCode: e.target.value.toUpperCase() })}
                  className="w-full text-xs font-bold font-mono rounded-xl border border-slate-200 p-2.5 bg-white text-emerald-800 uppercase focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={promoForm.description}
                  onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                  placeholder="Describe offer conditions or staff guidance..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-white font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    Applicable To *
                  </label>
                  <select
                    value={promoForm.applicableTo}
                    onChange={(e) => setPromoForm({ ...promoForm, applicableTo: e.target.value as ApplicableService })}
                    className="w-full text-xs font-bold rounded-xl border border-slate-200 p-2.5 bg-white text-slate-900"
                  >
                    <option value="Rooms">Rooms</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Banquet">Banquet</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={promoForm.discountType}
                    onChange={(e) => {
                      const newType = e.target.value as DiscountType;
                      const defaultVal = newType === "Percentage" ? 15 : 1500;
                      setPromoForm({
                        ...promoForm,
                        discountType: newType,
                        rawDiscountNumber: defaultVal,
                      });
                    }}
                    className="w-full text-xs font-bold rounded-xl border border-slate-200 p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Fixed Amount">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    Discount Value {promoForm.discountType === "Percentage" ? "(%) *" : "(₹) *"}
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 font-extrabold text-slate-500 text-xs select-none">
                      {promoForm.discountType === "Percentage" ? "%" : "₹"}
                    </span>
                    <input
                      type="number"
                      required
                      min={1}
                      max={promoForm.discountType === "Percentage" ? 100 : undefined}
                      placeholder={promoForm.discountType === "Percentage" ? "e.g. 10, 20" : "e.g. 1500, 50000"}
                      value={promoForm.rawDiscountNumber}
                      onChange={(e) => setPromoForm({ ...promoForm, rawDiscountNumber: Number(e.target.value) })}
                      className="w-full text-xs font-extrabold rounded-xl border border-slate-200 pl-8 pr-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    Status
                  </label>
                  <select
                    value={promoForm.status}
                    onChange={(e) => setPromoForm({ ...promoForm, status: e.target.value as PromoStatus })}
                    className="w-full text-xs font-bold rounded-xl border border-slate-200 p-2.5 bg-white text-slate-900"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* ELIGIBILITY CONDITIONS (MIN SPEND / MIN STAY) */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-700 block">
                  Eligibility &amp; Qualification Thresholds
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">
                      Minimum Spend (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g. 5000 (0 for no min spend)"
                      value={promoForm.minSpend || 0}
                      onChange={(e) => setPromoForm({ ...promoForm, minSpend: Number(e.target.value) })}
                      className="w-full text-xs font-bold rounded-xl border border-slate-200 p-2 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                    <span className="text-[9px] text-slate-400 block mt-0.5">
                      Min booking/bill cost required to apply promo
                    </span>
                  </div>

                  {promoForm.applicableTo === "Rooms" && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">
                        Minimum Stay (Nights)
                      </label>
                      <input
                        type="number"
                        min={1}
                        placeholder="e.g. 2 nights"
                        value={promoForm.minNights || 1}
                        onChange={(e) => setPromoForm({ ...promoForm, minNights: Number(e.target.value) })}
                        className="w-full text-xs font-bold rounded-xl border border-slate-200 p-2 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      />
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        Min room nights required for eligibility
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={promoForm.startDate}
                    onChange={(e) => setPromoForm({ ...promoForm, startDate: e.target.value })}
                    className="w-full text-xs font-bold rounded-xl border border-slate-200 p-2 bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={promoForm.endDate}
                    onChange={(e) => setPromoForm({ ...promoForm, endDate: e.target.value })}
                    className="w-full text-xs font-bold rounded-xl border border-slate-200 p-2 bg-white text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingPromotion(null);
                }}
                className="rounded-full text-xs font-bold px-4"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-full text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white px-5 shadow-sm"
              >
                {editingPromotion ? "Update Promotion" : "Save Promotion"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: STAFF MANUAL PROMO CODE APPLICATION TOOL (MODAL)
         ───────────────────────────────────────────────────────────── */}
      {isApplyModalOpen && (
        <Modal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          title="Manual Promo Code Application (Staff Tool)"
        >
          <form onSubmit={handleValidateAndApplyCode} className="space-y-4 text-xs p-1">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px]">
              Front Desk, Restaurant Cashiers, and Banquet staff can manually enter and validate guest promo codes before applying discounts to bills or bookings.
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                  Enter Guest Promo Code or Unique Scheme ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MONSOON20 or PRM-101"
                  value={applyForm.promoCode}
                  onChange={(e) => setApplyForm({ ...applyForm, promoCode: e.target.value.toUpperCase() })}
                  className="w-full text-xs font-bold font-mono rounded-xl border border-slate-200 p-2.5 bg-white text-emerald-800 uppercase focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    Service Being Billed *
                  </label>
                  <select
                    value={applyForm.serviceType}
                    onChange={(e) => setApplyForm({ ...applyForm, serviceType: e.target.value as ApplicableService })}
                    className="w-full text-xs font-bold rounded-xl border border-slate-200 p-2.5 bg-white text-slate-900"
                  >
                    <option value="Rooms">Rooms (Front Desk)</option>
                    <option value="Restaurant">Restaurant (F&amp;B Cashier)</option>
                    <option value="Banquet">Banquet (Event Desk)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                    Bill / Booking Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={applyForm.billAmount}
                    onChange={(e) => setApplyForm({ ...applyForm, billAmount: Number(e.target.value) })}
                    className="w-full text-xs font-bold rounded-xl border border-slate-200 p-2.5 bg-white text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                  Staff Role / Desk
                </label>
                <select
                  value={applyForm.appliedByStaffRole}
                  onChange={(e) => setApplyForm({ ...applyForm, appliedByStaffRole: e.target.value })}
                  className="w-full text-xs font-bold rounded-xl border border-slate-200 p-2.5 bg-white text-slate-900"
                >
                  <option value="Front Desk Staff">Front Desk Staff</option>
                  <option value="Restaurant Cashier">Restaurant Cashier</option>
                  <option value="Banquet Staff">Banquet Staff</option>
                  <option value="Reservation Staff">Reservation Staff</option>
                </select>
              </div>
            </div>

            {/* VALIDATION RESULT DISPLAY */}
            {applyValidationResult && (
              <div
                className={cn(
                  "p-3.5 rounded-xl border text-xs font-medium space-y-1.5",
                  applyValidationResult.isValid
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-red-50 border-red-200 text-red-900"
                )}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {applyValidationResult.isValid ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  {applyValidationResult.message}
                </div>

                {applyValidationResult.isValid && applyValidationResult.calculatedDiscountAmount !== undefined && (
                  <div className="pt-2 border-t border-emerald-200/60 space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-semibold text-emerald-950">
                      <span>Front Office Linked Scheme ID:</span>
                      <span className="font-mono text-emerald-900 font-extrabold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                        {promotionsList.find((p) => p.promoCode === applyForm.promoCode.trim().toUpperCase() || p.uniquePromoId.toUpperCase() === applyForm.promoCode.trim().toUpperCase())?.uniquePromoId || "PRM-101"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold pt-1">
                      <span>Discount Calculated:</span>
                      <span className="font-mono text-emerald-800 text-sm font-extrabold">
                        - ₹{applyValidationResult.calculatedDiscountAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsApplyModalOpen(false)}
                className="rounded-full text-xs font-bold px-4"
              >
                Close
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-full text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white px-5 shadow-sm"
              >
                Validate &amp; Apply Promo
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </ModulePageShell>
  );
}
