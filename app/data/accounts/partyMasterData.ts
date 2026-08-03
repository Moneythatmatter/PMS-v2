export interface PartyMasterRecord {
  id: string;
  partyCode: string;
  partyName: string;
  alias: string;
  partyType: "Customer / Debtor" | "Vendor / Creditor" | "Travel Agent" | "Corporate Client" | "Employee" | "Laundry Vendor" | "Maintenance Vendor";
  partySubType: string;
  ledgerName: string;
  openingBalance: number;
  openingType: "Dr" | "Cr";
  creditLimit: number;
  status: "Active" | "Inactive";

  // Contact Info
  contactPerson: string;
  mobile: string;
  phone: string;
  email: string;
  website: string;

  // Address
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  state: string;
  country: string;
  pincode: string;

  // Tax Info
  gstNumber: string;
  panNumber: string;
  tanNumber: string;
  msmeNumber: string;
  taxCategory: string;

  // Payment Info
  paymentTerms: string;
  creditDays: number;
  preferredPaymentMode: string;
  bankName: string;
  branch: string;
  ifscCode: string;
  accountNumber: string;
  upiId: string;

  // Accounting Info
  receivableAccount: string;
  payableAccount: string;
  defaultCurrency: string;
  costCenter: boolean;
  analysisGroup: string;
  tdsApplicable: boolean;
  tcsApplicable: boolean;

  // Hotel Specific Info
  applicableFor: ("Guest" | "Vendor" | "Travel Agent" | "Corporate" | "Employee" | "Owner" | "Laundry Vendor" | "Maintenance Vendor")[];
  roomCommissionPct: number;
  travelAgentCommissionPct: number;
  corporateDiscountPct: number;

  // Remarks & Metrics
  remarks: string;
  outstandingBalance: number;
  totalReceipts: number;
  totalPayments: number;
  lastTxnDate: string;
  lastInvoiceNo: string;
}

export const samplePartyTypesList = [
  "All Types",
  "Customer / Debtor",
  "Vendor / Creditor",
  "Travel Agent",
  "Corporate Client",
  "Employee",
  "Laundry Vendor",
  "Maintenance Vendor",
];

export const sampleCitiesList = ["All Cities", "Gurugram", "New Delhi", "Navi Mumbai", "Noida", "Bharuch", "Ankleshwar"];
export const sampleStatesList = ["All States", "Haryana", "Delhi", "Maharashtra", "Uttar Pradesh", "Gujarat"];

