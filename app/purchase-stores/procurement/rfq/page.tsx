"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  FileText,
  Clock,
  CheckCircle2,
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
  Package,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import { platformService, type ManagedUserDto } from "@/services/platform";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { Modal } from "@/components/frontoffice/ui/Modal";
import {
  TextInput,
  SelectInput,
  FormField,
  TextAreaInput,
  FOPageHeader,
  StatMiniCard,
  AlertBanner,
} from "@/components/frontoffice/ui";
import { OperationsToolbar, OperationsFilterDrawer } from "@/components/housekeeping/OperationsToolbar";
import { ModuleSelectionBar } from "@/components/pms/ModuleSelectionBar";
import type { ModuleSelectionAction } from "@/components/pms/ModuleSelectionBar";
import type {
  RFQRecord,
  RFQVendorItem,
  RFQRequestedItem,
  RFQAttachment,
  VendorQuotationComparison,
} from "@/app/data/rfqData";
import {
  normalizeRfqRecord,
  normalizeRfqRequestedItem,
  toStoredRfqVendor,
} from "@/app/data/rfqData";
import {
  remainingByPrItemId,
  type PRFulfillment,
  type PurchaseRequisition,
} from "@/app/data/purchaseRequisitionsData";
import {
  PROCUREMENT_PRIORITY_OPTIONS,
  PrioritySelector,
  ProcurementFormSection,
  ProcurementSummaryRow,
  priorityTextClass,
} from "@/components/purchase-stores/ui/ProcurementFormParts";
import { PurchaseAttachmentPreviewModal } from "@/components/purchase-stores/ui/PurchaseAttachmentPreviewModal";
import { type PurchaseAttachmentRecord } from "@/app/data/purchaseAttachmentUtils";
import { usePsList } from "@/hooks/usePsResource";
import { psRfqService, psRequisitionService, psSupplierService, psPurchaseOrderService, psProductService } from "@/services/purchase-stores/index";
import {
  normalizePrRequestedItem,
  poLinesFromRfq,
  rfqItemFromPrItem,
} from "@/app/data/procurementMaterial";

function prItemsToRfqItems(
  items: PurchaseRequisition["requestedItems"],
  products: Parameters<typeof normalizePrRequestedItem>[2] = [],
): RFQRequestedItem[] {
  return items.map((item, index) =>
    rfqItemFromPrItem(normalizePrRequestedItem(item as Parameters<typeof normalizePrRequestedItem>[0], index, products)),
  );
}

function prOptionLabel(pr: PurchaseRequisition): string {
  const categoryHint = pr.requestedItems[0]?.category ?? "General";
  return `${pr.prNumber} (${pr.department} • ${categoryHint})`;
}

