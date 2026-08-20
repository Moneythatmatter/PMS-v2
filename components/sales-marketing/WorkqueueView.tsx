"use client";

import React, { useState, useMemo } from "react";
import {
  CheckSquare,
  Clock,
  Phone,
  Calendar,
  Filter,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  SlidersHorizontal,
  Building2,
  UserCheck,
  Briefcase,
  Layers,
  Sparkles,
  Video,
  FileText,
  Trash2,
  Edit2,
  ArrowUpRight,
  Eye,
  CalendarDays,
  ShieldAlert,
  Check,
  X,
  FileSpreadsheet,
  Settings2,
  RotateCcw,
  Tag,
  MapPin,
  FileCheck,
  DollarSign,
  UserPlus,
  ExternalLink,
  MessageSquare,
  Paperclip,
  User,
  Activity as ActivityIcon,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal, StatusBadge } from "@/components/ui";
import { HRKPICard } from "@/components/hr/shared/HRKPICard";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// DATA MODEL: SEPARATING RECORDS AND ACTIVITIES
// ─────────────────────────────────────────────────────────────

export type RecordKind = "RECORD" | "ACTIVITY";

export type EntityType =
  | "LEAD"
  | "CONTACT"
  | "CORPORATE_ACCOUNT"
  | "OPPORTUNITY"
  | "QUOTATION"
  | "BANQUET"
  | "CONTRACT_RENEWAL";

export type ActivityType =
  | "TASK"
  | "CALL"
  | "MEETING"
  | "SITE_VISIT"
  | "FOLLOW_UP"
  | "APPROVAL"
  | "BEO_ACTION";

export type QueueKey =
  // Sales Records
  | "MY_LEADS"
  | "NEW_LEADS"
  | "MY_CONTACTS"
  | "MY_CORPORATE"
  | "MY_OPPORTUNITIES"
  | "CLOSING_SOON"
  // Sales Actions
  | "MY_QUOTATIONS"
  | "QUOTATION_FOLLOWUPS"
  | "MY_CALLS"
  | "MY_MEETINGS"
  | "MY_SITE_VISITS"
  | "BANQUET_FOLLOWUPS"
  | "BEO_ACTIONS"
  | "PENDING_APPROVALS"
  | "CONTRACT_RENEWALS"
  // Consolidated Activities Queue
  | "MY_ACTIVITIES"
  // KPI Virtual Queues
  | "KPI_OVERDUE"
  | "KPI_TODAY_CALLS_VISITS"
  | "KPI_PENDING_ACTIONS";

export type PriorityLevel = "Highest" | "High" | "Normal" | "Low";
export type ActivityStatus = "Not Started" | "In Progress" | "Completed" | "Cancelled" | "Waiting";
export type BusinessStage = "New" | "Contacted" | "Qualified" | "Requirement Captured" | "Site Visit" | "Quotation Sent" | "Negotiation" | "Won" | "Lost";

// 1. BUSINESS RECORD ENTITY SCHEMA
export interface SalesBusinessRecord {
  id: string;
  entityType: EntityType;
  name: string; // Lead Name, Account Name, Opportunity Name, Quotation No
  companyName: string;
  contactName: string;
  contactPhone: string;
  source?: string;
  enquiryType?: string;
  requirement?: string;
  value?: string;
  stage: BusinessStage;
  nextFollowupDate?: string;
  expectedCloseDate?: string;
  daysRemaining?: number;
  assignedTo: string;
  assignedTimestamp: string; // For recent filtering
  hasScheduledActivity?: boolean;
}

// 2. USER ACTION ACTIVITY SCHEMA
export interface WorkqueueActivity {
  id: string;
  activityType: ActivityType;
  subject: string;
  relatedRecordId?: string;
  relatedRecordName?: string;
  companyName: string;
  contactName: string;
  contactPhone?: string;
  dueDate: string; // e.g. "Today, 04:00 PM"
  dueDateRaw?: string; // YYYY-MM-DD for precise sorting
  isOverdue?: boolean;
  overdueText?: string;
  status: ActivityStatus;
  priority: PriorityLevel;
  assignedTo: string;
  notes?: string;
  location?: string;
  quotationNo?: string;
  beoStatus?: string;
}

// ─────────────────────────────────────────────────────────────
// SEED DATA FOR RECORDS & ACTIVITIES
// ─────────────────────────────────────────────────────────────

export const MOCK_BUSINESS_RECORDS: SalesBusinessRecord[] = [
  {
    id: "REC-LD-101",
    entityType: "LEAD",
    name: "Dr. K. S. Rao (IMA Medical Conference)",
    companyName: "Indian Medical Association",
    contactName: "Dr. K. S. Rao",
    contactPhone: "+91 98450 11223",
    source: "Website Inquiry",
    enquiryType: "Conference & Stay",
    requirement: "120 Rooms + Emerald Hall (2 Days)",
    value: "₹18,50,000",
    stage: "Requirement Captured",
    nextFollowupDate: "Today, 05:00 PM",
    assignedTo: "Jay Kumar",
    assignedTimestamp: "Today, 09:15 AM",
    hasScheduledActivity: true,
  },
  {
    id: "REC-LD-102",
    entityType: "LEAD",
    name: "Sunil Verma (TCS Leadership Meet)",
    companyName: "TCS India",
    contactName: "Sunil Verma",
    contactPhone: "+91 97110 44556",
    source: "Corporate Referral",
    enquiryType: "Corporate Room Block",
    requirement: "45 Deluxe Rooms for 3 Nights",
    value: "₹8,90,000",
    stage: "New",
    nextFollowupDate: "Today, 03:00 PM",
    assignedTo: "Jay Kumar",
    assignedTimestamp: "Today, 11:30 AM",
    hasScheduledActivity: true,
  },
  {
    id: "REC-LD-103",
    entityType: "LEAD",
    name: "Pooja Hegde (Reddy & Sharma Wedding)",
    companyName: "Reddy Family",
    contactName: "Pooja Hegde",
    contactPhone: "+91 99001 22334",
    source: "Walk-in",
    enquiryType: "Banquet Wedding",
    requirement: "Grand Ballroom + 30 Guest Rooms",
    value: "₹24,00,000",
    stage: "Site Visit",
    nextFollowupDate: "Yesterday",
    assignedTo: "Jay Kumar",
    assignedTimestamp: "Yesterday",
    hasScheduledActivity: true,
  },
  {
    id: "REC-OPP-201",
    entityType: "OPPORTUNITY",
    name: "Reliance Industries Annual Dealers Meet",
    companyName: "Reliance Industries",
    contactName: "Amitabh Shah",
    contactPhone: "+91 98200 99887",
    value: "₹32,00,000",
    stage: "Negotiation",
    expectedCloseDate: "22/08/2026",
    daysRemaining: 4,
    assignedTo: "Jay Kumar",
    assignedTimestamp: "Last 24 Hours",
    hasScheduledActivity: true,
  },
  {
    id: "REC-OPP-202",
    entityType: "OPPORTUNITY",
    name: "HDFC Bank National Tech Symposium",
    companyName: "HDFC Bank Ltd",
    contactName: "Simon Morasca",
    contactPhone: "+91 98112 33445",
    value: "₹12,50,000",
    stage: "Quotation Sent",
    expectedCloseDate: "25/08/2026",
    daysRemaining: 7,
    assignedTo: "Jay Kumar",
    assignedTimestamp: "Today",
    hasScheduledActivity: false, // Sales Risk Alert
  },
  {
    id: "REC-CORP-301",
    entityType: "CORPORATE_ACCOUNT",
    name: "Wipro Technologies (Annual Corporate LRA)",
    companyName: "Wipro Technologies",
    contactName: "Sanjay Kaushik",
    contactPhone: "+91 98440 11990",
    value: "₹45,00,000",
    stage: "Won",
    nextFollowupDate: "30/08/2026",
    assignedTo: "Jay Kumar",
    assignedTimestamp: "Last 7 Days",
    hasScheduledActivity: true,
  },
];

