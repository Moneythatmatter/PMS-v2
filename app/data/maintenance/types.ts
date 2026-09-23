export type PriorityLevel = "Low" | "Medium" | "High" | "Critical";

export type RequestStatus =
  | "New"
  | "Verification"
  | "Verified"
  | "Approved"
  | "Work Order Created"
  | "Closed"
  | "Rejected"
  | "Cancelled"
  | "In Review"
  | "Resolved";

export type WorkOrderStatus =
  | "New"
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

export type ExecutionMethod = "In-House" | "Outsource";

export type ProblemConfirmation = "Yes" | "No" | "Partially";

export interface RequiredMaterialItem {
  id: string;
  itemName: string;
  quantity: number;
  unit?: string;
}

export interface RequestVerification {
  problemConfirmed: ProblemConfirmation | boolean;
  findings: string;
  recommendedWork: string;
  requiredMaterials?: string;
  materialsList?: RequiredMaterialItem[];
  estimatedBudget?: number;
  executionMethod?: ExecutionMethod;
  notes?: string;
  attachmentName?: string;
  verifiedBy: string;
  verifiedAt: string;
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
  verification?: RequestVerification;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  timeline?: {
    time: string;
    action: string;
    user: string;
  }[];
}

export type WorkOrderType = "Corrective" | "Preventive" | "Emergency";

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
  storesReference?: string;
}

export interface MaintenanceVendor {
  id: string;
  vendorCode: string;
  vendorName: string;
  serviceCategory: string;
  contactPerson: string;
  phone: string;
  email: string;
  address?: string;
  serviceType: "AMC" | "On-Demand" | "Rate Contract" | "Warranty";
  serviceReference?: string; // AMC Contract / Reference No.
  contractStartDate?: string;
  contractEndDate?: string;
  notes?: string;
  status: "Active" | "Inactive";
  createdAt?: string;
}

export interface WorkOrderProgressUpdate {
  id: string;
  date: string;
  time: string;
  user: string;
  status: WorkOrderStatus;
  remarks: string;
  partsWaiting?: string;
  attachmentName?: string;
}

export interface WorkOrderTimelineEvent {
  time: string;
  date?: string;
  action: string;
  user: string;
  statusBadge?: string;
  remark?: string;
}

export interface WorkOrder {
  id: string;
  woNumber: string;
  requestRef?: string;
  sourceRef?: string; // e.g. PM-089
  woType: WorkOrderType | "Breakdown" | "Guest Request" | "Snagging" | "Event Prep";
  location: string;
  locationType: "Guest Room" | "F&B Area" | "Public Area" | "Back of House";
  roomBlockType?: RoomBlockType;
  problemCategory?: string;
  issue: string;
  description?: string;
  snagIssues?: SnagIssue[];
  checklistItems?: WorkOrderItem[];
  priority: PriorityLevel;
  isSafetyHazard: boolean;
  guestInRoom?: "Yes" | "No" | "Unknown";
  entryPreference?: EntryPreference;
  executionMethod?: ExecutionMethod;
  assignedType: "In-House Staff" | "External Vendor";
  technicianName: string;
  technicianContact?: string;
  technicianDept?: string;
  // Outsource Vendor fields
  maintenanceVendorId?: string;
  maintenanceVendorName?: string;
  externalTechnicianName?: string;
  vendorContact?: string;
  vendorName?: string; // legacy support
  serviceReference?: string;
  vendorServiceRef?: string;
  agreedAmount?: number;
  expectedCompletionDate?: string;
  expectedCompletionTime?: string;
  vendorNotes?: string;
  assignmentNotes?: string;
  // Request Verified Inherited Data
  verificationFindings?: string;
  recommendedWork?: string;
  requiredMaterials?: string;
  materialsList?: RequiredMaterialItem[];
  estimatedBudget?: number;
  // Asset fields
  assetCode?: string;
  assetName?: string;
  // Scheduling & Dates
  scheduledDate?: string;
  scheduledTime?: string;
  dueDate: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  startTime?: string;
  completionTime?: string;
  // Status & Completion
  status: WorkOrderStatus;
  rootCause?: string;
  actionTaken?: string;
  completionNotes?: string;
  partsUsed?: SparePartUsed[];
  partsCost: number;
  externalServiceCost: number;
  totalCost: number;
  postCleaningRequired?: boolean;
  hkHandoverStatus?: "Under Repair" | "Post-Maintenance Cleaning Req." | "HK Cleaning" | "Inspected / Ready";
  // Verification
  verifiedBy?: string;
  verifiedAt?: string;
  verificationResult?: "Pass" | "Needs Rework";
  verificationNotes?: string;
  // Progress & Activity History
  progressUpdates?: WorkOrderProgressUpdate[];
  attachmentName?: string;
  reopenedReason?: string;
  cancelReason?: string;
  timeline: WorkOrderTimelineEvent[];
}

