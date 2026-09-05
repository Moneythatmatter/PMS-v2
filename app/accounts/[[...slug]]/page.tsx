import { accountsNavItems } from "@/app/data/navigation/accounts";
import { AccountsDashboardView } from "@/components/accounts/AccountsDashboardView";
import { GLTransactionView } from "@/components/accounts/GLTransactionView";
import { TrialBalanceView } from "@/components/accounts/TrialBalanceView";
import { ProfitLossView } from "@/components/accounts/ProfitLossView";
import { GeneralLedgerView } from "@/components/accounts/GeneralLedgerView";
import { GLReceiptsPaymentsView } from "@/components/accounts/GLReceiptsPaymentsView";
import { ProvisionalTransactionsView } from "@/components/accounts/ProvisionalTransactionsView";
import { BankReconciliationView } from "@/components/accounts/BankReconciliationView";
import { BankReconciliationReversingView } from "@/components/accounts/BankReconciliationReversingView";
import { ClosingStockView } from "@/components/accounts/ClosingStockView";
import { FiscalPeriodClosingView } from "@/components/accounts/FiscalPeriodClosingView";
import { FiscalPeriodClosingReversingView } from "@/components/accounts/FiscalPeriodClosingReversingView";
import { ReprintVoucherView } from "@/components/accounts/ReprintVoucherView";
import { OutstandingBillsAgingView } from "@/components/accounts/OutstandingBillsAgingView";
import { OutstandingAgingSummaryView } from "@/components/accounts/OutstandingAgingSummaryView";
import { OutstandingBillsAgingCustomView } from "@/components/accounts/OutstandingBillsAgingCustomView";
import { OutstandingAgingSummaryCustomView } from "@/components/accounts/OutstandingAgingSummaryCustomView";
import { PartyBillsSettlementView } from "@/components/accounts/PartyBillsSettlementView";
import { PartyBillsView } from "@/components/accounts/PartyBillsView";
import { ReminderLetterView } from "@/components/accounts/ReminderLetterView";
import { BalanceConfirmationView } from "@/components/accounts/BalanceConfirmationView";
import { PaymentAdviceView } from "@/components/accounts/PaymentAdviceView";
import { BillCoveringLetterView } from "@/components/accounts/BillCoveringLetterView";
import { BillCoveringLetterReversalView } from "@/components/accounts/BillCoveringLetterReversalView";
import { BillCoveringLetterPrintView } from "@/components/accounts/BillCoveringLetterPrintView";
import { ChartOfAccountsView } from "@/components/accounts/ChartOfAccountsView";
import { PartyMasterView } from "@/components/accounts/PartyMasterView";
import { CompanyCreationView } from "@/components/accounts/CompanyCreationView";
import { CompanySettingsView } from "@/components/accounts/CompanySettingsView";
import { FiscalYearView } from "@/components/accounts/FiscalYearView";
import { VoucherTypeView } from "@/components/accounts/VoucherTypeView";
import { CurrencyMasterView } from "@/components/accounts/CurrencyMasterView";
import { PartyTypeMasterView } from "@/components/accounts/PartyTypeMasterView";
import { PartySubTypeMasterView } from "@/components/accounts/PartySubTypeMasterView";
import { DivisionMasterView } from "@/components/accounts/DivisionMasterView";
import { FinancialAnalysisView } from "@/components/accounts/FinancialAnalysisView";
import { BalanceSheetView } from "@/components/accounts/BalanceSheetView";
import { DayBookView } from "@/components/accounts/DayBookView";
import { PaymentMethodMasterView } from "@/components/accounts/PaymentMethodMasterView";
import { RevenueCategoryMasterView } from "@/components/accounts/RevenueCategoryMasterView";
import { TaxGstMasterView } from "@/components/accounts/TaxGstMasterView";
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

  if (
    slugPath === "transactions/gl-receipts-payments" ||
    slugPath === "gl-receipts-payments"
  ) {
    return <GLReceiptsPaymentsView />;
  }

  if (
    slugPath === "transactions/provisional-transactions" ||
    slugPath === "provisional-transactions"
  ) {
    return <ProvisionalTransactionsView />;
  }

  if (
    slugPath === "transactions/bank-reconciliation" ||
    slugPath === "bank-reconciliation"
  ) {
    return <BankReconciliationView />;
  }

  if (
    slugPath === "transactions/bank-reconciliation-reversing" ||
    slugPath === "bank-reconciliation-reversing"
  ) {
    return <BankReconciliationReversingView />;
  }

  if (
    slugPath === "transactions/closing-stock" ||
    slugPath === "closing-stock"
  ) {
    return <ClosingStockView />;
  }

  if (
    slugPath === "transactions/fiscal-period-closing" ||
    slugPath === "fiscal-period-closing"
  ) {
    return <FiscalPeriodClosingView />;
  }

  if (
    slugPath === "transactions/fiscal-period-closing-reversing" ||
    slugPath === "fiscal-period-closing-reversing"
  ) {
    return <FiscalPeriodClosingReversingView />;
  }

  if (
    slugPath === "transactions/reprint-voucher" ||
    slugPath === "reprint-voucher"
  ) {
    return <ReprintVoucherView />;
  }

  if (
    slugPath === "party-outstanding/bills-aging" ||
    slugPath === "party-outstanding/outstanding-bills-aging" ||
    slugPath === "bills-aging" ||
    slugPath === "outstanding-bills-aging"
  ) {
    return <OutstandingBillsAgingView />;
  }

  if (
    slugPath === "party-outstanding/bills-aging-custom" ||
    slugPath === "party-outstanding/outstanding-bills-aging-custom" ||
    slugPath === "bills-aging-custom" ||
    slugPath === "outstanding-bills-aging-custom"
  ) {
    return <OutstandingBillsAgingCustomView />;
  }

  if (
    slugPath === "party-outstanding/aging-summary" ||
    slugPath === "party-outstanding/outstanding-aging-summary" ||
    slugPath === "aging-summary" ||
    slugPath === "outstanding-aging-summary"
  ) {
    return <OutstandingAgingSummaryView />;
  }

  if (
    slugPath === "party-outstanding/aging-summary-custom" ||
    slugPath === "party-outstanding/outstanding-aging-summary-custom" ||
    slugPath === "aging-summary-custom" ||
    slugPath === "outstanding-aging-summary-custom"
  ) {
    return <OutstandingAgingSummaryCustomView />;
  }

  if (
    slugPath === "party-outstanding/bills-and-settlement" ||
    slugPath === "party-outstanding/party-bills-settlement" ||
    slugPath === "bills-and-settlement" ||
    slugPath === "party-bills-settlement"
  ) {
    return <PartyBillsSettlementView />;
  }

  if (
    slugPath === "party-outstanding/party-bills" ||
    slugPath === "party-bills" ||
    slugPath === "bills"
  ) {
    return <PartyBillsView />;
  }

  if (
    slugPath === "party-outstanding/reminder-letter" ||
    slugPath === "reminder-letter" ||
    slugPath === "reminder"
  ) {
    return <ReminderLetterView />;
  }

  if (
    slugPath === "party-outstanding/balance-confirmation" ||
    slugPath === "balance-confirmation" ||
    slugPath === "confirmation"
  ) {
    return <BalanceConfirmationView />;
  }

  if (
    slugPath === "party-outstanding/payment-advice" ||
    slugPath === "payment-advice" ||
    slugPath === "advice"
  ) {
    return <PaymentAdviceView />;
  }

  if (
    slugPath === "party-outstanding/bill-covering-letter" ||
    slugPath === "bill-covering-letter" ||
    slugPath === "covering-letter"
  ) {
    return <BillCoveringLetterView />;
  }

  if (
    slugPath === "party-outstanding/bill-covering-letter-reversal" ||
    slugPath === "bill-covering-letter-reversal" ||
    slugPath === "covering-letter-reversal" ||
    slugPath === "reversal"
  ) {
    return <BillCoveringLetterReversalView />;
  }

  if (
    slugPath === "party-outstanding/bill-covering-letter-print" ||
    slugPath === "bill-covering-letter-print" ||
    slugPath === "covering-letter-print text" ||
    slugPath === "covering-letter-print"
  ) {
    return <BillCoveringLetterPrintView />;
  }

  if (
    slugPath === "masters/chart-of-accounts" ||
    slugPath === "chart-of-accounts" ||
    slugPath === "coa"
  ) {
    return <ChartOfAccountsView />;
  }

  if (
    slugPath === "masters/party-master" ||
    slugPath === "party-master" ||
    slugPath === "party"
  ) {
    return <PartyMasterView />;
  }

  if (
    slugPath === "masters/company-creation" ||
    slugPath === "company-creation" ||
    slugPath === "company"
  ) {
    return <CompanyCreationView />;
  }

  if (
    slugPath === "masters/company-settings" ||
    slugPath === "company-settings" ||
    slugPath === "settings"
  ) {
    return <CompanySettingsView />;
  }

  if (
    slugPath === "masters/fiscal-year" ||
    slugPath === "fiscal-year" ||
    slugPath === "masters/next-fiscal-year-creation" ||
    slugPath === "next-fiscal-year-creation" ||
    slugPath === "fiscal-year-creation" ||
    slugPath === "next-fy" ||
    slugPath === "masters/fiscal-year-closing" ||
    slugPath === "fiscal-year-closing font" ||
    slugPath === "fiscal-year-closing" ||
    slugPath === "masters/closed-fiscal-year-reversing" ||
    slugPath === "closed-fiscal-year-reversing" ||
    slugPath === "closed-fy-reversing"
  ) {
    return <FiscalYearView />;
  }

  if (
    slugPath === "masters/voucher-type" ||
    slugPath === "voucher-type" ||
    slugPath === "vouchertype"
  ) {
    return <VoucherTypeView />;
  }

  if (
    slugPath === "masters/currency" ||
    slugPath === "currency" ||
    slugPath === "currencies"
  ) {
    return <CurrencyMasterView />;
  }

  if (
    slugPath === "masters/party-type" ||
    slugPath === "party-type" ||
    slugPath === "partytype"
  ) {
    return <PartyTypeMasterView />;
  }

  if (
    slugPath === "masters/party-sub-type" ||
    slugPath === "party-sub-type" ||
    slugPath === "partysubtype"
  ) {
    return <PartySubTypeMasterView />;
  }

  if (
    slugPath === "masters/division" ||
    slugPath === "division" ||
    slugPath === "divisions"
  ) {
    return <DivisionMasterView />;
  }

  if (
    slugPath === "masters" ||
    slugPath === "masters/index" ||
    slugPath === "masters-directory"
  ) {
    return <ChartOfAccountsView />;
  }

  if (
    slugPath === "masters/tax-gst" ||
    slugPath === "masters/tax-gst-master" ||
    slugPath === "tax-gst" ||
    slugPath === "tax-gst-master"
  ) {
    return <TaxGstMasterView />;
  }

  if (
    slugPath === "masters/payment-methods" ||
    slugPath === "masters/payment-method-master" ||
    slugPath === "payment-methods" ||
    slugPath === "payment-method-master"
  ) {
    return <PaymentMethodMasterView />;
  }

  if (
    slugPath === "masters/revenue-categories" ||
    slugPath === "masters/revenue-category-master" ||
    slugPath === "revenue-categories" ||
    slugPath === "revenue-category-master"
  ) {
    return <RevenueCategoryMasterView />;
  }

  if (
    slugPath === "analysis" ||
    slugPath === "analysis/dashboard" ||
    slugPath === "financial-analysis"
  ) {
    return <FinancialAnalysisView />;
  }

  if (slugPath === "reports/trial-balance" || slugPath === "trial-balance") {
    return <TrialBalanceView />;
  }

  if (
    slugPath === "reports/profit-and-loss" ||
    slugPath === "reports/profit-loss" ||
    slugPath === "profit-and-loss" ||
    slugPath === "profit-loss"
  ) {
    return <ProfitLossView />;
  }

  if (slugPath === "reports/general-ledger" || slugPath === "general-ledger") {
    return <GeneralLedgerView />;
  }

  if (
    slugPath === "reports/balance-sheet" ||
    slugPath === "balance-sheet" ||
    slugPath === "balancesheet"
  ) {
    return <BalanceSheetView />;
  }

  if (
    slugPath === "reports/day-book" ||
    slugPath === "day-book" ||
    slugPath === "daybook"
  ) {
    return <DayBookView />;
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
