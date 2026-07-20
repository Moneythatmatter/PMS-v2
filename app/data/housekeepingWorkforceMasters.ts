export interface StaffMasterRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  team: string;
  assignedShift: string;
  assignedFloors: string;
  phone: string;
  email: string;
  status: "Active" | "Inactive" | "Draft" | "Suspended" | "Archived";
  employmentType: "Full-Time" | "Contract" | "Part-Time";
  joinDate: string;
  creditCapacity: number;
  remarks?: string;
}

export interface ShiftMasterRecord {
  id: string;
  shiftCode: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  duration: string;
  breakDuration: string;
  shiftType: "Standard" | "Night" | "Split" | "Overtime";
  status: "Active" | "Inactive" | "Draft" | "Archived";
  maxStaffAllowed: number;
  remarks?: string;
}

export interface RoleMasterRecord {
  id: string;
  roleCode: string;
  roleName: string;
  department: string;
  permissions: string[];
  accessLevel: "Executive" | "Supervisor" | "Staff" | "Contractor";
  status: "Active" | "Inactive" | "Draft" | "Archived";
  remarks?: string;
}

export interface TeamMasterRecord {
  id: string;
  teamCode: string;
  teamName: string;
  supervisor: string;
  membersCount: number;
  assignedFloors: string;
  zoneArea: string;
  status: "Active" | "Inactive" | "Draft" | "Archived";
  remarks?: string;
}

export interface AssignmentRuleRecord {
  id: string;
  ruleCode: string;
  ruleName: string;
  applicableShift: string;
  areaZone: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  maxRoomsPerStaff: number;
  status: "Active" | "Inactive" | "Draft" | "Archived";
  autoReassignTrigger: string;
  remarks?: string;
}

export const INITIAL_STAFF_RECORDS: StaffMasterRecord[] = [
  {
    id: "STF-001",
    employeeId: "EMP-99101",
    employeeName: "Ramesh Kumar",
    role: "Housekeeping Supervisor",
    team: "East Wing Lead Squad",
    assignedShift: "Morning Shift (07:00 - 15:30)",
    assignedFloors: "Floors 1, 2 & 3",
    phone: "+91 98765 43210",
    email: "ramesh.kumar@grandhotel.com",
    status: "Active",
    employmentType: "Full-Time",
    joinDate: "2021-03-15",
    creditCapacity: 16,
    remarks: "Senior Floor Supervisor for luxury suites.",
  },
  {
    id: "STF-002",
    employeeId: "EMP-99104",
    employeeName: "Meena Kumari",
    role: "Senior Housekeeper",
    team: "Deluxe Floor Alpha Crew",
    assignedShift: "Morning Shift (07:00 - 15:30)",
    assignedFloors: "Floors 3 & 4",
    phone: "+91 98765 43211",
    email: "meena.k@grandhotel.com",
    status: "Active",
    employmentType: "Full-Time",
    joinDate: "2022-06-01",
    creditCapacity: 14,
    remarks: "Certified in VIP suite chemical sanitization.",
  },
  {
    id: "STF-003",
    employeeId: "EMP-99108",
    employeeName: "Sanjay Patel",
    role: "Public Area Attendant",
    team: "Lobby & Pool Squad",
    assignedShift: "Evening Shift (15:00 - 23:30)",
    assignedFloors: "Ground Floor & Pool Deck",
    phone: "+91 98765 43212",
    email: "sanjay.p@grandhotel.com",
    status: "Active",
    employmentType: "Full-Time",
    joinDate: "2023-01-10",
    creditCapacity: 12,
    remarks: "Handles marble polishing and high-traffic sanitization.",
  },
  {
    id: "STF-004",
    employeeId: "EMP-99112",
    employeeName: "Priya Sharma",
    role: "Room Inspector",
    team: "Quality Audit Team",
    assignedShift: "Morning Shift (07:00 - 15:30)",
    assignedFloors: "All Guest Floors (1 to 12)",
    phone: "+91 98765 43213",
    email: "priya.s@grandhotel.com",
    status: "Active",
    employmentType: "Full-Time",
    joinDate: "2020-11-20",
    creditCapacity: 20,
    remarks: "Lead inspector for Checkout SOP compliance.",
  },
  {
    id: "STF-005",
    employeeId: "EMP-99115",
    employeeName: "Anil Verma",
    role: "Laundry Specialist",
    team: "Commercial Laundry Hub",
    assignedShift: "General Shift (09:00 - 17:30)",
    assignedFloors: "Basement Laundry Facility",
    phone: "+91 98765 43214",
    email: "anil.v@grandhotel.com",
    status: "Active",
    employmentType: "Full-Time",
    joinDate: "2021-08-05",
    creditCapacity: 15,
    remarks: "Manages dry cleaning press machines and linen sorting.",
  },
  {
    id: "STF-006",
    employeeId: "EMP-99120",
    employeeName: "Vikram Singh",
    role: "Maintenance Technician",
    team: "Engineering Support",
    assignedShift: "Night Shift (23:00 - 07:30)",
    assignedFloors: "Entire Property",
    phone: "+91 98765 43215",
    email: "vikram.s@grandhotel.com",
    status: "Active",
    employmentType: "Full-Time",
    joinDate: "2022-02-14",
    creditCapacity: 10,
    remarks: "Night emergency plumbing & HVAC repair technician.",
  },
  {
    id: "STF-007",
    employeeId: "EMP-99125",
    employeeName: "Sunita Roy",
    role: "Housekeeper",
    team: "West Wing Bravo Crew",
    assignedShift: "Evening Shift (15:00 - 23:30)",
    assignedFloors: "Floors 5 & 6",
    phone: "+91 98765 43216",
    email: "sunita.r@grandhotel.com",
    status: "Inactive",
    employmentType: "Part-Time",
    joinDate: "2023-04-18",
    creditCapacity: 10,
    remarks: "Currently on extended medical leave.",
  },
];

