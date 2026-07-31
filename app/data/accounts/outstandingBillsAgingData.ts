export interface OutstandingBillItem {
  id: string;
  vouchNo: string;
  vouchDt: string;
  refType: "Invoice" | "Bill" | "Advance" | "Credit Note";
  refName: string;
  partyGroup: "Sundry Debtors" | "Sundry Creditors" | "City Ledger" | "Travel Agents" | "Corporate Debtors";
  msmeType: "Micro" | "Small" | "Medium" | "Non-MSME";
  moduleType: "AR" | "AP";
  dueDate: string;
  balanceAmt: number;
  aging0to30: number;
  aging31to60: number;
  aging61to90: number;
  aging91to180: number;
  agingOver180: number;
  dueDays: number;
  remarks?: string;
}

export const samplePartyGroups = [
  "All Groups",
  "Sundry Debtors",
  "Sundry Creditors",
  "City Ledger",
  "Travel Agents",
  "Corporate Debtors",
];

export const sampleMSMETypes = ["<All>", "Micro", "Small", "Medium", "Non-MSME"];

export const sampleOutstandingBillsData: OutstandingBillItem[] = [
  {
    id: "ob-101",
    vouchNo: "INV-2026-0812",
    vouchDt: "24/07/2026",
    refType: "Invoice",
    refName: "MakeMyTrip India Pvt Ltd",
    partyGroup: "Travel Agents",
    msmeType: "Non-MSME",
    moduleType: "AR",
    dueDate: "23/08/2026",
    balanceAmt: 145000,
    aging0to30: 145000,
    aging31to60: 0,
    aging61to90: 0,
    aging91to180: 0,
    agingOver180: 0,
    dueDays: 0,
    remarks: "Corporate room inventory settlement due in August",
  },
  {
    id: "ob-102",
    vouchNo: "BILL-2026-0044",
    vouchDt: "15/06/2026",
    refType: "Bill",
    refName: "Fresh Foods Supplies Ltd",
    partyGroup: "Sundry Creditors",
    msmeType: "Small",
    moduleType: "AP",
    dueDate: "15/07/2026",
    balanceAmt: 85000,
    aging0to30: 0,
    aging31to60: 85000,
    aging61to90: 0,
    aging91to180: 0,
    agingOver180: 0,
    dueDays: 9,
    remarks: "Weekly dairy and vegetable supply bill overdue 9 days",
  },
  {
    id: "ob-103",
    vouchNo: "INV-2026-0410",
    vouchDt: "10/05/2026",
    refType: "Invoice",
    refName: "Agoda Corporate Services",
    partyGroup: "Corporate Debtors",
    msmeType: "Non-MSME",
    moduleType: "AR",
    dueDate: "10/06/2026",
    balanceAmt: 220000,
    aging0to30: 0,
    aging31to60: 0,
    aging61to90: 220000,
    aging91to180: 0,
    agingOver180: 0,
    dueDays: 44,
    remarks: "Banquet event corporate billing overdue 44 days",
  },
  {
    id: "ob-104",
    vouchNo: "BILL-2026-0102",
    vouchDt: "02/03/2026",
    refType: "Bill",
    refName: "State Electricity Board Ltd",
    partyGroup: "Sundry Creditors",
    msmeType: "Non-MSME",
    moduleType: "AP",
    dueDate: "02/04/2026",
    balanceAmt: 185000,
    aging0to30: 0,
    aging31to60: 0,
    aging61to90: 0,
    aging91to180: 185000,
    agingOver180: 0,
    dueDays: 113,
    remarks: "Utility bill accrual under audit review",
  },
  {
    id: "ob-105",
    vouchNo: "INV-2025-9912",
    vouchDt: "15/12/2025",
    refType: "Invoice",
    refName: "Reliance Retail Corp Ltd",
    partyGroup: "Sundry Debtors",
    msmeType: "Medium",
    moduleType: "AR",
    dueDate: "15/01/2026",
    balanceAmt: 340000,
    aging0to30: 0,
    aging31to60: 0,
    aging61to90: 0,
    aging91to180: 0,
    agingOver180: 340000,
    dueDays: 190,
    remarks: "Long outstanding corporate event ledger bill",
  },
  {
    id: "ob-106",
    vouchNo: "BILL-2026-0290",
    vouchDt: "05/07/2026",
    refType: "Bill",
    refName: "Apex Linen & Laundry Services",
    partyGroup: "Sundry Creditors",
    msmeType: "Micro",
    moduleType: "AP",
    dueDate: "05/08/2026",
    balanceAmt: 62000,
    aging0to30: 62000,
    aging31to60: 0,
    aging61to90: 0,
    aging91to180: 0,
    agingOver180: 0,
    dueDays: 0,
    remarks: "Housekeeping laundry contract bill for July",
  },
  {
    id: "ob-107",
    vouchNo: "INV-2026-0711",
    vouchDt: "18/07/2026",
    refType: "Invoice",
    refName: "ONE 97 COMMUNICATION LIMITED",
    partyGroup: "City Ledger",
    msmeType: "Non-MSME",
    moduleType: "AR",
    dueDate: "18/08/2026",
    balanceAmt: 13597,
    aging0to30: 13597,
    aging31to60: 0,
    aging61to90: 0,
    aging91to180: 0,
    agingOver180: 0,
    dueDays: 0,
    remarks: "Paytm EDC gateway transaction settlement in transit",
  },
];
