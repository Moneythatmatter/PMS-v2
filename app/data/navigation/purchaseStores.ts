import type { ModuleNavItem } from "../types";

export const purchaseStoresNavItems: ModuleNavItem[] = [
  { label: "Dashboard", href: "/purchase-stores/dashboard", icon: "layout-grid" },
  {
    label: "Procurement",
    href: "/purchase-stores/procurement",
    icon: "shopping-bag",
    children: [
      { label: "Requisitions", href: "/purchase-stores/procurement/requisitions", icon: "file-text" },
      { label: "Direct Purchases", href: "/purchase-stores/procurement/dsp", icon: "zap" },
      { label: "Quotations", href: "/purchase-stores/procurement/rfq", icon: "file-spreadsheet" },
      { label: "Rate Contracts", href: "/purchase-stores/procurement/contracts", icon: "award" },
      { label: "Purchase Orders", href: "/purchase-stores/procurement/orders", icon: "shopping-cart" },
      { label: "Invoice Matching", href: "/purchase-stores/procurement/invoice-matching", icon: "check-circle" },
    ],
  },
  {
    label: "Receiving & Quality",
    href: "/purchase-stores/receiving",
    icon: "package-check",
    children: [
      { label: "Goods Receipt", href: "/purchase-stores/receiving/grn", icon: "clipboard-check" },
      { label: "QC Inspection", href: "/purchase-stores/receiving/inspection", icon: "shield-check" },
      { label: "Vendor Returns", href: "/purchase-stores/receiving/returns", icon: "rotate-ccw" },
    ],
  },
  {
    label: "Inventory",
    href: "/purchase-stores/inventory",
    icon: "boxes",
    children: [
      { label: "Stock Ledger", href: "/purchase-stores/inventory/ledger", icon: "layers" },
      { label: "Warehouses", href: "/purchase-stores/inventory/warehouses", icon: "building-2" },
      { label: "Batch & Expiry", href: "/purchase-stores/inventory/batch-fefo", icon: "clock" },
      { label: "Stock Issues", href: "/purchase-stores/inventory/issues", icon: "arrow-up-right" },
      { label: "Transfers", href: "/purchase-stores/inventory/transfers", icon: "arrow-right-left" },
      { label: "Scrap & Write-Offs", href: "/purchase-stores/inventory/scrap", icon: "trash-2" },
      { label: "Par Stock", href: "/purchase-stores/inventory/par-stock", icon: "sliders" },
      { label: "Gate Pass", href: "/purchase-stores/inventory/gate-pass", icon: "truck" },
    ],
  },
  {
    label: "Vendors",
    href: "/purchase-stores/vendors",
    icon: "users",
  },
  {
    label: "Approvals",
    href: "/purchase-stores/approvals",
    icon: "check-square",
  },
  {
    label: "Masters",
    href: "/purchase-stores/masters",
    icon: "database",
    children: [
      { label: "Units", href: "/purchase-stores/masters/units", icon: "ruler" },
      { label: "Categories", href: "/purchase-stores/masters/categories", icon: "layers" },
      { label: "Products", href: "/purchase-stores/masters/products", icon: "package" },
      { label: "Suppliers", href: "/purchase-stores/masters/suppliers", icon: "users" },
    ],
  },
  {
    label: "Reports",
    href: "/purchase-stores/reports",
    icon: "bar-chart",
    children: [
      { label: "Stock Register", href: "/purchase-stores/reports/stock-register", icon: "file-text" },
      { label: "Purchases", href: "/purchase-stores/reports/purchases", icon: "shopping-bag" },
      { label: "Issues", href: "/purchase-stores/reports/issues", icon: "arrow-up-right" },
      { label: "Par Stock", href: "/purchase-stores/reports/par-stock", icon: "sliders" },
      { label: "Spoilage", href: "/purchase-stores/reports/spoilage", icon: "alert-triangle" },
      { label: "Purchase Orders", href: "/purchase-stores/reports/orders", icon: "shopping-cart" },
      { label: "Returns", href: "/purchase-stores/reports/returns", icon: "rotate-ccw" },
    ],
  },
  {
    label: "Audit Logs",
    href: "/purchase-stores/audit-logs",
    icon: "history",
  },
  {
    label: "Settings",
    href: "/purchase-stores/settings",
    icon: "shield",
  },
];
