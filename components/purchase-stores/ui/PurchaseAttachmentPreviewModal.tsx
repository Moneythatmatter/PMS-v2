"use client";

import React from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Modal } from "@/components/frontoffice/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  type PurchaseAttachmentRecord,
  getAttachmentPreviewKind,
  getAttachmentPreviewSrc,
  downloadAttachment,
} from "@/app/data/purchaseAttachmentUtils";

interface PurchaseAttachmentPreviewModalProps {
  attachment: PurchaseAttachmentRecord | null;
  onClose: () => void;
}

export function PurchaseAttachmentPreviewModal({ attachment, onClose }: PurchaseAttachmentPreviewModalProps) {
  if (!attachment) return null;

  const src = getAttachmentPreviewSrc(attachment);
  const kind = getAttachmentPreviewKind(attachment);
  const canPreview = Boolean(src) && kind !== "unsupported";

  return (
    <Modal
      open={Boolean(attachment)}
      onClose={onClose}
      title={attachment.fileName}
      description={`${attachment.fileSize}${attachment.uploadedBy ? ` · ${attachment.uploadedBy}` : ""}`}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          {src && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => downloadAttachment(attachment)}
            >
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
          )}
          <Button type="button" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      {!src ? (
        <div className="py-12 text-center text-sm text-slate-500">
          <FileText className="h-10 w-10 mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700">Preview unavailable</p>
          <p className="text-xs mt-1">This file was saved without embedded content. Re-upload to enable preview.</p>
        </div>
      ) : kind === "image" ? (
        <div className="flex justify-center bg-slate-50 rounded-xl border border-slate-200 p-4 max-h-[70vh] overflow-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={attachment.fileName}
            className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-sm"
          />
        </div>
      ) : kind === "pdf" ? (
        <iframe
          src={src}
          title={attachment.fileName}
          className="w-full h-[70vh] rounded-xl border border-slate-200 bg-white"
        />
      ) : (
        <div className="py-12 text-center text-sm text-slate-500">
          <FileSpreadsheet className="h-10 w-10 mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700">In-browser preview not supported for this file type</p>
          <p className="text-xs mt-1">Use Download to open {attachment.fileName} on your device.</p>
        </div>
      )}

      {src && !canPreview && kind === "unsupported" && (
        <p className="text-[11px] text-slate-400 text-center mt-2">Word and Excel files can be downloaded but not previewed in the browser.</p>
      )}
    </Modal>
  );
}
