"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Plus, RefreshCw, Search, Shield, Trash2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { isPlatformAdmin } from "@/lib/auth";
import { WorkspaceShell } from "@/components/platform/WorkspaceShell";
import { usePropertyOptional } from "@/components/platform/PropertyProvider";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import {
  platformService,
  type ManagedRoleDto,
  type PlatformAccessGroup,
} from "@/services/platform";
import { registerAccessPages } from "@/lib/page-access-registry";
import type { PermissionLevel } from "@/lib/property";
import { cn } from "@/lib/utils";
import { PageAccessTabs, staffPageLevel, type PageAccessLevel } from "@/components/platform/PageAccessTabs";

const INPUT =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

type RoleForm = {
  name: string;
  description: string;
  permissions: Record<string, PermissionLevel>;
};

function formFromRole(role: ManagedRoleDto | null): RoleForm {
  if (!role) return { name: "", description: "", permissions: {} };
  const permissions: Record<string, PermissionLevel> = {};
  for (const p of role.permissions) {
    const level = staffPageLevel(p.permission);
    if (level) permissions[p.moduleKey] = level;
  }
  return { name: role.name, description: role.description ?? "", permissions };
}

export function RoleManagementView() {
  const { user } = useAuth();
  const propertyCtx = usePropertyOptional();
  const [roles, setRoles] = useState<ManagedRoleDto[]>([]);
  const [accessGroups, setAccessGroups] = useState<PlatformAccessGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState<{ role: ManagedRoleDto | null; key: number } | null>(null);

  const canManage =
    isPlatformAdmin(user) || Boolean(propertyCtx?.canRead("workspace.roles"));

  const load = async () => {
    const [roleRows, groups] = await Promise.all([
      platformService.listRoles(),
      platformService.listModules(),
    ]);
    setRoles(roleRows);
    setAccessGroups(groups);
    registerAccessPages(groups);
  };

  useEffect(() => {
    if (!canManage) return;
    let cancelled = false;
    load()
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Failed to load roles"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [canManage]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...roles]
      .filter((r) => !q || [r.name, r.description].some((v) => v?.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [roles, search]);

  if (!canManage) {
    return (
      <WorkspaceShell title="Roles">
        <p className="text-sm text-red-600">Administrator access required.</p>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell
      wide
      title="Roles"
      description="Create roles and set read or write access per page. Assign a role to users in User management."
      actions={
        <>
          <Button
            variant="outline"
            className="gap-1.5"
            disabled={refreshing}
            onClick={() => {
              setRefreshing(true);
              load()
                .then(() => setError(null))
                .catch((e) => setError(e instanceof Error ? e.message : "Failed to refresh"))
                .finally(() => setRefreshing(false));
            }}
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} /> Refresh
          </Button>
          <Button
            className="gap-1.5 bg-emerald-700 hover:bg-emerald-800"
            onClick={() => setDrawer((d) => ({ role: null, key: (d?.key ?? 0) + 1 }))}
          >
            <Plus className="h-4 w-4" /> Create role
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
          <button type="button" className="text-xs font-semibold opacity-70 hover:opacity-100" onClick={() => (error ? setError(null) : setNotice(null))}>
            Dismiss
          </button>
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-3">
          <p className="text-sm font-semibold text-slate-800">
            {loading ? "…" : `${roles.length} role${roles.length === 1 ? "" : "s"}`}
          </p>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roles…"
              className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-2.5">Role</th>
                <th className="px-4 py-2.5">Access</th>
                <th className="px-4 py-2.5">Users</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="w-10 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [0, 1, 2].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-3"><span className="block h-3 w-32 rounded bg-slate-100" /></td>
                    <td className="px-4 py-3"><span className="block h-3 w-16 rounded bg-slate-100" /></td>
                    <td className="px-4 py-3"><span className="block h-3 w-8 rounded bg-slate-100" /></td>
                    <td className="px-4 py-3"><span className="block h-3 w-14 rounded bg-slate-100" /></td>
                    <td />
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center">
                    <Shield className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      {roles.length === 0 ? "No roles yet" : "No roles match this search"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {roles.length === 0 ? "Create a role, then assign it in User management." : "Try another search."}
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.id}
                    tabIndex={0}
                    onClick={() => setDrawer((d) => ({ role: r, key: (d?.key ?? 0) + 1 }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setDrawer((d) => ({ role: r, key: (d?.key ?? 0) + 1 }));
                      }
                    }}
                    className="group cursor-pointer transition-colors hover:bg-emerald-50/40 focus:bg-emerald-50/40 focus:outline-none"
                  >
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-900">{r.name}</p>
                      <p className="truncate text-xs text-slate-500">{r.description || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">{r.permissions.length}</span> page
                      {r.permissions.length === 1 ? "" : "s"}
                    </td>
                    <td className="px-4 py-3 text-xs tabular-nums text-slate-700">{r.userCount}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {r.status || "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ChevronRight className="ml-auto h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {drawer && (
        <RoleFormDrawer
          key={drawer.key}
          open
          role={drawer.role}
          accessGroups={accessGroups}
          onClose={() => setDrawer(null)}
          onSaved={async (message) => {
            setDrawer(null);
            setNotice(message);
            await load();
          }}
          onDeleted={async (message) => {
            setDrawer(null);
            setNotice(message);
            await load();
          }}
        />
      )}
    </WorkspaceShell>
  );
}

function RoleFormDrawer({
  open,
  onClose,
  role,
  accessGroups,
  onSaved,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  role: ManagedRoleDto | null;
  accessGroups: PlatformAccessGroup[];
  onSaved: (message: string) => void | Promise<void>;
  onDeleted: (message: string) => void | Promise<void>;
}) {
  const [baseline] = useState(() => formFromRole(role));
  const [form, setForm] = useState<RoleForm>(baseline);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allPages = useMemo(() => accessGroups.flatMap((g) => g.pages), [accessGroups]);
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);
  const nameError = touched && !form.name.trim() ? "Enter a role name." : undefined;
  const granted = Object.keys(form.permissions).length;

  const setPerm = (moduleKey: string, level: PageAccessLevel) =>
    setForm((f) => {
      const permissions = { ...f.permissions };
      if (level) permissions[moduleKey] = level;
      else delete permissions[moduleKey];
      return { ...f, permissions };
    });

  const setGroup = (group: PlatformAccessGroup, level: PageAccessLevel) =>
    setForm((f) => {
      const permissions = { ...f.permissions };
      for (const page of group.pages) {
        if (level) permissions[page.key] = level;
        else delete permissions[page.key];
      }
      return { ...f, permissions };
    });

  const setAll = (level: PageAccessLevel) =>
    setForm((f) => ({
      ...f,
      permissions: level
        ? Object.fromEntries(allPages.map((p) => [p.key, level as PermissionLevel]))
        : {},
    }));

  const save = async () => {
    setTouched(true);
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const permissions = Object.entries(form.permissions).map(([moduleKey, permission]) => ({
        moduleKey,
        permission,
      }));
      if (role) {
        await platformService.updateRole(role.id, {
          name: form.name.trim(),
          description: form.description.trim(),
          permissions,
          reapplyToUsers: true,
        });
        await onSaved(`${form.name.trim()} updated. Access reapplied to assigned users.`);
      } else {
        await platformService.createRole({
          name: form.name.trim(),
          description: form.description.trim(),
          permissions,
        });
        await onSaved(`${form.name.trim()} created.`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!role) return;
    if (!window.confirm(`Delete role “${role.name}”? Users must be unassigned first.`)) return;
    setDeleting(true);
    setError(null);
    try {
      await platformService.deleteRole(role.id);
      await onDeleted(`${role.name} deleted.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="bottom"
      title={role ? role.name : "New role"}
      customHeader={
        <div className="min-w-0">
          <h2 id="drawer-title" className="truncate text-base font-bold text-slate-900 sm:text-lg">
            {role ? "Edit role" : "Create role"}
          </h2>
          <p className="truncate text-xs text-slate-500">
            Define page access once, then assign this role to staff in User management.
          </p>
        </div>
      }
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div>
            {role && (
              <Button variant="outline" className="gap-1.5 text-rose-700 hover:bg-rose-50" disabled={saving || deleting} onClick={() => void remove()}>
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving || deleting}>
              Cancel
            </Button>
            <Button className="bg-emerald-700 hover:bg-emerald-800" disabled={saving || deleting || (!dirty && !!role)} onClick={() => void save()}>
              {saving ? "Saving…" : role ? "Save changes" : "Create role"}
            </Button>
          </div>
        </div>
      }
    >
      {error && (
        <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-1">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                Role name <span className="text-rose-500">*</span>
              </span>
              <input
                className={INPUT}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Front Office Staff"
              />
              {nameError && <span className="mt-1 block text-[11px] text-red-600">{nameError}</span>}
            </label>
            <label className="block sm:col-span-1">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">Description</span>
              <input
                className={INPUT}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional short note"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Page access</h3>
            <p className="text-xs text-slate-500">
              Switch modules with the tabs. Users with this role get these grants on every property they can open.
              {granted > 0 ? ` · ${granted} page${granted === 1 ? "" : "s"} selected.` : ""}
            </p>
          </div>
          <PageAccessTabs
            accessGroups={accessGroups}
            permissions={form.permissions}
            onChange={setPerm}
            onSetGroup={setGroup}
            onSetAll={setAll}
          />
        </section>
      </div>
    </Drawer>
  );
}
