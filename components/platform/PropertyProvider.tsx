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
import {
  clearActiveProperty,
  getActiveProperty,
  getCachedPermissions,
  setActiveProperty,
  setCachedPermissions,
  type PermissionLevel,
  type PropertySession,
} from "@/lib/property";
import { platformService } from "@/services/platform";

type PropertyContextValue = {
  property: PropertySession | null;
  permissions: Record<string, PermissionLevel>;
  loading: boolean;
  setProperty: (p: PropertySession | null) => void;
  refreshPermissions: () => Promise<void>;
  canRead: (moduleKey: string) => boolean;
  canWrite: (moduleKey: string) => boolean;
};

const PropertyContext = createContext<PropertyContextValue | null>(null);

export function PropertyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [property, setPropertyState] = useState<PropertySession | null>(null);
  const [permissions, setPermissions] = useState<Record<string, PermissionLevel>>(
    {},
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPropertyState(getActiveProperty());
    setPermissions(getCachedPermissions() ?? {});
    setLoading(false);
  }, []);

  const refreshPermissions = useCallback(async () => {
    if (!property?.id) {
      setPermissions({});
      setCachedPermissions(null);
      return;
    }
    try {
      const perms = await platformService.myPermissions(property.id);
      setPermissions(perms);
      setCachedPermissions(perms);
    } catch {
      if (user?.isSuperAdmin) {
        const all = Object.fromEntries(
          [
            "dashboard",
            "front_office",
            "food_beverages",
            "housekeeping",
            "purchase_stores",
            "human_resources",
            "accounts",
            "sales_marketing",
            "system_settings",
          ].map((k) => [k, "admin" as const]),
        );
        setPermissions(all);
        setCachedPermissions(all);
      }
    }
  }, [property?.id, user?.isSuperAdmin]);

  useEffect(() => {
    if (!user || !property?.id) return;
    void refreshPermissions();
  }, [user, property?.id, refreshPermissions]);

  const setProperty = useCallback((p: PropertySession | null) => {
    setPropertyState(p);
    setActiveProperty(p);
    if (!p) {
      setPermissions({});
      setCachedPermissions(null);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      clearActiveProperty();
      setPropertyState(null);
      setPermissions({});
    }
  }, [user]);

  const canRead = useCallback(
    (moduleKey: string) => {
      if (user?.isSuperAdmin) return true;
      const level = permissions[moduleKey];
      return level === "read" || level === "write" || level === "admin";
    },
    [permissions, user?.isSuperAdmin],
  );

  const canWrite = useCallback(
    (moduleKey: string) => {
      if (user?.isSuperAdmin) return true;
      const level = permissions[moduleKey];
      return level === "write" || level === "admin";
    },
    [permissions, user?.isSuperAdmin],
  );

  const value = useMemo(
    () => ({
      property,
      permissions,
      loading,
      setProperty,
      refreshPermissions,
      canRead,
      canWrite,
    }),
    [property, permissions, loading, setProperty, refreshPermissions, canRead, canWrite],
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
