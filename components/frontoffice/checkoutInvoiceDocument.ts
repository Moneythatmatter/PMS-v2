import jsPDF from "jspdf";
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

function formatPdfInr(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function generateCheckoutInvoicePdf(
  data: CheckoutInvoiceContent,
  hotel = CHECKOUT_INVOICE_HOTEL,
): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const { invoiceNo, invoiceDate, folio, discount, paymentMode, bill, billTitle } = data;
  const lineItems = buildCheckoutInvoiceLineItems(folio, bill);
  const taxableAmount =
    bill?.charges ??
    folio.roomCharges +
    folio.restaurantCharges +
    folio.laundry +
    folio.miniBar +
    folio.extraBed +
    folio.otherCharges;
  const billGst = bill?.gst ?? folio.gst;
  const cgst = Math.round(billGst / 2);
  const sgst = Math.round(billGst / 2);
  const subtotalWithTax = bill ? bill.charges + bill.gst : taxableAmount + folio.gst;
  const billDiscount = bill?.discount ?? discount;
  const advancePaid = bill?.advance ?? folio.advancePaid;
  const pending = bill?.due ?? Math.max(0, subtotalWithTax - billDiscount - advancePaid);
  const invoiceHeading = bill ? billTitle || "Split Bill Invoice" : "Tax Invoice";
  const roomLabel = formatRoomLabel(folio);

  const leftMargin = 15;
  const rightMargin = 195;
  const contentWidth = 180;

  // 1. Minimal Header (No background boxes)
  const yHeader = 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(hotel.name, leftMargin, yHeader);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text(hotel.tagline, leftMargin, yHeader + 5);

  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text(hotel.address, leftMargin, yHeader + 10);
  doc.text(`${hotel.phone}  ·  ${hotel.email}`, leftMargin, yHeader + 14.5);
  doc.text(`GSTIN: ${hotel.gstin}  ·  PAN: ${hotel.pan}`, leftMargin, yHeader + 19);

  // Invoice Meta (Right side)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text(invoiceHeading.toUpperCase(), rightMargin, yHeader, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(invoiceNo, rightMargin, yHeader + 5.5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`Date: ${invoiceDate}`, rightMargin, yHeader + 10.5, { align: "right" });
  doc.text(`Place of Supply: ${hotel.state} (${hotel.stateCode})`, rightMargin, yHeader + 15, {
    align: "right",
  });

  // Header Divider
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(leftMargin, yHeader + 23, rightMargin, yHeader + 23);

  // 2. Info Section (Bill To & Stay Details - No boxes)
  const yInfo = yHeader + 29;

  // Bill To (Left)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text("BILL TO", leftMargin, yInfo);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text(folio.guestName || "Guest", leftMargin, yInfo + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  let curBillY = yInfo + 9.5;
  if (folio.phone) {
    doc.text(folio.phone, leftMargin, curBillY);
    curBillY += 4.5;
  }
  if (folio.email) {
    doc.text(folio.email, leftMargin, curBillY);
    curBillY += 4.5;
  }
  doc.text(`Booking ID: ${folio.bookingId}`, leftMargin, curBillY);

  // Stay Details (Right)
  const rightColX = 112;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text("STAY DETAILS", rightColX, yInfo);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Room: ", rightColX, yInfo + 5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text(roomLabel, rightColX + 13, yInfo + 5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Check-in: ", rightColX, yInfo + 9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text(folio.checkIn, rightColX + 16, yInfo + 9.5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Check-out: ", rightColX, yInfo + 14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text(folio.checkOut, rightColX + 18, yInfo + 14);

  const guestsDesc = `${folio.adults} Adult${folio.adults !== 1 ? "s" : ""}${folio.children > 0 ? `, ${folio.children} Child${folio.children !== 1 ? "ren" : ""}` : ""
    } · ${folio.nights} Night${folio.nights !== 1 ? "s" : ""}`;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Guests: ", rightColX, yInfo + 18.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text(guestsDesc, rightColX + 13, yInfo + 18.5);

  // 3. Line Items Table (Minimal rules only)
  const yTable = Math.max(curBillY, yInfo + 18.5) + 8;

  // Table header top line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.line(leftMargin, yTable, rightMargin, yTable);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text("#", leftMargin, yTable + 4.5);
  doc.text("DESCRIPTION", leftMargin + 8, yTable + 4.5);
  doc.text("SAC", leftMargin + 92, yTable + 4.5);
  doc.text("QTY", leftMargin + 118, yTable + 4.5, { align: "right" });
  doc.text("RATE", leftMargin + 148, yTable + 4.5, { align: "right" });
  doc.text("AMOUNT", rightMargin, yTable + 4.5, { align: "right" });

  // Table header bottom line
  doc.setLineWidth(0.2);
  doc.line(leftMargin, yTable + 6.5, rightMargin, yTable + 6.5);

  let curY = yTable + 7;
  const rowH = 6.5;

  lineItems.forEach((item, index) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    doc.text(String(index + 1), leftMargin, curY + 4);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(item.desc, leftMargin + 8, curY + 4);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    doc.text(item.sac, leftMargin + 92, curY + 4);

    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    doc.text(String(item.qty), leftMargin + 118, curY + 4, { align: "right" });
    doc.text(formatPdfInr(item.rate), leftMargin + 148, curY + 4, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(formatPdfInr(item.amount), rightMargin, curY + 4, { align: "right" });

    curY += rowH;
  });

  // Table bottom border
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.line(leftMargin, curY, rightMargin, curY);

  // 4. Totals and Payment Section (No boxes)
  const yBottom = curY + 6;

  const totalsRows: { label: string; value: string }[] = [
    { label: "Taxable Amount", value: formatPdfInr(taxableAmount) },
    { label: "CGST @ 9%", value: formatPdfInr(cgst) },
    { label: "SGST @ 9%", value: formatPdfInr(sgst) },
    { label: "Subtotal (incl. tax)", value: formatPdfInr(subtotalWithTax) },
  ];
  if (billDiscount > 0) {
    totalsRows.push({ label: "Discount", value: `- ${formatPdfInr(billDiscount)}` });
  }
  if (advancePaid > 0) {
    totalsRows.push({ label: "Advance Paid", value: `- ${formatPdfInr(advancePaid)}` });
  }

  // Payment Info (Left)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text("PAYMENT INFORMATION", leftMargin, yBottom);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Mode: ", leftMargin, yBottom + 5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text(paymentMode, leftMargin + 12, yBottom + 5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Amount in words:", leftMargin, yBottom + 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  const wordsText = `${amountInWords(pending)} Rupees Only`;
  const wordsLines = doc.splitTextToSize(wordsText, 85);
  doc.text(wordsLines, leftMargin, yBottom + 16);

  // Totals Breakdown (Right)
  const totalsLabelX = 118;
  let tY = yBottom;

  totalsRows.forEach((row, i) => {
    if (i === 3) {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(totalsLabelX, tY - 1, rightMargin, tY - 1);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(60, 60, 60);
    }

    doc.text(row.label, totalsLabelX, tY + 2.5);
    doc.text(row.value, rightMargin, tY + 2.5, { align: "right" });
    tY += 5;
  });

  // Amount Due Line
  tY += 2;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.line(totalsLabelX, tY, rightMargin, tY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  doc.text("Amount Due", totalsLabelX, tY + 5);
  doc.text(formatPdfInr(pending), rightMargin, tY + 5, { align: "right" });

  doc.setLineWidth(0.35);
  doc.line(totalsLabelX, tY + 7.5, rightMargin, tY + 7.5);

  // 5. Footer & Legal Terms
  const yFooter = Math.max(tY + 14, yBottom + 32);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(leftMargin, yFooter, rightMargin, yFooter);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(110, 110, 110);
  const disclaimer = `This is a computer-generated tax invoice and does not require a physical signature. Subject to Bengaluru jurisdiction. E.&O.E. GST charged as per applicable rates. For queries contact ${hotel.email} within 7 days of checkout.`;
  const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth);
  doc.text(disclaimerLines, leftMargin, yFooter + 4.5);

  // Signatures
  const ySign = yFooter + 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text("Guest Signature", leftMargin, ySign);

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.line(leftMargin, ySign + 9, leftMargin + 45, ySign + 9);

  doc.text("Authorised Signatory", rightMargin, ySign, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text("Front Office", rightMargin, ySign + 4, { align: "right" });
  doc.line(rightMargin - 45, ySign + 9, rightMargin, ySign + 9);

  return doc;
}

export function downloadCheckoutInvoice(
  data: CheckoutInvoiceContent,
  hotel = CHECKOUT_INVOICE_HOTEL,
): boolean {
  if (typeof window === "undefined") return false;

  try {
    const doc = generateCheckoutInvoicePdf(data, hotel);
    const safeName = data.invoiceNo.replace(/[^\w-]+/g, "_") || "Tax_Invoice";
    doc.save(`${safeName}.pdf`);
    return true;
  } catch (err) {
    console.error("Failed to download PDF invoice:", err);
    return false;
  }
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
