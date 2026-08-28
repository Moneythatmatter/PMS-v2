"use client";

import { redirect } from "next/navigation";

export default function ScrapRedirectPage() {
  redirect("/purchase-stores/inventory/adjustments");
}
