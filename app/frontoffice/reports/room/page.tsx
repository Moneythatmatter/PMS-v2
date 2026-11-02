import { redirect } from "next/navigation";

export default function RoomReportRedirect() {
  redirect("/frontoffice/reports?type=room");
}
