"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Sliders,
  Sparkles,
  ShieldCheck,
  Bell,
  ArrowRightLeft,
  Package,
  Clock,
  AlertTriangle,
  Box,
  Mail,
  Lock,
  Layers,
  CheckCircle2,
  Building,
  RotateCcw,
  Save,
  X,
  Eye,
  Info,
  Download,
  Shield,
  FileText,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import {
  TextInput,
  SelectInput,
  FormField,
  TextAreaInput,
  FOPageHeader,
  StatMiniCard,
} from "@/components/frontoffice/ui";
import {
  INITIAL_HOUSEKEEPING_SETTINGS,
  SETTING_CATEGORIES_METADATA,
  HousekeepingSettingsState,
} from "@/app/data/housekeepingSettingsData";

// Toggle Switch Component
function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <div className="space-y-0.5 pr-4">
        <p className="text-xs font-extrabold text-slate-800">{label}</p>
        {description && <p className="text-[11px] text-slate-500 font-medium">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
          checked ? "bg-[#0F8A5F]" : "bg-slate-200"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

export default function HousekeepingSettingsPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Settings State
  const [currentSettings, setCurrentSettings] = useState<HousekeepingSettingsState>(
    INITIAL_HOUSEKEEPING_SETTINGS
  );
  const [savedSettings, setSavedSettings] = useState<HousekeepingSettingsState>(
    INITIAL_HOUSEKEEPING_SETTINGS
  );

  // Active Category Sidebar State
  const [activeCategory, setActiveCategory] = useState<string>("general");
  const [searchQuery, setSearchQuery] = useState("");

  // Change Preview Drawer State
  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; variant: "success" | "info" } | null>(null);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Compute Pending Diff Changes
  const pendingChanges = useMemo(() => {
    const diffs: { key: keyof HousekeepingSettingsState; label: string; oldVal: string; newVal: string }[] = [];
    (Object.keys(currentSettings) as (keyof HousekeepingSettingsState)[]).forEach((k) => {
      if (k === "lastUpdated" || k === "updatedBy" || k === "version") return;
      const oldV = String(savedSettings[k]);
      const newV = String(currentSettings[k]);
      if (oldV !== newV) {
        diffs.push({
          key: k,
          label: k.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()),
          oldVal: oldV,
          newVal: newV,
        });
      }
    });
    return diffs;
  }, [currentSettings, savedSettings]);

  // Compute Enabled/Disabled Rules Count
  const ruleCounts = useMemo(() => {
    let enabled = 0;
    let disabled = 0;
    Object.entries(currentSettings).forEach(([k, v]) => {
      if (typeof v === "boolean") {
        if (v) enabled++;
        else disabled++;
      }
    });
    return { enabled, disabled };
  }, [currentSettings]);

  // Handlers
  const handleUpdateSetting = <K extends keyof HousekeepingSettingsState>(key: K, val: HousekeepingSettingsState[K]) => {
    setCurrentSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSaveChanges = () => {
    setSavedSettings(currentSettings);
    setPreviewDrawerOpen(false);
    setToast({ message: "Housekeeping settings saved successfully!", variant: "success" });
  };

  const handleResetToDefault = () => {
    setCurrentSettings(INITIAL_HOUSEKEEPING_SETTINGS);
    setSavedSettings(INITIAL_HOUSEKEEPING_SETTINGS);
    setToast({ message: "Settings reset to system factory defaults.", variant: "info" });
  };

  const handleDiscardChanges = () => {
    setCurrentSettings(savedSettings);
    setToast({ message: "Unsaved changes discarded.", variant: "info" });
  };

  const renderCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case "Sliders": return <Sliders className="h-4 w-4" />;
      case "Sparkles": return <Sparkles className="h-4 w-4" />;
      case "ShieldCheck": return <ShieldCheck className="h-4 w-4" />;
      case "Bell": return <Bell className="h-4 w-4" />;
      case "ArrowRightLeft": return <ArrowRightLeft className="h-4 w-4" />;
      case "Package": return <Package className="h-4 w-4" />;
      case "Clock": return <Clock className="h-4 w-4" />;
      case "AlertTriangle": return <AlertTriangle className="h-4 w-4" />;
      case "Box": return <Box className="h-4 w-4" />;
      case "Mail": return <Mail className="h-4 w-4" />;
      case "Lock": return <Lock className="h-4 w-4" />;
      case "Layers": return <Layers className="h-4 w-4" />;
      default: return <Sliders className="h-4 w-4" />;
    }
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-5 select-none pb-20">
      {/* Toast Notification */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-xl p-3 text-xs font-bold shadow-xl animate-in fade-in slide-in-from-bottom-2",
            toast.variant === "success" ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <FOPageHeader
        eyebrow="System Administration"
        title="Housekeeping Module Settings"
        description="Configure global parameters, room assignment rules, inspection pass cutoffs, SLA escalations, notifications, and cross-module integrations."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setToast({ message: "Exporting settings configuration schema...", variant: "info" })}
              className="!bg-white hover:!bg-slate-100 !text-slate-700 !border-slate-200 flex items-center justify-center gap-1.5 rounded-xl h-8 px-3 text-xs font-bold shrink-0"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" /> Export Config CSV
            </Button>
          </div>
        }
      />

      {/* 6 Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatMiniCard label="Categories" value="12 Configured" icon={Sliders} accent="#10b981" />
        <StatMiniCard label="Enabled Rules" value={`${ruleCounts.enabled} Rules`} icon={CheckCircle2} accent="#0284c7" />
        <StatMiniCard label="Disabled Rules" value={`${ruleCounts.disabled} Rules`} icon={Lock} accent="#64748b" />
        <StatMiniCard label="Last Updated" value={currentSettings.lastUpdated} icon={Clock} accent="#2563eb" />
        <StatMiniCard label="Pending Changes" value={`${pendingChanges.length} Modified`} icon={Sparkles} accent="#d97706" />
        <StatMiniCard label="Default Property" value="Grand Palace Resort" icon={Building} accent="#9333ea" />
      </div>

      {/* Main Settings Layout (Category Sidebar + Form Panel) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Category Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2 sticky top-4">
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider px-2 pt-1">
              Setting Categories
            </h3>

            <div className="space-y-1">
              {SETTING_CATEGORIES_METADATA.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-left",
                      isActive
                        ? "bg-emerald-700 text-white shadow-2xs"
                        : "text-slate-650 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={cn(isActive ? "text-white" : "text-slate-400")}>
                        {renderCategoryIcon(cat.icon)}
                      </span>
                      <span>{cat.label}</span>
                    </div>
                    {isActive && <CheckCircle2 className="h-3.5 w-3.5 text-white shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Settings Form Panel (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Search Box */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <TextInput
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              placeholder="Search setting name (e.g. inspection, laundry, SLA, notifications...)"
              className="pl-9 h-9 text-xs rounded-xl w-full bg-white border-slate-200"
            />
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-5">
            {/* GENERAL SETTINGS */}
            {activeCategory === "general" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-extrabold text-slate-900">General Property Configuration</h3>
                  <p className="text-xs text-slate-500 font-medium">Default property timezone, work week schedule, and housekeeping operational status.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Property Time Zone">
                    <SelectInput
                      value={currentSettings.propertyTimeZone}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleUpdateSetting("propertyTimeZone", e.target.value)}
                      className="h-9 text-xs"
                    >
                      <option value="Asia/Kolkata (GMT+05:30)">Asia/Kolkata (GMT+05:30)</option>
                      <option value="UTC (GMT+00:00)">UTC (GMT+00:00)</option>
                      <option value="America/New_York (EST)">America/New_York (EST)</option>
                    </SelectInput>
                  </FormField>

                  <FormField label="Default System Language">
                    <SelectInput
                      value={currentSettings.defaultLanguage}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleUpdateSetting("defaultLanguage", e.target.value)}
                      className="h-9 text-xs"
                    >
                      <option value="English (United States)">English (United States)</option>
                      <option value="Spanish (Español)">Spanish (Español)</option>
                      <option value="French (Français)">French (Français)</option>
                    </SelectInput>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Default Shift Schedule">
                    <TextInput
                      value={currentSettings.defaultShift}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateSetting("defaultShift", e.target.value)}
                      className="h-9 text-xs"
                    />
                  </FormField>

                  <FormField label="Default Housekeeping Status">
                    <SelectInput
                      value={currentSettings.defaultHousekeepingStatus}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleUpdateSetting("defaultHousekeepingStatus", e.target.value)}
                      className="h-9 text-xs"
                    >
                      <option value="Dirty (Checkout Pending)">Dirty (Checkout Pending)</option>
                      <option value="Dirty (Stayover Servicing)">Dirty (Stayover Servicing)</option>
                      <option value="Touch-up Required">Touch-up Required</option>
                    </SelectInput>
                  </FormField>
                </div>

                <ToggleSwitch
                  label="Business Date Auto-Rollover"
                  description="Automatically roll over business date at midnight audit."
                  checked={currentSettings.businessDateAutoRollover}
                  onChange={(val) => handleUpdateSetting("businessDateAutoRollover", val)}
                />
              </div>
            )}

            {/* ROOM CLEANING SETTINGS */}
            {activeCategory === "cleaning" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-extrabold text-slate-900">Room Cleaning & Turnaround Rules</h3>
                  <p className="text-xs text-slate-500 font-medium">Auto-assignment algorithms, room priority ordering, and credit caps.</p>
                </div>

                <ToggleSwitch
                  label="Auto Assign Rooms to Attendants"
                  description="Enable intelligent credit balancing algorithm for morning shift assignments."
                  checked={currentSettings.autoAssignRooms}
                  onChange={(val) => handleUpdateSetting("autoAssignRooms", val)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Maximum Rooms Per Staff Shift">
                    <TextInput
                      type="number"
                      value={currentSettings.maxRoomsPerStaff}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateSetting("maxRoomsPerStaff", parseInt(e.target.value, 10) || 0)}
                      className="h-9 text-xs"
                    />
                  </FormField>

                  <FormField label="Cleaning Priority Ordering">
                    <SelectInput
                      value={currentSettings.cleaningPriority}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleUpdateSetting("cleaningPriority", e.target.value as any)}
                      className="h-9 text-xs"
                    >
                      <option value="VIP First">VIP First</option>
                      <option value="Checkout First">Checkout First</option>
                      <option value="Occupied First">Occupied First</option>
                      <option value="Vacant First">Vacant First</option>
                    </SelectInput>
                  </FormField>
                </div>

                <ToggleSwitch
                  label="Allow Reopen After Inspection"
                  description="Allow supervisors to reopen completed cleanings if quality issues are found."
                  checked={currentSettings.allowReopenAfterInspection}
                  onChange={(val) => handleUpdateSetting("allowReopenAfterInspection", val)}
                />

                <ToggleSwitch
                  label="Enable Auto Room Release"
                  description="Automatically release room to Front Office upon passing inspection."
                  checked={currentSettings.enableAutoRoomRelease}
                  onChange={(val) => handleUpdateSetting("enableAutoRoomRelease", val)}
                />
              </div>
            )}

            {/* ROOM INSPECTION SETTINGS */}
            {activeCategory === "inspection" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-extrabold text-slate-900">Room Inspection & Quality Control</h3>
                  <p className="text-xs text-slate-500 font-medium">Passing score thresholds, critical defect auto-fails, and photo evidence.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Pass Percentage Cutoff Target (%)">
                    <TextInput
                      type="number"
                      value={currentSettings.passPercentageCutoff}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateSetting("passPercentageCutoff", parseInt(e.target.value, 10) || 0)}
                      className="h-9 text-xs"
                    />
                  </FormField>

                  <FormField label="Random Inspection Audit Rate (%)">
                    <TextInput
                      type="number"
                      value={currentSettings.randomInspectionPercent}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateSetting("randomInspectionPercent", parseInt(e.target.value, 10) || 0)}
                      className="h-9 text-xs"
                    />
                  </FormField>
                </div>

                <ToggleSwitch
                  label="Critical Defect Auto-Fail Trigger"
                  description="Failing any critical item (e.g. dirty toilet or unmade bed) causes instant audit failure."
                  checked={currentSettings.criticalDefectAutoFail}
                  onChange={(val) => handleUpdateSetting("criticalDefectAutoFail", val)}
                />

                <ToggleSwitch
                  label="Require Photo Evidence for Failed SOPs"
                  description="Mandate uploading a photo when marking a checklist item as failed."
                  checked={currentSettings.photoEvidenceRequired}
                  onChange={(val) => handleUpdateSetting("photoEvidenceRequired", val)}
                />

                <ToggleSwitch
                  label="Digital Signature Required for Sign-off"
                  description="Require supervisor digital canvas drawing before marking room Vacant Ready."
                  checked={currentSettings.digitalSignatureRequired}
                  onChange={(val) => handleUpdateSetting("digitalSignatureRequired", val)}
                />
              </div>
            )}

            {/* GUEST REQUESTS SETTINGS */}
            {activeCategory === "requests" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-extrabold text-slate-900">Guest Requests & SLA Controls</h3>
                  <p className="text-xs text-slate-500 font-medium">Target completion SLAs, escalation triggers, and supervisor alerts.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Default Target SLA (Minutes)">
                    <TextInput
                      type="number"
                      value={currentSettings.defaultSlaMins}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateSetting("defaultSlaMins", parseInt(e.target.value, 10) || 0)}
                      className="h-9 text-xs"
                    />
                  </FormField>

                  <FormField label="Escalation Time Trigger (Minutes)">
                    <TextInput
                      type="number"
                      value={currentSettings.escalationTimeMins}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateSetting("escalationTimeMins", parseInt(e.target.value, 10) || 0)}
                      className="h-9 text-xs"
                    />
                  </FormField>
                </div>

                <ToggleSwitch
                  label="Notify Supervisor on Overdue SLA"
                  description="Send SMS & Push alert to Floor Supervisor if request exceeds SLA target."
                  checked={currentSettings.notifySupervisorOnOverdue}
                  onChange={(val) => handleUpdateSetting("notifySupervisorOnOverdue", val)}
                />
              </div>
            )}

            {/* LAUNDRY SETTINGS */}
            {activeCategory === "laundry" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-extrabold text-slate-900">Laundry & Linen Operations</h3>
                  <p className="text-xs text-slate-500 font-medium">Express surcharges, pickup/delivery windows, and off-site vendor outsourcing.</p>
                </div>

                <ToggleSwitch
                  label="Express Laundry Service Enabled"
                  description="Allow guests to request 3-hour express laundry processing."
                  checked={currentSettings.expressLaundryEnabled}
                  onChange={(val) => handleUpdateSetting("expressLaundryEnabled", val)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Express Surcharge (%)">
                    <TextInput
                      type="number"
                      value={currentSettings.expressSurchargePercent}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateSetting("expressSurchargePercent", parseInt(e.target.value, 10) || 0)}
                      className="h-9 text-xs"
                    />
                  </FormField>

                  <FormField label="Default Delivery Window">
                    <TextInput
                      value={currentSettings.defaultDeliveryTime}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateSetting("defaultDeliveryTime", e.target.value)}
                      className="h-9 text-xs"
                    />
                  </FormField>
                </div>

                <ToggleSwitch
                  label="Vendor Outsourcing Enabled"
                  description="Allow dispatching commercial linen batches to external laundry hubs."
                  checked={currentSettings.vendorOutsourcingEnabled}
                  onChange={(val) => handleUpdateSetting("vendorOutsourcingEnabled", val)}
                />
              </div>
            )}

            {/* LOST & FOUND SETTINGS */}
            {activeCategory === "lostfound" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-extrabold text-slate-900">Lost & Found Vault Policy</h3>
                  <p className="text-xs text-slate-500 font-medium">Retention thresholds, high-value asset holding periods, and disposal sign-offs.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField label="Standard Retention (Days)">
                    <TextInput
                      type="number"
                      value={currentSettings.defaultRetentionDays}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateSetting("defaultRetentionDays", parseInt(e.target.value, 10) || 0)}
                      className="h-9 text-xs"
                    />
                  </FormField>

                  <FormField label="High-Value Retention (Days)">
                    <TextInput
                      type="number"
                      value={currentSettings.highValueRetentionDays}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateSetting("highValueRetentionDays", parseInt(e.target.value, 10) || 0)}
                      className="h-9 text-xs"
                    />
                  </FormField>

                  <FormField label="Perishable Retention (Days)">
                    <TextInput
                      type="number"
                      value={currentSettings.perishableRetentionDays}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateSetting("perishableRetentionDays", parseInt(e.target.value, 10) || 0)}
                      className="h-9 text-xs"
                    />
                  </FormField>
                </div>

                <ToggleSwitch
                  label="Automatic Guest Notification"
                  description="Send automated email/SMS to registered guest upon logging found item."
                  checked={currentSettings.automaticGuestNotification}
                  onChange={(val) => handleUpdateSetting("automaticGuestNotification", val)}
                />
              </div>
            )}

            {/* DEEP CLEANING SETTINGS */}
            {activeCategory === "deepcleaning" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-extrabold text-slate-900">Deep Cleaning & Preventive Maintenance</h3>
                  <p className="text-xs text-slate-500 font-medium">Recurring cycle frequency, room block hold types, and evidence photos.</p>
                </div>

                <ToggleSwitch
                  label="Recurring Cycle Schedule Enabled"
                  description="Automatically flag rooms for deep cleaning based on frequency setting."
                  checked={currentSettings.recurringScheduleEnabled}
                  onChange={(val) => handleUpdateSetting("recurringScheduleEnabled", val)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Default Block Type">
                    <SelectInput
                      value={currentSettings.defaultBlockType}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleUpdateSetting("defaultBlockType", e.target.value as any)}
                      className="h-9 text-xs"
                    >
                      <option value="Out of Order (OOO)">Out of Order (OOO)</option>
                      <option value="Out of Service (OOS)">Out of Service (OOS)</option>
                    </SelectInput>
                  </FormField>

                  <FormField label="Reminder Days Before Due">
                    <TextInput
                      type="number"
                      value={currentSettings.reminderDaysBeforeDue}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateSetting("reminderDaysBeforeDue", parseInt(e.target.value, 10) || 0)}
                      className="h-9 text-xs"
                    />
                  </FormField>
                </div>

                <ToggleSwitch
                  label="Require Before & After Evidence Photos"
                  description="Require photo uploads before starting and after completing deep clean."
                  checked={currentSettings.requireBeforePhoto}
                  onChange={(val) => handleUpdateSetting("requireBeforePhoto", val)}
                />
              </div>
            )}

            {/* DAMAGE REPORTS SETTINGS */}
            {activeCategory === "damagereports" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-extrabold text-slate-900">Damage Reports & Billing Recovery</h3>
                  <p className="text-xs text-slate-500 font-medium">Approval limits, auto-engineering tickets, and guest charges.</p>
                </div>

                <ToggleSwitch
                  label="Auto Create Engineering Repair Ticket"
                  description="Automatically log a maintenance ticket when asset damage is reported."
                  checked={currentSettings.autoCreateEngineeringTicket}
                  onChange={(val) => handleUpdateSetting("autoCreateEngineeringTicket", val)}
                />

                <FormField label="Manager Approval Threshold Amount (₹)">
                  <TextInput
                    type="number"
                    value={currentSettings.approvalThresholdAmount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateSetting("approvalThresholdAmount", parseInt(e.target.value, 10) || 0)}
                    className="h-9 text-xs"
                  />
                </FormField>

                <ToggleSwitch
                  label="Require Damage Photo Evidence"
                  description="Mandate uploading a photo before submitting a damage report."
                  checked={currentSettings.requireDamagePhotoEvidence}
                  onChange={(val) => handleUpdateSetting("requireDamagePhotoEvidence", val)}
                />
              </div>
            )}

            {/* REQUISITIONS SETTINGS */}
            {activeCategory === "requisitions" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-extrabold text-slate-900">Store Requisitions & Inventory Issuance</h3>
                  <p className="text-xs text-slate-500 font-medium">Budget validation, emergency fast-tracks, and digital receiving signatures.</p>
                </div>

                <ToggleSwitch
                  label="Approval Workflow Enabled"
                  description="Require Executive Housekeeper sign-off for store requisitions over budget."
                  checked={currentSettings.approvalWorkflowEnabled}
                  onChange={(val) => handleUpdateSetting("approvalWorkflowEnabled", val)}
                />

                <ToggleSwitch
                  label="Budget Validation Check"
                  description="Validate request against cost center departmental budget limits."
                  checked={currentSettings.budgetValidation}
                  onChange={(val) => handleUpdateSetting("budgetValidation", val)}
                />

                <ToggleSwitch
                  label="Digital Receiving Signature"
                  description="Require digital sign-off when receiving materials from Central Stores."
                  checked={currentSettings.digitalReceivingSignature}
                  onChange={(val) => handleUpdateSetting("digitalReceivingSignature", val)}
                />
              </div>
            )}

            {/* NOTIFICATIONS SETTINGS */}
            {activeCategory === "notifications" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-extrabold text-slate-900">Notification Channels & Escalation Alerts</h3>
                  <p className="text-xs text-slate-500 font-medium">Email, SMS, Push, and Manager alert triggers.</p>
                </div>

                <ToggleSwitch
                  label="Email Notifications"
                  description="Dispatch automated email digests for daily operations & reports."
                  checked={currentSettings.emailNotifications}
                  onChange={(val) => handleUpdateSetting("emailNotifications", val)}
                />

                <ToggleSwitch
                  label="SMS Emergency Alerts"
                  description="Send urgent SMS alerts for OOO holds & critical equipment failures."
                  checked={currentSettings.smsNotifications}
                  onChange={(val) => handleUpdateSetting("smsNotifications", val)}
                />

                <ToggleSwitch
                  label="Mobile App Push Notifications"
                  description="Push instant notifications to staff mobile handsets."
                  checked={currentSettings.pushNotifications}
                  onChange={(val) => handleUpdateSetting("pushNotifications", val)}
                />
              </div>
            )}

            {/* AUDIT & SECURITY SETTINGS */}
            {activeCategory === "auditsecurity" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-extrabold text-slate-900">Audit & Security Governance</h3>
                  <p className="text-xs text-slate-500 font-medium">Audit trail retention, IP capture, and immutable cryptographic logging.</p>
                </div>

                <ToggleSwitch
                  label="Enable Immutable System Audit Logs"
                  description="Record all room status changes and supervisor overrides in a tamper-proof trail."
                  checked={currentSettings.enableAuditLogs}
                  onChange={(val) => handleUpdateSetting("enableAuditLogs", val)}
                />

                <FormField label="Audit Trail Retention Period (Days)">
                  <TextInput
                    type="number"
                    value={currentSettings.auditRetentionDays}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateSetting("auditRetentionDays", parseInt(e.target.value, 10) || 0)}
                    className="h-9 text-xs"
                  />
                </FormField>

                <ToggleSwitch
                  label="Capture Client IP Address & Device Details"
                  description="Record actor IP addresses and browser user agent strings on every transaction."
                  checked={currentSettings.captureIpAddress}
                  onChange={(val) => handleUpdateSetting("captureIpAddress", val)}
                />
              </div>
            )}

            {/* INTEGRATIONS SETTINGS */}
            {activeCategory === "integrations" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-extrabold text-slate-900">Cross-Module & Hardware Integrations</h3>
                  <p className="text-xs text-slate-500 font-medium">Front Office, SAP ERP, IoT sensors, and door key card systems.</p>
                </div>

                <ToggleSwitch
                  label="Front Office PMS Integration"
                  description="Real-time sync of room checkouts, arrivals, and guest status."
                  checked={currentSettings.frontOfficeIntegration}
                  onChange={(val) => handleUpdateSetting("frontOfficeIntegration", val)}
                />

                <ToggleSwitch
                  label="IoT Room Occupancy Sensors"
                  description="Sync door sensors & motion detectors for live room presence status."
                  checked={currentSettings.iotRoomSensors}
                  onChange={(val) => handleUpdateSetting("iotRoomSensors", val)}
                />

                <ToggleSwitch
                  label="RFID Key Card Door Lock System"
                  description="Sync smart lock audit logs and master key card permissions."
                  checked={currentSettings.keyCardSystem}
                  onChange={(val) => handleUpdateSetting("keyCardSystem", val)}
                />
              </div>
            )}

            {/* Read-only Audit Metadata Section */}
            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 font-medium flex items-center justify-between">
              <span>Last Saved: <strong>{currentSettings.lastUpdated}</strong></span>
              <span>Updated By: <strong>{currentSettings.updatedBy}</strong></span>
              <span>Version: <strong>{currentSettings.version}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* STICKY BOTTOM SAVE BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3 px-6 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-700 font-bold">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-900">
              {pendingChanges.length > 0 ? `${pendingChanges.length} Settings Modified` : "All settings saved"}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold">
              {pendingChanges.length > 0 ? "Review your changes before applying to production." : "Configuration up to date."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pendingChanges.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setPreviewDrawerOpen(true)}
              className="h-9 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl"
            >
              <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" /> Preview ({pendingChanges.length})
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleResetToDefault}
            className="h-9 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1 text-slate-500" /> Reset Factory Defaults
          </Button>

          {pendingChanges.length > 0 && (
            <Button
              variant="outline"
              onClick={handleDiscardChanges}
              className="h-9 text-xs font-bold border-slate-200 text-red-700 hover:bg-red-50 rounded-xl"
            >
              Discard
            </Button>
          )}

          <Button
            onClick={handleSaveChanges}
            disabled={pendingChanges.length === 0}
            className="h-9 text-xs font-bold !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white rounded-xl shadow-2xs"
          >
            <Save className="h-3.5 w-3.5 mr-1" /> Save Changes
          </Button>
        </div>
      </div>

      {/* CHANGE PREVIEW DRAWER */}
      <Drawer
        open={previewDrawerOpen}
        onClose={() => setPreviewDrawerOpen(false)}
        title={`Pending Change Preview (${pendingChanges.length})`}
      >
        <div className="space-y-4 select-none pb-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 font-medium">
            Review the list of modified configuration parameters before saving them to the Housekeeping system.
          </div>

          <div className="space-y-2">
            {pendingChanges.map((diff) => (
              <div key={diff.key} className="rounded-xl border border-slate-200 bg-white p-3 space-y-1 text-xs shadow-2xs">
                <p className="font-extrabold text-slate-900">{diff.label}</p>
                <div className="flex items-center justify-between text-[11px] font-medium pt-1">
                  <span className="text-red-700 line-through">Old: {diff.oldVal}</span>
                  <span className="text-emerald-700 font-bold">New: {diff.newVal}</span>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleSaveChanges}
            className="w-full h-9 text-xs font-bold !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white rounded-xl shadow-2xs"
          >
            Apply & Save Changes
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
