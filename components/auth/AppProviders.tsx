"use client";

import { useEffect } from "react";
import { AuthProvider } from "./AuthProvider";
import { AuthGuard } from "./AuthGuard";
import { PropertyProvider } from "@/components/platform/PropertyProvider";
import { clearNonAuthStorage } from "@/lib/clear-non-auth-storage";

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    clearNonAuthStorage();
  }, []);

  return (
    <AuthProvider>
      <PropertyProvider>
        <AuthGuard>{children}</AuthGuard>
      </PropertyProvider>
    </AuthProvider>
  );
}
