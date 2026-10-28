"use client";

import { cn } from "@/lib/utils";
import type { ModuleOutletOption, ModuleRow } from "./module-types";

const STATE_STYLES = {
  Active: { tile: "border-slate-300 bg-white", swatch: "border-slate-300 bg-white" },
  Inactive: { tile: "border-dashed border-slate-300 bg-slate-100 opacity-60", swatch: "border-dashed border-slate-300 bg-slate-100" },
} as const;

export function TableStatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {Object.entries(STATE_STYLES).map(([label, s]) => (
        <span key={label} className="inline-flex items-center gap-1.5 text-[11px] text-slate-600">
          <span className={cn("h-3.5 w-3.5 rounded-sm border", s.swatch)} />
          {label}
        </span>
      ))}
    </div>
  );
}

export function TableCardGrid({
  rows,
  outlets,
  onSelect,
}: {
  rows: ModuleRow[];
  outlets: ModuleOutletOption[];
  onSelect: (row: ModuleRow) => void;
}) {
  const outletName = (id?: string) =>
    outlets.find((o) => o.id === id)?.name ?? (id ? "Other" : "Unassigned");

  const groups = new Map<string, ModuleRow[]>();
  for (const row of rows) {
    const key = row.outletId ?? "";
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  const ordered = Array.from(groups.entries())
    .map(([id, tables]) => ({
      id,
      name: outletName(id || undefined),
      tables: [...tables].sort((a, b) =>
        String(a.tableNo ?? "").localeCompare(String(b.tableNo ?? ""), undefined, { numeric: true }),
      ),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (!rows.length) {
    return (
      <div className="flex min-h-[160px] items-center justify-center text-sm text-slate-500">
        No tables found.
      </div>
    );
  }

  return (
    <div className="-mx-4 divide-y divide-slate-100 sm:-mx-5">
      {ordered.map((group) => (
        <section key={group.id || "none"} className="py-3">
          <div className="mb-2 flex items-center gap-2 px-4 sm:px-5">
            <h2 className="text-sm font-semibold text-slate-900">{group.name}</h2>
            <span className="text-[11px] text-slate-500">
              {group.tables.length} table{group.tables.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 px-4 pb-1 sm:px-5">
            {group.tables.map((table) => {
              const inactive = table.activeState === "Inactive";
              const capacity = Number(table.capacity);
              return (
                <button
                  key={table.id || `${group.id}-${table.tableNo}`}
                  type="button"
                  onClick={() => onSelect(table)}
                  className={cn(
                    "relative flex h-[7.25rem] w-[6.25rem] shrink-0 flex-col items-center justify-center rounded-sm border-2 p-2 text-center transition hover:-translate-y-0.5 hover:shadow-md",
                    inactive ? STATE_STYLES.Inactive.tile : STATE_STYLES.Active.tile,
                  )}
                  aria-label={`Table ${table.tableNo}`}
                >
                  <p className="text-2xl font-bold leading-none text-slate-900">{table.tableNo ?? "—"}</p>
                  {capacity > 0 && (
                    <p className="mt-2 text-[10px] font-medium text-slate-600">
                      {capacity} seat{capacity === 1 ? "" : "s"}
                      {table.shape ? ` · ${table.shape}` : ""}
                    </p>
                  )}
                  {inactive && <p className="mt-1 text-[10px] font-semibold text-slate-500">Inactive</p>}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
