"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { User, Users } from "lucide-react";
import { NewReservationForm } from "@/components/frontoffice/reservation/NewReservationForm";
import { NewGroupReservationForm } from "@/components/frontoffice/reservation/NewGroupReservationForm";
import { cn } from "@/lib/utils";

type BookingMode = "individual" | "group";

function NewReservationPageInner() {
  const searchParams = useSearchParams();
  const isEdit = Boolean(
    searchParams.get("bookingId") ?? searchParams.get("booking"),
  );
  const modeParam = searchParams.get("mode");
  const [mode, setMode] = useState<BookingMode>(
    modeParam === "group" ? "group" : "individual",
  );

  useEffect(() => {
    if (isEdit) {
      setMode("individual");
      return;
    }
    if (modeParam === "group" || modeParam === "individual") {
      setMode(modeParam);
    }
  }, [isEdit, modeParam]);

  return (
    <div className="space-y-4">
      {!isEdit ? (
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {(
            [
              {
                id: "individual" as const,
                label: "Individual",
                icon: User,
              },
              { id: "group" as const, label: "Group", icon: Users },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                mode === id
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {mode === "group" && !isEdit ? (
        <NewGroupReservationForm />
      ) : (
        <NewReservationForm />
      )}
    </div>
  );
}

export default function NewReservationPage() {
  return (
    <Suspense
      fallback={<p className="p-6 text-sm text-slate-500">Loading…</p>}
    >
      <NewReservationPageInner />
    </Suspense>
  );
}
