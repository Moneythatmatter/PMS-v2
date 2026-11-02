import { navItems, currentUser, foodBeveragesNavItems } from "@/app/data";
import { AppShell } from "@/components/layout/AppShell";
import { ModuleSidebar } from "@/components/layout/ModuleSidebar";
import { FoodBeveragesSubNav } from "@/components/foodbeverages/FoodBeveragesSubNav";

export default function FoodBeveragesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell
      navItems={navItems}
      user={currentUser}
      subNav={<FoodBeveragesSubNav />}
      moduleSidebar={
        <ModuleSidebar
          title="Food & Beverages"
          subtitle="Restaurants, cafes & kitchen"
          items={foodBeveragesNavItems}
        />
      }
    >
      {children}
    </AppShell>
  );
}
