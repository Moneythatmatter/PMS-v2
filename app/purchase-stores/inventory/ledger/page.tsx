"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  FileSpreadsheet,
  IndianRupee,
  Layers,
  Printer,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import {
  TextInput,
  SelectInput,
  FormField,
  StatMiniCard,
} from "@/components/frontoffice/ui";
import { FOSearchToolbar } from "@/components/frontoffice/ui/FOSearchToolbar";
import { ModulePageShell } from "@/components/pms";
import { ModuleDataTable } from "@/components/pms/ModuleDataTable";
import { ModuleSelectionBar } from "@/components/pms/ModuleSelectionBar";
import type { ModuleColumn } from "@/components/pms/module-types";
import { cn } from "@/lib/utils";
import {
  INITIAL_STOCK_LEDGER_RECORDS,
  type StockLedgerRecord,
  type TransactionType,
} from "@/app/data/stockLedgerData";

function transactionBadge(type: TransactionType) {
  const style =
    type === "GRN" || type === "Opening Stock" || type === "Stock Transfer In"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : type === "Department Issue"
        ? "bg-blue-50 text-blue-700 ring-blue-200"
        : type === "Stock Transfer Out"
          ? "bg-amber-50 text-amber-700 ring-amber-200"
          : type === "Vendor Return" || type === "Scrap"
            ? "bg-red-50 text-red-700 ring-red-200"
            : "bg-slate-100 text-slate-600 ring-slate-200";

  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset", style)}>
      {type}
    </span>
  );
}

