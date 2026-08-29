"use client";

import React, { useState, useEffect } from "react";
import {
  Phone,
  MapPin,
  MessageSquare,
  Mail,
  Users,
  CheckSquare,
  Clock,
  Building2,
  CheckCircle2,
  User,
} from "lucide-react";
import { Modal, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export type SharedActivityType =
  | "Phone Call"
  | "Site Visit"
  | "Follow-up"
  | "Meeting"
  | "WhatsApp"
  | "Email"
  | "Task / Note"
  | "Proposal Sent";

export type SharedActivityPriority = "High" | "Medium" | "Low";
export type SharedActivityStatus = "Upcoming" | "Scheduled" | "Completed" | "Overdue" | "Cancelled";

export interface ActivityPayload {
  id: string;
  activityType: SharedActivityType;
  priority: SharedActivityPriority;
  subject: string;
  activityDate: string;
  activityTime: string;
  assignedExecutive: string;
  status: SharedActivityStatus;
  notes: string;
  venue?: string;

  // Context Linking
  relatedEntityType: "Deal" | "Lead" | "Booking" | "General";
  relatedEntityId: string;
  dealName?: string;
  leadName?: string;
  companyName?: string;
  contactPerson: string;
  mobile: string;
  email?: string;
  pipelineStage?: string;

  // Next action chaining
  setNextAction?: boolean;
  nextActionSummary?: string;
  nextActionDate?: string;
}

export interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: ActivityPayload) => void;

  // Optional preset context
  dealContext?: {
    id: string;
    dealName: string;
    leadId?: string;
    customerName: string;
    companyName?: string;
    mobile: string;
    email?: string;
    stage?: string;
    assignedExecutive?: string;
  } | null;

  leadContext?: {
    id: string;
    leadName: string;
    companyName?: string;
    mobile: string;
    email?: string;
  } | null;

  initialActivityType?: SharedActivityType;
  initialStatus?: SharedActivityStatus;
  availableDeals?: {
    id: string;
    dealName: string;
    customerName: string;
    companyName?: string;
    mobile: string;
    email?: string;
    stage?: string;
    assignedExecutive?: string;
  }[];

  availableLeads?: {
    id: string;
    leadName: string;
    companyName?: string;
    mobile: string;
    email?: string;
  }[];
}

const ACTIVITY_TYPES: { type: SharedActivityType; label: string; icon: any }[] = [
  { type: "Phone Call", label: "Call", icon: Phone },
  { type: "Site Visit", label: "Site Visit", icon: MapPin },
  { type: "Follow-up", label: "Follow-up", icon: Clock },
  { type: "Meeting", label: "Meeting", icon: Users },
  { type: "WhatsApp", label: "WhatsApp", icon: MessageSquare },
  { type: "Email", label: "Email", icon: Mail },
  { type: "Task / Note", label: "Note", icon: CheckSquare },
];

