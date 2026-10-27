"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Download, Eye, FileText, Loader2, Trash2, Upload } from "lucide-react";
import type { GuestDocument } from "@/app/data/frontoffice/modules";
import { guestDocumentService } from "@/services/front-office";
import { Button } from "@/components/ui/Button";
import {
  MAX_ATTACHMENT_BYTES,
  formatAttachmentSize,
  readFileAsDataUrl,
} from "@/app/data/purchaseAttachmentUtils";
import { cn } from "@/lib/utils";
import {
  GuestDocumentPreviewModal,
  type PreviewableFile,
} from "./GuestDocumentPreviewModal";

export const GUEST_DOCUMENT_ACCEPT = "image/*,application/pdf";

function formatUploadedAt(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function documentToPreview(doc: GuestDocument): PreviewableFile {
  return {
    id: doc.id,
    fileName: doc.fileName,
    mimeType: doc.mimeType,
    fileSize: doc.fileSize,
    src: doc.dataUrl,
    subtitle: [doc.documentType, formatUploadedAt(doc.createdAt)]
      .filter(Boolean)
      .join(" · "),
  };
}

function downloadDocument(doc: GuestDocument) {
  const a = document.createElement("a");
  a.href = doc.dataUrl;
  a.download = doc.fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

interface GuestDocumentsPanelProps {
  guestId?: string | null;
  /** Link new uploads to this reservation. */
  reservationId?: string | null;
  /** Default type label for new uploads (e.g. guest's ID proof type). */
  documentType?: string | null;
  allowUpload?: boolean;
  allowDelete?: boolean;
  /** Tighter layout for use inside forms and side cards. */
  compact?: boolean;
  emptyText?: string;
}

export function GuestDocumentsPanel({
  guestId,
  reservationId,
  documentType,
  allowUpload = false,
  allowDelete = false,
  compact = false,
  emptyText = "No documents uploaded yet.",
}: GuestDocumentsPanelProps) {
  const [docs, setDocs] = useState<GuestDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewableFile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!guestId) return [];
    const rows = await guestDocumentService.byGuest(guestId);
    return [...rows].sort((a, b) =>
      String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")),
    );
  }, [guestId]);

  const refresh = useCallback(async () => {
    try {
      setDocs(await load());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load documents");
    }
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      setLoading(true);
      load()
        .then((rows) => {
          if (!cancelled) {
            setDocs(rows);
            setError(null);
          }
        })
        .catch((e) => {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : "Failed to load documents");
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [load]);

  const handleFile = async (file: File) => {
    if (!guestId) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setError("File is too large. Maximum size is 5 MB.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      await guestDocumentService.create({
        guestId,
        reservationId: reservationId || undefined,
        documentType: documentType || undefined,
        fileName: file.name,
        mimeType: file.type || undefined,
        fileSize: file.size,
        dataUrl,
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (doc: GuestDocument) => {
    if (!window.confirm(`Delete ${doc.fileName}?`)) return;
    try {
      await guestDocumentService.remove(doc.id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className={cn("space-y-2", compact && "text-xs")}>
      {loading ? (
        <p className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading documents…
        </p>
      ) : docs.length === 0 ? (
        <p className="text-xs text-slate-400">{guestId ? emptyText : "No guest linked."}</p>
      ) : (
        <ul className="space-y-1.5">
          {docs.map((doc) => (
            <li
              key={doc.id}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white",
                compact ? "px-2.5 py-1.5" : "px-3 py-2.5",
              )}
            >
              <button
                type="button"
                onClick={() => setPreview(documentToPreview(doc))}
                className="flex min-w-0 items-center gap-2 text-left"
              >
                <FileText className="h-4 w-4 shrink-0 text-emerald-700" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-900 hover:text-emerald-700 hover:underline">
                    {doc.fileName}
                  </span>
                  <span className="block truncate text-[11px] text-slate-400">
                    {[
                      doc.documentType,
                      doc.fileSize ? formatAttachmentSize(doc.fileSize) : "",
                      formatUploadedAt(doc.createdAt),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
              </button>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  title="Preview"
                  onClick={() => setPreview(documentToPreview(doc))}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Download"
                  onClick={() => downloadDocument(doc)}
                  className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                {allowDelete && (
                  <button
                    type="button"
                    title="Delete"
                    onClick={() => void handleDelete(doc)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}

      {allowUpload && guestId && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={GUEST_DOCUMENT_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="gap-1.5"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {uploading ? "Uploading…" : "Upload Document"}
          </Button>
        </>
      )}

      <GuestDocumentPreviewModal file={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
