export interface CompanyRecord {
  id: string;
  companyCode: string;
  companyName: string;
  legalName: string;
  alias: string;
  companyType: "Private Limited" | "Public Limited" | "Partnership" | "Sole Proprietorship" | "LLP";
  businessNature: string;
  status: "Active" | "Inactive";
  logoUrl?: string;

  // Registration Details
  gstNumber: string;
  panNumber: string;
  tanNumber: string;
  cinNumber: string;
  msmeNumber: string;
  registrationDate: string;

  // Address
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  state: string;
  country: string;
  pincode: string;

  // Contact Info
  primaryContact: string;
  mobile: string;
  telephone: string;
  email: string;
  website: string;

  // Financial Configuration
  baseCurrency: string;
  financialYear: string;
  fyStartMonth?: string;
  fyEndMonth?: string;
  accountingMethod: "Accrual" | "Cash" | "Accrual Basis Accounting" | "Cash Basis Accounting";
  decimalPrecision?: number;
  defaultCostCenter?: string;
  defaultBranch?: string;
  defaultTaxRegion?: string;
  taxRegion?: string;
  lockPeriodBeforeDate?: string;

  // Tax Configuration
  gstApplicable: boolean;
  gstRegistrationType?: string;
  eInvoicingEnabled?: boolean;
  tdsApplicable: boolean;
  tcsApplicable: boolean;
  taxJurisdiction?: string;

  // Hotel & System Configuration
  hotelName?: string;
  hotelCode?: string;
  numberOfProperties?: number;
  defaultProperty?: string;
  timeZone?: string;
  language?: string;
  nightAuditAutoPost?: boolean;
  posAutoPost?: boolean;
  mandatoryCostCenter?: boolean;
  cityLedgerTransferAuto?: boolean;
  autoVoucherNo?: boolean;
  voucherResetFrequency?: string;
  allowBackDatedVouchers?: boolean;
  allowFutureDatedVouchers?: boolean;

  // System Configuration
  allowMultiBranch?: boolean;
  allowMultiCurrency?: boolean;
  enableCostCenters?: boolean;
  enableBudgeting?: boolean;
  enableDepartmentAccounting?: boolean;

  // Remarks & Metrics
  remarks: string;
  createdDate: string;
  lastModified: string;

  // Additional Counts for UI Tabs
  branchesCount?: number;
  usersCount?: number;
}

export const sampleCompaniesList: CompanyRecord[] = [
  {
    id: "comp-101",
    companyCode: "CMP-001",
    companyName: "LUXY HOTEL & RESORTS PRIVATE LIMITED",
    legalName: "Luxy Hotel & Resorts Private Limited",
    alias: "LUXY HOTEL",
    companyType: "Private Limited",
    businessNature: "Hospitality & Hotel Operations",
    status: "Active",

    gstNumber: "24AAIFL8217G1ZC",
    panNumber: "AAIFL8217G",
    tanNumber: "BRCL00129G",
    cinNumber: "U55101GJ2020PTC114920",
    msmeNumber: "UDYAM-GJ-06-0011928",
    registrationDate: "15/04/2020",

    addressLine1: "Luxy Hotel GACL Chowkdi, Dahej Bharuch Main Road",
    addressLine2: "GIDC Dahej Industrial Estate",
    city: "Dahej",
    district: "Bharuch",
    state: "Gujarat",
    country: "India",
    pincode: "392130",

    primaryContact: "Mr. Jayesh Patel (General Manager)",
    mobile: "+91 70699 90770",
    telephone: "+91 2641 229900",
    email: "gm@hotelluxy.com",
    website: "www.hotelluxy.com",

    baseCurrency: "INR",
    financialYear: "01/04/2026 - 31/03/2027",
    accountingMethod: "Accrual",
    decimalPrecision: 2,
    defaultCostCenter: "Front Office & Accommodation",
    defaultBranch: "Dahej Main Property",
    defaultTaxRegion: "Gujarat (24)",

    gstApplicable: true,
    gstRegistrationType: "Regular Registered Business",
    tdsApplicable: true,
    tcsApplicable: false,
    taxJurisdiction: "Bharuch Range II - Gujarat",

    hotelName: "Luxy Hotel Dahej",
    hotelCode: "LUXY-DHJ",
    numberOfProperties: 2,
    defaultProperty: "Luxy Hotel Dahej Main Tower",
    timeZone: "Asia/Kolkata (IST +5:30)",
    language: "English (US)",

    allowMultiBranch: true,
    allowMultiCurrency: true,
    enableCostCenters: true,
    enableBudgeting: true,
    enableDepartmentAccounting: true,

    remarks: "Flagship luxury business hotel property operated under Luxy Group.",
    createdDate: "01/04/2020",
    lastModified: "28/07/2026",
  },
  {
    id: "comp-102",
    companyCode: "CMP-002",
    companyName: "LUXY CATERING & BANQUETS LLP",
    legalName: "Luxy Catering & Banquets LLP",
    alias: "LUXY BANQUETS",
    companyType: "LLP",
    businessNature: "F&B Services & Banquet Events",
    status: "Active",

    gstNumber: "24AABCL9901M1ZP",
    panNumber: "AABCL9901M",
    tanNumber: "BRCL00410M",
    cinNumber: "AAA-4902",
    msmeNumber: "UDYAM-GJ-06-009921",
    registrationDate: "10/01/2022",

    addressLine1: "Plot 88, Station Road Commercial Complex",
    addressLine2: "Near Railway Overbridge",
    city: "Bharuch",
    district: "Bharuch",
    state: "Gujarat",
    country: "India",
    pincode: "392001",

    primaryContact: "Chef Amaan Shaikh (F&B Director)",
    mobile: "+91 98250 44910",
    telephone: "+91 2642 249001",
    email: "banquets@hotelluxy.com",
    website: "www.hotelluxy.com/banquets",

    baseCurrency: "INR",
    financialYear: "01/04/2026 - 31/03/2027",
    accountingMethod: "Accrual",
    decimalPrecision: 2,
    defaultCostCenter: "Banquet & Convention Hall",
    defaultBranch: "Bharuch Banquets Division",
    defaultTaxRegion: "Gujarat (24)",

    gstApplicable: true,
    gstRegistrationType: "Regular Registered Business",
    tdsApplicable: true,
    tcsApplicable: false,
    taxJurisdiction: "Bharuch Range I - Gujarat",

    hotelName: "Luxy Convention Center",
    hotelCode: "LUXY-BNQ",
    numberOfProperties: 1,
    defaultProperty: "Grand Ballroom Hall A",
    timeZone: "Asia/Kolkata (IST +5:30)",
    language: "English (US)",

    allowMultiBranch: false,
    allowMultiCurrency: false,
    enableCostCenters: true,
    enableBudgeting: true,
    enableDepartmentAccounting: true,

    remarks: "Dedicated F&B banquet and corporate event management arm.",
    createdDate: "10/01/2022",
    lastModified: "15/07/2026",
  },
];
