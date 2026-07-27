"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Clock,
  Plus,
  Search,
  Paperclip,
  Trash2,
  X,
  FileSpreadsheet,
  ArrowLeft,
  Building2,
  User,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/frontoffice/ui/Modal";
import {
  TextInput,
  SelectInput,
  FormField,
  TextAreaInput,
} from "@/components/frontoffice/ui";
import { PRRequestedItem } from "@/app/data/purchaseRequisitionsData";
import {
  MOCK_INVENTORY_CATALOG,
  InventoryCatalogItem,
  PRFormAttachment,
  DEFAULT_FORM_ATTACHMENTS,
} from "../page";

export default function CreatePurchaseRequisitionPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto redirect to requisitions list with Large Right Drawer active
  useEffect(() => {
    router.replace("/purchase-stores/procurement/requisitions?create=true");
  }, [router]);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; variant: "success" | "info" } | null>(null);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Form Fields State (Preserving all original business logic & field names)
  const [newDept, setNewDept] = useState("Housekeeping");
  const [newRequester, setNewRequester] = useState("Amit Sharma");
  const [newReqDate, setNewReqDate] = useState("2026-07-25");
  const [newPriority, setNewPriority] = useState<"Low" | "Medium" | "High" | "Emergency">("High");
  const [newCostCenter, setNewCostCenter] = useState("CC-HK-LINEN");
  const [newJustification, setNewJustification] = useState(
    "Current linen inventory has fallen below the minimum stock level before the upcoming holiday season. Additional stock is required to maintain operational readiness."
  );

  // Dynamic Requested Items State
  const [newItems, setNewItems] = useState<PRRequestedItem[]>([
    {
      id: "item-init-1",
      item: "Bedsheet (King Size 300TC)",
      category: "Linen",
      quantity: 100,
      unit: "Pieces",
      estimatedPrice: 350,
      total: 35000,
      remarks: "High thread count 300TC for suite rooms",
    },
    {
      id: "item-init-2",
      item: "Pillow Cover (Satin Finish)",
      category: "Linen",
      quantity: 150,
      unit: "Pieces",
      estimatedPrice: 90,
      total: 13500,
      remarks: "Satin finish white covers",
    },
  ]);

  // Form Attachments State
  const [formAttachments, setFormAttachments] = useState<PRFormAttachment[]>(
    DEFAULT_FORM_ATTACHMENTS
  );

  // Master Inventory Modal States
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [inventorySearch, setInventorySearch] = useState("");
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<InventoryCatalogItem | null>(null);

  // Computed Total Amount
  const computedTotal = useMemo(() => {
    return newItems.reduce((acc, i) => acc + i.quantity * i.estimatedPrice, 0);
  }, [newItems]);

  // Filtered Catalog for Selection Modal
  const filteredInventoryCatalog = useMemo(() => {
    return MOCK_INVENTORY_CATALOG.filter((item) => {
      const query = inventorySearch.toLowerCase();
      return (
        item.itemCode.toLowerCase().includes(query) ||
        item.itemName.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      );
    });
  }, [inventorySearch]);

  // Item Field Change Handler
  const handleItemFieldChange = (id: string, field: "quantity" | "remarks", value: any) => {
    setNewItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "quantity") {
            const qty = Math.max(1, parseInt(value, 10) || 1);
            updated.quantity = qty;
            updated.total = qty * item.estimatedPrice;
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Remove Item Row Handler
  const handleRemoveItemRow = (id: string) => {
    if (newItems.length <= 1) {
      setToast({ message: "Requisition must contain at least one item.", variant: "info" });
      return;
    }
    setNewItems((prev) => prev.filter((i) => i.id !== id));
    setToast({ message: "Item removed from requisition.", variant: "info" });
  };

  // Inventory Item Selection Modal Handlers
  const handleOpenInventoryModal = () => {
    setInventorySearch("");
    setSelectedCatalogItem(MOCK_INVENTORY_CATALOG[0]);
    setIsInventoryModalOpen(true);
  };

  const handleConfirmAddInventoryItem = () => {
    if (!selectedCatalogItem) return;
    const newItem: PRRequestedItem = {
      id: `item-cat-${Date.now()}`,
      item: selectedCatalogItem.itemName,
      category: selectedCatalogItem.category,
      quantity: 1,
      unit: selectedCatalogItem.unit,
      estimatedPrice: selectedCatalogItem.estimatedPrice,
      total: selectedCatalogItem.estimatedPrice,
      remarks: "",
    };

    setNewItems((prev) => [...prev, newItem]);
    setIsInventoryModalOpen(false);
    setToast({
      message: `Added ${selectedCatalogItem.itemName} to requested items.`,
      variant: "success",
    });
  };

  // Native File Picker Select Handler
  const handleNativeFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAtts: PRFormAttachment[] = Array.from(files).map((file, idx) => {
      let type: PRFormAttachment["fileType"] = "File";
      const nameLower = file.name.toLowerCase();
      if (nameLower.endsWith(".pdf")) type = "PDF";
      else if (nameLower.endsWith(".xlsx") || nameLower.endsWith(".xls") || nameLower.endsWith(".csv")) type = "Excel";
      else if (nameLower.endsWith(".doc") || nameLower.endsWith(".docx")) type = "Word";
      else if (nameLower.match(/\.(jpg|jpeg|png|gif|webp)$/)) type = "Image";

      const sizeInKb = Math.round(file.size / 1024);
      const fileSize = sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`;

      return {
        id: `att-file-${Date.now()}-${idx}`,
        fileName: file.name,
        fileType: type,
        fileSize: fileSize,
        uploadedBy: newRequester || "Amit Sharma",
        uploadedOn: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      };
    });

    setFormAttachments((prev) => [...prev, ...newAtts]);
    setToast({ message: `Attached ${files.length} file(s).`, variant: "success" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveAttachment = (id: string) => {
    setFormAttachments((prev) => prev.filter((a) => a.id !== id));
    setToast({ message: "Attachment removed.", variant: "info" });
  };

  // Render File Type Icon Helper
  const renderFileIcon = (fileType: PRFormAttachment["fileType"]) => {
    switch (fileType) {
      case "PDF":
        return (
          <div className="p-2 rounded-lg bg-red-50 text-red-600 border border-red-100 shrink-0">
            <FileText className="h-4 w-4" />
          </div>
        );
      case "Excel":
        return (
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
            <FileSpreadsheet className="h-4 w-4" />
          </div>
        );
      case "Word":
        return (
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
            <FileText className="h-4 w-4" />
          </div>
        );
      case "Image":
        return (
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
            <Paperclip className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="p-2 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
            <Paperclip className="h-4 w-4" />
          </div>
        );
    }
  };

  // Submit / Save Draft Handlers
  const handleSaveRequisition = (isDraft: boolean) => {
    const actionText = isDraft ? "saved as draft" : "submitted for approval";
    setToast({
      message: `Purchase Requisition successfully ${actionText}!`,
      variant: "success",
    });
    setTimeout(() => {
      router.push("/purchase-stores/procurement/requisitions");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 antialiased pb-24 select-none">
      {/* Toast Notification */}
      {toast && (
        <div
          className={cn(
            "fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200",
            toast.variant === "success"
              ? "bg-emerald-900 text-white border-emerald-800"
              : "bg-slate-900 text-white border-slate-800"
          )}
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Hidden Native File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleNativeFileSelect}
        multiple
        className="hidden"
      />

      {/* STICKY TOP HEADER */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Header Title & Metadata */}
          <div className="flex items-center gap-3">
            <Link
              href="/purchase-stores/procurement/requisitions"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Back to Requisitions"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Create Purchase Requisition
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Draft
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 font-medium mt-0.5">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  <strong className="text-slate-700">Dept:</strong> {newDept || "Housekeeping"}
                </span>
                <span className="hidden sm:inline text-slate-300">•</span>
                <span className="hidden sm:flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <strong className="text-slate-700">Requester:</strong> {newRequester || "Amit Sharma"}
                </span>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/purchase-stores/procurement/requisitions")}
              className="h-9 px-3.5 text-xs font-semibold !bg-white hover:!bg-slate-100 text-slate-700 border-slate-300 rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSaveRequisition(true)}
              className="h-9 px-3.5 text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Save Draft
            </Button>
            <Button
              type="button"
              onClick={() => handleSaveRequisition(false)}
              className="h-9 px-4 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer focus:ring-2 focus:ring-emerald-500"
            >
              Submit Requisition
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* SECTION 1: BASIC INFORMATION */}
        <section className="bg-white rounded-[12px] border border-slate-200/80 p-6 shadow-xs transition-all">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Basic Information</h2>
                <p className="text-xs text-slate-500 font-medium">
                  General procurement details and organizational cost assignment
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Section 1 of 4
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Department" required>
              <SelectInput
                value={newDept}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewDept(e.target.value)}
                className="h-10 text-xs font-medium focus:ring-2 focus:ring-emerald-500 border-slate-300 rounded-lg"
              >
                <option value="Housekeeping">Housekeeping</option>
                <option value="Engineering">Engineering</option>
                <option value="Kitchen">Kitchen (Food & Beverage)</option>
              </SelectInput>
            </FormField>

            <FormField label="Requester Name" required>
              <TextInput
                value={newRequester}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRequester(e.target.value)}
                placeholder="Enter requester full name"
                className="h-10 text-xs font-medium focus:ring-2 focus:ring-emerald-500 border-slate-300 rounded-lg"
              />
            </FormField>

            <FormField label="Required Date" required>
              <TextInput
                type="date"
                value={newReqDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewReqDate(e.target.value)}
                className="h-10 text-xs font-medium focus:ring-2 focus:ring-emerald-500 border-slate-300 rounded-lg"
              />
            </FormField>

            <FormField label="Priority" required>
              <SelectInput
                value={newPriority}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setNewPriority(e.target.value as any)
                }
                className="h-10 text-xs font-medium focus:ring-2 focus:ring-emerald-500 border-slate-300 rounded-lg"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Emergency">Emergency</option>
              </SelectInput>
            </FormField>

            <div className="md:col-span-2">
              <FormField label="Cost Center" required>
                <SelectInput
                  value={newCostCenter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewCostCenter(e.target.value)}
                  className="h-10 text-xs font-medium focus:ring-2 focus:ring-emerald-500 border-slate-300 rounded-lg"
                >
                  <option value="CC-HK-LINEN">CC-HK-LINEN (Housekeeping Linen Dept)</option>
                  <option value="CC-ENG-HVAC">CC-ENG-HVAC (Engineering HVAC Maintenance)</option>
                  <option value="CC-FB-[#001]">CC-FB-[#001] (F&B Main Kitchen Operating)</option>
                </SelectInput>
              </FormField>
            </div>
          </div>
        </section>

        {/* SECTION 2: REQUESTED ITEMS */}
        <section className="bg-white rounded-[12px] border border-slate-200/80 p-6 shadow-xs transition-all space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Requested Items ({newItems.length})
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Select inventory master items and specify required quantities
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleOpenInventoryModal}
              className="h-9 px-3.5 text-xs font-bold !bg-emerald-700 hover:!bg-emerald-800 text-white rounded-lg cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" /> Add Item
            </Button>
          </div>

          {/* TABLE CONTAINER CARD FOR DESKTOP & TABLET */}
          <div className="hidden md:block rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            <div className="max-h-[320px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider text-slate-500 z-10">
                  <tr>
                    <th className="px-3.5 py-2.5">Item Description</th>
                    <th className="px-3.5 py-2.5">Category</th>
                    <th className="px-3 py-2.5 w-24 text-center">Quantity</th>
                    <th className="px-3.5 py-2.5">Unit</th>
                    <th className="px-3.5 py-2.5">Est. Price</th>
                    <th className="px-3.5 py-2.5">Est. Total</th>
                    <th className="px-3.5 py-2.5">Remarks</th>
                    <th className="px-3.5 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {newItems.map((item) => {
                    const estTotal = item.quantity * item.estimatedPrice;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-3.5 py-2 font-bold text-slate-900 min-w-[160px]">
                          {item.item}
                        </td>
                        <td className="px-3.5 py-2 text-slate-600 font-medium text-[11px]">
                          <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold">
                            {item.category || "General"}
                          </span>
                        </td>
                        <td className="px-2 py-2 w-24">
                          <TextInput
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              handleItemFieldChange(item.id, "quantity", e.target.value)
                            }
                            className="h-8 text-xs font-bold text-center border-slate-300 rounded-md"
                          />
                        </td>
                        <td className="px-3.5 py-2 text-slate-600 font-medium text-[11px]">
                          {item.unit || "Pcs"}
                        </td>
                        <td className="px-3.5 py-2 text-slate-700 font-bold whitespace-nowrap">
                          ₹{item.estimatedPrice.toLocaleString("en-IN")}
                        </td>
                        <td className="px-3.5 py-2 font-extrabold text-emerald-800 whitespace-nowrap">
                          ₹{estTotal.toLocaleString("en-IN")}
                        </td>
                        <td className="px-2 py-2 min-w-[150px]">
                          <TextInput
                            value={item.remarks || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              handleItemFieldChange(item.id, "remarks", e.target.value)
                            }
                            placeholder="Add specification remarks"
                            className="h-8 text-[11px] border-slate-300 rounded-md"
                          />
                        </td>
                        <td className="px-3.5 py-2 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(item.id)}
                            disabled={newItems.length <= 1}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors cursor-pointer",
                              newItems.length <= 1
                                ? "text-slate-300 cursor-not-allowed"
                                : "text-slate-400 hover:text-red-600 hover:bg-red-50"
                            )}
                            title={newItems.length <= 1 ? "Minimum 1 item required" : "Remove item"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE STACKED CARDS FOR SECTION 2 */}
          <div className="block md:hidden space-y-3">
            {newItems.map((item) => {
              const estTotal = item.quantity * item.estimatedPrice;
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.item}</h4>
                      <span className="inline-flex px-2 py-0.5 mt-1 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                        {item.category || "General"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(item.id)}
                      disabled={newItems.length <= 1}
                      className={cn(
                        "p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50",
                        newItems.length <= 1 && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-100">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                        Quantity ({item.unit})
                      </label>
                      <TextInput
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleItemFieldChange(item.id, "quantity", e.target.value)
                        }
                        className="h-8 text-xs font-bold text-center border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                        Est. Total
                      </label>
                      <div className="h-8 flex items-center px-3 font-extrabold text-emerald-800 bg-emerald-50/60 rounded-md border border-emerald-100">
                        ₹{estTotal.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                      Remarks
                    </label>
                    <TextInput
                      value={item.remarks || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleItemFieldChange(item.id, "remarks", e.target.value)
                      }
                      placeholder="Add specification remarks..."
                      className="h-8 text-[11px] border-slate-300"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* HIGHLIGHTED ESTIMATED TOTAL SUMMARY CARD */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-2xs">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide block">
                  Estimated Total
                </span>
                <span className="text-[11px] text-emerald-700 font-medium">
                  Sum of all {newItems.length} requested item lines
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg sm:text-xl font-extrabold text-emerald-900 tracking-tight">
                ₹{computedTotal.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </section>

        {/* SECTION 3: BUSINESS JUSTIFICATION */}
        <section className="bg-white rounded-[12px] border border-slate-200/80 p-6 shadow-xs transition-all space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              <FileCode className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Business Justification
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                State the purpose and business necessity of this requisition
              </p>
            </div>
          </div>

          <FormField label="Reason for Request" required>
            <TextAreaInput
              rows={3}
              value={newJustification}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewJustification(e.target.value)}
              placeholder="Provide a detailed explanation for this purchase request..."
              className="w-full h-24 p-3 text-xs leading-relaxed text-slate-900 placeholder:text-slate-400 rounded-lg border border-slate-300 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
            />
          </FormField>
          <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            Explain why this purchase is required and the business impact if delayed.
          </p>
        </section>

        {/* SECTION 4: ATTACHMENTS */}
        <section className="bg-white rounded-[12px] border border-slate-200/80 p-6 shadow-xs transition-all space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                <Paperclip className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Attachments ({formAttachments.length})
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Supporting quotations, specifications, or audit documents
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-9 px-3.5 text-xs font-bold !bg-emerald-700 hover:!bg-emerald-800 text-white rounded-lg cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" /> Add Attachment
            </Button>
          </div>

          {formAttachments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {formAttachments.map((att) => (
                <div
                  key={att.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-start justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {renderFileIcon(att.fileType)}
                    <div className="min-w-0">
                      <h4
                        className="text-xs font-bold text-slate-900 truncate"
                        title={att.fileName}
                      >
                        {att.fileName}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {att.fileSize} • {att.uploadedOn}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                        By {att.uploadedBy}
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
                      onClick={() => handleRemoveAttachment(att.id)}
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
              className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center text-xs space-y-2 cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <Paperclip className="h-6 w-6 mx-auto text-slate-400" />
              <p className="font-bold text-slate-800">No attachments added</p>
              <p className="text-[11px] text-slate-500 font-medium">
                Click "+ Add Attachment" to upload supporting documents or quotations.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* BOTTOM STICKY ACTION BAR */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 py-3.5 px-4 sm:px-8 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Ready for submission • Minimum 1 item verified</span>
          </div>

          <div className="flex items-center gap-2.5 ml-auto sm:ml-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/purchase-stores/procurement/requisitions")}
              className="h-10 px-4 text-xs font-semibold !bg-white hover:!bg-slate-100 text-slate-700 border-slate-300 rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSaveRequisition(true)}
              className="h-10 px-4 text-xs font-semibold border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Save Draft
            </Button>
            <Button
              type="button"
              onClick={() => handleSaveRequisition(false)}
              className="h-10 px-5 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer focus:ring-2 focus:ring-emerald-500"
            >
              Submit Requisition
            </Button>
          </div>
        </div>
      </footer>

      {/* SELECT INVENTORY ITEM MODAL (ERP CATALOG LOOKUP) */}
      <Modal
        open={isInventoryModalOpen}
        onClose={() => setIsInventoryModalOpen(false)}
        title="Select Inventory Item"
        description="Search master catalog and select an item to add to requested items."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsInventoryModalOpen(false)}
              className="h-9 px-4 text-xs font-semibold !bg-slate-100 text-slate-700 rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!selectedCatalogItem}
              onClick={handleConfirmAddInventoryItem}
              className="h-9 px-4 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
            >
              Add Selected Item
            </Button>
          </div>
        }
      >
        <div className="space-y-4 select-none py-1">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <TextInput
              value={inventorySearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInventorySearch(e.target.value)}
              placeholder="Search inventory items by code, name or category..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white max-h-[300px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 z-10">
                <tr>
                  <th className="px-3 py-2 w-10 text-center">Select</th>
                  <th className="px-3 py-2">Item Code</th>
                  <th className="px-3 py-2">Item Name</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Unit</th>
                  <th className="px-3 py-2 text-right">Est. Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredInventoryCatalog.length > 0 ? (
                  filteredInventoryCatalog.map((catalogItem) => {
                    const isSelected = selectedCatalogItem?.itemCode === catalogItem.itemCode;

                    return (
                      <tr
                        key={catalogItem.itemCode}
                        onClick={() => setSelectedCatalogItem(catalogItem)}
                        className={cn(
                          "cursor-pointer transition-colors",
                          isSelected ? "bg-emerald-50/80" : "hover:bg-slate-50/70"
                        )}
                      >
                        <td className="px-3 py-2.5 text-center">
                          <input
                            type="radio"
                            name="inventorySelect"
                            checked={isSelected}
                            onChange={() => setSelectedCatalogItem(catalogItem)}
                            className="accent-emerald-600 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2.5 font-mono font-bold text-slate-900">
                          {catalogItem.itemCode}
                        </td>
                        <td className="px-3 py-2.5 font-bold text-slate-900">
                          {catalogItem.itemName}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 font-medium">
                          {catalogItem.category}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 font-medium">
                          {catalogItem.unit}
                        </td>
                        <td className="px-3 py-2.5 text-right font-extrabold text-emerald-800">
                          ₹{catalogItem.estimatedPrice.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-medium">
                      No matching inventory items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
}