export const MOCK_ACTIVITIES: WorkqueueActivity[] = [
  {
    id: "ACT-101",
    activityType: "FOLLOW_UP",
    subject: "Call Sunil Verma regarding corporate quotation & LRA rates",
    relatedRecordId: "REC-LD-102",
    relatedRecordName: "Sunil Verma (TCS Leadership Meet)",
    companyName: "TCS India",
    contactName: "Sunil Verma",
    contactPhone: "+91 97110 44556",
    dueDate: "Today, 03:00 PM",
    dueDateRaw: "2026-08-18",
    status: "In Progress",
    priority: "Highest",
    assignedTo: "Jay Kumar",
    notes: "Clarify room block deposit terms and breakfast inclusion.",
  },
  {
    id: "ACT-102",
    activityType: "SITE_VISIT",
    subject: "Grand Ballroom & Lawn Walkthrough for Reddy Family",
    relatedRecordId: "REC-LD-103",
    relatedRecordName: "Pooja Hegde (Reddy & Sharma Wedding)",
    companyName: "Reddy Family",
    contactName: "Pooja Hegde",
    contactPhone: "+91 99001 22334",
    dueDate: "Yesterday",
    dueDateRaw: "2026-08-17",
    isOverdue: true,
    overdueText: "Late by 1 day",
    status: "Not Started",
    priority: "Highest",
    assignedTo: "Jay Kumar",
    location: "Grand Crystal Ballroom",
    notes: "Show wedding decor setup and food tasting menu.",
  },
  {
    id: "ACT-103",
    activityType: "FOLLOW_UP",
    subject: "Follow up on Quotation #QT-2026-074 (Rotary Club Gala)",
    relatedRecordId: "REC-LD-101",
    relatedRecordName: "Rotary Club Midtown",
    companyName: "Rotary Club Midtown",
    contactName: "Col. R. S. Bhinder",
    contactPhone: "+91 98765 43210",
    dueDate: "15/08/2026",
    dueDateRaw: "2026-08-15",
    isOverdue: true,
    overdueText: "Late by 3 days",
    status: "Not Started",
    priority: "High",
    assignedTo: "Jay Kumar",
    quotationNo: "QT-2026-074",
    notes: "Customer requested 5% bar setup fee waiver.",
  },
  {
    id: "ACT-104",
    activityType: "BEO_ACTION",
    subject: "BEO #BEO-884 Kitchen Clearance & Chef Signoff",
    companyName: "Apex Healthcare",
    contactName: "Dr. Alok Nath",
    dueDate: "Today, 01:00 PM",
    dueDateRaw: "2026-08-18",
    isOverdue: true,
    overdueText: "Late by 2 hours",
    status: "Waiting",
    priority: "Highest",
    assignedTo: "Jay Kumar",
    beoStatus: "Awaiting Chef Signoff",
    notes: "Confirm 40 PAX Jain vegetarian menu preference.",
  },
  {
    id: "ACT-105",
    activityType: "APPROVAL",
    subject: "15% Special Discount Waiver Approval for ICICI Bank",
    companyName: "ICICI Bank Corporate",
    contactName: "Vikas Sethi",
    dueDate: "16/08/2026",
    dueDateRaw: "2026-08-16",
    isOverdue: true,
    overdueText: "Late by 2 days",
    status: "Waiting",
    priority: "High",
    assignedTo: "Jay Kumar",
    notes: "Pending GM approval for tariff override.",
  },
  {
    id: "ACT-106",
    activityType: "CALL",
    subject: "Corporate Rate Renewal Call with Wipro HR",
    relatedRecordId: "REC-CORP-301",
    relatedRecordName: "Wipro Technologies",
    companyName: "Wipro Technologies",
    contactName: "Sanjay Kaushik",
    contactPhone: "+91 98440 11990",
    dueDate: "Today, 05:30 PM",
    dueDateRaw: "2026-08-18",
    status: "Not Started",
    priority: "Normal",
    assignedTo: "Jay Kumar",
    notes: "Renew annual contracted room rate agreement.",
  },
];

