"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Building2,
  Boxes,
  Layers,
  CheckCircle2,
  Plus,
  Search,
  RotateCcw,
  Pencil,
  Printer,
  Download,
  Upload,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Box,
  Thermometer,
  QrCode,
  Barcode,
  Users,
  Clock,
  ShieldCheck,
  Package,
  Settings,
  Grid,
  List,
  Trash2,
  Check,
  AlertTriangle,
  Move,
  LayoutGrid,
  RefreshCcw,
  ArrowRightLeft,
  FileText,
  FileSpreadsheet,
  Zap,
  Info,
  Sliders,
  Sparkles,
  ExternalLink,
  Lock,
  Copy,
  Archive,
  ChevronUp,
  AlertCircle,
  Activity,
  HeartPulse,
  Bell,
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
import { FOSearchToolbar } from "@/components/frontoffice/ui/FOSearchToolbar";
import { ModuleDataTable } from "@/components/pms/ModuleDataTable";
import { ModuleSelectionBar } from "@/components/pms/ModuleSelectionBar";
import { ModuleColumn } from "@/components/pms/module-types";
import { PurchaseFormCard } from "@/components/purchase-stores/ui/PurchaseFormCard";
import {
  INITIAL_WAREHOUSE_RECORDS,
  WarehouseRecord,
  WarehouseType,
  BinRecord,
  StorageZone,
} from "@/app/data/warehouseData";

