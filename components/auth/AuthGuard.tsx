"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/login";

  useEffect(() => {
    if (loading) return;
    if (!user && !isLogin) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/dasbboard")}`);
    }
    if (user && isLogin) {
      router.replace("/dasbboard");
    }
  }, [user, loading, isLogin, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1220] text-sm text-slate-300">
        Loading…
      </div>
    );
  }

  if (!user && !isLogin) return null;
  if (user && isLogin) return null;

  return <>{children}</>;
}
