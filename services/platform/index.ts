import { api } from "../api";
import type { PermissionLevel } from "@/lib/property";

export type PropertyDto = {
  id: string;
  name: string;
  code: string;
  city: string;
  timezone: string;
  isDefault: boolean;
  status: string;
};

export type PlatformModule = {
  key: string;
  label: string;
};

export type UserPermissionDto = {
  propertyId: string;
  moduleKey: string;
  permission: PermissionLevel;
};

export type EmployeeLinkOption = {
  id: string;
  propertyId: string;
  empCode: string;
  name: string;
  email: string;
};

export type ManagedUserDto = {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  status: string;
  isSuperAdmin?: boolean;
  employeeId?: string | null;
  employeeLabel?: string;
  propertyIds: string[];
  permissions: Array<{
    id?: string;
    propertyId: string;
    moduleKey: string;
    permission: PermissionLevel;
  }>;
};

export type PortfolioProperty = {
  id: string;
  name: string;
  code: string;
  city: string;
  rooms: number;
  occupied: number;
  occupancyPct: number;
  inHouse: number;
  arrivals: number;
  departures: number;
  reservations: number;
  roomRevenue: number;
  outstanding: number;
  dirtyRooms: number;
  openOrders: number;
  employees: number;
  openWorkOrders: number;
  pendingPurchases: number;
  openDeals: number;
  bookings: number;
  revenue: number;
  earnedRoomRevenue?: number;
  roomNightsSold?: number;
  availableRoomNights?: number;
  periodOccupancyPct?: number;
  adr?: number;
  revpar?: number;
  fbRevenue?: number;
  fbOrders?: number;
  payrollCost?: number;
  purchaseSpend?: number;
  expenses?: number;
  profit?: number;
  cancellations?: number;
  noShows?: number;
  stayNights?: number;
  stayCount?: number;
  avgLos?: number;
  oooRooms?: number;
  pendingPayroll?: number;
  unpaidPayroll?: number;
  pendingLeaves?: number;
  overdueWorkOrders?: number;
  absentToday?: number;
  prevRevenue?: number;
  prevFbRevenue?: number;
  prevRoomNightsSold?: number;
  prevAvailableRoomNights?: number;
  prevExpenses?: number;
};

export type PortfolioTrendPoint = {
  propertyId: string;
  label: string;
  sort: string;
  roomRevenue: number;
  fbRevenue: number;
  roomNightsSold: number;
  availableRoomNights: number;
};

export type PortfolioAlert = {
  id: string;
  propertyId: string;
  propertyName: string;
  severity: "high" | "medium";
  title: string;
  detail: string;
  owner: string;
  href: string;
};

export type PortfolioSeriesPoint = {
  month: string;
  booked: number;
  canceled: number;
  revenue: number;
};

export type PortfolioPlatform = {
  name: string;
  count: number;
};

export type PortfolioMovement = {
  id: string;
  kind: "arrival" | "departure" | "stay";
  propertyId: string;
  propertyName: string;
  guest: string;
  bookingNo: string;
  room: string;
  status: string;
  amount: number;
  balance: number;
  checkIn: string;
  checkOut: string;
};

export type PortfolioSnapshot = {
  from: string;
  to: string;
  totals: Omit<PortfolioProperty, "id" | "name" | "code" | "city"> & {
    properties: number;
  };
  properties: PortfolioProperty[];
  series: PortfolioSeriesPoint[];
  platforms: PortfolioPlatform[];
  arrivals: PortfolioMovement[];
  departures: PortfolioMovement[];
  staying: PortfolioMovement[];
  trend?: PortfolioTrendPoint[];
  alerts?: PortfolioAlert[];
  coverage?: { fb: boolean; purchases: boolean };
  definitions?: {
    revenue: string;
    expenses: string;
    profit: string;
    occupancy: string;
  };
};

export const platformService = {
  listProperties: () => api.get<PropertyDto[]>("/api/platform/properties"),
  getPortfolio: (from: string, to: string) =>
    api.get<PortfolioSnapshot>(
      `/api/platform/portfolio?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    ),
  createProperty: (body: {
    name: string;
    code: string;
    city?: string;
    timezone?: string;
    isDefault?: boolean;
  }) => api.post<PropertyDto>("/api/platform/properties", body),
  updateProperty: (id: string, body: Partial<PropertyDto>) =>
    api.put<PropertyDto>(`/api/platform/properties/${id}`, body),
  listModules: () => api.get<PlatformModule[]>("/api/platform/modules"),
  myPermissions: (propertyId: string) =>
    api.get<Record<string, PermissionLevel>>(
      `/api/platform/permissions/me?propertyId=${encodeURIComponent(propertyId)}`,
    ),
  listUsers: () => api.get<ManagedUserDto[]>("/api/platform/users"),
  listEmployeeLinkOptions: (propertyId: string) =>
    api.get<EmployeeLinkOption[]>(
      `/api/platform/users/employee-link-options?propertyId=${encodeURIComponent(propertyId)}`,
    ),
  createUser: (body: {
    name: string;
    email: string;
    password: string;
    role?: string;
    isSuperAdmin?: boolean;
    employeeId?: string | null;
    propertyIds?: string[];
    permissions?: UserPermissionDto[];
  }) => api.post<ManagedUserDto>("/api/platform/users", body),
  updateUser: (
    id: string,
    body: Partial<{
      name: string;
      role: string;
      status: string;
      isSuperAdmin: boolean;
      employeeId: string | null;
      propertyIds: string[];
      permissions: UserPermissionDto[];
      password: string;
    }>,
  ) => api.put<ManagedUserDto>(`/api/platform/users/${id}`, body),
};
