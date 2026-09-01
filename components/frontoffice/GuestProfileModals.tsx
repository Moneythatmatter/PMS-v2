"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import type { GuestProfile } from "@/app/data/frontoffice/modules";
import { guestService } from "@/services/front-office";
import { Button } from "@/components/ui/Button";
import { FormField, Modal, TextInput } from "@/components/frontoffice/ui";
import {
  GuestDetailsSection,
  type GuestDetails,
} from "@/components/frontoffice/checkin/GuestDetailsSection";
import { guestToFormFields, splitGuestName } from "@/components/frontoffice/guestFormUtils";
import { displayGuestNo } from "@/lib/guest-display";
import { cn } from "@/lib/utils";

export type GuestDocumentItem = {
  id: string;
  name: string;
  status: string;
  canPreview: boolean;
};

export function buildGuestDocuments(guest: GuestProfile): GuestDocumentItem[] {
  return [
    {
      id: "id-copy",
      name: `${guest.idType ?? "ID"} Copy`,
      status: guest.idNumber ? "Verified" : "Pending",
      canPreview: Boolean(guest.idType || guest.idNumber),
    },
    {
      id: "registration-card",
      name: "Registration Card",
      status: "On File",
      canPreview: true,
    },
    {
      id: "corporate-auth",
      name: "Corporate Authorization",
      status: guest.name.includes("Brown") ? "On File" : "N/A",
      canPreview: guest.name.includes("Brown"),
    },
  ];
}

export function documentStatusClass(status: string) {
  if (status === "N/A") return "bg-slate-100 text-slate-600";
  if (status === "Pending") return "bg-amber-50 text-amber-700";
  return "bg-emerald-50 text-emerald-700";
}

interface GuestEditModalProps {
  guest: GuestProfile;
  open: boolean;
  onClose: () => void;
  onSaved: (guest: GuestProfile) => void;
}

export function GuestEditModal({ guest, open, onClose, onSaved }: GuestEditModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState<GuestDetails>({
    gender: "",
    dob: "",
    nationality: "",
    address: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    idProofType: "",
    idNumber: "",
  });

  useEffect(() => {
    if (!open) return;
    const fields = guestToFormFields(guest);
    setFirstName(fields.firstName);
    setLastName(fields.lastName);
    setMobile(guest.mobile || "");
    setEmail(fields.email);
    setDetails({
      gender: fields.gender,
      dob: fields.dob,
      nationality: fields.nationality,
      address: fields.address,
      city: fields.city,
      state: fields.state,
      country: fields.country,
      pincode: fields.pincode,
      idProofType: fields.idProofType,
      idNumber: fields.idNumber,
    });
    setError(null);
  }, [open, guest]);

  const handleDetailsChange = (key: string, value: string) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const name = `${firstName} ${lastName}`.trim();
    if (!name || !mobile.trim()) {
      setError("First name and mobile are required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const updated = await guestService.update(guest.id, {
        name,
        mobile: mobile.trim(),
        email: email.trim(),
        nationality: details.nationality,
        gender: details.gender,
        dob: details.dob,
        address: details.address,
        city: details.city,
        state: details.state,
        country: details.country,
        pincode: details.pincode,
        idType: details.idProofType,
        idNumber: details.idNumber,
      });
      onSaved(updated);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save guest profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Guest Profile"
      description={`${displayGuestNo(guest)} · Update contact and identity details`}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-700 hover:bg-emerald-800"
          >
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </>
      }
    >
      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="First Name" required>
          <TextInput
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
          />
        </FormField>
        <FormField label="Last Name">
          <TextInput
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
          />
        </FormField>
        <FormField label="Mobile" required>
          <TextInput
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="+91 98765 43210"
          />
        </FormField>
        <FormField label="Email">
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="guest@email.com"
          />
        </FormField>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <GuestDetailsSection guestDetails={details} onChange={handleDetailsChange} />
      </div>
    </Modal>
  );
}

interface DocumentPreviewModalProps {
  guest: GuestProfile;
  document: GuestDocumentItem | null;
  onClose: () => void;
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value || "—"}</span>
    </div>
  );
}

export function DocumentPreviewModal({
  guest,
  document,
  onClose,
}: DocumentPreviewModalProps) {
  if (!document) return null;

  const { firstName, lastName } = splitGuestName(guest.name);

  return (
    <Modal
      open={!!document}
      onClose={onClose}
      title={document.name}
      description={`Status: ${document.status}`}
      size="lg"
      footer={
        <Button variant="outline" onClick={onClose}>
          Close Preview
        </Button>
      }
    >
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <div className="border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-700" />
            <span className="text-sm font-semibold text-slate-900">Document Preview</span>
            <span
              className={cn(
                "ml-auto rounded-full px-2 py-0.5 text-xs font-medium",
                documentStatusClass(document.status),
              )}
            >
              {document.status}
            </span>
          </div>
        </div>

        <div className="p-4">
          {document.id === "id-copy" && (
            <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
                {guest.idType ?? "Identity Document"}
              </p>
              <div className="mt-4 flex aspect-[1.6/1] items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50">
                <div className="text-center">
                  <FileText className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-2 text-xs text-slate-400">Scanned ID preview</p>
                </div>
              </div>
              <div className="mt-4 space-y-0">
                <PreviewRow label="Guest Name" value={guest.name} />
                <PreviewRow label="ID Type" value={guest.idType ?? "—"} />
                <PreviewRow label="ID Number" value={guest.idNumber ?? "—"} />
                <PreviewRow label="Nationality" value={guest.nationality ?? "—"} />
                <PreviewRow label="Date of Birth" value={guest.dob ?? "—"} />
              </div>
            </div>
          )}

          {document.id === "registration-card" && (
            <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-center text-sm font-bold text-slate-900">Guest Registration Card</p>
              <p className="text-center text-xs text-slate-500">{displayGuestNo(guest)}</p>
              <div className="mt-4 space-y-0">
                <PreviewRow label="Guest Name" value={guest.name} />
                <PreviewRow label="First Name" value={firstName} />
                <PreviewRow label="Last Name" value={lastName} />
                <PreviewRow label="Mobile" value={guest.mobile} />
                <PreviewRow label="Email" value={guest.email ?? "—"} />
                <PreviewRow label="Address" value={guest.address ?? "—"} />
                <PreviewRow label="Nationality" value={guest.nationality ?? "—"} />
                <PreviewRow label="Total Stays" value={String(guest.totalStays ?? 0)} />
              </div>
            </div>
          )}

          {document.id === "corporate-auth" && (
            <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-center text-sm font-bold text-slate-900">
                Corporate Authorization Letter
              </p>
              <div className="mt-4 space-y-0">
                <PreviewRow label="Authorized Guest" value={guest.name} />
                <PreviewRow label="Guest No." value={displayGuestNo(guest)} />
                <PreviewRow label="Company" value="Corporate Account" />
                <PreviewRow label="Authorization" value="Billing to company" />
                <PreviewRow label="Valid For" value="Current stay" />
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
