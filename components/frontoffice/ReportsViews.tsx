"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  BedDouble,
  CalendarCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  DoorOpen,
  Globe,
  LogOut,
  Percent,
  Receipt,
  RotateCcw,
  Star,
  TrendingUp,
  UserCheck,
  Users,
  UtensilsCrossed,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { ReportDefinition, ReportId } from "@/app/data/frontoffice/reports";
import { reportDefinitions, reportStatusClass } from "@/app/data/frontoffice/reports";
import { reportService } from "@/services/front-office";
import { ReportCharts } from "@/components/frontoffice/ReportCharts";
import { NightAuditView } from "@/components/frontoffice/NightAuditView";
import { ModuleListPage, type ModuleListDefinition } from "@/components/pms";

const REPORT_STAT_ICONS: Record<string, LucideIcon[]> = {
  arrival: [CalendarCheck, CheckCircle2, BedDouble, Star],
  departure: [LogOut, CheckCircle2, AlertCircle, Wallet],
  occupancy: [BedDouble, DoorOpen, Wrench, TrendingUp],
  revenue: [TrendingUp, BedDouble, UtensilsCrossed, Receipt],
  cashier: [Wallet, Banknote, CreditCard, RotateCcw],
  "night-audit": [Clock, Receipt, AlertTriangle, CheckCircle2],
  guest: [Users, Globe, Globe, UserCheck],
  room: [DoorOpen, BedDouble, CheckCircle2, AlertTriangle],
  tax: [Receipt, Percent, Percent, Wallet],
};

function toModuleDefinition(definition: ReportDefinition): ModuleListDefinition {
  const icons = REPORT_STAT_ICONS[definition.id] ?? [Receipt, Receipt, Receipt, Receipt];
  return {
    title: definition.title,
    description: definition.description,
    eyebrow: "Front Office · Reports",
    stats: definition.stats.map((stat, i) => ({
      ...stat,
      icon: icons[i],
    })),
    columns: definition.columns,
    rows: definition.rows,
    searchPlaceholder: definition.searchPlaceholder,
    filterOptions: definition.filterOptions,
    sortOptions: definition.sortOptions,
    filterKeys: [
      "status",
      "band",
      "group",
      "shift",
      "nationality",
      "segment",
      "housekeeping",
    ],
  };
}

function ReportListView({ type }: { type: ReportId }) {
  const base = reportDefinitions[type];
  const [definition, setDefinition] = useState<ReportDefinition>(base);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await reportService.get(type);
        if (!cancelled) {
          const apiRows = (data.rows as ReportDefinition["rows"]) ?? [];
          setDefinition({
            ...base,
            rows: apiRows.map((row, index) => ({
              ...row,
              id:
                row.id ||
                String(
                  (row as { bookingId?: string }).bookingId ||
                    (row as { room?: string }).room ||
                    (row as { metric?: string }).metric ||
                    `report-${type}-${index}`,
                ),
            })),
          });
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [type, base]);

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  const statusMap: Record<string, string> = {};
  for (const row of definition.rows) {
    if (row.status) statusMap[String(row.status)] = reportStatusClass(String(row.status));
    if (row.band) statusMap[String(row.band)] = reportStatusClass(String(row.band));
  }

  return (
    <ModuleListPage
      definition={toModuleDefinition(definition)}
      charts={
        definition.charts.length > 0 ? <ReportCharts charts={definition.charts} /> : undefined
      }
      statusMap={statusMap}
    />
  );
}

export function DailyArrivalReportView() {
  return <ReportListView type="arrival" />;
}

export function DepartureReportView() {
  return <ReportListView type="departure" />;
}

export function OccupancyReportView() {
  return <ReportListView type="occupancy" />;
}

export function RevenueReportView() {
  return <ReportListView type="revenue" />;
}

export function CashierReportView() {
  return <ReportListView type="cashier" />;
}

export function NightAuditReportView() {
  return <NightAuditView />;
}

export function GuestReportView() {
  return <ReportListView type="guest" />;
}

export function RoomReportView() {
  return <ReportListView type="room" />;
}

export function TaxReportView() {
  return <ReportListView type="tax" />;
}
