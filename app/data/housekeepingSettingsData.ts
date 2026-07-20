export interface HousekeepingSettingsState {
  // General
  propertyTimeZone: string;
  defaultLanguage: string;
  defaultShift: string;
  defaultFloor: string;
  defaultHousekeepingStatus: string;
  workWeekStart: string;
  businessDateAutoRollover: boolean;

  // Room Cleaning
  autoAssignRooms: boolean;
  maxRoomsPerStaff: number;
  cleaningPriority: "VIP First" | "Checkout First" | "Occupied First" | "Vacant First";
  allowReopenAfterInspection: boolean;
  enableAutoRoomRelease: boolean;
  defaultCleaningTimeMins: number;

  // Room Inspection
  passPercentageCutoff: number;
  criticalDefectAutoFail: boolean;
  requireSupervisorApproval: boolean;
  randomInspectionPercent: number;
  photoEvidenceRequired: boolean;
  digitalSignatureRequired: boolean;

  // Guest Requests
  defaultSlaMins: number;
  escalationTimeMins: number;
  autoCloseRequests: boolean;
  notifySupervisorOnOverdue: boolean;
  maxOpenRequestsPerRoom: number;

  // Laundry
  expressLaundryEnabled: boolean;
  expressSurchargePercent: number;
  defaultPickupTime: string;
  defaultDeliveryTime: string;
  guestSignatureRequired: boolean;
  vendorOutsourcingEnabled: boolean;

  // Lost & Found
  defaultRetentionDays: number;
  highValueRetentionDays: number;
  perishableRetentionDays: number;
  automaticGuestNotification: boolean;
  disposalApprovalRequired: boolean;
  defaultStorageLocation: string;

  // Deep Cleaning
  recurringScheduleEnabled: boolean;
  defaultFrequency: string;
  reminderDaysBeforeDue: number;
  defaultBlockType: "Out of Order (OOO)" | "Out of Service (OOS)";
  maintenanceHoldRequired: boolean;
  requireBeforePhoto: boolean;
  requireAfterPhoto: boolean;

  // Damage Reports
  requireDamagePhotoEvidence: boolean;
  damageGuestSignatureRequired: boolean;
  autoCreateEngineeringTicket: boolean;
  approvalThresholdAmount: number;
  insuranceEnabled: boolean;
  splitRecoveryEnabled: boolean;

  // Requisitions
  approvalWorkflowEnabled: boolean;
  emergencyFastTrackEnabled: boolean;
  budgetValidation: boolean;
  partialIssueAllowed: boolean;
  backorderEnabled: boolean;
  autoPurchaseRequisition: boolean;
  digitalReceivingSignature: boolean;

  // Notifications
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  whatsAppNotifications: boolean;
  managerAlerts: boolean;
  escalationAlerts: boolean;

  // Audit & Security
  enableAuditLogs: boolean;
  auditRetentionDays: number;
  captureIpAddress: boolean;
  captureDevice: boolean;
  captureBrowser: boolean;
  digitalSignatureSecurity: boolean;
  immutableLogs: boolean;

  // Integrations
  frontOfficeIntegration: boolean;
  inventoryIntegration: boolean;
  engineeringIntegration: boolean;
  financeIntegration: boolean;
  purchaseIntegration: boolean;
  hrIntegration: boolean;
  posIntegration: boolean;
  iotRoomSensors: boolean;
  keyCardSystem: boolean;

  // Metadata
  lastUpdated: string;
  updatedBy: string;
  version: string;
}

