import { HotelLeadItem, LeadType, LeadSource, LeadPriority, LeadStatus, PipelineStage, ActivityTimelineItem } from "@/components/sales-marketing/LeadsInquiriesView";

export interface CentralLeadItem extends HotelLeadItem {
  campaignId?: string | null;
  campaignName?: string | null;
  externalPlatform?: "Google Ads" | "Meta Ads" | "Other" | null;
  externalCampaignId?: string | null;
  externalAdLeadId?: string | null;
}

export const INITIAL_CENTRAL_LEADS: CentralLeadItem[] = [];
