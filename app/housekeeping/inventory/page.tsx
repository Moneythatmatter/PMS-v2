"use client";

import React, { useState, useMemo } from "react";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import { Tag, Plus, CheckCircle2, AlertTriangle, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { TextInput, SelectInput, FormField } from "@/components/frontoffice/ui";

export default function InventoryStocks() {
  const {
    inventory,
    restockInventoryItem,
  } = useHousekeeping();

  const [activeCategory, setActiveCategory] = useState<"Linen" | "Amenity" | "Chemical" | "Equipment">("Linen");
  const [restockOpen, setRestockOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [restockQty, setRestockQty] = useState("50");

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => item.category === activeCategory);
  }, [inventory, activeCategory]);

  const handleOpenRestock = (id: string) => {
    setSelectedItemId(id);
    setRestockQty("50");
    setRestockOpen(true);
  };

  const handleSaveRestock = () => {
    const qty = parseInt(restockQty, 10) || 0;
    if (!selectedItemId) return;
    restockInventoryItem(selectedItemId, qty);
    setRestockOpen(false);
  };

  const selectedItem = useMemo(() => {
    return inventory.find((i) => i.id === selectedItemId) || null;
  }, [inventory, selectedItemId]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Inventory</span>
          <h1 className="mt-1 text-2xl font-bold text-slate-800">Stock & Supply Control</h1>
          <p className="text-sm text-slate-500 font-normal">
            Monitor and replenish general hotel linen sheets, guest vanity amenities, and cleaning chemicals.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6 text-sm font-semibold">
          {(["Linen", "Amenity", "Chemical", "Equipment"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "pb-4 px-1 border-b-2",
                activeCategory === cat
                  ? "border-emerald-700 text-emerald-700"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              {cat} Items
            </button>
          ))}
        </nav>
      </div>

      {/* Grid List */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3">Item Name</th>
              <th className="px-5 py-3">In Stock Available</th>
              {activeCategory === "Linen" && <th className="px-5 py-3">In Laundry</th>}
              <th className="px-5 py-3">Damaged / Lost</th>
              <th className="px-5 py-3">Par Stock</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredInventory.map((item) => {
              const ratio = item.available / item.parStock;
              const isLow = ratio < 0.6;
              const isUrgent = ratio < 0.3;

              return (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-4 font-bold text-slate-800">{item.name}</td>
                  <td className="px-5 py-4 font-extrabold text-slate-700">
                    {item.available} {item.unit}
                  </td>
                  {activeCategory === "Linen" && (
                    <td className="px-5 py-4 text-slate-500 font-semibold">{item.laundry || 0} Pcs</td>
                  )}
                  <td className="px-5 py-4 text-red-600 font-medium">
                    {item.damaged} / {item.lost} {item.unit}
                  </td>
                  <td className="px-5 py-4 text-slate-400 font-medium">
                    {item.parStock} {item.unit}
                  </td>
                  <td className="px-5 py-4">
                    {isUrgent ? (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-700 uppercase tracking-wide animate-pulse">
                        Critically Low
                      </span>
                    ) : isLow ? (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700 uppercase">
                        Low Stock
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 uppercase">
                        Stocked
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button
                      onClick={() => handleOpenRestock(item.id)}
                      className="py-1 px-2.5 text-[10px] bg-emerald-700 hover:bg-emerald-800 text-white font-semibold flex items-center gap-1 inline-flex"
                    >
                      <Plus className="h-3 w-3" /> Restock
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Drawer: Restock */}
      <Drawer open={restockOpen} onClose={() => setRestockOpen(false)} title={`Restock Item: ${selectedItem?.name}`}>
        <div className="space-y-4">
          <FormField label="Restock Quantity" required>
            <TextInput type="number" min="1" value={restockQty} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRestockQty(e.target.value)} />
          </FormField>

          <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-800">
            Adding stock will increase available counts for trolley allocations. Audit trails will log this transaction.
          </div>

          <Button
            onClick={handleSaveRestock}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            Confirm Restock
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
