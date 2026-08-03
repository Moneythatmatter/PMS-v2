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
  HKLuggageJob,
  HousekeepingRequest,
  MaintenanceRequest,
  LostFoundItem
} from "./HousekeepingTypes";

import {
  initialHKRooms,
  initialHKPublicAreas,
  initialHKChecklistTemplates,
  initialHKStaff,
  initialHKShifts,
  initialHKInventory,
  initialHKLaundry,
  initialHKDamageReports,
  initialHKRequisitions,
  initialHKHistory,
  initialHKLuggageJobs
} from "@/app/data/housekeepingData"


import * as actions from "./HousekeepingActions";
import {
  hkRoomService,
  hkPublicAreaService,
  hkInventoryService,
  hkLaundryService,
  hkDamageService,
  hkRequisitionService,
  hkHistoryService,
  hkLuggageService,
  hkGuestRequestService,
  hkMaintenanceService,
  hkLostFoundService,
  hkStaffService,
  hkChecklistService,
  hkShiftService,
  hkDashboardService,
} from "@/services/housekeeping";

const initialHKRequests: HousekeepingRequest[] = [];
const initialMaintenanceRequests: MaintenanceRequest[] = [];
const initialLostFoundItems: LostFoundItem[] = [];

interface HousekeepingContextType {
  rooms: HKRoom[];
  publicAreas: HKPublicArea[];
  inventory: HKInventoryItem[];
  laundryJobs: HKLaundryJob[];
  damageReports: HKDamageReport[];
  requisitions: HKRequisition[];
  history: HKHistoryLog[];
  luggageJobs: HKLuggageJob[];
  requests: HousekeepingRequest[];
  maintenance: MaintenanceRequest[];
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
  completeCleaning: (roomNo: string, progressItems: string[]) => void;
  inspectRoom: (roomNo: string, passed: boolean, signature: string, remarks: string, qualityScore: number) => void;
  changeRoomStatus: (roomNo: string, status: HKRoom["status"]) => void;
  addLostFoundItem: (item: Omit<LostFoundItem, "id" | "foundDate" | "status">) => void;
  returnLostFound: (id: string, claimBy?: string) => void;
  addHKRequest: (req: {
    room: string;
    guest: string;
    issue: string;
    priority: "Low" | "Medium" | "High";
    assignedStaff: string;
    assignmentType: "Auto" | "Manual";
  }) => void;
  assignHKRequest: (id: string, staffName: string, assignmentType: "Auto" | "Manual", reason: string) => void;
  completeHKRequest: (id: string) => void;
  addMaintenanceRequest: (req: {
    room: string;
    problem: string;
    priority: "Low" | "Medium" | "High" | "Critical";
    engineer: string;
    assignmentType: "Auto" | "Manual";
    estimatedCompletion?: string;
    attachments?: { name: string; type: "image" | "pdf" | "video"; url: string }[];
  }) => void;
  assignMaintenanceRequest: (id: string, engineerName: string, assignmentType: "Auto" | "Manual", reason: string) => void;
  startMaintenanceRepair: (id: string) => void;
  completeMaintenanceRequest: (id: string) => void;
  verifyMaintenanceRequest: (id: string) => void;
  addLaundryJob: (job: Omit<HKLaundryJob, "id" | "status" | "timeline">) => void;
  updateLaundryStatus: (id: string, newStatus: HKLaundryJob["status"]) => void;
  addLuggageJob: (job: Omit<HKLuggageJob, "id" | "status" | "pickupTime">) => void;
  deliverLuggage: (id: string) => void;
  addDamageReport: (report: Omit<HKDamageReport, "id" | "reportedAt" | "status" | "reportedBy">) => void;
  updateDamageStatus: (id: string, status: HKDamageReport["status"]) => void;
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
  const [luggageJobs, setLuggageJobs] = useState<HKLuggageJob[]>([]);
  const [requests, setRequests] = useState<HousekeepingRequest[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>([]);
  const [lostFound, setLostFound] = useState<LostFoundItem[]>([]);
  const [staff, setStaff] = useState<HKStaff[]>([]);
  const [checklists, setChecklists] = useState<HKChecklistTemplate[]>([]);
  const [shifts, setShifts] = useState<HKShift[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState("Executive Housekeeper");
  const [currentUsername, setCurrentUsername] = useState("Admin User");

  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);

  const hydrateFromLocal = () => {
    const getOrInit = <T,>(key: string, initial: T): T => {
      const val = localStorage.getItem(key);
      if (val) return JSON.parse(val);
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    };

    setRooms(getOrInit("hk_rooms", initialHKRooms));

    const loadedPublicAreas = getOrInit("hk_publicAreas", initialHKPublicAreas);
    const verifiedPublicAreas = loadedPublicAreas.map((area: any) => {
      const defaultArea =
        initialHKPublicAreas.find((a) => a.id === area.id) ||
        initialHKPublicAreas[0];
      return {
        ...defaultArea,
        ...area,
        checklist: area.checklist || defaultArea.checklist || [],
        history: area.history || defaultArea.history || [],
      };
    });
    setPublicAreas(verifiedPublicAreas);

    setInventory(getOrInit("hk_inventory", initialHKInventory));
    setLaundryJobs(getOrInit("hk_laundry", initialHKLaundry));
    setDamageReports(getOrInit("hk_damages", initialHKDamageReports));
    setRequisitions(getOrInit("hk_requisitions", initialHKRequisitions));
    setHistory(getOrInit("hk_history", initialHKHistory));
    setLuggageJobs(getOrInit("hk_luggage", initialHKLuggageJobs));
    setRequests(getOrInit("hk_requests", initialHKRequests));
    const loadedMaint = getOrInit("hk_maintenance", initialMaintenanceRequests);
    const uniqueMaint = Array.isArray(loadedMaint)
      ? loadedMaint.filter(
          (item: any, index: number, self: any[]) =>
            index === self.findIndex((t: any) => t.id === item.id),
        )
      : loadedMaint;
    setMaintenance(uniqueMaint);
    setLostFound(getOrInit("hk_lostfound", initialLostFoundItems));
    setStaff(getOrInit("hk_staff", initialHKStaff));
    setChecklists(getOrInit("hk_checklists", initialHKChecklistTemplates));
    setShifts(getOrInit("hk_shifts", initialHKShifts));
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
        hkLuggageService.list(),
        hkGuestRequestService.list(),
        hkMaintenanceService.list(),
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
      setRooms(
        apiRooms.map((r) => ({
          ...r,
          roomNo: String(r.roomNo || (r as { id?: string }).id || ""),
        })),
      );
      setPublicAreas(value(2, initialHKPublicAreas));
      setInventory(value(3, initialHKInventory));
      setLaundryJobs(value(4, initialHKLaundry));
      setDamageReports(value(5, initialHKDamageReports));
      setRequisitions(value(6, initialHKRequisitions));
      setHistory(value(7, initialHKHistory));
      setLuggageJobs(value(8, initialHKLuggageJobs));
      setRequests(value(9, initialHKRequests) as HousekeepingRequest[]);
      setMaintenance(value(10, initialMaintenanceRequests) as MaintenanceRequest[]);
      setLostFound(value(11, initialLostFoundItems) as LostFoundItem[]);
      setStaff(value(12, initialHKStaff));
      setChecklists(value(13, initialHKChecklistTemplates));
      setShifts(value(14, initialHKShifts));
      setApiConnected(true);
    } catch (e) {
      console.warn("[HK] API unavailable — falling back to local data", e);
      setApiConnected(false);
      hydrateFromLocal();
    } finally {
      setLoading(false);
      setHydrated(true);
    }
  };

