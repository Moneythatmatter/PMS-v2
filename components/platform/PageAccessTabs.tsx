"use client";

import { useMemo, useState } from "react";
import type { PlatformAccessGroup } from "@/services/platform";
import type { PermissionLevel } from "@/lib/property";
import { cn } from "@/lib/utils";

export type PageAccessLevel = PermissionLevel | "";

const LEVELS: { id: PageAccessLevel; label: string; hint: string; on: string; swatch: string }[] = [
  { id: "", label: "None", hint: "Page hidden", on: "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200", swatch: "bg-slate-300" },
  { id: "read", label: "Read", hint: "View only", on: "bg-sky-600 text-white shadow-sm", swatch: "bg-sky-600" },
  { id: "write", label: "Write", hint: "Create & edit", on: "bg-emerald-600 text-white shadow-sm", swatch: "bg-emerald-600" },
];

export function staffPageLevel(level?: string | null): PageAccessLevel {
  if (level === "read") return "read";
  if (level === "write" || level === "admin") return "write";
  return "";
}

function LevelPicker({
  value,
  onChange,
  label,
}: {
  value: PageAccessLevel;
  onChange: (v: PageAccessLevel) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg bg-slate-100 p-0.5">
      {LEVELS.map((l) => (
        <button
          key={l.id || "none"}
          type="button"
          role="radio"
          aria-checked={value === l.id}
          title={l.hint}
          onClick={() => onChange(l.id)}
          className={cn(
            "rounded-md px-2.5 py-1 text-[11px] font-semibold transition",
            value === l.id ? l.on : "text-slate-500 hover:text-slate-800",
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

type FlatMode = {
  mode?: "flat";
  accessGroups: PlatformAccessGroup[];
  permissions: Record<string, PermissionLevel | undefined>;
  onChange: (moduleKey: string, level: PageAccessLevel) => void;
  onSetGroup: (group: PlatformAccessGroup, level: PageAccessLevel) => void;
  onSetAll?: (level: PageAccessLevel) => void;
};

type ByPropertyMode = {
  mode: "byProperty";
  accessGroups: PlatformAccessGroup[];
  propertyIds: string[];
  propertyName: (id: string) => string;
  permissions: Record<string, Record<string, PermissionLevel | undefined>>;
  onChange: (propertyId: string, moduleKey: string, level: PageAccessLevel) => void;
  onSetGroup: (propertyId: string, group: PlatformAccessGroup, level: PageAccessLevel) => void;
  onSetAll?: (propertyId: string, level: PageAccessLevel) => void;
  onCopyFromFirst?: () => void;
};

export type PageAccessTabsProps = FlatMode | ByPropertyMode;

function groupGrantedCount(
  group: PlatformAccessGroup,
  getLevel: (key: string) => string | undefined,
) {
  return group.pages.filter((p) => staffPageLevel(getLevel(p.key))).length;
}

export function PageAccessTabs(props: PageAccessTabsProps) {
  const { accessGroups } = props;
  const [activeKey, setActiveKey] = useState(accessGroups[0]?.key ?? "");
  const activeGroup = useMemo(
    () => accessGroups.find((g) => g.key === activeKey) ?? accessGroups[0] ?? null,
    [accessGroups, activeKey],
  );

  const totalPages = accessGroups.reduce((n, g) => n + g.pages.length, 0);
  const totalGranted =
    props.mode === "byProperty"
      ? props.propertyIds.reduce(
          (sum, pid) =>
            sum +
            accessGroups.reduce(
              (n, g) => n + groupGrantedCount(g, (key) => props.permissions[pid]?.[key]),
              0,
            ),
          0,
        )
      : accessGroups.reduce((n, g) => n + groupGrantedCount(g, (key) => props.permissions[key]), 0);

  if (!activeGroup) {
    return <p className="text-sm text-slate-500">No modules available.</p>;
  }

  const activeGranted =
    props.mode === "byProperty"
      ? props.propertyIds.reduce(
          (n, pid) => n + groupGrantedCount(activeGroup, (key) => props.permissions[pid]?.[key]),
          0,
        )
      : groupGrantedCount(activeGroup, (key) => props.permissions[key]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
          {LEVELS.slice(1).map((l) => (
            <span key={l.id} className="inline-flex items-center gap-1.5">
              <span className={cn("h-2.5 w-2.5 rounded-sm", l.swatch)} />
              <strong className="font-semibold text-slate-700">{l.label}</strong> {l.hint.toLowerCase()}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-slate-500">
            {totalGranted} of {props.mode === "byProperty" ? totalPages * Math.max(props.propertyIds.length, 1) : totalPages} on
          </span>
          {props.mode === "byProperty" && props.propertyIds.length > 1 && props.onCopyFromFirst && (
            <button
              type="button"
              onClick={props.onCopyFromFirst}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Copy first property to all
            </button>
          )}
          {props.mode !== "byProperty" && props.onSetAll && (
            <select
              value=""
              aria-label="Set all pages"
              onChange={(e) => props.onSetAll?.(e.target.value as PageAccessLevel)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600"
            >
              <option value="" disabled>
                Set all modules…
              </option>
              {LEVELS.map((l) => (
                <option key={l.id || "none"} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          )}
          {props.mode === "byProperty" && props.onSetAll && props.propertyIds[0] && (
            <select
              value=""
              aria-label="Set all pages for first property"
              onChange={(e) => props.onSetAll?.(props.propertyIds[0], e.target.value as PageAccessLevel)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600"
            >
              <option value="" disabled>
                Set all modules…
              </option>
              {LEVELS.map((l) => (
                <option key={l.id || "none"} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/80 p-1">
        <div className="flex min-w-max gap-1" role="tablist" aria-label="Modules">
          {accessGroups.map((group) => {
            const granted =
              props.mode === "byProperty"
                ? props.propertyIds.reduce(
                    (n, pid) => n + groupGrantedCount(group, (key) => props.permissions[pid]?.[key]),
                    0,
                  )
                : groupGrantedCount(group, (key) => props.permissions[key]);
            const on = group.key === activeGroup.key;
            return (
              <button
                key={group.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setActiveKey(group.key)}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition",
                  on
                    ? "bg-white text-emerald-800 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-500 hover:bg-white/70 hover:text-slate-800",
                )}
              >
                {group.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px] tabular-nums",
                    on ? "bg-emerald-100 text-emerald-800" : granted > 0 ? "bg-sky-100 text-sky-800" : "bg-slate-200/80 text-slate-500",
                  )}
                >
                  {granted}/{group.pages.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5">
          <div>
            <p className="text-sm font-semibold text-slate-900">{activeGroup.label}</p>
            <p className="text-[11px] text-slate-500">
              {activeGranted} of {activeGroup.pages.length}
              {props.mode === "byProperty" && props.propertyIds.length > 1
                ? ` × ${props.propertyIds.length} properties`
                : ""}{" "}
              granted in this module
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {props.mode === "byProperty" ? (
              props.propertyIds.map((pid) => (
                <select
                  key={pid}
                  value=""
                  aria-label={`Set all ${activeGroup.label} for ${props.propertyName(pid)}`}
                  onChange={(e) => props.onSetGroup(pid, activeGroup, e.target.value as PageAccessLevel)}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600"
                >
                  <option value="" disabled>
                    {props.propertyIds.length > 1 ? `${props.propertyName(pid)} · Set tab…` : "Set this tab…"}
                  </option>
                  {LEVELS.map((l) => (
                    <option key={l.id || "none"} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              ))
            ) : (
              <select
                value=""
                aria-label={`Set all ${activeGroup.label}`}
                onChange={(e) => props.onSetGroup(activeGroup, e.target.value as PageAccessLevel)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600"
              >
                <option value="" disabled>
                  Set this tab…
                </option>
                {LEVELS.map((l) => (
                  <option key={l.id || "none"} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <ul className="divide-y divide-slate-100">
          {activeGroup.pages.map((page) => (
            <li
              key={page.key}
              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{page.label}</p>
              </div>
              {props.mode === "byProperty" ? (
                <div className="flex flex-wrap gap-3">
                  {props.propertyIds.map((pid) => (
                    <div key={pid} className="flex flex-col items-start gap-1 sm:items-end">
                      {props.propertyIds.length > 1 && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          {props.propertyName(pid)}
                        </span>
                      )}
                      <LevelPicker
                        label={`${activeGroup.label} · ${page.label} · ${props.propertyName(pid)}`}
                        value={staffPageLevel(props.permissions[pid]?.[page.key])}
                        onChange={(level) => props.onChange(pid, page.key, level)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <LevelPicker
                  label={`${activeGroup.label} · ${page.label}`}
                  value={staffPageLevel(props.permissions[page.key])}
                  onChange={(level) => props.onChange(page.key, level)}
                />
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
