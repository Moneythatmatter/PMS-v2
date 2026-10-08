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
