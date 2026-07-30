export interface BillCoveringItem {
  id: string;
  vouchNo: string;
  vouchDt: string;
  refName: string;
  partyName: string;
  partyGroup: "SUNDRY DEBTORS" | "CITY LEDGER" | "CORPORATE DEBTORS" | "TRAVEL AGENT";
  partyAddress: string;
  contactPerson: string;
  contactPhone: string;
  details: string;
  amount: number;
  selected: boolean;
}

export const sampleCoveringGroups = [
  "All Groups",
  "SUNDRY DEBTORS",
  "CITY LEDGER",
  "CORPORATE DEBTORS",
  "TRAVEL AGENT",
];

export const sampleCoveringLetterData: BillCoveringItem[] = [
  {
    id: "bcl-101",
    vouchNo: "INV-2026-0812",
    vouchDt: "10/07/2026",
    refName: "INV-2026-0812",
    partyName: "METSO INDIA PRIVATE LIMITED - VADODARA",
    partyGroup: "SUNDRY DEBTORS",
    partyAddress: "Plot 14, GIDC Industrial Estate, Makarpura, Vadodara, Gujarat 390010",
    contactPerson: "Mr. Jayesh Patel",
    contactPhone: "+91 98250 11900",
    details: "Corporate Executive Suites Accommodation & Banquet Conference Bill",
    amount: 150000,
    selected: true,
  },
  {
    id: "bcl-102",
    vouchNo: "INV-2026-0902",
    vouchDt: "18/07/2026",
    refName: "INV-2026-0902",
    partyName: "MAKEMYTRIP INDIA PVT LTD",
    partyGroup: "TRAVEL AGENT",
    partyAddress: "14th Floor, DLF Building 10, Tower B, DLF Cyber City, Gurugram 122002",
    contactPerson: "Mr. Rakesh Sharma",
    contactPhone: "+91 98250 11200",
    details: "Online Travel Agency (OTA) Room Inventory Commission Settlement",
    amount: 145000,
    selected: true,
  },
  {
    id: "bcl-103",
    vouchNo: "INV-2026-0410",
    vouchDt: "10/05/2026",
    refName: "INV-2026-0410",
    partyName: "AGODA CORPORATE SERVICES",
    partyGroup: "CORPORATE DEBTORS",
    partyAddress: "Unit 302, Worldmark 1, Asset 11, Aerocity, New Delhi 110037",
    contactPerson: "Ms. Priyanka Mehta",
    contactPhone: "+91 99090 44210",
    details: "Executive Corporate Long-Stay Accommodation Invoice",
    amount: 220000,
    selected: false,
  },
  {
    id: "bcl-104",
    vouchNo: "INV-2026-0711",
    vouchDt: "18/07/2026",
    refName: "INV-2026-0711",
    partyName: "ONE 97 COMMUNICATION LIMITED (PAYTM)",
    partyGroup: "CITY LEDGER",
    partyAddress: "One97 Communications Ltd, VJ Business Tower, Sector 132, Noida UP 201304",
    contactPerson: "Accounts Department",
    contactPhone: "+91 120 4770770",
    details: "Paytm POS EDC Card Terminal Gateway Settlement Invoice",
    amount: 13597,
    selected: false,
  },
];
