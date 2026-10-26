"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  AlertTriangle,
  Calculator,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  History,
  Landmark,
  Lock,
  MoreVertical,
  Pencil,
  Play,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Square,
  Unlock,
  Users,
  Wallet,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button, Drawer, Modal } from "@/components/ui";
import { HREmployeeCell } from "@/components/hr/shared/HREmployeeCell";
import { usePropertyOptional } from "@/components/platform/PropertyProvider";
import { hrPayrollService } from "@/services/human-resources";
import { mapAuditFromApi, mapPayrollFromApi } from "@/lib/hr/api-mappers";
import { downloadXlsx } from "@/lib/xlsx";
import { cn } from "@/lib/utils";

export type PayrollStatus =
  | "Draft"
  | "Calculated"
  | "Verified"
  | "Approved"
  | "Partially Paid"
  | "Paid";

export interface EmployeePayrollRecord {
  id: string;
  employeeId: string;
  payrollMonth: number;
  payrollYear: number;
  payrollId: string;

  grossSalary: number;
  earningsTotal: number;
  deductionsTotal: number;
  netSalary: number;

  status: PayrollStatus;
  isLocked: boolean;
  calculatedAt?: string;
  verifiedAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;

  employeeName: string;
  empCode: string;
  department: string;
  designation: string;
  avatar: string;
  photoUrl?: string;
  bankName: string;
  bankAccount: string;
  ifscCode: string;
  
  basicSalary: number;
  hra: number;
  allowances: number;
  overtimePay: number;
  holidayPay: number;
  incentives: number;
  bonus: number;
  otherEarnings: number;
  
  leaveDeduction: number;
  pfDeduction: number;
  esiDeduction: number;
  ptDeduction: number;
  tdsDeduction: number;
  otherDeductions: number;

  payslipGenerated?: boolean;
  payslipId?: string;
  payslipNo?: string;
  payslipStatus?: "Generated" | "Sent";
  paidAmount: number;
  balanceAmount: number;
  
  hasAttendanceIssue?: boolean;
  missingBankDetails?: boolean;
  missingSalaryStructure?: boolean;
  missingPan?: boolean;
  pendingLeaveApproval?: boolean;
  pendingOtApproval?: boolean;
}

export interface PayrollAuditEntry {
  id: string;
  action: string;
  changedBy: string;
  changedOn: string;
  overrideReason?: string;
  auditNotes?: string;
}

type SalaryPayment = {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMode: string;
  transactionReference: string;
  status: string;
  remarks?: string;
  recordedBy: string;
  createdAt: string;
};

const MENU_WIDTH = 192;

const PAYMENT_MODES = ["Bank Transfer", "NEFT", "RTGS", "IMPS", "UPI", "Cheque", "Cash"] as const;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_STYLE: Record<PayrollStatus, string> = {
  Draft: "bg-amber-50 text-amber-800 ring-amber-200",
  Calculated: "bg-sky-50 text-sky-800 ring-sky-200",
  Verified: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  Approved: "bg-violet-50 text-violet-800 ring-violet-200",
  "Partially Paid": "bg-orange-50 text-orange-800 ring-orange-200",
  Paid: "bg-emerald-50 text-emerald-800 ring-emerald-200",
};

const EARNING_FIELDS = [
  ["basicSalary", "Basic salary"],
  ["hra", "HRA"],
  ["allowances", "Allowances"],
  ["overtimePay", "Overtime pay"],
  ["holidayPay", "Holiday pay"],
  ["incentives", "Incentives"],
  ["bonus", "Bonus"],
  ["otherEarnings", "Other earnings"],
] as const;

const DEDUCTION_FIELDS = [
  ["pfDeduction", "Provident fund (PF)"],
  ["esiDeduction", "ESI"],
  ["ptDeduction", "Professional tax (PT)"],
  ["tdsDeduction", "TDS / income tax"],
  ["leaveDeduction", "Leave / LOP"],
  ["otherDeductions", "Other deductions"],
] as const;

type AmountKey = (typeof EARNING_FIELDS)[number][0] | (typeof DEDUCTION_FIELDS)[number][0];

const FLAG_LABELS: [keyof EmployeePayrollRecord, string][] = [
  ["missingSalaryStructure", "No salary structure"],
  ["missingBankDetails", "Missing bank / IFSC"],
  ["missingPan", "Missing PAN"],
  ["hasAttendanceIssue", "Attendance pending"],
  ["pendingLeaveApproval", "Leave pending approval"],
  ["pendingOtApproval", "Overtime pending approval"],
];

