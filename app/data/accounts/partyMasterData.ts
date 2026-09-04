export interface Address {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface DerivedOutstanding {
  balance: number;
  balanceType: "Dr" | "Cr";
  lastTxnDate?: string;
  lastInvoiceNo?: string;
  totalInvoicesCount?: number;
}

export interface PartyModel {
  partyId: string; // e.g. "P-00101" (system-generated immutable ID)

  partyTypeId: string; // reference to PartyTypeModel (e.g. "PTY-001")
  partySubTypeId: string; // reference to PartySubTypeModel (e.g. "PST-002")

  partyCode: string; // e.g. "P-10024"
  partyName: string; // Legal / display name
  shortName?: string; // Alias / short name

  entityType: "Individual" | "Company" | "Organization" | "Government";

  contactId?: string; // Optional CRM Contact link

  email?: string;
  phone?: string;
  alternatePhone?: string;
  website?: string;

  billingAddress?: Address;
  shippingAddress?: Address;

  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;

  contactPersonName?: string;
  contactPersonPhone?: string;
  contactPersonEmail?: string;
  contactPersonDesignation?: string;

  panNumber?: string;
  gstin?: string;
  gstRegistrationType?: string;
  tanNumber?: string;
  msmeNumber?: string;

  currencyId?: string; // e.g. "CUR-001" (INR)

  creditDays?: number;
  creditLimit?: number;

  paymentMethodId?: string; // e.g. "NEFT / RTGS", "Bank Transfer", "Cheque", "UPI", "Cash"

  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankBranch?: string;
  bankAccountType?: string;

  receivableAccountId?: string; // Linked Chart of Accounts head
  payableAccountId?: string; // Linked Chart of Accounts head

  status: "Active" | "Inactive";

  remarks?: string;

  // Protection & Derived Accounting Balance (Read-only, derived from transaction layer)
  hasFinancialHistory?: boolean;
  derivedOutstanding?: DerivedOutstanding;

  createdAt: string;
  updatedAt: string;
}

export type PartyMasterRecord = PartyModel;

export const sampleGSTRegistrationTypes = [
  "Registered - Regular",
  "Composition Scheme",
  "Unregistered / Consumer",
  "Special Economic Zone (SEZ)",
  "Overseas / Non-Resident",
  "Government Body / Local Authority",
  "Embassy / Diplomatic Mission (UIN)",
];

export const sampleEntityTypes: PartyModel["entityType"][] = [
  "Company",
  "Individual",
  "Organization",
  "Government",
];

export const samplePaymentMethods = [
  "NEFT / RTGS",
  "Bank Transfer",
  "Cheque",
  "UPI",
  "Corporate Credit Card",
  "Cash",
];

export const sampleCitiesList = [
  "All Cities",
  "Gurugram",
  "New Delhi",
  "Navi Mumbai",
  "Noida",
  "Bharuch",
  "Ankleshwar",
  "Mumbai",
  "Bengaluru",
  "Ahmedabad",
];

export const sampleStatesList = [
  "All States",
  "Gujarat",
  "Haryana",
  "Delhi",
  "Maharashtra",
  "Karnataka",
  "Uttar Pradesh",
  "Rajasthan",
  "Tamil Nadu",
];

export const sampleReceivableAccounts = [
  { id: "1195 - SUNDRY DEBTORS", name: "1195 - SUNDRY DEBTORS (Standard Guest & Corporate Ledger)" },
  { id: "1190 - Sundry Debtors - Travel Agents", name: "1190 - Sundry Debtors - Travel Agents & OTAs" },
  { id: "1192 - Sundry Debtors - Banquet & Events", name: "1192 - Sundry Debtors - Banquet & Events" },
  { id: "1198 - Sundry Debtors - Staff Advances", name: "1198 - Sundry Debtors - Staff Advances" },
];

export const samplePayableAccounts = [
  { id: "2410 - Sundry Creditors", name: "2410 - Sundry Creditors (General Vendors & Service Providers)" },
  { id: "2415 - Sundry Creditors - F&B Supplies", name: "2415 - Sundry Creditors - F&B Supplies & Groceries" },
  { id: "2420 - Sundry Creditors - Engineering & AMC", name: "2420 - Sundry Creditors - Engineering & AMC" },
  { id: "2430 - Statutory Dues Payable (GST/TDS)", name: "2430 - Statutory Dues Payable (GST / TDS / Municipal)" },
];

export const samplePartyMasterData: PartyModel[] = [
  {
    partyId: "P-00101",
    partyTypeId: "PTY-003", // Agent / Intermediary
    partySubTypeId: "PST-010", // OTA
    partyCode: "P-10024",
    partyName: "MakeMyTrip India Pvt Ltd",
    shortName: "MMT",
    entityType: "Company",
    contactId: "CRM-CNT-101",

    email: "accounts@makemytrip.com",
    phone: "+91 124 4300000",
    alternatePhone: "+91 98250 11200",
    website: "https://www.makemytrip.com",

    billingAddress: {
      addressLine1: "14th Floor, DLF Building 10, Tower B",
      addressLine2: "DLF Cyber City, Sector 24",
      city: "Gurugram",
      district: "Gurugram",
      state: "Haryana",
      postalCode: "122002",
      country: "India",
    },
    shippingAddress: {
      addressLine1: "14th Floor, DLF Building 10, Tower B",
      addressLine2: "DLF Cyber City, Sector 24",
      city: "Gurugram",
      district: "Gurugram",
      state: "Haryana",
      postalCode: "122002",
      country: "India",
    },
    city: "Gurugram",
    state: "Haryana",
    postalCode: "122002",
    country: "India",

    contactPersonName: "Mr. Rakesh Sharma",
    contactPersonDesignation: "Senior Key Account Manager",
    contactPersonPhone: "+91 98250 11200",
    contactPersonEmail: "rakesh.sharma@makemytrip.com",

    panNumber: "AAACM0120P",
    gstin: "06AAACM0120P1Z2",
    gstRegistrationType: "Registered - Regular",
    tanNumber: "DELM09912E",
    msmeNumber: "UDYAM-HR-03-00129",

    currencyId: "CUR-001",
    creditDays: 30,
    creditLimit: 500000,
    paymentMethodId: "NEFT / RTGS",

    bankName: "HDFC Bank Ltd",
    bankAccountNumber: "50200011889922",
    bankIfsc: "HDFC0000129",
    bankBranch: "Cyber City Branch",
    bankAccountType: "Current Account",

    receivableAccountId: "1190 - Sundry Debtors - Travel Agents",
    payableAccountId: "2410 - Sundry Creditors",

    status: "Active",
    remarks: "Key OTA partner account. Monthly commission settlement required on 1st of every month.",

    hasFinancialHistory: true,
    derivedOutstanding: {
      balance: 145000,
      balanceType: "Dr",
      lastTxnDate: "24/07/2026",
      lastInvoiceNo: "INV-2026-0812",
      totalInvoicesCount: 14,
    },
    createdAt: "01/04/2026",
    updatedAt: "01/08/2026",
  },
  {
    partyId: "P-00102",
    partyTypeId: "PTY-001", // Customer
    partySubTypeId: "PST-002", // Corporate Client
    partyCode: "P-10041",
    partyName: "Agoda Corporate Services India Pvt Ltd",
    shortName: "AGODA",
    entityType: "Company",
    contactId: "CRM-CNT-102",

    email: "billing@agoda.com",
    phone: "+91 11 4991200",
    alternatePhone: "+91 99090 44210",
    website: "https://www.agoda.com",

    billingAddress: {
      addressLine1: "Unit 302, Worldmark 1, Asset 11",
      addressLine2: "Aerocity, Indira Gandhi Intl Airport",
      city: "New Delhi",
      district: "South West Delhi",
      state: "Delhi",
      postalCode: "110037",
      country: "India",
    },
    city: "New Delhi",
    state: "Delhi",
    postalCode: "110037",
    country: "India",

    contactPersonName: "Ms. Priyanka Mehta",
    contactPersonDesignation: "Regional Credit Controller",
    contactPersonPhone: "+91 99090 44210",
    contactPersonEmail: "priyanka.m@agoda.com",

    panNumber: "AAACA9911F",
    gstin: "07AAACA9911F1Z8",
    gstRegistrationType: "Registered - Regular",
    tanNumber: "DELA11029F",
    msmeNumber: "N/A",

    currencyId: "CUR-001",
    creditDays: 15,
    creditLimit: 1000000,
    paymentMethodId: "Bank Transfer",

    bankName: "ICICI Bank Ltd",
    bankAccountNumber: "000705001199",
    bankIfsc: "ICIC0000007",
    bankBranch: "Connaught Place",
    bankAccountType: "Current Account",

    receivableAccountId: "1195 - SUNDRY DEBTORS",
    payableAccountId: "2410 - Sundry Creditors",

    status: "Active",
    remarks: "Corporate credit client for executive stay bookings. Requires monthly balance confirmation.",

    hasFinancialHistory: true,
    derivedOutstanding: {
      balance: 220000,
      balanceType: "Dr",
      lastTxnDate: "18/07/2026",
      lastInvoiceNo: "INV-2026-0410",
      totalInvoicesCount: 8,
    },
    createdAt: "01/04/2026",
    updatedAt: "01/08/2026",
  },
  {
    partyId: "P-00103",
    partyTypeId: "PTY-002", // Vendor
    partySubTypeId: "PST-004", // Food Supplier
    partyCode: "P-20011",
    partyName: "Amaan Agency (Fresh Dairy & Produce)",
    shortName: "AMAAN",
    entityType: "Organization",

    email: "amaan.agency@gmail.com",
    phone: "+91 2642 220199",
    alternatePhone: "+91 98250 44100",
    website: "",

    billingAddress: {
      addressLine1: "Shop 12, APMC Wholesale Market",
      addressLine2: "Station Road, Opp Railway Station",
      city: "Bharuch",
      district: "Bharuch",
      state: "Gujarat",
      postalCode: "392001",
      country: "India",
    },
    city: "Bharuch",
    state: "Gujarat",
    postalCode: "392001",
    country: "India",

    contactPersonName: "Mr. Amaan Shaikh",
    contactPersonDesignation: "Managing Partner",
    contactPersonPhone: "+91 98250 44100",
    contactPersonEmail: "amaan.agency@gmail.com",

    panNumber: "AABCA1234F",
    gstin: "24AABCA1234F1ZP",
    gstRegistrationType: "Registered - Regular",
    tanNumber: "BRCA00129F",
    msmeNumber: "UDYAM-GJ-06-00412",

    currencyId: "CUR-001",
    creditDays: 7,
    creditLimit: 300000,
    paymentMethodId: "Cheque",

    bankName: "State Bank of India",
    bankAccountNumber: "30011224455",
    bankIfsc: "SBIN0000329",
    bankBranch: "Station Road Bharuch",
    bankAccountType: "Current Account",

    receivableAccountId: "1195 - SUNDRY DEBTORS",
    payableAccountId: "2415 - Sundry Creditors - F&B Supplies",

    status: "Active",
    remarks: "Primary daily fresh dairy and grocery supplier for kitchen operations.",

    hasFinancialHistory: true,
    derivedOutstanding: {
      balance: 35000,
      balanceType: "Cr",
      lastTxnDate: "15/07/2026",
      lastInvoiceNo: "BILL-2026-0044",
      totalInvoicesCount: 22,
    },
    createdAt: "01/04/2026",
    updatedAt: "01/08/2026",
  },
  {
    partyId: "P-00104",
    partyTypeId: "PTY-001", // Customer
    partySubTypeId: "PST-001", // Individual Guest
    partyCode: "P-10098",
    partyName: "Dr. Arvind Swaminathan",
    shortName: "A. Swaminathan",
    entityType: "Individual",

    email: "arvind.swaminathan@gmail.com",
    phone: "+91 98401 55678",
    website: "",

    billingAddress: {
      addressLine1: "Flat 4B, Emerald Heights",
      addressLine2: "14th Main Road, Indiranagar",
      city: "Bengaluru",
      district: "Bengaluru Urban",
      state: "Karnataka",
      postalCode: "560038",
      country: "India",
    },
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560038",
    country: "India",

    contactPersonName: "Dr. Arvind Swaminathan",
    contactPersonDesignation: "Self / Direct Guest",
    contactPersonPhone: "+91 98401 55678",
    contactPersonEmail: "arvind.swaminathan@gmail.com",

    panNumber: "BSWPS4412K",
    gstin: "",
    gstRegistrationType: "Unregistered / Consumer",

    currencyId: "CUR-001",
    creditDays: 0,
    creditLimit: 0,
    paymentMethodId: "UPI",

    receivableAccountId: "1195 - SUNDRY DEBTORS",
    status: "Active",
    remarks: "Frequent leisure guest. Direct settlement via UPI / Card on check-out.",

    hasFinancialHistory: false,
    derivedOutstanding: {
      balance: 0,
      balanceType: "Dr",
      totalInvoicesCount: 0,
    },
    createdAt: "10/05/2026",
    updatedAt: "10/05/2026",
  },
  {
    partyId: "P-00105",
    partyTypeId: "PTY-002", // Vendor
    partySubTypeId: "PST-005", // Engineering Vendor
    partyCode: "P-20055",
    partyName: "Voltas Engineering Maintenance Services Ltd",
    shortName: "VOLTAS",
    entityType: "Company",

    email: "service.west@voltas.com",
    phone: "+91 22 66656000",
    alternatePhone: "+91 98200 88712",
    website: "https://www.voltas.com",

    billingAddress: {
      addressLine1: "Voltas House 'A', Dr. Babasaheb Ambedkar Road",
      addressLine2: "Chinchpokli",
      city: "Mumbai",
      district: "Mumbai City",
      state: "Maharashtra",
      postalCode: "400033",
      country: "India",
    },
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400033",
    country: "India",

    contactPersonName: "Mr. Hemant Kulkarni",
    contactPersonDesignation: "Lead Project Engineer",
    contactPersonPhone: "+91 98200 88712",
    contactPersonEmail: "hemant.k@voltas.com",

    panNumber: "AAACV0019H",
    gstin: "27AAACV0019H1ZO",
    gstRegistrationType: "Registered - Regular",
    tanNumber: "MUMB00112A",

    currencyId: "CUR-001",
    creditDays: 30,
    creditLimit: 400000,
    paymentMethodId: "NEFT / RTGS",

    bankName: "Axis Bank Ltd",
    bankAccountNumber: "912020004455667",
    bankIfsc: "UTIB0000004",
    bankBranch: "Fort Mumbai",
    bankAccountType: "Current Account",

    receivableAccountId: "1195 - SUNDRY DEBTORS",
    payableAccountId: "2420 - Sundry Creditors - Engineering & AMC",

    status: "Active",
    remarks: "HVAC central plant AMC and quarterly chiller servicing contractor.",

    hasFinancialHistory: true,
    derivedOutstanding: {
      balance: 84000,
      balanceType: "Cr",
      lastTxnDate: "02/08/2026",
      lastInvoiceNo: "BILL-2026-0119",
      totalInvoicesCount: 5,
    },
    createdAt: "01/04/2026",
    updatedAt: "02/08/2026",
  },
  {
    partyId: "P-00106",
    partyTypeId: "PTY-005", // Government / Statutory
    partySubTypeId: "PST-017", // GST Authority
    partyCode: "P-50001",
    partyName: "Central Board of Indirect Taxes & Customs (GST)",
    shortName: "CBIC GST",
    entityType: "Government",

    email: "helpdesk@gst.gov.in",
    phone: "1800 103 4786",
    website: "https://www.gst.gov.in",

    billingAddress: {
      addressLine1: "GST Bhavan, Revenue Building",
      addressLine2: "IP Estate",
      city: "New Delhi",
      district: "Central Delhi",
      state: "Delhi",
      postalCode: "110002",
      country: "India",
    },
    city: "New Delhi",
    state: "Delhi",
    postalCode: "110002",
    country: "India",

    contactPersonName: "Superintendent of Central Tax",
    contactPersonDesignation: "Range II Officer",

    panNumber: "AAAGG0001G",
    gstin: "07AAAGG0001G1ZU",
    gstRegistrationType: "Government Body / Local Authority",

    currencyId: "CUR-001",
    paymentMethodId: "Bank Transfer",

    payableAccountId: "2430 - Statutory Dues Payable (GST/TDS)",
    status: "Active",
    remarks: "Statutory monthly GST return filing and payment liability accounting head.",

    hasFinancialHistory: false,
    derivedOutstanding: {
      balance: 0,
      balanceType: "Cr",
      totalInvoicesCount: 0,
    },
    createdAt: "01/04/2026",
    updatedAt: "01/04/2026",
  },
];
