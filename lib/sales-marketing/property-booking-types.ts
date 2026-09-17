"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePropertyOptional } from "@/components/platform/PropertyProvider";
import {
  type BookingTypeCode,
  type BookingTypeDefinition,
  type BookingTypeIconKey,
} from "./booking-types";
import {
  mapBookingTypeFromApi,
  mapBookingTypeToApi,
} from "./api-mappers";
import { smBookingTypeService } from "@/services/sales-marketing";

export const BOOKING_TYPES_UPDATED_EVENT = "sm-booking-types-updated";

export interface CreateBookingTypeInput {
  name: string;
  description: string;
  beoRequired: boolean;
  handoverNote?: string;
  iconKey: BookingTypeIconKey;
}

export function usePropertyBookingTypes() {
  const propertyCtx = usePropertyOptional();
  const propertyId = propertyCtx?.property?.id ?? "default";
  const propertyName = propertyCtx?.property?.name ?? "This property";

  const [catalog, setCatalog] = useState<BookingTypeDefinition[]>([]);
  const [rowIdByCode, setRowIdByCode] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<Record<string, { enabled: boolean; sortOrder: number }>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!propertyCtx?.property?.id) {
      setCatalog([]);
      setSettings({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const rows = await smBookingTypeService.list();
      const mapped = rows.map(mapBookingTypeFromApi);
      setCatalog(mapped);
      setRowIdByCode(
        Object.fromEntries(rows.map((row) => [String(row.code), String(row.id)])),
      );
      setSettings(
        Object.fromEntries(
          rows.map((row) => [
            String(row.code),
            {
              enabled: row.enabled !== false,
              sortOrder: Number(row.sortOrder ?? 1),
            },
          ]),
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load booking types");
      setCatalog([]);
      setSettings({});
    } finally {
      setLoading(false);
    }
  }, [propertyCtx?.property?.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const onUpdated = () => void reload();
    window.addEventListener(BOOKING_TYPES_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(BOOKING_TYPES_UPDATED_EVENT, onUpdated);
  }, [reload]);

  const sortedCatalog = useMemo(
    () =>
      [...catalog].sort(
        (a, b) =>
          (settings[a.code]?.sortOrder ?? a.defaultSortOrder) -
          (settings[b.code]?.sortOrder ?? b.defaultSortOrder),
      ),
    [catalog, settings],
  );

  const enabledTypes = useMemo(
    () => sortedCatalog.filter((item) => settings[item.code]?.enabled !== false),
    [sortedCatalog, settings],
  );

  const notifyUpdated = () => {
    window.dispatchEvent(new Event(BOOKING_TYPES_UPDATED_EVENT));
  };

  const setEnabled = useCallback(
    async (code: BookingTypeCode, enabled: boolean) => {
      const id = rowIdByCode[code];
      if (!id) return;
      await smBookingTypeService.update(id, { enabled });
      setSettings((prev) => ({
        ...prev,
        [code]: { ...prev[code], enabled },
      }));
      notifyUpdated();
    },
    [rowIdByCode],
  );

  const resetToDefaults = useCallback(async () => {
    await smBookingTypeService.ensureSystem();
    const rows = await smBookingTypeService.list();
    for (const row of rows) {
      if (row.id) {
        await smBookingTypeService.update(String(row.id), { enabled: true });
      }
    }
    await reload();
    notifyUpdated();
  }, [reload]);

  const createBookingType = useCallback(
    async (input: CreateBookingTypeInput) => {
      const cleanName = input.name.trim();
      if (!cleanName) throw new Error("Booking type name is required.");

      const duplicate = catalog.some(
        (item) => item.cardLabel.toLowerCase() === cleanName.toLowerCase(),
      );
      if (duplicate) throw new Error("A booking type with this name already exists.");

      const maxSortOrder = catalog.reduce(
        (max, item) => Math.max(max, settings[item.code]?.sortOrder ?? item.defaultSortOrder),
        0,
      );

      const payload = mapBookingTypeToApi({
        code: `CUSTOM-${Date.now()}` as BookingTypeCode,
        cardLabel: cleanName,
        shortLabel: cleanName,
        centralType: cleanName,
        leadType: cleanName,
        description: input.description,
        beoRequired: input.beoRequired,
        handoverNote: input.handoverNote,
        iconKey: input.iconKey,
        defaultSortOrder: maxSortOrder + 1,
        isSystem: false,
        enabled: true,
      });

      const created = await smBookingTypeService.create(payload);
      await reload();
      notifyUpdated();
      return mapBookingTypeFromApi(created);
    },
    [catalog, settings, reload],
  );

  const deleteCustomBookingType = useCallback(
    async (code: BookingTypeCode) => {
      const id = rowIdByCode[code];
      if (!id) return;
      await smBookingTypeService.remove(id);
      await reload();
      notifyUpdated();
    },
    [rowIdByCode, reload],
  );

  return {
    propertyId,
    propertyName,
    loading,
    error,
    settings,
    customTypes: catalog.filter((item) => !item.isSystem),
    fullCatalog: sortedCatalog,
    sortedCatalog,
    enabledTypes,
    enabledCount: enabledTypes.length,
    totalCount: catalog.length,
    systemCount: catalog.filter((item) => item.isSystem).length,
    customCount: catalog.filter((item) => !item.isSystem).length,
    setEnabled,
    resetToDefaults,
    isEnabled: (code: BookingTypeCode) => settings[code]?.enabled !== false,
    createBookingType,
    deleteCustomBookingType,
    reload,
  };
}
