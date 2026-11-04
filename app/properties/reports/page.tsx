"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PropertyPortfolioPage } from "@/components/platform/PropertyPortfolioPage";
import { REPORT_IDS, type ReportId } from "@/components/platform/PropertyPortfolioDashboard";

function PropertyReports() {
  const type = useSearchParams().get("type") ?? "";
  const report: ReportId = REPORT_IDS.includes(type as ReportId) ? (type as ReportId) : "occupancy";
  return <PropertyPortfolioPage mode="reports" report={report} />;
}

export default function PropertiesReportsPage() {
  return (
    <Suspense fallback={null}>
      <PropertyReports />
    </Suspense>
  );
}
