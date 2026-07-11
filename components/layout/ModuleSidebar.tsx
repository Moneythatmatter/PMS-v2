"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  CalendarCheck,
  Users,
  BookOpen,
  UserCheck,
  DoorOpen,
  BedDouble,
  UserCircle,
  FileText,
  CreditCard,
  LogOut,
  Receipt,
  ArrowRightLeft,
  CalendarPlus,
  Bed,
  Tag,
  PieChart,
  Building2,
  ChevronDown,
  ChevronLeft,
  ConciergeBell,
  X,
  Clock,
  UserPlus,
  Luggage,
  Bell,
  Sparkles,
  Wrench,
  PackageSearch,
  MessageSquare,
  Zap,
  Mail,
  History,
  Wallet,
  BarChart3,
  CalendarClock,
  TrendingUp,
} from "lucide-react";
import type { ModuleNavItem } from "@/app/data/types";
import { cn } from "@/lib/utils";
import { useMobileNav } from "./MobileNavContext";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "layout-grid": LayoutGrid,
  "calendar-check": CalendarCheck,
  users: Users,
  "book-open": BookOpen,
  "user-check": UserCheck,
  "door-open": DoorOpen,
  "bed-double": BedDouble,
  "user-circle": UserCircle,
  "file-text": FileText,
  "credit-card": CreditCard,
  "log-out": LogOut,
  receipt: Receipt,
  "arrow-right-left": ArrowRightLeft,
  "calendar-plus": CalendarPlus,
  bed: Bed,
  tag: Tag,
  "pie-chart": PieChart,
  "building-2": Building2,
  clock: Clock,
  "user-plus": UserPlus,
  luggage: Luggage,
  bell: Bell,
  sparkles: Sparkles,
  wrench: Wrench,
  "package-search": PackageSearch,
  "message-square": MessageSquare,
  zap: Zap,
  mail: Mail,
  history: History,
  wallet: Wallet,
  "bar-chart": BarChart3,
  "calendar-clock": CalendarClock,
  "trending-up": TrendingUp,
};

interface ModuleSidebarProps {
  title: string;
  subtitle?: string;
  items: ModuleNavItem[];
}

