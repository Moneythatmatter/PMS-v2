"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  ShoppingCart,
  Award,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function PurchaseStoresMobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/purchase-stores/dashboard", icon: LayoutGrid },
    { label: "Purchases", href: "/purchase-stores/procurement/requisitions", icon: ShoppingCart },
    { label: "Contracts", href: "/purchase-stores/procurement/contracts", icon: Award },
    { label: "Reports", href: "/purchase-stores/reports", icon: BarChart3 },
    { label: "Settings", href: "/purchase-stores/settings", icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1.5 flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== "/purchase-stores/dashboard" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-[56px]",
              isActive
                ? "text-emerald-700 font-bold bg-emerald-50"
                : "text-slate-500 hover:text-slate-800 font-medium"
            )}
          >
            <Icon className={cn("h-5 w-5", isActive ? "text-emerald-600 shrink-0" : "text-slate-400 shrink-0")} />
            <span className="text-[10px] leading-tight tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
