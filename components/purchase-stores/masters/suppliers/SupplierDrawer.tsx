"use client";

import React, { useState, useEffect } from "react";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { FormField, TextInput, SelectInput, FormSection } from "@/components/frontoffice/ui";
import { Sparkles } from "lucide-react";
import {
  PAYMENT_TERMS_OPTIONS,
  type SupplierItem,
  type SupplierPartyOption,
} from "@/app/data/purchaseStoresMastersData";
import { psSupplierService } from "@/services/purchase-stores/index";

interface SupplierDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (supplier: SupplierItem) => void;
  initialSupplier?: SupplierItem | null;
}

const defaultSupplierState: Partial<SupplierItem> = {
  supplierCode: "",
  partyId: "",
  paymentTerms: "Net 30 Days",
  rating: 4,
  status: "Active",
};

function ReadOnlyField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm text-slate-900">{value || "—"}</p>
    </div>
  );
}

export function SupplierDrawer({ open, onClose, onSave, initialSupplier }: SupplierDrawerProps) {
  const [formData, setFormData] = useState<Partial<SupplierItem>>(defaultSupplierState);
  const [partyOptions, setPartyOptions] = useState<SupplierPartyOption[]>([]);
  const [partyError, setPartyError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [shownFor, setShownFor] = useState<{ open: boolean; supplier: SupplierItem | null | undefined }>({
    open: false,
    supplier: undefined,
  });

  const isEditing = Boolean(initialSupplier);

  if (shownFor.open !== open || shownFor.supplier !== initialSupplier) {
    setShownFor({ open, supplier: initialSupplier });
    if (open) {
      setFormData(initialSupplier ? { ...initialSupplier, partyId: initialSupplier.partyId ?? "" } : defaultSupplierState);
      setError(null);
    }
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    psSupplierService
      .partyOptions()
      .then((options) => {
        if (cancelled) return;
        setPartyOptions(options);
        setPartyError(null);
      })
      .catch((e: unknown) => {
        if (!cancelled) setPartyError(e instanceof Error ? e.message : "Failed to load Accounts parties");
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const availableParties = partyOptions.filter(
    (p) =>
      (p.status === "Active" && !p.linkedSupplierId) ||
      p.id === formData.partyId ||
      p.linkedSupplierId === initialSupplier?.id,
  );
  const selectedParty = partyOptions.find((p) => p.id === formData.partyId);
  const showSavedDetails = Boolean(initialSupplier && initialSupplier.partyId === formData.partyId);

  const chooseParty = (id: string) => {
    const party = partyOptions.find((p) => p.id === id);
    setFormData((prev) => ({
      ...prev,
      partyId: id,
      supplierCode: !isEditing && !prev.supplierCode?.trim() && party ? party.partyCode : prev.supplierCode,
    }));
  };

  const handleAutoGenerateCode = () => {
    const name = selectedParty?.partyName ?? initialSupplier?.supplierName ?? "";
    const prefix = name ? name.slice(0, 3).toUpperCase() : "SUP";
    const rand = Math.floor(100 + Math.random() * 900);
    setFormData((prev) => ({ ...prev, supplierCode: `SUP-${prefix}-${rand}` }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partyId) {
      setError("Select the Accounts party for this vendor.");
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const finalSupplier = {
      id: initialSupplier?.id ?? `sup-${Date.now()}`,
      partyId: formData.partyId,
      supplierCode: formData.supplierCode?.trim().toUpperCase() ?? "",
      supplierName: selectedParty?.partyName ?? initialSupplier?.supplierName ?? "",
      paymentTerms: formData.paymentTerms || "Net 30 Days",
      rating: Number(formData.rating ?? 4),
      status: formData.status || "Active",
      createdDate: initialSupplier?.createdDate ?? todayStr,
    } as SupplierItem;

    onSave(finalSupplier);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEditing ? `Edit Vendor: ${initialSupplier?.supplierCode}` : "Add Vendor"}
      description="Vendors come from the Accounts Party Master (type Vendor). Name, contact, GSTIN, PAN and address are edited in Accounts."
      width="2xl"
      className="max-w-full sm:max-w-[700px]"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-5"
          >
            {isEditing ? "Save Changes" : "Save Vendor"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 pb-4">
        <FormSection title="Section 1: Accounts Party" columns={2}>
          <FormField label="Vendor Party" required className="sm:col-span-2">
            <SelectInput
              value={formData.partyId ?? ""}
              onChange={(e) => chooseParty(e.target.value)}
              className={error ? "border-red-400 focus:border-red-500" : ""}
            >
              <option value="">Select a Vendor party…</option>
              {availableParties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.partyName} ({p.partyCode}){p.gstin ? ` · ${p.gstin}` : ""}
                  {p.status !== "Active" ? ` · ${p.status}` : ""}
                </option>
              ))}
            </SelectInput>
            {error && <p className="mt-1 text-[11px] font-medium text-red-500">{error}</p>}
            {partyError && <p className="mt-1 text-[11px] font-medium text-red-500">{partyError}</p>}
            {!partyError && partyOptions.length > 0 && availableParties.length === 0 && (
              <p className="mt-1 text-[11px] text-slate-500">
                Every Vendor party is already linked. Add a new party of type Vendor in Accounts → Party Master.
              </p>
            )}
            {!partyError && partyOptions.length === 0 && (
              <p className="mt-1 text-[11px] text-slate-500">
                No Vendor parties yet. Add one in Accounts → Party Master with party type Vendor.
              </p>
            )}
            {initialSupplier && initialSupplier.linked === false && (
              <p className="mt-1 text-[11px] font-medium text-amber-600">
                This vendor is not linked to Accounts yet. Pick its party to link it.
              </p>
            )}
          </FormField>

          {(selectedParty || showSavedDetails) && (
            <div className="sm:col-span-2 grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <ReadOnlyField label="Vendor / Company Name" value={selectedParty?.partyName ?? initialSupplier?.supplierName} />
              <ReadOnlyField label="Party Code" value={selectedParty?.partyCode ?? initialSupplier?.partyCode} />
              <ReadOnlyField label="GSTIN" value={selectedParty ? selectedParty.gstin : initialSupplier?.gstin} />
              <ReadOnlyField label="City" value={selectedParty ? selectedParty.city : initialSupplier?.city} />
              {showSavedDetails && (
                <>
                  <ReadOnlyField label="Contact Person" value={initialSupplier?.contactPerson} />
                  <ReadOnlyField label="Phone" value={initialSupplier?.phone} />
                  <ReadOnlyField label="Email" value={initialSupplier?.email} />
                  <ReadOnlyField label="PAN" value={initialSupplier?.panNumber} />
                </>
              )}
            </div>
          )}
        </FormSection>

        <FormSection title="Section 2: Purchase Terms" columns={2}>
          <FormField label="Vendor Code">
            <div className="flex gap-2">
              <TextInput
                value={formData.supplierCode ?? ""}
                onChange={(e) => setFormData((p) => ({ ...p, supplierCode: e.target.value }))}
                placeholder="Defaults to the party code"
                className="flex-1 font-mono uppercase"
              />
              <button
                type="button"
                onClick={handleAutoGenerateCode}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                Auto
              </button>
            </div>
          </FormField>

          <FormField label="Payment Terms" required>
            <SelectInput
              value={formData.paymentTerms ?? "Net 30 Days"}
              onChange={(e) =>
                setFormData((p) => ({ ...p, paymentTerms: e.target.value as SupplierItem["paymentTerms"] }))
              }
            >
              {PAYMENT_TERMS_OPTIONS.map((pt) => (
                <option key={pt} value={pt}>
                  {pt}
                </option>
              ))}
            </SelectInput>
          </FormField>
        </FormSection>

        <FormSection title="Section 3: Performance & Status" columns={2}>
          <FormField label="Performance Rating">
            <SelectInput
              value={formData.rating ?? 4}
              onChange={(e) => setFormData((p) => ({ ...p, rating: Number(e.target.value) }))}
            >
              <option value={5}>5 Stars - Premium Preferred</option>
              <option value={4}>4 Stars - Highly Reliable</option>
              <option value={3}>3 Stars - Standard Vendor</option>
              <option value={2}>2 Stars - Needs Improvement</option>
              <option value={1}>1 Star - Under Review</option>
            </SelectInput>
          </FormField>

          <FormField label="Vendor Status">
            <div className="flex items-center gap-6 py-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sup-status"
                  value="Active"
                  checked={formData.status === "Active"}
                  onChange={() => setFormData((p) => ({ ...p, status: "Active" }))}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Active
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="sup-status"
                  value="Inactive"
                  checked={formData.status === "Inactive"}
                  onChange={() => setFormData((p) => ({ ...p, status: "Inactive" }))}
                  className="h-4 w-4 text-slate-600 focus:ring-slate-500"
                />
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  Inactive
                </span>
              </label>
            </div>
          </FormField>
        </FormSection>
      </form>
    </Drawer>
  );
}
