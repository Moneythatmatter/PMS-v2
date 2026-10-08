"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Check, Eye, EyeOff, Link2, Lock, Mail, ShieldCheck, User as UserIcon, UserPlus } from "lucide-react";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { Button } from "@/components/ui/Button";
import {
  platformService,
  type EmployeeLinkOption,
  type ManagedUserDto,
  type PlatformModule,
  type PropertyDto,
} from "@/services/platform";
import type { PermissionLevel } from "@/lib/property";
import { cn } from "@/lib/utils";
import { Avatar } from "./userUi";

type Level = PermissionLevel | "";
type FormState = {
  name: string;
  email: string;
  password: string;
  role: string;
  isSuperAdmin: boolean;
  employeeId: string;
  propertyIds: string[];
  permissions: Record<string, Record<string, PermissionLevel>>;
};

const LEVELS: { id: Level; label: string; hint: string; on: string; swatch: string }[] = [
  { id: "", label: "None", hint: "Module hidden", on: "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200", swatch: "bg-slate-300" },
  { id: "read", label: "Read", hint: "View only", on: "bg-sky-600 text-white shadow-sm", swatch: "bg-sky-600" },
  { id: "write", label: "Write", hint: "Create & edit", on: "bg-emerald-600 text-white shadow-sm", swatch: "bg-emerald-600" },
  { id: "admin", label: "Admin", hint: "Full control incl. settings", on: "bg-violet-600 text-white shadow-sm", swatch: "bg-violet-600" },
];

const INPUT =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-slate-50 disabled:text-slate-500";

