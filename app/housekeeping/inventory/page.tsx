"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  Lock,
  Layers,
  Plus,
  Search,
  Eye,
  Download,
  ShieldCheck,
  Building,
  Tag,
  Clock,
  Sparkles,
  RefreshCw,
  FileText,
  DollarSign,
  Droplet,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import { OperationsToolbar, OperationsFilterDrawer } from "@/components/housekeeping/OperationsToolbar";
import {
  INITIAL_HOUSEKEEPING_INVENTORY,
  HousekeepingInventoryItem,
} from "@/app/data/housekeepingInventoryData";

export default function HousekeepingInventoryPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Main Inventory Data List State
  const [inventoryList, setInventoryList] = useState<HousekeepingInventoryItem[]>(
    INITIAL_HOUSEKEEPING_INVENTORY
  );

  // Active Category Filter Tab
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("All");

  // Search & Filter Drawer State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [storageFilter, setStorageFilter] = useState("all");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Drawers
  const [selectedItem, setSelectedItem] = useState<HousekeepingInventoryItem | null>(null);
  const [restockItem, setRestockItem] = useState<HousekeepingInventoryItem | null>(null);
  const [issueItem, setIssueItem] = useState<HousekeepingInventoryItem | null>(null);
  const [addItemOpen, setAddItemOpen] = useState(false);

  // Restock Form State
  const [restockQty, setRestockQty] = useState("50");
  const [supplierInvoice, setSupplierInvoice] = useState("INV-2026-889");

  // Issue Stock Form State
  const [issueQty, setIssueQty] = useState("10");
  const [issueTargetFloor, setIssueTargetFloor] = useState("Floor 3 Pantry Trolley");
  const [issuedToStaff, setIssuedToStaff] = useState("Meena Kumari");

  // Add Item Form State
  const [newSku, setNewSku] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<HousekeepingInventoryItem["category"]>("Linen");
  const [newSubCategory, setNewSubCategory] = useState("Bedding");
  const [newUnit, setNewUnit] = useState("Pcs");
  const [newParStock, setNewParStock] = useState("150");
  const [newUnitCost, setNewUnitCost] = useState("850");
  const [newStorage, setNewStorage] = useState("Main Linen Room - Rack A1");
  const [newSupplier, setNewSupplier] = useState("Metropolitan Fabrics Corp");

  // Toast State
  const [toast, setToast] = useState<{ message: string; variant: "success" | "info" } | null>(null);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Dynamic Summary KPIs Calculation
  const metrics = useMemo(() => {
    const totalItemsCount = inventoryList.length;
    const totalAvailableUnits = inventoryList.reduce((acc, i) => acc + i.available, 0);
    const totalLaundryUnits = inventoryList.reduce((acc, i) => acc + i.inLaundry, 0);
    const lowStockCount = inventoryList.filter((i) => i.status === "Low Stock" || i.status === "Critically Low").length;
    const damagedLostCount = inventoryList.reduce((acc, i) => acc + i.damaged + i.lost, 0);
    const totalValuation = inventoryList.reduce((acc, i) => acc + i.available * i.unitCost, 0);

    return {
      totalItemsCount,
      totalAvailableUnits,
      totalLaundryUnits,
      lowStockCount,
      damagedLostCount,
      totalValuation: `₹${(totalValuation / 1000).toFixed(1)}k`,
    };
  }, [inventoryList]);

  // Filter Active Count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (storageFilter !== "all") count++;
    if (activeCategoryTab !== "All") count++;
    return count;
  }, [statusFilter, storageFilter, activeCategoryTab]);

  // Filtered Inventory List
  const filteredInventory = useMemo(() => {
    return inventoryList.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        item.storageLocation.toLowerCase().includes(search.toLowerCase()) ||
        item.supplier.toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        activeCategoryTab === "All" ||
        item.category.toLowerCase() === activeCategoryTab.toLowerCase();

      const matchStatus =
        statusFilter === "all" || item.status.toLowerCase() === statusFilter.toLowerCase();

      const matchStorage =
        storageFilter === "all" ||
        item.storageLocation.toLowerCase().includes(storageFilter.toLowerCase());

      return matchSearch && matchCategory && matchStatus && matchStorage;
    });
  }, [inventoryList, search, activeCategoryTab, statusFilter, storageFilter]);

  // Handlers: Save Restock
  const handleSaveRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;
    const qty = parseInt(restockQty, 10) || 0;
    setInventoryList((prev) =>
      prev.map((i) => {
        if (i.id === restockItem.id) {
          const newAvail = i.available + qty;
          const isLow = newAvail / i.parStock < 0.6;
          const isUrgent = newAvail / i.parStock < 0.3;
          const nextStatus = isUrgent
            ? "Critically Low"
            : isLow
            ? "Low Stock"
            : "Stocked";

          return {
            ...i,
            available: newAvail,
            status: nextStatus,
            lastRestocked: "Today",
            lastUpdatedBy: "Admin User",
          };
        }
        return i;
      })
    );
    setToast({ message: `Restocked ${qty} ${restockItem.unit} for ${restockItem.name}`, variant: "success" });
    setRestockItem(null);
  };

  // Handlers: Save Issue Stock
  const handleSaveIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueItem) return;
    const qty = parseInt(issueQty, 10) || 0;
    if (qty > issueItem.available) {
      setToast({ message: "Requested issue qty exceeds available stock!", variant: "info" });
      return;
    }

    setInventoryList((prev) =>
      prev.map((i) => {
        if (i.id === issueItem.id) {
          const newAvail = i.available - qty;
          const newTrolley = i.inTrolleys + qty;
          const isLow = newAvail / i.parStock < 0.6;
          const isUrgent = newAvail / i.parStock < 0.3;
          const nextStatus = isUrgent
            ? "Critically Low"
            : isLow
            ? "Low Stock"
            : "Stocked";

          return {
            ...i,
            available: newAvail,
            inTrolleys: newTrolley,
            status: nextStatus,
            lastUpdatedBy: issuedToStaff,
          };
        }
        return i;
      })
    );
    setToast({ message: `Issued ${qty} ${issueItem.unit} to ${issueTargetFloor}`, variant: "success" });
    setIssueItem(null);
  };

  // Handlers: Add New Item
  const handleSaveAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const created: HousekeepingInventoryItem = {
      id: `INV-${Math.floor(100 + Math.random() * 900)}`,
      sku: newSku.toUpperCase() || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newName,
      category: newCategory,
      subCategory: newSubCategory,
      unit: newUnit,
      available: parseInt(newParStock, 10) || 100,
      inLaundry: 0,
      inTrolleys: 0,
      damaged: 0,
      lost: 0,
      parStock: parseInt(newParStock, 10) || 100,
      minReorderLevel: 30,
      unitCost: parseInt(newUnitCost, 10) || 500,
      storageLocation: newStorage,
      supplier: newSupplier,
      status: "Stocked",
      lastRestocked: "Today",
      lastUpdatedBy: "Admin User",
    };

    setInventoryList([created, ...inventoryList]);
    setAddItemOpen(false);
    setToast({ message: `Registered new inventory item: ${newName}`, variant: "success" });
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-5 select-none">
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

      {/* Header */}
      <FOPageHeader
        eyebrow="Supply & Stock Control"
        title="Housekeeping Inventory Management"
        description="Monitor hotel linen stock, vanity amenities, cleaning chemicals, machinery equipment, and issue daily supplies to floor attendant trolleys."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setToast({ message: "Exporting Inventory Stock Audit CSV...", variant: "info" })}
              className="!bg-white hover:!bg-slate-100 !text-slate-700 !border-slate-200 flex items-center justify-center gap-1.5 rounded-xl h-8 px-3 text-xs font-bold shrink-0"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" /> Export CSV
            </Button>

            <Button
              onClick={() => setAddItemOpen(true)}
              className="!bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white flex items-center justify-center gap-1.5 rounded-xl h-8 px-3.5 text-xs font-bold shrink-0 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" /> + Add New Item
            </Button>
          </div>
        }
      />

      {/* 6 Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatMiniCard label="Total Stock Value" value={metrics.totalValuation} icon={Package} accent="#10b981" />
        <StatMiniCard label="Available Units" value={`${metrics.totalAvailableUnits} Units`} icon={CheckCircle2} accent="#0284c7" />
        <StatMiniCard label="In Laundry Pipeline" value={`${metrics.totalLaundryUnits} Linen Pcs`} icon={ArrowRightLeft} accent="#9333ea" />
        <StatMiniCard label="Low Stock Alerts" value={`${metrics.lowStockCount} Items`} icon={AlertTriangle} accent="#d97706" />
        <StatMiniCard label="Damaged / Lost" value={`${metrics.damagedLostCount} Units`} icon={Lock} accent="#dc2626" />
        <StatMiniCard label="Pending Store Reqs" value="3 Requests" icon={Layers} accent="#0D9488" />
      </div>

      {/* Operations Toolbar with Category Tabs */}
      <OperationsToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search SKU, item name, storage room, supplier..."
        activeFilterCount={activeFilterCount}
        onOpenFilters={() => setFilterDrawerOpen(true)}
        statusTabs={[
          { id: "All", label: "All Items" },
          { id: "Linen", label: "Linen Items" },
          { id: "Amenity", label: "Guest Amenities" },
          { id: "Chemical", label: "Cleaning Chemicals" },
          { id: "Equipment", label: "Machinery Equipment" },
        ]}
        activeStatusTab={activeCategoryTab}
        onStatusTabChange={setActiveCategoryTab}
      />

      {/* Slide-over Filter Drawer */}
      <OperationsFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filter Inventory Stock Items"
        activeFilterCount={activeFilterCount}
        onReset={() => {
          setStatusFilter("all");
          setStorageFilter("all");
          setActiveCategoryTab("All");
        }}
      >
        <div className="space-y-4 select-none">
          <FormField label="Stock Health Status">
            <SelectInput
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="stocked">Stocked (Healthy)</option>
              <option value="low stock">Low Stock Warning</option>
              <option value="critically low">Critically Low</option>
            </SelectInput>
          </FormField>

          <FormField label="Storage Location Bay">
            <SelectInput
              value={storageFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStorageFilter(e.target.value)}
              className="w-full text-xs rounded-xl h-9 bg-white"
            >
              <option value="all">All Storage Bays</option>
              <option value="Main Linen Room">Main Linen Room</option>
              <option value="Pantry Store">Pantry Store Room 3</option>
              <option value="Chemical Safety">Chemical Safety Locker</option>
              <option value="Equipment Bay">Equipment Bay</option>
            </SelectInput>
          </FormField>
        </div>
      </OperationsFilterDrawer>

      {/* Main Inventory Data Table */}
      <div className="space-y-2">
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 z-10">
                <th className="px-3.5 py-3">SKU</th>
                <th className="px-3.5 py-3">Item Name</th>
                <th className="px-3.5 py-3">In Stock Available</th>
                <th className="px-3.5 py-3">In Laundry</th>
                <th className="px-3.5 py-3">Damaged / Lost</th>
                <th className="px-3.5 py-3">Par Level Stock</th>
                <th className="px-3.5 py-3">Storage Bay</th>
                <th className="px-3.5 py-3">Status</th>
                <th className="px-3.5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {filteredInventory.length > 0 ? (
                filteredInventory.map((item) => {
                  const isCriticallyLow = item.status === "Critically Low";
                  const isLowStock = item.status === "Low Stock";

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-3.5 py-3 font-mono font-bold text-slate-500">{item.sku}</td>
                      <td className="px-3.5 py-3">
                        <p className="font-extrabold text-slate-900 leading-tight">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{item.category} · {item.subCategory}</p>
                      </td>
                      <td className="px-3.5 py-3 font-extrabold text-slate-900">
                        {item.available} <span className="text-[10px] font-normal text-slate-400">{item.unit}</span>
                      </td>
                      <td className="px-3.5 py-3 text-purple-700 font-bold">
                        {item.category === "Linen" ? `${item.inLaundry} Pcs` : "—"}
                      </td>
                      <td className="px-3.5 py-3 text-red-600 font-medium">
                        {item.damaged} / {item.lost} {item.unit}
                      </td>
                      <td className="px-3.5 py-3 text-slate-500 font-normal">
                        {item.parStock} {item.unit}
                      </td>
                      <td className="px-3.5 py-3 text-slate-600 font-medium max-w-[150px] truncate">{item.storageLocation}</td>
                      <td className="px-3.5 py-3">
                        {isCriticallyLow ? (
                          <span className="rounded-full bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 text-[9px] font-extrabold uppercase animate-pulse">
                            Critically Low
                          </span>
                        ) : isLowStock ? (
                          <span className="rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 text-[9px] font-extrabold uppercase">
                            Low Stock
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[9px] font-extrabold uppercase">
                            Stocked
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-3 text-right space-x-1.5 whitespace-nowrap">
                        <Button
                          variant="outline"
                          onClick={() => setSelectedItem(item)}
                          className="py-1 px-2 text-[10px] font-bold text-slate-700 border-slate-200 rounded-lg inline-flex items-center gap-1 hover:bg-slate-100"
                        >
                          <Eye className="h-3 w-3 text-slate-500" /> Details
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => setIssueItem(item)}
                          className="py-1 px-2 text-[10px] font-bold text-blue-700 border-blue-200 hover:bg-blue-50 rounded-lg inline-flex items-center gap-1"
                        >
                          Issue
                        </Button>

                        <Button
                          onClick={() => setRestockItem(item)}
                          className="!bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white py-1 px-2 text-[10px] font-bold rounded-lg inline-flex items-center gap-1 shadow-2xs"
                        >
                          + Restock
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400 font-medium">
                    No inventory items found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
          <span>Showing {filteredInventory.length} of {inventoryList.length} inventory stock entries</span>
        </div>
      </div>

      {/* DETAILS DRAWER */}
      {selectedItem && (
        <Drawer
          open={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={`Inventory Item: ${selectedItem.sku}`}
          width="md"
        >
          <div className="space-y-4 select-none pb-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-extrabold text-emerald-700">{selectedItem.sku}</span>
                <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[9px] font-extrabold uppercase">
                  {selectedItem.status}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">{selectedItem.name}</h3>
              <p className="text-xs text-slate-500 font-medium">{selectedItem.category} · {selectedItem.subCategory}</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Stock Breakdown & Valuation</h4>
              <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Available In Store:</span>
                  <span className="font-extrabold text-emerald-700">{selectedItem.available} {selectedItem.unit}</span>
                </div>
                {selectedItem.category === "Linen" && (
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500">In Commercial Laundry:</span>
                    <span className="font-bold text-purple-700">{selectedItem.inLaundry} Pcs</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">In Attendant Trolleys:</span>
                  <span className="font-bold text-slate-800">{selectedItem.inTrolleys} {selectedItem.unit}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Damaged / Lost Stock:</span>
                  <span className="font-bold text-red-600">{selectedItem.damaged} Damaged / {selectedItem.lost} Lost</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Unit Valuation Price:</span>
                  <span className="font-bold text-slate-800">₹{selectedItem.unitCost} INR / {selectedItem.unit}</span>
                </div>
              </div>
            </div>

            {/* Chemical MSDS Safety Info */}
            {selectedItem.chemicalInfo && (
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Droplet className="h-3.5 w-3.5 text-blue-600" /> Chemical MSDS Compliance
                </h4>
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 space-y-1.5 text-xs text-blue-950 font-medium">
                  <div className="flex justify-between">
                    <span>Dilution Ratio:</span>
                    <strong className="text-blue-900">{selectedItem.chemicalInfo.dilutionRatio}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Required PPE:</span>
                    <strong className="text-blue-900">{selectedItem.chemicalInfo.ppeRequired.join(", ")}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Hazard Rating:</span>
                    <strong className="text-red-700">{selectedItem.chemicalInfo.hazardRating}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Linen Wash Lifecycle Info */}
            {selectedItem.linenInfo && (
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5 text-purple-600" /> Linen Wash Lifecycle
                </h4>
                <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3 space-y-1.5 text-xs text-purple-950 font-medium">
                  <div className="flex justify-between">
                    <span>Wash Cycle Count:</span>
                    <strong className="text-purple-900">{selectedItem.linenInfo.washCount} / {selectedItem.linenInfo.maxWashLifespan} Washes</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Ragging Status:</span>
                    <strong className="text-emerald-700">{selectedItem.linenInfo.raggingStatus}</strong>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Storage & Supplier</h4>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Storage Bay:</span>
                  <strong className="text-slate-800">{selectedItem.storageLocation}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Supplier:</span>
                  <strong className="text-slate-800">{selectedItem.supplier}</strong>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setSelectedItem(null)}
              className="w-full h-9 text-xs font-bold border-slate-200 !bg-slate-100 text-slate-700 hover:!bg-slate-200 rounded-xl"
            >
              Close Details
            </Button>
          </div>
        </Drawer>
      )}

      {/* RESTOCK ITEM DRAWER */}
      {restockItem && (
        <Drawer
          open={!!restockItem}
          onClose={() => setRestockItem(null)}
          title={`Restock Item: ${restockItem.name}`}
        >
          <form onSubmit={handleSaveRestock} className="space-y-4 select-none pb-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
              <span className="font-mono text-xs font-bold text-emerald-700">{restockItem.sku}</span>
              <h3 className="text-sm font-extrabold text-slate-900">{restockItem.name}</h3>
              <p className="text-xs text-slate-500">Current Stock: <strong>{restockItem.available} {restockItem.unit}</strong> (Par: {restockItem.parStock})</p>
            </div>

            <FormField label={`Restock Quantity (${restockItem.unit})`} required>
              <TextInput
                type="number"
                value={restockQty}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRestockQty(e.target.value)}
                className="h-9 text-xs"
              />
            </FormField>

            <FormField label="Supplier Invoice / Delivery Ref">
              <TextInput
                value={supplierInvoice}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSupplierInvoice(e.target.value)}
                className="h-9 text-xs"
              />
            </FormField>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRestockItem(null)}
                className="h-9 px-4 text-xs font-bold !bg-slate-100 text-slate-700 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 px-4 text-xs font-bold !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white rounded-xl"
              >
                Confirm Restock
              </Button>
            </div>
          </form>
        </Drawer>
      )}

      {/* ISSUE STOCK MATERIAL DRAWER */}
      {issueItem && (
        <Drawer
          open={!!issueItem}
          onClose={() => setIssueItem(null)}
          title={`Issue Stock: ${issueItem.name}`}
        >
          <form onSubmit={handleSaveIssue} className="space-y-4 select-none pb-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
              <span className="font-mono text-xs font-bold text-blue-700">{issueItem.sku}</span>
              <h3 className="text-sm font-extrabold text-slate-900">{issueItem.name}</h3>
              <p className="text-xs text-slate-500">Available: <strong>{issueItem.available} {issueItem.unit}</strong></p>
            </div>

            <FormField label={`Issue Quantity (${issueItem.unit})`} required>
              <TextInput
                type="number"
                value={issueQty}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIssueQty(e.target.value)}
                className="h-9 text-xs"
              />
            </FormField>

            <FormField label="Target Floor / Pantry Trolley" required>
              <SelectInput
                value={issueTargetFloor}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setIssueTargetFloor(e.target.value)}
                className="h-9 text-xs"
              >
                <option value="Floor 1 Pantry Trolley">Floor 1 Pantry Trolley</option>
                <option value="Floor 2 Pantry Trolley">Floor 2 Pantry Trolley</option>
                <option value="Floor 3 Pantry Trolley">Floor 3 Pantry Trolley</option>
                <option value="Floor 4 Pantry Trolley">Floor 4 Pantry Trolley</option>
                <option value="Public Area Lobby Storage">Public Area Lobby Storage</option>
              </SelectInput>
            </FormField>

            <FormField label="Issued To Staff Member">
              <TextInput
                value={issuedToStaff}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIssuedToStaff(e.target.value)}
                className="h-9 text-xs"
              />
            </FormField>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIssueItem(null)}
                className="h-9 px-4 text-xs font-bold !bg-slate-100 text-slate-700 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 px-4 text-xs font-bold !bg-blue-600 hover:!bg-blue-700 text-white rounded-xl"
              >
                Issue Material
              </Button>
            </div>
          </form>
        </Drawer>
      )}

      {/* ADD NEW INVENTORY ITEM DRAWER */}
      <Drawer
        open={addItemOpen}
        onClose={() => setAddItemOpen(false)}
        title="Register New Inventory Item"
      >
        <form onSubmit={handleSaveAddItem} className="space-y-4 select-none pb-6">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Item SKU Code">
              <TextInput
                value={newSku}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSku(e.target.value)}
                placeholder="e.g. SKU-LIN-BED-DBL"
                className="h-9 text-xs"
              />
            </FormField>

            <FormField label="Category" required>
              <SelectInput
                value={newCategory}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewCategory(e.target.value as any)}
                className="h-9 text-xs"
              >
                <option value="Linen">Linen</option>
                <option value="Amenity">Amenity</option>
                <option value="Chemical">Chemical</option>
                <option value="Equipment">Equipment</option>
                <option value="Uniform">Uniform</option>
              </SelectInput>
            </FormField>
          </div>

          <FormField label="Item Full Name" required>
            <TextInput
              value={newName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
              placeholder="e.g. Double Duvet Covers (Egyptian Cotton)"
              className="h-9 text-xs"
            />
          </FormField>

          <div className="grid grid-cols-3 gap-3">
            <FormField label="Sub-Category">
              <TextInput
                value={newSubCategory}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSubCategory(e.target.value)}
                placeholder="Bedding"
                className="h-9 text-xs"
              />
            </FormField>

            <FormField label="Unit of Measure">
              <TextInput
                value={newUnit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewUnit(e.target.value)}
                placeholder="Pcs / Bottles"
                className="h-9 text-xs"
              />
            </FormField>

            <FormField label="Par Stock Level">
              <TextInput
                type="number"
                value={newParStock}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewParStock(e.target.value)}
                className="h-9 text-xs"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Storage Bay Location">
              <TextInput
                value={newStorage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewStorage(e.target.value)}
                className="h-9 text-xs"
              />
            </FormField>

            <FormField label="Supplier Vendor Name">
              <TextInput
                value={newSupplier}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSupplier(e.target.value)}
                className="h-9 text-xs"
              />
            </FormField>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddItemOpen(false)}
              className="h-9 px-4 text-xs font-bold !bg-slate-100 text-slate-700 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-9 px-4 text-xs font-bold !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white rounded-xl shadow-2xs"
            >
              Register Item
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
