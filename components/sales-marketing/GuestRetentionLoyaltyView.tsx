"use client";

import React, { useState, useMemo } from "react";
import {
  Crown,
  Gift,
  Award,
  Users,
  Search,
  Plus,
  Sparkles,
  TrendingUp,
  Heart,
  ShieldCheck,
  Star,
  Clock,
  Eye,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Zap,
  Mail,
  Send,
  History,
  Layers,
  Settings,
  ArrowRight,
  ChevronRight,
  Bed,
  Utensils,
  Coffee,
  Car,
  Wine,
  Percent,
  UserX,
  UserCheck,
  RotateCcw,
  Tag,
  X,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Card, Drawer, Modal, StatusBadge } from "@/components/ui";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// TYPES & SCHEMAS FOR ENTERPRISE LOYALTY & RETENTION
// ─────────────────────────────────────────────────────────────

export type RetentionStatus = "Active" | "At Risk" | "Lost" | "New Member";

export type TierName = "Platinum VIP" | "Gold Preferred" | "Silver Member" | "Club Member";

export interface GuestLoyaltyMember {
  id: string;
  guestName: string;
  email: string;
  phone: string;
  tier: TierName;
  retentionStatus: RetentionStatus;
  totalStays: number;
  totalSpend: number;
  rewardPointsBalance: number;
  lastStayDate: string;
  lastVisitAgeDays: number; // e.g. 12, 65, 195
  nextTierProgressPercent: number; // e.g. 80% to Platinum
  staysNeededForNextTier: number;
  favoriteRoomType: string;
  favoriteMealPref: string;
  
  // Member Drawer Details
  stayHistory: {
    resNo: string;
    checkIn: string;
    checkOut: string;
    roomType: string;
    amount: number;
  }[];
  pointsLedger: {
    id: string;
    type: "Earned" | "Redeemed" | "Expired" | "Bonus";
    points: number;
    description: string;
    date: string;
  }[];
  campaignHistory: {
    campaignName: string;
    sentDate: string;
    status: "Opened" | "Clicked" | "Converted" | "Sent";
  }[];
}

export interface MembershipTierConfig {
  name: TierName;
  code: string; // e.g. TIER-GLD
  colorBadge: string; // e.g. "bg-amber-100 text-amber-900 border-amber-300"
  description: string;
  status: "Active" | "Inactive";
  priorityRank: number; // 1 (Club) -> 2 (Silver) -> 3 (Gold) -> 4 (Platinum)

  // Qualification Rules (OR logic)
  qualification: {
    minStays: number;
    minSpend: number;
    minNights: number;
    minPoints: number;
  };

  // Tier Benefits (Multi-select)
  benefits: string[];
  customBenefitNotes: string;

  // Outlet Discounts
  discounts: {
    roomDiscountPercent: number;
    restaurantDiscountPercent: number;
    banquetDiscountPercent: number;
    spaDiscountPercent: number;
  };

  // Upgrade & Downgrade Rules
  upgradeRules: {
    autoUpgradeEnabled: boolean;
    manualApprovalRequired: boolean;
    upgradeTiming: "Immediately" | "At Checkout" | "At Month End";
  };
  downgradeRules: {
    downgradeEnabled: boolean;
    inactivityMonths: number;
    minSpendRequirement: number;
    minStayRequirement: number;
  };

  // Points & Expiry
  pointMultiplier: number; // e.g. 1.0x, 1.25x, 1.5x, 2.0x
  expiryRules: "Never Expire" | "Expire After 12 Months" | "Expire After 24 Months" | "Annual Review";

  // Audit Info
  audit: {
    createdBy: string;
    lastUpdatedBy: string;
    lastModifiedDate: string;
  };
}

export interface RewardCatalogItem {
  id: string;
  rewardName: string;
  category: "Dining" | "Stay Upgrade" | "Spa & Wellness" | "Transport";
  pointsRequired: number;
  monetaryValue: number;
  status: "Active" | "Draft";
  iconName: string;
}

