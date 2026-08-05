export interface UserVoucherPermissionRow {
  transactionType: string;
  allowNew: boolean;
  allowOpen: boolean;
  allowDelete: boolean;
  allowPrintInOpen: boolean;
  approvalApplicable: boolean;
  approvedUser: boolean;
}

export const DEFAULT_VOUCHER_PERMISSION_ROWS: UserVoucherPermissionRow[] = [
  {
    transactionType: "Journal Voucher (JV)",
    allowNew: true,
    allowOpen: true,
    allowDelete: true,
    allowPrintInOpen: true,
    approvalApplicable: true,
    approvedUser: true,
  },
  {
    transactionType: "Receipt Voucher (RV)",
    allowNew: true,
    allowOpen: true,
    allowDelete: false,
    allowPrintInOpen: true,
    approvalApplicable: false,
    approvedUser: true,
  },
  {
    transactionType: "Payment Voucher (PV)",
    allowNew: true,
    allowOpen: true,
    allowDelete: false,
    allowPrintInOpen: true,
    approvalApplicable: true,
    approvedUser: false,
  },
  {
    transactionType: "Contra Voucher (CV)",
    allowNew: true,
    allowOpen: true,
    allowDelete: false,
    allowPrintInOpen: false,
    approvalApplicable: false,
    approvedUser: fontTrue(),
  },
  {
    transactionType: "Petty Cash Voucher",
    allowNew: true,
    allowOpen: true,
    allowDelete: false,
    allowPrintInOpen: true,
    approvalApplicable: true,
    approvedUser: false,
  },
];

function fontTrue() {
  return true;
}

export interface VoucherTypeUserPrivilegeState {
  user: string;
  allowSundryDebtors: boolean;
  allowSundryCreditors: boolean;
  permissions: UserVoucherPermissionRow[];
  updateBy: string;
  updateDate: string;
}

export const sampleUserPrivilegeProfilesData: VoucherTypeUserPrivilegeState[] = [
  {
    user: "ABHIJIT",
    allowSundryDebtors: true,
    allowSundryCreditors: true,
    permissions: DEFAULT_VOUCHER_PERMISSION_ROWS,
    updateBy: "ADMIN",
    updateDate: "24-July-2026",
  },
  {
    user: "JAY ADMIN",
    allowSundryDebtors: true,
    allowSundryCreditors: true,
    permissions: DEFAULT_VOUCHER_PERMISSION_ROWS.map((p) => ({
      ...p,
      approvedUser: true,
      allowDelete: true,
    })),
    updateBy: "ADMIN",
    updateDate: "24-July-2026",
  },
  {
    user: "CASHIER_01",
    allowSundryDebtors: true,
    allowSundryCreditors: false,
    permissions: DEFAULT_VOUCHER_PERMISSION_ROWS.map((p) => ({
      ...p,
      allowDelete: false,
      approvedUser: false,
    })),
    updateBy: "ABHIJIT",
    updateDate: "20-July-2026",
  },
];
