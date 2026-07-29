export interface ProvisionalTransaction {
  id: string;
  vouchNo: string;
  vouchDt: string;
  expiryDt: string;
  category: "Accrued Expenses" | "Unbilled Revenue" | "Provision for Utilities" | "Vendor Provision" | "Tax Provision";
  vouchType: "Provisional Journal" | "Provisional Receipt" | "Provisional Payment" | "Provisional Purchase";
  accountLedger: string;
  partyName: string;
  drAmt: number;
  crAmt: number;
  narration: string;
  status: "Provisional" | "Converted to GL" | "Reversed";
}

export const sampleProvisionalCategories = [
  "Accrued Expenses",
  "Unbilled Revenue",
  "Provision for Utilities",
  "Vendor Provision",
  "Tax Provision",
];

export const sampleProvisionalVoucherTypes = [
  "Provisional Journal",
  "Provisional Receipt",
  "Provisional Payment",
  "Provisional Purchase",
];

// Exactly 9 clean, realistic Provisional Transaction records
export const sampleProvisionalData: ProvisionalTransaction[] = [
  {
    id: "prv-001",
    vouchNo: "PRV-2026-0012",
    vouchDt: "28/04/2026",
    expiryDt: "05/05/2026",
    category: "Provision for Utilities",
    vouchType: "Provisional Journal",
    accountLedger: "HEAT LIGHT POWER",
    partyName: "State Electricity Distribution Board",
    drAmt: 45000,
    crAmt: 0,
    narration: "Provision for April month estimated power utility bill prior to invoice arrival",
    status: "Provisional",
  },
  {
    id: "prv-002",
    vouchNo: "PRV-2026-0013",
    vouchDt: "28/04/2026",
    expiryDt: "02/05/2026",
    category: "Unbilled Revenue",
    vouchType: "Provisional Receipt",
    accountLedger: "Room Sales Revenue",
    partyName: "Corporate Guest Folio #1094 - Infosys Ltd",
    drAmt: 0,
    crAmt: 32000,
    narration: "Provisional room revenue recognition for unbilled corporate check-out",
    status: "Provisional",
  },
  {
    id: "prv-003",
    vouchNo: "PRV-2026-0014",
    vouchDt: "27/04/2026",
    expiryDt: "10/05/2026",
    category: "Accrued Expenses",
    vouchType: "Provisional Journal",
    accountLedger: "ADMIN & GENERAL EXPENSES",
    partyName: "Mehta & Associates Statutory Auditors",
    drAmt: 25000,
    crAmt: 0,
    narration: "Accrued provision for quarterly internal audit fee",
    status: "Provisional",
  },
  {
    id: "prv-004",
    vouchNo: "PRV-2026-0015",
    vouchDt: "26/04/2026",
    expiryDt: "03/05/2026",
    category: "Vendor Provision",
    vouchType: "Provisional Purchase",
    accountLedger: "Food Revenue",
    partyName: "Fresh Foods Supplies Ltd",
    drAmt: 18000,
    crAmt: 0,
    narration: "Estimated fresh food supply delivery provision pending final bill invoice",
    status: "Provisional",
  },
  {
    id: "prv-005",
    vouchNo: "PRV-2026-0016",
    vouchDt: "25/04/2026",
    expiryDt: "01/05/2026",
    category: "Tax Provision",
    vouchType: "Provisional Journal",
    accountLedger: "DUTIES AND TAXES",
    partyName: "GST Payable Account",
    drAmt: 22000,
    crAmt: 0,
    narration: "Provisional monthly GST liability accrual posting",
    status: "Provisional",
  },
  {
    id: "prv-006",
    vouchNo: "PRV-2026-0008",
    vouchDt: "15/04/2026",
    expiryDt: "20/04/2026",
    category: "Vendor Provision",
    vouchType: "Provisional Purchase",
    accountLedger: "CleanLinen Laundry Co.",
    partyName: "CleanLinen Laundry Co.",
    drAmt: 15000,
    crAmt: 0,
    narration: "Laundry service provision converted to permanent GL voucher #PUR-2026-089",
    status: "Converted to GL",
  },
  {
    id: "prv-007",
    vouchNo: "PRV-2026-0009",
    vouchDt: "12/04/2026",
    expiryDt: "18/04/2026",
    category: "Accrued Expenses",
    vouchType: "Provisional Journal",
    accountLedger: "REPAIR & MAINT. EXPENSES",
    partyName: "HVAC Elevator Services",
    drAmt: 14000,
    crAmt: 0,
    narration: "Elevator maintenance provision converted to permanent GL voucher",
    status: "Converted to GL",
  },
  {
    id: "prv-008",
    vouchNo: "PRV-2026-0005",
    vouchDt: "05/04/2026",
    expiryDt: "10/04/2026",
    category: "Unbilled Revenue",
    vouchType: "Provisional Receipt",
    accountLedger: "Banquet Event Advance",
    partyName: "TCS Annual Meet Event",
    drAmt: 0,
    crAmt: 15000,
    narration: "Provisional banquet hall advance reversed on receipt of direct bank deposit",
    status: "Reversed",
  },
  {
    id: "prv-009",
    vouchNo: "PRV-2026-0006",
    vouchDt: "02/04/2026",
    expiryDt: "08/04/2026",
    category: "Provision for Utilities",
    vouchType: "Provisional Journal",
    accountLedger: "HEAT LIGHT POWER",
    partyName: "City Water Works Board",
    drAmt: 8500,
    crAmt: 0,
    narration: "Water utility provision converted to permanent GL voucher",
    status: "Converted to GL",
  },
];
