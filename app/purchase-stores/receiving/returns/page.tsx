"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Truck,
  PackageCheck,
  RotateCcw,
  IndianRupee,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Layers,
  Building2,
  Clock,
  FileSpreadsheet,
  Check,
  Trash2,
  Package,
  RefreshCcw,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import type { VendorReturnRecord, VRItem } from "@/app/data/vendorReturnsData";
import { usePsList } from "@/hooks/usePsResource";
import { psVendorReturnService } from "@/services/purchase-stores/index";

export default function VendorReturnsPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Main Dataset State
  const { data: vrList, loading, reload } = usePsList(() => psVendorReturnService.list(), []);
  const [saving, setSaving] = useState(false);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const statusTabCounts = useMemo(() => ({
    all: vrList.length,
    "Pending Pickup": vrList.filter((v) => v.status === "Pending Pickup").length,
    "Replacement Sent": vrList.filter((v) => v.status === "Replacement Sent").length,
    Completed: vrList.filter((v) => v.status === "Completed").length,
    Cancelled: vrList.filter((v) => v.status === "Cancelled").length,
  }), [vrList]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (supplierFilter !== "all") n += 1;
    if (warehouseFilter !== "all") n += 1;
    if (reasonFilter !== "all") n += 1;
    if (dateFilter) n += 1;
    return n;
  }, [supplierFilter, warehouseFilter, reasonFilter, dateFilter]);

  const handleResetFilters = () => {
    setSupplierFilter("all");
    setWarehouseFilter("all");
    setReasonFilter("all");
    setDateFilter("");
  };

  // Drawers & Modals State
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [selectedVR, setSelectedVR] = useState<VendorReturnRecord | null>(null);
  const [editVR, setEditVR] = useState<VendorReturnRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Automation Feedback State
  const [automationLog, setAutomationLog] = useState<string[] | null>(null);

  // Form State for Vendor Return Creation / Edit
  const [formInspectionNum, setFormInspectionNum] = useState("QI-2026-013");
  const [formGRNNum, setFormGRNNum] = useState("GRN-2026-013");
  const [formPONum, setFormPONum] = useState("PO-2026-043");
  const [formSupplier, setFormSupplier] = useState("EcoClean");
  const [formWarehouse, setFormWarehouse] = useState("Housekeeping Store");
  const [formReturnDate, setFormReturnDate] = useState("2026-07-24");
  const [formReturnReason, setFormReturnReason] = useState<VendorReturnRecord["returnReason"]>("Wrong Product");
  const [formReplacementRequired, setFormReplacementRequired] = useState<boolean>(true);
  const [formExpectedDate, setFormExpectedDate] = useState("2026-07-28");
  const [formTransportDetails, setFormTransportDetails] = useState("EcoClean Courier UP-14-CC-8090");
  const [formRemarks, setFormRemarks] = useState("5 canisters returned due to wrong product code delivery.");

  // Form Items State
  const [formItems, setFormItems] = useState<VRItem[]>([
    {
      id: "vri-form-1",
      productCode: "HK-CHM-08",
      productName: "Glass Polish Concentrated 5L",
      receivedQty: 5,
      acceptedQty: 0,
      returnQty: 5,
      reason: "Wrong Item",
      batchNumber: "B-ECO-7742",
      expiryDate: "2028-06-01",
      remarks: "Toilet cleaner shipped instead of glass polish",
    },
  ]);

  // Form Attachments State
  const [formAttachments, setFormAttachments] = useState<AttachmentItem[]>([
    { id: "vra-form-1", fileName: "Inspection_Rejection_Report.pdf", fileSize: "420 KB", fileType: "pdf" },
    { id: "vra-form-2", fileName: "Return_Gate_Pass_Draft.pdf", fileSize: "290 KB", fileType: "pdf" },
  ]);

  // Auto-fill GRN, PO, Supplier, Warehouse when Inspection Selected
  const handleInspectionChange = (qiNum: string) => {
    setFormInspectionNum(qiNum);
    if (qiNum === "QI-2026-011") {
      setFormGRNNum("GRN-2026-011");
      setFormPONum("PO-2026-041");
      setFormSupplier("Amul Dairy");
      setFormWarehouse("Main Warehouse");
    } else if (qiNum === "QI-2026-012") {
      setFormGRNNum("GRN-2026-012");
      setFormPONum("PO-2026-042");
      setFormSupplier("Fresh Farms");
      setFormWarehouse("Kitchen Store");
    } else if (qiNum === "QI-2026-013") {
      setFormGRNNum("GRN-2026-013");
      setFormPONum("PO-2026-043");
      setFormSupplier("EcoClean");
      setFormWarehouse("Housekeeping Store");
    } else if (qiNum === "QI-2026-014") {
      setFormGRNNum("GRN-2026-014");
      setFormPONum("PO-2026-044");
      setFormSupplier("ABC Linen Pvt Ltd");
      setFormWarehouse("Central Linen Warehouse");
    } else if (qiNum === "QI-2026-015") {
      setFormGRNNum("GRN-2026-015");
      setFormPONum("PO-2026-045");
      setFormSupplier("City Electricals");
      setFormWarehouse("Engineering Maintenance Store");
    }
  };

  // Sync Form when Editing VR
  useEffect(() => {
    if (editVR) {
      setFormInspectionNum(editVR.inspectionNumber);
      setFormGRNNum(editVR.grnNumber);
      setFormPONum(editVR.poNumber);
      setFormSupplier(editVR.supplierName);
      setFormWarehouse(editVR.warehouse);
      setFormReturnDate(editVR.returnDate);
      setFormReturnReason(editVR.returnReason);
      setFormReplacementRequired(editVR.replacementDetails.replacementRequired);
      setFormExpectedDate(editVR.replacementDetails.expectedDate || "");
      setFormTransportDetails(editVR.transportDetails);
      setFormRemarks(editVR.remarks || "");
      setFormItems(editVR.items);
      setFormAttachments(editVR.attachments);
    }
  }, [editVR]);

  // Filtered Vendor Return Records
  const filteredVRs = useMemo(() => {
    return vrList.filter((v) => {
      const matchSearch =
        v.returnNumber.toLowerCase().includes(search.toLowerCase()) ||
        v.supplierName.toLowerCase().includes(search.toLowerCase()) ||
        v.grnNumber.toLowerCase().includes(search.toLowerCase()) ||
        v.inspectionNumber.toLowerCase().includes(search.toLowerCase()) ||
        v.poNumber.toLowerCase().includes(search.toLowerCase()) ||
        v.warehouse.toLowerCase().includes(search.toLowerCase());

      const matchSupplier = supplierFilter === "all" || v.supplierName.toLowerCase().includes(supplierFilter.toLowerCase());
      const matchWarehouse = warehouseFilter === "all" || v.warehouse.toLowerCase().includes(warehouseFilter.toLowerCase());
      const matchStatus = statusFilter === "all" || v.status === statusFilter;
      const matchReason = reasonFilter === "all" || v.returnReason.toLowerCase().includes(reasonFilter.toLowerCase());
      const matchDate = !dateFilter || v.returnDate.includes(dateFilter);

      return matchSearch && matchSupplier && matchWarehouse && matchStatus && matchReason && matchDate;
    });
  }, [vrList, search, supplierFilter, warehouseFilter, statusFilter, reasonFilter, dateFilter]);

  // Handle Save / Submit Vendor Return
  const handleSaveReturn = async (isSubmit: boolean) => {
    const newRecord: Partial<VendorReturnRecord> = {
      returnDate: formReturnDate,
      supplierName: formSupplier,
      grnNumber: formGRNNum,
      inspectionNumber: formInspectionNum,
      poNumber: formPONum,
      warehouse: formWarehouse,
      itemsReturnedCount: formItems.length,
      returnReason: formReturnReason,
      status: isSubmit ? "Pending Pickup" : "Pending Pickup",
      transportDetails: formTransportDetails,
      remarks: formRemarks,
      items: formItems,
      replacementDetails: {
        replacementRequired: formReplacementRequired,
        expectedDate: formExpectedDate,
        status: formReplacementRequired ? "Pending" : "Not Applicable",
        supplierResponse: "Supplier notified via automated return ticket.",
      },
      attachments: formAttachments,
    };

    setSaving(true);
    try {
      let saved: VendorReturnRecord;
      if (editVR) {
        saved = await psVendorReturnService.update(editVR.id, newRecord);
        setEditVR(null);
      } else {
        saved = await psVendorReturnService.create(newRecord);
        setCreateDrawerOpen(false);
      }
      await reload();

      if (isSubmit) {
        setAutomationLog([
          "✓ Supplier Notified via Automated Email & Portal (Ref: " + saved.returnNumber + ")",
          "✓ Return Debit Note & Return Gate Pass (RGP) Generated",
          "✓ Vendor Return Register Updated in " + formWarehouse,
          "✓ Payment Block Triggered for Invoice Verification until Resolution",
          "✓ Purchase Department Notified for Replacement / Credit Note",
          "✓ Accounts Payable Notified for Ledger Adjustment",
          ...(formReplacementRequired ? ["✓ Replacement Tracking Order Created (Due: " + formExpectedDate + ")"] : []),
        ]);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save return");
    } finally {
      setSaving(false);
    }
  };

  // Status Badge Renderer
  const renderStatusBadge = (status: VendorReturnRecord["status"]) => {
    switch (status) {
      case "Completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Completed
          </span>
        );
      case "Replacement Sent":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Replacement Sent
          </span>
        );
      case "Pending Pickup":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Pending Pickup
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-red-50 text-red-700 border border-red-200">
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Cancelled
          </span>
        );
    }
  };

  // Return Reason Badge Renderer
  const renderReasonBadge = (reason: VendorReturnRecord["returnReason"]) => {
    switch (reason) {
      case "Damaged Items":
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-50 text-red-700 border border-red-200">
            Damaged
          </span>
        );
      case "Expired Items":
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200">
            Expired
          </span>
        );
      case "Wrong Product":
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-50 text-purple-700 border border-purple-200">
            Wrong Item
          </span>
        );
      case "Quantity Mismatch":
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
            Qty Mismatch
          </span>
        );
      case "Quality Failure":
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-50 text-rose-700 border border-rose-200">
            Quality Failure
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-md bg-orange-50 text-orange-700 border border-orange-200">
            Packaging Damage
          </span>
        );
    }
  };

  // ModuleDataTable Columns
  const columns: ModuleColumn[] = [
    {
      key: "returnNumber",
      header: "Return No",
      render: (r: VendorReturnRecord) => (
        <span className="font-mono font-bold text-red-800 flex items-center gap-1">
          <RotateCcw className="h-3.5 w-3.5 text-red-600" />
          {r.returnNumber}
        </span>
      ),
    },
    {
      key: "returnDate",
      header: "Return Date",
      render: (r: VendorReturnRecord) => <span className="text-slate-600 font-medium">{r.returnDate}</span>,
    },
    {
      key: "supplierName",
      header: "Supplier",
      render: (r: VendorReturnRecord) => <span className="font-bold text-slate-900">{r.supplierName}</span>,
    },
    {
      key: "grnNumber",
      header: "GRN No",
      render: (r: VendorReturnRecord) => <span className="font-mono font-semibold text-amber-800">{r.grnNumber}</span>,
    },
    {
      key: "inspectionNumber",
      header: "Inspection No",
      render: (r: VendorReturnRecord) => <span className="font-mono font-semibold text-emerald-800">{r.inspectionNumber}</span>,
    },
    {
      key: "warehouse",
      header: "Warehouse",
      render: (r: VendorReturnRecord) => <span className="text-slate-700 font-medium">{r.warehouse}</span>,
    },
    {
      key: "itemsReturnedCount",
      header: "Items Returned",
      align: "center",
      render: (r: VendorReturnRecord) => <span className="font-bold text-slate-800">{r.itemsReturnedCount}</span>,
    },
    {
      key: "returnReason",
      header: "Return Reason",
      align: "center",
      render: (r: VendorReturnRecord) => renderReasonBadge(r.returnReason),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (r: VendorReturnRecord) => renderStatusBadge(r.status),
    },
  ];

  if (!isMounted) return null;

  return (
    <div className="space-y-6 pb-12 select-none min-h-screen">
      {/* AUTOMATION LOG FEEDBACK MODAL */}
      {automationLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2 rounded-xl bg-red-100 text-red-700">
                <RotateCcw className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Vendor Return Submitted & Triggered</h3>
                <p className="text-xs text-slate-500 font-medium">Automatic system actions processed successfully</p>
              </div>
            </div>

            <div className="space-y-2 py-1">
              {automationLog.map((log, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                  <span>{log}</span>
                </div>
              ))}
            </div>

            <Button
              type="button"
              onClick={() => setAutomationLog(null)}
              className="w-full h-10 text-xs font-bold !bg-slate-900 hover:!bg-slate-800 text-white rounded-xl shadow-xs cursor-pointer"
            >
              Done & View Return Register
            </Button>
          </div>
        </div>
      )}

      {/* PAGE HEADER */}
      <FOPageHeader
        eyebrow="Receiving & Quality Control"
        title="Vendor Returns"
        description="Manage rejected goods returned to suppliers after quality inspection."
        action={
          <Button
            type="button"
            onClick={() => {
              setEditVR(null);
              setCreateDrawerOpen(true);
            }}
            className="h-9 px-4 text-xs font-bold !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Create Vendor Return
          </Button>
        }
      />

      {/* 4 SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatMiniCard
          label="Pending Returns"
          value="8"
          sublabel="Awaiting supplier pickup"
          icon={Truck}
          accent="#d97706"
        />
        <StatMiniCard
          label="Returned Today"
          value="5"
          sublabel="Successfully dispatched"
          icon={PackageCheck}
          accent="#10b981"
        />
        <StatMiniCard
          label="Replacement Pending"
          value="3"
          sublabel="Waiting for replacement items"
          icon={RefreshCcw}
          accent="#2563eb"
        />
        <StatMiniCard
          label="Return Value"
          value="₹2,45,000"
          sublabel="Current month"
          icon={IndianRupee}
          accent="#10b981"
        />
      </div>

      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search Return No, Supplier, GRN..."
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setFilterDrawerOpen(true)}
        statusTabs={[
          { id: "all", label: `All ${statusTabCounts.all}` },
          { id: "Pending Pickup", label: `Pending Pickup ${statusTabCounts["Pending Pickup"]}` },
          { id: "Replacement Sent", label: `Replacement Sent ${statusTabCounts["Replacement Sent"]}` },
          { id: "Completed", label: `Completed ${statusTabCounts.Completed}` },
          { id: "Cancelled", label: `Cancelled ${statusTabCounts.Cancelled}` },
        ]}
        activeStatusTab={statusFilter}
        onStatusTabChange={setStatusFilter}
        selectionBar={
          <ModuleSelectionBar
            count={selectedIds.size}
            noun="return"
            onClear={() => setSelectedIds(new Set())}
            actions={[
              {
                label: "View",
                onClick: () => {
                  const first = filteredVRs.find((v) => selectedIds.has(v.id));
                  if (first) setSelectedVR(first);
                },
              },
              {
                label: "Edit",
                onClick: () => {
                  const first = filteredVRs.find((v) => selectedIds.has(v.id));
                  if (first) {
                    setEditVR(first);
                    setCreateDrawerOpen(true);
                  }
                },
              },
              {
                label: "Download PDF",
                icon: <Download className="h-3.5 w-3.5" />,
                onClick: () => {
                  const first = filteredVRs.find((v) => selectedIds.has(v.id));
                  if (first) alert(`Downloading Debit Note & Return PDF for ${first.returnNumber}`);
                },
              },
              {
                label: "Print",
                icon: <Printer className="h-3.5 w-3.5" />,
                onClick: () => {
                  const first = filteredVRs.find((v) => selectedIds.has(v.id));
                  if (first) alert(`Printing Return Gate Pass for ${first.returnNumber}`);
                },
              },
            ]}
          />
        }
      />

      <OperationsFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filter Vendor Returns"
        activeFilterCount={activeFilterCount}
        onReset={handleResetFilters}
      >
        <div className="space-y-4">
          <FormField label="Supplier">
            <SelectInput
              value={supplierFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSupplierFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Suppliers</option>
              <option value="Amul Dairy">Amul Dairy</option>
              <option value="Fresh Farms">Fresh Farms</option>
              <option value="EcoClean">EcoClean</option>
              <option value="ABC Linen">ABC Linen Pvt Ltd</option>
              <option value="City Electricals">City Electricals</option>
            </SelectInput>
          </FormField>

          <FormField label="Warehouse">
            <SelectInput
              value={warehouseFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setWarehouseFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Warehouses</option>
              <option value="Main Warehouse">Main Warehouse</option>
              <option value="Kitchen Store">Kitchen Store</option>
              <option value="Housekeeping Store">Housekeeping Store</option>
              <option value="Central Linen Warehouse">Central Linen Store</option>
              <option value="Engineering Maintenance Store">Engineering Store</option>
            </SelectInput>
          </FormField>

          <FormField label="Return Reason">
            <SelectInput
              value={reasonFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReasonFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Reasons</option>
              <option value="Damaged">Damaged Items</option>
              <option value="Expired">Expired Items</option>
              <option value="Wrong">Wrong Product</option>
              <option value="Quality">Quality Failure</option>
              <option value="Packaging">Packaging Damage</option>
            </SelectInput>
          </FormField>

          <FormField label="Return Date">
            <TextInput
              type="date"
              value={dateFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateFilter(e.target.value)}
              className="h-9 w-full text-xs rounded-xl"
            />
          </FormField>
        </div>
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
          onClick={() => alert("Sorted by Date")}
          className="flex-1 h-11 text-xs font-bold border-slate-300 text-slate-700 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ArrowUpDown className="h-4 w-4" /> Sort
        </Button>
        <Button
          type="button"
          onClick={() => {
            setEditVR(null);
            setCreateDrawerOpen(true);
          }}
          className="flex-1 h-11 text-xs font-bold !bg-[#0F8A5F] text-white rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4" /> + Create
        </Button>
      </div>

      {/* CORE MODULE DATA TABLE & EMPTY STATE */}
      <div className="space-y-3">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Loading vendor returns…
          </div>
        ) : (
        <ModuleDataTable
          columns={columns}
          rows={filteredVRs}
          emptyMessage="No Vendor Returns Found"
          onRowClick={(r) => setSelectedVR(r as VendorReturnRecord)}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          renderMobileCard={(r: VendorReturnRecord) => (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono font-extrabold text-red-800 text-xs flex items-center gap-1">
                <RotateCcw className="h-3.5 w-3.5 text-red-600" />
                {r.returnNumber}
              </span>
              {renderStatusBadge(r.status)}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">{r.supplierName}</h4>
              <p className="text-[11px] text-slate-500 font-medium">
                GRN: {r.grnNumber} • QI: {r.inspectionNumber} • {r.warehouse}
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">{renderReasonBadge(r.returnReason)}</span>
              <span className="font-extrabold text-slate-800">{r.itemsReturnedCount} Items</span>
            </div>
          </div>
        )}
        />
        )}
      </div>

      {/* CREATE / EDIT VENDOR RETURN MODAL & DRAWER */}
      <Drawer
        open={createDrawerOpen || !!editVR}
        onClose={() => {
          setCreateDrawerOpen(false);
          setEditVR(null);
        }}
        title={editVR ? `Edit Vendor Return: ${editVR.returnNumber}` : "Create Vendor Return"}
        width="responsive"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCreateDrawerOpen(false);
                setEditVR(null);
              }}
              className="h-9 px-4 text-xs font-semibold !bg-white hover:!bg-slate-100 text-slate-700 border-slate-300 rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSaveReturn(false)}
              className="h-9 px-4 text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Save Draft
            </Button>
            <Button
              type="button"
              onClick={() => handleSaveReturn(true)}
              className="h-9 px-5 text-xs font-bold !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Check className="h-4 w-4" /> Submit Return
            </Button>
          </div>
        }
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSaveReturn(true); }} className="space-y-5 py-1">
          {/* SECTION 1: HEADER & REFERENCE */}
          <PurchaseFormCard title="Return Information & References" sectionNumber="Section 1 of 3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Select Quality Inspection (QI)" required>
                <SelectInput
                  value={formInspectionNum}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInspectionChange(e.target.value)}
                  className="h-11 md:h-9 text-xs font-mono font-bold"
                >
                  <option value="QI-2026-013">QI-2026-013 (EcoClean - Leakage Rejection)</option>
                  <option value="QI-2026-011">QI-2026-011 (Amul Dairy - Damaged Foil)</option>
                  <option value="QI-2026-012">QI-2026-012 (Fresh Farms - Near Expiry)</option>
                  <option value="QI-2026-014">QI-2026-014 (ABC Linen - Stitching Defect)</option>
                  <option value="QI-2026-015">QI-2026-015 (City Electricals - Rating Mismatch)</option>
                </SelectInput>
              </FormField>

              <FormField label="GRN Number (Auto-filled)" required>
                <TextInput
                  value={formGRNNum}
                  readOnly
                  className="h-11 md:h-9 text-xs font-mono font-bold bg-slate-50 text-slate-700"
                />
              </FormField>

              <FormField label="Supplier (Auto-filled)" required>
                <TextInput
                  value={formSupplier}
                  readOnly
                  className="h-11 md:h-9 text-xs font-bold bg-slate-50 text-slate-700"
                />
              </FormField>

              <FormField label="Warehouse" required>
                <SelectInput
                  value={formWarehouse}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormWarehouse(e.target.value)}
                  className="h-11 md:h-9 text-xs font-medium"
                >
                  <option value="Main Warehouse">Main Warehouse</option>
                  <option value="Kitchen Store">Kitchen Store</option>
                  <option value="Housekeeping Store">Housekeeping Store</option>
                  <option value="Central Linen Warehouse">Central Linen Warehouse</option>
                  <option value="Engineering Maintenance Store">Engineering Maintenance Store</option>
                </SelectInput>
              </FormField>

              <FormField label="Return Date" required>
                <TextInput
                  type="date"
                  value={formReturnDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormReturnDate(e.target.value)}
                  className="h-11 md:h-9 text-xs font-medium"
                />
              </FormField>

              <FormField label="Overall Return Reason" required>
                <SelectInput
                  value={formReturnReason}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormReturnReason(e.target.value as any)}
                  className="h-11 md:h-9 text-xs font-semibold"
                >
                  <option value="Damaged Items">Damaged Items</option>
                  <option value="Expired Items">Expired Items</option>
                  <option value="Wrong Product">Wrong Product</option>
                  <option value="Quality Failure">Quality Failure</option>
                  <option value="Packaging Damage">Packaging Damage</option>
                  <option value="Quantity Mismatch">Quantity Mismatch</option>
                </SelectInput>
              </FormField>

              <FormField label="Replacement Required?" required>
                <SelectInput
                  value={formReplacementRequired ? "yes" : "no"}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormReplacementRequired(e.target.value === "yes")}
                  className="h-11 md:h-9 text-xs font-bold"
                >
                  <option value="yes">Yes - Replacement Needed</option>
                  <option value="no">No - Debit Note / Credit Only</option>
                </SelectInput>
              </FormField>

              {formReplacementRequired && (
                <FormField label="Expected Replacement Date">
                  <TextInput
                    type="date"
                    value={formExpectedDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormExpectedDate(e.target.value)}
                    className="h-11 md:h-9 text-xs font-medium"
                  />
                </FormField>
              )}

              <FormField label="Transport & Logistics Details">
                <TextInput
                  value={formTransportDetails}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormTransportDetails(e.target.value)}
                  placeholder="Carrier name, vehicle #, dispatch bay..."
                  className="h-11 md:h-9 text-xs"
                />
              </FormField>

              <FormField label="Return Remarks" className="md:col-span-3">
                <TextInput
                  value={formRemarks}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormRemarks(e.target.value)}
                  placeholder="Gate pass instructions, supplier agreement..."
                  className="h-11 md:h-9 text-xs"
                />
              </FormField>
            </div>
          </PurchaseFormCard>

          {/* SECTION 2: RETURNED ITEMS GRID */}
          <PurchaseFormCard
            title={`Returned Items Grid (${formItems.length} Products)`}
            sectionNumber="Section 2 of 3"
            actionSlot={
              <Button
                type="button"
                onClick={() =>
                  setFormItems([
                    ...formItems,
                    {
                      id: `vri-form-${Date.now()}`,
                      productCode: "PRD-RET-01",
                      productName: "Additional Returned Item",
                      receivedQty: 50,
                      acceptedQty: 40,
                      returnQty: 10,
                      reason: "Damaged",
                      batchNumber: "B-BATCH-01",
                      expiryDate: "2027-01-01",
                      remarks: "Returned during receiving",
                    },
                  ])
                }
                className="h-8 px-3 text-xs font-bold !bg-emerald-700 text-white rounded-lg cursor-pointer flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Add Row
              </Button>
            }
          >
            <div className="space-y-4 overflow-x-auto">
              {formItems.map((item, idx) => (
                <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="font-bold text-slate-800">Returned Item #{idx + 1}: {item.productName} ({item.productCode})</span>
                    <button
                      type="button"
                      onClick={() => setFormItems(formItems.filter((i) => i.id !== item.id))}
                      disabled={formItems.length <= 1}
                      className="text-slate-400 hover:text-red-600 disabled:opacity-30 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    <div className="col-span-2">
                      <span className="text-[10px] font-semibold text-slate-500 block mb-1">Product Description</span>
                      <TextInput
                        value={item.productName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormItems(formItems.map((i) => (i.id === item.id ? { ...i, productName: e.target.value } : i)))
                        }
                        className="h-9 text-xs font-bold bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block mb-1">Received Qty</span>
                      <TextInput
                        type="number"
                        value={item.receivedQty}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const r = Number(e.target.value);
                          setFormItems(
                            formItems.map((i) =>
                              i.id === item.id ? { ...i, receivedQty: r, acceptedQty: Math.max(0, r - i.returnQty) } : i
                            )
                          );
                        }}
                        className="h-9 text-xs text-center font-semibold bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block mb-1">Accepted Qty</span>
                      <TextInput
                        type="number"
                        value={item.acceptedQty}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const acc = Number(e.target.value);
                          setFormItems(
                            formItems.map((i) =>
                              i.id === item.id ? { ...i, acceptedQty: acc, returnQty: Math.max(0, i.receivedQty - acc) } : i
                            )
                          );
                        }}
                        className="h-9 text-xs text-center font-semibold bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block mb-1">Return Qty</span>
                      <TextInput
                        type="number"
                        value={item.returnQty}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const ret = Number(e.target.value);
                          setFormItems(
                            formItems.map((i) =>
                              i.id === item.id
                                ? { ...i, returnQty: ret, acceptedQty: Math.max(0, i.receivedQty - ret) }
                                : i
                            )
                          );
                        }}
                        className="h-9 text-xs text-center font-extrabold text-red-600 bg-red-50 border-red-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block mb-1">Specific Reason</span>
                      <SelectInput
                        value={item.reason}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setFormItems(
                            formItems.map((i) => (i.id === item.id ? { ...i, reason: e.target.value as any } : i))
                          )
                        }
                        className="h-9 text-xs font-bold bg-white"
                      >
                        <option value="Damaged">Damaged</option>
                        <option value="Expired">Expired</option>
                        <option value="Wrong Item">Wrong Item</option>
                        <option value="Quantity Mismatch">Quantity Mismatch</option>
                        <option value="Quality Failure">Quality Failure</option>
                        <option value="Packaging Damage">Packaging Damage</option>
                      </SelectInput>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block mb-1">Batch Number</span>
                      <TextInput
                        value={item.batchNumber}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormItems(formItems.map((i) => (i.id === item.id ? { ...i, batchNumber: e.target.value } : i)))
                        }
                        className="h-9 text-xs font-mono bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block mb-1">Expiry Date</span>
                      <TextInput
                        type="date"
                        value={item.expiryDate || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormItems(formItems.map((i) => (i.id === item.id ? { ...i, expiryDate: e.target.value } : i)))
                        }
                        className="h-9 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block mb-1">Item Remarks</span>
                      <TextInput
                        value={item.remarks || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormItems(formItems.map((i) => (i.id === item.id ? { ...i, remarks: e.target.value } : i)))
                        }
                        placeholder="Condition details..."
                        className="h-9 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </PurchaseFormCard>

          {/* SECTION 3: ATTACHMENTS */}
          <PurchaseFormCard title="Return Debit Note & Photo Evidence" sectionNumber="Section 3 of 3">
            <PurchaseAttachmentList
              attachments={formAttachments}
              onAddAttachment={(att) => setFormAttachments([...formAttachments, att])}
              onRemoveAttachment={(id) => setFormAttachments(formAttachments.filter((a) => a.id !== id))}
            />
          </PurchaseFormCard>
        </form>
      </Drawer>

      {/* VIEW RETURN SIDE DRAWER */}
      {selectedVR && (
        <Drawer
          open={!!selectedVR}
          onClose={() => setSelectedVR(null)}
          title={`Vendor Return: ${selectedVR.returnNumber}`}
          width="lg"
        >
          <div className="space-y-6 pb-6 select-none">
            {/* HEADER SUMMARY CARD */}
            <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-extrabold text-red-900">{selectedVR.returnNumber}</span>
                <div className="flex items-center gap-2">
                  {renderReasonBadge(selectedVR.returnReason)}
                  {renderStatusBadge(selectedVR.status)}
                </div>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">{selectedVR.supplierName}</h3>
              <p className="text-xs text-slate-500 font-medium">
                GRN: {selectedVR.grnNumber} • QI: {selectedVR.inspectionNumber} • PO: {selectedVR.poNumber}
              </p>
            </div>

            {/* SECTION 1: RETURN INFORMATION */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-red-600" /> Return Information
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Return Number</span>
                  <span className="font-mono font-bold text-slate-900">{selectedVR.returnNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Return Date</span>
                  <span className="font-semibold text-slate-800">{selectedVR.returnDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Supplier</span>
                  <span className="font-bold text-slate-900">{selectedVR.supplierName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Purchase Order</span>
                  <span className="font-mono font-bold text-slate-800">{selectedVR.poNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">GRN Number</span>
                  <span className="font-mono font-bold text-amber-800">{selectedVR.grnNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Inspection Number</span>
                  <span className="font-mono font-bold text-emerald-800">{selectedVR.inspectionNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Dispatch Warehouse</span>
                  <span className="font-semibold text-slate-800">{selectedVR.warehouse}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Transport Details</span>
                  <span className="font-medium text-slate-700">{selectedVR.transportDetails}</span>
                </div>
              </div>
            </div>

            {/* SECTION 2: RETURNED ITEMS TABLE */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-red-600" /> Returned Items Breakdown
                </span>
                <span className="text-[11px] text-slate-500 font-semibold">{selectedVR.items.length} Products</span>
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                      <th className="py-2 px-2">Product</th>
                      <th className="py-2 px-2 text-center">Received Qty</th>
                      <th className="py-2 px-2 text-center">Accepted Qty</th>
                      <th className="py-2 px-2 text-center">Returned Qty</th>
                      <th className="py-2 px-2">Reason</th>
                      <th className="py-2 px-2">Batch No</th>
                      <th className="py-2 px-2">Expiry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {selectedVR.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 px-2 font-bold text-slate-900">
                          {item.productName}
                          <div className="text-[10px] font-normal text-slate-400">{item.productCode}</div>
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-700">{item.receivedQty}</td>
                        <td className="py-2.5 px-2 text-center font-extrabold text-emerald-700">{item.acceptedQty}</td>
                        <td className="py-2.5 px-2 text-center font-extrabold text-red-600">{item.returnQty}</td>
                        <td className="py-2.5 px-2">
                          <span className="text-red-700 font-bold">{item.reason}</span>
                        </td>
                        <td className="py-2.5 px-2 font-mono text-slate-700">{item.batchNumber}</td>
                        <td className="py-2.5 px-2 text-slate-600">{item.expiryDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 3: REPLACEMENT DETAILS */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <RefreshCcw className="h-4 w-4 text-blue-600" /> Replacement Tracking Details
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {selectedVR.replacementDetails.replacementRequired ? "Replacement Requested" : "Debit Note Only"}
                </span>
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Expected Replacement Date</span>
                  <span className="font-bold text-slate-900">{selectedVR.replacementDetails.expectedDate || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Replacement Status</span>
                  <span className="font-semibold text-blue-700">{selectedVR.replacementDetails.status}</span>
                </div>
                <div className="col-span-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 block font-medium">Supplier Response & Notes</span>
                  <p className="text-xs font-medium text-slate-700 mt-0.5">{selectedVR.replacementDetails.supplierResponse}</p>
                </div>
              </div>
            </div>

            {/* SECTION 4: ATTACHMENTS */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-600" /> Return Notes & Photo Evidence
              </h4>

              <div className="space-y-2">
                {selectedVR.attachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-slate-500" />
                      {att.fileName} ({att.fileSize})
                    </span>
                    <button
                      type="button"
                      onClick={() => alert(`Downloading ${att.fileName}`)}
                      className="text-xs font-bold text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* CLOSE BUTTON */}
            <Button
              type="button"
              onClick={() => setSelectedVR(null)}
              className="w-full h-10 text-xs font-bold !bg-slate-900 text-white rounded-xl shadow-xs cursor-pointer"
            >
              Close Return View
            </Button>
          </div>
        </Drawer>
      )}
    </div>
  );
}
