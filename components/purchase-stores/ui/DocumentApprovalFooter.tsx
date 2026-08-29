"use client";

import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DocumentApprovalFooterProps {
  showApprovalActions: boolean;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
  approveLabel?: string;
  rejectLabel?: string;
  extraActions?: React.ReactNode;
}

export function DocumentApprovalFooter({
  showApprovalActions,
  onApprove,
  onReject,
  onClose,
  approveLabel = "Approve",
  rejectLabel = "Reject",
  extraActions,
}: DocumentApprovalFooterProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 w-full">
      <div className="flex flex-wrap gap-2">{extraActions}</div>
      <div className="flex flex-wrap gap-2 ml-auto">
        {showApprovalActions && (
          <>
            <Button type="button" variant="outline" size="sm" onClick={onReject} className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50">
              <XCircle className="h-3.5 w-3.5" /> {rejectLabel}
            </Button>
            <Button type="button" size="sm" onClick={onApprove} className="gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white">
              <CheckCircle2 className="h-3.5 w-3.5" /> {approveLabel}
            </Button>
          </>
        )}
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
