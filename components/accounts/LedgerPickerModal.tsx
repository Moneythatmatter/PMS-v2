"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LedgerPickerOption {
  id: string;
  code: string;
  name: string;
  nature?: string | null;
  category?: string | null;
  isBankAccount?: boolean;
  isCashAccount?: boolean;
}

const NATURE_ORDER = ["Asset", "Liability", "Income", "Expense"];

interface LedgerPickerModalProps {
  ledgers: LedgerPickerOption[];
  selectedId?: string;
  title?: string;
  onSelect: (ledger: LedgerPickerOption) => void;
  onClose: () => void;
}

/** Searchable ledger chooser. Mount only while open so search state resets each time. */
export function LedgerPickerModal({
  ledgers,
  selectedId,
  title = "Select Ledger",
  onSelect,
  onClose,
}: LedgerPickerModalProps) {
  const [query, setQuery] = useState("");
  const [natureFilter, setNatureFilter] = useState("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const natures = useMemo(() => {
    const set = new Set(ledgers.map((l) => l.nature).filter((n): n is string => Boolean(n)));
    return NATURE_ORDER.filter((n) => set.has(n)).concat([...set].filter((n) => !NATURE_ORDER.includes(n)));
  }, [ledgers]);

  const filtered = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return ledgers
      .filter((l) => natureFilter === "all" || l.nature === natureFilter)
      .filter((l) => {
        if (!terms.length) return true;
        const hay = `${l.code} ${l.name} ${l.category ?? ""} ${l.nature ?? ""}`.toLowerCase();
        return terms.every((t) => hay.includes(t));
      })
      .sort((a, b) => {
        const na = NATURE_ORDER.indexOf(a.nature ?? "");
        const nb = NATURE_ORDER.indexOf(b.nature ?? "");
        if (na !== nb) return (na < 0 ? 99 : na) - (nb < 0 ? 99 : nb);
        return a.code.localeCompare(b.code, undefined, { numeric: true });
      });
  }, [ledgers, query, natureFilter]);

  const groups = useMemo(() => {
    const out: { nature: string; items: { ledger: LedgerPickerOption; index: number }[] }[] = [];
    filtered.forEach((ledger, index) => {
      const nature = ledger.nature || "Other";
      const last = out[out.length - 1];
      if (last && last.nature === nature) last.items.push({ ledger, index });
      else out.push({ nature, items: [{ ledger, index }] });
    });
    return out;
  }, [filtered]);

  const safeActive = Math.min(activeIndex, Math.max(filtered.length - 1, 0));

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${safeActive}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [safeActive]);

  const choose = (ledger: LedgerPickerOption | undefined) => {
    if (!ledger) return;
    onSelect(ledger);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(Math.min(safeActive + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(Math.max(safeActive - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(filtered[safeActive]);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[10vh]" onKeyDown={onKeyDown}>
      <button
        type="button"
        aria-label="Close ledger picker"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[75vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2.5 border-b border-slate-100 px-5 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              placeholder="Search by ledger code, name or category…"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          {natures.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {["all", ...natures].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setNatureFilter(n);
                    setActiveIndex(0);
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors",
                    natureFilter === n
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {n === "all" ? "All" : n}
                </button>
              ))}
            </div>
          )}
        </div>

        <div ref={listRef} className="min-h-[120px] flex-1 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">
              {query.trim() ? `No ledger matches “${query.trim()}”.` : "No ledgers available."}
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.nature}>
                <p className="sticky top-0 z-10 bg-slate-50/95 px-5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {group.nature}
                </p>
                {group.items.map(({ ledger, index }) => {
                  const isActive = index === safeActive;
                  const isSelected = ledger.id === selectedId;
                  return (
                    <button
                      key={ledger.id}
                      type="button"
                      data-index={index}
                      onMouseMove={() => {
                        if (!isActive) setActiveIndex(index);
                      }}
                      onClick={() => choose(ledger)}
                      className={cn(
                        "flex w-full items-center gap-3 px-5 py-2 text-left text-sm transition-colors",
                        isActive ? "bg-emerald-50" : "bg-white",
                      )}
                    >
                      <span className="w-14 shrink-0 font-mono text-xs font-bold text-slate-500">{ledger.code}</span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate", isSelected ? "font-bold text-emerald-800" : "font-medium text-slate-900")}>
                          {ledger.name}
                        </span>
                        {ledger.category && (
                          <span className="block truncate text-[11px] text-slate-400">{ledger.category}</span>
                        )}
                      </span>
                      {(ledger.isBankAccount || ledger.isCashAccount) && (
                        <span className="shrink-0 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-sky-700">
                          {ledger.isBankAccount ? "Bank" : "Cash"}
                        </span>
                      )}
                      {isSelected && <Check className="h-4 w-4 shrink-0 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-5 py-2 text-[11px] text-slate-500">
          <span>
            {filtered.length} of {ledgers.length} ledgers
          </span>
          <span className="hidden sm:inline">↑ ↓ to navigate · Enter to select · Esc to close</span>
        </div>
      </div>
    </div>
  );
}
