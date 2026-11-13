"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Check, Eye, EyeOff, Link2, Lock, Mail, ShieldCheck, User as UserIcon, UserPlus } from "lucide-react";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { Button } from "@/components/ui/Button";
import {
  platformService,
  type EmployeeLinkOption,
  type ManagedRoleDto,
  type ManagedUserDto,
  type PlatformAccessGroup,
  type PropertyDto,
} from "@/services/platform";
import type { PermissionLevel } from "@/lib/property";
import { cn } from "@/lib/utils";
import { Avatar } from "./userUi";
import { PageAccessTabs, staffPageLevel, type PageAccessLevel } from "@/components/platform/PageAccessTabs";

type FormState = {
  name: string;
  email: string;
  password: string;
  role: string;
  accessRoleId: string;
  isSuperAdmin: boolean;
  employeeId: string;
  propertyIds: string[];
  permissions: Record<string, Record<string, PermissionLevel>>;
};

const INPUT =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50 disabled:text-slate-500";

function formFromUser(u: ManagedUserDto | null, defaultPropertyId?: string): FormState {
  if (!u) {
    return {
      name: "",
      email: "",
      password: "",
      role: "User",
      accessRoleId: "",
      isSuperAdmin: false,
      employeeId: "",
      propertyIds: defaultPropertyId ? [defaultPropertyId] : [],
      permissions: {},
    };
  }
  const permissions: FormState["permissions"] = {};
  for (const p of u.permissions) {
    if (!permissions[p.propertyId]) permissions[p.propertyId] = {};
    const level = staffPageLevel(p.permission);
    if (level) permissions[p.propertyId][p.moduleKey] = level;
  }
  return {
    name: u.name,
    email: u.email,
    password: "",
    role: u.role,
    accessRoleId: u.accessRoleId ?? "",
    isSuperAdmin: Boolean(u.isSuperAdmin),
    employeeId: u.employeeId ?? "",
    propertyIds: [...u.propertyIds],
    permissions,
  };
}

