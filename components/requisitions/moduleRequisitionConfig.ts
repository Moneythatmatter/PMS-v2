import type { PRSourceModule } from "@/app/data/purchaseRequisitionsData";

export interface RequisitionDepartment {
  /** Must match `DEPARTMENT_STAFF_DATA[].department` for cost centers and staff. */
  name: string;
  sourceModule: PRSourceModule;
}

export interface ModuleRequisitionConfig {
  /** Shown above the page title. */
  moduleLabel: string;
  /** Every `source_module` this page lists (F&B also sees Kitchen requests). */
  sourceModules: PRSourceModule[];
  departments: RequisitionDepartment[];
  /** `ps_categories.department` values whose materials this module usually requests. */
  categoryDepartments: string[];
  referenceLabel: string;
  referencePlaceholder: string;
}

export const MODULE_REQUISITION_CONFIG = {
  housekeeping: {
    moduleLabel: "Housekeeping",
    sourceModules: ["Housekeeping"],
    departments: [{ name: "Housekeeping", sourceModule: "Housekeeping" }],
    categoryDepartments: ["Housekeeping"],
    referenceLabel: "Reference",
    referencePlaceholder: "e.g. Damage report / floor / linen par audit",
  },
  frontOffice: {
    moduleLabel: "Front Office",
    sourceModules: ["Front Office"],
    departments: [{ name: "Front Office", sourceModule: "Front Office" }],
    categoryDepartments: ["Front Office"],
    referenceLabel: "Reference",
    referencePlaceholder: "e.g. Front desk / concierge / bell desk",
  },
  foodBeverage: {
    moduleLabel: "Food & Beverage",
    sourceModules: ["Food & Beverage", "Kitchen"],
    departments: [
      { name: "Kitchen / Culinary", sourceModule: "Kitchen" },
      { name: "F&B Service", sourceModule: "Food & Beverage" },
    ],
    categoryDepartments: ["Food & Beverages", "Food & Beverage", "Kitchen", "F&B"],
    referenceLabel: "Outlet / Reference",
    referencePlaceholder: "e.g. Main kitchen, banquet event, bar",
  },
  maintenance: {
    moduleLabel: "Maintenance",
    sourceModules: ["Maintenance"],
    departments: [{ name: "Engineering", sourceModule: "Maintenance" }],
    categoryDepartments: ["Maintenance", "Engineering"],
    referenceLabel: "Work Order / Asset",
    referencePlaceholder: "e.g. WO-2026-0142 or asset tag",
  },
  humanResources: {
    moduleLabel: "Human Resources",
    sourceModules: ["Human Resources"],
    departments: [{ name: "Human Resources", sourceModule: "Human Resources" }],
    categoryDepartments: ["Human Resource", "Human Resources", "HR"],
    referenceLabel: "Reference",
    referencePlaceholder: "e.g. Staff uniforms, training batch, cafeteria",
  },
  accounts: {
    moduleLabel: "Accounts",
    sourceModules: ["Accounts"],
    departments: [{ name: "Accounts & Finance", sourceModule: "Accounts" }],
    categoryDepartments: ["Accounts", "Finance"],
    referenceLabel: "Reference",
    referencePlaceholder: "e.g. Stationery, printer consumables",
  },
  salesMarketing: {
    moduleLabel: "Sales & Marketing",
    sourceModules: ["Sales & Marketing"],
    departments: [{ name: "Sales & Marketing", sourceModule: "Sales & Marketing" }],
    categoryDepartments: ["Sales & Marketing", "Sales", "Marketing"],
    referenceLabel: "Campaign / Event",
    referencePlaceholder: "e.g. Corporate event, brochure print run",
  },
} satisfies Record<string, ModuleRequisitionConfig>;

export type RequisitionModuleKey = keyof typeof MODULE_REQUISITION_CONFIG;
