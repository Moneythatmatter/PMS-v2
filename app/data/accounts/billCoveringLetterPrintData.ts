export interface CoveringLetterPrintDetailItem {
  vouchNo: string;
  vouchDt: string;
  refName: string;
  details: string;
  amount: number;
}

export interface CoveringLetterPrintVoucher {
  id: string;
  trnNo: string;
  trnDt: string;
  partyName: string;
  partyGroup: "SUNDRY DEBTORS" | "CITY LEDGER" | "CORPORATE DEBTORS" | "TRAVEL AGENT";
  partyAddress: string;
  contactPerson: string;
  contactPhone: string;
  billsCount: number;
  totalAmount: number;
  preparedBy: string;
  selected: boolean;
  enclosedBills: CoveringLetterPrintDetailItem[];
}

export const sampleCoveringPrintGroups = [
  "All Groups",
  "SUNDRY DEBTORS",
  "CITY LEDGER",
  "CORPORATE DEBTORS",
  "TRAVEL AGENT",
];

export const sampleCoveringPrintData: CoveringLetterPrintVoucher[] = [
  {
    id: "bclp-101",
    trnNo: "BCL-2026-0041",
    trnDt: "24/07/2026",
    partyName: "METSO INDIA PRIVATE LIMITED - VADODARA",
    partyGroup: "SUNDRY DEBTORS",
    partyAddress: "Plot 14, GIDC Industrial Estate, Makarpura, Vadodara, Gujarat 390010",
    contactPerson: "Mr. Jayesh Patel",
    contactPhone: "+91 98250 11900",
    billsCount: 2,
    totalAmount: 295000,
    preparedBy: "Accounts Exec (Jay)",
    selected: true,
    enclosedBills: [
      {
        vouchNo: "INV-2026-0812",
        vouchDt: "10/07/2026",
        refName: "INV-2026-0812",
        details: "Corporate Executive Suites Accommodation & Conference Bill",
        amount: 150000,
      },
      {
        vouchNo: "INV-2026-0815",
        vouchDt: "14/07/2026",
        refName: "INV-2026-0815",
        details: "Executive Boardroom Catering & Guest Settlement",
        amount: 145000,
      },
    ],
  },
  {
    id: "bclp-102",
    trnNo: "BCL-2026-0038",
    trnDt: "15/07/2026",
    partyName: "MAKEMYTRIP INDIA PVT LTD",
    partyGroup: "TRAVEL AGENT",
    partyAddress: "14th Floor, DLF Building 10, Tower B, DLF Cyber City, Gurugram 122002",
    contactPerson: "Mr. Rakesh Sharma",
    contactPhone: "+91 98250 11200",
    billsCount: 1,
    totalAmount: 145000,
    preparedBy: "Senior Accountant",
    selected: true,
    enclosedBills: [
      {
        vouchNo: "INV-2026-0902",
        vouchDt: "18/07/2026",
        refName: "INV-2026-0902",
        details: "Online Travel Agency (OTA) Room Inventory Commission Settlement",
        amount: 145000,
      },
    ],
  },
  {
    id: "bclp-103",
    trnNo: "BCL-2026-0030",
    trnDt: "10/06/2026",
    partyName: "AGODA CORPORATE SERVICES",
    partyGroup: "CORPORATE DEBTORS",
    partyAddress: "Unit 302, Worldmark 1, Asset 11, Aerocity, New Delhi 110037",
    contactPerson: "Ms. Priyanka Mehta",
    contactPhone: "+91 99090 44210",
    billsCount: 1,
    totalAmount: 220000,
    preparedBy: "Accounts Exec (Jay)",
    selected: false,
    enclosedBills: [
      {
        vouchNo: "INV-2026-0410",
        vouchDt: "10/05/2026",
        refName: "INV-2026-0410",
        details: "Executive Corporate Long-Stay Accommodation Invoice",
        amount: 220000,
      },
    ],
  },
  {
    id: "bclp-104",
    trnNo: "BCL-2026-0022",
    trnDt: "01/06/2026",
    partyName: "ONE 97 COMMUNICATION LIMITED (PAYTM)",
    partyGroup: "CITY LEDGER",
    partyAddress: "One97 Communications Ltd, VJ Business Tower, Sector 132, Noida UP 201304",
    contactPerson: "Accounts Department",
    contactPhone: "+91 120 4770770",
    billsCount: 1,
    totalAmount: 13597,
    preparedBy: "Accounts Exec (Jay)",
    selected: false,
    enclosedBills: [
      {
        vouchNo: "INV-2026-0711",
        vouchDt: "18/07/2026",
        refName: "INV-2026-0711",
        details: "Paytm POS EDC Card Terminal Gateway Settlement Invoice",
        amount: 13597,
      },
    ],
  },
];
