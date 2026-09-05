export interface CompanyRecord {
  id: string;
  companyCode: string;
  tradeName: string;
  legalName: string;
  alias?: string;
  companyType: "Private Limited" | "Public Limited" | "LLP" | "Partnership" | "Sole Proprietorship" | "Other";
  businessNature: string;
  status: "Active" | "Inactive";
  logoUrl?: string;

  // Registered Address Details
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  country?: string;

  // Primary Contact Details
  primaryContact?: string;
  mobile?: string;
  telephone?: string;
  email?: string;
  website?: string;

  // Statutory Tax & Company Registration Identity
  gstNumber?: string;
  panNumber?: string;
  tanNumber?: string;
  cinNumber?: string;
  msmeNumber?: string;
  registrationDate?: string;
  taxRegion?: string;

  gstApplicable: boolean;

  // Read-only reference identifiers
  baseCurrencyId?: string;
  currentFiscalYearId?: string;

  createdAt: string;
  updatedAt: string;
}

export const sampleCompaniesList: CompanyRecord[] = [
  {
    id: "comp-101",
    companyCode: "CMP-001",
    tradeName: "HOTEL & RESORTS",
    legalName: "HOTEL & RESORTS PRIVATE LIMITED",
    alias: "HRPL",
    companyType: "Private Limited",
    businessNature: "Hospitality & Hotel Operations",
    status: "Active",

    addressLine1: "",
    addressLine2: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    country: "India",

    primaryContact: "",
    mobile: "",
    telephone: "",
    email: "",
    website: "",

    gstNumber: "",
    panNumber: "",
    tanNumber: "",
    cinNumber: "",
    msmeNumber: "",
    registrationDate: "",
    taxRegion: "",

    gstApplicable: true,

    baseCurrencyId: "INR",
    currentFiscalYearId: "FY-2026-27",

    createdAt: "01/04/2026",
    updatedAt: "Today",
  },
];
