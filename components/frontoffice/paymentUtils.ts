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
  folioNumber?: string | null;
  bookingId?: string | null;
  bookingNo?: string | null;
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
    folioNumber: folio?.folioNumber ?? null,
    bookingId: txn.bookingId,
    bookingNo: folio?.bookingNo ?? null,
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatReceiptInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function buildPaymentReceiptHtml(
  payment: FrontOfficePaymentRow,
  propertyName: string,
): string {
  const bookingRef = payment.bookingNo ?? payment.bookingId ?? "—";
  const folioRef = payment.folioNumber ?? payment.folioId ?? "—";
  const roomLabel = payment.room ? `Room ${payment.room}` : "—";
  const amountPrefix = payment.type === "Refund" ? "−" : "";
  const amount = `${amountPrefix}${formatReceiptInr(payment.amount)}`;
  const printedAt = new Date().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const rows = [
    ["Receipt Type", payment.type],
    ["Guest", payment.guestName],
    ["Room", roomLabel],
    ["Booking ID", bookingRef],
    ["Folio ID", folioRef],
    ["Payment Mode", payment.mode],
    ["Transaction No", payment.transactionNumber],
    ["External Ref", payment.externalReference ?? "—"],
    ["Status", payment.status],
    ["Transaction Date", payment.date],
  ];

  const bodyRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td>${escapeHtml(label)}</td>
          <td>${escapeHtml(String(value))}</td>
        </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(payment.transactionNumber)} Receipt</title>
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: Arial, Helvetica, sans-serif;
        color: #0f172a;
        margin: 0;
        padding: 24px;
      }
      .receipt {
        max-width: 420px;
        margin: 0 auto;
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        padding: 24px;
      }
      .brand {
        text-align: center;
        margin-bottom: 20px;
        padding-bottom: 16px;
        border-bottom: 1px dashed #cbd5e1;
      }
      .brand h1 {
        margin: 0 0 4px;
        font-size: 20px;
        letter-spacing: 0.04em;
      }
      .brand p {
        margin: 0;
        color: #64748b;
        font-size: 12px;
      }
      .amount {
        text-align: center;
        margin: 0 0 20px;
        font-size: 28px;
        font-weight: 700;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }
      td {
        padding: 8px 0;
        vertical-align: top;
        border-bottom: 1px solid #f1f5f9;
      }
      td:first-child {
        width: 42%;
        color: #64748b;
        font-weight: 600;
      }
      td:last-child {
        font-weight: 600;
        text-align: right;
        word-break: break-word;
      }
      .footer {
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px dashed #cbd5e1;
        text-align: center;
        font-size: 11px;
        color: #64748b;
      }
      @media print {
        body { padding: 0; }
        .receipt { border: none; border-radius: 0; }
      }
    </style>
  </head>
  <body>
    <div class="receipt">
      <div class="brand">
        <h1>${escapeHtml(propertyName)}</h1>
        <p>Front Office Payment Receipt</p>
      </div>
      <p class="amount">${escapeHtml(amount)}</p>
      <table>${bodyRows}</table>
      <div class="footer">
        <p>Printed on ${escapeHtml(printedAt)}</p>
        <p>This is a computer-generated receipt.</p>
      </div>
    </div>
  </body>
</html>`;
}

/** Opens a print dialog with a formatted front-office payment receipt. */
export function printFrontOfficePaymentReceipt(
  payment: FrontOfficePaymentRow,
  propertyName = "IMPACT PMS",
): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;

  const iframe = document.createElement("iframe");
  iframe.setAttribute(
    "style",
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden",
  );
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("title", "Payment receipt print frame");
  document.body.appendChild(iframe);

  const printWindow = iframe.contentWindow;
  const printDocument = printWindow?.document;
  if (!printWindow || !printDocument) {
    iframe.remove();
    return false;
  }

  const html = buildPaymentReceiptHtml(payment, propertyName);
  printDocument.open();
  printDocument.write(html);
  printDocument.close();

  const cleanup = () => {
    iframe.remove();
  };

  printWindow.onafterprint = cleanup;
  window.setTimeout(cleanup, 3000);

  const triggerPrint = () => {
    printWindow.focus();
    printWindow.print();
  };

  if (printDocument.readyState === "complete") {
    window.setTimeout(triggerPrint, 100);
  } else {
    printWindow.onload = () => window.setTimeout(triggerPrint, 100);
  }

  return true;
}
