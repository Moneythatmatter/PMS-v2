"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2, ConciergeBell, LogOut, Menu, Users } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { isPlatformAdmin } from "@/lib/auth";
import { cn } from "@/lib/utils";

type WorkspaceNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const navItems: WorkspaceNavItem[] = [
  { href: "/properties", label: "Properties", icon: Building2 },
  { href: "/properties/users", label: "User management", icon: Users, adminOnly: true },
];

function WorkspaceSidebar({
  pathname,
  user,
  onNavigate,
  onLogout,
  className,
}: {
  pathname: string | null;
  user: ReturnType<typeof useAuth>["user"];
  onNavigate?: () => void;
  onLogout: () => void;
  className?: string;
}) {
  return (
    <aside className={cn("flex flex-col bg-black", className)}>
      <div className="border-b border-slate-800 px-4 py-4">
        <div className="flex items-start gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-700/20 text-emerald-500">
            <ConciergeBell className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold uppercase tracking-tight text-white">
              Impact <span className="text-emerald-500">PMS</span>
            </p>
            <p className="truncate text-[10px] font-medium uppercase tracking-widest text-slate-500">
              Workspace
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {navItems.map((item) => {
          if (item.adminOnly && !isPlatformAdmin(user)) return null;
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/properties" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-emerald-950/70 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active && "text-emerald-400")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <div className="mb-2 flex items-center gap-2 rounded-lg px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white">
            {user?.initials ?? "U"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-xs text-slate-500">{user?.role}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
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
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

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
    <div className="flex min-h-screen min-w-0 bg-[#f7f8f7]">
      {/* Desktop sidebar */}
      <WorkspaceSidebar
        pathname={pathname}
        user={user}
        onLogout={handleLogout}
        className="hidden w-64 shrink-0 border-r border-slate-800 lg:flex"
      />

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
            onNavigate={() => setMobileNavOpen(false)}
            onLogout={handleLogout}
            className="relative h-full w-[min(100vw-3rem,16rem)] max-w-full shadow-2xl"
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-slate-800 bg-black px-3 py-3 lg:hidden">
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

        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          {(title || actions) && (
            <div className="border-b border-slate-200/80 bg-white px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
              <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                <div className="min-w-0">
                  {title && (
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
                      {title}
                    </h1>
                  )}
                  {description && (
                    <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-500 sm:mt-2">
                      {description}
                    </p>
                  )}
                </div>
                {actions && (
                  <div className="flex w-full shrink-0 flex-row flex-wrap gap-2 sm:w-auto">
                    {actions}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
            <div className="mx-auto max-w-5xl min-w-0">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
