"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import {
  PackageSearch,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  History,
  FileText,
  Lock,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import { TextInput, SelectInput, FormField, TextAreaInput } from "@/components/frontoffice/ui";
import { OperationsToolbar, OperationsFilterDrawer } from "@/components/housekeeping/OperationsToolbar";

// Exact sample records (6 Found Items, 3 Lost Complaints, 2 Couriers, 6 Audit Logs)
const SAMPLE_FOUND_ITEMS = [
  { id: "LF-1001", name: "iPhone 15 Pro Max", category: "Electronics", tier: "High Value", location: "Room 305", room: "305", foundBy: "Meena Kumari", storage: "Locker A · Shelf 1", expiry: "18 Oct 26", status: "Stored", brand: "Apple", serial: "F2LX99810", date: "18 Jul 26", guest: "Sarah Chen" },
  { id: "LF-1002", name: "Gold Engagement Ring", category: "Jewelry", tier: "High Value", location: "Room 412", room: "412", foundBy: "Ravi Shankar", storage: "Safe Locker 01", expiry: "18 Oct 26", status: "Under Verification", brand: "Tiffany & Co.", serial: "TIF-9921", date: "18 Jul 26", guest: "Michael Vance" },
  { id: "LF-1003", name: "Leather Wallet & Cash", category: "Cash", tier: "High Value", location: "Lobby Couch", room: "Lobby", foundBy: "Anita Roy", storage: "Safe Locker 02", expiry: "18 Oct 26", status: "Awaiting Claim", brand: "Montblanc", serial: "—", date: "17 Jul 26", guest: "David Miller" },
  { id: "LF-1004", name: "Samsonite Hard Suitcase", category: "Bags", tier: "Standard", location: "Lobby Baggage", room: "Lobby", foundBy: "Rajesh Kumar", storage: "Locker C · Cage 02", expiry: "17 Sep 26", status: "Courier Dispatched", brand: "Samsonite", serial: "SAM-8841", date: "16 Jul 26", guest: "Elena Rostova" },
  { id: "LF-1005", name: "Ray-Ban Aviator Glasses", category: "Accessories", tier: "Standard", location: "Pool Cabana 4", room: "Pool", foundBy: "Pooja Verma", storage: "Locker B · Shelf 2", expiry: "15 Sep 26", status: "Stored", brand: "Ray-Ban", serial: "RB-3025", date: "15 Jul 26", guest: "Unknown" },
  { id: "LF-1006", name: "Prescription Insulin Box", category: "Medicine", tier: "Perishable", location: "Room 108", room: "108", foundBy: "Meena Kumari", storage: "Medical Fridge A", expiry: "21 Jul 26", status: "Stored", brand: "Lantus", serial: "MED-491", date: "19 Jul 26", guest: "Robert Taylor" },
];

const SAMPLE_LOST_COMPLAINTS = [
  { id: "LC-5001", guest: "Sarah Chen", room: "305", lostItem: "Apple Watch Series 9", description: "Midnight Aluminum case left on bedside table.", date: "18 Jul 26", possibleLocation: "Room 305 Bedside", matchedItem: "LF-1001", status: "Matched" },
  { id: "LC-5002", guest: "Michael Vance", room: "412", lostItem: "Diamond Gold Ring", description: "Solitaire ring lost near bathroom vanity.", date: "18 Jul 26", possibleLocation: "Room 412 Bathroom", matchedItem: "LF-1002", status: "Matched" },
  { id: "LC-5003", guest: "Emily Watson", room: "210", lostItem: "Bose QC Earbuds", description: "Black charging case left near desk socket.", date: "17 Jul 26", possibleLocation: "Room 210 Desk", matchedItem: "—", status: "Open Search" },
];

