import type { PermissionLevel } from "@/lib/property";
import { registeredPageKeyForPath } from "@/lib/page-access-registry";

export type ModuleKey =
  | "dashboard"
  | "front_office"
  | "food_beverages"
  | "housekeeping"
  | "purchase_stores"
  | "human_resources"
  | "accounts"
  | "sales_marketing"
  | "maintenance";

export const MODULE_KEYS: ModuleKey[] = [
  "dashboard",
  "front_office",
  "food_beverages",
  "housekeeping",
  "purchase_stores",
  "human_resources",
  "accounts",
  "sales_marketing",
  "maintenance",
];

type ModuleRoute = { key: ModuleKey; label: string; prefix: string; home: string };

/** Order matters: the first permitted entry is where users land after opening a property. */
export const MODULE_ROUTES: ModuleRoute[] = [
  { key: "dashboard", label: "Dashboard", prefix: "/dashboard", home: "/dashboard" },
  { key: "front_office", label: "Front Office", prefix: "/frontoffice", home: "/frontoffice/dashboard" },
  { key: "food_beverages", label: "Food & Beverages", prefix: "/food-beverages", home: "/food-beverages" },
  { key: "housekeeping", label: "Housekeeping", prefix: "/housekeeping", home: "/housekeeping" },
  { key: "purchase_stores", label: "Purchase & Stores", prefix: "/purchase-stores", home: "/purchase-stores" },
  { key: "human_resources", label: "Human Resource", prefix: "/human-resources", home: "/human-resources/dashboard" },
  { key: "accounts", label: "Accounts", prefix: "/accounts", home: "/accounts" },
  { key: "sales_marketing", label: "Sales & Marketing", prefix: "/sales-marketing", home: "/sales-marketing/dashboard" },
  { key: "maintenance", label: "Maintenance", prefix: "/maintenance", home: "/maintenance" },
];

export function moduleRouteForPath(pathname: string | null | undefined): ModuleRoute | null {
  if (!pathname) return null;
  return (
    MODULE_ROUTES.find(
      (m) => pathname === m.prefix || pathname.startsWith(`${m.prefix}/`),
    ) ?? null
  );
}

export function levelAllowsRead(level?: PermissionLevel | "" | null): boolean {
  return level === "read" || level === "write" || level === "admin";
}

export function levelAllowsWrite(level?: PermissionLevel | "" | null): boolean {
  return level === "write" || level === "admin";
}

/**
 * Resolve the page key required for a path.
 * Prefers registered catalog paths (named pages); falls back to module / workspace keys.
 */
export function pageKeyForPath(pathname: string | null | undefined): string | null {
  if (!pathname) return null;
  const path = pathname.split("?")[0];

  const registered = registeredPageKeyForPath(path);
  if (registered) return registered;

  if (path === "/properties" || path === "/properties/") return "workspace.properties";
  if (path === "/properties/dashboard" || path.startsWith("/properties/dashboard/")) {
    return "workspace.dashboard";
  }
  if (path === "/properties/reports" || path.startsWith("/properties/reports")) {
    return "workspace.reports";
  }
  if (path === "/properties/users" || path.startsWith("/properties/users/")) {
    return "workspace.user_management";
  }
  if (path === "/properties/roles" || path.startsWith("/properties/roles/")) {
    return "workspace.roles";
  }

  const mod = moduleRouteForPath(path);
  if (!mod) return null;
  return mod.key;
}

/** Parent module key covers child page keys (front_office → front_office.dashboard). */
export function permissionCovers(
  permissions: Record<string, PermissionLevel | undefined>,
  pageKey: string,
): boolean {
  if (levelAllowsRead(permissions[pageKey])) return true;
  const dot = pageKey.indexOf(".");
  if (dot > 0) {
    const parent = pageKey.slice(0, dot);
    if (parent !== "workspace" && levelAllowsRead(permissions[parent])) return true;
  }
  return false;
}

/** Module appears in TopNav if full module or any page under it is granted. */
export function moduleVisible(
  permissions: Record<string, PermissionLevel | undefined>,
  moduleKey: string,
): boolean {
  if (levelAllowsRead(permissions[moduleKey])) return true;
  const prefix = `${moduleKey}.`;
  return Object.entries(permissions).some(
    ([key, level]) => key.startsWith(prefix) && levelAllowsRead(level),
  );
}
