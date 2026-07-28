import { accountsNavItems } from "@/app/data/navigation/accounts";
import { AccountsDashboardView } from "@/components/accounts/AccountsDashboardView";
import { GLTransactionView } from "@/components/accounts/GLTransactionView";
import { ChevronRight, FolderOpen } from "lucide-react";

function findNavLabel(slugPath: string): { title: string; category?: string } {
  if (!slugPath) return { title: "Dashboard" };
  const fullPath = `/accounts/${slugPath}`;

  for (const item of accountsNavItems) {
    if (item.href === fullPath) {
      return { title: item.label };
    }
    if (item.children) {
      for (const child of item.children) {
        if (child.href === fullPath) {
          return { title: child.label, category: item.label };
        }
      }
    }
  }

  const parts = slugPath.split("/").filter(Boolean);
  if (parts.length === 0) return { title: "Dashboard" };
  const lastPart = parts[parts.length - 1];
  const formattedTitle = lastPart
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const category =
    parts.length > 1
      ? parts[0]
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
      : undefined;

  return { title: formattedTitle, category };
}

export default async function AccountsPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const resolvedParams = await params;
  const slugArray = resolvedParams.slug || [];
  const slugPath = slugArray.join("/");

  if (!slugPath || slugPath === "dashboard") {
    return <AccountsDashboardView />;
  }

  if (slugPath === "transactions/gl-transaction") {
    return <GLTransactionView />;
  }

  const { title, category } = findNavLabel(slugPath);

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <span>Accounts</span>
            {category && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span>{category}</span>
              </>
            )}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {title}
          </h1>
        </div>
      </div>

      {/* Empty State Card matching Front Office UI style */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4 ring-8 ring-emerald-50/50">
            <FolderOpen className="h-7 w-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            {title}
          </h3>
          <p className="mt-1.5 text-sm text-slate-500 max-w-md">
            This module view is initialized in Accounts. No data has been filled.
          </p>
        </div>
      </div>
    </div>
  );
}
