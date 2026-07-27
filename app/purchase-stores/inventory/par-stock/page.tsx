"use client";

import {
  InventoryWorkspaceStub,
  inventoryStubIcons,
} from "@/components/purchase-stores/InventoryWorkspaceStub";

export default function Page() {
  return (
    <InventoryWorkspaceStub
      title="Par Stock"
      description="Maintain minimum stock levels by item and store."
      icon={inventoryStubIcons.parStock}
    />
  );
}
