"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PropertyPortfolioPage } from "@/components/platform/PropertyPortfolioPage";
import { REPORT_IDS, type ReportId } from "@/components/platform/PropertyPortfolioDashboard";

export default function PropertyReportTypePage() {
  const params = useParams<{ type: string }>();
  const router = useRouter();
  const type = String(params.type ?? "occupancy");
  const valid = REPORT_IDS.includes(type as ReportId);

  useEffect(() => {
    if (!valid) router.replace("/properties/reports/occupancy");
  }, [router, valid]);

  if (!valid) return null;
  return <PropertyPortfolioPage mode="reports" report={type as ReportId} />;
}
