import { redirect } from "next/navigation";

export default function DepartureReportRedirect() {
  redirect("/frontoffice/reports?type=departure");
}
