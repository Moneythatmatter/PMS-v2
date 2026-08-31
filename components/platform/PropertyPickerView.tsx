"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Pencil, Plus, RefreshCw } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { isPlatformAdmin } from "@/lib/auth";
import { useProperty } from "@/components/platform/PropertyProvider";
import { WorkspaceShell } from "@/components/platform/WorkspaceShell";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { platformService, type PropertyDto } from "@/services/platform";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function PropertyPickerView() {
  const router = useRouter();
  const { user } = useAuth();
  const { setProperty } = useProperty();
  const [properties, setProperties] = useState<PropertyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", city: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const rows = await platformService.listProperties();
      setProperties(rows);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const defaultProperty = useMemo(
    () => properties.find((p) => p.isDefault) ?? properties[0],
    [properties],
  );

  const openWorkspace = (property: PropertyDto) => {
    setProperty({
      id: property.id,
      name: property.name,
      code: property.code,
      city: property.city,
      timezone: property.timezone,
      isDefault: property.isDefault,
    });
    router.push("/dashboard");
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.code.trim()) return;
    setSaving(true);
    try {
      await platformService.createProperty({
        name: form.name.trim(),
        code: form.code.trim().toLowerCase(),
        city: form.city.trim(),
        isDefault: properties.length === 0,
      });
      setForm({ name: "", code: "", city: "" });
      setShowAdd(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create property");
    } finally {
      setSaving(false);
    }
  };

  return (
    <WorkspaceShell
      title="Choose your property"
      description="Each hotel or lodge runs in its own workspace. Bookings, reports, and settings stay scoped to the property you open."
      actions={
        <>
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          {isPlatformAdmin(user) && (
            <Button
              className="bg-emerald-700 hover:bg-emerald-800"
              onClick={() => setShowAdd(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add property
            </Button>
          )}
        </>
      }
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {properties.length} propert{properties.length === 1 ? "y" : "ies"} available
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{error}</p>
          {error.includes("user_property_access") && (
            <p className="mt-2 text-xs text-red-600/90">
              Run <code className="rounded bg-red-100 px-1">multi-property-schema.sql</code> and{" "}
              <code className="rounded bg-red-100 px-1">multi-property-seeds.sql</code> in Supabase.
            </p>
          )}
        </div>
      )}

      {showAdd && isPlatformAdmin(user) && (
        <div className="mt-6 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">New property</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Property name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Code (e.g. bbsr)"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            />
            <input
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              className="bg-emerald-700 hover:bg-emerald-800"
              onClick={() => void handleCreate()}
              disabled={saving}
            >
              {saving ? "Saving…" : "Create property"}
            </Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <div
            key={property.id}
            className="group relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700 text-sm font-bold text-white shadow-sm shadow-emerald-200/50">
                {initials(property.name)}
              </div>
              {isPlatformAdmin(user) && (
                <button
                  type="button"
                  className="text-slate-300 transition-colors hover:text-slate-500"
                  aria-label="Edit property"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>
            <h3 className="mt-4 text-xl font-bold text-slate-900">{property.name}</h3>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              {property.code}
            </p>
            <p className="mt-1 text-sm text-slate-500">{property.city || "—"}</p>
            {defaultProperty?.id === property.id && (
              <p className="mt-3 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                Default workspace
              </p>
            )}
            <Button
              variant="outline"
              className="mt-5 w-full border-emerald-200 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-50"
              onClick={() => openWorkspace(property)}
            >
              Open workspace
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        ))}
      </div>

      {!loading && properties.length === 0 && !error && (
        <p className="mt-10 text-center text-sm text-slate-500">
          No properties assigned to your account. Contact an administrator.
        </p>
      )}
    </WorkspaceShell>
  );
}
