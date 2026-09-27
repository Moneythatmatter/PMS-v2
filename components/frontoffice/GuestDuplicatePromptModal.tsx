"use client";

import type { GuestProfile } from "@/app/data/frontoffice/modules";
import { UserRound } from "lucide-react";
import { Modal } from "@/components/frontoffice/ui/Modal";
import { Button } from "@/components/ui/Button";

const FIELD_LABELS: Record<"mobile" | "email" | "idNumber", string> = {
  mobile: "mobile number",
  email: "email",
  idNumber: "ID document number",
};

type GuestDuplicatePromptModalProps = {
  open: boolean;
  guest: GuestProfile | null;
  field: "mobile" | "email" | "idNumber";
  onUseExisting: () => void;
  onKeepNew: () => void;
  onClose: () => void;
};

export function GuestDuplicatePromptModal({
  open,
  guest,
  field,
  onUseExisting,
  onKeepNew,
  onClose,
}: GuestDuplicatePromptModalProps) {
  if (!guest) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Guest already exists"
      description={`This ${FIELD_LABELS[field]} matches an existing guest profile. Choose one to avoid duplicates.`}
      size="sm"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onKeepNew}>
            Enter as new guest
          </Button>
          <Button
            type="button"
            onClick={onUseExisting}
            className="bg-emerald-700 hover:bg-emerald-800"
          >
            Use existing guest
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm ring-1 ring-amber-100">
          <UserRound className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{guest.name}</p>
          <p className="mt-0.5 text-xs text-slate-600">
            {[guest.guestNo, guest.mobile, guest.email, guest.idNumber]
              .map((v) => String(v ?? "").trim())
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="mt-2 text-[11px] text-amber-800">
            Selecting the existing guest will fill their saved details into this
            form.
          </p>
        </div>
      </div>
    </Modal>
  );
}
