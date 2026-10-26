"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProperty } from "@/components/platform/PropertyProvider";
import { PropertyPortfolioDashboard, REPORTS, type ReportId } from "@/components/platform/PropertyPortfolioDashboard";
import { WorkspaceShell } from "@/components/platform/WorkspaceShell";
import { platformService, type PortfolioProperty, type PropertyDto } from "@/services/platform";

export function PropertyPortfolioPage({
  mode,
  report = "occupancy",
}: {
  mode: "dashboard" | "reports";
  report?: ReportId;
}) {
  const router = useRouter();
  const { setProperty } = useProperty();
  const [properties, setProperties] = useState<PropertyDto[]>([]);

  useEffect(() => {
    let cancelled = false;
    platformService
      .listProperties()
      .then((rows) => {
        if (!cancelled) setProperties(rows);
      })
      .catch(() => {
        if (!cancelled) setProperties([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rememberProperty = (property: PortfolioProperty) => {
    const full = properties.find((row) => row.id === property.id);
    setProperty({
      id: property.id,
      name: property.name,
      code: property.code,
      city: property.city,
      timezone: full?.timezone ?? "",
      isDefault: full?.isDefault ?? false,
    });
  };

  const openProperty = (property: PortfolioProperty) => {
    rememberProperty(property);
    router.push("/dashboard");
  };

  const openAt = (property: PortfolioProperty, href: string) => {
    rememberProperty(property);
    router.push(href);
  };

  return (
    <WorkspaceShell
      wide={mode === "reports"}
      title={mode === "dashboard" ? "Dashboard" : (REPORTS.find((item) => item.id === report)?.label ?? "Reports")}
      description={
        mode === "dashboard"
          ? "Revenue, occupancy, recorded expenses, and property comparison for the selected period."
          : REPORTS.find((item) => item.id === report)?.hint ?? "Property reports"
      }
    >
      <PropertyPortfolioDashboard mode={mode} report={report} onOpen={openProperty} onOpenAt={openAt} />
    </WorkspaceShell>
  );
}
