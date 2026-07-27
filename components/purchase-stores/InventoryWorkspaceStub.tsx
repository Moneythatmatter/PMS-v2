"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, ArrowRightLeft, ArrowUpRight, SlidersHorizontal, Trash2, Truck } from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button } from "@/components/ui/Button";

type Props = {
  title: string;
  description: string;
  icon: LucideIcon;
  primaryHref?: string;
  primaryLabel?: string;
};

export function InventoryWorkspaceStub({
  title,
  description,
  icon: Icon,
  primaryHref = "/purchase-stores/inventory/ledger",
  primaryLabel = "Go to stock ledger",
}: Props) {
  return (
    <ModulePageShell eyebrow="Inventory" title={title} description={description} wrapChildren={false}>
      <section className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="mt-3 text-base font-semibold text-slate-900">{title}</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
          This workspace is ready in navigation. Use the stock ledger and warehouses for day-to-day inventory
          work while this screen is completed.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Link href={primaryHref}>
            <Button type="button" size="sm">
              {primaryLabel}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
          <Link href="/purchase-stores/inventory/warehouses">
            <Button type="button" size="sm" variant="outline">
              Warehouses
            </Button>
          </Link>
        </div>
      </section>
    </ModulePageShell>
  );
}

export const inventoryStubIcons = {
  issues: ArrowUpRight,
  transfers: ArrowRightLeft,
  scrap: Trash2,
  parStock: SlidersHorizontal,
  gatePass: Truck,
};
