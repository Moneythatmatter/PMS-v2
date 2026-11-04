"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  BarChart3,
  ClipboardCheck,
  FileSpreadsheet,
  FileText,
  Layers,
  LayoutGrid,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import { purchaseStoresQuickNavItems } from "@/app/data/navigation/purchaseStores";
import { cn } from "@/lib/utils";

const iconMap = {
  "layout-grid": LayoutGrid,
  "file-text": FileText,
  "file-spreadsheet": FileSpreadsheet,
  "shopping-cart": ShoppingCart,
  wallet: Wallet,
  "clipboard-check": ClipboardCheck,
  layers: Layers,
  "arrow-up-right": ArrowUpRight,
  "bar-chart": BarChart3,
};

function isNavActive(pathname: string, href: string) {
  if (href === "/purchase-stores/dashboard") {
    return pathname === "/purchase-stores" || pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PurchaseStoresSubNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Purchase & stores quick navigation"
      className="flex gap-0.5 overflow-x-auto scrollbar-none sm:gap-1"
    >
      {purchaseStoresQuickNavItems.map((item) => {
        const Icon = iconMap[item.icon];
        const isActive = isNavActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors sm:px-4",
              isActive
                ? "border-emerald-700 text-emerald-700"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
