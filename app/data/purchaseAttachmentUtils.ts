/** Shared attachment metadata for Purchase & Stores documents (PR, PO, GRN, RFQ). */

export type PurchaseAttachmentUiType = "PDF" | "Excel" | "Word" | "Image" | "File";

export type AttachmentPreviewKind = "image" | "pdf" | "unsupported";

export interface PurchaseAttachmentRecord {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: PurchaseAttachmentUiType;
  uploadedBy?: string;
  uploadedOn?: string;
  /** Base64 data URL — persisted in JSONB for preview after save */
  dataUrl?: string;
  mimeType?: string;
  /** Ephemeral blob URL for in-session preview (not saved) */
  previewUrl?: string;
}

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5 MB

export function formatAttachmentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function detectAttachmentType(fileName: string, mimeType?: string): PurchaseAttachmentUiType {
  const name = fileName.toLowerCase();
  const mime = (mimeType ?? "").toLowerCase();
  if (name.endsWith(".pdf") || mime === "application/pdf") return "PDF";
  if (name.match(/\.(xlsx|xls|csv)$/) || mime.includes("spreadsheet") || mime.includes("excel")) return "Excel";
  if (name.match(/\.(doc|docx)$/) || mime.includes("word")) return "Word";
  if (name.match(/\.(jpg|jpeg|png|gif|webp)$/) || mime.startsWith("image/")) return "Image";
  return "File";
}

export function getAttachmentPreviewKind(att: Pick<PurchaseAttachmentRecord, "fileType" | "mimeType" | "fileName">): AttachmentPreviewKind {
  const type = att.fileType || detectAttachmentType(att.fileName, att.mimeType);
  if (type === "Image") return "image";
  if (type === "PDF") return "pdf";
  const name = att.fileName.toLowerCase();
  if (name.match(/\.(jpg|jpeg|png|gif|webp)$/)) return "image";
  if (name.endsWith(".pdf")) return "pdf";
  if ((att.mimeType ?? "").startsWith("image/")) return "image";
  if ((att.mimeType ?? "") === "application/pdf") return "pdf";
  return "unsupported";
}

export function getAttachmentPreviewSrc(att: PurchaseAttachmentRecord): string | undefined {
  return att.previewUrl ?? att.dataUrl;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export async function createAttachmentFromFile(
  file: File,
  uploadedBy: string,
): Promise<PurchaseAttachmentRecord> {
  const dataUrl = await readFileAsDataUrl(file);
  const previewUrl = URL.createObjectURL(file);
  return {
    id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fileName: file.name,
    fileType: detectAttachmentType(file.name, file.type),
    fileSize: formatAttachmentSize(file.size),
    mimeType: file.type || undefined,
    dataUrl,
    previewUrl,
    uploadedBy,
    uploadedOn: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
  };
}

export function revokeAttachmentUrls(attachments: PurchaseAttachmentRecord[]) {
  for (const att of attachments) {
    if (att.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(att.previewUrl);
    }
  }
}

import type { PRAttachment } from "./purchaseRequisitionsData";

export function attachmentToApiPayload(att: PurchaseAttachmentRecord): PRAttachment {
  return {
    id: att.id,
    fileName: att.fileName,
    fileSize: att.fileSize,
    fileType:
      att.fileType === "PDF"
        ? "pdf"
        : att.fileType === "Excel"
          ? "xlsx"
          : att.fileType === "Image"
            ? "image"
            : "doc",
    dataUrl: att.dataUrl,
    mimeType: att.mimeType,
  };
}

export function attachmentFromApi(
  raw: {
    id: string;
    fileName: string;
    fileSize: string;
    fileType?: string;
    dataUrl?: string;
    mimeType?: string;
  },
  fallbackUser?: string,
  fallbackDate?: string,
): PurchaseAttachmentRecord {
  const ft = String(raw.fileType ?? "").toLowerCase();
  let fileType: PurchaseAttachmentUiType = "File";
  if (ft === "pdf") fileType = "PDF";
  else if (ft === "xlsx" || ft === "xls") fileType = "Excel";
  else if (ft === "doc" || ft === "docx") fileType = "Word";
  else if (ft === "image" || ft === "png" || ft === "jpg") fileType = "Image";
  else fileType = detectAttachmentType(raw.fileName, raw.mimeType);

  return {
    id: raw.id,
    fileName: raw.fileName,
    fileSize: raw.fileSize,
    fileType,
    dataUrl: raw.dataUrl,
    mimeType: raw.mimeType,
    uploadedBy: fallbackUser,
    uploadedOn: fallbackDate,
  };
}

export function downloadAttachment(att: PurchaseAttachmentRecord) {
  const src = getAttachmentPreviewSrc(att);
  if (!src) return false;
  const a = document.createElement("a");
  a.href = src;
  a.download = att.fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  return true;
}
