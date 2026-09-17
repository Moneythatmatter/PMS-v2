"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Building2,
  Target,
  Share2,
  Activity,
  GitCommit,
  CalendarDays,
  Users,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Edit2,
  X,
  Check,
  Filter,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  smVenueService,
  smLeadSourceService,
  smActivityTypeService,
  smDealStageService,
  smContactTypeService,
} from "@/services/sales-marketing";
import {
  mapVenueFromApi,
  mapVenueToApi,
  mapLeadSourceFromApi,
  mapLeadSourceToApi,
  mapActivityTypeFromApi,
  mapActivityTypeToApi,
  mapDealStageFromApi,
  mapDealStageToApi,
  mapContactTypeFromApi,
  mapContactTypeToApi,
} from "@/lib/sales-marketing/api-mappers";

// ─────────────────────────────────────────────────────────────
// 1. DATA TYPES & SCHEMAS FOR ALL 8 MASTERS
// ─────────────────────────────────────────────────────────────

export type MasterTabKey =
  | "venues-halls"
  | "lead-sources"
  | "activity-types"
  | "deal-stages"
  | "contact-types";

// 1. Venues & Spaces (Simplified V1 Schema)
export interface VenueSpaceMasterItem {
  dbId?: string;
  venueId: string; // e.g. "VEN-001"
  venueName: string;
  venueType: string; // "Banquet Hall", "Lawn", "Conference Room", "Boardroom", etc.
  minimumCapacity: number;
  maximumCapacity: number;
  location: string;
  status: "Active" | "Maintenance" | "Inactive";
  description?: string;
}

// 2. Lead Source (Hotel PMS V1 Master Specification)
export type LeadSourceCategory =
  | "Digital Advertising"
  | "Direct"
  | "Referral / B2B"
  | "OTA / Channel"
  | "Offline"
  | "Other";

export interface LeadSourceMasterItem {
  dbId?: string;
  sourceId: string; // e.g. "SRC-001" (system-generated)
  sourceName: string; // Required, unique
  category: LeadSourceCategory; // Standard category dropdown
  status: "Active" | "Inactive"; // Default: Active
  description?: string; // Optional
  createdAt?: string;
  updatedAt?: string;
}

// 5. Activity Type (Hotel PMS V1 Master Specification)
export type ActivityTypeCategory =
  | "Communication"
  | "Visit"
  | "Meeting"
  | "Task"
  | "Other";

export interface ActivityTypeMasterItem {
  dbId?: string;
  activityTypeId: string; // e.g. "ACT-001" (system-generated)
  typeName: string; // Required, unique
  category: ActivityTypeCategory; // Dropdown
  description?: string; // Optional
  status: "Active" | "Inactive"; // Default: Active
  createdAt: string;
  updatedAt: string;
}

// 6. Deal Stage (Hotel PMS V1 Master Specification)
export interface DealStageMasterItem {
  dbId?: string;
  stageId: string; // e.g. "STG-001" (system-generated)
  stageName: string; // Required, unique
  sequence: number; // Required, unique across active stages
  description?: string; // Optional
  status: "Active" | "Inactive"; // Default: Active
  createdAt?: string;
  updatedAt?: string;
}

// 7. Contact Type (Hotel PMS V1 Master Specification)
export interface ContactTypeMasterItem {
  dbId?: string;
  contactTypeId: string; // e.g. "CT-001" (system-generated)
  contactTypeName: string; // Required, unique
  description?: string; // Optional
  status: "Active" | "Inactive"; // Default: Active
  createdAt?: string;
  updatedAt?: string;
}

// ─────────────────────────────────────────────────────────────
// INITIAL SEED DATA FOR ALL 8 MASTERS
// ─────────────────────────────────────────────────────────────

export const INITIAL_VENUES_MASTER = [];

export const INITIAL_LEAD_SOURCES = [];

export const ACTIVITY_TYPE_CATEGORIES: ActivityTypeCategory[] = [
  "Communication",
  "Visit",
  "Meeting",
  "Task",
  "Other",
];

export const INITIAL_ACTIVITY_TYPES = [];

export const INITIAL_DEAL_STAGES = [];

export const INITIAL_CONTACT_TYPES = [];

const DEFAULT_VENUE_TYPES = [
  "Banquet Hall",
  "Lawn",
  "Conference Room",
  "Boardroom",
  "Pool / Poolside",
  "Restaurant",
  "Terrace",
  "Private Dining",
  "Other",
];

export const LEAD_SOURCE_CATEGORIES: LeadSourceCategory[] = [
  "Digital Advertising",
  "Direct",
  "Referral / B2B",
  "OTA / Channel",
  "Offline",
  "Other",
];

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

interface Props {
  initialTab?: MasterTabKey;
}

