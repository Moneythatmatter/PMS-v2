"use client";

import React, { useState, useMemo } from "react";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import { ClipboardList, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { TextInput, FormField } from "@/components/frontoffice/ui";

import { hkChecklistService } from "@/services/housekeeping";

export default function ChecklistMasters() {
  const {
    checklists,
    setChecklists,
    logAudit,
  } = useHousekeeping();

  const [activeChecklistId, setActiveChecklistId] = useState(checklists[0]?.id || "");
  const [newItemText, setNewItemText] = useState("");

  const activeChecklist = useMemo(() => {
    return checklists.find((c) => c.id === activeChecklistId) || null;
  }, [checklists, activeChecklistId]);

  const handleAddItem = () => {
    if (!newItemText.trim() || !activeChecklistId) return;

    let updatedItems: string[] = [];

    setChecklists((prev) =>
      prev.map((c) => {
        if (c.id !== activeChecklistId) return c;
        updatedItems = [...c.items, newItemText.trim()];
        logAudit(
          "Inspection",
          "Checklist Item Added",
          `Added task step "${newItemText.trim()}" to checklist: "${c.name}".`
        );
        return {
          ...c,
          items: updatedItems,
        };
      })
    );

    setNewItemText("");

    void hkChecklistService.update(activeChecklistId, {
      items: updatedItems,
    }).catch((err) => {
      console.error(`[HK] Failed to sync added checklist item for ${activeChecklistId}`, err);
    });
  };

  const handleDeleteItem = (index: number) => {
    if (!activeChecklistId) return;

    let updatedItems: string[] = [];

    setChecklists((prev) =>
      prev.map((c) => {
        if (c.id !== activeChecklistId) return c;
        const deleted = c.items[index];
        updatedItems = c.items.filter((_, i) => i !== index);
        logAudit(
          "Inspection",
          "Checklist Item Removed",
          `Deleted task step "${deleted}" from checklist: "${c.name}".`
        );
        return {
          ...c,
          items: updatedItems,
        };
      })
    );

    void hkChecklistService.update(activeChecklistId, {
      items: updatedItems,
    }).catch((err) => {
      console.error(`[HK] Failed to sync deleted checklist item for ${activeChecklistId}`, err);
    });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Masters</span>
        <h1 className="mt-1 text-2xl font-bold text-slate-800">Cleaning Checklist Templates</h1>
        <p className="text-sm text-slate-500 font-normal">
          Define standard task checklists for Stay-over cleaning, Checkout cleanings, Public Area sanitation, and Deep cleans.
        </p>
      </div>

      {/* Main layout grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Side: Sidebar selector list (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
              Select Template
            </h3>
            <div className="space-y-1.5">
              {checklists.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveChecklistId(c.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center gap-2.5 transition-colors",
                    activeChecklistId === c.id
                      ? "border-emerald-600 bg-emerald-50/20 text-emerald-800"
                      : "border-slate-100 hover:bg-slate-50 text-slate-600 bg-white"
                  )}
                >
                  <ClipboardList className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Items Checklist Config Panel (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {activeChecklist ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-800">{activeChecklist.name} Steps</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Template ID: {activeChecklist.id} · Type: {activeChecklist.type}
                </p>
              </div>

              {/* Add checklist item row */}
              <div className="flex gap-2">
                <TextInput
                  placeholder="e.g. Empty minibar and check expiry seals…"
                  value={newItemText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewItemText(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") handleAddItem();
                  }}
                  className="flex-1"
                />
                <Button onClick={handleAddItem} className="bg-emerald-700 hover:bg-emerald-800 text-white">
                  Add Step
                </Button>
              </div>

              {/* Checklist steps list */}
              <div className="space-y-2">
                {activeChecklist.items.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-100 rounded-xl">
                    No steps added to this checklist yet. Add one above!
                  </p>
                ) : (
                  activeChecklist.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/10 hover:bg-slate-50/50"
                    >
                      <div className="flex items-start gap-2.5 text-xs text-slate-700 font-medium pr-4">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{item}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(index)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1"
                        title="Remove checklist item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white shadow-sm">
              Please select a checklist template from the left menu to configure.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