export default function StockLedgerPage() {
  const [mounted, setMounted] = useState(false);
  const [ledgerList, setLedgerList] = useState(INITIAL_STOCK_LEDGER_RECORDS);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<StockLedgerRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => setMounted(true), []);

  const filteredLedger = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ledgerList.filter((rec) => {
      const matchSearch =
        !q ||
        rec.transactionNo.toLowerCase().includes(q) ||
        rec.referenceNo.toLowerCase().includes(q) ||
        rec.itemCode.toLowerCase().includes(q) ||
        rec.itemName.toLowerCase().includes(q) ||
        rec.supplier.toLowerCase().includes(q);
      const matchType = typeFilter === "all" || rec.transactionType === typeFilter;
      const matchWarehouse =
        warehouseFilter === "all" || rec.warehouse.toLowerCase().includes(warehouseFilter.toLowerCase());
      const matchCategory =
        categoryFilter === "all" || rec.category.toLowerCase().includes(categoryFilter.toLowerCase());
      const matchDept =
        departmentFilter === "all" || rec.department.toLowerCase().includes(departmentFilter.toLowerCase());
      const matchDate = !dateFilter || rec.transactionDate.includes(dateFilter);
      return matchSearch && matchType && matchWarehouse && matchCategory && matchDept && matchDate;
    });
  }, [ledgerList, search, typeFilter, warehouseFilter, categoryFilter, departmentFilter, dateFilter]);

  const stats = useMemo(() => {
    const stockIn = filteredLedger.reduce((sum, r) => sum + r.stockIn, 0);
    const stockOut = filteredLedger.reduce((sum, r) => sum + r.stockOut, 0);
    const value = filteredLedger.reduce((sum, r) => sum + r.transactionValue, 0);
    const uniqueItems = new Set(filteredLedger.map((r) => r.itemCode)).size;
    return { stockIn, stockOut, value, uniqueItems };
  }, [filteredLedger]);

  const columns: ModuleColumn[] = [
    {
      key: "transactionDate",
      header: "When",
      render: (r: StockLedgerRecord) => (
        <span className="whitespace-nowrap text-[11px] font-medium text-slate-600">{r.transactionDate}</span>
      ),
    },
    {
      key: "transactionNo",
      header: "Transaction",
      render: (r: StockLedgerRecord) => (
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold text-slate-900">{r.transactionNo}</p>
          <p className="truncate text-[11px] text-slate-500">{r.referenceNo}</p>
        </div>
      ),
    },
    {
      key: "transactionType",
      header: "Type",
      render: (r: StockLedgerRecord) => transactionBadge(r.transactionType),
    },
    {
      key: "itemName",
      header: "Item",
      render: (r: StockLedgerRecord) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{r.itemName}</p>
          <p className="truncate text-[11px] text-slate-500">
            {r.itemCode} · {r.category}
          </p>
        </div>
      ),
    },
    {
      key: "warehouse",
      header: "Location",
      render: (r: StockLedgerRecord) => (
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-800">{r.warehouse}</p>
          <p className="truncate text-[11px] text-slate-500">{r.department}</p>
        </div>
      ),
    },
    {
      key: "stockIn",
      header: "In / Out",
      align: "right",
      render: (r: StockLedgerRecord) => (
        <div className="text-right text-xs">
          {r.stockIn > 0 ? (
            <p className="font-semibold text-emerald-700">+{r.stockIn}</p>
          ) : r.stockOut > 0 ? (
            <p className="font-semibold text-blue-700">-{r.stockOut}</p>
          ) : (
            <p className="text-slate-300">—</p>
          )}
          <p className="text-[11px] text-slate-500">{r.unit}</p>
        </div>
      ),
    },
    {
      key: "balanceQty",
      header: "Balance",
      align: "right",
      render: (r: StockLedgerRecord) => (
        <span
          className={cn(
            "inline-flex rounded-md px-2 py-0.5 text-xs font-bold",
            r.balanceQty < 0 ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-900",
          )}
        >
          {r.balanceQty}
        </span>
      ),
    },
    {
      key: "transactionValue",
      header: "Value",
      align: "right",
      render: (r: StockLedgerRecord) => (
        <span className="text-xs font-semibold text-slate-900">
          ₹{r.transactionValue.toLocaleString("en-IN")}
        </span>
      ),
    },
  ];

  if (!mounted) return null;

  return (
    <ModulePageShell
      eyebrow="Inventory"
      title="Stock Ledger"
      description="Track every stock movement — receipts, issues, transfers, and adjustments."
      wrapChildren={false}
      secondaryActions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setLedgerList([...INITIAL_STOCK_LEDGER_RECORDS]);
            }}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => alert("Exporting stock ledger…")}>
            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatMiniCard label="Movements" value={filteredLedger.length} icon={Layers} sublabel="In view" />
        <StatMiniCard
          label="Stock In"
          value={stats.stockIn.toLocaleString("en-IN")}
          accent="#10b981"
          icon={ArrowDownRight}
          sublabel="Received / transferred in"
        />
        <StatMiniCard
          label="Stock Out"
          value={stats.stockOut.toLocaleString("en-IN")}
          accent="#2563eb"
          icon={ArrowUpRight}
          sublabel="Issued / transferred out"
        />
        <StatMiniCard
          label="Value"
          value={`₹${stats.value.toLocaleString("en-IN")}`}
          accent="#047857"
          icon={IndianRupee}
          sublabel={`${stats.uniqueItems} SKUs`}
        />
      </div>

      <div className="mt-3">
        <FOSearchToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search transaction, item, supplier…"
          filterPills={{
            active: typeFilter,
            onChange: setTypeFilter,
            options: [
              { id: "all", label: "All" },
              { id: "GRN", label: "GRN" },
              { id: "Department Issue", label: "Issues" },
              { id: "Stock Transfer In", label: "Transfer In" },
              { id: "Stock Transfer Out", label: "Transfer Out" },
              { id: "Vendor Return", label: "Returns" },
              { id: "Stock Adjustment", label: "Adjustments" },
              { id: "Scrap", label: "Scrap" },
            ],
          }}
          hasActiveAdvancedFilters={
            warehouseFilter !== "all" ||
            categoryFilter !== "all" ||
            departmentFilter !== "all" ||
            Boolean(dateFilter)
          }
          onClearAdvancedFilters={() => {
            setWarehouseFilter("all");
            setCategoryFilter("all");
            setDepartmentFilter("all");
            setDateFilter("");
          }}
          advancedFilters={
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FormField label="Warehouse">
                <SelectInput
                  value={warehouseFilter}
                  onChange={(e) => setWarehouseFilter(e.target.value)}
                >
                  <option value="all">All warehouses</option>
                  <option value="Linen">Central Linen</option>
                  <option value="Cold">Cold Room</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Engineering">Engineering</option>
                </SelectInput>
              </FormField>
              <FormField label="Category">
                <SelectInput
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All categories</option>
                  <option value="Linen">Linen</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Chemicals">Chemicals</option>
                  <option value="Engineering">Engineering</option>
                </SelectInput>
              </FormField>
              <FormField label="Department">
                <SelectInput
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <option value="all">All departments</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Kitchen">Kitchen / F&B</option>
                  <option value="Engineering">Engineering</option>
                </SelectInput>
              </FormField>
              <FormField label="Date">
                <TextInput
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </FormField>
            </div>
          }
        />
      </div>

      {filteredLedger.some((r) => r.balanceQty < 0) && (
        <section className="mt-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <div>
              <p className="text-sm font-semibold text-amber-950">Negative balances in view</p>
              <p className="text-xs text-amber-800/80">
                Review flagged movements — stock may need a physical count or adjustment.
              </p>
            </div>
          </div>
        </section>
      )}

      <div className="mt-3 space-y-3">
        <ModuleSelectionBar
          count={selectedIds.size}
          noun="movement"
          onClear={() => setSelectedIds(new Set())}
          actions={[
            {
              label: "View",
              onClick: () => {
                const first = filteredLedger.find((r) => selectedIds.has(r.id));
                if (first) setSelectedRecord(first);
              },
            },
            {
              label: "Print",
              icon: <Printer className="h-3.5 w-3.5" />,
              onClick: () => {
                const first = filteredLedger.find((r) => selectedIds.has(r.id));
                if (first) alert(`Printing ${first.transactionNo}`);
              },
            },
            {
              label: "Download",
              icon: <Download className="h-3.5 w-3.5" />,
              onClick: () => {
                const first = filteredLedger.find((r) => selectedIds.has(r.id));
                if (first) alert(`Downloading ${first.transactionNo}`);
              },
            },
          ]}
        />
        <ModuleDataTable
          columns={columns}
          rows={filteredLedger}
          emptyMessage="No stock movements match your filters."
          onRowClick={(r) => setSelectedRecord(r as StockLedgerRecord)}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          renderMobileCard={(r: StockLedgerRecord) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-xs font-bold text-slate-900">{r.transactionNo}</p>
                {transactionBadge(r.transactionType)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{r.itemName}</p>
                <p className="text-[11px] text-slate-500">
                  {r.warehouse} · {r.transactionDate}
                </p>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                <span className="text-slate-500">
                  In <span className="font-semibold text-emerald-700">{r.stockIn}</span> · Out{" "}
                  <span className="font-semibold text-blue-700">{r.stockOut}</span>
                </span>
                <span className="font-bold text-slate-900">
                  Bal {r.balanceQty} {r.unit}
                </span>
              </div>
            </div>
          )}
        />
      </div>

      {selectedRecord && (
        <Drawer
          open={Boolean(selectedRecord)}
          onClose={() => setSelectedRecord(null)}
          title={selectedRecord.transactionNo}
          description={`${selectedRecord.transactionType} · ${selectedRecord.transactionDate}`}
          width="lg"
          footer={
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setSelectedRecord(null)}>
                Close
              </Button>
              <Button type="button" onClick={() => alert(`Printing ${selectedRecord.transactionNo}`)}>
                <Printer className="mr-1.5 h-3.5 w-3.5" />
                Print
              </Button>
            </div>
          }
        >
          <div className="space-y-4 p-1">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Item">
                <p className="text-sm font-semibold text-slate-900">{selectedRecord.itemName}</p>
                <p className="text-xs text-slate-500">{selectedRecord.itemCode}</p>
              </FormField>
              <FormField label="Reference">
                <p className="font-mono text-sm font-semibold text-emerald-800">{selectedRecord.referenceNo}</p>
              </FormField>
              <FormField label="Warehouse">
                <p className="text-sm text-slate-800">{selectedRecord.warehouse}</p>
                <p className="text-xs text-slate-500">{selectedRecord.store}</p>
              </FormField>
              <FormField label="Department / Supplier">
                <p className="text-sm text-slate-800">{selectedRecord.department}</p>
                <p className="text-xs text-slate-500">{selectedRecord.supplier}</p>
              </FormField>
              <FormField label="Batch">
                <p className="font-mono text-sm text-slate-800">{selectedRecord.batchNo || "—"}</p>
              </FormField>
              <FormField label="Created by">
                <p className="text-sm text-slate-800">{selectedRecord.createdBy}</p>
                <p className="text-xs text-slate-500">Approved: {selectedRecord.approvedBy}</p>
              </FormField>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
              <div>
                <p className="text-[11px] text-slate-500">In</p>
                <p className="text-lg font-bold text-emerald-700">+{selectedRecord.stockIn}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Out</p>
                <p className="text-lg font-bold text-blue-700">-{selectedRecord.stockOut}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Balance</p>
                <p className="text-lg font-bold text-slate-900">{selectedRecord.balanceQty}</p>
              </div>
            </div>

            {selectedRecord.remarks && (
              <FormField label="Remarks">
                <p className="text-sm text-slate-700">{selectedRecord.remarks}</p>
              </FormField>
            )}
          </div>
        </Drawer>
      )}
    </ModulePageShell>
  );
}
