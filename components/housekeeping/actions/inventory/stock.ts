import { logAudit } from "../common/audit";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";
import type { HKInventoryItem, HKDamageReport } from "../../HousekeepingTypes";
import { hkDamageService } from "@/services/housekeeping";
import {
  normalizeDamageReport,
  resolveDamageReportApiId,
  toDamageReportCreatePayload,
  uiStatusToApi,
  type DamageReportCreateInput,
} from "../../damageReportUtils";

export const discardLinenItem = (itemId: string, qty: number, currentInventory: HKInventoryItem[], dispatchers: HousekeepingDispatchers) => {
  dispatchers.setInventory((prev) =>
    prev.map((item) => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        available: Math.max(0, item.available - qty),
        discarded: item.discarded + qty,
      };
    })
  );
  const item = currentInventory.find((i) => i.id === itemId);
  logAudit("Inventory", "Linen Discarded", `Discarded ${qty}x ${item?.name} due to wear and tear.`, undefined, dispatchers.currentUsername, dispatchers.setHistory);
};

export const addDamageReport = (
  report: DamageReportCreateInput,
  dispatchers: HousekeepingDispatchers,
) => {
  const payload = toDamageReportCreatePayload(report);
  const optimistic: HKDamageReport = {
    id: `DM-pending-${Date.now()}`,
    room: report.room,
    damageType: report.damageType,
    severity: report.severity,
    responsibility: report.responsibility,
    description: report.description,
    reportedBy: dispatchers.currentUsername,
    reportedAt: new Date().toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
    estimatedCost: report.estimatedCost,
    status: "Reported",
    assetId: report.assetId,
    notes: report.notes,
  };

  dispatchers.setDamageReports((prev) => [optimistic, ...prev]);

  void hkDamageService
    .create({
      ...payload,
      reportedBy: dispatchers.currentUsername,
    })
    .then((row) => {
      const record = normalizeDamageReport(row);
      dispatchers.setDamageReports((prev) =>
        prev.map((r) => (r.id === optimistic.id ? record : r)),
      );
    })
    .catch((err) => {
      console.error("[HK] Failed to sync damage report to API", err);
      dispatchers.setDamageReports((prev) =>
        prev.filter((r) => r.id !== optimistic.id),
      );
    });

  logAudit(
    "Room Status",
    "Damage Reported",
    `Reported ${report.damageType} damage in Room ${report.room}. Cost estimate: INR ${report.estimatedCost}.`,
    report.room,
    dispatchers.currentUsername,
    dispatchers.setHistory,
  );
};

export const updateDamageStatus = (
  id: string,
  status: string,
  currentDamageReports: HKDamageReport[],
  dispatchers: HousekeepingDispatchers,
  actualCost?: number,
) => {
  const report = currentDamageReports.find((r) => r.id === id);
  const apiId = report ? resolveDamageReportApiId(report) : id;

  dispatchers.setDamageReports((prev) =>
    prev.map((r) =>
      r.id === id
        ? {
            ...r,
            status,
            actualCost: actualCost ?? r.actualCost,
            resolvedAt:
              status === "Closed" || status === "Repaired"
                ? new Date().toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })
                : r.resolvedAt,
          }
        : r,
    ),
  );

  logAudit(
    "Room Status",
    "Damage Status",
    `Damage report #${id} in Room ${report?.room} status set to ${status}.`,
    report?.room,
    dispatchers.currentUsername,
    dispatchers.setHistory,
  );

  const isClosed = ["Closed", "Repaired", "Recovered", "Cancelled"].includes(
    status,
  );

  void (isClosed
    ? hkDamageService.resolve(apiId, {
        status: uiStatusToApi(status),
        actualCost: actualCost ?? report?.estimatedCost,
      })
    : hkDamageService.update(apiId, { status: uiStatusToApi(status) })
  )
    .then((row) => {
      const record = normalizeDamageReport(row);
      dispatchers.setDamageReports((prev) =>
        prev.map((r) => (r.id === id ? record : r)),
      );
    })
    .catch((err) => {
      console.error("[HK] Failed to sync damage report status to API", err);
    });
};
