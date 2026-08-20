import { api } from "../api";
import { hkPath } from "./index";
import type { PublicAreaMaster } from "@/app/data/housekeeping/masters";

export const publicAreaMasterService = {
  list: (query = "") =>
    api.get<PublicAreaMaster[]>(hkPath(`/masters/public-areas${query}`)),
  get: (id: string) =>
    api.get<PublicAreaMaster>(hkPath(`/masters/public-areas/${id}`)),
  create: (body: Partial<PublicAreaMaster>) =>
    api.post<PublicAreaMaster>(hkPath("/masters/public-areas"), body),
  update: (id: string, body: Partial<PublicAreaMaster>) =>
    api.put<PublicAreaMaster>(hkPath(`/masters/public-areas/${id}`), body),
  remove: (id: string) =>
    api.delete<{ id: string }>(hkPath(`/masters/public-areas/${id}`)),
};
