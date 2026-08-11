export interface IncomeRecord {
  id: string;
  incomeType: string;
  amount: number;
  date: string;
}

export const myIncomeRecords: IncomeRecord[] = [
  {
    id: "INC-001",
    incomeType: "Salary Disbursement",
    amount: 32250,
    date: "01/08/2026",
  },
  {
    id: "INC-002",
    incomeType: "Overtime Payout",
    amount: 3500,
    date: "05/08/2026",
  },
  {
    id: "INC-003",
    incomeType: "Banquet Incentive",
    amount: 2500,
    date: "08/08/2026",
  },
];

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
