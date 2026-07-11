import { navItems, currentUser, foodBeveragesNavItems } from "@/app/data";
import { AppShell } from "@/components/layout/AppShell";
import { ModuleSidebar } from "@/components/layout/ModuleSidebar";

export default function FoodBeveragesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell
      navItems={navItems}
      user={currentUser}
      moduleSidebar={
        <ModuleSidebar
          title="Food & Beverages"
          subtitle="Restaurant & bar"
          items={foodBeveragesNavItems}
        />
      }
    >
      {children}
    </AppShell>
  );
}
