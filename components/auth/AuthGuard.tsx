"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { usePropertyOptional } from "@/components/platform/PropertyProvider";

const PUBLIC_PATHS = new Set(["/login"]);
const WORKSPACE_PATHS = /^\/properties(\/|$)/;

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const propertyCtx = usePropertyOptional();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/login";
  const isWorkspace = WORKSPACE_PATHS.test(pathname ?? "");
  const property = propertyCtx?.property ?? null;
  const propertyLoading = propertyCtx?.loading ?? false;

  useEffect(() => {
    if (loading || propertyLoading) return;

    if (!user && !isLogin && !PUBLIC_PATHS.has(pathname ?? "")) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/properties")}`);
      return;
    }

    if (user && isLogin) {
      router.replace("/properties");
      return;
    }

    if (user && !isWorkspace && !property) {
      router.replace("/properties");
    }
  }, [user, loading, propertyLoading, isLogin, isWorkspace, property, pathname, router]);

  if (loading || propertyLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1220] text-sm text-slate-300">
        Loading…
      </div>
    );
  }

  if (!user && !isLogin) return null;
  if (user && isLogin) return null;
  if (user && !isWorkspace && !property) return null;

  return <>{children}</>;
}
