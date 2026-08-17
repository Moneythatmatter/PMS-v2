"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sliders, History, Shield, Globe, CheckCircle2, Save, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { TextInput, SelectInput, FormField, FOPageHeader, StatMiniCard } from "@/components/frontoffice/ui";

interface SystemSettingsState {
  propertyName: string;
  propertyTimeZone: string;
  defaultLanguage: string;
  businessDateAutoRollover: boolean;
  enableAuditLogs: boolean;
  auditRetentionDays: number;
  captureIpAddress: boolean;
  lastUpdated: string;
  updatedBy: string;
}

const INITIAL_SYSTEM_SETTINGS: SystemSettingsState = {
  propertyName: "Grand Palace Resort",
  propertyTimeZone: "Asia/Kolkata (GMT+05:30)",
  defaultLanguage: "English (United States)",
  businessDateAutoRollover: true,
  enableAuditLogs: true,
  auditRetentionDays: 90,
  captureIpAddress: true,
  lastUpdated: "17 Aug 2026, 02:00 PM",
  updatedBy: "Admin User",
};

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
          checked ? "bg-emerald-700" : "bg-slate-200",
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out",
            checked ? "translate-x-4" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}

export default function SystemSettingsGeneralPage() {
  const [settings, setSettings] = useState<SystemSettingsState>(INITIAL_SYSTEM_SETTINGS);
  const [saved, setSaved] = useState<SystemSettingsState>(INITIAL_SYSTEM_SETTINGS);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const pendingCount = Object.keys(settings).filter((key) => {
    if (key === "lastUpdated" || key === "updatedBy") return false;
    return String(settings[key as keyof SystemSettingsState]) !== String(saved[key as keyof SystemSettingsState]);
  }).length;

  return (
    <div className="space-y-5 select-none pb-16">
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 p-3 text-xs font-bold text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4" />
          {toast}
        </div>
      )}

      <FOPageHeader
        eyebrow="System Administration"
        title="General Settings"
        description="Property-wide defaults, business date rules, audit governance, and security capture policies."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatMiniCard label="Property" value={settings.propertyName} icon={Sliders} accent="#10b981" />
        <StatMiniCard label="Audit Logs" value={settings.enableAuditLogs ? "Enabled" : "Disabled"} icon={History} accent="#0284c7" />
        <StatMiniCard label="Retention" value={`${settings.auditRetentionDays} Days`} icon={Shield} accent="#9333ea" />
        <StatMiniCard label="Pending" value={`${pendingCount} Changes`} icon={Globe} accent="#d97706" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">Property Configuration</h3>
          <FormField label="Property Name">
            <TextInput
              value={settings.propertyName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSettings((prev) => ({ ...prev, propertyName: e.target.value }))
              }
              className="h-9 text-xs"
            />
          </FormField>
          <FormField label="Time Zone">
            <SelectInput
              value={settings.propertyTimeZone}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSettings((prev) => ({ ...prev, propertyTimeZone: e.target.value }))
              }
              className="h-9 text-xs"
            >
              <option value="Asia/Kolkata (GMT+05:30)">Asia/Kolkata (GMT+05:30)</option>
              <option value="UTC (GMT+00:00)">UTC (GMT+00:00)</option>
            </SelectInput>
          </FormField>
          <FormField label="Default Language">
            <SelectInput
              value={settings.defaultLanguage}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setSettings((prev) => ({ ...prev, defaultLanguage: e.target.value }))
              }
              className="h-9 text-xs"
            >
              <option value="English (United States)">English (United States)</option>
            </SelectInput>
          </FormField>
          <ToggleSwitch
            label="Business Date Auto-Rollover"
            description="Roll business date automatically at night audit."
            checked={settings.businessDateAutoRollover}
            onChange={(val) => setSettings((prev) => ({ ...prev, businessDateAutoRollover: val }))}
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2">Audit & Security</h3>
          <ToggleSwitch
            label="Enable System Audit Logs"
            description="Record operational changes across all modules."
            checked={settings.enableAuditLogs}
            onChange={(val) => setSettings((prev) => ({ ...prev, enableAuditLogs: val }))}
          />
          <FormField label="Audit Retention (Days)">
            <TextInput
              type="number"
              value={settings.auditRetentionDays}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSettings((prev) => ({
                  ...prev,
                  auditRetentionDays: parseInt(e.target.value, 10) || 0,
                }))
              }
              className="h-9 text-xs"
            />
          </FormField>
          <ToggleSwitch
            label="Capture IP Address & Device"
            description="Store actor IP and terminal metadata on each audit event."
            checked={settings.captureIpAddress}
            onChange={(val) => setSettings((prev) => ({ ...prev, captureIpAddress: val }))}
          />
          <Link
            href="/system-settings/audit-logs"
            className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Open Audit Logs
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => {
            setSaved(settings);
            setToast("System settings saved successfully.");
          }}
          disabled={pendingCount === 0}
          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
        >
          <Save className="h-3.5 w-3.5 mr-1" /> Save Changes
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setSettings(saved);
            setToast("Unsaved changes discarded.");
          }}
          disabled={pendingCount === 0}
          className="text-xs font-bold"
        >
          Discard
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setSettings(INITIAL_SYSTEM_SETTINGS);
            setSaved(INITIAL_SYSTEM_SETTINGS);
            setToast("Reset to factory defaults.");
          }}
          className="text-xs font-bold"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset Defaults
        </Button>
      </div>
    </div>
  );
}
