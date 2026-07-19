import React from "react";
import type {
  HKRoom,
  HKPublicArea,
  HKInventoryItem,
  HKLaundryJob,
  HKDamageReport,
  HKRequisition,
  HKHistoryLog,
  HKLuggageJob,
  HousekeepingRequest,
  MaintenanceRequest,
  LostFoundItem,
  HKStaff,
  HKChecklistTemplate,
} from "./HousekeepingTypes";

export interface HousekeepingDispatchers {
  setRooms: React.Dispatch<React.SetStateAction<HKRoom[]>>;
  setPublicAreas: React.Dispatch<React.SetStateAction<HKPublicArea[]>>;
  setInventory: React.Dispatch<React.SetStateAction<HKInventoryItem[]>>;
  setLaundryJobs: React.Dispatch<React.SetStateAction<HKLaundryJob[]>>;
  setDamageReports: React.Dispatch<React.SetStateAction<HKDamageReport[]>>;
  setRequisitions: React.Dispatch<React.SetStateAction<HKRequisition[]>>;
  setHistory: React.Dispatch<React.SetStateAction<HKHistoryLog[]>>;
  setLuggageJobs: React.Dispatch<React.SetStateAction<HKLuggageJob[]>>;
  setRequests: React.Dispatch<React.SetStateAction<HousekeepingRequest[]>>;
  setMaintenance: React.Dispatch<React.SetStateAction<MaintenanceRequest[]>>;
  setLostFound: React.Dispatch<React.SetStateAction<LostFoundItem[]>>;
  setStaff: React.Dispatch<React.SetStateAction<HKStaff[]>>;
  setChecklists: React.Dispatch<React.SetStateAction<HKChecklistTemplate[]>>;
  setCurrentUserRole: (role: string) => void;
  setCurrentUsername: (username: string) => void;
  currentUsername: string;
}

export * from "./actions";
