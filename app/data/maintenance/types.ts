export type PriorityLevel = "Low" | "Medium" | "High" | "Critical";

export type RequestStatus =
  | "New"
  | "In Review"
  | "Work Order Created"
  | "Resolved"
  | "Closed"
  | "Cancelled";

export type WorkOrderStatus =
  | "Assigned"
  | "In Progress"
  | "Awaiting Parts"
  | "Completed"
  | "Verified"
  | "Closed"
  | "Cancelled";

export type AssetStatus =
  | "Operational"
  | "Under Maintenance"
  | "Out of Service"
  | "Decommissioned";

export type RoomBlockType = "OOO" | "OOS"; // Out of Order (Cannot Sell) vs Out of Service (Temporary Servicing)

export type EntryPreference =
  | "Call Guest First"
  | "Guest Permission Confirmed"
  | "Enter When Guest Absent"
  | "Coordinate with Duty Manager";

export interface SnagIssue {
  id: string;
  category: string;
  issue: string;
  priority: PriorityLevel;
  description?: string;
  isResolved?: boolean;
}

export interface MaintenanceRequest {
  id: string;
  requestNo: string;
  dateTime: string;
  locationType: "Guest Room" | "F&B Area" | "Public Area" | "Back of House";
  location: string;
  category: string;
  issueTitle: string;
  description: string;
  snagIssues?: SnagIssue[];
  reportedBy: string;
  reportedDept: string;
  priority: PriorityLevel;
  isSafetyHazard: boolean;
  guestInRoom: "Yes" | "No" | "Unknown";
  entryPreference: EntryPreference;
  status: RequestStatus;
  workOrderNo?: string;
  attachmentName?: string;
  createdAt: string;
}

export interface WorkOrderItem {
  id: string;
  description: string;
  completed: boolean;
}

export interface SparePartUsed {
  id: string;
  partName: string;
  productCode: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface WorkOrder {
  id: string;
  woNumber: string;
  requestRef?: string;
  woType: "Breakdown" | "Preventive" | "Guest Request" | "Snagging" | "Event Prep";
  location: string;
  locationType: "Guest Room" | "F&B Area" | "Public Area" | "Back of House";
  roomBlockType?: RoomBlockType;
  issue: string;
  description?: string;
  checklistItems?: WorkOrderItem[];
  priority: PriorityLevel;
  isSafetyHazard: boolean;
  guestInRoom?: "Yes" | "No" | "Unknown";
  entryPreference?: EntryPreference;
  assignedType: "In-House Staff" | "External Vendor";
  technicianName: string;
  technicianContact?: string;
  technicianDept?: string;
  vendorName?: string;
  serviceReference?: string;
  assetCode?: string;
  assetName?: string;
  dueDate: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  status: WorkOrderStatus;
  rootCause?: string;
  actionTaken?: string;
  partsUsed?: SparePartUsed[];
  partsCost: number;
  externalServiceCost: number;
  totalCost: number;
  verifiedBy?: string;
  verificationNotes?: string;
  timeline: {
    time: string;
    action: string;
    user: string;
  }[];
}

export interface PreventiveTask {
  id: string;
  assetCode: string;
  assetName: string;
  category: string;
  location: string;
  taskTitle: string;
  frequency: "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Annually";
  nextDueDate: string;
  lastCompletedDate?: string;
  assignedTo: string;
  assignedType: "In-House Staff" | "External Vendor";
  status: "Due" | "Upcoming" | "Overdue" | "Completed";
  progressPct?: number;
}

export interface RoomUnderMaintenance {
  id: string;
  roomNumber: string;
  floor: string;
  roomType: string;
  blockType: RoomBlockType; // OOO or OOS
  reason: string;
  reportedAt: string;
  expectedHandover: string;
  technician: string;
  workOrderNo: string;
  hkHandoverStatus: "Under Repair" | "Post-Maintenance Cleaning Req." | "HK Cleaning" | "Inspected / Ready";
}

export interface MaintenanceDashboardStats {
  openRequests: {
    total: number;
    newCount: number;
    inReviewCount: number;
  };
  activeWorkOrders: {
    total: number;
    inProgress: number;
    awaitingParts: number;
  };
  criticalIssues: {
    total: number;
    safetyHazardCount: number;
  };
  pmDueToday: {
    totalDue: number;
    completed: number;
    pending: number;
  };
  roomsUnderMaintenance: {
    total: number;
    oooCount: number;
    oosCount: number;
  };
}
