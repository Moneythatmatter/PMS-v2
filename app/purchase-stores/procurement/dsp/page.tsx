import { redirect } from "next/navigation";

export default function LegacyDirectPurchasesPage() {
  redirect("/purchase-stores/procurement/orders?new=1");
}
