"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Loader2,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Shirt,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Truck,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import { useHousekeeping } from "@/components/housekeeping/HousekeepingContext";
import type {
  HKLaundryJob,
  HKLaundryLineItem,
  LaundryUrgency,
} from "@/components/housekeeping/HousekeepingTypes";
import {
  calculateSurcharge,
  calculateTax,
  LAUNDRY_GST_RATE,
  roundMoney,
} from "@/components/housekeeping/actions/laundry/pricing";
import {
  printLaundryKotDocument,
  type LaundryKotData,
} from "@/lib/housekeeping/print-laundry-kot";
import { roomService, type RoomDto } from "@/services/front-office/rooms";
import { reservationService } from "@/services/front-office/reservations";
import type { ReservationBooking } from "@/app/data/types";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/frontoffice/ui/Drawer";
import {
  FormField,
  SelectInput,
  TextAreaInput,
  TextInput,
} from "@/components/frontoffice/ui";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  LAUNDRY_SERVICE_TYPES,
  type LaundryItemMaster,
  type LaundryPricingMaster,
} from "@/app/data/housekeeping/masters";
import { laundryItemMasterService } from "@/services/housekeeping/laundry-items-master";
import { laundryPricingMasterService } from "@/services/housekeeping/laundry-pricing-master";

const CHECKED_IN_STATUSES = ["Checked In", "In-House"] as const;

type StatusPill =
  | "all"
  | "pending"
  | "in_progress"
  | "ready"
  | "delivered"
  | "delayed"
  | "cancelled";

type FormLine = {
  key: string;
  name: string;
  serviceType: string;
  qty: string;
  unitPrice: string;
};

const formatINR = (amount: number) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function formatFriendlyDate(value?: string | null): string {
  if (!value) return "—";
  if (/today|yesterday/i.test(value) && !value.includes("T")) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = Math.round(
    (startToday.getTime() - startThat.getTime()) / (24 * 60 * 60 * 1000),
  );
  const time = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  if (dayDiff === 0) return `Today, ${time}`;
  if (dayDiff === 1) return `Yesterday, ${time}`;
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function defaultExpectedAt(urgency: LaundryUrgency): string {
  const d = new Date();
  if (urgency === "Express") d.setHours(d.getHours() + 4);
  else if (urgency === "Same-Day") d.setHours(18, 0, 0, 0);
  else {
    d.setDate(d.getDate() + 1);
    d.setHours(18, 0, 0, 0);
  }
  return d.toISOString();
}

function toDatetimeLocalValue(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function isIronOnly(serviceType?: string) {
  const s = (serviceType ?? "").toLowerCase();
  return s.includes("iron") && !s.includes("wash") && !s.includes("dry");
}

function displayStage(status: HKLaundryJob["status"]): string {
  if (status === "Collection") return "Pending";
  return status;
}

function stageBadgeClass(status: HKLaundryJob["status"]) {
  switch (status) {
    case "Collection":
      return "bg-amber-50 text-amber-800 border-amber-100";
    case "Washing":
    case "Ironing":
      return "bg-orange-50 text-orange-800 border-orange-100";
    case "Ready":
      return "bg-emerald-50 text-emerald-800 border-emerald-100";
    case "Delivered":
      return "bg-sky-50 text-sky-800 border-sky-100";
    default:
      return "bg-slate-50 text-slate-700 border-slate-100";
  }
}

function isDelayed(job: HKLaundryJob): boolean {
  if (job.cancelled || job.status === "Delivered") return false;
  if (!job.expectedAt) return false;
  const expected = new Date(job.expectedAt).getTime();
  return !Number.isNaN(expected) && expected < Date.now();
}

function primaryService(job: HKLaundryJob): string {
  if (job.serviceType) return job.serviceType;
  const fromLines = job.lineItems?.[0]?.serviceType;
  if (fromLines) return fromLines;
  return "Laundry";
}

function itemsSummary(job: HKLaundryJob): string {
  if (job.lineItems?.length) {
    return job.lineItems
      .map((li) => `${li.name} x ${li.qty} (${li.serviceType})`)
      .join(", ");
  }
  return job.item;
}

function nextStatus(job: HKLaundryJob): HKLaundryJob["status"] | null {
  if (job.cancelled || job.status === "Delivered") return null;
  if (job.status === "Collection") {
    return isIronOnly(primaryService(job)) ? "Ironing" : "Washing";
  }
  if (job.status === "Washing") return "Ironing";
  if (job.status === "Ironing") return "Ready";
  if (job.status === "Ready") return "Delivered";
  return null;
}

function nextActionLabel(job: HKLaundryJob): string | null {
  const next = nextStatus(job);
  if (!next) return null;
  if (job.status === "Collection") return "Mark as Collected";
  if (next === "Ironing") return "Move to Ironing";
  if (next === "Ready") return "Mark as Ready";
  if (next === "Delivered") return "Mark as Delivered";
  return `Move to ${next}`;
}

function guestFlowSteps(job: HKLaundryJob): string[] {
  if (isIronOnly(primaryService(job))) {
    return ["Pending", "Collected", "Ironing", "Ready", "Delivered"];
  }
  return ["Pending", "Collected", "Washing", "Ironing", "Ready", "Delivered"];
}

function guestFlowIndex(job: HKLaundryJob): number {
  const steps = guestFlowSteps(job);
  if (job.status === "Collection") return 0;
  if (job.status === "Washing") {
    const washingIdx = steps.indexOf("Washing");
    return washingIdx >= 0 ? washingIdx : 1;
  }
  if (job.status === "Ironing") return steps.indexOf("Ironing");
  if (job.status === "Ready") return steps.indexOf("Ready");
  if (job.status === "Delivered") return steps.indexOf("Delivered");
  return 0;
}

function newFormLine(partial?: Partial<FormLine>): FormLine {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: partial?.name ?? "",
    serviceType: partial?.serviceType ?? "",
    qty: partial?.qty ?? "1",
    unitPrice: partial?.unitPrice ?? "",
  };
}

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass,
  active,
  onClick,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border bg-white p-4 text-left shadow-sm transition-all",
        active
          ? "border-emerald-300 ring-2 ring-emerald-100"
          : "border-slate-200 hover:border-slate-300",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">{subtitle}</p>
        </div>
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            iconClass,
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </button>
  );
}