export default function WarehouseManagementPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Main Dataset State
  const [warehouseList, setWarehouseList] = useState<WarehouseRecord[]>(INITIAL_WAREHOUSE_RECORDS);

  // Selected Warehouse State (for Two-Panel View)
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("wh-1");
  const selectedWarehouse = useMemo(() => {
    return warehouseList.find((w) => w.id === selectedWarehouseId) || warehouseList[0];
  }, [warehouseList, selectedWarehouseId]);

  // Selected Bin / Zone State in Tree / Storage Structure
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>("z-1");
  const [selectedRackId, setSelectedRackId] = useState<string | null>("rack-a");
  const [selectedShelfId, setSelectedShelfId] = useState<string | null>("shelf-01");
  const [selectedBinId, setSelectedBinId] = useState<string | null>("b-1");

  // Selected Bin for Bin Details Right Drawer (Feature #3)
  const [activeBinDrawer, setActiveBinDrawer] = useState<BinRecord | null>(null);

  // View Mode: 'split' (Two-Panel Tree + Details) vs 'table' (Master Table)
  const [viewMode, setViewMode] = useState<"split" | "table">("split");

  // Tab State for Right Panel
  const [activeTab, setActiveTab] = useState<"general" | "structure" | "capacity" | "inventory" | "users" | "settings" | "audit">("general");

  // Global Page Search & Filter State
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Storage Structure Specific Search Input (Feature #5)
  const [structureSearch, setStructureSearch] = useState("");
  const [alertsOpen, setAlertsOpen] = useState(false);

  const hasActiveFilters = Boolean(
    search || typeFilter !== "all" || departmentFilter !== "all" || statusFilter !== "all" || zoneFilter !== "all"
  );

  const handleResetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setDepartmentFilter("all");
    setStatusFilter("all");
    setZoneFilter("all");
  };

  // Tree Expansion State (Expanded Node IDs)
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    "wh-1": true,
    "z-1": true,
    "wh-2": true,
    "rack-a": true,
    "shelf-01": true,
  });

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Modals & Context Menu State
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [binModalOpen, setBinModalOpen] = useState(false);
  const [structureModalType, setStructureModalType] = useState<"Zone" | "Rack" | "Shelf" | "Bin">("Zone");

  // Three-Dot Context Menu Popup State (Feature #1)
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
    nodeType: "Warehouse" | "Zone" | "Rack" | "Shelf" | "Bin";
    nodeName: string;
  } | null>(null);

  // Drag & Drop / Movement Confirmation Modal State (Feature #2)
  const [dragMoveConfirmation, setDragMoveConfirmation] = useState<{
    itemType: string;
    itemName: string;
    sourceName: string;
    targetName: string;
  } | null>(null);

  // Form Wizard State for Warehouse Creation
  const [newWhCode, setNewWhCode] = useState("");
  const [newWhName, setNewWhName] = useState("");
  const [newWhType, setNewWhType] = useState<WarehouseType>("Sub Warehouse");
  const [newWhDept, setNewWhDept] = useState("Food & Beverage");
  const [newWhAddress, setNewWhAddress] = useState("");
  const [newWhManager, setNewWhManager] = useState("");
  const [newWhPhone, setNewWhPhone] = useState("");
  const [newWhEmail, setNewWhEmail] = useState("");
  const [newWhDesc, setNewWhDesc] = useState("");

  // Settings State for Selected Warehouse
  const [whSettings, setWhSettings] = useState(selectedWarehouse.settings);

  useEffect(() => {
    if (selectedWarehouse) {
      setWhSettings(selectedWarehouse.settings);
    }
  }, [selectedWarehouseId]);

  // Filtered Warehouses
  const filteredWarehouses = useMemo(() => {
    return warehouseList.filter((w) => {
      const matchSearch =
        w.code.toLowerCase().includes(search.toLowerCase()) ||
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.department.toLowerCase().includes(search.toLowerCase()) ||
        w.manager.toLowerCase().includes(search.toLowerCase());

      const matchType = typeFilter === "all" || w.type === typeFilter;
      const matchDept = departmentFilter === "all" || w.department.toLowerCase().includes(departmentFilter.toLowerCase());
      const matchStatus = statusFilter === "all" || w.status === statusFilter;

      return matchSearch && matchType && matchDept && matchStatus;
    });
  }, [warehouseList, search, typeFilter, departmentFilter, statusFilter]);

  // Context Menu Action Handler
  const handleContextMenuAction = (action: string) => {
    if (!contextMenu) return;
    const { nodeType, nodeName } = contextMenu;
    setContextMenu(null);

    if (action.startsWith("Delete")) {
      // Business Rule Validation: Cannot delete occupied bins or nodes with child elements!
      alert(`[Business Rule Enforced]: Cannot delete ${nodeType} "${nodeName}" because it contains inventory or active child storage locations.`);
    } else if (action === "Duplicate Warehouse") {
      alert(`Warehouse "${nodeName}" duplicated as "${nodeName} (Copy)"`);
    } else if (action === "Archive Warehouse") {
      alert(`Warehouse "${nodeName}" archived successfully.`);
    } else {
      alert(`Action "${action}" executed on ${nodeType} "${nodeName}"`);
    }
  };

  // Handle Save Warehouse Wizard
  const handleSaveWarehouse = () => {
    const nextId = `wh-${Date.now()}`;
    const nextCode = newWhCode || `WH-NEW-0${warehouseList.length + 1}`;
    const newRecord: WarehouseRecord = {
      id: nextId,
      code: nextCode,
      name: newWhName || "New Storage Facility",
      type: newWhType,
      department: newWhDept,
      address: newWhAddress || "Main Hotel Complex",
      contactPerson: newWhManager || "Store Manager",
      phone: newWhPhone || "+91 98765 00000",
      email: newWhEmail || "store@hotel.com",
      status: "Active",
      description: newWhDesc || "Newly configured storage warehouse.",
      storageLocationsCount: 5,
      totalBinsCount: 30,
      occupiedBinsCount: 0,
      emptyBinsCount: 30,
      reservedBinsCount: 0,
      overloadedBinsCount: 0,
      totalVolumeCapacityCuM: 100,
      usedVolumeCapacityCuM: 0,
      totalWeightCapacityKg: 5000,
      usedWeightCapacityKg: 0,
      manager: newWhManager || "Store Manager",
      lastUpdated: "Just Now",
      zones: [
        {
          id: `z-new-1`,
          zoneName: "Default Primary Zone",
          zoneCode: "Z-DEF-01",
          aisleCount: 1,
          rackCount: 2,
          bins: [
            {
              id: `b-new-1`,
              binCode: `${nextCode}-A1-01`,
              binName: "Standard Storage Bin 01",
              shelfName: "Shelf A1",
              rackName: "Rack A",
              zoneName: "Default Primary Zone",
              capacityQty: 100,
              currentUtilizationQty: 0,
              maxWeightKg: 500,
              temperatureControlled: false,
              isExpiryStorage: false,
              isDefaultBin: true,
              barcode: `BAR-${nextCode}-01`,
              qrCode: `QR-${nextCode}-01`,
              status: "Active",
            },
          ],
        },
      ],
      inventory: [],
      users: [
        { id: `u-new`, name: newWhManager || "Manager", role: "Warehouse Manager", email: newWhEmail || "manager@hotel.com", phone: newWhPhone || "N/A" },
      ],
      settings: {
        allowNegativeStock: false,
        enableFEFO: true,
        enableFIFO: true,
        requireApproval: true,
        defaultReceivingArea: "Receiving Bay 01",
        defaultDispatchArea: "Dispatch Bay 01",
        temperatureControlled: false,
        barcodeRequired: true,
        qrCodeRequired: true,
        autoBinAllocation: true,
        defaultIssueBin: `${nextCode}-A1-01`,
        defaultReceivingBin: `${nextCode}-A1-01`,
      },
      recentTransactions: [],
      alerts: [{ id: "alt-new", type: "info", title: "Facility Initialized", message: "Warehouse configured and ready for stock allocation." }],
      auditLogs: [
        { timestamp: "Just Now", action: "Warehouse Created", performedBy: "System Administrator", status: "Success" },
        { timestamp: "Just Now", action: "Zone Added: Primary Zone 01", performedBy: "System Administrator", status: "Success" },
      ],
    };

    setWarehouseList([newRecord, ...warehouseList]);
    setSelectedWarehouseId(nextId);
    setWizardOpen(false);
    setWizardStep(1);
    alert(`Warehouse ${newRecord.code} created successfully!`);
  };

  // ModuleDataTable Columns
  const columns: ModuleColumn[] = [
    {
      key: "code",
      header: "Warehouse Code",
      render: (r: WarehouseRecord) => (
        <span className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
          <Building2 className="h-4 w-4 text-emerald-600" />
          {r.code}
        </span>
      ),
    },
    {
      key: "name",
      header: "Warehouse Name",
      render: (r: WarehouseRecord) => (
        <div>
          <span className="font-bold text-slate-900 block">{r.name}</span>
          <span className="text-[10px] text-slate-400 font-normal">{r.description}</span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (r: WarehouseRecord) => (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
          {r.type}
        </span>
      ),
    },
    {
      key: "department",
      header: "Department",
      render: (r: WarehouseRecord) => <span className="text-slate-700 font-medium">{r.department}</span>,
    },
    {
      key: "storageLocationsCount",
      header: "Locations",
      align: "center",
      render: (r: WarehouseRecord) => <span className="font-bold text-slate-800">{r.storageLocationsCount}</span>,
    },
    {
      key: "totalBinsCount",
      header: "Total Bins",
      align: "center",
      render: (r: WarehouseRecord) => <span className="font-bold text-slate-800">{r.totalBinsCount}</span>,
    },
    {
      key: "occupiedBinsCount",
      header: "Occupied Bins",
      align: "center",
      render: (r: WarehouseRecord) => (
        <span className="font-extrabold text-emerald-700">{r.occupiedBinsCount}</span>
      ),
    },
    {
      key: "capacity",
      header: "Available Capacity",
      align: "center",
      render: (r: WarehouseRecord) => {
        const utilPct = Math.round((r.usedVolumeCapacityCuM / r.totalVolumeCapacityCuM) * 100) || 0;
        const availPct = 100 - utilPct;
        return (
          <div className="w-24 text-center mx-auto">
            <span className="text-[11px] font-bold text-slate-800">{availPct}% Avail</span>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
              <div
                className={cn("h-full rounded-full", availPct < 15 ? "bg-red-500" : "bg-emerald-500")}
                style={{ width: `${utilPct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: "manager",
      header: "Manager",
      render: (r: WarehouseRecord) => <span className="text-slate-700 font-medium">{r.manager}</span>,
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (r: WarehouseRecord) => (
        <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          {r.status}
        </span>
      ),
    },
  ];

  if (!isMounted) return null;

  return (
    <div className="space-y-6 pb-12 select-none min-h-screen relative" onClick={() => setContextMenu(null)}>
      {/* THREE-DOT CONTEXT MENU POPUP (Feature #1) */}
      {contextMenu && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 bg-white rounded-xl border border-slate-200 shadow-2xl p-1.5 min-w-[170px] text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
            {contextMenu.nodeType}: {contextMenu.nodeName}
          </div>

          {contextMenu.nodeType === "Warehouse" && (
            <>
              <button type="button" onClick={() => handleContextMenuAction("Edit Warehouse")} className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-semibold flex items-center gap-2"><Pencil className="h-3.5 w-3.5 text-slate-500" /> Edit Warehouse</button>
              <button type="button" onClick={() => handleContextMenuAction("Duplicate Warehouse")} className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-semibold flex items-center gap-2"><Copy className="h-3.5 w-3.5 text-blue-600" /> Duplicate</button>
              <button type="button" onClick={() => handleContextMenuAction("Archive Warehouse")} className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-semibold flex items-center gap-2"><Archive className="h-3.5 w-3.5 text-amber-600" /> Archive</button>
              <button type="button" onClick={() => handleContextMenuAction("Export Warehouse")} className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-semibold flex items-center gap-2"><Download className="h-3.5 w-3.5 text-emerald-600" /> Export Layout</button>
              <div className="border-t border-slate-100 my-0.5" />
              <button type="button" onClick={() => handleContextMenuAction("Delete Warehouse")} className="w-full text-left px-2.5 py-1.5 hover:bg-red-50 text-red-600 rounded font-semibold flex items-center gap-2"><Trash2 className="h-3.5 w-3.5 text-red-600" /> Delete</button>
            </>
          )}

          {contextMenu.nodeType === "Zone" && (
            <>
              <button type="button" onClick={() => handleContextMenuAction("Edit Zone")} className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-semibold flex items-center gap-2"><Pencil className="h-3.5 w-3.5 text-slate-500" /> Edit Zone</button>
              <button type="button" onClick={() => handleContextMenuAction("Rename Zone")} className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-semibold flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-slate-500" /> Rename</button>
              <button type="button" onClick={() => setDragMoveConfirmation({ itemType: "Zone", itemName: contextMenu.nodeName, sourceName: "Zone A", targetName: "Zone B" })} className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-semibold flex items-center gap-2"><Move className="h-3.5 w-3.5 text-blue-600" /> Move Zone</button>
              <button type="button" onClick={() => { setStructureModalType("Rack"); setBinModalOpen(true); setContextMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-emerald-50 text-emerald-800 rounded font-semibold flex items-center gap-2"><Plus className="h-3.5 w-3.5 text-emerald-600" /> Add Rack</button>
              <div className="border-t border-slate-100 my-0.5" />
              <button type="button" onClick={() => handleContextMenuAction("Delete Zone")} className="w-full text-left px-2.5 py-1.5 hover:bg-red-50 text-red-600 rounded font-semibold flex items-center gap-2"><Trash2 className="h-3.5 w-3.5 text-red-600" /> Delete Zone</button>
            </>
          )}

          {contextMenu.nodeType === "Rack" && (
            <>
              <button type="button" onClick={() => handleContextMenuAction("Edit Rack")} className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-semibold flex items-center gap-2"><Pencil className="h-3.5 w-3.5 text-slate-500" /> Edit Rack</button>
              <button type="button" onClick={() => setDragMoveConfirmation({ itemType: "Rack", itemName: contextMenu.nodeName, sourceName: "Rack A", targetName: "Rack B" })} className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-semibold flex items-center gap-2"><Move className="h-3.5 w-3.5 text-blue-600" /> Move Rack</button>
              <button type="button" onClick={() => { setStructureModalType("Shelf"); setBinModalOpen(true); setContextMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-emerald-50 text-emerald-800 rounded font-semibold flex items-center gap-2"><Plus className="h-3.5 w-3.5 text-emerald-600" /> Add Shelf</button>
              <div className="border-t border-slate-100 my-0.5" />
              <button type="button" onClick={() => handleContextMenuAction("Delete Rack")} className="w-full text-left px-2.5 py-1.5 hover:bg-red-50 text-red-600 rounded font-semibold flex items-center gap-2"><Trash2 className="h-3.5 w-3.5 text-red-600" /> Delete Rack</button>
            </>
          )}

          {contextMenu.nodeType === "Shelf" && (
            <>
              <button type="button" onClick={() => handleContextMenuAction("Edit Shelf")} className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-semibold flex items-center gap-2"><Pencil className="h-3.5 w-3.5 text-slate-500" /> Edit Shelf</button>
              <button type="button" onClick={() => setDragMoveConfirmation({ itemType: "Shelf", itemName: contextMenu.nodeName, sourceName: "Shelf A", targetName: "Shelf B" })} className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-semibold flex items-center gap-2"><Move className="h-3.5 w-3.5 text-blue-600" /> Move Shelf</button>
              <button type="button" onClick={() => { setStructureModalType("Bin"); setBinModalOpen(true); setContextMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-emerald-50 text-emerald-800 rounded font-semibold flex items-center gap-2"><Plus className="h-3.5 w-3.5 text-emerald-600" /> Add Bin</button>
              <div className="border-t border-slate-100 my-0.5" />
              <button type="button" onClick={() => handleContextMenuAction("Delete Shelf")} className="w-full text-left px-2.5 py-1.5 hover:bg-red-50 text-red-600 rounded font-semibold flex items-center gap-2"><Trash2 className="h-3.5 w-3.5 text-red-600" /> Delete Shelf</button>
            </>
          )}

          {contextMenu.nodeType === "Bin" && (
            <>
              <button type="button" onClick={() => handleContextMenuAction("Edit Bin")} className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-semibold flex items-center gap-2"><Pencil className="h-3.5 w-3.5 text-slate-500" /> Edit Bin</button>
              <button type="button" onClick={() => setDragMoveConfirmation({ itemType: "Bin", itemName: contextMenu.nodeName, sourceName: "Shelf 01", targetName: "Shelf 02" })} className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-semibold flex items-center gap-2"><Move className="h-3.5 w-3.5 text-blue-600" /> Move Bin</button>
              <button type="button" onClick={() => { setActiveTab("inventory"); setContextMenu(null); }} className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-semibold flex items-center gap-2"><Boxes className="h-3.5 w-3.5 text-emerald-600" /> View Inventory</button>
              <button type="button" onClick={() => handleContextMenuAction("Print Bin Label")} className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 rounded text-slate-700 font-semibold flex items-center gap-2"><Printer className="h-3.5 w-3.5 text-purple-600" /> Print Label & QR</button>
              <div className="border-t border-slate-100 my-0.5" />
              <button type="button" onClick={() => handleContextMenuAction("Delete Bin")} className="w-full text-left px-2.5 py-1.5 hover:bg-red-50 text-red-600 rounded font-semibold flex items-center gap-2"><Trash2 className="h-3.5 w-3.5 text-red-600" /> Delete Bin</button>
            </>
          )}
        </div>
      )}

      {/* DRAG & DROP CONFIRMATION MODAL (Feature #2) */}
      {dragMoveConfirmation && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                <Move className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Confirm Relocation</h3>
                <p className="text-xs text-slate-500 font-medium">Re-mapping storage hierarchy structure</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <p>Relocating <strong>{dragMoveConfirmation.itemType} "{dragMoveConfirmation.itemName}"</strong></p>
              <p className="text-slate-500">Source: <span className="font-mono text-slate-700">{dragMoveConfirmation.sourceName}</span> $\rightarrow$ Target: <span className="font-mono text-emerald-800 font-bold">{dragMoveConfirmation.targetName}</span></p>
              <p className="text-[11px] text-amber-700 font-semibold bg-amber-50 p-2 rounded border border-amber-200">
                ✓ Inventory mappings for all stored products will update automatically.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDragMoveConfirmation(null)} className="h-9 px-4 text-xs font-semibold">
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setDragMoveConfirmation(null);
                  alert(`Successfully relocated ${dragMoveConfirmation.itemType} to ${dragMoveConfirmation.targetName}. Inventory mapping updated.`);
                }}
                className="h-9 px-4 text-xs font-bold !bg-emerald-700 text-white rounded-xl"
              >
                Save & Update Inventory Mapping
              </Button>
            </div>
          </div>
        </div>
      )}

      <FOPageHeader
        eyebrow="Inventory"
        title="Warehouses"
        description="Configure stores, zones, racks, shelves, and bins in one place."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("split")}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition",
                  viewMode === "split" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-800",
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Layout
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition",
                  viewMode === "table" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-800",
                )}
              >
                <List className="h-3.5 w-3.5" />
                Table
              </button>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setAlertsOpen(true)}
              className="relative"
              title="Alerts"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                3
              </span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => alert("Exporting warehouse layout…")}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export
            </Button>
            <Button
              type="button"
              size="sm"
              className="!bg-emerald-700 hover:!bg-emerald-800"
              onClick={() => {
                setWizardStep(1);
                setWizardOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New warehouse
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatMiniCard
          label="Warehouses"
          value={warehouseList.length}
          icon={Building2}
          accent="#0f8a5f"
          sublabel={`${warehouseList.filter((w) => w.status === "Active").length} active`}
        />
        <StatMiniCard
          label="Locations"
          value={warehouseList.reduce((acc, w) => acc + w.storageLocationsCount, 0)}
          icon={Layers}
          accent="#2563eb"
          sublabel="Zones & racks"
        />
        <StatMiniCard
          label="Bins"
          value={warehouseList.reduce((acc, w) => acc + w.totalBinsCount, 0)}
          icon={Boxes}
          accent="#8b5cf6"
          sublabel={`${warehouseList.reduce((acc, w) => acc + w.occupiedBinsCount, 0)} occupied`}
        />
        <StatMiniCard
          label="Capacity free"
          value="78%"
          icon={ShieldCheck}
          accent="#047857"
          sublabel="Average across stores"
        />
      </div>

      <div>
        <FOSearchToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search warehouse name, code, manager…"
          filterPills={{
            active: statusFilter,
            onChange: setStatusFilter,
            options: [
              { id: "all", label: "All" },
              { id: "Active", label: "Active" },
              { id: "Inactive", label: "Inactive" },
              { id: "Maintenance", label: "Maintenance" },
            ],
          }}
          hasActiveAdvancedFilters={typeFilter !== "all" || departmentFilter !== "all"}
          onClearAdvancedFilters={() => {
            setTypeFilter("all");
            setDepartmentFilter("all");
          }}
          advancedFilters={
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Warehouse type">
                <SelectInput
                  value={typeFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All warehouse types</option>
                  <option value="Main Warehouse">Main Warehouse</option>
                  <option value="Sub Warehouse">Sub Warehouse</option>
                  <option value="Kitchen Store">Kitchen Store</option>
                  <option value="Bar Store">Bar Store</option>
                  <option value="Housekeeping Store">Housekeeping Store</option>
                  <option value="Engineering Store">Engineering Store</option>
                  <option value="Cold Storage">Cold Storage</option>
                  <option value="Freezer">Freezer Room</option>
                </SelectInput>
              </FormField>
              <FormField label="Department">
                <SelectInput
                  value={departmentFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDepartmentFilter(e.target.value)}
                >
                  <option value="all">All departments</option>
                  <option value="Purchase">Purchase & Stores</option>
                  <option value="Food & Beverage">Food & Beverage</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Engineering">Engineering</option>
                </SelectInput>
              </FormField>
            </div>
          }
        />
      </div>

      {/* Active path */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs">
        <span className="text-[11px] font-medium text-slate-400">Location</span>
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 font-semibold text-slate-800">
          <Building2 className="h-3.5 w-3.5 text-emerald-600" />
          {selectedWarehouse.name}
        </span>
        {selectedZoneId && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="rounded-md bg-slate-50 px-2 py-1 font-medium text-slate-700">
              {selectedWarehouse.zones.find((z) => z.id === selectedZoneId)?.zoneName ?? "Zone"}
            </span>
          </>
        )}
        {selectedBinId && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 ring-1 ring-emerald-200">
              {selectedWarehouse.zones.flatMap((z) => z.bins).find((b) => b.id === selectedBinId)?.binCode ?? "Bin"}
            </span>
          </>
        )}
      </div>

      {viewMode === "split" ? (
        <div className="grid items-start gap-3 lg:grid-cols-12">
          {/* Left: hierarchy */}
          <div className="flex max-h-[720px] flex-col rounded-xl border border-slate-200 bg-white lg:col-span-4">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold text-slate-900">Stores</p>
                <p className="text-[11px] text-slate-500">{filteredWarehouses.length} facilities</p>
              </div>
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto p-2">
              {filteredWarehouses.map((wh) => {
                const isWhExpanded = expandedNodes[wh.id];
                const isWhSelected = selectedWarehouseId === wh.id && !selectedZoneId && !selectedBinId;

                return (
                  <div key={wh.id} className="space-y-0.5">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedWarehouseId(wh.id);
                        setSelectedZoneId(null);
                        setSelectedBinId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setSelectedWarehouseId(wh.id);
                          setSelectedZoneId(null);
                          setSelectedBinId(null);
                        }
                      }}
                      className={cn(
                        "group flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm transition",
                        isWhSelected
                          ? "bg-emerald-700 text-white"
                          : "text-slate-800 hover:bg-slate-50",
                      )}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNode(wh.id);
                        }}
                        className={cn(
                          "rounded p-0.5",
                          isWhSelected ? "hover:bg-emerald-600" : "text-slate-400 hover:bg-slate-200",
                        )}
                      >
                        {isWhExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </button>
                      <Building2 className={cn("h-4 w-4 shrink-0", isWhSelected ? "text-white" : "text-emerald-600")} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{wh.name}</p>
                        <p className={cn("truncate text-[11px]", isWhSelected ? "text-emerald-100" : "text-slate-500")}>
                          {wh.code} · {wh.zones.length} zones
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setContextMenu({
                            x: rect.left - 120,
                            y: rect.bottom + 4,
                            nodeId: wh.id,
                            nodeType: "Warehouse",
                            nodeName: wh.name,
                          });
                        }}
                        className={cn(
                          "rounded p-1 opacity-0 transition group-hover:opacity-100",
                          isWhSelected ? "hover:bg-emerald-600" : "text-slate-400 hover:bg-slate-200",
                        )}
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {isWhExpanded && (
                      <div className="ml-3 space-y-0.5 border-l border-slate-200 pl-2">
                        {wh.zones.map((zone) => {
                          const isZoneExpanded = expandedNodes[zone.id];
                          const isZoneSelected =
                            selectedWarehouseId === wh.id && selectedZoneId === zone.id && !selectedBinId;

                          return (
                            <div key={zone.id} className="space-y-0.5">
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={() => {
                                  setSelectedWarehouseId(wh.id);
                                  setSelectedZoneId(zone.id);
                                  setSelectedBinId(null);
                                }}
                                className={cn(
                                  "group flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs transition",
                                  isZoneSelected
                                    ? "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200"
                                    : "text-slate-700 hover:bg-slate-50",
                                )}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleNode(zone.id);
                                  }}
                                  className="rounded p-0.5 text-slate-400 hover:bg-slate-200"
                                >
                                  {isZoneExpanded ? (
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  ) : (
                                    <ChevronRight className="h-3.5 w-3.5" />
                                  )}
                                </button>
                                <Layers className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-semibold">{zone.zoneName}</p>
                                  <p className="truncate text-[10px] text-slate-500">{zone.bins.length} bins</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setContextMenu({
                                      x: rect.left - 120,
                                      y: rect.bottom + 4,
                                      nodeId: zone.id,
                                      nodeType: "Zone",
                                      nodeName: zone.zoneName,
                                    });
                                  }}
                                  className="rounded p-1 text-slate-400 opacity-0 hover:bg-slate-200 group-hover:opacity-100"
                                >
                                  <MoreVertical className="h-3 w-3" />
                                </button>
                              </div>

                              {isZoneExpanded && (
                                <div className="ml-3 space-y-0.5 border-l border-slate-100 pl-2">
                                  {zone.bins.map((bin) => {
                                    const isBinSelected = selectedBinId === bin.id;
                                    return (
                                      <button
                                        key={bin.id}
                                        type="button"
                                        onClick={() => {
                                          setSelectedWarehouseId(wh.id);
                                          setSelectedZoneId(zone.id);
                                          setSelectedBinId(bin.id);
                                          setActiveBinDrawer(bin);
                                        }}
                                        className={cn(
                                          "group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] transition",
                                          isBinSelected
                                            ? "bg-emerald-700 text-white"
                                            : "text-slate-600 hover:bg-slate-50",
                                        )}
                                      >
                                        <Box className="h-3 w-3 shrink-0" />
                                        <span className="min-w-0 flex-1 truncate font-semibold">{bin.binCode}</span>
                                        <span
                                          className={cn(
                                            "max-w-[40%] truncate",
                                            isBinSelected ? "text-emerald-100" : "text-slate-400",
                                          )}
                                        >
                                          {bin.binName}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: details */}
          <div className="rounded-xl border border-slate-200 bg-white lg:col-span-8">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900">{selectedWarehouse.name}</h3>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
                    {selectedWarehouse.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {selectedWarehouse.code} · {selectedWarehouse.type} · {selectedWarehouse.department}
                </p>
              </div>
            </div>

            <div className="flex gap-1 overflow-x-auto border-b border-slate-200 px-2 scrollbar-none">
              {(
                [
                  { id: "general", label: "General" },
                  { id: "structure", label: `Structure (${selectedWarehouse.zones.length})` },
                  { id: "capacity", label: "Capacity" },
                  { id: "inventory", label: `Inventory (${selectedWarehouse.inventory.length})` },
                  { id: "users", label: `Users (${selectedWarehouse.users.length})` },
                  { id: "settings", label: "Settings" },
                  { id: "audit", label: "Activity" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "shrink-0 border-b-2 px-3 py-2.5 text-xs font-semibold transition",
                    activeTab === tab.id
                      ? "border-emerald-600 text-emerald-800"
                      : "border-transparent text-slate-500 hover:text-slate-800",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "general" && (
              <div className="space-y-3 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: "Code", value: selectedWarehouse.code },
                    { label: "Type", value: selectedWarehouse.type },
                    { label: "Department", value: selectedWarehouse.department },
                    { label: "Manager", value: selectedWarehouse.contactPerson },
                    { label: "Phone", value: selectedWarehouse.phone },
                    { label: "Email", value: selectedWarehouse.email },
                    { label: "Address", value: selectedWarehouse.address },
                    { label: "Updated", value: selectedWarehouse.lastUpdated },
                  ].map((field) => (
                    <div key={field.label} className="rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2.5">
                      <p className="text-[11px] font-medium text-slate-400">{field.label}</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-900">{field.value}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-slate-200 px-3 py-3">
                  <p className="text-[11px] font-medium text-slate-400">Description</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">{selectedWarehouse.description}</p>
                </div>
              </div>
            )}

            {activeTab === "structure" && (
              <div className="space-y-4 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Storage structure</h4>
                    <p className="text-[11px] text-slate-500">Zones and bins in this warehouse</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button type="button" size="sm" variant="outline" onClick={() => { setStructureModalType("Zone"); setBinModalOpen(true); }}>
                      <Plus className="mr-1 h-3.5 w-3.5" /> Zone
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => { setStructureModalType("Rack"); setBinModalOpen(true); }}>
                      <Plus className="mr-1 h-3.5 w-3.5" /> Rack
                    </Button>
                    <Button type="button" size="sm" className="!bg-emerald-700 hover:!bg-emerald-800" onClick={() => { setStructureModalType("Bin"); setBinModalOpen(true); }}>
                      <Plus className="mr-1 h-3.5 w-3.5" /> Bin
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <TextInput
                    value={structureSearch}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStructureSearch(e.target.value)}
                    placeholder="Search zone or bin…"
                    className="h-10 w-full rounded-lg pl-9 text-sm"
                  />
                </div>

                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <Building2 className="h-4 w-4 text-emerald-600" />
                      {selectedWarehouse.name}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">{selectedWarehouse.code}</span>
                  </div>

                  <div className="ml-2 space-y-3 border-l border-slate-200 pl-3">
                    {selectedWarehouse.zones.map((zone) => (
                      <div key={zone.id} className="space-y-2">
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                          <span className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                            <Layers className="h-3.5 w-3.5 text-emerald-600" />
                            {zone.zoneName}
                          </span>
                          <span className="text-[11px] text-slate-500">{zone.bins.length} bins</span>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                          {zone.bins
                            .filter(
                              (b) =>
                                !structureSearch ||
                                b.binCode.toLowerCase().includes(structureSearch.toLowerCase()) ||
                                b.binName.toLowerCase().includes(structureSearch.toLowerCase()),
                            )
                            .map((bin) => (
                              <button
                                key={bin.id}
                                type="button"
                                onClick={() => setActiveBinDrawer(bin)}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-emerald-300 hover:bg-emerald-50/40"
                              >
                                <p className="font-mono text-xs font-semibold text-emerald-800">{bin.binCode}</p>
                                <p className="mt-0.5 truncate text-[11px] text-slate-500">{bin.binName}</p>
                                <p className="mt-1 text-[11px] text-slate-600">
                                  {bin.currentUtilizationQty}/{bin.capacityQty} used
                                </p>
                              </button>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: ENHANCED CAPACITY VISUALIZATION */}
            {activeTab === "capacity" && (
              <div className="space-y-4 p-4 text-sm">
                <h4 className="text-sm font-semibold text-slate-900">Capacity</h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-[10px] text-slate-400 block font-medium">Total Bins</span>
                    <span className="text-base font-black text-slate-900">{selectedWarehouse.totalBinsCount} Bins</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50">
                    <span className="text-[10px] text-emerald-700 block font-medium">Occupied Bins</span>
                    <span className="text-base font-black text-emerald-950">{selectedWarehouse.occupiedBinsCount} Bins</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50">
                    <span className="text-[10px] text-blue-700 block font-medium">Empty Bins</span>
                    <span className="text-base font-black text-blue-950">{selectedWarehouse.emptyBinsCount} Bins</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50">
                    <span className="text-[10px] text-purple-700 block font-medium">Reserved Bins</span>
                    <span className="text-base font-black text-purple-950">{selectedWarehouse.reservedBinsCount} Bins</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                    <span className="text-slate-700 font-bold block">Volume Utilization Progress</span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-black text-slate-900">{selectedWarehouse.usedVolumeCapacityCuM} m³</span>
                      <span className="text-xs text-slate-500">of {selectedWarehouse.totalVolumeCapacityCuM} m³ total</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full"
                        style={{
                          width: `${Math.round((selectedWarehouse.usedVolumeCapacityCuM / selectedWarehouse.totalVolumeCapacityCuM) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                    <span className="text-slate-700 font-bold block">Weight Load Limit Progress</span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-black text-slate-900">{selectedWarehouse.usedWeightCapacityKg} kg</span>
                      <span className="text-xs text-slate-500">of {selectedWarehouse.totalWeightCapacityKg} kg total</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{
                          width: `${Math.round((selectedWarehouse.usedWeightCapacityKg / selectedWarehouse.totalWeightCapacityKg) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: STORED INVENTORY */}
            {activeTab === "inventory" && (
              <div className="space-y-3 p-4 text-sm">
                <h4 className="text-sm font-semibold text-slate-900">Stored inventory</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                        <th className="py-2 px-2">Item Code</th>
                        <th className="py-2 px-2">Item Name</th>
                        <th className="py-2 px-2">Category</th>
                        <th className="py-2 px-2">Batch No</th>
                        <th className="py-2 px-2 text-center">Total Qty</th>
                        <th className="py-2 px-2 text-center">Available Qty</th>
                        <th className="py-2 px-2">Location Bin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {selectedWarehouse.inventory.map((inv) => (
                        <tr key={inv.id}>
                          <td className="py-2.5 px-2 font-mono font-bold text-slate-900">{inv.itemCode}</td>
                          <td className="py-2.5 px-2 font-bold text-slate-900">{inv.itemName}</td>
                          <td className="py-2.5 px-2 text-slate-600">{inv.category}</td>
                          <td className="py-2.5 px-2 font-mono text-slate-600">{inv.batchNumber}</td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-800">{inv.quantity} {inv.unit}</td>
                          <td className="py-2.5 px-2 text-center font-extrabold text-emerald-700">{inv.availableQuantity} {inv.unit}</td>
                          <td className="py-2.5 px-2 font-mono text-emerald-800 font-semibold">{inv.binLocation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT 5: ASSIGNED USERS */}
            {activeTab === "users" && (
              <div className="space-y-3 p-4 text-sm">
                <h4 className="text-sm font-semibold text-slate-900">Assigned users</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedWarehouse.users.map((usr) => (
                    <div key={usr.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 block">{usr.name}</span>
                        <span className="text-[10px] text-emerald-700 font-bold block">{usr.role}</span>
                        <span className="text-[10px] text-slate-500">{usr.email} • {usr.phone}</span>
                      </div>
                      <Users className="h-5 w-5 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT 6: WAREHOUSE SETTINGS */}
            {activeTab === "settings" && (
              <div className="space-y-4 p-4 text-sm">
                <h4 className="text-sm font-semibold text-slate-900">Settings</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Warehouse Name" required>
                    <TextInput value={selectedWarehouse.name} readOnly className="h-9 text-xs font-bold bg-slate-50" />
                  </FormField>

                  <FormField label="Warehouse Code" required>
                    <TextInput value={selectedWarehouse.code} readOnly className="h-9 text-xs font-mono font-bold bg-slate-50" />
                  </FormField>

                  <FormField label="Default Receiving Area">
                    <TextInput defaultValue={whSettings.defaultReceivingArea} className="h-9 text-xs" />
                  </FormField>

                  <FormField label="Default Dispatch Area">
                    <TextInput defaultValue={whSettings.defaultDispatchArea} className="h-9 text-xs" />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">Allow Negative Stock</span>
                      <span className="text-[10px] text-slate-500">Permit stock issues below 0 balance</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={whSettings.allowNegativeStock}
                      onChange={(e) => setWhSettings({ ...whSettings, allowNegativeStock: e.target.checked })}
                      className="h-4 w-4 text-emerald-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">Enable FEFO Expiry Routing</span>
                      <span className="text-[10px] text-slate-500">First Expire First Out auto-routing</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={whSettings.enableFEFO}
                      onChange={(e) => setWhSettings({ ...whSettings, enableFEFO: e.target.checked })}
                      className="h-4 w-4 text-emerald-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">Require Approval</span>
                      <span className="text-[10px] text-slate-500">Mandatory supervisor approval on stock issue</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={whSettings.requireApproval}
                      onChange={(e) => setWhSettings({ ...whSettings, requireApproval: e.target.checked })}
                      className="h-4 w-4 text-emerald-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">Barcode & QR Enabled</span>
                      <span className="text-[10px] text-slate-500">Enforce barcode scan during bin putaway</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={whSettings.barcodeRequired}
                      onChange={(e) => setWhSettings({ ...whSettings, barcodeRequired: e.target.checked })}
                      className="h-4 w-4 text-emerald-600 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => alert("Warehouse Settings Saved Successfully!")}
                  className="h-9 px-4 text-xs font-bold !bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  Save Warehouse Settings
                </Button>
              </div>
            )}

            {/* TAB CONTENT 7: AUDIT & RECENT ACTIVITY (Feature #7) */}
            {activeTab === "audit" && (
              <div className="space-y-5 text-xs">
                {/* RECENT STOCK MOVEMENTS TABLE */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-slate-900">Recent Stock Movements</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                          <th className="py-2 px-2">Date</th>
                          <th className="py-2 px-2">Tx No</th>
                          <th className="py-2 px-2">Type</th>
                          <th className="py-2 px-2">Item</th>
                          <th className="py-2 px-2 text-center">Qty</th>
                          <th className="py-2 px-2">Source $\rightarrow$ Destination</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {selectedWarehouse.recentTransactions.map((tx) => (
                          <tr key={tx.id}>
                            <td className="py-2 px-2 text-slate-600">{tx.date}</td>
                            <td className="py-2 px-2 font-mono font-bold text-slate-900">{tx.transactionNo}</td>
                            <td className="py-2 px-2">
                              <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {tx.transactionType}
                              </span>
                            </td>
                            <td className="py-2 px-2 font-bold text-slate-900">{tx.item}</td>
                            <td className="py-2 px-2 text-center font-extrabold text-slate-800">{tx.quantity}</td>
                            <td className="py-2 px-2 text-slate-600 text-[11px]">
                              {tx.source} $\rightarrow$ {tx.destination}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* RECENT WAREHOUSE ACTIVITY TIMELINE */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-slate-900">Warehouse Configuration & Activity Log</h4>
                  <div className="space-y-2">
                    {selectedWarehouse.auditLogs.map((log, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800 block">{log.action}</span>
                          <span className="text-[10px] text-slate-500">Performed by {log.performedBy}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{log.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* MASTER WAREHOUSE TABLE VIEW */
        <>
          <ModuleSelectionBar
            count={selectedIds.size}
            noun="warehouse"
            onClear={() => setSelectedIds(new Set())}
            actions={[
              {
                label: "View",
                onClick: () => {
                  const first = filteredWarehouses.find((w) => selectedIds.has(w.id));
                  if (first) {
                    setSelectedWarehouseId(first.id);
                    setViewMode("split");
                  }
                },
              },
              {
                label: "Print labels",
                icon: <Printer className="h-3.5 w-3.5" />,
                onClick: () => {
                  const first = filteredWarehouses.find((w) => selectedIds.has(w.id));
                  if (first) alert(`Printing Barcode / QR Labels for ${first.code}`);
                },
              },
            ]}
          />
          <ModuleDataTable
            columns={columns}
            rows={filteredWarehouses}
            emptyMessage="No warehouses found."
            onRowClick={(r) => {
              setSelectedWarehouseId((r as WarehouseRecord).id);
              setViewMode("split");
            }}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        </>
      )}

      {/* BIN DETAILS DRAWER (Feature #3) */}
      {activeBinDrawer && (
        <Drawer
          open={!!activeBinDrawer}
          onClose={() => setActiveBinDrawer(null)}
          title={`Bin Details: ${activeBinDrawer.binCode}`}
          width="lg"
        >
          <div className="space-y-5 py-2 select-none text-xs">
            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-extrabold text-emerald-900">{activeBinDrawer.binCode}</span>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-emerald-600 text-white">
                  {activeBinDrawer.status}
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">{activeBinDrawer.binName}</h3>
              <p className="text-xs text-slate-500 font-medium">
                Warehouse: {selectedWarehouse.name} • Zone: {activeBinDrawer.zoneName} • {activeBinDrawer.rackName} • {activeBinDrawer.shelfName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Maximum Capacity</span>
                <span className="font-bold text-slate-900">{activeBinDrawer.capacityQty} Units</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Current Stock</span>
                <span className="font-extrabold text-emerald-700">{activeBinDrawer.currentUtilizationQty} Units</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Available Space</span>
                <span className="font-extrabold text-blue-700">{activeBinDrawer.capacityQty - activeBinDrawer.currentUtilizationQty} Units</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Utilization %</span>
                <span className="font-bold text-slate-900">{Math.round((activeBinDrawer.currentUtilizationQty / activeBinDrawer.capacityQty) * 100)}%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Max Weight Limit</span>
                <span className="font-bold text-slate-900">{activeBinDrawer.maxWeightKg} kg</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Barcode Identifier</span>
                <span className="font-mono text-slate-800">{activeBinDrawer.barcode}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">QR Code Identifier</span>
                <span className="font-mono text-slate-800">{activeBinDrawer.qrCode}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Temperature</span>
                <span className="font-semibold text-slate-800">{activeBinDrawer.temperatureControlled ? activeBinDrawer.targetTemp || "+4°C" : "Ambient"}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                onClick={() => alert(`Printing Bin Label for ${activeBinDrawer.binCode}`)}
                className="h-9 px-4 text-xs font-bold !bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="h-4 w-4" /> Print Label & QR
              </Button>
            </div>
          </div>
        </Drawer>
      )}

      {/* CREATE / EDIT WAREHOUSE MULTI-STEP WIZARD MODAL */}
      <Drawer
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        title="Create Warehouse Facility (Multi-Step Wizard)"
        width="responsive"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              type="button"
              variant="outline"
              disabled={wizardStep === 1}
              onClick={() => setWizardStep((prev) => Math.max(1, prev - 1))}
              className="h-9 px-4 text-xs font-semibold border-slate-300 rounded-xl cursor-pointer disabled:opacity-30"
            >
              Previous
            </Button>
            <div className="flex items-center gap-2">
              {wizardStep < 5 ? (
                <Button
                  type="button"
                  onClick={() => setWizardStep((prev) => Math.min(5, prev + 1))}
                  className="h-9 px-5 text-xs font-bold !bg-emerald-700 text-white rounded-xl cursor-pointer"
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSaveWarehouse}
                  className="h-9 px-5 text-xs font-bold !bg-[#0F8A5F] text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" /> Finish & Create
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-6 py-2">
          {/* STEP INDICATOR HEADER */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            {[1, 2, 3, 4, 5].map((st) => (
              <div key={st} className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold",
                    st === wizardStep
                      ? "bg-emerald-600 text-white shadow-xs"
                      : st < wizardStep
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-400"
                  )}
                >
                  {st}
                </span>
                <span className={cn("text-xs font-bold hidden sm:inline", st === wizardStep ? "text-slate-900" : "text-slate-400")}>
                  {st === 1 && "Basic Info"}
                  {st === 2 && "Settings"}
                  {st === 3 && "Storage Layout"}
                  {st === 4 && "Capacity"}
                  {st === 5 && "Review"}
                </span>
              </div>
            ))}
          </div>

          {/* STEP 1: BASIC INFO */}
          {wizardStep === 1 && (
            <PurchaseFormCard title="Step 1: Facility Basic Information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Warehouse Code" required>
                  <TextInput
                    value={newWhCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewWhCode(e.target.value)}
                    placeholder="e.g. WH-STORE-04"
                    className="h-9 text-xs font-mono font-bold"
                  />
                </FormField>

                <FormField label="Warehouse Name" required>
                  <TextInput
                    value={newWhName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewWhName(e.target.value)}
                    placeholder="e.g. Pastry & Bakery Cold Store"
                    className="h-9 text-xs font-bold"
                  />
                </FormField>

                <FormField label="Warehouse Type" required>
                  <SelectInput
                    value={newWhType}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewWhType(e.target.value as any)}
                    className="h-9 text-xs font-medium"
                  >
                    <option value="Main Warehouse">Main Warehouse</option>
                    <option value="Sub Warehouse">Sub Warehouse</option>
                    <option value="Kitchen Store">Kitchen Store</option>
                    <option value="Bar Store">Bar Store</option>
                    <option value="Housekeeping Store">Housekeeping Store</option>
                    <option value="Engineering Store">Engineering Store</option>
                    <option value="Cold Storage">Cold Storage</option>
                    <option value="Freezer">Freezer Room</option>
                  </SelectInput>
                </FormField>

                <FormField label="Department" required>
                  <SelectInput
                    value={newWhDept}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewWhDept(e.target.value)}
                    className="h-9 text-xs font-medium"
                  >
                    <option value="Food & Beverage">Food & Beverage Production</option>
                    <option value="Purchase & Stores">Purchase & Stores</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Engineering">Engineering</option>
                  </SelectInput>
                </FormField>
              </div>
            </PurchaseFormCard>
          )}

          {/* STEP 2: SETTINGS & MANAGER */}
          {wizardStep === 2 && (
            <PurchaseFormCard title="Step 2: Facility Manager & Contact Details">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Warehouse Manager" required>
                  <TextInput
                    value={newWhManager}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewWhManager(e.target.value)}
                    placeholder="e.g. Chef Marco / Store In-charge"
                    className="h-9 text-xs font-bold"
                  />
                </FormField>

                <FormField label="Contact Phone">
                  <TextInput
                    value={newWhPhone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewWhPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="h-9 text-xs"
                  />
                </FormField>

                <FormField label="Email Address">
                  <TextInput
                    value={newWhEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewWhEmail(e.target.value)}
                    placeholder="store.kitchen@hotel.com"
                    className="h-9 text-xs"
                  />
                </FormField>

                <FormField label="Facility Location / Address">
                  <TextInput
                    value={newWhAddress}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewWhAddress(e.target.value)}
                    placeholder="Level 1, Production Wing"
                    className="h-9 text-xs"
                  />
                </FormField>
              </div>
            </PurchaseFormCard>
          )}

          {/* STEP 3: STORAGE LAYOUT STRUCTURE */}
          {wizardStep === 3 && (
            <PurchaseFormCard title="Step 3: Storage Zones & Rack Configuration">
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-semibold">
                  ✓ Default Zone "Primary Zone 01" will be created with 2 Racks and 10 Bins.
                </div>
              </div>
            </PurchaseFormCard>
          )}

          {/* STEP 4: CAPACITY */}
          {wizardStep === 4 && (
            <PurchaseFormCard title="Step 4: Storage Volume & Weight Capacity Limits">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <FormField label="Volume Capacity (m³)">
                  <TextInput type="number" defaultValue="200" className="h-9 text-xs font-bold" />
                </FormField>
                <FormField label="Max Weight Limit (kg)">
                  <TextInput type="number" defaultValue="5000" className="h-9 text-xs font-bold" />
                </FormField>
              </div>
            </PurchaseFormCard>
          )}

          {/* STEP 5: REVIEW */}
          {wizardStep === 5 && (
            <PurchaseFormCard title="Step 5: Final Review & Confirmation">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <p><strong>Code:</strong> {newWhCode || "Auto-generated"}</p>
                <p><strong>Name:</strong> {newWhName || "New Storage Facility"}</p>
                <p><strong>Type:</strong> {newWhType}</p>
                <p><strong>Department:</strong> {newWhDept}</p>
                <p><strong>Manager:</strong> {newWhManager || "Assigned Manager"}</p>
              </div>
            </PurchaseFormCard>
          )}
        </div>
      </Drawer>

      <Drawer
        open={alertsOpen}
        onClose={() => setAlertsOpen(false)}
        title="Warehouse alerts"
        description="Capacity, temperature, and putaway signals"
        width="md"
        footer={
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => setAlertsOpen(false)}>
              Close
            </Button>
          </div>
        }
      >
        <div className="space-y-2.5 p-1">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-950">Capacity warning</p>
                <p className="mt-0.5 text-xs text-amber-800/80">Grocery Zone Rack A is 92% full</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-emerald-950">Cold storage OK</p>
                <p className="mt-0.5 text-xs text-emerald-800/80">Dairy cold bin at +3.5°C</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
            <div className="flex items-start gap-2.5">
              <Boxes className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Putaway space</p>
                <p className="mt-0.5 text-xs text-slate-600">20 empty bins ready</p>
              </div>
            </div>
          </div>
        </div>
      </Drawer>

      {/* ADD HIERARCHY NODE MODAL */}
      {binModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">Add Storage Node: {structureModalType}</h3>
            <FormField label={`${structureModalType} Code`}>
              <TextInput placeholder={`e.g. ${structureModalType.toUpperCase()}-01`} className="h-9 text-xs font-mono font-bold" />
            </FormField>
            <FormField label={`${structureModalType} Name`}>
              <TextInput placeholder={`e.g. Primary ${structureModalType} Location`} className="h-9 text-xs" />
            </FormField>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setBinModalOpen(false)} className="h-9 px-4 text-xs font-semibold">
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setBinModalOpen(false);
                  alert(`New ${structureModalType} Node Added to ${selectedWarehouse.code} Storage Hierarchy`);
                }}
                className="h-9 px-4 text-xs font-bold !bg-emerald-700 text-white rounded-xl"
              >
                Add {structureModalType}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
