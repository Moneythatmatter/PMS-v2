export interface CoveringLetterVoucherItem {
  id: string;
  trnNo: string;
  trnDt: string;
  partyName: string;
  partyGroup: "SUNDRY DEBTORS" | "CITY LEDGER" | "CORPORATE DEBTORS" | "TRAVEL AGENT";
  billsCount: number;
  totalAmount: number;
  status: "Active" | "Reversed";
  preparedBy: string;
  selected: boolean;
}

export const sampleCoveringReversalData: CoveringLetterVoucherItem[] = [
  {
    id: "bclr-101",
    trnNo: "BCL-2026-0041",
    trnDt: "24/07/2026",
    partyName: "METSO INDIA PRIVATE LIMITED - VADODARA",
    partyGroup: "SUNDRY DEBTORS",
    billsCount: 2,
    totalAmount: 295000,
    status: "Active",
    preparedBy: "Accounts Exec (Jay)",
    selected: true,
  },
  {
    id: "bclr-102",
    trnNo: "BCL-2026-0038",
    trnDt: "15/07/2026",
    partyName: "MAKEMYTRIP INDIA PVT LTD",
    partyGroup: "TRAVEL AGENT",
    billsCount: 1,
    totalAmount: 145000,
    status: "Active",
    preparedBy: "Senior Accountant",
    selected: false,
  },
  {
    id: "bclr-103",
    trnNo: "BCL-2026-0030",
    trnDt: "10/06/2026",
    partyName: "AGODA CORPORATE SERVICES",
    partyGroup: "CORPORATE DEBTORS",
    billsCount: 3,
    totalAmount: 220000,
    status: "Active",
    preparedBy: "Accounts Exec (Jay)",
    selected: false,
  },
];
