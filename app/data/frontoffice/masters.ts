export interface RoomTypeMaster {
  id: string;
  code: string;
  name: string;
  description: string;
  baseRate: number;
  sizeSqFt: number;
  amenities: string[];
  status: "Active" | "Inactive";
}

export interface RoomMaster {
  id: string;
  roomNo: string;
  roomType: string;
  floor?: string;
  maxOccupancy?: number;
  bedType?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TariffPlanMaster {
  id: string;
  code: string;
  name: string;
  roomType: string;
  baseRate: number;
  weekendRate: number;
  mealPlan: string;
  cancellationPolicy: string;
  minNights: number;
  validFrom: string;
  validTo: string;
  status: "Active" | "Inactive";
}

/** @deprecated Use TariffPlanMaster */
export type RatePlanMaster = TariffPlanMaster;

export interface CompanyMaster {
  id: string;
  code: string;
  name: string;
  type: "Corporate" | "Travel Agent" | "Government" | "Event";
  contactPerson: string;
  email: string;
  phone: string;
  gstNumber?: string;
  address: string;
  city: string;
  corporateDiscount: number;
  creditLimit: number;
  status: "Active" | "Inactive";
  /** Accounts party this company is. Name, contact, GST, address and credit come from it. */
  partyId?: string | null;
  linked?: boolean;
  partyCode?: string;
  partyStatus?: "Active" | "Inactive" | "Blocked";
  partyTypeCode?: "CORP" | null;
  creditDays?: number;
}

export interface CompanyPartyOption {
  id: string;
  partyCode: string;
  partyName: string;
  partyTypeCode: "CORP";
  gstin: string;
  city: string;
  status: "Active" | "Inactive" | "Blocked";
  linkedCompanyId: string | null;
  linkedCompanyCode: string | null;
}

export interface BookingSourceMaster {
  id: string;
  code: string;
  name: string;
  description: string;
  status: "Active" | "Inactive";
}
