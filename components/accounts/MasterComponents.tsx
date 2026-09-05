"use client";

import React from "react";
import {
  Shield,
  ShieldAlert,
  AlertTriangle,
  Info,
  Calendar,
  Clock,
  Layers,
  FileCheck2,
  Lock,
  X,
  CheckCircle2,
  Ban,
  Trash2,
  Building2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { sampleCompaniesList, CompanyRecord } from "@/app/data/accounts/companyCreationData";
import { cn } from "@/lib/utils";

/**
 * Reusable Company Selector Component for Master Pages
 */
export interface CompanySelectorProps {
  selectedCompanyId?: string;
  onCompanyChange?: (companyId: string) => void;
  companies?: CompanyRecord[];
  className?: string;
}

export function CompanySelector({
  selectedCompanyId = "comp-101",
  onCompanyChange,
  companies = sampleCompaniesList,
  className,
}: CompanySelectorProps) {
  const activeCompany =
    companies.find((c) => c.id === selectedCompanyId || c.companyCode === selectedCompanyId) ||
    companies[0];

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white border border-slate-200 rounded-2xl shadow-2xs",
        className
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-[280px]">
        <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
          <Building2 className="h-4.5 w-4.5" />
        </div>
        <div className="flex-1">
          <span className="font-bold text-[11px] text-slate-500 block uppercase tracking-wider">
            Target Company Entity
          </span>
          <select
            value={activeCompany.id}
            onChange={(e) => onCompanyChange?.(e.target.value)}
            className="h-8 w-full rounded-xl border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-900 focus:border-emerald-600 focus:outline-none cursor-pointer"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.legalName || c.tradeName} ({c.companyCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-700">
          <Shield className="h-3.5 w-3.5 text-emerald-600" />
          {activeCompany.companyCode}
        </span>
        <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
          Active Property
        </span>
      </div>
    </div>
  );
}

/**
 * Reusable Master Form Section Container
 */
export interface MasterFormSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function MasterFormSection({
  title,
  subtitle,
  icon,
  badge,
  children,
  className,
}: MasterFormSectionProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          {icon && <span className="text-emerald-700">{icon}</span>}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] text-slate-500 font-medium">{subtitle}</p>
            )}
          </div>
        </div>
        {badge && <div className="flex items-center gap-1.5">{badge}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

/**
 * Reusable Master Audit Information Panel (Read-only)
 */
export interface MasterAuditInfoProps {
  idLabel?: string;
  idValue: string;
  level?: number;
  sequence?: number;
  isSystem?: boolean;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  transactionCount?: number;
  className?: string;
}

export function MasterAuditInfo({
  idLabel = "Record ID",
  idValue,
  level,
  sequence,
  isSystem,
  status,
  createdAt,
  updatedAt,
  createdBy = "Finance Admin",
  updatedBy = "Finance Admin",
  transactionCount = 0,
  className,
}: MasterAuditInfoProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div className="flex items-center gap-1.5">
          <Info className="h-4 w-4 text-slate-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Audit & System Information
          </h4>
        </div>
        <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
          READ ONLY
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 block uppercase">
            {idLabel}
          </span>
          <span className="text-xs font-mono font-extrabold text-slate-900 mt-0.5 block truncate">
            {idValue}
          </span>
        </div>

        {sequence !== undefined && (
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 block uppercase">
              Display Sequence
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-800 mt-0.5">
              #{sequence}
            </span>
          </div>
        )}

        {level !== undefined && (
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 block uppercase">
              Hierarchy Level
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-amber-800 mt-0.5">
              <Layers className="h-3.5 w-3.5 text-amber-600" />
              Level {level}
            </span>
          </div>
        )}

        {isSystem !== undefined && (
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 block uppercase">
              System Lock
            </span>
            {isSystem ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 mt-0.5">
                <Lock className="h-3 w-3 text-rose-600" />
                Locked (System)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 mt-0.5">
                <Shield className="h-3 w-3 text-emerald-600" />
                Unlocked (Custom)
              </span>
            )}
          </div>
        )}

        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 block uppercase">
            Transactions
          </span>
          <span
            className={cn(
              "text-xs font-mono font-bold mt-0.5 block",
              transactionCount > 0 ? "text-indigo-700" : "text-slate-500"
            )}
          >
            {transactionCount} Posted
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 font-medium">
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          Created: <strong className="text-slate-700">{createdAt}</strong> ({createdBy})
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          Last Updated: <strong className="text-slate-700">{updatedAt}</strong> ({updatedBy})
        </span>
      </div>
    </div>
  );
}

