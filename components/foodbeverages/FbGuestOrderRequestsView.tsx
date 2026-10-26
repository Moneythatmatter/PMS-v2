"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BedDouble, BellRing, CheckCircle2, ClipboardList, Minus, Plus, QrCode, Table2, Trash2, XCircle } from "lucide-react";
import { formatINR } from "@/app/data/foodbeverages/ops";
import {
  guestOrderRequestService,
  type GuestOrderRequest,
  type GuestOrderRequestSource,
  type GuestOrderRequestStatus,
} from "@/services/food-beverages/guest-order-requests";
import type { GuestOrderLine } from "@/services/front-office/guest-portal";
import { useFbOutlets } from "@/services/food-beverages/useFbOutlets";
import { Button } from "@/components/ui/Button";
import { ModulePageShell } from "@/components/pms";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { FbOutletSelect } from "@/components/foodbeverages/FbOutletSelect";
import { cn } from "@/lib/utils";

const POLL_MS = 15000;
const ORDERS_PATH = "/food-beverages/restaurants/orders";

const STATUS_TABS: { id: "all" | GuestOrderRequestStatus; label: string }[] = [
  { id: "Pending", label: "Pending" },
  { id: "Accepted", label: "Order created" },
  { id: "Rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

const SOURCE_TABS: { id: "all" | GuestOrderRequestSource; label: string }[] = [
  { id: "all", label: "Tables & rooms" },
  { id: "Table", label: "Tables" },
  { id: "Room", label: "Rooms" },
];

const targetLabel = (r: GuestOrderRequest) =>
  r.source === "Room" ? `Room ${r.roomNo ?? "—"}` : `Table ${r.tableNo ?? "—"}`;

const statusBadge: Record<GuestOrderRequestStatus, string> = {
  Pending: "bg-amber-100 text-amber-800",
  Accepted: "bg-emerald-100 text-emerald-800",
  Rejected: "bg-red-100 text-red-800",
  Cancelled: "bg-slate-100 text-slate-600",
};

function minutesAgo(iso: string) {
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return "";
  const mins = Math.max(0, Math.round((Date.now() - d) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return hrs < 24 ? `${hrs} hr ago` : new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

const linesTotal = (lines: GuestOrderLine[]) => lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
const itemCount = (lines: GuestOrderLine[]) => lines.reduce((s, l) => s + l.qty, 0);

export function FbGuestOrderRequestsView() {
  const { outlets } = useFbOutlets(["all"]);
  const [outletId, setOutletId] = useState("");
  const [statusTab, setStatusTab] = useState<"all" | GuestOrderRequestStatus>("Pending");
  const [sourceTab, setSourceTab] = useState<"all" | GuestOrderRequestSource>("all");
  const [search, setSearch] = useState("");
  const [requests, setRequests] = useState<GuestOrderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");

  const [selected, setSelected] = useState<GuestOrderRequest | null>(null);
  const [draftLines, setDraftLines] = useState<GuestOrderLine[]>([]);
  const [draftInstructions, setDraftInstructions] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      guestOrderRequestService
        .list({ status: statusTab, outletId: outletId || undefined, source: sourceTab })
        .then((rows) => {
          if (cancelled) return;
          setRequests(rows);
          setError(null);
        })
        .catch((e) => {
          if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load guest requests");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    void load();
    const timer = window.setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [statusTab, sourceTab, outletId, refreshKey]);

  const outletNameById = useMemo(() => new Map(outlets.map((o) => [o.id, o.name])), [outlets]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter((r) =>
      [r.requestNo, targetLabel(r), r.guestName, r.guestPhone, r.outletName, ...r.lines.map((l) => l.name)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [requests, search]);

  const pendingCount = requests.filter((r) => r.status === "Pending").length;
  const pendingValue = requests.filter((r) => r.status === "Pending").reduce((s, r) => s + Number(r.subtotal), 0);

  const showToast = (message: string, variant: "success" | "error" = "success") => {
    setToastVariant(variant);
    setToast(message);
  };

  const openReview = (request: GuestOrderRequest) => {
    setSelected(request);
    setDraftLines(request.lines.map((l) => ({ ...l })));
    setDraftInstructions(request.instructions ?? "");
    setRejecting(false);
    setRejectReason("");
  };

  const closeReview = () => {
    setSelected(null);
    setRejecting(false);
  };

  const changeQty = (menuItemId: string, delta: number) =>
    setDraftLines((prev) =>
      prev.map((l) => (l.menuItemId === menuItemId ? { ...l, qty: Math.max(1, Math.min(20, l.qty + delta)) } : l)),
    );

  const removeLine = (menuItemId: string) => setDraftLines((prev) => prev.filter((l) => l.menuItemId !== menuItemId));

  const handleApprove = async () => {
    if (!selected || !draftLines.length) return;
    setSaving(true);
    try {
      const updated = await guestOrderRequestService.approve(selected.id, {
        lines: draftLines.map((l) => ({ menuItemId: l.menuItemId, qty: l.qty })),
        instructions: draftInstructions.trim(),
      });
      showToast(
        `Order${updated.orderNo ? ` ${updated.orderNo}` : ""} created for ${targetLabel(updated)} and sent to the kitchen.`,
      );
      closeReview();
      setRefreshKey((k) => k + 1);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to create order", "error");
      setRefreshKey((k) => k + 1);
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await guestOrderRequestService.reject(selected.id, rejectReason.trim());
      showToast(`Request ${selected.requestNo} rejected.`);
      closeReview();
      setRefreshKey((k) => k + 1);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Failed to reject request", "error");
    } finally {
      setSaving(false);
    }
  };

  const isPending = selected?.status === "Pending";
  const shownLines = isPending ? draftLines : (selected?.lines ?? []);

  return (
    <>
      <ModulePageShell
        eyebrow="Restaurants"
        title="Guest Order Requests"
        description="Food orders sent by guests from table and room QR codes. Review each request, adjust if needed, then create the order."
        wrapChildren={false}
        toast={toast}
        toastVariant={toastVariant}
        onDismissToast={() => setToast(null)}
        beforeFilters={<FbOutletSelect outlets={outlets} value={outletId} onChange={setOutletId} allowAll />}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search table, room, guest, item, request no…"
        stats={[
          { label: "Waiting for review", value: String(pendingCount), accent: "#d97706", icon: BellRing },
          { label: "Pending value", value: formatINR(pendingValue), accent: "#0f766e", sublabel: "Before review" },
          { label: "Shown", value: String(filtered.length), accent: "#475569", icon: ClipboardList },
        ]}
      >
        <div className="mb-3 flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setLoading(true);
                setStatusTab(tab.id);
              }}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition",
                statusTab === tab.id ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {tab.label}
            </button>
          ))}
          <span className="mx-1 w-px shrink-0 bg-slate-200" />
          {SOURCE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setLoading(true);
                setSourceTab(tab.id);
              }}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition",
                sourceTab === tab.id ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : loading && !requests.length ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-12 text-center text-slate-400">
            <QrCode className="mx-auto mb-2 h-8 w-8 opacity-40" />
            {statusTab === "Pending" ? "No guest requests waiting for review" : "No guest requests found"}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => openReview(r)}
                className={cn(
                  "flex flex-col rounded-2xl border bg-white p-4 text-left shadow-xs transition hover:-translate-y-0.5 hover:shadow-sm",
                  r.status === "Pending" ? "border-amber-200" : "border-slate-200",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-1.5 text-lg font-bold text-slate-900">
                      {r.source === "Room" ? (
                        <BedDouble className="h-4 w-4 text-violet-600" />
                      ) : (
                        <Table2 className="h-4 w-4 text-emerald-700" />
                      )}
                      {targetLabel(r)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {r.source === "Room" ? "Room service" : "Dine-in"} ·{" "}
                      {(r.outletId && outletNameById.get(r.outletId)) || r.outletName || "—"} · {r.requestNo}
                    </p>
                  </div>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", statusBadge[r.status])}>
                    {r.status === "Accepted" ? "Order created" : r.status}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-slate-700">
                  {r.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")}
                </p>
                {r.instructions && (
                  <p className="mt-1 line-clamp-1 text-xs italic text-slate-500">“{r.instructions}”</p>
                )}
                <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-xs text-slate-500">
                  <span>
                    {itemCount(r.lines)} items · {r.guestName || "Guest"}
                    {r.pax ? ` · ${r.pax} pax` : ""}
                  </span>
                  <span className="font-semibold text-slate-900">{formatINR(Number(r.subtotal))}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {r.status === "Pending"
                    ? `Requested ${minutesAgo(r.createdAt)}`
                    : `${r.status === "Accepted" ? "Created" : "Reviewed"} by ${r.reviewedBy ?? "staff"} · ${formatDateTime(r.reviewedAt)}`}
                </p>
              </button>
            ))}
          </div>
        )}
      </ModulePageShell>

      <Drawer
        open={!!selected}
        onClose={closeReview}
        title={selected ? `${targetLabel(selected)} · ${selected.requestNo}` : ""}
        description={
          selected
            ? `${selected.source === "Room" ? "Room service" : "Dine-in"} · ${(selected.outletId && outletNameById.get(selected.outletId)) || selected.outletName || "Outlet"} · requested ${formatDateTime(selected.createdAt)}`
            : undefined
        }
        footer={
          selected ? (
            isPending ? (
              rejecting ? (
                <div className="flex w-full flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setRejecting(false)} disabled={saving}>
                    Back
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={handleReject}
                    disabled={saving}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    {saving ? "Rejecting…" : "Confirm reject"}
                  </Button>
                </div>
              ) : (
                <div className="flex w-full flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="gap-1.5 text-red-600 hover:bg-red-50"
                    onClick={() => setRejecting(true)}
                    disabled={saving}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                  <Button className="gap-1.5" onClick={handleApprove} disabled={saving || !draftLines.length}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {saving ? "Creating order…" : "Create Order"}
                  </Button>
                </div>
              )
            ) : (
              <div className="flex w-full flex-wrap gap-2">
                <Button variant="outline" onClick={closeReview}>
                  Close
                </Button>
                {selected.status === "Accepted" && (
                  <Link
                    href={ORDERS_PATH}
                    className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                  >
                    Go to Orders
                  </Link>
                )}
              </div>
            )
          ) : undefined
        }
      >
        {selected && (
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Guest</p>
                <p className="font-medium text-slate-900">{selected.guestName || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Phone</p>
                <p className="font-medium text-slate-900">{selected.guestPhone || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  {selected.source === "Room" ? "Billing" : "Guests"}
                </p>
                <p className="font-medium text-slate-900">
                  {selected.source === "Room" ? "Charged to room stay" : (selected.pax ?? "—")}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Status</p>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", statusBadge[selected.status])}>
                  {selected.status === "Accepted" ? "Order created" : selected.status}
                </span>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Items {isPending && <span className="font-normal normal-case text-slate-400">— adjust before creating the order</span>}
              </p>
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {shownLines.map((l) => (
                  <li key={l.menuItemId} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">{l.name}</p>
                      <p className="text-xs text-slate-500">{formatINR(l.unitPrice)} each</p>
                    </div>
                    {isPending ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => changeQty(l.menuItemId, -1)}
                          className="rounded-lg border border-slate-200 p-1 text-slate-600 hover:bg-slate-50"
                          aria-label="Decrease"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center font-semibold">{l.qty}</span>
                        <button
                          type="button"
                          onClick={() => changeQty(l.menuItemId, 1)}
                          className="rounded-lg border border-slate-200 p-1 text-slate-600 hover:bg-slate-50"
                          aria-label="Increase"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeLine(l.menuItemId)}
                          className="ml-1 rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-semibold">× {l.qty}</span>
                    )}
                    <span className="w-20 text-right font-semibold text-slate-900">{formatINR(l.qty * l.unitPrice)}</span>
                  </li>
                ))}
                {!shownLines.length && (
                  <li className="px-3 py-4 text-center text-xs text-slate-400">All items removed — reject the request instead.</li>
                )}
              </ul>
              <div className="mt-2 flex justify-between px-1 font-semibold text-slate-900">
                <span>Subtotal</span>
                <span>{formatINR(linesTotal(shownLines))}</span>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Instructions</p>
              {isPending ? (
                <textarea
                  value={draftInstructions}
                  onChange={(e) => setDraftInstructions(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="No special instructions"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                />
              ) : (
                <p className="text-slate-700">{selected.instructions || "—"}</p>
              )}
            </div>

            {rejecting && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-red-600">Reason (shown to guest)</p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={2}
                  maxLength={300}
                  autoFocus
                  placeholder="e.g. Item unavailable, kitchen closed…"
                  className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm outline-none focus:border-red-400"
                />
              </div>
            )}

            {selected.status === "Accepted" && (
              <p className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-800">
                Order <strong>{selected.orderNo ?? selected.orderId}</strong> created by {selected.reviewedBy ?? "staff"} on{" "}
                {formatDateTime(selected.reviewedAt)}.
              </p>
            )}
            {selected.status === "Rejected" && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-red-700">
                Rejected by {selected.reviewedBy ?? "staff"} on {formatDateTime(selected.reviewedAt)}
                {selected.rejectReason ? ` — ${selected.rejectReason}` : ""}.
              </p>
            )}
          </div>
        )}
      </Drawer>
    </>
  );
}
