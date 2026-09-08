/**
 * Dedicated Thermal & Standard Print Utility for Housekeeping Laundry KOT Slips
 */

export interface LaundryKotData {
  jobId: string;
  kotNo?: string;
  type: "Guest" | "Hotel" | "Staff";
  item: string;
  quantity: number;
  room?: string;
  guestName?: string;
  employeeName?: string;
  employeeDept?: string;
  serviceType: string;
  urgency: string;
  washBatch: string;
  careLabel: string;
  preInspection?: {
    stains?: boolean;
    tears?: boolean;
    buttons?: boolean;
    fading?: boolean;
    notes?: string;
  };
  isOutsourced?: boolean;
  vendorName?: string;
  charges: number;
  baseCharges?: number;
  notes?: string;
  createdAt?: string;
}

function escapeHtml(value: string | undefined | null): string {
  if (!value) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatCurrency(amount: number): string {
  return `INR ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function simpleBarcodeSvg(value: string) {
  let x = 0;
  const bars: string[] = [];
  const chars = value.replace(/[^A-Za-z0-9]/g, "") || "LD001";
  for (let i = 0; i < chars.length * 3; i++) {
    const code = chars.charCodeAt(i % chars.length) + i * 17;
    const width = code % 3 === 0 ? 3 : code % 2 === 0 ? 2 : 1;
    if (i % 2 === 0) {
      bars.push(`<rect x="${x}" y="0" width="${width}" height="36" fill="#000"/>`);
    }
    x += width + 1;
  }
  return `<svg width="${x}" height="36" viewBox="0 0 ${x} 36" xmlns="http://www.w3.org/2000/svg">${bars.join("")}</svg>`;
}

export function buildLaundryKotHtml(params: LaundryKotData): string {
  const kotNo = params.kotNo || `KOT-${params.jobId}`;
  const dateStr = params.createdAt || new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const barcodeVal = params.jobId.replace(/[^A-Za-z0-9]/g, "");
  const unitRate = params.quantity > 0 ? params.charges / params.quantity : params.charges;

  const defectBadges: string[] = [];
  if (params.preInspection?.stains) defectBadges.push("Stains");
  if (params.preInspection?.tears) defectBadges.push("Tears");
  if (params.preInspection?.buttons) defectBadges.push("Missing Buttons");
  if (params.preInspection?.fading) defectBadges.push("Color Fading");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Laundry KOT - ${escapeHtml(params.jobId)}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 3mm 4mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: "Courier New", Courier, monospace, system-ui, -apple-system, sans-serif;
      font-size: 11px;
      line-height: 1.35;
      color: #000000;
      background: #ffffff;
      width: 72mm;
      max-width: 72mm;
      margin: 0 auto;
      padding: 6px 2px 14px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .center {
      text-align: center;
    }
    .right {
      text-align: right;
    }
    .bold {
      font-weight: 700;
    }
    .title {
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .subtitle {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .divider-solid {
      border-top: 1.5px solid #000;
      margin: 6px 0;
    }
    .divider-dash {
      border-top: 1px dashed #000;
      margin: 5px 0;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin: 3px 0;
    }
    .meta-table td {
      padding: 1.5px 0;
      vertical-align: top;
      font-size: 11px;
    }
    .meta-label {
      width: 38%;
      color: #333333;
    }
    .meta-val {
      width: 62%;
      font-weight: 700;
      word-break: break-word;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 4px 0;
    }
    .items-table th {
      border-bottom: 1px dashed #000;
      padding: 3px 0;
      font-weight: 700;
      font-size: 10.5px;
      text-align: left;
    }
    .items-table td {
      padding: 4px 0;
      vertical-align: top;
      font-size: 11px;
    }
    .qty-col {
      text-align: center;
      width: 35px;
    }
    .rate-col {
      text-align: right;
      width: 55px;
    }
    .section-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 4px;
      margin-bottom: 2px;
    }
    .notes-box {
      font-size: 10.5px;
      line-height: 1.3;
      padding: 2px 0;
      word-break: break-word;
      white-space: pre-wrap;
    }
    .total-box {
      margin-top: 6px;
      padding-top: 4px;
      border-top: 1.5px solid #000;
      border-bottom: 1.5px solid #000;
      padding-bottom: 4px;
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      font-weight: 900;
    }
    .signatures {
      margin-top: 14px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
    }
    .sig-line {
      width: 46%;
      border-top: 1px dotted #000;
      padding-top: 3px;
      text-align: center;
    }
    .barcode-wrap {
      margin-top: 10px;
      text-align: center;
    }
    .barcode-caption {
      font-size: 9.5px;
      letter-spacing: 0.1em;
      margin-top: 2px;
    }
    @media print {
      body {
        width: 100%;
        margin: 0;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="center title">HOTEL PMS</div>
  <div class="center subtitle">LAUNDRY ORDER TICKET (KOT)</div>

  <div class="divider-solid"></div>

  <table class="meta-table">
    <tr>
      <td class="meta-label">KOT No:</td>
      <td class="meta-val">${escapeHtml(kotNo)}</td>
    </tr>
    <tr>
      <td class="meta-label">Job ID:</td>
      <td class="meta-val">${escapeHtml(params.jobId)}</td>
    </tr>
    <tr>
      <td class="meta-label">Date &amp; Time:</td>
      <td class="meta-val">${escapeHtml(dateStr)}</td>
    </tr>
  </table>

  <div class="divider-dash"></div>

  <table class="meta-table">
    ${params.type === "Guest" ? `
      <tr>
        <td class="meta-label">Guest:</td>
        <td class="meta-val">${escapeHtml(params.guestName || "Guest")}</td>
      </tr>
      <tr>
        <td class="meta-label">Room:</td>
        <td class="meta-val">Room ${escapeHtml(params.room || "N/A")}</td>
      </tr>
      <tr>
        <td class="meta-label">Service:</td>
        <td class="meta-val">Guest Laundry</td>
      </tr>
    ` : params.type === "Staff" ? `
      <tr>
        <td class="meta-label">Staff:</td>
        <td class="meta-val">${escapeHtml(params.employeeName || "Staff Member")}</td>
      </tr>
      <tr>
        <td class="meta-label">Dept:</td>
        <td class="meta-val">${escapeHtml(params.employeeDept || "Staff Uniform")}</td>
      </tr>
      <tr>
        <td class="meta-label">Service:</td>
        <td class="meta-val">Staff Uniform</td>
      </tr>
    ` : `
      <tr>
        <td class="meta-label">Category:</td>
        <td class="meta-val">Hotel Linen Batch</td>
      </tr>
      <tr>
        <td class="meta-label">Service:</td>
        <td class="meta-val">Housekeeping Internal</td>
      </tr>
    `}
    <tr>
      <td class="meta-label">Process:</td>
      <td class="meta-val">${escapeHtml(params.serviceType)}</td>
    </tr>
    <tr>
      <td class="meta-label">Urgency:</td>
      <td class="meta-val">${params.urgency === "Express" ? "EXPRESS (Priority)" : "Standard"}</td>
    </tr>
    ${params.isOutsourced ? `
      <tr>
        <td class="meta-label">Vendor:</td>
        <td class="meta-val">${escapeHtml(params.vendorName || "External Laundry Hub")}</td>
      </tr>
    ` : ""}
  </table>

  <div class="divider-dash"></div>

  <table class="items-table">
    <thead>
      <tr>
        <th>ITEM</th>
        <th class="qty-col">QTY</th>
        <th class="rate-col">RATE</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="bold">${escapeHtml(params.item)}</td>
        <td class="qty-col bold">${params.quantity}</td>
        <td class="rate-col bold">${formatCurrency(unitRate)}</td>
      </tr>
    </tbody>
  </table>

  <div class="divider-dash"></div>

  <table class="meta-table">
    <tr>
      <td class="meta-label">Wash Batch:</td>
      <td class="meta-val">${escapeHtml(params.washBatch || "Standard Colors")}</td>
    </tr>
    <tr>
      <td class="meta-label">Care Label:</td>
      <td class="meta-val">${escapeHtml(params.careLabel || "Standard Fabric")}</td>
    </tr>
    ${defectBadges.length > 0 ? `
      <tr>
        <td class="meta-label">Inspection:</td>
        <td class="meta-val">${escapeHtml(defectBadges.join(", "))}</td>
      </tr>
    ` : ""}
    ${params.preInspection?.notes ? `
      <tr>
        <td class="meta-label">Defect Notes:</td>
        <td class="meta-val">${escapeHtml(params.preInspection.notes)}</td>
      </tr>
    ` : ""}
  </table>

  ${params.notes ? `
    <div class="divider-dash"></div>
    <div class="section-title">Special Instructions:</div>
    <div class="notes-box">${escapeHtml(params.notes)}</div>
  ` : ""}

  <div class="total-box">
    <span>TOTAL:</span>
    <span>${formatCurrency(params.charges)}</span>
  </div>

  <div class="signatures">
    <div class="sig-line">Handled By</div>
    <div class="sig-line">Received By</div>
  </div>

  <div class="barcode-wrap">
    ${simpleBarcodeSvg(barcodeVal)}
    <div class="barcode-caption">* ${escapeHtml(params.jobId)} *</div>
  </div>

  <div class="center bold" style="margin-top: 8px; font-size: 9px; letter-spacing: 0.05em;">
    *** OPERATIONAL DOCKET - HOUSEKEEPING ***
  </div>
</body>
</html>`;
}

/**
 * Trigger dedicated print preview for Laundry KOT using an isolated iframe.
 * Ensures that ONLY the KOT ticket is sent to the printer and no background PMS DOM is printed.
 */
export async function printLaundryKotDocument(params: LaundryKotData): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    const html = buildLaundryKotHtml(params);

    // Create an isolated hidden iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      throw new Error("Unable to create print document context.");
    }

    doc.open();
    doc.write(html);
    doc.close();

    // Wait for content resources and render
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Focus and print ONLY the iframe document
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    // Cleanup after short delay to allow browser print dialog to finish hooking
    setTimeout(() => {
      try {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      } catch {
        // Ignore iframe cleanup exceptions
      }
    }, 2000);

    return true;
  } catch (err) {
    console.error("Print Laundry KOT failed:", err);
    return false;
  }
}
