import { redirect } from "next/navigation";

export default function HousekeepingHistoryRedirectPage() {
  redirect("/system-settings/audit-logs");
}