export const INITIAL_HOUSEKEEPING_SETTINGS: HousekeepingSettingsState = {
  // General
  propertyTimeZone: "Asia/Kolkata (GMT+05:30)",
  defaultLanguage: "English (United States)",
  defaultShift: "Morning Operational Shift (07:00 - 15:30)",
  defaultFloor: "Floor 3 (Executive Wing)",
  defaultHousekeepingStatus: "Dirty (Checkout Pending)",
  workWeekStart: "Monday",
  businessDateAutoRollover: true,

  // Room Cleaning
  autoAssignRooms: true,
  maxRoomsPerStaff: 14,
  cleaningPriority: "VIP First",
  allowReopenAfterInspection: true,
  enableAutoRoomRelease: true,
  defaultCleaningTimeMins: 25,

  // Room Inspection
  passPercentageCutoff: 90,
  criticalDefectAutoFail: true,
  requireSupervisorApproval: true,
  randomInspectionPercent: 25,
  photoEvidenceRequired: true,
  digitalSignatureRequired: true,

  // Guest Requests
  defaultSlaMins: 15,
  escalationTimeMins: 30,
  autoCloseRequests: false,
  notifySupervisorOnOverdue: true,
  maxOpenRequestsPerRoom: 3,

  // Laundry
  expressLaundryEnabled: true,
  expressSurchargePercent: 50,
  defaultPickupTime: "10:00 AM",
  defaultDeliveryTime: "06:00 PM",
  guestSignatureRequired: true,
  vendorOutsourcingEnabled: true,

  // Lost & Found
  defaultRetentionDays: 90,
  highValueRetentionDays: 365,
  perishableRetentionDays: 3,
  automaticGuestNotification: true,
  disposalApprovalRequired: true,
  defaultStorageLocation: "Vault Locker A - Main Security Room",

  // Deep Cleaning
  recurringScheduleEnabled: true,
  defaultFrequency: "Quarterly (Every 90 Days)",
  reminderDaysBeforeDue: 7,
  defaultBlockType: "Out of Order (OOO)",
  maintenanceHoldRequired: true,
  requireBeforePhoto: true,
  requireAfterPhoto: true,

  // Damage Reports
  requireDamagePhotoEvidence: true,
  damageGuestSignatureRequired: true,
  autoCreateEngineeringTicket: true,
  approvalThresholdAmount: 10000,
  insuranceEnabled: true,
  splitRecoveryEnabled: false,

  // Requisitions
  approvalWorkflowEnabled: true,
  emergencyFastTrackEnabled: true,
  budgetValidation: true,
  partialIssueAllowed: true,
  backorderEnabled: true,
  autoPurchaseRequisition: false,
  digitalReceivingSignature: true,

  // Notifications
  emailNotifications: true,
  smsNotifications: true,
  pushNotifications: true,
  whatsAppNotifications: false,
  managerAlerts: true,
  escalationAlerts: true,

  // Audit & Security
  enableAuditLogs: true,
  auditRetentionDays: 90,
  captureIpAddress: true,
  captureDevice: true,
  captureBrowser: true,
  digitalSignatureSecurity: true,
  immutableLogs: true,

  // Integrations
  frontOfficeIntegration: true,
  inventoryIntegration: true,
  engineeringIntegration: true,
  financeIntegration: true,
  purchaseIntegration: true,
  hrIntegration: true,
  posIntegration: false,
  iotRoomSensors: true,
  keyCardSystem: true,

  // Metadata
  lastUpdated: "2026-07-20 10:45 AM",
  updatedBy: "Admin User (Executive Housekeeper)",
  version: "v4.2",
};

export const SETTING_CATEGORIES_METADATA = [
  { id: "general", label: "General", icon: "Sliders" },
  { id: "cleaning", label: "Room Cleaning", icon: "Sparkles" },
  { id: "inspection", label: "Room Inspection", icon: "ShieldCheck" },
  { id: "requests", label: "Guest Requests", icon: "Bell" },
  { id: "laundry", label: "Laundry", icon: "ArrowRightLeft" },
  { id: "lostfound", label: "Lost & Found", icon: "Package" },
  { id: "deepcleaning", label: "Deep Cleaning", icon: "Clock" },
  { id: "damagereports", label: "Damage Reports", icon: "AlertTriangle" },
  { id: "requisitions", label: "Requisitions", icon: "Box" },
  { id: "notifications", label: "Notifications", icon: "Mail" },
  { id: "auditsecurity", label: "Audit & Security", icon: "Lock" },
  { id: "integrations", label: "Integrations", icon: "Layers" },
] as const;
