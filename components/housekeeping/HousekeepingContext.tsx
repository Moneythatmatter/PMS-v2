"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type {
  HKRoom,
  HKPublicArea,
  HKChecklistTemplate,
  HKStaff,
  HKShift,
  HKInventoryItem,
  HKLaundryJob,
  HKDamageReport,
  HKRequisition,
  HKHistoryLog,
  HousekeepingRequest,
  LostFoundItem
} from "./HousekeepingTypes";

import {
  normalizeHkRoom,
} from "./roomUtils";
import * as actions from "./HousekeepingActions";
import { normalizeGuestRequest } from "./guestRequestUtils";
import {
  normalizeDamageReport,
  type DamageReportCreateInput,
} from "./damageReportUtils";
import {
  normalizeLostFoundItem,
  type LostFoundCreateInput,
} from "./lostFoundItemUtils";
import {
  hkRoomService,
  hkPublicAreaService,
  hkInventoryService,
  hkLaundryService,
  hkDamageService,
  hkRequisitionService,
  hkHistoryService,
  hkGuestRequestService,
  hkLostFoundService,
  hkStaffService,
  hkChecklistService,
  hkShiftService,
  hkDashboardService,
} from "@/services/housekeeping";

interface HousekeepingContextType {
  rooms: HKRoom[];
  publicAreas: HKPublicArea[];
  inventory: HKInventoryItem[];
  laundryJobs: HKLaundryJob[];
  damageReports: HKDamageReport[];
  requisitions: HKRequisition[];
  history: HKHistoryLog[];
  requests: HousekeepingRequest[];
  lostFound: LostFoundItem[];
  staff: HKStaff[];
  checklists: HKChecklistTemplate[];
  shifts: HKShift[];
  currentUserRole: string;
  currentUsername: string;
  loading: boolean;
  apiConnected: boolean;
  refreshFromApi: () => Promise<void>;
  setRooms: React.Dispatch<React.SetStateAction<HKRoom[]>>;
  setStaff: React.Dispatch<React.SetStateAction<HKStaff[]>>;
  setChecklists: React.Dispatch<React.SetStateAction<HKChecklistTemplate[]>>;

  // Actions
  startCleaning: (roomNo: string, staffName: string) => void;
  pauseCleaning: (roomNo: string) => void;
  resumeCleaning: (roomNo: string) => void;
  completeCleaning: (roomNo: string, progressItems: string[], photos?: string[]) => void;
  inspectRoom: (roomNo: string, passed: boolean, signature: string, remarks: string, qualityScore: number) => Promise<void>;
  changeRoomStatus: (roomNo: string, status: HKRoom["status"]) => void;
  addLostFoundItem: (item: LostFoundCreateInput) => void;
  returnLostFound: (id: string, claimBy?: string) => void;
  addHKRequest: (req: {
    room: string;
    roomId?: string;
    bookingId?: string;
    guest: string;
    issue: string;
    priority: "Low" | "Medium" | "High";
    assignedStaff: string;
    assignmentType: "Auto" | "Manual";
    remarks?: string;
  }) => void;
  assignHKRequest: (id: string, staffName: string, assignmentType: "Auto" | "Manual", reason: string) => void;
  completeHKRequest: (id: string) => void;
  updateHKRequest: (
    id: string,
    patch: {
      issue: string;
      priority: "Low" | "Medium" | "High";
      remarks?: string;
    },
  ) => void;
  addLaundryJob: (job: Omit<HKLaundryJob, "id" | "status" | "timeline">) => void;
  updateLaundryStatus: (id: string, newStatus: HKLaundryJob["status"]) => void;
  cancelLaundryJob: (id: string) => void;
  settleLaundryJob: (id: string, paymentMode: string) => void;
  addDamageReport: (report: DamageReportCreateInput) => void;
  updateDamageStatus: (id: string, status: string, actualCost?: number) => void;
  addRequisition: (req: Omit<HKRequisition, "id" | "requestNo" | "status" | "requestedAt" | "requestedBy">) => void;
  approveRequisition: (id: string) => void;
  issueRequisition: (id: string) => void;
  rejectRequisition: (id: string, remarks?: string) => void;
  discardLinenItem: (itemId: string, qty: number) => void;
  restockInventoryItem: (itemId: string, qty: number) => void;
  cleanPublicArea: (id: string, completed: boolean) => void;
  startCleaningPublicArea: (id: string) => void;
  completeCleaningPublicArea: (id: string, checkedTasks: string[], remarks: string) => void;
  verifyCleaningPublicArea: (id: string, passed: boolean, remarks: string) => void;
  assignStaffPublicArea: (id: string, housekeeper: string, supervisor: string) => void;
  blockPublicArea: (id: string, blocked: boolean) => void;
  configurePublicAreaChecklist: (category: string, items: string[], estDuration?: string, frequency?: string) => void;
  addPublicArea: (area: Omit<HKPublicArea, "id" | "checklist" | "history">) => void;
  updatePublicArea: (id: string, area: Partial<HKPublicArea>) => void;
  deletePublicArea: (id: string) => void;
  setRole: (role: string) => void;
  resetState: () => void;
  logAudit: (category: HKHistoryLog["category"], action: string, details: string, roomNo?: string) => void;
}

