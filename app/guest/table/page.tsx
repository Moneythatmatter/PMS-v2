"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock3, UtensilsCrossed, XCircle } from "lucide-react";
import {
  GuestTableApi,
  type GuestMenu,
  type GuestTableContext,
  type GuestTableRequestStatus,
} from "@/services/front-office/guest-portal";
import {
  CartBar,
  CenterMessage,
  GuestMenuPicker,
  Shell,
  cartSummary,
  formatTime,
  money,
  type GuestCart,
} from "@/components/guest/GuestUi";

const REQUEST_TTL_MS = 6 * 60 * 60 * 1000;
const POLL_MS = 15000;

type StoredRequest = { id: string; at: number };

const storageKey = (tableId: string) => `guest-table-requests:${tableId}`;

function readStored(tableId: string): StoredRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const list = JSON.parse(localStorage.getItem(storageKey(tableId)) ?? "[]") as StoredRequest[];
    return list.filter((r) => r && r.id && Date.now() - r.at < REQUEST_TTL_MS);
  } catch {
    return [];
  }
}

function writeStored(tableId: string, list: StoredRequest[]) {
  try {
    localStorage.setItem(storageKey(tableId), JSON.stringify(list.slice(0, 20)));
  } catch {
    /* storage unavailable (private mode) — statuses just won't persist */
  }
}

const STATUS_UI: Record<GuestTableRequestStatus["status"], { label: string; tone: string; icon: typeof Clock3 }> = {
  Pending: { label: "Waiting for staff", tone: "bg-amber-50 text-amber-700", icon: Clock3 },
  Accepted: { label: "Confirmed · sent to kitchen", tone: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  Rejected: { label: "Declined", tone: "bg-rose-50 text-rose-700", icon: XCircle },
  Cancelled: { label: "Cancelled", tone: "bg-slate-100 text-slate-600", icon: XCircle },
};

function GuestTablePortal() {
  const params = useSearchParams();
  const tableId = params.get("tb") ?? "";
  const token = params.get("t") ?? "";
  const linkIncomplete = !tableId || !token;

  const [ctx, setCtx] = useState<GuestTableContext | null>(null);
  const [menu, setMenu] = useState<GuestMenu | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cart, setCart] = useState<GuestCart>({});
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [pax, setPax] = useState("");
  const [instructions, setInstructions] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [requestIds, setRequestIds] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<GuestTableRequestStatus[]>([]);

  useEffect(() => {
    if (linkIncomplete) return;
    let cancelled = false;
    Promise.all([GuestTableApi.context(tableId, token), GuestTableApi.menu(tableId, token)])
      .then(([c, m]) => {
        if (cancelled) return;
        setCtx(c);
        setMenu(m);
        setRequestIds(readStored(tableId).map((r) => r.id));
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Unable to open this table");
      });
    return () => {
      cancelled = true;
    };
  }, [linkIncomplete, tableId, token]);

  const idsKey = requestIds.join(",");
  const hasPending = statuses.length === 0 || statuses.some((s) => s.status === "Pending");

  useEffect(() => {
    if (linkIncomplete || !idsKey) return;
    let cancelled = false;
    const load = () =>
      GuestTableApi.statuses(tableId, token, idsKey.split(","))
        .then((rows) => {
          if (!cancelled) setStatuses(rows);
        })
        .catch(() => undefined);
    void load();
    const timer = hasPending ? window.setInterval(load, POLL_MS) : undefined;
    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [linkIncomplete, tableId, token, idsKey, hasPending]);

  const cartInfo = cartSummary(menu, cart);

  const sendRequest = async () => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const paxNum = parseInt(pax, 10);
      const res = await GuestTableApi.submit(tableId, token, {
        lines: cartInfo.lines,
        guestName: guestName.trim() || undefined,
        guestPhone: guestPhone.trim() || undefined,
        pax: Number.isFinite(paxNum) && paxNum > 0 ? paxNum : undefined,
        instructions: instructions.trim() || undefined,
      });
      const stored = [{ id: res.id, at: Date.now() }, ...readStored(tableId)];
      writeStored(tableId, stored);
      setRequestIds(stored.map((r) => r.id));
      setCart({});
      setInstructions("");
      setSuccess(
        `Request ${res.requestNo} (${money(res.subtotal)}) sent. Our staff will confirm your order shortly.`,
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (linkIncomplete) {
    return (
      <CenterMessage
        title="Unable to open the menu"
        body="This QR code is incomplete. Please scan the code on your table again."
      />
    );
  }
  if (loadError && !ctx) return <CenterMessage title="Unable to open the menu" body={loadError} />;
  if (!ctx) return <CenterMessage title="Loading menu…" loading />;

  return (
    <Shell>
      <div className="rounded-3xl bg-emerald-800 p-5 text-white shadow-md">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200">
          {ctx.outletName ?? "Restaurant"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Table {ctx.tableNo}</h1>
        <div className="mt-3 flex items-center gap-2 text-sm text-emerald-100">
          <UtensilsCrossed className="h-4 w-4" />
          <span>Browse the menu and send your order — our staff will confirm it.</span>
        </div>
      </div>

      {success && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}
      {!ctx.accepting && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This outlet is not taking orders right now. Please ask the staff for help.
        </div>
      )}

      {statuses.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your requests</p>
          <ul className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {statuses.map((r) => {
              const ui = STATUS_UI[r.status] ?? STATUS_UI.Pending;
              return (
                <li key={r.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {r.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {r.requestNo} · {money(r.subtotal)} · {formatTime(r.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ui.tone}`}
                    >
                      <ui.icon className="h-3 w-3" />
                      {ui.label}
                    </span>
                  </div>
                  {r.status === "Rejected" && r.rejectReason && (
                    <p className="mt-1 text-xs text-rose-600">Reason: {r.rejectReason}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <GuestMenuPicker menu={menu} loading={!menu} cart={cart} onCartChange={setCart} />
      </div>

      {cartInfo.count > 0 && (
        <div className="mt-6 space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your details (optional)</p>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              maxLength={80}
              placeholder="Name"
              className="col-span-2 rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
            />
            <input
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              maxLength={20}
              inputMode="tel"
              placeholder="Phone"
              className="rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
            />
            <input
              value={pax}
              onChange={(e) => setPax(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              maxLength={2}
              placeholder="Guests"
              className="rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
            />
          </div>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Special instructions — less spicy, no onion…"
            className="w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
          />
        </div>
      )}

      <CartBar
        count={ctx.accepting ? cartInfo.count : 0}
        total={cartInfo.total}
        caption={`Table ${ctx.tableNo}`}
        actionLabel="Send order"
        busy={busy}
        onAction={sendRequest}
      />
    </Shell>
  );
}

export default function GuestTablePage() {
  return (
    <Suspense fallback={<CenterMessage title="Loading menu…" loading />}>
      <GuestTablePortal />
    </Suspense>
  );
}
