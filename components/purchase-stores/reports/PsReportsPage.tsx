"use client";

import { useSearchParams } from "next/navigation";
import { PS_DEFAULT_REPORT } from "@/components/purchase-stores/reports/PsReportView";
import IssuesReport from "@/components/purchase-stores/reports/views/IssuesReport";
import OrdersReport from "@/components/purchase-stores/reports/views/OrdersReport";
import ParStockReport from "@/components/purchase-stores/reports/views/ParStockReport";
import PurchasesReport from "@/components/purchase-stores/reports/views/PurchasesReport";
import ReturnsReport from "@/components/purchase-stores/reports/views/ReturnsReport";
import SpoilageReport from "@/components/purchase-stores/reports/views/SpoilageReport";
import StockRegisterReport from "@/components/purchase-stores/reports/views/StockRegisterReport";

const REPORT_VIEWS: Record<string, () => React.ReactElement> = {
  "stock-register": StockRegisterReport,
  "par-stock": ParStockReport,
  spoilage: SpoilageReport,
  issues: IssuesReport,
  purchases: PurchasesReport,
  orders: OrdersReport,
  returns: ReturnsReport,
};

/** Single Reports page; the selected report lives in `?type=`. */
export function PsReportsPage() {
  const requested = useSearchParams().get("type") ?? PS_DEFAULT_REPORT;
  const type = requested in REPORT_VIEWS ? requested : PS_DEFAULT_REPORT;
  const View = REPORT_VIEWS[type];
  return <View key={type} />;
}
