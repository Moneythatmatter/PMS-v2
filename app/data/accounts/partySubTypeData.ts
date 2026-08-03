export interface PartySubTypeRecord {
  id: string;
  subTypeCode: string;
  subTypeName: string;
  parentPartyType: string;
  description: string;
  seqNo: number;
  activeStatus: boolean;
  allowDirectSettlement: boolean;
  commissionRatePct: number;
  commissionCalcBase: "Room Only Rate" | "Total Revenue" | "Fixed Amount";
  allowNegotiatedRates: boolean;
  defaultDiscountPct: number;
  creditLimitOverride: number;
  creditDaysOverride: number;
  requireSecurityDeposit: boolean;
  lateFeePct: number;
  contractExpiryDate: string;
  statutoryRegMandatory: boolean;
  blacklistingAllowed: boolean;
  signBy: string;
  updatedBy: string;
  updatedDate: string;
}

export const samplePartySubTypesData: PartySubTypeRecord[] = [
  {
    id: "pst-ota",
    subTypeCode: "OTA",
    subTypeName: "OTA Agent",
    parentPartyType: "Travel Agent",
    description: "Online Travel Portals (MakeMyTrip, Agoda, Expedia, Booking.com)",
    seqNo: 1,
    activeStatus: true,
    allowDirectSettlement: true,
    commissionRatePct: 15.0,
    commissionCalcBase: "Room Only Rate",
    allowNegotiatedRates: true,
    defaultDiscountPct: 10.0,
    creditLimitOverride: 750000.0,
    creditDaysOverride: 30,
    requireSecurityDeposit: false,
    lateFeePct: 18.0,
    contractExpiryDate: "31/12/2026",
    statutoryRegMandatory: true,
    blacklistingAllowed: true,
    signBy: "E-Commerce Manager",
    updatedBy: "Jay Admin",
    updatedDate: "01/08/2026 14:00",
  },
  {
    id: "pst-offline-ta",
    subTypeCode: "OFFLINE_TA",
    subTypeName: "Offline Travel Agency",
    parentPartyType: "Travel Agent",
    description: "Local Travel Agencies, Tour Operators & Destination Management Companies",
    seqNo: 2,
    activeStatus: true,
    allowDirectSettlement: true,
    commissionRatePct: 10.0,
    commissionCalcBase: "Room Only Rate",
    allowNegotiatedRates: true,
    defaultDiscountPct: 5.0,
    creditLimitOverride: 300000.0,
    creditDaysOverride: 15,
    requireSecurityDeposit: true,
    lateFeePct: 18.0,
    contractExpiryDate: "31/03/2027",
    statutoryRegMandatory: true,
    blacklistingAllowed: true,
    signBy: "Travel Trade Manager",
    updatedBy: "System Auditor",
    updatedDate: "30/07/2026 11:20",
  },
  {
    id: "pst-mnc",
    subTypeCode: "MNC",
    subTypeName: "MNC Corporate Client",
    parentPartyType: "Corporate Client",
    description: "Multinational Corporations & Listed Enterprise Companies",
    seqNo: 3,
    activeStatus: true,
    allowDirectSettlement: true,
    commissionRatePct: 0.0,
    commissionCalcBase: "Fixed Amount",
    allowNegotiatedRates: true,
    defaultDiscountPct: 20.0,
    creditLimitOverride: 1500000.0,
    creditDaysOverride: 45,
    requireSecurityDeposit: false,
    lateFeePct: 12.0,
    contractExpiryDate: "31/03/2027",
    statutoryRegMandatory: true,
    blacklistingAllowed: true,
    signBy: "Corporate Sales Lead",
    updatedBy: "Jay Admin",
    updatedDate: "28/07/2026 16:40",
  },
  {
    id: "pst-fnb-supp",
    subTypeCode: "FNB_SUPP",
    subTypeName: "F&B Supplies Vendor",
    parentPartyType: "Vendor / Creditor",
    description: "Perishable Food, Meat, Dairy, Grocery & Beverage Vendors",
    seqNo: 4,
    activeStatus: true,
    allowDirectSettlement: true,
    commissionRatePct: 0.0,
    commissionCalcBase: "Fixed Amount",
    allowNegotiatedRates: false,
    defaultDiscountPct: 0.0,
    creditLimitOverride: 250000.0,
    creditDaysOverride: 30,
    requireSecurityDeposit: true,
    lateFeePct: 0.0,
    contractExpiryDate: "30/09/2026",
    statutoryRegMandatory: true,
    blacklistingAllowed: true,
    signBy: "Chef / F&B Controller",
    updatedBy: "System Auditor",
    updatedDate: "25/07/2026 10:15",
  },
  {
    id: "pst-vip",
    subTypeCode: "VIP_GUEST",
    subTypeName: "VIP / Loyalty Member",
    parentPartyType: "Guest / Customer",
    description: "Loyalty Club Members, Celebrity Guests, & High Net Worth Individuals",
    seqNo: 5,
    activeStatus: true,
    allowDirectSettlement: true,
    commissionRatePct: 0.0,
    commissionCalcBase: "Fixed Amount",
    allowNegotiatedRates: true,
    defaultDiscountPct: 15.0,
    creditLimitOverride: 100000.0,
    creditDaysOverride: 7,
    requireSecurityDeposit: false,
    lateFeePct: 0.0,
    contractExpiryDate: "Continuous",
    statutoryRegMandatory: false,
    blacklistingAllowed: true,
    signBy: "Guest Relations Manager",
    updatedBy: "Jay Admin",
    updatedDate: "20/07/2026 15:30",
  },
];
