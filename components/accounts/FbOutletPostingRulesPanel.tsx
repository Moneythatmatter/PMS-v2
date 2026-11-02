"use client";

import React, { useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Save, Store, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  accAccountService,
  accDivisionService,
  accOutletPostingRuleService,
  type OutletPostingRule,
  type OutletRuleBillingPoint,
} from "@/services/accounts";
import { accErrorMessage, useAccQuery } from "@/components/accounts/accountsApi";

type Draft = {
  id: string | null;
  outletId: string;
  billingPoint: OutletRuleBillingPoint | "";
  divisionId: string;
  incomeAccountId: string;
  cashAccountId: string;
  status: "Active" | "Inactive";
};

const EMPTY: Draft = { id: null, outletId: "", billingPoint: "", divisionId: "", incomeAccountId: "", cashAccountId: "", status: "Active" };

const POINTS: { value: OutletRuleBillingPoint | ""; label: string }[] = [
  { value: "", label: "All F&B bills" },
  { value: "FB_RESTAURANT_BILL", label: "Dine-in / takeaway bills" },
  { value: "FB_ROOM_SERVICE", label: "Room service bills" },
];

const selectCls =
  "h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-800 focus:border-emerald-500 focus:outline-none";

export function FbOutletPostingRulesPanel({
  onChanged,
  onMessage,
}: {
  onChanged: () => void;
  onMessage: (message: string, variant: "success" | "error") => void;
}) {
  const rules = useAccQuery(() => accOutletPostingRuleService.list(), []);
  const outlets = useAccQuery(() => accOutletPostingRuleService.outlets(), []);
  const divisions = useAccQuery(() => accDivisionService.list({ status: "Active" }), []);
  const accounts = useAccQuery(() => accAccountService.list(), []);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const ledgers = useMemo(
    () => (accounts.data ?? []).filter((a) => a.accountType === "Ledger" && a.allowPosting && a.status === "Active"),
    [accounts.data],
  );
  const incomeLedgers = useMemo(() => {
    const income = ledgers.filter((a) => a.nature === "Income");
    return income.length ? income : ledgers;
  }, [ledgers]);
  const cashLedgers = useMemo(() => {
    const cash = ledgers.filter((a) => a.isCashAccount);
    return cash.length ? cash : ledgers.filter((a) => a.nature === "Asset");
  }, [ledgers]);

  const unmapped = useMemo(() => {
    const withDivision = new Set(
      (rules.data ?? []).filter((r) => r.status === "Active" && r.divisionId).map((r) => r.outletId),
    );
    return (outlets.data ?? []).filter((o) => !withDivision.has(o.id));
  }, [rules.data, outlets.data]);

  const edit = (r: OutletPostingRule) =>
    setDraft({
      id: r.id,
      outletId: r.outletId,
      billingPoint: r.billingPoint ?? "",
      divisionId: r.divisionId ?? "",
      incomeAccountId: r.incomeAccountId ?? "",
      cashAccountId: r.cashAccountId ?? "",
      status: r.status,
    });

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const body = {
        outletId: draft.outletId,
        billingPoint: draft.billingPoint || null,
        divisionId: draft.divisionId || null,
        incomeAccountId: draft.incomeAccountId || null,
        cashAccountId: draft.cashAccountId || null,
        status: draft.status,
      };
      if (draft.id) await accOutletPostingRuleService.update(draft.id, body);
      else await accOutletPostingRuleService.create(body);
      onMessage("Outlet posting rule saved.", "success");
      setDraft(null);
      await rules.reload();
      onChanged();
    } catch (e) {
      onMessage(accErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r: OutletPostingRule) => {
    if (!window.confirm(`Delete the rule for ${r.outletName} (${r.billingPointLabel})?`)) return;
    try {
      await accOutletPostingRuleService.remove(r.id);
      onMessage("Outlet posting rule deleted.", "success");
      await rules.reload();
      onChanged();
    } catch (e) {
      onMessage(accErrorMessage(e), "error");
    }
  };

  const loading = rules.loading || outlets.loading;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-900">
            <Store className="h-3.5 w-3.5 text-slate-500" /> Outlet posting rules
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Map each outlet to a division (revenue centre) so its sales, tax and collections stay traceable in Accounts.
            Optionally send its income or cash to its own ledgers. A rule for room service bills overrides the
            outlet-wide rule. Room service charged to a guest room follows the same rules in Front Office Posting.
          </p>
        </div>
        {!draft && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setDraft({ ...EMPTY, outletId: unmapped[0]?.id ?? "" })}
            className="shrink-0 rounded-xl bg-white text-xs font-medium shadow-xs"
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Add rule
          </Button>
        )}
      </div>

      {unmapped.length > 0 && !loading && (
        <p className="mb-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
          No division yet: {unmapped.map((o) => o.name).join(", ")}. Their sales post under the billing point&apos;s
          default division.
        </p>
      )}

      {draft && (
        <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 lg:grid-cols-6">
          <label className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Outlet</span>
            <select className={selectCls} value={draft.outletId} onChange={(e) => setDraft({ ...draft, outletId: e.target.value })}>
              <option value="">Select outlet</option>
              {(outlets.data ?? []).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Applies to</span>
            <select
              className={selectCls}
              value={draft.billingPoint}
              onChange={(e) => setDraft({ ...draft, billingPoint: e.target.value as Draft["billingPoint"] })}
            >
              {POINTS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Division</span>
            <select className={selectCls} value={draft.divisionId} onChange={(e) => setDraft({ ...draft, divisionId: e.target.value })}>
              <option value="">Billing point default</option>
              {(divisions.data ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.divisionCode} · {d.divisionName}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Income ledger</span>
            <select
              className={selectCls}
              value={draft.incomeAccountId}
              onChange={(e) => setDraft({ ...draft, incomeAccountId: e.target.value })}
            >
              <option value="">Revenue category ledger</option>
              {incomeLedgers.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} · {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cash ledger</span>
            <select
              className={selectCls}
              value={draft.cashAccountId}
              onChange={(e) => setDraft({ ...draft, cashAccountId: e.target.value })}
            >
              <option value="">Payment method ledger</option>
              {cashLedgers.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} · {a.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-1.5">
            <select
              className={selectCls}
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value as Draft["status"] })}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <Button
              type="button"
              size="sm"
              onClick={() => void save()}
              disabled={saving || !draft.outletId}
              className="h-8 rounded-lg bg-emerald-700 px-2.5 text-white hover:bg-emerald-800 disabled:opacity-50"
              aria-label="Save rule"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setDraft(null)}
              className="h-8 rounded-lg bg-white px-2.5"
              aria-label="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : rules.error ? (
        <p className="text-rose-700">{rules.error}</p>
      ) : !rules.data?.length ? (
        <p className="py-4 text-center text-slate-500">No outlet rules yet.</p>
      ) : (
        <table className="w-full text-left text-[11px]">
          <thead className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="py-1.5">Outlet</th>
              <th className="py-1.5">Applies to</th>
              <th className="py-1.5">Division</th>
              <th className="py-1.5">Income ledger</th>
              <th className="py-1.5">Cash ledger</th>
              <th className="py-1.5">Status</th>
              <th className="py-1.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rules.data.map((r) => (
              <tr key={r.id}>
                <td className="py-1.5 font-semibold text-slate-800">{r.outletName}</td>
                <td className="py-1.5 text-slate-600">{r.billingPointLabel}</td>
                <td className="py-1.5 text-slate-600">{r.divisionName ?? "—"}</td>
                <td className="py-1.5 text-slate-600">
                  {r.incomeAccountName ? `${r.incomeAccountCode} · ${r.incomeAccountName}` : "Default"}
                </td>
                <td className="py-1.5 text-slate-600">
                  {r.cashAccountName ? `${r.cashAccountCode} · ${r.cashAccountName}` : "Default"}
                </td>
                <td className="py-1.5">{r.status}</td>
                <td className="py-1.5 text-right">
                  <button
                    type="button"
                    onClick={() => edit(r)}
                    className="mr-1 rounded-md p-1 text-slate-500 hover:bg-slate-100"
                    aria-label="Edit rule"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(r)}
                    className="rounded-md p-1 text-rose-600 hover:bg-rose-50"
                    aria-label="Delete rule"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
