"use client";

import { useMemo, useRef, useState, type DragEvent, type KeyboardEvent, type MouseEvent } from "react";
import { ArrowDown, ArrowUp, GripVertical, Loader2, RotateCcw } from "lucide-react";
import type { ReportColumn, ReportRow } from "@/app/data/frontoffice/reports";
import { cn } from "@/lib/utils";

type SortState = { key: string; dir: "asc" | "desc" } | null;
type Cell = { row: number; col: number } | null;

const MIN_VISIBLE_ROWS = 14;
const ROW_HEADER_WIDTH = 48;
const MIN_COL_WIDTH = 60;
const MAX_COL_WIDTH = 640;

const STATUS_TONES: [RegExp, string][] = [
  [/cancel|void|no show|blocked|reject|low|dirty/i, "bg-red-500"],
  [/pending|reserved|partial|medium|cleaning|open|unpaid/i, "bg-amber-500"],
  [/checked in|occupied|paid|settled|closed|approved|high|clean|inspected|confirmed/i, "bg-emerald-500"],
  [/checked out|vacant/i, "bg-slate-400"],
];

function columnLetter(index: number) {
  let n = index + 1;
  let label = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    label = String.fromCharCode(65 + rem) + label;
    n = Math.floor((n - 1) / 26);
  }
  return label;
}

function numeric(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const raw = value.replace(/[₹,\s%]/g, "");
  if (!raw || !/^-?\d+(\.\d+)?$/.test(raw)) return null;
  return Number(raw);
}

