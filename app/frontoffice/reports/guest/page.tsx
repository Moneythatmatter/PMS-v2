import { redirect } from "next/navigation";

export default function GuestReportRedirect() {
  redirect("/frontoffice/reports?type=guest");
}