export function SalesMarketingMastersView({ initialTab = "venues-halls" }: Props) {
  const [activeTab] = useState<MasterTabKey>(initialTab);
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Master State Stores
  const [venues, setVenues] = useState<VenueSpaceMasterItem[]>([]);
  const [venueTypes, setVenueTypes] = useState<string[]>(DEFAULT_VENUE_TYPES);
  const [leadSources, setLeadSources] = useState<LeadSourceMasterItem[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityTypeMasterItem[]>([]);
  const [dealStages, setDealStages] = useState<DealStageMasterItem[]>([]);
  const [contactTypes, setContactTypes] = useState<ContactTypeMasterItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMasters = async () => {
    setLoading(true);
    try {
      const [venueRows, sourceRows, activityRows, stageRows, typeRows] = await Promise.all([
        smVenueService.list(),
        smLeadSourceService.list(),
        smActivityTypeService.list(),
        smDealStageService.list(),
        smContactTypeService.list(),
      ]);
      const mappedVenues = venueRows.map(mapVenueFromApi);
      setVenues(mappedVenues);
      setLeadSources(sourceRows.map(mapLeadSourceFromApi));
      setActivityTypes(activityRows.map(mapActivityTypeFromApi));
      setDealStages(stageRows.map(mapDealStageFromApi));
      setContactTypes(typeRows.map(mapContactTypeFromApi));
      const typesFromData = [...new Set(mappedVenues.map((v) => v.venueType).filter(Boolean))];
      setVenueTypes([...new Set([...DEFAULT_VENUE_TYPES, ...typesFromData])]);
    } catch (e) {
      setToastMessage(e instanceof Error ? e.message : "Failed to load masters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMasters();
  }, []);

  // Lead Sources Filter State
  const [leadSourceCategoryFilter, setLeadSourceCategoryFilter] = useState<string>("ALL");
  const [leadSourceStatusFilter, setLeadSourceStatusFilter] = useState<string>("ALL");

  // Activity Types Filter State
  const [activityTypeCategoryFilter, setActivityTypeCategoryFilter] = useState<string>("ALL");
  const [activityTypeStatusFilter, setActivityTypeStatusFilter] = useState<string>("ALL");

  // Deal Stages Filter State
  const [dealStageStatusFilter, setDealStageStatusFilter] = useState<string>("ALL");

  // Deal Stage Create / Edit Modal State
  const [isDealStageModalOpen, setIsDealStageModalOpen] = useState(false);
  const [editingDealStageId, setEditingDealStageId] = useState<string | null>(null);
  const [dealStageFormData, setDealStageFormData] = useState<{
    stageName: string;
    sequence: number;
    description: string;
    status: "Active" | "Inactive";
  }>({
    stageName: "",
    sequence: 1,
    description: "",
    status: "Active",
  });

  // Contact Types Filter State
  const [contactTypeStatusFilter, setContactTypeStatusFilter] = useState<string>("ALL");

  // Contact Type Create / Edit Modal State
  const [isContactTypeModalOpen, setIsContactTypeModalOpen] = useState(false);
  const [editingContactTypeId, setEditingContactTypeId] = useState<string | null>(null);
  const [contactTypeFormData, setContactTypeFormData] = useState<{
    contactTypeName: string;
    description: string;
    status: "Active" | "Inactive";
  }>({
    contactTypeName: "",
    description: "",
    status: "Active",
  });

  // Activity Type Create / Edit Modal State
  const [isActivityTypeModalOpen, setIsActivityTypeModalOpen] = useState(false);
  const [editingActivityTypeId, setEditingActivityTypeId] = useState<string | null>(null);
  const [activityTypeFormData, setActivityTypeFormData] = useState<{
    typeName: string;
    category: ActivityTypeCategory;
    status: "Active" | "Inactive";
    description: string;
  }>({
    typeName: "",
    category: "Communication",
    status: "Active",
    description: "",
  });

  // Lead Source Create / Edit Modal State
  const [isLeadSourceModalOpen, setIsLeadSourceModalOpen] = useState(false);
  const [editingLeadSourceId, setEditingLeadSourceId] = useState<string | null>(null);
  const [leadSourceFormData, setLeadSourceFormData] = useState<{
    sourceName: string;
    category: LeadSourceCategory;
    status: "Active" | "Inactive";
    description: string;
  }>({
    sourceName: "",
    category: "Digital Advertising",
    status: "Active",
    description: "",
  });

  // Simplified Create / Edit Venue Modal State
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null);
  const [isAddingNewType, setIsAddingNewType] = useState(false);
  const [customTypeInput, setCustomTypeInput] = useState("");

  const [venueFormData, setVenueFormData] = useState<Omit<VenueSpaceMasterItem, "venueId">>({
    venueName: "",
    venueType: "Banquet Hall",
    minimumCapacity: 100,
    maximumCapacity: 500,
    location: "Ground Floor - West Wing",
    status: "Active",
    description: "",
  });

  const tabLabels: Record<MasterTabKey, string> = {
    "venues-halls": "Venues & Spaces",
    "lead-sources": "Lead Sources",
    "activity-types": "Activity Types",
    "deal-stages": "Deal Stages",
    "contact-types": "Contact Types",
  };

  const masterDescriptions: Record<MasterTabKey, string> = {
    "venues-halls": "Define the bookable physical spaces in the hotel with their capacity, type, and location.",
    "lead-sources": "Standardize inquiry origins and advertising channels across Leads, Campaigns, Deals, and Bookings.",
    "activity-types": "Standardize sales interaction types and follow-up actions performed by the sales team.",
    "deal-stages": "Manage sales pipeline stages and sequence order for the CRM Kanban opportunity board.",
    "contact-types": "Define relationship classifications for guests, corporate clients, travel agents, and partner records.",
  };

  // ─────────────────────────────────────────────────────────────
  // HANDLERS: VENUES & SPACES
  // ─────────────────────────────────────────────────────────────

  const handleOpenCreateVenue = () => {
    setEditingVenueId(null);
    setIsAddingNewType(false);
    setCustomTypeInput("");
    setVenueFormData({
      venueName: "",
      venueType: venueTypes[0] || "Banquet Hall",
      minimumCapacity: 100,
      maximumCapacity: 500,
      location: "",
      status: "Active",
      description: "",
    });
    setIsVenueModalOpen(true);
  };

  const handleOpenEditVenue = (venue: VenueSpaceMasterItem) => {
    setEditingVenueId(venue.venueId);
    setIsAddingNewType(false);
    setCustomTypeInput("");
    setVenueFormData({
      venueName: venue.venueName,
      venueType: venue.venueType,
      minimumCapacity: venue.minimumCapacity,
      maximumCapacity: venue.maximumCapacity,
      location: venue.location,
      status: venue.status,
      description: venue.description || "",
    });
    setIsVenueModalOpen(true);
  };

  const handleAddCustomType = () => {
    if (!customTypeInput.trim()) return;
    const cleanType = customTypeInput.trim();
    if (!venueTypes.includes(cleanType)) {
      setVenueTypes((prev) => [...prev, cleanType]);
    }
    setVenueFormData((prev) => ({ ...prev, venueType: cleanType }));
    setCustomTypeInput("");
    setIsAddingNewType(false);
    setToastMessage(`✓ Added new Venue Type "${cleanType}"!`);
  };

  const handleSaveVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueFormData.venueName.trim()) return;

    try {
      const existing = venues.find((v) => v.venueId === editingVenueId);
      const payload = mapVenueToApi({ ...venueFormData, venueId: editingVenueId ?? undefined });
      const row = existing?.dbId
        ? await smVenueService.update(existing.dbId, payload)
        : await smVenueService.create(payload);
      const saved = mapVenueFromApi(row);
      setVenues((prev) =>
        existing?.dbId
          ? prev.map((v) => (v.dbId === saved.dbId ? saved : v))
          : [saved, ...prev],
      );
      setToastMessage(
        existing?.dbId
          ? `✓ Updated venue "${saved.venueName}" (${saved.venueId}) successfully!`
          : `✓ Created new venue "${saved.venueName}" (${saved.venueId})!`,
      );
      setIsVenueModalOpen(false);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to save venue");
    }
  };

  // ─────────────────────────────────────────────────────────────
  // HANDLERS: LEAD SOURCES MASTER (HOTEL PMS V1)
  // ─────────────────────────────────────────────────────────────

  const handleOpenCreateLeadSource = () => {
    setEditingLeadSourceId(null);
    setLeadSourceFormData({
      sourceName: "",
      category: "Digital Advertising",
      status: "Active",
      description: "",
    });
    setIsLeadSourceModalOpen(true);
  };

  const handleOpenEditLeadSource = (item: LeadSourceMasterItem) => {
    setEditingLeadSourceId(item.sourceId);
    setLeadSourceFormData({
      sourceName: item.sourceName,
      category: item.category,
      status: item.status,
      description: item.description || "",
    });
    setIsLeadSourceModalOpen(true);
  };

  const handleSaveLeadSource = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = leadSourceFormData.sourceName.trim();
    if (!cleanName) return;

    const isDuplicate = leadSources.some(
      (s) => s.sourceName.toLowerCase() === cleanName.toLowerCase() && s.sourceId !== editingLeadSourceId,
    );
    if (isDuplicate) {
      alert(`Lead Source "${cleanName}" already exists. Please enter a unique name.`);
      return;
    }

    try {
      const existing = leadSources.find((s) => s.sourceId === editingLeadSourceId);
      const payload = mapLeadSourceToApi({
        sourceId: editingLeadSourceId ?? undefined,
        sourceName: cleanName,
        category: leadSourceFormData.category,
        status: leadSourceFormData.status,
        description: leadSourceFormData.description.trim(),
      });
      const row = existing?.dbId
        ? await smLeadSourceService.update(existing.dbId, payload)
        : await smLeadSourceService.create(payload);
      const saved = mapLeadSourceFromApi(row);
      setLeadSources((prev) =>
        existing?.dbId
          ? prev.map((s) => (s.dbId === saved.dbId ? saved : s))
          : [...prev, saved],
      );
      setToastMessage(`✓ Saved Lead Source "${saved.sourceName}" (#${saved.sourceId})!`);
      setIsLeadSourceModalOpen(false);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to save lead source");
    }
  };

  // Handlers for Activity Types Master (Hotel PMS V1)
  const handleOpenCreateActivityType = () => {
    setEditingActivityTypeId(null);
    setActivityTypeFormData({
      typeName: "",
      category: "Communication",
      status: "Active",
      description: "",
    });
    setIsActivityTypeModalOpen(true);
  };

  const handleOpenEditActivityType = (item: ActivityTypeMasterItem) => {
    setEditingActivityTypeId(item.activityTypeId);
    setActivityTypeFormData({
      typeName: item.typeName,
      category: item.category,
      status: item.status,
      description: item.description || "",
    });
    setIsActivityTypeModalOpen(true);
  };

  const handleSaveActivityType = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = activityTypeFormData.typeName.trim();
    if (!cleanName || cleanName.length < 3 || !/[a-zA-Z]/.test(cleanName)) {
      alert("Please enter a valid Activity Type Name (min 3 chars, at least one letter).");
      return;
    }
    const lower = cleanName.toLowerCase();
    if (lower === "test" || lower === "123") {
      alert("Please enter a valid Activity Type Name.");
      return;
    }
    const isDuplicate = activityTypes.some(
      (a) => a.activityTypeId !== editingActivityTypeId && a.typeName.trim().toLowerCase() === lower,
    );
    if (isDuplicate) {
      alert("Activity type already exists.");
      return;
    }

    try {
      const existing = activityTypes.find((a) => a.activityTypeId === editingActivityTypeId);
      const payload = mapActivityTypeToApi({
        activityTypeId: editingActivityTypeId ?? undefined,
        typeName: cleanName,
        category: activityTypeFormData.category,
        status: activityTypeFormData.status,
        description: activityTypeFormData.description.trim(),
      });
      const row = existing?.dbId
        ? await smActivityTypeService.update(existing.dbId, payload)
        : await smActivityTypeService.create(payload);
      const saved = mapActivityTypeFromApi(row);
      setActivityTypes((prev) =>
        existing?.dbId
          ? prev.map((a) => (a.dbId === saved.dbId ? saved : a))
          : [...prev, saved],
      );
      setToastMessage(`✓ Saved Activity Type "${saved.typeName}" (#${saved.activityTypeId})!`);
      setIsActivityTypeModalOpen(false);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to save activity type");
    }
  };

  // Open Create Deal Stage Modal
  const handleOpenCreateDealStage = () => {
    const maxSeq = dealStages.reduce((max, d) => (d.sequence > max ? d.sequence : max), 0);
    setEditingDealStageId(null);
    setDealStageFormData({
      stageName: "",
      sequence: maxSeq + 1,
      description: "",
      status: "Active",
    });
    setIsDealStageModalOpen(true);
  };

  // Open Edit Deal Stage Modal
  const handleOpenEditDealStage = (item: DealStageMasterItem) => {
    setEditingDealStageId(item.stageId);
    setDealStageFormData({
      stageName: item.stageName,
      sequence: item.sequence,
      description: item.description || "",
      status: item.status,
    });
    setIsDealStageModalOpen(true);
  };

  // Save Deal Stage (Create or Edit)
  const handleSaveDealStage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = dealStageFormData.stageName.trim();
    const seq = Number(dealStageFormData.sequence);
    if (!cleanName) {
      alert("Stage Name is required.");
      return;
    }
    const isDuplicateName = dealStages.some(
      (d) => d.stageName.toLowerCase() === cleanName.toLowerCase() && d.stageId !== editingDealStageId,
    );
    if (isDuplicateName) {
      alert("Deal stage already exists.");
      return;
    }
    if (!Number.isInteger(seq) || seq <= 0) {
      alert("Sequence must be a positive integer greater than 0.");
      return;
    }
    const isDuplicateSeq = dealStages.some(
      (d) =>
        d.sequence === seq &&
        d.stageId !== editingDealStageId &&
        d.status === "Active" &&
        dealStageFormData.status === "Active",
    );
    if (isDuplicateSeq) {
      alert("Sequence already exists. Please choose another sequence.");
      return;
    }

    try {
      const existing = dealStages.find((d) => d.stageId === editingDealStageId);
      const payload = mapDealStageToApi({
        stageId: editingDealStageId ?? undefined,
        stageName: cleanName,
        sequence: seq,
        description: dealStageFormData.description.trim(),
        status: dealStageFormData.status,
      });
      const row = existing?.dbId
        ? await smDealStageService.update(existing.dbId, payload)
        : await smDealStageService.create(payload);
      const saved = mapDealStageFromApi(row);
      setDealStages((prev) =>
        existing?.dbId
          ? prev.map((d) => (d.dbId === saved.dbId ? saved : d))
          : [...prev, saved],
      );
      setToastMessage(`✓ Saved Deal Stage "${saved.stageName}" (#${saved.stageId})!`);
      setIsDealStageModalOpen(false);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to save deal stage");
    }
  };

  // Toggle Status for Master Records
  const handleToggleStatus = async (masterKey: MasterTabKey, id: string) => {
    try {
      if (masterKey === "venues-halls") {
        const venue = venues.find((v) => v.venueId === id);
        if (!venue?.dbId) return;
        const nextStatus: VenueSpaceMasterItem["status"] =
          venue.status === "Active" ? "Maintenance" : venue.status === "Maintenance" ? "Inactive" : "Active";
        const row = await smVenueService.update(venue.dbId, mapVenueToApi({ ...venue, status: nextStatus }));
        const saved = mapVenueFromApi(row);
        setVenues((prev) => prev.map((v) => (v.dbId === saved.dbId ? saved : v)));
      } else if (masterKey === "lead-sources") {
        const item = leadSources.find((s) => s.sourceId === id);
        if (!item?.dbId) return;
        const nextStatus = item.status === "Active" ? "Inactive" : "Active";
        const row = await smLeadSourceService.update(item.dbId, mapLeadSourceToApi({ ...item, status: nextStatus }));
        const saved = mapLeadSourceFromApi(row);
        setLeadSources((prev) => prev.map((s) => (s.dbId === saved.dbId ? saved : s)));
      } else if (masterKey === "activity-types") {
        const item = activityTypes.find((a) => a.activityTypeId === id);
        if (!item?.dbId) return;
        const nextStatus = item.status === "Active" ? "Inactive" : "Active";
        const row = await smActivityTypeService.update(item.dbId, mapActivityTypeToApi({ ...item, status: nextStatus }));
        const saved = mapActivityTypeFromApi(row);
        setActivityTypes((prev) => prev.map((a) => (a.dbId === saved.dbId ? saved : a)));
      } else if (masterKey === "deal-stages") {
        const stage = dealStages.find((d) => d.stageId === id);
        if (!stage?.dbId) return;
        if (
          (stage.stageName.toLowerCase() === "won" || stage.stageName.toLowerCase() === "lost") &&
          stage.status === "Active"
        ) {
          const confirmDeactivate = confirm(
            `Warning: "${stage.stageName}" is a critical terminal outcome stage. Deactivate anyway?`,
          );
          if (!confirmDeactivate) return;
        }
        const nextStatus = stage.status === "Active" ? "Inactive" : "Active";
        const row = await smDealStageService.update(stage.dbId, mapDealStageToApi({ ...stage, status: nextStatus }));
        const saved = mapDealStageFromApi(row);
        setDealStages((prev) => prev.map((d) => (d.dbId === saved.dbId ? saved : d)));
      } else if (masterKey === "contact-types") {
        const item = contactTypes.find((c) => c.contactTypeId === id);
        if (!item?.dbId) return;
        const nextStatus = item.status === "Active" ? "Inactive" : "Active";
        const row = await smContactTypeService.update(item.dbId, mapContactTypeToApi({ ...item, status: nextStatus }));
        const saved = mapContactTypeFromApi(row);
        setContactTypes((prev) => prev.map((c) => (c.dbId === saved.dbId ? saved : c)));
      }
      setToastMessage("✓ Updated status!");
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  // Open Create Contact Type Modal
  const handleOpenCreateContactType = () => {
    setEditingContactTypeId(null);
    setContactTypeFormData({
      contactTypeName: "",
      description: "",
      status: "Active",
    });
    setIsContactTypeModalOpen(true);
  };

  // Open Edit Contact Type Modal
  const handleOpenEditContactType = (item: ContactTypeMasterItem) => {
    setEditingContactTypeId(item.contactTypeId);
    setContactTypeFormData({
      contactTypeName: item.contactTypeName,
      description: item.description || "",
      status: item.status,
    });
    setIsContactTypeModalOpen(true);
  };

  // Save Contact Type (Create or Edit)
  const handleSaveContactType = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = contactTypeFormData.contactTypeName.trim();
    if (!cleanName || cleanName.length < 3 || !/[a-zA-Z]/.test(cleanName)) {
      alert("Please enter a valid Contact Type Name (min 3 chars, at least one letter).");
      return;
    }
    const lower = cleanName.toLowerCase();
    if (lower === "test" || lower === "123" || lower === "abc") {
      alert("Please enter a valid Contact Type Name.");
      return;
    }
    const isDuplicate = contactTypes.some(
      (c) => c.contactTypeName.trim().toLowerCase() === lower && c.contactTypeId !== editingContactTypeId,
    );
    if (isDuplicate) {
      alert("Contact type already exists.");
      return;
    }

    try {
      const existing = contactTypes.find((c) => c.contactTypeId === editingContactTypeId);
      const payload = mapContactTypeToApi({
        contactTypeId: editingContactTypeId ?? undefined,
        contactTypeName: cleanName,
        description: contactTypeFormData.description.trim(),
        status: contactTypeFormData.status,
      });
      const row = existing?.dbId
        ? await smContactTypeService.update(existing.dbId, payload)
        : await smContactTypeService.create(payload);
      const saved = mapContactTypeFromApi(row);
      setContactTypes((prev) =>
        existing?.dbId
          ? prev.map((c) => (c.dbId === saved.dbId ? saved : c))
          : [...prev, saved],
      );
      setToastMessage(`✓ Saved Contact Type "${saved.contactTypeName}" (#${saved.contactTypeId})!`);
      setIsContactTypeModalOpen(false);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : "Failed to save contact type");
    }
  };

  // Filtered Venues
  const filteredVenues = useMemo(() => {
    if (!searchTerm.trim()) return venues;
    const lower = searchTerm.toLowerCase();
    return venues.filter(
      (v) =>
        v.venueId.toLowerCase().includes(lower) ||
        v.venueName.toLowerCase().includes(lower) ||
        v.venueType.toLowerCase().includes(lower) ||
        v.location.toLowerCase().includes(lower)
    );
  }, [venues, searchTerm]);

  // Filtered Lead Sources
  const filteredLeadSources = useMemo(() => {
    return leadSources.filter((s) => {
      // Search
      const lower = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm.trim() ||
        s.sourceId.toLowerCase().includes(lower) ||
        s.sourceName.toLowerCase().includes(lower) ||
        s.category.toLowerCase().includes(lower) ||
        (s.description && s.description.toLowerCase().includes(lower));

      // Category filter
      const matchCategory = leadSourceCategoryFilter === "ALL" || s.category === leadSourceCategoryFilter;

      // Status filter
      const matchStatus = leadSourceStatusFilter === "ALL" || s.status === leadSourceStatusFilter;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [leadSources, searchTerm, leadSourceCategoryFilter, leadSourceStatusFilter]);

  // Filtered Activity Types
  const filteredActivityTypes = useMemo(() => {
    return activityTypes.filter((a) => {
      const lower = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm.trim() ||
        a.activityTypeId.toLowerCase().includes(lower) ||
        a.typeName.toLowerCase().includes(lower) ||
        a.category.toLowerCase().includes(lower) ||
        (a.description && a.description.toLowerCase().includes(lower));

      const matchCategory =
        activityTypeCategoryFilter === "ALL" || a.category === activityTypeCategoryFilter;

      const matchStatus =
        activityTypeStatusFilter === "ALL" || a.status === activityTypeStatusFilter;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [activityTypes, searchTerm, activityTypeCategoryFilter, activityTypeStatusFilter]);

  // Filtered Deal Stages (sorted by sequence ascending)
  const filteredDealStages = useMemo(() => {
    return dealStages
      .filter((d) => {
        const lower = searchTerm.toLowerCase();
        const matchSearch =
          !searchTerm.trim() ||
          d.stageId.toLowerCase().includes(lower) ||
          d.stageName.toLowerCase().includes(lower) ||
          d.sequence.toString().includes(lower) ||
          (d.description && d.description.toLowerCase().includes(lower));

        const matchStatus =
          dealStageStatusFilter === "ALL" || d.status === dealStageStatusFilter;

        return matchSearch && matchStatus;
      })
      .sort((a, b) => a.sequence - b.sequence);
  }, [dealStages, searchTerm, dealStageStatusFilter]);

  // Filtered Contact Types
  const filteredContactTypes = useMemo(() => {
    return contactTypes.filter((ct) => {
      const lower = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm.trim() ||
        ct.contactTypeId.toLowerCase().includes(lower) ||
        ct.contactTypeName.toLowerCase().includes(lower) ||
        (ct.description && ct.description.toLowerCase().includes(lower));

      const matchStatus =
        contactTypeStatusFilter === "ALL" || ct.status === contactTypeStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [contactTypes, searchTerm, contactTypeStatusFilter]);

  return (
    <ModulePageShell
      eyebrow="Sales & Marketing Masters"
      title={`${tabLabels[activeTab]} Master`}
      description={masterDescriptions[activeTab]}
      breadcrumbs={[
        { label: "Sales & Marketing", href: "/sales-marketing/dashboard" },
        { label: "Masters" },
        { label: tabLabels[activeTab] },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        activeTab === "venues-halls" ? (
          <Button
            type="button"
            size="sm"
            onClick={handleOpenCreateVenue}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 px-3.5 h-8.5"
          >
            <Plus className="h-4 w-4" /> Add Venue
          </Button>
        ) : activeTab === "lead-sources" ? (
          <Button
            type="button"
            size="sm"
            onClick={handleOpenCreateLeadSource}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 px-3.5 h-8.5"
          >
            <Plus className="h-4 w-4" /> Add Lead Source
          </Button>
        ) : activeTab === "activity-types" ? (
          <Button
            type="button"
            size="sm"
            onClick={handleOpenCreateActivityType}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 px-3.5 h-8.5"
          >
            <Plus className="h-4 w-4" /> Add Activity Type
          </Button>
        ) : activeTab === "deal-stages" ? (
          <Button
            type="button"
            size="sm"
            onClick={handleOpenCreateDealStage}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 px-3.5 h-8.5"
          >
            <Plus className="h-4 w-4" /> Add Deal Stage
          </Button>
        ) : activeTab === "contact-types" ? (
          <Button
            type="button"
            size="sm"
            onClick={handleOpenCreateContactType}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 px-3.5 h-8.5"
          >
            <Plus className="h-4 w-4" /> Add Contact Type
          </Button>
        ) : null
      }
    >
      {loading && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-600">
          Loading master data from database…
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SEARCH & FILTER TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs mb-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${tabLabels[activeTab]} by name, ID, category, or notes...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-200 pl-9 pr-3 py-2 bg-slate-50 font-medium text-slate-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-400"
          />
        </div>

        {/* Lead Sources Filter Dropdowns */}
        {activeTab === "lead-sources" && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={leadSourceCategoryFilter}
              onChange={(e) => setLeadSourceCategoryFilter(e.target.value)}
              className="text-xs font-semibold rounded-lg border border-slate-200 py-2 px-2.5 bg-white text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {LEAD_SOURCE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={leadSourceStatusFilter}
              onChange={(e) => setLeadSourceStatusFilter(e.target.value)}
              className="text-xs font-semibold rounded-lg border border-slate-200 py-2 px-2.5 bg-white text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        )}

        {/* Activity Types Filter Dropdowns */}
        {activeTab === "activity-types" && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={activityTypeCategoryFilter}
              onChange={(e) => setActivityTypeCategoryFilter(e.target.value)}
              className="text-xs font-semibold rounded-lg border border-slate-200 py-2 px-2.5 bg-white text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {ACTIVITY_TYPE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={activityTypeStatusFilter}
              onChange={(e) => setActivityTypeStatusFilter(e.target.value)}
              className="text-xs font-semibold rounded-lg border border-slate-200 py-2 px-2.5 bg-white text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        )}

        {/* Deal Stages Filter Dropdown */}
        {activeTab === "deal-stages" && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={dealStageStatusFilter}
              onChange={(e) => setDealStageStatusFilter(e.target.value)}
              className="text-xs font-semibold rounded-lg border border-slate-200 py-2 px-2.5 bg-white text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        )}

        {/* Contact Types Filter Dropdown */}
        {activeTab === "contact-types" && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={contactTypeStatusFilter}
              onChange={(e) => setContactTypeStatusFilter(e.target.value)}
              className="text-xs font-semibold rounded-lg border border-slate-200 py-2 px-2.5 bg-white text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        )}

        <span className="text-xs text-slate-500 font-medium whitespace-nowrap hidden sm:inline">
          Total:{" "}
          <strong>
            {activeTab === "venues-halls"
              ? filteredVenues.length
              : activeTab === "lead-sources"
              ? filteredLeadSources.length
              : activeTab === "activity-types"
              ? filteredActivityTypes.length
              : activeTab === "deal-stages"
              ? filteredDealStages.length
              : activeTab === "contact-types"
              ? filteredContactTypes.length
              : 0}
          </strong>{" "}
          items
        </span>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          1. VENUES & SPACES TABLE
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "venues-halls" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Venue ID</th>
                  <th className="py-3 px-4">Venue Name</th>
                  <th className="py-3 px-4">Venue Type</th>
                  <th className="py-3 px-4 text-center">Capacity</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredVenues.length > 0 ? (
                  filteredVenues.map((v) => (
                    <tr
                      key={v.venueId}
                      onClick={() => handleOpenEditVenue(v)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">#{v.venueId}</td>
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 font-bold block">{v.venueName}</strong>
                        {v.description && (
                          <span className="text-[10px] text-slate-500 line-clamp-1">{v.description}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {v.venueType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-900">
                        {v.minimumCapacity}–{v.maximumCapacity} Pax
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">{v.location}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1",
                            v.status === "Active"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : v.status === "Maintenance"
                              ? "bg-amber-100 text-amber-900 border-amber-300 font-bold"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          )}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditVenue(v)}
                            className="text-[11px] h-7 px-2.5"
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus("venues-halls", v.venueId)}
                            className="text-[11px] h-7 px-2.5"
                          >
                            {v.status === "Active" ? "Maintenance" : v.status === "Maintenance" ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs italic">
                      No venues found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. LEAD SOURCES TABLE (HOTEL PMS V1 MASTER SPECIFICATION)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "lead-sources" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Source ID</th>
                  <th className="py-3 px-4">Source Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredLeadSources.length > 0 ? (
                  filteredLeadSources.map((s) => (
                    <tr
                      key={s.sourceId}
                      onClick={() => handleOpenEditLeadSource(s)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      {/* Source ID */}
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">#{s.sourceId}</td>

                      {/* Source Name */}
                      <td className="py-3 px-4 font-bold text-slate-900">{s.sourceName}</td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-md text-[10px] font-semibold border inline-block",
                            s.category === "Digital Advertising"
                              ? "bg-purple-50 text-purple-900 border-purple-200"
                              : s.category === "Direct"
                              ? "bg-blue-50 text-blue-900 border-blue-200"
                              : s.category === "Referral / B2B"
                              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                              : s.category === "OTA / Channel"
                              ? "bg-amber-50 text-amber-900 border-amber-200"
                              : "bg-slate-100 text-slate-800 border-slate-200"
                          )}
                        >
                          {s.category}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {s.description || "—"}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block",
                            s.status === "Active"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          )}
                        >
                          {s.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditLeadSource(s)}
                            className="text-[11px] h-7 px-2.5"
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus("lead-sources", s.sourceId)}
                            className={cn(
                              "text-[11px] h-7 px-2.5",
                              s.status === "Active" ? "text-slate-600" : "text-emerald-700 border-emerald-200 bg-emerald-50/50"
                            )}
                          >
                            {s.status === "Active" ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs italic">
                      No Lead Sources found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. ACTIVITY TYPES TABLE (HOTEL PMS V1 MASTER SPECIFICATION)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "activity-types" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Activity Type ID</th>
                  <th className="py-3 px-4">Type Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredActivityTypes.length > 0 ? (
                  filteredActivityTypes.map((a) => (
                    <tr
                      key={a.activityTypeId}
                      onClick={() => handleOpenEditActivityType(a)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      {/* Activity Type ID */}
                      <td className="py-3 px-4 font-mono font-bold text-emerald-800">#{a.activityTypeId}</td>

                      {/* Type Name */}
                      <td className="py-3 px-4 font-bold text-slate-900">{a.typeName}</td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-md text-[10px] font-semibold border inline-block",
                            a.category === "Communication"
                              ? "bg-blue-50 text-blue-900 border-blue-200"
                              : a.category === "Visit"
                              ? "bg-purple-50 text-purple-900 border-purple-200"
                              : a.category === "Meeting"
                              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                              : a.category === "Task"
                              ? "bg-amber-50 text-amber-900 border-amber-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          )}
                        >
                          {a.category}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 text-slate-500 max-w-[280px] truncate">
                        {a.description || <span className="italic text-slate-400">—</span>}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block",
                            a.status === "Active"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          )}
                        >
                          {a.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditActivityType(a)}
                            className="text-[11px] h-7 px-2.5"
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus("activity-types", a.activityTypeId)}
                            className={cn(
                              "text-[11px] h-7 px-2.5",
                              a.status === "Active"
                                ? "text-slate-600"
                                : "text-emerald-700 border-emerald-200 bg-emerald-50/50"
                            )}
                          >
                            {a.status === "Active" ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs italic">
                      No Activity Types found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. DEAL STAGES TABLE (HOTEL PMS V1 MASTER SPECIFICATION)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "deal-stages" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Stage ID</th>
                  <th className="py-3 px-4">Stage Name</th>
                  <th className="py-3 px-4 text-center">Sequence</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredDealStages.length > 0 ? (
                  filteredDealStages.map((d) => (
                    <tr
                      key={d.stageId}
                      onClick={() => handleOpenEditDealStage(d)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      {/* Stage ID */}
                      <td className="py-3 px-4 font-mono font-bold text-purple-800">#{d.stageId}</td>

                      {/* Stage Name */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{d.stageName}</span>
                          {(d.stageName.toLowerCase() === "won" || d.stageName.toLowerCase() === "lost") && (
                            <span className="bg-slate-100 text-slate-600 font-mono text-[9px] px-1.5 py-0.2 rounded border border-slate-200 uppercase font-semibold">
                              Terminal
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Sequence */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                        <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold">
                          Step {d.sequence}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 text-slate-500 max-w-[280px] truncate">
                        {d.description || <span className="italic text-slate-400">—</span>}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block",
                            d.status === "Active"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          )}
                        >
                          {d.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditDealStage(d)}
                            className="text-[11px] h-7 px-2.5"
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus("deal-stages", d.stageId)}
                            className={cn(
                              "text-[11px] h-7 px-2.5",
                              d.status === "Active"
                                ? "text-slate-600"
                                : "text-emerald-700 border-emerald-200 bg-emerald-50/50"
                            )}
                          >
                            {d.status === "Active" ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs italic">
                      No Deal Stages found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. CONTACT TYPES TABLE (HOTEL PMS V1 MASTER SPECIFICATION)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === "contact-types" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Contact Type ID</th>
                  <th className="py-3 px-4">Contact Type Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredContactTypes.length > 0 ? (
                  filteredContactTypes.map((ct) => (
                    <tr
                      key={ct.contactTypeId}
                      onClick={() => handleOpenEditContactType(ct)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      {/* Contact Type ID */}
                      <td className="py-3 px-4 font-mono font-bold text-blue-800">#{ct.contactTypeId}</td>

                      {/* Contact Type Name */}
                      <td className="py-3 px-4 font-bold text-slate-900">{ct.contactTypeName}</td>

                      {/* Description */}
                      <td className="py-3 px-4 text-slate-500 max-w-[320px] truncate">
                        {ct.description || <span className="italic text-slate-400">—</span>}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-block",
                            ct.status === "Active"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          )}
                        >
                          {ct.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEditContactType(ct)}
                            className="text-[11px] h-7 px-2.5"
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus("contact-types", ct.contactTypeId)}
                            className={cn(
                              "text-[11px] h-7 px-2.5",
                              ct.status === "Active"
                                ? "text-slate-600"
                                : "text-emerald-700 border-emerald-200 bg-emerald-50/50"
                            )}
                          >
                            {ct.status === "Active" ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs italic">
                      No Contact Types found matching your filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CREATE / EDIT VENUE MODAL
      ───────────────────────────────────────────────────────────── */}
      {isVenueModalOpen && (
        <Modal
          isOpen={isVenueModalOpen}
          onClose={() => setIsVenueModalOpen(false)}
          title={editingVenueId ? `Edit Venue / Space — #${editingVenueId}` : "Create Venue / Space"}
          maxWidth="md"
        >
          <form onSubmit={handleSaveVenue} className="space-y-3.5 p-1 text-xs">
            {/* 1. Venue / Space Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Venue / Space Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Grand Ballroom"
                value={venueFormData.venueName}
                onChange={(e) => setVenueFormData({ ...venueFormData, venueName: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* 2. Venue Type */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700 text-[11px]">
                  Venue Type <span className="text-rose-500">*</span>
                </label>
                {!isAddingNewType && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNewType(true)}
                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer flex items-center gap-0.5"
                  >
                    <Plus className="h-3 w-3" /> Add Type
                  </button>
                )}
              </div>

              {isAddingNewType ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Enter custom venue type..."
                    value={customTypeInput}
                    onChange={(e) => setCustomTypeInput(e.target.value)}
                    className="flex-1 p-2 rounded-lg border border-emerald-300 bg-emerald-50/40 font-semibold text-slate-900 text-xs focus:outline-none"
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddCustomType}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-8 px-2.5 text-xs rounded-lg cursor-pointer"
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsAddingNewType(false);
                      setCustomTypeInput("");
                    }}
                    className="h-8 px-2 text-xs rounded-lg cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <select
                  value={venueFormData.venueType}
                  onChange={(e) => setVenueFormData({ ...venueFormData, venueType: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                >
                  {venueTypes.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 3 & 4. Capacity (Min & Max) */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Minimum Capacity (Pax)</label>
                <input
                  type="number"
                  min={1}
                  placeholder="e.g. 100"
                  value={venueFormData.minimumCapacity}
                  onChange={(e) => setVenueFormData({ ...venueFormData, minimumCapacity: Number(e.target.value) || 1 })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Maximum Capacity (Pax)</label>
                <input
                  type="number"
                  min={1}
                  placeholder="e.g. 500"
                  value={venueFormData.maximumCapacity}
                  onChange={(e) => setVenueFormData({ ...venueFormData, maximumCapacity: Number(e.target.value) || 1 })}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            {/* 5. Location */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Location</label>
              <input
                type="text"
                placeholder="e.g. Ground Floor - West Wing"
                value={venueFormData.location}
                onChange={(e) => setVenueFormData({ ...venueFormData, location: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* 6. Status */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Status</label>
              <select
                value={venueFormData.status}
                onChange={(e) =>
                  setVenueFormData({
                    ...venueFormData,
                    status: e.target.value as "Active" | "Maintenance" | "Inactive",
                  })
                }
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-bold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* 7. Description */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Brief notes about the space, view, or ambiance..."
                value={venueFormData.description}
                onChange={(e) => setVenueFormData({ ...venueFormData, description: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsVenueModalOpen(false)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs px-4"
              >
                {editingVenueId ? "Save Changes" : "Create Venue"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CREATE / EDIT LEAD SOURCE MODAL (HOTEL PMS V1)
      ───────────────────────────────────────────────────────────── */}
      {isLeadSourceModalOpen && (
        <Modal
          isOpen={isLeadSourceModalOpen}
          onClose={() => setIsLeadSourceModalOpen(false)}
          title={
            editingLeadSourceId
              ? `Edit Lead Source — #${editingLeadSourceId}`
              : "Create Lead Source"
          }
          maxWidth="sm"
        >
          <form onSubmit={handleSaveLeadSource} className="space-y-3.5 p-1 text-xs">
            {/* Auto ID Display when editing */}
            {editingLeadSourceId && (
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">Source ID:</span>
                <strong className="font-mono text-emerald-800 font-bold">#{editingLeadSourceId}</strong>
              </div>
            )}

            {/* 1. Source Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Source Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Google Ads, Meta Ads, Website..."
                value={leadSourceFormData.sourceName}
                onChange={(e) => setLeadSourceFormData({ ...leadSourceFormData, sourceName: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* 2. Category */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={leadSourceFormData.category}
                onChange={(e) =>
                  setLeadSourceFormData({
                    ...leadSourceFormData,
                    category: e.target.value as LeadSourceCategory,
                  })
                }
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              >
                {LEAD_SOURCE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Description */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Brief notes about how leads from this origin are captured..."
                value={leadSourceFormData.description}
                onChange={(e) => setLeadSourceFormData({ ...leadSourceFormData, description: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* 4. Status */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Status</label>
              <select
                value={leadSourceFormData.status}
                onChange={(e) =>
                  setLeadSourceFormData({
                    ...leadSourceFormData,
                    status: e.target.value as "Active" | "Inactive",
                  })
                }
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-bold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsLeadSourceModalOpen(false)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs px-4"
              >
                {editingLeadSourceId ? "Save Changes" : "Create Lead Source"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CREATE / EDIT ACTIVITY TYPE MODAL (HOTEL PMS V1)
      ───────────────────────────────────────────────────────────── */}
      {isActivityTypeModalOpen && (
        <Modal
          isOpen={isActivityTypeModalOpen}
          onClose={() => setIsActivityTypeModalOpen(false)}
          title={
            editingActivityTypeId
              ? `Edit Activity Type — #${editingActivityTypeId}`
              : "Create Activity Type"
          }
          maxWidth="sm"
        >
          <form onSubmit={handleSaveActivityType} className="space-y-3.5 p-1 text-xs">
            {/* Auto ID Display when editing */}
            {editingActivityTypeId && (
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">Activity Type ID:</span>
                <strong className="font-mono text-emerald-800 font-bold">#{editingActivityTypeId}</strong>
              </div>
            )}

            {/* 1. Type Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Type Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Call, Site Visit, Follow Up, Meeting..."
                value={activityTypeFormData.typeName}
                onChange={(e) =>
                  setActivityTypeFormData({ ...activityTypeFormData, typeName: e.target.value })
                }
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* 2. Category */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={activityTypeFormData.category}
                onChange={(e) =>
                  setActivityTypeFormData({
                    ...activityTypeFormData,
                    category: e.target.value as ActivityTypeCategory,
                  })
                }
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              >
                {ACTIVITY_TYPE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Description */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Brief notes about what this sales activity represents..."
                value={activityTypeFormData.description}
                onChange={(e) =>
                  setActivityTypeFormData({ ...activityTypeFormData, description: e.target.value })
                }
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* 4. Status */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Status</label>
              <select
                value={activityTypeFormData.status}
                onChange={(e) =>
                  setActivityTypeFormData({
                    ...activityTypeFormData,
                    status: e.target.value as "Active" | "Inactive",
                  })
                }
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-bold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsActivityTypeModalOpen(false)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs px-4"
              >
                {editingActivityTypeId ? "Save Changes" : "Create Activity Type"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CREATE / EDIT DEAL STAGE MODAL (HOTEL PMS V1)
      ───────────────────────────────────────────────────────────── */}
      {isDealStageModalOpen && (
        <Modal
          isOpen={isDealStageModalOpen}
          onClose={() => setIsDealStageModalOpen(false)}
          title={
            editingDealStageId
              ? `Edit Deal Stage — #${editingDealStageId}`
              : "Create Deal Stage"
          }
          maxWidth="sm"
        >
          <form onSubmit={handleSaveDealStage} className="space-y-3.5 p-1 text-xs">
            {/* Auto ID Display when editing */}
            {editingDealStageId && (
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">Stage ID:</span>
                <strong className="font-mono text-purple-800 font-bold">#{editingDealStageId}</strong>
              </div>
            )}

            {/* 1. Stage Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Stage Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Qualification, Negotiation, Tentative Hold..."
                value={dealStageFormData.stageName}
                onChange={(e) =>
                  setDealStageFormData({ ...dealStageFormData, stageName: e.target.value })
                }
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* 2. Sequence */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Sequence <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                step={1}
                placeholder="e.g. 1, 2, 3..."
                value={dealStageFormData.sequence}
                onChange={(e) =>
                  setDealStageFormData({
                    ...dealStageFormData,
                    sequence: parseInt(e.target.value, 10) || 1,
                  })
                }
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Determines the order of columns in the Deals & Pipeline Kanban.
              </span>
            </div>

            {/* 3. Description */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Brief notes about what occurs in this sales pipeline stage..."
                value={dealStageFormData.description}
                onChange={(e) =>
                  setDealStageFormData({ ...dealStageFormData, description: e.target.value })
                }
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* 4. Status */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Status</label>
              <select
                value={dealStageFormData.status}
                onChange={(e) =>
                  setDealStageFormData({
                    ...dealStageFormData,
                    status: e.target.value as "Active" | "Inactive",
                  })
                }
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-bold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDealStageModalOpen(false)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs px-4"
              >
                {editingDealStageId ? "Save Changes" : "Create Deal Stage"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CREATE / EDIT CONTACT TYPE MODAL (HOTEL PMS V1)
      ───────────────────────────────────────────────────────────── */}
      {isContactTypeModalOpen && (
        <Modal
          isOpen={isContactTypeModalOpen}
          onClose={() => setIsContactTypeModalOpen(false)}
          title={
            editingContactTypeId
              ? `Edit Contact Type — #${editingContactTypeId}`
              : "Create Contact Type"
          }
          maxWidth="sm"
        >
          <form onSubmit={handleSaveContactType} className="space-y-3.5 p-1 text-xs">
            {/* Auto ID Display when editing */}
            {editingContactTypeId && (
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">Contact Type ID:</span>
                <strong className="font-mono text-blue-800 font-bold">#{editingContactTypeId}</strong>
              </div>
            )}

            {/* 1. Contact Type Name */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Contact Type Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Individual, Corporate, Travel Agent, Wedding Planner..."
                value={contactTypeFormData.contactTypeName}
                onChange={(e) =>
                  setContactTypeFormData({
                    ...contactTypeFormData,
                    contactTypeName: e.target.value,
                  })
                }
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* 2. Description */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Brief notes describing this relationship type..."
                value={contactTypeFormData.description}
                onChange={(e) =>
                  setContactTypeFormData({
                    ...contactTypeFormData,
                    description: e.target.value,
                  })
                }
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* 3. Status */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Status</label>
              <select
                value={contactTypeFormData.status}
                onChange={(e) =>
                  setContactTypeFormData({
                    ...contactTypeFormData,
                    status: e.target.value as "Active" | "Inactive",
                  })
                }
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-bold text-slate-900 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsContactTypeModalOpen(false)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs px-4"
              >
                {editingContactTypeId ? "Save Changes" : "Create Contact Type"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </ModulePageShell>
  );
}
