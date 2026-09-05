import { redirect } from "next/navigation";
import { SalesMarketingBlankView } from "@/components/sales-marketing/SalesMarketingBlankView";
import { SalesMarketingDashboardView } from "@/components/sales-marketing/SalesMarketingDashboardView";
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
import { LoyaltyPointsSettingsView } from "@/components/sales-marketing/LoyaltyPointsSettingsView";
import { ActivitiesView } from "@/components/sales-marketing/ActivitiesView";
import { ReportsAnalyticsView } from "@/components/sales-marketing/ReportsAnalyticsView";
import { SalesMarketingMastersView, MasterTabKey } from "@/components/sales-marketing/masters/SalesMarketingMastersView";

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

  // Legacy / Orphan Route Protection: Redirect workqueue to active Activities page
  if (slugPath === "workqueue" || slugPath === "my-tasks") {
    redirect("/sales-marketing/crm/activities-calls");
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

  if (slugPath === "crm/activities-calls" || slugPath === "activities-calls" || slugPath === "crm/activities" || slugPath === "activities") {
    return <ActivitiesView />;
  }

  if (slugPath === "crm/accounts-contacts" || slugPath === "accounts-contacts" || slugPath === "crm/contacts" || slugPath === "contacts") {
    return <CorporateClientsView />;
  }

  if (slugPath === "banquets/bookings-enquiries" || slugPath === "bookings-enquiries" || slugPath === "banquets/bookings" || slugPath === "bookings") {
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

  if (
    slugPath === "settings" ||
    slugPath === "settings/loyalty-rules" ||
    slugPath === "loyalty-rules"
  ) {
    return <LoyaltyPointsSettingsView />;
  }

  if (
    slugPath === "reports-analytics" ||
    slugPath === "reports" ||
    slugPath === "analytics" ||
    slugPath === "reports-insights"
  ) {
    return <ReportsAnalyticsView />;
  }

  // ─────────────────────────────────────────────────────────────
  // 7 APPROVED PMS V1 MASTERS ROUTES
  // ─────────────────────────────────────────────────────────────
  if (
    slugPath === "masters" ||
    slugPath === "masters/venues-spaces" ||
    slugPath === "masters/venues-halls" ||
    slugPath === "masters/venue-hall-master"
  ) {
    return <SalesMarketingMastersView initialTab="venues-halls" />;
  }

  if (slugPath === "masters/rates-commissions" || slugPath === "masters/tariff-commission-rules") {
    return <SalesMarketingMastersView initialTab="rates-commissions" />;
  }

  if (slugPath === "masters/lead-sources") {
    return <SalesMarketingMastersView initialTab="lead-sources" />;
  }

  if (slugPath === "masters/activity-types") {
    return <SalesMarketingMastersView initialTab="activity-types" />;
  }

  if (slugPath === "masters/deal-stages") {
    return <SalesMarketingMastersView initialTab="deal-stages" />;
  }

  if (slugPath === "masters/booking-categories") {
    return <SalesMarketingMastersView initialTab="booking-categories" />;
  }

  if (slugPath === "masters/contact-types") {
    return <SalesMarketingMastersView initialTab="contact-types" />;
  }

  return <SalesMarketingBlankView slugPath={slugPath} />;
}
