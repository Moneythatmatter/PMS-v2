"use client";

import { useMemo, useState } from "react";
import { CashierDeskView, type CashierDeskConfig } from "@/components/frontoffice/CashierDeskView";
import { FbOutletSelect } from "@/components/foodbeverages/FbOutletSelect";
import { fbCashierSessionService } from "@/services/food-beverages";
import { useFbOutlets } from "@/services/food-beverages/useFbOutlets";

const OUTLET_KEY = "fb-cashier-outlet";

/** Remembers the outlet picked on the F&B cashier and day close pages. */
export function useSelectedFbOutlet(outlets: { id: string }[]) {
  const [picked, setPicked] = useState("");
  const outletId = useMemo(() => {
    if (!outlets.length) return "";
    if (picked && outlets.some((o) => o.id === picked)) return picked;
    const saved = typeof window === "undefined" ? null : window.localStorage.getItem(OUTLET_KEY);
    return saved && outlets.some((o) => o.id === saved) ? saved : outlets[0].id;
  }, [outlets, picked]);
  const choose = (id: string) => {
    setPicked(id);
    window.localStorage.setItem(OUTLET_KEY, id);
  };
  return [outletId, choose] as const;
}

export function FbCashierView({ mode = "session" }: { mode?: "session" | "history" }) {
  const { outlets, loading, error } = useFbOutlets(["restaurant", "cafe", "bar"]);
  const [outletId, setOutletId] = useSelectedFbOutlet(outlets);
  const outlet = outlets.find((o) => o.id === outletId);

  const config = useMemo<CashierDeskConfig | null>(
    () =>
      outletId
        ? {
            service: fbCashierSessionService(outletId),
            eyebrow: `Food & Beverages · ${outlet?.name ?? "Outlet"}`,
            sourceLabel: outlet?.name ?? "this outlet",
            links: [
              { href: "/food-beverages/restaurants/cashier", label: "My Shift", modes: ["start", "session", "closing"] },
              { href: "/food-beverages/restaurants/cashier/history", label: "History & Approvals", modes: ["history", "approvals"] },
            ],
            historyHref: "/food-beverages/restaurants/cashier/history",
            headerSlot: <FbOutletSelect outlets={outlets} value={outletId} onChange={setOutletId} className="h-8 min-w-[10rem] text-xs" />,
          }
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setOutletId is recreated each render but only writes state
    [outletId, outlet?.name, outlets],
  );

  if (loading) return <p className="text-sm text-slate-500">Loading outlets…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!config) {
    return <p className="text-sm text-slate-500">No restaurant, cafe or bar outlets yet. Add one under F&B → Outlets.</p>;
  }
  return <CashierDeskView key={outletId} mode={mode} config={config} />;
}
