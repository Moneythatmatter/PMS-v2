"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Loader2, Minus, Plus, UtensilsCrossed } from "lucide-react";
import type { GuestMenu } from "@/services/front-office/guest-portal";

export const money = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

export function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-md px-4 pb-28 pt-6">{children}</div>
    </div>
  );
}

export function CenterMessage({
  title,
  body,
  loading,
  icon: Icon = UtensilsCrossed,
}: {
  title: string;
  body?: string;
  loading?: boolean;
  icon?: typeof UtensilsCrossed;
}) {
  return (
    <Shell>
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <Icon className="h-7 w-7" />
          </div>
        )}
        <h1 className="mt-4 text-lg font-semibold">{title}</h1>
        {body && <p className="mt-2 max-w-xs text-sm text-slate-500">{body}</p>}
      </div>
    </Shell>
  );
}

export function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-xs"
        aria-label="Back"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
        active ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-200 bg-white text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({
  children,
  disabled,
  busy,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  busy?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export type GuestCart = Record<string, number>;

export function cartSummary(menu: GuestMenu | null, cart: GuestCart) {
  const byId = new Map((menu?.items ?? []).map((i) => [i.id, i]));
  const lines = Object.entries(cart).filter(([id, qty]) => qty > 0 && byId.has(id));
  return {
    lines: lines.map(([menuItemId, qty]) => ({ menuItemId, qty })),
    count: lines.reduce((s, [, q]) => s + q, 0),
    total: lines.reduce((s, [id, q]) => s + (byId.get(id)?.price ?? 0) * q, 0),
  };
}

/** Category tabs + item list with add / quantity controls. */
export function GuestMenuPicker({
  menu,
  loading,
  cart,
  onCartChange,
}: {
  menu: GuestMenu | null;
  loading: boolean;
  cart: GuestCart;
  onCartChange: (next: GuestCart) => void;
}) {
  const [category, setCategory] = useState("all");
  const visibleItems = useMemo(
    () => (menu?.items ?? []).filter((i) => category === "all" || i.categoryId === category),
    [menu, category],
  );

  if (loading && !menu) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
      </div>
    );
  }
  if (!menu?.items.length) {
    return <p className="py-16 text-center text-sm text-slate-500">The menu is not available right now.</p>;
  }

  const changeQty = (id: string, delta: number) =>
    onCartChange({ ...cart, [id]: Math.max(0, Math.min(20, (cart[id] ?? 0) + delta)) });

  return (
    <>
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Chip active={category === "all"} onClick={() => setCategory("all")}>
          All
        </Chip>
        {menu.categories
          .filter((c) => menu.items.some((i) => i.categoryId === c.id))
          .map((c) => (
            <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
              {c.name}
            </Chip>
          ))}
      </div>
      <ul className="space-y-3">
        {visibleItems.map((item) => {
          const qty = cart[item.id] ?? 0;
          return (
            <li key={item.id} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-3 w-3 shrink-0 rounded-sm border-2 ${
                      item.isVegetarian ? "border-emerald-600" : "border-rose-600"
                    }`}
                    title={item.isVegetarian ? "Vegetarian" : "Non-vegetarian"}
                  />
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                </div>
                {item.description && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{item.description}</p>}
                <p className="mt-1 text-sm font-semibold text-emerald-800">{money(item.price)}</p>
              </div>
              <div className="flex shrink-0 items-center self-center">
                {qty === 0 ? (
                  <button
                    type="button"
                    onClick={() => changeQty(item.id, 1)}
                    className="rounded-xl border border-emerald-700 px-4 py-1.5 text-sm font-semibold text-emerald-700"
                  >
                    Add
                  </button>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-700 px-1.5 py-1 text-white">
                    <button type="button" onClick={() => changeQty(item.id, -1)} aria-label="Decrease" className="p-1">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-4 text-center text-sm font-semibold">{qty}</span>
                    <button type="button" onClick={() => changeQty(item.id, 1)} aria-label="Increase" className="p-1">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function CartBar({
  count,
  total,
  caption,
  actionLabel,
  busy,
  onAction,
}: {
  count: number;
  total: number;
  caption: string;
  actionLabel: string;
  busy: boolean;
  onAction: () => void;
}) {
  if (count <= 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center gap-3">
        <div className="flex-1">
          <p className="text-xs text-slate-500">
            {count} item{count > 1 ? "s" : ""} · {caption}
          </p>
          <p className="text-base font-semibold">{money(total)}</p>
        </div>
        <div className="w-44">
          <PrimaryButton busy={busy} onClick={onAction}>
            {actionLabel}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
