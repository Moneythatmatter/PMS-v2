"use client";

import React from "react";
import Link from "next/link";
import {
  Layers,
  AlertTriangle,
  CheckSquare,
  Repeat,
  Truck,
  Package,
  ArrowRight,
  Bed,
  Trees,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Card } from "@/components/ui";

const MASTERS_LIST = [
  {
    title: "Rooms",
    description: "Guest rooms linked from Front Office for engineering status and downtime tracking.",
    href: "/maintenance/masters/rooms",
    icon: Bed,
    badge: "Synced from FO",
    highlight: true,
  },
  {
    title: "Public Areas",
    description: "Public areas synced from Housekeeping master — update engineering status here.",
    href: "/maintenance/masters/public-areas",
    icon: Trees,
    badge: "Synced from HK",
    highlight: true,
  },
  {
    title: "Asset Categories",
    description: "Define categories for property assets, HVAC plants, electrical grids, and room machinery.",
    href: "/maintenance/masters/asset-categories",
    icon: Layers,
    badge: "System Master",
  },
  {
    title: "Problem Categories",
    description: "Standardized taxonomies for categorizing engineering issues and maintenance requests.",
    href: "/maintenance/masters/problem-categories",
    icon: AlertTriangle,
    badge: "Taxonomy",
  },
  {
    title: "Root Causes",
    description: "Library of standard technical root causes for failure classification and reporting.",
    href: "/maintenance/masters/root-causes",
    icon: CheckSquare,
    badge: "Diagnosis",
  },
  {
    title: "PM Task Templates",
    description: "Checklist templates for recurring preventive maintenance schedules and asset servicing.",
    href: "/maintenance/masters/pm-templates",
    icon: Repeat,
    badge: "Schedules",
  },
  {
    title: "Spare Parts Catalog",
    description: "Parts and materials catalog used when recording spare part usage on Work Orders.",
    href: "/maintenance/masters/spare-parts",
    icon: Package,
    badge: "Materials",
  },
  {
    title: "Vendor Master",
    description: "Independent master directory for external maintenance contractors, AMC service providers, and trade specialists.",
    href: "/maintenance/masters/vendors",
    icon: Truck,
    badge: "Maintenance Only",
  },
];

export default function MastersPage() {
  return (
    <ModulePageShell
      eyebrow="Maintenance & Engineering"
      title="Maintenance Masters"
      description="System taxonomies, room & public area locations, asset classifications, root cause libraries, PM templates, and Maintenance Vendor Master."
      breadcrumbs={[
        { label: "Maintenance", href: "/maintenance" },
        { label: "Masters" },
      ]}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MASTERS_LIST.map((master) => {
          const IconComp = master.icon;
          return (
            <Link key={master.href} href={master.href} className="group block">
              <Card
                className={`p-5 h-full transition-all duration-150 hover:shadow-md border ${
                  master.highlight
                    ? "border-emerald-300 bg-emerald-50/20 hover:border-emerald-500"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                      master.highlight
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    <IconComp className="h-5 w-5" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      master.highlight
                        ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {master.badge}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                  {master.title}
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-emerald-600" />
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {master.description}
                </p>
              </Card>
            </Link>
          );
        })}
      </div>
    </ModulePageShell>
  );
}

