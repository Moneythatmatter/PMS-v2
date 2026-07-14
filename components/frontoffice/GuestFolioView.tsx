"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  ListOrdered,
  Plus,
  Receipt,
  Wallet,
} from "lucide-react";
import { folioEntries as initialFolioEntries, inHouseGuests } from "@/app/data";
import type { FolioEntry, InHouseGuest } from "@/app/data/frontoffice/modules";
import { GuestSearchSelect } from "@/components/frontoffice/GuestSearchSelect";
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
  TextInput,
  formatINR,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";

const categoryColors: Record<FolioEntry["category"], string> = {
  Room: "bg-emerald-50 text-emerald-800",
  Restaurant: "bg-orange-50 text-orange-700",
  Laundry: "bg-purple-50 text-purple-700",
  Payment: "bg-emerald-50 text-emerald-700",
  Tax: "bg-slate-100 text-slate-700",
  Other: "bg-amber-50 text-amber-700",
};

const chargeCategories: FolioEntry["category"][] = [
  "Room",
  "Restaurant",
  "Laundry",
  "Other",
  "Tax",
];

export function GuestFolioView() {
  const [guest, setGuest] = useState<InHouseGuest>(inHouseGuests[0]);
  const [guestSearch, setGuestSearch] = useState(inHouseGuests[0].guestName);
  const [allEntries, setAllEntries] = useState(initialFolioEntries);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedEntry, setSelectedEntry] = useState<FolioEntry | null>(null);
  const [chargeOpen, setChargeOpen] = useState(false);
  const [chargeCategory, setChargeCategory] = useState<FolioEntry["category"]>("Restaurant");
  const [chargeDescription, setChargeDescription] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const entries = useMemo(() => {
    return allEntries
      .filter((e) => e.guestName === guest.guestName)
      .filter((e) => {
        if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
        const q = search.toLowerCase();
        return (
          e.description.toLowerCase().includes(q) ||
          e.date.toLowerCase().includes(q)
        );
      });
  }, [allEntries, guest.guestName, categoryFilter, search]);

  const summary = useMemo(() => {
    const guestEntries = allEntries.filter((e) => e.guestName === guest.guestName);
    const debits = guestEntries.reduce((s, e) => s + e.debit, 0);
    const credits = guestEntries.reduce((s, e) => s + e.credit, 0);
    const balance =
      guestEntries.length > 0 ? guestEntries[guestEntries.length - 1].balance : 0;
    return { debits, credits, balance, count: guestEntries.length };
  }, [allEntries, guest.guestName]);

  const handleSelectGuest = (g: InHouseGuest) => {
    setGuest(g);
    setGuestSearch(g.guestName);
    setSearch("");
    setCategoryFilter("all");
  };

  const resetChargeForm = () => {
    setChargeCategory("Restaurant");
    setChargeDescription("");
    setChargeAmount("");
  };

  const handlePostCharge = () => {
    const amount = parseFloat(chargeAmount);
    if (!chargeDescription.trim()) {
      setToast("Please enter a charge description.");
      return;
    }
    if (!amount || amount <= 0) {
      setToast("Please enter a valid amount.");
      return;
    }

    const guestEntries = allEntries.filter((e) => e.guestName === guest.guestName);
    const lastBalance =
      guestEntries.length > 0 ? guestEntries[guestEntries.length - 1].balance : 0;
    const today = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });

    const newEntry: FolioEntry = {
      id: `F-${Date.now()}`,
      guestName: guest.guestName,
      room: guest.room,
      date: today,
      description: chargeDescription.trim(),
      category: chargeCategory,
      debit: amount,
      credit: 0,
      balance: lastBalance + amount,
    };

    setAllEntries((prev) => [...prev, newEntry]);
    setChargeOpen(false);
    resetChargeForm();
    setToast(`${formatINR(amount)} posted to ${guest.guestName}'s folio.`);
  };

  const columns = [
    {
      key: "date",
      header: "Date",
      render: (r: FolioEntry) => r.date,
    },
    {
      key: "desc",
      header: "Description",
      render: (r: FolioEntry) => (
        <div>
          <p className="font-medium text-slate-900">{r.description}</p>
          <span
            className={cn(
              "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
              categoryColors[r.category],
            )}
          >
            {r.category}
          </span>
        </div>
      ),
    },
    {
      key: "debit",
      header: "Debit",
      render: (r: FolioEntry) =>
        r.debit ? (
          <span className="font-medium text-red-600">{formatINR(r.debit)}</span>
        ) : (
          "—"
        ),
    },
    {
      key: "credit",
      header: "Credit",
      render: (r: FolioEntry) =>
        r.credit ? (
          <span className="font-medium text-emerald-600">{formatINR(r.credit)}</span>
        ) : (
          "—"
        ),
    },
    {
      key: "balance",
      header: "Balance",
      render: (r: FolioEntry) => (
        <span className="font-semibold text-slate-900">{formatINR(r.balance)}</span>
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
        title="Guest Folio"
        badge={
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            Room {guest.room} · {guest.roomType}
          </div>
        }
        action={
          <Button
            size="sm"
            className="bg-emerald-700 hover:bg-emerald-800"
            onClick={() => {
              resetChargeForm();
              setChargeOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Post Charge
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatMiniCard
          label="Running Balance"
          value={formatINR(summary.balance)}
          accent="#ef4444"
          icon={Wallet}
          sublabel="Outstanding"
        />
        <StatMiniCard label="Total Debits" value={formatINR(summary.debits)} icon={ArrowUpRight} />
        <StatMiniCard
          label="Total Credits"
          value={formatINR(summary.credits)}
          accent="#10b981"
          icon={ArrowDownLeft}
        />
        <StatMiniCard label="Transactions" value={summary.count} icon={ListOrdered} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1">
              <FOSearchToolbar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search folio entries…"
                filterPills={{
                  active: categoryFilter,
                  onChange: setCategoryFilter,
                  options: [
                    { id: "all", label: "All" },
                    { id: "Room", label: "Room" },
                    { id: "Restaurant", label: "Restaurant" },
                    { id: "Laundry", label: "Laundry" },
                    { id: "Payment", label: "Payment" },
                    { id: "Tax", label: "Tax" },
                  ],
                }}
              />
            </div>
            <div className="shrink-0 lg:w-72">
              <GuestSearchSelect
                value={guestSearch}
                selectedGuestId={guest.id}
                onChange={setGuestSearch}
                onSelect={handleSelectGuest}
                placeholder="Select guest…"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            {entries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-500">
                      {columns.map((col) => (
                        <th key={col.key} className="pb-3 pr-4">
                          {col.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedEntry(row)}
                        className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-emerald-50/40"
                      >
                        {columns.map((col) => (
                          <td key={col.key} className="py-3.5 pr-4">
                            {col.render(row)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                title="No folio entries"
                description="No transactions match your filters."
              />
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-slate-900">Folio Summary</h2>
          </div>
          <p className="text-lg font-bold text-slate-900">{guest.guestName}</p>
          <p className="text-xs text-slate-500">
            Room {guest.room} · {guest.checkIn} → {guest.checkOut}
          </p>
          <div className="mt-4 divide-y divide-slate-100">
            <SummaryRow label="Room charges" value={formatINR(guest.balance * 0.6)} />
            <SummaryRow label="Restaurant" value={formatINR(guest.restaurantBill)} />
            <SummaryRow label="Laundry" value={formatINR(guest.laundry)} />
            <SummaryRow label="Outstanding" value={formatINR(summary.balance)} highlight />
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              size="sm"
              className="w-full bg-emerald-700 hover:bg-emerald-800"
              onClick={() => setToast(`Payment collected for ${guest.guestName}.`)}
            >
              Collect Payment
            </Button>
            <Button size="sm" variant="outline" className="w-full">
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Print Folio
            </Button>
          </div>
        </div>
      </div>

      <Drawer
        open={chargeOpen}
        onClose={() => setChargeOpen(false)}
        title="Post Charge"
        description={`Add a debit to ${guest.guestName}'s folio · Room ${guest.room}`}
        width="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setChargeOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={handlePostCharge}>
              Post to Folio
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Current balance: {formatINR(summary.balance)}
          </div>
          <FormField label="Category" required>
            <SelectInput
              value={chargeCategory}
              onChange={(e) => setChargeCategory(e.target.value as FolioEntry["category"])}
            >
              {chargeCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Description" required>
            <TextInput
              placeholder="e.g. Minibar, Room service, Spa…"
              value={chargeDescription}
              onChange={(e) => setChargeDescription(e.target.value)}
            />
          </FormField>
          <FormField label="Amount (₹)" required>
            <TextInput
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={chargeAmount}
              onChange={(e) => setChargeAmount(e.target.value)}
            />
          </FormField>
        </div>
      </Drawer>

      <Drawer
        open={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        title="Transaction Detail"
        description={selectedEntry?.description}
        width="sm"
      >
        {selectedEntry && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {selectedEntry.debit > 0 ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <ArrowUpRight className="h-5 w-5" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <ArrowDownLeft className="h-5 w-5" />
                </div>
              )}
              <div>
                <p className="font-semibold text-slate-900">
                  {selectedEntry.debit > 0
                    ? formatINR(selectedEntry.debit)
                    : formatINR(selectedEntry.credit)}
                </p>
                <p className="text-xs text-slate-500">{selectedEntry.category}</p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Date", selectedEntry.date],
                ["Guest", selectedEntry.guestName],
                ["Room", selectedEntry.room],
                ["Balance After", formatINR(selectedEntry.balance)],
              ].map(([label, value]) => (
                <div key={label}>
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
