export interface ContractItem {
  id: string;
  itemOrService: string;
  category: string;
  agreedPrice: number;
  unit: string;
  maxQtyLimit: number;
}

export interface ContractRecord {
  id: string;
  contractNumber: string;
  vendorName: string;
  contractType: "Blanket Purchase Agreement" | "Annual Maintenance Contract" | "Service Agreement" | "Rate Agreement";
  startDate: string;
  endDate: string;
  status: "Active" | "Expiring Soon" | "Expired" | "Draft";
  contractValue: number;
  renewalNoticeDays: number;
  contactPerson: string;
  phone: string;
  email: string;
  taxId: string;
  priceEscalationClause: string;
  paymentTerms: string;
  penaltyTerms: string;
  maxCapValue: number;
  specialConditions: string;
  terminationNotice: string;
  warrantyTerms: string;
  approverName: string;
  approvalLevel: string;
  items: ContractItem[];
  attachments: { id: string; fileName: string; fileSize: string; fileType: string }[];
  activityTimeline: { stage: string; timestamp: string; note: string; author: string }[];
}

export const INITIAL_CONTRACT_RECORDS: ContractRecord[] = [
  {
    id: "arc-001",
    contractNumber: "ARC-2026-001",
    vendorName: "Otis Elevator Company",
    contractType: "Annual Maintenance Contract",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    status: "Active",
    contractValue: 450000,
    renewalNoticeDays: 30,
    contactPerson: "Vikram Malhotra",
    phone: "+91 98990 12345",
    email: "service@otis.co.in",
    taxId: "07AAACO1234K1Z9",
    priceEscalationClause: "Fixed price for 12 months with 5% max cap on renewal.",
    paymentTerms: "Quarterly advance payment post inspection",
    penaltyTerms: "₹2,000 per hour delay beyond 2-hour response SLA",
    maxCapValue: 500000,
    specialConditions: "24x7 emergency callback service included.",
    terminationNotice: "30 Days written notice by either party",
    warrantyTerms: "100% genuine OEM spare parts replacement guarantee",
    approverName: "General Manager",
    approvalLevel: "Level 3 - Executive Board",
    items: [
      { id: "ci-1", itemOrService: "Passenger Elevator Comprehensive AMC (6 Units)", category: "Engineering Services", agreedPrice: 350000, unit: "Annual Fee", maxQtyLimit: 1 },
      { id: "ci-2", itemOrService: "Service Elevator Breakdown Repair & Oil", category: "Maintenance", agreedPrice: 100000, unit: "Annual Fee", maxQtyLimit: 1 }
    ],
    attachments: [
      { id: "ca-1", fileName: "Otis_AMC_Agreement_Signed.pdf", fileSize: "1.2 MB", fileType: "pdf" }
    ],
    activityTimeline: [
      { stage: "Contract Created", timestamp: "15 Dec 2025", note: "BPA contract drafted", author: "Purchase Manager" },
      { stage: "Legal Sign-off", timestamp: "20 Dec 2025", note: "Vetted by Legal Counsel", author: "Legal Manager" },
      { stage: "Active & Published", timestamp: "01 Jan 2026", note: "Published to Store ERP", author: "General Manager" }
    ]
  },
  {
    id: "arc-002",
    contractNumber: "ARC-2026-002",
    vendorName: "Amul Dairy Products Ltd",
    contractType: "Blanket Purchase Agreement",
    startDate: "2026-04-01",
    endDate: "2026-08-15",
    status: "Expiring Soon",
    contractValue: 1200000,
    renewalNoticeDays: 15,
    contactPerson: "Ramesh Patel",
    phone: "+91 98250 88990",
    email: "orders@amuldairy.com",
    taxId: "07AAACA4412F1Z1",
    priceEscalationClause: "Fixed daily rate card for milk, butter, and cream.",
    paymentTerms: "Weekly billing Net 7 Days",
    penaltyTerms: "Rejection of consignment if temp exceeds 4°C",
    maxCapValue: 1500000,
    specialConditions: "Daily delivery by 5:30 AM at Receiving Dock 1.",
    terminationNotice: "15 Days notice",
    warrantyTerms: "Freshness guarantee with FSSAI compliance",
    approverName: "F&B Director",
    approvalLevel: "Level 2 - Department Head",
    items: [
      { id: "ci-3", itemOrService: "Fresh Full Cream Milk 1L Pouch", category: "Dairy", agreedPrice: 66, unit: "Litre", maxQtyLimit: 10000 },
      { id: "ci-4", itemOrService: "Unsalted Table Butter 500g", category: "Dairy", agreedPrice: 275, unit: "Pack", maxQtyLimit: 2000 }
    ],
    attachments: [
      { id: "ca-2", fileName: "Amul_BPA_RateCard_2026.xlsx", fileSize: "450 KB", fileType: "xlsx" }
    ],
    activityTimeline: [
      { stage: "Contract Active", timestamp: "01 Apr 2026", note: "Rate card locked", author: "Purchase Officer" },
      { stage: "Expiring Warning", timestamp: "15 Jul 2026", note: "30 days to contract expiration", author: "System Alert" }
    ]
  },
  {
    id: "arc-003",
    contractNumber: "ARC-2025-089",
    vendorName: "EcoClean Pest Control",
    contractType: "Service Agreement",
    startDate: "2025-06-01",
    endDate: "2026-05-31",
    status: "Expired",
    contractValue: 180000,
    renewalNoticeDays: 30,
    contactPerson: "Anil Saxena",
    phone: "+91 97170 33445",
    email: "info@ecoclean.co.in",
    taxId: "07AAACE9912L1Z3",
    priceEscalationClause: "Fixed fee",
    paymentTerms: "Monthly billing Net 15",
    penaltyTerms: "Free re-treatment if pests detected within 48h",
    maxCapValue: 200000,
    specialConditions: "Non-toxic eco chemicals for guest areas.",
    terminationNotice: "30 Days notice",
    warrantyTerms: "100% pest-free certification",
    approverName: "Executive Housekeeper",
    approvalLevel: "Level 2 - Department Head",
    items: [
      { id: "ci-5", itemOrService: "Monthly Chemical Treatment (Whole Property)", category: "Sanitation", agreedPrice: 15000, unit: "Month", maxQtyLimit: 12 }
    ],
    attachments: [],
    activityTimeline: [
      { stage: "Expired", timestamp: "31 May 2026", note: "Contract reached term end", author: "System" }
    ]
  }
];
