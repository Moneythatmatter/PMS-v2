import { logAudit } from "../common/audit";
import type { HousekeepingDispatchers } from "../../HousekeepingActions";
import type { HKLaundryJob } from "../../HousekeepingTypes";
import { hkLaundryService } from "@/services/housekeeping";

export const settleLaundryJob = (
  id: string,
  paymentMode: string,
  currentLaundryJobs: HKLaundryJob[],
  dispatchers: HousekeepingDispatchers,
) => {
  const job = currentLaundryJobs.find((j) => j.id === id);
  if (!job) return;

  const billingStatus =
    /room\s*charge|folio/i.test(paymentMode) ? "Folio" : "Settled";

  dispatchers.setLaundryJobs((prev) =>
    prev.map((row) =>
      row.id === id
        ? {
            ...row,
            billingStatus,
            paymentMode,
          }
        : row,
    ),
  );

  logAudit(
    "Laundry",
    "Laundry Settled",
    `Laundry job #${id} settled via ${paymentMode} (${billingStatus}).`,
    job.room,
    dispatchers.currentUsername,
    dispatchers.setHistory,
  );

  void hkLaundryService
    .settle(id, {
      paymentMode,
      amount: Number(job.charges) || 0,
      bookingId: job.bookingId,
    })
    .then((updated) => {
      if (updated?.id) {
        dispatchers.setLaundryJobs((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...updated } : r)),
        );
      }
    })
    .catch((err) => {
      console.error("[HK] Failed to sync laundry settlement to API", err);
    });
};
