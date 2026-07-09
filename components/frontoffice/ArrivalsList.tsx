import type { ArrivalGuest } from "@/app/data/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "./StatusBadge";

interface ArrivalsListProps {
  arrivals: ArrivalGuest[];
}

export function ArrivalsList({ arrivals }: ArrivalsListProps) {
  return (
    <Card className="h-full">
      <CardHeader title="Today's Arrivals" />
      <ul className="space-y-3">
        {arrivals.map((guest) => (
          <li
            key={guest.id}
            className="flex flex-col gap-2 rounded-lg border border-slate-100 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900">{guest.name}</p>
              <p className="text-xs text-slate-500">
                {guest.bookingId} · Room {guest.roomNo} · {guest.roomType}
              </p>
            </div>
            <StatusBadge status={guest.status} className="self-start sm:self-auto" />
          </li>
        ))}
      </ul>
    </Card>
  );
}
