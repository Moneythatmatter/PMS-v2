"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BedDouble, CheckCircle2, Pencil, Shirt, Sparkles, UtensilsCrossed } from "lucide-react";
import {
  GuestPortalApi,
  type GuestMenu,
  type GuestPortalContext,
  type GuestPortalRecent,
} from "@/services/front-office/guest-portal";
import {
  BackHeader,
  CartBar,
  CenterMessage as BaseCenterMessage,
  Chip,
  GuestMenuPicker,
  PrimaryButton,
  Shell,
  cartSummary,
  formatTime,
  money,
  type GuestCart,
} from "@/components/guest/GuestUi";

type View = "home" | "food" | "cleaning" | "laundry";

const CLEANING_TIMES = ["As soon as possible", "In 30 minutes", "In 1 hour", "When I'm out of the room"];
const LAUNDRY_SERVICES = ["Wash & Iron", "Dry Clean", "Iron Only"];

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (/(complete|delivered|served|settled|done|closed)/.test(s)) return "bg-emerald-50 text-emerald-700";
  if (/(cancel|reject|declin)/.test(s)) return "bg-rose-50 text-rose-700";
  if (/(progress|preparing|processing|assigned|kitchen|washing|confirmed)/.test(s)) return "bg-sky-50 text-sky-700";
  return "bg-amber-50 text-amber-700";
}

function prettyStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const KIND_ICON: Record<GuestPortalRecent["kind"], typeof UtensilsCrossed> = {
  food: UtensilsCrossed,
  cleaning: Sparkles,
  laundry: Shirt,
};

const CenterMessage = (props: { title: string; body?: string; loading?: boolean }) => (
  <BaseCenterMessage {...props} icon={BedDouble} />
);

