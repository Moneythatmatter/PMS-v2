"use client";

import React, { useState } from "react";
import { History, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ModulePageShell } from "@/components/pms";
import { accVoucherService } from "@/services/accounts";
import { accErrorMessage } from "@/components/accounts/accountsApi";
import { VoucherEditor } from "./VoucherEditor";
import { VoucherEditModal } from "./VoucherEditModal";

type Toast = { message: string; variant: "success" | "error" } | null;

export function GLTransactionView() {
  const [toast, setToast] = useState<Toast>(null);
  const notify = (message: string, variant: "success" | "error" = "success") => setToast({ message, variant });

  const [lastVoucherId, setLastVoucherId] = useState<string | null>(null);
  const [lastLoading, setLastLoading] = useState(false);

  const handleShowLastTransaction = async () => {
    setLastLoading(true);
    try {
      const [latest] = await accVoucherService.list({ provisional: false, sort: "recent", limit: 1 });
      if (!latest) {
        notify("No transactions have been entered yet.", "error");
      return;
      }
      setLastVoucherId(latest.id);
    } catch (e) {
      notify(accErrorMessage(e), "error");
    } finally {
      setLastLoading(false);
    }
  };

  return (
    <ModulePageShell
      eyebrow="Accounts & General Ledger"
      title="GL Transaction"
      description="Create, post, and manage General Ledger journal transaction vouchers."
      breadcrumbs={[
        { label: "Accounts", href: "/accounts/dashboard" },
        { label: "Transaction", href: "/accounts/transaction" },
        { label: "GL Transaction" },
      ]}
      secondaryActions={
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={lastLoading}
          onClick={() => void handleShowLastTransaction()}
          className="w-full rounded-xl bg-white text-xs font-semibold text-slate-700 sm:w-auto"
        >
          {lastLoading ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <History className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
          )}
          Last Transaction
        </Button>
      }
      wrapChildren={false}
      toast={toast?.message ?? null}
      toastVariant={toast?.variant}
      onDismissToast={() => setToast(null)}
    >
      <VoucherEditor variant="page" notify={notify} />

      {lastVoucherId && <VoucherEditModal voucherId={lastVoucherId} onClose={() => setLastVoucherId(null)} />}
    </ModulePageShell>
  );
}
