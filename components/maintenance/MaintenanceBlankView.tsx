"use client";

import React from "react";
import Link from "next/link";
import { Wrench, ArrowLeft, Plus } from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button } from "@/components/ui/Button";

interface MaintenanceBlankViewProps {
  title: string;
  category?: string;
  description: string;
  actionLabel?: string;
}

export function MaintenanceBlankView({
  title,
  category,
  description,
  actionLabel = "+ Create Record",
}: MaintenanceBlankViewProps) {
  const breadcrumbs = [
    { label: "Maintenance", href: "/maintenance" },
    ...(category ? [{ label: category }] : []),
    { label: title },
  ];

  return (
    <ModulePageShell
      eyebrow="Maintenance & Engineering"
      title={title}
      description={description}
      breadcrumbs={breadcrumbs}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Link href="/maintenance">
            <Button size="sm" variant="outline" className="border-slate-300 bg-white text-xs font-semibold text-slate-700 shadow-xs">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Back to Dashboard
            </Button>
          </Link>
          <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {actionLabel}
          </Button>
        </div>
      }
    >
      <div className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-xs">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
          <Wrench className="h-7 w-7" />
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 mb-2">
          Maintenance Module V1
        </span>
        <h3 className="text-base font-bold text-slate-900">
          {title}
        </h3>
        <p className="mt-1 max-w-md text-xs text-slate-500 leading-relaxed">
          {description}
        </p>
      </div>
    </ModulePageShell>
  );
}
