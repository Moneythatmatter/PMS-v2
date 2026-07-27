"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Zap,
  Clock,
  CheckCircle2,
  Plus,
  Trash2,
  DollarSign,
  CreditCard,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import {
  TextInput,
  SelectInput,
  FormField,
  TextAreaInput,
  FOPageHeader,
  StatMiniCard,
} from "@/components/frontoffice/ui";
import { ModuleDataTable } from "@/components/pms/ModuleDataTable";
import { ModuleSelectionBar } from "@/components/pms/ModuleSelectionBar";
import { ModuleColumn } from "@/components/pms/module-types";
import { OperationsToolbar, OperationsFilterDrawer } from "@/components/housekeeping/OperationsToolbar";
import { PurchaseFormCard } from "@/components/purchase-stores/ui/PurchaseFormCard";
import { PurchaseAttachmentList } from "@/components/purchase-stores/ui/PurchaseAttachmentList";
import {
  INITIAL_DSP_RECORDS,
  DSPRecord,
  DSPItem,
  DSPAttachment,
} from "@/app/data/dspData";

export default function DirectStorePurchasesPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Main DSP Dataset
  const [dspList, setDspList] = useState<DSPRecord[]>(INITIAL_DSP_RECORDS);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Drawers State
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [selectedDSP, setSelectedDSP] = useState<DSPRecord | null>(null);
  const [editDSP, setEditDSP] = useState<DSPRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; variant: "success" | "info" } | null>(null);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Form State for DSP Creation / Edit
  const [formDate, setFormDate] = useState("2026-07-22");
  const [formDepartment, setFormDepartment] = useState("Kitchen / F&B");
  const [formRequester, setFormRequester] = useState("Chef Ramesh Kumar");
  const [formVendorName, setFormVendorName] = useState("Fresh Organics Pvt Ltd");
  const [formPaymentType, setFormPaymentType] = useState<DSPRecord["paymentType"]>("Spot Cash");
  const [formBillNo, setFormBillNo] = useState("INV-LOCAL-889");
  const [formReason, setFormReason] = useState("Emergency banquet vegetables cash buy");
  const [formStoreLocation, setFormStoreLocation] = useState("Main Kitchen Cold Storage");
  const [formReceiverName, setFormReceiverName] = useState("Suresh Storekeeper");
  const [formGstin, setFormGstin] = useState("07AAACB1234F1Z8");

  // Form Items State
  const [formItems, setFormItems] = useState<DSPItem[]>([
    { id: "dsp-item-1", itemName: "Fresh Coriander & Herbs", category: "Perishables", quantity: 15, unit: "kg", unitRate: 80, lineAmount: 1200 },
  ]);

  // Form Attachments State
  const [formAttachments, setFormAttachments] = useState<DSPAttachment[]>([
    { id: "att-1", fileName: "FreshVeggies_Bill.pdf", fileSize: "245 KB", fileType: "pdf" },
  ]);

  // Sync Form when Editing DSP
  useEffect(() => {
    if (editDSP) {
      setFormDate(editDSP.purchaseDate);
      setFormDepartment(editDSP.department);
      setFormRequester(editDSP.requesterName);
      setFormVendorName(editDSP.vendorName);
      setFormPaymentType(editDSP.paymentType);
      setFormBillNo(editDSP.receiptNumber);
      setFormReason(editDSP.remarks);
      setFormStoreLocation(editDSP.storeLocation);
      setFormReceiverName(editDSP.receivedBy);
      setFormGstin(editDSP.gstin);
      setFormItems(editDSP.items);
      setFormAttachments(editDSP.attachments);
    }
  }, [editDSP]);

  // Computed Financial Totals
  const totalAmountCalculated = useMemo(() => {
    return formItems.reduce((sum, item) => sum + item.lineAmount, 0);
  }, [formItems]);

  // Dynamic KPIs
  const metrics = useMemo(() => {
    const total = dspList.length;
    const pending = dspList.filter((d) => d.status === "Pending Approval").length;
    const approved = dspList.filter((d) => d.status === "Approved").length;
    const monthlySpend = dspList.reduce((sum, d) => sum + d.totalAmount, 0);

    return { total, pending, approved, monthlySpend };
  }, [dspList]);

  const statusTabCounts = useMemo(() => ({
    all: dspList.length,
    Draft: dspList.filter((d) => d.status === "Draft").length,
    "Pending Approval": dspList.filter((d) => d.status === "Pending Approval").length,
    Approved: dspList.filter((d) => d.status === "Approved").length,
  }), [dspList]);

  const activeFilterCount = useMemo(() => {
    return departmentFilter !== "all" ? 1 : 0;
  }, [departmentFilter]);

  const handleResetFilters = () => {
    setDepartmentFilter("all");
  };

  // Filtered DSP Records
  const filteredDSPs = useMemo(() => {
    return dspList.filter((d) => {
      const matchSearch =
        d.dspNumber.toLowerCase().includes(search.toLowerCase()) ||
        d.vendorName.toLowerCase().includes(search.toLowerCase()) ||
        d.department.toLowerCase().includes(search.toLowerCase()) ||
        d.requesterName.toLowerCase().includes(search.toLowerCase());

      const matchDept = departmentFilter === "all" || d.department.toLowerCase().includes(departmentFilter.toLowerCase());
      const matchStatus = statusFilter === "all" || d.status === statusFilter;

      return matchSearch && matchDept && matchStatus;
    });
  }, [dspList, search, departmentFilter, statusFilter]);

  // Save DSP Handler
  const handleSaveDSP = (isSubmit: boolean) => {
    const nextNum = `DSP-2026-00${dspList.length + 1}`;
    const newRecord: DSPRecord = {
      id: editDSP ? editDSP.id : `dsp-${Date.now()}`,
      dspNumber: editDSP ? editDSP.dspNumber : nextNum,
      purchaseDate: formDate,
      department: formDepartment,
      requesterName: formRequester,
      paymentType: formPaymentType,
      vendorName: formVendorName,
      gstin: formGstin,
      receiptNumber: formBillNo,
      contactNumber: "+91 98765 43210",
      vendorAddress: "Local Wholesale Market, Phase 2",
      storeLocation: formStoreLocation,
      receivingDate: formDate,
      receivedBy: formReceiverName,
      storageBin: "BIN-KIT-04",
      paymentMode: formPaymentType,
      transactionRef: "TXN-CASH-9912",
      taxAmount: Math.round(totalAmountCalculated * 0.05),
      netAmount: Math.round(totalAmountCalculated * 0.95),
      totalAmount: totalAmountCalculated,
      status: isSubmit ? "Approved" : "Draft",
      createdBy: formRequester,
      items: formItems,
      attachments: formAttachments,
      remarks: formReason,
      activityTimeline: [
        { stage: "Purchased", timestamp: "Today", note: `Created by ${formRequester}`, author: formRequester },
      ],
    };

    if (editDSP) {
      setDspList((prev) => prev.map((d) => (d.id === editDSP.id ? newRecord : d)));
      setEditDSP(null);
      setToast({ message: "Direct Store Purchase Updated Successfully", variant: "success" });
    } else {
      setDspList([newRecord, ...dspList]);
      setCreateDrawerOpen(false);
      setToast({
        message: isSubmit ? "Direct Purchase Submitted & Approved" : "Direct Purchase Saved as Draft",
        variant: "success",
      });
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: DSPRecord["status"]) => {
    switch (status) {
      case "Approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            Approved
          </span>
        );
      case "Pending Approval":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            Pending Approval
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

  // Reusable Columns Definition for ModuleDataTable
  const columns: ModuleColumn[] = [
    {
      key: "dspNumber",
      header: "DSP No",
      render: (r: DSPRecord) => <span className="font-mono font-bold text-emerald-800">{r.dspNumber}</span>,
    },
    {
      key: "purchaseDate",
      header: "Purchase Date",
      render: (r: DSPRecord) => <span className="text-slate-600">{r.purchaseDate}</span>,
    },
    {
      key: "department",
      header: "Department",
      render: (r: DSPRecord) => <span className="font-semibold text-slate-900">{r.department}</span>,
    },
    {
      key: "vendorName",
      header: "Vendor Name",
      render: (r: DSPRecord) => <span className="font-bold text-slate-900">{r.vendorName}</span>,
    },
    {
      key: "paymentType",
      header: "Payment Type",
      render: (r: DSPRecord) => (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
          <CreditCard className="h-3 w-3 text-slate-400" /> {r.paymentType}
        </span>
      ),
    },
    {
      key: "totalAmount",
      header: "Total Amount",
      align: "right",
      render: (r: DSPRecord) => (
        <span className="font-extrabold text-emerald-900">₹{r.totalAmount.toLocaleString("en-IN")}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (r: DSPRecord) => renderStatusBadge(r.status),
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
        title="Direct Store Purchases (DSP)"
        description="Spot store purchases, emergency cash buys, and instant local vendor acquisitions"
        action={
          <Button
            type="button"
            onClick={() => {
              setEditDSP(null);
              setCreateDrawerOpen(true);
            }}
            className="h-9 px-4 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Create Direct Purchase
          </Button>
        }
      />

      {/* 2X2 KPI CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatMiniCard
          label="Total Direct Purchases"
          value={metrics.total.toString()}
          sublabel="Total store buy orders"
          icon={Zap}
          accent="#059669"
        />
        <StatMiniCard
          label="Pending Approval"
          value={metrics.pending.toString()}
          sublabel="Awaiting manager sign-off"
          icon={Clock}
          accent="#d97706"
        />
        <StatMiniCard
          label="Approved Purchases"
          value={metrics.approved.toString()}
          sublabel="Reimbursed & accounted"
          icon={CheckCircle2}
          accent="#0d9488"
        />
        <StatMiniCard
          label="Monthly Spend"
          value={`₹${metrics.monthlySpend.toLocaleString("en-IN")}`}
          sublabel="Current month direct buys"
          icon={DollarSign}
          accent="#047857"
        />
      </div>

      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search DSP #, vendor, department..."
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setFilterDrawerOpen(true)}
        statusTabs={[
          { id: "all", label: `All ${statusTabCounts.all}` },
          { id: "Draft", label: `Draft ${statusTabCounts.Draft}` },
          { id: "Pending Approval", label: `Pending Approval ${statusTabCounts["Pending Approval"]}` },
          { id: "Approved", label: `Approved ${statusTabCounts.Approved}` },
        ]}
        activeStatusTab={statusFilter}
        onStatusTabChange={setStatusFilter}
        selectionBar={
          <ModuleSelectionBar
            count={selectedIds.size}
            noun="purchase"
            onClear={() => setSelectedIds(new Set())}
            actions={[
              {
                label: "View",
                onClick: () => {
                  const first = filteredDSPs.find((d) => selectedIds.has(d.id));
                  if (first) setSelectedDSP(first);
                },
              },
              {
                label: "Edit",
                onClick: () => {
                  const first = filteredDSPs.find((d) => selectedIds.has(d.id));
                  if (first) {
                    setEditDSP(first);
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
        title="Filter Direct Store Purchases"
        activeFilterCount={activeFilterCount}
        onReset={handleResetFilters}
      >
        <FormField label="Department">
          <SelectInput
            value={departmentFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDepartmentFilter(e.target.value)}
            className="w-full text-xs rounded-xl h-9 bg-white"
          >
            <option value="all">All Departments</option>
            <option value="Kitchen">Kitchen / F&B</option>
            <option value="Engineering">Engineering</option>
            <option value="Housekeeping">Housekeeping</option>
          </SelectInput>
        </FormField>
      </OperationsFilterDrawer>

      {/* CORE SHARED MODULE DATA TABLE */}
      <div className="space-y-3">
        <ModuleDataTable
          columns={columns}
          rows={filteredDSPs}
          onRowClick={(r) => setSelectedDSP(r as DSPRecord)}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          renderMobileCard={(r: DSPRecord) => (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono font-extrabold text-emerald-800 text-xs">{r.dspNumber}</span>
              {renderStatusBadge(r.status)}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">{r.vendorName}</h4>
              <p className="text-[11px] text-slate-500 font-medium">{r.department} • {r.paymentType}</p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">{r.purchaseDate}</span>
              <span className="font-extrabold text-emerald-800 text-sm">₹{r.totalAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>
        )}
        />
      </div>

      {/* CREATE / EDIT DSP DRAWER */}
      <Drawer
        open={createDrawerOpen || !!editDSP}
        onClose={() => {
          setCreateDrawerOpen(false);
          setEditDSP(null);
        }}
        title={editDSP ? `Edit DSP: ${editDSP.dspNumber}` : "Create Direct Store Purchase (DSP)"}
        width="responsive"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCreateDrawerOpen(false);
                setEditDSP(null);
              }}
              className="h-9 px-4 text-xs font-semibold !bg-white hover:!bg-slate-100 text-slate-700 border-slate-300 rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSaveDSP(false)}
              className="h-9 px-4 text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Save Draft
            </Button>
            <Button
              type="button"
              onClick={() => handleSaveDSP(true)}
              className="h-9 px-5 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
            >
              Submit Direct Purchase
            </Button>
          </div>
        }
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSaveDSP(true); }} className="space-y-5 py-1">
          {/* SECTION 1: BASIC INFORMATION */}
          <PurchaseFormCard title="Basic Information" sectionNumber="Section 1 of 5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Purchase Date" required>
                <TextInput
                  type="date"
                  value={formDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormDate(e.target.value)}
                  className="h-11 md:h-9 text-xs"
                />
              </FormField>
              <FormField label="Department" required>
                <SelectInput
                  value={formDepartment}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormDepartment(e.target.value)}
                  className="h-11 md:h-9 text-xs"
                >
                  <option value="Kitchen / F&B">Kitchen / F&B</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Housekeeping">Housekeeping</option>
                </SelectInput>
              </FormField>
              <FormField label="Requester / Purchaser" required>
                <TextInput
                  value={formRequester}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormRequester(e.target.value)}
                  className="h-11 md:h-9 text-xs font-bold"
                />
              </FormField>
              <FormField label="Store Location" required>
                <TextInput
                  value={formStoreLocation}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormStoreLocation(e.target.value)}
                  className="h-11 md:h-9 text-xs"
                />
              </FormField>
            </div>
          </PurchaseFormCard>

          {/* SECTION 2: VENDOR & PAYMENT DETAILS */}
          <PurchaseFormCard title="Vendor & Payment Details" sectionNumber="Section 2 of 5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Local Vendor Name" required>
                <TextInput
                  value={formVendorName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormVendorName(e.target.value)}
                  className="h-11 md:h-9 text-xs font-bold"
                />
              </FormField>
              <FormField label="Payment Method" required>
                <SelectInput
                  value={formPaymentType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormPaymentType(e.target.value as any)}
                  className="h-11 md:h-9 text-xs font-medium"
                >
                  <option value="Spot Cash">Spot Cash Reimbursement</option>
                  <option value="Corporate Card">Company Corporate Card</option>
                  <option value="Direct Credit">Direct Vendor Credit Account</option>
                </SelectInput>
              </FormField>
              <FormField label="Receipt / Bill Number">
                <TextInput
                  value={formBillNo}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormBillNo(e.target.value)}
                  className="h-11 md:h-9 text-xs font-mono"
                />
              </FormField>
              <FormField label="Received By">
                <TextInput
                  value={formReceiverName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormReceiverName(e.target.value)}
                  className="h-11 md:h-9 text-xs"
                />
              </FormField>
            </div>
          </PurchaseFormCard>

          {/* SECTION 3: PURCHASED ITEMS */}
          <PurchaseFormCard
            title={`Purchased Items (${formItems.length})`}
            sectionNumber="Section 3 of 5"
            actionSlot={
              <Button
                type="button"
                onClick={() =>
                  setFormItems([
                    ...formItems,
                    { id: `dsp-item-${Date.now()}`, itemName: "Direct Item", category: "General", quantity: 1, unit: "Pcs", unitRate: 100, lineAmount: 100 },
                  ])
                }
                className="h-8 px-3 text-xs font-bold !bg-emerald-700 text-white rounded-lg cursor-pointer flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add Item
              </Button>
            }
          >
            <div className="space-y-3">
              {formItems.map((item) => (
                <div key={item.id} className="p-3 rounded-xl border border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-5 gap-3 items-center text-xs">
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-400 block font-medium mb-1">Item Description</span>
                    <TextInput
                      value={item.itemName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormItems(formItems.map((i) => (i.id === item.id ? { ...i, itemName: e.target.value } : i)))}
                      className="h-9 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium mb-1">Qty ({item.unit})</span>
                    <TextInput
                      type="number"
                      value={item.quantity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const qty = Number(e.target.value);
                        setFormItems(formItems.map((i) => (i.id === item.id ? { ...i, quantity: qty, lineAmount: qty * i.unitRate } : i)));
                      }}
                      className="h-9 text-xs text-center font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium mb-1">Price / Unit (₹)</span>
                    <TextInput
                      type="number"
                      value={item.unitRate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const price = Number(e.target.value);
                        setFormItems(formItems.map((i) => (i.id === item.id ? { ...i, unitRate: price, lineAmount: i.quantity * price } : i)));
                      }}
                      className="h-9 text-xs text-right font-bold"
                    />
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    <span className="font-extrabold text-emerald-800 text-xs">₹{item.lineAmount.toLocaleString("en-IN")}</span>
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
                <span className="text-emerald-950">Grand Total Purchase Amount</span>
                <span className="text-emerald-900 text-base">₹{totalAmountCalculated.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </PurchaseFormCard>

          {/* SECTION 4: REASON & JUSTIFICATION */}
          <PurchaseFormCard title="Purchase Reason & Justification" sectionNumber="Section 4 of 5">
            <TextAreaInput
              rows={3}
              value={formReason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormReason(e.target.value)}
              placeholder="Explain why direct store buy was necessary..."
              className="w-full text-xs p-3 border-slate-300 rounded-lg"
            />
          </PurchaseFormCard>

          {/* SECTION 5: ATTACHMENTS */}
          <PurchaseFormCard title="Receipt & Bill Attachments" sectionNumber="Section 5 of 5">
            <PurchaseAttachmentList
              attachments={formAttachments}
              onAddAttachment={(att) => setFormAttachments([...formAttachments, att])}
              onRemoveAttachment={(id) => setFormAttachments(formAttachments.filter((a) => a.id !== id))}
            />
          </PurchaseFormCard>
        </form>
      </Drawer>

      {/* VIEW DETAILS DRAWER */}
      {selectedDSP && (
        <Drawer
          open={!!selectedDSP}
          onClose={() => setSelectedDSP(null)}
          title="DSP Details"
          description={selectedDSP.dspNumber}
          width="lg"
          footer={
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedDSP(null)}
              className="w-full h-9 text-xs font-semibold"
            >
              Close
            </Button>
          }
        >
          <div className="space-y-5">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-1">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-sm font-extrabold text-emerald-900">{selectedDSP.dspNumber}</span>
                {renderStatusBadge(selectedDSP.status)}
              </div>
              <h3 className="text-base font-extrabold text-slate-900">{selectedDSP.vendorName}</h3>
              <p className="text-xs text-slate-500">
                {selectedDSP.department} • Requester: {selectedDSP.requesterName}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Items Purchased</h4>
              {selectedDSP.items.map((i) => (
                <div key={i.id} className="flex justify-between items-start gap-4 text-slate-800">
                  <span className="min-w-0">
                    {i.itemName}
                    <span className="block text-slate-500">
                      {i.quantity} {i.unit}
                    </span>
                  </span>
                  <span className="shrink-0 font-bold text-emerald-800">
                    ₹{i.lineAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center gap-4 pt-2 border-t border-slate-100 font-extrabold text-sm text-slate-900">
                <span>Total Value</span>
                <span className="text-emerald-900">₹{selectedDSP.totalAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
