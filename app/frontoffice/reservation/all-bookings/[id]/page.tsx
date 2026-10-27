"use client";

import { useParams } from "next/navigation";
import { BookingDetailPage } from "@/components/frontoffice/reservation/BookingDetailPage";

export default function BookingDetailRoute() {
  const params = useParams<{ id: string }>();
  return <BookingDetailPage bookingId={decodeURIComponent(String(params.id))} />;
}
