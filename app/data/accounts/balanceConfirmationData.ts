export interface BalanceConfirmationPartyItem {
  id: string;
  partyId: string;
  partyName: string;
  partyGroup: "Sundry Debtors" | "City Ledger" | "Corporate Debtors" | "Travel Agents" | "Sundry Creditors";
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  openingBalance: number;
  totalDebits: number;
  totalCredits: number;
  closingBalance: number;
  balanceType: "D" | "C";
  selected: boolean;
}

export const sampleBalanceConfirmationData: BalanceConfirmationPartyItem[] = [
  {
    id: "bc-101",
    partyId: "P-10024",
    partyName: "MakeMyTrip India Pvt Ltd",
    partyGroup: "Travel Agents",
    contactPerson: "Mr. Rakesh Sharma",
    contactEmail: "accounts@makemytrip.com",
    contactPhone: "+91 98250 11200",
    address: "14th Floor, DLF Building 10, Tower B, DLF Cyber City, Gurugram, Haryana 122002",
    openingBalance: 0,
    totalDebits: 145000,
    totalCredits: 0,
    closingBalance: 145000,
    balanceType: "D",
    selected: true,
  },
  {
    id: "bc-102",
    partyId: "P-10041",
    partyName: "Agoda Corporate Services",
    partyGroup: "Corporate Debtors",
    contactPerson: "Ms. Priyanka Mehta",
    contactEmail: "billing@agoda.com",
    contactPhone: "+91 99090 44210",
    address: "Unit 302, Worldmark 1, Asset 11, Aerocity, New Delhi 110037",
    openingBalance: 50000,
    totalDebits: 220000,
    totalCredits: 50000,
    closingBalance: 220000,
    balanceType: "D",
    selected: true,
  },
  {
    id: "bc-103",
    partyId: "P-10088",
    partyName: "Reliance Retail Corp Ltd",
    partyGroup: "Sundry Debtors",
    contactPerson: "Mr. Suresh Patel",
    contactEmail: "finance.hotel@reliance.com",
    contactPhone: "+91 94261 88120",
    address: "Reliance Corporate Park, Thane-Belapur Road, Ghansoli, Navi Mumbai 400701",
    openingBalance: 0,
    totalDebits: 340000,
    totalCredits: 0,
    closingBalance: 340000,
    balanceType: "D",
    selected: false,
  },
  {
    id: "bc-104",
    partyId: "P-10102",
    partyName: "ONE 97 COMMUNICATION LIMITED (PAYTM)",
    partyGroup: "City Ledger",
    contactPerson: "Accounts Department",
    contactEmail: "settlements@paytm.com",
    contactPhone: "+91 120 4770770",
    address: "One97 Communications Ltd, VJ Business Tower, Sector 132, Noida UP 201304",
    openingBalance: 0,
    totalDebits: 13597,
    totalCredits: 0,
    closingBalance: 13597,
    balanceType: "D",
    selected: false,
  },
  {
    id: "bc-105",
    partyId: "P-20011",
    partyName: "AMAAN AGENCY",
    partyGroup: "Sundry Creditors",
    contactPerson: "Mr. Amaan Shaikh",
    contactEmail: "amaan.agency@gmail.com",
    contactPhone: "+91 98250 44100",
    address: "Shop 12, APMC Market, Station Road, Bharuch, Gujarat 392001",
    openingBalance: 0,
    totalDebits: 50000,
    totalCredits: 85000,
    closingBalance: 35000,
    balanceType: "C",
    selected: false,
  },
];
