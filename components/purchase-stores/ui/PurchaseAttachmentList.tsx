"use client";

import React, { useRef, useState } from "react";
import { Trash2, Plus, FileText, AlertCircle } from "lucide-react";

export interface AttachmentItem {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
}

export const DEFAULT_ATTACHMENT_TYPES = ["pdf", "jpg", "jpeg", "png"];
export const DEFAULT_ATTACHMENT_MAX_MB = 5;
export const DEFAULT_ATTACHMENT_MAX_FILES = 5;

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export interface PurchaseAttachmentListProps {
  attachments: AttachmentItem[];
  onAddAttachment?: (file: AttachmentItem) => void;
  onRemoveAttachment?: (id: string) => void;
  /** Allowed file extensions (lowercase, no dot). */
  allowedTypes?: string[];
  maxSizeMB?: number;
  maxFiles?: number;
}

export function PurchaseAttachmentList({
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  allowedTypes = DEFAULT_ATTACHMENT_TYPES,
  maxSizeMB = DEFAULT_ATTACHMENT_MAX_MB,
  maxFiles = DEFAULT_ATTACHMENT_MAX_FILES,
}: PurchaseAttachmentListProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const types = allowedTypes.map((t) => t.toLowerCase().replace(/^\./, ""));
  const accept = [...types.map((t) => `.${t}`), ...types.map((t) => MIME_BY_EXT[t]).filter(Boolean)].join(",");
  const typeLabel = [...new Set(types.map((t) => (t === "jpeg" ? "jpg" : t).toUpperCase()))].join(", ");
  const canAddMore = attachments.length < maxFiles;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !onAddAttachment) return;

    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    const mimeOk = !file.type || types.some((t) => MIME_BY_EXT[t] === file.type);
    if (!types.includes(ext) || !mimeOk) {
      setError(`"${file.name}" is not allowed. Upload ${typeLabel} files only.`);
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`"${file.name}" is ${formatSize(file.size)}. Maximum size is ${maxSizeMB} MB.`);
      return;
    }
    if (file.size === 0) {
      setError(`"${file.name}" is empty.`);
      return;
    }
    if (!canAddMore) {
      setError(`You can attach up to ${maxFiles} files.`);
      return;
    }
    if (attachments.some((a) => a.fileName.toLowerCase() === file.name.toLowerCase())) {
      setError(`"${file.name}" is already attached.`);
      return;
    }

    setError("");
    onAddAttachment({
      id: `att-${Date.now()}`,
      fileName: file.name,
      fileSize: formatSize(file.size),
      fileType: ext,
    });
  };

  return (
    <div className="space-y-3">
      <input
        type="file"
        ref={fileInputRef}
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {attachments.map((att) => (
          <div
            key={att.id}
            className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{att.fileName}</p>
                <p className="text-[10px] text-slate-400 font-medium">{att.fileSize}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {onRemoveAttachment && (
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    onRemoveAttachment(att.id);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Remove Attachment"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}

        {onAddAttachment && canAddMore && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/30 flex items-center justify-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-800 transition-all cursor-pointer min-h-[50px]"
          >
            <Plus className="h-4 w-4" /> Upload Document / Receipt
          </button>
        )}
      </div>

      {onAddAttachment && (
        <p className="text-[11px] text-slate-500">
          Allowed: {typeLabel} · Max {maxSizeMB} MB per file · Up to {maxFiles} files ({attachments.length}/{maxFiles})
        </p>
      )}
      {error && (
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
