export interface PartyBillsSettlementItem {
  id: string;
  trnType: "Sales" | "Purchase" | "Receipts" | "Payments" | "Journal" | "Contra";
  trnNo: string;
  trnDt: string;
  refTy: "Bill" | "Invoice" | "Advance" | "Credit Note";
  refName: string;
  docNo: string;
  docDt: string;
  refDt: string; // Due date / Ref date
  partyName: string;
  partyGroup: "SUNDRY DEBTORS" | "SUNDRY CREDITORS" | "CREDIT CARD COMPANY" | "TRAVEL AGENT";
  moduleType: "AR" | "AP";
  details: string;
  debitAmt: number;
  creditAmt: number;
  outstandingAmt: number;
  settlementStatus: "Full" | "Partial" | "Unsettled";
}

export const samplePartySettlementGroups = [
  "All Groups",
  "CREDIT CARD COMPANY",
  "SUNDRY CREDITORS",
  "SUNDRY DEBTORS",
  "TRAVEL AGENT",
];

export const sampleTrnTypesList = [
  "<All>",
  "Journal",
  "Payments",
  "Receipts",
  "Sales",
  "Purchase",
  "Contra",
];

export const samplePartyNamesList = [
  "METSO INDIA PRIVATE LIMITED - VADODARA",
  "MAKEMYTRIP INDIA PVT LTD",
  "AMAAN AGENCY",
  "AMRUTAM FOOD PRODUCTS",
  "ASHOKA BATH WORLD",
  "ASHURAM-CARPENTER",
  "BHARUCH GAS SERVICE",
  "ONE 97 COMMUNICATION LIMITED (PAYTM)",
  "AGODA CORPORATE SERVICES",
  "MASTRO CARD",
  "MATEX NET PRIVATE LIMITED",
];

export const samplePartyBillsSettlementData: PartyBillsSettlementItem[] = [
  {
    id: "pbs-101",
    trnType: "Sales",
    trnNo: "SL-2026-0811",
    trnDt: "10/07/2026",
    refTy: "Invoice",
    refName: "INV-2026-0812",
    docNo: "DOC-8812",
    docDt: "10/07/2026",
    refDt: "10/08/2026",
    partyName: "METSO INDIA PRIVATE LIMITED - VADODARA",
    partyGroup: "SUNDRY DEBTORS",
    moduleType: "AR",
    details: "Corporate executive room charges & banquet bill #8812",
    debitAmt: 150000,
    creditAmt: 0,
    outstandingAmt: 100000,
    settlementStatus: "Partial",
  },
  {
    id: "pbs-102",
    trnType: "Receipts",
    trnNo: "RCT-2026-0608",
    trnDt: "20/07/2026",
    refTy: "Bill",
    refName: "INV-2026-0812",
    docNo: "NEFT-99120",
    docDt: "20/07/2026",
    refDt: "20/07/2026",
    partyName: "METSO INDIA PRIVATE LIMITED - VADODARA",
    partyGroup: "SUNDRY DEBTORS",
    moduleType: "AR",
    details: "Partial advance settlement via HDFC Bank NEFT #99120",
    debitAmt: 0,
    creditAmt: 50000,
    outstandingAmt: 100000,
    settlementStatus: "Partial",
  },
  {
    id: "pbs-103",
    trnType: "Sales",
    trnNo: "SL-2026-0902",
    trnDt: "18/07/2026",
    refTy: "Invoice",
    refName: "INV-2026-0902",
    docNo: "DOC-9902",
    docDt: "18/07/2026",
    refDt: "18/08/2026",
    partyName: "MAKEMYTRIP INDIA PVT LTD",
    partyGroup: "TRAVEL AGENT",
    moduleType: "AR",
    details: "Online room inventory booking commission settlement bill",
    debitAmt: 145000,
    creditAmt: 0,
    outstandingAmt: 145000,
    settlementStatus: "Unsettled",
  },
  {
    id: "pbs-104",
    trnType: "Purchase",
    trnNo: "PUR-2026-0112",
    trnDt: "05/07/2026",
    refTy: "Bill",
    refName: "BILL-2026-0044",
    docNo: "SUP-0044",
    docDt: "05/07/2026",
    refDt: "05/08/2026",
    partyName: "AMAAN AGENCY",
    partyGroup: "SUNDRY CREDITORS",
    moduleType: "AP",
    details: "Kitchen dairy & fresh groceries supplier monthly invoice",
    debitAmt: 0,
    creditAmt: 85000,
    outstandingAmt: 35000,
    settlementStatus: "Partial",
  },
  {
    id: "pbs-105",
    trnType: "Payments",
    trnNo: "PYM-2026-0301",
    trnDt: "15/07/2026",
    refTy: "Bill",
    refName: "BILL-2026-0044",
    docNo: "CHQ-44012",
    docDt: "15/07/2026",
    refDt: "15/07/2026",
    partyName: "AMAAN AGENCY",
    partyGroup: "SUNDRY CREDITORS",
    moduleType: "AP",
    details: "Cheque payment issued via ICICI Bank Chq #44012",
    debitAmt: 50000,
    creditAmt: 0,
    outstandingAmt: 35000,
    settlementStatus: "Partial",
  },
  {
    id: "pbs-106",
    trnType: "Journal",
    trnNo: "JRN-2026-0055",
    trnDt: "22/07/2026",
    refTy: "Credit Note",
    refName: "CN-2026-0012",
    docNo: "CN-0012",
    docDt: "22/07/2026",
    refDt: "22/07/2026",
    partyName: "AMRUTAM FOOD PRODUCTS",
    partyGroup: "SUNDRY CREDITORS",
    moduleType: "AP",
    details: "Quality rebate adjustment credit note posted to supplier",
    debitAmt: 12000,
    creditAmt: 0,
    outstandingAmt: 21350,
    settlementStatus: "Partial",
  },
  {
    id: "pbs-107",
    trnType: "Receipts",
    trnNo: "RCT-2026-0711",
    trnDt: "24/07/2026",
    refTy: "Advance",
    refName: "ADV-2026-0099",
    docNo: "EDC-7719",
    docDt: "24/07/2026",
    refDt: "24/07/2026",
    partyName: "ONE 97 COMMUNICATION LIMITED (PAYTM)",
    partyGroup: "CREDIT CARD COMPANY",
    moduleType: "AR",
    details: "Paytm EDC gateway transaction settlement in transit",
    debitAmt: 13597,
    creditAmt: 0,
    outstandingAmt: 13597,
    settlementStatus: "Unsettled",
  },
];
