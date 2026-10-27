"use client";

import { useEffect, useState } from "react";
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
