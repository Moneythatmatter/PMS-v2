"use client";

import React, { useRef } from "react";
import { Paperclip, Trash2, Eye, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface AttachmentItem {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
}

export interface PurchaseAttachmentListProps {
  attachments: AttachmentItem[];
  onAddAttachment?: (file: AttachmentItem) => void;
  onRemoveAttachment?: (id: string) => void;
}

export function PurchaseAttachmentList({
  attachments,
  onAddAttachment,
  onRemoveAttachment,
}: PurchaseAttachmentListProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newAtt: AttachmentItem = {
        id: `att-${Date.now()}`,
        fileName: file.name,
        fileSize: `${Math.round(file.size / 1024)} KB`,
        fileType: file.name.split(".").pop() || "doc",
      };
      if (onAddAttachment) onAddAttachment(newAtt);
    }
  };

  return (
    <div className="space-y-3">
      <input
        type="file"
        ref={fileInputRef}
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
                  onClick={() => onRemoveAttachment(att.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Remove Attachment"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}

        {onAddAttachment && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/30 flex items-center justify-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-800 transition-all cursor-pointer min-h-[50px]"
          >
            <Plus className="h-4 w-4" /> Upload Document / Receipt
          </button>
        )}
      </div>
    </div>
  );
}
