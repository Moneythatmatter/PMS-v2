import { api, foPath } from "../api";

export const dashboardService = {
  get: () => api.get<Record<string, unknown>>(foPath("/dashboard")),
};
