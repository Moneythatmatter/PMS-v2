export interface BankReconciliationEntry {
  id: string;
  vouchDt: string;
  vouchNo: string;
  trnType: "Receipt" | "Payment" | "Journal" | "Contra";
  chqNo: string;
  chqDt: string;
  narration: string;
  drAmt: number;
  crAmt: number;
  reconciled: boolean;
  reconDate?: string;
  bankName: string;
}

export const sampleBankAccounts = [
  "<ALL Banks>",
  "YES BANK A/c #9012",
  "HDFC Bank Operating A/c #4401",
  "ICICI Bank Collection A/c #1029",
  "State Bank of India A/c #8821",
];

// Clean, realistic Bank Reconciliation entries split across different Bank Accounts
export const sampleBankReconciliationData: BankReconciliationEntry[] = [
  // ---------------- YES BANK A/c #9012 ----------------
  {
    id: "br-001",
    vouchDt: "28/04/2026",
    vouchNo: "RCP-2026-0042",
    trnType: "Receipt",
    chqNo: "EDC-TXN-99120",
    chqDt: "28/04/2026",
    narration: "Room revenue EDC card settlement deposit in transit",
    drAmt: 45000,
    crAmt: 0,
    reconciled: false,
    reconDate: "",
    bankName: "YES BANK A/c #9012",
  },
  {
    id: "br-002",
    vouchDt: "28/04/2026",
    vouchNo: "RCP-2026-0043",
    trnType: "Receipt",
    chqNo: "UTR-882910485",
    chqDt: "28/04/2026",
    narration: "MakeMyTrip corporate booking NEFT direct credit",
    drAmt: 65000,
    crAmt: 0,
    reconciled: true,
    reconDate: "28/04/2026",
    bankName: "YES BANK A/c #9012",
  },
  {
    id: "br-003",
    vouchDt: "27/04/2026",
    vouchNo: "PAY-2026-0089",
    trnType: "Payment",
    chqNo: "CHQ-884012",
    chqDt: "27/04/2026",
    narration: "Vendor payment cheque issued to Fresh Foods Supplies Ltd",
    drAmt: 0,
    crAmt: 35000,
    reconciled: false,
    reconDate: "",
    bankName: "YES BANK A/c #9012",
  },
  {
    id: "br-004",
    vouchDt: "26/04/2026",
    vouchNo: "PAY-2026-0090",
    trnType: "Payment",
    chqNo: "CHQ-884013",
    chqDt: "26/04/2026",
    narration: "Cheque issued to CleanLinen Laundry Co. (Uncleared)",
    drAmt: 0,
    crAmt: 25000,
    reconciled: false,
    reconDate: "",
    bankName: "YES BANK A/c #9012",
  },
  {
    id: "br-005",
    vouchDt: "25/04/2026",
    vouchNo: "RCP-2026-0045",
    trnType: "Receipt",
    chqNo: "UPI-441209",
    chqDt: "25/04/2026",
    narration: "Agoda banquet hall advance deposit via UPI",
    drAmt: 43000,
    crAmt: 0,
    reconciled: true,
    reconDate: "25/04/2026",
    bankName: "YES BANK A/c #9012",
  },

  // ---------------- HDFC Bank Operating A/c #4401 ----------------
  {
    id: "br-101",
    vouchDt: "02/08/2026",
    vouchNo: "PAY-2026-0112",
    trnType: "Payment",
    chqNo: "HDFC-CHQ-10492",
    chqDt: "02/08/2026",
    narration: "Vendor payment for Kitchen Perishable Vegetables",
    drAmt: 0,
    crAmt: 125000,
    reconciled: false,
    reconDate: "",
    bankName: "HDFC Bank Operating A/c #4401",
  },
  {
    id: "br-102",
    vouchDt: "01/08/2026",
    vouchNo: "RCP-2026-0140",
    trnType: "Receipt",
    chqNo: "HDFC-UTR-77102",
    chqDt: "01/08/2026",
    narration: "Corporate Guest Folio settlement from Infosys Ltd",
    drAmt: 280000,
    crAmt: 0,
    reconciled: true,
    reconDate: "01/08/2026",
    bankName: "HDFC Bank Operating A/c #4401",
  },
  {
    id: "br-103",
    vouchDt: "30/07/2026",
    vouchNo: "PAY-2026-0105",
    trnType: "Payment",
    chqNo: "HDFC-CHQ-10490",
    chqDt: "30/07/2026",
    narration: "Monthly Electricity Power Bill auto-debit",
    drAmt: 0,
    crAmt: 620000,
    reconciled: false,
    reconDate: "",
    bankName: "HDFC Bank Operating A/c #4401",
  },

  // ---------------- ICICI Bank Collection A/c #1029 ----------------
  {
    id: "br-201",
    vouchDt: "03/08/2026",
    vouchNo: "RCP-2026-0155",
    trnType: "Receipt",
    chqNo: "ICICI-POS-9918",
    chqDt: "03/08/2026",
    narration: "F&B Restaurant Card Machine daily batch settlement",
    drAmt: 145000,
    crAmt: 0,
    reconciled: false,
    reconDate: "",
    bankName: "ICICI Bank Collection A/c #1029",
  },
  {
    id: "br-202",
    vouchDt: "01/08/2026",
    vouchNo: "RCP-2026-0138",
    trnType: "Receipt",
    chqNo: "ICICI-NEFT-5510",
    chqDt: "01/08/2026",
    narration: "Travel Agent advance deposit for Annual Conference",
    drAmt: 350000,
    crAmt: 0,
    reconciled: true,
    reconDate: "01/08/2026",
    bankName: "ICICI Bank Collection A/c #1029",
  },

  // ---------------- State Bank of India A/c #8821 ----------------
  {
    id: "br-301",
    vouchDt: "29/07/2026",
    vouchNo: "PAY-2026-0098",
    trnType: "Payment",
    chqNo: "SBI-CHQ-44019",
    chqDt: "29/07/2026",
    narration: "Quarterly Statutory GST Tax Transfer to Govt Treasury",
    drAmt: 0,
    crAmt: 450000,
    reconciled: true,
    reconDate: "30/07/2026",
    bankName: "State Bank of India A/c #8821",
  },
  {
    id: "br-302",
    vouchDt: "25/07/2026",
    vouchNo: "CNT-2026-0015",
    trnType: "Contra",
    chqNo: "SBI-DEP-110",
    chqDt: "25/07/2026",
    narration: "Main Cash Float deposit into SBI Operating account",
    drAmt: 100000,
    crAmt: 0,
    reconciled: false,
    reconDate: "",
    bankName: "State Bank of India A/c #8821",
  },
];