const SAMPLE_COURIER_SHIPMENTS = [
  { id: "CR-901", vendor: "FedEx Express", tracking: "TRK-88492019", receiver: "Elena Rostova", address: "742 Evergreen Terr, OR", dispatchDate: "17 Jul 26", expectedDelivery: "19 Jul 26", charges: "$45.00", paymentMode: "Prepaid", status: "In Transit" },
  { id: "CR-902", vendor: "DHL Express", tracking: "DHL-99102834", receiver: "Alexander Wright", address: "10 Downing St, London", dispatchDate: "16 Jul 26", expectedDelivery: "20 Jul 26", charges: "$85.00", paymentMode: "Billed to Folio", status: "Dispatched" },
];

const SAMPLE_AUDIT_LOGS = [
  { time: "18 Jul 26, 11:15 AM", user: "Ravi Shankar", action: "Item Registered", item: "LF-1002", remarks: "Assigned to Safe Locker 01" },
  { time: "18 Jul 26, 10:30 AM", user: "Meena Kumari", action: "Item Registered", item: "LF-1001", remarks: "Assigned to Locker A · Shelf 1" },
  { time: "17 Jul 26, 04:20 PM", user: "Anita Roy", action: "Owner Verified", item: "LF-1003", remarks: "Guest notified via Phone" },
  { time: "17 Jul 26, 02:00 PM", user: "Rajesh Kumar", action: "Courier Dispatched", item: "LF-1004", remarks: "Tracking TRK-88492019" },
  { time: "16 Jul 26, 05:10 PM", user: "Sanjay Patel", action: "Item Returned", item: "LF-1005", remarks: "Handover signed by guest" },
  { time: "15 Jul 26, 02:10 PM", user: "Pooja Verma", action: "Item Registered", item: "LF-1005", remarks: "Assigned to Locker B · Shelf 2" },
];

