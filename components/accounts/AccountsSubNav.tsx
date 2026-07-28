"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Receipt,
  Wallet,
  Scale,
  TrendingUp,
  FileText,
  BookOpen,
  CalendarClock,
  LogOut,
} from "lucide-react";
import { accountsShortcutItems } from "@/app/data/navigation/accounts";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  receipt: Receipt,
  wallet: Wallet,
  scale: Scale,
  "trending-up": TrendingUp,
  "file-text": FileText,
  "book-open": BookOpen,
  "calendar-clock": CalendarClock,
  "log-out": LogOut,
};

export function AccountsSubNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Accounts shortcuts navigation"
      className="flex gap-0.5 overflow-x-auto scrollbar-none sm:gap-1"
    >
      {accountsShortcutItems.map((item) => {
        const Icon = iconMap[item.icon] ?? FileText;
        const isActive = item.href !== "/dasbboard" && (pathname === item.href || pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href + item.label}
            href={item.href}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs sm:text-sm font-medium transition-colors sm:px-4",
              isActive
                ? "border-emerald-700 text-emerald-700 font-semibold"
                : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900",
              item.icon === "log-out" && "hover:text-red-600"
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
