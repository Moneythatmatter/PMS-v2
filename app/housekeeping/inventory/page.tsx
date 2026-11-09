import { redirect } from "next/navigation";

/** Housekeeping Inventory page removed — send bookmarks to the dashboard. */
export default function HousekeepingInventoryPage() {
  redirect("/housekeeping/dashboard");
}