export function AddActivityModal({
  isOpen,
  onClose,
  onSave,
  dealContext,
  leadContext,
  initialActivityType = "Phone Call",
  initialStatus = "Scheduled",
  availableDeals = [],
  availableLeads = [],
}: AddActivityModalProps) {
  // Form States
  const [activityType, setActivityType] = useState<SharedActivityType>(initialActivityType);
  const [priority, setPriority] = useState<SharedActivityPriority>("Medium");
  const [subject, setSubject] = useState("");
  const [activityDate, setActivityDate] = useState("2026-08-29");
  const [activityTime, setActivityTime] = useState("03:00 PM");
  const [assignedExecutive, setAssignedExecutive] = useState("Jay Kumar");
  const [status, setStatus] = useState<SharedActivityStatus>(initialStatus);
  const [notes, setNotes] = useState("");
  const [venue, setVenue] = useState("");

  // Target linking & manual selection states
  const [selectedDealId, setSelectedDealId] = useState<string>(dealContext?.id || availableDeals[0]?.id || "NONE");
  const [manualContactName, setManualContactName] = useState(
    dealContext?.customerName || leadContext?.leadName || availableDeals[0]?.customerName || ""
  );
  const [manualMobile, setManualMobile] = useState(
    dealContext?.mobile || leadContext?.mobile || availableDeals[0]?.mobile || ""
  );
  const [manualCompany, setManualCompany] = useState(
    dealContext?.companyName || leadContext?.companyName || availableDeals[0]?.companyName || ""
  );
  const [manualEmail, setManualEmail] = useState(
    dealContext?.email || leadContext?.email || availableDeals[0]?.email || ""
  );

  // Initialize selection when modal opens
  useEffect(() => {
    if (initialActivityType) {
      setActivityType(initialActivityType);
    }
    if (initialStatus) {
      setStatus(initialStatus);
    }
    setActivityDate("2026-08-29");

    if (dealContext) {
      setSelectedDealId(dealContext.id);
      setManualContactName(dealContext.customerName);
      setManualMobile(dealContext.mobile);
      setManualCompany(dealContext.companyName || "");
      setManualEmail(dealContext.email || "");
      setAssignedExecutive(dealContext.assignedExecutive || "Jay Kumar");
    } else if (leadContext) {
      setSelectedDealId("NONE");
      setManualContactName(leadContext.leadName);
      setManualMobile(leadContext.mobile);
      setManualCompany(leadContext.companyName || "");
      setManualEmail(leadContext.email || "");
    } else if (availableDeals.length > 0) {
      const firstDeal = availableDeals[0];
      setSelectedDealId(firstDeal.id);
      setManualContactName(firstDeal.customerName);
      setManualMobile(firstDeal.mobile);
      setManualCompany(firstDeal.companyName || "");
      setManualEmail(firstDeal.email || "");
      if (firstDeal.assignedExecutive) {
        setAssignedExecutive(firstDeal.assignedExecutive);
      }
    } else {
      setSelectedDealId("NONE");
      setManualContactName("");
      setManualMobile("");
      setManualCompany("");
      setManualEmail("");
    }
  }, [dealContext, leadContext, isOpen, initialActivityType, initialStatus]);

  if (!isOpen) return null;

  // Handle deal selection change
  const handleDealChange = (dealId: string) => {
    setSelectedDealId(dealId);
    if (dealId === "NONE") {
      setManualContactName("");
      setManualMobile("");
      setManualCompany("");
      setManualEmail("");
    } else {
      const foundDeal = availableDeals.find((d) => d.id === dealId);
      if (foundDeal) {
        setManualContactName(foundDeal.customerName);
        setManualMobile(foundDeal.mobile);
        setManualCompany(foundDeal.companyName || "");
        setManualEmail(foundDeal.email || "");
        if (foundDeal.assignedExecutive) {
          setAssignedExecutive(foundDeal.assignedExecutive);
        }
      }
    }
  };

  const selectedDealObj = availableDeals.find((d) => d.id === selectedDealId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;

    const chosenContactName = manualContactName.trim() || selectedDealObj?.customerName || "Customer";
    const chosenMobile = manualMobile.trim() || selectedDealObj?.mobile || "+91 98765 00000";

    const payload: ActivityPayload = {
      id: `ACT-${Date.now()}`,
      activityType,
      priority,
      subject: subject.trim() || `${activityType} with ${chosenContactName}`,
      activityDate,
      activityTime,
      assignedExecutive,
      status,
      notes: notes.trim(),
      venue: activityType === "Site Visit" ? venue.trim() || undefined : undefined,

      relatedEntityType: selectedDealId !== "NONE" && selectedDealObj ? "Deal" : "General",
      relatedEntityId: selectedDealId !== "NONE" && selectedDealObj ? selectedDealObj.id : `GEN-${Date.now()}`,
      dealName: selectedDealId !== "NONE" && selectedDealObj ? selectedDealObj.dealName : undefined,
      leadName: chosenContactName,
      companyName: manualCompany.trim() || selectedDealObj?.companyName,
      contactPerson: chosenContactName,
      mobile: chosenMobile,
      email: manualEmail.trim() || selectedDealObj?.email,
      pipelineStage: selectedDealObj?.stage,
    };

    onSave(payload);
    onClose();
  };

  const modalTitle = dealContext
    ? `Log Activity — #${dealContext.id}`
    : "Schedule / Log Activity";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {/* Deal Context Selection / Locked Banner */}
        {dealContext ? (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="space-y-0.5">
              <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                <span className="truncate max-w-[280px]">{dealContext.dealName}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                {dealContext.customerName} {dealContext.companyName ? `• ${dealContext.companyName}` : ""}
                <span className="font-mono text-emerald-800 ml-1 font-semibold">{dealContext.mobile}</span>
              </div>
            </div>
            {dealContext.stage && (
              <span className="bg-slate-200 text-slate-800 font-semibold px-2 py-0.5 rounded text-[10px] shrink-0">
                {dealContext.stage}
              </span>
            )}
          </div>
        ) : (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Link to Opportunity / Deal:
              </label>
              <select
                value={selectedDealId}
                onChange={(e) => handleDealChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 font-semibold text-slate-900 bg-white text-xs"
              >
                <option value="NONE">-- Direct Client / General Follow-up (No Linked Deal) --</option>
                {availableDeals.map((d) => (
                  <option key={d.id} value={d.id}>
                    #{d.id} — {d.dealName} ({d.customerName})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                  Client / Contact Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. K.S. Rao or Rajesh Sharma"
                  value={manualContactName}
                  onChange={(e) => setManualContactName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-1.5 font-semibold text-slate-900 bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                  Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 98000 00000"
                  value={manualMobile}
                  onChange={(e) => setManualMobile(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-1.5 font-mono text-slate-900 bg-white text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* 1. Activity Type Pills */}
        <div className="space-y-1">
          <label className="block font-bold text-slate-700 text-[11px]">
            Activity Type *
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ACTIVITY_TYPES.map((opt) => {
              const Icon = opt.icon;
              const isSelected = activityType === opt.type;
              return (
                <button
                  type="button"
                  key={opt.type}
                  onClick={() => setActivityType(opt.type)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer",
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-2xs font-bold"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", isSelected ? "text-emerald-400" : "text-slate-500")} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Subject / Topic */}
        <div>
          <label className="block font-bold text-slate-700 mb-1 text-[11px]">
            Discussion Topic / Subject
          </label>
          <input
            type="text"
            placeholder="e.g. Verify delegate count, room block tariff & menu selection"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-slate-200 p-2 font-medium text-slate-900 bg-white placeholder:text-slate-400 text-xs"
          />
        </div>

        {/* 3. Date, Time & Priority */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block font-bold text-slate-700 mb-1 text-[11px]">Date *</label>
            <input
              type="date"
              required
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 font-semibold bg-white text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 text-[11px]">Time</label>
            <input
              type="text"
              placeholder="03:00 PM"
              value={activityTime}
              onChange={(e) => setActivityTime(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 font-mono bg-white text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 text-[11px]">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as SharedActivityPriority)}
              className="w-full p-2 rounded-lg border border-slate-200 font-semibold bg-white text-xs"
            >
              <option value="High">High 🔴</option>
              <option value="Medium">Medium 🟡</option>
              <option value="Low">Low ⚪</option>
            </select>
          </div>
        </div>

        {/* 4. Executive & Status / Venue */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block font-bold text-slate-700 mb-1 text-[11px]">Assigned Executive</label>
            <select
              value={assignedExecutive}
              onChange={(e) => setAssignedExecutive(e.target.value)}
              className="w-full p-2 rounded-lg border border-slate-200 font-semibold bg-white text-xs"
            >
              <option value="Jay Kumar">Jay Kumar</option>
              <option value="Priya Singh">Priya Singh</option>
              <option value="Rohan Verma">Rohan Verma</option>
              <option value="Amit Mehta">Amit Mehta</option>
            </select>
          </div>

          {activityType === "Site Visit" ? (
            <div>
              <label className="block font-bold text-purple-900 mb-1 text-[11px]">Venue Hall *</label>
              <input
                type="text"
                placeholder="e.g. Grand Ballroom & Lawn"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full p-2 rounded-lg border border-purple-200 bg-purple-50/50 font-semibold text-slate-900 text-xs"
              />
            </div>
          ) : (
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SharedActivityStatus)}
                className="w-full p-2 rounded-lg border border-slate-200 font-semibold bg-white text-xs"
              >
                <option value="Completed">✓ Log Completed</option>
                <option value="Upcoming">⏳ Schedule Upcoming</option>
              </select>
            </div>
          )}
        </div>

        {/* 5. Notes */}
        <div>
          <label className="block font-bold text-slate-700 mb-1 text-[11px]">
            Activity Notes &amp; Outcome *
          </label>
          <textarea
            rows={2.5}
            required
            placeholder="Enter discussion notes, client requests, or feedback..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2 rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 text-xs leading-relaxed"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-lg px-3.5 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg px-4 shadow-xs cursor-pointer text-xs"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            {status === "Completed" ? "Save Activity Record" : "Schedule Activity"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
