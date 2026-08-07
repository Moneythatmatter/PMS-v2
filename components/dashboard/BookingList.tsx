"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import type { Booking } from "@/app/data/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface BookingListProps {
  bookings: Booking[];
}

export function BookingList({ bookings }: BookingListProps) {
  const [search, setSearch] = useState("");

  const filtered = bookings.filter(
    (b) =>
      b.guestName.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.roomNo.includes(search),
  );

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Booking List</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Recent and upcoming bookings
          </p>
        </div>
        <Link href="/frontoffice/reservation/new" className="w-full sm:w-auto">
          <Button size="sm" className="w-full shrink-0 gap-1.5 sm:w-auto">
            <Plus className="h-3.5 w-3.5" />
            New Booking
          </Button>
        </Link>
      </div>
      <div className="mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
      </div>

      {/* Mobile card list */}
      <div className="space-y-3 md:hidden">
        {filtered.map((booking) => (
          <div
            key={booking.id}
            className="rounded-lg border border-slate-100 p-3"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{booking.guestName}</p>
                <p className="text-xs text-slate-500">{booking.id}</p>
              </div>
              <Badge status={booking.status} />
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <div>
                <dt className="text-slate-400">Room</dt>
                <dd className="font-medium text-slate-700">
                  {booking.roomNo} · {booking.roomType}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Duration</dt>
                <dd className="font-medium text-slate-700">{booking.duration}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Check in</dt>
                <dd className="font-medium text-slate-700">{booking.checkIn}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Check out</dt>
                <dd className="font-medium text-slate-700">{booking.checkOut}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="pb-3 pr-4">Booking ID</th>
              <th className="pb-3 pr-4">Guest Name</th>
              <th className="pb-3 pr-4">Room Type</th>
              <th className="pb-3 pr-4">Room No</th>
              <th className="pb-3 pr-4">Duration</th>
              <th className="pb-3 pr-4">Check In</th>
              <th className="pb-3 pr-4">Check Out</th>
              <th className="pb-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((booking) => (
              <tr
                key={booking.id}
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
              >
                <td className="py-3.5 pr-4 font-medium text-slate-900">
                  {booking.id}
                </td>
                <td className="py-3.5 pr-4 text-slate-700">{booking.guestName}</td>
                <td className="py-3.5 pr-4 text-slate-700">{booking.roomType}</td>
                <td className="py-3.5 pr-4 text-slate-700">{booking.roomNo}</td>
                <td className="py-3.5 pr-4 text-slate-700">{booking.duration}</td>
                <td className="py-3.5 pr-4 text-slate-700">{booking.checkIn}</td>
                <td className="py-3.5 pr-4 text-slate-700">{booking.checkOut}</td>
                <td className="py-3.5">
                  <Badge status={booking.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
