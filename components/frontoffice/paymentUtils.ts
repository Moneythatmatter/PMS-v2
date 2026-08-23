import type { FolioListItem, LedgerTransaction } from "@/app/data/types/billing";

export type FrontOfficePaymentType = "Payment" | "Refund" | "Advance";

export type FrontOfficePaymentStatus = "Completed" | "Pending" | "Refunded";

export interface FrontOfficePaymentRow {
  id: string;
  transactionNumber: string;
  guestName: string;
  room?: string;
  amount: number;
  mode: string;
  type: FrontOfficePaymentType;
  externalReference?: string | null;
  date: string;
  transactionDate: string;
  status: FrontOfficePaymentStatus;
  sourceModule?: string | null;
  folioId?: string | null;
  bookingId?: string | null;
  notes?: string | null;
}

const FO_SOURCE_MODULES = new Set(["FRONT_OFFICE", "RESERVATION"]);

export function isFrontOfficeTransaction(txn: LedgerTransaction): boolean {
  return FO_SOURCE_MODULES.has(String(txn.sourceModule ?? "").toUpperCase());
}

export function formatLedgerPaymentMethod(method?: string): string {
  if (!method) return "—";
  const map: Record<string, string> = {
    CASH: "Cash",
    CARD: "Card",
    UPI: "UPI",
    BANK_TRANSFER: "Bank Transfer",
    CHEQUE: "Cheque",
    OTHER: "Other",
  };
  const key = method.toUpperCase();
  return map[key] ?? method.replace(/_/g, " ");
}

export function mapLedgerTransactionType(
  txn: LedgerTransaction,
): FrontOfficePaymentType {
  if (txn.transactionType === "REFUND") return "Refund";
  if (txn.sourceModule === "RESERVATION") return "Advance";
  return "Payment";
}

export function mapLedgerTransactionStatus(
  status: string,
): FrontOfficePaymentStatus {
  switch (status.toUpperCase()) {
    case "COMPLETED":
      return "Completed";
    case "PENDING":
      return "Pending";
    case "REFUNDED":
    case "VOIDED":
      return "Refunded";
    default:
      return "Pending";
  }
}

export function formatPaymentDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function buildFolioLookups(folios: FolioListItem[]) {
  const byId = new Map<string, FolioListItem>();
  const byBookingId = new Map<string, FolioListItem>();
  for (const folio of folios) {
    byId.set(folio.id, folio);
    if (folio.bookingId) byBookingId.set(folio.bookingId, folio);
  }
  return { byId, byBookingId };
}

export function ledgerTransactionToPaymentRow(
  txn: LedgerTransaction,
  folioLookups: ReturnType<typeof buildFolioLookups>,
): FrontOfficePaymentRow {
  const folio =
    (txn.folioId ? folioLookups.byId.get(txn.folioId) : undefined) ??
    (txn.bookingId ? folioLookups.byBookingId.get(txn.bookingId) : undefined);

  return {
    id: txn.id,
    transactionNumber: txn.transactionNumber,
    guestName: folio?.guestName ?? "Guest",
    room: folio?.room ?? undefined,
    amount: Number(txn.amount ?? 0),
    mode: formatLedgerPaymentMethod(txn.paymentMethod),
    type: mapLedgerTransactionType(txn),
    externalReference: txn.externalReference,
    date: formatPaymentDate(txn.transactionDate),
    transactionDate: txn.transactionDate,
    status: mapLedgerTransactionStatus(txn.status),
    sourceModule: txn.sourceModule,
    folioId: txn.folioId,
    bookingId: txn.bookingId,
    notes: txn.notes,
  };
}

export function mapFrontOfficeTransactions(
  transactions: LedgerTransaction[],
  folios: FolioListItem[],
): FrontOfficePaymentRow[] {
  const lookups = buildFolioLookups(folios);
  return transactions
    .filter(isFrontOfficeTransaction)
    .map((txn) => ledgerTransactionToPaymentRow(txn, lookups))
    .sort(
      (a, b) =>
        new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime(),
    );
}