export function GuestLaundryView() {
  const { laundryJobs, addLaundryJob, updateLaundryStatus, cancelLaundryJob, settleLaundryJob } =
    useHousekeeping();

  const guestJobs = useMemo(
    () => laundryJobs.filter((j) => j.type === "Guest"),
    [laundryJobs],
  );

  const [search, setSearch] = useState("");
  const [statusPill, setStatusPill] = useState<StatusPill>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [urgencyFilter, setUrgencyFilter] = useState("All");
  const [billingFilter, setBillingFilter] = useState("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  // Create form
  const [checkedInRooms, setCheckedInRooms] = useState<RoomDto[]>([]);
  const [roomBookings, setRoomBookings] = useState<Map<string, ReservationBooking>>(
    new Map(),
  );
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [urgency, setUrgency] = useState<LaundryUrgency | "">("");
  const [expectedAt, setExpectedAt] = useState("");
  const [lines, setLines] = useState<FormLine[]>([newFormLine()]);
  const [remarks, setRemarks] = useState("");
  const [catalogItems, setCatalogItems] = useState<LaundryItemMaster[]>([]);
  const [catalogPricing, setCatalogPricing] = useState<LaundryPricingMaster[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [settleMode, setSettleMode] = useState("Cash");
  const [settleAmount, setSettleAmount] = useState("");
  const [settling, setSettling] = useState(false);

  const priceByItemService = useMemo(() => {
    const map = new Map<string, number>();
    const itemById = new Map(catalogItems.map((i) => [i.id, i]));
    for (const row of catalogPricing) {
      if (row.isActive === false) continue;
      const item = itemById.get(row.itemId);
      const name = (item?.name ?? row.itemName ?? "").trim().toLowerCase();
      if (!name) continue;
      map.set(`${name}::${row.serviceType}`, Number(row.unitPrice) || 0);
    }
    return map;
  }, [catalogItems, catalogPricing]);

  const quickGarments = useMemo(() => {
    const active = catalogItems.filter((i) => i.isActive !== false);
    return active.map((item) => {
      const iron = priceByItemService.get(`${item.name.toLowerCase()}::Ironing`);
      const anyPrice = [...priceByItemService.entries()].find(([k]) =>
        k.startsWith(`${item.name.toLowerCase()}::`),
      )?.[1];
      return {
        name: item.name,
        unitPrice: iron ?? anyPrice ?? 0,
        defaultService: iron != null ? "Ironing" : LAUNDRY_SERVICE_TYPES[0],
      };
    });
  }, [catalogItems, priceByItemService]);

  const resolvePrice = useCallback(
    (itemName: string, serviceType: string) => {
      const key = `${itemName.trim().toLowerCase()}::${serviceType}`;
      return priceByItemService.get(key);
    },
    [priceByItemService],
  );

  const selectedJob = useMemo(
    () => guestJobs.find((j) => j.id === selectedId) ?? null,
    [guestJobs, selectedId],
  );

  useEffect(() => {
    if (!selectedJob) return;
    setSettleMode("Cash");
    setSettleAmount(String(selectedJob.charges ?? ""));
  }, [selectedJob?.id, selectedJob?.charges]);

  const handleSettle = () => {
    if (!selectedJob) return;
    if (selectedJob.status !== "Delivered") {
      toast.error("Mark the order Delivered before settling");
      return;
    }
    if ((selectedJob.billingStatus ?? "Unbilled") !== "Unbilled") {
      toast.info(`Already ${selectedJob.billingStatus}`);
      return;
    }
    const isFolio = /room\s*charge|folio/i.test(settleMode);
    if (isFolio && !selectedJob.bookingId) {
      toast.error("Folio charge needs a linked in-house booking on this order");
      return;
    }
    if (!isFolio) {
      const amt = Number(settleAmount);
      if (!(amt > 0)) {
        toast.error("Enter amount received");
        return;
      }
    }
    setSettling(true);
    try {
      settleLaundryJob(selectedJob.id, settleMode);
      toast.success(
        isFolio
          ? `${selectedJob.id} charged to guest folio`
          : `${selectedJob.id} settled at counter (${settleMode})`,
      );
    } finally {
      setSettling(false);
    }
  };

  const selectedStay = useMemo(() => {
    if (!selectedRoomId) return null;
    const room = checkedInRooms.find((r) => r.id === selectedRoomId);
    const booking = roomBookings.get(selectedRoomId);
    if (!room) return null;
    return {
      room,
      booking,
      guestName: booking?.guestName ?? "Guest",
      folioId: `fol-${room.roomNo}`,
      phone: booking?.phone ?? "",
      bookingId: booking?.id,
    };
  }, [selectedRoomId, checkedInRooms, roomBookings]);

  const kpis = useMemo(() => {
    const total = guestJobs.filter((j) => !j.cancelled).length;
    const pending = guestJobs.filter(
      (j) => !j.cancelled && j.status === "Collection",
    ).length;
    const ready = guestJobs.filter(
      (j) => !j.cancelled && j.status === "Ready",
    ).length;
    const active = guestJobs.filter(
      (j) =>
        !j.cancelled &&
        (j.status === "Washing" || j.status === "Ironing"),
    ).length;
    const delayed = guestJobs.filter(isDelayed).length;
    return { total, pending, ready, active, delayed };
  }, [guestJobs]);

  const counts = useMemo(() => {
    const active = guestJobs.filter((j) => !j.cancelled);
    return {
      all: active.length,
      pending: active.filter((j) => j.status === "Collection").length,
      in_progress: active.filter(
        (j) => j.status === "Washing" || j.status === "Ironing",
      ).length,
      ready: active.filter((j) => j.status === "Ready").length,
      delivered: active.filter((j) => j.status === "Delivered").length,
      delayed: guestJobs.filter(isDelayed).length,
      cancelled: guestJobs.filter((j) => j.cancelled).length,
    };
  }, [guestJobs]);

  const filtered = useMemo(() => {
    let rows = [...guestJobs];
    if (statusPill === "pending") {
      rows = rows.filter((j) => !j.cancelled && j.status === "Collection");
    } else if (statusPill === "in_progress") {
      rows = rows.filter(
        (j) =>
          !j.cancelled &&
          (j.status === "Washing" || j.status === "Ironing"),
      );
    } else if (statusPill === "ready") {
      rows = rows.filter((j) => !j.cancelled && j.status === "Ready");
    } else if (statusPill === "delivered") {
      rows = rows.filter((j) => !j.cancelled && j.status === "Delivered");
    } else if (statusPill === "delayed") {
      rows = rows.filter(isDelayed);
    } else if (statusPill === "cancelled") {
      rows = rows.filter((j) => j.cancelled);
    } else {
      rows = rows.filter((j) => !j.cancelled);
    }

    if (urgencyFilter !== "All") {
      rows = rows.filter((j) => (j.urgency ?? "Normal") === urgencyFilter);
    }
    if (billingFilter !== "All") {
      rows = rows.filter(
        (j) => (j.billingStatus ?? "Unbilled") === billingFilter,
      );
    }

    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((j) => {
        const hay = [
          j.id,
          j.guestName,
          j.room,
          j.item,
          j.serviceType,
          itemsSummary(j),
          j.folioId,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    return rows.sort((a, b) => {
      const aMs = Date.parse(String(a.createdAt ?? a.timeline.collectedAt ?? "")) || 0;
      const bMs = Date.parse(String(b.createdAt ?? b.timeline.collectedAt ?? "")) || 0;
      return bMs - aMs;
    });
  }, [guestJobs, statusPill, search, urgencyFilter, billingFilter]);

  const pricing = useMemo(() => {
    let base = 0;
    for (const line of lines) {
      const qty = Number(line.qty) || 0;
      const unit = Number(line.unitPrice) || 0;
      base += qty * unit;
    }
    const urgencyRate: LaundryUrgency = urgency || "Normal";
    const surcharged = calculateSurcharge(base, urgencyRate);
    const tax = calculateTax(surcharged, LAUNDRY_GST_RATE);
    const total = roundMoney(surcharged + tax);
    return {
      subtotal: roundMoney(surcharged),
      tax,
      total,
      base: roundMoney(base),
    };
  }, [lines, urgency]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("hk_laundry_items_master_v1");
      window.localStorage.removeItem("hk_laundry_pricing_master_v1");
    }
    let cancelled = false;
    setCatalogLoading(true);
    void Promise.all([
      laundryItemMasterService.list(),
      laundryPricingMasterService.list(),
    ])
      .then(([items, pricing]) => {
        if (cancelled) return;
        setCatalogItems(Array.isArray(items) ? items : []);
        setCatalogPricing(Array.isArray(pricing) ? pricing : []);
      })
      .catch((err) => {
        console.error("[HK] Failed to load laundry masters", err);
        if (!cancelled) {
          setCatalogItems([]);
          setCatalogPricing([]);
        }
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!createOpen) return;
    let cancelled = false;
    setLoadingRooms(true);
    void Promise.all([
      roomService.list(),
      ...CHECKED_IN_STATUSES.map((status) =>
        reservationService.list(status).catch(() => [] as ReservationBooking[]),
      ),
    ])
      .then(([allRooms, ...bookingGroups]) => {
        if (cancelled) return;
        const bookings = bookingGroups
          .flat()
          .filter(
            (booking, index, list) =>
              list.findIndex((item) => item.id === booking.id) === index,
          );
        const bookingByRoomKey = new Map<string, ReservationBooking>();
        for (const booking of bookings) {
          if (booking.roomRefId) bookingByRoomKey.set(booking.roomRefId, booking);
          if (booking.roomNo) bookingByRoomKey.set(booking.roomNo, booking);
        }
        const occupied = allRooms
          .filter(
            (room) =>
              bookingByRoomKey.has(room.id) ||
              (room.roomNo ? bookingByRoomKey.has(room.roomNo) : false),
          )
          .sort((a, b) => a.roomNo.localeCompare(b.roomNo));
        const byRoomId = new Map<string, ReservationBooking>();
        for (const room of occupied) {
          const booking =
            bookingByRoomKey.get(room.id) ??
            (room.roomNo ? bookingByRoomKey.get(room.roomNo) : undefined);
          if (booking) byRoomId.set(room.id, booking);
        }
        setCheckedInRooms(occupied);
        setRoomBookings(byRoomId);
      })
      .catch(() => {
        if (!cancelled) {
          setCheckedInRooms([]);
          setRoomBookings(new Map());
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingRooms(false);
      });
    return () => {
      cancelled = true;
    };
  }, [createOpen]);

  useEffect(() => {
    if (!urgency) return;
    setExpectedAt(toDatetimeLocalValue(defaultExpectedAt(urgency)));
  }, [urgency]);

  const resetFilters = useCallback(() => {
    setSearch("");
    setStatusPill("all");
    setUrgencyFilter("All");
    setBillingFilter("All");
    setFilterOpen(false);
    toast.info("Filters reset");
  }, []);

  const resetCreateForm = () => {
    setSelectedRoomId("");
    setUrgency("");
    setExpectedAt("");
    setLines([newFormLine()]);
    setRemarks("");
  };

  const openCreate = () => {
    resetCreateForm();
    setCreateOpen(true);
  };

  const handleQuickAdd = (garment: {
    name: string;
    unitPrice: number;
    defaultService: string;
  }) => {
    setLines((prev) => [
      ...prev,
      newFormLine({
        name: garment.name,
        serviceType: garment.defaultService,
        qty: "1",
        unitPrice: String(garment.unitPrice),
      }),
    ]);
  };

  const updateLine = (idx: number, patch: Partial<FormLine>) => {
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== idx) return l;
        const next = { ...l, ...patch };
        if (patch.name != null || patch.serviceType != null) {
          const priced = resolvePrice(next.name, next.serviceType);
          if (priced != null) next.unitPrice = String(priced);
        }
        return next;
      }),
    );
  };

  const handleCreate = () => {
    if (!selectedStay) {
      toast.error("Select an active guest stay");
      return;
    }
    if (!urgency) {
      toast.error("Select service speed / urgency");
      return;
    }
    if (!expectedAt) {
      toast.error("Expected delivery is required");
      return;
    }
    const validLines = lines
      .map((l) => ({
        name: l.name.trim(),
        serviceType: l.serviceType.trim(),
        qty: Number(l.qty) || 0,
        unitPrice: Number(l.unitPrice) || 0,
      }))
      .filter((l) => l.name && l.serviceType && l.qty > 0 && l.unitPrice >= 0);

    if (validLines.length === 0) {
      toast.error("Add at least one garment item with service and price");
      return;
    }

    const lineItems: HKLaundryLineItem[] = validLines;
    const qty = lineItems.reduce((s, l) => s + l.qty, 0);
    const serviceType =
      lineItems.length === 1
        ? lineItems[0].serviceType
        : Array.from(new Set(lineItems.map((l) => l.serviceType))).join(" + ");
    const item = lineItems
      .map((l) => `${l.name} x ${l.qty} (${l.serviceType})`)
      .join(", ");

    addLaundryJob({
      type: "Guest",
      item,
      quantity: qty,
      room: selectedStay.room.roomNo,
      guestName: selectedStay.guestName,
      guestPhone: selectedStay.phone || undefined,
      folioId: selectedStay.folioId,
      bookingId: selectedStay.bookingId,
      charges: pricing.total,
      subtotal: pricing.subtotal,
      taxAmount: pricing.tax,
      urgency,
      serviceType,
      expectedAt: fromDatetimeLocalValue(expectedAt),
      createdAt: new Date().toISOString(),
      billingStatus: "Unbilled",
      isOutsourced: false,
      lineItems,
      notes: remarks.trim() || undefined,
    });

    const kot: LaundryKotData = {
      jobId: `LND-${1000 + laundryJobs.length + 1}`,
      type: "Guest",
      item,
      quantity: qty,
      room: selectedStay.room.roomNo,
      guestName: selectedStay.guestName,
      serviceType,
      urgency,
      washBatch: "Colors",
      careLabel: "Normal Cotton",
      isOutsourced: false,
      charges: pricing.total,
      baseCharges: pricing.subtotal,
      notes: remarks.trim() || undefined,
      createdAt: new Date().toLocaleString("en-IN"),
    };
    void printLaundryKotDocument(kot);

    setCreateOpen(false);
    resetCreateForm();
    toast.success("Laundry order booked");
  };

  const handleAdvance = (job: HKLaundryJob, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const next = nextStatus(job);
    if (!next) return;
    updateLaundryStatus(job.id, next);
    toast.success(`${job.id} → ${displayStage(next)}`);
  };

  const handleCancel = (job: HKLaundryJob) => {
    if (job.cancelled || job.status === "Delivered") return;
    cancelLaundryJob(job.id);
    setSelectedId(null);
    toast.success(`${job.id} cancelled`);
  };

  const handlePrint = async (job: HKLaundryJob) => {
    setPrinting(true);
    const kot: LaundryKotData = {
      jobId: job.id,
      type: "Guest",
      item: job.item,
      quantity: job.quantity,
      room: job.room,
      guestName: job.guestName,
      serviceType: primaryService(job),
      urgency: job.urgency ?? "Normal",
      washBatch: "Colors",
      careLabel: "Normal Cotton",
      isOutsourced: job.isOutsourced,
      charges: job.charges,
      baseCharges: job.subtotal,
      notes: job.notes,
      createdAt: formatFriendlyDate(job.createdAt ?? job.timeline.collectedAt),
    };
    try {
      const ok = await printLaundryKotDocument(kot);
      toast[ok ? "success" : "error"](ok ? "Slip sent to print" : "Unable to print slip");
    } finally {
      setPrinting(false);
    }
  };

  const pills: { id: StatusPill; label: string; count: number; alert?: boolean }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "pending", label: "Pending", count: counts.pending },
    { id: "in_progress", label: "In Progress", count: counts.in_progress },
    { id: "ready", label: "Ready", count: counts.ready },
    { id: "delivered", label: "Delivered", count: counts.delivered },
    { id: "delayed", label: "Delayed Alerts", count: counts.delayed, alert: true },
    { id: "cancelled", label: "Cancelled", count: counts.cancelled },
  ];

  const detailSteps = selectedJob ? guestFlowSteps(selectedJob) : [];
  const detailStepIdx = selectedJob ? guestFlowIndex(selectedJob) : 0;
  const detailNext = selectedJob ? nextStatus(selectedJob) : null;
  const detailNextLabel = selectedJob ? nextActionLabel(selectedJob) : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-medium text-slate-400">Housekeeping / Laundry</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Guest Laundry
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage guest laundry requests and process through dynamic workflows.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={resetFilters}
            className="h-10 gap-1.5 rounded-xl border-slate-200 bg-white text-slate-700"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
          <Button
            type="button"
            onClick={openCreate}
            className="h-10 gap-1.5 rounded-xl !bg-[#0B6B4F] px-4 text-white hover:!bg-[#095a43]"
          >
            <Plus className="h-4 w-4" />
            New Order
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          title="Total Orders"
          value={kpis.total}
          subtitle="All logged laundry tickets"
          icon={Shirt}
          iconClass="bg-emerald-50 text-emerald-700"
          active={statusPill === "all"}
          onClick={() => setStatusPill("all")}
        />
        <KPICard
          title="Pending Pickup"
          value={kpis.pending}
          subtitle="Awaiting room collection"
          icon={Clock}
          iconClass="bg-amber-50 text-amber-700"
          active={statusPill === "pending"}
          onClick={() => setStatusPill(statusPill === "pending" ? "all" : "pending")}
        />
        <KPICard
          title="Ready for Delivery"
          value={kpis.ready}
          subtitle="Packaged for room drop-off"
          icon={Sparkles}
          iconClass="bg-teal-50 text-teal-700"
          active={statusPill === "ready"}
          onClick={() => setStatusPill(statusPill === "ready" ? "all" : "ready")}
        />
        <KPICard
          title="Active Processing"
          value={kpis.active}
          subtitle="Washing, Ironing & Dry Clean"
          icon={Truck}
          iconClass="bg-sky-50 text-sky-700"
          active={statusPill === "in_progress"}
          onClick={() =>
            setStatusPill(statusPill === "in_progress" ? "all" : "in_progress")
          }
        />
      </div>

      {/* Delayed alert */}
      {kpis.delayed > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-amber-900">
            <span className="mr-1">⚠️</span>
            <strong>
              {kpis.delayed} laundry order{kpis.delayed === 1 ? "" : "s"}{" "}
              {kpis.delayed === 1 ? "is" : "are"} delayed
            </strong>{" "}
            past the target delivery time.
          </p>
          <button
            type="button"
            onClick={() => setStatusPill("delayed")}
            className="text-sm font-semibold text-amber-900 hover:underline"
          >
            View Delayed Orders →
          </button>
        </div>
      )}

      {/* Search + pills */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order#, guest, room, item, service..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none ring-emerald-600/20 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4"
            />
          </div>
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className={cn(
              "inline-flex h-11 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium",
              filterOpen || urgencyFilter !== "All" || billingFilter !== "All"
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
        </div>

        {filterOpen && (
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2">
            <FormField label="Urgency">
              <SelectInput
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Normal">Normal</option>
                <option value="Same-Day">Same-Day</option>
                <option value="Express">Express</option>
              </SelectInput>
            </FormField>
            <FormField label="Billing">
              <SelectInput
                value={billingFilter}
                onChange={(e) => setBillingFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Unbilled">Unbilled</option>
                <option value="Folio">Folio</option>
                <option value="Settled">Settled</option>
              </SelectInput>
            </FormField>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {pills.map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setStatusPill(pill.id)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                statusPill === pill.id
                  ? "bg-[#0B6B4F] text-white"
                  : pill.alert
                    ? "bg-red-50 text-red-700 hover:bg-red-100"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {pill.alert ? "⚠️ " : ""}
              {pill.label} ({pill.count})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Guest & Room</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Items & Services</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Expected</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Billing</th>
                <th className="px-4 py-3 text-right">Next Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-16 text-center text-sm text-slate-400"
                  >
                    No laundry orders match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((job) => {
                  const action = nextActionLabel(job);
                  const delayed = isDelayed(job);
                  return (
                    <tr
                      key={job.id}
                      onClick={() => setSelectedId(job.id)}
                      className="cursor-pointer border-t border-slate-50 transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3.5 align-top">
                        <p className="font-semibold text-slate-900">{job.id}</p>
                        <p className="text-[11px] text-slate-400">
                          {formatFriendlyDate(job.createdAt ?? job.timeline.collectedAt)}
                        </p>
                        {job.urgency && job.urgency !== "Normal" && (
                          <span
                            className={cn(
                              "mt-1 inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                              job.urgency === "Express"
                                ? "bg-red-50 text-red-700"
                                : "bg-orange-50 text-orange-700",
                            )}
                          >
                            {job.urgency}
                          </span>
                        )}
                        {delayed && (
                          <span className="ml-1 mt-1 inline-flex rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                            Delayed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <p className="font-semibold text-slate-900">
                          {job.guestName ?? "Guest"}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Room {job.room ?? "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 align-top text-slate-700">
                        {primaryService(job)}
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <p className="font-medium text-slate-800">
                          {job.quantity} item{job.quantity === 1 ? "" : "s"}
                        </p>
                        <p className="max-w-[220px] truncate text-[11px] text-slate-500">
                          {itemsSummary(job)}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                            stageBadgeClass(job.status),
                          )}
                        >
                          {job.status === "Delivered" ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : job.status === "Collection" ? (
                            <Clock className="h-3 w-3" />
                          ) : (
                            <Shirt className="h-3 w-3" />
                          )}
                          {displayStage(job.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-top text-slate-600">
                        {formatFriendlyDate(job.expectedAt)}
                      </td>
                      <td className="px-4 py-3.5 align-top font-semibold text-slate-900">
                        {formatINR(job.charges)}
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        {(job.billingStatus ?? "Unbilled") === "Folio" ||
                        job.billingStatus === "Settled" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                            <Check className="h-3 w-3" />
                            Folio
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            Unbilled
                          </span>
                        )}
                      </td>
                      <td
                        className="px-4 py-3.5 align-top text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {action ? (
                          <button
                            type="button"
                            onClick={(e) => handleAdvance(job, e)}
                            className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-[#0B6B4F] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#095a43]"
                          >
                            {action}
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create order drawer */}
      <Drawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        width="xl"
        title="Book Laundry Pipeline Job"
        description="Create guest laundry order with per-item services & live pricing"
      >
        <div className="space-y-5 pb-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Select Active Guest Stay" required>
              <SelectInput
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                disabled={loadingRooms}
              >
                <option value="">
                  {loadingRooms ? "Loading stays…" : "Select room / guest"}
                </option>
                {checkedInRooms.map((room) => {
                  const booking = roomBookings.get(room.id);
                  const name = booking?.guestName ?? "Guest";
                  return (
                    <option key={room.id} value={room.id}>
                      Room {room.roomNo} — {name}
                    </option>
                  );
                })}
              </SelectInput>
            </FormField>
            <FormField label="Assigned Room & Folio">
              <div className="flex h-10 items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm">
                <span className="font-semibold text-slate-800">
                  {selectedStay ? `Room ${selectedStay.room.roomNo}` : "—"}
                </span>
                <span className="text-xs text-slate-500">
                  Folio:{" "}
                  {selectedStay ? `#${selectedStay.folioId}` : "—"}
                </span>
              </div>
            </FormField>
            <FormField label="Service Speed / Urgency" required>
              <SelectInput
                value={urgency}
                onChange={(e) =>
                  setUrgency(e.target.value as LaundryUrgency | "")
                }
              >
                <option value="">Select urgency</option>
                <option value="Normal">Normal (Standard rate)</option>
                <option value="Same-Day">Same-Day (+25% surcharge)</option>
                <option value="Express">Express (+55% surcharge)</option>
              </SelectInput>
            </FormField>
            <FormField label="Expected Delivery" required>
              <TextInput
                type="datetime-local"
                value={expectedAt}
                onChange={(e) => setExpectedAt(e.target.value)}
              />
            </FormField>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                <Shirt className="h-4 w-4" />
                Garment Items & Service Mapping
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quickGarments.map((g) => (
                  <button
                    key={g.name}
                    type="button"
                    onClick={() => handleQuickAdd(g)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                  >
                    + {g.name}
                  </button>
                ))}
              </div>
            </div>

            {catalogLoading ? (
              <p className="py-6 text-center text-sm text-slate-400">
                Loading items from master…
              </p>
            ) : catalogItems.length === 0 ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                No laundry items in the database yet. Add them under{" "}
                <a
                  href="/housekeeping/masters/laundry-items"
                  className="font-semibold underline"
                >
                  Laundry Item Master
                </a>{" "}
                and set prices in{" "}
                <a
                  href="/housekeeping/masters/laundry-pricing"
                  className="font-semibold underline"
                >
                  Laundry Pricing Master
                </a>
                .
              </p>
            ) : null}

            <div className="space-y-2">
              {lines.map((line, idx) => {
                const rowTotal =
                  (Number(line.qty) || 0) * (Number(line.unitPrice) || 0);
                return (
                  <div
                    key={line.key}
                    className="grid grid-cols-12 items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-2"
                  >
                    <div className="col-span-12 sm:col-span-3">
                      <SelectInput
                        value={
                          catalogItems.some(
                            (i) =>
                              i.isActive !== false &&
                              i.name.toLowerCase() === line.name.toLowerCase(),
                          )
                            ? catalogItems.find(
                                (i) =>
                                  i.isActive !== false &&
                                  i.name.toLowerCase() ===
                                    line.name.toLowerCase(),
                              )?.name ?? line.name
                            : line.name
                        }
                        onChange={(e) =>
                          updateLine(idx, { name: e.target.value })
                        }
                      >
                        <option value="">Select item</option>
                        {!catalogItems.some(
                          (i) =>
                            i.isActive !== false &&
                            i.name.toLowerCase() === line.name.toLowerCase(),
                        ) &&
                          line.name && (
                            <option value={line.name}>{line.name}</option>
                          )}
                        {catalogItems
                          .filter((i) => i.isActive !== false)
                          .map((item) => (
                            <option key={item.id} value={item.name}>
                              {item.name}
                            </option>
                          ))}
                      </SelectInput>
                    </div>
                    <div className="col-span-6 sm:col-span-3">
                      <SelectInput
                        value={line.serviceType}
                        onChange={(e) =>
                          updateLine(idx, { serviceType: e.target.value })
                        }
                      >
                        <option value="">Select service</option>
                        {LAUNDRY_SERVICE_TYPES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </SelectInput>
                    </div>
                    <div className="col-span-3 sm:col-span-1">
                      <TextInput
                        type="number"
                        min="1"
                        value={line.qty}
                        onChange={(e) =>
                          updateLine(idx, { qty: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      <TextInput
                        type="number"
                        min="0"
                        value={line.unitPrice}
                        onChange={(e) =>
                          updateLine(idx, { unitPrice: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-span-10 flex items-center justify-end sm:col-span-2">
                      <span className="text-sm font-bold text-slate-900">
                        {formatINR(rowTotal)}
                      </span>
                    </div>
                    <div className="col-span-2 flex justify-end sm:col-span-1">
                      <button
                        type="button"
                        disabled={lines.length <= 1}
                        onClick={() =>
                          setLines((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setLines((prev) => [...prev, newFormLine()])}
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
            >
              <Plus className="h-4 w-4" />
              Add Another Item
            </button>

            <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Items Base Subtotal</span>
                <span>{formatINR(pricing.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST Tax ({Math.round(LAUNDRY_GST_RATE * 100)}%)</span>
                <span>{formatINR(pricing.tax)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold">
                <span className="text-slate-900">Estimated Total Charges</span>
                <span className="text-emerald-700">{formatINR(pricing.total)}</span>
              </div>
            </div>
          </div>

          <FormField label="Remarks / Special Handling">
            <TextAreaInput
              rows={3}
              placeholder="e.g. Iron cuffs flat, return on wood hangers, check pockets for loose cards."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </FormField>

          <Button
            type="button"
            onClick={handleCreate}
            className="h-12 w-full rounded-xl !bg-[#0B6B4F] text-sm font-semibold text-white hover:!bg-[#095a43]"
          >
            Confirm & Book Laundry Order ({formatINR(pricing.total)})
          </Button>
        </div>
      </Drawer>

      {/* Detail drawer */}
      <Drawer
        open={Boolean(selectedJob)}
        onClose={() => setSelectedId(null)}
        width="lg"
        title={selectedJob ? `Order ${selectedJob.id}` : "Order"}
        description={
          selectedJob
            ? `${selectedJob.guestName ?? "Guest"} • Room ${selectedJob.room ?? "—"}`
            : undefined
        }
        footer={
          selectedJob ? (
            <div className="flex w-full items-center justify-between gap-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5 border-red-200 text-red-700 hover:bg-red-50"
                  disabled={
                    selectedJob.cancelled || selectedJob.status === "Delivered"
                  }
                  onClick={() => handleCancel(selectedJob)}
                >
                  <XCircle className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5"
                  disabled={printing}
                  onClick={() => void handlePrint(selectedJob)}
                >
                  {printing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Printer className="h-4 w-4" />
                  )}
                  Print Slip
                </Button>
              </div>
              <Button
                type="button"
                onClick={() => setSelectedId(null)}
                className="rounded-xl !bg-slate-800 text-white hover:!bg-slate-900"
              >
                Close
              </Button>
            </div>
          ) : undefined
        }
      >
        {selectedJob && (
          <div className="space-y-5 pb-2">
            {/* Stepper */}
            <div className="overflow-x-auto">
              <div className="flex min-w-[420px] items-center gap-1">
                {detailSteps.map((step, idx) => {
                  const done = idx < detailStepIdx;
                  const active = idx === detailStepIdx;
                  return (
                    <React.Fragment key={step}>
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold",
                            done || active
                              ? "bg-[#0B6B4F] text-white"
                              : "bg-slate-100 text-slate-400",
                          )}
                        >
                          {done ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-semibold",
                            active ? "text-emerald-800" : "text-slate-400",
                          )}
                        >
                          {step}
                        </span>
                      </div>
                      {idx < detailSteps.length - 1 && (
                        <div
                          className={cn(
                            "mb-4 h-0.5 flex-1 rounded",
                            idx < detailStepIdx ? "bg-emerald-600" : "bg-slate-200",
                          )}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {detailNext && detailNextLabel && (
              <div className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-700">
                  Next:{" "}
                  <strong className="text-slate-900">
                    {displayStage(detailNext) === "Washing" ||
                    (selectedJob.status === "Collection" &&
                      detailNext !== "Ironing")
                      ? "Collected"
                      : displayStage(detailNext)}
                  </strong>
                </p>
                <button
                  type="button"
                  onClick={() => handleAdvance(selectedJob)}
                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#0B6B4F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#095a43]"
                >
                  {detailNextLabel}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Guest
                </p>
                <p className="mt-1 flex items-center gap-1.5 font-semibold text-slate-900">
                  <User className="h-4 w-4 text-slate-400" />
                  {selectedJob.guestName ?? "Guest"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {selectedJob.guestPhone ?? "—"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Room & Folio
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  Room {selectedJob.room ?? "—"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  #{selectedJob.folioId ?? `fol-${selectedJob.room ?? "—"}`}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">
                  Garment Items ({selectedJob.quantity})
                </p>
                <p className="text-[11px] font-medium text-slate-400">
                  Service Type
                </p>
              </div>
              <div className="space-y-3">
                {(selectedJob.lineItems?.length
                  ? selectedJob.lineItems
                  : [
                      {
                        name: selectedJob.item,
                        serviceType: primaryService(selectedJob),
                        qty: selectedJob.quantity,
                        unitPrice:
                          selectedJob.quantity > 0
                            ? roundMoney(
                                (selectedJob.subtotal ?? selectedJob.charges) /
                                  selectedJob.quantity,
                              )
                            : selectedJob.charges,
                      },
                    ]
                ).map((li, i) => (
                  <div
                    key={`${li.name}-${i}`}
                    className="flex items-start justify-between gap-3 border-b border-slate-50 pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {li.name} x {li.qty}
                      </p>
                      <p className="text-xs text-slate-500">{li.serviceType}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        {formatINR(li.qty * li.unitPrice)}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        @ {formatINR(li.unitPrice)}/pc
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>
                    {formatINR(
                      selectedJob.subtotal ??
                        roundMoney(selectedJob.charges / (1 + LAUNDRY_GST_RATE)),
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST</span>
                  <span>
                    {formatINR(
                      selectedJob.taxAmount ??
                        roundMoney(
                          selectedJob.charges -
                            selectedJob.charges / (1 + LAUNDRY_GST_RATE),
                        ),
                    )}
                  </span>
                </div>
                <div className="flex justify-between pt-1 text-base font-bold">
                  <span>Total</span>
                  <span className="text-emerald-700">
                    {formatINR(selectedJob.charges)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <CreditCard className="h-4 w-4 text-slate-400" />
                  Payment & Settlement
                </p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    (selectedJob.billingStatus ?? "Unbilled") === "Unbilled"
                      ? "bg-slate-100 text-slate-600"
                      : "bg-emerald-50 text-emerald-800",
                  )}
                >
                  {selectedJob.billingStatus ?? "Unbilled"}
                </span>
              </div>

              {selectedJob.status !== "Delivered" ? (
                <p className="text-xs leading-relaxed text-slate-500">
                  Payment options (Folio charge or Counter settlement) become
                  available once the order is marked Delivered.
                </p>
              ) : (selectedJob.billingStatus ?? "Unbilled") !== "Unbilled" ? (
                <div className="rounded-lg bg-emerald-50/80 px-3 py-2 text-xs text-emerald-900">
                  Settled via{" "}
                  <strong>{selectedJob.paymentMode ?? selectedJob.billingStatus}</strong>
                  {(selectedJob.billingStatus ?? "") === "Folio"
                    ? " — charge is on the guest folio until hotel checkout."
                    : " — paid at counter."}
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    How would you like to settle this bill?
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Cash", "Card", "UPI"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setSettleMode(mode)}
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-sm font-semibold transition",
                          settleMode === mode
                            ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100"
                            : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300",
                        )}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>

                  {selectedJob.bookingId ? (
                    <button
                      type="button"
                      onClick={() => setSettleMode("Room Charge")}
                      className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition",
                        settleMode === "Room Charge"
                          ? "border-emerald-700 bg-emerald-700 text-white ring-2 ring-emerald-200"
                          : "border-slate-300 bg-white text-slate-800 hover:border-emerald-400",
                      )}
                    >
                      <Wallet className="h-4 w-4" />
                      Room Charge (Folio)
                    </button>
                  ) : (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                      No linked booking — folio Room Charge unavailable. Settle
                      at counter with Cash / Card / UPI.
                    </p>
                  )}

                  {settleMode === "Room Charge" ? (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      The laundry bill will be marked settled. The charge posts to
                      the guest folio and remains outstanding until hotel checkout.
                    </p>
                  ) : (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Amount received
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={settleAmount}
                        onChange={(e) => setSettleAmount(e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 px-3 font-mono text-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2"
                      />
                    </div>
                  )}

                  <Button
                    type="button"
                    className="w-full !bg-[#0B6B4F] hover:!bg-[#095a43]"
                    disabled={settling}
                    onClick={handleSettle}
                  >
                    {settling ? (
                      "Settling…"
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Confirm Settlement ({formatINR(selectedJob.charges)})
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-slate-800">
                Activity History
              </p>
              <div className="relative space-y-4 border-l-2 border-slate-100 pl-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Order Created & Awaiting Collection
                  </p>
                  <p className="text-[11px] text-slate-500">
                    By Front Desk Staff ·{" "}
                    {formatFriendlyDate(
                      selectedJob.createdAt ?? selectedJob.timeline.collectedAt,
                    )}
                  </p>
                </div>
                {selectedJob.timeline.washedAt && (
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Collected / Processing Started
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {selectedJob.timeline.washedAt}
                    </p>
                  </div>
                )}
                {selectedJob.timeline.readyAt && (
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Marked Ready for Delivery
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {selectedJob.timeline.readyAt}
                    </p>
                  </div>
                )}
                {selectedJob.timeline.deliveredAt && (
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Delivered to Room
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {selectedJob.timeline.deliveredAt}
                    </p>
                  </div>
                )}
                {selectedJob.notes && (
                  <div>
                    <p className="text-sm font-medium text-slate-900">Remarks</p>
                    <p className="text-[11px] text-slate-500">{selectedJob.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
