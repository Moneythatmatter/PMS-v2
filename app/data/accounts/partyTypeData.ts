export interface PartyTypeRecord {
  id: string;
  partyTypeCode: string;
  partyTypeName: string;
  description: string;
  seqNo: number;
  activeStatus: boolean;
  allowDirectInvoicing: boolean;
  controlGLLedger: string;
  subLedgerGroup: string;
  allowCommissionPosting: boolean;
  allowDiscountPosting: boolean;
  defaultCreditLimit: number;
  defaultCreditDays: number;
  enforceHardCreditLimit: boolean;
  overdueInterestPct: number;
  gstinMandatory: boolean;
  panMandatory: boolean;
  approvalRequiredForParty: boolean;
  blacklistingAllowed: boolean;
  signBy: string;
  updatedBy: string;
  updatedDate: string;
}

export const samplePartyTypesData: PartyTypeRecord[] = [
  {
    id: "pt-ta",
    partyTypeCode: "TA",
    partyTypeName: "Travel Agent",
    description: "Online Travel Agencies (OTAs) & Offline Travel Companies (MMT, Agoda, Booking.com)",
    seqNo: 1,
    activeStatus: true,
    allowDirectInvoicing: true,
    controlGLLedger: "1200 - City Ledger Receivables A/c",
    subLedgerGroup: "Trade Receivables - Travel Agents",
    allowCommissionPosting: true,
    allowDiscountPosting: true,
    defaultCreditLimit: 500000.0,
    defaultCreditDays: 30,
    enforceHardCreditLimit: true,
    overdueInterestPct: 18.0,
    gstinMandatory: true,
    panMandatory: true,
    approvalRequiredForParty: true,
    blacklistingAllowed: true,
    signBy: "Revenue Manager",
    updatedBy: "Jay Admin",
    updatedDate: "01/08/2026 11:30",
  },
  {
    id: "pt-corp",
    partyTypeCode: "CORP",
    partyTypeName: "Corporate Client",
    description: "Corporate Companies, IT Firms, & Commercial Contracting Clients",
    seqNo: 2,
    activeStatus: true,
    allowDirectInvoicing: true,
    controlGLLedger: "1200 - City Ledger Receivables A/c",
    subLedgerGroup: "Trade Receivables - Corporate",
    allowCommissionPosting: false,
    allowDiscountPosting: true,
    defaultCreditLimit: 1000000.0,
    defaultCreditDays: 45,
    enforceHardCreditLimit: true,
    overdueInterestPct: 18.0,
    gstinMandatory: true,
    panMandatory: true,
    approvalRequiredForParty: true,
    blacklistingAllowed: true,
    signBy: "Corporate Sales Director",
    updatedBy: "System Auditor",
    updatedDate: "30/07/2026 15:45",
  },
  {
    id: "pt-vendor",
    partyTypeCode: "SUPP",
    partyTypeName: "Vendor / Creditor",
    description: "F&B Suppliers, Maintenance Vendors, & Service Contractors",
    seqNo: 3,
    activeStatus: true,
    allowDirectInvoicing: true,
    controlGLLedger: "2100 - Sundry Creditors Payable A/c",
    subLedgerGroup: "Trade Payables - Suppliers",
    allowCommissionPosting: false,
    allowDiscountPosting: false,
    defaultCreditLimit: 200000.0,
    defaultCreditDays: 30,
    enforceHardCreditLimit: false,
    overdueInterestPct: 0.0,
    gstinMandatory: true,
    panMandatory: true,
    approvalRequiredForParty: true,
    blacklistingAllowed: true,
    signBy: "Purchase Audit Manager",
    updatedBy: "Jay Admin",
    updatedDate: "28/07/2026 09:20",
  },
  {
    id: "pt-guest",
    partyTypeCode: "GUEST",
    partyTypeName: "Guest / Customer",
    description: "Individual Transient Guests, Walk-ins, & Banquet Event Hosts",
    seqNo: 4,
    activeStatus: true,
    allowDirectInvoicing: true,
    controlGLLedger: "1100 - Guest Ledger Open Folios A/c",
    subLedgerGroup: "Guest Receivables",
    allowCommissionPosting: false,
    allowDiscountPosting: true,
    defaultCreditLimit: 50000.0,
    defaultCreditDays: 0,
    enforceHardCreditLimit: true,
    overdueInterestPct: 24.0,
    gstinMandatory: false,
    panMandatory: false,
    approvalRequiredForParty: false,
    blacklistingAllowed: true,
    signBy: "Front Desk Manager",
    updatedBy: "Jay Admin",
    updatedDate: "25/07/2026 14:10",
  },
  {
    id: "pt-govt",
    partyTypeCode: "GOVT",
    partyTypeName: "Government / Tax Body",
    description: "GST Tax Departments, Municipal Corporations, & Statutory Authorities",
    seqNo: 5,
    activeStatus: true,
    allowDirectInvoicing: false,
    controlGLLedger: "2300 - Statutory Taxes Payable A/c",
    subLedgerGroup: "Statutory Bodies",
    allowCommissionPosting: false,
    allowDiscountPosting: false,
    defaultCreditLimit: 0.0,
    defaultCreditDays: 0,
    enforceHardCreditLimit: false,
    overdueInterestPct: 0.0,
    gstinMandatory: true,
    panMandatory: true,
    approvalRequiredForParty: true,
    blacklistingAllowed: false,
    signBy: "Chief Accountant",
    updatedBy: "System Auditor",
    updatedDate: "20/07/2026 16:30",
  },
];
