"use client";

import React, { useState, useMemo } from "react";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import { Plus, CheckCircle2, XCircle, ArrowRight, Layers, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { TextInput, SelectInput, FormField, TextAreaInput } from "@/components/frontoffice/ui";

export default function Requisitions() {
  const {
    requisitions,
    inventory,
    addRequisition,
    approveRequisition,
    issueRequisition,
    rejectRequisition,
  } = useHousekeeping();

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedReqItem, setSelectedReqItem] = useState("Luxury Herbal Soap (20g)");
  const [qty, setQty] = useState("10");
  const [remarks, setRemarks] = useState("");

  const supplyItems = useMemo(() => {
    return inventory.filter((i) => i.category === "Amenity" || i.category === "Linen" || i.category === "Chemical");
  }, [inventory]);

  const handleCreate = () => {
    const quantity = parseInt(qty, 10) || 1;
    const inv = inventory.find((i) => i.name === selectedReqItem);
    
    addRequisition({
      items: [{ item: selectedReqItem, quantity, unit: inv?.unit || "Pcs" }],
      remarks,
    });

    setCreateOpen(false);
    setRemarks("");
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Operations</span>
          <h1 className="mt-1 text-2xl font-bold text-slate-800">Supply Requisitions</h1>
          <p className="text-sm text-slate-500 font-normal">
            Housekeeping supply orders. Request amenities, linen batches, or cleaning chemicals from general stores.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedReqItem(supplyItems[0]?.name || "");
            setCreateOpen(true);
          }}
          className="bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> New Requisition
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
            <tr>
              <th className="px-5 py-3">Req Number</th>
              <th className="px-5 py-3">Requested By</th>
              <th className="px-5 py-3">Items Order</th>
              <th className="px-5 py-3">Requested Date</th>
              <th className="px-5 py-3">Issued Date</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Remarks</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requisitions.map((req) => {
              const isPending = req.status === "Pending";
              const isApproved = req.status === "Approved";

              return (
                <tr key={req.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-4 font-bold text-slate-800">{req.requestNo}</td>
                  <td className="px-5 py-4 text-slate-500 font-medium">{req.requestedBy}</td>
                  <td className="px-5 py-4 font-semibold text-slate-700">
                    {req.items.map((i, idx) => (
                      <div key={idx}>
                        {i.quantity}x {i.item} ({i.unit})
                      </div>
                    ))}
                  </td>
                  <td className="px-5 py-4 text-slate-400">{req.requestedAt}</td>
                  <td className="px-5 py-4 text-slate-400">{req.issuedAt || "—"}</td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase",
                        req.status === "Issued"
                          ? "bg-emerald-50 text-emerald-700"
                          : req.status === "Approved"
                          ? "bg-blue-50 text-blue-700"
                          : req.status === "Pending"
                          ? "bg-amber-50 text-amber-700 animate-pulse"
                          : "bg-red-50 text-red-700"
                      )}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 max-w-xs truncate">{req.remarks || "—"}</td>
                  <td className="px-5 py-4 text-right space-x-1.5">
                    {isPending && (
                      <>
                        <Button
                          onClick={() => rejectRequisition(req.id, "Rejected by stores")}
                          className="py-1 px-2 text-[10px] font-semibold bg-red-600 hover:bg-red-700 text-white"
                        >
                          Reject
                        </Button>
                        <Button
                          onClick={() => approveRequisition(req.id)}
                          className="py-1 px-2 text-[10px] font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Approve
                        </Button>
                      </>
                    )}
                    {isApproved && (
                      <Button
                        onClick={() => issueRequisition(req.id)}
                        className="py-1 px-2 text-[10px] font-semibold bg-emerald-700 hover:bg-emerald-800 text-white"
                      >
                        Issue Stock
                      </Button>
                    )}
                    {req.status === "Issued" && <span className="text-[10px] text-slate-400 font-semibold">✓ Handed Over</span>}
                    {req.status === "Rejected" && <span className="text-[10px] text-red-500 font-semibold">✘ Rejected</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Drawer: Add Requisition */}
      <Drawer open={createOpen} onClose={() => setCreateOpen(false)} title="Create Supply Requisition">
        <div className="space-y-4">
          <FormField label="Supply Item" required>
            <SelectInput value={selectedReqItem} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedReqItem(e.target.value)}>
              {supplyItems.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name} (Avail: {item.available} {item.unit})
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField label="Requested Quantity" required>
            <TextInput type="number" min="1" value={qty} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQty(e.target.value)} />
          </FormField>

          <FormField label="Remarks / Purpose">
            <TextAreaInput
              placeholder="e.g. Toiletries for 3rd floor trolley cart replenishment."
              value={remarks}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemarks(e.target.value)}
            />
          </FormField>

          <Button
            onClick={handleCreate}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white"
          >
            Create Requisition Request
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
