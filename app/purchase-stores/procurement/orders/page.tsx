"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ShoppingCart,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  DollarSign,
  ShieldCheck,
  Search,
  Filter,
  ArrowUpDown,
  Building2,
  CalendarDays,
  User,
  Package,
  Paperclip,
  IndianRupee,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import {
  TextInput,
  SelectInput,
  FormField,
  FOPageHeader,
  StatMiniCard,
  AlertBanner,
} from "@/components/frontoffice/ui";
import { ModuleDataTable } from "@/components/pms/ModuleDataTable";
import { ModuleSelectionBar } from "@/components/pms/ModuleSelectionBar";
import { ModuleColumn } from "@/components/pms/module-types";
import { OperationsToolbar, OperationsFilterDrawer } from "@/components/housekeeping/OperationsToolbar";
import {
  ProcurementFormSection,
  ProcurementSummaryRow,
} from "@/components/purchase-stores/ui/ProcurementFormParts";
import {
  PurchaseAttachmentList,
  AttachmentItem,
} from "@/components/purchase-stores/ui/PurchaseAttachmentList";
import { cn } from "@/lib/utils";
import {
  PO_PAYMENT_MODES,
  isDirectPo,
  poPaymentSummary,
  poSource,
  PO_SOURCE_LABELS,
  type POSource,
  type PORecord,
  type POLineItem,
  type POPayment,
} from "@/app/data/purchaseOrdersData";
import { PODetailDrawer, paymentStatusBadge } from "@/components/purchase-stores/procurement/PODetailDrawer";
import type { InvoiceRecord } from "@/app/data/invoiceVerificationData";
import { usePsList } from "@/hooks/usePsResource";
import {
  psPurchaseOrderService,
  psInvoiceService,
  psRequisitionService,
  psProductService,
  psSupplierService,
} from "@/services/purchase-stores/index";
import type { SupplierItem } from "@/app/data/purchaseStoresMastersData";
import {
  remainingByPrItemId,
  type PRFulfillment,
  type PurchaseRequisition,
} from "@/app/data/purchaseRequisitionsData";
import {
  catalogItemLabel,
  normalizePoLineItem,
  poLineFromProduct,
  poLinesFromPr,
  poLinesMissingMaterial,
  productsToCatalog,
} from "@/app/data/procurementMaterial";

const NO_LINKED_PR = "";

function prOptionLabel(pr: PurchaseRequisition): string {
  return `${pr.prNumber} — ${pr.department}`;
}

/** Terms that have no input on the form but are stored on the PO. */
const PO_FORM_DEFAULTS = {
  buyerName: "Purchase Executive",
  freightTerms: "As agreed with vendor",
  paymentTerms: "Net 30 days",
  paymentDueDays: 30,
  currency: "INR (₹)",
  taxTerms: "GST as per item",
};

function openPoCreateDefaults() {
  return {
    formDate: new Date().toISOString().slice(0, 10),
    formLinkedPR: NO_LINKED_PR,
    formLinkedRFQ: "",
    formDepartment: "",
    formBuyerName: PO_FORM_DEFAULTS.buyerName,
    formItems: [] as POLineItem[],
    formAttachments: [] as AttachmentItem[],
  };
}