function formFromUser(u: ManagedUserDto | null, defaultPropertyId?: string): FormState {
  if (!u) {
    return {
      name: "",
      email: "",
      password: "",
      role: "Staff",
      isSuperAdmin: false,
      employeeId: "",
      propertyIds: defaultPropertyId ? [defaultPropertyId] : [],
      permissions: {},
    };
  }
  const permissions: FormState["permissions"] = {};
  for (const p of u.permissions) {
    if (!permissions[p.propertyId]) permissions[p.propertyId] = {};
    permissions[p.propertyId][p.moduleKey] = p.permission;
  }
  return {
    name: u.name,
    email: u.email,
    password: "",
    role: u.role,
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

function LevelPicker({ value, onChange, label }: { value: Level; onChange: (v: Level) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg bg-slate-100 p-0.5">
      {LEVELS.map((l) => (
        <button
          key={l.id || "none"}
          type="button"
          role="radio"
          aria-checked={value === l.id}
          title={l.hint}
          onClick={() => onChange(l.id)}
          className={cn(
            "rounded-md px-2.5 py-1 text-[11px] font-semibold transition",
            value === l.id ? l.on : "text-slate-500 hover:text-slate-800",
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

export function UserFormDrawer({
  open,
  onClose,
  user,
  properties,
  modules,
  roleSuggestions,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  user: ManagedUserDto | null;
  properties: PropertyDto[];
  modules: PlatformModule[];
  roleSuggestions: string[];
  onSaved: (message: string, email: string) => void;
}) {
  const [baseline] = useState<FormState>(() => formFromUser(user, properties[0]?.id));
  const [form, setForm] = useState<FormState>(baseline);
  const [employeeOptions, setEmployeeOptions] = useState<EmployeeLinkOption[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkPropertyId = form.isSuperAdmin ? "" : (form.propertyIds[0] ?? "");
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

  const setPerm = (propertyId: string, moduleKey: string, level: Level) =>
    setForm((f) => {
      const forProperty = { ...(f.permissions[propertyId] ?? {}) };
      if (level) forProperty[moduleKey] = level;
      else delete forProperty[moduleKey];
      return { ...f, permissions: { ...f.permissions, [propertyId]: forProperty } };
    });

  const setAllForProperty = (propertyId: string, level: Level) =>
    setForm((f) => ({
      ...f,
      permissions: {
        ...f.permissions,
        [propertyId]: level ? Object.fromEntries(modules.map((m) => [m.key, level])) : {},
      },
    }));

  const copyFromFirst = () =>
    setForm((f) => {
      const source = f.permissions[f.propertyIds[0]] ?? {};
      return { ...f, permissions: Object.fromEntries(f.propertyIds.map((pid) => [pid, { ...source }])) };
    });

  const problems = useMemo(() => {
    const out: Partial<Record<"name" | "email" | "password" | "properties", string>> = {};
    if (!form.name.trim()) out.name = "Enter the user's full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) out.email = "Enter a valid email address.";
    if ((!user || form.password) && form.password.length < 6) out.password = "At least 6 characters.";
    if (!form.isSuperAdmin && form.propertyIds.length === 0) out.properties = "Give access to at least one property.";
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
        role: form.role.trim() || "Staff",
        isSuperAdmin: form.isSuperAdmin,
        employeeId: form.employeeId || null,
        propertyIds: form.propertyIds,
        permissions: Object.entries(form.permissions).flatMap(([propertyId, perms]) =>
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
            <h2 id="drawer-title" className="flex items-center gap-2 truncate text-base font-bold text-slate-900 sm:text-lg">
              {user ? form.name || user.name : "Create user"}
              {user && form.isSuperAdmin && (
                <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 ring-1 ring-violet-200">
                  Super admin
                </span>
              )}
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
                hint={
                  ["admin", "administrator"].includes(form.role.trim().toLowerCase())
                    ? "Admin role = full access to every property and module, including creating properties."
                    : "A label only — access comes from the permissions below. Use \"Admin\" for full administrator access."
                }
              >
                <input
                  className={INPUT}
                  list="user-role-suggestions"
                  placeholder="e.g. Front Office"
                  value={form.role}
                  onChange={(e) => patch({ role: e.target.value })}
                />
                <datalist id="user-role-suggestions">
                  {roleSuggestions.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </Field>
            </div>
          </Section>

          <Section step={2} title="Access level">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { id: false, title: "Standard user", hint: "Only the properties and modules you pick below." },
                { id: true, title: "Super administrator", hint: "Every property and module, including user management." },
              ].map((opt) => {
                const on = form.isSuperAdmin === opt.id;
                return (
                  <button
                    key={String(opt.id)}
                    type="button"
                    onClick={() => patch({ isSuperAdmin: opt.id })}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3.5 text-left transition",
                      on
                        ? opt.id
                          ? "border-violet-400 bg-violet-50 ring-1 ring-violet-400"
                          : "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                        : "border-slate-200 hover:border-slate-300",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                        on ? (opt.id ? "border-violet-600 bg-violet-600" : "border-emerald-600 bg-emerald-600") : "border-slate-300",
                      )}
                    >
                      {on && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{opt.title}</span>
                      <span className="block text-xs text-slate-500">{opt.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Section>

          {!form.isSuperAdmin && (
            <>
              <Section
                step={3}
                title="Property access"
                description="The hotels this user can switch into after logging in."
                action={
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                    {form.propertyIds.length} of {properties.length}
                  </span>
                }
              >
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
                          on ? "border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500" : "border-slate-200 hover:border-slate-300",
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
                {err("properties") && <p className="mt-2 text-[11px] text-red-600">{err("properties")}</p>}
              </Section>

              {form.propertyIds.length > 0 && (
                <Section
                  step={4}
                  title="Module permissions"
                  description="Pick what this user can do in each module, per property."
                  action={
                    form.propertyIds.length > 1 ? (
                      <Button variant="outline" onClick={copyFromFirst} className="h-8 rounded-lg px-3 text-xs font-semibold">
                        Copy {propertyName.get(form.propertyIds[0]) ?? "first"} to all
                      </Button>
                    ) : null
                  }
                >
                  <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                    {LEVELS.slice(1).map((l) => (
                      <span key={l.id} className="inline-flex items-center gap-1.5">
                        <span className={cn("h-2.5 w-2.5 rounded-sm", l.swatch)} />
                        <strong className="font-semibold text-slate-700">{l.label}</strong> {l.hint.toLowerCase()}
                      </span>
                    ))}
                  </div>
                  <div className="-mx-5 -mb-5 overflow-x-auto border-t border-slate-100">
                    <table className="w-full min-w-max text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                          <th className="sticky left-0 bg-slate-50 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Module
                          </th>
                          {form.propertyIds.map((pid) => (
                            <th key={pid} className="px-4 py-2.5 align-top">
                              <span className="block text-xs font-semibold text-slate-800">{propertyName.get(pid) ?? pid}</span>
                              <span className="mt-1 flex items-center gap-2">
                                <span className="text-[10px] font-medium text-slate-400">
                                  {grantedCount(pid)} of {modules.length} on
                                </span>
                                <select
                                  aria-label={`Set all modules for ${propertyName.get(pid) ?? pid}`}
                                  value=""
                                  onChange={(e) => setAllForProperty(pid, e.target.value as Level)}
                                  className="h-6 rounded-md border border-slate-200 bg-white px-1.5 text-[10px] font-semibold text-slate-600 focus:outline-none"
                                >
                                  <option value="" disabled>
                                    Set all…
                                  </option>
                                  {LEVELS.map((l) => (
                                    <option key={l.id || "none"} value={l.id}>
                                      {l.label}
                                    </option>
                                  ))}
                                </select>
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {modules.map((mod) => (
                          <tr key={mod.key} className="hover:bg-slate-50/50">
                            <td className="sticky left-0 bg-white px-5 py-2 font-medium text-slate-800">{mod.label}</td>
                            {form.propertyIds.map((pid) => (
                              <td key={`${mod.key}-${pid}`} className="px-4 py-2">
                                <LevelPicker
                                  label={`${mod.label} access for ${propertyName.get(pid) ?? pid}`}
                                  value={form.permissions[pid]?.[mod.key] ?? ""}
                                  onChange={(level) => setPerm(pid, mod.key, level)}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>
              )}
            </>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-slate-400" /> Access summary
            </h3>
            {form.isSuperAdmin ? (
              <p className="rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-800">
                Full access to all {properties.length} properties and {modules.length} modules.
              </p>
            ) : form.propertyIds.length === 0 ? (
              <p className="text-xs text-slate-400">No property selected yet.</p>
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
                        {LEVELS.slice(1).map((l) => {
                          const n = perms.filter((p) => p === l.id).length;
                          return n ? (
                            <span key={l.id} className={cn("rounded px-1.5 py-0.5 text-white", l.swatch)}>
                              {n} {l.label.toLowerCase()}
                            </span>
                          ) : null;
                        })}
                        {perms.length === 0 && <span className="text-amber-700">No modules yet</span>}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
            {!form.isSuperAdmin && (
              <p className="mt-3 text-[11px] text-slate-500">
                {totalGranted} module grant{totalGranted === 1 ? "" : "s"} across {form.propertyIds.length} propert
                {form.propertyIds.length === 1 ? "y" : "ies"}.
              </p>
            )}
          </section>

          {!form.isSuperAdmin && form.propertyIds.length > 0 && (
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
