export interface PLEntry {
  id: string;
  code: string;
  name: string;
  amount: number;
  type: "income" | "expenditure";
  section: "trading" | "net-profit";
  level: "group" | "ledger" | "sub-ledger";
  parentId?: string;
  seqNo: number;
}

export interface PLSummary {
  openingStock: number;
  purchases: number;
  directExpenses: number;
  costOfOperations: number;
  grossProfit: number;
  totalTradingExp: number;

  sales: number;
  directIncome: number;
  roomRevenue: number;
  foodRevenue: number;
  beverageRevenue: number;
  otherRevenue: number;
  closingStock: number;
  totalTradingIncome: number;

  indirectExpenses: number;
  repairMaint: number;
  adminGeneral: number;
  operatingExp: number;
  heatLightPower: number;
  payrollStaff: number;
  salesMarketing: number;
  netProfit: number;
  totalNetProfitExp: number;

  grossProfitBf: number;
  indirectIncome: number;
  totalNetProfitIncome: number;
}

export const samplePLSummary: PLSummary = {
  // Trading Expenditure
  openingStock: 734655.03,
  purchases: 0.0,
  directExpenses: 3603135.2,
  costOfOperations: 3494108.2,
  grossProfit: 27775353.19,
  totalTradingExp: 32113143.42,

  // Trading Income
  sales: 0.0,
  directIncome: 30226508.9,
  roomRevenue: 24433749.25,
  foodRevenue: 5204103.2,
  beverageRevenue: 468010.25,
  otherRevenue: 120646.0,
  closingStock: 1886634.72,
  totalTradingIncome: 32113143.42,

  // Net Profit Indirect Expenses
  indirectExpenses: 12065170.82,
  repairMaint: 1267743.63,
  adminGeneral: 1327408.03,
  operatingExp: 994658.92,
  heatLightPower: 2532175.45,
  payrollStaff: 5923681.79,
  salesMarketing: 19503.0,
  netProfit: 16416540.94,
  totalNetProfitExp: 28481711.76,

  // Net Profit Indirect Income
  grossProfitBf: 27775353.19,
  indirectIncome: 706358.57,
  totalNetProfitIncome: 28481711.76,
};
