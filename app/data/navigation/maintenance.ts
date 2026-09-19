import type { ModuleNavItem } from "../types";

export const maintenanceNavItems: ModuleNavItem[] = [
  { label: "Dashboard", href: "/maintenance", icon: "layout-grid" },
  { label: "Requests", href: "/maintenance/requests", icon: "clipboard-list" },
  { label: "Work Orders", href: "/maintenance/work-orders", icon: "wrench" },
  { label: "Preventive Maintenance", href: "/maintenance/preventive", icon: "calendar-clock" },
  { label: "Assets & Equipment", href: "/maintenance/assets", icon: "boxes" },
  { label: "Reports", href: "/maintenance/reports", icon: "bar-chart" },
  {
    label: "Masters",
    href: "/maintenance/masters",
    icon: "database",
    children: [
      { label: "Asset Categories", href: "/maintenance/masters/asset-categories", icon: "layers" },
      { label: "Problem Categories", href: "/maintenance/masters/problem-categories", icon: "alert-triangle" },
      { label: "Root Causes", href: "/maintenance/masters/root-causes", icon: "check-square" },
      { label: "PM Task Templates", href: "/maintenance/masters/pm-templates", icon: "repeat" },
      { label: "Vendor Master", href: "/maintenance/masters/vendors", icon: "truck" },
    ],
  },
];
