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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import {
  TextInput,
  SelectInput,
  FormField,
  FOPageHeader,
  StatMiniCard,
} from "@/components/frontoffice/ui";
import { ModuleDataTable } from "@/components/pms/ModuleDataTable";
import { ModuleSelectionBar } from "@/components/pms/ModuleSelectionBar";
import { ModuleColumn } from "@/components/pms/module-types";
import { OperationsToolbar, OperationsFilterDrawer } from "@/components/housekeeping/OperationsToolbar";
import { PurchaseFormCard } from "@/components/purchase-stores/ui/PurchaseFormCard";
import {
  PurchaseAttachmentList,
  AttachmentItem,
} from "@/components/purchase-stores/ui/PurchaseAttachmentList";
import type { PORecord, POLineItem } from "@/app/data/purchaseOrdersData";
import { PODetailDrawer } from "@/components/purchase-stores/procurement/PODetailDrawer";
import type { InvoiceRecord } from "@/app/data/invoiceVerificationData";
import { usePsList } from "@/hooks/usePsResource";
import {
  psPurchaseOrderService,
  psInvoiceService,
  psRequisitionService,
  psProductService,
} from "@/services/purchase-stores/index";
import type { PurchaseRequisition } from "@/app/data/purchaseRequisitionsData";
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

function openPoCreateDefaults() {
  return {
    formDate: new Date().toISOString().slice(0, 10),
    formLinkedPR: NO_LINKED_PR,
    formLinkedRFQ: "",
    formDepartment: "",
    formBuyerName: "Purchase Executive",
    formItems: [] as POLineItem[],
    formAttachments: [] as AttachmentItem[],
  };
}

