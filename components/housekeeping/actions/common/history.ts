import type { HKHistoryLog } from "../../HousekeepingTypes";

export const filterLogsByCategory = (logs: HKHistoryLog[], category: HKHistoryLog["category"]): HKHistoryLog[] => {
  return logs.filter((log) => log.category === category);
};

export const filterLogsByUser = (logs: HKHistoryLog[], username: string): HKHistoryLog[] => {
  return logs.filter((log) => log.user === username);
};
