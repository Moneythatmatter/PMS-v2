"use client";

import React, { useState } from "react";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import { Shield, RefreshCw, Layers, CheckCircle2, User, Key } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { SelectInput, FormField, TextInput } from "@/components/frontoffice/ui";

const SYSTEM_ROLES = [
  "Executive Housekeeper",
  "Supervisor",
  "Housekeeper",
  "Laundry Staff",
  "Engineering Staff",
];

export default function HousekeepingSettings() {
  const {
    currentUserRole,
    setRole,
    resetState,
  } = useHousekeeping();

  const [threshold, setThreshold] = useState("30");
  const [vipTemplate, setVipTemplate] = useState("Departure Checklist");

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value);
  };

  const handleReset = () => {
    if (confirm("This will erase all active room cleaning timers, inventory restocks, laundry jobs, and audit logs. Revert back to original setup?")) {
      resetState();
      alert("PMS housekeeping database reset complete!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Settings</span>
        <h1 className="mt-1 text-2xl font-bold text-slate-800">Operational Configurations</h1>
        <p className="text-sm text-slate-500 font-normal">
          Define global housekeeping workflows, inventory par safety lines, and simulate security permissions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left column: Role Simulator (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* User profile simulator */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <User className="h-4 w-4 text-emerald-700" />
              Role Permission Simulator
            </h3>
            <p className="text-xs text-slate-500 font-normal leading-relaxed">
              Switch the active profile to experience PMS role-based access control. Supervisors verify inspections, Housekeepers log cleaning progress, and Engineers fix maintenance issues.
            </p>
            
            <FormField label="Simulate Current User Role">
              <SelectInput value={currentUserRole} onChange={handleRoleChange}>
                {SYSTEM_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </SelectInput>
            </FormField>

            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 text-xs text-slate-600 font-medium space-y-2">
              <div className="flex items-center gap-2">
                <Key className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Active Role Permissions:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-500 font-normal">
                {currentUserRole === "Executive Housekeeper" && (
                  <>
                    <li>Full dashboard analytics reading & exports</li>
                    <li>Add/delete rooms, staff, shifts, and checklists</li>
                    <li>Restock and discard inventory items</li>
                    <li>Full Supervisor room inspection approvals</li>
                  </>
                )}
                {currentUserRole === "Supervisor" && (
                  <>
                    <li>Assign room cleaning tasks to housekeepers</li>
                    <li>Perform inspection sign-offs with digital signature drawing</li>
                    <li>Verify and close maintenance repair jobs</li>
                  </>
                )}
                {currentUserRole === "Housekeeper" && (
                  <>
                    <li>Access Room Cleaning queue dashboard</li>
                    <li>Use Start/Pause/Complete timer tools on checklists</li>
                    <li>Upload quality check evidence photos</li>
                  </>
                )}
                {currentUserRole === "Laundry Staff" && (
                  <>
                    <li>Manage linen and guest laundry washing/ironing queues</li>
                    <li>Update job milestone progressions (Ready, Delivered)</li>
                  </>
                )}
                {currentUserRole === "Engineering Staff" && (
                  <>
                    <li>Read electrical, plumbing, and lock maintenance orders</li>
                    <li>Mark work orders repaired for supervisor verify</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Reset database box */}
          <div className="rounded-2xl border border-red-100 bg-red-50/10 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-red-800 flex items-center gap-1.5">
              <RefreshCw className="h-4 w-4 text-red-600 animate-hover" />
              Reset Local PMS Database
            </h3>
            <p className="text-xs text-slate-500 font-normal">
              Erases all custom modifications stored in localStorage and restores default database setups.
            </p>
            <Button
              onClick={handleReset}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2"
            >
              Reset All Housekeeping Data
            </Button>
          </div>

        </div>

        {/* Right column: Operating Guidelines Rules (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-emerald-700" />
              Operational Workflows Rules
            </h3>

            <div className="space-y-4 text-xs font-normal">
              <FormField label="Standard Checkout Cleaning Target Time (mins)">
                <TextInput type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
              </FormField>

              <FormField label="VIP Arrival Room Preparation checklist">
                <SelectInput value={vipTemplate} onChange={(e) => setVipTemplate(e.target.value)}>
                  <option>Departure Checklist (Deep Clean)</option>
                  <option>Stay-over Checklist (Standard Refresh)</option>
                </SelectInput>
              </FormField>

              <div className="pt-2 space-y-2 border-t border-slate-100">
                <p className="font-semibold text-slate-700">Automation Trigger Rules:</p>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-500 leading-relaxed text-[11px]">
                  <li><strong>Auto-Dirty Checkout:</strong> Front Office guest check-outs instantly toggle room status to Vacant Dirty.</li>
                  <li><strong>Stock Deduction:</strong> trolley supplies are automatically subtracted from stock upon cleaning submission.</li>
                  <li><strong>Out of Order (OOO):</strong> Critical room plumbing or electrical repairs block booking inventory immediately.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
