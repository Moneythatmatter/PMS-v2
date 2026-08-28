import { api, psPath } from "../api";
import type { UnitItem, CategoryItem, SupplierItem } from "@/app/data/purchaseStoresMastersData";
import type { ProductItem } from "@/app/data/productMasterData";
import type { WarehouseMasterItem } from "@/app/data/warehouseMasterData";
import type { PurchaseRequisition } from "@/app/data/purchaseRequisitionsData";
import type { RFQRecord } from "@/app/data/rfqData";
import type { PORecord } from "@/app/data/purchaseOrdersData";
import type { DSPRecord } from "@/app/data/dspData";
import type { ContractRecord } from "@/app/data/contractsData";
import type { InvoiceRecord } from "@/app/data/invoiceVerificationData";
import type { GRNRecord } from "@/app/data/grnData";
import type { QualityInspectionRecord } from "@/app/data/qualityInspectionData";
import type { VendorReturnRecord } from "@/app/data/vendorReturnsData";
import type { StockBalanceRecord } from "@/app/data/stockBalanceData";
import type { StockLedgerRecord } from "@/app/data/stockLedgerData";
import type { StockIssueRecord } from "@/app/data/stockIssuesData";
import type { StockTransferRecord } from "@/app/data/stockTransfersData";
import type { StockAdjustmentRecord } from "@/app/data/stockAdjustmentsData";
import type { ParStockRecord } from "@/app/data/parStockData";
import type { BatchRecord } from "@/app/data/batchData";

function crud<T>(base: string) {
  return {
    list: (query = "") => api.get<T[]>(psPath(`${base}${query}`)),
    get: (id: string) => api.get<T>(psPath(`${base}/${id}`)),
    create: (body: Partial<T>) => api.post<T>(psPath(base), body),
    update: (id: string, body: Partial<T>) => api.put<T>(psPath(`${base}/${id}`), body),
    remove: (id: string) => api.delete<{ id: string }>(psPath(`${base}/${id}`)),
  };
}

export type PsDashboardData = {
  counts: Record<string, number>;
  recentRequisitions: PurchaseRequisition[];
  recentDsp: DSPRecord[];
  lowStockItems: ProductItem[];
  stockPreview: ProductItem[];
};

export const psDashboardService = {
  get: () => api.get<PsDashboardData>(psPath("/dashboard")),
};

export const psUnitService = crud<UnitItem>("/masters/units");
export const psCategoryService = crud<CategoryItem>("/masters/categories");
export const psSupplierService = crud<SupplierItem>("/masters/suppliers");
export const psProductService = crud<ProductItem>("/masters/products");
export const psWarehouseService = crud<WarehouseMasterItem>("/warehouses");

export const psRequisitionService = crud<PurchaseRequisition>("/requisitions");
export const psRfqService = crud<RFQRecord>("/rfqs");
export const psPurchaseOrderService = crud<PORecord>("/purchase-orders");
export const psDspService = crud<DSPRecord>("/direct-purchases");
export const psContractService = crud<ContractRecord>("/contracts");
export const psInvoiceService = crud<InvoiceRecord>("/invoices");

export const psGrnService = {
  ...crud<GRNRecord>("/grns"),
  listByPo: (poNumber: string) =>
    api.get<GRNRecord[]>(psPath(`/grns/by-po/${encodeURIComponent(poNumber)}`)),
};

export const psQualityInspectionService = crud<QualityInspectionRecord>("/quality-inspections");
export const psVendorReturnService = crud<VendorReturnRecord>("/vendor-returns");

export const psStockBalanceService = crud<StockBalanceRecord>("/stock-balances");
export const psStockLedgerService = {
  ...crud<StockLedgerRecord>("/stock-ledger"),
  listFiltered: (materialId?: string, warehouseId?: string) => {
    const params = new URLSearchParams();
    if (materialId) params.set("materialId", materialId);
    if (warehouseId) params.set("warehouseId", warehouseId);
    const q = params.toString();
    return api.get<StockLedgerRecord[]>(psPath(`/stock-ledger${q ? `?${q}` : ""}`));
  },
};
export const psStockIssueService = crud<StockIssueRecord>("/stock-issues");
export const psStockTransferService = crud<StockTransferRecord>("/stock-transfers");
export const psStockAdjustmentService = crud<StockAdjustmentRecord>("/stock-adjustments");
export const psParStockService = crud<ParStockRecord>("/par-stock");
export const psBatchService = crud<BatchRecord>("/batches");