export interface RetentionCampaignRule {
  id: string;
  ruleName: string;
  triggerEvent: "No Stay 90 Days (At Risk)" | "Birthday This Month" | "Tier Upgrade" | "Points Expiring Soon";
  targetSegment: string;
  rewardOffer: string;
  status: "Active Automation" | "Paused";
  convertedCount: number;
}

// ─────────────────────────────────────────────────────────────
// INITIAL MOCK DATA
// ─────────────────────────────────────────────────────────────

export const INITIAL_MEMBERSHIP_TIERS: MembershipTierConfig[] = [
  {
    name: "Club Member",
    code: "TIER-CLB",
    colorBadge: "bg-slate-100 text-slate-800 border-slate-300",
    description: "Entry-level tier granted automatically upon first hotel stay or registration.",
    status: "Active",
    priorityRank: 1,
    qualification: { minStays: 1, minSpend: 0, minNights: 1, minPoints: 0 },
    benefits: ["5% Room Discount", "Welcome Beverage on Arrival", "Priority Check-in Queue"],
    customBenefitNotes: "Welcome beverage served at lobby lounge during check-in.",
    discounts: { roomDiscountPercent: 5, restaurantDiscountPercent: 5, banquetDiscountPercent: 0, spaDiscountPercent: 0 },
    upgradeRules: { autoUpgradeEnabled: true, manualApprovalRequired: false, upgradeTiming: "Immediately" },
    downgradeRules: { downgradeEnabled: false, inactivityMonths: 12, minSpendRequirement: 0, minStayRequirement: 0 },
    pointMultiplier: 1.0,
    expiryRules: "Never Expire",
    audit: { createdBy: "Admin", lastUpdatedBy: "Ananya Roy", lastModifiedDate: "2026-08-15" },
  },
  {
    name: "Silver Member",
    code: "TIER-SLV",
    colorBadge: "bg-slate-200 text-slate-900 border-slate-400",
    description: "Frequent guest tier unlocked after 5 stays or ₹50,000 lifetime spend.",
    status: "Active",
    priorityRank: 2,
    qualification: { minStays: 5, minSpend: 50000, minNights: 8, minPoints: 5000 },
    benefits: ["10% Room Discount", "Late Check-Out (2 PM)", "Free Buffet Breakfast", "10% Restaurant Discount"],
    customBenefitNotes: "Late checkout Subject to availability during peak dates.",
    discounts: { roomDiscountPercent: 10, restaurantDiscountPercent: 10, banquetDiscountPercent: 5, spaDiscountPercent: 5 },
    upgradeRules: { autoUpgradeEnabled: true, manualApprovalRequired: false, upgradeTiming: "At Checkout" },
    downgradeRules: { downgradeEnabled: true, inactivityMonths: 12, minSpendRequirement: 25000, minStayRequirement: 2 },
    pointMultiplier: 1.25,
    expiryRules: "Expire After 12 Months",
    audit: { createdBy: "Admin", lastUpdatedBy: "Ananya Roy", lastModifiedDate: "2026-08-18" },
  },
  {
    name: "Gold Preferred",
    code: "TIER-GLD",
    colorBadge: "bg-amber-100 text-amber-900 border-amber-300",
    description: "High-value regular guest tier unlocked after 10 stays or ₹1.5L spend.",
    status: "Active",
    priorityRank: 3,
    qualification: { minStays: 10, minSpend: 150000, minNights: 15, minPoints: 15000 },
    benefits: ["15% Room & Food Discount", "Priority Room Upgrade", "Early Check-in (10 AM)", "Free Airport Pickup"],
    customBenefitNotes: "Complimentary room upgrade to next category automatically allocated upon availability.",
    discounts: { roomDiscountPercent: 15, restaurantDiscountPercent: 15, banquetDiscountPercent: 10, spaDiscountPercent: 15 },
    upgradeRules: { autoUpgradeEnabled: true, manualApprovalRequired: false, upgradeTiming: "At Checkout" },
    downgradeRules: { downgradeEnabled: true, inactivityMonths: 12, minSpendRequirement: 75000, minStayRequirement: 5 },
    pointMultiplier: 1.5,
    expiryRules: "Annual Review",
    audit: { createdBy: "Admin", lastUpdatedBy: "Kavita Nair", lastModifiedDate: "2026-08-20" },
  },
  {
    name: "Platinum VIP",
    code: "TIER-PLT",
    colorBadge: "bg-purple-100 text-purple-900 border-purple-300",
    description: "Top VIP tier for corporate heads, high spenders & ambassador guests.",
    status: "Active",
    priorityRank: 4,
    qualification: { minStays: 20, minSpend: 350000, minNights: 30, minPoints: 35000 },
    benefits: ["20% All Hotel Outlets Discount", "Guaranteed Suite Upgrade", "24/7 VIP Concierge Support", "Free Airport Pick & Drop", "Spa & Wellness Complimentary Pass"],
    customBenefitNotes: "Guaranteed suite upgrade & 24/7 dedicated GM Concierge hotline access.",
    discounts: { roomDiscountPercent: 20, restaurantDiscountPercent: 20, banquetDiscountPercent: 15, spaDiscountPercent: 20 },
    upgradeRules: { autoUpgradeEnabled: true, manualApprovalRequired: true, upgradeTiming: "Immediately" },
    downgradeRules: { downgradeEnabled: true, inactivityMonths: 18, minSpendRequirement: 200000, minStayRequirement: 10 },
    pointMultiplier: 2.0,
    expiryRules: "Never Expire",
    audit: { createdBy: "Admin", lastUpdatedBy: "Kavita Nair", lastModifiedDate: "2026-08-22" },
  },
];

