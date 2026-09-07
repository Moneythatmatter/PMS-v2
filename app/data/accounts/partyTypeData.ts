export interface PartyTypeModel {
  partyTypeId: string; // e.g. "PTY-001" (system-generated, immutable)
  typeCode: string; // "CUST", "VEND", "AGNT", "EMP", "GOVT", "OTHR"
  typeName: string; // "Customer", "Vendor", "Agent / Intermediary", etc.
  description?: string;
  sequence: number;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export const samplePartyTypesList: PartyTypeModel[] = [
  {
    partyTypeId: "PTY-001",
    typeCode: "CUST",
    typeName: "Customer",
    description: "Individuals or organizations purchasing hotel rooms, banquet, or restaurant services.",
    sequence: 1,
    status: "Active",
    createdAt: "01/04/2026",
    updatedAt: "01/08/2026",
  },
  {
    partyTypeId: "PTY-002",
    typeCode: "VEND",
    typeName: "Vendor",
    description: "Suppliers, contractors, and service providers to the hotel.",
    sequence: 2,
    status: "Active",
    createdAt: "01/04/2026",
    updatedAt: "01/08/2026",
  },
  {
    partyTypeId: "PTY-003",
    typeCode: "AGNT",
    typeName: "Agent / Intermediary",
    description: "Travel agents, OTAs, event planners, and other booking intermediaries.",
    sequence: 3,
    status: "Active",
    createdAt: "01/04/2026",
    updatedAt: "01/08/2026",
  },
  {
    partyTypeId: "PTY-004",
    typeCode: "EMP",
    typeName: "Employee",
    description: "Hotel staff and employees receiving payroll, advances, or expense reimbursements.",
    sequence: 4,
    status: "Active",
    createdAt: "01/04/2026",
    updatedAt: "01/08/2026",
  },
  {
    partyTypeId: "PTY-005",
    typeCode: "GOVT",
    typeName: "Government / Statutory",
    description: "Government and statutory authorities involved in GST, TDS, municipal fees, or taxes.",
    sequence: 5,
    status: "Active",
    createdAt: "01/04/2026",
    updatedAt: "01/08/2026",
  },
  {
    partyTypeId: "PTY-006",
    typeCode: "OTHR",
    typeName: "Other",
    description: "Other miscellaneous accounting relationships not categorized above.",
    sequence: 6,
    status: "Active",
    createdAt: "01/04/2026",
    updatedAt: "01/08/2026",
  },
];
