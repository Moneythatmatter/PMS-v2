"use client";

import { useEffect, useState } from "react";
import { Download, Printer } from "lucide-react";
import { computeCheckoutTotals } from "@/app/data/frontoffice/checkout";
import { Button } from "@/components/ui/Button";
import { Drawer, formatINR } from "@/components/frontoffice/ui";
import { cn } from "@/lib/utils";
import {
  amountInWords,
  buildCheckoutInvoiceLineItems,
  CHECKOUT_INVOICE_HOTEL,
  downloadCheckoutInvoice,
  formatCheckoutRoomLabel,
  printCheckoutInvoice,
  type CheckoutInvoiceContent,
} from "@/components/frontoffice/checkoutInvoiceDocument";

export type InvoiceData = CheckoutInvoiceContent;

interface CheckoutInvoiceDrawerProps {
  open: boolean;
  onClose: () => void;
  data: InvoiceData | null;
}

export function CheckoutInvoiceDrawer({ open, onClose, data }: CheckoutInvoiceDrawerProps) {
  const [fullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    if (!open) setFullScreen(false);
  }, [open]);

  if (!data) return null;

  const { invoiceNo, invoiceDate, folio, discount, paymentMode, bill, billTitle } = data;
  const totals = bill
    ? {
        charges: bill.charges,
        subtotalWithTax: bill.charges + bill.gst,
        grandTotal: bill.charges + bill.gst - bill.discount,
        pending: bill.due,
        discount: bill.discount,
      }
    : computeCheckoutTotals(folio, discount);
  const lineItems = buildCheckoutInvoiceLineItems(folio, bill);
  const taxableAmount = bill?.charges ?? totals.charges;
  const billGst = bill?.gst ?? folio.gst;
  const cgst = Math.round(billGst / 2);
  const sgst = Math.round(billGst / 2);
  const advancePaid = bill?.advance ?? folio.advancePaid;
  const billDiscount = bill?.discount ?? discount;
  const roomLabel = formatCheckoutRoomLabel(folio);
  const invoiceHeading = bill ? billTitle || "Split Bill Invoice" : "Tax Invoice";

  const handlePrint = () => {
    printCheckoutInvoice(data);
  };

  const handleDownload = () => {
    downloadCheckoutInvoice(data);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={billTitle ? `${billTitle}` : "Tax Invoice"}
      description={invoiceNo}
      width="xl"
      fullScreen={fullScreen}
      onToggleFullScreen={() => setFullScreen((v) => !v)}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
          <Button className="gap-1.5 bg-emerald-700 hover:bg-emerald-800" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5" />
            Print Invoice
          </Button>
        </>
      }
    >
      <div className={cn(fullScreen && "mx-auto max-w-4xl")}>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Header band */}
          <div className="bg-gradient-to-br from-emerald-800 to-emerald-600 px-6 py-6 text-white sm:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-2xl font-bold">{CHECKOUT_INVOICE_HOTEL.name}</p>
                <p className="mt-1 text-xs text-emerald-100">{CHECKOUT_INVOICE_HOTEL.tagline}</p>
                <p className="mt-3 text-xs leading-relaxed text-emerald-50/90">
                  {CHECKOUT_INVOICE_HOTEL.address}
                  <br />
                  {CHECKOUT_INVOICE_HOTEL.phone} · {CHECKOUT_INVOICE_HOTEL.email}
                </p>
                <p className="mt-2 text-xs text-emerald-50/90">
                  GSTIN: {CHECKOUT_INVOICE_HOTEL.gstin} · PAN: {CHECKOUT_INVOICE_HOTEL.pan}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                  {invoiceHeading}
                </span>
                <p className="mt-3 text-lg font-bold">{invoiceNo}</p>
                <p className="mt-1 text-xs text-emerald-50/90">Date: {invoiceDate}</p>
                <p className="mt-0.5 text-xs text-emerald-50/90">
                  Place of Supply: {CHECKOUT_INVOICE_HOTEL.state} ({CHECKOUT_INVOICE_HOTEL.stateCode})
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            {/* Bill To / Stay */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bill To</p>
                <p className="mt-2 text-base font-bold text-slate-900">{folio.guestName}</p>
                <p className="text-sm text-slate-600">{folio.phone}</p>
                {folio.email && <p className="text-sm text-slate-600">{folio.email}</p>}
                <p className="mt-1 text-xs text-slate-500">Booking ID: {folio.bookingId}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Stay Details</p>
                <p className="mt-2 text-sm text-slate-700">
                  <span className="font-medium">Room:</span> {roomLabel}
                </p>
                <p className="text-sm text-slate-700">
                  <span className="font-medium">Check-in:</span> {folio.checkIn}
                </p>
                <p className="text-sm text-slate-700">
                  <span className="font-medium">Check-out:</span> {folio.checkOut}
                </p>
                <p className="text-sm text-slate-700">
                  <span className="font-medium">Guests:</span> {folio.adults} Adult
                  {folio.adults !== 1 ? "s" : ""}
                  {folio.children > 0
                    ? `, ${folio.children} Child${folio.children !== 1 ? "ren" : ""}`
                    : ""}
                  · {folio.nights} Night{folio.nights !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Line items */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-slate-500">#</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-slate-500">
                      Description
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase text-slate-500">SAC</th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase text-slate-500">
                      Qty
                    </th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase text-slate-500">
                      Rate
                    </th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase text-slate-500">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, i) => (
                    <tr key={item.desc} className={cn("border-b border-slate-100", i % 2 === 1 && "bg-slate-50/60")}>
                      <td className="px-3 py-3 text-slate-500">{i + 1}</td>
                      <td className="px-3 py-3 font-medium text-slate-800">{item.desc}</td>
                      <td className="px-3 py-3 text-xs text-slate-500">{item.sac}</td>
                      <td className="px-3 py-3 text-right text-slate-700">{item.qty}</td>
                      <td className="px-3 py-3 text-right text-slate-700">{formatINR(item.rate)}</td>
                      <td className="px-3 py-3 text-right font-semibold text-slate-900">{formatINR(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals + payment */}
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Payment Information</p>
                <p className="mt-2 text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">Mode:</span> {paymentMode}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  <span className="font-semibold text-slate-800">Amount in words:</span>{" "}
                  {amountInWords(totals.pending)} Rupees Only
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Amount</span>
                    <span className="font-medium text-slate-900">{formatINR(taxableAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST @ 9%</span>
                    <span>{formatINR(cgst)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST @ 9%</span>
                    <span>{formatINR(sgst)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-medium text-slate-800">
                    <span>Subtotal (incl. tax)</span>
                    <span>{formatINR(totals.subtotalWithTax)}</span>
                  </div>
                  {billDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount</span>
                      <span>− {formatINR(billDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-emerald-700">
                    <span>Advance Paid</span>
                    <span>− {formatINR(advancePaid)}</span>
                  </div>
                  <div className="flex justify-between border-t-2 border-emerald-700 pt-3 text-base font-bold text-slate-900">
                    <span>Amount Due</span>
                    <span className="text-lg text-emerald-700">{formatINR(totals.pending)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-dashed border-slate-200 pt-4">
              <p className="text-[10px] leading-relaxed text-slate-400">
                This is a computer-generated tax invoice and does not require a physical signature. Subject to
                Bengaluru jurisdiction. E.&amp;O.E. GST charged as per applicable rates. For queries contact{" "}
                {CHECKOUT_INVOICE_HOTEL.email} within 7 days of checkout.
              </p>
              <div className="mt-6 flex justify-between gap-6 text-xs text-slate-500">
                <div className="w-40">
                  <p className="font-medium text-slate-700">Guest Signature</p>
                  <div className="mt-10 border-t border-slate-300 pt-1">________________</div>
                </div>
                <div className="w-40 text-right">
                  <p className="font-medium text-slate-700">Authorised Signatory</p>
                  <div className="mt-10 border-t border-slate-300 pt-1">Front Office</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