export type PMScheduleStatus = "Upcoming" | "Due" | "Overdue" | "Inactive";

export type PMFrequency = "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Yearly";

export interface PMTaskTemplate {
  id: string;
  templateCode: string;
  templateTitle: string;
  category: string;
  defaultFrequency: PMFrequency;
  checklist: string[];
  estimatedHours?: number;
  safetyNote?: string;
  status: "Active" | "Inactive";
}

export interface PMHistoryRecord {
  id: string;
  date: string;
  workOrderNo: string;
  status: "Completed" | "Verified" | "Closed";
  technicianOrVendor: string;
  notes?: string;
  completedAt?: string;
}

export interface PMSchedule {
  id: string;
  pmNumber: string; // e.g. PM-001
  assetCode: string;
  assetName: string;
  category: string;
  location: string;
  locationType?: "Guest Room" | "F&B Area" | "Public Area" | "Back of House";
  templateId?: string;
  taskTitle: string;
  checklist?: string[];
  frequency: PMFrequency;
  firstDueDate: string;
  nextDueDate: string;
  lastCompletedDate?: string;
  executionMethod: ExecutionMethod; // "In-House" | "Outsource"
  assignedType: "In-House Staff" | "External Vendor";
  technicianName?: string;
  maintenanceVendorId?: string;
  maintenanceVendorName?: string;
  vendorContact?: string;
  scheduleNotes?: string;
  status: PMScheduleStatus;
  activeWorkOrderNo?: string;
  pmHistory: PMHistoryRecord[];
  createdAt?: string;
}

export interface AssetCategoryMaster {
  id: string;
  categoryCode: string;
  categoryName: string;
  description?: string;
  assetCount?: number;
  status: "Active" | "Inactive";
}

export interface ProblemCategoryMaster {
  id: string;
  categoryCode: string;
  categoryName: string;
  description?: string;
  requestCount?: number;
  status: "Active" | "Inactive";
}

export interface RootCauseMaster {
  id: string;
  rootCauseCode: string;
  rootCauseName: string;
  description?: string;
  usedInWorkOrders?: number;
  status: "Active" | "Inactive";
}

export interface SparePartMaster {
  id: string;
  partCode: string;
  partName: string;
  category?: string;
  unit?: string;
  unitCost: number;
  defaultStoresRef?: string;
  description?: string;
  status: "Active" | "Inactive";
  createdAt?: string;
}

export interface AssetMaintenanceHistory {
  id: string;
  date: string;
  workOrderNo: string;
  woType: string;
  description: string;
  status: WorkOrderStatus;
  cost: number;
  technicianOrVendor: string;
}

export interface MaintenanceAsset {
  id: string;
  assetCode: string; // e.g. AST-HVAC-032
  assetName: string; // e.g. Daikin 1.5 Ton Inverter AC
  category: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  locationType: "Guest Room" | "F&B Area" | "Public Area" | "Back of House";
  location: string;
  purchaseDate?: string;
  installationDate?: string;
  purchaseCost?: number;
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  warrantyStatus?: "Active" | "Expired" | "Not Specified";
  amcStatus?: "Active" | "Inactive";
  maintenanceVendorId?: string;
  maintenanceVendorName?: string;
  amcStartDate?: string;
  amcEndDate?: string;
  amcReference?: string;
  notes?: string;
  status: AssetStatus;
  lastServicedDate?: string;
  nextPmDueDate?: string;
  activeWorkOrderNo?: string;
  totalMaintenanceCost?: number;
  totalWorkOrdersCount?: number;
  decommissionDate?: string;
  decommissionReason?: string;
  history?: AssetMaintenanceHistory[];
  createdAt?: string;
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

export type MntLocationStatus =
  | "Operational"
  | "Under Maintenance"
  | "Out of Service";

export interface MntRoom {
  id: string;
  roomId: string;
  status: MntLocationStatus;
  notes?: string | null;
  lastServicedAt?: string | null;
  roomNo?: string;
  floor?: string;
  roomType?: string;
  bedType?: string;
  maxOccupancy?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MntPublicArea {
  id: string;
  publicAreaId: string;
  status: MntLocationStatus;
  notes?: string | null;
  lastServicedAt?: string | null;
  areaCode?: string;
  name?: string;
  areaType?: string;
  location?: string | null;
  floorNumber?: number | null;
  priority?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
