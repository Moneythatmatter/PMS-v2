"use client";

import React, { useState } from "react";
import { Modal } from "@/components/frontoffice/ui/Modal";
import { Button } from "@/components/ui/Button";
import { UploadCloud, FileSpreadsheet, Download, CheckCircle2 } from "lucide-react";

interface ProductImportModalProps {
  open: boolean;
  onClose: () => void;
  onImportComplete: (count: number) => void;
}

export function ProductImportModal({
  open,
  onClose,
  onImportComplete,
}: ProductImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!file) return;
    setIsUploading(true);

    setTimeout(() => {
      setIsUploading(false);
      const simulatedCount = Math.floor(Math.random() * 5) + 3;
      setSuccessCount(simulatedCount);
      onImportComplete(simulatedCount);
    }, 1000);
  };

  const handleReset = () => {
    setFile(null);
    setSuccessCount(null);
    onClose();
  };

  const downloadSampleTemplate = () => {
    const csvHeader = "Product Code,Product Name,Category,Unit,Preferred Supplier,Purchase Price,GST %,Min Stock,Max Stock,Par Stock\n";
    const sampleData = "PRD-SAM-001,Sample Bath Towel,Bath Linen,Pieces,Taj Quality Textiles,320,12,30,200,150\n";
    const blob = new Blob([csvHeader + sampleData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Product_Master_Import_Template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      open={open}
      onClose={handleReset}
      title="Import Products via CSV"
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={downloadSampleTemplate}
            className="text-slate-600 gap-1"
          >
            <Download className="h-3.5 w-3.5" />
            Download Sample CSV
          </Button>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleReset}>
              Cancel
            </Button>
            {successCount === null && (
              <Button
                type="button"
                size="sm"
                disabled={!file || isUploading}
                onClick={handleImport}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
              >
                {isUploading ? "Uploading..." : "Import Products"}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 py-2">
        {successCount !== null ? (
          <div className="flex flex-col items-center justify-center text-center py-6 space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Import Successful</h4>
            <p className="text-xs text-slate-500 max-w-xs">
              Successfully imported <strong className="text-slate-900">{successCount} new products</strong> into Product Master.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-600">
              Upload a bulk CSV file containing product information according to the standard ERP template format.
            </p>

            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 text-center hover:bg-slate-50 transition-colors">
              <UploadCloud className="h-8 w-8 text-slate-400 mb-2" />
              <p className="text-xs font-semibold text-slate-700">
                Drag and drop your CSV file here, or click to browse
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Supports CSV file format up to 5MB</p>

              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-file-input"
              />
              <label
                htmlFor="csv-file-input"
                className="mt-3 cursor-pointer rounded-xl bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs hover:bg-slate-100 transition-colors"
              >
                Choose File
              </label>

              {file && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 border border-emerald-200">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>{file.name}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
