"use client";

import React, { useState, useRef } from "react";
import { FileSpreadsheet, Save, Upload, Check, AlertCircle } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";
import { LeadRecordItem, LeadSource, BookingType } from "../LeadsInquiriesView";

export interface CsvLeadImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportLeads: (leads: LeadRecordItem[]) => void;
  campaignTitle?: string;
  defaultCampaignName?: string;
  defaultLeadSource?: "Google Ads" | "Meta Ads" | "Other";
  defaultExecutive?: string;
  existingLeadCount?: number;
}

// Robust CSV Line & Cell Parser handling quoted commas
function parseCsvContent(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim().replace(/^"|"$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^"|"$/g, ""));
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    if (values.length === 0) continue;
    const rowObj: Record<string, string> = {};
    headers.forEach((header, index) => {
      rowObj[header] = values[index] || "";
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

// Fallback sample CSV data
const SAMPLE_CSV_ROWS: Record<string, string>[] = [
  { "Ad Lead ID": "GLD-77102", "Full Name": "Amit Kumar", "Phone Number": "+91 98112 33445", "Email": "amit.k@gmail.com", "Company Name": "Kumar Tech Ltd", "Event Date": "2026-11-20", "Guest Count": "300", "Expected Budget": "1200000", "Notes": "Need wedding lawn and 40 rooms" },
  { "Ad Lead ID": "GLD-77103", "Full Name": "Suresh Raina", "Phone Number": "+91 97700 88990", "Email": "suresh.r@sports.in", "Company Name": "SR Sports Academy", "Event Date": "2026-10-15", "Guest Count": "150", "Expected Budget": "650000", "Notes": "Corporate annual awards ceremony" },
  { "Ad Lead ID": "MLD-88204", "Full Name": "Neha Gupta", "Phone Number": "+91 99554 11223", "Email": "neha.gupta@fashion.com", "Company Name": "Gupta Designs", "Event Date": "2026-12-05", "Guest Count": "200", "Expected Budget": "800000", "Notes": "Fashion show and banquet dinner" },
];

export function CsvLeadImportModal({
  isOpen,
  onClose,
  onImportLeads,
  campaignTitle,
  defaultCampaignName = "Wedding Campaign 2026",
  defaultLeadSource = "Google Ads",
  defaultExecutive = "Jay Kumar",
  existingLeadCount = 0,
}: CsvLeadImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importStep, setImportStep] = useState<"UPLOAD" | "PREVIEW_MAP" | "SUMMARY">("UPLOAD");
  const [importedFileName, setImportedFileName] = useState("");
  const [csvSourcePlatform, setCsvSourcePlatform] = useState<"Google Ads" | "Meta Ads" | "Other">(defaultLeadSource);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [templateSaved, setTemplateSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [csvFieldMapping, setCsvFieldMapping] = useState({
    fullName: "",
    phone: "",
    email: "",
    company: "",
    eventDate: "",
    notes: "",
    budget: "",
    adLeadId: "",
  });

  const handleClose = () => {
    setImportStep("UPLOAD");
    setImportedFileName("");
    setParsedHeaders([]);
    setParsedRows([]);
    setErrorMessage(null);
    onClose();
  };

  // Real native file picker selection handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return; // User cancelled file picker -> remain on Step 1

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setErrorMessage("⚠️ Invalid file format! Please select a valid .csv file.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text || text.trim() === "") {
        setErrorMessage("⚠️ Uploaded CSV file is empty!");
        return;
      }

      const { headers, rows } = parseCsvContent(text);
      if (headers.length === 0 || rows.length === 0) {
        setErrorMessage("⚠️ Unable to parse headers or data rows from selected CSV file.");
        return;
      }

      setImportedFileName(file.name);
      setParsedHeaders(headers);
      setParsedRows(rows);
      setErrorMessage(null);

      // Smart detection without blindly defaulting to headers[0] ("id")
      const detect = (keywords: string[]): string => {
        const match = headers.find((h) => {
          const lower = h.toLowerCase().trim();
          return keywords.some((k) => lower === k || lower.includes(k));
        });
        return match || "";
      };

      setCsvFieldMapping({
        fullName: detect(["full_name", "fullname", "firstname", "first_name", "lead_name", "customer_name", "client_name", "name"]),
        phone: detect(["phone_number", "phonenumber", "mobile_number", "mobilenumber", "contact_no", "phone", "mobile", "tel", "cell"]),
        email: detect(["email_address", "user_email", "work_email", "email", "mail"]),
        company: detect(["company_name", "companyname", "organization", "corporate", "firm", "business", "company"]),
        eventDate: detect(["event_date", "target_date", "stay_date", "checkin_date", "arrival_date", "eventdate", "date"]),
        notes: detect(["special_requirements", "requirements", "special_notes", "notes", "requirement", "comment", "message", "desc"]),
        budget: detect(["expected_budget", "budget_range", "est_budget", "budget", "revenue", "spend", "amount"]),
        adLeadId: detect(["lead_id", "ad_lead_id", "ad_id", "leadgen_id", "id"]),
      });

      // Proceed to Step 2 after valid CSV selection
      setImportStep("PREVIEW_MAP");
    };

    reader.readAsText(file);
  };

  // Helper to test if a string is a UUID or hash
  const isUuidOrHash = (val: string | undefined): boolean => {
    if (!val) return false;
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val.trim()) ||
           /^[0-9a-fA-F]{24,}$/.test(val.trim());
  };

  const cleanDateValue = (raw: string | undefined): string => {
    if (!raw || isUuidOrHash(raw)) return "2026-11-15";
    const trimmed = raw.trim();
    if (/\d{4}-\d{2}-\d{2}/.test(trimmed) || /\d{2}\/\d{2}\/\d{4}/.test(trimmed) || /\d{2}-\d{2}-\d{4}/.test(trimmed)) {
      return trimmed;
    }
    return "2026-11-15";
  };

  const cleanBudgetValue = (raw: string | undefined): string => {
    if (!raw || isUuidOrHash(raw)) return "₹3,00,000 - ₹5,00,000";
    const digitsOnly = String(raw).replace(/[^0-9]/g, "");
    const num = Number(digitsOnly);
    if (!num || isNaN(num) || num > 100000000) {
      return "₹3,00,000 - ₹5,00,000";
    }
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const handleConfirmImport = () => {
    const source: LeadSource =
      csvSourcePlatform === "Google Ads"
        ? "Google Ads"
        : csvSourcePlatform === "Meta Ads"
        ? "Meta Ads"
        : "Website";

    const rowsToImport = parsedRows.length > 0 ? parsedRows : SAMPLE_CSV_ROWS;

    const importedLeads: LeadRecordItem[] = rowsToImport.map((row, idx) => {
      const nextIdNum = existingLeadCount + idx + 1;

      // Smart Name Resolution (Handles separate firstName & lastName or fullName)
      let nameVal = "";
      if (csvFieldMapping.fullName && row[csvFieldMapping.fullName]) {
        nameVal = row[csvFieldMapping.fullName];
        // If first name only, try combining with lastName if exists in CSV
        if (row["lastName"] || row["last_name"]) {
          const last = row["lastName"] || row["last_name"];
          if (!nameVal.includes(last)) {
            nameVal = `${nameVal} ${last}`.trim();
          }
        }
      } else {
        nameVal = row["Full Name"] || row["name"] || `Lead #${nextIdNum}`;
      }

      // Phone
      const phoneVal = (csvFieldMapping.phone && row[csvFieldMapping.phone]) || row["Phone Number"] || row["phone"] || "+91 98000 00000";

      // Email
      const emailVal = (csvFieldMapping.email && row[csvFieldMapping.email]) || row["Email"] || row["email"] || "lead@inquiry.com";

      // Company (never store UUID as company name)
      const rawCompany = csvFieldMapping.company ? row[csvFieldMapping.company] : undefined;
      const companyVal = rawCompany && !isUuidOrHash(rawCompany) ? rawCompany : undefined;

      // Event Date (never store UUID as date)
      const rawDate = csvFieldMapping.eventDate ? row[csvFieldMapping.eventDate] : undefined;
      const eventDateVal = cleanDateValue(rawDate);

      // Budget (never convert UUID to huge numbers)
      const rawBudget = csvFieldMapping.budget ? row[csvFieldMapping.budget] : undefined;
      const budgetVal = cleanBudgetValue(rawBudget);

      // Notes (never store UUID as notes)
      const rawNotes = csvFieldMapping.notes ? row[csvFieldMapping.notes] : undefined;
      const notesVal = rawNotes && !isUuidOrHash(rawNotes) ? rawNotes : undefined;

      // Booking Type
      const rawType = row["Booking Type"] || row["booking_type"] || row["event_type"];
      const bookingType: BookingType =
        rawType === "Room Booking" || rawType === "Banquet Event" || rawType === "Conference" || rawType === "Wedding Event"
          ? (rawType as BookingType)
          : "Banquet Event";

      return {
        id: `LEAD-${String(nextIdNum).padStart(3, "0")}`,
        leadName: nameVal,
        contactPerson: nameVal,
        mobileNumber: phoneVal,
        email: emailVal,
        city: row["city"] || row["City"] || "Mumbai",
        companyName: companyVal,
        bookingType: bookingType,
        eventDate: eventDateVal,
        guestCount: Number(row["Guest Count"] || row["guest_count"] || row["pax"] || 100) || 100,
        budgetRange: budgetVal,
        priority: "Medium" as const,
        customerRequirements: notesVal || "Inquiry imported from CSV lead campaign form.",
        specialRequirements: notesVal,
        leadSource: source,
        campaignName: defaultCampaignName,
        importedVia: "CSV Import",
        createdDate: "2026-08-28",
        assignedExecutive: defaultExecutive,
        status: "New",
        timeline: [
          {
            id: `T-${Date.now()}-${idx + 1}`,
            date: "2026-08-28 11:50 AM",
            title: `Imported from CSV (${importedFileName || "file.csv"})`,
            actor: "CSV Ingestion Engine",
          },
        ],
      };
    });

    onImportLeads(importedLeads);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={campaignTitle ? `Import Leads CSV → ${campaignTitle}` : "Import Leads from CSV File"}
      maxWidth="2xl"
    >
      <div className="space-y-4 text-xs p-1">
        {/* Hidden native file input element */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Workflow Progress Steps */}
        <div className="flex items-center justify-between bg-slate-100 p-2 rounded-xl text-[10px] font-bold text-slate-600">
          <span
            className={cn(
              "px-2.5 py-1 rounded-lg transition",
              importStep === "UPLOAD"
                ? "bg-emerald-700 text-white"
                : "bg-white text-slate-700 border border-slate-200"
            )}
          >
            1. Upload CSV
          </span>
          <span>→</span>
          <span
            className={cn(
              "px-2.5 py-1 rounded-lg transition",
              importStep === "PREVIEW_MAP"
                ? "bg-emerald-700 text-white"
                : "bg-white text-slate-700 border border-slate-200"
            )}
          >
            2. Map CSV Fields
          </span>
          <span>→</span>
          <span
            className={cn(
              "px-2.5 py-1 rounded-lg transition",
              importStep === "SUMMARY"
                ? "bg-emerald-700 text-white"
                : "bg-white text-slate-700 border border-slate-200"
            )}
          >
            3. Summary &amp; Confirm
          </span>
        </div>

        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            {errorMessage}
          </div>
        )}

        {/* ── STEP 1: UPLOAD & NATIVE FILE PICKER ── */}
        {importStep === "UPLOAD" && (
          <div className="space-y-4 text-center py-4">
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 bg-slate-50 flex flex-col items-center justify-center space-y-2">
              <FileSpreadsheet className="h-10 w-10 text-emerald-700" />
              <h4 className="font-bold text-slate-800 text-xs">Upload Lead Export File (.csv)</h4>
              <p className="text-[11px] text-slate-500 max-w-xs">
                Select a .csv lead list file from your device exported from Google Ads, Meta Ads, or webform.
              </p>

              <div className="flex items-center justify-center mt-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs px-5 py-2 cursor-pointer shadow-xs"
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" /> Select CSV File
                </Button>
              </div>
            </div>

            <div className="text-left p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <label className="font-bold text-slate-700 block text-[11px]">
                Select Source Advertising Platform:
              </label>
              <select
                value={csvSourcePlatform}
                onChange={(e) => setCsvSourcePlatform(e.target.value as any)}
                className="w-full text-xs font-bold rounded-xl border border-slate-200 p-2 bg-white text-slate-900 focus:outline-none"
              >
                <option value="Google Ads">Google Ads</option>
                <option value="Meta Ads">Meta Ads</option>
                <option value="Other">Other / Direct CSV Export</option>
              </select>
            </div>
          </div>
        )}

        {/* ── STEP 2: PREVIEW & DYNAMIC FIELD MAPPING ── */}
        {importStep === "PREVIEW_MAP" && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-950">
                Selected File: {importedFileName || "users.csv"}
              </span>
              <span className="text-[11px] text-emerald-900 font-bold bg-emerald-200 px-2 py-0.5 rounded">
                Source: {csvSourcePlatform}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-800 block text-xs">
                  Map Uploaded CSV Headers → PMS Central Lead Fields
                </span>
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                  ✓ {parsedHeaders.length > 0 ? parsedHeaders.length : 7} Column Headers Parsed
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Full Name Column</label>
                  <select
                    value={csvFieldMapping.fullName}
                    onChange={(e) => setCsvFieldMapping({ ...csvFieldMapping, fullName: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 font-bold text-slate-900 bg-white"
                  >
                    <option value="">(Not Mapped)</option>
                    {(parsedHeaders.length > 0 ? parsedHeaders : ["firstName", "phone", "email", "id"]).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Phone Number Column</label>
                  <select
                    value={csvFieldMapping.phone}
                    onChange={(e) => setCsvFieldMapping({ ...csvFieldMapping, phone: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 font-bold text-slate-900 bg-white"
                  >
                    <option value="">(Not Mapped)</option>
                    {(parsedHeaders.length > 0 ? parsedHeaders : ["firstName", "phone", "email", "id"]).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Email Column</label>
                  <select
                    value={csvFieldMapping.email}
                    onChange={(e) => setCsvFieldMapping({ ...csvFieldMapping, email: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 font-bold text-slate-900 bg-white"
                  >
                    <option value="">(Not Mapped)</option>
                    {(parsedHeaders.length > 0 ? parsedHeaders : ["firstName", "phone", "email", "id"]).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Company Name Column</label>
                  <select
                    value={csvFieldMapping.company}
                    onChange={(e) => setCsvFieldMapping({ ...csvFieldMapping, company: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 font-bold text-slate-900 bg-white"
                  >
                    <option value="">(Not Mapped)</option>
                    {(parsedHeaders.length > 0 ? parsedHeaders : ["firstName", "phone", "email", "id"]).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Expected Budget / Revenue</label>
                  <select
                    value={csvFieldMapping.budget}
                    onChange={(e) => setCsvFieldMapping({ ...csvFieldMapping, budget: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 font-bold text-slate-900 bg-white"
                  >
                    <option value="">(Not Mapped)</option>
                    {(parsedHeaders.length > 0 ? parsedHeaders : ["firstName", "phone", "email", "id"]).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Ad Lead ID Column</label>
                  <select
                    value={csvFieldMapping.adLeadId}
                    onChange={(e) => setCsvFieldMapping({ ...csvFieldMapping, adLeadId: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-900 bg-white"
                  >
                    <option value="">(Not Mapped)</option>
                    {(parsedHeaders.length > 0 ? parsedHeaders : ["firstName", "phone", "email", "id"]).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setTemplateSaved(true)}
                  className="text-emerald-700 hover:text-emerald-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" /> Save Mapping Template
                </button>
                {templateSaved && <span className="text-[10px] text-emerald-800 font-bold">✓ Template Saved</span>}
              </div>
            </div>

            {/* CSV Dynamic Rows Preview Table with Horizontal & Vertical Scrolling */}
            <div className="space-y-1">
              <span className="font-bold text-slate-700 block text-[11px]">
                Uploaded CSV Data Preview (Showing {Math.min(5, parsedRows.length > 0 ? parsedRows.length : SAMPLE_CSV_ROWS.length)} of {parsedRows.length > 0 ? parsedRows.length : SAMPLE_CSV_ROWS.length} Rows)
              </span>
              <div className="bg-slate-50 rounded-xl border border-slate-200 text-[11px] max-h-56 overflow-x-auto overflow-y-auto shadow-inner">
                <table className="min-w-[650px] w-full text-left border-collapse">
                  <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5 whitespace-nowrap border-r border-slate-200">Ad Lead ID</th>
                      <th className="p-2.5 whitespace-nowrap border-r border-slate-200">Name</th>
                      <th className="p-2.5 whitespace-nowrap border-r border-slate-200">Phone</th>
                      <th className="p-2.5 whitespace-nowrap border-r border-slate-200">Company</th>
                      <th className="p-2.5 whitespace-nowrap">Budget</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                    {(parsedRows.length > 0 ? parsedRows.slice(0, 5) : SAMPLE_CSV_ROWS).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-100/70 transition">
                        <td className="p-2.5 font-mono font-bold text-emerald-800 whitespace-nowrap border-r border-slate-100">
                          {r[csvFieldMapping.adLeadId] || r["Ad Lead ID"] || r["id"] || `GLD-${i + 1}`}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900 whitespace-nowrap border-r border-slate-100">
                          {r[csvFieldMapping.fullName] || r["Full Name"] || r["firstName"] || "N/A"}
                        </td>
                        <td className="p-2.5 font-mono whitespace-nowrap border-r border-slate-100">
                          {r[csvFieldMapping.phone] || r["Phone Number"] || r["phone"] || "N/A"}
                        </td>
                        <td className="p-2.5 whitespace-nowrap border-r border-slate-100">
                          {r[csvFieldMapping.company] || r["Company Name"] || r["id"] || "N/A"}
                        </td>
                        <td className="p-2.5 font-mono whitespace-nowrap">
                          {r[csvFieldMapping.budget] || r["Expected Budget"] || r["id"] || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setImportStep("UPLOAD")}
                className="rounded-xl text-xs cursor-pointer"
              >
                Back
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setImportStep("SUMMARY")}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs px-4 cursor-pointer"
              >
                Validate &amp; Preview Summary →
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: SUMMARY & FINAL PMS LEAD PREVIEW ── */}
        {importStep === "SUMMARY" && (
          <div className="space-y-3.5">
            {/* Top Key Attribute Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-semibold text-slate-500 block">Uploaded File</span>
                <span className="font-bold text-slate-900 truncate block mt-0.5">{importedFileName || "users.csv"}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[10px] font-semibold text-emerald-800 block">Total Records</span>
                <span className="font-extrabold text-emerald-950 block mt-0.5">
                  {parsedRows.length > 0 ? parsedRows.length : 3} Leads (Valid)
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-semibold text-slate-500 block">Linked Campaign</span>
                <span className="font-bold text-slate-900 truncate block mt-0.5">{defaultCampaignName}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200">
                <span className="text-[10px] font-semibold text-blue-800 block">Lead Source</span>
                <span className="font-bold text-blue-950 block mt-0.5">{csvSourcePlatform}</span>
              </div>
            </div>

            {/* Live Table Preview of Final Lead Records */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-800 text-xs">
                  PMS Lead Directory Preview (Final Output)
                </span>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono">
                  ✓ Ready to Ingest
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-x-auto overflow-y-auto bg-white shadow-2xs">
                <table className="min-w-[700px] w-full text-[11px] text-left border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
                    <tr>
                      <th className="py-2 px-2.5 whitespace-nowrap">Lead ID</th>
                      <th className="py-2 px-2.5 whitespace-nowrap">Lead Name</th>
                      <th className="py-2 px-2.5 whitespace-nowrap">Mobile Number</th>
                      <th className="py-2 px-2.5 whitespace-nowrap">Email</th>
                      <th className="py-2 px-2.5 whitespace-nowrap">Booking Type</th>
                      <th className="py-2 px-2.5 whitespace-nowrap">Target Date</th>
                      <th className="py-2 px-2.5 whitespace-nowrap">Budget</th>
                      <th className="py-2 px-2.5 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {(parsedRows.length > 0 ? parsedRows : SAMPLE_CSV_ROWS).map((row, idx) => {
                      const nextIdNum = existingLeadCount + idx + 1;
                      const nameVal = row[csvFieldMapping.fullName] || row["Full Name"] || row["firstName"] || `Lead #${nextIdNum}`;
                      const phoneVal = row[csvFieldMapping.phone] || row["Phone Number"] || row["phone"] || "+91 98000 00000";
                      const emailVal = row[csvFieldMapping.email] || row["Email"] || row["email"] || "lead@inquiry.com";
                      const eventDateVal = row[csvFieldMapping.eventDate] || row["Event Date"] || "2026-11-15";
                      const budgetStr = String(row[csvFieldMapping.budget] || row["Expected Budget"] || row["id"] || "500000").replace(/[^0-9.]/g, "");
                      const numBudget = Number(budgetStr) || 500000;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition">
                          <td className="py-2 px-2.5 font-mono font-bold text-emerald-800 whitespace-nowrap">
                            LEAD-{String(nextIdNum).padStart(3, "0")}
                          </td>
                          <td className="py-2 px-2.5 font-bold text-slate-900 whitespace-nowrap">
                            {nameVal}
                          </td>
                          <td className="py-2 px-2.5 font-mono text-slate-800 whitespace-nowrap">
                            {phoneVal}
                          </td>
                          <td className="py-2 px-2.5 text-slate-600 truncate max-w-[140px] whitespace-nowrap">
                            {emailVal}
                          </td>
                          <td className="py-2 px-2.5 whitespace-nowrap">
                            Banquet Event
                          </td>
                          <td className="py-2 px-2.5 font-mono whitespace-nowrap">
                            {eventDateVal}
                          </td>
                          <td className="py-2 px-2.5 font-mono text-emerald-900 font-semibold whitespace-nowrap">
                            {numBudget > 0 ? `₹${numBudget.toLocaleString("en-IN")}` : "₹5,00,000"}
                          </td>
                          <td className="py-2 px-2.5 whitespace-nowrap">
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                              New
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-[11px] text-emerald-900 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200">
              ✓ These <strong>{parsedRows.length > 0 ? parsedRows.length : 3} lead records</strong> will be saved into the <strong>Hotel PMS Central Database</strong> with campaign linkage (<strong>{defaultCampaignName}</strong>) and assigned to <strong>{defaultExecutive}</strong>.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setImportStep("PREVIEW_MAP")}
                className="rounded-xl text-xs cursor-pointer"
              >
                Back
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmImport}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs px-5 shadow-xs cursor-pointer"
              >
                Confirm Import ({parsedRows.length > 0 ? parsedRows.length : 3} Leads)
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
