import { redirect } from "next/navigation";

export default function ArrivalReportRedirect() {
  redirect("/frontoffice/reports?type=arrival");
}
