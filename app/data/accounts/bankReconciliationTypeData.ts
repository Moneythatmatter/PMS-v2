export interface BankReconciliationTypeRecord {
  id: string;
  typeCode: string;
  typeName: string;
  category: "Cheque" | "Electronic / UTR" | "Credit Card Merchant" | "Bank Adjustment";
  seqNo: number;
  activeStatus: boolean;
  matchingRule: "Match by Cheque / Ref Number" | "Match by UTR Number" | "Match by Amount & Date";
  clearingPeriodDays: number;
  autoClearExactMatches: boolean;
  allowPartialClearing: boolean;
  bankChargeLedger: string;
  interestIncomeLedger: string;
  merchantDiscountPct: number;
  autoPostFeeJournal: boolean;
  requireStatementAttachment: boolean;
  requireSeniorSignOff: boolean;
  signBy: string;
  updatedBy: string;
  updatedDate: string;
}

export const sampleBankReconciliationTypesData: BankReconciliationTypeRecord[] = [
  {
    id: "brt-chq-iss",
    typeCode: "CHQ_ISS",
    typeName: "Cheque Issued (Outward Payments)",
    category: "Cheque",
    seqNo: 1,
    activeStatus: true,
    matchingRule: "Match by Cheque / Ref Number",
    clearingPeriodDays: 3,
    autoClearExactMatches: true,
    allowPartialClearing: false,
    bankChargeLedger: "5200 - Bank Charges & Service Fees A/c",
    interestIncomeLedger: "4300 - Bank Interest Income A/c",
    merchantDiscountPct: 0.0,
    autoPostFeeJournal: false,
    requireStatementAttachment: true,
    requireSeniorSignOff: false,
    signBy: "Accounts Officer",
    updatedBy: "Jay Admin",
    updatedDate: "01/08/2026 15:30",
  },
  {
    id: "brt-chq-dep",
    typeCode: "CHQ_DEP",
    typeName: "Cheque Received / Deposited",
    category: "Cheque",
    seqNo: 2,
    activeStatus: true,
    matchingRule: "Match by Cheque / Ref Number",
    clearingPeriodDays: 2,
    autoClearExactMatches: true,
    allowPartialClearing: false,
    bankChargeLedger: "5200 - Bank Charges & Service Fees A/c",
    interestIncomeLedger: "4300 - Bank Interest Income A/c",
    merchantDiscountPct: 0.0,
    autoPostFeeJournal: false,
    requireStatementAttachment: true,
    requireSeniorSignOff: false,
    signBy: "Front Desk Lead",
    updatedBy: "System Auditor",
    updatedDate: "31/07/2026 12:10",
  },
  {
    id: "brt-neft",
    typeCode: "NEFT_TRANSFER",
    typeName: "NEFT / RTGS / IMPS Online Transfer",
    category: "Electronic / UTR",
    seqNo: 3,
    activeStatus: true,
    matchingRule: "Match by UTR Number",
    clearingPeriodDays: 1,
    autoClearExactMatches: true,
    allowPartialClearing: true,
    bankChargeLedger: "5200 - Bank Charges & Service Fees A/c",
    interestIncomeLedger: "4300 - Bank Interest Income A/c",
    merchantDiscountPct: 0.0,
    autoPostFeeJournal: false,
    requireStatementAttachment: false,
    requireSeniorSignOff: false,
    signBy: "Finance Controller",
    updatedBy: "Jay Admin",
    updatedDate: "29/07/2026 16:45",
  },
  {
    id: "brt-cc",
    typeCode: "CC_SETTLEMENT",
    typeName: "Credit Card EDC Merchant Settlement",
    category: "Credit Card Merchant",
    seqNo: 4,
    activeStatus: true,
    matchingRule: "Match by Amount & Date",
    clearingPeriodDays: 2,
    autoClearExactMatches: true,
    allowPartialClearing: true,
    bankChargeLedger: "5200 - Bank Charges & Service Fees A/c",
    interestIncomeLedger: "4300 - Bank Interest Income A/c",
    merchantDiscountPct: 1.8,
    autoPostFeeJournal: true,
    requireStatementAttachment: true,
    requireSeniorSignOff: true,
    signBy: "EDC Settlement Lead",
    updatedBy: "System Auditor",
    updatedDate: "27/07/2026 10:20",
  },
  {
    id: "brt-chg",
    typeCode: "BANK_CHG",
    typeName: "Bank Service Charges & Fees",
    category: "Bank Adjustment",
    seqNo: 5,
    activeStatus: true,
    matchingRule: "Match by Amount & Date",
    clearingPeriodDays: 1,
    autoClearExactMatches: true,
    allowPartialClearing: false,
    bankChargeLedger: "5200 - Bank Charges & Service Fees A/c",
    interestIncomeLedger: "4300 - Bank Interest Income A/c",
    merchantDiscountPct: 0.0,
    autoPostFeeJournal: true,
    requireStatementAttachment: true,
    requireSeniorSignOff: false,
    signBy: "Chief Accountant",
    updatedBy: "Jay Admin",
    updatedDate: "24/07/2026 14:00",
  },
];
