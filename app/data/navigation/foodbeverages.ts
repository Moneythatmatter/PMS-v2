import type { ModuleNavItem } from "../types";

/** Top quick-nav strip across F&B pages (daily-use screens only). */
export const fbQuickNavItems = [
  { label: "Dashboard", href: "/food-beverages/dashboard", icon: "layout-grid" },
  { label: "Orders", href: "/food-beverages/restaurants/orders", icon: "clipboard-list" },
  { label: "Kitchen", href: "/food-beverages/kitchen/orders", icon: "chef-hat" },
  { label: "Guest Requests", href: "/food-beverages/restaurants/guest-requests", icon: "bell" },
  { label: "Reservations", href: "/food-beverages/restaurants/reservations", icon: "calendar-check" },
  { label: "Bills", href: "/food-beverages/restaurants/bills", icon: "receipt" },
  { label: "All Orders", href: "/food-beverages/restaurants/all-orders", icon: "history" },
  { label: "Cashier", href: "/food-beverages/restaurants/cashier", icon: "wallet" },
  { label: "Day Close", href: "/food-beverages/restaurants/day-close", icon: "calendar-clock" },
] as const;

export const foodBeveragesNavItems: ModuleNavItem[] = [
  { label: "Dashboard", href: "/food-beverages/dashboard", icon: "layout-grid" },
  {
    label: "Restaurants",
    href: "/food-beverages/restaurants",
    icon: "utensils",
    children: [
      { label: "Outlets", href: "/food-beverages/restaurants/outlets", icon: "building-2" },
      { label: "Tables", href: "/food-beverages/restaurants/tables", icon: "layout-grid" },
      { label: "Reservations", href: "/food-beverages/restaurants/reservations", icon: "calendar-check" },
      { label: "Guest Order Requests", href: "/food-beverages/restaurants/guest-requests", icon: "bell" },
      { label: "Orders", href: "/food-beverages/restaurants/orders", icon: "clipboard-list" },
      { label: "All Orders", href: "/food-beverages/restaurants/all-orders", icon: "history" },
      { label: "Bills", href: "/food-beverages/restaurants/bills", icon: "receipt" },
      { label: "Kitchen", href: "/food-beverages/kitchen/orders", icon: "chef-hat" },
      { label: "Cashier", href: "/food-beverages/restaurants/cashier", icon: "wallet" },
      { label: "Cashier Approvals", href: "/food-beverages/restaurants/cashier/history", icon: "history" },
      { label: "Day Close", href: "/food-beverages/restaurants/day-close", icon: "calendar-clock" },
    ],
  },
  {
    label: "Masters",
    href: "/food-beverages/masters",
    icon: "database",
    children: [
      { label: "Units", href: "/food-beverages/masters/units", icon: "ruler" },
      { label: "Outlet Types", href: "/food-beverages/masters/outlet-types", icon: "building-2" },
      { label: "Staff", href: "/food-beverages/masters/staff", icon: "users" },
    ],
  },
  {
    label: "Menu",
    href: "/food-beverages/menu",
    icon: "book-open",
    children: [
      { label: "Categories", href: "/food-beverages/menu/categories", icon: "tag" },
      { label: "Items", href: "/food-beverages/menu/items", icon: "utensils" },
      { label: "Modifiers", href: "/food-beverages/menu/modifiers", icon: "plus-circle" },
      { label: "Recipes", href: "/food-beverages/menu/recipes", icon: "file-text" },
      { label: "Conversion Items", href: "/food-beverages/menu/conversion-items", icon: "repeat" },
    ],
  },
  {
    label: "Inventory",
    href: "/food-beverages/inventory",
    icon: "package-search",
    children: [
      { label: "Ingredients", href: "/food-beverages/inventory/ingredients", icon: "utensils" },
      { label: "Conversion Stock", href: "/food-beverages/inventory/conversion", icon: "package" },
      { label: "Wastage", href: "/food-beverages/inventory/wastage", icon: "alert-triangle" },
      { label: "Adjustments", href: "/food-beverages/inventory/adjustments", icon: "percent" },
    ],
  },
  { label: "Requisitions", href: "/food-beverages/requisitions", icon: "clipboard-list" },
  {
    label: "Reports",
    href: "/food-beverages/reports",
    icon: "bar-chart",
  },
];
