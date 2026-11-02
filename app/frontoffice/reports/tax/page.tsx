import { redirect } from "next/navigation";

export default function TaxReportRedirect() {
  redirect("/frontoffice/reports?type=tax");
}
