"use client";

import { useEffect } from "react";
import { FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { accVoucherService, type VoucherDetail } from "@/services/accounts";
import { useAccQuery } from "@/components/accounts/accountsApi";
import { VoucherEditor, statusBadgeClass, type VoucherNotify } from "./VoucherEditor";

interface VoucherEditModalProps {
  voucherId: string;
  onClose: () => void;
  /** Called after the voucher was saved, posted, reversed or deleted, so the caller can refresh its list. */
  onChanged?: (voucher: VoucherDetail | null) => void;
}

const notify: VoucherNotify = (message, variant = "success") =>
  variant === "error" ? toast.error(message) : toast.success(message);

/** Opens any voucher in the same editor used on the GL Transaction page. */
export function VoucherEditModal({ voucherId, onClose, onChanged }: VoucherEditModalProps) {
  const detail = useAccQuery(() => accVoucherService.get(voucherId), [voucherId]);
  const voucher = detail.data;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-2 backdrop-blur-xs sm:p-4 print:hidden">
      <div className="flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-emerald-600" />
            <h3 className="truncate text-sm font-bold text-slate-900">
              {voucher ? (
                <>
                  {voucher.voucherTypeName ?? "Voucher"} — <span className="font-mono">{voucher.voucherNo}</span>
                </>
              ) : (
                "Voucher"
              )}
            </h3>
            {voucher && (
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-extrabold border",
                  statusBadgeClass(voucher.status),
                )}
              >
                {voucher.status}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-5">
          {detail.loading && !voucher ? (
            <div className="flex items-center justify-center gap-2 py-16 text-xs font-semibold text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> Loading voucher…
            </div>
          ) : detail.error || !voucher ? (
            <div className="py-12 text-center text-xs">
              <p className="font-semibold text-rose-700">{detail.error ?? "Voucher not found."}</p>
              <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => void detail.reload()}>
                Retry
              </Button>
            </div>
          ) : (
            <VoucherEditor
              key={voucher.id}
              voucher={voucher}
              variant="modal"
              notify={notify}
              onClose={onClose}
              onSaved={(saved, message) => {
                notify(message);
                onChanged?.(saved);
                onClose();
              }}
              onDeleted={(_id, message) => {
                notify(message);
                onChanged?.(null);
                onClose();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
