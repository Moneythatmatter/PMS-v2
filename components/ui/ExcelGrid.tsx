"use client";

import React, { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ArrowDown, ArrowUp, GripVertical, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export type ExcelGridColumn<T> = {
  id: string;
  header: string;
  width: number;
  minWidth?: number;
  align?: "left" | "right" | "center";
  render: (row: T) => React.ReactNode;
  /** Plain value used for sorting and the full-text hover tooltip. */
  value?: (row: T) => string | number | null | undefined;
  wrap?: boolean;
};

type Layout = { order: string[]; widths: Record<string, number> };
type Sort = { id: string; dir: "asc" | "desc" } | null;
type DropHint = { id: string; side: "left" | "right" } | null;

type ExcelGridProps<T> = {
  columns: ExcelGridColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Persists column order and widths in localStorage under this key. */
  storageKey?: string;
  onRowClick?: (row: T) => void;
  isRowActive?: (row: T) => boolean;
  emptyState?: React.ReactNode;
  maxHeight?: string;
  className?: string;
};

const DEFAULT_MIN_WIDTH = 60;
const ROW_NUMBER_WIDTH = 48;
const LAYOUT_EVENT = "excel-grid-layout";

const subscribeLayout = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener(LAYOUT_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(LAYOUT_EVENT, cb);
  };
};

const parseLayout = (raw: string | null): Layout | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Layout>;
    return { order: Array.isArray(parsed.order) ? parsed.order : [], widths: parsed.widths ?? {} };
  } catch {
    return null;
  }
};

const compareValues = (a: string | number | null | undefined, b: string | number | null | undefined) => {
  if (a === b) return 0;
  if (a === null || a === undefined || a === "") return 1;
  if (b === null || b === undefined || b === "") return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
};

