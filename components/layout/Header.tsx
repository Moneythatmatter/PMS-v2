"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Menu, MessageSquare, Search, X } from "lucide-react";
import type { UserProfile } from "@/app/data/types";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { useMobileNav } from "./MobileNavContext";

interface HeaderProps {
  user: UserProfile;
}

export function Header({ user }: HeaderProps) {
  const mobileNav = useMobileNav();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  return (
    <header className="border-b border-slate-800 bg-slate-900 px-3 py-3 sm:px-4 lg:px-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {mobileNav?.enabled && (
            <button
              type="button"
              onClick={mobileNav.open}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen((open) => !open)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
              searchOpen
                ? "bg-white/15 text-white"
                : "text-slate-400 hover:bg-white/10 hover:text-white",
            )}
            aria-label={searchOpen ? "Close search" : "Open search"}
            aria-expanded={searchOpen}
          >
            {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Messages"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>
          <div className="ml-0.5 flex items-center gap-2 border-l border-slate-700 pl-2 sm:gap-2.5 sm:pl-3">
            <Avatar initials={user.initials} size="sm" />
            <div className="hidden min-w-0 md:block">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-xs text-slate-400">{user.role}</p>
            </div>
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search booking, room, etc."
            className="h-10 w-full rounded-lg border border-slate-700 bg-slate-800 pl-10 pr-3 text-sm text-white placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>
      )}
    </header>
  );
}
