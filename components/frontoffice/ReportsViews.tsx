"use client";

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
import type { ReportDefinition } from "@/app/data/frontoffice/reports";
import { reportDefinitions, reportStatusClass } from "@/app/data/frontoffice/reports";
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

function ReportListView({ definition }: { definition: ReportDefinition }) {
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
  return <ReportListView definition={reportDefinitions.arrival} />;
}

export function DepartureReportView() {
  return <ReportListView definition={reportDefinitions.departure} />;
}

export function OccupancyReportView() {
  return <ReportListView definition={reportDefinitions.occupancy} />;
}

export function RevenueReportView() {
  return <ReportListView definition={reportDefinitions.revenue} />;
}

export function CashierReportView() {
  return <ReportListView definition={reportDefinitions.cashier} />;
}

export function NightAuditReportView() {
  return <NightAuditView />;
}

export function GuestReportView() {
  return <ReportListView definition={reportDefinitions.guest} />;
}

export function RoomReportView() {
  return <ReportListView definition={reportDefinitions.room} />;
}

export function TaxReportView() {
  return <ReportListView definition={reportDefinitions.tax} />;
}
