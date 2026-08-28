/** Shared hotel department master — used by HR, Purchase & Stores, etc. */

export type DepartmentStatus = "Active" | "Inactive";

export interface DepartmentMaster {
  id: string;
  deptCode: string;
  departmentName: string;
  headOfDepartment: string;
  headEmail?: string;
  location?: string;
  description: string;
  status: DepartmentStatus;
  createdDate: string;
  employeeCount: number;
}

export const INITIAL_DEPARTMENTS: DepartmentMaster[] = [
  {
    id: "DEP-001",
    deptCode: "FO-10",
    departmentName: "Front Office",
    headOfDepartment: "Rajesh Kumar",
    headEmail: "rajesh.kumar@grandpalace.com",
    location: "Main Lobby - Floor 1",
    description:
      "Guest reception, concierge, bell desk, reservations, and front desk operations.",
    status: "Active",
    createdDate: "01/01/2025",
    employeeCount: 24,
  },
  {
    id: "DEP-002",
    deptCode: "HK-20",
    departmentName: "Housekeeping",
    headOfDepartment: "Anjali Sharma",
    headEmail: "anjali.sharma@grandpalace.com",
    location: "Service Basement B1",
    description:
      "Guest room cleaning, laundry, linen management, public area cleanliness, and floral maintenance.",
    status: "Active",
    createdDate: "01/01/2025",
    employeeCount: 42,
  },
  {
    id: "DEP-003",
    deptCode: "FB-30",
    departmentName: "Food & Beverage",
    headOfDepartment: "Chef Vikramjit Singh",
    headEmail: "vikramjit.singh@grandpalace.com",
    location: "Main Kitchen & Restaurants",
    description:
      "Fine dining restaurants, banquet kitchens, room service, bars, and culinary management.",
    status: "Active",
    createdDate: "01/01/2025",
    employeeCount: 38,
  },
  {
    id: "DEP-004",
    deptCode: "ENG-40",
    departmentName: "Engineering & Maintenance",
    headOfDepartment: "Suresh Prabhu",
    headEmail: "suresh.prabhu@grandpalace.com",
    location: "Plant Room & Maintenance Deck",
    description:
      "HVAC cooling systems, electrical power distribution, plumbing, carpentry, and building maintenance.",
    status: "Active",
    createdDate: "15/01/2025",
    employeeCount: 16,
  },
  {
    id: "DEP-005",
    deptCode: "SEC-50",
    departmentName: "Security & Safety",
    headOfDepartment: "Rajiv Kapoor",
    headEmail: "rajiv.kapoor@grandpalace.com",
    location: "Security Gatehouse 1",
    description:
      "24/7 premises security, CCTV monitoring, guest safety, baggage scanning, and POSH safety checks.",
    status: "Active",
    createdDate: "15/01/2025",
    employeeCount: 18,
  },
  {
    id: "DEP-006",
    deptCode: "HR-60",
    departmentName: "Human Resources",
    headOfDepartment: "Neha Mehta",
    headEmail: "neha.mehta@grandpalace.com",
    location: "Admin Wing - Floor 2",
    description:
      "Staff recruitment, payroll processing, statutory tax compliance, grievance redressal, and staff welfare.",
    status: "Active",
    createdDate: "01/01/2025",
    employeeCount: 8,
  },
  {
    id: "DEP-007",
    deptCode: "FIN-70",
    departmentName: "Finance & Accounts",
    headOfDepartment: "Anil Deshmukh",
    headEmail: "anil.deshmukh@grandpalace.com",
    location: "Admin Wing - Floor 2",
    description:
      "Night audit, revenue accounting, vendor payments, financial reporting, and tax audit.",
    status: "Active",
    createdDate: "01/01/2025",
    employeeCount: 10,
  },
  {
    id: "DEP-008",
    deptCode: "MKT-80",
    departmentName: "Sales & Marketing",
    headOfDepartment: "Priya Patel",
    headEmail: "priya.patel@grandpalace.com",
    location: "Executive Offices",
    description:
      "Corporate sales, wedding banquet bookings, digital marketing, PR, and OTA distribution.",
    status: "Active",
    createdDate: "01/02/2025",
    employeeCount: 12,
  },
  {
    id: "DEP-009",
    deptCode: "IT-90",
    departmentName: "IT & Systems",
    headOfDepartment: "Arjun Verma",
    headEmail: "arjun.verma@grandpalace.com",
    location: "Server Room - Floor 2",
    description:
      "Property Management System (PMS), POS terminals, Wi-Fi infrastructure, servers, and cybersecurity.",
    status: "Active",
    createdDate: "01/02/2025",
    employeeCount: 6,
  },
  {
    id: "DEP-010",
    deptCode: "SPA-100",
    departmentName: "Spa & Wellness",
    headOfDepartment: "Kavita Rao",
    headEmail: "kavita.rao@grandpalace.com",
    location: "Wellness Center - Floor 4",
    description:
      "Ayurvedic spa therapies, gymnasium, swimming pool lifeguard operations, and health club.",
    status: "Active",
    createdDate: "01/03/2025",
    employeeCount: 9,
  },
];

/** Active department names for dropdowns (category master, designations, etc.) */
export const DEPARTMENT_OPTIONS = INITIAL_DEPARTMENTS.filter(
  (d) => d.status === "Active",
).map((d) => d.departmentName);

export type HotelDepartment = string;
