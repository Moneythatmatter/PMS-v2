"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Link2, RefreshCw, Search, UserPlus, Users, UserCog } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { isPlatformAdmin } from "@/lib/auth";
import { WorkspaceShell } from "@/components/platform/WorkspaceShell";
import { Button } from "@/components/ui/Button";
import {
  platformService,
  type ManagedRoleDto,
  type ManagedUserDto,
  type PlatformAccessGroup,
  type PropertyDto,
} from "@/services/platform";
import { usePropertyOptional } from "@/components/platform/PropertyProvider";
import { registerAccessPages } from "@/lib/page-access-registry";
import { cn } from "@/lib/utils";
import { UserFormDrawer } from "./UserFormDrawer";
import { Avatar } from "./userUi";

type Tab = "all" | "unlinked";

/** Tenant Admin (and Super Admin) are not staff — hide from this list. */
function isHiddenOwnerAccount(u: { isSuperAdmin?: boolean; role?: string }) {
  if (u.isSuperAdmin) return true;
  const r = String(u.role ?? "").trim().toLowerCase();
  return r === "admin" || r === "administrator" || r === "super admin" || r === "superadmin";
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  tone: { wash: string; solid: string };
}) {
  return (
    <div
      className={cn(
        "relative min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br to-white to-60% p-4 shadow-sm",
        tone.wash,
      )}
    >
      <span className={cn("pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.08]", tone.solid)} />
      <div className="relative flex items-start justify-between gap-3">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm", tone.solid)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="relative -mt-1 text-[28px] font-bold leading-tight tracking-tight text-slate-900 tabular-nums">{value}</p>
      <p className="relative mt-1 truncate text-[11px] text-slate-500">{sub}</p>
    </div>
  );
}

