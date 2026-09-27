"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info";

export type ToastInput = {
  message: string;
  variant?: ToastVariant;
  /** Auto-dismiss duration in ms. Default: success 3200, info 4000, error 5200. Pass 0 to keep until dismissed. */
  duration?: number;
  /** Called when toast is dismissed (auto or manual). */
  onDismiss?: () => void;
};

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
  onDismiss?: () => void;
  createdAt: number;
};

type ToastApi = {
  show: (input: ToastInput | string) => string;
  success: (message: string, opts?: Omit<ToastInput, "message" | "variant">) => string;
  error: (message: string, opts?: Omit<ToastInput, "message" | "variant">) => string;
  info: (message: string, opts?: Omit<ToastInput, "message" | "variant">) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 3200,
  info: 4000,
  error: 5200,
};

const VARIANT_UI: Record<
  ToastVariant,
  {
    icon: typeof CheckCircle2;
    accent: string;
    iconWrap: string;
    progress: string;
    label: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    accent: "border-l-emerald-500",
    iconWrap: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    progress: "bg-emerald-500",
    label: "Success",
  },
  error: {
    icon: AlertCircle,
    accent: "border-l-red-500",
    iconWrap: "bg-red-50 text-red-600 ring-red-100",
    progress: "bg-red-500",
    label: "Error",
  },
  info: {
    icon: Info,
    accent: "border-l-sky-500",
    iconWrap: "bg-sky-50 text-sky-600 ring-sky-100",
    progress: "bg-sky-500",
    label: "Info",
  },
};

type Listener = (items: ToastItem[]) => void;

let memoryToasts: ToastItem[] = [];
const listeners = new Set<Listener>();
let idSeq = 0;

function emit() {
  for (const listener of listeners) listener([...memoryToasts]);
}

function normalizeInput(input: ToastInput | string): Required<
  Pick<ToastInput, "message" | "variant">
> &
  Pick<ToastInput, "duration" | "onDismiss"> {
  if (typeof input === "string") {
    return { message: input, variant: "info" };
  }
  return {
    message: input.message,
    variant: input.variant ?? "info",
    duration: input.duration,
    onDismiss: input.onDismiss,
  };
}

function pushToast(input: ToastInput | string): string {
  const normalized = normalizeInput(input);
  const variant = normalized.variant;
  const message = normalized.message.trim();
  if (!message) return "";

  // Dedupe identical toast within 400ms (Strict Mode remounts / double submit)
  const recent = memoryToasts.find(
    (t) =>
      t.message === message &&
      t.variant === variant &&
      Date.now() - t.createdAt < 400,
  );
  if (recent) {
    if (normalized.onDismiss && !recent.onDismiss) {
      recent.onDismiss = normalized.onDismiss;
    }
    return recent.id;
  }

  const id = `toast-${Date.now()}-${++idSeq}`;
  const item: ToastItem = {
    id,
    message,
    variant,
    duration: normalized.duration ?? DEFAULT_DURATION[variant],
    onDismiss: normalized.onDismiss,
    createdAt: Date.now(),
  };
  memoryToasts = [item, ...memoryToasts].slice(0, 5);
  emit();
  return id;
}

function dismissToast(id: string, opts?: { silent?: boolean }) {
  const target = memoryToasts.find((t) => t.id === id);
  if (!target) return;
  memoryToasts = memoryToasts.filter((t) => t.id !== id);
  emit();
  if (opts?.silent) return;
  try {
    target.onDismiss?.();
  } catch {
    // ignore listener errors
  }
}

function clearToasts() {
  const closing = [...memoryToasts];
  memoryToasts = [];
  emit();
  for (const t of closing) {
    try {
      t.onDismiss?.();
    } catch {
      // ignore
    }
  }
}

/** Imperative toast API — usable outside React components. */
export const toast: ToastApi = {
  show: pushToast,
  success: (message, opts) =>
    pushToast({ message, variant: "success", ...opts }),
  error: (message, opts) =>
    pushToast({ message, variant: "error", ...opts }),
  info: (message, opts) =>
    pushToast({ message, variant: "info", ...opts }),
  dismiss: (id: string) => dismissToast(id),
  clear: clearToasts,
};

/** @internal — silent dismiss for AlertBanner unmount cleanup */
export function dismissToastSilent(id: string) {
  dismissToast(id, { silent: true });
}

const ToastContext = createContext<ToastApi>(toast);

export function useToast() {
  return useContext(ToastContext);
}

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const ui = VARIANT_UI[item.variant];
  const Icon = ui.icon;
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const dismissed = useRef(false);

  const close = useCallback(() => {
    if (dismissed.current) return;
    dismissed.current = true;
    setLeaving(true);
    window.setTimeout(() => onDismiss(item.id), 180);
  }, [item.id, onDismiss]);

  useEffect(() => {
    const enter = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(enter);
  }, []);

  useEffect(() => {
    if (!item.duration) return;
    const id = window.setTimeout(close, item.duration);
    return () => window.clearTimeout(id);
  }, [item.duration, close]);

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto relative w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-slate-200/80 border-l-4 bg-white shadow-[0_12px_40px_-12px_rgba(15,23,42,0.35)] transition-all duration-200 ease-out",
        ui.accent,
        visible && !leaving
          ? "translate-x-0 opacity-100"
          : "translate-x-6 opacity-0",
      )}
    >
      <div className="flex items-start gap-3 px-3.5 py-3">
        <span
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1",
            ui.iconWrap,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {ui.label}
          </p>
          <p className="mt-0.5 text-sm font-medium leading-snug text-slate-800">
            {item.message}
          </p>
        </div>
        <button
          type="button"
          onClick={close}
          className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {item.duration > 0 ? (
        <div className="h-0.5 w-full bg-slate-100">
          <div
            className={cn("h-full origin-left", ui.progress)}
            style={{
              animation: `toast-progress ${item.duration}ms linear forwards`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function ToastViewport() {
  const [items, setItems] = useState<ToastItem[]>(memoryToasts);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    listeners.add(setItems);
    setItems([...memoryToasts]);
    return () => {
      listeners.delete(setItems);
    };
  }, []);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-end gap-2 p-4 sm:p-5"
      aria-live="polite"
      aria-relevant="additions"
    >
      <style>{`
        @keyframes toast-progress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
      {items.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={dismissToast} />
      ))}
    </div>,
    document.body,
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const api = useMemo(() => toast, []);
  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  );
}
