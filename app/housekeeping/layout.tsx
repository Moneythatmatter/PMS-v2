import { navItems, currentUser, housekeepingNavItems } from "@/app/data";
import { AppShell } from "@/components/layout/AppShell";
import { ModuleSidebar } from "@/components/layout/ModuleSidebar";
import { HousekeepingProvider } from "@/components/housekeeping/HousekeepingContext";
import { HousekeepingSubNav } from "@/components/housekeeping/HousekeepingSubNav";

export default function HousekeepingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HousekeepingProvider>
      <AppShell
        navItems={navItems}
        user={currentUser}
        subNav={<HousekeepingSubNav />}
        moduleSidebar={
          <ModuleSidebar
            title="Housekeeping"
            subtitle="Rooms & guest services"
            items={housekeepingNavItems}
          />
        }
      >
        {children}
      </AppShell>
    </HousekeepingProvider>
  );
}

