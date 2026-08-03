export interface DivisionRecord {
  id: string;
  divisionId: string;
  active: boolean;
  name: string;
  shortName: string;
  unitLedgerAccount: string;
  displaySequenceNo: number;
  updateBy: string;
  updateDate: string;
}

export const sampleDivisionsData: DivisionRecord[] = [
  {
    id: "div-01",
    divisionId: "DIV01",
    active: true,
    name: "Rooms Division",
    shortName: "ROOMS",
    unitLedgerAccount: "1100 - Guest Ledger Control A/c",
    displaySequenceNo: 1,
    updateBy: "ABHIJIT",
    updateDate: "24-July-2026",
  },
  {
    id: "div-02",
    divisionId: "DIV02",
    active: true,
    name: "Food & Beverage Division",
    shortName: "FNB",
    unitLedgerAccount: "4100 - F&B Revenue Control A/c",
    displaySequenceNo: 2,
    updateBy: "ABHIJIT",
    updateDate: "24-July-2026",
  },
  {
    id: "div-03",
    divisionId: "DIV03",
    active: true,
    name: "Administrative & General",
    shortName: "ANG",
    unitLedgerAccount: "5100 - A&G Expense Control A/c",
    displaySequenceNo: 3,
    updateBy: "ABHIJIT",
    updateDate: "20-July-2026",
  },
  {
    id: "div-04",
    divisionId: "DIV04",
    active: true,
    name: "Property Operations & Maintenance",
    shortName: "POM",
    unitLedgerAccount: "5200 - Maintenance Control A/c",
    displaySequenceNo: 4,
    updateBy: "JAY ADMIN",
    updateDate: "18-July-2026",
  },
  {
    id: "div-05",
    divisionId: "DIV05",
    active: true,
    name: "Spa & Wellness",
    shortName: "SPA",
    unitLedgerAccount: "4200 - Spa Revenue Control A/c",
    displaySequenceNo: 5,
    updateBy: "JAY ADMIN",
    updateDate: "15-July-2026",
  },
];
