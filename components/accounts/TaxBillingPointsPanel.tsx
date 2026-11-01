"use client";

import React, { useMemo, useState } from "react";
import { ArrowRight, Loader2, Pencil, Plus, Save, Trash2, Waypoints } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField, SelectInput, TextAreaInput, TextInput } from "@/components/frontoffice/ui";
import {
  accTaxApplicationService,
  type Status,
  type TaxApplication,
  type TaxBillingPoint,
  type TaxRule,
} from "@/services/accounts";
import {
  accErrorMessage,
  formatDate,
  formatINR,
  todayIso,
  useAccLookups,
  useAccQuery,
} from "@/components/accounts/accountsApi";
import { cn } from "@/lib/utils";

type Draft = {
  id: string | null;
  billingPoint: string;
  revenueCategoryId: string;
  priceIncludesTax: boolean;
  taxRuleIds: string[];
  effectiveFrom: string;
  effectiveTo: string;
  description: string;
  status: Status;
};

function blankDraft(billingPoint: string): Draft {
  return {
    id: null,
    billingPoint,
    revenueCategoryId: "",
    priceIncludesTax: false,
    taxRuleIds: [],
    effectiveFrom: todayIso(),
    effectiveTo: "",
    description: "",
    status: "Active",
  };
}

function inEffect(a: TaxApplication, day: string) {
  return a.status === "Active" && a.effectiveFrom.slice(0, 10) <= day && (!a.effectiveTo || a.effectiveTo.slice(0, 10) >= day);
}

function rateLabel(t: { rate: number; calculationType: string }) {
  return t.calculationType === "Fixed" ? formatINR(t.rate) : `${Number(t.rate)}%`;
}

function gstSummary(a: TaxApplication) {
  if (!a.rules?.length) return "Category's tax rules";
  return a.rules.map((r) => `${r.taxCode} ${rateLabel(r)} (${slabLabel(r)})`).join(", ");
}

function slabLabel(r: { minimumAmount: number | null; maximumAmount: number | null }) {
  if (r.minimumAmount == null && r.maximumAmount == null) return "Any amount";
  if (r.maximumAmount == null) return `Above ${formatINR(r.minimumAmount)}`;
  return `${formatINR(r.minimumAmount ?? 0)} – ${formatINR(r.maximumAmount)}`;
}

