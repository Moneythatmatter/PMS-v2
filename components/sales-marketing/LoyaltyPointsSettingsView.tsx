"use client";

import React, { useState } from "react";
import {
  Settings,
  Sparkles,
  Gift,
  Clock,
  Save,
  Crown,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button } from "@/components/ui";

export function LoyaltyPointsSettingsView() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Loyalty Points Management Rules & Settings State
  const [pointsSettings, setPointsSettings] = useState({
    earningRatePerSpend: 1, // 1 Point per ₹100 spent
    spendAmountUnit: 100, // ₹100
    roomStayPointsPerNight: 50, // Flat 50 bonus pts per room night
    diningPointsPerOrder: 20, // Flat 20 bonus pts per dining order
    minSpendToEarnPoints: 500, // Min ₹500 spend required
    redemptionValuePerPoint: 0.5, // 1 Point = ₹0.50 discount
    minPointsToRedeem: 200, // Min 200 pts required to redeem
    maxRedemptionPercentPerBill: 50, // Max 50% bill paid via points
    pointsExpiryDays: 365, // Points expire after 1 year (365 days)
    autoIssueWelcomePoints: 100, // 100 bonus pts on registration
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage("Loyalty points earning & redemption settings saved successfully!");
  };

  return (
    <ModulePageShell
      eyebrow="Sales & Marketing / Settings"
      title="Loyalty Points Settings & Earning Rules"
      description="Configure guest points earning ratios, room & dining stay bonuses, redemption monetary valuations, and expiry policies."
      breadcrumbs={[
        { label: "Sales & Marketing", href: "/sales-marketing/dashboard" },
        { label: "Settings" },
        { label: "Loyalty Points Settings & Earning Rules" },
      ]}
      actionButtons={
        <Button
          type="button"
          size="sm"
          onClick={handleSaveSettings}
          className="rounded-full text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center gap-1.5 px-4 cursor-pointer"
        >
          <Save className="h-3.5 w-3.5" /> Save Settings
        </Button>
      }
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
    >
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Settings className="h-4 w-4 text-emerald-700" />
                Loyalty Points Management &amp; Calculation Rules
              </h3>
              <p className="text-xs text-slate-500">
                Configure how guests earn points on room stays &amp; dining, and set redemption conversion rates.
              </p>
            </div>
          </div>

          {/* SECTION 1: POINTS EARNING RULES */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-emerald-800">
              <Sparkles className="h-3.5 w-3.5" /> 1. Points Earning Rules
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                  Earning Ratio (Points per Spend)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={pointsSettings.earningRatePerSpend}
                    onChange={(e) => setPointsSettings({ ...pointsSettings, earningRatePerSpend: Number(e.target.value) })}
                    className="w-20 text-xs font-bold rounded-lg border border-slate-200 p-2 bg-white text-slate-900"
                  />
                  <span className="text-slate-600 font-medium">Pts per ₹</span>
                  <input
                    type="number"
                    min={1}
                    value={pointsSettings.spendAmountUnit}
                    onChange={(e) => setPointsSettings({ ...pointsSettings, spendAmountUnit: Number(e.target.value) })}
                    className="w-24 text-xs font-bold rounded-lg border border-slate-200 p-2 bg-white text-slate-900"
                  />
                  <span className="text-slate-600 font-medium">spent</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  e.g. 1 Point for every ₹100 spent on bookings/dining
                </span>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                  Bonus Points per Room Night
                </label>
                <input
                  type="number"
                  min={0}
                  value={pointsSettings.roomStayPointsPerNight}
                  onChange={(e) => setPointsSettings({ ...pointsSettings, roomStayPointsPerNight: Number(e.target.value) })}
                  className="w-full text-xs font-bold rounded-lg border border-slate-200 p-2 bg-white text-slate-900"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Flat bonus points issued per checked-in room night
                </span>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                  Bonus Points per Restaurant Bill
                </label>
                <input
                  type="number"
                  min={0}
                  value={pointsSettings.diningPointsPerOrder}
                  onChange={(e) => setPointsSettings({ ...pointsSettings, diningPointsPerOrder: Number(e.target.value) })}
                  className="w-full text-xs font-bold rounded-lg border border-slate-200 p-2 bg-white text-slate-900"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Flat bonus points issued per F&amp;B dining order
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: REDEMPTION & CONVERSION RULES */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-purple-800">
              <Gift className="h-3.5 w-3.5" /> 2. Points Redemption &amp; Valuation Rules
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                  Point Monetary Value (₹ per Point)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-extrabold text-slate-500 select-none">₹</span>
                  <input
                    type="number"
                    step={0.1}
                    min={0.1}
                    value={pointsSettings.redemptionValuePerPoint}
                    onChange={(e) => setPointsSettings({ ...pointsSettings, redemptionValuePerPoint: Number(e.target.value) })}
                    className="w-full pl-7 pr-3 py-2 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-900"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  e.g. 1 Point = ₹0.50 discount (100 Pts = ₹50 OFF)
                </span>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                  Minimum Points Threshold for Redemption
                </label>
                <input
                  type="number"
                  min={0}
                  value={pointsSettings.minPointsToRedeem}
                  onChange={(e) => setPointsSettings({ ...pointsSettings, minPointsToRedeem: Number(e.target.value) })}
                  className="w-full text-xs font-bold rounded-lg border border-slate-200 p-2 bg-white text-slate-900"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Min reward points required in balance before guest can redeem
                </span>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                  Max % of Bill Payable via Points
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={pointsSettings.maxRedemptionPercentPerBill}
                    onChange={(e) => setPointsSettings({ ...pointsSettings, maxRedemptionPercentPerBill: Number(e.target.value) })}
                    className="w-full pr-7 pl-3 py-2 text-xs font-bold rounded-lg border border-slate-200 bg-white text-slate-900"
                  />
                  <span className="absolute right-3 font-extrabold text-slate-500 select-none">%</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Max percentage of room/dining bill payable using points
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3: POLICY & EXPIRY */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5 text-amber-800">
              <Clock className="h-3.5 w-3.5" /> 3. Policy &amp; Expiry Settings
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                  Points Expiry Duration (Days)
                </label>
                <input
                  type="number"
                  min={30}
                  value={pointsSettings.pointsExpiryDays}
                  onChange={(e) => setPointsSettings({ ...pointsSettings, pointsExpiryDays: Number(e.target.value) })}
                  className="w-full text-xs font-bold rounded-lg border border-slate-200 p-2 bg-white text-slate-900"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Points automatically expire if unredeemed after this period (365 Days = 1 Year)
                </span>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
                  Auto Welcome Bonus Points (New Registration)
                </label>
                <input
                  type="number"
                  min={0}
                  value={pointsSettings.autoIssueWelcomePoints}
                  onChange={(e) => setPointsSettings({ ...pointsSettings, autoIssueWelcomePoints: Number(e.target.value) })}
                  className="w-full text-xs font-bold rounded-lg border border-slate-200 p-2 bg-white text-slate-900"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Bonus points automatically credited when a guest joins the loyalty program
                </span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </ModulePageShell>
  );
}