function Section({
  step,
  title,
  description,
  action,
  children,
}: {
  step: number;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white">
            {step}
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            {description && <p className="text-xs text-slate-500">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-[11px] text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}

function IconInput({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      {children}
    </div>
  );
}

export function UserFormDrawer({
  open,
  onClose,
  user,
  properties,
  accessGroups,
  roles,
  defaultPropertyId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  user: ManagedUserDto | null;
  properties: PropertyDto[];
  accessGroups: PlatformAccessGroup[];
  roles: ManagedRoleDto[];
  /** Prefill property access when creating a user (e.g. from list filter). */
  defaultPropertyId?: string;
  onSaved: (message: string, email: string) => void;
}) {
  const allPages = useMemo(() => accessGroups.flatMap((g) => g.pages), [accessGroups]);
  const [baseline] = useState<FormState>(() =>
    formFromUser(
      user,
      defaultPropertyId && properties.some((p) => p.id === defaultPropertyId)
        ? defaultPropertyId
        : properties[0]?.id,
    ),
  );
  const [form, setForm] = useState<FormState>(baseline);
  const [employeeOptions, setEmployeeOptions] = useState<EmployeeLinkOption[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedRole = useMemo(
    () => roles.find((r) => r.id === form.accessRoleId) ?? null,
    [roles, form.accessRoleId],
  );
  const linkPropertyId = form.propertyIds[0] ?? "";
  useEffect(() => {
    if (!linkPropertyId) return;
    let cancelled = false;
    platformService
      .listEmployeeLinkOptions(linkPropertyId)
      .then((rows) => !cancelled && setEmployeeOptions(rows))
      .catch(() => !cancelled && setEmployeeOptions([]));
    return () => {
      cancelled = true;
    };
  }, [linkPropertyId]);
  const linkOptions = linkPropertyId ? employeeOptions : [];

  const propertyName = useMemo(() => new Map(properties.map((p) => [p.id, p.name])), [properties]);
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);
  const patch = (p: Partial<FormState>) => setForm((f) => ({ ...f, ...p }));

  const toggleProperty = (propertyId: string) =>
    setForm((f) => {
      const on = f.propertyIds.includes(propertyId);
      const permissions = { ...f.permissions };
      if (on) delete permissions[propertyId];
      return {
        ...f,
        propertyIds: on ? f.propertyIds.filter((id) => id !== propertyId) : [...f.propertyIds, propertyId],
        permissions,
      };
    });

  const setPerm = (propertyId: string, moduleKey: string, level: PageAccessLevel) =>
    setForm((f) => {
      const forProperty = { ...(f.permissions[propertyId] ?? {}) };
      if (level) forProperty[moduleKey] = level;
      else delete forProperty[moduleKey];
      return { ...f, permissions: { ...f.permissions, [propertyId]: forProperty } };
    });

  const setAllForProperty = (propertyId: string, level: PageAccessLevel) =>
    setForm((f) => ({
      ...f,
      permissions: {
        ...f.permissions,
        [propertyId]: level ? Object.fromEntries(allPages.map((m) => [m.key, level])) : {},
      },
    }));

  const setAllForGroup = (propertyId: string, group: PlatformAccessGroup, level: PageAccessLevel) =>
    setForm((f) => {
      const forProperty = { ...(f.permissions[propertyId] ?? {}) };
      for (const page of group.pages) {
        if (level) forProperty[page.key] = level;
        else delete forProperty[page.key];
      }
      return { ...f, permissions: { ...f.permissions, [propertyId]: forProperty } };
    });

  const copyFromFirst = () =>
    setForm((f) => {
      const source = f.permissions[f.propertyIds[0]] ?? {};
      return { ...f, permissions: Object.fromEntries(f.propertyIds.map((pid) => [pid, { ...source }])) };
    });

  const problems = useMemo(() => {
    const out: Partial<Record<"name" | "email" | "password" | "properties" | "accessRoleId", string>> = {};
    if (!form.name.trim()) out.name = "Enter the user's full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) out.email = "Enter a valid email address.";
    if ((!user || form.password) && form.password.length < 6) out.password = "At least 6 characters.";
    if (form.propertyIds.length === 0) out.properties = "Give access to at least one property.";
    if (!form.accessRoleId) out.accessRoleId = "Assign a role so this user gets page access.";
    return out;
  }, [form, user]);
  const err = (key: keyof typeof problems) => (touched ? problems[key] : undefined);

  const grantedCount = (pid: string) => Object.keys(form.permissions[pid] ?? {}).length;

  const save = async () => {
    setTouched(true);
    if (Object.keys(problems).length) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: selectedRole?.name || form.role.trim() || "User",
        // Super Admin is the SaaS product owner — never assignable from PMS.
        isSuperAdmin: false,
        employeeId: form.employeeId || null,
        accessRoleId: form.accessRoleId || null,
        propertyIds: form.propertyIds,
        // Role drives permissions; custom matrix only used when no role (blocked by validation).
        permissions: form.accessRoleId
          ? []
          : Object.entries(form.permissions).flatMap(([propertyId, perms]) =>
              form.propertyIds.includes(propertyId)
                ? Object.entries(perms).map(([moduleKey, permission]) => ({ propertyId, moduleKey, permission }))
                : [],
            ),
      };
      if (user) {
        await platformService.updateUser(user.id, { ...payload, ...(form.password ? { password: form.password } : {}) });
      } else {
        await platformService.createUser({ ...payload, password: form.password });
      }
      onSaved(user ? `${payload.name} updated.` : `${payload.name} created.`, payload.email);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const totalGranted = form.propertyIds.reduce((s, pid) => s + grantedCount(pid), 0);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="bottom"
      title={user ? user.name : "New user"}
      customHeader={
        <div className="flex min-w-0 items-center gap-3">
          {user ? (
            <Avatar name={form.name || user.name} seed={user.id} size="lg" />
          ) : (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white">
              <UserPlus className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0">
            <h2 id="drawer-title" className="truncate text-base font-bold text-slate-900 sm:text-lg">
              {user ? form.name || user.name : "Create user"}
            </h2>
            <p className="truncate text-xs text-slate-500">
              {user ? `${user.email} · ${user.status || "Active"}` : "Set up a login, then choose what this person can access."}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            {dirty ? <span className="font-medium text-amber-700">Unsaved changes</span> : user ? "No changes" : "Fill in the details to create the user"}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={() => void save()}
              disabled={saving || (Boolean(user) && !dirty)}
              className="!bg-emerald-700 text-white hover:!bg-emerald-800"
            >
              {saving ? "Saving…" : user ? "Save changes" : "Create user"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <Section step={1} title="Account" description="Login details and the role label shown across the PMS.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full name" required error={err("name")}>
                <IconInput icon={UserIcon}>
                  <input
                    className={cn(INPUT, "pl-9", err("name") && "border-red-300")}
                    placeholder="e.g. Priya Sharma"
                    value={form.name}
                    onChange={(e) => patch({ name: e.target.value })}
                  />
                </IconInput>
              </Field>
              <Field label="Email" required error={err("email")} hint={user ? "Email is the login ID and can't be changed." : undefined}>
                <IconInput icon={Mail}>
                  <input
                    type="email"
                    className={cn(INPUT, "pl-9", err("email") && "border-red-300")}
                    placeholder="name@hotel.com"
                    value={form.email}
                    onChange={(e) => patch({ email: e.target.value })}
                    disabled={Boolean(user)}
                  />
                </IconInput>
              </Field>
              <Field
                label={user ? "Reset password" : "Password"}
                required={!user}
                error={err("password")}
                hint={user ? "Leave blank to keep the current password." : "Minimum 6 characters."}
              >
                <IconInput icon={Lock}>
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    className={cn(INPUT, "pl-9 pr-10", err("password") && "border-red-300")}
                    placeholder={user ? "New password (optional)" : "Set a password"}
                    value={form.password}
                    onChange={(e) => patch({ password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </IconInput>
              </Field>
              <Field
                label="Role"
                required
                error={err("accessRoleId")}
                hint="Create roles under Workspace → Roles, then assign here. The user inherits that role’s page access."
              >
                <select
                  className={cn(INPUT, err("accessRoleId") && "border-red-300")}
                  value={form.accessRoleId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const r = roles.find((x) => x.id === id);
                    patch({ accessRoleId: id, role: r?.name || form.role || "User" });
                  }}
                >
                  <option value="">Select a role…</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.permissions.length} page{r.permissions.length === 1 ? "" : "s"})
                    </option>
                  ))}
                </select>
                {roles.length === 0 && (
                  <span className="mt-1 block text-[11px] text-amber-700">
                    No roles yet. Open Roles in the workspace sidebar and create one first.
                  </span>
                )}
              </Field>
            </div>
          </Section>

          <Section
            step={2}
            title="Select properties"
            description="Choose which hotels this user can open after logging in."
            action={
              <div className="flex items-center gap-2">
                {properties.length > 0 && (
                  <>
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-emerald-700 hover:underline"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          propertyIds: properties.map((p) => p.id),
                        }))
                      }
                    >
                      Select all
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-slate-500 hover:underline"
                      onClick={() => setForm((f) => ({ ...f, propertyIds: [], permissions: {} }))}
                    >
                      Clear
                    </button>
                  </>
                )}
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                  {form.propertyIds.length} of {properties.length}
                </span>
              </div>
            }
          >
                {properties.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    No properties available. Create a property first, then assign it here.
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {properties.map((p) => {
                      const on = form.propertyIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleProperty(p.id)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                            on
                              ? "border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500"
                              : "border-slate-200 hover:border-slate-300",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                              on ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white",
                            )}
                          >
                            {on && <Check className="h-3.5 w-3.5" />}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-slate-900">{p.name}</span>
                            <span className="block truncate text-[11px] text-slate-500">
                              {[p.code, p.city].filter(Boolean).join(" · ") || "—"}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
                {err("properties") && <p className="mt-2 text-[11px] text-red-600">{err("properties")}</p>}
              </Section>

              {form.propertyIds.length > 0 && selectedRole && (
                <Section
                  step={3}
                  title="Access from role"
                  description={`“${selectedRole.name}” grants the pages below on every selected property.`}
                >
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-900">
                    <p className="font-semibold">{selectedRole.permissions.length} page grant{selectedRole.permissions.length === 1 ? "" : "s"}</p>
                    <p className="mt-1 text-xs text-emerald-800/80">
                      {selectedRole.description || "Edit this role under Workspace → Roles to change access for all users with it."}
                    </p>
                    {selectedRole.permissions.length > 0 && (
                      <ul className="mt-3 grid gap-1 sm:grid-cols-2">
                        {selectedRole.permissions.slice(0, 12).map((p) => {
                          const label =
                            allPages.find((page) => page.key === p.moduleKey)?.label ?? p.moduleKey;
                          return (
                            <li key={p.moduleKey} className="flex items-center justify-between gap-2 rounded-lg bg-white/70 px-2.5 py-1.5 text-xs">
                              <span className="truncate font-medium text-slate-800">{label}</span>
                              <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-semibold uppercase text-slate-600">
                                {p.permission}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {selectedRole.permissions.length > 12 && (
                      <p className="mt-2 text-[11px] text-emerald-800/70">
                        +{selectedRole.permissions.length - 12} more pages defined on the role
                      </p>
                    )}
                  </div>
                </Section>
              )}

              {form.propertyIds.length > 0 && !selectedRole && (
                <Section
                  step={3}
                  title="Page access"
                  description="Pick a module tab, then set Read or Write per page. Prefer assigning a role above when possible."
                >
                  <PageAccessTabs
                    mode="byProperty"
                    accessGroups={accessGroups}
                    propertyIds={form.propertyIds}
                    propertyName={(id) => propertyName.get(id) ?? id}
                    permissions={form.permissions}
                    onChange={setPerm}
                    onSetGroup={setAllForGroup}
                    onSetAll={setAllForProperty}
                    onCopyFromFirst={form.propertyIds.length > 1 ? copyFromFirst : undefined}
                  />
                </Section>
              )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-slate-400" /> Access summary
            </h3>
            {form.propertyIds.length === 0 ? (
              <p className="text-xs text-slate-400">No property selected yet.</p>
            ) : selectedRole ? (
              <div className="space-y-2">
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                  Role <strong>{selectedRole.name}</strong> · {selectedRole.permissions.length} page
                  {selectedRole.permissions.length === 1 ? "" : "s"}
                </p>
                <ul className="space-y-1">
                  {form.propertyIds.map((pid) => (
                    <li key={pid} className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800">
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" /> {propertyName.get(pid) ?? pid}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <ul className="space-y-2">
                {form.propertyIds.map((pid) => {
                  const perms = Object.values(form.permissions[pid] ?? {});
                  return (
                    <li key={pid} className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" /> {propertyName.get(pid) ?? pid}
                      </p>
                      <p className="mt-1 flex flex-wrap gap-1 text-[10px] font-semibold">
                        {(["read", "write"] as const).map((level) => {
                          const n = perms.filter((p) => p === level).length;
                          return n ? (
                            <span
                              key={level}
                              className={cn(
                                "rounded px-1.5 py-0.5 text-white",
                                level === "read" ? "bg-sky-600" : "bg-emerald-600",
                              )}
                            >
                              {n} {level}
                            </span>
                          ) : null;
                        })}
                        {perms.length === 0 && <span className="text-amber-700">No pages yet</span>}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-3 text-[11px] text-slate-500">
              {selectedRole
                ? `${selectedRole.permissions.length} role page${selectedRole.permissions.length === 1 ? "" : "s"} × ${form.propertyIds.length} propert${form.propertyIds.length === 1 ? "y" : "ies"}`
                : `${totalGranted} page grant${totalGranted === 1 ? "" : "s"} across ${form.propertyIds.length} propert${form.propertyIds.length === 1 ? "y" : "ies"}.`}
            </p>
          </section>

          {form.propertyIds.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Link2 className="h-4 w-4 text-slate-400" /> Employee portal link
              </h3>
              <p className="mb-2 text-[11px] text-slate-500">Needed for Employee Portal login.</p>
              <select className={INPUT} value={form.employeeId} onChange={(e) => patch({ employeeId: e.target.value })}>
                <option value="">Not linked</option>
                {linkOptions.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.empCode} — {emp.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-500">
                Employees of {propertyName.get(form.propertyIds[0]) ?? "the first selected property"}.
              </p>
              {user?.employeeLabel && !form.employeeId && (
                <p className="mt-1 text-[11px] text-amber-700">Previously linked: {user.employeeLabel}</p>
              )}
            </section>
          )}
        </aside>
      </div>
    </Drawer>
  );
}
