"use client";

import React, { useState } from "react";
import {
  Plus,
  FolderOpen,
  Info,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button } from "@/components/ui/Button";

interface EmptyMasterViewProps {
  title: string;
  category?: string;
  eyebrow?: string;
  description: string;
  breadcrumbs: { label: string; href?: string }[];
  codePrefix?: string;
}

export function EmptyMasterView({
  title,
  category = "Masters",
  eyebrow = "Accounts & Masters",
  description,
  breadcrumbs,
  codePrefix = "MST",
}: EmptyMasterViewProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  return (
    <ModulePageShell
      eyebrow={eyebrow}
      title={title}
      description={description}
      breadcrumbs={breadcrumbs}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() =>
              setToastMessage(
                `${title} is initialized in PMS V1. Master data records have not been added yet.`
              )
            }
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Record
          </Button>
        </div>
      }
    >
      {/* Notice Banner */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Info className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase block">
                Architecture Specification:
              </span>
              <span className="font-bold text-xs text-slate-900">
                {title} is mapped in the Accounts Masters structure. No master records have been configured yet.
              </span>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1 text-slate-700 font-mono text-xs font-bold">
            Status: 0 Records Configured
          </span>
        </div>
      </div>

      {/* Clean Empty State Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-14 shadow-xs">
        <div className="flex flex-col items-center justify-center text-center max-w-lg mx-auto">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 mb-4 border border-emerald-200 shadow-xs ring-8 ring-emerald-50/50">
            <FolderOpen className="h-8 w-8 text-emerald-600" />
          </div>

          <h3 className="text-base font-bold text-slate-900 font-mono">
            No {title} Records Found
          </h3>

          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            No mock or default records are populated. Click below to add your first record.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              type="button"
              size="sm"
              onClick={() =>
                setToastMessage(
                  `Record creation form for ${title} will be initialized on record entry.`
                )
              }
              className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add First {title} Record
            </Button>
          </div>
        </div>
      </div>
    </ModulePageShell>
  );
}