function formatNumber(value: number, format?: ReportColumn["format"]) {
  if (format === "currency") {
    return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (format === "percent") return `${value}%`;
  return value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function display(value: unknown, column: ReportColumn, isNumeric: boolean) {
  if (value === undefined || value === null || value === "" || value === "—") return "";
  const n = isNumeric ? numeric(value) : null;
  return n === null ? String(value) : formatNumber(n, column.format);
}

function isStatusColumn(key: string) {
  return /^(status|band|segment|group|housekeeping)$/i.test(key);
}

function statusTone(value: string) {
  return STATUS_TONES.find(([pattern]) => pattern.test(value))?.[1] ?? "bg-slate-300";
}

export function ReportExcelGrid({
  columns: baseColumns,
  rows,
  loading = false,
  sheets,
  activeSheet,
  onSheetChange,
}: {
  columns: ReportColumn[];
  rows: ReportRow[];
  loading?: boolean;
  sheets?: { id: string; label: string }[];
  activeSheet?: string;
  onSheetChange?: (id: string) => void;
}) {
  const [sort, setSort] = useState<SortState>(null);
  const [selected, setSelected] = useState<Cell>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const resizingRef = useRef(false);

  // Column order and widths are per report; switching reports resets them.
  const columnsKey = baseColumns.map((c) => c.key).join("|");
  const [layoutKey, setLayoutKey] = useState(columnsKey);
  const [order, setOrder] = useState<string[]>(() => baseColumns.map((c) => c.key));
  const [widths, setWidths] = useState<Record<string, number>>({});
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dropKey, setDropKey] = useState<string | null>(null);
  if (layoutKey !== columnsKey) {
    setLayoutKey(columnsKey);
    setOrder(baseColumns.map((c) => c.key));
    setWidths({});
  }

  const columns = useMemo(() => {
    const byKey = new Map(baseColumns.map((c) => [c.key, c]));
    const ordered = order.map((k) => byKey.get(k)).filter((c): c is ReportColumn => Boolean(c));
    return [...ordered, ...baseColumns.filter((c) => !order.includes(c.key))];
  }, [baseColumns, order]);

  const numericCols = useMemo(
    () =>
      new Set(
        columns
          .filter(
            (c) =>
              c.format === "currency" ||
              c.format === "percent" ||
              (rows.length > 0 &&
                rows.every((r) => {
                  const v = r[c.key];
                  return v === undefined || v === "" || v === "—" || numeric(v) !== null;
                }) &&
                rows.some((r) => numeric(r[c.key]) !== null)),
          )
          .map((c) => c.key),
      ),
    [columns, rows],
  );

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const dir = sort.dir === "asc" ? 1 : -1;
    const isNum = numericCols.has(sort.key);
    return [...rows].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      if (isNum) return ((numeric(av) ?? -Infinity) - (numeric(bv) ?? -Infinity)) * dir;
      return String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true }) * dir;
    });
  }, [rows, sort, numericCols]);

  const totals = useMemo(() => {
    const out: Record<string, number> = {};
    for (const c of columns) {
      if (!numericCols.has(c.key) || c.format === "percent") continue;
      out[c.key] = sorted.reduce((s, r) => s + (numeric(r[c.key]) ?? 0), 0);
    }
    return out;
  }, [columns, sorted, numericCols]);
  const hasTotals = sorted.length > 0 && Object.keys(totals).length > 0;

  const toggleSort = (key: string) =>
    setSort((prev) =>
      prev?.key !== key ? { key, dir: "asc" } : prev.dir === "asc" ? { key, dir: "desc" } : null,
    );

  const selectedColumn = selected ? columns[selected.col] : undefined;

  const columnStats = useMemo(() => {
    if (!selectedColumn) return null;
    const values = sorted.map((r) => r[selectedColumn.key]).filter((v) => v !== undefined && v !== "" && v !== "—");
    const nums = values.map(numeric).filter((n): n is number => n !== null);
    const isNum = numericCols.has(selectedColumn.key) && nums.length > 0;
    const sum = nums.reduce((a, b) => a + b, 0);
    return {
      count: values.length,
      sum: isNum ? formatNumber(sum, selectedColumn.format) : null,
      average: isNum ? formatNumber(Math.round((sum / nums.length) * 100) / 100, selectedColumn.format) : null,
    };
  }, [selectedColumn, sorted, numericCols]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!sorted.length || !columns.length) return;
    const moves: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
      Tab: [0, e.shiftKey ? -1 : 1],
      Enter: [1, 0],
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    setSelected((prev) => {
      const base = prev ?? { row: 0, col: 0 };
      if (!prev) return base;
      return {
        row: Math.min(sorted.length - 1, Math.max(0, base.row + move[0])),
        col: Math.min(columns.length - 1, Math.max(0, base.col + move[1])),
      };
    });
  };

  const fillerRows = Math.max(0, MIN_VISIBLE_ROWS - sorted.length - (hasTotals ? 1 : 0));

  const widthOf = (key: string) => widths[key] ?? (numericCols.has(key) ? 130 : 160);
  const tableWidth = ROW_HEADER_WIDTH + columns.reduce((sum, c) => sum + widthOf(c.key), 0);
  const layoutChanged =
    Object.keys(widths).length > 0 || columns.some((c, i) => c.key !== baseColumns[i]?.key);

  const startResize = (e: MouseEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = true;
    const startX = e.clientX;
    const startWidth = widthOf(key);
    const onMove = (ev: globalThis.MouseEvent) => {
      const next = Math.min(MAX_COL_WIDTH, Math.max(MIN_COL_WIDTH, startWidth + ev.clientX - startX));
      setWidths((prev) => ({ ...prev, [key]: next }));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.classList.remove("cursor-col-resize", "select-none");
      // Let the click that ends the drag pass without toggling sort.
      window.setTimeout(() => {
        resizingRef.current = false;
      }, 0);
    };
    document.body.classList.add("cursor-col-resize", "select-none");
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  /** Double-click a column edge to fit its widest value, like Excel. */
  const autoFit = (e: MouseEvent, column: ReportColumn) => {
    e.preventDefault();
    e.stopPropagation();
    const isNum = numericCols.has(column.key);
    const longest = sorted.reduce(
      (max, r) => Math.max(max, display(r[column.key], column, isNum).length),
      column.header.length + 2,
    );
    const fitted = Math.min(MAX_COL_WIDTH, Math.max(MIN_COL_WIDTH, Math.round(longest * 7.4 + 28)));
    setWidths((prev) => ({ ...prev, [column.key]: fitted }));
  };

  const moveColumn = (from: string, to: string) => {
    if (from === to) return;
    const keys = columns.map((c) => c.key);
    const fromIndex = keys.indexOf(from);
    const toIndex = keys.indexOf(to);
    if (fromIndex < 0 || toIndex < 0) return;
    keys.splice(fromIndex, 1);
    keys.splice(toIndex, 0, from);
    setOrder(keys);
    setSelected(null);
  };

  const dragHandlers = (key: string) => ({
    draggable: true,
    onDragStart: (e: DragEvent) => {
      if (resizingRef.current) {
        e.preventDefault();
        return;
      }
      setDragKey(key);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", key);
    },
    onDragOver: (e: DragEvent) => {
      if (!dragKey) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (dropKey !== key) setDropKey(key);
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      if (dragKey) moveColumn(dragKey, key);
      setDragKey(null);
      setDropKey(null);
    },
    onDragEnd: () => {
      setDragKey(null);
      setDropKey(null);
    },
  });

  const dropHint = (key: string) => {
    if (!dragKey || dropKey !== key || dragKey === key) return "";
    const keys = columns.map((c) => c.key);
    return keys.indexOf(dragKey) < keys.indexOf(key)
      ? "shadow-[inset_-3px_0_0_#059669]"
      : "shadow-[inset_3px_0_0_#059669]";
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
      {/* Grid */}
      <div
        ref={gridRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="relative max-h-[62vh] overflow-auto outline-none"
      >
        {loading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/60">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
          </div>
        )}
        <table
          className="table-fixed border-separate border-spacing-0 text-[13px] text-slate-800"
          style={{ width: tableWidth, minWidth: "100%" }}
        >
          <colgroup>
            <col style={{ width: ROW_HEADER_WIDTH }} />
            {columns.map((c) => (
              <col key={c.key} style={{ width: widthOf(c.key) }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-20">
            <tr>
              <th className="sticky left-0 z-30 h-6 border-b border-r border-slate-300 bg-slate-100" />
              {columns.map((c, i) => (
                <th
                  key={`letter-${c.key}`}
                  {...dragHandlers(c.key)}
                  className={cn(
                    "relative h-6 cursor-grab border-b border-r border-slate-300 bg-slate-100 text-center text-[11px] font-medium text-slate-500 active:cursor-grabbing",
                    selected?.col === i && "bg-emerald-100 text-emerald-800",
                    dragKey === c.key && "opacity-50",
                    dropHint(c.key),
                  )}
                  title="Drag to move column"
                >
                  {columnLetter(i)}
                  <ResizeHandle onMouseDown={(e) => startResize(e, c.key)} onDoubleClick={(e) => autoFit(e, c)} />
                </th>
              ))}
            </tr>
            <tr>
              <th className="sticky left-0 z-30 h-8 border-b-2 border-r border-b-slate-400 border-r-slate-300 bg-slate-100 text-center text-[11px] font-medium text-slate-500">
                1
              </th>
              {columns.map((c) => {
                const active = sort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    {...dragHandlers(c.key)}
                    onClick={() => {
                      if (!resizingRef.current) toggleSort(c.key);
                    }}
                    className={cn(
                      "group/head relative h-8 cursor-pointer select-none truncate whitespace-nowrap border-b-2 border-r border-b-slate-400 border-r-slate-300 bg-emerald-50 px-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100",
                      numericCols.has(c.key) ? "text-right" : "text-left",
                      dragKey === c.key && "opacity-50",
                      dropHint(c.key),
                    )}
                    title="Click to sort · drag to move · drag the edge to resize"
                  >
                    <span className="inline-flex max-w-full items-center gap-1">
                      <GripVertical className="h-3 w-3 shrink-0 text-emerald-700/40 opacity-0 transition-opacity group-hover/head:opacity-100" />
                      <span className="truncate">{c.header}</span>
                      {active &&
                        (sort.dir === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        ))}
                    </span>
                    <ResizeHandle onMouseDown={(e) => startResize(e, c.key)} onDoubleClick={(e) => autoFit(e, c)} />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, r) => (
              <tr key={row.id} className="group">
                <td
                  className={cn(
                    "sticky left-0 z-10 h-7 border-b border-r border-slate-300 bg-slate-100 text-center text-[11px] text-slate-500",
                    selected?.row === r && "bg-emerald-100 font-semibold text-emerald-800",
                  )}
                >
                  {r + 2}
                </td>
                {columns.map((c, ci) => {
                  const isNum = numericCols.has(c.key);
                  const text = display(row[c.key], c, isNum);
                  const isSel = selected?.row === r && selected?.col === ci;
                  return (
                    <td
                      key={c.key}
                      onClick={() => {
                        setSelected({ row: r, col: ci });
                        gridRef.current?.focus();
                      }}
                      className={cn(
                        "h-7 cursor-cell truncate whitespace-nowrap border-b border-r border-slate-200 px-2 group-hover:bg-slate-50",
                        isNum && "text-right tabular-nums",
                        isSel && "relative bg-emerald-50 outline outline-2 -outline-offset-2 outline-emerald-600",
                      )}
                      title={text}
                    >
                      {text && isStatusColumn(c.key) ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className={cn("h-1.5 w-1.5 rounded-full", statusTone(text))} />
                          {text}
                        </span>
                      ) : (
                        text
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {hasTotals && (
              <tr className="sticky bottom-0 z-10">
                <td className="sticky left-0 z-20 h-8 border-r border-t-2 border-r-slate-300 border-t-slate-400 bg-slate-100 text-center text-[11px] font-medium text-slate-500">
                  {sorted.length + 2}
                </td>
                {columns.map((c, ci) => (
                  <td
                    key={`total-${c.key}`}
                    className={cn(
                      "h-8 whitespace-nowrap border-r border-t-2 border-r-slate-200 border-t-slate-400 bg-amber-50 px-2 font-semibold text-slate-900",
                      totals[c.key] !== undefined && "text-right tabular-nums",
                    )}
                  >
                    {totals[c.key] !== undefined
                      ? formatNumber(Math.round(totals[c.key] * 100) / 100, c.format)
                      : ci === 0
                        ? "Total"
                        : ""}
                  </td>
                ))}
              </tr>
            )}
            {Array.from({ length: fillerRows }, (_, i) => (
              <tr key={`filler-${i}`}>
                <td className="sticky left-0 z-10 h-7 border-b border-r border-slate-300 bg-slate-100 text-center text-[11px] text-slate-400">
                  {sorted.length + (hasTotals ? 1 : 0) + i + 2}
                </td>
                {columns.map((c) => (
                  <td key={c.key} className="h-7 border-b border-r border-slate-100" />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && sorted.length === 0 && (
          <p className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2 rounded-md bg-white px-3 py-1.5 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
            No records for the selected filters.
          </p>
        )}
      </div>

      {/* Sheet tabs + status bar */}
      <div className="flex items-stretch justify-between gap-2 border-t border-slate-300 bg-slate-100 text-xs">
        <div className="flex min-w-0 items-end overflow-x-auto scrollbar-none">
          {(sheets ?? []).map((sheet) => {
            const active = sheet.id === activeSheet;
            return (
              <button
                key={sheet.id}
                type="button"
                onClick={() => {
                  setSelected(null);
                  setSort(null);
                  onSheetChange?.(sheet.id);
                }}
                className={cn(
                  "-mt-px whitespace-nowrap border-r border-slate-300 px-3.5 py-1.5 font-medium transition-colors",
                  active
                    ? "border-t-2 border-t-emerald-600 bg-white text-emerald-800"
                    : "text-slate-600 hover:bg-slate-200",
                )}
              >
                {sheet.label}
              </button>
            );
          })}
        </div>
        <div className="flex shrink-0 items-center gap-4 px-3 py-1.5 text-slate-600">
          {layoutChanged && (
            <button
              type="button"
              onClick={() => {
                setOrder(baseColumns.map((c) => c.key));
                setWidths({});
                setSelected(null);
              }}
              className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:underline"
            >
              <RotateCcw className="h-3 w-3" />
              Reset layout
            </button>
          )}
          {columnStats ? (
            <>
              {columnStats.average && <span>Average: <b className="font-semibold text-slate-800">{columnStats.average}</b></span>}
              <span>Count: <b className="font-semibold text-slate-800">{columnStats.count}</b></span>
              {columnStats.sum && <span>Sum: <b className="font-semibold text-slate-800">{columnStats.sum}</b></span>}
            </>
          ) : (
            <span>{loading ? "Calculating…" : `Ready · ${sorted.length} record${sorted.length === 1 ? "" : "s"}`}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function ResizeHandle({
  onMouseDown,
  onDoubleClick,
}: {
  onMouseDown: (e: MouseEvent) => void;
  onDoubleClick: (e: MouseEvent) => void;
}) {
  return (
    <span
      role="separator"
      aria-orientation="vertical"
      draggable={false}
      onMouseDown={onMouseDown}
      onDoubleClick={onDoubleClick}
      onClick={(e) => e.stopPropagation()}
      className="absolute -right-1 top-0 z-10 h-full w-2 cursor-col-resize hover:bg-emerald-500/40 active:bg-emerald-600/60"
      title="Drag to resize · double-click to fit"
    />
  );
}
