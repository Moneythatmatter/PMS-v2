"use client";

import Link from "next/link";
import { Settings, History, Shield, Globe, Users } from "lucide-react";
import { FOPageHeader, StatMiniCard } from "@/components/frontoffice/ui";

const quickLinks = [
  {
    label: "General Settings",
    href: "/system-settings/settings",
    icon: Settings,
    description: "Property profile, timezone, business date, and global defaults.",
  },
  {
    label: "Audit Logs",
    href: "/system-settings/audit-logs",
    icon: History,
    description: "Immutable operational audit trail across all PMS modules.",
  },
  {
    label: "Users & Roles",
    href: "/system-settings/users",
    icon: Users,
    description: "Staff accounts, role permissions, and access control.",
  },
  {
    label: "Integrations",
    href: "/system-settings/integrations",
    icon: Globe,
    description: "External systems, API keys, and cross-module sync.",
  },
];

export default function SystemSettingsDashboardPage() {
  return (
    <div className="space-y-6 select-none">
      <FOPageHeader
        eyebrow="Administration"
        title="System Settings"
        description="Central configuration hub for property-wide parameters, security governance, audit retention, and module integrations."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatMiniCard label="Active Modules" value="6 Connected" icon={Settings} accent="#10b981" />
        <StatMiniCard label="Audit Retention" value="90 Days" icon={History} accent="#0284c7" />
        <StatMiniCard label="Security Policy" value="Standard" icon={Shield} accent="#9333ea" />
        <StatMiniCard label="Integrations" value="3 Active" icon={Globe} accent="#d97706" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {quickLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition hover:border-emerald-200 hover:shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-extrabold text-slate-900">{item.label}</h3>
                  <p className="mt-1 text-xs font-medium text-slate-500">{item.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-sm font-extrabold text-slate-900">Compliance & Governance</h3>
        <p className="mt-1 max-w-2xl text-xs font-medium text-slate-500">
          Operational audit logs capture room status changes, supervisor overrides, inventory movements,
          and security actions across Front Office, Housekeeping, F&amp;B, and Stores modules.
        </p>
        <Link
          href="/system-settings/audit-logs"
          className="inline-flex mt-4 items-center justify-center rounded-lg bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white"
        >
          View Audit Logs
        </Link>
      </div>
    </div>
  );
}
