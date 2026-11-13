import type { PlatformAccessGroup } from "@/services/platform";

type PathEntry = { path: string; key: string };

let pathEntries: PathEntry[] = [];

/** Register page paths from GET /api/platform/modules (longest path wins when matching). */
export function registerAccessPages(groups: PlatformAccessGroup[]) {
  pathEntries = groups
    .flatMap((g) =>
      g.pages
        .filter((p): p is typeof p & { path: string } => Boolean(p.path))
        .map((p) => ({ path: p.path.split("?")[0], key: p.key })),
    )
    .sort((a, b) => b.path.length - a.path.length);
}

export function registeredPageKeyForPath(pathname: string | null | undefined): string | null {
  if (!pathname) return null;
  const path = pathname.split("?")[0];
  for (const entry of pathEntries) {
    if (path === entry.path || path.startsWith(`${entry.path}/`)) return entry.key;
  }
  return null;
}

export function hasRegisteredAccessPages(): boolean {
  return pathEntries.length > 0;
}
