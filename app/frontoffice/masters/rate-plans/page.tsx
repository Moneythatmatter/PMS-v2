import { redirect } from "next/navigation";

/** Legacy path — Rate Plans renamed to Tariff Plans */
export default function RatePlansPage() {
  redirect("/frontoffice/masters/tariff-plans");
}