export function UserManagementView() {
  const { user } = useAuth();
  const propertyCtx = usePropertyOptional();
  const [users, setUsers] = useState<ManagedUserDto[]>([]);
  const [properties, setProperties] = useState<PropertyDto[]>([]);
  const [accessGroups, setAccessGroups] = useState<PlatformAccessGroup[]>([]);
  const [roles, setRoles] = useState<ManagedRoleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [tab, setTab] = useState<Tab>("all");
  const [drawer, setDrawer] = useState<{ user: ManagedUserDto | null; key: number } | null>(null);

  const canManageUsers =
    isPlatformAdmin(user) || Boolean(propertyCtx?.canRead("workspace.user_management"));

  useEffect(() => {
    if (!canManageUsers) return;
    let cancelled = false;
    Promise.all([
      platformService.listUsers(),
      platformService.listProperties(),
      platformService.listModules(),
      platformService.listRoles(),
    ])
      .then(([userRows, propRows, groups, roleRows]) => {
        if (cancelled) return;
        // Super Admin = product owner; Admin = tenant owner — not listed as staff.
        setUsers(userRows.filter((u) => !isHiddenOwnerAccount(u)));
        setProperties(propRows);
        setAccessGroups(groups);
        setRoles(roleRows);
        registerAccessPages(groups);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Failed to load users"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [canManageUsers]);

  const reloadUsers = async () => {
    setRefreshing(true);
    try {
      const rows = await platformService.listUsers();
      setUsers(rows.filter((u) => !isHiddenOwnerAccount(u)));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setRefreshing(false);
    }
  };

  const propertyName = useMemo(() => new Map(properties.map((p) => [p.id, p.name])), [properties]);

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => String(u.status ?? "Active").toLowerCase() === "active").length,
      withRole: users.filter((u) => u.accessRoleId).length,
      linked: users.filter((u) => u.employeeId).length,
    }),
    [users],
  );

  const counts: Record<Tab, number> = {
    all: users.length,
    unlinked: users.filter((u) => !u.employeeId).length,
  };

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...users]
      .filter((u) => {
        if (tab === "unlinked" && u.employeeId) return false;
        if (propertyFilter === "none") {
          if (u.propertyIds.length > 0) return false;
        } else if (propertyFilter !== "all") {
          if (!u.propertyIds.includes(propertyFilter)) return false;
        }
        if (!q) return true;
        return [
          u.name,
          u.email,
          u.role,
          u.accessRoleName,
          u.employeeLabel,
          ...u.propertyIds.map((id) => propertyName.get(id)),
        ].some((v) => v?.toLowerCase().includes(q));
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users, search, tab, propertyFilter, propertyName]);


  const openDrawer = (u: ManagedUserDto | null) => setDrawer((d) => ({ user: u, key: (d?.key ?? 0) + 1 }));

  if (!canManageUsers) {
    return (
      <WorkspaceShell title="User management">
        <p className="text-sm text-red-600">Administrator access required.</p>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell
      wide
      title="User management"
      description="Create staff logins, choose properties, and assign a role (read or write access per page)."
      actions={
        <>
          <Button variant="outline" className="gap-1.5" onClick={() => void reloadUsers()} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} /> Refresh
          </Button>
          <Button className="gap-1.5 bg-emerald-700 hover:bg-emerald-800" onClick={() => openDrawer(null)}>
            <UserPlus className="h-4 w-4" /> Create user
          </Button>
        </>
      }
    >
      {(error || notice) && (
        <p
          role={error ? "alert" : "status"}
          className={cn(
            "mb-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm",
            error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800",
          )}
        >
          {error ?? notice}
          <button
            type="button"
            onClick={() => (error ? setError(null) : setNotice(null))}
            className="text-xs font-semibold opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="Total users"
          value={loading ? "—" : String(stats.total)}
          sub={`${stats.active} active`}
          icon={Users}
          tone={{ wash: "from-emerald-50", solid: "bg-emerald-500" }}
        />
        <StatCard
          label="With role"
          value={loading ? "—" : String(stats.withRole)}
          sub="Assigned a custom role"
          icon={UserCog}
          tone={{ wash: "from-sky-50", solid: "bg-sky-500" }}
        />
        <StatCard
          label="Linked to HR"
          value={loading ? "—" : String(stats.linked)}
          sub={`${stats.total ? Math.round((stats.linked / stats.total) * 100) : 0}% of users · Employee Portal`}
          icon={Link2}
          tone={{ wash: "from-amber-50", solid: "bg-amber-500" }}
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
            {(
              [
                { id: "all", label: "All" },
                { id: "unlinked", label: "Not linked to HR" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  tab === t.id ? "bg-white text-emerald-800 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:bg-white/60 hover:text-slate-800",
                )}
              >
                {t.label}
                <span className={cn("rounded-full px-1.5 text-[10px] tabular-nums", tab === t.id ? "bg-emerald-100 text-emerald-800" : "bg-slate-200/70 text-slate-500")}>{counts[t.id]}</span>
              </button>
            ))}
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <label className="relative block sm:w-56">
              <span className="sr-only">Filter by property</span>
              <select
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="h-9 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-8 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="all">All properties</option>
                <option value="none">No property assigned</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.code ? ` (${p.code})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <div className="relative sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, role or property…"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-2.5">User</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Access</th>
                <th className="px-4 py-2.5">Properties</th>
                <th className="px-4 py-2.5">Employee link</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="w-10 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [0, 1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="h-9 w-9 rounded-full bg-slate-100" />
                        <span className="space-y-1.5">
                          <span className="block h-3 w-28 rounded bg-slate-100" />
                          <span className="block h-2.5 w-36 rounded bg-slate-100" />
                        </span>
                      </div>
                    </td>
                    {[0, 1, 2, 3, 4, 5].map((j) => (
                      <td key={j} className="px-4 py-3">
                        <span className="block h-3 w-16 rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center">
                    <Users className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      {users.length === 0 ? "No users yet" : "No users match these filters"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {users.length === 0
                        ? "Create the first staff login."
                        : "Try another tab, property filter, or clear the search."}
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((u) => {
                  const active = String(u.status ?? "Active").toLowerCase() === "active";
                  const propNames = u.propertyIds.map((id) => propertyName.get(id) ?? id);
                  const grants = u.permissions.length;
                  return (
                    <tr
                      key={u.id}
                      onClick={() => openDrawer(u)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openDrawer(u);
                        }
                      }}
                      tabIndex={0}
                      className={cn("group cursor-pointer transition-colors hover:bg-emerald-50/40 focus:bg-emerald-50/40 focus:outline-none", !active && "opacity-60")}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} seed={u.id} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{u.name}</p>
                            <p className="truncate text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {u.accessRoleName || u.role ? (
                          <span className="whitespace-nowrap rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            {u.accessRoleName || u.role}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-600">
                          <span className="font-semibold text-slate-800">{grants}</span> page grant{grants === 1 ? "" : "s"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {propNames.length === 0 ? (
                          <span className="text-xs font-medium text-amber-700">None assigned</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {propNames.slice(0, 2).map((n) => (
                              <span key={n} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700">
                                {n}
                              </span>
                            ))}
                            {propNames.length > 2 && (
                              <span className="px-1 py-0.5 text-[11px] text-slate-400" title={propNames.join(", ")}>
                                +{propNames.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.employeeId ? (
                          <span className="inline-flex max-w-[180px] items-center gap-1 truncate text-xs text-slate-700" title={u.employeeLabel}>
                            <Link2 className="h-3 w-3 shrink-0 text-emerald-600" /> {u.employeeLabel || "Linked"}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Not linked</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500",
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-emerald-500" : "bg-slate-400")} />
                          {u.status || "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && rows.length > 0 && (
          <p className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
            Showing {rows.length} of {users.length} user{users.length === 1 ? "" : "s"} · click a row to view or edit access
          </p>
        )}
      </div>

      {drawer && (
        <UserFormDrawer
          key={drawer.key}
          open
          onClose={() => setDrawer(null)}
          user={drawer.user}
          properties={properties}
          accessGroups={accessGroups}
          roles={roles}
          defaultPropertyId={
            propertyFilter !== "all" && propertyFilter !== "none" ? propertyFilter : undefined
          }
          onSaved={(message) => {
            setDrawer(null);
            setNotice(message);
            void reloadUsers();
          }}
        />
      )}
    </WorkspaceShell>
  );
}
