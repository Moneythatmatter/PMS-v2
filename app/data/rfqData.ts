export interface RFQVendorItem {
  id: string;
  vendorName: string;
  email: string;
  phone: string;
  invitationSentOn?: string;
  status: "Pending" | "Sent" | "Responded";
}

export interface RFQRequestedItem {
  id: string;
  materialId?: string;
  productCode?: string;
  item: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedRate: number;
}

export interface RFQAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: "pdf" | "xlsx" | "doc" | "image" | string;
  dataUrl?: string;
  previewUrl?: string;
  mimeType?: string;
  uploadedBy?: string;
  uploadedOn?: string;
}

export interface VendorQuotationComparison {
  /** Supplier master id — primary key for bids (names are not unique). */
  vendorId: string;
  /** Display-only / legacy; prefer resolving from supplier master. */
  vendorName?: string;
  unitPrice: number;
  deliveryDays: number;
  paymentTerms: string;
  warranty: string;
  rating: string;
  totalAmount: number;
  isRecommended: boolean;
}

/** Persisted invited-vendor row: id + RFQ-specific status only (no denormalized contact fields). */
export type StoredRfqVendor = {
  id: string;
  status: RFQVendorItem["status"];
  invitationSentOn?: string;
};

export interface RFQRecord {
  id: string;
  rfqNumber: string;
  linkedPR?: string;
  department: string;
  buyer: string;
  invitedVendors: RFQVendorItem[];
  closingDate: string;
  rfqDate: string;
  selectedVendor?: string;
  poNumber?: string;
  status: "Draft" | "Sent" | "Pending Response" | "Vendor Selected" | "Converted to PO" | "Closed" | "Cancelled";
  priority: "Low" | "Medium" | "High" | "Emergency";
  requestedItems: RFQRequestedItem[];
  commercialTerms: {
    deliveryLocation: string;
    deliveryAddress: string;
    paymentTerms: string;
    currency: string;
    expectedDelivery: string;
    tax: string;
    remarks: string;
  };
  attachments: RFQAttachment[];
  comparisonData: VendorQuotationComparison[];
  activityTimeline: { stage: string; timestamp: string; note: string; author?: string }[];
}

/** Legacy / API aliases for RFQ line items */
type RfqRequestedItemInput = Partial<RFQRequestedItem> & {
  itemName?: string;
  itemDescription?: string;
  requestedQty?: number;
  uom?: string;
  estimatedPrice?: number;
  unitRate?: number;
};

/** Legacy / API aliases for RFQ vendor rows */
type RfqVendorInput = Partial<RFQVendorItem> & {
  vendorId?: string;
  name?: string;
  invitedOn?: string;
};

/** Normalize API / legacy JSON shapes into canonical RFQ line items. */
export function normalizeRfqRequestedItem(
  raw: RfqRequestedItemInput,
  index: number,
): RFQRequestedItem {
  const r = raw as Record<string, any>;
  return {
    id: String(r.id ?? `rfq-item-${index}`),
    materialId: r.materialId ? String(r.materialId) : undefined,
    productCode: r.productCode ? String(r.productCode) : undefined,
    item: String(r.item ?? r.itemName ?? r.itemDescription ?? ""),
    category: String(r.category ?? ""),
    quantity: Number(r.quantity ?? r.requestedQty ?? 0),
    unit: String(r.unit ?? r.uom ?? ""),
    estimatedRate: Number(r.estimatedRate ?? r.estimatedPrice ?? r.unitRate ?? 0),
  };
}

/** Normalize API / legacy JSON shapes into canonical RFQ vendor rows. */
export function normalizeRfqVendor(
  raw: RfqVendorInput,
  index: number,
): RFQVendorItem {
  const r = raw as Record<string, any>;
  const status = r.status;
  return {
    id: String(r.id ?? r.vendorId ?? `rfq-vendor-${index}`),
    vendorName: String(r.vendorName ?? r.name ?? ""),
    email: String(r.email ?? ""),
    phone: String(r.phone ?? ""),
    invitationSentOn: r.invitationSentOn
      ? String(r.invitationSentOn)
      : r.invitedOn
        ? String(r.invitedOn)
        : undefined,
    status:
      status === "Pending" || status === "Sent" || status === "Responded" ? status : "Pending",
  };
}