// COLUMN CONFIGURATION MAPPING FOR TABLE
export const QUEUE_COLUMNS_MAP: Record<string, { id: string; label: string; default: boolean }[]> = {
  LEADS: [
    { id: "name", label: "Lead / Enquiry", default: true },
    { id: "companyName", label: "Company", default: true },
    { id: "contactName", label: "Contact Person", default: true },
    { id: "enquiryType", label: "Enquiry Type", default: true },
    { id: "source", label: "Source", default: true },
    { id: "value", label: "Est. Value", default: true },
    { id: "stage", label: "Lead Stage", default: true },
    { id: "nextFollowupDate", label: "Next Follow-up", default: true },
    { id: "assignedTo", label: "Assigned To", default: true },
  ],
  OPPORTUNITIES: [
    { id: "name", label: "Opportunity Name", default: true },
    { id: "companyName", label: "Account", default: true },
    { id: "contactName", label: "Contact", default: true },
    { id: "stage", label: "Stage", default: true },
    { id: "value", label: "Expected Value", default: true },
    { id: "expectedCloseDate", label: "Expected Close Date", default: true },
    { id: "daysRemaining", label: "Days Remaining", default: true },
    { id: "hasScheduledActivity", label: "Next Action Status", default: true },
    { id: "assignedTo", label: "Assigned To", default: true },
  ],
  ACTIVITIES: [
    { id: "subject", label: "Subject / Activity", default: true },
    { id: "activityType", label: "Activity Type", default: true },
    { id: "dueDate", label: "Due Date & Time", default: true },
    { id: "status", label: "Status", default: true },
    { id: "priority", label: "Priority", default: true },
    { id: "companyName", label: "Related Account", default: true },
    { id: "contactName", label: "Contact Person", default: true },
    { id: "assignedTo", label: "Assigned To", default: true },
  ],
  SITE_VISITS: [
    { id: "contactName", label: "Client Name", default: true },
    { id: "companyName", label: "Company / Family", default: true },
    { id: "dueDate", label: "Visit Date & Time", default: true },
    { id: "location", label: "Location / Hall", default: true },
    { id: "status", label: "Status", default: true },
    { id: "assignedTo", label: "Salesperson", default: true },
  ],
};

