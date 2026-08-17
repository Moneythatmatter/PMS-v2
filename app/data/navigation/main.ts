import type { NavItem } from "../types";

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "layout-dashboard" },
  { label: "Front Office", href: "/frontoffice/dashboard", icon: "concierge-bell" },
  { label: "Food & Beverages", href: "/food-beverages", icon: "utensils" },
  { label: "Housekeeping", href: "/housekeeping", icon: "sparkles" },
  { label: "Purchase & Stores", href: "/purchase-stores", icon: "package" },
  { label: "Human Resource", href: "/human-resources/dashboard", icon: "users" },
  { label: "Accounts", href: "/accounts", icon: "calculator" },
  { label: "System Settings", href: "/system-settings/dashboard", icon: "settings" },
  { label: "Sales & Marketing", href: "#", icon: "trending-up" },
  { label: "Maintenance", href: "#", icon: "wrench" },
];