function GuestRoomPortal() {
  const params = useSearchParams();
  const roomId = params.get("r") ?? "";
  const token = params.get("t") ?? "";

  const [ctx, setCtx] = useState<GuestPortalContext | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<View>("home");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [menu, setMenu] = useState<GuestMenu | null>(null);
  const [menuLoading, setMenuLoading] = useState(false);
  const [cart, setCart] = useState<GuestCart>({});
  const [instructions, setInstructions] = useState("");

  const [cleaningTime, setCleaningTime] = useState(CLEANING_TIMES[0]);
  const [cleaningNotes, setCleaningNotes] = useState("");

  const [laundryService, setLaundryService] = useState(LAUNDRY_SERVICES[0]);
  const [laundryExpress, setLaundryExpress] = useState(false);
  const [laundryNotes, setLaundryNotes] = useState("");

  const loadContext = useCallback(async () => {
    try {
      setCtx(await GuestPortalApi.context(roomId, token));
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Unable to load this room");
    }
  }, [roomId, token]);

  const linkIncomplete = !roomId || !token;

  useEffect(() => {
    if (linkIncomplete) return;
    let cancelled = false;
    GuestPortalApi.context(roomId, token)
      .then((data) => {
        if (!cancelled) setCtx(data);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Unable to load this room");
      });
    return () => {
      cancelled = true;
    };
  }, [linkIncomplete, roomId, token]);

  const cartInfo = cartSummary(menu, cart);

  const go = (next: View) => {
    setError(null);
    setSuccess(null);
    setView(next);
  };

  const resetForms = () => {
    setCart({});
    setInstructions("");
    setCleaningTime(CLEANING_TIMES[0]);
    setCleaningNotes("");
    setLaundryService(LAUNDRY_SERVICES[0]);
    setLaundryExpress(false);
    setLaundryNotes("");
  };

  const backHome = () => {
    if (editingId) {
      setEditingId(null);
      resetForms();
    }
    go("home");
  };

  const startEdit = (r: GuestPortalRecent) => {
    const edit = r.edit ?? {};
    resetForms();
    if (r.kind === "food") {
      setCart(Object.fromEntries((edit.lines ?? []).map((l) => [l.menuItemId, l.qty])));
      setInstructions(edit.instructions ?? "");
    } else if (r.kind === "cleaning") {
      setCleaningTime(edit.preferredTime ?? CLEANING_TIMES[0]);
      setCleaningNotes(edit.notes ?? "");
    } else {
      setLaundryService(edit.serviceType ?? LAUNDRY_SERVICES[0]);
      setLaundryExpress(edit.urgency === "Express");
      setLaundryNotes(edit.notes ?? "");
    }
    openView(r.kind);
    setEditingId(r.id);
  };

  const openView = (next: View) => {
    go(next);
    if (next !== "food" || menu || menuLoading) return;
    setMenuLoading(true);
    GuestPortalApi.menu(roomId, token)
      .then(setMenu)
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load the menu"))
      .finally(() => setMenuLoading(false));
  };

  const submit = async (action: () => Promise<string>) => {
    setBusy(true);
    setError(null);
    try {
      const message = await action();
      setSuccess(message);
      setEditingId(null);
      setView("home");
      void loadContext();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const placeFoodOrder = () =>
    submit(async () => {
      const body = { lines: cartInfo.lines, instructions: instructions.trim() || undefined };
      const res = editingId
        ? await GuestPortalApi.updateFood(roomId, token, editingId, body)
        : await GuestPortalApi.orderFood(roomId, token, body);
      setCart({});
      setInstructions("");
      return editingId
        ? `Your order request ${res.requestNo} has been updated (${money(res.subtotal)}).`
        : `Your order request ${res.requestNo} (${money(res.subtotal)}) has been sent. Our staff will confirm it shortly.`;
    });

  const requestCleaning = () =>
    submit(async () => {
      const body = { preferredTime: cleaningTime, notes: cleaningNotes.trim() || undefined };
      if (editingId) await GuestPortalApi.updateCleaning(roomId, token, editingId, body);
      else await GuestPortalApi.requestCleaning(roomId, token, body);
      resetForms();
      return editingId
        ? "Your cleaning request has been updated."
        : "Your cleaning request has been sent. Housekeeping will confirm it shortly.";
    });

  const requestLaundry = () =>
    submit(async () => {
      const body = {
        serviceType: laundryService,
        urgency: laundryExpress ? "Express" : "Normal",
        notes: laundryNotes.trim() || undefined,
      };
      if (editingId) await GuestPortalApi.updateLaundry(roomId, token, editingId, body);
      else await GuestPortalApi.requestLaundry(roomId, token, body);
      resetForms();
      return editingId
        ? "Your laundry request has been updated."
        : "Your laundry pickup request has been sent. Housekeeping will confirm it shortly.";
    });

  if (linkIncomplete) {
    return (
      <CenterMessage
        title="Unable to open room services"
        body="This QR code is incomplete. Please scan the code in your room again."
      />
    );
  }
  if (loadError && !ctx) return <CenterMessage title="Unable to open room services" body={loadError} />;
  if (!ctx) return <CenterMessage title="Loading your room…" loading />;

  const errorBanner = error && (
    <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
  );

  if (view === "food") {
    return (
      <Shell>
        <BackHeader title={editingId ? "Edit Food Order" : "In-Room Dining"} onBack={backHome} />
        {errorBanner}
        <GuestMenuPicker menu={menu} loading={menuLoading} cart={cart} onCartChange={setCart} />
        {cartInfo.count > 0 && (
          <div className="mt-5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Special instructions
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Less spicy, no onion, extra cutlery…"
              className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
            />
          </div>
        )}
        <CartBar
          count={cartInfo.count}
          total={cartInfo.total}
          caption={`Room ${ctx.roomNo}`}
          actionLabel={editingId ? "Update order" : "Send order"}
          busy={busy}
          onAction={placeFoodOrder}
        />
      </Shell>
    );
  }

  if (view === "cleaning") {
    return (
      <Shell>
        <BackHeader title={editingId ? "Edit Cleaning Request" : "Room Cleaning"} onBack={backHome} />
        {errorBanner}
        <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">When should we come?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {CLEANING_TIMES.map((t) => (
                <Chip key={t} active={cleaningTime === t} onClick={() => setCleaningTime(t)}>
                  {t}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Anything specific?</label>
            <textarea
              value={cleaningNotes}
              onChange={(e) => setCleaningNotes(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Fresh towels, change bed linen, refill water…"
              className="mt-1.5 w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
            />
          </div>
          <PrimaryButton busy={busy} onClick={requestCleaning}>
            {editingId ? "Update cleaning request" : `Request cleaning for Room ${ctx.roomNo}`}
          </PrimaryButton>
        </div>
      </Shell>
    );
  }

  if (view === "laundry") {
    return (
      <Shell>
        <BackHeader title={editingId ? "Edit Laundry Request" : "Laundry"} onBack={backHome} />
        {errorBanner}
        <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Service</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {LAUNDRY_SERVICES.map((s) => (
                <Chip key={s} active={laundryService === s} onClick={() => setLaundryService(s)}>
                  {s}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Turnaround</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip active={!laundryExpress} onClick={() => setLaundryExpress(false)}>
                Normal
              </Chip>
              <Chip active={laundryExpress} onClick={() => setLaundryExpress(true)}>
                Express
              </Chip>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</label>
            <textarea
              value={laundryNotes}
              onChange={(e) => setLaundryNotes(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="e.g. 3 shirts, 1 suit; handle delicate fabric carefully"
              className="mt-1.5 w-full rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
            />
          </div>
          <p className="text-xs text-slate-500">
            Our staff will collect the items from your room, count them, and charges will be added to your room bill.
          </p>
          <PrimaryButton busy={busy} onClick={requestLaundry}>
            {editingId ? "Update laundry request" : "Request laundry pickup"}
          </PrimaryButton>
        </div>
      </Shell>
    );
  }

  const tiles: { view: View; title: string; body: string; icon: typeof UtensilsCrossed; tone: string }[] = [
    {
      view: "food",
      title: "Order Food",
      body: "In-room dining, delivered to your door",
      icon: UtensilsCrossed,
      tone: "bg-orange-50 text-orange-600",
    },
    {
      view: "cleaning",
      title: "Room Cleaning",
      body: "Request housekeeping at your convenience",
      icon: Sparkles,
      tone: "bg-sky-50 text-sky-600",
    },
    {
      view: "laundry",
      title: "Laundry",
      body: "Wash, iron or dry clean — we pick up",
      icon: Shirt,
      tone: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <Shell>
      <div className="rounded-3xl bg-emerald-800 p-5 text-white shadow-md">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200">Guest Services</p>
        <h1 className="mt-1 text-2xl font-semibold">
          {ctx.guestFirstName ? `Welcome, ${ctx.guestFirstName}` : "Welcome"}
        </h1>
        <div className="mt-4 flex items-center gap-2 text-sm text-emerald-100">
          <BedDouble className="h-4 w-4" />
          <span>
            Room <span className="font-semibold text-white">{ctx.roomNo}</span>
            {ctx.roomType ? ` · ${ctx.roomType}` : ""}
          </span>
        </div>
      </div>

      {success && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {!ctx.occupied && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Room services are available once you are checked in. Please contact the front desk for help.
        </div>
      )}

      <div className="mt-5 space-y-3">
        {tiles.map((tile) => (
          <button
            key={tile.view}
            type="button"
            disabled={!ctx.occupied}
            onClick={() => openView(tile.view)}
            className="flex w-full items-center gap-4 rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-xs transition hover:border-emerald-300 hover:shadow-sm disabled:opacity-50"
          >
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tile.tone}`}>
              <tile.icon className="h-6 w-6" />
            </span>
            <span className="flex-1">
              <span className="block text-base font-semibold">{tile.title}</span>
              <span className="block text-xs text-slate-500">{tile.body}</span>
            </span>
          </button>
        ))}
      </div>

      {ctx.recent.length > 0 && (
        <div className="mt-7">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your requests</p>
          <ul className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {ctx.recent.map((r) => {
              const Icon = KIND_ICON[r.kind];
              return (
                <li key={`${r.kind}-${r.id}`} className="flex items-center gap-3 px-4 py-3">
                  <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.label}</p>
                    <p className="text-[11px] text-slate-400">{formatTime(r.at)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusTone(r.status)}`}>
                      {prettyStatus(r.status)}
                    </span>
                    {r.editable && ctx.occupied && (
                      <button
                        type="button"
                        onClick={() => startEdit(r)}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Shell>
  );
}

export default function GuestRoomPage() {
  return (
    <Suspense fallback={<CenterMessage title="Loading your room…" loading />}>
      <GuestRoomPortal />
    </Suspense>
  );
}
