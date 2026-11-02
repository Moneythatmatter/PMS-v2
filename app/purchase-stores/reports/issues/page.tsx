import { redirect } from "next/navigation";

export default function LegacyReportPage() {
  redirect("/purchase-stores/reports?type=issues");
}
