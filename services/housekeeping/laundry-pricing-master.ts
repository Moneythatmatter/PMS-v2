import { api } from "../api";
import { hkPath } from "./index";
import type { LaundryPricingMaster } from "@/app/data/housekeeping/masters";

export const laundryPricingMasterService = {
  list: (query = "") =>
    api.get<LaundryPricingMaster[]>(hkPath(`/masters/laundry-pricing${query}`)),

  get: (id: string) =>
    api.get<LaundryPricingMaster>(hkPath(`/masters/laundry-pricing/${id}`)),

  create: (body: Partial<LaundryPricingMaster>) =>
    api.post<LaundryPricingMaster>(hkPath("/masters/laundry-pricing"), body),

  update: (id: string, body: Partial<LaundryPricingMaster>) =>
    api.put<LaundryPricingMaster>(
      hkPath(`/masters/laundry-pricing/${id}`),
      body,
    ),

  remove: (id: string) =>
    api.delete<{ id: string }>(hkPath(`/masters/laundry-pricing/${id}`)),
};
