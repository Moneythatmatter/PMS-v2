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
  Building2,
  Clock,
  FileSpreadsheet,
  Check,
  Trash2,
  Package,
  RefreshCcw,
  XCircle,
  ClipboardCheck,
  Warehouse,
  CalendarDays,
  Loader2,
  Edit,
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
import {
  PurchaseAttachmentList,
  AttachmentItem,
} from "@/components/purchase-stores/ui/PurchaseAttachmentList";
import {
  ProcurementFormSection,
  ProcurementSummaryRow,
} from "@/components/purchase-stores/ui/ProcurementFormParts";
import type { VendorReturnRecord, VRItem } from "@/app/data/vendorReturnsData";
import type { QualityInspectionRecord } from "@/app/data/qualityInspectionData";
import { normalizeGrnRecord } from "@/app/data/grnData";
import { usePsList } from "@/hooks/usePsResource";
import {
  psGrnService,
  psQualityInspectionService,
  psVendorReturnService,
  psWarehouseService,
} from "@/services/purchase-stores/index";

type VRFormItem = Omit<VRItem, "reason"> & { reason: VRItem["reason"] | "" };

const VR_RETURN_REASONS: VendorReturnRecord["returnReason"][] = [
  "Damaged Items",
  "Expired Items",
  "Wrong Product",
  "Quality Failure",
  "Packaging Damage",
  "Quantity Mismatch",
];

const VR_ITEM_REASONS: VRItem["reason"][] = [
  "Damaged",
  "Expired",
  "Wrong Item",
  "Quantity Mismatch",
  "Quality Failure",
  "Packaging Damage",
];

function rejectedLines(qi: QualityInspectionRecord) {
  return (qi.items ?? []).filter((line) => Number(line.rejectedQty) > 0);
}

/** Inspection rejection reasons are free text; map them onto the return reason list. */
function toItemReason(text?: string): VRFormItem["reason"] {
  const t = (text ?? "").toLowerCase();
  if (!t) return "";
  if (t.includes("packag")) return "Packaging Damage";
  if (t.includes("damag") || t.includes("broken") || t.includes("leak")) return "Damaged";
  if (t.includes("expir")) return "Expired";
  if (t.includes("wrong")) return "Wrong Item";
  if (t.includes("quantity") || t.includes("short")) return "Quantity Mismatch";
  return "Quality Failure";
}

function formatVrDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function VrDetailSection({
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

/** Only the quantity rejected at inspection can go back to the supplier. */
function maxReturnQty(item: Pick<VRItem, "receivedQty" | "acceptedQty">) {
  const rejected = item.receivedQty - item.acceptedQty;
  return rejected > 0 ? rejected : item.receivedQty;
}

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
  const { data: inspections, loading: loadingInspections } = usePsList(() => psQualityInspectionService.list(), []);
  const { data: grns } = usePsList(() => psGrnService.list(), []);
  const { data: warehouses } = usePsList(() => psWarehouseService.list(), []);

  const [formInspectionNum, setFormInspectionNum] = useState("");
  const [formGRNNum, setFormGRNNum] = useState("");
  const [formPONum, setFormPONum] = useState("");
  const [formSupplier, setFormSupplier] = useState("");
  const [formWarehouse, setFormWarehouse] = useState("");
  const [formReturnDate, setFormReturnDate] = useState("");
  const [formReturnReason, setFormReturnReason] = useState<VendorReturnRecord["returnReason"] | "">("");
  const [formReplacement, setFormReplacement] = useState<"" | "yes" | "no">("");
  const [formExpectedDate, setFormExpectedDate] = useState("");
  const [formTransportDetails, setFormTransportDetails] = useState("");
  const [formRemarks, setFormRemarks] = useState("");
  const [formItems, setFormItems] = useState<VRFormItem[]>([]);
  const [formAttachments, setFormAttachments] = useState<AttachmentItem[]>([]);

  const currentInspection = useMemo(
    () => inspections.find((qi) => qi.inspectionNumber === formInspectionNum) ?? null,
    [inspections, formInspectionNum],
  );

  /** Inspections with rejected stock that don't already have an open return. */
  const eligibleInspections = useMemo(() => {
    const returned = new Set(
      vrList.filter((v) => v.status !== "Cancelled").map((v) => v.inspectionNumber),
    );
    return inspections.filter(
      (qi) =>
        rejectedLines(qi).length > 0 &&
        (!returned.has(qi.inspectionNumber) || qi.inspectionNumber === editVR?.inspectionNumber),
    );
  }, [inspections, vrList, editVR?.inspectionNumber]);

  const warehouseOptions = useMemo(() => {
    const names = warehouses.filter((w) => w.status !== "Inactive").map((w) => w.name);
    return formWarehouse && !names.includes(formWarehouse) ? [formWarehouse, ...names] : names;
  }, [warehouses, formWarehouse]);

  const totalReturnUnits = formItems.reduce((sum, item) => sum + (Number(item.returnQty) || 0), 0);

  const updateFormItem = (id: string, patch: Partial<VRFormItem>) =>
    setFormItems((items) => items.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const openCreateDrawer = () => {
    setEditVR(null);
    setFormInspectionNum("");
    setFormGRNNum("");
    setFormPONum("");
    setFormSupplier("");
    setFormWarehouse("");
    setFormReturnDate(new Date().toISOString().slice(0, 10));
    setFormReturnReason("");
    setFormReplacement("");
    setFormExpectedDate("");
    setFormTransportDetails("");
    setFormRemarks("");
    setFormItems([]);
    setFormAttachments([]);
    setCreateDrawerOpen(true);
  };

  const openEditDrawer = (vr: VendorReturnRecord) => {
    setEditVR(vr);
    setFormInspectionNum(vr.inspectionNumber);
    setFormGRNNum(vr.grnNumber);
    setFormPONum(vr.poNumber);
    setFormSupplier(vr.supplierName);
    setFormWarehouse(vr.warehouse);
    setFormReturnDate(vr.returnDate);
    setFormReturnReason(vr.returnReason);
    setFormReplacement(vr.replacementDetails.replacementRequired ? "yes" : "no");
    setFormExpectedDate(vr.replacementDetails.expectedDate || "");
    setFormTransportDetails(vr.transportDetails || "");
    setFormRemarks(vr.remarks || "");
    setFormItems(vr.items);
    setFormAttachments(vr.attachments);
    setCreateDrawerOpen(true);
  };

  const closeFormDrawer = () => {
    setCreateDrawerOpen(false);
    setEditVR(null);
  };

  /** Pull supplier, GRN, PO, warehouse and the rejected lines from the chosen inspection. */
  const handleInspectionChange = (qiNum: string) => {
    setFormInspectionNum(qiNum);
    const qi = inspections.find((i) => i.inspectionNumber === qiNum);
    if (!qi) {
      setFormGRNNum("");
      setFormPONum("");
      setFormSupplier("");
      setFormWarehouse("");
      setFormItems([]);
      return;
    }
    setFormGRNNum(qi.grnNumber);
    setFormPONum(qi.poNumber);
    setFormSupplier(qi.supplierName);
    setFormWarehouse(qi.warehouse);

    const grn = grns.find((g) => g.grnNumber === qi.grnNumber);
    const grnLines = grn ? normalizeGrnRecord(grn).items : [];
    setFormItems(
      rejectedLines(qi).map((line, idx) => {
        const grnLine = grnLines.find((l) => l.productCode === line.productCode);
        const batch =
          grnLine?.batchAllocations.find((b) => b.rejectedQty > 0) ?? grnLine?.batchAllocations[0];
        return {
          id: `vri-${line.id || idx}`,
          productCode: line.productCode,
          productName: line.productName,
          receivedQty: Number(line.receivedQty) || 0,
          acceptedQty: Number(line.acceptedQty) || 0,
          returnQty: Number(line.rejectedQty) || 0,
          reason: toItemReason(line.rejectionReason),
          batchNumber: batch?.batchNumber ?? "",
          mfgDate: batch?.mfgDate,
          expiryDate: batch?.expiryDate ?? "",
          remarks: line.remarks ?? "",
        };
      }),
    );
  };

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
  const handleSaveReturn = async () => {
    if (saving) return;
    const missing = [
      !formInspectionNum && "Quality Inspection",
      !formWarehouse && "Dispatch Warehouse",
      !formReturnDate && "Return Date",
      !formReturnReason && "Return Reason",
      !formReplacement && "Replacement Required",
    ].filter(Boolean);
    if (missing.length > 0) {
      alert(`Please fill in: ${missing.join(", ")}`);
      return;
    }

    const items = formItems.filter((i) => Number(i.returnQty) > 0);
    if (items.length === 0) {
      alert("Enter a return quantity for at least one item.");
      return;
    }
    const overReturned = items.find((i) => i.returnQty > maxReturnQty(i));
    if (overReturned) {
      alert(`Return quantity for ${overReturned.productName} can't exceed ${maxReturnQty(overReturned)}.`);
      return;
    }
    const withoutReason = items.find((i) => !i.reason);
    if (withoutReason) {
      alert(`Select a return reason for ${withoutReason.productName}.`);
      return;
    }

    const replacementRequired = formReplacement === "yes";
    const newRecord: Partial<VendorReturnRecord> = {
      returnDate: formReturnDate,
      supplierName: formSupplier,
      grnNumber: formGRNNum,
      inspectionNumber: formInspectionNum,
      poNumber: formPONum,
      warehouse: formWarehouse,
      itemsReturnedCount: items.length,
      returnReason: formReturnReason as VendorReturnRecord["returnReason"],
      status: editVR?.status ?? "Pending Pickup",
      transportDetails: formTransportDetails.trim(),
      remarks: formRemarks.trim(),
      items: items as VRItem[],
      replacementDetails: {
        replacementRequired,
        expectedDate: replacementRequired ? formExpectedDate : "",
        status: replacementRequired ? editVR?.replacementDetails.status ?? "Pending" : "Not Applicable",
        supplierResponse: editVR?.replacementDetails.supplierResponse ?? "",
      },
      attachments: formAttachments,
    };

    setSaving(true);
    try {
      const saved = editVR
        ? await psVendorReturnService.update(editVR.id, newRecord)
        : await psVendorReturnService.create(newRecord);
      const wasEdit = Boolean(editVR);
      closeFormDrawer();
      await reload();

      if (!wasEdit) {
        setAutomationLog([
          "✓ Supplier Notified via Automated Email & Portal (Ref: " + saved.returnNumber + ")",
          "✓ Return Debit Note & Return Gate Pass (RGP) Generated",
          "✓ Vendor Return Register Updated in " + formWarehouse,
          "✓ Payment Block Triggered for Invoice Verification until Resolution",
          "✓ Purchase Department Notified for Replacement / Credit Note",
          "✓ Accounts Payable Notified for Ledger Adjustment",
          ...(replacementRequired && formExpectedDate
            ? ["✓ Replacement Tracking Order Created (Due: " + formExpectedDate + ")"]
            : []),
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
            onClick={openCreateDrawer}
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
                  if (first) openEditDrawer(first);
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
          onClick={openCreateDrawer}
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

      {/* CREATE / EDIT VENDOR RETURN DRAWER */}
      <Drawer
        side="bottom"
        open={createDrawerOpen || !!editVR}
        onClose={closeFormDrawer}
        title={editVR ? `Edit Vendor Return ${editVR.returnNumber}` : "Create Vendor Return"}
        width="responsive"
        customHeader={
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 id="drawer-title" className="truncate text-base font-bold text-slate-900 sm:text-lg">
                {editVR ? `Edit Vendor Return ${editVR.returnNumber}` : "New Vendor Return"}
              </h2>
              <p className="truncate text-xs text-slate-500">
                Send goods rejected at quality inspection back to the supplier.
              </p>
            </div>
          </div>
        }
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              <strong className="text-slate-800">{formItems.length}</strong> item{formItems.length === 1 ? "" : "s"} ·{" "}
              <strong className="text-slate-800">{totalReturnUnits}</strong> unit{totalReturnUnits === 1 ? "" : "s"} to return
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={closeFormDrawer}
                className="h-9 px-4 text-xs font-semibold !bg-white hover:!bg-slate-100 text-slate-700 border-slate-300 rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={saving}
                onClick={() => void handleSaveReturn()}
                className="h-9 px-5 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {editVR ? "Save Changes" : "Submit Return"}
              </Button>
            </div>
          </div>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSaveReturn();
          }}
          className="grid gap-5 pb-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start"
        >
          <div className="min-w-0 space-y-5">
            {/* SOURCE INSPECTION */}
            <ProcurementFormSection step={1} title="Source Inspection" subtitle="Pick the quality inspection that rejected the goods">
              <div className="space-y-4">
                <FormField label="Quality Inspection" required>
                  <div className="relative">
                    <ClipboardCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <SelectInput
                      value={formInspectionNum}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInspectionChange(e.target.value)}
                      disabled={!!editVR || loadingInspections || eligibleInspections.length === 0}
                      className={cn("block h-10 pl-9 text-sm", formInspectionNum ? "text-slate-900" : "text-slate-400")}
                    >
                      <option value="">
                        {loadingInspections
                          ? "Loading inspections…"
                          : eligibleInspections.length === 0
                            ? "No inspections with rejected items"
                            : "Select an inspection…"}
                      </option>
                      {editVR && !eligibleInspections.some((qi) => qi.inspectionNumber === formInspectionNum) && (
                        <option value={formInspectionNum}>{formInspectionNum}</option>
                      )}
                      {eligibleInspections.map((qi) => {
                        const rejectedUnits = rejectedLines(qi).reduce((s, l) => s + Number(l.rejectedQty || 0), 0);
                        return (
                          <option key={qi.id} value={qi.inspectionNumber}>
                            {qi.inspectionNumber} · {qi.supplierName} · {rejectedUnits} rejected
                          </option>
                        );
                      })}
                    </SelectInput>
                  </div>
                </FormField>
                {!loadingInspections && eligibleInspections.length === 0 && !editVR && (
                  <p className="text-[11px] text-amber-700">
                    Only completed inspections with rejected quantity, and no open return, can be returned.
                  </p>
                )}

                {formInspectionNum ? (
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-4 text-xs md:grid-cols-4">
                    <div className="min-w-0">
                      <dt className="flex items-center gap-1.5 text-slate-500">
                        <Building2 className="h-3.5 w-3.5" /> Supplier
                      </dt>
                      <dd className="mt-0.5 truncate text-sm font-semibold text-slate-900">{formSupplier || "—"}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="flex items-center gap-1.5 text-slate-500">
                        <PackageCheck className="h-3.5 w-3.5" /> GRN
                      </dt>
                      <dd className="mt-0.5 truncate font-mono text-sm font-semibold text-amber-800">{formGRNNum || "—"}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="flex items-center gap-1.5 text-slate-500">
                        <FileText className="h-3.5 w-3.5" /> Purchase Order
                      </dt>
                      <dd className="mt-0.5 truncate font-mono text-sm font-semibold text-slate-800">{formPONum || "—"}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="h-3.5 w-3.5" /> Inspected
                      </dt>
                      <dd className="mt-0.5 truncate text-sm font-semibold text-slate-800">
                        {currentInspection
                          ? `${currentInspection.inspectionDate || "—"}${currentInspection.inspectorName ? ` · ${currentInspection.inspectorName}` : ""}`
                          : "—"}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-6 text-center">
                    <p className="text-sm font-semibold text-slate-700">No inspection selected</p>
                    <p className="max-w-sm text-[11px] text-slate-500">
                      Supplier, GRN and the rejected items will load from the inspection you choose.
                    </p>
                  </div>
                )}
              </div>
            </ProcurementFormSection>

            {/* RETURN DETAILS */}
            <ProcurementFormSection step={2} title="Return Details" subtitle="Where it ships from, why, and what the supplier owes">
              <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
                <FormField label="Dispatch Warehouse" required>
                  <SelectInput
                    value={formWarehouse}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormWarehouse(e.target.value)}
                    className={cn("block h-10 text-sm", !formWarehouse && "text-slate-400")}
                  >
                    <option value="">Select warehouse…</option>
                    {warehouseOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>

                <FormField label="Return Date" required>
                  <TextInput
                    type="date"
                    value={formReturnDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormReturnDate(e.target.value)}
                    className="h-10 text-sm"
                  />
                </FormField>

                <FormField label="Return Reason" required>
                  <SelectInput
                    value={formReturnReason}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFormReturnReason(e.target.value as VendorReturnRecord["returnReason"] | "")
                    }
                    className={cn("block h-10 text-sm", !formReturnReason && "text-slate-400")}
                  >
                    <option value="">Select reason…</option>
                    {VR_RETURN_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>

                <div className="space-y-1.5 sm:col-span-2 xl:col-span-1">
                  <span id="vr-settlement-label" className="block text-xs font-medium text-slate-600">
                    Supplier Settlement<span className="text-red-500"> *</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="vr-settlement-label">
                      {(
                        [
                          { value: "yes", label: "Replacement" },
                          { value: "no", label: "Credit note" },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          role="radio"
                          aria-checked={formReplacement === opt.value}
                          onClick={() => setFormReplacement(opt.value)}
                          className={cn(
                            "h-10 whitespace-nowrap rounded-lg border px-3 text-xs font-semibold transition-colors",
                            formReplacement === opt.value
                              ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                  </div>
                </div>

                {formReplacement === "yes" && (
                  <FormField label="Expected Replacement Date">
                    <TextInput
                      type="date"
                      value={formExpectedDate}
                      min={formReturnDate || undefined}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormExpectedDate(e.target.value)}
                      className="h-10 text-sm"
                    />
                  </FormField>
                )}

                <FormField label="Transport & Logistics">
                  <TextInput
                    value={formTransportDetails}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormTransportDetails(e.target.value)}
                    placeholder="Carrier, vehicle no., docket no."
                    className="h-10 text-sm"
                  />
                </FormField>

                <div className="sm:col-span-2 xl:col-span-3">
                  <FormField label="Remarks">
                    <TextInput
                      value={formRemarks}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormRemarks(e.target.value)}
                      placeholder="Gate pass instructions, supplier agreement…"
                      className="h-10 text-sm"
                    />
                  </FormField>
                </div>
              </div>
            </ProcurementFormSection>

            {/* RETURNED ITEMS */}
            <ProcurementFormSection
              step={3}
              title="Returned Items"
              subtitle="Rejected lines from the inspection — adjust quantities if only part is going back"
            >
              {formItems.length === 0 ? (
                <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-6 text-center">
                  <Package className="h-5 w-5 text-slate-400" />
                  <p className="text-sm font-semibold text-slate-700">No items yet</p>
                  <p className="max-w-sm text-[11px] text-slate-500">
                    Select an inspection above to load the items it rejected.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formItems.map((item) => {
                    const max = maxReturnQty(item);
                    return (
                      <div key={item.id} className="rounded-xl border border-slate-200 bg-white">
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{item.productName}</p>
                            <p className="text-xs text-slate-500">
                              <span className="font-mono">{item.productCode || "—"}</span> · Received {item.receivedQty} ·
                              Accepted {item.acceptedQty} · <span className="font-medium text-red-600">Rejected {max}</span>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormItems((items) => items.filter((i) => i.id !== item.id))}
                            disabled={formItems.length <= 1}
                            className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-30"
                            aria-label={`Remove ${item.productName}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 px-4 py-3 md:grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)_150px] xl:grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)_150px_minmax(0,1.3fr)]">
                          <FormField label="Return Qty" required>
                            <TextInput
                              type="number"
                              min={0}
                              max={max}
                              value={item.returnQty}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                updateFormItem(item.id, { returnQty: Math.max(0, Number(e.target.value) || 0) })
                              }
                              className={cn(
                                "h-9 text-center text-sm font-semibold",
                                item.returnQty > max && "border-red-400 text-red-600",
                              )}
                            />
                          </FormField>
                          <FormField label="Reason" required>
                            <SelectInput
                              value={item.reason}
                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                updateFormItem(item.id, { reason: e.target.value as VRFormItem["reason"] })
                              }
                              className={cn("block h-9 text-sm", !item.reason && "text-slate-400")}
                            >
                              <option value="">Select…</option>
                              {VR_ITEM_REASONS.map((reason) => (
                                <option key={reason} value={reason}>
                                  {reason}
                                </option>
                              ))}
                            </SelectInput>
                          </FormField>
                          <FormField label="Batch No.">
                            <TextInput
                              value={item.batchNumber}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                updateFormItem(item.id, { batchNumber: e.target.value })
                              }
                              placeholder="—"
                              className="h-9 font-mono text-sm"
                            />
                          </FormField>
                          <FormField label="Expiry">
                            <TextInput
                              type="date"
                              value={item.expiryDate || ""}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                updateFormItem(item.id, { expiryDate: e.target.value })
                              }
                              className="h-9 text-sm"
                            />
                          </FormField>
                          <div className="col-span-2 md:col-span-4 xl:col-span-1">
                            <FormField label="Item Remarks">
                              <TextInput
                                value={item.remarks || ""}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  updateFormItem(item.id, { remarks: e.target.value })
                                }
                                placeholder="Condition details…"
                                className="h-9 text-sm"
                              />
                            </FormField>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ProcurementFormSection>

            {/* ATTACHMENTS */}
            <ProcurementFormSection step={4} title="Debit Note & Photo Evidence" subtitle="Optional — rejection photos, gate pass, debit note">
              <PurchaseAttachmentList
                attachments={formAttachments}
                onAddAttachment={(att) => setFormAttachments((list) => [...list, att])}
                onRemoveAttachment={(id) => setFormAttachments((list) => list.filter((a) => a.id !== id))}
              />
            </ProcurementFormSection>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-0">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900">Return Summary</h3>
              <dl className="mt-4 space-y-3 text-xs">
                <ProcurementSummaryRow icon={<ClipboardCheck className="h-3.5 w-3.5" />} label="Inspection" value={formInspectionNum} valueClassName="font-mono" />
                <ProcurementSummaryRow icon={<Building2 className="h-3.5 w-3.5" />} label="Supplier" value={formSupplier} />
                <ProcurementSummaryRow icon={<Warehouse className="h-3.5 w-3.5" />} label="Ships from" value={formWarehouse} />
                <ProcurementSummaryRow icon={<CalendarDays className="h-3.5 w-3.5" />} label="Return date" value={formReturnDate} />
                <ProcurementSummaryRow icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Reason" value={formReturnReason} />
                <ProcurementSummaryRow
                  icon={<RefreshCcw className="h-3.5 w-3.5" />}
                  label="Settlement"
                  value={formReplacement === "yes" ? "Replacement" : formReplacement === "no" ? "Credit note" : ""}
                />
              </dl>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                <div>
                  <p className="text-[11px] text-slate-500">Items</p>
                  <p className="text-lg font-bold text-slate-900">{formItems.length}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Units to return</p>
                  <p className="text-lg font-bold text-red-600">{totalReturnUnits}</p>
                </div>
              </div>
            </section>
          </aside>
        </form>
      </Drawer>

      {/* VIEW RETURN DRAWER */}
      {selectedVR && (() => {
        const vr = selectedVR;
        const totals = vr.items.reduce(
          (acc, item) => ({
            received: acc.received + (Number(item.receivedQty) || 0),
            accepted: acc.accepted + (Number(item.acceptedQty) || 0),
            returned: acc.returned + (Number(item.returnQty) || 0),
          }),
          { received: 0, accepted: 0, returned: 0 },
        );
        const replacement = vr.replacementDetails;
        const replacementTone =
          {
            Pending: "bg-amber-50 text-amber-800 ring-amber-200",
            Dispatched: "bg-blue-50 text-blue-700 ring-blue-200",
            Received: "bg-emerald-50 text-emerald-800 ring-emerald-200",
          }[replacement.status as string] ?? "bg-slate-100 text-slate-600 ring-slate-200";

        return (
          <Drawer
            side="bottom"
            open={!!selectedVR}
            onClose={() => setSelectedVR(null)}
            title={`Vendor Return ${vr.returnNumber}`}
            width="lg"
            customHeader={
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 id="drawer-title" className="font-mono text-base font-bold text-slate-900 sm:text-lg">
                      {vr.returnNumber}
                    </h2>
                    {renderStatusBadge(vr.status)}
                    {renderReasonBadge(vr.returnReason)}
                  </div>
                  <p className="truncate text-xs text-slate-500">
                    {vr.supplierName || "—"} · Returned {formatVrDate(vr.returnDate)} · Ships from {vr.warehouse || "—"}
                  </p>
                </div>
              </div>
            }
            footer={
              <div className="flex w-full flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  <strong className="text-slate-800">{vr.items.length}</strong> item{vr.items.length === 1 ? "" : "s"} ·{" "}
                  <strong className="text-red-600">{totals.returned}</strong> unit{totals.returned === 1 ? "" : "s"} returned
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedVR(null)}
                    className="h-9 px-4 text-xs font-semibold !bg-white hover:!bg-slate-100 text-slate-700 border-slate-300 rounded-xl cursor-pointer"
                  >
                    Close
                  </Button>
                  {vr.status === "Pending Pickup" && (
                    <Button
                      type="button"
                      onClick={() => {
                        setSelectedVR(null);
                        openEditDrawer(vr);
                      }}
                      className="h-9 px-4 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Edit className="h-3.5 w-3.5" /> Edit Return
                    </Button>
                  )}
                </div>
              </div>
            }
          >
            <div className="grid gap-5 pb-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
              <div className="min-w-0 space-y-5">
                <VrDetailSection title="Returned Items" meta={`${vr.items.length} product${vr.items.length === 1 ? "" : "s"}`} flush>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-y border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-500">
                          <th className="px-5 py-2.5 font-medium">Product</th>
                          <th className="px-3 py-2.5 font-medium">Batch / Expiry</th>
                          <th className="px-3 py-2.5 text-right font-medium">Received</th>
                          <th className="px-3 py-2.5 text-right font-medium">Accepted</th>
                          <th className="px-5 py-2.5 text-right font-medium">Returned</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {vr.items.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-5 py-6 text-center text-xs text-slate-400">
                              No items on this return.
                            </td>
                          </tr>
                        ) : (
                          vr.items.map((item, idx) => (
                            <tr key={item.id || `vri-${idx}`} className="align-top">
                              <td className="px-5 py-3">
                                <p className="font-medium text-slate-900">{item.productName}</p>
                                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                                  {item.productCode && <span className="font-mono">{item.productCode}</span>}
                                  {item.reason && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 ring-1 ring-inset ring-red-200">
                                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                      {item.reason}
                                    </span>
                                  )}
                                </p>
                                {item.remarks && <p className="mt-1 text-xs text-slate-500">{item.remarks}</p>}
                              </td>
                              <td className="whitespace-nowrap px-3 py-3 text-xs">
                                <p className="font-mono text-slate-700">{item.batchNumber || "—"}</p>
                                <p className="text-slate-400">{item.expiryDate ? `Exp ${formatVrDate(item.expiryDate)}` : "No expiry"}</p>
                              </td>
                              <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-slate-700">{item.receivedQty}</td>
                              <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums text-emerald-700">{item.acceptedQty}</td>
                              <td className="whitespace-nowrap px-5 py-3 text-right font-semibold tabular-nums text-red-600">{item.returnQty}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {vr.items.length > 1 && (
                        <tfoot>
                          <tr className="border-t border-slate-200 bg-slate-50/70 text-sm">
                            <td colSpan={2} className="px-5 py-2.5 text-right text-xs font-medium text-slate-500">
                              Total
                            </td>
                            <td className="px-3 py-2.5 text-right font-medium tabular-nums text-slate-700">{totals.received}</td>
                            <td className="px-3 py-2.5 text-right font-medium tabular-nums text-emerald-700">{totals.accepted}</td>
                            <td className="px-5 py-2.5 text-right font-semibold tabular-nums text-red-600">{totals.returned}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </VrDetailSection>

                <VrDetailSection
                  title="Supplier Settlement"
                  meta={replacement.replacementRequired ? "Replacement requested" : "Credit note only"}
                >
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
                    <div>
                      <dt className="text-xs text-slate-500">Settlement</dt>
                      <dd className="mt-0.5 text-sm font-medium text-slate-900">
                        {replacement.replacementRequired ? "Replacement goods" : "Debit / credit note"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Expected replacement</dt>
                      <dd
                        className={cn(
                          "mt-0.5 text-sm",
                          replacement.replacementRequired && replacement.expectedDate
                            ? "font-medium text-slate-900"
                            : "text-slate-300",
                        )}
                      >
                        {replacement.replacementRequired
                          ? replacement.expectedDate
                            ? formatVrDate(replacement.expectedDate)
                            : "Not set"
                          : "Not applicable"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Status</dt>
                      <dd className="mt-1">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                            replacementTone,
                          )}
                        >
                          {replacement.status}
                        </span>
                      </dd>
                    </div>
                    <div className="sm:col-span-3">
                      <dt className="text-xs text-slate-500">Supplier response</dt>
                      <dd
                        className={cn(
                          "mt-0.5 whitespace-pre-line text-sm",
                          replacement.supplierResponse ? "text-slate-800" : "text-slate-400",
                        )}
                      >
                        {replacement.supplierResponse || "No response yet."}
                      </dd>
                    </div>
                  </dl>
                </VrDetailSection>

                <VrDetailSection title="Logistics & Notes">
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                    <div className="min-w-0">
                      <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Truck className="h-3.5 w-3.5" /> Transport
                      </dt>
                      <dd className={cn("mt-0.5 break-words text-sm", vr.transportDetails ? "font-medium text-slate-900" : "text-slate-300")}>
                        {vr.transportDetails || "Not specified"}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                        <FileText className="h-3.5 w-3.5" /> Remarks
                      </dt>
                      <dd className={cn("mt-0.5 whitespace-pre-line break-words text-sm", vr.remarks ? "text-slate-800" : "text-slate-300")}>
                        {vr.remarks || "None"}
                      </dd>
                    </div>
                  </dl>
                </VrDetailSection>

                {vr.attachments.length > 0 && (
                  <VrDetailSection title="Debit Note & Photo Evidence" meta={`${vr.attachments.length}`}>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {vr.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 shrink-0 text-slate-400" />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-medium text-slate-800">{att.fileName}</p>
                              <p className="text-[11px] text-slate-400">{att.fileSize}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => alert(`Downloading ${att.fileName}`)}
                            className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-100"
                          >
                            <Download className="h-3 w-3" /> Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </VrDetailSection>
                )}
              </div>

              <aside className="space-y-5 lg:sticky lg:top-0">
                <section className="rounded-xl border border-slate-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-slate-900">Summary</h3>
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 text-center">
                    <div>
                      <p className="text-[11px] text-slate-500">Received</p>
                      <p className="text-base font-bold tabular-nums text-slate-900">{totals.received}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">Accepted</p>
                      <p className="text-base font-bold tabular-nums text-emerald-700">{totals.accepted}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">Returned</p>
                      <p className="text-base font-bold tabular-nums text-red-600">{totals.returned}</p>
                    </div>
                  </div>
                  <dl className="mt-4 space-y-3 text-xs">
                    <ProcurementSummaryRow icon={<Building2 className="h-3.5 w-3.5" />} label="Supplier" value={vr.supplierName} />
                    <ProcurementSummaryRow icon={<CalendarDays className="h-3.5 w-3.5" />} label="Return date" value={vr.returnDate ? formatVrDate(vr.returnDate) : ""} />
                    <ProcurementSummaryRow icon={<Warehouse className="h-3.5 w-3.5" />} label="Ships from" value={vr.warehouse} />
                    <ProcurementSummaryRow icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Reason" value={vr.returnReason} />
                  </dl>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-slate-900">References</h3>
                  <dl className="mt-4 space-y-3 text-xs">
                    <ProcurementSummaryRow
                      icon={<ClipboardCheck className="h-3.5 w-3.5" />}
                      label="Inspection"
                      value={vr.inspectionNumber}
                      valueClassName="font-mono text-emerald-700"
                    />
                    <ProcurementSummaryRow
                      icon={<PackageCheck className="h-3.5 w-3.5" />}
                      label="GRN"
                      value={vr.grnNumber}
                      valueClassName="font-mono text-amber-700"
                    />
                    <ProcurementSummaryRow
                      icon={<FileText className="h-3.5 w-3.5" />}
                      label="Purchase order"
                      value={vr.poNumber}
                      valueClassName="font-mono"
                    />
                  </dl>
                </section>
              </aside>
            </div>
          </Drawer>
        );
      })()}
    </div>
  );
}
