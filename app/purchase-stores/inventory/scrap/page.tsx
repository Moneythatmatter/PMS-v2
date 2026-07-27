"use client";

import {
  InventoryWorkspaceStub,
  inventoryStubIcons,
} from "@/components/purchase-stores/InventoryWorkspaceStub";

export default function Page() {
  return (
    <InventoryWorkspaceStub
      title="Scrap & Write-Offs"
      description="Record damaged, expired, or written-off stock."
      icon={inventoryStubIcons.scrap}
    />
  );
}
