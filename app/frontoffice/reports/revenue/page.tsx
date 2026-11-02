import { redirect } from "next/navigation";

export default function RevenueReportRedirect() {
  redirect("/frontoffice/reports?type=revenue");
}
