export interface PendingBillDetail {
  vouchNo: string;
  vouchDt: string;
  dueDate: string;
  overdueDays: number;
  billAmt: number;
  balanceAmt: number;
}

export interface ReminderLetterPartyItem {
  id: string;
  partyId: string;
  partyName: string;
  partyGroup: "Sundry Debtors" | "City Ledger" | "Corporate Debtors" | "Travel Agents" | "Sundry Creditors";
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  totalAgeingAmt: number;
  selected: boolean;
  pendingBills: PendingBillDetail[];
}

export const sampleReminderLetterData: ReminderLetterPartyItem[] = [
  {
    id: "rl-101",
    partyId: "P-10024",
    partyName: "MakeMyTrip India Pvt Ltd",
    partyGroup: "Travel Agents",
    contactPerson: "Mr. Rakesh Sharma",
    contactEmail: "accounts@makemytrip.com",
    contactPhone: "+91 98250 11200",
    address: "14th Floor, DLF Building 10, Tower B, DLF Cyber City, Gurugram, Haryana 122002",
    totalAgeingAmt: 145000,
    selected: true,
    pendingBills: [
      {
        vouchNo: "INV-2026-0812",
        vouchDt: "24/06/2026",
        dueDate: "24/07/2026",
        overdueDays: 15,
        billAmt: 145000,
        balanceAmt: 145000,
      },
    ],
  },
  {
    id: "rl-102",
    partyId: "P-10041",
    partyName: "Agoda Corporate Services",
    partyGroup: "Corporate Debtors",
    contactPerson: "Ms. Priyanka Mehta",
    contactEmail: "billing@agoda.com",
    contactPhone: "+91 99090 44210",
    address: "Unit 302, Worldmark 1, Asset 11, Aerocity, New Delhi 110037",
    totalAgeingAmt: 220000,
    selected: true,
    pendingBills: [
      {
        vouchNo: "INV-2026-0410",
        vouchDt: "10/05/2026",
        dueDate: "10/06/2026",
        overdueDays: 59,
        billAmt: 220000,
        balanceAmt: 220000,
      },
    ],
  },
  {
    id: "rl-103",
    partyId: "P-10088",
    partyName: "Reliance Retail Corp Ltd",
    partyGroup: "Sundry Debtors",
    contactPerson: "Mr. Suresh Patel",
    contactEmail: "finance.hotel@reliance.com",
    contactPhone: "+91 94261 88120",
    address: "Reliance Corporate Park, Thane-Belapur Road, Ghansoli, Navi Mumbai 400701",
    totalAgeingAmt: 340000,
    selected: false,
    pendingBills: [
      {
        vouchNo: "INV-2025-9912",
        vouchDt: "15/12/2025",
        dueDate: "15/01/2026",
        overdueDays: 205,
        billAmt: 340000,
        balanceAmt: 340000,
      },
    ],
  },
  {
    id: "rl-104",
    partyId: "P-10102",
    partyName: "ONE 97 COMMUNICATION LIMITED (PAYTM)",
    partyGroup: "City Ledger",
    contactPerson: "Accounts Department",
    contactEmail: "settlements@paytm.com",
    contactPhone: "+91 120 4770770",
    address: "One97 Communications Ltd, VJ Business Tower, Sector 132, Noida UP 201304",
    totalAgeingAmt: 13597,
    selected: false,
    pendingBills: [
      {
        vouchNo: "INV-2026-0711",
        vouchDt: "18/07/2026",
        dueDate: "18/08/2026",
        overdueDays: 0,
        billAmt: 13597,
        balanceAmt: 13597,
      },
    ],
  },
];
