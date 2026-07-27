"use client";

import Link from "next/link";
import { ArrowRight, Boxes } from "lucide-react";
import { ModulePageShell } from "@/components/pms";
import { Button } from "@/components/ui/Button";

const links = [
  { label: "Stock Ledger", href: "/purchase-stores/inventory/ledger", hint: "All stock movements" },
  { label: "Warehouses", href: "/purchase-stores/inventory/warehouses", hint: "Stores & bins" },
  { label: "Batch & Expiry", href: "/purchase-stores/inventory/batch-fefo", hint: "FEFO control" },
];

export default function InventoryIndexPage() {
  return (
    <ModulePageShell
      eyebrow="Purchase & Stores"
      title="Inventory"
      description="Choose a stock workspace to continue."
      wrapChildren={false}
    >
      <div className="grid gap-2 sm:grid-cols-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 transition hover:border-emerald-300 hover:bg-emerald-50/40"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <Boxes className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{link.label}</p>
              <p className="text-[11px] text-slate-500">{link.hint}</p>
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </Link>
        ))}
      </div>
      <div className="mt-4">
        <Link href="/purchase-stores/inventory/ledger">
          <Button type="button" size="sm">
            Open stock ledger
          </Button>
        </Link>
      </div>
    </ModulePageShell>
  );
}
