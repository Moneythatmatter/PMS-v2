import type { CheckoutBillGroup, CheckoutFolio, SplittableChargeKey } from "@/app/data/frontoffice/checkout";
import { SPLITTABLE_CHARGE_LABELS } from "@/app/data/frontoffice/checkout";

export const CHECKOUT_INVOICE_HOTEL = {
  name: "Grand Plaza Hotel & Resorts",
  tagline: "Luxury Stay · Premium Service",
  address: "42 MG Road, Bengaluru, Karnataka — 560001",
  phone: "+91 80 4567 8900",
  email: "frontoffice@grandplazahotel.com",
  gstin: "29AABCG1234F1Z5",
  pan: "AABCG1234F",
  state: "Karnataka",
  stateCode: "29",
};

export interface CheckoutInvoiceContent {
  invoiceNo: string;
  invoiceDate: string;
  folio: CheckoutFolio;
  discount: number;
  paymentMode: string;
  bill?: CheckoutBillGroup;
  billTitle?: string;
}

export interface CheckoutInvoiceLineItem {
  desc: string;
  sac: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface CheckoutInvoiceTotals {
  taxableAmount: number;
  cgst: number;
  sgst: number;
  subtotalWithTax: number;
  billDiscount: number;
  advancePaid: number;
  pending: number;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatInrPlain(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatRoomLabel(folio: CheckoutFolio): string {
  const room = folio.room?.trim();
  const roomType = folio.roomType?.trim();
  if (room && room !== "TBA" && room !== "-") {
    return roomType ? `Room ${room} · ${roomType}` : `Room ${room}`;
  }
  if (room === "TBA") {
    return roomType ? `Room TBA · ${roomType}` : "Room TBA";
  }
  return roomType || "Room not assigned";
}

function lineItemForCharge(
  folio: CheckoutFolio,
  key: SplittableChargeKey | "roomCharges",
): CheckoutInvoiceLineItem | null {
  const roomLabel = formatRoomLabel(folio);

  const configs: Record<SplittableChargeKey | "roomCharges", CheckoutInvoiceLineItem | null> = {
    roomCharges:
      folio.roomCharges > 0
        ? {
            desc: `Room Charges — ${roomLabel}`,
            sac: "996311",
            qty: Math.max(folio.nights, 1),
            rate: Math.round(folio.roomCharges / Math.max(folio.nights, 1)),
            amount: folio.roomCharges,
          }
        : null,
    restaurantCharges:
      folio.restaurantCharges > 0
        ? {
            desc: "Restaurant / F&B Charges",
            sac: "996331",
            qty: 1,
            rate: folio.restaurantCharges,
            amount: folio.restaurantCharges,
          }
        : null,
    laundry:
      folio.laundry > 0
        ? {
            desc: "Laundry Services",
            sac: "999799",
            qty: 1,
            rate: folio.laundry,
            amount: folio.laundry,
          }
        : null,
    miniBar:
      folio.miniBar > 0
        ? {
            desc: "Mini Bar Consumption",
            sac: "996331",
            qty: 1,
            rate: folio.miniBar,
            amount: folio.miniBar,
          }
        : null,
    extraBed:
      folio.extraBed > 0
        ? {
            desc: "Extra Bed Charges",
            sac: "996311",
            qty: 1,
            rate: folio.extraBed,
            amount: folio.extraBed,
          }
        : null,
    otherCharges:
      folio.otherCharges > 0
        ? {
            desc: "Miscellaneous Charges",
            sac: "999799",
            qty: 1,
            rate: folio.otherCharges,
            amount: folio.otherCharges,
          }
        : null,
  };

  return configs[key];
}

export function buildCheckoutInvoiceLineItems(
  folio: CheckoutFolio,
  bill?: CheckoutBillGroup,
): CheckoutInvoiceLineItem[] {
  const keys = bill?.chargeKeys ?? [
    "roomCharges",
    ...(Object.keys(SPLITTABLE_CHARGE_LABELS) as SplittableChargeKey[]),
  ];

  return keys
    .map((key) => lineItemForCharge(folio, key))
    .filter((item): item is CheckoutInvoiceLineItem => item !== null);
}

export function amountInWords(num: number): string {
  if (num === 0) return "Zero";
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ` ${ones[n % 10]}` : "");
    if (n < 1000) {
      return `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${convert(n % 100)}` : ""}`;
    }
    if (n < 100000) {
      return `${convert(Math.floor(n / 1000))} Thousand${n % 1000 ? ` ${convert(n % 1000)}` : ""}`;
    }
    return `${convert(Math.floor(n / 100000))} Lakh${n % 100000 ? ` ${convert(n % 100000)}` : ""}`;
  }

  return convert(Math.round(num));
}

export function buildCheckoutInvoiceHtml(
  data: CheckoutInvoiceContent,
  hotel = CHECKOUT_INVOICE_HOTEL,
): string {
  const { invoiceNo, invoiceDate, folio, discount, paymentMode, bill, billTitle } = data;
  const lineItems = buildCheckoutInvoiceLineItems(folio, bill);
  const taxableAmount = bill?.charges ?? folio.roomCharges + folio.restaurantCharges + folio.laundry + folio.miniBar + folio.extraBed + folio.otherCharges;
  const billGst = bill?.gst ?? folio.gst;
  const cgst = Math.round(billGst / 2);
  const sgst = Math.round(billGst / 2);
  const subtotalWithTax = bill ? bill.charges + bill.gst : taxableAmount + folio.gst;
  const billDiscount = bill?.discount ?? discount;
  const advancePaid = bill?.advance ?? folio.advancePaid;
  const pending = bill?.due ?? Math.max(0, subtotalWithTax - billDiscount - advancePaid);
  const invoiceHeading = bill ? billTitle || "Split Bill Invoice" : "Tax Invoice";
  const roomLabel = formatRoomLabel(folio);

  const lineRows = lineItems
    .map(
      (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(item.desc)}</td>
          <td>${escapeHtml(item.sac)}</td>
          <td class="num">${item.qty}</td>
          <td class="num">${escapeHtml(formatInrPlain(item.rate))}</td>
          <td class="num strong">${escapeHtml(formatInrPlain(item.amount))}</td>
        </tr>`,
    )
    .join("");

  const discountRow =
    billDiscount > 0
      ? `<div class="total-row"><span>Discount</span><span class="positive">− ${escapeHtml(formatInrPlain(billDiscount))}</span></div>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(invoiceNo)}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", Arial, sans-serif;
      color: #0f172a;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet { max-width: 820px; margin: 0 auto; }
    .top-band {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      padding: 22px 24px;
      border-radius: 16px 16px 0 0;
      background: linear-gradient(135deg, #065f46 0%, #047857 100%);
      color: #fff;
    }
    .hotel-name { margin: 0; font-size: 24px; font-weight: 700; }
    .hotel-tagline { margin: 6px 0 0; font-size: 12px; opacity: 0.9; }
    .hotel-meta { margin-top: 10px; font-size: 11px; line-height: 1.6; opacity: 0.92; }
    .invoice-meta { text-align: right; min-width: 220px; }
    .invoice-type {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 999px;
      background: rgba(255,255,255,0.14);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .invoice-no { margin: 12px 0 4px; font-size: 18px; font-weight: 700; }
    .invoice-date { font-size: 12px; opacity: 0.9; }
    .body { border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 16px 16px; padding: 22px 24px 24px; }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 20px;
    }
    .info-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 16px;
      background: #f8fafc;
    }
    .info-title {
      font-size: 10px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .info-name { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
    .info-line { font-size: 12px; color: #475569; line-height: 1.5; }
    table.items {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
    }
    table.items thead th {
      background: #f8fafc;
      color: #64748b;
      font-size: 10px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
    }
    table.items tbody td {
      padding: 11px 12px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
    }
    table.items tbody tr:nth-child(even) td { background: #fcfdff; }
    .num { text-align: right; white-space: nowrap; }
    .strong { font-weight: 700; color: #0f172a; }
    .bottom-grid {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 16px;
      margin-top: 18px;
      align-items: start;
    }
    .note-card, .totals-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 16px;
      background: #fff;
    }
    .note-card { background: #f8fafc; }
    .note-title { font-size: 11px; font-weight: 700; color: #334155; margin-bottom: 6px; }
    .note-text { font-size: 12px; color: #475569; line-height: 1.6; }
    .totals-card { background: #f8fafc; }
    .total-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 7px 0;
      font-size: 12px;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
    }
    .total-row:last-child { border-bottom: none; }
    .total-row.grand {
      margin-top: 4px;
      padding-top: 12px;
      border-top: 2px solid #0f766e;
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
    }
    .total-row.grand span:last-child { color: #047857; font-size: 18px; }
    .positive { color: #047857; font-weight: 600; }
    .footer {
      margin-top: 18px;
      padding-top: 14px;
      border-top: 1px dashed #cbd5e1;
      font-size: 10px;
      color: #64748b;
      line-height: 1.6;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-top: 28px;
    }
    .sign-box { width: 42%; font-size: 11px; color: #475569; }
    .sign-line { margin-top: 36px; border-top: 1px solid #cbd5e1; padding-top: 6px; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="top-band">
      <div>
        <h1 class="hotel-name">${escapeHtml(hotel.name)}</h1>
        <p class="hotel-tagline">${escapeHtml(hotel.tagline)}</p>
        <div class="hotel-meta">
          ${escapeHtml(hotel.address)}<br />
          ${escapeHtml(hotel.phone)} · ${escapeHtml(hotel.email)}<br />
          GSTIN: ${escapeHtml(hotel.gstin)} · PAN: ${escapeHtml(hotel.pan)}
        </div>
      </div>
      <div class="invoice-meta">
        <span class="invoice-type">${escapeHtml(invoiceHeading)}</span>
        <div class="invoice-no">${escapeHtml(invoiceNo)}</div>
        <div class="invoice-date">Date: ${escapeHtml(invoiceDate)}</div>
        <div class="invoice-date">Place of Supply: ${escapeHtml(hotel.state)} (${escapeHtml(hotel.stateCode)})</div>
      </div>
    </div>

    <div class="body">
      <div class="info-grid">
        <div class="info-card">
          <div class="info-title">Bill To</div>
          <div class="info-name">${escapeHtml(folio.guestName)}</div>
          <div class="info-line">${escapeHtml(folio.phone)}</div>
          ${folio.email ? `<div class="info-line">${escapeHtml(folio.email)}</div>` : ""}
          <div class="info-line">Booking ID: ${escapeHtml(folio.bookingId)}</div>
        </div>
        <div class="info-card">
          <div class="info-title">Stay Details</div>
          <div class="info-line"><strong>Room:</strong> ${escapeHtml(roomLabel)}</div>
          <div class="info-line"><strong>Check-in:</strong> ${escapeHtml(folio.checkIn)}</div>
          <div class="info-line"><strong>Check-out:</strong> ${escapeHtml(folio.checkOut)}</div>
          <div class="info-line"><strong>Guests:</strong> ${folio.adults} Adult${folio.adults !== 1 ? "s" : ""}${folio.children > 0 ? `, ${folio.children} Child${folio.children !== 1 ? "ren" : ""}` : ""} · ${folio.nights} Night${folio.nights !== 1 ? "s" : ""}</div>
        </div>
      </div>

      <table class="items">
        <thead>
          <tr>
            <th>#</th>
            <th>Description</th>
            <th>SAC</th>
            <th class="num">Qty</th>
            <th class="num">Rate</th>
            <th class="num">Amount</th>
          </tr>
        </thead>
        <tbody>${lineRows}</tbody>
      </table>

      <div class="bottom-grid">
        <div class="note-card">
          <div class="note-title">Payment Information</div>
          <div class="note-text"><strong>Mode:</strong> ${escapeHtml(paymentMode)}</div>
          <div class="note-text" style="margin-top:8px;"><strong>Amount in words:</strong> ${escapeHtml(amountInWords(pending))} Rupees Only</div>
        </div>
        <div class="totals-card">
          <div class="total-row"><span>Taxable Amount</span><span>${escapeHtml(formatInrPlain(taxableAmount))}</span></div>
          <div class="total-row"><span>CGST @ 9%</span><span>${escapeHtml(formatInrPlain(cgst))}</span></div>
          <div class="total-row"><span>SGST @ 9%</span><span>${escapeHtml(formatInrPlain(sgst))}</span></div>
          <div class="total-row"><span>Subtotal (incl. tax)</span><span>${escapeHtml(formatInrPlain(subtotalWithTax))}</span></div>
          ${discountRow}
          <div class="total-row"><span>Advance Paid</span><span class="positive">− ${escapeHtml(formatInrPlain(advancePaid))}</span></div>
          <div class="total-row grand"><span>Amount Due</span><span>${escapeHtml(formatInrPlain(pending))}</span></div>
        </div>
      </div>

      <div class="footer">
        This is a computer-generated tax invoice and does not require a physical signature.
        Subject to Bengaluru jurisdiction. E.&amp;O.E. GST charged as per applicable rates.
        For queries contact ${escapeHtml(hotel.email)} within 7 days of checkout.
      </div>

      <div class="signatures">
        <div class="sign-box">
          Guest Signature
          <div class="sign-line">________________________</div>
        </div>
        <div class="sign-box" style="text-align:right;">
          Authorised Signatory
          <div class="sign-line">Front Office</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function downloadCheckoutInvoice(
  data: CheckoutInvoiceContent,
  hotel = CHECKOUT_INVOICE_HOTEL,
): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;

  const html = buildCheckoutInvoiceHtml(data, hotel);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${data.invoiceNo.replace(/[^\w-]+/g, "_")}.html`;
  anchor.click();
  URL.revokeObjectURL(url);
  return true;
}

export function printCheckoutInvoice(
  data: CheckoutInvoiceContent,
  hotel = CHECKOUT_INVOICE_HOTEL,
): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;

  const iframe = document.createElement("iframe");
  iframe.setAttribute(
    "style",
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden",
  );
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("title", "Checkout invoice print frame");
  document.body.appendChild(iframe);

  const printWindow = iframe.contentWindow;
  const printDocument = printWindow?.document;
  if (!printWindow || !printDocument) {
    iframe.remove();
    return false;
  }

  printDocument.open();
  printDocument.write(buildCheckoutInvoiceHtml(data, hotel));
  printDocument.close();

  const cleanup = () => iframe.remove();
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

export function formatCheckoutRoomLabel(folio: CheckoutFolio): string {
  return formatRoomLabel(folio);
}
