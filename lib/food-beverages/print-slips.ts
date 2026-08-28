import { formatINR } from "@/app/data/foodbeverages/ops";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slipDateTimeLabel() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${hh}:${min}`;
}

function tableLabel(orderType: string, tableRef: string) {
  if (orderType === "Room Service") return `Room No: ${tableRef}`;
  if (orderType === "Takeaway") return `Ref: ${tableRef}`;
  return `Table No: ${tableRef.replace(/^T-?/i, "")}`;
}

function formatSlipNumber(raw: string, prefix: string) {
  const value = raw.trim();
  if (!value) return prefix;
  const match = value.match(/(\d+)\s*$/);
  if (match) return `${prefix} - ${match[1]}`;
  return value.replace(new RegExp(`^${prefix}-?`, "i"), `${prefix} - `);
}

function simpleBarcodeSvg(value: string) {
  let x = 0;
  const bars: string[] = [];
  const chars = value.replace(/[^A-Za-z0-9]/g, "") || "SLIP0";
  for (let i = 0; i < chars.length * 4; i++) {
    const code = chars.charCodeAt(i % chars.length) + i * 17;
    const width = code % 3 === 0 ? 3 : code % 2 === 0 ? 2 : 1;
    if (i % 2 === 0) {
      bars.push(`<rect x="${x}" y="0" width="${width}" height="48" fill="#000"/>`);
    }
    x += width + 1;
  }
  return `<svg width="${x}" height="48" viewBox="0 0 ${x} 48" xmlns="http://www.w3.org/2000/svg">${bars.join("")}</svg>`;
}

const THERMAL_CSS = `
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Courier New", Courier, monospace;
    font-size: 12px;
    line-height: 1.35;
    margin: 0 auto;
    padding: 8px 6px 12px;
    width: 72mm;
    color: #000;
    background: #fff;
  }
  .center { text-align: center; }
  .meta { margin: 2px 0; font-size: 12px; }
  .divider { border-top: 1px dashed #000; margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; }
  .head td { font-weight: 700; padding-bottom: 4px; vertical-align: bottom; }
  .item-row td { padding: 5px 0 0; vertical-align: top; }
  .item-name { font-weight: 700; padding-right: 6px; }
  .item-note { font-weight: 400; font-size: 10px; margin-top: 2px; padding-left: 2px; white-space: pre-wrap; }
  .item-qty { text-align: right; font-weight: 700; white-space: nowrap; }
  .item-amt { text-align: right; font-weight: 700; white-space: nowrap; width: 4rem; }
  .qty-head { text-align: right; width: 2.2rem; }
  .amt-head { text-align: right; width: 4rem; }
  .total-row { margin-top: 10px; font-weight: 700; text-align: right; font-size: 14px; }
  .scan { margin-top: 14px; font-size: 11px; }
  .barcode-wrap { margin-top: 6px; text-align: center; }
  .barcode-no { margin-top: 4px; font-size: 11px; letter-spacing: 0.08em; }
`;

function downloadSlipHtml(html: string, fileName: string) {
  const safeName = fileName.replace(/[^A-Za-z0-9-_]+/g, "-") || "slip";
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeName}.html`;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export type KotPrintLine = {
  name: string;
  qty: number;
  note?: string;
};

export type KotSlipParams = {
  kotNo: string;
  kotId: string;
  orderType: string;
  tableRef: string;
  lines: KotPrintLine[];
};

export type BillPrintLine = {
  name: string;
  qty: number;
  price: number;
};

export type BillSlipParams = {
  billNo: string;
  billId: string;
  orderNo: string;
  orderType: string;
  outletName: string;
  tableRef: string;
  guest: string;
  server: string;
  lines: BillPrintLine[];
  total: number;
};

export function buildKotSlipHtml(params: KotSlipParams) {
  const itemRows = params.lines
    .map((line) => {
      const noteHtml = line.note
        ? `<div class="item-note">${escapeHtml(line.note)
            .split("\n")
            .map((part) => `<div>${part}</div>`)
            .join("")}</div>`
        : "";
      return `<tr class="item-row">
        <td class="item-name">${escapeHtml(line.name)}${noteHtml}</td>
        <td class="item-qty">${line.qty}</td>
      </tr>`;
    })
    .join("");

  const barcodeValue = params.kotId.replace(/[^A-Za-z0-9]/g, "").slice(-12) || params.kotNo;
  const kotLabel = formatSlipNumber(params.kotNo, "KOT");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${escapeHtml(kotLabel)}</title>
<style>${THERMAL_CSS}</style></head><body>
  <div class="center meta">${slipDateTimeLabel()}</div>
  <div class="center meta" style="font-weight:700;margin-top:4px">${escapeHtml(kotLabel)}</div>
  <div class="center meta">${escapeHtml(params.orderType)}</div>
  <div class="center meta">${escapeHtml(tableLabel(params.orderType, params.tableRef))}</div>
  <div class="divider"></div>
  <table>
    <tr class="head"><td>Item</td><td class="qty-head">Qty.</td></tr>
    ${itemRows}
  </table>
  <div class="center scan">Scan to Mark food ready:</div>
  <div class="barcode-wrap">${simpleBarcodeSvg(barcodeValue)}<div class="barcode-no">${escapeHtml(barcodeValue.slice(-3).padStart(3, "0"))}</div></div>
</body></html>`;
}

export function buildBillSlipHtml(params: BillSlipParams) {
  const itemRows = params.lines
    .map(
      (line) =>
        `<tr class="item-row">
          <td class="item-name">${escapeHtml(line.name)}</td>
          <td class="item-qty">${line.qty}</td>
          <td class="item-amt">${escapeHtml(formatINR(line.qty * line.price))}</td>
        </tr>`,
    )
    .join("");

  const barcodeValue = params.billId.replace(/[^A-Za-z0-9]/g, "").slice(-12) || params.billNo;
  const billLabel = formatSlipNumber(params.billNo, "Bill");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${escapeHtml(billLabel)}</title>
<style>${THERMAL_CSS}</style></head><body>
  <div class="center meta">${slipDateTimeLabel()}</div>
  <div class="center meta" style="font-weight:700;margin-top:4px">${escapeHtml(billLabel)}</div>
  <div class="center meta">Order ${escapeHtml(params.orderNo)}</div>
  <div class="center meta">${escapeHtml(params.orderType)} · ${escapeHtml(params.outletName)}</div>
  <div class="center meta">${escapeHtml(tableLabel(params.orderType, params.tableRef))}</div>
  <div class="center meta">Guest: ${escapeHtml(params.guest)} · Server: ${escapeHtml(params.server)}</div>
  <div class="divider"></div>
  <table>
    <tr class="head">
      <td>Item</td>
      <td class="qty-head">Qty.</td>
      <td class="amt-head">Amt.</td>
    </tr>
    ${itemRows}
  </table>
  <div class="total-row">Total: ${escapeHtml(formatINR(params.total))}</div>
  <div class="center scan">Thank you</div>
  <div class="barcode-wrap">${simpleBarcodeSvg(barcodeValue)}<div class="barcode-no">${escapeHtml(barcodeValue.slice(-3).padStart(3, "0"))}</div></div>
</body></html>`;
}

export function saveKotSlip(params: KotSlipParams) {
  downloadSlipHtml(buildKotSlipHtml(params), params.kotNo);
}

export function saveBillSlip(params: BillSlipParams) {
  downloadSlipHtml(buildBillSlipHtml(params), params.billNo);
}

export function formatKotNumber(raw: string) {
  return formatSlipNumber(raw, "KOT");
}
