import type { ModuleNavItem } from "../types";

export const salesMarketingNavItems: ModuleNavItem[] = [
  { label: "Dashboard", href: "/sales-marketing/dashboard", icon: "layout-grid" },
  { label: "My Tasks & Queue", href: "/sales-marketing/workqueue", icon: "check-square" },
  { label: "Reports & Insights", href: "/sales-marketing/reports-analytics", icon: "bar-chart-3" },
  {
    label: "Marketing",
    href: "/sales-marketing/marketing",
    icon: "megaphone",
    children: [
      { label: "Campaigns", href: "/sales-marketing/marketing/campaigns", icon: "target" },
      { label: "Promos & Discounts", href: "/sales-marketing/marketing/promo-codes", icon: "ticket" },
      { label: "Ads Management", href: "/sales-marketing/marketing/ads", icon: "bar-chart-2" },
      { label: "OTA & Channel Performance", href: "/sales-marketing/marketing/ota-performance", icon: "globe" },
      { label: "Guest Retention & Loyalty", href: "/sales-marketing/marketing/loyalty", icon: "crown" },
    ],
  },
  {
    label: "Lead & Sales Management",
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
      { label: "Venue Availability", href: "/sales-marketing/banquets/venue-availability", icon: "calendar-clock" },
    ],
  },
  {
    label: "Masters",
    href: "/sales-marketing/masters",
    icon: "database",
    children: [
      { label: "Venues & Halls", href: "/sales-marketing/masters/venue-hall-master", icon: "landmark" },
      { label: "Rates & Commissions", href: "/sales-marketing/masters/tariff-commission-rules", icon: "receipt" },
      { label: "Targets & Incentives", href: "/sales-marketing/masters/sales-targets-incentives", icon: "award" },
    ],
  },
  {
    label: "Settings",
    href: "/sales-marketing/settings",
    icon: "settings",
    children: [
      { label: "Sales Settings", href: "/sales-marketing/masters/crm-masters", icon: "sliders" },
    ],
  },
];
