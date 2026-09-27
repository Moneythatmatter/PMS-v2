"use client";

import { useEffect, useRef } from "react";
import { dismissToastSilent, toast, type ToastVariant } from "@/components/ui/toast";

interface AlertBannerProps {
  variant: ToastVariant;
  message: string;
  onDismiss?: () => void;
  /** Auto-hide after ms. Defaults follow global toast (error ~5.2s). Set 0 to keep until dismissed. */
  autoDismissMs?: number;
  className?: string;
}

/**
 * Compatibility shim — previously an inline banner.
 * Now forwards into the global floating toast (top-right).
 */
export function AlertBanner({
  variant,
  message,
  onDismiss,
  autoDismissMs,
}: AlertBannerProps) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const toastIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!message?.trim()) return;

    const id = toast.show({
      message,
      variant,
      duration: autoDismissMs,
      onDismiss: () => onDismissRef.current?.(),
    });
    toastIdRef.current = id;

    return () => {
      if (toastIdRef.current === id) {
        toastIdRef.current = null;
        dismissToastSilent(id);
      }
    };
  }, [message, variant, autoDismissMs]);

  return null;
}