const inr = (n: number) => `₹${(Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const lakhs = (n: number) => (n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : inr(n));
const todayIso = () => new Date().toISOString().slice(0, 10);

function formatTimestamp(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const flagsOf = (r: EmployeePayrollRecord) => FLAG_LABELS.filter(([key]) => Boolean(r[key])).map(([, label]) => label);
const canEdit = (r: EmployeePayrollRecord) => !r.isLocked && ["Draft", "Calculated", "Verified"].includes(r.status);
const canVerify = (r: EmployeePayrollRecord) => !r.isLocked && r.status === "Calculated";
const canApprove = (r: EmployeePayrollRecord) => !r.isLocked && (r.status === "Calculated" || r.status === "Verified");
const canPay = (r: EmployeePayrollRecord) => r.isLocked && (r.status === "Approved" || r.status === "Partially Paid");
const canSend = (r: EmployeePayrollRecord) => Boolean(r.payslipId) && r.payslipStatus === "Generated";
const canUnlock = (r: EmployeePayrollRecord) => r.isLocked && r.payslipStatus !== "Sent";

function StatusPill({ record }: { record: EmployeePayrollRecord }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1",
        STATUS_STYLE[record.status] ?? "bg-slate-50 text-slate-700 ring-slate-200",
      )}
    >
      {record.isLocked && <Lock className="h-3 w-3" />}
      {record.status}
    </span>
  );
}

function PayslipPill({ record }: { record: EmployeePayrollRecord }) {
  if (!record.payslipId) return <span className="text-[11px] text-slate-400">—</span>;
  return record.payslipStatus === "Sent" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
      <Send className="h-3 w-3" /> Sent
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
      <FileText className="h-3 w-3" /> Generated
    </span>
  );
}

type Confirm = { title: string; message: string; confirmLabel: string; onConfirm: () => Promise<void> };

export function ProcessPayrollView() {
  const propertyCtx = usePropertyOptional();
  const hotelName = propertyCtx?.property?.name ?? "Hotel";
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [records, setRecords] = useState<EmployeePayrollRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<PayrollAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [flagFilter, setFlagFilter] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ left: number; top?: number; bottom?: number } | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const [viewing, setViewing] = useState<EmployeePayrollRecord | null>(null);
  const [viewingPayments, setViewingPayments] = useState<SalaryPayment[]>([]);
  const [payslipFor, setPayslipFor] = useState<EmployeePayrollRecord | null>(null);
  const [editing, setEditing] = useState<EmployeePayrollRecord | null>(null);
  const [editAmounts, setEditAmounts] = useState<Record<AmountKey, number>>({} as Record<AmountKey, number>);
  const [editReason, setEditReason] = useState("");
  const [paying, setPaying] = useState<EmployeePayrollRecord | null>(null);
  const [bulkPayOpen, setBulkPayOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentDate: todayIso(),
    paymentMode: "Bank Transfer" as string,
    transactionReference: "",
    status: "Completed",
    remarks: "",
  });
  const [unlocking, setUnlocking] = useState<EmployeePayrollRecord | null>(null);
  const [unlockReason, setUnlockReason] = useState("");
  const [auditOpen, setAuditOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  const period = `${MONTHS[month - 1]} ${year}`;
  const notify = (message: string, variant: "success" | "error" = "success") => setToast({ message, variant });
  const errorText = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, audits] = await Promise.all([
        hrPayrollService.listRecords(month, year),
        hrPayrollService.listAuditLogs(),
      ]);
      setRecords(rows.map(mapPayrollFromApi));
      setAuditLogs(audits.map(mapAuditFromApi));
    } catch (e) {
      setRecords([]);
      setToast({ message: errorText(e, "Failed to load payroll"), variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([hrPayrollService.listRecords(month, year), hrPayrollService.listAuditLogs()])
      .then(([rows, audits]) => {
        if (cancelled) return;
        setRecords(rows.map(mapPayrollFromApi));
        setAuditLogs(audits.map(mapAuditFromApi));
      })
      .catch((e) => {
        if (cancelled) return;
        setRecords([]);
        setToast({ message: errorText(e, "Failed to load payroll"), variant: "error" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [month, year]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Element && !target.closest("[data-payroll-menu]")) setMenuFor(null);
      if (target instanceof Element && !target.closest("[data-payroll-export]")) setExportOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    if (!menuFor) return;
    const dismiss = (event: Event) => {
      if (event.target instanceof Element && event.target.closest("[data-payroll-menu]")) return;
      setMenuFor(null);
    };
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [menuFor]);

  /** Runs an action, reloads from the server, and reports the outcome. */
  const run = async (key: string, action: () => Promise<string>) => {
    setBusy(key);
    setMenuFor(null);
    try {
      const message = await action();
      await load();
      notify(message);
      return true;
    } catch (e) {
      notify(errorText(e, "Something went wrong"), "error");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const describeBatch = (verb: string, updated: number, skipped: { reason: string }[]) => {
    const head = `${verb} ${updated} record${updated === 1 ? "" : "s"}`;
    if (!skipped.length) return `${head}.`;
    return `${head}; ${skipped.length} skipped (${[...new Set(skipped.map((s) => s.reason))].slice(0, 2).join("; ")}).`;
  };

  /* ---------- derived ---------- */

  const departments = useMemo(
    () => [...new Set(records.map((r) => r.department).filter(Boolean))].sort(),
    [records],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (q && ![r.employeeName, r.empCode, r.department].some((v) => v.toLowerCase().includes(q))) return false;
      if (deptFilter !== "ALL" && r.department !== deptFilter) return false;
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (flagFilter === "ANY" && flagsOf(r).length === 0) return false;
      if (flagFilter && flagFilter !== "ANY" && !flagsOf(r).includes(flagFilter)) return false;
      return true;
    });
  }, [records, search, deptFilter, statusFilter, flagFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: records.length };
    for (const r of records) counts[r.status] = (counts[r.status] ?? 0) + 1;
    return counts;
  }, [records]);

  const filteredTotals = useMemo(
    () =>
      filtered.reduce(
        (t, r) => ({
          gross: t.gross + r.grossSalary,
          deductions: t.deductions + r.deductionsTotal,
          net: t.net + r.netSalary,
          paid: t.paid + r.paidAmount,
        }),
        { gross: 0, deductions: 0, net: 0, paid: 0 },
      ),
    [filtered],
  );

  const selected = useMemo(() => records.filter((r) => selectedIds.includes(r.id)), [records, selectedIds]);

  const stats = useMemo(() => {
    const count = (fn: (r: EmployeePayrollRecord) => boolean) => records.filter(fn).length;
    const sum = (fn: (r: EmployeePayrollRecord) => number) => records.reduce((s, r) => s + fn(r), 0);
    return {
      total: records.length,
      draft: count((r) => r.status === "Draft"),
      calculated: count((r) => r.status === "Calculated"),
      verified: count((r) => r.status === "Verified"),
      approvable: count(canApprove),
      locked: count((r) => r.isLocked),
      payslipsGenerated: count((r) => r.payslipStatus === "Generated"),
      payslipsSent: count((r) => r.payslipStatus === "Sent"),
      payable: count(canPay),
      paid: count((r) => r.status === "Paid"),
      flagged: count((r) => flagsOf(r).length > 0),
      gross: sum((r) => r.grossSalary),
      deductions: sum((r) => r.deductionsTotal),
      net: sum((r) => r.netSalary),
      paidAmount: sum((r) => r.paidAmount),
      outstanding: sum((r) => (r.isLocked ? r.balanceAmount : 0)),
    };
  }, [records]);

  const flagSummary = useMemo(
    () =>
      FLAG_LABELS.map(([key, label]) => ({ label, count: records.filter((r) => Boolean(r[key])).length })).filter(
        (f) => f.count > 0,
      ),
    [records],
  );

  /* ---------- actions ---------- */

  const calculate = (employeeIds?: string[]) =>
    run("calculate", async () => {
      const result = await hrPayrollService.calculate({ month, year, employeeIds });
      setSelectedIds([]);
      const parts = [`${result.calculated} calculated`];
      if (result.draft) parts.push(`${result.draft} draft (no salary structure)`);
      if (result.skipped.length) parts.push(`${result.skipped.length} skipped because they are locked`);
      return `Payroll for ${period}: ${parts.join(", ")}.`;
    });

  const verifyAll = (ids?: string[]) =>
    run("verify", async () => {
      const result = await hrPayrollService.verifyBatch(ids ? { ids } : { month, year });
      setSelectedIds([]);
      return describeBatch("Verified", result.updated, result.skipped);
    });

  const approveAll = (ids?: string[]) => {
    const targets = ids ? records.filter((r) => ids.includes(r.id) && canApprove(r)) : records.filter(canApprove);
    setConfirm({
      title: "Approve and lock payroll?",
      message: `${targets.length} record${targets.length === 1 ? "" : "s"} for ${period} will be approved and locked, and payslips will be generated. Locked records can't be edited or recalculated unless you unlock them.`,
      confirmLabel: "Approve & lock",
      onConfirm: async () => {
        await run("approve", async () => {
          const result = await hrPayrollService.approveBatch(ids ? { ids } : { month, year });
          setSelectedIds([]);
          return describeBatch("Approved & locked", result.updated, result.skipped);
        });
      },
    });
  };

  const sendPayslips = (payrollIds?: string[]) => {
    const targets = payrollIds
      ? records.filter((r) => payrollIds.includes(r.id) && canSend(r))
      : records.filter(canSend);
    setConfirm({
      title: "Send payslips?",
      message: `${targets.length} payslip${targets.length === 1 ? "" : "s"} will be marked as sent and become visible in the employee portal. Once a payslip is sent, its payroll can no longer be unlocked.`,
      confirmLabel: "Send payslips",
      onConfirm: async () => {
        await run("send", async () => {
          const result = await hrPayrollService.sendPayslipsBatch(payrollIds ? { payrollIds } : { month, year });
          setSelectedIds([]);
          return describeBatch("Sent payslips for", result.sent, result.skipped);
        });
      },
    });
  };

  const verifyOne = (r: EmployeePayrollRecord) =>
    run(`row-${r.id}`, async () => {
      await hrPayrollService.verifyRecord(r.id);
      return `Payroll verified for ${r.employeeName}.`;
    });

  const approveOne = (r: EmployeePayrollRecord) =>
    setConfirm({
      title: `Approve payroll for ${r.employeeName}?`,
      message: `Net pay ${inr(r.netSalary)} for ${period} will be locked and a payslip generated.`,
      confirmLabel: "Approve & lock",
      onConfirm: async () => {
        await run(`row-${r.id}`, async () => {
          await hrPayrollService.approveRecord(r.id);
          return `Payroll approved and locked for ${r.employeeName}. Payslip generated.`;
        });
      },
    });

  const sendOne = (r: EmployeePayrollRecord) =>
    setConfirm({
      title: `Send payslip to ${r.employeeName}?`,
      message: "The payslip becomes visible in the employee portal. After this, the payroll can't be unlocked.",
      confirmLabel: "Send payslip",
      onConfirm: async () => {
        await run(`row-${r.id}`, async () => {
          await hrPayrollService.sendPayslip(r.payslipId!);
          return `Payslip ${r.payslipNo ?? ""} sent to ${r.employeeName}.`;
        });
      },
    });

  const openView = async (r: EmployeePayrollRecord) => {
    setMenuFor(null);
    setViewing(r);
    setViewingPayments([]);
    try {
      const rows = await hrPayrollService.listPayments(r.id);
      setViewingPayments(rows as unknown as SalaryPayment[]);
    } catch {
      setViewingPayments([]);
    }
  };

  const openEdit = (r: EmployeePayrollRecord) => {
    setMenuFor(null);
    setEditing(r);
    setEditReason("");
    setEditAmounts(
      Object.fromEntries(
        [...EARNING_FIELDS, ...DEDUCTION_FIELDS].map(([key]) => [key, r[key]]),
      ) as Record<AmountKey, number>,
    );
  };

  const editTotals = useMemo(() => {
    const earnings = EARNING_FIELDS.reduce((s, [k]) => s + (Number(editAmounts[k]) || 0), 0);
    const deductions = DEDUCTION_FIELDS.reduce((s, [k]) => s + (Number(editAmounts[k]) || 0), 0);
    return { earnings, deductions, net: Math.max(0, earnings - deductions) };
  }, [editAmounts]);

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const ok = await run(`row-${editing.id}`, async () => {
      await hrPayrollService.updateRecord(editing.id, { ...editAmounts, overrideReason: editReason.trim() || undefined });
      return `Adjustments saved for ${editing.employeeName}. Net pay is now ${inr(editTotals.net)} — verify or approve again.`;
    });
    if (ok) setEditing(null);
  };

  const openPayment = (r: EmployeePayrollRecord) => {
    setMenuFor(null);
    setPaying(r);
    setPaymentForm({
      amount: r.balanceAmount,
      paymentDate: todayIso(),
      paymentMode: "Bank Transfer",
      transactionReference: "",
      status: "Completed",
      remarks: "",
    });
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paying) return;
    const ok = await run(`row-${paying.id}`, async () => {
      const result = await hrPayrollService.recordPayment(paying.id, paymentForm);
      return `Payment of ${inr(paymentForm.amount)} recorded for ${paying.employeeName}. Payroll is now ${result.payrollStatus}.`;
    });
    if (ok) setPaying(null);
  };

  const bulkPayTargets = useMemo(() => selected.filter(canPay), [selected]);

  const openBulkPay = () => {
    setPaymentForm({
      amount: 0,
      paymentDate: todayIso(),
      paymentMode: "Bank Transfer",
      transactionReference: "",
      status: "Completed",
      remarks: "",
    });
    setBulkPayOpen(true);
  };

  const submitBulkPay = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await run("bulk-pay", async () => {
      let done = 0;
      const failures: string[] = [];
      for (const r of bulkPayTargets) {
        try {
          await hrPayrollService.recordPayment(r.id, { ...paymentForm, amount: r.balanceAmount });
          done += 1;
        } catch (err) {
          failures.push(`${r.employeeName}: ${errorText(err, "failed")}`);
        }
      }
      setSelectedIds([]);
      if (failures.length) throw new Error(`Paid ${done}; failed ${failures.length} — ${failures.slice(0, 2).join("; ")}`);
      return `Recorded full payment for ${done} employee${done === 1 ? "" : "s"}.`;
    });
    if (ok) setBulkPayOpen(false);
  };

  const submitUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlocking) return;
    const ok = await run(`row-${unlocking.id}`, async () => {
      await hrPayrollService.unlockRecord(unlocking.id, unlockReason);
      return `Payroll unlocked for ${unlocking.employeeName}. Its payslip was removed — fix the numbers and approve again.`;
    });
    if (ok) setUnlocking(null);
  };

  /* ---------- exports ---------- */

  const exportRegister = () => {
    setExportOpen(false);
    downloadXlsx(`salary-register-${year}-${String(month).padStart(2, "0")}`, [
      {
        name: "Salary Register",
        title: `Salary Register — ${period}`,
        meta: [["Property", hotelName], ["Employees", filtered.length], ["Generated", new Date().toLocaleString("en-IN")]],
        header: [
          "Emp code", "Employee", "Department", "Designation",
          ...EARNING_FIELDS.map(([, l]) => l), "Gross",
          ...DEDUCTION_FIELDS.map(([, l]) => l), "Total deductions",
          "Net pay", "Paid", "Balance", "Status", "Payslip",
        ],
        rows: filtered.map((r) => [
          r.empCode, r.employeeName, r.department, r.designation,
          ...EARNING_FIELDS.map(([k]) => r[k]), r.grossSalary,
          ...DEDUCTION_FIELDS.map(([k]) => r[k]), r.deductionsTotal,
          r.netSalary, r.paidAmount, r.isLocked ? r.balanceAmount : r.netSalary, r.status, r.payslipStatus ?? "—",
        ]),
      },
    ]);
  };

  const exportBankSheet = () => {
    setExportOpen(false);
    const payable = filtered.filter(canPay);
    if (!payable.length) {
      notify("Nothing to pay — approve payroll first. The bank sheet only lists approved, unpaid salaries.", "error");
      return;
    }
    downloadXlsx(`bank-transfer-${year}-${String(month).padStart(2, "0")}`, [
      {
        name: "Bank Transfer",
        title: `Salary Bank Transfer — ${period}`,
        meta: [["Property", hotelName], ["Transfers", payable.length], ["Total", payable.reduce((s, r) => s + r.balanceAmount, 0)]],
        header: ["Emp code", "Employee", "Bank", "Account number", "IFSC", "Amount", "Narration"],
        rows: payable.map((r) => [
          r.empCode, r.employeeName, r.bankName, r.bankAccount, r.ifscCode, r.balanceAmount,
          `Salary ${MONTHS[month - 1].slice(0, 3)} ${year}`,
        ]),
      },
    ]);
  };

  /* ---------- render helpers ---------- */

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const allSelected = filtered.length > 0 && filtered.every((r) => selectedIds.includes(r.id));
  const toggleAll = () => setSelectedIds(allSelected ? [] : filtered.map((r) => r.id));

  const menuItem = (
    label: string,
    icon: React.ReactNode,
    onClick: () => void,
    tone: "default" | "primary" | "danger" = "default",
  ) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium",
        tone === "primary" && "text-emerald-800 hover:bg-emerald-50",
        tone === "danger" && "text-rose-700 hover:bg-rose-50",
        tone === "default" && "text-slate-700 hover:bg-slate-50",
      )}
    >
      {icon}
      {label}
    </button>
  );

  const renderMenu = (r: EmployeePayrollRecord) => {
    const items: React.ReactNode[] = [
      menuItem("View details", <Eye className="h-3.5 w-3.5" />, () => void openView(r)),
    ];
    if (canEdit(r)) {
      items.push(menuItem("Edit amounts", <Pencil className="h-3.5 w-3.5" />, () => openEdit(r)));
      items.push(menuItem("Recalculate", <RefreshCw className="h-3.5 w-3.5" />, () => void calculate([r.employeeId])));
    }
    if (canVerify(r)) items.push(menuItem("Verify", <ShieldCheck className="h-3.5 w-3.5" />, () => void verifyOne(r), "primary"));
    if (canApprove(r)) items.push(menuItem("Approve & lock", <Lock className="h-3.5 w-3.5" />, () => approveOne(r), "primary"));
    if (r.payslipId) items.push(menuItem("View payslip", <FileText className="h-3.5 w-3.5" />, () => { setMenuFor(null); setPayslipFor(r); }));
    if (canSend(r)) items.push(menuItem("Send payslip", <Send className="h-3.5 w-3.5" />, () => sendOne(r), "primary"));
    if (canPay(r)) items.push(menuItem("Record payment", <Landmark className="h-3.5 w-3.5" />, () => openPayment(r), "primary"));
    if (canUnlock(r)) {
      items.push(
        menuItem("Unlock", <Unlock className="h-3.5 w-3.5" />, () => {
          setMenuFor(null);
          setUnlockReason("");
          setUnlocking(r);
        }, "danger"),
      );
    }
    const toggleMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (menuFor === r.id) {
        setMenuFor(null);
        return;
      }
      const rect = event.currentTarget.getBoundingClientRect();
      const estimatedHeight = items.length * 34 + 14;
      const openUp = window.innerHeight - rect.bottom < estimatedHeight + 8 && rect.top > estimatedHeight + 8;
      setMenuPos({
        left: Math.max(8, rect.right - MENU_WIDTH),
        top: openUp ? undefined : rect.bottom + 4,
        bottom: openUp ? window.innerHeight - rect.top + 4 : undefined,
      });
      setMenuFor(r.id);
    };
    return (
      <div className="inline-block" data-payroll-menu>
        <button
          type="button"
          disabled={busy === `row-${r.id}`}
          onClick={toggleMenu}
          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          aria-label={`Actions for ${r.employeeName}`}
        >
          {busy === `row-${r.id}` ? <RefreshCw className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
        </button>
        {menuFor === r.id &&
          menuPos &&
          createPortal(
            <div
              data-payroll-menu
              style={{ position: "fixed", left: menuPos.left, top: menuPos.top, bottom: menuPos.bottom, width: MENU_WIDTH }}
              className="z-[60] space-y-0.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
            >
              {items}
            </div>,
            document.body,
          )}
      </div>
    );
  };

  type Step = {
    key: string;
    title: string;
    hint: string;
    value: number;
    done: boolean;
    summary: string;
    optional?: boolean;
    actionLabel?: string;
    actionIcon?: React.ReactNode;
    onAction?: () => void;
    disabled?: boolean;
  };

  const ratio = (n: number, d: number) => (d > 0 ? Math.min(1, n / d) : 0);
  const noStructure = records.filter((r) => r.missingSalaryStructure).length;

  const steps: Step[] = [
    {
      key: "calculate",
      title: "Calculate",
      hint: "From salary structures",
      value: ratio(stats.total - stats.draft, stats.total),
      done: stats.total > 0 && stats.draft === 0,
      summary: stats.total ? `${stats.total - stats.draft} of ${stats.total} calculated` : "Not started",
      actionLabel: stats.total ? "Recalculate" : "Calculate payroll",
      actionIcon: busy === "calculate" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />,
      onAction: () => void calculate(),
      disabled: stats.total > 0 && stats.locked === stats.total,
    },
    {
      key: "verify",
      title: "Verify",
      hint: "HR double-check",
      optional: true,
      value: ratio(stats.verified + stats.locked, stats.total),
      done: stats.total > 0 && stats.calculated === 0 && stats.draft === 0,
      summary: `${stats.verified} verified · ${stats.calculated} waiting`,
      actionLabel: `Verify all (${stats.calculated})`,
      actionIcon: <ShieldCheck className="h-3.5 w-3.5" />,
      onAction: () => void verifyAll(),
      disabled: stats.calculated === 0,
    },
    {
      key: "approve",
      title: "Approve & lock",
      hint: "Locks pay, makes payslips",
      value: ratio(stats.locked, stats.total),
      done: stats.total > 0 && stats.locked === stats.total,
      summary: `${stats.locked} of ${stats.total} locked`,
      actionLabel: `Approve all (${stats.approvable})`,
      actionIcon: <Lock className="h-3.5 w-3.5" />,
      onAction: () => approveAll(),
      disabled: stats.approvable === 0,
    },
    {
      key: "send",
      title: "Send payslips",
      hint: "Shown in employee portal",
      value: ratio(stats.payslipsSent, stats.total),
      done: stats.total > 0 && stats.payslipsSent === stats.total,
      summary: `${stats.payslipsSent} sent · ${stats.payslipsGenerated} ready`,
      actionLabel: `Send all (${stats.payslipsGenerated})`,
      actionIcon: <Send className="h-3.5 w-3.5" />,
      onAction: () => sendPayslips(),
      disabled: stats.payslipsGenerated === 0,
    },
    {
      key: "pay",
      title: "Record payments",
      hint: "Partial or full",
      value: ratio(stats.paid, stats.total),
      done: stats.total > 0 && stats.paid === stats.total,
      summary: `${stats.paid} of ${stats.total} paid`,
      actionLabel: `Pay all due (${stats.payable})`,
      actionIcon: <Landmark className="h-3.5 w-3.5" />,
      onAction: () => {
        setSelectedIds(records.filter(canPay).map((r) => r.id));
        openBulkPay();
      },
      disabled: stats.payable === 0,
    },
  ];
  const currentStep = Math.max(0, steps.findIndex((s) => !s.done));

  const progressPct = useMemo(() => {
    if (!records.length) return 0;
    const base: Record<PayrollStatus, number> = {
      Draft: 0, Calculated: 1, Verified: 1.5, Approved: 2, "Partially Paid": 2.5, Paid: 3,
    };
    const score = records.reduce((s, r) => s + (base[r.status] ?? 0) + (r.payslipStatus === "Sent" ? 1 : 0), 0);
    return Math.round((score / (records.length * 4)) * 100);
  }, [records]);

  const nextHint = (() => {
    if (loading) return "Loading…";
    if (!stats.total) return `Start by calculating payroll for all active employees for ${period}.`;
    if (noStructure) return `${noStructure} employee${noStructure === 1 ? " has" : "s have"} no salary structure — assign one, then recalculate.`;
    if (stats.approvable) return `${stats.approvable} record${stats.approvable === 1 ? " is" : "s are"} ready to verify and approve.`;
    if (stats.payslipsGenerated) return `${stats.payslipsGenerated} payslip${stats.payslipsGenerated === 1 ? " is" : "s are"} ready to send.`;
    if (stats.payable) return `${inr(stats.outstanding)} still to be paid to ${stats.payable} employee${stats.payable === 1 ? "" : "s"}.`;
    if (stats.paid === stats.total) return `All salaries for ${period} are paid.`;
    return "";
  })();

  const changePeriod = (m: number, y: number) => {
    if (m === month && y === year) return;
    setLoading(true);
    setSelectedIds([]);
    setMonth(m);
    setYear(y);
  };
  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    changePeriod(d.getMonth() + 1, d.getFullYear());
  };

  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 4 + i);

  const summaryCells = [
    { label: "Employees", value: `${stats.total}`, sub: `${stats.draft} draft · ${stats.locked} locked`, icon: Users, tone: "bg-sky-50 text-sky-700" },
    { label: "Gross payroll", value: lakhs(stats.gross), sub: `Deductions ${lakhs(stats.deductions)}`, icon: Calculator, tone: "bg-violet-50 text-violet-700" },
    { label: "Net payable", value: lakhs(stats.net), sub: `${stats.paid} fully paid`, icon: Wallet, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Outstanding", value: lakhs(stats.outstanding), sub: `Paid so far ${lakhs(stats.paidAmount)}`, icon: CreditCard, tone: "bg-amber-50 text-amber-700" },
  ];

  return (
    <ModulePageShell
      eyebrow="Human Resource / Payroll"
      title="Process Payroll"
      description="Run the monthly payroll: calculate, verify, approve & lock, send payslips, then record salary payments."
      breadcrumbs={[
        { label: "Human Resource", href: "/human-resources/dashboard" },
        { label: "Payroll" },
        { label: "Process Payroll" },
      ]}
      toast={toast?.message ?? null}
      toastVariant={toast?.variant}
      onDismissToast={() => setToast(null)}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setAuditOpen(true)} className="rounded-xl text-xs">
            <History className="mr-1 h-3.5 w-3.5" /> Audit history
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading} className="rounded-xl text-xs">
            <RefreshCw className={cn("mr-1 h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
              </Button>
          <div className="relative" data-payroll-export>
            <Button type="button" variant="outline" size="sm" onClick={() => setExportOpen((v) => !v)} className="rounded-xl text-xs">
              <Download className="mr-1 h-3.5 w-3.5" /> Export <ChevronDown className="ml-1 h-3.5 w-3.5" />
              </Button>
            {exportOpen && (
              <div className="absolute right-0 top-full z-40 mt-1 w-56 space-y-0.5 rounded-xl border border-slate-200 bg-white p-1.5 text-xs shadow-xl">
                <button type="button" onClick={exportRegister} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-medium text-slate-700 hover:bg-slate-50">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" /> Salary register (.xlsx)
                </button>
                <button type="button" onClick={exportBankSheet} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left font-medium text-slate-700 hover:bg-slate-50">
                  <Landmark className="h-3.5 w-3.5 text-violet-700" /> Bank transfer sheet (.xlsx)
                </button>
              </div>
            )}
          </div>
        </div>
      }
    >
      <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {/* Period bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-linear-to-r from-slate-900 via-slate-900 to-emerald-950 px-5 py-4 text-white">
          <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
              onClick={() => shiftMonth(-1)}
              className="rounded-lg bg-white/10 p-2 transition hover:bg-white/20"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
                </button>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Pay period</p>
              <div className="flex items-center">
                <select
                  value={month}
                  onChange={(e) => changePeriod(Number(e.target.value), year)}
                  className="cursor-pointer bg-transparent pr-1 text-lg font-bold focus:outline-none [&>option]:text-slate-900"
                  aria-label="Payroll month"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select
                  value={year}
                  onChange={(e) => changePeriod(month, Number(e.target.value))}
                  className="cursor-pointer bg-transparent text-lg font-bold focus:outline-none [&>option]:text-slate-900"
                  aria-label="Payroll year"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
                <button
                  type="button"
              onClick={() => shiftMonth(1)}
              className="rounded-lg bg-white/10 p-2 transition hover:bg-white/20"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
                </button>
            <span className="rounded-full bg-white/10 px-2.5 py-1 font-mono text-[10px] text-slate-300">
              PAY-{year}-{String(month).padStart(2, "0")}
            </span>
            {stats.total > 0 && stats.locked === stats.total && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-1 text-[10px] font-semibold text-amber-300">
                <Lock className="h-3 w-3" /> Locked
              </span>
            )}
          </div>

          <div className="w-full max-w-sm sm:w-auto sm:min-w-[280px]">
            <div className="flex items-baseline justify-between text-[11px]">
              <span className="font-medium text-slate-300">Payroll progress</span>
              <span className="text-base font-bold text-amber-300">{progressPct}%</span>
        </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-linear-to-r from-emerald-400 to-amber-300 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">{nextHint}</p>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-px bg-slate-100 lg:grid-cols-4">
          {summaryCells.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} className="flex items-center gap-3 bg-white px-5 py-4">
                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", c.tone)}>
                  <Icon className="h-5 w-5" />
          </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{c.label}</p>
                  <p className="text-xl font-bold leading-tight text-slate-900">{c.value}</p>
                  <p className="truncate text-[11px] text-slate-500">{c.sub}</p>
          </div>
              </div>
            );
          })}
        </div>

        {/* Workflow stepper */}
        <ol className="grid grid-cols-1 gap-3 border-t border-slate-100 bg-slate-50/60 p-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, i) => {
            const state = step.done ? "done" : i === currentStep ? "current" : "todo";
            return (
              <li
                key={step.key}
                className={cn(
                  "relative flex flex-col rounded-xl border bg-white p-3 transition",
                  state === "current" && "border-emerald-300 shadow-sm ring-2 ring-emerald-100",
                  state === "done" && "border-emerald-100",
                  state === "todo" && "border-slate-200",
                )}
              >
                {i < steps.length - 1 && (
                  <ChevronRight className="absolute -right-[15px] top-[22px] z-10 hidden h-4 w-4 rounded-full bg-slate-50 text-slate-300 lg:block" />
                )}
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      state === "done" && "bg-emerald-600 text-white",
                      state === "current" && "bg-emerald-50 text-emerald-700 ring-2 ring-emerald-600",
                      state === "todo" && "bg-slate-100 text-slate-500",
                    )}
                  >
                    {state === "done" ? <Check className="h-4 w-4" /> : i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      {step.title}
                      {step.optional && (
                        <span className="rounded bg-slate-100 px-1 py-px text-[9px] font-semibold uppercase text-slate-500">Optional</span>
                      )}
                    </p>
                    <p className="truncate text-[10px] text-slate-500">{step.hint}</p>
                </div>
              </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", step.done ? "bg-emerald-500" : "bg-emerald-400/80")}
                    style={{ width: `${Math.round(step.value * 100)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] font-medium text-slate-600">{step.summary}</p>
                {step.actionLabel && (
                  <Button
                    type="button"
                    size="sm"
                    variant={state === "current" ? undefined : "outline"}
                    disabled={busy !== null || loading || step.disabled}
                    onClick={step.onAction}
                    className={cn(
                      "mt-3 h-8 w-full gap-1.5 rounded-lg text-[11px] font-semibold",
                      state === "current" && "bg-emerald-700 text-white hover:bg-emerald-800",
                    )}
                  >
                    {step.actionIcon}
                    {step.actionLabel}
                  </Button>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Validation flags */}
      {flagSummary.length > 0 && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
              <AlertTriangle className="h-4 w-4 text-amber-700" />
            </span>
            <span className="font-semibold text-amber-950">
              {stats.flagged} employee{stats.flagged === 1 ? " needs" : "s need"} attention
            </span>
            <span className="text-amber-800/80">— click a chip to see who</span>
            {noStructure > 0 && (
              <Link href="/human-resources/payroll/salary-structure" className="ml-auto font-semibold text-amber-900 underline underline-offset-2">
                Set up salary structures →
              </Link>
            )}
      </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {flagSummary.map((f) => {
              const active = flagFilter === f.label;
              return (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => setFlagFilter(active ? null : f.label)}
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-semibold ring-1 transition",
                    active ? "bg-amber-600 text-white ring-amber-600" : "bg-white text-amber-900 ring-amber-200 hover:bg-amber-100",
                  )}
                >
                  {f.label} · {f.count}
                </button>
              );
            })}
            {flagFilter && (
              <button type="button" onClick={() => setFlagFilter(null)} className="px-2 text-[11px] font-semibold text-amber-900 underline">
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filters + bulk bar */}
      <div className="mb-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, code, department…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium">
            <option value="ALL">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          </div>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
          {(["ALL", ...Object.keys(STATUS_STYLE)] as string[]).map((s) => {
            const active = statusFilter === s;
            const count = statusCounts[s] ?? 0;
            return (
              <button
                key={s}
            type="button"
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition",
                  active ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100",
                  !active && count === 0 && "opacity-50",
                )}
              >
                {s === "ALL" ? "All" : s}
                <span className={cn("rounded-full px-1.5 text-[10px]", active ? "bg-white/20" : "bg-white text-slate-500 ring-1 ring-slate-200")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-900 p-2.5 text-xs text-white">
            <span className="flex items-center gap-1.5 px-1 font-semibold">
              <CheckSquare className="h-4 w-4 text-emerald-400" /> {selected.length} selected
            </span>
            <div className="ml-auto flex flex-wrap gap-2">
              {[
                { label: "Recalculate", count: selected.filter(canEdit).length, onClick: () => void calculate(selected.filter(canEdit).map((r) => r.employeeId)) },
                { label: "Verify", count: selected.filter(canVerify).length, onClick: () => void verifyAll(selected.filter(canVerify).map((r) => r.id)) },
                { label: "Approve & lock", count: selected.filter(canApprove).length, onClick: () => approveAll(selected.filter(canApprove).map((r) => r.id)) },
                { label: "Send payslips", count: selected.filter(canSend).length, onClick: () => sendPayslips(selected.filter(canSend).map((r) => r.id)) },
                { label: "Pay in full", count: bulkPayTargets.length, onClick: openBulkPay },
              ].map((b) => (
                <button
                  key={b.label}
                type="button"
                  disabled={b.count === 0 || busy !== null}
                  onClick={b.onClick}
                  className="rounded-lg bg-white/10 px-2.5 py-1.5 font-semibold hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {b.label} ({b.count})
                </button>
              ))}
              <button type="button" onClick={() => setSelectedIds([])} className="rounded-lg px-2.5 py-1.5 text-slate-300 hover:text-white">
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
              <tr>
                <th className="w-10 px-3 py-3 text-center">
                  <button type="button" onClick={toggleAll} aria-label="Select all">
                    {allSelected ? <CheckSquare className="h-4 w-4 text-emerald-700" /> : <Square className="h-4 w-4" />}
                  </button>
                </th>
                <th className="px-3 py-3">Employee</th>
                <th className="px-3 py-3 text-right">Gross</th>
                <th className="px-3 py-3 text-right">Deductions</th>
                <th className="px-3 py-3 text-right">Net pay</th>
                <th className="px-3 py-3 text-right">Paid / balance</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Payslip</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-500">Loading payroll…</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <p className="font-semibold text-slate-800">
                      {records.length ? "No records match the filters" : `No payroll for ${period} yet`}
                    </p>
                    {!records.length && (
                      <p className="mt-1 text-slate-500">Click <strong>Calculate</strong> above to build payroll for every active employee.</p>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const flags = flagsOf(r);
                  const expanded = expandedIds.includes(r.id);
                return (
                  <React.Fragment key={r.id}>
                      <tr className={cn("transition-colors hover:bg-slate-50/80", selectedIds.includes(r.id) && "bg-emerald-50/50 hover:bg-emerald-50/70")}>
                        <td className="px-3 py-3 text-center">
                          <button type="button" onClick={() => toggleSelect(r.id)} aria-label={`Select ${r.employeeName}`}>
                            {selectedIds.includes(r.id) ? <CheckSquare className="h-4 w-4 text-emerald-700" /> : <Square className="h-4 w-4 text-slate-400" />}
                        </button>
                      </td>
                        <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                              onClick={() => setExpandedIds((prev) => (prev.includes(r.id) ? prev.filter((x) => x !== r.id) : [...prev, r.id]))}
                              className="rounded-md p-1 text-slate-500 hover:bg-slate-200"
                              aria-label="Show breakdown"
                            >
                              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
                          </button>
                            <HREmployeeCell name={r.employeeName} id={r.empCode || r.employeeId} avatar={r.avatar} photoUrl={r.photoUrl} department={r.department} />
                            {flags.length > 0 && (
                              <span title={flags.join("\n")} className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-200">
                                <AlertTriangle className="h-3 w-3" /> {flags.length}
                              </span>
                            )}
                        </div>
                      </td>
                        {r.status === "Draft" && r.grossSalary === 0 ? (
                          <td colSpan={3} className="px-3 py-3 text-center text-[11px] italic text-slate-400">
                            {r.missingSalaryStructure ? "No salary structure assigned" : "Not calculated yet"}
                      </td>
                        ) : (
                          <>
                            <td className="px-3 py-3 text-right font-semibold text-slate-900">{inr(r.grossSalary)}</td>
                            <td className="px-3 py-3 text-right font-medium text-rose-700">
                              {r.deductionsTotal ? `−${inr(r.deductionsTotal)}` : <span className="text-slate-400">—</span>}
                      </td>
                            <td className="px-3 py-3 text-right font-bold text-emerald-800">{inr(r.netSalary)}</td>
                          </>
                        )}
                        <td className="px-3 py-3 text-right">
                          {r.isLocked ? (
                            <>
                              <span className="font-semibold text-slate-800">{inr(r.paidAmount)}</span>
                              {r.balanceAmount > 0 && <span className="block text-[10px] text-orange-700">{inr(r.balanceAmount)} due</span>}
                            </>
                          ) : (
                            <span className="text-slate-400">—</span>
                        )}
                      </td>
                        <td className="px-3 py-3"><StatusPill record={r} /></td>
                        <td className="px-3 py-3"><PayslipPill record={r} /></td>
                        <td className="px-3 py-3 text-right">{renderMenu(r)}</td>
                    </tr>
                      {expanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={9} className="px-4 py-3">
                            <div className="grid gap-3 text-xs sm:grid-cols-3">
                              <div className="rounded-xl border border-emerald-200 bg-white p-3">
                                <p className="mb-1 font-semibold text-emerald-900">Earnings</p>
                                {EARNING_FIELDS.filter(([k]) => r[k]).map(([k, l]) => (
                                  <p key={k} className="flex justify-between"><span>{l}</span><strong>{inr(r[k])}</strong></p>
                                ))}
                            </div>
                              <div className="rounded-xl border border-rose-200 bg-white p-3">
                                <p className="mb-1 font-semibold text-rose-900">Deductions</p>
                                {DEDUCTION_FIELDS.filter(([k]) => r[k]).map(([k, l]) => (
                                  <p key={k} className="flex justify-between"><span>{l}</span><strong>{inr(r[k])}</strong></p>
                                ))}
                                {!DEDUCTION_FIELDS.some(([k]) => r[k]) && <p className="text-slate-400">None</p>}
                            </div>
                              <div className="rounded-xl border border-slate-200 bg-white p-3">
                                <p className="mb-1 font-semibold text-slate-900">Checks</p>
                                {flags.length ? flags.map((f) => (
                                  <p key={f} className="flex items-center gap-1 text-amber-800"><AlertTriangle className="h-3 w-3" /> {f}</p>
                                )) : <p className="flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-3 w-3" /> All checks passed</p>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
                })
              )}
            </tbody>
            {!loading && filtered.length > 0 && (
              <tfoot className="border-t-2 border-slate-200 bg-slate-50 text-xs font-bold text-slate-900">
                <tr>
                  <td />
                  <td className="px-3 py-3 text-[11px] uppercase text-slate-500">
                    Total · {filtered.length} employee{filtered.length === 1 ? "" : "s"}
                  </td>
                  <td className="px-3 py-3 text-right">{inr(filteredTotals.gross)}</td>
                  <td className="px-3 py-3 text-right text-rose-700">−{inr(filteredTotals.deductions)}</td>
                  <td className="px-3 py-3 text-right text-emerald-800">{inr(filteredTotals.net)}</td>
                  <td className="px-3 py-3 text-right">{inr(filteredTotals.paid)}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Confirm dialog */}
      {confirm && (
        <Modal isOpen onClose={() => setConfirm(null)} title={confirm.title} size="md">
          <p className="text-sm text-slate-600">{confirm.message}</p>
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button
              type="button"
              size="sm"
              disabled={busy !== null}
              className="bg-emerald-700 text-white hover:bg-emerald-800"
              onClick={async () => {
                const action = confirm.onConfirm;
                setConfirm(null);
                await action();
              }}
            >
              {confirm.confirmLabel}
            </Button>
            </div>
        </Modal>
      )}

      {/* Edit amounts */}
      {editing && (
        <Modal isOpen onClose={() => setEditing(null)} title={`Edit payroll — ${editing.employeeName}`} description={`${period} · changes reset the record to Calculated so it is verified again.`} size="lg">
          <form onSubmit={saveEdit} className="space-y-4 text-xs">
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { title: "Earnings", fields: EARNING_FIELDS, tone: "border-emerald-200 bg-emerald-50/40" },
                { title: "Deductions", fields: DEDUCTION_FIELDS, tone: "border-rose-200 bg-rose-50/40" },
              ].map((group) => (
                <div key={group.title} className={cn("space-y-2 rounded-xl border p-3", group.tone)}>
                  <p className="font-semibold text-slate-900">{group.title}</p>
                  {group.fields.map(([key, label]) => (
                    <label key={key} className="flex items-center justify-between gap-2">
                      <span className="text-slate-600">{label}</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={editAmounts[key] ?? 0}
                        onChange={(e) => setEditAmounts((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                        className="w-28 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right font-semibold"
                      />
                    </label>
                  ))}
              </div>
              ))}
              </div>
            <div className="flex flex-wrap justify-between gap-2 rounded-xl bg-slate-900 p-3 text-white">
              <span>Gross {inr(editTotals.earnings)}</span>
              <span>Deductions {inr(editTotals.deductions)}</span>
              <span className="font-bold text-amber-300">Net {inr(editTotals.net)}</span>
              </div>
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Reason for adjustment</span>
              <input
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="e.g. Festival bonus, LOP for 2 days"
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={busy !== null} className="bg-emerald-700 text-white hover:bg-emerald-800">Save adjustments</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Record payment */}
      {paying && (
        <Modal isOpen onClose={() => setPaying(null)} title={`Record payment — ${paying.employeeName}`} description={`${period} · net ${inr(paying.netSalary)}, paid ${inr(paying.paidAmount)}, balance ${inr(paying.balanceAmount)}`} size="md">
          <form onSubmit={submitPayment} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block font-semibold text-slate-700">Amount (₹)</span>
                <input
                  type="number"
                  required
                  min={0.01}
                  step="0.01"
                  max={paymentForm.status === "Completed" ? paying.balanceAmount : undefined}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, amount: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 font-semibold"
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-semibold text-slate-700">Payment date</span>
                <input type="date" required value={paymentForm.paymentDate} onChange={(e) => setPaymentForm((p) => ({ ...p, paymentDate: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
              </label>
              <label className="block">
                <span className="mb-1 block font-semibold text-slate-700">Mode</span>
                <select value={paymentForm.paymentMode} onChange={(e) => setPaymentForm((p) => ({ ...p, paymentMode: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2">
                  {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block font-semibold text-slate-700">Status</span>
                <select value={paymentForm.status} onChange={(e) => setPaymentForm((p) => ({ ...p, status: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <option>Completed</option>
                  <option>Pending</option>
                  <option>Failed</option>
                </select>
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Transaction reference</span>
              <input value={paymentForm.transactionReference} onChange={(e) => setPaymentForm((p) => ({ ...p, transactionReference: e.target.value }))} placeholder="UTR / cheque no." className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono" />
            </label>
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Remarks</span>
              <input value={paymentForm.remarks} onChange={(e) => setPaymentForm((p) => ({ ...p, remarks: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
            </label>
            <p className="rounded-xl bg-sky-50 p-2.5 text-sky-900">
              Only <strong>Completed</strong> payments count. Paying less than the balance marks the payroll <strong>Partially Paid</strong>; paying the rest marks it <strong>Paid</strong>.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPaying(null)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={busy !== null} className="bg-blue-700 text-white hover:bg-blue-800">Record payment</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Bulk pay */}
      {bulkPayOpen && (
        <Modal isOpen onClose={() => setBulkPayOpen(false)} title={`Pay ${bulkPayTargets.length} employee${bulkPayTargets.length === 1 ? "" : "s"} in full`} description={`Records one completed payment per employee for their outstanding balance — total ${inr(bulkPayTargets.reduce((s, r) => s + r.balanceAmount, 0))}.`} size="md">
          <form onSubmit={submitBulkPay} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block font-semibold text-slate-700">Payment date</span>
                <input type="date" required value={paymentForm.paymentDate} onChange={(e) => setPaymentForm((p) => ({ ...p, paymentDate: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
              </label>
              <label className="block">
                <span className="mb-1 block font-semibold text-slate-700">Mode</span>
                <select value={paymentForm.paymentMode} onChange={(e) => setPaymentForm((p) => ({ ...p, paymentMode: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2">
                  {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
                </select>
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Batch / bank reference</span>
              <input value={paymentForm.transactionReference} onChange={(e) => setPaymentForm((p) => ({ ...p, transactionReference: e.target.value }))} placeholder="Bulk upload reference" className="w-full rounded-xl border border-slate-200 px-3 py-2 font-mono" />
            </label>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200">
              {bulkPayTargets.map((r) => (
                <div key={r.id} className="flex justify-between border-b border-slate-100 px-3 py-1.5 last:border-0">
                  <span>{r.employeeName}</span>
                  <strong>{inr(r.balanceAmount)}</strong>
          </div>
        ))}
      </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setBulkPayOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={busy !== null || bulkPayTargets.length === 0} className="bg-blue-700 text-white hover:bg-blue-800">
                {busy === "bulk-pay" ? "Recording…" : "Record payments"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Unlock */}
      {unlocking && (
        <Modal isOpen onClose={() => setUnlocking(null)} title={`Unlock payroll — ${unlocking.employeeName}`} size="md">
          <form onSubmit={submitUnlock} className="space-y-3 text-xs">
            <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-900">
              Unlocking deletes the generated payslip and moves this record back to <strong>Calculated</strong> so it can be corrected and approved again.
              {unlocking.paidAmount > 0 && (
                <> {inr(unlocking.paidAmount)} already paid stays recorded and will count again after re-approval.</>
              )}
            </p>
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">Reason (required)</span>
              <textarea
                required
                rows={3}
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                placeholder="What needs to be corrected?"
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setUnlocking(null)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={busy !== null || !unlockReason.trim()} className="bg-rose-600 text-white hover:bg-rose-700">Unlock payroll</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Audit */}
      {auditOpen && (
        <Modal isOpen onClose={() => setAuditOpen(false)} title="Payroll audit history" size="lg">
          <div className="max-h-[65vh] space-y-2 overflow-y-auto pr-1 text-xs">
            {auditLogs.length === 0 && <p className="text-slate-500">No payroll activity yet.</p>}
            {auditLogs.map((log) => (
              <div key={log.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="font-semibold text-slate-900">{log.action}</span>
                  <span className="shrink-0 text-[10px] text-slate-400">{formatTimestamp(log.changedOn)}</span>
                </div>
                <p className="text-slate-600">By {log.changedBy}</p>
                {log.overrideReason && <p className="text-slate-600">Reason: {log.overrideReason}</p>}
                {log.auditNotes && <p className="italic text-slate-500">“{log.auditNotes}”</p>}
                </div>
            ))}
                </div>
        </Modal>
      )}

      {/* View details */}
      <Drawer isOpen={Boolean(viewing)} onClose={() => setViewing(null)} title="Payroll details" subtitle={period} icon={<Calculator className="h-5 w-5 text-emerald-700" />}>
        {viewing && (
          <div className="space-y-4 text-xs">
            <HREmployeeCell name={viewing.employeeName} id={viewing.empCode || viewing.employeeId} avatar={viewing.avatar} photoUrl={viewing.photoUrl} department={viewing.department} designation={viewing.designation} />
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill record={viewing} />
              <PayslipPill record={viewing} />
              {viewing.payslipNo && <span className="font-mono text-[11px] text-slate-500">{viewing.payslipNo}</span>}
                </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                ["Gross", viewing.grossSalary, "text-slate-900"],
                ["Deductions", viewing.deductionsTotal, "text-rose-700"],
                ["Net pay", viewing.netSalary, "text-emerald-800"],
                ["Paid", viewing.paidAmount, "text-sky-800"],
              ].map(([label, value, tone]) => (
                <div key={label as string} className="rounded-xl border border-slate-200 p-3">
                  <p className="text-[10px] font-semibold uppercase text-slate-500">{label}</p>
                  <p className={cn("text-base font-bold", tone as string)}>{inr(value as number)}</p>
                </div>
              ))}
                </div>

            <div className="rounded-xl border border-slate-200 p-3">
              <p className="mb-2 font-semibold text-slate-900">Timeline</p>
              {[
                ["Calculated", viewing.calculatedAt],
                ["Verified", viewing.verifiedAt],
                ["Approved & locked", viewing.approvedAt],
              ].map(([label, at]) => (
                <p key={label} className="flex justify-between py-0.5">
                  <span className="text-slate-600">{label}</span>
                  <span className={at ? "font-medium text-slate-900" : "text-slate-400"}>{formatTimestamp(at)}</span>
                </p>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
                <p className="mb-1 font-semibold text-emerald-900">Earnings</p>
                {EARNING_FIELDS.map(([k, l]) => (
                  <p key={k} className="flex justify-between"><span>{l}</span><strong>{inr(viewing[k])}</strong></p>
                ))}
                </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3">
                <p className="mb-1 font-semibold text-rose-900">Deductions</p>
                {DEDUCTION_FIELDS.map(([k, l]) => (
                  <p key={k} className="flex justify-between"><span>{l}</span><strong>{inr(viewing[k])}</strong></p>
                ))}
                </div>
                </div>

            <div className="rounded-xl border border-slate-200 p-3">
              <p className="mb-2 font-semibold text-slate-900">Salary payments</p>
              {viewingPayments.length === 0 ? (
                <p className="text-slate-500">No payments recorded.</p>
              ) : (
                <div className="space-y-2">
                  {viewingPayments.map((p) => (
                    <div key={p.id} className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                      <div className="flex justify-between">
                        <strong>{inr(Number(p.amount))}</strong>
                        <span className={cn("font-semibold", p.status === "Completed" ? "text-emerald-700" : p.status === "Failed" ? "text-rose-700" : "text-amber-700")}>{p.status}</span>
                </div>
                      <p className="text-slate-600">{p.paymentDate} · {p.paymentMode}{p.transactionReference ? ` · ${p.transactionReference}` : ""}</p>
                      <p className="text-[10px] text-slate-400">Recorded by {p.recordedBy}</p>
              </div>
                  ))}
            </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 p-3">
              <p className="mb-1 font-semibold text-slate-900">Bank</p>
              <p className="text-slate-600">
                {viewing.bankName || "—"} · {viewing.bankAccount || "No account"} · {viewing.ifscCode || "No IFSC"}
              </p>
            </div>
          </div>
        )}
      </Drawer>

      {/* Payslip preview */}
      {payslipFor && (
        <Modal isOpen onClose={() => setPayslipFor(null)} title={`Payslip — ${payslipFor.employeeName}`} description={`${period} · ${payslipFor.payslipNo ?? ""} · ${payslipFor.payslipStatus ?? ""}`} size="xl">
          <div className="space-y-4 rounded-2xl border border-slate-300 bg-white p-6 text-xs">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
            <div>
                <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900">{hotelName}</h2>
                <p className="text-slate-500">Salary slip for {period}</p>
            </div>
              <span className="rounded-lg bg-slate-900 px-3 py-1 font-semibold text-amber-300">{payslipFor.payslipNo}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-3">
              <div className="space-y-0.5">
                <p><strong>Employee:</strong> {payslipFor.employeeName}</p>
                <p><strong>Code:</strong> {payslipFor.empCode || payslipFor.employeeId}</p>
                <p><strong>Department:</strong> {payslipFor.department || "—"}</p>
                <p><strong>Designation:</strong> {payslipFor.designation || "—"}</p>
            </div>
              <div className="space-y-0.5">
                <p><strong>Bank:</strong> {payslipFor.bankName || "—"}</p>
                <p><strong>Account:</strong> {payslipFor.bankAccount || "—"}</p>
                <p><strong>Status:</strong> {payslipFor.status}</p>
                </div>
              </div>
            <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200">
              <div className="border-r border-slate-200">
                <p className="border-b border-slate-200 bg-emerald-50 p-2 font-semibold text-emerald-900">Earnings</p>
                <div className="space-y-1 p-3">
                  {EARNING_FIELDS.filter(([k]) => payslipFor[k]).map(([k, l]) => (
                    <p key={k} className="flex justify-between"><span>{l}</span><span className="font-semibold">{inr(payslipFor[k])}</span></p>
                  ))}
                  <p className="flex justify-between border-t border-slate-200 pt-2 font-bold"><span>Total earnings</span><span>{inr(payslipFor.earningsTotal)}</span></p>
          </div>
            </div>
              <div>
                <p className="border-b border-slate-200 bg-rose-50 p-2 font-semibold text-rose-900">Deductions</p>
                <div className="space-y-1 p-3">
                  {DEDUCTION_FIELDS.filter(([k]) => payslipFor[k]).map(([k, l]) => (
                    <p key={k} className="flex justify-between"><span>{l}</span><span className="font-semibold">{inr(payslipFor[k])}</span></p>
                  ))}
                  <p className="flex justify-between border-t border-slate-200 pt-2 font-bold"><span>Total deductions</span><span>{inr(payslipFor.deductionsTotal)}</span></p>
              </div>
            </div>
              </div>
            <div className="rounded-xl bg-slate-900 p-4 text-center">
              <p className="text-[10px] font-semibold uppercase text-slate-400">Net salary payable</p>
              <p className="text-2xl font-bold text-amber-300">{inr(payslipFor.netSalary)}</p>
            </div>
          </div>
        </Modal>
        )}
    </ModulePageShell>
  );
}
