import { redirect } from "next/navigation";

export default function CashierReportRedirect() {
  redirect("/frontoffice/reports?type=cashier");
}