export default function PurchaseOrdersPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: poListRaw, loading: poLoading, reload: reloadPoList } = usePsList(() => psPurchaseOrderService.list(), []);
  const { data: fulfillmentList, reload: reloadFulfillment } = usePsList(
    () => psRequisitionService.fulfillment(),
    [],
  );
  const fulfillmentByPr = useMemo(
    () => new Map<string, PRFulfillment>(fulfillmentList.map((f) => [f.prNumber, f])),
    [fulfillmentList],
  );
  const reloadPos = () => Promise.all([reloadPoList(), reloadFulfillment()]);
  const { data: products, loading: loadingProducts } = usePsList(() => psProductService.list(), []);
  const { data: suppliersRaw, loading: loadingSuppliers } = usePsList(() => psSupplierService.list(), []);
  const activeSuppliers = useMemo(
    () =>
      (suppliersRaw ?? [])
        .filter((s) => s.status === "Active")
        .sort((a, b) => a.supplierName.localeCompare(b.supplierName)),
    [suppliersRaw],
  );
  const productCatalog = useMemo(() => productsToCatalog(products), [products]);
  const poList = useMemo(
    () =>
      poListRaw.map((po) => ({
        ...po,
        items: po.items.map((item, i) =>
          normalizePoLineItem(item as Parameters<typeof normalizePoLineItem>[0], i, products),
        ),
      })),
    [poListRaw, products],
  );
  const { data: invoiceList, reload: reloadInvoices } = usePsList(() => psInvoiceService.list(), []);
  const { data: requisitions, loading: loadingPRs } = usePsList(() => psRequisitionService.list(), []);
  const [saving, setSaving] = useState(false);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | POSource>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Drawers State
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PORecord | null>(null);
  const [editPO, setEditPO] = useState<PORecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; variant: "success" | "info" } | null>(null);

  // Form State for PO Creation / Edit
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formLinkedPR, setFormLinkedPR] = useState(NO_LINKED_PR);
  const [formLinkedRFQ, setFormLinkedRFQ] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formBuyerName, setFormBuyerName] = useState(PO_FORM_DEFAULTS.buyerName);
  const [formVendorName, setFormVendorName] = useState("");
  const [formContactPerson, setFormContactPerson] = useState("");
  const [formGstin, setFormGstin] = useState("");
  const [formVendorAddress, setFormVendorAddress] = useState("");
  const [formVendorPhone, setFormVendorPhone] = useState("");
  const [formShipToWarehouse, setFormShipToWarehouse] = useState("");
  const [formDockGate, setFormDockGate] = useState("");
  const [formExpectedDelivery, setFormExpectedDelivery] = useState("");
  const [formFreightTerms, setFormFreightTerms] = useState(PO_FORM_DEFAULTS.freightTerms);
  const [formPaymentTerms, setFormPaymentTerms] = useState(PO_FORM_DEFAULTS.paymentTerms);
  const [formPaymentDueDays, setFormPaymentDueDays] = useState<number>(PO_FORM_DEFAULTS.paymentDueDays);
  const [formDiscountPercent, setFormDiscountPercent] = useState<number>(0);
  const [formCurrency, setFormCurrency] = useState(PO_FORM_DEFAULTS.currency);
  const [formTaxTerms, setFormTaxTerms] = useState(PO_FORM_DEFAULTS.taxTerms);
  const [formPayOption, setFormPayOption] = useState<"unpaid" | "full" | "partial">("unpaid");
  const [formPayAmount, setFormPayAmount] = useState<number>(0);
  const [formPayMode, setFormPayMode] = useState<string>(PO_PAYMENT_MODES[0]);
  const [formPayRef, setFormPayRef] = useState("");
  const [formPayDate, setFormPayDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Form Items State
  const [formItems, setFormItems] = useState<POLineItem[]>([]);

  const [formAttachments, setFormAttachments] = useState<AttachmentItem[]>([]);

  const linkablePRs = useMemo(() => {
    const ownPR = editPO?.linkedPR?.trim();
    return requisitions.filter(
      (pr) => pr.prNumber === ownPR || fulfillmentByPr.get(pr.prNumber)?.canCreatePo,
    );
  }, [requisitions, fulfillmentByPr, editPO]);

  /** Remaining PR quantity per PR item, excluding what the PO being edited already holds. */
  const remainingForForm = useMemo(() => {
    const f = formLinkedPR ? fulfillmentByPr.get(formLinkedPR) : undefined;
    const remaining = remainingByPrItemId(f);
    if (!remaining || !editPO || editPO.linkedPR?.trim() !== formLinkedPR) return remaining;
    const adjusted = { ...remaining };
    for (const line of editPO.items) {
      if (line.prItemId && line.prItemId in adjusted) {
        adjusted[line.prItemId] += Number(line.quantity) || 0;
      }
    }
    return adjusted;
  }, [formLinkedPR, fulfillmentByPr, editPO]);

  const handleLinkedPRChange = (prNumber: string) => {
    setFormLinkedPR(prNumber);
    if (prNumber) {
      const pr = requisitions.find((p) => p.prNumber === prNumber);
      if (pr) {
        setFormDepartment(pr.department);
        if (products.length > 0) {
          setFormItems(
            poLinesFromPr(pr.requestedItems, products, remainingByPrItemId(fulfillmentByPr.get(prNumber))),
          );
        }
      }
    } else {
      setFormItems((prev) => prev.map(({ prItemId: _prItemId, ...line }) => line));
    }
  };

  const handlePoLineMaterialChange = (lineId: string, materialId: string) => {
    const product = products.find((p) => p.id === materialId);
    if (!product) return;
    setFormItems((prev) =>
      prev.map((line) => {
        if (line.id !== lineId) return line;
        const updated = poLineFromProduct(product, line.quantity);
        return { ...updated, id: line.id, quantity: line.quantity, totalAmount: line.quantity * updated.unitRate };
      }),
    );
  };

  const handleAddPoLine = () => {
    const first = products.find((p) => p.status === "Active");
    if (!first) {
      setToast({ message: "No active products in master. Add materials first.", variant: "info" });
      return;
    }
    setFormItems((prev) => [...prev, poLineFromProduct(first)]);
  };

  const resetCreateForm = () => {
    const defaults = openPoCreateDefaults();
    setFormDate(defaults.formDate);
    setFormLinkedPR(defaults.formLinkedPR);
    setFormLinkedRFQ(defaults.formLinkedRFQ);
    setFormDepartment(defaults.formDepartment);
    setFormBuyerName(defaults.formBuyerName);
    setFormVendorName("");
    setFormContactPerson("");
    setFormGstin("");
    setFormVendorAddress("");
    setFormVendorPhone("");
    setFormShipToWarehouse("");
    setFormDockGate("");
    setFormExpectedDelivery("");
    setFormFreightTerms(PO_FORM_DEFAULTS.freightTerms);
    setFormPaymentTerms(PO_FORM_DEFAULTS.paymentTerms);
    setFormPaymentDueDays(PO_FORM_DEFAULTS.paymentDueDays);
    setFormDiscountPercent(0);
    setFormCurrency(PO_FORM_DEFAULTS.currency);
    setFormTaxTerms(PO_FORM_DEFAULTS.taxTerms);
    setFormPayOption("unpaid");
    setFormPayAmount(0);
    setFormPayMode(PO_PAYMENT_MODES[0]);
    setFormPayRef("");
    setFormPayDate(new Date().toISOString().slice(0, 10));
    const first = products.find((p) => p.status === "Active");
    setFormItems(first ? [poLineFromProduct(first)] : defaults.formItems);
    setFormAttachments(defaults.formAttachments);
  };

  // "Create PO" from the requisition page: /orders?fromPR=PR-…
  useEffect(() => {
    const fromPR = new URLSearchParams(window.location.search).get("fromPR");
    if (!fromPR) return;
    window.history.replaceState(null, "", window.location.pathname);
    void Promise.all([
      psRequisitionService.list(),
      psRequisitionService.fulfillment(),
      psProductService.list(),
    ])
      .then(([prs, fulfillments, productRows]) => {
        const pr = prs.find((p) => p.prNumber === fromPR);
        const fulfillment = fulfillments.find((f) => f.prNumber === fromPR);
        if (!pr || !fulfillment?.canCreatePo) {
          setToast({ message: `${fromPR} is not open for a direct PO.`, variant: "info" });
          return;
        }
        setEditPO(null);
        resetCreateForm();
        setFormLinkedPR(fromPR);
        setFormDepartment(pr.department);
        setFormItems(poLinesFromPr(pr.requestedItems, productRows, remainingByPrItemId(fulfillment)));
        setCreateDrawerOpen(true);
      })
      .catch(() => setToast({ message: `Could not load ${fromPR}.`, variant: "info" }));
  }, []);

  // Direct PO (no requisition): /orders?new=1 — also where the old Direct Purchases page points.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new") !== "1") return;
    void Promise.resolve().then(() => {
      setEditPO(null);
      resetCreateForm();
      setCreateDrawerOpen(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "View PO" from the RFQ page: /orders?po=PO-…
  useEffect(() => {
    const poNumber = new URLSearchParams(window.location.search).get("po");
    if (!poNumber) return;
    window.history.replaceState(null, "", window.location.pathname);
    void Promise.all([psPurchaseOrderService.list(), psProductService.list()])
      .then(([pos, productRows]) => {
        const po = pos.find((p) => p.poNumber === poNumber);
        if (!po) {
          setToast({ message: `${poNumber} was not found.`, variant: "info" });
          return;
        }
        setSelectedPO({
          ...po,
          items: po.items.map((item, i) =>
            normalizePoLineItem(item as Parameters<typeof normalizePoLineItem>[0], i, productRows),
          ),
        });
      })
      .catch(() => setToast({ message: `Could not load ${poNumber}.`, variant: "info" }));
  }, []);

  // Sync Form when Editing PO
  useEffect(() => {
    if (editPO) {
      setFormDate(editPO.orderDate);
      setFormLinkedPR(editPO.linkedPR ?? NO_LINKED_PR);
      setFormLinkedRFQ(editPO.linkedRFQ || "");
      setFormDepartment(editPO.department);
      setFormBuyerName(editPO.buyerName);
      setFormVendorName(editPO.vendorName);
      setFormContactPerson(editPO.contactPerson);
      setFormGstin(editPO.gstin);
      setFormVendorAddress(editPO.vendorAddress);
      setFormVendorPhone(editPO.vendorPhone);
      setFormShipToWarehouse(editPO.shipToWarehouse);
      setFormDockGate(editPO.dockGate);
      setFormExpectedDelivery(editPO.expectedDeliveryDate);
      setFormFreightTerms(editPO.freightTerms);
      setFormPaymentTerms(editPO.paymentTerms);
      setFormPaymentDueDays(editPO.paymentDueDays);
      setFormDiscountPercent(editPO.discountPercent);
      setFormCurrency(editPO.currency);
      setFormTaxTerms(editPO.taxTerms);
      setFormItems(
        editPO.items.map((item, i) =>
          normalizePoLineItem(item as Parameters<typeof normalizePoLineItem>[0], i, products),
        ),
      );
      setFormAttachments(editPO.attachments);
    }
  }, [editPO, products]);

  // Computed Financial Totals
  const subTotal = useMemo(() => formItems.reduce((acc, i) => acc + i.totalAmount, 0), [formItems]);
  const taxTotal = useMemo(() => Math.round(subTotal * 0.18), [subTotal]);
  const grandTotal = subTotal + taxTotal;
  const isDirectForm = !editPO && isDirectPo({ linkedPR: formLinkedPR, linkedRFQ: formLinkedRFQ });
  const formStepAttachments = isDirectForm ? 5 : 4;

  // Dynamic KPIs
  const metrics = useMemo(() => {
    const total = poList.length;
    const pending = poList.filter((p) => p.status === "Pending Approval").length;
    const approved = poList.filter((p) => p.status === "Approved" || p.status === "Issued").length;
    const closed = poList.filter((p) => p.status === "Closed").length;

    return { total, pending, approved, closed };
  }, [poList]);

  const statusTabCounts = useMemo(() => ({
    all: poList.length,
    Approved: poList.filter((p) => p.status === "Approved" || p.status === "Issued").length,
    "Pending Approval": poList.filter((p) => p.status === "Pending Approval").length,
    Closed: poList.filter((p) => p.status === "Closed").length,
    Draft: poList.filter((p) => p.status === "Draft").length,
  }), [poList]);

  const activeFilterCount = useMemo(() => {
    return (deptFilter !== "all" ? 1 : 0) + (sourceFilter !== "all" ? 1 : 0);
  }, [deptFilter, sourceFilter]);

  const sourceCounts = useMemo(() => {
    const counts: Record<"all" | POSource, number> = { all: poList.length, direct: 0, rfq: 0, requisition: 0 };
    for (const p of poList) counts[poSource(p)] += 1;
    return counts;
  }, [poList]);

  const handleResetFilters = () => {
    setDeptFilter("all");
    setSourceFilter("all");
  };

  // Filtered PO Records
  const filteredPOs = useMemo(() => {
    return poList.filter((p) => {
      const matchSearch =
        p.poNumber.toLowerCase().includes(search.toLowerCase()) ||
        p.vendorName.toLowerCase().includes(search.toLowerCase()) ||
        p.department.toLowerCase().includes(search.toLowerCase()) ||
        p.buyerName.toLowerCase().includes(search.toLowerCase());

      const matchDept = deptFilter === "all" || p.department.toLowerCase().includes(deptFilter.toLowerCase());
      const matchSource = sourceFilter === "all" || poSource(p) === sourceFilter;
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "Approved" && (p.status === "Approved" || p.status === "Issued")) ||
        p.status === statusFilter;

      return matchSearch && matchDept && matchSource && matchStatus;
    });
  }, [poList, search, deptFilter, sourceFilter, statusFilter]);

  const selectedSupplierId =
    activeSuppliers.find((s) => s.supplierName.trim().toLowerCase() === formVendorName.trim().toLowerCase())?.id ?? "";

  const applySupplier = (supplier: SupplierItem | undefined) => {
    if (!supplier) {
      setFormVendorName("");
      setFormGstin("");
      setFormContactPerson("");
      setFormVendorPhone("");
      setFormVendorAddress("");
      return;
    }
    setFormVendorName(supplier.supplierName);
    setFormGstin(supplier.gstin ?? "");
    setFormContactPerson(supplier.contactPerson ?? "");
    setFormVendorPhone(supplier.phone ?? "");
    setFormVendorAddress([supplier.address, supplier.city].filter(Boolean).join(", "));
    const days = supplier.creditDays ?? Number(/\d+/.exec(supplier.paymentTerms ?? "")?.[0] ?? NaN);
    if (supplier.paymentTerms) setFormPaymentTerms(supplier.paymentTerms);
    if (Number.isFinite(days)) setFormPaymentDueDays(days);
    else if (supplier.paymentTerms === "Immediate" || supplier.paymentTerms === "Advance") setFormPaymentDueDays(0);
  };

  // Save PO Handler
  const handleSavePO = async (isSubmit: boolean) => {
    const missing = poLinesMissingMaterial(formItems);
    if (missing.length > 0) {
      setToast({
        message: `${missing.length} line(s) missing a valid material from Product Master.`,
        variant: "info",
      });
      return;
    }
    if (formItems.length === 0) {
      setToast({ message: "Add at least one line item from Product Master.", variant: "info" });
      return;
    }
    if (isSubmit) {
      const required: [string, string][] = [
        ["Department", formDepartment],
        ["Buyer Name", formBuyerName],
        ["Vendor Name", formVendorName],
        ["GSTIN", formGstin],
        ["Contact Person", formContactPerson],
        ["Phone Number", formVendorPhone],
      ];
      const blank = required.filter(([, v]) => !v.trim()).map(([label]) => label);
      if (blank.length) {
        setToast({ message: `Fill in: ${blank.join(", ")}.`, variant: "info" });
        return;
      }
    }

    const normalizedItems = formItems.map((item, i) =>
      normalizePoLineItem(item as Parameters<typeof normalizePoLineItem>[0], i, products),
    );

    let initialPayments: POPayment[] = [];
    if (isDirectForm && formPayOption !== "unpaid") {
      const amount = formPayOption === "full" ? grandTotal : Number(formPayAmount) || 0;
      if (amount <= 0) {
        setToast({ message: "Enter the amount paid.", variant: "info" });
        return;
      }
      if (amount > grandTotal + 0.5) {
        setToast({ message: "Amount paid cannot exceed the PO total.", variant: "info" });
        return;
      }
      if (formPayMode !== "Cash" && !formPayRef.trim()) {
        setToast({ message: `Enter the ${formPayMode} transaction reference.`, variant: "info" });
        return;
      }
      initialPayments = [
        {
          id: `PAY-${Date.now()}`,
          paymentDate: formPayDate,
          amount,
          paymentMode: formPayMode,
          reference: formPayRef.trim() || undefined,
          paidBy: formBuyerName,
        },
      ];
    }

    const newRecord: Partial<PORecord> = {
      orderDate: formDate,
      linkedPR: formLinkedPR || undefined,
      linkedRFQ: formLinkedRFQ || undefined,
      department: formDepartment,
      buyerName: formBuyerName,
      vendorName: formVendorName,
      contactPerson: formContactPerson,
      gstin: formGstin,
      vendorAddress: formVendorAddress,
      vendorPhone: formVendorPhone,
      shipToWarehouse: formShipToWarehouse,
      dockGate: formDockGate,
      expectedDeliveryDate: formExpectedDelivery,
      freightTerms: formFreightTerms,
      paymentTerms: formPaymentTerms,
      paymentDueDays: Number(formPaymentDueDays) || 30,
      discountPercent: Number(formDiscountPercent) || 0,
      currency: formCurrency,
      taxTerms: formTaxTerms,
      subTotal: subTotal,
      taxAmount: taxTotal,
      totalAmount: grandTotal,
      status: isSubmit ? "Pending Approval" : "Draft",
      items: normalizedItems,
      attachments: formAttachments,
      ...(editPO ? {} : { payments: initialPayments }),
      approvalHistory: [
        { level: "Level 1", approver: formBuyerName, action: "Submitted", timestamp: "Today", comments: "PO generated" },
        ...(isSubmit ? [{ level: "Level 2", approver: "Finance Manager", action: "Pending", timestamp: "Today", comments: "Awaiting approval" }] : []),
      ],
      activityTimeline: [
        { stage: "PO Created", timestamp: "Today", note: `Created by ${formBuyerName}`, author: formBuyerName },
        ...(isSubmit ? [{ stage: "Submitted for Approval", timestamp: "Today", note: "Sent to finance queue", author: "System" }] : []),
      ],
    };

    setSaving(true);
    try {
      if (editPO) {
        await psPurchaseOrderService.update(editPO.id, newRecord);
        setEditPO(null);
        setToast({ message: "Purchase Order Updated Successfully", variant: "success" });
      } else {
        const created = await psPurchaseOrderService.create(newRecord);
        setCreateDrawerOpen(false);
        if (initialPayments.length > 0 && !Array.isArray(created?.payments)) {
          setToast({
            message: "PO saved, but the payment was not stored — run sql/ps-po-payments.sql in Supabase.",
            variant: "info",
          });
        } else {
          setToast({
            message: isSubmit ? "Purchase Order submitted for approval" : "Purchase Order Saved as Draft",
            variant: "success",
          });
        }
      }
      await reloadPos();
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Save failed", variant: "info" });
    } finally {
      setSaving(false);
    }
  };

  const handleApprovePO = async () => {
    if (!selectedPO) return;
    try {
      await psPurchaseOrderService.update(selectedPO.id, { status: "Approved" });
      await reloadPos();
      setSelectedPO((prev) => (prev ? { ...prev, status: "Approved" } : null));
      setToast({ message: `${selectedPO.poNumber} approved.`, variant: "success" });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Approve failed", variant: "info" });
    }
  };

  const handleRecordPayment = async (payment: POPayment) => {
    if (!selectedPO) return;
    const payments = [...(selectedPO.payments ?? []), payment];
    const updated = await psPurchaseOrderService.update(selectedPO.id, { payments });
    if (!updated || !Array.isArray(updated.payments)) {
      throw new Error("Payments are not enabled yet — run sql/ps-po-payments.sql in Supabase.");
    }
    await reloadPos();
    setSelectedPO((prev) => (prev ? { ...prev, ...updated } : null));
    setToast({ message: `Payment of ₹${payment.amount.toLocaleString("en-IN")} recorded.`, variant: "success" });
  };

  const handleRejectPO = async () => {
    if (!selectedPO) return;
    try {
      await psPurchaseOrderService.update(selectedPO.id, { status: "Cancelled" });
      await reloadPos();
      setSelectedPO((prev) => (prev ? { ...prev, status: "Cancelled" } : null));
      setToast({ message: `${selectedPO.poNumber} rejected.`, variant: "info" });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Reject failed", variant: "info" });
    }
  };

  const handleApproveInvoice = async (invoiceId: string) => {
    try {
      await psInvoiceService.update(invoiceId, {
        status: "Approved for Payment",
        verificationResult: "Matched",
      });
      await reloadInvoices();
      setToast({ message: "Invoice approved for payment.", variant: "success" });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Approve failed", variant: "info" });
    }
  };

  const handleRejectInvoice = async (invoiceId: string) => {
    try {
      await psInvoiceService.update(invoiceId, {
        status: "Rejected",
        verificationResult: "Rejected",
      });
      await reloadInvoices();
      setToast({ message: "Invoice rejected.", variant: "info" });
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : "Reject failed", variant: "info" });
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: PORecord["status"]) => {
    switch (status) {
      case "Approved":
      case "Issued":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            {status}
          </span>
        );
      case "Pending Approval":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            Pending Approval
          </span>
        );
      case "Closed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-teal-50 text-teal-800 border border-teal-200">
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Draft
          </span>
        );
    }
  };

  // Columns for ModuleDataTable
  const columns: ModuleColumn[] = [
    {
      key: "poNumber",
      header: "PO Number",
      render: (r: PORecord) => <span className="font-mono font-bold text-emerald-800">{r.poNumber}</span>,
    },
    {
      key: "source",
      header: "PO Type",
      render: (r: PORecord) => {
        const src = poSource(r);
        return (
          <div className="leading-tight">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                src === "direct"
                  ? "bg-violet-50 text-violet-700"
                  : src === "rfq"
                    ? "bg-sky-50 text-sky-700"
                    : "bg-slate-100 text-slate-700"
              }`}
            >
              {PO_SOURCE_LABELS[src]}
            </span>
            {src !== "direct" && (
              <span className="block font-mono text-[10px] text-slate-400 mt-0.5">
                {src === "rfq" ? r.linkedRFQ : r.linkedPR}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "vendorName",
      header: "Vendor Name",
      render: (r: PORecord) => <span className="font-bold text-slate-900">{r.vendorName}</span>,
    },
    {
      key: "department",
      header: "Department",
      render: (r: PORecord) => <span className="font-semibold text-slate-900">{r.department}</span>,
    },
    {
      key: "expectedDeliveryDate",
      header: "Expected Delivery",
      render: (r: PORecord) => <span className="text-slate-600">{r.expectedDeliveryDate}</span>,
    },
    {
      key: "totalAmount",
      header: "Total Amount",
      align: "right",
      render: (r: PORecord) => (
        <span className="font-extrabold text-emerald-900">₹{r.totalAmount.toLocaleString("en-IN")}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (r: PORecord) => renderStatusBadge(r.status),
    },
    {
      key: "paymentStatus",
      header: "Payment",
      align: "center",
      render: (r: PORecord) =>
        isDirectPo(r) || (r.payments?.length ?? 0) > 0 ? (
          paymentStatusBadge(poPaymentSummary(r).status)
        ) : (
          <span className="text-[11px] text-slate-400">Via invoice</span>
        ),
    },
    {
      key: "buyerName",
      header: "Buyer Name",
      render: (r: PORecord) => <span className="text-slate-600">{r.buyerName}</span>,
    },
  ];

  return (
    <div className="space-y-6 pb-12 select-none min-h-screen">
      {toast && (
        <AlertBanner
          variant={toast.variant}
          message={toast.message}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* PAGE HEADER */}
      <FOPageHeader
        title="Purchase Orders (PO)"
        description="Official commercial purchase orders issued to verified vendors for materials and services"
        action={
          <Button
            type="button"
            onClick={() => {
              setEditPO(null);
              resetCreateForm();
              setCreateDrawerOpen(true);
            }}
            className="h-9 px-4 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Create Direct Purchase Order
          </Button>
        }
      />

      {/* 2X2 KPI CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatMiniCard
          label="Total Purchase Orders"
          value={metrics.total.toString()}
          sublabel="Issued purchase orders"
          icon={ShoppingCart}
          accent="#059669"
        />
        <StatMiniCard
          label="Pending Approval"
          value={metrics.pending.toString()}
          sublabel="In authorization queue"
          icon={Clock}
          accent="#d97706"
        />
        <StatMiniCard
          label="Approved POs"
          value={metrics.approved.toString()}
          sublabel="Active & dispatched"
          icon={CheckCircle2}
          accent="#0d9488"
        />
        <StatMiniCard
          label="Closed / Fulfilled"
          value={metrics.closed.toString()}
          sublabel="GRN & Invoice matched"
          icon={ShieldCheck}
          accent="#047857"
        />
      </div>

      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search PO #, vendor, buyer..."
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setFilterDrawerOpen(true)}
        statusTabs={[
          { id: "all", label: `All ${statusTabCounts.all}` },
          { id: "Approved", label: `Approved ${statusTabCounts.Approved}` },
          { id: "Pending Approval", label: `Pending Approval ${statusTabCounts["Pending Approval"]}` },
          { id: "Closed", label: `Closed ${statusTabCounts.Closed}` },
          { id: "Draft", label: `Draft ${statusTabCounts.Draft}` },
        ]}
        activeStatusTab={statusFilter}
        onStatusTabChange={setStatusFilter}
        toolbarExtras={
          <SelectInput
            value={sourceFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSourceFilter(e.target.value as "all" | POSource)}
            className="!h-10 !w-52 shrink-0 !rounded-full text-xs bg-white font-semibold"
            aria-label="PO type"
          >
            <option value="all">All PO Types ({sourceCounts.all})</option>
            <option value="direct">Direct Purchase ({sourceCounts.direct})</option>
            <option value="rfq">From RFQ ({sourceCounts.rfq})</option>
            <option value="requisition">From Requisition ({sourceCounts.requisition})</option>
          </SelectInput>
        }
        selectionBar={
          <ModuleSelectionBar
            count={selectedIds.size}
            noun="order"
            onClear={() => setSelectedIds(new Set())}
            actions={[
              {
                label: "View",
                onClick: () => {
                  const first = filteredPOs.find((p) => selectedIds.has(p.id));
                  if (first) setSelectedPO(first);
                },
              },
              {
                label: "Edit",
                onClick: () => {
                  const first = filteredPOs.find((p) => selectedIds.has(p.id));
                  if (first) {
                    setEditPO(first);
                    setCreateDrawerOpen(true);
                  }
                },
              },
            ]}
          />
        }
      />

      <OperationsFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filter Purchase Orders"
        activeFilterCount={activeFilterCount}
        onReset={handleResetFilters}
      >
        <FormField label="PO Type">
          <SelectInput
            value={sourceFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSourceFilter(e.target.value as "all" | POSource)}
            className="w-full text-xs rounded-xl h-9 bg-white"
          >
            <option value="all">All PO Types</option>
            <option value="direct">Direct Purchase</option>
            <option value="rfq">From RFQ</option>
            <option value="requisition">From Requisition</option>
          </SelectInput>
        </FormField>
        <FormField label="Department">
          <SelectInput
            value={deptFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDeptFilter(e.target.value)}
            className="w-full text-xs rounded-xl h-9 bg-white"
          >
            <option value="all">All Departments</option>
            <option value="Housekeeping">Housekeeping</option>
            <option value="Engineering">Engineering</option>
            <option value="Kitchen">Kitchen / F&B</option>
          </SelectInput>
        </FormField>
      </OperationsFilterDrawer>

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
          onClick={() => setToast({ message: "Sorted by Recent POs", variant: "info" })}
          className="flex-1 h-11 text-xs font-bold border-slate-300 text-slate-700 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ArrowUpDown className="h-4 w-4" /> Sort
        </Button>
        <Button
          type="button"
          onClick={() => {
            setEditPO(null);
            resetCreateForm();
            setCreateDrawerOpen(true);
          }}
          className="flex-1 h-11 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Direct PO
        </Button>
      </div>

      {/* CORE SHARED MODULE DATA TABLE */}
      <div className="space-y-3">
        {poLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Loading purchase orders…
          </div>
        ) : (
        <ModuleDataTable
          columns={columns}
          rows={filteredPOs}
          onRowClick={(r) => setSelectedPO(r as PORecord)}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          renderMobileCard={(r: PORecord) => (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono font-extrabold text-emerald-800 text-xs">{r.poNumber}</span>
              {renderStatusBadge(r.status)}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">{r.vendorName}</h4>
              <p className="text-[11px] text-slate-500 font-medium">{r.department} • Expected: {r.expectedDeliveryDate}</p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">Buyer: {r.buyerName}</span>
              <span className="font-extrabold text-emerald-800 text-sm">₹{r.totalAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>
        )}
        />
        )}
      </div>

      {/* CREATE / EDIT PO DRAWER */}
      <Drawer
        side="bottom"
        open={createDrawerOpen || !!editPO}
        onClose={() => {
          setCreateDrawerOpen(false);
          setEditPO(null);
        }}
        title={editPO ? `Edit Purchase Order: ${editPO.poNumber}` : isDirectForm ? "Create Direct Purchase Order" : "Create Purchase Order (PO)"}
        width="responsive"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCreateDrawerOpen(false);
                setEditPO(null);
              }}
              className="h-9 px-4 text-xs font-semibold !bg-white hover:!bg-slate-100 text-slate-700 border-slate-300 rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSavePO(false)}
              className="h-9 px-4 text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Save Draft
            </Button>
            <Button
              type="button"
              onClick={() => handleSavePO(true)}
              className="h-9 px-5 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
            >
              Submit Purchase Order
            </Button>
          </div>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSavePO(true);
          }}
          className="grid gap-5 pb-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start"
        >
          <div className="min-w-0 space-y-5">
            <ProcurementFormSection step={1} title="Order Details" subtitle="Date, source and who is buying">
              <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
                <FormField label="Order Date" required>
                  <TextInput
                    type="date"
                    value={formDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormDate(e.target.value)}
                    className="h-10 text-sm"
                  />
                </FormField>
                <FormField label="Department" required>
                  <TextInput
                    value={formDepartment}
                    placeholder="e.g. Housekeeping"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormDepartment(e.target.value)}
                    className="h-10 text-sm"
                  />
                </FormField>
                <FormField label="Buyer Name" required>
                  <TextInput
                    value={formBuyerName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormBuyerName(e.target.value)}
                    className="h-10 text-sm"
                  />
                </FormField>
                <FormField label="Linked PR">
                  <SelectInput
                    value={formLinkedPR}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleLinkedPRChange(e.target.value)}
                    className={cn("block h-10 text-sm", !formLinkedPR && "text-slate-400")}
                    disabled={loadingPRs}
                  >
                    <option value={NO_LINKED_PR}>No linked PR — Direct Procurement</option>
                    {linkablePRs.map((pr) => (
                      <option key={pr.id} value={pr.prNumber}>
                        {prOptionLabel(pr)}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
                <FormField label="Linked RFQ">
                  <TextInput
                    value={formLinkedRFQ}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormLinkedRFQ(e.target.value)}
                    placeholder="RFQ-2026-001 (optional)"
                    className="h-10 font-mono text-sm"
                  />
                </FormField>
                <FormField label="Expected Delivery">
                  <TextInput
                    type="date"
                    value={formExpectedDelivery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormExpectedDelivery(e.target.value)}
                    className="h-10 text-sm"
                  />
                </FormField>
              </div>
            </ProcurementFormSection>

            <ProcurementFormSection step={2} title="Vendor" subtitle="Pick from Supplier Master or enter a new vendor">
              <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                <FormField label="Existing Vendor" className="sm:col-span-2">
                  <SelectInput
                    value={selectedSupplierId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      applySupplier(activeSuppliers.find((s) => s.id === e.target.value))
                    }
                    className={cn("block h-10 text-sm", !selectedSupplierId && "text-slate-400")}
                    disabled={loadingSuppliers}
                  >
                    <option value="">
                      {loadingSuppliers
                        ? "Loading vendors…"
                        : activeSuppliers.length
                          ? "New vendor — enter details below"
                          : "No vendors in Supplier Master — enter details below"}
                    </option>
                    {activeSuppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.supplierName}
                        {s.supplierCode ? ` (${s.supplierCode})` : ""}
                        {s.city ? ` · ${s.city}` : ""}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
                <FormField label="Vendor Name" required>
                  <TextInput
                    value={formVendorName}
                    placeholder="Legal / trading name"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormVendorName(e.target.value)}
                    className="h-10 text-sm"
                  />
                </FormField>
                <FormField label="GSTIN" required>
                  <TextInput
                    value={formGstin}
                    placeholder="22AAAAA0000A1Z5"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormGstin(e.target.value)}
                    className="h-10 font-mono text-sm"
                  />
                </FormField>
                <FormField label="Contact Person" required>
                  <TextInput
                    value={formContactPerson}
                    placeholder="Primary contact"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormContactPerson(e.target.value)}
                    className="h-10 text-sm"
                  />
                </FormField>
                <FormField label="Phone Number" required>
                  <TextInput
                    value={formVendorPhone}
                    placeholder="10-digit mobile"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormVendorPhone(e.target.value)}
                    className="h-10 text-sm"
                  />
                </FormField>
              </div>
            </ProcurementFormSection>

            <ProcurementFormSection
              step={3}
              title="Line Items"
              subtitle={
                formLinkedPR
                  ? `Items from ${formLinkedPR}`
                  : formItems.length
                    ? `${formItems.length} line${formItems.length === 1 ? "" : "s"}`
                    : "Add materials from Product Master"
              }
              action={
                <Button
                  type="button"
                  onClick={handleAddPoLine}
                  disabled={loadingProducts || products.length === 0 || Boolean(formLinkedPR)}
                  title={formLinkedPR ? `Lines are limited to items on ${formLinkedPR}` : undefined}
                  className="h-8 gap-1 rounded-lg px-3 text-xs font-bold !bg-emerald-700 text-white"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </Button>
              }
            >
              {formItems.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
                  <Package className="mx-auto mb-2 h-5 w-5 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">No line items yet</p>
                  <p className="mt-0.5 text-xs text-slate-400">Add materials from the product master to build this PO.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {formItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/40 p-3.5"
                    >
                      <div className="mb-2.5 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Line {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => setFormItems(formItems.filter((i) => i.id !== item.id))}
                          disabled={formItems.length <= 1}
                          className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                          aria-label="Remove line"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                        <div className="sm:col-span-5">
                          <span className="mb-1 block text-[10px] font-medium text-slate-500">Material</span>
                          <SelectInput
                            value={item.materialId}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                              handlePoLineMaterialChange(item.id, e.target.value)
                            }
                            className={cn("h-9 text-xs font-medium", !item.materialId && "text-slate-400")}
                          >
                            <option value="">Select material…</option>
                            {productCatalog.map((p) => (
                              <option key={p.materialId} value={p.materialId}>
                                {catalogItemLabel(p)}
                              </option>
                            ))}
                          </SelectInput>
                          {item.productCode && (
                            <span className="mt-1 block font-mono text-[10px] text-slate-400">{item.productCode}</span>
                          )}
                        </div>
                        <div className="sm:col-span-2">
                          <span className="mb-1 block text-[10px] font-medium text-slate-500">
                            Qty{item.unit ? ` (${item.unit})` : ""}
                          </span>
                          <TextInput
                            type="number"
                            min={0}
                            value={item.quantity}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const q = Number(e.target.value);
                              setFormItems(
                                formItems.map((i) =>
                                  i.id === item.id ? { ...i, quantity: q, totalAmount: q * i.unitRate } : i,
                                ),
                              );
                            }}
                            className="h-9 text-center text-xs font-semibold"
                          />
                          {item.prItemId && remainingForForm?.[item.prItemId] !== undefined && (
                            <span
                              className={cn(
                                "mt-1 block text-[10px]",
                                item.quantity > remainingForForm[item.prItemId]
                                  ? "font-semibold text-red-600"
                                  : "text-slate-400",
                              )}
                            >
                              Remaining: {remainingForForm[item.prItemId]}
                            </span>
                          )}
                        </div>
                        <div className="sm:col-span-2">
                          <span className="mb-1 block text-[10px] font-medium text-slate-500">Rate (₹)</span>
                          <TextInput
                            type="number"
                            min={0}
                            value={item.unitRate}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const r = Number(e.target.value);
                              setFormItems(
                                formItems.map((i) =>
                                  i.id === item.id ? { ...i, unitRate: r, totalAmount: i.quantity * r } : i,
                                ),
                              );
                            }}
                            className="h-9 text-right text-xs font-semibold"
                          />
                        </div>
                        <div className="flex items-end justify-between sm:col-span-3 sm:justify-end">
                          <span className="text-[10px] font-medium text-slate-500 sm:hidden">Line total</span>
                          <span className="text-sm font-bold text-emerald-800">
                            ₹{item.totalAmount.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-xs">
                    <div className="space-y-0.5 text-emerald-900">
                      <p>
                        Subtotal <span className="font-semibold">₹{subTotal.toLocaleString("en-IN")}</span>
                        <span className="mx-1.5 text-emerald-400">·</span>
                        GST (18%) <span className="font-semibold">₹{taxTotal.toLocaleString("en-IN")}</span>
                      </p>
                    </div>
                    <p className="text-base font-bold text-emerald-900">
                      ₹{grandTotal.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              )}
            </ProcurementFormSection>

            {isDirectForm && (
              <ProcurementFormSection step={4} title="Payment" subtitle="Optional — record payment now or later">
                <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
                  <FormField label="Payment Status" required>
                    <SelectInput
                      value={formPayOption}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setFormPayOption(e.target.value as "unpaid" | "full" | "partial")
                      }
                      className="h-10 text-sm"
                    >
                      <option value="unpaid">Not paid yet — pay later</option>
                      <option value="full">Paid in full</option>
                      <option value="partial">Partly paid / advance</option>
                    </SelectInput>
                  </FormField>
                  {formPayOption !== "unpaid" && (
                    <>
                      <FormField label="Amount Paid (₹)" required>
                        <TextInput
                          type="number"
                          min={0}
                          value={formPayOption === "full" ? grandTotal : formPayAmount || ""}
                          disabled={formPayOption === "full"}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormPayAmount(Number(e.target.value))}
                          className="h-10 text-sm font-semibold"
                        />
                      </FormField>
                      <FormField label="Payment Date" required>
                        <TextInput
                          type="date"
                          value={formPayDate}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormPayDate(e.target.value)}
                          className="h-10 text-sm"
                        />
                      </FormField>
                      <FormField label="Payment Mode" required>
                        <SelectInput
                          value={formPayMode}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormPayMode(e.target.value)}
                          className="h-10 text-sm"
                        >
                          {PO_PAYMENT_MODES.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </SelectInput>
                      </FormField>
                      <FormField
                        label="Transaction / Receipt Ref"
                        required={formPayMode !== "Cash"}
                        className="sm:col-span-2"
                      >
                        <TextInput
                          value={formPayRef}
                          placeholder={formPayMode === "Cash" ? "Receipt no. (optional)" : "UTR / cheque no. / txn id"}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormPayRef(e.target.value)}
                          className="h-10 font-mono text-sm"
                        />
                      </FormField>
                    </>
                  )}
                </div>
                {formPayOption === "partial" && grandTotal > 0 && (
                  <p className="mt-3 text-[11px] text-slate-500">
                    Balance due: ₹{Math.max(0, grandTotal - (Number(formPayAmount) || 0)).toLocaleString("en-IN")} — record
                    later payments from the PO details → Payments tab.
                  </p>
                )}
              </ProcurementFormSection>
            )}

            <ProcurementFormSection
              step={formStepAttachments}
              title="Attachments"
              subtitle="Vendor quotes, rate sheets or supporting documents"
            >
              <PurchaseAttachmentList
                attachments={formAttachments}
                onAddAttachment={(att) => setFormAttachments([...formAttachments, att])}
                onRemoveAttachment={(id) => setFormAttachments(formAttachments.filter((a) => a.id !== id))}
                allowedTypes={["pdf", "jpg", "jpeg", "png"]}
                maxSizeMB={5}
                maxFiles={5}
              />
            </ProcurementFormSection>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-0">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Summary</p>
              <dl className="space-y-2.5 text-xs">
                <ProcurementSummaryRow
                  icon={<CalendarDays className="h-3.5 w-3.5" />}
                  label="Order date"
                  value={formDate}
                />
                <ProcurementSummaryRow
                  icon={<Building2 className="h-3.5 w-3.5" />}
                  label="Department"
                  value={formDepartment}
                />
                <ProcurementSummaryRow icon={<User className="h-3.5 w-3.5" />} label="Buyer" value={formBuyerName} />
                <ProcurementSummaryRow
                  icon={<Truck className="h-3.5 w-3.5" />}
                  label="Vendor"
                  value={formVendorName}
                />
                <ProcurementSummaryRow
                  icon={<Package className="h-3.5 w-3.5" />}
                  label="Items"
                  value={formItems.length ? String(formItems.length) : ""}
                />
                <ProcurementSummaryRow
                  icon={<CalendarDays className="h-3.5 w-3.5" />}
                  label="Delivery"
                  value={formExpectedDelivery}
                />
                {(formLinkedPR || formLinkedRFQ) && (
                  <ProcurementSummaryRow
                    icon={<Paperclip className="h-3.5 w-3.5" />}
                    label="Source"
                    value={formLinkedRFQ || formLinkedPR}
                  />
                )}
              </dl>
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="text-[11px] text-slate-500">Estimated total (incl. GST)</p>
                <p className="mt-0.5 text-xl font-bold text-slate-900">
                  ₹{grandTotal.toLocaleString("en-IN")}
                </p>
                {grandTotal > 0 && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Subtotal ₹{subTotal.toLocaleString("en-IN")} · GST ₹{taxTotal.toLocaleString("en-IN")}
                  </p>
                )}
              </div>
            </div>
            <div className="rounded-xl bg-emerald-50/70 p-4 text-[11px] leading-relaxed text-emerald-900">
              {isDirectForm
                ? "Direct PO — no requisition or RFQ linked. After approval you can receive goods against this order."
                : formLinkedPR
                  ? `This PO is linked to ${formLinkedPR}. Ordered quantities count toward that requisition.`
                  : "After approval, receive goods on the GRN page against this purchase order."}
            </div>
          </aside>
        </form>
      </Drawer>

      <PODetailDrawer
        po={selectedPO}
        invoices={invoiceList.filter((i) => i.poNumber === selectedPO?.poNumber)}
        onClose={() => setSelectedPO(null)}
        renderStatusBadge={renderStatusBadge}
        onApprovePO={handleApprovePO}
        onRecordPayment={handleRecordPayment}
        onRejectPO={handleRejectPO}
        onApproveInvoice={handleApproveInvoice}
        onRejectInvoice={handleRejectInvoice}
      />
    </div>
  );
}