/**
 * Reusable Safe Activation / Deactivation Confirmation Dialog
 */
export interface MasterActivationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  recordName: string;
  currentStatus: "Active" | "Inactive";
  hasDependents?: boolean;
  dependentWarning?: string;
}

export function MasterActivationDialog({
  isOpen,
  onClose,
  onConfirm,
  recordName,
  currentStatus,
  hasDependents = false,
  dependentWarning,
}: MasterActivationDialogProps) {
  if (!isOpen) return null;

  const targetStatus = currentStatus === "Active" ? "Inactive" : "Active";
  const isDeactivating = currentStatus === "Active";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4 font-sans text-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            {isDeactivating ? (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            )}
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {isDeactivating ? "Deactivate Record" : "Activate Record"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2.5 text-slate-700">
          <p className="text-xs leading-relaxed">
            Are you sure you want to change the status of{" "}
            <strong className="text-slate-900 font-bold">"{recordName}"</strong> to{" "}
            <span
              className={cn(
                "font-bold uppercase px-1.5 py-0.5 rounded text-[11px]",
                isDeactivating
                  ? "bg-slate-100 text-slate-800"
                  : "bg-emerald-100 text-emerald-800"
              )}
            >
              {targetStatus}
            </span>
            ?
          </p>

          {isDeactivating && hasDependents && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed space-y-1">
              <strong className="block font-bold flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
                Operational Impact Warning
              </strong>
              <span>
                {dependentWarning ||
                  "Deactivating this record will prevent new transactions, vouchers, and postings from selecting it."}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="px-4 h-8 text-xs font-semibold text-slate-600 bg-white"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              "px-4 h-8 font-bold text-xs shadow-xs text-white",
              isDeactivating
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-emerald-700 hover:bg-emerald-800"
            )}
          >
            Confirm {targetStatus}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable Master Delete Protection Alert Dialog
 */
export interface MasterDeleteProtectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recordName: string;
  reason: "system_account" | "has_transactions" | "has_children";
  childCount?: number;
  transactionCount?: number;
}

export function MasterDeleteProtectionDialog({
  isOpen,
  onClose,
  recordName,
  reason,
  childCount = 0,
  transactionCount = 0,
}: MasterDeleteProtectionDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl border border-rose-200 space-y-4 font-sans text-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2 text-rose-700">
            <ShieldAlert className="h-5 w-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Deletion Blocked
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 text-slate-700">
          <p className="text-xs">
            Cannot delete record <strong className="text-slate-900 font-bold">"{recordName}"</strong>.
          </p>

          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 text-[11px] leading-relaxed space-y-1.5">
            <strong className="block font-bold">Protection Rule Enforced:</strong>
            {reason === "system_account" && (
              <p>
                This is a protected <strong>System Master Record</strong> required by Hotel PMS V1 core operations. System records cannot be deleted.
              </p>
            )}
            {reason === "has_children" && (
              <p>
                This record currently has <strong>{childCount} active child sub-records</strong>. You must reassign or remove all child items before deleting the parent record.
              </p>
            )}
            {reason === "has_transactions" && (
              <p>
                This record has <strong>{transactionCount} posted journal/voucher transactions</strong> in the financial ledger. Deleting records with active transactions corrupts financial history and departmental audit trails.
              </p>
            )}
          </div>

          <p className="text-[11px] text-slate-500 italic">
            Recommended Action: If this record is no longer active, use <strong>Deactivate</strong> instead to safely prevent future selections while preserving historical integrity.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            size="sm"
            onClick={onClose}
            className="px-5 h-8 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs"
          >
            Understood
          </Button>
        </div>
      </div>
    </div>
  );
}
