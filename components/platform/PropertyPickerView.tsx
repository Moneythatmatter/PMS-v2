"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Building2, MapPin, Pencil, Plus, RefreshCw } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { isPlatformAdmin } from "@/lib/auth";
import { useProperty } from "@/components/platform/PropertyProvider";
import { WorkspaceShell } from "@/components/platform/WorkspaceShell";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/frontoffice/ui/Modal";
import { cn } from "@/lib/utils";
import { platformService, type PropertyDto } from "@/services/platform";

const EMPTY_FORM = { name: "", code: "", city: "", timezone: "Asia/Kolkata" };

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="h-1 animate-pulse bg-slate-200" />
      <div className="p-5">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 animate-pulse rounded-xl bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
        <div className="mt-4 h-4 w-24 animate-pulse rounded bg-slate-100" />
        <div className="mt-5 h-10 animate-pulse rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

function PropertyCard({
  property,
  canEdit,
  onOpen,
  onEdit,
}: {
  property: PropertyDto;
  canEdit: boolean;
  onOpen: () => void;
  onEdit: () => void;
}) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100/40",
      )}
    >
      <div className="h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 group-hover:from-emerald-400 group-hover:via-emerald-500 group-hover:to-teal-400" />

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 text-sm font-bold text-white shadow-md shadow-slate-300/50 group-hover:from-emerald-600 group-hover:to-emerald-800 group-hover:shadow-emerald-200/60">
              {initials(property.name)}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold leading-tight text-slate-900">
                {property.name}
              </h3>
              <span className="mt-1 inline-flex rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-600">
                {property.code}
              </span>
            </div>
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={onEdit}
              title="Edit property"
              className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-emerald-700 focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              aria-label={`Edit ${property.name}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
          <span className="truncate">{property.city?.trim() || "Location not set"}</span>
        </div>

        {property.timezone && (
          <p className="mt-1 pl-5 text-xs text-slate-400">{property.timezone}</p>
        )}

        <div className="mt-auto pt-5">
          <Button
            className="h-10 w-full gap-2 border-slate-200 bg-white font-semibold text-slate-800 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900"
            variant="outline"
            onClick={onOpen}
          >
            Open workspace
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </article>
  );
}

export function PropertyPickerView() {
  const router = useRouter();
  const { user } = useAuth();
  const { setProperty } = useProperty();
  const [properties, setProperties] = useState<PropertyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PropertyDto | "new" | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const openForm = (property: PropertyDto | "new") => {
    setEditing(property);
    setFormError(null);
    setForm(
      property === "new"
        ? EMPTY_FORM
        : {
            name: property.name,
            code: property.code,
            city: property.city ?? "",
            timezone: property.timezone || "Asia/Kolkata",
          },
    );
  };

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

  const handleSave = async () => {
    if (!form.name.trim()) return setFormError("Property name is required.");
    if (!form.code.trim()) return setFormError("Code is required.");
    if (!/^[a-z0-9-]+$/i.test(form.code.trim())) return setFormError("Code can only use letters, numbers and hyphens.");
    setSaving(true);
    setFormError(null);
    try {
      const body = {
        name: form.name.trim(),
        code: form.code.trim().toLowerCase(),
        city: form.city.trim(),
        timezone: form.timezone.trim() || "Asia/Kolkata",
      };
      if (editing === "new") {
        const created = await platformService.createProperty({ ...body, isDefault: properties.length === 0 });
        if (created.accountsSetup && !created.accountsSetup.seeded && created.accountsSetup.message) {
          setError(`Property created, but Accounts setup did not run: ${created.accountsSetup.message}`);
        }
      } else if (editing) {
        await platformService.updateProperty(editing.id, body);
      }
      setEditing(null);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Failed to save property");
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
          <Button
            variant="outline"
            className="min-w-0 flex-1 whitespace-nowrap sm:flex-none"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4 shrink-0", loading && "animate-spin")} />
            Refresh
          </Button>
          {isPlatformAdmin(user) && (
            <Button
              className="min-w-0 flex-1 whitespace-nowrap bg-emerald-700 hover:bg-emerald-800 sm:flex-none"
              onClick={() => openForm("new")}
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

      <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
        {loading &&
          Array.from({ length: 3 }).map((_, i) => <PropertyCardSkeleton key={i} />)}

        {!loading &&
          properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              canEdit={isPlatformAdmin(user)}
              onOpen={() => openWorkspace(property)}
              onEdit={() => openForm(property)}
            />
          ))}

        {!loading && properties.length === 0 && !error && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 px-4 py-12 text-center sm:px-6 sm:py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Building2 className="h-7 w-7" />
            </div>
            <p className="mt-4 text-base font-semibold text-slate-700">No properties yet</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              No properties are assigned to your account. Contact an administrator to get access.
            </p>
          </div>
        )}
      </div>

      <Modal
        open={editing !== null}
        onClose={() => !saving && setEditing(null)}
        title={editing === "new" ? "Add property" : "Edit property"}
        description={editing === "new" ? "Each property gets its own workspace, bookings, reports and settings." : "Update the property details shown across the PMS."}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Saving…" : editing === "new" ? "Create property" : "Save changes"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {formError && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
              {formError}
            </p>
          )}
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Property name <span className="text-red-500">*</span></span>
            <input autoFocus className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="e.g. Shaw Hotel" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Code <span className="text-red-500">*</span></span>
            <input className={cn("h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20", "font-mono uppercase")} placeholder="e.g. bbsr" maxLength={12} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
            <span className="mt-1 block text-[11px] text-slate-400">Short unique code: letters, numbers or hyphens.</span>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">City</span>
            <input className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="e.g. Bhubaneswar" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Time zone</span>
            <input className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" placeholder="Asia/Kolkata" value={form.timezone} onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))} />
          </label>
        </div>
      </Modal>
    </WorkspaceShell>
  );
}
