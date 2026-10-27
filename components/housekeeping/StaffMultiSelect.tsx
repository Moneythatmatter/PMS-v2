"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HrHousekeeper } from "./useHrHousekeepers";

const AVATAR_COLORS = [
  "bg-emerald-100 text-emerald-800",
  "bg-sky-100 text-sky-800",
  "bg-violet-100 text-violet-800",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
  "bg-teal-100 text-teal-800",
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function avatarColor(id: string) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function StaffAvatar({
  id,
  name,
  size = "sm",
}: {
  id: string;
  name: string;
  size?: "xs" | "sm";
}) {
  return (
    <span
      title={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold ring-2 ring-white",
        size === "xs" ? "h-5 w-5 text-[8px]" : "h-6 w-6 text-[9px]",
        avatarColor(id || name),
      )}
    >
      {initials(name)}
    </span>
  );
}

/** Overlapping avatars + names, for cards and read-only views. */
export function StaffAvatarStack({
  names,
  max = 3,
  emptyLabel = "Unassigned",
}: {
  names: string[];
  max?: number;
  emptyLabel?: string;
}) {
  if (!names.length) {
    return <span className="text-slate-400">{emptyLabel}</span>;
  }
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5" title={names.join(", ")}>
      <span className="flex -space-x-1.5">
        {shown.map((n) => (
          <StaffAvatar key={n} id={n} name={n} size="xs" />
        ))}
        {extra > 0 && (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[8px] font-bold text-slate-600 ring-2 ring-white">
            +{extra}
          </span>
        )}
      </span>
      <span className="truncate font-semibold text-slate-700">
        {names.length === 1 ? names[0] : `${names.length} staff`}
      </span>
    </span>
  );
}

export type StaffMultiSelectProps = {
  staff: HrHousekeeper[];
  value: string[];
  onChange: (ids: string[]) => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

export function StaffMultiSelect({
  staff,
  value,
  onChange,
  loading = false,
  disabled = false,
  placeholder = "Select staff…",
}: StaffMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const selected = useMemo(
    () =>
      value
        .map((id) => staff.find((s) => s.id === id))
        .filter((s): s is HrHousekeeper => Boolean(s)),
    [value, staff],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? staff.filter((s) => s.name.toLowerCase().includes(q)) : staff;
  }, [staff, query]);

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  const isDisabled = disabled || loading || staff.length === 0;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex min-h-[38px] w-full items-center gap-2 rounded-xl border bg-white px-2.5 py-1.5 text-left text-xs transition-colors",
          open ? "border-emerald-500 ring-2 ring-emerald-100" : "border-slate-200 hover:border-slate-300",
          isDisabled && "cursor-not-allowed bg-slate-50 opacity-70",
        )}
      >
        <Users className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="flex min-w-0 flex-1 flex-wrap gap-1">
          {selected.length === 0 ? (
            <span className="py-0.5 text-slate-400">
              {loading
                ? "Loading staff…"
                : staff.length === 0
                  ? "No active housekeeping staff in HR"
                  : placeholder}
            </span>
          ) : (
            selected.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 py-0.5 pl-0.5 pr-1.5 font-semibold text-emerald-800"
              >
                <StaffAvatar id={s.id} name={s.name} size="xs" />
                {s.name}
                {!disabled && (
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-label={`Remove ${s.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(s.id);
                    }}
                    className="rounded-full p-0.5 text-emerald-600 hover:bg-emerald-100"
                  >
                    <X className="h-2.5 w-2.5" />
                  </span>
                )}
              </span>
            ))
          )}
        </span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search staff…"
              className="flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
            />
            {value.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-[10px] font-semibold text-slate-500 hover:text-red-600"
              >
                Clear
              </button>
            )}
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-center text-xs text-slate-400">No staff match “{query}”.</li>
            ) : (
              filtered.map((s) => {
                const checked = value.includes(s.id);
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => toggle(s.id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors",
                        checked ? "bg-emerald-50/70" : "hover:bg-slate-50",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                          checked ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white",
                        )}
                      >
                        {checked && <Check className="h-3 w-3" />}
                      </span>
                      <StaffAvatar id={s.id} name={s.name} />
                      <span className={cn("flex-1 truncate", checked ? "font-semibold text-slate-900" : "text-slate-700")}>
                        {s.name}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-3 py-2 text-[10px] text-slate-500">
            <span>{value.length} selected</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
