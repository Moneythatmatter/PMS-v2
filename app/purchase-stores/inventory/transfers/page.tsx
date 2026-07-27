"use client";

import {
  InventoryWorkspaceStub,
  inventoryStubIcons,
} from "@/components/purchase-stores/InventoryWorkspaceStub";

export default function Page() {
  return (
    <InventoryWorkspaceStub
      title="Transfers"
      description="Move stock between warehouses and stores."
      icon={inventoryStubIcons.transfers}
    />
  );
}