export function ExcelGrid<T>({
  columns,
  rows,
  rowKey,
  storageKey,
  onRowClick,
  isRowActive,
  emptyState,
  maxHeight = "70vh",
  className,
}: ExcelGridProps<T>) {
  const storedRaw = useSyncExternalStore(
    subscribeLayout,
    () => (storageKey ? window.localStorage.getItem(storageKey) : null),
    () => null,
  );
  const [draft, setDraft] = useState<Layout | null>(null);
  const [sort, setSort] = useState<Sort>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropHint, setDropHint] = useState<DropHint>(null);
  const resizeRef = useRef<{ id: string; startX: number; startWidth: number } | null>(null);

  const byId = useMemo(() => new Map(columns.map((c) => [c.id, c])), [columns]);

  const layout = useMemo<Layout>(() => {
    const source = draft ?? parseLayout(storedRaw);
    const order = (source?.order ?? []).filter((id) => byId.has(id));
    for (const c of columns) if (!order.includes(c.id)) order.push(c.id);
    const widths: Record<string, number> = {};
    for (const c of columns) {
      const saved = source?.widths[c.id];
      widths[c.id] = Math.max(c.minWidth ?? DEFAULT_MIN_WIDTH, typeof saved === "number" ? saved : c.width);
    }
    return { order, widths };
  }, [draft, storedRaw, columns, byId]);

  const orderedColumns = layout.order.map((id) => byId.get(id)!);
  const tableWidth = ROW_NUMBER_WIDTH + orderedColumns.reduce((sum, c) => sum + layout.widths[c.id], 0);

  const persist = (next: Layout) => {
    setDraft(next);
    if (!storageKey) return;
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    window.dispatchEvent(new Event(LAYOUT_EVENT));
  };

  const resetLayout = () => {
    setDraft(null);
    setSort(null);
    if (!storageKey) return;
    window.localStorage.removeItem(storageKey);
    window.dispatchEvent(new Event(LAYOUT_EVENT));
  };

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const col = byId.get(sort.id);
    if (!col?.value) return rows;
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => compareValues(col.value!(a), col.value!(b)) * factor);
  }, [rows, sort, byId]);

  const toggleSort = (col: ExcelGridColumn<T>) => {
    if (!col.value) return;
    setSort((prev) =>
      prev?.id !== col.id ? { id: col.id, dir: "asc" } : prev.dir === "asc" ? { id: col.id, dir: "desc" } : null,
    );
  };

  // Column resize
  const onResizeStart = (e: React.PointerEvent<HTMLSpanElement>, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeRef.current = { id, startX: e.clientX, startWidth: layout.widths[id] };
  };
  const onResizeMove = (e: React.PointerEvent<HTMLSpanElement>) => {
    const r = resizeRef.current;
    if (!r) return;
    const min = byId.get(r.id)?.minWidth ?? DEFAULT_MIN_WIDTH;
    const width = Math.max(min, Math.round(r.startWidth + e.clientX - r.startX));
    setDraft({ order: layout.order, widths: { ...layout.widths, [r.id]: width } });
  };
  const onResizeEnd = (e: React.PointerEvent<HTMLSpanElement>) => {
    if (!resizeRef.current) return;
    resizeRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
    persist(layout);
  };
  const resetColumnWidth = (id: string) => {
    const col = byId.get(id);
    if (col) persist({ order: layout.order, widths: { ...layout.widths, [id]: col.width } });
  };

  // Column reorder
  const onDrop = (targetId: string) => {
    if (!dragId || !dropHint || dragId === targetId) {
      setDragId(null);
      setDropHint(null);
      return;
    }
    const order = layout.order.filter((id) => id !== dragId);
    const targetIdx = order.indexOf(targetId);
    order.splice(dropHint.side === "left" ? targetIdx : targetIdx + 1, 0, dragId);
    persist({ order, widths: layout.widths });
    setDragId(null);
    setDropHint(null);
  };

  const alignClass = (align?: "left" | "right" | "center") =>
    align === "right" ? "text-right justify-end" : align === "center" ? "text-center justify-center" : "text-left";

  return (
    <div className={cn("rounded-xl border border-slate-300 bg-white", className)}>
      <div className="overflow-auto rounded-t-xl" style={{ maxHeight }}>
        <table className="border-separate border-spacing-0 text-xs" style={{ width: tableWidth, tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: ROW_NUMBER_WIDTH }} />
            {orderedColumns.map((c) => (
              <col key={c.id} style={{ width: layout.widths[c.id] }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-30 border-b border-r border-slate-300 bg-slate-200/95 px-1 py-2 text-center text-[10px] font-bold text-slate-500">
                #
              </th>
              {orderedColumns.map((c) => {
                const sorted = sort?.id === c.id ? sort.dir : null;
                const hint = dropHint?.id === c.id && dragId !== c.id ? dropHint.side : null;
                return (
                  <th
                    key={c.id}
                    onDragOver={(e) => {
                      if (!dragId) return;
                      e.preventDefault();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const side = e.clientX < rect.left + rect.width / 2 ? "left" : "right";
                      if (dropHint?.id !== c.id || dropHint.side !== side) setDropHint({ id: c.id, side });
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      onDrop(c.id);
                    }}
                    className={cn(
                      "group/th sticky top-0 z-20 select-none border-b border-r border-slate-300 bg-slate-100/95 p-0 text-[10px] font-bold uppercase tracking-wider text-slate-700",
                      dragId === c.id && "opacity-40",
                      hint === "left" && "shadow-[inset_3px_0_0_0_#059669]",
                      hint === "right" && "shadow-[inset_-3px_0_0_0_#059669]",
                    )}
                  >
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", c.id);
                        setDragId(c.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setDropHint(null);
                      }}
                      onClick={() => toggleSort(c)}
                      title={c.value ? "Click to sort · drag to move" : "Drag to move"}
                      className={cn(
                        "flex h-full cursor-grab items-center gap-1 px-2.5 py-2 active:cursor-grabbing",
                        alignClass(c.align),
                      )}
                    >
                      <GripVertical className="h-3 w-3 shrink-0 text-slate-300 group-hover/th:text-slate-500" />
                      <span className="truncate">{c.header}</span>
                      {sorted === "asc" && <ArrowUp className="h-3 w-3 shrink-0 text-emerald-600" />}
                      {sorted === "desc" && <ArrowDown className="h-3 w-3 shrink-0 text-emerald-600" />}
                    </div>
                    <span
                      role="separator"
                      aria-orientation="vertical"
                      title="Drag to resize · double-click to reset"
                      onPointerDown={(e) => onResizeStart(e, c.id)}
                      onPointerMove={onResizeMove}
                      onPointerUp={onResizeEnd}
                      onPointerCancel={onResizeEnd}
                      onDoubleClick={() => resetColumnWidth(c.id)}
                      className="absolute right-0 top-0 z-10 h-full w-2 translate-x-1/2 cursor-col-resize after:absolute after:left-1/2 after:top-1 after:h-[calc(100%-8px)] after:w-0.5 after:-translate-x-1/2 after:rounded after:bg-transparent hover:after:bg-emerald-500"
                    />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={orderedColumns.length + 1} className="px-3 py-8 text-center text-slate-500">
                  {emptyState ?? "No records."}
                </td>
              </tr>
            ) : (
              sortedRows.map((row, idx) => {
                const active = isRowActive?.(row) ?? false;
                return (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "group/tr",
                      onRowClick && "cursor-pointer",
                      active ? "bg-amber-50" : idx % 2 === 1 ? "bg-slate-50/60" : "bg-white",
                    )}
                  >
                    <td
                      className={cn(
                        "sticky left-0 z-10 border-b border-r border-slate-200 px-1 py-2 text-center font-mono text-[10px] text-slate-400",
                        active ? "bg-amber-100" : "bg-slate-100 group-hover/tr:bg-emerald-100",
                      )}
                    >
                      {idx + 1}
                    </td>
                    {orderedColumns.map((c) => {
                      const title = c.value?.(row);
                      return (
                        <td
                          key={c.id}
                          title={title === null || title === undefined ? undefined : String(title)}
                          className={cn(
                            "border-b border-r border-slate-200 px-2.5 py-2 align-middle text-slate-700 group-hover/tr:bg-emerald-50/70",
                            c.wrap ? "whitespace-normal break-words" : "truncate whitespace-nowrap",
                            alignClass(c.align),
                          )}
                        >
                          {c.render(row)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-medium text-slate-500 rounded-b-xl">
        <span>
          {sortedRows.length} row{sortedRows.length === 1 ? "" : "s"} · Drag headers to reorder · Drag column edges to resize
        </span>
        <button
          type="button"
          onClick={resetLayout}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold text-slate-600 hover:bg-slate-200 hover:text-slate-900"
        >
          <RotateCcw className="h-3 w-3" />
          Reset layout
        </button>
      </div>
    </div>
  );
}
