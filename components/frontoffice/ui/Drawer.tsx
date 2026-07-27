"use client";

import { Maximize2, Minimize2, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
}: DrawerProps) {
  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden={!open}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={cn(
          "fixed z-50 flex flex-col bg-white shadow-2xl transition-all duration-300 ease-out",
          fullScreen
            ? "inset-0 border-0"
            : cn(
                "inset-y-0 right-0 border-l border-slate-200",
                width === "sm" && "w-full max-w-sm",
                width === "md" && "w-full max-w-md",
                width === "lg" && "w-full max-w-lg",
                width === "xl" && "w-full max-w-2xl",
                width === "2xl" && "w-full max-w-4xl",
                width === "3xl" && "w-full max-w-6xl",
                width === "responsive" && "w-full md:w-[85vw] lg:w-[70vw] xl:w-[65vw]",
                typeof width === "string" && !["sm","md","lg","xl","2xl","3xl","responsive"].includes(width) && width
              ),
          open ? "translate-x-0" : "translate-x-full",
          className
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-6 py-4 bg-white sticky top-0 z-20">
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
                {fullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
              <span>Close</span>
            </button>
          </div>
        </div>

        <div className={cn("flex-1 overflow-y-auto px-5 py-5", fullScreen && "bg-slate-50")}>
          {children}
        </div>

        {footer && (
          <div className="shrink-0 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-white px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