export default function PurchaseOrdersPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: poListRaw, loading: poLoading, reload: reloadPos } = usePsList(() => psPurchaseOrderService.list(), []);
  const { data: products, loading: loadingProducts } = usePsList(() => psProductService.list(), []);
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Drawers State
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PORecord | null>(null);
  const [editPO, setEditPO] = useState<PORecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; variant: "success" | "info" } | null>(null);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Form State for PO Creation / Edit
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formLinkedPR, setFormLinkedPR] = useState(NO_LINKED_PR);
  const [formLinkedRFQ, setFormLinkedRFQ] = useState("");
  const [formDepartment, setFormDepartment] = useState("Housekeeping");
  const [formBuyerName, setFormBuyerName] = useState("Amit Sharma");
  const [formVendorName, setFormVendorName] = useState("ABC Linen Pvt Ltd");
  const [formContactPerson, setFormContactPerson] = useState("Rajesh Mittal");
  const [formGstin, setFormGstin] = useState("07AAACB1234F1Z8");
  const [formVendorAddress, setFormVendorAddress] = useState("Okhla Industrial Area Phase 3, New Delhi");
  const [formVendorPhone, setFormVendorPhone] = useState("+91 98765 43210");
  const [formShipToWarehouse, setFormShipToWarehouse] = useState("Central Linen Warehouse");
  const [formDockGate, setFormDockGate] = useState("Receiving Dock 2");
  const [formExpectedDelivery, setFormExpectedDelivery] = useState("2026-07-28");
  const [formFreightTerms, setFormFreightTerms] = useState("FOB Destination (Supplier Paid)");
  const [formPaymentTerms, setFormPaymentTerms] = useState("Net 30 Days post GRN & 3-Way Match");
  const [formPaymentDueDays, setFormPaymentDueDays] = useState<number>(30);
  const [formDiscountPercent, setFormDiscountPercent] = useState<number>(2);
  const [formCurrency, setFormCurrency] = useState("INR (₹)");
  const [formTaxTerms, setFormTaxTerms] = useState("18% GST Included");

  // Form Items State
  const [formItems, setFormItems] = useState<POLineItem[]>([]);

  const [formAttachments, setFormAttachments] = useState<AttachmentItem[]>([]);

  const handleLinkedPRChange = (prNumber: string) => {
    setFormLinkedPR(prNumber);
    if (prNumber) {
      const pr = requisitions.find((p) => p.prNumber === prNumber);
      if (pr) {
        setFormDepartment(pr.department);
        if (products.length > 0) {
          setFormItems(poLinesFromPr(pr.requestedItems, products));
        }
      }
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
    const first = products.find((p) => p.status === "Active");
    setFormItems(first ? [poLineFromProduct(first)] : defaults.formItems);
    setFormAttachments(defaults.formAttachments);
  };

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
    return deptFilter !== "all" ? 1 : 0;
  }, [deptFilter]);

  const handleResetFilters = () => {
    setDeptFilter("all");
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
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "Approved" && (p.status === "Approved" || p.status === "Issued")) ||
        p.status === statusFilter;

      return matchSearch && matchDept && matchStatus;
    });
  }, [poList, search, deptFilter, statusFilter]);

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

    const normalizedItems = formItems.map((item, i) =>
      normalizePoLineItem(item as Parameters<typeof normalizePoLineItem>[0], i, products),
    );

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
        await psPurchaseOrderService.create(newRecord);
        setCreateDrawerOpen(false);
        setToast({
          message: isSubmit ? "Purchase Order submitted for approval" : "Purchase Order Saved as Draft",
          variant: "success",
        });
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
      key: "buyerName",
      header: "Buyer Name",
      render: (r: PORecord) => <span className="text-slate-600">{r.buyerName}</span>,
    },
  ];

  return (
    <div className="space-y-6 pb-12 select-none min-h-screen">
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xl animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toast.message}</span>
        </div>
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
            <Plus className="h-4 w-4" /> Create Purchase Order
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
          <Plus className="h-4 w-4" /> + Create
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
        open={createDrawerOpen || !!editPO}
        onClose={() => {
          setCreateDrawerOpen(false);
          setEditPO(null);
        }}
        title={editPO ? `Edit Purchase Order: ${editPO.poNumber}` : "Create Purchase Order (PO)"}
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
        <form onSubmit={(e) => { e.preventDefault(); handleSavePO(true); }} className="space-y-5 py-1">
          {/* SECTION 1: BASIC INFORMATION */}
          <PurchaseFormCard title="Basic Information" sectionNumber="Section 1 of 5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Order Date" required>
                <TextInput
                  type="date"
                  value={formDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormDate(e.target.value)}
                  className="h-11 md:h-9 text-xs"
                />
              </FormField>
              <FormField label="Linked PR (Optional)">
                <SelectInput
                  value={formLinkedPR}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleLinkedPRChange(e.target.value)}
                  className="h-11 md:h-9 text-xs font-medium"
                  disabled={loadingPRs}
                >
                  <option value={NO_LINKED_PR}>No linked PR — Direct Procurement</option>
                  {requisitions.map((pr) => (
                    <option key={pr.id} value={pr.prNumber}>
                      {prOptionLabel(pr)}
                    </option>
                  ))}
                </SelectInput>
              </FormField>
              <FormField label="Linked RFQ (Optional)">
                <TextInput
                  value={formLinkedRFQ}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormLinkedRFQ(e.target.value)}
                  placeholder="e.g. RFQ-2026-001 (if converted from RFQ)"
                  className="h-11 md:h-9 text-xs font-mono"
                />
              </FormField>
              <FormField label="Department" required>
                <TextInput
                  value={formDepartment}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormDepartment(e.target.value)}
                  className="h-11 md:h-9 text-xs"
                />
              </FormField>
              <FormField label="Buyer Name" required>
                <TextInput
                  value={formBuyerName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormBuyerName(e.target.value)}
                  className="h-11 md:h-9 text-xs font-bold"
                />
              </FormField>
            </div>
          </PurchaseFormCard>

          {/* SECTION 2: VENDOR DETAILS */}
          <PurchaseFormCard title="Vendor Information" sectionNumber="Section 2 of 5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Vendor Name" required>
                <TextInput
                  value={formVendorName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormVendorName(e.target.value)}
                  className="h-11 md:h-9 text-xs font-bold"
                />
              </FormField>
              <FormField label="GSTIN" required>
                <TextInput
                  value={formGstin}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormGstin(e.target.value)}
                  className="h-11 md:h-9 text-xs font-mono"
                />
              </FormField>
              <FormField label="Contact Person" required>
                <TextInput
                  value={formContactPerson}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormContactPerson(e.target.value)}
                  className="h-11 md:h-9 text-xs"
                />
              </FormField>
              <FormField label="Phone Number" required>
                <TextInput
                  value={formVendorPhone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormVendorPhone(e.target.value)}
                  className="h-11 md:h-9 text-xs"
                />
              </FormField>
            </div>
          </PurchaseFormCard>

          {/* SECTION 3: ORDERED LINE ITEMS */}
          <PurchaseFormCard
            title={`Ordered Line Items (${formItems.length})`}
            sectionNumber="Section 3 of 5"
            actionSlot={
              <Button
                type="button"
                onClick={handleAddPoLine}
                disabled={loadingProducts || products.length === 0}
                className="h-8 px-3 text-xs font-bold !bg-emerald-700 text-white rounded-lg cursor-pointer flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add Line Item
              </Button>
            }
          >
            <div className="space-y-3">
              {formItems.map((item) => (
                <div key={item.id} className="p-3 rounded-xl border border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-6 gap-3 items-center text-xs">
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-400 block font-medium mb-1">Material (Product Master)</span>
                    <SelectInput
                      value={item.materialId}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        handlePoLineMaterialChange(item.id, e.target.value)
                      }
                      className="h-9 text-xs font-bold"
                    >
                      <option value="">Select material…</option>
                      {productCatalog.map((p) => (
                        <option key={p.materialId} value={p.materialId}>
                          {catalogItemLabel(p)}
                        </option>
                      ))}
                    </SelectInput>
                    {item.productCode && (
                      <span className="text-[10px] text-slate-400 font-mono mt-1 block">{item.productCode}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium mb-1">Qty ({item.unit})</span>
                    <TextInput
                      type="number"
                      value={item.quantity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const q = Number(e.target.value);
                        setFormItems(formItems.map((i) => (i.id === item.id ? { ...i, quantity: q, totalAmount: q * i.unitRate } : i)));
                      }}
                      className="h-9 text-xs text-center font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium mb-1">Unit Rate (₹)</span>
                    <TextInput
                      type="number"
                      value={item.unitRate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const r = Number(e.target.value);
                        setFormItems(formItems.map((i) => (i.id === item.id ? { ...i, unitRate: r, totalAmount: i.quantity * r } : i)));
                      }}
                      className="h-9 text-xs text-right font-bold"
                    />
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    <span className="font-extrabold text-emerald-800 text-xs">₹{item.totalAmount.toLocaleString("en-IN")}</span>
                    <button
                      type="button"
                      onClick={() => setFormItems(formItems.filter((i) => i.id !== item.id))}
                      disabled={formItems.length <= 1}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-600 disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold">
                <span className="text-emerald-950">Grand Total PO Amount (Incl GST)</span>
                <span className="text-emerald-900 text-base">₹{grandTotal.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </PurchaseFormCard>

          {/* SECTION 4: DELIVERY & LOGISTICS */}
          <PurchaseFormCard title="Delivery & Logistics" sectionNumber="Section 4 of 5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Ship-to Warehouse" required>
                <TextInput
                  value={formShipToWarehouse}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormShipToWarehouse(e.target.value)}
                  className="h-11 md:h-9 text-xs"
                />
              </FormField>
              <FormField label="Dock / Gate" required>
                <TextInput
                  value={formDockGate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormDockGate(e.target.value)}
                  className="h-11 md:h-9 text-xs"
                />
              </FormField>
              <FormField label="Expected Delivery Date" required>
                <TextInput
                  type="date"
                  value={formExpectedDelivery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormExpectedDelivery(e.target.value)}
                  className="h-11 md:h-9 text-xs"
                />
              </FormField>
            </div>
          </PurchaseFormCard>

          {/* SECTION 5: ATTACHMENTS */}
          <PurchaseFormCard title="Vendor Quotations & Attachments" sectionNumber="Section 5 of 5">
            <PurchaseAttachmentList
              attachments={formAttachments}
              onAddAttachment={(att) => setFormAttachments([...formAttachments, att])}
              onRemoveAttachment={(id) => setFormAttachments(formAttachments.filter((a) => a.id !== id))}
            />
          </PurchaseFormCard>
        </form>
      </Drawer>

      <PODetailDrawer
        po={selectedPO}
        invoices={invoiceList.filter((i) => i.poNumber === selectedPO?.poNumber)}
        onClose={() => setSelectedPO(null)}
        renderStatusBadge={renderStatusBadge}
        onApprovePO={handleApprovePO}
        onRejectPO={handleRejectPO}
        onApproveInvoice={handleApproveInvoice}
        onRejectInvoice={handleRejectInvoice}
      />
    </div>
  );
}
