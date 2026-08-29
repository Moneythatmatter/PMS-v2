"use client";

import { useEffect, useMemo, useState } from "react";
import {
  floorPlanService,
  liveTableService,
  menuCategoryService,
  menuItemService,
  type LiveTable,
  type PosEntryMode,
} from "@/services/food-beverages";
import { useFbOutlets } from "@/services/food-beverages/useFbOutlets";
import {
  FbOrderEntryPanel,
  type FbPosCategory,
  type FbPosMenuItem,
  type OrderTab,
} from "@/components/foodbeverages/FbOrderEntryPanel";
import { FbTableSelectPanel } from "@/components/foodbeverages/FbTableSelectPanel";
import { AlertBanner } from "@/components/frontoffice/ui";

type RawMenuItem = {
  id: string;
  name: string;
  itemCode?: string;
  categoryId?: string;
  itemType?: string;
  isVegetarian?: boolean;
  isActive?: boolean;
  status?: string;
  price?: number;
};

type RawCategory = {
  id: string;
  name: string;
  code?: string;
  isActive?: boolean;
  status?: string;
  displayOrder?: number;
};

type EntryStep = "tables" | "order";

function isActiveRecord(row: { isActive?: boolean; status?: string }) {
  return (
    row.isActive !== false &&
    String(row.status ?? "Active").toLowerCase() !== "inactive"
  );
}