export function WorkqueueView() {
  const [records, setRecords] = useState<SalesBusinessRecord[]>(MOCK_BUSINESS_RECORDS);
  const [activities, setActivities] = useState<WorkqueueActivity[]>(MOCK_ACTIVITIES);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Selected Queue (Default: MY_LEADS)
  const [selectedQueue, setSelectedQueue] = useState<QueueKey>("MY_LEADS");

  // Dynamic Recent Period Selector for New Enquiries Assigned
  const [recentTimeframe, setRecentTimeframe] = useState<string>("TODAY");

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>("ALL");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Manage Columns State
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  // Customize Queue Drawer State
  const [isCustomizeQueueOpen, setIsCustomizeQueueOpen] = useState(false);
  const [visibleQueues, setVisibleQueues] = useState<Record<string, boolean>>({
    MY_LEADS: true,
    NEW_LEADS: true,
    MY_CORPORATE: true,
    MY_OPPORTUNITIES: true,
    CLOSING_SOON: true,
    MY_QUOTATIONS: true,
    QUOTATION_FOLLOWUPS: true,
    MY_CALLS: true,
    MY_MEETINGS: true,
    MY_SITE_VISITS: true,
    BANQUET_FOLLOWUPS: true,
    BEO_ACTIONS: true,
    PENDING_APPROVALS: true,
    CONTRACT_RENEWALS: true,
    MY_ACTIVITIES: true,
  });

  // Modal / Drawer States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<{ kind: RecordKind; data: any } | null>(null);
  const [nextFollowupPrompt, setNextFollowupPrompt] = useState<{ activityId: string; subject: string } | null>(null);

  // Form Inputs for Activity Creation
  const [formActivityType, setFormActivityType] = useState<ActivityType>("TASK");
  const [formSubject, setFormSubject] = useState("");
  const [formRelatedRecordId, setFormRelatedRecordId] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formPriority, setFormPriority] = useState<PriorityLevel>("Normal");
  const [formLocation, setFormLocation] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Determine current active Queue Group category (LEADS | OPPORTUNITIES | ACTIVITIES | SITE_VISITS)
  const currentQueueCategory = useMemo(() => {
    if (selectedQueue === "MY_LEADS" || selectedQueue === "NEW_LEADS") return "LEADS";
    if (selectedQueue === "MY_OPPORTUNITIES" || selectedQueue === "CLOSING_SOON") return "OPPORTUNITIES";
    if (selectedQueue === "MY_SITE_VISITS") return "SITE_VISITS";
    return "ACTIVITIES";
  }, [selectedQueue]);

  // Sync columns configuration when queue changes
  useMemo(() => {
    const colsConfig = QUEUE_COLUMNS_MAP[currentQueueCategory] || QUEUE_COLUMNS_MAP.ACTIVITIES;
    setSelectedColumns(colsConfig.filter((c) => c.default).map((c) => c.id));
  }, [currentQueueCategory]);

  // ─────────────────────────────────────────────────────────────
  // NO DOUBLE COUNTING: EXACT KPI CALCULATIONS
  // ─────────────────────────────────────────────────────────────
  const kpiCounts = useMemo(() => {
    const openActivities = activities.filter((a) => a.status !== "Completed" && a.status !== "Cancelled");
    return {
      totalOpenActivities: openActivities.length,
      overdueFollowups: openActivities.filter((a) => a.isOverdue).length,
      todayCallsVisits: openActivities.filter(
        (a) =>
          (a.activityType === "CALL" || a.activityType === "MEETING" || a.activityType === "SITE_VISIT") &&
          a.dueDate.includes("Today")
      ).length,
      pendingSalesActions: openActivities.filter(
        (a) =>
          a.activityType === "APPROVAL" ||
          a.activityType === "BEO_ACTION" ||
          (a.activityType === "FOLLOW_UP" && a.quotationNo)
      ).length,
    };
  }, [activities]);

  // ─────────────────────────────────────────────────────────────
  // QUEUE BADGE COUNTS (ONLY ACTIVE UNFINISHED ITEMS)
  // ─────────────────────────────────────────────────────────────
  const queueBadgeCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    // Records Counts
    const openLeads = records.filter((r) => r.entityType === "LEAD" && r.stage !== "Won" && r.stage !== "Lost");
    counts.MY_LEADS = openLeads.length;
    counts.NEW_LEADS = openLeads.filter((r) => r.stage === "New").length;
    counts.MY_CORPORATE = records.filter((r) => r.entityType === "CORPORATE_ACCOUNT").length;
    
    const openOpps = records.filter((r) => r.entityType === "OPPORTUNITY" && r.stage !== "Won" && r.stage !== "Lost");
    counts.MY_OPPORTUNITIES = openOpps.length;
    counts.CLOSING_SOON = openOpps.filter((r) => (r.daysRemaining || 99) <= 30).length;

    // Activities Counts
    const openActs = activities.filter((a) => a.status !== "Completed" && a.status !== "Cancelled");
    counts.MY_ACTIVITIES = openActs.length;
    counts.MY_CALLS = openActs.filter((a) => a.activityType === "CALL").length;
    counts.MY_MEETINGS = openActs.filter((a) => a.activityType === "MEETING").length;
    counts.MY_SITE_VISITS = openActs.filter((a) => a.activityType === "SITE_VISIT").length;
    counts.MY_QUOTATIONS = openActs.filter((a) => a.quotationNo).length;
    counts.QUOTATION_FOLLOWUPS = openActs.filter((a) => a.quotationNo && a.activityType === "FOLLOW_UP").length;
    counts.BANQUET_FOLLOWUPS = openActs.filter((a) => a.subject.toLowerCase().includes("banquet") || a.subject.toLowerCase().includes("wedding")).length;
    counts.BEO_ACTIONS = openActs.filter((a) => a.activityType === "BEO_ACTION").length;
    counts.PENDING_APPROVALS = openActs.filter((a) => a.activityType === "APPROVAL").length;
    counts.CONTRACT_RENEWALS = openActs.filter((a) => a.subject.toLowerCase().includes("renewal")).length;

    return counts;
  }, [records, activities]);

  // ─────────────────────────────────────────────────────────────
  // FILTERED QUEUE DISPLAY DATA (WITH OVERDUE SORTING LOGIC)
  // ─────────────────────────────────────────────────────────────
  const displayItems = useMemo(() => {
    // 1. If viewing a BUSINESS RECORD queue
    if (selectedQueue === "MY_LEADS" || selectedQueue === "NEW_LEADS" || selectedQueue === "MY_OPPORTUNITIES" || selectedQueue === "CLOSING_SOON" || selectedQueue === "MY_CORPORATE") {
      return records
        .filter((r) => {
          if (selectedQueue === "MY_LEADS") return r.entityType === "LEAD";
          if (selectedQueue === "NEW_LEADS") return r.entityType === "LEAD" && r.stage === "New";
          if (selectedQueue === "MY_OPPORTUNITIES") return r.entityType === "OPPORTUNITY";
          if (selectedQueue === "CLOSING_SOON") return r.entityType === "OPPORTUNITY" && (r.daysRemaining || 99) <= 30;
          if (selectedQueue === "MY_CORPORATE") return r.entityType === "CORPORATE_ACCOUNT";
          return true;
        })
        .filter((r) => {
          const query = searchTerm.toLowerCase();
          return (
            r.name.toLowerCase().includes(query) ||
            r.companyName.toLowerCase().includes(query) ||
            r.contactName.toLowerCase().includes(query) ||
            r.id.toLowerCase().includes(query)
          );
        })
        .map((r) => ({ kind: "RECORD" as RecordKind, data: r }));
    }

    // 2. If viewing an ACTIVITY queue
    return activities
      .filter((a) => {
        // KPI Filter overrides
        if (selectedQueue === "KPI_OVERDUE") return a.isOverdue && a.status !== "Completed";
        if (selectedQueue === "KPI_TODAY_CALLS_VISITS")
          return (
            (a.activityType === "CALL" || a.activityType === "MEETING" || a.activityType === "SITE_VISIT") &&
            a.dueDate.includes("Today") &&
            a.status !== "Completed"
          );
        if (selectedQueue === "KPI_PENDING_ACTIONS")
          return (
            (a.activityType === "APPROVAL" || a.activityType === "BEO_ACTION" || (a.activityType === "FOLLOW_UP" && a.quotationNo)) &&
            a.status !== "Completed"
          );

        // Queue Type Filter
        if (selectedQueue === "MY_CALLS") return a.activityType === "CALL";
        if (selectedQueue === "MY_MEETINGS") return a.activityType === "MEETING";
        if (selectedQueue === "MY_SITE_VISITS") return a.activityType === "SITE_VISIT";
        if (selectedQueue === "BEO_ACTIONS") return a.activityType === "BEO_ACTION";
        if (selectedQueue === "PENDING_APPROVALS") return a.activityType === "APPROVAL";
        if (selectedQueue === "QUOTATION_FOLLOWUPS") return a.quotationNo && a.activityType === "FOLLOW_UP";
        if (selectedQueue === "MY_QUOTATIONS") return Boolean(a.quotationNo);
        if (selectedQueue === "BANQUET_FOLLOWUPS")
          return a.subject.toLowerCase().includes("banquet") || a.subject.toLowerCase().includes("wedding");
        if (selectedQueue === "CONTRACT_RENEWALS") return a.subject.toLowerCase().includes("renewal");

        return true; // MY_ACTIVITIES
      })
      .filter((a) => {
        const query = searchTerm.toLowerCase();
        const matchSearch =
          a.subject.toLowerCase().includes(query) ||
          a.companyName.toLowerCase().includes(query) ||
          a.contactName.toLowerCase().includes(query) ||
          (a.quotationNo && a.quotationNo.toLowerCase().includes(query)) ||
          a.id.toLowerCase().includes(query);

        const matchStatus = statusFilter === "ALL" || a.status === statusFilter;
        const matchPriority = priorityFilter === "ALL" || a.priority === priorityFilter;
        const matchType = activityTypeFilter === "ALL" || a.activityType === activityTypeFilter;

        return matchSearch && matchStatus && matchPriority && matchType;
      })
      .sort((a, b) => {
        // OVERDUE LOGIC SORTING PRIORITY: 1. Overdue first, 2. Highest Priority, 3. Today, 4. Upcoming
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        if (a.priority === "Highest" && b.priority !== "Highest") return -1;
        if (a.priority !== "Highest" && b.priority === "Highest") return 1;
        return 0;
      })
      .map((a) => ({ kind: "ACTIVITY" as RecordKind, data: a }));
  }, [records, activities, selectedQueue, searchTerm, statusFilter, priorityFilter, activityTypeFilter]);

  // ─────────────────────────────────────────────────────────────
  // HANDLERS: MARK DONE & AUTOMATIC NEXT FOLLOW-UP PROMPT
  // ─────────────────────────────────────────────────────────────
  const handleMarkDone = (activityId: string, subject: string) => {
    // 1. Mark activity completed
    setActivities((prev) =>
      prev.map((a) => (a.id === activityId ? { ...a, status: "Completed", isOverdue: false } : a))
    );
    setToastMessage(`✓ Activity "${subject}" marked as completed.`);

    // 2. Prompt for next follow-up creation
    setNextFollowupPrompt({ activityId, subject });
  };

  const handleQuickCreateFollowup = (daysToAdd: number) => {
    if (!nextFollowupPrompt) return;
    const targetDate = daysToAdd === 1 ? "Tomorrow, 10:00 AM" : `In ${daysToAdd} Days, 10:00 AM`;

    const newFollowup: WorkqueueActivity = {
      id: `ACT-${Math.floor(100 + Math.random() * 900)}`,
      activityType: "FOLLOW_UP",
      subject: `Next Follow-up: ${nextFollowupPrompt.subject}`,
      companyName: "Follow-up Client",
      contactName: "Client Contact",
      dueDate: targetDate,
      status: "Not Started",
      priority: "Normal",
      assignedTo: "Jay Kumar",
      notes: `Automatically scheduled next follow-up after completing #${nextFollowupPrompt.activityId}`,
    };

    setActivities((prev) => [newFollowup, ...prev]);
    setToastMessage(`Scheduled next follow-up for ${targetDate}.`);
    setNextFollowupPrompt(null);
  };

  const handleCreateActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim()) return;

    let relatedRecName = "";
    let compName = "General Client";
    let contName = "Contact Person";

    if (formRelatedRecordId) {
      const found = records.find((r) => r.id === formRelatedRecordId);
      if (found) {
        relatedRecName = found.name;
        compName = found.companyName;
        contName = found.contactName;
      }
    }

    const newAct: WorkqueueActivity = {
      id: `ACT-${Math.floor(100 + Math.random() * 900)}`,
      activityType: formActivityType,
      subject: formSubject.trim(),
      relatedRecordId: formRelatedRecordId || undefined,
      relatedRecordName: relatedRecName || undefined,
      companyName: compName,
      contactName: contName,
      dueDate: formDueDate || "Today, 04:00 PM",
      status: "Not Started",
      priority: formPriority,
      assignedTo: "Jay Kumar",
      location: formLocation || undefined,
      notes: formNotes.trim(),
    };

    setActivities((prev) => [newAct, ...prev]);
    setToastMessage(`Created new ${formActivityType} activity.`);
    setIsCreateModalOpen(false);
    setFormSubject("");
    setFormLocation("");
    setFormNotes("");
  };

  return (
    <ModulePageShell
      eyebrow="Sales & Marketing Operations"
      title="My Workqueue & Activity Hub"
      description="Centralized workspace for sales follow-ups, enquiries, calls, meetings, site visits, quotations, opportunities, banquet actions and approvals."
      breadcrumbs={[
        { label: "Sales & Marketing", href: "/sales-marketing/dashboard" },
        { label: "Workqueue" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCustomizeQueueOpen(true)}
            className="bg-white text-slate-700 border-slate-300 font-semibold text-xs rounded-xl shadow-xs"
          >
            <Settings2 className="h-3.5 w-3.5 mr-1 text-slate-500" /> Customize Queues
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> + Create Activity / Task
          </Button>
        </div>
      }
    >
      {/* ─────────────────────────────────────────────────────────────
          SECTION 12 & 11: CLICKABLE KPI CARDS (FILTERS WORKQUEUE ON CLICK)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div
          onClick={() => setSelectedQueue("MY_ACTIVITIES")}
          className="cursor-pointer transition hover:scale-[1.01]"
        >
          <HRKPICard
            label="Total Open Activities"
            value={`${kpiCounts.totalOpenActivities}`}
            subtitle="All Actionable Tasks"
            tone="emerald"
            icon={<CheckSquare className="h-5 w-5" />}
          />
        </div>

        <div
          onClick={() => setSelectedQueue("KPI_OVERDUE")}
          className="cursor-pointer transition hover:scale-[1.01]"
        >
          <HRKPICard
            label="Overdue Follow-ups"
            value={`${kpiCounts.overdueFollowups}`}
            subtitle="Immediate Attention Needed"
            tone="amber"
            icon={<Clock className="h-5 w-5" />}
          />
        </div>

        <div
          onClick={() => setSelectedQueue("KPI_TODAY_CALLS_VISITS")}
          className="cursor-pointer transition hover:scale-[1.01]"
        >
          <HRKPICard
            label="Today's Calls & Visits"
            value={`${kpiCounts.todayCallsVisits}`}
            subtitle="Scheduled Interactions"
            tone="purple"
            icon={<Phone className="h-5 w-5" />}
          />
        </div>

        <div
          onClick={() => setSelectedQueue("KPI_PENDING_ACTIONS")}
          className="cursor-pointer transition hover:scale-[1.01]"
        >
          <HRKPICard
            label="Pending Sales Actions"
            value={`${kpiCounts.pendingSalesActions}`}
            subtitle="Quotations, BEOs & Approvals"
            tone="blue"
            icon={<FileSpreadsheet className="h-5 w-5" />}
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MAIN WORKSPACE LAYOUT
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT PANEL: CONSOLIDATED QUEUE SIDEBAR (3 COLS) */}
        <div className="lg:col-span-3 space-y-4">
          {/* SECTION 4: MY SALES RECORDS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-2 block mb-1">
              Sales Records
            </span>

            {selectedQueue === "NEW_LEADS" && (
              <div className="px-2 py-1 mb-2 bg-emerald-50 rounded-xl border border-emerald-100 space-y-1">
                <label className="text-[10px] font-bold text-emerald-900 block">Recent Period:</label>
                <select
                  value={recentTimeframe}
                  onChange={(e) => setRecentTimeframe(e.target.value)}
                  className="w-full text-[11px] rounded-lg border border-emerald-200 bg-white p-1 font-bold text-emerald-900"
                >
                  <option value="TODAY">Today (Default)</option>
                  <option value="LAST_24_HRS">Last 24 Hours</option>
                  <option value="LAST_3_DAYS">Last 3 Days</option>
                  <option value="LAST_7_DAYS">Last 7 Days</option>
                </select>
              </div>
            )}

            {[
              { id: "MY_LEADS", label: "My Leads / Enquiries", icon: UserPlus },
              { id: "NEW_LEADS", label: "New Enquiries Assigned", icon: Sparkles },
              { id: "MY_CORPORATE", label: "My Corporate Accounts", icon: Building2 },
              { id: "MY_OPPORTUNITIES", label: "My Opportunities", icon: Briefcase },
              { id: "CLOSING_SOON", label: "Opportunities Closing Soon", icon: Clock },
            ].map((q) => {
              if (!visibleQueues[q.id]) return null;
              const Icon = q.icon;
              const isActive = selectedQueue === q.id;
              const count = queueBadgeCounts[q.id] || 0;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setSelectedQueue(q.id as QueueKey)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition",
                    isActive ? "bg-emerald-700 text-white shadow-xs" : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span className="flex items-center gap-2 truncate">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{q.label}</span>
                  </span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-black shrink-0",
                      isActive ? "bg-emerald-800 text-white" : "bg-slate-100 text-slate-800"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* SECTION 5: MY SALES ACTIONS (CONSOLIDATED) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-2 block mb-1">
              Sales Actions
            </span>

            {[
              { id: "MY_QUOTATIONS", label: "My Quotations", icon: FileText },
              { id: "QUOTATION_FOLLOWUPS", label: "Quotation Follow-ups", icon: Clock },
              { id: "MY_CALLS", label: "My Calls", icon: Phone },
              { id: "MY_SITE_VISITS", label: "My Site Visits", icon: MapPin },
              { id: "BANQUET_FOLLOWUPS", label: "Banquet Follow-ups", icon: CalendarDays },
              { id: "BEO_ACTIONS", label: "BEO Actions", icon: FileSpreadsheet },
              { id: "PENDING_APPROVALS", label: "Pending Approvals", icon: ShieldAlert },
              { id: "CONTRACT_RENEWALS", label: "Contract Renewals", icon: RotateCcw },
            ].map((q) => {
              if (!visibleQueues[q.id]) return null;
              const Icon = q.icon;
              const isActive = selectedQueue === q.id;
              const count = queueBadgeCounts[q.id] || 0;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setSelectedQueue(q.id as QueueKey)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition",
                    isActive ? "bg-emerald-700 text-white shadow-xs" : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span className="flex items-center gap-2 truncate">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{q.label}</span>
                  </span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-black shrink-0",
                      isActive ? "bg-emerald-800 text-white" : "bg-slate-100 text-slate-800"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* SECTION 6: CONSOLIDATED MY ACTIVITIES */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-2 block mb-1">
              Activity
            </span>
            <button
              type="button"
              onClick={() => setSelectedQueue("MY_ACTIVITIES")}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition",
                selectedQueue === "MY_ACTIVITIES" ? "bg-emerald-700 text-white shadow-xs" : "text-slate-700 hover:bg-slate-50"
              )}
            >
              <span className="flex items-center gap-2 truncate">
                <CheckSquare className="h-3.5 w-3.5 shrink-0" />
                <span>My Activities</span>
              </span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-black shrink-0",
                  selectedQueue === "MY_ACTIVITIES" ? "bg-emerald-800 text-white" : "bg-slate-100 text-slate-800"
                )}
              >
                {queueBadgeCounts.MY_ACTIVITIES || 0}
              </span>
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: MAIN WORKQUEUE DATA TABLE (9 COLS) */}
        <div className="lg:col-span-9 space-y-3">
          {/* TOOLBAR: REAL-TIME SEARCH, CONTEXT FILTER & MANAGE COLUMNS */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* Real-time Multi-field Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Lead, Account, Quotation #, Phone, Contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-slate-50/50 font-medium text-slate-800"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsFilterDrawerOpen(true)}
                className="rounded-xl text-xs font-semibold text-slate-700 border-slate-300 bg-white shadow-xs"
              >
                <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Filter
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsColumnModalOpen(true)}
                className="rounded-xl text-xs font-semibold text-slate-700 border-slate-300 bg-white shadow-xs"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Manage Columns
              </Button>
            </div>
          </div>

          {/* DYNAMIC QUEUE TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    {selectedColumns.includes("name") && <th className="py-3 px-4">Record / Lead</th>}
                    {selectedColumns.includes("subject") && <th className="py-3 px-4">Subject / Activity</th>}
                    {selectedColumns.includes("activityType") && <th className="py-3 px-4">Activity Type</th>}
                    {selectedColumns.includes("quotationNo") && <th className="py-3 px-4">Quotation #</th>}
                    {selectedColumns.includes("companyName") && <th className="py-3 px-4">Account / Company</th>}
                    {selectedColumns.includes("contactName") && <th className="py-3 px-4">Contact</th>}
                    {selectedColumns.includes("enquiryType") && <th className="py-3 px-4">Enquiry Type</th>}
                    {selectedColumns.includes("value") && <th className="py-3 px-4">Est. Value</th>}
                    {selectedColumns.includes("stage") && <th className="py-3 px-4">Stage</th>}
                    {selectedColumns.includes("status") && <th className="py-3 px-4">Status</th>}
                    {selectedColumns.includes("priority") && <th className="py-3 px-4">Priority</th>}
                    {selectedColumns.includes("nextFollowupDate") && <th className="py-3 px-4">Next Follow-up</th>}
                    {selectedColumns.includes("dueDate") && <th className="py-3 px-4">Due Date</th>}
                    {selectedColumns.includes("expectedCloseDate") && <th className="py-3 px-4">Expected Close</th>}
                    {selectedColumns.includes("daysRemaining") && <th className="py-3 px-4">Days Left</th>}
                    {selectedColumns.includes("hasScheduledActivity") && <th className="py-3 px-4">Next Action Alert</th>}
                    {selectedColumns.includes("assignedTo") && <th className="py-3 px-4">Assigned To</th>}
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {displayItems.length > 0 ? (
                    displayItems.map((wrapper) => {
                      const isRecord = wrapper.kind === "RECORD";
                      const rec = isRecord ? (wrapper.data as SalesBusinessRecord) : null;
                      const act = !isRecord ? (wrapper.data as WorkqueueActivity) : null;
                      const itemId = rec ? rec.id : act!.id;
                      const assignedTo = rec ? rec.assignedTo : act!.assignedTo;

                      return (
                        <tr
                          key={itemId}
                          onClick={() => setViewingItem(wrapper)}
                          className="hover:bg-slate-50/80 transition cursor-pointer"
                        >
                          {selectedColumns.includes("name") && (
                            <td className="py-3 px-4 font-bold text-slate-900">
                              <p>{rec ? rec.name : act?.subject}</p>
                              <p className="text-[10px] text-slate-400 font-mono">#{itemId}</p>
                            </td>
                          )}

                          {selectedColumns.includes("subject") && (
                            <td className="py-3 px-4 font-bold text-slate-900">
                              <p>{act ? act.subject : rec?.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">#{itemId}</p>
                            </td>
                          )}

                          {selectedColumns.includes("activityType") && (
                            <td className="py-3 px-4 font-semibold text-slate-700">{act?.activityType || "RECORD"}</td>
                          )}

                          {selectedColumns.includes("quotationNo") && (
                            <td className="py-3 px-4 font-mono font-bold text-emerald-950">
                              {act?.quotationNo || itemId}
                            </td>
                          )}

                          {selectedColumns.includes("companyName") && (
                            <td className="py-3 px-4 font-semibold text-slate-800">
                              {rec ? rec.companyName : act?.companyName}
                            </td>
                          )}

                          {selectedColumns.includes("contactName") && (
                            <td className="py-3 px-4">
                              <p className="font-semibold text-slate-900">
                                {rec ? rec.contactName : act?.contactName}
                              </p>
                              {(rec?.contactPhone || act?.contactPhone) && (
                                <p className="text-[10px] text-slate-500 font-mono">
                                  {rec ? rec.contactPhone : act?.contactPhone}
                                </p>
                              )}
                            </td>
                          )}

                          {selectedColumns.includes("enquiryType") && (
                            <td className="py-3 px-4">
                              <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold border border-slate-200">
                                {rec?.enquiryType || "General"}
                              </span>
                            </td>
                          )}

                          {selectedColumns.includes("value") && (
                            <td className="py-3 px-4 font-bold text-emerald-950 font-mono">
                              {rec ? rec.value : "—"}
                            </td>
                          )}

                          {selectedColumns.includes("stage") && (
                            <td className="py-3 px-4 font-semibold text-slate-700">
                              {rec ? rec.stage : "Follow-up"}
                            </td>
                          )}

                          {selectedColumns.includes("status") && (
                            <td className="py-3 px-4">
                              <span
                                className={cn(
                                  "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border",
                                  act?.status === "Completed"
                                    ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                                    : act?.isOverdue
                                    ? "bg-rose-100 text-rose-900 border-rose-200"
                                    : "bg-blue-100 text-blue-900 border-blue-200"
                                )}
                              >
                                {act ? act.status : rec?.stage}
                              </span>
                            </td>
                          )}

                          {selectedColumns.includes("priority") && (
                            <td className="py-3 px-4 font-bold text-slate-800">{act?.priority || "Normal"}</td>
                          )}

                          {selectedColumns.includes("nextFollowupDate") && (
                            <td className="py-3 px-4 font-semibold text-slate-700">{rec?.nextFollowupDate || "—"}</td>
                          )}

                          {selectedColumns.includes("dueDate") && (
                            <td className="py-3 px-4">
                              {act?.isOverdue ? (
                                <div>
                                  <span className="text-rose-600 font-bold block">{act.dueDate}</span>
                                  <span className="text-[10px] font-extrabold text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                    {act.overdueText}
                                  </span>
                                </div>
                              ) : (
                                <span className="font-semibold text-slate-700">{act?.dueDate || rec?.nextFollowupDate}</span>
                              )}
                            </td>
                          )}

                          {selectedColumns.includes("expectedCloseDate") && (
                            <td className="py-3 px-4 font-semibold text-slate-800">{rec?.expectedCloseDate || "—"}</td>
                          )}

                          {selectedColumns.includes("daysRemaining") && (
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {rec?.daysRemaining ? `${rec.daysRemaining} Days` : "—"}
                            </td>
                          )}

                          {selectedColumns.includes("hasScheduledActivity") && (
                            <td className="py-3 px-4">
                              {rec?.hasScheduledActivity ? (
                                <span className="text-emerald-700 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Scheduled
                                </span>
                              ) : (
                                <span className="text-rose-600 font-extrabold flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                  <AlertTriangle className="h-3.5 w-3.5" /> No Action Scheduled
                                </span>
                              )}
                            </td>
                          )}

                          {selectedColumns.includes("assignedTo") && (
                            <td className="py-3 px-4 text-slate-700 font-medium">{assignedTo}</td>
                          )}

                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              {!isRecord && act?.status !== "Completed" && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarkDone(act!.id, act!.subject)}
                                  className="rounded-xl text-xs font-bold text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                                >
                                  <Check className="h-3.5 w-3.5 mr-1" /> Mark Done
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setViewingItem(wrapper)}
                                className="rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-slate-500 text-xs">
                        <div className="max-w-xs mx-auto space-y-1">
                          <CheckCircle2 className="h-8 w-8 text-slate-300 mx-auto" />
                          <p className="font-bold text-slate-700 text-sm">You&apos;re all caught up!</p>
                          <p className="text-slate-400">No open records or actionable activities found in this queue.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          AUTOMATIC NEXT FOLLOW-UP PROMPT BANNER
      ───────────────────────────────────────────────────────────── */}
      {nextFollowupPrompt && (
        <Modal
          isOpen={Boolean(nextFollowupPrompt)}
          onClose={() => setNextFollowupPrompt(null)}
          title="Activity Completed — Schedule Next Follow-up?"
          description={`You completed: "${nextFollowupPrompt.subject}". Would you like to schedule the next action?`}
          size="sm"
        >
          <div className="space-y-4 text-xs pt-1">
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickCreateFollowup(1)}
                className="rounded-xl font-bold border-emerald-300 text-emerald-900 hover:bg-emerald-50"
              >
                Tomorrow
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickCreateFollowup(3)}
                className="rounded-xl font-bold border-blue-300 text-blue-900 hover:bg-blue-50"
              >
                In 3 Days
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickCreateFollowup(7)}
                className="rounded-xl font-bold border-purple-300 text-purple-900 hover:bg-purple-50"
              >
                Next Week
              </Button>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNextFollowupPrompt(null)}
                className="rounded-xl text-xs"
              >
                No Next Action Needed
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 17: ACTIVITY-TYPE DRIVEN CREATE ACTIVITY MODAL
      ───────────────────────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Activity"
          description="Schedule a task, phone call, site visit, or follow-up action."
          size="md"
        >
          <form onSubmit={handleCreateActivitySubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Activity Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={formActivityType}
                onChange={(e) => setFormActivityType(e.target.value as ActivityType)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 bg-white"
              >
                <option value="TASK">Task / To-Do</option>
                <option value="CALL">Phone Call</option>
                <option value="MEETING">Sales Meeting</option>
                <option value="SITE_VISIT">Hotel Site Visit</option>
                <option value="FOLLOW_UP">Follow-up Action</option>
                <option value="BEO_ACTION">Banquet BEO Action</option>
                <option value="APPROVAL">Manager Approval Request</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Activity Subject <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Call client regarding corporate quotation..."
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
              />
            </div>

            {/* SECTION 24: SEARCHABLE RELATED RECORD SELECTOR */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Related Business Record (Optional)</label>
              <select
                value={formRelatedRecordId}
                onChange={(e) => setFormRelatedRecordId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
              >
                <option value="">-- Select Related Lead or Opportunity --</option>
                {records.map((r) => (
                  <option key={r.id} value={r.id}>
                    [{r.entityType}] {r.name} — {r.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Due Date &amp; Time</label>
                <input
                  type="text"
                  placeholder="e.g. Today, 04:00 PM"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Priority Level</label>
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value as PriorityLevel)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-bold text-slate-900 bg-white"
                >
                  <option value="Highest">Highest</option>
                  <option value="High">High</option>
                  <option value="Normal">Normal</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {formActivityType === "SITE_VISIT" && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Visit Location / Hall</label>
                <input
                  type="text"
                  placeholder="e.g. Grand Crystal Ballroom & Lawns"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-900 bg-white"
                />
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Notes &amp; Requirements</label>
              <textarea
                rows={3}
                placeholder="Enter details..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 font-medium text-slate-900 bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                Create Activity
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 8: GROUPED CUSTOMIZE QUEUES DRAWER
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={isCustomizeQueueOpen}
        onClose={() => setIsCustomizeQueueOpen(false)}
        title="Customize My Workqueue Sidebar"
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-2">
            <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] block">Sales Records</span>
            {["MY_LEADS", "NEW_LEADS", "MY_CORPORATE", "MY_OPPORTUNITIES", "CLOSING_SOON"].map((qKey) => (
              <label key={qKey} className="flex items-center justify-between p-2 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800">{qKey.replace(/_/g, " ")}</span>
                <input
                  type="checkbox"
                  checked={visibleQueues[qKey]}
                  onChange={(e) => setVisibleQueues((prev) => ({ ...prev, [qKey]: e.target.checked }))}
                  className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 h-4 w-4"
                />
              </label>
            ))}
          </div>

          <div className="space-y-2">
            <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] block">Sales Actions</span>
            {["MY_QUOTATIONS", "QUOTATION_FOLLOWUPS", "MY_CALLS", "MY_SITE_VISITS", "BANQUET_FOLLOWUPS", "BEO_ACTIONS", "PENDING_APPROVALS", "CONTRACT_RENEWALS"].map((qKey) => (
              <label key={qKey} className="flex items-center justify-between p-2 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800">{qKey.replace(/_/g, " ")}</span>
                <input
                  type="checkbox"
                  checked={visibleQueues[qKey]}
                  onChange={(e) => setVisibleQueues((prev) => ({ ...prev, [qKey]: e.target.checked }))}
                  className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 h-4 w-4"
                />
              </label>
            ))}
          </div>

          <div className="space-y-2">
            <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[10px] block">Activity</span>
            <label className="flex items-center justify-between p-2 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800">MY ACTIVITIES</span>
              <input
                type="checkbox"
                checked={visibleQueues.MY_ACTIVITIES}
                onChange={(e) => setVisibleQueues((prev) => ({ ...prev, MY_ACTIVITIES: e.target.checked }))}
                className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 h-4 w-4"
              />
            </label>
          </div>
        </div>
      </Drawer>

      {/* ─────────────────────────────────────────────────────────────
          MANAGE COLUMNS MODAL
      ───────────────────────────────────────────────────────────── */}
      {isColumnModalOpen && (
        <Modal
          isOpen={isColumnModalOpen}
          onClose={() => setIsColumnModalOpen(false)}
          title="Manage Queue Columns"
          description="Choose which columns appear in your current table view."
          size="sm"
        >
          <div className="space-y-3 text-xs">
            <div className="space-y-2 max-h-60 overflow-y-auto p-1">
              {(QUEUE_COLUMNS_MAP[currentQueueCategory] || QUEUE_COLUMNS_MAP.ACTIVITIES).map((col) => {
                const isChecked = selectedColumns.includes(col.id);
                return (
                  <label
                    key={col.id}
                    className="flex items-center justify-between p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer font-bold text-slate-800"
                  >
                    <span>{col.label}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedColumns((prev) => [...prev, col.id]);
                        } else {
                          setSelectedColumns((prev) => prev.filter((id) => id !== col.id));
                        }
                      }}
                      className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 h-4 w-4"
                    />
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const defaults = (QUEUE_COLUMNS_MAP[currentQueueCategory] || QUEUE_COLUMNS_MAP.ACTIVITIES)
                    .filter((c) => c.default)
                    .map((c) => c.id);
                  setSelectedColumns(defaults);
                }}
                className="rounded-xl text-xs"
              >
                Restore Defaults
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsColumnModalOpen(false)}
                className="rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                Save Column Selection
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          RECORD / ACTIVITY DETAIL DRAWER (SECTION 20 & 29)
      ───────────────────────────────────────────────────────────── */}
      <Drawer
        isOpen={Boolean(viewingItem)}
        onClose={() => setViewingItem(null)}
        title={viewingItem?.kind === "RECORD" ? "Business Record Details" : "Activity Details"}
      >
        {viewingItem && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-1.5">
              <span className="text-[10px] text-slate-400 font-mono font-bold">#{viewingItem.data.id}</span>
              <h3 className="text-base font-black text-amber-400">
                {viewingItem.kind === "RECORD" ? viewingItem.data.name : viewingItem.data.subject}
              </h3>
              <p className="text-xs text-slate-300">
                Company: <strong>{viewingItem.data.companyName}</strong> • Contact: <strong>{viewingItem.data.contactName}</strong>
              </p>
            </div>

            {/* SECTION 29: ACTIVITY HISTORY TIMELINE */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
              <span className="font-extrabold text-slate-900 block text-[11px] uppercase tracking-wider">Activity History Timeline</span>
              <div className="space-y-1 text-[11px] text-slate-600">
                <p>• 15 Aug — Phone call completed by Jay Kumar</p>
                <p>• 16 Aug — Corporate LRA Quotation sent</p>
                <p>• 18 Aug — Follow-up activity scheduled</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <a href="/sales-marketing/crm/leads" className="w-full">
                <Button size="sm" variant="outline" className="w-full text-xs font-bold rounded-xl">
                  Open Related Record in CRM <ExternalLink className="h-3.5 w-3.5 ml-1" />
                </Button>
              </a>
            </div>
          </div>
        )}
      </Drawer>
    </ModulePageShell>
  );
}
