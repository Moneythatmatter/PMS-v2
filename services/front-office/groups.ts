import { api, foPath } from "../api";

export type FoGroupDto = {
  id: string;
  groupNo?: string;
  groupName: string;
  groupType?: string;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  companyName?: string | null;
  arrivalDate: string;
  departureDate: string;
  status: string;
  notes?: string | null;
  createdAt?: string;
};

export type FoGroupBillingRuleDto = {
  id: string;
  groupId: string;
  chargeCategory: string;
  responsibility: string;
};

export type CreateGroupPayload = {
  groupName: string;
  groupType?: string;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  companyName?: string | null;
  arrivalDate: string;
  departureDate: string;
  nights?: number;
  notes?: string | null;
  idempotencyKey?: string;
  roomLines: Array<{
    roomType: string;
    quantity?: number;
    roomRate?: number;
    tariffPlan?: string;
    mealPlan?: string;
    adults?: number;
    children?: number;
  }>;
  billingRules?: Array<{
    chargeCategory: string;
    responsibility: string;
  }>;
  advancePaid?: number;
  paymentMode?: string | null;
  externalReference?: string | null;
};

export type CreateGroupResult = {
  groupId: string;
  idempotent: boolean;
  reservationIds: string[];
  masterFolioId?: string | null;
  group?: FoGroupDto;
};

export type GroupFolioDto = {
  id: string;
  folioNumber?: string | null;
  groupId?: string | null;
  status: string;
  subtotal: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  groupName?: string | null;
  groupNo?: string | null;
};

export type UpdateGroupPayload = {
  groupName?: string;
  groupType?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  companyName?: string | null;
  arrivalDate?: string;
  departureDate?: string;
  notes?: string | null;
  status?: string;
};

export const groupService = {
  list: (status?: string) =>
    api.get<FoGroupDto[]>(
      foPath(`/groups${status ? `?status=${encodeURIComponent(status)}` : ""}`),
    ),
  get: (id: string) => api.get<FoGroupDto>(foPath(`/groups/${id}`)),
  create: (body: CreateGroupPayload) =>
    api.post<CreateGroupResult>(foPath("/groups"), body),
  update: (id: string, body: UpdateGroupPayload) =>
    api.put<FoGroupDto>(foPath(`/groups/${id}`), body),
  reservations: (id: string) =>
    api.get<Record<string, unknown>[]>(foPath(`/groups/${id}/reservations`)),
  folio: (id: string) => api.get<GroupFolioDto>(foPath(`/groups/${id}/folio`)),
  billingRules: (id: string) =>
    api.get<FoGroupBillingRuleDto[]>(foPath(`/groups/${id}/billing-rules`)),
  updateBillingRules: (
    id: string,
    rules: Array<{ chargeCategory: string; responsibility: string }>,
  ) =>
    api.put<FoGroupBillingRuleDto[]>(foPath(`/groups/${id}/billing-rules`), {
      rules,
    }),
};
