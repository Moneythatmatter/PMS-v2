"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Printer } from "lucide-react";
import type { CheckoutFolio } from "@/app/data/frontoffice/checkout";
import { computeCheckoutTotals } from "@/app/data/frontoffice/checkout";
import { Button } from "@/components/ui/Button";
import { Drawer, formatINR } from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";

const HOTEL = {
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

export interface InvoiceData {
  invoiceNo: string;
  invoiceDate: string;
  folio: CheckoutFolio;
  discount: number;
  paymentMode: string;
}

interface CheckoutInvoiceDrawerProps {
  open: boolean;
  onClose: () => void;
  data: InvoiceData | null;
}

function buildLineItems(folio: CheckoutFolio) {
  const items: { desc: string; sac: string; qty: number; rate: number; amount: number }[] = [];

  if (folio.roomCharges > 0) {
    items.push({
      desc: `Room Charges — ${folio.roomType} (Room ${folio.room})`,
      sac: "996311",
      qty: folio.nights,
      rate: Math.round(folio.roomCharges / folio.nights),
      amount: folio.roomCharges,
    });
  }
  if (folio.restaurantCharges > 0) {
    items.push({ desc: "Restaurant / F&B Charges", sac: "996331", qty: 1, rate: folio.restaurantCharges, amount: folio.restaurantCharges });
  }
  if (folio.laundry > 0) {
    items.push({ desc: "Laundry Services", sac: "999799", qty: 1, rate: folio.laundry, amount: folio.laundry });
  }
  if (folio.miniBar > 0) {
    items.push({ desc: "Mini Bar Consumption", sac: "996331", qty: 1, rate: folio.miniBar, amount: folio.miniBar });
  }
  if (folio.extraBed > 0) {
    items.push({ desc: "Extra Bed Charges", sac: "996311", qty: 1, rate: folio.extraBed, amount: folio.extraBed });
  }
  if (folio.otherCharges > 0) {
    items.push({ desc: "Miscellaneous Charges", sac: "999799", qty: 1, rate: folio.otherCharges, amount: folio.otherCharges });
  }

  return items;
}

export function CheckoutInvoiceDrawer({ open, onClose, data }: CheckoutInvoiceDrawerProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [fullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    if (!open) setFullScreen(false);
  }, [open]);

  if (!data) return null;

  const { invoiceNo, invoiceDate, folio, discount, paymentMode } = data;
  const totals = computeCheckoutTotals(folio, discount);
  const lineItems = buildLineItems(folio);
  const taxableAmount = totals.charges;
  const cgst = Math.round(folio.gst / 2);
  const sgst = Math.round(folio.gst / 2);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html><head>
        <title>Invoice ${invoiceNo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1e293b; padding: 32px; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          th { background: #f8fafc; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
          .header { display: flex; justify-content: space-between; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #1e293b; }
          .hotel-name { font-size: 22px; font-weight: 700; color: #0f172a; }
          .totals { margin-top: 16px; }
          .totals td { border: none; padding: 4px 10px; }
          .grand { font-size: 16px; font-weight: 700; border-top: 2px solid #1e293b !important; }
          .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; }
        </style>
      </head><body>${content.innerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  const handleDownload = () => {
    handlePrint();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Tax Invoice"
      description={invoiceNo}
      width="xl"
      fullScreen={fullScreen}
      onToggleFullScreen={() => setFullScreen((v) => !v)}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="outline" className="gap-1.5" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
          <Button className="gap-1.5 bg-blue-600 hover:bg-blue-700" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5" />
            Print Invoice
          </Button>
        </>
      }
    >
      <div className={cn(fullScreen && "mx-auto max-w-4xl")}>
        <div ref={printRef} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
          <div>
            <p className="text-xl font-bold text-slate-900">{HOTEL.name}</p>
            <p className="mt-0.5 text-xs text-slate-500">{HOTEL.tagline}</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              {HOTEL.address}<br />
              {HOTEL.phone} · {HOTEL.email}
            </p>
            <p className="mt-2 text-xs text-slate-600">
              <span className="font-semibold">GSTIN:</span> {HOTEL.gstin}
              <span className="mx-2">|</span>
              <span className="font-semibold">PAN:</span> {HOTEL.pan}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold uppercase tracking-wide text-blue-600">Tax Invoice</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{invoiceNo}</p>
            <p className="mt-1 text-xs text-slate-500">Date: {invoiceDate}</p>
            <p className="mt-1 text-xs text-slate-500">Place of Supply: {HOTEL.state} ({HOTEL.stateCode})</p>
          </div>
        </div>

        {/* Bill To / Stay */}
        <div className="mt-5 grid grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Bill To</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{folio.guestName}</p>
            <p className="text-xs text-slate-600">{folio.phone}</p>
            {folio.email && <p className="text-xs text-slate-600">{folio.email}</p>}
            <p className="mt-1 text-xs text-slate-500">Booking: {folio.bookingId}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Stay Details</p>
            <p className="mt-1 text-xs text-slate-700">
              <span className="font-medium">Room:</span> {folio.room} — {folio.roomType}
            </p>
            <p className="text-xs text-slate-700">
              <span className="font-medium">Check-in:</span> {folio.checkIn}
            </p>
            <p className="text-xs text-slate-700">
              <span className="font-medium">Check-out:</span> {folio.checkOut}
            </p>
            <p className="text-xs text-slate-700">
              <span className="font-medium">Guests:</span> {folio.adults} Adult{folio.adults !== 1 ? "s" : ""}
              {folio.children > 0 ? `, ${folio.children} Child${folio.children !== 1 ? "ren" : ""}` : ""}
              · {folio.nights} Night{folio.nights !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Line items */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-2 py-2 text-left text-[10px] font-semibold uppercase text-slate-500">#</th>
                <th className="px-2 py-2 text-left text-[10px] font-semibold uppercase text-slate-500">Description</th>
                <th className="px-2 py-2 text-left text-[10px] font-semibold uppercase text-slate-500">SAC</th>
                <th className="px-2 py-2 text-right text-[10px] font-semibold uppercase text-slate-500">Qty</th>
                <th className="px-2 py-2 text-right text-[10px] font-semibold uppercase text-slate-500">Rate</th>
                <th className="px-2 py-2 text-right text-[10px] font-semibold uppercase text-slate-500">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, i) => (
                <tr key={item.desc} className="border-b border-slate-100">
                  <td className="px-2 py-2.5 text-slate-500">{i + 1}</td>
                  <td className="px-2 py-2.5 font-medium text-slate-800">{item.desc}</td>
                  <td className="px-2 py-2.5 text-xs text-slate-500">{item.sac}</td>
                  <td className="px-2 py-2.5 text-right text-slate-700">{item.qty}</td>
                  <td className="px-2 py-2.5 text-right text-slate-700">{formatINR(item.rate)}</td>
                  <td className="px-2 py-2.5 text-right font-medium text-slate-900">{formatINR(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-4 flex justify-end">
          <table className="w-full max-w-xs text-sm">
            <tbody>
              <tr>
                <td className="py-1.5 text-slate-600">Taxable Amount</td>
                <td className="py-1.5 text-right font-medium text-slate-900">{formatINR(taxableAmount)}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-slate-600">CGST @ 9%</td>
                <td className="py-1.5 text-right text-slate-700">{formatINR(cgst)}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-slate-600">SGST @ 9%</td>
                <td className="py-1.5 text-right text-slate-700">{formatINR(sgst)}</td>
              </tr>
              <tr className="border-t border-slate-200">
                <td className="py-2 font-medium text-slate-800">Subtotal (incl. tax)</td>
                <td className="py-2 text-right font-semibold text-slate-900">{formatINR(totals.subtotalWithTax)}</td>
              </tr>
              {discount > 0 && (
                <tr>
                  <td className="py-1.5 text-emerald-600">Discount</td>
                  <td className="py-1.5 text-right text-emerald-600">− {formatINR(discount)}</td>
                </tr>
              )}
              <tr>
                <td className="py-1.5 text-emerald-600">Advance Paid</td>
                <td className="py-1.5 text-right text-emerald-600">− {formatINR(folio.advancePaid)}</td>
              </tr>
              <tr className="border-t-2 border-slate-900">
                <td className="py-3 text-base font-bold text-slate-900">Amount Due</td>
                <td className="py-3 text-right text-lg font-bold text-blue-600">{formatINR(totals.pending)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment info */}
        <div className="mt-5 rounded-lg bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Payment Mode:</span> {paymentMode}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Amount in words: {amountInWords(totals.pending)} Rupees Only
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="text-[10px] leading-relaxed text-slate-400">
            This is a computer-generated tax invoice and does not require a physical signature.
            Subject to Bengaluru jurisdiction. E.&amp;O.E. GST charged as per applicable rates.
            For queries contact {HOTEL.email} within 7 days of checkout.
          </p>
          <div className="mt-6 flex justify-between text-xs text-slate-500">
            <div>
              <p className="font-medium text-slate-700">Guest Signature</p>
              <div className="mt-8 border-t border-slate-300 pt-1 w-40">________________</div>
            </div>
            <div className="text-right">
              <p className="font-medium text-slate-700">Authorised Signatory</p>
              <div className="mt-8 border-t border-slate-300 pt-1 w-40 ml-auto">Front Office</div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </Drawer>
  );
}

function amountInWords(num: number): string {
  if (num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + convert(n % 100) : "");
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "");
    return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "");
  }

  return convert(Math.round(num));
}
