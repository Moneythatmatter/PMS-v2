export interface AccountingUtilityTool {
  id: string;
  code: string;
  title: string;
  description: string;
  category: "Maintenance" | "Audit" | "DataManagement" | "Security";
  lastRunDate: string;
  lastRunBy: string;
  status: "Optimal" | "Action Recommended" | "Locked";
  estimatedTime: string;
}

export const sampleAccountingToolsData: AccountingUtilityTool[] = [];