function isItemActive(pathname: string, href: string) {
  if (href === "/frontoffice/dashbaord") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isParentActive(pathname: string, item: ModuleNavItem) {
  if (isItemActive(pathname, item.href)) return true;
  return item.children?.some((child) => isItemActive(pathname, child.href)) ?? false;
}

function NavTooltip({ label, show }: { label: string; show: boolean }) {
  if (!show) return null;

  return (
    <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity group-hover/item:opacity-100 lg:block">
      {label}
    </span>
  );
}

interface SidebarNavProps {
  title: string;
  subtitle: string;
  items: ModuleNavItem[];
  pathname: string;
  isExpanded: boolean;
  showTooltips: boolean;
  expandedGroups: Record<string, boolean>;
  onToggleGroup: (label: string) => void;
  onNavigate?: () => void;
  showCollapse?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
}

function SidebarNav({
  title,
  subtitle,
  items,
  pathname,
  isExpanded,
  showTooltips,
  expandedGroups,
  onToggleGroup,
  onNavigate,
  showCollapse = false,
  collapsed = false,
  onToggleCollapse,
  onClose,
}: SidebarNavProps) {
  return (
    <>
      <div
        className={cn(
          "flex items-start gap-2 border-b border-slate-800 py-4",
          isExpanded ? "justify-between px-4" : "justify-center px-2",
        )}
      >
        {isExpanded && (
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold text-white">{title}</h2>
            <p className="truncate text-xs text-slate-400">{subtitle}</p>
          </div>
        )}
        <div className="flex items-center gap-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
            <ConciergeBell className="h-4 w-4" />
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <nav className="sidebar-scroll flex-1 overflow-x-hidden overflow-y-auto px-2 py-3">
        <ul className="min-w-0 space-y-0.5">
          {items.map((item) => {
            const Icon = iconMap[item.icon] ?? LayoutGrid;
            const hasChildren = item.children && item.children.length > 0;
            const parentActive = isParentActive(pathname, item);
            const isGroupExpanded = expandedGroups[item.label] ?? parentActive;

            if (hasChildren) {
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => onToggleGroup(item.label)}
                    className={cn(
                      "group/item relative flex w-full min-w-0 items-center rounded-lg py-2.5 text-sm font-medium transition-colors",
                      parentActive
                        ? "bg-blue-900/40 text-white"
                        : "text-slate-400 hover:bg-white/5 hover:text-white",
                      isExpanded ? "gap-2.5 px-3" : "justify-center px-2",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {isExpanded && (
                      <>
                        <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 transition-transform",
                            isGroupExpanded && "rotate-180",
                          )}
                        />
                      </>
                    )}
                    <NavTooltip label={item.label} show={showTooltips} />
                  </button>
                  {isExpanded && isGroupExpanded && item.children && (
                    <ul className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-700 pl-2">
                      {item.children.map((child) => {
                        const ChildIcon = iconMap[child.icon] ?? LayoutGrid;
                        const childActive = isItemActive(pathname, child.href);

                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={onNavigate}
                              className={cn(
                                "flex min-w-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
                                childActive
                                  ? "bg-blue-600 text-white"
                                  : "text-slate-400 hover:bg-white/5 hover:text-white",
                              )}
                            >
                              <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate" title={child.label}>{child.label}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            const active = isItemActive(pathname, item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group/item relative flex min-w-0 items-center rounded-lg py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:bg-white/5 hover:text-white",
                    isExpanded ? "gap-2.5 px-3" : "justify-center px-2",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {isExpanded && <span className="min-w-0 truncate" title={item.label}>{item.label}</span>}
                  <NavTooltip label={item.label} show={showTooltips} />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {showCollapse && onToggleCollapse && (
        <div className="hidden border-t border-slate-800 p-2 lg:block">
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "group/item relative flex w-full items-center rounded-lg py-2 text-xs text-slate-400 transition-colors hover:bg-white/5 hover:text-white",
              isExpanded ? "gap-2 px-3" : "justify-center px-2",
            )}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                collapsed && "rotate-180",
              )}
            />
            {isExpanded && (
              <span className="truncate">{collapsed ? "Expand sidebar" : "Collapse sidebar"}</span>
            )}
            <NavTooltip
              label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              show={showTooltips}
            />
          </button>
        </div>
      )}
    </>
  );
}

export function ModuleSidebar({ title, subtitle = "Module menu", items }: ModuleSidebarProps) {
  const pathname = usePathname();
  const mobileNav = useMobileNav();
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Masters: true,
    Reports: false,
  });

  const isExpanded = !collapsed || hovered;
  const showTooltips = collapsed && !hovered;

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const navProps = {
    title,
    subtitle,
    items,
    pathname,
    expandedGroups,
    onToggleGroup: (label: string) => {
      if (mobileNav?.isOpen || isExpanded) toggleGroup(label);
    },
  };

  return (
    <>
      {/* Mobile drawer */}
      {mobileNav?.isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={mobileNav.close}
            aria-label="Close menu overlay"
          />
          <aside className="sidebar-scroll relative flex h-full w-[min(100vw-3rem,16rem)] max-w-full flex-col overflow-x-hidden bg-[#0f1428] shadow-2xl">
            <SidebarNav
              {...navProps}
              isExpanded
              showTooltips={false}
              onNavigate={mobileNav.close}
              onClose={mobileNav.close}
            />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <div
        className={cn(
          "relative hidden h-screen shrink-0 overflow-x-hidden transition-all duration-200 ease-in-out lg:block",
          collapsed ? "w-16" : "w-64",
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <aside
          className={cn(
            "sidebar-scroll flex h-screen min-w-0 flex-col overflow-x-hidden border-r border-slate-800 bg-[#0f1428] transition-all duration-200 ease-in-out",
            collapsed && hovered
              ? "absolute left-0 top-0 z-50 h-screen w-64 overflow-x-hidden shadow-2xl"
              : collapsed
                ? "w-16"
                : "w-64",
          )}
        >
          <SidebarNav
            {...navProps}
            isExpanded={isExpanded}
            showTooltips={showTooltips}
            showCollapse
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((prev) => !prev)}
          />
        </aside>
      </div>
    </>
  );
}
