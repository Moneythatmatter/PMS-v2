"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Crown, IndianRupee, Users } from "lucide-react";
import type { InHouseGuest } from "@/app/data/frontoffice/modules";
import { reservationService } from "@/services/front-office";
import { ReservationStatusBadge } from "@/components/frontoffice/reservation/ReservationStatusBadge";
import { Button } from "@/components/ui/Button";
import {
  ActionButtons,
  AlertBanner,
  DataTable,
  Drawer,
  EmptyState,
  FOSearchToolbar,
  FormField,
  FOPageHeader,
  SelectInput,
  StatMiniCard,
  SummaryRow,
  formatINR,
} from "@/components/frontoffice/ui";

export function InHouseGuestsView() {
  const [guests, setGuests] = useState<InHouseGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedGuest, setSelectedGuest] = useState<InHouseGuest | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await reservationService.inHouse();
        if (!cancelled) {
          setGuests(data as InHouseGuest[]);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let rows = guests.filter((g) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "vip" && g.isVip) ||
        (filter === "balance" && g.balance > 5000);
      const query = search.toLowerCase();
      const matchesSearch =
        g.guestName.toLowerCase().includes(query) ||
        g.room.includes(query) ||
        g.email?.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
    if (sortBy === "balance-desc") rows = [...rows].sort((a, b) => b.balance - a.balance);
    if (sortBy === "guest") rows = [...rows].sort((a, b) => a.guestName.localeCompare(b.guestName));
    if (sortBy === "checkout") rows = [...rows].sort((a, b) => a.checkOut.localeCompare(b.checkOut));
    return rows;
  }, [guests, filter, search, sortBy]);

  const stats = useMemo(
    () => ({
      total: guests.length,
      vip: guests.filter((g) => g.isVip).length,
      totalBalance: guests.reduce((sum, g) => sum + g.balance, 0),
      avgNights:
        guests.length > 0
          ? Math.round(guests.reduce((sum, g) => sum + g.nights, 0) / guests.length)
          : 0,
    }),
    [guests],
  );

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;


  const columns = [
    {
      key: "guest",
      header: "Guest",
      render: (r: InHouseGuest) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-slate-900">{r.guestName}</span>
            {r.isVip && (
              <Crown className="h-3.5 w-3.5 text-amber-500" aria-label="VIP" />
            )}
          </div>
          {r.email && <p className="text-xs text-slate-400">{r.email}</p>}
        </div>
      ),
    },
    {
      key: "room",
      header: "Room",
      render: (r: InHouseGuest) => (
        <div>
          <span className="font-medium">{r.room}</span>
          <p className="text-xs text-slate-400">{r.roomType}</p>
        </div>
      ),
    },
    { key: "checkin", header: "Check-in", render: (r: InHouseGuest) => r.checkIn },
    { key: "checkout", header: "Check-out", render: (r: InHouseGuest) => r.checkOut },
    { key: "nights", header: "Nights", render: (r: InHouseGuest) => r.nights },
    {
      key: "balance",
      header: "Balance",
      render: (r: InHouseGuest) => (
        <span className={r.balance > 8000 ? "font-semibold text-amber-600" : "font-medium"}>
          {formatINR(r.balance)}
        </span>
      ),
    },
    {
      key: "restaurant",
      header: "Restaurant",
      render: (r: InHouseGuest) => formatINR(r.restaurantBill),
    },
    {
      key: "laundry",
      header: "Laundry",
      render: (r: InHouseGuest) => formatINR(r.laundry),
    },
    {
      key: "status",
      header: "Status",
      render: (r: InHouseGuest) => <ReservationStatusBadge status={r.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r: InHouseGuest) => (
        <ActionButtons
          actions={[
            { label: "Add Service", onClick: () => setToast(`Service charge added for ${r.guestName}.`) },
            { label: "Check Out", onClick: () => setToast(`Opening checkout for ${r.guestName}…`) },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {toast && (
        <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />
      )}

      <FOPageHeader
        eyebrow="Front Office"
        title="In-House Guests"
        description="Monitor current guests, folio balances, and take quick actions."
        badge={
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            <Users className="h-4 w-4 text-emerald-600" />
            {stats.total} guests in-house
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatMiniCard label="In-House" value={stats.total} icon={Users} sublabel="Current guests" />
        <StatMiniCard label="VIP Guests" value={stats.vip} accent="#f59e0b" icon={Crown} />
        <StatMiniCard label="Total Balance" value={formatINR(stats.totalBalance)} icon={IndianRupee} />
        <StatMiniCard label="Avg. Stay" value={`${stats.avgNights} nights`} icon={Calendar} />
      </div>

      <FOSearchToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search guest name, room, or email…"
        filterPills={{
          active: filter,
          onChange: setFilter,
          options: [
            { id: "all", label: "All" },
            { id: "vip", label: "VIP" },
            { id: "balance", label: "High Balance" },
          ],
        }}
        hasActiveAdvancedFilters={sortBy !== "newest"}
        onClearAdvancedFilters={() => setSortBy("newest")}
        advancedFilters={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Sort By">
              <SelectInput value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">Default</option>
                <option value="balance-desc">Balance: high to low</option>
                <option value="guest">Guest A–Z</option>
                <option value="checkout">Check-out date</option>
              </SelectInput>
            </FormField>
            <FormField label="Showing">
              <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
                {filtered.length} of {guests.length} guests
              </div>
            </FormField>
          </div>
        }
      />

      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        {filtered.length > 0 ? (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {filtered.map((g) => (
                <div
                  key={g.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedGuest(g)}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedGuest(g)}
                  className="cursor-pointer rounded-xl border border-slate-100 p-4 transition-colors hover:border-emerald-200 hover:bg-emerald-50/30"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-slate-900">{g.guestName}</p>
                        {g.isVip && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                      </div>
                      <p className="text-xs text-slate-500">Room {g.room} · {g.roomType}</p>
                    </div>
                    <ReservationStatusBadge status={g.status} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <span>Balance: {formatINR(g.balance)}</span>
                    <span>Nights: {g.nights}</span>
                    <span>Check-out: {g.checkOut}</span>
                    <span>Restaurant: {formatINR(g.restaurantBill)}</span>
                  </div>
                  <div className="mt-3 border-t border-slate-100 pt-3" onClick={(e) => e.stopPropagation()}>
                    <ActionButtons
                      actions={[
                        { label: "Check Out", onClick: () => setToast(`Opening checkout for ${g.guestName}…`) },
                      ]}
                    />
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-500">
                      {columns.map((col) => (
                        <th key={col.key} className="pb-3 pr-4">{col.header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedGuest(row)}
                        className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-emerald-50/40"
                      >
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className="py-3.5 pr-4"
                            onClick={
                              col.key === "actions"
                                ? (e) => e.stopPropagation()
                                : undefined
                            }
                          >
                            {col.render(row)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            title="No guests match your criteria"
            description="Try clearing filters or adjusting your search."
          />
        )}
      </div>

      <Drawer
        open={!!selectedGuest}
        onClose={() => setSelectedGuest(null)}
        title={selectedGuest?.guestName ?? ""}
        description={
          selectedGuest
            ? `Room ${selectedGuest.room} · ${selectedGuest.roomType}`
            : undefined
        }
        width="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setSelectedGuest(null)}>
              Close
            </Button>
            <Button
              className="bg-emerald-700 hover:bg-emerald-800"
              onClick={() => {
                setToast(`Opening folio for ${selectedGuest?.guestName}…`);
                setSelectedGuest(null);
              }}
            >
              View Folio
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setToast(`Opening checkout for ${selectedGuest?.guestName}…`);
                setSelectedGuest(null);
              }}
            >
              Check Out
            </Button>
          </>
        }
      >
        {selectedGuest && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ["Check-in", selectedGuest.checkIn],
                ["Check-out", selectedGuest.checkOut],
                ["Nights", selectedGuest.nights],
                ["Adults / Children", `${selectedGuest.adults} / ${selectedGuest.children}`],
                ["VIP", selectedGuest.isVip ? "Yes" : "No"],
                ["Status", selectedGuest.status],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">{value}</dd>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-slate-100 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Folio Summary
              </p>
              <SummaryRow label="Room Balance" value={formatINR(selectedGuest.balance)} />
              <SummaryRow label="Restaurant" value={formatINR(selectedGuest.restaurantBill)} />
              <SummaryRow label="Laundry" value={formatINR(selectedGuest.laundry)} />
              <SummaryRow
                label="Total Outstanding"
                value={formatINR(
                  selectedGuest.balance +
                    selectedGuest.restaurantBill +
                    selectedGuest.laundry,
                )}
                highlight
              />
            </div>

            {selectedGuest.email && (
              <p className="text-xs text-slate-500">{selectedGuest.email}</p>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