export const samplePartyMasterData: PartyMasterRecord[] = [
  {
    id: "party-101",
    partyCode: "P-10024",
    partyName: "MakeMyTrip India Pvt Ltd",
    alias: "MMT",
    partyType: "Travel Agent",
    partySubType: "OTA Agent",
    ledgerName: "Sundry Debtors - Travel Agents",
    openingBalance: 145000,
    openingType: "Dr",
    creditLimit: 500000,
    status: "Active",

    contactPerson: "Mr. Rakesh Sharma",
    mobile: "+91 98250 11200",
    phone: "+91 124 4300000",
    email: "accounts@makemytrip.com",
    website: "www.makemytrip.com",

    addressLine1: "14th Floor, DLF Building 10, Tower B",
    addressLine2: "DLF Cyber City, Sector 24",
    city: "Gurugram",
    district: "Gurugram",
    state: "Haryana",
    country: "India",
    pincode: "122002",

    gstNumber: "06AAACM0120P1Z2",
    panNumber: "AAACM0120P",
    tanNumber: "DELM09912E",
    msmeNumber: "UDYAM-HR-03-00129",
    taxCategory: "Regular GST Registered",

    paymentTerms: "Net 30 Days",
    creditDays: 30,
    preferredPaymentMode: "NEFT / RTGS",
    bankName: "HDFC Bank Ltd",
    branch: "Cyber City Branch",
    ifscCode: "HDFC0000129",
    accountNumber: "50200011889922",
    upiId: "makemytrip@hdfcbank",

    receivableAccount: "1195 - SUNDRY DEBTORS",
    payableAccount: "2410 - Sundry Creditors",
    defaultCurrency: "INR",
    costCenter: true,
    analysisGroup: "Travel Agents Sales",
    tdsApplicable: true,
    tcsApplicable: false,

    applicableFor: ["Travel Agent", "Corporate"],
    roomCommissionPct: 15,
    travelAgentCommissionPct: 15,
    corporateDiscountPct: 10,

    remarks: "Key OTA partner account. Monthly commission settlement required on 1st of every month.",
    outstandingBalance: 145000,
    totalReceipts: 1850000,
    totalPayments: 277500,
    lastTxnDate: "24/07/2026",
    lastInvoiceNo: "INV-2026-0812",
  },
  {
    id: "party-102",
    partyCode: "P-10041",
    partyName: "Agoda Corporate Services",
    alias: "AGODA",
    partyType: "Corporate Client",
    partySubType: "Corporate OTA",
    ledgerName: "Sundry Debtors - Corporate",
    openingBalance: 220000,
    openingType: "Dr",
    creditLimit: 1000000,
    status: "Active",

    contactPerson: "Ms. Priyanka Mehta",
    mobile: "+91 99090 44210",
    phone: "+91 11 4991200",
    email: "billing@agoda.com",
    website: "www.agoda.com",

    addressLine1: "Unit 302, Worldmark 1, Asset 11",
    addressLine2: "Aerocity, Indira Gandhi Intl Airport",
    city: "New Delhi",
    district: "South West Delhi",
    state: "Delhi",
    country: "India",
    pincode: "110037",

    gstNumber: "07AAACA9911F1Z8",
    panNumber: "AAACA9911F",
    tanNumber: "DELA11029F",
    msmeNumber: "N/A",
    taxCategory: "Regular GST Registered",

    paymentTerms: "Net 15 Days",
    creditDays: 15,
    preferredPaymentMode: "Bank Transfer",
    bankName: "ICICI Bank Ltd",
    branch: "Connaught Place",
    ifscCode: "ICIC0000007",
    accountNumber: "000705001199",
    upiId: "agoda@icici",

    receivableAccount: "1195 - SUNDRY DEBTORS",
    payableAccount: "2410 - Sundry Creditors",
    defaultCurrency: "INR",
    costCenter: true,
    analysisGroup: "Corporate Sales",
    tdsApplicable: true,
    tcsApplicable: false,

    applicableFor: ["Corporate", "Travel Agent"],
    roomCommissionPct: 12,
    travelAgentCommissionPct: 12,
    corporateDiscountPct: 15,

    remarks: "Corporate credit client for executive stay bookings. Requires monthly balance confirmation.",
    outstandingBalance: 220000,
    totalReceipts: 3400000,
    totalPayments: 408000,
    lastTxnDate: "18/07/2026",
    lastInvoiceNo: "INV-2026-0410",
  },
  {
    id: "party-103",
    partyCode: "P-20011",
    partyName: "AMAAN AGENCY",
    alias: "AMAAN",
    partyType: "Vendor / Creditor",
    partySubType: "F&B Raw Material Supplier",
    ledgerName: "Sundry Creditors - Supplies",
    openingBalance: 35000,
    openingType: "Cr",
    creditLimit: 300000,
    status: "Active",

    contactPerson: "Mr. Amaan Shaikh",
    mobile: "+91 98250 44100",
    phone: "+91 2642 220199",
    email: "amaan.agency@gmail.com",
    website: "N/A",

    addressLine1: "Shop 12, APMC Wholesale Market",
    addressLine2: "Station Road, Opp Railway Station",
    city: "Bharuch",
    district: "Bharuch",
    state: "Gujarat",
    country: "India",
    pincode: "392001",

    gstNumber: "24AABCA1234F1ZP",
    panNumber: "AABCA1234F",
    tanNumber: "BRCA00129F",
    msmeNumber: "UDYAM-GJ-06-00412",
    taxCategory: "MSME Registered Small Enterprise",

    paymentTerms: "Net 7 Days",
    creditDays: 7,
    preferredPaymentMode: "Cheque / UPI",
    bankName: "State Bank of India",
    branch: "Station Road Bharuch",
    ifscCode: "SBIN0000329",
    accountNumber: "30011224455",
    upiId: "amaan.agency@sbi",

    receivableAccount: "1190 - Sundry Creditors Advance",
    payableAccount: "2410 - Sundry Creditors",
    defaultCurrency: "INR",
    costCenter: true,
    analysisGroup: "F&B Raw Material Purchases",
    tdsApplicable: true,
    tcsApplicable: false,

    applicableFor: ["Vendor"],
    roomCommissionPct: 0,
    travelAgentCommissionPct: 0,
    corporateDiscountPct: 0,

    remarks: "Primary daily fresh dairy and grocery supplier for kitchen operations.",
    outstandingBalance: 35000,
    totalReceipts: 0,
    totalPayments: 850000,
    lastTxnDate: "15/07/2026",
    lastInvoiceNo: "BILL-2026-0044",
  },
];