export function FbOrdersView() {
  const { outlets, loading: outletsLoading } = useFbOutlets([
    "restaurant",
    "cafe",
    "bar",
  ]);
  const [filterOutletId, setFilterOutletId] = useState("");
  const [orderOutletId, setOrderOutletId] = useState("");
  const [entryStep, setEntryStep] = useState<EntryStep>("tables");
  const [selectedTable, setSelectedTable] = useState<LiveTable | null>(null);
  const [entryOrderType, setEntryOrderType] = useState<OrderTab>("Dine In");
  const [menuItems, setMenuItems] = useState<RawMenuItem[]>([]);
  const [categories, setCategories] = useState<FbPosCategory[]>([]);
  const [tables, setTables] = useState<LiveTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [openOrderId, setOpenOrderId] = useState("");
  const [openBillId, setOpenBillId] = useState("");
  const [entryMode, setEntryMode] = useState<PosEntryMode>("new");
  const reloadTables = async () => {
    try {
      const tableData = await floorPlanService.list();
      setTables(tableData);
    } catch {
      setTables([]);
    }
  };

  useEffect(() => {
    if (outletsLoading) return;
    if (outlets.length === 0) setLoading(false);
  }, [outletsLoading, outlets.length]);

  useEffect(() => {
    if (outletsLoading) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [menuData, categoryData, tableData] = await Promise.all([
          menuItemService.list().catch(() => []),
          menuCategoryService.list().catch(() => []),
          floorPlanService.list().catch(() => []),
        ]);
        if (cancelled) return;
        setMenuItems((menuData as RawMenuItem[]).filter(isActiveRecord));
        setCategories(
          (categoryData as RawCategory[])
            .filter(isActiveRecord)
            .sort(
              (a, b) =>
                Number(a.displayOrder ?? 0) - Number(b.displayOrder ?? 0),
            )
            .map((c) => ({ id: c.id, name: c.name, code: c.code })),
        );
        setTables(tableData);
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load orders");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [outletsLoading]);

  const posMenuItems = useMemo((): FbPosMenuItem[] => {
    return menuItems.map((item) => ({
      id: item.id,
      name: item.name,
      itemCode: item.itemCode,
      categoryId: item.categoryId,
      itemType: item.itemType,
      isVegetarian: item.isVegetarian,
      price: Number(item.price ?? 0) || 0,
    }));
  }, [menuItems]);

  const handleOrderCreated = async () => {
    await reloadTables();
    setSelectedTable(null);
    setOpenOrderId("");
    setOpenBillId("");
    setEntryMode("new");
    setEntryStep("tables");
    setEntryOrderType("Dine In");
    setOrderOutletId("");
    setToast("Done");
  };

  const openTableEntry = (table: LiveTable, mode: PosEntryMode) => {
    setSelectedTable(table);
    setOpenOrderId(table.openOrderId ?? "");
    setOpenBillId(table.openBillId ?? "");
    setEntryMode(mode);
    setEntryOrderType("Dine In");
    setOrderOutletId(table.outletId || "");
    setEntryStep("order");
  };

  const handleSelectTable = (table: LiveTable) => {
    if (table.status === "Dirty") return;
    if (table.status === "Billing") {
      openTableEntry(table, "settle");
      return;
    }
    if (
      table.status === "Occupied" ||
      table.status === "Reserved" ||
      table.openOrderId
    ) {
      openTableEntry(table, "manage");
      return;
    }
    openTableEntry(table, "new");
  };

  const handleBillTable = (table: LiveTable) => {
    if (table.status !== "Billing") return;
    openTableEntry(table, "settle");
  };

  const handleContinueWithoutTable = () => {
    setSelectedTable(null);
    setOpenOrderId("");
    setOpenBillId("");
    setEntryMode("new");
    setOrderOutletId(filterOutletId);
    setEntryStep("order");
  };

  const handleCleanTable = async (table: LiveTable) => {
    try {
      await liveTableService.clean(table.id);
      await reloadTables();
      setToast(`Table ${table.tableNo} cleared`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to clean table");
    }
  };

  if (loading || outletsLoading) {
    return (
      <div className="absolute -inset-3 z-10 flex items-center justify-center bg-[#f7f8f7] sm:-inset-4 lg:-inset-6">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute -inset-3 z-10 flex items-center justify-center bg-[#f7f8f7] sm:-inset-4 lg:-inset-6">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="absolute -inset-3 z-10 flex flex-col overflow-hidden bg-[#f7f8f7] sm:-inset-4 lg:-inset-6">
      {toast && (
        <div className="absolute left-1/2 top-3 z-50 w-[min(24rem,calc(100%-2rem))] -translate-x-1/2">
          <AlertBanner
            variant="success"
            message={toast}
            onDismiss={() => setToast(null)}
          />
        </div>
      )}
      {entryStep === "tables" ? (
        <FbTableSelectPanel
          outlets={outlets}
          outletId={filterOutletId}
          onOutletChange={setFilterOutletId}
          orderType={entryOrderType}
          onOrderTypeChange={setEntryOrderType}
          tables={tables}
          onSelectTable={handleSelectTable}
          onBillTable={handleBillTable}
          onCleanTable={(table) => void handleCleanTable(table)}
          onContinue={handleContinueWithoutTable}
          className="min-h-0 flex-1"
        />
      ) : (
        <FbOrderEntryPanel
          key={`${selectedTable?.id ?? entryOrderType}-${entryMode}-${openOrderId}`}
          outlets={outlets}
          outletId={orderOutletId}
          onOutletChange={setOrderOutletId}
          categories={categories}
          menuItems={posMenuItems}
          tables={tables}
          onOrderCreated={() => void handleOrderCreated()}
          onTablesRefresh={() => void reloadTables()}
          onToast={setToast}
          className="min-h-0 flex-1"
          initialTableNo={selectedTable?.tableNo ?? ""}
          initialGuest={
            selectedTable?.guest && selectedTable.guest !== "—"
              ? selectedTable.guest
              : ""
          }
          initialOrderType={entryOrderType}
          lockTable={!!selectedTable && entryOrderType === "Dine In"}
          liveTableId={selectedTable?.id}
          openOrderId={openOrderId || selectedTable?.openOrderId || undefined}
          openBillId={openBillId || selectedTable?.openBillId || undefined}
          entryMode={entryMode}
          onBack={() => {
            setEntryStep("tables");
            setSelectedTable(null);
            setOpenOrderId("");
            setOpenBillId("");
            setEntryMode("new");
            setOrderOutletId("");
          }}
        />
      )}
    </div>
  );
}
