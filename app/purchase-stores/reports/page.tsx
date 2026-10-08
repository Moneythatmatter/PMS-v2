import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  FileText,
  RotateCcw,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { FOPageHeader } from "@/components/frontoffice/ui";

type ReportCard = {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
  tone: string;
  highlights: string[];
};

const GROUPS: { title: string; subtitle: string; reports: ReportCard[] }[] = [
  {
    title: "Inventory",
    subtitle: "Stock position, valuation and losses",
    reports: [
      {
        title: "Stock Register",
        href: "/purchase-stores/reports/stock-register",
        description: "Opening, receipts, issues and closing stock with valuation per item and warehouse.",
        icon: FileText,
        tone: "bg-emerald-50 text-emerald-700 ring-emerald-100",
        highlights: ["Closing value", "Below reorder", "Out of stock"],
      },
      {
        title: "Par Stock",
        href: "/purchase-stores/reports/par-stock",
        description: "On-hand stock against par, min and max levels with suggested reorder quantities.",
        icon: SlidersHorizontal,
        tone: "bg-sky-50 text-sky-700 ring-sky-100",
        highlights: ["Critical items", "Shortfall", "Suggested order"],
      },
      {
        title: "Spoilage & Write-offs",
        href: "/purchase-stores/reports/spoilage",
        description: "Stock lost to expiry, damage and count variances, valued at average cost.",
        icon: AlertTriangle,
        tone: "bg-red-50 text-red-600 ring-red-100",
        highlights: ["Loss value", "Expired vs damaged", "Top items"],
      },
      {
        title: "Issue Register",
        href: "/purchase-stores/reports/issues",
        description: "Stock issued to departments — consumption by department, store and item.",
        icon: ArrowUpRight,
        tone: "bg-violet-50 text-violet-700 ring-violet-100",
        highlights: ["Consumption value", "By department", "Top items"],
      },
    ],
  },
  {
    title: "Procurement",
    subtitle: "Spend, orders and supplier performance",
    reports: [
      {
        title: "Purchase Register",
        href: "/purchase-stores/reports/purchases",
        description: "Committed spend across purchase orders and direct purchases, with GST.",
        icon: ShoppingBag,
        tone: "bg-amber-50 text-amber-700 ring-amber-100",
        highlights: ["Total spend", "By vendor", "Monthly trend"],
      },
      {
        title: "Purchase Order Status",
        href: "/purchase-stores/reports/orders",
        description: "Delivery progress for every PO against GRNs — overdue and open commitments.",
        icon: ShoppingCart,
        tone: "bg-blue-50 text-blue-700 ring-blue-100",
        highlights: ["Fulfilment rate", "Overdue POs", "Open value"],
      },
      {
        title: "Vendor Returns",
        href: "/purchase-stores/reports/returns",
        description: "Goods returned after quality inspection — by supplier, reason and settlement.",
        icon: RotateCcw,
        tone: "bg-rose-50 text-rose-600 ring-rose-100",
        highlights: ["Return value", "By reason", "Open returns"],
      },
    ],
  },
];

export default function PurchaseStoresReportsPage() {
  return (
    <div className="space-y-6">
      <FOPageHeader
        eyebrow="Purchase & Stores"
        title="Reports"
        description="Operational and financial reports for stores and procurement. Every report supports period filters, analytics and CSV / Excel / PDF export."
      />

      {GROUPS.map((group) => (
        <section key={group.title} className="space-y-3">
          <div className="flex items-baseline gap-3">
            <h2 className="text-sm font-semibold text-slate-900">{group.title}</h2>
            <p className="text-xs text-slate-500">{group.subtitle}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {group.reports.map((r) => {
              const Icon = r.icon;
              return (
                <Link
                  key={r.href}
                  href={r.href}
                  className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${r.tone}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-600" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-slate-900">{r.title}</h3>
                  <p className="mt-1 flex-1 text-xs leading-5 text-slate-500">{r.description}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {r.highlights.map((h) => (
                      <span key={h} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                        {h}
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
