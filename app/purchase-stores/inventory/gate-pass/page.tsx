"use client";

import {
  InventoryWorkspaceStub,
  inventoryStubIcons,
} from "@/components/purchase-stores/InventoryWorkspaceStub";

export default function Page() {
  return (
    <InventoryWorkspaceStub
      title="Gate Pass"
      description="Track returnable and non-returnable material exits."
      icon={inventoryStubIcons.gatePass}
    />
  );
}
