"use client";

import { FOPageHeader } from "@/components/frontoffice/ui";

export default function SystemSettingsIntegrationsPage() {
  return (
    <div className="space-y-4">
      <FOPageHeader
        eyebrow="System Settings"
        title="Integrations"
        description="Connect external PMS, payment gateways, IoT sensors, and ERP systems. Coming soon."
      />
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
        Integration connectors and API keys will be managed here.
      </div>
    </div>
  );
}
