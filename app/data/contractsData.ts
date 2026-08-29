export interface ContractItem {
  id: string;
  itemOrService: string;
  category: string;
  agreedPrice: number;
  unit: string;
  maxQtyLimit: number;
}

export interface ContractRecord {
  id: string;
  contractNumber: string;
  vendorName: string;
  contractType: "Blanket Purchase Agreement" | "Annual Maintenance Contract" | "Service Agreement" | "Rate Agreement";
  startDate: string;
  endDate: string;
  status: "Active" | "Expiring Soon" | "Expired" | "Draft";
  contractValue: number;
  renewalNoticeDays: number;
  contactPerson: string;
  phone: string;
  email: string;
  taxId: string;
  priceEscalationClause: string;
  paymentTerms: string;
  penaltyTerms: string;
  maxCapValue: number;
  specialConditions: string;
  terminationNotice: string;
  warrantyTerms: string;
  approverName: string;
  approvalLevel: string;
  items: ContractItem[];
  attachments: { id: string; fileName: string; fileSize: string; fileType: string }[];
  activityTimeline: { stage: string; timestamp: string; note: string; author: string }[];
}
