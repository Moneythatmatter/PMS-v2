"use client";

import React from "react";
import { PurchaseAttachmentPreviewModal } from "@/components/purchase-stores/ui/PurchaseAttachmentPreviewModal";
import {
  detectAttachmentType,
  formatAttachmentSize,
  type PurchaseAttachmentRecord,
} from "@/app/data/purchaseAttachmentUtils";

export type PreviewableFile = {
  id?: string;
  fileName: string;
  mimeType?: string | null;
  fileSize?: number | null;
  /** Data URL or blob URL. */
  src: string;
  subtitle?: string;
};

function toAttachment(file: PreviewableFile): PurchaseAttachmentRecord {
  return {
    id: file.id ?? file.fileName,
    fileName: file.fileName,
    fileSize: file.fileSize ? formatAttachmentSize(file.fileSize) : "",
    fileType: detectAttachmentType(file.fileName, file.mimeType ?? undefined),
    mimeType: file.mimeType ?? undefined,
    previewUrl: file.src,
    uploadedBy: file.subtitle,
  };
}

export function GuestDocumentPreviewModal({
  file,
  onClose,
}: {
  file: PreviewableFile | null;
  onClose: () => void;
}) {
  return (
    <PurchaseAttachmentPreviewModal
      attachment={file ? toAttachment(file) : null}
      onClose={onClose}
    />
  );
}
