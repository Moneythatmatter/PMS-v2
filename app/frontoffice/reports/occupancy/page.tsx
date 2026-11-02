import { redirect } from "next/navigation";

export default function OccupancyReportRedirect() {
  redirect("/frontoffice/reports?type=occupancy");
}
