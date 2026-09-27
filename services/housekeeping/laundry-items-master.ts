import { api } from "../api";
import { hkPath } from "./index";
import type { LaundryItemMaster } from "@/app/data/housekeeping/masters";

export const laundryItemMasterService = {
  list: (query = "") =>
    api.get<LaundryItemMaster[]>(hkPath(`/masters/laundry-items${query}`)),

  get: (id: string) =>
    api.get<LaundryItemMaster>(hkPath(`/masters/laundry-items/${id}`)),

  create: (body: Partial<LaundryItemMaster>) =>
    api.post<LaundryItemMaster>(hkPath("/masters/laundry-items"), body),

  update: (id: string, body: Partial<LaundryItemMaster>) =>
    api.put<LaundryItemMaster>(hkPath(`/masters/laundry-items/${id}`), body),

  remove: (id: string) =>
    api.delete<{ id: string }>(hkPath(`/masters/laundry-items/${id}`)),
};
