export interface StatutoryReportCard {
  id: string;
  category: "GST" | "BRS" | "Party" | "CostCenter" | "Audit" | "CashFlow";
  code: string;
  title: string;
  description: string;
  iconName: string;
  lastGenerated: string;
  status: "Ready" | "Updated";
}

export const sampleReportCatalogData: StatutoryReportCard[] = [
  {
    id: "rep-01",
    category: "GST",
    code: "REP-GST-01",
    title: "GSTR-1 Sales & Output Tax Register",
    description: "Detailed B2B and B2C sales invoice list with GSTIN, taxable amount, CGST, SGST, and IGST breakup.",
    iconName: "FileCheck2",
    lastGenerated: "03/08/2026 18:45",
    status: "Ready",
  },
  {
    id: "rep-02",
    category: "GST",
    code: "REP-GST-02",
    title: "GSTR-3B Monthly Tax Summary & ITC Ledger",
    description: "Net GST tax liability statement, Input Tax Credit (ITC) claims, and electronic cash ledger balance.",
    iconName: "Percent",
    lastGenerated: "01/08/2026 14:20",
    status: "Ready",
  },
  {
    id: "rep-03",
    category: "BRS",
    code: "REP-BRS-01",
    title: "Bank Reconciliation Statement (BRS)",
    description: "Comparison of bank ledger book balance vs bank statement with uncleared cheques & UTR credits.",
    iconName: "Landmark",
    lastGenerated: "02/08/2026 11:30",
    status: "Ready",
  },
  {
    id: "rep-04",
    category: "Party",
    code: "REP-PTY-01",
    title: "City Ledger Bill-Wise Outstanding Report",
    description: "Bill-by-bill outstanding balances for Corporate Clients, OTAs, and Travel Agents with aging analysis.",
    iconName: "Users",
    lastGenerated: "04/08/2026 09:15",
    status: "Updated",
  },
  {
    id: "rep-05",
    category: "CostCenter",
    code: "REP-CC-01",
    title: "Departmental Cost Center Overhead Allocation",
    description: "Allocation of property overhead expenses across Rooms, F&B, Spa, Maintenance, and Admin divisions.",
    iconName: "Building2",
    lastGenerated: "31/07/2026 17:00",
    status: "Ready",
  },
  {
    id: "rep-06",
    category: "Audit",
    code: "REP-AUD-01",
    title: "Voucher Audit Log & Edited Entries Register",
    description: "Audit trail tracking modified vouchers, deleted entries, backdated postings, and user authorization logs.",
    iconName: "ShieldCheck",
    lastGenerated: "04/08/2026 10:00",
    status: "Updated",
  },
];

export interface GSTReportSummaryRow {
  invoiceNo: string;
  invoiceDate: string;
  partyName: string;
  gstin: string;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalInvoiceValue: number;
}

export const sampleGSTReportRows: GSTReportSummaryRow[] = [
  {
    invoiceNo: "INV-2026-0881",
    invoiceDate: "02/08/2026",
    partyName: "Infosys Technologies Ltd",
    gstin: "29AAACI1681G1Z3",
    taxableValue: 500000.0,
    cgst: 45000.0,
    sgst: 45000.0,
    igst: 0.0,
    totalInvoiceValue: 590000.0,
  },
  {
    invoiceNo: "INV-2026-0882",
    invoiceDate: "03/08/2026",
    partyName: "MakeMyTrip India Pvt Ltd",
    gstin: "07AABCM8821R1Z8",
    taxableValue: 350000.0,
    cgst: 0.0,
    sgst: 0.0,
    igst: 63000.0,
    totalInvoiceValue: 413000.0,
  },
  {
    invoiceNo: "INV-2026-0883",
    invoiceDate: "04/08/2026",
    partyName: "TATA Consultancy Services",
    gstin: "27AAACT2210F1Z9",
    taxableValue: 750000.0,
    cgst: 0.0,
    sgst: 0.0,
    igst: 135000.0,
    totalInvoiceValue: 885000.0,
  },
];