export const INITIAL_REWARD_CATALOG: RewardCatalogItem[] = [
  {
    id: "RWD-01",
    rewardName: "Complimentary Chef's Special Gourmet Dinner",
    category: "Dining",
    pointsRequired: 3000,
    monetaryValue: 2500,
    status: "Active",
    iconName: "Utensils",
  },
  {
    id: "RWD-02",
    rewardName: "Luxury Mercedes Airport Pick & Drop",
    category: "Transport",
    pointsRequired: 4500,
    monetaryValue: 4000,
    status: "Active",
    iconName: "Car",
  },
  {
    id: "RWD-03",
    rewardName: "Suite Room Night Stay Voucher",
    category: "Stay Upgrade",
    pointsRequired: 8000,
    monetaryValue: 12000,
    status: "Active",
    iconName: "Bed",
  },
  {
    id: "RWD-04",
    rewardName: "Full Body Rejuvenation Spa Massage (60 Min)",
    category: "Spa & Wellness",
    pointsRequired: 3500,
    monetaryValue: 3000,
    status: "Active",
    iconName: "Coffee",
  },
];

export const INITIAL_AUTOMATION_RULES: RetentionCampaignRule[] = [
  {
    id: "AUT-01",
    ruleName: "At-Risk Re-engagement Offer",
    triggerEvent: "No Stay 90 Days (At Risk)",
    targetSegment: "Guests inactive for 90+ Days",
    rewardOffer: "Free Dinner Voucher + 15% Off Return Stay",
    status: "Active Automation",
    convertedCount: 28,
  },
  {
    id: "AUT-02",
    ruleName: "VIP Birthday Celebration Special",
    triggerEvent: "Birthday This Month",
    targetSegment: "All Members with Birthday in current month",
    rewardOffer: "Complimentary Cake & 2,000 Bonus Loyalty Points",
    status: "Active Automation",
    convertedCount: 45,
  },
  {
    id: "AUT-03",
    ruleName: "Tier Advancement Congratulatory Gift",
    triggerEvent: "Tier Upgrade",
    targetSegment: "Guests upgraded to Gold or Platinum",
    rewardOffer: "Free Suite Upgrade on Next Stay",
    status: "Active Automation",
    convertedCount: 19,
  },
];

