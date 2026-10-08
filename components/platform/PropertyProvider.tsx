"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { isPlatformAdmin } from "@/lib/auth";
import { MODULE_ROUTES } from "@/lib/module-access";
import {
  clearActiveProperty,
  getActiveProperty,
  getCachedPermissions,
  setActiveProperty,
  setCachedPermissions,
  type CachedPermissions,
  type PermissionLevel,
  type PropertySession,
} from "@/lib/property";
import { platformService } from "@/services/platform";

type PropertyContextValue = {
  property: PropertySession | null;
  permissions: Record<string, PermissionLevel>;
  /** True once permissions for the active property are known. */
  permissionsReady: boolean;
  isAdmin: boolean;
  loading: boolean;
  setProperty: (p: PropertySession | null) => void;
  refreshPermissions: () => Promise<void>;
  canRead: (moduleKey: string) => boolean;
  canWrite: (moduleKey: string) => boolean;
  /** Home route of the first module the user can open, or null if none. */
  firstAllowedRoute: string | null;
};

const PropertyContext = createContext<PropertyContextValue | null>(null);

export function PropertyProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [property, setPropertyState] = useState<PropertySession | null>(() =>
    typeof window !== "undefined" ? getActiveProperty() : null,
  );
  const [loaded, setLoaded] = useState<CachedPermissions | null>(() =>
    typeof window !== "undefined" ? getCachedPermissions() : null,
  );
  const isAdmin = isPlatformAdmin(user);
  const propertyId = property?.id ?? null;

  const loadPermissions = useCallback(async (id: string) => {
    try {
      const perms = await platformService.myPermissions(id);
      const next = { propertyId: id, perms };
      setLoaded(next);
      setCachedPermissions(next);
    } catch {
      setLoaded((prev) => (prev?.propertyId === id ? prev : { propertyId: id, perms: {} }));
    }
  }, []);

  const refreshPermissions = useCallback(async () => {
    if (propertyId) await loadPermissions(propertyId);
  }, [propertyId, loadPermissions]);

  useEffect(() => {
    if (!user || !propertyId) return;
    let cancelled = false;
    platformService
      .myPermissions(propertyId)
      .then((perms) => {
        if (cancelled) return;
        const next = { propertyId, perms };
        setLoaded(next);
        setCachedPermissions(next);
      })
      .catch(() => {
        if (cancelled) return;
        setLoaded((prev) =>
          prev?.propertyId === propertyId ? prev : { propertyId, perms: {} },
        );
      });
    return () => {
      cancelled = true;
    };
  }, [user, propertyId]);

  const setProperty = useCallback((p: PropertySession | null) => {
    setPropertyState(p);
    setActiveProperty(p);
    setLoaded((prev) => (p && prev?.propertyId === p.id ? prev : null));
    if (!p) setCachedPermissions(null);
  }, []);

  const signedOut = !authLoading && !user;
  const [wasSignedOut, setWasSignedOut] = useState(false);
  if (signedOut !== wasSignedOut) {
    setWasSignedOut(signedOut);
    if (signedOut) {
      setPropertyState(null);
      setLoaded(null);
    }
  }

  useEffect(() => {
    if (!signedOut) return;
    clearActiveProperty();
    setCachedPermissions(null);
  }, [signedOut]);

  const permissions = useMemo(
    () => (loaded && loaded.propertyId === property?.id ? loaded.perms : {}),
    [loaded, property?.id],
  );
  const permissionsReady = isAdmin || (!!property?.id && loaded?.propertyId === property.id);

  const canRead = useCallback(
    (moduleKey: string) => {
      if (isAdmin) return true;
      const level = permissions[moduleKey];
      return level === "read" || level === "write" || level === "admin";
    },
    [permissions, isAdmin],
  );

  const canWrite = useCallback(
    (moduleKey: string) => {
      if (isAdmin) return true;
      const level = permissions[moduleKey];
      return level === "write" || level === "admin";
    },
    [permissions, isAdmin],
  );

  const firstAllowedRoute = useMemo(
    () => MODULE_ROUTES.find((m) => canRead(m.key))?.home ?? null,
    [canRead],
  );

  const value = useMemo(
    () => ({
      property,
      permissions,
      permissionsReady,
      isAdmin,
      loading: false,
      setProperty,
      refreshPermissions,
      canRead,
      canWrite,
      firstAllowedRoute,
    }),
    [
      property,
      permissions,
      permissionsReady,
      isAdmin,
      setProperty,
      refreshPermissions,
      canRead,
      canWrite,
      firstAllowedRoute,
    ],
  );

  return (
    <PropertyContext.Provider value={value}>{children}</PropertyContext.Provider>
  );
}

export function useProperty() {
  const ctx = useContext(PropertyContext);
  if (!ctx) throw new Error("useProperty must be used within PropertyProvider");
  return ctx;
}

export function usePropertyOptional() {
  return useContext(PropertyContext);
}
