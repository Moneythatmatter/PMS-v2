"use client";

import { useState } from "react";
import { ChevronDown, Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function ExportMenu({
  onExcel,
  onCsv,
  disabled,
  excelHint = "Formatted workbook",
  csvHint = "Plain rows",
  tone = "dark",
}: {
  onExcel: () => void;
  onCsv: () => void;
  disabled?: boolean;
  excelHint?: string;
  csvHint?: string;
  tone?: "dark" | "light";
}) {
  const [open, setOpen] = useState(false);
  const pick = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div className="relative">
      <Button
        type="button"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        variant={tone === "light" ? "outline" : undefined}
        className={cn(
          "rounded-lg text-xs font-semibold shadow-2xs cursor-pointer px-3.5",
          tone === "light"
            ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            : "bg-slate-900 hover:bg-slate-800 text-white",
        )}
      >
        <Download className="h-3.5 w-3.5 mr-1" />
        Export
        <ChevronDown className={cn("h-3.5 w-3.5 ml-1 transition-transform", open && "rotate-180")} />
      </Button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close export menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-1.5 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
          >
            <ExportMenuItem
              icon={FileSpreadsheet}
              iconClass="bg-emerald-50 text-emerald-700"
              title="Excel (.xlsx)"
              subtitle={excelHint}
              onClick={pick(onExcel)}
            />
            <ExportMenuItem
              icon={FileText}
              iconClass="bg-slate-100 text-slate-600"
              title="CSV (.csv)"
              subtitle={csvHint}
              onClick={pick(onCsv)}
            />
          </div>
        </>
      )}
    </div>
  );
}

function ExportMenuItem({
  icon: Icon,
  iconClass,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50 cursor-pointer"
    >
      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", iconClass)}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-slate-900">{title}</span>
        <span className="block truncate text-[11px] text-slate-500">{subtitle}</span>
      </span>
    </button>
  );
}