function formatBidDelivery(bid: VendorQuotationComparison): string {
  if (bid.deliveryDate) {
    return new Date(`${bid.deliveryDate}T00:00:00`).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  return bid.deliveryDays ? `${bid.deliveryDays} days` : "—";
}

function RfqDetailSection({
  title,
  meta,
  flush,
  children,
}: {
  title: string;
  meta?: string;
  /** Children draw their own edge-to-edge content (tables, lists). */
  flush?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 px-5 py-3.5">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {meta && <span className="text-xs text-slate-500">{meta}</span>}
      </div>
      <div className={flush ? undefined : "border-t border-slate-100 px-5 py-4"}>{children}</div>
    </section>
  );
}

export default function RequestForQuotationsPage() {
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: rfqListRaw, loading: isLoading, reload: reloadRfqs } = usePsList(() => psRfqService.list(), []);
  const rfqList = useMemo(() => rfqListRaw.map(normalizeRfqRecord), [rfqListRaw]);
  const { data: requisitions, loading: loadingPRs } = usePsList(() => psRequisitionService.list(), []);
  const { data: fulfillmentList, reload: reloadFulfillment } = usePsList(
    () => psRequisitionService.fulfillment(),
    [],
  );
  const fulfillmentByPr = useMemo(
    () => new Map<string, PRFulfillment>(fulfillmentList.map((f) => [f.prNumber, f])),
    [fulfillmentList],
  );
  const { data: purchaseOrders, reload: reloadPurchaseOrders } = usePsList(
    () => psPurchaseOrderService.list(),
    [],
  );
  const reload = () => Promise.all([reloadRfqs(), reloadFulfillment(), reloadPurchaseOrders()]);
  const { data: products } = usePsList(() => psProductService.list(), []);
  const { data: suppliers } = usePsList(() => psSupplierService.list(), []);

  const [platformUsers, setPlatformUsers] = useState<ManagedUserDto[]>([]);
  useEffect(() => {
    void platformService
      .listUsers()
      .then(setPlatformUsers)
      .catch(() => setPlatformUsers([]));
  }, []);

  const resolveBuyerName = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of platformUsers) map.set(u.id, u.name);
    if (user?.id) map.set(user.id, user.name);
    return (buyerIdOrName: string | null | undefined) => {
      const key = String(buyerIdOrName ?? "").trim();
      if (!key) return "—";
      return map.get(key) ?? key;
    };
  }, [platformUsers, user]);

  const vendorOptions = useMemo(
    () =>
      suppliers.map((s) => ({
        id: s.id,
        name: s.supplierName,
        email: s.email,
        phone: s.phone,
      })),
    [suppliers],
  );

  /** Resolve supplier master fields by id (RFQ stores ids only). */
  const resolveVendor = (vendorId: string | undefined | null) => {
    if (!vendorId) return null;
    return suppliers.find((s) => s.id === vendorId) ?? null;
  };

  const resolveVendorName = (vendorId: string | undefined | null, fallback = "") => {
    const s = resolveVendor(vendorId);
    return s?.supplierName || fallback || vendorId || "Unknown vendor";
  };

  const enrichInvitedVendor = (v: RFQVendorItem): RFQVendorItem => {
    const s = resolveVendor(v.id);
    return {
      ...v,
      vendorName: s?.supplierName || v.vendorName || "Unknown vendor",
      email: s?.email || v.email || "",
      phone: s?.phone || v.phone || "",
    };
  };

  const [saving, setSaving] = useState(false);

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
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);

  // Form State for Create/Edit RFQ
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [formPR, setFormPR] = useState("");
  const [formBuyer, setFormBuyer] = useState("");
  const [formRFQDate, setFormRFQDate] = useState("");
  const [formClosingDate, setFormClosingDate] = useState("");
  const [formPriority, setFormPriority] = useState<RFQRecord["priority"]>("Medium");
  const [formRemarks, setFormRemarks] = useState("");

  // Form Vendors & Requested Items State
  const [formVendors, setFormVendors] = useState<RFQVendorItem[]>([]);
  const [formRequestedItems, setFormRequestedItems] = useState<RFQRequestedItem[]>([]);
  const formEstimatedValue = formRequestedItems.reduce((sum, i) => sum + i.quantity * i.estimatedRate, 0);

  const selectedPR = useMemo(
    () => requisitions.find((pr) => pr.prNumber === formPR),
    [requisitions, formPR],
  );

  const eligiblePRs = useMemo(() => {
    const ownPR = editRFQ?.linkedPR?.trim();
    return requisitions.filter(
      (pr) => pr.prNumber === ownPR || fulfillmentByPr.get(pr.prNumber)?.canCreateRfq,
    );
  }, [requisitions, fulfillmentByPr, editRFQ]);

  // Form Commercial Terms State
  const [formDeliveryLoc, setFormDeliveryLoc] = useState("");
  const [formDeliveryAddr, setFormDeliveryAddr] = useState("");
  const [formPayTerms, setFormPayTerms] = useState("");
  const [formCurrency, setFormCurrency] = useState("INR (₹)");
  const [formExpDelivery, setFormExpDelivery] = useState("");
  const [formTax, setFormTax] = useState("");

  const [previewAttachment, setPreviewAttachment] = useState<PurchaseAttachmentRecord | null>(null);

  // Vendor Selection Reason State
  const [vendorSelectReason, setVendorSelectReason] = useState("");
  const [pickedVendorId, setPickedVendorId] = useState("");

  // Record vendor quotation modal
  const [recordQuoteRFQ, setRecordQuoteRFQ] = useState<RFQRecord | null>(null);
  const [recordQuoteVendor, setRecordQuoteVendor] = useState<RFQVendorItem | null>(null);
  const [quoteUnitPrice, setQuoteUnitPrice] = useState("");
  const [quoteDeliveryDate, setQuoteDeliveryDate] = useState("");
  const [quotePaymentTerms, setQuotePaymentTerms] = useState("");
  const [quoteWarranty, setQuoteWarranty] = useState("12 Months");
  const [quoteTotalAmount, setQuoteTotalAmount] = useState("");
  const [savingQuote, setSavingQuote] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; variant: "success" | "info" } | null>(null);

  // Keep detail drawer in sync after API reload
  useEffect(() => {
    if (!selectedRFQ) return;
    const updated = rfqList.find((r) => r.id === selectedRFQ.id);
    if (updated) setSelectedRFQ(updated);
  }, [rfqList, selectedRFQ?.id]);

  // Sync form when PR selection changes
  const handlePRSelectionChange = (
    prNum: string,
    prOverride?: PurchaseRequisition,
    fulfillmentOverride?: PRFulfillment,
  ) => {
    setFormPR(prNum);
    const pr = prOverride ?? requisitions.find((p) => p.prNumber === prNum);
    if (pr) {
      const remaining = remainingByPrItemId(fulfillmentOverride ?? fulfillmentByPr.get(pr.prNumber));
      const items = remaining
        ? pr.requestedItems
            .map((item) => ({ ...item, quantity: remaining[item.id] ?? item.quantity }))
            .filter((item) => item.quantity > 0)
        : pr.requestedItems;
      setFormRequestedItems(prItemsToRfqItems(items, products));
      setFormPriority(pr.priority);
    } else if (!prNum) {
      setFormRequestedItems([]);
    }
  };

  const openCreateDrawer = () => {
    setEditRFQ(null);
    setFormPR("");
    setFormBuyer(user?.id ?? "");
    setFormRFQDate("");
    setFormClosingDate("");
    setFormPriority("Medium");
    setFormRequestedItems([]);
    setFormVendors([]);
    setFormRemarks("");
    setFormDeliveryLoc("");
    setFormDeliveryAddr("");
    setFormPayTerms("");
    setFormCurrency("INR (₹)");
    setFormExpDelivery("");
    setFormTax("");
    setCreateDrawerOpen(true);
  };

  // "Create RFQ" from the requisition page: /rfq?fromPR=PR-…
  useEffect(() => {
    const fromPR = new URLSearchParams(window.location.search).get("fromPR");
    if (!fromPR) return;
    window.history.replaceState(null, "", window.location.pathname);
    void Promise.all([psRequisitionService.list(), psRequisitionService.fulfillment()])
      .then(([prs, fulfillments]) => {
        const pr = prs.find((p) => p.prNumber === fromPR);
        const fulfillment = fulfillments.find((f) => f.prNumber === fromPR);
        if (!pr || !fulfillment?.canCreateRfq) {
          setToast({ message: `${fromPR} is not open for a new RFQ.`, variant: "info" });
          return;
        }
        openCreateDrawer();
        handlePRSelectionChange(fromPR, pr, fulfillment);
      })
      .catch(() => setToast({ message: `Could not load ${fromPR}.`, variant: "info" }));
  }, []);

  // Sync Form State when Edit RFQ opens
  useEffect(() => {
    if (editRFQ) {
      setFormPR(editRFQ.linkedPR ?? "");
      setFormBuyer(editRFQ.buyer);
      setFormRFQDate(editRFQ.rfqDate);
      setFormClosingDate(editRFQ.closingDate);
      setFormPriority(editRFQ.priority);
      setFormVendors(editRFQ.invitedVendors);
      setFormRequestedItems(editRFQ.requestedItems);
      setFormDeliveryLoc(editRFQ.commercialTerms.deliveryLocation);
      setFormDeliveryAddr(editRFQ.commercialTerms.deliveryAddress ?? "");
      setFormPayTerms(editRFQ.commercialTerms.paymentTerms);
      setFormCurrency(editRFQ.commercialTerms.currency);
      setFormExpDelivery(editRFQ.commercialTerms.expectedDelivery);
      setFormTax(editRFQ.commercialTerms.tax);
      setFormRemarks(editRFQ.commercialTerms.remarks);
    }
  }, [editRFQ]);

  // Keep buyer bound to logged-in user for new RFQs
  useEffect(() => {
    if (!editRFQ && createDrawerOpen && user?.id) {
      setFormBuyer(user.id);
    }
  }, [user?.id, editRFQ, createDrawerOpen]);

  // Dynamic 6 KPI Cards Metrics
  const metrics = useMemo(() => {
    const total = rfqList.length;
    const draft = rfqList.filter((r) => r.status === "Draft").length;
    const sent = rfqList.filter((r) => r.status === "Sent").length;
    const quotesReceived = rfqList.filter((r) => r.status === "Quotes Received").length;
    const vendorSelected = rfqList.filter((r) => r.status === "Vendor Selected").length;
    const closed = rfqList.filter((r) => r.status === "Closed").length;
    const convertedToPo = rfqList.filter((r) => r.status === "Converted to PO").length;
    const cancelled = rfqList.filter((r) => r.status === "Cancelled").length;

    return { total, draft, sent, quotesReceived, vendorSelected, closed, convertedToPo, cancelled };
  }, [rfqList]);

  const displaySelectedVendor = (rfq: RFQRecord) => {
    if (!rfq.selectedVendor) return null;
    // Prefer id lookup; fall back to legacy stored name
    const byId = resolveVendor(rfq.selectedVendor);
    if (byId) return byId.supplierName;
    const invited = rfq.invitedVendors.find((v) => v.id === rfq.selectedVendor);
    if (invited) return resolveVendorName(invited.id, invited.vendorName);
    return rfq.selectedVendor;
  };

  const selectedBidFor = (rfq: RFQRecord) =>
    rfq.selectedVendor ? rfq.comparisonData.find((c) => c.vendorId === rfq.selectedVendor) : undefined;

  /** A PO can be raised once per RFQ, after a quoted vendor is selected. */
  const canCreatePoFromRfq = (rfq: RFQRecord) =>
    rfq.status === "Vendor Selected" && !rfq.poNumber?.trim() && Boolean(selectedBidFor(rfq));

  /** Per-unit rate that reproduces the vendor's quoted total (quotes are one rate across all lines). */
  const quotedRateFor = (rfq: RFQRecord, bid: VendorQuotationComparison) => {
    const totalQty = rfq.requestedItems.reduce((sum, item) => sum + item.quantity, 0);
    if (!totalQty || !bid.totalAmount) return bid.unitPrice;
    if (Math.abs(bid.unitPrice * totalQty - bid.totalAmount) <= 1) return bid.unitPrice;
    return Math.round((bid.totalAmount / totalQty) * 100) / 100;
  };

  const linkedPoFor = (rfq: RFQRecord) => {
    const poNumber = rfq.poNumber?.trim();
    return poNumber ? purchaseOrders.find((po) => po.poNumber === poNumber) ?? null : null;
  };

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
        (rfq.linkedPR ?? "").toLowerCase().includes(search.toLowerCase()) ||
        rfq.department.toLowerCase().includes(search.toLowerCase()) ||
        rfq.buyer.toLowerCase().includes(search.toLowerCase()) ||
        resolveBuyerName(rfq.buyer).toLowerCase().includes(search.toLowerCase()) ||
        (rfq.selectedVendor &&
          displaySelectedVendor(rfq)?.toLowerCase().includes(search.toLowerCase())) ||
        rfq.invitedVendors.some((v) =>
          enrichInvitedVendor(v).vendorName.toLowerCase().includes(search.toLowerCase()),
        );

      const matchDept =
        departmentFilter === "all" || rfq.department.toLowerCase() === departmentFilter.toLowerCase();

      const matchStatus =
        statusFilter === "all" || rfq.status.toLowerCase() === statusFilter.toLowerCase();

      const matchPriority =
        priorityFilter === "all" || rfq.priority.toLowerCase() === priorityFilter.toLowerCase();

      const matchBuyer =
        buyerFilter === "all" ||
        rfq.buyer.toLowerCase().includes(buyerFilter.toLowerCase()) ||
        resolveBuyerName(rfq.buyer).toLowerCase().includes(buyerFilter.toLowerCase());

      const matchVendor =
        vendorFilter === "all" ||
        rfq.invitedVendors.some((v) =>
          enrichInvitedVendor(v).vendorName.toLowerCase().includes(vendorFilter.toLowerCase()),
        );

      return matchSearch && matchDept && matchStatus && matchPriority && matchBuyer && matchVendor;
    });
  }, [rfqList, search, departmentFilter, statusFilter, priorityFilter, buyerFilter, vendorFilter, resolveBuyerName, suppliers]);

  // Status Badge Helper
  const renderStatusBadge = (status: RFQRecord["status"]) => {
    const tone =
      {
        "Converted to PO": { pill: "bg-teal-50 text-teal-800 ring-teal-200", dot: "bg-teal-500" },
        "Vendor Selected": { pill: "bg-emerald-50 text-emerald-800 ring-emerald-200", dot: "bg-emerald-500" },
        Sent: { pill: "bg-amber-50 text-amber-800 ring-amber-200", dot: "bg-amber-500" },
        "Quotes Received": { pill: "bg-blue-50 text-blue-700 ring-blue-200", dot: "bg-blue-500" },
        Closed: { pill: "bg-slate-100 text-slate-600 ring-slate-200", dot: "bg-slate-400" },
        Cancelled: { pill: "bg-rose-50 text-rose-700 ring-rose-200", dot: "bg-rose-500" },
      }[status as string] ?? { pill: "bg-slate-50 text-slate-600 ring-slate-200", dot: "bg-slate-300" };
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset",
          tone.pill,
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} />
        {status || "Draft"}
      </span>
    );
  };

  const formatShortDate = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
    return Number.isNaN(d.getTime())
      ? iso
      : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  /** Countdown to the quote deadline, only while vendors can still respond. */
  const closingHint = (rfq: RFQRecord) => {
    if (!rfq.closingDate || !["Draft", "Sent", "Quotes Received"].includes(rfq.status)) return null;
    const days = Math.round(
      (new Date(`${rfq.closingDate.slice(0, 10)}T00:00:00`).getTime() - new Date(`${todayStr}T00:00:00`).getTime()) /
        86_400_000,
    );
    if (Number.isNaN(days)) return null;
    if (days < 0) return { label: `Overdue by ${-days}d`, className: "text-red-600" };
    if (days === 0) return { label: "Due today", className: "text-amber-600" };
    return { label: `${days}d left`, className: days <= 2 ? "text-amber-600" : "text-slate-400" };
  };

  // Vendor Confirmation Handler
  const handleConfirmVendorSelection = async () => {
    if (!selectVendorModalRFQ) return;
    const vendorId =
      pickedVendorId ||
      selectVendorModalRFQ.comparisonData.find((c) => c.isRecommended)?.vendorId ||
      selectVendorModalRFQ.comparisonData[0]?.vendorId;
    if (!vendorId || !selectVendorModalRFQ.comparisonData.some((c) => c.vendorId === vendorId)) {
      setToast({ message: "Select a vendor with a recorded quote first.", variant: "info" });
      return;
    }
    const reason = vendorSelectReason.trim();
    if (!reason) {
      setToast({ message: "Enter a reason for selecting this vendor.", variant: "info" });
      return;
    }
    const vendorLabel = resolveVendorName(
      vendorId,
      selectVendorModalRFQ.comparisonData.find((c) => c.vendorId === vendorId)?.vendorName,
    );
    try {
      await psRfqService.update(selectVendorModalRFQ.id, {
            status: "Vendor Selected",
        selectedVendor: vendorId,
        activityTimeline: [
          ...selectVendorModalRFQ.activityTimeline,
          {
            stage: "Vendor Selected",
            timestamp: new Date().toISOString().slice(0, 10),
            note: reason,
            author: resolveBuyerName(selectVendorModalRFQ.buyer),
          },
        ],
      });
      await reload();
      setToast({ message: `${vendorLabel} selected successfully`, variant: "success" });
      setSelectVendorModalRFQ(null);
      setPickedVendorId("");
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Selection failed", variant: "info" });
    }
  };

  const openRecordQuoteModal = (rfq: RFQRecord, vendor: RFQVendorItem) => {
    const enriched = enrichInvitedVendor(vendor);
    const existing = rfq.comparisonData?.find((b) => b.vendorId === vendor.id);
    setRecordQuoteRFQ(rfq);
    setRecordQuoteVendor(enriched);
    setQuoteUnitPrice(existing?.unitPrice ? String(existing.unitPrice) : "");
    setQuoteDeliveryDate(
      existing?.deliveryDate && existing.deliveryDate >= todayStr ? existing.deliveryDate : "",
    );
    setQuotePaymentTerms(existing?.paymentTerms || rfq.commercialTerms.paymentTerms || "Net 30");
    setQuoteWarranty(existing?.warranty || "12 Months");
    setQuoteTotalAmount(existing?.totalAmount ? String(existing.totalAmount) : "");
  };

  const quoteTotalQty = useMemo(() => {
    if (!recordQuoteRFQ) return 0;
    return recordQuoteRFQ.requestedItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [recordQuoteRFQ]);

  useEffect(() => {
    const rate = Number(quoteUnitPrice);
    if (!rate || !quoteTotalQty) return;
    setQuoteTotalAmount(String(Math.round(rate * quoteTotalQty)));
  }, [quoteUnitPrice, quoteTotalQty]);

  const handleSaveVendorQuotation = async () => {
    if (!recordQuoteRFQ || !recordQuoteVendor) return;
    const unitPrice = Number(quoteUnitPrice);
    const totalAmount = Number(quoteTotalAmount);
    if (!unitPrice || !totalAmount) {
      setToast({ message: "Enter quoted rate and total amount.", variant: "info" });
      return;
    }
    if (!quoteDeliveryDate) {
      setToast({ message: "Select a delivery date.", variant: "info" });
      return;
    }
    if (quoteDeliveryDate < todayStr) {
      setToast({ message: "Delivery date cannot be in the past.", variant: "info" });
      return;
    }

    const vendorLabel = resolveVendorName(recordQuoteVendor.id, recordQuoteVendor.vendorName);
    const deliveryDays = Math.max(
      0,
      Math.round((Date.parse(quoteDeliveryDate) - Date.parse(todayStr)) / 86_400_000),
    );
    const newBid = {
      vendorId: recordQuoteVendor.id,
      unitPrice,
      deliveryDate: quoteDeliveryDate,
      deliveryDays,
      paymentTerms: quotePaymentTerms,
      warranty: quoteWarranty,
      totalAmount,
      isRecommended: false,
    };

    const comparisonData = [
      ...(recordQuoteRFQ.comparisonData ?? []).filter((b) => b.vendorId !== recordQuoteVendor.id),
      newBid,
    ];
    const lowestTotal = Math.min(...comparisonData.map((b) => b.totalAmount));
    comparisonData.forEach((b) => {
      b.isRecommended = b.totalAmount === lowestTotal;
    });

    const invitedVendors = recordQuoteRFQ.invitedVendors.map((v) =>
      toStoredRfqVendor(
        v.id === recordQuoteVendor.id ? { ...v, status: "Responded" as const } : v,
      ),
    );

    setSavingQuote(true);
    try {
      await psRfqService.update(recordQuoteRFQ.id, {
        invitedVendors: invitedVendors as unknown as RFQVendorItem[],
        comparisonData,
        status: recordQuoteRFQ.status === "Sent" ? "Quotes Received" : recordQuoteRFQ.status,
        activityTimeline: [
          ...recordQuoteRFQ.activityTimeline,
          {
            stage: "Quotation Received",
            timestamp: new Date().toISOString().slice(0, 10),
            note: `${vendorLabel} submitted quotation (₹${totalAmount.toLocaleString("en-IN")})`,
            author: vendorLabel,
          },
        ],
      });
      await reload();
      setRecordQuoteRFQ(null);
      setRecordQuoteVendor(null);
      setToast({ message: `Quotation recorded for ${vendorLabel}`, variant: "success" });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Failed to save quotation", variant: "info" });
    } finally {
      setSavingQuote(false);
    }
  };

  const openCompareForRfq = (rfq: RFQRecord) => {
    if ((rfq.comparisonData?.length ?? 0) === 0) {
      setToast({ message: "Record at least one vendor quote before comparing.", variant: "info" });
      return;
    }
    const recommended = rfq.comparisonData.find((c) => c.isRecommended);
    setPickedVendorId(recommended?.vendorId ?? rfq.comparisonData[0]?.vendorId ?? "");
    setCompareModalRFQ(rfq);
  };

  const handleExecuteCreatePO = async () => {
    if (!convertPOModalRFQ) return;
    const rfq = convertPOModalRFQ;
    const vendorId = rfq.selectedVendor;
    const bid = selectedBidFor(rfq);
    if (rfq.poNumber?.trim()) {
      setToast({ message: `${rfq.rfqNumber} is already converted to ${rfq.poNumber}.`, variant: "info" });
      return;
    }
    if (rfq.status !== "Vendor Selected" || !vendorId) {
      setToast({ message: "Record quotes and select a vendor before creating a PO.", variant: "info" });
      return;
    }
    if (!bid) {
      setToast({ message: "The selected vendor has no recorded quote. Record Quote first.", variant: "info" });
      return;
    }

    const supplier = resolveVendor(vendorId);
    const vendorName = resolveVendorName(vendorId, bid.vendorName);
    const items = poLinesFromRfq(rfq.requestedItems, products, quotedRateFor(rfq, bid));
    const missingMaterial = items.filter((line) => !line.materialId);
    if (missingMaterial.length > 0) {
      setToast({
        message: `${missingMaterial.length} RFQ line(s) could not be matched to Product Master. Fix materials before converting.`,
        variant: "info",
      });
      return;
    }
    const subTotal = items.reduce((sum, line) => sum + line.totalAmount, 0);
    const taxAmount = Math.round(subTotal * 0.18);
    const ct = rfq.commercialTerms;

    setIsConvertingPO(true);
    try {
      const created = await psPurchaseOrderService.create({
        orderDate: new Date().toISOString().slice(0, 10),
        linkedPR: rfq.linkedPR?.trim() || undefined,
        linkedRFQ: rfq.rfqNumber,
        department: rfq.department,
        buyerName: resolveBuyerName(rfq.buyer),
        vendorName,
        contactPerson: supplier?.contactPerson || vendorName,
        gstin: supplier?.gstin || "—",
        vendorAddress: supplier?.address || ct.deliveryAddress || "—",
        vendorPhone: supplier?.phone || "—",
        shipToWarehouse: ct.deliveryLocation || "Central Stores",
        dockGate: "Receiving Dock",
        expectedDeliveryDate: bid.deliveryDate || rfq.closingDate || new Date().toISOString().slice(0, 10),
        freightTerms: "FOB Destination",
        paymentTerms: bid.paymentTerms || ct.paymentTerms || "Net 30 Days post GRN",
        paymentDueDays: 30,
        discountPercent: 0,
        currency: ct.currency || "INR",
        taxTerms: ct.tax || "18% GST",
        subTotal,
        taxAmount,
        totalAmount: subTotal + taxAmount,
        status: "Pending Approval",
        items,
        attachments: [],
        approvalHistory: [
          {
            level: "Level 1",
            approver: resolveBuyerName(rfq.buyer),
            action: "Submitted",
            timestamp: new Date().toISOString().slice(0, 10),
            comments: `Auto-generated from ${rfq.rfqNumber}`,
          },
        ],
        activityTimeline: [
          {
            stage: "PO Created from RFQ",
            timestamp: new Date().toISOString().slice(0, 10),
            note: rfq.linkedPR?.trim()
              ? `Converted from ${rfq.rfqNumber} · linked PR ${rfq.linkedPR}`
              : `Converted from ${rfq.rfqNumber} · direct procurement (no PR)`,
            author: resolveBuyerName(rfq.buyer),
          },
        ],
      });

      await reload();
      setConvertPOModalRFQ(null);
      setToast({
        message: `Purchase Order ${created.poNumber} created${rfq.linkedPR?.trim() ? ` (PR ${rfq.linkedPR})` : ""}`,
        variant: "success",
      });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "PO conversion failed", variant: "info" });
    } finally {
      setIsConvertingPO(false);
    }
  };

  const handleSendRFQDirect = async (rfq: RFQRecord) => {
    try {
      await psRfqService.update(rfq.id, { status: "Sent" });
      await reload();
    setToast({ message: "RFQ Sent Successfully", variant: "success" });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Send failed", variant: "info" });
    }
  };

  // Send Reminder Handler
  const handleSendReminder = (rfq: RFQRecord) => {
    setToast({ message: `Reminder sent to ${rfq.invitedVendors.length} invited vendors.`, variant: "info" });
  };

  // Cancel RFQ Handler
  const handleCancelRFQ = async (rfq: RFQRecord) => {
    try {
      await psRfqService.update(rfq.id, { status: "Cancelled" });
      await reload();
    setToast({ message: `RFQ ${rfq.rfqNumber} has been cancelled.`, variant: "info" });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Cancel failed", variant: "info" });
    }
  };

  const handlePreviewAttachment = (att: RFQAttachment | PurchaseAttachmentRecord) => {
    setPreviewAttachment({
      id: att.id,
      fileName: att.fileName,
      fileSize: att.fileSize,
      fileType: (att.fileType as any) || "PDF",
      dataUrl: att.dataUrl,
      previewUrl: att.previewUrl,
      mimeType: att.mimeType,
      uploadedBy: att.uploadedBy,
      uploadedOn: att.uploadedOn,
    });
  };

  // Confirm Vendors Selection from Vendor Modal
  const handleConfirmVendorModal = () => {
    const selected = selectedVendorIds.map((id) => ({
      id,
      vendorName: "",
      email: "",
      phone: "",
      invitationSentOn: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      status: "Pending" as const,
    }));
    setFormVendors(selected);
    setVendorModalOpen(false);
    setToast({ message: `Added ${selected.length} vendors to RFQ.`, variant: "success" });
  };

  // Save RFQ Form Handler
  const handleSaveRFQ = async (isSend: boolean) => {
    if (!formPR) {
      setToast({ message: "Select a Linked Purchase Requisition.", variant: "info" });
      return;
    }
    if (formPR !== editRFQ?.linkedPR?.trim() && !fulfillmentByPr.get(formPR)?.canCreateRfq) {
      setToast({
        message: `${formPR} is not open for a new RFQ (it already has an open RFQ or nothing left to source).`,
        variant: "info",
      });
      return;
    }
    if (isSend) {
      const missing = [
        !(formBuyer || user?.id) && "Buyer",
        !formRFQDate && "RFQ Date",
        !formClosingDate && "Closing Date",
        !formPriority && "Priority",
        formRequestedItems.length === 0 && "Requested Items",
      ].filter(Boolean);
      if (missing.length > 0) {
        setToast({ message: `Fill required fields before sending: ${missing.join(", ")}.`, variant: "info" });
        return;
      }
    }
    if (formRFQDate && formRFQDate < todayStr) {
      setToast({ message: "RFQ Date cannot be in the past. Select today or a future date.", variant: "info" });
      return;
    }
    if (formClosingDate && formClosingDate < (formRFQDate || todayStr)) {
      setToast({ message: "Closing Date cannot be in the past or before the RFQ Date.", variant: "info" });
      return;
    }

    const effectiveBuyer = formBuyer || user?.id || "";
    if (!effectiveBuyer) {
      setToast({ message: "Buyer is required. Please sign in again.", variant: "info" });
      return;
    }
    const effectiveRfqDate = formRFQDate || todayStr;
    const effectiveClosingDate = formClosingDate || effectiveRfqDate;

    const newRecord: Partial<RFQRecord> = {
      linkedPR: formPR,
      department: selectedPR?.department ?? "General",
      buyer: effectiveBuyer,
      invitedVendors: formVendors.map((v) => toStoredRfqVendor(v)) as unknown as RFQVendorItem[],
      closingDate: effectiveClosingDate,
      rfqDate: effectiveRfqDate,
      priority: formPriority || "Medium",
      status: isSend ? "Sent" : "Draft",
      requestedItems: formRequestedItems.map((item, i) => normalizeRfqRequestedItem(item, i)),
      commercialTerms: {
        deliveryLocation: formDeliveryLoc.trim(),
        deliveryAddress: formDeliveryAddr.trim(),
        paymentTerms: formPayTerms.trim(),
        currency: formCurrency.trim(),
        expectedDelivery: formExpDelivery.trim(),
        tax: formTax.trim(),
        remarks: formRemarks || "",
      },
      comparisonData: editRFQ?.comparisonData ?? [],
      activityTimeline: [
        ...(editRFQ?.activityTimeline ?? []),
        {
          stage: isSend ? "Sent" : "Draft",
          timestamp: new Date().toISOString().slice(0, 10),
          note: isSend
            ? formVendors.length > 0
              ? `RFQ sent to ${formVendors.length} invited vendor(s)`
              : "RFQ issued and published"
            : "RFQ saved as draft",
          author: effectiveBuyer,
        },
      ],
    };

    setSaving(true);
    try {
    if (editRFQ) {
        await psRfqService.update(editRFQ.id, newRecord);
      setEditRFQ(null);
      setToast({ message: "RFQ Saved Successfully", variant: "success" });
    } else {
        await psRfqService.create(newRecord);
      setCreateDrawerOpen(false);
      setToast({
        message: isSend ? "RFQ Sent Successfully" : "RFQ Saved Successfully",
        variant: "success",
      });
      }
      await reload();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Save failed", variant: "info" });
    } finally {
      setSaving(false);
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
            onClick: () => openCompareForRfq(rfq),
          },
          { label: "Edit", icon: <Edit className="h-3.5 w-3.5" />, onClick: () => setEditRFQ(rfq) },
        ];
      case "Quotes Received":
        return [
          view,
          {
            label: "Compare Quotations",
            icon: <FileSpreadsheet className="h-3.5 w-3.5" />,
            onClick: () => openCompareForRfq(rfq),
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
          ...(canCreatePoFromRfq(rfq)
            ? [
                {
                  label: "Create PO",
                  icon: <ShoppingCart className="h-3.5 w-3.5" />,
                  onClick: () => setConvertPOModalRFQ(rfq),
                },
              ]
            : []),
        ];
      case "Converted to PO":
      case "Closed":
        return [
          view,
          ...(rfq.poNumber?.trim()
            ? [
                {
                  label: "View PO",
                  icon: <FileCheck className="h-3.5 w-3.5" />,
                  onClick: () => setViewPODrawerRFQ(rfq),
                },
              ]
            : []),
        ];
      case "Cancelled":
      default:
        return [view];
    }
  };

  const renderPoAction = (rfq: RFQRecord) => {
    if (rfq.poNumber?.trim()) {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setViewPODrawerRFQ(rfq);
          }}
          title="View purchase order"
          className="group inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 font-mono text-[11px] font-semibold text-teal-700 hover:bg-teal-50"
        >
          <FileCheck className="h-3.5 w-3.5" />
          <span className="group-hover:underline">{rfq.poNumber}</span>
        </button>
      );
    }
    if (canCreatePoFromRfq(rfq)) {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setConvertPOModalRFQ(rfq);
          }}
          className="inline-flex items-center gap-1 rounded-md border border-emerald-600 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-600 hover:text-white"
        >
          <ShoppingCart className="h-3 w-3" /> Create PO
        </button>
      );
    }
    return <span className="text-slate-300">—</span>;
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
      {toast && (
        <AlertBanner
          variant={toast.variant}
          message={toast.message}
          onDismiss={() => setToast(null)}
        />
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
              onClick={openCreateDrawer}
              className="!bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white flex items-center justify-center gap-1.5 rounded-xl h-8 px-3.5 text-xs font-bold shrink-0 shadow-xs cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <Plus className="h-3.5 w-3.5" /> Create RFQ
            </Button>
          </div>
        }
      />

      {/* 6 Summary KPI Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-20 rounded-2xl border border-slate-200 bg-white p-4 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
          <StatMiniCard label="Total RFQs" value={`${metrics.total}`} icon={FileText} accent="#10b981" />
          <StatMiniCard label="Draft" value={`${metrics.draft}`} icon={Clock} accent="#64748b" />
          <StatMiniCard label="Sent" value={`${metrics.sent}`} icon={Send} accent="#d97706" />
          <StatMiniCard label="Quotes Received" value={`${metrics.quotesReceived}`} icon={FileCheck} accent="#0284c7" />
          <StatMiniCard label="Vendor Selected" value={`${metrics.vendorSelected}`} icon={CheckCircle2} accent="#059669" />
          <StatMiniCard label="Converted to PO" value={`${metrics.convertedToPo}`} icon={ShoppingCart} accent="#0d9488" />
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
          { id: "all", label: "All", count: metrics.total },
          { id: "draft", label: "Draft", count: metrics.draft },
          { id: "sent", label: "Sent", count: metrics.sent },
          { id: "quotes received", label: "Quotes Received", count: metrics.quotesReceived },
          { id: "vendor selected", label: "Vendor Selected", count: metrics.vendorSelected },
          { id: "converted to po", label: "Converted to PO", count: metrics.convertedToPo },
          { id: "closed", label: "Closed", count: metrics.closed },
          ...(metrics.cancelled > 0 ? [{ id: "cancelled", label: "Cancelled", count: metrics.cancelled }] : []),
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
          onClick={openCreateDrawer}
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
              <option value="quotes received">Quotes Received</option>
              <option value="vendor selected">Vendor Selected</option>
              <option value="converted to po">Converted to PO</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
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

      {/* RFQ Main Table */}
      <div className="space-y-2">
        <div className="max-h-[600px] overflow-auto rounded-xl border border-slate-200 bg-white scrollbar-thin">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50/95 text-[11px] font-medium text-slate-500 backdrop-blur">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                    aria-label="Select all RFQs"
                  />
                </th>
                <th className="px-4 py-3 font-medium">RFQ</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Vendors</th>
                <th className="px-4 py-3 font-medium">Quotes Due</th>
                <th className="px-4 py-3 font-medium">Selected Vendor</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Purchase Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="px-4 py-4">
                      <div className="h-4 w-full rounded-md bg-slate-200" />
                    </td>
                  </tr>
                ))
              ) : filteredRFQs.length > 0 ? (
                filteredRFQs.map((rfq) => {
                  const invited = rfq.invitedVendors.length;
                  const quoted = rfq.comparisonData.length;
                  const hint = closingHint(rfq);
                  const priorityDot = PROCUREMENT_PRIORITY_OPTIONS.find((o) => o.value === rfq.priority)?.dot;
                  const isSelected = selectedIds.has(rfq.id);
                  return (
                    <tr
                      key={rfq.id}
                      className={cn(
                        "cursor-pointer transition-colors",
                        isSelected ? "bg-emerald-50/50" : "hover:bg-slate-50/70",
                      )}
                      onClick={() => setSelectedRFQ(rfq)}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(rfq.id)}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                          aria-label={`Select ${rfq.rfqNumber}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn("h-2 w-2 shrink-0 rounded-full", priorityDot ?? "bg-slate-300")}
                            title={`${rfq.priority} priority`}
                          />
                          <span className="font-mono text-[12px] font-semibold text-slate-900">{rfq.rfqNumber}</span>
                        </div>
                        <p className="mt-0.5 pl-3.5 font-mono text-[11px] text-slate-400">
                          {rfq.linkedPR?.trim() ? (
                            <span className="text-emerald-700">{rfq.linkedPR}</span>
                          ) : (
                            "No linked PR"
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{rfq.department || "—"}</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">{resolveBuyerName(rfq.buyer) || "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        {invited === 0 ? (
                          <span className="text-slate-300">None invited</span>
                        ) : (
                          <div className="w-24">
                            <p className="text-[11px] text-slate-600">
                              <span className="font-semibold text-slate-900">{quoted}</span>/{invited} quoted
                            </p>
                            <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${Math.min(100, (quoted / invited) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <p className="text-slate-700">{formatShortDate(rfq.closingDate)}</p>
                        {hint && <p className={cn("mt-0.5 text-[11px] font-medium", hint.className)}>{hint.label}</p>}
                      </td>
                      <td className="max-w-[200px] px-4 py-3">
                        {rfq.selectedVendor ? (
                          <span className="block truncate font-medium text-slate-900" title={displaySelectedVendor(rfq) ?? ""}>
                            {displaySelectedVendor(rfq)}
                          </span>
                        ) : (
                          <span className="text-slate-300">Not selected</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{renderStatusBadge(rfq.status)}</td>
                      <td className="px-4 py-3">{renderPoAction(rfq)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-14 text-center">
                    <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-300 ring-1 ring-slate-200">
                      <FileText className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No RFQs found</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {search || statusFilter !== "all" || activeFilterCount > 0
                        ? "Try a different search or clear the filters."
                        : "Create your first RFQ to invite vendor quotations."}
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

      {/* VIEW RFQ DRAWER */}
      {selectedRFQ && (() => {
        const rfq = selectedRFQ;
        const vendors = rfq.invitedVendors.map(enrichInvitedVendor);
        const bids = rfq.comparisonData ?? [];
        const quotedCount = vendors.filter((v) => v.status === "Responded").length;
        const itemsTotal = rfq.requestedItems.reduce((sum, item) => sum + item.quantity * item.estimatedRate, 0);
        const selectedBid = selectedBidFor(rfq);
        const selectedVendorName = displaySelectedVendor(rfq);
        const priority = PROCUREMENT_PRIORITY_OPTIONS.find((o) => o.value === rfq.priority);
        const hint = closingHint(rfq);
        const collectingQuotes = rfq.status === "Sent" || rfq.status === "Quotes Received";
        const poNumber = rfq.poNumber?.trim();
        const terms = rfq.commercialTerms;
        const termRows: { label: string; value?: string; wide?: boolean }[] = [
          { label: "Delivery Location", value: terms.deliveryLocation },
          { label: "Expected Delivery", value: terms.expectedDelivery ? formatShortDate(terms.expectedDelivery) : "" },
          { label: "Payment Terms", value: terms.paymentTerms },
          { label: "Tax Terms", value: terms.tax },
          { label: "Currency", value: terms.currency },
          { label: "Delivery Address", value: terms.deliveryAddress, wide: true },
          ...(terms.remarks ? [{ label: "Remarks", value: terms.remarks, wide: true }] : []),
        ];

        return (
          <Drawer
            side="bottom"
            open={!!selectedRFQ}
            onClose={() => setSelectedRFQ(null)}
            title={`RFQ ${rfq.rfqNumber}`}
            width="xl"
            customHeader={
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 id="drawer-title" className="font-mono text-base font-bold text-slate-900 sm:text-lg">
                      {rfq.rfqNumber}
                    </h2>
                    {renderStatusBadge(rfq.status)}
                    {priority && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                          priority.active,
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", priority.dot)} />
                        {priority.value} priority
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-slate-500">
                    {rfq.department} · {rfq.linkedPR?.trim() ? `Sourcing ${rfq.linkedPR}` : "Direct procurement"} · Buyer{" "}
                    {resolveBuyerName(rfq.buyer)}
                  </p>
                </div>
              </div>
            }
            footer={
              <div className="flex w-full flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  <strong className="text-slate-800">{rfq.requestedItems.length}</strong> item
                  {rfq.requestedItems.length === 1 ? "" : "s"} · Estimated{" "}
                  <strong className="text-slate-800">₹{itemsTotal.toLocaleString("en-IN")}</strong> ·{" "}
                  <strong className="text-slate-800">
                    {quotedCount}/{vendors.length}
                  </strong>{" "}
                  quoted
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedRFQ(null)}
                    className="h-9 px-4 text-xs font-semibold !bg-white hover:!bg-slate-100 text-slate-700 border-slate-300 rounded-xl cursor-pointer"
                  >
                    Close
                  </Button>
                  {collectingQuotes && bids.length > 0 && (
                    <Button
                      type="button"
                      onClick={() => openCompareForRfq(rfq)}
                      className="h-9 px-4 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" /> Compare & Select Vendor
                    </Button>
                  )}
                  {canCreatePoFromRfq(rfq) && (
                    <Button
                      type="button"
                      onClick={() => setConvertPOModalRFQ(rfq)}
                      className="h-9 px-4 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" /> Create PO
                    </Button>
                  )}
                  {poNumber && (
                    <Button
                      type="button"
                      onClick={() => setViewPODrawerRFQ(rfq)}
                      className="h-9 px-4 text-xs font-bold !bg-teal-700 hover:!bg-teal-800 text-white rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <FileCheck className="h-3.5 w-3.5" /> View PO · {poNumber}
                    </Button>
                  )}
                </div>
              </div>
            }
          >
            <div className="grid gap-5 pb-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
              <div className="min-w-0 space-y-5">
                {collectingQuotes && bids.length === 0 && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      Waiting on quotations. Use <strong>Record Quote</strong> on each vendor below, then compare and select the
                      winning vendor.
                    </p>
                  </div>
                )}

                <RfqDetailSection
                  title="Requested Items"
                  meta={rfq.linkedPR?.trim() ? `From ${rfq.linkedPR}` : undefined}
                  flush
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-y border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-500">
                          <th className="px-5 py-2.5 font-medium">Item</th>
                          <th className="px-3 py-2.5 text-right font-medium">Qty</th>
                          <th className="px-3 py-2.5 text-right font-medium">Est. Rate</th>
                          <th className="px-5 py-2.5 text-right font-medium">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rfq.requestedItems.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-5 py-6 text-center text-xs text-slate-400">
                              No items on this RFQ.
                            </td>
                          </tr>
                        ) : (
                          rfq.requestedItems.map((item, idx) => (
                            <tr key={item.id || `item-${idx}`}>
                              <td className="px-5 py-3">
                                <p className="font-medium text-slate-900">{item.item}</p>
                                <p className="text-xs text-slate-500">
                                  {item.category}
                                  {item.productCode ? ` · ${item.productCode}` : ""}
                                </p>
                              </td>
                              <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-slate-700">
                                {item.quantity} <span className="text-xs text-slate-400">{item.unit}</span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-slate-700">
                                ₹{item.estimatedRate.toLocaleString("en-IN")}
                              </td>
                              <td className="whitespace-nowrap px-5 py-3 text-right font-medium tabular-nums text-slate-900">
                                ₹{(item.quantity * item.estimatedRate).toLocaleString("en-IN")}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {rfq.requestedItems.length > 0 && (
                        <tfoot>
                          <tr className="border-t border-slate-200 bg-slate-50/70">
                            <td colSpan={3} className="px-5 py-2.5 text-right text-xs font-medium text-slate-500">
                              Estimated total
                            </td>
                            <td className="whitespace-nowrap px-5 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                              ₹{itemsTotal.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </RfqDetailSection>

                <RfqDetailSection
                  title="Invited Vendors"
                  meta={vendors.length > 0 ? `${quotedCount} of ${vendors.length} quoted` : undefined}
                  flush
                >
                  {vendors.length > 0 ? (
                    <ul className="divide-y divide-slate-100 border-t border-slate-100">
                      {vendors.map((v, idx) => {
                        const bid = bids.find((c) => c.vendorId === v.id);
                        const isSelected = Boolean(rfq.selectedVendor) && rfq.selectedVendor === v.id;
                        const responded = v.status === "Responded";
                        const initials = v.vendorName
                          .split(/\s+/)
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((w) => w[0])
                          .join("")
                          .toUpperCase();
                        return (
                          <li
                            key={v.id || `vendor-${idx}`}
                            className={cn(
                              "flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3",
                              isSelected && "bg-emerald-50/60",
                            )}
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <span
                                className={cn(
                                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                                  isSelected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600",
                                )}
                              >
                                {initials || "?"}
                              </span>
                              <div className="min-w-0">
                                <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-slate-900">
                                  <span className="truncate">{v.vendorName}</span>
                                  {isSelected && (
                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                      <Award className="h-3 w-3" />
                                      Selected
                                    </span>
                                  )}
                                </p>
                                <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                                  {v.email && (
                                    <span className="inline-flex min-w-0 items-center gap-1">
                                      <Mail className="h-3 w-3 shrink-0" />
                                      <span className="truncate">{v.email}</span>
                                    </span>
                                  )}
                                  {v.phone && (
                                    <span className="inline-flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {v.phone}
                                    </span>
                                  )}
                                  {v.invitationSentOn && <span>Invited {formatShortDate(v.invitationSentOn)}</span>}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="w-32 text-right">
                                {bid ? (
                                  <>
                                    <p className="text-sm font-semibold tabular-nums text-slate-900">
                                      ₹{bid.totalAmount.toLocaleString("en-IN")}
                                    </p>
                                    <p className="text-xs text-slate-500">Delivery {formatBidDelivery(bid)}</p>
                                  </>
                                ) : (
                                  <p className="text-xs text-slate-400">No quote yet</p>
                                )}
                              </div>
                              <span
                                className={cn(
                                  "inline-flex w-24 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                                  responded
                                    ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                                    : "bg-amber-50 text-amber-800 ring-amber-200",
                                )}
                              >
                                <span className={cn("h-1.5 w-1.5 rounded-full", responded ? "bg-emerald-500" : "bg-amber-500")} />
                                {v.status}
                              </span>
                              {collectingQuotes && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => openRecordQuoteModal(rfq, v)}
                                  className="h-8 w-28 rounded-lg px-3 text-xs font-medium cursor-pointer"
                                >
                                  {responded ? "Edit Quote" : "Record Quote"}
                                </Button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="border-t border-slate-100 px-5 py-6 text-center text-xs text-slate-400">No vendors invited.</p>
                  )}
                </RfqDetailSection>

                <RfqDetailSection title="Commercial Terms">
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
                    {termRows.map((row) => (
                      <div key={row.label} className={cn("min-w-0", row.wide && "sm:col-span-2 xl:col-span-3")}>
                        <dt className="text-xs text-slate-500">{row.label}</dt>
                        <dd
                          className={cn(
                            "mt-0.5 whitespace-pre-line break-words text-sm",
                            row.value ? "font-medium text-slate-900" : "text-slate-300",
                          )}
                        >
                          {row.value || "Not specified"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </RfqDetailSection>

                {rfq.attachments.length > 0 && (
                  <RfqDetailSection title="Attachments" meta={`${rfq.attachments.length}`}>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {rfq.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <Paperclip className="h-4 w-4 shrink-0 text-slate-400" />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-slate-800">{att.fileName}</p>
                              <p className="text-[11px] text-slate-400">{att.fileSize}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handlePreviewAttachment(att)}
                            className="shrink-0 cursor-pointer rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-100"
                          >
                            Preview
                          </button>
                        </div>
                      ))}
                    </div>
                  </RfqDetailSection>
                )}
              </div>

              <aside className="space-y-5 lg:sticky lg:top-0">
                <section className="rounded-xl border border-slate-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-slate-900">Summary</h3>
                  <dl className="mt-4 space-y-3 text-xs">
                    <ProcurementSummaryRow
                      icon={<CalendarDays className="h-3.5 w-3.5" />}
                      label="RFQ date"
                      value={rfq.rfqDate ? formatShortDate(rfq.rfqDate) : ""}
                    />
                    <div className="flex items-center justify-between gap-3">
                      <dt className="flex shrink-0 items-center gap-1.5 text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        Quotes due
                      </dt>
                      <dd className={cn("text-right font-medium", rfq.closingDate ? "text-slate-900" : "text-slate-300")}>
                        {rfq.closingDate ? formatShortDate(rfq.closingDate) : "Not set"}
                        {hint && <span className={cn("ml-1.5 font-normal", hint.className)}>· {hint.label}</span>}
                      </dd>
                    </div>
                    <ProcurementSummaryRow
                      icon={<Building2 className="h-3.5 w-3.5" />}
                      label="Department"
                      value={rfq.department}
                    />
                    <ProcurementSummaryRow
                      icon={<User className="h-3.5 w-3.5" />}
                      label="Buyer"
                      value={resolveBuyerName(rfq.buyer)}
                    />
                    <ProcurementSummaryRow
                      icon={<FileText className="h-3.5 w-3.5" />}
                      label="Linked PR"
                      value={rfq.linkedPR?.trim() || "Direct procurement"}
                      valueClassName={rfq.linkedPR?.trim() ? "font-mono text-emerald-700" : undefined}
                    />
                    <ProcurementSummaryRow
                      icon={<ShoppingCart className="h-3.5 w-3.5" />}
                      label="Purchase order"
                      value={poNumber}
                      valueClassName="font-mono text-teal-700"
                    />
                  </dl>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <p className="text-xs text-slate-500">Selected vendor</p>
                    {selectedVendorName ? (
                      <>
                        <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm font-semibold text-slate-900">
                          <Award className="h-4 w-4 shrink-0 text-emerald-600" />
                          <span className="truncate">{selectedVendorName}</span>
                        </p>
                        {selectedBid && (
                          <p className="mt-0.5 text-xs text-slate-500">
                            Quoted ₹{selectedBid.totalAmount.toLocaleString("en-IN")} · Delivery {formatBidDelivery(selectedBid)}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="mt-1 text-sm text-slate-400">Not selected yet</p>
                    )}
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-slate-900">Activity</h3>
                  {rfq.activityTimeline.length > 0 ? (
                    <ol className="mt-4">
                      {rfq.activityTimeline.map((item, idx) => {
                        const isDone = item.timestamp !== "Pending";
                        return (
                          <li key={idx} className="relative flex gap-3 pb-4 last:pb-0">
                            {idx !== rfq.activityTimeline.length - 1 && (
                              <span className="absolute bottom-0 left-[9px] top-5 w-px bg-slate-200" aria-hidden />
                            )}
                            <span
                              className={cn(
                                "relative z-10 mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full",
                                isDone ? "bg-emerald-600 text-white" : "border border-slate-300 bg-white",
                              )}
                            >
                              {isDone && <Check className="h-3 w-3" />}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className={cn("text-xs font-medium", isDone ? "text-slate-900" : "text-slate-400")}>
                                {item.stage}
                              </p>
                              {item.note && <p className="mt-0.5 text-xs text-slate-500">{item.note}</p>}
                              <p className="mt-0.5 text-[11px] text-slate-400">
                                {item.timestamp}
                                {item.author ? ` · ${resolveBuyerName(item.author)}` : ""}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  ) : (
                    <p className="mt-3 text-xs text-slate-400">No activity yet.</p>
                  )}
                </section>
              </aside>
            </div>
          </Drawer>
        );
      })()}

      {/* LARGE RIGHT-SIDE DRAWER: CREATE / EDIT RFQ (SAP FIORI / ENTERPRISE ERP STYLE) */}
      <Drawer
        side="bottom"
        open={createDrawerOpen || !!editRFQ}
        onClose={() => {
          setCreateDrawerOpen(false);
          setEditRFQ(null);
        }}
        title={editRFQ ? `Edit RFQ: ${editRFQ.rfqNumber}` : "Create Request for Quotation (RFQ)"}
        width="responsive"
        customHeader={
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                  {editRFQ ? `Edit RFQ ${editRFQ.rfqNumber}` : "New Request for Quotation"}
                </h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                  {editRFQ?.status ?? "Draft"}
                </span>
              </div>
              <p className="truncate text-xs text-slate-500">
                Invite vendors to quote against an approved purchase requisition.
              </p>
            </div>
          </div>
        }
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              <strong className="text-slate-800">{formRequestedItems.length}</strong> item
              {formRequestedItems.length === 1 ? "" : "s"} · <strong className="text-slate-800">{formVendors.length}</strong>{" "}
              vendor{formVendors.length === 1 ? "" : "s"} invited
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
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
                disabled={saving}
                onClick={() => handleSaveRFQ(false)}
                className="h-9 px-4 text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Save Draft
              </Button>
              <Button
                type="button"
                disabled={saving}
                onClick={() => handleSaveRFQ(true)}
                className="h-9 px-5 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Send to Vendors
              </Button>
            </div>
          </div>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveRFQ(true);
          }}
          className="grid gap-5 pb-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start"
        >
          <div className="min-w-0 space-y-5">
            {/* RFQ DETAILS */}
            <ProcurementFormSection step={1} title="RFQ Details" subtitle="Source requisition, dates and urgency">
              <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2.2fr)]">
                <div className="sm:col-span-2">
                  <FormField label="Linked Purchase Requisition" required>
                    <SelectInput
                      value={formPR}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handlePRSelectionChange(e.target.value)}
                      className={cn("block h-10 text-sm", !formPR && "text-slate-400")}
                      disabled={loadingPRs || eligiblePRs.length === 0}
                    >
                      <option value="" disabled>
                        {loadingPRs
                          ? "Loading requisitions…"
                          : eligiblePRs.length === 0
                            ? "No approved requisitions available"
                            : "Select an approved requisition"}
                      </option>
                      {eligiblePRs.map((pr) => (
                        <option key={pr.id} value={pr.prNumber}>
                          {prOptionLabel(pr)}
                        </option>
                      ))}
                    </SelectInput>
                  </FormField>
                  {!loadingPRs && eligiblePRs.length === 0 && (
                    <p className="mt-1.5 text-[11px] text-amber-700">
                      Approve a purchase requisition first — only approved PRs with remaining quantity can be sourced.
                    </p>
                  )}
                </div>

                <FormField label="Buyer" required>
                  <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{resolveBuyerName(formBuyer || user?.id) || "—"}</span>
                  </div>
                </FormField>

                <FormField label="RFQ Date" required>
                  <TextInput
                    type="date"
                    min={todayStr}
                    value={formRFQDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const val = e.target.value;
                      setFormRFQDate(val);
                      if (formClosingDate && val && val > formClosingDate) {
                        setFormClosingDate(val);
                      }
                    }}
                    className="h-10 text-sm"
                  />
                </FormField>

                <FormField label="Quotes Due By" required>
                  <TextInput
                    type="date"
                    min={formRFQDate || todayStr}
                    value={formClosingDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormClosingDate(e.target.value)}
                    className="h-10 text-sm"
                  />
                </FormField>

                <div className="sm:col-span-2 xl:col-span-1">
                  <span className="mb-1.5 block text-xs font-medium text-slate-600">
                    Priority <span className="text-red-500">*</span>
                  </span>
                  <PrioritySelector value={formPriority} onChange={setFormPriority} />
                </div>
              </div>
            </ProcurementFormSection>

            {/* ITEMS */}
            <ProcurementFormSection
              step={2}
              title="Items to Quote"
              subtitle={formPR ? `Loaded from ${formPR} · quantities still to be ordered` : "Loaded automatically from the selected requisition"}
            >
              {formRequestedItems.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-8 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 ring-1 ring-slate-200">
                    <Package className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">No items yet</p>
                  <p className="max-w-xs text-xs text-slate-500">Select a linked requisition above to load its items.</p>
                </div>
              ) : (
                <>
                  <div className="hidden overflow-hidden rounded-xl border border-slate-200 sm:block">
                    <div className="max-h-[300px] overflow-y-auto">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          <tr className="border-b border-slate-200">
                            <th className="px-3 py-2.5">Item</th>
                            <th className="w-28 px-3 py-2.5 text-right">Quantity</th>
                            <th className="w-28 px-3 py-2.5 text-right">Est. Rate</th>
                            <th className="w-32 px-3 py-2.5 text-right">Est. Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {formRequestedItems.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/60">
                              <td className="px-3 py-2.5">
                                <p className="font-semibold text-slate-900">{item.item}</p>
                                <p className="text-[11px] text-slate-500">{item.category || "General"}</p>
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold text-slate-900">
                                {item.quantity} <span className="font-normal text-slate-500">{item.unit}</span>
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 text-right text-slate-700">
                                ₹{item.estimatedRate.toLocaleString("en-IN")}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold text-slate-900">
                                ₹{(item.quantity * item.estimatedRate).toLocaleString("en-IN")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-slate-200 bg-slate-50/70">
                            <td colSpan={3} className="px-3 py-2.5 text-right text-xs font-medium text-slate-500">
                              Estimated Value
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-right text-sm font-bold text-emerald-800">
                              ₹{formEstimatedValue.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-2.5 sm:hidden">
                    {formRequestedItems.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-xs">
                        <div>
                          <p className="font-semibold text-slate-900">{item.item}</p>
                          <p className="text-[11px] text-slate-500">
                            {item.quantity} {item.unit} · ₹{item.estimatedRate.toLocaleString("en-IN")}
                          </p>
                        </div>
                        <p className="font-semibold text-slate-900">
                          ₹{(item.quantity * item.estimatedRate).toLocaleString("en-IN")}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </ProcurementFormSection>

            {/* VENDORS */}
            <ProcurementFormSection
              step={3}
              title="Invite Vendors"
              subtitle="Suppliers who will receive this RFQ"
              action={
                formVendors.length > 0 ? (
                  <Button
                    type="button"
                    onClick={() => {
                      setSelectedVendorIds(formVendors.map((v) => v.id));
                      setVendorModalOpen(true);
                    }}
                    className="h-8 px-3 text-xs font-semibold !bg-emerald-700 hover:!bg-emerald-800 text-white rounded-lg cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Vendor
                  </Button>
                ) : undefined
              }
            >
              {formVendors.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-8 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 ring-1 ring-slate-200">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">No vendors invited</p>
                  <p className="max-w-xs text-xs text-slate-500">Invite at least one supplier to collect quotations.</p>
                  <Button
                    type="button"
                    onClick={() => {
                      setSelectedVendorIds([]);
                      setVendorModalOpen(true);
                    }}
                    className="mt-1 h-9 px-4 text-xs font-semibold !bg-emerald-700 hover:!bg-emerald-800 text-white rounded-lg cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" /> Invite Vendors
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {formVendors.map((raw) => {
                    const v = enrichInvitedVendor(raw);
                    const initials = v.vendorName
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase();
                    return (
                      <div
                        key={v.id}
                        className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition-colors hover:border-slate-300"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700">
                          {initials || "V"}
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-slate-900" title={v.vendorName}>
                              {v.vendorName}
                            </p>
                            <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                              {v.status || "Pending"}
                            </span>
                          </div>
                          <p className="flex items-center gap-1.5 truncate text-[11px] text-slate-500">
                            <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                            <span className="truncate">{v.email || "—"}</span>
                          </p>
                          <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                            {v.phone || "—"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormVendors(formVendors.filter((vendor) => vendor.id !== v.id))}
                          className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          aria-label={`Remove ${v.vendorName}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </ProcurementFormSection>

            {/* COMMERCIAL TERMS */}
            <ProcurementFormSection step={4} title="Commercial Terms" subtitle="Shared with every invited vendor">
              <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
                <FormField label="Delivery Location">
                  <TextInput
                    value={formDeliveryLoc}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormDeliveryLoc(e.target.value)}
                    placeholder="Central Warehouse / Main Kitchen"
                    className="h-10 text-sm"
                  />
                </FormField>
                <div className="sm:col-span-1 xl:col-span-2">
                  <FormField label="Delivery Address">
                    <TextInput
                      value={formDeliveryAddr}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormDeliveryAddr(e.target.value)}
                      placeholder="Street, area, city"
                      className="h-10 text-sm"
                    />
                  </FormField>
                </div>
                <FormField label="Payment Terms">
                  <TextInput
                    value={formPayTerms}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormPayTerms(e.target.value)}
                    placeholder="Net 30 days after GRN"
                    className="h-10 text-sm"
                  />
                </FormField>
                <FormField label="Expected Delivery">
                  <TextInput
                    value={formExpDelivery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormExpDelivery(e.target.value)}
                    placeholder="7 days from PO"
                    className="h-10 text-sm"
                  />
                </FormField>
                <FormField label="Currency">
                  <TextInput
                    value={formCurrency}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormCurrency(e.target.value)}
                    placeholder="INR (₹)"
                    className="h-10 text-sm"
                  />
                </FormField>
                <FormField label="Tax Terms">
                  <TextInput
                    value={formTax}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormTax(e.target.value)}
                    placeholder="GST extra as applicable (18%)"
                    className="h-10 text-sm"
                  />
                </FormField>
                <div className="sm:col-span-2 xl:col-span-3">
                  <FormField label="Remarks / Special Instructions">
                    <TextAreaInput
                      rows={3}
                      value={formRemarks}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormRemarks(e.target.value)}
                      placeholder="Packaging, brand preferences, sample requirements…"
                      className="w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </FormField>
                </div>
              </div>
            </ProcurementFormSection>
          </div>

          {/* LIVE SUMMARY */}
          <aside className="space-y-4 lg:sticky lg:top-0">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Summary</p>
              <dl className="space-y-2.5 text-xs">
                <ProcurementSummaryRow icon={<FileText className="h-3.5 w-3.5" />} label="Requisition" value={formPR} />
                <ProcurementSummaryRow
                  icon={<Building2 className="h-3.5 w-3.5" />}
                  label="Department"
                  value={eligiblePRs.find((pr) => pr.prNumber === formPR)?.department ?? ""}
                />
                <ProcurementSummaryRow icon={<Clock className="h-3.5 w-3.5" />} label="Quotes due" value={formClosingDate} />
                <ProcurementSummaryRow
                  icon={<Zap className="h-3.5 w-3.5" />}
                  label="Priority"
                  value={formPriority}
                  valueClassName={priorityTextClass(formPriority)}
                />
                <ProcurementSummaryRow
                  icon={<Package className="h-3.5 w-3.5" />}
                  label="Items"
                  value={formRequestedItems.length ? String(formRequestedItems.length) : ""}
                />
                <ProcurementSummaryRow
                  icon={<User className="h-3.5 w-3.5" />}
                  label="Vendors"
                  value={formVendors.length ? String(formVendors.length) : ""}
                />
              </dl>
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="text-[11px] text-slate-500">Estimated value</p>
                <p className="text-xl font-bold text-slate-900">₹{formEstimatedValue.toLocaleString("en-IN")}</p>
              </div>
            </div>
            <div className="rounded-xl bg-emerald-50/70 p-4 text-[11px] leading-relaxed text-emerald-900">
              Record each vendor&apos;s quote once received, select the best one, then create the purchase order from this RFQ.
            </div>
          </aside>
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
          {vendorOptions.map((v) => {
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

      {/* RECORD VENDOR QUOTATION MODAL */}
      {recordQuoteRFQ && recordQuoteVendor && (
        <Modal
          open={!!recordQuoteRFQ && !!recordQuoteVendor}
          onClose={() => {
            if (!savingQuote) {
              setRecordQuoteRFQ(null);
              setRecordQuoteVendor(null);
            }
          }}
          title={`Record Quotation — ${recordQuoteVendor.vendorName}`}
          description={`Enter commercial bid details for ${recordQuoteRFQ.rfqNumber}`}
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={savingQuote}
                onClick={() => {
                  setRecordQuoteRFQ(null);
                  setRecordQuoteVendor(null);
                }}
                className="h-9 px-4 text-xs font-bold !bg-slate-100 text-slate-700 rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={savingQuote}
                onClick={handleSaveVendorQuotation}
                className="h-9 px-4 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 text-white rounded-xl cursor-pointer inline-flex items-center gap-1.5"
              >
                {savingQuote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Save Quotation
              </Button>
            </div>
          }
        >
          <div className="space-y-4 select-none py-1">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
              <p className="font-bold text-slate-800">{recordQuoteVendor.vendorName}</p>
              <p className="text-slate-500">{recordQuoteVendor.email} · {recordQuoteVendor.phone}</p>
              <p className="text-[10px] text-slate-400 mt-1">Total quantity on RFQ: {quoteTotalQty} units</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Quoted Rate (₹/unit)" required>
                <TextInput
                  type="number"
                  min="0"
                  value={quoteUnitPrice}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuoteUnitPrice(e.target.value)}
                  className="h-9 text-xs"
                  placeholder="e.g. 340"
                />
              </FormField>
              <FormField label="Total Amount (₹)" required>
                <TextInput
                  type="number"
                  min="0"
                  value={quoteTotalAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuoteTotalAmount(e.target.value)}
                  className="h-9 text-xs"
                  placeholder="Auto-calculated"
                />
              </FormField>
              <FormField label="Delivery Date" required>
                <TextInput
                  type="date"
                  min={todayStr}
                  value={quoteDeliveryDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuoteDeliveryDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </FormField>
              <FormField label="Payment Terms">
                <TextInput
                  value={quotePaymentTerms}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuotePaymentTerms(e.target.value)}
                  className="h-9 text-xs"
                />
              </FormField>
              <FormField label="Warranty">
                <TextInput
                  value={quoteWarranty}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuoteWarranty(e.target.value)}
                  className="h-9 text-xs"
                />
              </FormField>
            </div>
          </div>
        </Modal>
      )}

      {/* COMPARE QUOTATIONS MODAL */}
      {compareModalRFQ && (
        <Modal
          open={!!compareModalRFQ}
          onClose={() => setCompareModalRFQ(null)}
          title={`Quotation Comparison Matrix: ${compareModalRFQ.rfqNumber}`}
          description={`Comparing vendor bids for ${compareModalRFQ.department} Department requisition.`}
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
                disabled={(compareModalRFQ.comparisonData?.length ?? 0) === 0 || !pickedVendorId}
                onClick={() => {
                  setVendorSelectReason("");
                  setSelectVendorModalRFQ(compareModalRFQ);
                  setCompareModalRFQ(null);
                }}
                className="h-9 px-4 text-xs font-bold !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white rounded-xl cursor-pointer disabled:opacity-50"
              >
                Select Vendor
              </Button>
            </div>
          }
        >
          <div className="space-y-4 select-none py-1">
            {(compareModalRFQ.comparisonData?.length ?? 0) > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                      <th className="px-3.5 py-3">Vendor</th>
                      <th className="px-3.5 py-3">Quoted Rate</th>
                      <th className="px-3.5 py-3">Delivery By</th>
                      <th className="px-3.5 py-3">Payment Terms</th>
                      <th className="px-3.5 py-3">Warranty</th>
                      <th className="px-3.5 py-3">Total Amount</th>
                      <th className="px-3.5 py-3 text-right">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {(compareModalRFQ.comparisonData ?? []).map((bid) => {
                      const bidName = resolveVendorName(bid.vendorId, bid.vendorName);
                      return (
                      <tr
                        key={bid.vendorId}
                        onClick={() => setPickedVendorId(bid.vendorId)}
                        className={cn(
                          "transition-colors cursor-pointer",
                          pickedVendorId === bid.vendorId
                            ? "bg-emerald-50/80 border-l-4 border-l-emerald-600"
                            : bid.isRecommended
                              ? "bg-emerald-50/40 hover:bg-slate-50/50"
                              : "hover:bg-slate-50/50",
                        )}
                      >
                        <td className="px-3.5 py-3 font-extrabold text-slate-900">{bidName}</td>
                        <td className="px-3.5 py-3 font-bold text-slate-800">₹{bid.unitPrice}</td>
                        <td className="px-3.5 py-3 text-slate-600">{formatBidDelivery(bid)}</td>
                        <td className="px-3.5 py-3 text-slate-600">{bid.paymentTerms}</td>
                        <td className="px-3.5 py-3 text-slate-600">{bid.warranty}</td>
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center space-y-2">
                <p className="text-xs text-slate-500 font-medium">No quotations recorded yet.</p>
                <p className="text-[11px] text-slate-400">
                  Open the RFQ detail drawer and use <strong>Record Quote</strong> on each vendor row.
                </p>
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
            {(() => {
              const bid =
                selectVendorModalRFQ.comparisonData.find((c) => c.vendorId === pickedVendorId) ??
                selectVendorModalRFQ.comparisonData.find((c) => c.isRecommended) ??
                selectVendorModalRFQ.comparisonData[0];
              if (!bid) return null;
              const bidName = resolveVendorName(bid.vendorId, bid.vendorName);
              return (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-emerald-700 font-bold uppercase">Selected Vendor</span>
              </div>
                  <p className="text-base font-extrabold text-slate-900">{bidName}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700 pt-1 border-t border-emerald-100">
                    <span>Delivery: {formatBidDelivery(bid)}</span>
                    <span>Rate: ₹{bid.unitPrice.toLocaleString("en-IN")}/unit</span>
                  </div>
              <div className="flex justify-between text-xs font-bold text-slate-700 pt-1 border-t border-emerald-100">
                <span>Quoted Amount:</span>
                    <span className="text-emerald-800 font-extrabold">₹{bid.totalAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>
              );
            })()}

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
          title="Create Purchase Order from RFQ"
          description="Generates a Purchase Order from the selected vendor's quotation."
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
                  <p className="font-extrabold text-slate-900">{displaySelectedVendor(convertPOModalRFQ) || "—"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Linked PR</span>
                  <p className="font-mono font-bold text-slate-800">
                    {convertPOModalRFQ.linkedPR?.trim() ? convertPOModalRFQ.linkedPR : "Direct Procurement"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Number of Items</span>
                  <p className="font-bold text-slate-800">{convertPOModalRFQ.requestedItems.length} Items</p>
                </div>
              </div>

              {(() => {
                const bid = selectedBidFor(convertPOModalRFQ);
                if (!bid) return null;
                const rate = quotedRateFor(convertPOModalRFQ, bid);
                const subTotal = convertPOModalRFQ.requestedItems.reduce((acc, i) => acc + i.quantity * rate, 0);
                return (
                  <>
                    <div className="grid grid-cols-3 gap-3 pt-1 border-t border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Quoted Rate</span>
                        <p className="font-bold text-slate-800">₹{rate.toLocaleString("en-IN")} / unit</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Sub Total</span>
                        <p className="font-bold text-slate-800">₹{Math.round(subTotal).toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Total (incl. 18% GST)</span>
                        <p className="font-extrabold text-emerald-800 text-sm">
                          ₹{(Math.round(subTotal) + Math.round(subTotal * 0.18)).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase text-slate-500 font-bold">
                            <th className="px-2.5 py-1.5">Item</th>
                            <th className="px-2.5 py-1.5">Qty</th>
                            <th className="px-2.5 py-1.5">Rate</th>
                            <th className="px-2.5 py-1.5 text-right">Line Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {convertPOModalRFQ.requestedItems.map((item, idx) => (
                            <tr key={item.id || `cpo-${idx}`}>
                              <td className="px-2.5 py-1.5 font-semibold text-slate-900">{item.item}</td>
                              <td className="px-2.5 py-1.5">
                                {item.quantity} {item.unit}
                              </td>
                              <td className="px-2.5 py-1.5">₹{rate.toLocaleString("en-IN")}</td>
                              <td className="px-2.5 py-1.5 text-right font-bold">
                                ₹{(item.quantity * rate).toLocaleString("en-IN")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Payment terms: {bid.paymentTerms || convertPOModalRFQ.commercialTerms.paymentTerms || "—"} · Delivery by{" "}
                      {bid.deliveryDate || "—"}
                    </p>
                  </>
                );
              })()}
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-900 font-medium">
              ℹ️ The PO uses the selected vendor, its quoted prices and the RFQ items. The RFQ will move to{" "}
              <strong>Converted to PO</strong> and keep a link to the new PO; no further PO can be created from it.
            </div>
          </div>
        </Modal>
      )}

      {/* VIEW PURCHASE ORDER DRAWER */}
      {viewPODrawerRFQ && (() => {
        const po = linkedPoFor(viewPODrawerRFQ);
        const poNumber = viewPODrawerRFQ.poNumber?.trim() || "";
        return (
          <Drawer
            side="bottom"
            open={!!viewPODrawerRFQ}
            onClose={() => setViewPODrawerRFQ(null)}
            title={`Purchase Order: ${poNumber || "—"}`}
            width="xl"
          >
            <div className="space-y-6 select-none pb-6">
              <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-extrabold text-teal-900">{poNumber || "—"}</span>
                  {po && (
                    <span className="px-2.5 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-emerald-600 text-white shadow-2xs">
                      {po.status}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Vendor: {po?.vendorName || displaySelectedVendor(viewPODrawerRFQ) || "—"}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Linked RFQ: {viewPODrawerRFQ.rfqNumber} · Linked PR: {viewPODrawerRFQ.linkedPR?.trim() || "Direct Procurement"}
                </p>
              </div>

              {!po ? (
                <AlertBanner
                  variant="info"
                  message={`${poNumber || "The linked PO"} could not be loaded. It may have been deleted, or the list is still loading.`}
                />
              ) : (
                <>
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 text-xs">
                    <div className="grid grid-cols-3 gap-3 border-b border-slate-100 pb-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Order Date</span>
                        <p className="font-bold text-slate-800">{po.orderDate || "—"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Expected Delivery</span>
                        <p className="font-bold text-slate-800">{po.expectedDeliveryDate || "—"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Buyer</span>
                        <p className="font-bold text-slate-800">{po.buyerName || "—"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 border-b border-slate-100 pb-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Sub Total</span>
                        <p className="font-bold text-slate-800">₹{po.subTotal.toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Tax</span>
                        <p className="font-bold text-slate-800">₹{po.taxAmount.toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Payment Terms</span>
                        <p className="font-bold text-slate-800">{po.paymentTerms || "—"}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-slate-500 font-medium">Total Purchase Order Value:</span>
                      <span className="font-extrabold text-emerald-800 text-base">
                        ₹{po.totalAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

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
                          {po.items.map((line, idx) => (
                            <tr key={line.id || `po-item-${idx}`}>
                              <td className="px-3 py-2.5 font-bold text-slate-900">
                                {line.productName || line.itemDescription}
                              </td>
                              <td className="px-3 py-2.5 text-slate-600">{line.category}</td>
                              <td className="px-3 py-2.5 font-extrabold text-slate-900">{line.quantity}</td>
                              <td className="px-3 py-2.5 text-slate-500">{line.unit}</td>
                              <td className="px-3 py-2.5 text-slate-700 font-bold">₹{line.unitRate.toLocaleString("en-IN")}</td>
                              <td className="px-3 py-2.5 font-extrabold text-emerald-800 text-right">
                                ₹{line.totalAmount.toLocaleString("en-IN")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-2">
                {poNumber && (
                  <Link
                    href={`/purchase-stores/procurement/orders?po=${encodeURIComponent(poNumber)}`}
                    className="h-9 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-xl shadow-xs inline-flex items-center justify-center gap-1.5"
                  >
                    <FileCheck className="h-3.5 w-3.5" /> Open in Purchase Orders
                  </Link>
                )}
                <Button
                  type="button"
                  onClick={() => setViewPODrawerRFQ(null)}
                  className={cn(
                    "h-9 text-xs font-bold !bg-slate-900 hover:!bg-slate-800 text-white rounded-xl shadow-xs cursor-pointer",
                    !poNumber && "col-span-2",
                  )}
                >
                  Close
                </Button>
              </div>
            </div>
          </Drawer>
        );
      })()}

      {/* DOCUMENT / ATTACHMENT PREVIEW MODAL */}
      <PurchaseAttachmentPreviewModal
        attachment={previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />
    </div>
  );
}
