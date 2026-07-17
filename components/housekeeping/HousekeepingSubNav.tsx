"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Layers,
  UserCheck,
  Clock,
  ArrowRightLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

const housekeepingSubNavItems = [
  { label: "Room Cleaning", href: "/housekeeping/operations/room-cleaning", icon: Sparkles },
  { label: "Public Area", href: "/housekeeping/operations/public-cleaning", icon: Layers },
  { label: "Room Inspection", href: "/housekeeping/operations/inspection", icon: UserCheck },
  { label: "Deep Cleaning", href: "/housekeeping/operations/deep-cleaning", icon: Clock },
  { label: "Laundry Flow", href: "/housekeeping/operations/laundry", icon: ArrowRightLeft },
] as const;

export function HousekeepingSubNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Housekeeping quick navigation"
      className="flex gap-0.5 overflow-x-auto scrollbar-none sm:gap-1"
    >
      {housekeepingSubNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

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
