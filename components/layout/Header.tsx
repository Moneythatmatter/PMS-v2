"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Menu, MessageSquare, Search, X } from "lucide-react";
import type { UserProfile } from "@/app/data/types";
import { useAuth } from "@/components/auth/AuthProvider";
import { Avatar } from "@/components/ui/Avatar";
import { usePropertyOptional } from "@/components/platform/PropertyProvider";
import { PropertySwitcher } from "@/components/platform/PropertySwitcher";
import { cn } from "@/lib/utils";
import { useMobileNav } from "./MobileNavContext";

interface HeaderProps {
  user: UserProfile;
}

export function Header({ user: fallbackUser }: HeaderProps) {
  const mobileNav = useMobileNav();
  const propertyCtx = usePropertyOptional();
  const { user: authUser, logout } = useAuth();
  const router = useRouter();
  const user = authUser
    ? {
      name: authUser.name,
      role: authUser.role,
      initials: authUser.initials,
    }
    : fallbackUser;

  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!profileOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current?.contains(event.target as Node)) return;
      setProfileOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <header className="border-b border-neutral-800 bg-black px-3 py-3 sm:px-4 lg:px-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {mobileNav?.enabled && (
            <button
              type="button"
              onClick={mobileNav.open}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-300 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-white uppercase">
              Impact <span className="text-emerald-500">PMS</span>
            </p>
            {propertyCtx?.property && (
              <p className="hidden truncate text-[10px] text-neutral-400 sm:block">
                {propertyCtx.property.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {propertyCtx && <PropertySwitcher />}
          <button
            type="button"
            onClick={() => setSearchOpen((open) => !open)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              searchOpen
                ? "bg-emerald-700 text-white"
                : "text-neutral-400 hover:bg-white/10 hover:text-white",
            )}
            aria-label={searchOpen ? "Close search" : "Open search"}
            aria-expanded={searchOpen}
          >
            {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Messages"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>
          <div
            ref={profileRef}
            className="relative ml-0.5 flex items-center gap-2 border-l border-neutral-700 pl-2 sm:gap-2.5 sm:pl-3"
          >
            <button
              type="button"
              aria-expanded={profileOpen}
              aria-haspopup="true"
              aria-label="Open profile menu"
              onClick={() => setProfileOpen((open) => !open)}
              className={cn(
                "rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                profileOpen && "ring-2 ring-emerald-500/60",
              )}
            >
              <Avatar initials={user.initials} size="sm" />
            </button>
            <div className="hidden min-w-0 md:block">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-xs text-neutral-400">{user.role}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>

            {profileOpen && (
              <div
                role="menu"
                aria-label="Profile"
                className="absolute right-10 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:right-12"
              >
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
                  {authUser?.email ? (
                    <p className="mt-0.5 truncate text-xs text-slate-500">{authUser.email}</p>
                  ) : null}
                  <p className="mt-1 text-xs font-medium text-emerald-700">{user.role}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search booking, room, etc."
            className="h-10 w-full rounded-lg border border-neutral-700 bg-neutral-900 pl-10 pr-3 text-sm text-white placeholder:text-neutral-500 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>
      )}
    </header>
  );
}