  // Bootstrap from backend (FO/F&B style); localStorage is fallback only
  useEffect(() => {
    try {
      const role = localStorage.getItem("hk_role") || "Executive Housekeeper";
      setCurrentUserRole(role);
      setCurrentUsername(
        role === "Housekeeper"
          ? "Meena Kumari"
          : role === "Supervisor"
            ? "Ramesh Kumar"
            : role === "Laundry Staff"
              ? "Somnath Sen"
              : role === "Engineering Staff"
                ? "Suresh Gupta"
                : "Admin User",
      );
    } catch {
      /* ignore */
    }
    void refreshFromApi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Window storage sync listener to keep tabs synchronized in real-time
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key) return;
      try {
        if (e.key === "hk_rooms" && e.newValue) setRooms(JSON.parse(e.newValue));
        if (e.key === "hk_publicAreas" && e.newValue) setPublicAreas(JSON.parse(e.newValue));
        if (e.key === "hk_inventory" && e.newValue) setInventory(JSON.parse(e.newValue));
        if (e.key === "hk_laundry" && e.newValue) setLaundryJobs(JSON.parse(e.newValue));
        if (e.key === "hk_damages" && e.newValue) setDamageReports(JSON.parse(e.newValue));
        if (e.key === "hk_requisitions" && e.newValue) setRequisitions(JSON.parse(e.newValue));
        if (e.key === "hk_history" && e.newValue) setHistory(JSON.parse(e.newValue));
        if (e.key === "hk_luggage" && e.newValue) setLuggageJobs(JSON.parse(e.newValue));
        if (e.key === "hk_requests" && e.newValue) setRequests(JSON.parse(e.newValue));
        if (e.key === "hk_maintenance" && e.newValue) setMaintenance(JSON.parse(e.newValue));
        if (e.key === "hk_lostfound" && e.newValue) setLostFound(JSON.parse(e.newValue));
        if (e.key === "hk_staff" && e.newValue) setStaff(JSON.parse(e.newValue));
        if (e.key === "hk_checklists" && e.newValue) setChecklists(JSON.parse(e.newValue));
        if (e.key === "hk_shifts" && e.newValue) setShifts(JSON.parse(e.newValue));
      } catch (err) {
        console.error("Storage change sync error", err);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("hk_rooms", JSON.stringify(rooms));
  }, [rooms, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("hk_publicAreas", JSON.stringify(publicAreas));
  }, [publicAreas, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("hk_inventory", JSON.stringify(inventory));
  }, [inventory, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("hk_laundry", JSON.stringify(laundryJobs));
  }, [laundryJobs, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("hk_damages", JSON.stringify(damageReports));
  }, [damageReports, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("hk_requisitions", JSON.stringify(requisitions));
  }, [requisitions, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("hk_history", JSON.stringify(history));
  }, [history, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("hk_luggage", JSON.stringify(luggageJobs));
  }, [luggageJobs, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("hk_requests", JSON.stringify(requests));
  }, [requests, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("hk_maintenance", JSON.stringify(maintenance));
  }, [maintenance, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("hk_lostfound", JSON.stringify(lostFound));
  }, [lostFound, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("hk_staff", JSON.stringify(staff));
  }, [staff, hydrated]);

