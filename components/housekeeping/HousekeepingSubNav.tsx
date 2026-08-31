"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BedDouble,
  Sparkles,
  Layers,
  UserCheck,
  Bell,
  Wrench,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const housekeepingSubNavItems = [
  { label: "Room Status", href: "/housekeeping/operations/rooms", icon: BedDouble },
  { label: "Room Cleaning", href: "/housekeeping/operations/room-cleaning", icon: Sparkles },
  { label: "Public Area", href: "/housekeeping/operations/public-cleaning", icon: Layers },
  { label: "Cleaning Inspection", href: "/housekeeping/operations/inspection", icon: UserCheck },
  { label: "Guest Requests", href: "/housekeeping/housekeeping-requests", icon: Bell },
  { label: "Maintenance", href: "/housekeeping/maintenance-requests", icon: Wrench },
  { label: "Damage Reports", href: "/housekeeping/operations/damage-reports", icon: AlertTriangle },
] as const;

export function HousekeepingSubNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Housekeeping quick navigation"
      className="flex items-center gap-0.5 overflow-x-auto scrollbar-none border-b border-slate-200 select-none bg-white sm:gap-1"
    >
      {housekeepingSubNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2.5 text-xs font-semibold transition-colors sm:gap-1.5 sm:px-3.5 -mb-px",
              isActive
                ? "border-emerald-700 text-emerald-750 font-extrabold"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="max-w-[7.5rem] truncate sm:max-w-none">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
