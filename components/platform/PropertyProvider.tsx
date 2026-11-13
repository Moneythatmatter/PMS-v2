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
import {
  MODULE_ROUTES,
  levelAllowsRead,
  levelAllowsWrite,
  moduleVisible,
  permissionCovers,
} from "@/lib/module-access";
import {
  ACTIVE_PROPERTY_KEY,
  clearActiveProperty,
  getActiveProperty,
  getCachedPermissions,
  setActiveProperty,
  setCachedPermissions,
  type CachedPermissions,
  type PermissionLevel,
  type PropertySession,
} from "@/lib/property";
import { registerAccessPages } from "@/lib/page-access-registry";
import { platformService } from "@/services/platform";

type PropertyContextValue = {
  property: PropertySession | null;
  permissions: Record<string, PermissionLevel>;
  /** True once permissions for the active property (or workspace baseline) are known. */
  permissionsReady: boolean;
  isAdmin: boolean;
  loading: boolean;
  setProperty: (p: PropertySession | null) => void;
  refreshPermissions: () => Promise<void>;
  canRead: (moduleKey: string) => boolean;
  canWrite: (moduleKey: string) => boolean;
  /** True if the module should appear in TopNav (full module or any page grant). */
  canSeeModule: (moduleKey: string) => boolean;
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
  /** Workspace page grants loaded even when no property is selected yet. */
  const [workspacePerms, setWorkspacePerms] = useState<Record<string, PermissionLevel>>({});
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const isAdmin = isPlatformAdmin(user);
  const propertyId = property?.id ?? null;

  const loadPermissions = useCallback(async (id: string) => {
    try {
      const perms = await platformService.myPermissions(id);
      const next = { propertyId: id, perms };
      setLoaded(next);
      setCachedPermissions(next);
      const ws: Record<string, PermissionLevel> = {};
      for (const [k, v] of Object.entries(perms)) {
        if (k.startsWith("workspace.")) ws[k] = v;
      }
      setWorkspacePerms(ws);
      setWorkspaceReady(true);
    } catch {
      setLoaded((prev) => (prev?.propertyId === id ? prev : { propertyId: id, perms: {} }));
      setWorkspaceReady(true);
    }
  }, []);

  const refreshPermissions = useCallback(async () => {
    if (propertyId) await loadPermissions(propertyId);
  }, [propertyId, loadPermissions]);

  // Load named page catalog once per session (for path → page key matching).
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    platformService
      .listModules()
      .then((groups) => {
        if (!cancelled) registerAccessPages(groups);
      })
      .catch(() => {
        /* keep previous registry */
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

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
        const ws: Record<string, PermissionLevel> = {};
        for (const [k, v] of Object.entries(perms)) {
          if (k.startsWith("workspace.")) ws[k] = v;
        }
        setWorkspacePerms(ws);
        setWorkspaceReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setLoaded((prev) =>
          prev?.propertyId === propertyId ? prev : { propertyId, perms: {} },
        );
        setWorkspaceReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user, propertyId]);

  // Without an active property, still load workspace grants from the first available property.
  useEffect(() => {
    if (!user || isAdmin || propertyId) {
      if (isAdmin) setWorkspaceReady(true);
      return;
    }
    let cancelled = false;
    platformService
      .listProperties()
      .then(async (props) => {
        const id = props.find((p) => p.isDefault)?.id ?? props[0]?.id;
        if (!id) {
          if (!cancelled) {
            setWorkspacePerms({});
            setWorkspaceReady(true);
          }
          return;
        }
        const perms = await platformService.myPermissions(id);
        if (cancelled) return;
        const ws: Record<string, PermissionLevel> = {};
        for (const [k, v] of Object.entries(perms)) {
          if (k.startsWith("workspace.")) ws[k] = v;
        }
        setWorkspacePerms(ws);
        setWorkspaceReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setWorkspacePerms({});
          setWorkspaceReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user, isAdmin, propertyId]);

  const setProperty = useCallback((p: PropertySession | null) => {
    setPropertyState(p);
    setActiveProperty(p);
    setLoaded((prev) => (p && prev?.propertyId === p.id ? prev : null));
    if (!p) setCachedPermissions(null);
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== ACTIVE_PROPERTY_KEY) return;
      const nextId = getActiveProperty()?.id ?? null;
      if (nextId && nextId !== propertyId) window.location.reload();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [propertyId]);

  const signedOut = !authLoading && !user;
  const [wasSignedOut, setWasSignedOut] = useState(false);
  if (signedOut !== wasSignedOut) {
    setWasSignedOut(signedOut);
    if (signedOut) {
      setPropertyState(null);
      setLoaded(null);
      setWorkspacePerms({});
      setWorkspaceReady(false);
    }
  }

  useEffect(() => {
    if (!signedOut) return;
    clearActiveProperty();
    setCachedPermissions(null);
  }, [signedOut]);

  const propertyPerms = useMemo(
    () => (loaded && loaded.propertyId === property?.id ? loaded.perms : {}),
    [loaded, property?.id],
  );

  const permissions = useMemo(
    () => ({ ...workspacePerms, ...propertyPerms }),
    [workspacePerms, propertyPerms],
  );

  const permissionsReady =
    isAdmin ||
    (property?.id ? loaded?.propertyId === property.id : workspaceReady);

  const canRead = useCallback(
    (moduleKey: string) => {
      if (isAdmin) return true;
      // Properties list is the landing page — always allow when logged in.
      if (moduleKey === "workspace.properties") return true;
      if (moduleKey === "workspace.dashboard" || moduleKey === "workspace.reports") {
        if (permissionCovers(permissions, moduleKey)) return true;
        // Legacy: no workspace.* grants yet → keep previous open access
        const hasWorkspaceRows = Object.keys(permissions).some((k) => k.startsWith("workspace."));
        return !hasWorkspaceRows;
      }
      if (moduleKey.startsWith("workspace.") || moduleKey.includes(".")) {
        return permissionCovers(permissions, moduleKey);
      }
      // Bare module key = "All pages" only (not child dashboard/reports grants)
      return levelAllowsRead(permissions[moduleKey]);
    },
    [permissions, isAdmin],
  );

  const canWrite = useCallback(
    (moduleKey: string) => {
      if (isAdmin) return true;
      if (levelAllowsWrite(permissions[moduleKey])) return true;
      const dot = moduleKey.indexOf(".");
      if (dot > 0) {
        const parent = moduleKey.slice(0, dot);
        if (parent !== "workspace" && levelAllowsWrite(permissions[parent])) return true;
      }
      return false;
    },
    [permissions, isAdmin],
  );

  const canSeeModule = useCallback(
    (moduleKey: string) => {
      if (isAdmin) return true;
      return moduleVisible(permissions, moduleKey);
    },
    [permissions, isAdmin],
  );

  const firstAllowedRoute = useMemo(() => {
    for (const m of MODULE_ROUTES) {
      if (canRead(m.key)) return m.home;
      if (m.key !== "dashboard" && canRead(`${m.key}.dashboard`)) return m.home;
    }
    return null;
  }, [canRead]);

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
      canSeeModule,
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
      canSeeModule,
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