export function LostFoundView() {
  const [isMounted, setIsMounted] = useState(false);
  const { lostFound, addLostFoundItem, returnLostFound } = useHousekeeping();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<"found" | "lost" | "courier" | "retention" | "reports" | "audit">("found");

  // Filter States
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [tierFilter, setTierFilter] = useState("All");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (categoryFilter !== "All") count++;
    if (statusFilter !== "All") count++;
    if (tierFilter !== "All") count++;
    return count;
  }, [categoryFilter, statusFilter, tierFilter]);

  const [lostSearch, setLostSearch] = useState("");
  const [lostStatusFilter, setLostStatusFilter] = useState("All");

  // Drawers
  const [createFoundOpen, setCreateFoundOpen] = useState(false);
  const [createLostOpen, setCreateLostOpen] = useState(false);
  const [selectedFoundItem, setSelectedFoundItem] = useState<any | null>(null);

  // Form Fields - Register Found Item
  const [foundName, setFoundName] = useState("");
  const [foundCat, setFoundCat] = useState("Electronics");
  const [foundDesc, setFoundDesc] = useState("");
  const [foundTier, setFoundTier] = useState<"High Value" | "Standard" | "Perishable">("Standard");
  const [foundLoc, setFoundLoc] = useState("");
  const [foundRoom, setFoundRoom] = useState("");
  const [foundByStaff, setFoundByStaff] = useState("");
  const [foundLocker, setFoundLocker] = useState("Locker A · Shelf 1");

  // Form Fields - Register Lost Complaint
  const [lostGuest, setLostGuest] = useState("");
  const [lostRoom, setLostRoom] = useState("");
  const [lostItemName, setLostItemName] = useState("");
  const [lostDesc, setLostDesc] = useState("");

  // Toast
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Found Items
  const foundItemsList = useMemo(() => {
    const contextMapped = lostFound.map((lf) => ({
      id: lf.id,
      name: lf.item,
      category: "General",
      tier: "Standard",
      location: lf.room || "Room 102",
      room: lf.room || "102",
      foundBy: lf.foundBy || "Housekeeping",
      storage: "Locker A · Shelf 1",
      expiry: "30 Sep 26",
      status: lf.status === "Returned" ? "Returned" : "Stored",
      brand: "Generic",
      serial: "—",
      date: lf.foundDate || "18 Jul 26",
      guest: lf.guest || "Unknown",
    }));

    return [...contextMapped, ...SAMPLE_FOUND_ITEMS];
  }, [lostFound]);

  // Filtered Found Items
  const filteredFoundItems = useMemo(() => {
    return foundItemsList.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.id.toLowerCase().includes(search.toLowerCase()) ||
        item.room.toLowerCase().includes(search.toLowerCase()) ||
        item.guest.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === "All" || item.category === categoryFilter;
      const matchStatus = statusFilter === "All" || item.status === statusFilter;
      const matchTier = tierFilter === "All" || item.tier === tierFilter;

      return matchSearch && matchCat && matchStatus && matchTier;
    });
  }, [foundItemsList, search, categoryFilter, statusFilter, tierFilter]);

  // Filtered Lost Complaints
  const filteredLostComplaints = useMemo(() => {
    return SAMPLE_LOST_COMPLAINTS.filter((c) => {
      const matchSearch =
        c.guest.toLowerCase().includes(lostSearch.toLowerCase()) ||
        c.id.toLowerCase().includes(lostSearch.toLowerCase()) ||
        c.lostItem.toLowerCase().includes(lostSearch.toLowerCase()) ||
        c.room.toLowerCase().includes(lostSearch.toLowerCase());
      const matchStatus = lostStatusFilter === "All" || c.status === lostStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [lostSearch, lostStatusFilter]);

  const handleCreateFoundSubmit = () => {
    if (!foundName.trim()) return;
    addLostFoundItem({
      item: foundName,
      guest: "Unknown",
      foundBy: foundByStaff || "Housekeeping Staff",
      room: foundRoom || "Lobby",
      description: foundDesc,
    });
    setCreateFoundOpen(false);
    setFoundName("");
    setFoundLoc("");
    setFoundRoom("");
    setFoundByStaff("");
    setFoundDesc("");
    setToast({ message: `Found item registered!`, variant: "success" });
  };

  const handleCreateLostSubmit = () => {
    if (!lostItemName.trim()) return;
    setCreateLostOpen(false);
    setLostItemName("");
    setLostGuest("");
    setLostRoom("");
    setLostDesc("");
    setToast({ message: `Lost complaint filed!`, variant: "success" });
  };

  const handleReturnItem = (id: string) => {
    returnLostFound(id, selectedFoundItem?.guest || "Guest");
    setSelectedFoundItem(null);
    setToast({ message: `Item ${id} returned & closed!`, variant: "success" });
  };

  const tierBadges: Record<string, string> = {
    "High Value": "bg-red-50 text-red-700 border-red-200 font-extrabold",
    Standard: "bg-blue-50 text-blue-700 border-blue-150 font-bold",
    Perishable: "bg-orange-50 text-orange-700 border-orange-200 font-bold",
  };

  const statusBadges: Record<string, string> = {
    Stored: "bg-slate-100 text-slate-700 border-slate-200",
    "Under Verification": "bg-blue-50 text-blue-750 border-blue-200",
    "Awaiting Claim": "bg-amber-50 text-amber-700 border-amber-200 font-extrabold",
    "Courier Dispatched": "bg-purple-50 text-purple-700 border-purple-200",
    Returned: "bg-green-50 text-green-900 border-green-200 font-extrabold",
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="space-y-4 select-none">
      {/* Header */}
      <div className="flex flex-col gap-2 pb-1 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Operations</span>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Lost & Found Management</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCreateLostOpen(true)}
            variant="outline"
            className="!bg-white hover:!bg-slate-100 !text-slate-750 !border-slate-200 flex items-center justify-center gap-1.5 rounded-xl h-8 px-3 text-xs font-bold shrink-0"
          >
            <AlertCircle className="h-3.5 w-3.5 text-orange-600" /> Log Complaint
          </Button>
          <Button
            onClick={() => setCreateFoundOpen(true)}
            className="!bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white flex items-center justify-center gap-1.5 rounded-xl h-8 px-3 text-xs font-bold shrink-0 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Register Found Item
          </Button>
        </div>
      </div>

      {/* Toast notifier */}
      {toast && (
        <div className={cn(
          "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl p-3 text-xs font-bold shadow-xl animate-in fade-in slide-in-from-bottom-2",
          toast.variant === "success" ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"
        )}>
          <CheckCircle2 className="h-4 w-4" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* 4 Equal-width Summary Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Found Items</p>
            <h3 className="text-lg font-extrabold text-slate-800 leading-tight">{foundItemsList.length}</h3>
          </div>
          <div className="rounded-lg bg-slate-50 p-2 text-slate-600 shrink-0">
            <PackageSearch className="h-4 w-4" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lost Complaints</p>
            <h3 className="text-lg font-extrabold text-slate-800 leading-tight">{SAMPLE_LOST_COMPLAINTS.length}</h3>
          </div>
          <div className="rounded-lg bg-orange-50 p-2 text-orange-600 shrink-0">
            <AlertCircle className="h-4 w-4" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Awaiting Claim</p>
            <h3 className="text-lg font-extrabold text-amber-700 leading-tight">1</h3>
          </div>
          <div className="rounded-lg bg-amber-50 p-2 text-amber-600 shrink-0">
            <Clock className="h-4 w-4" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">High Value</p>
            <h3 className="text-lg font-extrabold text-red-700 leading-tight">3</h3>
          </div>
          <div className="rounded-lg bg-red-50 p-2 text-red-600 shrink-0">
            <Lock className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs with Exact Counts */}
      <div className="border-b border-slate-200">
        <nav className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-wider">
          {[
            { id: "found", label: `Active Found Items (${foundItemsList.length})` },
            { id: "lost", label: `Lost Complaints (${SAMPLE_LOST_COMPLAINTS.length})` },
            { id: "courier", label: `Courier Deliveries (${SAMPLE_COURIER_SHIPMENTS.length})` },
            { id: "retention", label: "Retention & Disposal" },
            { id: "reports", label: "Reports" },
            { id: "audit", label: "Operational Audit Logs" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "pb-2.5 px-0.5 border-b-2 transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "border-emerald-700 text-emerald-755 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* TAB 1: ACTIVE FOUND ITEMS */}
      {activeTab === "found" && (
        <div className="space-y-3">
          {/* Standard Operations Toolbar */}
          <OperationsToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search item name, ID, guest, or room…"
            activeFilterCount={activeFilterCount}
            onOpenFilters={() => setFilterDrawerOpen(true)}
          />

          {/* Slide-over Filter Drawer */}
          <OperationsFilterDrawer
            open={filterDrawerOpen}
            onClose={() => setFilterDrawerOpen(false)}
            title="Filter Found Items"
            activeFilterCount={activeFilterCount}
            onReset={() => {
              setCategoryFilter("All");
              setStatusFilter("All");
              setTierFilter("All");
            }}
          >
            <div className="space-y-4 select-none">
              <FormField label="Category">
                <SelectInput
                  value={categoryFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryFilter(e.target.value)}
                  className="w-full text-xs rounded-xl h-9 bg-white"
                >
                  <option value="All">All Categories</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Jewelry">Jewelry</option>
                  <option value="Cash">Cash</option>
                  <option value="Bags">Bags</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Medicine">Medicine</option>
                </SelectInput>
              </FormField>

              <FormField label="Value Tier">
                <SelectInput
                  value={tierFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTierFilter(e.target.value)}
                  className="w-full text-xs rounded-xl h-9 bg-white"
                >
                  <option value="All">All Value Tiers</option>
                  <option value="High Value">High Value</option>
                  <option value="Standard">Standard</option>
                  <option value="Perishable">Perishable</option>
                </SelectInput>
              </FormField>

              <FormField label="Item Status">
                <SelectInput
                  value={statusFilter}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
                  className="w-full text-xs rounded-xl h-9 bg-white"
                >
                  <option value="All">All Statuses</option>
                  <option value="Stored">Stored</option>
                  <option value="Under Verification">Under Verification</option>
                  <option value="Awaiting Claim">Awaiting Claim</option>
                  <option value="Courier Dispatched">Courier Dispatched</option>
                  <option value="Returned">Returned</option>
                </SelectInput>
              </FormField>
            </div>
          </OperationsFilterDrawer>

          {/* Compact Found Items Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 bg-slate-50 z-10">
                  <th className="px-3 py-2.5">Item ID</th>
                  <th className="px-3 py-2.5">Item Details</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5">Value Tier</th>
                  <th className="px-3 py-2.5">Location</th>
                  <th className="px-3 py-2.5">Found By</th>
                  <th className="px-3 py-2.5">Storage</th>
                  <th className="px-3 py-2.5">Expiry</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="px-3 py-2.5 text-right w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredFoundItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-10 text-slate-400 italic font-medium text-xs">
                      No active found items match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredFoundItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedFoundItem(item)}
                      className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                    >
                      <td className="px-3 py-2.5 text-[11px] font-extrabold text-emerald-800">
                        {item.id}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-extrabold text-slate-800 block">{item.name}</span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">{item.category}</td>
                      <td className="px-3 py-2.5">
                        <span className={cn("rounded px-1.5 py-0.5 text-[8.5px] border uppercase", tierBadges[item.tier] || "bg-slate-50")}>
                          {item.tier}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-800">{item.location}</td>
                      <td className="px-3 py-2.5 text-slate-600">{item.foundBy}</td>
                      <td className="px-3 py-2.5 font-mono text-[10.5px] text-slate-600">{item.storage}</td>
                      <td className="px-3 py-2.5 text-slate-500 font-mono text-[10px]">{item.expiry}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={cn("rounded-full px-2 py-0.5 text-[8.5px] border font-bold uppercase whitespace-nowrap w-24 inline-block text-center", statusBadges[item.status] || "bg-slate-50")}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Button
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFoundItem(item);
                          }}
                          className="h-6 px-1.5 text-[9.5px] font-bold !bg-slate-100 hover:!bg-slate-200 !text-slate-750 !border-slate-200 rounded-md"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: LOST COMPLAINTS */}
      {activeTab === "lost" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <TextInput
                className="pl-8 text-xs rounded-xl h-8"
                placeholder="Search guest or lost item…"
                value={lostSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLostSearch(e.target.value)}
              />
            </div>

            <SelectInput
              className="w-36 text-xs rounded-xl h-8"
              value={lostStatusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLostStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Open Search">Open Search</option>
              <option value="Matched">Matched</option>
              <option value="Resolved">Resolved</option>
            </SelectInput>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 bg-slate-50 z-10">
                  <th className="px-3 py-2.5">Complaint ID</th>
                  <th className="px-3 py-2.5">Guest & Room</th>
                  <th className="px-3 py-2.5">Lost Item</th>
                  <th className="px-3 py-2.5">Description</th>
                  <th className="px-3 py-2.5">Reported Date</th>
                  <th className="px-3 py-2.5">Possible Location</th>
                  <th className="px-3 py-2.5 text-center">Matched Tag</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {filteredLostComplaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 text-[11px] font-extrabold text-orange-700">{c.id}</td>
                    <td className="px-3 py-2.5">
                      <span className="font-extrabold text-slate-800 block">{c.guest} (Rm {c.room})</span>
                    </td>
                    <td className="px-3 py-2.5 font-extrabold text-slate-800">{c.lostItem}</td>
                    <td className="px-3 py-2.5 text-slate-500 max-w-xs truncate">{c.description}</td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{c.date}</td>
                    <td className="px-3 py-2.5 text-slate-600">{c.possibleLocation}</td>
                    <td className="px-3 py-2.5 text-center">
                      {c.matchedItem !== "—" ? (
                        <span className="rounded bg-emerald-50 border border-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 text-[9px]">
                          {c.matchedItem}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[8.5px] border font-bold uppercase w-24 inline-block text-center",
                        c.status === "Matched" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                        c.status === "Resolved" ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-orange-50 text-orange-700 border-orange-200"
                      )}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: COURIER DELIVERIES */}
      {activeTab === "courier" && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 bg-slate-50 z-10">
                  <th className="px-3 py-2.5">Courier Vendor</th>
                  <th className="px-3 py-2.5">Tracking Number</th>
                  <th className="px-3 py-2.5">Receiver Guest</th>
                  <th className="px-3 py-2.5">Shipping Address</th>
                  <th className="px-3 py-2.5">Dispatch Date</th>
                  <th className="px-3 py-2.5">Est. Delivery</th>
                  <th className="px-3 py-2.5 text-center">Charges</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {SAMPLE_COURIER_SHIPMENTS.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 font-extrabold text-slate-800">{shipment.vendor}</td>
                    <td className="px-3 py-2.5 font-mono text-purple-700 font-bold">{shipment.tracking}</td>
                    <td className="px-3 py-2.5 text-slate-800 font-bold">{shipment.receiver}</td>
                    <td className="px-3 py-2.5 text-slate-500 max-w-xs truncate">{shipment.address}</td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{shipment.dispatchDate}</td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{shipment.expectedDelivery}</td>
                    <td className="px-3 py-2.5 text-center font-extrabold text-slate-800">{shipment.charges}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[8.5px] border font-bold uppercase w-24 inline-block text-center",
                        shipment.status === "In Transit" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"
                      )}>
                        {shipment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: RETENTION & DISPOSAL */}
      {activeTab === "retention" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-red-200 bg-red-50/30 p-3">
              <p className="text-[10px] font-extrabold text-red-700 uppercase">Expiring Today</p>
              <h3 className="text-lg font-extrabold text-red-800">1 Item</h3>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-3">
              <p className="text-[10px] font-extrabold text-amber-700 uppercase">Next 7 Days</p>
              <h3 className="text-lg font-extrabold text-amber-800">2 Items</h3>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Expired</p>
              <h3 className="text-lg font-extrabold text-slate-800">3 Items</h3>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Disposed</p>
              <h3 className="text-lg font-extrabold text-slate-800">12 Items</h3>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 bg-slate-50 z-10">
                  <th className="px-3 py-2.5">Item & ID</th>
                  <th className="px-3 py-2.5">Expiry Date</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5">Storage</th>
                  <th className="px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {foundItemsList.slice(0, 3).map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5">
                      <span className="font-extrabold text-slate-800 block">{item.name} ({item.id})</span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{item.expiry}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn(
                        "rounded px-1.5 py-0.5 text-[9px] font-bold",
                        item.expiry === "21 Jul 26" ? "bg-red-50 text-red-700 border border-red-100" : "bg-slate-100 text-slate-700"
                      )}>
                        {item.expiry === "21 Jul 26" ? "Expires Today" : "5 Days Left"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">{item.category}</td>
                    <td className="px-3 py-2.5 font-mono text-[10.5px] text-slate-500">{item.storage}</td>
                    <td className="px-3 py-2.5 text-right">
                      <Button
                        variant="outline"
                        className="h-6 px-2 text-[9.5px] font-bold !bg-red-50 hover:!bg-red-100 !text-red-700 !border-red-100 rounded-md"
                      >
                        Dispose
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: REPORTS & ANALYTICS (Report Cards Only) */}
      {activeTab === "reports" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { title: "Lost & Found Summary", desc: "Overview of cataloged found items, claims, and returns.", icon: FileText },
              { title: "Pending Claims Ledger", desc: "List of open inquiries matching active storage items.", icon: Clock },
              { title: "Returned Items Report", desc: "Handover signatures and guest confirmation records.", icon: CheckCircle2 },
              { title: "Courier Shipping Report", desc: "Outbound shipment tracking and delivery confirmations.", icon: Truck },
              { title: "Retention Expiry Report", desc: "Items reaching policy limits for disposal.", icon: AlertCircle },
            ].map((rep, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-xs">{rep.title}</h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-tight">{rep.desc}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 text-slate-600 shrink-0">
                    <rep.icon className="h-4 w-4" />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="text-[9.5px] font-bold text-emerald-750">Ready</span>
                  <Button variant="outline" className="h-6 px-2 text-[9.5px] font-bold !bg-slate-100 hover:!bg-slate-200 !text-slate-750 !border-slate-200 rounded-md">
                    Export
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: OPERATIONAL AUDIT LOGS */}
      {activeTab === "audit" && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold sticky top-0 bg-slate-50 z-10">
                  <th className="px-3 py-2.5">Timestamp</th>
                  <th className="px-3 py-2.5">User</th>
                  <th className="px-3 py-2.5">Action</th>
                  <th className="px-3 py-2.5">Item</th>
                  <th className="px-3 py-2.5 text-right">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[10.5px] text-slate-700">
                {SAMPLE_AUDIT_LOGS.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap">{log.time}</td>
                    <td className="px-3 py-2.5 text-slate-900 font-sans font-bold">{log.user}</td>
                    <td className="px-3 py-2.5 font-bold text-slate-900">{log.action}</td>
                    <td className="px-3 py-2.5 text-emerald-805 font-bold">{log.item}</td>
                    <td className="px-3 py-2.5 text-right text-slate-500 font-sans">{log.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FOUND ITEM CONSOLE DRAWER */}
      <Drawer
        open={!!selectedFoundItem}
        onClose={() => setSelectedFoundItem(null)}
        title={`${selectedFoundItem?.id || "Item Details"} Movement Console`}
        width="xl"
      >
        {selectedFoundItem && (
          <div className="flex flex-col h-full bg-slate-50/30 select-none">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              
              <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-2xs space-y-2.5">
                <h4 className="font-bold text-slate-855 text-[11px] uppercase tracking-wider border-b border-slate-50 pb-1 flex items-center gap-1.5">
                  <PackageSearch className="h-4 w-4 text-emerald-700" /> Details
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-semibold text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Item Name</span>
                    <span className="text-slate-900 font-extrabold text-[12px]">{selectedFoundItem.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Value Tier</span>
                    <span className={cn("rounded px-1.5 py-0.5 text-[8.5px] border uppercase", tierBadges[selectedFoundItem.tier] || "bg-slate-50")}>
                      {selectedFoundItem.tier}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Found Location</span>
                    <span className="text-slate-800">{selectedFoundItem.location}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Found By</span>
                    <span className="text-slate-800 font-bold">{selectedFoundItem.foundBy}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Storage</span>
                    <span className="text-slate-800 font-mono text-amber-700 font-bold">{selectedFoundItem.storage}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-extrabold">Expiry Date</span>
                    <span className="text-slate-800 font-mono">{selectedFoundItem.expiry}</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-3 flex gap-2 shadow-lg">
              <Button
                variant="outline"
                onClick={() => setSelectedFoundItem(null)}
                className="w-1/2 !bg-slate-100 hover:!bg-slate-200 !text-slate-700 !border-slate-205 flex items-center justify-center text-xs py-2 px-3 font-bold rounded-xl transition-all h-8"
              >
                Close
              </Button>

              {selectedFoundItem.status !== "Returned" && (
                <Button
                  onClick={() => handleReturnItem(selectedFoundItem.id)}
                  className="w-1/2 !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white flex items-center justify-center text-xs py-2 px-3 font-bold rounded-xl transition-all shadow-xs h-8"
                >
                  Handover & Close
                </Button>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* DRAWER: REGISTER FOUND ITEM */}
      <Drawer open={createFoundOpen} onClose={() => setCreateFoundOpen(false)} title="Register Found Item" width="lg">
        <div className="space-y-4 select-none">
          {/* Section 1: Basic Details */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 border-b border-slate-100 pb-1">Basic Details</h4>
            <FormField label="Item Name" required>
              <TextInput
                placeholder="e.g. Sony Wireless Headphones"
                value={foundName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFoundName(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Category" required>
                <SelectInput
                  value={foundCat}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFoundCat(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-white text-slate-700 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 select-none"
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Jewelry">Jewelry</option>
                  <option value="Cash">Cash</option>
                  <option value="Bags">Bags</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Medicine">Medicine</option>
                </SelectInput>
              </FormField>

              <FormField label="Value Tier" required>
                <SelectInput
                  value={foundTier}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFoundTier(e.target.value as any)}
                  className="h-9 text-xs rounded-xl bg-white text-slate-700 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 select-none"
                >
                  <option value="Standard">Standard</option>
                  <option value="High Value">High Value</option>
                  <option value="Perishable">Perishable</option>
                </SelectInput>
              </FormField>
            </div>
          </div>

          {/* Section 2: Location & Staff */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 border-b border-slate-100 pb-1">Location & Staff</h4>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Found Location" required>
                <TextInput
                  placeholder="e.g. Room 305 or Poolside"
                  value={foundLoc}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFoundLoc(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </FormField>
              <FormField label="Room Number" required>
                <TextInput
                  placeholder="e.g. 305"
                  value={foundRoom}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFoundRoom(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </FormField>
            </div>

            <FormField label="Found By Staff" required>
              <TextInput
                placeholder="e.g. Meena Kumari"
                value={foundByStaff}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFoundByStaff(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </FormField>
          </div>

          {/* Section 3: Storage & Remarks */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 border-b border-slate-100 pb-1">Storage & Remarks</h4>
            <FormField label="Storage Locker Location" required>
              <SelectInput
                value={foundLocker}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFoundLocker(e.target.value)}
                className="h-9 text-xs rounded-xl bg-white text-slate-700 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300 select-none"
              >
                <option value="Locker A · Shelf 1">Locker A · Shelf 1</option>
                <option value="Locker B · Shelf 2">Locker B · Shelf 2</option>
                <option value="Safe Locker 01">Safe Locker 01</option>
                <option value="Medical Fridge A">Medical Fridge A</option>
              </SelectInput>
            </FormField>

            <FormField label="Remarks">
              <TextAreaInput
                placeholder="e.g. Black headphones found near desk socket."
                value={foundDesc}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFoundDesc(e.target.value)}
                className="text-xs rounded-xl min-h-[70px]"
              />
            </FormField>
          </div>

          <Button
            onClick={handleCreateFoundSubmit}
            className="w-full !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white font-bold rounded-xl shadow-xs h-11 text-xs transition-all mt-4"
          >
            Register Found Item
          </Button>
        </div>
      </Drawer>

      {/* DRAWER: REGISTER LOST COMPLAINT */}
      <Drawer open={createLostOpen} onClose={() => setCreateLostOpen(false)} title="Register Guest Lost Complaint">
        <div className="space-y-3 select-none">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Guest Name" required>
              <TextInput placeholder="e.g. Emily Watson" value={lostGuest} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLostGuest(e.target.value)} />
            </FormField>
            <FormField label="Room Number" required>
              <TextInput placeholder="e.g. 210" value={lostRoom} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLostRoom(e.target.value)} />
            </FormField>
          </div>

          <FormField label="Lost Item Name" required>
            <TextInput placeholder="e.g. Bose QuietComfort Earbuds" value={lostItemName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLostItemName(e.target.value)} />
          </FormField>

          <FormField label="Complaint Notes">
            <TextAreaInput
              placeholder="e.g. Misplaced near desk charging socket before departure."
              value={lostDesc}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setLostDesc(e.target.value)}
            />
          </FormField>

          <Button
            onClick={handleCreateLostSubmit}
            className="w-full !bg-[#0F8A5F] hover:!bg-[#0d7d56] text-white font-bold py-2 rounded-xl transition-all shadow-xs h-9"
          >
            File Lost Item Complaint
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