export function TaxBillingPointsPanel({
  taxRules,
  notify,
}: {
  taxRules: TaxRule[];
  notify: (message: string, variant?: "success" | "error") => void;
}) {
  const pointsQuery = useAccQuery(() => accTaxApplicationService.billingPoints(), []);
  const appsQuery = useAccQuery(() => accTaxApplicationService.list(), []);
  const { lookups } = useAccLookups();
  const categories = lookups?.revenueCategories ?? [];
  const points: TaxBillingPoint[] = useMemo(() => pointsQuery.data ?? [], [pointsQuery.data]);
  const apps: TaxApplication[] = useMemo(() => appsQuery.data ?? [], [appsQuery.data]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const today = todayIso();
  const activeRules = useMemo(
    () =>
      taxRules
        .filter((r) => r.status === "Active")
        .sort(
          (a, b) =>
            (a.taxCode ?? "").localeCompare(b.taxCode ?? "") || (a.minimumAmount ?? 0) - (b.minimumAmount ?? 0),
        ),
    [taxRules],
  );

  const rulesByCategory = useMemo(() => {
    const map = new Map<string, TaxRule[]>();
    for (const r of taxRules) {
      if (r.status !== "Active" || !r.revenueCategoryId) continue;
      map.set(r.revenueCategoryId, [...(map.get(r.revenueCategoryId) ?? []), r]);
    }
    for (const list of map.values()) list.sort((a, b) => a.priority - b.priority);
    return map;
  }, [taxRules]);

  const startEdit = (a: TaxApplication) =>
    setDraft({
      id: a.id,
      billingPoint: a.billingPoint,
      revenueCategoryId: a.revenueCategoryId,
      priceIncludesTax: a.priceIncludesTax,
      taxRuleIds: a.taxRuleIds ?? [],
      effectiveFrom: a.effectiveFrom.slice(0, 10),
      effectiveTo: a.effectiveTo?.slice(0, 10) ?? "",
      description: a.description ?? "",
      status: a.status,
    });

  const save = async () => {
    if (!draft) return;
    if (!draft.revenueCategoryId) {
      notify("Choose a revenue category.", "error");
      return;
    }
    setSaving(true);
    const body = {
      billingPoint: draft.billingPoint,
      revenueCategoryId: draft.revenueCategoryId,
      priceIncludesTax: draft.priceIncludesTax,
      taxRuleIds: draft.taxRuleIds,
      effectiveFrom: draft.effectiveFrom,
      effectiveTo: draft.effectiveTo || null,
      description: draft.description,
      status: draft.status,
    };
    try {
      if (draft.id) await accTaxApplicationService.update(draft.id, body);
      else await accTaxApplicationService.create(body);
      notify("Billing point mapping saved.");
      setDraft(null);
      await appsQuery.reload();
    } catch (e) {
      notify(accErrorMessage(e), "error");
      const fresh = await appsQuery.reload();
      if (draft.id && fresh && !fresh.some((a) => a.id === draft.id)) setDraft(null);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (a: TaxApplication) => {
    if (!window.confirm(`Delete this mapping for ${a.billingPointLabel}?`)) return;
    try {
      await accTaxApplicationService.remove(a.id);
      notify("Mapping deleted.");
      await appsQuery.reload();
    } catch (e) {
      notify(accErrorMessage(e), "error");
    }
  };

  if (pointsQuery.loading || appsQuery.loading) {
    return (
      <div className="flex h-48 items-center justify-center gap-2 text-xs text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading billing points…
      </div>
    );
  }
  const loadError = pointsQuery.error ?? appsQuery.error;
  if (loadError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
        {loadError}
        {/acc_tax_applications|missing/i.test(loadError) && (
          <p className="mt-1">Run backend/sql/accounts-tax-billing-points.sql in Supabase.</p>
        )}
      </div>
    );
  }

  return (
    <div className="mb-6 space-y-4 text-xs">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <Waypoints className="h-4 w-4 text-emerald-700" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Where each tax applies</h3>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          Tax Rules say which tax applies for which amount. Here you pick the rules each bill uses — e.g. Room charge:
          5% up to ₹7,500 and 18% above. The revenue category decides the income ledger.
        </p>
      </div>

      {points.map((point) => {
        const rows = apps.filter((a) => a.billingPoint === point.code);
        const current = rows.find((a) => inEffect(a, today)) ?? null;
        const rules = current ? rulesByCategory.get(current.revenueCategoryId) ?? [] : [];
        const editing = draft?.billingPoint === point.code ? draft : null;

        return (
          <div key={point.code} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{point.module}</p>
                <p className="text-sm font-bold text-slate-900">{point.label}</p>
                <p className="mt-0.5 font-mono text-[10px] text-slate-400">{point.code}</p>
              </div>
              <div className="flex items-center gap-2">
                {current ? (
                  <span className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800">
                    <ArrowRight className="h-3 w-3" /> {current.revenueCategoryName ?? "—"}
                    {current.priceIncludesTax && <span className="font-medium text-emerald-700">· price incl. tax</span>}
                  </span>
                ) : (
                  <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                    {point.defaultCategoryCode ? `Default: ${point.defaultCategoryCode}` : "Not mapped — no tax charged"}
                  </span>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs font-semibold"
                  onClick={() => (current ? startEdit(current) : setDraft(blankDraft(point.code)))}
                  disabled={saving}
                >
                  {current ? (
                    <>
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Edit mapping
                    </>
                  ) : (
                    <>
                      <Plus className="mr-1 h-3.5 w-3.5" /> Map
                    </>
                  )}
                </Button>
              </div>
            </div>

            {current && (
              <div className="mt-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Tax applied today</p>
                {current.rules?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {current.rules.map((r) => (
                      <span
                        key={r.id}
                        className={cn(
                          "rounded-lg border px-2 py-1 text-[11px]",
                          r.status === "Active"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                            : "border-rose-200 bg-rose-50 text-rose-700",
                        )}
                      >
                        {slabLabel(r)} → <b>{r.taxCode}</b> ({rateLabel(r)})
                        {r.status !== "Active" && " — inactive, billing blocked"}
                      </span>
                    ))}
                  </div>
                ) : rules.length === 0 ? (
                  <p className="text-[11px] font-semibold text-rose-600">
                    No active tax rule for {current.revenueCategoryName} — billing at this point will be blocked.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {rules.map((r) => (
                      <span key={r.id} className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-700">
                        {slabLabel(r)} → <b>{r.taxCode ?? r.taxName}</b>
                        {r.taxRate != null ? ` (${r.taxRate}%)` : ""}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {rows.length > 0 && (
              <table className="mt-3 w-full text-left text-[11px]">
                <thead className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-1.5">Revenue category</th>
                    <th className="py-1.5">GST</th>
                    <th className="py-1.5">Price</th>
                    <th className="py-1.5">Effective</th>
                    <th className="py-1.5">Status</th>
                    <th className="py-1.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((a) => (
                    <tr key={a.id} className={cn(current?.id === a.id && "bg-emerald-50/40")}>
                      <td className="py-1.5 font-semibold text-slate-800">{a.revenueCategoryName ?? "—"}</td>
                      <td className="py-1.5">{gstSummary(a)}</td>
                      <td className="py-1.5">{a.priceIncludesTax ? "Includes tax" : "Tax added"}</td>
                      <td className="py-1.5">
                        {formatDate(a.effectiveFrom)} – {a.effectiveTo ? formatDate(a.effectiveTo) : "open"}
                      </td>
                      <td className="py-1.5">{a.status}</td>
                      <td className="py-1.5 text-right">
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => startEdit(a)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          onClick={() => void remove(a)}
                          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {editing && (
              <div className="mt-3 grid gap-3 rounded-xl border border-emerald-200 bg-emerald-50/30 p-3 sm:grid-cols-2">
                <FormField label="Revenue category" required>
                  <SelectInput
                    value={editing.revenueCategoryId}
                    onChange={(e) => setDraft({ ...editing, revenueCategoryId: e.target.value })}
                  >
                    <option value="">Select category…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.revenueCategoryName} ({c.revenueCategoryCode})
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
                <FormField label="Menu / tariff price">
                  <SelectInput
                    value={editing.priceIncludesTax ? "incl" : "excl"}
                    onChange={(e) => setDraft({ ...editing, priceIncludesTax: e.target.value === "incl" })}
                  >
                    <option value="excl">Tax added on top of price</option>
                    <option value="incl">Price already includes tax</option>
                  </SelectInput>
                </FormField>
                <div className="sm:col-span-2">
                  <p className="mb-1.5 text-xs font-medium text-slate-600">Tax rules to apply</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setDraft({ ...editing, taxRuleIds: [] })}
                      className={cn(
                        "rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold",
                        editing.taxRuleIds.length === 0
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      Category&apos;s rules
                    </button>
                    {activeRules.map((t) => {
                      const on = editing.taxRuleIds.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() =>
                            setDraft({
                              ...editing,
                              taxRuleIds: on
                                ? editing.taxRuleIds.filter((id) => id !== t.id)
                                : [...editing.taxRuleIds, t.id],
                            })
                          }
                          className={cn(
                            "rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold",
                            on
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                          )}
                        >
                          {t.taxCode ?? t.taxName}
                          {t.taxRate != null ? ` ${t.taxRate}%` : ""} · {slabLabel(t)}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    {editing.taxRuleIds.length
                      ? "Each picked rule applies in its own amount range. Rules with the same range add up (e.g. CGST + SGST); partly overlapping ranges are not allowed."
                      : "No rules picked: the Tax Rules linked to the revenue category above are used."}
                  </p>
                </div>
                <FormField label="Effective from" required>
                  <TextInput
                    type="date"
                    value={editing.effectiveFrom}
                    onChange={(e) => setDraft({ ...editing, effectiveFrom: e.target.value })}
                  />
                </FormField>
                <FormField label="Effective to" helperText="Leave empty for no end date">
                  <TextInput
                    type="date"
                    value={editing.effectiveTo}
                    onChange={(e) => setDraft({ ...editing, effectiveTo: e.target.value })}
                  />
                </FormField>
                <FormField label="Status">
                  <SelectInput
                    value={editing.status}
                    onChange={(e) => setDraft({ ...editing, status: e.target.value as Status })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </SelectInput>
                </FormField>
                <FormField label="Description">
                  <TextAreaInput
                    className="min-h-[38px]"
                    value={editing.description}
                    onChange={(e) => setDraft({ ...editing, description: e.target.value })}
                  />
                </FormField>
                <div className="flex gap-2 sm:col-span-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void save()}
                    disabled={saving}
                    className="rounded-xl bg-slate-900 text-xs font-bold text-white hover:bg-slate-800"
                  >
                    {saving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1 h-3.5 w-3.5" />}
                    Save mapping
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setDraft(null)}
                    disabled={saving}
                    className="rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
