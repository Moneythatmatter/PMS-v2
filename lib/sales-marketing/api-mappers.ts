import type { BookingTypeDefinition, BookingTypeIconKey } from "./booking-types";
import type { LeadRecordItem, LeadTimelineEvent } from "@/components/sales-marketing/LeadsInquiriesView";
import type {
  CentralBookingItem,
  BookingQueueItem,
  BookingTimelineEntry,
  CentralBookingType,
  BookingCategory,
  BookingStatus,
  PaymentStatus,
  CreatedFromSource,
  HandoverStatus,
} from "@/components/sales-marketing/EventBookingsView";
import type {
  VenueSpaceMasterItem,
  LeadSourceMasterItem,
  ActivityTypeMasterItem,
  DealStageMasterItem,
  ContactTypeMasterItem,
} from "@/components/sales-marketing/masters/SalesMarketingMastersView";
import type { HotelPromotion } from "@/components/sales-marketing/PromosDiscountsView";
import type { HotelCampaign } from "@/components/sales-marketing/CampaignsView";
import type { HotelDealItem, HotelDealStage, HotelDealStatus } from "@/components/sales-marketing/DealsPipelineView";
import type { HotelActivityItem, ActivityType, ActivityStatus } from "@/components/sales-marketing/ActivitiesView";
import type { OtaChannel } from "@/components/sales-marketing/OtaChannelPerformanceView";
import type { CentralLeadItem } from "@/app/data/centralLeadData";

function str(row: Record<string, unknown>, key: string, fallback = ""): string {
  const val = row[key];
  return val == null ? fallback : String(val);
}

function num(row: Record<string, unknown>, key: string, fallback = 0): number {
  const val = Number(row[key]);
  return Number.isFinite(val) ? val : fallback;
}

function bool(row: Record<string, unknown>, key: string, fallback = false): boolean {
  const val = row[key];
  if (typeof val === "boolean") return val;
  if (val === "true" || val === true) return true;
  if (val === "false" || val === false) return false;
  return fallback;
}

