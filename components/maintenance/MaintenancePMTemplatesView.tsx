"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Repeat,
  Plus,
  Search,
  CheckSquare,
  ChevronRight,
  Edit2,
  Trash2,
  Clock,
  Layers,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Badge, Button, Drawer, Modal, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { PROBLEM_CATEGORIES } from "@/app/data/maintenance/constants";
import { PMTaskTemplate, PMFrequency } from "@/app/data/maintenance/types";
import { usePsList } from "@/hooks/usePsResource";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { mntPmTemplateService, mntProblemCategoryService } from "@/services/maintenance/index";

export function MaintenancePMTemplatesView() {
  const { data: templates, loading, reload } = usePsList(() => mntPmTemplateService.list(), []);
  const { data: problemCategories } = usePsList(() => mntProblemCategoryService.list(), []);
  const categoryOptions = useMemo(() => {
    const fromMaster = problemCategories
      .filter((c) => String(c.status ?? "Active") === "Active")
      .map((c) => c.categoryName)
      .filter(Boolean);
    return fromMaster.length > 0 ? fromMaster : PROBLEM_CATEGORIES;
  }, [problemCategories]);
  const { saving, runLocked } = useSubmitLock();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal / Drawer States
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PMTaskTemplate | null>(null);

  // Form State
  const [formCode, setFormCode] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formFrequency, setFormFrequency] = useState<PMFrequency>("Monthly");
  const [formChecklistItems, setFormChecklistItems] = useState<string[]>([""]);
  const [formEstimatedHours, setFormEstimatedHours] = useState<number | "">(2);
  const [formSafetyNote, setFormSafetyNote] = useState("");

  const filteredTemplates = templates.filter((tmpl) => {
    const matchCat = selectedCategoryFilter === "ALL" || tmpl.category === selectedCategoryFilter;
    const matchSearch =
      tmpl.templateTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tmpl.templateCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(tmpl.category ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleOpenAddDrawer = () => {
    setFormCode(`PMT-CUSTOM-${templates.length + 1}`);
    setFormTitle("");
    setFormCategory(categoryOptions[0] || "");
    setFormFrequency("Monthly");
    setFormChecklistItems(["Inspect and clean unit", "Test safety switches"]);
    setFormEstimatedHours(2);
    setFormSafetyNote("");
    setIsAddDrawerOpen(true);
  };

  const handleAddChecklistItem = () => {
    setFormChecklistItems((prev) => [...prev, ""]);
  };

  const handleUpdateChecklistItem = (idx: number, val: string) => {
    setFormChecklistItems((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const handleRemoveChecklistItem = (idx: number) => {
    setFormChecklistItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || saving) return;

    const cleanedChecklist = formChecklistItems.map((i) => i.trim()).filter(Boolean);

    const body = {
      templateCode: formCode.trim() || `PMT-${Date.now()}`,
      templateTitle: formTitle.trim(),
      category: formCategory,
      defaultFrequency: formFrequency,
      checklist: cleanedChecklist.length > 0 ? cleanedChecklist : [formTitle.trim()],
      estimatedHours: formEstimatedHours !== "" ? Number(formEstimatedHours) : undefined,
      safetyNote: formSafetyNote.trim() || undefined,
      status: "Active" as const,
    };

    await runLocked(async () => {
      try {
        await mntPmTemplateService.create(body);
        setIsAddDrawerOpen(false);
        setToastMessage(`✓ PM Task Template "${body.templateTitle}" created.`);
        await reload();
      } catch (err) {
        console.error(err);
        alert(err instanceof Error ? err.message : "Failed to save template.");
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 text-sm text-slate-600">Loading PM templates...</div>
    );
  }

  return (
    <ModulePageShell
      eyebrow="Maintenance Masters"
      title="PM Task Templates"
      description="Standardized checklist templates for recurring preventive maintenance schedules across equipment categories."
      breadcrumbs={[
        { label: "Maintenance", href: "/maintenance" },
        { label: "Masters", href: "/maintenance/masters" },
        { label: "PM Task Templates" },
      ]}
      toast={toastMessage}
      onDismissToast={() => setToastMessage(null)}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Link href="/maintenance/preventive">
            <Button size="sm" variant="outline" className="text-xs font-semibold rounded-lg h-9">
              <Repeat className="mr-1.5 h-3.5 w-3.5" /> View PM Schedules
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={handleOpenAddDrawer}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg h-9"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> + New Task Template
          </Button>
        </div>
      }
    >
      {/* Search & Category Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5 items-center">
          <div className="md:col-span-8 relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates by title, code, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8.5 w-full pl-8.5 pr-3 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="h-8.5 w-full px-2.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:border-emerald-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Template Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((tmpl) => (
          <div key={tmpl.id} onClick={() => setSelectedTemplate(tmpl)} className="cursor-pointer">
            <Card className="p-4 border border-slate-200 hover:border-emerald-500 transition-all cursor-pointer group flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {tmpl.templateCode}
                </span>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-800 border border-blue-200">
                  {tmpl.defaultFrequency}
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                {tmpl.templateTitle}
              </h3>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">{tmpl.category}</span>

              {/* Checklist snippet */}
              <div className="mt-3 pt-2 border-t border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Default Checklist ({tmpl.checklist.length} steps)</span>
                <ul className="text-xs text-slate-700 space-y-1">
                  {tmpl.checklist.slice(0, 3).map((step, i) => (
                    <li key={i} className="flex items-start gap-1.5 truncate">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span className="truncate">{step}</span>
                    </li>
                  ))}
                  {tmpl.checklist.length > 3 && (
                    <li className="text-[10px] text-slate-400 italic font-medium pl-3">
                      +{tmpl.checklist.length - 3} more checklist steps...
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Est. {tmpl.estimatedHours || 2} hrs</span>
              <span className="font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                View Template <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </Card>
          </div>
        ))}
      </div>

      {/* CREATE TEMPLATE DRAWER */}
      {isAddDrawerOpen && (
        <Drawer
          isOpen={isAddDrawerOpen}
          onClose={() => setIsAddDrawerOpen(false)}
          title="Create PM Task Template"
          maxWidth="md"
        >
          <form onSubmit={handleSaveTemplate} className="space-y-4 p-1 text-xs">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Template Code</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Default Frequency <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formFrequency}
                  onChange={(e) => setFormFrequency(e.target.value as PMFrequency)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Template Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Monthly Generator Inspection & Service"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Equipment Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white font-semibold text-xs"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Checklist Items */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-slate-800 text-[11px]">
                  Default Inspection Checklist Steps <span className="text-rose-500">*</span>
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleAddChecklistItem}
                  className="h-6 px-2 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50"
                >
                  + Add Step
                </Button>
              </div>

              {formChecklistItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="font-mono text-slate-400 font-bold text-[10px]">{idx + 1}.</span>
                  <input
                    type="text"
                    required
                    placeholder={`Checklist step ${idx + 1}...`}
                    value={item}
                    onChange={(e) => handleUpdateChecklistItem(idx, e.target.value)}
                    className="w-full p-1.5 rounded border border-slate-200 bg-white text-xs"
                  />
                  {formChecklistItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistItem(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Safety / LOTO Note</label>
              <input
                type="text"
                placeholder="e.g. LOTO electrical isolation required before opening panel."
                value={formSafetyNote}
                onChange={(e) => setFormSafetyNote(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => setIsAddDrawerOpen(false)}
                className="rounded-lg text-xs disabled:opacity-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs px-4 disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {saving ? "Saving..." : "Save Template ✓"}
              </Button>
            </div>
          </form>
        </Drawer>
      )}

      {/* VIEW TEMPLATE DETAILS DRAWER */}
      {selectedTemplate && (
        <Drawer
          isOpen={Boolean(selectedTemplate)}
          onClose={() => setSelectedTemplate(null)}
          title={`PM Template #${selectedTemplate.templateCode}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs p-1">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-700">{selectedTemplate.templateCode}</span>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-800 border border-blue-200">
                  {selectedTemplate.defaultFrequency}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{selectedTemplate.templateTitle}</h3>
              <span className="text-[11px] text-slate-500 font-medium block">Category: {selectedTemplate.category}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
              <strong className="text-xs font-bold text-slate-900 block border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <CheckSquare className="h-3.5 w-3.5 text-slate-500" /> Default Checklist Steps
              </strong>
              <ol className="space-y-1.5 text-xs text-slate-800 font-medium">
                {selectedTemplate.checklist.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2 p-1.5 bg-slate-50 rounded">
                    <span className="font-mono text-[10px] font-bold text-emerald-700">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {selectedTemplate.safetyNote && (
              <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-200 text-xs space-y-1">
                <strong className="text-rose-950 font-bold flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-600" /> Safety Note
                </strong>
                <p className="text-rose-900">{selectedTemplate.safetyNote}</p>
              </div>
            )}
          </div>
        </Drawer>
      )}
    </ModulePageShell>
  );
}
