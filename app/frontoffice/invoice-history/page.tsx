import type { Metadata } from "next";
import { InvoiceHistoryView } from "@/components/frontoffice/ServiceViews";

export const metadata: Metadata = {
  title: "Invoice History | Hotel PMS",
  description: "Browse, preview, and download past tax invoices.",
};

export default function InvoiceHistoryPage() {
  return <InvoiceHistoryView />;
}
