"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarCheck,
  CalendarClock,
  ChefHat,
  ClipboardList,
  History,
  LayoutGrid,
  Receipt,
  Wallet,
} from "lucide-react";
import { fbQuickNavItems } from "@/app/data/navigation/foodbeverages";
import { cn } from "@/lib/utils";

const iconMap = {
  "layout-grid": LayoutGrid,
  "clipboard-list": ClipboardList,
  "chef-hat": ChefHat,
  bell: Bell,
  "calendar-check": CalendarCheck,
  receipt: Receipt,
  history: History,
  wallet: Wallet,
  "calendar-clock": CalendarClock,
};

/** Cashier must not light up on Cashier Approvals (/cashier/history). */
function isNavActive(pathname: string, href: string) {
  if (href === "/food-beverages/restaurants/cashier") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function FoodBeveragesSubNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Food & beverages quick navigation"
      className="flex gap-0.5 overflow-x-auto scrollbar-none sm:gap-1"
    >
      {fbQuickNavItems.map((item) => {
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
