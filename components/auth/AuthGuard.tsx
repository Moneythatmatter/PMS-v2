"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldOff } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { usePropertyOptional } from "@/components/platform/PropertyProvider";
import { MODULE_ROUTES, moduleRouteForPath } from "@/lib/module-access";

const PUBLIC_PATHS = new Set(["/login"]);
const WORKSPACE_PATHS = /^\/properties(\/|$)/;

function FullScreenMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b1220] text-sm text-slate-300">
      {children}
    </div>
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const propertyCtx = usePropertyOptional();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/login";
  const isWorkspace = WORKSPACE_PATHS.test(pathname ?? "");
  const property = propertyCtx?.property ?? null;
  const propertyLoading = propertyCtx?.loading ?? false;
  const permissionsReady = propertyCtx?.permissionsReady ?? true;
  const firstAllowedRoute = propertyCtx?.firstAllowedRoute ?? null;

  const moduleRoute = moduleRouteForPath(pathname);
  const checkModule = Boolean(user && property && !isWorkspace && moduleRoute);
  const moduleDenied =
    checkModule && permissionsReady && !!moduleRoute && !propertyCtx?.canRead(moduleRoute.key);
  const redirectToAllowed =
    moduleDenied && moduleRoute?.key === "dashboard" && !!firstAllowedRoute;

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
      return;
    }

    if (redirectToAllowed && firstAllowedRoute) {
      router.replace(firstAllowedRoute);
    }
  }, [
    user,
    loading,
    propertyLoading,
    isLogin,
    isWorkspace,
    property,
    pathname,
    router,
    redirectToAllowed,
    firstAllowedRoute,
  ]);

  if (loading || propertyLoading) return <FullScreenMessage>Loading…</FullScreenMessage>;

  if (!user && !isLogin) return null;
  if (user && isLogin) return null;
  if (user && !isWorkspace && !property) return null;

  if (checkModule && !permissionsReady) {
    return <FullScreenMessage>Checking access…</FullScreenMessage>;
  }
  if (redirectToAllowed) return null;

  if (moduleDenied && moduleRoute) {
    const allowedLabel = MODULE_ROUTES.find((m) => m.home === firstAllowedRoute)?.label;
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8f7] px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <ShieldOff className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-lg font-semibold text-slate-900">No access to {moduleRoute.label}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {firstAllowedRoute
              ? `You don't have permission to open ${moduleRoute.label} for ${property?.name ?? "this property"}. Ask an administrator if you need access.`
              : `You don't have access to any module for ${property?.name ?? "this property"}. Ask an administrator to grant module permissions.`}
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            {firstAllowedRoute && (
              <Link
                href={firstAllowedRoute}
                className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
              >
                Go to {allowedLabel}
              </Link>
            )}
            <Link
              href="/properties"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Switch property
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
