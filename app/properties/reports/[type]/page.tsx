import { redirect } from "next/navigation";

export default async function LegacyPropertyReportPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  redirect(`/properties/reports?type=${encodeURIComponent(type)}`);
}
