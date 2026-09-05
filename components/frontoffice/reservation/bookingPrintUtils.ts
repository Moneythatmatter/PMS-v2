import type { ReservationBooking } from "@/app/data/types";
import { displayBookingNo } from "@/lib/booking-display";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatInr(amount: number | undefined): string {
  if (amount === undefined || Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function display(value: string | number | undefined | null): string {
  if (value === undefined || value === null || String(value).trim() === "") return "";
  return String(value);
}

function formatDateLabel(value: string | undefined): string {
  const raw = display(value);
  if (!raw) return "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusTone(status: string): { bg: string; text: string; border: string } {
  const normalized = status.toLowerCase();
  if (normalized.includes("checked in") || normalized.includes("in-house")) {
    return { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" };
  }
  if (normalized.includes("reserved") || normalized.includes("confirmed")) {
    return { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" };
  }
  if (normalized.includes("checked out")) {
    return { bg: "#f8fafc", text: "#475569", border: "#e2e8f0" };
  }
  if (normalized.includes("cancelled")) {
    return { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" };
  }
  return { bg: "#f8fafc", text: "#334155", border: "#e2e8f0" };
}

function sectionRows(rows: [string, string][]): string {
  const visible = rows.filter(([, value]) => value.trim());
  if (visible.length === 0) return "";

  return visible
    .map(
      ([label, value]) => `
        <div class="row">
          <span class="label">${escapeHtml(label)}</span>
          <span class="value">${escapeHtml(value)}</span>
        </div>`,
    )
    .join("");
}

function section(title: string, rows: [string, string][]): string {
  const body = sectionRows(rows);
  if (!body) return "";
  return `
    <section class="section">
      <h2 class="section-title">${escapeHtml(title)}</h2>
      <div class="rows">${body}</div>
    </section>`;
}

export function buildBookingDetailHtml(
  booking: ReservationBooking,
  propertyName = "IMPACT PMS",
): string {
  const bookingId = displayBookingNo(booking);
  const guestName = display(booking.guestName) || "Guest";
  const status = display(booking.status) || "—";
  const tone = statusTone(status);
  const roomLabel = booking.roomNo
    ? `Room ${booking.roomNo}${booking.roomType ? ` · ${booking.roomType}` : ""}`
    : display(booking.roomType);

  const checkIn = formatDateLabel(booking.checkIn) || display(booking.checkIn);
  const checkOut = formatDateLabel(booking.checkOut) || display(booking.checkOut);
  const nights = display(booking.nights);
  const adults = display(booking.adults);
  const children = display(booking.children);

  const guestSection = section("Guest information", [
    ["Full name", guestName],
    ["Phone", display(booking.phone)],
    ["Email", display(booking.email)],
    ["Booking type", display(booking.bookingType)],
    ["Company", display(booking.companyName)],
    ["Source", display(booking.source)],
  ]);

  const staySection = section("Stay details", [
    ["Room", roomLabel],
    ["Check-in", checkIn],
    ["Check-out", checkOut],
    ["Nights", nights],
    ["Adults", adults],
    ["Children", children],
    ["Tariff plan", display(booking.tariffPlan)],
    ["Meal plan", display(booking.mealPlan)],
  ]);

  const billingSection = section("Billing summary", [
    ["Room rate", formatInr(booking.roomRate) !== "—" ? formatInr(booking.roomRate) : ""],
    ["Total amount", formatInr(booking.totalAmount) !== "—" ? formatInr(booking.totalAmount) : ""],
    ["Advance paid", formatInr(booking.advancePaid) !== "—" ? formatInr(booking.advancePaid) : ""],
    ["Balance due", formatInr(booking.balance) !== "—" ? formatInr(booking.balance) : ""],
    ["Payment mode", display(booking.paymentMode)],
  ]);

  const notesSection = section("Additional information", [
    ["Booked by", display(booking.bookedBy)],
    ["Created on", formatDateLabel(booking.createdAt) || display(booking.createdAt)],
    ["Special requests", display(booking.specialRequests)],
  ]);

  const printedAt = new Date().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const occupancyParts = [
    adults ? `${adults} adult${adults === "1" ? "" : "s"}` : "",
    children && children !== "0" ? `${children} child${children === "1" ? "" : "ren"}` : "",
  ].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Booking ${escapeHtml(bookingId)}</title>
    <style>
      @page {
        size: A4;
        margin: 14mm;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 0;
        font-family: "Segoe UI", Arial, Helvetica, sans-serif;
        color: #0f172a;
        background: #fff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .sheet {
        max-width: 760px;
        margin: 0 auto;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
        padding-bottom: 18px;
        border-bottom: 2px solid #0f766e;
      }
      .brand h1 {
        margin: 0;
        font-size: 24px;
        line-height: 1.2;
        letter-spacing: -0.02em;
      }
      .brand p {
        margin: 6px 0 0;
        font-size: 12px;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 600;
      }
      .meta {
        text-align: right;
        font-size: 12px;
        color: #64748b;
      }
      .meta strong {
        display: block;
        color: #0f172a;
        font-size: 14px;
        margin-bottom: 4px;
      }
      .hero {
        margin-top: 20px;
        padding: 18px 20px;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        background: linear-gradient(135deg, #f8fafc 0%, #ecfdf5 100%);
      }
      .hero-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }
      .hero h2 {
        margin: 0;
        font-size: 22px;
        line-height: 1.2;
      }
      .hero-sub {
        margin: 6px 0 0;
        font-size: 13px;
        color: #475569;
      }
      .badge {
        display: inline-block;
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        border: 1px solid ${tone.border};
        background: ${tone.bg};
        color: ${tone.text};
        white-space: nowrap;
      }
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
        margin-top: 16px;
      }
      .summary-card {
        padding: 12px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.88);
        border: 1px solid #e2e8f0;
      }
      .summary-card .k {
        display: block;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #64748b;
        font-weight: 700;
      }
      .summary-card .v {
        display: block;
        margin-top: 4px;
        font-size: 14px;
        font-weight: 700;
        color: #0f172a;
      }
      .amount-strip {
        margin-top: 14px;
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 16px;
        border-radius: 12px;
        background: #0f766e;
        color: #fff;
      }
      .amount-strip .label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        opacity: 0.85;
      }
      .amount-strip .value {
        display: block;
        margin-top: 4px;
        font-size: 18px;
        font-weight: 700;
      }
      .content {
        margin-top: 22px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      .section {
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        overflow: hidden;
        break-inside: avoid;
      }
      .section-title {
        margin: 0;
        padding: 10px 14px;
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #0f766e;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }
      .rows {
        padding: 6px 0;
      }
      .row {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        padding: 9px 14px;
        border-bottom: 1px solid #f1f5f9;
      }
      .row:last-child {
        border-bottom: none;
      }
      .label {
        width: 42%;
        font-size: 12px;
        color: #64748b;
        font-weight: 600;
      }
      .value {
        width: 58%;
        font-size: 12px;
        color: #0f172a;
        font-weight: 600;
        text-align: right;
        word-break: break-word;
      }
      .footer {
        margin-top: 22px;
        padding-top: 14px;
        border-top: 1px dashed #cbd5e1;
        text-align: center;
        font-size: 11px;
        color: #64748b;
      }
      @media print {
        body { padding: 0; }
      }
      @media (max-width: 640px) {
        .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .content { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <header class="header">
        <div class="brand">
          <h1>${escapeHtml(propertyName)}</h1>
          <p>Front Office Booking Summary</p>
        </div>
        <div class="meta">
          <strong>${escapeHtml(bookingId)}</strong>
          <span>Generated ${escapeHtml(printedAt)}</span>
        </div>
      </header>

      <section class="hero">
        <div class="hero-top">
          <div>
            <h2>${escapeHtml(guestName)}</h2>
            <p class="hero-sub">${occupancyParts.length ? escapeHtml(occupancyParts.join(" · ")) : "Guest booking record"}</p>
          </div>
          <span class="badge">${escapeHtml(status)}</span>
        </div>

        <div class="summary-grid">
          <div class="summary-card">
            <span class="k">Check-in</span>
            <span class="v">${escapeHtml(checkIn || "—")}</span>
          </div>
          <div class="summary-card">
            <span class="k">Check-out</span>
            <span class="v">${escapeHtml(checkOut || "—")}</span>
          </div>
          <div class="summary-card">
            <span class="k">Nights</span>
            <span class="v">${escapeHtml(nights || "—")}</span>
          </div>
          <div class="summary-card">
            <span class="k">Room</span>
            <span class="v">${escapeHtml(roomLabel || "—")}</span>
          </div>
        </div>

        <div class="amount-strip">
          <div>
            <span class="label">Total amount</span>
            <span class="value">${escapeHtml(formatInr(booking.totalAmount))}</span>
          </div>
          <div style="text-align:right;">
            <span class="label">Balance due</span>
            <span class="value">${escapeHtml(formatInr(booking.balance))}</span>
          </div>
        </div>
      </section>

      <div class="content">
        ${guestSection}
        ${staySection}
        ${billingSection}
        ${notesSection}
      </div>

      <footer class="footer">
        <p>This is a computer-generated booking summary from ${escapeHtml(propertyName)}.</p>
        <p>Printed on ${escapeHtml(printedAt)}</p>
      </footer>
    </div>
  </body>
</html>`;
}

/** Opens a print dialog with formatted booking details only. */
export function printBookingDetail(
  booking: ReservationBooking,
  propertyName = "IMPACT PMS",
): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;

  const iframe = document.createElement("iframe");
  iframe.setAttribute(
    "style",
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden",
  );
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("title", "Booking detail print frame");
  document.body.appendChild(iframe);

  const printWindow = iframe.contentWindow;
  const printDocument = printWindow?.document;
  if (!printWindow || !printDocument) {
    iframe.remove();
    return false;
  }

  printDocument.open();
  printDocument.write(buildBookingDetailHtml(booking, propertyName));
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
