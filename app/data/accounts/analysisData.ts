export interface DepartmentPerformance {
  id: string;
  departmentCode: string;
  departmentName: string;
  revenueYTD: number;
  costYTD: number;
  gopAmount: number;
  gopMarginPct: number;
  revenueSharePct: number;
  status: "Target Exceeded" | "On Target" | "Below Target";
}

export const sampleDepartmentPerformanceData: DepartmentPerformance[] = [
  {
    id: "dept-rooms",
    departmentCode: "ROOMS",
    departmentName: "Rooms Division",
    revenueYTD: 145000000.0,
    costYTD: 42000000.0,
    gopAmount: 103000000.0,
    gopMarginPct: 71.03,
    revenueSharePct: 57.54,
    status: "Target Exceeded",
  },
  {
    id: "dept-fnb",
    departmentCode: "FNB",
    departmentName: "Food & Beverage Division",
    revenueYTD: 95000000.0,
    costYTD: 55000000.0,
    gopAmount: 40000000.0,
    gopMarginPct: 42.11,
    revenueSharePct: 37.7,
    status: "On Target",
  },
  {
    id: "dept-spa",
    departmentCode: "SPA",
    departmentName: "Spa & Wellness",
    revenueYTD: 12000000.0,
    costYTD: 5000000.0,
    gopAmount: 7000000.0,
    gopMarginPct: 58.33,
    revenueSharePct: 4.76,
    status: "Target Exceeded",
  },
  {
    id: "dept-ang",
    departmentCode: "ANG",
    departmentName: "Administrative & General (Overhead)",
    revenueYTD: 0.0,
    costYTD: 28000000.0,
    gopAmount: -28000000.0,
    gopMarginPct: 0.0,
    revenueSharePct: 0.0,
    status: "On Target",
  },
  {
    id: "dept-pom",
    departmentCode: "POM",
    departmentName: "Property Maintenance & Utilities",
    revenueYTD: 0.0,
    costYTD: 18000000.0,
    gopAmount: -18000000.0,
    gopMarginPct: 0.0,
    revenueSharePct: 0.0,
    status: "On Target",
  },
];

export interface FinancialRatioItem {
  ratioName: string;
  category: "Profitability" | "Liquidity" | "Efficiency" | "Hotel Operations";
  actualValue: string;
  benchmarkValue: string;
  status: "Excellent" | "Good" | "Needs Attention";
  explanation: string;
}

export const sampleFinancialRatiosData: FinancialRatioItem[] = [
  {
    ratioName: "GOPPAR (GOP per Available Room)",
    category: "Hotel Operations",
    actualValue: "₹ 3,420.00 / room / day",
    benchmarkValue: "₹ 3,000.00",
    status: "Excellent",
    explanation: "High room profitability driven by premium ADR and controlled operational costs.",
  },
  {
    ratioName: "Gross Operating Profit Margin (GOP %)",
    category: "Profitability",
    actualValue: "58.41 %",
    benchmarkValue: "55.00 %",
    status: "Excellent",
    explanation: "Total GOP margin exceeds target hotel industry benchmarks.",
  },
  {
    ratioName: "Current Ratio (Liquidity)",
    category: "Liquidity",
    actualValue: "2.45 : 1",
    benchmarkValue: "2.00 : 1",
    status: "Good",
    explanation: "Strong short-term asset position to cover current liabilities.",
  },
  {
    ratioName: "Debtors Turnover (City Ledger Days)",
    category: "Efficiency",
    actualValue: "28.5 Days",
    benchmarkValue: "30.0 Days",
    status: "Good",
    explanation: "City ledger receivables collected well within standard 30-day credit period.",
  },
];

export interface AgingBucketItem {
  partyType: string;
  current0to30: number;
  days31to60: number;
  days61to90: number;
  daysAbove90: number;
  totalOutstanding: number;
}

export const sampleAgingBucketsData: AgingBucketItem[] = [
  {
    partyType: "Travel Agent (OTAs & DMC)",
    current0to30: 1850000.0,
    days31to60: 420000.0,
    days61to90: 80000.0,
    daysAbove90: 0.0,
    totalOutstanding: 2350000.0,
  },
  {
    partyType: "Corporate Client",
    current0to30: 1200000.0,
    days31to60: 350000.0,
    days61to90: 50000.0,
    daysAbove90: 0.0,
    totalOutstanding: 1600000.0,
  },
  {
    partyType: "Direct Guest Customer",
    current0to30: 250000.0,
    days31to60: 45000.0,
    days61to90: 5000.0,
    daysAbove90: 0.0,
    totalOutstanding: 300000.0,
  },
];
