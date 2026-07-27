"use client";

import {
  InventoryWorkspaceStub,
  inventoryStubIcons,
} from "@/components/purchase-stores/InventoryWorkspaceStub";

export default function Page() {
  return (
    <InventoryWorkspaceStub
      title="Stock Issues"
      description="Issue materials from stores to departments."
      icon={inventoryStubIcons.issues}
    />
  );
}