/** Persist only vendor id + RFQ invite status (resolve name/email/phone from supplier master). */
export function toStoredRfqVendor(vendor: Pick<RFQVendorItem, "id" | "status" | "invitationSentOn">): StoredRfqVendor {
  return {
    id: vendor.id,
    status: vendor.status,
    ...(vendor.invitationSentOn ? { invitationSentOn: vendor.invitationSentOn } : {}),
  };
}

type ComparisonInput = Partial<VendorQuotationComparison> & {
  vendor_id?: string;
  name?: string;
};

/** Normalize comparison bids; prefer vendorId, fall back to matching invited vendor by name. */
export function normalizeComparisonBid(
  raw: ComparisonInput,
  index: number,
  invitedVendors: RFQVendorItem[] = [],
  sameNameOffset = 0,
): VendorQuotationComparison {
  const r = raw as Record<string, any>;
  const legacyName = String(r.vendorName ?? r.name ?? "");
  let vendorId = String(r.vendorId ?? r.vendor_id ?? "");
  if (!vendorId && legacyName) {
    const matches = invitedVendors.filter((v) => v.vendorName === legacyName);
    vendorId = matches[sameNameOffset]?.id ?? matches[0]?.id ?? `legacy-${legacyName}-${index}`;
  }
  if (!vendorId) vendorId = `comparison-vendor-${index}`;
  return {
    vendorId,
    vendorName: legacyName || undefined,
    unitPrice: Number(r.unitPrice ?? 0),
    deliveryDays: Number(r.deliveryDays ?? 0),
    paymentTerms: String(r.paymentTerms ?? ""),
    warranty: String(r.warranty ?? ""),
    rating: String(r.rating ?? ""),
    totalAmount: Number(r.totalAmount ?? 0),
    isRecommended: Boolean(r.isRecommended),
  };
}

/** Normalize a full RFQ record from API (handles field aliases and missing ids). */
export function normalizeRfqRecord(rfq: RFQRecord): RFQRecord {
  const linked =
    rfq.linkedPR ??
    (rfq as RFQRecord & { linkedPr?: string }).linkedPr ??
    "";

  const invitedVendors = (rfq.invitedVendors ?? []).map(normalizeRfqVendor);

  const nameOccurrence = new Map<string, number>();
  const comparisonData = (rfq.comparisonData ?? []).map((b, i) => {
    const legacyName = String((b as any).vendorName ?? (b as any).name ?? "");
    const offset = nameOccurrence.get(legacyName) ?? 0;
    if (legacyName) nameOccurrence.set(legacyName, offset + 1);
    return normalizeComparisonBid(b, i, invitedVendors, offset);
  });

  return {
    ...rfq,
    linkedPR: linked || undefined,
    requestedItems: (rfq.requestedItems ?? []).map(normalizeRfqRequestedItem),
    invitedVendors,
    comparisonData,
    attachments: (rfq.attachments ?? []).map((att, i) => ({
      ...att,
      id: att.id ?? `rfq-att-${i}`,
    })),
    commercialTerms: {
      deliveryLocation: rfq.commercialTerms?.deliveryLocation ?? "",
      deliveryAddress: rfq.commercialTerms?.deliveryAddress ?? "",
      paymentTerms: rfq.commercialTerms?.paymentTerms ?? "",
      currency: rfq.commercialTerms?.currency ?? "INR",
      expectedDelivery: rfq.commercialTerms?.expectedDelivery ?? "",
      tax: rfq.commercialTerms?.tax ?? "",
      remarks: rfq.commercialTerms?.remarks ?? "",
    },
  };
}