export const INITIAL_SHIFT_RECORDS: ShiftMasterRecord[] = [
  {
    id: "SFT-001",
    shiftCode: "SHF-MORN",
    shiftName: "Morning Operational Shift",
    startTime: "07:00 AM",
    endTime: "03:30 PM",
    duration: "8.5 Hours",
    breakDuration: "45 Mins Lunch + 15 Mins Tea",
    shiftType: "Standard",
    status: "Active",
    maxStaffAllowed: 30,
    remarks: "Primary checkout cleaning & daily stayover servicing shift.",
  },
  {
    id: "SFT-002",
    shiftCode: "SHF-EVE",
    shiftName: "Evening Turn-down Shift",
    startTime: "03:00 PM",
    endTime: "11:30 PM",
    duration: "8.5 Hours",
    breakDuration: "45 Mins Dinner",
    shiftType: "Standard",
    status: "Active",
    maxStaffAllowed: 20,
    remarks: "Focuses on guest request turn-down service & public area upkeep.",
  },
  {
    id: "SFT-003",
    shiftCode: "SHF-NIGHT",
    shiftName: "Overnight Sanitization Shift",
    startTime: "11:00 PM",
    endTime: "07:30 AM",
    duration: "8.5 Hours",
    breakDuration: "45 Mins Midnight Break",
    shiftType: "Night",
    status: "Active",
    maxStaffAllowed: 10,
    remarks: "Deep cleaning lobby floors, carpet shampooing, & emergency coverage.",
  },
  {
    id: "SFT-004",
    shiftCode: "SHF-GEN",
    shiftName: "General Administrative Shift",
    startTime: "09:00 AM",
    endTime: "05:30 PM",
    duration: "8.5 Hours",
    breakDuration: "1 Hour Lunch",
    shiftType: "Standard",
    status: "Active",
    maxStaffAllowed: 15,
    remarks: "Linen inventory management, store requisitions, & supervisory audits.",
  },
];

