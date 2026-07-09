"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  Crown,
  FileText,
  Mail,
  MapPin,
  Phone,
  Star,
  User,
  Users,
} from "lucide-react";
import {
  guestFeedbacks,
  guestProfiles,
  guestStayHistory,
  invoiceRecords,
} from "@/app/data";
import type { GuestProfile } from "@/app/data/frontoffice/modules";
import { Button } from "@/components/ui/Button";
import {
  DataTable,
  Drawer,
  EmptyState,
  FOPageHeader,
  FOSearchToolbar,
  StatMiniCard,
  formatINR,
} from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";

const tabs = [
  "Personal",
  "Stay History",
  "Invoices",
  "Feedback",
  "Documents",
  "Loyalty",
] as const;

type Tab = (typeof tabs)[number];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function GuestProfileView() {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [selected, setSelected] = useState<GuestProfile>(guestProfiles[0]);
  const [activeTab, setActiveTab] = useState<Tab>("Personal");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return guestProfiles.filter(
      (g) =>
        (tierFilter === "all" ||
          (tierFilter === "vip" && g.loyaltyPoints >= 5000) ||
          (tierFilter === "regular" && g.loyaltyPoints < 5000)) &&
        (g.name.toLowerCase().includes(q) ||
          g.email.toLowerCase().includes(q) ||
          g.mobile.includes(q) ||
          g.id.toLowerCase().includes(q)),
    );
  }, [search, tierFilter]);

  const stays = useMemo(
    () => guestStayHistory.filter((s) => s.guestId === selected.id),
    [selected.id],
  );

  const invoices = useMemo(
    () => invoiceRecords.filter((i) => i.guest === selected.name),
    [selected.name],
  );

  const feedback = useMemo(
    () => guestFeedbacks.filter((f) => f.guest === selected.name),
    [selected.name],
  );

  const selectGuest = (guest: GuestProfile) => {
    setSelected(guest);
    setActiveTab("Personal");
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-5">
      <FOPageHeader
        eyebrow="Front Office"
        title="Guest Profiles"
        description="Search guest records, view stay history, invoices, and loyalty details."
        badge={
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            {guestProfiles.length} registered profiles
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatMiniCard label="Total Profiles" value={guestProfiles.length} icon={Users} />
        <StatMiniCard
          label="Avg. Loyalty Points"
          value={Math.round(
            guestProfiles.reduce((s, g) => s + g.loyaltyPoints, 0) /
              guestProfiles.length,
          )}
          accent="#f59e0b"
          icon={Star}
        />
        <StatMiniCard
          label="Total Stays"
          value={guestProfiles.reduce((s, g) => s + g.totalStays, 0)}
          icon={Award}
        />
        <StatMiniCard label="VIP Members" value={2} accent="#8b5cf6" icon={Crown} />
      </div>

      <FOSearchToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email, mobile, or guest ID…"
        filterPills={{
          active: tierFilter,
          onChange: setTierFilter,
          options: [
            { id: "all", label: "All" },
            { id: "vip", label: "VIP" },
            { id: "regular", label: "Regular" },
          ],
        }}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-1">
          {filtered.length > 0 ? (
            filtered.map((guest) => (
              <button
                key={guest.id}
                type="button"
                onClick={() => selectGuest(guest)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                  selected.id === guest.id && drawerOpen
                    ? "border-blue-200 bg-blue-50/50"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50",
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {getInitials(guest.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{guest.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {guest.id} · {guest.mobile}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium text-amber-600">
                    {guest.loyaltyPoints} pts
                  </p>
                  <p className="text-[11px] text-slate-400">{guest.totalStays} stays</p>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white">
              <EmptyState title="No profiles found" description="Try a different search term." />
            </div>
          )}
        </div>

        <div className="hidden rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2 lg:block">
          <ProfilePanel
            guest={selected}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            stays={stays}
            invoices={invoices}
            feedback={feedback}
          />
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selected.name}
        description={`${selected.id} · ${selected.nationality}`}
        width="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>
              Close
            </Button>
            <Link href="/frontoffice/guest-folio">
              <Button className="bg-blue-600 hover:bg-blue-700">View Folio</Button>
            </Link>
          </>
        }
      >
        <ProfilePanel
          guest={selected}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          stays={stays}
          invoices={invoices}
          feedback={feedback}
        />
      </Drawer>
    </div>
  );
}

function ProfilePanel({
  guest,
  activeTab,
  onTabChange,
  stays,
  invoices,
  feedback,
}: {
  guest: GuestProfile;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  stays: (typeof guestStayHistory)[number][];
  invoices: (typeof invoiceRecords)[number][];
  feedback: (typeof guestFeedbacks)[number][];
}) {
  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-base font-bold text-blue-700">
            {getInitials(guest.name)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{guest.name}</h2>
            <p className="text-xs text-slate-500">
              Member since {guest.memberSince ?? "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
          <Award className="h-4 w-4" />
          {guest.loyaltyPoints} Loyalty Points
        </div>
      </div>

      <nav className="-mx-1 flex gap-1 overflow-x-auto border-b border-slate-200 pb-0 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2 text-xs font-medium sm:text-sm",
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700",
            )}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="mt-4">
        {activeTab === "Personal" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Phone, label: "Mobile", value: guest.mobile },
              { icon: Mail, label: "Email", value: guest.email },
              { icon: MapPin, label: "Address", value: guest.address ?? "—" },
              { icon: User, label: "Nationality", value: guest.nationality },
              { icon: FileText, label: "ID", value: `${guest.idType ?? "—"} · ${guest.idNumber ?? "—"}` },
              { icon: Star, label: "Total Stays", value: String(guest.totalStays) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex gap-3 rounded-lg border border-slate-100 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    {label}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-slate-900">{value}</p>
                </div>
              </div>
            ))}
            {guest.preferences && guest.preferences.length > 0 && (
              <div className="sm:col-span-2">
                <p className="mb-2 text-xs font-medium text-slate-500">Preferences</p>
                <div className="flex flex-wrap gap-2">
                  {guest.preferences.map((p) => (
                    <span
                      key={p}
                      className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "Stay History" && (
          stays.length > 0 ? (
            <DataTable
              keyField="id"
              data={stays}
              columns={[
                { key: "checkIn", header: "Check-in", render: (r) => r.checkIn },
                { key: "checkOut", header: "Check-out", render: (r) => r.checkOut },
                { key: "room", header: "Room", render: (r) => `${r.room} (${r.roomType})` },
                { key: "amount", header: "Amount", render: (r) => formatINR(r.amount) },
              ]}
            />
          ) : (
            <EmptyState title="No stay history" description="Past stays will appear here." />
          )
        )}

        {activeTab === "Invoices" && (
          invoices.length > 0 ? (
            <DataTable
              keyField="id"
              data={invoices}
              columns={[
                { key: "no", header: "Invoice No", render: (r) => r.invoiceNo },
                { key: "date", header: "Date", render: (r) => r.date },
                { key: "gst", header: "GST", render: (r) => formatINR(r.gst) },
                { key: "payment", header: "Total", render: (r) => formatINR(r.payment) },
              ]}
            />
          ) : (
            <EmptyState title="No invoices" description="Invoice history for this guest." />
          )
        )}

        {activeTab === "Feedback" && (
          feedback.length > 0 ? (
            <div className="space-y-3">
              {feedback.map((f) => (
                <div key={f.id} className="rounded-lg border border-slate-100 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-900">Rating: {f.rating}/10</p>
                    <div className="flex gap-3 text-xs text-slate-500">
                      <span>Clean: {f.cleanliness}</span>
                      <span>Food: {f.food}</span>
                      <span>Service: {f.service}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{f.comments}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No feedback" description="Guest feedback will appear here." />
          )
        )}

        {activeTab === "Documents" && (
          <div className="space-y-2">
            {[
              { name: `${guest.idType ?? "ID"} Copy`, status: "Verified" },
              { name: "Registration Card", status: "On File" },
              { name: "Corporate Authorization", status: guest.name.includes("Brown") ? "On File" : "N/A" },
            ].map((doc) => (
              <div
                key={doc.name}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-900">{doc.name}</span>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Loyalty" && (
          <div className="space-y-4">
            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-5">
              <p className="text-sm text-amber-800">Current Balance</p>
              <p className="mt-1 text-3xl font-bold text-amber-900">{guest.loyaltyPoints} pts</p>
              <p className="mt-2 text-xs text-amber-700">
                ≈ {formatINR(guest.loyaltyPoints * 0.5)} redeemable value
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-slate-100 p-3">
                <p className="text-xs text-slate-500">Tier</p>
                <p className="font-semibold text-slate-900">
                  {guest.loyaltyPoints >= 3000 ? "Gold" : guest.loyaltyPoints >= 1500 ? "Silver" : "Bronze"}
                </p>
              </div>
              <div className="rounded-lg border border-slate-100 p-3">
                <p className="text-xs text-slate-500">Points to next tier</p>
                <p className="font-semibold text-slate-900">
                  {Math.max(0, 3000 - guest.loyaltyPoints)} pts
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
