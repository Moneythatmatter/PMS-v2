"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  Award,
  Calendar,
  Crown,
  Eye,
  FileText,
  Globe,
  Hash,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Star,
  User,
  Users,
} from "lucide-react";
import type {
  GuestFeedbackRecord,
  GuestProfile,
  GuestStayHistory,
} from "@/app/data/frontoffice/modules";
import type { ReservationBooking } from "@/app/data/types";
import {
  feedbackService,
  guestService,
  guestStayHistoryService,
  reservationService,
} from "@/services/front-office";
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
import { displayGuestNo } from "@/lib/guest-display";
import { displayBookingNo } from "@/lib/booking-display";
import { allBookingsDetailHref, allBookingsGuestHref } from "@/lib/check-in-navigation";
import { ReservationStatusBadge } from "@/components/frontoffice/reservation/ReservationStatusBadge";
import {
  buildGuestDocuments,
  documentStatusClass,
  DocumentPreviewModal,
  GuestEditModal,
  type GuestDocumentItem,
} from "@/components/frontoffice/GuestProfileModals";

const tabs = [
  "Personal",
  "Stay History",
  "Bookings",
  "Feedback",
  "Documents",
  "Loyalty",
] as const;

type Tab = (typeof tabs)[number];

function getInitials(name?: string) {
  if (!name?.trim()) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function displayValue(value?: string | number | null) {
  if (value === undefined || value === null || String(value).trim() === "") return "—";
  return String(value);
}

type ProfileField = {
  icon: typeof User;
  label: string;
  value: string;
};

function buildPersonalFields(guest: GuestProfile): ProfileField[] {
  return [
    { icon: Hash, label: "Guest No.", value: displayGuestNo(guest) },
    { icon: User, label: "Gender", value: displayValue(guest.gender) },
    { icon: Calendar, label: "Date of Birth", value: displayValue(guest.dob) },
    { icon: Globe, label: "Nationality", value: displayValue(guest.nationality) },
    { icon: Calendar, label: "Member Since", value: displayValue(guest.memberSince) },
    { icon: Phone, label: "Mobile", value: displayValue(guest.mobile) },
    { icon: Mail, label: "Email", value: displayValue(guest.email) },
    { icon: MapPin, label: "Address", value: displayValue(guest.address) },
    { icon: MapPin, label: "City", value: displayValue(guest.city) },
    { icon: MapPin, label: "State", value: displayValue(guest.state) },
    { icon: Globe, label: "Country", value: displayValue(guest.country) },
    { icon: Hash, label: "Pincode", value: displayValue(guest.pincode) },
    { icon: FileText, label: "ID Type", value: displayValue(guest.idType) },
    { icon: FileText, label: "ID Number", value: displayValue(guest.idNumber) },
    { icon: Star, label: "Total Stays", value: displayValue(guest.totalStays) },
    { icon: Award, label: "Loyalty Points", value: displayValue(guest.loyaltyPoints) },
  ];
}

export function GuestProfileView() {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [pmsProfiles, setPmsProfiles] = useState<GuestProfile[]>([]);
  const [selected, setSelected] = useState<GuestProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Personal");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allStays, setAllStays] = useState<GuestStayHistory[]>([]);
  const [allBookings, setAllBookings] = useState<ReservationBooking[]>([]);
  const [allFeedbacks, setAllFeedbacks] = useState<GuestFeedbackRecord[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<GuestDocumentItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [profiles, stayHist, bookings, fb] = await Promise.all([
          guestService.list(),
          guestStayHistoryService.list(),
          reservationService.list(),
          feedbackService.list(),
        ]);
        if (!cancelled) {
          setPmsProfiles(profiles);
          setAllStays(stayHist);
          setAllBookings(bookings);
          setAllFeedbacks(fb);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return pmsProfiles.filter(
      (g) =>
        (tierFilter === "all" ||
          (tierFilter === "vip" && g.loyaltyPoints >= 5000) ||
          (tierFilter === "regular" && g.loyaltyPoints < 5000)) &&
        ((g.name || "").toLowerCase().includes(q) ||
          (g.email || "").toLowerCase().includes(q) ||
          (g.mobile || "").includes(q) ||
          displayGuestNo(g).toLowerCase().includes(q)),
    );
  }, [search, tierFilter, pmsProfiles]);

  const stays = useMemo(
    () => (selected ? allStays.filter((s) => s.guestId === selected.id) : []),
    [selected, allStays],
  );

  const bookings = useMemo(
    () => (selected ? allBookings.filter((b) => b.guestId === selected.id) : []),
    [selected, allBookings],
  );

  const feedback = useMemo(
    () => (selected ? allFeedbacks.filter((f) => f.guest === selected.name) : []),
    [selected, allFeedbacks],
  );

  const selectGuest = (guest: GuestProfile) => {
    setSelected(guest);
    setActiveTab("Personal");
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditOpen(false);
    setPreviewDoc(null);
  };

  const handleGuestSaved = (updated: GuestProfile) => {
    setPmsProfiles((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    setSelected(updated);
  };

  const vipCount = useMemo(
    () => pmsProfiles.filter((g) => g.loyaltyPoints >= 5000).length,
    [pmsProfiles],
  );

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-5">
      <FOPageHeader
        eyebrow="Front Office"
        title="Guest Profiles"
        description="Search guest records, view stay history, bookings, and loyalty details."
        badge={
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
            {pmsProfiles.length} registered profiles
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatMiniCard label="Total Profiles" value={pmsProfiles.length} icon={Users} />
        <StatMiniCard
          label="Avg. Loyalty Points"
          value={pmsProfiles.length > 0 ? Math.round(
            pmsProfiles.reduce((s, g) => s + (g.loyaltyPoints || 0), 0) /
              pmsProfiles.length,
          ) : 0}
          accent="#f59e0b"
          icon={Star}
        />
        <StatMiniCard
          label="Total Stays"
          value={pmsProfiles.reduce((s, g) => s + (g.totalStays || 0), 0)}
          icon={Award}
        />
        <StatMiniCard label="VIP Members" value={vipCount} accent="#8b5cf6" icon={Crown} />
      </div>

      <FOSearchToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email, mobile, or guest no…"
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

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <EmptyState
            title={pmsProfiles.length === 0 ? "No guest profiles" : "No profiles found"}
            description={
              pmsProfiles.length === 0
                ? "Guest profiles will appear here once registered."
                : "Try a different search term or filter."
            }
          />
        ) : (
          <>
            <div className="space-y-0 divide-y divide-slate-100 md:hidden">
              {filtered.map((guest) => (
                <button
                  key={guest.id}
                  type="button"
                  onClick={() => selectGuest(guest)}
                  className={cn(
                    "flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-emerald-50/40",
                    selected?.id === guest.id && drawerOpen && "bg-emerald-50/50",
                  )}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-sm font-bold text-white">
                    {getInitials(guest.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{guest.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {displayGuestNo(guest)} · {guest.mobile}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {guest.nationality || "—"} · {guest.totalStays} stays · {guest.loyaltyPoints} pts
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Guest
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Guest No.
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Mobile
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Email
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Nationality
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Stays
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Loyalty
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((guest) => (
                    <tr
                      key={guest.id}
                      onClick={() => selectGuest(guest)}
                      className={cn(
                        "group cursor-pointer transition-colors hover:bg-emerald-50/30",
                        selected?.id === guest.id && drawerOpen && "bg-emerald-50/40",
                      )}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-xs font-bold text-white transition-colors group-hover:from-emerald-600 group-hover:to-emerald-800">
                            {getInitials(guest.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{guest.name}</p>
                            <p className="text-xs text-slate-500">
                              {[
                                guest.gender,
                                guest.memberSince ? `Member since ${guest.memberSince}` : null,
                              ]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-800">
                        {displayGuestNo(guest)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">{guest.mobile || "—"}</td>
                      <td className="px-4 py-3.5 text-slate-700">{guest.email || "—"}</td>
                      <td className="px-4 py-3.5 text-slate-700">{guest.nationality || "—"}</td>
                      <td className="px-4 py-3.5 font-medium text-slate-800">{guest.totalStays}</td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-amber-700">{guest.loyaltyPoints} pts</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 text-center text-[11px] text-slate-400">
              Showing {filtered.length} guest profile{filtered.length !== 1 ? "s" : ""}
              {" · "}
              Click a row to view full details
            </div>
          </>
        )}
      </div>

      <Drawer
        open={drawerOpen && !!selected}
        onClose={closeDrawer}
        title={selected?.name ?? "Guest Profile"}
        description={
          selected
            ? `${displayGuestNo(selected)} · ${selected.nationality || "—"}`
            : undefined
        }
        width="lg"
        footer={
          selected ? (
            <>
              <Button variant="outline" onClick={closeDrawer}>
                Close
              </Button>
              <Button variant="outline" onClick={() => setEditOpen(true)} className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Edit Guest
              </Button>
              <Link href={allBookingsGuestHref(selected)}>
                <Button variant="outline">Show Bookings</Button>
              </Link>
              <Link href="/frontoffice/guest-folio">
                <Button className="bg-emerald-700 hover:bg-emerald-800">View Folio</Button>
              </Link>
            </>
          ) : undefined
        }
      >
        {selected && (
          <ProfilePanel
            guest={selected}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onEditGuest={() => setEditOpen(true)}
            onPreviewDocument={setPreviewDoc}
            stays={stays}
            bookings={bookings}
            feedback={feedback}
          />
        )}
      </Drawer>

      {selected && (
        <>
          <GuestEditModal
            guest={selected}
            open={editOpen}
            onClose={() => setEditOpen(false)}
            onSaved={handleGuestSaved}
          />
          <DocumentPreviewModal
            guest={selected}
            document={previewDoc}
            onClose={() => setPreviewDoc(null)}
          />
        </>
      )}
    </div>
  );
}

function ProfilePanel({
  guest,
  activeTab,
  onTabChange,
  onEditGuest,
  onPreviewDocument,
  stays,
  bookings,
  feedback,
}: {
  guest: GuestProfile;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onEditGuest: () => void;
  onPreviewDocument: (doc: GuestDocumentItem) => void;
  stays: GuestStayHistory[];
  bookings: ReservationBooking[];
  feedback: GuestFeedbackRecord[];
}) {
  const documents = buildGuestDocuments(guest);

  return (
    <div>
      <div className="mb-4 rounded-xl border border-slate-100 bg-gradient-to-r from-slate-50/90 to-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800 ring-2 ring-white">
              {getInitials(guest.name)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-slate-900">{guest.name}</h2>
              <p className="truncate text-xs text-slate-500">
                Member since {guest.memberSince ?? "—"}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onEditGuest}
              className="h-8 gap-1.5 px-2.5"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">
              <Award className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">{guest.loyaltyPoints} pts</span>
            </div>
          </div>
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
                ? "border-emerald-700 text-emerald-700"
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
            {buildPersonalFields(guest).map(({ icon: Icon, label, value }) => (
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
                      className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800"
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

        {activeTab === "Bookings" && (
          bookings.length > 0 ? (
            <DataTable
              keyField="id"
              data={bookings}
              columns={[
                {
                  key: "bookingNo",
                  header: "Booking No",
                  render: (r) => (
                    <Link
                      href={allBookingsDetailHref(r)}
                      className="font-medium text-emerald-700 hover:text-emerald-900 hover:underline"
                    >
                      {displayBookingNo(r)}
                    </Link>
                  ),
                },
                { key: "checkIn", header: "Check-in", render: (r) => r.checkIn },
                { key: "checkOut", header: "Check-out", render: (r) => r.checkOut },
                {
                  key: "room",
                  header: "Room",
                  render: (r) =>
                    r.roomNo ? `${r.roomNo}${r.roomType ? ` (${r.roomType})` : ""}` : "—",
                },
                {
                  key: "status",
                  header: "Status",
                  render: (r) => <ReservationStatusBadge status={r.status} />,
                },
                {
                  key: "amount",
                  header: "Total",
                  render: (r) => formatINR(r.totalAmount ?? r.balance ?? 0),
                },
              ]}
            />
          ) : (
            <EmptyState title="No bookings" description="Reservation history for this guest." />
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
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate text-sm font-medium text-slate-900">{doc.name}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      documentStatusClass(doc.status),
                    )}
                  >
                    {doc.status}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!doc.canPreview}
                    onClick={() => onPreviewDocument(doc)}
                    className="gap-1.5"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </Button>
                </div>
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
