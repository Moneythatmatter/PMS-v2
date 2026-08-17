import { SalesMarketingBlankView } from "@/components/sales-marketing/SalesMarketingBlankView";

export default async function SalesMarketingPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const resolvedParams = await params;
  const slugArray = resolvedParams.slug || [];
  const slugPath = slugArray.join("/");

  return <SalesMarketingBlankView slugPath={slugPath || "dashboard"} />;
}
