"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarCheck,
  ExternalLink,
  FileText,
  ListOrdered,
  LogOut,
  Mail,
  Phone,
  Receipt,
  User,
  Wallet,
} from "lucide-react";
import type { FolioListItem, LedgerTransaction } from "@/app/data/types/billing";
import {
  billingFolioService,
  billingTransactionService,
} from "@/services/front-office";
import { Button } from "@/components/ui/Button";
import {
  AlertBanner,
  Drawer,
  EmptyState,
  FormField,
  FOPageHeader,
  FOSearchToolbar,
  SelectInput,
  StatMiniCard,
  SummaryRow,
  formatINR,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";
import {
  allBookingsDetailHref,
  checkOutHref,
  guestProfileHref,
} from "@/lib/check-in-navigation";
import { CollectPaymentDrawer } from "@/components/frontoffice/CollectPaymentDrawer";

function formatFolioDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPaymentMethod(method?: string): string {
  if (!method) return "—";
  return method.replace(/_/g, " ");
}

const statusStyles: Record<string, string> = {
  OPEN: "bg-emerald-50 text-emerald-800",
  CLOSED: "bg-slate-100 text-slate-700",
  VOID: "bg-red-50 text-red-700",
};

function stopRowClick(e: MouseEvent) {
  e.stopPropagation();
}

function isCheckoutEligible(folio: FolioListItem) {
  if (!folio.bookingId) return false;
  const status = String(folio.reservationStatus ?? "").trim();
  return status === "Checked In" || status === "In-House";
}

function GuestContactLines({
  phone,
  email,
  className,
}: {
  phone?: string | null;
  email?: string | null;
  className?: string;
}) {
  if (!phone?.trim() && !email?.trim()) return null;
  return (
    <div className={cn("mt-0.5 space-y-0.5 text-[11px] text-slate-500", className)}>
      {phone?.trim() && (
        <p className="flex items-center gap-1">
          <Phone className="h-3 w-3 shrink-0 text-slate-400" />
          {phone}
        </p>
      )}
      {email?.trim() && (
        <p className="flex items-center gap-1 truncate">
          <Mail className="h-3 w-3 shrink-0 text-slate-400" />
          {email}
        </p>
      )}
    </div>
  );
}

export function GuestFolioView() {
  const [folios, setFolios] = useState<FolioListItem[]>([]);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [selected, setSelected] = useState<FolioListItem | null>(null);
  const [folioDrawerOpen, setFolioDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [txnLoading, setTxnLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [balanceFilter, setBalanceFilter] = useState("all");
  const [reservationStatusFilter, setReservationStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedTxn, setSelectedTxn] = useState<LedgerTransaction | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);

  const loadFolios = useCallback(async () => {
    const rows = await billingFolioService.list(
      statusFilter === "all" ? undefined : { status: statusFilter.toUpperCase() },
    );
    setFolios(rows);
    return rows;
  }, [statusFilter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await loadFolios();
        if (!cancelled) setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load folios");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadFolios]);

  useEffect(() => {
    if (!selected?.id || !folioDrawerOpen) {
      setTransactions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setTxnLoading(true);
        const rows = await billingTransactionService.list({ folioId: selected.id });
        if (!cancelled) setTransactions(rows);
      } catch {
        if (!cancelled) setTransactions([]);
      } finally {
        if (!cancelled) setTxnLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected?.id, folioDrawerOpen]);

  const reservationStatusOptions = useMemo(() => {
    const values = new Set<string>();
    for (const f of folios) {
      if (f.reservationStatus?.trim()) values.add(f.reservationStatus.trim());
    }
    return [...values].sort();
  }, [folios]);

  const hasActiveAdvancedFilters =
    roomFilter !== "all" ||
    balanceFilter !== "all" ||
    reservationStatusFilter !== "all" ||
    sortBy !== "newest";

  const clearAdvancedFilters = () => {
    setRoomFilter("all");
    setBalanceFilter("all");
    setReservationStatusFilter("all");
    setSortBy("newest");
  };

  const filteredFolios = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = folios.filter((f) => {
      if (q) {
        const haystack = [
          f.folioNumber,
          f.guestName,
          f.room,
          f.bookingNo,
          f.bookingId,
          f.guestNo,
          f.guestPhone,
          f.guestEmail,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (roomFilter === "assigned" && !f.room?.trim()) return false;
      if (roomFilter === "unassigned" && f.room?.trim()) return false;

      const balance = Number(f.balanceAmount ?? 0);
      const paid = Number(f.paidAmount ?? 0);
      const total = Number(f.totalAmount ?? 0);

      if (balanceFilter === "outstanding" && balance <= 0) return false;
      if (balanceFilter === "cleared" && balance !== 0) return false;
      if (balanceFilter === "overpaid" && paid <= total) return false;

      if (
        reservationStatusFilter !== "all" &&
        (f.reservationStatus ?? "") !== reservationStatusFilter
      ) {
        return false;
      }

      return true;
    });

    rows = [...rows].sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return String(a.openedAt ?? "").localeCompare(String(b.openedAt ?? ""));
        case "balance-high":
          return Number(b.balanceAmount ?? 0) - Number(a.balanceAmount ?? 0);
        case "balance-low":
          return Number(a.balanceAmount ?? 0) - Number(b.balanceAmount ?? 0);
        case "guest-az":
          return String(a.guestName ?? "").localeCompare(String(b.guestName ?? ""));
        case "newest":
        default:
          return String(b.openedAt ?? "").localeCompare(String(a.openedAt ?? ""));
      }
    });

    return rows;
  }, [
    folios,
    search,
    roomFilter,
    balanceFilter,
    reservationStatusFilter,
    sortBy,
  ]);

  const totals = useMemo(() => {
    const scope = filteredFolios;
    return {
      count: scope.length,
      balance: scope.reduce((s, f) => s + Number(f.balanceAmount ?? 0), 0),
      debits: scope.reduce((s, f) => s + Number(f.totalAmount ?? 0), 0),
      credits: scope.reduce((s, f) => s + Number(f.paidAmount ?? 0), 0),
    };
  }, [filteredFolios]);

  const paymentCount = useMemo(
    () => transactions.filter((t) => t.transactionType === "PAYMENT").length,
    [transactions],
  );

  const paidFromTransactions = useMemo(() => {
    return transactions.reduce((sum, txn) => {
      if (String(txn.status).toUpperCase() !== "COMPLETED") return sum;
      if (txn.transactionType === "PAYMENT") return sum + Number(txn.amount ?? 0);
      if (txn.transactionType === "REFUND") return sum - Number(txn.amount ?? 0);
      return sum;
    }, 0);
  }, [transactions]);

  const drawerPaidAmount =
    folioDrawerOpen && transactions.length > 0
      ? paidFromTransactions
      : Number(selected?.paidAmount ?? 0);

  const drawerBalanceAmount = Math.max(
    0,
    Number(selected?.totalAmount ?? 0) - drawerPaidAmount,
  );

  const openFolio = (folio: FolioListItem) => {
    setSelected(folio);
    setFolioDrawerOpen(true);
  };

  const closeFolioDrawer = () => {
    setFolioDrawerOpen(false);
    setSelectedTxn(null);
    setPaymentDrawerOpen(false);
  };

  const refreshFolioData = useCallback(async (folioId: string) => {
    const rows = await loadFolios();
    const updated = rows.find((f) => f.id === folioId) ?? null;
    if (updated) setSelected(updated);
    const txns = await billingTransactionService.list({ folioId });
    setTransactions(txns);
    return updated;
  }, [loadFolios]);

  const handlePaymentSuccess = useCallback(
    async (txn: LedgerTransaction) => {
      if (!selected?.id) return;
      await refreshFolioData(selected.id);
      setToast(
        `Payment of ${formatINR(txn.amount)} recorded · ${txn.transactionNumber}`,
      );
    },
    [selected?.id, refreshFolioData],
  );

  if (loading) return <p className="text-sm text-slate-500">Loading folios…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-5">
      {toast && (
        <AlertBanner variant="success" message={toast} onDismiss={() => setToast(null)} />
      )}

      <FOPageHeader
        eyebrow="Front Office"
        title="Guest Folio"
        description="Click a folio row to open summary and transactions"
        badge={
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            {folios.length} folio{folios.length !== 1 ? "s" : ""} in ledger
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatMiniCard
          label="Outstanding (filtered)"
          value={formatINR(totals.balance)}
          accent="#ef4444"
          icon={Wallet}
          sublabel="Total balance"
        />
        <StatMiniCard label="Folio Total" value={formatINR(totals.debits)} icon={ArrowUpRight} />
        <StatMiniCard
          label="Collected"
          value={formatINR(totals.credits)}
          accent="#10b981"
          icon={ArrowDownLeft}
        />
        <StatMiniCard label="Folios" value={totals.count} icon={ListOrdered} />
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
              <FOSearchToolbar
                search={search}
                onSearchChange={setSearch}
          searchPlaceholder="Search folio, guest, room, booking…"
                filterPills={{
            active: statusFilter,
            onChange: setStatusFilter,
                  options: [
                    { id: "all", label: "All" },
              { id: "open", label: "Open" },
              { id: "closed", label: "Closed" },
            ],
          }}
          hasActiveAdvancedFilters={hasActiveAdvancedFilters}
          onClearAdvancedFilters={clearAdvancedFilters}
          advancedFilters={
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FormField label="Room">
                <SelectInput
                  value={roomFilter}
                  onChange={(e) => setRoomFilter(e.target.value)}
                >
                  <option value="all">All rooms</option>
                  <option value="assigned">Room assigned</option>
                  <option value="unassigned">No room yet</option>
                </SelectInput>
              </FormField>
              <FormField label="Balance">
                <SelectInput
                  value={balanceFilter}
                  onChange={(e) => setBalanceFilter(e.target.value)}
                >
                  <option value="all">Any balance</option>
                  <option value="outstanding">Has outstanding</option>
                  <option value="cleared">Fully settled (₹0)</option>
                  <option value="overpaid">Overpaid / credit</option>
                </SelectInput>
              </FormField>
              <FormField label="Booking status">
                <SelectInput
                  value={reservationStatusFilter}
                  onChange={(e) => setReservationStatusFilter(e.target.value)}
                >
                  <option value="all">All booking statuses</option>
                  {reservationStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </SelectInput>
              </FormField>
              <FormField label="Sort by">
                <SelectInput value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="newest">Newest folio first</option>
                  <option value="oldest">Oldest folio first</option>
                  <option value="balance-high">Balance — high to low</option>
                  <option value="balance-low">Balance — low to high</option>
                  <option value="guest-az">Guest name A → Z</option>
                </SelectInput>
              </FormField>
              <FormField label="Showing" className="sm:col-span-2 lg:col-span-4">
                <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
                  {filteredFolios.length} of {folios.length} folios
                  {hasActiveAdvancedFilters && " · advanced filters on"}
                </div>
              </FormField>
            </div>
          }
        />

        <div className="mt-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">All Folios</h2>
            <p className="text-xs text-slate-500">{filteredFolios.length} shown</p>
          </div>

          {filteredFolios.length > 0 ? (
            <div className="max-h-[min(480px,calc(100vh-420px))] overflow-auto rounded-lg border border-slate-100">
              <table className="w-full min-w-[940px] text-left text-sm">
                <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgb(241,245,249)]">
                  <tr className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {[
                      "Folio",
                      "Guest",
                      "Room",
                      "Status",
                      "Total",
                      "Paid",
                      "Balance",
                    ].map((h) => (
                      <th key={h} className="px-4 py-3 text-left first:pl-4">
                        {h}
                      </th>
                    ))}
                    <th className="w-[7.5rem] shrink-0 px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                  <tbody>
                  {filteredFolios.map((folio) => {
                    const isActive = selected?.id === folio.id && folioDrawerOpen;
                    return (
                      <tr
                        key={folio.id}
                        onClick={() => openFolio(folio)}
                        className={cn(
                          "cursor-pointer border-t border-slate-50 transition-colors",
                          isActive
                            ? "bg-emerald-50/80 hover:bg-emerald-50"
                            : "hover:bg-slate-50/80",
                        )}
                      >
                        <td className="px-4 py-3" onClick={stopRowClick}>
                          <p className="font-medium text-slate-900">
                            {folio.folioNumber ?? folio.id.slice(0, 8)}
                          </p>
                          {folio.bookingId ? (
                            <Link
                              href={allBookingsDetailHref({ id: folio.bookingId })}
                              className="text-[10px] font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
                            >
                              {folio.bookingNo ?? folio.bookingId.slice(0, 8)}
                            </Link>
                          ) : (
                            <p className="text-[10px] text-slate-400">
                              {folio.bookingNo ?? "—"}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3" onClick={stopRowClick}>
                          {folio.guestId ? (
                            <Link
                              href={guestProfileHref({ id: folio.guestId })}
                              className="font-medium text-slate-800 hover:text-emerald-700 hover:underline"
                            >
                              {folio.guestName ?? "Guest"}
                            </Link>
                          ) : (
                            <p className="font-medium text-slate-800">
                              {folio.guestName ?? "—"}
                            </p>
                          )}
                          <GuestContactLines
                            phone={folio.guestPhone}
                            email={folio.guestEmail}
                          />
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {folio.room ? `Room ${folio.room}` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                              statusStyles[folio.status] ?? "bg-slate-100 text-slate-600",
                            )}
                          >
                            {folio.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">{formatINR(folio.totalAmount)}</td>
                        <td className="px-4 py-3 text-emerald-700">
                          {formatINR(folio.paidAmount)}
                        </td>
                        <td
                          className={cn(
                            "px-4 py-3 font-semibold",
                            Number(folio.balanceAmount ?? 0) === 0
                              ? "text-slate-500"
                              : "text-red-600",
                          )}
                        >
                          {formatINR(folio.balanceAmount)}
                        </td>
                        <td className="px-4 py-3" onClick={stopRowClick}>
                          <div className="flex items-center justify-end">
                            {isCheckoutEligible(folio) ? (
                              <Link
                                href={checkOutHref({ id: folio.bookingId! })}
                                className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs font-semibold leading-none text-orange-800 transition-colors hover:bg-orange-100"
                                title="Check out guest"
                              >
                                <LogOut className="h-3.5 w-3.5 shrink-0" />
                                Check out
                              </Link>
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
              title="No folios found"
              description="Run transactions.sql in Supabase to create folios for existing bookings."
            />
          )}
        </div>
      </div>

      <Drawer
        open={folioDrawerOpen && !!selected}
        onClose={closeFolioDrawer}
        title={selected?.guestName ?? "Folio"}
        description={
          selected
            ? `${selected.folioNumber ?? "Folio"} · ${selected.room ? `Room ${selected.room}` : "Room TBA"}`
            : undefined
        }
        width="lg"
        footer={
          selected ? (
            <>
              <Button variant="outline" onClick={closeFolioDrawer}>
                Close
              </Button>
              {selected.guestId && (
                <Link href={guestProfileHref({ id: selected.guestId })}>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    Guest Profile
                  </Button>
                </Link>
              )}
              {selected.bookingId && (
                <Link href={allBookingsDetailHref({ id: selected.bookingId })}>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <CalendarCheck className="h-3.5 w-3.5" />
                    Booking Detail
                  </Button>
                </Link>
              )}
              <Button size="sm" variant="outline">
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                Print Folio
            </Button>
              <Button
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800"
                disabled={drawerBalanceAmount <= 0}
                onClick={() => setPaymentDrawerOpen(true)}
              >
                Collect Payment
            </Button>
          </>
          ) : undefined
        }
      >
        {selected && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-semibold text-slate-900">Folio Summary</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.guestId && (
                    <Link href={guestProfileHref({ id: selected.guestId })}>
                      <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                        <User className="h-3.5 w-3.5" />
                        Guest Profile
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </Button>
                    </Link>
                  )}
                  {selected.bookingId && (
                    <Link href={allBookingsDetailHref({ id: selected.bookingId })}>
                      <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                        <CalendarCheck className="h-3.5 w-3.5" />
                        Booking Detail
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              <div className="mb-3 rounded-lg border border-slate-100 bg-white px-3 py-2.5">
                {selected.guestId ? (
                  <Link
                    href={guestProfileHref({ id: selected.guestId })}
                    className="text-sm font-semibold text-slate-900 hover:text-emerald-700 hover:underline"
                  >
                    {selected.guestName ?? "Guest"}
                  </Link>
                ) : (
                  <p className="text-sm font-semibold text-slate-900">
                    {selected.guestName ?? "Guest"}
                  </p>
                )}
                <GuestContactLines
                  phone={selected.guestPhone}
                  email={selected.guestEmail}
                  className="mt-1"
                />
                {selected.bookingId && (
                  <p className="mt-2 text-xs text-slate-500">
                    Booking{" "}
                    <Link
                      href={allBookingsDetailHref({ id: selected.bookingId })}
                      className="font-medium text-emerald-700 hover:underline"
                    >
                      {selected.bookingNo ?? selected.bookingId.slice(0, 8)}
                    </Link>
                    {selected.guestNo ? ` · Guest ${selected.guestNo}` : ""}
                  </p>
                )}
              </div>

              {(selected.checkIn || selected.checkOut) && (
                <p className="mb-3 text-xs text-slate-500">
                  Stay: {selected.checkIn ?? "—"} → {selected.checkOut ?? "—"}
                </p>
              )}
              <div className="divide-y divide-slate-200/80 rounded-lg border border-slate-100 bg-white px-3">
                <SummaryRow label="Room / stay total" value={formatINR(selected.subtotal)} />
                <SummaryRow label="Tax" value={formatINR(selected.taxTotal)} />
                <SummaryRow label="Discount" value={formatINR(selected.discountTotal)} />
                <SummaryRow label="Folio total" value={formatINR(selected.totalAmount)} />
                <SummaryRow label="Paid" value={formatINR(drawerPaidAmount)} />
                <SummaryRow
                  label="Outstanding"
                  value={formatINR(drawerBalanceAmount)}
                  highlight
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {paymentCount} payment{paymentCount !== 1 ? "s" : ""} recorded
              </p>
          </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Transactions</h3>
              {txnLoading ? (
                <p className="text-sm text-slate-500">Loading transactions…</p>
              ) : transactions.length > 0 ? (
                <div className="max-h-64 overflow-auto rounded-lg border border-slate-100">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="sticky top-0 bg-white text-xs font-medium uppercase tracking-wide text-slate-500 shadow-[0_1px_0_0_rgb(241,245,249)]">
                      <tr>
                        {["Date", "Txn #", "Method", "External Ref", "Amount"].map((h) => (
                          <th key={h} className="px-3 py-2.5">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((txn) => (
                        <tr
                          key={txn.id}
                          onClick={() => setSelectedTxn(txn)}
                          className="cursor-pointer border-t border-slate-50 hover:bg-emerald-50/40"
                        >
                          <td className="px-3 py-2.5">{formatFolioDate(txn.transactionDate)}</td>
                          <td className="px-3 py-2.5 font-medium">{txn.transactionNumber}</td>
                          <td className="px-3 py-2.5">{formatPaymentMethod(txn.paymentMethod)}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-600">
                            {txn.externalReference ?? "—"}
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-emerald-700">
                            {formatINR(txn.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="No transactions"
                  description="Payments appear here after reservation advance or checkout."
                />
              )}
            </div>
        </div>
        )}
      </Drawer>

      <CollectPaymentDrawer
        folio={
          selected
            ? {
                ...selected,
                paidAmount: drawerPaidAmount,
                balanceAmount: drawerBalanceAmount,
              }
            : null
        }
        open={paymentDrawerOpen && !!selected}
        onClose={() => setPaymentDrawerOpen(false)}
        onSuccess={handlePaymentSuccess}
      />

      <Drawer
        open={!!selectedTxn}
        onClose={() => setSelectedTxn(null)}
        title="Transaction Detail"
        description={selectedTxn?.transactionNumber}
        width="sm"
      >
        {selectedTxn && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <ArrowDownLeft className="h-5 w-5" />
                </div>
              <div>
                <p className="font-semibold text-slate-900">{formatINR(selectedTxn.amount)}</p>
                <p className="text-xs text-slate-500">{selectedTxn.transactionType}</p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Date", formatFolioDate(selectedTxn.transactionDate)],
                ["Method", formatPaymentMethod(selectedTxn.paymentMethod)],
                ["External ref", selectedTxn.externalReference ?? "—"],
                ["Status", selectedTxn.status],
                ["Source", selectedTxn.sourceModule ?? "—"],
                ["Notes", selectedTxn.notes ?? "—"],
              ].map(([label, value]) => (
                <div key={label} className={label === "Notes" ? "col-span-2" : undefined}>
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="mt-0.5 font-medium text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Drawer>
    </div>
  );
}
