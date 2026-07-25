"use client";

import { AuthProvider } from "./AuthProvider";
import { AuthGuard } from "./AuthGuard";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>{children}</AuthGuard>
    </AuthProvider>
  );
}
