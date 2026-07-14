import { redirect } from "next/navigation";
import { fbDefaultRedirect } from "@/app/data/foodbeverages/modules";

export default function FoodBeveragesPage() {
  redirect(fbDefaultRedirect);
}
