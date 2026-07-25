"use client";

import { notFound } from "next/navigation";
import { getFbPage } from "@/app/data/foodbeverages/modules";
import { FbModuleView } from "@/components/foodbeverages/FbModuleView";

export function FbCatchAllClient({ path }: { path: string }) {
  const definition = getFbPage(path);

  if (!definition) {
    notFound();
  }

  return <FbModuleView definition={definition} path={path} />;
}
