"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fbReservationService,
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
import { ConfirmModal } from "@/components/frontoffice/ui/Modal";
import { ReservationArrivalModal } from "@/components/foodbeverages/reservations/ReservationArrivalModal";
import { isHoldingTable } from "@/app/data/foodbeverages/reservations";

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
  const [roomServiceOrders, setRoomServiceOrders] = useState<LiveTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [openOrderId, setOpenOrderId] = useState("");
  const [openBillId, setOpenBillId] = useState("");
  const [entryMode, setEntryMode] = useState<PosEntryMode>("new");
  const [selectedRoomOrder, setSelectedRoomOrder] = useState<LiveTable | null>(
    null,
  );
  const [noShowTable, setNoShowTable] = useState<LiveTable | null>(null);
  const [noShowBusy, setNoShowBusy] = useState(false);
  const [arrivalTable, setArrivalTable] = useState<LiveTable | null>(null);
  const [reservationOverride, setReservationOverride] = useState<{ reservationId: string; reason: string } | null>(null);
  const reloadTables = async () => {
    try {
      const tableData = await floorPlanService.list();
      setTables(tableData);
    } catch {
      setTables([]);
    }
  };

  const reloadRoomServiceOrders = async (outletId?: string) => {
    try {
      const rows = await floorPlanService.listRoomServiceOpen(outletId);
      setRoomServiceOrders(rows);
    } catch {
      setRoomServiceOrders([]);
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
        const [menuData, categoryData, tableData, roomOrders] = await Promise.all([
          menuItemService.list().catch(() => []),
          menuCategoryService.list().catch(() => []),
          floorPlanService.list().catch(() => []),
          floorPlanService.listRoomServiceOpen().catch(() => []),
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
        setRoomServiceOrders(roomOrders);
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

  useEffect(() => {
    if (entryStep !== "tables" || entryOrderType !== "Dine In") return;
    const timer = window.setInterval(() => {
      floorPlanService
        .list()
        .then(setTables)
        .catch(() => undefined);
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [entryStep, entryOrderType]);

  useEffect(() => {
    if (entryStep !== "tables" || entryOrderType !== "Room Service") return;
    void reloadRoomServiceOrders(filterOutletId || undefined);
  }, [entryStep, entryOrderType, filterOutletId]);

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
    const activeTab = entryOrderType;
    await Promise.all([
      reloadTables(),
      reloadRoomServiceOrders(filterOutletId || undefined),
    ]);
    setSelectedTable(null);
    setSelectedRoomOrder(null);
    setOpenOrderId("");
    setOpenBillId("");
    setEntryMode("new");
    setEntryStep("tables");
    setEntryOrderType(activeTab);
    setOrderOutletId("");
    setReservationOverride(null);
    setToast("Done");
  };

  const openTableEntry = (
    table: LiveTable,
    mode: PosEntryMode,
    override: { reservationId: string; reason: string } | null = null,
  ) => {
    setReservationOverride(override);
    setSelectedTable(table);
    setSelectedRoomOrder(null);
    setOpenOrderId(table.openOrderId ?? "");
    setOpenBillId(table.openBillId ?? "");
    setEntryMode(mode);
    setEntryOrderType("Dine In");
    setOrderOutletId(table.outletId || "");
    setEntryStep("order");
  };

  const openRoomServiceEntry = (room: LiveTable, mode: PosEntryMode) => {
    setSelectedRoomOrder(room);
    setSelectedTable(null);
    setOpenOrderId(room.openOrderId ?? room.id);
    setOpenBillId(room.openBillId ?? "");
    setEntryMode(mode);
    setEntryOrderType("Room Service");
    setOrderOutletId(room.outletId || filterOutletId);
    setEntryStep("order");
  };

  const handleSelectTable = (table: LiveTable) => {
    if (table.status === "Dirty") return;
    if (table.status === "Available" && table.reservation && isHoldingTable(table.reservation.phase)) {
      setArrivalTable(table);
      return;
    }
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
    setSelectedRoomOrder(null);
    setOpenOrderId("");
    setOpenBillId("");
    setEntryMode("new");
    setOrderOutletId(filterOutletId);
    setEntryStep("order");
  };

  const handleSelectRoomOrder = (room: LiveTable) => {
    if (room.status === "Billing") {
      openRoomServiceEntry(room, "settle");
      return;
    }
    if (room.openOrderId || room.status !== "Available") {
      openRoomServiceEntry(room, "manage");
      return;
    }
    openRoomServiceEntry(room, "new");
  };

  const handleBillRoomOrder = (room: LiveTable) => {
    if (room.status !== "Billing") return;
    openRoomServiceEntry(room, "settle");
  };

  const handleNoShow = async () => {
    const reservation = noShowTable?.reservation;
    if (!noShowTable || !reservation) return;
    setNoShowBusy(true);
    try {
      await fbReservationService.markNoShow(reservation.id);
      await reloadTables();
      setToast(`${reservation.resNo} marked as no-show · table ${noShowTable.tableNo} is free`);
      setNoShowTable(null);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to mark no-show");
    } finally {
      setNoShowBusy(false);
    }
  };

  const handleArrivalSeated = async (message: string) => {
    const table = arrivalTable;
    setArrivalTable(null);
    setToast(message);
    if (!table) return;
    const fresh = await floorPlanService.get(table.id).catch(() => null);
    await reloadTables();
    openTableEntry(fresh ?? table, "new");
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
          roomServiceOrders={roomServiceOrders}
          onSelectTable={handleSelectTable}
          onSelectRoomOrder={handleSelectRoomOrder}
          onBillTable={handleBillTable}
          onBillRoomOrder={handleBillRoomOrder}
          onCleanTable={(table) => void handleCleanTable(table)}
          onNoShow={setNoShowTable}
          onContinue={handleContinueWithoutTable}
          className="min-h-0 flex-1"
        />
      ) : (
        <FbOrderEntryPanel
          key={`${selectedTable?.id ?? selectedRoomOrder?.id ?? entryOrderType}-${entryMode}-${openOrderId}`}
          outlets={outlets}
          outletId={orderOutletId}
          onOutletChange={setOrderOutletId}
          categories={categories}
          menuItems={posMenuItems}
          tables={tables}
          onOrderCreated={() => void handleOrderCreated()}
          onTablesRefresh={() => {
            void reloadTables();
            void reloadRoomServiceOrders(filterOutletId || undefined);
          }}
          onToast={setToast}
          className="min-h-0 flex-1"
          initialTableNo={
            selectedTable?.tableNo ?? selectedRoomOrder?.tableNo ?? ""
          }
          initialGuest={
            selectedTable?.guest && selectedTable.guest !== "—"
              ? selectedTable.guest
              : selectedTable?.reservation?.phase === "seated"
                ? selectedTable.reservation.guest
              : selectedRoomOrder?.guest && selectedRoomOrder.guest !== "—"
                ? selectedRoomOrder.guest
                : ""
          }
          initialReservationId={selectedRoomOrder?.reservationId ?? ""}
          initialOrderType={entryOrderType}
          lockTable={!!selectedTable && entryOrderType === "Dine In"}
          liveTableId={selectedTable?.id}
          reservationOverride={reservationOverride}
          openOrderId={
            openOrderId ||
            selectedTable?.openOrderId ||
            selectedRoomOrder?.openOrderId ||
            undefined
          }
          openBillId={
            openBillId ||
            selectedTable?.openBillId ||
            selectedRoomOrder?.openBillId ||
            undefined
          }
          entryMode={entryMode}
          onBack={() => {
            setEntryStep("tables");
            setSelectedTable(null);
            setSelectedRoomOrder(null);
            setOpenOrderId("");
            setOpenBillId("");
            setEntryMode("new");
            setOrderOutletId("");
            setReservationOverride(null);
          }}
        />
      )}

      {arrivalTable && (
        <ReservationArrivalModal
          table={arrivalTable}
          onClose={() => setArrivalTable(null)}
          onSeated={(message) => void handleArrivalSeated(message)}
          onWalkIn={(override) => {
            const table = arrivalTable;
            setArrivalTable(null);
            openTableEntry(table, "new", override);
          }}
          onNoShow={(message) => {
            setArrivalTable(null);
            setToast(message);
            void reloadTables();
          }}
        />
      )}

      <ConfirmModal
        open={noShowTable !== null}
        onClose={() => setNoShowTable(null)}
        onConfirm={() => void handleNoShow()}
        loading={noShowBusy}
        variant="danger"
        title="Mark reservation as no-show?"
        message={
          noShowTable?.reservation
            ? `${noShowTable.reservation.resNo} · ${noShowTable.reservation.guest} (${noShowTable.reservation.covers} pax) did not arrive. The reservation will be marked No Show and table ${noShowTable.tableNo} will be free for walk-ins.`
            : ""
        }
        confirmLabel="Mark No Show"
      />
    </div>
  );
}
