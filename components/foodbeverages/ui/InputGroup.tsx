import React from "react";
import { cn } from "@/lib/utils";

export const GROUP_INPUT =
  "h-full w-full min-w-0 bg-transparent px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none";

export function InputGroup({
  prefix,
  suffix,
  invalid,
  className,
  children,
}: {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  invalid?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const addon = (content: React.ReactNode, side: "left" | "right") =>
    typeof content === "string" ? (
      <span
        className={cn(
          "flex shrink-0 items-center bg-slate-50 px-3 text-sm font-medium text-slate-500",
          side === "left" ? "border-r border-slate-200" : "border-l border-slate-200",
        )}
      >
        {content}
      </span>
    ) : (
      content
    );
  return (
    <div
      className={cn(
        "flex h-9 overflow-hidden rounded-lg border bg-white transition focus-within:ring-1",
        invalid
          ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-300"
          : "border-slate-200 focus-within:border-slate-400 focus-within:ring-slate-400",
        className,
      )}
    >
      {prefix !== undefined && addon(prefix, "left")}
      {children}
      {suffix !== undefined && addon(suffix, "right")}
    </div>
  );
}
