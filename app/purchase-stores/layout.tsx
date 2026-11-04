import { navItems, currentUser, purchaseStoresNavItems } from "@/app/data";
import { AppShell } from "@/components/layout/AppShell";
import { ModuleSidebar } from "@/components/layout/ModuleSidebar";
import { PurchaseStoresMobileBottomNav } from "@/components/purchase-stores/PurchaseStoresMobileBottomNav";
import { PurchaseStoresSubNav } from "@/components/purchase-stores/PurchaseStoresSubNav";

export default function PurchaseStoresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell
      navItems={navItems}
      user={currentUser}
      subNav={<PurchaseStoresSubNav />}
      moduleSidebar={
        <ModuleSidebar
          title="Purchase & Stores"
          subtitle="Materials & Procurement"
          items={purchaseStoresNavItems}
        />
      }
    >
      <div className="pb-16 md:pb-0">
        {children}
      </div>
      <PurchaseStoresMobileBottomNav />
    </AppShell>
  );
}
