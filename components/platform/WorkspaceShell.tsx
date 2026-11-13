"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useEffect, useState } from "react";
import {
  BarChart3,
  Building2,
  ConciergeBell,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { usePropertyOptional } from "@/components/platform/PropertyProvider";
import { isPlatformAdmin } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const WorkspaceActionSlotContext = createContext<HTMLDivElement | null>(null);

type WorkspaceNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  pageKey: string;
};

const navItems: WorkspaceNavItem[] = [
  { href: "/properties/dashboard", label: "Dashboard", icon: LayoutDashboard, pageKey: "workspace.dashboard" },
  { href: "/properties/reports", label: "Reports", icon: BarChart3, pageKey: "workspace.reports" },
  { href: "/properties", label: "Properties", icon: Building2, pageKey: "workspace.properties" },
  {
    href: "/properties/roles",
    label: "Roles",
    icon: Shield,
    pageKey: "workspace.roles",
  },
  {
    href: "/properties/users",
    label: "User management",
    icon: Users,
    pageKey: "workspace.user_management",
  },
];

function WorkspaceSidebar({
  pathname,
  user,
  canReadPage,
  onNavigate,
  onLogout,
  className,
  collapsed = false,
}: {
  pathname: string | null;
  user: ReturnType<typeof useAuth>["user"];
  canReadPage: (pageKey: string) => boolean;
  onNavigate?: () => void;
  onLogout: () => void;
  className?: string;
  collapsed?: boolean;
}) {
  return (
    <aside className={cn("flex flex-col bg-black", className)}>
      <div className={cn("border-b border-slate-800 py-4", collapsed ? "px-2" : "px-4")}>
        <div className={cn("flex items-center gap-2", collapsed && "flex-col")}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-700/20 text-emerald-500">
            <ConciergeBell className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold uppercase tracking-tight text-white">
                Impact <span className="text-emerald-500">PMS</span>
              </p>
              <p className="truncate text-[10px] font-medium uppercase tracking-widest text-slate-500">
                Workspace
              </p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {navItems.map((item) => {
          const allowed =
            item.pageKey === "workspace.properties" ||
            canReadPage(item.pageKey) ||
            ((item.pageKey === "workspace.user_management" || item.pageKey === "workspace.roles") &&
              isPlatformAdmin(user));
          if (!allowed) return null;
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href === "/properties/reports" && (pathname?.startsWith("/properties/reports/") ?? false));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              aria-label={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg py-2.5 text-sm font-medium transition-colors",
                collapsed ? "justify-center px-0" : "px-3",
                active
                  ? "bg-emerald-950/70 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active && "text-emerald-400")} />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      <div className={cn("border-t border-slate-800", collapsed ? "p-2" : "p-3")}>
        <div
          className={cn("mb-2 flex items-center gap-2 rounded-lg py-2", collapsed ? "justify-center px-0" : "px-2")}
          title={collapsed ? `${user?.name ?? ""} · ${user?.role ?? ""}` : undefined}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white">
            {user?.initials ?? "U"}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{user?.name}</p>
              <p className="truncate text-xs text-slate-500">{user?.role}</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onLogout}
          title={collapsed ? "Sign out" : undefined}
          aria-label="Sign out"
          className={cn(
            "flex w-full items-center gap-2 rounded-lg py-2 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white",
            collapsed ? "justify-center px-0" : "px-2",
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </aside>
  );
}

export function WorkspaceShell({
  children,
  title,
  description,
  actions,
  wide = false,
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  wide?: boolean;
}) {
  const containerWidth = wide ? "max-w-[1536px]" : "max-w-5xl";
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const propertyCtx = usePropertyOptional();
  const canReadPage = (pageKey: string) => propertyCtx?.canRead(pageKey) ?? isPlatformAdmin(user);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [navPath, setNavPath] = useState(pathname);
  const [actionSlot, setActionSlot] = useState<HTMLDivElement | null>(null);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  if (pathname !== navPath) {
    setNavPath(pathname);
    setMobileNavOpen(false);
  }

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <WorkspaceActionSlotContext.Provider value={actionSlot}>
    <div className="group/shell flex h-dvh min-w-0 overflow-hidden bg-[#f7f8f7]" data-workspace-sidebar="">
      {/* Desktop — collapsed rail; hover expands as an overlapping panel */}
      <div
        className="relative z-[55] hidden h-full w-16 shrink-0 lg:block"
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
      >
        <WorkspaceSidebar
          pathname={pathname}
          user={user}
          canReadPage={canReadPage}
          onLogout={handleLogout}
          collapsed
          className="h-full w-16 border-r border-slate-800"
        />
        <WorkspaceSidebar
          pathname={pathname}
          user={user}
          canReadPage={canReadPage}
          onLogout={handleLogout}
          onNavigate={() => setSidebarHovered(false)}
          className={cn(
            "absolute left-0 top-0 z-50 h-full w-64 border-r border-slate-800 shadow-2xl transition-[opacity,transform] duration-200 ease-out",
            sidebarHovered ? "pointer-events-auto translate-x-0 opacity-100" : "pointer-events-none -translate-x-1 opacity-0",
          )}
        />
      </div>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close menu overlay"
          />
          <WorkspaceSidebar
            pathname={pathname}
            user={user}
            canReadPage={canReadPage}
            onNavigate={() => setMobileNavOpen(false)}
            onLogout={handleLogout}
            className="relative h-full w-[min(100vw-3rem,16rem)] max-w-full shadow-2xl"
          />
        </div>
      )}

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="z-40 flex shrink-0 items-center gap-3 border-b border-slate-800 bg-black px-3 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold uppercase tracking-tight text-white">
              Impact <span className="text-emerald-500">PMS</span>
            </p>
            <p className="truncate text-[10px] font-medium uppercase tracking-widest text-slate-500">
              Workspace
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          {(title || actions) && (
            <div className="border-b border-slate-200/80 bg-white px-4 py-3 sm:px-6 lg:px-8">
              <div
                className={cn(
                  "mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6",
                  containerWidth,
                )}
              >
                <div className="min-w-0 flex-1">
                  {title && (
                    <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                      {title}
                    </h1>
                  )}
                  {description && (
                    <p className="mt-0.5 truncate text-xs text-slate-500 sm:text-sm">
                      {description}
                    </p>
                  )}
                </div>
                <div ref={setActionSlot} className="flex w-full shrink-0 flex-row gap-2 empty:hidden sm:w-auto">
                  {actions}
                </div>
              </div>
            </div>
          )}
          <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
            <div className={cn("mx-auto min-w-0", containerWidth)}>{children}</div>
          </div>
        </main>
      </div>
    </div>
    </WorkspaceActionSlotContext.Provider>
  );
}
