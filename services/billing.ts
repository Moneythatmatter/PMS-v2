import { api } from "./api";
import type { FolioListItem, LedgerTransaction } from "@/app/data/types/billing";

const txnPath = (segment: string) =>
  `/api${segment.startsWith("/") ? segment : `/${segment}`}`;

export const billingFolioService = {
  list: (params?: { status?: string; bookingId?: string; guestId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.bookingId) qs.set("bookingId", params.bookingId);
    if (params?.guestId) qs.set("guestId", params.guestId);
    const q = qs.toString();
    return api.get<FolioListItem[]>(txnPath(`/folios${q ? `?${q}` : ""}`));
  },
  get: (id: string) => api.get<FolioListItem>(txnPath(`/folios/${id}`)),
};

export interface RecordFrontOfficePaymentInput {
  amount: number;
  paymentMethod?: string;
  folioId?: string | null;
  bookingId?: string | null;
  guestId?: string | null;
  externalReference?: string | null;
  notes?: string | null;
}

export interface RecordReservationAdvanceInput {
  amount: number;
  bookingId: string;
  guestId?: string | null;
  paymentMethod?: string;
  externalReference?: string | null;
  notes?: string | null;
}

export const billingTransactionService = {
  list: (params?: {
    folioId?: string;
    bookingId?: string;
    guestId?: string;
    status?: string;
    sourceModule?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.folioId) qs.set("folioId", params.folioId);
    if (params?.bookingId) qs.set("bookingId", params.bookingId);
    if (params?.guestId) qs.set("guestId", params.guestId);
    if (params?.status) qs.set("status", params.status);
    if (params?.sourceModule) qs.set("sourceModule", params.sourceModule);
    const q = qs.toString();
    return api.get<LedgerTransaction[]>(
      txnPath(`/transactions${q ? `?${q}` : ""}`),
    );
  },

  recordFrontOfficePayment: (input: RecordFrontOfficePaymentInput) =>
    api.post<LedgerTransaction>(
      txnPath("/transactions/front-office/payment"),
      input,
    ),

  recordReservationAdvance: (input: RecordReservationAdvanceInput) =>
    api.post<LedgerTransaction>(
      txnPath("/transactions/reservation/advance"),
      input,
    ),
};
