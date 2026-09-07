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
  fileType: "pdf" | "xlsx" | "doc";
}

export interface VendorQuotationComparison {
  vendorName: string;
  unitPrice: number;
  deliveryDays: number;
  paymentTerms: string;
  warranty: string;
  rating: string;
  totalAmount: number;
  isRecommended: boolean;
}

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

/** Normalize a full RFQ record from API (handles field aliases and missing ids). */
export function normalizeRfqRecord(rfq: RFQRecord): RFQRecord {
  const linked =
    rfq.linkedPR ??
    (rfq as RFQRecord & { linkedPr?: string }).linkedPr ??
    "";

  return {
    ...rfq,
    linkedPR: linked || undefined,
    requestedItems: (rfq.requestedItems ?? []).map(normalizeRfqRequestedItem),
    invitedVendors: (rfq.invitedVendors ?? []).map(normalizeRfqVendor),
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
