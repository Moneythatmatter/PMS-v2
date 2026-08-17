import type { ModuleNavItem } from "../types";

export const salesMarketingNavItems: ModuleNavItem[] = [
  { label: "Dashboard", href: "/sales-marketing/dashboard", icon: "layout-grid" },
  { label: "My Tasks & Queue", href: "/sales-marketing/workqueue", icon: "check-square" },
  { label: "Reports & Insights", href: "/sales-marketing/reports-analytics", icon: "bar-chart-3" },
  {
    label: "Sales & CRM",
    href: "/sales-marketing/crm",
    icon: "users",
    children: [
      { label: "Leads & Inquiries", href: "/sales-marketing/crm/leads", icon: "user-plus" },
      { label: "Corporate & Clients", href: "/sales-marketing/crm/accounts-contacts", icon: "building-2" },
      { label: "Deals & Pipeline", href: "/sales-marketing/crm/pipeline", icon: "git-commit" },
      { label: "Calls & Site Visits", href: "/sales-marketing/crm/activities-calls", icon: "phone-call" },
    ],
  },
  {
    label: "Banquets & Events",
    href: "/sales-marketing/banquets",
    icon: "sparkles",
    children: [
      { label: "Event Bookings", href: "/sales-marketing/banquets/bookings-enquiries", icon: "calendar-days" },
      { label: "Function Sheets (BEO)", href: "/sales-marketing/banquets/beo", icon: "file-spreadsheet" },
    ],
  },
  {
    label: "Marketing",
    href: "/sales-marketing/marketing",
    icon: "megaphone",
    children: [
      { label: "Campaigns", href: "/sales-marketing/marketing/campaigns", icon: "target" },
      { label: "Promos & Discounts", href: "/sales-marketing/marketing/promo-codes", icon: "ticket" },
    ],
  },
  {
    label: "Settings & Masters",
    href: "/sales-marketing/masters",
    icon: "settings",
    children: [
      { label: "Venues & Halls", href: "/sales-marketing/masters/venue-hall-master", icon: "landmark" },
      { label: "Sales Settings", href: "/sales-marketing/masters/crm-masters", icon: "sliders" },
      { label: "Rates & Commissions", href: "/sales-marketing/masters/tariff-commission-rules", icon: "receipt" },
      { label: "Targets & Incentives", href: "/sales-marketing/masters/sales-targets-incentives", icon: "award" },
    ],
  },
];
