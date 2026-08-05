"use client";

import React, { useState, useMemo } from "react";
import {
  KeyRound,
  Building2,
  CheckCircle2,
  Save,
  RotateCcw,
  Printer,
  Download,
  Search,
  X,
  ShieldCheck,
  CheckSquare,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  FormField,
  SelectInput,
} from "@/components/frontoffice/ui";
import { ModulePageShell } from "@/components/pms";
import {
  sampleUserPrivilegeProfilesData,
  VoucherTypeUserPrivilegeState,
  UserVoucherPermissionRow,
} from "@/app/data/accounts/voucherTypeUserPrivilegeData";
import { cn } from "@/lib/utils";

export function VoucherTypeUserPrivilegeView() {
  // Profiles List State
  const [profiles, setProfiles] = useState<VoucherTypeUserPrivilegeState[]>(
    sampleUserPrivilegeProfilesData
  );

  // Selected User State
  const [selectedUser, setSelectedUser] = useState<string>(
    sampleUserPrivilegeProfilesData[0].user
  );

  // Active Profile
  const activeProfile = useMemo(
    () => profiles.find((p) => p.user === selectedUser) || profiles[0],
    [profiles, selectedUser]
  );

  // Editable Form State
  const [formData, setFormData] = useState<VoucherTypeUserPrivilegeState>(activeProfile);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync Form Data on selected user change
  React.useEffect(() => {
    setFormData({ ...activeProfile });
  }, [activeProfile]);

  // Toggle Row Permission
  const handleToggleRowPermission = (
    index: number,
    field: keyof Omit<UserVoucherPermissionRow, "transactionType">
  ) => {
    setFormData((prev) => {
      const updatedRows = [...prev.permissions];
      updatedRows[index] = {
        ...updatedRows[index],
        [field]: !updatedRows[index][field],
      };
      return { ...prev, permissions: updatedRows };
    });
  };

  // Select All Checkbox
  const allSelected = useMemo(() => {
    return (
      formData.allowSundryDebtors &&
      formData.allowSundryCreditors &&
      formData.permissions.every(
        (r) =>
          r.allowNew &&
          r.allowOpen &&
          r.allowDelete &&
          r.allowPrintInOpen &&
          r.approvalApplicable &&
          r.approvedUser
      )
    );
  }, [formData]);

  const handleToggleSelectAll = () => {
    const nextVal = !allSelected;
    setFormData((prev) => ({
      ...prev,
      allowSundryDebtors: nextVal,
      allowSundryCreditors: nextVal,
      permissions: prev.permissions.map((r) => ({
        ...r,
        allowNew: nextVal,
        allowOpen: nextVal,
        allowDelete: nextVal,
        allowPrintInOpen: nextVal,
        approvalApplicable: nextVal,
        approvedUser: nextVal,
      })),
    }));
  };

  // Save Action
  const handleSave = () => {
    setProfiles((prev) =>
      prev.map((p) =>
        p.user === formData.user ? { ...formData, updateDate: "24-July-2026" } : p
      )
    );
    setToastMessage(`Saved Voucher Type User Privileges for ${formData.user} successfully!`);
  };

  // Refresh Action
  const handleRefresh = () => {
    setFormData({ ...activeProfile });
    setToastMessage("Refreshed user privilege matrix to saved settings.");
  };

  // Export CSV Action
  const handleExportCSV = () => {
    const csvHeader =
      "User,TransactionType,New,Open,Delete,AllowPrintInOpen,ApprovalApplicable,ApprovedUser\n";
    const csvRows = formData.permissions
      .map(
        (r) =>
          `"${formData.user}","${r.transactionType}","${r.allowNew}","${r.allowOpen}","${r.allowDelete}","${r.allowPrintInOpen}","${r.approvalApplicable}","${r.approvedUser}"`
      )
      .join("\n");
    const blob = new Blob([csvHeader + csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `User_Privilege_${formData.user}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToastMessage("Exported User Privilege matrix to CSV.");
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & Masters"
      title="Voucher Type User Privilege"
      description="Manage user-level permissions, approval requirements, and voucher operation rights."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Masters", href: "/accounts/masters" },
        { label: "Voucher Type User Privilege" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            Save
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Refresh
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="rounded-xl text-xs font-semibold bg-white border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
            Report
          </Button>
        </div>
      }
    >
      {/* Top User Selector & Allow Checkboxes Bar (Matching Image 4) */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* User Selector */}
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <KeyRound className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="flex-1 max-w-sm">
              <span className="font-bold text-xs text-slate-600 block">User:</span>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
              >
                {profiles.map((p) => (
                  <option key={p.user} value={p.user}>
                    {p.user}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Top Allow Checkboxes */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="font-bold text-xs text-slate-600">Allow:</span>
            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800">
              <input
                type="checkbox"
                checked={formData.allowSundryDebtors}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    allowSundryDebtors: e.target.checked,
                  }))
                }
                className="rounded border-slate-300 text-emerald-600 h-4 w-4"
              />
              <span>Sundry Debtors</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-800">
              <input
                type="checkbox"
                checked={formData.allowSundryCreditors}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    allowSundryCreditors: e.target.checked,
                  }))
                }
                className="rounded border-slate-300 text-emerald-600 h-4 w-4"
              />
              <span>Sundry Creditors</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-900 border-l border-slate-300 pl-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleToggleSelectAll}
                className="rounded border-slate-300 text-emerald-600 h-4 w-4"
              />
              <span>Select All</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Table Grid matching EXACT WINHMS Image 4 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs font-sans text-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
                <th className="py-3 px-4 border-r border-slate-200">Transaction Type</th>
                <th className="py-3 px-3 text-center border-r border-slate-200">New</th>
                <th className="py-3 px-3 text-center border-r border-slate-200">Open</th>
                <th className="py-3 px-3 text-center border-r border-slate-200">Delete</th>
                <th className="py-3 px-3 text-center border-r border-slate-200">Allow Print in Open</th>
                <th className="py-3 px-3 text-center border-r border-slate-200">
                  Approval Applicable for this Type
                </th>
                <th className="py-3 px-3 text-center">Approved User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {formData.permissions.map((row, idx) => (
                <tr key={row.transactionType} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 border-r border-slate-200">
                    {row.transactionType}
                  </td>

                  {/* New */}
                  <td className="py-3 px-3 text-center border-r border-slate-200">
                    <input
                      type="checkbox"
                      checked={row.allowNew}
                      onChange={() => handleToggleRowPermission(idx, "allowNew")}
                      className="rounded border-slate-300 text-emerald-600 h-4 w-4 cursor-pointer"
                    />
                  </td>

                  {/* Open */}
                  <td className="py-3 px-3 text-center border-r border-slate-200">
                    <input
                      type="checkbox"
                      checked={row.allowOpen}
                      onChange={() => handleToggleRowPermission(idx, "allowOpen")}
                      className="rounded border-slate-300 text-emerald-600 h-4 w-4 cursor-pointer"
                    />
                  </td>

                  {/* Delete */}
                  <td className="py-3 px-3 text-center border-r border-slate-200">
                    <input
                      type="checkbox"
                      checked={row.allowDelete}
                      onChange={() => handleToggleRowPermission(idx, "allowDelete")}
                      className="rounded border-slate-300 text-emerald-600 h-4 w-4 cursor-pointer"
                    />
                  </td>

                  {/* Allow Print in Open */}
                  <td className="py-3 px-3 text-center border-r border-slate-200">
                    <input
                      type="checkbox"
                      checked={row.allowPrintInOpen}
                      onChange={() => handleToggleRowPermission(idx, "allowPrintInOpen")}
                      className="rounded border-slate-300 text-emerald-600 h-4 w-4 cursor-pointer"
                    />
                  </td>

                  {/* Approval Applicable for this Type */}
                  <td className="py-3 px-3 text-center border-r border-slate-200">
                    <input
                      type="checkbox"
                      checked={row.approvalApplicable}
                      onChange={() => handleToggleRowPermission(idx, "approvalApplicable")}
                      className="rounded border-slate-300 text-emerald-600 h-4 w-4 cursor-pointer"
                    />
                  </td>

                  {/* Approved User */}
                  <td className="py-3 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={row.approvedUser}
                      onChange={() => handleToggleRowPermission(idx, "approvedUser")}
                      className="rounded border-slate-300 text-emerald-600 h-4 w-4 cursor-pointer"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* WINHMS Exact Red Note Box at Bottom */}
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong>Note:</strong> Approved User - When these users creates the voucher approved not
            required. If (Unticked) the voucher is treated as unapproved.
          </div>
        </div>

        {/* WINHMS Exact Bottom Audit Line */}
        <div className="pt-2 border-t border-slate-200 text-slate-500 font-mono text-[11px] flex justify-end">
          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl space-y-1 min-w-[200px]">
            <div>
              Update By : <strong className="text-slate-800">{formData.updateBy}</strong>
            </div>
            <div>
              Date : <strong className="text-slate-800">{formData.updateDate}</strong>
            </div>
          </div>
        </div>
      </div>
    </ModulePageShell>
  );
}