export const INITIAL_LOYALTY_GUESTS: GuestLoyaltyMember[] = [
  {
    id: "LOY-101",
    guestName: "Dr. Vikram Sethi",
    email: "vikram.sethi@healthcorp.com",
    phone: "+91 98112 33445",
    tier: "Platinum VIP",
    retentionStatus: "Active",
    totalStays: 24,
    totalSpend: 485000,
    rewardPointsBalance: 14200,
    lastStayDate: "2026-08-10",
    lastVisitAgeDays: 12,
    nextTierProgressPercent: 100,
    staysNeededForNextTier: 0,
    favoriteRoomType: "Royal Heritage Suite",
    favoriteMealPref: "North Indian / Jain Gourmet",
    stayHistory: [
      { resNo: "RES-99401", checkIn: "2026-08-08", checkOut: "2026-08-10", roomType: "Royal Heritage Suite", amount: 45000 },
      { resNo: "RES-98210", checkIn: "2026-06-12", checkOut: "2026-06-15", roomType: "Royal Heritage Suite", amount: 62000 },
    ],
    pointsLedger: [
      { id: "TX-901", type: "Earned", points: 4500, description: "Stay Completed #RES-99401", date: "2026-08-10" },
      { id: "TX-842", type: "Redeemed", points: -3000, description: "Redeemed Gourmet Dinner Voucher", date: "2026-06-14" },
    ],
    campaignHistory: [
      { campaignName: "Platinum VIP Welcome Special", sentDate: "2026-08-01", status: "Converted" },
    ],
  },
  {
    id: "LOY-102",
    guestName: "Meera Kapoor",
    email: "meera.k@designstudio.in",
    phone: "+91 98200 99881",
    tier: "Gold Preferred",
    retentionStatus: "Active",
    totalStays: 14,
    totalSpend: 245000,
    rewardPointsBalance: 6800,
    lastStayDate: "2026-07-28",
    lastVisitAgeDays: 25,
    nextTierProgressPercent: 70,
    staysNeededForNextTier: 6,
    favoriteRoomType: "Deluxe King Room",
    favoriteMealPref: "Continental / Vegan",
    stayHistory: [
      { resNo: "RES-99102", checkIn: "2026-07-26", checkOut: "2026-07-28", roomType: "Deluxe King Room", amount: 18000 },
    ],
    pointsLedger: [
      { id: "TX-880", type: "Earned", points: 1800, description: "Stay Completed #RES-99102", date: "2026-07-28" },
    ],
    campaignHistory: [
      { campaignName: "Gold Tier Perks Upgrade Notice", sentDate: "2026-07-01", status: "Opened" },
    ],
  },
  {
    id: "LOY-103",
    guestName: "Anand Singhania",
    email: "anand@singhania.com",
    phone: "+91 99301 22110",
    tier: "Platinum VIP",
    retentionStatus: "Active",
    totalStays: 38,
    totalSpend: 890000,
    rewardPointsBalance: 29500,
    lastStayDate: "2026-08-18",
    lastVisitAgeDays: 4,
    nextTierProgressPercent: 100,
    staysNeededForNextTier: 0,
    favoriteRoomType: "Presidential Villa",
    favoriteMealPref: "Asian Fine Dining",
    stayHistory: [
      { resNo: "RES-99550", checkIn: "2026-08-15", checkOut: "2026-08-18", roomType: "Presidential Villa", amount: 120000 },
    ],
    pointsLedger: [
      { id: "TX-940", type: "Earned", points: 12000, description: "Stay Completed #RES-99550", date: "2026-08-18" },
    ],
    campaignHistory: [
      { campaignName: "Independence Weekend VIP Retreat", sentDate: "2026-08-05", status: "Converted" },
    ],
  },
  {
    id: "LOY-104",
    guestName: "Rohan & Sneha Joshi",
    email: "rohan.joshi@gmail.com",
    phone: "+91 97690 11223",
    tier: "Silver Member",
    retentionStatus: "At Risk",
    totalStays: 6,
    totalSpend: 95000,
    rewardPointsBalance: 2400,
    lastStayDate: "2026-05-10",
    lastVisitAgeDays: 104, // > 90 Days -> At Risk!
    nextTierProgressPercent: 60,
    staysNeededForNextTier: 4,
    favoriteRoomType: "Executive Twin Room",
    favoriteMealPref: "Indian Buffet",
    stayHistory: [
      { resNo: "RES-95200", checkIn: "2026-05-08", checkOut: "2026-05-10", roomType: "Executive Twin Room", amount: 14000 },
    ],
    pointsLedger: [
      { id: "TX-701", type: "Earned", points: 1400, description: "Stay Completed #RES-95200", date: "2026-05-10" },
    ],
    campaignHistory: [
      { campaignName: "We Miss You - 15% Off Return Stay", sentDate: "2026-08-01", status: "Sent" },
    ],
  },
  {
    id: "LOY-105",
    guestName: "Tanya Oberoi",
    email: "tanya.oberoi@fashion.in",
    phone: "+91 98199 44556",
    tier: "Gold Preferred",
    retentionStatus: "Active",
    totalStays: 11,
    totalSpend: 198000,
    rewardPointsBalance: 5100,
    lastStayDate: "2026-08-02",
    lastVisitAgeDays: 20,
    nextTierProgressPercent: 55,
    staysNeededForNextTier: 9,
    favoriteRoomType: "Deluxe King Room",
    favoriteMealPref: "Italian / Wine Pairing",
    stayHistory: [
      { resNo: "RES-99200", checkIn: "2026-07-31", checkOut: "2026-08-02", roomType: "Deluxe King Room", amount: 22000 },
    ],
    pointsLedger: [
      { id: "TX-890", type: "Earned", points: 2200, description: "Stay Completed #RES-99200", date: "2026-08-02" },
    ],
    campaignHistory: [
      { campaignName: "Monsoon Spa & Dining Special", sentDate: "2026-07-20", status: "Clicked" },
    ],
  },
  {
    id: "LOY-106",
    guestName: "Amitabh Choudhury",
    email: "amitabh.c@techcorp.io",
    phone: "+91 98330 77661",
    tier: "Club Member",
    retentionStatus: "Lost",
    totalStays: 2,
    totalSpend: 28000,
    rewardPointsBalance: 1200,
    lastStayDate: "2025-11-14",
    lastVisitAgeDays: 283, // > 180 Days -> Lost!
    nextTierProgressPercent: 40,
    staysNeededForNextTier: 3,
    favoriteRoomType: "Standard Room",
    favoriteMealPref: "South Indian Breakfast",
    stayHistory: [
      { resNo: "RES-88120", checkIn: "2025-11-12", checkOut: "2025-11-14", roomType: "Standard Room", amount: 12000 },
    ],
    pointsLedger: [
      { id: "TX-410", type: "Earned", points: 1200, description: "Stay Completed #RES-88120", date: "2025-11-14" },
    ],
    campaignHistory: [
      { campaignName: "Win-Back Special - Free Upgrade", sentDate: "2026-06-01", status: "Opened" },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// COMPONENT IMPLEMENTATION
// ─────────────────────────────────────────────────────────────

export function GuestRetentionLoyaltyView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Drawer & Modal States
  const [selectedMemberDrawer, setSelectedMemberDrawer] = useState<GuestLoyaltyMember | null>(null);
  const [drawerActiveTab, setDrawerActiveTab] = useState<"overview" | "history" | "ledger">("overview");

  const guests = INITIAL_LOYALTY_GUESTS;

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalMembers = guests.length;
    const activeCount = guests.filter((g) => g.retentionStatus === "Active").length;
    const atRiskCount = guests.filter((g) => g.retentionStatus === "At Risk").length;
    const lostCount = guests.filter((g) => g.retentionStatus === "Lost").length;
    const totalPoints = guests.reduce((s, g) => s + g.rewardPointsBalance, 0);

    return {
      totalMembers,
      activeCount,
      atRiskCount,
      lostCount,
      totalPoints,
      repeatStayRate: "44.2%",
    };
  }, [guests]);

  // Filtered Member List
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const matchSearch =
        g.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.phone.includes(searchTerm) ||
        g.tier.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [guests, searchTerm]);

  return (
    <ModulePageShell
      eyebrow="Sales & Marketing / CRM Retention Engine"
      title="Guest Retention & Loyalty Command Center"
      description="Drive guest repeat visits, manage tiered VIP perks, rewards catalog, automated win-back triggers, and points ledgers."
      breadcrumbs={[
        { label: "Sales & Marketing", href: "/sales-marketing/dashboard" },
        { label: "Marketing" },
        { label: "Guest Retention & Loyalty" },
      ]}
      actionButtons={
        <Button
          type="button"
          size="sm"
          onClick={() => setToastMessage("Issued 1,000 festive bonus reward points to all Gold & Platinum members!")}
          className="rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-2xs flex items-center gap-1.5 px-3.5 py-1.5 cursor-pointer"
        >
          <Gift className="h-3.5 w-3.5" /> Issue Bonus Loyalty Points
        </Button>
      }
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. TOP SUMMARY CARDS (RETENTION KPI METRICS - F&B DASHBOARD STYLE)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5 mb-5">
        {/* Card 1: Total Loyalty Members */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Total Loyalty Members
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 sm:h-8 sm:w-8">
              <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate">
            {metrics.totalMembers}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs truncate">
            {metrics.activeCount} Active Members
          </p>
        </Card>

        {/* Card 2: At-Risk Guests */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              At-Risk Guests (90+ Days)
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 sm:h-8 sm:w-8">
              <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate">
            {metrics.atRiskCount}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs truncate">
            Needs Re-engagement
          </p>
        </Card>

        {/* Card 3: Lost / Inactive Guests */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Lost / Inactive Guests
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-700 sm:h-8 sm:w-8">
              <UserX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate">
            {metrics.lostCount}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs truncate">
            180+ Days Inactive
          </p>
        </Card>

        {/* Card 4: Repeat Stay Rate */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Repeat Stay Rate
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 sm:h-8 sm:w-8">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate">
            {metrics.repeatStayRate}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs truncate">
            Guest Retention %
          </p>
        </Card>

        {/* Card 5: Active Points Outstanding */}
        <Card className="h-full min-w-0 p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              Active Points Outstanding
            </p>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 sm:h-8 sm:w-8">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900 sm:text-2xl truncate">
            {(metrics.totalPoints / 1000).toFixed(1)}k
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs truncate">
            Reward Balance
          </p>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. LOYALTY MEMBERS DIRECTORY
         ───────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {/* SEARCH & CONTROLS BAR */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search member name, email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-md cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500">
            Showing <strong className="font-semibold text-slate-800">{filteredGuests.length}</strong> of {guests.length} members • <span className="text-slate-500">Guest Loyalty &amp; Retention Register</span>
          </div>
        </div>

        {/* MEMBERS TABLE */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 text-left">MEMBER &amp; CONTACT</th>
                  <th className="py-3 px-4 text-left">TIER &amp; STATUS</th>
                  <th className="py-3 px-4 text-center">LAST STAY</th>
                  <th className="py-3 px-4 text-center">TOTAL STAYS</th>
                  <th className="py-3 px-4 text-right">LIFETIME SPEND</th>
                  <th className="py-3 px-4 text-center">REWARD POINTS</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGuests.length > 0 ? (
                  filteredGuests.map((guest) => (
                    <tr key={guest.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <strong className="text-xs font-bold text-slate-900 block">{guest.guestName}</strong>
                        <span className="text-[10px] text-slate-500">
                          {guest.email} • {guest.phone}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold border",
                              guest.tier === "Platinum VIP"
                                ? "bg-purple-50 text-purple-800 border-purple-200"
                                : guest.tier === "Gold Preferred"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : guest.tier === "Silver Member"
                                ? "bg-slate-100 text-slate-800 border-slate-200"
                                : "bg-slate-50 text-slate-700 border-slate-200"
                            )}
                          >
                            {guest.tier}
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                              guest.retentionStatus === "Active"
                                ? "bg-emerald-50 text-emerald-700"
                                : guest.retentionStatus === "At Risk"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-rose-50 text-rose-700"
                            )}
                          >
                            {guest.retentionStatus}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <strong className="text-slate-800 font-mono text-xs block">{guest.lastStayDate}</strong>
                        <span
                          className={cn(
                            "text-[10px] font-semibold",
                            guest.lastVisitAgeDays > 90 ? "text-amber-700" : "text-slate-400"
                          )}
                        >
                          {guest.lastVisitAgeDays} Days Ago
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-bold font-mono text-slate-900">
                        {guest.totalStays} Stays
                      </td>

                      <td className="py-3 px-4 text-right font-bold font-mono text-slate-900">
                        ₹{guest.totalSpend.toLocaleString("en-IN")}
                      </td>

                      <td className="py-3 px-4 text-center font-bold font-mono text-emerald-800">
                        {guest.rewardPointsBalance.toLocaleString("en-IN")} Pts
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMemberDrawer(guest);
                            setDrawerActiveTab("overview");
                          }}
                          className="rounded-lg text-xs font-semibold px-2.5 h-7 border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs"
                        >
                          <Eye className="h-3 w-3 mr-1 text-slate-500" /> View Profile
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                      No loyalty members found matching your search filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          7. FULL MEMBER PROFILE & RETENTION DRAWER
         ───────────────────────────────────────────────────────────── */}
      {selectedMemberDrawer && (
        <Drawer
          isOpen={Boolean(selectedMemberDrawer)}
          onClose={() => setSelectedMemberDrawer(null)}
          title={selectedMemberDrawer.guestName}
        >
          <div className="space-y-4 text-xs p-1">
            {/* Drawer Tab Navigation */}
            <div className="flex items-center gap-1 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setDrawerActiveTab("overview")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs transition cursor-pointer",
                  drawerActiveTab === "overview"
                    ? "bg-slate-900 text-white shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium"
                )}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setDrawerActiveTab("history")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs transition cursor-pointer",
                  drawerActiveTab === "history"
                    ? "bg-slate-900 text-white shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium"
                )}
              >
                Stay History
              </button>
              <button
                type="button"
                onClick={() => setDrawerActiveTab("ledger")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs transition cursor-pointer",
                  drawerActiveTab === "ledger"
                    ? "bg-slate-900 text-white shadow-2xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium"
                )}
              >
                Points Ledger
              </button>
            </div>

            {/* TAB 1: OVERVIEW */}
            {drawerActiveTab === "overview" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Contact Email:</span>
                    <strong className="text-slate-900">{selectedMemberDrawer.email}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Phone:</span>
                    <strong className="text-slate-900">{selectedMemberDrawer.phone}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Lifetime Hotel Spend:</span>
                    <strong className="text-slate-900 font-mono text-sm">₹{selectedMemberDrawer.totalSpend.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Active Reward Points:</span>
                    <strong className="text-emerald-800 font-mono text-sm">{selectedMemberDrawer.rewardPointsBalance.toLocaleString()} Pts</strong>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 space-y-1 text-[11px]">
                  <span className="text-purple-900 font-bold uppercase text-[10px] block">Guest Preferences &amp; Habits:</span>
                  <div>• Preferred Room: <strong className="text-purple-950 font-semibold">{selectedMemberDrawer.favoriteRoomType}</strong></div>
                  <div>• Preferred Meal: <strong className="text-purple-950 font-semibold">{selectedMemberDrawer.favoriteMealPref}</strong></div>
                </div>
              </div>
            )}

            {/* TAB 2: STAY HISTORY */}
            {drawerActiveTab === "history" && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                    <tr>
                      <th className="py-2 px-3">Reservation No</th>
                      <th className="py-2 px-3">Check In / Out</th>
                      <th className="py-2 px-3">Room Category</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedMemberDrawer.stayHistory.map((s, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{s.resNo}</td>
                        <td className="py-2 px-3 text-slate-600">{s.checkIn} to {s.checkOut}</td>
                        <td className="py-2 px-3 font-semibold">{s.roomType}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">₹{s.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: POINTS LEDGER */}
            {drawerActiveTab === "ledger" && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                    <tr>
                      <th className="py-2 px-3">Tx ID</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedMemberDrawer.pointsLedger.map((tx) => (
                      <tr key={tx.id}>
                        <td className="py-2 px-3 font-mono text-slate-400">{tx.id}</td>
                        <td className="py-2 px-3 font-bold">{tx.type}</td>
                        <td className="py-2 px-3 text-slate-700">{tx.description}</td>
                        <td className={cn("py-2 px-3 text-right font-mono font-extrabold", tx.points > 0 ? "text-emerald-800" : "text-amber-800")}>
                          {tx.points > 0 ? `+${tx.points}` : tx.points}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Drawer>
      )}
    </ModulePageShell>
  );
}
