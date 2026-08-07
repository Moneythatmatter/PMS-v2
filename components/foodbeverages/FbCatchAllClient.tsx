"use client";

import { notFound } from "next/navigation";
import { getFbPage } from "@/app/data/foodbeverages/modules";
import { FbModuleView } from "@/components/foodbeverages/FbModuleView";
import { FbReportsView } from "@/components/foodbeverages/FbReportsView";

export function FbCatchAllClient({ path }: { path: string }) {
  const definition = getFbPage(path);

  if (!definition) {
    notFound();
  }

  if (path.includes("/food-beverages/reports/")) {
    return <FbReportsView definition={definition} path={path} />;
  }

  return <FbModuleView definition={definition} path={path} />;
}