const HousekeepingContext = createContext<HousekeepingContextType | undefined>(undefined);

export function HousekeepingProvider({ children }: { children: React.ReactNode }) {
  const [rooms, setRooms] = useState<HKRoom[]>([]);
  const [publicAreas, setPublicAreas] = useState<HKPublicArea[]>([]);
  const [inventory, setInventory] = useState<HKInventoryItem[]>([]);
  const [laundryJobs, setLaundryJobs] = useState<HKLaundryJob[]>([]);
  const [damageReports, setDamageReports] = useState<HKDamageReport[]>([]);
  const [requisitions, setRequisitions] = useState<HKRequisition[]>([]);
  const [history, setHistory] = useState<HKHistoryLog[]>([]);
  const [requests, setRequests] = useState<HousekeepingRequest[]>([]);
  const [lostFound, setLostFound] = useState<LostFoundItem[]>([]);
  const [staff, setStaff] = useState<HKStaff[]>([]);
  const [checklists, setChecklists] = useState<HKChecklistTemplate[]>([]);
  const [shifts, setShifts] = useState<HKShift[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState("Executive Housekeeper");
  const [currentUsername, setCurrentUsername] = useState("Admin User");

  const [loading, setLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);

  const roleToUsername = (role: string) =>
    role === "Housekeeper"
      ? "Meena Kumari"
      : role === "Supervisor"
        ? "Ramesh Kumar"
        : role === "Laundry Staff"
          ? "Somnath Sen"
          : role === "Engineering Staff"
            ? "Suresh Gupta"
            : "Admin User";

  const applyEmptyState = () => {
    setRooms([]);
    setPublicAreas([]);
    setInventory([]);
    setLaundryJobs([]);
    setDamageReports([]);
    setRequisitions([]);
    setHistory([]);
    setRequests([]);
    setLostFound([]);
    setStaff([]);
    setChecklists([]);
    setShifts([]);
  };

  const refreshFromApi = async () => {
    setLoading(true);
    try {
      const settled = await Promise.allSettled([
        hkDashboardService.get(),
        hkRoomService.list(),
        hkPublicAreaService.list(),
        hkInventoryService.list(),
        hkLaundryService.list(),
        hkDamageService.list(),
        hkRequisitionService.list(),
        hkHistoryService.list(),
        hkGuestRequestService.list(),
        hkLostFoundService.list(),
        hkStaffService.list(),
        hkChecklistService.list(),
        hkShiftService.list(),
      ]);

      const value = <T,>(i: number, fallback: T): T => {
        const r = settled[i];
        return r.status === "fulfilled" ? (r.value as T) : fallback;
      };

      const anyOk = settled.some((r) => r.status === "fulfilled");
      if (!anyOk) {
        throw new Error("All housekeeping API calls failed");
      }

      const apiRooms = value<HKRoom[]>(1, []);
      setRooms(apiRooms.map((r) => normalizeHkRoom(r)));
      setPublicAreas(value(2, []));
      setInventory(value(3, []));
      setLaundryJobs(value<HKLaundryJob[]>(4, []));
      setDamageReports(
        value<import("./damageReportUtils").DamageReportDto[]>(5, []).map(
          normalizeDamageReport,
        ),
      );
      setRequisitions(value(6, []));
      setHistory(value(7, []));
      setRequests(
        value<import("./guestRequestUtils").GuestRequestDto[]>(8, []).map(
          normalizeGuestRequest,
        ),
      );
      setLostFound(
        value<import("./lostFoundItemUtils").LostFoundItemDto[]>(9, []).map(
          normalizeLostFoundItem,
        ),
      );
      setStaff(value(10, []));
      setChecklists(value(11, []));
      setShifts(value(12, []));
      setApiConnected(true);
    } catch (e) {
      console.warn("[HK] API unavailable", e);
      setApiConnected(false);
      applyEmptyState();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const role = "Executive Housekeeper";
    setCurrentUserRole(role);
    setCurrentUsername(roleToUsername(role));
    void refreshFromApi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Group dispatchers for the moved actions
  const dispatchers: actions.HousekeepingDispatchers = {
    rooms,
    setRooms,
    setPublicAreas,
    setInventory,
    setLaundryJobs,
    setDamageReports,
    setRequisitions,
    setHistory,
    setRequests,
    setLostFound,
    setStaff,
    setChecklists,
    setCurrentUserRole,
    setCurrentUsername,
    currentUsername
  };

  const logAudit = (category: HKHistoryLog["category"], action: string, details: string, roomNo?: string) => {
    actions.logAudit(category, action, details, roomNo, currentUsername, setHistory);
  };

  const startCleaning = (roomNo: string, housekeeper: string) => {
    actions.startCleaning(roomNo, housekeeper, dispatchers);
  };

  const pauseCleaning = (roomNo: string) => {
    actions.pauseCleaning(roomNo, dispatchers);
  };

  const resumeCleaning = (roomNo: string) => {
    actions.resumeCleaning(roomNo, dispatchers);
  };

  const completeCleaning = (roomNo: string, progressItems: string[], photos?: string[]) => {
    actions.completeCleaning(roomNo, progressItems, dispatchers, photos);
  };

  const inspectRoom = (roomNo: string, passed: boolean, signature: string, remarks: string, qualityScore: number) =>
    actions.inspectRoom(roomNo, passed, signature, remarks, qualityScore, dispatchers);

  const changeRoomStatus = (roomNo: string, status: HKRoom["status"]) => {
    actions.changeRoomStatus(roomNo, status, dispatchers);
  };

  const addLostFoundItem = (item: LostFoundCreateInput) => {
    actions.addLostFoundItem(item, dispatchers);
  };

  const returnLostFound = (id: string, claimBy?: string) => {
    actions.returnLostFound(id, lostFound, claimBy, dispatchers);
  };

  const addHKRequest = (req: {
    room: string;
    roomId?: string;
    bookingId?: string;
    guest: string;
    issue: string;
    priority: "Low" | "Medium" | "High";
    assignedStaff: string;
    assignmentType: "Auto" | "Manual";
    remarks?: string;
  }) => {
    actions.addHKRequest(req, requests.length, dispatchers);
  };

  const assignHKRequest = (id: string, staffName: string, assignmentType: "Auto" | "Manual", reason: string) => {
    actions.assignHKRequest(id, staffName, assignmentType, reason, requests, dispatchers);
  };

  const completeHKRequest = (id: string) => {
    actions.completeHKRequest(id, requests, dispatchers);
  };

  const updateHKRequest = (
    id: string,
    patch: {
      issue: string;
      priority: "Low" | "Medium" | "High";
      remarks?: string;
    },
  ) => {
    actions.updateHKRequest(id, patch, dispatchers);
  };

  const addLaundryJob = (job: Omit<HKLaundryJob, "id" | "status" | "timeline">) => {
    actions.addLaundryJob(job, laundryJobs.length, dispatchers);
  };

  const updateLaundryStatus = (id: string, newStatus: HKLaundryJob["status"]) => {
    actions.updateLaundryStatus(id, newStatus, laundryJobs, dispatchers);
  };

  const cancelLaundryJob = (id: string) => {
    actions.cancelLaundryJob(id, dispatchers);
  };

  const settleLaundryJob = (id: string, paymentMode: string) => {
    actions.settleLaundryJob(id, paymentMode, laundryJobs, dispatchers);
  };

  const addDamageReport = (report: DamageReportCreateInput) => {
    actions.addDamageReport(report, dispatchers);
  };

  const updateDamageStatus = (
    id: string,
    status: string,
    actualCost?: number,
  ) => {
    actions.updateDamageStatus(id, status, damageReports, dispatchers, actualCost);
  };

  const addRequisition = (req: Omit<HKRequisition, "id" | "requestNo" | "status" | "requestedAt" | "requestedBy">) => {
    actions.addRequisition(req, requisitions.length, dispatchers);
  };

  const approveRequisition = (id: string) => {
    actions.approveRequisition(id, requisitions, dispatchers);
  };

  const issueRequisition = (id: string) => {
    actions.issueRequisition(id, requisitions, dispatchers);
  };

  const rejectRequisition = (id: string, remarks?: string) => {
    actions.rejectRequisition(id, requisitions, remarks, dispatchers);
  };

  const discardLinenItem = (itemId: string, qty: number) => {
    actions.discardLinenItem(itemId, qty, inventory, dispatchers);
  };

  const restockInventoryItem = (itemId: string, qty: number) => {
    actions.restockInventoryItem(itemId, qty, inventory, dispatchers);
  };

  const cleanPublicArea = (id: string, completed: boolean) => {
    actions.cleanPublicArea(id, completed, publicAreas, dispatchers);
  };

  const startCleaningPublicArea = (id: string) => {
    actions.startCleaningPublicArea(id, publicAreas, dispatchers);
  };

  const completeCleaningPublicArea = (id: string, checkedTasks: string[], remarks: string) => {
    actions.completeCleaningPublicArea(id, checkedTasks, remarks, publicAreas, dispatchers);
  };

  const verifyCleaningPublicArea = (id: string, approved: boolean, remarks: string) => {
    actions.verifyCleaningPublicArea(id, approved, remarks, publicAreas, dispatchers);
  };

  const assignStaffPublicArea = (id: string, housekeeper: string, supervisor: string) => {
    actions.assignStaffPublicArea(id, housekeeper, supervisor, publicAreas, dispatchers);
  };

  const blockPublicArea = (id: string, blocked: boolean) => {
    actions.blockPublicArea(id, blocked, publicAreas, dispatchers);
  };

  const configurePublicAreaChecklist = (category: string, items: string[], estDuration?: string, frequency?: string) => {
    actions.configurePublicAreaChecklist(category, items, estDuration, frequency, dispatchers);
  };

  const addPublicArea = (area: Omit<HKPublicArea, "id" | "checklist" | "history">) => {
    actions.addPublicArea(area, dispatchers);
  };

  const updatePublicArea = (id: string, areaFields: Partial<HKPublicArea>) => {
    actions.updatePublicArea(id, areaFields, publicAreas, dispatchers);
  };

  const deletePublicArea = (id: string) => {
    actions.deletePublicArea(id, publicAreas, dispatchers);
  };

  const setRole = (role: string) => {
    actions.setRole(role, dispatchers);
  };

  const resetState = () => {
    actions.resetState(dispatchers);
  };

  // Simple tick loop to increment active room timers
  useEffect(() => {
    const timer = setInterval(() => {
      setRooms((prev) => {
        let changed = false;
        const next = prev.map((r) => {
          if (r.status === "Cleaning" && r.cleaningTimer && !r.cleaningTimer.paused) {
            changed = true;
            const elapsed = r.cleaningTimer.elapsedSeconds + 1;
            const progress = Math.min(95, 10 + Math.floor(elapsed / 10)); // Caps at 95% until finalized
            return {
              ...r,
              cleaningProgress: progress,
              cleaningTimer: {
                ...r.cleaningTimer,
                elapsedSeconds: elapsed,
                lastTick: new Date().toISOString(),
              },
            };
          }
          return r;
        });
        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <HousekeepingContext.Provider
      value={{
        rooms,
        publicAreas,
        inventory,
        laundryJobs,
        damageReports,
        requisitions,
        history,
        requests,
        lostFound,
        staff,
        checklists,
        shifts,
        currentUserRole,
        currentUsername,
        loading,
        apiConnected,
        refreshFromApi,
        setRooms,
        setStaff,
        setChecklists,

        startCleaning,
        pauseCleaning,
        resumeCleaning,
        completeCleaning,
        inspectRoom,
        changeRoomStatus,
        addLostFoundItem,
        returnLostFound,
        addHKRequest,
        assignHKRequest,
        completeHKRequest,
        updateHKRequest,
        addLaundryJob,
        updateLaundryStatus,
        cancelLaundryJob,
        settleLaundryJob,
        addDamageReport,
        updateDamageStatus,
        addRequisition,
        approveRequisition,
        issueRequisition,
        rejectRequisition,
        discardLinenItem,
        restockInventoryItem,
        cleanPublicArea,
        startCleaningPublicArea,
        completeCleaningPublicArea,
        verifyCleaningPublicArea,
        assignStaffPublicArea,
        blockPublicArea,
        configurePublicAreaChecklist,
        addPublicArea,
        updatePublicArea,
        deletePublicArea,
        setRole,
        resetState,
        logAudit,
      }}
    >
      {children}
    </HousekeepingContext.Provider>
  );
}

export function useHousekeeping() {
  const context = useContext(HousekeepingContext);
  if (context === undefined) {
    throw new Error("useHousekeeping must be used within a HousekeepingProvider");
  }
  return context;
}
