export interface POLineItem {
  id: string;
  /** PRRequestedItem.id this line fulfils — drives PR ordered / remaining quantity */
  prItemId?: string;
  /** ps_products.id — canonical material identity for stock posting */
  materialId: string;
  /** Human-readable code from Product Master (e.g. PRD-LIN-001) */
  productCode: string;
  productName: string;
  /** @deprecated Use productCode — kept for legacy API rows */
  itemCode: string;
  /** @deprecated Use productName — kept for legacy API rows */
  itemDescription: string;
  category: string;
  quantity: number;
  unit: string;
  unitRate: number;
  taxPercent: number;
  totalAmount: number;
}

export interface PORecord {
  id: string;
  poNumber: string;
  orderDate: string;
  linkedPR?: string;
  linkedRFQ?: string;
  department: string;
  buyerName: string;
  vendorName: string;
  contactPerson: string;
  gstin: string;
  vendorAddress: string;
  vendorPhone: string;
  shipToWarehouse: string;
  dockGate: string;
  expectedDeliveryDate: string;
  freightTerms: string;
  paymentTerms: string;
  paymentDueDays: number;
  discountPercent: number;
  currency: string;
  taxTerms: string;
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  status: "Draft" | "Pending Approval" | "Approved" | "Issued" | "Closed" | "Cancelled";
  items: POLineItem[];
  attachments: { id: string; fileName: string; fileSize: string; fileType: string }[];
  approvalHistory: { level: string; approver: string; action: string; timestamp: string; comments: string }[];
  activityTimeline: { stage: string; timestamp: string; note: string; author: string }[];
  payments?: POPayment[];
  paidAmount?: number;
  paymentStatus?: POPaymentStatus;
}

export type POPaymentStatus = "Unpaid" | "Partially Paid" | "Paid";

export const PO_PAYMENT_MODES = ["Cash", "UPI", "Bank Transfer", "Cheque", "Card"] as const;

export interface POPayment {
  id: string;
  paymentDate: string;
  amount: number;
  paymentMode: string;
  reference?: string;
  paidBy?: string;
  remarks?: string;
}

export function isDirectPo(po: Pick<PORecord, "linkedPR" | "linkedRFQ">): boolean {
  return !po.linkedPR?.trim() && !po.linkedRFQ?.trim();
}

export function poPaymentSummary(po: Pick<PORecord, "totalAmount" | "payments">) {
  const paid = (po.payments ?? []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const total = Number(po.totalAmount) || 0;
  const balance = Math.max(0, Math.round((total - paid) * 100) / 100);
  const status: POPaymentStatus = paid <= 0 ? "Unpaid" : balance <= 0.5 ? "Paid" : "Partially Paid";
  return { paid, total, balance, status };
}