function dateOnly(val: unknown): string | undefined {
  if (!val) return undefined;
  const s = String(val);
  return s.slice(0, 10);
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function mapBookingTypeFromApi(row: Record<string, unknown>): BookingTypeDefinition {
  return {
    code: str(row, "code") as BookingTypeDefinition["code"],
    centralType: str(row, "centralType"),
    leadType: str(row, "leadType"),
    cardLabel: str(row, "cardLabel"),
    shortLabel: str(row, "shortLabel"),
    description: str(row, "description"),
    beoRequired: bool(row, "beoRequired"),
    handoverNote: str(row, "handoverNote") || undefined,
    iconKey: (str(row, "iconKey", "calendar") as BookingTypeIconKey),
    defaultSortOrder: num(row, "sortOrder", 1),
    isSystem: bool(row, "isSystem"),
    createdAt: str(row, "createdAt") || undefined,
  };
}

export function mapBookingTypeToApi(
  input: Partial<BookingTypeDefinition> & { enabled?: boolean },
): Record<string, unknown> {
  return {
    code: input.code,
    isSystem: input.isSystem ?? false,
    centralType: input.centralType ?? input.cardLabel,
    leadType: input.leadType ?? input.cardLabel,
    cardLabel: input.cardLabel,
    shortLabel: input.shortLabel ?? input.cardLabel,
    description: input.description ?? "",
    beoRequired: input.beoRequired ?? false,
    handoverNote: input.handoverNote ?? null,
    iconKey: input.iconKey ?? "calendar",
    sortOrder: input.defaultSortOrder ?? 99,
    enabled: input.enabled ?? true,
  };
}

export function mapLeadFromApi(row: Record<string, unknown>): LeadRecordItem {
  const estimatedRevenue = num(row, "estimatedRevenue");
  const timeline = (row.timeline as LeadTimelineEvent[] | undefined) ?? [];
  return {
    dbId: str(row, "id"),
    id: str(row, "leadCode", str(row, "id")),
    leadName: str(row, "leadName"),
    contactPerson: str(row, "contactPerson"),
    mobileNumber: str(row, "mobileNumber"),
    mobile: str(row, "mobileNumber"),
    email: str(row, "email") || undefined,
    companyName: str(row, "companyName") || undefined,
    city: str(row, "city") || undefined,
    preferredContactMethod: str(row, "preferredContactMethod", "Phone Call") as LeadRecordItem["preferredContactMethod"],
    bookingType: str(row, "bookingType") as LeadRecordItem["bookingType"],
    eventDate: dateOnly(row.eventDate),
    expectedEventDate: dateOnly(row.eventDate),
    guestCount: num(row, "guestCount"),
    estimatedRevenue,
    rawRevenue: estimatedRevenue,
    expectedRevenue: formatInr(estimatedRevenue),
    budgetRange: str(row, "budgetRange") || undefined,
    priority: str(row, "priority", "Medium") as LeadRecordItem["priority"],
    customerRequirements: str(row, "customerRequirements"),
    leadSource: str(row, "leadSource", "Walk-In") as LeadRecordItem["leadSource"],
    campaignId: str(row, "campaignId") || null,
    campaignName: str(row, "campaignName") || null,
    promotionCode: str(row, "promotionCode") || null,
    promotionName: str(row, "promotionName") || null,
    importedVia: str(row, "importedVia", "Manual Entry") as LeadRecordItem["importedVia"],
    createdDate: dateOnly(row.createdAt) ?? new Date().toISOString().slice(0, 10),
    assignedExecutive: str(row, "assignedExecutive"),
    status: str(row, "status", "New") as LeadRecordItem["status"],
    pipelineStage: str(row, "pipelineStage") || undefined,
    linkedDealId: str(row, "linkedDealId") || undefined,
    linkedDealStage: str(row, "linkedDealStage") || undefined,
    timeline,
  };
}

export function mapLeadToApi(form: Partial<LeadRecordItem>): Record<string, unknown> {
  const revenue =
    typeof form.estimatedRevenue === "number"
      ? form.estimatedRevenue
      : typeof form.rawRevenue === "number"
        ? form.rawRevenue
        : 0;

  return {
    leadName: form.leadName,
    contactPerson: form.contactPerson,
    mobileNumber: form.mobileNumber ?? form.mobile,
    email: form.email ?? null,
    companyName: form.companyName ?? null,
    city: form.city ?? null,
    preferredContactMethod: form.preferredContactMethod ?? "Phone Call",
    bookingType: form.bookingType,
    eventDate: form.eventDate ?? form.expectedEventDate ?? null,
    guestCount: form.guestCount ?? 0,
    estimatedRevenue: revenue,
    budgetRange: form.budgetRange ?? null,
    priority: form.priority ?? "Medium",
    customerRequirements: form.customerRequirements ?? form.customerRequirement ?? "",
    leadSource: form.leadSource,
    campaignId: form.campaignId ?? null,
    campaignName: form.campaignName ?? null,
    promotionCode: form.promotionCode ?? null,
    promotionName: form.promotionName ?? null,
    importedVia: form.importedVia ?? "Manual Entry",
    assignedExecutive: form.assignedExecutive ?? "",
    status: form.status ?? "New",
    pipelineStage: form.pipelineStage ?? "Qualification",
    timeline: form.timeline ?? [],
  };
}

export function mapBookingFromApi(row: Record<string, unknown>): CentralBookingItem {
  const contractValue = num(row, "contractValue");
  const advanceReceived = num(row, "advanceReceived");
  const timeline = (row.timeline as BookingTimelineEntry[] | undefined) ?? [];
  return {
    dbId: str(row, "id"),
    bookingId: str(row, "bookingCode", str(row, "id")),
    bookingType: str(row, "bookingType") as CentralBookingType,
    bookingCategory: str(row, "bookingCategory", "Wedding") as BookingCategory,
    bookingName: str(row, "bookingName"),
    contactId: str(row, "contactId"),
    customerName: str(row, "customerName"),
    companyName: str(row, "companyName") || undefined,
    mobile: str(row, "mobile"),
    email: str(row, "email"),
    dealId: str(row, "dealId") || undefined,
    leadId: str(row, "leadId") || undefined,
    campaignId: str(row, "campaignId") || undefined,
    promotionId: str(row, "promotionId") || undefined,
    createdFrom: str(row, "createdFrom", "Direct Walk-In") as CreatedFromSource,
    startDate: dateOnly(row.startDate) ?? "",
    endDate: dateOnly(row.endDate),
    startTime: str(row, "startTime") || undefined,
    endTime: str(row, "endTime") || undefined,
    venueId: str(row, "venueId") || undefined,
    venueOrRoom: str(row, "venueOrRoom"),
    guestCount: num(row, "guestCount"),
    roomCount: num(row, "roomCount"),
    contractValue,
    advanceReceived,
    balanceDue: num(row, "balanceDue", contractValue - advanceReceived),
    paymentStatus: str(row, "paymentStatus", "Pending Advance") as PaymentStatus,
    status: str(row, "status", "Tentative") as BookingStatus,
    beoRequired: bool(row, "beoRequired"),
    beoId: str(row, "beoId") || undefined,
    beoStatus: str(row, "beoStatus") as CentralBookingItem["beoStatus"],
    handoverStatus: str(row, "handoverStatus", "Not Required") as HandoverStatus,
    coordinatorName: str(row, "coordinatorName") || undefined,
    coordinatorMobile: str(row, "coordinatorMobile") || undefined,
    notes: str(row, "notes") || undefined,
    createdAt: str(row, "createdAt"),
    updatedAt: str(row, "updatedAt"),
    timeline,
  };
}

export function mapBookingToApi(form: Partial<CentralBookingItem>): Record<string, unknown> {
  const contractValue = num(form as Record<string, unknown>, "contractValue");
  const advanceReceived = num(form as Record<string, unknown>, "advanceReceived");
  return {
    bookingType: form.bookingType,
    bookingCategory: form.bookingCategory,
    bookingName: form.bookingName,
    contactId: form.contactId ?? null,
    customerName: form.customerName,
    companyName: form.companyName ?? null,
    mobile: form.mobile,
    email: form.email,
    dealId: form.dealId ?? null,
    leadId: form.leadId ?? null,
    campaignId: form.campaignId ?? null,
    promotionId: form.promotionId ?? null,
    createdFrom: form.createdFrom ?? "Direct Walk-In",
    startDate: form.startDate,
    endDate: form.endDate ?? form.startDate,
    startTime: form.startTime ?? null,
    endTime: form.endTime ?? null,
    venueId: form.venueId ?? null,
    venueOrRoom: form.venueOrRoom,
    guestCount: form.guestCount ?? 0,
    roomCount: form.roomCount ?? 0,
    contractValue,
    advanceReceived,
    balanceDue: contractValue - advanceReceived,
    paymentStatus: form.paymentStatus ?? "Pending Advance",
    status: form.status ?? "Tentative",
    beoRequired: form.beoRequired ?? false,
    beoId: form.beoId ?? null,
    beoStatus: form.beoStatus ?? null,
    handoverStatus: form.handoverStatus ?? "Not Required",
    coordinatorName: form.coordinatorName ?? null,
    coordinatorMobile: form.coordinatorMobile ?? null,
    notes: form.notes ?? "",
    timeline: form.timeline ?? [],
  };
}

export function mapDealToQueueItem(row: Record<string, unknown>): BookingQueueItem {
  return {
    dbId: str(row, "id"),
    dealId: str(row, "dealCode", str(row, "id")),
    dealName: str(row, "dealName"),
    contactId: str(row, "contactId"),
    customerName: str(row, "customerName"),
    companyName: str(row, "companyName") || undefined,
    mobile: str(row, "mobile"),
    email: str(row, "email"),
    bookingType: str(row, "bookingType") as CentralBookingType,
    bookingCategory: "Corporate",
    proposedDate: dateOnly(row.expectedCloseDate) ?? new Date().toISOString().slice(0, 10),
    contractValue: num(row, "dealValue"),
    campaignId: str(row, "campaignId") || undefined,
    leadId: str(row, "leadId") || undefined,
    wonDate: dateOnly(row.updatedAt) ?? new Date().toISOString().slice(0, 10),
  };
}

export function mapVenueFromApi(row: Record<string, unknown>): VenueSpaceMasterItem {
  return {
    dbId: str(row, "id"),
    venueId: str(row, "venueCode", str(row, "id")),
    venueName: str(row, "venueName"),
    venueType: str(row, "venueType"),
    minimumCapacity: num(row, "minimumCapacity"),
    maximumCapacity: num(row, "maximumCapacity"),
    location: str(row, "location"),
    status: str(row, "status", "Active") as VenueSpaceMasterItem["status"],
    description: str(row, "description") || undefined,
  };
}

export function mapVenueToApi(item: Partial<VenueSpaceMasterItem>): Record<string, unknown> {
  return {
    venueCode: item.venueId,
    venueName: item.venueName,
    venueType: item.venueType,
    minimumCapacity: item.minimumCapacity,
    maximumCapacity: item.maximumCapacity,
    location: item.location,
    status: item.status,
    description: item.description ?? "",
  };
}

export function mapLeadSourceFromApi(row: Record<string, unknown>): LeadSourceMasterItem {
  return {
    dbId: str(row, "id"),
    sourceId: str(row, "sourceCode", str(row, "id")),
    sourceName: str(row, "sourceName"),
    category: str(row, "category") as LeadSourceMasterItem["category"],
    status: str(row, "status", "Active") as LeadSourceMasterItem["status"],
    description: str(row, "description") || undefined,
    createdAt: dateOnly(row.createdAt),
    updatedAt: dateOnly(row.updatedAt),
  };
}

export function mapLeadSourceToApi(item: Partial<LeadSourceMasterItem>): Record<string, unknown> {
  return {
    sourceCode: item.sourceId,
    sourceName: item.sourceName,
    category: item.category,
    status: item.status,
    description: item.description ?? "",
  };
}

export function mapActivityTypeFromApi(row: Record<string, unknown>): ActivityTypeMasterItem {
  return {
    dbId: str(row, "id"),
    activityTypeId: str(row, "activityTypeCode", str(row, "id")),
    typeName: str(row, "typeName"),
    category: str(row, "category") as ActivityTypeMasterItem["category"],
    description: str(row, "description") || undefined,
    status: str(row, "status", "Active") as ActivityTypeMasterItem["status"],
    createdAt: str(row, "createdAt"),
    updatedAt: str(row, "updatedAt"),
  };
}

export function mapActivityTypeToApi(item: Partial<ActivityTypeMasterItem>): Record<string, unknown> {
  return {
    activityTypeCode: item.activityTypeId,
    typeName: item.typeName,
    category: item.category,
    description: item.description ?? "",
    status: item.status,
  };
}

export function mapDealStageFromApi(row: Record<string, unknown>): DealStageMasterItem {
  return {
    dbId: str(row, "id"),
    stageId: str(row, "stageCode", str(row, "id")),
    stageName: str(row, "stageName"),
    sequence: num(row, "sequence"),
    description: str(row, "description") || undefined,
    status: str(row, "status", "Active") as DealStageMasterItem["status"],
    createdAt: dateOnly(row.createdAt),
    updatedAt: dateOnly(row.updatedAt),
  };
}

export function mapDealStageToApi(item: Partial<DealStageMasterItem>): Record<string, unknown> {
  return {
    stageCode: item.stageId,
    stageName: item.stageName,
    sequence: item.sequence,
    description: item.description ?? "",
    status: item.status,
  };
}

export function mapContactTypeFromApi(row: Record<string, unknown>): ContactTypeMasterItem {
  return {
    dbId: str(row, "id"),
    contactTypeId: str(row, "contactTypeCode", str(row, "id")),
    contactTypeName: str(row, "contactTypeName"),
    description: str(row, "description") || undefined,
    status: str(row, "status", "Active") as ContactTypeMasterItem["status"],
    createdAt: dateOnly(row.createdAt),
    updatedAt: dateOnly(row.updatedAt),
  };
}

export function mapContactTypeToApi(item: Partial<ContactTypeMasterItem>): Record<string, unknown> {
  return {
    contactTypeCode: item.contactTypeId,
    contactTypeName: item.contactTypeName,
    description: item.description ?? "",
    status: item.status,
  };
}

export function mapContactFromApi(row: Record<string, unknown>) {
  return {
    dbId: str(row, "id"),
    contactId: str(row, "contactCode", str(row, "id")),
    contactName: str(row, "contactName"),
    contactType: str(row, "contactType", "Individual"),
    category: str(row, "contactCategory", "Guest"),
    mobileNumber: str(row, "mobile"),
    mobile: str(row, "mobile"),
    emailAddress: str(row, "email") || undefined,
    email: str(row, "email") || undefined,
    companyName: str(row, "companyName") || undefined,
    city: str(row, "city") || undefined,
    createdDate: dateOnly(row.createdAt) ?? new Date().toISOString().slice(0, 10),
    createdBy: "System",
    createdFrom: str(row, "createdFrom", "Manual Entry"),
    status: str(row, "status", "Active"),
    notes: str(row, "notes") || undefined,
    leads: [],
    deals: [],
    bookings: [],
    activities: [],
  };
}

export function mapContactToApi(form: Record<string, unknown>): Record<string, unknown> {
  return {
    contactCode: form.contactId ?? null,
    contactName: form.contactName,
    contactType: form.contactType ?? "Individual",
    contactCategory: form.category ?? "Guest",
    mobile: form.mobileNumber ?? form.mobile,
    email: form.emailAddress ?? form.email ?? null,
    companyName: form.companyName ?? null,
    city: form.city ?? null,
    status: form.status ?? "Active",
    createdFrom: form.createdFrom ?? "Manual Entry",
    notes: form.notes ?? "",
  };
}

export function mapDealToApi(form: Record<string, unknown>): Record<string, unknown> {
  return {
    dealName: form.dealName,
    leadId: form.leadDbId ?? form.leadId ?? null,
    contactId: form.contactDbId ?? form.contactId ?? null,
    customerName: form.customerName,
    companyName: form.companyName ?? null,
    mobile: form.mobile ?? null,
    email: form.email ?? null,
    bookingType: form.bookingType ?? form.leadType ?? null,
    stage: form.stage ?? "Qualification",
    status: form.status ?? "Open",
    dealValue: num(form, "dealValue"),
    expectedCloseDate: form.expectedCloseDate ?? null,
    assignedExecutive: form.assignedExecutive ?? null,
    campaignId: form.campaignId ?? null,
    campaignName: form.campaignName ?? null,
    leadSource: form.leadSource ?? null,
    customerRequirement: form.customerRequirement ?? form.customerRequirements ?? "",
    guestCount: form.guestCount ?? 0,
    expectedEventDate: form.expectedEventDate ?? form.eventDate ?? null,
    notes: form.notes ?? "",
    bookingCreated: form.bookingCreated ?? false,
    metadata: form.metadata ?? {},
  };
}

export function mapDealFromApi(row: Record<string, unknown>): HotelDealItem {
  const meta = (row.metadata as Record<string, unknown> | undefined) ?? {};
  const dealValue = num(row, "dealValue");
  return {
    dbId: str(row, "id"),
    id: str(row, "dealCode", str(row, "id")),
    dealName: str(row, "dealName"),
    leadId: str(row, "leadId") || str(meta, "leadCode", ""),
    stage: str(row, "stage", "Qualification") as HotelDealStage,
    status: str(row, "status", "Open") as HotelDealStatus,
    customerName: str(row, "customerName"),
    companyName: str(row, "companyName") || undefined,
    contactPerson: str(row, "customerName"),
    mobile: str(row, "mobile"),
    email: str(row, "email") || undefined,
    preferredContactMethod: "Phone",
    leadType: str(row, "bookingType", "Banquet Event") as HotelDealItem["leadType"],
    customerRequirement: str(row, "customerRequirement") || str(meta, "customerRequirement", ""),
    expectedEventDate: dateOnly(row.expectedEventDate),
    guestCount: num(row, "guestCount"),
    leadSource: str(row, "leadSource") as HotelDealItem["leadSource"],
    campaignName: str(row, "campaignName") || null,
    campaignId: str(row, "campaignId") || null,
    dealValue,
    expectedRevenue: dealValue,
    expectedCloseDate: dateOnly(row.expectedCloseDate) ?? todayIso(),
    assignedExecutive: str(row, "assignedExecutive"),
    quotations: (meta.quotations as HotelDealItem["quotations"]) ?? [],
    activities: (meta.activities as HotelDealItem["activities"]) ?? [],
    createdDate: dateOnly(row.createdAt) ?? todayIso(),
    ...(meta as Partial<HotelDealItem>),
  };
}

export function mapActivityFromApi(row: Record<string, unknown>): HotelActivityItem {
  const timeline = (row.timeline as HotelActivityItem["timelineLog"] | undefined) ?? [];
  return {
    dbId: str(row, "id"),
    id: str(row, "activityCode", str(row, "id")),
    activityType: str(row, "activityType", "Call") as ActivityType,
    priority: str(row, "priority", "Medium") as HotelActivityItem["priority"],
    dealId: str(row, "dealId") || "",
    dealName: str(row, "dealName"),
    leadId: str(row, "leadId") || "",
    leadName: str(row, "leadName"),
    customerName: str(row, "customerName"),
    companyName: str(row, "companyName") || undefined,
    contactPerson: str(row, "contactPerson"),
    mobileNumber: str(row, "mobileNumber"),
    email: str(row, "email"),
    pipelineStage: str(row, "pipelineStage", "Qualification"),
    expectedRevenue: 0,
    activityDate: dateOnly(row.activityDate) ?? "",
    activityTime: str(row, "activityTime") || "—",
    assignedExecutive: str(row, "assignedExecutive"),
    status: str(row, "status", "Scheduled") as ActivityStatus,
    venueRequired: str(row, "venueRequired") || undefined,
    purpose: str(row, "purpose"),
    outcomeNotes: str(row, "outcomeNotes") || undefined,
    outcome: str(row, "outcome") as HotelActivityItem["outcome"],
    completedAt: str(row, "completedAt") || undefined,
    nextAction: str(row, "nextAction") || undefined,
    nextActionDate: dateOnly(row.nextActionDate),
    timelineLog: timeline,
  };
}

export function mapActivityToApi(form: Partial<HotelActivityItem>): Record<string, unknown> {
  return {
    activityType: form.activityType,
    priority: form.priority ?? "Medium",
    dealId: form.dealDbId ?? form.dealId ?? null,
    leadId: form.leadDbId ?? form.leadId ?? null,
    dealName: form.dealName,
    leadName: form.leadName,
    customerName: form.customerName,
    companyName: form.companyName ?? null,
    contactPerson: form.contactPerson,
    mobileNumber: form.mobileNumber,
    email: form.email,
    pipelineStage: form.pipelineStage,
    activityDate: form.activityDate,
    activityTime: form.activityTime ?? null,
    assignedExecutive: form.assignedExecutive,
    status: form.status ?? "Scheduled",
    venueRequired: form.venueRequired ?? null,
    purpose: form.purpose ?? "",
    outcomeNotes: form.outcomeNotes ?? null,
    outcome: form.outcome ?? null,
    completedAt: form.completedAt ?? null,
    nextAction: form.nextAction ?? null,
    nextActionDate: form.nextActionDate ?? null,
    timeline: form.timelineLog ?? [],
  };
}

export function mapPromotionFromApi(row: Record<string, unknown>): HotelPromotion {
  const discountType = str(row, "discountType", "Percentage") as HotelPromotion["discountType"];
  const raw = num(row, "discountValue");
  return {
    dbId: str(row, "id"),
    id: str(row, "id"),
    uniquePromoId: str(row, "promoSchemeCode"),
    name: str(row, "name"),
    promoCode: str(row, "promoCode"),
    description: str(row, "description"),
    applicableTo: str(row, "applicableTo", "Rooms") as HotelPromotion["applicableTo"],
    discountType,
    rawDiscountNumber: raw,
    discountValue: discountType === "Percentage" ? `${raw}%` : formatInr(raw),
    minSpend: row.minSpend != null ? num(row, "minSpend") : undefined,
    minNights: row.minNights != null ? num(row, "minNights") : undefined,
    startDate: dateOnly(row.startDate) ?? "",
    endDate: dateOnly(row.endDate) ?? "",
    status: str(row, "status", "Active") as HotelPromotion["status"],
    usageCount: num(row, "usageCount"),
  };
}

export function mapPromotionToApi(form: Partial<HotelPromotion>): Record<string, unknown> {
  return {
    promoSchemeCode: form.uniquePromoId,
    name: form.name,
    promoCode: form.promoCode,
    description: form.description ?? "",
    applicableTo: form.applicableTo,
    discountType: form.discountType,
    discountValue: form.rawDiscountNumber,
    minSpend: form.minSpend ?? null,
    minNights: form.minNights ?? null,
    startDate: form.startDate,
    endDate: form.endDate,
    status: form.status ?? "Active",
    usageCount: form.usageCount ?? 0,
  };
}

export function mapCampaignFromApi(row: Record<string, unknown>): HotelCampaign {
  return {
    dbId: str(row, "id"),
    id: str(row, "id"),
    campaignCode: str(row, "campaignCode"),
    campaignName: str(row, "campaignName"),
    description: str(row, "description"),
    campaignType: str(row, "campaignType") as HotelCampaign["campaignType"],
    linkedPromoCode: str(row, "linkedPromoCode"),
    targetAudience: str(row, "targetAudience") as HotelCampaign["targetAudience"],
    goal: str(row, "goal") as HotelCampaign["goal"],
    startDate: dateOnly(row.startDate) ?? "",
    endDate: dateOnly(row.endDate) ?? "",
    budget: row.budget != null ? num(row, "budget") : undefined,
    status: str(row, "status", "Draft") as HotelCampaign["status"],
    externalPlatform: str(row, "externalPlatform") as HotelCampaign["externalPlatform"],
    externalCampaignId: str(row, "externalCampaignId") || undefined,
    externalCampaignName: str(row, "externalCampaignName") || undefined,
    expectedLeads: num(row, "expectedLeads"),
    expectedBookings: num(row, "expectedBookings"),
    expectedRevenue: num(row, "expectedRevenue"),
    bookingsList: (row.bookingsList as HotelCampaign["bookingsList"]) ?? [],
  };
}

export function mapCampaignToApi(form: Partial<HotelCampaign>): Record<string, unknown> {
  return {
    campaignCode: form.campaignCode,
    campaignName: form.campaignName,
    description: form.description ?? "",
    campaignType: form.campaignType,
    linkedPromoCode: form.linkedPromoCode,
    targetAudience: form.targetAudience,
    goal: form.goal,
    startDate: form.startDate,
    endDate: form.endDate,
    budget: form.budget ?? null,
    status: form.status ?? "Draft",
    externalPlatform: form.externalPlatform ?? null,
    externalCampaignId: form.externalCampaignId ?? null,
    externalCampaignName: form.externalCampaignName ?? null,
    expectedLeads: form.expectedLeads ?? 0,
    expectedBookings: form.expectedBookings ?? 0,
    expectedRevenue: form.expectedRevenue ?? 0,
    bookingsList: form.bookingsList ?? [],
  };
}

export function mapOtaChannelFromApi(row: Record<string, unknown>): OtaChannel {
  const monthlyRevenue = num(row, "monthlyRevenue");
  const commissionRate = num(row, "commissionRate");
  const commissionCost = Math.round((monthlyRevenue * commissionRate) / 100);
  return {
    dbId: str(row, "id"),
    id: str(row, "channelCode", str(row, "id")),
    name: str(row, "channelName"),
    code: str(row, "channelCode"),
    logoBadge: str(row, "logoBadge", str(row, "channelCode")),
    status: str(row, "status", "Active Sync") as OtaChannel["status"],
    monthlyRevenue,
    monthlyBookings: num(row, "monthlyBookings"),
    roomNightsSold: num(row, "roomNightsSold"),
    commissionRate,
    commissionCost,
    netPayout: monthlyRevenue - commissionCost,
    adr: num(row, "adr"),
    profitabilityScore: str(row, "profitabilityScore", "Medium") as OtaChannel["profitabilityScore"],
    occupancyContribution: num(row, "occupancyContribution"),
    cancellationRate: num(row, "cancellationRate"),
    avgStayNights: num(row, "avgStayNights"),
    avgLeadTimeDays: num(row, "avgLeadTimeDays"),
    growthRatePercent: num(row, "growthRatePercent"),
    lastSyncTime: str(row, "lastSyncTime") || "—",
    inventoryPushStatus: str(row, "inventoryPushStatus", "Success") as OtaChannel["inventoryPushStatus"],
    ratePushStatus: str(row, "ratePushStatus", "Success") as OtaChannel["ratePushStatus"],
    restrictionPushStatus: str(row, "restrictionPushStatus", "Success") as OtaChannel["restrictionPushStatus"],
    syncWarnings: (row.syncWarnings as string[] | undefined) ?? [],
    roomMappings: (row.roomMappings as OtaChannel["roomMappings"]) ?? [],
  };
}

export function mapCentralLeadFromApi(row: Record<string, unknown>): CentralLeadItem {
  const lead = mapLeadFromApi(row);
  const estimatedRevenue = num(row, "estimatedRevenue");
  return {
    dbId: lead.dbId,
    id: lead.id,
    leadId: lead.id,
    leadName: lead.leadName,
    companyName: lead.companyName,
    contactPerson: lead.contactPerson,
    mobile: lead.mobileNumber,
    mobileNumber: lead.mobileNumber,
    email: lead.email,
    preferredContactMethod: lead.preferredContactMethod,
    leadType: lead.bookingType,
    leadSource: lead.leadSource,
    inquiryDate: lead.createdDate,
    expectedEventDate: lead.eventDate,
    guestCount: lead.guestCount,
    expectedRevenue: formatInr(estimatedRevenue),
    rawRevenue: estimatedRevenue,
    assignedExecutive: lead.assignedExecutive,
    priority: lead.priority,
    status: lead.status,
    pipelineStage: lead.pipelineStage,
    customerRequirement: lead.customerRequirements,
    customerRequirements: lead.customerRequirements,
    createdDate: lead.createdDate,
    campaignId: lead.campaignId,
    campaignName: lead.campaignName,
    activityTimeline: lead.timeline?.map((t) => ({
      action: t.title,
      user: t.actor,
      date: t.date,
      notes: t.notes,
    })),
  };
}

function todayIso(): string {
  return new Date().toLocaleDateString("en-CA");
}
