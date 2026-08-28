"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  DollarSign,
  Tag,
  Search,
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
import type { ContractRecord, ContractItem } from "@/app/data/contractsData";
import { usePsList } from "@/hooks/usePsResource";
import { psContractService } from "@/services/purchase-stores/index";

export default function AnnualRateContractsPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: contractList, loading, reload } = usePsList(() => psContractService.list(), []);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Drawers State
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractRecord | null>(null);
  const [editContract, setEditContract] = useState<ContractRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; variant: "success" | "info" } | null>(null);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Form State for Contract Creation / Edit
  const [formContractType, setFormContractType] = useState<ContractRecord["contractType"]>("Blanket Purchase Agreement");
  const [formVendorName, setFormVendorName] = useState("LinenCare Supplies Ltd");
  const [formStartDate, setFormStartDate] = useState("2026-04-01");
  const [formEndDate, setFormEndDate] = useState("2027-03-31");
  const [formValue, setFormValue] = useState<number>(2400000);
  const [formPaymentTerms, setFormPaymentTerms] = useState("Net 30 Days after Monthly Billing");
  const [formEscalationClause, setFormEscalationClause] = useState("Fixed rate for 12 months. No mid-term escalation permitted.");
  const [formPenaltyTerms, setFormPenaltyTerms] = useState("0.5% per week delay max 5% penalty cap.");
  const [formMaxCap, setFormMaxCap] = useState<number>(3000000);
  const [formTerminationNotice, setFormTerminationNotice] = useState("30 Days Written Notice");
  const [formContactPerson, setFormContactPerson] = useState("Vikram Malhotra");
  const [formPhone, setFormPhone] = useState("+91 98990 12345");
  const [formEmail, setFormEmail] = useState("service@linencare.co.in");
  const [formTaxId, setFormTaxId] = useState("07AAACO1234K1Z9");

  // Form Items State
  const [formItems, setFormItems] = useState<ContractItem[]>([
    { id: "ci-1", itemOrService: "Bedsheet King Cotton 300TC", category: "Linen", agreedPrice: 340, unit: "Pieces", maxQtyLimit: 2000 },
  ]);

  // Form Attachments State
  const [formAttachments, setFormAttachments] = useState<AttachmentItem[]>([
    { id: "ca-1", fileName: "LinenCare_BPA_Signed_Contract.pdf", fileSize: "1.4 MB", fileType: "pdf" },
  ]);

  // Sync Form when Editing Contract
  useEffect(() => {
    if (editContract) {
      setFormContractType(editContract.contractType);
      setFormVendorName(editContract.vendorName);
      setFormStartDate(editContract.startDate);
      setFormEndDate(editContract.endDate);
      setFormValue(editContract.contractValue);
      setFormPaymentTerms(editContract.paymentTerms);
      setFormEscalationClause(editContract.priceEscalationClause);
      setFormPenaltyTerms(editContract.penaltyTerms);
      setFormMaxCap(editContract.maxCapValue);
      setFormTerminationNotice(editContract.terminationNotice);
      setFormContactPerson(editContract.contactPerson);
      setFormPhone(editContract.phone);
      setFormEmail(editContract.email);
      setFormTaxId(editContract.taxId);
      setFormItems(editContract.items);
      setFormAttachments(editContract.attachments);
    }
  }, [editContract]);

  // Dynamic KPIs
  const metrics = useMemo(() => {
    const active = contractList.filter((c) => c.status === "Active").length;
    const expiring = contractList.filter((c) => c.status === "Expiring Soon").length;
    const expired = contractList.filter((c) => c.status === "Expired").length;
    const totalValue = contractList.reduce((acc, c) => acc + c.contractValue, 0);

    return { active, expiring, expired, totalValue };
  }, [contractList]);

  const statusTabCounts = useMemo(() => ({
    all: contractList.length,
    Active: contractList.filter((c) => c.status === "Active").length,
    "Expiring Soon": contractList.filter((c) => c.status === "Expiring Soon").length,
    Expired: contractList.filter((c) => c.status === "Expired").length,
    Draft: contractList.filter((c) => c.status === "Draft").length,
  }), [contractList]);

  const activeFilterCount = useMemo(() => {
    return typeFilter !== "all" ? 1 : 0;
  }, [typeFilter]);

  const handleResetFilters = () => {
    setTypeFilter("all");
  };

  // Filtered Contract Records
  const filteredContracts = useMemo(() => {
    return contractList.filter((c) => {
      const matchSearch =
        c.contractNumber.toLowerCase().includes(search.toLowerCase()) ||
        c.vendorName.toLowerCase().includes(search.toLowerCase()) ||
        c.contractType.toLowerCase().includes(search.toLowerCase());

      const matchType = typeFilter === "all" || c.contractType === typeFilter;
      const matchStatus = statusFilter === "all" || c.status === statusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [contractList, search, typeFilter, statusFilter]);

  const [saving, setSaving] = useState(false);

  // Save Contract Handler
  const handleSaveContract = async (isPublish: boolean) => {
    const newRecord: Partial<ContractRecord> = {
      contractType: formContractType,
      vendorName: formVendorName,
      startDate: formStartDate,
      endDate: formEndDate,
      status: isPublish ? "Active" : "Draft",
      contractValue: Number(formValue) || 0,
      renewalNoticeDays: 30,
      contactPerson: formContactPerson,
      phone: formPhone,
      email: formEmail,
      taxId: formTaxId,
      priceEscalationClause: formEscalationClause,
      paymentTerms: formPaymentTerms,
      penaltyTerms: formPenaltyTerms,
      maxCapValue: Number(formMaxCap) || 0,
      specialConditions: "Standard OEM support and warranty terms.",
      terminationNotice: formTerminationNotice,
      warrantyTerms: "1 Year SLA performance warranty",
      approverName: "General Manager",
      approvalLevel: "Level 2",
      items: formItems,
      attachments: formAttachments,
      activityTimeline: [
        { stage: "Contract Created", timestamp: "Today", note: "Created by Procurement", author: "Current User" },
      ],
    };

    setSaving(true);
    try {
      if (editContract) {
        await psContractService.update(editContract.id, newRecord);
        setEditContract(null);
        setToast({ message: "Annual Rate Contract Updated Successfully", variant: "success" });
      } else {
        await psContractService.create(newRecord);
        setCreateDrawerOpen(false);
        setToast({
          message: isPublish ? "Contract Published & Activated" : "Contract Saved as Draft",
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

  // Status Badge Helper
  const renderStatusBadge = (status: ContractRecord["status"]) => {
    switch (status) {
      case "Active":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            Active
          </span>
        );
      case "Expiring Soon":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            Expiring Soon
          </span>
        );
      case "Expired":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            Expired
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
      key: "contractNumber",
      header: "Contract No",
      render: (r: ContractRecord) => <span className="font-mono font-bold text-emerald-800">{r.contractNumber}</span>,
    },
    {
      key: "vendorName",
      header: "Vendor Name",
      render: (r: ContractRecord) => <span className="font-bold text-slate-900">{r.vendorName}</span>,
    },
    {
      key: "contractType",
      header: "Contract Type",
      render: (r: ContractRecord) => (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700">
          <Tag className="h-3 w-3 text-slate-400" /> {r.contractType}
        </span>
      ),
    },
    {
      key: "startDate",
      header: "Validity Period",
      render: (r: ContractRecord) => (
        <span className="text-slate-600 text-[11px]">
          {r.startDate} to {r.endDate}
        </span>
      ),
    },
    {
      key: "contractValue",
      header: "Contract Value",
      align: "right",
      render: (r: ContractRecord) => (
        <span className="font-extrabold text-emerald-900">₹{r.contractValue.toLocaleString("en-IN")}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (r: ContractRecord) => renderStatusBadge(r.status),
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
        title="Annual Rate Contracts (ARC / BPA / AMC)"
        description="Long-term supplier rate cards, Blanket Purchase Agreements, and AMC service level agreements"
        action={
          <Button
            type="button"
            onClick={() => {
              setEditContract(null);
              setCreateDrawerOpen(true);
            }}
            className="h-9 px-4 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Create Contract
          </Button>
        }
      />

      {/* 2X2 KPI CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatMiniCard
          label="Active Contracts"
          value={metrics.active.toString()}
          sublabel="Currently operational SLAs"
          icon={Award}
          accent="#059669"
        />
        <StatMiniCard
          label="Expiring Soon"
          value={metrics.expiring.toString()}
          sublabel="Renewal due within 30 days"
          icon={Clock}
          accent="#d97706"
        />
        <StatMiniCard
          label="Expired Contracts"
          value={metrics.expired.toString()}
          sublabel="Requires re-tendering"
          icon={AlertTriangle}
          accent="#e11d48"
        />
        <StatMiniCard
          label="Total Contract Value"
          value={`₹${metrics.totalValue.toLocaleString("en-IN")}`}
          sublabel="Cumulative rate agreement cap"
          icon={DollarSign}
          accent="#047857"
        />
      </div>

      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search Contract #, vendor, type..."
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setFilterDrawerOpen(true)}
        statusTabs={[
          { id: "all", label: `All ${statusTabCounts.all}` },
          { id: "Active", label: `Active ${statusTabCounts.Active}` },
          { id: "Expiring Soon", label: `Expiring Soon ${statusTabCounts["Expiring Soon"]}` },
          { id: "Expired", label: `Expired ${statusTabCounts.Expired}` },
          { id: "Draft", label: `Draft ${statusTabCounts.Draft}` },
        ]}
        activeStatusTab={statusFilter}
        onStatusTabChange={setStatusFilter}
        selectionBar={
          <ModuleSelectionBar
            count={selectedIds.size}
            noun="contract"
            onClear={() => setSelectedIds(new Set())}
            actions={[
              {
                label: "View",
                onClick: () => {
                  const first = filteredContracts.find((c) => selectedIds.has(c.id));
                  if (first) setSelectedContract(first);
                },
              },
              {
                label: "Edit",
                onClick: () => {
                  const first = filteredContracts.find((c) => selectedIds.has(c.id));
                  if (first) {
                    setEditContract(first);
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
        title="Filter Contracts"
        activeFilterCount={activeFilterCount}
        onReset={handleResetFilters}
      >
        <FormField label="Contract Type">
          <SelectInput
            value={typeFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTypeFilter(e.target.value)}
            className="w-full text-xs rounded-xl h-9 bg-white"
          >
            <option value="all">All Contract Types</option>
            <option value="Blanket Purchase Agreement">Blanket Purchase Agreement (BPA)</option>
            <option value="Annual Maintenance Contract">Annual Maintenance Contract (AMC)</option>
            <option value="Service Agreement">Service Agreement</option>
            <option value="Rate Agreement">Rate Agreement</option>
          </SelectInput>
        </FormField>
      </OperationsFilterDrawer>

      {/* CORE SHARED MODULE DATA TABLE */}
      <div className="space-y-3">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Loading contracts…
          </div>
        ) : (
        <ModuleDataTable
          columns={columns}
          rows={filteredContracts}
          onRowClick={(r) => setSelectedContract(r as ContractRecord)}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          renderMobileCard={(r: ContractRecord) => (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono font-extrabold text-emerald-800 text-xs">{r.contractNumber}</span>
              {renderStatusBadge(r.status)}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">{r.vendorName}</h4>
              <p className="text-[11px] text-slate-500 font-medium">{r.contractType} • {r.startDate} to {r.endDate}</p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">Cap: ₹{r.maxCapValue.toLocaleString("en-IN")}</span>
              <span className="font-extrabold text-emerald-800 text-sm">₹{r.contractValue.toLocaleString("en-IN")}</span>
            </div>
          </div>
        )}
        />
        )}
      </div>

      {/* CREATE / EDIT CONTRACT DRAWER */}
      <Drawer
        open={createDrawerOpen || !!editContract}
        onClose={() => {
          setCreateDrawerOpen(false);
          setEditContract(null);
        }}
        title={editContract ? `Edit Contract: ${editContract.contractNumber}` : "Create Annual Rate Contract"}
        width="responsive"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCreateDrawerOpen(false);
                setEditContract(null);
              }}
              className="h-9 px-4 text-xs font-semibold !bg-white hover:!bg-slate-100 text-slate-700 border-slate-300 rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSaveContract(false)}
              className="h-9 px-4 text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Save Draft
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={() => handleSaveContract(true)}
              className="h-9 px-5 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
            >
              {saving ? "Saving…" : "Publish Contract"}
            </Button>
          </div>
        }
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSaveContract(true); }} className="space-y-5 py-1">
          {/* SECTION 1: CONTRACT INFORMATION */}
          <PurchaseFormCard title="Contract Information" sectionNumber="Section 1 of 5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Contract Type" required>
                <SelectInput
                  value={formContractType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormContractType(e.target.value as any)}
                  className="h-11 md:h-9 text-xs font-medium"
                >
                  <option value="Blanket Purchase Agreement">Blanket Purchase Agreement (BPA)</option>
                  <option value="Annual Maintenance Contract">Annual Maintenance Contract (AMC)</option>
                  <option value="Service Agreement">Service Agreement</option>
                  <option value="Rate Agreement">Rate Agreement</option>
                </SelectInput>
              </FormField>
              <FormField label="Vendor Name" required>
                <TextInput
                  value={formVendorName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormVendorName(e.target.value)}
                  className="h-11 md:h-9 text-xs font-bold"
                />
              </FormField>
              <FormField label="Start Date" required>
                <TextInput
                  type="date"
                  value={formStartDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormStartDate(e.target.value)}
                  className="h-11 md:h-9 text-xs"
                />
              </FormField>
              <FormField label="End Date / Renewal Date" required>
                <TextInput
                  type="date"
                  value={formEndDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormEndDate(e.target.value)}
                  className="h-11 md:h-9 text-xs"
                />
              </FormField>
            </div>
          </PurchaseFormCard>

          {/* SECTION 2: COVERED PRODUCTS / SERVICES SCHEDULE */}
          <PurchaseFormCard
            title={`Covered Products & Services (${formItems.length})`}
            sectionNumber="Section 2 of 5"
            actionSlot={
              <Button
                type="button"
                onClick={() =>
                  setFormItems([
                    ...formItems,
                    { id: `ci-${Date.now()}`, itemOrService: "Rate Card Item", category: "General", agreedPrice: 500, unit: "Unit", maxQtyLimit: 100 },
                  ])
                }
                className="h-8 px-3 text-xs font-bold !bg-emerald-700 text-white rounded-lg cursor-pointer flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add Rate Item
              </Button>
            }
          >
            <div className="space-y-3">
              {formItems.map((item) => (
                <div key={item.id} className="p-3 rounded-xl border border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-5 gap-3 items-center text-xs">
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-400 block font-medium mb-1">Item Description</span>
                    <TextInput
                      value={item.itemOrService}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormItems(formItems.map((i) => (i.id === item.id ? { ...i, itemOrService: e.target.value } : i)))}
                      className="h-9 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium mb-1">Agreed Rate (₹)</span>
                    <TextInput
                      type="number"
                      value={item.agreedPrice}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const r = Number(e.target.value);
                        setFormItems(formItems.map((i) => (i.id === item.id ? { ...i, agreedPrice: r } : i)));
                      }}
                      className="h-9 text-xs text-right font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium mb-1">Max Qty Limit</span>
                    <TextInput
                      type="number"
                      value={item.maxQtyLimit}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const q = Number(e.target.value);
                        setFormItems(formItems.map((i) => (i.id === item.id ? { ...i, maxQtyLimit: q } : i)));
                      }}
                      className="h-9 text-xs text-center font-bold"
                    />
                  </div>
                  <div className="text-right sm:text-center">
                    <button
                      type="button"
                      onClick={() => setFormItems(formItems.filter((i) => i.id !== item.id))}
                      disabled={formItems.length <= 1}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-600 disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4 mx-auto" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </PurchaseFormCard>

          {/* SECTION 3: PRICING & COMMERCIAL TERMS */}
          <PurchaseFormCard title="Pricing & Commercial Terms" sectionNumber="Section 3 of 5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Total Contract Value (₹)" required>
                <TextInput
                  type="number"
                  value={formValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormValue(Number(e.target.value))}
                  className="h-11 md:h-9 text-xs font-bold"
                />
              </FormField>
              <FormField label="Max Cap Limit (₹)" required>
                <TextInput
                  type="number"
                  value={formMaxCap}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormMaxCap(Number(e.target.value))}
                  className="h-11 md:h-9 text-xs font-bold"
                />
              </FormField>
              <FormField label="Payment Terms" required>
                <TextInput
                  value={formPaymentTerms}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormPaymentTerms(e.target.value)}
                  className="h-11 md:h-9 text-xs"
                />
              </FormField>
              <FormField label="Price Escalation Clause">
                <TextInput
                  value={formEscalationClause}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormEscalationClause(e.target.value)}
                  className="h-11 md:h-9 text-xs"
                />
              </FormField>
            </div>
          </PurchaseFormCard>

          {/* SECTION 4: TERMS & SLA CONDITIONS */}
          <PurchaseFormCard title="SLA & Termination Terms" sectionNumber="Section 4 of 5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Penalty Terms">
                <TextInput
                  value={formPenaltyTerms}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormPenaltyTerms(e.target.value)}
                  className="h-11 md:h-9 text-xs"
                />
              </FormField>
              <FormField label="Termination Notice">
                <TextInput
                  value={formTerminationNotice}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormTerminationNotice(e.target.value)}
                  className="h-11 md:h-9 text-xs"
                />
              </FormField>
            </div>
          </PurchaseFormCard>

          {/* SECTION 5: ATTACHMENTS */}
          <PurchaseFormCard title="Signed Contract Attachments" sectionNumber="Section 5 of 5">
            <PurchaseAttachmentList
              attachments={formAttachments}
              onAddAttachment={(att) => setFormAttachments([...formAttachments, att])}
              onRemoveAttachment={(id) => setFormAttachments(formAttachments.filter((a) => a.id !== id))}
            />
          </PurchaseFormCard>
        </form>
      </Drawer>

      {/* VIEW DETAILS DRAWER */}
      {selectedContract && (
        <Drawer
          open={!!selectedContract}
          onClose={() => setSelectedContract(null)}
          title={`Contract SLA: ${selectedContract.contractNumber}`}
          width="lg"
        >
          <div className="space-y-6 pb-6 select-none">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-extrabold text-emerald-900">{selectedContract.contractNumber}</span>
                {renderStatusBadge(selectedContract.status)}
              </div>
              <h3 className="text-base font-extrabold text-slate-900">{selectedContract.vendorName}</h3>
              <p className="text-xs text-slate-500">{selectedContract.contractType} • {selectedContract.startDate} to {selectedContract.endDate}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Contract Value & Cap</h4>
              <div className="flex justify-between font-extrabold text-sm text-slate-900">
                <span>Contract Cap</span>
                <span className="text-emerald-900">₹{selectedContract.contractValue.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => setSelectedContract(null)}
              className="w-full h-9 text-xs font-bold !bg-slate-900 text-white rounded-xl shadow-xs cursor-pointer"
            >
              Close Contract View
            </Button>
          </div>
        </Drawer>
      )}
    </div>
  );
}
