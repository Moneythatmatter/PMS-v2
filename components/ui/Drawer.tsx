"use client";

import React, { useEffect } from "react";
import { GripVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useResizablePanelWidth } from "@/lib/use-resizable-panel-width";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  /** Allow drag-resize from the left edge. Default true. */
  resizable?: boolean;
}

const widthKeys = {
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "xl",
} as const;

export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = "md",
  resizable = true,
}: DrawerProps) {
  const { panelWidth, onResizeStart, isResizing, resizable: canResize } =
    useResizablePanelWidth(isOpen, widthKeys[maxWidth], { enabled: resizable });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in-50">
      <div
        style={canResize ? { width: panelWidth, maxWidth: "60vw" } : undefined}
        className={cn(
          "relative flex h-full w-full flex-col justify-between overflow-y-auto bg-white shadow-2xl animate-in slide-in-from-right duration-200",
          !canResize && maxWidth === "sm" && "max-w-sm",
          !canResize && maxWidth === "md" && "max-w-md",
          !canResize && maxWidth === "lg" && "max-w-lg",
          !canResize && maxWidth === "xl" && "max-w-xl",
          !isResizing && canResize && "transition-[width] duration-200",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {canResize && (
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

        <div>
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2">
              {icon}
              <div>
                <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                {subtitle && (
                  <p className="text-[11px] font-medium text-slate-500">{subtitle}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4 p-5">{children}</div>
        </div>

        {footer && (
          <div className="sticky bottom-0 z-10 border-t border-slate-200 bg-slate-50 p-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
