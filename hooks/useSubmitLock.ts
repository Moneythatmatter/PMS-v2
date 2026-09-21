"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Prevents duplicate creates from double-clicks.
 * Use `saving` to disable submit buttons and show a spinner.
 */
export function useSubmitLock() {
  const [saving, setSaving] = useState(false);
  const lockRef = useRef(false);

  const runLocked = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (lockRef.current) return undefined;
    lockRef.current = true;
    setSaving(true);
    try {
      return await fn();
    } finally {
      lockRef.current = false;
      setSaving(false);
    }
  }, []);

  return { saving, runLocked };
}