  // Group dispatchers for the moved actions
  const dispatchers: actions.HousekeepingDispatchers = {
    setRooms,
    setPublicAreas,
    setInventory,
    setLaundryJobs,
    setDamageReports,
    setRequisitions,
    setHistory,
    setLuggageJobs,
    setRequests,
    setMaintenance,
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

  const completeCleaning = (roomNo: string, progressItems: string[]) => {
    actions.completeCleaning(roomNo, progressItems, dispatchers);
  };

  const inspectRoom = (roomNo: string, passed: boolean, signature: string, remarks: string, qualityScore: number) => {
    actions.inspectRoom(roomNo, passed, signature, remarks, qualityScore, dispatchers);
  };

  const changeRoomStatus = (roomNo: string, status: HKRoom["status"]) => {
    actions.changeRoomStatus(roomNo, status, dispatchers);
  };

  const addLostFoundItem = (item: Omit<LostFoundItem, "id" | "foundDate" | "status">) => {
    actions.addLostFoundItem(item, lostFound.length, dispatchers);
  };

  const returnLostFound = (id: string, claimBy?: string) => {
    actions.returnLostFound(id, lostFound, claimBy, dispatchers);
  };

  const addHKRequest = (req: {
    room: string;
    guest: string;
    issue: string;
    priority: "Low" | "Medium" | "High";
    assignedStaff: string;
    assignmentType: "Auto" | "Manual";
  }) => {
    actions.addHKRequest(req, requests.length, dispatchers);
  };

  const assignHKRequest = (id: string, staffName: string, assignmentType: "Auto" | "Manual", reason: string) => {
    actions.assignHKRequest(id, staffName, assignmentType, reason, requests, dispatchers);
  };

  const completeHKRequest = (id: string) => {
    actions.completeHKRequest(id, requests, dispatchers);
  };

  const addMaintenanceRequest = (req: {
    room: string;
    problem: string;
    priority: "Low" | "Medium" | "High" | "Critical";
    engineer: string;
    assignmentType: "Auto" | "Manual";
    estimatedCompletion?: string;
    attachments?: { name: string; type: "image" | "pdf" | "video"; url: string }[];
  }) => {
    actions.addMaintenanceRequest(req, maintenance.length, dispatchers);
  };

  const assignMaintenanceRequest = (id: string, engineerName: string, assignmentType: "Auto" | "Manual", reason: string) => {
    actions.assignMaintenanceRequest(id, engineerName, assignmentType, reason, maintenance, dispatchers);
  };

  const startMaintenanceRepair = (id: string) => {
    actions.startMaintenanceRepair(id, maintenance, dispatchers);
  };

  const completeMaintenanceRequest = (id: string) => {
    actions.completeMaintenanceRequest(id, maintenance, dispatchers);
  };

  const verifyMaintenanceRequest = (id: string) => {
    actions.verifyMaintenanceRequest(id, maintenance, dispatchers);
  };

  const addLaundryJob = (job: Omit<HKLaundryJob, "id" | "status" | "timeline">) => {
    actions.addLaundryJob(job, laundryJobs.length, dispatchers);
  };

  const updateLaundryStatus = (id: string, newStatus: HKLaundryJob["status"]) => {
    actions.updateLaundryStatus(id, newStatus, laundryJobs, dispatchers);
  };

  const addLuggageJob = (job: Omit<HKLuggageJob, "id" | "status" | "pickupTime">) => {
    actions.addLuggageJob(job, luggageJobs.length, dispatchers);
  };

  const deliverLuggage = (id: string) => {
    actions.deliverLuggage(id, luggageJobs, dispatchers);
  };

  const addDamageReport = (report: Omit<HKDamageReport, "id" | "reportedAt" | "status" | "reportedBy">) => {
    actions.addDamageReport(report, damageReports.length, dispatchers);
  };

  const updateDamageStatus = (id: string, status: HKDamageReport["status"]) => {
    actions.updateDamageStatus(id, status, damageReports, dispatchers);
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
        luggageJobs,
        requests,
        maintenance,
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
        addMaintenanceRequest,
        assignMaintenanceRequest,
        startMaintenanceRepair,
        completeMaintenanceRequest,
        verifyMaintenanceRequest,
        addLaundryJob,
        updateLaundryStatus,
        addLuggageJob,
        deliverLuggage,
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
