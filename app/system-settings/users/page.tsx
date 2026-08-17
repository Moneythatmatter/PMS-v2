"use client";

import { FOPageHeader } from "@/components/frontoffice/ui";

export default function SystemSettingsUsersPage() {
  return (
    <div className="space-y-4">
      <FOPageHeader
        eyebrow="System Settings"
        title="Users & Roles"
        description="Manage staff accounts, role permissions, and module access. Coming soon."
      />
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
        User and role management will be configured here.
      </div>
    </div>
  );
}
