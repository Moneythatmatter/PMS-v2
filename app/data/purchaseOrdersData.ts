export interface POLineItem {
  id: string;
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
}
