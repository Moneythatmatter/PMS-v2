import { SalesMarketingBlankView } from "@/components/sales-marketing/SalesMarketingBlankView";
import { SalesMarketingDashboardView } from "@/components/sales-marketing/SalesMarketingDashboardView";
import { WorkqueueView } from "@/components/sales-marketing/WorkqueueView";
import { LeadsInquiriesView } from "@/components/sales-marketing/LeadsInquiriesView";
import { CorporateClientsView } from "@/components/sales-marketing/CorporateClientsView";

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

  if (slugPath === "crm/leads" || slugPath === "leads") {
    return <LeadsInquiriesView />;
  }

  if (slugPath === "crm/accounts-contacts" || slugPath === "accounts-contacts") {
    return <CorporateClientsView />;
  }

  return <SalesMarketingBlankView slugPath={slugPath} />;
}