export const INITIAL_ROLE_RECORDS: RoleMasterRecord[] = [
  {
    id: "ROL-001",
    roleCode: "ROL-EX-HK",
    roleName: "Executive Housekeeper",
    department: "Housekeeping Management",
    permissions: ["Full Master Control", "Budget Approval", "SLA Override", "Staff Roster Approval"],
    accessLevel: "Executive",
    status: "Active",
    remarks: "Top-level department administrator.",
  },
  {
    id: "ROL-002",
    roleCode: "ROL-SUP",
    roleName: "Floor Supervisor",
    department: "Operations",
    permissions: ["Room Release", "Inspection Signoff", "Requisition Creation", "Task Reassignment"],
    accessLevel: "Supervisor",
    status: "Active",
    remarks: "Field supervisor overseeing attendant teams.",
  },
  {
    id: "ROL-003",
    roleCode: "ROL-ATT",
    roleName: "Room Attendant",
    department: "Operations",
    permissions: ["View Assigned Queue", "Update Room Status", "Report Damage", "Log Found Item"],
    accessLevel: "Staff",
    status: "Active",
    remarks: "Primary room cleaning staff member.",
  },
  {
    id: "ROL-004",
    roleCode: "ROL-INS",
    roleName: "Quality Inspector",
    department: "Quality Assurance",
    permissions: ["Perform Audit", "Pass/Fail Room", "Score SOP", "Generate Quality Report"],
    accessLevel: "Supervisor",
    status: "Active",
    remarks: "Independent quality control inspector.",
  },
];

export const INITIAL_TEAM_RECORDS: TeamMasterRecord[] = [
  {
    id: "TM-001",
    teamCode: "TM-EAST-L1",
    teamName: "East Wing Lead Squad",
    supervisor: "Ramesh Kumar",
    membersCount: 8,
    assignedFloors: "Floors 1, 2 & 3",
    zoneArea: "East Wing Suites",
    status: "Active",
    remarks: "Responsible for VIP Presidential & Executive suites.",
  },
  {
    id: "TM-002",
    teamCode: "TM-[#011]",
    teamName: "Deluxe Floor Alpha Crew",
    supervisor: "Priya Sharma",
    membersCount: 10,
    assignedFloors: "Floors 4, 5 & 6",
    zoneArea: "Tower A Deluxe Rooms",
    status: "Active",
    remarks: "High-volume turnover team.",
  },
  {
    id: "TM-003",
    teamCode: "TM-PUB-AREA",
    teamName: "Lobby & Pool Squad",
    supervisor: "Sanjay Patel",
    membersCount: 6,
    assignedFloors: "Ground Lobby & Outdoor Deck",
    zoneArea: "Public Facilities",
    status: "Active",
    remarks: "Focuses on public restrooms, lobby marble, & pool lounge.",
  },
];

export const INITIAL_ASSIGNMENT_RULES: AssignmentRuleRecord[] = [
  {
    id: "ARL-001",
    ruleCode: "ARL-AUTO-SUITE",
    ruleName: "Suite Automatic Credit Cap Rule",
    applicableShift: "Morning Operational Shift",
    areaZone: "Executive & Presidential Suites",
    priority: "Critical",
    maxRoomsPerStaff: 10,
    status: "Active",
    autoReassignTrigger: "Queue Overflow > 12 Credits",
    remarks: "Cap room attendants at max 10 suite cleaning credits per 8h shift.",
  },
  {
    id: "ARL-002",
    ruleCode: "ARL-TURNDOWN",
    ruleName: "Evening Turndown Auto-Assign Rule",
    applicableShift: "Evening Turn-down Shift",
    areaZone: "All Occupied Stayover Rooms",
    priority: "High",
    maxRoomsPerStaff: 25,
    status: "Active",
    autoReassignTrigger: "Unassigned Requests > 15 Mins",
    remarks: "Assign 25 turndown services per evening attendant.",
  },
];
