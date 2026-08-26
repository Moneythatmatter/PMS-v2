import { SalesMarketingBlankView } from "@/components/sales-marketing/SalesMarketingBlankView";
import { SalesMarketingDashboardView } from "@/components/sales-marketing/SalesMarketingDashboardView";
import { WorkqueueView } from "@/components/sales-marketing/WorkqueueView";
import { LeadsInquiriesView } from "@/components/sales-marketing/LeadsInquiriesView";
import { CorporateClientsView } from "@/components/sales-marketing/CorporateClientsView";
import { EventBookingsView } from "@/components/sales-marketing/EventBookingsView";
import { FunctionSheetsBEOView } from "@/components/sales-marketing/FunctionSheetsBEOView";
import { VenueAvailabilityView } from "@/components/sales-marketing/VenueAvailabilityView";
import { OtaChannelPerformanceView } from "@/components/sales-marketing/OtaChannelPerformanceView";
import { GuestRetentionLoyaltyView } from "@/components/sales-marketing/GuestRetentionLoyaltyView";
import { PromosDiscountsView } from "@/components/sales-marketing/PromosDiscountsView";
import { CampaignsView } from "@/components/sales-marketing/CampaignsView";
import { DealsPipelineView } from "@/components/sales-marketing/DealsPipelineView";

export default async function SalesMarketingPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const resolvedParams = await params;
  const slugArray = resolvedParams.slug || [];
  const slugPath = slugArray.join("/");

  if (!slugPath || slugPath === "dashboard") {
    return <SalesMarketingDashboardView />;
  }

  if (slugPath === "workqueue" || slugPath === "my-tasks") {
    return <WorkqueueView />;
  }

  if (slugPath === "marketing/campaigns" || slugPath === "campaigns") {
    return <CampaignsView />;
  }

  if (slugPath === "crm/leads" || slugPath === "leads") {
    return <LeadsInquiriesView />;
  }

  if (slugPath === "crm/pipeline" || slugPath === "pipeline" || slugPath === "deals" || slugPath === "crm/deals") {
    return <DealsPipelineView />;
  }

  if (slugPath === "crm/accounts-contacts" || slugPath === "accounts-contacts") {
    return <CorporateClientsView />;
  }

  if (slugPath === "banquets/bookings-enquiries" || slugPath === "bookings-enquiries") {
    return <EventBookingsView />;
  }

  if (slugPath === "banquets/beo" || slugPath === "beo") {
    return <FunctionSheetsBEOView />;
  }

  if (slugPath === "banquets/venue-availability" || slugPath === "venue-availability") {
    return <VenueAvailabilityView />;
  }

  if (slugPath === "marketing/ota-performance" || slugPath === "ota-performance") {
    return <OtaChannelPerformanceView />;
  }

  if (slugPath === "marketing/loyalty" || slugPath === "guest-retention-loyalty") {
    return <GuestRetentionLoyaltyView />;
  }

  if (slugPath === "marketing/promo-codes" || slugPath === "promos-discounts") {
    return <PromosDiscountsView />;
  }

  return <SalesMarketingBlankView slugPath={slugPath} />;
}
