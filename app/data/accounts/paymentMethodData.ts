export type PaymentMethodType =
  | "Cash"
  | "UPI"
  | "Credit Card"
  | "Debit Card"
  | "Bank Transfer"
  | "Cheque"
  | "Credit Account";

export interface PaymentMethodModel {
  paymentMethodId: string; // e.g. "PM-001" (Primary Key)
  paymentMethodCode: string; // e.g. "CASH" (uppercase, unique)
  paymentMethodName: string; // e.g. "Cash"
  methodType: PaymentMethodType;
  referenceRequired: boolean; // Guidance flag (true for UPI/Cards/Bank/Cheque; false for Cash)
  status: "Active" | "Inactive";
  description?: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  hasTransactions?: boolean;
  transactionCount?: number;
}

// Standard Hotel PMS V1 Default Seed Payment Methods (strictly 2 records)
export const samplePaymentMethodsList: PaymentMethodModel[] = [
  {
    paymentMethodId: "PM-001",
    paymentMethodCode: "CASH",
    paymentMethodName: "Cash",
    methodType: "Cash",
    referenceRequired: false,
    status: "Active",
    description: "Physical currency cash transactions at front desk and POS settlement points.",
    companyId: "comp-101",
    createdAt: "01 Apr 2024",
    updatedAt: "10 Jan 2025",
    createdBy: "Finance Admin",
    updatedBy: "Finance Admin",
    hasTransactions: true,
    transactionCount: 420,
  },
  {
    paymentMethodId: "PM-002",
    paymentMethodCode: "UPI",
    paymentMethodName: "UPI",
    methodType: "UPI",
    referenceRequired: true,
    status: "Active",
    description: "Unified Payments Interface digital payments with transaction reference ID.",
    companyId: "comp-101",
    createdAt: "01 Apr 2024",
    updatedAt: "12 Jan 2025",
    createdBy: "Finance Admin",
    updatedBy: "Finance Admin",
    hasTransactions: true,
    transactionCount: 315,
  },
];
