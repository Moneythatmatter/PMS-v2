"use client";

import { Suspense, useEffect } from "react";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { getFbPage } from "@/app/data/foodbeverages/modules";
import { FbModuleView } from "@/components/foodbeverages/FbModuleView";
import { FB_DEFAULT_REPORT, FbReportsView } from "@/components/foodbeverages/FbReportsView";

const REPORTS_PATH = "/food-beverages/reports";

/** Single Reports page; the selected report lives in `?type=`. */
function FbReportsPage() {
  const type = useSearchParams().get("type") ?? FB_DEFAULT_REPORT;
  const reportPath = `${REPORTS_PATH}/${type}`;
  const definition = getFbPage(reportPath) ?? getFbPage(`${REPORTS_PATH}/${FB_DEFAULT_REPORT}`);
  if (!definition) notFound();
  return <FbReportsView key={type} definition={definition} path={reportPath} />;
}

/** Old per-report URLs (`/food-beverages/reports/gst`) now open the single page. */
function LegacyReportRedirect({ type }: { type: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(`${REPORTS_PATH}?type=${type}`);
  }, [router, type]);
  return null;
}

export function FbCatchAllClient({ path }: { path: string }) {
  if (path === REPORTS_PATH) {
    return (
      <Suspense fallback={null}>
        <FbReportsPage />
      </Suspense>
    );
  }

  if (path.startsWith(`${REPORTS_PATH}/`)) {
    return <LegacyReportRedirect type={path.slice(REPORTS_PATH.length + 1)} />;
  }

  const definition = getFbPage(path);

  if (!definition) {
    notFound();
  }

  return <FbModuleView definition={definition} path={path} />;
}
