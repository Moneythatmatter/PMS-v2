"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarPlus,
  List,
  LogIn,
  Zap,
  Clock,
  LogOut,
} from "lucide-react";
import { reservationNavItems } from "@/app/data/navigation/reservation";
import { cn } from "@/lib/utils";

const iconMap = {
  "calendar-plus": CalendarPlus,
  list: List,
  "log-in": LogIn,
  zap: Zap,
  clock: Clock,
  "log-out": LogOut,
};

function isNavActive(pathname: string, href: string) {
  if (pathname === href) return true;

  if (href === "/frontoffice/reservation/all-bookings") {
    return (
      pathname === "/frontoffice/reservation" ||
      pathname.startsWith("/frontoffice/reservation/all-bookings")
    );
  }

  if (href === "/frontoffice/reservation/new") {
    return pathname.startsWith("/frontoffice/reservation/new");
  }

  if (href === "/frontoffice/reservation/walk-in") {
    return pathname.startsWith("/frontoffice/reservation/walk-in");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function FrontOfficeSubNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Front office quick navigation"
      className="flex gap-0.5 overflow-x-auto scrollbar-none sm:gap-1"
    >
      {reservationNavItems.map((item) => {
        const Icon = iconMap[item.icon];
        const isActive = isNavActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors sm:px-4",
              isActive
                ? "border-blue-600 text-blue-600"
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

/** @deprecated Use FrontOfficeSubNav */
export const ReservationSubNav = FrontOfficeSubNav;
