"use client";

import { useEffect, useRef } from "react";
import { GripVertical, Maximize2, Minimize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useResizablePanelWidth } from "@/lib/use-resizable-panel-width";

const SHEET_HEIGHT_KEY = "pms.drawer.sheetHeight";
const SHEET_MIN_PX = 320;
const SHEET_MAX_FRACTION = 0.95;

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  customHeader?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "responsive" | string;
  fullScreen?: boolean;
  onToggleFullScreen?: () => void;
  className?: string;
  /** Allow drag-resize from the left edge. Default true. Ignored for bottom sheets. */
  resizable?: boolean;
  /** Edge the panel slides in from. "bottom" renders a full-width sheet. */
  side?: "right" | "bottom";
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  customHeader,
  children,
  footer,
  width = "md",
  fullScreen = false,
  onToggleFullScreen,
  className,
  resizable = true,
  side = "right",
}: DrawerProps) {
  const isBottom = side === "bottom" && !fullScreen;
  const widthKey = fullScreen || isBottom ? undefined : width;
  const { panelWidth, onResizeStart, isResizing, resizable: canResize } =
    useResizablePanelWidth(open, widthKey, { enabled: resizable && !fullScreen && !isBottom });
  const contentWidth = isBottom ? "mx-auto w-full max-w-7xl" : undefined;
  const panelRef = useRef<HTMLDivElement>(null);

  // Sheet height is applied straight to the DOM so dragging doesn't re-render the form.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !isBottom || !open) return;
    const saved = Number(window.localStorage.getItem(SHEET_HEIGHT_KEY));
    if (saved > 0 && saved <= SHEET_MAX_FRACTION) panel.style.height = `${saved * 100}vh`;
  }, [open, isBottom]);

  const onSheetResizeStart = (e: React.PointerEvent<HTMLButtonElement>) => {
    const panel = panelRef.current;
    if (!panel) return;
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = panel.getBoundingClientRect().height;
    const previousTransition = panel.style.transition;
    panel.style.transition = "none";
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    const onMove = (ev: PointerEvent) => {
      const max = window.innerHeight * SHEET_MAX_FRACTION;
      const next = Math.min(max, Math.max(Math.min(SHEET_MIN_PX, max), startHeight + (startY - ev.clientY)));
      panel.style.height = `${next}px`;
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      panel.style.transition = previousTransition;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      const fraction = panel.getBoundingClientRect().height / window.innerHeight;
      panel.style.height = `${fraction * 100}vh`;
      window.localStorage.setItem(SHEET_HEIGHT_KEY, fraction.toFixed(3));
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const resetSheetHeight = () => {
    if (panelRef.current) panelRef.current.style.height = "";
    window.localStorage.removeItem(SHEET_HEIGHT_KEY);
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-50 m-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 h-full",
          isBottom && "lg:group-data-[workspace-sidebar]/shell:left-64",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden={!open}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        style={
          fullScreen || isBottom || !canResize
            ? undefined
            : { width: panelWidth, maxWidth: "min(60vw, 100vw)" }
        }
        className={cn(
          // m-0: parents using space-y-* would otherwise push the fixed panel off the screen edge.
          "fixed z-50 m-0 flex flex-col bg-white shadow-2xl",
          !isBottom && "w-full max-w-full sm:max-w-none",
          !isBottom && "h-full",
          !isResizing && "transition-all duration-300 ease-out",
          fullScreen
            ? "inset-0 border-0"
            : isBottom
              ? "inset-x-0 bottom-0 h-[80vh] overflow-hidden rounded-t-2xl border-t border-slate-200 lg:group-data-[module-sidebar]/shell:left-16 lg:group-data-[workspace-sidebar]/shell:left-64"
              : cn(
              "inset-y-0 right-0 border-l border-slate-200",
              !canResize && width === "sm" && "w-full max-w-sm",
              !canResize && width === "md" && "w-full max-w-md",
              !canResize && width === "lg" && "w-full max-w-lg",
              !canResize && width === "xl" && "w-full max-w-2xl",
              !canResize && width === "2xl" && "w-full max-w-4xl",
              !canResize && width === "3xl" && "w-full max-w-6xl",
              !canResize &&
              width === "responsive" &&
              "w-full md:w-[85vw] lg:w-[70vw] xl:w-[65vw]",
              !canResize &&
              typeof width === "string" &&
              !["sm", "md", "lg", "xl", "2xl", "3xl", "responsive"].includes(width) &&
              width,
            ),
          isBottom
            ? open
              ? "translate-y-0"
              : "translate-y-full"
            : open
              ? "translate-x-0"
              : "translate-x-full",
          className,
        )}
      >
        {isBottom && (
          <button
            type="button"
            aria-label="Resize panel height"
            title="Drag to resize · double-click to reset"
            onPointerDown={onSheetResizeStart}
            onDoubleClick={resetSheetHeight}
            className="group flex h-4 w-full shrink-0 cursor-row-resize touch-none items-center justify-center bg-white"
          >
            <span className="h-1 w-10 rounded-full bg-slate-300 transition-colors group-hover:w-14 group-hover:bg-emerald-400 group-active:bg-emerald-500" />
          </button>
        )}
        {canResize && !fullScreen && !isBottom && (
          <button
            type="button"
            aria-label="Resize drawer"
            onMouseDown={onResizeStart}
            className={cn(
              "group absolute -left-2 top-0 z-30 flex h-full w-4 cursor-col-resize items-center justify-center border-0 bg-transparent p-0",
              isResizing && "bg-emerald-500/10",
            )}
          >
            <span
              className={cn(
                "flex h-14 w-1.5 items-center justify-center rounded-full bg-slate-200 transition-colors",
                "group-hover:bg-emerald-400 group-active:bg-emerald-500",
                isResizing && "bg-emerald-500",
              )}
            >
              <GripVertical className="h-3 w-3 text-slate-500 opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
          </button>
        )}

        <div className={cn("sticky top-0 z-20 shrink-0 border-b border-slate-100 bg-white px-6", isBottom ? "py-3" : "py-4")}>
          <div className={cn("flex items-center justify-between gap-4", contentWidth)}>
          <div className="min-w-0 flex-1">
            {customHeader ? (
              customHeader
            ) : (
              <>
                <h2 id="drawer-title" className="truncate text-lg font-bold text-slate-900">
                  {title}
                </h2>
                {description && (
                  <p className="mt-0.5 text-sm text-slate-500">{description}</p>
                )}
              </>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {onToggleFullScreen && (
              <button
                type="button"
                onClick={onToggleFullScreen}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label={fullScreen ? "Exit full screen" : "Full screen"}
                title={fullScreen ? "Exit full screen" : "Full screen"}
              >
                {fullScreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex cursor-pointer items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
              <span>Close</span>
            </button>
          </div>
          </div>
        </div>

        <div className={cn("flex-1 overflow-y-auto px-5 py-5", (fullScreen || isBottom) && "bg-slate-50")}>
          {contentWidth ? <div className={contentWidth}>{children}</div> : children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-4">
            <div className={cn("flex flex-wrap items-center justify-end gap-2", contentWidth)}>{footer}</div>
          </div>
        )}
      </div>
    </>
  );
}
