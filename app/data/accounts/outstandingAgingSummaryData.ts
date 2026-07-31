export interface PartyAgingSummaryItem {
  id: string;
  partyName: string;
  partyGroup: "SUNDRY CREDITORS" | "SUNDRY DEBTORS" | "CREDIT CARD COMPANY" | "CITY LEDGER" | "TRAVEL AGENTS";
  msmeType: "Micro" | "Small" | "Medium" | "Non-MSME";
  moduleType: "AR" | "AP";
  balanceAmt: number;
  balanceType: "D" | "C"; // D = Debit, C = Credit
  aging0to30: number;
  aging0to30Type?: "D" | "C";
  aging31to60: number;
  aging31to60Type?: "D" | "C";
  aging61to90: number;
  aging61to90Type?: "D" | "C";
  aging91to180: number;
  aging91to180Type?: "D" | "C";
  agingOver180: number;
  agingOver180Type?: "D" | "C";
  billsCount: number;
  contactPhone?: string;
  contactEmail?: string;
}

export const samplePartySummaryGroups = [
  "All Groups",
  "SUNDRY CREDITORS",
  "SUNDRY DEBTORS",
  "CREDIT CARD COMPANY",
  "CITY LEDGER",
  "TRAVEL AGENTS",
];

export const sampleMSMETypes = ["<All>", "Micro", "Small", "Medium", "Non-MSME"];

export const samplePartyAgingSummaryData: PartyAgingSummaryItem[] = [
  // SUNDRY CREDITORS
  {
    id: "pas-101",
    partyName: "AMAAN AGENCY",
    partyGroup: "SUNDRY CREDITORS",
    msmeType: "Micro",
    moduleType: "AP",
    balanceAmt: 19700,
    balanceType: "C",
    aging0to30: 19700,
    aging0to30Type: "C",
    aging31to60: 0,
    aging61to90: 0,
    aging91to180: 0,
    agingOver180: 0,
    billsCount: 2,
    contactPhone: "+91 98250 11200",
  },
  {
    id: "pas-102",
    partyName: "AMRUTAM FOOD PRODUCTS",
    partyGroup: "SUNDRY CREDITORS",
    msmeType: "Small",
    moduleType: "AP",
    balanceAmt: 21350,
    balanceType: "C",
    aging0to30: 0,
    aging31to60: 21350,
    aging31to60Type: "C",
    aging61to90: 0,
    aging91to180: 0,
    agingOver180: 0,
    billsCount: 3,
    contactPhone: "+91 99090 44210",
  },
  {
    id: "pas-103",
    partyName: "ASHOKA BATH WORLD",
    partyGroup: "SUNDRY CREDITORS",
    msmeType: "Small",
    moduleType: "AP",
    balanceAmt: 77965,
    balanceType: "C",
    aging0to30: 27661,
    aging0to30Type: "C",
    aging31to60: 50304,
    aging31to60Type: "C",
    aging61to90: 0,
    aging91to180: 0,
    agingOver180: 0,
    billsCount: 4,
    contactPhone: "+91 94261 88120",
  },
  {
    id: "pas-104",
    partyName: "ASHURAM-CARPENTER",
    partyGroup: "SUNDRY CREDITORS",
    msmeType: "Micro",
    moduleType: "AP",
    balanceAmt: 1097000,
    balanceType: "D",
    aging0to30: 997000,
    aging0to30Type: "D",
    aging31to60: 100000,
    aging31to60Type: "D",
    aging61to90: 0,
    aging91to180: 0,
    agingOver180: 0,
    billsCount: 5,
    contactPhone: "+91 98980 33400",
  },
  {
    id: "pas-105",
    partyName: "BHARUCH GAS SERVICE",
    partyGroup: "SUNDRY CREDITORS",
    msmeType: "Non-MSME",
    moduleType: "AP",
    balanceAmt: 144947,
    balanceType: "C",
    aging0to30: 144947,
    aging0to30Type: "C",
    aging31to60: 0,
    aging61to90: 0,
    aging91to180: 0,
    agingOver180: 0,
    billsCount: 1,
    contactPhone: "+91 2642 240112",
  },
  {
    id: "pas-106",
    partyName: "CASH PURCHASE",
    partyGroup: "SUNDRY CREDITORS",
    msmeType: "Non-MSME",
    moduleType: "AP",
    balanceAmt: 62400,
    balanceType: "D",
    aging0to30: 0,
    aging31to60: 0,
    aging61to90: 0,
    aging91to180: 0,
    agingOver180: 62400,
    agingOver180Type: "D",
    billsCount: 2,
  },
  {
    id: "pas-107",
    partyName: "COOLLINE AGENCY PVT.LTD.",
    partyGroup: "SUNDRY CREDITORS",
    msmeType: "Medium",
    moduleType: "AP",
    balanceAmt: 2664,
    balanceType: "D",
    aging0to30: 0,
    aging31to60: 0,
    aging61to90: 0,
    aging91to180: 601604,
    aging91to180Type: "D",
    agingOver180: 598940,
    agingOver180Type: "C",
    billsCount: 6,
  },
  {
    id: "pas-108",
    partyName: "DAKSHIN GUJARAT VIJ COMPANY LTD.",
    partyGroup: "SUNDRY CREDITORS",
    msmeType: "Non-MSME",
    moduleType: "AP",
    balanceAmt: 367.9,
    balanceType: "C",
    aging0to30: 0,
    aging31to60: 0,
    aging61to90: 0,
    aging91to180: 367.9,
    aging91to180Type: "C",
    agingOver180: 0,
    billsCount: 1,
  },

  // SUNDRY DEBTORS & CREDIT CARD COMPANY
  {
    id: "pas-201",
    partyName: "ONE 97 COMMUNICATION LIMITED (PAYTM)",
    partyGroup: "CREDIT CARD COMPANY",
    msmeType: "Non-MSME",
    moduleType: "AR",
    balanceAmt: 13597,
    balanceType: "D",
    aging0to30: 13597,
    aging0to30Type: "D",
    aging31to60: 0,
    aging61to90: 0,
    aging91to180: 0,
    agingOver180: 0,
    billsCount: 1,
    contactEmail: "settlements@paytm.com",
  },
  {
    id: "pas-202",
    partyName: "MAKEMYTRIP INDIA PVT LTD",
    partyGroup: "TRAVEL AGENTS",
    msmeType: "Non-MSME",
    moduleType: "AR",
    balanceAmt: 145000,
    balanceType: "D",
    aging0to30: 145000,
    aging0to30Type: "D",
    aging31to60: 0,
    aging61to90: 0,
    aging91to180: 0,
    agingOver180: 0,
    billsCount: 3,
  },
  {
    id: "pas-203",
    partyName: "AGODA CORPORATE SERVICES",
    partyGroup: "TRAVEL AGENTS",
    msmeType: "Non-MSME",
    moduleType: "AR",
    balanceAmt: 220000,
    balanceType: "D",
    aging0to30: 0,
    aging31to60: 0,
    aging61to90: 220000,
    aging61to90Type: "D",
    aging91to180: 0,
    agingOver180: 0,
    billsCount: 4,
  },
];
