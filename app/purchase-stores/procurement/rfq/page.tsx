"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Download,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  XCircle,
  Paperclip,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Send,
  Star,
  Check,
  ShoppingCart,
  Award,
  Bell,
  CheckCircle,
  Loader2,
  FileCheck,
  Mail,
  Phone,
  Building2,
  User,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { Modal } from "@/components/frontoffice/ui/Modal";
import {
  TextInput,
  SelectInput,
  FormField,
  TextAreaInput,
  FOPageHeader,
  StatMiniCard,
} from "@/components/frontoffice/ui";
import { OperationsToolbar, OperationsFilterDrawer } from "@/components/housekeeping/OperationsToolbar";
import { ModuleSelectionBar } from "@/components/pms/ModuleSelectionBar";
import type { ModuleSelectionAction } from "@/components/pms/ModuleSelectionBar";
import {
  INITIAL_RFQ_RECORDS,
  MASTER_VENDOR_OPTIONS,
  RFQRecord,
  RFQVendorItem,
  RFQRequestedItem,
  RFQAttachment,
  VendorQuotationComparison,
} from "@/app/data/rfqData";

export default function RequestForQuotationsPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Native File Input Reference for Attachments
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading Simulation State
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Main RFQ Dataset State (Strictly 3 Initial Records)
  const [rfqList, setRfqList] = useState<RFQRecord[]>(INITIAL_RFQ_RECORDS);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [buyerFilter, setBuyerFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [closingDateFilter, setClosingDateFilter] = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination State
  const [rowsPerPage, setRowsPerPage] = useState("10");

  // Drawer & Modal States
  const [selectedRFQ, setSelectedRFQ] = useState<RFQRecord | null>(null);
  const [editRFQ, setEditRFQ] = useState<RFQRecord | null>(null);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [compareModalRFQ, setCompareModalRFQ] = useState<RFQRecord | null>(null);
  const [selectVendorModalRFQ, setSelectVendorModalRFQ] = useState<RFQRecord | null>(null);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);

  // PO Creation & Viewing States
  const [convertPOModalRFQ, setConvertPOModalRFQ] = useState<RFQRecord | null>(null);
  const [isConvertingPO, setIsConvertingPO] = useState(false);
  const [viewPODrawerRFQ, setViewPODrawerRFQ] = useState<RFQRecord | null>(null);

  // Vendor Selection Modal Temporary Selection State
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>(["v1", "v2", "v3"]);

  // Form State for Create/Edit RFQ
  const [formPR, setFormPR] = useState("PR-2026-001");
  const [formBuyer, setFormBuyer] = useState("Purchase Executive");
  const [formRFQDate, setFormRFQDate] = useState("2026-07-18");
  const [formClosingDate, setFormClosingDate] = useState("2026-07-25");
  const [formPriority, setFormPriority] = useState<RFQRecord["priority"]>("High");
  const [formRemarks, setFormRemarks] = useState("Samples required prior to dispatch.");

  // Form Vendors & Requested Items State
  const [formVendors, setFormVendors] = useState<RFQVendorItem[]>([
    { id: "v1", vendorName: "ABC Linen Pvt Ltd", email: "sales@abclinen.com", phone: "+91 98765 43210", invitationSentOn: "18 Jul 2026", status: "Pending" },
    { id: "v2", vendorName: "XYZ Textiles", email: "info@xyztextiles.in", phone: "+91 98123 45678", invitationSentOn: "18 Jul 2026", status: "Pending" },
  ]);

  const [formRequestedItems, setFormRequestedItems] = useState<RFQRequestedItem[]>([
    { id: "i1", item: "Bedsheet (King Size 300TC)", category: "Linen", quantity: 200, unit: "Pieces", estimatedRate: 340 },
    { id: "i2", item: "Pillow Cover (Satin Finish)", category: "Linen", quantity: 150, unit: "Pieces", estimatedRate: 90 },
  ]);

  // Form Commercial Terms State
  const [formDeliveryLoc, setFormDeliveryLoc] = useState("Central Stores Warehouse");
  const [formDeliveryAddr, setFormDeliveryAddr] = useState("Dock 2, Hotel Grand Plaza, MG Road, New Delhi");
  const [formPayTerms, setFormPayTerms] = useState("Net 30 Days post GRN & Invoice 3-way match");
  const [formCurrency, setFormCurrency] = useState("INR (₹)");
  const [formExpDelivery, setFormExpDelivery] = useState("7 Days from PO issuance");
  const [formTax, setFormTax] = useState("18% GST extra as applicable");

  // Form Attachments State
  const [formAttachments, setFormAttachments] = useState<RFQAttachment[]>([
    { id: "a1", fileName: "Linen_Specification.pdf", fileSize: "245 KB", fileType: "pdf" },
    { id: "a2", fileName: "RFQ_Terms.pdf", fileSize: "120 KB", fileType: "pdf" },
  ]);

  // Vendor Selection Reason State
  const [vendorSelectReason, setVendorSelectReason] = useState(
    "Lowest evaluated cost with acceptable delivery lead time and 12M warranty."
  );

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; variant: "success" | "info" } | null>(null);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Sync Form State when PR Selection changes in Drawer
  const handlePRSelectionChange = (prNum: string) => {
    setFormPR(prNum);
    if (prNum === "PR-2026-001") {
      setFormRequestedItems([
        { id: "i1", item: "Bedsheet (King Size 300TC)", category: "Linen", quantity: 200, unit: "Pieces", estimatedRate: 340 },
        { id: "i2", item: "Pillow Cover (Satin Finish)", category: "Linen", quantity: 150, unit: "Pieces", estimatedRate: 90 },
      ]);
    } else if (prNum === "PR-2026-002") {
      setFormRequestedItems([
        { id: "i3", item: "Commercial Air Filters (HEPA)", category: "HVAC", quantity: 20, unit: "Units", estimatedRate: 1500 },
        { id: "i4", item: "Refrigerant Gas R410A", category: "Chemicals", quantity: 3, unit: "Canisters", estimatedRate: 4000 },
      ]);
    } else {
      setFormRequestedItems([
        { id: "i5", item: "Fresh Black Truffle Oil (500ml)", category: "Gourmet", quantity: 2, unit: "Bottles", estimatedRate: 3100 },
        { id: "i6", item: "Saffron Threads (50g)", category: "Spices", quantity: 1, unit: "Pack", estimatedRate: 2500 },
      ]);
    }
  };

  // Sync Form State when Edit RFQ opens
  useEffect(() => {
    if (editRFQ) {
      setFormPR(editRFQ.linkedPR);
      setFormBuyer(editRFQ.buyer);
      setFormRFQDate(editRFQ.rfqDate);
      setFormClosingDate(editRFQ.closingDate);
      setFormPriority(editRFQ.priority);
      setFormVendors(editRFQ.invitedVendors);
      setFormRequestedItems(editRFQ.requestedItems);
      setFormDeliveryLoc(editRFQ.commercialTerms.deliveryLocation);
      setFormDeliveryAddr(editRFQ.commercialTerms.deliveryAddress || "Dock 2, Hotel Grand Plaza");
      setFormPayTerms(editRFQ.commercialTerms.paymentTerms);
      setFormCurrency(editRFQ.commercialTerms.currency);
      setFormExpDelivery(editRFQ.commercialTerms.expectedDelivery);
      setFormTax(editRFQ.commercialTerms.tax);
      setFormRemarks(editRFQ.commercialTerms.remarks);
      setFormAttachments(editRFQ.attachments);
    }
  }, [editRFQ]);

  // Dynamic 6 KPI Cards Metrics
  const metrics = useMemo(() => {
    const total = rfqList.length;
    const draft = rfqList.filter((r) => r.status === "Draft").length;
    const sent = rfqList.filter((r) => r.status === "Sent").length;
    const pendingResponse = rfqList.filter((r) => r.status === "Pending Response" || r.status === "Sent").length;
    const vendorSelected = rfqList.filter((r) => r.status === "Vendor Selected").length;
    const closed = rfqList.filter((r) => r.status === "Closed").length;

    return { total, draft, sent, pendingResponse, vendorSelected, closed };
  }, [rfqList]);

  // Filter Active Count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (departmentFilter !== "all") count++;
    if (statusFilter !== "all") count++;
    if (priorityFilter !== "all") count++;
    if (buyerFilter !== "all") count++;
    if (vendorFilter !== "all") count++;
    if (closingDateFilter !== "") count++;
    return count;
  }, [departmentFilter, statusFilter, priorityFilter, buyerFilter, vendorFilter, closingDateFilter]);

  // Filtered RFQ Records
  const filteredRFQs = useMemo(() => {
    return rfqList.filter((rfq) => {
      const matchSearch =
        rfq.rfqNumber.toLowerCase().includes(search.toLowerCase()) ||
        rfq.linkedPR.toLowerCase().includes(search.toLowerCase()) ||
        rfq.department.toLowerCase().includes(search.toLowerCase()) ||
        rfq.buyer.toLowerCase().includes(search.toLowerCase()) ||
        (rfq.selectedVendor && rfq.selectedVendor.toLowerCase().includes(search.toLowerCase())) ||
        rfq.invitedVendors.some((v) => v.vendorName.toLowerCase().includes(search.toLowerCase()));

      const matchDept =
        departmentFilter === "all" || rfq.department.toLowerCase() === departmentFilter.toLowerCase();

      const matchStatus =
        statusFilter === "all" || rfq.status.toLowerCase() === statusFilter.toLowerCase();

      const matchPriority =
        priorityFilter === "all" || rfq.priority.toLowerCase() === priorityFilter.toLowerCase();

      const matchBuyer =
        buyerFilter === "all" || rfq.buyer.toLowerCase().includes(buyerFilter.toLowerCase());

      const matchVendor =
        vendorFilter === "all" || rfq.invitedVendors.some((v) => v.vendorName.toLowerCase().includes(vendorFilter.toLowerCase()));

      return matchSearch && matchDept && matchStatus && matchPriority && matchBuyer && matchVendor;
    });
  }, [rfqList, search, departmentFilter, statusFilter, priorityFilter, buyerFilter, vendorFilter]);

  // Status Badge Helper
  const renderStatusBadge = (status: RFQRecord["status"]) => {
    switch (status) {
      case "Converted to PO":
        return (
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 min-w-[115px] text-center text-[9px] font-extrabold uppercase rounded-full bg-teal-50 text-teal-800 border border-teal-200">
            Converted to PO
          </span>
        );
      case "Vendor Selected":
        return (
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 min-w-[115px] text-center text-[9px] font-extrabold uppercase rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            Vendor Selected
          </span>
        );
      case "Sent":
        return (
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 min-w-[115px] text-center text-[9px] font-extrabold uppercase rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            Sent
          </span>
        );
      case "Pending Response":
        return (
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 min-w-[115px] text-center text-[9px] font-extrabold uppercase rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Pending Response
          </span>
        );
      case "Closed":
        return (
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 min-w-[115px] text-center text-[9px] font-extrabold uppercase rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Closed
          </span>
        );
      case "Cancelled":
        return (
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 min-w-[115px] text-center text-[9px] font-extrabold uppercase rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 min-w-[115px] text-center text-[9px] font-extrabold uppercase rounded-full bg-slate-50 text-slate-700 border border-slate-200">
            Draft
          </span>
        );
    }
  };

  // Vendor Confirmation Handler
  const handleConfirmVendorSelection = () => {
    if (!selectVendorModalRFQ) return;

    setRfqList((prev) =>
      prev.map((r) => {
        if (r.id === selectVendorModalRFQ.id) {
          return {
            ...r,
            status: "Vendor Selected",
            selectedVendor: "ABC Linen Pvt Ltd",
          };
        }
        return r;
      })
    );

    setToast({
      message: "Vendor Selected Successfully",
      variant: "success",
    });
    setSelectVendorModalRFQ(null);
  };

  // EXECUTE SIMULATED CREATE PURCHASE ORDER WORKFLOW (1 SEC LOADING STATE)
  const handleExecuteCreatePO = () => {
    if (!convertPOModalRFQ) return;

    setIsConvertingPO(true);

    setTimeout(() => {
      const generatedPO = `PO-2026-015`;

      setRfqList((prev) =>
        prev.map((r) => {
          if (r.id === convertPOModalRFQ.id) {
            const updatedTimeline = r.activityTimeline.map((item) =>
              item.stage === "Converted to Purchase Order"
                ? { ...item, timestamp: "Today", note: `Converted to ${generatedPO}`, author: "Purchase Manager" }
                : item
            );
            return {
              ...r,
              status: "Converted to PO",
              poNumber: generatedPO,
              activityTimeline: updatedTimeline,
            };
          }
          return r;
        })
      );

      setIsConvertingPO(false);
      setConvertPOModalRFQ(null);
      setToast({
        message: `✅ Purchase Order ${generatedPO} created successfully.`,
        variant: "success",
      });
    }, 1000);
  };

  // Direct Send RFQ from Draft Row
  const handleSendRFQDirect = (rfq: RFQRecord) => {
    setRfqList((prev) =>
      prev.map((r) => (r.id === rfq.id ? { ...r, status: "Sent" } : r))
    );
    setToast({ message: "RFQ Sent Successfully", variant: "success" });
  };

  // Send Reminder Handler
  const handleSendReminder = (rfq: RFQRecord) => {
    setToast({ message: `Reminder sent to ${rfq.invitedVendors.length} invited vendors.`, variant: "info" });
  };

  // Cancel RFQ Handler
  const handleCancelRFQ = (rfq: RFQRecord) => {
    setRfqList((prev) =>
      prev.map((r) => (r.id === rfq.id ? { ...r, status: "Cancelled" } : r))
    );
    setToast({ message: `RFQ ${rfq.rfqNumber} has been cancelled.`, variant: "info" });
  };

  // Native File Picker Select Handler
  const handleNativeFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAtts: RFQAttachment[] = Array.from(files).map((file, idx) => {
      const sizeInKb = Math.round(file.size / 1024);
      const fileSize = sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`;

      return {
        id: `att-rfq-${Date.now()}-${idx}`,
        fileName: file.name,
        fileSize: fileSize,
        fileType: file.name.endsWith(".xlsx") ? "xlsx" : "pdf",
      };
    });

    setFormAttachments((prev) => [...prev, ...newAtts]);
    setToast({ message: `Attached ${files.length} document(s).`, variant: "success" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Confirm Vendors Selection from Vendor Modal
  const handleConfirmVendorModal = () => {
    const selected = MASTER_VENDOR_OPTIONS.filter((v) => selectedVendorIds.includes(v.id)).map(
      (v) => ({
        id: v.id,
        vendorName: v.name,
        email: v.email,
        phone: v.phone,
        invitationSentOn: "18 Jul 2026",
        status: "Pending" as const,
      })
    );
    setFormVendors(selected);
    setVendorModalOpen(false);
    setToast({ message: `Added ${selected.length} vendors to RFQ.`, variant: "success" });
  };

  // Save RFQ Form Handler
  const handleSaveRFQ = (isSend: boolean) => {
    const nextNum = `RFQ-2026-00${rfqList.length + 1}`;
    const newRecord: RFQRecord = {
      id: `rfq-${Date.now()}`,
      rfqNumber: editRFQ ? editRFQ.rfqNumber : nextNum,
      linkedPR: formPR,
      department: formPR === "PR-2026-001" ? "Housekeeping" : formPR === "PR-2026-002" ? "Engineering" : "Kitchen",
      buyer: formBuyer,
      invitedVendors: formVendors,
      closingDate: formClosingDate,
      rfqDate: formRFQDate,
      priority: formPriority,
      status: isSend ? "Sent" : "Draft",
      requestedItems: formRequestedItems,
      commercialTerms: {
        deliveryLocation: formDeliveryLoc,
        deliveryAddress: formDeliveryAddr,
        paymentTerms: formPayTerms,
        currency: formCurrency,
        expectedDelivery: formExpDelivery,
        tax: formTax,
        remarks: formRemarks,
      },
      attachments: formAttachments,
      comparisonData: [
        {
          vendorName: "ABC Linen Pvt Ltd",
          unitPrice: 340,
          deliveryDays: 5,
          paymentTerms: "30 Days",
          warranty: "12 Months",
          rating: "★★★★☆",
          totalAmount: 68000,
          isRecommended: true,
        },
        {
          vendorName: "XYZ Textiles",
          unitPrice: 355,
          deliveryDays: 3,
          paymentTerms: "15 Days",
          warranty: "12 Months",
          rating: "★★★★★",
          totalAmount: 71000,
          isRecommended: false,
        },
        {
          vendorName: "Premium Hospitality Supplies",
          unitPrice: 330,
          deliveryDays: 8,
          paymentTerms: "45 Days",
          warranty: "6 Months",
          rating: "★★★☆☆",
          totalAmount: 66000,
          isRecommended: false,
        },
      ],
      activityTimeline: [
        { stage: "RFQ Created", timestamp: "18 Jul 2026", note: `RFQ created by ${formBuyer}`, author: "Amit Sharma" },
        ...(isSend ? [{ stage: "Vendors Invited", timestamp: "18 Jul 2026", note: `Sent RFQ to ${formVendors.length} invited vendors`, author: "System" }] : []),
        { stage: "Waiting for Vendor Responses", timestamp: isSend ? "In Progress" : "Pending", note: "Awaiting submissions", author: "Vendor Portal" },
        { stage: "Vendor Selected", timestamp: "Pending", note: "Awaiting evaluation", author: "Purchase Manager" },
        { stage: "Converted to Purchase Order", timestamp: "Pending", note: "Awaiting PO generation", author: "Finance Head" },
      ],
    };

    if (editRFQ) {
      setRfqList((prev) => prev.map((r) => (r.id === editRFQ.id ? newRecord : r)));
      setEditRFQ(null);
      setToast({ message: "RFQ Saved Successfully", variant: "success" });
    } else {
      setRfqList([newRecord, ...rfqList]);
      setCreateDrawerOpen(false);
      setToast({
        message: isSend ? "RFQ Sent Successfully" : "RFQ Saved Successfully",
        variant: "success",
      });
    }
  };

  // Status-aware actions for the selection bar (first selected RFQ)
  const getSelectionActions = (rfq: RFQRecord): ModuleSelectionAction[] => {
    const view: ModuleSelectionAction = {
      label: "View",
      icon: <Eye className="h-3.5 w-3.5" />,
      onClick: () => setSelectedRFQ(rfq),
    };

    switch (rfq.status) {
      case "Draft":
        return [
          view,
          { label: "Edit", icon: <Edit className="h-3.5 w-3.5" />, onClick: () => setEditRFQ(rfq) },
          { label: "Send RFQ", icon: <Send className="h-3.5 w-3.5" />, onClick: () => handleSendRFQDirect(rfq) },
          { label: "Cancel", variant: "danger", onClick: () => handleCancelRFQ(rfq) },
        ];
      case "Sent":
        return [
          view,
          {
            label: "Compare Quotations",
            icon: <FileSpreadsheet className="h-3.5 w-3.5" />,
            onClick: () => setCompareModalRFQ(rfq),
          },
          { label: "Edit", icon: <Edit className="h-3.5 w-3.5" />, onClick: () => setEditRFQ(rfq) },
        ];
      case "Pending Response":
        return [
          view,
          {
            label: "Compare Quotations",
            icon: <FileSpreadsheet className="h-3.5 w-3.5" />,
            onClick: () => setCompareModalRFQ(rfq),
          },
          {
            label: "Send Reminder",
            icon: <Bell className="h-3.5 w-3.5" />,
            onClick: () => handleSendReminder(rfq),
          },
        ];
      case "Vendor Selected":
        return [
          view,
          {
            label: "Convert to PO",
            icon: <ShoppingCart className="h-3.5 w-3.5" />,
            onClick: () => setConvertPOModalRFQ(rfq),
          },
        ];
      case "Converted to PO":
        return [
          view,
          {
            label: "View Purchase Order",
            icon: <FileCheck className="h-3.5 w-3.5" />,
            onClick: () => setViewPODrawerRFQ(rfq),
          },
        ];
      case "Closed":
      case "Cancelled":
      default:
        return [view];
    }
  };

  const firstSelectedRFQ = filteredRFQs.find((r) => selectedIds.has(r.id));
  const allVisibleSelected =
    filteredRFQs.length > 0 && filteredRFQs.every((r) => selectedIds.has(r.id));

  const toggleAllVisible = () => {
    setSelectedIds(allVisibleSelected ? new Set() : new Set(filteredRFQs.map((r) => r.id)));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-5 select-none pb-12">
      {/* Hidden Native File Input */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleNativeFileSelect}
        className="hidden"
        accept=".pdf,.xlsx,.xls,.docx,.doc,.png,.jpg,.jpeg"
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={cn(
            "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl p-3 text-xs font-bold shadow-xl animate-in fade-in slide-in-from-bottom-2",
            toast.variant === "success" ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <FOPageHeader
        eyebrow="PURCHASE & STORES"
        title="Request for Quotations (RFQ)"
        description="Create, send and compare vendor quotations before generating Purchase Orders."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setToast({ message: "Exporting RFQ Register CSV...", variant: "info" })}
              className="!bg-white hover:!bg-slate-100 !text-slate-700 !border-slate-200 flex items-center justify-center gap-1.5 rounded-xl h-8 px-3 text-xs font-bold shrink-0"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" /> Export CSV
            </Button>

            <Button
              onClick={() => setCreateDrawerOpen(true)}
              className="!bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white flex items-center justify-center gap-1.5 rounded-xl h-8 px-3.5 text-xs font-bold shrink-0 shadow-xs cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <Plus className="h-3.5 w-3.5" /> Create RFQ
            </Button>
          </div>
        }
      />

      {/* 6 Summary KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-20 rounded-2xl border border-slate-200 bg-white p-4 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatMiniCard label="Total RFQs" value={`${metrics.total}`} icon={FileText} accent="#10b981" />
          <StatMiniCard label="Draft" value={`${metrics.draft}`} icon={Clock} accent="#64748b" />
          <StatMiniCard label="Sent" value={`${metrics.sent}`} icon={Send} accent="#d97706" />
          <StatMiniCard label="Pending Response" value={`${metrics.pendingResponse}`} icon={AlertTriangle} accent="#0284c7" />
          <StatMiniCard label="Vendor Selected" value={`${metrics.vendorSelected}`} icon={CheckCircle2} accent="#059669" />
          <StatMiniCard label="Closed" value={`${metrics.closed}`} icon={XCircle} accent="#475569" />
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search RFQ Number, Purchase Requisition, Vendor, Buyer..."
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setFilterDrawerOpen(true)}
        statusTabs={[
          { id: "all", label: "All RFQs" },
          { id: "draft", label: "Draft" },
          { id: "sent", label: "Sent" },
          { id: "pending response", label: "Pending Response" },
          { id: "vendor selected", label: "Vendor Selected" },
          { id: "closed", label: "Closed" },
        ]}
        activeStatusTab={statusFilter}
        onStatusTabChange={setStatusFilter}
        selectionBar={
          <ModuleSelectionBar
            count={selectedIds.size}
            noun="RFQ"
            onClear={() => setSelectedIds(new Set())}
            actions={firstSelectedRFQ ? getSelectionActions(firstSelectedRFQ) : []}
          />
        }
      />

      {/* MOBILE ACTION CONTROLS BAR: [ Filter ] [ Sort ] [ + Create ] */}
      <div className="flex sm:hidden items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setFilterDrawerOpen(true)}
          className="flex-1 h-11 text-xs font-bold border-slate-300 text-slate-700 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Filter className="h-4 w-4" /> Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setToast({ message: "Sorted by Recent RFQs", variant: "info" })}
          className="flex-1 h-11 text-xs font-bold border-slate-300 text-slate-700 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ArrowUpDown className="h-4 w-4" /> Sort
        </Button>
        <Button
          type="button"
          onClick={() => setCreateDrawerOpen(true)}
          className="flex-1 h-11 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4" /> + Create
        </Button>
      </div>

      {/* Operations Filter Drawer */}
      <OperationsFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filter Request for Quotations"
        activeFilterCount={activeFilterCount}
        onReset={() => {
          setDepartmentFilter("all");
          setStatusFilter("all");
          setPriorityFilter("all");
          setBuyerFilter("all");
          setVendorFilter("all");
          setClosingDateFilter("");
        }}
      >
        <div className="space-y-4 select-none">
          <FormField label="Department">
            <SelectInput
              value={departmentFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDepartmentFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Departments</option>
              <option value="Housekeeping">Housekeeping</option>
              <option value="Engineering">Engineering</option>
              <option value="Kitchen">Kitchen (Food & Beverage)</option>
            </SelectInput>
          </FormField>

          <FormField label="Status">
            <SelectInput
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="pending response">Pending Response</option>
              <option value="vendor selected">Vendor Selected</option>
              <option value="closed">Closed</option>
            </SelectInput>
          </FormField>

          <FormField label="Buyer">
            <SelectInput
              value={buyerFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBuyerFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Buyers</option>
              <option value="Purchase Executive">Purchase Executive</option>
              <option value="Purchase Manager">Purchase Manager</option>
            </SelectInput>
          </FormField>

          <FormField label="Vendor">
            <SelectInput
              value={vendorFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setVendorFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Vendors</option>
              <option value="ABC Linen">ABC Linen Pvt Ltd</option>
              <option value="XYZ Textiles">XYZ Textiles</option>
              <option value="Premium Hospitality">Premium Hospitality Supplies</option>
            </SelectInput>
          </FormField>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFilterDrawerOpen(false)}
              className="h-9 px-4 text-xs font-bold !bg-slate-100 text-slate-700 rounded-xl"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={() => setFilterDrawerOpen(false)}
              className="h-9 px-4 text-xs font-bold !bg-[#0F8A5F] text-white rounded-xl"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </OperationsFilterDrawer>

      {/* RFQ Main Table (Sticky Header & Hover Effects) */}
      <div className="space-y-2">
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs scrollbar-thin max-h-[550px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 z-20 shadow-2xs">
                <th className="w-10 px-3.5 py-3 bg-slate-50">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                    aria-label="Select all RFQs"
                  />
                </th>
                <th className="px-3.5 py-3 bg-slate-50">RFQ Number</th>
                <th className="px-3.5 py-3 bg-slate-50">Linked PR</th>
                <th className="px-3.5 py-3 bg-slate-50">Department</th>
                <th className="px-3.5 py-3 bg-slate-50">Buyer</th>
                <th className="px-3.5 py-3 bg-slate-50">Vendors Invited</th>
                <th className="px-3.5 py-3 bg-slate-50">Closing Date</th>
                <th className="px-3.5 py-3 bg-slate-50">Selected Vendor</th>
                <th className="px-3.5 py-3 bg-slate-50">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={9} className="px-3.5 py-4">
                      <div className="h-4 bg-slate-200 rounded-md w-full" />
                    </td>
                  </tr>
                ))
              ) : filteredRFQs.length > 0 ? (
                filteredRFQs.map((rfq) => (
                  <tr
                    key={rfq.id}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    onClick={() => setSelectedRFQ(rfq)}
                  >
                    <td className="px-3.5 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(rfq.id)}
                        onChange={() => toggleOne(rfq.id)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                        aria-label={`Select ${rfq.rfqNumber}`}
                      />
                    </td>
                    <td className="px-3.5 py-3 font-mono font-bold text-slate-900">{rfq.rfqNumber}</td>
                    <td className="px-3.5 py-3 font-mono text-emerald-700 font-bold">{rfq.linkedPR}</td>
                    <td className="px-3.5 py-3 font-extrabold text-slate-800">{rfq.department}</td>
                    <td className="px-3.5 py-3 text-slate-700 font-medium">{rfq.buyer}</td>
                    <td className="px-3.5 py-3 text-slate-600 font-bold">
                      {rfq.invitedVendors.length} Vendors Invited
                    </td>
                    <td className="px-3.5 py-3 text-slate-600 font-normal">{rfq.closingDate}</td>
                    <td className="px-3.5 py-3">
                      {rfq.selectedVendor ? (
                        <span className="font-extrabold text-slate-900">{rfq.selectedVendor}</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold text-slate-500 bg-slate-100 rounded-full">
                          Awaiting Evaluation
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-3">{renderStatusBadge(rfq.status)}</td>
                  </tr>
                ))
              ) : (
                /* Empty State */
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400 font-medium">
                    <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-extrabold text-slate-700">No RFQs Found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Create your first RFQ to invite vendor quotations.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>
              Showing{" "}
              <span className="font-medium text-slate-700">
                1–{filteredRFQs.length}
              </span>{" "}
              of <span className="font-medium text-slate-700">{rfqList.length}</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap">Rows</span>
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(e.target.value)}
                aria-label="Rows per page"
                className="h-8 w-[4.25rem] shrink-0 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              disabled
              className="h-8 gap-1 px-2.5 text-xs font-medium"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled
              className="h-8 gap-1 px-2.5 text-xs font-medium"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* VIEW RFQ DRAWER (READ-ONLY WITH ACTIVITY TIMELINE) */}
      {selectedRFQ && (
        <Drawer
          open={!!selectedRFQ}
          onClose={() => setSelectedRFQ(null)}
          title={`RFQ Record: ${selectedRFQ.rfqNumber}`}
          width="xl"
        >
          <div className="space-y-6 select-none pb-6">
            {/* Header Status Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-extrabold text-emerald-700">{selectedRFQ.rfqNumber}</span>
                {renderStatusBadge(selectedRFQ.status)}
              </div>
              <h3 className="text-base font-extrabold text-slate-900">{selectedRFQ.department} Department RFQ</h3>
              <p className="text-xs text-slate-500 font-medium">Linked PR: {selectedRFQ.linkedPR} · Buyer: {selectedRFQ.buyer}</p>
            </div>

            {/* SECTION 1: BASIC INFORMATION */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                Basic Information
              </h4>
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-3 border-b border-slate-100 pb-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Linked PR</span>
                    <p className="font-mono font-bold text-slate-900">{selectedRFQ.linkedPR}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Buyer</span>
                    <p className="font-bold text-slate-800">{selectedRFQ.buyer}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-b border-slate-100 pb-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">RFQ Date</span>
                    <p className="font-bold text-slate-800">{selectedRFQ.rfqDate}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Closing Date</span>
                    <p className="font-bold text-slate-800">{selectedRFQ.closingDate}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-500 font-medium">Selected Vendor:</span>
                  {selectedRFQ.selectedVendor ? (
                    <span className="font-extrabold text-slate-900">{selectedRFQ.selectedVendor}</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold text-slate-500 bg-slate-100 rounded-full">
                      Awaiting Evaluation
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2: REQUESTED ITEMS (WITH ESTIMATED RATE COLUMN) */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                Requested Items (Auto-populated from {selectedRFQ.linkedPR})
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Quantity</th>
                      <th className="px-3 py-2">Unit</th>
                      <th className="px-3 py-2 text-right">Estimated Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {selectedRFQ.requestedItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 font-bold text-slate-900">{item.item}</td>
                        <td className="px-3 py-2 text-slate-600">{item.category}</td>
                        <td className="px-3 py-2 font-extrabold text-slate-900">{item.quantity}</td>
                        <td className="px-3 py-2 text-slate-500">{item.unit}</td>
                        <td className="px-3 py-2 text-right font-extrabold text-emerald-800">
                          ₹{item.estimatedRate.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 3: INVITED VENDORS */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                Invited Vendors ({selectedRFQ.invitedVendors.length})
              </h4>
              {selectedRFQ.invitedVendors.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        <th className="px-3 py-2">Vendor</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">Phone</th>
                        <th className="px-3 py-2">Invitation Sent On</th>
                        <th className="px-3 py-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {selectedRFQ.invitedVendors.map((v) => (
                        <tr key={v.id}>
                          <td className="px-3 py-2 font-bold text-slate-900">{v.vendorName}</td>
                          <td className="px-3 py-2 text-slate-500">{v.email}</td>
                          <td className="px-3 py-2 text-slate-500">{v.phone}</td>
                          <td className="px-3 py-2 text-slate-600 font-medium">{v.invitationSentOn || "18 Jul 2026"}</td>
                          <td className="px-3 py-2 text-right">
                            <span className={cn(
                              "px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full border",
                              v.status === "Responded" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200"
                            )}>
                              {v.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-400 font-medium">
                  No vendors invited.
                </div>
              )}
            </div>

            {/* SECTION 4: COMMERCIAL TERMS */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                Commercial Terms
              </h4>
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-3 border-b border-slate-100 pb-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Delivery Location</span>
                    <p className="font-semibold text-slate-800">{selectedRFQ.commercialTerms.deliveryLocation}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Delivery Address</span>
                    <p className="font-semibold text-slate-800">{selectedRFQ.commercialTerms.deliveryAddress}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 border-b border-slate-100 pb-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Payment Terms</span>
                    <p className="font-semibold text-slate-800">{selectedRFQ.commercialTerms.paymentTerms}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Expected Delivery</span>
                    <p className="font-semibold text-slate-800">{selectedRFQ.commercialTerms.expectedDelivery}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Tax Terms</span>
                    <p className="font-semibold text-slate-800">{selectedRFQ.commercialTerms.tax}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 5: ATTACHMENTS */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                Attachments
              </h4>
              {selectedRFQ.attachments.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {selectedRFQ.attachments.map((att) => (
                    <div key={att.id} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-slate-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold text-slate-800 truncate">{att.fileName}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{att.fileSize}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-400 font-medium">
                  No supporting documents attached.
                </div>
              )}
            </div>

            {/* SECTION 6: ACTIVITY TIMELINE */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                Activity Timeline
              </h4>
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                {selectedRFQ.activityTimeline.map((item, idx) => {
                  const isDone = item.timestamp !== "Pending";

                  return (
                    <div key={idx} className="flex items-start gap-3 relative">
                      {idx !== selectedRFQ.activityTimeline.length - 1 && (
                        <div className="absolute left-2.5 top-6 bottom-0 w-0.5 bg-slate-200 -mb-4" />
                      )}
                      <div
                        className={cn(
                          "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold z-10 shrink-0",
                          isDone ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400 border border-slate-300"
                        )}
                      >
                        {isDone ? "●" : "○"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={cn("text-xs font-extrabold", isDone ? "text-slate-900" : "text-slate-400")}>
                            {item.stage}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">{item.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">{item.note}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button
              type="button"
              onClick={() => setSelectedRFQ(null)}
              className="w-full h-9 text-xs font-bold !bg-slate-900 hover:!bg-slate-800 text-white rounded-xl shadow-xs cursor-pointer"
            >
              Close RFQ Details
            </Button>
          </div>
        </Drawer>
      )}

      {/* LARGE RIGHT-SIDE DRAWER: CREATE / EDIT RFQ (SAP FIORI / ENTERPRISE ERP STYLE) */}
      <Drawer
        open={createDrawerOpen || !!editRFQ}
        onClose={() => {
          setCreateDrawerOpen(false);
          setEditRFQ(null);
        }}
        title={editRFQ ? `Edit RFQ: ${editRFQ.rfqNumber}` : "Create Request for Quotation (RFQ)"}
        width="responsive"
        customHeader={
          <div className="flex flex-col gap-1 min-w-0">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight truncate">
              {editRFQ ? `Edit RFQ: ${editRFQ.rfqNumber}` : "Create Request for Quotation (RFQ)"}
            </h2>
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Draft
              </span>
              <span className="text-slate-300">•</span>
              <span className="truncate">
                <strong className="text-slate-700 font-semibold">Linked PR:</strong> {formPR}
              </span>
              <span className="text-slate-300">•</span>
              <span className="truncate">
                <strong className="text-slate-700 font-semibold">Buyer:</strong> {formBuyer}
              </span>
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCreateDrawerOpen(false);
                setEditRFQ(null);
              }}
              className="h-9 px-4 text-xs font-semibold !bg-white hover:!bg-slate-100 text-slate-700 border-slate-300 rounded-xl cursor-pointer"
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleSaveRFQ(false)}
              className="h-9 px-4 text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Save Draft
            </Button>

            <Button
              type="button"
              onClick={() => handleSaveRFQ(true)}
              className="h-9 px-5 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer focus:ring-2 focus:ring-emerald-500"
            >
              Send RFQ
            </Button>
          </div>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveRFQ(true);
          }}
          className="space-y-6 select-none focus:outline-hidden py-1"
        >
          {/* SECTION 1: BASIC INFORMATION CARD */}
          <div className="bg-white rounded-[12px] border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Basic Information
              </h4>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Section 1 of 5
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <FormField label="Linked Purchase Requisition" required>
                <SelectInput
                  value={formPR}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handlePRSelectionChange(e.target.value)}
                  className="h-9 text-xs font-medium focus:ring-2 focus:ring-emerald-500 border-slate-300 rounded-lg"
                >
                  <option value="PR-2026-001">PR-2026-001 (Housekeeping • Linen)</option>
                  <option value="PR-2026-002">PR-2026-002 (Engineering • HVAC)</option>
                  <option value="PR-2026-003">PR-2026-003 (Kitchen • Gourmet)</option>
                </SelectInput>
              </FormField>

              <FormField label="Buyer" required>
                <SelectInput
                  value={formBuyer}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormBuyer(e.target.value)}
                  className="h-9 text-xs font-medium focus:ring-2 focus:ring-emerald-500 border-slate-300 rounded-lg"
                >
                  <option value="Purchase Executive">Purchase Executive</option>
                  <option value="Purchase Manager">Purchase Manager</option>
                </SelectInput>
              </FormField>

              <FormField label="RFQ Date" required>
                <TextInput
                  type="date"
                  value={formRFQDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormRFQDate(e.target.value)}
                  className="h-9 text-xs font-medium focus:ring-2 focus:ring-emerald-500 border-slate-300 rounded-lg"
                />
              </FormField>

              <FormField label="Closing Date" required>
                <TextInput
                  type="date"
                  value={formClosingDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormClosingDate(e.target.value)}
                  className="h-9 text-xs font-medium focus:ring-2 focus:ring-emerald-500 border-slate-300 rounded-lg"
                />
              </FormField>

              <div className="md:col-span-2">
                <FormField label="Priority" required>
                  <SelectInput
                    value={formPriority}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormPriority(e.target.value as any)}
                    className="h-9 text-xs font-medium focus:ring-2 focus:ring-emerald-500 border-slate-300 rounded-lg"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Emergency">Emergency</option>
                  </SelectInput>
                </FormField>
              </div>
            </div>
          </div>

          {/* SECTION 2: REQUESTED ITEMS CARD */}
          <div className="bg-white rounded-[12px] border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Requested Items ({formRequestedItems.length})
                </h4>
                <p className="text-[11px] text-slate-400 font-medium">
                  Auto-populated from {formPR} · Read-only reference items
                </p>
              </div>
            </div>

            {/* DESKTOP / TABLET COMPACT TABLE */}
            <div className="hidden sm:block rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="max-h-[260px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 z-10">
                    <tr>
                      <th className="px-3.5 py-2">Item Description</th>
                      <th className="px-3.5 py-2">Category</th>
                      <th className="px-3.5 py-2 w-20 text-center">Quantity</th>
                      <th className="px-3.5 py-2">Unit</th>
                      <th className="px-3.5 py-2 text-right">Estimated Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {formRequestedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-3.5 py-2 font-bold text-slate-900 min-w-[150px]">{item.item}</td>
                        <td className="px-3.5 py-2 text-slate-600 text-[11px]">
                          <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                            {item.category || "General"}
                          </span>
                        </td>
                        <td className="px-3.5 py-2 text-center font-extrabold text-slate-900">{item.quantity}</td>
                        <td className="px-3.5 py-2 text-slate-500 text-[11px]">{item.unit}</td>
                        <td className="px-3.5 py-2 text-right font-extrabold text-emerald-800">
                          ₹{item.estimatedRate.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MOBILE STACKED CARDS */}
            <div className="block sm:hidden space-y-2.5">
              {formRequestedItems.map((item) => (
                <div key={item.id} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 text-xs shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{item.item}</span>
                    <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                      {item.category || "General"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] pt-1.5 border-t border-slate-100">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Quantity</span>
                      <span className="font-extrabold text-slate-900">{item.quantity} {item.unit}</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-slate-500 block text-[10px]">Est. Rate</span>
                      <span className="font-extrabold text-emerald-800">₹{item.estimatedRate.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: INVITED VENDORS CARD */}
          <div className="bg-white rounded-[12px] border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Invited Vendors ({formVendors.length})
                </h4>
                <p className="text-[11px] text-slate-400 font-medium">
                  Select target vendors to send RFQ invitations
                </p>
              </div>

              <Button
                type="button"
                onClick={() => setVendorModalOpen(true)}
                className="h-8 px-3 text-xs font-bold !bg-emerald-700 hover:!bg-emerald-800 text-white rounded-lg cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Add Vendor
              </Button>
            </div>

            {/* VENDOR CARDS GRID */}
            {formVendors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formVendors.map((v) => (
                  <div
                    key={v.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex items-start justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-bold text-slate-900 truncate" title={v.vendorName}>
                          {v.vendorName}
                        </h5>
                        <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                          {v.status || "Pending"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 truncate">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{v.email}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{v.phone}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium pt-0.5">
                        Invitation Date: {v.invitationSentOn || "18 Jul 2026"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFormVendors(formVendors.filter((vendor) => vendor.id !== v.id))}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                      title="Remove Vendor"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-5 text-center text-xs space-y-1">
                <User className="h-5 w-5 mx-auto text-slate-400" />
                <p className="font-bold text-slate-700">No vendors invited</p>
                <p className="text-[10px] text-slate-400 font-medium">
                  Click "+ Add Vendor" to select target suppliers for quotation bids.
                </p>
              </div>
            )}
          </div>

          {/* SECTION 4: COMMERCIAL TERMS CARD */}
          <div className="bg-white rounded-[12px] border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Commercial Terms
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <FormField label="Delivery Location" required>
                <TextInput
                  value={formDeliveryLoc}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormDeliveryLoc(e.target.value)}
                  className="h-9 text-xs font-medium focus:ring-2 focus:ring-emerald-500 border-slate-300 rounded-lg"
                />
              </FormField>

              <FormField label="Delivery Address" required>
                <TextInput
                  value={formDeliveryAddr}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormDeliveryAddr(e.target.value)}
                  className="h-9 text-xs font-medium focus:ring-2 focus:ring-emerald-500 border-slate-300 rounded-lg"
                />
              </FormField>

              <FormField label="Payment Terms" required>
                <TextInput
                  value={formPayTerms}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormPayTerms(e.target.value)}
                  className="h-9 text-xs font-medium focus:ring-2 focus:ring-emerald-500 border-slate-300 rounded-lg"
                />
              </FormField>

              <FormField label="Expected Delivery" required>
                <TextInput
                  value={formExpDelivery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormExpDelivery(e.target.value)}
                  className="h-9 text-xs font-medium focus:ring-2 focus:ring-emerald-500 border-slate-300 rounded-lg"
                />
              </FormField>

              <FormField label="Currency" required>
                <TextInput
                  value={formCurrency}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormCurrency(e.target.value)}
                  className="h-9 text-xs font-medium focus:ring-2 focus:ring-emerald-500 border-slate-300 rounded-lg"
                />
              </FormField>

              <FormField label="Tax Terms" required>
                <TextInput
                  value={formTax}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormTax(e.target.value)}
                  className="h-9 text-xs font-medium focus:ring-2 focus:ring-emerald-500 border-slate-300 rounded-lg"
                />
              </FormField>

              <div className="md:col-span-2">
                <FormField label="Remarks / Special Instructions">
                  <TextAreaInput
                    rows={2}
                    value={formRemarks}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormRemarks(e.target.value)}
                    placeholder="Enter any additional commercial notes..."
                    className="w-full h-16 p-3 text-xs leading-relaxed text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </FormField>
              </div>
            </div>
          </div>

          {/* SECTION 5: ATTACHMENTS CARD */}
          <div className="bg-white rounded-[12px] border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Attachments ({formAttachments.length})
                </h4>
                <p className="text-[11px] text-slate-400 font-medium">
                  Attach technical specifications or bid guidelines
                </p>
              </div>

              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 px-3 text-xs font-bold !bg-emerald-700 hover:!bg-emerald-800 text-white rounded-lg cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" /> Add Attachment
              </Button>
            </div>

            {formAttachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {formAttachments.map((att) => (
                  <div
                    key={att.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-2.5 shadow-2xs hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {att.fileName.toLowerCase().endsWith(".xlsx") ? (
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                          <FileSpreadsheet className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-red-50 text-red-600 border border-red-100 shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate" title={att.fileName}>
                          {att.fileName}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {att.fileSize}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setToast({ message: `Previewing ${att.fileName}`, variant: "info" })}
                        className="px-2 py-1 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormAttachments(formAttachments.filter((a) => a.id !== att.id))}
                        className="px-2 py-1 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-5 text-center text-xs space-y-1 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <Paperclip className="h-5 w-5 mx-auto text-slate-400" />
                <p className="font-bold text-slate-700">No documents attached</p>
                <p className="text-[10px] text-slate-400 font-medium">
                  Click "+ Add Attachment" to upload supporting technical files.
                </p>
              </div>
            )}
          </div>
        </form>
      </Drawer>

      {/* VENDOR SELECTION MODAL */}
      <Modal
        open={vendorModalOpen}
        onClose={() => setVendorModalOpen(false)}
        title="Select Vendors for RFQ"
        description="Choose static vendors to invite for quotation submissions."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setVendorModalOpen(false)}
              className="h-9 px-4 text-xs font-bold !bg-slate-100 text-slate-700 rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmVendorModal}
              className="h-9 px-4 text-xs font-bold !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white rounded-xl cursor-pointer"
            >
              Add Selected Vendors
            </Button>
          </div>
        }
      >
        <div className="space-y-3 py-1 text-xs">
          {MASTER_VENDOR_OPTIONS.map((v) => {
            const isChecked = selectedVendorIds.includes(v.id);

            return (
              <label
                key={v.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors",
                  isChecked ? "bg-emerald-50/70 border-emerald-300" : "bg-white border-slate-200 hover:bg-slate-50"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedVendorIds([...selectedVendorIds, v.id]);
                      } else {
                        setSelectedVendorIds(selectedVendorIds.filter((id) => id !== v.id));
                      }
                    }}
                    className="accent-emerald-700 cursor-pointer"
                  />
                  <div>
                    <p className="font-extrabold text-slate-900">{v.name}</p>
                    <p className="text-[10px] text-slate-400">{v.email} · {v.phone}</p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </Modal>

      {/* COMPARE QUOTATIONS MODAL */}
      {compareModalRFQ && (
        <Modal
          open={!!compareModalRFQ}
          onClose={() => setCompareModalRFQ(null)}
          title={`Quotation Comparison Matrix: ${compareModalRFQ.rfqNumber}`}
          description={`Comparing 3 vendor commercial bids for ${compareModalRFQ.department} Department requisition.`}
          size="lg"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCompareModalRFQ(null)}
                className="h-9 px-4 text-xs font-bold !bg-slate-100 text-slate-700 rounded-xl cursor-pointer"
              >
                Close Comparison
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setSelectVendorModalRFQ(compareModalRFQ);
                  setCompareModalRFQ(null);
                }}
                className="h-9 px-4 text-xs font-bold !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white rounded-xl cursor-pointer"
              >
                Select Recommended Vendor
              </Button>
            </div>
          }
        >
          <div className="space-y-4 select-none py-1">
            {compareModalRFQ.comparisonData.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      <th className="px-3.5 py-3">Vendor</th>
                      <th className="px-3.5 py-3">Quoted Rate</th>
                      <th className="px-3.5 py-3">Delivery Time</th>
                      <th className="px-3.5 py-3">Payment Terms</th>
                      <th className="px-3.5 py-3">Warranty</th>
                      <th className="px-3.5 py-3">Vendor Rating</th>
                      <th className="px-3.5 py-3">Total Amount</th>
                      <th className="px-3.5 py-3 text-right">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {compareModalRFQ.comparisonData.map((bid) => (
                      <tr
                        key={bid.vendorName}
                        className={cn(
                          "transition-colors",
                          bid.isRecommended ? "bg-emerald-50/80 border-l-4 border-l-emerald-600" : "hover:bg-slate-50/50"
                        )}
                      >
                        <td className="px-3.5 py-3 font-extrabold text-slate-900">{bid.vendorName}</td>
                        <td className="px-3.5 py-3 font-bold text-slate-800">₹{bid.unitPrice}</td>
                        <td className="px-3.5 py-3 text-slate-600">{bid.deliveryDays} Days</td>
                        <td className="px-3.5 py-3 text-slate-600">{bid.paymentTerms}</td>
                        <td className="px-3.5 py-3 text-slate-600">{bid.warranty}</td>
                        <td className="px-3.5 py-3 text-amber-500 font-bold">{bid.rating}</td>
                        <td className="px-3.5 py-3 font-extrabold text-slate-900 text-sm">
                          ₹{bid.totalAmount.toLocaleString("en-IN")}
                        </td>
                        <td className="px-3.5 py-3 text-right">
                          {bid.isRecommended ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-extrabold uppercase rounded-full bg-emerald-600 text-white shadow-2xs">
                              <Star className="h-3 w-3 fill-current" /> Recommended
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-400 font-medium">
                No quotations received yet.
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* SELECT VENDOR CONFIRMATION MODAL */}
      {selectVendorModalRFQ && (
        <Modal
          open={!!selectVendorModalRFQ}
          onClose={() => setSelectVendorModalRFQ(null)}
          title="Confirm Winning Vendor Selection"
          description={`Confirm supplier selection for ${selectVendorModalRFQ.rfqNumber}`}
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectVendorModalRFQ(null)}
                className="h-9 px-4 text-xs font-bold !bg-slate-100 text-slate-700 rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmVendorSelection}
                className="h-9 px-4 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                Confirm Selection
              </Button>
            </div>
          }
        >
          <div className="space-y-4 select-none py-2 text-xs">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-emerald-700 font-bold uppercase">Selected Vendor</span>
                <span className="text-amber-500 font-bold">★★★★☆</span>
              </div>
              <p className="text-base font-extrabold text-slate-900">ABC Linen Pvt Ltd</p>
              <div className="flex justify-between text-xs font-bold text-slate-700 pt-1 border-t border-emerald-100">
                <span>Quoted Amount:</span>
                <span className="text-emerald-800 font-extrabold">₹68,000</span>
              </div>
            </div>

            <FormField label="Reason for Selection" required>
              <TextAreaInput
                rows={3}
                value={vendorSelectReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setVendorSelectReason(e.target.value)}
                className="text-xs leading-relaxed"
              />
            </FormField>
          </div>
        </Modal>
      )}

      {/* CONVERT RFQ TO PURCHASE ORDER CONFIRMATION MODAL (WITH 1-SEC SIMULATED LOADING) */}
      {convertPOModalRFQ && (
        <Modal
          open={!!convertPOModalRFQ}
          onClose={() => {
            if (!isConvertingPO) setConvertPOModalRFQ(null);
          }}
          title="Convert RFQ to Purchase Order"
          description="This will generate a Purchase Order using the selected vendor and approved quotation."
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isConvertingPO}
                onClick={() => setConvertPOModalRFQ(null)}
                className="h-9 px-4 text-xs font-bold !bg-slate-100 text-slate-700 rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isConvertingPO}
                onClick={handleExecuteCreatePO}
                className="h-9 px-4 text-xs font-bold !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                {isConvertingPO ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating PO...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-3.5 w-3.5" /> Create Purchase Order
                  </>
                )}
              </Button>
            </div>
          }
        >
          <div className="space-y-4 select-none py-2 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <div className="grid grid-cols-2 gap-3 border-b border-slate-200 pb-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">RFQ Number</span>
                  <p className="font-mono font-extrabold text-[#0F8A5F] text-sm">{convertPOModalRFQ.rfqNumber}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Selected Vendor</span>
                  <p className="font-extrabold text-slate-900">{convertPOModalRFQ.selectedVendor || "ABC Linen Pvt Ltd"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Number of Items</span>
                  <p className="font-bold text-slate-800">{convertPOModalRFQ.requestedItems.length} Items</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Estimated Order Total</span>
                  <p className="font-extrabold text-emerald-800 text-sm">
                    ₹{convertPOModalRFQ.requestedItems.reduce((acc, i) => acc + i.quantity * i.estimatedRate, 0).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900 font-medium">
              ℹ️ This will generate a Purchase Order using the selected vendor and approved quotation. Status will update to <strong>Converted to PO</strong>.
            </div>
          </div>
        </Modal>
      )}

      {/* VIEW PURCHASE ORDER DRAWER (READ-ONLY DEMO) */}
      {viewPODrawerRFQ && (
        <Drawer
          open={!!viewPODrawerRFQ}
          onClose={() => setViewPODrawerRFQ(null)}
          title={`Purchase Order: ${viewPODrawerRFQ.poNumber || "PO-2026-015"}`}
          width="xl"
        >
          <div className="space-y-6 select-none pb-6">
            <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-extrabold text-teal-900">
                  {viewPODrawerRFQ.poNumber || "PO-2026-015"}
                </span>
                <span className="px-2.5 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-emerald-600 text-white shadow-2xs">
                  Approved & Issued
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                Vendor: {viewPODrawerRFQ.selectedVendor || "ABC Linen Pvt Ltd"}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Linked RFQ: {viewPODrawerRFQ.rfqNumber} · Linked PR: {viewPODrawerRFQ.linkedPR}
              </p>
            </div>

            {/* PO DETAILS SUMMARY */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 text-xs">
              <div className="grid grid-cols-3 gap-3 border-b border-slate-100 pb-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">PO Number</span>
                  <p className="font-mono font-bold text-slate-900">{viewPODrawerRFQ.poNumber || "PO-2026-015"}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Order Date</span>
                  <p className="font-bold text-slate-800">Today</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Buyer</span>
                  <p className="font-bold text-slate-800">{viewPODrawerRFQ.buyer}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500 font-medium">Total Purchase Order Value:</span>
                <span className="font-extrabold text-emerald-800 text-base">
                  ₹{viewPODrawerRFQ.requestedItems.reduce((acc, i) => acc + i.quantity * i.estimatedRate, 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* ORDER ITEMS TABLE */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                Purchase Order Line Items
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Quantity</th>
                      <th className="px-3 py-2">Unit</th>
                      <th className="px-3 py-2">Unit Rate</th>
                      <th className="px-3 py-2 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {viewPODrawerRFQ.requestedItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2.5 font-bold text-slate-900">{item.item}</td>
                        <td className="px-3 py-2.5 text-slate-600">{item.category}</td>
                        <td className="px-3 py-2.5 font-extrabold text-slate-900">{item.quantity}</td>
                        <td className="px-3 py-2.5 text-slate-500">{item.unit}</td>
                        <td className="px-3 py-2.5 text-slate-700 font-bold">₹{item.estimatedRate}</td>
                        <td className="px-3 py-2.5 font-extrabold text-emerald-800 text-right">
                          ₹{(item.quantity * item.estimatedRate).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => setViewPODrawerRFQ(null)}
              className="w-full h-9 text-xs font-bold !bg-slate-900 hover:!bg-slate-800 text-white rounded-xl shadow-xs cursor-pointer"
            >
              Close Purchase Order View
            </Button>
          </div>
        </Drawer>
      )}
    </div>
  );
}
