import { DEPARTMENT_OPTIONS } from "./purchaseStoresMastersData";

export type IssueStatus = "Draft" | "Pending Approval" | "Issued" | "Partially Issued" | "Cancelled";

export interface StockIssueLineItem {
  id: string;
  itemCode: string;
  itemName: string;
  unit: string;
  requestedQty: number;
  issuedQty: number;
  availableStock: number;
  unitCost: number;
}

export interface StockIssueRecord {
  id: string;
  issueNo: string;
  issueDate: string;
  department: string;
  warehouse: string;
  store: string;
  requestedBy: string;
  issuedBy?: string;
  approvedBy?: string;
  status: IssueStatus;
  purpose: string;
  lineItems: StockIssueLineItem[];
  totalValue: number;
  remarks?: string;
}

export const ISSUE_DEPARTMENT_OPTIONS = [...DEPARTMENT_OPTIONS];
