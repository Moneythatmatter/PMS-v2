"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Link2, RefreshCw, Search, ShieldCheck, UserPlus, Users, UserCog } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { isPlatformAdmin } from "@/lib/auth";
import { WorkspaceShell } from "@/components/platform/WorkspaceShell";
import { Button } from "@/components/ui/Button";
import {
  platformService,
  type ManagedUserDto,
  type PlatformModule,
  type PropertyDto,
} from "@/services/platform";
import { cn } from "@/lib/utils";
import { UserFormDrawer } from "./UserFormDrawer";
import { Avatar } from "./userUi";

type Tab = "all" | "super" | "standard" | "unlinked";

const ROLE_SUGGESTIONS = ["Staff", "Manager", "Front Office", "Housekeeping", "F&B", "Accounts", "HR", "Admin"];

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
  tone: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-2xl font-extrabold leading-tight text-slate-900">{value}</p>
        <p className="truncate text-[11px] text-slate-500">{sub}</p>
      </div>
      <span className={cn("rounded-xl p-2.5", tone)}>
        <Icon className="h-5 w-5" />
      </span>
    </div>
  );
}

export function UserManagementView() {
  const { user } = useAuth();
  const [users, setUsers] = useState<ManagedUserDto[]>([]);
  const [properties, setProperties] = useState<PropertyDto[]>([]);
  const [modules, setModules] = useState<PlatformModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [drawer, setDrawer] = useState<{ user: ManagedUserDto | null; key: number } | null>(null);

  useEffect(() => {
    if (!isPlatformAdmin(user)) return;
    let cancelled = false;
    Promise.all([platformService.listUsers(), platformService.listProperties(), platformService.listModules()])
      .then(([userRows, propRows, modRows]) => {
        if (cancelled) return;
        setUsers(userRows);
        setProperties(propRows);
        setModules(modRows);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Failed to load users"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user]);

  const reloadUsers = async () => {
    setRefreshing(true);
    try {
      setUsers(await platformService.listUsers());
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
      superAdmins: users.filter((u) => u.isSuperAdmin).length,
      standard: users.filter((u) => !u.isSuperAdmin).length,
      linked: users.filter((u) => u.employeeId).length,
    }),
    [users],
  );

  const counts: Record<Tab, number> = {
    all: users.length,
    super: stats.superAdmins,
    standard: stats.standard,
    unlinked: users.filter((u) => !u.isSuperAdmin && !u.employeeId).length,
  };

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...users]
      .filter((u) => {
        if (tab === "super" && !u.isSuperAdmin) return false;
        if (tab === "standard" && u.isSuperAdmin) return false;
        if (tab === "unlinked" && (u.isSuperAdmin || u.employeeId)) return false;
        if (!q) return true;
        return [u.name, u.email, u.role, u.employeeLabel, ...u.propertyIds.map((id) => propertyName.get(id))].some((v) =>
          v?.toLowerCase().includes(q),
        );
      })
      .sort((a, b) => Number(Boolean(b.isSuperAdmin)) - Number(Boolean(a.isSuperAdmin)) || a.name.localeCompare(b.name));
  }, [users, search, tab, propertyName]);

  const roleSuggestions = useMemo(
    () => [...new Set([...ROLE_SUGGESTIONS, ...users.map((u) => u.role).filter(Boolean)])],
    [users],
  );

  const openDrawer = (u: ManagedUserDto | null) => setDrawer((d) => ({ user: u, key: (d?.key ?? 0) + 1 }));

  if (!isPlatformAdmin(user)) {
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
      description="Create staff logins, choose which properties they can open, and set read / write / admin access per module."
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total users"
          value={loading ? "—" : String(stats.total)}
          sub={`${stats.active} active`}
          icon={Users}
          tone="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          label="Super admins"
          value={loading ? "—" : String(stats.superAdmins)}
          sub="All properties & modules"
          icon={ShieldCheck}
          tone="bg-violet-50 text-violet-700"
        />
        <StatCard
          label="Standard users"
          value={loading ? "—" : String(stats.standard)}
          sub="Access set per module"
          icon={UserCog}
          tone="bg-sky-50 text-sky-700"
        />
        <StatCard
          label="Linked to HR"
          value={loading ? "—" : String(stats.linked)}
          sub="Can use Employee Portal"
          icon={Link2}
          tone="bg-amber-50 text-amber-700"
        />
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
            {(
              [
                { id: "all", label: "All" },
                { id: "super", label: "Super admins" },
                { id: "standard", label: "Standard" },
                { id: "unlinked", label: "Not linked to HR" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  tab === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800",
                )}
              >
                {t.label}
                <span className={cn("tabular-nums", tab === t.id ? "text-emerald-700" : "text-slate-400")}>{counts[t.id]}</span>
              </button>
            ))}
          </div>
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

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5">User</th>
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
                      {users.length === 0 ? "Create the first staff login." : "Try another tab or clear the search."}
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
                      className="group cursor-pointer transition-colors hover:bg-emerald-50/40 focus:bg-emerald-50/40 focus:outline-none"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} seed={u.id} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{u.name}</p>
                            <p className="truncate text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{u.role || "—"}</td>
                      <td className="px-4 py-3">
                        {u.isSuperAdmin ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-200">
                            <ShieldCheck className="h-3 w-3" /> Super admin
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600">
                            <span className="font-semibold text-slate-800">{grants}</span> module grant{grants === 1 ? "" : "s"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.isSuperAdmin ? (
                          <span className="text-xs font-medium text-slate-500">All properties</span>
                        ) : propNames.length === 0 ? (
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
          modules={modules}
          roleSuggestions={roleSuggestions}
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
